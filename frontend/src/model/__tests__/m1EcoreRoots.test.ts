/**
 * E2 «Cannot serialize in ecore, found loop» (P-2026-10-05-1648; docs/discovery/discovery_2026-10-04_console_errors_demo.md §3).
 *
 * `LModel.get_roots` returns every object of an M1 model (its `isRoot` filter is commented out), so the M1 branch of
 * `LModel.generateEcoreJson_impl` meets a contained object again as a «root», after writing it inside its container:
 * the visited set fires on a revisit, not on a cycle. The fix skips an object that is not a root.
 *
 * `LModelElement.tsx` does not load under this bench through the real joiner (`window is not defined` via the
 * monaco import, CLAUDE.md §17), so the joiner and the file's other imports are reduced to stubs and the two real
 * serializers run on a hand-built model: `LModel.generateEcoreJson_impl` and `LObject.generateEcoreJson_impl`.
 * A value serializes its contained objects with the same visited set, as `LValue.generateEcoreJson_impl` does.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
    const g: any = globalThis;
    g.window = g.window || {};
    // Any name the module reads at load: a constructible, callable stub; a decorator returns its class.
    const stub = (name: string): any => {
        const f: any = function (this: any, ...args: any[]) {
            if (new.target) return;
            if (typeof args[0] === 'function') return args[0];
            return stub(name + '()');
        };
        return new Proxy(f, {
            get(t, k) {
                if (k in t) return t[k];
                if (typeof k === 'symbol') return undefined;
                return (t[k] = stub(name + '.' + String(k)));
            },
        });
    };
    const errors: string[] = [];
    const stubs = (names: string[], own: Record<string, any> = {}) => { for (const k of names) own[k] ??= stub(k); return own; };
    return { stub, stubs, errors };
});

vi.mock('../../joiner', () => h.stubs([
    'Abstract', 'Any', 'Constructor', 'Constructors', 'DPointerTargetable', 'DState', 'Defaults', 'Function2',
    'Instantiable', 'L', 'Leaf', 'LEdge', 'LEdgePoint', 'LGraph', 'LGraphElement', 'LPointerTargetable', 'LVertex',
    'LVoidVertex', 'Node', 'Pointers', 'PointedBy', 'RuntimeAccessible', 'RuntimeAccessibleClass', 'Selectors',
    'SetFieldAction', 'SetRootFieldAction', 'ShortAttribETypes', 'ShortAttribSuperTypes', 'TRANSACTION',
    'TargetableProxyHandler', 'U', 'UX', 'Uarr', 'Uobj', 'Debug', 'DEdge', 'EcoreXmiTags', 'getWParams', 'GraphSize',
    'orArr', 'unArr', 'store', 'windoww'
], {
    Log: { exx: (msg: string) => { h.errors.push(msg); return { className: 'MyError' }; }, ee: () => undefined, ww: () => undefined, w: () => undefined, e: () => undefined, exDev: () => undefined, eDevv: () => undefined },
}));
vi.mock('../../redux/action/action', () => ({ AFTER_UPDATE: () => undefined }));
vi.mock('../../api/data', () => h.stubs(['AccessModifier', 'ECoreAnnotation', 'ECoreAttribute', 'ECoreClass', 'ECoreEnum', 'ECoreLiteral',
    'ECoreOperation', 'ECorePackage', 'EcoreParser', 'ECoreReference', 'ECoreRoot']));
vi.mock('../logicWrapper/PointerDefinitions', () => h.stubs(['ValuePointers']));
vi.mock('../../joiner/classes', () => h.stubs(['transientProperties']));
vi.mock('../logicWrapper/nameUniqueness', () => h.stubs(['checkNameUniqueness', 'checkM2NameUniqueness', 'getNamespaceOf', 'm2KindOf']));
vi.mock('../nameLookup', () => h.stubs(['lookupNamedEntry', 'uniqueModelName']));
vi.mock('../classifierKindRules', () => h.stubs(['isClassKind', 'isTypeKindAllowed', 'isDataTypeExtendsWriteAllowed']));
vi.mock('../../components/Toast', () => h.stubs(['toast']));
vi.mock('../conformance/ConformanceGuard', () => h.stubs(['checkObjectCreation', 'checkLinkCreation', 'checkValueAssignment', 'emitGuardViolation']));
vi.mock('../../common/Dummy', () => h.stubs(['Dummy']));
vi.mock('../attributeTypeInference', () => h.stubs(['inferAttributeType']));

import { LModel, LObject } from '../logicWrapper/LModelElement';

const LOOP = 'Cannot serialize in ecore, found loop';
const modelImpl = (LModel.prototype as any).generateEcoreJson_impl;
const objectImpl = (LObject.prototype as any).generateEcoreJson_impl;

type Obj = { id: string; name: string; cls: string; isRoot: boolean; contains: Obj[] };
let visits: Record<string, number> = {};

/** An L-proxy stand-in: the getters the two serializers read, and generateEcoreJson routed to the real LObject one. */
function proxyOf(o: Obj): any {
    const p: any = {
        id: o.id, isRoot: o.isRoot, ecoreRootName: 'urn:demo:' + o.cls,
        instanceof: { father: { uri: 'urn:demo', name: 'demo' } },
        features: [
            { name: 'name', instanceof: {}, generateEcoreJson: () => o.name },
            ...(o.contains.length ? [{ name: 'transitions', instanceof: {},
                generateEcoreJson: (lo: any, deep: boolean, cross: boolean) => o.contains.map((x) => proxyOf(x).generateEcoreJson(lo, deep, cross)) }] : []),
        ],
        generateEcoreJson(lo: any = {}, deep = true, cross = true) {
            visits[o.id] = (visits[o.id] || 0) + 1;
            return objectImpl.call(Object.create(LObject.prototype), { data: { id: o.id }, proxyObject: p }, lo, deep, cross);
        },
    };
    return p;
}

