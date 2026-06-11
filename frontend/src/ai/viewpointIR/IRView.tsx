// IRView v0 — generic runtime interpreter for AI-generated syntactic viewpoints.
//
// A single registered React component that reads a `ViewIR` off the rendered
// view and renders the node generically. Each generated view's `jsxString` is a
// one-line stub: `<IRView data={data} node={node} view={view} />` (the in-scope
// template vars confirmed in docs/discovery/discovery_2026-06-08_ir_runtime_interpreter_feasibility.md).
//
// v0 scope: `kind: 'vertex'` only — shape (rect/rounded/ellipse), border, fill,
// top/center labels, and the first `attributes` field compartment. Conditionals
// are read as their bare value (no predicate evaluation yet). No badges, no
// containment, no edges. This is a faithful refactor of the existing default
// view template (utils/defaultViewTemplate.ts), driven by the IR instead of
// hardcoded JSX.

import React from 'react';
import type {
    ViewIR, Conditional, TextSource, LabelSpec, FieldCompartment, FieldSegment, BorderSpec, Shape,
} from './types';

// THROWAWAY dev probe for Phase 2a (no-op in production). Side-effect import so
// `window.__seedIRViewProbe` is attached whenever IRView is loaded (IRView is in
// the joiner/components barrel, so this loads at startup). Remove with the probe.
import './__irviewProbe';

export interface IRViewProps {
    data?: any;   // L-proxy of the model element (LObject / LModelElement)
    node?: any;   // L-proxy of the graph node (LGraphElement)
    view?: any;   // L-proxy of the view (LViewElement); IR read from view.__raw.ir
}

// Treat a Conditional<T> as its bare-value form. v0 does not evaluate `when`/`rules`.
// TODO 2b: evaluate the predicate against `data` (Predicate evaluator, next task).
function bareValue<T>(c: Conditional<T> | undefined): T | undefined {
    if (c && typeof c === 'object' && ('when' in (c as any) || 'rules' in (c as any))) {
        const anyc = c as any;
        return (anyc.then !== undefined ? anyc.then : anyc.default) as T | undefined;
    }
    return c as T | undefined;
}

// Resolve a dotted PathExpr against the element, e.g. '$name.value' -> data['$name'].value.
function readPath(obj: any, expr: string | undefined): any {
    if (!obj || !expr) return undefined;
    let cur: any = obj;
    for (const part of expr.split('.')) {
        if (cur == null) return undefined;
        cur = cur[part];
    }
    return cur;
}

function resolveTextSource(src: TextSource | undefined, data: any): string {
    if (!src) return '';
    if (src.from === 'literal') return src.text ?? '';
    if (src.from === 'path') {
        const v = readPath(data, src.expr);
        return v == null ? '' : String(v);
    }
    return '';
}

// Reuse the same L-proxy accessors the default template family uses for the
// metaclass type name of an attribute (mirrors `data.instanceof.references` /
// `<Select data={a} field={'type'}/>` in DV.tsx).
function resolveType(attr: any): string {
    const t = attr?.type;
    if (t == null) return '';
    if (typeof t === 'string') return t;
    return t.name ?? '';
}

function renderRow(segments: FieldSegment[], row: any, key: React.Key): React.ReactNode {
    const text = segments.map((seg) => {
        switch (seg.kind) {
            case 'name': return row?.name ?? '';
            case 'type': return resolveType(row);
            case 'literal': return seg.text ?? '';
            case 'value': return String(readPath(row, seg.path) ?? row?.value ?? '');
            case 'multiplicity': return ''; // TODO 2b: lowerBound..upperBound
            case 'badge': return '';        // TODO 2b: inline badges
            default: return '';
        }
    }).join('');
    return <div className={'jjodel-irview__row'} key={key}>{text}</div>;
}

