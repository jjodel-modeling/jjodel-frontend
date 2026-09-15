/**
 * DS-1 — la coppia `model` esce dagli alias del contenitore e torna ambra.
 *
 * Le asserzioni sono sui due FOGLI dei token, letti da disco: sono file SCSS, non
 * moduli, e nessun import li puo' portare qui. Il criterio e' quello della scala
 * (R-RAIL-30): un test che guardi solo l'esadecimale difende il valore ma non la
 * regola che lo ha prodotto, quindi qui si misurano L, C e H in OKLCH e la dE fra
 * i fondi, e l'esadecimale e' solo l'ultima delle asserzioni.
 *
 * Il pavimento non e' una costante scelta: e' la dE minima gia' tollerata fra i
 * fondi di due famiglie diverse, ricalcolata a ogni giro sulle coppie committate.
 * Se un giorno la scala cambia, il pavimento cambia con lei e questo file continua
 * a dire il vero.
 *
 * Ogni blocco apre con un controllo POSITIVO: una regex che non trova niente e una
 * lettura che non e' avvenuta danno lo stesso silenzio (CLAUDE.md §5).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TOKENS = resolve(__dirname, '../tokens');
const LIGHT = readFileSync(resolve(TOKENS, '_colors-light.scss'), 'utf8');
const DARK = readFileSync(resolve(TOKENS, '_colors-dark.scss'), 'utf8');
const FORM_SYSTEM = readFileSync(
    resolve(__dirname, '../components/_form-system.scss'), 'utf8');
const DOCUMENT_TYPES = readFileSync(
    resolve(__dirname, '../../constants/documentTypes.ts'), 'utf8');

/** Il foglio senza i commenti: i commenti di questa slice CITANO i valori e le
 *  vecchie righe di alias, e un test che legga anche la prosa non distingue la
 *  dichiarazione dalla spiegazione. */
