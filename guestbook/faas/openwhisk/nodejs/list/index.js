'use strict';

var MongoClient = require('mongodb').MongoClient;

function list(params) {
  return new Promise((resolve, reject) => {
    var url = 'mongodb://' + params.mongoHost + '/guestbook_app';
    MongoClient.connect(url, (err, db) => {
      if (err) {
        reject(err);
      } else {
        db.collection('entries').find().toArray((ferr, docEntries) => {
          if (ferr) {
            reject(ferr);
          } else {
            var data = {};
            data.entries = docEntries;
            resolve(data);
            db.close();
          }
        });
      }
    });
  });
}

module.exports.main = list;
