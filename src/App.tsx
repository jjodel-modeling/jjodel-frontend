import React from 'react';
import logo from './logo.svg';
import './App.css';
import ModelPiece from "./components/modelling/modelpiece/modelpiece";
import TabContainerComponent from "./components/main/main";
import DockLayoutComponent from "./components/abstract/DockLayoutComponent";

function App() {
  return (
    <div className="App">
      <header className="App-header" style={{display: "none"}}>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <DockLayoutComponent />
        { //<TabContainerComponent/>
        }
      <h1>ModelPiece</h1>
      <ModelPiece backgroundColor={'red'} />
    </div>
  );
}

export default App;
