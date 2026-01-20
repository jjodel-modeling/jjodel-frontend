import "./require-polyfill";
import "./jquery-global";

import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

import './index.scss';
import {Provider} from 'react-redux';
import {store} from './joiner';
import App from './App';

import { createRoot } from "react-dom/client";

// Aspetta che il DOM sia pronto
const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }
  
  createRoot(rootElement).render(
    <Provider store={store}>
      <App />
    </Provider>
  );
};

// Monta l'app quando il DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
