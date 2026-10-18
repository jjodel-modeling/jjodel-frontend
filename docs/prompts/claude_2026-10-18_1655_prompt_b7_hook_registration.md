# B7: register rule-trigger and context-ceiling, AM-1 settings keys, subagents on Sonnet

Prompt-ID: P-2026-10-18-1655
Chat: C-2026-10-18-1655
Front: harness
Lane: full (RC-3: `.claude/settings.json` changes the behaviour of every session; protected path, RC-36)
Status: da eseguire
Depends: P-2026-10-18-1420, P-2026-10-18-1530
Corregge: the sentinel `check:docs` accepts (RC-45 (2)); this lane corrects no earlier lane
Request: Alfonso, 2026-10-18 16:50, «Il prossimo passo è B7, una sessione interattiva che lancio io. Preparami il prompt»

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply: Phase 1 is `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §5.4 (AM-1), §7.3, §7.5 (B7). P8 does not apply, no UI.

Worktree: `~/jjodel-w-b7`, branch `hook-registration`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and `git status` (clean). Otherwise stop with `Outcome: blocked`.

Mode: interactive session (RC-19, RC-36: `.claude/` is never edited in bypass). Alfonso launches `claude` in `~/jjodel-w-b7` and answers the `ask` prompts. Not launched through `lane-run`: no `tier.txt`, no draw. Model `claude-opus-5-5` as pinned (RC-16), effort `high` (AM-7).

## Lane discipline

Every reply of this session opens with `[P-2026-10-18-1655 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Time limit: 45 minutes (RC-20). Priority if time runs short: items 1, 2, 5; then 3, 4; an item not reached becomes a ticket in the entry. Output discipline (CLAUDE.md §0.1): tests through `run-quiet.mjs`.

## Context (do not redo the analysis)

B4 (`rule-trigger.mjs`, `71a932b8f`) and B8b (`context-ceiling.mjs`, `1293f152d`) are on the trunk, tested, and registered nowhere: today they deny nothing. B3a (`111376b99`) made `lane-run` read `env.JJODEL_LIGHT_MODEL` from the worktree's `.claude/settings.json` and fall back to the constant `claude-sonnet-5-5` with a printed line «settings env not set, B7». `Explore` already runs on Sonnet through the override `.claude/agents/Explore.md` (B0, `6e910eb68`); `explorer.md` has `model: sonnet`.

Facts of the two hooks that the proof depends on (read their headers, do not re-derive):
- `context-ceiling.mjs` takes `JJODEL_CONTEXT_SOFT` and `JJODEL_CONTEXT_HARD` only when **both** are positive integers and soft < hard; otherwise 200,000 / 250,000. It measures from `transcript_path`, or `JJODEL_LANE_LOG` when set. A lane session is one whose `session_id` is in `<root>/<dir>/session.txt`, root `~/.jjodel-lanes` or `JJODEL_LANES_DIR`. Interactive: one `deny` at soft, no hard stop. Lane: one `deny` at soft, then at hard `deny` everything except the handoff writes and a lone `git status`/`git diff`. The soft marker is `$TMPDIR/jjodel-context-ceiling-<session_id>.json`.
- `rule-trigger.mjs` denies the first write of a session under a glob of `docs/harness/rule-triggers.json` (eight entries, e.g. `frontend/src/styles/**` → `frontend/src/styles/CLAUDE.md`), then allows that entry for the session.

Proofs already run by the chat (2026-10-18 17:00 to 17:03, `claude` 2.1.302, Opus 5.5, hooks loaded for those sessions only through `claude -p --settings /tmp/b7proof/settings2.json`; evidence in `/tmp/b7proof/`, `*.jsonl`, `*.sid`, `hookin.log`, scripts `run.sh` and `run2.sh`). Quote them in the log entry; do not redo them:
- Soft, no lane folder (session `7bb59722-f1ef-4e8c-bc21-0f30c31e46b6`, soft 20000): call 1 allowed, call 2 denied «context-ceiling: this session's context is 42103 tokens, at or above the soft ceiling of 20000 (AM-8). Start no new work...»; marker `/tmp/jjodel-context-ceiling-<sid>.json` written.
- Hard, fake lane folder (session `7b143af0-a4fd-402c-a557-5cf7708b77a3`, 20000/30000, three sequential calls): `git log` allowed (call 1), lone `git status` allowed (handoff exception), Read denied «context-ceiling: this session's context is 46775 tokens, at or above the hard ceiling of 30000 (AM-8). Every tool is denied except Read, Write or Edit of .../handoff.md...».
- rule-trigger (session `0ff84010-0167-4696-9aa7-f269c1d87872`): Write of `frontend/src/styles/_b7_probe.scss` denied naming `frontend/src/styles/CLAUDE.md`; no file created.
- Negative (session `cd7fab95-295a-4d21-9345-9de7370d6b50`, no thresholds): no denial.
- Subagents in that session: `Explore` (project override `Explore.md`, `model: sonnet`) and `general-purpose` (defined with `--agents` and `"model": "claude-sonnet-5-5"`) both ran `message.model` = `claude-sonnet-5-5`. So the agent `model` field accepts the full ID, and a project agent with a built-in's name overrides it.
- **Finding, against the B8b entry.** Under `claude -p` the hook measures with a lag of one call: at the first PreToolUse of a fresh session the transcript file does not exist yet (the hook fails open), and at call n the transcript holds the `assistant` events of calls 1..n-1 only (`hookin.log`: 0, 1, 2 lines at calls 1, 2, 3). B8b recorded that the current call's event is on disk; that was measured on an interactive transcript and does not hold here. Effects: the first call of a fresh session is never stopped; tool calls issued in parallel in one message are all measured on the previous call; the overshoot is one call, about 2.5k tokens. Not fixed here (no hook code, NON FARE): it is a ticket for B8a, where `JJODEL_LANE_LOG` (the stream-json log written live by the wrapper) should not have the lag; B8a measures it.

The condition of RC-49 (3) on `general-purpose` («after the B1 measurement») is read by the chat as: B1 is merged and `lane-usage.mjs` reports subagent tokens per model apart from the main session, so the switch is measurable before and after. Decision of the chat under RC-25, vetoable by Alfonso; name it in the entry.

## COSA

1. **Hooks.** In `.claude/settings.json`, `hooks.PreToolUse`:
   - in the existing `Edit|Write|NotebookEdit` entry, add `rule-trigger.mjs` after `critical-zone.mjs`, same invocation form (`node "$CLAUDE_PROJECT_DIR/frontend/scripts/hooks/<file>"`) and `timeout: 10`;
   - add a new entry, matcher `*`, with `context-ceiling.mjs` in the same form, `timeout: 10`.
   Change nothing else in `hooks`, `permissions`, `model` or `effortLevel`.
2. **AM-1 keys.** Add a top-level `env` object with `JJODEL_LIGHT_MODEL: "claude-sonnet-5-5"` and `JJODEL_REPORT_MODEL: "claude-haiku-5-5"`. Nothing else in `env`: never `JJODEL_CONTEXT_*` (they belong to a launch, not to the project). Check that `lane-run` now reads the key: the `laneRunRouting` suite stays green, and `node frontend/scripts/lane-run.mjs` in a dry form that prints the light model, if one exists, no longer prints the «settings env not set» line; if no dry form exists, say so and do not add one.
3. **`explorer.md` and the model name.** The proofs above show that the agent `model` field accepts the full ID. Set `model: claude-sonnet-5-5` in `.claude/agents/explorer.md` and `.claude/agents/Explore.md`, and use it in the file of item 4, so that every agent file names exactly the value of `JJODEL_LIGHT_MODEL` (AM-1). The AM-1 test that compares agent files with the settings keys is not written here: it is a ticket for B8c.
4. **`general-purpose` on Sonnet.** First run `npm run lane:usage -- --all --json` (from `frontend/`) and check that the lanes closed after the B1 merge carry subagent tokens per model apart from the main session. If they do: record in the entry the subagent totals per model over those lanes (the «before»), then add `.claude/agents/general-purpose.md`, following the pattern of `Explore.md`: same name as the built-in (the override is proven above), `model: claude-sonnet-5-5`, no `tools` line (it keeps every tool), no `disallowedTools`, a short body that states its purpose (multi-step research and tasks for the main session, reporting conclusions with `path:line`) and the output-budget rules as in `explorer.md`. If `lane-usage` does not separate subagents by model, do not add the file: ticket.
5. **Registration check.** The proofs above loaded the hooks through `--settings`; this item checks that `.claude/settings.json` itself carries them. Copy `/tmp/b7proof/run2.sh` to `/tmp/b7proof/run3.sh`, drop `--settings $P/settings2.json` and the probe hook from it, keep the two runs (lane hard stop with three sequential calls; the Write under `frontend/src/styles/`), add a third run with no thresholds that calls `Agent` with `general-purpose` (only if item 4 added the file), and run it from this session with Alfonso approving the `ask`. Expected: the third call of the lane run denied with the hard reason (the first is never denied, see the finding), the Write denied by `rule-trigger`, no denial in the third run, `general-purpose` sidechain on `claude-sonnet-5-5`. Record session ids and reason lines. Then remove `/tmp/b7proof` and the `/tmp/jjodel-context-ceiling-*` and `/tmp/jjodel-rule-trigger-*` markers of those sessions.
6. **Gates.** JSON of `.claude/settings.json` parses; `scripts/hooks` suite through `run-quiet.mjs` green at the B8b baseline (885 + any change); `npm run check:triggers` PASS; `typecheck:scripts` 0; `check:scripts` PASS; `check:docs` PASS on the docs commit.

## DOVE

`.claude/settings.json`; `.claude/agents/explorer.md`; `.claude/agents/general-purpose.md` (new, item 4); `.claude/agents/Explore.md` only under item 3. Docs commit: `docs/harness/gates.md` (the two hooks registered, the env keys, the agent models), `docs/log-inbox/harness.md`, the Status flip of this prompt.

## COME

Commit 1, `chore(harness): register rule-trigger and context-ceiling, AM-1 env (P-2026-10-18-1655)`: the `.claude/` files only, explicit pathspec. Subject under 72 characters without the suffix (§6.2), trailer `Model:` (P6).
Commit 2, docs: the files above. The log entry carries the chat's proofs (from the Context), the registration check of item 5, the «before» of item 4, the one-call lag as a ticket for B8a, «Decisions taken (unattended)» (the reading of RC-49 (3)) and «Decisions awaiting Alfonso» (B8c: thresholds 200k/250k and the text of AM-8 and AM-9; the AM-1 agent-model test). No push, no merge (RC-19): the chat writes the merge prompt.

## HARD STOP

Stop with `Outcome: question` if: the existing hook entries cannot be extended without changing their form; the registration check does not deny where expected (do not tune thresholds or hook code to make it pass: the hook is out of scope; report what the hook received, from its own input if you can log it to `/tmp`, and stop); a hook denies a call it should allow in the run with no thresholds.

## NON FARE

No edit to any file under `frontend/scripts/` (hooks, `lane-run.mjs`, tests); no `JJODEL_CONTEXT_*` in settings; no change to `permissions`; no other agent file; no B8a or B8c work.

## RIFERIMENTI

Report §5.4 (AM-1), §7.3 (AM-8), §7.5 (B7); `docs/decisions.md` RC-16, RC-19, RC-20, RC-25, RC-29, RC-36, RC-49, RC-50; prompts P-2026-10-17-1945 (B0, the interactive precedent), P-2026-10-18-1205 (B3a), P-2026-10-18-1420 (B4), P-2026-10-18-1530 (B8b); headers of `frontend/scripts/hooks/context-ceiling.mjs` and `rule-trigger.mjs`; `docs/harness/rule-triggers.json`.
