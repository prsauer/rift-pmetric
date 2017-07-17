import React, { Component } from 'react';

import { VictoryChart, VictoryScatter, VictoryTheme } from 'victory';
import { Link } from 'react-router-dom';

import queryString from 'query-string';

import { getProjRWise } from '../matchops/chartprep';
import { pathToPretty } from '../matchops/util';

export default class ProgressChart extends Component {
  render() {
    var matches = this.props.matches;
    console.log('ProgressChart.render', this.props);
    const parsed = queryString.parse(this.props.match.location.search);
    if (parsed.x == undefined ) {
      return (null);
    }

    var winData = matches.filter(el => el.participant.stats.win);
    var lossData = matches.filter(el => !el.participant.stats.win);

    var idxs = ['gameCreation', parsed.x];
    var prettyName = pathToPretty(parsed.x);
    winData = getProjRWise(idxs, winData);
    lossData = getProjRWise(idxs, lossData);

    return (
      <div className={'my-pretty-chart-container'}>
        <h4>{ prettyName } over Time</h4>
        <VictoryChart
          theme={VictoryTheme.material}
          scale={{x: 'time', y: 'linear'}}
        >
          <VictoryScatter
            style={{ data: { fill: '#32DF00', fillOpacity: 0.25 } }}
            size={4}
            data={
              winData
            }
          />
          <VictoryScatter
            style={{ data: { fill: '#FF4848', fillOpacity: 0.25 } }}
            size={4}
            data={
              lossData
            }
          />
        </VictoryChart>    
        <Link to={`/summoner/${this.props.match.selectedSummoner}`}>Close chart</Link>    
      </div>
    );
  }
}
