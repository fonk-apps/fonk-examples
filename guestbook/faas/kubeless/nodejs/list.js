'use strict';

const _ = require('lodash');
const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
const url = 'mongodb://fonkdb-mongodb.default:27017/guestbook_app';

module.exports = {
  list: (event, context) => new Promise((resolve, reject) => {
    MongoClient.connect(url, (err, db) => {
      if (err) {
        reject(err);
      } else {
        db.collection('entries').find().toArray((ferr, docEntries) => {
          if (ferr) {
            reject(ferr);
          } else {
            db.close();
            var data = {};
            data.entries = docEntries;
            resolve(data);
          }
        });
      }
    });
  }),
};
