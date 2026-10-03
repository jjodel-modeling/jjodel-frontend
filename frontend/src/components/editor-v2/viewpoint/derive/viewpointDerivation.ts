/**
 * viewpointDerivation — a viewpoint derived from a metamodel, as IR documents
 * (P-2026-09-29-0135, Phase 2 of docs/discovery/discovery_2026-09-29_viewpoint_derivation.md).
 *
 * One document per concrete metaclass, filled deterministically from the
 * structure and, when a simulation role binding is given, from the roles
 * (discovery §4 (a)). No Jjodie: what only a name or a notation can decide
 * (a Decision diamond, a hue per family, which attributes to show) is left to
 * the form's base.
 *
 * - **Edges** (discovery §4 (d)), in this order: a class kind-of the bound
 *   Transition (control flow) or Arc (Petri) takes the role's endpoints; else
 *   a class with exactly two single-valued plain references into one hierarchy
 *   runs from one to the other, by name (`source`/`target`), else in
 *   declaration order; else a class contained by X through a multi-valued
 *   composition, with exactly one single-valued reference into X's hierarchy,
 *   runs from its container. A class that is itself a kind of an endpoint is
 *   a node (Person.father, a composite State), and so is a class with more than
 *   two such references (the four back-references of a Families Member).
 * - **Vertices**: the role's catalogue preset (initial state, final state,
 *   fork/join bar, state, Petri place and transition); else a rounded box.
 *   Colours are CSS tokens, except the fill of a solid symbol, which keeps the
 *   catalogue ink so the Symbol Editor still recognizes the preset (decision 4
 *   of the prompt); its name takes the text-on-dark token, light theme only.
 * - **The Petri notation** (P-2026-09-29-0939, lane 1 of
 *   docs/discovery/discovery_2026-09-29_petri_notation.md §6, R-VP-15, amended
 *   by R-VP-16, P-2026-09-29-1021), under the `petri` shape and on the bound
 *   roles only: a place has the name ink as border and its name centred, in
 *   italic, and draws no token marks; a transition is a flat `bar` in the catalogue
 *   ink, 56 by 12, with its name outside below it in the label style of C2 (it sat
 *   centred over the bar until P-2026-10-03-1300); an arc and an inhibitor arc are a 1 px line in the same ink, on the
 *   default (orthogonal) router, both ending in the open arrowhead (R-VP-25,
 *   P-2026-09-30-1521). With no role bound every class keeps the structure's box.
 * - **The control-flow notation** (P-2026-09-29-1331, lane V1 of
 *   docs/discovery/discovery_2026-09-29_visual_concrete_syntax.md §5, R-VP-17),
 *   under the `controlFlow` shape with the Node role bound: a transition is a
 *   1 px line in the name ink, labelled with its event (the Trigger role), else
 *   with its guard as raw text; a box with no compartment has its name centred;
 *   a fork and a join are nameless bars. A binding with a Trigger is a state
 *   machine: its Terminal is a named state box with a double border in the name
 *   ink, and no compartment; its Initial is unchanged. Without one it is an
 *   activity: its Initial is the nameless disc, its Terminal (and an activity
 *   final) the nameless bull's-eye in the name ink.
 * - **The generic structural notation** (variant C, P-2026-09-29-2350, R-VP-19,
 *   mockups docs/mockups/derived-viewpoints/*-C-generic.svg), what «Derive
 *   viewpoint» draws when no role is bound (`deriveGenericViewpointIRs`): the
 *   edges of the structure-only derivation, in the name ink with the open
 *   arrowhead (R-VP-25), labelled by one text source or by a template, the label in the
 *   halo style; every node a white rounded box with the metaclass name as an
 *   eyebrow over its name, the subclasses named initial or final marked on the
 *   border; a class held by a node's multi-valued composition a row of that
 *   node. The IR keys of slice C2 (P-2026-09-30-0150, R-VP-20) carry the eyebrow's
 *   letter spacing and case, the label templates and style, and the name slot
 *   kept out of the slot rows.
 * - **No priority**: the list comes deepest class first and the resolver ranks
 *   an exact match above an inherited one (irResolveCore.ts), so the creation
 *   order settles every tie (decision 1).
 * - **No provenance key** in the ir (decision 3): `rule` is returned beside it,
 *   for the caller and the tests, and never written. The provenance a created view
 *   carries (`generated`, slice D, P-2026-09-30-0255) is added by `notations.ts`.
 * - **Activity (UML)** (P-2026-09-30-1552, R-VP-26): the Flowchart's documents drawn as the
 *   UML activity diagram, the initial a filled dot, the action a rounded box, the decision a
 *   hollow diamond, fork and join a bar, the final a bull's-eye, a guard in brackets
 *   (`deriveActivityViewpointIRs`).
 * - **The dialog's table** (slice D): `DerivationRoles.classRoles`, when given, says
 *   each class's role in place of the bag's class keys (`rolesFromTable`); the bag
 *   still gives the references and attributes the roles read.
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the
 * node bench (derive/__tests__/viewpointDerivation.test.ts). It reads the raw
 * lookup and writes nothing into it.
 */

import { applyPresetToShape, getCatalogPreset } from '../ir/notationCatalog';
import { CONTAINER_ENDPOINT } from '../ir/irTypes';
import type {
    EdgeViewIR, FieldCompartmentSpec, LabelSpec, Predicate, RowViewIR, ShapeSpec, TextSource, TextStyle, VertexViewIR,
} from '../ir/irTypes';
import { sketchOfMetamodel } from '../../sim/metamodelSketch';
import { SKETCH_TYPE } from '../../../../model/simulation/profileBinder';
import type { SketchAttribute, SketchClass, SketchReference } from '../../../../model/simulation/profileBinder';
import type { ProfileShape } from '../../../../model/simulation/simProfiles';
import { cardinalityOf, keyFlagOf, relationshipEnds } from './erSignals';

type Lookup = Record<string, any>;

/** A simulation role binding: the bag a run reads, and the shape of its profile. */
export interface DerivationRoles {
    /** Role keys (`simNode`, `simTransition`, …) to element ids, as `simBridge.runBag` gives them. */
    readonly bag: Readonly<Record<string, unknown>>;
    /** Under `petri` the Transition role is a vertex (a bar), under `controlFlow` an edge. */
    readonly shape: ProfileShape;
    /**
     * The «Derive viewpoint» dialog's metaclass → role table (slice D, P-2026-09-30-0255): class
     * id to role (`node`, `initial`, …). When given, a class's role is read here (`rolesFromTable`)
     * and not from the bag's class keys, so two classes can share a role; absent, the bag decides,
     * as before.
     */
    readonly classRoles?: Readonly<Record<string, string>>;
    /**
     * The drawing over the role-keyed documents of the profile (slices A1 and A3, P-2026-09-30-0355,
     * R-VP-22): `statechart` (Statechart (UML), on `stateMachine`), `flowchartIso` (Flowchart (ISO
     * 5807), on `flowchart`); slice A2 (P-2026-09-30-1521, R-VP-24): `petriClassic` (Petri net
     * (classic), on `petri`); P-2026-09-30-1552 (R-VP-26): `activityUml` (Activity (UML), on `flowchart`).
     * Absent: the role-keyed documents of R-VP-15..18, as before.
     */
    readonly notation?: 'statechart' | 'flowchartIso' | 'petriClassic' | 'activityUml';
}

export interface DerivedView {
    readonly classId: string;
    readonly className: string;
    /** The rule that decided the document (`role:<id>`, `structure:<rule>`). Not written into the ir. */
    readonly rule: string;
    readonly ir: VertexViewIR | EdgeViewIR;
}

/** A row document of the generic notation: a contained object drawn as a row of its holder. */
export interface DerivedRowView extends Omit<DerivedView, 'ir'> {
    readonly ir: RowViewIR;
}

/** Any document a derivation returns: the generic notation adds rows to vertices and edges. */
export type AnyDerivedView = DerivedView | DerivedRowView;

const IR_VERSION = 'ir-1.2';
const SURFACE = 'var(--color-inode-surface)';
const BORDER = 'var(--color-inode-border)';
const INVERSE_TEXT = 'var(--color-text-inverse)';
/** The theme's ink for names: slate-900 in light, near-white in dark. The Petri stroke and line. */
const NAME_INK = 'var(--color-inode-name)';

/** The class roles, most specific first: a subclass of Node bound as Initial is an initial state. */
const CLASS_ROLES: ReadonlyArray<{ role: string; key: string }> = [
    { role: 'initial', key: 'simInitial' },
    { role: 'terminal', key: 'simTerminal' },
    { role: 'activityFinal', key: 'simActivityFinal' },
    { role: 'fork', key: 'simFork' },
    { role: 'join', key: 'simJoin' },
    { role: 'inhibitorArc', key: 'simInhibitorArc' },
    { role: 'arc', key: 'simArc' },
    { role: 'transition', key: 'simTransition' },
    { role: 'node', key: 'simNode' },
];

