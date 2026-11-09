# Session 2026-11-07: textual syntax steps D, E, F (chat C-2026-11-03-1037)

Written 2026-11-07 at about 19:20 (Rome) by the chat, from the state of the Mac. It replaces the checkpoint of the same name that the earlier chat produced only as an attachment and never saved. Trunk `alfonso-frontend-jjtl`; front `codegen`, textual part. Mode `/lane auto` from 15:17.

## State

- On the trunk and pushed: F1a (merge 212f038f1, hand closure d817420e8), F1b and F1c in one merge (e59d6025e, closure c0ee2cc00), F1d (merge 99657324e, closure 44ecca1f1), E2b (merge e1318161, closure c3d0663ed).
- On the trunk, not closed: F1e, merge adf6c9629 (P-2026-11-07-1834). The instance-of chat launched its merge of oi-s3b in the same minute and `lane-run` gave it the same Prompt-ID: its merge is e5add4d95, and the lane folder ~/.jjodel-lanes/P-2026-11-07-1834/ now holds the oi-s3b merge (outcome blocked). F1e's gates and closure were lost with it. F1e's code is in the trunk; its Status flip and log entry for the merge are missing.
- Ready, not merged: D3c on textual-d3c-rules (~/jjodel-w-textd3c, docs 8e5e473f0), crops checked by the chat.
- The trunk's check:docs is red since 02269f010 (multi-tab chat, release 3.1.2, P-2026-11-07-1536): its log entry in docs/log-inbox/multi-tab.md has a free-text Corregge and a Causa outside the taxonomy. Every direct merge blocks on it until that chat fixes its entry.
- tolerant.test.ts (a timing bound, 1484 ms against 1000) is red under load and was still red alone at load 41 to 68.
- No lane of this chat running.

## Lanes of this session

| Prompt | What | Outcome |
|---|---|---|
| P-2026-11-07-1444 | F1b JjEL highlighting inside the islands | done, merged |
| P-2026-11-07-1522 | F1c JjEL syntax check as warnings | done, merged |
| P-2026-11-07-1622 | F1d completion inside an island | done, merged |
| P-2026-11-07-1635 | E2b canvas selection highlighted in the Text tab | done, merged |
| P-2026-11-07-1736 | F1e self.<f> name check | done, merged (closure missing) |
| P-2026-11-07-1838 | D3c user validation-rule problems as markers | done, not merged |
| 1519, 1617, 1733, 1821, 1834 | direct merges | see State |

## Decided unattended

- Crops of F1b, F1c, F1d, E2b, F1e, D3c checked by the chat (RC-23).
- F1c, F1d, F1e branched from the previous F lane's tip instead of the trunk, to run while the merges waited.
- One merge for F1b and F1c (the F1c branch contains F1b).
- F1a merge: one red (elementWaiterScope.test.ts timing) rerun alone twice, resolved.

## Candidate tickets

1. Any reprint of the Text tab (style switch included) calls setMarkers(null) and clears the JjEL warnings until the next edit (found by F1e).
2. A Text tab opened while canvas nodes are already selected shows no highlight until the selection changes (E2b).
3. D3c: rule markers disappear when a model change makes the last validation run out of date, until the next Validate (by design; worth a note).
4. lane-run merge gave the same Prompt-ID to two chats in the same minute (F1e and oi-s3b, P-2026-11-07-1834).

## Next

1. The multi-tab chat fixes its 3.1.2 log entry, so check:docs is green again.
2. Close the F1e merge by hand under a fresh note (its Prompt-ID folder belongs to the oi-s3b merge now), or leave it as is: Alfonso's call.
3. Merge D3c when check:docs is green and tolerant.test.ts passes alone at low load.
4. Then F2 (tracing, TEXTUAL_REVEAL), T8b after checking T8a, tickets D2d, C2f, #682, E3 low.

## Lessons for the harness

- Commit the prompt file before lane-run start; never leave ~/jjodel-release dirty; never sed docs/log-inbox/codegen.md file-wide.
- Never launch a merge before the source lane's exit.txt; one lane-run command per minute; at most two lanes of this chat; 5-min load below 40.
- A merge lane's Prompt-ID is the current minute: two chats merging in the same minute collide. Read the merge commit's subject, not only the lane folder, before acting on a merge result.
- Timing tests (elementWaiterScope, tolerant, traceMonitor, Chromium hooks) go red under load: rerun them alone before closing a merge by hand.
- Write prompts straight into an AppleScript string (no double quotes or backslashes) rather than base64: half the tokens.
- Crops: copy to a /tmp dir with an index.html, sips -Z 700, python3 http.server on 127.0.0.1:3199, built-in browser, one screenshot; crop full-page shots with sips -c before looking.
- A checkpoint lives in the repo, never only as a chat attachment.

