/**
 * Politica "dimensione ulteriore al contenuto": il box di una forma geometrica
 * si ricava dal contenuto piu' un supplemento dettato dal contorno.
 *
 *   B_h = max(Hmin, k · h)                    supplemento verticale (headroom)
 *   B_w = w / (1 - 2·inset(bordo della banda)) larghezza dal contorno
 *
 * con inset = il profilo di semilarghezza gia' in shapeRegistry.
 * Verifica: il testo sta dentro il contorno? e quanto costa in pixel?
 */
import { chromium } from '@playwright/test';
import { STATES, openState } from '../smoke/states.ts';

const browser = await chromium.launch();
const opened = await openState(browser, STATES.find((s) => s.id === 'empty-metamodel-tab')!);

await opened.page.waitForTimeout(4000);
await opened.page.waitForSelector('.react-flow__viewport', { state: 'attached', timeout: 20000 });
const res = await opened.page.evaluate(async () => {
    const mod: any = await import('/src/components/editor-v2/viewpoint/ir/irStyle.ts');
    mod.ensureViewCss('probe-view', {});
    const vp = document.querySelector('.react-flow__viewport') as HTMLElement;
    const svg = `<svg class="ir-diamond-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,0 100,50 50,100 0,50" fill="var(--node-bg)" stroke="var(--border-default)" stroke-width="1"/></svg>`;

    const HMIN = 48;
    const K = { ellipse: Math.SQRT2, diamond: 2 };
    const inset = {
        ellipse: (t: number) => (1 - Math.sqrt(1 - (2 * t - 1) ** 2)) / 2,
        diamond: (t: number) => Math.abs(t - 0.5),
    };

    function mount(form: string, html: string, w?: number, h?: number) {
        const n = document.createElement('div');
        n.className = 'react-flow__node';
        n.style.cssText = `transform:translate(0,0);${w ? `width:${w}px;height:${h}px` : ''}`;
        n.innerHTML = `<div class="mm-node mm-object${w ? ' ir-sized' : ''}"><div class="ir-node-content ir-shape--${form}">${form === 'diamond' ? svg : ''}${html}</div></div>`;
        vp.appendChild(n);
        return n;
    }

    const CONTENTS: Array<[string, string]> = [
        ['label corta', `<span class="ir-label ir-label--center" data-role="c">Light</span>`],
        ['label media', `<span class="ir-label ir-label--center" data-role="c">TrafficLightController</span>`],
        ['label lunga', `<span class="ir-label ir-label--center" data-role="c">TrafficLightControllerConfiguration</span>`],
        ['label + 2 righe', `<div data-role="c" style="display:flex;flex-direction:column;align-items:center"><span class="ir-label">TrafficLight</span><span class="ir-label">state : int</span><span class="ir-label">timer : int</span></div>`],
    ];

    const out: any[] = [];
    for (const form of ['ellipse', 'diamond'] as const) {
        for (const [name, html] of CONTENTS) {
            // 1. misura il contenuto a larghezza naturale (nessun box che lo vincoli)
            const probe = mount(form, html);
            const cEl = probe.querySelector('[data-role="c"]') as HTMLElement;
            const rg = document.createRange(); rg.selectNodeContents(cEl);
            const ink = rg.getBoundingClientRect();
            const w = ink.width, h = ink.height;
            probe.remove();

            // 2. applica la politica
            const Bh = Math.max(HMIN, K[form] * h);
            const t = 0.5 + h / (2 * Bh);
            const avail = 1 - 2 * inset[form](t);
            // ceil, non round: arrotondare per difetto toglie il pixel che serviva.
            // Pavimento d'aspetto: una forma non piu' stretta di 0.8 volte la sua altezza,
            // altrimenti un'etichetta corta produce una lente verticale.
            const Bw = Math.max(Math.ceil(w / avail), Math.ceil(0.8 * Bh));

            // 3. rimonta alla dimensione calcolata e verifica il contenimento dell'inchiostro
            // il box vive dentro .mm-node, che porta 1px di bordo per lato
            const n = mount(form, html, Bw + 2, Math.ceil(Bh) + 2);
            const box = n.querySelector('.ir-node-content')!.getBoundingClientRect();
            const el = n.querySelector('[data-role="c"]') as HTMLElement;
            const rg2 = document.createRange(); rg2.selectNodeContents(el);
            const ink2 = rg2.getBoundingClientRect();
            const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
            const inside = [[ink2.left, ink2.top], [ink2.right, ink2.top], [ink2.left, ink2.bottom], [ink2.right, ink2.bottom]]
                .every(([x, y]) => {
                    const u = Math.abs(x - cx) / (box.width / 2), v = Math.abs(y - cy) / (box.height / 2);
                    return form === 'diamond' ? u + v <= 1.02 : u * u + v * v <= 1.02;
                });
            out.push({
                form, content: name,
                contentW: +w.toFixed(0), contentH: +h.toFixed(0),
                boxW: Bw, boxH: Math.ceil(Bh),
                crescita: `${(Bw / w).toFixed(2)}x  ${(Bh / h).toFixed(2)}x`,
                inkDentro: inside,
            });
            n.remove();
        }
    }
    return out;
});
console.log(JSON.stringify(res));
await browser.close();
