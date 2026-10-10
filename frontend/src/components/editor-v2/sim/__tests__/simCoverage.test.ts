/**
 * simCoverage — the coverage of the runs of a model (R-SIM-140; P-2026-10-06-0115,
 * discovery 2026-10-05 §5, V1, V2).
 *
 * Executes the module over runs of a hand-built net and the real `step` of the
 * core, committed through the run store as the panel commits them, and observed
 * as the canvas layer observes them. The counts are checked against those taken
 * from each fired step's label, the discovery's measure; Reset, a step back,
 * Stop and Clear against V1; the channel against the `'mark'` one. The overlay
 * and the canvas layer are rendered with `renderToStaticMarkup`. Each test name
 * says which break kills it; the mutation bench is in the commit message.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    __resetSimCoverageForTests, getSimCoverage, getSimCoverageVersion, getSimNodeCoverage, simClearCoverage, simCoverageSummary, simObserveRun,
} from '../simCoverage';
import type { SimCoverageCounts } from '../simCoverage';
import { __resetSimRunsForTests, getSimRun, getSimVersion, simClear, simCommit, simReset, simSetView, simStepBack } from '../simRunState';
import type { SimRun } from '../simRunState';
import { __resetSimViewerPrefsForTests, getSimViewerPrefs, setSimViewerPrefs } from '../simViewerPrefs';
import { SimNodeRunState } from '../SimNodeRunState';
import { SimCanvasLayer } from '../SimCanvasLayer';
import { step } from '../../../../model/simulation/netStep';
import type { ActionOracle, CompiledNet, GuardOracle, NetTransition, StepOutcome } from '../../../../model/simulation/netTypes';

const TRUE: GuardOracle = () => ({ kind: 'true' });
const NONE: ActionOracle = () => ({ kind: 'ok', assignments: [] });

function tr(id: string, pre: Record<string, number>, post: Record<string, number>, origin: string[] = [id]): NetTransition {
    return {
        id, origin,
        preset: Object.entries(pre).map(([place, weight]) => ({ place, weight })),
        postset: Object.entries(post).map(([place, weight]) => ({ place, weight })),
        inhibitors: [], triggers: [], guardSites: [], elseOf: null, actionSites: [],
    };
}

/**
 * a (marked; d held at 0 in the initial marking) -t-> b, b -s-> b (a self-loop), b -v-> c ×2, c ×2 -r-> a; d -w-> a never enabled, d never marked;
 * a -h-> c ×3 halts on the bound 2; f1 (a -> b) and f2 (b -> a) are a fused node F with its edges e1, e2.
 */
const NET: CompiledNet = {
    modelId: 'M', places: new Set(['a', 'b', 'c', 'd']), bound: 2, final: null, hasEventRole: false, attributes: [], declared: new Map(), defects: [],
    transitions: [
        tr('t', { a: 1 }, { b: 1 }), tr('s', { b: 1 }, { b: 1 }), tr('v', { b: 1 }, { c: 2 }), tr('r', { c: 2 }, { a: 1 }),
        tr('w', { d: 1 }, { a: 1 }), tr('h', { a: 1 }, { c: 3 }),
        tr('f1', { a: 1 }, { b: 1 }, ['F', 'e1']), tr('f2', { b: 1 }, { a: 1 }, ['F', 'e2']),
    ],
    initial: { marking: new Map([['a', 1], ['d', 0]]), attrs: new Map(), presentation: new Map() },
};
/** A run as the bridge installs it at Reset: a net compiled anew each time, so a new object. */
const fresh = (modelId = 'M'): SimRun => {
    const net: CompiledNet = { ...NET, modelId };
    return { net, config: { state: net.initial, event: null }, halt: null, guards: TRUE, actions: NONE, alphabet: [], signature: 'sig' };
};
/** The path: every firing once but w's and h's, then h halting the run. */
const PATH = ['t', 's', 'v', 'r', 'f1', 'f2', 'h'];

/** Commits one step of the live run, as the panel does, and returns its outcome. */
function fire(modelId: string, selector: string): StepOutcome {
    const run = getSimRun(modelId)!;
    const o = step(run.net, run.config, selector, run.guards, run.actions);
    simCommit(modelId, o);
    return o;
}

