import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { transformSync } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RowValue from '../../nodes/RowValue';
import { detectValueRenderer } from '../../nodes/valueRenderer';
import { namelessTargetLabel, unnamedTargetLabels } from '../namelessTargetLabel';
import { IRFormField } from '../../viewpoint/ir/IRFormField';

// The render bench of D6: the `joiner` barrel pulls monaco, so it is replaced by the one
// export IRFormField reads; the writes are never exercised here.
const RENDER_LOOKUP = vi.hoisted(() => ({
    p_named: { name: 'Port_1', instanceof: { name: 'Port' } },
    p_nameless: { name: '', instanceof: { name: 'Port' } },
} as { [id: string]: any }));
vi.mock('../../../../joiner', () => ({ LPointerTargetable: { fromPointer: (p: any) => RENDER_LOOKUP[p] } }));
vi.mock('../../viewpoint/ir/formWrite', () => ({ appendValue: () => ({}), clearValue: () => ({}), setValue: () => ({}) }));

/**
 * R-TXT-46 D4 — a reference to a nameless object is not broken on the v2-flow canvas.
 *
 * Report: `docs/discovery/discovery_2026-11-04_core_nameless_identity.md` §3.3 (Canvas v2-flow).
 * Both readers used to keep a target only when its L name was truthy, so a target whose name
 * reads '' (R-TXT-45) fell to the broken branch. They now test that the target resolves.
 *
 * Neither file imports under vitest (the `joiner` barrel pulls monaco: `window is not defined`),
 * so the committed source is extracted and executed with its free dependencies injected, the
 * technique of `model/__tests__/unq1AutoNameShadow.test.ts`.
 */

const TRANSFORMERS = path.resolve(__dirname, '../jjomTransformers.ts');
const FORM_FIELD = path.resolve(__dirname, '../../viewpoint/ir/IRFormField.tsx');

function blockAt(src: string, from: number, what: string): string {
    const open = src.indexOf('{', from);
    expect(open, `cannot find the opening of ${what}: update the test`).toBeGreaterThan(-1);
    let depth = 0;
    for (let i = open; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) return src.slice(open + 1, i);
    }
    throw new Error(`unbalanced block in ${what}`);
}

function compile(body: string, params: string[]): Function {
    const ts = `(function (${params.join(', ')}) {\n${body}\n})`;
    const js = transformSync(ts, { loader: 'ts', target: 'es2020' }).code;
    // eslint-disable-next-line no-new-func
    return new Function(`return ${js.replace(/;\s*$/, '')}`)() as Function;
}

// ── jjomTransformers: the reference branch of the object row ────────────────
const tSource = fs.readFileSync(TRANSFORMERS, 'utf8');
const refBranch = (() => {
    const at = tSource.indexOf('const raw: unknown[] = (fv.__raw?.values ?? fv.values ?? []) as unknown[];');
    expect(at, 'the reference branch of jjomTransformers changed: update the test').toBeGreaterThan(-1);
    const tryAt = tSource.lastIndexOf('try {', at);
    return blockAt(tSource, tryAt, 'the reference branch');
})();
const resolveRefs = compile(
    `let values, refTargets, value;\n${refBranch}\nreturn { values, refTargets, value };`,
    ['fv', 'rememberRefTargetName', 'lastSeenRefTargetName', 'namelessTargetLabel'],
) as (fv: any, r: any, l: any, n: typeof namelessTargetLabel) => { values: string[]; refTargets: Array<{ id: string; name: string; label?: string; broken?: boolean }>; value: string };

function rowOf(raw: string[], resolved: Array<{ id: string; name: any; instanceof?: any }>, lastKnown = 'LAST_KNOWN') {
    const remembered: Array<[string, string]> = [];
    const out = resolveRefs(
        { __raw: { values: raw }, values: resolved },
        (id: string, name: string) => { remembered.push([id, name]); },
        (_id: string) => lastKnown,
        namelessTargetLabel,
    );
    return { ...out, remembered };
}

