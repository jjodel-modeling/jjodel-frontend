/**
 * Ghost preview elements — the planned creations of a script as synthetic React Flow nodes and
 * edges (S4b, R-JJD-2, decision D3 of the jjodie report).
 *
 * Pure: a plan and the boxes of the nodes already drawn in, React Flow elements out. EditorV2
 * appends them to the arrays it hands to React Flow (the `hideRunEvents` pattern, R-SIM-16/29):
 * nothing is written, laid out or persisted, and no D-object exists behind them. Every id carries
 * `PREVIEW_ID_PREFIX`, which EditorV2's handlers and `getNodes`/`getEdges` filter out.
 *
 * Placement: one column to the right of the drawn top-level nodes, top-aligned with them; an
 * empty canvas starts at the origin. Edges: the reference writes `=` and `+=` whose two ends are
 * drawn (a planned node or a node of the model), and the containment of a
 * `create instance … in P.ref`. A planned element carries the warning marker when a warning's line
 * is its create line or a line that writes one of its features or references, or, for a line that
 * plans no effect (an unknown feature, an unresolvable target), when the line names it as the owner
 * it writes: the instance of `set X.f …`, the slot owner of `remove … from X.f`.
 *
 * M2 (P-2026-10-24-1600): a plan read on a metamodel (`plan.level === 'M2'`) draws its own level only
 * (`buildM2Preview`): a ghost node per planned class, enumeration and package, labelled with its kind
 * and its planned rows (attributes, references, operations, literals); the rows planned into an
 * existing element go in one ghost rows node beside the column, joined to the element's node by a
 * dashed edge; planned references (owner to type) and generalizations (child to parent) are dashed
 * ghost edges when both ends are drawn. An M1 plan draws only its M1 creations.
 *
 * M2 placement (P-2026-10-25-0020): a ghost goes next to the node it relates to, the parent a planned
 * class extends, else the type of a reference it holds, else the holder of a reference typed by it,
 * and for a rows node the element it adds to: right of it, else below, left, above, the first spot
 * that overlaps no drawn node and no ghost already placed. With no related node drawn, or no free
 * spot, it goes in the column right of the drawn nodes, below what the column holds. The planned
 * removals of existing elements are a struck-through ghost beside their holder: the features it
 * loses, or the element itself.
 */
import type { Edge, Node } from '@xyflow/react';
import { effectLevel, type EffectsPlan, type PlannedCreate, type PlanWorld } from '../../../jjscript/executor/effectsPlanner';
import { parse } from '../../../jjscript/parser/parser';

export const PREVIEW_ID_PREFIX = 'jjpreview:';

/** True for the id of a ghost preview node or edge. */
export function isPreviewId(id: unknown): boolean {
    return typeof id === 'string' && id.startsWith(PREVIEW_ID_PREFIX);
}

/** A node already on the canvas: its id, the model element behind it, its box in flow coordinates. */
export interface DrawnNode {
    nodeId: string;
    elementId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    /** Inside a parent node: its position is relative, so it takes no part in the placement. */
    nested: boolean;
}

export const PREVIEW_NODE_WIDTH = 180;
export const PREVIEW_NODE_HEIGHT = 48;
/** The height a planned row adds to an M2 ghost node. */
export const PREVIEW_ROW_HEIGHT = 18;
const COLUMN_GAP = 80;
const ROW_GAP = 24;

export interface PreviewElements {
    nodes: Node[];
    edges: Edge[];
}

/** The model element a container handle names: a planned instance first, else a unique world element. */
function resolveHandle(handle: string, plan: EffectsPlan, world: PlanWorld): string | null {
    const planned = plan.created.filter((c) => c.name === handle);
    if (planned.length > 0) return planned[planned.length - 1].id;
    const found = world.elements.filter((e) => e.name === handle);
    return found.length === 1 ? found[0].id : null;
}

