/**
 * FL9 — il padding verticale della densita' non va ai controlli ad altezza fissa.
 *
 * Difetto misurato (`scripts/smoke/_tmp_fl9_recon.ts` e `_tmp_fl9_recon2.ts`): la regola
 * `.ir-form[data-density] .ir-field__control` dava `--ir-form-pad-y` anche a `select` e
 * `input`, che hanno gia' un'altezza fissa da `--input-height-sm`. Con
 * `box-sizing: border-box` quel padding non e' spaziatura: e' quanto del glifo viene
 * tagliato. A 13px Inter la banda dipinta di `Agjpqy` e' 14px, e il content box scendeva
 * a 12 sotto `comfortable` (pad 7) e sotto `compact` (pad 5, da un box da 24px).
 *
 * Quello che questi test NON possono dire, e che la sonda dice: quanti pixel di testo si
 * perdono davvero. `scripts/smoke/_tmp_fl9_verify.ts` li conta sui pixel dello schermo,
 * before 10/14 e 10/13, after 14/14 e 13/13 nei quattro preset, con la geometria della
 * form identica prima e dopo. Qui si asserisce solo la grammatica del foglio.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e una
 * lettura che non e' avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DENSITY_SCALE } from '../../../../../jjform/themes';

const SCSS = readFileSync(resolve(__dirname, '../irFormStyle.scss'), 'utf8');

/** Il sorgente senza commenti: le misure di FL9 sono citate anche in prosa, e una regex
 *  che le trovasse li' misurerebbe il commento invece della regola. */
const RULES = SCSS.replace(/\/\*[\s\S]*?\*\//g, '');

/** Il corpo di un blocco, contando l'annidamento. */
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

const DENSITY_RULE = '.ir-form[data-density] .ir-field__control,';
const FIXED_RULE = '.ir-form[data-density] select.ir-field__control,';

describe('il foglio si legge, e le due regole di densita\' ci sono', () => {
    it('positivo di controllo: il foglio e\' leggibile e i commenti sono stati tolti', () => {
        expect(SCSS.length).toBeGreaterThan(1000);
        expect(RULES.length).toBeGreaterThan(1000);
        expect(RULES).not.toContain('A control whose height is FIXED');
    });

    it('positivo di controllo: la regola di densita\' esiste ancora', () => {
        expect(RULES).toContain(DENSITY_RULE);
    });

    it('la regola sui controlli ad altezza fissa esiste', () => {
        expect(RULES).toContain(FIXED_RULE);
        expect(RULES).toContain('.ir-form[data-density] input.ir-field__control');
    });
});

describe('la densita\' continua a spaziare i controlli che crescono', () => {
    const body = block(RULES, DENSITY_RULE);

    it('il padding orizzontale resta quello del tema', () => {
        expect(body).toMatch(/padding-left:\s*var\(--ir-form-pad-x\)/);
        expect(body).toMatch(/padding-right:\s*var\(--ir-form-pad-x\)/);
    });

    it('il padding verticale del tema c\'e\' ancora: la textarea e la cella readonly lo prendono', () => {
        expect(body).toMatch(/padding-top:\s*var\(--ir-form-pad-y\)/);
        expect(body).toMatch(/padding-bottom:\s*var\(--ir-form-pad-y\)/);
        expect(RULES).toContain('.ir-form[data-density] .ir-field__control--mono,');
        expect(RULES).toContain('.ir-form[data-density] .ir-field__readonly {');
    });
});

describe('select e input ad altezza fissa non prendono il padding verticale', () => {
    const body = block(RULES, FIXED_RULE);

    it('azzera entrambi i lati verticali', () => {
        expect(body).toMatch(/padding-top:\s*0\s*;/);
        expect(body).toMatch(/padding-bottom:\s*0\s*;/);
    });

    it('non tocca i lati orizzontali: la larghezza resta quella di FL8', () => {
        expect(body).not.toMatch(/padding-left/);
        expect(body).not.toMatch(/padding-right/);
    });

    it('viene DOPO la regola di densita\', che ha la stessa specificita\' sui lati verticali', () => {
        // (0,3,1) contro (0,3,0): vince comunque, ma se un giorno perdesse il tipo di
        // elemento l'ordine sarebbe l'unica cosa a tenerla in piedi. L'ordine si asserisce.
        expect(RULES.indexOf(FIXED_RULE)).toBeGreaterThan(RULES.indexOf(DENSITY_RULE));
    });

    it('la scala di densita\' che produceva il taglio e\' ancora quella: il fix non l\'ha ritoccata', () => {
        // Se un domani questi numeri cambiassero, la ragione scritta nel foglio andrebbe
        // riletta con la sonda: sono i valori sui quali il taglio e' stato misurato.
        expect(DENSITY_SCALE.comfortable.fieldPaddingY).toBe(7);
        expect(DENSITY_SCALE.compact.fieldPaddingY).toBe(5);
        expect(DENSITY_SCALE.dense.fieldPaddingY).toBe(4);
    });
});
