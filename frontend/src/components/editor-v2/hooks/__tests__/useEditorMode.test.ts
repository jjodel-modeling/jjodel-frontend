/**
 * useEditorMode — a superclass link written while the model tab is mounted re-derives modeInfo (P-2026-10-11-1025).
 *
 * MEASURED (report `docs/discovery/discovery_2026-10-11_m1_edge_gesture_subclass_instances.md` §4, HEAD `385058377`):
 * with the metamodel tab and the model tab both open, `extends State` written on Initial, Terminal and an existing
 * Choice left the mounted tab's memo on the pre-link ancestry (`Initial.references = []`,
 * `State.concreteSubclasses = []`), so `getCompatibleReferences` found nothing and the M1 connect gesture returned
 * silently; a reopen re-derived it. The memo's key, `metamodelClassSignature`, did not read `extends`.
 *
 * The subject runs, its world is faked. `react` is stubbed with a hook-slot runtime: `useMemo` keeps its value per
 * slot and recomputes only when a dependency differs by `Object.is`, as React does, and `render()` is one call of
 * the hook. `react-redux`'s `useSelector` reads the fake state. The joiner barrel reaches monaco at import, so it is
 * mocked: `LPointerTargetable.fromPointer` returns an L view built from the fake state at each call, with the reads
 * `resolveM1Info` makes (`allReferences` = own + inherited through `extends`, the L-getter's contract;
 * `extends` as views). The emulated memo is a model of React's, and the control below holds it to memoizing.
 * `compositionCompat.ts` is real (pure). Module state: none; the runtime and the state are reset in `beforeEach`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Any = any;

const runtime = { slots: [] as Array<{ value: unknown; deps: unknown[] }>, i: 0 };
const H = vi.hoisted(() => ({ state: { idlookup: {} as Record<string, Any> } }));

vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>();
    return {
        ...actual,
        useMemo: (fn: () => unknown, deps: unknown[]) => {
            const k = runtime.i++;
            const prev = runtime.slots[k];
            if (prev && prev.deps.length === deps.length && prev.deps.every((d, n) => Object.is(d, deps[n]))) return prev.value;
            runtime.slots[k] = { value: fn(), deps };
            return runtime.slots[k].value;
        },
    };
});
vi.mock('react-redux', () => ({ useSelector: (sel: (s: Any) => unknown) => sel(H.state) }));
vi.mock('../../../../joiner', () => {
    const L = () => H.state.idlookup;
    function view(id: string): Any {
        const d = L()[id];
        if (!d) return undefined;
        if (d.className === 'DReference') {
            return {
                id, name: d.name, composition: !!d.composition, aggregation: false, lowerBound: 0, upperBound: d.upperBound ?? -1,
                get type() { return view(d.type); },
            };
        }
        if (d.className === 'DClass') {
            const own = (): Any[] => (d.references ?? []).map(view);
            const inherited = (seen: Set<string>): Any[] => (d.extends ?? []).flatMap((s: string) => {
                if (seen.has(s)) return [];
                seen.add(s);
                const sup = view(s);
                return sup ? [...sup.references, ...sup.inheritedFrom(seen)] : [];
            });
            return {
                id, name: d.name, abstract: !!d.abstract, interface: false, isSingleton: !!d.isSingleton,
                attributes: [], allAttributes: [],
                get references() { return own(); },
                get allReferences() { return [...own(), ...inherited(new Set([id]))]; },
                inheritedFrom: inherited,
                get extends() { return (d.extends ?? []).map(view); },
            };
        }
        return { id, ...d };
    }
    return {
        store: { getState: () => H.state },
        LPointerTargetable: { fromPointer: (id: string) => view(id) },
    };
});

import { useEditorMode, type EditorModeInfo, type MetaclassInfo } from '../useEditorMode';
import { getCompatibleReferences } from '../../utils/compositionCompat';

const MODEL = 'M';
const MM = 'MM';
const PKG = 'P';

/** One call of the hook, as one render of the mounted model tab. */
function render(): EditorModeInfo {
    runtime.i = 0;
    return useEditorMode(MODEL);
}

/** A redux-style write: the touched raw objects are replaced, never mutated. */
function write(patch: Record<string, Any>): void {
    const idlookup = { ...H.state.idlookup };
    for (const [id, fields] of Object.entries(patch)) idlookup[id] = { ...(idlookup[id] ?? {}), ...fields };
    H.state = { ...H.state, idlookup };
}

function addClass(id: string, references: string[] = [], ext: string[] = []): void {
    const pkg = H.state.idlookup[PKG];
    write({ [id]: { className: 'DClass', id, name: id, abstract: false, isSingleton: false, references, attributes: [], extends: ext },
            [PKG]: { classes: [...pkg.classes, id] } });
}

