/**
 * Test of `jjform/palettes` — il registro chiuso delle quattro palette (R-SKIN).
 *
 * Puro su dati semplici, come il resto di questa cartella: il modulo non importa niente,
 * quindi non c'e' nessuno store finto da costruire.
 *
 * Quello che vale la pena tenere qui non e' che quattro oggetti abbiano i campi giusti —
 * e' cio' per cui quegli oggetti esistono. Primo, che il registro sia CHIUSO: quattro nomi,
 * e una stringa qualunque letta da un progetto salvato non deve passare la guardia. Secondo,
 * che il valore dell'attributo sia un CONTRATTO con il foglio di stile, e che una chiamata
 * con `undefined` non lasci l'elemento senza attributo. Terzo, che questo modulo NON porti
 * colori: e' la regola 28 resa verificabile, e senza questo caso la prima riga di hex che
 * ci finisce dentro non incontra nessun ostacolo.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    FORM_PALETTE_DEFAULT_NAME,
    FORM_PALETTE_NAMES,
    FORM_PALETTE_PRESETS,
    isFormPaletteName,
    paletteAttr,
    type FormPaletteName,
} from '../palettes';

describe('il registro e\' chiuso, e i quattro nomi sono quelli ratificati', () => {
    it('controllo positivo: i quattro nomi di R-SKIN-2, in ordine di catalogo', () => {
        expect(FORM_PALETTE_NAMES).toEqual(['Slate', 'Paper', 'Ink', 'Mist']);
    });

    it('ogni nome ha un preset, e ogni preset ha un nome: nessuna riga orfana', () => {
        expect(Object.keys(FORM_PALETTE_PRESETS).sort()).toEqual([...FORM_PALETTE_NAMES].sort());
        for (const name of FORM_PALETTE_NAMES) {
            const p = FORM_PALETTE_PRESETS[name];
            expect(p.attr).toBeTruthy();
            expect(p.label).toBeTruthy();
            expect(p.description).toBeTruthy();
        }
    });

    it('gli attributi sono minuscoli e distinti: due palette non possono collidere nel CSS', () => {
        const attrs = FORM_PALETTE_NAMES.map(n => FORM_PALETTE_PRESETS[n].attr);
        expect(attrs).toEqual(attrs.map(a => a.toLowerCase()));
        expect(new Set(attrs).size).toBe(attrs.length);
    });

    it('il default e\' `Slate`, ed e\' uno dei quattro (R-SKIN-2)', () => {
        expect(FORM_PALETTE_DEFAULT_NAME).toBe('Slate');
        expect(FORM_PALETTE_NAMES).toContain(FORM_PALETTE_DEFAULT_NAME);
    });

    it('un tipo con un quinto nome non compila', () => {
        const ok: FormPaletteName = 'Paper';
        expect(ok).toBe('Paper');
        // @ts-expect-error — il registro e' chiuso: un quinto nome non e' una FormPaletteName.
        const nope: FormPaletteName = 'Velvet';
        expect(nope).toBe('Velvet');
    });
});

describe('isFormPaletteName — la guardia sul valore persistito', () => {
    it('controllo positivo: i quattro nomi passano', () => {
        for (const name of FORM_PALETTE_NAMES) expect(isFormPaletteName(name)).toBe(true);
    });

    it('tutto il resto no, e senza lanciare', () => {
        // Il campo si legge da un progetto salvato: puo' portare qualunque cosa, scritta da
        // una versione futura, a mano o da un'AI. Deve cadere sul default, non raggiungere un
        // foglio di stile che per quel nome non ha regole.
        for (const junk of ['Velvet', 'slate', 'SLATE', '', ' Paper', undefined, null, 0, 1, {}, [], true]) {
            expect(isFormPaletteName(junk)).toBe(false);
        }
    });
});

describe('paletteAttr — il contratto con il foglio di stile', () => {
    it('controllo positivo: ogni nome da\' il proprio attributo', () => {
        expect(paletteAttr('Slate')).toBe('slate');
        expect(paletteAttr('Paper')).toBe('paper');
        expect(paletteAttr('Ink')).toBe('ink');
        expect(paletteAttr('Mist')).toBe('mist');
    });

    it('assente o non valido da\' l\'attributo del DEFAULT, mai stringa vuota', () => {
        // L'elemento porta SEMPRE un attributo: cosi' il foglio di stile non deve mai
        // scrivere una regola che seleziona sull'assenza.
        for (const bad of [undefined, null, 'Velvet' as any, '' as any]) {
            expect(paletteAttr(bad)).toBe(FORM_PALETTE_PRESETS[FORM_PALETTE_DEFAULT_NAME].attr);
        }
    });
});

describe('regola 28 — i colori non stanno qui', () => {
    it('controllo positivo: il file e\' stato letto e porta i quattro nomi', () => {
        const SRC = readFileSync(resolve(__dirname, '../palettes.ts'), 'utf8');
        expect(SRC.length).toBeGreaterThan(2000);
        for (const name of FORM_PALETTE_NAMES) expect(SRC).toContain(`${name}: {`);
    });

    it('nessun valore di colore nel registro: stanno in styles/tokens/, e in un posto solo', () => {
        const SRC = readFileSync(resolve(__dirname, '../palettes.ts'), 'utf8');
        // La prosa cita nomi di colore («ivory», «slate»), non valori. Un hex, un `rgb(` o un
        // `hsl(` qui sarebbe la seconda sorgente di verita' per gli stessi nove token, da
        // tenere in riga a mano per sempre.
        const code = SRC.split('\n')
            .filter(l => !l.trimStart().startsWith('*') && !l.trimStart().startsWith('/*') && !l.trimStart().startsWith('//'))
            .join('\n');
        expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
        expect(code).not.toMatch(/\brgba?\(/);
        expect(code).not.toMatch(/\bhsla?\(/);
    });

    it('e nessun import: e\' l\'invariante di questa cartella', () => {
        const SRC = readFileSync(resolve(__dirname, '../palettes.ts'), 'utf8');
        expect(SRC).not.toMatch(/^\s*import\s/m);
    });
});
