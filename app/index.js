import {render} from 'react-dom';
import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Link,
} from 'react-router-dom';

import { Nav, Navbar, NavItem } from 'react-bootstrap';

import { Provider } from 'react-redux';
import configureStore from './configureStore';
import AApp from './async.js';

const store = configureStore();

const Home = () => (
  <div>
    <h2>Home</h2>
  </div>
);

const Topic = ({ match }) => (
  <div>
    <AApp match={match} />
  </div>
);

const Topics = ({ match }) => (
  <div>
    <Route path={`${match.url}/:topicId/:xstat?/:ystat?`} component={Topic} />
  </div>
);

const RoutedContent = () => (
  <Router>
    <div className="container">
      <Navbar>
        <Navbar.Header>
          <Navbar.Brand>
            <a href="#">R-M</a>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Nav>
          <NavItem eventKey={1} href="#">Home</NavItem>
        </Nav>
      </Navbar>
      <Route exact path="/" component={Home} />
      <Route path="/data" component={Topics} />
    </div>
  </Router>
);

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <RoutedContent />
      </Provider>
    );
  }
}

render(<App />, document.getElementById('app'));

