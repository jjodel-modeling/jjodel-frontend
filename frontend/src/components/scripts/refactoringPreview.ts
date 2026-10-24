/**
 * The read-only metamodel view of the Refactoring tab, and the planned effects drawn on it
 * (P-2026-10-24-2320, R-JJD-2).
 *
 * Pure: reads the `PlanWorld` the tab planned against and, while previewing, the `EffectsPlan`.
 * Classes and enumerations become boxes with their features; with a plan, what the script adds is
 * `added`, what it deletes `removed` (cascade included), what it renames `renamed`, and the
 * generalizations it writes are `added` edges. Nothing here touches the store, the canvas or the
 * D-layer; the type of an existing feature is named through the caller's `typeName`.
 */
import type { EffectsPlan, PlanWorld, PlannedCreate } from '../../jjscript/executor/effectsPlanner';

export type ViewStatus = 'kept' | 'added' | 'removed' | 'renamed';

export interface ViewFeature {
    id: string;
    name: string;
    kind: 'Attribute' | 'Reference' | 'Operation' | 'Literal';
    type?: string;
    status: ViewStatus;
    /** The name before a rename. */
    from?: string;
}

export interface ViewClass {
    id: string;
    name: string;
    kind: 'Class' | 'Enumeration';
    abstract: boolean;
    status: ViewStatus;
    from?: string;
    features: ViewFeature[];
}

export interface ViewGeneralization {
    childId: string;
    parentId: string;
    status: 'kept' | 'added' | 'removed';
}

export interface MetamodelView {
    classes: ViewClass[];
    generalizations: ViewGeneralization[];
}

const FEATURE_KINDS = new Set(['Attribute', 'Reference', 'Operation', 'Literal']);

/** The metamodel of `world`, with the effects of `plan` on it when there is one. */
export function metamodelView(world: PlanWorld, plan: EffectsPlan | null, typeName: (id: string) => string | undefined = () => undefined): MetamodelView {
    const elements = world.m2?.elements ?? [];
    const classes = new Map<string, ViewClass>();
    const features = new Map<string, ViewFeature>();
    for (const e of elements) {
        if (e.kind !== 'Class' && e.kind !== 'Enumeration') continue;
        classes.set(e.id, { id: e.id, name: e.name, kind: e.kind, abstract: !!e.abstract, status: 'kept', features: [] });
    }
    const nameOf = (id: string | null | undefined): string | undefined =>
        !id ? undefined : elements.find((x) => x.id === id)?.name ?? typeName(id);
    for (const e of elements) {
        if (!FEATURE_KINDS.has(e.kind) || !e.father) continue;
        const owner = classes.get(e.father);
        if (!owner) continue;
        const f: ViewFeature = { id: e.id, name: e.name, kind: e.kind as ViewFeature['kind'], status: 'kept' };
        const t = nameOf(e.type);
        if (t) f.type = t;
        owner.features.push(f);
        features.set(e.id, f);
    }
    const generalizations: ViewGeneralization[] = [];
    for (const e of elements) {
        if (e.kind !== 'Class') continue;
        for (const p of e.extends ?? []) if (classes.has(p)) generalizations.push({ childId: e.id, parentId: p, status: 'kept' });
    }
    if (plan) applyPlan(plan, classes, features, generalizations);
    return { classes: [...classes.values()], generalizations };
}

