/**
 * 10i — le intestazioni in maiuscolo e il pannello Columns.
 *
 * Due metà, e i test lo sono di conseguenza.
 *
 * La PRIMA metà è solo chrome, e si asserisce sul SORGENTE del foglio per la
 * necessità già misurata in 10c/10h: `InstanceManagerTab.tsx` importa il barrel
 * di `editor-v2/`, che arriva a monaco, che dereferenzia `window` all'import —
 * il file muore prima del primo `it`. Il criterio è quello di 10h: asserzioni su
 * TOKEN, mai su pixel. Che il maiuscolo si VEDA a schermo e che il tracciato
 * dipinga davvero 0.08em lo dice la sonda, non questo file: un token identico
 * nel sorgente e un pixel identico a schermo sono due affermazioni diverse, e
 * la seconda è sulla cascata.
 *
 * La SECONDA metà è logica, e quella si importa: `instanceTable.ts` è puro e
 * senza catena verso `window` — è la stessa ragione per cui
 * `instanceTable.test.ts` esiste. Le quattro funzioni di 10i sono lì apposta,
 * perché la regola «l'indicatore conta solo le non-overridate» sia una funzione
 * provabile e non un'espressione dentro un JSX che nessun test può montare.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e
 * una lettura che non è avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    NAME_COLUMN_KEY,
    autoHiddenColumnKeys,
    columnToggles,
    isColumnVisible,
    shownColumnsWith,
    type ColumnOverrides,
    type TableColumn,
} from '../instanceTable';

const SCSS = readFileSync(resolve(__dirname, '../instanceManagerTab.scss'), 'utf8');
const TSX = readFileSync(resolve(__dirname, '../InstanceManagerTab.tsx'), 'utf8');

/** Il foglio senza commenti: un «X c'è» che legge anche la prosa non distingue
 *  la menzione dalla dichiarazione, e questa slice ha un commento che cita per
 *  esteso sia il valore usato sia la ratifica che lo tiene letterale. */
