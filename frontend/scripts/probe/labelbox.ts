/**
 * labelbox probe — misura il contenuto dei nodi IR nella PAGINA REALE.
 *
 * Non replica il CSS: importa il modulo irStyle vero dal dev server, cosi'
 * BASE_CSS entra nel documento con l'ordine di cascata reale, e monta il markup
 * di IRNodeContent dentro un vero .react-flow__node.
 */
import { chromium } from '@playwright/test';
import { STATES, openState } from '../smoke/states.ts';

const browser = await chromium.launch();
const opened = await openState(browser, STATES.find((s) => s.id === 'empty-metamodel-tab')!);
const page = opened.page;

const res = await page.evaluate(async () => {
    const mod: any = await import('/src/components/editor-v2/viewpoint/ir/irStyle.ts');
    mod.ensureViewCss('probe-view', {});
    const injected = !!document.getElementById('ir-views-css');

    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return { error: 'no viewport' };

    const LABEL = 'TrafficLightController';
    const svg = (pts: string) =>
        `<svg class="ir-diamond-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="${pts}" vector-effect="non-scaling-stroke" fill="var(--node-bg)" stroke="var(--border-default)" stroke-width="1"/></svg>`;

    function mount(id: string, form: string, sized: boolean, pad: string | null) {
        const n = document.createElement('div');
        n.className = 'react-flow__node' + (sized ? '' : '');
        n.setAttribute('data-probe', id);
        n.style.transform = 'translate(0px,0px)';
        if (sized) { n.style.width = '170px'; n.style.height = '80px'; }
        const isDiamond = form === 'diamond';
        n.innerHTML =
            `<div class="mm-node mm-object ir-view-probe-view${sized ? ' ir-sized' : ''}">` +
            `<div class="ir-node-content ir-shape--${form}"${pad ? ` style="padding:${pad}"` : ''}>` +
            (isDiamond ? svg('50,0 100,50 50,100 0,50') : '') +
            `<span class="ir-label ir-label--center" data-role="label">${LABEL}</span>` +
            `</div></div>`;
        viewport.appendChild(n);
        return n;
    }

    const cases: Array<[string, string, boolean, string | null]> = [
        ['real-diamond-sized', 'diamond', true, null],
        ['real-diamond-sized-pad25', 'diamond', true, '0 25%'],
        ['real-ellipse-sized', 'ellipse', true, null],
        ['real-ellipse-hug', 'ellipse', false, null],
        ['real-rect-hug', 'rect', false, null],
    ];
    const nodes = cases.map(([id, f, s, p]) => mount(id, f, s, p));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const out = nodes.map((n) => {
        const box = n.querySelector('.ir-node-content') as HTMLElement;
        const label = n.querySelector('[data-role="label"]') as HTMLElement;
        const sv = n.querySelector('.ir-diamond-svg') as SVGElement | null;
        const bb = box.getBoundingClientRect();
        const lb = label.getBoundingClientRect();
        const cs = getComputedStyle(box);
        // contenimento geometrico: gli angoli della label stanno dentro il contorno?
        const w = bb.width, h = bb.height;
        const cx = bb.left + w / 2, cy = bb.top + h / 2;
        const corners = [[lb.left, lb.top], [lb.right, lb.top], [lb.left, lb.bottom], [lb.right, lb.bottom]];
        const form = box.className.includes('diamond') ? 'diamond' : box.className.includes('ellipse') ? 'ellipse' : 'rect';
        const inside = corners.every(([x, y]) => {
            const u = Math.abs(x - cx) / (w / 2), v = Math.abs(y - cy) / (h / 2);
            if (form === 'diamond') return u + v <= 1.0001;
            if (form === 'ellipse') return u * u + v * v <= 1.0001;
            return u <= 1.0001 && v <= 1.0001;
        });
        return {
            case: n.getAttribute('data-probe'),
            boxW: +w.toFixed(1), boxH: +h.toFixed(1),
            pad: cs.paddingLeft + ' / ' + cs.paddingTop,
            labelW: +lb.width.toFixed(1), labelH: +lb.height.toFixed(1),
            svgW: sv ? +sv.getBoundingClientRect().width.toFixed(1) : null,
            ellipsized: label.scrollWidth > label.clientWidth + 0.5,
            labelInsideContour: inside,
        };
    });
    nodes.forEach((n) => n.remove());
    return { injected, out };
});
console.log(JSON.stringify(res, null, 1));
await browser.close();
