/**
 * 10h — i confini verticali del manager, giro 1 dei ritocchi visuali.
 *
 * Slice di solo chrome, come 10d/10e/10f: nessuna logica, e le asserzioni sono
 * sul SORGENTE del foglio per la stessa necessità misurata in 10c
 * (`InstanceManagerTab.tsx` importa il barrel di `editor-v2/`, che arriva a
 * monaco, che dereferenzia `window` all'import: il file muore prima del primo
 * `it`). Qui la cosa è meno grave del solito, perché il delta della slice È il
 * foglio: un selettore esteso e una dichiarazione sola.
 *
 * Quello che questi test NON possono dire, e che la sonda dice: che i tre
 * confini DIPINGANO lo stesso rgb. Un token identico nel sorgente e un colore
 * identico a schermo sono due affermazioni diverse — la seconda è sulla cascata,
 * e la cascata si misura a schermo. La coppia before/after di
 * `scripts/smoke/_tmp_10h_verify.ts` è lì per quello: 21/5 prima, 26/0 dopo, con
 * il rail dell'app come confine di riferimento verde in entrambi i giri.
 *
 * Il criterio è quello del prompt: asserzioni su TOKEN, mai su pixel.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e
 * una lettura che non è avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SCSS = readFileSync(resolve(__dirname, '../instanceManagerTab.scss'), 'utf8');
/** Il foglio del rail sinistro dell'app: è lì che vive il confine di
 *  RIFERIMENTO, quello che il prompt chiede di misurare e riusare. */
const DASHBOARD = readFileSync(resolve(__dirname, '../../../../pages/dashboard.scss'), 'utf8');

/** Il foglio senza i commenti: un «X non c'è» che legge anche la prosa che
 *  nomina X non distingue la menzione dalla dichiarazione. Questa slice ne ha
 *  bisogno più delle altre — il suo commento cita per esteso sia il token usato
 *  sia quello ipotizzato dal prompt e mai esistito. */
const RULES = SCSS.replace(/\/\*[\s\S]*?\*\//g, '');
const DASH_RULES = DASHBOARD.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('10h — il separatore raggiunge la colonna centrale', () => {
    it('positivo di controllo: il blocco del pannello e il suo separatore esistono', () => {
        expect(RULES).toContain('&__pane {');
        expect(RULES).toMatch(/\+\s*\.instance-manager__pane\b/);
        expect(RULES).toContain('&__main {');
    });

    it('il separatore copre ANCHE `__main`, e in UNA sola dichiarazione', () => {
        // Una dichiarazione sola è il punto: due regole gemelle sarebbero due
        // token il giorno in cui qualcuno ne cambia una.
        expect(RULES).toMatch(
            /\+\s*\.instance-manager__pane,\s*\+\s*\.instance-manager__main\s*\{\s*border-left:\s*1px solid var\(--color-form-border\);\s*\}/,
        );
    });

    it('la dichiarazione è 1px solid, e il colore è un token, non un letterale', () => {
        const m = RULES.match(/\+\s*\.instance-manager__main\s*\{([^}]*)\}/);
        expect(m, 'la regola verso __main non esiste').not.toBeNull();
        expect(m![1]).toContain('1px solid');
        expect(m![1]).toContain('var(--color-form-border)');
        expect(m![1]).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    });

    it('il token è quello dei confini già esistenti: nessun secondo token di bordo', () => {
        // `--color-form-border-strong` è il bordo degli input, non un separatore:
        // se comparisse su un `border-left` di colonna, i tre confini divergerebbero.
        const seams = [...RULES.matchAll(/border-left:\s*1px solid var\((--[a-z-]+)\)/g)]
            .map(x => x[1]);
        expect(seams.length).toBeGreaterThan(0);
        expect([...new Set(seams)]).toEqual(['--color-form-border']);
    });
});

describe('10h — il confine sta su chi segue, non è una regola locale sul rail', () => {
    it('positivo di controllo: il rail delle metaclassi è dichiarato, e come `__pane`', () => {
        expect(RULES).toContain('&__pane--classes');
        expect(RULES).toMatch(/&__pane--classes\s*\{[^}]*flex:\s*0 0 200px/);
    });

    it('`__pane--classes` non dichiara un `border-right` proprio', () => {
        const block = RULES.match(/&__pane--classes\s*\{([^}]*)\}/);
        expect(block).not.toBeNull();
        expect(block![1]).not.toContain('border-right');
    });

    it('nessun `border-right` di colonna compare nel foglio', () => {
        expect(RULES).not.toMatch(/border-right:\s*1px/);
    });
});

