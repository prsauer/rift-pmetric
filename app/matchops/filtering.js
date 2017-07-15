export function fWins(matches) {
  return matches.filter((m) => m.participant.stats.win);
}

export function fLoss(matches) {
  return matches.filter((m) => !m.participant.stats.win);
}

export function fRole(matches, role) {
  //""
  // Participant's role (Legal values: DUO, NONE, SOLO, DUO_CARRY, DUO_SUPPORT)
  // Participant's lane (Legal values: MID, MIDDLE, TOP, JUNGLE, BOT, BOTTOM)
  return matches.filter((m) => (role == m.participant.timeline.role));
}
