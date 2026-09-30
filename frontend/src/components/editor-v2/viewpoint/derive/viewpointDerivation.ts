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
 *   italic, and draws no token marks; a transition is a `bar` in the catalogue
 *   ink with its name centred in the name ink, drawn over the bar where it does
 *   not fit; an arc and an inhibitor arc are a 1 px line in the same ink, on the
 *   default (orthogonal) router, the arc ending in the filled arrowhead. With no
 *   role bound every class keeps the structure's box.
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
 *   edges of the structure-only derivation, in the name ink with the filled
 *   arrowhead, labelled by one text source or by a template, the label in the
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
 *   for the caller and the tests, and never written.
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

type Lookup = Record<string, any>;

/** A simulation role binding: the bag a run reads, and the shape of its profile. */
export interface DerivationRoles {
    /** Role keys (`simNode`, `simTransition`, …) to element ids, as `simBridge.runBag` gives them. */
    readonly bag: Readonly<Record<string, unknown>>;
    /** Under `petri` the Transition role is a vertex (a bar), under `controlFlow` an edge. */
    readonly shape: ProfileShape;
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

/** The attribute rows, as `defaultObjectViewIR` writes them; a new object per view, nothing shared. */
const attributesCompartment = (): FieldCompartmentSpec => ({
    id: 'attributes',
    source: { from: 'attributes' },
    rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }] },
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
    const roleOf = (c: string): string | undefined => {
        for (const { role, key } of CLASS_ROLES) {
            const v = roleValue(key);
            if (v && isKind(c, v)) return role;
        }
        return undefined;
    };
    /** The control-flow notation (V1) is keyed on the roles: the Node role bound under the shape. */
    const flow = shape === 'controlFlow' && roleValue('simNode') !== undefined;
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
                // The inhibitor keeps the open arrowhead until a circle termination exists (lane 3).
                // No routing: the default orthogonal router (R-VP-16).
                if (role === 'arc') edge.terminations = { sourceEnd: 'none', targetEnd: 'closedArrow' };
                edge.line = { color: NAME_INK, width: 1 };
            }
            if (flow && role === 'transition') {
                // One part only: `event [guard] / action` needs a template the IR lacks (V4).
                const labelled = boundReference('simTrigger', c.id) ?? boundAttribute('simGuard', c.id);
                if (labelled) edge.labels = { center: { from: 'path', expr: path(labelled) } };
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
        const nameless = bullseye || bar || (flow && role === 'initial' && !stateMachine);
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
        if (bar) shapeSpec.form = 'bar';
        // A CSS double border draws two lines from a width of 3 (irTypes.ts).
        if (terminalBox) shapeSpec.border = { color: NAME_INK, width: 3, style: 'double' };
        const form = shapeSpec.form as string;
        const solid = preset?.values.fill !== undefined;
        const boxed = !NO_COMPARTMENT.has(form) && !solid;
        // A final state holds no behaviour (UML), so the Terminal box takes no compartment.
        const compartment = boxed && !terminalBox && attributesOf(c.id).length > 0;
        shapeSpec.labels = [{ position: boxed ? (flow && !compartment ? 'center' : 'top') : 'bottom', source: { from: 'intrinsic', prop: 'name' } }];
        // A label sits inside the shape at every position, so on the ink it takes the
        // text-on-dark token (measured on the lane probe: the default text did not read).
        if (solid) shapeSpec.labels[0].style = { color: INVERSE_TEXT };
        // The Petri names sit centred on the shape (R-VP-16), in the regular weight the
        // centre position would otherwise make bold (irStyle.ts). The place's is italic;
        // the transition's takes the name ink, since it is drawn over the bar and past it.
        if (petriPlace) shapeSpec.labels[0] = { position: 'center', source: shapeSpec.labels[0].source, style: { fontStyle: 'italic', fontWeight: 'normal' } };
        if (petriTransition) shapeSpec.labels[0] = { position: 'center', source: shapeSpec.labels[0].source, style: { color: NAME_INK, fontWeight: 'normal' } };
        if (nameless) shapeSpec.labels = [];

        const ir: VertexViewIR = {
            irVersion: IR_VERSION, kind: 'vertex', metaclasses: [c.name], authoringMetaclassPins: pins, exclusive: true, label,
            shape: shapeSpec,
        };
        if (compartment) ir.fieldCompartments = [attributesCompartment()];
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
 *   line in the name ink ending in the filled arrowhead. The label is the first plain
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
            const edge: EdgeViewIR['edge'] = { source, target, terminations: { sourceEnd: 'none', targetEnd: 'closedArrow' } };
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

/**
 * The documents «Derive viewpoint» creates (R-VP-19): with a role bound, the role-keyed
 * notations of R-VP-15..17, byte for byte; with none, the generic structural notation.
 * The notation dialog of slice D will make the choice explicit.
 */
export function deriveViewpointForBinding(lookup: Lookup, metamodelId: string, roles: DerivationRoles | null): AnyDerivedView[] {
    return roles ? deriveViewpointIRs(lookup, metamodelId, roles) : deriveGenericViewpointIRs(lookup, metamodelId);
}
