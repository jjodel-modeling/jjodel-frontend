import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Fase 2 — session handle registry that decouples an M1 script's instance handle from
 * the mutable `name` attribute. See docs/discovery/2026-07-07-identity-name-decoupling.md.
 *
 * The command handlers (executeCreate/Set/Delete/RenameInstance) wrap two things: the
 * framework writes (DObject.new / SetFieldAction — joiner-heavy, not loadable in the node
 * test env, same constraint as elementWaiter.test.ts) and the RESOLUTION SEAM (registry +
 * resolveInstanceHandle + findInstanceByName). The seam is where the correctness of the 7
 * scenarios lives, so we drive it directly with a fake store, mocking only
 * `LPointerTargetable.fromPointer` (id -> object) which is the sole joiner touchpoint of
 * `resolveInstanceHandle`.
 */

// Hoisted fake "committed store": id -> resolved instance object.
const store = vi.hoisted(() => new Map<string, any>());

vi.mock('../../joiner', () => ({
    LPointerTargetable: { fromPointer: (id: string) => store.get(id) },
    // The rest are only referenced inside handler bodies we don't call here; stubs let
    // instance.ts load.
    DObject: {},
    DModel: class {},
    DeleteElementAction: {},
    SetFieldAction: {},
    TRANSACTION: (_: string, fn: () => void) => fn(),
    LModel: class {},
    LProject: class {},
    LClass: class {},
}));

import { resolveInstanceHandle, findInstanceByName, describeAmbiguity } from '../executor/commands/instance';
import {
    registerHandle,
    getHandleId,
    hasHandle,
    unregisterHandle,
    renameHandle,
    getReservedHandles,
    clearHandles,
} from '../executor/handleRegistry';

// --- fixtures ---------------------------------------------------------------

function makeInstance(id: string, name: string): any {
    const o = { id, name };
    store.set(id, o);
    return o;
}
function model(objects: any[]): any {
    return { objects, name: 'M1' };
}

beforeEach(() => {
    clearHandles();
    store.clear();
});

// --- 1. Re-key (the bug this fixes) ----------------------------------------

describe('set x.name is innocuous (re-key bug)', () => {
    it('resolves the original handle after its name attribute changed', () => {
        // create instance ... "p1"  → id bound to handle "p1"
        const a = makeInstance('idA', 'p1');
        registerHandle('p1', 'idA');
        const m = model([a]);

        // set p1.name = "clk" → the committed name attribute becomes "clk"
        a.name = 'clk';

        // subsequent command `set p1.direction = ...` still resolves via the handle
        expect(resolveInstanceHandle(m, 'p1').value).toBe(a);
        // whereas the old name-based lookup can no longer find "p1" (the source of the bug)
        expect(findInstanceByName(m, 'p1')).toEqual([]);
    });
});

// --- 2. Duplicate domain names ---------------------------------------------

describe('duplicate name attributes are expressible and addressable', () => {
    it('keeps two distinct handles addressable even when both name = "clk"', () => {
        const a = makeInstance('idA', 'clk_a');
        const b = makeInstance('idB', 'clk_b');
        registerHandle('clk_a', 'idA');
        registerHandle('clk_b', 'idB');
        a.name = 'clk';
        b.name = 'clk';
        const m = model([a, b]);

        expect(resolveInstanceHandle(m, 'clk_a').value).toBe(a);
        expect(resolveInstanceHandle(m, 'clk_b').value).toBe(b);
        expect(m.objects.filter((o: any) => o.name === 'clk')).toHaveLength(2);
    });
});

// --- 3. Delete frees the handle; stale entries self-heal --------------------

describe('delete frees the handle', () => {
    it('makes the handle unresolvable and reusable after delete', () => {
        const a = makeInstance('idA', 'p1');
        registerHandle('p1', 'idA');
        let m = model([a]);

        // delete instance p1
        unregisterHandle('p1');
        store.delete('idA');
        m = model([]);

        expect(resolveInstanceHandle(m, 'p1').ok).toBe(false); // `set p1.x` would now error
        expect(resolveInstanceHandle(m, 'p1').value).toBeUndefined();
        expect(hasHandle('p1')).toBe(false);

        // recreate "p1" → fresh id, resolves the new object
        const a2 = makeInstance('idA2', 'p1');
        registerHandle('p1', 'idA2');
        m = model([a2]);
        expect(resolveInstanceHandle(m, 'p1').value).toBe(a2);
    });

    it('self-heals a stale registry entry whose object no longer exists', () => {
        registerHandle('ghost', 'idGone'); // idGone never added to the store
        const m = model([]);
        expect(resolveInstanceHandle(m, 'ghost').ok).toBe(false);
        expect(hasHandle('ghost')).toBe(false); // entry cleaned up
    });
});

// --- 4. Rename moves the handle, keeps the id ------------------------------

describe('rename moves the handle', () => {
    it('resolves the new handle and not the old one', () => {
        const a = makeInstance('idA', 'p1');
        registerHandle('p1', 'idA');

        renameHandle('p1', 'p2');
        a.name = 'p2';
        const m = model([a]);

        expect(hasHandle('p1')).toBe(false);
        expect(resolveInstanceHandle(m, 'p1').ok).toBe(false);
        expect(resolveInstanceHandle(m, 'p2').value).toBe(a);
        expect(getHandleId('p2')).toBe('idA'); // same id preserved
    });
});

