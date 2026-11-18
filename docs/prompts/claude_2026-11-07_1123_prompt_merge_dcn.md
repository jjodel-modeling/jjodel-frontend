# Prompt: merge dcn into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-07-1123
Chat: C-2026-11-06-2159
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (merge of dcn launched by chat C-2026-11-06-2159)
Lane: full (merge; 1 conflict: `docs/log-inbox/dcn.md` measured)
Status: eseguito 2026-11-07 · lane merge · 376a2273e · verifica visiva passata 2026-11-07 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-07-1123 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `319be0670`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `dcn` into the trunk with one merge commit, `--no-ff`, of the explicit sha `177378f9d`, in the shape of `319be0670` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `37fc696f7`. The branch carries, on top of the base, 23 commits:

- `177378f9d` merge: dcn-l23 into dcn (0a860e5c1)
- `0a860e5c1` docs(dcn): L2.3 closure, crops read by the chat (P-2026-11-07-1012)
- `f6b918db1` feat(sim): the dcn role group and the profile Dynamic classification (P-2026-11-07-1012)
- `81c82350a` merge: dcn-l33 into dcn (2d1629bc8)
- `1ba2bf168` docs(dcn): L2.3 continuation prompt (P-2026-11-07-1012)
- `2d1629bc8` docs(dcn): L3.3 log entry and Status flip (P-2026-11-07-0940)
- `969aa0b3d` feat(jjel): classification accessor for x.in(V::D) (P-2026-11-07-0940)
- `b02f337d7` docs(dcn): l23 prompt (P-2026-11-07-0941)
- `db4d36437` docs(dcn): l33 prompt (P-2026-11-07-0940)
- `17d6829f4` docs(dcn): rebuild the log inbox after the integration merges
- `e53710005` merge: dcn-l41 into dcn (f4db1b7a2)
- `22a701530` merge: dcn-l32 into dcn (23ad687c6)
- `cadabbf44` merge: dcn-l22 into dcn (2b1084b6b)
- `f4db1b7a2` docs(dcn): L4.1 closure, visual check by browser parity (P-2026-11-07-0701)
- `c7fb7e355` docs(dcn): L4.1 browser parity continuation prompt (P-2026-11-07-0750)
- `23ad687c6` docs(dcn): L3.2 log entry and Status flip (P-2026-11-07-0700)
- `0125bae93` feat(jjel): parse self.in(V::D) into ClassificationTest (P-2026-11-07-0700)
- `8de3f6ae8` feat(sim): nucleus field on the run, Petri as default (P-2026-11-07-0701)
- `28063e561` docs(dcn): L3.2 and L4.1 prompts (P-2026-11-07-0700, P-2026-11-07-0701)
- `2b1084b6b` docs(dcn): L2.2 log entry and Status flip (P-2026-11-06-2335)
- `0e2867ed8` chore(probe): DCN drone fixture, class level (P-2026-11-06-2335)
- `4093bf31c` docs(dcn): self.in and DCN slot syntax in the languages concern (L3.1)
- `a14571c20` docs(dcn): L2.2 prompt, drone fixture (P-2026-11-06-2335)

The trunk carries, since the base, 192 commits:

- `319be0670` merge: textual-undo-agreement into alfonso-frontend-jjtl (P-2026-11-07-1103)
- `b5ec93e78` docs: add prompt P-2026-11-07-1103, merge textual-undo-agreement into alfonso-frontend-jjtl
- `e71c6abdc` docs: R-MT-20..23 and the 3.1.2 patch check prompt, executed (P-2026-11-07-1008)
- `f93c79a12` docs: restore two add-only log entries the chat rewrote by a file-wide sed (P-2026-11-07-0912)
- `7f32bbffe` docs: Status of P-2026-11-07-0958, blocked by an uncommitted inbox entry
- `d7521a2e6` docs: ticket #682, a canvas create gets no undo step of its own (found by P-2026-11-07-0654)
- `8a742d403` docs: add prompt P-2026-11-07-0958, merge textual-undo-agreement into alfonso-frontend-jjtl
- `1a4eab174` docs: close the textual-e2a-select merge by hand (P-2026-11-07-0927)
- `9d440e373` docs: Status flip and log entry for the undo fix (P-2026-11-07-0912)
- `57280dd8f` merge: textual-e2a-select into alfonso-frontend-jjtl (P-2026-11-07-0927)
- `6023dd168` docs: add prompt P-2026-11-07-0927, merge textual-e2a-select into alfonso-frontend-jjtl
- `0272658db` fix(codegen): Cmd+Z after a no-change edit undoes the text (P-2026-11-07-0912)
- `4ace931c5` docs(sessioni): multi-tab /lane auto, layout-key fix and L4b merged (C-2026-11-07-0425)
- `bdd976d3e` docs: Status flip and log entry for the multi-tab-l4b merge (P-2026-11-07-0853)
- `41c2916de` test(codegen): undo routing after a no-change edit, red (P-2026-11-07-0912)
- `ac47ea7cc` docs: add prompt P-2026-11-07-0912, undo after a no-change edit
- `e08c85271` docs: Status flips and log entry for E2a (P-2026-11-07-0746, P-2026-11-07-0840)
- `ee9d7dbba` merge: multi-tab-l4b into alfonso-frontend-jjtl (P-2026-11-07-0853)
- `dde3e348c` docs: add prompt P-2026-11-07-0853, merge multi-tab-l4b into alfonso-frontend-jjtl
- `a9d626afe` docs: Status flip and log entry for multi-tab L4b (P-2026-11-07-0833)
- `5ca6ac98a` feat(codegen): E2a, a caret move selects its object on the canvas (P-2026-11-07-0840)
- `bf8759ac3` docs: add prompt P-2026-11-07-0840, E2a continuation
- `65e74534d` fix(problems): clear a model's problems on its last editor unmount (P-2026-11-07-0833)
- `fd90572de` test(problems): a producer clears only on its model's last unmount (P-2026-11-07-0833)
- `d7c05723f` docs: prompt P-2026-11-07-0833, multi-tab lane L4b
- `306baa1a5` docs: Status flip and log entry for the multi-tab-layout-key merge (P-2026-11-07-0748)
- `da2af3bf7` merge: multi-tab-layout-key into alfonso-frontend-jjtl (P-2026-11-07-0748)
- `39afe9b65` docs: add prompt P-2026-11-07-0748, merge multi-tab-layout-key into alfonso-frontend-jjtl
- `ef8c76e3c` feat(codegen): E2a, selectionSync's span, guard and caret filter (P-2026-11-07-0746)
- `b1172ab73` docs: add prompt P-2026-11-07-0746, E2a text to canvas selection
- `db79d40ff` docs: close the textual-d4-rename merge by hand (P-2026-11-07-0717)
- `9353e859e` docs(editor-v2): layout-key switch cost and probes, closure (P-2026-11-07-0628)
- `da63da457` merge: textual-d4-rename into alfonso-frontend-jjtl (P-2026-11-07-0717)
- `e373cbcda` docs: add prompt P-2026-11-07-0717, merge textual-d4-rename into alfonso-frontend-jjtl
- `cfbe326c0` docs: close the textual-e1-reprint merge by hand (P-2026-11-07-0645)
- `511a3de3c` merge: textual-e1-reprint into alfonso-frontend-jjtl (P-2026-11-07-0645)
- `76d1b4295` docs: Status flips and log entry for D4 (P-2026-11-07-0515, P-2026-11-07-0609)
- `826e850dd` docs: add prompt P-2026-11-07-0645, merge textual-e1-reprint into alfonso-frontend-jjtl
- `e42169108` fix(codegen): D4 (3), show the rename refusal after typing (P-2026-11-07-0609)
- `c55cc1a3a` docs: Status flip and log entry, textual-e1-reprint took the trunk (P-2026-11-07-0607)
- and 152 more: `git log --oneline 37fc696f7..319be0670`

