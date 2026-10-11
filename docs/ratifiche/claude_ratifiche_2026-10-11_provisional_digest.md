# Provisional decision rows: a digest by consequence

Prompt-ID: P-2026-10-11-1430 · prompt `docs/prompts/claude_2026-10-11_1430_prompt_provisional_rows_digest.md`
Chat: C-2026-10-10-1145 · session `bb44fe71-1a31-423b-9837-25f2d7de610b` · lane auto (unattended)
Date: 2026-10-11
Register read: `docs/decisions.md` as of `276a69ac7` (its last change), on the trunk tip `4de76fb74`
Status: recommendations only. Nothing here ratifies, amends or revokes a row, and `docs/decisions.md` is unchanged.

## 0. In brief

- **77 rows** have a header that says `provisional`, not 60. The 60 counted by the discovery of P-2026-10-11-1150
  are the `- **` rows marked `provisional, unattended`. The other 17 are: RC-38 (`provisional, awaiting Alfonso`),
  R-SIM-137..140 (`details provisional until the discovery`), R-GEN-17 (`decided by the chat ..., provisional`),
  and 11 rows written without the leading `- ` (R-UNDO-8, R-JS-2..11). The generator never reads those 11 (§7.6).
- **Everything is already on the trunk.** All 24 code commits these rows cite are ancestors of the trunk tip
  (`git merge-base --is-ancestor`, 24 of 24). For all 76 rows that say `reversible: branch` or say nothing, that
  is out of date. Undoing any of them now takes a revert lane on the trunk (RC-25: «after merge a lane of its own»).
- **Groups:** A 35, B 1, C 41. **Recommended:** ratify 74, amend 3, revoke 0. Four recommendations are marked
  unsure. Eight rows are flagged `[RC-26]`: their class is on RC-26's list of things that wait for Alfonso, and
  they did not wait.
- **One reply closes it:** «ok alle raccomandazioni, tranne R-XXX». A row named in that reply keeps its marker until
  Alfonso says what he wants instead.

## 1. How to read the tables

- **A**: a persisted or exported format (a bag key, a field of an exported type, a language form, a generated
  output), core or critical-zone code, a behaviour users already relied on that changes, the demo scenes, or
  `reversible: trunk` in the header.
  **B**: how the harness and the lanes work (RC rows, protocol, tooling).
  **C**: a detail inside a new opt-in surface, a pure internal mechanism, a row that changes nothing, or a
  display fix that makes a control show what the runtime already does.
- **Dependants**, in the form `rows · src · docs`. **rows** counts the other rows of `docs/decisions.md` that cite
  the id; renumbering notes («Was R-VP-32 on the branch») are not counted. **src** counts the files under
  `frontend/src` that name the id, mostly in comments and test titles. **docs** counts the files under `docs/`,
  other than the register, that name the id. Within a group, rows are sorted by rows + src, then by docs.
- **The docs counts for R-VP-27..47 are upper bounds.** Those numbers were reused: R-VP-19..23 became 27..31,
  32..34 became 37..39, 37..39 became 48, 49 and 52, and the unmerged `elk-layout-disc` holds R-VP-40..49 for
  other rows (R-VP-50's note).
- **Evidence · verified · reversible**: taken from the header as written; `—` means the header has no such
  field. **Chat**: the chat that adopted the row, read from the row, its section or the `Chat:` line of its
  prompt. `(inferred)` means the commit names no chat and the owner of the next prompt of the series is given.
- **Flags.** `[unsure]`: I am not sure of the recommendation. `[RC-26]`: the decision is a critical-zone or core
  edit, amends or reinterprets a row Alfonso ratified, moves what the demo shows, or sets a cost, and it was
  taken without him.

## 2. Read these first (the three most consequential, RC-25)

1. **R-UNDO-8**: a core change (`CompositeActionReducer`, the copy-on-write of composite actions) taken on the
   chat's GO, with the RC-30 critical-zone go-ahead passed by the chat at launch (P-2026-10-03-1632; LIR
   `docs/lir/lir_2026-10-03_undo_inline_edit.md`). It makes every slot write undoable, not only the canvas ones:
   before it, ⌘Z on an inline edit restored nothing. Recommended: ratify. A revert would bring that bug back.
2. **R-JS-10**: it widens the JjScript M1 name lookup from the roots to the whole model. That amends R-S1-5, a row
   Alfonso ratified on 2026-08-30, and RC-26 says such an amendment waits for him. The consequence is that a name
   held both by a root and by a contained instance is now refused as ambiguous where the root used to resolve, and
   JjScript's auto-names follow the same scope. The canvas rename namespace of R-S1-1 is untouched
   (`jjscript/executor/commands/instance.ts:117,264` are the only code sites). Recommended: ratify, unsure.
