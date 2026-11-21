/**
 * The editor groups persist per user and project (multi-tab lane 3, G7): when a project is reopened its groups come
 * back as they were left, their order, the tabs of each group in order (further tabs `<id>~tab<N>` included, models
 * and metamodels), the active tab of each group, the group widths, the active group, and the viewpoint each tab shows,
 * with its notation and colors (P-2026-11-21-0100).
 *
 * The record is rc-dock's saved layout (`saveLayout`, tabs reduced to `{ id }`) with each tab carrying its model id and
 * its viewpoint id, plus the index of the active group. It is a user preference in `localStorage` under
 * `jjodel.editorGroups.<userId|anon>.<projectId>`, never in the project file. Only artifact tabs (a model's or a
 * metamodel's) are kept; documentation, script, transformation, text and generator tabs are not persisted in v1. The
 * project dashboard is no tab of a group (P-2026-11-20-1632, R-MT-34): it is not saved, a record that still holds its
 * old tab `project_summary` restores without it, and whether it was open is not persisted. The viewpoint id is opaque:
 * abstract syntax is null, anything else is restored when known.
 *
 * Only `modelTabId.ts` is imported, which imports nothing: the bench executes this file.
 */
import { modelOfTabId } from './modelTabId';

export const GROUPS_RECORD_VERSION = 1;
const KEY_PREFIX = 'jjodel.editorGroups.';
const MODELS_GROUP = 'models';
const SUMMARY_TAB_ID = 'project_summary';

/**
 * One tab of the record. The summary tab of an older record carries its id only. `notation` and `colorScheme` are the
 * tab's own canvas view (P-2026-11-21-0100), absent in an older record: the tab then opens on the last value chosen.
 */
export interface SavedGroupTab { id: string; modelId?: string; viewpointId?: string | null; notation?: string; colorScheme?: string }
export interface SavedGroupPanel { id?: string; size?: number; group?: string; activeId?: string; tabs: SavedGroupTab[]; panelLock?: {} }
export interface SavedGroupBox { id?: string; size?: number; mode?: string; children: Array<SavedGroupPanel | SavedGroupBox> }
export interface EditorGroupsRecord { v: number; layout: { dockbox: SavedGroupBox }; activeGroup: number }

/** The storage key of a user's groups on a project; no user is `anon`. */
export function editorGroupsKey(userId: string | null | undefined, projectId: string): string {
    return `${KEY_PREFIX}${userId || 'anon'}.${projectId}`;
}

// ---------------------------------------------------------------------------------------------------------------
// The viewpoint each tab shows now, written by `EditorSwitch` when it changes. Null is abstract syntax.

const tabViewpoints = new Map<string, string | null>();
let changeListener: (() => void) | null = null;

/** Records the viewpoint the tab `tabId` shows; a change tells the listener (the persister) once. */
export function noteTabViewpoint(tabId: string, viewpointId: string | null | undefined): void {
    if (!tabId) return;
    const next = viewpointId || null;
    if (tabViewpoints.has(tabId) && tabViewpoints.get(tabId) === next) return;
    tabViewpoints.set(tabId, next);
    changeListener?.();
}

/** The viewpoint the tab `tabId` shows: null for abstract syntax, undefined when no tab of that id has said. */
export function tabViewpointOf(tabId: string): string | null | undefined {
    return tabViewpoints.has(tabId) ? tabViewpoints.get(tabId) : undefined;
}

export function resetTabViewpoints(): void { tabViewpoints.clear(); }

/** Sets what a tab viewpoint change triggers; null removes it. */
export function setGroupsChangeListener(listener: (() => void) | null): void { changeListener = listener; }

// ---------------------------------------------------------------------------------------------------------------
// The notation and colors each tab shows (P-2026-11-21-0100), written by its EditorV2 at mount and on every change,
// saved in the tab's entry of the record like its viewpoint. A canvas opens on the tab's own value, else on the last
// value chosen anywhere (the global key, what every canvas read before), else on the default. A choice writes both.

export type TabViewPref = 'notation' | 'colorScheme';
export type TabViewPrefs = { notation?: string; colorScheme?: string };

/** The last value chosen anywhere, one key per preference. */
export const GLOBAL_VIEW_PREF_KEYS: Readonly<Record<TabViewPref, string>> = {
    notation: 'editor-v2-notation',
    colorScheme: 'editor-v2-color-scheme',
};

const tabViewPrefs = new Map<string, TabViewPrefs>();

/** Records the value of `pref` the tab `tabId` shows; a change tells the listener (the persister) once. */
export function noteTabViewPref(tabId: string | null | undefined, pref: TabViewPref, value: string): void {
    if (!tabId) return;
    const prefs = tabViewPrefs.get(tabId);
    if (prefs?.[pref] === value) return;
    tabViewPrefs.set(tabId, { ...prefs, [pref]: value });
    changeListener?.();
}

