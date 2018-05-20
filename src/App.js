import React, { Component } from 'react';
import './App.css';

import Tree from './Tree';

const treeData = [
  {
    name: "Artificial Intelligence",
    children: [
      {
        name: "Engine Intelligence"
      },
      {
        name: "Engine Intelligence",
        children: [
          {
            name: "Neuro-like networks",
            children: [
              {
                name: "Heuristic Modeling",
                anotherParent: "Heuristic Programming"
              }
            ]
          },
          {
            name: "Heuristic Programming"
          }
        ]
      }
    ]
  }
];

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Tree Diagram AI</h1>
        </header>
        <Tree
          data={treeData}
        />
      </div>
    );
  }
}

export default App;
