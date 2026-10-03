/**
 * ER (Chen), slice A4 (P-2026-09-30-0440, R-VP-23, mockup docs/mockups/derived-viewpoints/er-A-chen.svg):
 * the notation, its signal prefill (erSignals.ts) and its documents.
 *
 * The ERD metamodels are the ones viewpointDerivation.test.ts transcribes from the exports
 * (`~/Downloads/ERDLanguage.jjodel`, `MDE _ ERD (1).jjodel`, `MDE _ ERD.jjodel`), with the enums the
 * transcription left out written back: ERDLanguage's `Cardinality` (OneToOne, OneToMany, ManyToOne,
 * ManyToMany) and `Type`. The M1 objects are ERDLanguage's `People` model, as the export holds them.
 * The four demos are notations.test.ts's, their binding applied as the demo configures it.
 */

import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
    DERIVED_NOTATIONS, canDerive, derivedDocuments, derivedViewpointState, dialogPrefill, initialNotation, notationRoles, roleLabel,
} from '../notations';
import type { ClassRoles, DerivedNotationId } from '../notations';
import { deriveGenericViewpointIRs } from '../viewpointDerivation';
import type { AnyDerivedView } from '../viewpointDerivation';
import { erSignalRoles } from '../erSignals';
import { validateIR } from '../../ir/irValidate';
import { getIRIndex, resolveEdgeView, resolveIRView } from '../../ir/irResolveCore';
import { makeDrawReadCtx } from '../../ir/irReadCtx';
import type { ReadCtx } from '../../ir/irReadCtx';
import { structuralHash } from '../../ir/irDefaults';
import { resolveTextStyle } from '../../ir/irCompile';
import { sketchOfMetamodel } from '../../../sim/metamodelSketch';
import { bindProfile } from '../../../../../model/simulation/profileBinder';
import { systemProfile } from '../../../../../model/simulation/simProfiles';
import { ROLE_CATALOG } from '../../../../../model/simulation/roleCatalog';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

type Lookup = Record<string, any>;

const EINT = 'Pointer_EINT';
const ESTRING = 'Pointer_ESTRING';
const EBOOLEAN = 'Pointer_EBOOLEAN';
const EXPRESSION = 'Pointer_EXPRESSION';
const ACTION = 'Pointer_ACTION';

interface AttrDef { name: string; type: string; upper: number }
interface RefDef { name: string; type: string; composition: boolean; upper: number }
interface ClsDef { name: string; abstract?: boolean; supers?: string[]; attrs?: AttrDef[]; refs?: RefDef[] }
interface Fixture { id: string; lookup: Lookup; classId(name: string): string }

const attr = (name: string, type: string, upper = 1): AttrDef => ({ name, type, upper });
const ref = (name: string, type: string, opts: { composition?: boolean; upper?: number } = {}): RefDef =>
    ({ name, type, composition: !!opts.composition, upper: opts.upper ?? 1 });
const cls = (name: string, def: Omit<ClsDef, 'name'> = {}): ClsDef => ({ name, ...def });

/** The builder of viewpointDerivation.test.ts, plus enums: `<tag>.<Enum>` holding `<tag>.<Enum>.<Literal>`. */
function metamodel(tag: string, name: string, classes: ClsDef[], enums: Record<string, string[]> = {}): Fixture {
    const lookup: Lookup = {};
    const classId = (n: string) => `${tag}.${n}`;
    lookup[tag] = { className: 'DModel', name, isMetamodel: true, packages: [`${tag}.pkg`], classes: [] };
    lookup[`${tag}.pkg`] = { className: 'DPackage', name: 'default', classes: classes.map(c => classId(c.name)), subpackages: [] };
    for (const c of classes) {
        const id = classId(c.name);
        lookup[id] = {
            className: 'DClass', name: c.name, abstract: !!c.abstract, extends: (c.supers ?? []).map(classId),
            attributes: (c.attrs ?? []).map(a => `${id}.${a.name}`), references: (c.refs ?? []).map(r => `${id}.${r.name}`),
        };
        for (const a of c.attrs ?? []) lookup[`${id}.${a.name}`] = { className: 'DAttribute', name: a.name, type: a.type, upperBound: a.upper };
        for (const r of c.refs ?? []) {
            lookup[`${id}.${r.name}`] = {
                className: 'DReference', name: r.name, type: classId(r.type), composition: r.composition, aggregation: false, upperBound: r.upper,
            };
        }
    }
    for (const [e, literals] of Object.entries(enums)) {
        lookup[`${tag}.${e}`] = { className: 'DEnumerator', name: e, literals: literals.map(l => `${tag}.${e}.${l}`) };
        literals.forEach((l, i) => { lookup[`${tag}.${e}.${l}`] = { className: 'DEnumLiteral', name: l, value: i }; });
    }
    return { id: tag, lookup, classId };
}

