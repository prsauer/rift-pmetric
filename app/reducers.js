import { combineReducers } from 'redux'
import {
  SELECT_SUBREDDIT,
  INVALIDATE_SUBREDDIT,
  REQUEST_STATS,
  RECEIVE_STATS
} from './actions/actions'

function selectedSubreddit(state = 'reactjs', action) {
  switch (action.type) {
    case SELECT_SUBREDDIT:
      return action.subreddit
    default:
      return state
  }
}

function stats(
  state = {
    isFetching: false,
    didInvalidate: false,
    items: []
  },
  action
) {
  switch (action.type) {
    case INVALIDATE_SUBREDDIT:
      return Object.assign({}, state, {
        didInvalidate: true
      })
    case REQUEST_STATS:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      })
    case RECEIVE_STATS:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        items: action.stats,
        lastUpdated: action.receivedAt
      })
    default:
      return state
  }
}

function statsBySubreddit(state = {}, action) {
  switch (action.type) {
    case INVALIDATE_SUBREDDIT:
    case RECEIVE_STATS:
    case REQUEST_STATS:
      return Object.assign({}, state, {
        [action.subreddit]: stats(state[action.subreddit], action)
      })
    default:
      return state
  }
}

const rootReducer = combineReducers({
  statsBySubreddit,
  selectedSubreddit
})

export default rootReducer
