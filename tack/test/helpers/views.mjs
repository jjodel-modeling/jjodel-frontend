// Runs the board's page scripts (charts.js, board.js, timeline.js, insights.js) in a vm context without
// a DOM: each script exposes its pure helpers on the context and skips its DOM wiring.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const FILES = ['charts.js', 'board.js', 'timeline.js', 'insights.js'];

export function loadViews(files = FILES) {
  const ctx = vm.createContext({});
  for (const f of files) vm.runInContext(readFileSync(new URL(`../../src/board/${f}`, import.meta.url), 'utf8'), ctx, { filename: f });
  return ctx;
}
