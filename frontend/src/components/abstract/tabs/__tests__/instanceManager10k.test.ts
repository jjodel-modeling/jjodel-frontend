/**
 * 10k — i nove ritocchi del manager, giro 2.
 *
 * Slice di sola superficie e copy, come 10d/10e/10f/10h/10j. Le asserzioni sono
 * sul SORGENTE per la necessita' misurata in 10c: `InstanceManagerTab.tsx`
 * importa il barrel di `editor-v2/`, che arriva a monaco, che dereferenzia
 * `window` all'import, e il file muore prima del primo `it`. Dove invece il
 * modulo e' puro — `instanceTable.ts` — le asserzioni sono sul COMPORTAMENTO.
 *
 * Quello che questi test NON possono dire, e che la sonda dice: i pixel, gli
 * stati (`:checked`, `:hover`) e il fatto che la cascata arrivi davvero
 * all'elemento che dipinge. La coppia before/after di
 * `scripts/smoke/_tmp_10k_verify.ts` e' li' per quello — **20/29 nel before,
 * 49/0 nell'after, stesso strumento su entrambi i lati, zero errori di pagina**.
 *
 * I punti 5, 7 e 8 vivono in `jjform/` e sono asseriti dalle suite di quei
 * moduli (`layout.test.ts` §A2, `egoNeighborhood.test.ts`, `create.test.ts`).
 * Qui compaiono solo dove il manager li tocca.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e
 * una lettura che non e' avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    columnToggles,
    duplicateNameColumnKeys,
    emptyColumnKeys,
    type TableCell,
    type TableColumn,
    type TableRow,
} from '../instanceTable';

const TSX = readFileSync(resolve(__dirname, '../InstanceManagerTab.tsx'), 'utf8');
const SCSS = readFileSync(resolve(__dirname, '../instanceManagerTab.scss'), 'utf8');

/** Il sorgente senza i commenti. Serve a ogni asserzione di ASSENZA: i commenti
 *  di questa slice citano per esteso cio' che la slice toglie, e una regex che
 *  leggesse anche loro non distinguerebbe «rimossa e documentata» da «ancora
 *  li'». E' il rilievo di 10c, e qui morde su «Add contained». */