const RULES = SCSS.replace(/\/\*[\s\S]*?\*\//g, '');
const TSX_CODE = TSX.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Il corpo di una regola, dal selettore alla sua graffa chiusa. Ingenuo di
 *  proposito: i blocchi che interroga non annidano graffe. */
function block(css: string, selector: string): string {
    const at = css.indexOf(selector);
    if (at < 0) return '';
    const open = css.indexOf('{', at);
    const close = css.indexOf('}', open);
    return css.slice(open + 1, close);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Le intestazioni sono l'eyebrow
// ─────────────────────────────────────────────────────────────────────────────

describe('10i — intestazioni di colonna in maiuscolo', () => {
    it('positivo di controllo: i due blocchi confrontati esistono davvero', () => {
        expect(RULES).toContain('&__eyebrow {');
        expect(RULES).toContain('thead th {');
        // E il file NON è stato letto a metà: l'ultimo blocco del foglio c'è.
        expect(SCSS.length).toBeGreaterThan(10000);
    });

    it('`thead th` porta text-transform: uppercase', () => {
        expect(block(RULES, 'thead th {')).toMatch(/text-transform:\s*uppercase/);
    });

    it('le quattro dichiarazioni dell\'eyebrow, identiche fra testata e th', () => {
        const eyebrow = block(RULES, '&__eyebrow {');
        const th = block(RULES, 'thead th {');
        for (const decl of [
            /font-size:\s*var\(--text-xs\)/,
            /font-weight:\s*600/,
            /letter-spacing:\s*0\.08em/,
            /text-transform:\s*uppercase/,
            /color:\s*var\(--color-form-muted\)/,
        ]) {
            expect(eyebrow).toMatch(decl);
            expect(th).toMatch(decl);
        }
    });

    it('il vecchio 0.04em non è più su `thead th`', () => {
        expect(block(RULES, 'thead th {')).not.toMatch(/letter-spacing:\s*0\.04em/);
    });

    // ── DS3 ───────────────────────────────────────────────────────────
    // 10i aveva rilevato `&__draft-label` a 0.04em e lo aveva LASCIATO, fissando
    // lo stato con un'asserzione perché la sessione dopo non lo riscoprisse. DS3
    // chiude la divergenza: le asserzioni sotto non fissano più uno scarto,
    // affermano una convergenza. L'asserzione non è sparita, ha cambiato verso.

    it('DS3 — il `&__draft-label` traccia come l\'eyebrow: 0.08em', () => {
        const draft = block(RULES, '&__draft-label {');
        expect(draft).toMatch(/letter-spacing:\s*0\.08em/);
        expect(draft).not.toMatch(/letter-spacing:\s*0\.04em/);
        // …e con esso sparisce l'ULTIMO 0.04em del foglio: era l'unica occorrenza
        // fuori dai commenti, che `RULES` spoglia.
        expect(RULES).not.toMatch(/letter-spacing:\s*0\.04em/);
        // Controllo positivo: la regex sa trovare un tracciato quando c'è.
        expect(RULES).toMatch(/letter-spacing:\s*0\.08em/);
    });

    it('DS3 — le altre tre erano già quelle dell\'eyebrow', () => {
        const draft = block(RULES, '&__draft-label {');
        const eyebrow = block(RULES, '&__eyebrow {');
        for (const decl of [
            /font-size:\s*var\(--text-xs\)/,
            /font-weight:\s*600/,
            /text-transform:\s*uppercase/,
        ]) {
            expect(draft).toMatch(decl);
            expect(eyebrow).toMatch(decl);
        }
    });

    it('DS3 — il COLORE resta divergente, e di proposito', () => {
        // L'unico punto in cui questa etichetta si stacca dall'eyebrow, per una
        // ragione misurata e non estetica: non è una testata ma la `<label>` di
        // un campo da compilare, a 11px. Su bianco slate-500 dà 4.76:1 e
        // slate-400 dà 2.59:1 — muted la manderebbe sotto AA. In scuro i due
        // token collassano su `--color-text-tertiary` e la divergenza non esiste.
        // Se un domani qualcuno la «converge» di passaggio, questo test lo ferma.
        expect(block(RULES, '&__draft-label {')).toMatch(/color:\s*var\(--color-form-section\)/);
        expect(block(RULES, '&__eyebrow {')).toMatch(/color:\s*var\(--color-form-muted\)/);
    });

    it('nessun valore fuori dalla banda dichiarata (0.04–0.1em)', () => {
        const spacings = [...RULES.matchAll(/letter-spacing:\s*([0-9.]+)em/g)]
            .map(m => Number(m[1]));
        expect(spacings.length).toBeGreaterThan(0);
        for (const v of spacings) {
            expect(v).toBeGreaterThanOrEqual(0.04);
            expect(v).toBeLessThanOrEqual(0.1);
        }
    });

    it('il maiuscolo lo fa il CSS: le stringhe restano quelle del metamodello', () => {
        // `col.key` è quello che il `th` stampa, non una sua trasformazione.
        expect(TSX_CODE).toContain('{col.key}');
        expect(TSX_CODE).not.toMatch(/col\.key\.toUpperCase\(\)/);
        expect(TSX_CODE).not.toMatch(/col\.label\.toUpperCase\(\)/);
        // Le intestazioni fisse restano minuscole nel sorgente.
        expect(TSX_CODE).toMatch(/instance-manager__th-name">name</);
        expect(TSX_CODE).toContain('referenced by');
        expect(TSX_CODE).not.toContain('REFERENCED BY');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. La logica del pannello
// ─────────────────────────────────────────────────────────────────────────────

/** Tre colonne: `kind` piena, `note` e `tag` vuote su ogni istanza. */
const COLUMNS = [
    { key: 'kind', label: 'kind', kind: 'attr', typeName: 'EString', multiplicity: '0..1', required: false, derived: false, readOnly: false, many: false },
    { key: 'note', label: 'note', kind: 'attr', typeName: 'EString', multiplicity: '0..1', required: false, derived: false, readOnly: false, many: false },
    { key: 'tag', label: 'tag', kind: 'attr', typeName: 'EString', multiplicity: '0..1', required: false, derived: false, readOnly: false, many: false },
] as TableColumn[];

const HIDDEN = ['note', 'tag'];
const NONE: ColumnOverrides = {};

const keysOf = (cols: TableColumn[]) => cols.map(c => c.key);

describe('10i — visibilità di una colonna', () => {
    it('positivo di controllo: il fixture ha sia piene sia vuote', () => {
        expect(keysOf(COLUMNS)).toEqual(['kind', 'note', 'tag']);
        expect(HIDDEN).toHaveLength(2);
        expect(HIDDEN).not.toContain('kind');
    });

    it('senza scelte vale l\'automatico', () => {
        expect(isColumnVisible('kind', HIDDEN, NONE)).toBe(true);
        expect(isColumnVisible('note', HIDDEN, NONE)).toBe(false);
    });

    it('l\'override vince in entrambe le direzioni', () => {
        expect(isColumnVisible('note', HIDDEN, { note: true })).toBe(true);
        expect(isColumnVisible('kind', HIDDEN, { kind: false })).toBe(false);
    });

    it('`false` non è «assente»: una scelta esplicita non ricade sull\'automatico', () => {
        // Se il codice leggesse `overrides[key] || !hidden.includes(key)`, questa
        // tornerebbe `true` — è il bug che il test esiste per fermare.
        expect(isColumnVisible('kind', HIDDEN, { kind: false })).toBe(false);
    });
});

describe('10i — le colonne stampate', () => {
    it('positivo di controllo: la riduzione automatica ha effetto', () => {
        expect(keysOf(shownColumnsWith(COLUMNS, HIDDEN, NONE))).toEqual(['kind']);
        expect(keysOf(shownColumnsWith(COLUMNS, [], NONE))).toEqual(['kind', 'note', 'tag']);
    });

    it('spuntare una vuota la riporta sullo schermo, nell\'ordine originale', () => {
        expect(keysOf(shownColumnsWith(COLUMNS, HIDDEN, { tag: true }))).toEqual(['kind', 'tag']);
        expect(keysOf(shownColumnsWith(COLUMNS, HIDDEN, { note: true, tag: true })))
            .toEqual(['kind', 'note', 'tag']);
    });

    it('togliere una piena la nasconde', () => {
        expect(keysOf(shownColumnsWith(COLUMNS, HIDDEN, { kind: false }))).toEqual([]);
    });
});

describe('10i — l\'indicatore conta le sole non-overridate', () => {
    it('positivo di controllo: senza scelte conta tutte le vuote', () => {
        expect(autoHiddenColumnKeys(HIDDEN, NONE)).toEqual(['note', 'tag']);
    });

    it('una vuota forzata visibile esce dal conteggio', () => {
        expect(autoHiddenColumnKeys(HIDDEN, { note: true })).toEqual(['tag']);
    });

    it('anche una vuota tolta A MANO esce dal conteggio', () => {
        // L'indicatore dichiara ciò che la TABELLA ha deciso da sé. Una colonna
        // che l'utente ha spento è una sua scelta, non una riduzione automatica.
        expect(autoHiddenColumnKeys(HIDDEN, { note: false })).toEqual(['tag']);
    });

    it('con entrambe overridate l\'indicatore sparisce', () => {
        expect(autoHiddenColumnKeys(HIDDEN, { note: true, tag: false })).toEqual([]);
    });

    it('una PIENA tolta a mano non entra mai nel conteggio', () => {
        expect(autoHiddenColumnKeys(HIDDEN, { kind: false })).toEqual(['note', 'tag']);
    });
});

describe('10i — le voci del pannello', () => {
    const toggles = columnToggles(COLUMNS, HIDDEN, NONE);

    it('positivo di controllo: quattro voci, `name` in testa', () => {
        expect(toggles.map(t => t.key)).toEqual([NAME_COLUMN_KEY, 'kind', 'note', 'tag']);
    });

    it('`name` è spuntata e bloccata', () => {
        expect(toggles[0]).toMatchObject({ key: 'name', checked: true, locked: true, empty: false });
    });

    it('nessun\'altra voce è bloccata', () => {
        expect(toggles.slice(1).every(t => t.locked)).toBe(false);
        expect(toggles.slice(1).some(t => t.locked)).toBe(false);
    });

    it('la spunta È la visibilità', () => {
        expect(toggles.find(t => t.key === 'kind')!.checked).toBe(true);
        expect(toggles.find(t => t.key === 'note')!.checked).toBe(false);
    });

    it('`name` DICHIARATA dal metamodello non produce un doppione nel pannello', () => {
        // `tableFeatures` restituisce ogni attributo, `name` compreso: senza la
        // deduplica, il pannello mostrerebbe DUE righe che dicono «name».
        const withName = [
            { key: 'name', label: 'name', kind: 'attr', typeName: 'EString', multiplicity: '1..1', required: true, derived: false, readOnly: false, many: false },
            ...COLUMNS,
        ] as TableColumn[];
        const t = columnToggles(withName, HIDDEN, NONE);
        expect(t.filter(x => x.key === NAME_COLUMN_KEY)).toHaveLength(1);
        // …e la voce che resta e' la FEATURE, non la sintetica: e' quella che
        // governa il doppione di colonna, e la fissa resta a schermo comunque
        // perche' non passa da `shownColumns`.
        expect(t[0]).toMatchObject({ key: 'name', locked: false });
    });

    it('la colonna FISSA non passa da `shownColumns`: la riduzione non la tocca', () => {
        // Il `<th>` dei nomi e' stampato fuori dalla lista, e `tableColumns`
        // non lo produce. Questo test lo fissa: se un domani la colonna fissa
        // entrasse in `columns`, la riduzione automatica potrebbe spegnerla.
        expect(keysOf(COLUMNS)).not.toContain(NAME_COLUMN_KEY);
        expect(keysOf(shownColumnsWith(COLUMNS, HIDDEN, NONE))).not.toContain(NAME_COLUMN_KEY);
        // La voce sintetica esiste solo per questo caso, ed e' bloccata.
        expect(columnToggles(COLUMNS, HIDDEN, NONE)[0])
            .toMatchObject({ key: 'name', checked: true, locked: true, empty: false });
    });

    it('la nota «empty» segue il MODELLO, non la spunta', () => {
        const forced = columnToggles(COLUMNS, HIDDEN, { note: true });
        const note = forced.find(t => t.key === 'note')!;
        expect(note.checked).toBe(true);
        expect(note.empty).toBe(true);   // resta vuota sul modello anche se la si guarda
        expect(forced.find(t => t.key === 'kind')!.empty).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. La superficie
// ─────────────────────────────────────────────────────────────────────────────

describe('10i — il bottone e il popover', () => {
    it('positivo di controllo: la toolbar e l\'indicatore esistono nel TSX', () => {
        expect(TSX_CODE).toContain('instance-manager__toolbar');
        expect(TSX_CODE).toContain('empty column');
    });

    it('icona e parola del prompt', () => {
        expect(TSX_CODE).toContain('bi bi-layout-three-columns');
        expect(TSX_CODE).toMatch(/aria-hidden="true"\s*\/>\s*\n\s*Columns/);
    });

    it('sta ACCANTO all\'indicatore, e chiude la barra', () => {
        // 10k-CHIUSURA — la seconda meta' era `exp > btn`, «e prima di Export».
        // Export ha lasciato la barra: sta nella riga di testata, che nel
        // sorgente viene PRIMA, quindi il confronto si e' rovesciato senza che
        // nulla di 10i cambiasse. Cio' che 10i asseriva davvero — Columns
        // accanto all'indicatore, perche' la riga dice «due nascoste» e il
        // bottone subito dopo e' dove si va a rivederle — resta, e la meta' su
        // Export diventa la sua verita' nuova: nella barra non c'e' piu'.
        const ind = TSX_CODE.indexOf('empty column');
        const btn = TSX_CODE.indexOf('instance-manager__columns"');
        const bar = TSX_CODE.indexOf('instance-manager__toolbar');
        const exp = TSX_CODE.indexOf('instance-manager__export"');
        expect(ind).toBeGreaterThan(-1);
        expect(btn).toBeGreaterThan(ind);
        expect(exp).toBeGreaterThan(-1);      // Export esiste ancora
        expect(exp).toBeLessThan(bar);        // …ma sopra la barra, in testata
    });

    it('l\'indicatore legge `autoHiddenKeys`, non più `hiddenColumnKeys`', () => {
        expect(TSX_CODE).toMatch(/\{autoHiddenKeys\.length\} empty column/);
        expect(TSX_CODE).not.toMatch(/\{hiddenColumnKeys\.length\} empty column/);
    });

    it('l\'export segue le colonne visibili', () => {
        expect(TSX_CODE).toContain('toCsv(shownColumns, visible)');
        expect(TSX_CODE).toContain('shownColumnsWith(columns, hiddenColumnKeys, overrides)');
    });

    it('la persistenza è per METACLASSE', () => {
        expect(TSX_CODE).toMatch(/columnChoice.*Record<string, ColumnOverrides>/s);
        expect(TSX_CODE).toContain('columnChoice[selectedClassId');
        expect(TSX_CODE).toContain('[selectedClassId]: { ...(prev[selectedClassId] ?? {}), [key]: next }');
        // …e NON in localStorage: R-RAIL-11 chiude la lista delle chiavi.
        expect(TSX_CODE).not.toMatch(/localStorage[\s\S]{0,80}column/i);
    });

    it('`selectClass` chiude il pannello e NON azzera le scelte', () => {
        const at = TSX_CODE.indexOf('const selectClass =');
        const body = TSX_CODE.slice(at, at + 900);
        expect(at).toBeGreaterThan(-1);
        expect(body).toContain('setColumnsOpen(false)');
        expect(body).not.toContain('setColumnChoice');
    });

    it('chiusura su click-fuori ed Esc, e solo da aperto', () => {
        const at = TSX_CODE.indexOf('if (!columnsOpen) return;');
        expect(at).toBeGreaterThan(-1);
        const body = TSX_CODE.slice(at, at + 1400);
        expect(body).toContain("window.addEventListener('mousedown'");
        expect(body).toContain("e.key === 'Escape'");
        expect(body).toContain("window.removeEventListener('mousedown'");
        expect(body).toContain("window.removeEventListener('keydown'");
        expect(body).toContain('columnsRef.current?.contains');
        // 10k-chiusura: il pannello e' su `document.body`, quindi il solo
        // `columnsRef` non basta piu' — senza il secondo nodo ogni spunta
        // chiuderebbe il pannello che si sta usando.
        // L'espressione INTERA, e non il solo nome del ref: `onScroll` qui
        // sotto porta lo stesso nome, e una sotto-stringa passerebbe anche con
        // il click-fuori tornato a interrogare un nodo solo.
        expect(body).toContain(
            'if (columnsRef.current?.contains(t) || columnsPanelRef.current?.contains(t)) return;');
    });

    it('la card del popover è quella del DS', () => {
        const panel = block(RULES, '&__columns-panel {');
        expect(panel).toMatch(/border:\s*1px solid var\(--color-form-border\)/);
        expect(panel).toMatch(/border-radius:\s*6px/);
        expect(panel).toMatch(/background:\s*var\(--color-bg-primary\)/);
        // 10k-chiusura: `absolute` era il DIFETTO — `__pane--table` e'
        // `overflow: hidden` e clippava il pannello a meta' elenco. Ora e'
        // `fixed` su un portale, con le coordinate inline dal rect del bottone.
        expect(panel).toMatch(/position:\s*fixed/);
        expect(panel).not.toMatch(/position:\s*absolute/);
        // E le coordinate NON stanno nel foglio: le mette React, o si avrebbero
        // due geometrie per lo stesso pannello.
        expect(panel).not.toMatch(/^\s*(top|left|bottom|right):/m);
        // Il wrapper resta una scatola di posizionamento (Regola 9), anche se
        // non ancora nulla.
        expect(block(RULES, '&__columns-wrap {')).toMatch(/position:\s*relative/);
    });

    /* 10k-chiusura — il portale e la sua geometria.
       Il controllo positivo e' il `createPortal` importato: se l'import non ci
       fosse, ogni asserzione qui sotto misurerebbe un file che non e' quello. */
    it('il pannello è portato su document.body, non annidato nella card', () => {
        expect(TSX_CODE).toContain("import { createPortal } from 'react-dom'");
        const at = TSX_CODE.indexOf('columnsOpen && columnsRect && createPortal(');
        expect(at).toBeGreaterThan(-1);
        const body = TSX_CODE.slice(at, at + 2600);
        expect(body).toContain('instance-manager__columns-panel');
        expect(body).toContain('ref={columnsPanelRef}');
        expect(body).toContain('style={computeColumnsPanelStyle(columnsRect)}');
        expect(body).toContain('document.body');
    });

    it('la geometria fixed nasce dal rect del bottone, ribalta e si stringe al viewport', () => {
        const at = TSX_CODE.indexOf('function computeColumnsPanelStyle');
        expect(at).toBeGreaterThan(-1);
        const body = TSX_CODE.slice(at, at + 900);
        // Ribaltamento sopra il bottone quando sotto non c'e' spazio.
        expect(body).toContain(
            'const openUp = spaceBelow < PREF && spaceAbove > spaceBelow;');
        expect(body).toContain('bottom: window.innerHeight - rect.top + GAP');
        expect(body).toContain('top: rect.bottom + GAP');
        // Clamp orizzontale sulla STESSA misura che il foglio dipinge.
        expect(body).toContain('COLUMNS_PANEL_MAX_W');
        const declared = /const COLUMNS_PANEL_MAX_W = (\d+);/.exec(TSX_CODE);
        expect(declared).not.toBeNull();
        expect(block(RULES, '&__columns-panel {')).toMatch(
            new RegExp(`max-width:\\s*${declared![1]}px`));
        // Il rect e' preso all'apertura, dal bottone stesso.
        expect(TSX_CODE).toContain('setColumnsRect(e.currentTarget.getBoundingClientRect())');
    });

    it('scroll e resize chiudono il pannello, ma non lo scroll interno', () => {
        const at = TSX_CODE.indexOf('if (!columnsOpen) return;');
        const body = TSX_CODE.slice(at, at + 1400);
        // Cattura: lo scroll degli antenati non bolla.
        expect(body).toContain("window.addEventListener('scroll', onScroll, true)");
        expect(body).toContain("window.removeEventListener('scroll', onScroll, true)");
        expect(body).toContain("window.addEventListener('resize', onResize)");
        expect(body).toContain("window.removeEventListener('resize', onResize)");
        // Lo scroll DENTRO il pannello è il gesto con cui si scorre l'elenco.
        expect(body).toMatch(/onScroll = \(e: Event\) => \{[\s\S]{0,120}columnsPanelRef\.current\?\.contains/);
    });

    it('il bottone è secondario: le stesse dichiarazioni di Export', () => {
        const cols = block(RULES, '&__columns {');
        const exp = block(RULES, '&__export {');
        for (const decl of [
            /height:\s*28px/,
            /border:\s*1px solid var\(--color-form-border-strong\)/,
            /background:\s*var\(--color-form-surface\)/,
            /color:\s*var\(--color-form-label\)/,
        ]) {
            expect(cols).toMatch(decl);
            expect(exp).toMatch(decl);
        }
        // E NON il gradiente slate del primario: quello resta della create.
        expect(cols).not.toMatch(/linear-gradient/);
    });

    it('nessun valore di colore letterale nei blocchi nuovi', () => {
        for (const sel of ['&__columns {', '&__columns-panel {', '&__columns-item {', '&__columns-empty {']) {
            expect(block(RULES, sel)).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
        }
    });
});
