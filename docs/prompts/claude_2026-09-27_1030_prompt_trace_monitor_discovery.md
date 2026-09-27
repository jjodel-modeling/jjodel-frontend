# Trace monitor: lane monitor growing into requirements and traceability (Phase 1, discovery)

Prompt-ID: P-2026-09-27-1030
Chat: C-2026-09-27-1030
Lane: full (new harness tool, exported script interface, more than three files in Phase 2)
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: the rule "one front, one chat" does not apply as written. The harness front belongs to C-2026-09-26-1702; this lane is opened by C-2026-09-27-1030 on Alfonso's request and touches no file that chat has in flight. Declared, not silent.

Worktree: `~/jjodel-trace`, branch `harness-trace`, created from the trunk `alfonso-frontend-jjtl`. Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here (branch tip equal to the trunk tip at creation, clean tree). Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-09-27-1030 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Phase 1 is read-only on source code. The only file you write is the discovery report.

## Context (do not redo the analysis)

Alfonso wants a desktop monitor of the orchestrated lanes (RC-20..24) that reads the sources directly, not through a project chat. The existing "Lane Monitor" artifact is fed by a chat that polls, so it lags and goes dark when the chat is idle. The monitor must then grow into requirements management and traceability. Decisions already taken in chat (provisional, unattended, RC-25):

- D1. Tool shape: a `lane-run monitor` subcommand, Node built-ins only (`http`, `fs.watch`, `child_process`), a local page updated by Server-Sent Events, opened as an app window (`--app=`), macOS notification via `osascript` on an `Outcome` change. No new dependency.
- D2. Every trace link is declared once, in the artifact born later (a prompt header cites its requirement, a commit cites its prompt). Inverse links are computed, never written.
- D3. The trace graph is derived by an indexer, never maintained by hand. The monitor is the live slice of the same graph.
- D4. Requirements live in `docs/requirements/REQ-<n>.md`, written by the project chat from Alfonso's request: statement, rationale, mechanical acceptance criterion, status, optional `Parent: REQ-<m>`. Hierarchy is one level deep only.
- D5. A requirement counts as verified when a measured check (RC-23) satisfies its acceptance criterion, not when a document says so.
- D6. Phases: (1) indexer plus monitor, with the graph node types fixed from day one; (2) requirement files and a `Requirement:` header field in the prompt template; (3) coverage views and export towards the Harness metamodel's `trace` package.

## COSA

Write the discovery report that makes Phase 2 (indexer plus monitor) writable without guesses. Answer, with `file:line` and verbatim quotes:

1. **lane-run.** Where `lane-run.mjs` lives, its subcommands and how it launches `claude` (flags, `--output-format`, where stdout goes). List the real content of `~/.jjodel-lanes/` for at least three lanes (for example P-2026-09-26-1640, P-2026-09-26-1705, P-2026-09-27-0035): file names, formats, who writes each file and when. State whether a live stream of tool calls is on disk. If it is not, say what the smallest change to `lane-run.mjs` would be (for example a `tee` of `stream-json` into the lane folder).
2. **Digest parser.** Whether the decisions digest lane (docs/digest/, 2026-09-27) already has a parser for `docs/decisions.md`. Path, exported functions, test coverage. The indexer should reuse it, not duplicate it.
3. **Trace sources inventory.** For each source, the format and how many items are parseable today:
   prompt headers in `docs/prompts/` (count with `Prompt-ID`, `Chat`, `Lane`, `Status`);
   rows of `docs/decisions.md` (id and date extraction);
   log entries in `docs/claude-code-log.md` and `docs/log-inbox/` (`Prompt document name`, `Corregge`);
   git trailers (`Prompt-ID`, `Claude-Session`, `Model:`) on the trunk since 2026-09-17, with counts and a negative control.
   Report the misses by name, not only the ratio.
4. **Harness metamodel.** Whether the 2026-09-15 design document of the Harness metamodel is in the repo (expected under `docs/archivio/`). If it is, list the classes and references of its trace part. If it is absent, say so and where you searched.
5. **Name collisions.** Global search for `REQ-`, `docs/requirements`, `Requirement:`, `monitor` as a lane-run subcommand, and the candidate port (propose one free among 3004..3010 and say how you checked). Quote the search commands.
6. **Platform.** Node version in use, `fs.watch` recursive support on macOS for that version, and how the monitor finds all worktrees (`git worktree list --porcelain`).
7. **Proposal.** The node and edge types of the index JSON (lane, prompt, chat, decision, commit, log entry, check, requirement), with the source of each edge. The schema of `REQ-<n>.md`. The Phase 2 file list with what changes in each.

Report path and name, mandatory: `docs/discovery/discovery_2026-09-27_trace_monitor.md`, with the P4 minimum content. The report closes with two sections: «Decisions taken (unattended)» and «Decisions awaiting Alfonso» (RC-26 list only).

Commit the report alone: `docs: discovery report for trace monitor`, pathspec after `--`, trailer `Model:`.

## HARD STOP

After the report commit, stop with `Outcome: hard-stop`. No Phase 2 code, no change to `lane-run.mjs`, no requirement file.

## NON FARE

No edit to any source file, template, `PROTOCOL.md`, `decisions.md` or `HARNESS-DOCS.md`. No new dependency proposed without naming it as a decision awaiting Alfonso. No reference to any paper material in anything committed. No push.

## RIFERIMENTI

`docs/HARNESS-DOCS.md` §4.1, §4.2, §7; `docs/PROTOCOL.md` P4, P13, P16; `docs/decisions.md` RC-17..RC-30; `docs/ratifiche/claude_ratifiche_2026-09-26_orchestrated_lanes.md`; `docs/ratifiche/claude_ratifiche_2026-09-26_ratification_by_invariants.md`.