/** The class roles a derivation draws, the roles a notation's table may offer (notations.ts). */
export const DERIVATION_CLASS_ROLES: readonly string[] = CLASS_ROLES.map(r => r.role);

/** The catalogue preset of a vertex role (notationCatalog.ts), per profile shape. */
const ROLE_PRESET: { readonly [S in ProfileShape]: Readonly<Record<string, string>> } = {
    controlFlow: {
        initial: 'uml-initial-state', terminal: 'uml-final-state', activityFinal: 'uml-final-state',
        fork: 'uml-fork-join', join: 'uml-fork-join', node: 'uml-state',
    },
    petri: { terminal: 'uml-final-state', node: 'petri-place', transition: 'petri-transition' },
};

/** Forms that hold no compartment; a solid fill holds none either. */
const NO_COMPARTMENT: ReadonlySet<string> = new Set(['circle', 'ellipse', 'diamond']);

/** The endpoint names the binder reads for an arc (profileBinder.ts), `next` added for control flow. */
const SOURCE_NAME = /src|source|from/;
const TARGET_NAME = /tgt|target|to$|dest|next/;

/**
 * The attribute rows, as `defaultObjectViewIR` writes them; a new object per view, nothing shared. `hidesName`:
 * the box's title is the name label, which already shows the identity slot, so its row is left out (P-2026-10-03-1300).
 * The rows are mono 11 px in the quiet ink, as the Generic notation's: before P-2026-10-03-1300 only Generic set that
 * style, and the rows of every role-keyed notation drew in the sans default.
 */
const attributesCompartment = (hidesName = false): FieldCompartmentSpec => ({
    id: 'attributes',
    source: hidesName ? { from: 'attributes', exclude: ['name'] } : { from: 'attributes' },
    rowFormat: {
        segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }],
        style: { fontFamily: 'mono', fontSize: 11, color: QUIET },
    },
    separator: true,
});

const path = (featureName: string) => `$${featureName}.value`;

/**
 * True when `entity` (a D-layer element from the store lookup) is a metamodel, the only kind
 * a viewpoint is derived from. The one test both `createDerivedViewpoint` and the tree row's
 * «Derive viewpoint» item use.
 */
export function isDerivableMetamodel(entity: any): boolean {
    return !!entity && entity.className === 'DModel' && !!entity.isMetamodel;
}

/**
 * The role every class of the metamodel takes from a metaclass → role table (slice D): its own
 * entry, else the entry of its nearest superclass, breadth first over `extends`, cycle-safe. A
 * class with neither has none; an id that is not a class of the metamodel is ignored. Sketch order.
 */
export function rolesFromTable(lookup: Lookup, metamodelId: string, table: Readonly<Record<string, string>>): Map<string, string> {
    const sketch = sketchOfMetamodel(lookup, metamodelId);
    const byId = new Map<string, SketchClass>(sketch.classes.map(c => [c.id, c]));
    const out = new Map<string, string>();
    for (const c of sketch.classes) {
        const seen = new Set<string>();
        const queue = [c.id];
        while (queue.length > 0) {
            const x = queue.shift() as string;
            if (seen.has(x)) continue;
            seen.add(x);
            const role = table[x];
            if (typeof role === 'string' && role !== '') {
                out.set(c.id, role);
                break;
            }
            for (const s of byId.get(x)?.supers ?? []) queue.push(s);
        }
    }
    return out;
}

/**
 * The IR documents of the metamodel `metamodelId`, one per concrete class,
 * deepest class first (declaration order within a depth). `roles` null or
 * absent: structure only. An unknown metamodel gives `[]`.
 */