// --- 5. Pre-existing instances resolve via fallback ------------------------

describe('pre-existing instances (not created this run)', () => {
    it('resolves by name via the fallback when no handle is registered', () => {
        const z = makeInstance('idZ', 'preexisting');
        const m = model([z]); // not registered
        expect(resolveInstanceHandle(m, 'preexisting').value).toBe(z);
    });
});

// --- 6. Registry wins over a pre-existing same-name instance ---------------

describe('registry precedence', () => {
    it('resolves the script instance when a handle collides with a pre-existing name', () => {
        const pre = makeInstance('idZ', 'x');  // pre-existing, unregistered
        const script = makeInstance('idW', 'x'); // created this run, handle "x"
        registerHandle('x', 'idW');
        const m = model([pre, script]);
        const r = resolveInstanceHandle(m, 'x');
        expect(r.ok).toBe(true);
        expect(r.value).toBe(script);
        // AND the list was never consulted: a registered handle is id-based, so the two
        // homonyms in `objects` cannot make it ambiguous. This is the contrast that shows
        // the ambiguity branch lives on the FALLBACK only.
        expect(r.candidates).toBeUndefined();
        expect(findInstanceByName(m, 'x')).toHaveLength(2);
    });
});

// --- 7. handleRegistry primitive operations --------------------------------

describe('handleRegistry primitives', () => {
    it('register / get / has / reserved / rename / unregister / clear', () => {
        expect(getReservedHandles().size).toBe(0);

        registerHandle('a', '1');
        registerHandle('b', '2');
        expect(getHandleId('a')).toBe('1');
        expect(hasHandle('b')).toBe(true);
        expect(getReservedHandles()).toEqual(new Set(['a', 'b']));

        renameHandle('a', 'c');
        expect(hasHandle('a')).toBe(false);
        expect(getHandleId('c')).toBe('1');

        renameHandle('missing', 'z'); // no-op on unknown handle
        expect(hasHandle('z')).toBe(false);

        unregisterHandle('b');
        expect(hasHandle('b')).toBe(false);

        clearHandles();
        expect(getReservedHandles().size).toBe(0);
    });
});

// --- 8. Ambiguity is declared, never resolved (R-S1-3) ----------------------

describe('ambiguous names are declared, not resolved', () => {
    it('refuses to pick one of two pre-existing homonyms, and names both', () => {
        // Neither is registered: this is the pre-existing-instance fallback, the only
        // path on which ambiguity is reachable (§3.1 of the S1b discovery).
        const a = makeInstance('idA', 'clk');
        const b = makeInstance('idB', 'clk');
        a.instanceof = { name: 'Port' };
        b.instanceof = { name: 'Signal' };
        const m = model([a, b]);

        const r = resolveInstanceHandle(m, 'clk');
        expect(r.ok).toBe(false);
        expect(r.value).toBeUndefined();          // nothing is picked
        expect(r.candidates).toHaveLength(2);
        expect(r.candidates!.map(c => c.className).sort()).toEqual(['Port', 'Signal']);
        expect(r.candidates!.map(c => c.id).sort()).toEqual(['idA', 'idB']);
        // The metaclass, not a containment path: both candidates are roots of the same
        // model, so the path would print the same line twice (§5).
        expect(r.reason).toContain('Port (idA)');
        expect(r.reason).toContain('Signal (idB)');
    });

    it('a name carried by exactly one instance stays resolved (contrast)', () => {
        const a = makeInstance('idA', 'clk');
        const b = makeInstance('idB', 'other');
        const m = model([a, b]);

        const r = resolveInstanceHandle(m, 'clk');
        expect(r.ok).toBe(true);
        expect(r.value).toBe(a);
        expect(r.candidates).toBeUndefined();
    });

    it('distinguishes "no such name" from "several" by candidates, not by the message', () => {
        const m = model([makeInstance('idA', 'clk')]);
        const absent = resolveInstanceHandle(m, 'nope');
        expect(absent.ok).toBe(false);
        expect(absent.candidates).toBeUndefined();   // 0 matches: not the ambiguous case
        expect(absent.reason).toContain("No instance named 'nope'");
    });

    it('degrades to the bare id when the metaclass cannot be read', () => {
        const a = makeInstance('idA', 'clk');   // no `instanceof` at all
        const b = makeInstance('idB', 'clk');
        const m = model([a, b]);

        const r = resolveInstanceHandle(m, 'clk');
        expect(r.candidates!.every(c => c.className === '')).toBe(true);
        expect(r.reason).toContain('idA, idB');     // no empty parentheses
    });

    it('describeAmbiguity is one builder, so five commands cannot drift', () => {
        const copy = describeAmbiguity('clk', [
            { id: 'Pointer_1', className: 'Config' },
            { id: 'Pointer_2', className: 'AllNine' },
        ]);
        expect(copy).toBe(
            "Ambiguous instance name 'clk': 2 candidates — Config (Pointer_1), AllNine (Pointer_2). "
            + 'Rename one, or address it from the canvas.'
        );
    });
});
