var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(10, 'minute');

var Queue = require('promise-queue');
var queue = new Queue(1, 1000);
var api = require('./api/riot');
var db = require('./db');
var sleep = require('sleep');


var jackrabbit = require('jackrabbit');

var rabbit = jackrabbit(process.env.RABBITMQ_BIGWIG_URL);
var exchange = rabbit.default();
var player_names = exchange.queue({ name: 'player_update' });
var match_ids = exchange.queue({ name: 'match_ids'} );

db.connect(function(err) {
  if (!err) {
    match_ids.consume(onMatchId, { noAck: true });
    player_names.consume(onPlayerNamed, { noAck: true });
  }
});

function onMatchId(matchId) {
    // Throttle requests
  return limiter.removeTokens(1, function(err, remainingRequests) {
    // err will only be set if we request more than the maximum number of
    // requests we set in the constructor
    
    // remainingRequests tells us how many additional requests could be sent
    // right this moment
    
    return fetchData(matchId);
  });
}

function fetchData(matchId) {
  matches = db.get().collection('matches');
  return matches.find({gameId: {$eq: matchId}}).toArray(function(err, items) {
    if (items.length == 0) {
      return Promise.all([api.getMatchData(matchId), api.getMatchTimeline(matchId)])
          .then((matchData) => {
            matchData[0].timeline = matchData[1]
            if(!err) {
              matches.insert( matchData[0], {w:1}, function(err, result) {
                sleep.msleep(1200);
              });
            }
            else {
              console.log("DatabaseError", err);
            }
        });
    }
    else {
      //Already in DB
    }
  });
}

// function grabIt(matchId) {
//   matches = db.get().collection('matches');
//   return matches.find({gameId: {$eq: matchId}}).toArray(function(err, items) {
//     if (items.length == 0) {
//       console.log("Qing", matchId);
//       exchange.publish(matchId, { key: 'match_ids' });
//       queue.add(function() {
//         console.log("Fetching", matchId, queue.getQueueLength(), "remain");        
//         return Promise.all([api.getMatchData(matchId), api.getMatchTimeline(matchId)])
//           .then((matchData) => {
//             matchData[0].timeline = matchData[1]
//             if(!err) {
//               matches.insert( matchData[0], {w:1}, function(err, result) {});
//             }
//         });
//       });
//     } else {
//       console.log("Skipping",matchId);
//     }
//   });
// }

function onPlayerNamed(name) {
  console.log('PlayerNamed:', name);
  return api.getSummonerId(name)
    .then((accountId) => {
        return api.getRecentMatchIds(accountId);
    }).then((matchIds) => {
      for(var i = 0; i < matchIds.length; i++) { //matchIds.length
        exchange.publish(matchIds[i], { key: 'match_ids' });
      }
    });
}
