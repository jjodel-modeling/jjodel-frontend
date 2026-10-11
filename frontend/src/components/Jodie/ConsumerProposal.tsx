/**
 * ConsumerProposal — #168 J4 (lane C2): Jodie's `jjscript` block as the stand-alone consumer sees
 * it. A list of changes in plain words, «Apply» and «Discard», the script in a closed «Details».
 * Mounted by `CodeBlock` (`common/MarkdownRenderer.tsx`) only under `isConsumerMode()`; the
 * developer keeps `ScriptBlock`.
 *
 * «Apply» runs the reply's own callback (`onJjScriptExecute`, already bound to the scope the reply
 * was given, `ChatMessages.tsx`), one line at a time, and stops at the first failure. Around it:
 * the undo history is switched on before the first write (`U.userHasInteracted`, decision (a) of
 * #168: Ctrl+Z then undoes in steps, measured by M0), «Unsaved» after it (`U.isProjectModified`),
 * and the Configurator is asked to show the element (`EnvGenEvents.CONFIGURATOR_SELECT_INSTANCE`).
 * The decisions themselves live in `consumerProposalModel.ts`; this file reads the store and paints.
 */
import React, { useMemo, useRef, useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import { DState, LProject, U, findProfile, resolveTypePermission } from '../../joiner';
import { metamodelOfClass } from '../../joiner/environmentConfig';
import { getHandleId } from '../../jjscript/executor/handleRegistry';
import { EnvGenEvents, JjScriptEvents } from '../../events/registry';
import { classAncestryNames, makeDrawReadCtx } from '../editor-v2/viewpoint/ir/irReadCtx';
import { modelIdOfObject } from '../abstract/tabs/instanceManagerModel';
import { activeProfileId } from '../environment/consumerMode';
import { getConsumerSelection } from '../environment/consumerJodieContext';
import {
    EMPTY_WORLD,
    proposalFocus,
    proposalOutcome,
    readProposal,
    rootIdOf,
    runProposal,
    setProposalOutcome,
    subscribeProposals,
} from './consumerProposalModel';
import type { ProposalClass, ProposalElement, ProposalStepStatus, ProposalWorld } from './consumerProposalModel';
import type { ScriptLineResult } from '../../jjscript';
import './ConsumerProposal.scss';

export interface ConsumerProposalProps {
    /** The script of the block, as Jodie wrote it. */
    code: string;
    /** The reply's executor, bound to the reply's scope. */
    onExecute: (commands: string[]) => Promise<ScriptLineResult[]>;
}

/**
 * The world the proposal is read against, from the store: the model the Configurator shows (the
 * reply's scope is the same one unless the consumer moved since), its metamodel's types with what
 * the profile allows, and its elements by name. Types read through the L-layer, so `rootable`,
 * the inherited features and `containment` are the core's own answers.
 */
function buildWorld(idlookup: Record<string, any>): ProposalWorld {
    const world: ProposalWorld = { classes: {}, elements: {} };
    try {
        const project: any = LProject.getProject();
        let modelId: string | null = getConsumerSelection()?.modelId ?? null;
        if (!modelId) modelId = ((project?.models ?? []) as any[]).find((m) => m && !m.isMetamodel)?.id ?? null;
        const model = modelId ? idlookup[modelId] : null;
        const metamodelId = model?.instanceof;
        if (!modelId || typeof metamodelId !== 'string') return world;
        const profile = findProfile(idlookup, activeProfileId());

        for (const c of ((project?.classes ?? []) as any[])) {
            if (!c?.id || !c.name || world.classes[c.name] || metamodelOfClass(idlookup, c.id) !== metamodelId) continue;
            const cls: ProposalClass = {
                name: c.name,
                rootable: !!c.rootable,
                editable: resolveTypePermission(profile, c.id) === 'edit',
                kinds: classAncestryNames(idlookup, c.id),
                attributes: ((c.allAttributes ?? []) as any[]).map((a) => a?.name).filter(Boolean),
                references: ((c.allReferences ?? []) as any[]).filter((r) => r?.name).map((r) => ({
                    name: r.name,
                    containment: !!r.containment,
                    upper: typeof r.upperBound === 'number' ? r.upperBound : -1,
                    type: r.type?.name ?? '',
                })),
            };
            world.classes[c.name] = cls;
        }

        const roots = new Set<string>(Array.isArray(model.objects) ? model.objects : []);
        const names = makeDrawReadCtx(idlookup);
        for (const id in idlookup) {
            const o = idlookup[id];
            if (o?.className !== 'DObject' || modelIdOfObject(idlookup, id) !== modelId) continue;
            const name = names.getName(id);
            if (!name) continue;
            const element: ProposalElement = { id, className: idlookup[o.instanceof]?.name ?? '', root: roots.has(id) };
            (world.elements[name] ??= []).push(element);
        }
    } catch (err) {
        // A world we could not read describes less, and the run still refuses in its own words.
        console.warn('[ConsumerProposal] Could not read the model for the proposal.', err);
    }
    return world;
}

/**
 * The pause after each applied step. Two measured reasons, both on 2026-10-03 (P-2026-10-02-2215):
 * - Each step must be one entry of the undo history. The reducer folds a delta into the previous
 *   entry when it lands within `U.UpdatingTimer * 1.5` of it (`isRelevantChangeCheck`,
 *   `reducer.ts`), and the fold is the shallow first-wins merge of R-UNDO-5: with no pause, «create
 *   ph1, put it inside Scenario_0, link it» became one entry, and one Ctrl+Z removed ph1 but left
 *   its id in Scenario_0's slot. With the pause, three presses undo the three steps.
 * - The profile guard (`executor.ts`) cannot read the type of an element created a moment ago and
 *   refuses, as `PROFILE_UNRESOLVED`, the next step that names it: no pause, refused; 400 ms, passes.
 * Read at call time, beyond the window by a margin.
 */
const undoStepMs = (): number => U.UpdatingTimer * 1.5 + 150;

const STATUS_ICON: Record<ProposalStepStatus, string> = {
    pending: 'bi-dot',
    applied: 'bi-check-lg',
    failed: 'bi-x-lg',
    skipped: 'bi-dash',
};

export function ConsumerProposal({ code, onExecute }: ConsumerProposalProps): JSX.Element {
    const idlookup = useSelector((s: DState) => s.idlookup);
    const outcome = useSyncExternalStore(subscribeProposals, () => proposalOutcome(code));
    // Read only while the proposal is open: once applied or discarded its texts are in the store.
    const open = !outcome;
    const world = useMemo(() => (open ? buildWorld(idlookup as any) : EMPTY_WORLD), [idlookup, open]);
    const reading = useMemo(() => readProposal(code, world), [code, world]);
    const running = useRef(false);

    const apply = async () => {
        if (running.current || proposalOutcome(code) || reading.blocked) return;
        running.current = true;
        // Names resolve to ids against the model as it was before the run.
        const before = world;
        let applied: boolean[] = reading.steps.map(() => false);
        // #168 J4, decision (a): the D-layer keeps no history until a user gesture says so
        // (R-UNDO-2); «Apply» is that gesture here.
        U.userHasInteracted = true;
        // Clears the handles of an earlier run (`handleRegistry.ts`), as ScriptBlock does.
        window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_START, {
            detail: { script: code, commandCount: reading.steps.length, mode: 'proposal' },
        }));
        try {
            applied = await runProposal(
                reading,
                async (step) => {
                    const result = (await onExecute([step.line]))[0] ?? { success: false, message: '' };
                    if (result.success) await new Promise((resolve) => setTimeout(resolve, undoStepMs()));
                    return result;
                },
                before,
                (o) => setProposalOutcome(code, o),
            );
        } finally {
            window.dispatchEvent(new CustomEvent(JjScriptEvents.EXECUTION_END, {
                detail: { status: applied.every(Boolean) ? 'completed' : 'error' },
            }));
            running.current = false;
        }
        if (applied.some(Boolean)) U.isProjectModified = true;
        const focus = proposalFocus(reading.steps, applied);
        const instanceId = focus ? (focus.created ? getHandleId(focus.name) : rootIdOf(before, focus.name)) : null;
        if (instanceId) {
            window.dispatchEvent(new CustomEvent(EnvGenEvents.CONFIGURATOR_SELECT_INSTANCE, { detail: { instanceId } }));
        }
    };

    const discard = () => {
        if (running.current || proposalOutcome(code)) return;
        setProposalOutcome(code, { phase: 'discarded', steps: reading.steps.map((s) => ({ text: s.text, status: 'pending' })) });
    };

    const phase = outcome?.phase ?? null;
    const rows = outcome?.steps ?? reading.steps.map((s) => ({ text: s.text, status: 'pending' as ProposalStepStatus, reason: undefined as string | undefined }));
    const title = phase === 'applying' ? 'Applying the changes…'
        : phase === 'applied' ? 'Changes applied'
        : phase === 'failed' ? 'Some changes were not applied'
        : phase === 'discarded' ? 'Proposal discarded'
        : 'Jodie suggests these changes';
    const someApplied = rows.some((r) => r.status === 'applied');

    return (
        <div className={`consumer-proposal${phase ? ` consumer-proposal--${phase}` : ''}`} data-phase={phase ?? 'open'}>
            <div className="consumer-proposal__title">
                <i className="bi bi-lightbulb" aria-hidden="true" />
                <span>{title}</span>
            </div>
            <ol className="consumer-proposal__steps">
                {rows.map((r, i) => (
                    <li key={i} className={`consumer-proposal__step consumer-proposal__step--${r.status}`} data-status={r.status}>
                        <i className={`bi ${STATUS_ICON[r.status]}`} aria-hidden="true" />
                        <div className="consumer-proposal__step-body">
                            <span className="consumer-proposal__text">{r.text}</span>
                            {r.reason && <span className="consumer-proposal__reason">{r.reason}</span>}
                        </div>
                    </li>
                ))}
            </ol>
            {!phase && reading.blocked && (
                <p className="consumer-proposal__blocked" role="alert">{reading.blocked}</p>
            )}
            {!phase && (
                <div className="consumer-proposal__actions">
                    <button className="consumer-proposal__apply" onClick={apply} disabled={!!reading.blocked}>
                        <i className="bi bi-check2" aria-hidden="true" />
                        <span>Apply</span>
                    </button>
                    <button className="consumer-proposal__discard" onClick={discard}>
                        <span>Discard</span>
                    </button>
                </div>
            )}
            {(phase === 'applied' || phase === 'failed') && someApplied && (
                <p className="consumer-proposal__note">
                    Undo with Ctrl+Z (⌘Z on Mac): it goes back one step at a time, so it may take more than one press.
                </p>
            )}
            {phase === 'discarded' && <p className="consumer-proposal__note">Nothing was changed.</p>}
            <details className="consumer-proposal__details">
                <summary>Details</summary>
                <pre className="consumer-proposal__script">{code}</pre>
            </details>
        </div>
    );
}

export default ConsumerProposal;
