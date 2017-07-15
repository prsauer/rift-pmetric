export function fWins(matches) {
  return matches.filter((m) => m.participant.stats.win);
}

export function fLoss(matches) {
  return matches.filter((m) => !m.participant.stats.win);
}

export function fRole(matches, role) {
  //""
  return matches.filter((m) => (role == m.participant.timeline.role));
}

// function projSlice(path, objs) {
//   var p = [];
//   for (let i = 0; i < objs.length; i++) {
//     p.push(getLeafWithPath(objs[i], path));
//   }
//   return p;
// }

// Project into objects, return column-oriented
// function getProjCWise(paths, objs) {
//   var rv = {};
//   for (let i = 0; i < paths.length; i++) {
//     rv[paths[i]] = projSlice(paths[i], objs);
//   }
//   return rv;
// }