/** The owner a script line writes: X of `set X.f …` and of `remove … from X.f`; null for any other line. */
function writtenOwner(text: string | undefined): string | null {
    if (!text?.trim()) return null;
    try {
        const parsed = parse(text.trim());
        const args: any = parsed.success ? parsed.ast?.args : null;
        if (args?.command === 'set') return args.target?.segments?.join('::') || null;
        if (args?.command === 'remove') return args.from?.segments?.join('::') || null;
    } catch {
        // A line that does not parse names no owner.
    }
    return null;
}

/** `script`, when given, is the text the plan was read from: its lines name the owner of a warning that plans no effect. */
export function buildPreviewElements(plan: EffectsPlan, world: PlanWorld, drawn: readonly DrawnNode[], script?: string): PreviewElements {
    if (plan.level === 'M2') return buildM2Preview(plan, world, drawn, script);
    if (plan.created.some((c) => effectLevel(c) === 'M2')) plan = { ...plan, created: plan.created.filter((c) => effectLevel(c) === 'M1') };
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    if (plan.created.length === 0 && plan.references.length === 0) return { nodes, edges };

    let x = 0;
    let y = 0;
    const placed = drawn.filter((d) => !d.nested);
    if (placed.length > 0) {
        x = Math.max(...placed.map((d) => d.x + d.width)) + COLUMN_GAP;
        y = Math.min(...placed.map((d) => d.y));
    }

    const warnedLines = new Set(plan.warnings.map((w) => w.line));
    const warned = new Set<string>();
    for (const c of plan.created) if (warnedLines.has(c.line)) warned.add(c.id);
    for (const f of plan.features) if (warnedLines.has(f.line)) warned.add(f.ownerId);
    for (const r of plan.references) if (warnedLines.has(r.line)) warned.add(r.sourceId);
    if (script !== undefined) {
        const lines = script.split('\n');
        for (const w of plan.warnings) {
            const owner = writtenOwner(lines[w.line - 1]);
            const id = owner ? resolveHandle(owner, plan, world) : null;
            if (id) warned.add(id);
        }
    }

    // Element id -> node id: planned instances get their preview node, drawn elements their node.
    const nodeOf = new Map<string, string>();
    for (const d of drawn) if (!nodeOf.has(d.elementId)) nodeOf.set(d.elementId, d.nodeId);

    plan.created.forEach((c, i) => {
        const id = PREVIEW_ID_PREFIX + c.id;
        nodeOf.set(c.id, id);
        nodes.push({
            id,
            type: 'default',
            position: { x, y: y + i * (PREVIEW_NODE_HEIGHT + ROW_GAP) },
            width: PREVIEW_NODE_WIDTH,
            height: PREVIEW_NODE_HEIGHT,
            data: { label: `${c.name} : ${c.metaclass}` },
            className: warned.has(c.id) ? 'jj-preview-node jj-preview-node--warning' : 'jj-preview-node',
            draggable: false,
            selectable: false,
            deletable: false,
            connectable: false,
            focusable: false,
        });
    });

    const pushEdge = (source: string | undefined, target: string | undefined, label: string, containment: boolean) => {
        if (!source || !target) return;
        edges.push({
            id: `${PREVIEW_ID_PREFIX}edge:${edges.length + 1}`,
            source,
            target,
            type: 'default',
            label,
            className: containment ? 'jj-preview-edge jj-preview-edge--containment' : 'jj-preview-edge',
            selectable: false,
            deletable: false,
            reconnectable: false,
            focusable: false,
        });
    };

    for (const c of plan.created) {
        if (!c.container) continue;
        const dot = c.container.lastIndexOf('.');
        const owner = resolveHandle(c.container.slice(0, dot), plan, world);
        if (owner) pushEdge(nodeOf.get(owner), nodeOf.get(c.id), c.container.slice(dot + 1), true);
    }
    for (const r of plan.references) {
        if ((r.operator !== '=' && r.operator !== '+=') || !r.targetId) continue;
        pushEdge(nodeOf.get(r.sourceId), nodeOf.get(r.targetId), r.feature, r.containment);
    }
    return { nodes, edges };
}

