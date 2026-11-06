import { contentHash } from './reader.mjs';

/** A hash identifies evidence, not an invented semantic task identity. */
export const observationId = (kind, evidence) => 'obs:' + kind + ':' + contentHash(JSON.stringify(evidence));

export function resolveIdentities(lane) {
    const entities = [{ id: lane.laneId, type: 'lane', status: 'observed', taskId: null }];
    const relations = []; const diagnostics = [];
    const refs = kind => lane.events.filter(e => e.kind === kind).map(e => e.source);
    const sessions = [...new Set(lane.events.map(e => e.sessionId).filter(Boolean))].sort();
    for (const id of sessions) entities.push({ id: 'claude:' + id, type: 'session', status: 'observed',
        evidence: lane.events.filter(e => e.sessionId === id && e.kind === 'init').map(e => e.source) });
    const direct = lane.artifacts['direct.json']; const runs = lane.artifacts.runs || [];
    if (direct) entities.push({ id: observationId('execution', [lane.laneId, 'direct', direct]), type: 'execution',
        status: 'evidence_derived', kind: 'direct', taskId: null, evidence: ['direct.json', 'result.json'].filter(k => lane.artifacts[k]).map(k => lane.laneId + '/' + k) });
    const llm = lane.events.some(e => e.kind === 'message' && e.usage && !e.synthetic);
    if (llm) {
        const id = observationId('execution', [lane.laneId, 'llm', sessions, runs.map(r => r.source)]);
        entities.push({ id, type: 'execution', status: runs.length ? 'evidence_derived' : 'ambiguous', kind: 'llm', taskId: null,
            evidence: runs.length ? runs.map(r => r.source) : refs('init') });
        for (const run of runs) {
            const invocation = observationId('invocation', run.source);
            entities.push({ id: invocation, type: 'invocation', status: 'observed', kind: run.kind, sessionId: run.session, evidence: [run.source] });
            relations.push({ from: invocation, to: id, type: 'belongs_to', status: 'evidence_derived', evidence: [run.source] });
            if (run.session && sessions.includes(run.session)) relations.push({ from: invocation, to: 'claude:' + run.session,
                type: 'uses_session', status: 'observed', evidence: [run.source] });
        }
    }
    for (const e of lane.events.filter(e => e.kind === 'init')) entities.push({ id: observationId('segment', e.source),
        type: 'observedSegment', status: 'observed', invocationId: null, sessionId: e.sessionId, evidence: [e.source] });
    if (lane.artifacts['worktree.txt']) entities.push({ id: observationId('worktreeObservation', [lane.laneId, lane.artifacts['worktree.txt']]),
        type: 'worktree', status: 'observed', path: lane.artifacts['worktree.txt'], persistentWorktreeId: null,
        evidence: [lane.laneId + '/worktree.txt'] });
    if (direct && llm) diagnostics.push({ code: 'MIXED_CONTAINER', status: 'ambiguous',
        directBranch: direct.branch ?? null, directWorktree: direct.top ?? direct.tree ?? null,
        llmWorktree: lane.artifacts['worktree.txt'] ?? null,
        sameTask: null, evidence: [lane.laneId + '/direct.json', ...runs.map(r => r.source)] });
    if (llm && !runs.length) diagnostics.push({ code: 'INVOCATION_IDENTITY_UNKNOWN' });
    return { entities, relations, diagnostics };
}
