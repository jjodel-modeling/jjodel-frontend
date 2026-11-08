/**
 * dcnPanelText — the panel's words for a DCN run, the twins of the Petri text
 * readers of simBridge.ts (lane L4.5, P-2026-11-08-0248 decision 5,
 * P-2026-11-08-0303; R-DCN-3, R-DCN-22).
 *
 * - The line: `Classification: dji: Mode = Ready, Alert = Nominal`, instances
 *   and viewpoints in model order, an instance without viewpoints left out, a
 *   viewpoint with no active class `unclassified`, several joined by ` + `.
 *   Its title adds one line per instance with its slot values, `(dormant)` on
 *   a slot whose owner dynamic class is inactive (R-DCN-3).
 * - The chips: the segments of the line, `dji.Mode = Ready`, one each.
 * - A candidate: an invocation `dji.charge(rate)` (the argument names before
 *   the press, `rate = 5` after), followed by its redefinitions of an active
 *   class, which run with it in one step (R-DCN-22): `dji.takeOff() +
 *   Mode::Flying`; a tick contribution `tick: Mode::Flying drain`; the Sync
 *   selector `sync`.
 * - The last step and the declaration defects, in the words of the Petri lines.
 *
 * Pure: the classification is given, names come through `nameOf`.
 */

import type { DcnEntry } from './dcnCompile';
import { DCN_TICK_EVENT } from './dcnCompile';
import type { DcnClassification, DcnStepModel } from './dcnStep';
import { DCN_SYNC_SELECTOR } from './dcnStep';
import type { CompiledNet, HaltReason, SimState, StepOutcome } from '../netTypes';

/** The heading of the σ line of a DCN run. */
export const DCN_PANEL_HEADING = 'Classification';

/** The Tick input as the panel names it; its event id stays `DCN_TICK_EVENT` in tests, probes and the trace. */
export const DCN_TICK_LABEL = 'Tick';

/** An id to the name the panel prints. */
export type DcnNameOf = (id: string) => string;

/** One chip of the classification, in the shape of simBridge.ts `SimMarkingChip`. */
export interface DcnMarkingChip {
    readonly place: string;
    readonly name: string;
    readonly tokens: number;
    readonly text: string;
}

/** An argument given at the press, in the shape of simBridge.ts `InputValue`. */
export interface DcnArgument {
    readonly element: string;
    readonly attr: string;
    readonly value: unknown;
}

const classesText = (active: readonly string[]): string => (active.length === 0 ? 'unclassified' : active.join(' + '));

/** Instance by instance, its viewpoints that have classes, in model order. */
function segments(m: DcnStepModel, c: DcnClassification): Array<{ instance: string; name: string; viewpoint: string; text: string }> {
    const out: Array<{ instance: string; name: string; viewpoint: string; text: string }> = [];
    for (const info of m.model.instances.values()) {
        for (const [viewpoint, dcs] of info.viewpoints) {
            if (dcs.size === 0) continue;
            out.push({ instance: info.id, name: info.name, viewpoint, text: classesText(c.classes.get(info.id)?.get(viewpoint) ?? []) });
        }
    }
    return out;
}

/** Whether the dynamic class `id` classifies `instance` in `c`; an unknown class does not. */
function isActive(m: DcnStepModel, c: DcnClassification | null, instance: string, id: string): boolean {
    if (c === null) return false;
    for (const [viewpoint, dcs] of m.model.instances.get(instance)?.viewpoints ?? []) {
        for (const dc of dcs.values()) {
            if (dc.id === id) return c.classes.get(instance)?.get(viewpoint)?.includes(dc.name) === true;
        }
    }
    return false;
}

/** The σ line of a DCN run and its title (see the module comment). */
export function dcnMarkingLine(state: SimState, m: DcnStepModel, c: DcnClassification): { line: string; title: string } {
    const byInstance: string[] = [];
    let last: string | null = null;
    for (const s of segments(m, c)) {
        const part = `${s.viewpoint} = ${s.text}`;
        if (s.instance === last) byInstance[byInstance.length - 1] += `, ${part}`;
        else byInstance.push(`${s.name}: ${part}`);
        last = s.instance;
    }
    const line = `${DCN_PANEL_HEADING}: ${byInstance.length === 0 ? '∅' : byInstance.join(' · ')}`;
    const slotLines: string[] = [];
    for (const [instance, slots] of m.model.compiled.slots) {
        const values = [...slots].map(([attr, slot]) => {
            const dormant = slot.dormantOwner !== null && !isActive(m, c, instance, slot.dormantOwner);
            return `${attr} = ${String(state.attrs.get(instance)?.get(attr))}${dormant ? ' (dormant)' : ''}`;
        });
        slotLines.push(`${m.model.instances.get(instance)?.name ?? instance}: ${values.join(', ')}`);
    }
    return { line, title: [line, ...slotLines].join('\n') };
}

