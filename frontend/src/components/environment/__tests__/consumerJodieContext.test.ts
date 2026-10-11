import { beforeEach, describe, expect, it } from 'vitest';
import { backOf, drillInto, navFor, truncateTo } from '../../../jjform/nav';
import {
    consumerFocusOf,
    consumerModelId,
    consumerSelectionLine,
    consumerSelectionOf,
    describeConsumerSelection,
    filterContextForProfile,
    getConsumerSelection,
    resolveConsumerArtifact,
    selectionNotice,
    setConsumerSelection,
    withConsumerSelection,
} from '../consumerJodieContext';

// #168 lane A (J1, J2). A plain idlookup and an envelope in the shape `getContextJSON` sends
// (measured on 2026-10-01, docs/discovery/discovery_2026-10-01_168_a_context.md §4.4): classes by
// name, objects and `$ref` by id. ScenarioMM: Scenario ◇pathway→ Phase, Phase learners→ Learner,
// Scenario guard→ Vault, Vault ◇gems→ Learner, Mentor extends Vault. Profile Edu: Vault hidden,
// Learner read.
function fixture() {
    const idlookup: Record<string, any> = {
        proj: { id: 'proj', className: 'DProject' },
        mm1: { id: 'mm1', className: 'DModel', name: 'ScenarioMM', father: 'proj', isMetamodel: true },
        pkg1: { id: 'pkg1', className: 'DPackage', name: 'default', father: 'mm1' },
        cScen: { id: 'cScen', className: 'DClass', name: 'Scenario', father: 'pkg1' },
        cPhase: { id: 'cPhase', className: 'DClass', name: 'Phase', father: 'pkg1' },
        cLearner: { id: 'cLearner', className: 'DClass', name: 'Learner', father: 'pkg1' },
        cVault: { id: 'cVault', className: 'DClass', name: 'Vault', father: 'pkg1' },
        cMentor: { id: 'cMentor', className: 'DClass', name: 'Mentor', father: 'pkg1' },
        cBase: { id: 'cBase', className: 'DClass', name: 'Base', father: 'pkg1' },
        mA: { id: 'mA', className: 'DModel', name: 'scen_a', father: 'proj', instanceof: 'mm1' },
        mB: { id: 'mB', className: 'DModel', name: 'scen_b', father: 'proj', instanceof: 'mm1' },
        oScen: { id: 'oScen', className: 'DObject', name: 'Scenario_0', instanceof: 'cScen', father: 'mA' },
        vPath: { id: 'vPath', className: 'DValue', father: 'oScen' },
        oPhase: { id: 'oPhase', className: 'DObject', name: 'Phase_0', instanceof: 'cPhase', father: 'vPath' },
        oAnt: { id: 'oAnt', className: 'DObject', name: 'Antonio', instanceof: 'cLearner', father: 'mA' },
        oVault: { id: 'oVault', className: 'DObject', name: 'vault_alpha', instanceof: 'cVault', father: 'mA' },
        vGems: { id: 'vGems', className: 'DValue', father: 'oVault' },
        oGem: { id: 'oGem', className: 'DObject', name: 'Gem_0', instanceof: 'cLearner', father: 'vGems' },
        oArco: { id: 'oArco', className: 'DObject', name: 'Arco_0', instanceof: 'cScen', father: 'mB' },
        prof: { id: 'prof', className: 'DProfile', name: 'Edu', typePermissions: { cVault: 'hidden', cLearner: 'read' } },
    };
    const ref = (name: string) => ({ name, package: 'default' });
    const packages = [{
        name: 'default',
        classes: [
            { name: 'Scenario', references: [
                { name: 'pathway', type: ref('Phase'), containment: true, upperBound: -1 },
                { name: 'guard', type: ref('Vault') },
            ] },
            { name: 'Phase', references: [{ name: 'learners', type: ref('Learner'), upperBound: -1 }] },
            { name: 'Learner' },
            { name: 'Vault', references: [{ name: 'gems', type: ref('Learner'), containment: true, upperBound: -1 }] },
            { name: 'Mentor', superTypes: [ref('Vault')] },
            { name: 'Base', abstract: true },
        ],
    }];
    const modelEnvelope = {
        currentlyEditing: { name: 'scen_a', level: 'M1 model' },
        model: {
            format: 'jjodel-model',
            metadata: { name: 'scen_a', id: 'mA' },
            metamodel: { id: 'mm1', name: 'ScenarioMM', nsURI: '', packages },
            objects: [
                {
                    id: 'oScen', class: ref('Scenario'), name: 'Scenario_0',
                    references: { guard: [{ $ref: 'oVault' }] },
                    children: { pathway: [{ id: 'oPhase', class: ref('Phase'), name: 'Phase_0', references: { learners: [{ $ref: 'oAnt' }] } }] },
                },
                { id: 'oAnt', class: ref('Learner'), name: 'Antonio' },
                { id: 'oVault', class: ref('Vault'), name: 'vault_alpha', children: { gems: [{ id: 'oGem', class: ref('Learner'), name: 'Gem_0' }] } },
            ],
        },
        conformance: {
            status: 'errors',
            violations: [
                { objectId: 'oVault', objectName: 'vault_alpha', violationType: 'missing_name', severity: 'error', message: 'Object "vault_alpha" has no usable name' },
                { objectId: 'oScen', objectName: 'Scenario_0', violationType: 'reference_target_type_mismatch', severity: 'error', message: 'Object "Scenario_0": reference "guard" points to "x" of type "Phase" but expected kind of "Vault"' },
                { objectId: 'oAnt', objectName: 'Antonio', violationType: 'missing_required_attr', severity: 'warning', message: 'Object "Antonio" is missing required attribute "age"' },
            ],
        },
    };
    const metamodelsEnvelope = { metamodels: [{ format: 'jjodel-metamodel', metadata: { name: 'ScenarioMM' }, packages }] };
    return { idlookup, profile: idlookup.prof, modelEnvelope, metamodelsEnvelope };
}

