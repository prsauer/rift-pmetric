import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  selectSummoner,
  fetchStatsIfNeeded,
  invalidateSummoner
} from './actions/actions'
import { withRouter } from 'react-router-dom'

function DFS(obj, path, store) {
  if (typeof(obj) == 'string') {
    store[path] = 'string'
  } else if (Array.isArray(obj)) {
    store[path] = 'array';
    for(let i = 0; i < obj.length; i++) {
      DFS(obj[i], path + '.' + i, store);
    }
  } else if (typeof(obj) == 'object') {
    store[path] = 'object';
    for(let i = 0; i < Object.keys(obj).length; i++) {
      DFS(obj[Object.keys(obj)[i]], path + '.' + Object.keys(obj)[i], store);
    }
  } else if (typeof(obj) == 'number') {
    store[path] = 'number';
  }
  else {
    store[path] = 'unknown';    
  }
  return
}

function getLeafWithPath(obj, path) {
  var keys = path.split('.')
  var into = obj;
  for(var i = 1; i < keys.length; i++) {
    if (into === undefined) {
      return undefined;
    }
    into = into[keys[i]];
  }
  return into
}

function averageWithPath(matches, path) {
  var n = 0;
  var s = 0;
  for(var i = 0; i < matches.length; i++) {
    var v = getLeafWithPath(matches[i], path)
    if (path == 'match.playerTimeline0.totalGold') {
      console.log(v);
    }
    if (v != undefined) {
      s += v;
      n++;
    }
  }
  return s/n;
}

function avgCS(matches) {
  var cs = 0;
  for(var i = 0; i < matches.length; i++) {
    cs += matches[i].participant.stats.totalMinionsKilled;
  }
  return cs/matches.length;
}

function avgCSd10(matches) {
  var c = 0;
  var n = 0;
  for(var i = 0; i < matches.length; i++) {
    if (matches[i].participant.timeline.csDiffPerMinDeltas !== undefined) {
      c += 10*matches[i].participant.timeline.csDiffPerMinDeltas['0-10'];
      n++;
    }
  }
  return c/n;
}

function fWins(matches) {
  return matches.filter((m) => m.participant.stats.win);
}

function fLoss(matches) {
  return matches.filter((m) => !m.participant.stats.win);
}

class ShowStat extends Component {
  render() {
    if (this.props.stats.length > 0) {
      var mapping = {};
      var single_match = this.props.stats[0].metrics.matches[0]
      DFS(single_match, 'match', mapping);
      console.log(getLeafWithPath(single_match, 'match.participant.championId'))
      console.log(mapping);

      // Find best mapping
      var max = -1;
      for(let i = 0; i < this.props.stats[0].metrics.matches.length; i++) {
        var new_map = {};
        DFS(this.props.stats[0].metrics.matches[i], 'match', new_map);
        if (Object.keys(new_map).length > max) {
          mapping = new_map;
          max = Object.keys(new_map).length;
        }
      }
      var averages = [];
      for(let i = 0; i < Object.keys(mapping).length; i++) {
        var path = Object.keys(mapping)[i];
        if (mapping[path] == 'number') {
          console.log("Computing average", path);          
          averages.push(['Average ' + path, averageWithPath(this.props.stats[0].metrics.matches, path)])
        }
      }
      console.log(averages);
    }
    
    if (this.props.stats.length > 0) {
      return (
          <div>
            <div>CS Average: { this.props.stats[0].metrics.cs.mean }</div>
            <div>CSd10 Average: { this.props.stats[0].metrics.csd10.mean }</div>

            <div>Average CSd10 on Win: { avgCSd10(fWins(this.props.stats[0].metrics.matches)) }</div>
            <div>Average CSd10 on Lose: { avgCSd10(fLoss(this.props.stats[0].metrics.matches)) }</div>

            <div>Average CS on Win: { avgCS(fWins(this.props.stats[0].metrics.matches)) }</div>
            <div>Average CS on Lose: { avgCS(fLoss(this.props.stats[0].metrics.matches)) }</div>

            { averages.map((el) => {
              return (<div>{ el[0] }  { el[1] }</div>)
            })}
          </div>
          )
    }
    return (<div>Loading</div>);
  }
}

class AsyncApp extends Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleRefreshClick = this.handleRefreshClick.bind(this)
  }

  componentDidMount() {
    console.log("Mounted with", this.props);
    const { dispatch, selectedSummoner } = this.props
    if (this.props.match.topicId != selectedSummoner) {
      dispatch(selectSummoner(this.props.match.params.topicId))
    }
    else {
      dispatch(fetchStatsIfNeeded(selectedSummoner))      
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedSummoner !== prevProps.selectedSummoner) {
      const { dispatch, selectedSummoner } = this.props
      dispatch(fetchStatsIfNeeded(selectedSummoner))
    }
  }

  handleChange(nextSummoner) {
    this.props.dispatch(selectSummoner(nextSummoner))
    this.props.dispatch(fetchStatsIfNeeded(nextSummoner))
  }

  handleRefreshClick(e) {
    e.preventDefault()

    const { dispatch, selectedSummoner } = this.props
    dispatch(invalidateSummoner(selectedSummoner))
    dispatch(fetchStatsIfNeeded(selectedSummoner))
  }

  render() {
    const { selectedSummoner, stats, isFetching, lastUpdated } = this.props
    return (
      <div>
        <div
        >{selectedSummoner}</div>
        <p>
          {lastUpdated &&
            <span>
              Last updated at {new Date(lastUpdated).toLocaleTimeString()}.
              {' '}
            </span>}
          {!isFetching &&
            <a href="#" onClick={this.handleRefreshClick}>
              Refresh
            </a>}
        </p>
        {isFetching && <h2>Loading...</h2>}
        {
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <ShowStat stats={stats} />
          </div>}
      </div>
    )
  }
}

AsyncApp.propTypes = {
  selectedSummoner: PropTypes.string.isRequired,
  stats: PropTypes.array.isRequired,
  isFetching: PropTypes.bool.isRequired,
  lastUpdated: PropTypes.number,
  dispatch: PropTypes.func.isRequired
}

function mapStateToProps(state) {
  const { selectedSummoner, statsBySummoner } = state
  const {
    isFetching,
    lastUpdated,
    items: stats
  } = statsBySummoner[selectedSummoner] || {
    isFetching: true,
    items: []
  }

  return {
    selectedSummoner,
    stats,
    isFetching,
    lastUpdated
  }
}

export default connect(mapStateToProps)(AsyncApp)
