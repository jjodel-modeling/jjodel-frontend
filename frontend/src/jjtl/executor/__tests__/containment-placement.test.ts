import { describe, it, expect, vi } from 'vitest';

/**
 * Containment placement through the trace (P-2026-11-02-1956, slice A, SPEC §5.3.2, R-JTG-4).
 *
 * A binding on a containment feature whose value resolves through the trace places the
 * live target inside the new container, in order, and the target leaves `roots`. A second
 * claim and a containment cycle are errors naming the elements; the placement is recorded
 * in the trace. References and nested creations keep their behaviour.
 *
 * The `joiner` barrel is mocked as in resolution-fallbacks.test.ts: `executor.ts` imports
 * it for `U.asNumber` alone, which drags in monaco and fails under `environment: 'node'`.
 * The lexer, parser and executor run unstubbed.
 */
vi.mock('../../../joiner', () => ({
    U: {
        asNumber: (val: any, returnInvalid: any = 0, returnNAN: any = NaN): number => {
            if (isNaN(val)) return returnNAN;
            if (typeof val === 'number') return val;
            const v = +val;
            if (isNaN(v)) return returnInvalid;
            return v;
        },
    },
}));

import { JjtlLexer } from '../../lexer/lexer';
import { JjtlParser } from '../../parser/parser';
import { execute } from '../executor';
import type { TransformationAST } from '../../types/ast';

function cls(name: string, attributes: string[], references: any[] = []) {
    const attrs = attributes.map(a => ({ name: a }));
    return {
        className: 'DClass', name,
        attributes: attrs, allAttributes: attrs,
        references, allReferences: references,
    };
}
const contains = (name: string, type: string) => ({ name, composition: true, type: { name: type } });
const refers = (name: string, type: string) => ({ name, composition: false, type: { name: type } });

function parseJjtl(body: string, withSource: boolean): TransformationAST {
    const text = 'transformation T\nfrom S\nto Tg\n\n' + body.trim();
    const { tokens, errors: lexErrors } = new JjtlLexer(text).tokenize();
    expect(lexErrors).toEqual([]);
    const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
    expect(errors).toEqual([]);
    return ast!;
}

const el = (id: string, className: string, extra: Record<string, any> = {}) =>
    ({ id, name: id, className, __type: className, ...extra });
const ref = (id: string) => ({ __ref: id });

// ---------------------------------------------------------------------------
// A tree of depth 5: S1 > S2 > S3 > S4 > S5, copied to T1 > ... > T5, plus a Tag
// outside the tree that T3 refers to.

const TREE_TARGET = {
    classes: [
        cls('T1', ['name'], [contains('kids', 'T2')]),
        cls('T2', ['name'], [contains('kids', 'T3')]),
        cls('T3', ['name'], [contains('kids', 'T4'), refers('tag', 'TTag')]),
        cls('T4', ['name'], [contains('kids', 'T5')]),
        cls('T5', ['name']),
        cls('TTag', ['name']),
    ],
};

// s1.kids lists s2b before s2a, the reverse of the source array, so order is observable.
const TREE_SOURCE = [
    el('s1', 'S1', { kids: [ref('s2b'), ref('s2a')] }),
    el('s2a', 'S2', { kids: [ref('s3')], _containerId: 's1' }),
    el('s2b', 'S2', { kids: [], _containerId: 's1' }),
    el('s3', 'S3', { kids: [ref('s4')], tag: ref('g1'), _containerId: 's2a' }),
    el('s4', 'S4', { kids: [ref('s5')], _containerId: 's3' }),
    el('s5', 'S5', { _containerId: 's4' }),
    el('g1', 'Tag'),
];

const TREE_RULES = [
    'S1 -> T1 {\n    name := name\n    kids := kids\n}',
    'S2 -> T2 {\n    name := name\n    kids := kids\n}',
    'S3 -> T3 {\n    name := name\n    kids := kids\n    tag := tag\n}',
    'S4 -> T4 {\n    name := name\n    kids := kids\n}',
    'S5 -> T5 {\n    name := name\n}',
    'Tag -> TTag {\n    name := name\n}',
];

