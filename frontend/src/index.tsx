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

// ✅ MONACO SETUP - IMPORTANTE: loader.config PRIMA di MonacoEnvironment

// Configura i workers per Vite
(self as any).MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new Worker(
        new URL('../node_modules/monaco-editor/esm/vs/language/json/json.worker', import.meta.url),
        { type: 'module' }
      );
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new Worker(
        new URL('../node_modules/monaco-editor/esm/vs/language/css/css.worker', import.meta.url),
        { type: 'module' }
      );
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new Worker(
        new URL('../node_modules/monaco-editor/esm/vs/language/html/html.worker', import.meta.url),
        { type: 'module' }
      );
    }
    if (label === 'typescript' || label === 'javascript') {
      return new Worker(
        new URL('../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url),
        { type: 'module' }
      );
    }
    return new Worker(
      new URL('../node_modules/monaco-editor/esm/vs/editor/editor.worker', import.meta.url),
      { type: 'module' }
    );
  }
};
// ✅ FINE MONACO SETUP

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

// Performance benchmarking utilities (available in browser console)
import './utils/PerformanceMetrics';
import './utils/CanvasBenchmark';
import './utils/DragThrottle';
import './utils/BatchedUpdates';
import './utils/LazyOCL';
import './utils/ViewportCulling';
import './utils/__tests__/UDComparator.test';