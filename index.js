var express = require('express');
var app = express();
var fetch = require('node-fetch');
var sleep = require('sleep');
var Queue = require('promise-queue');

var queue = new Queue(1, 1000);
var compression = require('compression');

app.use(compression());

// Retrieve
var db = require('./db');
var stats = require('./stats');
var api = require('./api/riot');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

app.get('/stats_write/:name', function(request, response) {
  var name = request.params.name;
  console.log("Writing stats for",name);
  db.get().createCollection('stats');
  var statsCollection = db.get().collection('stats');
  var collection = db.get().collection('matches');
  collection.find({
      'participantIdentities.player.summonerName': {$eq: name}
    }).toArray(function(err, items) {
      metrics = stats.computeStats(name, items);
      statsCollection.update(
        { summonerName_lower: { $eq: name.toLocaleLowerCase() } },
        {
          'summonerName': name,
          'summonerName_lower': name.toLocaleLowerCase(),
          'metrics': metrics,
        },
        { upsert: true });
      response.send(metrics);
  });
});

app.get('/stats/:name', function(request, response) {
  response.setHeader('Cache-Control', 'no-cache')
  var name = request.params.name.toLocaleLowerCase();
  var statsCollection = db.get().collection('stats');
  statsCollection.find({'summonerName_lower': {$eq: name}})
  .toArray(function(err, items) {
    if (items.length != 1) {
      response.send(400);
    }
    delete items[0]._id; // Don't serve MongoDB internal id
    response.send(items[0]);
  });
});

function grabIt(matchId) {
  matches = db.get().collection('matches');
  matches.find({gameId: {$eq: matchId}}).toArray(function(err, items) {
    if (items.length == 0) {
      console.log("Qing", matchId);
      queue.add(function() {
        console.log("Fetching", matchId, queue.getQueueLength(), "remain");        
        return Promise.all([api.getMatchData(matchId), api.getMatchTimeline(matchId)])
          .then((matchData) => {
            matchData[0].timeline = matchData[1]
            if(!err) {
              matches.insert( matchData[0], {w:1}, function(err, result) {});
            }
        });
      });
    } else {
      console.log("Skipping",matchId);
    }
  });
}

app.get('/load/:name', function(request, response) {
    var name = request.params.name;
    api.getSummonerId(name)
    .then((accountId) => {
        return api.getRecentMatchIds(accountId);
    }).then((matchIds) => {
      console.log(matchIds);
      response.send(matchIds);
      for(var i = 0; i < matchIds.length; i++) { //matchIds.length
        grabIt(matchIds[i]);
      }
    });
    // response.render('pages/index');
});

app.get('*', function(request, response) {
  response.sendFile('public/index.html', {"root": __dirname});
});

db.connect(function(err) {
  if (err) {
    console.log('Unable to connect to Mongo.')
    process.exit(1)
  } else {
    app.listen(app.get('port'), function() {
      console.log('Node app is running on port', app.get('port'));
    });
  }
})