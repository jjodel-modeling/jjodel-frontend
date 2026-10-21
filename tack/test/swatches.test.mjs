// Slice 9, follow-up (b) of P-2026-10-21-1015: the stop swatches told apart by luminance. WCAG contrast between two
// colours is (L1 + 0.05) / (L2 + 0.05); pairwise 3:1 holds for at most three fills on one page (3^3 = 27 > 21), so the
// three fills are breakpoint, hard-stop and the tag that every other outcome sits on; ceiling has no fill, and its
// outline ink is held to 3:1 against the page. Read from board.css, per theme.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CSS = readFileSync(new URL('../src/board/board.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a, b) => { const x = lum(a) + 0.05, y = lum(b) + 0.05; return Math.max(x, y) / Math.min(x, y); };

/** The custom properties of every rule whose selector matches sel exactly, later rules winning. */
function vars(sel) {
  const out = {};
  for (const m of CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!m[1].split(',').map((s) => s.trim()).includes(sel)) continue;
    for (const d of m[2].matchAll(/(--t-[\w-]+):\s*(#[0-9A-Fa-f]{6})/g)) out[d[1]] = d[2];
  }
  return out;
}
const light = vars(':root');
const THEMES = {
  light,
  dark: { ...light, ...vars(':root[data-theme=dark]') },
  'dark (system)': { ...light, ...vars(':root:not([data-theme])') },
  'high-contrast': { ...light, ...vars(':root[data-theme=high-contrast]') },
};

test('positive control: the previous breakpoint slate and hard-stop amber text did not reach 3:1 on the dark tag', () => {
  assert.ok(contrast('#475569', '#1D1F25') < 3);
  assert.ok(contrast('#B7791F', '#2E9E66') < 3, 'hard-stop amber against done green, both text on the tag');
  assert.ok(contrast('#000000', '#FFFFFF') > 20.9);
});

for (const [name, v] of Object.entries(THEMES)) {
  test(`swatches, ${name} page: breakpoint, hard-stop and the tag reach 3:1 between each other; inks and the ceiling outline 3:1`, () => {
    for (const k of ['--t-bp', '--t-hs', '--t-tag', '--t-content', '--t-text2', '--t-bp-ink', '--t-hs-ink']) assert.ok(v[k], `${name}: ${k} declared`);
    const fills = { breakpoint: v['--t-bp'], 'hard-stop': v['--t-hs'], 'other outcomes (tag)': v['--t-tag'] };
    const names = Object.keys(fills);
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
      const r = contrast(fills[names[i]], fills[names[j]]);
      assert.ok(r >= 3, `${name}: ${names[i]} ${fills[names[i]]} vs ${names[j]} ${fills[names[j]]} is ${r.toFixed(2)}:1`);
    }
    assert.ok(contrast(v['--t-bp-ink'], v['--t-bp']) >= 4.5, `${name}: breakpoint label`);
    assert.ok(contrast(v['--t-hs-ink'], v['--t-hs']) >= 4.5, `${name}: hard-stop label`);
    assert.ok(contrast(v['--t-text2'], v['--t-content']) >= 3, `${name}: ceiling outline ink against the page`);
  });
}