function applyPlan(plan: EffectsPlan, classes: Map<string, ViewClass>, features: Map<string, ViewFeature>, generalizations: ViewGeneralization[]): void {
    const m2 = (e: { level?: 'M2' }) => e.level === 'M2';
    const created = plan.created.filter(m2);
    for (const c of created) {
        if (c.metaclass === 'Class' || c.metaclass === 'Enumeration') {
            classes.set(c.id, { id: c.id, name: c.name, kind: c.metaclass, abstract: !!c.abstract, status: 'added', features: [] });
        }
    }
    for (const c of created) {
        if (!FEATURE_KINDS.has(c.metaclass)) continue;
        const owner = c.containerId ? classes.get(c.containerId) : undefined;
        if (!owner) continue;
        const f = addedFeature(c);
        owner.features.push(f);
        features.set(c.id, f);
    }
    for (const r of plan.renamed.filter(m2)) {
        const target = classes.get(r.id) ?? features.get(r.id);
        if (!target) continue;
        if (target.status === 'kept') { target.status = 'renamed'; target.from = r.from; }
        target.name = r.to;
    }
    for (const g of plan.generalizations ?? []) {
        if (classes.has(g.childId) && classes.has(g.parentId)) generalizations.push({ childId: g.childId, parentId: g.parentId, status: 'added' });
    }
    for (const d of plan.deleted.filter(m2)) {
        const cls = classes.get(d.id);
        if (cls) {
            cls.status = 'removed';
            for (const f of cls.features) f.status = 'removed';
            for (const g of generalizations) if (g.childId === d.id || g.parentId === d.id) g.status = 'removed';
            continue;
        }
        const f = features.get(d.id);
        if (f) f.status = 'removed';
    }
    // An added element the script then deletes leaves nothing to draw.
    for (const [id, c] of classes) if (c.status === 'removed' && id.startsWith('planned:')) classes.delete(id);
    for (const c of classes.values()) c.features = c.features.filter((f) => !(f.status === 'removed' && f.id.startsWith('planned:')));
    for (let i = generalizations.length - 1; i >= 0; i--) {
        const g = generalizations[i];
        if (!classes.has(g.childId) || !classes.has(g.parentId) || (g.status === 'removed' && (g.childId.startsWith('planned:') || g.parentId.startsWith('planned:')))) generalizations.splice(i, 1);
    }
}

function addedFeature(c: PlannedCreate): ViewFeature {
    const f: ViewFeature = { id: c.id, name: c.name, kind: c.metaclass as ViewFeature['kind'], status: 'added' };
    if (c.type) f.type = c.type;
    return f;
}

// ── Layout ────────────────────────────────────────────────────────────────────

export const BOX_WIDTH = 180;
export const BOX_HEADER = 28;
export const BOX_ROW = 18;
export const BOX_GAP = 40;
export const VIEW_PADDING = 16;

export interface BoxLayout { id: string; x: number; y: number; width: number; height: number }
export interface EdgeLayout { childId: string; parentId: string; status: ViewGeneralization['status']; x1: number; y1: number; x2: number; y2: number }
export interface ViewLayout { boxes: BoxLayout[]; edges: EdgeLayout[]; width: number; height: number }

export function boxHeight(c: ViewClass): number {
    return BOX_HEADER + Math.max(1, c.features.length) * BOX_ROW + 8;
}

/** The columns that fit `paneWidth`, at least one. */
export function columnsFor(paneWidth: number): number {
    return Math.max(1, Math.floor((paneWidth - 2 * VIEW_PADDING + BOX_GAP) / (BOX_WIDTH + BOX_GAP)));
}

/** Where a segment from the centre of `b` towards (`tx`, `ty`) leaves the box. */
function borderPoint(b: BoxLayout, tx: number, ty: number): { x: number; y: number } {
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    const dx = tx - cx;
    const dy = ty - cy;
    if (!dx && !dy) return { x: cx, y: cy };
    const t = Math.min(dx ? b.width / 2 / Math.abs(dx) : Infinity, dy ? b.height / 2 / Math.abs(dy) : Infinity);
    return { x: cx + dx * t, y: cy + dy * t };
}

/**
 * A grid, row by row in the view's order; a row is as tall as its tallest box. A parent class is
 * placed before its children when it is in the view, so generalizations mostly point up.
 */
export function layoutView(view: MetamodelView, columns: number): ViewLayout {
    const order = parentsFirst(view);
    const boxes: BoxLayout[] = [];
    let y = VIEW_PADDING;
    for (let i = 0; i < order.length; i += columns) {
        const row = order.slice(i, i + columns);
        const h = Math.max(...row.map(boxHeight));
        row.forEach((c, j) => boxes.push({ id: c.id, x: VIEW_PADDING + j * (BOX_WIDTH + BOX_GAP), y, width: BOX_WIDTH, height: boxHeight(c) }));
        y += h + BOX_GAP;
    }
    const byId = new Map(boxes.map((b) => [b.id, b]));
    const edges: EdgeLayout[] = [];
    for (const g of view.generalizations) {
        const c = byId.get(g.childId);
        const p = byId.get(g.parentId);
        if (!c || !p) continue;
        const from = borderPoint(c, p.x + p.width / 2, p.y + p.height / 2);
        const to = borderPoint(p, c.x + c.width / 2, c.y + c.height / 2);
        edges.push({ childId: g.childId, parentId: g.parentId, status: g.status, x1: from.x, y1: from.y, x2: to.x, y2: to.y });
    }
    const width = boxes.length ? Math.max(...boxes.map((b) => b.x + b.width)) + VIEW_PADDING : 0;
    const height = boxes.length ? y - BOX_GAP + VIEW_PADDING : 0;
    return { boxes, edges, width, height };
}