export function deriveViewpointIRs(lookup: Lookup, metamodelId: string, roles: DerivationRoles | null): DerivedView[] {
    const sketch = sketchOfMetamodel(lookup, metamodelId);
    const byId = new Map<string, SketchClass>(sketch.classes.map(c => [c.id, c]));

    const lineageMemo = new Map<string, string[]>();
    /** `id` and its superclasses, transitively, cycle-safe, `id` first. */
    const lineage = (id: string): string[] => {
        const hit = lineageMemo.get(id);
        if (hit) return hit;
        const out: string[] = [];
        const queue = [id];
        while (queue.length > 0) {
            const c = queue.shift() as string;
            if (out.includes(c)) continue;
            out.push(c);
            for (const s of byId.get(c)?.supers ?? []) queue.push(s);
        }
        lineageMemo.set(id, out);
        return out;
    };
    const isKind = (c: string, of: string) => lineage(c).includes(of);
    const shareHierarchy = (a: string, b: string) => lineage(a).some(x => lineage(b).includes(x));

    const depthMemo = new Map<string, number>();
    /** The longest `extends` chain from `id` to a root. */
    const depth = (id: string, visiting: string[] = []): number => {
        const hit = depthMemo.get(id);
        if (hit !== undefined) return hit;
        if (visiting.includes(id)) return 0;
        const supers = byId.get(id)?.supers ?? [];
        const d = supers.length ? 1 + Math.max(...supers.map(s => depth(s, [...visiting, id]))) : 0;
        depthMemo.set(id, d);
        return d;
    };

    const upper = (refId: string): number => {
        const u = lookup[refId]?.upperBound;
        return typeof u === 'number' ? u : 1;
    };
    const referencesOf = (c: string): SketchReference[] => sketch.references.filter(r => lineage(c).includes(r.owner));
    const attributesOf = (c: string) => sketch.attributes.filter(a => lineage(c).includes(a.owner));

    const bag = roles?.bag ?? {};
    const shape: ProfileShape = roles?.shape ?? 'controlFlow';
    const roleValue = (key: string): string | undefined => {
        const v = bag[key];
        return typeof v === 'string' && v !== '' ? v : undefined;
    };
    /** The name of a bound reference, when it is a reference `c` holds. */
    const boundReference = (key: string, c: string): string | undefined => {
        const id = roleValue(key);
        return id ? referencesOf(c).find(r => r.id === id)?.name : undefined;
    };
    /** The name of a bound attribute, when it is an attribute `c` holds. */
    const boundAttribute = (key: string, c: string): string | undefined => {
        const id = roleValue(key);
        return id ? attributesOf(c).find(a => a.id === id)?.name : undefined;
    };
    /** The dialog's table, resolved per class; null when the bag's class keys decide. */
    const table = roles?.classRoles ? rolesFromTable(lookup, metamodelId, roles.classRoles) : null;
    const roleOf = (c: string): string | undefined => {
        if (table) return table.get(c);
        for (const { role, key } of CLASS_ROLES) {
            const v = roleValue(key);
            if (v && isKind(c, v)) return role;
        }
        return undefined;
    };
    /** The control-flow notation (V1) is keyed on the roles: the Node role bound under the shape. */
    const flow = shape === 'controlFlow' && (table ? [...table.values()].includes('node') : roleValue('simNode') !== undefined);
    /** Transitions fired by events make a state machine; without a Trigger it is an activity. */
    const stateMachine = flow && roleValue('simTrigger') !== undefined;

    /** The endpoints of `c` when it is a connection, with the rule that says so. */
    const edgeOf = (c: string, role: string | undefined): { source: string; target: string; rule: string } | null => {
        if (role === 'transition' && shape === 'controlFlow') {
            const target = boundReference('simNextState', c);
            const source = boundReference('simSource', c);
            if (target && source) return { source: path(source), target: path(target), rule: 'role:transition' };
            if (target && roleValue('simOwnedTransitions')) return { source: CONTAINER_ENDPOINT, target: path(target), rule: 'role:transition' };
        }
        if (role === 'arc' || role === 'inhibitorArc') {
            const source = boundReference('simArcSource', c);
            const target = boundReference('simArcTarget', c);
            if (source && target) return { source: path(source), target: path(target), rule: `role:${role}` };
        }

        // A single-valued plain reference to a type `c` is not itself a kind of.
        const single = referencesOf(c).filter(r => !r.composition && upper(r.id) === 1 && byId.has(r.type) && !isKind(c, r.type));

        // Two references into one hierarchy, and no third one into it.
        const paired = single.filter(a => single.some(b => b !== a && shareHierarchy(a.type, b.type)));
        if (paired.length === 2) {
            let [a, b] = paired;
            if (SOURCE_NAME.test(b.name.toLowerCase()) || TARGET_NAME.test(a.name.toLowerCase())) [a, b] = [b, a];
            return { source: path(a.name), target: path(b.name), rule: 'structure:two-refs' };
        }

        // Contained by X, one reference into X's hierarchy.
        const containers = sketch.references
            .filter(r => r.composition && upper(r.id) !== 1 && isKind(c, r.type) && !isKind(c, r.owner))
            .map(r => r.owner);
        for (const x of containers) {
            const into = single.filter(r => shareHierarchy(r.type, x));
            if (into.length === 1) return { source: CONTAINER_ENDPOINT, target: path(into[0].name), rule: 'structure:contained-ref' };
        }
        return null;
    };

    const concrete = sketch.classes
        .map((c, index) => ({ c, index, d: depth(c.id) }))
        .filter(x => !x.c.abstract)
        .sort((x, y) => (y.d - x.d) || (x.index - y.index));

    const out: DerivedView[] = [];
    for (const { c } of concrete) {
        const role = roleOf(c.id);
        const pins = { [c.name]: c.id };
        const label = `View for ${c.name}`;

        const e = edgeOf(c.id, role);
        if (e) {
            const stringAttr = attributesOf(c.id).find(a => a.type === SKETCH_TYPE.string);
            const edge: EdgeViewIR['edge'] = {
                source: e.source,
                target: e.target,
                terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
            };
            if (stringAttr) edge.labels = { center: { from: 'path', expr: path(stringAttr.name) } };
            if (shape === 'petri' && (role === 'arc' || role === 'inhibitorArc')) {
                // The arc ends in the open arrowhead (R-VP-25), as the inhibitor already did; the
                // inhibitor's circle is Petri net (classic)'s (R-VP-24). No routing: the default
                // orthogonal router (R-VP-16).
                if (role === 'arc') edge.terminations = { sourceEnd: 'none', targetEnd: 'openArrow' };
                edge.line = { color: NAME_INK, width: 1 };
            }
            if (flow && role === 'transition') {
                // One part only: `event [guard] / action` needs a template the IR lacks (V4).
                // A guard is code: mono 11.5 px as Activity (UML)'s, in every flow notation (P-2026-10-03-1300); an event
                // has no style here, and each notation gives it its own.
                const event = boundReference('simTrigger', c.id);
                const labelled = event ?? boundAttribute('simGuard', c.id);
                if (labelled) edge.labels = { center: { from: 'path', expr: path(labelled) }, ...(event ? {} : { style: ACTIVITY_GUARD_STYLE() }) };
                edge.line = { color: NAME_INK, width: 1 };
            }
            out.push({
                classId: c.id, className: c.name, rule: e.rule,
                ir: { irVersion: IR_VERSION, kind: 'edge', metaclasses: [c.name], authoringMetaclassPins: pins, exclusive: true, label, edge },
            });
            continue;
        }

        // V1 (R-VP-17): the state machine's Terminal is a named state box, the activity's final
        // the bull's-eye; the activity's Initial, the fork and the join lose their name.
        const terminalBox = stateMachine && role === 'terminal';
        const bullseye = flow && (role === 'activityFinal' || (role === 'terminal' && !stateMachine));
        const bar = flow && (role === 'fork' || role === 'join');
        const initialDisc = flow && role === 'initial' && !stateMachine;
        const nameless = bullseye || bar || initialDisc;
        const presetId = terminalBox ? 'uml-state' : role ? ROLE_PRESET[shape][role] : undefined;
        const preset = presetId ? getCatalogPreset(presetId) : undefined;
        const petriPlace = shape === 'petri' && role === 'node';
        const petriTransition = shape === 'petri' && role === 'transition';
        // The border token goes in first: applyPresetToShape keeps the author's border colour.
        // The bull's-eye's dot is drawn in the border colour (IRNodeContent), so both take the ink.
        let shapeSpec: ShapeSpec = { form: 'rounded', fill: SURFACE, border: { color: petriPlace || bullseye ? NAME_INK : BORDER, width: 1, style: 'solid' } };
        if (preset) shapeSpec = applyPresetToShape(shapeSpec, preset);
        // The Petri transition keeps the catalogue fill as a `bar`, a fixed small box (R-VP-16).
        if (petriTransition) shapeSpec.form = 'bar';
        // Fork and join: the same solid ink bar Activity (UML) draws, 7 px thick (P-2026-10-03-1300), fill and border in the
        // name ink, size declared below. A bar is a notation glyph, which «Color by metaclass» leaves alone (R-VP-50).
        if (bar) {
            shapeSpec.form = 'bar';
            shapeSpec.fill = NAME_INK;
            shapeSpec.border = { color: NAME_INK, width: 1, style: 'solid' };
        }
        // A CSS double border draws two lines from a width of 3 (irTypes.ts).
        if (terminalBox) shapeSpec.border = { color: NAME_INK, width: 3, style: 'double' };
        const form = shapeSpec.form as string;
        const solid = preset?.values.fill !== undefined;
        const boxed = !NO_COMPARTMENT.has(form) && !solid;
        // A final state holds no behaviour (UML), so the Terminal box takes no compartment. A box that shows its
        // name as the title leaves the identity slot's row out, and a box with no other slot has no compartment.
        const hidesName = !nameless && attributesOf(c.id).some(isIdentity);
        const compartment = boxed && !terminalBox && attributesOf(c.id).some(a => !(hidesName && isIdentity(a)));
        shapeSpec.labels = [{ position: boxed ? (flow && !compartment ? 'center' : 'top') : 'bottom', source: { from: 'intrinsic', prop: 'name' } }];
        // A label sits inside the shape at every position, so on the ink it takes the
        // text-on-dark token (measured on the lane probe: the default text did not read).
        if (solid) shapeSpec.labels[0].style = { color: INVERSE_TEXT };
        // The Petri place's name sits centred on the shape (R-VP-16), in the regular weight the
        // centre position would otherwise make bold (irStyle.ts), in italic. The transition's name
        // sits outside, below the flat bar, in the label style of C2 as Petri net (classic)'s does
        // (P-2026-10-03-1300): the arcs meet the bar at its ends and its top, so the side below is free.
        if (petriPlace) shapeSpec.labels[0] = { position: 'center', source: shapeSpec.labels[0].source, style: { fontStyle: 'italic', fontWeight: 'normal' } };
        if (petriTransition) shapeSpec.labels[0] = { position: 'outside', anchor: 's', source: shapeSpec.labels[0].source, style: EDGE_LABEL_STYLE() };
        if (nameless) shapeSpec.labels = [];

        const ir: VertexViewIR = {
            irVersion: IR_VERSION, kind: 'vertex', metaclasses: [c.name], authoringMetaclassPins: pins, exclusive: true, label,
            shape: shapeSpec,
        };
        if (compartment) ir.fieldCompartments = [attributesCompartment(hidesName)];
        // The Petri transition is a flat bar, its long axis across (P-2026-10-03-1300).
        if (petriTransition) ir.defaultSize = { width: PETRI_BAR_LONG, height: PETRI_BAR_SHORT };
        // The activity's Initial disc and final bull's-eye are drawn at the sizes Activity (UML) declares, 20 and 24 px,
        // not after their content (64 px); the fill and the marker are untouched (P-2026-10-03-1300). The state machine's
        // named Initial is neither: it keeps its size.
        if (initialDisc) ir.defaultSize = { ...ACTIVITY_INITIAL_SIZE };
        if (bullseye) ir.defaultSize = { ...ACTIVITY_FINAL_SIZE };
        if (bar) ir.defaultSize = { ...ACTIVITY_BAR_SIZE };
        out.push({ classId: c.id, className: c.name, rule: preset ? `role:${role}` : 'structure:default', ir });
    }
    return out;
}

// ---------------------------------------------------------------------------
// The generic structural notation (variant C, R-VP-19)
// ---------------------------------------------------------------------------

/** The quiet text token: the eyebrow and the slot rows (`#64748b` in light, R-VP-18 (3)). */
const QUIET = 'var(--color-inode-quiet)';

/** The words of a class name, lower case: `FinalNode` and `final_state` both start with `final`. */
const nameWords = (name: string): string[] =>
    name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/).filter(w => w !== '');
const INITIAL_WORDS: ReadonlySet<string> = new Set(['initial', 'start']);
const FINAL_WORDS: ReadonlySet<string> = new Set(['final', 'terminal', 'end', 'accept']);

/** The identity slot (model/CLAUDE.md §3.12): the name label already shows it. */
const isIdentity = (a: SketchAttribute): boolean => a.name === 'name' && a.type === SKETCH_TYPE.string;

const NAME_SOURCE = (): TextSource => ({ from: 'intrinsic', prop: 'name' });
/** The halo label of every labelled edge (R-VP-20 (5)): 12 px, 500, the quiet ink; a new object per view. */
const EDGE_LABEL_STYLE = (): TextStyle => ({ fontSize: 12, fontWeight: 'medium', color: QUIET });
/**
 * A slot as `name = value`, the row of the attributes compartment, in a label template (R-VP-20 (4)).
 * The literal is the value's caption: an unset slot draws neither. `lead` is the space after a stereotype.
 */
const slotRow = (a: SketchAttribute, lead = ''): TextSource[] => [{ from: 'literal', text: `${lead}${a.name} = ` }, { from: 'path', expr: path(a.name) }];
const isKindOf = (className: string): Predicate => ({ op: 'isKind', class: className });
const anyKindOf = (names: string[]): Predicate => (names.length === 1 ? isKindOf(names[0]) : { op: 'or', args: names.map(isKindOf) });

