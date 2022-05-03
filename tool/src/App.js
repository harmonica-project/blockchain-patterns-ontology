import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Home from './views/Home';
import Recommendation from './views/Recommendation';
import Explore from './views/Explore';
import Patterns from './views/Patterns';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

export default function App() {
  const [nbPatterns, setNbPatterns] = useState(0);

  return (
    <Router>
      <div>
        <Navbar nbPatterns={nbPatterns} />
        <Switch>
          <Route path="/explore">
            <Explore setNbPatterns={setNbPatterns} />
          </Route>
          <Route path="/recommendation">
            <Recommendation setNbPatterns={setNbPatterns} />
          </Route>
          <Route path="/patterns">
            <Patterns setNbPatterns={setNbPatterns} />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
