/**
 * IRNodeContent — renders the content of an ObjectNode from a CompiledView.
 *
 * Fase 3: in-place editing through the canonical EditorV2 write path
 * (canvasToJjom.syncUpdateFeatureValue / syncNodeLabel) — never a new write
 * path (spec v1.2 sez. 5). Defaults for parity with the native ObjectNode:
 * value segments and intrinsic name labels are editable unless the IR sets
 * `editable: false`. The wrapper .mm-node, NodeResizer, DynamicHandles and
 * highlight classes stay in ObjectNode.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { U } from '../../../../joiner';
import { syncNodeLabel, syncUpdateFeatureValue } from '../../sync/canvasToJjom';
import type { CompiledView, CompiledTextStyle } from './irTypes';
import type { ReadCtx } from './irReadCtx';
import { makeReadCtx } from './irReadCtxLproxy';
import { rowRenderedChildren } from './irContainment';
import { getShapeDescriptor, SVG_BORDER_DASH, type ShapePainter } from './shapeRegistry';

/**
 * Il contorno di una forma dipinta in SVG: `<polygon>` per i profili spezzati,
 * `<path>` per quelli con archi (il cilindro). Stessi attributi nei due casi,
 * cosi' l'overdraw del double resta una sola scrittura.
 */
type SvgOutlinePainter = Extract<ShapePainter, { kind: 'svg' | 'svgPath' }>;
/** Gli attributi che il contorno riceve: gli stessi per il poligono e per il path. */
interface SvgOutlineProps {
    fill: string;
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
}
function svgOutline(painter: SvgOutlinePainter, props: SvgOutlineProps): React.ReactElement {
    return painter.kind === 'svg'
        ? <polygon points={painter.points} vectorEffect="non-scaling-stroke" {...props} />
        : <path d={painter.silhouette} vectorEffect="non-scaling-stroke" {...props} />;
}
import { useContentDrivenSize } from './useContentSize';
import { getMarkerDef, MARKER_STROKE_WIDTH, MARKER_VIEWBOX } from './markerRegistry';
import IRRow from './IRRow';

/** FontFamilyToken -> design-system CSS var. */
const FONT_FAMILY_VAR: Record<string, string> = { sans: 'var(--font-sans)', mono: 'var(--font-mono)' };
/** FontWeightToken -> numeric CSS weight. */
const FONT_WEIGHT_NUM: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 };

/**
 * Resolve a CompiledTextStyle into an inline style for the current element
 * (ir-1.3 TS1). Only authored axes with a non-empty resolved value are emitted,
 * so an absent axis — or a conditional axis whose branch does not match — inherits
 * the surface's CSS default (irStyle.ts BASE_CSS). An authored axis is always
 * emitted (even when its value equals a CSS default) so it overrides the class rule.
 */
function resolveTextStyle(cs: CompiledTextStyle | undefined, ctx: ReadCtx, id: string): React.CSSProperties | undefined {
    if (!cs) return undefined;
    const s: React.CSSProperties = {};
    if (cs.fontFamily) { const v = cs.fontFamily(ctx, id); if (v) s.fontFamily = FONT_FAMILY_VAR[v]; }
    if (cs.fontSize) { const v = cs.fontSize(ctx, id); if (v && v > 0) s.fontSize = `${v}px`; }
    if (cs.fontWeight) { const v = cs.fontWeight(ctx, id); if (v) s.fontWeight = FONT_WEIGHT_NUM[v]; }
    if (cs.fontStyle) { const v = cs.fontStyle(ctx, id); if (v) s.fontStyle = v; }
    if (cs.color) { const v = cs.color(ctx, id); if (v) s.color = v; }
    return Object.keys(s).length ? s : undefined;
}

export interface IRNodeContentProps {
    compiled: CompiledView;
    objectId: string;
    /** RF vertex id — the canonical write path is keyed by vertex. */
    vertexId: string;
    readCtx: ReadCtx;
}

interface CompartmentRowData {
    key: string;
    name: string;
    typeName: string;
    value: string;
    editableValue: boolean;
}

