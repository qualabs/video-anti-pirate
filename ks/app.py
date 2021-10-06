from flask import Flask, Response, make_response, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
import base64
import json
import os
import sys
import time

import boto3
import jwt

from proxy_exceptions import BannedException, InvalidRequestException, ProxyException

JWT_SECRET = os.getenv("JWT_SECRET")

JWT_VALIDITY = int(os.getenv("JWT_VALIDITY", 4 * 60 * 60))

TABLE = os.getenv("KEY_TABLE", "wm-keys")
TABLE_CONTROL = os.getenv("CONTROL_TABLE", "wm-control")
LAMBDA_NAME = os.getenv("LAMBDA_NAME", "ks-dev")
REGION = os.getenv("REGION", "us-east-1")

dynamo = boto3.client("dynamodb")
cw = boto3.client("cloudwatch")

# region Logging setup
import logging


class RequestFormatter(logging.Formatter):
    def format(self, record):
        record.url = request.url
        record.remote_addr = request.headers.get("X-Real-IP", request.remote_addr)
        return super(RequestFormatter, self).format(record)


logger = logging.getLogger("default")
logger.setLevel(logging.INFO)

ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.INFO)
formatter = RequestFormatter(
    "%(asctime)s | %(levelname)s | %(funcName)s | %(remote_addr)s | %(url)s | %(message)s"
)
ch.setFormatter(formatter)
logger.addHandler(ch)
# endregion Logging setup


@app.errorhandler(ProxyException)
def handle_invalid_usage(error):
    return make_response((error.message, error.status_code))


@app.route("/", methods=["GET", "POST"])
def index():
    return "Watermarking by www.qualabs.com"


def getItem(itemlist, key):
    try:
        return list(filter(lambda x: x["sessionId"]["S"] == key, itemlist))[0]
    except IndexError:
        return None


# region License request handlers
def common_checks():
    token = request.args.get("token")
    ip = request.headers.get("X-Real-IP", request.remote_addr)

    user_info = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    resourceId = user_info["resourceId"]
    sessionId = user_info["sessionId"]
    createdAt = user_info["createdAt"]
    userIP = user_info["userIP"]

    # Verify if the request is coming from the IP the token was granted to
    if ip and ip != userIP:
        raise InvalidRequestException()

    # Is the JWT still valid?
    if createdAt + JWT_VALIDITY < time.time():
        raise InvalidRequestException()

    # Lookup for banned users, by sessionId or IP
    items = dynamo.batch_get_item(
        RequestItems={
            TABLE_CONTROL: {
                "Keys": [
                    {"sessionId": {"S": "control"}},
                    {"sessionId": {"S": sessionId}},
                    {"sessionId": {"S": userIP}},
                ]
            }
        }
    )

    itemlist = items["Responses"][TABLE_CONTROL]

    session = getItem(itemlist, sessionId)
    if session:
        # Verify if we have this session's IP stored. If we don't, store it so that an operator may decide to ban it.
        try:
            session["userIP"]["S"]
        except:
            dynamo.put_item(
                TableName=TABLE_CONTROL,
                Item={
                    "sessionId": {"S": session["sessionId"]["S"]},
                    "userIP": {"S": userIP},
                },
            )
        raise BannedException()

    if getItem(itemlist, userIP):
        raise BannedException()

    control = getItem(itemlist, "control")
    if control is None:
        # We need to initialize the control item.
        control = {
            "sessionId": {"S": "control"},
            "watermarking": {"BOOL": False},
            "wmOptions": {"S": json.dumps({type: "id"})},
        }
        dynamo.put_item(
            TableName=TABLE_CONTROL,
            Item=control,
        )

    watermarking = control["watermarking"]["BOOL"]
    watermarking_options = None
    if "wmOptions" in control:
        watermarking_options = json.loads(control["wmOptions"]["S"])
    return resourceId, sessionId, watermarking, watermarking_options


