/**
 * The `Diagram | Text` switch of the editor bar (R-MT-35, P-2026-11-20-1610): whether its Text entry shows, whether it
 * can be pressed, and the tooltip that says why not. The switch moves between the canvas tab and the Text tab
 * (`txt_<modelId>`) of the same artifact; it does not mount the text inside the canvas tab.
 *
 * No imports: the bench executes it.
 */

/** What the bar knows about the artifact of its tab. */
export interface TextAvailabilityInput {
    /** The tab shows a metamodel: the Text tab prints a model's objects, and a metamodel has none to print. */
    readonly isMetamodel: boolean;
    /** The artifact of the tab; empty or absent, there is nothing to open as text. */
    readonly modelId: string | null | undefined;
    /** The textual view is available at all: the codegen setting, the build flag and Advanced mode (R-GEN-2), the gate
     *  of the picker's textual entry (Toolbar.tsx `codegenEnabled`). */
    readonly textualEnabled: boolean;
}

/** The state of the Text entry. `shown` false: the switch is not rendered at all, as the picker's entry is not. */
export interface TextAvailability {
    readonly shown: boolean;
    readonly enabled: boolean;
    readonly title: string;
}

export const TEXT_ENTRY_TITLE = 'Show the model in its textual notation';
export const TEXT_ENTRY_METAMODEL_TITLE = 'A metamodel has no textual view: open one of its models as text';
export const TEXT_ENTRY_NO_MODEL_TITLE = 'No model to show as text';
export const DIAGRAM_ENTRY_TITLE = 'Show the model on the diagram canvas';

/** The Text entry for the bar of a tab: hidden with the textual view off, disabled on a metamodel or without a model. */
export function textAvailability(input: TextAvailabilityInput): TextAvailability {
    if (!input.textualEnabled) return { shown: false, enabled: false, title: '' };
    if (input.isMetamodel) return { shown: true, enabled: false, title: TEXT_ENTRY_METAMODEL_TITLE };
    if (!input.modelId) return { shown: true, enabled: false, title: TEXT_ENTRY_NO_MODEL_TITLE };
    return { shown: true, enabled: true, title: TEXT_ENTRY_TITLE };
}

/** A dock tab as the switch reads it: its id only. */
export interface SwitchTab { readonly id?: string }

/**
 * The canvas tab the Diagram entry of the Text tab `textTabId` brings forward: the first tab on `modelId` in the Text
 * tab's own group, else the first on it in any other group, else null (the caller opens one). `modelOf` decodes a tab
 * id to its model (modelTabId.ts `modelOfTabId`); the Text tab itself never counts.
 */
export function diagramTabFor(
    modelId: string,
    textTabId: string,
    ownGroup: readonly SwitchTab[] | null,
    otherGroups: readonly (readonly SwitchTab[])[],
    modelOf: (tabId: string) => string,
): string | null {
    const pick = (tabs: readonly SwitchTab[]): string | null => {
        for (const t of tabs) if (t.id && t.id !== textTabId && modelOf(t.id) === modelId) return t.id;
        return null;
    };
    const here = ownGroup ? pick(ownGroup) : null;
    if (here) return here;
    for (const g of otherGroups) {
        const hit = pick(g);
        if (hit) return hit;
    }
    return null;
}
