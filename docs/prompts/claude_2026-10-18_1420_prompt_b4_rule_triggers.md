# B4: rule triggers, the glob-to-doc map, the rule-trigger hook and the check:triggers gate

Prompt-ID: P-2026-10-18-1420
Chat: C-2026-10-18-1414
Front: harness
Lane: full (new hook under `frontend/scripts/hooks/`, governance per RC-36; heavy by rule, not drawn)
Status: eseguito 2026-10-18 · lane rule-triggers · code 71a932b8f · tests 39 new (ruleTrigger 24, checkTriggers 15), scripts/hooks 847 green in 17 files, typecheck:scripts 0, check:scripts PASS, check:triggers PASS (8 entries), mutation bench 18/18 killed · map in the docs commit (P13 guard) · hook not registered, B7 · no visual check
Depends: P-2026-10-18-1205
Corregge: the sentinel `check:docs` accepts (RC-45 (2)); this lane corrects no earlier lane
Request: none (Alfonso, 2026-10-18 14:15, «via sulla raccomandazione»: B4 and B8b before a single interactive B7; RC-49 (2) and (3) approved the plan of the report below)
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply: Phase 1 is `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §5.1 C, §5.2, §5.3, §5.6 (B4), §5.7 T-D1 and T-D2; one-session implementation lane. P8 does not apply, no UI.
Worktree: `~/jjodel-w-triggers`, branch `rule-triggers`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.
Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high` (AM-7: no critical zone, no visual bug). Launched with `--tier heavy` (governance, RC-36; not an RC-45 draw).

## Lane discipline

