// Contorni del catalogo previsto, campionati come poligoni in un box unitario
// centrato in (0,0), semiassi 1. Nessuna assunzione di simmetria.
const P = (pts) => pts.map(([x, y]) => ({ x, y }));
const arc = (cx, cy, rx, ry, a0, a1, n = 40) =>
    Array.from({ length: n + 1 }, (_, i) => {
        const a = a0 + (a1 - a0) * (i / n);
        return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    });

const roundedRect = (rx, ry) => P([
    [-1 + rx, -1], [1 - rx, -1],
    ...arc(1 - rx, -1 + ry, rx, ry, -Math.PI / 2, 0, 10),
    [1, 1 - ry],
    ...arc(1 - rx, 1 - ry, rx, ry, 0, Math.PI / 2, 10),
    [-1 + rx, 1],
    ...arc(-1 + rx, 1 - ry, rx, ry, Math.PI / 2, Math.PI, 10),
    [-1, -1 + ry],
    ...arc(-1 + rx, -1 + ry, rx, ry, Math.PI, 1.5 * Math.PI, 10),
]);

export const CATALOGO = {
    rect:          { poly: P([[-1,-1],[1,-1],[1,1],[-1,1]]) },
    rounded:       { poly: roundedRect(0.12, 0.25) },
    stadio:        { poly: P([...arc(0.5,0,0.5,1,-Math.PI/2,Math.PI/2,40), ...arc(-0.5,0,0.5,1,Math.PI/2,1.5*Math.PI,40)]) },
    ellisse:       { poly: P(arc(0,0,1,1,0,2*Math.PI,80)) },
    cerchio:       { poly: P(arc(0,0,1,1,0,2*Math.PI,80)), lockAspect: true },
    rombo:         { poly: P([[0,-1],[1,0],[0,1],[-1,0]]) },
    esagono:       { poly: P([[-0.6,-1],[0.6,-1],[1,0],[0.6,1],[-0.6,1],[-1,0]]) },
    ottagono:      { poly: P([[-0.5,-1],[0.5,-1],[1,-0.5],[1,0.5],[0.5,1],[-0.5,1],[-1,0.5],[-1,-0.5]]) },
    parallelogramma:{ poly: P([[-0.7,-1],[1,-1],[0.7,1],[-1,1]]) },
    cilindro:      { poly: P([...arc(0,-0.75,1,0.25,Math.PI,2*Math.PI,30), [1,0.75], ...arc(0,0.75,1,0.25,0,Math.PI,30), [-1,-0.75]]),
                     interne: [ { tipo:'arco', poly: P(arc(0,-0.75,1,0.25,0,Math.PI,30)) } ] },
    folder:        { poly: P([[-1,-1],[-0.15,-1],[-0.05,-0.78],[1,-0.78],[1,1],[-1,1]]) },
    nota:          { poly: P([[-1,-1],[0.6,-1],[1,-0.6],[1,1],[-1,1]]) },
    chevron:       { poly: P([[-1,-1],[0.6,-1],[1,0],[0.6,1],[-1,1],[-0.65,0]]) },
};

export function dentro(poly, x, y) {           // ray casting, funziona anche non convesso
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i], b = poly[j];
        if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) c = !c;
    }
    return c;
}

/** Rettangolo utile: semilarghezza massima a semialtezza vh, con centro spostabile in y di dy. */
export function halfWidth(poly, vh, dy = 0, interne = []) {
    const ok = (hw) => {
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
            const x = sx * hw, y = dy + sy * vh;
            if (!dentro(poly, x, y)) return false;
            for (const it of interne) if (it.tipo === 'arco' && dentro(it.poly, x, y)) return false;
        }
        // qualche punto lungo i lati, per i contorni non convessi
        for (let k = 1; k < 8; k++) {
            const x = -hw + (2 * hw * k) / 8;
            if (!dentro(poly, x, dy - vh) || !dentro(poly, x, dy + vh)) return false;
        }
        return true;
    };
    let lo = 0, hi = 1.2;
    if (!ok(1e-4)) return 0;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
    return lo;
}
