/**
 * The timeline slider of the simulation panel (R-SIM-142, P-2026-10-05-2350).
 *
 * Executes SimTimeline.tsx over runs of a hand-built net and the real `step` of
 * the core, as simRunState.test.ts does: the mapping thumb↔step, the sync with
 * the view state of R-SIM-106 both ways, «Continue from here» as k − j pops of
 * `simStepBack`, Play stopped by a grab, and the keys. The store-reading
 * `SimTimeline` is rendered with `renderToStaticMarkup`; the gestures are the
 * handlers of `SimTimelineRow`, called as a function, so the bench runs the
 * code the panel mounts. Each test name says which break kills it; the
 * mutation bench is in the commit message.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    continueFrom, SimTimeline, SimTimelineRow, TIMELINE_MAX_NOTCHES, timelineKeyStep, timelineStep, timelineValue,
} from '../SimTimeline';
import type { SimTimelineRowProps } from '../SimTimeline';
import { __resetSimRunsForTests, configAt, getSimRun, getSimView, getSimVersion, simCommit, simReset, simSetView, simStepBack } from '../simRunState';
import type { SimRun } from '../simRunState';
import { netRunStatus, step } from '../../../../model/simulation/netStep';
import type { ActionOracle, CompiledNet, GuardOracle, NetTransition, SimState } from '../../../../model/simulation/netTypes';

const TRUE: GuardOracle = () => ({ kind: 'true' });
const NONE: ActionOracle = () => ({ kind: 'ok', assignments: [] });

function tr(id: string, pre: Record<string, number>, post: Record<string, number>): NetTransition {
    return {
        id, origin: [id],
        preset: Object.entries(pre).map(([place, weight]) => ({ place, weight })),
        postset: Object.entries(post).map(([place, weight]) => ({ place, weight })),
        inhibitors: [], triggers: [], guardSites: [], elseOf: null, actionSites: [],
    };
}

function st(marking: Record<string, number>): SimState {
    return { marking: new Map(Object.entries(marking)), attrs: new Map(), presentation: new Map() };
}

/** a -t-> b -u-> c -v-> a, and c -end-> d, d final: a ring that can also terminate. */
const RING: CompiledNet = {
    modelId: 'M', places: new Set(['a', 'b', 'c', 'd']),
    transitions: [tr('t', { a: 1 }, { b: 1 }), tr('u', { b: 1 }, { c: 1 }), tr('v', { c: 1 }, { a: 1 }), tr('end', { c: 1 }, { d: 1 })],
    bound: 1, final: new Set(['d']), hasEventRole: false, attributes: [], declared: new Map(), initial: st({ a: 1 }), defects: [],
};

function ringRun(): SimRun {
    return { net: RING, config: { state: st({ a: 1 }), event: null }, halt: null, guards: TRUE, actions: NONE, alphabet: [], signature: 'sig' };
}

/** Reset, then the selectors in order; the record after each, index = step. */
function runOf(selectors: readonly string[]): SimRun[] {
    simReset('M', ringRun());
    const snaps = [getSimRun('M')!];
    for (const s of selectors) {
        simCommit('M', step(RING, { state: getSimRun('M')!.config.state, event: null }, s, TRUE, NONE));
        snaps.push(getSimRun('M')!);
    }
    return snaps;
}

/** What the panel and the canvas read of a record: configuration, halt, trace, draws, kept list, every step, status. */
const reading = (run: SimRun) => ({
    config: run.config, halt: run.halt, trace: run.trace ?? [], draws: run.draws ?? 0, kept: run.keptConfigs ?? [],
    configs: Array.from({ length: (run.trace?.length ?? 0) + 1 }, (_, n) => configAt(run, n)),
    status: netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt),
});

/** The row as the panel mounts it, live and view read from the store; the gestures it saw. */
function row(extra: Partial<SimTimelineRowProps> = {}) {
    const seen = { grabs: 0, continued: [] as number[] };
    const props: SimTimelineRowProps = {
        modelId: 'M', live: getSimRun('M')?.trace?.length ?? 0, viewed: getSimView('M'),
        onGrab: () => { seen.grabs++; }, onContinue: n => { seen.continued.push(n); }, ...extra,
    };
    return { el: SimTimelineRow(props), seen };
}

