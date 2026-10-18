# B8b: the context-ceiling hook (AM-8)

Prompt-ID: P-2026-10-18-1528
Chat: C-2026-10-18-1515
Front: harness
Lane: full (new hook under `frontend/scripts/hooks/`, governance per RC-36; heavy by rule, not drawn)
Status: da eseguire
Depends: P-2026-10-18-1420 (hook conventions), P-2026-10-18-1516 (trunk tip)
Corregge: this lane corrects no earlier lane
Request: none (Alfonso, 2026-10-18 15:26: thresholds 200,000 soft and 250,000 hard ratified for lane sessions, «ok»; source of the measurement left to the chat, «decidi tu»: `transcript_path` first, `JJODEL_LANE_LOG` as override, so B8b does not wait for B8a)
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply as a separate lane: Phase 1 is `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §7.3 and §7.5 (B8b), plus the short format check of item 0 below, which hard-stops only if the format does not hold. P8 does not apply, no UI.
Worktree: `~/jjodel-w-ceiling`, branch `context-ceiling`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.
Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high` (AM-7: no critical zone, no visual bug). Launched with `--tier heavy` (governance, RC-36; not an RC-45 draw).

## Lane discipline

Every reply opens with `[P-2026-10-18-1528 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes (RC-20). Priority if time runs short: item 0, then 1, then 2, then 3; an item not reached becomes a ticket in the entry. Output discipline (CLAUDE.md §0.1): tests through `run-quiet.mjs`; read the existing hooks and any transcript with Read and `offset`/`limit` or `tail`, never whole.

## Context (do not redo the analysis)

AM-8 (report §7.3, accepted in principle by RC-49 (5), thresholds now ratified by Alfonso) puts a context ceiling on every lane session. The measure is the main-session context of one call: `input_tokens + cache_read_input_tokens + cache_creation_input_tokens` of the latest main (non-sidechain) `assistant` event. The report assumed the hook would read the lane's `log.jsonl` through `JJODEL_LANE_LOG`, but that variable is not exported anywhere today (grep of `frontend/scripts` on 2026-10-18 finds nothing): B8a will add it, with `--fresh`, `next` and the mechanical handoff. This lane does not wait: Claude Code passes `transcript_path` in every hook input, for lane and interactive sessions alike, and that file carries the same `assistant` events with `message.usage`. The hook therefore reads `JJODEL_LANE_LOG` when it is set and non-empty, and `transcript_path` otherwise. Nothing is registered here: B7 registers the hook in `.claude/settings.json` with matcher `*`. The existing hooks (`bash-guard.mjs`, `critical-zone.mjs`, `output-budget.mjs`, `rule-trigger.mjs`, shared `lib.mjs`) fail open and are tested under `frontend/scripts/hooks/__tests__/`: follow their structure, stdin parsing, marker-file pattern (`rule-trigger.mjs`) and helpers rather than inventing new ones.

## COSA

0. Format check (read-only, short). On a real closed lane, P-2026-10-18-1420: its session id is in `~/.jjodel-lanes/P-2026-10-18-1420/session.txt`, its transcript is `~/.claude/projects/-Users-alfonso-jjodel-w-triggers/<session id>.jsonl`, its lane log is `~/.jjodel-lanes/P-2026-10-18-1420/log.jsonl`. Establish, from the tail of each file only: the line shape of a main `assistant` event and where `usage`, `message.id` and the sidechain flag sit; whether one API call spans several lines with the same `message.id`, and which line carries the final usage; whether the `assistant` line holding a `tool_use` is written before that tool runs (ordering against the matching `tool_result`); that the last-call sum computed from the transcript equals the one from `log.jsonl` for the same final call. Save the result as `docs/discovery/discovery_2026-10-18_context_ceiling_transcript_format.md` (objective, files read with paths, findings, risks, open questions). If the two sources disagree, or the transcript carries no per-call usage, stop with `Outcome: hard-stop` and the measured difference: the design below rests on it.

1. `frontend/scripts/hooks/context-ceiling.mjs`, PreToolUse hook, intended matcher `*`.
   a. Reads the hook input from stdin (`session_id`, `transcript_path`, `tool_name`, `tool_input`, `cwd`). Source: `JJODEL_LANE_LOG` if set and non-empty, else `transcript_path`. Reads only the tail of the file (a bounded number of bytes, a constant in the module, enough to hold the last main `assistant` event in the item-0 measurement with a wide margin; if the tail holds none, fail open). Ignores a partial last line, sidechain events and any event without `message.usage`. The context is the sum of the three fields of the latest main event, following the multi-line rule found in item 0.
   b. Thresholds: `SOFT = 200_000`, `HARD = 250_000` as module constants; `JJODEL_CONTEXT_SOFT` and `JJODEL_CONTEXT_HARD` override them (positive integers, soft below hard, otherwise ignored; for the tests only, say so in the header comment).
   c. Below soft: allow, nothing written.
   d. Soft, once per session: on the first tool call at or above soft and below hard, answer `deny` with a reason that states the measured context and the threshold, and says what to do: finish the current step, write `handoff.md` with the six sections (task, scope (DOVE), decisions taken, evidence: commands with exit codes and gate results, current diff: `git diff --stat` against the cut sha plus the path of a full diff file, remaining checks), then end with `Outcome: hard-stop`. Record it in a marker `jjodel-context-ceiling-<session_id>.json` in `os.tmpdir()`; later calls below hard are allowed.
   e. Hard: from the first call at or above hard, every call is denied except (i) `Write` or `Edit` whose `file_path` basename is `handoff.md`, and (ii) `Bash` whose command is exactly `git status` or `git diff` with arguments and no shell operator (`;`, `&&`, `||`, `|`, `>`, `<`, backtick, `$(`). The reason names the measured context and the two allowed actions.
   f. Handoff location named in the reasons: the directory of `JJODEL_LANE_LOG` when set; otherwise `<os.tmpdir()>/jjodel-handoff-<session_id>/handoff.md`. The hook does not create it.
   g. `deny` (not `ask`), so that it holds under `bypassPermissions` (RC-29).
   h. Fails open, silently: missing or unparsable stdin, no `session_id`, no readable source, no usable event in the tail, unwritable temp dir (the soft denial is then still given, without marker), any exception.

2. `frontend/scripts/hooks/__tests__/contextCeiling.test.ts`, through the existing harness, with fixture transcripts written to a per-test temp dir and shaped as measured in item 0:
   a. below soft allows; soft denies once with the reason and the marker, the next call allows; a new session denies again;
   b. hard denies `Read`, `Edit` of another file and `git log`; allows `Write` and `Edit` of `handoff.md` and plain `git status`, `git diff --stat`; denies `git status; rm x` and `git diff | cat`;
   c. sidechain events after the last main event are ignored; a partial last line is ignored; the multi-line rule of item 0 holds;
   d. `JJODEL_LANE_LOG` set takes precedence over `transcript_path`; set but empty falls back;
   e. each fail-open case of 1h; the env overrides, including invalid values ignored;
   f. mutation bench as in B3a and B4: break the threshold comparison (`>=` versus `>`), the once-per-session marker, the sidechain filter, the source precedence, the shell-operator check, the basename check; every mutant must be killed. Report the count.

3. Real check without registration: pipe a hand-written PreToolUse JSON whose `transcript_path` is the real transcript of item 0 into `node frontend/scripts/hooks/context-ceiling.mjs`, once with default thresholds and once with `JJODEL_CONTEXT_SOFT` below the measured context, and paste both answers and the measured value in the entry.

## Gates

The new test file, then all of `scripts/hooks`, through `run-quiet.mjs`; `typecheck:scripts` exit 0; `check:scripts` PASS; `check:triggers` PASS; `check:docs` after the docs commit.

## Commits (P13, RC-17), explicit pathspecs

Commit 1, `feat(harness): context-ceiling hook for lane sessions (P-2026-10-18-1528)`: `context-ceiling.mjs`, `contextCeiling.test.ts`, and `lib.mjs` only if a shared helper is genuinely needed there (say why in the entry). Trailer `Model:` (P6).

Commit 2, docs: the discovery report of item 0, `docs/harness/gates.md` (one or two lines: the hook, its thresholds, that it is not registered until B7 and that `JJODEL_LANE_LOG` arrives with B8a), the log entry in `docs/log-inbox/harness.md` («Decisions taken (unattended)» and «Decisions awaiting Alfonso» at the end; the latter names the registration in B7 and the decisions row for the ratified thresholds, carried by B8c), and the Status flip of this prompt. No push, no merge (RC-19).

## HARD STOP

Item 0 as stated. Otherwise stop with `Outcome: question` only if `check:scripts` or another gate requires registering the new hook in a file outside this DOVE: give the measured requirement and the recommended way out.

## NON FARE

Do not touch `.claude/`, the root `CLAUDE.md`, any nested `CLAUDE.md` or `AGENTS.md`, `docs/PROTOCOL.md`, `docs/decisions.md`, `lane-run.mjs`, the other hooks, `docs/harness/rule-triggers.json`. Do not register the hook. Do not modify any file under `~/.claude/` or `~/.jjodel-lanes/` (read only). No `git add .`, no `git stash`, no `git reset --hard`.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §7.3, §7.5; `frontend/scripts/hooks/rule-trigger.mjs`, `critical-zone.mjs`, `lib.mjs` and their tests; `docs/harness/gates.md`; `docs/decisions.md` RC-16, RC-17, RC-19, RC-20, RC-21, RC-25, RC-26, RC-29, RC-36, RC-49, RC-50; `docs/PROTOCOL.md` P6, P13, P14, P16.
