/**
 * dcnCanvasState — what the run card of one DCN instance shows, as plain data
 * (R-DCN-3, R-DCN-25, R-DCN-26, R-DCN-29; discovery 2026-11-08 §A, lane 1).
 *
 * - The viewpoints of the instance, with their dynamic classes and which are active.
 * - The dormant slots: those of an inactive dynamic class, with the value σ keeps.
 * - The monitors: the active classes that have a tick contribution for this instance.
 * - The static slots whose σ differs from the value at Reset.
 *
 * Pure: the run is given, names come through `nameOf`. `DcnNucleus.classify`
 * evaluates every instance of σ, so its result is kept per state object: the
 * cards of one step classify once. A state object belongs to one run.
 */

import type { DcnModel } from './dcnHandles';
import type { DcnNameOf } from './dcnPanelText';
import type { DcnClassification, DcnNucleus } from './dcnStep';
import type { SimState, SimValue } from '../netTypes';

export interface DcnCardClass {
    readonly name: string;
    readonly active: boolean;
}

export interface DcnCardViewpoint {
    readonly name: string;
    readonly classes: readonly DcnCardClass[];
}

export interface DcnCardDormantSlot {
    readonly name: string;
    readonly value: SimValue;
}

export interface DcnCardMonitors {
    readonly viewpoint: string;
    readonly dynamicClass: string;
    readonly names: readonly string[];
}

export interface DcnCardChangedSlot {
    readonly name: string;
    readonly reset: SimValue;
    readonly current: SimValue;
}

export interface DcnNodeState {
    readonly viewpoints: readonly DcnCardViewpoint[];
    readonly dormant: readonly DcnCardDormantSlot[];
    readonly monitors: readonly DcnCardMonitors[];
    readonly changedStatic: readonly DcnCardChangedSlot[];
}

const CLASSIFIED = new WeakMap<SimState, DcnClassification>();

function classified(nucleus: Pick<DcnNucleus, 'classify'>, state: SimState): DcnClassification {
    let c = CLASSIFIED.get(state);
    if (c === undefined) {
        c = nucleus.classify(state);
        CLASSIFIED.set(state, c);
    }
    return c;
}

/** The card of `instanceId` at `state`; `null` for an id that is no instance of the run. */
export function dcnNodeStateOf(
    model: DcnModel,
    nucleus: Pick<DcnNucleus, 'classify'>,
    state: SimState,
    resetState: Pick<SimState, 'attrs'>,
    instanceId: string,
    nameOf: DcnNameOf,
): DcnNodeState | null {
    const info = model.instances.get(instanceId);
    if (info === undefined) return null;
    const classes = classified(nucleus, state).classes.get(instanceId);
    const ticks = [...model.compiled.entries.values()].filter(e => e.kind === 'tick' && e.instance === instanceId);

    const activeIds = new Set<string>();
    const viewpoints: DcnCardViewpoint[] = [];
    const monitors: DcnCardMonitors[] = [];
    for (const [viewpoint, dcs] of info.viewpoints) {
        const active = classes?.get(viewpoint) ?? [];
        const row: DcnCardClass[] = [];
        for (const dc of dcs.values()) {
            const isActive = active.includes(dc.name);
            row.push({ name: dc.name, active: isActive });
            if (!isActive) continue;
            activeIds.add(dc.id);
            const names = ticks.filter(e => e.dynamicClass === dc.id).map(e => nameOf(e.element));
            if (names.length > 0) monitors.push({ viewpoint, dynamicClass: dc.name, names });
        }
        viewpoints.push({ name: viewpoint, classes: row });
    }

    const sigma = state.attrs.get(instanceId);
    const initial = resetState.attrs.get(instanceId);
    const dormant: DcnCardDormantSlot[] = [];
    const changedStatic: DcnCardChangedSlot[] = [];
    for (const [name, slot] of model.compiled.slots.get(instanceId) ?? []) {
        const current = sigma?.get(name);
        if (current === undefined) continue;
        if (slot.dormantOwner !== null) {
            if (!activeIds.has(slot.dormantOwner)) dormant.push({ name, value: current });
            continue;
        }
        const reset = initial?.get(name);
        if (reset !== undefined && reset !== current) changedStatic.push({ name, reset, current });
    }
    return { viewpoints, dormant, monitors, changedStatic };
}