3. **RC-38**: the register and the configuration disagree. The row still reads `provisional, awaiting Alfonso`,
   RC-39 keeps shadow mode until after the demo, and RC-40 (2) leaves `ratifiedBy` null. Yet
   `frontend/scripts/auto-intake.config.json` has carried `"mode": "live"`, `"ratifiedBy": "apierantonio"` and
   `"ratifiedOn": "2026-10-03"` since `53aed9baa` (2026-10-03 23:36, «auto-intake goes live, discovery lanes only
   (ratified by apierantonio, 2026-10-03)»). No row records that switch, and the discovery of 2026-10-10
   (`discovery_2026-10-10_lane_tracking_github_projects.md:375`) still says shadow. Recommended: amend, unsure.
   If that commit carries Alfonso's word, the header becomes `ratified by Alfonso 2026-10-03`, and a new row records
   the live switch (discovery lanes only, `laneByMode.live = discovery`). If it does not, the config goes back to
   shadow.

## 3. Group A: what users or the demo see, public formats, hard to undo (35)

| Row | Line | Date | Decides | Evidence · verified · reversible | Chat | Dependants: rows · src · docs | Recommended |
|---|---|---|---|---|---|---|---|
| R-SIM-122 | 2607 | 2026-10-04 | Clock, decisions 2..7: `period` field, each tick a press of its event, runs beside Play (principle ratified) | measured · none · branch | C-2026-10-04-0145 | 1 (R-SIM-136) · 12 · 13 | ratify (as amended by R-SIM-135, R-SIM-136 and the `watch` stop) |
| R-SIM-67 | 2123 | 2026-09-26 | State declarations live in the bag key `simStateAttributes`, a JSON string `{v:1, attrs}` in fixed field order | — · — · — | C-2026-09-26-1702 | 2 (R-SIM-94, R-SIM-117) · 10 · 19 | ratify (persisted format in use; R-SIM-94 builds on it and asked for this read) |
| R-SIM-137 | 2682 | 2026-10-05 | Watch details: M1 key `runWatches`, level-triggered breakpoints, a hit stops Play and the clocks (scope ratified) | — · — · — | C-2026-10-05-1110 | 0 · 12 · 15 | ratify |
| R-SIM-111 | 2563 | 2026-10-03 | The fixed device library of the board, i.e. the persisted `kind` vocabulary | read · none · branch | C-2026-10-03-1610 (inferred) | 2 (R-SIM-122, R-SIM-128) · 10 · 6 | ratify (as amended by R-SIM-122 and R-SIM-128) |
| R-GEN-17 | 5841 | 2026-10-11 | Generated JavaScript names elements through one frozen `$ID` table; `target` gains `ids` and `ref` | read · none · branch | C-2026-10-10-0046 | 0 · 11 · 12 | ratify |
| R-SIM-115 | 2575 | 2026-10-03 | The board is saved with the model (M1), not M2; an unresolved binding flags its device, never breaks the run | inferred · none · branch | C-2026-10-03-1610 (inferred) | 1 (R-SIM-116) · 10 · 6 | ratify (evidence `inferred`, measured afterwards by R-SIM-116) |
| R-SIM-134 | 2666 | 2026-10-04 | A Clock record gains optional `autoStart`; new Clocks start with their run | measured · none · branch | C-2026-10-04-1126 | 0 · 10 · 10 | ratify |
| R-SIM-139 | 2684 | 2026-10-05 | Scenario details: M1 key `runScenarios`, steps by id, replayed from Reset, cap 1000 (scope ratified) | — · — · — | C-2026-10-05-1110 | 1 (R-GEN-8) · 9 · 6 | ratify |
| R-JS-3 | 5646 | 2026-10-01 | JjScript Run executes in passes: commands failing on a resolvable code are deferred, at most 3 retry passes | — · — · — | C-2026-10-01-1725 | 3 (R-JS-5, R-JS-7, R-JS-8) · 6 · 7 | ratify |
| R-SIM-123 | 2616 | 2026-10-04 | Board style fields are optional in `ioBoard`; absent means default, so old boards encode byte for byte | measured · none · branch | C-2026-10-04-1126 | 0 · 8 · 8 | ratify |
| R-IRN-41 | 1550 | 2026-10-02 | A path label on one own string attribute edits on the canvas, opt-in | measured · — · branch | C-2026-10-01-2349 | 0 · 7 · 12 | ratify (its failing undo item is the one R-UNDO-8 closed) |
| R-SIM-120 | 2597 | 2026-10-03 | Held Switch/Slider values answer hand presses only; reads ratified R-SIM-110 «every press is a step» as «every press that reaches the machine» | read · none · branch | C-2026-10-03-1610 | 2 (R-SIM-122, R-SIM-135) · 4 · 4 | amend (write the reading R-SIM-122 already applies: held values answer presses from the board, ticks included) **[unsure]** **[RC-26]** |
| R-IRN-38 | 1515 | 2026-10-02 | One predicate decides whether a label renames; the Editable toggle shows the effective value, OFF writes `editable: false` | measured · — · branch | C-2026-10-01-2349 | 2 (R-IRN-40, R-IRN-41) · 3 · 14 | ratify (as amended by R-IRN-41) |
| R-JS-9 | 5712 | 2026-10-04 | New JjScript form `create instance of C "n" in Parent.ref`; the father is the slot | — · — · — | C-2026-10-04-0946 | 0 · 5 · 2 | ratify |
| R-VP-39 | 4972 | 2026-09-30 | Per-metaclass override persisted as `metaclassColoring.overrides`; an override re-runs the greedy for the other classes | measured · none · branch | C-2026-09-30-1815 | 0 · 4 · 13 | ratify (pending Alfonso's look: one override recolours five other classes in DemoFlowB) **[unsure]** |
| R-JS-7 | 5688 | 2026-10-01 | A retry pass waits for every dependency up to `MAX_WAIT_MS`; amends ratified R-JS-1 for retry passes | — · — · — | C-2026-10-01-1725 | 1 (R-JS-8) · 3 · 6 | ratify (narrow; it amends a row Alfonso ratified) **[RC-26]** |
| R-JS-6 | 5676 | 2026-10-01 | One summary modal (`RunSummaryDialog`) closes every Run: per-model deltas, retries, every final error | — · — · — | C-2026-10-01-1725 | 0 · 4 · 5 | ratify |
| R-GEN-16 | 5833 | 2026-10-10 | Templates reach the target profile through one context value, `target` | read · none · trunk | C-2026-10-10-0046 | 0 · 3 · 11 | ratify |
| R-VP-28 | 4569 | 2026-09-30 | Exported `DViewElement.metaclassColoring?` optional field, one `SetFieldAction`, no migration | measured · agent · branch | C-2026-09-30-1815 | 0 · 2 · 9 | ratify (second agent) |
| R-JS-4 | 5663 | 2026-10-01 | The forward-reference refusal leaves Run; parse and syntax errors are still refused before command 1 | — · — · — | C-2026-10-01-1725 | 0 · 2 · 3 | ratify |
| R-SIM-117 | 2587 | 2026-10-03 | Ten binding forms: elements of M by id, declarations by element and name, outputs by text | measured · none · branch | C-2026-10-03-1610 | 0 · 2 · 2 | ratify |
| R-JS-10 | 5723 | 2026-10-04 | M1 name lookup is model-wide (roots and contained instances); amends ratified R-S1-5's scope | — · — · — | C-2026-10-04-0946 | 0 · 2 · 0 | ratify (without it a contained instance cannot be named; a name held by a root and a contained instance is now ambiguous) **[unsure]** **[RC-26]** |
| R-SIM-116 | 2583 | 2026-10-03 | The I/O board is the M1 bag key `ioBoard`, one deterministic JSON string, deliberately not a `sim*` key | measured · agent · branch | C-2026-10-03-1610 | 1 (R-SIM-123) · 0 · 8 | ratify (round-trip measured, second agent) |
| R-VP-31 | 4613 | 2026-09-30 | Only the active viewpoint colours M1 nodes; new optional prop `colorOverride` on `IRNodeContent` (`viewpoint/ir/`) | measured · none · branch | C-2026-09-30-1815 | 0 · 1 · 8 | ratify (critical-zone file under the chat's RC-30 go-ahead, LIR in its report §6) **[RC-26]** |
| R-ESEL-2 | 334 | 2026-09-30 | Edge click: an M1 edge opens its slot (`DValue`), an object-as-edge its `DObject`; inheritance unchanged (nothing) | measured · none · branch | C-2026-09-30-1940 | 0 · 1 · 7 | ratify |
| R-JS-5 | 5670 | 2026-10-01 | Run never pauses: the Skip dialog leaves Run, recovery actions move to the summary; Step unchanged | — · — · — | C-2026-10-01-1725 | 0 · 1 · 4 | ratify |
| R-VP-32 | 4869 | 2026-09-30 | Activity (UML) draws view-only decision and merge diamonds, already-derived viewpoints included | measured · none · branch | C-2026-09-30-1932 | 0 · 0 · 22 | ratify (Alfonso approved the target, 2026-09-30 19:30) |
| R-VP-40 | 5074 | 2026-10-02 | A notation's layout profile: optional `layout` on `DerivedNotation`, persisted as `_state.derivedLayout` | measured · none · branch | C-2026-10-01-2215 | 0 · 0 · 16 | ratify |
| R-EE-1 | 5263 | 2026-09-30 | Seven new edge ends (filled circle, bar, cross, four ER ends); persisted names, permanent once saved | measured · none · branch | C-2026-09-30-1810 | 0 · 0 · 11 | ratify (last cheap moment to rename them) |
| R-EE-3 | 5286 | 2026-09-30 | End labels widen to `TextSource \| { multiplicity?, role? }` | measured · agent · branch | C-2026-09-30-1810 | 0 · 0 · 8 | ratify (second agent) |
| R-VP-42 | 5084 | 2026-10-02 | Toolbar auto-layout puts every node on the 8 px grid (writes positions); the 16 px drag snap unchanged | measured · none · branch | C-2026-10-01-2215 | 0 · 0 · 7 | ratify (moves the demo scenes after an auto-layout, not at rest, per R-VP-50) **[RC-26]** |
| R-VP-46 | 5100 | 2026-10-02 | A metamodel canvas without a profile takes the class view profile on the toolbar layout | measured · none · branch | C-2026-10-01-2215 | 0 · 0 · 7 | ratify (same demo caveat as R-VP-42) **[RC-26]** |
| R-EE-2 | 5276 | 2026-09-30 | Each edge end may be a `Conditional<EdgeTermination>`, resolved per edge instance | measured · none · branch | C-2026-09-30-1810 | 0 · 0 · 7 | ratify |
| R-UNDO-8 | 3420 | 2026-10-03 | Core: `CompositeActionReducer` copy-on-write never writes the previous state, so every slot write becomes undoable | measured · none · branch | C-2026-10-03-1610 | 0 · 0 · 6 | ratify (fixes ⌘Z doing nothing on inline edits; core change with a chat go-ahead) **[RC-26]** |
| R-VP-34 | 4901 | 2026-09-30 | Derived viewpoints: the run token is a dot inside the node, the marked node a 2 px cyan border | measured · none · branch | C-2026-09-30-1932 | 0 · 0 · 6 | ratify (default viewpoint, where the demo runs, unchanged) |

## 4. Group B: the harness and the lanes (1)

| Row | Line | Date | Decides | Evidence · verified · reversible | Chat | Dependants: rows · src · docs | Recommended |
|---|---|---|---|---|---|---|---|
| RC-38 | 284 | 2026-10-03 | Night budget of auto-intake: only the slack of the 7-day window, 240 min a night, 90 min a lane, at most 2 in parallel | measured · agent · trunk | C-2026-10-03-1705 | 2 (RC-40, RC-41) · 0 · 5 | amend (header to `ratified by Alfonso 2026-10-03` if `53aed9baa` was his word, and a row for the live switch it carries) **[unsure]** **[RC-26]** |

## 5. Group C: local, cheap to undo (41)

| Row | Line | Date | Decides | Evidence · verified · reversible | Chat | Dependants: rows · src · docs | Recommended |
|---|---|---|---|---|---|---|---|
| R-SIM-133 | 2658 | 2026-10-04 | Keycaps fire devices while the card has focus; buzzer by WebAudio, muted by default | measured · none · branch | C-2026-10-04-1126 | 0 · 11 · 5 | ratify |
| R-SIM-128 | 2635 | 2026-10-04 | Two new kinds: silkscreen and buzzer | measured · none · branch | C-2026-10-04-1126 | 0 · 10 · 4 | ratify |
| R-SIM-126 | 2627 | 2026-10-04 | Per-kind device style fields; a text display sized from its domain | measured · none · branch | C-2026-10-04-1126 | 2 (R-SIM-127, R-SIM-131) · 7 · 6 | ratify (as amended by R-SIM-131: Pulse LED defaults amber) |
| R-SIM-132 | 2654 | 2026-10-04 | 6- and 8-column boards float as a window; place is a viewer preference | measured · none · branch | C-2026-10-04-1126 | 1 (R-SIM-125) · 7 · 5 | ratify |
| R-SIM-140 | 2685 | 2026-10-05 | Coverage details: counts per model on their own channel, node overlay off by default | — · — · — | C-2026-10-05-1110 | 1 (R-SIM-146) · 7 · 5 | ratify (as amended by R-SIM-146 (5)) |
| R-SIM-127 | 2631 | 2026-10-04 | Icon and role suggested from the event's name (English and Italian), never stored | measured · none · branch | C-2026-10-04-1126 | 1 (R-SIM-126) · 7 · 4 | ratify |
| R-SIM-138 | 2683 | 2026-10-05 | Step back details: `simStepBack` pops the kept configurations, no bound; button between Reset and Step | — · — · — | C-2026-10-05-1110 | 1 (R-SIM-142) · 7 · 3 | ratify |
| R-SIM-130 | 2646 | 2026-10-04 | Theme palettes as closed Sass maps, no app token | measured · none · branch | C-2026-10-04-1126 | 0 · 7 · 8 | ratify |
| R-SIM-119 | 2594 | 2026-10-03 | The board and the run inspector share one card slot; the board closes with the panel | inferred · none · branch | C-2026-10-03-1610 | 1 (R-SIM-132) · 6 · 3 | ratify |
| R-VP-27 | 4561 | 2026-09-30 | «Color by metaclass» switch in the viewpoint panel, off by default, with Base color and Border | measured · none · branch | C-2026-09-30-1815 | 1 (R-VP-50) · 5 · 19 | ratify (as amended by R-VP-50) |
| R-SIM-113 | 2569 | 2026-10-03 | Board devices follow the panel's rules: off with a reason, domain checks, Choices | read · none · branch | C-2026-10-03-1610 (inferred) | 2 (R-SIM-119, R-SIM-120) · 4 · 4 | ratify |
| R-SIM-131 | 2650 | 2026-10-04 | Shapes, roles, icons and glyph sizes as drawn; Pulse LED defaults amber | measured · none · branch | C-2026-10-04-1126 | 0 · 5 · 6 | ratify |
| R-SIM-135 | 2670 | 2026-10-04 | Clocks belong to `SimulationPanel`, not to the card; they tick with the board closed | measured · none · branch | C-2026-10-04-1126 | 0 · 5 · 5 | ratify |
| R-SIM-112 | 2566 | 2026-10-03 | The keypad declares its mode (value or events) in the binding | read · none · branch | C-2026-10-03-1610 (inferred) | 2 (R-SIM-111, R-SIM-121) · 3 · 4 | ratify (detailed by R-SIM-121) |
| R-SIM-125 | 2623 | 2026-10-04 | Board `cols` 4/6/8 and device `span`; occupancy by covered cells | measured · none · branch | C-2026-10-04-1126 | 0 · 5 · 4 | ratify |
| R-VP-30 | 4597 | 2026-09-30 | Text black or white by WCAG; selected node keeps its fill; border rule (later replaced) | measured · none · branch | C-2026-09-30-1815 | 2 (R-VP-37, R-VP-51) · 2 · 14 | ratify (as amended by R-VP-37 on the border) |
| R-SIM-136 | 2674 | 2026-10-04 | A clock tick that enables nothing is not a step; amends R-SIM-122 (3) | measured · none · branch | C-2026-10-04-1126 | 0 · 4 · 7 | ratify |
| R-SIM-124 | 2620 | 2026-10-04 | Four front-panel themes and an accent, Variant B only | read · none · branch | C-2026-10-04-1126 | 0 · 4 · 3 | ratify |
| R-JS-11 | 5730 | 2026-10-04 | The M1 wait waits for the instance's metaclass, not only its handle | — · — · — | C-2026-10-04-0946 | 0 · 4 · 1 | ratify |
| R-VP-37 | 4937 | 2026-09-30 | Twelve fixed pastel swatches; Base color is the seed; border at 55 % lightness | measured · none · branch | C-2026-09-30-1815 | 1 (R-VP-38) · 2 · 21 | ratify |
| R-VP-29 | 4581 | 2026-09-30 | Analogous palette within ±60° of the base; classes indexed depth-first | measured · none · branch | C-2026-09-30-1815 | 1 (R-VP-37) · 2 · 9 | amend (keep the class order; the hue rule is superseded by R-VP-37, move that part to Superate) |
| R-SIM-121 | 2600 | 2026-10-03 | Keypad: value buffer in the device; events mode, one event per key | read · none · branch | C-2026-10-03-1610 | 0 · 3 · 3 | ratify |
| R-VP-38 | 4952 | 2026-09-30 | Swatches assigned greedily, connected classes as far apart in hue as possible | measured · none · branch | C-2026-09-30-1815 | 0 · 2 · 10 | ratify |
| R-ESEL-1 | 328 | 2026-09-30 | A pure resolver maps a clicked edge to the panel's element, read from the D-layer | measured · none · branch | C-2026-09-30-1940 | 0 · 2 · 6 | ratify |
| R-JS-2 | 5637 | 2026-10-01 | A scope-bound M2 wait resolves a bare name in the bound metamodel only | — · — · — | C-2026-10-01-1725 | 0 · 2 · 6 | ratify |
| R-JS-8 | 5705 | 2026-10-04 | Run defers M1 lines too, on two M1 codes | — · — · — | C-2026-10-04-0946 | 0 · 2 · 3 | ratify |
| R-VP-45 | 5094 | 2026-10-02 | Only the toolbar runs the full layout; opening a project renders as before | measured · none · branch | C-2026-10-01-2215 | 1 (R-VP-53) · 0 · 9 | ratify |
| R-ESEL-3 | 341 | 2026-09-30 | The clicked edge stays the canvas selection; an object-as-edge selects nothing | measured · none · branch | C-2026-09-30-1940 | 0 · 1 · 5 | ratify |
| R-ESEL-5 | 349 | 2026-09-30 | Highlight mode, node click and pane click unchanged | measured · none · branch | C-2026-09-30-1940 | 0 · 1 · 5 | ratify |
| R-IRN-39 | 1538 | 2026-10-02 | IR node and row subscriptions carry the object's and the metaclass's names, so renames refresh labels | measured · — · branch | C-2026-10-01-2349 | 0 · 0 · 17 | ratify (a superclass rename stays stale, declared) |
| R-IRN-40 | 1525 | 2026-10-02 | The value segment's «editable inline» toggle reads the effective value (absent shows ON) | measured · — · branch | C-2026-10-01-2349 | 0 · 0 · 14 | ratify |
| R-VP-41 | 5079 | 2026-10-02 | ELK routes are drawn from a session store, never persisted | measured · none · branch | C-2026-10-01-2215 | 0 · 0 · 10 | ratify |
| R-EE-4 | 5297 | 2026-09-30 | The edge authoring panel groups the ends; Conditional ends and end labels in Advanced | read · none · branch | C-2026-09-30-1810 | 0 · 0 · 8 | ratify |
| R-VP-43 | 5087 | 2026-10-02 | No fixed-side ports; each edge's sides come from its ELK route | measured · none · branch | C-2026-10-01-2215 | 0 · 0 · 7 | ratify |
| R-VP-44 | 5090 | 2026-10-02 | ER (Chen) laid out by stress plus overlap removal, straight lines | measured · none · branch | C-2026-10-01-2215 | 0 · 0 · 7 | ratify |
| R-VP-47 | 5104 | 2026-10-02 | Diamonds, arc chords and labels follow the ELK route's ends | measured · none · branch | C-2026-10-01-2215 | 0 · 0 · 7 | ratify |
| R-ESEL-4 | 345 | 2026-09-30 | Native and mirrored edge clicks share the same handlers | read · none · branch | C-2026-09-30-1940 | 0 · 0 · 5 | ratify |
| R-VP-35 | 4914 | 2026-09-30 | Review points 4 to 6 change nothing in the code | measured · none · branch | C-2026-09-30-1932 | 0 · 0 · 5 | ratify |
| R-SIM-129 | 2639 | 2026-10-04 | Out of the first cut: SVG/PNG export (needs a dependency), user themes | read · none · branch | C-2026-10-04-1126 | 0 · 0 · 4 | ratify |
| R-VP-33 | 4891 | 2026-09-30 | Activity guard label: mono 11.5 px, slate-700, on a white patch | measured · none · branch | C-2026-09-30-1932 | 0 · 0 · 4 | ratify (Alfonso asked for it) |
| R-SIM-118 | 2590 | 2026-10-03 | A board output is a global DEFINE evaluated on the run's frozen M (`SimRun.snapshot`) | measured · agent · branch | C-2026-10-03-1610 | 0 · 0 · 3 | ratify (second agent) |

## 6. Provisional markers outside a row header (not counted, for completeness)

- **R-SIM-70, extension of 2026-09-27** (`docs/decisions.md:2155`): a paragraph marked `provisional, unattended`
  (P-2026-09-27-2235, `8beb4b28e`, the R1/R2 checks of `stcChecks.ts`) inside a row Alfonso ratified on
  2026-09-28, the day after. Whether his ratification covered the paragraph is not written down. Recommended:
  ratify with the row.
- **Chat decisions without the word `provisional`**: R-SIM-94 and R-SIM-95 (decided on delegation), R-SIM-108
  (veto «stays open»), R-SIM-142 (the view-only reading and «Continue from here» are the chat's), R-SIM-143
  (details adopted under RC-25), RC-40, RC-44 and RC-45, and R-VP-19..23 («ratified by the chat ... on Alfonso's
  delegation», which the generator would label `ratified`). They fall outside this digest's criterion, which is
  the header word. They are listed so that 77 is not mistaken for the number of chat decisions Alfonso has not
  seen.

## 7. The 49 headers the generator cannot parse

`npm run docs:digest -- --all` exits 2 on the register at `276a69ac7`. The parser is `parseHeader` in
`frontend/scripts/gates/docs-digest.ts:111-160`: it closes the header at the first `)`, splits the fields on
`,`, refuses any field other than `provisional`, `unattended` and the three keys in a provisional row, and requires
`evidence`, `verified` and `reversible` all together or not at all. The rewrites below are the smallest ones that
parse. None is applied: changing the register is Alfonso's call.

| # | Kind of deviation | n | Rows (line) | Minimal rewrite |
|---|---|---|---|---|
| 1a | `;` between fields, and `verified` missing, in a provisional row | 4 | R-IRN-38 (1515), R-IRN-40 (1525), R-IRN-39 (1538), R-IRN-41 (1550) | `(2026-10-02, provisional, unattended, evidence: measured, verified: none, reversible: branch)` |
| 1b | an adoption clause in a provisional header | 14 | R-SIM-123..136 (2616-2674) | drop `adopted by the chat C-2026-10-04-1126 under RC-25;` (the section intros already say it): `(2026-10-04, provisional, unattended, evidence: <as written>, verified: none, reversible: branch)` |
| 1c | `;` after `unattended` | 1 | R-GEN-16 (5833) | `unattended; evidence` becomes `unattended, evidence` |
| 1d | `awaiting Alfonso under RC-26` as a field | 1 | RC-38 (284) | move the clause after the colon: `(2026-10-03, provisional, evidence: measured, verified: agent, reversible: trunk)`, or the ratified form if §2 item 3 confirms it |
| 2 | the header runs onto a second line | 10 | R-VP-19..23 (4628, 4656, 4683, 4723, 4759), R-VP-54..57 (5139, 5161, 5167, 5177), R-GEN-17 (5841) | join the header onto one line. R-VP-54..57 then fail on kind 5 (`verified: visual OK by Alfonso 2026-10-03`): use `verified: none` and move the visual OK to the body. R-GEN-17 then fails on kind 1: `(2026-10-11, provisional, unattended, evidence: read, verified: none, reversible: branch)`, with «decided by the chat on Alfonso's «decidi tu»» in the body |
| 3 | a parenthesis nested inside the header, so the first `)` closes it early | 12 | R-GOAL-1 (5750), R-GEN-1..11 (5767-5809) | drop the inner parentheses: `ratified by Alfonso 2026-10-10 «ratifico», evidence: ...` (R-GOAL-1: `ratified by Alfonso 2026-10-05 «vai» on the chat's proposal of seven, evidence: ...`) |
| 4 | only two of the three keys are read, because `;` glues the first one to the field before it | 5 | R-GEN-12..15 (5816-5829), R-SIM-122 (2607) | R-GEN-12..15: `unattended; evidence` becomes `unattended, evidence`. R-SIM-122 has two statuses in one header, which the grammar does not allow: `(2026-10-04, provisional, unattended, evidence: measured, verified: none, reversible: branch)`, with «principle (1) ratified by Alfonso 2026-10-04; 2..7 adopted by C-2026-10-04-0145 under RC-25» in the body |
| 5 | `verified: probe` is outside `agent\|none` | 2 | R-GV-15 (5924), R-GV-16 (5932) | `verified: none` with the probe in the body, or add `probe` to `VOCABULARY.verified` (a script change, also Alfonso's call) |

Total: 4 + 14 + 1 + 1 + 10 + 12 + 5 + 2 = 49.

Two blind spots outside the 49, which matter more for a digest than the 49 do:

6. **Rows without the leading `- ` are skipped without a word.** `ROW_START` (`docs-digest.ts:85`) requires
   `- **` at column 0. There are 165 such rows (R-LAY 19, R-VAL 19, R-FORM 15, R-VP 14, R-JS 11, R-SGL 10,
   R-UNDO 8, and others). 11 of them are provisional: R-UNDO-8 and R-JS-2..11. The minimal rewrite is the prefix
   `- `. Also, `ROW_ID` (`:83`) only matches ids that start with `R`, so 32 bullet rows are not read either: D-UI 7,
   D-4 8, D-5 2, D 1, R-A..R-H 6, R-B9-bis 1, «Ticket» 4, «Esclusi» 2, «Esecuzione» 1. None of these is
   provisional.
7. **`provisional` inside a free-text field does not set the flag.** R-SIM-137..140
   (`ratified by Alfonso for scope; details provisional until the discovery`) parse without error and are
   labelled `ratified`. The minimal rewrite is `(2026-10-05, provisional, unattended, evidence: read, verified:
   none, reversible: branch)`, with «scope ratified by Alfonso» in the body. If Alfonso ratifies the details here,
   nothing needs rewriting.

## 8. Counts

| Group | ratify | amend | revoke | total |
|---|---|---|---|---|
| A | 34 | 1 (R-SIM-120) | 0 | 35 |
| B | 0 | 1 (RC-38) | 0 | 1 |
| C | 40 | 1 (R-VP-29) | 0 | 41 |
| **total** | **74** | **3** | **0** | **77** |

- **Unsure (4):** RC-38, R-JS-10, R-SIM-120, R-VP-39.
- **`[RC-26]` (8):** RC-38 (cost), R-UNDO-8 (core and critical zone), R-VP-31 (critical-zone file), R-JS-7 and
  R-JS-10 (each amends a ratified row), R-SIM-120 (reinterprets ratified R-SIM-110), R-VP-42 and R-VP-46 (move
  the demo scenes after an auto-layout).
- **No revoke** is recommended. Every row is implemented, merged and measured, and a revert would mean a lane on
  the trunk. The two amends to substance (R-SIM-120, R-VP-29) bring the text in line with what the code and later
  rows already do. RC-38 is about its marker.

## 9. Method

- The rows were found by a header parser over `docs/decisions.md` that opens a row at every `**ID** (`, with or
  without the leading `- `, and matched `provisional` inside the header's parentheses. Positive control:
  `command grep -n -i provisional docs/decisions.md` returns 92 lines, exit 0. Every line with `provisional` in a
  row header is among the 77 rows. The other matches are prose (RC-25/26, section intros, bodies) and the
  R-SIM-70 extension (§6).
- Dependants were counted by a regex on the id, `(?<![A-Za-z0-9-])ID(?![0-9])`, so that R-VP-3 does not match
  R-VP-30. It ran over 1957 files under `docs/` and 1697 under `frontend/src`, read whole by node, with no ugrep
  ignore rules involved.
- The trunk check is `git merge-base --is-ancestor <sha> HEAD` for the 24 code commits the rows cite: all 24 are
  ancestors.
- The probes stay in `/tmp/pd/`, uncommitted. They are `rows.mjs`, `deps.mjs`, `data.mjs` (this digest's
  classification and recommendations, one line per row) and `gen.mjs`.

## 10. Outcome

- **Reply.** Alfonso, 2026-10-11 15:36: «ok alle raccomandazioni». Read by the chat C-2026-10-10-1145 as every
  `ratify` and every `amend` of §3 and §5 accepted, and the §7 rewrites, except RC-38.
- **Applied** by P-2026-10-11-1540: 74 rows ratified, header `(<date>, ratified by Alfonso 2026-10-11, ...)`, every
  `reversible: branch` of them written `trunk` (§0); R-SIM-120 and R-VP-29 amended as §3 and §5 say, then ratified;
  §7 kinds 1a to 7 applied to every row but RC-38. Kind 1b drops the adoption clause, which the section intros
  already state. R-SIM-122's and R-GEN-17's clauses move into the body, after the bold title. R-VP-29's hue rule
  moves to «Superate».
- **Check.** `npm run docs:digest -- --all` exits 2 on RC-38's header alone; one header still says `provisional`,
  RC-38's. `--write` refuses on the same header and writes nothing, so `docs/digest/` is unchanged: the backfill
  (34 dates) runs once RC-38 parses.
- **Pending: RC-38**, unchanged. Question for Alfonso: does `53aed9baa` («auto-intake goes live, discovery lanes
  only (ratified by apierantonio, 2026-10-03)») carry your ratification of RC-38's numbers and of the live switch?
  Yes: the header becomes `ratified by Alfonso 2026-10-03` and a new row records the live switch. No: the
  configuration goes back to shadow (§2 item 3).
- **Not applied:** the R-SIM-70 paragraph of §6 (a row body, outside the 77), and the intros above R-JS-2 and R-JS-8,
  which still say «Marker: provisional» (prose, not headers).
