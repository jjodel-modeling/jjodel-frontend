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

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useSelector } from 'react-redux';
import { store, U } from '../../../../joiner';
import { syncNodeLabel, syncSetReferenceValue, syncUpdateFeatureValue } from '../../sync/canvasToJjom';
import { useEditorContextSafe } from '../../contexts/EditorContext';
import InlineObjectSelect, { type InlineObjectOption } from '../../components/InlineObjectSelect';
import type { BadgePosition, CompiledView, ShapeForm } from './irTypes';
import type { ReadCtx } from './irReadCtx';
import { makeReadCtx } from './irReadCtxLproxy';
import { rowRenderedChildren } from './irContainment';
import { labelFeatureEditBlock, labelFeatureInfoOf } from './irLabelEdit';
import { metaclassColoringVars, metaclassOutsideInkVars, type MetaclassColorOverride } from '../../../../view/viewPoint/metaclassPalette';
import {
    getShapeDescriptor, honorsCornerRadius, resolveCompiledCornerRadius, resolveCornerRadius, roundedPolygonPath,
    SVG_BORDER_DASH, type ShapePainter, type Size,
} from './shapeRegistry';

/**
 * Il contorno di una forma dipinta in SVG: `<polygon>` per i profili spezzati,
 * `<path>` per quelli con archi (il cilindro). Stessi attributi nei due casi,
 * cosi' l'overdraw del double resta una sola scrittura.
 *
 * `roundedD` (slice 3, corner radius): when the polygon is rounded, its path in the
 * `0 0 w h` viewBox replaces the polygon. Every caller passes the same one, so the
 * selection ring, the band and both strokes of the `double` stay concentric.
 */
type SvgOutlinePainter = Extract<ShapePainter, { kind: 'svg' | 'svgPath' }>;
/** Gli attributi che il contorno riceve: gli stessi per il poligono e per il path. */
interface SvgOutlineProps {
    fill: string;
    stroke?: string;
    strokeWidth: number;
    strokeDasharray?: string;
    className?: string;
}
function svgOutline(painter: SvgOutlinePainter, props: SvgOutlineProps, roundedD?: string): React.ReactElement {
    if (roundedD) return <path d={roundedD} vectorEffect="non-scaling-stroke" {...props} />;
    return painter.kind === 'svg'
        ? <polygon points={painter.points} vectorEffect="non-scaling-stroke" {...props} />
        : <path d={painter.silhouette} vectorEffect="non-scaling-stroke" {...props} />;
}

/**
 * Layout box of the element a rounded corner is drawn on (slice 3, D5): the `<svg>`
 * layer for the polygon forms, whose viewBox then maps one to one onto it, and
 * `.ir-node-content` for the CSS forms, whose `border-radius` applies to its border
 * box. Layout sizes and not client rects: the canvas viewport carries a `scale()`,
 * and a client rect would tie the radius to the zoom (measured in useContentSize.ts).
 *
 * Inert unless `enabled`: no observer exists on a node that does not need one.
 * Writes are equality guarded, so a steady box converges after one read. Null until
 * the element has been measured, and the painter then keeps the sharp polygon.
 */