/** The first element of a tree whose props satisfy `pred`. */
function find(node: ReactNode, pred: (props: any) => boolean): ReactElement<any> | null {
    if (Array.isArray(node)) {
        for (const n of node) {
            const hit = find(n, pred);
            if (hit) return hit;
        }
        return null;
    }
    if (!isValidElement(node)) return null;
    const props = node.props as any;
    if (pred(props)) return node as ReactElement<any>;
    return find(props.children, pred);
}

const rangeOf = (el: ReactNode) => find(el, p => p.type === 'range')!;
const continueOf = (el: ReactNode) => find(el, p => typeof p.className === 'string' && p.className.includes('sim-timeline__continue'))!;
const key = (k: string) => {
    const ev = { key: k, prevented: false, preventDefault() { ev.prevented = true; } };
    return ev;
};
const change = (value: number) => ({ currentTarget: { value: String(value) }, target: { value: String(value) } });
const markup = () => renderToStaticMarkup(createElement(SimTimeline, { modelId: 'M', onGrab: () => undefined, onContinue: () => undefined }));

beforeEach(() => {
    __resetSimRunsForTests();
});

describe('the mapping thumb↔step: 0, live, clamp (R-SIM-142 1, 2)', () => {
    it('the thumb is the viewed step, live when none is viewed, clamped to 0..live (mutants: viewed ignored; no clamp)', () => {
        expect([timelineValue(5, null), timelineValue(5, 0), timelineValue(5, 2), timelineValue(5, 5)]).toEqual([5, 0, 2, 5]);
        expect([timelineValue(5, 9), timelineValue(5, -1), timelineValue(0, null)]).toEqual([5, 0, 0]);
    });

    it('a thumb position shows that step, the right end is live (null), out of range clamped, a fraction rounded (mutants: live as a number; no clamp; floor)', () => {
        expect([timelineStep(0, 5), timelineStep(3, 5), timelineStep(5, 5)]).toEqual([0, 3, null]);
        expect([timelineStep(-2, 5), timelineStep(9, 5), timelineStep(2.6, 5), timelineStep(Number.NaN, 5)]).toEqual([0, null, 3, null]);
    });
});

describe('the keys: ←/→ one step, Home/End 0 and live (R-SIM-142 5)', () => {
    it('←/→ move one step, clamped at 0 and live; Home 0, End live; any other key is not the timeline\'s (mutants: ± swapped; no clamp; End to live - 1)', () => {
        expect([timelineKeyStep('ArrowLeft', 3, 5), timelineKeyStep('ArrowRight', 3, 5)]).toEqual([2, 4]);
        expect([timelineKeyStep('ArrowLeft', 0, 5), timelineKeyStep('ArrowRight', 5, 5)]).toEqual([0, 5]);
        expect([timelineKeyStep('Home', 3, 5), timelineKeyStep('End', 2, 5)]).toEqual([0, 5]);
        expect([timelineKeyStep('a', 3, 5), timelineKeyStep('Enter', 3, 5), timelineKeyStep('Tab', 3, 5)]).toEqual([undefined, undefined, undefined]);
    });

    it('a key of the timeline shows its step, takes the key from the browser and stops Play; another key does nothing (mutants: no preventDefault; no grab; the view not set)', () => {
        runOf(['t', 'u', 'v', 't']);
        const left = key('ArrowLeft');
        const a = row();
        rangeOf(a.el).props.onKeyDown(left);
        expect([getSimView('M'), left.prevented, a.seen.grabs]).toEqual([3, true, 1]);
        const home = key('Home');
        rangeOf(row().el).props.onKeyDown(home);
        expect(getSimView('M')).toBe(0);
        const end = key('End');
        const b = row();
        rangeOf(b.el).props.onKeyDown(end);
        expect([getSimView('M'), end.prevented, b.seen.grabs]).toEqual([null, true, 1]);
        const other = key('x');
        const c = row();
        rangeOf(c.el).props.onKeyDown(other);
        expect([getSimView('M'), other.prevented, c.seen.grabs]).toEqual([null, false, 0]);
    });
});

describe('absent at step 0 and without a run (R-SIM-142 1)', () => {
    it('no markup without a run and at step 0; a range 0..m from step 1 (mutants: the guard at 0 dropped; max m - 1)', () => {
        expect(markup()).toBe('');
        runOf([]);
        expect(markup()).toBe('');
        runOf(['t']);
        expect(markup()).toMatch(/type="range"/);
        expect(markup()).toMatch(/min="0"/);
        expect(markup()).toMatch(/max="1"/);
        runOf(['t', 'u', 'v']);
        expect(markup()).toMatch(/max="3"/);
        expect(markup()).toMatch(/step="1"/);
    });

    it('one notch per step while they fit, none beyond (mutant: the notches drawn whatever the count)', () => {
        runOf(['t', 'u', 'v']);
        expect(markup()).toMatch(/sim-timeline__range--notched/);
        const many = Array.from({ length: TIMELINE_MAX_NOTCHES + 1 }, (_, i) => ['t', 'u', 'v'][i % 3]);
        runOf(many);
        expect(markup()).not.toMatch(/sim-timeline__range--notched/);
    });
});

