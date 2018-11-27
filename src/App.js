import React, { Component } from 'react';
import './App.css';
import {RouterLink, RouterView} from "./route/index";

class App extends Component {
  render() {
    return (
      <div className="App">

          <ul>
              <li><RouterLink to={"/a"}>/a</RouterLink></li>
              <li><RouterLink to={"/b"}>/b</RouterLink></li>
              <li><RouterLink to={"/a/c"}>/a/c</RouterLink></li>
              <li><RouterLink to={"/a/d"}>/a/d</RouterLink></li>
              <li><RouterLink to={"/a/c/b"}>/a/c/b</RouterLink></li>
          </ul>
          <RouterView></RouterView>

      </div>
    );
  }
}

export default App;
