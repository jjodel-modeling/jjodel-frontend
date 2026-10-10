# Discovery — lane tracking on GitHub Projects

Prompt-ID: P-2026-10-10-1330 · prompt `docs/prompts/claude_2026-10-10_1330_prompt_lane_tracking_github_discovery.md`
Session: 73fb55d8-8ff2-46be-ae09-4a34b975e482 · tree `~/jjodel-w-lanetrack`, branch `lane-tracking`, HEAD `4c52fefec`
Executor: Claude Opus 5.5 (`claude-opus-5-5`), as the session banner shows it. Phase 1, read-only, local and remote.

This report is a set of hypotheses with evidence, not a definitive reference (P4): whoever uses it downstream
rereads the real files. Tags: **measured** = a command run in this phase; **read** = a file read in this phase,
on `4c52fefec` unless stated; **knowledge** = GitHub behaviour not verifiable with today's token, to be measured.

## 0. Answer in brief

1. **Feasible, with a small seam and three corrections to the plan.** A new `frontend/scripts/lane-tracking.mjs`
   (name free: the global search finds it only in this prompt) is called from `start`, `resume`, `status <id>`,
   the chain supervisor and `go` on a direct merge, plus a new command `lane-run track <id> | --sync`: about seven
   call lines in `lane-run.mjs` (§5).
2. **No lane-run process is alive when a session exits.** A detached `/bin/sh` wrapper writes `exit.txt`
   (`lane-run.mjs:264-267`). In review, Done and the waiting labels can only be projected when `status <id>`,
   `wait` or the chain supervisor observes the exit, or by an extra wrapper line. Recommended: the observers,
   because the wrapper of an `--auto` lane has no GitHub credentials (RC-36, `lane-run.mjs:387-392`).
3. **Ready has no trigger today.** The chat commits prompts, not lane-run. Measured on 2026-10-10: 14 of 25 lanes
   started within 12 s of their prompt commit, 11 waited from 172 s to 7.4 h. A reconciler `track --sync` creates
   Ready cards and heals every fail-open miss.
4. **A card cannot live in `~/.jjodel-lanes/<Prompt-ID>/` before the lane starts.** Every `P-…` folder is a lane
   for `status --all` (`:777`), and `chain` and `merge` refuse an existing folder (`:1959`, `:1357`). Card state
   goes in `~/.jjodel-lanes/_tracking/<Prompt-ID>.json`.
5. **The Outcome line never says "visual check due".** 0 of 115 measured `hard-stop` lines carry a suffix, and the
   reminder every lane reads forbids one (`:254`). Recommended: every `hard-stop` goes to In review, with a label
   saying whether a Phase 2 GO or a visual GO is due.
6. **The board's derivation is not reusable.** `lane-board.mjs` starts its server at import (`:551-585`) and takes
   state and outcome from `lane-run status --all` anyway (`:104`). Its `kindOf` reads 26 of 26 session merges as
   `phase2`, and 203 of its 376 live rows have no kind (measured on `/api`). The projection uses lane-run's own
   `laneState`, `lastOutcome` and `headerStatus`.
7. **`check-docs.ts` parses no prompt.** Checks A to D are about the log, so Check E would be the first prompt
   gate. The only prompt-header parser in `gates/` is `trace-index.ts:118`, and it records misses, never fails.
   Cut-offs are `YYYY-MM-DD` constants (`log-tools.ts:10-20`). Recommended: a Prompt-ID cut-off. RC-43's date
   cut-off left 19 of 22 prompts of 2026-10-10 without `Request:`, most written before its 12:00 commit.
8. **"front" already means "log inbox"** in `lane-run go --front <inbox>` (`:49`, `:2161-2170`), `inboxFronts`
   (`:2104`) and HARNESS-DOCS §7 (`:469`). Recommended: no rename (rule 2), and P13 states the difference.
9. **GitHub is not ready.** The token has `gist, read:org, repo, workflow` and no `project` or `read:project`.
   `jjodel-modeling/jjodel-lanes` does not exist. Project 1 and its workflows could not be read
   (`INSUFFICIENT_SCOPES`; anonymous page 404). Alfonso is org admin, on the free plan, with private repos allowed.
10. **Fronts to seed:** `maintenance` (permanent), `codegen-pilot`, `simulator`, `standalone-editor` (Project 1),
    `graphvertex`, `release-3-2`, and `harness` as a second permanent front if Alfonso agrees (§4.6, question 18).

**Decisions awaiting Alfonso** (§8): A. grant the `project` scope on the Mac (`gh auth refresh -h github.com
-s project`, interactive); B. his yes for the P13 amendment, because `docs/PROTOCOL.md` is a governance file and its
merge needs `--governance-goahead`; C. the GitHub bootstrap (private repo, the "Jjodel lanes" Project, the
dedicated Projects, Status options, built-in workflows): outward-facing and partly UI-only (knowledge).

**Questions:** §9, 18, each with `Recommended:`. Prompt defects (§4.4): no `Depends:`, no `Request:`, wrong board path.

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | `lane-run.mjs` has one place per lifecycle event where a tracker can hook | **partly** | start, resume and the direct-merge closure are lane-run's own code paths; the exit is not (§4.1.3) |
| H2 | The GitHub projection can reuse the board's derivation | **falsified** | not importable; the state comes from lane-run itself; `kindOf` misreads merges (§4.2) |
| H3 | Checks A to D of `check-docs.ts` parse prompts | **falsified** | no check reads `docs/prompts/` (§4.3) |
| H4 | P13 and HARNESS-DOCS §4.1 list today's header | **falsified** | §4.1 and §7 lack `Request:` (RC-43) (§4.4) |
| H5 | The GitHub prerequisites are in place | **falsified** | no project scope, no repo, Project 1 unreadable (§4.5) |
| H6 | "front" is a new word in the harness | **falsified** | `go --front <inbox>` (§4.1.6) |
| H7 | The Outcome line tells a visual-check hard stop apart | **falsified** | 0 of 115 (§4.1.4) |
| H8 | A Ready card's state can sit in the lane folder | **falsified** | the folder is a lane by construction (§4.1.5) |

