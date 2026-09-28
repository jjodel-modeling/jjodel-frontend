/**
 * probe_2026-09-16_plus_view_ir_seed — Fase 1 of
 * `docs/prompts/claude_2026-09-16_0011_prompt_plus_crea_view_ir.md`.
 *
 * Executes the subject, not its source (P11): the exact seed call Fase 2 would make,
 * then the resolver the canvas uses (`getIRIndex` + `resolveIRView`), the tree scope
 * (`renderedMetaclassNames`), the palette plan (`deriveIRInteraction`) and the
 * delegation test ObjectNode applies (`isMigratedDefaultView`), on synthetic states
 * shaped like the store (`viewpoint`, `viewelements`, `idlookup`).
 *
 * Positive control (P12): the same seeded view filed under a NON-active viewpoint must
 * leave the index null. If that control resolved, the "before/after" numbers below would
 * be measuring the fixture, not the click.
 *
 * Not covered, declared: ObjectNode's `notRendered` flag and the React panels do not import
 * under node; their consumers are cited by file:line in the report, not mirrored here.
 *
 * Run:
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-16_plus_view_ir_seed.mts
 */
import { computeCreationSeed } from '../../../frontend/src/components/editor-v2/viewpoint/ir/irCreationSeed';
import { validateIR } from '../../../frontend/src/components/editor-v2/viewpoint/ir/irValidate';
import { computeIRSignature, getIRIndex, resolveIRView } from '../../../frontend/src/components/editor-v2/viewpoint/ir/irResolveCore';
import { makeDrawReadCtx } from '../../../frontend/src/components/editor-v2/viewpoint/ir/irReadCtx';
import { renderedMetaclassNames, deriveIRInteraction } from '../../../frontend/src/components/editor-v2/viewpoint/ir/irInteraction';
import { isMigratedDefaultView } from '../../../frontend/src/components/editor-v2/viewpoint/ir/irDefaults';

