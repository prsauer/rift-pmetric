export function attach_stat(matches, name, gen) {
  for (let i = 0; i < matches.length; i++) {
    matches[i][name] = gen(matches[i]);
  }
}

export function gpm(match) {
  return match.participant.stats.goldEarned / match.gameDuration;
}
