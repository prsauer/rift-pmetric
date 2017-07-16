import React, { Component } from 'react';

import { VictoryChart, VictoryScatter, VictoryTheme } from 'victory';
import { Link } from 'react-router-dom';

import queryString from 'query-string';

import { getProjRWise } from '../matchops/chartprep';
import { pathToPretty } from '../matchops/util';

export default class WinLossScatter extends Component {
  render() {
    console.log('WinLossScatter.render', this.props);
    const parsed = queryString.parse(this.props.match.location.search);
    if (parsed.x == undefined ) {
      return (null);
    }
    var idxs = ['participant.stats.win', parsed.x];
    var prettyName = pathToPretty(parsed.x);
    var chartData = getProjRWise(idxs, this.props.matches);
    chartData.map((el) => (el.x = el.x ? 1 : 2) );
    var winData = chartData.filter(el => el.x == 1);
    var lossData = chartData.filter(el => el.x == 2);
    return (
      <div className={'my-pretty-chart-container'}>
        <h4>Win/Loss Distriubtion for { prettyName }</h4>
        <VictoryChart
          theme={VictoryTheme.material}
          scale={{x: 'linear', y: 'linear'}}
          domain={{x: [0, 3]}}
        >
          <VictoryScatter
            style={{ data: { fill: '#32DF00', fillOpacity: 0.25 } }}
            categories={{ x: ['Win', 'Loss'] }}
            size={4}
            data={
              winData
            }
          />
          <VictoryScatter
            style={{ data: { fill: '#FF4848', fillOpacity: 0.25 } }}
            categories={{ x: ['Win', 'Loss'] }}
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
