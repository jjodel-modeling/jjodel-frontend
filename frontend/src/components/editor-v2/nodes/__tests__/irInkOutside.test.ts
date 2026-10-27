/**
 * What a coloured node draws outside its box keeps the notation ink (P-2026-10-02-2356, R-VP-51,
 * docs/discovery/discovery_2026-10-02_ir_ink_outside.md).
 *
 * With «Color by metaclass» on, `metaclassColoringVars` rebinds `--color-inode-name` (and the root's
 * `color`) inline on `.ir-node-content`. The outside label and the entry mark sit on the canvas, so they
 * must paint as with coloring off (light: Jjodel has no dark theme, D-UI-15); what is inside the box keeps the
 * WCAG text colour.
 *
 * ── Bench ────────────────────────────────────────────────────────────────────
 * The bench of irGlyphNoColor.test.ts (ObjectNode rendered to markup on its IR branch, the joiner barrel
 * mocked, the real derivation's documents on the demo metamodels). Markup alone is not the measure: the
 * Q5 attempt of P-2026-10-02-2045 passed a markup test and failed in the browser, because the colour
 * string was right and the token it named was rebound one element up. So the markup is RESOLVED: a small
 * model of the cascade walks it from the root, seeded with the custom properties of `_colors-light.scss`
 * compiled by sass,
 * inherits custom properties and `color`, substitutes `var()` at each element against that element's own
 * values, and reads SVG `fill`/`stroke` as presentation attributes. Class rules are not in the model: none
 * of the rules on these elements sets a colour (irStyle.ts, the outside label's halo aside). The root's
 * inherited `color` is a sentinel, `.mm-node`'s `var(--text-primary)`, a scheme token outside the token
 * files; every comparison on it is coloring on against coloring off. The pixels are the lane probe's.
 */
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { ReactFlowProvider } from '@xyflow/react';
import * as sass from 'sass';

const state: { viewpoint: string; idlookup: Record<string, any> } = { viewpoint: 'vp1', idlookup: {} };

vi.mock('../../../../joiner', () => ({
    store: { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a },
    U: {},
    LPointerTargetable: { from: () => null, fromPointer: () => null, fromD: () => null, wrap: () => null },
}));
vi.mock('../../sync/canvasToJjom', () => ({
    syncNodeLabel: () => {},
    syncUpdateFeatureValue: () => {},
    syncIRCollapsedToJjom: () => {},
    syncSetReferenceValue: () => {},
}));
vi.mock('../../hooks/useLayoutAutosave', () => ({
    useLayoutAutosave: () => ({ scheduleLayoutSave: () => {} }),
}));
vi.mock('../../viewpoint/ir/irDemoFixture', () => ({}));

const resolution: { current: any } = { current: null };
vi.mock('../../viewpoint/ir/irResolve', () => ({
    useIRView: () => resolution.current,
    useIRViewpointActive: () => true,
    useIRRowView: () => null,
}));

import ObjectNode from '../ObjectNode';
import { compileView } from '../../viewpoint/ir/irCompile';
import { makeDrawReadCtx } from '../../viewpoint/ir/irReadCtx';
import type { NodeViewIR, VertexViewIR } from '../../viewpoint/ir/irTypes';
import { derivedDocuments, dialogPrefill } from '../../viewpoint/derive/notations';
import type { DerivedNotationId } from '../../viewpoint/derive/notations';
import { sketchOfMetamodel } from '../../sim/metamodelSketch';
import { bindProfile } from '../../../../model/simulation/profileBinder';
import { systemProfile } from '../../../../model/simulation/simProfiles';
import { ROLE_CATALOG } from '../../../../model/simulation/roleCatalog';
import { resolveMetaclassColoring } from '../../../../view/viewPoint/metaclassPalette';

const digest = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

// ---------------------------------------------------------------------------
// Fixtures: the PETRI and PEST demos of irGlyphNoColor.test.ts
// ---------------------------------------------------------------------------

type ClsDef = { name: string; abstract?: boolean; supers?: string[]; attrs?: [string, string][]; refs?: [string, string][] };

