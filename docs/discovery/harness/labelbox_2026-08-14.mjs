import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await b.newPage({ viewport: { width: 1400, height: 1200 } });
await p.goto('file://' + join(HERE, 'labelbox_2026-08-14.html'));
await p.waitForTimeout(300);
const out = await p.evaluate(() => {
  const r = [];
  for (const n of document.querySelectorAll('[data-case]')) {
    const box = n.querySelector('.ir-node-content');
    const label = n.querySelector('[data-probe="label"]');
    const svg = n.querySelector('[data-probe="svg"]');
    const bb = box.getBoundingClientRect();
    const lb = label.getBoundingClientRect();
    const cs = getComputedStyle(box);
    r.push({
      case: n.dataset.case,
      boxW: +bb.width.toFixed(1), boxH: +bb.height.toFixed(1),
      padL: cs.paddingLeft, padR: cs.paddingRight,
      contentW: +(bb.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2).toFixed(1),
      labelW: +lb.width.toFixed(1),
      labelLeftOffset: +(lb.left - bb.left).toFixed(1),
      svgW: svg ? +svg.getBoundingClientRect().width.toFixed(1) : null,
      svgLeftOffset: svg ? +(svg.getBoundingClientRect().left - bb.left).toFixed(1) : null,
      textOverflows: label.scrollWidth > label.clientWidth + 0.5,
    });
  }
  return r;
});
console.log(JSON.stringify(out, null, 1));
await p.screenshot({ path: join(HERE, 'labelbox_2026-08-14.png'), fullPage: true });
await b.close();
