import { combineReducers } from 'redux';
import {
  SELECT_SUMMONER,
  INVALIDATE_SUMMONER,
  REQUEST_STATS,
  RECEIVE_STATS,
} from './actions/actions';

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
});

export default rootReducer;