/** ERDLanguage.jjodel, metamodel ERD: `ownedAttributes` is a plain reference, so its Attribute is a node. */
const ERDL = () => metamodel('ERDL', 'ERD', [
    cls('NamedElement', { abstract: true, attrs: [attr('name', ESTRING)] }),
    cls('Entity', { supers: ['NamedElement'], refs: [ref('ownedAttributes', 'Attribute', { upper: -1 })] }),
    cls('Attribute', { supers: ['NamedElement'], attrs: [attr('type', 'ERDL.Type'), attr('isKey', EBOOLEAN)] }),
    cls('Relationship', { supers: ['NamedElement'], attrs: [attr('cardinality', 'ERDL.Cardinality')], refs: [ref('left', 'Entity'), ref('right', 'Entity')] }),
], { Type: ['String', 'Integer', 'Boolean'], Cardinality: ['OneToOne', 'OneToMany', 'ManyToOne', 'ManyToMany'] });
/** ERDLanguage.jjodel, metamodel Relational. */
const RELATIONAL = () => metamodel('REL', 'Relational', [
    cls('Table', { attrs: [attr('name', ESTRING)], refs: [ref('columns', 'Column', { composition: true, upper: -1 })] }),
    cls('Column', { attrs: [attr('name', ESTRING), attr('type', 'REL.SqlType'), attr('isPrimaryKey', EBOOLEAN)] }),
    cls('ForeignKey', { attrs: [attr('name', ESTRING)], refs: [ref('source', 'Table'), ref('target', 'Table')] }),
], { SqlType: ['VARCHAR', 'INTEGER', 'BOOLEAN'] });
/** ERDLanguage.jjodel, metamodel Library (no M1 object). */
const LIBRARY = () => metamodel('LIB', 'Library', [
    cls('Catalogue', { refs: [ref('books', 'Book', { composition: true, upper: -1 }), ref('members', 'Member', { composition: true, upper: -1 })] }),
    cls('Book', { attrs: [attr('title', ESTRING), attr('isbn', ESTRING), attr('year', EINT)] }),
    cls('Member', { attrs: [attr('name', ESTRING), attr('memberId', ESTRING)] }),
    cls('Loan', { attrs: [attr('dueDate', 'Pointer_EDATE')] }),
]);
/** MDE _ ERD (1).jjodel: attributes held by composition, so they are C rows. */
const MDE_ERD_1 = () => metamodel('ERD', 'ERD MM', [
    cls('Entity', { supers: ['namedElement'], refs: [ref('attributes', 'Attribute', { composition: true, upper: -1 })] }),
    cls('Attribute', { supers: ['namedElement'], attrs: [attr('type', 'ERD.EnumType')] }),
    cls('namedElement', { attrs: [attr('name', ESTRING)] }),
    cls('Relation', { supers: ['namedElement'], refs: [ref('left', 'Entity'), ref('right', 'Entity')] }),
]);
/** MDE _ ERD.jjodel: the same with namedElement abstract. */
const MDE_ERD = () => metamodel('MERD', 'ERD MM', [
    cls('Entity', { supers: ['namedElement'], refs: [ref('attributes', 'Attribute', { composition: true, upper: -1 })] }),
    cls('Attribute', { supers: ['namedElement'], attrs: [attr('type', 'MERD.EnumType')] }),
    cls('namedElement', { abstract: true, attrs: [attr('name', ESTRING)] }),
    cls('Relation', { supers: ['namedElement'], refs: [ref('left', 'Entity'), ref('right', 'Entity')] }),
]);

