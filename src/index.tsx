import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'react-tooltip/dist/react-tooltip.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import App from './App';
import {Provider} from "react-redux";
import {jodelInit, store} from "./joiner";

function start() {
    jodelInit();
    ReactDOM.render(
        <Provider store={store}>
            <App/>
        </Provider>,
        document.getElementById('root')
    );
}

setTimeout(start, 10);

