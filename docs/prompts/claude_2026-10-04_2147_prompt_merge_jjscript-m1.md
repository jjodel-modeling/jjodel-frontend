# Prompt: merge jjscript-m1 into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-04-2147
Chat: C-2026-10-04-0946
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-05 · lane merge · 0e77734a2 · verifica visiva passata 2026-10-05 (chat check RC-23 on the lane probe from the DOM (E1, E2, E2b, E3, E4 all PASS: microwave with `in` has 0 errors, every Transition in the transitions slot of its source State and not in model.objects, tree nested; original script leaves no not-found after the retry passes); canvas edge rendering not measured, out of scope)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-04-2147 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `c34a03ddb`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `jjscript-m1` into the trunk with one merge commit, `--no-ff`, of the explicit sha `05bf04ce8`, in the shape of `32c70ea86` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `d6bd5c5f6`. The branch carries, on top of the base, 8 commits:

- `05bf04ce8` docs: closure of JjScript M1 containment, R-JS-8..11 provisional (P-2026-10-04-0946)
- `ffb23e6dd` probe: M1 containment after mode, 600 px crops, back-to-back links (P-2026-10-04-0946)
- `9163f0b28` feat(jjodie): M1 prompt creates contained instances in their container (P-2026-10-04-0946)
- `9916cefce` feat(jjscript): create an M1 instance inside its container (P-2026-10-04-0946)
- `602f64413` feat(jjscript): Run defers M1 lines naming an instance not yet created (P-2026-10-04-0946)
- `8f84740c6` docs: discovery of JjScript M1 deferral and containment (P-2026-10-04-0946)
- `4cd1fce10` probe: JjScript M1 containment, microwave Run, set +=, slot timing (P-2026-10-04-0946)
- `c1a49f5eb` docs: add prompt P-2026-10-04-0946, JjScript M1 containment

The trunk carries, since the base, 47 commits:

- `c34a03ddb` docs: CHANGELOG [Unreleased], Clock auto-start (R-SIM-134..136)
- `49b2f87c2` docs: Status flip and log entry for the sim-clock-auto merge (P-2026-10-04-1832)
- `32c70ea86` merge: sim-clock-auto into alfonso-frontend-jjtl (P-2026-10-04-1832)
- `0ffd613f9` docs: add prompt P-2026-10-04-1832, merge sim-clock-auto into alfonso-frontend-jjtl
- `18f65f917` docs: restore the Clock lane entry, add its keycap fix entry (P-2026-10-04-1625)
- `a43bf38f2` docs: keycap fix sha and gates in the Clock lane closure (P-2026-10-04-1625)
- `836d36936` fix(sim): Clock keycap above its corner on the front panel (P-2026-10-04-1625)
- `7a2da15cb` docs: closure of the implicit Clock lane, R-SIM-134..136 (P-2026-10-04-1625)
- `7aa9e4889` test(sim): auto-start, idle ticks, the panel's clocks (P-2026-10-04-1625)
- `3a71b2a21` feat(sim): implicit Clock, auto-start with the run, idle ticks (P-2026-10-04-1625)
- `c106cb329` docs: discovery report, implicit Clock on the I/O board (P-2026-10-04-1625)
- `aa17dc715` docs: add prompt P-2026-10-04-1625, implicit Clock on the I/O board
- `0022fe5c3` docs: session checkpoint of chat C-2026-10-04-1126 (front panel styles)
- `8536e29d9` docs: CHANGELOG [Unreleased], I/O board, Clock, front panel styles, state face, node.[x], hidden events
- `e60a7dfd0` docs: Status flip and log entry for the sim-io-panel merge (P-2026-10-04-1540)
- `19b29dc2b` merge: sim-io-panel into alfonso-frontend-jjtl (P-2026-10-04-1540)
- `7e19a9c91` docs: add prompt P-2026-10-04-1540, merge sim-io-panel into alfonso-frontend-jjtl
- `5525c3e7c` docs: visual check of the front panel faces lane passed, two tickets (P-2026-10-04-1131)
- `c4c5c4b11` docs: closure of the front panel faces lane, R-SIM-130..133 (P-2026-10-04-1131)
- `da3a18d72` docs: session checkpoint of chat C-2026-10-04-0935 (sim-hide-events)
- `372273fd8` test: styles of the I/O board's front panel, what is drawn (P-2026-10-04-1131)
- `c79cf7774` feat: styles of the I/O board's front panel, what is drawn (P-2026-10-04-1131)
- `56366e0aa` docs: Status flip and log entry for the sim-io-clock merge (P-2026-10-04-1504)
- `6704563a8` merge: sim-io-clock into alfonso-frontend-jjtl (P-2026-10-04-1504)
- `64d327112` docs: add prompt P-2026-10-04-1504, merge sim-io-clock into alfonso-frontend-jjtl
- `c25c758f4` docs: R-RAIL-44 under Superate no longer reads as a second row
- `ec99e8e5b` docs: Status flip and log entry for the sim-hide-events merge (P-2026-10-04-1456)
- `b3fe55c5d` merge: sim-hide-events into alfonso-frontend-jjtl (P-2026-10-04-1456)
- `4dbe84539` docs: add prompt P-2026-10-04-1456, merge sim-hide-events into alfonso-frontend-jjtl
- `452b810ac` docs: Status flip and log entry, sim-hide-events took the trunk (P-2026-10-04-1213)
- `ab7907ad9` docs: closure of the front panel model lane, D-UI-16, R-SIM-123..129 (P-2026-10-04-1130)
- `c18397a5c` test: styles of the I/O board's front panel, the model (P-2026-10-04-1130)
- `906cb0f2e` feat: styles of the I/O board's front panel, the model (P-2026-10-04-1130)
- `c53a5a8d1` merge: sim-hide-events takes alfonso-frontend-jjtl (P-2026-10-04-1213)
- `25db14eb0` docs: add prompt P-2026-10-04-1213, merge alfonso-frontend-jjtl into sim-hide-events
- `d03957dd1` docs: discovery for the I/O board's front panel styles (P-2026-10-04-1130)
- `b27138436` docs: add prompts P-2026-10-04-1130 and 1131, styles of the I/O board front panel
- `94722697c` docs: Status flip and log entry for hiding events during a run (P-2026-10-04-0935)
- `8d0021987` feat(sim): hide event nodes and their edges during a run (P-2026-10-04-0935)
- `452efc6f1` docs: closure of the Clock lane, R-SIM-122 and the inbox entry (P-2026-10-04-0150)
- and 7 more: `git log --oneline d6bd5c5f6..c34a03ddb`

