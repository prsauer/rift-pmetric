var express = require('express');
var app = express();
var fetch = require('node-fetch');
var sleep = require('sleep');

RITO_TOKEN = process.env.RIOT_KEY;
MONGO_URL = process.env.MONGODB_URI;

// Retrieve
var db = require('./db');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

function riotGet(path) {
  var options = {
      method: 'GET',
      headers: {'X-Riot-Token': RITO_TOKEN},
      mode: 'cors',
      cache: 'default',
    };
  console.log("FETCH", path);
  return fetch(path, options).then((d)=>{ return d.json() });
}

function getSummonerId(name) {
  return riotGet(`https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/${name}`).then((d) => {
      return d.accountId;
  });
}

function getRecentMatchIds(accountId) {
    return riotGet(`https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/${accountId}`)
      .then((data) => {
        return data.matches.map((e) => e.gameId);
      })
}

function getMatchData(gameId) {
    return riotGet(`https://na1.api.riotgames.com/lol/match/v3/matches/${gameId}`);
}

function getMatchTimeline(gameId) {
    return riotGet(`https://na1.api.riotgames.com/lol/match/v3/timelines/by-match/${gameId}`);
}

app.get('/stats', function(request, response) {
  db.get().createCollection('stats');
  var statsCollection = db.get().collection('stats');
  var collection = db.get().collection('matches');
  collection.find({
      'participantIdentities.player.summonerName': {$eq: 'xbanthur'}
    }).toArray(function(err, items) {
      cs = 0;
      for(let i = 0; i < items.length; i++) {
        m1 = matchStatsOfPlayer(items[i], 'xbanthur');
        cs += m1.totalMinionsKilled;
        console.log(m1);
        // response.send(matchStatsOfPlayer(m1, 'xbanthur'));
      }
      cs = cs/items.length;
      statsCollection.update({summonerName: {$eq: 'xbanthur'}}, {'summonerName': 'xbanthur', 'csAvg': cs}, {upsert: true});
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
  console.log("GrabIt", matchId);
  matches = db.get().collection('matches');
  matches.find({gameId: {$eq: matchId}}).toArray(function(err, items) {
    console.log("Find", items);
    if (items.length == 0) {
      console.log("Fetching",matchId);
      getMatchData(matchId).then((matchData) => {
        if(!err) {
          matches.insert(matchData, {w:1}, function(err, result) {});
          sleep.msleep(500);
        }
      });
    } else {
      console.log("Skipping",matchId);
    }
  });
}

app.get('/load', function(request, response) {
  var name = 'xbanthur';
    getSummonerId('xbanthur')
    .then((accountId) => {
        return getRecentMatchIds(accountId);
    }).then((matchIds) => {
      console.log(matchIds);
      for(var i = 0; i < matchIds.length; i++) { //matchIds.length
        grabIt(matchIds[i]);
      }
    });
  // response.render('pages/index');
});

app.get('*', function(request, response) {
  response.sendFile('public/index.html', {"root": __dirname});
});

db.connect(MONGO_URL, function(err) {
  if (err) {
    console.log('Unable to connect to Mongo.')
    process.exit(1)
  } else {
    app.listen(app.get('port'), function() {
      console.log('Node app is running on port', app.get('port'));
    });
  }
})