## 2. Goal and method

Goal: answer the six COSA points of the prompt with `file:line` and verbatim quotes, and propose the smallest seam,
without writing anything outside this report. Method: `lane-run.mjs` read whole (2297 lines, in five windows that
cover lines 1-2297); `lane-board.mjs` read whole (585 lines); `check-docs.ts` read whole (504 lines);
`log-tools.ts` lines 1-30; `trace-index.ts` lines 40-60 and 90-160; the P13, P16 and §4.1/§6/§7 texts; read-only
`gh` and `curl` calls; a survey of the 467 prompt headers of 2026-09-11..10-10 by a read-only subagent, spot-checked
(§4.6). Deviation, declared: rule 15 says a cited path that does not exist means stop. `frontend/scripts/board/`
does not exist (`ls`: `No such file or directory`). The prompt names the launchd agent `io.jjodel.lane-board`,
whose plist resolves without ambiguity to `.../frontend/scripts/lane-board/lane-board.mjs` (§4.2), and the phase is
read-only, so I read that path instead of stopping.

## 3. Files read (full paths)

- `/Users/alfonso/jjodel-w-lanetrack/CLAUDE.md`, `docs/PROTOCOL.md` (whole), `docs/HARNESS-DOCS.md` (§4.1, §6, §7)
- `docs/claude-code-log.md` (lines 1-140), `docs/log-inbox/harness.md` (lines 1-60 and headings), `docs/decisions.md`
  (RC-15, RC-17..RC-20, RC-25, RC-26, RC-42, RC-43, R-GEN-1; the id tally)
- `docs/prompts/claude_2026-10-10_1330_prompt_lane_tracking_github_discovery.md` and the headers of the window
- `frontend/scripts/lane-run.mjs`, `frontend/scripts/auto-intake.mjs` (lines 1-70, 286-330, tail)
- `frontend/scripts/lane-board/lane-board.mjs`, `README.md`; `timeline.js`, `insights.js` (grep only)
- `frontend/scripts/gates/check-docs.ts`, `log-tools.ts`, `trace-index.ts`; `frontend/scripts/tsconfig.json`;
  `frontend/tsconfig.json` (grep); `frontend/package.json` (scripts); `frontend/vitest.config.*` (grep)
- `frontend/scripts/lane-templates/merge-into-trunk.md`, `trunk-into-branch.md`, `issue-discovery.md` (headers)
- `frontend/scripts/hooks/__tests__/laneRun.test.ts` (lines 66-104), `hooks/bash-guard.mjs` and
  `.claude/settings.json` (grep)
- Outside the tree: `~/Library/LaunchAgents/io.jjodel.lane-board.plist`, the `pre-push` hook of the common git dir,
  the lane folders of `~/.jjodel-lanes/` (listing, logs scanned for `Outcome:`), `CHANGELOG.md` lines 9, 15, 66

## 4. Findings

### 4.1 `lane-run.mjs` (COSA 1)

**4.1.1 Where the header is read** (read). The header is the lines before the first `## `. Each field has its own
regex; no function returns the whole header:

- Prompt-ID: `:230` `const HEADER_PROMPT_ID = /^Prompt-ID: (P-\d{4}-\d{2}-\d{2}-\d{4})\s*$/;`, used by
  `headerPromptId` `:302-309`, called by `start` `:555` and `chain` `:1956`, and by `findLanePrompt` `:993`.
- Lane: only the first word, `:501` `const lane = (/^Lane:\s*([A-Za-z-]+)/m.exec(header) || [])[1] || '';`
  (tier rule), and the merge exemption `:565`
  `const unnamed = !request && !/^Request:[ \t]*\S/m.test(header) && !ctx.merge && !/^Lane:\s*full \(merge\b/m.test(header);`
- Status: `headerStatus` `:1088-1095` (`/^Status:\s*(.*)$/`), used at `:559` (`--auto`), `:725` (the flip warning);
  `closeDirect` has its own parse at `:2177-2179`.
- Request: presence only, `:565`, a warning at `:590`.

**4.1.2 Where a lane starts and resumes** (read).

- `start` `:546-618`. The folder is written at `:571-579`, then
  `:586` `launch(f, claude, worktree, promptFile, ['-p', ...FLAGS, ...(autoRun ? AUTO_FLAGS : []), ...(tier.model ? ['--model', tier.model] : [])], goAhead, autoRun);`
  The session id is written at `:598` / `:606`.
- `resume` `:632-663`, `:659` `launch(f, claude, worktree, message, ['-p', '--resume', session, ...FLAGS, ...])`.
- `go` `:1028-1048` resumes a session lane (`:1047`); on a direct merge it calls `closeDirect` `:1035`.
- `merge --launch` commits the prompt and calls `start` (`:1420-1426`). `merge --direct` calls `mergeDirect`
  `:1604-1641`, which starts the worker through the same `launch`:
  `:1637` `launch(f, process.execPath, o.top, '/dev/null', [SELF, 'direct-run', id]);`
- `chainRun` `:2010-2095` calls `start` for each lane (`:2047`).

**4.1.3 Where a lane exits** (read). No lane-run process is alive then. The wrapper is the only code that runs at
exit:

