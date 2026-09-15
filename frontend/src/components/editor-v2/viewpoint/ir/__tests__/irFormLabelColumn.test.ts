/**
 * FL8 — la colonna etichetta e' un CAP, e sotto una certa cella il campo si impila.
 *
 * Reperto STYLE1 (`docs/discovery/discovery_2026-09-01_style1_tema_form.md` §7): nei due
 * preset a etichetta laterale il rail a 400px lasciava 7.75px al controllo, perche'
 * `irFormStyle.scss` metteva una colonna etichetta FISSA a 72px su ogni `.ir-field`,
 * qualunque fosse la span della cella, e il packer FL1 produce anche celle da 3/12
 * (87.8px misurati). Il select di `tint` usciva vuoto, gli stepper perdevano il campo.
 *
 * Quello che questi test NON possono dire, e che la sonda dice: quanto viene ASSEGNATO
 * alle tracce. La grammatica si legge nel sorgente, il riparto lo decide il browser —
 * `scripts/smoke/_tmp_fl8_verify.ts`, before `72px 7.75px` con 4 controlli sotto i 40px
 * e 2 in overflow per preset, after `87.75px` (impilato) con zero e zero, e i due preset
 * a etichetta sopra byte per byte identici al before.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e una
 * lettura che non e' avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { LABEL_COLUMN_WIDTH } from '../../../../../jjform/themes';

const SCSS = readFileSync(resolve(__dirname, '../irFormStyle.scss'), 'utf8');
/** Il foglio dei token, per non asserire su un `--space-2` mai letto. */
const SPACING = readFileSync(resolve(__dirname, '../../../../../styles/tokens/_spacing.scss'), 'utf8');

/** Il sorgente senza commenti: le misure di FL8 sono citate anche in prosa, e una regex
 *  che le trovasse li' misurerebbe il commento invece della regola. */
const RULES = SCSS.replace(/\/\*[\s\S]*?\*\//g, '');

/** Il corpo di un blocco, contando l'annidamento: `@container` ne contiene altri, e
 *  fermarsi alla prima `}` misurerebbe mezza regola. */
function block(source: string, selector: string): string {
    const at = source.indexOf(selector);
    expect(at, `selettore assente: ${selector}`).toBeGreaterThan(-1);
    const open = source.indexOf('{', at);
    let depth = 0;
    for (let i = open; i < source.length; i++) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}' && --depth === 0) return source.slice(open, i + 1);
    }
    throw new Error(`blocco non chiuso: ${selector}`);
}

const LEFT_FIELD = '.ir-form[data-label-placement="left"] .ir-field {';

describe('il foglio si legge, e le regole che FL8 tocca ci sono', () => {
    it('positivo di controllo: il foglio e\' leggibile e non e\' vuoto', () => {
        expect(SCSS.length).toBeGreaterThan(1000);
        expect(RULES.length).toBeGreaterThan(1000);
        expect(RULES).not.toContain('the theme, as the preset resolves it');  // i commenti sono via
    });

    it('positivo di controllo: la regola del campo a etichetta sinistra esiste', () => {
        expect(RULES).toContain(LEFT_FIELD);
    });
});

