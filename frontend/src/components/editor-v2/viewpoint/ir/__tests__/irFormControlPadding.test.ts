/**
 * FL9 e FL10 — il padding di densita' non va dove il controllo ha gia' deciso lo spazio.
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
 * FL10 e' la stessa storia sul lato DESTRO, e sta qui perche' e' la stessa regola: quel
 * lato non e' spaziatura, e' la riserva del chevron, e la densita' la sovrascriveva. La
 * sonda `_tmp_fl10_verify.ts` misura la geometria (il content box superava il chevron di
 * 17-19px nei quattro preset) e i pixel (un'etichetta lunga portava l'inchiostro nella
 * banda del chevron da 40 a un centinaio); qui si asserisce solo la grammatica.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e una
 * lettura che non e' avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DENSITY_SCALE } from '../../../../../jjform/themes';

const SCSS = readFileSync(resolve(__dirname, '../irFormStyle.scss'), 'utf8');
/** Il modulo della select: la riserva del chevron e' un suo numero, non nostro (FL10). */
const SELECT_MODULE = readFileSync(
    resolve(__dirname, '../../../../ui/Select/Select.module.css'), 'utf8');

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
const CHEVRON_RULE = '.ir-form[data-density] select.ir-field__control {';

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

describe('il lato destro della select resta la riserva del chevron (FL10)', () => {
    it('positivo di controllo: il modulo della select si legge e dichiara una riserva', () => {
        expect(SELECT_MODULE.length).toBeGreaterThan(200);
        expect(SELECT_MODULE).toMatch(/padding-right:\s*36px/);
        expect(SELECT_MODULE).toMatch(/\.selectSm\s*\{[^}]*padding:\s*6px\s+36px/);
    });

    it('la regola che restituisce il lato destro esiste', () => {
        expect(RULES).toContain(CHEVRON_RULE);
    });

    it('il numero e\' quello del modulo, non un secondo numero', () => {
        // La duplicazione e' voluta (il modulo e' un CSS module, le sue classi sono hashate
        // e non raggiungibili dal foglio) ma NON silenziosa: se uno dei due cambia, questo
        // test cade invece di lasciare il chevron scoperto.
        const fromModule = SELECT_MODULE.match(/\.select\s*\{[\s\S]*?padding-right:\s*(\d+)px/);
        expect(fromModule, 'riserva assente in Select.module.css').not.toBeNull();
        const body = block(RULES, CHEVRON_RULE);
        expect(body).toContain(`padding-right: ${fromModule![1]}px`);
    });

    it('tocca SOLO il lato destro: la sinistra resta al tema, i verticali alla regola di FL9', () => {
        const body = block(RULES, CHEVRON_RULE);
        expect(body).not.toMatch(/padding-left/);
        expect(body).not.toMatch(/padding-top/);
        expect(body).not.toMatch(/padding-bottom/);
    });

    it('viene DOPO la regola di densita\', che e\' quella che gli sovrascriveva la riserva', () => {
        expect(RULES.indexOf(CHEVRON_RULE)).toBeGreaterThan(RULES.indexOf(DENSITY_RULE));
    });

    it('la riserva vale per la sola select: nessun input si prende i 36px', () => {
        // Gli `input.ir-field__control` condividono la regola verticale di FL9 ma non hanno
        // chevron: la larghezza del loro testo e' di FL8, e regalare loro 36px la cambierebbe.
        // La riserva compare percio' UNA volta sola in tutto il foglio, dentro questa regola.
        const occurrences = RULES.split('padding-right: 36px').length - 1;
        expect(occurrences).toBe(1);
        expect(block(RULES, CHEVRON_RULE)).toContain('padding-right: 36px');
    });
});