```
:264  const WRAPPER =
:265      'input="$1"; log="$2"; err="$3"; code="$4"; shift 4\n' +
:266      'nohup "$@" < "$input" >> "$log" 2>> "$err"\n' +
:267      'echo $? > "$code.tmp" && mv "$code.tmp" "$code"\n';
```

The exit is later observed by `status` (`laneState` `:688-698`), by `wait` (`:811-817`, which calls `status`), by
the chain supervisor (`:2053-2060`), and by the board through `status --all` (`:771-790`). The direct-run worker
writes `result.json` and a synthetic outcome itself (`:1864`, `:1871` `'Outcome: ' + res.outcome`). A direct
merge's closure appends `Outcome: done` to the log (`:2194-2195`).

**4.1.4 Where the final Outcome line is read** (read, measured).

- `:231` `const OUTCOME = /^Outcome:\s*(done|hard-stop|question|blocked)\b/;`
- `lastOutcome` `:666-678` returns the last assistant-text line that starts with `Outcome:`.
- `status` prints `unparsed: <line>` (`:712`); `statusAll` prints the word (`:781-782`); `chainRun` reads it at
  `:2057-2060`.
- The reminder appended to every input: `:254` «exactly one of those four words, nothing else on that line (RC-20)».
- Measured over every `log.jsonl` in `~/.jjodel-lanes/P-2026-*`, last Outcome line per lane:

| Last Outcome line | Lanes |
|---|---|
| `done` | 224, plus 6 more with a suffix |
| `hard-stop` | 112, plus 2 more with a sha suffix |
| `blocked` | 14 |
| `question` | 7, plus 1 more with a suffix |
| none | 10 |
| `completed` (unparsed) | 1 |

  No `hard-stop` line carries «(visual check due)», the form HARNESS-DOCS §7 draws. A projection cannot tell a
  Phase 1 hard stop from a visual one by the line alone.

**4.1.5 Layout of `~/.jjodel-lanes/`** (read, measured).

- `laneFiles` `:277-294`: `log.jsonl`, `stderr.log`, `session.txt`, `worktree.txt`, `pid.txt`, `started.txt`,
  `exit.txt`, `goahead.txt`, `prompt.txt`, `tier.txt`, `auto.json`, `request.md`.
- Also in a lane folder: `input-<n>.md` (`:354-362`), `msg-<n>.md` (`:621-630`), `stdin.md` (`:370-378`),
  `gh-empty/` (`:582`). A direct merge adds `direct.json` (`:1635`), `result.json` (`:1864`), `gate-*.log`
  (`:1750`), `vitest-*.json` and `merge-message.txt` (`:1794`).
- Beside the lane folders: `chain-<id>/` (`:1882-1885`), `pending/` (`:1354`), `_monitor/` (`:2240`), and the
  `auto/` and `board/` folders.
- Measured: 377 `P-…` folders dated 2026-09-26..10-10 (80 on the busiest day). 105 are direct merges, 28 are
  session merges (`Lane: full (merge…`), and 98 predate the input files.
- `statusAll` turns any `P-…` directory into a row: `:777`
  `const ids = existsSync(root) ? readdirSync(root).filter((n) => PROMPT_ID.test(n) && !chained.has(n) && statSync(join(root, n)).isDirectory()) : [];`
- `chain` refuses an existing folder at `:1959` and `merge` at `:1357`, both with
  `refuse(id + ' already has a lane folder in ' + lanesRoot())`.
- So a Ready card's state written to `~/.jjodel-lanes/<Prompt-ID>/` would show a phantom exited lane on the board
  and block a later `chain` or `merge` of that id. `_tracking/` passes every filter, as `_monitor/` does.

**4.1.6 "front" is taken** (read).

- `:49` `go <Prompt-ID> --smoke "<what the chat verified>" [--step <n>] [--front <inbox>]`
- `:2103-2106` `inboxFronts`, «a merge's entry goes to the branch's front»
- `:2162-2170`: `--front` names `docs/log-inbox/<name>.md`
- HARNESS-DOCS.md:469 `docs/log-inbox/<front>.md`, and PROTOCOL.md:423 «(`--front <name>` when it writes several)»

**4.1.7 Credentials** (read). `launch` strips them from the child of an `--auto` lane only:
`:388-392` `delete env.GH_TOKEN; delete env.GITHUB_TOKEN; env.GH_CONFIG_DIR = auto.ghConfigDir;`. lane-run's own
process keeps them. A tracker call inside lane-run is unaffected. A tracker line added to the wrapper would inherit
the stripped environment.

**4.1.8 The seam.** §5.

### 4.2 The lane board (COSA 2)

- **Path** (measured). The prompt cites `frontend/scripts/board/`, which does not exist. The board is
  `frontend/scripts/lane-board/` (`lane-board.mjs`, `timeline.js`, `insights.js`, `README.md`).
- **Deployment** (measured). The plist runs the release tree's copy:
  `<string>/Users/alfonso/jjodel-release/frontend/scripts/lane-board/lane-board.mjs</string>`, with
  `/opt/homebrew/bin/node` v23.3.0. `launchctl list` shows pid 79171. The README example points at
  `/Users/alfonso/jjodel/...` (`README.md:80`), and `~/.jjodel-lanes/board/` still holds an older copy.
