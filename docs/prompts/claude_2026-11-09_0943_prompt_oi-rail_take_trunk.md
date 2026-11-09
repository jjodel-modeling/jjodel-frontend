# Prompt: oi-rail takes the trunk before its own merge

Prompt-ID: P-2026-11-09-0943
Chat: C-2026-10-25-2159
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (merge of oi-rail launched by chat C-2026-10-25-2159)
Lane: full (merge of the trunk into the branch; 3 conflicts: `docs/log-inbox/instance-of.md`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/panels/PalettePanel.tsx` measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-w-oi-rail`, branch `oi-rail`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-oi-rail`, branch `oi-rail`, `git log -1` is the commit that adds this file (its parent `04246f1ca`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-09-0943 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `733a67020` into `oi-rail` with one merge commit, `--no-ff`, in the shape of `cae331a7c` (the last merge commit on `oi-rail`; read its body first). Merge base `819c700b5`. The trunk brings, since the base, 456 commits:

- `733a67020` docs: Status flip and log entry for the notices merge (P-2026-11-09-0930)
- `ca4887172` merge: notices-discovery into alfonso-frontend-jjtl (P-2026-11-09-0930)
- `ee9b26666` docs: add prompt P-2026-11-09-0930, merge notices-discovery into alfonso-frontend-jjtl
- `42debddb3` docs: close notices phase 2, visual check passed (P-2026-11-08-2340, P-2026-11-09-0036)
- `0f4909dd0` docs: DCN session checkpoint 2026-11-09, slice 5
- `c27abbb50` docs: Status flip and log entry for the dcn-s5 merge (P-2026-11-09-0350)
- `42a62568a` merge: dcn-s5 into alfonso-frontend-jjtl (P-2026-11-09-0350)
- `abc8ba96c` docs: add prompt P-2026-11-09-0350, merge dcn-s5 into alfonso-frontend-jjtl
- `faa7b952c` docs(dcn): closure of the coherence wiring, visual check passed (P-2026-11-09-0320)
- `25532aae7` test(dcn): drone probe of the coherence hit (P-2026-11-09-0320)
- `31744a717` feat(dcn): coherence constraints as watch hits (P-2026-11-09-0320)
- `9107a5350` docs(dcn): prompt P-2026-11-09-0320
- `e48f5b1b9` docs(dcn): closure of the coherence evaluation (P-2026-11-09-0259)
- `ae14c5fa9` feat(dcn): coherence constraints over a trajectory (P-2026-11-09-0259)
- `092878d2e` docs(dcn): prompt P-2026-11-09-0259
- `511017c89` docs(dcn): closure of the coherence constraints fixture (P-2026-11-09-0237)
- `48f296d16` docs(dcn): drone measures with the coherence constraints (P-2026-11-09-0237)
- `b139d21b6` test(dcn): coherence constraints in the drone fixture (P-2026-11-09-0237)
- `c2808acd6` docs(dcn): prompt P-2026-11-09-0237
- `b0d2d8e76` docs(dcn): coherence roles closure, no visual check (P-2026-11-09-0124)
- `f7859224e` docs(dcn): status of the coherence roles prompt (P-2026-11-09-0124)
- `47e4d9519` docs(dcn): log of the coherence roles (P-2026-11-09-0124)
- `d6e051d6c` feat(dcn): coherence roles and their reader (P-2026-11-09-0124)
- `63e3afd5d` docs: Status flip and log entry for the dcn-s5 merge (P-2026-11-09-0053)
- `0cbda346a` docs(dcn): prompt P-2026-11-09-0124
- `dfac90f9e` merge: dcn-s5 into alfonso-frontend-jjtl (P-2026-11-09-0053)
- `669c52ab8` docs(dcn): S5 tickets closure, visual check passed (P-2026-11-09-0055)
- `66385f44a` docs(dcn): status of the bare arguments prompt (P-2026-11-09-0055)
- `2d8ffeb45` docs(dcn): log of bare arguments and chips at step back (P-2026-11-09-0055)
- `93619a11a` test(dcn): drone probe reads the chips at step back (P-2026-11-09-0055)
- `10b207546` fix(dcn): Classification chips follow the step shown (P-2026-11-09-0055)
- `57a7fc6da` fix(dcn): invocation arguments readable by bare name (P-2026-11-09-0055)
- `c8c49c049` docs(dcn): prompt P-2026-11-09-0055
- `be5fc56f9` docs: add prompt P-2026-11-09-0053, merge dcn-s5 into alfonso-frontend-jjtl
- `013f2f912` docs(dcn): S5 lane 6 closure, visual check passed (P-2026-11-09-0017)
- `7cfa7e5d9` docs(dcn): status of the Save snapshot prompt (P-2026-11-09-0017)
- `f482dc9f1` docs(dcn): log of the Save snapshot button (P-2026-11-09-0017)
- `55fe8cbb8` test(dcn): snapshot probe presses the panel button (P-2026-11-09-0017)
- `0e71ec074` feat(dcn): Save snapshot button in the Simulation panel (P-2026-11-09-0017)
- `45d3b1794` fix(probe): library gallery closes the new tips card (P-2026-11-09-0036)
- and 416 more: `git log --oneline 819c700b5..733a67020`

This branch brings, 40 commits:

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
- `5ae75efd0` docs: close onto binding editor lanes, log entry, ticket (P-2026-11-08-0151)
- `d680fce0d` chore(probe): onto binding editor acceptance, B-0..B-9 (P-2026-11-08-0151)
- `9c885ad68` docs: add prompt P-2026-11-08-0151, binding editor continuation
- `c55874212` feat(onto): binding editor with Detect, one row in Info (P-2026-11-08-0113)
- `55f5e0f8d` docs: add prompt P-2026-11-08-0113, onto binding editor
- `e138a09ca` docs: discovery, onto rail section and binding declaration (P-2026-11-08-0049)
- `2e71bf482` docs: add prompt P-2026-11-08-0049, discovery rail and binding declaration

Measured by `lane-run merge --trunk-into` at 2026-11-09 09:43, trunk at `733a67020`:

- `git merge-tree --write-tree --name-only oi-rail 733a67020`: 3 conflicts: `docs/log-inbox/instance-of.md`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/panels/PalettePanel.tsx`.
- Files changed since the base: 39 on the branch side, 322 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/instance-of.md`, `frontend/src/components/editor-v2/EditorV2.scss`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/panels/PalettePanel.tsx`.
- `git diff --name-only 819c700b5 04246f1ca -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-08_0049_prompt_onto_rail_binding_discovery.md` (eseguito 2026-11-08 · lane discovery · e138a09ca), `claude_2026-11-08_0113_prompt_onto_binding_editor.md` (eseguito 2026-11-08 · lane full · c55874212), `claude_2026-11-08_0151_prompt_onto_binding_editor_continue.md` (eseguito 2026-11-08 · lane full · d680fce0d), `claude_2026-11-08_0212_prompt_onto_rail_section.md` (eseguito 2026-11-08 · lane full · ba69124a9), `claude_2026-11-08_0241_prompt_onto_rail_continue.md` (eseguito 2026-11-08 · lane full · ba69124a9), `claude_2026-11-08_1605_prompt_onto_levels_discovery.md` (eseguito 2026-11-08 · lane full · 4d736d663), `claude_2026-11-08_1635_prompt_onto_levels_discovery_continue.md` (eseguito 2026-11-08 · lane full · 4d736d663), `claude_2026-11-08_1658_prompt_onto_levels_surfaces.md` (eseguito 2026-11-08 · lane full · b8fbddd72), `claude_2026-11-08_1726_prompt_onto_levels_surfaces_continue.md` (eseguito 2026-11-08 · lane full · b8fbddd72), `claude_2026-11-08_1753_prompt_onto_class_rail.md` (eseguito 2026-11-08 · lane full · b8b9bfe30), `claude_2026-11-08_1822_prompt_onto_class_rail_continue.md` (eseguito 2026-11-08 · lane full · 3f399f545), `claude_2026-11-08_2012_prompt_onto_s4_links.md` (eseguito 2026-11-08 · lane full · d9b1912f9), `claude_2026-11-08_2041_prompt_onto_s4_links_continue.md` (eseguito 2026-11-08 · lane full · 2bed6cb5c), `claude_2026-11-08_2146_prompt_onto_class_fixes.md` (eseguito 2026-11-08 · lane full · a5f657409), `claude_2026-11-08_2214_prompt_onto_class_fixes_continue.md` (eseguito 2026-11-08 · lane full · 4ee0983ac).
- `git worktree list`: `oi-rail` in `/Users/alfonso/jjodel-w-oi-rail`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- a conflict the union rule does not cover: `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/panels/PalettePanel.tsx`

## COME

1. Preconditions above, plus: `733a67020` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `733a67020` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only oi-rail 733a67020` (measured above: 3 conflicts: `docs/log-inbox/instance-of.md`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/panels/PalettePanel.tsx`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 733a67020`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-OI-18` (branch), `R-OI-19` (branch), `R-OI-20` (branch), `R-OI-21` (branch), `R-OI-22` (branch), `R-OI-23` (branch), `R-OI-24` (branch), `R-TXT-59` (trunk), `R-JTG-23` (trunk), `R-JTG-24` (trunk), `R-JTG-25` (trunk), `R-JTG-26` (trunk), `R-JTG-27` (trunk), `R-JTG-28` (trunk), `R-JTG-29` (trunk), `R-JTG-30` (trunk), `R-JTG-31` (trunk), `R-JTG-32` (trunk), `R-JTG-33` (trunk), `R-JTG-34` (trunk), `R-JTG-35` (trunk), `R-DCN-25` (trunk), `R-DCN-26` (trunk), `R-DCN-27` (trunk), `R-DCN-28` (trunk), `R-DCN-29` (trunk), `R-DCN-30` (trunk), `R-DCN-31` (trunk), `R-DCN-32` (trunk), `R-MT-25` (trunk), `R-MT-26` (trunk), `R-NT-1` (trunk), `R-NT-2` (trunk), `R-NT-3` (trunk), `R-NT-4` (trunk), `R-NT-5` (trunk); control: `- **R-NT-6**` none.
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: onto binding editor with Detect, probe and bench (P-2026-11-08-0151)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — ticket: value kinds can be edited in the binding editor but not added` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: «Instances of» rail section, probe, regression, bench (P-2026-11-08-0241)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: the viewpoint's level gates the instance surfaces (P-2026-11-08-1726)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: the class rail and pane menu from the binding, probe, bench (P-2026-11-08-1822)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: a link drawn between two instances, probe, bench (P-2026-11-08-2041)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — fix: class diagram defects, one undo for the generalization, handle reach (P-2026-11-08-2214)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — ticket: one undo does not remove an object-as-edge outside level class` once (branch).
   - `docs/decisions.md`: the heading `## R-NT: notices and tips (decisions 2026-11-08)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): F2, a generated line to the model line in the Text tab (P-2026-11-08-0027)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-f2-reveal into alfonso-frontend-jjtl (P-2026-11-08-0122)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): T8a, ids in the text and evidence 0 of the match (P-2026-11-08-0121)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-t8a-ids into alfonso-frontend-jjtl (P-2026-11-08-0152)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): T8b, Export and Import of the text in the Text tab (P-2026-11-08-0206)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-t8b-file into alfonso-frontend-jjtl (P-2026-11-08-0246)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(codegen): D2d, suggest row inside the Text tab's widget (P-2026-11-08-0738)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-d2d-suggest into alfonso-frontend-jjtl (P-2026-11-08-0803)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): T8c, the re-import dialog in the confirm panel (P-2026-11-08-0739)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-t8c-dialog into alfonso-frontend-jjtl (P-2026-11-08-0829)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — test(codegen): T8d, calibration bench of the match thresholds (P-2026-11-08-0831)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-t8d-calibration into alfonso-frontend-jjtl (P-2026-11-08-0845)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(codegen): TABFIX, three Text tab candidate tickets (P-2026-11-08-0859)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-tab-fixes into alfonso-frontend-jjtl (P-2026-11-08-0932)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(editor-v2): C2f, IR reference widgets name unnamed targets (P-2026-11-08-0843)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-c2f-labels into alfonso-frontend-jjtl (P-2026-11-08-1201)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(editor-v2): C2g, one label for unnamed reference targets (P-2026-11-08-1239)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-c2g-align into alfonso-frontend-jjtl (P-2026-11-08-1330)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — ticket: undo: reducer indexes the sender stack with the length of all` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(undo): a canvas create opens its own entry, #682 Phase 2 (P-2026-11-08-1202, P-2026-11-08-1313)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: undo-682-create-entry into alfonso-frontend-jjtl (P-2026-11-08-1344)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — ticket: undo: an M2 tab open writes a layout entry of its own` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — ticket: undo: a vertex-only populate merges into the entry below` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — ticket: tabs: the graph rebuild guard of ModelTab is dead` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — ticket: sync: the v2-flow graph id is written twice in root graphs` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(undo): a graph-only delta writes no undo entry (P-2026-11-08-1800)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: undo-tab-graphs-b into alfonso-frontend-jjtl (P-2026-11-08-1858)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(jjscript): settle waits for in-flight dispatches (P-2026-11-08-1759)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: jjscript-settle-inflight into alfonso-frontend-jjtl (P-2026-11-08-1912)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — fix(editor-v2): C2h, index on unnamed homonyms of IR chips and default view (P-2026-11-08-1626)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-c2h-index into alfonso-frontend-jjtl (P-2026-11-08-1926)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — feat(codegen): T8e, thresholds as a parameter, homonyms by content, highlight off-screen (P-2026-11-08-1625, P-2026-11-08-1705, P-2026-11-08-1718, P-2026-11-08-1927)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-08 — merge: textual-t8e-match into alfonso-frontend-jjtl (P-2026-11-08-2002)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — discovery: dashboard drop import, stopped before Phase 2 (P-2026-11-08-1845)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — fix(dashboard): shared .jjodel import, awaited transaction, failures reported (P-2026-11-08-2015)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): import modal with drop area, empty state import (P-2026-11-08-2040)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): drag tracking and drop overlay (P-2026-11-08-2115)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): drop import panel and toasts (P-2026-11-08-2145)` once (trunk).
   - `docs/log-inbox/dashboard-drop-import.md`: the heading `## 2026-11-08 — feat(dashboard): imported card marker and modal feedback (P-2026-11-08-2215)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — fix: conformance parses DCN bodies in DCN mode; W1 names association-owned ends` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — merge: dcn-conf into alfonso-frontend-jjtl (P-2026-11-08-0040)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — test: DCN drone object diagram on R-OI instantiation (P-2026-11-08-0011, P-2026-11-08-0057)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — merge: dcn-l25 into alfonso-frontend-jjtl (P-2026-11-08-0154)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — feat: DCN L4.5 run wiring, startRun to panel (P-2026-11-08-0248, P-2026-11-08-0303, P-2026-11-08-0315)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — fix: a DCN run freezes its model, class shell flags read the stored field (P-2026-11-08-0345)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — test: DCN drone run in the Simulation panel, crops (P-2026-11-08-0329)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — merge: dcn-l45 into alfonso-frontend-jjtl (P-2026-11-08-0430)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — fix: DCN Simulation panel polish, findings of the L4.5 visual check (P-2026-11-08-1606)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — test: DCN drone fixture fills the empty slots, exports regenerated (P-2026-11-08-1652)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — merge: dcn-l47 into alfonso-frontend-jjtl (P-2026-11-08-1757)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — feat: DCN run card state, pure per instance (P-2026-11-08-1829)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — feat: DCN run card data reachable from the canvas (P-2026-11-08-1905)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — test: DCN drone object level in the UML object viewpoint (P-2026-11-08-1939)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — feat: DCN run card under the instance node (P-2026-11-08-2042)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — merge: dcn-s5 into alfonso-frontend-jjtl (P-2026-11-08-2122)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — feat: DCN snapshot copy, the pure plan (P-2026-11-08-2124)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-08 — feat: DCN snapshot written as a new model, layout, exact match (P-2026-11-08-2355)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN Save snapshot button in the Simulation panel (P-2026-11-09-0017)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — merge: dcn-s5 into alfonso-frontend-jjtl (P-2026-11-09-0053)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — fix: DCN bare invocation arguments, chips at step back (P-2026-11-09-0055)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN coherence roles and their reader (P-2026-11-09-0124)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — test: DCN coherence constraints in the drone fixture (P-2026-11-09-0237)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN coherence constraints over a trajectory (P-2026-11-09-0259)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — feat: DCN coherence constraints in a run, as watch hits (P-2026-11-09-0320)` once (trunk).
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — merge: dcn-s5 into alfonso-frontend-jjtl (P-2026-11-09-0350)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-08 — ticket: lane-run merge template: rollback reset names the commit before the prompt commit` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-11-08 — ticket: smoke: the first run after a cold Vite start times out on page.goto` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — discovery: JjTL gaps on the generic Brief transformation (P-2026-11-08-0125)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — ticket: a JjTL demand used as a value gives a wrong target and success true` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — docs: closure of the blocked jjtl-kernel-gaps merge` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — fix(jjtl): envValue, and a demand used as an operand stops the run (P-2026-11-08-0740)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-envvalue into alfonso-frontend-jjtl (P-2026-11-08-0814)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — fix(jjtl): a demand compared or called stops the run (P-2026-11-08-0835)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-demand-cmp into alfonso-frontend-jjtl (P-2026-11-08-0901)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — feat(jjtl): several source models of one metamodel, executor side (P-2026-11-08-0836)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-multi-source into alfonso-frontend-jjtl (P-2026-11-08-0939)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — fix(jjtl): a property read on a demand warns (P-2026-11-08-1025)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-demand-read into alfonso-frontend-jjtl (P-2026-11-08-1041)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — ticket: envLookup on an unbound name is null, so + "_w" succeeds` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — feat(jjtl): several source models in the run dialog, closed with two visual fixes (P-2026-11-08-1120)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-multi-source-app into alfonso-frontend-jjtl (P-2026-11-08-1147)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — feat(jjtl): included models as pills, unbound envLookup stops the run (P-2026-11-08-1230)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-include-pills into alfonso-frontend-jjtl (P-2026-11-08-1359)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — ticket: two conformsTo pills touch model nodes in the megamodel` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — feat(megamodel): an input edge per included model, tracks in a gap (P-2026-11-08-1720)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-11-08 — merge: jjtl-megamodel-included into alfonso-frontend-jjtl (P-2026-11-08-1842)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-07 — merge: oi-s3b into alfonso-frontend-jjtl (P-2026-11-07-1834)` once (trunk).
   - `docs/log-inbox/jjodie-ui.md`: the heading `## 2026-11-08 — ticket: Refactoring finds no M1 target on the multi-tab demo project` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — feat: IR resolution follows the tab's viewpoint (multi-tab L5)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-07 — ticket: publishedChannelSlots is one module-level list for every IR canvas` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: alfonso-frontend-jjtl into multi-tab-l5 (P-2026-11-08-0012)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: multi-tab-l5 into alfonso-frontend-jjtl (P-2026-11-08-0055)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — fix: one populate owner per model, the last instance clears (multi-tab L4)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — ticket: sync registries have no model key, the last tab of model N clears model M` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: multi-tab-l4 into alfonso-frontend-jjtl (P-2026-11-08-0737)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — feat: a second tab on one model, Open in new tab and Open beside (multi-tab L6)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — ticket: the Console reads the dock tab id as a model id` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: alfonso-frontend-jjtl into multi-tab-l6 (P-2026-11-08-1156)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: multi-tab-l6 into alfonso-frontend-jjtl (P-2026-11-08-1247)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — fix: the beside layout, rail column, width cap, app bar, minimap, toolbar (multi-tab L6b)` once (trunk).
   - `docs/log-inbox/multi-tab.md`: the heading `## 2026-11-08 — merge: multi-tab-l6b into alfonso-frontend-jjtl (P-2026-11-08-2223)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-08 — docs: notices and tips discovery, Phase 1 (P-2026-11-08-2230)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — ticket: donation banner ignores the right rail in the editor` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — ticket: .notification-header is global and reaches the JjScript success notification` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — ticket: Properties overlay covers the Help menu in the editor` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — feat: notices and tips Phase 2, banner, tips card, tips browser (P-2026-11-08-2340)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — chore: notices Phase 2 closure, gates, stale probe, tickets (P-2026-11-09-0036)` once (trunk).
   - `docs/log-inbox/notices.md`: the heading `## 2026-11-09 — merge: notices-discovery into alfonso-frontend-jjtl (P-2026-11-09-0930)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/decisions.md`, `docs/log-inbox/instance-of.md`, `frontend/src/components/editor-v2/EditorV2.scss`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/panels/PalettePanel.tsx`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: oi-rail takes alfonso-frontend-jjtl (P-2026-11-09-0943)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-oi-rail/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 04246f1ca` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane oi-rail · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/instance-of.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, oi-rail took the trunk (P-2026-11-09-0943)` (P16, RC-17). `Outcome: done`. The merge of `oi-rail` into the trunk gets its own prompt (`lane-run merge oi-rail --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