/**
 * The generic structural notation (variant C) of the metamodel `metamodelId`: one document
 * per concrete class, in the order of the structure-only derivation, the roles never read.
 * An unknown metamodel gives `[]`.
 *
 * - **Edges** are the edges of `deriveViewpointIRs(…, null)`, endpoints unchanged: a 1 px
 *   line in the name ink ending in the open arrowhead (R-VP-25, P-2026-09-30-1521). The label is the first plain
 *   single reference that is not an endpoint (the event of a transition), else the first
 *   slot other than the name as a template `name = value` (`weight = 2`), else the name
 *   slot; a sub-edge is labelled by its stereotype `«Name»`, before its own reference or
 *   slot when it has one (`«InhibitorArc» weight = 3`). Every label in the halo style.
 * - **Rows**: a class held by a node through a multi-valued composition (its own or
 *   inherited, not into the holder's own hierarchy) is a row of that node, `name` or
 *   `name : type` in mono 11 px, unless it is the type of a plain reference, which needs
 *   it as a node. A class held only by another row, or by an edge, stays a node.
 * - **Nodes**: a white rounded box, 1 px in the node border token, sized from its content;
 *   the metaclass name as written, uppercased by `textTransform` and spaced 0.08 em, in
 *   10 px 600 quiet ink over the name in 14 px 600 name ink. A subclass whose name holds
 *   the word initial or start takes a 2 px ink border, one holding final, terminal, end or
 *   accept the double border. The slots other than the name in mono 11 px quiet rows, the
 *   name slot excluded; a class whose only slot is the name has none.
 */
export function deriveGenericViewpointIRs(lookup: Lookup, metamodelId: string): AnyDerivedView[] {
    // The order and the edges are today's structure-only derivation (rule 2 of the prompt).
    const structure = deriveViewpointIRs(lookup, metamodelId, null);
    const sketch = sketchOfMetamodel(lookup, metamodelId);
    const byId = new Map<string, SketchClass>(sketch.classes.map(c => [c.id, c]));

    const lineageMemo = new Map<string, string[]>();
    /** `id` and its superclasses, transitively, cycle-safe, `id` first. */
    const lineage = (id: string): string[] => {
        const hit = lineageMemo.get(id);
        if (hit) return hit;
        const out: string[] = [];
        const queue = [id];
        while (queue.length > 0) {
            const c = queue.shift() as string;
            if (out.includes(c)) continue;
            out.push(c);
            for (const s of byId.get(c)?.supers ?? []) queue.push(s);
        }
        lineageMemo.set(id, out);
        return out;
    };
    const isKind = (c: string, of: string) => lineage(c).includes(of);
    const upper = (refId: string): number => {
        const u = lookup[refId]?.upperBound;
        return typeof u === 'number' ? u : 1;
    };
    const referencesOf = (c: string): SketchReference[] => sketch.references.filter(r => lineage(c).includes(r.owner));
    const attributesOf = (c: string) => sketch.attributes.filter(a => lineage(c).includes(a.owner));
    const nameOf = (c: string) => byId.get(c)?.name ?? c;

    const edges = new Set(structure.filter(v => v.ir.kind === 'edge').map(v => v.classId));
    const nodes = structure.filter(v => v.ir.kind !== 'edge').map(v => v.classId);

    // Rows (rule 3). Held through a multi-valued composition that does not run into the
    // holder's own hierarchy (a State in a State is a tree of nodes), by a holder the
    // class is not itself a kind of (a SubPackage is a Package and an Element).
    const holdings = (n: string) => referencesOf(n).filter(r => r.composition && upper(r.id) !== 1 && !isKind(n, r.type));
    const heldBy = (c: string, n: string) => !isKind(c, n) && holdings(n).some(r => isKind(c, r.type));
    const typesPlainReference = (c: string) => sketch.references.some(r => !r.composition && isKind(c, r.type));
    const candidates = nodes.filter(c => !typesPlainReference(c) && nodes.some(n => heldBy(c, n)));
    // Held by a node: a candidate held only by other candidates stays a node, since its
    // holders are rows and a row draws no rows of its own.
    const rows = new Set(candidates.filter(c => nodes.some(n => !candidates.includes(n) && heldBy(c, n))));

    /** Only the row classes `n` holds: its edges and its node children keep their own drawing. */
    const childFilter = (n: string): Predicate | null => {
        const held = [...rows].filter(r => heldBy(r, n));
        if (held.length === 0) return null;
        const kept = anyKindOf(held.map(nameOf));
        // A class that is a kind of a row class and not a row itself is excluded by name.
        const apart = structure.map(v => v.classId).filter(x => !rows.has(x) && held.some(r => isKind(x, r)));
        return apart.length === 0 ? kept : { op: 'and', args: [kept, { op: 'not', arg: anyKindOf(apart.map(nameOf)) }] };
    };

    const markOf = (c: string): 'initial' | 'final' | undefined => {
        if ((byId.get(c)?.supers.length ?? 0) === 0) return undefined;
        const words = nameWords(nameOf(c));
        if (words.some(w => INITIAL_WORDS.has(w))) return 'initial';
        if (words.some(w => FINAL_WORDS.has(w))) return 'final';
        return undefined;
    };

    /** One text source where one says it; a template where the label needs two parts (R-VP-20 (4)). */
    const edgeLabel = (c: string, ends: ReadonlyArray<string | undefined>): { center: TextSource } | { template: TextSource[] } | undefined => {
        const extra = referencesOf(c).find(r => !r.composition && upper(r.id) === 1 && !ends.includes(path(r.name)));
        const slot = attributesOf(c).find(a => !isIdentity(a));
        if (lineage(c).slice(1).some(s => edges.has(s))) {
            const stereotype = `«${nameOf(c)}»`;
            if (!extra && !slot) return { center: { from: 'literal', text: stereotype } };
            // The space is the caption of what follows, so the stereotype stands alone when that is unset.
            const own: TextSource[] = extra ? [{ from: 'literal', text: ' ' }, { from: 'path', expr: path(extra.name) }] : slotRow(slot as SketchAttribute, ' ');
            return { template: [{ from: 'literal', text: stereotype }, ...own] };
        }
        if (extra) return { center: { from: 'path', expr: path(extra.name) } };
        if (slot) return { template: slotRow(slot) };
        return attributesOf(c).some(isIdentity) ? { center: NAME_SOURCE() } : undefined;
    };

    return structure.map((v): AnyDerivedView => {
        const pins = { [v.className]: v.classId };
        const label = `View for ${v.className}`;

        if (v.ir.kind === 'edge') {
            const { source, target } = v.ir.edge;
            const edge: EdgeViewIR['edge'] = { source, target, terminations: { sourceEnd: 'none', targetEnd: 'openArrow' } };
            const text = edgeLabel(v.classId, [source, target]);
            if (text) edge.labels = { ...text, style: EDGE_LABEL_STYLE() };
            edge.line = { color: NAME_INK, width: 1 };
            return {
                classId: v.classId, className: v.className, rule: v.rule,
                ir: { irVersion: IR_VERSION, kind: 'edge', metaclasses: [v.className], authoringMetaclassPins: pins, exclusive: true, label, edge },
            };
        }

        if (rows.has(v.classId)) {
            const type = attributesOf(v.classId).find(a => a.name.toLowerCase() === 'type')
                ?? referencesOf(v.classId).find(r => r.name.toLowerCase() === 'type' && !r.composition && upper(r.id) === 1);
            const template: TextSource[] = type
                ? [NAME_SOURCE(), { from: 'literal', text: ' : ' }, { from: 'path', expr: path(type.name) }]
                : [NAME_SOURCE()];
            const ir: RowViewIR = { irVersion: 'ir-1.0', kind: 'row', metaclasses: [v.className], authoringMetaclassPins: pins, label, template };
            return { classId: v.classId, className: v.className, rule: 'generic:row', ir };
        }

        const mark = markOf(v.classId);
        const eyebrow: LabelSpec = {
            position: 'top', source: { from: 'literal', text: v.className },
            style: { fontSize: 10, fontWeight: 'semibold', color: QUIET, letterSpacing: 0.08, textTransform: 'uppercase' },
        };
        const name: LabelSpec = { position: 'top', source: NAME_SOURCE(), style: { fontSize: 14, fontWeight: 'semibold', color: NAME_INK } };
        const shape: ShapeSpec = {
            form: 'rounded', fill: SURFACE,
            // A CSS double border draws two lines from a width of 3 (irTypes.ts), as R-VP-17.
            border: mark === 'initial' ? { color: NAME_INK, width: 2, style: 'solid' }
                : mark === 'final' ? { color: NAME_INK, width: 3, style: 'double' }
                    : { color: BORDER, width: 1, style: 'solid' },
            labels: [eyebrow, name],
        };
        const ir: VertexViewIR = {
            irVersion: IR_VERSION, kind: 'vertex', metaclasses: [v.className], authoringMetaclassPins: pins, exclusive: true, label, shape,
        };
        const compartments: FieldCompartmentSpec[] = [];
        if (attributesOf(v.classId).some(a => !isIdentity(a))) {
            const slots = attributesCompartment();
            // The name label already shows the identity slot (R-VP-20 (2)).
            if (attributesOf(v.classId).some(isIdentity)) slots.source = { from: 'attributes', exclude: ['name'] };
            slots.rowFormat.style = { fontFamily: 'mono', fontSize: 11, color: QUIET };
            compartments.push(slots);
        }
        const filter = childFilter(v.classId);
        if (filter) {
            compartments.push({
                id: 'children', source: { from: 'children', filter },
                rowFormat: { segments: [{ kind: 'name' }], style: { fontFamily: 'mono', fontSize: 11 } }, separator: true,
            });
        }
        if (compartments.length > 0) ir.fieldCompartments = compartments;
        return { classId: v.classId, className: v.className, rule: mark ? `generic:${mark}` : 'generic:node', ir };
    });
}