/** The notation and colors the tab `tabId` shows, undefined when its canvas has not said and no record seeded them. */
export function tabViewPrefsOf(tabId: string): TabViewPrefs | undefined {
    return tabViewPrefs.get(tabId);
}

export function resetTabViewPrefs(): void { tabViewPrefs.clear(); }

/** Drops the entries of the tabs not in `tabIds` (closed tabs): a later tab that reuses the id opens on the last value chosen. */
export function retainTabViewPrefs(tabIds: Iterable<string>): void {
    const keep = new Set(tabIds);
    for (const id of [...tabViewPrefs.keys()]) if (!keep.has(id)) tabViewPrefs.delete(id);
}

/** The value of `pref` a canvas of the tab `tabId` opens on: the tab's own, else the global key, else `fallback`. An invalid value counts as absent. */
export function openingViewPref<T extends string>(
    tabId: string | null | undefined, pref: TabViewPref, isValid: (value: string) => boolean, fallback: T,
    storage: Storage | null = pageStorage(),
): T {
    const own = tabId ? tabViewPrefs.get(tabId)?.[pref] : undefined;
    if (own !== undefined && isValid(own)) return own as T;
    let global: string | null = null;
    try { global = storage?.getItem(GLOBAL_VIEW_PREF_KEYS[pref]) ?? null; } catch { /* no storage */ }
    return global !== null && isValid(global) ? global as T : fallback;
}

/** A choice of `pref` in the tab `tabId`: the tab's value and the global key (the last value chosen anywhere). Never throws. */
export function chooseViewPref(tabId: string | null | undefined, pref: TabViewPref, value: string, storage: Storage | null = pageStorage()): void {
    noteTabViewPref(tabId, pref, value);
    try { storage?.setItem(GLOBAL_VIEW_PREF_KEYS[pref], value); } catch { /* quota / private mode */ }
}

// ---------------------------------------------------------------------------------------------------------------
// Save: the record of a saved layout.

const isPanel = (node: any): boolean => !!node && Array.isArray(node.tabs);
const isModelPanel = (node: any): boolean => isPanel(node)
    && (node.group === undefined || node.group === MODELS_GROUP)
    && node.tabs.every((t: any) => t?.group === undefined || t.group === MODELS_GROUP);

/** The panels of a box that are editor groups, left to right. */
function groupsOf(box: any): any[] {
    const out: any[] = [];
    const walk = (node: any) => {
        if (!node) return;
        if (isPanel(node)) { if (isModelPanel(node)) out.push(node); return; }
        for (const child of node.children ?? []) walk(child);
    };
    walk(box);
    return out;
}

export interface BuildContext {
    /** Whether the tab id belongs to a model's or a metamodel's tab (`DockManager`'s artifact test). */
    isArtifactTab: (tabId: string) => boolean;
    /** The viewpoint the tab shows now (`tabViewpointOf`). Undefined is stored as abstract syntax. */
    viewpointOf: (tabId: string) => string | null | undefined;
    /** The notation and colors the tab shows now (`tabViewPrefsOf`); absent fields are not stored. */
    viewPrefsOf?: (tabId: string) => TabViewPrefs | undefined;
}

/** The tab's notation and colors that are strings, as fields to spread into a saved tab. */
function viewPrefFields(prefs: TabViewPrefs | undefined): TabViewPrefs {
    const out: TabViewPrefs = {};
    if (typeof prefs?.notation === 'string') out.notation = prefs.notation;
    if (typeof prefs?.colorScheme === 'string') out.colorScheme = prefs.colorScheme;
    return out;
}

/**
 * The record of a saved layout (`DockLayout.saveLayout()`, or the layout `onLayoutChange` receives) whose active group
 * is `activeGroupId` (a panel id). Only the dock box is kept, and in it only the editor groups, with their artifact
 * tabs; a group left with no tab is dropped. The active group falls back to the first.
 */
