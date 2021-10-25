import './App.css';
import Navbar from './components/Navbar';
import Home from './views/Home';
import Recommendation from './views/Recommendation';
import Explore from './views/Explore';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import Patterns from './views/Patterns';

export default function App() {
  return (
    <Router>
      <div>
        <Navbar/>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/recommendation">
            <Recommendation />
          </Route>
          <Route path="/explore">
            <Explore />
          </Route>
          <Route path="/patterns">
            <Patterns />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}