// ---------------------------------------------------------------------------
// Statechart (UML) and Flowchart (ISO 5807) (slices A1 and A3, R-VP-22)
// ---------------------------------------------------------------------------

/** The role a role-keyed document was decided by (`role:<id>`), or undefined for a structure rule. */
const roleOfRule = (rule: string): string | undefined => (rule.startsWith('role:') ? rule.slice('role:'.length) : undefined);

/** The attributes `classId` holds, its own and inherited, cycle-safe. */
function attributesHeld(lookup: Lookup, metamodelId: string): (classId: string) => SketchAttribute[] {
    const sketch = sketchOfMetamodel(lookup, metamodelId);
    const byId = new Map<string, SketchClass>(sketch.classes.map(c => [c.id, c]));
    return (classId: string) => {
        const line: string[] = [];
        const queue = [classId];
        while (queue.length > 0) {
            const c = queue.shift() as string;
            if (line.includes(c)) continue;
            line.push(c);
            for (const s of byId.get(c)?.supers ?? []) queue.push(s);
        }
        return sketch.attributes.filter(a => line.includes(a.owner));
    };
}

/** The name label of the two notations: centred, in the name ink. */
const centredName = (fontSize: number, fontWeight: 'semibold' | 'medium'): LabelSpec =>
    ({ position: 'center', source: NAME_SOURCE(), style: { fontSize, fontWeight, color: NAME_INK } });

/**
 * Statechart (UML), slice A1 (R-VP-22, mockup docs/mockups/derived-viewpoints/statechart-A.svg):
 * the State machine's documents (order, endpoints, labels, rules) with the drawing of the
 * notation picked, whatever the binding says about a Trigger (D, question 1).
 *
 * - A state (Node), the Initial and the Terminal: a white rounded box sized from its content, 1 px
 *   in the name ink, its name centred in 14 px 600 in the ink; the Initial with the entry dot
 *   (`shape.entry: 'dot'`), the Terminal with the double border of R-VP-17. A state holding slots
 *   other than its name keeps the attribute rows of R-VP-17 (3), its name then on top; the
 *   Terminal holds none (a UML final state has no behaviour).
 * - A transition: an arc (`edge.curve: 'arc'`) in the ink, 1 px, the open arrowhead (R-VP-25), labelled by
 *   its event, else its guard (R-VP-17 (2)), in the label style of C2.
 * - Every other document (a class with no role, a fork or join bar) is the State machine's.
 */
export function deriveStatechartViewpointIRs(lookup: Lookup, metamodelId: string, roles: DerivationRoles): DerivedView[] {
    const attributesOf = attributesHeld(lookup, metamodelId);
    const events = triggerClasses(lookup, metamodelId, roles);
    return deriveViewpointIRs(lookup, metamodelId, roles).map((v): DerivedView => {
        // P-2026-10-03-1304 (Q7, Alfonso's A3): an event is the label of the transitions it fires, not a box of its own;
        // the instance stays in the model and in the tree.
        if (v.ir.kind === 'vertex' && events.has(v.classId)) return { ...v, ir: { ...v.ir, visible: false } };
        const role = roleOfRule(v.rule);
        if (v.ir.kind === 'edge') {
            if (role !== 'transition') return v;
            const { source, target, labels } = v.ir.edge;
            const edge: EdgeViewIR['edge'] = {
                source, target, terminations: { sourceEnd: 'none', targetEnd: 'openArrow' }, line: { color: NAME_INK, width: 1 }, curve: 'arc',
            };
            // The label style of C2 for an event; a guard keeps the mono style the base document gives it (P-2026-10-03-1300).
            if (labels?.center) edge.labels = { center: labels.center, style: labels.style ?? EDGE_LABEL_STYLE() };
            return { ...v, ir: { ...v.ir, edge } };
        }
        if (role !== 'node' && role !== 'initial' && role !== 'terminal') return v;
        const compartment = role !== 'terminal' && attributesOf(v.classId).some(a => !isIdentity(a));
        const label = centredName(14, 'semibold');
        if (compartment) label.position = 'top';
        const shape: ShapeSpec = {
            form: 'rounded', fill: SURFACE,
            // A CSS double border draws two lines from a width of 3 (irTypes.ts), as R-VP-17.
            border: role === 'terminal' ? { color: NAME_INK, width: 3, style: 'double' } : { color: NAME_INK, width: 1, style: 'solid' },
            labels: [label],
        };
        if (role === 'initial') shape.entry = 'dot';
        const ir: VertexViewIR = {
            irVersion: IR_VERSION, kind: 'vertex', metaclasses: [v.className], authoringMetaclassPins: { [v.className]: v.classId },
            exclusive: true, label: `View for ${v.className}`, shape,
        };
        // The name label is the title of all three, so the identity slot's row is left out. A slot with no value draws no
        // row (`entry = ` and its dash on every DemoESM state), and a compartment left with none no box (P-2026-10-03-1304, Q9a).
        if (compartment) {
            ir.fieldCompartments = [attributesCompartment(attributesOf(v.classId).some(isIdentity))];
            ir.structure = { emptyBehavior: 'hide' };
        }
        return { ...v, ir };
    });
}

/** The class the bound Trigger reference is typed by, and its subclasses: the events of a state machine. Empty when unbound. */
function triggerClasses(lookup: Lookup, metamodelId: string, roles: DerivationRoles): Set<string> {
    const id = roles.bag.simTrigger;
    const out = new Set<string>();
    if (typeof id !== 'string' || id === '') return out;
    const sketch = sketchOfMetamodel(lookup, metamodelId);
    const type = sketch.references.find(r => r.id === id)?.type;
    if (!type) return out;
    const byId = new Map<string, SketchClass>(sketch.classes.map(c => [c.id, c]));
    const kindOf = (c: string, seen = new Set<string>()): boolean => {
        if (c === type) return true;
        if (seen.has(c)) return false;
        seen.add(c);
        return (byId.get(c)?.supers ?? []).some(x => kindOf(x, seen));
    };
    for (const c of sketch.classes) if (kindOf(c.id)) out.add(c.id);
    return out;
}

/** The name signals of ISO 5807, in their order: the first group a word of the class name is in decides. */
const ISO_FORMS: ReadonlyArray<{ form: 'stadium' | 'parallelogram' | 'diamond'; words: ReadonlySet<string> }> = [
    { form: 'stadium', words: new Set(['start', 'end', 'initial', 'final', 'terminal']) },
    { form: 'parallelogram', words: new Set(['input', 'output', 'read', 'write', 'print', 'io']) },
    { form: 'diamond', words: new Set(['decision', 'choice', 'if', 'branch']) },
];
/** The roles that are a terminator, a stadium, whatever the class is called. */
const ISO_TERMINATOR_ROLES: ReadonlySet<string> = new Set(['initial', 'terminal', 'activityFinal']);

/** The ISO 5807 form of a class: by role, then by the words of its name; a rectangle otherwise. */
export function isoFormOf(role: string | undefined, className: string): 'stadium' | 'parallelogram' | 'diamond' | 'rect' {
    if (role && ISO_TERMINATOR_ROLES.has(role)) return 'stadium';
    const words = nameWords(className);
    return ISO_FORMS.find(g => words.some(w => g.words.has(w)))?.form ?? 'rect';
}

/**
 * Flowchart (ISO 5807), slice A3 (R-VP-22, mockup docs/mockups/derived-viewpoints/flowchart-A-iso5807.svg):
 * the Flowchart's documents with the drawing of the notation, data only.
 *
 * - A node with a role: its ISO form (`isoFormOf`: the Initial, the Terminal and an Activity final a
 *   stadium, then the name signals, a rectangle with the form's 4 px radius otherwise), white, 1 px
 *   in the name ink, its name centred in 13 px 500 in the ink, no compartment.
 * - A flow: today's orthogonal router, 1 px in the ink, the open arrowhead (R-VP-25); its guard the label
 *   through a C2 template, in the C2 label style. A guard that is literally `true` or `false` reads
 *   `yes` or `no`: two more documents for the class, each with a predicate on the guard and priority 1,
 *   so the resolver picks them over the plain one when they hold.
 * - Every other document (a class with no role) is the Flowchart's.
 */