Measured by `lane-run merge` at 2026-10-04 21:47, trunk at `c34a03ddb`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 05bf04ce8`: zero conflicts.
- Files changed since the base: 17 on the branch side, 52 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only d6bd5c5f6 05bf04ce8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-04_0946_prompt_jjscript_m1_containment.md` (eseguito 2026-10-04 · lane jjscript-m1 · 602f64413, 9916cefce, 9163f0b28 · non fuso: hard-stop, probe after 3096 all PASS (microwave with `in`: 0 errors, every Transition in its State, not in model.objects), mutation bench 28/28, crops in ~/.jjodel-lanes/P-2026-10-04-0946/crops/, verifica visiva alla chat).
- `git worktree list`: `jjscript-m1` in `/Users/alfonso/jjodel-w-jjsm1`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-04-2147/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `05bf04ce8` is the tip of `jjscript-m1`; the prompt files of the branch read `Status: eseguito` at `05bf04ce8`; `git worktree list` shows `jjscript-m1` only in `/Users/alfonso/jjodel-w-jjsm1`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 05bf04ce8` (measured above: zero conflicts). `git diff --name-only d6bd5c5f6 05bf04ce8 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only d6bd5c5f6 alfonso-frontend-jjtl` with `git diff --name-only d6bd5c5f6 05bf04ce8` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-RAIL-44` (trunk), `R-SIM-122` (trunk), `R-SIM-123` (trunk), `R-SIM-124` (trunk), `R-SIM-125` (trunk), `R-SIM-126` (trunk), `R-SIM-127` (trunk), `R-SIM-128` (trunk), `R-SIM-129` (trunk), `R-SIM-130` (trunk), `R-SIM-131` (trunk), `R-SIM-132` (trunk), `R-SIM-133` (trunk), `R-SIM-134` (trunk), `R-SIM-135` (trunk), `R-SIM-136` (trunk); control: `- **R-SIM-137**` none.
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-04 — feat(jjscript): M1 Run defers forward references, instances born in their container (P-2026-10-04-0946)` once (branch).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-04 — ticket: `set <parent>.<containment> += <child>` leaves an incoherent containment` once (branch).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-04 — ticket: two M1 links into one slot 20 ms apart keep only the second` once (branch).
   - `docs/log-inbox/jjscript.md`: the heading `## 2026-10-04 — ticket: the Run summary miscounts and does not flag M1 instances by containment` once (branch).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-04: the I/O board's Clock (R-SIM-122)` once (trunk).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-04: the styles of the I/O board's front panel, the model (R-SIM-123..129)` once (trunk).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-04: the styles of the I/O board's front panel, what is drawn (R-SIM-130..133)` once (trunk).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-04: an implicit Clock on the I/O board (R-SIM-134..136)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: event nodes and their edges hidden on the canvas during a run (P-2026-10-04-0935)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — merge: sim-hide-events takes alfonso-frontend-jjtl (P-2026-10-04-1213)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — merge: sim-hide-events into alfonso-frontend-jjtl (P-2026-10-04-1456)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: a Clock input device on the I/O board (P-2026-10-04-0150)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — merge: sim-io-clock into alfonso-frontend-jjtl (P-2026-10-04-1504)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: styles of the I/O board's front panel, the model (P-2026-10-04-1130)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: styles of the I/O board's front panel, what is drawn (P-2026-10-04-1131)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — ticket: a front panel press with an icon truncates its label in one cell` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — ticket: a wide floating board can open under the canvas layer's Globals control` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — merge: sim-io-panel into alfonso-frontend-jjtl (P-2026-10-04-1540)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — feat: an implicit Clock on the I/O board, auto-start and idle ticks (P-2026-10-04-1625)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — fix: the Clock's keycap above its corner on the front panel (P-2026-10-04-1625)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-04 — merge: sim-clock-auto into alfonso-frontend-jjtl (P-2026-10-04-1832)` once (trunk).
4. `git merge --no-ff --no-commit 05bf04ce8`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: jjscript-m1 into alfonso-frontend-jjtl (P-2026-10-04-2147)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `05bf04ce8` in `/Users/alfonso/jjodel-w-jjsm1`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard c34a03ddb` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/jjscript.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the jjscript-m1 merge (P-2026-10-04-2147)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-jjsm1`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