// ── IRFormField: displayValue, the chip label ───────────────────────────────
const fSource = fs.readFileSync(FORM_FIELD, 'utf8');
const SIG = 'function displayValue(raw: unknown): string {';
const displayBody = (() => {
    const at = fSource.indexOf(SIG);
    expect(at, 'the signature of displayValue changed: update the test').toBeGreaterThan(-1);
    return blockAt(fSource, at + SIG.length - 1, 'displayValue');
})();
const displayValueOf = compile(displayBody, ['raw', 'LPointerTargetable', 'namelessTargetLabel']) as (raw: unknown, LPT: any, n: typeof namelessTargetLabel) => string;
const LOOKUP: { [id: string]: any } = { p_named: { name: 'Port_1' }, p_nameless: { name: '', instanceof: { name: 'Port' } } };
const LPT = { fromPointer: (p: any) => LOOKUP[p] };
const displayValue = (raw: unknown) => displayValueOf(raw, LPT, namelessTargetLabel);
/** The chip's broken test, as IRFormField writes it: the label fell through to the pointer. */
const isBrokenChip = (v: string) => displayValue(v) === v;

describe('D4 — jjomTransformers: a nameless target resolves', () => {
    it("a target whose name is '' is not broken", () => {
        const r = rowOf(['p_nameless'], [{ id: 'p_nameless', name: '', instanceof: { name: 'Port' } }]);
        expect(r.refTargets).toEqual([{ id: 'p_nameless', name: '', label: ': Port' }]);
    });

    it('a named target, as before (control)', () => {
        const r = rowOf(['p_named'], [{ id: 'p_named', name: 'Port_1' }]);
        expect(r.refTargets).toEqual([{ id: 'p_named', name: 'Port_1' }]);
        expect(r.value).toBe('Port_1');
    });

    it('a pointer that resolves to nothing is still broken, with the last known name', () => {
        const r = rowOf(['p_gone'], []);
        expect(r.refTargets).toEqual([{ id: 'p_gone', name: 'LAST_KNOWN', broken: true }]);
    });

    it('a mixed row keeps the order and flags only the unresolved pointer', () => {
        const r = rowOf(['p_named', 'p_nameless', 'p_gone'],
            [{ id: 'p_named', name: 'Port_1' }, { id: 'p_nameless', name: '' }]);
        expect(r.refTargets.map(t => !!t.broken)).toEqual([false, false, true]);
    });
});

describe('D4 — IRFormField.displayValue: a nameless target is not a broken chip', () => {
    // R-TXT-47 D6 (C2e) changed the label from '' to `: <Class>`; the chip stays not broken.
    it('a pointer to a nameless object labels `: <Class>` and is not broken', () => {
        expect(displayValue('p_nameless')).toBe(': Port');
        expect(isBrokenChip('p_nameless')).toBe(false);
    });

    it('a named target and an unresolved pointer, as before (control)', () => {
        expect(displayValue('p_named')).toBe('Port_1');
        expect(isBrokenChip('p_gone')).toBe(true);
        expect(displayValue('Running')).toBe('Running');
        expect(displayValue(null)).toBe('');
    });
});

/**
 * R-TXT-47 D5 (C2d, P-2026-11-05-0148) — a nameless target is labelled `: <Class>` on the
 * default view, as its own header reads, instead of an empty slot drawn as a dash.
 * Report: `docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md` §3.3.
 */
const PORT = { name: 'Port' };

