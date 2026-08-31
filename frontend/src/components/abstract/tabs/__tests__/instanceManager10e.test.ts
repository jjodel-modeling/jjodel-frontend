/**
 * 10e — conformità dell'outline al DS, e misura della colonna centrale.
 *
 * Slice di solo chrome, come 10d: nessuna logica nuova, quindi niente da
 * eseguire. Tutte le asserzioni sono sul SORGENTE, e lo sono per necessità
 * misurata (cfr. il docstring di `instanceManager10c.test.ts`):
 * `InstanceManagerTab.tsx` importa il barrel di `editor-v2/`, che arriva a
 * monaco, che dereferenzia `window` all'import, e il file muore prima del primo
 * `it`.
 *
 * Il criterio è quello del prompt: asserzioni su CLASSI e TOKEN, mai su pixel.
 * Un test che dicesse «la card è larga 1300px» misurerebbe un viewport; «la card
 * dichiara max-width: 1300px» fallisce dicendo quale regola è sparita.
 *
 * Quello che questi test NON possono dire, e che la sonda dice: la specificità.
 * Il colore del glifo dipende da chi vince contro `i.bi` di `styles/style.scss`,
 * e la cascata non si legge in un file — si misura a schermo. La coppia
 * before/after di `scripts/smoke/_tmp_10e_verify.ts` è lì per quello.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e
 * una lettura che non è avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TSX = readFileSync(resolve(__dirname, '../InstanceManagerTab.tsx'), 'utf8');
const SCSS = readFileSync(resolve(__dirname, '../instanceManagerTab.scss'), 'utf8');

/** Il foglio senza i commenti: le asserzioni di ASSENZA leggono questo. Un
 *  «X non c'è più» che legge anche la prosa che spiega perché X è stato tolto
 *  non distingue la rimozione documentata dalla presenza. */
