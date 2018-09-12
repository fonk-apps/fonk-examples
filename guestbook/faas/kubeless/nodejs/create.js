'use strict';

const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
const url = 'mongodb://fonkdb-mongodb.default:27017/guestbook_app';

module.exports = {
  create: (event, context) => new Promise((resolve, reject) => {
      const data = event.data;
      data.updatedAt = new Date().getTime();
      MongoClient.connect(url, (cerr, db) => {
        if (cerr) {
          reject(cerr);
        } else {
          db.collection('entries').insertOne(data, (errInsert) => {
            if (errInsert) {
              reject(errInsert);
            } else {
              resolve(JSON.stringify(data));
              db.close();
            }
          });
        }
      });
    }),
};
