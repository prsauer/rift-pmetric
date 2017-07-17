import { combineReducers } from 'redux';
import deepcopy from 'deepcopy';
import {
  SELECT_SUMMONER,
  INVALIDATE_SUMMONER,
  REQUEST_STATS,
  RECEIVE_STATS,
  UPDATE_FILTER,
  LOAD_MATCHES,
  START_FILTER_UPDATE,
} from './actions/actions';

import { DFS } from './matchops/trees';
import { averagesForNumbers, pCorrForNumbers} from './matchops/stats';
import { fWins, fLoss } from './matchops/filtering';
import { pathToPretty } from './matchops/util';

function ff(obj, has, is, wants) {
  //console.log(is.split('.').reduce((o, x) => o[x], obj));
  return (
    //has.split('.').reduce((o, x) => o[x], obj)
    //&& 
    (is.split('.').reduce((o, x) => o[x], obj) == wants)
  );
}

function applyFilter(filter, rawMatches) {
  //var matches = deepcopy(rawMatches);
  var matches = JSON.parse(JSON.stringify(rawMatches));
  if (filter.role) {
    matches = matches.filter((m) => 
      ff(m, 'participant.timeline', 'participant.timeline.role', filter.role));
  }
  if (filter.lane) {
    matches = matches.filter((m) => 
      ff(m, 'participant.timeline', 'participant.timeline.lane', filter.lane));
  }
  if (filter.champion) {
    matches = matches.filter((m) => 
      ff(m, 'participant.championId', 'participant.championId', filter.champion));
  }
  return matches;
}

function computeMap(matches) {
  var mapping = {};
  var max = -1;
  for (let i = 0; i < matches.length; i++) {
    var new_map = {};
    DFS(matches[i], '', new_map);
    if (Object.keys(new_map).length > max) {
      mapping = new_map;
      max = Object.keys(new_map).length;
    }
  }
  return mapping;
}

function computeMerged(matches, mapping) {
  if (matches === [] || mapping === {}) {
    return [];    
  }

  var averages = averagesForNumbers(matches, mapping);
  var correlates = pCorrForNumbers(matches, mapping);
  var average_w = averagesForNumbers(fWins(matches), mapping);
  var average_l = averagesForNumbers(fLoss(matches), mapping);
  var merged = [];

  for (let i = 0; i < averages.length; i++) {
    var key = averages[i][0];
    var c_data = correlates[i];
    var w_data = undefined;
    var l_data = undefined;
    if (average_w[i][0] === key) {
      w_data = average_w[i][1];
    }
    if (average_l[i][0] === key) {
      l_data = average_l[i][1];
    }
    merged.push(
      [
        pathToPretty(key),
        Math.round(averages[i][1] * 10) / 10.0,
        Math.round(w_data * 10) / 10.0,
        Math.round(l_data * 10) / 10.0,
        Math.round(c_data * 100, -3) / 100.0,
        Math.round((w_data - l_data) * 10) / 10.0,
        key,
      ]
    );
    merged = merged.filter((el) => (Math.abs(el[4]) > 0.3));
    merged.sort((a, b) => (Math.abs(b[4]) - Math.abs(a[4])));
  }
  return merged;
}

function filteredMatchData(state = {mapping: {}, ready: false, merged: [], filter: {}, matches: [], rawMatches: []}, action) {
  switch (action.type) {
    case START_FILTER_UPDATE:
      return Object.assign({}, state, { ready: false });
    case LOAD_MATCHES:
      var mapping = computeMap(action.matches);
      return Object.assign(
        {},
        state,
        {
          mapping: mapping, 
          matches: action.matches,
          rawMatches: action.matches,
          merged: computeMerged(action.matches, mapping),
          ready: true,
        },
      );
    case UPDATE_FILTER:
      var matches = applyFilter(action.filter, state.rawMatches);
      return Object.assign(
        {},
        state,
        {
          matches,
          merged: computeMerged(matches, state.mapping),
          filter: action.filter,
          ready: true,
        },
      );
    default:
      return state;
  }
}

function selectedSummoner(state = '', action) {
  switch (action.type) {
    case SELECT_SUMMONER:
      return action.summoner;
    default:
      return state;
  }
}

function stats(
  state = {
    isFetching: false,
    didInvalidate: false,
    items: [],
  },
  action
) {
  switch (action.type) {
    case INVALIDATE_SUMMONER:
      return Object.assign({}, state, {
        didInvalidate: true,
      });
    case REQUEST_STATS:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false,
      });
    case RECEIVE_STATS:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        items: action.stats,
        lastUpdated: action.receivedAt,
      });
    default:
      return state;
  }
}

function statsBySummoner(state = {}, action) {
  switch (action.type) {
    case INVALIDATE_SUMMONER:
    case RECEIVE_STATS:
    case REQUEST_STATS:
      return Object.assign({}, state, {
        [action.summoner]: stats(state[action.summoner], action),
      });
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  statsBySummoner,
  selectedSummoner,
  filteredMatchData,
});

export default rootReducer;