const M2_NODE_KINDS = new Set(['Class', 'Enumeration', 'Package']);

/** The row of a planned feature or literal in its ghost node; null for a kind drawn as no row (a parameter). */
function m2Row(c: PlannedCreate): string | null {
    switch (c.metaclass) {
        case 'Attribute': return `${c.name} : ${c.type ?? 'EString'}`;
        case 'Reference': return `${c.containment ? '\u25C6 ' : ''}${c.name} \u2192 ${c.type ?? '?'}`;
        case 'Operation': return `${c.name}()${c.type ? ` : ${c.type}` : ''}`;
        case 'Literal': return c.name;
        default: return null;
    }
}

/** The element an M2 line names as the holder it writes into: the container of `create … in X`, `add … to X`, the target of `set X.p`, the class of `X extends Y`. */
function m2NamedHolder(text: string | undefined): string | null {
    if (!text?.trim()) return null;
    try {
        const parsed = parse(text.trim());
        const args: any = parsed.success ? parsed.ast?.args : null;
        const qn = args?.command === 'create' ? args.parent : args?.command === 'add' ? args.to
            : args?.command === 'set' ? args.target : args?.command === 'extends' ? args.childClass : null;
        const segments: string[] | undefined = qn?.segments;
        return segments && segments.length > 0 ? segments[segments.length - 1] : null;
    } catch {
        // A line that does not parse names no holder.
    }
    return null;
}

/** The ghost nodes and edges of a plan read on a metamodel (see the header). */
/** A box in flow coordinates. */
export interface PreviewBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** The clearance a placed ghost keeps from any other box. */
const CLEARANCE = 16;

function overlaps(a: PreviewBox, b: PreviewBox): boolean {
    return a.x < b.x + b.width + CLEARANCE && b.x < a.x + a.width + CLEARANCE
        && a.y < b.y + b.height + CLEARANCE && b.y < a.y + a.height + CLEARANCE;
}

/** The first free spot for a `width` x `height` box next to `anchor`: right, below, left, above; null when all four are taken. */
export function besideSpot(anchor: PreviewBox, width: number, height: number, taken: readonly PreviewBox[]): { x: number; y: number } | null {
    const spots = [
        { x: anchor.x + anchor.width + COLUMN_GAP, y: anchor.y },
        { x: anchor.x, y: anchor.y + anchor.height + ROW_GAP },
        { x: anchor.x - COLUMN_GAP - width, y: anchor.y },
        { x: anchor.x, y: anchor.y - ROW_GAP - height },
    ];
    return spots.find((p) => !taken.some((t) => overlaps({ ...p, width, height }, t))) ?? null;
}

const M2_FEATURE_KINDS = new Set(['Attribute', 'Reference', 'Operation', 'Literal']);