Every reply opens with `[P-2026-10-18-1420 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes (RC-20). Priority if time runs short: item 1, then 2, then 3, then 4; an item not reached becomes a ticket in the entry. Output discipline (CLAUDE.md §0.1): tests through `run-quiet.mjs`; read the existing hooks with Read and `offset`/`limit`.

## Context (do not redo the analysis)

The report plans to move specialist rules out of the root `CLAUDE.md` (B5) only after each moved rule has a mechanical trigger (§5.3: a rule counts as available when its doc is named in the lane input, loaded natively on the Read that precedes an Edit, or named by a denial on the first Edit or Write under its path). B4 builds the map and the second trigger, plus the gate that keeps the map honest. Nothing is moved and nothing is registered here: the hook is registered in `.claude/settings.json` by the interactive B7, after this lane and B8b. Today the repository has nested rule files at `frontend/src/{components/editor-v2,jjel,jjscript,jjtl,model,redux,services/export,styles}/CLAUDE.md` (confirm with `git ls-files '*CLAUDE.md'`). The existing hooks (`bash-guard.mjs`, `critical-zone.mjs`, `output-budget.mjs`, shared `lib.mjs`) fail open and are tested under `frontend/scripts/hooks/__tests__/`: follow their structure, stdin parsing and helpers rather than inventing new ones.

## COSA

1. `docs/harness/rule-triggers.json`, schema 1: `{ "schema": 1, "entries": [ { "glob": "<repo-relative glob>", "docs": ["<repo-relative path>[#<heading fragment>]", ...], "why": "<one line>" } ] }`. Initial entries: one per nested `CLAUDE.md` below the root, glob `<its directory>/**`, docs `[<that CLAUDE.md>]`. No entry for the root `CLAUDE.md` (it loads automatically). No entries for rules still in the root: B5 adds them when it moves them.
2. `frontend/scripts/hooks/rule-trigger.mjs`, PreToolUse hook for `Edit|Write|NotebookEdit`, same conventions as `critical-zone.mjs`.
   a. Reads the hook input from stdin (`tool_input.file_path` or `notebook_path`, `session_id`, `cwd`), makes the path repo-relative against `$CLAUDE_PROJECT_DIR` (fallback `cwd`), and matches it against the map's globs. Glob support: `**`, `*`, literal segments; a small matcher in the hook or in `lib.mjs`, no new dependency. Check first whether `lib.mjs` already has one.
   b. On the first matching write of a session for a given entry, answer `deny` with a reason that names the docs and says what to do: read them, then retry the same write. Record the entry's glob in a marker file `jjodel-rule-trigger-<session_id>.json` in `os.tmpdir()`. The same entry in the same session is allowed afterwards; another entry, or the same entry in another session, fires again. Several entries matching one path fire together, in one denial.
   c. `deny` (not `ask`), so that it holds under `bypassPermissions` as well (RC-29).
   d. Fails open, silently: missing or unparsable stdin, no `session_id`, no file path, missing or invalid map, unwritable temp dir, any exception. A path outside the repository or outside every glob is allowed with no marker written.
   e. The map path is `docs/harness/rule-triggers.json` under the project dir; `JJODEL_RULE_TRIGGERS` overrides it (for the tests only; say so in the header comment).
3. `frontend/scripts/gates/check-triggers.ts` and `npm run check:triggers` in `frontend/package.json` (same invocation style as `check:docs`). Exit 0 with `check:triggers PASS (<n> entries)`; exit 1 listing every failure on its own line; exit 2 when the map is not valid JSON or not schema 1. Failures:
   a. a doc target that does not exist; a `#fragment` that matches no Markdown heading of its file (case-insensitive substring of the heading text);
   b. a glob that matches no tracked file (`git ls-files`);
   c. a tracked `CLAUDE.md` below the root that is not a doc of some entry whose glob covers its own directory (this is how a moved rule without a trigger is caught: B5's new nested files must be mapped before they land);
   d. a duplicate glob.
   `--root <dir>` for tests, as `decisions-query.ts` does.
4. Tests, through the existing harness and `run-quiet.mjs`:
   a. `frontend/scripts/hooks/__tests__/ruleTrigger.test.ts` (T-D2): deny once on the first write under `frontend/src/components/editor-v2/**` with the doc named, allow the retry, fire again in a new session, never fire on a path outside the map (negative), fire two entries together when two globs match, fail open on each case of 2d. Use a fixture map through `JJODEL_RULE_TRIGGERS` and a per-test temp dir.
   b. `frontend/scripts/hooks/__tests__/checkTriggers.test.ts` (T-D1): live repository passes; each failure of 3a to 3d on a fixture under `--root`; exit 2 on bad JSON.
   c. Mutation bench as in B3a: break the once-per-session logic, the glob matcher (`**` versus `*`), the outside-repo allow, and each of the four checks; every mutant must be killed. Report the count.

## Gates

The two new test files, then all of `scripts/hooks`, through `run-quiet.mjs`; `typecheck:scripts` exit 0; `check:scripts` PASS; `check:triggers` PASS on the live repository; `check:docs` after the docs commit. Real check without registration: pipe a hand-written PreToolUse JSON for a write under `frontend/src/jjtl/` into `node frontend/scripts/hooks/rule-trigger.mjs` twice with the same `session_id`, and paste the two answers in the entry.

## Commits (P13, RC-17), explicit pathspecs

Commit 1, `feat(harness): rule-trigger hook, trigger map and check:triggers (P-2026-10-18-1420)`: `docs/harness/rule-triggers.json`, `rule-trigger.mjs`, `check-triggers.ts`, the two test files, `frontend/package.json` (the one script line), and `lib.mjs` only if 2a put the matcher there. Trailer `Model:` (P6).

Commit 2, docs: `docs/harness/gates.md` (three lines: the map, the hook, the gate; that the hook is not registered until B7), the log entry in `docs/log-inbox/harness.md` («Decisions taken (unattended)» and «Decisions awaiting Alfonso» at the end; the latter names the registration in B7), and the Status flip of this prompt. No push, no merge (RC-19).

## Tickets to open in the entry (not to do)

The first trigger of §5.1 C (`lane-run start` appends a «Rules in scope» block from the DOVE globs, test T-D3) is in no batch of §5.6 and touches `lane-run.mjs`: name it as a ticket for a later heavy lane.

## HARD STOP

None planned. Stop with `Outcome: question` only if `check:scripts` or another gate requires registering the new script or hook in a file outside this DOVE (for example `.claude/settings.json`): give the measured requirement and the recommended way out.

## NON FARE

Do not touch `.claude/`, the root `CLAUDE.md`, any nested `CLAUDE.md` or `AGENTS.md`, `docs/PROTOCOL.md`, `docs/decisions.md`, `lane-run.mjs`, `critical-zone.mjs`, `bash-guard.mjs`, `output-budget.mjs`. Do not register the hook. No `git add .`, no `git stash`, no `git reset --hard`.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §5.1 C, §5.2, §5.3, §5.6, §5.7, §7.5; `frontend/scripts/hooks/critical-zone.mjs`, `lib.mjs` and their tests; `frontend/scripts/gates/check-docs.ts` and `decisions-query.ts` (CLI and `--root` conventions); `docs/harness/gates.md`; `docs/decisions.md` RC-16, RC-17, RC-19, RC-20, RC-21, RC-25, RC-26, RC-29, RC-36, RC-45, RC-49; `docs/PROTOCOL.md` P6, P13, P14, P16.
