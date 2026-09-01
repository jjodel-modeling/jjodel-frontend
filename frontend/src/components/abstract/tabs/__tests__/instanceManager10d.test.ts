/**
 * 10d — sfondo e card della colonna centrale del manager.
 *
 * Slice di solo chrome: nessuna logica nuova, quindi niente da eseguire. Tutte
 * le asserzioni sono sul SORGENTE, e lo sono per necessita' misurata (cfr. il
 * docstring di `instanceManager10c.test.ts`): `InstanceManagerTab.tsx` importa
 * il barrel di `editor-v2/`, che arriva a monaco, che dereferenzia `window`
 * all'import, e il file muore prima del primo `it`.
 *
 * Il criterio e' quello del prompt: asserzioni su CLASSI e TOKEN, mai su pixel.
 * Un test che dicesse «la card e' alta 412px» erediterebbe il modello che ha
 * prodotto quel 412 e fallirebbe senza spiegare; «la card legge
 * --color-form-surface» fallisce dicendo quale token e' sparito.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e
 * una lettura che non e' avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TSX = readFileSync(resolve(__dirname, '../InstanceManagerTab.tsx'), 'utf8');
const SCSS = readFileSync(resolve(__dirname, '../instanceManagerTab.scss'), 'utf8');

/** Il foglio senza i commenti: le asserzioni di ASSENZA leggono questo. Un
 *  «X non c'e' piu'» che legge anche la prosa che spiega perche' X e' stato
 *  tolto non distingue la rimozione documentata dalla presenza. */
