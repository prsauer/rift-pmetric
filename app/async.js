import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  selectSummoner,
  fetchStatsIfNeeded,
  invalidateSummoner
} from './actions/actions'
import { withRouter } from 'react-router-dom'

class ShowStat extends Component {
  render() {
    console.log(this.props.stats);
    if (this.props.stats.length > 0) {
      return (
          <div>
            <div>CS Average: { this.props.stats[0].metrics.cs.mean }</div>
            <div>CSd10 Average: { this.props.stats[0].metrics.csd10.mean }</div>
            <div>Dump: { JSON.stringify(this.props.stats[0].metrics) }</div>
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
