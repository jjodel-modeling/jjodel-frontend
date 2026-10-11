/**
 * build_replication.ts — the anonymized replication package of the CAIN 2027 paper (P-2026-10-11-1725, item 7),
 * following anonymization.md §3. Writes one CSV per data CSV the paper uses into replication/; the README there
 * is written by hand and is not touched.
 *
 * Every cell goes through the same two passes: commit ids (7 to 12 or 40 hex characters that resolve to a commit
 * of the repository) become HMAC-SHA256 of the full id under the key in ~/.jjodel-cain-key, 12 hex characters;
 * identifying strings are rewritten with the covers of anonymization.md §2 (anon_common.ts). On top of that, per
 * column: author names become pseudonyms (M, C1, D1..D5, agent), the register's section headings become S01..,
 * and free-text columns that carry verbatim quotes or Italian are dropped. A column a policy does not name is
 * kept after the two passes; check_anonymity.ts is the gate on the result.
 *
 * The key is created (32 random bytes, mode 600) when absent, and is never printed.
 *
 * Run from the repository root: node --experimental-strip-types docs/research/cain-2027/scripts/build_replication.ts
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HEX_TOKEN, allCommits, commitsWithPrefix, cover, hmacKey, hmacSha } from './anon_common.ts';
import { DATA, RESEARCH, readCsv, writeCsv } from './rq_common.ts';

const OUT = join(RESEARCH, 'replication');
const key = hmacKey(true);
const commits = allCommits();

interface Policy {
    drop?: string[]; // free text with verbatim quotes, Italian or names
    sha?: string[]; // every hex token must resolve to a commit
    author?: string[];
    section?: string[];
    rename?: Record<string, string>;
}
/** The CSVs the paper uses and what each must lose (anonymization.md §3). */
const POLICIES: Record<string, Policy> = {
    'decisions.csv': {
        drop: ['header_at_intro', 'header_now', 'rc26_hand_note'],
        sha: ['intro_commit', 'trunk_commit', 'ratification_commit', 'amendment_commits'],
        author: ['intro_author'],
        section: ['section'],
        rename: { section: 'section_id' },
    },
    'conformance_daily.csv': { sha: ['trunk_commit'] },
    'conformance_failures.csv': { sha: ['first_commit', 'fixed_commit'], author: ['author'] },
    'rc18_daily.csv': {},
    'autonomy_weekly.csv': { rename: { alfonso: 'maintainer', alfonso_share_of_answered: 'maintainer_share_of_answered' } },
    'rules.csv': { drop: ['evidence'], sha: ['rule_commit', 'check_since_commit', 'rule_text_amendments'] },
    'violations_daily.csv': {},
    'comparison.csv': {},
    'rq1_check_position.csv': {},
    'rq2_judgment.csv': {},
    'rq3_detection_repair.csv': { sha: ['introduced_commit', 'repaired_commit'] },
    'rc26_reviewed.csv': {},
};

/** Commit authors at the dataset ref, in order of commit count (anonymization.md §2). */
const PSEUDONYM: Record<string, string> = {
    'Alfonso Pierantonio': 'M',
    'Juri Di Rocco': 'C1',
    jdirocco: 'C1',
    'Damiano Di Vincenzo': 'D1',
    GiordanoT: 'D2',
    'Giordano Tinella': 'D2',
    AndreaPerelli: 'D3',
    Andrea_Perelli: 'D3',
    'Riccardo Belliato': 'D4',
    samfeidon: 'D5',
    Claude: 'agent',
    'Claude (cloud)': 'agent',
};

/**
 * A register row key is its whole bold text, and some carry a qualifier in Italian after the id
 * (`R-D, emendamento a R-1 di E-obj`). Such a key becomes its id token plus `~n`, the same in every file.
 */
const rowKeyCover = new Map<string, string>();
{
    const seen = new Map<string, number>();
    for (const d of readCsv(join(DATA, 'decisions.csv'))) {
        if (d.id === d.id_token) continue;
        const n = (seen.get(d.id_token) ?? 0) + 1;
        seen.set(d.id_token, n);
        rowKeyCover.set(d.id, `${d.id_token}~${n}`);
    }
}
const ROW_KEY_COLUMNS = new Set(['id', 'item']);

const hmacCache = new Map<string, string>();
let hmacCount = 0;
/** Replace every commit id in a cell; `strict` fails on a hex token that resolves to no commit. */
function hmacText(text: string, strict: boolean, where: string): string {
    return text.replace(HEX_TOKEN, (tok) => {
        const full = commitsWithPrefix(commits, tok);
        if (full.length === 0) {
            if (strict) throw new Error(`${where}: «${tok}» resolves to no commit`);
            return tok;
        }
        if (full.length > 1) throw new Error(`${where}: «${tok}» is ambiguous (${full.length} commits)`);
        let h = hmacCache.get(full[0]);
        if (!h) {
            h = hmacSha(key, full[0]);
            hmacCache.set(full[0], h);
        }
        hmacCount++;
        return h;
    });
}

mkdirSync(OUT, { recursive: true });
const missing = Object.keys(POLICIES).filter((f) => !existsSync(join(DATA, f)));
if (missing.length) {
    console.error(`missing in data/: ${missing.join(', ')}`);
    process.exit(1);
}
for (const [file, pol] of Object.entries(POLICIES)) {
    const rows = readCsv(join(DATA, file));
    const header = Object.keys(rows[0] ?? {});
    if (header.length === 0) {
        console.error(`${file}: empty`);
        process.exit(1);
    }
    for (const c of [...(pol.drop ?? []), ...(pol.sha ?? []), ...(pol.author ?? []), ...(pol.section ?? [])]) {
        if (!header.includes(c)) {
            console.error(`${file}: policy names a column it does not have: ${c}`);
            process.exit(1);
        }
    }
    const kept = header.filter((h) => !(pol.drop ?? []).includes(h));
    // Sections become S01.. in the order the register first shows them (by line).
    const sectionIds = new Map<string, string>();
    for (const c of pol.section ?? []) {
        const order = [...rows].sort((a, b) => Number(a.line) - Number(b.line));
        for (const r of order) if (!sectionIds.has(r[c])) sectionIds.set(r[c], `S${String(sectionIds.size + 1).padStart(2, '0')}`);
    }
    const out = rows.map((r, i) =>
        kept.map((h) => {
            const v = r[h] ?? '';
            const where = `${file} row ${i + 2} ${h}`;
            if ((pol.author ?? []).includes(h)) {
                if (v === '') return '';
                const p = PSEUDONYM[v];
                if (!p) throw new Error(`${where}: author «${v}» has no pseudonym`);
                return p;
            }
            if ((pol.section ?? []).includes(h)) return sectionIds.get(v) ?? '';
            if (ROW_KEY_COLUMNS.has(h) && rowKeyCover.has(v)) return rowKeyCover.get(v)!;
            return cover(hmacText(v, (pol.sha ?? []).includes(h), where));
        }),
    );
    const outHeader = kept.map((h) => cover(pol.rename?.[h] ?? h));
    writeCsv(join(OUT, file), outHeader, out);
}
console.log(`commit ids replaced: ${hmacCount} occurrences of ${hmacCache.size} distinct commits`);
if (!existsSync(join(OUT, 'README.md'))) console.warn('warning: replication/README.md is not written yet');
else console.log(`README.md present (${readFileSync(join(OUT, 'README.md'), 'utf8').split('\n').length} lines), not touched`);
