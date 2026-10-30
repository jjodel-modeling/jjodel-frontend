import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readLaneSources, readSample, lanePattern, contentHash } from './reader.mjs';
import { resolveIdentities } from './identity.mjs';
import { reconstructUsage, reconcileUsage } from './accounting.mjs';

export function canonicalStringify(value) {
    const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object'
        ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
    return JSON.stringify(sort(value), null, 2) + '\n';
}

export function buildReport(lanes) {
    const records = [...lanes].sort((a, b) => a.laneId < b.laneId ? -1 : 1).map(lane => {
        const identities = resolveIdentities(lane); const stream = reconstructUsage(lane.events);
        const accounting = reconcileUsage(lane.events, stream);
        const diagnostics = [...lane.diagnostics, ...identities.diagnostics, ...stream.diagnostics, ...accounting.diagnostics];
        const invalidSource = diagnostics.some(d => ['SOURCE_CHANGED', 'SOURCE_UNREADABLE', 'MALFORMED_JSON', 'INCOMPLETE_LAST_LINE', 'LINE_TOO_LARGE'].includes(d.code));
        const arch = lane.artifacts.architect;
        const lastRun = lane.artifacts.runs?.at(-1);
        const offset = Number.isSafeInteger(lastRun?.logFrom) ? lastRun.logFrom : lane.events.filter(e => e.kind === 'init').at(-1)?.source.byteStart ?? 0;
        const missingSource = !lane.sources.some(s => s.path.endsWith('/log.jsonl'));
        const uncertain = stream.diagnostics.some(d => ['MESSAGE_ID_CONFLICT', 'MESSAGE_ID_MISSING'].includes(d.code));
        return { laneId: lane.laneId, sources: lane.sources, entities: identities.entities, relations: identities.relations,
            originalCounters: { messages: lane.events.filter(e => e.kind === 'message' && e.original).map(c => ({ source: c.source, model: c.model, original: c.original })),
                results: accounting.snapshots.map(s => ({ source: s.source, models: s.models.map(m => ({ model: m.model, original: m.original })),
                    originalInvocationUsage: lane.events.find(e => e.source === s.source)?.originalInvocationUsage ?? null,
                    costCLI: s.costCLI })) },
            reconstructedUsage: { calls: stream.calls.length, mainCalls: stream.calls.filter(c => !c.agent && !c.sidechain).length,
                subCalls: stream.calls.filter(c => c.agent || c.sidechain).length,
                stream: { all: stream.all, main: stream.main, subagents: stream.subagents, byModel: stream.byModel },
                outputStreamAvailability: accounting.outputStreamAvailability },
            reconciliation: { availability: missingSource ? 'missing' : invalidSource || uncertain ? 'partial' : accounting.availability === 'not_applicable' && !lane.artifacts['direct.json'] ? 'missing' : accounting.availability, accounted: accounting.accounted,
                difference: accounting.difference, inputEqual: accounting.inputEqual,
                baselineTechnicalTotal: invalidSource ? null : accounting.baselineTechnicalTotal,
                eligibleForBaseline: !invalidSource && !uncertain && accounting.inputEqual && accounting.baselineTechnicalTotal !== null,
                comparisonScope: 'observed_stream_vs_last_cli_session_snapshots_not_proven_complete_history',
                segments: accounting.segmentComparisons },
            operationalOutcomes: { agent: lane.events.filter(e => e.kind === 'message' && e.outcome && e.source.byteStart >= offset).at(-1)?.outcome ?? null,
                exit: lane.artifacts['exit.txt'] ?? null, direct: lane.artifacts['result.json'] ?? null,
                acceptance: 'unknown', integration: 'unknown', invocationsObserved: (lane.artifacts.runs || []).length,
                invocationCoverage: lane.artifacts.runs ? 'partial' : 'missing',
                outcomeScope: lastRun ? 'latest_ledger_range' : 'latest_observed_segment',
                resultDurations: lane.events.filter(e => e.kind === 'result').map(e => ({ source: e.source, durationMs: e.durationMs, notification: e.notification, isError: e.isError })) },
            architect: { availability: !arch ? 'missing' : arch.schema !== 1 ? 'invalid' : arch.close ? 'partial' : 'partial',
                reason: !arch ? 'no_source' : arch.schema !== 1 ? 'unknown_schema' : arch.close ? 'closed_but_exclusive_attribution_unverified' : 'open',
                originalCounters: arch || null }, diagnostics };
    });
    const eligible = records.filter(r => r.reconciliation.eligibleForBaseline);
    const total = eligible.reduce((s, r) => s + r.reconciliation.baselineTechnicalTotal, 0);
    return { schemaVersion: 'harness-observer/1', readerVersion: '1.0.0',
        dataset: { laneIds: records.map(r => r.laneId), sourceFingerprint: contentHash(canonicalStringify(records.flatMap(r => r.sources))) },
        records, coverage: { lanes: records.length, llmLanes: records.filter(r => r.reconstructedUsage.calls > 0).length,
            reconciledLanes: eligible.length, baselineTechnicalTotal: Number.isSafeInteger(total) ? total : null,
            completeSystemConsumption: false } };
}

export function main(args, io = { out: s => process.stdout.write(s), err: s => process.stderr.write(s) }) {
    try {
        const [command, ...rest] = args;
        if (!['inspect', 'audit'].includes(command) || rest.length % 2) throw new Error('ARGUMENTS');
        const options = {};
        for (let i = 0; i < rest.length; i += 2) {
            if (!['--lanes-root', '--lane', '--sample'].includes(rest[i]) || options[rest[i]] || !rest[i + 1]) throw new Error('ARGUMENTS');
            options[rest[i]] = rest[i + 1];
        }
        if (!options['--lanes-root'] || (command === 'inspect' ? !lanePattern.test(options['--lane'] || '') || options['--sample'] : !options['--sample'] || options['--lane'])) throw new Error('ARGUMENTS');
        const ids = command === 'inspect' ? [options['--lane']] : readSample(options['--sample']);
        const report = buildReport(ids.map(id => readLaneSources(options['--lanes-root'], id)));
        io.out(canonicalStringify(report));
        return report.records.some(r => r.diagnostics.some(d => ['SOURCE_CHANGED', 'SOURCE_UNREADABLE'].includes(d.code))) ? 1 : 0;
    } catch (e) { io.err((e.message === 'ARGUMENTS' || e.message === 'INVALID_SAMPLE' ? 'INVALID_ARGUMENTS' : 'READ_FAILED') + '\n'); return e.message === 'ARGUMENTS' || e.message === 'INVALID_SAMPLE' ? 2 : 1; }
}

const entry = process.argv[1];
if (entry && resolve(entry) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