export function deriveIsoFlowchartViewpointIRs(lookup: Lookup, metamodelId: string, roles: DerivationRoles): DerivedView[] {
    const attributesOf = attributesHeld(lookup, metamodelId);
    const guardKey = roles.bag.simGuard;
    const out: DerivedView[] = [];
    for (const v of deriveViewpointIRs(lookup, metamodelId, roles)) {
        const role = roleOfRule(v.rule);
        if (v.ir.kind === 'edge') {
            if (role !== 'transition') { out.push(v); continue; }
            const { source, target } = v.ir.edge;
            const base = (): EdgeViewIR['edge'] => ({
                source, target, terminations: { sourceEnd: 'none', targetEnd: 'openArrow' }, line: { color: NAME_INK, width: 1 },
            });
            const guard = typeof guardKey === 'string' ? attributesOf(v.classId).find(a => a.id === guardKey) : undefined;
            const edge = base();
            // The guard is code, mono as Activity (UML)'s (P-2026-10-03-1300); the yes and no words below keep the label style.
            if (guard) edge.labels = { template: [{ from: 'path', expr: path(guard.name) }], style: ACTIVITY_GUARD_STYLE() };
            out.push({ ...v, ir: { ...v.ir, edge } });
            if (!guard) continue;
            for (const [literal, word] of [['true', 'yes'], ['false', 'no']] as const) {
                const e = base();
                e.labels = { center: { from: 'literal', text: word }, style: EDGE_LABEL_STYLE() };
                out.push({
                    ...v,
                    ir: {
                        ...v.ir, label: `View for ${v.className} (${word})`, edge: e, priority: 1,
                        predicate: { op: 'eq', left: path(guard.name), right: { kind: 'string', value: literal } },
                    },
                });
            }
            continue;
        }
        if (!role) { out.push(v); continue; }
        const ir: VertexViewIR = {
            irVersion: IR_VERSION, kind: 'vertex', metaclasses: [v.className], authoringMetaclassPins: { [v.className]: v.classId },
            exclusive: true, label: `View for ${v.className}`,
            shape: {
                form: isoFormOf(role, v.className), fill: SURFACE, border: { color: NAME_INK, width: 1, style: 'solid' },
                labels: [centredName(13, 'medium')],
            },
        };
        out.push({ ...v, ir });
    }
    return out;
}

// ---------------------------------------------------------------------------
// Activity (UML) (P-2026-09-30-1552, R-VP-26)
// ---------------------------------------------------------------------------

/** The name signals of Activity (UML), in their order: the first group a word of the class name is in decides. */
const ACTIVITY_SIGNALS: ReadonlyArray<{ role: 'initial' | 'activityFinal' | 'decision' | 'fork' | 'join'; words: ReadonlySet<string> }> = [
    { role: 'initial', words: new Set(['initial', 'start']) },
    { role: 'activityFinal', words: new Set(['final', 'end']) },
    { role: 'decision', words: new Set(['decision', 'choice', 'branch', 'merge']) },
    { role: 'fork', words: new Set(['fork']) },
    { role: 'join', words: new Set(['join']) },
];

/** The role the words of a class name give in Activity (UML)'s table (R-VP-26), or undefined. Whole words, as R-VP-19's. */
export function activitySignalRole(className: string): 'initial' | 'activityFinal' | 'decision' | 'fork' | 'join' | undefined {
    const words = nameWords(className);
    return ACTIVITY_SIGNALS.find(g => words.some(w => g.words.has(w)))?.role;
}

/** The initial node: a filled dot of 20 px, drawn as declared (nodes/nodeSizing.ts `defaultBoxFor`, P-2026-09-30-1720). */
const ACTIVITY_INITIAL_SIZE = { width: 20, height: 20 } as const;
/** The activity final: a bull's-eye of 24 px, its inner disc the registry's `dot-large`, 14 px (P-2026-09-30-1720). */
const ACTIVITY_FINAL_SIZE = { width: 24, height: 24 } as const;
/** Decision and merge: a hollow diamond of 36 px. */
const ACTIVITY_DECISION_SIZE = { width: 36, height: 36 } as const;
/**
 * The direction of Activity (UML)'s auto-layout profile (notations.ts `layout`), read here so the fork and join bars
 * follow it (P-2026-10-01-2215, Q7, amends R-VP-26 (2)).
 */
export const ACTIVITY_LAYOUT_DIRECTION = 'DOWN' as const;
/**
 * Fork and join: a bar declared 7 px thick and 120 long, painted 5 by 118 (the wrapper keeps a 1 px border each side).
 * The IR has no orientation and `defaultSize` is per view, so the bar lies across the layout direction: 120 by 7
 * under a flow that runs down (Q7, P-2026-10-01-2215), 7 by 120 under one that runs across. Drawn as declared
 * since P-2026-09-30-1720; 7, not 5, since P-2026-10-01-2230 (R-VP-36).
 */
const ACTIVITY_BAR_SIZE = (ACTIVITY_LAYOUT_DIRECTION as string) === 'DOWN' || (ACTIVITY_LAYOUT_DIRECTION as string) === 'UP'
    ? { width: 120, height: 7 } as const
    : { width: 7, height: 120 } as const;
/** The action: 44 px high, its width from its name; radius 14, clamped at render to half the height (P-2026-09-30-1720). */
const ACTIVITY_ACTION_SIZE = { height: 44 } as const;
const ACTIVITY_ACTION_RADIUS = 14;
/**
 * The guard (P-2026-09-30-1935): mono 11.5 px, normal, slate-700 (`--color-text-secondary`); the edge draws it on a white
 * patch (UnifiedEdge, the Activity flag). The expression is verbatim: `model.[count]` is JjEL's state read, not a bracket.
 */
const ACTIVITY_GUARD_STYLE = (): TextStyle => ({ fontFamily: 'mono', fontSize: 11.5, fontWeight: 'normal', color: 'var(--color-text-secondary)' });

/**
 * Activity (UML), P-2026-09-30-1552 (R-VP-26, docs/discovery/discovery_2026-09-30_activity_uml_notation.md): the
 * Flowchart's documents (order, endpoints, router) drawn as the UML activity diagram, keyed on the dialog's table.
 *
 * - The Initial: a filled circle in the ink, 20 px, no name.
 * - An action (the Node role, and every class that takes it): a white rounded rectangle, 1 px in the ink, radius 14,
 *   44 px high, its name centred in 13 px 500 in the ink, no compartment.
 * - A decision (the notation's own `decision` role): a hollow diamond, 36 px, no name.
 * - Fork and join: a filled bar in the ink, across the layout direction, 120 by 7 px under DOWN (Q7), no name.
 * - The Terminal and an Activity final: a bull's-eye, a white circle of 24 px, 1 px in the ink, the `dot-large` marker
 *   (14 px) in the border colour, no name.
 * - A control flow (the Transition role): the Flowchart's endpoints on today's router, 1 px in the ink, the open
 *   arrowhead (R-VP-25), no label; where its guard is set, a second document with priority 1 draws it as
 *   `[guard]`, verbatim, in mono 11.5 px (P-2026-09-30-1935; the C2 label style before). A template drops only
 *   the literal before an empty value, so the bracket needs its own document, not a template on the plain one.
 * - Every other document (a class with no role) is the Flowchart's.
 */
export function deriveActivityViewpointIRs(lookup: Lookup, metamodelId: string, roles: DerivationRoles): DerivedView[] {
    const attributesOf = attributesHeld(lookup, metamodelId);
    // The decision is no role of the profile, so its document's rule is structural: the table says it.
    const table = roles.classRoles ? rolesFromTable(lookup, metamodelId, roles.classRoles) : null;
    const guardKey = roles.bag.simGuard;
    const out: DerivedView[] = [];
    for (const v of deriveViewpointIRs(lookup, metamodelId, roles)) {
        const role = table ? table.get(v.classId) : roleOfRule(v.rule);
        const label = `View for ${v.className}`;
        if (v.ir.kind === 'edge') {
            if (role !== 'transition') { out.push(v); continue; }
            const { source, target } = v.ir.edge;
            const base = (): EdgeViewIR['edge'] => ({
                source, target, terminations: { sourceEnd: 'none', targetEnd: 'openArrow' }, line: { color: NAME_INK, width: 1 },
            });
            out.push({ ...v, ir: { ...v.ir, edge: base() } });
            const guard = typeof guardKey === 'string' ? attributesOf(v.classId).find(a => a.id === guardKey) : undefined;
            if (!guard) continue;
            const bracketed = base();
            bracketed.labels = {
                template: [{ from: 'literal', text: '[' }, { from: 'path', expr: path(guard.name) }, { from: 'literal', text: ']' }],
                style: ACTIVITY_GUARD_STYLE(),
            };
            out.push({
                ...v,
                ir: { ...v.ir, label: `${label} (guard)`, edge: bracketed, priority: 1, predicate: { op: 'exists', path: path(guard.name) } },
            });
            continue;
        }
        const ink = () => ({ color: NAME_INK, width: 1, style: 'solid' as const });
        let shape: ShapeSpec;
        let size: { width?: number; height?: number };
        if (role === 'initial') {
            shape = { form: 'circle', fill: NAME_INK, border: ink(), labels: [] };
            size = ACTIVITY_INITIAL_SIZE;
        } else if (role === 'terminal' || role === 'activityFinal') {
            shape = { form: 'circle', fill: SURFACE, border: ink(), marker: 'dot-large', labels: [] };
            size = ACTIVITY_FINAL_SIZE;
        } else if (role === 'decision') {
            shape = { form: 'diamond', fill: SURFACE, border: ink(), labels: [] };
            size = ACTIVITY_DECISION_SIZE;
        } else if (role === 'fork' || role === 'join') {
            shape = { form: 'bar', fill: NAME_INK, border: ink(), labels: [] };
            size = ACTIVITY_BAR_SIZE;
        } else if (role === 'node') {
            shape = { form: 'rounded', fill: SURFACE, border: ink(), cornerRadius: ACTIVITY_ACTION_RADIUS, labels: [centredName(13, 'medium')] };
            size = ACTIVITY_ACTION_SIZE;
        } else {
            out.push(v);
            continue;
        }
        const ir: VertexViewIR = {
            irVersion: IR_VERSION, kind: 'vertex', metaclasses: [v.className], authoringMetaclassPins: { [v.className]: v.classId },
            exclusive: true, label, defaultSize: { ...size }, shape,
        };
        out.push({ ...v, ir });
    }
    return out;
}