describe('D5 — jjomTransformers: a nameless target carries the label `: <Class>`', () => {
    it('three nameless Ports: three labels, the names stay empty, the row is not blank', () => {
        const r = rowOf(['p1', 'p2', 'p3'], ['p1', 'p2', 'p3'].map(id => ({ id, name: '', instanceof: PORT })));
        expect(r.refTargets).toStrictEqual(['p1', 'p2', 'p3'].map(id => ({ id, name: '', label: ': Port' })));
        expect(r.values).toEqual([': Port', ': Port', ': Port']);
        expect(r.value).toBe(': Port, : Port, : Port');
    });

    it('the memory of names is fed the empty name, never the label', () => {
        const r = rowOf(['p1'], [{ id: 'p1', name: '', instanceof: PORT }]);
        expect(r.remembered).toEqual([['p1', '']]);
    });

    it('a named target carries no label (strict: the key is absent)', () => {
        const r = rowOf(['p_named'], [{ id: 'p_named', name: 'Port_1', instanceof: PORT }]);
        expect(r.refTargets).toStrictEqual([{ id: 'p_named', name: 'Port_1' }]);
        expect(r.values).toEqual(['Port_1']);
    });

    it('a nameless target without a readable metaclass falls back to `: Object`', () => {
        const r = rowOf(['p1'], [{ id: 'p1', name: '' }]);
        expect(r.refTargets[0].label).toBe(': Object');
    });

    it('a deleted nameless target keeps the broken path, with no label', () => {
        const r = rowOf(['p_gone'], [], '');
        expect(r.refTargets).toStrictEqual([{ id: 'p_gone', name: '', broken: true }]);
    });

    it('the slot the node builds from those values decides a pill, not a dash', () => {
        const r = rowOf(['p1', 'p2', 'p3'], ['p1', 'p2', 'p3'].map(id => ({ id, name: '', instanceof: PORT })));
        const decision = detectValueRenderer({ value: r.value, values: r.values, isReference: true, isMany: true } as any);
        expect(decision.kind).toBe('refPill');
    });
});

describe('D5 — RowValue paints the label of a nameless target', () => {
    const paint = (targets: any[]) => renderToStaticMarkup(createElement(RowValue as any, {
        decision: { kind: 'refPill', reason: 'test' },
        values: targets.map((t: any) => t.name),
        variant: 'row',
        targets,
    }));

    it('a reference pill shows `: Port` as its text and title', () => {
        const html = paint([{ id: 'p1', name: '', label: ': Port' }]);
        expect(html).toContain('</i>: Port</span>');
        expect(html).toContain('title="Go to : Port"');
    });

    it('a singleton pill target takes the label in its title', () => {
        const html = renderToStaticMarkup(createElement(RowValue as any, {
            decision: { kind: 'refPill', reason: 'test' },
            values: [''],
            variant: 'row',
            targets: [{ id: 'p1', name: '', label: ': Port' }],
            pillTargets: new Map([['p1', 'Port']]),
        }));
        expect(html).toContain('title="Go to : Port"');
    });

    it('a named target still shows its name (control)', () => {
        const html = paint([{ id: 'p2', name: 'Port_1' }]);
        expect(html).toContain('</i>Port_1</span>');
        expect(html).toContain('title="Go to Port_1"');
    });
});

/**
 * R-TXT-47 D6 (C2e, P-2026-11-06-2041) — the same `: <Class>` label on the IR form, through
 * the one helper both readers call. Report: `docs/discovery/discovery_2026-11-06_textual_c2e_ir_chip.md`
 * §3.3: the three readers of `displayValue`, rendered with the `joiner` barrel mocked.
 */
describe('D6 — namelessTargetLabel, the helper', () => {
    it('a nameless target reads `: <Class>`, without a metaclass `: Object`', () => {
        expect(namelessTargetLabel({ name: '', instanceof: { name: 'Port' } })).toBe(': Port');
        expect(namelessTargetLabel({ name: '' })).toBe(': Object');
    });

    it('a named target and a missing one have no label', () => {
        expect(namelessTargetLabel({ name: 'Port_1', instanceof: { name: 'Port' } })).toBeUndefined();
        expect(namelessTargetLabel(undefined)).toBeUndefined();
    });
});