- **What it derives** (read):
  - `:4-5`: «State, outcome and elapsed come from `lane-run status --all`; worktree, kind, chat, tier and phase come
    from the files in ~/.jjodel-lanes/<Prompt-ID>/»
  - `:104`: `spawnSync(process.execPath, [LANE_RUN, 'status', '--all'], ...)`
  - `header()` `:55-60` reads `Lane`, `Chat` and the title from `input-1.md`, not from the prompt file. A direct
    merge has no `input-1.md`: it is launched on `/dev/null`, `:1637` of lane-run.
  - `laneTimeline` `:212-248`: turns from `result` events; `Depends:` `:241`; `Request:` `:244`.
  - `launcherOf` `:311-324`: who launched the lane, from `git log --all --diff-filter=A -- docs/prompts/` (`:290`).
  - `kindOf` `:62-69`:

    ```
    if (/^merge/.test(l)) return 'merge';
    if (/^fast/.test(l)) return 'fast';
    if (/discovery/.test(l)) return 'discovery';
    if (/phase ?2|implementation|full/.test(l)) return 'phase2';
    ```

- **The `kindOf` misread** (measured on the live `GET http://127.0.0.1:4700/api`, 376 rows, `error ""`):
  - 26 session merges (`full (merge; …` and `full (merge of the trunk…`) are `phase2`. The merge templates write
    `Lane: full (merge; {{laneNote}})` (`merge-into-trunk.md:5`), so `^merge` never matches.
  - 203 rows have kind `""`: direct merges and lanes from before the input files.
  - Three `full (Phase 2, visual; …` rows read as `discovery`, and this discovery's own `full (more than three …`
    reads as `phase2`.
- **Reuse?** No, on three counts (read):
  - Importing `lane-board.mjs` starts a server: `createServer(...).listen(PORT, ...)` `:551-585`, the cache read at
    import `:163-165`.
  - The state the GitHub mapping needs (running, exited or blocked, the outcome) is not the board's own: it is
    lane-run's `laneState` (`:688-698`), consumed through `status --all`.
  - The one derivation the board adds that a card could show, `kindOf`, is the wrong one.

  GitHub is a projection of the lane folder and git, the same sources the board projects, so both read lane-run's
  state. The board stays read-only: `lane-board.mjs:2-3` «It never launches, resumes, merges or kills a lane and
  never writes in a worktree».

### 4.3 `check-docs.ts` (COSA 3)

- **No prompt is parsed today** (read):
  - `check-docs.ts:4` «Four independent checks». A is the format block (`:151-210`), B the log fields
    (`:247-315`), C the Notes cap (`:343-398`), D the entry count (`:412-447`).
  - `main` pushes exactly those four (`:479-482`). No path under `docs/prompts/` appears in the file.
  - So `Depends:` (RC-42) and `Request:` (RC-43) are enforced by no gate today. Only `lane-run start` warns on a
    missing `Request:` (`lane-run.mjs:590`).
  - Measured: since 2026-10-06, 18 of 25 non-merge prompts carry `Depends:`. On 2026-10-10, 3 of 22 carry
    `Request:`. The rule's commit `41f62884d` landed at 12:00:21, and 2 of the 3 non-merge prompts written after
    it carry the line (1243, 1253); this prompt (1330) does not.
- **How a cut-off is written** (read):
  - `log-tools.ts:10` `export const LINT_FROM_DATE = '2026-08-02';`, `:13` `NOTES_LINT_FROM_DATE = '2026-08-19'`,
    `:20` `TICKET_LINT_FROM_DATE = '2026-09-24'`.
  - Each is compared as a string to an entry's date: `check-docs.ts:278`
    `const inScope = active.filter((e) => e.date >= LINT_FROM_DATE);`
  - The one prompt-header parser in `gates/` uses the same form:
    `trace-index.ts:45` `export const TRACE_FROM = '2026-09-17';`, and `:138`
    `const dated = (id ? dateOf(id) : dateOf(basename(file))) >= TRACE_FROM && /^claude_\d{4}-\d{2}-\d{2}_\d{4}_/.test(basename(file));`.
    Its result is a list of «misses» (`:140-144`), never a failure.
- **Where Check E fits.** It would be a fifth function after Check D, pushed in `main` after `:482`, in the same
  `CheckOutcome` shape (`:76-82`).
  - Scope: prompt files `claude_YYYY-MM-DD_HHmm_*.md` whose header Prompt-ID is at or after the cut-off, merge
    prompts excluded (`_prompt_merge_`, `_take_trunk`, or `Lane: full (merge`, the test of `lane-run.mjs:565`).
  - It fails on a missing `Front:`, an unknown slug, or a closed front. It also checks `docs/harness/fronts.json`
    itself: unique slugs, the `state` vocabulary, a non-empty `exit`, `maintenance` present and open.
  - `check-docs.ts` has a test file, `frontend/scripts/gates/__tests__/checkDocs.test.ts`, in the vitest include
    (`vitest.config` line 16).
  - Sharing the rule with lane-run: `.ts` gates import only `.ts` today. The same grep over `gates/` returned
    nothing, while it returned `lane-run.mjs:219` as the control. The base config has `"allowJs": true`
    (`frontend/tsconfig.json:12`), extended by `scripts/tsconfig.json`, so a gate can import a pure `.mjs`.

### 4.4 P13, HARNESS-DOCS §4.1 and the other header parsers (COSA 4)

**Text to amend.**

- `docs/PROTOCOL.md:274-292`, the header bullets of P13: Lane `:274-277`, Depends `:278-284`, Request `:285-292`.
  A `Front:` bullet goes after `:292`, in the RC-43 form.
- `docs/PROTOCOL.md:423`: the `--front <name>` of the direct-merge closure needs one clause saying it names an
  inbox, not a front.
- `docs/HARNESS-DOCS.md:114-115`: «the header fields of P13 (`Prompt-ID`, `Chat`, `Lane`, `Depends`, `Status`)».
  This already lacks `Request` (RC-43).
