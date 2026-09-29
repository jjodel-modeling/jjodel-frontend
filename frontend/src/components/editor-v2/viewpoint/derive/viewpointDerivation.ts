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
import type { EdgeViewIR, FieldCompartmentSpec, ShapeSpec, VertexViewIR } from '../ir/irTypes';
import { sketchOfMetamodel } from '../../sim/metamodelSketch';
import { SKETCH_TYPE } from '../../../../model/simulation/profileBinder';
import type { SketchClass, SketchReference } from '../../../../model/simulation/profileBinder';
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

const IR_VERSION = 'ir-1.2';
const SURFACE = 'var(--color-inode-surface)';
const BORDER = 'var(--color-inode-border)';
const INVERSE_TEXT = 'var(--color-text-inverse)';

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
    const roleOf = (c: string): string | undefined => {
        for (const { role, key } of CLASS_ROLES) {
            const v = roleValue(key);
            if (v && isKind(c, v)) return role;
        }
        return undefined;
    };

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
            out.push({
                classId: c.id, className: c.name, rule: e.rule,
                ir: { irVersion: IR_VERSION, kind: 'edge', metaclasses: [c.name], authoringMetaclassPins: pins, exclusive: true, label, edge },
            });
            continue;
        }

        const presetId = role ? ROLE_PRESET[shape][role] : undefined;
        const preset = presetId ? getCatalogPreset(presetId) : undefined;
        // The border token goes in first: applyPresetToShape keeps the author's border colour.
        let shapeSpec: ShapeSpec = { form: 'rounded', fill: SURFACE, border: { color: BORDER, width: 1, style: 'solid' } };
        if (preset) shapeSpec = applyPresetToShape(shapeSpec, preset);
        const form = shapeSpec.form as string;
        const solid = preset?.values.fill !== undefined;
        const boxed = !NO_COMPARTMENT.has(form) && !solid;
        shapeSpec.labels = [{ position: boxed ? 'top' : 'bottom', source: { from: 'intrinsic', prop: 'name' } }];
        // A label sits inside the shape at every position, so on the ink it takes the
        // text-on-dark token (measured on the lane probe: the default text did not read).
        if (solid) shapeSpec.labels[0].style = { color: INVERSE_TEXT };

        const ir: VertexViewIR = {
            irVersion: IR_VERSION, kind: 'vertex', metaclasses: [c.name], authoringMetaclassPins: pins, exclusive: true, label,
            shape: shapeSpec,
        };
        if (boxed && attributesOf(c.id).length > 0) ir.fieldCompartments = [attributesCompartment()];
        out.push({ classId: c.id, className: c.name, rule: preset ? `role:${role}` : 'structure:default', ir });
    }
    return out;
}
