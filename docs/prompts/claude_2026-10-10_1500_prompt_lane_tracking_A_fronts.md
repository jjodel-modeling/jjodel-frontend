# Lane tracking A: front registry, Check E, P13 and HARNESS-DOCS text

Prompt-ID: P-2026-10-10-1500
Chat: C-2026-10-10-1256
Request: https://claude.ai/code/session_01FCFNYi6n4pLBgcbMduJcJe
Lane: full (more than 3 files; amends P13, a governance file)
Depends: P-2026-10-10-1330
Front: harness
Status: eseguito 2026-10-10, lane P-2026-10-10-1500 (lane-tracking, code 73af7bbac, docs 8ab16688f); no visual check (harness)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-lanetrack`, branch `lane-tracking`, the same tree as the discovery (its report is
commit `6ec3c3f8e`). Before anything else: print `pwd`, branch, `git log -3 --oneline`, `git status`. The tree
must be clean and the branch must be `lane-tracking`. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1500 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context

Read first `docs/discovery/discovery_2026-10-10_lane_tracking_github_projects.md` (P-2026-10-10-1330).
The chat adopted every `Recommended:` of its §9 (questions 1 to 18) under RC-21/RC-25, with one change
of facts: **no front has a dedicated Project.** Org Project 1 «StandAlone Editor» belongs to Juri and is
never touched. All lanes go to one board. Alfonso said yes to §8 B (the P13 amendment) and §8 C (the
bootstrap). The bootstrap is done (chat, 2026-10-10 14:56, measured):

- private repo `jjodel-modeling/jjodel-lanes`, issues enabled;
- org Project 2 renamed «Jjodel Lanes», linked to that repo, Status options Backlog, Ready, In progress,
  In review, Done (field id `PVTSSF_lADODDPcqs4Bmcp_zhlFrNM`);
- repo milestones, one per front: 1 `maintenance`, 2 `harness`, 3 `codegen-pilot`, 4 `simulator`,
  5 `standalone-editor`, 6 `graphvertex`, 7 `release-3-2` (due 2026-10-26);
- repo labels `waiting:phase-2`, `waiting:visual`, `waiting:question`, `blocked`, `outcome:unparsed`,
  `closure-owed`.

This lane (A) makes the front a declared, checked field. Lane B (a later prompt) adds the GitHub
projection to `lane-run`. **This lane makes no GitHub call and does not touch `lane-run.mjs`.**

## COSA

1. **`docs/harness/fronts.json`** (new). Shape from report §4.6, plus a board block and milestone numbers:
   `{ "v": 1, "board": { "owner": "jjodel-modeling", "project": 2, "repo": "jjodel-modeling/jjodel-lanes" },
   "fronts": [ { "slug", "title", "exit", "state", "openedOn", "milestone" } ] }`, with `closedOn` only on a
   closed front. Seed the seven fronts above, `openedOn` 2026-10-10, titles and exits from report §4.6 table
   (the `standalone-editor` exit stays the jjodel-frontend issue list; it has no `project`). No closed fronts.
   No inbox mapping (question 12).
2. **`frontend/scripts/lane-tracking.mjs`** (new, name verified free by the report). In this lane only the
   pure part, importable without side effects: `loadFronts(repoRoot)`, `parseFrontLine(promptText)` and
   `frontProblem(promptText, promptId, fronts)` returning `null` or a one-line reason (missing, unknown slug,
   closed front for a prompt dated after `closedOn`). Merge prompts rendered by `lane-run` are exempt, by the
   same test the existing `Depends:`/`Request:` exemptions use (find it, cite it). The cut-off constant
   `FRONT_FROM = 'P-2026-10-10-1500'` (question 8): prompts with a lower Prompt-ID are never checked.
3. **Check E** in `check-docs.ts` (find its path; the report cites the gates directory): every prompt in
   `docs/prompts/` at or after `FRONT_FROM` passes `frontProblem`, imported from `lane-tracking.mjs`
   (question 11; verify the `allowJs` path the report proposes actually resolves, positive control included).
   Fails closed, one line per offending prompt.
4. **Tests** for `frontProblem` and `parseFrontLine` in the scripts' existing test location and style: each
   failure kind, the merge exemption, the cut-off, a closed front before and after `closedOn`. Run them on
   a mutation bench (CLAUDE.md §5): drop the cut-off, drop the exemption, invert the `closedOn` comparison;
   each must kill at least one test. Report the bench in the commit body.
5. **`docs/PROTOCOL.md` P13**: one new bullet after the `Request:` bullet, «Every prompt names its front»:
   `Front: <slug>` from `docs/harness/fronts.json`, a front is a milestone-like unit of work with a
   verifiable exit, `maintenance` and `harness` are permanent, merge prompts are exempt, new from
   P-2026-10-10-1500 and earlier prompts are not amended, checked by Check E and later by `lane-run start`.
   Plus one clause where P13 or `PROTOCOL.md:423` (the report's line) talks about `go --front <inbox>`:
   that `--front` names a log inbox, not a front of the registry (question 12; no rename, rule 2).
   When the chat opens a front: a verifiable exit, at least three lanes expected, its own ratification
   series or branch, no overlap with an open front; the chat decides with `Recommended`, Alfonso can veto
   in the digest. Closing a front: `state: closed` plus `closedOn`, its milestone closed by lane B's sync.
6. **`docs/HARNESS-DOCS.md` §4.1**: the header field list gains `Front:`, one line, pointing to P13.
7. **`docs/decisions.md`**: one row in the process series, next free RC number (grep, positive control),
   dated 2026-10-10: «Lanes declare a front (`Front:` in the P13 header, registry `docs/harness/fronts.json`).
   One GitHub board for all lanes, org Project 2 «Jjodel Lanes», cards are issues of the private repo
   `jjodel-lanes`, a front is a milestone of that repo. No dedicated Project per front for now; Project 1
   is not ours. The chat opens a front on four criteria (P13) and Alfonso can veto. Discovery
   P-2026-10-10-1330, this lane P-2026-10-10-1500.» Follow the row format of the neighbouring RC rows.
8. **Status flip of the discovery prompt** `docs/prompts/claude_2026-10-10_1330_prompt_lane_tracking_github_discovery.md`
   in this lane's closure commit: `Status: eseguito 2026-10-10, lane P-2026-10-10-1330 (lane-tracking,
   discovery 6ec3c3f8e), hard stop; Phase 2 in P-2026-10-10-1500`.

## Gates
`npm run check:docs` (Check E green on this very prompt, red on a scratch copy with the `Front:` line
removed, then delete the copy), `npm run check:scripts`, the new tests, `npm run typecheck` against the
baseline of 14. Code and docs in separate commits (P13); commit with a pathspec.

## HARD STOP
No visual check is due. Close the lane yourself: code commit, docs commit, closure commit with the log
entry in the `harness` inbox and the two Status flips (this prompt and item 8). Exit `Outcome: done`.
Stop with `Outcome: question` if Check E would turn any prompt dated at or after the cut-off red other than
a deliberate test copy, or if the `allowJs` import does not resolve.

## NON FARE
- No GitHub call of any kind. No change to `lane-run.mjs` or to `frontend/scripts/lane-board/`.
- No `Front:` line added to past prompts.
- No new dependency.

## RIFERIMENTI
Report P-2026-10-10-1330 §4.3, §4.4, §4.6, §5, §9; `docs/PROTOCOL.md` P13, P16; `docs/HARNESS-DOCS.md`
§4.1; CLAUDE.md §5 (mutation bench), §17 (gates); RC-15, RC-21, RC-25, RC-42, RC-43.