function useCornerBox(
    enabled: boolean, onSvg: boolean, svgEl: SVGSVGElement | null, contentRef: RefObject<HTMLDivElement>,
): Size | null {
    const [measured, setMeasured] = useState<{ el: Element; w: number; h: number } | null>(null);
    useLayoutEffect(() => {
        const el: Element | null = onSvg ? svgEl : contentRef.current;
        if (!enabled || !el) return;
        const write = (w: number, h: number) => setMeasured(prev =>
            (prev && prev.el === el && prev.w === w && prev.h === h) ? prev : { el, w, h });
        // The CSS box is read synchronously, before the first paint. The SVG element
        // has no offset metrics, so it waits for the observer's first entry.
        if (el instanceof HTMLElement) write(el.offsetWidth, el.offsetHeight);
        if (typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver((entries) => {
            if (el instanceof HTMLElement) { write(el.offsetWidth, el.offsetHeight); return; }
            const rect = entries[entries.length - 1]?.contentRect;
            if (rect) write(rect.width, rect.height);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [enabled, onSvg, svgEl, contentRef]);
    if (!enabled || !measured) return null;
    const current: Element | null = onSvg ? svgEl : contentRef.current;
    return measured.el === current && measured.w > 0 && measured.h > 0 ? { w: measured.w, h: measured.h } : null;
}

/**
 * Anello e banda di selezione per le forme dipinte in SVG.
 *
 * Sulle forme CSS (rect, ellisse, stadio...) li disegnano `outline` e
 * `box-shadow`, che seguono il `border-radius`. Qui non c'e' raggio da seguire:
 * la sagoma e' un poligono, e una box-shadow tornerebbe il rettangolo del
 * bounding box. Si ridisegna allora la stessa sagoma piu' larga SOTTO quella
 * piena, che poi ne copre la meta' interna — l'idioma e' gia' quello del bordo
 * `double` qui sotto. Con `non-scaling-stroke` le larghezze sono in pixel di
 * schermo, quindi meta' di ognuna e' esattamente il rientro voluto: 5px per
 * l'anello (offset 3 + tratto 2) e 3px per la banda, gli stessi numeri della
 * regola CSS.
 *
 * Il colore NON e' qui: lo mette irStyle solo sotto `.mm-node.selected`, cosi'
 * IRNodeContent non ha bisogno di sapere se il nodo e' selezionato.
 */
const SEL_RING_STROKE_WIDTH = 10;
const SEL_BAND_STROKE_WIDTH = 6;
import { useContentDrivenSize } from './useContentSize';
import { getMarkerDef, MARKER_STROKE_WIDTH, MARKER_VIEWBOX } from './markerRegistry';
import IRRow from './IRRow';
import { resolveTextStyle } from './irCompile';

/**
 * A badge sits in its corner on every form (P-2026-09-29-2122). On the five SVG-painted forms
 * the in-flow child rule of irStyle.ts (`> :not(.ir-<form>-svg):not(.ir-marker-svg)`, 0,4,0)
 * beats `.ir-node-content .ir-badge` (0,2,0) and made the badge a flex item, top centre.
 * Inline, and not one more `:not()` there: that would lift the rule to (0,5,0), above the
 * outside label (0,4,0) written to beat it (measured in Chromium). The values are the class
 * rule's own, so the CSS forms do not move.
 */
const BADGE_STYLE: React.CSSProperties = { position: 'absolute', zIndex: 2 };

/**
 * The entry mark (R-VP-22, `ShapeSpec.entry`): a layer ENTRY_W × ENTRY_H outside the box, its right
 * edge on the box's left border and its middle on the box's middle, so the arrow's tip, the layer's
 * rightmost point, touches the border and nothing more. Placed inline, as the badge is, so no in-flow
 * rule of the SVG-painted forms can take it back into the flow; irStyle.ts only lifts the two clips.
 * `dot`: a filled dot (UML initial pseudostate), then the line; `arrow`: the line alone.
 */
const ENTRY_W = 40;
const ENTRY_H = 14;
const ENTRY_DOT_R = 6;
const ENTRY_HEAD = 8;
const ENTRY_STYLE: React.CSSProperties = {
    position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', overflow: 'visible', pointerEvents: 'none', zIndex: 1,
};

/**
 * Exported since TS2: IRRow renders the dispatched rows outside this component and
 * must resolve their style with the same function, not a copy of it. The function
 * lives in irCompile.ts since P-2026-09-30-0150 (R-VP-20), so the pure irEdgeViews.ts
 * can call it too; re-exported here under the same name.
 */
export { resolveTextStyle };

export interface IRNodeContentProps {
    compiled: CompiledView;
    objectId: string;
    /** RF vertex id — the canonical write path is keyed by vertex. */
    vertexId: string;
    readCtx: ReadCtx;
    /**
     * Opens the renderer ladder on one compartment row (R-STR-7, 2026-08-29).
     * Carries the FEATURE NAME and nothing else: `CompartmentRowData` is keyed by
     * DValue id, which the inspector cannot use, and lifting a `SlotRow` in here
     * would put the native branch's row model inside this interface. The host
     * resolves the name against its own `slotRows` and owns the panel.
     * Absent in the authoring preview, which has no inspector to open.
     */
    onInspectFeature?: (featureName: string, anchor: DOMRect) => void;
    /**
     * The rendering of one feature's value, by the FULL ladder (R-STR-6 (B)).
     *
     * Slice (A) passed only rung 0 through here — the widget the active view
     * declared — and left rung 1 and the type/name rungs unpainted, so `guard`
     * (`@renderer=code`) rendered `code` on the native branch and plain text here.
     * That gap was (A)'s declared cost; this is it closed. The callback now answers
     * for EVERY feature, with the same `detectValueRenderer` call the native branch
     * makes, so the two branches cannot diverge on what a value looks like.
     *
     * A CALLBACK and not a decision, for the same reason `onInspectFeature` carries
     * a name and not a `SlotRow`: the renderer library and the row model both live
     * on the native branch, and lifting either in here would put `ObjectNode`'s
     * internals inside this interface. The interpreter asks by feature name and
     * paints whatever comes back.
     *
     * Null means «I have no row for that name» — a compartment row the native side
     * does not know — and the segment then renders its own text, unchanged. Absent
     * in the authoring preview, which has no live object to read.
     */
    renderRowValue?: (featureName: string) => React.ReactNode | null;
    /**
     * The container is collapsed (F3, P-2026-09-29-2122): a graphVertex then paints its
     * `containment.collapsed` form, fill and badge where the view declares them. The host
     * decides it, with the predicate of its expand chip. Absent = expanded, as in the
     * authoring preview.
     */
    collapsed?: boolean;
    /**
     * «Color by metaclass» of the active viewpoint (R-VP-27..31), resolved by the host, which
     * knows the metaclass (`ObjectNode`). Present, it wins over the view's fill, border colour
     * and text colour; the border keeps the view's width and style (transparent when the
     * option's Border is off), and an outside label keeps its ink. Absent = the view paints
     * alone, as before and as in the authoring preview.
     */
    colorOverride?: MetaclassColorOverride;
}

/**
 * Form of the node as painted (F3, P-2026-09-29-2122). Collapsed, a graphVertex takes
 * `containment.collapsed.form` when the view declares one; otherwise the shape's form.
 * ObjectNode reads the same function for handles and resizer, so the outline and the
 * anchors cannot disagree.
 */
export function resolveNodeForm(compiled: CompiledView, readCtx: ReadCtx, objectId: string, collapsed: boolean): ShapeForm {
    const collapsedForm = collapsed ? compiled.containment?.collapsedForm : null;
    return (collapsedForm ?? compiled.form)(readCtx, objectId);
}

/**
 * The declared collapsed badge, resolved (F3): null when the node is expanded, when the
 * view declares none, or when it resolves invisible or to no icon. Non-null, it replaces
 * the count of the expand chip in ObjectNode (spec v1.2 sez. 8: the badge defaults to a
 * child count). It replaces the count and not the chip: the chip is the only way to
 * expand a collapsed container.
 */
export function resolveCollapsedBadge(
    compiled: CompiledView, readCtx: ReadCtx, objectId: string, collapsed: boolean,
): { icon: string; position: BadgePosition; tooltip?: string } | null {
    const badge = collapsed ? compiled.containment?.collapsedBadge : null;
    if (!badge || !badge.visible(readCtx, objectId)) return null;
    const icon = badge.icon(readCtx, objectId);
    return icon ? { icon, position: badge.position, tooltip: badge.tooltip } : null;
}

interface CompartmentRowData {
    /** DValue (slot) id — NOT the metafeature id; the DReference is reached via its `instanceof`. */
    key: string;
    name: string;
    typeName: string;
    /** Declared type id of the feature. Carried per row so the singleton-select gate is a Set
     *  lookup instead of a store walk (R-SGL-10(4)). */
    typeId: string;
    value: string;
    editableValue: boolean;
}

/** Open singleton select: everything it needs, resolved once at open — never per render. */
interface SelectingRowState {
    /** DValue id of the row being assigned. */
    key: string;
    /** Reference name — the write path is keyed by name, like every other slot write. */
    name: string;
    typeName: string;
    mode: 'replace' | 'append';
    allowNone: boolean;
    options: InlineObjectOption[];
    value: string | null;
    anchorRect: DOMRect;
}

function IRNodeContent({ compiled, objectId, vertexId, readCtx, onInspectFeature, renderRowValue, collapsed = false, colorOverride }: IRNodeContentProps) {
    const form = resolveNodeForm(compiled, readCtx, objectId, collapsed);
    // A collapsed fill that resolves empty (a conditional with no match) falls back to the
    // expanded fill, the same convention as an empty fill falling back to the box colour.
    const collapsedFill = collapsed && compiled.containment?.collapsedFill
        ? compiled.containment.collapsedFill(readCtx, objectId) : '';
    const fill = colorOverride?.fill || collapsedFill || (compiled.fill ? compiled.fill(readCtx, objectId) : '');
    const collapsedBadge = resolveCollapsedBadge(compiled, readCtx, objectId, collapsed);

    // In-place editing state
    const [editingRow, setEditingRow] = useState<{ key: string; name: string } | null>(null);
    const [editingLabel, setEditingLabel] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    // Singleton select (R-SGL-4). Disjoint from editingRow by construction: a reference row is
    // never `editableValue` (that stays `kind === 'A'`), so the two can never be open together.
    const [selectingRow, setSelectingRow] = useState<SelectingRowState | null>(null);
    // Null outside a provider — the authoring preview mounts this component without one.
    const editorCtx = useEditorContextSafe();

    // Content-driven box (D8/D9): the shapes that carry a geometric supplement
    // take the size their ink needs inside the outline. Inert on the shapes that
    // fill their box and on a vertex resized by hand. See useContentSize.ts.
    const contentRef = useRef<HTMLDivElement>(null);
    useContentDrivenSize(vertexId, form, contentRef, 'defaultSize' in compiled.ir ? compiled.ir.defaultSize : undefined);

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
            // The type ID rides along with its name: the singleton-select gate matches on the id
            // (names collide across metamodels). Side effect on the signature, declared: a retarget
            // of the feature towards a class of the SAME name now invalidates the memo, where
            // before only a rename did.
            parts.push(`${kind};${fid};${feat.name ?? ''};${typeObj?.name ?? ''};${feat.type ?? ''};${display}`);
        }
        return parts.join('|');
    });

    const rows = useMemo(() => {
        const attributes: CompartmentRowData[] = [];
        const references: CompartmentRowData[] = [];
        if (!compartmentSig) return { attributes, references };
        for (const entry of compartmentSig.split('|')) {
            const [kind, fid, name, typeName, typeId, value] = entry.split(';');
            const row: CompartmentRowData = { key: fid, name, typeName, typeId, value, editableValue: kind === 'A' };
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
            const label = compiled.labels[editingLabel];
            if (label?.editsFeature) {
                // Path label (R-IRN-41): the attribute, through the row value's write path and with
                // its dirty rule; compared with the label's text, the source the edit was seeded from.
                const raw = label.text(readCtx, objectId);
                const changed = (raw == null ? '' : String(raw)) !== editValue;
                syncUpdateFeatureValue(vertexId, label.editsFeature, editValue);
                if (changed) U.isProjectModified = true;
                setEditingLabel(null);
                return;
            }
            // Same source the edit was seeded from (see the label onDoubleClick).
            const changed = (readCtx.getName(objectId) ?? '') !== editValue;
            syncNodeLabel(vertexId, editValue);
            if (changed) U.isProjectModified = true;
            setEditingLabel(null);
        }
    }, [editingLabel, editValue, vertexId, readCtx, objectId, compiled]);

    const editKeys = useCallback((commit: () => void) => (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') { setEditingRow(null); setEditingLabel(null); }
    }, []);

    /**
     * Open the singleton select for a reference row. Everything is resolved HERE, once, and
     * frozen into state: the per-render cost of the feature stays the Set lookup that gated
     * the row, and the store is walked only on the gesture.
     *
     * Candidates come from `DModel.objects` — the same source useM1ReferenceEdges and
     * useJjomSync read — and NOT from a scan of idlookup filtered on a `model` field: DObject
     * has no raw `model` (it declares `father: Pointer<DModel> | Pointer<DValue>`; `model` is
     * an L getter that walks the father chain). Singleton instances are roots of their model
     * by construction (addObject with `father = model.id`), so `objects` holds them.
     */
    const openRowSelect = useCallback((row: CompartmentRowData, anchorRect: DOMRect) => {
        const modelId = editorCtx?.modelId;
        const classIds = editorCtx?.singletonClassIdsByType?.get(row.typeId);
        if (!modelId || !classIds) return;

        const lookup: any = (store.getState() as any).idlookup ?? {};
        const dValue: any = lookup[row.key];
        const dRef: any = dValue?.instanceof ? lookup[dValue.instanceof] : null;
        // A to-one reference replaces; anything else appends. Unknown bound → append is the
        // conservative choice: it never silently drops a value the user had already assigned.
        const mode: 'replace' | 'append' = dRef?.upperBound === 1 ? 'replace' : 'append';
        const assigned: string[] = Array.isArray(dValue?.values)
            ? dValue.values.filter((v: any) => typeof v === 'string' && v !== '')
            : [];

        const options: InlineObjectOption[] = [];
        for (const objId of (lookup[modelId]?.objects ?? [])) {
            if (typeof objId !== 'string') continue;
            const o = lookup[objId];
            if (!o || typeof o !== 'object') continue;
            if (!classIds.has(o.instanceof)) continue;
            if (mode === 'append' && assigned.includes(objId)) continue;
            options.push({ id: objId, name: o.name ?? objId });
        }

        setSelectingRow({
            key: row.key,
            name: row.name,
            typeName: row.typeName,
            mode,
            allowNone: mode === 'replace',
            options,
            value: mode === 'replace' ? (assigned[0] ?? null) : null,
            anchorRect,
        });
    }, [editorCtx]);

    const commitRowSelect = useCallback((objectId: string | null) => {
        if (!selectingRow) return;
        syncSetReferenceValue(vertexId, selectingRow.name, objectId, selectingRow.mode);
        U.isProjectModified = true;
        setSelectingRow(null);
    }, [selectingRow, vertexId]);

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
    // Slice 2 (D1): each axis is resolved PER INSTANCE and on its own. An accessor is
    // null when the view does not declare that axis; all three null = no authored
    // border, where the CSS box applies exactly as before. A conditional with no
    // matching branch resolves to the compile fallback ('' / 1 / 'solid'), and the
    // empty colour falls back to the box colour here, the same convention as fill.
    const borderColorV = compiled.borderColor ? compiled.borderColor(readCtx, objectId) : undefined;
    const borderWidthV = compiled.borderWidth ? compiled.borderWidth(readCtx, objectId) : undefined;
    const borderStyleV = compiled.borderStyle ? compiled.borderStyle(readCtx, objectId) : undefined;
    const hasAuthoredBorder = borderColorV !== undefined || borderWidthV !== undefined || borderStyleV !== undefined;
    // «Color by metaclass»: every line drawn in the border colour (outline, separators) takes the
    // shade, or transparent with Border off; width and style stay the view's, so no size moves.
    const outlineColor = colorOverride ? (colorOverride.border ? colorOverride.stroke : 'transparent') : borderColorV;
    if (hasAuthoredBorder && !svgPainter) {
        inlineStyle.border = `${borderWidthV ?? 1}px ${borderStyleV ?? 'solid'} ${outlineColor || 'var(--border-default)'}`;
    } else if (colorOverride && !svgPainter) {
        inlineStyle.borderColor = outlineColor;
    }

    // Corner radius (slice 3, D5; Conditional by R-IRN-35). Resolved per instance from
    // the compiled axis on the read context, like the border axes above, and never from
    // the source ir. Absent, or a conditional with no matching branch, draws nothing here
    // and the class rules keep 4px and 10px. The box is measured only for a written
    // radius above 0 on a form that honors it; resolveCornerRadius owns every other branch.
    const [svgEl, setSvgEl] = useState<SVGSVGElement | null>(null);
    const authoredRadius = resolveCompiledCornerRadius(compiled, readCtx, objectId);
    const needsCornerBox = authoredRadius !== undefined && authoredRadius > 0 && honorsCornerRadius(form);
    const cornerBox = useCornerBox(needsCornerBox, !!svgPainter, svgEl, contentRef);
    const cornerPaint = resolveCornerRadius(form, authoredRadius, cornerBox);
    if (cornerPaint.kind === 'css') inlineStyle.borderRadius = `${cornerPaint.px}px`;
    const roundedD = cornerPaint.kind === 'path' && svgPainter?.kind === 'svg'
        ? roundedPolygonPath(svgPainter.points, cornerPaint.r, cornerPaint.w, cornerPaint.h)
        : '';
    const svgViewBox = roundedD && cornerPaint.kind === 'path' ? `0 0 ${cornerPaint.w} ${cornerPaint.h}` : '0 0 100 100';
    // Compartment separator color (S2 parity, re-based on D1 by R-IRN-36): reuses the
    // resolved per-axis border colour — no separate axis on FieldCompartmentSpec. It is
    // undefined when the view declares no colour axis, or when a conditional resolves to
    // the empty fallback: both keep the CSS default (irStyle.ts) and leave the separator
    // unaffected, same fallback discipline as `border` above.
    const separatorColorStyle: React.CSSProperties | undefined = outlineColor ? { borderTopColor: outlineColor } : undefined;
    // Node-level text style (ir-1.3 cascade root): inline on the root so every
    // text surface inherits it (irStyle.ts uses `inherit` on labels, rows and
    // inline editors). A label's own style, inline on its span, still wins.
    // fontWeight does NOT reach the top/center labels: their 600 is a class rule
    // (irStyle.ts) and a class rule beats inheritance. That is deliberate: the
    // header keeps its weight, and it is changed from the label's own style.
    // Compartment rows declare no weight, so there it does propagate.
    // resolveTextStyle returns undefined when there is nothing to emit, and
    // Object.assign with undefined is a no-op: no guard needed.
    const nodeTextStyle = resolveTextStyle(compiled.text, readCtx, objectId);
    Object.assign(inlineStyle, nodeTextStyle);
    // «Color by metaclass»: the node tokens the row values (RowValue) and the bar's halo paint with.
    // The text colour is not set on the root (R-VP-51): labels, compartments and badges state it
    // below, so an outside label with no colour of its own inherits what it inherits off.
    if (colorOverride) Object.assign(inlineStyle, metaclassColoringVars(colorOverride));
    // What the node draws outside its box sits on the canvas and paints as with coloring off
    // (R-VP-51): the name ink rebound back, and the node-level colour restated so it resolves there.
    const outsideInk: React.CSSProperties | undefined = colorOverride
        ? { ...metaclassOutsideInkVars(), color: nodeTextStyle?.color } : undefined;
    const overText = (st: React.CSSProperties | undefined, position?: string): React.CSSProperties | undefined =>
        !colorOverride ? st : position === 'outside' ? { ...outsideInk, ...st } : { ...st, color: colorOverride.text };

    // The SVG layer paints the same resolved fill/border, with the box-base
    // fallbacks (irStyle.ts:44) when nothing is authored. The polygon stretches
    // to any aspect ratio; non-scaling-stroke keeps the border a constant width.
    const svgFill = fill || 'var(--node-bg)';
    const svgStroke = outlineColor || 'var(--border-default)';
    const svgStrokeWidth = borderWidthV ?? 1;
    const svgDash = SVG_BORDER_DASH[borderStyleV ?? 'solid'];
    // double (asse bordo, 2026-08-15). CSS shapes get it for free from the
    // inline `border` above (native `border-style: double`, two lines from
    // width >= 3). SVG shapes overdraw: the same polygon stroked at 3w in the
    // border color, then at w in the fill color — two w-wide lines with a
    // w-wide gap, uniform at any aspect ratio thanks to non-scaling-stroke
    // (a polygon inset in the 0..100 viewBox would scale non-uniformly under
    // preserveAspectRatio="none"). Declared limit: a translucent fill makes
    // the gap translucent too.
    const svgDouble = (borderStyleV ?? 'solid') === 'double';

    // Marker (asse marker, 2026-08-15): resolved per instance like form/fill.
    // Unknown or empty id => no layer (open vocabulary, badge-icon precedent).
    // Drawn in the border color, as notations do; scales with min(w,h) via
    // preserveAspectRatio="meet" (irStyle.ts positions the layer).
    const markerId = compiled.marker ? compiled.marker(readCtx, objectId) : '';
    const markerDef = getMarkerDef(markerId ? String(markerId) : undefined);
    // The entry mark sits outside the box, so it keeps this colour while coloured (R-VP-51).
    const inkColor = borderColorV || 'var(--border-default)';
    const markerColor = colorOverride ? colorOverride.text : inkColor;

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
                <svg ref={setSvgEl} className={svgPainter.svgClassName} viewBox={svgViewBox} preserveAspectRatio="none" aria-hidden="true">
                    {/* Selezione: prima l'anello, poi la banda che ne copre la
                        parte interna, poi la sagoma piena che copre entrambe
                        dentro il contorno. Senza colore finche' il nodo non e'
                        selezionato (irStyle). */}
                    {svgOutline(svgPainter, {
                        fill: 'none', strokeWidth: SEL_RING_STROKE_WIDTH, className: 'ir-sel-ring',
                    }, roundedD)}
                    {svgOutline(svgPainter, {
                        fill: 'none', strokeWidth: SEL_BAND_STROKE_WIDTH, className: 'ir-sel-band',
                    }, roundedD)}
                    {svgDouble ? (
                        <>
                            {svgOutline(svgPainter, {
                                fill: svgFill, stroke: svgStroke, strokeWidth: svgStrokeWidth * 3,
                            }, roundedD)}
                            {svgOutline(svgPainter, {
                                fill: 'none', stroke: svgFill, strokeWidth: svgStrokeWidth,
                            }, roundedD)}
                        </>
                    ) : (
                        svgOutline(svgPainter, {
                            fill: svgFill, stroke: svgStroke, strokeWidth: svgStrokeWidth,
                            strokeDasharray: svgDash,
                        }, roundedD)
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
            {compiled.entry && (
                <svg className={`ir-entry-svg ir-entry--${compiled.entry}`} width={ENTRY_W} height={ENTRY_H} viewBox={`0 0 ${ENTRY_W} ${ENTRY_H}`} style={colorOverride ? { ...ENTRY_STYLE, ...metaclassOutsideInkVars() } : ENTRY_STYLE} aria-hidden="true">
                    {compiled.entry === 'dot' && <circle cx={ENTRY_DOT_R} cy={ENTRY_H / 2} r={ENTRY_DOT_R} fill={inkColor} />}
                    <path d={`M ${compiled.entry === 'dot' ? 2 * ENTRY_DOT_R : 0} ${ENTRY_H / 2} H ${ENTRY_W - ENTRY_HEAD}`} stroke={inkColor} strokeWidth={1} fill="none" />
                    <path d={`M ${ENTRY_W - ENTRY_HEAD} ${ENTRY_H / 2 - 4} L ${ENTRY_W} ${ENTRY_H / 2} L ${ENTRY_W - ENTRY_HEAD} ${ENTRY_H / 2 + 4} Z`} fill={inkColor} />
                </svg>
            )}
            {compiled.badges.map((b, i) => {
                if (!b.visible(readCtx, objectId)) return null;
                const icon = b.icon(readCtx, objectId);
                if (!icon) return null;
                return (
                    <span key={`badge_${i}`} className={`ir-badge ir-badge--${b.position}`} style={overText(BADGE_STYLE)} title={b.tooltip}>
                        <i className={`bi ${icon}`} />
                    </span>
                );
            })}
            {collapsedBadge && (
                <span className={`ir-badge ir-badge--${collapsedBadge.position}`} style={overText(BADGE_STYLE)} title={collapsedBadge.tooltip}>
                    <i className={`bi ${collapsedBadge.icon}`} />
                </span>
            )}
            {compiled.labels.map((l, i) => {
                if (!l.visible(readCtx, objectId)) return null;
                const raw = l.text(readCtx, objectId);
                const text = raw == null ? '' : String(raw);
                // Outside label (R-VP-15 (1)): the side rides on a class of its own, so an
                // inside label keeps exactly the class list it had (irStyle.ts places it).
                const anchorClass = l.anchor ? ` ir-label--anchor-${l.anchor}` : '';
                // Editable: intrinsic name/qualifiedName labels edit the element
                // name unless the IR opts out (spec v1.2 sez. 5); a one-step path
                // label that opts in edits its attribute (R-IRN-41).
                const editsFeature = l.editsFeature;
                if ((l.editsName || editsFeature) && editingLabel === i) {
                    return (
                        <input
                            key={`label_${i}`}
                            className={`ir-label ir-label--${l.position}${anchorClass} ir-label__input`}
                            // Same authored style as the span it replaces: the node-level
                            // style already reaches the field by inheritance, this carries
                            // the label's own one, so the text does not change face on
                            // entering the edit.
                            style={overText(resolveTextStyle(l.style, readCtx, objectId), l.position)}
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
                        className={`ir-label ir-label--${l.position}${anchorClass}`}
                        style={overText(resolveTextStyle(l.style, readCtx, objectId), l.position)}
                        onDoubleClick={l.editsName ? () => {
                            setEditingLabel(i);
                            setEditValue(readCtx.getName(objectId) ?? '');
                        } : editsFeature ? () => {
                            // The slot decides at the gesture, as openRowSelect does: a view can
                            // apply to classes where the feature is not a single string attribute.
                            const info = labelFeatureInfoOf((store.getState() as any).idlookup, objectId, editsFeature);
                            if (labelFeatureEditBlock(info) !== null) return;
                            setEditingLabel(i);
                            setEditValue(text);
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
                            // Row style (ir-1.3 TS2) on the compartment, not on each row:
                            // the rows inherit it (irStyle.ts gives .ir-row font-size:
                            // inherit and declares no other text axis), and a dispatched
                            // row view can still override it inline on its own .ir-row.
                            style={{ ...overText(resolveTextStyle(fc.rowStyle, readCtx, objectId)), ...(fc.separator ? separatorColorStyle : undefined) }}
                        >
                            {rowChildIds.map(childId => (
                                <IRRow key={childId} childObjectId={childId} />
                            ))}
                        </div>
                    );
                }
                const isReferenceCompartment = fc.source === 'references';
                const slots = isReferenceCompartment ? rows.references : rows.attributes;
                // R-VP-20: the attributes exclude keeps the named slots out of the rows (the identity
                // slot the name label shows). Every slot excluded draws no compartment, as none does.
                const exclude = fc.exclude;
                const source = exclude ? slots.filter(r => !exclude.includes(r.name)) : slots;
                if (source.length === 0) return null;
                return (
                    <div
                        key={fc.id}
                        className={`ir-compartment${fc.separator ? '' : ' ir-compartment--no-separator'}`}
                        style={{ ...overText(resolveTextStyle(fc.rowStyle, readCtx, objectId)), ...(fc.separator ? separatorColorStyle : undefined) }}
                    >
                        {source.map(row => (
                            <div
                                key={row.key}
                                className="ir-row"
                                /* Alt+click is the accelerator, exactly as on the native
                                   branch (ObjectNode.tsx). A modifier leaves every gesture
                                   already bound on this row where it was: plain click still
                                   selects the node, double click still edits the value or
                                   opens the singleton select, right click still opens the
                                   canvas node menu. */
                                onClick={onInspectFeature ? (e) => {
                                    if (!e.altKey) return;
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onInspectFeature(row.name, (e.currentTarget as HTMLElement).getBoundingClientRect());
                                } : undefined}
                            >
                                {fc.segments.map((seg, si) => {
                                    switch (seg.kind) {
                                        case 'name': return <span key={si}>{row.name}</span>;
                                        case 'type': return <span key={si}>{row.typeName}</span>;
                                        case 'value': {
                                            const editable = row.editableValue && (seg as any).editable !== false;
                                            // A reference row becomes a select ONLY while the
                                            // singletons are hidden: with them on screen the
                                            // gesture stays the arrow (R-SGL-4). `=== false` and
                                            // not `!...`: an absent context means no opinion.
                                            const selectable = isReferenceCompartment
                                                && editorCtx?.showSingletons === false
                                                && !!editorCtx.singletonConformTypeIds?.has(row.typeId)
                                                && (seg as any).editable !== false;
                                            if (selectable) {
                                                return (
                                                    <span
                                                        key={si}
                                                        className="ir-row__value--editable ir-row__value--select"
                                                        onDoubleClick={(e) => openRowSelect(row, e.currentTarget.getBoundingClientRect())}
                                                    >
                                                        {row.value}
                                                        {selectingRow?.key === row.key && (
                                                            <InlineObjectSelect
                                                                value={selectingRow.value}
                                                                typeName={selectingRow.typeName || row.typeName}
                                                                options={selectingRow.options}
                                                                allowNone={selectingRow.allowNone}
                                                                anchorRect={selectingRow.anchorRect}
                                                                onChange={commitRowSelect}
                                                                onClose={() => setSelectingRow(null)}
                                                            />
                                                        )}
                                                    </span>
                                                );
                                            }
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
                                            // The full ladder (R-STR-6 (B)). Only the
                                            // RENDERING is replaced: the span keeps its class
                                            // and its double-click, so a row drawn as a swatch
                                            // is still the row the user edits by double-clicking
                                            // it. Editing itself is handled above, where the
                                            // input replaces everything, and the reference
                                            // select is handled before that — the two gestures
                                            // that own the row keep owning it.
                                            const painted = renderRowValue?.(row.name) ?? null;
                                            return (
                                                <span
                                                    key={si}
                                                    className={editable ? 'ir-row__value--editable' : undefined}
                                                    onDoubleClick={editable ? () => {
                                                        setEditingRow({ key: row.key, name: row.name });
                                                        setEditValue(row.value);
                                                    } : undefined}
                                                >
                                                    {painted ?? row.value}
                                                </span>
                                            );
                                        }
                                        // R-VP-20: a literal's own style, inline on its span; absent, a bare span.
                                        case 'literal': return <span key={si} style={resolveTextStyle(fc.segmentStyles?.[si], readCtx, objectId)}>{seg.text}</span>;
                                        default: return null;
                                    }
                                })}
                                {/* The discoverable way in, for everyone who does not know
                                    about the modifier. Hidden until the row is hovered: an
                                    IR node is authored to a size, and a permanent glyph on
                                    every row would spend that width on chrome. Shown on
                                    EVERY row, including one whose renderer is already
                                    declared — the ladder is where a declaration is undone,
                                    so hiding the icon there would close the only exit. */}
                                {onInspectFeature && (
                                    <button
                                        type="button"
                                        className="ir-row__inspect nodrag"
                                        title="Why this renderer"
                                        aria-label={`Why this renderer for ${row.name}`}
                                        /* onMouseDown too, or React Flow starts dragging the
                                           node under the press before the click ever lands. */
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            const rowEl = (e.currentTarget as HTMLElement).parentElement;
                                            onInspectFeature(row.name, (rowEl ?? e.currentTarget).getBoundingClientRect());
                                        }}
                                    >
                                        <i className="bi bi-sliders" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

export default IRNodeContent;
