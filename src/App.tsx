import React, {Component, PureComponent} from 'react';
import logo from './logo.svg';
import './App.scss';
import {U, DockLayoutComponent} from "./joiner";
interface AllProps{}
interface MPState{}

class App extends PureComponent<AllProps, MPState>{
    constructor(props: Readonly<AllProps> | AllProps) {
        super(props);
    }
    render() {
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

            </div>
        );
    }
}

export default App;
