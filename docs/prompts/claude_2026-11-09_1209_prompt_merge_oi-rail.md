# Prompt: merge oi-rail into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-09-1209
Chat: C-2026-10-25-2159
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (merge of oi-rail launched by chat C-2026-10-25-2159)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-11-09 · lane merge · b103b2481 · verifica visiva passata 2026-11-09 (passato: Alfonso GO 2026-11-09 09:42 on oi-rail at localhost:3005; probes on the merged branch S2 57/57, S4 14/14, binding editor 10/10, s3a 8/8, s3b 6/6, split-pane 28/28 (P-2026-11-09-1115))

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-09-1209 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `53e89405f`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `oi-rail` into the trunk with one merge commit, `--no-ff`, of the explicit sha `b292b3d1b`, in the shape of `7255e5c36` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `733a67020`. The branch carries, on top of the base, 47 commits:

- `b292b3d1b` docs: Status flip and log entry for the rail in a split pane (P-2026-11-09-1115)
- `2d874313a` chore(probe): the rail in a split pane, SP-0..SP-6 (P-2026-11-09-1115)
- `e52cfa569` fix(editor-v2): the rail in a split pane, click centre and drop guard (P-2026-11-09-1115)
- `a031db094` docs: add prompt P-2026-11-09-1115, rail in a split pane
- `5d9537948` docs: Status flip and log entry, oi-rail took the trunk (P-2026-11-09-0943)
- `a1cb914c0` merge: oi-rail takes alfonso-frontend-jjtl (P-2026-11-09-0943)
- `4cc6384f4` docs: add prompt P-2026-11-09-0943, merge alfonso-frontend-jjtl into oi-rail
- `04246f1ca` docs: checkpoint instance-of update, levels, class rail, S4 (C-2026-10-25-2159)
- `355ee1537` docs: S2-L28 entry, R-OI-22 amendment, two Status flips (P-2026-11-08-2214)
- `4ee0983ac` chore(probe): S2-L28 controls and undo trace, S4 handle reach (P-2026-11-08-2214)
- `a102c23a5` fix(editor-v2): one undo removes a class-level generalization (P-2026-11-08-2214)
- `7a972ed03` docs: add prompt P-2026-11-08-2214, class fixes continuation
- `a5f657409` fix(editor-v2): attribute defaults, row growth, generalization owner (P-2026-11-08-2146)
- `065d35fa6` docs: add prompt P-2026-11-08-2146, class diagram fixes
- `459ac12e4` docs: R-OI-24, S4 links entry, two Status flips (P-2026-11-08-2041)
- `2bed6cb5c` chore(probe): S4 links between instances, 14/14 (P-2026-11-08-2041)
- `21cf3a99e` fix(editor-v2): a link goes in the container of R-OI-22 (P-2026-11-08-2041)
- `64ad665bc` docs: add prompt P-2026-11-08-2041, S4 links continuation
- `d9b1912f9` feat(editor-v2): a link drawn between two instances (P-2026-11-08-2012)
- `dde9b5466` docs: add prompt P-2026-11-08-2012, S4 links between instances
- `7da4590f6` docs: R-OI-21..R-OI-23, class rail entry, two Status flips (P-2026-11-08-1822)
- `3f399f545` chore(probe): class rail checks, S2-L5 and S2-L6 amended (P-2026-11-08-1822)
- `6e0b772ca` docs: add prompt P-2026-11-08-1822, class rail continuation
- `b8b9bfe30` feat(editor-v2): class-level rail and pane menu from the binding (P-2026-11-08-1753)
- `57c722dec` docs: add prompt P-2026-11-08-1753, class-level rail from the binding
- `0b12cf59a` docs: R-OI-19, R-OI-20, levels entry, four Status flips (P-2026-11-08-1726)
- `b8fbddd72` chore(probe): onto levels block S2-L0..L10 (P-2026-11-08-1726)
- `d85e06388` docs: add prompt P-2026-11-08-1726, level surfaces continuation
- `a709a12b1` feat(editor-v2): instance surfaces follow the viewpoint's level (P-2026-11-08-1658)
- `f418a18ce` docs: add prompt P-2026-11-08-1658, level-aware creation surfaces
- `4d736d663` docs: addendum to onto levels discovery, probe run (P-2026-11-08-1635)
- `940959760` docs: discovery onto levels, class rail, links (P-2026-11-08-1635)
- `2b69e0c4f` docs: add prompt P-2026-11-08-1635, levels discovery continuation
- `33455491b` docs: add prompt P-2026-11-08-1605, discovery levels, class rail, links
- `fe6e1b22c` docs: checkpoint instance-of 2026-11-08 (C-2026-10-25-2159)
- `0688d25fa` docs: close onto rail lanes, R-OI-18, log entry (P-2026-11-08-0241)
- `ba69124a9` chore(probe): onto rail S2-R0..R4 (P-2026-11-08-0212)
- `5d4f2d31a` docs: add prompt P-2026-11-08-0241, rail section continuation
- `910558ef4` feat(onto): «Instances of» rail section, drop and click (P-2026-11-08-0212)
- `9f07ea049` docs: add prompt P-2026-11-08-0212, onto rail section
- and 7 more: `git log --oneline 733a67020..b292b3d1b`