// ---------------------------------------------------------------------------
// Petri net (classic) (slice A2, R-VP-24)
// ---------------------------------------------------------------------------

/** The marker of 1..4 tokens, by count (markerRegistry.ts, the rows of R-VP-15 (1)); from 5 the place shows the number. */
const TOKEN_MARKERS: readonly string[] = ['dot', 'dots-2', 'dots-3', 'dots-4'];
/** The place of mockup A: a circle of radius 22. */
const CLASSIC_PLACE_SIZE = { width: 44, height: 44 } as const;
/**
 * The Petri transition bar (P-2026-10-03-1300): 56 long and 12 thick, in both Petri notations, so a later lane
 * (the bar turned by its neighbours) reuses the two lengths. Petri net draws it flat (`width` the long one),
 * Petri net (classic) upright.
 */
export const PETRI_BAR_LONG = 56;
export const PETRI_BAR_SHORT = 12;
/**
 * The transition of mockup A: an upright bar, 12×56 since P-2026-10-03-1300 (10×44 before). The IR has no orientation,
 * so the bar is upright for every transition; drawn as declared (nodes/nodeSizing.ts `defaultBoxFor`, P-2026-09-30-1720).
 */
const CLASSIC_BAR_SIZE = { width: PETRI_BAR_SHORT, height: PETRI_BAR_LONG } as const;

/**
 * Petri net (classic), slice A2 (R-VP-24, mockup docs/mockups/derived-viewpoints/petri-A.svg): the Petri
 * net's documents (order, endpoints, rules) with the drawing of the textbook, beside R-VP-16's.
 *
 * - A place (Node): a white circle of 44 px, 1 px in the ink, its name outside below in 13 px 500 in the
 *   ink; the initial marking (the Initial marking role) as one to four dots (`dot`, `dots-2..4`, in the
 *   border ink) and as the number from five, 15 px 600 in the ink; nothing at zero or unset.
 * - A transition: an upright `bar` (`CLASSIC_BAR_SIZE`, 12 by 56) in the catalogue ink (R-VP-15 (4)), its name
 *   outside to the right, in the label style of C2 (12 px 500, the quiet ink).
 * - An arc: an arc (`edge.curve: 'arc'`) in the ink, 1 px, the open arrowhead (R-VP-25); an inhibitor arc
 *   the same, ending in the hollow circle. A weight above 1 (the Arc weight role) is the arc's label, in
 *   the C2 label style: a second document per arc class, a predicate on the weight and priority 1, so the
 *   resolver picks it where it holds, a subclass's own over its superclass's (priority, then specificity).
 * - Every other document (a class with no role, the Terminal) is the Petri net's.
 */
export function deriveClassicPetriViewpointIRs(lookup: Lookup, metamodelId: string, roles: DerivationRoles): DerivedView[] {
    const attributesOf = attributesHeld(lookup, metamodelId);
    /** The name of the attribute a role binds, when `classId` holds it. */
    const bound = (key: string, classId: string): string | undefined => {
        const id = roles.bag[key];
        return typeof id === 'string' && id !== '' ? attributesOf(classId).find(a => a.id === id)?.name : undefined;
    };
    const out: DerivedView[] = [];
    for (const v of deriveViewpointIRs(lookup, metamodelId, roles)) {
        const role = roleOfRule(v.rule);
        const pins = { [v.className]: v.classId };
        const label = `View for ${v.className}`;
        if (v.ir.kind === 'edge') {
            if (role !== 'arc' && role !== 'inhibitorArc') { out.push(v); continue; }
            const { source, target, labels } = v.ir.edge;
            const base = (): EdgeViewIR['edge'] => ({
                source, target,
                terminations: { sourceEnd: 'none', targetEnd: role === 'inhibitorArc' ? 'hollowCircle' : 'openArrow' },
                line: { color: NAME_INK, width: 1 }, curve: 'arc',
            });
            const edge = base();
            if (labels?.center) edge.labels = { center: labels.center, style: EDGE_LABEL_STYLE() };
            out.push({ ...v, ir: { ...v.ir, edge } });
            const weight = bound('simArcWeight', v.classId);
            if (!weight) continue;
            const weighted = base();
            weighted.labels = { center: { from: 'path', expr: path(weight) }, style: EDGE_LABEL_STYLE() };
            out.push({
                ...v,
                ir: {
                    ...v.ir, label: `${label} (weight)`, edge: weighted, priority: 1,
                    predicate: { op: 'gt', left: path(weight), right: { kind: 'number', value: 1 } },
                },
            });
            continue;
        }
        if (role === 'node') {
            const shape: ShapeSpec = {
                form: 'circle', fill: SURFACE, border: { color: NAME_INK, width: 1, style: 'solid' },
                labels: [{ position: 'outside', anchor: 's', source: NAME_SOURCE(), style: { fontSize: 13, fontWeight: 'medium', color: NAME_INK } }],
            };
            const tokens = bound('simInitialMarking', v.classId);
            if (tokens) {
                const t = path(tokens);
                (shape.labels as LabelSpec[]).push({
                    position: 'center', source: { from: 'path', expr: t }, style: { fontSize: 15, fontWeight: 'semibold', color: NAME_INK },
                    visible: { when: { op: 'gt', left: t, right: { kind: 'number', value: TOKEN_MARKERS.length } }, then: true, else: false },
                });
                shape.marker = {
                    rules: TOKEN_MARKERS.map((id, i) => ({ when: { op: 'eq' as const, left: t, right: { kind: 'number' as const, value: i + 1 } }, then: id })),
                    default: '',
                };
            }
            const ir: VertexViewIR = {
                irVersion: IR_VERSION, kind: 'vertex', metaclasses: [v.className], authoringMetaclassPins: pins, exclusive: true, label,
                defaultSize: { ...CLASSIC_PLACE_SIZE }, shape,
            };
            out.push({ ...v, ir });
            continue;
        }
        if (role === 'transition' && v.ir.kind === 'vertex') {
            // The catalogue ink of the Petri bar (R-VP-15 (4)), on the border too: one solid bar.
            const ink = v.ir.shape.fill as string;
            const ir: VertexViewIR = {
                irVersion: IR_VERSION, kind: 'vertex', metaclasses: [v.className], authoringMetaclassPins: pins, exclusive: true, label,
                defaultSize: { ...CLASSIC_BAR_SIZE },
                shape: {
                    form: 'bar', fill: ink, border: { color: ink, width: 1, style: 'solid' },
                    labels: [{ position: 'outside', anchor: 'e', source: NAME_SOURCE(), style: EDGE_LABEL_STYLE() }],
                },
            };
            out.push({ ...v, ir });
            continue;
        }
        out.push(v);
    }
    return out;
}

// ---------------------------------------------------------------------------
// ER (Chen) (slice A4, R-VP-23)
// ---------------------------------------------------------------------------

/** A plain line, the drawing of every Chen connection: no termination, 1 px in the ink, between the handle centres. */
const chenLineEdge = (): EdgeViewIR['edge'] => ({ terminations: { sourceEnd: 'none', targetEnd: 'none' }, line: { color: NAME_INK, width: 1 }, curve: 'arc' });
const eqLiteral = (slot: string, value: string): Predicate => ({ op: 'eq', left: path(slot), right: { kind: 'string', value } });
const anyOf = (preds: Predicate[]): Predicate => (preds.length === 1 ? preds[0] : { op: 'or', args: preds });
/** A slot that holds a value other than 1: a many side. */
const manySlot = (slot: string): Predicate => ({ op: 'and', args: [{ op: 'exists', path: path(slot) }, { op: 'neq', left: path(slot), right: { kind: 'number', value: 1 } }] });

