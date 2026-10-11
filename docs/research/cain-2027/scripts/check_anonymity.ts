/**
 * check_anonymity.ts — the gate on replication/ (P-2026-10-11-1725, item 7). Reads every file of the folder and
 * reports, file by file and line by line:
 *   - every identifying string of anonymization.md §1 (anon_common.ts IDENTIFYING), case-insensitive, as a
 *     substring, so also inside URLs and paths; MODELS case-sensitively as a word; e-mail, session and UUID shapes;
 *   - Italian function words (the language signal of anonymization.md §4 R2);
 *   - every 40-hex or 7..12-hex token that is a prefix of a commit reachable from any ref of the repository.
 * Exit 0 with «0 hits» when clean, 1 otherwise. Before the scan, a positive control: the same functions run on
 * data/ (the non-anonymized dataset) must find hits of each kind, or the check is broken and exits 2.
 *
 * Run from the repository root: node --experimental-strip-types docs/research/cain-2027/scripts/check_anonymity.ts [--dir <dir>]
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { HEX_TOKEN, allCommits, commitsWithPrefix, identifyingHits } from './anon_common.ts';
import { DATA, REPO, RESEARCH } from './rq_common.ts';

const i = process.argv.indexOf('--dir');
const DIR = i >= 0 ? process.argv[i + 1] : join(RESEARCH, 'replication');
const commits = allCommits();

function filesUnder(dir: string): string[] {
    const out: string[] = [];
    for (const n of readdirSync(dir)) {
        const p = join(dir, n);
        if (statSync(p).isDirectory()) out.push(...filesUnder(p));
        else out.push(p);
    }
    return out.sort();
}
interface Hit {
    file: string;
    line: number;
    what: string;
}
function scan(dir: string): { files: number; lines: number; tokens: number; hits: Hit[] } {
    const hits: Hit[] = [];
    let lines = 0;
    let tokens = 0;
    const files = filesUnder(dir);
    for (const f of files) {
        const rel = relative(REPO, f);
        for (const h of identifyingHits(rel.slice(relative(REPO, dir).length))) hits.push({ file: rel, line: 0, what: `file name: ${h}` });
        readFileSync(f, 'utf8').split('\n').forEach((l, k) => {
            lines++;
            for (const h of identifyingHits(l)) hits.push({ file: rel, line: k + 1, what: h });
            for (const m of l.matchAll(HEX_TOKEN)) {
                tokens++;
                const c = commitsWithPrefix(commits, m[0]);
                if (c.length) hits.push({ file: rel, line: k + 1, what: `commit id ${m[0]} (${c.length} commit${c.length > 1 ? 's' : ''})` });
            }
        });
    }
    return { files: files.length, lines, tokens, hits };
}

// Positive control: on the raw dataset the check must see names, product tokens and commit ids.
const control = scan(DATA);
const kinds = (hs: Hit[]): Set<string> => new Set(hs.map((h) => (h.what.startsWith('commit id') ? 'commit id' : h.what.startsWith('italian') ? 'italian' : h.what)));
const ck = kinds(control.hits);
const needed = ['alfonso', 'jj', 'commit id', 'italian'];
const blind = needed.filter((k) => !ck.has(k));
console.log(`control on data/: ${control.files} files, ${control.hits.length} hits; kinds seen: ${needed.map((k) => `${k} ${ck.has(k) ? 'yes' : 'NO'}`).join(', ')}`);
if (blind.length) {
    console.error(`positive control failed: the check does not see ${blind.join(', ')} in data/`);
    process.exit(2);
}

const r = scan(DIR);
console.log(`scanned ${relative(REPO, DIR)}: ${r.files} files, ${r.lines} lines, ${r.tokens} hex tokens tested against ${commits.length} commits`);
for (const h of r.hits.slice(0, 200)) console.log(`HIT ${h.file}:${h.line} ${h.what}`);
console.log(`${r.hits.length} hits`);
process.exit(r.hits.length ? 1 : 0);
