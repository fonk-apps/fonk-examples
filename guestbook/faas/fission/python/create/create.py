import pymongo
import json
import time

from flask import request, Flask, Response
from bson.objectid import ObjectId

MONGODB_HOST = "fonkdb-mongodb.default"
MONGODB_PORT = 27017
MONGODB_NAME = "guestbook_app"
MONGODB_COLLECTION = "entries"

def main():
    # First, return if this is a preflight OPTIONS call
    if request.method == "OPTIONS":
        return Response("Allow: POST,OPTIONS", 200, {"Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Origin": "*"})
    # No OPTIONS, assume POST and continue
    if request.data:
        if request.get_data():
            try:
                client = pymongo.MongoClient("mongodb://{}".format(MONGODB_HOST), int(MONGODB_PORT))
                collection = client[MONGODB_NAME][MONGODB_COLLECTION]
                request_data = json.loads(request.get_data(as_text=True))
                data = {"text": request_data["text"],
                        "_id": str(ObjectId()),
                        "updatedAt": int(round(time.time() * 1000))}
                id = collection.insert_one(data)
                return response(json.dumps(data,indent=2), 200)
            except Exception as err:
                return response({"error": "Error: " + str(err)}, 500)
        else:
            return response({"message": "No content"}, 204)
    else:
        return None

def response(body, status):
    return Response(str(body), status, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"})