describe('slider and trace in sync, both ways (R-SIM-142 2, 3)', () => {
    it('a trace click (simSetView) moves the thumb; Back to live returns it to the right end (mutants: the thumb read from the live step only)', () => {
        runOf(['t', 'u', 'v']);
        expect(markup()).toMatch(/value="3"/);
        simSetView('M', 1);
        expect(markup()).toMatch(/value="1"/);
        simSetView('M', null);
        expect(markup()).toMatch(/value="3"/);
    });

    it('moving the thumb shows that step as the trace click does, the run unchanged; the right end is live (mutants: the run popped; live shown as a past step)', () => {
        const snaps = runOf(['t', 'u', 'v', 't']);
        const r = row();
        rangeOf(r.el).props.onChange(change(2));
        expect(getSimView('M')).toBe(2);
        expect(getSimRun('M')).toBe(snaps[4]);
        rangeOf(row().el).props.onChange(change(4));
        expect(getSimView('M')).toBeNull();
        expect(getSimRun('M')).toBe(snaps[4]);
    });

    it('«Continue from here» is hidden and off at live, shown and on at a past step (mutant: the button shown at live)', () => {
        runOf(['t', 'u']);
        expect(markup()).toMatch(/sim-timeline__continue--live/);
        expect(continueOf(row().el).props.disabled).toBe(true);
        simSetView('M', 1);
        expect(markup()).not.toMatch(/sim-timeline__continue--live/);
        expect(continueOf(row().el).props.disabled).toBe(false);
    });
});

describe('a grab stops Play (R-SIM-142 5)', () => {
    it('a pointer down and a move each grab; the button continues from the thumb\'s step (mutants: no grab on pointer down; none on change; the live step passed)', () => {
        runOf(['t', 'u', 'v']);
        const r = row();
        rangeOf(r.el).props.onPointerDown({});
        expect(r.seen.grabs).toBe(1);
        rangeOf(r.el).props.onChange(change(1));
        expect(r.seen.grabs).toBe(2);
        const past = row();
        continueOf(past.el).props.onClick({});
        expect(past.seen.continued).toEqual([1]);
    });
});

describe('«Continue from here» is k - j pops of simStepBack (R-SIM-142 4, R-SIM-138)', () => {
    it('from k to every j the run equals the record of step j, at Running, back to live (mutants: one pop only; one pop too many; the view kept)', () => {
        const sel = ['t', 'u', 'v', 't', 'u', 'end'];
        for (let j = sel.length - 1; j >= 0; j--) {
            const snaps = runOf(sel);
            expect(reading(getSimRun('M')!).status).toBe('Terminated');
            simSetView('M', j);
            expect(continueFrom('M', j)).toBe(true);
            const back = getSimRun('M')!;
            expect(reading(back)).toEqual(reading(snaps[j]));
            expect([back.trace?.length, reading(back).status, getSimView('M')]).toEqual([j, 'Running', null]);
        }
    });

    it('equals the same number of simStepBack presses, record for record (mutant: a pop that skips the kept list)', () => {
        const sel = ['t', 'u', 'v', 't', 'u'];
        runOf(sel);
        for (let i = 0; i < 3; i++) simStepBack('M');
        const popped = reading(getSimRun('M')!);
        runOf(sel);
        continueFrom('M', 2);
        expect(reading(getSimRun('M')!)).toEqual(popped);
    });

    it('a no-op at live, out of 0..m and without a run: the same record, no bump (mutants: the guard at live dropped; a negative j pops to 0)', () => {
        expect(continueFrom('M', 0)).toBe(false);
        runOf(['t', 'u']);
        const run = getSimRun('M');
        const v = getSimVersion();
        expect([continueFrom('M', 2), continueFrom('M', 3), continueFrom('M', -1), continueFrom('M', 1.5)]).toEqual([false, false, false, false]);
        expect(getSimRun('M')).toBe(run);
        expect(getSimVersion()).toBe(v);
    });
});
