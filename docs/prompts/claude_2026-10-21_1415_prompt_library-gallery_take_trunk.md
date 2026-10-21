# Prompt: library-gallery takes the trunk before its own merge

Prompt-ID: P-2026-10-21-1415
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge of the trunk into the branch; 12 conflicts: `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md`, `docs/log-inbox/templates-ui.md`, `docs/prompts/claude_2026-10-18_2150_prompt_library_gallery_viewpoints.md`, `docs/prompts/claude_2026-10-18_2300_prompt_library_gallery_templates_examples.md`, `docs/prompts/claude_2026-10-19_0300_prompt_library_example_viewpoints.md`, `docs/prompts/claude_2026-10-19_0930_prompt_ir_sim_active_predicate.md`, `docs/prompts/claude_2026-10-19_1615_prompt_templates_page.md`, `docs/prompts/claude_2026-10-19_1616_prompt_templates_sidebar.md`, `docs/prompts/claude_2026-10-19_1617_prompt_gallery_snapshots.md`, `docs/prompts/claude_2026-10-19_1618_prompt_new_model_dialog.md`, `docs/prompts/claude_2026-10-19_1650_prompt_file_new_menu.md`, `docs/prompts/claude_2026-10-19_1651_prompt_gallery_snapshots_crop.md` measured)
Status: eseguito 2026-10-21 · lane library-gallery · ee2ddcb8e · 12 docs conflicts, branch side (11) and union (1); typecheck, build, check:docs, check:scripts green; vitest 11507, 3 files red under load, green on rerun

