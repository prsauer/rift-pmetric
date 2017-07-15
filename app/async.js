import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  selectSummoner,
  fetchStatsIfNeeded,
  invalidateSummoner,
} from './actions/actions';
import { withRouter } from 'react-router-dom';

import { Chart } from 'react-google-charts';
import { Table } from 'react-bootstrap';

import { sum, mean, pbCorr, stdev } from './stats';

function ewAdd(x, d) {
  return x.map((el) => el + d);
}

function DFS(obj, path, store) {
  if (path.search('Id') > -1) {
    return;
  }
  if (path.search('timestamp') > -1) {
    return;
  }
  if (path.search('gameScore') > -1) {
    return;
  }
  if (path.search('teamScore') > -1) {
    return;
  }
  if (path.search('gameCreation') > -1) {
    return;
  }
  if (typeof (obj) == 'string') {
    store[path] = 'string';
  } else if (Array.isArray(obj)) {
    store[path] = 'array';
    for (let i = 0; i < obj.length; i++) {
      DFS(obj[i], path + '.' + i, store);
    }
  } else if (typeof (obj) == 'object') {
    store[path] = 'object';
    for (let i = 0; i < Object.keys(obj).length; i++) {
      DFS(obj[Object.keys(obj)[i]], path + '.' + Object.keys(obj)[i], store);
    }
  } else if (typeof (obj) == 'number') {
    store[path] = 'number';
  } else {
    store[path] = 'unknown';    
  }
  
}

function getLeafWithPath(obj, path) {
  var keys = path.split('.');
  var into = obj;
  for (var i = 1; i < keys.length; i++) {
    if (into === undefined) {
      return undefined;
    }
    into = into[keys[i]];
  }
  return into;
}


function pCorrWithPath(matches, path, variate) {
  var wdata = [];
  var ldata = [];

  var ws = fWins(matches);
  var ls = fLoss(matches);
  
  for (var i = 0; i < ws.length; i++) {
    var v = getLeafWithPath(ws[i], path);
    if (v != undefined) {
      wdata.push(v);
    }
  }
  for (var i = 0; i < ls.length; i++) {
    var v = getLeafWithPath(ls[i], path);
    if (v != undefined) {
      ldata.push(v);
    }
  }
  return pbCorr(wdata, ldata);
}