const RULES = SCSS.replace(/\/\*[\s\S]*?\*\//g, '');

/** Il corpo di una regola, dalla graffa aperta alla prima chiusa. Sufficiente
 *  per i blocchi piatti che questa slice tocca; non regge i nidificati, e nessuno
 *  di quelli letti qui lo e'. */
function block(source: string, selector: string, after = ''): string {
    // `after` non e' comodita': `&__pane--form {` compare DUE volte — nella
    // regola condivisa delle card e nella propria — e un `indexOf` nudo
    // leggerebbe sempre la prima, cioe' misurerebbe la card credendo di
    // misurare il pannello. Chi cerca la seconda lo dice.
    const from = after ? source.indexOf(after) + after.length : 0;
    const at = source.indexOf(selector, from);
    expect(at, `selettore assente: ${selector}`).toBeGreaterThan(-1);
    const open = source.indexOf('{', at);
    return source.slice(open, source.indexOf('}', open) + 1);
}

/** La regola condivisa delle due card. Ancora per le ricerche che vengono dopo. */
const CARD_RULE = '&__pane--table,\n    &__pane--form {';

describe('10d — il fondo desk della colonna centrale', () => {
    it('positivo di controllo: il contenitore della colonna esiste, in foglio e in JSX', () => {
        expect(RULES).toContain('&__main {');
        expect(TSX).toContain('<div className="instance-manager__main">');
    });

    it('la colonna centrale dipinge il fondo desk, non il bianco', () => {
        const main = block(RULES, '&__main {');
        expect(main).toContain('background: var(--color-form-panel)');
        expect(main).not.toContain('--color-form-surface');
    });

    it('il fondo desk sta su __main e NON sulla radice: i rail restano superficie', () => {
        // La radice tiene i due pannelli di lettura a sinistra. Se prendesse il
        // fondo desk, il rail metaclassi diventerebbe grigio con loro.
        const root = block(RULES, '.instance-manager {');
        expect(root).toContain('background: var(--color-form-surface)');
        expect(root).not.toContain('--color-form-panel');
    });

    it('il desk ha gronda e distacco: senza il gap le due card si rifondono', () => {
        const main = block(RULES, '&__main {');
        expect(main).toMatch(/padding:\s*12px/);
        expect(main).toMatch(/gap:\s*12px/);
    });

    it('il token del fondo NON e\' uno dei nomi dichiarati due volte', () => {
        // --color-bg-primary / --color-bg-secondary sono fra i 15 che
        // styles/tokens.css ridichiara con valori diversi, e tokens.css vince:
        // il primo vale #ffffff, cioe' il bianco che questa slice toglie.
        //
        // L'asserzione e' SCOPED ai tre blocchi che 10d scrive, non al foglio:
        // cinque occorrenze di --color-bg-primary precedono questa slice (i
        // popover del rail, il menu dell'outline, l'ego), e asserirne l'assenza
        // sul foglio intero significherebbe far fallire 10d per codice che non
        // ha toccato. Dichiarate, non toccate.
        for (const rule of [block(RULES, '&__main {'), block(RULES, CARD_RULE), block(RULES, '&__foot {')]) {
            expect(rule).not.toContain('--color-bg-primary');
            expect(rule).not.toContain('--color-bg-secondary');
        }
    });
});

describe('10d — le due card gemelle', () => {
    it('positivo di controllo: la regola condivisa esiste e nomina entrambi i pannelli', () => {
        expect(RULES).toContain(CARD_RULE);
    });

    it('i quattro token della card, sugli STESSI due selettori', () => {
        const card = block(RULES, CARD_RULE);
        expect(card).toContain('background: var(--color-form-surface)');
        expect(card).toContain('border: 1px solid var(--color-form-border)');
        expect(card).toContain('border-radius: var(--radius-card)');
        // --shadow-desk-card, non --shadow-sm: quel nome e' dichiarato due
        // volte con valori diversi e a schermo dipingeva quello di tokens.css.
        expect(card).toContain('box-shadow: var(--shadow-desk-card)');
        expect(card).not.toContain('var(--shadow-sm)');
    });

    it('la form non ha piu\' il bordo superiore: il suo separatore ora e\' il fondo', () => {
        const form = block(RULES, '&__pane--form {', CARD_RULE);
        expect(form).toContain('max-height: 55%');       // positivo di controllo
        expect(form).not.toContain('border-top');
    });

    it('collassata, la form resta una card sottile', () => {
        // Nessuna regola di --form-collapsed spegne il chrome della card: il
        // pannello cambia altezza, non genere.
        const collapsed = block(RULES, '&__pane--form-collapsed {');
        expect(collapsed).toContain('flex: 0 0 auto');   // positivo di controllo
        expect(collapsed).not.toContain('border-radius');
        expect(collapsed).not.toContain('box-shadow');
        expect(collapsed).not.toContain('background');
    });
});

describe('10d — il footer dentro la card, la testata sopra di essa (10k punto 2)', () => {
    it('la testata sta FUORI dalla card, e prima; il footer dentro, e ultimo', () => {
        // Rovesciata da 10k punto 2. 10d asseriva `head > open`, cioe' la testata
        // DENTRO la card della tabella; ora la testata e' figlia del desk e apre
        // la colonna, con la card che comincia dalla toolbar. Il footer non si
        // muove: quello e' il bordo inferiore della card, e resta tale.
        const desk = TSX.indexOf('<div className="instance-manager__main">');
        const head = TSX.indexOf('<header className="instance-manager__head">');
        const open = TSX.indexOf('instance-manager__pane--table');
        const foot = TSX.indexOf('<footer className="instance-manager__foot">');
        expect(desk).toBeGreaterThan(-1);
        expect(head).toBeGreaterThan(desk);
        expect(open).toBeGreaterThan(head);
        expect(foot).toBeGreaterThan(open);
    });

    it('il footer sborda fino ai bordi della card', () => {
        const foot = block(RULES, '&__foot {');
        expect(foot).toMatch(/margin:\s*8px -14px -14px/);
        expect(foot).toContain('border-top: 1px solid var(--color-form-border)');
    });

    it('il pannello clippa: il raggio della card taglia il footer sbordato', () => {
        expect(block(RULES, '&__pane--table {')).toContain('overflow: hidden');
    });
});

describe('10d — il sottotitolo, arbitrato', () => {
    it('positivo di controllo: la testata rende ancora titolo e sottotitolo', () => {
        expect(TSX).toContain('<h2 className="instance-manager__title">{selectedClass.name}</h2>');
        expect(TSX).toContain('<p className="instance-manager__provenance">');
    });

    it('resta <modello> · N instances, e il conteggio e\' quello NON filtrato', () => {
        expect(TSX).toContain("{modelName} · {rows.length} instance{rows.length === 1 ? '' : 's'}");
    });
});

describe('10d — nessun valore nuovo nel foglio', () => {
    it('positivo di controllo: il foglio contiene i due esadecimali che gia\' aveva', () => {
        // I gradienti slate del bottone primario, che precedono questa slice.
        expect(RULES).toContain('#334155');
    });

    it('il ruolo dell\'ombra e\' dichiarato in tokens/, non nel componente', () => {
        // Regola 28: le variabili CSS vivono in styles/tokens/, mai nel foglio
        // del componente. Positivo di controllo: il ruolo esiste in entrambi i
        // temi del file dei token, e il foglio lo LEGGE senza dichiararlo.
        const SHADOWS = readFileSync(
            resolve(__dirname, '../../../../styles/tokens/_shadows.scss'), 'utf8');
        expect(SHADOWS.match(/--shadow-desk-card:/g)?.length).toBe(2);
        expect(RULES).not.toMatch(/^\s*--shadow-desk-card:/m);
    });

    it('la slice non introduce esadecimali ne\' rgba: solo token', () => {
        const HEX_BEFORE_10D = 4;    // #334155 #1e293b #ffffff / #334155 #0f172a → 5 occorrenze, 4 valori
        const RGBA_BEFORE_10D = 6;
        const hex = RULES.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
        const rgba = RULES.match(/rgba\(/g) ?? [];
        expect(new Set(hex).size).toBe(HEX_BEFORE_10D);
        expect(rgba.length).toBe(RGBA_BEFORE_10D);
    });
});
