/**
 * rule-trigger.mjs: PreToolUse hook on Edit|Write|NotebookEdit.
 *
 * The second trigger of report docs/discovery/discovery_2026-10-15_lean_context_model_routing.md
 * §5.3 (batch B4, P-2026-10-18-1420): a rule moved out of the root CLAUDE.md counts as
 * available when the first write under its path is denied with the name of its doc.
 * The map is docs/harness/rule-triggers.json, schema 1:
 *   { "schema": 1, "entries": [ { "glob", "docs": ["path[#heading fragment]"], "why" } ] }
 * and `npm run check:triggers` keeps it honest.
 *
 * On the first write of a session that falls under an entry's glob the hook answers
 * `deny`, naming the docs: read them, then retry the same write. The entry's glob is
 * recorded in os.tmpdir()/jjodel-rule-trigger-<session_id>.json, so the same entry is
 * allowed for the rest of that session; another entry, or another session, fires again.
 * Several entries matching one path fire together, in one denial. `deny`, not `ask`,
 * so that it holds under bypassPermissions too (RC-29).
 *
 * It FAILS OPEN, with no decision: missing or unparsable stdin, no session_id, no file
 * path, a missing or invalid map, an unwritable temp dir, any exception. A path outside
 * the repository or outside every glob is allowed and no marker is written.
 *
 * The repository is $CLAUDE_PROJECT_DIR, else the input's cwd. JJODEL_RULE_TRIGGERS
 * overrides the map path: it exists for the tests only.
 *
 * Globs: `**` as a whole segment matches any number of segments, `*` any run of
 * characters inside one segment, everything else is literal. check-triggers.ts
 * imports the same matcher.
 *
 * Run by: node "$CLAUDE_PROJECT_DIR/frontend/scripts/hooks/rule-trigger.mjs"
 */

import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { readInput, decide, runHook } from './lib.mjs';

export const MAP_PATH = 'docs/harness/rule-triggers.json';

/** A glob of the map as an anchored RegExp over a repo-relative, '/'-separated path. */
export function globToRegExp(glob) {
    const segments = glob.split('/');
    let source = '';
    segments.forEach((seg, i) => {
        const last = i === segments.length - 1;
        if (seg === '**') {
            source += last ? '.*' : '(?:[^/]*/)*';
            return;
        }
        source += seg
            .split('*')
            .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('[^/]*');
        if (!last) source += '/';
    });
    return new RegExp('^' + source + '$');
}

export function matchGlob(glob, path) {
    return globToRegExp(glob).test(path);
}

/** The map's entries, or null when the map is not schema 1. */
export function validEntries(map) {
    if (!map || typeof map !== 'object' || map.schema !== 1 || !Array.isArray(map.entries)) return null;
    for (const e of map.entries) {
        if (!e || typeof e !== 'object' || typeof e.glob !== 'string' || e.glob === '') return null;
        if (!Array.isArray(e.docs) || e.docs.length === 0 || !e.docs.every((d) => typeof d === 'string' && d !== '')) return null;
    }
    return map.entries;
}

/** The path relative to the repository, '/'-separated, or null when it lies outside. */
export function repoRelative(projectDir, target) {
    const rel = relative(projectDir, resolve(projectDir, target)).split('\\').join('/');
    if (rel === '' || rel === '..' || rel.startsWith('../') || isAbsolute(rel)) return null;
    return rel;
}

function markerPath(sessionId) {
    return join(tmpdir(), 'jjodel-rule-trigger-' + sessionId + '.json');
}

function readFired(file) {
    try {
        const value = JSON.parse(readFileSync(file, 'utf8'));
        return Array.isArray(value.fired) ? value.fired.filter((g) => typeof g === 'string') : [];
    } catch {
        return [];
    }
}

function main() {
    const input = readInput();
    if (!input || !input.tool_input) return;
    const sessionId = input.session_id;
    if (typeof sessionId !== 'string' || !/^[A-Za-z0-9_-]+$/.test(sessionId)) return;
    const target = input.tool_input.file_path || input.tool_input.notebook_path;
    if (typeof target !== 'string' || target === '') return;

    const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd;
    if (typeof projectDir !== 'string' || projectDir === '') return;
    const base = (() => {
        try {
            return realpathSync(projectDir);
        } catch {
            return projectDir;
        }
    })();
    const path = repoRelative(projectDir, target) ?? repoRelative(base, target);
    if (path === null) return;

    const mapFile = resolve(projectDir, process.env.JJODEL_RULE_TRIGGERS || MAP_PATH);
    let entries;
    try {
        entries = validEntries(JSON.parse(readFileSync(mapFile, 'utf8')));
    } catch {
        return;
    }
    if (!entries) return;

    const matching = entries.filter((e) => matchGlob(e.glob, path));
    if (matching.length === 0) return;

    const marker = markerPath(sessionId);
    const fired = readFired(marker);
    const fresh = matching.filter((e) => !fired.includes(e.glob));
    if (fresh.length === 0) return;

    try {
        writeFileSync(marker, JSON.stringify({ fired: [...fired, ...fresh.map((e) => e.glob)] }) + '\n');
    } catch {
        return; // no marker, no denial: it would fire on every retry
    }

    const lines = fresh.map((e) => '- ' + e.glob + ': ' + e.docs.join(', ') + (typeof e.why === 'string' && e.why ? ' (' + e.why + ')' : ''));
    decide(
        'deny',
        'rule-trigger: ' + path + ' falls under rules kept outside the root CLAUDE.md (' + MAP_PATH + '):\n' +
            lines.join('\n') +
            '\nRead ' + (fresh.length === 1 && fresh[0].docs.length === 1 ? 'that doc' : 'those docs') +
            ' now, then retry the same write. This fires once per session for each entry.',
    );
}

const isMain = (() => {
    try {
        return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
    } catch {
        return false;
    }
})();
if (isMain) runHook('rule-trigger', main);
