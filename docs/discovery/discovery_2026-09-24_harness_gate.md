# Discovery — harness gate: inbox lint, ticket type, stale baseline, false-green guard, model pin

Prompt-ID: `P-2026-09-24-1630` · Phase 1, read-only · 2026-09-24
Session: `43250cb2-5a9b-4939-bf79-fcd398c6d9a0` (the harness scratchpad path; the session itself is
named `[P-2026-09-24-1520]`, the simulation lane's ID, while the message and the prompt file both carry
1630: acted on 1630, noted here)
Executor: Anthropic Claude Sonnet 5 (`claude-sonnet-5`), as the session banner shows it, through the
gitignored `.claude/settings.local.json` of this worktree. `.claude/settings.json` pins `claude-opus-5`.
First data point of the ablation; correction rounds so far: 0.
Worktree: `/Users/alfonso/jjodel-gate`, branch `harness-gate`, HEAD `08e6c05a6` on the trunk at `94a72edba`.

This report is a set of hypotheses with evidence, not a reference: whoever uses it downstream re-reads the
real files (P4).

## 0. Hypotheses the discovery falsifies

| # | Hypothesis carried into the lane | Verdict |
|---|---|---|
| H1 | The gate ticket has three parts, all in the log | **Two parts in the log ticket**; the third ("entries folded that are older than the fortieth") is only in the session checkpoints, one line, no definition (§1.3). |
| H2 | Committed verification scripts contain `+= await` | **False. Zero hits on every branch, and never committed.** The offender is a gitignored `_tmp_*` probe (§4). |
| H3 | RC-16 and prompt `P-2026-09-23-0718` exist somewhere | **False on all 33 refs** (local heads, remote-tracking heads, tags) (§4). |
| H4 | The typecheck baseline is 33 | **False: 14 on this branch**, casing errors 0 (§3). |
| H5 | Check B would need work to be green on the waiting inbox entries | **False: the 4 real entries waiting today pass B and C** (§1.4), so lint-on-inbox lands green. |

Two of my own first searches were invalid and are reported because §5 of `CLAUDE.md` asks for it:
`git grep -E '\+=\s*await'` returned nothing because `\s` and `\b` are not POSIX ERE on this Mac's git;
its positive control (the ticket line itself, in `docs/log-inbox/simulation.md`) came back empty, which is
what exposed it. Every count below was re-run with `[[:space:]]` and a control that found the known line.

## 1. Item 1 — the gate ticket

### 1.1 Ticket text, verbatim

`docs/claude-code-log.md:96`, entry `## 2026-09-21 — docs: Check B green after the fold, register language of
three decisions, HARNESS-DOCS 1.3 (P-2026-09-21-1420)`:

> **Ticket** (opened, not implemented here). Inboxes (`docs/log-inbox/*.md`) are outside Check B: an entry that
> fails the gate is invisible until the fold moves it into the active log, and the fold then turns the whole gate
> red (measured 2026-09-21: seven entries, ten errors, all written 2026-09-19). Either `check-docs.ts` lints the
> inbox files with the same rules as the active log, or `rotate-log.ts` refuses to fold an entry that would fail
> Check B. A ticket of the same family, not to be blocked by this one: the log has no ticket type, and two ticket
> blocks written as `## date — ticket` headings were read by the gate as task entries.

The third part comes from the session checkpoints, not from the log: `docs/sessioni/sessione_2026-09-23.md:126-127`
(same words in `sessione_2026-09-21_2.md:124-125`):

> 4. Lane sul gate (ticket del 21/9): inbox dentro Check B, tipo "ticket" nel log, entry ripiegate
>    più vecchie della quarantesima.

and `sessione_2026-09-23.md:177-178`: "la lane sul gate (inbox dentro Check B, tipo "ticket" nel log, entry
ripiegate più vecchie della quarantesima; può assorbire il refresh di HARNESS-DOCS su riga 374 e §4.5)".
No file defines "entries folded older than the fortieth". **My reading, to be confirmed (Q1):** an inbox entry
that `fold` places by date beyond position 40 is moved by `rotate` straight into the archive, which Check B never
reads (`check-docs.ts:271` reads `LOG_MD` only).

### 1.2 The parts as rules a check can test, and the behaviour today

Evidence tree: a scratch copy of `CLAUDE.md`, `docs/PROTOCOL.md`, the two log files and `frontend/scripts/gates/*.ts`
under the session scratchpad (the gates derive `REPO` from their own location, `check-docs.ts:35`), so nothing in
the worktree was written. The scripts run are the committed ones.

**R1 — inbox in Check B.** Every entry of every `docs/log-inbox/*.md` dated on or after 2026-08-02 passes the
Check B rules (Corregge, Causa) and the Check C cap (Notes, 500); a failure makes `check:docs` exit 1 and names
`docs/log-inbox/<lane>.md:<line>`. Alternative in the ticket, **R1b**: `rotate-log.ts --fold` refuses (exit 1,
writes nothing) when an entry to fold would fail the same rules.

Today, control 1: an inbox entry with `Corregge` absent and `Causa: (c) with an annotation`:

```
exit=0
    lane "probe" (docs/log-inbox/probe.md) has 1 entry(ies) waiting to be folded — mid-batch is a normal state
  PASS  A — entry-format block identity (CLAUDE.md §21.2 vs docs/PROTOCOL.md P9)
  PASS  B — prompt log fields (entries dated >= 2026-08-02)
  PASS  C — Notes length <= 500 chars (entries dated >= 2026-08-19)
  PASS  D — active log entry count (threshold 40)
  4/4 check(s) passed, 1 warning(s)
```

