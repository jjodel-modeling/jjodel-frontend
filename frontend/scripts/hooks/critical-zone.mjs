/**
 * critical-zone.mjs: PreToolUse hook on Edit|Write|NotebookEdit.
 *
 * CLAUDE.md 3.2 makes a Layer Impact Report mandatory before any diff that
 * touches one of six files or a D-layer write path. Nothing the hook can read
 * proves the report exists (the transcript lags: discovery report P-2026-09-21-1620,
 * H2, probe 7), so the hook does not try: it answers `ask` with the 3.2 reason
 * and the human confirms that the report was written in chat. No state, no
 * marker file. It FAILS OPEN like every hook here; it never denies.
 *
 * The matcher is the 3.2 trigger, not the 3.1 table: 3.1 also lists authoring/,
 * ir/, problems/, DV.tsx and defaultViewTemplate.ts, which fired on the S6 lane
 * and on 42 commits since 2026-09-01 (the 3.2 files: 2).
 *
 * D-layer write paths, read the way a file tool can see them:
 *   - DVertex.new, DVoidEdge.new2 and DVoidEdge.new3 (the creators of rule 12) in
 *     the old or new text of an edit to a non-test source file under frontend/src;
 *   - SetFieldAction in an edit to a file of the sync layer directory.
 * The constants below are compared with CLAUDE.md 3.2 by the test of this hook,
 * so the two cannot drift apart silently.
 *
 * Run by: node "$CLAUDE_PROJECT_DIR/frontend/scripts/hooks/critical-zone.mjs"
 */

import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename } from 'node:path';
import { readInput, decide, runHook } from './lib.mjs';

/** The six files of CLAUDE.md 3.2, repo-relative. */
export const CRITICAL_FILES = [
    'frontend/src/components/editor-v2/hooks/useJjomSync.ts',
    'frontend/src/components/editor-v2/sync/syncState.ts',
    'frontend/src/components/editor-v2/sync/canvasToJjom.ts',
    'frontend/src/components/editor-v2/utils/portDistribution.ts',
    'frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts',
    'frontend/src/redux/VersionFixer.tsx',
];

/** The D-layer creators. 3.2 lists two of them; rule 12 names the third. */
export const D_LAYER_CREATORS = ['DVertex.new', 'DVoidEdge.new2', 'DVoidEdge.new3'];

/** "SetFieldAction near sync": the sync layer directory. */
export const SYNC_DIR = 'frontend/src/components/editor-v2/sync/';
export const SYNC_TOKEN = 'SetFieldAction';

const SOURCE_ROOT = 'frontend/src/';
const SOURCE_EXTENSION = /\.(ts|tsx|js|jsx|mjs)$/;
const TEST_FILE = /(^|\/)__tests__\/|\.test\.[jt]sx?$/;

function tokenPattern(token) {
    return new RegExp('(?<!\\w)' + token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\w)');
}

/** null when the edit is outside the 3.2 trigger, else what makes it one. */
export function evaluate(toolInput) {
    const target = toolInput.file_path || toolInput.notebook_path;
    if (typeof target !== 'string' || target === '') return null;
    const path = target.split('\\').join('/');

    for (const file of CRITICAL_FILES) {
        if (path.endsWith('/' + file)) return basename(file);
    }

    const at = path.lastIndexOf('/' + SOURCE_ROOT);
    if (at === -1 || !SOURCE_EXTENSION.test(path) || TEST_FILE.test(path)) return null;

    const text = [toolInput.old_string, toolInput.new_string, toolInput.content, toolInput.new_source]
        .filter((s) => typeof s === 'string')
        .join('\n');
    for (const token of D_LAYER_CREATORS) {
        if (tokenPattern(token).test(text)) return 'a D-layer creator (' + token + ')';
    }
    if (path.slice(at + 1).startsWith(SYNC_DIR) && tokenPattern(SYNC_TOKEN).test(text)) {
        return SYNC_TOKEN + ' in the sync layer';
    }
    return null;
}

function main() {
    const input = readInput();
    if (!input || !input.tool_input) return;
    const what = evaluate(input.tool_input);
    if (what === null) return;
    decide(
        'ask',
        'critical-zone: ' + what + ' is a Layer Impact Report trigger (CLAUDE.md 3.2, docs/PROTOCOL.md P5). ' +
            'The report goes in chat before the diff. Approve only if it was written for this edit.',
    );
}

const isMain = (() => {
    try {
        return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
    } catch {
        return false;
    }
})();
if (isMain) runHook('critical-zone', main);
