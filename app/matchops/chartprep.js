// Project into objects, return row-oriented
export function getProjRWise(paths, objs) {
  var rv = [];
  var minx = 2499560711062;
  var maxx = -1;
  for (let i = 0; i < objs.length; i++) {
    var x = getLeafWithPath(objs[i], paths[0]);
    var y = getLeafWithPath(objs[i], paths[1]);
    if (x > maxx) {
      maxx = x;
    }
    if (x < minx) {
      minx = x;
    }
    rv.push({ x, y });
  }
  console.log(minx, maxx);
  return rv;
}

export function projSlice(path, objs) {
  var p = [];
  for (let i = 0; i < objs.length; i++) {
    p.push(getLeafWithPath(objs[i], path));
  }
  return p;
}

// Project into objects, return column-oriented
export function getProjCWise(paths, objs) {
  var rv = {};
  for (let i = 0; i < paths.length; i++) {
    rv[paths[i]] = projSlice(paths[i], objs);
  }
  return rv;
}