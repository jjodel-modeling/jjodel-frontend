/**
 * 10f — il badge lettera dell'outline, nel vocabolario del rail.
 *
 * Slice di solo chrome come 10d e 10e: nessuna logica nuova, e le asserzioni sono
 * sul SORGENTE per la stessa necessità misurata (cfr. il docstring di
 * `instanceManager10c.test.ts`): `InstanceManagerTab.tsx` importa il barrel di
 * `editor-v2/`, che arriva a monaco, che dereferenzia `window` all'import, e il
 * file muore prima del primo `it`.
 *
 * `entityMeta` invece si importa davvero — è un modulo puro senza dipendenze — e
 * questo permette l'unica asserzione ESEGUITA del file: che la lettera del
 * modello sia `m` minuscola. È il genere di cosa che una stringa nel sorgente non
 * può dire, perché `entityLetter('model')` nel TSX è vero comunque, anche il
 * giorno in cui il registro restituisce un'altra lettera.
 *
 * Il criterio è quello del prompt: asserzioni su CLASSI e TOKEN, mai su pixel.
 *
 * Quello che questi test NON possono dire, e che la sonda dice: quale regola
 * vince. Il badge è uno `<span>` proprio per stare fuori dalla cascata di
 * `i.bi`, ma «sta fuori» è un'affermazione sulla cascata e la cascata si misura a
 * schermo. La coppia before/after di `scripts/smoke/_tmp_10f_verify.ts` è lì per
 * quello.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e
 * una lettura che non è avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { entityLetter } from '../../../../common/entityMeta';

const TSX = readFileSync(resolve(__dirname, '../InstanceManagerTab.tsx'), 'utf8');
const SCSS = readFileSync(resolve(__dirname, '../instanceManagerTab.scss'), 'utf8');
/** Il foglio del DS in cui vivono le coppie di entità: il badge NON le
 *  ridichiara, quindi la prova che dipinge sta in un altro file. */
const FORM_SYSTEM = readFileSync(
    resolve(__dirname, '../../../../styles/components/_form-system.scss'), 'utf8');

/** Il foglio senza i commenti, e il sorgente senza i commenti: un «X non c'è più»
 *  che legge anche la prosa che spiega perché X è stato tolto non distingue la
 *  rimozione documentata dalla presenza. */