/** The M1 model as `get_roots` returns it today: every object, the contained ones included. */
function serialize(objects: Obj[]): any {
    const roots = objects.map(proxyOf);
    return modelImpl.call(Object.create(LModel.prototype), { data: { id: 'm1', isMetamodel: false }, proxyObject: { roots } }, {}, true, true);
}

describe('LModel.generateEcoreJson_impl — the M1 root loop serializes roots only', () => {
    beforeEach(() => { h.errors.length = 0; visits = {}; });

    // A PEST-like model: a State root containing a Transition, an Event root; roots lists the Transition too.
    const t1: Obj = { id: 't1', name: 't1', cls: 'Transition', isRoot: false, contains: [] };
    const locked: Obj = { id: 'locked', name: 'locked', cls: 'State', isRoot: true, contains: [t1] };
    const coin: Obj = { id: 'coin', name: 'coin', cls: 'Event', isRoot: true, contains: [] };

    it('a contained object listed among the roots: no loop error, and each object serialized once', () => {
        // The contained object sits between two roots, so the roots after it are still reached.
        const json = serialize([locked, t1, coin]);
        expect(h.errors.filter((e) => e === LOOP)).toEqual([]);
        expect(visits).toEqual({ locked: 1, coin: 1, t1: 1 });
        expect(json['urn:demo:State'].transitions).toEqual([{ name: 't1' }]);
        expect(json['urn:demo:Event'].name).toBe('coin');
        expect(json['urn:demo:Transition']).toBeUndefined();
    });

    it('a model without containment serializes every root, as before', () => {
        const json = serialize([coin]);
        expect(h.errors).toEqual([]);
        expect(json['urn:demo:Event'].name).toBe('coin');
    });

    it('positive control: a genuine revisit inside one root still fires the loop check', () => {
        const self: Obj = { id: 'self', name: 'self', cls: 'State', isRoot: true, contains: [] };
        self.contains.push(self);
        serialize([self]);
        expect(h.errors).toContain(LOOP);
    });
});