let fails = 0;
function check(label: string, actual: unknown, expected: unknown): void {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    const ok = a === e;
    if (!ok) fails++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  -> ${a}${ok ? '' : `  (expected ${e})`}`);
}

const VP = 'VP_active';

/** Metamodel: State, Transition, SubState extends State. Objects: one per class. */
function baseLookup(): Record<string, any> {
    return {
        C_State: { id: 'C_State', className: 'DClass', name: 'State', extends: [] },
        C_Transition: { id: 'C_Transition', className: 'DClass', name: 'Transition', extends: [] },
        C_SubState: { id: 'C_SubState', className: 'DClass', name: 'SubState', extends: ['C_State'] },
        O_s: { id: 'O_s', className: 'DObject', instanceof: 'C_State', features: [] },
        O_t: { id: 'O_t', className: 'DObject', instanceof: 'C_Transition', features: [] },
        O_sub: { id: 'O_sub', className: 'DObject', instanceof: 'C_SubState', features: [] },
    };
}

/** The exact Fase 2 call: vertex, no metaclass, label = the unique name. */
const freshSeed = () => computeCreationSeed({ kind: 'vertex', label: 'New view' }) as any;

/** A view authored on State, pinned, the shape MatchingSection writes. */
const stateView = () => ({
    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
    authoringMetaclassPins: { State: 'C_State' }, priority: 0, exclusive: true,
    shape: { form: 'rect' },
});

/** Views as DViewElement records: no appliableTo, no oclCondition, on purpose (Q2). */
function state(views: Array<{ id: string; viewpoint: string; ir: any }>) {
    const idlookup = baseLookup();
    for (const v of views) idlookup[v.id] = { id: v.id, className: 'DViewElement', viewpoint: v.viewpoint, ir: v.ir };
    return { viewpoint: VP, viewelements: views.map((v) => v.id), idlookup };
}

function resolveAll(s: any) {
    const sig = computeIRSignature(s);
    const index = getIRIndex(s, sig);
    const ctx = makeDrawReadCtx(s.idlookup);
    const r = (o: string, c: string) => (index ? resolveIRView(o, c, index, ctx, s.idlookup)?.viewId ?? null : null);
    return {
        index,
        indexNull: index === null,
        State: r('O_s', 'C_State'),
        Transition: r('O_t', 'C_Transition'),
        SubState: r('O_sub', 'C_SubState'),
        treeRendered: index ? (renderedMetaclassNames(index) ? Array.from(renderedMetaclassNames(index)!) : null) : 'no-index',
        palette: index ? deriveIRInteraction(index).paletteMetaclasses : 'no-index',
    };
}

console.log('── A. the seed itself (Q3) ──');
const seed = freshSeed();
check('A1 seed is not null', seed !== null, true);
check('A2 metaclasses is the STRING wildcard', seed?.metaclasses, '*');
check('A3 no pin written', seed?.authoringMetaclassPins, undefined);
check('A4 label = unique name', seed?.label, 'New view');
check('A5 kind / exclusive / priority', [seed?.kind, seed?.exclusive, seed?.priority], ['vertex', true, 0]);
check('A6 validateIR accepts it', validateIR('probe', seed).ok, true);

console.log('── B. before the click: active viewpoint with NO ir view ──');
const B = resolveAll(state([]));
check('B1 index null (ObjectNode native branch, irViewpointActive false)', B.indexNull, true);

console.log('── C. after the click on that viewpoint ──');
const sC = state([{ id: 'V_new', viewpoint: VP, ir: freshSeed() }]);
const C = resolveAll(sC);
check('C1 index non-null', C.indexNull, false);
check('C2 wildcard bucket holds the view', C.index?.wildcard.length, 1);
check('C3 every object resolves to V_new', [C.State, C.Transition, C.SubState], ['V_new', 'V_new', 'V_new']);
const cNew = C.index ? resolveIRView('O_s', 'C_State', C.index, makeDrawReadCtx(sC.idlookup), sC.idlookup) : null;
check('C4 not delegated to the native branch (isMigratedDefaultView false)', cNew ? isMigratedDefaultView(cNew) : 'unresolved', false);
check('C5 tree scope: no dimming (renderedMetaclassNames null)', C.treeRendered, null);
check('C6 palette: unrestricted (paletteMetaclasses null)', C.palette, null);

console.log('── C-ctrl. positive control: same view under a NON-active viewpoint ──');
const Cc = resolveAll(state([{ id: 'V_new', viewpoint: 'VP_other', ir: freshSeed() }]));
check('Cc1 index stays null', Cc.indexNull, true);

console.log('── D. before the click: active viewpoint already has a State view ──');
const D = resolveAll(state([{ id: 'V_state', viewpoint: VP, ir: stateView() }]));
check('D1 State -> V_state, Transition -> null (neutral node), SubState -> V_state', [D.State, D.Transition, D.SubState], ['V_state', null, 'V_state']);
check('D2 tree renders only State', D.treeRendered, ['State']);
check('D3 palette restricted to State', D.palette, ['State']);

console.log('── E. after the click on that viewpoint ──');
const E = resolveAll(state([{ id: 'V_state', viewpoint: VP, ir: stateView() }, { id: 'V_new', viewpoint: VP, ir: freshSeed() }]));
check('E1 State keeps V_state, SubState keeps V_state (inherited), Transition -> V_new', [E.State, E.Transition, E.SubState], ['V_state', 'V_new', 'V_state']);
check('E2 tree dimming switched off', E.treeRendered, null);
check('E3 palette restriction switched off', E.palette, null);

console.log('── F. viewpoint that already holds a wildcard view: the new one is shadowed ──');
const F = resolveAll(state([{ id: 'V_old', viewpoint: VP, ir: freshSeed() }, { id: 'V_new', viewpoint: VP, ir: freshSeed() }]));
check('F1 every object stays on V_old (declaration order)', [F.State, F.Transition], ['V_old', 'V_old']);

console.log('── G. narrowing afterwards (Q3), the two shapes MatchingSection writes ──');
const emptied = { ...freshSeed(), metaclasses: [] };
check('G1 toggle-off shape metaclasses [] passes validateIR (the panel commits it)', validateIR('probe', emptied).ok, true);
const G1 = resolveAll(state([{ id: 'V_new', viewpoint: VP, ir: emptied }]));
check('G2 with [] alone the index is non-null but resolves nothing: every node neutral', [G1.indexNull, G1.State, G1.Transition], [false, null, null]);
const narrowed = { ...freshSeed(), metaclasses: ['Transition'], authoringMetaclassPins: { Transition: 'C_Transition' } };
check('G3 narrowed shape passes validateIR', validateIR('probe', narrowed).ok, true);
const G3 = resolveAll(state([{ id: 'V_state', viewpoint: VP, ir: stateView() }, { id: 'V_new', viewpoint: VP, ir: narrowed }]));
check('G4 narrowed: wildcard empty, Transition -> V_new, State -> V_state', [G3.index?.wildcard.length, G3.Transition, G3.State], [0, 'V_new', 'V_state']);
check('G5 narrowed: tree and palette restrictions come back', [G3.treeRendered, G3.palette], [['State', 'Transition'], ['State', 'Transition']]);

console.log(`\n${fails === 0 ? 'ALL PASS' : `${fails} FAIL`}`);
process.exit(fails === 0 ? 0 : 1);
