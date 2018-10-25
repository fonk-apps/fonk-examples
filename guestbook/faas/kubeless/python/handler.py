import pymongo
import json
import time

from bson.json_util import dumps as bdumps
from bson.objectid import ObjectId
import bottle

MONGODB_HOST = "fonkdb-mongodb.default"
MONGODB_PORT = 27017
MONGODB_NAME = "guestbook_app"
MONGODB_COLLECTION = "entries"


def create(event, context):
    """
    create the entries of the guestbook
    event[data] holds already json dumped dictionary so we can call directly. 
    """    
    if event['data']:
        try:
            client = pymongo.MongoClient("mongodb://{}".format(MONGODB_HOST), int(MONGODB_PORT))
            collection = client[MONGODB_NAME][MONGODB_COLLECTION]
            data = {"text": event['data']['text'],
                    "_id": str(ObjectId()),
                    "updatedAt" : int(round(time.time() * 1000))}
            id = collection.insert_one(data)
            return json.dumps(data)
        except Exception as err:
            return str(err)
    else:
        return json.dumps({"message" : "No content"})
            
def list(event, context):
    """
    List the entries in the guestbook. 
    """
    try:
        client = pymongo.MongoClient("mongodb://{}".format(MONGODB_HOST), int(MONGODB_PORT))
        collection = client[MONGODB_NAME][MONGODB_COLLECTION]
        entries = [x for x in collection.find({})]
        result = bdumps({"entries": entries})
        return result
    except pymongo.errors.PyMongoError as err:
        return resp(json.dumps({"error": "MongoDB error : " + str(err)}), 500)
    except Exception as err:
        return resp(json.dumps({"error": str(err)}), 500)