function corrWithPath(matches, path, variate) {
  var s = [];
  var w = [];
  for (var i = 0; i < matches.length; i++) {
    var v = getLeafWithPath(matches[i], path);
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
  for (var i = 0; i < matches.length; i++) {
    var v = getLeafWithPath(matches[i], path);
    if (v != undefined) {
      s += v;
      n++;
    }
  }
  return s / n;
}

function avgCS(matches) {
  var cs = 0;
  for (var i = 0; i < matches.length; i++) {
    cs += matches[i].participant.stats.totalMinionsKilled;
  }
  return cs / matches.length;
}

function avgCSd10(matches) {
  var c = 0;
  var n = 0;
  for (var i = 0; i < matches.length; i++) {
    if (matches[i].participant.timeline.csDiffPerMinDeltas !== undefined) {
      c += 10 * matches[i].participant.timeline.csDiffPerMinDeltas['0-10'];
      n++;
    }
  }
  return c / n;
}

function pCorrForNumbers(tree, mapping) {
  var data = [];
  for (let i = 0; i < Object.keys(mapping).length; i++) {
    var path = Object.keys(mapping)[i];
    if (mapping[path] == 'number') {
      data.push(pCorrWithPath(tree, path));
    }
  }
  return data;
}

function corrForNumbers(tree, mapping) {
  var data = [];
  for (let i = 0; i < Object.keys(mapping).length; i++) {
    var path = Object.keys(mapping)[i];
    if (mapping[path] == 'number') {
      data.push(corrWithPath(tree, path));
    }
  }
  return data;
}

function averagesForNumbers(tree, mapping) {
  var averages = [];
  for (let i = 0; i < Object.keys(mapping).length; i++) {
    var path = Object.keys(mapping)[i];
    if (mapping[path] == 'number') {
      averages.push([path, averageWithPath(tree, path)]);
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

function fRole(matches, role) {
  //""
  return matches.filter((m) => (role == m.participant.timeline.role));
}

function attach_stat(matches, name, gen) {
  for (let i = 0; i < matches.length; i++) {
    matches[i][name] = gen(matches[i]);
  }
}

function gpm(match) {
  return match.participant.stats.goldEarned / match.gameDuration;
}

function projSlice(path, objs) {
  var p = [];
  for (let i = 0; i < objs.length; i++) {
    p.push(getLeafWithPath(objs[i], path));
  }
  return p;
}

// Project into objects, return column-oriented
function getProjCWise(paths, objs) {
  var rv = {};
  for (let i = 0; i < paths.length; i++) {
    rv[paths[i]] = projSlice(paths[i], objs);
  }
  return rv;
}

// Project into objects, return row-oriented
function getProjRWise(paths, objs) {
  var rv = [paths];
  for (let i = 0; i < objs.length; i++) {
    var acc = [];
    for (let j = 0; j < paths.length; j++) {
      acc.push(getLeafWithPath(objs[i], paths[j]));
    }
    rv.push(acc);
  }
  return rv;
}

class ShowStat extends Component {

  render() {
    console.log('ShowStat.render', this.props, this.state);
    if (this.props.stats.length > 0) {
      //hackfilter
      var matches = fRole(this.props.stats[0].metrics.matches, 'DUO_CARRY');
      attach_stat(matches, 'gpm', gpm);

      var mapping = {};
      // Find best mapping
      var max = -1;
      for (let i = 0; i < matches.length; i++) {
        var new_map = {};
        DFS(matches[i], 'match', new_map);
        if (Object.keys(new_map).length > max) {
          mapping = new_map;
          max = Object.keys(new_map).length;
        }
      }
      console.log('Map', mapping);
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
            key,
            Math.round(averages[i][1] * 10) / 10.0,
            Math.round(w_data * 10) / 10.0,
            Math.round(l_data * 10) / 10.0,
            Math.round(c_data * 100, -3) / 100.0,
            Math.round((w_data - l_data) * 10) / 10.0,
          ]
        );
      }
      // Prep chart views
      var chartData = [];
      if (this.props.match.params.xstat) {
        var idxs = [this.props.match.params.xstat, this.props.match.params.ystat];
        var chartData = getProjRWise(idxs, matches);
      }
    }

    if (this.props.stats.length > 0) {
      if (this.props.match.params.xstat) {
        return (
          <div className={'my-pretty-chart-container'}>
            <Chart
              chartType="ScatterChart"
              data={chartData}
              options={{}}
              graph_id="ScatterChart"
              width="100%"
              height="400px"
              legend_toggle
            />
          </div>
        );
      } else {
        return (
          <div className="container">
            <div>N: { matches.length }</div>
            <h3>Averages</h3>
            <Table>
              <thead>
                <tr>
                  <td>Name</td>
                  <td>Average</td>
                  <td>Avg Win</td>
                  <td>Avg Loss</td>
                  <td>Corr: Win</td>
                  <td>Δ</td>
                </tr>
              </thead>
              <tbody>
                { merged.map((el) => {
                  return (<tr><td>{el[0]}</td><td>{el[1]}</td><td>{el[2]}</td><td>{el[3]}</td><td>{el[4]}</td><td>{el[5]}</td></tr>);
                })}
              </tbody>
            </Table>
          </div>
        );
      }
    }
    return (<div>Loading</div>);
  }
}

class AsyncApp extends Component {
  constructor(props) {
    console.log('########### AsyncApp.constructor');
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleRefreshClick = this.handleRefreshClick.bind(this);
  }

  componentDidMount() {
    console.log('Mounted with', this.props);
    const { dispatch, selectedSummoner } = this.props;
    if (this.props.match.topicId != selectedSummoner) {
      dispatch(selectSummoner(this.props.match.params.topicId));
    } else {
      dispatch(fetchStatsIfNeeded(selectedSummoner));
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedSummoner !== prevProps.selectedSummoner) {
      const { dispatch, selectedSummoner } = this.props;
      dispatch(fetchStatsIfNeeded(selectedSummoner));
    }
  }

  handleChange(nextSummoner) {
    this.props.dispatch(selectSummoner(nextSummoner));
    this.props.dispatch(fetchStatsIfNeeded(nextSummoner));
  }

  handleRefreshClick(e) {
    e.preventDefault();

    const { dispatch, selectedSummoner } = this.props;
    dispatch(invalidateSummoner(selectedSummoner));
    dispatch(fetchStatsIfNeeded(selectedSummoner));
  }

  render() {
    const { selectedSummoner, stats, isFetching, lastUpdated } = this.props;
    return (
      <div>
        <h2>{selectedSummoner}</h2>
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
        <div style={{ opacity: isFetching ? 0.5 : 1 }}>
          <ShowStat stats={stats} match={this.props.match} />
        </div>
      </div>
    );
  }
}

AsyncApp.propTypes = {
  selectedSummoner: PropTypes.string.isRequired,
  stats: PropTypes.array.isRequired,
  isFetching: PropTypes.bool.isRequired,
  lastUpdated: PropTypes.number,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { selectedSummoner, statsBySummoner } = state;
  const {
    isFetching,
    lastUpdated,
    items: stats,
  } = statsBySummoner[selectedSummoner] || {
    isFetching: true,
    items: [],
  };

  return {
    selectedSummoner,
    stats,
    isFetching,
    lastUpdated,
  };
}

export default connect(mapStateToProps)(AsyncApp);
