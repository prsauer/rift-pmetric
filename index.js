var express = require('express');
var app = express();
var fetch = require('node-fetch');
var sleep = require('sleep');

var compression = require('compression');

app.use(compression());

// Retrieve
var db = require('./db');
var stats = require('./stats');
var api = require('./api/riot');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));


////Q
var RABBIT_URL = 'amqp://22hbPd6w:9ogmUY0y6pAlp4QLW9cdt4z59KLukck9@swift-threarah-47.bigwig.lshift.net:11046/Mi8ki3NDfr_6';
var jackrabbit = require('jackrabbit');
var rabbit = jackrabbit(RABBIT_URL);
var exchange = rabbit.default();
var hello = exchange.queue({ name: 'hello' });
////Q


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

app.get('/load/:name', function(request, response) {
    var name = request.params.name;
    exchange.publish(name, { key: 'player_update' });
    console.log("Publish name", name);
    response.send("Queued task");
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