`check-docs.ts` only counts inbox entries (`:538-545`, warning); `rotate-log.ts` has no lint on the fold path
(`:124-140`). The first run on the real tree, `npm run check:docs`, is 4/4, exit 0, two inbox warnings
(`default-view-parity`, `simulation`).

**R2 — ticket type.** An entry whose heading type is `ticket` is judged by a ticket field set, not by P9's, and
a ticket carries no `Corregge`/`Causa`; a `**Ticket** (` paragraph inside a task entry is unaffected.

Today, control 2: `## 2026-09-25 — ticket: ...` with a `**Ticket** (` paragraph, added to the active log:

```
exit=1
    ERROR  required field missing   field: **Corregge**  found: (field absent)
    ERROR  required field missing   field: **Causa**     found: (field absent)
    ERROR  active log has 41 entries, over the threshold of 40
  FAIL  B — prompt log fields (entries dated >= 2026-08-02)
  FAIL  D — active log entry count (threshold 40)
```

That is what the ticket says. Two ticket headings already sit in the active log (`docs/claude-code-log.md:234`
`ticket extension:` and `:245` `ticket:`), patched to green with sentinel `Corregge`/`Causa` by the 1420 lane, and
they occupy 2 of the 40 slots. `.claude/skills/log-entry/SKILL.md:19` (rule 4) already forbids the heading form and
prescribes a paragraph: the practice exists, the type does not. 12 `**Ticket**` paragraphs live in the active log
and the inboxes today, the longest 1069 characters; none is in the archive yet.

**R3 — fold beyond the fortieth (my reading).** An inbox entry is linted before the fold whatever position the
fold gives it, so that no entry reaches the archive unlinted; and the run output names every folded entry that
`rotate` sends straight to the archive.

Today, control 3, `fold()` then `rotate(keep=40)` from the committed `log-tools.ts`, on the real active log
(first entry 2026-09-21, 40th 2026-09-17) with a probe inbox entry dated 2026-09-10 and invalid fields:

```
after fold: 41 entries; the probe entry sits at position 41
after rotate(keep=40): moved 1:
  -> archive: ## 2026-09-10 — fix: an inbox entry older than the fortieth, with Corregge absent
probe entry in the active log after the run: false (Check B reads the active log only)
```

The invalid entry is folded and archived with exit 0 and no lint anywhere. `insertByDate` (`log-tools.ts:96-106`)
puts it last; `rotate` (`:54-77`) moves by position and only warns when a moved entry is *newer* than a kept one.

### 1.3 Design of the ticket entry type (proposal)

Heading, same shape as every entry, type word `ticket`:

```
## 2026-09-24 — ticket: the 1850 harness printed ALL GREEN over failures
**Ticket**: `failures += await e2e.run(...)` reads `failures` before the await and writes the sum after it, so increments made during the await are overwritten; the module also returned 0. One run printed ALL GREEN over 2 FAIL lines. The file is a gitignored `_tmp_*` probe.
**Priority**: high
**Found in**: P-2026-09-24-1005
**Detail**: docs/discovery/discovery_2026-09-24_harness_gate.md
```

- Fields: `Ticket` (non-empty), `Priority` (`high` | `medium` | `low`), `Found in` (`P-YYYY-MM-DD-HHmm`, or
  `C-...` for a chat ID) required; `Detail` (a path, optional). Four lines at most, against the 12 of P9. No
  `Corregge`, `Causa`, `Regressions`, `Out-of-scope changes`, `Layer Impact Report`, `Smoke visivo`,
  `Prompt document name`: they measure a task, and a ticket is not one. No status field: the log is add-only
  (`CLAUDE.md` §21), so a status could not be flipped; closure is read from the closing lane's entry, as today.
- Recognition in Check B: the heading matches `^## <date>( <hh:mm>)? — ticket: `. The colon form only, so the
  legacy `ticket extension:` heading stays a task entry. A from-date constant, `TICKET_LINT_FROM_DATE`
  (2026-09-24), because the legacy heading at `:245` matches `ticket:` and has no `Priority`/`Found in`: without it
  the gate would turn red on a past entry (no back-filling, as for `NOTES_LINT_FROM_DATE`, `check-docs.ts:54`).
  `parseEntries` reads `**Ticket**:` as a field only with the colon; the existing `**Ticket** (` paragraph does
  not match `FIELD_LINE` (`check-docs.ts:239`) and stays inert.
- Rotation (P13, RC-12): a ticket is an entry like any other. It counts toward the 40, rotates by position,
  verbatim. Proposed addition: the `MOVE` line of `rotate-log.ts` marks a ticket (`MOVE [ticket] ## ...`), so the
  exclusive lane sees which tickets leave the active log. **Cost, stated:** one slot per ticket. The 1005 lane
  wrote 4 and the 1455 lane 5 as paragraphs inside their entries, at no slot cost (Q2).
- Inbox entries of this type are linted by the same function as R1.

### 1.4 The current waiting population passes

The 4 real entries in `default-view-parity.md` (2) and `simulation.md` (2), folded into a scratch log with the
committed `fold()` and judged by the committed `check-docs.ts`: A, B, C pass; D fails at 44 only because the
rotation has not run. So enabling R1 does not turn any gate red today.

## 2. Item 2 — typecheck baseline (measured, this branch)

`npm run typecheck` from `frontend/` through the temporary symlink: **exit 2, 14 errors**, TS1261 0, TS1149 0.
Complete output captured (32 lines, the 14 `error TS` lines plus continuations); count taken with the exit
status recorded.

