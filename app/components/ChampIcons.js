import React, { Component } from 'react';
import { connect } from 'react-redux';

import { getProjRWise } from '../matchops/chartprep';
import { champdata } from '../../api/champdata';

import {
  filterData,
} from '../actions/actions';


class ChampionIcon extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.mouseEnter = this.mouseEnter.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this.state = {size: undefined};
    this.imageDefaultSize = 100;
  }
  mouseEnter() {
    this.setState({opac: 1.0});
  }
  mouseLeave() {
    this.setState({opac: undefined});
  }
  handleClick() {
    if (this.props.id == this.props.selected) {
      this.props.dispatch(filterData({champion: undefined}));
    } else {
      this.props.dispatch(filterData({champion: this.props.id}));      
    }
  }
  render() {
    var size = Math.max(this.imageDefaultSize * this.props.size, 45);

    return (
      <span style={{ position: 'relative', width: size, height: size, display: 'inline-block', opacity: this.state.opac || this.props.opacity}} >
        <img
          className="clickablePort"
          onClick={this.handleClick}
          onMouseEnter={this.mouseEnter}
          onMouseLeave={this.mouseLeave}
          src={`https://ddragon.leagueoflegends.com/cdn/7.13.1/img/champion/${this.props.name}.png`}
          width={size}
          height={size}
          alt={`${this.props.name} - ${this.props.numberOfGames} games`}
        />
        <p style={{position: 'absolute', top: 0, left: 5 }}>{ this.props.numberOfGames }</p>
      </span>
    )
  }
}
function mapSP(state) {
  return {
    filteredMatchData: state.filteredMatchData,
  };
}
ChampionIcon = connect(mapSP)(ChampionIcon);

class ChampIcons extends Component {
  render() {
    var matches = this.props.matches;
    var selected = this.props.filter.champion;
    var champs = getProjRWise(['participant.championId', 'participant.championId'], matches);
    champs = champs.map((el) => [champdata[el.x].id, el.x]);
    champs = champs.reduce((acc, curr, idx) => {
      let cname = curr[0];
      acc[curr[0]] = acc[cname] ? [cname, acc[cname][1] + 1, curr[1]] : [cname, 1, curr[1]];
      return acc;
    }, {});
    champs = Object.values(champs).sort((a, b) => b[1] - a[1]);
    var max = champs[0] ? champs[0][1] : 1;
    champs = champs.map((e) => {
      var sz = Math.log10(10 * (Math.max(e[1] / max, 0.1)));
      return [
        e[0],
        sz,
        e[2],
        selected ? (e[2] == selected ? 1.0 : 0.25) : Math.max(sz, 0.5),
        e[1],
      ];
    }
    );

    return (
      <div>
        {
          champs.map((data) =>
            (<ChampionIcon
              key={data[0] + data[1]}
              name={data[0]}
              size={data[1]}
              opacity={data[3]}
              id={data[2]}
              selected={selected}
              numberOfGames={data[4]}
            />)
          )
        }
      </div>
    );
  }
}

export default ChampIcons;