export function buildGroupsRecord(savedLayout: any, activeGroupId: string | null | undefined, ctx: BuildContext): EditorGroupsRecord {
    let activeGroup = 0;
    let index = 0;
    const keepPanel = (panel: any): SavedGroupPanel | null => {
        if (!isModelPanel(panel)) return null;
        const tabs: SavedGroupTab[] = [];
        for (const t of panel.tabs) {
            const id = t?.id;
            if (typeof id !== 'string') continue;
            if (id === SUMMARY_TAB_ID || !ctx.isArtifactTab(id)) continue;
            tabs.push({ id, modelId: modelOfTabId(id), viewpointId: ctx.viewpointOf(id) ?? null, ...viewPrefFields(ctx.viewPrefsOf?.(id)) });
        }
        if (!tabs.length) return null;
        if (panel.id !== undefined && panel.id === activeGroupId) activeGroup = index;
        index++;
        const activeId = tabs.some(t => t.id === panel.activeId) ? panel.activeId : tabs[0].id;
        const out: SavedGroupPanel = { tabs, activeId, group: MODELS_GROUP };
        if (typeof panel.id === 'string') out.id = panel.id;
        if (typeof panel.size === 'number') out.size = panel.size;
        return out;
    };
    const keepBox = (box: any): SavedGroupBox | null => {
        const children: Array<SavedGroupPanel | SavedGroupBox> = [];
        for (const child of box?.children ?? []) {
            const kept = isPanel(child) ? keepPanel(child) : keepBox(child);
            if (kept) children.push(kept);
        }
        if (!children.length) return null;
        const out: SavedGroupBox = { mode: box.mode, children };
        if (typeof box.id === 'string') out.id = box.id;
        if (typeof box.size === 'number') out.size = box.size;
        return out;
    };
    const dockbox = keepBox(savedLayout?.dockbox) ?? { mode: 'horizontal', children: [] };
    return { v: GROUPS_RECORD_VERSION, layout: { dockbox }, activeGroup };
}

// ---------------------------------------------------------------------------------------------------------------
// Validation: any structural defect refuses the whole record.

const BOX_MODES = new Set(['horizontal', 'vertical']);
const isOptString = (v: any) => v === undefined || typeof v === 'string';
const isOptSize = (v: any) => v === undefined || (typeof v === 'number' && Number.isFinite(v) && v >= 0);

/** The record when `raw` is a well-formed one, else null. */
export function validateGroupsRecord(raw: any): EditorGroupsRecord | null {
    if (!raw || typeof raw !== 'object' || raw.v !== GROUPS_RECORD_VERSION) return null;
    if (!Number.isInteger(raw.activeGroup) || raw.activeGroup < 0) return null;
    const seen = new Set<string>();
    const okTab = (t: any): boolean => {
        if (!t || typeof t !== 'object' || typeof t.id !== 'string' || !t.id || seen.has(t.id)) return false;
        seen.add(t.id);
        if (t.id === SUMMARY_TAB_ID) return true;
        if (typeof t.modelId !== 'string' || modelOfTabId(t.id) !== t.modelId) return false;
        if (!isOptString(t.notation) || !isOptString(t.colorScheme)) return false;
        return t.viewpointId === null || t.viewpointId === undefined || typeof t.viewpointId === 'string';
    };
    const okPanel = (p: any): boolean => Array.isArray(p.tabs) && p.tabs.length > 0 && p.tabs.every(okTab)
        && isOptString(p.id) && isOptSize(p.size) && isOptString(p.activeId)
        && (p.group === undefined || p.group === MODELS_GROUP);
    const okBox = (b: any, depth: number): boolean => !!b && typeof b === 'object' && depth < 16
        && Array.isArray(b.children) && BOX_MODES.has(b.mode) && isOptString(b.id) && isOptSize(b.size)
        && b.children.every((c: any) => !!c && typeof c === 'object' && (Array.isArray(c.tabs) ? okPanel(c) : okBox(c, depth + 1)));
    const dockbox = raw.layout?.dockbox;
    if (!okBox(dockbox, 0) || !groupsOf(dockbox).length) return null;
    return raw as EditorGroupsRecord;
}

// ---------------------------------------------------------------------------------------------------------------
// Restore: the record pruned against the project as it is now.

export interface PruneContext {
    /** Whether a tab on the model `modelId` can open (the model is in the project and may be shown). */
    canOpenModel: (modelId: string) => boolean;
    /** Whether `viewpointId` is a viewpoint of the project now. */
    viewpointKnown: (viewpointId: string) => boolean;
}

export interface RestorePlan {
    /** The layout to hand to `loadLayout`: tabs carry `{ id, modelId, viewpointId }`, for `loadTab`. */
    layout: { dockbox: SavedGroupBox };
    /** The index of the active group, clamped to the groups left. */
    activeGroup: number;
    /** The tab to note as the most recent (`noteActiveTab`): an artifact tab of the active group, null when it has none. */
    activeTab: string | null;
    /** The artifact tabs restored, in layout order, with the viewpoint each shows until it mounts. */
    tabs: SavedGroupTab[];
}

/**
 * The plan of a restore: a tab whose model cannot open is dropped, the summary tab of an older record is dropped, a
 * group left with no tab is dropped, the active group is clamped, and an unknown viewpoint becomes abstract syntax
 * (null). Group 1 is locked (rc-dock's `panelLock`), so it stays when its tabs close, as the summary tab kept it: the
 * dock always has a group to open into. A record left with no tab restores one empty locked group. Only an artifact
 * tab makes the active group (R-MT-32).
 */
