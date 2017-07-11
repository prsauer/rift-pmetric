import fetch from 'isomorphic-fetch'

export const REQUEST_STATS = 'REQUEST_STATS'
export const RECEIVE_STATS = 'RECEIVE_STATS'
export const SELECT_SUBREDDIT = 'SELECT_SUBREDDIT'
export const INVALIDATE_SUBREDDIT = 'INVALIDATE_SUBREDDIT'

export function selectSubreddit(subreddit) {
  return {
    type: SELECT_SUBREDDIT,
    subreddit
  }
}

export function invalidateSubreddit(subreddit) {
  return {
    type: INVALIDATE_SUBREDDIT,
    subreddit
  }
}

function requestStats(subreddit) {
  return {
    type: REQUEST_STATS,
    subreddit
  }
}

function receiveStats(subreddit, json) {
  return {
    type: RECEIVE_STATS,
    subreddit,
    stats: [json,],
    receivedAt: Date.now()
  }
}

function fetchStats(subreddit) {
  return dispatch => {
    dispatch(requestStats(subreddit))
    return fetch(`/stats`)
      .then(response => response.json())
      .then(json => dispatch(receiveStats(subreddit, json)))
  }
}

function shouldFetchStats(state, subreddit) {
  const STATS = state.statsBySubreddit[subreddit]
  if (!STATS) {
    return true
  } else if (STATS.isFetching) {
    return false
  } else {
    return STATS.didInvalidate
  }
}

export function fetchStatsIfNeeded(subreddit) {
  return (dispatch, getState) => {
    if (shouldFetchStats(getState(), subreddit)) {
      return dispatch(fetchStats(subreddit))
    }
  }
}