/** The discovery's measure (§5): the initial marking, then each fired step's label, its selector and its postset. */
function fromLabels(net: CompiledNet, outcomes: readonly StepOutcome[], into = { visits: new Map<string, number>(), firings: new Map<string, number>() }) {
    const add = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
    for (const [place, n] of net.initial.marking) if (n > 0) add(into.visits, place);
    for (const o of outcomes) {
        if (o.kind !== 'fired' || o.label.selector === null) continue;
        add(into.firings, o.label.selector);
        for (const arc of o.label.produced) add(into.visits, arc.place);
    }
    return into;
}
const text = (c: SimCoverageCounts | { visits: ReadonlyMap<string, number>; firings: ReadonlyMap<string, number> }) =>
    JSON.stringify({ visits: [...c.visits].sort(), firings: [...c.firings].sort() });

beforeEach(() => {
    __resetSimRunsForTests();
    __resetSimViewerPrefsForTests();
    __resetSimCoverageForTests();
});

describe('the counts: visits are token arrivals, firings are fired steps (V1)', () => {
    it('observed at every step, they equal the counts from the step labels; one visit per arrival whatever the weight, a self-loop included (mutants: the weight counted; the initial marking skipped; a place at 0 counted)', () => {
        simReset('M', fresh());
        simObserveRun('M', getSimRun('M')!);
        const outcomes: StepOutcome[] = [];
        for (const sel of PATH) {
            outcomes.push(fire('M', sel));
            simObserveRun('M', getSimRun('M')!);
        }
        expect(outcomes.map(o => o.kind)).toEqual(['fired', 'fired', 'fired', 'fired', 'fired', 'fired', 'halted']);
        expect(text(getSimCoverage('M'))).toBe(text(fromLabels(NET, outcomes)));
        expect(text(getSimCoverage('M'))).toBe(text({
            visits: new Map([['a', 3], ['b', 3], ['c', 1]]),
            firings: new Map([['t', 1], ['s', 1], ['v', 1], ['r', 1], ['f1', 1], ['f2', 1]]),
        }));
    });

    it('a halted step counts nothing, though it names its transition (mutant: every committed step counted)', () => {
        simReset('M', fresh());
        simObserveRun('M', getSimRun('M')!);
        expect(fire('M', 'h').kind).toBe('halted');
        simObserveRun('M', getSimRun('M')!);
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map([['a', 1]]), firings: new Map() }));
    });

    it('observed once after many steps (Play, a synchronous scenario replay) equals observed at every step (mutant: only the last step counted)', () => {
        simReset('M', fresh());
        const outcomes = PATH.map(sel => fire('M', sel));
        simObserveRun('M', getSimRun('M')!);
        expect(text(getSimCoverage('M'))).toBe(text(fromLabels(NET, outcomes)));
    });

    it('observing the same run again counts nothing new: an effect run twice is harmless (mutant: the trace recounted at each observation)', () => {
        simReset('M', fresh());
        for (const sel of ['t', 's']) fire('M', sel);
        simObserveRun('M', getSimRun('M')!);
        const once = text(getSimCoverage('M'));
        simObserveRun('M', getSimRun('M')!);
        simObserveRun('M', getSimRun('M')!);
        expect(text(getSimCoverage('M'))).toBe(once);
    });

    it('a model with no observed run has no count (mutant: a default count)', () => {
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map(), firings: new Map() }));
    });
});