const HIDDEN = ['Vault', 'vault_alpha', 'oVault', 'cVault'];

describe('filterContextForProfile (J2)', () => {
    it('a hidden type appears nowhere in the serialized JSON, by name or by id (model branch)', () => {
        const { idlookup, profile, modelEnvelope } = fixture();
        const before = JSON.stringify(modelEnvelope);
        // Positive control: the subject is there before the filter.
        for (const token of HIDDEN.slice(0, 3)) expect(before).toContain(token);
        const after = JSON.stringify(filterContextForProfile(modelEnvelope, idlookup, profile));
        for (const token of HIDDEN) expect(after).not.toContain(token);
        for (const kept of ['Scenario_0', 'Phase_0', 'Antonio', 'Mentor', 'pathway', 'learners']) expect(after).toContain(kept);
    });

    it('drops the $ref to a hidden instance and the reference declared with a hidden type', () => {
        const { idlookup, profile, modelEnvelope } = fixture();
        const out = filterContextForProfile(modelEnvelope, idlookup, profile);
        const scenario = out.model.objects.find((o: any) => o.id === 'oScen');
        expect(scenario.references).toBeUndefined();
        expect(scenario.children.pathway[0].references.learners).toEqual([{ $ref: 'oAnt' }]);
        const scenarioClass = out.model.metamodel.packages[0].classes.find((c: any) => c.name === 'Scenario');
        expect(scenarioClass.references.map((r: any) => r.name)).toEqual(['pathway']);
    });

    it('lifts the visible children of a hidden instance into objects, with no container', () => {
        const { idlookup, profile, modelEnvelope } = fixture();
        const out = filterContextForProfile(modelEnvelope, idlookup, profile);
        expect(out.model.objects.map((o: any) => o.name)).toEqual(['Scenario_0', 'Antonio', 'Gem_0']);
    });

    it('drops a hidden supertype from superTypes', () => {
        const { idlookup, profile, modelEnvelope } = fixture();
        const out = filterContextForProfile(modelEnvelope, idlookup, profile);
        const mentor = out.model.metamodel.packages[0].classes.find((c: any) => c.name === 'Mentor');
        expect(mentor).toEqual({ name: 'Mentor' });
    });

    it('marks the read types, and lists them apart from the editable ones', () => {
        const { idlookup, profile, modelEnvelope } = fixture();
        const out = filterContextForProfile(modelEnvelope, idlookup, profile);
        const learner = out.model.metamodel.packages[0].classes.find((c: any) => c.name === 'Learner');
        expect(learner.readOnly).toBe(true);
        const scenario = out.model.metamodel.packages[0].classes.find((c: any) => c.name === 'Scenario');
        expect(scenario.readOnly).toBeUndefined();
        expect(out.environment).toEqual({ profile: 'Edu', editableTypes: ['Scenario', 'Phase', 'Mentor'], readOnlyTypes: ['Learner'] });
    });

    it('drops the violations that name a hidden instance or type, and the status follows', () => {
        const { idlookup, profile, modelEnvelope } = fixture();
        const out = filterContextForProfile(modelEnvelope, idlookup, profile);
        expect(out.conformance.violations.map((v: any) => v.objectName)).toEqual(['Antonio']);
        expect(out.conformance.status).toBe('warnings');
    });

    it('filters the metamodels branch too (no selection)', () => {
        const { idlookup, profile, metamodelsEnvelope } = fixture();
        expect(JSON.stringify(metamodelsEnvelope)).toContain('Vault');
        const out = filterContextForProfile(metamodelsEnvelope, idlookup, profile);
        expect(JSON.stringify(out)).not.toContain('Vault');
        expect(out.metamodels[0].packages[0].classes.map((c: any) => c.name)).toEqual(['Scenario', 'Phase', 'Learner', 'Mentor', 'Base']);
    });

    it('without a profile the envelope is unchanged', () => {
        const { idlookup, modelEnvelope } = fixture();
        const snapshot = JSON.stringify(modelEnvelope);
        expect(filterContextForProfile(modelEnvelope, idlookup, null)).toBe(modelEnvelope);
        expect(filterContextForProfile(modelEnvelope, idlookup, undefined)).toBe(modelEnvelope);
        expect(JSON.stringify(modelEnvelope)).toBe(snapshot);
    });

    it('never mutates its input', () => {
        const { idlookup, profile, modelEnvelope } = fixture();
        const snapshot = JSON.stringify(modelEnvelope);
        filterContextForProfile(modelEnvelope, idlookup, profile);
        expect(JSON.stringify(modelEnvelope)).toBe(snapshot);
    });

    it('a class named like the validator\'s own words hides only its quoted mentions', () => {
        const { idlookup, modelEnvelope } = fixture();
        idlookup.cObject = { id: 'cObject', className: 'DClass', name: 'Object', father: 'pkg1' };
        const profile = { name: 'P', typePermissions: { cObject: 'hidden' } };
        const out = filterContextForProfile(modelEnvelope, idlookup, profile);
        expect(out.conformance.violations).toHaveLength(3);
    });
});