const CODE = TSX.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const RULES = SCSS.replace(/\/\*[\s\S]*?\*\//g, '');

/** Il corpo di una regola SCSS, dalla graffa aperta alla sua chiusura. */
function block(css: string, opener: string): string {
    const i = css.indexOf(opener);
    if (i < 0) return '';
    let depth = 0;
    for (let j = i + opener.length - 1; j < css.length; j++) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') { depth--; if (depth === 0) return css.slice(i, j + 1); }
    }
    return css.slice(i);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Il checkbox
// ─────────────────────────────────────────────────────────────────────────────

describe('10k punto 1 — il checkbox nel vocabolario del DS', () => {
    const CB = block(RULES, "&__th-pick input[type='checkbox'],");

    it('positivo di controllo: la regola esiste e nomina i TRE posti', () => {
        expect(CB).not.toBe('');
        expect(CB).toContain("&__td-pick input[type='checkbox']");
        expect(CB).toContain("&__columns-item input[type='checkbox']");
    });

    it('e' + ' i tre sono TUTTI i checkbox del manager', () => {
        // Il conteggio e' il controllo: se il TSX ne guadagnasse un quarto, la
        // regola sopra smetterebbe di coprirli tutti in silenzio.
        expect(CODE.match(/type="checkbox"/g) ?? []).toHaveLength(3);
    });

    it('16x16, ridisegnato, raggio 4 e bordo slate-300 dal nome di QUESTO foglio', () => {
        expect(CB).toContain('appearance: none');
        expect(CB).toContain('width: 16px');
        expect(CB).toContain('height: 16px');
        expect(CB).toContain('border-radius: 4px');
        expect(CB).toContain('border: 1px solid var(--color-form-border-strong)');
    });

    it('non inventa `--color-border`, che nel sistema non esiste', () => {
        expect(CB).not.toMatch(/var\(--color-border\)/);
    });

    it('spuntato = riempimento `--color-accent`, con il glifo bianco', () => {
        expect(CB).toContain('&:checked {');
        expect(CB).toMatch(/&:checked \{[^}]*background: var\(--color-accent\)/s);
        expect(CB).toContain('clip-path: polygon(');
    });

    it('l\'hover NON vince sullo stato spuntato', () => {
        // (0,3,0) contro (0,2,0): senza `:not(:checked)` l'hover batte il
        // riempimento e il bordo di una riga selezionata torna slate-400.
        // Misurato nel primo giro after.
        expect(CB).toContain('&:hover:not(:disabled):not(:checked)');
    });

    it('il focus porta l\'anello del foglio E il ring 3px del prompt', () => {
        expect(CB).toContain('outline: 2px solid var(--color-border-focus)');
        expect(CB).toContain('box-shadow: 0 0 0 3px var(--color-accent-subtle)');
    });

    it('`ISHISTORY` in riga NON e\' lo stesso componente: e\' un glifo', () => {
        // Dichiarazione chiesta dal prompt, pinnata perche' non venga riscoperta.
        expect(CODE).toMatch(/bi-check-square.*instance-manager__bool/);
        expect(CODE).not.toMatch(/instance-manager__bool[^]{0,80}type="checkbox"/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. La testata fuori dalla card
// ─────────────────────────────────────────────────────────────────────────────

describe('10k punto 2 — la testata sul fondo desk', () => {
    it('positivo di controllo: testata, desk e card della tabella esistono', () => {
        expect(CODE).toContain('<div className="instance-manager__main">');
        expect(CODE).toContain('<header className="instance-manager__head">');
        expect(CODE).toContain('instance-manager__pane--table');
    });

    it('la testata apre il desk, e la card comincia DOPO', () => {
        const desk = CODE.indexOf('<div className="instance-manager__main">');
        const head = CODE.indexOf('<header className="instance-manager__head">');
        const card = CODE.indexOf('instance-manager__pane--table');
        expect(head).toBeGreaterThan(desk);
        expect(card).toBeGreaterThan(head);
    });

    it('la card comincia dalla toolbar', () => {
        const card = CODE.indexOf('instance-manager__pane--table');
        const bar = CODE.indexOf('instance-manager__toolbar');
        expect(bar).toBeGreaterThan(card);
    });

    it('e porta il cinturino delle card, o si scollerebbe da loro sopra i 1300px', () => {
        const head = block(RULES, '&__head {');
        expect(head).toContain('max-width: 1300px');
        expect(head).toContain('margin: 0 auto');
        // Il margine inferiore se n'e' andato: fra testata e card c'e' il `gap`
        // del desk, e tenerli entrambi li sommava.
        expect(head).not.toContain('margin-bottom');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. La banda dell'header della form
// ─────────────────────────────────────────────────────────────────────────────

describe('10k punto 3 — l\'header della form ha una banda propria', () => {
    const FH = block(RULES, '&__form-head {');

    it('positivo di controllo: la regola esiste e resta un flex in riga', () => {
        expect(FH).not.toBe('');
        expect(FH).toContain('display: flex');
    });

    /* 10k-bis, emendamento — la banda cambia token.
       10k la dipingeva con `--color-form-panel`, «lo stesso token con cui 10d ha
       dipinto il desk». Proprio per quello non staccava: stesso token da
       entrambi i lati = stesso colore = nessun salto. Passa a
       `--color-bg-tertiary`, che e' il nome con cui QUESTO foglio chiama una
       superficie a riposo un gradino piu' scura (`__foot`, `__del-foot`, la
       striscia del breadcrumb), e non `--color-bg-hover`, che il foglio riserva
       — dichiarandolo due volte a commento — agli stati `:hover`. */
    it('fondo slate-100 dal token delle bande a riposo, non da quello del desk', () => {
        expect(FH).toContain('background: var(--color-bg-tertiary)');
        // Il difetto che l'emendamento chiude: la banda NON puo' piu' valere il
        // token del desk, altrimenti non c'e' salto da misurare.
        expect(FH).not.toContain('--color-form-panel');
        // `--color-bg-secondary` e' fra i 15 dichiarati due volte con valori
        // diversi: qui non ci si appoggia una superficie.
        expect(FH).not.toContain('--color-bg-secondary');
        // ...e non l'hover, che in scuro e' traslucido.
        expect(FH).not.toContain('--color-bg-hover');
    });

    /* Controllo POSITIVO del test qui sopra, e la meta' che rende la coppia una
       misura: il desk continua a portare `--color-form-panel`. Senza, un
       `not.toContain` verde direbbe soltanto che qualcuno ha rinominato il
       token ovunque — cioe' di nuovo due superfici uguali, e di nuovo nessuna
       banda. Le due asserzioni insieme dicono «diversi», che e' la richiesta. */
    it('positivo di controllo: il desk resta --color-form-panel, quindi i due differiscono', () => {
        const MAIN = block(RULES, '&__main {');
        expect(MAIN).not.toBe('');
        expect(MAIN).toContain('background: var(--color-form-panel)');
        expect(MAIN).not.toContain('--color-bg-tertiary');
    });

    it('sborda fino ai bordi della card, come il footer di 10d', () => {
        expect(FH).toMatch(/margin:\s*-14px -14px 14px/);
        expect(FH).toMatch(/padding:\s*10px 14px/);
    });

    it('hairline sotto, e raggi superiori solo quando e\' davvero in cima', () => {
        // 10k-bis: slate-300 e non slate-200. Ora e' il bordo basso di una banda
        // che ha un fondo suo, non un filetto interno alla card.
        expect(FH).toContain('border-bottom: 1px solid var(--color-form-border-strong)');
        expect(FH).toContain('&:first-child');
        expect(FH).toMatch(/&:first-child \{[^}]*border-radius: var\(--radius-card\) var\(--radius-card\) 0 0/s);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3-ter. Il bordo sinistro della card della form
// ─────────────────────────────────────────────────────────────────────────────

/* Emendamento 10k-ter. Lo screenshot mostrava la card della form senza il lato
   sinistro. Il prompt nominava due sospetti — la banda di `__form-head` che con
   i margini negativi copre l'hairline, oppure un hairline sub-pixel che il
   renderer arrotonda a zero — e chiedeva di MISURARE prima di scegliere. La
   sonda `scripts/smoke/_tmp_10kter_border_verify.ts` li ha esclusi entrambi:

     - i margini negativi valgono ESATTAMENTE il padding della card (-14 contro
       14, letti dai computed style e non copiati), e la banda si ferma sul
       bordo interno: nell'after `band.left = 755` contro `card.left = 754`;
     - il bordo non era sub-pixel: era ASSENTE. `border-left` computato
       `0px none rgb(15, 23, 42)` contro `1px solid rgb(226, 232, 240)` sugli
       altri tre lati.

   Il colpevole era il reset della colonna impilata in `__main`, scritto quando
   i due pannelli erano superfici e non ancora card (10e). Le asserzioni qui
   sotto pinnano la rimozione DA QUESTO LATO — la coppia col foglio sta in
   `instanceManager10h.test.ts`, dove l'asserzione ratificata che lo pinnava è
   rovesciata. */
describe('10k-ter — la card della form tiene il bordo su tutti e quattro i lati', () => {
    const CARDS = block(RULES, '&__pane--table,');

    it('positivo di controllo: il blocco delle due card esiste e dichiara il bordo', () => {
        expect(CARDS).not.toBe('');
        expect(CARDS).toContain('border: 1px solid var(--color-form-border);');
    });

    it('nessuna regola azzera più il lato sinistro dei pannelli impilati', () => {
        expect(RULES).not.toMatch(
            /&__main > \.instance-manager__pane \+ \.instance-manager__pane \{ border-left: 0; \}/,
        );
        expect(RULES).not.toMatch(/border-left:\s*(0|none)\s*;/);
    });

    it('il lato sinistro non viene rimesso con un token diverso dagli altri tre', () => {
        // Il bordo che ricompare è quello della card, non un secondo filetto: se
        // qualcuno lo ridichiarasse con `--color-form-border-strong` i quattro
        // lati direbbero due cose diverse. Il vincolo è già in 10h su TUTTI i
        // `border-left` del foglio; qui si pinna che il blocco card non ne
        // aggiunga uno proprio.
        expect(CARDS).not.toContain('border-left');
    });

    it('la banda dell\'header resta insettata dentro il bordo, non sopra', () => {
        // I margini negativi devono valere il padding di `__form-inner`, non un
        // numero copiato: se crescessero, la banda tornerebbe sul bordo.
        const FH = block(RULES, '&__form-head {');
        const INNER = block(RULES, '&__form-inner {');
        expect(FH).not.toBe('');
        expect(INNER).not.toBe('');
        const pad = INNER.match(/padding:\s*(\d+)px/);
        const mar = FH.match(/margin:\s*-(\d+)px -(\d+)px/);
        expect(pad, 'padding di __form-inner non leggibile').not.toBeNull();
        expect(mar, 'margin di __form-head non leggibile').not.toBeNull();
        expect(mar![1]).toBe(pad![1]);
        expect(mar![2]).toBe(pad![1]);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. La colonna NAME doppia
// ─────────────────────────────────────────────────────────────────────────────

const col = (key: string): TableColumn => ({
    key, label: key, kind: 'attr', typeName: 'EString', multiplicity: '0..1',
    required: false, derived: false, readOnly: false, many: false,
});
const cell = (text: string, count = 1): TableCell => ({
    text, count, broken: false, missingRequired: false,
    decision: { kind: 'text', reason: 'test' } as any,
});
const row = (id: string, name: string, cells: Record<string, TableCell>): TableRow =>
    ({ id, name, cells, referencedBy: [], haystack: name.toLowerCase() });

describe('10k punto 4 — la colonna che ripete i nomi', () => {
    const COLS = [col('name'), col('kind')];

    it('positivo di controllo: senza doppione la funzione tace, e le vuote no', () => {
        const rows = [
            row('a', 'Idle', { name: cell('primo'), kind: cell('', 0) }),
            row('b', 'Running', { name: cell('secondo'), kind: cell('', 0) }),
        ];
        expect(duplicateNameColumnKeys(rows, COLS)).toEqual([]);
        expect(emptyColumnKeys(rows, COLS)).toEqual(['kind']);   // lo strumento ha segnale
    });

    it('la trova quando ogni riga ripete il proprio nome', () => {
        const rows = [
            row('a', 'Idle', { name: cell('Idle'), kind: cell('normal') }),
            row('b', 'Running', { name: cell('Running'), kind: cell('normal') }),
        ];
        expect(duplicateNameColumnKeys(rows, COLS)).toEqual(['name']);
    });

    it('basta UNA riga che diverge e la colonna resta', () => {
        // Li' porta un'informazione che la colonna fissa non ha.
        const rows = [
            row('a', 'Idle', { name: cell('Idle'), kind: cell('normal') }),
            row('b', 'Running', { name: cell(''), kind: cell('normal') }),
        ];
        expect(duplicateNameColumnKeys(rows, COLS)).toEqual([]);
    });

    it('uno slot multivalore che PER CASO comincia col nome non e\' un doppione', () => {
        const rows = [row('a', 'Idle', { name: cell('Idle', 3), kind: cell('normal') })];
        expect(duplicateNameColumnKeys(rows, COLS)).toEqual([]);
    });

    it('senza righe, e senza una colonna `name`, non decide nulla', () => {
        expect(duplicateNameColumnKeys([], COLS)).toEqual([]);
        const rows = [row('a', 'Idle', { kind: cell('normal') })];
        expect(duplicateNameColumnKeys(rows, [col('kind')])).toEqual([]);
    });

    it('il pannello la marca `duplicate`, e NON `empty`: e\' piena di valori', () => {
        const toggles = columnToggles(COLS, ['name', 'kind'], {}, ['name']);
        const name = toggles.find(t => t.key === 'name')!;
        const kind = toggles.find(t => t.key === 'kind')!;
        expect(name).toMatchObject({ duplicate: true, empty: false, checked: false, locked: false });
        expect(kind).toMatchObject({ duplicate: false, empty: true, checked: false });
    });

    it('e la voce resta UNA sola: la sintetica si tira indietro (10i)', () => {
        const toggles = columnToggles(COLS, ['name'], {}, ['name']);
        expect(toggles.filter(t => t.key === 'name')).toHaveLength(1);
    });

    it('l\'override dell\'utente vince sul doppione come vince sulle vuote', () => {
        const toggles = columnToggles(COLS, ['name'], { name: true }, ['name']);
        expect(toggles.find(t => t.key === 'name')).toMatchObject({ checked: true, duplicate: true });
    });

    it('il tab la infila nello STESSO canale delle vuote, non in un secondo', () => {
        expect(CODE).toMatch(/const duplicateKeys = useMemo\(\s*\(\) => duplicateNameColumnKeys\(rows, columns\)/);
        expect(CODE).toMatch(/\[\.\.\.emptyColumnKeys\(rows, columns\), \.\.\.duplicateKeys\]/);
        expect(CODE).toContain('columnToggles(columns, hiddenColumnKeys, overrides, duplicateKeys)');
        // 10i non regredisce: l'export e le colonne stampate leggono ancora
        // `hiddenColumnKeys`, che ora contiene entrambe le riduzioni.
        expect(CODE).toContain('shownColumnsWith(columns, hiddenColumnKeys, overrides)');
    });

    it('l\'indicatore dice «empty» solo quando lo sono tutte', () => {
        // La forma di 10i sopravvive nel ramo senza doppioni — e' cio' che
        // `instanceManager10i.test.ts` pinna — e accanto c'e' quello generale.
        expect(CODE).toMatch(/\{autoHiddenKeys\.length\} empty column/);
        expect(CODE).toMatch(/\{autoHiddenKeys\.length\} column\{/);
        expect(CODE).toContain('Same as the name column:');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4-bis. 10k-dd: la rifinitura del pannello Columns
// ─────────────────────────────────────────────────────────────────────────────

describe('10k-dd — il pannello Columns si legge a colpo d\'occhio', () => {
    const PANEL = block(RULES, '&__columns-panel {');
    const ITEM = block(RULES, '&__columns-item {');

    it('positivo di controllo: le due regole esistono', () => {
        expect(PANEL).not.toBe('');
        expect(ITEM).not.toBe('');
    });

    it('una colonna NASCOSTA porta l\'etichetta in muted: e\' la gerarchia', () => {
        // La sola dichiarazione che rende leggibile un elenco di nove righe
        // senza contare nove caselle.
        expect(ITEM).toContain('&--off { color: var(--color-form-muted); }');
        expect(CODE).toContain("(t.checked ? '' : ' instance-manager__columns-item--off')");
    });

    it('…e la casella NON si smorza con lei', () => {
        // Una casella smorzata si legge come disattivata, e queste sono tutte
        // cliccabili. Il colore sta sulla riga, non sull'input.
        expect(ITEM).not.toMatch(/&--off \{[^}]*input/s);
    });

    it('la testata conta le visibili, e non ripete la parola del bottone', () => {
        expect(CODE).toContain('instance-manager__columns-head');
        expect(CODE).toMatch(/\{toggles\.filter\(t => t\.checked\)\.length\} of \{toggles\.length\} shown/);
        // «Columns» e' sul bottone da cui il pannello e' appena nato.
        const head = block(RULES, '&__columns-head {');
        expect(head).toContain('border-bottom: 1px solid var(--color-form-border)');
    });

    it('le righe si toccano, e l\'hover e\' quello delle altre liste', () => {
        expect(PANEL).toContain('gap: 0;');
        expect(ITEM).toContain('&:hover { background: var(--color-bg-hover); }');
        expect(ITEM).toContain('transition: background-color 150ms ease-out');
    });

    it('il popover prende il raggio del DS e si stacca dalla card sotto', () => {
        expect(PANEL).toContain('border-radius: var(--radius-dropdown)');
        expect(PANEL).toContain('box-shadow: 0 4px 12px var(--color-node-shadow)');
    });

    it('la nota resta LEGGIBILE: muted, non slate-300', () => {
        // Misurato: slate-300 su bianco da' ~1.6:1, e la nota e' l'unica cosa
        // che spiega perche' una casella e' spenta. Stessa conclusione di DS3
        // su `__draft-label`.
        const empty = block(RULES, '&__columns-empty {');
        expect(empty).toContain('color: var(--color-form-muted)');
        expect(empty).not.toContain('--color-form-border-strong');
    });

    it('e cede il posto all\'etichetta, invece di uscire dal pannello', () => {
        expect(block(RULES, '&__columns-empty {')).toContain('flex: none');
        expect(block(RULES, '&__columns-label {')).toContain('text-overflow: ellipsis');
        expect(CODE).toContain('<span className="instance-manager__columns-label">{t.label}</span>');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CHILDREN e ADD CONTAINED
// ─────────────────────────────────────────────────────────────────────────────

describe('10k punto 6 — una sola sezione parla dei figli', () => {
    it('positivo di controllo: la barra dei figli e la sua CTA sono ancora montate', () => {
        expect(CODE).toContain('instance-manager__children');
        expect(CODE).toMatch(/Add \{child\.of\}/);
    });

    it('l\'eyebrow «Add contained» e\' sparito dal MARKUP', () => {
        expect(CODE).not.toContain('Add contained');
    });

    it('…e sopravvive solo nel commento che dice perche\'', () => {
        // Il controllo che distingue «rimossa» da «mai cercata»: la frase c'e'
        // ancora nel file, e non c'e' piu' nel codice.
        expect(TSX).toContain('Add contained');
    });

    it('la barra perde il filetto e la gronda che ne facevano una sezione', () => {
        const ch = block(RULES, '&__children {');
        expect(ch).toMatch(/padding:\s*0 14px 14px/);
        expect(ch).not.toContain('border-top');
    });

    it('`IRForm` non e\' toccato: la sezione CHILDREN resta sua', () => {
        // La cucitura di 2a. Se un domani la CTA scendesse dentro `IRForm`, la
        // monterebbe anche il rail del canvas.
        expect(CODE).toContain('<IRForm objectId=');
        expect(CODE).not.toMatch(/<IRForm[^>]*onAddChild/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. La passata
// ─────────────────────────────────────────────────────────────────────────────

describe('10k punto 9 — la passata, solo con token del sistema', () => {
    it('positivo di controllo: le due card hanno ancora il loro chrome', () => {
        const card = block(RULES, '&__pane--table,');
        expect(card).toContain('border-radius: var(--radius-card)');
        expect(card).toContain('box-shadow: var(--shadow-desk-card)');
    });

    it('l\'ombra resta `--shadow-desk-card` e NON diventa `--shadow-sm`', () => {
        // Il prompt nominava `--shadow-sm`. E' dichiarato due volte con valori
        // diversi (`tokens/_shadows.scss` e `tokens.css`) e 10d misuro' che a
        // schermo dipinge quello di `tokens.css`: il ruolo di queste card e'
        // `--shadow-desk-card`, scritto per esteso proprio per non dipendere
        // dalla cascata.
        expect(RULES).not.toContain('var(--shadow-sm)');
    });

    it('l\'hover di riga e\' `--color-bg-hover` in tabella e nel rail', () => {
        expect(block(RULES, '&__row {')).toContain('&:hover { background: var(--color-bg-hover); }');
        expect(block(RULES, 'tbody tr {')).toContain('&:hover { background: var(--color-bg-hover); }');
    });

    it('150ms ease-out su ogni stato che prima scattava', () => {
        const t = RULES.match(/transition:[^;]*150ms ease-out/g) ?? [];
        // Nove: i due checkbox (scatola e spunta), le due righe, i quattro
        // controlli della barra e il cestino, piu' Delete della form.
        expect(t.length).toBeGreaterThanOrEqual(9);
        for (const decl of t) expect(decl).not.toContain('transition: all');
    });

    it('nessun valore inventato: le transizioni non portano colori letterali', () => {
        const t = RULES.match(/transition:[^;]*;/g) ?? [];
        for (const decl of t) expect(decl).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    });

    it('e la slice non ha introdotto un token nuovo nel file (Regola 28)', () => {
        // Nessun `--x: valore` dichiarato qui dentro: le variabili vivono in
        // `styles/tokens/`.
        expect(RULES).not.toMatch(/^\s*--[a-z-]+:\s/m);
    });
});