| # | File:line | Code |
|---|---|---|
| 1 | `src/api/data.ts:868:22` | TS2304 `DDataType` |
| 2 | `src/api/data.ts:868:34` | TS2304 `DDataType` |
| 3 | `src/api/data.ts:1126:44` | TS2322 |
| 4 | `src/common/Dummy.ts:46:17` | TS2307 `vite/dist/node/chunks/moduleRunnerTransport` |
| 5 | `src/components/editor-v2/EditorV2.tsx:3114:86` | TS2339 `model` on `never` |
| 6 | `src/components/forEndUser/Measurable.tsx:271:86` | TS2552 `jquievent` |
| 7 | `.../Measurable.tsx:287:21` | TS7053 |
| 8 | `.../Measurable.tsx:289:32` | TS7053 |
| 9 | `.../Measurable.tsx:292:40` | TS7053 |
| 10 | `.../Measurable.tsx:298:79` | TS2345 |
| 11 | `.../Measurable.tsx:302:36` | TS7053 |
| 12 | `src/components/Jodie/ChatMessages.tsx:271:13` | TS2322 |
| 13 | `src/components/project/ProjectEditor.tsx:226:67` | TS2769 |
| 14 | `src/pages/components/Dashboard.tsx:586:66` | TS2339 `activeId` |

The grouping in `CLAUDE.md:606` (`data.ts` ×3, `Measurable.tsx` ×6, `Dummy.ts`, `EditorV2.tsx`, `ChatMessages.tsx`,
`ProjectEditor.tsx`, `Dashboard.tsx` = 14) matches file for file. Four cited line numbers have moved:
`EditorV2.tsx` 2886 → 3114, `ChatMessages.tsx` 246 → 271, `ProjectEditor.tsx` 220 → 226, `Dashboard.tsx` 570 → 586.
`npm run typecheck:scripts` (the gates and the smoke scripts): exit 0.

**Where 33 is still written** (control: `CLAUDE.md:606` found by the same search): `CLAUDE.md:606` and its generated
copy `AGENTS.md:595`; `docs/HARNESS-DOCS.md:376` ("33 su macOS, 14 su Linux, ed è lo stesso numero"), now false on macOS
worktrees; `frontend/scripts/tsconfig.json:6` (a comment); `docs/decisions.md:16` (RC-3, 2026-08-05, historical, leave).

**Why the casing errors are gone, a hypothesis not a fact:** the index carries only lowercase `settings/`
(27 tracked paths, 0 under `Settings/`, on this branch, the trunk and `validation-skeleton`), and all 7 imports
are lowercase. The 19 errors were therefore a property of a long-lived checkout whose on-disk directory
casing differed from the index (the 2026-09-19 entry measures 33 in the old tree and 14 in the trunk worktree on
the same day), not of a branch. I did not list `~/jjodel`'s directories to confirm (another worktree; Q5).

**The 9 files red at import** (vitest, `ReferenceError: window is not defined` through the `monaco-editor`
`window.js` import; the checkpoint asks that Phase 2 record them): `src/jjscript/__tests__/context-binding.test.ts`,
`src/jjtl/__tests__/abstract-target.test.ts`, `ai-prompt-sanitization.test.ts`, `circular-refs.test.ts`,
`executor-bridge.test.ts`, `executor-llayer.test.ts`, `forall-mapping.test.ts`, `source-alias.test.ts`,
`src/utils/__tests__/UDComparator.test.ts`.

## 3. Item 3 — the false-green guard

### 3.1 The counter pattern in committed scripts: none

`git grep`, committed files only, `frontend/scripts`, every compound operator followed by `await`, and the
`x = x <op> await` form: **exit 1, no match**. Repo-wide over `*.ts *.tsx *.mjs *.js *.cjs`: exit 1, no match for
either form. Control through the same tool: the ticket's own quotation at `docs/log-inbox/simulation.md:40` is found
by the same `[[:space:]]` pattern. `git log --all -S'+= await e2e'` finds no commit on any branch. No `_tmp_*` file
is tracked on `alfonso-frontend-jjtl`, `simulation-engine`, `validation-skeleton`, `master` or `staging`.

The one real occurrence is `frontend/scripts/smoke/_tmp_sim1_verify.ts:186`, per the ticket at
`docs/log-inbox/simulation.md:40`, and it is ignored by `.gitignore:66` (`frontend/scripts/smoke/_tmp_*`), so it is
not in this worktree. README-probes counts, on 2026-08-30, 150 `_tmp_*` probes that import from `states.ts`
(`frontend/scripts/smoke/README-probes.md`, "Probes inherit the rule"): the class is large and all of it is untracked. **A check that reads the index or committed files would not have caught
the incident and would catch nothing today.** That is the finding that shapes the proposal (Q3).

### 3.2 What the statement does (executed)

`failures += await e2e.run()` evaluates `failures + await ...` with the left operand read first. Run in node:

```
A  failures += await e2e.run()        -> 0   (two increments happened during the await)
B  const r = await ...; failures += r -> 2   (increments kept)
C  f2 += await run() where run returns its own count -> 2  (correct; no shared counter: not a defect)
```

Two failure modes sit in the ticket: the lost update (A) and the module that returns 0. Only the first is visible to
a static check. The second is a property of the harness and the README's own snippet (`README-probes.md:285-292`)
is the safe shape (one `check()` that increments one counter). ESLint's `require-atomic-updates` is this rule, but
ESLint is not installed (`CLAUDE.md` §17) and rule 4 forbids the dependency.

### 3.3 Proposed rule, host and negative control

