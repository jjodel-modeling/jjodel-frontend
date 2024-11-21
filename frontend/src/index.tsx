import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './index.scss';
import {Provider} from 'react-redux';
import {store} from './joiner';
import App from './App';
/*
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';*/

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);
/*
// enable offline PWA and 1-time loading
serviceWorkerRegistration.register();
reportWebVitals(console.warn); // optional
*/
