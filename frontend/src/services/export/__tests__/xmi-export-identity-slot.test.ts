import { describe, it, expect, vi } from 'vitest';

// P-2026-11-07-1230 (#656, R-TXT-58): the XMI export reads a never-written identity slot as the
// core's get_values reads it. These tests EXECUTE serializeFeatures on duck-typed L objects; the
// joiner barrel is replaced by stubs (same convention as xmi-import-skip.test.ts), so the suite
// runs on `environment: 'node'` without the barrel's window/monaco imports.

vi.mock('../../../joiner', () => new Proxy({}, {
    get: (_t, k) => (k === 'then' ? undefined
        : k === 'store' ? { getState: () => ({ idlookup: {} }) }
        : class Stub { static cname = String(k); }),
    has: () => true,
}));

type AnyObj = Record<string, any>;

const NAME = { className: 'DAttribute', name: 'name', upperBound: 1, type: { name: 'EString' } };
const LABEL = { className: 'DAttribute', name: 'label', upperBound: 1, type: { name: 'EString' } };

function slot(meta: AnyObj, raw: any[]): AnyObj {
    return { instanceof: meta, __raw: { values: raw } };
}

async function attrsOf(owner: AnyObj, features: AnyObj[]): Promise<string[]> {
    const { XMIService } = await import('../XMIService');
    const obj = { name: owner.name, __raw: owner, features };
    const attrs: string[] = [];
    (XMIService as any).serializeFeatures(obj, (p: string) => p, attrs, []);
    return attrs;
}

describe('XMI export — never-written identity slot (#656)', () => {
    it('console create `create instance of C "x"`: slot [], initialName x → name="x"', async () => {
        expect(await attrsOf({ name: 'x', initialName: 'x' }, [slot(NAME, [])])).toEqual(['name="x"']);
    });

    it('canvas create (auto-name): slot [], initialName Module_0 → name="Module_0"', async () => {
        expect(await attrsOf({ name: 'Module_0', initialName: 'Module_0' }, [slot(NAME, [])]))
            .toEqual(['name="Module_0"']);
    });

    it('reads initialName before data.name, as get_values does', async () => {
        expect(await attrsOf({ name: 'old1', initialName: 'Module_0' }, [slot(NAME, [])]))
            .toEqual(['name="Module_0"']);
    });

    it('old saved model with data.name only: slot [] → name="old1"', async () => {
        expect(await attrsOf({ name: 'old1' }, [slot(NAME, [])])).toEqual(['name="old1"']);
    });

    it('a slot written [""] exports no name', async () => {
        expect(await attrsOf({ name: 'x', initialName: 'x' }, [slot(NAME, [''])])).toEqual([]);
    });

    it('a written name is unchanged', async () => {
        expect(await attrsOf({ name: 'h', initialName: 'Module_0' }, [slot(NAME, ['h'])])).toEqual(['name="h"']);
    });

    it('other features unchanged: [] omitted, [""] written', async () => {
        expect(await attrsOf({ name: 'x', initialName: 'x' }, [slot(LABEL, [])])).toEqual([]);
        expect(await attrsOf({ name: 'x', initialName: 'x' }, [slot(LABEL, [''])])).toEqual(['label=""']);
    });

    it('escapes the fallback name', async () => {
        expect(await attrsOf({ name: 'a<b', initialName: '' }, [slot(NAME, [])])).toEqual(['name="a&lt;b"']);
    });
});
