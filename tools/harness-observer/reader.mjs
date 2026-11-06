import { openSync, readSync, closeSync, fstatSync, lstatSync, readdirSync, realpathSync, readFileSync, constants } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { normalizeEvent } from './providers/claude-stream.mjs';

export const lanePattern = /^P-\d{4}-\d{2}-\d{2}-\d{4}$/;
const allowed = /^(log\.jsonl|runs\.jsonl|direct\.json|result\.json|architect\.json|session\.txt|worktree\.txt|prompt\.txt|exit\.txt|input-[1-9]\d*\.md)$/;
const MAX_LINE = 16 * 1024 * 1024;
const hash = text => createHash('sha256').update(text).digest('hex');
export const contentHash = hash;
const signature = s => [s.dev, s.ino, s.size, s.mtimeNs, s.ctimeNs].map(String).join(':');
const within = (root, target) => target === root || (!relative(root, target).startsWith('..' + sep) && relative(root, target) !== '..');

/** Explicit file access, bounded by the supplied root. Symlinks are refused. */
export function readBytes(path, root, onRead = null, consumeLine = null) {
    const abs = resolve(path);
    if (!within(root, abs) || lstatSync(abs).isSymbolicLink() || !within(root, realpathSync(abs))) throw new Error('ACCESS_OUTSIDE_ROOT');
    const fd = openSync(abs, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
    try {
        if (!within(root, realpathSync(abs))) throw new Error('ACCESS_OUTSIDE_ROOT');
        const before = fstatSync(fd, { bigint: true });
        if (!before.isFile()) throw new Error('SOURCE_NOT_FILE');
        if (before.size > 128n * 1024n * 1024n) throw new Error('SOURCE_TOO_LARGE');
        const h = createHash('sha256'); const chunks = []; const buffer = Buffer.alloc(65536);
        let pending = []; let pendingLength = 0; let oversized = false; let lineNo = 0; let offset = 0; let byteLength = 0;
        const append = piece => {
            pendingLength += piece.length;
            if (pendingLength > MAX_LINE) { oversized = true; pending = []; }
            else if (!oversized) pending.push(Buffer.from(piece));
        };
        const emit = newline => {
            lineNo++;
            consumeLine(oversized ? null : Buffer.concat(pending), lineNo, offset, offset + pendingLength, !newline);
            offset += pendingLength + (newline ? 1 : 0); pending = []; pendingLength = 0; oversized = false;
        };
        let n;
        while ((n = readSync(fd, buffer, 0, buffer.length, null)) > 0) {
            const chunk = buffer.subarray(0, n); h.update(chunk); byteLength += n;
            if (byteLength > 128 * 1024 * 1024) throw new Error('SOURCE_TOO_LARGE');
            if (!consumeLine) chunks.push(Buffer.from(chunk));
            else {
                let start = 0;
                for (let end = 0; end < n; end++) if (chunk[end] === 10) { append(chunk.subarray(start, end)); emit(true); start = end + 1; }
                append(chunk.subarray(start));
            }
        }
        if (consumeLine && pendingLength) emit(false);
        if (onRead) onRead(abs);
        const after = fstatSync(fd, { bigint: true });
        const pathAfter = lstatSync(abs, { bigint: true });
        return { bytes: consumeLine ? null : Buffer.concat(chunks), byteLength, sha256: h.digest('hex'),
            stable: signature(before) === signature(after) && signature(after) === signature(pathAfter) };
    } finally { closeSync(fd); }
}

/** Read only enumerated sources. Log bytes are released after each lane. */
export function readLaneSources(rootArg, laneId, options = {}) {
    if (!lanePattern.test(laneId)) throw new Error('INVALID_LANE_ID');
    const root = realpathSync(resolve(rootArg)); const dir = join(root, laneId);
    if (lstatSync(dir).isSymbolicLink() || !within(root, realpathSync(dir))) throw new Error('ACCESS_OUTSIDE_ROOT');
    const result = { laneId, sources: [], events: [], artifacts: {}, diagnostics: [] };
    for (const name of readdirSync(dir).filter(n => allowed.test(n)).sort()) {
        const logical = laneId + '/' + name;
        const refs = []; const events = []; const runs = []; const diagnostics = [];
        const consumeLine = (raw, lineNo, start, end, incomplete) => {
            const ref = { path: logical, sha256: null, line: lineNo, byteStart: start, byteEnd: end }; refs.push(ref);
            if (raw === null) { diagnostics.push({ code: 'LINE_TOO_LARGE', source: ref }); return; }
            if (!raw.toString('utf8').trim()) return;
            try {
                const parsed = JSON.parse(raw.toString('utf8'));
                if (name === 'log.jsonl') { const e = normalizeEvent(parsed, ref); if (e) events.push(e); }
                else {
                    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('record');
                    runs.push({ kind: parsed.kind ?? null, session: parsed.session ?? null,
                        logFrom: parsed.logFrom ?? null, at: parsed.at ?? null, exit: parsed.exit ?? null, source: ref });
                }
            } catch { diagnostics.push({ code: incomplete ? 'INCOMPLETE_LAST_LINE' : 'MALFORMED_JSON', source: ref }); }
        };
        let file;
        try { file = readBytes(join(dir, name), root, options.onRead, name.endsWith('.jsonl') ? consumeLine : null); }
        catch { result.diagnostics.push({ code: 'SOURCE_UNREADABLE', source: logical }); continue; }
        result.sources.push({ path: logical, sha256: file.sha256, bytes: file.byteLength, stable: file.stable });
        if (!file.stable) { result.diagnostics.push({ code: 'SOURCE_CHANGED', source: logical }); continue; }
        if (name.endsWith('.jsonl')) {
            refs.forEach(ref => { ref.sha256 = file.sha256; });
            for (const event of events) result.events.push(event);
            for (const diagnostic of diagnostics) result.diagnostics.push(diagnostic);
            if (name === 'runs.jsonl') result.artifacts.runs = runs;
        } else if (name.endsWith('.json')) {
            try {
                const v = JSON.parse(file.bytes.toString('utf8'));
                if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('object');
                if (name === 'architect.json') result.artifacts.architect = { schema: v.schema, launch: v.launch, close: v.close, delta: v.delta };
                else result.artifacts[name] = Object.fromEntries(['kind', 'promptId', 'branch', 'trunk', 'top', 'tree', 'ok', 'outcome']
                    .filter(k => Object.hasOwn(v, k)).map(k => [k, v[k]]));
            } catch { result.diagnostics.push({ code: 'MALFORMED_JSON', source: logical }); }
        } else {
            const text = file.bytes.toString('utf8');
            if (name.startsWith('input-')) {
                const header = text.split(/\n## /)[0];
                result.artifacts[name] = { promptId: /^Prompt-ID:\s*(P-\d{4}-\d{2}-\d{2}-\d{4})/m.exec(header)?.[1] || null,
                    worktree: /^Worktree:\s*`([^`]+)`/m.exec(header)?.[1] || null };
            } else result.artifacts[name] = text.trim();
        }
    }
    return result;
}

export function readSample(path) {
    const a = JSON.parse(readFileSync(path, 'utf8'));
    if (!a || a.schemaVersion !== 1 || !Array.isArray(a.laneIds) || !a.laneIds.length || a.laneIds.some(x => !lanePattern.test(x)) || new Set(a.laneIds).size !== a.laneIds.length) throw new Error('INVALID_SAMPLE');
    return [...a.laneIds].sort();
}
