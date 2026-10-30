const keys = ['input', 'cacheRead', 'cacheCreation', 'output'];
const inputKeys = keys.slice(0, 3);
const valid = n => Number.isSafeInteger(n) && n >= 0;
const empty = () => Object.fromEntries(keys.map(k => [k, 0]));
const compare = (a, b, ks) => Object.fromEntries(ks.map(k => [k, valid(a[k]) && valid(b[k]) && Number.isSafeInteger(a[k] - b[k]) ? a[k] - b[k] : null]));
function add(a, b, diagnostics) {
    for (const k of keys) {
        if (a[k] === null || !valid(b[k]) || !Number.isSafeInteger(a[k] + b[k])) {
            if (b[k] !== null && !valid(b[k])) diagnostics.push({ code: 'INVALID_COUNTER', field: k });
            if (valid(b[k]) && a[k] !== null) diagnostics.push({ code: 'COUNTER_OVERFLOW', field: k });
            a[k] = null;
        } else a[k] += b[k];
    }
}

export function reconstructUsage(events) {
    const calls = new Map(); const diagnostics = []; let segment = -1; let session = null;
    const segments = [];
    for (const e of events) {
        if (e.kind === 'init') { segment++; session = e.sessionId; segments.push({ index: segment, source: e.source, sessionId: session }); }
        if (e.kind !== 'message' || !e.usage || e.synthetic) continue;
        const scope = e.sessionId || session;
        // Missing identities are not deduplicated across observations.
        const key = JSON.stringify([scope || ['unknown', segment], e.messageId || e.source]);
        if (!e.messageId) diagnostics.push({ code: 'MESSAGE_ID_MISSING', source: e.source });
        const prior = calls.get(key);
        if (prior && JSON.stringify(prior.usage) !== JSON.stringify(e.usage)) diagnostics.push({ code: 'MESSAGE_USAGE_CHANGED', source: e.source, previous: prior.source });
        if (prior && (prior.model !== e.model || prior.agent !== e.agent)) diagnostics.push({ code: 'MESSAGE_ID_CONFLICT', source: e.source });
        calls.set(key, { ...e, segment, sessionId: scope });
    }
    const all = empty(); const main = empty(); const subagents = empty(); const byModel = {};
    for (const e of calls.values()) {
        add(all, e.usage, diagnostics); add(e.agent || e.sidechain ? subagents : main, e.usage, diagnostics);
        byModel[e.model || 'unknown'] ||= empty(); add(byModel[e.model || 'unknown'], e.usage, diagnostics);
    }
    return { calls: [...calls.values()], segments, all, main, subagents, byModel, diagnostics };
}

export function reconcileUsage(events, stream) {
    const diagnostics = []; const snapshots = []; const latest = new Map(); let session = null; let segment = -1;
    const segmentResults = new Map(); const previous = new Map(); const segmentComparisons = [];
    for (const e of events) {
        if (e.kind === 'init') { session = e.sessionId; segment++; }
        if (e.kind !== 'result' || !e.models) continue;
        const sid = e.sessionId || session;
        if (!sid) diagnostics.push({ code: 'RESULT_SESSION_UNKNOWN', source: e.source });
        const total = empty();
        for (const m of e.models) add(total, m.usage, diagnostics);
        const key = sid || 'unknown:' + segment;
        const old = latest.get(key);
        if (old && keys.some(k => valid(total[k]) && valid(old.total[k]) && total[k] < old.total[k])) diagnostics.push({ code: 'COUNTER_DISCONTINUITY', source: e.source });
        if (old) for (const prior of old.models) {
            const now = e.models.find(m => m.model === prior.model);
            if (!now || keys.some(k => valid(now.usage[k]) && valid(prior.usage[k]) && now.usage[k] < prior.usage[k])) diagnostics.push({ code: 'COUNTER_DISCONTINUITY', source: e.source, model: prior.model });
        }
        const snapshot = { source: e.source, sessionId: sid, segment, total, models: e.models,
            invocationUsage: e.invocationUsage, costCLI: e.costCLI, isError: e.isError, notification: e.notification };
        snapshots.push(snapshot); latest.set(key, snapshot); segmentResults.set(segment, snapshot);
    }
    const accounted = empty();
    for (const s of latest.values()) add(accounted, s.total, diagnostics);
    for (const s of segmentResults.values()) {
        const key = s.sessionId || 'unknown:' + s.segment;
        const before = previous.get(key); const delta = before ? compare(s.total, before, keys) : { ...s.total };
        // A first observed snapshot is not proof of a fresh provider session.
        const all = empty(); const main = empty();
        for (const c of stream.calls.filter(c => c.segment === s.segment)) {
            add(all, c.usage, diagnostics); if (!c.agent && !c.sidechain) add(main, c.usage, diagnostics);
        }
        segmentComparisons.push({ segment: s.segment, baseline: before ? 'previous_observed_snapshot' : 'zero_reference_not_proven_fresh',
            streamInput: Object.fromEntries(inputKeys.map(k => [k, all[k]])), cliDelta: delta,
            difference: compare(all, delta, inputKeys),
            mainVsInvocation: s.invocationUsage ? compare(main, s.invocationUsage, inputKeys) : null,
            compactionObserved: events.some(e => e.kind === 'compaction' && e.source.byteStart >= stream.segments[s.segment]?.source.byteStart && e.source.byteStart <= s.source.byteStart),
            evidence: s.source });
        previous.set(key, s.total);
    }
    const difference = latest.size ? compare(stream.all, accounted, inputKeys) : null;
    const hasCalls = stream.calls.length > 0;
    const reliable = keys.every(k => valid(accounted[k])) && inputKeys.every(k => valid(stream.all[k])) && !diagnostics.some(d => ['COUNTER_DISCONTINUITY', 'RESULT_SESSION_UNKNOWN', 'INVALID_COUNTER', 'COUNTER_OVERFLOW'].includes(d.code));
    const inputEqual = difference && Object.values(difference).every(v => v === 0);
    const total = latest.size && reliable && [...inputKeys.map(k => stream.all[k]), accounted.output].every(valid)
        ? inputKeys.reduce((s, k) => s + stream.all[k], 0) + accounted.output : null;
    if (total !== null && !Number.isSafeInteger(total)) diagnostics.push({ code: 'COUNTER_OVERFLOW' });
    return { snapshots, accounted: latest.size ? accounted : null, difference, inputEqual: Boolean(inputEqual),
        availability: !hasCalls && !latest.size ? 'not_applicable' : latest.size ? reliable ? 'available' : 'partial' : 'missing',
        baselineTechnicalTotal: total !== null && Number.isSafeInteger(total) ? total : null,
        outputStreamAvailability: hasCalls ? 'partial' : 'not_applicable',
        segmentComparisons, diagnostics };
}