describe('la colonna etichetta e\' un cap, non una larghezza', () => {
    const body = block(RULES, LEFT_FIELD);

    it('la traccia dell\'etichetta e\' `minmax(0, cap)`: puo\' cedere spazio', () => {
        expect(body).toMatch(/grid-template-columns:[\s\S]*minmax\(\s*0\s*,\s*var\(--ir-form-label-col,\s*72px\)\s*\)/);
    });

    it('la traccia del controllo porta un floor, cioe\' ha priorita\' sullo spazio', () => {
        expect(body).toMatch(/minmax\(\s*min\(\s*var\(--ir-form-control-min,\s*48px\)\s*,\s*100%\s*\)\s*,\s*1fr\s*\)/);
    });

    it('la larghezza FISSA che produceva il difetto non e\' piu\' nel foglio', () => {
        // `var(--ir-form-label-col, 72px)` NON preceduto da `minmax(0,`: la forma vecchia.
        expect(body).not.toMatch(/grid-template-columns:\s*var\(--ir-form-label-col/);
    });

    it('il default del cap e\' quello che `themes.ts` emette, non un secondo numero', () => {
        expect(LABEL_COLUMN_WIDTH).toBe(72);
        expect(body).toContain(`var(--ir-form-label-col, ${LABEL_COLUMN_WIDTH}px)`);
    });

    it('la skin compact conserva i suoi 88px committati', () => {
        expect(RULES).toMatch(/\.ir-form--compact\s*\{\s*--ir-form-label-col:\s*88px;\s*\}/);
    });
});

describe('il floor del controllo e\' letto dal foglio, non scelto', () => {
    it('positivo di controllo: lo stepper dichiara i suoi due bottoni', () => {
        expect(block(RULES, '.ir-field__stepper-btn {')).toMatch(/flex:\s*0\s+0\s+24px/);
    });

    it('48px e\' la chrome dello stepper: due bottoni da 24, e nessun campo in mezzo sotto', () => {
        const btn = block(RULES, '.ir-field__stepper-btn {').match(/flex:\s*0\s+0\s+(\d+)px/);
        expect(btn).not.toBeNull();
        expect(2 * Number(btn![1])).toBe(48);
        expect(block(RULES, LEFT_FIELD)).toContain('var(--ir-form-control-min, 48px)');
    });
});

describe('sotto la cella minima il campo si impila', () => {
    it('positivo di controllo: il contenitore e la query esistono', () => {
        expect(RULES).toContain('.ir-form[data-label-placement="left"] .ir-form__cell { container-type: inline-size; }');
        expect(RULES).toMatch(/@container \(max-width: 128px\)/);
    });

    it('la soglia e\' cap + gap + floor, non un numero scelto', () => {
        const gap = SPACING.match(/--space-2:\s*([\d.]+)rem/);
        expect(gap, 'il token del gap non e\' stato letto').not.toBeNull();
        const gapPx = Number(gap![1]) * 16;
        expect(gapPx).toBe(8);
        const soglia = RULES.match(/@container \(max-width: (\d+)px\)/);
        expect(soglia).not.toBeNull();
        expect(Number(soglia![1])).toBe(LABEL_COLUMN_WIDTH + gapPx + 48);
    });

    it('il campo impilato e\' a una colonna sola, con il gap verticale del `top`', () => {
        const q = block(RULES, '@container (max-width: 128px)');
        expect(q).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
        expect(q).toMatch(/row-gap:\s*4px/);
    });

    it('la riga del messaggio segue il controllo nella prima colonna', () => {
        expect(block(RULES, '@container (max-width: 128px)')).toMatch(/__message\s*\{\s*grid-column:\s*1/);
    });

    it('l\'etichetta impilata prende l\'allineamento del `top`, non il `right` del `left`', () => {
        expect(block(RULES, '@container (max-width: 128px)')).toMatch(/__label\s*\{\s*text-align:\s*left/);
    });
});

describe('i due preset a etichetta SOPRA non sono toccati', () => {
    it('positivo di controllo: il foglio parla di entrambi i placement', () => {
        expect(RULES).toContain('data-label-placement="left"');
        expect(RULES).toMatch(/\.ir-field\s*\{/);   // la regola base del campo, quella del `top`
    });

    it('ogni selettore dentro la query e\' qualificato `left`', () => {
        const q = block(RULES, '@container (max-width: 128px)');
        const inner = q.slice(1, -1);   // via le graffe della query, restano le regole
        const selectors = Array.from(inner.matchAll(/([^{}]+)\{[^{}]*\}/g)).map(m => m[1].trim());
        expect(selectors.length).toBe(3);
        for (const s of selectors) expect(s).toContain('[data-label-placement="left"]');
    });

    it('il contenitore non e\' dichiarato sulla cella nuda: senza la qualifica, la containment varrebbe anche per il `top`', () => {
        expect(RULES).not.toMatch(/(^|\n)\s*\.ir-form__cell\s*\{[^}]*container-type/);
    });

    it('la regola base `.ir-field` resta flex a colonna', () => {
        expect(block(RULES, '\n.ir-field {')).toMatch(/display:\s*flex;[\s\S]*flex-direction:\s*column/);
    });
});
