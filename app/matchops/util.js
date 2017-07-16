
export function pathToPretty(path) {
  var parts = path.split('.');
  var pretty = [];
  for (let i = 0; i < parts.length; i++) {
    var piece = parts[i];
    if (piece == 'participant') continue;
    if (piece == 'stats') continue;
    if (piece == 'timeline') continue;
    if (piece == 'playerTimeline') { pretty.push('Minute '); continue; }
    if (!isNaN(piece)) { pretty.push(piece); continue; }
    pretty.push(piece.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()));
  }
  return pretty.join(' ');
}
