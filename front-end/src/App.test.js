import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './Login';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={Login} />
        {/* Add other routes here */}
      </Switch>
    </Router>
  );
};

export default App;