## Update 2026-11-08 (00:20)

On Alfonso's «decidi tu» (2026-11-08 00:02) the chat closed the three open points and merged D3c. All pushed.

- check:docs green again: the multi-tab chat's 3.1.2 log entry had a free-text Corregge and a Causa outside the taxonomy; both set to the sentinel, the cause stays in the LIR the entry cites (d9187549d).
- F1e merge closed by hand (e91177c3b): outcome partial, Regressions unknown, Causa (g), because its gate summary was lost to the Prompt-ID collision.
- Ticket #720 on the harness front: lane-run merge gives the same Prompt-ID to two chats in the same minute (efd40eb55).
- D3c merged (cae331a7c, closure 8e57a1aef, card #718 closed).

Every lane of this round is now on the trunk: F1a, F1b, F1c, F1d, F1e, E2b, D3c. No lane running, no scheduled check left.

Next, on Alfonso's go: F2 (tracing, TEXTUAL_REVEAL), T8b after checking T8a, the tickets D2d, C2f, #682, E3 low, and the three candidate tickets above.

## Update 2026-11-08 (night)

On Alfonso's «decidi tu» (00:24) the chat continued with F2 and T8. All on the trunk and pushed.

- F2, generated line to model line (P-2026-11-08-0027): new event TEXTUAL_REVEAL; a click on a generated span reveals and highlights the object or feature line in the Text tab without moving the caret; with the canvas echoing the same element the feature line wins (dedup by id). Merge 3da1b61e7, closure 90cd28003.
- T8a, ids in the text (P-2026-11-08-0121): a style option prints `@id` comments on object head lines, off by default; the id is evidence 0 of the match, a repeated id pairs neither object and warns. printIds is not saved in the syntax record. Merge 94a55a92d, closure c8153d84a.
- T8b, Export and Import (P-2026-11-08-0206): two toolbar actions in the Text tab; the export carries one `@id` per object; an import goes through the confirm panel and applies in one undo step. Merge 0322b765f, closure 3146847ed.
- Two more Prompt-ID collisions, both refused by lane-run this time: 0057 with the dcn chat at start (T8a renumbered to 0121), 0151 with the instance-of chat at merge (retried at 0152). Evidence for ticket #720.

New candidate ticket: the import confirm panel has no Cancel button (it closes on typing, a model change or a new Import).

No lane running, no scheduled check left. Next on Alfonso's go: T8c (re-import dialog), T8d (calibration), tickets D2d, C2f, #682, E3 low, and the candidate tickets above.

## Update 2026-11-08 (morning)

On Alfonso's «Procedi con tutto in lane auto» (07:36) the chat ran the remaining queue. Trunk closures pushed: D2d f4dc218c3, T8c d1daf6d2f, T8d e1f06117c, Text tab fixes 813c8a206.

- T8c, re-import dialog with counts and uncertain rows (P-2026-11-08-0739 and 0802): merged.
- T8d, calibration bench of the match cascade (P-2026-11-08-0831): tests only. Recommended and taken: keep RENAME_THRESHOLD 0.6 and RENAME_MARGIN 0.2; the wrong pairings come from homonym order, not from the thresholds. Table in ~/.jjodel-lanes/P-2026-11-08-0831/calibration-table.md.
- Text tab fixes (P-2026-11-08-0859, card #751): JjEL warnings survive a reprint and a style switch; a tab opened with canvas nodes selected highlights them at once; unnamed homonyms in the confirm panel read «Transition (unnamed) 1», «2». Probe 19/19. Known limit: the on-open read uses .react-flow__node.selected, so a selected node scrolled out of view is not highlighted on open.
- E3 low ticket: dropped (Alfonso 07:42, «Non ricordo»).
- Prompt-ID collision once more (0737 with the multi-tab merge, T8c renumbered to 0739). Evidence for #720.

### Parked for Alfonso

- C2f, critical zone (P-2026-11-08-0843, branch textual-c2f-labels, code 78a5bc7e6..9c44d338a with the LIR): hard stop at the context ceiling with items 1 to 4 done. Field reads Port (unnamed), list rows indexed, picker no longer shows raw ids; smoke green, vitest green but the 3 import reds. Missing: the log entry; the Status flips are uncommitted in the worktree. Needs Alfonso's visual GO on the crops in ~/.jjodel-lanes/P-2026-11-08-0843/ and a decision: IR chips still read : Port (namelessTargetLabel, R-TXT-47 D5/D6) while the widgets read Port (unnamed). Chat recommendation: align both on Port (unnamed) in a separate lane with a new decision row.
- #682, canvas create without its own undo step (P-2026-11-08-0916, report docs/discovery/discovery_2026-11-08_canvas_create_undo_682.md on branch disc-682-canvas-undo, 2eb74325d). The rule sits in frontend/src/redux/reducer/reducer.ts:1290. Recommended: option 1 with the compose branch, about 6 lines; a delta touching root objects is no longer forced into a merge, graph-only merges use composeUndoDeltas. Open questions in §10 of the report: adopt as core change with its Phase 2, extend to M2, container create as one step, creates inside the 450 ms window, separate ticket for the index oddity at :1284.

### Candidate tickets added

- T8d: a threshold parameter in MatchInput, to measure other values; content-aware pairing of homonyms.
- Text tab: highlight on open for selected nodes outside the viewport (needs a selection query, not the DOM).

No lane of this chat running, no scheduled check left. Next on Alfonso's go: C2f GO and label decision, #682 option choice, the candidate tickets.

## Update 2026-11-08 (midday)

Alfonso 11:59: «GO» on C2f; on #682 a container create is one Undo step, «decidi tu» on the rest; 12:26 «allinea tutto su `Port (unnamed)` con una lane separata». All merged and pushed.

- C2f, critical zone (P-2026-11-08-0843): merged 29fcd307f with Alfonso's visual GO. The log entry was written by the chat (the session stopped at the context ceiling). Card #746 of the superseded P-2026-11-08-0818 stays open: lane-run resolve accepts only blocked lanes.
- C2g, one unnamed label (P-2026-11-08-1239, merge ae7a149aa): R-TXT-59 amends R-TXT-47 D5 and D6, `<Class> (unnamed)` everywhere; unnamedTargetLabels now reuses namelessTargetLabel. Known: chips and default view carry no index (two unnamed Ports both read Port (unnamed) there); stale comments at jjomTransformers.ts:369 and IRFormField.tsx:153-154 still say `: <Class>`. The first row header did not parse (decisionsQuery, docsDigest red between two lane commits, Regressions: yes).
- #682 Phase 2 (P-2026-11-08-1202 and 1313, merge d79d51f90): a create opens its own undo entry, also inside the 450 ms window; graph-only deltas compose only into a create's entry (narrower than §7: the wider shape deleted a tab's graph on undo); classs, enumerators and packages included; container create one step. Tests 40, mutation 12/12, probe A to J. Smoke: control green, HEAD red once on a cold page.goto timeout, then green twice; merged by the chat on that evidence. Ticket #764 (sender stack index, reducer.ts:1292). Limit: undo below a tab open still leaves duplicate graphs (old merge path, not measured before the fix).
- Multi-tab L6 is on the trunk (bc4b137cd), merged by the multi-tab chat.

### Candidate tickets added

- C2g: index on IR chips and default-view labels when two unnamed targets of one class read the same; stale `: <Class>` comments.
- #682: duplicate graphs after undo below a tab open.

No lane of this chat running, no scheduled check left.

## Update 2026-11-08 (afternoon)

Alfonso 16:23: «procedi in lane auto» on the candidate tickets.

- C2h (P-2026-11-08-1626, branch textual-c2h-index, docs 21c46e67a): unnamed homonyms numbered on IR chips and on the default view (one list is one reference slot of one object); stale comments fixed. Crops 1-chips (viewed) and 2-default-view, app check 29/29, smoke green. Chat widened the scope to IRFormField.tsx :84 and :277-298 for the chips. NOT merged yet: ~/jjodel-release carries another chat's uncommitted ticket blocks in docs/log-inbox/harness.md and jjodie-ui.md since 16:09, so lane-run merge --direct refuses. Left: read-only rows IRFormField.tsx:217 and :360 still label one target at a time.
- T8e (P-2026-11-08-1625 and 1705, branch textual-t8e-match, 723eb1233, ad25337a7, 52c8422ea): thresholds as a MatchInput parameter (defaults 0.6 and 0.2 unchanged, Recommended keep); homonyms paired by content (wrong uncertain 5564 to 213 over 30225 objects, no row worse); off-screen highlight on open from _lastSelected.node. App check found an intermittent null hole after a reorder apply. NOT merged, no log entry yet.
- T8f (P-2026-11-08-1718, report 000a8f1f4 docs/discovery/discovery_2026-11-08_t8f_reorder_hole.md): the hole is a race in the JjScript executor: settlePendingWrites (jjscript/executor/commands/instance.ts:411-413) waits only for its own dispatch, a write flushed by the 300 ms interval (reducer.ts:1549) is in flight, the next += reads the stale list and writes past the end (reducer.ts:285-289). Predates T8e: any reorder since T7 can hit it (15 holes in 160 reorders). Candidate: settle also waits for in-flight dispatches, 0 holes in 80 runs, served to the probe only. Parked for Alfonso (outside codegen/textual).
- #682 residue (P-2026-11-08-1719, report b41af1105 docs/discovery/discovery_2026-11-08_undo_tab_open_graphs.md): predates #682. Graph creation on tab open is an ordinary write forced into a merge (reducer.ts:1300-1301, first-wins :1354); Undo below it orphans 2 graphs per descent, the tab rebuilds under a new id; the ModelTab.tsx:33-34 guard is dead. Recommended option B: a delta that only lengthens root graphs writes no entry; held 4, 0 in a served-reducer trial. Parked for Alfonso, four open questions in the report.

### Awaiting Alfonso

C2h merge as soon as the trunk is clean (the multi-tab chat must commit its two ticket blocks). T8f: fix the executor race (core, jjscript), then merge T8e; or merge T8e first. #682 residue: option B and the open questions.

## Update 2026-11-08 (evening)

Alfonso 16:23 «procedi in lane auto» on the candidate tickets, 17:58 «si a tutto» on the core fixes. All merged and pushed.

- C2h (P-2026-11-08-1626, merge 936f8ac85): unnamed homonyms numbered on IR chips and the default view (one list is one reference slot of one object); stale comments fixed. Left: read-only rows IRFormField.tsx:217 and :360.
- JjScript settle fix (P-2026-11-08-1759, core action.ts and instance.ts): settlePendingWrites also waits for dispatches in flight, bound 1000 ms (worst measured gap 225 ms). Reorder holes 7/80 to 0/80 natural, 19/20 to 0/20 forced; run time unchanged. Root cause found by T8f (P-2026-11-08-1718, report 000a8f1f4): the race predates T8e and hit any reorder since T7.
- T8e (P-2026-11-08-1625, 1705, 1718, 1927, merge 3589668e7): thresholds as a MatchInput parameter, defaults 0.6 and 0.2 kept; homonyms paired by content (wrong uncertain 5564 to 213 over 30225 objects, no row worse); highlight on open for off-screen nodes via _lastSelected.node. Acceptance after the settle fix: 20 swaps, 0 holes, pairing 100%.
- Option B (P-2026-11-08-1800, merge 93f7485a8, core reducer): a graph-only delta writes no undo entry; DGraph 4,0 in every measured case (was up to 7,2). Tickets #789 (M2 layout entry), #790 (vertex-only populate, R1), #791 (dead guard ModelTab.tsx:33-34), #792 (v2-flow id written twice). Discovery P-2026-11-08-1719 (report b41af1105); its card #780 still reads waiting:phase-2 though 1800 did phase 2.
- Harness ticket #799: the first smoke after a cold Vite start times out on page.goto (seen in 1313, 1800, 1759).

### Candidate tickets added

- T8e: the confirm panel still says same name, paired by order for homonyms now paired by content.
- C2h: index on the read-only rows of a frozen reference field.

No lane of this chat running, no scheduled check left.

## Update 2026-11-09 (chat C-2026-11-08-1908)

The chat took over the textual part of the codegen front on 2026-11-08 at 22:25 (Alfonso: «procedi con lane auto»), after finding that R-TXT-42 said «implemented in step D» while the step D report never planned the pinned hover card.

- D6, the pinned hover card of R-TXT-42 (P-2026-11-08-2330, P-2026-11-09-0020; discovery 53680294f; code e536fc071, 0d9fd1fa9, 34a586c28): opened by a Pin link in the hover or at the caret by a shortcut, rendered with react-markdown in a Monaco content widget, command links kept clickable, closed by the five rules of R-TXT-42. Monaco's hover covered the card after Pin: cleared with the public options hover.enabled and hover.sticky off from the Pin link, restored on close, unmount or a pointer move over 400 px. The first «card left of the editor» was a probe artefact (scrollLeft 335 left by a Playwright retry), not a product defect.
- D6b (P-2026-11-09-0950, 5221842dd): Option+H typed «∆» on Alfonso's Italian layout; the shortcut is now the chord Cmd+K Cmd+P (Ctrl+K Ctrl+P off the Mac). Option plus a letter is not safe in a text editor on macOS.
- Merged 7255e5c36 (P-2026-11-09-1001, gates green, vitest 15865 with the 3 known import reds), closure a8c327925. Visual GO by Alfonso on the D6 crops (09:45); D6b accepted by the chat on DOM checks 12/12.
- Open: with no pointer movement after Pin the hover stays until the first pixel of movement; the restore on unmount is not measured; one surviving mutant (referencesAt mock ignores its argument), low ticket; discovery section 5.2 was wrong about React 18 portal listeners (the native listeners stay); a Cmd+K listener at Catalog.tsx:190 exists on dashboard pages only.
- Prompt-ID collision: P-2026-11-08-2230 was taken by another chat in the same minute; D6 was renumbered P-2026-11-08-2330 (evidence for #720).
- Worktree ~/jjodel-w-textd6 and branch textual-d6-pinned-hover to retire on Alfonso's yes.