const RULES = SCSS.replace(/\/\*[\s\S]*?\*\//g, '');

/** Il sorgente TSX senza commenti, per lo stesso motivo: il docstring di
 *  `OutlinePanel` NOMINA `bi-folder2` e `bi-circle` per dire che sono spariti. */
const CODE = TSX.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Il corpo di una regola, dalla graffa aperta alla prima chiusa. Sufficiente
 *  per i blocchi piatti; non regge i nidificati. */
function block(source: string, selector: string, after = ''): string {
    const from = after ? source.indexOf(after) + after.length : 0;
    const at = source.indexOf(selector, from);
    expect(at, `selettore assente: ${selector}`).toBeGreaterThan(-1);
    const open = source.indexOf('{', at);
    return source.slice(open, source.indexOf('}', open) + 1);
}

/** La regola condivisa delle due card. Stessa ancora di 10d, e va tenuta
 *  identica: quel file la cerca per questa stringa esatta. */
const CARD_RULE = '&__pane--table,\n    &__pane--form {';

/* 10f ha sostituito il glifo dell'outline con un badge lettera, e con esso sono
 * spariti `icon`, `iconKind`, le due classi `__outline-icon--model`/`--object` e
 * la regola a tre livelli che le dipingeva. Le asserzioni POSITIVE su quel
 * materiale vivono ora in `instanceManager10f.test.ts`.
 *
 * Qui restano, invertite in asserzioni di ASSENZA invece che cancellate: e' la
 * regola che 10c ha applicato a `instanceManagerFl6.test.ts`, e il motivo e' che
 * un test tolto non dice niente il giorno in cui qualcuno riscrive la riga che
 * aveva tolto. Le due cose che 10f NON tocca — i glifi generici di 10b spariti,
 * il triangolo di 12d — restano positive. */
describe('10e — le icone dell\'outline, superate da 10f', () => {
    it('positivo di controllo: il pannello esiste ancora', () => {
        expect(CODE).toContain('function OutlinePanel({');
    });

    it('via cartelle e cerchi: i due glifi generici di 10b non sono più nel codice', () => {
        expect(CODE).not.toContain('bi-folder2');
        expect(CODE).not.toContain('bi-circle');
    });

    it('il puntatore morto tiene il triangolo, e la regola di 12d è intatta', () => {
        expect(CODE).toContain('bi bi-exclamation-triangle instance-manager__outline-icon');
        expect(RULES).toContain('&__outline-node--broken {');
        const broken = block(RULES, '&__outline-node--broken {');
        expect(broken).toContain('color: var(--color-error)');
    });

    it('il glifo per genere di 10e non c\'è più: né funzioni, né classi, né regola', () => {
        expect(CODE).not.toContain('const iconKind');
        expect(CODE).not.toContain('instance-manager__outline-icon--model');
        expect(CODE).not.toContain('instance-manager__outline-icon--object');
        expect(RULES).not.toContain('instance-manager__outline-icon--');
        // e `entityIcon` non è più importato: nessun consumatore è rimasto
        expect(CODE).not.toContain('entityIcon');
    });
});

describe('10e — il nodo modello in testa', () => {
    it('positivo di controllo: il modificatore del nodo modello è nel JSX', () => {
        expect(CODE).toContain("node.kind === 'model' ? ' instance-manager__outline-node--model' : ''");
    });

    it('il nome del modello è in 12/600, e il peso è solo suo', () => {
        expect(RULES).toContain(
            '&__outline-node--model .instance-manager__outline-name { font-weight: 600; }');
        // la riga resta a 12px: il peso non porta con sé una dimensione
        const node = block(RULES, '&__outline-node {');
        expect(node).toContain('font-size: 12px');
        // e il nome generico NON dichiara un peso, o l'albero sarebbe tutto in 600
        const name = block(RULES, '&__outline-name {');
        expect(name).not.toContain('font-weight');
    });
});

describe('10e — la classe a destra, in parità con la tabella (A4)', () => {
    it('positivo di controllo: la regola del mono esiste, ed è una sola', () => {
        expect(RULES).toContain('&__code {');
        expect(RULES.match(/&__code \{/g)).toHaveLength(1);
    });

    it('un valore solo ovunque: mono 11px su --color-form-section', () => {
        const code = block(RULES, '&__code {');
        expect(code).toContain("font-family: 'IBM Plex Mono'");
        expect(code).toContain('font-size: 11px');
        expect(code).toContain('color: var(--color-form-section)');
    });

    it('e l\'outline usa QUELLA classe, non un mono proprio', () => {
        expect(CODE).toContain('<span className="instance-manager__code">{node.cls}</span>');
        // nessuna regola che ridichiari il mono dentro l'outline
        const outlineSlice = RULES.slice(RULES.indexOf('&__outline {'));
        expect(outlineSlice.slice(0, outlineSlice.indexOf('&__ego')))
            .not.toContain('IBM Plex Mono');
    });
});

describe('10e — densità della riga', () => {
    it('positivo di controllo: la regola della riga esiste', () => {
        expect(RULES).toContain('&__outline-node {');
    });

    it('28px di altezza MINIMA, non di padding', () => {
        const node = block(RULES, '&__outline-node {');
        expect(node).toContain('min-height: 28px');
        // il padding resta quello di 10b: allargarlo avrebbe legato la densità
        // allo stato del menu «+»
        expect(node).toContain('padding: 4px 10px 4px 14px');
    });

    it('l\'hover è --color-bg-hover, e --color-bg-tertiary è sparito dalla riga', () => {
        const node = block(RULES, '&__outline-node {');
        expect(node).toContain('&:hover { background: var(--color-bg-hover); }');
        expect(node).not.toContain('--color-bg-tertiary');
    });

    it('l\'indent resta 16px per livello con inserto 14, inline sulla profondità', () => {
        expect(CODE).toContain('style={{ paddingLeft: 14 + node.depth * 16 }}');
    });
});

describe('10e — il «+» dei child-slot resta, raggiungibile e visibile', () => {
    it('positivo di controllo: il controllo è nel JSX', () => {
        expect(CODE).toContain('className="instance-manager__outline-add"');
    });

    it('è un `button`, quindi nel tab order per costruzione', () => {
        const at = CODE.indexOf('className="instance-manager__outline-add"');
        const around = CODE.slice(at - 200, at + 400);
        expect(around).toContain('type="button"');
        expect(around).not.toContain('tabIndex={-1}');
        expect(around).toContain('aria-label={`Add inside');
    });

    it('e il foglio lo accende al focus da tastiera, non solo all\'hover', () => {
        const add = block(RULES, '&__outline-add {');
        expect(add).toContain('opacity: 0');
        expect(add).toContain('&:focus-visible { opacity: 1;');
        expect(RULES).toContain('&__outline-node:hover .instance-manager__outline-add');
    });
});

describe('10e — il cinturino a 1300px sulle due card', () => {
    it('positivo di controllo: la regola condivisa delle card esiste', () => {
        expect(RULES).toContain(CARD_RULE);
    });

    it('entrambe le card prendono il cinturino, e lo prendono una volta sola', () => {
        const card = block(RULES, CARD_RULE);
        expect(card).toContain('width: 100%');
        expect(card).toContain('max-width: 1300px');
        expect(card).toContain('margin-inline: auto');
    });

    it('non è una regola per la sola tabella: sta nel blocco CONDIVISO', () => {
        // se il cinturino finisse nella regola propria di `__pane--table`, le due
        // card tornerebbero a due larghezze diverse — il difetto di partenza.
        const own = block(RULES, '&__pane--table {', CARD_RULE);
        expect(own).not.toContain('max-width');
    });

    it('il desk resta il contenitore, e non ha preso lui il cinturino', () => {
        const main = block(RULES, '&__main {');
        expect(main).not.toContain('max-width');
        expect(main).toContain('padding: 12px');
        expect(main).toContain('gap: 12px');
    });
});

describe('10e — la card tabella abbraccia il contenuto', () => {
    it('positivo di controllo: la regola propria della tabella esiste', () => {
        expect(RULES).toContain('&__pane--table { flex:');
    });

    it('niente flex-grow: la card non si stira più al fondo del desk', () => {
        const own = block(RULES, '&__pane--table {', CARD_RULE);
        expect(own).toContain('flex: 0 1 auto');
        expect(own).not.toContain('flex: 1 1 auto');
    });

    it('ma lo shrink resta: il vincolo di FL6 non è perso', () => {
        // con `0 0 auto` una tabella lunga spingerebbe la form fuori dal desk
        const own = block(RULES, '&__pane--table {', CARD_RULE);
        expect(own).toContain('min-height: 0');
        expect(own).toContain('overflow: hidden');
    });

    it('e la regione di scorrimento interna è invariata', () => {
        const scroll = block(RULES, '&__table-scroll {');
        expect(scroll).toContain('flex: 1 1 auto');
        expect(scroll).toContain('overflow: auto');
    });
});

describe('10e — non-regressioni di 10d', () => {
    it('le due card tengono i quattro token del chrome', () => {
        const card = block(RULES, CARD_RULE);
        expect(card).toContain('border: 1px solid var(--color-form-border)');
        expect(card).toContain('border-radius: var(--radius-card)');
        expect(card).toContain('background: var(--color-form-surface)');
        expect(card).toContain('box-shadow: var(--shadow-desk-card)');
    });

    it('il fondo desk resta --color-form-panel', () => {
        const main = block(RULES, '&__main {');
        expect(main).toContain('background: var(--color-form-panel)');
    });

    it('il footer resta il bordo inferiore della card', () => {
        const foot = block(RULES, '&__foot {');
        expect(foot).toContain('margin: 8px -14px -14px');
        expect(foot).toContain('border-top: 1px solid var(--color-form-border)');
    });

    it('la coppia di selezione dell\'outline è intatta, ed è quella della tabella', () => {
        expect(RULES).toContain('background: var(--color-selection-bg)');
        expect(RULES).toContain('box-shadow: inset 2px 0 0 var(--color-selection-bar)');
    });

    it('nessuna variabile CSS dichiarata nel foglio del componente (Regola 28)', () => {
        expect(RULES).not.toMatch(/^\s*--[a-z-]+:/m);
    });
});