/** The tree under `node` as names, through containment features only. */
function shape(node: any): any {
    const kids = Array.isArray(node.kids) ? node.kids.map(shape) : [];
    return kids.length > 0 ? { [node.name]: kids } : node.name;
}

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('containment placement through the trace — %s', (_label, withSource) => {
    async function runTree(rules: string[]) {
        const result = await execute(parseJjtl(rules.join('\n\n'), withSource), TREE_SOURCE, TREE_TARGET);
        const one = (c: string) => result.targetModel!.instances.get(c)!;
        return { result, one };
    }

    it('places a tree of depth 5 and leaves only its root and the outside Tag in roots', async () => {
        const { result, one } = await runTree(TREE_RULES);
        expect(result.errors).toEqual([]);
        expect(result.success).toBe(true);

        const t1 = one('T1')[0];
        expect(result.targetModel!.roots).toEqual([t1, one('TTag')[0]]);
        expect(shape(t1)).toEqual({ s1: ['s2b', { s2a: [{ s3: [{ s4: ['s5'] }] }] }] });

        // Placed by identity: each child is the live instance the rule created.
        const [t2a, t2b] = one('T2');
        expect(t1.kids[0]).toBe(t2b);
        expect(t1.kids[1]).toBe(t2a);
        expect(t2a.kids[0]).toBe(one('T3')[0]);
        expect(one('T3')[0].kids[0]).toBe(one('T4')[0]);
        expect(one('T4')[0].kids[0]).toBe(one('T5')[0]);
        // Not a pointer: nothing in a containment feature travels as __ref_result.
        expect(t1.kids.__ref_result).toBeUndefined();
    });

    it('records each placement in the trace and warns about none', async () => {
        const { result } = await runTree(TREE_RULES);
        const placements = result.traceModel!.placements!;
        expect(placements.map(p => `${p.container.elementName}.${p.feature} > ${p.target.elementName}`).sort()).toEqual([
            's1.kids > s2a', 's1.kids > s2b', 's2a.kids > s3', 's3.kids > s4', 's4.kids > s5',
        ]);
        expect(placements.find(p => p.target.elementName === 's5')!.rule).toBe('S4 -> T4');
        expect(result.warnings.filter(w => /root|contain/i.test(w))).toEqual([]);
        expect(result.targetModel!.containment!.get(result.targetModel!.instances.get('T5')![0]))
            .toEqual({ container: result.targetModel!.instances.get('T4')![0], feature: 'kids' });
    });

    it('gives the same tree, by identity, whatever the rule order', async () => {
        const forward = await runTree(TREE_RULES);
        const backward = await runTree([...TREE_RULES].reverse());
        expect(backward.result.errors).toEqual([]);
        for (const run of [forward, backward]) {
            const t1 = run.one('T1')[0];
            expect(shape(t1)).toEqual({ s1: ['s2b', { s2a: [{ s3: [{ s4: ['s5'] }] }] }] });
            expect(t1.kids[1].kids[0].kids[0].kids[0]).toBe(run.one('T5')[0]);
            expect(new Set(run.result.targetModel!.roots)).toEqual(new Set([t1, run.one('TTag')[0]]));
        }
    });

    it('keeps a reference from a contained element to a rule target outside the tree a pointer', async () => {
        const { result, one } = await runTree(TREE_RULES);
        const t3 = one('T3')[0];
        const tag = one('TTag')[0];
        expect(t3.tag).toEqual({ __ref_result: true, targets: [tag] });
        expect(t3.tag.targets[0]).toBe(tag);
        expect(result.targetModel!.roots).toContain(tag);
        expect(result.targetModel!.containment!.has(tag)).toBe(false);
    });

    it('keeps source order when a rule names a resolved target and a nested creation in one containment', async () => {
        const made = '-> kids {\n        -> T2 { name := "made" }\n    }';
        const placedFirst = await runTree([
            `S1 -> T1 {\n    name := name\n    kids := kids\n    ${made}\n}`, ...TREE_RULES.slice(1),
        ]);
        expect(placedFirst.result.errors).toEqual([]);
        expect(placedFirst.one('T1')[0].kids.map((k: any) => k.name)).toEqual(['s2b', 's2a', 'made']);

        const createdFirst = await runTree([
            `S1 -> T1 {\n    name := name\n    ${made}\n    kids := kids\n}`, ...TREE_RULES.slice(1),
        ]);
        expect(createdFirst.result.errors).toEqual([]);
        const kids = createdFirst.one('T1')[0].kids;
        expect(kids.map((k: any) => k.name)).toEqual(['made', 's2b', 's2a']);
        expect(kids[0].__nested).toBe(true);
        expect(createdFirst.result.targetModel!.roots).toEqual([createdFirst.one('T1')[0], createdFirst.one('TTag')[0]]);
    });

    it('reports a source element with no rule in a containment, and places only what resolved', async () => {
        const source = [
            el('s1', 'S1', {
                kids: [ref('s2a'), ref('x1')],
                // An embedded object of a class no rule maps, as in A0's fallback.
                more: [el('n1', 'Note')],
            }),
            el('s2a', 'S2', { kids: [], _containerId: 's1' }),
            el('x1', 'Stray', { _containerId: 's1' }),
        ];
        const target = { classes: [...TREE_TARGET.classes.filter(c => c.name !== 'T1'),
            cls('T1', ['name'], [contains('kids', 'T2'), contains('more', 'T2')])] };
        const ast = parseJjtl(
            'S1 -> T1 {\n    name := name\n    kids := kids\n    more := more\n}\n\nS2 -> T2 {\n    name := name\n}',
            withSource,
        );
        const result = await execute(ast, source, target);
        expect(result.errors).toEqual([]);
        const t1 = result.targetModel!.instances.get('T1')![0];
        const t2a = result.targetModel!.instances.get('T2')![0];
        // The {__ref} to an unmapped element: A0's warning, the null dropped, the target placed.
        expect(t1.kids).toEqual([t2a]);
        expect(t1.kids[0]).toBe(t2a);
        expect(result.warnings.some(w => /reference to 'x1' bound to 'kids' points to an element no rule maps/.test(w))).toBe(true);
        expect(result.warnings.some(w => /dropped 1 unresolved element/.test(w))).toBe(true);
        // The embedded object: A0's warning, and the source object itself bound, as before.
        expect(result.warnings.some(w => /Note 'n1' bound to 'more' has no rule mapping 'Note'/.test(w))).toBe(true);
        expect(t1.more).toEqual([expect.objectContaining({ id: 'n1', className: 'Note' })]);
        expect(result.targetModel!.roots).toEqual([t1]);
    });
});

