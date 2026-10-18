# B8c: normative text of AM-8 and AM-9, and the AM-1 agent-model test

Prompt-ID: P-2026-10-18-2125
Chat: C-2026-10-18-2125
Front: harness
Lane: full (governance: `docs/decisions.md`, `docs/PROTOCOL.md` and a test under `frontend/scripts/hooks/`, RC-36; heavy by rule, not drawn)
Status: eseguito 2026-10-18 · lane context-rules · b571ea5cc
Depends: P-2026-10-18-2056
Corregge: the sentinel `check:docs` accepts (RC-45 (2)); this lane corrects no earlier lane
Request: none (Alfonso, 2026-10-18 21:22, in the project chat: open the harness front as heir of C-2026-10-18-1750, next step B8c, Lane full, tier heavy)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply: Phase 1 is `docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §5.4 (AM-1), §7.3 (AM-8), §7.4 (AM-9), §7.5 (B8c); one-session lane. P8 does not apply, no UI.

Worktree: `~/jjodel-w-b8c`, branch `context-rules`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high` (AM-7: no critical zone, no visual bug). Launched with `--tier heavy` (governance, RC-36; not an RC-45 draw).

## Lane discipline

Every reply opens with `[P-2026-10-18-2125 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes (RC-20). Priority if time runs short: item 1, then 3, then 2, then the gates; an item not reached becomes a ticket in the entry. Output discipline (CLAUDE.md §0.1): tests through `run-quiet.mjs`; read `docs/decisions.md` and `docs/PROTOCOL.md` with Read and `offset`/`limit`, never whole.

## Context (do not redo the analysis)

RC-49 (5) accepted AM-8 (a context ceiling per session) and AM-9 (one slice per session) in principle and left thresholds and text to a later ratification. Alfonso ratified the thresholds, soft 200,000 and hard 250,000 tokens, on 2026-10-18 at 15:26. The hook exists and is registered: B8b built `frontend/scripts/hooks/context-ceiling.mjs` (`1293f152d`), B7 registered it with matcher `*` (merge `b93c3fd46`). It measures from `transcript_path`, or `JJODEL_LANE_LOG` when set; in a lane session it denies once at soft with the handoff instruction and denies everything but the handoff at hard; in an interactive session it denies once at soft and has no hard stop. Its header comment still calls the thresholds a proposal.

B8a is not done: `lane-run` has no `resume --fresh`, no `next`, no slice refusal, and exports no `JJODEL_LANE_LOG`. The rows must not describe those commands as available today.

AM-1 (approved by RC-49) says agent and skill files that name a model are checked equal to the three IDs in `.claude/settings.json` by a test. `laneRunRouting.test.ts` covers what `lane-run` reads from settings; nothing reads `.claude/agents/*.md`. Today `Explore.md`, `explorer.md` and `general-purpose.md` name `claude-sonnet-5-5`; `settings.json` has `model` `claude-opus-5-5`, `env.JJODEL_LIGHT_MODEL` `claude-sonnet-5-5`, `env.JJODEL_REPORT_MODEL` `claude-haiku-5-5`.

Next free decision numbers: RC-51 and RC-52 (RC-50 is the highest on every local and remote ref, measured by the chat at 21:23). Measure again before writing, with `git show <ref>:docs/decisions.md` over all refs, and shift both if one is taken.

## COSA

1. `docs/decisions.md`, two rows after RC-50, same format as RC-49 and RC-50 (date, ratification source, evidence, verified, reversible, bold title, text):

   a. **RC-51 (AM-8): every session has a context ceiling.** Ratified by Alfonso, thresholds on 2026-10-18 15:26, text RC-49 (5) plus this lane. Text, adapted from report §7.3 to what exists: the measure (input plus cache read plus cache creation of the latest main call, from `transcript_path` or the lane log); soft 200,000: the session finishes its step, writes `handoff.md` and `handoff.diff` in the lane folder with the six sections, ends with `Outcome: hard-stop`; hard 250,000: the hook denies everything except the handoff writes and `git status`/`git diff`; interactive sessions get the soft deny only; thresholds change only by a ratified row, recalibrated on B1 measurements; a drawn lane (RC-45) keeps its tier; RC-20's time limit stays; the architect side is RC-50. Continuation: from B8a, `lane-run resume --fresh <Prompt-ID>` from `handoff.md`; **until B8a, the chat continues a ceiling-stopped lane as a new lane, with a new Prompt-ID whose prompt cites the stopped lane's `handoff.md` and declares `Depends:` on it, never by a plain `resume` of the stopped session** (decided by the chat, unattended, RC-25: a plain resume reopens above soft and hits the hard stop within a few calls).

   b. **RC-52 (AM-9): one slice per session.** Text of report §7.4, base paragraph: slices declared by `## Slice <n>` or a `Slices:` header, slice n+1 from the committed result of slice n, never from its transcript; `resume` stays for answering a question and for the GO of the same slice. Mark the mechanism as in force from B8a; until then the chat writes one prompt per slice (`lane-run chain` already runs separate prompts one per session). Then the option of report §7.4 in a separate sentence: Phase 2 after a Phase 1 hard stop, and a rework after a failed visual GO, are new slices and start fresh from the committed report or Phase 2 prompt. Mark this sentence `provisional, unattended (memo 2026-10-17 §2)`: it amends RC-20, which Alfonso ratified, so under RC-26 it waits for his yes; until then RC-20 holds for those two cases. Name it in «Decisions awaiting Alfonso».

2. `docs/PROTOCOL.md`: P16 gains two bullets, «Context ceiling (RC-51)» and «One slice per session (RC-52)», one or two lines each, citing the rows rather than copying them. P13 gains the header clause for slices (`Slices:` or `## Slice <n>`), one line. Bump the version line if the file has one. No other clause changes.

3. `frontend/scripts/hooks/__tests__/agentModels.test.ts` (new), the AM-1 test:
   a. Read `.claude/settings.json` from the repo root; the three IDs must be present and well formed (`claude-` prefix, no spaces).
   b. Every `.claude/agents/*.md` and `.claude/skills/*/SKILL.md` whose frontmatter has `model:` names one of the three IDs. The read-only agents `Explore`, `explorer` and `general-purpose` name exactly `env.JJODEL_LIGHT_MODEL` (RC-49 (7) and B7).
   c. Negative cases on temp fixtures (no new fixture files): a stale ID, a missing `env` key, a read-only agent on the heavy ID; each must fail with a message that names the file and the expected ID.
   d. Mutation bench as in B8b: break the set membership, the read-only rule, the frontmatter parser (a `model:` in the body, not the frontmatter, must not count); every mutant killed. Report the count.

4. `frontend/scripts/hooks/context-ceiling.mjs`: header comment only, the sentence that calls the thresholds a proposal becomes «ratified by RC-51 (2026-10-18)». No logic change; `contextCeiling.test.ts` must stay green unchanged.

5. `docs/harness/gates.md`, section «Context ceiling»: the thresholds now cite RC-51, the registration cites B7; add one line for the AM-1 test under the existing gates.

## DOVE

`docs/decisions.md` (two rows only), `docs/PROTOCOL.md` (P13, P16, version line), `frontend/scripts/hooks/__tests__/agentModels.test.ts` (new), `frontend/scripts/hooks/context-ceiling.mjs` (header comment), `docs/harness/gates.md`, `docs/log-inbox/harness.md`, this prompt's Status line. Nothing else. `CLAUDE.md`, `AGENTS.md` and the normative text of AM-1, AM-5, AM-7 belong to B2b, not here.

## Gates

`agentModels.test.ts`, then all of `scripts/hooks`, through `run-quiet.mjs`; `typecheck:scripts` exit 0; `check:scripts` PASS; `check:triggers` PASS; `check:docs` after the docs commit. Real check: run the new test against the actual `.claude/` of the worktree (it is the test's default input) and report the files it covered.

## Commits (P13, RC-17), explicit pathspecs

Commit 1, `test(harness): agent and skill model IDs equal the settings (AM-1, P-2026-10-18-2125)`: `agentModels.test.ts` and the comment in `context-ceiling.mjs`. Trailer `Model:` (P6).

Commit 2, docs: the two rows, `PROTOCOL.md`, `gates.md`, the log entry in `docs/log-inbox/harness.md` («Decisions taken (unattended)» names the until-B8a continuation rule of RC-51; «Decisions awaiting Alfonso» names the RC-20 amendment of RC-52 and anything else the lane finds), and the Status flip of this prompt. No push.

## NON FARE

No change to `lane-run.mjs` or its tests (B8a). No change to hook logic or thresholds. No `CLAUDE.md`. No rewording of RC-20, RC-49 or RC-50 beyond what item 1b states.

## HARD STOP

None planned. Stop with `Outcome: question` only if a decision number is taken on some ref and shifting it would change a citation already on the trunk, or if `check:docs` rejects the row format in a way that needs a format change.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-15_lean_context_model_routing.md` §5.4, §7.3, §7.4, §7.5; `docs/ratifiche/claude_2026-10-17_memo_harness_front_fable_trial.md` §2; `docs/decisions.md` RC-20, RC-49, RC-50; `docs/prompts/claude_2026-10-18_1530_prompt_b8b_context_ceiling.md`; `docs/prompts/claude_2026-10-18_1655_prompt_b7_hook_registration.md`.