- `docs/HARNESS-DOCS.md:121-125`, the template block. It has no `Request:` line; add `Request:` and `Front:`.
- `docs/HARNESS-DOCS.md:430`: «(Prompt-ID, Chat, Lane, Depends, Status: da eseguire; report path and name inside)».
  Same gap.
- `docs/HARNESS-DOCS.md:400`, the §6 row of `check:docs`: Check E is added.
- `HARNESS-DOCS.md` is one of the six Project Knowledge documents (P10, `PROTOCOL.md:148-150`), so the chat updates
  the KB copy too.
- `HARNESS-DOCS.md:48` says the KB's `contesto_progetto.md` already holds «fronti aperti e chiusi». That is a
  second list of fronts beside `fronts.json`.

**Proposed P13 bullet** (draft for Phase 2, not applied):

> - **Every prompt names its front.** The header of a prompt in `docs/prompts/` carries `Front: <slug>`, the slug
>   of an open front of `docs/harness/fronts.json` (`maintenance` for work outside every front). A front groups
>   lanes towards one exit criterion. It is not a log inbox: `lane-run go --front` names a file of
>   `docs/log-inbox/`. Merge prompts rendered by `lane-run` are exempt. The line is required from Prompt-ID
>   `P-…` on; earlier prompts are not amended. `lane-run start` refuses a prompt in scope whose front is missing,
>   unknown or closed, and `npm run check:docs` (Check E) fails on it. `lane-run` projects every lane onto the
>   board «Jjodel lanes» of `jjodel-modeling` and onto its front's own Project, failing open. Decided RC-44.

(RC-44 is the next free id: the highest `RC-` in `docs/decisions.md` is RC-43, measured.)

**Every parser of the prompt header under `frontend/scripts`** (measured: `command grep -rln` for `Prompt-ID:`,
`Lane:`, `Depends:`, `Request:`, `Status:` over `.ts/.mjs/.js`, tests excluded):

- `lane-run.mjs`: `:230` and `:302-309`, `:501`, `:565`, `:1088-1095`, `:2177-2179`, `:2081` (a `Prompt-ID:`
  line in merge output)
- `lane-board/lane-board.mjs`: `:55-60`, `:241`, `:244`. `timeline.js` and `insights.js` only display.
- `gates/trace-index.ts`: `parsePrompt` `:118-158` (`Prompt-ID`, `Chat`, `Lane`, `Status`)
- `auto-intake.mjs`: renders headers through `lane-templates/issue-discovery.md:3-8` and does not parse them. A
  second grep for header regexes and `headerStatus` in it returned nothing.

**Templates that render a header** (read):

- `merge-into-trunk.md:3-6` and `trunk-into-branch.md:3-6`: Prompt-ID, Chat, Lane, Status. No Depends, Request or
  Front, as the exemptions allow.
- `issue-discovery.md:3-8`: Prompt-ID, Chat, Request, Lane, Status. Needs a `Front:` (question 14).

**Defects of this prompt**, noted under P13 «the session says so» (read):

- No `Depends:` line, although the rule dates from 2026-10-06.
- No `Request:` line, although the rule dates from 2026-10-10.
- The path `frontend/scripts/board/` (§2).

### 4.5 GitHub, read-only (COSA 5)

All measured on 2026-10-10. No write was made.

- `gh --version`: `gh version 2.102.0 (2026-09-30)`, exit 0.
- `gh auth status`: «Logged in to github.com account apierantonio (keyring)», «Token scopes: 'gist', 'read:org',
  'repo', 'workflow'», exit 0. **No `project`, no `read:project`.**
- `gh project list --owner jjodel-modeling` and `gh project field-list 1 --owner jjodel-modeling`: «error: your
  authentication token is missing required scopes [read:project]», exit 1.
- A GraphQL query of `organization.projectsV2` returned `INSUFFICIENT_SCOPES` for every field. The exit status was
  masked by a pipe; the error body is unambiguous.
- `gh repo view jjodel-modeling/jjodel-lanes`: «Could not resolve to a Repository with the name
  'jjodel-modeling/jjodel-lanes'», exit 1. Positive control: `gh repo view jjodel-modeling/jjodel-frontend` returns
  `"visibility":"PUBLIC"`, exit 0.
- `gh repo list jjodel-modeling` lists six repos, all public: jjodel-frontend, jjodel-docs, jjodel-backend,
  jjodel-website, papers, jjodel-collaborative. **`jjodel-lanes` does not exist.**
- Anonymous `curl https://github.com/orgs/jjodel-modeling/projects/1` returns 404; the public repo page returns 200
  (control). So Project 1 is private or absent. **Its fields and built-in workflows could not be read.**
- `gh api user/memberships/orgs/jjodel-modeling`: `{"role":"admin","state":"active"}`.
- `gh api orgs/jjodel-modeling`: `plan free`, `members_can_create_private_repositories true`, `owned_private_repos 0`.
- No hook or deny rule mentions `gh`. Searches of `bash-guard.mjs` and `.claude/settings.json` were empty; controls:
  `push` 19 hits, `deny` 1.

**Knowledge, to measure once the scope is granted.** Not measured; the points Phase 2 must check first:

- A new Project's Status field has Todo, In Progress and Done. The Kanban template brings Backlog, Ready,
  In progress, In review and Done.
- The built-in workflows are set in the UI and only listed by the API: Item added, Item reopened, Item closed →
  Done, Pull request merged, Auto-add, Auto-archive, Auto-close.
