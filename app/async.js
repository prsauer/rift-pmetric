import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Table, Button } from 'react-bootstrap';

import {
  Route,
} from 'react-router-dom';

import {
  selectSummoner,
  fetchStatsIfNeeded,
  invalidateSummoner,
  filterData,
  updateFilter,
} from './actions/actions';

import { averagesForNumbers, pCorrForNumbers } from './matchops/stats';
import { fWins, fLoss } from './matchops/filtering';
import { DFS } from './matchops/trees';

import ShowChart from './components/ShowChart';


// playerTimeline.46.jungleMinionsKilled
// playerTimeline.40.totalGold
// participant.stats.wardsKilled

function pathToPretty(path) {
  var parts = path.split('.');
  var pretty = [];
  for (let i = 0; i < parts.length; i++) {
    var piece = parts[i];
    if (piece == 'participant') continue;
    if (piece == 'stats') continue;
    if (piece == 'timeline') continue;
    if (piece == 'playerTimeline') { pretty.push('Minute '); continue; }
    if (!isNaN(piece)) { pretty.push(piece); continue; }
    pretty.push(piece.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()));
  }
  return pretty.join(' ');
}

class ShowStat extends Component {

  render() {
    console.log('ShowStat.render', this.props, this.state);
    var matches = this.props.matches;
    if (matches === []) {
      return (<div>Loading</div>);
    }

    var mapping = {};
    // Find best mapping
    var max = -1;
    for (let i = 0; i < matches.length; i++) {
      var new_map = {};
      DFS(matches[i], '', new_map);
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
          pathToPretty(key),
          Math.round(averages[i][1] * 10) / 10.0,
          Math.round(w_data * 10) / 10.0,
          Math.round(l_data * 10) / 10.0,
          Math.round(c_data * 100, -3) / 100.0,
          Math.round((w_data - l_data) * 10) / 10.0,
        ]
      );
      merged = merged.filter((el) => (Math.abs(el[4]) > 0.3));
      merged.sort((a, b) => (Math.abs(b[4]) - Math.abs(a[4])));
    }

    return (
      <div className="container">
        <div>{ matches.length } games represented.</div>
        <h3>Statistics for Ranked 2017</h3>
        <Table>
          <thead>
            <tr>
              <td>Metric</td>
              <td title="Average over all matches">μ</td>
              <td title="Average value on a Win">μ<sub>win</sub></td>
              <td title="Average value on a Loss">μ<sub>loss</sub></td>
              <td title="Correlation to Winning">ρ<sub>win</sub></td>
              <td title="Difference in average between Win and Loss">Δ</td>
            </tr>
          </thead>
          <tbody>
            { merged.map((el, id) => {
              return (
                <tr key={el.join()}>
                  <td>{el[0]}</td>
                  <td>{el[1]}</td>
                  <td>{el[2]}</td>
                  <td>{el[3]}</td>
                  <td>{el[4]}</td>
                  <td>{el[5]}</td>
                </tr>);
            })}
          </tbody>
        </Table>
      </div>
    );
  }
}

class AsyncApp extends Component {
  constructor(props) {
    console.log('########### AsyncApp.constructor');
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleRefreshClick = this.handleRefreshClick.bind(this);
    this.handleFilterClick = this.handleFilterClick.bind(this);
  }

  componentDidMount() {
    console.log('Mounted with', this.props);
    const { dispatch, selectedSummoner } = this.props;
    dispatch(filterData({win: true}));
    if (this.props.match.topicId != selectedSummoner) {
      dispatch(selectSummoner(this.props.match.params.summonerName));
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

  handleFilterClick(filter) {
    setTimeout(
      () => this.props.dispatch(updateFilter(filter)),
      500
    );
  }

  render() {
    const { selectedSummoner, stats, isFetching, lastUpdated, filteredMatchData } = this.props;
    return (
      <div>
        <Button onClick={(e) => {e.preventDefault(); this.handleFilterClick({role: 'DUO_CARRY'});}}>
          ADC
        </Button>
        <Button onClick={(e) => {e.preventDefault(); this.handleFilterClick({role: 'DUO_SUPPORT'});}}>
          SUPP
        </Button>
        <Button onClick={(e) => {e.preventDefault(); this.handleFilterClick({lane: 'MID'});}}>
          MID
        </Button>
        <Button onClick={(e) => {e.preventDefault(); this.handleFilterClick({lane: 'TOP'});}}>
          TOP
        </Button>
        <Button onClick={(e) => {e.preventDefault(); this.handleFilterClick({lane: 'JUNGLE'});}}>
          JG
        </Button>
        <h2>{selectedSummoner}</h2>
        {
          stats[0] &&
          <Route exact path="/summoner/:summonerName/" render={(props) => (
            <ShowChart match={this.props} matches={filteredMatchData.matches} />
          )} />
        }
        <p>
          {lastUpdated && false &&
            <span>
              Last updated at {new Date(lastUpdated).toLocaleTimeString()}.
              {' '}
            </span>}
          {!isFetching && false &&
            <a href="#" onClick={this.handleRefreshClick}>
              Refresh
            </a>}
        </p>
        {isFetching && <h2>Loading...</h2>}
        <div style={{ opacity: isFetching ? 0.5 : 1 }}>
          <ShowStat matches={filteredMatchData.matches} match={this.props.match} />
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
  const { selectedSummoner, statsBySummoner, filteredMatchData } = state;
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
    filteredMatchData,
  };
}

export default connect(mapStateToProps)(AsyncApp);