export function pruneGroupsRecord(record: EditorGroupsRecord, ctx: PruneContext): RestorePlan {
    const originalActive = groupsOf(record.layout.dockbox)[record.activeGroup] ?? null;
    const restored: SavedGroupTab[] = [];
    const pruned = new Map<any, SavedGroupPanel>();
    const prunePanel = (panel: SavedGroupPanel): SavedGroupPanel | null => {
        const tabs: SavedGroupTab[] = [];
        for (const t of panel.tabs) {
            if (t.id === SUMMARY_TAB_ID) continue;
            if (!t.modelId || !ctx.canOpenModel(t.modelId)) continue;
            const vp = typeof t.viewpointId === 'string' && t.viewpointId && ctx.viewpointKnown(t.viewpointId) ? t.viewpointId : null;
            // Notation and colors pass as they are: the canvas checks them when it opens (`openingViewPref`).
            tabs.push({ id: t.id, modelId: t.modelId, viewpointId: vp, ...viewPrefFields(t) });
            restored.push({ id: t.id, modelId: t.modelId, viewpointId: vp, ...viewPrefFields(t) });
        }
        if (!tabs.length) return null;
        const activeId = tabs.some(t => t.id === panel.activeId) ? panel.activeId : tabs[0].id;
        const out: SavedGroupPanel = { ...panel, tabs, activeId, group: MODELS_GROUP };
        pruned.set(panel, out);
        return out;
    };
    const pruneBox = (box: SavedGroupBox): SavedGroupBox | null => {
        const children: Array<SavedGroupPanel | SavedGroupBox> = [];
        for (const child of box.children) {
            const kept = Array.isArray((child as any).tabs) ? prunePanel(child as SavedGroupPanel) : pruneBox(child as SavedGroupBox);
            if (kept) children.push(kept);
        }
        return children.length ? { ...box, children } : null;
    };
    const dockbox: SavedGroupBox = pruneBox(record.layout.dockbox) ?? { mode: 'horizontal', children: [] };
    let groups = groupsOf(dockbox) as SavedGroupPanel[];
    if (groups.length) groups[0].panelLock = {};
    else {
        dockbox.children.push({ tabs: [], group: MODELS_GROUP, panelLock: {} });
        groups = groupsOf(dockbox) as SavedGroupPanel[];
    }
    const survivor = originalActive ? pruned.get(originalActive) : undefined;
    const at = survivor ? groups.indexOf(survivor) : -1;
    const activeGroup = at >= 0 ? at : Math.min(record.activeGroup, groups.length - 1);
    const group = groups[activeGroup];
    const artifact = (id: string | undefined) => !!id && id !== SUMMARY_TAB_ID;
    const activeTab = artifact(group.activeId) ? group.activeId as string : (group.tabs.find(t => artifact(t.id))?.id ?? null);
    return { layout: { dockbox }, activeGroup, activeTab, tabs: restored };
}

// ---------------------------------------------------------------------------------------------------------------
// Storage: a read that refuses what it cannot validate, a write that never throws.

/** The `localStorage` of the page, or null when it cannot be reached. */
export function pageStorage(): Storage | null {
    try { return (globalThis as any).localStorage ?? null; } catch { return null; }
}

/** The valid record stored under `key`, null when there is none or it is not valid. */
export function readGroupsRecord(key: string, storage: Storage | null = pageStorage()): EditorGroupsRecord | null {
    try {
        const raw = storage?.getItem(key);
        return raw ? validateGroupsRecord(JSON.parse(raw)) : null;
    } catch { return null; }
}

/** Writes the record under `key`; quota, private mode or no storage are swallowed. True when written. */
export function writeGroupsRecord(key: string, record: EditorGroupsRecord, storage: Storage | null = pageStorage()): boolean {
    try {
        if (!storage) return false;
        storage.setItem(key, JSON.stringify(record));
        return true;
    } catch { return false; }
}

// ---------------------------------------------------------------------------------------------------------------
// The persister: the record is taken at the change, its write waits for the changes to stop.

export interface GroupsPersister {
    /** Takes the record now and writes it once `delayMs` pass with no further change. */
    schedule(key: string, record: EditorGroupsRecord): void;
    /** Writes the pending record now (project close, page unload). */
    flush(): void;
    /** Drops the pending record without writing it. */
    cancel(): void;
}

export function createGroupsPersister(delayMs: number, storage: () => Storage | null = pageStorage): GroupsPersister {
    let pending: { key: string; record: EditorGroupsRecord } | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const stop = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };
    const flush = () => {
        stop();
        const p = pending;
        pending = null;
        if (p) writeGroupsRecord(p.key, p.record, storage());
    };
    return {
        schedule(key, record) {
            if (pending && pending.key !== key) flush();
            pending = { key, record };
            stop();
            timer = setTimeout(flush, delayMs);
        },
        flush,
        cancel() { stop(); pending = null; },
    };
}
