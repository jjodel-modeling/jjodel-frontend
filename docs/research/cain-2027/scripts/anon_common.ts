/**
 * anon_common.ts — the identifying strings of anonymization.md §1-2 and the commit-id test, shared by
 * build_replication.ts (which rewrites) and check_anonymity.ts (which verifies). P-2026-10-11-1725.
 *
 * Research material: this file names the strings it hides, so it stays in the repository and is never part of
 * replication/.
 */

import { createHmac, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { git } from './rq_common.ts';

export const KEY_FILE = join(homedir(), '.jjodel-cain-key');

/** The HMAC key: 32 random bytes in ~/.jjodel-cain-key, created when absent. Never printed. */
export function hmacKey(create: boolean): Buffer {
    if (!existsSync(KEY_FILE)) {
        if (!create) throw new Error(`${KEY_FILE} is absent`);
        writeFileSync(KEY_FILE, randomBytes(32), { mode: 0o600 });
        console.log(`created ${KEY_FILE} (32 random bytes, mode 600)`);
    }
    const k = readFileSync(KEY_FILE);
    if (k.length < 32) throw new Error(`${KEY_FILE} holds ${k.length} bytes, 32 expected`);
    return k;
}

/** HMAC-SHA256 of the full 40-hex commit id, first 12 hex characters. */
export const hmacSha = (key: Buffer, fullSha: string): string => createHmac('sha256', key).update(fullSha.toLowerCase()).digest('hex').slice(0, 12);

// ── commit ids ──────────────────────────────────────────────────────────────

/** Every commit id reachable from any ref of the repository, sorted, for prefix lookup. */
export function allCommits(): string[] {
    return git(['rev-list', '--all']).split('\n').filter(Boolean).sort();
}
/** The full ids that start with `prefix` (lowercase hex). */
export function commitsWithPrefix(sorted: string[], prefix: string): string[] {
    const p = prefix.toLowerCase();
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (sorted[mid] < p) lo = mid + 1;
        else hi = mid;
    }
    const out: string[] = [];
    for (let i = lo; i < sorted.length && sorted[i].startsWith(p); i++) out.push(sorted[i]);
    return out;
}
/** A token the check treats as a possible commit id: 7 to 12 or exactly 40 hex characters, standing alone. */
export const HEX_TOKEN = /(?<![0-9A-Za-z])(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{7,12})(?![0-9A-Za-z])/g;

// ── identifying strings (anonymization.md §1) ───────────────────────────────

/**
 * Searched case-insensitively as substrings, so they also match inside URLs and paths. `jj` covers every product
 * token (the project, its languages, the assistant's older name, file extension, worktree and lane paths, branches).
 */
export const IDENTIFYING: string[] = [
    // project, product and assistant
    'jj', 'jodie', 'windoww', 'mtool.io',
    // venue
    'cain',
    // organisation and hosting
    'mdegroup', 'github.com',
    // affiliation
    'univaq', 'fbk.eu', 'live.it', 'gmail.com', 'anthropic.com',
    // people: maintainer, co-maintainer, other authors, external handles
    'alfonso', 'pierantonio', 'apierantonio', 'jdirocco', 'juri', 'di rocco', 'damiano', 'di vincenzo', 'naraku',
    'giordano', 'tinella', 'perelli', 'belliato', 'riccardo', 'samfeidon', 'tmaog', 'jean-malm', 'rik1599',
    // chats and sessions
    'claude.ai/code',
    // paths
    '/users/', '~/', '/home/',
    // branches
    'frontend-jjtl', 'alfonso_dev', 'frontend-dev',
];
/** Case-sensitive, whole word: the lowercase word is ordinary English («metamodels», «models»). */
export const IDENTIFYING_CASE: RegExp[] = [/\bMODELS\b/, /models[ _-]?(demo|2026)/i];
/** Shapes rather than strings: e-mail addresses, session ids, UUIDs. */
export const IDENTIFYING_SHAPES: [string, RegExp][] = [
    ['e-mail address', /[\w.+-]+@[\w-]+\.[a-z]{2,}/i],
    ['claude.ai session id', /session_[0-9A-Za-z]{16,}/],
    ['uuid', /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i],
];
/** Italian function words and harness verbs: the register's language is a signal (anonymization.md §4 R2). */
export const ITALIAN = /\b(della|delle|dello|nella|nelle|degli|sono|corsia|corsie|procedi|decidi|ratifica|ratifiche|ratificat[aoie]|emenda|emendat[aoie]|emendamento|quando|perché|questo|questa|anche|ancora|solo il|non è)\b/i;

// ── covers (anonymization.md §2) ────────────────────────────────────────────

