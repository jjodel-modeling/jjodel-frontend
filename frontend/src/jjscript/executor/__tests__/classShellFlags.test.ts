/**
 * A class shell reads its flags from the stored field, not through a name that an L proxy resolves to a child
 * (P-2026-11-08-0345; discovery_2026-11-08_dcn_freeze_proxy.md).
 *
 * The D-layer fields are `abstract`, `interface`, `partial`; no getter answers `isAbstract`, `isInterface` or
 * `isPartial`, so on an L proxy those keys fall to `_defaultGetter`, which returns the child of that name
 * (LModelElement.tsx). A metamodel whose class `Classifier` owns an attribute `isAbstract` thus put the live
 * LAttribute in the shell, and `freezeSnapshot` refused the run: «an L proxy at ...superTypes.0.isAbstract».
 *
 * The L layer here is a duck-typed stand-in: a JS Proxy over a class record that answers its own fields and, for
 * any other key, its child of that name (case-insensitive), as `_defaultGetter` does. The children carry
 * `__isProxy`, as the joiner's proxies do. The mocks are those of unsetDefaultLiteral.test.ts.
 */
import { describe, it, expect, vi } from 'vitest';

const h = vi.hoisted(() => ({
    project: null as any,
    metamodel: null as any,
}));

vi.mock('../../../joiner', () => {
    const named: Record<string, any> = {
        DModel: { cname: 'DModel' },
        LPointerTargetable: { fromD: (d: any) => ({ id: d.id, name: d.name }), fromPointer: () => null },
        store: { getState: () => ({ m2models: [], idlookup: {} }) },
        Defaults: { primitiveTypeIds: new Set<string>() },
    };
    return new Proxy(named, {
        get: (t, k) => (k === 'then' ? undefined
            : k in t ? t[k as string]
            : class Stub { static cname = String(k); }),
        has: () => true,
    });
});

vi.mock('../utils', () => ({
    getProject: () => h.project,
    getTargetMetamodel: () => h.metamodel,
}));

import { buildEvalContext } from '../commands/eval';
import { freezeSnapshot } from '../../../model/simulation/guardContext';

/** An attribute child, marked as the joiner marks its proxies. */
const child = (name: string) => ({ __isProxy: true, className: 'DAttribute', id: `a_${name}`, name, upperBound: 1 });

/** A class record behind a stand-in L proxy: own fields first, else the child of that name, as `_defaultGetter`. */
function lClass(record: Record<string, any>): any {
    const children: any[] = record.attributes ?? [];
    return new Proxy(record, {
        get: (t, k) => {
            if (typeof k !== 'string' || k in t) return (t as any)[k];
            return children.find(c => c.name.toLowerCase() === k.toLowerCase());
        },
    });
}

/** `Classifier` owns the three flag-named attributes; `Association` extends it; one package holds both. */
function umlLikeMetamodel(flags: { abstract: boolean; interface: boolean; partial: boolean }): void {
    const classifier = lClass({
        className: 'DClass', id: 'c_Classifier', name: 'Classifier',
        abstract: flags.abstract, interface: flags.interface, partial: flags.partial,
        attributes: [child('isAbstract'), child('isInterface'), child('isPartial')],
        references: [], operations: [], extends: [], allSubclasses: [],
    });
    const association = lClass({
        className: 'DClass', id: 'c_Association', name: 'Association',
        abstract: false, interface: false, partial: false,
        attributes: [], references: [], operations: [], extends: [{ name: 'Classifier' }], allSubclasses: [],
    });
    const pkg = { id: 'p_uml', name: 'uml', uri: '', prefix: '', classes: [classifier, association] };
    h.metamodel = { name: 'uml', classes: [classifier, association], instances: [], enumerators: [], packages: [pkg] };
    h.project = { name: 'p', metamodels: [h.metamodel] };
}

const shell = (globals: Record<string, any>, name: string) => (globals.classes as any[]).find(c => c.name === name);

describe('a class shell reads its flags from the stored field (P-2026-11-08-0345)', () => {
    it('isAbstract, isInterface, isPartial are the stored booleans, not the attributes of that name (kills: the flag read first)', () => {
        umlLikeMetamodel({ abstract: true, interface: false, partial: true });
        const c = shell(buildEvalContext({} as any), 'Classifier');
        expect(c.isAbstract).toBe(true);
        expect(c.isInterface).toBe(false);
        expect(c.isPartial).toBe(true);
    });

    it('each flag follows its own field (kills: a field swapped for another)', () => {
        umlLikeMetamodel({ abstract: false, interface: true, partial: true });
        const c = shell(buildEvalContext({} as any), 'Classifier');
        expect(c.isAbstract).toBe(false);
        expect(c.isInterface).toBe(true);
        expect(c.isPartial).toBe(true);
    });

    it('the package shell reads isAbstract and isInterface the same way (kills: the package read left as it was)', () => {
        umlLikeMetamodel({ abstract: true, interface: false, partial: false });
        const pkg = (buildEvalContext({} as any).packages as any[])[0];
        const c = pkg.classes.find((x: any) => x.name === 'Classifier');
        expect(c.isAbstract).toBe(true);
        expect(c.isInterface).toBe(false);
    });

    it('the globals freeze: no L proxy is reached through Association.superTypes.0 (the refusal of the drone run)', () => {
        umlLikeMetamodel({ abstract: true, interface: false, partial: false });
        const globals = buildEvalContext({} as any);
        expect(shell(globals, 'Association').superTypes[0]).toBe(shell(globals, 'Classifier'));
        expect(() => freezeSnapshot(globals, { id: 'm', name: 'm' })).not.toThrow();
    });
});
