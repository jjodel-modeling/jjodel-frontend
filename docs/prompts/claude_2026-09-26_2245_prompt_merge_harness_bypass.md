# Prompt: merge harness-bypass (P-2026-09-25-1022) into the trunk and the simulator branch

Prompt-ID: P-2026-09-26-2245
Chat: C-2026-09-25-1759
Lane: full (merge, harness settings and hooks)
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session (`/clear`). Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop. The only other tree this lane may touch is `~/jjodel-sim`, in step 9, and only after Alfonso's explicit OK. Do not touch any other tree (`~/jjodel-gate` holds `harness-bypass` and stays as it is).

Single phase, hard stops at steps 2 and 9. Every reply of this session opens with `[P-2026-09-26-2245 · session <id>]` and ends with an `Outcome:` line (P13).

**Other chats.** If the tree is dirty, a merge is in progress (`MERGE_HEAD`), another session is working here, or the trunk tip is not the commit that adds this file (its parent `b8dc0edae`), stop and say what you see.

## COSA

Close the BLOCKING ticket of `docs/log-inbox/harness.md` (entry `2026-09-26 — ticket: merge P-2026-09-25-1022 before the first orchestrated launch`): bring `harness-bypass` into the trunk with one merge commit, `--no-ff`, of the explicit sha `f3a014e4d`, in the shape of `4b70b5634` (read its body first). Merge base `afaea8756`. The branch carries `ddee7a09e` (discovery), `cd5eb9eb5` (code: deny of the critical zone and of `git push` under `bypassPermissions`, pin `claude-opus-5-5`), `f3a014e4d` (closure). Then bring the same result into `simulation-engine`.

No migration, no VersionFixer step, no critical-zone file. No UI change: no visual check.

**Behaviour brought into force:** sessions started from the trunk run `claude-opus-5-5` (RC-16); under `bypassPermissions` the `bash-guard` hook denies `git push` in every form it reads and the `critical-zone` hook denies instead of asking (RC-19). This is the precondition for the first `lane-run` launch (RC-20, P16).

## COME

1. Preconditions, each a stop if false: `git status` empty here and in `~/jjodel-sim`; `MERGE_HEAD` absent; `f3a014e4d` is the tip of `harness-bypass`; `docs/prompts/claude_2026-09-25_1022_prompt_harness_bypass_gates.md` reads `Status: eseguito` on `f3a014e4d`.
2. Measure. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f3a014e4d` (measured from chat at 22:42: one conflict, `docs/log-inbox/harness.md`; `docs/HARNESS-DOCS.md` auto-merges). `git diff --name-only afaea8756 f3a014e4d` must be exactly the ten files of `git diff --stat afaea8756 f3a014e4d` measured from chat: `.claude/settings.json`, `.claude/skills/status-flip/SKILL.md`, `docs/HARNESS-DOCS.md`, the 1022 discovery report, `docs/log-inbox/harness.md`, the 1022 prompt, `bashGuard.test.ts`, `criticalZone.test.ts`, `bash-guard.mjs`, `critical-zone.mjs`. Any other conflict, or a code file changed on both sides since the base: **stop** and report before merging.
3. `git merge --no-ff --no-commit f3a014e4d`.
4. Resolve `docs/log-inbox/harness.md` as a union: the trunk's side first, then the branch's new entries, each entry exactly once, no line of any entry changed, no conflict marker left. This is the only hand edit allowed. Then read the merged `docs/HARNESS-DOCS.md`: the version line stays `1.5 (2026-09-26)`, the `bash-guard` and `critical-zone` rows are the branch's, §7 and §4.1 are the trunk's. Show `git diff --cached --stat`.
5. Semantic probes on the index, read-only:
   - `.claude/settings.json` pins `claude-opus-5-5`.
   - The `status-flip` and `discovery-report` extractions: run them as the 1640 lane did and compare with what the skills now read. The branch changed `status-flip/SKILL.md` and the trunk amended P13 after it was written: the extraction must still start at the Status bullet and end before `## P14`, and include the 1640 amendments only if they sit inside that span. A mismatch: stop.
   - Hook probe without pushing: feed `bash-guard.mjs` on stdin a `PreToolUse` payload with `permission_mode: "bypassPermissions"` and command `git push origin HEAD`, and one with `permission_mode: "default"`; the first must return a deny, the second no deny. Same shape for `critical-zone.mjs` on `frontend/src/components/editor-v2/sync/useJjomSync.ts` (deny in bypass, ask in default). Record the outputs verbatim.
6. Commit the merge. Subject within 72 characters, counted: `merge: bypass gates and Opus 5.5 pin (P-2026-09-25-1022)`. Body in the shape of `4b70b5634`: the shas of COSA; the trunk's commits since the base, listed by `git log --oneline afaea8756..b8dc0edae^` plus this prompt's commit; the resolution of the inbox; the probes; the behaviour brought into force; `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck 14, the §17 set; `typecheck:scripts` exit 0; hook tests: the trunk tip's count measured before step 3 plus the branch's new tests (state the expected total before running), 0 failed, `laneRun.test.ts` included; vitest full: the trunk tip's count plus the same delta, 0 failed, same 9 files red at import; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` 0 tracked hits.
8. Closure, one docs commit: in `docs/log-inbox/harness.md` a new entry that closes the BLOCKING ticket (name the merge sha; do not edit the ticket entry), and this prompt's Status flipped to `eseguito 2026-09-26 · lane merge · <merge sha>`, pathspec after `--`, subject `docs: close the bypass gates merge (P-2026-09-26-2245)`.
9. **Hard stop before touching `~/jjodel-sim`.** `simulation-engine` (tip `7e1c9e8cc`, a simulator chat checkpoint) is not an ancestor of the trunk, so a fast-forward is impossible. Measure from here, read-only: `git merge-tree --write-tree --name-only simulation-engine <closure sha>`. Report it and ask Alfonso whether any session is working in `~/jjodel-sim`. Only on his explicit OK: assert `pwd`, branch `simulation-engine`, `git status` empty, then `git merge --no-ff <closure sha>` with subject `merge: trunk with the bypass gates into simulation-engine (P-2026-09-26-2245)`, body naming the trunk merge and the probes. Any conflict: stop, never resolve one in that tree without asking. Then rerun there only the hook tests and the two hook probes of step 5.
10. Closing report: merge shas, the inbox resolution, probes verbatim, gates with baseline and measured numbers, the simulator merge, push state (do not push), `Outcome:` line.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name, squash, rebase, push, a real `git push` as a probe, editing any line inside a decision block or an existing log entry.

## RIFERIMENTI

- `docs/decisions.md` RC-16, RC-19, RC-20..24; `docs/PROTOCOL.md` P13, P16.
- `docs/prompts/claude_2026-09-25_1022_prompt_harness_bypass_gates.md` and its discovery report; `docs/prompts/claude_2026-09-26_1640_prompt_harness_orchestrated_lanes.md` (closure `b8dc0edae`).
- Precedents: `4b70b5634` (merge), `claude_2026-09-26_1615_prompt_merge_sim_panel.md`.