function buildM2Preview(plan: EffectsPlan, world: PlanWorld, drawn: readonly DrawnNode[], script?: string): PreviewElements {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const own = plan.created.filter((c) => effectLevel(c) === 'M2');
    const generalizations = plan.generalizations ?? [];
    const existing = world.m2?.elements ?? [];
    const drawnIds = new Set(drawn.map((d) => d.elementId));
    // Planned removals of drawn elements: per holder, the rows it loses, or the element's own head.
    const removedOf = new Map<string, string[]>();
    for (const d of plan.deleted) {
        if (effectLevel(d) !== 'M2') continue;
        const el = existing.find((e) => e.id === d.id);
        if (!el) continue;
        const holder = M2_FEATURE_KINDS.has(el.kind) ? el.father : el.id;
        if (!holder || !drawnIds.has(holder)) continue;
        const row = M2_FEATURE_KINDS.has(el.kind) ? `\u2212 ${el.name}` : `${el.kind.toLowerCase()} ${el.name}`;
        removedOf.set(holder, [...(removedOf.get(holder) ?? []), row]);
    }
    if (own.length === 0 && generalizations.length === 0 && removedOf.size === 0) return { nodes, edges };

    let x = 0;
    let y = 0;
    const placed = drawn.filter((d) => !d.nested);
    if (placed.length > 0) {
        x = Math.max(...placed.map((d) => d.x + d.width)) + COLUMN_GAP;
        y = Math.min(...placed.map((d) => d.y));
    }
    // Node id -> box: the drawn top-level nodes, then every ghost as it is placed.
    const boxOf = new Map<string, PreviewBox>();
    for (const d of placed) boxOf.set(d.nodeId, { x: d.x, y: d.y, width: d.width, height: d.height });

    // Element id -> node id: drawn elements their node, planned classifiers and packages their ghost.
    const nodeOf = new Map<string, string>();
    for (const d of drawn) if (!nodeOf.has(d.elementId)) nodeOf.set(d.elementId, d.nodeId);
    const heads = own.filter((c) => M2_NODE_KINDS.has(c.metaclass));
    for (const c of heads) nodeOf.set(c.id, PREVIEW_ID_PREFIX + c.id);

    // Rows per holder: a planned head, or an existing element (its ghost rows node).
    const rowsOf = new Map<string, string[]>();
    const holderOf = new Map<string, string>();
    for (const c of own) {
        if (M2_NODE_KINDS.has(c.metaclass)) { holderOf.set(c.id, c.id); continue; }
        const holder = c.containerId ?? '';
        holderOf.set(c.id, holderOf.get(holder) ?? holder);
        const row = m2Row(c);
        if (row === null) continue;
        const key = holderOf.get(c.id)!;
        rowsOf.set(key, [...(rowsOf.get(key) ?? []), row]);
    }

    const warnedLines = new Set(plan.warnings.map((w) => w.line));
    const warned = new Set<string>();
    for (const c of own) if (warnedLines.has(c.line)) warned.add(holderOf.get(c.id) ?? c.id);
    for (const f of plan.features) if (effectLevel(f) === 'M2' && warnedLines.has(f.line)) warned.add(holderOf.get(f.ownerId) ?? f.ownerId);
    if (script !== undefined) {
        // A warned line plans no effect: the holder it names takes the marker, a planned one first.
        const lines = script.split('\n');
        for (const w of plan.warnings) {
            const name = m2NamedHolder(lines[w.line - 1]);
            if (!name) continue;
            const planned = heads.filter((c) => c.name === name);
            if (planned.length > 0) { warned.add(planned[planned.length - 1].id); continue; }
            const found = existing.filter((e) => e.name === name);
            if (found.length === 1) warned.add(M2_NODE_KINDS.has(found[0].kind) ? found[0].id : found[0].father ?? found[0].id);
        }
    }

    const pushNode = (id: string, label: string, rows: number, holder: string, anchors: readonly (string | undefined)[] = [], removed = false) => {
        const height = PREVIEW_NODE_HEIGHT + rows * PREVIEW_ROW_HEIGHT;
        const taken = [...boxOf.values()];
        let position: { x: number; y: number } | null = null;
        for (const a of anchors) {
            const box = a ? boxOf.get(a) : undefined;
            if (box && (position = besideSpot(box, PREVIEW_NODE_WIDTH, height, taken))) break;
        }
        if (!position) {
            // The column: below what it holds, past any box in the way.
            while (taken.some((t) => overlaps({ x, y, width: PREVIEW_NODE_WIDTH, height }, t))) y += PREVIEW_ROW_HEIGHT;
            position = { x, y };
            y += height + ROW_GAP;
        }
        boxOf.set(id, { ...position, width: PREVIEW_NODE_WIDTH, height });
        const classes = ['jj-preview-node'];
        if (removed) classes.push('jj-preview-node--removed');
        if (warned.has(holder)) classes.push('jj-preview-node--warning');
        nodes.push({
            id,
            type: 'default',
            position,
            width: PREVIEW_NODE_WIDTH,
            height,
            data: { label },
            style: { whiteSpace: 'pre-line' },
            className: classes.join(' '),
            draggable: false,
            selectable: false,
            deletable: false,
            connectable: false,
            focusable: false,
        });
    };
    const pushEdge = (source: string | undefined, target: string | undefined, label: string, containment: boolean) => {
        if (!source || !target) return;
        edges.push({
            id: `${PREVIEW_ID_PREFIX}edge:${edges.length + 1}`,
            source,
            target,
            type: 'default',
            label,
            className: containment ? 'jj-preview-edge jj-preview-edge--containment' : 'jj-preview-edge',
            selectable: false,
            deletable: false,
            reconnectable: false,
            focusable: false,
        });
    };

    // What a planned head relates to, nearest first: the parent it extends, the type of a reference it holds, the holder of a reference typed by it.
    const anchorsOf = (id: string): (string | undefined)[] => [
        ...generalizations.filter((g) => g.childId === id).map((g) => nodeOf.get(g.parentId)),
        ...own.filter((r) => r.metaclass === 'Reference' && holderOf.get(r.id) === id && r.typeId).map((r) => nodeOf.get(r.typeId!)),
        ...own.filter((r) => r.metaclass === 'Reference' && r.typeId === id).map((r) => nodeOf.get(holderOf.get(r.id) ?? '')),
    ];
    for (const c of heads) {
        const rows = rowsOf.get(c.id) ?? [];
        const head = `${c.metaclass === 'Class' && c.abstract ? 'abstract ' : ''}${c.metaclass.toLowerCase()} ${c.name}`;
        pushNode(PREVIEW_ID_PREFIX + c.id, [head, ...rows].join('\n'), rows.length, c.id, anchorsOf(c.id));
    }
    for (const [holder, rows] of rowsOf) {
        if (nodeOf.get(holder) && isPreviewId(nodeOf.get(holder))) continue;
        const target = nodeOf.get(holder);
        if (!target) continue;
        const id = `${PREVIEW_ID_PREFIX}rows:${holder}`;
        pushNode(id, rows.map((r) => `+ ${r}`).join('\n'), rows.length - 1, holder, [target]);
        pushEdge(id, target, '', false);
    }
    for (const [holder, rows] of removedOf) {
        const target = nodeOf.get(holder);
        if (!target) continue;
        const id = `${PREVIEW_ID_PREFIX}removed:${holder}`;
        pushNode(id, rows.join('\n'), rows.length - 1, holder, [target], true);
        pushEdge(id, target, '', false);
    }
    for (const c of own) {
        if (c.metaclass !== 'Reference' || !c.typeId) continue;
        pushEdge(nodeOf.get(holderOf.get(c.id) ?? ''), nodeOf.get(c.typeId), c.name, !!c.containment);
    }
    for (const g of generalizations) pushEdge(nodeOf.get(g.childId), nodeOf.get(g.parentId), 'extends', false);
    return { nodes, edges };
}

/** `base` with the preview appended; `base` itself, same reference, when there is nothing to add. */
export function appendPreview<T extends { nodes: Node[]; edges: Edge[] }>(base: T, preview: PreviewElements | null): T {
    if (!preview || (preview.nodes.length === 0 && preview.edges.length === 0)) return base;
    return { ...base, nodes: [...base.nodes, ...preview.nodes], edges: [...base.edges, ...preview.edges] };
}

/** The boxes of the drawn, visible nodes; `elementOf` gives the model element behind a node. */
export function drawnNodes(nodes: readonly Node[], elementOf: (nodeId: string) => string | undefined): DrawnNode[] {
    const out: DrawnNode[] = [];
    for (const n of nodes) {
        if (n.hidden || isPreviewId(n.id)) continue;
        out.push({
            nodeId: n.id,
            elementId: elementOf(n.id) ?? n.id,
            x: n.position.x,
            y: n.position.y,
            width: (n.measured?.width ?? n.width ?? PREVIEW_NODE_WIDTH) as number,
            height: (n.measured?.height ?? n.height ?? PREVIEW_NODE_HEIGHT) as number,
            nested: !!n.parentId,
        });
    }
    return out;
}
