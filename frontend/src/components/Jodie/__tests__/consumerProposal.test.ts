import { beforeEach, describe, expect, it } from 'vitest';
import {
    configuratorTargetOf,
    failureText,
    featureLabel,
    GENERIC_FAILURE_TEXT,
    HOST_REFUSAL_TEXT,
    NOT_APPLIED_TEXT,
    proposalFocus,
    proposalLines,
    proposalOutcome,
    readProposal,
    resetProposals,
    rootIdOf,
    runProposal,
    setProposalOutcome,
    subscribeProposals,
} from '../consumerProposalModel';
import type { ProposalClass, ProposalOutcome, ProposalResult, ProposalStep, ProposalWorld } from '../consumerProposalModel';

// #168 lane C2 (J4). A world in the shape the adapter of `ConsumerProposal.tsx` builds from the
// store, on lane A's fixture plus what the checks need: Scenario ◇pathway→ Phase, Scenario
// ◇notes→ Note, Scenario lead→ Learner [0..1], Archive ◇phases→ Phase (Archive is read-only),
// SubPhase extends Phase. Phase, SubPhase and Note cannot sit at the root. Learner is read-only.
function cls(name: string, over: Partial<ProposalClass> = {}): ProposalClass {
    return { name, rootable: true, editable: true, kinds: [name], attributes: [], references: [], ...over };
}

function world(): ProposalWorld {
    return {
        classes: {
            Scenario: cls('Scenario', {
                attributes: ['title', 'maxSeats', 'is_open'],
                references: [
                    { name: 'pathway', containment: true, upper: -1, type: 'Phase' },
                    { name: 'notes', containment: true, upper: -1, type: 'Note' },
                    { name: 'lead', containment: false, upper: 1, type: 'Learner' },
                ],
            }),
            Phase: cls('Phase', { rootable: false, references: [{ name: 'learners', containment: false, upper: -1, type: 'Learner' }] }),
            SubPhase: cls('SubPhase', { rootable: false, kinds: ['SubPhase', 'Phase'] }),
            Note: cls('Note', { rootable: false }),
            Learner: cls('Learner', { editable: false }),
            Archive: cls('Archive', { editable: false, references: [{ name: 'phases', containment: true, upper: -1, type: 'Phase' }] }),
        },
        elements: {
            Scenario_0: [{ id: 'oScen', className: 'Scenario', root: true }],
            Phase_0: [{ id: 'oPhase', className: 'Phase', root: false }],
            Antonio: [{ id: 'oAnt', className: 'Learner', root: true }],
            arch: [{ id: 'oArch', className: 'Archive', root: true }],
            dup: [{ id: 'd1', className: 'Scenario', root: true }, { id: 'd2', className: 'Scenario', root: true }],
        },
    };
}

const read = (code: string) => readProposal(code, world());
const texts = (code: string) => read(code).steps.map((s) => s.text);
const ok = (): ProposalResult => ({ success: true, message: 'done' });
const err = (code: string, message = ''): ProposalResult => ({ success: false, message, errors: [{ code, message }] });

beforeEach(() => { resetProposals(); });

describe('proposalLines', () => {
    it('keeps the lines ScriptBlock runs: no blank line, no comment, no target line', () => {
        expect(proposalLines('  create instance of Scenario "s"\n\n// note\n# note\ntarget ScenarioMM\nset s.title = "x"  '))
            .toEqual(['create instance of Scenario "s"', 'set s.title = "x"']);
    });
});

