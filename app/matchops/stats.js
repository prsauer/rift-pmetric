import { ewAdd, getLeafWithPath } from './trees';
import { fWins, fLoss } from './filtering';

export function sum(x) {
  var s = 0;
  for (let i = 0; i < x.length; i++) {
    s += x[i];
  }
  return s;
}

export function corr(x, y) {
  if (x.length != y.length) {
    return NaN;
  }
  var sdx = stdev(x);
  var sdy = stdev(y);
  var ux = mean(x);
  var uy = mean(y);
  var Xdiff = ewAdd(x, -ux);
  var Ydiff = ewAdd(y, -uy);
  var sum = 0;
  for (let i = 0; i < x.length; i++) {
    sum += Xdiff[i] * Ydiff[i];
  }
  var num = sum / x.length;
  return num / (sdx * sdy);
}

export function mean(x) {
  return sum(x) / (1.0 * x.length);
}

// Point Biserial Correlation calculation
// X1 is data when the dichotomous variable is 1
// X2 is data when the dichotomous variable is 0
export function pbCorr(X1, X2) {
  var sd = stdev(X1.concat(X2));
  var m1 = mean(X1);
  var m2 = mean(X2);
  var n1 = X1.length;
  var n2 = X2.length;
  var n = 1.0 * (n1 + n2);
  var A = (m1 - m2) / sd;
  var B = Math.sqrt((n1 * n2) / (n * n));
  return A * B;
}

export function stdev(x) {
  var sum = 0;
  var u = mean(x);
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - u) * (x[i] - u);
  }
  return Math.sqrt(sum / (x.length - 1));
}

export function stdev_N(x) {
  var sum = 0;
  var u = mean(x);
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - u) * (x[i] - u);
  }
  return Math.sqrt(sum / (x.length));
}

export function pCorrWithPath(matches, path, variate) {
  var wdata = [];
  var ldata = [];

  var ws = fWins(matches);
  var ls = fLoss(matches);
  
  for (let i = 0; i < ws.length; i++) {
    let v = getLeafWithPath(ws[i], path);
    if (v != undefined) {
      wdata.push(v);
    }
  }
  for (let i = 0; i < ls.length; i++) {
    let v = getLeafWithPath(ls[i], path);
    if (v != undefined) {
      ldata.push(v);
    }
  }
  return pbCorr(wdata, ldata);
}

export function averageWithPath(matches, path) {
  var n = 0;
  var s = 0;
  for (var i = 0; i < matches.length; i++) {
    var v = getLeafWithPath(matches[i], path);
    if (v != undefined) {
      s += v;
      n++;
    }
  }
  return s / n;
}

export function pCorrForNumbers(tree, mapping) {
  var data = [];
  for (let i = 0; i < Object.keys(mapping).length; i++) {
    var path = Object.keys(mapping)[i];
    if (mapping[path] == 'number') {
      data.push(pCorrWithPath(tree, path));
    }
  }
  return data;
}

export function averagesForNumbers(tree, mapping) {
  var averages = [];
  for (let i = 0; i < Object.keys(mapping).length; i++) {
    var path = Object.keys(mapping)[i];
    if (mapping[path] == 'number') {
      averages.push([path, averageWithPath(tree, path)]);
    }
  }
  return averages;
}
