'use strict';

var MongoClient = require('mongodb').MongoClient;

function create(params) {
  var url = 'mongodb://' + params.mongoHost + '/guestbook_app';
  return new Promise((resolve, reject) => {
      var data = {};
      data.text = params.text;
      data.updatedAt = new Date().getTime();
      MongoClient.connect(url, (cerr, db) => {
        if (cerr) {
          reject(cerr);
        } else {
          db.collection('entries').insertOne(data, (errInsert) => {
            if (errInsert) {
              reject(errInsert);
            } else {
             resolve(data);
              db.close();
            }
          });
        }
      });
    });
}

module.exports.main = create;
