import { combineReducers } from 'redux';
import deepcopy from 'deepcopy';
import {
  SELECT_SUMMONER,
  INVALIDATE_SUMMONER,
  REQUEST_STATS,
  RECEIVE_STATS,
  UPDATE_FILTER,
  LOAD_MATCHES,
} from './actions/actions';

function ff(obj, has, is, wants) {
  //console.log(is.split('.').reduce((o, x) => o[x], obj));
  return (
    //has.split('.').reduce((o, x) => o[x], obj)
    //&& 
    (is.split('.').reduce((o, x) => o[x], obj) == wants)
  );
}

function applyFilter(filter, rawMatches) {
  var t0 = performance.now();
  //var matches = deepcopy(rawMatches);
  var matches = JSON.parse(JSON.stringify(rawMatches));
  var t1 = performance.now();
  console.log("Copy took", t1-t0);
  if (filter.role) {
    matches = matches.filter((m) => 
      ff(m, 'participant.timeline', 'participant.timeline.role', filter.role));
  }
  if (filter.lane) {
    matches = matches.filter((m) => 
      ff(m, 'participant.timeline', 'participant.timeline.lane', filter.lane));
  }
  return matches;
}

function filteredMatchData(state = {filter: {}, matches: [], rawMatches: []}, action) {
  switch (action.type) {
    case LOAD_MATCHES:
      return Object.assign({}, state, { matches: action.matches, rawMatches: action.matches });
    case UPDATE_FILTER:
      var matches = applyFilter(action.filter, state.rawMatches);
      return Object.assign({}, state, { matches, filter: action.filter });
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