// ---------------------------------------------------------------------------
// Errors: a second claim and a containment cycle, decided in the executor.

const BOX_TARGET = { classes: [cls('Box', ['name'], [contains('items', 'Box'), contains('things', 'Item')]), cls('Item', ['name'])] };
const BOX_RULES = 'B -> Box {\n    name := name\n    items := items\n    things := things\n}\n\nI -> Item {\n    name := name\n}';

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('containment errors — %s', (_label, withSource) => {
    it('reports a second claim naming both containers and places the target once', async () => {
        const source = [
            el('p1', 'B', { items: [], things: [ref('q1')] }),
            el('p2', 'B', { items: [], things: [ref('q1')] }),
            el('q1', 'I'),
        ];
        const result = await execute(parseJjtl(BOX_RULES, withSource), source, BOX_TARGET);
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatch(/Containment conflict: Item 'q1' is claimed by Box 'p1'\.things .* and by Box 'p2'\.things/);
        const [p1, p2] = result.targetModel!.instances.get('Box')!;
        const q1 = result.targetModel!.instances.get('Item')![0];
        expect(p1.things).toEqual([q1]);
        expect(p2.things).toEqual([]);
        expect(result.targetModel!.roots).toEqual([p1, p2]);
    });

    it('reports a containment cycle naming the elements on it', async () => {
        const source = [
            el('p1', 'B', { items: [ref('p2')], things: [] }),
            el('p2', 'B', { items: [ref('p1')], things: [] }),
        ];
        const result = await execute(parseJjtl(BOX_RULES, withSource), source, BOX_TARGET);
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatch(/^Containment cycle: Box 'p[12]' is contained in Box 'p[12]' is contained in Box 'p[12]'\.$/);
        expect(result.errors[0]).toContain("Box 'p1'");
        expect(result.errors[0]).toContain("Box 'p2'");
    });

    it('reports self-containment as a cycle', async () => {
        const source = [el('p3', 'B', { items: [ref('p3')], things: [] })];
        const result = await execute(parseJjtl(BOX_RULES, withSource), source, BOX_TARGET);
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(["Containment cycle: Box 'p3' is contained in Box 'p3'."]);
    });

    it('names the object created in a body, the one in the tree, as the container of a target placed in it', async () => {
        const source = [
            el('p1', 'B', { items: [], things: [], other: [ref('p2')] }),
            el('p2', 'B', { items: [], things: [], _containerId: 'p1' }),
        ];
        const rules = 'B -> Box {\n    name := name\n    -> items {\n        -> Box {\n            name := "w"\n            items := other\n        }\n    }\n}';
        const result = await execute(parseJjtl(rules, withSource), source, BOX_TARGET);
        expect(result.errors).toEqual([]);
        const [p1, p2] = result.targetModel!.instances.get('Box')!;
        const w = p1.items;
        expect(w.__nested).toBe(true);
        expect(w.items[0]).toBe(p2);
        expect(result.targetModel!.containment!.get(p2)!.container).toBe(w);
        expect(result.targetModel!.roots).toEqual([p1]);
    });

    it('reports a cycle that runs through an object created in a body', async () => {
        // p1 creates a Box 'w' in its items and w's things... cannot hold a Box, so the
        // cycle goes p2 -> w (created in p1) -> p1 -> p2 via items.
        const source = [
            el('p1', 'B', { items: [], things: [], other: [ref('p2')] }),
            el('p2', 'B', { items: [ref('p1')], things: [] }),
        ];
        const rules = 'B -> Box {\n    name := name\n    items := items\n    -> items {\n        -> Box {\n            name := "w"\n            items := other\n        }\n    }\n}';
        const result = await execute(parseJjtl(rules, withSource), source, BOX_TARGET);
        expect(result.success).toBe(false);
        const cycle = result.errors.find(e => e.startsWith('Containment cycle:'));
        expect(cycle).toBeDefined();
        expect(cycle).toContain("Box 'p1'");
        expect(cycle).toContain("Box 'p2'");
        expect(cycle).toContain("Box 'w'");
    });
});