const cls = (info: EditorModeInfo, name: string): MetaclassInfo => {
    const c = info.allClasses.find(x => x.name === name);
    if (!c) throw new Error('no class ' + name);
    return c;
};
const refNames = (info: EditorModeInfo, name: string) => cls(info, name).references.map(r => r.name).sort();
const subNames = (info: EditorModeInfo, name: string) => cls(info, name).concreteSubclasses.map(s => s.name).sort();
/** The decision the M1 branch of EditorV2's onConnectEnd makes, on the hook's output. */
const compatible = (info: EditorModeInfo, source: string, target: string) =>
    getCompatibleReferences(cls(info, source), cls(info, target).id, info.allClasses).map(r => r.ref.name).sort();

beforeEach(() => {
    runtime.slots = [];
    runtime.i = 0;
    H.state = {
        idlookup: {
            [MODEL]: { className: 'DModel', id: MODEL, instanceof: MM },
            [MM]: { className: 'DModel', id: MM, isMetamodel: true, classes: [], packages: [PKG] },
            [PKG]: { className: 'DPackage', id: PKG, classes: [], subpackages: [] },
            outgoing: { className: 'DReference', id: 'outgoing', name: 'outgoing', type: 'Transition', upperBound: 5 },
            substates: { className: 'DReference', id: 'substates', name: 'substates', type: 'State', composition: true },
            source: { className: 'DReference', id: 'source', name: 'source', type: 'State', upperBound: 1 },
            target: { className: 'DReference', id: 'target', name: 'target', type: 'State', upperBound: 1 },
        },
    };
    addClass('State', ['outgoing', 'substates']);
    addClass('Transition', ['source', 'target']);
});

describe('useEditorMode: a superclass link written on a mounted tab', () => {
    it('a class created, then linked to State: the next render carries the inherited references', () => {
        render();
        addClass('Initial');
        expect(refNames(render(), 'Initial')).toEqual([]);
        write({ Initial: { extends: ['State'] } });
        expect(refNames(render(), 'Initial')).toEqual(['outgoing', 'substates']);
    });

    it('a class created, then linked to State: the next render lists it among State\'s concrete subclasses', () => {
        render();
        addClass('Terminal');
        render();
        write({ Terminal: { extends: ['State'] } });
        expect(subNames(render(), 'State')).toEqual(['Terminal']);
    });

    it('a class that existed before the first render, linked later: the gesture finds the State-typed references both ways', () => {
        addClass('Choice');
        const before = render();
        expect(compatible(before, 'Choice', 'Transition')).toEqual([]);
        write({ Choice: { extends: ['State'] } });
        const after = render();
        expect(compatible(after, 'Choice', 'Transition')).toEqual(['outgoing']);
        expect(compatible(after, 'Transition', 'Choice')).toEqual(['source', 'target']);
        expect(compatible(after, 'Choice', 'Choice')).toEqual(['substates']);
    });

    it('Initial to Terminal and the reverse, both linked after the first derivation: substates, a State-typed reference', () => {
        render();
        addClass('Initial');
        addClass('Terminal');
        render();
        write({ Initial: { extends: ['State'] }, Terminal: { extends: ['State'] } });
        const info = render();
        expect(compatible(info, 'Initial', 'Terminal')).toEqual(['substates']);
        expect(compatible(info, 'Terminal', 'Initial')).toEqual(['substates']);
    });

    // Same number of superclasses before and after: kills a signature that counts the links instead of naming them.
    it('a class re-parented from one superclass to another: the next render carries the new superclass\'s references', () => {
        addClass('Pseudo');
        addClass('Initial', [], ['Pseudo']);
        expect(refNames(render(), 'Initial')).toEqual([]);
        write({ Initial: { extends: ['State'] } });
        const info = render();
        expect(refNames(info, 'Initial')).toEqual(['outgoing', 'substates']);
        expect(subNames(info, 'State')).toEqual(['Initial']);
    });

    it('the link removed: the next render drops the inherited references again', () => {
        addClass('Initial', [], ['State']);
        expect(refNames(render(), 'Initial')).toEqual(['outgoing', 'substates']);
        write({ Initial: { extends: [] } });
        expect(refNames(render(), 'Initial')).toEqual([]);
    });
});

describe('useEditorMode: control, the memo memoizes', () => {
    // Without this, a runtime that recomputed on every render would make every test above pass with or without the
    // fix. A store change outside the metamodel keeps modeInfo's identity, as the M1 consumers' memos rely on.
    it('a write outside the metamodel keeps the same modeInfo object', () => {
        const first = render();
        write({ obj1: { className: 'DObject', id: 'obj1', instanceof: 'State' } });
        expect(render()).toBe(first);
    });

    it('State instances are unaffected by a link on another class', () => {
        addClass('Initial');
        render();
        write({ Initial: { extends: ['State'] } });
        const info = render();
        expect(compatible(info, 'State', 'Transition')).toEqual(['outgoing']);
        expect(compatible(info, 'Transition', 'State')).toEqual(['source', 'target']);
    });
});
