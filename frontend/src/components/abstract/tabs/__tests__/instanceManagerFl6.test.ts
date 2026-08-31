/**
 * FL6 — il riassetto del manager, asserito sul SORGENTE.
 *
 * ── Perche' sul sorgente e non sul render ─────────────────────────────────────
 *
 * `vitest.config.ts` dichiara `environment: 'node'` e in `package.json` non ci
 * sono ne' jsdom ne' testing-library: aggiungerne uno sarebbe una dipendenza
 * nuova (Regola 4). `EgoDiagram` si rende lo stesso sotto node
 * (`egoDiagram.test.ts` lo fa con `renderToStaticMarkup`) perche' non importa
 * nulla dal canvas; `InstanceManagerTab` importa il barrel di `editor-v2/`, che
 * arriva a monaco, che dereferenzia `window` all'import. Il file MUORE
 * all'import, prima del primo `it`.
 *
 * Quindi cio' che si prova qui e' cio' che il sorgente afferma: dove sta la
 * form, che la riga espansa segue la selezione e non un secondo stato, che il
 * nastro e' montato con le sue tre prop, che l'aside e' andato via. La META'
 * VERIFICABILE DAVVERO — la proiezione, il cap, i conteggi, l'instradamento del
 * click — sta in `jjform/__tests__/egoNeighborhood.test.ts` (25 casi) e in
 * `editor-v2/hooks/__tests__/neighborhoodDraw.test.ts` (`egoInputOf`, 9 casi).
 * Questo file non la ripete: dice che il tab ci passa.
 *
 * Il controllo POSITIVO e' in ogni blocco: prima di affermare che qualcosa NON
 * c'e' piu', si afferma che qualcosa che c'e' si trova. Una regex che non trova
 * niente e una lettura che non e' avvenuta danno lo stesso silenzio.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TSX = readFileSync(resolve(__dirname, '../InstanceManagerTab.tsx'), 'utf8');
const SCSS = readFileSync(resolve(__dirname, '../instanceManagerTab.scss'), 'utf8');

describe('FL6 — la form sotto la tabella', () => {
    it('positivo di controllo: il file letto e\' quello giusto', () => {
        expect(TSX).toContain('export function InstanceManagerTab');
        expect(TSX.length).toBeGreaterThan(10_000);
        expect(SCSS).toContain('.instance-manager {');
    });

    it('la colonna centrale e\' impilata: tabella e form dentro lo stesso __main', () => {
        const main = TSX.indexOf('className="instance-manager__main"');
        const table = TSX.indexOf('instance-manager__pane--table');
        const form = TSX.indexOf('instance-manager__pane--form');
        expect(main).toBeGreaterThan(-1);
        // Ordine, che e' l'affermazione: prima il contenitore, poi la tabella,
        // poi la form. Una form che precedesse la tabella sarebbe il layout
        // vecchio con un nome nuovo.
        expect(table).toBeGreaterThan(main);
        expect(form).toBeGreaterThan(table);
    });

    it('il pannello della form non e\' piu\' la quarta colonna', () => {
        expect(TSX).not.toContain('instance-manager__pane--detail');
        expect(SCSS).not.toContain('&__pane--detail');
    });

    it('il contenuto della form e\' cinturato a 1300px e centrato', () => {
        expect(TSX).toContain('instance-manager__form-inner');
        expect(SCSS).toMatch(/&__form-inner\s*\{[^}]*max-width:\s*1300px/);
        expect(SCSS).toMatch(/&__form-inner\s*\{[^}]*margin:\s*0 auto/);
    });

    it('la form montata e\' UNA, quella di FL4, e non una form parallela', () => {
        // La create (2c) passa dalla sua dialogue, che monta lo stesso
        // auto-layout (`autoLayoutRows`): due motori di geometria sarebbero due
        // rese che divergono alla prima modifica.
        expect(TSX.match(/<IRForm objectId=/g)?.length).toBe(2);   // la form + il figlio inline
        expect(TSX).toContain('autoLayoutRows');
    });
});

describe('FL6 — la riga espandibile', () => {
    it('l\'espansione SEGUE la selezione: nessun secondo stato', () => {
        expect(TSX).toContain('const isExpanded = row.id === subjectId;');
        // Nessuno `useState` di espansione: se ce ne fosse uno, «una sola riga
        // per volta» tornerebbe a essere una regola da far rispettare a mano.
        expect(TSX).not.toMatch(/useState[^\n]*expandedId/);
        expect(TSX).not.toMatch(/setExpandedRow|expandedRow/);
    });

    it('la riga di espansione monta EgoRow con le sue quattro prop', () => {
        expect(TSX).toContain('instance-manager__tr--expansion');
        expect(TSX).toMatch(/\{isExpanded && ego && \(/);
        for (const prop of ['ego={ego}', 'hostWidth={hostWidth}', 'onSelect={selectFromEgo}', 'onOpenInCanvas={openSubjectInCanvas}']) {
            expect(TSX).toContain(prop);
        }
    });

    it('la cella dell\'espansione copre TUTTE le colonne, chevron compreso', () => {
        // pick + name + N + referenced-by + actions + chevron = N + 5.
        //
        // Aggiornato da 10c, e l'affermazione e' LA STESSA: la tabella rende
        // `shownColumns` (le colonne meno quelle vuote su tutte le righe), quindi
        // «N» e' il numero di colonne RESE. Se la cella continuasse a contare
        // `columns`, l'espansione sborderebbe di una cella per ogni colonna
        // nascosta — che e' esattamente il difetto che questo test intercetta.
        expect(TSX).toContain('colSpan={shownColumns.length + 5}');
        expect(TSX).toContain('instance-manager__th-chev');
        expect(TSX).toContain('instance-manager__td-chev');
    });

    it('il chevron cambia verso e non e\' un secondo bersaglio di click', () => {
        expect(TSX).toContain("(isExpanded ? 'bi-chevron-up' : 'bi-chevron-down')");
        // Indicatore: nessun onClick suo, e nascosto agli screen reader — il
        // gesto e' il click sulla riga, che c'e' gia'.
        const cell = TSX.slice(TSX.indexOf('instance-manager__td-chev'));
        const end = cell.indexOf('</td>');
        expect(cell.slice(0, end)).not.toContain('onClick');
        expect(cell.slice(0, end)).toContain('aria-hidden');
    });

    it('il click sulla riga resta selectOnly: selezione ed espansione insieme', () => {
        expect(TSX).toContain('onClick={() => selectOnly(row.id)}');
        expect(TSX).toContain('aria-expanded={isExpanded}');
    });

    it('il click su un vicino passa dallo STESSO corpo degli altri emettitori', () => {
        const body = TSX.slice(TSX.indexOf('const selectFromEgo'));
        const end = body.indexOf('\n    };');
        const fn = body.slice(0, end);
        for (const call of ['setSelectedObjectId(instanceId)', 'setAlsoSelected([])', 'setBulkTouched({})', 'setNav(null)']) {
            expect(fn).toContain(call);
        }
    });
});

describe('FL6 — l\'aside del vicinato e\' rimosso', () => {
    it('positivo di controllo: le altre tre superfici ci sono ancora', () => {
        expect(TSX).toContain('instance-manager__pane--outline');
        expect(TSX).toContain('instance-manager__pane--classes');
        expect(TSX).toContain('instance-manager__pane--table');
    });

    it('il pannello, il suo markup e il suo foglio sono andati via insieme', () => {
        expect(TSX).not.toContain('NeighborhoodPanel');
        expect(TSX).not.toContain('instance-manager__pane--graph');
        expect(TSX).not.toContain('neighborEdgePath');
        expect(SCSS).not.toContain('&__pane--graph');
        expect(SCSS).not.toContain('&__graph');
    });

    it('e con loro gli import che servivano solo a quello', () => {
        for (const dead of ['neighborhoodLayout', 'neighborhoodNote', 'neighborLabel', 'neighborhoodOf', 'PlacedNode', 'PlacedEdge', 'NeighborhoodLayout']) {
            expect(TSX).not.toContain(dead);
        }
        // Cio' che RESTA: l'innesto del canvas, che il nastro usa da tre punti.
        expect(TSX).toContain("import { openInCanvas }");
        expect(TSX).toContain('const openSubjectInCanvas');
    });
});

describe('FL6 — il fallback a larghezza stretta', () => {
    it('la soglia e\' MISURATA, e non e\' il viewport', () => {
        expect(TSX).toContain('new ResizeObserver(measure)');
        expect(TSX).toContain('el.clientWidth');
        // La soglia e' la larghezza del disegno, non un numero scelto a mano.
        expect(TSX).toContain('const drawnWidth = useMemo(() => egoLayout(ego).width, [ego]);');
        expect(TSX).toContain('const narrow = hostWidth > 0 && hostWidth < drawnWidth;');
        expect(TSX).not.toContain('window.innerWidth');
        expect(TSX).not.toContain('matchMedia');
    });

    it('sotto soglia rende la lista, sopra il nastro — e mai i due insieme', () => {
        expect(TSX).toMatch(/narrow \? \(\s*<EgoList/);
        expect(TSX).toMatch(/\) : \(\s*<EgoDiagram/);
    });

    it('la lista ha i tre gruppi, e sono gli STESSI dati', () => {
        expect(TSX).toContain("group('incoming', ego.incoming)");
        expect(TSX).toContain("group('outgoing', ego.outgoing)");
        expect(TSX).toContain('>this object<');
        // Nessuna seconda proiezione: la lista legge `ego`, non ricalcola.
        const list = TSX.slice(TSX.indexOf('function EgoList'), TSX.indexOf('export function InstanceManagerTab'));
        expect(list).not.toContain('egoNeighborhood(');
        expect(list).not.toContain('egoInputOf(');
    });

    it('gli stessi click: la lista instrada dai due puri, non a mano', () => {
        const list = TSX.slice(TSX.indexOf('function EgoList'), TSX.indexOf('export function InstanceManagerTab'));
        expect(list).toContain('egoDispatch(node, handlers, ego.subject.id)');
        expect(list).toContain('egoShowAll(handlers)');
        expect(list).not.toMatch(/onSelect\(node/);
    });

    it('nessuno scroll orizzontale: la scatola e\' larga quanto il contenitore', () => {
        expect(TSX).toContain('style={hostWidth > 0 ? { width: hostWidth } : undefined}');
        expect(SCSS).toMatch(/&__ego\s*\{[^}]*overflow:\s*hidden/);
        expect(SCSS).toMatch(/&__ego\s*\{[^}]*position:\s*sticky/);
    });
});

describe('FL6 — l\'header della form', () => {
    it('nome dell\'istanza e metaclasse', () => {
        expect(TSX).toContain('instance-manager__form-head');
        expect(TSX).toContain('{ego?.subject.name ||');
        expect(TSX).toContain('{ego.subject.cls}');
    });

    it('il badge «Unsaved changes» e\' andato via con 10c (deviazione A3)', () => {
        // FL6 lo asseriva PRESENTE. 10c lo toglie, e non e' una regressione: A3
        // dice «dove la board mostra Save/Discard, non costruirli», e quel badge
        // era la meta' superstite della stessa famiglia — annunciava modifiche
        // non salvate accanto a una form che scrive diritto e non ne tiene
        // nessuna. Il flag di progetto resta vero e resta leggibile dove il
        // progetto si salva; qui diceva del PROGETTO sembrando dire dell'ISTANZA.
        //
        // L'asserzione e' invertita invece che cancellata: cosi' il giorno in cui
        // qualcuno lo rimette, questo test lo dice.
        const head = TSX.indexOf('instance-manager__form-head');
        const end = TSX.indexOf('</header>', head);
        expect(end).toBeGreaterThan(head);
        const region = TSX.slice(head, end);
        expect(region).toContain('instance-manager__form-delete');   // positivo di controllo
        expect(region).not.toContain('instance-manager__badge');
        expect(region).not.toContain('isProjectModified()');
    });

    it('Delete e\' quello di 12d: apre la preflight, non cancella', () => {
        expect(TSX).toContain('onClick={() => openDelete(subjectId)}');
        const open = TSX.slice(TSX.indexOf('const openDelete'));
        expect(open.slice(0, open.indexOf('\n    };'))).toContain('preflightFor(');
    });

    it('Save e Discard NON sono resi, ed e\' dichiarato nel sorgente', () => {
        // La form scrive diritto (`formWrite.ts`): non c'e' draft di edit da
        // salvare ne' da annullare. Due bottoni inerti sarebbero una bugia.
        expect(TSX).not.toContain('instance-manager__form-save');
        expect(TSX).not.toContain('instance-manager__form-discard');
        expect(TSX).toContain('SAVE E DISCARD NON CI SONO');
    });
});
