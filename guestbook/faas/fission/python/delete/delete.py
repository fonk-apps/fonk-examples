import pymongo
import json

from flask import request, Flask, Response

MONGODB_HOST = "fonkdb-mongodb.default"
MONGODB_PORT = 27017
MONGODB_NAME = "guestbook_app"
MONGODB_COLLECTION = "entries"

def main():
    try:
        client = pymongo.MongoClient("mongodb://{}".format(MONGODB_HOST), int(MONGODB_PORT))
        collection = client[MONGODB_NAME][MONGODB_COLLECTION]
        result = collection.remove({})
        return response(json.dumps(result,indent=2), 200)
    except pymongo.errors.PyMongoError as err:
        return response({"error": "MongoDB error: " + str(err)}, 500)
    except Exception as err:
        return response({"error": str(err)}, 500)

def response(body, status):
    return Response(str(body), status, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"})