// ---------------------------------------------------------------------------
// The trace is per model: one class name on both sides is not an endogenous rule.

const ADD_TARGET = {
    classes: [
        cls('Add', ['name'], [contains('args', 'Expr'), refers('peer', 'Add')]),
        cls('Lit', ['name']),
    ],
};
const ADD_SOURCE = [
    el('a1', 'Add', { args: [ref('a2'), ref('l1')], peer: ref('a2') }),
    el('a2', 'Add', { args: [ref('l2')], peer: ref('a1'), _containerId: 'a1' }),
    el('l1', 'Lit', { _containerId: 'a1' }),
    el('l2', 'Lit', { _containerId: 'a2' }),
];

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('one class name in source and target — %s', (_label, withSource) => {
    it('Add -> Add between two models places the copy, and never reads a target as a source', async () => {
        const rules =
            'Add -> Add {\n    name := name + "_t"\n    args := args\n    peer := peer\n}\n\n' +
            'Lit -> Lit {\n    name := name + "_t"\n}';
        const result = await execute(parseJjtl(rules, withSource), ADD_SOURCE, ADD_TARGET);
        expect(result.errors).toEqual([]);
        const [a1, a2] = result.targetModel!.instances.get('Add')!;
        const [l1, l2] = result.targetModel!.instances.get('Lit')!;
        expect(result.targetModel!.roots).toEqual([a1]);
        expect(a1.args).toEqual([a2, l1]);
        expect(a1.args[0]).toBe(a2);
        expect(a2.args[0]).toBe(l2);
        expect(a1.peer.targets[0]).toBe(a2);
        expect(a2.peer.targets[0]).toBe(a1);
        expect(a1.name).toBe('a1_t');
        // Pass 1 matched the two source Adds only: the targets were never matched as sources.
        expect(result.traceModel!.links.filter(l => l.rule === 'Add -> Add')
            .map(l => l.sourceElement.elementName)).toEqual(['a1', 'a2']);
    });

    it('binds a target that resolve() returned as itself, not as a source element of the same class', async () => {
        const rules =
            'Add -> Add {\n    name := name + "_t"\n    peer := resolve(peer)\n}\n\n' +
            'Lit -> Lit {\n    name := name + "_t"\n}';
        const result = await execute(parseJjtl(rules, withSource), ADD_SOURCE, ADD_TARGET);
        expect(result.errors).toEqual([]);
        const [a1, a2] = result.targetModel!.instances.get('Add')!;
        expect(a1.peer).toEqual({ __ref_result: true, targets: [a2] });
        expect(a2.peer.targets[0]).toBe(a1);
    });
});