function parentsFirst(view: MetamodelView): ViewClass[] {
    const byId = new Map(view.classes.map((c) => [c.id, c]));
    const parents = new Map<string, string[]>();
    for (const g of view.generalizations) parents.set(g.childId, [...(parents.get(g.childId) ?? []), g.parentId]);
    const out: ViewClass[] = [];
    const seen = new Set<string>();
    const visit = (id: string, depth: number) => {
        if (seen.has(id) || depth > 64) return;
        seen.add(id);
        for (const p of parents.get(id) ?? []) visit(p, depth + 1);
        const c = byId.get(id);
        if (c) out.push(c);
    };
    for (const c of view.classes) visit(c.id, 0);
    return out;
}

// ── The bottom bar ────────────────────────────────────────────────────────────

export interface EffectChip { key: string; label: string; tone: 'add' | 'remove' | 'change' }

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The effect chips of the preview bar: what the plan adds, removes and renames, per kind. */
export function effectChips(plan: EffectsPlan): EffectChip[] {
    const m2 = (e: { level?: 'M2' }) => e.level === 'M2';
    const created = plan.created.filter(m2);
    const classesAdded = created.filter((c) => c.metaclass === 'Class' || c.metaclass === 'Enumeration').length;
    const featuresAdded = created.filter((c) => FEATURE_KINDS.has(c.metaclass)).length;
    const deleted = plan.deleted.filter(m2);
    const removed = deleted.length;
    const renamed = plan.renamed.filter(m2).length;
    const gens = plan.generalizations?.length ?? 0;
    const objects = plan.created.filter((c) => !m2(c)).length;
    const m1Other = plan.features.filter((f) => !m2(f)).length + plan.references.length + plan.deleted.filter((d) => !m2(d)).length + plan.renamed.filter((r) => !m2(r)).length;
    const chips: EffectChip[] = [];
    if (classesAdded) chips.push({ key: 'classes', label: `+${plural(classesAdded, 'class', 'classes')}`, tone: 'add' });
    if (featuresAdded) chips.push({ key: 'features', label: `+${plural(featuresAdded, 'feature', 'features')}`, tone: 'add' });
    if (gens) chips.push({ key: 'generalizations', label: `+${plural(gens, 'generalization', 'generalizations')}`, tone: 'add' });
    if (removed) chips.push({ key: 'removed', label: `−${plural(removed, 'element', 'elements')}`, tone: 'remove' });
    if (renamed) chips.push({ key: 'renamed', label: `${plural(renamed, 'rename', 'renames')}`, tone: 'change' });
    if (objects) chips.push({ key: 'objects', label: `+${plural(objects, 'object', 'objects')}`, tone: 'add' });
    if (m1Other) chips.push({ key: 'm1', label: `${plural(m1Other, 'model write', 'model writes')}`, tone: 'change' });
    return chips;
}

/** The impact on conforming models: the slot values each one loses (`FEATURE_HAS_VALUES`), summed over the lines. */
export function modelImpact(plan: EffectsPlan): string[] {
    const perModel = new Map<string, number>();
    for (const w of plan.warnings) {
        const m = w.code === 'FEATURE_HAS_VALUES' ? /^(.*) loses (\d+) slot values?$/.exec(w.message) : null;
        if (m) perModel.set(m[1], (perModel.get(m[1]) ?? 0) + Number(m[2]));
    }
    return [...perModel].map(([model, n]) => `${model} loses ${plural(n, 'slot value', 'slot values')}`);
}