// Enumerate the element's attributes using existing L-proxy accessors — for an
// M1 object, the metaclass's attribute definitions (parallel to the default
// template's `data.instanceof.references`). No new traversal invented.
function attributeRows(data: any): any[] {
    const fromMeta = data?.instanceof?.attributes;
    if (Array.isArray(fromMeta)) return fromMeta;
    const direct = data?.attributes;
    if (Array.isArray(direct)) return direct;
    return [];
}

function borderStyle(border: BorderSpec | undefined): string | undefined {
    if (!border) return undefined;
    return `${border.width ?? 1}px ${border.style ?? 'solid'} ${border.color ?? '#000'}`;
}

function radiusFor(form: string | undefined): string {
    switch (form) {
        case 'ellipse': return '50%';
        case 'rounded': return '8px';
        case 'rect':
        default: return '0'; // diamond/hexagon/icon fall back to rect in v0
    }
}

// Minimal default-view fallback (mirrors utils/defaultViewTemplate.ts header) so
// nothing breaks when the IR is absent or not a vertex.
function renderFallback(data: any): React.ReactElement {
    const typeName = data?.instanceof?.name;
    return (
        <div className={'root jjodel-default-view jjodel-irview jjodel-irview--fallback'}>
            <div className={'jjodel-default-view__header'}>
                <label className={'jjodel-default-view__name'}>{data?.name ?? 'unnamed'}</label>
                {typeName ? <span className={'jjodel-default-view__type'}>{typeName}</span> : null}
            </div>
        </div>
    );
}

export function IRView(props: IRViewProps): React.ReactElement {
    const { data, view } = props;
    const ir: ViewIR | undefined = (view as any)?.__raw?.ir ?? (view as any)?.ir;

    if (!ir || ir.kind !== 'vertex') return renderFallback(data);

    const shape: Shape = ir.shape;
    const form = bareValue(shape?.form) as string | undefined;
    const fill = bareValue(shape?.fill) as string | undefined;
    const border = bareValue(shape?.border) as BorderSpec | undefined;

    const boxStyle: React.CSSProperties = {
        border: borderStyle(border),
        borderRadius: radiusFor(form),
        background: fill,
    };

    // Labels by position (v0: top, center). `inside`/`bottom` -> TODO 2b.
    const labels: LabelSpec[] = Array.isArray(shape?.labels) ? shape.labels : [];
    const topLabels = labels.filter((l) => l.position === 'top');
    const centerLabels = labels.filter((l) => l.position === 'center');

    // First attributes compartment.
    const compartments: FieldCompartment[] = Array.isArray(ir.fieldCompartments) ? ir.fieldCompartments : [];
    const attrComp = compartments.find((c) => c.source?.from === 'attributes');
    const rows = attrComp ? attributeRows(data) : [];
    const compTitle = attrComp ? (bareValue(attrComp.title) as string | undefined) : undefined;

    return (
        <div className={'root jjodel-default-view jjodel-irview'} style={boxStyle}>
            {(topLabels.length > 0) && (
                <div className={'jjodel-default-view__header jjodel-irview__top'}>
                    {topLabels.map((l, i) => {
                        const txt = resolveTextSource(l.source, data) || (data?.name ?? '');
                        return <label className={'jjodel-default-view__name'} key={'top' + i}>{txt}</label>;
                    })}
                </div>
            )}
            {centerLabels.map((l, i) => (
                <div className={'jjodel-irview__center'} key={'center' + i}>{resolveTextSource(l.source, data)}</div>
            ))}
            {attrComp && (
                <div className={'features-section attributes-section jjodel-irview__compartment'}>
                    {compTitle ? <div className={'jjodel-irview__compartment-title'}>{compTitle}</div> : null}
                    {rows.map((row, i) => renderRow(attrComp.rowFormat.segments, row, 'attr' + i))}
                </div>
            )}
            {/* TODO 2b: badges, containment, references/operations/features/query compartments, conditionals, edges */}
        </div>
    );
}

export default IRView;