- An issue can sit in several Projects, each with its own Status.
- Milestone is a built-in Project field and can be grouped by.
- `gh issue list --search` goes through the search index, which lags behind a fresh create.

### 4.6 Fronts open today (COSA 6)

**Survey** (measured). 467 prompt files dated 2026-09-11..10-10, all headers read. A positive control returns 434
`^Prompt-ID:` hits. No prompt has a `Front:` line; the search ran with that control. Spot-checked here:
R-GEN-1 (`decisions.md:5751-5754`), `CHANGELOG.md:9` `## [Unreleased]` and `:15` `#### Simulation`, `:66`
`## [3.0.0] - 2026-09-15`, the tags, and no prompt dated 10-07..10-09.

| Slug | Title | State | Evidence | Proposed exit (verifiable) | `project` |
|---|---|---|---|---|---|
| `maintenance` | Maintenance: fixes, tickets, small cleanups outside every front | open, permanent | the prompt's decision 3; 33 prompts in the window | none: permanent | — |
| `codegen-pilot` | Model-to-text generation pilot (R-GEN) | open | P-2026-10-10-0815..0950; R-GEN-1..15 (`decisions.md:5745-5815`). S1 and S3 merged; S2 and S4 done, not merged; S5 and S6 without prompts | the S1..S5 branches are ancestors of `alfonso-frontend-jjtl`, and S6 is merged or deferred to 3.2.x by a decision row (R-GEN-15, `:5814`) | dedicated, number unknown |
| `simulator` | Simulation engine and simulator UI (R-SIM) | open | 189 prompts; R-SIM-1..143, the last R-SIM-143 of 2026-10-06 (`:2691`); `CHANGELOG.md:15` | a decision row closes the front once the 3.2 tag carries the CHANGELOG Simulation section and the open simulator tickets are fixed or moved to `maintenance` | dedicated, number unknown |
| `standalone-editor` | Stand-alone editor: Configurator, environments, Data Manager UX (#157, #158, #166..#168) | open | staging prompts 09-23_1200, 09-24_1400, 10-01_2240 and 2344; the #157/#158 discoveries | `gh issue view N --json state` is CLOSED for 157, 158, 166, 167, 168 | 1 («StandAlone Editor», not verified) |
| `graphvertex` | graphVertex containment: BPMN pools and lanes, nested-object vertices (R-GV) | open | P-2026-10-10-0105 and its GO files, 0830, 1155, 1156. R-GV-1..14 exist only on branch `ir-graphvertex` | the slice branches are merged, R-GV-1..14 are in the trunk's `decisions.md`, and the bpmn-lanes probe is green on the trunk | — |
| `release-3-2` | Release 3.2 for the MDE course: freeze 2026-10-23, live 2026-10-26 | open | R-GEN-1 (`:5751-5754`); `CHANGELOG.md:9` `[Unreleased]` | `git tag -l 3.2.0` is non-empty and `CHANGELOG.md` has `## [3.2.0]` | — |
| `harness` | Lane harness: lane-run, gates, board, GitHub tracking | open, permanent (proposed) | 63 prompts in the window; the `harness` inbox has 16 headings, 10-03..10-10 | none: permanent (question 18) | — |

**Closed or dormant**, seeded as `closed` only if history is wanted; past lanes are not back-filled anyway:

- `release-3-0`: tag `3.0.0`.
- `dark-theme-removal`: merged under P-2026-10-10-1059.
- `default-view-parity`.
- `validation-reintegration`: merged 2026-09-19.
- `models-demo`: frozen under RC-31.
- `symbol-editor`, `views` and `jjscript`: no lane since 10-03..10-05; their tickets go to `maintenance`.
- `auto-intake`: shadow mode (RC-40); whether "live mode" is a front is Alfonso's call.

**Inbox names as slugs?** Not one to one. `codegen`, `codegen-jjel` and `codegen-stc` feed one front; `harness`,
`merge-gate` and `smoke-baseurl` feed another; six inboxes are empty; five exist only on unmerged branches. This is
why `fronts.json` should carry no inbox mapping (question 12).

**Proposed shape of `docs/harness/fronts.json`.** The prompt's five fields plus two dates, so a front can close
without turning old prompts red (§6, R6):

```json
{ "v": 1, "fronts": [
  { "slug": "maintenance", "title": "Maintenance", "exit": "none: a permanent front", "state": "open", "openedOn": "2026-10-10" },
  { "slug": "standalone-editor", "title": "Stand-alone editor", "exit": "...", "state": "open", "openedOn": "2026-10-10", "project": 1 }
] }
```

`closedOn` (YYYY-MM-DD) is added when `state` turns `closed`; slugs are never renamed or reused.

## 5. Proposed seam and mapping (for Phase 2, nothing applied)

**Module.** `frontend/scripts/lane-tracking.mjs`: plain ES module, nothing outside `node:*`, like `lane-run.mjs`
(`:203`). Exports:

1. `readFronts(repoRoot)` and `frontProblem(header, fronts, promptId)`: pure, imported by `check-docs.ts` (Check E,
   through `allowJs`) and by `lane-run start`.
2. `desiredCard(lane)`: pure, maps the lane state to the card (table below). Unit-tested and mutation-benched
   without `gh`.
3. `track(id, event)`: never throws. It reads `~/.jjodel-lanes/_tracking/<id>.json`, calls `gh` only when the
   desired card differs from the recorded one, and writes the result or `lastError` back. A `mkdir` lock
   `_tracking/<id>.lock` serialises concurrent callers (the chat's `wait`, the chain supervisor, `start`).
4. `sync(repoRoot)`: the reconciler.
   - It reads `git log --all --diff-filter=A --name-only -- docs/prompts/`, the board's query (`lane-board.mjs:290`).
   - It creates Ready cards for in-scope prompts at `Status: da eseguire` that have no lane folder.
   - It re-projects every lane whose card is stale.

The `gh` wrapper follows `auto-intake.mjs:302-312` (`gh(args)`: argv only, the first stderr line as the error). Its
override is a variable of its own (`LANE_TRACK_GH`). `auto-intake.mjs` is not imported: its fallback
`/opt/homebrew/bin/gh` (`:297`) would reach the real `gh` from a test lab.

**Call sites in `lane-run.mjs`** (about seven lines):

- the import, beside `:219`
- `start`: the front refusal beside the header refusals `:556-559`, and `track(id, 'start')` after `launch` `:586`
- `resume`: `track(id, 'resume')` after `:659`
- `status <id>`: `track(id, 'observe')` after `laneState` `:708`, single id only, so `status --all` and the board
  never write
- `chainRun`: `track(lane.id, 'observe')` after `:2060`
- `closeDirect`: `track(id, 'closure')` after `:2195`
- `main`: `track <Prompt-ID> | --sync` beside `:2283`

`wait` is covered through `status` (`:815`). The rejected alternative is a fourth wrapper line after `:267`. It is
the same size, but it inherits the stripped environment of `--auto` lanes (§4.1.7) and is shell, which no test
reaches today.

**Card.**

- An issue in `jjodel-modeling/jjodel-lanes`, titled `<Prompt-ID> · <title>`.
- The body holds the Prompt-ID, title, `Lane:` line, front, branch, worktree name and the `Request:` URL, which is
  already committed in the prompt. It never holds the words of the request (RC-43 keeps them out of every commit)
  or the prompt body.
- The front is a milestone of `jjodel-lanes` (question 5). The issue is added to the board «Jjodel lanes» and, when
  `fronts.json` names a `project`, to that Project too. Status is set in each.
- The idempotency key is the Prompt-ID. `_tracking/<id>.json` is the primary record. A fallback lookup lists issues
  (GraphQL `repository.issues`, ordered by creation) rather than searching, because the search index lags
  (knowledge).

**Mapping** (decision 5 of the prompt, with the two gaps §4.1.4 and §4.1.5 filled):

| Lane state (lane-run's own derivation) | Status | Label | Issue |
|---|---|---|---|
| prompt committed in scope, `Status: da eseguire`, no lane folder (`sync`) | Ready | — | open |
| `start`, `resume`, `go` on a session lane (`state: running`) | In progress | none (stale labels removed) | open |
| exited, `hard-stop`; the last turn wrote a discovery report and no code commit | In review | `waiting:phase-2` | open |
| exited, `hard-stop` otherwise (visual check due); a direct merge with gates green | In review | `waiting:visual` | open |
| exited, `question` | In progress | `waiting:question` | open |
| exited, `blocked`; or `state: blocked` (past the limit) | In progress | `blocked` | open |
| exited, no Outcome line or an unparsed one | In progress | `outcome:unparsed` | open |
| exited, `done`, prompt Status still `da eseguire` (the warning of `lane-run.mjs:722-727`) | In progress | `closure-owed` | open |
| exited, `done`, prompt Status `eseguito …` | Done | — | closed |

Merge prompts get no card (question 4). `lane-run status <id>` prints one more line, `card: <url>` or
`card: failed (<reason>)`, so a fail-open miss is visible in the line the chat already reads.

**Enable switch.** Tracking runs only when `~/.jjodel-lanes/_tracking/config.json` exists. It holds the owner, the
repo and the board's Project number, plus the cached field and option ids. The test labs run with a temp `HOME`
and `PATH=${bin}:/usr/bin:/bin` (`laneRun.test.ts:85-90`), so they are inert by construction, merge workers
included: those run the whole vitest suite (`lane-run.mjs:1431`).

**Phase 2 shape** (the files, above five, so rule 19 applies). Two lanes, with the bootstrap in parallel:

- **Lane A (docs and gate):** `docs/harness/fronts.json` (new), `check-docs.ts` (Check E) with `checkDocs.test.ts`,
  `PROTOCOL.md` P13 (governance), `HARNESS-DOCS.md` §4.1, §6 and §7, the RC-44 row, and its inbox entry.
- **Lane B (lane-run):** `lane-tracking.mjs` (new) with its test, `lane-run.mjs` (the seam), `laneRun.test.ts`, and
  `lane-templates/issue-discovery.md` with its render in `auto-intake.mjs` (`Front:`).
- **Bootstrap by Alfonso:** §8.

## 6. Dependencies and risks

- **R1 duplicates.** Two lane-run processes can track the same lane at once (the chat's `wait`, the chain
  supervisor, `start`). The lock and the index file are needed; the search fallback alone is not, because of index
  lag.
- **R2 fail-open misses go unseen.** Hence the `card:` line in `status` and `sync` as the healer.
- **R3 tests reaching GitHub.** Avoided by the HOME-side switch and a `gh` override. Never copy the
  `/opt/homebrew/bin` fallback into a path the tests reach.
- **R4 latency inside `status` and `wait`.** The chat's shell call ends near 180 s (`WAIT_MAX_S`, `lane-run.mjs:241`).
  `gh` is called only on a state change, each call has a timeout, and failures stay open.
- **R5 Check E blocking unrelated merges.**
  - `check:docs` is a merge gate (`GATES`, `lane-run.mjs:1431`). A prompt committed without `Front:` would turn
    every later merge into the trunk `blocked`.
  - So `start` refuses such a prompt first, and Check E is the backstop.
  - The cut-off is a Prompt-ID, so prompts written earlier on the day of the rule stay out (§4.3, the RC-43 measure).
- **R6 closing a front turns old prompts red.** Hence `closedOn`: a closed front fails only prompts dated after it.
- **R7 renaming a slug turns old prompts red.** Slugs are immutable; a rename is a new slug plus closing the old one.
- **R8 two lists of fronts.** The KB's `contesto_progetto.md` holds «fronti aperti e chiusi» (HARNESS-DOCS.md:48).
  `fronts.json` is the one Check E reads; the KB should cite it rather than keep its own list.
- **R9 RC-18.** Both Phase 2 lanes are harness-only and count against the weekly budget of one harness lane in four.
  The chat measures it before launching.
- **R10 identity and exposure.** Issues are written as `apierantonio` with his keyring token, in a private repo.
  Request words and prompt bodies stay out of the card.
- **R11 volume.** 377 lane folders in 15 days, 133 of them merges (measured). A card per merge would add about a
  third of noise; hence question 4.
- **R12 UI-only setup** (knowledge). Status options and built-in workflows are set by hand. «Item closed → Done»
  in each Project makes closing the issue enough for Done everywhere.
- **R13 governance.** The P13 bullet is a change to `docs/PROTOCOL.md`. `merge --launch` and `--direct` refuse it
  without `--governance-goahead` (P16, `PROTOCOL.md:412-419`).
- **R14 stale board copies.** The board runs from `~/jjodel-release` on node v23.3.0. Lane B does not touch it, but
  the README's plist example and `~/.jjodel-lanes/board/` are out of date (§4.2).
- **R15 overnight lag.** A lane that ends unattended shows In progress until the next `status`, `wait` or `sync`.
  The chat's `wait` loop covers attended and `/lane auto` runs; a launchd timer for `sync` is optional.

## 7. Decisions taken (unattended)

None. This lane is read-only and only recommends; the chat adopts or not under RC-21 and RC-25.

## 8. Decisions awaiting Alfonso

- **A. The `project` scope.** `gh auth refresh -h github.com -s project`, an interactive device flow on his
  credential. Nothing on GitHub Projects can be read or written before it.
- **B. His yes for the P13 amendment.** `docs/PROTOCOL.md` is a governance file (`lane-run.mjs:238`); lane A's merge
  needs `--governance-goahead` (RC-26, P16).
- **C. The GitHub bootstrap, which he runs or approves:**
  - Create the private repo `jjodel-modeling/jjodel-lanes`.
  - Create the org Project «Jjodel lanes» from the Kanban template.
  - Create the codegen and simulator Projects, or confirm their numbers.
  - Check Project 1's Status options.
  - Enable «Item closed → Done» in each Project.
  - Create the milestones of the seeded fronts.

  These are outward-facing writes, and some are UI-only (knowledge).

## 9. Questions

1. Exit seam: observers (`status <id>`, `wait`, chain supervisor) or a wrapper line?
   Recommended: the observers, plus `track --sync`; no wrapper change (§4.1.7).
2. Ready trigger: who runs `track --sync`?
   Recommended: the chat right after committing a prompt it does not launch at once; `start` creates a missing card itself.
3. Discovery hard stop: which column?
   Recommended: In review with `waiting:phase-2`, a visual one with `waiting:visual`.
4. Merge lanes: a card of their own?
   Recommended: no; merge prompts are exempt from `Front:` as from Depends and Request.
5. The front on GitHub: a milestone or a single-select field?
   Recommended: a milestone of `jjodel-lanes` per front, its state mirroring `fronts.json`, the boards grouped by Milestone.
6. The waiting reason: labels or a Project field?
   Recommended: repo labels (`waiting:*`, `blocked`, `outcome:unparsed`, `closure-owed`), one write every Project shows.
7. Where does card state live?
   Recommended: `~/.jjodel-lanes/_tracking/<Prompt-ID>.json` with a `mkdir` lock, and a `card:` line in `lane-run status`.
8. The cut-off's form?
   Recommended: a Prompt-ID constant, `FRONT_FROM`, set to the Prompt-ID of lane A.
9. Closed fronts versus old prompts?
   Recommended: `openedOn` and `closedOn` in `fronts.json`; a closed front fails only prompts dated after `closedOn`.
10. Where is the front enforced first?
    Recommended: `lane-run start` refuses a prompt in scope with a missing, unknown or closed front; Check E is the backstop.
11. One rule for two readers?
    Recommended: `frontProblem` in `lane-tracking.mjs`, imported by `check-docs.ts` through `allowJs`.
12. The `--front` collision?
    Recommended: keep `go --front <inbox>` (rule 2), no inbox mapping in `fronts.json`, one clause in P13 and at `PROTOCOL.md:423`.
13. The enable switch?
    Recommended: `~/.jjodel-lanes/_tracking/config.json` present, plus `LANE_TRACK_GH` for tests.
14. The front of auto-intake lanes?
    Recommended: `Front: maintenance`, rendered by `issue-discovery.md` from `auto-intake.config.json`.
15. Phase 2 split?
    Recommended: lane A (registry, Check E, P13 and HARNESS-DOCS text), then lane B (`lane-tracking.mjs`, the seam, tests); the bootstrap in parallel.
16. Card body?
    Recommended: Prompt-ID, title, Lane, front, branch, worktree name, Request URL; never request words or the prompt body.
17. The board's `kindOf` misread: fix it in lane B?
    Recommended: no; a fast lane of its own, since the board is not in this scope.
18. A second permanent front `harness` beside `maintenance`?
    Recommended: yes, so 63 harness prompts in 30 days do not flood `maintenance`.
