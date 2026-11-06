/**
 * openTextualTab — opens the Text tab of a model (R-TXT-23, slice T2b, P-2026-11-02-0040), and the Text tab of a new
 * model with «Create model» (slice T2c, P-2026-11-02-0045).
 *
 * The target of the toolbar picker's dynamic import (Toolbar.tsx `handleViewpointChange`, the textual entry of
 * dataManagerOption.ts) and of the left bar's «New model from text» (LeftBar.tsx): the ways into this directory from
 * the eager bundle (R-GEN-2, scripts/gates/check-codegen-lazy.ts). One tab per model, `txt_<modelId>`, and one per
 * metamodel for a new model, `txt_new_<metamodelId>`, opened through `DockManager.open` as the manager is, so a second
 * pick activates the open tab instead of mounting another; no change to DockManager or TabDataMaker. The title carries
 * `data-type="textual"`, not `model`: Dock.tsx `handleLayoutChange` reads that attribute, and `model` would announce
 * the tab's id as a model's. The app bar lists the tab by its `appBarTitle` (Navbar.tsx `syncTabs`), null once the
 * model or the metamodel is gone. The label is the picker's (dataManagerOption.ts `textualOptionLabel`), read live
 * from the store, so the language's name a record sets after the tab opened shows in the app bar too.
 *
 * `writeTextualSyntax` stores a metamodel's syntax annotations (syntaxRecord.ts), the one write of the record: the Text
 * tab's style picker calls it (step C3a, P-2026-11-04-0412), until the record's editing UI (step T4b).
 */

import type { TabData } from 'rc-dock';
import DockManager from '../../../components/abstract/DockManager';
import { DUser, L, LPointerTargetable, U, store } from '../../../joiner';
import type { LModel, LProject } from '../../../joiner';
import { COMMIT } from '../../../redux/action/action';
import { beginUndoGroup, endUndoGroup } from '../../../redux/reducer/reducer';
import { buildPlanWorld } from '../../../jjscript/executor/planWorld';
import { applyAsOneStep } from '../../../components/editor-v2/preview/PreviewBar';
import { TEXTUAL_SYNTAX_KEY, textualLanguageNameOf, textualLanguageOf, textualOptionLabel } from '../../../components/editor-v2/dataManagerOption';
import { createM1 } from '../../../pages/components/Navbar';
import { JjScriptEvents } from '../../../events/registry';
import { toast } from '../../../components/Toast/toastDispatch';
import type { AppBarTabHooks } from '../../ui/generatorTabs';
import type { SyntaxAnnotations } from '../annotations';
import { storedSyntax, syntaxPatch } from '../syntaxRecord';
import TextualTab, { NewTextualTab } from './TextualTab';

/** The prefix of a Text tab's id. */
export const TEXTUAL_TAB_PREFIX = 'txt_';

export const textualTabId = (modelId: string): string => `${TEXTUAL_TAB_PREFIX}${modelId}`;

/** The id of the Text tab of a new model of `metamodelId`. */
export const newTextualTabId = (metamodelId: string): string => `${TEXTUAL_TAB_PREFIX}new_${metamodelId}`;

const lookupOf = (): Record<string, any> => (store.getState() as any)?.idlookup ?? {};
const nameOf = (o: any): string | null => (typeof o?.name === 'string' && o.name ? o.name : null);

/** The label of the metamodel `mm`'s textual entry: the language's name when its record sets one, else its name. */
const metamodelLabel = (mm: any): string => textualOptionLabel(nameOf(mm), textualLanguageOf(mm?._state?.[TEXTUAL_SYNTAX_KEY]));

/**
 * Stores `record` as the syntax annotations of the metamodel `metamodelId`: one `state` assignment, one undo step, as
 * a generator's Save (TemplateEditorTab.tsx). Nothing is written when the record is the stored one. False when the
 * metamodel is not in the store. Its callers: the Text tab's style picker, and Save of its Syntax mode (SyntaxForm.tsx,
 * step C2b), which writes the whole draft at once.
 */
export function writeTextualSyntax(metamodelId: string, record: SyntaxAnnotations): boolean {
    const lookup = lookupOf();
    if (!lookup[metamodelId]) return false;
    const patch = syntaxPatch(storedSyntax(lookup, metamodelId), record);
    if (patch) (LPointerTargetable.fromPointer(metamodelId as any) as any).state = patch;
    return true;
}

/** Opens, or brings forward, the Text tab of `modelId`, titled with `label`; false when the dock or the model is missing. */
export function openTextualTab(modelId: string, label: string): boolean {
    if (!DockManager.dock || !modelId) return false;
    const model = lookupOf()[modelId];
    if (!model) return false;
    const id = textualTabId(modelId);
    const name = nameOf(model) ?? 'Unnamed';
    const appBar: AppBarTabHooks = {
        appBarTitle: () => {
            const lookup = lookupOf();
            const m = lookup[modelId];
            if (!m) return null;
            const live = lookup[m.instanceof] ? textualOptionLabel(nameOf(lookup[m.instanceof]), textualLanguageNameOf(lookup, modelId)) : label;
            return `${nameOf(m) ?? 'Unnamed'} · ${live}`;
        },
        requestClose: () => { DockManager.closeTab(id); },
    };
    const tab: TabData & AppBarTabHooks = {
        ...appBar,
        id,
        group: 'models',
        closable: true,
        title: <div className="tab-title active-on-mouseenter" data-type="textual">{`${name} · ${label}`}</div>,
        content: <TextualTab key={id} modelId={modelId} label={label} tabId={id} writeSyntax={writeTextualSyntax} />,
    };
    void DockManager.open('models', tab);
    return true;
}

