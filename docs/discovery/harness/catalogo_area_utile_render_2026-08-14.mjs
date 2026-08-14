import { CATALOGO, halfWidth } from './catalogo_area_utile_2026-08-14.mjs';
import { writeFileSync } from 'node:fs';

const S = 150, PAD = 26;                       // mezzo lato del box di disegno
const BANDE = [0.2, 0.4, 0.6, 0.8];
const map = (p) => `${(PAD + S + p.x * S).toFixed(1)},${(PAD + S + p.y * S).toFixed(1)}`;

const cards = Object.entries(CATALOGO).map(([nome, s]) => {
    const righe = BANDE.map((vh) => {
        const c = halfWidth(s.poly, vh, 0, s.interne || []);
        let best = c, bdy = 0;
        for (let dy = -0.7; dy <= 0.7001; dy += 0.01) {
            const v = halfWidth(s.poly, vh, dy, s.interne || []);
            if (v > best + 1e-4) { best = v; bdy = dy; }
        }
        return { vh, c, best, bdy };
    });
    const asimmetrica = righe.some((r) => Math.abs(r.bdy) > 1e-6);
    const critica = righe.some((r) => r.c < 0.01 && r.best > 0.5);
    const vh = 0.6, r = righe.find((x) => x.vh === vh);
    const rect = (hw, dy, cls) => hw <= 0 ? '' :
        `<rect x="${PAD + S - hw * S}" y="${PAD + S + (dy - vh) * S}" width="${2 * hw * S}" height="${2 * vh * S}" class="${cls}"/>`;

    return `<figure class="card ${critica ? 'critica' : asimmetrica ? 'asimmetrica' : 'ok'}">
  <svg viewBox="0 0 ${2 * (S + PAD)} ${2 * (S + PAD)}" role="img" aria-label="${nome}">
    <polygon points="${s.poly.map(map).join(' ')}" class="contorno"/>
    ${(s.interne || []).map((it) => `<polyline points="${it.poly.map(map).join(' ')}" class="interna"/>`).join('')}
    ${rect(r.best, r.bdy, 'best')}
    ${rect(r.c, 0, 'centrato')}
  </svg>
  <figcaption>
    <h3>${nome}</h3>
    <table>
      <tr><th>banda</th><th>centrato</th><th>migliore</th><th>offset</th></tr>
      ${righe.map((x) => `<tr class="${x.c < 0.01 && x.best > 0.5 ? 'zero' : Math.abs(x.bdy) > 1e-6 ? 'shift' : ''}">
        <td>${x.vh.toFixed(1)}</td><td>${x.c.toFixed(2)}</td><td>${x.best.toFixed(2)}</td>
        <td>${x.bdy ? (x.bdy > 0 ? '+' : '') + x.bdy.toFixed(2) : '·'}</td></tr>`).join('')}
    </table>
    <p class="verdetto">${critica ? 'il rettangolo centrato collassa a zero' : asimmetrica ? 'il rettangolo migliore non è centrato' : 'profilo simmetrico sui due assi'}</p>
  </figcaption>
</figure>`;
}).join('\n');

const html = `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8">
<title>Catalogo forme: area utile per il contenuto</title>
<style>
  :root { --slate:#334155; --cyan:#0ea5e9; --line:#cbd5e1; --bg:#f8fafc; }
  * { box-sizing: border-box; }
  body { margin:0; padding:32px; background:var(--bg); color:var(--slate);
         font:14px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif; }
  header { max-width:70ch; margin:0 auto 28px; }
  h1 { font-size:20px; margin:0 0 10px; letter-spacing:-.01em; }
  header p { margin:0 0 8px; color:#475569; }
  .legenda { display:flex; gap:18px; flex-wrap:wrap; margin-top:14px; font-size:11px; }
  .legenda span { display:flex; align-items:center; gap:6px; }
  .sw { width:14px; height:14px; border-radius:3px; display:inline-block; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:18px;
          max-width:1400px; margin:0 auto; }
  .card { margin:0; background:#fff; border:1px solid var(--line); border-radius:10px;
          padding:14px; display:flex; flex-direction:column; gap:10px; }
  .card.asimmetrica { border-color:#f59e0b; }
  .card.critica { border-color:#ef4444; }
  svg { width:100%; height:auto; background:#fff; }
  .contorno { fill:#f1f5f9; stroke:var(--slate); stroke-width:2.5; }
  .interna { fill:none; stroke:var(--slate); stroke-width:2; opacity:.5; }
  .centrato { fill:rgba(14,165,233,.20); stroke:var(--cyan); stroke-width:2; }
  .best { fill:rgba(245,158,11,.16); stroke:#f59e0b; stroke-width:2; stroke-dasharray:5 3; }
  h3 { font-size:13px; margin:0 0 6px; font-weight:600; }
  table { width:100%; border-collapse:collapse; font-size:11px; font-variant-numeric:tabular-nums; }
  th { text-align:right; font-weight:500; color:#64748b; padding:1px 4px; }
  th:first-child { text-align:left; }
  td { text-align:right; padding:1px 4px; }
  td:first-child { text-align:left; color:#64748b; }
  tr.shift td { color:#b45309; font-weight:600; }
  tr.zero td { color:#b91c1c; font-weight:600; }
  .verdetto { margin:2px 0 0; font-size:11px; color:#64748b; }
  .card.asimmetrica .verdetto { color:#b45309; }
  .card.critica .verdetto { color:#b91c1c; }
</style></head><body>
<header>
  <h1>Catalogo forme: dove puo' stare il contenuto</h1>
  <p>Per ogni forma prevista, il rettangolo utile massimo a parita' di banda verticale occupata dal
  contenuto. <strong>Banda</strong> e' la semialtezza del contenuto come frazione della semialtezza
  della forma: 0,2 e' una riga in un nodo alto, 0,8 e' un nodo pieno di compartimenti.</p>
  <p>Il disegno mostra la banda 0,6. Il rettangolo pieno e' quello centrato, quello tratteggiato e'
  il migliore quando differisce.</p>
  <div class="legenda">
    <span><i class="sw" style="background:rgba(14,165,233,.35);border:1px solid #0ea5e9"></i>rettangolo centrato</span>
    <span><i class="sw" style="background:rgba(245,158,11,.3);border:1px dashed #f59e0b"></i>rettangolo migliore</span>
    <span><i class="sw" style="border:2px solid #f59e0b"></i>profilo asimmetrico</span>
    <span><i class="sw" style="border:2px solid #ef4444"></i>il centrato collassa</span>
  </div>
</header>
<div class="grid">${cards}</div>
</body></html>`;
writeFileSync('./catalogo-area-utile.html', html);
console.log('ok');
