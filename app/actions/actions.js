import fetch from 'isomorphic-fetch';

export const REQUEST_STATS = 'REQUEST_STATS';
export const RECEIVE_STATS = 'RECEIVE_STATS';
export const SELECT_SUMMONER = 'SELECT_SUMMONER';
export const INVALIDATE_SUMMONER = 'INVALIDATE_SUMMONERT';

export function selectSummoner(summoner) {
  return {
    type: SELECT_SUMMONER,
    summoner,
  };
}

export function invalidateSummoner(summoner) {
  return {
    type: INVALIDATE_SUMMONER,
    summoner,
  };
}

function requestStats(summoner) {
  return {
    type: REQUEST_STATS,
    summoner,
  };
}

function receiveStats(summoner, json) {
  return {
    type: RECEIVE_STATS,
    summoner,
    stats: [json],
    receivedAt: Date.now(),
  };
}

function fetchStats(summoner) {
  return dispatch => {
    dispatch(requestStats(summoner));
    return fetch(`/stats/${summoner}/`)
      .then(response => response.json())
      .then(json => dispatch(receiveStats(summoner, json)));
  };
}

function shouldFetchStats(state, summoner) {
  const STATS = state.statsBySummoner[summoner];
  if (!STATS) {
    return true;
  } else if (STATS.isFetching) {
    return false;
  } else {
    return STATS.didInvalidate;
  }
}

export function fetchStatsIfNeeded(summoner) {
  return (dispatch, getState) => {
    if (shouldFetchStats(getState(), summoner)) {
      return dispatch(fetchStats(summoner));
    }
  };
}