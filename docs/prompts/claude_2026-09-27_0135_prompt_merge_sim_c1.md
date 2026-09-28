# Prompt: merge simulation-engine (lane C1, state declarations and action keys) into the trunk

Prompt-ID: P-2026-09-27-0135
Chat: C-2026-09-26-1702
Lane: full (merge; one inbox conflict to resolve by rule)
Status: eseguito 2026-09-27 · lane merge · 24d8537fd · verifica visiva passata 2026-09-27 (chat, unattended; Alfonso in the morning digest)

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. The only other tree this lane may touch is `~/jjodel-sim`, in step 9, for a fast-forward. Do not touch any other tree. Every reply opens with `[P-2026-09-27-0135 · session <id>]` and ends with an `Outcome:` line (P16).

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `39e3c151b`), stop and say what you see.

## COSA

Bring `simulation-engine` into the trunk with one merge commit, `--no-ff`, of the explicit sha `8b5871f29`, in the shape of `cc388d5dd` (read its body first). Merge base `5c542b039` (the branch took the trunk at `17a3d308c`). The branch carries, on top of it: the Phase 2 prompt of lane C1 `ab7911fa2`, its code `3ec3405d5` (codec `simStateAttributes`, catalog, `NetStc` action keys, compiler declaration defects, evaluator, bridge), `f507d166d` (the Data group in the panel), `b62141aba` (24 px inputs in the declarations table), its closure `8b5871f29` (visual check passed on 3002: chat 6/6 in the built-in browser, and Alfonso); below them the R-SIM-67..72 rows `320d4afcf` and the discovery `06d911dd9` of `P-2026-09-26-1705`.

No migration, no VersionFixer step, no critical-zone file.

**Behaviour brought into force on 3001:** in a metamodel the Simulation panel has a Data group with Guard, Action, Entry, Exit and a table of declared state attributes, persisted as `simStateAttributes` (a JSON string, `{"v":1,"attrs":[…]}`); in a model, actions on transitions, entries and exits run inside the step as one parallel assignment, declaration and action defects appear in the defects line at Reset with the transition still a candidate, an undeclared target halts the run naming the element, and «Last step» lists the assignments in its title.

## COME

1. Preconditions, each a stop if false: `git status` empty here and in `~/jjodel-sim` (gitignored `frontend/scripts/smoke/_tmp_*` files there do not count); `MERGE_HEAD` absent; `8b5871f29` is the tip of `simulation-engine`; `docs/prompts/claude_2026-09-26_2340_fase2_sim_state_declarations_c1.md` and `claude_2026-09-26_1705_prompt_sim_state_declarations_discovery.md` on the branch read `Status: eseguito`; `git worktree list` shows `alfonso-frontend-jjtl` only here and `simulation-engine` only in `~/jjodel-sim`.
2. Measure. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 8b5871f29` (measured from chat at 01:33: exactly one conflict, `docs/log-inbox/simulation.md`; `docs/decisions.md` auto-merges). `git diff --name-only 5c542b039 8b5871f29 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty (measured: empty). Any other conflict, or a code file changed on both sides since the base: **stop** and report before merging.
3. Semantic probes, read-only, on the merge-tree result: exactly one heading per R-SIM number from 57 to 72 (controls: 56 once, 73 none); RC-25..RC-30 once each; `.claude/settings.json` `permissions.ask` is `["Bash(git push*)"]` (RC-29 from the trunk, the branch does not touch the file).
4. `git merge --no-ff --no-commit 8b5871f29`.
5. Resolve `docs/log-inbox/simulation.md` by rule, the only hand edit of this lane: the trunk side is the empty inbox (preamble only) after the fold of `P-2026-09-26-2350` (`c5a669c2e`); the branch side holds six entries, of which the first five (`P-2026-09-25-1840`, `P-2026-09-26-1105`, the B2 ticket, `P-2026-09-26-1315`, `P-2026-09-26-1535`) are already in `docs/claude-code-log.md` or `docs/claude-code-log-archive.md` after the fold: verify each heading with `grep -c` in those two files (positive control: the C1 heading `close lane C1` or its entry heading is in neither). The resolved file is the trunk's preamble plus the branch's C1 entry only, verbatim, no conflict markers. `npm run check:docs` from `frontend/` must be 4/4 on the resolved tree (Check D: the active log stays at 40).
6. Commit the merge. Subject within 72 characters, counted: `merge: state declarations and action keys, lane C1 (P-2026-09-26-2340)`. Body in the shape of `cc388d5dd`: the shas of COSA; the trunk's commits since the base (RC-25..28 `88fe737b7`, the log fold lane 2350 `13ebde1e6` `c5a669c2e` `651f10543`, RC-29 `620e3d5cd`, lane 0020 `a11224cdb` `08e758289`, the public-repo cleanup lane 0214 and the research-material lane 0051 through `39e3c151b`, RC-30 `cef93648f` `52512b2f9`); the inbox resolution with the five headings verified; the probes; the behaviour brought into force; `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus 42 (the branch went from 4884 at `17a3d308c` to 4926 at `b62141aba`), 0 failed, the same files red at import; hook tests 255; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` 0 tracked hits. Then **hard stop, `Outcome: hard-stop`**: 3001 runs from this tree (do not restart it unless it is down; say whether it is up). The chat runs the smoke on 3001 in the built-in browser (a healthy project opens; a metamodel's panel shows the Data group; the C1 fixture Reset and Step) and Alfonso confirms (RC-23).
8. After the GO (a resume from the chat), one docs commit: this prompt's Status flipped to `eseguito 2026-09-27 · lane merge · <merge sha> · verifica visiva passata 2026-09-27`, pathspec after `--`, subject `docs: Status flip for the lane C1 merge (P-2026-09-27-0135)`. No log entry for the merge.
9. Fast-forward `~/jjodel-sim`: the chat verified at launch that no session works there and that its tree is clean apart from `_tmp_*`. Assert `pwd`, branch `simulation-engine`, `git status` empty (the `_tmp_*` files do not count), then `git merge --ff-only <the Status commit sha>`. A refusal: stop, never a non-ff merge.
10. Closing report: merge sha, probes, gates, the fast-forward, push state (do not push), then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry (the inbox resolution of step 5 keeps every kept entry verbatim).

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29, R-SIM-67..72.
- Precedents `cc388d5dd` (merge), `df9d7a5e0` (Status flip); prompt `claude_2026-09-26_1615_prompt_merge_sim_panel.md`; the fold lane `claude_2026-09-26_2350_prompt_log_fold_rotate.md` and its note on `simulation.md`.