const strip = (s: string): string => s.replace(/\/\*[\s\S]*?\*\//g, '');
const LIGHT_RULES = strip(LIGHT);
const DARK_RULES = strip(DARK);

/** Il valore dichiarato per un token, dal foglio gia' ripulito dai commenti. */
function decl(sheet: string, name: string): string {
    const m = sheet.match(new RegExp(`^\\s*--${name}:\\s*([^;]+);`, 'm'));
    expect(m, `token assente: --${name}`).not.toBeNull();
    return (m as RegExpMatchArray)[1].trim();
}

// ---- OKLCH, senza dipendenze nuove (Regola 4) -------------------------------

const srgbToLinear = (c: number): number =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

function channels(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    expect(h, `non e' un esadecimale a 6 cifre: ${hex}`).toMatch(/^[0-9a-fA-F]{6}$/);
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function oklab(hex: string): [number, number, number] {
    const [r, g, b] = channels(hex).map(srgbToLinear);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    ];
}

function oklch(hex: string): { L: number; C: number; H: number } {
    const [L, a, b] = oklab(hex);
    let H = (Math.atan2(b, a) * 180) / Math.PI;
    if (H < 0) H += 360;
    return { L, C: Math.hypot(a, b), H };
}

/** Distanza euclidea in OKLab: la stessa metrica con cui il pavimento e' misurato. */
function deltaE(a: string, b: string): number {
    const [l1, a1, b1] = oklab(a);
    const [l2, a2, b2] = oklab(b);
    return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

function relativeLuminance(hex: string): number {
    const [r, g, b] = channels(hex).map(srgbToLinear);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: string, bg: string): number {
    const a = relativeLuminance(fg);
    const b = relativeLuminance(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// ---- le coppie canoniche, lette dal foglio -----------------------------------

/** Le otto famiglie con cui `model` deve convivere. `model` non e' qui: e' il
 *  soggetto, e confrontarlo con se stesso darebbe un pavimento di zero. */
const FAMILIES = ['container', 'class', 'object', 'enum', 'literal',
    'attribute', 'parameter', 'reference', 'operation'] as const;

/** I sei contenitori che restano alias. `model` non e' piu' dei loro. */
const CONTAINERS = ['metamodel', 'package', 'viewpoint', 'transformation',
    'refactoring', 'view'] as const;

function palette(sheet: string): Record<string, { bg: string; fg: string }> {
    const out: Record<string, { bg: string; fg: string }> = {};
    for (const f of FAMILIES) {
        out[f] = { bg: decl(sheet, `color-entity-${f}-bg`), fg: decl(sheet, `color-entity-${f}-fg`) };
    }
    return out;
}

/** La dE minima fra i fondi di due famiglie DIVERSE gia' committate: il numero
 *  sotto il quale la coppia nuova sarebbe meno distinguibile di ogni coppia che
 *  la scala gia' accetta. */
function floorOf(pal: Record<string, { bg: string; fg: string }>): number {
    const keys = Object.keys(pal);
    let floor = Infinity;
    for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
            floor = Math.min(floor, deltaE(pal[keys[i]].bg, pal[keys[j]].bg));
        }
    }
    return floor;
}

const THEMES = [
    { name: 'chiaro', sheet: LIGHT, rules: LIGHT_RULES, bg: '#F3E8D3', fg: '#6B5110',
      bgL: 0.934, bgC: 0.030, fgL: 0.451, fgC: 0.085, contrast: 6.16 },
    { name: 'scuro', sheet: DARK, rules: DARK_RULES, bg: '#3B2B06', fg: '#E4C992',
      bgL: 0.300, bgC: 0.056, fgL: 0.846, fgC: 0.078, contrast: 8.52 },
] as const;

describe('DS-1 — controllo positivo: i due fogli sono quelli giusti', () => {
    it('entrambi dichiarano le nove coppie canoniche', () => {
        for (const { name, rules } of THEMES) {
            const pal = palette(rules);
            for (const f of FAMILIES) {
                expect(pal[f].bg, `${name}/${f}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
                expect(pal[f].fg, `${name}/${f}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
            }
        }
    });

    it('il pavimento e\' misurato, non assunto, e vale class/object in entrambi i temi', () => {
        expect(floorOf(palette(LIGHT_RULES))).toBeCloseTo(0.0143, 4);
        expect(floorOf(palette(DARK_RULES))).toBeCloseTo(0.0243, 4);
    });
});

describe('DS-1 — model esce dagli alias, i sei contenitori restano', () => {
    for (const { name, rules } of THEMES) {
        it(`${name}: --color-entity-model-* non e' piu' un alias del contenitore`, () => {
            expect(decl(rules, 'color-entity-model-bg')).not.toContain('var(');
            expect(decl(rules, 'color-entity-model-fg')).not.toContain('var(');
            expect(rules).not.toContain('--color-entity-model-bg: var(--color-entity-container-bg)');
            expect(rules).not.toContain('--color-entity-model-fg: var(--color-entity-container-fg)');
        });

        it(`${name}: i sei contenitori restanti aliasano ancora`, () => {
            for (const c of CONTAINERS) {
                expect(decl(rules, `color-entity-${c}-bg`), c).toBe('var(--color-entity-container-bg)');
                expect(decl(rules, `color-entity-${c}-fg`), c).toBe('var(--color-entity-container-fg)');
            }
        });
    }
});

describe('DS-1 — la coppia nuova rispetta la costruzione della scala', () => {
    for (const t of THEMES) {
        /** Letta dal FOGLIO, non dalla costante di questo file: le asserzioni
         *  geometriche devono difendere il token, e un test che misuri il proprio
         *  letterale resta verde qualunque cosa dica il foglio. La costante serve
         *  solo all'asserzione sul valore ratificato, qui sopra. */
        const bgHex = (): string => decl(t.rules, 'color-entity-model-bg');
        const fgHex = (): string => decl(t.rules, 'color-entity-model-fg');

        it(`${t.name}: i due esadecimali sono quelli ratificati`, () => {
            expect(bgHex()).toBe(t.bg);
            expect(fgHex()).toBe(t.fg);
        });

        it(`${t.name}: L e C stanno nella tolleranza della scala (grado saturo)`, () => {
            const bg = oklch(bgHex());
            const fg = oklch(fgHex());
            expect(Math.abs(bg.L - t.bgL), `bg L ${bg.L}`).toBeLessThanOrEqual(0.003);
            expect(Math.abs(fg.L - t.fgL), `fg L ${fg.L}`).toBeLessThanOrEqual(0.003);
            expect(Math.abs(bg.C - t.bgC), `bg C ${bg.C}`).toBeLessThanOrEqual(0.003);
            expect(Math.abs(fg.C - t.fgC), `fg C ${fg.C}`).toBeLessThanOrEqual(0.003);
        });

        it(`${t.name}: la tinta e' ambra a H 85, non il giallo di enum a 56`, () => {
            const pal = palette(t.rules);
            expect(oklch(bgHex()).H).toBeGreaterThan(80);
            expect(oklch(bgHex()).H).toBeLessThan(90);
            expect(oklch(fgHex()).H).toBeGreaterThan(80);
            expect(oklch(fgHex()).H).toBeLessThan(90);
            expect(oklch(pal.enum.bg).H).toBeLessThan(60);
        });

        it(`${t.name}: la dE contro OGNI altra famiglia sta sopra il pavimento`, () => {
            const pal = palette(t.rules);
            const floor = floorOf(pal);
            for (const f of FAMILIES) {
                expect(deltaE(bgHex(), pal[f].bg), `${f} (pavimento ${floor.toFixed(4)})`)
                    .toBeGreaterThan(floor);
            }
        });

        it(`${t.name}: i vicini stretti, enum e literal, restano distinti`, () => {
            const pal = palette(t.rules);
            expect(deltaE(bgHex(), pal.enum.bg)).toBeGreaterThan(floorOf(pal));
            expect(deltaE(bgHex(), pal.literal.bg)).toBeGreaterThan(floorOf(pal));
            expect(deltaE(fgHex(), pal.enum.fg)).toBeGreaterThan(floorOf(pal));
            expect(deltaE(fgHex(), pal.literal.fg)).toBeGreaterThan(floorOf(pal));
        });

        it(`${t.name}: il contrasto e' almeno quello dichiarato, e sopra 4.5:1`, () => {
            const measured = contrast(fgHex(), bgHex());
            expect(measured).toBeGreaterThanOrEqual(4.5);
            expect(measured).toBeGreaterThanOrEqual(t.contrast - 0.01);
        });
    }
});

describe('DS-1 — i lettori del token restano lettori del token', () => {
    it('.jj-type-badge--model dipinge dalla coppia, non da un letterale', () => {
        expect(FORM_SYSTEM).toContain(
            '.jj-type-badge--model { background: var(--color-entity-model-bg); color: var(--color-entity-model-fg); }');
    });

    it('la voce «Model» del menu New document dipinge dalla coppia', () => {
        expect(DOCUMENT_TYPES).toContain("badgeBg: 'var(--color-entity-model-bg)'");
        expect(DOCUMENT_TYPES).toContain("badgeColor: 'var(--color-entity-model-fg)'");
    });

    it('i quattro esadecimali nuovi non escono da tokens/', () => {
        for (const t of THEMES) {
            for (const hex of [t.bg, t.fg]) {
                expect(FORM_SYSTEM, hex).not.toContain(hex);
                expect(DOCUMENT_TYPES, hex).not.toContain(hex);
            }
        }
    });
});
