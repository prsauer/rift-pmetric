import { combineReducers } from 'redux';
import {
  SELECT_SUMMONER,
  INVALIDATE_SUMMONER,
  REQUEST_STATS,
  RECEIVE_STATS,
  UPDATE_FILTER,
  LOAD_MATCHES,
} from './actions/actions';

function applyFilter(filter, matches) {
  return matches;
}

function filteredMatchData(state = {filter: {}, matches: []}, action) {
  switch (action.type) {
    case LOAD_MATCHES:
      return Object.assign({}, state, { matches: action.matches });
    case UPDATE_FILTER:
      var matches = applyFilter(action.filter, state.matches);
      return Object.assign({}, { matches, filter: action.filter });
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