describe('what keeps the counts: Reset, a step back, Stop, a model switch; Clear empties them (V1)', () => {
    it('Reset keeps them: the new run adds its initial marking and its own steps (mutants: Reset clears; Reset not seen as a new run)', () => {
        simReset('M', fresh());
        const first = PATH.map(sel => fire('M', sel));
        simObserveRun('M', getSimRun('M')!);
        simReset('M', fresh());
        simObserveRun('M', getSimRun('M')!);
        const second = [fire('M', 't')];
        simObserveRun('M', getSimRun('M')!);
        expect(text(getSimCoverage('M'))).toBe(text(fromLabels(NET, second, fromLabels(NET, first))));
        expect(getSimCoverage('M').visits.get('a')).toBe(4);
    });

    it('a step back keeps them, never decremented; a step taken again counts again (mutant: a pop decrements)', () => {
        simReset('M', fresh());
        for (const sel of ['t', 's']) fire('M', sel);
        simObserveRun('M', getSimRun('M')!);
        expect(simStepBack('M')).toBe(true);
        simObserveRun('M', getSimRun('M')!);
        expect(getSimCoverage('M').firings.get('s')).toBe(1);
        expect(getSimCoverage('M').visits.get('b')).toBe(2);
        fire('M', 's');
        simObserveRun('M', getSimRun('M')!);
        expect(getSimCoverage('M').firings.get('s')).toBe(2);
        expect(getSimCoverage('M').visits.get('b')).toBe(3);
    });

    it('a step back and a new step between two observations: the new step counts, though the trace has the same length (mutant: growth read from the length)', () => {
        simReset('M', fresh());
        for (const sel of ['t', 's']) fire('M', sel);
        simObserveRun('M', getSimRun('M')!);
        simStepBack('M');
        fire('M', 'v');
        simObserveRun('M', getSimRun('M')!);
        expect(getSimRun('M')!.trace!.length).toBe(2);
        expect(text(getSimCoverage('M'))).toBe(text({
            visits: new Map([['a', 1], ['b', 2], ['c', 1]]), firings: new Map([['t', 1], ['s', 1], ['v', 1]]),
        }));
    });

    it('a past step viewed counts nothing: the run does not move (R-SIM-106; mutant: the shown step observed)', () => {
        simReset('M', fresh());
        for (const sel of ['t', 's']) fire('M', sel);
        simObserveRun('M', getSimRun('M')!);
        const before = text(getSimCoverage('M'));
        simSetView('M', 0);
        simObserveRun('M', getSimRun('M')!);
        simSetView('M', null);
        simObserveRun('M', getSimRun('M')!);
        expect(text(getSimCoverage('M'))).toBe(before);
    });

    it('Stop and a model switch keep them, per model (mutants: Stop clears; one count for every model)', () => {
        simReset('M', fresh());
        fire('M', 't');
        simObserveRun('M', getSimRun('M')!);
        const kept = text(getSimCoverage('M'));
        simClear('M');
        simReset('N', fresh('N'));
        simObserveRun('N', getSimRun('N')!);
        expect(text(getSimCoverage('M'))).toBe(kept);
        expect(text(getSimCoverage('N'))).toBe(text({ visits: new Map([['a', 1]]), firings: new Map() }));
    });

    it('Clear empties them; the steps already seen are not counted again, the next ones are (mutants: Clear keeps a count; Clear forgets the run it saw)', () => {
        simReset('M', fresh());
        for (const sel of ['t', 's']) fire('M', sel);
        simObserveRun('M', getSimRun('M')!);
        simClearCoverage('M');
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map(), firings: new Map() }));
        simObserveRun('M', getSimRun('M')!);
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map(), firings: new Map() }));
        fire('M', 'v');
        simObserveRun('M', getSimRun('M')!);
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map([['c', 1]]), firings: new Map([['v', 1]]) }));
    });

    it('Clear of one model leaves another (mutant: Clear empties every model)', () => {
        simReset('M', fresh());
        simObserveRun('M', getSimRun('M')!);
        simReset('N', fresh('N'));
        simObserveRun('N', getSimRun('N')!);
        simClearCoverage('M');
        expect(getSimCoverage('N').visits.get('a')).toBe(1);
    });

    it('a count read before a step is a snapshot: the next observation does not change it (mutant: the store hands out its own maps)', () => {
        simReset('M', fresh());
        simObserveRun('M', getSimRun('M')!);
        const before = getSimCoverage('M');
        fire('M', 't');
        simObserveRun('M', getSimRun('M')!);
        expect(before.visits.get('b')).toBeUndefined();
        expect(getSimCoverage('M').visits.get('b')).toBe(1);
    });
});