Worktree: `/Users/alfonso/jjodel-w-gallery`, branch `library-gallery`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-gallery`, branch `library-gallery`, `git log -1` is the commit that adds this file (its parent `6355b1672`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-21-1415 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `213243815` into `library-gallery` with one merge commit, `--no-ff`, in the shape of `6355b1672` (the last merge commit on `library-gallery`; read its body first). Merge base `56b54365e`. The trunk brings, since the base, 468 commits:

- `213243815` docs: add prompt P-2026-10-21-1405, S3a slot problems discovery
- `06f52593c` docs: add prompt P-2026-10-21-1355, finish the intrinsic measure cache
- `77eba1327` docs: prompt for the Tack v0 closure (P-2026-10-21-1330), supersedes P-2026-10-19-2100
- `440904eeb` docs: Status flip and log entry for the tack-s1a merge (P-2026-10-21-1246)
- `e078f7ac9` docs: add prompt P-2026-10-21-1240, cache the intrinsic measure with inherited-CSS invalidation
- `7ffae32c3` docs: Status of P-2026-10-21-1219, checkpoint of chat C-2026-10-20-1835
- `8dec8e774` merge: tack-s1a into alfonso-frontend-jjtl (P-2026-10-21-1246)
- `7d09eab1c` docs: add prompt P-2026-10-21-1246, merge tack-s1a into alfonso-frontend-jjtl
- `99072d5fd` docs: Status flip and log entry for the perf-round3 merge (P-2026-10-21-1232)
- `74b80d710` merge: perf-round3 into alfonso-frontend-jjtl (P-2026-10-21-1232)
- `947b66388` docs: add prompt P-2026-10-21-1232, merge perf-round3 into alfonso-frontend-jjtl
- `c06a8cd6d` docs: close the inset fix, the batch measured and dropped (P-2026-10-21-1115)
- `601b73a7a` docs: log entry and Status for Tack S1, adapter boundary (P-2026-10-21-1210)
- `1f9d718fd` chore(probe): CLICK_LAYOUTS counts the layouts of the intrinsic measure (P-2026-10-21-1115)
- `365f9ca9a` fix(editor-v2): fitViewOptions without a body style read per render (P-2026-10-21-1115)
- `0ff5e64c9` docs: prompt P-2026-10-21-1219 (S2u settle), Status of P-2026-10-21-1121
- `3e095ad20` feat(tack): trace-source boundary around lane-run (P-2026-10-21-1210)
- `be844ba6d` docs: prompt for Tack S1, adapter boundary (P-2026-10-21-1210)
- `e42ef81b6` docs: Status flip and log entry for the tack-s9 merge (P-2026-10-21-1141)
- `9115d32d7` merge: tack-s9 into alfonso-frontend-jjtl (P-2026-10-21-1141)
- `10861c2d6` docs: ticket, flaky vitest under load blocks direct merges (found in P-2026-10-21-1114)
- `31144ff68` docs: add prompt P-2026-10-21-1141, merge tack-s9 into alfonso-frontend-jjtl
- `1df2d6037` docs: Status of P-2026-10-21-1117 as on tack-s9 (pre-merge alignment)
- `7ab74c299` docs: Status flip for the lanemon-tray merge, resolved after a rerun of load flakes (P-2026-10-21-1114)
- `24334c432` docs: log entry and Status for Tack slice 9, P-2026-10-21-1025 (P-2026-10-21-1117)
- `5b7c02c12` feat(tack): waiting cards and /api/attention, P-2026-10-21-1025 (P-2026-10-21-1117)
- `a1c90aa40` merge: lanemon-tray into alfonso-frontend-jjtl (P-2026-10-21-1114)
- `531cd2c71` docs: prompt P-2026-10-21-1121 (S2u Member entry), Status of P-2026-10-21-1041
- `7c086fe2a` docs: add prompt P-2026-10-21-1114, merge lanemon-tray into alfonso-frontend-jjtl
- `32d45172d` docs(prompts): renumber the slice 9 continuation to P-2026-10-21-1117 (1115 taken by another chat)
- `c70eefd83` docs(prompts): Tack slice 9 continuation (P-2026-10-21-1115)
- `d74143a33` Merge branch 'alfonso-frontend-jjtl' into perf-round3
- `cce5ce378` docs: add prompt P-2026-10-21-1115, finish the batched intrinsic measure and the inset fix
- `88cdf30c4` docs: log entry and Status for the tray counts (P-2026-10-21-1020)
- `c42a2abd5` feat(lane-monitor-app): tray title shows waiting and running counts (P-2026-10-21-1020)
- `4ecf3c26f` docs(prompts): 1025 takes the three follow-ups of P-2026-10-21-1015
- `dd27a5fc6` docs: Status flip for the tack-stops merge, resolved after a rerun of 3 load flakes (P-2026-10-21-1035)
- `11ee4bfe1` merge: tack-stops into alfonso-frontend-jjtl (P-2026-10-21-1035)
- `e3449d51c` docs: prompt P-2026-10-21-1041 (S2u verification), Status of P-2026-10-21-1016
- `a05193f0c` docs: add prompt P-2026-10-21-1035, merge tack-stops into alfonso-frontend-jjtl
- and 428 more: `git log --oneline 56b54365e..213243815`

This branch brings, 59 commits:

- `6355b1672` merge: tpl-int, templates 3.2 lanes L-B1, L-B2, L-C, L-C2, L-D, L-E into library-gallery
- `28babece1` docs(log-inbox): rebuild templates-ui entries lost in the tpl-int merges
- `643e4fe20` Merge branch 'tpl-c2' into tpl-int
- `ab549528a` Merge branch 'tpl-e' into tpl-int
- `e0bda6326` docs: File › New report, log and status (P-2026-10-19-1650)
- `1c3d9460e` feat(navbar): File › New in the 3.2 structure (P-2026-10-19-1650)
- `057ccca08` docs: cropped template previews, report, log and status (P-2026-10-19-1651)
- `f120bd3cf` feat(library): crop template previews to the root class (P-2026-10-19-1651)
- `efe29b172` fix(dashboard): no left bar on the active sidebar item
- `6dda053ff` fix(templates): template ids follow the app bar mode switch
- `f72fd0163` fix(templates): white card and preview, as the handoff says
- `4d683d9c0` docs: add prompts P-2026-10-19-1650 (File › New) and 1651 (readable previews)
- `5956fcefa` docs: add prompts P-2026-10-19-1650 (File › New) and 1651 (readable previews)
- `ab3755454` Merge branch 'tpl-d' into tpl-int
- `1f8f0806b` Merge branch 'tpl-c' into tpl-int
- `8f9997e14` Merge branch 'tpl-b2' into tpl-int
- `03b9d4585` docs(library): closure of the gallery lanes, visual check passed (P-2026-10-19-0930)
- `ecfa139aa` docs: New model dialog, L-D report and log (P-2026-10-19-1618)
- `6d70d38c1` feat(project): New model dialog, metamodel tab only (P-2026-10-19-1618)
- `1fefd728f` docs(templates): L-B1 report section, log entry, status (P-2026-10-19-1615)
- `64e220112` docs(library): catalog level, concepts, callout, preview (P-2026-10-19-1615)
- `88f109b65` feat(templates): search, concept and level filters, card previews (P-2026-10-19-1615)
- `2ec9bcd8b` docs: gallery preview snapshots, L-C report, log, Status (P-2026-10-19-1617)
- `2e8cd5a7a` feat(library): gallery preview snapshots, seven PNGs (P-2026-10-19-1617)
- `b9a4c80a4` docs: L-B2 report section, log entry, Status (P-2026-10-19-1616)
- `b25c41db8` feat(dashboard): sidebar active state, no FILTERS or tip on Templates (P-2026-10-19-1616)
- `7db92862d` docs: add prompts P-2026-10-19-1615..1618, templates 3.2 lanes L-B1, L-B2, L-C, L-D
- `ba5c937fe` docs: add prompts P-2026-10-19-1615..1618, templates 3.2 lanes L-B1, L-B2, L-C, L-D
- `d31d4ff25` docs: add prompts P-2026-10-19-1615..1618, templates 3.2 lanes L-B1, L-B2, L-C, L-D
- `86854b0e3` docs: add prompts P-2026-10-19-1615..1618, templates 3.2 lanes L-B1, L-B2, L-C, L-D
- `8f0840e42` docs(discovery): templates, notations, file new (P-2026-10-19-1510)
- `e4192a3d7` docs: add prompt P-2026-10-19-1510, templates/notations/file new discovery
- `1ce53a8cf` docs(design): templates, notations, file new handoff (3.2, R-LIB)
- `e1bb5db65` fix(library): Petri example tokens hidden while a run is active (P-2026-10-19-0930)
- `15fac4bfa` docs(library): catalog sha256 of petri-producer-consumer@1 (P-2026-10-19-0930)
- `50ab1d74c` feat(ir): simActive predicate, true while a run shows an element's model (P-2026-10-19-0930)
- `790c059f5` docs: add prompt P-2026-10-19-0930 (IR simActive predicate)
- `18ce5cdf1` feat(library): hand-written example viewpoints (P-2026-10-19-0300)
- `126e5972f` docs(library): catalog sha256 of the example viewpoints (P-2026-10-19-0300)
- `9cc5f28ab` docs: add prompt P-2026-10-19-0300 (example viewpoints)
- and 19 more: `git log --oneline 56b54365e..6355b1672`

Measured by `lane-run merge --trunk-into` at 2026-10-21 14:15, trunk at `213243815`:

- `git merge-tree --write-tree --name-only library-gallery 213243815`: 12 conflicts: `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md`, `docs/log-inbox/templates-ui.md`, `docs/prompts/claude_2026-10-18_2150_prompt_library_gallery_viewpoints.md`, `docs/prompts/claude_2026-10-18_2300_prompt_library_gallery_templates_examples.md`, `docs/prompts/claude_2026-10-19_0300_prompt_library_example_viewpoints.md`, `docs/prompts/claude_2026-10-19_0930_prompt_ir_sim_active_predicate.md`, `docs/prompts/claude_2026-10-19_1615_prompt_templates_page.md`, `docs/prompts/claude_2026-10-19_1616_prompt_templates_sidebar.md`, `docs/prompts/claude_2026-10-19_1617_prompt_gallery_snapshots.md`, `docs/prompts/claude_2026-10-19_1618_prompt_new_model_dialog.md`, `docs/prompts/claude_2026-10-19_1650_prompt_file_new_menu.md`, `docs/prompts/claude_2026-10-19_1651_prompt_gallery_snapshots_crop.md`.
- Files changed since the base: 121 on the branch side, 463 on the trunk side; on both sides: `docs/design/claude_2026-10-19_design_handoff_templates_notations_file_new.md`, `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md`, `docs/log-inbox/templates-ui.md`, `docs/prompts/claude_2026-10-18_2150_prompt_library_gallery_viewpoints.md`, `docs/prompts/claude_2026-10-18_2300_prompt_library_gallery_templates_examples.md`, `docs/prompts/claude_2026-10-19_0300_prompt_library_example_viewpoints.md`, `docs/prompts/claude_2026-10-19_0930_prompt_ir_sim_active_predicate.md`, `docs/prompts/claude_2026-10-19_1510_prompt_templates_notations_discovery.md`, `docs/prompts/claude_2026-10-19_1615_prompt_templates_page.md`, `docs/prompts/claude_2026-10-19_1616_prompt_templates_sidebar.md`, `docs/prompts/claude_2026-10-19_1617_prompt_gallery_snapshots.md`, `docs/prompts/claude_2026-10-19_1618_prompt_new_model_dialog.md`, `docs/prompts/claude_2026-10-19_1650_prompt_file_new_menu.md`, `docs/prompts/claude_2026-10-19_1651_prompt_gallery_snapshots_crop.md`, `frontend/package.json`, `frontend/src/pages/components/Navbar.tsx`, `frontend/src/pages/components/navbar.scss`.
- `git diff --name-only 56b54365e 6355b1672 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-18_2150_prompt_library_gallery_viewpoints.md` (eseguito 2026-10-18 · lane notation-library · 2925b96d8 · held without GO, superseded by R-LIB-9 (P-2026-10-18-2300)), `claude_2026-10-18_2300_prompt_library_gallery_templates_examples.md` (eseguito 2026-10-18 · lane notation-library · 4a3c1db49 (correction round 2) · verifica visiva passata 2026-10-19 16:41 (Alfonso, RC-23)), `claude_2026-10-19_0300_prompt_library_example_viewpoints.md` (eseguito 2026-10-19 · lane notation-library · 18ce5cdf1 · verifica visiva passata 2026-10-19 16:41 (Alfonso, RC-23) · decisione in attesa chiusa da P-2026-10-19-0930), `claude_2026-10-19_0930_prompt_ir_sim_active_predicate.md` (eseguito 2026-10-19 · lane notation-library · 50ab1d74c, 15fac4bfa, e1bb5db65 · verifica visiva passata 2026-10-19 16:41 (Alfonso, RC-23)), `claude_2026-10-19_1510_prompt_templates_notations_discovery.md` (eseguito 2026-10-19 · lane templates-ui · Phase 1 report, docs commit carrying this line · hard-stop, Phase 2 written by the chat (RC-26)), `claude_2026-10-19_1615_prompt_templates_page.md` (eseguito 2026-10-19 · lane tpl-b1 · 88f109b65 · visual check owed to the chat (RC-23)), `claude_2026-10-19_1616_prompt_templates_sidebar.md` (eseguito 2026-10-19 · lane tpl-b2 · b25c41db8 · visual check owed to the chat (RC-23)), `claude_2026-10-19_1617_prompt_gallery_snapshots.md` (eseguito 2026-10-19 · lane tpl-c · 2e8cd5a7a · visual check owed to the chat (RC-23)), `claude_2026-10-19_1618_prompt_new_model_dialog.md` (eseguito 2026-10-19 · lane tpl-d · 6d70d38c1 · visual check owed to the chat (RC-23)), `claude_2026-10-19_1650_prompt_file_new_menu.md` (eseguito 2026-10-19 · lane tpl-e · 1c3d9460e · visual check owed to the chat (RC-23)), `claude_2026-10-19_1651_prompt_gallery_snapshots_crop.md` (eseguito 2026-10-19 · lane tpl-c2 · f120bd3cf · visual check owed to the chat (RC-23)).
- `git worktree list`: `library-gallery` in `/Users/alfonso/jjodel-w-gallery`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Findings.** `lane-run merge` refuses `--launch` on this measurement:

- a conflict the union rule does not cover: `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md`, `docs/prompts/claude_2026-10-18_2150_prompt_library_gallery_viewpoints.md`, `docs/prompts/claude_2026-10-18_2300_prompt_library_gallery_templates_examples.md`, `docs/prompts/claude_2026-10-19_0300_prompt_library_example_viewpoints.md`, `docs/prompts/claude_2026-10-19_0930_prompt_ir_sim_active_predicate.md`, `docs/prompts/claude_2026-10-19_1615_prompt_templates_page.md`, `docs/prompts/claude_2026-10-19_1616_prompt_templates_sidebar.md`, `docs/prompts/claude_2026-10-19_1617_prompt_gallery_snapshots.md`, `docs/prompts/claude_2026-10-19_1618_prompt_new_model_dialog.md`, `docs/prompts/claude_2026-10-19_1650_prompt_file_new_menu.md`, `docs/prompts/claude_2026-10-19_1651_prompt_gallery_snapshots_crop.md`

## COME

1. Preconditions above, plus: `213243815` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `213243815` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only library-gallery 213243815` (measured above: 12 conflicts: `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md`, `docs/log-inbox/templates-ui.md`, `docs/prompts/claude_2026-10-18_2150_prompt_library_gallery_viewpoints.md`, `docs/prompts/claude_2026-10-18_2300_prompt_library_gallery_templates_examples.md`, `docs/prompts/claude_2026-10-19_0300_prompt_library_example_viewpoints.md`, `docs/prompts/claude_2026-10-19_0930_prompt_ir_sim_active_predicate.md`, `docs/prompts/claude_2026-10-19_1615_prompt_templates_page.md`, `docs/prompts/claude_2026-10-19_1616_prompt_templates_sidebar.md`, `docs/prompts/claude_2026-10-19_1617_prompt_gallery_snapshots.md`, `docs/prompts/claude_2026-10-19_1618_prompt_new_model_dialog.md`, `docs/prompts/claude_2026-10-19_1650_prompt_file_new_menu.md`, `docs/prompts/claude_2026-10-19_1651_prompt_gallery_snapshots_crop.md`). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 213243815`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `RC-51` (trunk), `RC-52` (trunk), `RC-53` (trunk), `R-SIM-147` (trunk), `R-GV-18` (trunk), `R-REL-2` (trunk), `R-REL-3` (trunk), `R-LIB-7` (trunk), `R-LIB-8` (trunk), `R-LIB-9` (trunk), `R-LIB-10` (trunk), `R-LIB-11` (trunk), `R-LIB-12` (trunk), `R-LIB-13` (trunk), `R-LIB-14` (trunk), `R-LIB-15` (trunk), `R-LIB-16` (trunk), `R-LIB-17` (trunk), `R-LIB-18` (trunk), `R-LIB-19` (trunk), `R-LIB-20` (trunk), `R-SHELL-1` (trunk), `R-SHELL-2` (trunk), `R-SHELL-3` (trunk), `R-SHELL-4` (trunk), `R-SHELL-5` (trunk), `R-LIB-21` (trunk), `R-TACK-1` (trunk), `R-TACK-2` (trunk), `R-TACK-3` (trunk), `R-TACK-4` (trunk), `R-TACK-5` (trunk), `R-TACK-6` (trunk), `R-TACK-7` (trunk), `R-OI-1` (trunk), `R-OI-2` (trunk), `R-OI-3` (trunk), `R-OI-4` (trunk), `R-OI-5` (trunk), `R-OI-6` (trunk), `R-OI-7` (trunk), `R-OI-8` (trunk), `R-OI-9` (trunk), `R-OI-10` (trunk), `R-OI-11` (trunk), `R-OI-12` (trunk), `R-BV-1` (trunk), `R-BV-2` (trunk), `R-BV-3` (trunk), `R-BV-4` (trunk), `R-BV-5` (trunk), `R-BV-6` (trunk), `R-BV-7` (trunk), `R-BV-8` (trunk), `R-BV-10` (trunk), `R-BV-9` (trunk); control: `- **R-BV-11**` none.
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — ticket: import loses the user-defined megamodel edges: registered under the file's project id` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — feat: library gallery, five R-LIB-5 projects built and cloned from Templates (P-2026-10-18-1800)` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — ticket: the app-bar mode control shows Basic after leaving All Projects, the stored mode is advanced` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — feat: derived viewpoints in the five gallery projects, S1b (P-2026-10-18-2150)` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — feat: gallery templates and examples, versioned, deep link, hand-written viewpoints (P-2026-10-18-2300)` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — ticket: edges end about 5 px off the node border in every diagram` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-19 — feat: hand-written viewpoints for the two gallery examples (P-2026-10-19-0300)` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-19 — feat: IR predicate simActive, the Petri example's tokens hidden during a run (P-2026-10-19-0930)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — fix: template previews cropped to the root class, lane L-C2 (P-2026-10-19-1651)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: File › New in the 3.2 structure, lane L-E (P-2026-10-19-1650)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: New model dialog, metamodel tab only, lane L-D (P-2026-10-19-1618)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: gallery preview snapshots, lane L-C (P-2026-10-19-1617)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: dashboard sidebar and quick tip on Templates, lane L-B2 (P-2026-10-19-1616)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: templates page, catalog fields and filters, lane L-B1 (P-2026-10-19-1615)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — discovery: templates, notations, file new, lane L-A (P-2026-10-19-1510)` once (both sides).
   - `docs/decisions.md`: the heading `### Decisions 2026-10-20: a trigger that fork or join fusion drops (R-SIM-147)` once (trunk).
   - `docs/decisions.md`: the heading `## R-SHELL — shell visual consolidation (decisions 2026-10-19)` once (trunk).
   - `docs/decisions.md`: the heading `## R-TACK — Tack, the project-agnostic harness monitor (decisions 2026-10-19)` once (trunk).
   - `docs/decisions.md`: the heading `## R-OI — ontological instantiation in one model: UML class and object diagrams (decisions 2026-10-20)` once (trunk).
   - `docs/decisions.md`: the heading `## R-BV: fixed-width bit-vector values in JjEL (decisions 2026-10-20)` once (trunk).
   - `docs/log-inbox/graphvertex.md`: the heading `## 2026-10-20 — fix(editor-v2): graphVertex hides the edges a container encloses, R-GV-18 (P-2026-10-20-1420)` once (trunk).
   - `docs/log-inbox/graphvertex.md`: the heading `## 2026-10-20 — merge: gv-enclosed-edges into alfonso-frontend-jjtl (P-2026-10-20-1437)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): merges into trunk restart the lane board (P-2026-10-18-1752)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: board-kickstart into alfonso-frontend-jjtl (P-2026-10-18-1859)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(harness): lane board Cost column and spend per day by turn (P-2026-10-18-1750)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: lane-cost into alfonso-frontend-jjtl (P-2026-10-18-2010)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — chore(harness): B7, rule-trigger and context-ceiling registered, AM-1 env, agents on Sonnet (P-2026-10-18-1655)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: context-ceiling lags one call under claude -p; B8a measures JJODEL_LANE_LOG` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: B8c writes the AM-1 test comparing agent models with the settings env` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: hook-registration into alfonso-frontend-jjtl (P-2026-10-18-2056)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — test(harness): B8c, RC-51 and RC-52 rows for AM-8 and AM-9, the AM-1 agent-model test (P-2026-10-18-2125)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: decisions-query ends a row header at its first closing parenthesis` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — merge: context-rules into alfonso-frontend-jjtl (P-2026-10-18-2207)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: the merge template names the wrong pre-merge tip for the check:addonly reset` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — discovery: lane monitor as a menu bar app, Phase 1 (P-2026-10-18-2255)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — feat(lane-board): /api/attention and /l/<id> for the menu bar app (P-2026-10-18-2320)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — ticket: the #lane= scroll runs once and may be undone by a later render` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): Tauri 2 menu bar shell, tray count and popover (P-2026-10-19-0000)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): notify when a lane starts waiting (P-2026-10-19-0033)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): jjodel-lanes:// links and the global shortcut (P-2026-10-19-0054)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): start at login and restart the board (P-2026-10-19-0129)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — ticket: the app reads a pre-S1 board as bad JSON, not «too old»` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-18 — docs(harness): health signals catalogue and retrospective backtest, Phase 1 (P-2026-10-18-2220)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — merge: health-disc into alfonso-frontend-jjtl (P-2026-10-19-0907)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — merge: menubar-disc into alfonso-frontend-jjtl (P-2026-10-19-0150)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — fix(lane-run): read the register in a child node with the flag (P-2026-10-19-1020)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — merge: lanerun-tests into alfonso-frontend-jjtl (P-2026-10-19-1045)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): rounded popover, settings view, light and dark theme (P-2026-10-19-1125)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-monitor-app): Quit in the popover, Cmd+Q, settings spacing and path line (P-2026-10-19-1148)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — merge: menubar-settings into alfonso-frontend-jjtl (P-2026-10-19-1213)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-board): sidebar shell and Lanes tab in the agreed design (P-2026-10-19-1130)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — ticket: laneTracking test red on the tack front's milestone` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(lane-board): Timeline, Insights, Requirements in the design (P-2026-10-19-1215)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — merge: board-restyle into alfonso-frontend-jjtl (P-2026-10-19-1331)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — chore(harness): S4d sweep, six stale prompts classified, one flipped (P-2026-10-19-1022)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — merge: s4d-sweep into alfonso-frontend-jjtl (P-2026-10-19-1716)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — fix(harness): lane-run start refuses a lane with no link to its chat, Tack Request URLs (P-2026-10-19-2105)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — ticket: the lane board reads Request: from the lane's input copy, never the prompt in the repo` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — merge: requrl into alfonso-frontend-jjtl (P-2026-10-19-2227)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — fix(harness): lane board takes the chat URL from the trunk prompt (P-2026-10-19-2229)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — merge: boardurl into alfonso-frontend-jjtl (P-2026-10-19-2300)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — feat(harness): merge prompts name the chat that launches them (P-2026-10-19-2315)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-19 — merge: mergeurl into alfonso-frontend-jjtl (P-2026-10-19-2331)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-20 — fix(harness): lane-run status reads the Outcome of the latest run only (P-2026-10-20-0030)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-20 — merge: lane-status-stale into alfonso-frontend-jjtl (P-2026-10-20-0102)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — ticket: traceMonitor test fails in merge gates while the dev server holds 3001` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — fix(lane-monitor-app): external links in the Lane board window open in the browser (P-2026-10-21-1000)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — merge: lanemon-links into alfonso-frontend-jjtl (P-2026-10-21-1008)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — feat(lane-monitor-app): the tray title shows waiting and running counts (P-2026-10-21-1020)` once (trunk).
   - `docs/log-inbox/harness.md`: the heading `## 2026-10-21 — ticket: Flaky vitest under load blocks direct merges (traceMonitor port-in-use and others)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — ticket: JjEL: 0xFF evaluates silently to 0 (lenient parse drops trailing tokens)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — ticket: codegen: a Run result holding a bit-vector breaks JSON.stringify in CodePanel and checkView` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — ticket: codegen: the example templates' inDomain has no word case` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-21 — ticket: Extend the codegen prelude parity test to the 4733-row oracle table` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-20 — docs: discovery, ontological instantiation in one model (P-2026-10-20-1835)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-20 — feat: S1 binding codec, reader and check (P-2026-10-20-2010)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-20 — chore: UML class and object fixture, run and commit (P-2026-10-20-2330)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-20 — ticket: IR cannot express four UML notations` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-10-20 — ticket: isKind on a one-step path to a contained value never matches` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — fix: code panel prints a bit-vector run result instead of throwing` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — fix: JjEL keyword as member name after `.` and `?.`` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-20 — feat: JjEL bit-vector values, discovery and slice S1` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: jjel-bitvector into alfonso-frontend-jjtl (P-2026-10-21-0002)` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: jjel-keyword-member into alfonso-frontend-jjtl (P-2026-10-21-0025)` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — feat: JjEL bit-vector slice S2, the simulator word domain` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: bv-sim into alfonso-frontend-jjtl (P-2026-10-21-0105)` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — test: JjEL bit-vector operators against a Verilator oracle` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: bv-oracle into alfonso-frontend-jjtl (P-2026-10-21-0659)` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — feat: JjEL bit-vector slice S3, code generation` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: bv-codegen into alfonso-frontend-jjtl (P-2026-10-21-0845)` once (trunk).
   - `docs/log-inbox/jjel-bitvector.md`: the heading `## 2026-10-21 — merge: bv-codepanel into alfonso-frontend-jjtl (P-2026-10-21-0855)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-18 — feat(auth): compact register view, legal links, no newsletter opt-in (P-2026-10-18-1720)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-19 — fix(menu): debug and empty Tools entries out, small-metamodel guard on Polymetric View, Help 404 out (P-2026-10-19-1745)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-19 — merge: menu-cleanup into alfonso-frontend-jjtl (P-2026-10-19-1806)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-20 — chore(jjscript): remove TEMP-DISCOVERY timing logs (P-2026-10-20-0032)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-20 — merge: jjscript-timing-logs into alfonso-frontend-jjtl (P-2026-10-20-0046)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-20 — fix(editor): build References target lists only when the section is open (P-2026-10-20-1955)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-20 — merge: perf-click-profile into alfonso-frontend-jjtl (P-2026-10-20-2020)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — merge: perf-slow-round2 into alfonso-frontend-jjtl (P-2026-10-21-0013)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — fix(model): LModel.name without the $name scan, duplicate names in O(n) (P-2026-10-21-0030)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — merge: core-name-scans into alfonso-frontend-jjtl (P-2026-10-21-0149)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — fix(editor-v2): useJjomSync re-transforms only changed vertices (P-2026-10-21-0335)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — ticket: M2 attribute rename leaves M1 nodes stale under a viewpoint` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — merge: jjomsync-incremental into alfonso-frontend-jjtl (P-2026-10-21-0416)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — ticket: Layout autosave flush on pagehide cannot finish on large projects` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — fix(editor-v2): fitViewOptions without a body style read per render (P-2026-10-21-1115)` once (trunk).
   - `docs/log-inbox/maintenance.md`: the heading `## 2026-10-21 — merge: perf-round3 into alfonso-frontend-jjtl (P-2026-10-21-1232)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — discovery: shell visual consolidation, Phase 1` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — feat: shell token layer and html data-mode (S1)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — feat: status bar on shell tokens, Inter, 24px targets (S3)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — feat: editor toolbar and left palette on shell tokens (S4)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — feat: shell rail surfaces (S6)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — feat: rail section titles in sentence case (S7)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — merge: shell-ui-s7 into alfonso-frontend-jjtl (P-2026-10-19-1926)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — feat: rail density, 24px targets, muted icons, outer borders (S8)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — merge: shell-ui-s8 into alfonso-frontend-jjtl (P-2026-10-19-2019)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — merge: shell-ui-s3 into alfonso-frontend-jjtl (P-2026-10-19-1816)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — fix: rail select input, 11px anchor labels, row-height headers (S9)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — merge: shell-ui-s9 into alfonso-frontend-jjtl (P-2026-10-19-2128)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — feat: topbar on shell tokens, 24px targets, muted icon (S2)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-19 — merge: shell-ui-s2 into alfonso-frontend-jjtl (P-2026-10-19-2345)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-20 — feat: menus on shell tokens, 8px panels, 36/28px items (S5)` once (trunk).
   - `docs/log-inbox/shell-ui.md`: the heading `## 2026-10-20 — merge: shell-ui-s5 into alfonso-frontend-jjtl (P-2026-10-20-0039)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-20 — feat(sim): compile defect trigger-position for triggers dropped by fork or join fusion (P-2026-10-20-0031)` once (trunk).
   - `docs/log-inbox/simulation.md`: the heading `## 2026-10-20 — merge: sim-trigger-position into alfonso-frontend-jjtl (P-2026-10-20-0026)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 5b, Timeline and Insights views, Sessions fixes` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 4, layer-1 metrics, deleted-worktree links, rename fix` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 3, git collector and repository identity` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 2, event store and Claude Code collector` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 1, skeleton, contract v1 and tack check` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — discovery: Tack v0 extraction inventory (Phase 1)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 5a, board server, page shell and Sessions view` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 6, layers 2 and 3, Jjodel log importer, lane-run adapter, parity` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 7, settings, notifications and host load strip (closure)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — merge: tack-s7 into alfonso-frontend-jjtl (P-2026-10-19-2248)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-19 — feat: Tack slice 8, the Lanes page (Phase 2)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-20 — fix: Tack slice 8, the Lanes view registers and polls in a browser` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-20 — fix: Tack slice 8, lane closure by any commit mention and prompt Status, whole ids in the table` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-20 — merge: tack-s8 into alfonso-frontend-jjtl (P-2026-10-20-0052)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — merge: tack-spec into alfonso-frontend-jjtl (P-2026-10-21-1023)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — feat: Tack stops, breakpoint, ceiling and hard-stop classes, auto pill` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — feat: Tack slice 9, waiting cards, /api/attention, distinct stop events` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — merge: tack-s9 into alfonso-frontend-jjtl (P-2026-10-21-1141)` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — feat: Tack S1, trace-source boundary around lane-run` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — merge: tack-s1a into alfonso-frontend-jjtl (P-2026-10-21-1246)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`docs/design/claude_2026-10-19_design_handoff_templates_notations_file_new.md`, `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md`, `docs/log-inbox/templates-ui.md`, `docs/prompts/claude_2026-10-18_2150_prompt_library_gallery_viewpoints.md`, `docs/prompts/claude_2026-10-18_2300_prompt_library_gallery_templates_examples.md`, `docs/prompts/claude_2026-10-19_0300_prompt_library_example_viewpoints.md`, `docs/prompts/claude_2026-10-19_0930_prompt_ir_sim_active_predicate.md`, `docs/prompts/claude_2026-10-19_1510_prompt_templates_notations_discovery.md`, `docs/prompts/claude_2026-10-19_1615_prompt_templates_page.md`, `docs/prompts/claude_2026-10-19_1616_prompt_templates_sidebar.md`, `docs/prompts/claude_2026-10-19_1617_prompt_gallery_snapshots.md`, `docs/prompts/claude_2026-10-19_1618_prompt_new_model_dialog.md`, `docs/prompts/claude_2026-10-19_1650_prompt_file_new_menu.md`, `docs/prompts/claude_2026-10-19_1651_prompt_gallery_snapshots_crop.md`, `frontend/package.json`, `frontend/src/pages/components/Navbar.tsx`, `frontend/src/pages/components/navbar.scss`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: library-gallery takes alfonso-frontend-jjtl (P-2026-10-21-1415)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-gallery/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 6355b1672` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane library-gallery · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of the `docs/log-inbox/` file of this branch's front (the branch adds headings to `docs/log-inbox/notation-library.md`, `docs/log-inbox/templates-ui.md`), both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, library-gallery took the trunk (P-2026-10-21-1415)` (P16, RC-17). `Outcome: done`. The merge of `library-gallery` into the trunk gets its own prompt (`lane-run merge library-gallery --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