**Rule.** A compound assignment (`+= -= *= /= %= **= <<= >>= &= |= ^= ||= &&= ??=`), or `x = x <op> ...` whose
right side contains an `await` of the same function, is rejected. Fix: `const r = await f(); x += r;`.
**AST, not regex.** The TypeScript compiler API is already a dependency (`typescript` 5.9.3 in `package.json:73,80`)
and imports under `node --experimental-strip-types` (checked). A regex would fire on the strings and comments
that quote the pattern (this report, the tests, the README) and miss `n += 1 + (await f()).length`.
A prototype in the scratchpad, run on 14 fixtures, gave 0 unexpected results:
caught: the incident, `n = n + await f()`, `o.n += await f()`, `n += (await f())`, `n += 1 + (await f()).length`,
`n ||= await f()`, top-level `n += await f()`; clean: `const r = await f(); n += r`, `n = await f()`,
`n += 1; await g()`, `n += items.map(async () => { await g() }).length` (the `await` belongs to a nested function),
the pattern in a string, in a comment, and `for await`.

**Host.** No existing gate fits: `check:docs` is documentation and is run when the docs change, `check:agents` is
the projection gate, `typecheck:scripts` is type-level. Proposal: a new sibling gate `npm run check:scripts`
(`frontend/scripts/gates/check-scripts.ts`), scanner in a pure module (`lint-await-counter.ts`) so a test executes
it on fixtures (P11), **reading the disk, gitignored `_tmp_*` included, not the index**. Alternatives, weaker:
(a) a vitest test that scans the tree, no `package.json` change and every code lane already runs vitest, but the
verdict then depends on which untracked probes a worktree holds; (b) a `PreToolUse` hook on `Edit|Write` of
`frontend/scripts/**`, the only option that fires when the probe is written, but hooks fail open (RC-15), a `.mjs`
hook would have to load `typescript` from `node_modules` and pass silently where it is absent, and it needs
`.claude/settings.json`, outside the expected file list. The honest limit of any gate: it runs when someone runs it.
`CLAUDE.md` §17 and a line in `README-probes.md` would say to run it on any file under `frontend/scripts/`.

**Negative control.** Fixtures are strings inside the test, not files (a file with the pattern under
`frontend/scripts/` would fail the gate on itself): the seven caught forms must each yield exactly one finding
with the right line; the seven clean forms zero. Second control, at the gate: a temp tree holding one file with the
incident line must make `check-scripts` exit 1 naming file and line; the same tree without it must exit 0.
**Mutation bench (Phase 2):** drop one operator from the set, descend into nested functions, ignore the top level,
drop the `x = x <op>` branch, skip gitignored paths, skip `.mjs`; each must turn a named test red.

## 4. Item 4 — the model pin (measured only, nothing changed)

**RC-16 and `P-2026-09-23-0718` exist on no ref.** `git grep` over all 33 refs (11 local heads, the remote-tracking
heads, the tags; a `while read` loop, since zsh does not split an unquoted variable), control `RC-15` in
`docs/decisions.md` found on the four refs that carry it (three local heads and `origin/alfonso-frontend-jjtl`):

- `RC-16` and `P-2026-09-23-0718` appear only in `docs/prompts/claude_2026-09-24_1630_prompt_harness_gate.md:22`
  (this prompt) and in `docs/sessioni/sessione_2026-09-24.md:74-77` on the trunk, which already says "non esistono
  in nessun ramo". `docs/decisions.md` stops at RC-15; no file in `docs/prompts/` has `0718` in its name (the
  2026-09-22 to 09-24 prompts are 2105, 1850, 1005, 1455, 1520, 1605, 1610, 1630).
- The string `claude-opus-5-5` appears, in `docs`, `.claude` and `CLAUDE.md` on any ref, in one discovery report only
  (`discovery_2026-09-23_sim_step1_events.md:6`, "Executor ... as the session banner shows it"), plus this prompt and
  the checkpoint. Two other reports write the name without the ID and say the same:
  `discovery_2026-09-24_sim_panel_faces.md:6` ("Executor: Anthropic Claude Opus 5.5 (banner). `.claude/settings.json`
  still pins Opus 5.") and `discovery_2026-09-24_migrated_view_identity.md:8`. It is never in `.claude/settings.json`.

**The pin, and its history.** `.claude/settings.json:3` is `"model": "claude-opus-5"` on the trunk, this branch and
`simulation-engine`; `claude-opus-4-8` on `validation-skeleton`, `staging` and most remotes; absent elsewhere. It was
`claude-opus-4-8` from 2026-05-29 (`2b9a03827`) until `084ffc604` (2026-09-21) moved it to `claude-opus-5`. RC-15
decision (1) (`docs/decisions.md:91`) ratifies `claude-opus-5`, "nominato solo in `.claude/settings.json`". No commit
ever wrote `claude-opus-5-5` there.

**What the sessions ran.** All 73 commits since 2026-09-21 on any ref, message parsed one commit at a time
(a first tally by `awk` over `git log --format` was distorted by multi-line trailer output and was discarded), by
`Model:` trailer and `Co-Authored-By`:

| Commits | Window (local time) | `Model:` trailer | `Co-Authored-By` |
|---|---|---|---|
| 9 | 09-21 18:21 to 23:19 | Anthropic Claude Sonnet 5 | Claude Sonnet 5 |
| 1 | 09-21 19:11 | Anthropic Claude Fable 5.1 | Claude Fable 5.1 |
| 7 | 09-21 23:22 to 09-24 09:34 | Anthropic Claude Opus 5 | Claude Opus 5 |
| 18 | 09-22 21:07 to 09-24 17:04 | Anthropic Claude Opus 5.5 | Claude Opus 5.5 |
| 5 | 09-23 18:50 to 09-24 16:25 | `claude-opus-5-5` (the ID, not the banner name) | Claude Opus 5.5 |
| 2 | 09-23 16:25 to 16:26 | Anthropic Claude Opus 5.5 (1M context) | same |
| 9 | 09-23 16:02 to 09-24 16:34 | none | Claude Opus 5.5 |
| 17 | 09-23 12:06 to 15:55 | none | Claude Opus 4.8 |
| 4 | 09-23 16:26 to 09-24 09:30 | Sonnet 5 (3), `claude-sonnet-5` (1) | none |
| 1 | 09-23 12:19 | none | none |

The 17 Opus 4.8 commits are on `origin/feat/157-environment-config` (15) and `origin/docs/157-standalone-configurator-plan`
(2), two branches that pin `claude-opus-4-8` in their own `.claude/settings.json`: there pin and run agree, and they
are not this project's trunk. On the trunk line: Sonnet 5 ran on 09-21 evening across the pin change (`084ffc604`,
09-21 19:40; the 1620 entry declares it); Opus 5 ran for 7 commits after it; **Opus 5.5 ran from 2026-09-22 21:07 on
(34 commits name it), against a pin that says Opus 5**, and the sessions noticed it themselves
(`discovery_2026-09-24_sim_panel_faces.md:6`). The `Co-Authored-By` line is emitted by the
tooling from the running model, the `Model:` trailer is written by the session from its banner (P6); neither reads
the pin. The pin sets a default; what runs is what the session was launched or switched to. This session shows the
mechanism: the prompt says this lane runs on Sonnet 5 through the gitignored, per-worktree
`.claude/settings.local.json` (`"model": "claude-sonnet-5"`, read), and `/model Sonnet` reported the choice "saved as
your default for new sessions", after which `~/.claude/settings.json` reads `"model": "sonnet"`; the banner shows
Sonnet 5 while `.claude/settings.json` pins Opus 5. I did not read the settings of the other worktrees, so **which
channel put Opus 5.5 there (a `/model` switch, a user-level key or a local file) is not measurable from git** and I do
not guess (Q6). The user-level key I read was written by this session, so it is no evidence for earlier days.

