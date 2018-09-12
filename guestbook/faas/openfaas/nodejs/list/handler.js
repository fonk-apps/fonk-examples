'use strict'

const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
const url = 'mongodb://fonkdb-mongodb.default:27017/guestbook_app';

module.exports = (event, context) => {

    var data = {};
    var listPromise = new Promise((resolve, reject) => {
      MongoClient.connect(url, (err, db) => {
        if (err) {
          reject(err);
        } else {
          db.collection('entries').find().toArray((ferr, docEntries) => {
            if (ferr) {
              reject(ferr);
            } else {
              db.close();
              data.entries = docEntries;
              resolve(data);
            }
          });
        }
      });
    });
    listPromise
     .then(function (fulfilled) {
        context
            .status(200)
            .headers({ 'Access-Control-Allow-Origin': '*' })
            .succeed(data);
      })
     .catch(function (error) {
        context
            .status(500)
            .headers({ 'Access-Control-Allow-Origin': '*' })
            .succeed(data);
      });
  };