describe('the selection (J1)', () => {
    beforeEach(() => setConsumerSelection(null));

    it('the instance\'s model wins over the type\'s first model', () => {
        const { idlookup } = fixture();
        const models = ['mA', 'mB'];
        expect(consumerModelId(idlookup, models, 'cScen', 'oArco')).toBe('mB');
        expect(consumerModelId(idlookup, models, 'cScen', null)).toBe('mA');
        expect(resolveConsumerArtifact({ typeId: 'cScen', instanceId: 'oArco', modelId: null }, idlookup, models))
            .toEqual({ id: 'mB', name: 'scen_b', level: 'M1', metamodelId: 'mm1' });
    });

    it('a contained instance resolves to its model through the father chain', () => {
        const { idlookup } = fixture();
        expect(consumerModelId(idlookup, ['mB', 'mA'], 'cPhase', 'oPhase')).toBe('mA');
    });

    it('no selection, or a type without a model, resolves no artefact', () => {
        const { idlookup } = fixture();
        expect(resolveConsumerArtifact(null, idlookup, ['mA'])).toBeUndefined();
        expect(resolveConsumerArtifact({ typeId: 'cScen', instanceId: null, modelId: null }, idlookup, [])).toBeUndefined();
    });

    it('an instance of another type is dropped from the published selection', () => {
        const { idlookup } = fixture();
        expect(consumerSelectionOf(idlookup, ['mA', 'mB'], 'cLearner', 'oArco'))
            .toEqual({ typeId: 'cLearner', instanceId: null, modelId: 'mA' });
        expect(consumerSelectionOf(idlookup, ['mA', 'mB'], 'cScen', 'oArco'))
            .toEqual({ typeId: 'cScen', instanceId: 'oArco', modelId: 'mB' });
    });

    it('keeps the last selection written, and forgets it on null', () => {
        expect(getConsumerSelection()).toBeNull();
        setConsumerSelection({ typeId: 'cScen', instanceId: 'oArco', modelId: 'mB' });
        expect(getConsumerSelection()).toEqual({ typeId: 'cScen', instanceId: 'oArco', modelId: 'mB' });
        setConsumerSelection(null);
        expect(getConsumerSelection()).toBeNull();
    });

    it('says the selection without jargon', () => {
        const { idlookup } = fixture();
        const withInstance = describeConsumerSelection({ typeId: 'cScen', instanceId: 'oArco', modelId: 'mB' }, idlookup)!;
        expect(selectionNotice(withInstance)).toBe('Now looking at: Scenario «Arco_0»');
        const typeOnly = describeConsumerSelection({ typeId: 'cLearner', instanceId: null, modelId: 'mA' }, idlookup)!;
        expect(selectionNotice(typeOnly)).toBe('Now looking at: Learner');
        expect(withInstance.key).not.toBe(typeOnly.key);
    });

    it('a selection made with an empty chat is not said, and stays due for when the chat is open', () => {
        const { idlookup } = fixture();
        const antonio = describeConsumerSelection({ typeId: 'cLearner', instanceId: 'oAnt', modelId: 'mA' }, idlookup);
        // Empty chat: no line, and the caller keeps its last-said key (it moves only on a write).
        expect(consumerSelectionLine(antonio, undefined, 0)).toBeNull();
        // The same selection, once a conversation exists: due, since it was never said.
        expect(consumerSelectionLine(antonio, undefined, 1)).toBe('Now looking at: Learner «Antonio»');
    });

    it('the selection last said is not said again', () => {
        const { idlookup } = fixture();
        const antonio = describeConsumerSelection({ typeId: 'cLearner', instanceId: 'oAnt', modelId: 'mA' }, idlookup)!;
        const learner = describeConsumerSelection({ typeId: 'cLearner', instanceId: null, modelId: 'mA' }, idlookup)!;
        expect(consumerSelectionLine(antonio, antonio.key, 3)).toBeNull();
        expect(consumerSelectionLine(learner, antonio.key, 3)).toBe('Now looking at: Learner');
        expect(consumerSelectionLine(null, undefined, 3)).toBeNull();
    });

    it('puts the selection in currentlyEditing, and the profile filters it like the rest', () => {
        const { idlookup, profile, modelEnvelope } = fixture();
        const selected = withConsumerSelection(modelEnvelope, idlookup, { typeId: 'cScen', instanceId: 'oScen', modelId: 'mA' });
        expect(selected.currentlyEditing).toEqual({ name: 'scen_a', level: 'M1 model', type: 'Scenario', instance: { id: 'oScen', name: 'Scenario_0' } });
        const hidden = withConsumerSelection(modelEnvelope, idlookup, { typeId: 'cVault', instanceId: 'oVault', modelId: 'mA' });
        expect(filterContextForProfile(hidden, idlookup, profile).currentlyEditing).toEqual({ name: 'scen_a', level: 'M1 model' });
    });
});

