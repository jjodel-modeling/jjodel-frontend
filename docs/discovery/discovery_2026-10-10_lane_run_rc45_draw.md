# Discovery: lane-run draws the tier of eligible lanes (RC-45)

Prompt-ID: P-2026-10-10-1757 · prompt `docs/prompts/claude_2026-10-10_1757_prompt_lane_run_rc45_draw.md` ·
session 2e911042-baae-48c1-b852-401d21f8c211 · tree `~/jjodel-w-rc45draw`, branch `lane-run-rc45-draw`, HEAD
`6ca224b68` · executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`).

This report is a set of hypotheses with evidence, not a reference: whoever uses it downstream re-reads the files.

## 0. Answer in brief

- **Where the draw goes.** One point decides the tier today: `chooseTier` (`frontend/scripts/lane-run.mjs:549`),
  called by `start` (`:588`) and by `chain` at validation (`:2011`); `merge --launch` reaches it through `start` with
  `ctx.merge` (`:1467`), which `tierRule` forces heavy (`:533`). The auto-intake path is `start --auto`, whose prompts
  declare `Lane: discovery` (`frontend/scripts/auto-intake.config.json:9`), never eligible. The draw goes beside
  `chooseTier`, and the ledger is written in `start` only after every refusal has passed (`:588` to `:610`).
- **Eligibility, measured on 408 prompts since 2026-09-26:** 38 would be eligible (`Lane: fast`, DOVE writes outside
  `docs/`, not forced heavy); 299 are `Lane: full`. At that pace the 40 draws end before 2026-11-08.
- **One adjustment to the design (question 1).** `promptParts` reads DOVE only from a `## DOVE` heading (`:500`). The
  chat's two newest prompts, P-2026-10-10-1756 and this one, write it as an inline `DOVE:` line, which reads as "no
  DOVE": P-2026-10-10-1756 ran `light ...: --tier light (the rule: in doubt: Lane: fast, no DOVE)` (its tier.txt).
  Read without that adjustment, every prompt written in that form escapes the draw. Measured: reading inline DOVE
  paragraphs when there is no `## DOVE` changes one prompt of the 408, P-2026-10-10-1756, from "no DOVE" to eligible,
  and no tier of the RC-32 rule.
- **Existing draws win over eligibility.** A ledger entry or a `tier drawn (RC-45): heavy|light` Lane line is used
  as is, even on a prompt the rule would not draw (P-2026-10-10-1756 is one); a header the ledger contradicts is
  refused, naming both. A header draw absent from the ledger is recorded there, marked as not drawn by lane-run, so
  the count of 40 stays true (question 2).
- **The draw happens at start, also in a chain (question 3).** `chain` validates every lane (and refuses `--tier` on
  an eligible one) but does not draw: the start of each lane draws, so a lane the chain never reaches takes no slot.
- **No test hook.** Both outcomes are reached by starting fresh Prompt-IDs until both appear (bounded, failure
  2^-29). No environment variable can force a draw. The ledger lives in the lanes folder, `~/.jjodel-lanes/`, which
  follows `HOME`, so the tests (HOME in a temp dir) never reach the real ledger.
- **Dry runs (WHAT 8).** `start` has no dry path (`--dry-run` exists for `track` only, `:2342`). They run `start`
  with `HOME=/tmp/p1757/home` (the lanes folder and the ledger copy follow it) and a fake `claude` on PATH that prints
  one session event: no Claude session is launched.
- **Board.** `drawn` comes from the Lane line only (`lane-board.mjs:644`); next: ledger, `tier.txt`, Lane line.

Decisions awaiting Alfonso: none. Questions, each answered by its recommendation under RC-21 (unattended):

1. Read an inline `DOVE:` paragraph when the prompt has no `## DOVE` section, for the rule and the draw alike?
   Recommended: yes; one reader, `## DOVE` first, so no existing prompt changes tier.
2. A Lane-line draw absent from the ledger: record it, refuse, or honour silently?
   Recommended: honour it and record it in the ledger with `by` saying it came from the Lane line.
3. In a chain, draw at validation or at each lane's start?
   Recommended: at each lane's start; validation only refuses.
