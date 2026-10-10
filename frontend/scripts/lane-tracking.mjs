/**
 * lane-tracking.mjs: the front of a lane (docs/PROTOCOL.md P13, RC-44).
 *
 * Every prompt in docs/prompts/ names its front with a `Front: <slug>` header
 * line, the slug of a front of docs/harness/fronts.json. The rule lives here
 * once, for its two readers: check-docs.ts (Check E) imports it, and
 * `lane-run start` will in lane B, the second lane of the discovery
 * P-2026-10-10-1330, which also adds the GitHub projection of a lane here.
 *
 *   loadFronts(repoRoot)                        the fronts of the registry
 *   parseFrontLine(promptText)                  the slug of the header's `Front:` line
 *   frontProblem(promptText, promptId, fronts)  null, or why the prompt fails, in one line
 *
 * Pure: importing it reads nothing and writes nothing. Plain ES module,
 * nothing outside node:*, like lane-run.mjs beside it.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The lane that made the rule. Prompts with a lower Prompt-ID are never checked: earlier prompts are not amended (P13). */
export const FRONT_FROM = 'P-2026-10-10-1500';

export const FRONTS_FILE = 'docs/harness/fronts.json';

const PROMPT_ID = /^P-(\d{4}-\d{2}-\d{2})-\d{4}$/;

// Merge prompts rendered by lane-run are exempt, by the test lane-run.mjs start
// applies to the `Request:` line (RC-43): the `Lane: full (merge` line both
// templates of lane-templates/ render, so a launch by hand is exempt too.
const MERGE_LANE = /^Lane:\s*full \(merge\b/m;

/** The header: the lines before the first `## ` heading, as lane-run.mjs promptParts reads it. */
function headerOf(text) {
    const lines = text.split('\n');
    const first = lines.findIndex((l) => l.startsWith('## '));
    return (first === -1 ? lines : lines.slice(0, first)).join('\n');
}

/** The fronts of `<repoRoot>/docs/harness/fronts.json`. Throws, naming the file, when it cannot be read or has no fronts list. */
export function loadFronts(repoRoot) {
    let data;
    try {
        data = JSON.parse(readFileSync(join(repoRoot, FRONTS_FILE), 'utf8'));
    } catch (err) {
        throw new Error('cannot read ' + FRONTS_FILE + ': ' + (err instanceof Error ? err.message : String(err)));
    }
    if (!data || !Array.isArray(data.fronts)) throw new Error(FRONTS_FILE + ' has no "fronts" list');
    return data.fronts;
}

/** The value of the header's `Front:` line, trimmed; null when the header has none or it is empty. */
export function parseFrontLine(promptText) {
    const m = /^Front:(.*)$/m.exec(headerOf(promptText));
    const slug = m ? m[1].trim() : '';
    return slug || null;
}

/**
 * Why a prompt fails the front rule of P13, in one line; null when it passes.
 * A Prompt-ID below FRONT_FROM and a merge prompt pass unread. Otherwise the
 * header names a front of `fronts`, open, or closed on or after the day of the
 * prompt (a closed front fails only prompts dated after its closedOn).
 * `promptId` is the prompt's own, `fronts` the list loadFronts returns.
 */
export function frontProblem(promptText, promptId, fronts) {
    const id = PROMPT_ID.exec(promptId || '');
    if (!id) return 'not a Prompt-ID (P-YYYY-MM-DD-HHmm): ' + promptId;
    if (promptId < FRONT_FROM) return null;
    if (MERGE_LANE.test(headerOf(promptText))) return null;
    const slug = parseFrontLine(promptText);
    if (!slug) return 'no `Front:` line in the header: P13 asks for the slug of an open front of ' + FRONTS_FILE;
    const front = fronts.find((f) => f.slug === slug);
    if (!front) return 'unknown front "' + slug + '": not a slug of ' + FRONTS_FILE;
    if (front.state === 'open') return null;
    const date = id[1];
    if (front.state === 'closed') {
        if (front.closedOn && date <= front.closedOn) return null;
        return 'front "' + slug + '" closed on ' + (front.closedOn || '(no closedOn)') + ', and the prompt is dated ' + date;
    }
    return 'front "' + slug + '" has state "' + front.state + '", neither open nor closed';
}
