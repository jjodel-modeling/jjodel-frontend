import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'react-tooltip/dist/react-tooltip.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {Provider} from "react-redux";
import {jodelInit, store} from "./joiner";

function start(){
    jodelInit();
    ReactDOM.render(
        // <React.StrictMode> <App /> </React.StrictMode>,
        // eslint-disable-next-line react/jsx-no-undef
        <Provider store={store}><App/></Provider>,
        document.getElementById('root')
    );
}

setTimeout(start, 2);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

