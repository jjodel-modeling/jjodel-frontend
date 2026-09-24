# Prompt: harness gate, inbox checks, tickets, stale baseline, false-green guard

Prompt-ID: P-2026-09-24-1630
Chat: C-2026-09-24-1005
Status: da eseguire

Worktree: `~/jjodel-gate`, branch `harness-gate`, created from the trunk at `94a72edba`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-gate` on `harness-gate`, stop and say so; never work by absolute path on another worktree. Do not touch `~/jjodel-harness`: it is a folder of private notes, not a worktree.

Model: this lane runs on Sonnet 5 through `.claude/settings.local.json` in this worktree (gitignored, `"model": "claude-sonnet-5"`), a declared deviation from the project pin. Say in your first reply which model the session banner shows. It is the first data point of the ablation: the log entry records the model and how many correction rounds the lane needed.

Parallel lanes, do not touch their files or worktrees: `P-2026-09-24-1520` on `simulation-engine` in `~/jjodel-sim`; `P-2026-09-24-1610` on the trunk in `~/jjodel-release` (`VersionFixer.tsx`, `examples/`). This branch returns to the trunk by a merge after 1610 closes.

Two-phase. Phase 1 is read-only and ends with a saved report and a hard stop. Phase 2 starts only on a GO that opens with this ID.

## COSA

Four items, all in the harness, none in product code:

1. **The gate lane left open on 2026-09-21** (ticket in the harness entries of the log): Check B of `check:docs` should also lint the entries waiting in `docs/log-inbox/*.md`, the log needs an entry type "ticket", and the handling of folded entries older than the fortieth. Find the ticket text in `docs/claude-code-log.md` and `docs/claude-code-log-archive.md`, quote it, and work from it, not from this summary.
2. **Stale baseline in `CLAUDE.md`**: the typecheck section (around line 606) says 33 pre-existing errors; every lane since 2026-09-21 measures 14 (the 19 casing errors are gone). Measure on this branch and list the 14.
3. **False-green guard**: the 1850 verification harness printed ALL GREEN over failures because of `failures += await e2e.run(...)`, which reads the counter before the await (ticket, high, in the 1005 entry of `docs/log-inbox/simulation.md`). Propose a check that rejects that pattern in committed verification scripts (`frontend/scripts/**`) and say which gate hosts it.
4. **Model pin, measure only**: `.claude/settings.json` on the trunk pins `claude-opus-5`, while the project chat believed a ratification (RC-16, prompt `P-2026-09-23-0718`) moved it to `claude-opus-5-5`, and recent commits declare Opus 5.5 in their `Model:` trailer. Find whether RC-16 or that prompt exist on any branch (`git grep` across all local branches, `docs/decisions.md`, `docs/prompts/`), and explain what model the sessions actually ran and why. Change nothing about the pin in this lane.

Out of scope: product code, the log rotation itself (P13 exclusive lane), the Stop hook for the log entry (still waiting for probe R5).

## DOVE

Phase 1 reads: `frontend/scripts/gates/check-docs.ts`, `check-agents.ts` and their tests; `docs/PROTOCOL.md` (P9, P13, P15, and the RC clauses the checks cite); `CLAUDE.md` §21.2 and the typecheck section; `docs/log-inbox/*.md`; the log and its archive for the ticket; `.claude/settings.json`, `.claude/skills/log-entry/`; `frontend/scripts/**` for the counter pattern.

Phase 2 is expected to touch `check-docs.ts` (or `check-agents.ts`), their tests, `CLAUDE.md` (baseline figure, and §21.2 if the ticket type needs the entry format), `docs/PROTOCOL.md` if a clause changes, and the `log-entry` skill if the ticket type changes its template. Declare the final list in the report.

## COME

### Phase 1 (read-only)

1. Quote the 2026-09-21 ticket verbatim and restate each of its three parts as a rule a check can test. For each, the current behaviour of `check:docs` on today's tree (run it and show the output).
2. Design of the ticket entry type: which fields it has (fewer than the 12 of P9), how Check B recognises it, how the rotation of P13 treats it. Show one example entry.
3. The typecheck baseline measured on this branch: the 14 errors, file and code each.
4. The counter pattern: grep `frontend/scripts/**` (committed files only) for `+= await` and close variants; list every hit. Propose the rule (regex or AST), where it runs, and a negative control: a fixture that must fail the check.
5. The model pin investigation of item 4, with the evidence.
6. Baseline gates now: `check:docs`, `check:agents`, typecheck, vitest count, build. Use the temporary `node_modules` symlink of P14 if needed and leave the tree as you found it.

Save the report as `docs/discovery/discovery_2026-09-24_harness_gate.md`: objective, files read with full paths, findings for items 1 to 5, risks, open questions for Alfonso, the proposed Phase 2 diff in prose with the file list. Commit it alone, with pathspec, on `harness-gate`. Hard stop: the phase is not complete until the report is on disk and committed.

### Phase 2 (after GO)

1. Implement what the GO ratifies. Every new check has a negative control that must fail and a mutation that must be caught; report both.
2. Gates: typecheck with the same error set as the baseline, vitest, build, `check:docs`, `check:agents`.
3. No visual check: nothing reaches the UI.
4. One code commit (checks and tests) and one docs commit (`CLAUDE.md`, PROTOCOL if touched, the entry appended to `docs/log-inbox/harness.md`, the Status flip of this file per P13), both with pathspec. P6 trailer `Model: ...` in both bodies, naming Sonnet 5. Subjects end with `(P-2026-09-24-1630)` and stay within 72 characters without the suffix.

Never: `git add .`, `git stash`, `git reset --hard`, commits outside `harness-gate`, merges, push.

## RIFERIMENTI

- The harness entries of 2026-09-21 in `docs/claude-code-log.md` (the gate ticket, RC-15).
- `docs/log-inbox/simulation.md`, entry of `P-2026-09-24-1005` (the false-green ticket).
- `docs/PROTOCOL.md` P9, P13, P14, P15.
