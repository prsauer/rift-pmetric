
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

function getPlayerFrame(frames, id) {
  return Object.values(frames).find((el) => (el.participantId == id));
}

exports.computeStats = function(name, matches) {
  stats = {
    cs: { sum: 0, mean: 0, n: 0 },
    csd10: { sum: 0, mean: 0, n: 0 },
    matches: [],
  };
  for(let i = 0; i < matches.length; i++) {
    participantData = matchStatsOfPlayer(matches[i], name);
    match = {
      gameId: matches[i].gameId,
      gameCreation: matches[i].gameCreation,
      participant: participantData,
      gameDuration: matches[i].gameDuration,
    };
    match.cs = participantData.stats.totalMinionsKilled;
    stats.cs.sum += participantData.stats.totalMinionsKilled;
    stats.cs.n++;
    if (participantData.timeline.csDiffPerMinDeltas !== undefined) {
      match.csd10 = participantData.timeline.csDiffPerMinDeltas['0-10'];
      stats.csd10.sum += participantData.timeline.csDiffPerMinDeltas['0-10'];
      stats.csd10.n++;
    }
    if (matches[i].timeline.frames !== undefined) {
      match.playerTimeline = matches[i].timeline.frames.map((frame) => {
        let f = getPlayerFrame(frame.participantFrames, participantData.participantId);
        f.timestamp = frame.timestamp;
        return f;
      });
    }
    stats.matches.push(match);
  }
  stats.csd10.mean = 10.0*stats.csd10.sum/stats.csd10.n;
  stats.cs.mean = stats.cs.sum/stats.cs.n;
  return stats;
}