The trunk carries, since the base, 15 commits:

- `53e89405f` docs: checkpoint update, D6 pinned hover card merged (C-2026-11-08-1908)
- `a8c327925` docs: Status flip and log entry for the textual-d6-pinned-hover merge (P-2026-11-09-1001)
- `7255e5c36` merge: textual-d6-pinned-hover into alfonso-frontend-jjtl (P-2026-11-09-1001)
- `c59adc944` docs: add prompt P-2026-11-09-1001, merge textual-d6-pinned-hover into alfonso-frontend-jjtl
- `dc070e33d` docs: D6b log entry and Status (P-2026-11-09-0950)
- `5221842dd` fix(codegen): the pinned card binds a chord, not Option+H (P-2026-11-09-0950)
- `5af83948d` docs: add prompt P-2026-11-09-0950, D6b pin shortcut as a chord
- `8d2fa8843` docs: D6 log entry and Status (P-2026-11-08-2330, P-2026-11-09-0020)
- `34a586c28` fix(codegen): the hover comes back only off its own place (P-2026-11-09-0020)
- `0d9fd1fa9` fix(codegen): the pinned card clears Monaco's hover (P-2026-11-09-0020)
- `17e338094` docs: add prompt P-2026-11-09-0020, D6 placement fix and closure
- `e536fc071` feat(codegen): D6, the pinned hover card of the Text tab (P-2026-11-08-2330)
- `53680294f` docs: discovery for the textual D6 pinned hover card (P-2026-11-08-2330)
- `e081cd584` docs: renumber D6 prompt to P-2026-11-08-2330 (ID taken by another chat)
- `f97aefd06` docs: add prompt P-2026-11-08-2230, textual D6 pinned hover card