describe('readProposal: each step in plain words', () => {
    it('describes a create with and without a name', () => {
        expect(texts('create instance of Scenario "s9"\ncreate instance of Scenario'))
            .toEqual(['Create Scenario "s9"', 'Create a new Scenario']);
    });

    it('describes an attribute by its label and its value', () => {
        expect(texts('set Scenario_0.title = "Teamwork"\nset Scenario_0.maxSeats = 12\nset Scenario_0.is_open = true'))
            .toEqual(['Set Title of Scenario_0 to "Teamwork"', 'Set Max seats of Scenario_0 to 12', 'Set Is open of Scenario_0 to yes']);
    });

    it('keeps a name written into an attribute an attribute, as the executor classifies it', () => {
        const step = read('set Scenario_0.title = Kind.Big').steps[0];
        expect([step.kind, step.text]).toEqual(['attribute', 'Set Title of Scenario_0 to Kind.Big']);
    });

    it('describes a null as clearing, for an attribute and for a reference', () => {
        const r = read('set Scenario_0.title = null\nset Scenario_0.lead = null');
        expect(r.steps.map((s) => [s.kind, s.text])).toEqual([['clear', 'Clear Title of Scenario_0'], ['clear', 'Clear Lead of Scenario_0']]);
    });

    it('tells a link from a containment by the owner\'s reference', () => {
        const r = read('create instance of Phase "ph1"\nset Scenario_0.pathway = ph1\nset Scenario_0.lead = Antonio');
        expect(r.steps.map((s) => [s.kind, s.text])).toEqual([
            ['create', 'Create Phase "ph1"'],
            ['contain', 'Put ph1 inside Scenario_0'],
            ['link', 'Link Scenario_0 to Antonio (Lead)'],
        ]);
    });

    it('reads a quoted name on a reference as the element it names, as the executor does', () => {
        const step = read('set Scenario_0.lead = "Antonio"').steps[0];
        expect([step.kind, step.value, step.text]).toEqual(['link', 'Antonio', 'Link Scenario_0 to Antonio (Lead)']);
    });

    it('finds the type of an element created earlier in the same proposal', () => {
        const step = read('create instance of Scenario "s9"\ncreate instance of Phase "p"\nset s9.pathway = p').steps[2];
        expect(step.kind).toBe('contain');
    });

    it('describes rename and delete', () => {
        expect(texts('rename instance Antonio to Toni\ndelete instance Scenario_0\ndelete Antonio'))
            .toEqual(['Rename Antonio to "Toni"', 'Delete Scenario_0', 'Delete Antonio']);
    });

    it('labels features in plain case', () => {
        expect([featureLabel('firstName'), featureLabel('first_name'), featureLabel('title')]).toEqual(['First name', 'First name', 'Title']);
    });

    it('never uses the developer vocabulary, in steps, refusals or failures', () => {
        const codes = [
            'create instance of Phase "ph9"',
            'create instance of Phase',
            'create class Foo',
            'create instance of Phase "p"\nset dup.pathway = p',
            'create instance of Phase "p"\nset Scenario_0.notes = p',
            'create instance of Phase "p"\nset arch.phases = p',
            'create instance of Scenario "s"\nset s.title = "x"\nset s.lead = Antonio\nrename instance s to t\ndelete t\nset Scenario_0.pathway = null',
            '@@@',
            '',
        ];
        const words: string[] = [];
        for (const c of codes) {
            const r = read(c);
            words.push(...r.steps.map((s) => s.text), r.blocked ?? '');
        }
        const step = read('set Scenario_0.title = "x"').steps[0];
        for (const code of ['PROFILE_UNRESOLVED', 'UNKNOWN_PROPERTY', 'TYPE_MISMATCH', 'ABSTRACT_CLASS', 'SINGLETON_CLASS', 'SINGLETON_INSTANCE', 'NAME_CONFLICT', 'HANDLE_IN_USE', 'NO_FEATURE_PROXY']) {
            words.push(failureText(step, err(code, "No instance named 'Phase_0' in 'scen_a'"), world()));
        }
        words.push(NOT_APPLIED_TEXT, HOST_REFUSAL_TEXT, GENERIC_FAILURE_TEXT);
        const jargon = words.filter((w) => /\b(M1|M2|metaclass|metamodel|instances?|jjscript)\b/i.test(w));
        expect(jargon).toEqual([]);
        expect(words.length).toBeGreaterThan(20);
    });
});

