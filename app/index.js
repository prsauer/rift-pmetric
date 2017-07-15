import {render} from 'react-dom';
import React from 'react';
import {
  BrowserRouter,
  Route,
} from 'react-router-dom';

import { Nav, Navbar, NavItem } from 'react-bootstrap';

import { Provider } from 'react-redux';
import configureStore from './configureStore';
import AApp from './async';

const store = configureStore();

const Home = () => (
  <div>
    <h2>Home</h2>
  </div>
);


const SummonerPage = (props) => {
  console.log('SummonerPageRender', props);
  return (
    <div>
      <AApp {...props} />
    </div>
  );
};


const RoutedContent = () => (
  <BrowserRouter>
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
      <Route history={history} path="/summoner/:summonerName" component={SummonerPage} />
    </div>
  </BrowserRouter>
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