function IRNodeContent({ compiled, objectId, vertexId, readCtx }: IRNodeContentProps) {
    const form = compiled.form(readCtx, objectId);
    const fill = compiled.fill ? compiled.fill(readCtx, objectId) : '';

    // In-place editing state
    const [editingRow, setEditingRow] = useState<{ key: string; name: string } | null>(null);
    const [editingLabel, setEditingLabel] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');

    // Content-driven box (D8/D9): the shapes that carry a geometric supplement
    // take the size their ink needs inside the outline. Inert on the shapes that
    // fill their box and on a vertex resized by hand. See useContentSize.ts.
    const contentRef = useRef<HTMLDivElement>(null);
    useContentDrivenSize(vertexId, form, contentRef);

    // Compartment rows come from the object's D-layer features (name/type/value).
    const compartmentSig = useSelector((state: any) => {
        if (compiled.fieldCompartments.length === 0) return '';
        const lookup = state.idlookup;
        const dObject = lookup?.[objectId];
        if (!dObject?.features) return '';
        const parts: string[] = [];
        for (const fid of dObject.features) {
            const dv = lookup?.[fid];
            if (!dv) continue;
            const feat = lookup?.[dv.instanceof];
            if (!feat) continue;
            const kind = feat.className === 'DReference' ? 'R' : 'A';
            const typeObj = typeof feat.type === 'string' ? lookup?.[feat.type] : null;
            const vals = Array.isArray(dv.values) ? dv.values : [];
            const display = vals.map((v: unknown) => {
                if (typeof v === 'string' && lookup?.[v]?.name) return lookup[v].name;
                return v == null ? '' : String(v);
            }).join(', ');
            parts.push(`${kind};${fid};${feat.name ?? ''};${typeObj?.name ?? ''};${display}`);
        }
        return parts.join('|');
    });

    const rows = useMemo(() => {
        const attributes: CompartmentRowData[] = [];
        const references: CompartmentRowData[] = [];
        if (!compartmentSig) return { attributes, references };
        for (const entry of compartmentSig.split('|')) {
            const [kind, fid, name, typeName, value] = entry.split(';');
            const row: CompartmentRowData = { key: fid, name, typeName, value, editableValue: kind === 'A' };
            if (kind === 'R') references.push(row); else attributes.push(row);
        }
        return { attributes, references };
    }, [compartmentSig]);

    // Row-dispatch (Fase R2): child object ids rendered as inline rows for a
    // `children`-source compartment. SAME rowRenderedChildren as the presentation
    // pass (SSOT — computeRowHiddenChildren hides exactly this set). A string
    // signature keeps the host stable when only a child's content changes (each IRRow
    // owns its subscription). Empty for views without a children compartment (fast path).
    const rowChildSig = useSelector((state: any) => {
        if (!compiled.fieldCompartments.some(fc => fc.source === 'children')) return '';
        const lookup = state.idlookup;
        return rowRenderedChildren(compiled, makeReadCtx(lookup), objectId, lookup).join(',');
    });
    const rowChildIds = useMemo(() => (rowChildSig ? rowChildSig.split(',') : []), [rowChildSig]);
    // Render the row set once even if several children compartments are declared:
    // rowRenderedChildren already unions them, so it is emitted at the first one only.
    const firstChildrenCompartment = useMemo(
        () => compiled.fieldCompartments.find(fc => fc.source === 'children'),
        [compiled],
    );

    // Both commits also fire on blur, so entering edit and leaving without typing
    // reaches them with an unchanged value. The dirty flag is therefore gated on a
    // real change: marking a project modified by an edit that modified nothing
    // produces an unjustified exit warning. The comparison reads the render-scoped
    // pre-edit value, and the write path is left exactly as it was — only the flag
    // is conditional. No canvas snapshot here on purpose: the canvas history holds
    // React Flow nodes/edges, and a slot value is not in them (see the R12 report).
    const commitRowEdit = useCallback(() => {
        if (editingRow) {
            const before = rows.attributes.find(r => r.key === editingRow.key)
                ?? rows.references.find(r => r.key === editingRow.key);
            syncUpdateFeatureValue(vertexId, editingRow.name, editValue);
            if (!before || before.value !== editValue) U.isProjectModified = true;
            setEditingRow(null);
        }
    }, [editingRow, editValue, vertexId, rows]);

    const commitLabelEdit = useCallback(() => {
        if (editingLabel !== null) {
            // Same source the edit was seeded from (see the label onDoubleClick).
            const changed = (readCtx.getName(objectId) ?? '') !== editValue;
            syncNodeLabel(vertexId, editValue);
            if (changed) U.isProjectModified = true;
            setEditingLabel(null);
        }
    }, [editingLabel, editValue, vertexId, readCtx, objectId]);

    const editKeys = useCallback((commit: () => void) => (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') { setEditingRow(null); setEditingLabel(null); }
    }, []);

    // Le forme dipinte in SVG (oggi: diamond) sopprimono la box CSS in irStyle.ts.
    // `svgPainter` non nullo == questa forma e' dipinta da un layer SVG.
    const shapeDescriptor = getShapeDescriptor(form);
    const painter = shapeDescriptor.painter;
    const svgPainter: SvgOutlinePainter | null =
        painter.kind === 'svg' || painter.kind === 'svgPath' ? painter : null;
    const inlineStyle: React.CSSProperties = {};
    // An SVG-painted form paints fill/border in its own layer (below). The inline
    // box would win over the CSS box suppression (irStyle.ts) and show a square
    // behind the shape, so it is not emitted for those forms.
    if (fill && !svgPainter) inlineStyle.background = fill;
    // Fase B: authored border painted inline on .ir-node-content (per-field
    // fallback). When compiled.border is null the CSS box border applies —
    // covers demo/migrated views without an authored border.
    const b = compiled.border;
    if (b && !svgPainter) inlineStyle.border = `${b.width ?? 1}px ${b.style ?? 'solid'} ${b.color ?? 'var(--border-default)'}`;
    // Node-level text style (ir-1.3 cascade root): inline on the root so every
    // text surface inherits it (irStyle.ts uses `inherit` on labels, rows and
    // inline editors). A label's own style, inline on its span, still wins.
    // fontWeight does NOT reach the top/center labels: their 600 is a class rule
    // (irStyle.ts) and a class rule beats inheritance. That is deliberate: the
    // header keeps its weight, and it is changed from the label's own style.
    // Compartment rows declare no weight, so there it does propagate.
    // resolveTextStyle returns undefined when there is nothing to emit, and
    // Object.assign with undefined is a no-op: no guard needed.
    Object.assign(inlineStyle, resolveTextStyle(compiled.text, readCtx, objectId));

    // The SVG layer paints the same resolved fill/border, with the box-base
    // fallbacks (irStyle.ts:44) when nothing is authored. The polygon stretches
    // to any aspect ratio; non-scaling-stroke keeps the border a constant width.
    const svgFill = fill || 'var(--node-bg)';
    const svgStroke = compiled.border?.color ?? 'var(--border-default)';
    const svgStrokeWidth = compiled.border?.width ?? 1;
    const svgDash = SVG_BORDER_DASH[compiled.border?.style ?? 'solid'];
    // double (asse bordo, 2026-08-15). CSS shapes get it for free from the
    // inline `border` above (native `border-style: double`, two lines from
    // width >= 3). SVG shapes overdraw: the same polygon stroked at 3w in the
    // border color, then at w in the fill color — two w-wide lines with a
    // w-wide gap, uniform at any aspect ratio thanks to non-scaling-stroke
    // (a polygon inset in the 0..100 viewBox would scale non-uniformly under
    // preserveAspectRatio="none"). Declared limit: a translucent fill makes
    // the gap translucent too.
    const svgDouble = (compiled.border?.style ?? 'solid') === 'double';

    // Marker (asse marker, 2026-08-15): resolved per instance like form/fill.
    // Unknown or empty id => no layer (open vocabulary, badge-icon precedent).
    // Drawn in the border color, as notations do; scales with min(w,h) via
    // preserveAspectRatio="meet" (irStyle.ts positions the layer).
    const markerId = compiled.marker ? compiled.marker(readCtx, objectId) : '';
    const markerDef = getMarkerDef(markerId ? String(markerId) : undefined);
    const markerColor = compiled.border?.color ?? 'var(--border-default)';

    // Spacing preset (2026-08-25): 'normal' carries no class, so the tokens declared on
    // .ir-node-content itself apply and the markup of an unauthored view is unchanged.
    const padClass = compiled.padding === 'normal' ? '' : ` ir-pad--${compiled.padding}`;

    return (
        <div
            ref={contentRef}
            className={`ir-node-content ir-shape--${form}${padClass}`}
            style={inlineStyle}
        >
            {svgPainter && (
                <svg className={svgPainter.svgClassName} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {svgDouble ? (
                        <>
                            {svgOutline(svgPainter, {
                                fill: svgFill, stroke: svgStroke, strokeWidth: svgStrokeWidth * 3,
                            })}
                            {svgOutline(svgPainter, {
                                fill: 'none', stroke: svgFill, strokeWidth: svgStrokeWidth,
                            })}
                        </>
                    ) : (
                        svgOutline(svgPainter, {
                            fill: svgFill, stroke: svgStroke, strokeWidth: svgStrokeWidth,
                            strokeDasharray: svgDash,
                        })
                    )}
                    {/* Ornamenti (il coperchio del cilindro): sopra la silhouette,
                        solo tratto. Nel caso double restano a spessore normale. */}
                    {svgPainter.kind === 'svgPath' && (svgPainter.ornaments ?? []).map((d, i) => (
                        <path
                            key={`ir-ornament-${i}`}
                            d={d}
                            vectorEffect="non-scaling-stroke"
                            fill="none"
                            stroke={svgStroke}
                            strokeWidth={svgStrokeWidth}
                            strokeDasharray={svgDash}
                        />
                    ))}
                </svg>
            )}
            {markerDef && (
                <svg className="ir-marker-svg" viewBox={MARKER_VIEWBOX} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                    {markerDef.paths.map((p, i) => (
                        <path
                            key={i}
                            d={p.d}
                            fill={p.fill ? markerColor : 'none'}
                            stroke={p.fill ? 'none' : markerColor}
                            strokeWidth={MARKER_STROKE_WIDTH}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}
                </svg>
            )}
            {compiled.badges.map((b, i) => {
                if (!b.visible(readCtx, objectId)) return null;
                const icon = b.icon(readCtx, objectId);
                if (!icon) return null;
                return (
                    <span key={`badge_${i}`} className={`ir-badge ir-badge--${b.position}`} title={b.tooltip}>
                        <i className={`bi ${icon}`} />
                    </span>
                );
            })}
            {compiled.labels.map((l, i) => {
                if (!l.visible(readCtx, objectId)) return null;
                const raw = l.text(readCtx, objectId);
                const text = raw == null ? '' : String(raw);
                // Editable: intrinsic name/qualifiedName labels edit the element
                // name unless the IR opts out (spec v1.2 sez. 5).
                if (l.editsName && editingLabel === i) {
                    return (
                        <input
                            key={`label_${i}`}
                            className={`ir-label ir-label--${l.position} ir-label__input`}
                            // Same authored style as the span it replaces: the node-level
                            // style already reaches the field by inheritance, this carries
                            // the label's own one, so the text does not change face on
                            // entering the edit.
                            style={resolveTextStyle(l.style, readCtx, objectId)}
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onBlur={commitLabelEdit}
                            onKeyDown={editKeys(commitLabelEdit)}
                        />
                    );
                }
                return (
                    <span
                        key={`label_${i}`}
                        className={`ir-label ir-label--${l.position}`}
                        style={resolveTextStyle(l.style, readCtx, objectId)}
                        onDoubleClick={l.editsName ? () => {
                            setEditingLabel(i);
                            setEditValue(readCtx.getName(objectId) ?? '');
                        } : undefined}
                    >
                        {text}
                    </span>
                );
            })}
            {compiled.fieldCompartments.map(fc => {
                if (!fc.visible(readCtx, objectId)) return null;
                if (fc.source === 'children') {
                    // R2 dispatch: rows are the (filtered) containment children, each
                    // rendered by its own resolved row view (IRRow). The slot-mode path
                    // below (attributes/references) is untouched — the two row semantics
                    // stay separate.
                    if (fc !== firstChildrenCompartment || rowChildIds.length === 0) return null;
                    return (
                        <div
                            key={fc.id}
                            className={`ir-compartment${fc.separator ? '' : ' ir-compartment--no-separator'}`}
                        >
                            {rowChildIds.map(childId => (
                                <IRRow key={childId} childObjectId={childId} />
                            ))}
                        </div>
                    );
                }
                const source = fc.source === 'references' ? rows.references : rows.attributes;
                if (source.length === 0) return null;
                return (
                    <div
                        key={fc.id}
                        className={`ir-compartment${fc.separator ? '' : ' ir-compartment--no-separator'}`}
                    >
                        {source.map(row => (
                            <div key={row.key} className="ir-row">
                                {fc.segments.map((seg, si) => {
                                    switch (seg.kind) {
                                        case 'name': return <span key={si}>{row.name}</span>;
                                        case 'type': return <span key={si}>{row.typeName}</span>;
                                        case 'value': {
                                            const editable = row.editableValue && (seg as any).editable !== false;
                                            if (editable && editingRow?.key === row.key) {
                                                return (
                                                    <input
                                                        key={si}
                                                        className="ir-row__input"
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        onBlur={commitRowEdit}
                                                        onKeyDown={editKeys(commitRowEdit)}
                                                    />
                                                );
                                            }
                                            return (
                                                <span
                                                    key={si}
                                                    className={editable ? 'ir-row__value--editable' : undefined}
                                                    onDoubleClick={editable ? () => {
                                                        setEditingRow({ key: row.key, name: row.name });
                                                        setEditValue(row.value);
                                                    } : undefined}
                                                >
                                                    {row.value}
                                                </span>
                                            );
                                        }
                                        case 'literal': return <span key={si}>{seg.text}</span>;
                                        default: return null;
                                    }
                                })}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

export default IRNodeContent;
