# Discovery 2026-10-11: tickets become Backlog cards (`lane-run ticket`, backfill, hard-stop rule)

- Prompt-ID: P-2026-10-11-1017, prompt file `docs/prompts/claude_2026-10-11_1017_prompt_ticket_cards.md`.
- Chat: C-2026-10-10-0057. Session: `3c55c4e0-902c-49f7-b2d4-0b7c3557d25e`.
- Tree: `~/jjodel-w-ticketcards`, branch `ticket-cards`, HEAD `96d38b2bf`, equal to the tip of `alfonso-frontend-jjtl` (checked: `git log HEAD..alfonso-frontend-jjtl` and `alfonso-frontend-jjtl..HEAD` both empty). `git status` clean at start.
- Executor: Anthropic Claude Opus 5.5 (session banner).
- Phase 1, read-only. Tags: **[M]** measured in this phase (a command run on `96d38b2bf`, or a read-only `gh` call on 2026-10-11); **[R]** read in a file at `96d38b2bf`.
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files.

## 0. Answer in brief

1. [M] The parser rule is the one `check:docs` already applies: `splitLog` cuts at every `## YYYY-MM-DD — ` heading, and a block is a ticket when its heading matches `TICKET_HEADING` (`## <date> — ticket: `). Run over the 28 files of `docs/log-inbox/` at `96d38b2bf` it finds **42 ticket blocks in 11 files**, all in the colon form, all with `**Ticket**`, `**Priority**` and `**Found in**`, none without a priority. No block is odd enough to need a special case; two details matter (§2.3).
2. [M] The rule misses, by design, **25 `**Ticket** (` paragraphs** after task entries in 11 inbox files (3 of them not in the 11 above), and the 10 ticket headings already folded into `docs/claude-code-log.md` (45 more in the archive). §2.4 lists the paragraphs; none goes on the board unless the GO says so.
3. [M] Front mapping: 5 blocks take the front from their prompt's `Front:` line (3 harness, 2 graphvertex); the other 37 fall back on the inbox name. Result: maintenance 25, harness 9, graphvertex 6, simulator 4, codegen-pilot 1 (§3). The prompt's "thirteen files" matches no state I measured: 14 files carry any ticket text at HEAD, 11 carry heading blocks.
4. Already fixed on the trunk, with evidence (§4.1): **12 fixed** (harness:244, :249, :269; ir-graphvertex:63, the useJjomSync stale edge, by F1 `ad08a8519`; merge-gate:7; symbol-editor:35, :41, :46, :91; simulation:261; views:198, :256), **1 measured clear** without a closing entry (views:275), **1 unknown** (jjscript:88), **28 open**, `harness:660` among them (this lane's item 3).
5. [M] Two gaps for Phase 2 that the prompt does not name: the board repo has **no `ticket` and no `priority:*` label** (`gh label list`), and `gh issue create --label` refuses a label that does not exist; and `syncCard` cannot be reused as is for a ticket (it keys the lock, the record and the heal on a Prompt-ID, and owns only `TRACK_LABELS`). §5 gives the shape.
6. [R] The hard-stop rule (item 3) is a one-line change at `lane-tracking.mjs:192`; no existing test pins the old behaviour for a flipped Status (§6).

## 1. Hypotheses under test and verdicts

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | "About forty ticket blocks in thirteen inbox files" (the prompt's Why). | **Partly.** 42 heading blocks in 11 files [M]; 14 files carry ticket text if the `**Ticket** (` paragraphs count; 12 at `1ceda9802^`, before `gv-right-margin.md` landed (39 blocks then); intermediate states not measured. |
| H2 | A ticket block can be recognised by its heading alone, as `## ... — ticket: ...`. | **Holds.** Every `## ` line containing `ticket` in the inboxes is in the colon form (42 of 42, control below); the field set follows. |
| H3 | Every block has `**Priority**`; "a block without Priority gets `priority:unset`" is a guard, not a case. | **Holds** at `96d38b2bf`: 23 medium, 2 high, 17 low, 0 absent. |
| H4 | The prompt named in `**Found in**` resolves to a file in `docs/prompts/`. | **Holds** for 42 of 42 (one annotated: `P-2026-10-02-2315 (chat C-2026-10-01-2220)`). |
| H5 | The `Front:` of the Found-in prompt decides most fronts. | **Falsified.** 5 of 42: Found-in prompts are dated before `FRONT_FROM` and carry no `Front:`, except P-2026-10-10-1532, -1612 (harness) and P-2026-10-11-0040 (graphvertex). The merge prompt P-2026-10-11-0957 has none (merge prompts are exempt). |
| H6 | `trackCard`, `boardIds`, the `gh` wrapper and the label handling can be reused for a ticket card. | **Partly.** `trackCard` is lane-run's wrapper around `trackLane`; the reusable pieces (`ghRunner`, `ghBinary`, `boardIds`, `withLock`, `readJson`/`writeJson`, `cardLine`) are module-private in `lane-tracking.mjs`; `syncCard` itself is Prompt-ID-keyed (§5). No label is ever created by code. |
| H7 | The hard-stop rule changes no existing test. | **Holds** [R]: every `hard-stop` test runs with `headerStatus: 'da eseguire'`. |

## 2. The parser rule, measured

### 2.1 The rule

Read [R] from `frontend/scripts/gates/log-tools.ts`:

- `:6` `export const ENTRY_HEADING = /^## (\d{4}-\d{2}-\d{2})(?: \d{2}:\d{2})? — /;` — a block runs from its heading to the next heading of this form, or to the end of the file (`splitLog`, `:66-91`).
- `:50` `export const TICKET_HEADING = /^## \d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})? — ticket: /;` — "The colon form only: the legacy heading `ticket extension:` stays a task entry."
- `:47` `export const FIELD_LINE = /^\*\*([^*]+)\*\*:\s?(.*)$/;` — "`**Ticket** (` (no colon) is prose, not a field."
- `parseFields` (`:218-225`): "First occurrence wins".

Proposed rule for the backfill, the same: split with `ENTRY_HEADING`, keep the blocks whose heading matches `TICKET_HEADING`, read the fields with `FIELD_LINE`, first occurrence wins. Title = the heading after `ticket: `. `lane-run` is plain `.mjs` with nothing outside `node:*` (`lane-tracking.mjs:21`), and `log-tools.ts` is TypeScript, so the `.mjs` side needs its own copy of the three regexes; a test can pin that the copy and `log-tools.ts` agree on the real inboxes (both read 42).

### 2.2 Count per file [M]

Measured by `/tmp/p1017/parse.ts` (outside the repo, `node --experimental-strip-types`), which imports `splitLog`, `parseFields`, `TICKET_HEADING` and `entryType` from `log-tools.ts` and walks `docs/log-inbox/*.md` at `96d38b2bf`; exit 0.

| Inbox | Ticket blocks |
|---|---|
| views | 11 |
| harness | 7 |
| jjscript | 6 |
| ir-graphvertex | 4 |
| simulation | 4 |
| symbol-editor | 4 |
| gv-right-margin | 2 |
| codegen-panel | 1 |
| jjel-lexer-own-keys | 1 |
| merge-gate | 1 |
| stale-m1-edge | 1 |
| **total** | **42** |

The other 17 inbox files have none. `entryType` reads all 42 as `ticket` (all dated on or after `TICKET_LINT_FROM_DATE` 2026-09-24). Positive control on the same tool: `command grep -h -E '^## .*ticket' docs/log-inbox/*.md | wc -l` → 42; the same piped through `command grep -c -v ' — ticket: '` → 0. So no heading in another form (`ticket —`, `ticket extension:`) exists to be missed.

### 2.3 Odd fields [M]

- No block carries a field outside `Ticket`, `Priority`, `Found in`, `Detail`; every non-empty line after the heading is a field line (a count of non-field lines per block: 0 in all 42). Every `**Ticket**` is one line.
- `Detail` is present in 27 blocks, in three spellings: a bare path (`docs/discovery/...md`), a backticked path with a section (`` `docs/discovery/discovery_2026-10-01_label_editable_toggle.md` §9 ``), and a path outside the repo (`` `~/.jjodel-lanes/P-2026-10-10-1600/log.jsonl` (the resume at 17:40) ``, harness:364; `~/.jjodel-lanes/P-2026-10-03-1630/probe-_tmp_simpolish_probe.head.log`, simulation:261). The card body should carry `Detail` verbatim, not try to link it.
- `merge-gate.md:7` has a blank line between the heading and `**Ticket**` (`merge-gate.md:8`). `splitLog` does not care; a parser that expects the field on the next line would.
- `merge-gate.md:12` `**Found in**: P-2026-10-02-2315 (chat C-2026-10-01-2220)`: an annotated value, legal for `TICKET_FOUND_IN` (`log-tools.ts:53`, `(\s|$)` after the id). The front lookup must take the leading id only.
- 42 titles, 42 distinct; the longest is 95 characters. With the `ticket: ` prefix every issue title stays under GitHub's 256.
- One defect is filed twice: `views.md:74` (P-2026-10-02-1506) and `views.md:119` (P-2026-10-02-1505), both "check:addonly refuses a fold and a rotation in one commit". A third copy of `views.md:56` (criticalZone.test.ts) sits in the active log (`docs/claude-code-log.md:69`) and as a paragraph at `symbol-editor.md:138`.

### 2.4 What the rule misses [M]

**(a) `**Ticket** (` paragraphs after a task entry**, 25 lines in 11 files (`command grep -n -E '^\*\*Ticket\*\* \(' docs/log-inbox/*.md`). P9 calls them legal and not linted. Three files carry only these and no block: `codegen-engine`, `codegen-runner`, `jjodie-reserved`. Their own wording sorts them:

| Where | Self-declared | Note |
|---|---|---|
| `codegen-engine.md:22` | (S5, owed) | `generate` wiring untested |
| `codegen-panel.md:22`, `codegen-runner.md:22` | (S4's, still open) / (for S5) | load time counts against `timeoutMs`, one finding twice |
| `harness.md:267` | (closed here) | closes `harness.md:244` and `:249`, see §4 |
| `harness.md:292` | (report correction) | a report addendum owed |
| `harness.md:513` | (RC-45 vs check:docs) | `Corregge: none` refused by Check B |
| `harness.md:593` | (low, found here) | `resolved.txt` survives a `resume` |
| `ir-graphvertex.md:61`, `:94`, `:115` | (lane …) | three in-lane findings, one "decision owed" |
| `jjodie-reserved.md:32` | (high, freeze) | fixed on the trunk by `e5c8fa126` "fix(jjscript): a block body that is not a command stops (P-2026-10-10-0810)", body: "parseBlockBody looped forever … The loop now records the position before parseCommand and, if it has not advanced, throws" |
| `jjscript.md:22` | (T9, high) | the hidden-editor loop that T9 fixed (`c7380822c`); `jjscript.md:50` is its remainder |
| `jjscript.md:164` | (low, observed, not changed) | `do eval x.name end`; `e5c8fa126`'s body: "\"do x.name end\" becomes a parse error like the rest" |
| `simulation.md:76`, `:129`, `:479` | (P-…), (low, found in …) | probe-kit and status-line findings |
| `simulation.md:722`, `:804` | (low), (low, R-SIM-144 settled it as a ticket) | one finding twice |
| `stale-m1-edge.md:41` | (lane, low) | side of a re-created M1 edge |
| `symbol-editor.md:110` | (low, lane-run template) | `trunk-into-branch.md` step 7 |
| `symbol-editor.md:138` | (low, harness) | same as `views.md:56` |
| `views.md:22`, `:164`, `:341` | (observation, low, not a ticket of its own) | declared not tickets |
| `views.md:307` | (item 5, found while measuring) | same family as `views.md:275` |

**(b) Ticket headings already folded out of the inboxes**: `command grep -c -E '^## .* — ticket: '` → 10 in `docs/claude-code-log.md`, 45 in `docs/claude-code-log-archive.md`. The prompt scopes the backfill to `docs/log-inbox/*.md`, so they stay off; the next fold moves inbox tickets into the log, after which a re-run of `--backfill` would not see them either. The idempotency record is what keeps their cards.

## 3. Front of each block

Rule of the prompt: the `Front:` of the Found-in prompt, else by inbox name (`ir-graphvertex*`, `gv-*` → graphvertex; `harness`, `merge-gate`, `smoke-baseurl` → harness; `codegen*` → codegen-pilot; `simulation` → simulator; `standalone-environment` → standalone-editor; else maintenance).

[M] The Found-in prompt was looked up as `docs/prompts/claude_<date>_<HHmm>_*.md` whose header `Prompt-ID:` equals the id; 42 of 42 found. `Front:` read from the header (lines before the first `## `), as `parseFrontLine` does (`lane-tracking.mjs:81-85`). Five carry one:

- `P-2026-10-10-1532` → `Front: harness` (harness:244, :249)
- `P-2026-10-10-1612` → `Front: harness` (harness:269, :274)
- `P-2026-10-11-0040` → `Front: graphvertex` (gv-right-margin:22, :28)

Totals: maintenance 25, harness 9, graphvertex 6, simulator 4, codegen-pilot 1. Where the file rule gives a front the finding does not belong to (the chat may remap in the GO):

- `codegen-panel:24` (EditorV2's Backspace in a TEXTAREA) → codegen-pilot by file; the defect is EditorV2's, maintenance by content.
- `views:56` (criticalZone.test.ts), `views:74`, `views:119` (check:addonly), `views:309` (build vs dev server) → maintenance by file; harness by content.

## 4. The backfill dry-run table

Key = the first 8 hex of `sha1(<inbox> + "\n" + <title>)`, the idempotency hash the prompt asks for (inbox name + title); the GO can name blocks by key, since line numbers move when an inbox grows. Front source: `Front:` = the Found-in prompt's line, `file` = the inbox name. Column "Trunk" = already fixed on the trunk (§4.1 gives the evidence).

| # | Key | Inbox:line | Title | Front | Priority | Found in | Trunk |
|---|---|---|---|---|---|---|---|
| 1 | 576ee13a | codegen-panel:24 | EditorV2's onKeyDown deletes the selection on Backspace typed in a TEXTAREA | codegen-pilot (file) | medium | P-2026-10-10-1825 | open |
| 2 | 8965a12c | gv-right-margin:22 | Auto layout writes a grown pool's size with its old position | graphvertex (Front:) | high | P-2026-10-11-0040 | open |
| 3 | 5d12c874 | gv-right-margin:28 | a stacked partition loses its bottom margin as it lost the right one | graphvertex (Front:) | medium | P-2026-10-11-0040 | open |
| 4 | 24e831fe | harness:244 | trunk prompts after FRONT_FROM lack Front:, Check E fails them at the merge | harness (Front:) | high | P-2026-10-10-1532 | fixed |
| 5 | 921b1aae | harness:249 | issue-discovery.md renders no Front:, start --auto will refuse auto-intake lanes | harness (Front:) | medium | P-2026-10-10-1532 | fixed |
| 6 | d8f3007c | harness:269 | the moved cut-off leaves this lane's GitHub card open, In progress | harness (Front:) | low | P-2026-10-10-1612 | fixed |
| 7 | d6b054f9 | harness:274 | issue-discovery.md renders no Depends: line (RC-42) | harness (Front:) | low | P-2026-10-10-1612 | open |
| 8 | d976fe82 | harness:346 | merge-into-trunk.md misreads a governance go-ahead and counts check:docs as 4/4 | harness (file) | low | P-2026-10-10-1648 | open |
| 9 | 737bfd5d | harness:364 | `lane-run resume` cannot carry the critical-zone go-ahead | harness (file) | medium | P-2026-10-10-1600 | open |
| 10 | 96fa82c4 | harness:660 | a hard-stop lane whose Status is flipped stays «In review» on its card | harness (file) | medium | P-2026-10-11-0957 | open (item 3 here) |
| 11 | 784904e2 | ir-graphvertex:63 | useJjomSync keeps the RF edge of a deleted M1 reference edge | graphvertex (file) | medium | P-2026-10-10-0105 | fixed |
| 12 | 8eb83e55 | ir-graphvertex:69 | a state updater replayed by React loops the canvas to the update depth limit | graphvertex (file) | medium | P-2026-10-10-0105 | open |
| 13 | 0e8e54b0 | ir-graphvertex:75 | under the pointer the target ghost handle covers the source ghost | graphvertex (file) | low | P-2026-10-10-0105 | open |
| 14 | 4483dad5 | ir-graphvertex:96 | an IR view cannot hide a reference edge, nor a predicate reach an object's owner | graphvertex (file) | low | P-2026-10-10-0105 | open |
| 15 | 94377a39 | jjel-lexer-own-keys:22 | JjScript looks up tables and variable maps keyed by source text on plain objects | maintenance (file) | low | P-2026-10-10-1756 | open |
| 16 | f5de8a8d | jjscript:50 | a selected edge keeps half of T9's loop running until a pane click | maintenance (file) | medium | P-2026-10-02-1450 | open |
| 17 | 7a929741 | jjscript:56 | adding then deleting a reference leaves a handle slot on its target class | maintenance (file) | low | P-2026-10-02-1450 | open |
| 18 | dd3603fb | jjscript:88 | the DemoFlowB metamodel loses its edge lanes after an M1 session | maintenance (file) | medium | P-2026-10-03-1002 | unknown |
| 19 | 6a100f81 | jjscript:120 | `set <parent>.<containment> += <child>` leaves an incoherent containment | maintenance (file) | medium | P-2026-10-04-0946 | open |
| 20 | c2c5b92c | jjscript:126 | two M1 links into one slot 20 ms apart keep only the second | maintenance (file) | medium | P-2026-10-04-0946 | open |
| 21 | 73f38848 | jjscript:132 | the Run summary miscounts and does not flag M1 instances by containment | maintenance (file) | medium | P-2026-10-04-0946 | open |
| 22 | 7640cb90 | merge-gate:7 | a lane removes the node_modules symlink the direct merge needs later | harness (file) | low | P-2026-10-02-2315 (chat C-2026-10-01-2220) | fixed |
| 23 | 80ea0bda | simulation:261 | two console errors on the demo scenes predate the simulation UI | simulator (file) | medium | P-2026-10-03-1630 | fixed |
| 24 | 51bffa5b | simulation:430 | a front panel press with an icon truncates its label in one cell | simulator (file) | low | P-2026-10-04-1131 | open |
| 25 | 0bcb62f6 | simulation:435 | a wide floating board can open under the canvas layer's Globals control | simulator (file) | low | P-2026-10-04-1131 | open |
| 26 | cef487df | simulation:546 | the M1 ecore JSON keeps one root object per class | simulator (file) | low | P-2026-10-05-1648 | open |
| 27 | bb4e0f28 | stale-m1-edge:22 | a bare DeleteElementAction leaves the edge id in its vertices' edgesOut and edgesIn | maintenance (file) | low | P-2026-10-10-1600 | open |
| 28 | 89297077 | symbol-editor:35 | IR name label stays stale after an inline rename when the class has no name attribute | maintenance (file) | medium | P-2026-10-01-2349 | fixed |
| 29 | 96459f70 | symbol-editor:41 | FieldSegmentEditor toggle has the same inverted default as the label one | maintenance (file) | low | P-2026-10-01-2349 | fixed |
| 30 | 88c0596b | symbol-editor:46 | a single-attribute path label cannot be edited on the canvas | maintenance (file) | low | P-2026-10-01-2349 | fixed |
| 31 | aa2f9e6b | symbol-editor:91 | one undo does not restore a slot value written by syncUpdateFeatureValue | maintenance (file) | medium | P-2026-10-02-1647 | fixed |
| 32 | 3e73fadc | views:50 | colour the edges of a coloured viewpoint by source or target | maintenance (file) | low | P-2026-09-30-2022 | open |
| 33 | 470fcb30 | views:56 | criticalZone.test.ts goes red inside a go-ahead lane | maintenance (file) | medium | P-2026-09-30-2022 | open |
| 34 | e61f96da | views:74 | check:addonly reads a fold-and-rotate as a rewrite through a trunk-into-branch merge | maintenance (file) | medium | P-2026-10-02-1506 | open |
| 35 | c3080b9b | views:119 | check:addonly refuses a fold and a rotation in one commit, and every trunk merge across it | maintenance (file) | medium | P-2026-10-02-1505 | open |
| 36 | 65212c0b | views:166 | IR edge labels and the form-hook comment after a rename | maintenance (file) | medium | P-2026-10-02-1645 | open |
| 37 | 63693ee8 | views:198 | name-ink marks outside a coloured node take its text colour | maintenance (file) | medium | P-2026-10-02-2045 | fixed |
| 38 | 14a9b3a0 | views:256 | hidden object-as-edge vertices reach ELK as 180x120 boxes | maintenance (file) | medium | P-2026-10-01-2215 | fixed |
| 39 | dff559c0 | views:275 | Petri net (classic) transition names are crossed by their outgoing arc after the toolbar layout | maintenance (file) | medium | P-2026-10-01-2215 | measured clear |
| 40 | d3f5ccf4 | views:309 | npm run build leaves the dev server of the same tree stale | maintenance (file) | low | P-2026-10-03-1300 | open |
| 41 | ce6ea190 | views:473 | «Reset routing» of a persisted object-as-edge route comes back at reload | maintenance (file) | low | P-2026-10-04-0130 | open |
| 42 | 55a95052 | views:479 | an object node delete leaves its vertex and link edges as ghosts under an IR viewpoint | maintenance (file) | medium | P-2026-10-04-0130 | open |

### 4.1 Evidence for the blocks marked fixed or partly

Verdicts: **fixed** = a commit on HEAD (`git merge-base --is-ancestor <sha> HEAD` checked for every sha below) plus a closing entry or the code at HEAD; **measured clear** = a later probe found the defect gone without naming the ticket; **open** = the code at HEAD still shows it; **unknown** = runtime behaviour no later document measured. Count: 12 fixed, 1 measured clear, 1 unknown, 28 open (`harness:660` among them, fixed by this lane's item 3). The per-file reads of the open ones were made by three read-only sub-agents at `96d38b2bf`; I re-read the evidence of every fixed and measured-clear row myself.

| Block | Evidence |
|---|---|
| harness:244, :249 | [R] `docs/log-inbox/harness.md:267`: "**Ticket** (closed here): the two tickets of 2026-10-10 found in P-2026-10-10-1532. «trunk prompts after FRONT_FROM lack Front:, Check E fails them at the merge» (high) is closed by the cut-off move … «issue-discovery.md renders no Front:, start --auto will refuse auto-intake lanes» (medium) is closed by item 2". Code `0955ef140`; `lane-tracking.mjs:35` `export const FRONT_FROM = 'P-2026-10-11-0000';`, `issue-discovery.md:8` `Front: {{front}}`. |
| harness:269 | [M] `gh issue view 3 --repo jjodel-modeling/jjodel-lanes` → `"state":"CLOSED"`; `gh project item-list 2` → issue 3 `Done`. Closed by hand; the local record `~/.jjodel-lanes/_tracking/P-2026-10-10-1612.json` still reads `"column": "In progress"`, `"closed": false`, stale and harmless (no sync reads it below `FRONT_FROM`). |
| ir-graphvertex:63 | [R] `ad08a8519` "fix(sync): a stale M1 reference edge leaves graph.subElements (P-2026-10-10-1600)"; `useM1ReferenceEdges.ts:197` `SetFieldAction.new(graphId as any, 'subElements' as any, e.id, '-=', true);`. `docs/discovery/discovery_2026-10-10_stale_m1_reference_edge.md:268`: "the pair's RF edge leaves the state within one rAF flush, so a stale edge no longer holds a handle slot"; `:401`, probe on `ad08a8519`: "**50/50**: after every removal 0 pair edges in state, prop, store and DOM at 1 s and 5 s". Measured on the M1 StateMachine fixture, not on the BPMN one the ticket used. |
| merge-gate:7 | [R] `d414c934d` "fix(harness): direct merge links node_modules, status warns on Status (P-2026-10-03-1631)"; `docs/log-inbox/merge-gate.md:14`: "the direct merge worker checks `frontend/node_modules` in every tree it runs a gate in, links it when missing (ticket above)". |
| symbol-editor:35 | [R] `7c92ffc2c` "fix: IR node and row re-resolve on object and metaclass rename (P-2026-10-02-1645)"; `irResolveCore.ts:167` puts `dObject.name` in the snapshot (`` snap.push(`n=${JSON.stringify(dObject.name ?? dObject.initialName ?? '') `` …), the field the ticket said was missing. |
| symbol-editor:41 | [R] `d8f2e61c3` "fix(editor-v2): value segment toggle reads the effective default (P-2026-10-02-1646)"; `docs/log-inbox/symbol-editor.md:19`: "Closes this inbox's ticket «FieldSegmentEditor toggle has the same inverted default»". |
| symbol-editor:46 | [R] `aa04b92fb` "feat(editor-v2): a path label on one attribute edits on the canvas (P-2026-10-02-1647)"; `IRNodeContent.tsx:384-389` `if (label?.editsFeature) { … syncUpdateFeatureValue(...)`. |
| symbol-editor:91 | [R] `ac64b213b` "fix(redux): copy-on-write never writes into the previous state (P-2026-10-03-1632)"; `docs/log-inbox/symbol-editor.md:125` "## 2026-10-03 — fix(redux): undo restores a slot written inline, …", whose entry names the ticket «one undo does not restore a slot value written by syncUpdateFeatureValue». |
| simulation:261 | [R] `68e4f312d` "fix: no console errors E1 and E2 on the demo scenes (P-2026-10-05-1648)"; `docs/log-inbox/simulation.md:543`: "Probe, 40 pages: E1 0/20, E2 0". Its remainder is `simulation:546`, open. |
| views:198 | [R] `cce1ecfef` "fix(ir): outside marks of a coloured node keep the notation ink (P-2026-10-02-2356)"; `docs/log-inbox/views.md:218`: "Closes the ticket «name-ink marks outside a colour…»" (the line runs on). |
| views:256 | [R] `803b84e3a` "feat(editor-v2): toolbar auto-layout uses ELK in full (P-2026-10-01-2215)"; `elkLayout.ts:334` `const visible = nodes.filter(n => !n.hidden);`; `docs/log-inbox/views.md:272`: "Closes the ticket on hidden object-as-edge vertices (`a2b4e8168`)". |
| views:275 (measured clear) | [R] `docs/discovery/discovery_2026-10-03_petri_ink_ports.md:20-21`, Petri net (classic): "After the RIGHT Auto layout all clear (22.8 px or more)", measured at `517a7fb4d`; then `679d68710` "fix(editor-v2): an outside label takes a side no edge end holds (P-2026-10-03-1920)". Left over at rest, not after layout (`:339`): "1 (t1, a line passing under)". No entry closes the ticket by name. |
| jjscript:88 (unknown) | [R] no commit or document after `9a752d000` names the lost edge lanes; the report `discovery_2026-10-03_tree_crossing_scene.md` says the step that drops them "is not isolated". Deciding needs a fresh `m2-rest` dump. |

Open rows whose evidence is worth one line, for the chat's choice:

- harness:274 [M] `command grep -c '^Depends:' frontend/scripts/lane-templates/issue-discovery.md` → 0 (control `^Front:` → 1).
- harness:346 [R] `lane-run.mjs:1708` `mergeFindings(m, o, Boolean(o.launch && goahead))`; `merge-into-trunk.md:37` "must be empty" with no go-ahead exception; `:42` "`check:docs` 4/4". All three parts stand.
- harness:364 [R] `resume` (`lane-run.mjs:938-970`) never calls `goAheadOption` (0 hits in that window; control `readAuto`, 1 hit): it reads `goahead.txt` and cannot write it.
- views:56 [R] the go-ahead variable still reaches the hook tests; the body of `679d68710` names it again ("criticalZone.test.ts red inside this go-ahead lane only").
- views:74, :119 [R] `check-addonly.ts:196-204` still pools an inbox deficit against the active log's new entries only.
- codegen-panel:24 [R] `EditorV2.tsx:2928-2933`: INPUT and SELECT return early, then `Delete`/`Backspace` call `deleteSelected()`; no TEXTAREA guard.

## 5. Phase 2 shape: what reuse means here

[R] `lane-tracking.mjs` at `96d38b2bf`:

- `syncCard(id, wanted, opts)` (`:438-524`) keys everything on a Prompt-ID: the record `join(dir, id + '.json')` (`:440`), the lock `withLock(dir, id, …)` (`:444`), the heal `findIssue(gh, board, id)` (`:421-425`), which keeps an issue only when `i.title === id || i.title.startsWith(id + ' ')` (`:423`). A ticket title `ticket: <title>` never matches it.
- `managed(labels)` (`:389`) keeps only `TRACK_LABELS` (`:123`); on a heal, `ticket` and `priority:*` would read as not applied and be re-added each run.
- `ghRunner`, `ghBinary`, `ghCall`, `boardIds`, `withLock`, `readJson`, `writeJson`, `cardLine`, `TrackError` are module-private: a `syncTicket` beside `syncCard` in the same file reuses them without exporting anything and without touching `syncCard`, which is what "no change to how lane cards are projected beyond point 3" asks.
- `trackCard` (the prompt's name) is lane-run's wrapper (`lane-run.mjs:2601-2604`), `trackLane` + one `card:` line; the fail-open contract to copy is `syncCard`'s: "a gh error, a missing project scope, no network go to the card file and come back as one line; it never throws" (`:432-434`).
- `boardIds` (`:400-418`) already caches the Status option ids (Backlog `83db3251` in `~/.jjodel-lanes/_tracking/project.json`, [M]) and the milestone titles by number.

[M] Labels: `gh label list --repo jjodel-modeling/jjodel-lanes` lists the nine GitHub defaults and the six `TRACK_LABELS`, no `ticket`, no `priority:*`. `command grep -c -E "'label', 'create'|label create"` → 0 in `lane-run.mjs`, `lane-tracking.mjs`, `auto-intake.mjs`; positive control `command grep -c "'issue', 'create'" lane-tracking.mjs` → 1. So the six `TRACK_LABELS` were created by hand, and `ticket`, `priority:high|medium|low|unset` must be created before the first `issue create --label ticket` (gh refuses an unknown label on create). Proposal: `syncTicket` reads `gh label list` once per run and creates the missing ones of these five; a dry run plans them.

Proposed shape for Phase 2 (all in `lane-tracking.mjs` unless named):

- `parseTicketBlocks(text)` (pure): the §2.1 rule, `{ heading, date, title, fields: { ticket, priority, foundIn, detail }, text }`.
- `ticketBlock({ date, title, ticket, priority, found, detail })` (pure): the inbox text, the P9 ticket format, so `check:docs` lints it green.
- `ticketKey(inbox, title)`, `ticketFront(block, inbox, fronts, promptFront)` (pure).
- `syncTicket(key, wanted, opts)`: record `<dir>/tickets/<key>.json`, lock `tickets/<key>.lock`, heal by an exact title search plus a `ticket-key: <key>` line in the body (two inboxes may share a title), labels owned: `ticket`, `priority:*`. Column Backlog, or Done and closed for a block the GO closes.
- `lane-run.mjs`: `ticket` subcommand (file mode and `--backfill [--dry-run]`), the dispatch line, the usage text; the backfill reads the inboxes of the trunk ref (`git show alfonso-frontend-jjtl:docs/log-inbox/<f>`, `DEFAULT_TRUNK`, `lane-run.mjs:302`), not the worktree.
- Item 3: `lane-tracking.mjs:192`, the flipped check moved ahead of the `hard-stop` row.

## 6. The hard-stop rule [R]

`frontend/scripts/lane-tracking.mjs:182-193`:

```
    const status = typeof o.headerStatus === 'string' ? o.headerStatus.trim() : '';
    const flipped = status !== '' && status !== 'da eseguire';
    ...
    if (m[1] === 'hard-stop') return card('In review', [isDiscoveryPrompt(o.promptText, o.promptFile) && !o.goSeen ? 'waiting:phase-2' : 'waiting:visual']);
    return flipped ? card('Done', [], true) : card('In review', ['closure-owed']);
```

`frontend/scripts/hooks/__tests__/laneTracking.test.ts:151`: the helper `seen` defaults `headerStatus: 'da eseguire'`; the hard-stop tests at `:188-205` do not override it, so they keep passing with the fix. The new test: `seen({ outcome: 'Outcome: hard-stop', headerStatus: 'eseguito 2026-10-11 · lane x · abc' })` → `card('Done', [], true)`, for a discovery before its GO and for any other prompt. Mutation to bench: the old row restored.

Effect on the board [M], read-only `gh project item-list 2 --owner jjodel-modeling`: card #5 (P-2026-10-11-0040) is Done, moved by hand; with the fix `track --sync` keeps it there. Card #4 (P-2026-10-11-0008) is In review; whether its Status is flipped decides what `track --sync --dry-run` shows in Phase 2.

## 7. Dependencies and risks

- Writes to GitHub in Phase 2: up to 42 issues, 42 project items, 5 labels on `jjodel-modeling/jjodel-lanes` and Project 2 only (fronts.json `board`). Project 1 is never named by the code path (the board block is the only source).
- A rate limit or a network failure mid-backfill: each ticket fails open on its own record, and a re-run continues from the records (the idempotency the prompt asks for).
- `lane-run ticket` writes the inbox in the caller's worktree; two callers writing the same inbox at once is the P13 case the inbox discipline already covers (one lane per inbox).
- The board's search index lags issue creation by seconds; a heal by title search right after a create could miss. The record is written right after the create, as `syncCard` does, so the heal path only runs when a record is lost.

## 8. Files read

- `CLAUDE.md`, `docs/PROTOCOL.md` (P1-P10), `docs/decisions.md` (head), `docs/claude-code-log.md` (head).
- `frontend/scripts/lane-tracking.mjs` (whole), `frontend/scripts/lane-run.mjs` (`:1-30`, `:493-512`, `:936-970`, `:2520-2720`, `:2760-2794`), `frontend/scripts/gates/log-tools.ts` (`:1-120`, `:180-240`, `:355-400`), `frontend/scripts/hooks/__tests__/laneTracking.test.ts` (grep window `:151-209`), `frontend/scripts/lane-templates/issue-discovery.md`, `frontend/scripts/lane-templates/merge-into-trunk.md` (steps 2 and 6).
- `docs/harness/fronts.json`; every ticket block of `docs/log-inbox/*.md` in full; `docs/log-inbox/harness.md:241-300`, `docs/log-inbox/stale-m1-edge.md:1-21`.
- `~/.jjodel-lanes/_tracking/{project,config,P-2026-10-10-1612,P-2026-10-11-1017}.json`.

## 9. Questions

1. Which blocks to skip and which to close (created as Done, closed)? Recommended: close the 12 fixed and views:275 (measured clear), create the other 29 in Backlog (jjscript:88 included; harness:660 and views:74 as questions 2 and 3 say), skip none.
2. The two copies of one finding, `views:74` and `views:119`: one card or two? Recommended: one card (`views:119`, the fuller text), close `views:74` as a duplicate of it.
3. `harness:660` (this lane's item 3): Recommended: create it and close it Done once Phase 2's fix commit exists, so the card records the fix.
4. Front remaps against the file rule (§3): `codegen-panel:24` → maintenance, `views:56`, `:74`, `:119`, `:309` → harness? Recommended: yes for all five.
5. The 25 `**Ticket** (` paragraphs (§2.4 (a)): none on the board? Recommended: none in this backfill; open ones the chat wants tracked get filed with `lane-run ticket` by hand afterwards.
6. Labels: may `lane-run ticket` create the five missing labels (`ticket`, `priority:high|medium|low|unset`) on the board repo? Recommended: yes, created on first use, idempotently.
7. How does the GO name the skip and close lists for `--backfill`? Recommended: a file of `<key> skip|close` lines passed as `--plan <file>`, keys from §4.