const PEST = () => metamodel('PEST', 'DemoPEST', [
    cls('State', { refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
    cls('Initial', { supers: ['State'] }),
    cls('Terminal', { supers: ['State'] }),
    cls('Transition', { refs: [ref('nextState', 'State'), ref('event', 'Event')] }),
    cls('Event'),
]);
const PETRI = () => metamodel('PETRI', 'DemoPetri', [
    cls('PNode', { abstract: true }),
    cls('Place', { supers: ['PNode'], attrs: [attr('tokens', EINT)] }),
    cls('Transition', { supers: ['PNode'], attrs: [attr('guard', EXPRESSION)] }),
    cls('Arc', { attrs: [attr('weight', EINT)], refs: [ref('src', 'PNode'), ref('tgt', 'PNode')] }),
    cls('InhibitorArc', { supers: ['Arc'] }),
]);
const ESM = () => metamodel('ESM', 'DemoESM', [
    cls('State', { attrs: [attr('entry', ACTION, -1)], refs: [ref('transitions', 'Transition', { composition: true, upper: -1 })] }),
    cls('Initial', { supers: ['State'] }),
    cls('Terminal', { supers: ['State'] }),
    cls('Transition', { attrs: [attr('guard', EXPRESSION), attr('effect', ACTION, -1)], refs: [ref('nextState', 'State'), ref('event', 'Event')] }),
    cls('Event', { attrs: [attr('name', ESTRING)] }),
]);
const FLOWB = () => metamodel('FLOWB', 'DemoFlowB', [
    cls('ActivityNode'),
    cls('InitialNode', { supers: ['ActivityNode'] }),
    cls('Activity', { supers: ['ActivityNode'] }),
    cls('Decision', { supers: ['ActivityNode'] }),
    cls('Fork', { supers: ['ActivityNode'] }),
    cls('Join', { supers: ['ActivityNode'] }),
    cls('FinalNode', { supers: ['ActivityNode'] }),
    cls('ControlFlow', { attrs: [attr('guard', EXPRESSION), attr('effect', ACTION, -1)], refs: [ref('source', 'ActivityNode'), ref('target', 'ActivityNode')] }),
]);

/** The bag the Simulation roles dialog's Apply writes, as notations.test.ts builds it. */
function configured(make: () => Fixture, profileId: string | null): Fixture {
    const mm = make();
    if (!profileId) return mm;
    const bindings = bindProfile(systemProfile(profileId)!, sketchOfMetamodel(mm.lookup, mm.id));
    const bag: Record<string, unknown> = { simProfile: profileId };
    for (const d of ROLE_CATALOG) {
        const b = bindings[d.id];
        if (d.key && b?.status === 'bound') bag[d.key] = b.value;
    }
    mm.lookup[mm.id]._state = bag;
    return mm;
}

/** Every metamodel the discovery measured, with the stored binding of the demos. */
const CORPUS: [string, () => Fixture, string | null][] = [
    ['DemoPEST', PEST, 'stateMachine'], ['DemoPetri', PETRI, 'petri'], ['DemoESM', ESM, 'extendedStateMachine'], ['DemoFlowB', FLOWB, 'flowchart'],
    ['ERDLanguage ERD', ERDL, null], ['ERDLanguage Relational', RELATIONAL, null], ['ERDLanguage Library', LIBRARY, null],
    ['MDE ERD (1)', MDE_ERD_1, null], ['MDE ERD', MDE_ERD, null],
];

const digest = (views: AnyDerivedView[]) => createHash('sha256').update(JSON.stringify(views)).digest('hex').slice(0, 16);
const byName = (mm: Fixture, roles: ClassRoles) =>
    Object.fromEntries(Object.entries(roles).map(([id, r]) => [mm.lookup[id]?.name ?? id, r]).sort(([a], [b]) => a.localeCompare(b)));
const chen = (mm: Fixture, roles?: ClassRoles) =>
    derivedDocuments(mm.lookup, mm.id, { notation: 'erChen', classRoles: roles ?? dialogPrefill(mm.lookup, mm.id, 'erChen', []).roles });
const docsOf = (views: AnyDerivedView[], name: string) => views.filter(v => v.className === name).map(v => v.ir as any);
const bare = (ir: any) => { const { generated: _g, ...rest } = ir; return rest; };

const INK = 'var(--color-inode-name)';
const SURFACE = 'var(--color-inode-surface)';
const QUIET = 'var(--color-inode-quiet)';
const NAME = { from: 'intrinsic', prop: 'name' } as const;
const LABEL_STYLE = { fontSize: 12, fontWeight: 'medium', color: QUIET };
const INK_BORDER = { color: INK, width: 1, style: 'solid' };
const LINE_EDGE = { terminations: { sourceEnd: 'none', targetEnd: 'none' }, line: { color: INK, width: 1 }, curve: 'arc' };

// ---------------------------------------------------------------------------
// Every other notation is untouched
// ---------------------------------------------------------------------------

describe('A4 leaves every other notation as it was', () => {
    // Measured on the A1+A3 tip (47a7cceb1) before any A4 edit: the documents WITH their provenance.
    // R-VP-25 (P-2026-09-30-1521): the 24 lists that held a filled arrowhead moved with the open one, each to the
    // digest predicted on 2cde09984's code, before any A2 edit: the tip's documents with every closedArrow an
    // openArrow and their provenance hash recomputed.
    const PINNED: Record<string, string> = {
        'DemoESM flowchart': '42459bd72a617f2f',
        'DemoESM flowchartIso': '7b89007086b38e02',
        'DemoESM generic': 'f5b415d0f3a7512c',
        'DemoESM petri': 'ae8b9f79a275c716',
        'DemoESM stateMachine': '7c9995dcf7935ec6',
        'DemoESM statechart': 'c4de3ba17221210b',
        'DemoFlowB flowchart': '7e7715ad457a678a',
        'DemoFlowB flowchartIso': 'b7cb2ce5f5a14bd0',
        'DemoFlowB generic': '1ebd123804dc75a1',
        'DemoFlowB petri': 'b8415f0e187edacc',
        'DemoFlowB stateMachine': 'c14102114d435a6d',
        'DemoFlowB statechart': '90451f737522f3cc',
        'DemoPEST flowchart': 'e1dcb9c59b5a3f7b',
        'DemoPEST flowchartIso': '042f60bcc91d9e26',
        'DemoPEST generic': '6d66ed919a80875b',
        'DemoPEST petri': '0d845ed009b85a0a',
        'DemoPEST stateMachine': '859ed7219f226f01',
        'DemoPEST statechart': '6018e49cd52e7a9c',
        'DemoPetri flowchart': 'c7f24aeb60cfb60b',
        'DemoPetri flowchartIso': '02ed35a22d5bcf3f',
        'DemoPetri generic': 'dab0b1ddf3a00c38',
        'DemoPetri petri': '8e7711ee80601155',
        'DemoPetri stateMachine': 'b3a4db87af089b89',
        'DemoPetri statechart': '8c464c188cbec9e6',
        'ERDLanguage ERD flowchart': '-',
        'ERDLanguage ERD flowchartIso': '-',
        'ERDLanguage ERD generic': 'a718dff62a153ed7',
        'ERDLanguage ERD petri': '11bd6ee766e2866b',
        'ERDLanguage ERD stateMachine': '-',
        'ERDLanguage ERD statechart': '-',
        'ERDLanguage Library flowchart': '-',
        'ERDLanguage Library flowchartIso': '-',
        'ERDLanguage Library generic': '5d610e4c7112216a',
        'ERDLanguage Library petri': '-',
        'ERDLanguage Library stateMachine': '-',
        'ERDLanguage Library statechart': '-',
        'ERDLanguage Relational flowchart': 'ba7f13f9e8a7e958',
        'ERDLanguage Relational flowchartIso': '618536ddc0c5fb1c',
        'ERDLanguage Relational generic': 'c86b731e691610e0',
        'ERDLanguage Relational petri': '1b5fd91bf8ed1146',
        'ERDLanguage Relational stateMachine': 'c6e5157defb98b6c',
        'ERDLanguage Relational statechart': 'a10174978ee9d6d5',
        'MDE ERD (1) flowchart': '024ecb760b767d19',
        'MDE ERD (1) flowchartIso': '5dceda5fcbd7fc26',
        'MDE ERD (1) generic': '0e6fb2e157d7fff9',
        'MDE ERD (1) petri': '07ff9e2527b4d240',
        'MDE ERD (1) stateMachine': '86081cb412557f79',
        'MDE ERD (1) statechart': 'e046517ce3d6741d',
        'MDE ERD flowchart': '8fd5876c444c8f38',
        'MDE ERD flowchartIso': '182885c756ad4f6c',
        'MDE ERD generic': '56b57c4cbf8511b0',
        'MDE ERD petri': '8de1ee68e98af432',
        'MDE ERD stateMachine': '479403231af1e581',
        'MDE ERD statechart': 'c147fc520727ac68',
    };

    it('Generic, State machine, Statechart, Petri net, Flowchart and Flowchart (ISO) derive the tip\'s documents on the corpus', () => {
        const got: Record<string, string> = {};
        for (const [name, make, stored] of CORPUS) {
            // Activity (UML) (P-2026-09-30-1552, R-VP-26) is pinned in activityUml.test.ts.
            for (const n of DERIVED_NOTATIONS.map(x => x.id).filter(id => id !== 'erChen' && id !== 'petriClassic' && id !== 'activityUml')) {
                const mm = configured(make, stored);
                const choice = { notation: n, classRoles: dialogPrefill(mm.lookup, mm.id, n, []).roles };
                got[`${name} ${n}`] = canDerive(choice) ? digest(derivedDocuments(mm.lookup, mm.id, choice)) : '-';
            }
        }
        expect(got).toEqual(PINNED);
    });

    // Measured on the A2 tip (d4daecaf7's code) before any edit of P-2026-09-30-1552: the two notations the
    // table above leaves out, the documents WITH their provenance.
    const PINNED_A2: Record<string, string> = {
        'DemoESM erChen': '-',
        'DemoESM petriClassic': '7b37678d9887e7a0',
        'DemoFlowB erChen': '-',
        'DemoFlowB petriClassic': 'b098e7f609b2e4d7',
        'DemoPEST erChen': '-',
        'DemoPEST petriClassic': 'e838a4e40d369fad',
        'DemoPetri erChen': '-',
        'DemoPetri petriClassic': '1145469c86278aae',
        'ERDLanguage ERD erChen': '61c73fe96b150683',
        'ERDLanguage ERD petriClassic': '68e8b8c0cb4f696a',
        'ERDLanguage Library erChen': '-',
        'ERDLanguage Library petriClassic': '-',
        'ERDLanguage Relational erChen': 'c82afdad857005ab',
        'ERDLanguage Relational petriClassic': 'faa1a548b936c708',
        'MDE ERD (1) erChen': '23a31f1c3f487daa',
        'MDE ERD (1) petriClassic': '138fc16f9e9e978c',
        'MDE ERD erChen': '4299e38db1cad805',
        'MDE ERD petriClassic': '5899491b315b0c22',
    };

    it('Petri net (classic) and ER (Chen) derive the A2 tip\'s documents on the corpus (Activity (UML) moves neither)', () => {
        const got: Record<string, string> = {};
        for (const [name, make, stored] of CORPUS) {
            for (const n of ['petriClassic', 'erChen'] as DerivedNotationId[]) {
                const mm = configured(make, stored);
                const choice = { notation: n, classRoles: dialogPrefill(mm.lookup, mm.id, n, []).roles };
                got[`${name} ${n}`] = canDerive(choice) ? digest(derivedDocuments(mm.lookup, mm.id, choice)) : '-';
            }
        }
        expect(got).toEqual(PINNED_A2);
    });
});

// ---------------------------------------------------------------------------
// The notation and its table
// ---------------------------------------------------------------------------

describe('ER (Chen) in the list', () => {
    it('last of the nine, with no simulation profile, its four class roles', () => {
        // A2 (P-2026-09-30-1521, R-VP-24): Petri net (classic) after Petri net.
        // P-2026-09-30-1552 (R-VP-26): Activity (UML) after Flowchart (ISO 5807).
        expect(DERIVED_NOTATIONS.map(n => n.id)).toEqual(['generic', 'stateMachine', 'statechart', 'petri', 'petriClassic', 'flowchart', 'flowchartIso', 'activityUml', 'erChen']);
        const er = DERIVED_NOTATIONS[8];
        expect([er.label, er.profile]).toEqual(['ER (Chen)', null]);
        expect(notationRoles('erChen')).toEqual(['entity', 'relationship', 'attribute', 'key']);
        expect(notationRoles('erChen').map(r => roleLabel('erChen', r))).toEqual(['Entity', 'Relationship', 'Attribute', 'Key']);
    });

    it('a table with no role derives nothing; with one it does', () => {
        expect(canDerive({ notation: 'erChen', classRoles: {} })).toBe(false);
        expect(canDerive({ notation: 'erChen', classRoles: { x: 'entity' } })).toBe(true);
        // Generic and the role notations as before.
        expect(canDerive({ notation: 'generic', classRoles: {} })).toBe(true);
        expect(canDerive({ notation: 'petri', classRoles: {} })).toBe(false);
    });

    it('the stored binding never opens the dialog on ER; the latest derived viewpoint does', () => {
        const mm = ERDL();
        expect(initialNotation(mm.lookup, mm.id, [])).toBe('generic');
        mm.lookup.vp1 = { className: 'DViewPoint', id: 'vp1', _state: { derivedFrom: mm.id, derivedNotation: 'erChen' } };
        expect(initialNotation(mm.lookup, mm.id, ['vp1'])).toBe('erChen');
    });
});

describe('the signal prefill (erSignals.ts)', () => {
    it('the three ERD exports: Entity, Attribute and the relationship', () => {
        for (const [name, make, rel] of [['ERDLanguage ERD', ERDL, 'Relationship'], ['MDE ERD (1)', MDE_ERD_1, 'Relation'], ['MDE ERD', MDE_ERD, 'Relation']] as const) {
            const mm = make();
            const pre = dialogPrefill(mm.lookup, mm.id, 'erChen', []);
            expect(pre.from, name).toBe('signals');
            expect(byName(mm, pre.roles), name).toEqual({ Attribute: 'attribute', Entity: 'entity', [rel]: 'relationship' });
        }
    });

    it('the rest of the corpus: a table and its columns for Relational, nothing for Library and the demos', () => {
        const rel = RELATIONAL();
        expect(byName(rel, erSignalRoles(rel.lookup, rel.id))).toEqual({ Column: 'attribute', ForeignKey: 'relationship', Table: 'entity' });
        for (const make of [LIBRARY, PEST, PETRI, ESM, FLOWB]) {
            const mm = make();
            expect(erSignalRoles(mm.lookup, mm.id), mm.lookup[mm.id].name).toEqual({});
            expect(canDerive({ notation: 'erChen', classRoles: dialogPrefill(mm.lookup, mm.id, 'erChen', []).roles })).toBe(false);
        }
    });

    it('a key class, named by the key signal, under the attribute class; a class named like a relationship with no two references', () => {
        const mm = metamodel('KEY', 'Keys', [
            cls('Entity', { attrs: [attr('name', ESTRING)], refs: [ref('attrs', 'Attribute', { composition: true, upper: -1 })] }),
            cls('Attribute', { attrs: [attr('name', ESTRING), attr('type', ESTRING)] }),
            cls('KeyAttribute', { supers: ['Attribute'] }),
            cls('PrimaryIdentifier', { supers: ['Attribute'] }),
            cls('Relationship', { attrs: [attr('name', ESTRING)], refs: [ref('ends', 'Entity', { upper: -1 })] }),
            cls('Valid', { attrs: [attr('name', ESTRING)] }),
            // A word that holds `id` without starting with it is not a key; a key word outside the attributes neither.
            cls('ValidatedValue', { supers: ['Attribute'] }),
            cls('IdCard', { attrs: [attr('name', ESTRING)] }),
        ]);
        expect(byName(mm, erSignalRoles(mm.lookup, mm.id))).toEqual({
            Attribute: 'attribute', Entity: 'entity', KeyAttribute: 'key', PrimaryIdentifier: 'key', Relationship: 'relationship',
        });
    });

    it('a relationship that holds attributes is a relationship, not an entity; a class held by it is an attribute', () => {
        const mm = metamodel('RA', 'RelAttrs', [
            cls('Entity', { attrs: [attr('name', ESTRING)], refs: [ref('attributes', 'Attribute', { composition: true, upper: -1 })] }),
            cls('Attribute', { attrs: [attr('name', ESTRING), attr('type', ESTRING)] }),
            cls('Link', { attrs: [attr('name', ESTRING)], refs: [ref('from', 'Entity'), ref('to', 'Entity'), ref('attributes', 'Attribute', { composition: true, upper: -1 })] }),
        ]);
        expect(byName(mm, erSignalRoles(mm.lookup, mm.id))).toEqual({ Attribute: 'attribute', Entity: 'entity', Link: 'relationship' });
    });

    it('the latest derived viewpoint of ER (Chen) wins over the signals, kept to the notation\'s roles', () => {
        const mm = ERDL();
        mm.lookup.vp1 = {
            className: 'DViewPoint', id: 'vp1',
            _state: { derivedFrom: mm.id, derivedNotation: 'erChen', [`derivedRole_${mm.classId('Entity')}`]: 'entity', [`derivedRole_${mm.classId('Attribute')}`]: 'node' },
        };
        const pre = dialogPrefill(mm.lookup, mm.id, 'erChen', ['vp1']);
        expect(pre.from).toBe('derived');
        expect(byName(mm, pre.roles)).toEqual({ Entity: 'entity' });
    });

    it('the table is stored with the viewpoint, one key per bound class', () => {
        const mm = ERDL();
        const roles = dialogPrefill(mm.lookup, mm.id, 'erChen', []).roles;
        expect(derivedViewpointState(mm.lookup, mm.id, { notation: 'erChen', classRoles: roles })).toEqual({
            derivedFrom: 'ERDL', derivedNotation: 'erChen',
            'derivedRole_ERDL.Entity': 'entity', 'derivedRole_ERDL.Attribute': 'attribute', 'derivedRole_ERDL.Relationship': 'relationship',
            // P-2026-10-01-2215 (Q2): the notation's layout profile travels with the viewpoint.
            derivedLayout: JSON.stringify(DERIVED_NOTATIONS.find(n => n.id === 'erChen')!.layout),
        });
    });
});

// ---------------------------------------------------------------------------
// The documents
// ---------------------------------------------------------------------------

describe('ER (Chen) on ERDLanguage ERD — the attributes are nodes', () => {
    const mm = ERDL();
    const views = chen(mm);

    it('every document passes the IR validator and carries its provenance', () => {
        for (const v of views) {
            expect(validateIR(`chen:${v.className}`, v.ir), `${v.className} ${v.ir.label}`).toEqual({ ok: true });
            const g = (v.ir as any).generated;
            expect(g.notation).toBe('erChen');
            expect(g.hash).toBe(structuralHash(bare(v.ir)));
        }
        expect(docsOf(views, 'Entity')[0].generated.role).toBe('entity');
        expect(docsOf(views, 'Relationship')[0].generated.role).toBe('relationship');
        expect(docsOf(views, 'Attribute')[0].generated.role).toBe('attribute');
    });

    it('an entity is a white rectangle (radius 4, the rect\'s own), 1 px in the ink, its name centred 14 px 600 in the ink', () => {
        const [entity] = docsOf(views, 'Entity');
        expect(entity.kind).toBe('vertex');
        expect(entity.shape).toEqual({
            form: 'rect', fill: SURFACE, border: INK_BORDER,
            labels: [{ position: 'center', source: NAME, style: { fontSize: 14, fontWeight: 'semibold', color: INK } }],
        });
        expect('cornerRadius' in entity.shape).toBe(false);
        expect(entity.fieldCompartments).toBeUndefined();
    });

    it('a relationship is a diamond node, its name inside 13 px, and its two references plain lines', () => {
        const [rel, left, ...rest] = docsOf(views, 'Relationship');
        expect(rel.kind).toBe('vertex');
        expect(rel.shape).toEqual({
            form: 'diamond', fill: SURFACE, border: INK_BORDER,
            labels: [{ position: 'center', source: NAME, style: { fontSize: 13, fontWeight: 'medium', color: INK } }],
        });
        expect(rel.fieldCompartments).toBeUndefined();
        expect(left).toMatchObject({ kind: 'edge', metaclasses: ['Relationship'], reference: 'left', edge: LINE_EDGE });
        expect(left.edge.source).toBeUndefined();
        expect(left.edge.target).toBeUndefined();
        expect(left.predicate).toBeUndefined();
        const right = rest.find((d: any) => d.reference === 'right' && d.predicate === undefined);
        expect(right).toMatchObject({ kind: 'edge', reference: 'right', edge: LINE_EDGE });
    });

    it('an attribute is an ellipse, its name centred 13 px, underlined when isKey holds; linked to its entity by a plain line', () => {
        const [attribute] = docsOf(views, 'Attribute');
        expect(attribute.shape).toEqual({
            form: 'ellipse', fill: SURFACE, border: INK_BORDER,
            labels: [{
                position: 'center', source: NAME,
                style: { fontSize: 13, fontWeight: 'medium', color: INK, underline: { when: { op: 'eq', left: '$isKey.value', right: { kind: 'boolean', value: true } }, then: true } },
            }],
        });
        const lines = docsOf(views, 'Entity').filter(d => d.kind === 'edge');
        expect(lines).toEqual([{
            irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Entity'], authoringMetaclassPins: { Entity: 'ERDL.Entity' }, exclusive: true,
            label: 'View for Entity.ownedAttributes', reference: 'ownedAttributes', edge: LINE_EDGE, generated: lines[0].generated,
        }]);
    });

    it('the cardinality: per reference, one document per mark, over the Cardinality enum\'s literals', () => {
        const ends = docsOf(views, 'Relationship').filter(d => d.kind === 'edge' && d.predicate);
        const read = ends.map(d => [d.reference, d.edge.labels.targetEnd.text, d.priority, d.predicate]);
        const eq = (v: string) => ({ op: 'eq', left: '$cardinality.value', right: { kind: 'string', value: v } });
        expect(read).toEqual([
            ['left', '1', 1, { op: 'or', args: [eq('OneToOne'), eq('OneToMany')] }],
            ['left', 'N', 1, { op: 'or', args: [eq('ManyToOne'), eq('ManyToMany')] }],
            ['right', '1', 1, { op: 'or', args: [eq('OneToOne'), eq('ManyToOne')] }],
            ['right', 'N', 1, eq('OneToMany')],
            ['right', 'M', 1, eq('ManyToMany')],
        ]);
        for (const d of ends) {
            expect(d.edge).toEqual({ ...LINE_EDGE, labels: { targetEnd: { from: 'literal', text: d.edge.labels.targetEnd.text }, style: LABEL_STYLE } });
            expect(d.label).toBe(`View for Relationship.${d.reference} (${d.edge.labels.targetEnd.text})`);
        }
    });

    it('the order: the structure\'s, each class\'s vertex first, then its lines, each line before its marks', () => {
        expect(views.map(v => `${v.className}:${v.ir.kind}:${(v.ir as any).reference ?? ''}:${(v.ir as any).edge?.labels?.targetEnd?.text ?? ''}`)).toEqual([
            'Entity:vertex::', 'Entity:edge:ownedAttributes:',
            'Attribute:vertex::',
            'Relationship:vertex::', 'Relationship:edge:left:', 'Relationship:edge:left:1', 'Relationship:edge:left:N',
            'Relationship:edge:right:', 'Relationship:edge:right:1', 'Relationship:edge:right:N', 'Relationship:edge:right:M',
        ]);
    });
});

/** ERDLanguage's People model (the export's M1 objects), in the ERDL fixture's ids. */
function people(mm: Fixture): Lookup {
    const lookup: Lookup = { ...mm.lookup };
    const feat = (cls: string, f: string) => `${mm.classId(cls)}.${f}`;
    const inherited = (f: string) => (f === 'name' ? feat('NamedElement', 'name') : '');
    const obj = (id: string, cls: string, slots: Record<string, unknown[]>) => {
        lookup[id] = { id, className: 'DObject', name: id, instanceof: mm.classId(cls), features: Object.keys(slots).map(k => `${id}.${k}`) };
        for (const [k, values] of Object.entries(slots)) {
            lookup[`${id}.${k}`] = { id: `${id}.${k}`, className: 'DValue', instanceof: inherited(k) || feat(cls, k), values };
        }
    };
    const card = (l: string) => `ERDL.Cardinality.${l}`;
    obj('Person', 'Entity', { name: ['Person'], ownedAttributes: ['name', 'surname', 'age'] });
    obj('Role', 'Entity', { name: ['Role'], ownedAttributes: ['id2', 'name2'] });
    obj('Car', 'Entity', { name: ['Car'], ownedAttributes: ['id3', 'manufacturer'] });
    for (const [id, key] of [['name', false], ['surname', false], ['age', false], ['id2', true], ['name2', false], ['id3', true], ['manufacturer', false]] as const) {
        obj(id, 'Attribute', { type: [], isKey: key ? [true] : [], name: [id] });
    }
    obj('hasRole', 'Relationship', { cardinality: [card('OneToMany')], name: ['hasRole'], left: ['Person'], right: ['Role'] });
    obj('shares', 'Relationship', { cardinality: [card('ManyToMany')], name: ['shares'], left: ['Person'], right: ['Car'] });
    for (const l of ['OneToOne', 'ManyToOne']) obj(`r_${l}`, 'Relationship', { cardinality: [card(l)], name: [l], left: ['Car'], right: ['Role'] });
    obj('r_unset', 'Relationship', { cardinality: [], name: ['unset'], left: ['Car'], right: ['Role'] });
    return lookup;
}

/**
 * The L-proxy backend, which production reads with (irReadCtx.ts `IR_READ_BACKEND`): an enum slot's
 * value is the literal's proxy, whose string is its name (`joiner/classes.ts` get_toString; measured on
 * the lane probe). The draw backend returns the literal's pointer instead.
 */
function lproxyLike(lookup: Lookup): ReadCtx {
    const draw = makeDrawReadCtx(lookup);
    return { ...draw, getValue: (id, f) => { const v = draw.getValue(id, f); return typeof v === 'string' && lookup[v]?.className === 'DEnumLiteral' ? lookup[v].name : v; } };
}

function indexOf(lookup: Lookup, views: AnyDerivedView[], tag: string) {
    const ids = views.map((_, i) => `${tag}_V${i}`);
    views.forEach((v, i) => { lookup[ids[i]] = { id: ids[i], viewpoint: `${tag}_VP`, ir: v.ir }; });
    return getIRIndex({ viewpoint: `${tag}_VP`, viewelements: ids, idlookup: lookup }, `${tag}_${Math.random()}`)!;
}

describe('ER (Chen) resolved on the People model', () => {
    const mm = ERDL();
    const lookup = people(mm);
    const index = indexOf(lookup, chen(mm), 'people');
    const ctx = lproxyLike(lookup);
    /** The end label on the reference `refName` of the relationship `id`, as irEdgeViews resolves it. */
    const endOf = (id: string, refName: string) => {
        const cv = resolveEdgeView(id, mm.classId('Relationship'), refName, index, ctx, lookup);
        return cv ? (cv.targetEndText ? String(cv.targetEndText(ctx, id) ?? '') : null) : 'unstyled';
    };

    it('hasRole (OneToMany) reads 1 : N, shares (ManyToMany) N : M, ManyToOne N : 1, OneToOne 1 : 1, unset nothing', () => {
        expect([endOf('hasRole', 'left'), endOf('hasRole', 'right')]).toEqual(['1', 'N']);
        expect([endOf('shares', 'left'), endOf('shares', 'right')]).toEqual(['N', 'M']);
        expect([endOf('r_ManyToOne', 'left'), endOf('r_ManyToOne', 'right')]).toEqual(['N', '1']);
        expect([endOf('r_OneToOne', 'left'), endOf('r_OneToOne', 'right')]).toEqual(['1', '1']);
        expect([endOf('r_unset', 'left'), endOf('r_unset', 'right')]).toEqual([null, null]);
    });

    it('every line is a plain line, whatever the mark: no termination at either end', () => {
        for (const id of ['hasRole', 'shares', 'r_unset']) {
            for (const r of ['left', 'right']) {
                const cv = resolveEdgeView(id, mm.classId('Relationship'), r, index, ctx, lookup)!;
                expect(cv.terminations, `${id}.${r}`).toEqual({ sourceEnd: 'none', targetEnd: 'none' });
                expect(cv.curve).toBe('arc');
            }
        }
        const owned = resolveEdgeView('Person', mm.classId('Entity'), 'ownedAttributes', index, ctx, lookup)!;
        expect(owned.terminations).toEqual({ sourceEnd: 'none', targetEnd: 'none' });
    });

    it('the key attributes (id2, id3) are underlined, the others are not', () => {
        const underlined = (id: string) => {
            const cv = resolveIRView(id, mm.classId('Attribute'), index, ctx, lookup)!;
            return resolveTextStyle(cv.labels[0].style, ctx, id)?.textDecoration === 'underline';
        };
        expect(['name', 'surname', 'age', 'id2', 'name2', 'id3', 'manufacturer'].filter(underlined)).toEqual(['id2', 'id3']);
    });
});

describe('ER (Chen) on the MDE ERD exports — the attributes are contained rows', () => {
    for (const [name, make] of [['MDE ERD (1)', MDE_ERD_1], ['MDE ERD', MDE_ERD]] as const) {
        it(`${name}: Attribute keeps its C row; Entity is the rectangle with C's rows, its name on top`, () => {
            const mm = make();
            const views = chen(mm);
            const generic = deriveGenericViewpointIRs(mm.lookup, mm.id);
            for (const v of views) expect(validateIR(`chen:${v.className}`, v.ir), v.className).toEqual({ ok: true });
            const cRow = generic.find(v => v.className === 'Attribute')!;
            expect(bare(docsOf(views, 'Attribute')[0])).toEqual(cRow.ir);
            const [entity, ...entityLines] = docsOf(views, 'Entity');
            const cEntity = generic.find(v => v.className === 'Entity')!.ir as any;
            expect(entity.shape).toEqual({
                form: 'rect', fill: SURFACE, border: INK_BORDER,
                labels: [{ position: 'top', source: NAME, style: { fontSize: 14, fontWeight: 'semibold', color: INK } }],
            });
            expect(entity.fieldCompartments).toEqual(cEntity.fieldCompartments);
            // A row draws no line: the entity has none.
            expect(entityLines).toEqual([]);
            // The relation: a diamond, its two lines, no mark (no cardinality in this metamodel).
            const rel = docsOf(views, 'Relation');
            expect(rel.map(d => [d.kind, d.shape?.form ?? d.reference])).toEqual([['vertex', 'diamond'], ['edge', 'left'], ['edge', 'right']]);
            expect(rel.filter(d => d.kind === 'edge').every(d => d.edge.labels === undefined)).toBe(true);
        });
    }
});

describe('ER (Chen) — the table decides', () => {
    it('a class with no role keeps its Generic document', () => {
        const mm = ERDL();
        const roles = { [mm.classId('Entity')]: 'entity', [mm.classId('Relationship')]: 'relationship' } as ClassRoles;
        const views = chen(mm, roles);
        const generic = deriveGenericViewpointIRs(mm.lookup, mm.id);
        expect(bare(docsOf(views, 'Attribute')[0])).toEqual(generic.find(v => v.className === 'Attribute')!.ir);
        expect(docsOf(views, 'Attribute')[0].generated.role).toBeUndefined();
        // No attribute node class: the entity draws no line to it.
        expect(docsOf(views, 'Entity').filter(d => d.kind === 'edge')).toEqual([]);
    });

    it('with the relationship unbound it is Generic\'s edge again', () => {
        const mm = ERDL();
        const roles = { [mm.classId('Entity')]: 'entity' } as ClassRoles;
        const rel = docsOf(chen(mm, roles), 'Relationship');
        expect(rel.length).toBe(1);
        expect(bare(rel[0])).toEqual(deriveGenericViewpointIRs(mm.lookup, mm.id).find(v => v.className === 'Relationship')!.ir);
    });

    it('a role on the abstract class reaches its subclasses (rolesFromTable)', () => {
        const mm = ERDL();
        const roles = { [mm.classId('NamedElement')]: 'entity' } as ClassRoles;
        const views = chen(mm, roles);
        expect(docsOf(views, 'Relationship')[0].shape.form).toBe('rect');
        expect(docsOf(views, 'Attribute')[0].shape.form).toBe('rect');
    });

    it('the key flag is a boolean: an identifier string is not one', () => {
        const mm = metamodel('KF', 'KeyFlag', [
            cls('Entity', { attrs: [attr('name', ESTRING)], refs: [ref('attrs', 'Attribute', { upper: -1 })] }),
            cls('Attribute', { attrs: [attr('name', ESTRING), attr('idCode', ESTRING), attr('type', ESTRING)] }),
        ]);
        expect('underline' in docsOf(chen(mm), 'Attribute')[0].shape.labels[0].style).toBe(false);
    });

    it('a Key class is an ellipse always underlined', () => {
        const mm = metamodel('KEY', 'Keys', [
            cls('Entity', { attrs: [attr('name', ESTRING)], refs: [ref('attrs', 'Attribute', { upper: -1 })] }),
            cls('Attribute', { attrs: [attr('name', ESTRING), attr('type', ESTRING)] }),
            cls('KeyAttribute', { supers: ['Attribute'] }),
        ]);
        const views = chen(mm);
        expect(docsOf(views, 'KeyAttribute')[0].shape.labels[0].style).toEqual({ fontSize: 13, fontWeight: 'medium', color: INK, underline: true });
        // No key flag on Attribute: not underlined.
        expect('underline' in docsOf(views, 'Attribute')[0].shape.labels[0].style).toBe(false);
        // The entity's line to its attributes.
        expect(docsOf(views, 'Entity').filter(d => d.kind === 'edge').map(d => d.reference)).toEqual(['attrs']);
    });
});

describe('ER (Chen) — the ends of a relationship, ordered as the derivation orders them', () => {
    it('declared `to` then `from`: `from` is the first side of the literal', () => {
        const mm = metamodel('ORD', 'Ordered', [
            cls('Entity', { attrs: [attr('name', ESTRING)], refs: [ref('attributes', 'Attribute', { composition: true, upper: -1 })] }),
            cls('Attribute', { attrs: [attr('name', ESTRING), attr('type', ESTRING)] }),
            cls('Relationship', { attrs: [attr('name', ESTRING), attr('card', 'ORD.Card')], refs: [ref('to', 'Entity'), ref('from', 'Entity')] }),
        ], { Card: ['OneToMany'] });
        const marks = docsOf(chen(mm), 'Relationship').filter(d => d.predicate).map(d => [d.reference, d.edge.labels.targetEnd.text]);
        expect(marks).toEqual([['to', 'N'], ['from', '1']]);
    });
});

describe('ER (Chen) — the cardinality from a max / upper slot per end', () => {
    const mm = metamodel('MAX', 'Maxes', [
        cls('Entity', { attrs: [attr('name', ESTRING)], refs: [ref('attributes', 'Attribute', { composition: true, upper: -1 })] }),
        cls('Attribute', { attrs: [attr('name', ESTRING), attr('type', ESTRING)] }),
        cls('Relationship', { attrs: [attr('name', ESTRING), attr('leftMax', EINT), attr('rightUpper', EINT)], refs: [ref('left', 'Entity'), ref('right', 'Entity')] }),
    ]);
    const views = chen(mm);

    it('each end reads its own slot: 1 stays 1, anything else N, the second many-side M', () => {
        const lookup: Lookup = { ...mm.lookup };
        const rel = (id: string, l: unknown[], r: unknown[]) => {
            lookup[id] = { id, className: 'DObject', name: id, instanceof: mm.classId('Relationship'), features: [`${id}.l`, `${id}.r`] };
            lookup[`${id}.l`] = { id: `${id}.l`, className: 'DValue', instanceof: `${mm.classId('Relationship')}.leftMax`, values: l };
            lookup[`${id}.r`] = { id: `${id}.r`, className: 'DValue', instanceof: `${mm.classId('Relationship')}.rightUpper`, values: r };
        };
        rel('a', [1], [1]); rel('b', [1], [-1]); rel('c', [-1], [-1]); rel('d', [5], [1]); rel('e', [], [-1]); rel('f', [], []);
        const index = indexOf(lookup, views, 'max');
        const ctx = makeDrawReadCtx(lookup);
        const end = (id: string, r: string) => {
            const cv = resolveEdgeView(id, mm.classId('Relationship'), r, index, ctx, lookup)!;
            return cv.targetEndText ? String(cv.targetEndText(ctx, id)) : null;
        };
        expect(['a', 'b', 'c', 'd', 'e', 'f'].map(id => `${end(id, 'left')}:${end(id, 'right')}`)).toEqual(['1:1', '1:N', 'N:M', 'N:1', 'null:N', 'null:null']);
    });

    it('every document passes the validator', () => {
        for (const v of views) expect(validateIR(`max:${v.className}`, v.ir), `${v.className} ${v.ir.label}`).toEqual({ ok: true });
    });
});