Measured by `lane-run merge` at 2026-11-09 12:09, trunk at `53e89405f`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b292b3d1b`: zero conflicts.
- Files changed since the base: 42 on the branch side, 13 on the trunk side; on both sides: none.
- `git diff --name-only 733a67020 b292b3d1b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_0049_prompt_onto_rail_binding_discovery.md` (eseguito 2026-11-08 · lane discovery · e138a09ca), `claude_2026-11-08_0113_prompt_onto_binding_editor.md` (eseguito 2026-11-08 · lane full · c55874212), `claude_2026-11-08_0151_prompt_onto_binding_editor_continue.md` (eseguito 2026-11-08 · lane full · d680fce0d), `claude_2026-11-08_0212_prompt_onto_rail_section.md` (eseguito 2026-11-08 · lane full · ba69124a9), `claude_2026-11-08_0241_prompt_onto_rail_continue.md` (eseguito 2026-11-08 · lane full · ba69124a9), `claude_2026-11-08_1605_prompt_onto_levels_discovery.md` (eseguito 2026-11-08 · lane full · 4d736d663), `claude_2026-11-08_1635_prompt_onto_levels_discovery_continue.md` (eseguito 2026-11-08 · lane full · 4d736d663), `claude_2026-11-08_1658_prompt_onto_levels_surfaces.md` (eseguito 2026-11-08 · lane full · b8fbddd72), `claude_2026-11-08_1726_prompt_onto_levels_surfaces_continue.md` (eseguito 2026-11-08 · lane full · b8fbddd72), `claude_2026-11-08_1753_prompt_onto_class_rail.md` (eseguito 2026-11-08 · lane full · b8b9bfe30), `claude_2026-11-08_1822_prompt_onto_class_rail_continue.md` (eseguito 2026-11-08 · lane full · 3f399f545), `claude_2026-11-08_2012_prompt_onto_s4_links.md` (eseguito 2026-11-08 · lane full · d9b1912f9), `claude_2026-11-08_2041_prompt_onto_s4_links_continue.md` (eseguito 2026-11-08 · lane full · 2bed6cb5c), `claude_2026-11-08_2146_prompt_onto_class_fixes.md` (eseguito 2026-11-08 · lane full · a5f657409), `claude_2026-11-08_2214_prompt_onto_class_fixes_continue.md` (eseguito 2026-11-08 · lane full · 4ee0983ac), `claude_2026-11-09_0943_prompt_oi-rail_take_trunk.md` (eseguito 2026-11-09 · lane oi-rail · a1cb914c0 · verifica visiva passata 2026-11-09 (chat, unattended; Alfonso in the morning digest)), `claude_2026-11-09_1115_prompt_onto_rail_split_fix.md` (eseguito 2026-11-09 · lane oi-rail · e52cfa569).
- `git worktree list`: `oi-rail` in `/Users/alfonso/jjodel-w-oi-rail`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-11-09-1209/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `b292b3d1b` is the tip of `oi-rail`; the prompt files of the branch read `Status: eseguito` at `b292b3d1b`; `git worktree list` shows `oi-rail` only in `/Users/alfonso/jjodel-w-oi-rail`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl b292b3d1b` (measured above: zero conflicts). `git diff --name-only 733a67020 b292b3d1b -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 733a67020 alfonso-frontend-jjtl` with `git diff --name-only 733a67020 b292b3d1b` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-OI-18` (branch), `R-OI-19` (branch), `R-OI-20` (branch), `R-OI-21` (branch), `R-OI-22` (branch), `R-OI-23` (branch), `R-OI-24` (branch); control: `- **R-OI-25**` none.
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: onto binding editor with Detect, probe and bench (P-2026-11-08-0151)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — ticket: value kinds can be edited in the binding editor but not added` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: «Instances of» rail section, probe, regression, bench (P-2026-11-08-0241)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: the viewpoint's level gates the instance surfaces (P-2026-11-08-1726)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: the class rail and pane menu from the binding, probe, bench (P-2026-11-08-1822)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: a link drawn between two instances, probe, bench (P-2026-11-08-2041)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — fix: class diagram defects, one undo for the generalization, handle reach (P-2026-11-08-2214)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — ticket: one undo does not remove an object-as-edge outside level class` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-09 — merge: oi-rail takes alfonso-frontend-jjtl (P-2026-11-09-0943)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-09 — fix: the rail in a split pane, click centre and drop guard (P-2026-11-09-1115)` once (branch).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-09 — feat(codegen): D6, the pinned hover card of the Text tab (P-2026-11-08-2330, P-2026-11-09-0020)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-09 — fix(codegen): D6b, the pinned card binds a chord, not Option+H (P-2026-11-09-0950)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-09 — merge: textual-d6-pinned-hover into alfonso-frontend-jjtl (P-2026-11-09-1001)` once (trunk).
4. `git merge --no-ff --no-commit b292b3d1b`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: oi-rail into alfonso-frontend-jjtl (P-2026-11-09-1209)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `b292b3d1b` in `/Users/alfonso/jjodel-w-oi-rail`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-oi-rail`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 53e89405f` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 53e89405f HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/instance-of.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the oi-rail merge (P-2026-11-09-1209)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-oi-rail`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