describe('D6 — IRFormField: a nameless target is labelled `: <Class>`', () => {
    const fieldOf = (over: any) => ({
        slotId: 's', name: 'inputs', widget: 'chips', derivedWidget: 'chips', typeName: 'Port',
        lowerBound: 0, upperBound: -1, isMultivalued: true, isRequired: false, isEnum: false,
        isReference: true, isComposition: false, isReadOnly: false, isDerived: false,
        treatment: 'inline', options: [], values: ['p_named', 'p_nameless', 'p_gone'], filled: [],
        step: 1, featureId: 'f', ...over,
    });
    const paint = (field: any, layout?: any) =>
        renderToStaticMarkup(createElement(IRFormField as any, { objectId: 'o', field, layout }));
    const pillTexts = (html: string) =>
        [...html.matchAll(/<span class="ir-chipinput__pill([^"]*)">.*?<span class="ir-chipinput__pill-text" title="([^"]*)">([^<]*)<\/span>/g)]
            .map(m => ({ broken: m[1].includes('--broken'), title: m[2], text: m[3] }));

    it('the chip input: `: Port` beside a named chip and a broken one, unchanged', () => {
        const html = paint(fieldOf({}), { widget: 'chips' });
        expect(pillTexts(html)).toEqual([
            { broken: false, title: 'Port_1', text: 'Port_1' },
            { broken: false, title: ': Port', text: ': Port' },
            { broken: true, title: 'p_gone', text: 'p_gone' },
        ]);
    });

    it('a read-only single value set to a nameless target reads `: Port`, not «empty»', () => {
        const one = (v: string) => paint(fieldOf({ isMultivalued: false, isReadOnly: true, upperBound: 1, values: [v] }));
        expect(one('p_nameless')).toContain('<div class="ir-field__readonly" id="ir-field-s">: Port</div>');
        expect(one('p_named')).toContain('<div class="ir-field__readonly" id="ir-field-s">Port_1</div>');
        expect(one('p_gone')).toContain('<div class="ir-field__readonly" id="ir-field-s">p_gone</div>');
    });

    it('the rows of a read-only list keep the nameless target, as `: Port`', () => {
        const html = paint(fieldOf({ isReadOnly: true }));
        const rows = [...html.matchAll(/<div class="ir-field__row">([^<]*)<\/div>/g)].map(m => m[1]);
        expect(rows).toEqual(['Port_1', ': Port', 'p_gone']);
    });
});

/**
 * C2f (P-2026-11-08-0843) — the IR reference widgets read an unnamed target as
 * `<Class> (unnamed)`, the form the Text tab's confirm panel uses, with an index only where two
 * different targets of one class would read the same in one list.
 * Layer Impact Report: `docs/discovery/lir_2026-11-08_nameless_reference_labels.md`.
 */
describe('C2f — unnamedTargetLabels, the labels of one list', () => {
    const unnamed = (id: string, cls = 'Port') => ({ id, name: '', instanceof: { name: cls } });
    const named = { id: 'a', name: 'Port_1', instanceof: { name: 'Port' } };

    it('a named target and a missing one have no label, and keep their position', () => {
        expect(unnamedTargetLabels([named, undefined, null])).toEqual([undefined, undefined, undefined]);
    });

    it('one unnamed target reads `<Class> (unnamed)`, with no index', () => {
        expect(unnamedTargetLabels([unnamed('n1')])).toEqual(['Port (unnamed)']);
    });

    it('unnamed targets of one class: the first bare, the later ones numbered', () => {
        expect(unnamedTargetLabels([unnamed('n1'), unnamed('n2'), unnamed('n3')]))
            .toEqual(['Port (unnamed)', 'Port (unnamed) 2', 'Port (unnamed) 3']);
    });

    it('unnamed targets of two classes do not collide, so neither takes an index', () => {
        expect(unnamedTargetLabels([unnamed('n1'), unnamed('g1', 'Gate')]))
            .toEqual(['Port (unnamed)', 'Gate (unnamed)']);
    });

    it('a named target between two unnamed ones is not counted', () => {
        expect(unnamedTargetLabels([unnamed('n1'), named, unnamed('n2')]))
            .toEqual(['Port (unnamed)', undefined, 'Port (unnamed) 2']);
    });

    it('the same target twice in a list is one target: same label, no index', () => {
        expect(unnamedTargetLabels([unnamed('n1'), unnamed('n1'), unnamed('n2')]))
            .toEqual(['Port (unnamed)', 'Port (unnamed)', 'Port (unnamed) 2']);
    });

    it('a target without a readable metaclass reads `Object (unnamed)`', () => {
        expect(unnamedTargetLabels([{ id: 'x', name: '' }])).toEqual(['Object (unnamed)']);
    });
});