describe('readProposal: what cannot be applied', () => {
    it('refuses a line that does not parse', () => {
        expect(read('create instance of Scenario "s"\nset "my scenario".title = "x"').blocked).toMatch(/could not be read/);
    });

    it('refuses any step that is not a create, set, rename or delete of elements', () => {
        for (const c of ['create class Foo', 'list', 'do', 'delete class Scenario', 'forall x in Scenario do delete x']) {
            expect(read(c).blocked, c).toMatch(/can't be done here/);
        }
    });

    it('refuses an empty proposal', () => {
        expect(read('// nothing\n').blocked).toMatch(/no changes/);
    });

    it('lets a type that can sit at the root be created on its own', () => {
        expect(read('create instance of Scenario "s9"').blocked).toBeNull();
    });

    it('refuses a type that cannot sit at the root without the set that places it', () => {
        expect(read('create instance of Phase "ph9"').blocked).toBe('"ph9" (a new Phase) has to go inside another element, and this proposal doesn\'t say which one.');
    });

    it('accepts it with a later containment set on an owner the profile can change', () => {
        expect(read('create instance of Phase "ph1"\nset Scenario_0.pathway = ph1').blocked).toBeNull();
    });

    it('accepts an owner created earlier in the same proposal', () => {
        expect(read('create instance of Scenario "s9"\ncreate instance of Phase "p"\nset s9.pathway = p').blocked).toBeNull();
    });

    it('refuses the placing set when it comes before the create', () => {
        expect(read('set Scenario_0.pathway = ph1\ncreate instance of Phase "ph1"').blocked).toMatch(/doesn't say which one/);
    });

    it('refuses an owner that no single root element answers to', () => {
        for (const owner of ['nobody', 'dup', 'Phase_0']) {
            expect(read(`create instance of Phase "p"\nset ${owner}.pathway = p`).blocked, owner).toMatch(/no single element called/);
        }
    });

    it('refuses a slot that does not take the type', () => {
        expect(read('create instance of Phase "p"\nset Scenario_0.notes = p').blocked).toBe('A Scenario can\'t hold "p" (a new Phase) in Notes.');
    });

    it('accepts a subtype in a slot of its supertype', () => {
        expect(read('create instance of SubPhase "sp"\nset Scenario_0.pathway = sp').blocked).toBeNull();
    });

    it('refuses an owner whose type the profile does not let the user change', () => {
        expect(read('create instance of Phase "p"\nset arch.phases = p').blocked).toBe('"p" (a new Phase) would go inside "arch", but you can\'t change Archive elements here.');
    });

    it('does not count a plain link as placing the element', () => {
        expect(read('create instance of Phase "p"\nset Scenario_0.lead = p').blocked).toMatch(/doesn't say which one/);
    });

    it('refuses an unnamed create of a type that cannot sit at the root', () => {
        expect(read('create instance of Phase').blocked).toMatch(/^The new Phase has to go inside/);
    });

    it('leaves an unknown type to the run, which refuses it in its own words', () => {
        expect(read('create instance of Gizmo "g"').blocked).toBeNull();
    });
});

describe('failureText', () => {
    const step = read('set Scenario_0.title = "x"').steps[0];
    const w = world();

    it('passes the profile guard\'s own sentence through', () => {
        const s = "You can't create Learner elements in this environment.";
        expect(failureText(step, err('PROFILE_TYPE_LOCKED', s), w)).toBe(s);
        expect(failureText(step, err('PROFILE_HIDDEN_TARGET', "You can't link to Vault elements in this environment."), w)).toMatch(/^You can't link/);
    });

    it('names a missing element, read from the executor\'s sentence', () => {
        expect(failureText(step, err('PROFILE_UNRESOLVED', "No instance named 'zz' in 'scen_a'"), w)).toBe('There is no element called "zz".');
        expect(failureText(step, err('INSTANCE_NOT_FOUND', "No instance named 'zz' to link to"), w)).toBe('There is no element called "zz".');
    });

    it('says when the missing name is an element inside another one', () => {
        expect(failureText(step, err('PROFILE_UNRESOLVED', "No instance named 'Phase_0' in 'scen_a'"), w))
            .toBe('"Phase_0" is inside another element, and changes to it can\'t be made from here yet.');
    });

    it('names an ambiguous element and an unknown type', () => {
        expect(failureText(step, err('AMBIGUOUS_INSTANCE', "Ambiguous instance name 'dup': 2 candidates — Scenario (d1), Scenario (d2). Rename one."), w))
            .toBe('More than one element is called "dup", so it isn\'t clear which one is meant.');
        expect(failureText(step, err('PROFILE_UNRESOLVED', "Class 'Gizmo' not found in metamodel"), w)).toBe('"Gizmo" isn\'t a kind of element in this project.');
    });

    it('says the host refused when the result carries no error', () => {
        expect(failureText(step, { success: false, message: 'Jjodie answered with no metamodel or model in focus' }, w)).toBe(HOST_REFUSAL_TEXT);
    });

    it('has a sentence per code and never shows the technical text', () => {
        expect(failureText(step, err('UNKNOWN_PROPERTY', "'title' is neither an attribute nor a reference"), w)).toBe('Scenario_0 has nothing called "Title".');
        expect(failureText(step, err('TYPE_MISMATCH'), w)).toBe("Title of Scenario_0 can't take that value.");
        expect(failureText(step, err('NO_FEATURE_PROXY', 'Internal: $-proxy missing'), w)).toBe(GENERIC_FAILURE_TEXT);
        const create = read('create instance of Scenario "s"').steps[0];
        expect(failureText(create, err('SINGLETON_CLASS'), w)).toBe('There can be only one Scenario, and it already exists.');
        expect(failureText(create, err('HANDLE_IN_USE'), w)).toBe('This proposal creates two elements called "s".');
    });
});

describe('runProposal', () => {
    const exec = (results: ProposalResult[]) => {
        const calls: string[] = [];
        const fn = async (step: ProposalStep) => { calls.push(step.line); return results[calls.length - 1] ?? ok(); };
        return { calls, fn };
    };

    it('applies every step in order and ends applied', async () => {
        const r = read('create instance of Phase "ph1"\nset Scenario_0.pathway = ph1');
        const { calls, fn } = exec([ok(), ok()]);
        const seen: ProposalOutcome[] = [];
        const applied = await runProposal(r, fn, world(), (o) => seen.push(o));
        expect(calls).toEqual(['create instance of Phase "ph1"', 'set Scenario_0.pathway = ph1']);
        expect(applied).toEqual([true, true]);
        expect(seen[seen.length - 1]).toEqual({ phase: 'applied', steps: [
            { text: 'Create Phase "ph1"', status: 'applied' },
            { text: 'Put ph1 inside Scenario_0', status: 'applied' },
        ] });
        expect(seen[0].phase).toBe('applying');
    });

    it('stops at the first failure: the step says why, the rest are not applied', async () => {
        const r = read('create instance of Scenario "s"\ncreate instance of Learner "l"\nset s.lead = l');
        const { calls, fn } = exec([ok(), err('PROFILE_TYPE_LOCKED', "You can't create Learner elements in this environment."), ok()]);
        let last: ProposalOutcome | undefined;
        const applied = await runProposal(r, fn, world(), (o) => { last = o; });
        expect(calls.length).toBe(2);
        expect(applied).toEqual([true, false, false]);
        expect(last).toEqual({ phase: 'failed', steps: [
            { text: 'Create Scenario "s"', status: 'applied' },
            { text: 'Create Learner "l"', status: 'failed', reason: "You can't create Learner elements in this environment." },
            { text: 'Link s to l (Lead)', status: 'skipped', reason: NOT_APPLIED_TEXT },
        ] });
    });

    it('runs nothing when the proposal is blocked', async () => {
        const { calls, fn } = exec([]);
        const reports: ProposalOutcome[] = [];
        const applied = await runProposal(read('create instance of Phase "ph9"'), fn, world(), (o) => reports.push(o));
        expect([calls, applied, reports]).toEqual([[], [false], []]);
    });

    it('treats a throw as a failure', async () => {
        let last: ProposalOutcome | undefined;
        await runProposal(read('set Scenario_0.title = "x"'), async () => { throw new Error('boom'); }, world(), (o) => { last = o; });
        expect(last).toEqual({ phase: 'failed', steps: [{ text: 'Set Title of Scenario_0 to "x"', status: 'failed', reason: GENERIC_FAILURE_TEXT }] });
    });
});

describe('proposalFocus', () => {
    const focus = (code: string, applied?: boolean[]) => {
        const steps = read(code).steps;
        return proposalFocus(steps, applied ?? steps.map(() => true));
    };

    it('lands on the new element even when an existing one now holds it', () => {
        expect(focus('create instance of Phase "ph1"\nset Scenario_0.pathway = ph1\nset ph1.learners = Antonio')).toEqual({ name: 'ph1', created: true });
    });

    it('lands on the new element no other new element points to', () => {
        expect(focus('create instance of Learner "p"\ncreate instance of Scenario "s"\nset s.lead = p')).toEqual({ name: 's', created: true });
    });

    it('follows a rename of the new element', () => {
        expect(focus('create instance of Scenario "s"\nrename instance s to t')).toEqual({ name: 't', created: true });
    });

    it('lands on the first changed element when nothing is created, skipping steps not applied', () => {
        expect(focus('set Antonio.title = "x"\nset Scenario_0.title = "y"', [false, true])).toEqual({ name: 'Scenario_0', created: false });
    });

    it('lands nowhere when the proposal only deletes', () => {
        expect(focus('delete instance Antonio')).toBeNull();
    });

    it('resolves an existing name to its single root', () => {
        expect([rootIdOf(world(), 'Scenario_0'), rootIdOf(world(), 'dup'), rootIdOf(world(), 'Phase_0')]).toEqual(['oScen', null, null]);
    });
});

describe('configuratorTargetOf', () => {
    // Scenario_0 ◇pathway→ Phase_0 ◇steps→ Step_0; Scenario_1 ◇pathway→ Phase_1 ◇secret→ Vault_0 ◇gems→ Gem_0.
    const idlookup: Record<string, any> = {
        mA: { id: 'mA', className: 'DModel', objects: ['oScen', 'oScen1'] },
        cScen: { id: 'cScen', className: 'DClass', name: 'Scenario' },
        cPhase: { id: 'cPhase', className: 'DClass', name: 'Phase' },
        cStep: { id: 'cStep', className: 'DClass', name: 'Step' },
        cVault: { id: 'cVault', className: 'DClass', name: 'Vault' },
        cGem: { id: 'cGem', className: 'DClass', name: 'Gem' },
        rPath: { id: 'rPath', className: 'DReference', name: 'pathway' },
        rSteps: { id: 'rSteps', className: 'DReference', name: 'steps' },
        rSecret: { id: 'rSecret', className: 'DReference', name: 'secret' },
        rGems: { id: 'rGems', className: 'DReference', name: 'gems' },
        oScen: { id: 'oScen', className: 'DObject', name: 'Scenario_0', instanceof: 'cScen', father: 'mA' },
        vPath: { id: 'vPath', className: 'DValue', father: 'oScen', instanceof: 'rPath' },
        oPhase: { id: 'oPhase', className: 'DObject', name: 'Phase_0', instanceof: 'cPhase', father: 'vPath' },
        vSteps: { id: 'vSteps', className: 'DValue', father: 'oPhase', instanceof: 'rSteps' },
        oStep: { id: 'oStep', className: 'DObject', name: 'Step_0', instanceof: 'cStep', father: 'vSteps' },
        oScen1: { id: 'oScen1', className: 'DObject', name: 'Scenario_1', instanceof: 'cScen', father: 'mA' },
        vPath1: { id: 'vPath1', className: 'DValue', father: 'oScen1', instanceof: 'rPath' },
        oPhase1: { id: 'oPhase1', className: 'DObject', name: 'Phase_1', instanceof: 'cPhase', father: 'vPath1' },
        vSecret: { id: 'vSecret', className: 'DValue', father: 'oPhase1', instanceof: 'rSecret' },
        oVault: { id: 'oVault', className: 'DObject', name: 'Vault_0', instanceof: 'cVault', father: 'vSecret' },
        vGems: { id: 'vGems', className: 'DValue', father: 'oVault', instanceof: 'rGems' },
        oGem: { id: 'oGem', className: 'DObject', name: 'Gem_0', instanceof: 'cGem', father: 'vGems' },
        oLoose: { id: 'oLoose', className: 'DObject', name: 'Loose', instanceof: 'cStep', father: 'mA' },
    };
    const hidden = (id: string) => id === 'cVault';

    it('selects the row of an element of a top-level type', () => {
        expect(configuratorTargetOf(idlookup, ['cScen', 'cPhase'], 'oPhase')).toEqual({ typeId: 'cPhase', rowId: 'oPhase', nav: null });
    });

    it('opens the row of the top-level ancestor and drills down to a nested element', () => {
        expect(configuratorTargetOf(idlookup, ['cScen'], 'oStep')).toEqual({
            typeId: 'cScen',
            rowId: 'oScen',
            nav: { path: [
                { id: 'oScen', name: 'Scenario_0', cls: 'Scenario', childKey: null },
                { id: 'oPhase', name: 'Phase_0', cls: 'Phase', childKey: 'pathway' },
                { id: 'oStep', name: 'Step_0', cls: 'Step', childKey: 'steps' },
            ] },
        });
    });

    it('takes the nearest top-level ancestor', () => {
        expect(configuratorTargetOf(idlookup, ['cScen', 'cPhase'], 'oStep')).toEqual({
            typeId: 'cPhase',
            rowId: 'oPhase',
            nav: { path: [
                { id: 'oPhase', name: 'Phase_0', cls: 'Phase', childKey: null },
                { id: 'oStep', name: 'Step_0', cls: 'Step', childKey: 'steps' },
            ] },
        });
    });

    it('keeps the row and drops the drill-in when a hidden type is on the road', () => {
        expect(configuratorTargetOf(idlookup, ['cScen'], 'oGem', hidden)).toEqual({ typeId: 'cScen', rowId: 'oScen1', nav: null });
    });

    it('lands nowhere for a hidden element, a missing one, or one with no top-level ancestor', () => {
        expect(configuratorTargetOf(idlookup, ['cScen'], 'oVault', hidden)).toBeNull();
        expect(configuratorTargetOf(idlookup, ['cScen'], 'nope')).toBeNull();
        expect(configuratorTargetOf(idlookup, ['cScen'], 'oLoose')).toBeNull();
    });
});

describe('the outcome store', () => {
    it('keeps an outcome per script and tells its listeners', () => {
        const a = 'create instance of Scenario "s"\nset s.title = "a"';
        const b = 'create instance of Scenario "s"\nset s.title = "b"';
        let calls = 0;
        const off = subscribeProposals(() => { calls++; });
        const outcome: ProposalOutcome = { phase: 'discarded', steps: [] };
        setProposalOutcome(a, outcome);
        expect([proposalOutcome(a), proposalOutcome(b), calls]).toEqual([outcome, undefined, 1]);
        off();
        setProposalOutcome(b, outcome);
        expect(calls).toBe(1);
    });

    it('starts empty after a reset', () => {
        expect(proposalOutcome('create instance of Scenario "s"\nset s.title = "a"')).toBeUndefined();
    });
});