/**
 * ER (Chen), slice A4 (R-VP-23, mockup docs/mockups/derived-viewpoints/er-A-chen.svg): the dialog's
 * table (entity, relationship, attribute, key; erSignals.ts prefills it) over the Generic documents.
 *
 * - An entity: a white rectangle (the `rect`'s own 4 px radius), 1 px in the ink, its name centred in
 *   14 px 600 in the ink; the Generic compartments kept (its contained attribute rows, its slots other
 *   than the name), its name then on top.
 * - A relationship: a `diamond` node, its name inside in 13 px 500, whatever its references; each of
 *   its references into a Chen node is a plain line (a reference-as-edge view on the reference: no
 *   termination, the `arc` of R-VP-22, so straight between the two anchors). Its two references into
 *   entities carry the marks at the entity's end (`edge.labels.targetEnd`, R-VP-23) from the
 *   cardinality (`cardinalityOf`): per reference, one more document per mark, with a predicate over the
 *   slot and priority 1 (priority 2 for `M`), so the resolver picks the one that holds; `1` stays `1`,
 *   a many side is `N`, the second many side of the same relationship `M`.
 * - An attribute that is a node (ERDLanguage): an `ellipse`, its name centred in 13 px 500, underlined
 *   when the key flag holds (`keyFlagOf`, the ir-1.3 `underline`); a key, always underlined. Its owner's
 *   reference to it is a plain line. An attribute the Generic notation draws as a row (MDE ERD, held by
 *   composition) stays that row: Chen's ellipses for contained attributes are out of this slice.
 * - A class with no role keeps its Generic document, so does a class Generic draws as a row.
 */
export function deriveChenViewpointIRs(lookup: Lookup, metamodelId: string, classRoles: Readonly<Record<string, string>>): AnyDerivedView[] {
    const generic = deriveGenericViewpointIRs(lookup, metamodelId);
    const table = rolesFromTable(lookup, metamodelId, classRoles);
    const sketch = sketchOfMetamodel(lookup, metamodelId);
    const byId = new Map<string, SketchClass>(sketch.classes.map(c => [c.id, c]));
    const lineage = (id: string): string[] => {
        const out: string[] = [];
        const queue = [id];
        while (queue.length > 0) {
            const c = queue.shift() as string;
            if (out.includes(c)) continue;
            out.push(c);
            for (const s of byId.get(c)?.supers ?? []) queue.push(s);
        }
        return out;
    };
    const referencesOf = (c: string): SketchReference[] => sketch.references.filter(r => lineage(c).includes(r.owner));

    const rows = new Set(generic.filter(v => v.ir.kind === 'row').map(v => v.classId));
    const roleOf = (c: string): string | undefined => (rows.has(c) ? undefined : table.get(c));
    const entities = sketch.classes.map(c => c.id).filter(c => roleOf(c) === 'entity');
    /** A reference drawn as a Chen line: into a class Chen draws as a node, any kind of it included. */
    const isChenNode = (c: string) => roleOf(c) === 'entity' || roleOf(c) === 'relationship' || roleOf(c) === 'attribute' || roleOf(c) === 'key';
    const typeIsNode = (r: SketchReference) => byId.has(r.type) && sketch.classes.some(k => lineage(k.id).includes(r.type) && isChenNode(k.id));

    const out: AnyDerivedView[] = [];
    for (const v of generic) {
        const role = roleOf(v.classId);
        if (!role || v.ir.kind === 'row') { out.push(v); continue; }
        const pins = { [v.className]: v.classId };
        const vertex = (shape: ShapeSpec): VertexViewIR => ({
            irVersion: IR_VERSION, kind: 'vertex', metaclasses: [v.className], authoringMetaclassPins: pins, exclusive: true,
            label: `View for ${v.className}`, shape,
        });
        const lineDoc = (reference: string, over: Partial<EdgeViewIR> = {}, suffix = ''): EdgeViewIR => ({
            irVersion: IR_VERSION, kind: 'edge', metaclasses: [v.className], authoringMetaclassPins: pins, exclusive: true,
            label: `View for ${v.className}.${reference}${suffix}`, reference, ...over, edge: over.edge ?? chenLineEdge(),
        });
        const border = { color: NAME_INK, width: 1, style: 'solid' as const };

        if (role === 'entity') {
            const compartments = v.ir.kind === 'vertex' ? v.ir.fieldCompartments : undefined;
            const name = centredName(14, 'semibold');
            if (compartments) name.position = 'top';
            const ir = vertex({ form: 'rect', fill: SURFACE, border, labels: [name] });
            if (compartments) ir.fieldCompartments = compartments;
            out.push({ classId: v.classId, className: v.className, rule: 'chen:entity', ir });
        } else if (role === 'relationship') {
            out.push({ classId: v.classId, className: v.className, rule: 'chen:relationship', ir: vertex({ form: 'diamond', fill: SURFACE, border, labels: [centredName(13, 'medium')] }) });
        } else {
            const label = centredName(13, 'medium');
            const flag = role === 'attribute' ? keyFlagOf(lookup, metamodelId, v.classId) : undefined;
            if (role === 'key') label.style = { ...label.style, underline: true };
            else if (flag) label.style = { ...label.style, underline: { when: { op: 'eq', left: path(flag), right: { kind: 'boolean', value: true } }, then: true } };
            out.push({ classId: v.classId, className: v.className, rule: `chen:${role}`, ir: vertex({ form: 'ellipse', fill: SURFACE, border, labels: [label] }) });
        }

        // The lines: every reference of an entity or a relationship into a Chen node.
        if (role !== 'entity' && role !== 'relationship') continue;
        const ends = role === 'relationship' ? relationshipEnds(lookup, metamodelId, v.classId, entities) : null;
        const cardinality = ends ? cardinalityOf(lookup, metamodelId, v.classId, ends) : null;
        /** Per end: [mark, predicate, priority], in the order the marks first appear. */
        const marksOf = (i: 0 | 1): [string, Predicate, number][] => {
            if (!cardinality) return [];
            if (cardinality.kind === 'ends') {
                const own = cardinality.slots[i];
                if (!own) return [];
                const one: [string, Predicate, number] = ['1', { op: 'eq', left: path(own), right: { kind: 'number', value: 1 } }, 1];
                const other = cardinality.slots[0];
                if (i === 0 || !other) return [one, ['N', manySlot(own), 1]];
                // `M` holds where `N` does too: its priority, not its place, puts it first.
                return [one, ['N', manySlot(own), 1], ['M', { op: 'and', args: [manySlot(own), manySlot(other)] }, 2]];
            }
            const marks = new Map<string, string[]>();
            for (const l of cardinality.literals) {
                const side = l.ends[i];
                if (!side) continue;
                const mark = side === 'one' ? '1' : i === 1 && l.ends[0] === 'many' ? 'M' : 'N';
                marks.set(mark, [...(marks.get(mark) ?? []), l.name]);
            }
            return [...marks].map(([mark, names]) => [mark, anyOf(names.map(n => eqLiteral(cardinality.slot, n))), 1]);
        };
        for (const r of referencesOf(v.classId)) {
            if (!typeIsNode(r)) continue;
            out.push({ classId: v.classId, className: v.className, rule: 'chen:line', ir: lineDoc(r.name) });
            const i = ends ? ends.findIndex(e => e.id === r.id) : -1;
            if (i < 0) continue;
            for (const [mark, predicate, priority] of marksOf(i as 0 | 1)) {
                const edge: EdgeViewIR['edge'] = { ...chenLineEdge(), labels: { targetEnd: { from: 'literal', text: mark }, style: EDGE_LABEL_STYLE() } };
                out.push({ classId: v.classId, className: v.className, rule: 'chen:cardinality', ir: lineDoc(r.name, { priority, predicate, edge }, ` (${mark})`) });
            }
        }
    }
    return out;
}

/**
 * The documents «Derive viewpoint» creates (R-VP-19): with a role bound, the role-keyed
 * notations of R-VP-15..17, byte for byte; with none, the generic structural notation.
 * The notation dialog of slice D makes the choice explicit (`notations.ts`): Generic
 * passes `null`, a role notation the binding its table gives (R-VP-21).
 */
export function deriveViewpointForBinding(lookup: Lookup, metamodelId: string, roles: DerivationRoles | null): AnyDerivedView[] {
    if (!roles) return deriveGenericViewpointIRs(lookup, metamodelId);
    // A1 and A3 (R-VP-22): the drawing of the notation picked, over the role-keyed documents.
    if (roles.notation === 'statechart') return deriveStatechartViewpointIRs(lookup, metamodelId, roles);
    if (roles.notation === 'flowchartIso') return deriveIsoFlowchartViewpointIRs(lookup, metamodelId, roles);
    // A2 (R-VP-24): Petri net (classic), over the Petri documents.
    if (roles.notation === 'petriClassic') return deriveClassicPetriViewpointIRs(lookup, metamodelId, roles);
    // R-VP-26: Activity (UML), over the Flowchart documents.
    if (roles.notation === 'activityUml') return deriveActivityViewpointIRs(lookup, metamodelId, roles);
    return deriveViewpointIRs(lookup, metamodelId, roles);
}
