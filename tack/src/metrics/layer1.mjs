// Layer 1 metrics: transcripts and git only, computable on any repository with zero adoption.
// Each is { name, layer, definition, params, compute(sel, params) }: a pure function of the
// selection (select.mjs), plus the store handle for commit proximity. Days follow days.mjs.
import { commitWithinHour } from '../store/sessions.mjs';
import { dayBounds, dayOf, daysBetween } from './days.mjs';

const KINDS = ['input', 'output', 'cache_read', 'cache_creation'];

// Relative price of a token by kind, the same ratio for every Claude model (input 1, output 5,
// cache read 0.1, cache write 1.25). Used only to split one model's known cost between the main
// thread and subagents; the absolute cost always comes from the transcript.
export const PRICE_WEIGHTS = { input: 1, output: 5, cache_read: 0.1, cache_creation: 1.25 };

const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const share = (a, b) => (b > 0 ? a / b : null);
const sortKeys = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
const main = (s) => s.calls.filter((c) => c.sidechain === 0);

export const sessionsPerDay = {
  name: 'sessions_per_day',
  layer: 1,
  definition: 'sessions by the day of their first event; sessions without a timestamp counted apart',
  params: {},
  compute(sel) {
    const days = {};
    let undated = 0;
    for (const s of sel.sessions) {
      if (s.day === null) undated++;
      else days[s.day] = (days[s.day] ?? 0) + 1;
    }
    return { days: sortKeys(days), undated, total: sel.sessions.length };
  },
};

export const costPerDay = {
  name: 'cost_per_day',
  layer: 1,
  definition: 'sum of known session cost (max cost-state.totalCostUSD) by the day of the first event; unknown cost counted apart, never as 0',
  params: {},
  compute(sel) {
    const days = {};
    const total = { usd: 0, known: 0, unknown: 0, partial: 0 };
    const add = (t, s) => {
      if (s.cost === null) t.unknown++;
      else {
        t.usd += s.cost;
        t.known++;
        if (s.costPartial) t.partial++;
      }
    };
    let undated = 0;
    for (const s of sel.sessions) {
      add(total, s);
      if (s.day === null) {
        undated++;
        continue;
      }
      add((days[s.day] ??= { usd: 0, known: 0, unknown: 0, partial: 0 }), s);
    }
    return { days: sortKeys(days), undated, total };
  },
};

export const tokensPerDay = {
  name: 'tokens_per_day',
  layer: 1,
  definition: 'input, output, cache read and cache write tokens of every call, subagents included, by the day of the call',
  params: {},
  compute(sel) {
    const days = {};
    const total = Object.fromEntries(KINDS.map((k) => [k, 0]));
    const undated = Object.fromEntries(KINDS.map((k) => [k, 0]));
    for (const s of sel.sessions) {
      for (const c of s.calls) {
        const t = c.ts ?? s.first;
        const bucket = t === null ? undated : (days[dayOf(t, sel)] ??= Object.fromEntries(KINDS.map((k) => [k, 0])));
        for (const k of KINDS) {
          bucket[k] += c[k];
          total[k] += c[k];
        }
      }
    }
    return { days: sortKeys(days), undated, total };
  },
};

export const contextPeak = {
  name: 'context_peak',
  layer: 1,
  definition: 'largest main-thread context (input + cache read + cache write) per session, and the sessions at or above the threshold',
  params: { threshold: 200_000 },
  compute(sel, { threshold = 200_000 } = {}) {
    const sessions = [];
    let noCalls = 0;
    for (const s of sel.sessions) {
      const m = main(s);
      if (!m.length) {
        noCalls++;
        continue;
      }
      sessions.push({ id: s.id, peak: Math.max(...m.map((c) => c.context)) });
    }
    const peaks = sessions.map((x) => x.peak);
    return {
      threshold, n: sessions.length, noCalls, median: median(peaks), max: peaks.length ? Math.max(...peaks) : null,
      atOrAbove: peaks.filter((p) => p >= threshold).length, sessions,
    };
  },
};

export const callsPerSession = {
  name: 'calls_per_session',
  layer: 1,
  definition: 'main-thread API calls per session (one per message id, subagent calls excluded)',
  params: {},
  compute(sel) {
    const sessions = sel.sessions.map((s) => ({ id: s.id, calls: main(s).length }));
    const xs = sessions.map((x) => x.calls);
    return { n: xs.length, total: xs.reduce((a, b) => a + b, 0), median: median(xs), max: xs.length ? Math.max(...xs) : null, sessions };
  },
};

