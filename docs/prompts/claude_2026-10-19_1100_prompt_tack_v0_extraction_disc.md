# Tack v0: inventory of the lane board and extraction plan (Phase 1)

Prompt-ID: P-2026-10-19-1100
Chat: C-2026-10-19-0001
Front: tack
Lane: full (discovery for a new product outside the Jjodel codebase; Phase 1 read-only)
Status: eseguito 2026-10-19 · lane tack-disc · Phase 1 report, docs commit carrying this line · hard-stop, no Phase 2 without GO
Depends: none
Corregge: none (new front)
Request: https://claude.ai/chat/1b373b77-3e1f-4c66-b75e-9eec8a5ba215 (Alfonso, 2026-10-19 10:41, in the project chat: «andiamo avanti», after ratifying the six Tack decisions of the vision document)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 does not apply, no UI change.

Worktree: `~/jjodel-w-tack-disc`, branch `tack-disc`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply opens with `[P-2026-10-19-1100 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole.

## Context (decided in the project chat on 2026-10-19, not to be reopened)

Tack is a planned open-source product (MIT) that turns the Jjodel lane board into a tool usable on any repository. Its thesis: a harness should start from a minimal core and add a feature only when measured signals justify it. Four blocks, all local:

- **Collectors** read git, agent session transcripts and an optional structured log into one event store (SQLite). v0 has only the Claude Code collector; Codex, Antigravity and non-Anthropic models come in later releases.
- **Metrics** compute the board's series: cost per day, outcome, rework, context peaks.
- **Board**: a local web UI, today's lane board with its Jjodel assumptions removed.
- **Harness engine** (after v0): holds the project's harness model (an instance of the Harness metamodel v1.2), checks it against feature constraints, generates the harness files.

**v0 is the monitor alone**, read-only, project-agnostic. It ships when it runs on two repositories that are not Jjodel and shows a useful board **with zero configuration**, from git history and the local Claude Code transcripts.

**Data contract**, three layers, each optional above the first: (1) traces found without adoption: git commits and transcripts; (2) identity: a Prompt-ID per unit of work, in the prompt, the session's first line and a commit trailer; (3) self-assessment: one log entry per unit of work (outcome, `Corregge`, cause from a fixed taxonomy, regressions, scope). Version 1 of the contract is the Jjodel log format of `CLAUDE.md` §21.2 minus the Jjodel-specific fields. **Storage decided: JSON Lines is the source, Markdown is rendered from it.**

Pilots: Jjodel first, eclipse-sprotty/sprotty second, a third without a UI still open (candidate: the Jjodel persistence backend). Maintainers: Alfonso and Juri. Name: Tack, provisional.

## COSA

1. **Inventory.** For `frontend/scripts/lane-board/` (all files), `frontend/scripts/lane-usage.mjs`, `frontend/scripts/lane-tracking.mjs`, the harness health retrospective script if one exists, and the parts of `frontend/scripts/lane-run.mjs` that write data the board reads: list every data source read (path, format, who writes it), every metric computed, every view of the UI. Map each item to one Tack block (collector, metrics, board, harness engine) or mark it out of scope for Tack.
2. **Couplings.** Classify every assumption the code makes, with `file:line`, into exactly one class:
   - **Jjodel domain**: names of Jjodel files, decision series, fronts, critical-zone lists;
   - **harness convention**: Prompt-ID, `Chat:`, `Front:`, `Status:`, log entry format, `log-inbox/`, lane folders;
   - **environment**: macOS paths, `~/.jjodel-lanes`, launchd, a node path, osascript, the worktree layout, port 4700;
   - **Claude Code platform**: transcript location and format, `total_cost_usd`, model ids, usage fields.
   Count per class and per file.
3. **Zero-adoption view.** Decide which board metrics can be computed from git plus transcripts alone, on a repository with no Prompt-ID, no log and no lane folders, and which need layer 2 or 3. Then measure it: list the directory names under `~/.claude/projects/` (names only, no transcript content in the report), pick up to two that belong to repositories other than Jjodel, and compute by hand, with a throwaway script outside the repo, the zero-adoption metrics on them (sessions per day, cost, sessions without a commit in the following hour, context peak). Report the numbers and what was missing to compute each one. If no non-Jjodel transcripts exist, say so and stop item 3 there.
4. **Data contract v1, draft.** In the report only, not as a file: a JSON Schema draft for the identity layer and for one log entry, derived field by field from `CLAUDE.md` §21.2, with a table mapping each current field to kept, renamed (Italian names to English) or dropped as Jjodel-specific (for example `Smoke visivo`, `Layer Impact Report`). State which checks of `check:docs` validate today what the schema would validate, and which would be lost.
5. **Extraction plan.** Propose the layout of the new repository (packages or folders per block), say for each inventoried file whether it is moved, copied and adapted, or rewritten, and order the v0 work into slices, each with an acceptance criterion and a size in files and lines. The last slice's criterion is the v0 criterion above. Say how Jjodel's own board keeps working during and after the extraction.
6. Close the report with «Risks», «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

Write the report to `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md`, with the P4 sections (hypothesis under test, goal, files read with full paths, findings with `file:line` and verbatim quotes, dependencies and risks, open questions). The Phase 1 hard stop is not reached until the report is written.

## DOVE

`docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` (new), `docs/log-inbox/tack.md` (new, one entry), this prompt's `Status:` line. Throwaway scripts for item 3 live under `/tmp` and are not committed.

## Gates

`check:docs` after the commit.

## Commits (P13, RC-17), explicit pathspecs, no push

One commit: `docs(discovery): Tack v0 extraction inventory (P-2026-10-19-1100)`, with the counts of item 2 and the zero-adoption numbers of item 3 in the body. Trailer `Model:` (P6).

## NON FARE

No change to any code, script, lane board file, `decisions.md`, `PROTOCOL.md` or `CLAUDE.md`. No new repository, no clone, no network access. No transcript content (prompts, messages, file contents) in the report or the commit: names, counts and numbers only. No push.

## HARD STOP

End of Phase 1: `Outcome: hard-stop` after the commit. `Outcome: question` only if the inventory cannot be classified from the sources.

## RIFERIMENTI

- `frontend/scripts/lane-board/README.md`
- `CLAUDE.md` §21.2 and §21.3 (log entry format and self-assessment semantics)
- `docs/PROTOCOL.md` P4, P9, P13
- `docs/HARNESS-DOCS.md` §4.5 and §6
- `docs/discovery/discovery_2026-10-10_lane_board_model_insights.md`
- `docs/discovery/discovery_2026-10-18_harness_health_retrospective.md`