/** The chips of the classification: the segments of the line, one each. */
export function dcnMarkingChips(m: DcnStepModel, c: DcnClassification): DcnMarkingChip[] {
    return segments(m, c).map(s => ({ place: `${s.instance}#${s.viewpoint}`, name: `${s.name}.${s.viewpoint}`, tokens: 1, text: `${s.name}.${s.viewpoint} = ${s.text}` }));
}

const classRef = (e: DcnEntry, nameOf: DcnNameOf): string =>
    `${e.viewpoint === null ? '' : `${nameOf(e.viewpoint)}::`}${e.dynamicClass === null ? '' : nameOf(e.dynamicClass)}`;

/** A transition of the DCN net as the choice list and the inputs row show it (see the module comment). */
export function dcnCandidateLabel(
    m: DcnStepModel, transitionId: string, nameOf: DcnNameOf, c: DcnClassification | null, values?: readonly DcnArgument[],
): string {
    if (transitionId === DCN_SYNC_SELECTOR) return 'sync';
    if (transitionId === DCN_TICK_EVENT) return DCN_TICK_LABEL;
    const e = m.model.compiled.entries.get(transitionId);
    if (e === undefined) return nameOf(transitionId);
    if (e.kind === 'tick') return `tick: ${classRef(e, nameOf)} ${nameOf(e.element)}`;
    const args = e.inputs.map(i => {
        const given = values?.find(v => v.element === i.element && v.attr === i.attr);
        return given === undefined ? i.attr : `${i.attr} = ${String(given.value)}`;
    });
    const call = `${m.model.instances.get(e.instance)?.name ?? nameOf(e.instance)}.${nameOf(e.element)}(${args.join(', ')})`;
    if (e.dynamicClass !== null) return `${call} in ${classRef(e, nameOf)}`;
    const active = [...m.redefines]
        .filter(([, base]) => base === transitionId)
        .map(([redef]) => m.model.compiled.entries.get(redef))
        .filter((r): r is DcnEntry => r !== undefined && r.dynamicClass !== null && isActive(m, c, r.instance, r.dynamicClass))
        .map(r => classRef(r, nameOf));
    return [call, ...active].join(' + ');
}

/** What a halt says after `halted the run: `. */
function haltWords(reason: HaltReason, m: DcnStepModel, nameOf: DcnNameOf): string {
    const r = reason as HaltReason & { readonly element?: string; readonly attr?: string };
    const who = r.element === undefined ? '' : m.model.instances.get(r.element)?.name ?? nameOf(r.element);
    if (reason.kind === 'unclassified') return `${who} in no class of ${reason.viewpoint}`;
    if (reason.kind === 'ambiguous') return `${who} in ${reason.classes.join(' + ')} of ${reason.viewpoint}`;
    if (r.element !== undefined && r.attr !== undefined) return `${reason.kind} of ${who}.${r.attr}`;
    return reason.kind;
}

/** The «Last step» line of a DCN press; `c` is the classification of the σ the step read. */
export function dcnLastStepText(
    outcome: StepOutcome, m: DcnStepModel, nameOf: DcnNameOf, c: DcnClassification | null, input: string, values?: readonly DcnArgument[],
): string {
    const chosen = outcome.label.selector;
    const label = (): string => dcnCandidateLabel(m, chosen ?? '', nameOf, c, values);
    switch (outcome.kind) {
        case 'fired':
            return `${input}: ${label()} fired`;
        case 'halted':
            return `${input}: ${label()} halted the run: ${haltWords(outcome.reason, m, nameOf)}`;
        case 'discard':
            return `${input}: discarded, no contribution accepted it`;
        case 'quiescence':
            return `${input}: nothing to fire`;
        case 'inadmissible':
            return `${input}: refused, ${chosen === null ? 'none' : label()} is not a candidate`;
    }
}

/** The declaration defects of the DCN net in one line, the first three then a count; `null` when none. */
export function dcnDefectsLine(net: Pick<CompiledNet, 'declarationDefects'>, nameOf: DcnNameOf): string | null {
    const items = (net.declarationDefects ?? []).map(d => {
        const where = d.element === undefined ? '' : nameOf(d.element);
        const subject = d.name === null ? where : where === '' ? d.name : `${where}.${d.name}`;
        return `${subject} (${d.message})`;
    });
    if (items.length === 0) return null;
    const more = items.length > 3 ? `, and ${items.length - 3} more` : '';
    return `${items.length} defect${items.length === 1 ? '' : 's'}: ${items.slice(0, 3).join('; ')}${more}.`;
}