function metamodel(tag: string, classes: ClsDef[], profile: string) {
    const lookup: Record<string, any> = {};
    const classId = (n: string) => `${tag}.${n}`;
    lookup[tag] = { id: tag, className: 'DModel', name: tag, isMetamodel: true, packages: [`${tag}.pkg`], classes: [] };
    lookup[`${tag}.pkg`] = { id: `${tag}.pkg`, className: 'DPackage', name: 'default', father: tag, classes: classes.map(c => classId(c.name)), subpackages: [] };
    for (const c of classes) {
        const id = classId(c.name);
        lookup[id] = {
            id, className: 'DClass', name: c.name, father: `${tag}.pkg`, abstract: !!c.abstract, extends: (c.supers ?? []).map(classId),
            attributes: (c.attrs ?? []).map(([n]) => `${id}.${n}`), references: (c.refs ?? []).map(([n]) => `${id}.${n}`),
        };
        for (const [n, type] of c.attrs ?? []) lookup[`${id}.${n}`] = { className: 'DAttribute', name: n, type, upperBound: 1 };
        for (const [n, type] of c.refs ?? []) lookup[`${id}.${n}`] = { className: 'DReference', name: n, type: classId(type), composition: false, aggregation: false, upperBound: 1 };
    }
    const bindings = bindProfile(systemProfile(profile)!, sketchOfMetamodel(lookup, tag));
    const bag: Record<string, unknown> = { simProfile: profile };
    for (const d of ROLE_CATALOG) {
        const b = bindings[d.id];
        if (d.key && b?.status === 'bound') bag[d.key] = b.value;
    }
    lookup[tag]._state = bag;
    return { id: tag, lookup, classId };
}

const PETRI = () => metamodel('PETRI', [
    { name: 'PNode', abstract: true },
    { name: 'Place', supers: ['PNode'], attrs: [['tokens', 'Pointer_EINT']] },
    { name: 'Transition', supers: ['PNode'], attrs: [['guard', 'Pointer_EXPRESSION']] },
    { name: 'Arc', attrs: [['weight', 'Pointer_EINT']], refs: [['src', 'PNode'], ['tgt', 'PNode']] },
    { name: 'InhibitorArc', supers: ['Arc'] },
], 'petri');
const PEST = () => metamodel('PEST', [
    { name: 'State', refs: [['transitions', 'Transition']] },
    { name: 'Initial', supers: ['State'] },
    { name: 'Terminal', supers: ['State'] },
    { name: 'Transition', refs: [['nextState', 'State'], ['event', 'Event']] },
    { name: 'Event' },
], 'stateMachine');

type Mm = ReturnType<typeof PEST>;

function vertexDocs(mm: Mm, notation: DerivedNotationId): Record<string, NodeViewIR> {
    const views = derivedDocuments(mm.lookup, mm.id, { notation, classRoles: dialogPrefill(mm.lookup, mm.id, notation, []).roles });
    return Object.fromEntries(views.filter(v => v.ir.kind === 'vertex').map(v => [v.className, v.ir as NodeViewIR]));
}

function render(mm: Mm, className: string, ir: NodeViewIR, coloring: boolean): string {
    const classId = mm.classId(className);
    state.viewpoint = 'vp1';
    state.idlookup = {
        ...mm.lookup,
        vp1: { id: 'vp1', className: 'DViewPoint', metaclassColoring: { enabled: coloring, baseColor: '#0ea5e9', border: true } },
        obj: { id: 'obj', className: 'DObject', instanceof: classId, name: 'n1', features: [] },
        v_obj: { id: 'v_obj', className: 'DVertex', model: 'obj' },
    };
    resolution.current = { compiled: compileView(`view_${className}`, ir), objectId: 'obj', readCtx: makeDrawReadCtx(state.idlookup) };
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    const props = { id: 'v_obj', data: { label: 'n1', instanceOfClassId: classId, className, features: [] }, selected: false } as any;
    return renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(ReactFlowProvider, { children: createElement(ObjectNode, props) }),
    }));
}

