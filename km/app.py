import base64
import os
import secrets
import time
import xml.etree.ElementTree as ET

import boto3
from flask import Flask, request

import psshgen

TABLE = os.getenv("KEY_TABLE")
CLEARKEY_SYSTEM_ID = "1077efec-c0b2-4d02-ace3-3c1e52e2fb4b"

app = Flask(__name__)

dynamo = boto3.client("dynamodb")


@app.route("/", methods=["POST"])
def process_speke():
    """Processes an incoming request from MediaLive, which is using SPEKE
    A key is created and stored in DynamoDB."""

    input_request = request.get_data()

    # Parse request
    tree = ET.fromstring(input_request)

    content_id = tree.get("id")

    kid = tree[0][0].get("kid")
    iv = tree[0][0].get("explicitIV") or ""

    keyPeriod = tree[2][0].get("id")
    index = tree[2][0].get("index")

    # Create key
    key = base64.b64encode(secrets.token_bytes(16)).decode("ascii")

    # Expire key tomorrow
    expiry = round(time.time()) + 24 * 60 * 60

    # Create the pssh
    systems = []
    for drmsystem in tree[1]:
        if drmsystem.get("systemId") == CLEARKEY_SYSTEM_ID:
            pssh = psshgen.genClearkeyPssh([kid])
            systems.append(
                f"""<!-- ClearKey -->
            <cpix:DRMSystem kid="{kid}" systemId="{CLEARKEY_SYSTEM_ID}">
                <cpix:PSSH>{pssh}</cpix:PSSH>
            </cpix:DRMSystem>"""
            )

    # Save key info in dynamo
    dynamo.put_item(
        TableName=TABLE,
        Item={
            "content_id": {"S": content_id},
            "kid": {"S": kid},
            "iv": {"S": iv},
            "keyPeriod": {"S": keyPeriod},
            "index": {"S": index},
            "key": {"S": key},
            "expiry": {"N": str(expiry)},
        },
    )

    if iv:
        iv = f'explicitIV="{iv}"'

    # Craft response
    response = f"""<cpix:CPIX xmlns:cpix="urn:dashif:org:cpix" xmlns:pskc="urn:ietf:params:xml:ns:keyprov:pskc" xmlns:speke="urn:aws:amazon:com:speke" id="{content_id}">
        <cpix:ContentKeyList>
            <cpix:ContentKey {iv} kid="{kid}">
                <cpix:Data>
                    <pskc:Secret>
                        <pskc:PlainValue>{key}</pskc:PlainValue>
                    </pskc:Secret>
                </cpix:Data>
            </cpix:ContentKey>
        </cpix:ContentKeyList>
        <cpix:DRMSystemList>		
            {''.join(systems)}
        </cpix:DRMSystemList>
        <cpix:ContentKeyPeriodList>
            <cpix:ContentKeyPeriod id="{keyPeriod}" index="{index}" />
        </cpix:ContentKeyPeriodList>
        <cpix:ContentKeyUsageRuleList>
            <cpix:ContentKeyUsageRule kid="{kid}">
                <cpix:KeyPeriodFilter periodId="{keyPeriod}" />
            </cpix:ContentKeyUsageRule>
        </cpix:ContentKeyUsageRuleList>
    </cpix:CPIX>"""

    return response
