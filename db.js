var MongoClient = require('mongodb').MongoClient

var MONGO_URL = 'mongodb://34.212.180.248' //process.env.MONGODB_URI;

var state = {
  db: null,
};

exports.connect = function(done) {
  if (state.db) return done();

  MongoClient.connect(MONGO_URL, function(err, db) {
    if (err) return done(err);
    console.log('Database connection open...');
    db.createCollection('matches');
    db.createCollection('stats');
    state.db = db;
    done();
  });
};

exports.get = function() {
  return state.db;
};

exports.close = function(done) {
  if (state.db) {
    state.db.close(function(err, result) {
      state.db = null;
      state.mode = null;
      done(err);
    });
  }
};
