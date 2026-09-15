/**
 * Le icone dei pulsanti del manager ereditano il colore del pulsante.
 *
 * Reperto utente (2026-08-31): «in tutti i pulsanti color slate scuro le icone bi
 * non sono in bianco». Misurato il 2026-09-01 sull'instance manager: l'icona di
 * «+ New <Cls>» calcolava `rgb(15, 23, 42)` dentro un pulsante che dichiara
 * `rgb(255, 255, 255)` sopra il gradiente slate del DS.
 *
 * CAUSA. `styles/style.scss` dichiara `i.bi { color: var(--font-color-1) }`
 * DIRETTAMENTE sull'elemento che dipinge, e una dichiarazione diretta batte
 * sempre l'ereditarietà — il pulsante può solo offrire il proprio `color`, e
 * l'icona non lo prende mai. `--font-color-1` vale `#0f172a` (dichiarato su
 * `body`, non su `:root`: letto sulla radice torna vuoto e fa credere la regola
 * inerte). È lo stesso reperto del 2026-08-12 sull'albero, in CLAUDE.md §5,
 * applicato ai pulsanti.
 *
 * Quello che questi test NON possono dire, e che la sonda dice: quale regola
 * VINCE. La specificità si calcola sul sorgente, ma chi dipinge si misura a
 * schermo — `scripts/smoke/_tmp_biwhite_verify.ts`, before 10/4, after 14/0,
 * con il pixel al centro del glifo che passa da `(18,27,46)` a `(231,233,235)`.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e
 * una lettura che non è avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SCSS = readFileSync(resolve(__dirname, '../instanceManagerTab.scss'), 'utf8');
/** Il foglio globale che dichiara la regola da scavalcare: senza leggerlo, la
 *  correzione qui sarebbe una precauzione contro un avversario mai verificato. */
const GLOBAL = readFileSync(resolve(__dirname, '../../../../styles/style.scss'), 'utf8');
const VARS = readFileSync(resolve(__dirname, '../../../../styles/variables.scss'), 'utf8');

const RULES = SCSS.replace(/\/\*[\s\S]*?\*\//g, '');

/** Il corpo di un blocco, dalla graffa che apre alla graffa che chiude, contando
 *  l'annidamento: i blocchi qui dentro ne hanno (`&:hover`, `i.bi`), e fermarsi
 *  alla prima `}` misurerebbe mezza regola. */
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

describe('l\'avversario esiste, ed è quello che si crede', () => {
    it('positivo di controllo: il foglio globale è leggibile e non è vuoto', () => {
        expect(GLOBAL.length).toBeGreaterThan(1000);
    });

    it('`i.bi` dichiara un colore DIRETTAMENTE sull\'icona', () => {
        expect(GLOBAL).toMatch(/i\.bi\s*\{[^}]*color:\s*var\(--font-color-1\)/);
    });

    it('e ne dichiara un SECONDO sull\'hover: per questo la correzione è una coppia', () => {
        const bi = block(GLOBAL, 'i.bi {');
        expect(bi).toContain('&:hover');
        expect(bi).toMatch(/color:\s*var\(--palette-1-hover\)/);
    });

    it('`--font-color-1` è dichiarato su `body`, non su `:root`', () => {
        // Il motivo per cui la prima misura lo aveva letto vuoto e aveva creduto
        // la regola inerte: `getComputedStyle(document.documentElement)` legge
        // l'elemento sbagliato.
        expect(VARS.indexOf('body{')).toBe(0);
        expect(VARS).toMatch(/--font-color-1:\s*var\(--palette-1\);/);
        expect(VARS).toMatch(/--palette-1:\s*var\(--color-accent-active/);
    });
});

describe('il primario pieno: l\'icona prende il bianco del pulsante', () => {
    it('positivo di controllo: il blocco del primario esiste ed è slate pieno', () => {
        const b = block(RULES, '&__new, &__add {');
        expect(b).toContain('background: linear-gradient(135deg, #334155, #1e293b);');
        expect(b).toContain('color: #ffffff;');
    });

    it('l\'icona eredita, e la coppia copre anche l\'hover', () => {
        const b = block(RULES, '&__new, &__add {');
        expect(b).toMatch(/i\.bi,\s*i\.bi:hover\s*\{\s*color:\s*inherit;\s*\}/);
    });

    it('eredita e non riscrive il bianco: il colore ha una sorgente sola', () => {
        const b = block(RULES, '&__new, &__add {');
        const icon = b.match(/i\.bi[^{]*\{([^}]*)\}/);
        expect(icon).not.toBeNull();
        expect(icon![1]).toContain('inherit');
        expect(icon![1]).not.toMatch(/#[0-9a-fA-F]{3,8}|\bwhite\b/);
    });
});

describe('il secondario chiaro: l\'icona prende il colore della sua etichetta', () => {
    it('positivo di controllo: Export è il secondario chiaro, non un pieno', () => {
        const b = block(RULES, '&__export {');
        expect(b).toContain('background: var(--color-form-surface);');
        expect(b).toContain('color: var(--color-form-label);');
        expect(b).not.toContain('linear-gradient');
    });

    it('anche qui l\'icona eredita, con la stessa coppia', () => {
        const b = block(RULES, '&__export {');
        expect(b).toMatch(/i\.bi,\s*i\.bi:hover\s*\{\s*color:\s*inherit;\s*\}/);
    });
});

describe('quello che la correzione NON tocca', () => {
    it('positivo di controllo: i glifi fuori dai pulsanti sono ancora dichiarati', () => {
        expect(RULES).toContain('&__outline-badge');
        expect(RULES).toContain('&__glyph');
    });

    it('il triangolo del riferimento rotto tiene il proprio colore', () => {
        // Una regola larga come `.instance-manager i.bi { color: inherit }` avrebbe
        // scavalcato ANCHE questa — (0,2,1) contro (0,2,0) — spegnendo il rosso.
        // È il motivo per cui la correzione nomina i due pulsanti invece del tab.
        expect(RULES).toMatch(
            /\.instance-manager__outline-icon \{ color: var\(--color-error\); \}/,
        );
    });

    it('nessuna regola `i.bi` larga a livello di tab entra nel foglio', () => {
        expect(RULES).not.toMatch(/^\s*\.instance-manager i\.bi/m);
        expect(RULES).not.toMatch(/&\s+i\.bi\s*\{/);
    });

    it('la correzione non usa `!important`', () => {
        const news = block(RULES, '&__new, &__add {');
        const exp = block(RULES, '&__export {');
        expect(news).not.toContain('!important');
        expect(exp).not.toContain('!important');
    });
});
