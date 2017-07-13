import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  selectSummoner,
  fetchStatsIfNeeded,
  invalidateSummoner
} from './actions/actions'
import { withRouter } from 'react-router-dom'

function sum(x) {
  var s = 0;
  for(let i = 0; i < x.length; i++) {
    s += i;
  }
  return s;
}

function mean(x) {
  return sum(x)/x.length;
}

function ewAdd(x, d) {
  return x.map((el) => el + d);
}

function stdev(x) {
  var sum = 0;
  var u = mean(x);
  for(let i = 0; i < x.length; i++) {
    sum += (x[i] - u)*(x[i] - u);
  }
  return Math.sqrt(sum/(x.length - 1));
}

function corr(x, y) {
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
  for(let i = 0; i < x.length; i++) {
    sum += Xdiff[i] * Ydiff[i];
  }
  var num = sum/x.length;
  return num/(sdx * sdy);
}

function DFS(obj, path, store) {
  if (path.search("Id") > -1) {
    return;
  }
  if (path.search("timestamp") > -1) {
    return;
  }
  if (path.search("gameScore") > -1) {
    return;
  }
  if (path.search("teamScore") > -1) {
    return;
  }
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

function corrWithPath(matches, path, variate) {
  var s = [];
  var w = [];
  for(var i = 0; i < matches.length; i++) {
    var v = getLeafWithPath(matches[i], path)
    if (v != undefined) {
      s.push(v);
      w.push(matches[i].participant.stats.win);
    }
  }
  return corr(s, w);
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

function corrForNumbers(tree, mapping) {
  var data = [];
  for(let i = 0; i < Object.keys(mapping).length; i++) {
    var path = Object.keys(mapping)[i];
    if (mapping[path] == 'number') {
      data.push(corrWithPath(tree, path));
    }
  }
  return data;
}

function averagesForNumbers(tree, mapping) {
  var averages = [];
  for(let i = 0; i < Object.keys(mapping).length; i++) {
    var path = Object.keys(mapping)[i];
    if (mapping[path] == 'number') {
      averages.push([path, averageWithPath(tree, path)])
    }
  }
  return averages;
}

function fWins(matches) {
  return matches.filter((m) => m.participant.stats.win);
}

function fLoss(matches) {
  return matches.filter((m) => !m.participant.stats.win);
}

function attach_stat(matches, name, gen) {
  for(let i = 0; i < matches.length; i++) {
    matches[i][name] = gen(matches[i])
  }
}

function gpm(match) {
  return match.participant.stats.goldEarned / match.gameDuration;
}

class ShowStat extends Component {
  render() {
    if (this.props.stats.length > 0) {
      attach_stat(this.props.stats[0].metrics.matches, 'gpm', gpm);
      var cs_array = this.props.stats[0].metrics.matches.map((el) => el.participant.stats.totalMinionsKilled);
      var w_array = this.props.stats[0].metrics.matches.map((el) => el.participant.stats.win ? 1 : -1);
      console.log("CORR", corr(cs_array, w_array));
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
      var averages = averagesForNumbers(this.props.stats[0].metrics.matches, mapping);
      var correlates = corrForNumbers(this.props.stats[0].metrics.matches, mapping);
      var average_w = averagesForNumbers(fWins(this.props.stats[0].metrics.matches), mapping);
      var average_l = averagesForNumbers(fLoss(this.props.stats[0].metrics.matches), mapping);
      var merged = [];

      for(let i = 0; i < averages.length; i++) {
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
            key,
            averages[i][1],
            w_data,
            l_data,
            Math.round(c_data*100, -3)/100.0,
            w_data - l_data,
          ]
        );
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
            <h3>Averages</h3>
            <table>
              <thead>
                <tr>
                  <td>Name</td>
                  <td>Average</td>
                  <td>Avg Win</td>
                  <td>Avg Loss</td>
                  <td>Corr: Win</td>
                  <td>AvgW - AvgL</td>
                  </tr>
                </thead>
                <tbody>
            { merged.map((el) => {
              return (<tr><td>{el[0]}</td><td>{el[1]}</td><td>{el[2]}</td><td>{el[3]}</td><td>{el[4]}</td><td>{el[5]}</td></tr>)
            })}
            </tbody>
            </table>
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