Measured by `lane-run merge` at 2026-11-07 11:23, trunk at `319be0670`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 177378f9d`: 1 conflict: `docs/log-inbox/dcn.md`.
- Files changed since the base: 40 on the branch side, 110 on the trunk side; on both sides: `docs/log-inbox/dcn.md`.
- `git diff --name-only 37fc696f7 177378f9d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-06_2335_prompt_dcn_l22_drone_fixture.md` (eseguito 2026-11-07 · lane full · 0e2867ed8 · probe 17/17, no visual check owed (closure written by the chat C-2026-11-06-2159 from the handoff after the context ceiling)), `claude_2026-11-07_0700_prompt_dcn_l32_self_in_parse.md` (eseguito 2026-11-07 · lane dcn · 0125bae93 · bench 11/11 killed · verifica visiva non applicabile (RC-17)), `claude_2026-11-07_0701_prompt_dcn_l41_run_nucleus_field.md` (eseguito 2026-11-07 · lane dcn · 8de3f6ae8 · bench 12/12 killed · verifica visiva passata 2026-11-07 (chat, browser parity with base on DemoESM, P-2026-11-07-0750)), `claude_2026-11-07_0750_prompt_dcn_l41_browser_parity_cont.md` (eseguito 2026-11-07 · lane full · probe only, no commit · 17 gestures identical on the branch and on 28063e561, crops read by the chat), `claude_2026-11-07_0940_prompt_dcn_l33_classification_accessor.md` (eseguito 2026-11-07 · lane dcn · 969aa0b3d · bench 8/9 killed, the survivor equivalent · verifica visiva non applicabile (RC-17)), `claude_2026-11-07_0941_prompt_dcn_l23_roles_profile.md` (eseguito 2026-11-07 · lane full · stopped at the context ceiling (RC-51), the code carried to f6b918db1 by P-2026-11-07-1012), `claude_2026-11-07_1012_prompt_dcn_l23_roles_profile_cont.md` (eseguito 2026-11-07 · lane dcn · f6b918db1 · bench 18/19 killed · verifica visiva passata 2026-11-07 (chat: crops dynamic_branch_full, kinds_branch_0 read; Petri dialog byte-identical to base)).
- `git worktree list`: `dcn` in `/Users/alfonso/jjodel-dcn`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `177378f9d` is the tip of `dcn`; the prompt files of the branch read `Status: eseguito` at `177378f9d`; `git worktree list` shows `dcn` only in `/Users/alfonso/jjodel-dcn`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 177378f9d` (measured above: 1 conflict: `docs/log-inbox/dcn.md`). `git diff --name-only 37fc696f7 177378f9d -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 37fc696f7 alfonso-frontend-jjtl` with `git diff --name-only 37fc696f7 177378f9d` (measured above: `docs/log-inbox/dcn.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-TXT-54` (trunk), `R-TXT-55` (trunk), `R-TXT-56` (trunk), `R-FA-13` (trunk), `R-MT-1` (trunk), `R-MT-2` (trunk), `R-MT-3` (trunk), `R-MT-4` (trunk), `R-MT-5` (trunk), `R-MT-6` (trunk), `R-MT-7` (trunk), `R-MT-8` (trunk), `R-MT-9` (trunk), `R-MT-10` (trunk), `R-MT-11` (trunk), `R-MT-12` (trunk), `R-MT-13` (trunk), `R-MT-14` (trunk), `R-MT-15` (trunk), `R-MT-16` (trunk), `R-MT-17` (trunk), `R-MT-18` (trunk), `R-MT-19` (trunk), `R-MT-20` (trunk), `R-MT-21` (trunk), `R-MT-22` (trunk), `R-MT-23` (trunk); control: `- **R-MT-24**` none.
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-06 — chore: DCN drone fixture, the DCN metamodel and the drone class level on the UML fixture` once (branch).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: parse `::` and `self.in(V::D)` into a ClassificationTest node` once (branch).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — refactor: a nucleus field on the simulator run, Petri as its default` once (branch).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: the classification accessor on the JjEL evaluation context` once (branch).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — feat: the dcn role group and the system profile Dynamic classification` once (branch).
   - `docs/decisions.md`: the heading `## R-MT: several tabs on models, each with its own viewpoint (decisions 2026-11-06)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D2a, the expected set at a cursor (P-2026-11-06-2118)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D2b, completion candidates in the language service (P-2026-11-06-2146)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D2c, the completion provider of the Text tab (P-2026-11-06-2213)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-d-writing-aids into alfonso-frontend-jjtl (P-2026-11-06-2243)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — fix(editor-v2): C2e, a nameless reference target is labelled `: <Class>` on the IR form (P-2026-11-06-2041)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-c2e-ir-chip into alfonso-frontend-jjtl (P-2026-11-06-2302)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D1, commenting an object out asks first (P-2026-11-06-2301)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-d1-comment-guard into alfonso-frontend-jjtl (P-2026-11-06-2326)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — docs: step E discovery, T10 and synced selection (P-2026-11-06-2337)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e-sync into alfonso-frontend-jjtl (P-2026-11-07-0017)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — docs: step F discovery, embedded JjEL and tracing (P-2026-11-06-2357)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-f-jjel-tracing into alfonso-frontend-jjtl (P-2026-11-07-0116)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D3a, structured fixes on parse errors (P-2026-11-06-2328)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d-writing-aids takes alfonso-frontend-jjtl (P-2026-11-07-0117)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D3b, quick fixes and conformance markers (P-2026-11-07-0157)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — ticket: Objects created on the canvas (and by the create command) leave the name slot empty` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d-writing-aids into alfonso-frontend-jjtl (P-2026-11-07-0250)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — discovery: the empty raw name slot of an object created from text (P-2026-11-07-0253)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — fix(codegen): the textual layer writes the name slot of an object it creates (P-2026-11-07-0344)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-name-slot into alfonso-frontend-jjtl (P-2026-11-07-0443)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E1a, T10's splice keeps typed text (P-2026-11-07-0048)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0251)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E1b, T10 wired into the Text tab (P-2026-11-07-0510)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint takes alfonso-frontend-jjtl (P-2026-11-07-0607)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e1-reprint into alfonso-frontend-jjtl (P-2026-11-07-0645)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): D4, safe rename through the text (P-2026-11-07-0609)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-d4-rename into alfonso-frontend-jjtl (P-2026-11-07-0717)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — feat(codegen): E2a, text to canvas selection (P-2026-11-07-0746, P-2026-11-07-0840)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — merge: textual-e2a-select into alfonso-frontend-jjtl (P-2026-11-07-0927)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — ticket: A canvas create gets no undo step of its own (reducer.ts:1280 vertex merge)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-07 — fix(codegen): Cmd+Z after a no-change edit undoes the text (P-2026-11-07-0912)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-07 — merge: dcn-l21 into alfonso-frontend-jjtl (P-2026-11-06-2351)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-06 — fix(jjtl): a failing builtin names the rule and source element (P-2026-11-06-2305)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-07 — merge: jjtl-builtin-errors into alfonso-frontend-jjtl (P-2026-11-07-0011)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab into alfonso-frontend-jjtl (P-2026-11-07-0041)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: a model tab stops rewriting the viewpoint of the other open tabs` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l1 into alfonso-frontend-jjtl (P-2026-11-07-0231)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l0b into alfonso-frontend-jjtl (P-2026-11-07-0351)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: a viewpoint switch re-transforms every vertex once (R-MT-19)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — perf: a key-only layout switch skips the transformer (R-MT-19)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-layout-key into alfonso-frontend-jjtl (P-2026-11-07-0748)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — fix: problem producers clear only on the last unmount of a model` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — merge: multi-tab-l4b into alfonso-frontend-jjtl (P-2026-11-07-0853)` once (trunk).
4. `git merge --no-ff --no-commit 177378f9d`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: dcn into alfonso-frontend-jjtl (P-2026-11-07-1123)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `177378f9d` in `/Users/alfonso/jjodel-dcn`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-dcn`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 319be0670` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 319be0670 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/dcn.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the dcn merge (P-2026-11-07-1123)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-dcn`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