Adjacent, measured: four forms of the trailer in four days (`Anthropic Claude X`, `X (1M context)`, the bare ID,
absent), where P6 asks `<vendor> <name> <version>`; 26 of the 58 commits that name an Opus model in either field carry
no `Model:` trailer (the 17 Opus 4.8 commits of the configurator branches and 9 Opus 5.5 commits, all with only the
tooling's `Co-Authored-By`). The project chat's instruction paragraph "oggi claude-opus-5-5, RC-16" is outside the repo and
needs correcting (`sessione_2026-09-24.md:76-77`).

## 5. Item 6 — baseline gates now (this branch, `08e6c05a6`, temporary symlink)

Symlink `frontend/node_modules` → `/Users/alfonso/jjodel/frontend/node_modules` (the `package.json` difference
between that tree and this one is the `version` field only); `git status` empty before, after the symlink and after
every command. It is ignored (`/frontend/node_modules`, `.gitignore:37`); to be removed before the report commit
together with `frontend/dist`, which the build created (ignored).

| Gate | Result |
|---|---|
| `npm run check:docs` | exit 0, 4/4 (A, B, C, D), 2 non-blocking inbox warnings; 40 entries, 1180 in the archive |
| `npm run check:agents` | exit 0, every projection aligned (9 files) |
| `npm run typecheck` | exit 2, **14** errors (§2), 0 casing |
| `npm run typecheck:scripts` | exit 0 |
| `npx vitest run` | **4248 passed, 0 failed**, 175 files passed, **9 failed at import** (§2), exit 1 |
| `npm run build` | exit 0, only the chunk-size warning |
| `git hooks` | only `pre-push` (no pre-commit), so nothing to skip at commit |

## 6. Risks

1. **Refactor of Check B.** Sharing one lint function between `check-docs.ts` and `rotate-log.ts` moves the inline
   per-entry block of `checkLog` (`:308-375`). Rule 8 (no adjacent cleanup) is answered by the fact that the block
   is the change; the safeguard is the before/after output on the real log, byte for byte, and the tests.
2. **The gate goes red on entries it used to ignore.** Measured green today (§1.4). It would go red on the next
   lane that writes an invalid inbox entry: that is the point, and the `log-entry` skill (rule 2, rule 7) must stop
   saying the inbox is not read.
3. **Slot pressure from ticket entries** (§1.3): 12 tickets against 40 slots. Not a bug, a cost.
4. **`+= await` guard scope.** Disk scan is non-hermetic by design (depends on the worktree's untracked probes). A
   scan of the index would be reproducible and inert.
5. **Critical zone.** None of the planned files is in `CLAUDE.md` §3.1; no Layer Impact Report is owed. No file
   outside the harness is touched.
6. **`CLAUDE.md` is owed to the trunk** (P15): the commit that changes §17 or §21.2 lives on `harness-gate` until
   the merge after 1610 closes; the entry must say so.
7. **Rule 19.** The plan below touches 17 files across two commits: listed here first, per P6, and named again in
   `Out-of-scope changes` (RC-11).
8. **Non-ASCII.** `check-docs.ts` compares the em dash as UTF-8 (`:43-47`); new headings must keep it.

## 7. Open questions for Alfonso

- **Q1 (third part).** Confirm the reading: lint the inbox entry before the fold whatever position it lands in, and
  name the folded entries the rotation sends straight to the archive. If "the fortieth" meant something else (for
  instance a bound on how old an inbox entry may be), say so.
- **Q2 (ticket type).** Accept: ticket = one entry, counts toward the 40, rotates by position, no status field,
  four fields. Alternatives: a separate `docs/log-tickets.md` outside the 40 (new file, new lint scope, new fold
  routing) or several tickets per entry.
- **Q3 (guard scope).** Disk scan including gitignored `_tmp_*` (recommended, the only scope that would have caught the
  incident) or index only (inert today).
- **Q4 (guard host).** New `check:scripts` with one `package.json` script entry (recommended; rule 4 speaks of
  dependencies, I read a script line as allowed, but the wording is "no new package.json entries"), or the
  test-hosted variant with no `package.json` change, or the hook.
- **Q5 (baseline text).** State 14, list the 14 by file and code, drop the line numbers (four of them moved by 6 to
  228 lines), drop the casing clause. May I also fix the other three sites (`HARNESS-DOCS.md:376`,
  `frontend/scripts/tsconfig.json:6`, and the generated `AGENTS.md`)? `HARNESS-DOCS.md` and `tsconfig.json` are not
  in the expected file list. And: is a one-line `ls` of the `Settings`/`settings` casing in `~/jjodel` welcome to
  confirm the hypothesis, or should the clause stay out?
- **Q6 (pin).** Not changed here. What to decide: ratify `claude-opus-5-5` (then RC-16 is to be written and the
  pin moved in a lane of its own), or keep `claude-opus-5` and treat the 5.5 sessions as a deviation to declare.
  And where the 5.5 sessions were switched, which only the launch settings of `~/jjodel-sim` and the chat window
  can say. Also the trailer form (`Anthropic Claude Opus 5.5` vs `claude-opus-5-5`).
- **Q7 (extras).** Include the HARNESS-DOCS refresh (line 374, §4.5, and 376) that the checkpoint says this lane
  may absorb? Record the 9 red-at-import file names in `CLAUDE.md` §17 (where "The suite has known failures" is),
  as the checkpoint asks for the Phase 2 GO?

## 8. Proposed Phase 2 diff, in prose

**Code commit** (checks and tests; `Model: Anthropic Claude Sonnet 5`; subject ends `(P-2026-09-24-1630)`):

1. `frontend/scripts/gates/log-tools.ts` — pure additions: the ticket heading pattern and `entryType`, the ticket
   field rules, and the per-entry lint function that both `check-docs.ts` and `rotate-log.ts` call (the existing
   Corregge/Causa rules move into it unchanged). `ENTRY_HEADING`, `splitLog`, `fold`, `rotate` untouched.
2. `frontend/scripts/gates/check-docs.ts` — Check B and C also read every `docs/log-inbox/*.md`, errors name the inbox
   file and line; tickets from `TICKET_LINT_FROM_DATE` judged by the ticket rules; header comment updated. D and the
   inbox warning stay.
3. `frontend/scripts/gates/rotate-log.ts` — `--fold` runs the same lint on the inbox entries and refuses, exit 1,
   writes nothing; the run prints the folded entries that `rotate` sends to the archive, and marks tickets.
4. `frontend/scripts/gates/__tests__/log-tools.test.ts` — extended: ticket recognition, ticket lint, the fold-then-
   archive case of §1.2.
5. `frontend/scripts/gates/__tests__/checkDocs.test.ts` (new) — executes `check-docs.ts` on a temp tree (copy of the
   gates and four documents, as in this discovery): control 1, control 2 and the green case; mutation bench listed.
6. `frontend/scripts/gates/lint-await-counter.ts` (new) — the pure scanner (TypeScript compiler API).
7. `frontend/scripts/gates/check-scripts.ts` (new) — the CLI: walks `frontend/scripts/**` on disk, exit 1 with file
   and line.
8. `frontend/scripts/gates/__tests__/awaitCounter.test.ts` (new) — the 7 caught / 7 clean fixtures as strings, the
   temp-tree control, the mutation bench.
9. `frontend/package.json` — one line, `check:scripts` (Q4; no dependency).
10. `frontend/scripts/tsconfig.json` — the `(33 errors)` comment only (Q5), if approved.

**Docs commit** (`Model:` trailer; both commits with pathspec):

11. `CLAUDE.md` — §17 baseline (14, the 14 by file and code, no line numbers; the known-red file names if Q7), the
    `check:scripts` gate line; §21.2 gains the ticket-entry paragraph **after** the format block, so Check A is not
    disturbed.
12. `AGENTS.md` — regenerated with `npm run gen:agents`, never by hand (rule 1c, declared).
13. `docs/PROTOCOL.md` — P9 gains the same ticket paragraph (and the inbox-lint sentence); the version line.
14. `.claude/skills/log-entry/SKILL.md` — rule 2 and rule 7 (the inbox is now read), rule 4 (a ticket is an entry of
    the new type; legacy paragraphs stay legal).
15. `docs/log-inbox/harness.md` — this lane's closing entry, with the owed-to-the-trunk note (P15) and the RC-11
    declaration of the file count.
16. `docs/prompts/claude_2026-09-24_1630_prompt_harness_gate.md` — the Status flip (P13).
17. `docs/discovery/discovery_2026-09-24_harness_gate.md` — the Phase 2 addendum with both negative controls and both
    mutation benches. Optional and only on approval: `docs/HARNESS-DOCS.md` (Q7), `frontend/scripts/smoke/README-probes.md`
    (one line on the guard).

Gates for Phase 2: typecheck with the same 14 (this table), `typecheck:scripts` exit 0, vitest with the new tests and
the same 9 files red, build, `check:docs` 4/4 (now reading the inboxes), `check:agents`. No visual check: nothing
reaches the UI. The pin is not touched.

## 9. Files read

- `/Users/alfonso/jjodel-gate/docs/prompts/claude_2026-09-24_1630_prompt_harness_gate.md`
- `/Users/alfonso/jjodel-gate/CLAUDE.md` (in full, from the session context; lines 133, 604-606, 649-664 cited)
- `/Users/alfonso/jjodel-gate/docs/PROTOCOL.md` (whole)
- `/Users/alfonso/jjodel-gate/docs/decisions.md` (lines 1-110, RC-3 to RC-15; headings; searches)
- `/Users/alfonso/jjodel-gate/docs/claude-code-log.md` (lines 1-135 in full; ticket lines 96, 234, 245)
- `/Users/alfonso/jjodel-gate/docs/claude-code-log-archive.md` (searched, not read: 1180 entries, 0 ticket paragraphs, 0 ticket headings)
- `/Users/alfonso/jjodel-gate/docs/log-inbox/harness.md`, `simulation.md` (lines 1-60), and sizes of the other six
- `/Users/alfonso/jjodel-gate/frontend/scripts/gates/check-docs.ts` (whole), `log-tools.ts` (whole), `rotate-log.ts` (whole), `check-agents.ts` (lines 1-60)
- `/Users/alfonso/jjodel-gate/frontend/scripts/gates/__tests__/log-tools.test.ts` (listed, size only)
- `/Users/alfonso/jjodel-gate/.claude/settings.json`, `.claude/settings.local.json`, `.claude/skills/log-entry/SKILL.md`
- `/Users/alfonso/jjodel-gate/frontend/scripts/tsconfig.json`, `frontend/vitest.config.ts`, `frontend/package.json` (script and dependency lines)
- `/Users/alfonso/jjodel-gate/frontend/scripts/smoke/README-probes.md` (lines 255-310)
- `/Users/alfonso/jjodel-gate/docs/sessioni/sessione_2026-09-23.md` (lines 118-130, 172-180), `sessione_2026-09-21_2.md` (searched), and `sessione_2026-09-24.md` from the trunk through `git show`
- `docs/discovery/discovery_2026-09-24_sim_panel_faces.md`, `discovery_2026-09-23_sim_step1_events.md`, `discovery_2026-09-24_migrated_view_identity.md` (the Executor lines only)
- `docs/HARNESS-DOCS.md` (lines 374-376 and searches)
- `~/.claude/settings.json` (the `model` key only, read after this session wrote it)
- Not read, by the prompt's rules: `~/jjodel-harness`, `~/jjodel-sim`, `~/jjodel-release` (no file of them).

## 10. Process notes

- One read-only command ran from another worktree: `git diff --quiet HEAD 08e6c05a6 -- frontend/package.json` after
  `cd ~/jjodel`, to compare `package.json` before choosing the symlink source. It changed nothing; the rule of
  the prompt is "never work by absolute path on another worktree", and I should have compared the two refs from here
  (I redid it that way, `git diff 31a0a0038 08e6c05a6`).
- One command was refused by the project deny list (`rm -rf` in a scratch setup). The scratch tree did not exist yet,
  so it was not needed; no retry with the same form.
- Scratch files (`proto-scan.mjs`, `lost-update.mjs`, `fold-old.mts`, `fold-real.mts`, the scratch tree, the outputs of
  the gates) are in the session scratchpad, outside the worktree.

## 11. Phase 2 addendum, 2026-09-24

Prompt-ID `P-2026-09-24-1630`, Phase 2 on the GO with Q1 to Q7 answered. Session `b2e4eec2-e53a-4d24-896e-a7b6a6f8dcb0`
(the Phase 1 report names `43250cb2-...`: the harness shows another identifier; noted, not explained). Executor: Anthropic
Claude Sonnet 5 (`claude-sonnet-5`) as the banner shows it. Correction rounds, Phase 1 and Phase 2: **0**.
Code commit `80581e1c7`; skill commit `78ce6c780`; the docs commit is the one that carries this addendum.

### 11.1 What the GO ratified, and where it landed

| Q | Decision | Landed in |
|---|---|---|
| Q1 | Lint every inbox entry before the fold, wherever it lands, archive-bound ones included; name the entries `rotate` sends straight to the archive | `rotate-log.ts` (`LINT` lines, refusal, `STRAIGHT-TO-ARCHIVE`), `log-tools.ts` (`foldedIntoArchive`) |
| Q2 | Ticket = one slot, no status field, four fields | `log-tools.ts` (`entryType`, `lintTicketFields`), `CLAUDE.md` 21.2, `PROTOCOL.md` P9 |
| Q3 | Disk scan including `_tmp_*`, `node_modules` and `dist` excluded; the gate depends on the local state | `check-scripts.ts` header, its first output lines, `CLAUDE.md` 17 |
| Q4 | New `check:scripts`, one script line, no dependency | `frontend/package.json` (one line); `typescript` was already a dependency |
| Q5 | The three sites of "33" | `CLAUDE.md` 17 (and the generated `AGENTS.md`), `frontend/scripts/tsconfig.json:6`, `docs/HARNESS-DOCS.md:376`. The last two were outside the list and are declared in their commit bodies |
| Q6 | Declared deviation, not a ratification | the entry in `docs/log-inbox/harness.md` (34 trunk commits name Opus 5.5 from 2026-09-22 21:07 against the pin `claude-opus-5`; the launch channel is not recoverable from git). The pin is untouched |
| Q7 | No HARNESS-DOCS refresh beyond the "33" row; the nine red-at-import names in `CLAUDE.md` 17 | `CLAUDE.md` 17 |

`PROTOCOL.md` stays at version 1.5. Phase 2 first raised the line to 1.6, a reading made without asking (the precedent of 1.3, a
register line in P10, had bumped it for a normative paragraph); the operator's ACK put it back in `d9af59d8b`: the line tracks the
set of clauses, and none was added or removed. The P9 paragraph on the ticket type and the inbox lint stays.

Three commits, not two: `bash-guard` reads `.claude/skills/log-entry/SKILL.md` as code and refused a docs commit that carried it
(P13, docs and code apart), so the skill went in a commit of its own, `78ce6c780`, before the docs commit, and the Status flip
cites it as the last code commit.

### 11.2 Negative controls, run on a scratch tree outside the worktree

`check:docs` on a copy of the real log and the real documents, with `docs/log-inbox/probe.md` holding a task entry with
Corregge absent and `Causa: (c) with an annotation`, and a ticket entry with `Priority: urgent` (controls 1 and 2):

```
FAIL  Check B — prompt log fields (entries dated >= 2026-08-02)
    2 entries in 1 lane inbox file(s) under docs/log-inbox, 2 in scope
    ERROR  required field missing
      file    : docs/log-inbox/probe.md
      entry   : ## 2026-09-25 — fix: probe entry  (docs/log-inbox/probe.md:5)
      field   : **Corregge**
      found   : (field absent)
    ERROR  value outside the CLAUDE.md §21.3 taxonomy
      field   : **Causa**
      found   : (c) with an annotation
    ERROR  value outside the ticket priorities
      entry   : ## 2026-09-25 — ticket: probe ticket  (docs/log-inbox/probe.md:10)
      field   : **Priority**
      found   : urgent
      allowed : high | medium | low
exit=1
```

The same tree through `rotate-log --fold --rotate --write` (control 3): three `LINT` lines, `refusing to fold: 3 problem(s) ...
nothing was written.`, exit 1; the log on disk has the same checksum as the source it was copied from. `check-scripts` on a
`_tmp_` file holding `failures += await e2e.run()`: exit 1, `_tmp_x.ts:3:3`, the statement and the fix; on the real tree
exit 0, 23 files, 0 `_tmp_*` probes. The same four controls run inside the test suite on throwaway trees.

`check:docs` on the real tree, before and after the change: identical output but for two added telemetry lines (the inbox
entries in scope for B, the inbox Notes fields in scope for C). Measured green on the four real waiting entries, as §1.4 said.

### 11.3 Mutation benches, 78 mutants, 78 killed

Each mutant is the committed source with ONE line changed, transpiled (or copied next to a throwaway tree) and answered by
the same probe that the real code answers right; the bench opens with a control that the unmutated loader answers like the
real module, and each gate mutant must also run without a syntax or reference error. Groups: scanner 37 (each of the 15
compound and 15 binary operators dropped; nested functions descended; the `x = x` branch; the leftmost check; parenthesis
unwrap; left spine; await recognition; the reported line), `check-scripts` 4 (`_tmp_` skipped, `.mjs` dropped, `node_modules`
scanned, exit code), lint 26 (ticket type and its from-date, each ticket field, Corregge, Causa, both date scopes, the Notes
cap both ways, multi-line Notes, line offset, first occurrence wins, the inert `**Ticket** (` paragraph, `promptNameKeys`,
`entryStartLines`, `foldedIntoArchive`), `check-docs` and `rotate-log` 11 (inbox not read, B and C skipping the inbox,
sibling resolution, ticket type, ticket Priority, fold refusal, fold lints nothing, straight-to-archive listing, ticket mark).
0 survivors. Fixtures that no mutation of the present source can violate, kept as declared intent: `for await`, the pattern in
a string, in a comment.

### 11.4 Known limits of the guard

Not caught, by design of a per-statement rule: `x = 1 + x + await f()` (x is not the leftmost operand), `x = await f(x)`, and
the second failure mode of the ticket, a module that returns 0 whatever it counted. The gate runs only when someone runs it and
reads the disk of the worktree it runs in: it has not been run in `~/jjodel-sim`, where the known offender lives (ticket in the
harness entry).

### 11.5 Gates, on the code commit and again on the docs tree

`npm run typecheck` exit 2, 14 errors, the Phase 1 set; `typecheck:scripts` exit 0; `npx vitest run` 4424 passed, 0 failed,
9 files red at import (the nine of section 2); `npm run build` exit 0; `check:docs` 4/4 (now reading the inboxes, the new entry
included); `check:agents` green; `check:scripts` exit 0. No visual check: nothing reaches the UI.

### 11.6 Process notes

- Two messages were misrouted in total, one per session, an operator routing error and not a correction round. The 1610 ACK (a
  conditional ACK on a Layer Impact Report this session had not produced) reached this session; the GO 1630 reached the 1610
  session. Here the 1610 prompt file and 60 lines of `VersionFixer.tsx` were read, `git worktree list` and a `git ls-tree` of the
  1610 report path ran (names only, the report was not read), nothing was written, and the reply did not open with the P13 header
  (own ID, received ID). The authoritative record, with the sessions and the count of correction rounds, is the entry in
  `docs/log-inbox/harness.md`: it counts 1 round, the PROTOCOL.md version revert, and the header of this section, written before
  it, says 0.
- The `log-entry` skill loaded in this session injected the rules 2, 4 and 7 as they were before this lane, while the file on
  disk was already edited (ticket in the harness entry).
- Not done, on purpose: the HARNESS-DOCS refresh (Q7), the one-line addition to `README-probes.md` (never approved), the `ls` of the
  `Settings`/`settings` casing in `~/jjodel` (Q5 asked whether to; the answer did not say, so the casing hypothesis of section 2
  stays a hypothesis and the clause stays out of `CLAUDE.md`).
- `CLAUDE.md`, `AGENTS.md` and `PROTOCOL.md` changed here are owed to the trunk (P15): they live on `harness-gate` until the
  merge after 1610 closes.
