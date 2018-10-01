'use strict'

const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
const url = 'mongodb://fonkdb-mongodb.default:27017/guestbook_app';

module.exports = (event, context) => {
    var data = {};

    // First, see if we have an OPTIONS call
    if (event.method == 'OPTIONS') {
      context
          .status(200)
          .headers({ 'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With' })
          .succeed(data);
    } else {
      // Nope, it's a POST, continue processing
      data.updatedAt = new Date().getTime();
      if (typeof event.body == 'string') // String or obj request body?
        data.text = JSON.parse(event.body).text; // Command line sends text
      else
        data.text = event.body.text; // API gateway sends obj
      console.log('Attempting pass: ' + data.text);

      var createPromise = new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, db) => {
          if (err) {
            reject(err);
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
      createPromise
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
    }
  };
