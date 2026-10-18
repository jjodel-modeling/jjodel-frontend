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
Time limit: 60 minutes (RC-20). Priority if time runs short: items 1, 2, 5A, 5B; then 3, 4, 5C, 5D; an item not reached becomes a ticket in the entry. Output discipline (CLAUDE.md §0.1): tests through `run-quiet.mjs`.

## Context (do not redo the analysis)

B4 (`rule-trigger.mjs`, `71a932b8f`) and B8b (`context-ceiling.mjs`, `1293f152d`) are on the trunk, tested, and registered nowhere: today they deny nothing. B3a (`111376b99`) made `lane-run` read `env.JJODEL_LIGHT_MODEL` from the worktree's `.claude/settings.json` and fall back to the constant `claude-sonnet-5-5` with a printed line «settings env not set, B7». `Explore` already runs on Sonnet through the override `.claude/agents/Explore.md` (B0, `6e910eb68`); `explorer.md` has `model: sonnet`.

Facts of the two hooks that the proof depends on (read their headers, do not re-derive):
- `context-ceiling.mjs` takes `JJODEL_CONTEXT_SOFT` and `JJODEL_CONTEXT_HARD` only when **both** are positive integers and soft < hard; otherwise 200,000 / 250,000. It measures from `transcript_path`, or `JJODEL_LANE_LOG` when set. A lane session is one whose `session_id` is in `<root>/<dir>/session.txt`, root `~/.jjodel-lanes` or `JJODEL_LANES_DIR`. Interactive: one `deny` at soft, no hard stop. Lane: one `deny` at soft, then at hard `deny` everything except the handoff writes and a lone `git status`/`git diff`. The soft marker is `$TMPDIR/jjodel-context-ceiling-<session_id>.json`.
- `rule-trigger.mjs` denies the first write of a session under a glob of `docs/harness/rule-triggers.json` (eight entries, e.g. `frontend/src/styles/**` → `frontend/src/styles/CLAUDE.md`), then allows that entry for the session.

The condition of RC-49 (3) on `general-purpose` («after the B1 measurement») is read by the chat as: B1 is merged and `lane-usage.mjs` reports subagent tokens per model apart from the main session, so the switch is measurable before and after. Decision of the chat under RC-25, vetoable by Alfonso; name it in the entry.

## COSA

1. **Hooks.** In `.claude/settings.json`, `hooks.PreToolUse`:
   - in the existing `Edit|Write|NotebookEdit` entry, add `rule-trigger.mjs` after `critical-zone.mjs`, same invocation form (`node "$CLAUDE_PROJECT_DIR/frontend/scripts/hooks/<file>"`) and `timeout: 10`;
   - add a new entry, matcher `*`, with `context-ceiling.mjs` in the same form, `timeout: 10`.
   Change nothing else in `hooks`, `permissions`, `model` or `effortLevel`.
