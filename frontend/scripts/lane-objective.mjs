/** Explicit objective links and acceptance evidence. No inference from Outcome or Depends.
 * CLI: node lane-objective.mjs link <objective> <Prompt-ID> --kind discovery|implementation|continuation|correction
 *        --by <actor> --evidence <reference> [--parent <Prompt-ID>] [--reason <text>]
 *      node lane-objective.mjs accept|reopen <objective> --by <actor> --evidence <reference> [--reason <text>]
 *      node lane-objective.mjs show <objective>
 * JJODEL_LANES selects the archive. Events are append-only; no historical backfill.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync, rmdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KINDS = ['discovery', 'implementation', 'continuation', 'correction'];
const LANE = /^P-\d{4}-\d{2}-\d{2}-\d{4}$/;
const required = (value, name) => {
    if (typeof value !== 'string' || !value.trim()) throw new Error(name + ' is required');
    return value.trim();
};
export function objectiveId(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)) throw new Error('invalid objective ID');
    return value;
}

function readEvents(root) {
    const path = join(root, '_objectives', 'events.jsonl');
    if (!existsSync(path)) return [];
    return readFileSync(path, 'utf8').split('\n').filter(Boolean).map((line, i) => {
        const e = JSON.parse(line);
        if (e.schema !== 1 || !['link', 'accept', 'reopen'].includes(e.type) || !Number.isFinite(Date.parse(e.at))) {
            throw new Error('invalid objective event at line ' + (i + 1));
        }
        objectiveId(e.objective);
        required(e.actor, 'actor');
        required(e.evidence, 'evidence');
        if (e.type === 'link' && (!LANE.test(e.lane) || !KINDS.includes(e.kind))) throw new Error('invalid objective link');
        return e;
    });
}

function mutate(root, build) {
    const dir = join(root, '_objectives');
    mkdirSync(dir, { recursive: true });
    const lock = join(dir, 'write.lock');
    try { mkdirSync(lock); } catch (err) {
        if (err.code === 'EEXIST') throw new Error('objective writer is busy; retry after it exits');
        throw err;
    }
    try {
        const events = readEvents(root);
        const next = build(events);
        if (next.length) appendFileSync(join(dir, 'events.jsonl'), next.map(e => JSON.stringify({ schema: 1, at: new Date().toISOString(), ...e })).join('\n') + '\n');
        return next;
    } finally { rmdirSync(lock); }
}

export function laneObjective(root, lane) {
    return readEvents(root).find(e => e.type === 'link' && e.lane === lane) || null;
}

export function readObjective(root, id) {
    objectiveId(id);
    const events = readEvents(root).filter(e => e.objective === id);
    const links = events.filter(e => e.type === 'link');
    const verdicts = events.filter(e => e.type !== 'link');
    const last = verdicts.at(-1) || null;
    return { id, state: last?.type === 'accept' ? 'accepted' : 'open', verdict: last, links, events };
}

export function linkLane(root, { objective, lane, kind, parent = null, reason = null, actor, evidence }) {
    objectiveId(objective);
    if (!LANE.test(lane) || !KINDS.includes(kind)) throw new Error('invalid lane or relationship kind');
    if (!existsSync(join(root, lane))) throw new Error('lane does not exist: ' + lane);
    required(actor, 'actor'); required(evidence, 'evidence');
    if (parent !== null && (!LANE.test(parent) || parent === lane)) throw new Error('invalid parent or cyclic link');
    if (['continuation', 'correction'].includes(kind) && !parent) throw new Error(kind + ' requires a parent lane');
    if (kind === 'correction') required(reason, 'correction reason');
    return mutate(root, events => {
        const existing = events.find(e => e.type === 'link' && e.lane === lane);
        if (existing) {
            if (existing.objective === objective && existing.kind === kind && existing.parent === parent && existing.reason === reason) return [];
            throw new Error('lane already linked; conflicting relinks are refused');
        }
        if (parent && !events.some(e => e.type === 'link' && e.lane === parent && e.objective === objective)) {
            throw new Error('parent must already belong to the same objective');
        }
        const last = events.filter(e => e.objective === objective && e.type !== 'link').at(-1);
        if (last?.type === 'accept' && kind !== 'correction') throw new Error('reopen the accepted objective before adding work');
        const common = { objective, actor, evidence };
        const out = [{ ...common, type: 'link', lane, kind, parent, reason }];
        if (last?.type === 'accept') out.push({ ...common, type: 'reopen', reason, correction: lane });
        return out;
    });
}

export function recordVerdict(root, { objective, type, actor, evidence, reason = null }) {
    objectiveId(objective);
    if (!['accept', 'reopen'].includes(type)) throw new Error('verdict must be accept or reopen');
    required(actor, 'actor'); required(evidence, 'evidence');
    if (type === 'reopen') required(reason, 'reopening reason');
    return mutate(root, events => {
        if (!events.some(e => e.objective === objective && e.type === 'link')) throw new Error('objective has no linked lanes');
        const last = events.filter(e => e.objective === objective && e.type !== 'link').at(-1);
        if (type === 'reopen' && last?.type !== 'accept') throw new Error('objective is not accepted');
        if (type === 'accept' && last?.type === 'accept') throw new Error('objective is already accepted');
        return [{ objective, type, actor, evidence, reason }];
    });
}

export function objectiveCommand(root, argv) {
    const [command, objective, ...rest] = argv;
    objectiveId(objective);
    if (command === 'show' && !rest.length) return readObjective(root, objective);
    const lane = command === 'link' ? rest.shift() : null;
    const opts = {};
    for (let i = 0; i < rest.length; i += 2) {
        if (!['--kind', '--parent', '--reason', '--by', '--evidence'].includes(rest[i]) || !rest[i + 1] || rest[i + 1].startsWith('--') || opts[rest[i]] !== undefined) {
            throw new Error('invalid objective option: ' + rest[i]);
        }
        opts[rest[i]] = rest[i + 1];
    }
    const common = { objective, actor: opts['--by'], evidence: opts['--evidence'], reason: opts['--reason'] || null };
    if (command === 'link') linkLane(root, { ...common, lane, kind: opts['--kind'], parent: opts['--parent'] || null });
    else if (['accept', 'reopen'].includes(command)) recordVerdict(root, { ...common, type: command });
    else throw new Error('usage: lane-objective.mjs link|accept|reopen|show <objective> ...');
    return readObjective(root, objective);
}

const main = (() => { try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } })();
if (main) {
    try { console.log(JSON.stringify(objectiveCommand(process.env.JJODEL_LANES || join(homedir(), '.jjodel-lanes'), process.argv.slice(2)), null, 2)); }
    catch (err) { console.error('lane-objective: ' + err.message); process.exitCode = 2; }
}