def create_response(session_id=None, watermarking=None, lic=None, wm_options=None):
    response = {}

    if session_id is not None:
        response["sessionId"] = session_id
    if watermarking is not None:
        response["watermarking"] = watermarking
    if lic is not None:
        response["license"] = lic
    if wm_options is not None:
        response["wmOptions"] = wm_options

    return json.dumps(response)


@app.route("/np/", methods=["POST"])
def no_protection():
    resourceId, sessionId, watermarking, wm_options = common_checks()
    return create_response(sessionId, watermarking, "", wm_options)


@app.route("/ck/", methods=["POST"])
def clearkey():
    resourceId, sessionId, watermarking, wm_options = common_checks()

    lic_req = json.loads(request.get_data())

    orig_kid = lic_req["kids"][0]

    kid = base64.urlsafe_b64decode(orig_kid + "==").hex()
    kid = "{}-{}-{}-{}-{}".format(kid[0:8], kid[8:12], kid[12:16], kid[16:20], kid[20:])

    item = dynamo.get_item(
        TableName=TABLE,
        Key={"content_id": {"S": resourceId}, "kid": {"S": kid}},
    )

    key = item["Item"]["key"]["S"]

    license = json.dumps(
        {
            "keys": [
                {
                    "kty": "oct",
                    "k": base64.urlsafe_b64encode(base64.b64decode(key)).decode(
                        "ascii"
                    )[:-2],
                    "kid": orig_kid,
                }
            ],
            "type": "temporary",
        }
    ).encode("ascii")

    return create_response(
        sessionId, watermarking, base64.b64encode(license).decode("ascii"), wm_options
    )


# endregion License request handlers


# region Management endpoints
@app.route("/config/", methods=["POST"])
def config():
    token = request.get_data()
    cfg = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

    options = json.dumps(cfg["wmOptions"])

    dynamo.put_item(
        TableName=TABLE_CONTROL,
        Item={
            "sessionId": {"S": "control"},
            "watermarking": {"BOOL": cfg["watermarking"]},
            "wmOptions": {"S": options},
        },
    )
    return "OK"


@app.route("/ban/", methods=["POST"])
def ban():
    token = request.get_data()
    cfg = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

    if cfg["ban"]:
        dynamo.put_item(
            TableName=TABLE_CONTROL, Item={"sessionId": {"S": cfg["sessionId"]}}
        )
    else:
        dynamo.delete_item(
            TableName=TABLE_CONTROL, Key={"sessionId": {"S": cfg["sessionId"]}}
        )
    return "OK"


@app.route("/get/", methods=["POST"])
def getControl():
    token = request.get_data()
    cfg = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

    itemlist = dynamo.scan(TableName=TABLE_CONTROL)["Items"]
    control = getItem(itemlist, "control")
    watermarking = control["watermarking"]["BOOL"]

    banned = list(filter(lambda x: x["sessionId"]["S"] != "control", itemlist))
    if "wmOptions" in control:
        wmOptions = json.loads(control["wmOptions"]["S"])
        return json.dumps(
            {"watermarking": watermarking, "banned": banned, "wmOptions": wmOptions}
        )
    return json.dumps({"watermarking": watermarking, "banned": banned})


@app.route("/graph/", methods=["GET"])
def graph():
    token = request.args.get("token")
    cfg = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

    r = cw.get_metric_widget_image(
        OutputFormat="png",
        MetricWidget=json.dumps(
            {
                "metrics": [["AWS/Lambda", "Invocations", "FunctionName", LAMBDA_NAME]],
                "view": "timeSeries",
                "stacked": False,
                "region": REGION,
                "stat": "Sum",
                "period": 60,
                "width": 1000,
                "height": 400,
                "yAxis": {
                    "left": {
                        "label": "License requests per minute",
                        "min": 0,
                        "showUnits": True,
                    }
                },
            }
        ),
    )
    return Response(r["MetricWidgetImage"], mimetype="image/png")


# endregion Management endpoints
