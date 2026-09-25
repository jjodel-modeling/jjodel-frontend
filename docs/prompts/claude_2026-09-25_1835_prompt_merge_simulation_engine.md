# Prompt: merge simulation-engine (state operator B1 and A, role catalog) into the trunk

Prompt-ID: P-2026-09-25-1835
Chat: C-2026-09-25-1353
Lane: full (more than 3 files, migration)
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop. The only other tree this lane may touch is `~/jjodel-sim`, in step 9, for a fast-forward, and only after Alfonso's explicit OK. Do not touch `~/jjodel`, `~/jjodel-open`, `~/jjodel-events`, `~/jjodel-vite`, `~/jjodel-gate`, `~/jjodel-harness`.

Single phase, hard stops at steps 2, 7 and 9. A merge: no source file is edited by hand; two docs files are resolved by union (step 5).

**Other chats.** `C-2026-09-25-1500` has `P-2026-09-25-1820` (Vite dependency scan) on `vite-dep-scan` in `~/jjodel-vite`, and ran `P-2026-09-25-1805` on `simulation-engine`. Two merges never run at once in this tree: if the tree is dirty, a merge is in progress, or the trunk tip is not `a5a0bcfbf` or the commit that adds this file, stop and say what you see.

## COSA

Bring `simulation-engine` into the trunk with one merge commit, `--no-ff`, of the explicit sha `a14c7dfa8`, in the shape of `f10352a7b` and `7562d23bd` (read both bodies first). Merge base `1201382ac`. The branch carries, on top of it:

- `P-2026-09-25-1445`, the `.[x]` state operator lane: discovery `ec68ddb9b`; ratification `86f36a205` and renumbering `8f97d4f6f` (series R-SIM-39..46), comment shift `4d96ba1fb`; wave B1 `1c7a9be76` + closure `7727d715b` (grammar, strict parse, evaluator hook, reserved list; no visual check); wave A prompt `9801ddd7a`, A1 `b14294906`, A2 `066383e24`, closure `e6e2e8fab` (primitive types `Expression` and `Action`, VersionFixer step `2.228 -> 2.229`, Ecore annotation; visual check passed on 3002).
- `P-2026-09-25-1805` (chat `C-2026-09-25-1500`), role catalog and profiles, pure module: `c1847aed5`, `0834329e4`, closure `a14c7dfa8`.

Why now: wave B2 (guards read state) touches `simBridge.ts` and `netCompile.ts`, which `7562d23bd` changed on the trunk; B2 must start from a branch that holds both.

**This merge brings a migration into force.** Any project opened and saved on 3001 after this merge is written as version `2.229` with two new primitive records. A build without the step (3000, if it runs an older tree) was never tested on such a save.

## COME

1. Preconditions, each a stop if false: `git status` empty here and in `~/jjodel-sim`; `MERGE_HEAD` absent; `a14c7dfa8` is the tip of `simulation-engine`; the three prompt files of the branch (1445 B1, 1445 A, 1805) read `Status: eseguito` on `a14c7dfa8`; `git worktree list` shows `alfonso-frontend-jjtl` only here and `simulation-engine` only in `~/jjodel-sim`.
2. Measure. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl a14c7dfa8` (measured from chat at 18:30: conflicts in `docs/decisions.md` and `docs/log-inbox/simulation.md` only). `git diff --name-only 1201382ac a14c7dfa8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md` must be empty. Any conflict in another file, or a code file changed on both sides: **stop** and report before merging.
3. Semantic probes, read-only:
   - Numbering: on the merged result there is exactly one heading per R-SIM number from 38 to 55 (`grep -c` per number = 1). R-SIM-52 (trunk, `simAction` typed `Action [0..*]`) and R-SIM-44 (branch, the `Action` primitive) must read as consistent: quote both; a contradiction is a stop.
   - VersionFixer: the trunk adds no step after `2.228` (`grep -n "'2.22" frontend/src/redux/VersionFixer.tsx` on the trunk tip), so `2.229` is free.
   - Inbox lint: the union of step 5 passes `check:docs` before the merge is committed.
4. `git merge --no-ff --no-commit a14c7dfa8`.
5. Resolve by union, text only (RC-14):
   - `docs/decisions.md`: keep every block, in numeric order: R-SIM-38 (trunk), R-SIM-39..46 (branch), R-SIM-47..55 (trunk), then `## Serie R-J`. No line of any block changed.
   - `docs/log-inbox/simulation.md`: keep every entry verbatim, in the order of the dates and times of their commits; the header once. No entry changed.
   Show `git diff --cached -- docs/decisions.md docs/log-inbox/simulation.md` in the report as a summary (entries and blocks kept, order), then `check:docs`.
6. Commit the merge. Subject within 72 characters, counted: `merge: state operator B1 and A, role catalog (P-2026-09-25-1445)`. Body in the shape of the precedents: the shas of COSA; the trunk's commits since the base (1610 and 1615 merges, R-SIM-47..55, the 1820 prompt); the probes; the union resolution declared (RC-14 exception); the behaviour brought into force (`.[x]` parses, throws outside the simulator; strict parse for the new types; `Expression` and `Action` in the type lists; conformance warning on a malformed value; `.ecore` export with the `jjodel`/`type` annotation; migration to `2.229`); `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: state the expected total first (the trunk tip measured before step 4, plus the branch total at `a14c7dfa8` minus 4620), 0 failed, same 9 files red at import; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` 0 tracked hits. Then **visual check, hard stop**: 3001 runs from this tree (do not restart it unless it is down). Ask Alfonso to hard-refresh `http://localhost:3001/` and check, **on a copy of a project, not on one he keeps using on 3000**: (a) a healthy project opens, a hash change opens the second (1610); (b) the Events group shows Trigger, Event class, Event identifier, and the event buttons fire (1615); (c) the M2 type selects list Expression and Action; `a +` in an Expression attribute shows a conformance warning (wave A); (d) the Console answers `a.[b]` with the "simulator only" error (B1). Wait.
8. After his OK, one docs commit: this prompt's Status flipped to `eseguito 2026-09-25 · lane merge · <merge sha> · verifica visiva passata 2026-09-25`, pathspec after `--`, subject `docs: Status flip for the simulation-engine merge (P-2026-09-25-1835)`. No log entry for the merge.
9. **Hard stop before touching `~/jjodel-sim`.** Ask Alfonso whether any session is working in `~/jjodel-sim` (another chat ran 1805 there). Only on his explicit OK: assert `pwd`, branch `simulation-engine`, `git status` empty, then `git merge --ff-only <the Status commit sha>`. A refusal: stop, never a non-ff merge.
10. Closing report opening with `[P-2026-09-25-1835 · session <id>]`: merge sha, probes, the union summary, gates, visual result, the fast-forward, push state (do not push).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name, squash, rebase, push, editing any line inside a decision block or an inbox entry.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-13, RC-14, RC-17, R-SIM-38..55.
- Precedents `f10352a7b`, `7562d23bd`, `46a67b3c4`; prompts `claude_2026-09-25_1247_prompt_merge_sim_step3.md`, `claude_2026-09-25_1615_prompt_merge_event_from_trigger.md`.