describe('10h — quello che la slice NON tocca', () => {
    it('positivo di controllo: le regole confinanti sono ancora nel foglio', () => {
        expect(RULES).toContain('&__pane--outline { flex: 0 0 300px; padding: 14px 0; }');
        expect(RULES).toContain('&__pane--classes { flex: 0 0 200px; }');
    });

    it('il reset dei pannelli IMPILATI dentro `__main` resta', () => {
        // Senza, la form sotto la tabella prenderebbe un bordo verticale che nella
        // colonna impilata non ha senso: è il motivo per cui la regola esiste.
        expect(RULES).toMatch(
            /&__main > \.instance-manager__pane \+ \.instance-manager__pane \{ border-left: 0; \}/,
        );
    });

    it('il fondo desk della colonna centrale resta `--color-form-panel`', () => {
        const main = RULES.match(/&__main \{([^}]*)\}/);
        expect(main).not.toBeNull();
        expect(main![1]).toContain('background: var(--color-form-panel);');
    });

    it('le due card tengono bordo, raggio e ombra di 10d/10e', () => {
        const cards = RULES.match(/&__pane--table,\s*&__pane--form \{([\s\S]*?)\n {8}width: 100%;/);
        expect(cards).not.toBeNull();
        expect(cards![1]).toContain('border: 1px solid var(--color-form-border);');
        expect(cards![1]).toContain('border-radius: var(--radius-card);');
        expect(cards![1]).toContain('box-shadow: var(--shadow-desk-card);');
    });
});

describe('10h — il sistema dei token resta quello', () => {
    it('positivo di controllo: il foglio usa i token, e ne usa parecchi', () => {
        expect([...RULES.matchAll(/var\(--[a-z-]+/g)].length).toBeGreaterThan(50);
    });

    it('il foglio non DICHIARA variabili CSS (regola 28)', () => {
        expect(RULES).not.toMatch(/^\s*--[a-z-]+\s*:/m);
    });

    it('`--color-border-subtle` non entra: il nome del prompt non esiste nel sistema', () => {
        // Misurato a schermo il 2026-09-01: `getPropertyValue` sulla radice
        // restituisce la stringa vuota. Un `var()` su quel nome dipingerebbe il
        // valore iniziale, cioè nessun bordo — il difetto da cui parte la slice.
        expect(RULES).not.toContain('--color-border-subtle');
    });

    it('nessun token legacy fra quelli proibiti entra nel foglio', () => {
        expect(RULES).not.toMatch(/var\(--accent\)/);
        expect(RULES).not.toMatch(/var\(--bg-[1-5]\)/);
        expect(RULES).not.toMatch(/var\(--radius\)/);
    });
});

describe('10h — il confine di riferimento, quello del rail dell\'app', () => {
    it('positivo di controllo: il rail di progetto è dichiarato in dashboard.scss', () => {
        expect(DASH_RULES).toContain('&.leftbar--project {');
    });

    it('il rail dell\'app porta una hairline di 1px a destra', () => {
        const block = DASH_RULES.match(/&\.leftbar--project \{([\s\S]*?)\n {4}\.psb-back/);
        expect(block, 'il blocco del rail di progetto non è leggibile').not.toBeNull();
        expect(block![1]).toMatch(/border-right:\s*1px solid #e2e8f0;/);
    });

    it('e #e2e8f0 è lo stesso valore che `--color-form-border` risolve', () => {
        // La divergenza è NOMINALE, non di colore: il blocco `.leftbar--project`
        // è scritto tutto in esadecimale letterale, fondo compreso, e non ha
        // alcuna gestione del tema scuro. Sostituire il solo bordo con il token
        // lo renderebbe quasi trasparente in scuro sopra un fondo rimasto chiaro
        // — misurato nel blocco 5 della sonda. Fuori perimetro, ticket a parte.
        const light = readFileSync(
            resolve(__dirname, '../../../../styles/tokens/_colors-light.scss'), 'utf8');
        expect(light).toMatch(/\$slate-200:\s*#e2e8f0;/);
        expect(light).toMatch(/--color-form-border:\s*#\{\$slate-200\};/);
    });
});