/** Ordered rewrites: longest and most specific first. Applied by build_replication.ts to every text cell. */
export const COVERS: [RegExp, string][] = [
    [/\/Users\/alfonso\/jjodel-release\b/g, '<RELEASE>'],
    [/\/Users\/alfonso\/jjodel-[wa]-[\w.-]+/g, '<WT>'],
    [/(~|\/Users\/alfonso)\/\.jjodel-lanes\b/g, '<LANES>'],
    [/\/Users\/alfonso\/jjodel\b/g, '<MAIN>'],
    [/~\/jjodel-[wa]-[\w.-]+/g, '<WT>'],
    [/~\/jjodel\b/g, '<MAIN>'],
    [/\/Users\/alfonso/g, '<HOME>'],
    [/frontend\/scripts\/lane-run\.mjs/g, 'harness/lane-runner.mjs'],
    [/frontend\/scripts\/auto-intake\.mjs/g, 'harness/intake.mjs'],
    [/frontend\/scripts\/auto-intake\.config\.json/g, 'harness/intake.config.json'],
    [/frontend\/scripts\/lane-tracking\.mjs/g, 'harness/lane-tracker.mjs'],
    [/frontend\/scripts\/lane-board\//g, 'harness/board/'],
    [/frontend\/scripts\//g, 'harness/'],
    [/frontend\/src\/[\w/.-]*useJjomSync\.ts/g, 'src/sync/useOmSync.ts'],
    [/\buseJjomSync\b/g, 'useOmSync'],
    [/\blane-run\.mjs\b/g, 'lane-runner.mjs'],
    [/\blane-run-script\b/g, 'lane-runner'],
    [/\blane-run\b/g, 'lane-runner'],
    [/\bauto-intake\b/g, 'intake bot'],
    // documents named in evidence: the type and the date stay, the slug (which may name the product) goes
    [/docs\/discovery\/discovery_(\d{4}-\d{2}-\d{2})_[\w.-]+\.md/g, 'discovery-report-$1'],
    [/docs\/prompts\/claude_(\d{4}-\d{2}-\d{2})_(\d{4})_prompt_[\w.-]+\.md/g, 'prompt-P-$1-$2'],
    [/docs\/ratifiche\/claude_ratifiche_(\d{4}-\d{2}-\d{2})_[\w.-]+\.md/g, 'ratification-memo-$1'],
    [/docs\/digest\/(\d{4}-\d{2}-\d{2})\.md/g, 'digest-$1'],
    [/docs\/sessioni\/[\w.-]+\.md/g, 'checkpoint'],
    [/docs\/log-inbox\/[\w.-]+\.md/g, 'log/inbox'],
    [/docs\/decisions\.md/g, 'rules/decisions.md'],
    [/docs\/PROTOCOL\.md/g, 'rules/PROTOCOL.md'],
    [/docs\/claude-code-log\.md/g, 'log/prompt-log.md'],
    [/docs\/log-inbox\//g, 'log/inbox/'],
    [/\balfonso-frontend-jjtl\b/g, 'trunk'],
    [/\balfonso[-_](frontend-)?dev\b/g, 'dev'],
    [/jjodel-modeling\/jjodel-frontend/gi, '<org>/<repo>'],
    [/jjodel-modeling\/jjodel-lanes/gi, '<org>/<lanes-repo>'],
    [/jjodel-modeling/gi, '<org>'],
    [/needs-alfonso/gi, 'needs-maintainer'],
    [/\bAlfonso'?s\b/g, "the maintainer's"],
    [/\bAlfonso\b/g, 'the maintainer'],
    [/\balfonso\b/g, 'maintainer'],
    [/\bJjEL\b/gi, 'EL'],
    [/\bJjTL\b/gi, 'TL'],
    [/\bJjScript\b/gi, 'SL'],
    [/\bJjOM\b/gi, 'OM'],
    [/\bJ?jodie\b/gi, 'the assistant'],
    [/\bJjodel\b/g, 'MTool'],
    [/\bjjodel\b/g, 'mtool'],
    [/\bMODELS demo\b/g, 'conference demo'],
    [/\bMODELS\b/g, '<CONF>'],
    [/alfonso/gi, 'maintainer'], // inside snake_case names, after every specific rule
];
export function cover(text: string): string {
    let t = text;
    for (const [re, to] of COVERS) t = t.replace(re, to);
    return t;
}

/** The hits of every identifying string, case-insensitive substring, case-sensitive word and shape, in one text. */
export function identifyingHits(text: string): string[] {
    const lower = text.toLowerCase();
    const out: string[] = [];
    for (const s of IDENTIFYING) if (lower.includes(s)) out.push(s);
    for (const re of IDENTIFYING_CASE) if (re.test(text)) out.push(String(re));
    for (const [name, re] of IDENTIFYING_SHAPES) if (re.test(text)) out.push(name);
    if (ITALIAN.test(text)) out.push(`italian: ${ITALIAN.exec(text)![0]}`);
    return out;
}