/** The text colour «Color by metaclass» gives `className` (the WCAG pick of R-VP-30). */
function textColourOf(mm: Mm, className: string): string {
    state.idlookup = { ...mm.lookup, vp1: { id: 'vp1', className: 'DViewPoint', metaclassColoring: { enabled: true, baseColor: '#0ea5e9', border: true } } };
    const o = resolveMetaclassColoring(state, mm.classId(className));
    expect(o, className).not.toBeNull();
    return o!.text;
}

// ---------------------------------------------------------------------------
// The cascade model
// ---------------------------------------------------------------------------

interface El { tag: string; attrs: Record<string, string>; parent: El | null; children: El[] }
const VOID = new Set(['input', 'br', 'img', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);
const unescape = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function parse(html: string): El {
    const root: El = { tag: '#root', attrs: {}, parent: null, children: [] };
    let cur = root;
    const tagRe = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:.-]+(?:="[^"]*")?)*)\s*(\/?)>/g;
    for (const m of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(tagRe)) {
        const [, close, tag, attrSrc, selfClose] = m;
        if (close) {
            let n: El | null = cur;
            while (n && n !== root && n.tag !== tag) n = n.parent;
            if (n && n !== root) cur = n.parent!;
            continue;
        }
        const attrs: Record<string, string> = {};
        for (const a of attrSrc.matchAll(/([\w:.-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = unescape(a[2] ?? '');
        const el: El = { tag, attrs, parent: cur, children: [] };
        cur.children.push(el);
        if (!selfClose && !VOID.has(tag)) cur = el;
    }
    return root;
}

function findAll(el: El, pred: (e: El) => boolean, out: El[] = []): El[] {
    for (const c of el.children) {
        if (pred(c)) out.push(c);
        findAll(c, pred, out);
    }
    return out;
}
const hasClass = (cls: string) => (e: El) => (e.attrs.class ?? '').split(/\s+/).includes(cls);

function parseStyle(s: string): Map<string, string> {
    const out = new Map<string, string>();
    for (const part of s.split(';')) {
        const i = part.indexOf(':');
        if (i > 0) out.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
    }
    return out;
}

const INVALID = new Error('invalid at computed-value time');
const VAR_RE = /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/;
/** `var()` substituted innermost first; a missing name without a fallback throws INVALID. */
function substitute(value: string, get: (name: string) => string | undefined): string {
    let out = value;
    for (let guard = 0; VAR_RE.test(out); guard++) {
        if (guard > 50) throw INVALID;
        out = out.replace(VAR_RE, (_m, name: string, fb?: string) => {
            const v = get(name);
            if (v !== undefined) return v;
            if (fb !== undefined) return fb.trim();
            throw INVALID;
        });
    }
    return out;
}

interface Scope { vars: Map<string, string>; color: string }
const CANVAS_TEXT = '<.mm-node color>';

function tokenMap(theme: 'light'): Map<string, string> {
    const decls = (file: string) => {
        const css = sass.compile(resolve(__dirname, `../../../../styles/tokens/${file}`)).css.replace(/\/\*[\s\S]*?\*\//g, '');
        return [...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()] as [string, string]);
    };
    const raw = new Map(decls('_colors-light.scss'));
    // Substitution happens at :root, over the winning declarations of both blocks.
    const out = new Map<string, string>();
    const resolving = new Set<string>();
    const get = (name: string): string | undefined => {
        if (out.has(name)) return out.get(name);
        const v = raw.get(name);
        if (v === undefined || resolving.has(name)) return undefined;
        resolving.add(name);
        try { const r = substitute(v, get); out.set(name, r); return r; } catch { return undefined; } finally { resolving.delete(name); }
    };
    for (const k of raw.keys()) get(k);
    return out;
}
const TOKENS = { light: tokenMap('light') };

function scopeOf(el: El, theme: 'light'): Scope {
    if (!el.parent) return { vars: TOKENS[theme], color: CANVAS_TEXT };
    const parent = scopeOf(el.parent, theme);
    const decls = parseStyle(el.attrs.style ?? '');
    const own = new Map([...decls].filter(([k]) => k.startsWith('--')));
    const resolving = new Set<string>();
    const get = (name: string): string | undefined => {
        if (!own.has(name)) return parent.vars.get(name);
        if (resolving.has(name)) return undefined;
        resolving.add(name);
        try { return substitute(own.get(name)!, get); } catch { return undefined; } finally { resolving.delete(name); }
    };
    const vars = new Map(parent.vars);
    for (const k of own.keys()) {
        const v = get(k);
        if (v === undefined) vars.delete(k); else vars.set(k, v);
    }
    let color = parent.color;
    const c = decls.get('color');
    // Invalid at computed-value time, `color` (inherited) falls back to the parent's.
    if (c !== undefined) { try { color = substitute(c, n => vars.get(n)); } catch { /* inherits */ } }
    return { vars, color };
}
const colourOf = (el: El, theme: 'light') => scopeOf(el, theme).color;
const paintOf = (el: El, attr: 'fill' | 'stroke', theme: 'light') => substitute(el.attrs[attr], n => scopeOf(el, theme).vars.get(n));

const THEMES = ['light'] as const;
const INK = (theme: 'light') => TOKENS[theme].get('--color-inode-name')!;

// ---------------------------------------------------------------------------
// Hand-written views (no `generated`, so never a glyph): what the derivation does not draw
// ---------------------------------------------------------------------------

const NAME = { from: 'intrinsic', prop: 'name' } as const;
const NAME_INK = 'var(--color-inode-name)';
function handView(shape: Partial<VertexViewIR['shape']>): NodeViewIR {
    return {
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
        shape: { form: 'rounded', labels: [{ position: 'center', source: NAME, style: { color: NAME_INK } }], ...shape },
    } as NodeViewIR;
}
const UNSTYLED_OUTSIDE = handView({
    labels: [
        { position: 'center', source: NAME, style: { color: NAME_INK } },
        { position: 'outside', anchor: 's', source: { from: 'literal', text: 'out' } },
    ],
});
const NODE_TEXT_OUTSIDE = handView({
    text: { color: NAME_INK },
    labels: [
        { position: 'center', source: NAME },
        { position: 'outside', anchor: 'e', source: { from: 'literal', text: 'out' } },
    ],
});
const BADGED = handView({ badges: [{ icon: 'bi-star', position: 'tl', visible: true }] });

/**
 * The off markup of every fixture, taken on `7c9ae4e0d` before any edit of this lane: coloring off is unchanged.
 * `initial` retaken on P-2026-10-03-1304 (Q9b), whose open entry head is the only change to that markup.
 */
const OFF_PIN: Record<string, string> = {
    place: 'fe28427b06c820e4', initial: 'f161aeb9da3838a6', unstyled: '5cf02e858e7b0cac', nodeText: '86f3e2adc88bb29b', badged: '80a003bbc1751568',
};

// ---------------------------------------------------------------------------

describe('the outside label of a Petri net (classic) place keeps the ink', () => {
    for (const theme of THEMES) {
        it(`${theme}: coloring on paints it as coloring off, in the name ink`, () => {
            const mm = PETRI();
            const ir = vertexDocs(mm, 'petriClassic').Place;
            const off = findAll(parse(render(mm, 'Place', ir, false)), hasClass('ir-label--outside'));
            const on = findAll(parse(render(mm, 'Place', ir, true)), hasClass('ir-label--outside'));
            expect(off).toHaveLength(1);
            expect(on).toHaveLength(1);
            expect(colourOf(off[0], theme)).toBe(INK(theme));
            expect(colourOf(on[0], theme)).toBe(INK(theme));
        });
    }
});

describe('the entry mark of a Statechart (UML) Initial keeps the ink', () => {
    for (const theme of THEMES) {
        it(`${theme}: dot, line and arrowhead paint as coloring off`, () => {
            const mm = PEST();
            const ir = vertexDocs(mm, 'statechart').Initial;
            for (const coloring of [false, true]) {
                const svg = findAll(parse(render(mm, 'Initial', ir, coloring)), hasClass('ir-entry-svg'));
                expect(svg, `coloring ${coloring}`).toHaveLength(1);
                const [dot] = findAll(svg[0], e => e.tag === 'circle');
                const [line, head] = findAll(svg[0], e => e.tag === 'path');
                expect(paintOf(dot, 'fill', theme), `dot, coloring ${coloring}`).toBe(INK(theme));
                expect(paintOf(line, 'stroke', theme), `line, coloring ${coloring}`).toBe(INK(theme));
                // P-2026-10-03-1304 (Q9b): the head is the open one, stroked in the ink, unfilled.
                expect(paintOf(head, 'stroke', theme), `head, coloring ${coloring}`).toBe(INK(theme));
                expect(head.attrs.fill, `head fill, coloring ${coloring}`).toBe('none');
            }
        });
    }
});

describe('an outside label resolves as with coloring off, whatever its colour source', () => {
    const cases: Array<[string, NodeViewIR]> = [['no colour of its own', UNSTYLED_OUTSIDE], ['a node-level text colour in the ink', NODE_TEXT_OUTSIDE]];
    for (const theme of THEMES) {
        for (const [label, ir] of cases) {
            it(`${theme}: ${label}`, () => {
                const mm = PEST();
                const off = findAll(parse(render(mm, 'State', ir, false)), hasClass('ir-label--outside'));
                const on = findAll(parse(render(mm, 'State', ir, true)), hasClass('ir-label--outside'));
                expect(on).toHaveLength(1);
                expect(colourOf(on[0], theme)).toBe(colourOf(off[0], theme));
            });
        }
    }
});

describe('inside the box keeps the WCAG text colour', () => {
    for (const theme of THEMES) {
        it(`${theme}: the Initial's name and a Petri place's inside text`, () => {
            const pest = PEST();
            const initial = findAll(parse(render(pest, 'Initial', vertexDocs(pest, 'statechart').Initial, true)), e => hasClass('ir-label')(e) && !hasClass('ir-label--outside')(e));
            expect(initial.length).toBeGreaterThan(0);
            for (const l of initial) expect(colourOf(l, theme)).toBe(textColourOf(pest, 'Initial'));
        });

        it(`${theme}: a hand-written node's inside label, in the ink when off, takes the text colour`, () => {
            const mm = PEST();
            const inside = (coloring: boolean) => findAll(parse(render(mm, 'State', UNSTYLED_OUTSIDE, coloring)), e => hasClass('ir-label--center')(e))[0];
            expect(colourOf(inside(false), theme)).toBe(INK(theme));
            expect(colourOf(inside(true), theme)).toBe(textColourOf(mm, 'State'));
        });

        it(`${theme}: a badge takes the text colour`, () => {
            const mm = PEST();
            const badge = findAll(parse(render(mm, 'State', BADGED, true)), hasClass('ir-badge'));
            expect(badge).toHaveLength(1);
            expect(colourOf(badge[0].children[0], theme)).toBe(textColourOf(mm, 'State'));
        });
    }
});

describe('coloring off is unchanged', () => {
    it('the off markup of every fixture is the markup of 7c9ae4e0d', () => {
        const petri = PETRI();
        const pest = PEST();
        const got = {
            place: digest(render(petri, 'Place', vertexDocs(petri, 'petriClassic').Place, false)),
            initial: digest(render(pest, 'Initial', vertexDocs(pest, 'statechart').Initial, false)),
            unstyled: digest(render(pest, 'State', UNSTYLED_OUTSIDE, false)),
            nodeText: digest(render(pest, 'State', NODE_TEXT_OUTSIDE, false)),
            badged: digest(render(pest, 'State', BADGED, false)),
        };
        expect(got).toEqual(OFF_PIN);
    });

    it('a glyph (the classic Petri transition, R-VP-50) is not coloured: on is off', () => {
        const mm = PETRI();
        const ir = vertexDocs(mm, 'petriClassic').Transition;
        expect(render(mm, 'Transition', ir, true)).toBe(render(mm, 'Transition', ir, false));
    });
});
