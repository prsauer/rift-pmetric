var express = require('express');
var app = express();
var fetch = require('node-fetch');
var sleep = require('sleep');
var Queue = require('promise-queue');

var queue = new Queue(1, 1000);

// Retrieve
var db = require('./db');
var api = require('./api/riot');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

app.get('/stats/:name', function(request, response) {
  var name = request.params.name;
  console.log("Collecting stats for",name);
  db.get().createCollection('stats');
  var statsCollection = db.get().collection('stats');
  var collection = db.get().collection('matches');
  collection.find({
      'participantIdentities.player.summonerName': {$eq: name}
    }).toArray(function(err, items) {
      cs = 0;
      for(let i = 0; i < items.length; i++) {
        m1 = matchStatsOfPlayer(items[i], name);
        cs += m1.totalMinionsKilled;
        console.log(m1);
        // response.send(matchStatsOfPlayer(m1, name));
      }
      cs = cs/items.length;
      statsCollection.update({summonerName: {$eq: name}}, {'summonerName': name, 'csAvg': cs}, {upsert: true});
      response.send({cs});
  });
});

function matchStatsOfPlayer(match, name) {
  var pid = -1;
  for(let i = 0; i < match.participantIdentities.length; i++) {
    if (match.participantIdentities[i].player.summonerName == name) {
      pid = match.participantIdentities[i].participantId;
      break;
    }
  }
  var slice = {};
  for(let i = 0; i < match.participants.length; i++) {
    if (match.participants[i].participantId == pid) {
      slice = match.participants[i];
      break;
    }
  }
  return slice.stats;
}

function grabIt(matchId) {
  matches = db.get().collection('matches');
  matches.find({gameId: {$eq: matchId}}).toArray(function(err, items) {
    if (items.length == 0) {
      console.log("Qing", matchId);
      queue.add(function() {
        console.log("Fetching", matchId, queue.getQueueLength(), "remain");        
        return api.getMatchData(matchId).then((matchData) => {
          if(!err) {
            matches.insert(matchData, {w:1}, function(err, result) {});
          }
        });
      });
    } else {
      console.log("Skipping",matchId);
    }
  });
}

app.get('/load', function(request, response) {
    api.getSummonerId('xbanthur')
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