describe('Clear sees the live marking: a place that holds a token is visited once after it (R-SIM-146 point 5)', () => {
    /** t then v: the live marking holds c with two tokens, and a and b emptied. */
    function toC() {
        simReset('M', fresh());
        for (const sel of ['t', 'v']) fire('M', sel);
        simObserveRun('M', getSimRun('M')!);
        expect(getSimRun('M')!.config.state.marking.get('c')).toBe(2);
    }

    it('Clear with the run counts each marked place once, whatever its tokens, and no firing; again, still once (mutants: the tokens added; the old counts kept; the firings kept; a second Clear adds)', () => {
        toC();
        simClearCoverage('M', getSimRun('M'));
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map([['c', 1]]), firings: new Map() }));
        simClearCoverage('M', getSimRun('M'));
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map([['c', 1]]), firings: new Map() }));
    });

    it('at the start of a run, the initial marking\'s places with a token, not d held at 0 (mutant: a place at 0 counted)', () => {
        simReset('M', fresh());
        simObserveRun('M', getSimRun('M')!);
        expect(getSimRun('M')!.config.state.marking.get('d')).toBe(0);
        simClearCoverage('M', getSimRun('M'));
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map([['a', 1]]), firings: new Map() }));
    });

    it('the next fired step counts on top of the marking, from the run seen: nothing recounted (mutants: Clear forgets the trace; Clear forgets the net)', () => {
        toC();
        simClearCoverage('M', getSimRun('M'));
        simObserveRun('M', getSimRun('M')!);
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map([['c', 1]]), firings: new Map() }));
        fire('M', 'r');
        simObserveRun('M', getSimRun('M')!);
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map([['a', 1], ['c', 1]]), firings: new Map([['r', 1]]) }));
    });

    it('without a run, Clear empties: Stop leaves none to hand over, and a call with none is the old call (mutant: the last marking kept)', () => {
        toC();
        simClear('M');
        expect(getSimRun('M')).toBeUndefined();
        simClearCoverage('M', getSimRun('M'));
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map(), firings: new Map() }));
        simReset('M', fresh());
        simObserveRun('M', getSimRun('M')!);
        simClearCoverage('M');
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map(), firings: new Map() }));
    });

    it('one bump of the coverage version per Clear, with the run or without, and none of \'mark\' (mutants: a bump per place; the run\'s Clear on \'mark\')', () => {
        toC();
        const mark = getSimVersion();
        const v = getSimCoverageVersion();
        simClearCoverage('M', getSimRun('M'));
        expect(getSimCoverageVersion()).toBe(v + 1);
        simClearCoverage('M');
        expect(getSimCoverageVersion()).toBe(v + 2);
        expect(getSimVersion()).toBe(mark);
    });

    it('a past step viewed does not matter: the live configuration counts (R-SIM-106; mutant: the shown step\'s marking)', () => {
        toC();
        simSetView('M', 0);
        expect(getSimRun('M')!.config.state.marking.get('c')).toBe(2);
        simClearCoverage('M', getSimRun('M'));
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map([['c', 1]]), firings: new Map() }));
    });

    it('it touches its own model only; a count handed out before is a snapshot; a model never seen stays empty (mutants: another model\'s counts changed or marking read; the shared empty map written; the old map edited)', () => {
        toC();
        simReset('N', fresh('N'));
        simObserveRun('N', getSimRun('N')!);
        const before = getSimCoverage('M');
        simClearCoverage('M', getSimRun('M'));
        expect(before.visits.get('b')).toBe(1);
        expect(text(getSimCoverage('M'))).toBe(text({ visits: new Map([['c', 1]]), firings: new Map() }));
        expect(text(getSimCoverage('N'))).toBe(text({ visits: new Map([['a', 1]]), firings: new Map() }));
        expect(text(getSimCoverage('Z'))).toBe(text({ visits: new Map(), firings: new Map() }));
    });
});