/** The names of the metamodel's models, as `createM1` reads them. */
function modelNamesOf(lookup: Record<string, any>, metamodelId: string): string[] {
    const names: string[] = [];
    for (const id in lookup) {
        const o = lookup[id];
        if (o?.className === 'DModel' && o.isMetamodel !== true && o.instanceof === metamodelId && nameOf(o)) names.push(o.name);
    }
    return names;
}

/** The name a new model of `metamodelId` gets by default: the New model dialog's rule (NewModelDialog.tsx). */
function initialModelName(metamodelId: string): string {
    const taken = modelNamesOf(lookupOf(), metamodelId);
    return U.increaseEndingNumber('model_' + 1, false, false, n => taken.indexOf(n) >= 0);
}

/** Opens, or brings forward, the Text tab of a new model of `metamodelId`; false when the dock or the metamodel is missing. */
export function openNewModelTab(metamodelId: string): boolean {
    if (!DockManager.dock || !metamodelId) return false;
    const mm = lookupOf()[metamodelId];
    if (!mm) return false;
    const id = newTextualTabId(metamodelId);
    const label = metamodelLabel(mm);
    const appBar: AppBarTabHooks = {
        appBarTitle: () => (lookupOf()[metamodelId] ? `New model · ${metamodelLabel(lookupOf()[metamodelId])}` : null),
        requestClose: () => { DockManager.closeTab(id); },
    };
    const tab: TabData & AppBarTabHooks = {
        ...appBar,
        id,
        group: 'models',
        closable: true,
        title: <div className="tab-title active-on-mouseenter" data-type="textual">{`New model · ${label}`}</div>,
        content: (
            <NewTextualTab
                key={id}
                metamodelId={metamodelId}
                label={label}
                tabId={id}
                initialName={initialModelName(metamodelId)}
                onCreate={(name, script) => createModelFromText(metamodelId, name, script)}
            />
        ),
    };
    void DockManager.open('models', tab);
    return true;
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** The canvas's first writes land within a few batch intervals (`U.UpdatingTimer`, 300 ms) of its mount. */
const CANVAS_SETTLE_MS = 300;
const CANVAS_SETTLES = 4;

/** The interval the store needs to resolve a new model's D-object: a few batch intervals (`U.UpdatingTimer`). */
const MODEL_WAIT_MS = 3000;

/**
 * Waits until the model is in the store with its metamodel and in the project's `models`, where the executor looks
 * for it (instance.ts `resolveTargetModel`): a script started before misses it, and its contained objects fail
 * (measured by the probe of P-2026-11-02-0235: 14 of 21 lines). False on timeout.
 */
async function modelInStore(modelId: string): Promise<boolean> {
    for (let waited = 0; waited <= MODEL_WAIT_MS; waited += 50) {
        COMMIT(undefined, false);
        await sleep(50);
        const models: LModel[] = (L.fromPointer(DUser.current) as any)?.project?.models ?? [];
        if (typeof lookupOf()[modelId]?.instanceof === 'string' && models.some(m => m?.id === modelId)) return true;
    }
    return false;
}

/**
 * Creates the model `name` of `metamodelId` and runs `script` on it, as one undo step: the model through `createM1`
 * (the New model dialog's creation), the objects through `applyAsOneStep` (the preview's Apply), in one undo group.
 * The user's gesture opens the D-layer history before the creation (R-UNDO-2, reducer.ts `isRelevantChangeCheck`),
 * or the model would not be in the step. The new model's canvas opens inside the group too, so its first writes
 * are in the same step. True when the model was created (a line that did not run is reported by a toast).
 */
export async function createModelFromText(metamodelId: string, name: string, script: string): Promise<boolean> {
    const project: LProject | undefined = (L.fromPointer(DUser.current) as any)?.project;
    const mm = L.fromPointer(metamodelId) as LModel | undefined;
    if (!project || !mm) {
        toast.error('The metamodel is no longer in the project.', 'New model from text');
        return false;
    }
    let model: LModel | null = null;
    let outcome = { applied: 0, failed: 0 };
    beginUndoGroup();
    U.userHasInteracted = true;
    try {
        model = createM1(project, mm, false, name);
        if (!(await modelInStore(model.id))) throw new Error('the model did not reach the store');
        if (script.trim()) {
            window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_START, {
                detail: { script, commandCount: script.split('\n').length, mode: 'textual' },
            }));
            try {
                outcome = await applyAsOneStep({ script, modelId: model.id, world: buildPlanWorld(lookupOf() as any, model.id) });
            } finally {
                window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
                    detail: { status: outcome.failed === 0 ? 'completed' : 'error' },
                }));
            }
        }
        U.isProjectModified = true;
        // The canvas opens inside the group (deviation from 0045's order, P-2026-11-02-0235): opened after it, the
        // sync layer's first writes (graph, vertices) landed as a second undo step, and one undo left the model.
        await DockManager.open2(model);
        for (let i = 0; i < CANVAS_SETTLES; i++) {
            COMMIT(undefined, false);
            await sleep(CANVAS_SETTLE_MS);
        }
    } catch (e) {
        toast.error(`The model could not be created: ${e instanceof Error ? e.message : String(e)}`, 'New model from text');
        return false;
    } finally {
        COMMIT(undefined, false);
        await sleep(0);
        endUndoGroup();
    }
    if (!model) return false;
    const created = nameOf(lookupOf()[model.id]) ?? name;
    if (outcome.failed > 0) toast.warning(`${created}: ${outcome.failed} line(s) of the text did not run.`, 'New model from text');
    else toast.success(`${created} created from text.`, 'New model from text');
    return true;
}
