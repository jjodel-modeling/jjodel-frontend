# B8b: the context-ceiling hook (AM-8)

Prompt-ID: P-2026-10-18-1530
Chat: C-2026-10-18-1526
Front: harness
Lane: full (new hook under `frontend/scripts/hooks/`, governance per RC-36; heavy by rule, not drawn)
Status: da eseguire
Depends: P-2026-10-18-1420
Corregge: the sentinel `check:docs` accepts (RC-45 (2)); this lane corrects no earlier lane
Request: none (Alfonso, 2026-10-18 15:26, «si» to this chat taking the harness front and launching B8b; RC-49 (5) accepted AM-8 in principle)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply: Phase 1 is `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §7.3, §7.5 (B8b) and the tests T-C1, T-C2; one-session implementation lane. P8 does not apply, no UI.

Worktree: `~/jjodel-w-ctxceiling`, branch `context-ceiling`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high` (AM-7: no critical zone, no visual bug). Launched with `--tier heavy` (governance, RC-36; not an RC-45 draw).

## Lane discipline

Every reply opens with `[P-2026-10-18-1530 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes (RC-20). Priority if time runs short: item 1, then 2, then the gates; an item not reached becomes a ticket in the entry. Output discipline (CLAUDE.md §0.1): tests through `run-quiet.mjs`; read the existing hooks with Read and `offset`/`limit`.

## Context (do not redo the analysis)

AM-8 (report §7.3) gives every lane session a context ceiling: soft 200,000 tokens (finish the step, write `handoff.md` in the lane folder, end with `Outcome: hard-stop`), hard 250,000 (deny everything except the handoff). RC-49 (5) accepted it in principle; thresholds and normative text are ratified later, in B8c. This lane builds and tests the hook only. It is not registered: B7, interactive, registers it in `.claude/settings.json` with matcher `*`. Nothing changes for any session until then.

One change from the report, decided by the chat (unattended, RC-25; name it in the entry). The report's hook reads `JJODEL_LANE_LOG`, which `lane-run launch` would export in B8a; B8a is not done (`lane-run.mjs` exports only `JJODEL_CRITICAL_ZONE_GOAHEAD`, around `:511`). Claude Code passes `transcript_path` to every hook, and that file carries, per `assistant` event, `message.usage`, `message.id` and `isSidechain` (checked by the chat on 2026-10-18 on a live transcript under `~/.claude/projects/`). So the hook measures from `transcript_path`, and uses `JJODEL_LANE_LOG` instead when it is set and readable (forward compatible with B8a). The lane folder is the directory under `~/.jjodel-lanes/` whose `session.txt` holds this `session_id` (`JJODEL_LANES_DIR` overrides the root, for the tests). B8b no longer depends on B8a.

The existing hooks (`bash-guard.mjs`, `critical-zone.mjs`, `output-budget.mjs`, `rule-trigger.mjs`, shared `lib.mjs`) fail open and are tested under `frontend/scripts/hooks/__tests__/` with `hookRunner.ts`: follow their structure, stdin parsing and helpers.

## COSA

1. `frontend/scripts/hooks/context-ceiling.mjs`, PreToolUse hook for every tool.
   a. Measure. Source: `JJODEL_LANE_LOG` if set and readable, else `transcript_path` of the hook input. Read only a bounded tail (for example the last 512 KB, widened once to the whole file if the tail holds no qualifying event). Context = `input_tokens + cache_read_input_tokens + cache_creation_input_tokens` of the latest event with `type` `assistant`, a `message.usage`, and `isSidechain` not true. Several lines share one `message.id` (one per content block) with the same usage: take the latest. Measure on one real transcript and one real lane `log.jsonl` whether the event of the call that requests the tool is already on disk when PreToolUse runs; if it is not, the hook is one call late: accept it and say so in the entry.
   b. Thresholds: soft 200000, hard 250000; `JJODEL_CONTEXT_SOFT` and `JJODEL_CONTEXT_HARD` override them when both are positive integers and soft < hard, otherwise the defaults hold. The header comment says the values are the proposal of RC-49 (5), not ratified, and that B8c fixes them.
   c. Lane session (lane folder found). Below soft: allow, silent. At or above soft, the first time in the session: `deny`, with a reason that gives the measured context and says: start no new work, write `<lane folder>/handoff.md` with the sections Task, Scope, Decisions taken, Evidence, Current diff, Remaining checks (Current diff is `git diff --stat` against the cut sha plus the path of a full diff written to `<lane folder>/handoff.diff`), then end with `Outcome: hard-stop`. Record the soft firing in `jjodel-context-ceiling-<session_id>.json` in `os.tmpdir()`; later calls below hard are allowed. At or above hard: `deny` every call except Read, Write or Edit of `<lane folder>/handoff.md` or `handoff.diff`, and Bash whose whole command is one `git status` or `git diff` invocation, optionally redirected with `>` to `<lane folder>/handoff.diff`, with no `;`, `&&`, `||`, `|`, backtick or `$(`. The reason names the handoff and the Outcome line.
   d. Session with no lane folder (interactive): at or above soft, once per session, `deny` with a reason telling the session to start no new work, to tell the user the measured context, and to recommend a fresh session. No hard stop. (RC-50 governs the architect chat; this is the executor side.)
   e. `deny`, never `ask`, so that it holds under `bypassPermissions` (RC-29).
   f. Fails open, silently: missing or unparsable stdin, no `session_id`, no readable source, no qualifying event, unwritable temp dir, any exception.
   g. It runs on every tool call: it must not parse the whole transcript each time. Report the hook's wall time on the largest transcript under `~/.claude/projects/`.
2. `frontend/scripts/hooks/__tests__/contextCeiling.test.ts`, fixtures built in per-test temp dirs (no new fixture files):
   a. T-C1: deny once at soft with the handoff path named; the next call below hard allowed; at hard, a Bash `ls` denied, a Write of `handoff.md` allowed, `git diff --stat` allowed, `git diff --stat > <lane folder>/handoff.diff` allowed, `git diff; rm x` denied.
   b. T-C2 (negative): never fires below soft; not when the latest line above soft is a sidechain event; not when an older main event is above soft and the latest is below.
   c. Lane folder lookup through `JJODEL_LANES_DIR`; `JJODEL_LANE_LOG` taking precedence over `transcript_path`; the interactive variant of 1d; dedup by `message.id`; threshold overrides, including invalid ones falling back to the defaults; each fail-open case of 1f.
   d. Mutation bench as in B4: break the soft comparison, the sidechain filter, the once-per-session marker, the hard allowlist (chaining), the source precedence; every mutant must be killed. Report the count.

## Gates

The new test file, then all of `scripts/hooks`, through `run-quiet.mjs`; `typecheck:scripts` exit 0; `check:scripts` PASS; `check:triggers` PASS; `check:docs` after the docs commit. Real check without registration: copy the transcript of the session of P-2026-10-18-1420 (its `session.txt`, under `~/.claude/projects/`) to a temp file, pipe a hand-written PreToolUse JSON pointing at it into `node frontend/scripts/hooks/context-ceiling.mjs` twice with the same fresh `session_id` and once with lowered `JJODEL_CONTEXT_SOFT`/`JJODEL_CONTEXT_HARD`, and paste the answers in the entry.

## Commits (P13, RC-17), explicit pathspecs

Commit 1, `feat(harness): context-ceiling hook for AM-8 (P-2026-10-18-1530)`: `context-ceiling.mjs`, `contextCeiling.test.ts`, and `lib.mjs` only if a shared helper belongs there. Trailer `Model:` (P6).

Commit 2, docs: `docs/harness/gates.md` (a few lines: the hook, its source and thresholds, not registered until B7), the log entry in `docs/log-inbox/harness.md` («Decisions taken (unattended)», which names the `transcript_path` change, and «Decisions awaiting Alfonso», which names the registration in B7 and the ratification of the thresholds in B8c), and the Status flip of this prompt. No push, no merge (RC-19).

## Tickets to open in the entry (not to do)

B8a keeps `--fresh`, `next`, the slice refusal and the mechanical handoff; `JJODEL_LANE_LOG` there becomes optional. B7 registers the hook with matcher `*`.

## HARD STOP

None planned. Stop with `Outcome: question` only if `check:scripts` or another gate requires registering the new hook in a file outside this DOVE (for example `.claude/settings.json`): give the measured requirement and the recommended way out.
