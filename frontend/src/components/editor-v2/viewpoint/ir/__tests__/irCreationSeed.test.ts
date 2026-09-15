/**
 * irCreationSeed — seed IR alla creazione della view (R-IRN-4).
 *
 * Il modulo è puro: i test lo esercitano direttamente, senza store e senza mock.
 * Coprono le tre forme di seed, la presenza/assenza del pin, il fallback wildcard, e
 * il fatto che ogni uscita passi `validateIR` (che è il gate del modulo stesso: un
 * seed rifiutato torna `null` invece di essere scritto).
 */

import { describe, it, expect } from 'vitest';
import { computeCreationSeed } from '../irCreationSeed';
import { validateIR } from '../irValidate';
import { defaultObjectViewIR } from '../irDefaults';
import type { AnyViewIR, EdgeViewIR, RowViewIR, VertexViewIR } from '../irTypes';

const CLASS_ID = 'Pointer_class_state_1';

describe('computeCreationSeed — vertex', () => {
    it('con metaclasse e pointer: nome in metaclasses, pin scritto', () => {
        const seed = computeCreationSeed({
            kind: 'vertex',
            metaclassName: 'State',
            metaclassId: CLASS_ID,
            label: 'View for State',
        }) as VertexViewIR;

        expect(seed).not.toBeNull();
        expect(seed.kind).toBe('vertex');
        expect(seed.metaclasses).toEqual(['State']);
        expect(seed.authoringMetaclassPins).toEqual({ State: CLASS_ID });
        expect(seed.label).toBe('View for State');
    });

    it('con metaclasse ma senza pointer: nome in metaclasses, nessun pin', () => {
        const seed = computeCreationSeed({
            kind: 'vertex',
            metaclassName: 'Colour',
            label: 'View for Colour',
        }) as VertexViewIR;

        expect(seed.metaclasses).toEqual(['Colour']);
        // Regola del drop (metaclassPin.ts:125-127): la chiave si omette, non si scrive
        // come {} né come undefined esplicito.
        expect('authoringMetaclassPins' in seed).toBe(false);
    });

    it('senza metaclasse: wildcard STRINGA, non ["*"]', () => {
        const seed = computeCreationSeed({ kind: 'vertex' }) as VertexViewIR;

        // irResolveCore.ts:178 confronta `ir.metaclasses === '*'` per identità di stringa:
        // un array archivierebbe la view sotto una metaclasse chiamata letteralmente '*'.
        expect(seed.metaclasses).toBe('*');
        expect(Array.isArray(seed.metaclasses)).toBe(false);
        expect('authoringMetaclassPins' in seed).toBe(false);
    });

    it('senza label: sopravvive quella della factory, non si scrive undefined', () => {
        const seed = computeCreationSeed({ kind: 'vertex', metaclassName: 'State' }) as VertexViewIR;
        // defaultObjectViewIR() porta già `label: 'Object (IR default)'` (irDefaults.ts:37):
        // lo spread condizionale la SOVRASCRIVE quando c'è un nome, non la introduce. È la
        // stessa parità che ha EnableIRPanel.enable(). Il punto del test è che il ramo senza
        // label non scriva `label: undefined` sopra quella della factory.
        expect(seed.label).toBe('Object (IR default)');
    });

    it('resta strutturalmente la factory a meno dei campi seedati', () => {
        const seed = computeCreationSeed({ kind: 'vertex' }) as VertexViewIR;
        const factory = defaultObjectViewIR();
        expect(seed.shape).toEqual(factory.shape);
        expect(seed.fieldCompartments).toEqual(factory.fieldCompartments);
        expect(seed.irVersion).toBe(factory.irVersion);
    });

    it('non scrive mai migratedFrom (R-IRN-1: è della sola migration)', () => {
        const seed = computeCreationSeed({
            kind: 'vertex',
            metaclassName: 'State',
            metaclassId: CLASS_ID,
        }) as VertexViewIR;
        expect('migratedFrom' in seed).toBe(false);
    });
});

describe('computeCreationSeed — row', () => {
    it('metaclasses vuoto, template intrinseco, nessun pin', () => {
        const seed = computeCreationSeed({ kind: 'row' }) as RowViewIR;

        expect(seed.kind).toBe('row');
        expect(seed.metaclasses).toEqual([]);
        expect(seed.template).toEqual([{ from: 'intrinsic', prop: 'name' }]);
        expect('authoringMetaclassPins' in seed).toBe(false);
    });

    it('ignora metaclassName e metaclassId: un row nasce senza metaclasse', () => {
        const seed = computeCreationSeed({
            kind: 'row',
            metaclassName: 'State',
            metaclassId: CLASS_ID,
        }) as RowViewIR;

        expect(seed.metaclasses).toEqual([]);
        expect('authoringMetaclassPins' in seed).toBe(false);
    });
});

describe('computeCreationSeed — edge', () => {
    it('con metaclasse e pointer: nome in metaclasses, pin scritto', () => {
        const seed = computeCreationSeed({
            kind: 'edge',
            metaclassName: 'Machine',
            metaclassId: CLASS_ID,
        }) as EdgeViewIR;

        expect(seed.kind).toBe('edge');
        expect(seed.metaclasses).toEqual(['Machine']);
        expect(seed.authoringMetaclassPins).toEqual({ Machine: CLASS_ID });
    });

    it('senza metaclasse: array VUOTO, non wildcard', () => {
        const seed = computeCreationSeed({ kind: 'edge' }) as EdgeViewIR;

        // defaultEdgeViewIR parte da [] e il fallback lo conserva: un edge wildcard
        // matcherebbe ogni metaclasse del viewpoint.
        expect(seed.metaclasses).toEqual([]);
        expect('authoringMetaclassPins' in seed).toBe(false);
    });

    it('lascia edge vuoto, così valgono i default di compile', () => {
        const seed = computeCreationSeed({ kind: 'edge', metaclassName: 'Machine' }) as EdgeViewIR;
        expect(seed.edge).toEqual({});
        // routing assente = default orthogonal (irValidate.ts:20-23): non va scritto.
        expect('routing' in seed.edge).toBe(false);
    });
});

describe('computeCreationSeed — ogni uscita passa validateIR', () => {
    const cases: Array<[string, Parameters<typeof computeCreationSeed>[0]]> = [
        ['vertex pinnato', { kind: 'vertex', metaclassName: 'State', metaclassId: CLASS_ID, label: 'V' }],
        ['vertex per nome', { kind: 'vertex', metaclassName: 'State' }],
        ['vertex wildcard', { kind: 'vertex' }],
        ['row', { kind: 'row' }],
        ['edge pinnato', { kind: 'edge', metaclassName: 'Machine', metaclassId: CLASS_ID }],
        ['edge vuoto', { kind: 'edge' }],
    ];

    for (const [name, input] of cases) {
        it(name, () => {
            const seed = computeCreationSeed(input);
            expect(seed).not.toBeNull();
            expect(validateIR('test-' + name, seed as AnyViewIR)).toEqual({ ok: true });
        });
    }
});