describe('the channel: its own version, never the \'mark\' one', () => {
    it('an observation that changes a count bumps the coverage version once and never \'mark\'; one that changes none does not bump (mutants: on \'mark\'; a bump at every observation)', () => {
        simReset('M', fresh());
        fire('M', 't');
        const mark = getSimVersion();
        const v = getSimCoverageVersion();
        simObserveRun('M', getSimRun('M')!);
        expect(getSimCoverageVersion()).toBe(v + 1);
        simObserveRun('M', getSimRun('M')!);
        expect(getSimCoverageVersion()).toBe(v + 1);
        simClearCoverage('M');
        expect(getSimCoverageVersion()).toBe(v + 2);
        expect(getSimVersion()).toBe(mark);
    });

    it('the run primitives move \'mark\' and never the coverage version (mutant: the store bumped by the run)', () => {
        const v = getSimCoverageVersion();
        simReset('M', fresh());
        fire('M', 't');
        simStepBack('M');
        simSetView('M', 0);
        simClear('M');
        expect(getSimVersion()).toBe(4);
        expect(getSimCoverageVersion()).toBe(v);
    });

    it('the test reset drops every count and the counter (mutant: counts outlive __resetSimCoverageForTests)', () => {
        simReset('M', fresh());
        simObserveRun('M', getSimRun('M')!);
        __resetSimCoverageForTests();
        expect(getSimCoverage('M').visits.size).toBe(0);
        expect(getSimCoverageVersion()).toBe(0);
    });
});

describe('what a node reads, and the summary', () => {
    function path() {
        simReset('M', fresh());
        for (const sel of PATH) fire('M', sel);
        simObserveRun('M', getSimRun('M')!);
    }

    it('a place reads its visits, an element its transitions\' firings summed, 0 when never (mutants: the first transition only; places read as firings)', () => {
        path();
        expect(getSimNodeCoverage('a')).toEqual({ modelId: 'M', kind: 'place', count: 3 });
        expect(getSimNodeCoverage('d')).toEqual({ modelId: 'M', kind: 'place', count: 0 });
        expect(getSimNodeCoverage('t')).toEqual({ modelId: 'M', kind: 'transition', count: 1 });
        expect(getSimNodeCoverage('F')).toEqual({ modelId: 'M', kind: 'transition', count: 2 });
        expect(getSimNodeCoverage('e2')).toEqual({ modelId: 'M', kind: 'transition', count: 1 });
        expect(getSimNodeCoverage('h')).toEqual({ modelId: 'M', kind: 'transition', count: 0 });
        expect(getSimNodeCoverage('w')).toEqual({ modelId: 'M', kind: 'transition', count: 0 });
    });

    it('nothing for an element the net does not know, and nothing once the run is stopped (the off state; mutant: counts shown without a run)', () => {
        path();
        expect(getSimNodeCoverage('zzz')).toBeNull();
        simClear('M');
        expect(getSimNodeCoverage('a')).toBeNull();
    });

    it('the summary: places visited of all, transitions fired of all (mutants: a never visited place counted; the halted one counted)', () => {
        path();
        expect(simCoverageSummary(getSimRun('M')!.net, getSimCoverage('M'))).toEqual({ places: 4, visited: 3, transitions: 8, fired: 6 });
        simClearCoverage('M');
        expect(simCoverageSummary(getSimRun('M')!.net, getSimCoverage('M'))).toEqual({ places: 4, visited: 0, transitions: 8, fired: 0 });
    });
});

