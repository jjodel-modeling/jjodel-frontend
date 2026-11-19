/**
 * The editor groups of the dock (multi-tab lane 2a, R-MT-30): every rc-dock panel of the `models`
 * group is a group, as in VS Code. The active group is the group of the last focused or activated
 * tab; the dock's other readers go through `activeGroup` instead of reading `dockbox.children[0]`.
 * Split Right is the only move that makes a group (`dockMoveAllowed`).
 *
 * No imports: the bench executes it. The layout is read structurally, so a saved layout (the one
 * `onLayoutChange` receives, tabs reduced to their ids) and the live one both work.
 */

export const MODELS_GROUP = 'models';
export const SUMMARY_TAB_ID = 'project_summary';

export interface GroupTab { id?: string; group?: string; parent?: any }
export interface GroupPanel { id?: string; group?: string; activeId?: string; size?: number; tabs: GroupTab[]; parent?: any }

/** Whether a panel of the layout is an editor group. */
export function isModelGroup(panel: any): panel is GroupPanel {
    if (!panel || !Array.isArray(panel.tabs)) return false;
    return panel.group === MODELS_GROUP || panel.tabs.some((t: GroupTab) => t?.group === MODELS_GROUP || t?.id === SUMMARY_TAB_ID);
}

/** The groups of the dock box, left to right. Floating, windowed and maximized panels are not groups. */
export function modelGroups(layout: any): GroupPanel[] {
    const out: GroupPanel[] = [];
    const walk = (node: any) => {
        if (!node) return;
        if (Array.isArray(node.tabs)) { if (isModelGroup(node)) out.push(node); return; }
        for (const child of node.children ?? []) walk(child);
    };
    walk(layout?.dockbox);
    return out;
}

/** The group holding the tab `tabId`, null when no group does. */
export function groupOfTab(layout: any, tabId: string | null | undefined): GroupPanel | null {
    if (!tabId) return null;
    return modelGroups(layout).find(p => p.tabs.some(t => t?.id === tabId)) ?? null;
}

// The tabs focused or activated, most recent first. The active group is the group of the first one
// still in a group, so closing the last tab of the active group hands the focus to the group used before.
const RECENT_CAP = 32;
let recent: string[] = [];

/** Records that the tab `tabId` was focused or activated. */
export function noteActiveTab(tabId: string | null | undefined): void {
    if (!tabId || recent[0] === tabId) return;
    recent = [tabId, ...recent.filter(id => id !== tabId)].slice(0, RECENT_CAP);
}

export function recentTabIds(): readonly string[] { return recent; }

/** Forgets every recorded tab (a new project, the bench). */
export function resetDockGroups(): void { recent = []; splitDepth = 0; }

/** The active group: the group of the most recent tab still in one, else the first group; null when there is none. */
export function activeGroup(layout: any, recentIds: readonly string[] = recent): GroupPanel | null {
    const groups = modelGroups(layout);
    for (const id of recentIds) {
        const hit = groups.find(p => p.tabs.some(t => t?.id === id));
        if (hit) return hit;
    }
    return groups[0] ?? null;
}

/** The active tab of the active group: "the dock's active tab". Null when there is none. */
export function activeTabId(layout: any, recentIds: readonly string[] = recent): string | null {
    const group = activeGroup(layout, recentIds);
    return group?.activeId ?? group?.tabs[0]?.id ?? null;
}

// Split Right runs its dock move inside `withSplitRight`; the veto lets a `right` move through only then.
let splitDepth = 0;

export function withSplitRight<T>(run: () => T): T {
    splitDepth++;
    try { return run(); } finally { splitDepth--; }
}

export function splitRightInProgress(): boolean { return splitDepth > 0; }

/** What `dockMoveAllowed` is asked about one dock move. */
export interface DockMoveQuery {
    /** A tab, or a whole panel (the drag of an empty strip area). */
    readonly kind: 'tab' | 'panel';
    /** The tab's id, or the panel's active tab id. */
    readonly id?: string;
    /** The rc-dock group of the source. */
    readonly group?: string;
    readonly direction: string;
    /** The rc-dock group of the target panel (or of the target tab's panel); null when there is none. */
    readonly targetGroup?: string | null;
    /** Whether the move runs inside `withSplitRight`. */
    readonly splitting?: boolean;
}

/**
 * The veto on dock moves of the editor groups (G2, G4, Q4). A tab moves only into an existing group
 * (the middle of a panel, before or after a tab); `right` only for Split Right; no other edge, no float,
 * no new window, no maximize; a whole panel never moves. The project summary tab never moves and never
 * closes. Moves of any other rc-dock group, closing a tab and the non-moves (activate, update) pass.
 */
export function dockMoveAllowed(q: DockMoveQuery): boolean {
    const models = q.group === MODELS_GROUP || q.id === SUMMARY_TAB_ID;
    if (!models) return true;
    switch (q.direction) {
        case 'active': case 'update': case 'front': case 'move':
            return true;
        case 'remove':
            return q.kind === 'panel' || q.id !== SUMMARY_TAB_ID;
    }
    if (q.kind === 'panel' || q.id === SUMMARY_TAB_ID) return false;
    switch (q.direction) {
        case 'middle': case 'before-tab': case 'after-tab':
            return q.targetGroup === MODELS_GROUP;
        case 'right':
            return !!q.splitting && q.targetGroup === MODELS_GROUP;
        default:
            return false;
    }
}
