/**
 * The dock id of a model's tab (multi-tab L6, R-MT-9): the first tab of a model has the bare model
 * id (`TabDataMaker.model`), every further one `<modelId>~tab<N>`. The spelling lives here and is
 * decoded only by `modelOfTabId`. A model id never contains `~` (`Constructors.makeID`), nor does
 * any prefixed tab id (`doc_`, `jjtl_`, `jjs_`, `vp_`, the manager's).
 *
 * No imports: the bench executes it.
 */
const FURTHER_TAB_INFIX = '~tab';

/** The model a tab id belongs to; any other tab id is returned unchanged. */
export function modelOfTabId(tabId: string): string {
    const at = tabId.indexOf(FURTHER_TAB_INFIX);
    return at < 0 ? tabId : tabId.slice(0, at);
}

/** The id of the next tab on `modelId`: the bare id when free, else the first free suffix. */
export function nextModelTabId(modelId: string, openTabIds: readonly string[]): string {
    if (!openTabIds.includes(modelId)) return modelId;
    for (let n = 2; ; n++) {
        const id = `${modelId}${FURTHER_TAB_INFIX}${n}`;
        if (!openTabIds.includes(id)) return id;
    }
}

/** Every tab id of a dock layout, docked, floating, windowed or maximized. */
export function layoutTabIds(layout: any): string[] {
    const ids: string[] = [];
    const walk = (box: any) => {
        for (const child of box?.children ?? []) {
            if (child.tabs) ids.push(...child.tabs.map((t: any) => t.id as string));
            else walk(child);
        }
    };
    if (layout) [layout.dockbox, layout.floatbox, layout.windowbox, layout.maxbox].forEach(walk);
    return ids;
}
