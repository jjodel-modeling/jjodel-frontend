/** Dove esce il testo dal contorno: sweep sulla lunghezza dell'etichetta, nodo 170x80. */
import { chromium } from '@playwright/test';
import { STATES, openState } from '../smoke/states.ts';
const browser = await chromium.launch();
const opened = await openState(browser, STATES.find((s) => s.id === 'empty-metamodel-tab')!);
const res = await opened.page.evaluate(async () => {
    const mod: any = await import('/src/components/editor-v2/viewpoint/ir/irStyle.ts');
    mod.ensureViewCss('probe-view', {});
    const vp = document.querySelector('.react-flow__viewport') as HTMLElement;
    const svg = `<svg class="ir-diamond-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,0 100,50 50,100 0,50" fill="var(--node-bg)" stroke="var(--border-default)" stroke-width="1"/></svg>`;
    const rows: any[] = [];
    for (const form of ['diamond', 'ellipse']) {
        for (const len of [6, 10, 14, 18, 22, 26, 30, 36]) {
            const n = document.createElement('div');
            n.className = 'react-flow__node';
            n.style.cssText = 'transform:translate(0,0);width:170px;height:80px';
            n.innerHTML = `<div class="mm-node mm-object ir-sized"><div class="ir-node-content ir-shape--${form}">${form === 'diamond' ? svg : ''}<span class="ir-label ir-label--center" data-role="label">${'M'.repeat(0) + 'Controller'.padEnd(len, 'x').slice(0, len)}</span></div></div>`;
            vp.appendChild(n);
            const box = n.querySelector('.ir-node-content')!.getBoundingClientRect();
            const el = n.querySelector('[data-role="label"]') as HTMLElement;
            const rg = document.createRange(); rg.selectNodeContents(el);
            const lb = rg.getBoundingClientRect();   // ink, non lo span
            const span = el.getBoundingClientRect();
            const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
            const ins = [[lb.left, lb.top], [lb.right, lb.top], [lb.left, lb.bottom], [lb.right, lb.bottom]].every(([x, y]) => {
                const u = Math.abs(x - cx) / (box.width / 2), v = Math.abs(y - cy) / (box.height / 2);
                return form === 'diamond' ? u + v <= 1.0001 : u * u + v * v <= 1.0001;
            });
            rows.push({ form, chars: len, inkW: +lb.width.toFixed(1), spanW: +span.width.toFixed(1), inside: ins });
            n.remove();
        }
    }
    return rows;
});
console.log(JSON.stringify(res));
await browser.close();
