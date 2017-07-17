import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Table, Button, Col } from 'react-bootstrap';
import { champdata } from '../api/champdata';

import {
  Route,
  Link,
} from 'react-router-dom';

import {
  selectSummoner,
  fetchStatsIfNeeded,
  invalidateSummoner,
  filterData,
} from './actions/actions';

import ShowChart from './components/ShowChart';
import WinLossScatter from './components/WinLossScatter';
import ProgressChart from './components/ProgressChart';


import { getProjRWise } from './matchops/chartprep';

class ChampionIcon extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  handleClick() {
    console.log('click');
    this.props.dispatch(filterData({champion: this.props.id}));
  }
  render() {
    return (
      <img onClick={this.handleClick} src={`https://ddragon.leagueoflegends.com/cdn/7.13.1/img/champion/${this.props.name}.png`} width={this.props.size} height={this.props.size} alt={this.props.name} />
    )
  }
}
function mapSP(state) {
  return {
    filteredMatchData: state.filteredMatchData,
  };
}

ChampionIcon = connect(mapSP)(ChampionIcon);

class ShowStat extends Component {

  render() {
    console.log('ShowStat.render', this.props, this.state);
    var imageSize = 40;
    var matches = this.props.matches;
    var summonerName = this.props.summonerName;
    if (matches === []) {
      return (<div>Loading</div>);
    }
    var champs = getProjRWise(['participant.championId', 'participant.championId'], matches);
    champs = champs.map((el) => [champdata[el.x].id, el.x]);
    console.log("Interim", champs);
    champs = champs.reduce((acc, curr, idx) => {
      let cname = curr[0];
      acc[curr[0]] = acc[cname] ? [cname, acc[cname][1] + 1, curr[1]] : [cname, 1, curr[1]];
      return acc;
    }, {});
    console.log("Interim1", champs);
    champs = Object.values(champs).sort((a, b) => b[1] - a[1]);
    console.log("Interim2", champs);
    champs = champs.map((e) =>
      [
        e[0],
        Math.max(15, imageSize * Math.log(10 * (Math.max(e[1] / champs[0][1], 0.1)))),
        e[2],
      ]
    );
    console.log("OV", champs);
    return (
      <div className="container">
        <div>{ matches.length } games represented.</div>
        <h3>Statistics for Ranked 2017</h3>
        {
          champs.map((data) =>
            <ChampionIcon name={data[0]} size={data[1]} id={data[2]} />
          )
        }
        <Table>
          <thead>
            <tr>
              <td>Metric</td>
              <td title="Average over all matches">μ</td>
              <td title="Average value on a Win">μ<sub>win</sub></td>
              <td title="Average value on a Loss">μ<sub>loss</sub></td>
              <td title="Correlation to Winning">ρ<sub>win</sub></td>
              <td title="Difference in average between Win and Loss">Δ</td>
              <td title="Chart links">#</td>
            </tr>
          </thead>
          <tbody>
            { this.props.merged && this.props.merged.map((el, id) => {
              return (
                <tr key={el.join()}>
                  <td title={el[6]}>{el[0]}</td>
                  <td>{el[1]}</td>
                  <td>{el[2]}</td>
                  <td>{el[3]}</td>
                  <td>{el[4]}</td>
                  <td><Link to={`/summoner/${summonerName}/scatter/?x=${el[6]}`}>{el[5]}</Link></td>
                  <td><Link to={`/summoner/${summonerName}/progress/?x=${el[6]}`}>τ</Link></td>
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
      () => this.props.dispatch(filterData(filter)),
      500
    );
  }

  render() {
    console.log('AsyncApp.render', this.props);
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
        <div className="container" style={{height: 350}}>
          <Col md={3} />
          {
            stats[0] &&
            <Route exact path="/summoner/:summonerName/" render={(props) => (
              <Col md={6}><ShowChart match={this.props} matches={filteredMatchData.matches} /></Col>
            )} />
          }
          {
            stats[0] &&
            <Route exact path="/summoner/:summonerName/scatter/" render={(props) => (
              <Col md={6}><WinLossScatter match={this.props} matches={filteredMatchData.matches} /></Col>
            )} />
          }
          {
            stats[0] &&
            <Route exact path="/summoner/:summonerName/progress/" render={(props) => (
              <Col md={6}><ProgressChart match={this.props} matches={filteredMatchData.matches} /></Col>
            )} />
          }
          <Col md={3} />
          <Col md={12}>
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
            {!filteredMatchData.ready && <h2>Loading...</h2>}
            <div style={{ opacity: filteredMatchData.ready ? 1 : 0.5 }}>
              <ShowStat
                summonerName={selectedSummoner}
                matches={filteredMatchData.matches}
                match={this.props.match}
                merged={filteredMatchData.merged}
              />
            </div>
          </Col>
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
  const { selectedSummoner, statsBySummoner, filteredMatchData, merged, mapping } = state;
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
    mapping,
    merged,
  };
}

export default connect(mapStateToProps)(AsyncApp);