2. **AM-1 keys.** Add a top-level `env` object with `JJODEL_LIGHT_MODEL: "claude-sonnet-5-5"` and `JJODEL_REPORT_MODEL: "claude-haiku-5-5"`. Nothing else in `env`: never `JJODEL_CONTEXT_*` (they belong to a launch, not to the project). Check that `lane-run` now reads the key: the `laneRunRouting` suite stays green, and `node frontend/scripts/lane-run.mjs` in a dry form that prints the light model, if one exists, no longer prints the «settings env not set» line; if no dry form exists, say so and do not add one.
3. **`explorer.md` and the model name.** Check in the official Claude Code documentation (subagents page; the `claude-code-guide` agent may fetch it) whether an agent's `model` field accepts a full model ID or only an alias. If it accepts the full ID, set `model: claude-sonnet-5-5` in `.claude/agents/explorer.md`, so that the file names exactly the value of `JJODEL_LIGHT_MODEL` (AM-1); apply the same line to `Explore.md` and to the file of item 4 for consistency (declared extension of DOVE). If only aliases are accepted, change nothing in `explorer.md` and write the finding in the entry. Either way the AM-1 test that compares agent files with the settings keys is not written here: it is a ticket for B8c.
4. **`general-purpose` on Sonnet.** First run `npm run lane:usage -- --all --json` (from `frontend/`) and check that the lanes closed after the B1 merge carry subagent tokens per model apart from the main session. If they do: record in the entry the subagent totals per model over those lanes (the «before»), then add `.claude/agents/general-purpose.md`, following the pattern of `Explore.md`: same name as the built-in, `model` as decided in item 3, no `tools` line (it keeps every tool), no `disallowedTools`, a short body that states its purpose (multi-step research and tasks for the main session, reporting conclusions with `path:line`) and the output-budget rules as in `explorer.md`. Verify in the documentation that a project agent with a built-in's name overrides it; if the documentation says otherwise, do not add the file and stop the item with a ticket. If `lane-usage` does not separate subagents by model, do not add the file: ticket.
5. **Proofs.** The hooks are read at session start: every proof runs in a **new** session in `~/jjodel-w-b7`. Record session id, the exact first line of each denial reason and the marker files.
   - **5A, ceiling, interactive (required).** Alfonso opens a second terminal and runs `JJODEL_CONTEXT_SOFT=20000 JJODEL_CONTEXT_HARD=5000000 claude` in `~/jjodel-w-b7`, then asks: «run git status and report». Expected: the first tool call is denied by `context-ceiling` with the interactive reason; the marker `$TMPDIR/jjodel-context-ceiling-<session_id>.json` exists; a second tool call in the same session is allowed. Then, in the same session: «create frontend/src/styles/_b7_probe.scss with one comment line; if a hook denies it, do not retry». Expected: `deny` from `rule-trigger` naming `frontend/src/styles/CLAUDE.md`, and no file created. Alfonso pastes the two denials into this session, or this session reads them from that session's transcript under `~/.claude/projects/`.
   - **5B, ceiling, lane branch, hard stop (required).** From this session, with Alfonso approving the `ask`: generate a UUID, create `/tmp/b7-lanes/P-B7-PROOF/session.txt` holding it, and run `JJODEL_LANES_DIR=/tmp/b7-lanes JJODEL_CONTEXT_SOFT=20000 JJODEL_CONTEXT_HARD=30000 claude -p --session-id <uuid> --output-format stream-json --verbose "Run git log -1 --oneline, then read the first 5 lines of frontend/package.json." > /tmp/b7-proof-b.jsonl`. Both tools are allowed by the settings without the hook, so expected: both calls denied with the hard reason (handoff only), nothing returned from either. Count the denials in the jsonl and quote one reason line. If a hook of this session denies the launch itself, do not work around it: give Alfonso the exact command to run in his own terminal and read the jsonl afterwards.
   - **5C, negative (required).** A fresh `claude` session with no `JJODEL_CONTEXT_*` set runs one tool call without any ceiling denial, and `lane-run` prints no «settings env not set» line (item 2).
   - **5D, subagents (if item 4 applied).** In the 5C session, call the `general-purpose` agent and the `Explore` agent on a trivial search; in that session's transcript the sidechain `assistant` events carry `message.model` = `claude-sonnet-5-5`. Quote the two values.
   Remove `/tmp/b7-lanes`, `/tmp/b7-proof-b.jsonl` and the markers of the proof sessions afterwards.
6. **Gates.** JSON of `.claude/settings.json` parses; `scripts/hooks` suite through `run-quiet.mjs` green at the B8b baseline (885 + any change); `npm run check:triggers` PASS; `typecheck:scripts` 0; `check:scripts` PASS; `check:docs` PASS on the docs commit.

## DOVE

`.claude/settings.json`; `.claude/agents/explorer.md`; `.claude/agents/general-purpose.md` (new, item 4); `.claude/agents/Explore.md` only under item 3. Docs commit: `docs/harness/gates.md` (the two hooks registered, the env keys, the agent models), `docs/log-inbox/harness.md`, the Status flip of this prompt.

## COME

Commit 1, `chore(harness): register rule-trigger and context-ceiling, AM-1 env (P-2026-10-18-1655)`: the `.claude/` files only, explicit pathspec. Subject under 72 characters without the suffix (§6.2), trailer `Model:` (P6).
Commit 2, docs: the files above. The log entry carries the proofs (5A..5D with session ids and reason lines), the «before» of item 4, «Decisions taken (unattended)» (the reading of RC-49 (3), the model-name choice) and «Decisions awaiting Alfonso» (B8c: thresholds 200k/250k and the text of AM-8 and AM-9; the AM-1 agent-model test). No push, no merge (RC-19): the chat writes the merge prompt.

## HARD STOP

Stop with `Outcome: question` if: the existing hook entries cannot be extended without changing their form; 5A or 5B does not deny (do not tune thresholds or hook code to make it pass: the hook is out of scope; report what the hook received, from its own input if you can log it to `/tmp`, and stop); a hook denies a call it should allow in 5C.

## NON FARE

No edit to any file under `frontend/scripts/` (hooks, `lane-run.mjs`, tests); no `JJODEL_CONTEXT_*` in settings; no change to `permissions`; no other agent file; no B8a or B8c work.

## RIFERIMENTI

Report §5.4 (AM-1), §7.3 (AM-8), §7.5 (B7); `docs/decisions.md` RC-16, RC-19, RC-20, RC-25, RC-29, RC-36, RC-49, RC-50; prompts P-2026-10-17-1945 (B0, the interactive precedent), P-2026-10-18-1205 (B3a), P-2026-10-18-1420 (B4), P-2026-10-18-1530 (B8b); headers of `frontend/scripts/hooks/context-ceiling.mjs` and `rule-trigger.mjs`; `docs/harness/rule-triggers.json`.
