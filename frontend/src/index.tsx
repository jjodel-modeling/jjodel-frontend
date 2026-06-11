import "./require-polyfill";
import "./jquery-global";

// THROWAWAY (Phase 2a): boot-anchor for the dev probe so window.__seedIRViewProbe
// registers reliably at startup, instead of depending on the deep barrel re-export
// chain (joiner -> ExecuteOnRead -> components -> IRView -> side-effect import).
// Dev-only gate lives inside __irviewProbe.ts. Remove this line with the probe.
import "./ai/viewpointIR/__irviewProbe";

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
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
// @ts-ignore
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
// @ts-ignore
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
// @ts-ignore
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
// @ts-ignore
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
// @ts-ignore
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// console.log("monaco workers load", {EditorWorker, JsonWorker, CssWorker, HtmlWorker, TsWorker});
// Configura @monaco-editor/react per usare l'istanza locale invece del CDN
loader.config({ monaco });

// Configura i workers per Vite (?worker syntax works in both dev and build)
(self as any).MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') return new JsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
    if (label === 'typescript' || label === 'javascript') return new TsWorker();
    return new EditorWorker();
  }
};
/*(self as any).MonacoEnvironment = {
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
};*/
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