describe('the overlay and the canvas layer: nothing changes with coverage off (V2)', () => {
    const node = (objectId: string) => renderToStaticMarkup(createElement(SimNodeRunState, { objectId }));
    const layer = () => renderToStaticMarkup(createElement(SimCanvasLayer, { modelId: 'M' }));

    it('the preference is absent by default: coverage off (mutant: on by default)', () => {
        expect(getSimViewerPrefs('M').coverage).toBeUndefined();
    });

    it('off: every node renders the markup it renders without any count (mutant: the counts painted with coverage off)', () => {
        simReset('M', fresh());
        const ids = ['a', 'b', 'c', 'd', 't', 'F', 'h', 'w', 'zzz'];
        const before = ids.map(node);
        for (const sel of PATH) fire('M', sel);
        simReset('M', fresh());
        const bare = ids.map(node);
        simObserveRun('M', getSimRun('M')!);
        expect(ids.map(node)).toEqual(bare);
        expect(bare).toEqual(before);
        // control: a place renders its token badge, a transition no overlay of its own
        expect(node('a')).toContain('sim-node-run__tokens');
        expect(node('w')).toBe('');
    });

    it('on: a never visited place and a never fired transition get the muted veil and no count (mutant: the veil on a visited node)', () => {
        simReset('M', fresh());
        for (const sel of PATH) fire('M', sel);
        simObserveRun('M', getSimRun('M')!);
        setSimViewerPrefs('M', { coverage: true });
        for (const id of ['d', 'w', 'h']) {
            expect(node(id)).toContain('sim-node-run__cov-veil');
            expect(node(id)).toContain('data-sim-cov="0"');
            expect(node(id)).not.toContain('sim-node-run__cov"');
        }
    });

    it('on: a visited node shows its count and no veil (mutants: no count; the count of another element)', () => {
        simReset('M', fresh());
        for (const sel of PATH) fire('M', sel);
        simObserveRun('M', getSimRun('M')!);
        setSimViewerPrefs('M', { coverage: true });
        expect(node('a')).toMatch(/<span class="sim-node-run__cov"[^>]*>×3<\/span>/);
        expect(node('F')).toMatch(/<span class="sim-node-run__cov"[^>]*>×2<\/span>/);
        expect(node('a')).not.toContain('sim-node-run__cov-veil');
        expect(node('a')).toContain('data-sim-cov="3"');
        expect(node('zzz')).toBe('');
    });

    it('on, with no run: nothing is painted (the off state; mutant: the overlay kept after Stop)', () => {
        simReset('M', fresh());
        simObserveRun('M', getSimRun('M')!);
        setSimViewerPrefs('M', { coverage: true });
        simClear('M');
        expect(node('a')).toBe('');
        expect(node('d')).toBe('');
    });

    it('the layer: the Coverage switch is an icon with its name and state on the button, the summary in its title when on, no visible text (R-SIM-146 point 4; mutants: the text span kept; no aria-label; the summary shown off)', () => {
        simReset('M', fresh());
        for (const sel of PATH) fire('M', sel);
        simObserveRun('M', getSimRun('M')!);
        const off = layer();
        expect(off).toContain('aria-label="Coverage"');
        expect(off).toContain('aria-pressed="false"');
        expect(off).toContain('bi-bullseye');
        expect(off).not.toContain('<span>Coverage</span>');
        expect(off).not.toContain('places ·');
        expect(off).toContain('title="Show on the nodes how often the runs since the last Clear visited or fired them"');
        setSimViewerPrefs('M', { coverage: true });
        const on = layer();
        expect(on).toContain('aria-pressed="true"');
        expect(on).toContain('title="Hide the coverage of the runs: 3/4 places · 6/8 transitions"');
        expect(on).not.toContain('class="sim-canvas-layer__coverage"');
        expect(on.replace(/title="[^"]*"/g, '').match(/places ·/g)).toBeNull();
    });

    it('the layer: Clear keeps its slot with coverage off, hidden by a class, and the controls hold the same elements off and on (R-SIM-146 point 4; mutants: Clear rendered only on; the hide class on when on)', () => {
        simReset('M', fresh());
        for (const sel of PATH) fire('M', sel);
        simObserveRun('M', getSimRun('M')!);
        const off = layer();
        setSimViewerPrefs('M', { coverage: true });
        const on = layer();
        expect(off).toContain('sim-canvas-layer__coverage-clear');
        expect(off).toContain('sim-canvas-layer__coverage-clear--hidden');
        expect(on).toContain('sim-canvas-layer__coverage-clear');
        expect(on).toContain('bi-eraser');
        expect(on).not.toContain('sim-canvas-layer__coverage-clear--hidden');
        const bare = (s: string) => s.replace(/ title="[^"]*"/g, '').replace(/ aria-pressed="(true|false)"/g, '').replace(' sim-canvas-layer__coverage-clear--hidden', '');
        expect(bare(on)).toBe(bare(off));
    });
});
