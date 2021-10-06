from flask import Flask, request
app = Flask(__name__)

import requests
import time
import os
import jwt

JWT_SECRET = os.getenv("JWT_SECRET")
KS_SERVER = os.getenv("KS_SERVER")

@app.route("/<resourceId>/<sessionId>")
def main(resourceId, sessionId):
    j = jwt.encode({
            "sessionId": sessionId,
            "resourceId": resourceId,
            "createdAt": round(time.time()),
            "userIP": request.remote_addr
        }, JWT_SECRET)

    drm = f"<html>{KS_SERVER} <p>{j}</p></html>"
    return drm

@app.route('/config/<value>', methods=['GET'])
def config(value):
    if value == "1":
        value = True
    else:
        value = False
    j = jwt.encode({"watermarking": value}, JWT_SECRET)
    requests.post(KS_SERVER + "/config/", j)
    return "OK"


@app.route('/ban/<sessionId>', methods=['GET'])
def ban(sessionId):
    j = jwt.encode({"sessionId": sessionId, "ban": True}, JWT_SECRET)
    requests.post(KS_SERVER + "/ban/", j)
    return "OK"
