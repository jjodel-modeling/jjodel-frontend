/**
 * roleCatalog — the catalog of the simulation roles (P-2026-09-25-1805, R-SIM-47,
 * R-SIM-52, R-SIM-38). Pure data: ids, groups, bag keys, kinds, dependencies.
 * The existing-key test reads the sources of the simulation modules as text, it
 * does not import the panel.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ROLE_CATALOG, ROLE_IDS, dependentsOf, roleDescriptor, roleOfKey } from '../roleCatalog';
import type { RoleId } from '../roleCatalog';

/** The keys R-SIM-50..53 introduce: provisional, nothing reads or writes them yet. */
const NEW_KEYS = ['simAccepting', 'simActivityFinal', 'simAction', 'simEntry', 'simExit', 'simStateOutput', 'simTransitionOutput'];

/** The files of this lane: they name every key, so they are not evidence that the code does. */
const OWN_FILES = new Set(['roleCatalog.ts', 'simProfiles.ts', 'profileCodec.ts']);

const SOURCE_DIRS = [
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../../../components/editor-v2/sim'),
];

/** The non-test sources of the simulation modules, by path. */
function readSources(): Map<string, string> {
    const out = new Map<string, string>();
    for (const dir of SOURCE_DIRS) {
        for (const name of fs.readdirSync(dir)) {
            if (!/\.tsx?$/.test(name) || OWN_FILES.has(name)) continue;
            const file = path.join(dir, name);
            if (fs.statSync(file).isFile()) out.set(file, fs.readFileSync(file, 'utf8'));
        }
    }
    return out;
}

function quoted(source: string, key: string): boolean {
    return new RegExp(`['"\`]${key}['"\`]`).test(source);
}

describe('roleCatalog: shape of the catalog', () => {
    it('has one descriptor per RoleId, in the order of ROLE_IDS, with unique ids', () => {
        expect(ROLE_CATALOG.map(d => d.id)).toEqual([...ROLE_IDS]);
        expect(new Set(ROLE_IDS).size).toBe(ROLE_IDS.length);
        expect(ROLE_IDS).toHaveLength(28);
    });

    it('has unique non-null keys, and simEvent is not one of them (R-SIM-38)', () => {
        const keys = ROLE_CATALOG.map(d => d.key).filter((k): k is string => k !== null);
        expect(new Set(keys).size).toBe(keys.length);
        expect(keys).not.toContain('simEvent');
        expect(ROLE_CATALOG.filter(d => d.key === null).map(d => d.id)).toEqual(['event', 'stateAttributes']);
    });

    it('points every dependsOn to an existing id', () => {
        const ids = new Set<string>(ROLE_IDS);
        for (const d of ROLE_CATALOG) for (const dep of d.dependsOn) expect(ids.has(dep), `${d.id} -> ${dep}`).toBe(true);
    });

    it('has an acyclic dependency graph', () => {
        const state = new Map<RoleId, 'open' | 'done'>();
        const visit = (id: RoleId, trail: RoleId[]): void => {
            if (state.get(id) === 'done') return;
            expect(state.get(id), `cycle through ${[...trail, id].join(' -> ')}`).not.toBe('open');
            state.set(id, 'open');
            for (const dep of roleDescriptor(id).dependsOn) visit(dep, [...trail, id]);
            state.set(id, 'done');
        };
        for (const id of ROLE_IDS) visit(id, []);
        expect(state.size).toBe(ROLE_IDS.length);
    });

    it('carries a label and a one-line description for every role', () => {
        for (const d of ROLE_CATALOG) {
            expect(d.label.trim(), d.id).not.toBe('');
            expect(d.description.trim(), d.id).not.toBe('');
            expect(d.description, d.id).not.toMatch(/\n/);
        }
        expect(roleDescriptor('ownedTransitions').label).toBe('Owned transitions');
        expect(roleDescriptor('nextState').label).toBe('Next state');
    });

    it('matches the rows of the table that drive the profiles', () => {
        expect(roleDescriptor('event')).toMatchObject({ group: 'events', key: null, kind: 'derived', dependsOn: ['trigger'] });
        expect(roleDescriptor('ownedTransitions')).toMatchObject({ group: 'controlFlow', key: 'simOwnedTransitions', kind: 'reference', dependsOn: ['node', 'transition'] });
        expect(roleDescriptor('arcWeight')).toMatchObject({ group: 'petri', key: 'simArcWeight', kind: 'intAttribute', dependsOn: ['arc'] });
        expect(roleDescriptor('bound')).toMatchObject({ group: 'general', key: 'simBound', kind: 'int', dependsOn: [] });
        expect(roleDescriptor('stateAttributes')).toMatchObject({ group: 'data', key: null, kind: 'declarations', dependsOn: [] });
        expect(roleDescriptor('guard')).toMatchObject({ group: 'data', key: 'simGuard', kind: 'expressionAttribute', dependsOn: ['transition'] });
        expect(roleDescriptor('entry')).toMatchObject({ group: 'data', key: 'simEntry', kind: 'actionListAttribute', dependsOn: ['node'] });
        expect(roleDescriptor('transitionOutput')).toMatchObject({ group: 'output', key: 'simTransitionOutput', kind: 'attribute', dependsOn: ['transition'] });
    });
});

describe('roleCatalog: lookups', () => {
    it('finds the role of a key, and none for simEvent or a stranger', () => {
        expect(roleOfKey('simNextState')).toBe('nextState');
        expect(roleOfKey('simAccepting')).toBe('accepting');
        expect(roleOfKey('simEvent')).toBeUndefined();
        expect(roleOfKey('simProfile')).toBeUndefined();
    });

    it('lists the direct dependents of a role', () => {
        expect(dependentsOf('arc')).toEqual(['arcSource', 'arcTarget', 'arcWeight', 'inhibitorArc']);
        expect(dependentsOf('trigger')).toEqual(['event', 'eventIdentifier']);
        expect(dependentsOf('bound')).toEqual([]);
    });
});

describe('roleCatalog: the keys against the code', () => {
    const sources = readSources();

    it('reads the simulation sources (control: the scan is not empty)', () => {
        expect(sources.size).toBeGreaterThan(5);
        expect([...sources.values()].some(s => quoted(s, 'simNode'))).toBe(true);
    });

    it('finds every existing key of the catalog as a string literal in the code', () => {
        const existing = ROLE_CATALOG.map(d => d.key).filter((k): k is string => k !== null && !NEW_KEYS.includes(k));
        expect(existing).toHaveLength(19);
        for (const key of existing) {
            expect([...sources.values()].some(s => quoted(s, key)), key).toBe(true);
        }
    });

    it('finds none of the new keys in the code (nothing reads or writes them, R-SIM-52)', () => {
        for (const key of NEW_KEYS) {
            expect(ROLE_CATALOG.some(d => d.key === key), key).toBe(true);
            expect([...sources.values()].some(s => quoted(s, key)), key).toBe(false);
        }
    });
});
