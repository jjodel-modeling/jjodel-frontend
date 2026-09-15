/**
 * instanceNodeStyle — la cascata e l'override di selezione.
 *
 * La cascata non ha ancora sorgenti (slice 1 rende dal default), quindi qui si
 * prova il MECCANISMO: che l'ordine dei livelli sia quello dichiarato, e che un
 * livello che nomina un campo senza avere un'opinione non cancelli quello sotto.
 */

import { describe, it, expect } from 'vitest';
import {
    CATEGORICAL_ACCENT,
    INSTANCE_NODE_PRESETS,
    INSTANCE_NODE_STYLE_DEFAULT,
    NEUTRAL_ACCENT,
    emptySlotsLabel,
    instanceNodeChrome,
    isCategoricalAccent,
    resolveInstanceNodeStyle,
} from '../instanceNodeStyle';

describe('resolveInstanceNodeStyle', () => {
    it('senza livelli restituisce il default di fabbrica, che e\' neutro', () => {
        const s = resolveInstanceNodeStyle();
        expect(s).toEqual(INSTANCE_NODE_STYLE_DEFAULT);
        expect(s.accentPlacement).toBe('none');
        expect(s.accent).toBe(NEUTRAL_ACCENT);
        expect(s.typeDisplay).toBe('inline');
        expect(s.emptyBehavior).toBe('dash');
        expect(s.edgeMarker).toBe(true);
    });

    it('applica i livelli in ordine: l\'istanza vince sul viewpoint, che vince sulla classe', () => {
        const s = resolveInstanceNodeStyle(
            { typeDisplay: 'chip', headerFill: true },   // classe
            { typeDisplay: 'badge' },                    // viewpoint
            { emptyBehavior: 'collapse' },               // istanza
        );
        expect(s.typeDisplay).toBe('badge');
        expect(s.headerFill).toBe(true);
        expect(s.emptyBehavior).toBe('collapse');
    });

    it('un campo dichiarato undefined NON cancella il livello sotto', () => {
        // E' la differenza fra la cascata e uno spread: `{...a, ...b}` con
        // `b.typeDisplay === undefined` azzererebbe la scelta di `a`.
        const s = resolveInstanceNodeStyle(
            { typeDisplay: 'chip' },
            { typeDisplay: undefined, headerFill: true },
        );
        expect(s.typeDisplay).toBe('chip');
        expect(s.headerFill).toBe(true);
    });

    it('ignora i livelli nulli', () => {
        expect(resolveInstanceNodeStyle(null, undefined, { headerFill: true }).headerFill).toBe(true);
    });

    it('non muta il default', () => {
        resolveInstanceNodeStyle({ headerFill: true, typeDisplay: 'badge' });
        expect(INSTANCE_NODE_STYLE_DEFAULT.headerFill).toBe(false);
        expect(INSTANCE_NODE_STYLE_DEFAULT.typeDisplay).toBe('inline');
    });
});

describe('i preset', () => {
    it('«Default» non cambia niente', () => {
        expect(resolveInstanceNodeStyle(INSTANCE_NODE_PRESETS.default)).toEqual(INSTANCE_NODE_STYLE_DEFAULT);
    });

    it('«Nome primario» demota il tipo a pill e accende la barra a sinistra, restando neutro', () => {
        const s = resolveInstanceNodeStyle(INSTANCE_NODE_PRESETS.namePrimary);
        expect(s.typeDisplay).toBe('chip');
        expect(s.accentPlacement).toBe('left');
        expect(s.accent).toBe(NEUTRAL_ACCENT);
        expect(isCategoricalAccent(s)).toBe(false);   // barra si', colore no
    });

    it('«Categoriale» e\' l\'unico che spende colore, e lo prende dai token entity', () => {
        const s = resolveInstanceNodeStyle(INSTANCE_NODE_PRESETS.categorical);
        expect(s.accent).toBe(CATEGORICAL_ACCENT);
        expect(CATEGORICAL_ACCENT).toContain('--color-entity-object');
        expect(isCategoricalAccent(s)).toBe(true);
    });
});

describe('instanceNodeChrome — la selezione possiede il ciano', () => {
    it('neutro e non selezionato: nessuna barra, coppia badge slate', () => {
        const c = instanceNodeChrome(INSTANCE_NODE_STYLE_DEFAULT, false);
        expect(c.accentColor).toBeNull();
        expect(c.badgeBg).toContain('--color-inode-badge-bg');
    });

    it('categoriale e non selezionato: barra e badge portano il colore d\'identita\'', () => {
        const s = resolveInstanceNodeStyle(INSTANCE_NODE_PRESETS.categorical);
        const c = instanceNodeChrome(s, false);
        expect(c.accentColor).toBe(CATEGORICAL_ACCENT);
        expect(c.badgeBg).toContain('--color-entity-object-bg');
    });

    it('categoriale e SELEZIONATO: il colore d\'identita\' cede, barra e badge diventano ciano', () => {
        const s = resolveInstanceNodeStyle(INSTANCE_NODE_PRESETS.categorical);
        const c = instanceNodeChrome(s, true);
        expect(c.accentColor).toContain('--color-inode-selected-border');
        expect(c.badgeBg).toContain('--color-inode-selected-badge-bg');
        // e non ha toccato lo stile memorizzato
        expect(s.accent).toBe(CATEGORICAL_ACCENT);
    });

    it('senza barra, la selezione non ne inventa una', () => {
        expect(instanceNodeChrome(INSTANCE_NODE_STYLE_DEFAULT, true).accentColor).toBeNull();
    });
});

describe('emptySlotsLabel', () => {
    it('singolare e plurale sono due parole diverse, non una «s» in meno', () => {
        expect(emptySlotsLabel(1)).toBe('1 slot vuoto');
        expect(emptySlotsLabel(3)).toBe('3 slot vuoti');
        expect(emptySlotsLabel(0)).toBe('0 slot vuoti');
    });
});