const RULES = SCSS.replace(/\/\*[\s\S]*?\*\//g, '');
const CODE = TSX.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Il corpo di una regola, dalla graffa aperta alla prima chiusa. Sufficiente per
 *  i blocchi piatti; non regge i nidificati. */
function block(source: string, selector: string): string {
    const at = source.indexOf(selector);
    expect(at, `selettore assente: ${selector}`).toBeGreaterThan(-1);
    const open = source.indexOf('{', at);
    return source.slice(open, source.indexOf('}', open) + 1);
}

describe('10f — il badge prende il posto del glifo', () => {
    it('positivo di controllo: il pannello e le due funzioni del badge esistono', () => {
        expect(CODE).toContain('function OutlinePanel({');
        expect(CODE).toContain('const badgePair = (node: OutlineNode): string =>');
        expect(CODE).toContain('const badgeLetter = (node: OutlineNode): string => {');
    });

    it('la riga monta uno span col badge, non più un `<i>` generico', () => {
        expect(CODE).toContain(
            "className={'instance-manager__outline-badge ' + badgePair(node)}");
        expect(CODE).toContain('>{badgeLetter(node)}</span>');
        // la funzione `icon` di 10b/10e non esiste più: era la tabella dei glifi
        expect(CODE).not.toContain('const icon = (node: OutlineNode)');
    });

    it('il puntatore morto NON prende un badge: tiene il triangolo di 12d', () => {
        expect(CODE).toContain("node.kind === 'broken' ? (");
        expect(CODE).toContain('bi bi-exclamation-triangle instance-manager__outline-icon');
        const broken = block(RULES, '&__outline-node--broken {');
        expect(broken).toContain('color: var(--color-error)');
    });
});

describe('10f — la lettera viene dalla metaclasse, non dal tipo', () => {
    it('positivo di controllo: il corpo di `badgeLetter` è leggibile', () => {
        const fn = CODE.slice(CODE.indexOf('const badgeLetter = (node: OutlineNode)'));
        expect(fn.length).toBeGreaterThan(80);
    });

    it('un oggetto porta l\'INIZIALE MAIUSCOLA della sua metaclasse', () => {
        const fn = CODE.slice(CODE.indexOf('const badgeLetter = (node: OutlineNode)'));
        const body = fn.slice(0, fn.indexOf('\n    };'));
        expect(body).toContain("(node.cls ?? '').trim().charAt(0)");
        expect(body).toContain('initial.toUpperCase()');
    });

    it('e NON la `C` del rail: la regola del rail resta quella del rail', () => {
        const fn = CODE.slice(CODE.indexOf('const badgeLetter = (node: OutlineNode)'));
        const body = fn.slice(0, fn.indexOf('\n    };'));
        // `CLASS_LETTER` è la costante del rail (10c) e non entra nell'outline:
        // là la lettera dice il tipo, qui dice l'individuo.
        expect(body).not.toContain('CLASS_LETTER');
        // il rail però la usa ancora — non è stata rimossa sotto i suoi piedi
        expect(CODE).toContain('>{CLASS_LETTER}</span>');
    });

    it('il fallback è la lettera del tipo, mai un quadrato vuoto', () => {
        const fn = CODE.slice(CODE.indexOf('const badgeLetter = (node: OutlineNode)'));
        const body = fn.slice(0, fn.indexOf('\n    };'));
        expect(body).toContain("entityLetter('class')");
    });

    it('il modello porta `m`, e la `m` viene dal registro', () => {
        const fn = CODE.slice(CODE.indexOf('const badgeLetter = (node: OutlineNode)'));
        const body = fn.slice(0, fn.indexOf('\n    };'));
        expect(body).toContain("if (node.kind === 'model') return entityLetter('model')");
        // l'unica asserzione ESEGUITA: che il registro dia davvero `m` minuscola.
        expect(entityLetter('model')).toBe('m');
    });
});

describe('10f — la coppia di colore è quella dei token di entità', () => {
    it('positivo di controllo: `badgePair` sceglie fra due classi del DS', () => {
        const fn = CODE.slice(CODE.indexOf('const badgePair = (node: OutlineNode)'));
        const body = fn.slice(0, fn.indexOf(';\n'));
        expect(body).toContain("'jj-type-badge--model'");
        expect(body).toContain("'jj-type-badge--class'");
    });

    it('un solo colore di famiglia per le istanze: la lettera distingue, non la coppia', () => {
        const fn = CODE.slice(CODE.indexOf('const badgePair = (node: OutlineNode)'));
        const body = fn.slice(0, fn.indexOf(';\n'));
        // nessun terzo ramo: `object` e qualsiasi altro genere cadono su `class`
        expect(body).not.toContain('jj-type-badge--enum');
        expect(body).not.toContain('jj-type-badge--package');
    });

    it('e le due classi dipingono davvero, dai token di entità', () => {
        expect(FORM_SYSTEM).toContain(
            '.jj-type-badge--class { background: var(--color-entity-class-bg); color: var(--color-entity-class-fg); }');
        expect(FORM_SYSTEM).toContain(
            '.jj-type-badge--model { background: var(--color-entity-model-bg); color: var(--color-entity-model-fg); }');
    });

    it('nessuna seconda palette: il foglio non dichiara colore per il badge', () => {
        const badge = block(RULES, '&__outline-badge {');
        expect(badge).not.toContain('background');
        expect(badge).not.toContain('color:');
        // nessun esadecimale nuovo, che è il criterio del prompt
        expect(badge).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    });
});

describe('10f — la geometria, e solo la geometria', () => {
    it('positivo di controllo: la regola del badge esiste', () => {
        expect(RULES).toContain('&__outline-badge {');
    });

    it('16×16, raggio dal token, lettera 10/700', () => {
        const badge = block(RULES, '&__outline-badge {');
        expect(badge).toContain('width: 16px');
        expect(badge).toContain('height: 16px');
        expect(badge).toContain('border-radius: var(--radius-sm)');
        expect(badge).toContain('font-size: 10px');
        expect(badge).toContain('font-weight: 700');
    });

    it('il badge del rail resta 18×18: non è stato ridefinito sotto', () => {
        const glyph = block(RULES, '&__glyph {');
        expect(glyph).toContain('width: 18px');
        expect(glyph).toContain('height: 18px');
    });
});

describe('10f — non-regressioni: la riga di 10e è invariata', () => {
    it('positivo di controllo: la regola del nodo esiste', () => {
        expect(RULES).toContain('&__outline-node {');
    });

    it('densità e hover restano quelli di 10e', () => {
        const node = block(RULES, '&__outline-node {');
        expect(node).toContain('min-height: 28px');
        expect(node).toContain('font-size: 12px');
        expect(RULES).toContain('&:hover { background: var(--color-bg-hover); }');
    });

    it('la coppia di selezione è intatta', () => {
        expect(RULES).toContain('background: var(--color-selection-bg)');
        expect(RULES).toContain('box-shadow: inset 2px 0 0 var(--color-selection-bar)');
    });

    it('l\'indent resta 14 + 16 per livello', () => {
        expect(CODE).toContain('paddingLeft: 14 + node.depth * 16');
    });

    it('la classe in mono a destra resta, ed è la disambiguazione delle iniziali', () => {
        expect(CODE).toContain('<span className="instance-manager__code">{node.cls}</span>');
    });

    it('il «+» resta un button raggiungibile da tastiera', () => {
        expect(CODE).toContain('className="instance-manager__outline-add"');
        const add = block(RULES, '&__outline-add {');
        expect(add).toContain('opacity: 0');
        expect(RULES).toContain('&__outline-add');
    });

    it('il peso del nodo modello resta solo suo', () => {
        expect(RULES).toContain(
            '&__outline-node--model .instance-manager__outline-name { font-weight: 600; }');
    });
});