4. `--tier` equal to an existing draw: accept or refuse?
   Recommended: accept (RC-45's hand draws launch with the matching `--tier`); a different one is refused.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Every launch path reaches the tier through `chooseTier`, so one hook point covers start, chain, merge --launch and --auto. | Holds (read, §3.1). |
| H2 | The eligibility of the prompt can be decided from the header and DOVE alone, as `tierRule` does. | Partly: the strict DOVE reader misses the inline form the chat now writes (measured, §3.3). |
| H3 | The tests can draw without a hook that forces the outcome. | Holds: the lab gives each run its own HOME (read, `laneRun.test.ts:85-91`); both outcomes by repetition. |
| H4 | The board can tell a drawn lane today. | Partly: only from the Lane line (read, `lane-board.mjs:643-644`); a draw in the ledger or `tier.txt` is invisible. |
| H5 | No existing test pins a tier that the draw would change. | Falsified: the RC-32 table holds `fast, code` → heavy and `--tier light` on it (read, `laneRun.test.ts:1353`, `:1387`). |

## 2. Files read

- `frontend/scripts/lane-run.mjs` (whole tier section `:490-571`, `start` `:573-657`, `parseMerge`/`merge`
  `:1344-1468`, `chain`/`chainRun` `:1960-2138`, header `:1-230`, `main` `:2456-2483`)
- `frontend/scripts/hooks/__tests__/laneRun.test.ts` (lab `:1-145`, tier tests `:1330-1461`; test names listed whole)
- `frontend/scripts/lane-board/lane-board.mjs` (`:1-60`, `:120-145`, `:600-730`), `frontend/scripts/lane-board/insights.js`
  (`:1-20`, `:230-260`, `:390-400`), `frontend/scripts/lane-board/README.md` (whole)
- `frontend/scripts/lane-tracking.mjs` (`withLock` `:336-382`, `isDiscoveryPrompt` `:142-150`, exports)
- `frontend/scripts/auto-intake.mjs` (start invocation, grep), `frontend/scripts/auto-intake.config.json`
- `docs/decisions.md` RC-16, RC-32, RC-45; `docs/PROTOCOL.md` P1-P6, P9, P13-P16
- `docs/discovery/discovery_2026-10-10_lane_board_model_insights.md` §6.3, §6.5, addendum
- `docs/prompts/claude_2026-10-10_1756_prompt_jjel_lexer_own_keys.md` (header, DOVE line)
- `~/.jjodel-lanes/rc45-draws.jsonl` (read only), `~/.jjodel-lanes/P-2026-10-10-1756/tier.txt`

## 3. Findings

### 3.1 The tier today (read, HEAD `6ca224b68`)

- `lane-run.mjs:526` `function tierRule(text, ctx) {` forces heavy on the go-ahead, a merge, the governance go-ahead,
  a critical-zone name, a governance file in DOVE, `Lane: full`, a discovery writing outside docs; gives light to
  `fast`/`discovery` whose DOVE writes docs only (`:541`); otherwise `tier: 'heavy', forced: false, reason: 'in doubt: …'`.
- `lane-run.mjs:554` `if (requested === 'heavy') t = { tier: 'heavy', reason: '--tier heavy' };` and `:556`
  `if (rule.forced) refuse('--tier light refused: the rule forces heavy (' …`: `--tier` overrides any rule that does
  not force.
- `lane-run.mjs:559` `} else if (rule.tier === 'light' && !light) t = { tier: 'heavy', reason: 'no light model set (' …`:
  today a light rule falls back to heavy silently when no light model is set. WHAT 4 forbids this for a draw only.
- `lane-run.mjs:588` `const tier = chooseTier(text, { ...ctx, goahead: Boolean(goAhead) }, tierOption(rest));` runs
  before the request, front, session and running refusals (`:589-610`); `:617`
  `writeFileSync(f.tier, tier.line + '\n');` comes after them. The ledger append belongs at `:617`, not at `:588`.
- `lane-run.mjs:2011` `const tier = chooseTier(readFileSync(file, 'utf8'), {}, o.tier);` (chain validation, no
  go-ahead, no prompt file); `:2078` the commit of an out-of-tree prompt writes `'; lane tier ' + lane.tier + ' (' +
  lane.tierReason + ')'`; `:2088` `code = await start(c.worktree, promptFile, [...(c.tier ? ['--tier', c.tier] : []) …`.
- `lane-run.mjs:1361` `refuse('--tier ' + o.tier + ': a merge session runs heavy (RC-32)')` and `:1467`
  `return start(o.top, file, [], { merge: true, …})`: a merge never carries `--tier light` and is forced heavy.
- `auto-intake.config.json:9` `"laneByMode": { "shadow": "discovery", "live": "discovery" },`: automatic lanes are
  never `Lane: fast`, so never eligible.
- Absence, with controls: `grep -n -E 'rc45|draws\.jsonl'` over `lane-run.mjs`, `lane-board.mjs`, `insights.js` exits
  1 (no reader or writer of the ledger exists); the same tool finds `tier` 13 times in `lane-board.mjs` (exit 0).
  `grep -n -E 'randomInt|node:crypto' lane-run.mjs` exits 1. `grep -n dry lane-run.mjs` finds `--dry-run` only in
  `track` (`:2342`): `start` has no dry path.

### 3.2 The ledger and the drawn lane (read)

- `~/.jjodel-lanes/rc45-draws.jsonl`, one line: `{"promptId": "P-2026-10-10-1756", "tier": "light", "at":
  "2026-10-10T17:52:42+0200", "by": "chat C-2026-10-10-1512, secrets.choice, before the prompt was written", "n": 1}`.
  `at` is local time with a `+HHMM` offset.
- P-2026-10-10-1756 header: `Lane: fast (two lookups in one lexer file, with tests; outside the critical zone; tier
  drawn (RC-45): light)`; its DOVE is a line inside `## WHAT`: `DOVE: \`frontend/src/jjel/lexer/lexer.ts\`, …` (`:37`).
- `~/.jjodel-lanes/P-2026-10-10-1756/tier.txt`: `light (claude-sonnet-5-5): --tier light (the rule: in doubt: Lane:
  fast, no DOVE)`. The lane exists and was started with an explicit `--tier light`.

### 3.3 DOVE as the chat writes it (measured, `/tmp/p1757/measure.mjs` over `docs/prompts/` at `6ca224b68`)

- `lane-run.mjs:500` `const s = lines.findIndex((l) => /^## DOVE\b/.test(l));`: the only DOVE form read.
- 330 prompt files hold a `## DOVE` heading. Inline forms (`grep -n -E '^(\*\*)?DOVE'`): `**DOVE**:` 16 lines,
  `**DOVE.**` and `DOVE.` (2026-07 to 2026-09-18), `DOVE:` in 2026-09-17_1024, 2026-10-10_1756, 2026-10-10_1757.
- Over the 408 prompts since 2026-09-26 the rule-plus-eligibility table, `## DOVE` only: `lane full` 299,
  `ELIGIBLE` 38, `lane Phase` 23, `lane discovery` 16, `no DOVE` 11, `governance` 11, `docs only` 3, `DOVE no path` 2,
  `lane harness` 2, `critical` 1, `lane two-phase` 1, `lane light-weight` 1. With inline paragraphs read when there
  is no `## DOVE`: the same, but `no DOVE` 10 and `ELIGIBLE` 39; the one prompt that changes is P-2026-10-10-1756.
  No prompt moves into or out of the docs-only light rule, so no tier of RC-32 changes.

### 3.4 The tests (read)

- `laneRun.test.ts:85-91` the lab sets `HOME: home` (a temp dir), so `~/.jjodel-lanes` and any ledger under it are
  per test. `:1336` `tierPrompt` writes a `## DOVE` section; `:1353`
  `['fast, code', tierPrompt('fast (one file)', '\`frontend/src/a.ts\`'), [], 'heavy', 'in doubt']` is eligible under
  RC-45, and `:1387` `startTier(TIER_CASES[4][1], ['--tier', 'light'])` would now be refused. These two read RC-32 as
  it applies outside the draw: they keep their meaning with the clock past the window (`LANE_RUN_NOW`, `:221`
  of the header comment, `clock()` at `:1117`).
- `laneRunDirect.test.ts:886` chains a `Lane: fast` lane whose DOVE is docs only: not eligible, unchanged.

### 3.5 The board (read)

- `lane-board.mjs:643-644` `// RC-45: a lane whose tier was drawn at random says so in its Lane line …` and
  `const dm = /tier drawn \(RC-45\)\s*:?\s*(heavy|light)?/i.exec(h.lane);`; `:682` `drawn: dm ? (dm[1] || tier || '')
  .toLowerCase() || null : null`.
- `lane-board.mjs:28` `const ROOT = process.env.JJODEL_LANES || join(homedir(), '.jjodel-lanes');`: the ledger is
  `ROOT/rc45-draws.jsonl`.
- `insights.js:245` `const drawn = code.filter((l) => l.drawn);` counts what the server marks; `:250` the empty text
  says the chat writes the Lane line from 2026-10-11, no longer true.
- A `tier.txt` reading `not drawn (RC-45): …` contains the substring `drawn (RC-45)`: the board's reading of `tier.txt`
  must be anchored after the `<tier> (<model>): ` prefix.

## 4. The design, adjusted

1. **One DOVE reader.** `promptParts` keeps `## DOVE` first; without it, it reads the inline `DOVE:`/`DOVE.` paragraphs
   (bold or not), each up to the next blank line or heading. Used by the rule and by eligibility.
2. **Eligible** when the rule does not force heavy (this covers the go-ahead, the merge, the critical zone,
   governance and `Lane: full`), the Lane word is `fast`, DOVE names a path outside `docs/`, and the window is open:
   fewer than 40 ledger entries and the local date (`clock()`, so `LANE_RUN_NOW`) not after 2026-11-08.
3. **An existing draw** (the ledger's first entry for the Prompt-ID, else the Lane line) is used whatever the
   eligibility; header and ledger disagreeing, a Lane line that names no tier, or a light draw where the rule forces
   heavy, are refused. A Lane-line draw absent from the ledger is appended with
   `by: "lane-run: recorded from the Lane line, not drawn here"`.
4. **The draw**: `crypto.randomInt(2)` over `['heavy', 'light']`, under an mkdir lock beside the ledger that re-reads
   it (the Prompt-ID and the window) before appending `{promptId, tier, at, by: "lane-run", n}`, `n` the count after
   the append. In `start` it runs after every refusal, just before the lane folder is written. `tier.txt`:
   `<tier> (<model>): drawn (RC-45), <n>/40`, the same line for a reused draw (its `n`).
5. **Light with no light model** (drawn, reused or from the header): refused after the draw is recorded, so a retry
   cannot redraw.
6. **Flags.** `--tier` on an eligible lane with no draw: refused, naming RC-45 and `--no-draw "<reason>"`. `--tier`
   on a drawn lane: accepted when equal, refused otherwise. `--no-draw "<reason>"`: on an eligible lane, no draw,
   `tier.txt` gets `; not drawn (RC-45): <reason>` after today's reason; on a drawn lane, refused; on a lane that is
   not eligible, nothing to skip. An empty reason is refused. Every start prints one `draw:` line saying which case.
7. **Chain**: validation runs the same checks per lane (with `--tier`/`--no-draw` of the chain); the draw happens at
   each lane's start; `--no-draw` passes to every start; the commit of an out-of-tree eligible prompt says its tier
   is drawn at start.
8. **Board**: ledger, then `tier.txt` (`/^(heavy|light) \([^)]*\): drawn \(RC-45\)/`), then the Lane line;
   `/api/insights` keeps `drawn: "heavy"|"light"|null`. `insights.js` empty text and README updated.

## 5. Risks

- **The real ledger.** Every writer resolves it under `homedir()`; the tests and dry runs set `HOME` to a temp dir.
  A test that forgot `HOME` would write the real one: every `laneRun` call of the suite spreads `l.env` (`:97`).
- **Concurrent starts.** Two lanes started in the same second would both count 39 and both write `n` 40 without the
  lock; the lock is a directory, broken when older than 30 s (the `withLock` pattern of `lane-tracking.mjs:346`).
- **A hand-edited ledger that does not parse** blocks every non-merge start, naming the file and the line: fail
  closed, because the count and the reuse depend on it.
- **False positives that force heavy** (a governance path DOVE says not to touch, as in this prompt) remove a lane
  from the draw; they never put a forced lane into it.
- **The MODELS demo exclusion** of RC-45 cannot be read from a prompt: it is the chat's `--no-draw "<reason>"`.

## 6. Questions

The four questions are in §0 with their `Recommended:` lines; none is outside the lane's perimeter.
