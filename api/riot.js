var fetch = require('node-fetch');

RITO_TOKEN = process.env.RIOT_KEY;

exports.riotGet = function(path) {
  var options = {
      method: 'GET',
      headers: {'X-Riot-Token': RITO_TOKEN},
      mode: 'cors',
      cache: 'default',
    };
  console.log("FETCH", path);
  return fetch(path, options).then((d)=>{ console.log("RES", d.status, d.statusText); return d.json() });
}

exports.getSummonerId = function(name) {
  return exports.riotGet(`https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/${name}`).then((d) => {
    //console.log("AccountId", d.accountId);
    return d.accountId;
  });
}

exports.getRecentMatchIds = function(accountId) {
  return exports.riotGet(`https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/${accountId}?queue=420&season=9`)
    .then((data) => {
      return data.matches.map((e) => e.gameId);
    })
}

exports.getMatchData = function(gameId) {
  console.log("CALL getMatchData", gameId);
  return exports.riotGet(`https://na1.api.riotgames.com/lol/match/v3/matches/${gameId}`);
}

exports.getMatchTimeline = function(gameId) {
  console.log("CALL getMatchTimeline", gameId);
  return exports.riotGet(`https://na1.api.riotgames.com/lol/match/v3/timelines/by-match/${gameId}`);
}
