
export default function ewAdd(x, d) {
  return x.map((el) => el + d);
}


export function DFS(obj, path, store) {
  if (path.search('Id') > -1) {
    return;
  }
  if (path.search('timestamp') > -1) {
    return;
  }
  if (path.search('gameScore') > -1) {
    return;
  }
  if (path.search('teamScore') > -1) {
    return;
  }
  if (path.search('gameCreation') > -1) {
    return;
  }
  if (typeof (obj) == 'string') {
    store[path] = 'string';
  } else if (Array.isArray(obj)) {
    store[path] = 'array';
    for (let i = 0; i < obj.length; i++) {
      DFS(obj[i], path + '.' + i, store);
    }
  } else if (typeof (obj) == 'object') {
    store[path] = 'object';
    for (let i = 0; i < Object.keys(obj).length; i++) {
      DFS(obj[Object.keys(obj)[i]], path + '.' + Object.keys(obj)[i], store);
    }
  } else if (typeof (obj) == 'number') {
    store[path] = 'number';
  } else {
    store[path] = 'unknown';    
  }
  
}

export function getLeafWithPath(obj, path) {
  var keys = path.split('.');
  var into = obj;
  for (var i = 1; i < keys.length; i++) {
    if (into === undefined) {
      return undefined;
    }
    into = into[keys[i]];
  }
  return into;
}
