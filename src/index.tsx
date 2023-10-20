import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './index.scss';
import {Provider} from "react-redux";
import {jodelInit, store} from "./joiner";
import Router from "./router/Router";


function start() {
    jodelInit();
    ReactDOM.render(
        <Provider store={store}>
            <Router />
        </Provider>,
        document.getElementById('root')
    );
}
setTimeout(start, 10);

