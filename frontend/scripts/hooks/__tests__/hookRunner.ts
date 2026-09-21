// Runs a hook script the way Claude Code does: a child process, the event as
// JSON on stdin, the decision read from stdout and the exit code (P11: the test
// executes the subject, not the function below it).
//
// Two environment switches, both for the checks around the suite and unused by it:
//   HOOKS_DIR  directory holding the scripts (the mutation bench points it at a mutated copy)
//   HOOK_NODE  the node binary that runs them (the node 16 to 26 matrix)

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export const HOOKS_DIR = process.env.HOOKS_DIR ? resolve(process.env.HOOKS_DIR) : resolve(HERE, '..');
/** frontend/scripts/hooks/__tests__ -> hooks -> scripts -> frontend -> repo root */
export const REPO = resolve(HERE, '..', '..', '..', '..');
const NODE = process.env.HOOK_NODE || process.execPath;

export interface HookResult {
    status: number | null;
    stdout: string;
    stderr: string;
    decision: string | null;
    reason: string;
}

export function runScript(script: string, payload: unknown): HookResult {
    const input = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const r = spawnSync(NODE, [resolve(HOOKS_DIR, script)], { input, encoding: 'utf8', timeout: 20000 });
    let decision: string | null = null;
    let reason = '';
    if (r.stdout.trim() !== '') {
        const out = JSON.parse(r.stdout);
        decision = out.hookSpecificOutput.permissionDecision;
        reason = out.hookSpecificOutput.permissionDecisionReason;
        if (out.hookSpecificOutput.hookEventName !== 'PreToolUse') throw new Error('wrong hookEventName: ' + r.stdout);
    }
    return { status: r.status, stdout: r.stdout, stderr: r.stderr, decision, reason };
}

// The field set a PreToolUse hook receives, as recorded by the H8 probe of the
// Phase 1 report (Appendix A, probe 2).
function envelope(cwd: string, toolName: string, toolInput: Record<string, unknown>) {
    return {
        session_id: '192661e4-96ad-4d6f-9ff9-f1bb79d74488',
        transcript_path: '/Users/alfonso/.claude/projects/-x/192661e4-96ad-4d6f-9ff9-f1bb79d74488.jsonl',
        cwd,
        prompt_id: '340b2f18-5c81-4e70-ab7f-7352a71eaead',
        permission_mode: 'acceptEdits',
        effort: { level: 'medium' },
        hook_event_name: 'PreToolUse',
        tool_name: toolName,
        tool_input: toolInput,
        tool_use_id: 'toolu_01L2ayKHKHBphV8czqgUKxEJ',
    };
}

export function bash(command: string, cwd: string = REPO) {
    return envelope(cwd, 'Bash', { command });
}

export function file(tool: 'Edit' | 'Write' | 'NotebookEdit', toolInput: Record<string, unknown>, cwd: string = REPO) {
    return envelope(cwd, tool, toolInput);
}
