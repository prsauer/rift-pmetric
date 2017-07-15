import React, { Component } from 'react';

import { VictoryChart, VictoryScatter, VictoryTheme } from 'victory';

import queryString from 'query-string';

import { getProjRWise } from '../matchops/chartprep';


export default class ShowChart extends Component {
  render() {
    console.log("ChartRender", this.props);
    const parsed = queryString.parse(this.props.match.location.search);
    if (parsed.x == undefined || parsed.y == undefined) {
      return (null);
    }
    var idxs = [parsed.x, parsed.y];
    var chartData = getProjRWise(idxs, this.props.matches);
    console.log('CHARTING', chartData);
    return (
      <div className={'my-pretty-chart-container'}>
        <VictoryChart
          theme={VictoryTheme.material}
          scale={{x: 'time', y: 'linear'}}
        >
          <VictoryScatter
            style={{ data: { fill: '#c43a31' } }}
            size={7}
            data={
              chartData
            }
          />
        </VictoryChart>
      </div>
    )
  }
}
