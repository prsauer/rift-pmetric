
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
  return slice;
}

exports.computeStats = function(name, matches) {
  stats = {
    cs: { sum: 0, mean: 0, n: 0, vals: [] },
    csd10: { sum: 0, mean: 0, n: 0, vals: [] },
  };
  for(let i = 0; i < matches.length; i++) {
    m1 = matchStatsOfPlayer(matches[i], name);
    match = {gameId: matches[i].gameId, gameCreation: matches[i].gameCreation};
    console.log("Analyze",match);
    stats.cs.sum += m1.stats.totalMinionsKilled;
    stats.cs.vals.push([match, m1.stats.totalMinionsKilled]);
    stats.cs.n++;
    if (m1.timeline.csDiffPerMinDeltas !== undefined) {
      stats.csd10.sum += m1.timeline.csDiffPerMinDeltas['0-10'];
      stats.csd10.vals.push([match, m1.timeline.csDiffPerMinDeltas['0-10']]);
      stats.csd10.n++;
    }
  }
  stats.csd10.mean = 10.0*stats.csd10.sum/stats.csd10.n;
  stats.cs.mean = stats.cs.sum/stats.cs.n;
  return stats;
}
