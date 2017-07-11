import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  selectSubreddit,
  fetchStatsIfNeeded,
  invalidateSubreddit
} from './actions/actions'

class ShowStat extends Component {
  render() {
    console.log(this.props.stats);
    if (this.props.stats.length > 0) {
      return (
            <div>Stats: { this.props.stats[0].cs }</div>
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
    const { dispatch, selectedSubreddit } = this.props
    dispatch(fetchStatsIfNeeded(selectedSubreddit))
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedSubreddit !== prevProps.selectedSubreddit) {
      const { dispatch, selectedSubreddit } = this.props
      dispatch(fetchStatsIfNeeded(selectedSubreddit))
    }
  }

  handleChange(nextSubreddit) {
    this.props.dispatch(selectSubreddit(nextSubreddit))
    this.props.dispatch(fetchStatsIfNeeded(nextSubreddit))
  }

  handleRefreshClick(e) {
    e.preventDefault()

    const { dispatch, selectedSubreddit } = this.props
    dispatch(invalidateSubreddit(selectedSubreddit))
    dispatch(fetchStatsIfNeeded(selectedSubreddit))
  }

  render() {
    const { selectedSubreddit, stats, isFetching, lastUpdated } = this.props
    return (
      <div>
        <div
          value={selectedSubreddit}
          onChange={this.handleChange}
          options={['reactjs', 'frontend']}
        />
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
        {!isFetching && <h2>Empty.</h2>}
        {
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <ShowStat stats={stats} />
          </div>}
      </div>
    )
  }
}

AsyncApp.propTypes = {
  selectedSubreddit: PropTypes.string.isRequired,
  stats: PropTypes.array.isRequired,
  isFetching: PropTypes.bool.isRequired,
  lastUpdated: PropTypes.number,
  dispatch: PropTypes.func.isRequired
}

function mapStateToProps(state) {
  const { selectedSubreddit, statsBySubreddit } = state
  const {
    isFetching,
    lastUpdated,
    items: stats
  } = statsBySubreddit[selectedSubreddit] || {
    isFetching: true,
    items: []
  }

  return {
    selectedSubreddit,
    stats,
    isFetching,
    lastUpdated
  }
}

export default connect(mapStateToProps)(AsyncApp)