describe('the focus inside the detail (J1, drill-in)', () => {
    // The steps InstanceDetail puts on the road (`navStepOf`): id, name, class name, slot.
    const step = (id: string, name: string, cls: string, childKey: string | null = null) => ({ id, name, cls, childKey });
    const scenario = step('oScen', 'Scenario_0', 'Scenario');
    const phase = step('oPhase', 'Phase_0', 'Phase', 'pathway');
    const antonio = step('oAnt', 'Antonio', 'Learner', 'learners');

    it('without a navigation the focus is the selected row', () => {
        const { idlookup, profile } = fixture();
        expect(consumerFocusOf(idlookup, profile, 'cScen', 'oScen', null)).toEqual({ typeId: 'cScen', instanceId: 'oScen' });
        expect(consumerFocusOf(idlookup, profile, 'cScen', null, null)).toEqual({ typeId: 'cScen', instanceId: null });
    });

    it('a drill into a contained child focuses the child, with its own exact type', () => {
        const { idlookup, profile } = fixture();
        const nav = drillInto(navFor(scenario), phase);
        expect(consumerFocusOf(idlookup, profile, 'cScen', 'oScen', nav)).toEqual({ typeId: 'cPhase', instanceId: 'oPhase' });
    });

    it('a drill through a reference focuses the referenced element', () => {
        const { idlookup, profile } = fixture();
        // Juri's road: Antonio opened from the learners of the Phase_0 shown inline (pass-through).
        const nav = drillInto(drillInto(navFor(scenario), { ...phase, passThrough: true }), antonio);
        expect(consumerFocusOf(idlookup, profile, 'cScen', 'oScen', nav)).toEqual({ typeId: 'cLearner', instanceId: 'oAnt' });
    });

    it('Back and a click on the breadcrumb move the focus with the road', () => {
        const { idlookup, profile } = fixture();
        const deep = drillInto(drillInto(navFor(scenario), phase), antonio);
        expect(consumerFocusOf(idlookup, profile, 'cScen', 'oScen', backOf(deep)).instanceId).toBe('oPhase');
        expect(consumerFocusOf(idlookup, profile, 'cScen', 'oScen', backOf(backOf(deep))).instanceId).toBe('oScen');
        expect(consumerFocusOf(idlookup, profile, 'cScen', 'oScen', truncateTo(deep, 1)).instanceId).toBe('oPhase');
        expect(consumerFocusOf(idlookup, profile, 'cScen', 'oScen', truncateTo(deep, 0)).instanceId).toBe('oScen');
    });

    it('a step of a hidden type is never the focus: the nearest visible step above it is', () => {
        const { idlookup, profile } = fixture();
        const vault = step('oVault', 'vault_alpha', 'Vault', 'guard');
        expect(consumerFocusOf(idlookup, profile, 'cScen', 'oScen', drillInto(navFor(scenario), vault)))
            .toEqual({ typeId: 'cScen', instanceId: 'oScen' });
        expect(consumerFocusOf(idlookup, profile, 'cScen', 'oScen', drillInto(drillInto(navFor(scenario), phase), vault)))
            .toEqual({ typeId: 'cPhase', instanceId: 'oPhase' });
        // Per contrasto: without a profile nothing is hidden, and the vault is the focus.
        expect(consumerFocusOf(idlookup, null, 'cScen', 'oScen', drillInto(navFor(scenario), vault)).instanceId).toBe('oVault');
    });

    it('ignores the stale states of one commit: another type, a road rooted elsewhere', () => {
        const { idlookup, profile } = fixture();
        const deep = drillInto(navFor(scenario), phase);
        // The type changed, the row and its road are the old type's.
        expect(consumerFocusOf(idlookup, profile, 'cLearner', 'oScen', deep)).toEqual({ typeId: 'cLearner', instanceId: null });
        // Another row of the same type, the road still the previous row's.
        expect(consumerFocusOf(idlookup, profile, 'cScen', 'oArco', deep)).toEqual({ typeId: 'cScen', instanceId: 'oArco' });
    });

    it('the focus resolves to the element\'s model and says itself like a row', () => {
        const { idlookup, profile } = fixture();
        const focus = consumerFocusOf(idlookup, profile, 'cScen', 'oScen', drillInto(drillInto(navFor(scenario), phase), antonio));
        const selection = consumerSelectionOf(idlookup, ['mB', 'mA'], focus.typeId, focus.instanceId);
        expect(selection).toEqual({ typeId: 'cLearner', instanceId: 'oAnt', modelId: 'mA' });
        expect(selectionNotice(describeConsumerSelection(selection, idlookup)!)).toBe('Now looking at: Learner «Antonio»');
    });
});