export const waits = {
  name: 'waits',
  layer: 1,
  definition: 'gaps above the threshold between consecutive calls of one session (subagents included), summed per session and per day of the gap start',
  params: { gapMs: 5 * 60_000 },
  compute(sel, { gapMs = 5 * 60_000 } = {}) {
    const days = {};
    const sessions = [];
    const total = { count: 0, ms: 0 };
    for (const s of sel.sessions) {
      const ts = s.calls.map((c) => c.ts).filter((t) => t !== null).sort((a, b) => a - b);
      const w = { id: s.id, count: 0, ms: 0 };
      for (let i = 1; i < ts.length; i++) {
        const gap = ts[i] - ts[i - 1];
        if (gap <= gapMs) continue;
        w.count++;
        w.ms += gap;
        const d = (days[dayOf(ts[i - 1], sel)] ??= { count: 0, ms: 0 });
        d.count++;
        d.ms += gap;
      }
      total.count += w.count;
      total.ms += w.ms;
      sessions.push(w);
    }
    return { gapMs, days: sortKeys(days), total, sessions };
  },
};

/** Largest number of closed intervals [s, e] that share an instant. */
function maxConcurrent(intervals) {
  const ev = [];
  for (const [s, e] of intervals) ev.push([s, 1], [e, -1]);
  ev.sort((a, b) => a[0] - b[0] || b[1] - a[1]); // at one instant, starts before ends: touching counts
  let cur = 0;
  let max = 0;
  for (const [, d] of ev) {
    cur += d;
    if (cur > max) max = cur;
  }
  return max;
}

export const overlap = {
  name: 'overlap',
  layer: 1,
  definition: 'largest number of sessions of one repository active at one instant (first to last event), per day; a session spanning midnight counts on both days',
  params: {},
  compute(sel) {
    const byRepo = {};
    let unlinked = 0;
    for (const s of sel.sessions) {
      if (s.first === null || s.last === null) continue;
      if (!s.repo) {
        unlinked++;
        continue;
      }
      (byRepo[s.repo] ??= []).push([s.first, s.last]);
    }
    const repos = {};
    const days = {};
    for (const [key, list] of Object.entries(byRepo)) {
      const per = {};
      const all = new Set(list.flatMap(([a, b]) => daysBetween(a, b, sel)));
      for (const day of [...all].sort()) {
        const [ds, de] = dayBounds(day, sel);
        const clipped = list.filter(([a, b]) => a < de && b >= ds).map(([a, b]) => [Math.max(a, ds), Math.min(b, de - 1)]);
        per[day] = maxConcurrent(clipped);
        days[day] = Math.max(days[day] ?? 0, per[day]);
      }
      repos[key] = per;
    }
    return { repos: sortKeys(repos), days: sortKeys(days), unlinked };
  },
};

export const commitProximity = {
  name: 'commit_proximity',
  layer: 1,
  definition: 'share of sessions with a commit of their repository between the first event and the window after the last (proximity, not authorship); unknown kept apart',
  params: { windowSec: 3600 },
  compute(sel, { windowSec = 3600 } = {}) {
    const repos = {};
    const total = { yes: 0, no: 0, unknown: 0 };
    for (const s of sel.sessions) {
      const v = commitWithinHour(sel.db, {
        repo_key: s.repo, first_ts: s.first === null ? null : new Date(s.first).toISOString(),
        last_ts: s.last === null ? null : new Date(s.last).toISOString(),
      }, windowSec);
      total[v]++;
      if (s.repo) (repos[s.repo] ??= { yes: 0, no: 0, unknown: 0 })[v]++;
    }
    for (const r of Object.values(repos)) r.share = share(r.yes, r.yes + r.no);
    total.share = share(total.yes, total.yes + total.no);
    return { windowSec, repos: sortKeys(repos), total };
  },
};

export const subagentShare = {
  name: 'subagent_share',
  layer: 1,
  definition: 'subagent calls over all calls; subagent cost over known cost, each model\'s cost split by price-weighted tokens of its calls',
  params: {},
  compute(sel) {
    const calls = { subagent: 0, total: 0 };
    const cost = { subagentUsd: 0, totalUsd: 0, unattributedUsd: 0, sessionsWithoutModelCost: 0 };
    const weight = (c) => KINDS.reduce((a, k) => a + c[k] * PRICE_WEIGHTS[k], 0);
    for (const s of sel.sessions) {
      calls.total += s.calls.length;
      calls.subagent += s.calls.filter((c) => c.sidechain === 1).length;
      if (s.cost === null) continue;
      if (!s.models.size) {
        cost.sessionsWithoutModelCost++;
        continue;
      }
      for (const [model, usd] of s.models) {
        const of = s.calls.filter((c) => c.model === model);
        const all = of.reduce((a, c) => a + weight(c), 0);
        cost.totalUsd += usd;
        if (all === 0) {
          cost.unattributedUsd += usd; // a model billed with no call in the transcripts
          continue;
        }
        cost.subagentUsd += usd * (of.filter((c) => c.sidechain === 1).reduce((a, c) => a + weight(c), 0) / all);
      }
    }
    return { calls: { ...calls, share: share(calls.subagent, calls.total) }, cost: { ...cost, share: share(cost.subagentUsd, cost.totalUsd) } };
  },
};

export const LAYER1 = [sessionsPerDay, costPerDay, tokensPerDay, contextPeak, callsPerSession, waits, overlap, commitProximity, subagentShare];
