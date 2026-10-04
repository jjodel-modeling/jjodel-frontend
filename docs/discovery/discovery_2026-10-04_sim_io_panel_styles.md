# Discovery — styles of the I/O board's front panel (themes, spans, device styles, icons)

- Prompt-ID: P-2026-10-04-1130 (`docs/prompts/claude_2026-10-04_1130_prompt_sim_io_panel_model.md`); covers also the chained P-2026-10-04-1131 (`docs/prompts/claude_2026-10-04_1131_prompt_sim_io_panel_faces.md`), which has no discovery of its own.
- Session: unknown (the harness does not show its id to the session).
- Tree: `~/jjodel-w-iopanel`, branch `sim-io-panel`, HEAD `b27138436` (on top of the Clock lane `452efc6f1`).
- Executor: Anthropic Claude Opus 5.5 (the session banner).
- Phase 1, read-only. This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the real files.

## 0. Answer in brief

**Answer.** Every decision of P-2026-10-04-1130 (R-SIM-123..129) holds in the pure modules as written, with one exception that is about the lane's perimeter, not about the decision: adding `silk` and `buzzer` to `DeviceKind` (R-SIM-128) breaks the compile of two exhaustive maps in `.tsx` files that this lane may not touch, `KIND_ICON` (`SimBoardEditor.tsx:59`) and `FACES` (`simBoardDevices.tsx:273`). Without them typecheck goes from 14 to 16 and a stored silkscreen crashes the card (`FACES[kind]` undefined). No other contradiction; no critical-zone file.

**Recommendation.** Let this lane add one entry per new kind to those two maps (four lines, two files), `buzzer` drawn by the existing `LampFace` and `silk` by `TextFace` showing its label, until P-2026-10-04-1131 draws them properly; everything else stays in the pure `.ts` modules listed in §6.

**Decisions awaiting Alfonso (RC-26).** Possibly one: the widening of the exported `DeviceKind` breaks two consumers outside this lane's DOVE (RC-26, item 2). They are files of the chained lane P-2026-10-04-1131, which rewrites them next; read that way the break is internal to the chain and Q1 is the chat's to answer. Nothing else.

**Decisions taken (unattended), §7:** D-UI-16 goes right after D-UI-14, since D-UI-15 is on the trunk only (`18a861da7`); defaults are never written, explicit or absent alike; a field dropped by the decoder is reported with the existing codes plus an optional `field`; overlap and off-grid by span drop the device, as the cell-taken defect does today; the swap of `moveDevice` is kept when the swapped result is valid; `maxDisplayLength` finds a domain only for a single `X.[attr]` read.

**Questions**

1. The two `.tsx` maps: may this lane add `silk` and `buzzer` to `KIND_ICON` and `FACES` so that typecheck stays at 14?
   Recommended: yes, four lines in `SimBoardEditor.tsx` and `simBoardDevices.tsx`, buzzer → `LampFace`, silk → `TextFace` with its label, replaced by P-2026-10-04-1131.
2. R-SIM-133 asks for a key on «each input device … fired as a click does»; a Slider has no click and a Keypad has twelve keys (`simBoardDevices.tsx:132-183`). Which input devices carry a shortcut in P-2026-10-04-1131?
   Recommended: Button, Switch and Clock; Slider and Keypad get none; `suggestKeys` stays agnostic and takes the names its caller passes.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The new fields can be optional and absent by default, so every board saved today encodes byte for byte the same. | **Holds [read].** `encodeBoard` writes a fixed literal per device (`boardCodec.ts:163-169`); a field added only when not default leaves today's string unchanged, as `period` already does for non-clocks (`:167`). No demo export carries a board (§4.4). |
| H2 | Occupancy by covered cells fits the existing operations without changing their signatures. | **Holds [read].** `onGrid`, `firstFreeCell`, `addDevice`, `moveDevice` read `BOARD_COLUMNS` and single cells (`boardCodec.ts:142-144`, `simBoard.ts:302-329`); a trailing optional `cols` and a covered-cell set are enough. |
| H3 | The event's label reaches a device at render time, so a suggested icon can be computed and never stored. | **Holds [read].** `ctx.events` carries the panel's labels (`simBoard.ts:164`, `netCompile.ts:650`), and `deviceName` already reads it (`simBoardFace.ts:143-145`, `:157`). |
| H4 | The installed `bootstrap-icons.json` can be imported by a vitest test and lazily by the editor without a new dependency. | **Holds [measured].** `bootstrap-icons` 1.13.1 is already a dependency (`frontend/package.json:32`), its package has no `exports` map, and an ESM import of `bootstrap-icons/font/bootstrap-icons.json` resolves to 2078 names (53043 bytes). |
| H5 | A 6- or 8-column board fits the card slot beside the rail. | **Falsified [read].** The slot is 400 px clamped to 372 px with the rail open (report 2026-10-03 H1); 6 columns need about 581 px, 8 about 762 px (§4.6). R-SIM-132's floating window is required, as it already says. |
| H6 | The new kinds can enter the codec without touching a `.tsx` file. | **Falsified [read].** Two exhaustive `Record` maps over the kind live in `.tsx` files (§3). |
| H7 | Variant B reads no app token today, so a theme can be a closed palette (D-UI-16). | **Holds [read].** From `SimBoard.scss:688` on (`.sim-board--panel …`) no `var(--…)` is read; positive control: 100 reads in the file, the last at `:681`. |

## 2. Files read

`frontend/src/model/simulation/boardCodec.ts`, `frontend/src/model/simulation/boardOutputs.ts`, `frontend/src/model/simulation/__tests__/boardCodec.test.ts`, `frontend/src/components/editor-v2/sim/simBoard.ts`, `simBoardFace.ts`, `simBoardClock.ts` (header only), `simBoardDevices.tsx`, `SimBoardEditor.tsx`, `SimBoard.scss` (lines 1-60, 225-260, token grep), `SimBoardEditor.scss` (not opened: P-2026-10-04-1131's), `simViewerPrefs.ts`, `SimulationPanel.tsx` (lines 321-325, 728-760, 1169-1190, 1284, 1329), `simBridge.ts:963-969`, `frontend/src/model/simulation/netCompile.ts:645-652`, `frontend/package.json`, `frontend/src/index.tsx:7`; `docs/decisions.md` (RC-11, RC-17, RC-20, RC-21, RC-25, RC-26, RC-32, R-SIM-68, R-SIM-110..122, D-UI-14), D-UI-15 from `alfonso-frontend-jjtl:docs/decisions.md`; `docs/PROTOCOL.md` P1-P7, P13, P16; `docs/discovery/discovery_2026-10-03_sim_io_board.md` (H1); `docs/log-inbox/simulation.md` (head and the last four entries).

## 3. The new kinds and the two `.tsx` maps (H6, Q1)

- `frontend/src/components/editor-v2/sim/SimBoardEditor.tsx:59`: `const KIND_ICON: Readonly<Record<DeviceKind, string>> = {` with ten keys (`:60-61`). A `DeviceKind` with twelve members is a missing-property error there.
- `frontend/src/components/editor-v2/sim/simBoardDevices.tsx:273`: `const FACES: Readonly<Record<DeviceFace['kind'], (p: BoardDeviceProps) => ReactElement>> = {`, and `DeviceFace.kind` is `DeviceKind` (`simBoardFace.ts:107`). Same error; at run time `const Face = FACES[face.kind]` (`simBoardDevices.tsx:284`) is undefined for a silkscreen and React throws.
- The search: `grep -rn 'Record<DeviceKind\|Record<DeviceFace\|DeviceKind, '` over `frontend/src` and `frontend/scripts` (system grep, exit 0) finds four maps: the two above, `DEVICE_LABELS` (`simBoard.ts:47`) and `BINDING_KINDS` (`boardCodec.ts:85`), both in this lane. The probes under `frontend/scripts/probe/` carry none.
- Both maps' files are P-2026-10-04-1131's; neither is in the critical zone. The prompt's DOVE excludes `.tsx`, hence Q1.

Nothing else in the `.tsx` files reads the kind exhaustively: the palette iterates `DEVICE_KINDS` (`SimBoardEditor.tsx:339`), so with Q1 adopted it lists Silkscreen and Buzzer at once, under Outputs (`isInputKind` false), until P-2026-10-04-1131 places them.

## 4. Findings

### 4.1 The codec (R-SIM-123..126, R-SIM-128)

- `boardCodec.ts:162-169`, verbatim: `id: d.id, kind: d.kind, cell: [d.cell[0], d.cell[1]], label: d.label, binding: …, ...(d.kind === 'clock' ? { period: d.period ?? CLOCK_PERIOD_DEFAULT } : {}),`. New device fields go after `period`, in the order `span`, `style`; the board's fields after `devices`, in the order `theme`, `accent`, `cols`. Each is written only when it differs from its default (§7, D2).
- `boardCodec.ts:47`: `export const BOARD_COLUMNS = 4;`, read by `onGrid` (`:142-144`) and by the editor's grid (`SimBoardEditor.tsx:360`, `gridTemplateColumns: repeat(${BOARD_COLUMNS}, 1fr)`). `onGrid` gains an optional `cols`; the decoder reads `cols` before the devices so that their cells are checked against it.
- `boardCodec.ts:213` and `:224`: `const cells = new Set<string>();` and `if (cells.has(cell.join(','))) return device(\`${d.id}: the cell is taken by an earlier device.\`);`. With spans the set holds every covered cell, and the same defect fires when any covered cell is taken (R-SIM-125).
- `boardCodec.ts:124-128`: `BoardDefect.code` is `'key' | 'device' | 'binding'`. No consumer outside the tests reads it (system grep of `.code` under `sim/`: the hits are other defect types, `simBridge.ts:535-542`, `simRolesDraft.ts:403`, `simStateUsage.ts:81`). Rule 11 allows only optional properties on an exported interface, so a dropped field is reported with an optional `field` and the existing codes (§7, D3).

### 4.2 Occupancy and the editor's drag (R-SIM-125)

- `simBoard.ts:302-308` `firstFreeCell` and `:311-321` `addDevice` scan `BOARD_ROWS × BOARD_COLUMNS` single cells; with spans the taken set is the covered cells, and the grid width the board's `cols`.
- `simBoard.ts:323-329`, verbatim: `/** A device moved to a cell; onto another device the two swap; off the grid, or unknown, nothing changes. */`. The swap is committed behaviour (rule 3). With spans: the target area must fit the grid; when it overlaps no other device the move happens; when the target cell is covered by exactly one other device and nothing else overlaps, the two swap only if the swapped board still fits and has no overlap; otherwise nothing changes (§7, D5).
- The editor's grid (P-2026-10-04-1131): `SimBoardEditor.tsx:156-158` computes the rows from `d.cell[1]` and finds a device by its anchor cell only (`at`), and `:360-403` draws one element per cell. With spans each tile needs `gridColumn`/`gridRow` spans, the covered non-anchor cells must not be drawn as empty drop targets, `lastRow` must count `cell[1] + h - 1`, and the column count must be the board's. Drops and arrow keys already go through `moveDevice` (`:162`, `:169`), so the refusal rules come for free.
- Variant B (P-2026-10-04-1131): `simBoardDevices.tsx:440` counts rows from `d.cell[1] + 1` and `:512` places a slot with `gridColumn: d.cell[0] + 1, gridRow: d.cell[1] + 1`; `SimBoard.scss:240-243` fixes `grid-template-columns: repeat(4, minmax(0, 1fr))` on `__front`, and `:233-236` the same on Variant A's `__grid`.

### 4.3 Where the event's label reaches a device (R-SIM-127)

- Without a run: `eventAlphabet` labels each event with the model view's label (`netCompile.ts:650`, `.map(id => ({ id, label: view.label ? view.label(id) : id }))`), stored in `ctx.events` (`simBoard.ts:156`).
- With a run: `run.alphabet.map(id => ({ id, label: objectLabel(lookup, id, stc?.eventIdentifier) }))` (`simBoard.ts:164`).
- A device reads it through `eventLabel(ctx, id)` (`simBoardFace.ts:143-145`) and `deviceName` (`:152-168`). So `suggestIcon(eventLabel(ctx, binding.event))` at face time follows a rename, and only an explicit `icon` is stored (R-SIM-127).

### 4.4 Byte identity of today's boards

- The four demo exports in `~/jjodel-demo-exports/` (`scene_1_DemoPEST`, `scene_2_DemoPetri`, `scene_3_DemoESM`, `scene_4_DemoFlowB`, `.jjodel` and `.json`) carry no `ioBoard`: system `grep -c ioBoard` gives 0 on all eight; positive control `grep -c DemoESM scene_3_DemoESM.jjodel` gives 1 [measured].
- The byte-identity test therefore runs on the fixtures of `boardCodec.test.ts` (`ALL`, `:22-37`, every kind and binding form, a clock with a period) and on the literal strings already pinned there (`:80-82`, `:117`).

### 4.5 `maxDisplayLength` (R-SIM-126)

- A Text display binds `configuration` or `expr`, a 7-segment `expr` (`boardCodec.ts:93-94`). The configuration shows the marked states joined by `, ` with `×n` for tokens (`simBridge.ts:963-968`); the decision asks for the longest state label, so the join of two regions can exceed it: the face then uses the cell width, as for an unknown domain.
- An expression has a known domain only when it is one state read `X.[attr]` of a declared attribute: `model`/`self` name the globals (`ctx.modelId`), another identifier names the element whose `ctx.nameOf` is that identifier; `ctx.attrs` and `ctx.ivars` carry the domains (`simBoard.ts:116-123`). Anything else is `null` (§7, D6).

### 4.6 Room beside the rail (H5)

- `SimBoard.scss:40-41`: `width: 400px; max-width: calc(100% - 584px - var(--jj-canvas-right-inset, 0px) - 234px);`. Report 2026-10-03 H1: the band from x 584 to 956, 372 px with the rail open at 1600 px.
- Per column on Variant B today: body padding 12 + 12 (`SimBoard.scss` `&__body`, `padding: 8px 12px 12px`), front padding 12 + 12 and gaps of 10 (`:241-244`) leave 400 − 48 − 30 = 322 px for 4 columns, 80.5 px each. At that width, 6 columns need 6 × 80.5 + 5 × 10 + 48 ≈ 581 px, 8 columns ≈ 762 px [inferred from the SCSS, not measured]. Neither fits 372; R-SIM-132's floating window over the canvas holds.

### 4.7 Variant B's palette and D-UI-16

- `SimBoard.scss:20-31`: the fixed slate palette `$sim-board-metal-top: #334155;` … `$sim-board-lcd-ink: #1f2a12;`. Graphite is these values unchanged.
- The card's chrome (header, toolbar, foot) reads app tokens in both skins (`SimBoard.scss:33-60`): it is application UI and stays light (D-UI-16). The theme class belongs on the front panel's root, not on `.sim-board`.
- D-UI-15 is not on this branch: `grep -c D-UI-15 docs/decisions.md` finds no row (only the two prompts cite it); positive control `D-UI-14` gives 1. The row is `18a861da7` on `alfonso-frontend-jjtl` (`git merge-base --is-ancestor` false for HEAD) [measured].

### 4.8 The icon dictionary against the installed set

- The candidate names of R-SIM-127 (`play-fill`, `stop-fill`, `x-lg`, `check-lg`, `pause-fill`, `plus-lg`, `dash-lg`, `arrow-counterclockwise`, `coin`, `lock-fill`, `unlock-fill`, `door-open`, `door-closed`, `stopwatch`, `lightbulb`, `power`, `fire`, `snow`, `thermometer-half`, `bell`, `skip-forward-fill`, the four `arrow-*`, `key`, `cup-hot`, `droplet`, `fan`, `hourglass-split`, `cart`, `toggle-on`) are all keys of the installed JSON: the filter of missing names returned `[]` over 2078 keys [measured]. The test of R-SIM-127 pins the same check on the final dictionary.

## 5. The decisions of P-2026-10-04-1131 against the code

- R-SIM-130: holds. Graphite keeps `SimBoard.scss:20-31`; Variant B reads no token (H7).
- R-SIM-131: holds; the face needs the event's label, which `deviceFace` already has (§4.3).
- R-SIM-132: holds; required by H5. The window can reuse the card's foot (`simBoardDevices.tsx:519-533`).
- R-SIM-133: partly. «Each input device … a key press fires the device as a click does»: a Slider has no click (`simBoardDevices.tsx:132-150`) and a Keypad has twelve keys (`:156-183`). Q2. The icon picker's lazy import holds (H4).
- Files that lane will touch, as its prompt expects: `SimBoard.scss`, `simBoardDevices.tsx`, `SimBoardEditor.tsx`, `SimBoardEditor.scss`, `simViewerPrefs.ts`, `SimulationPanel.tsx` (the window's mount beside the card, `:1174-1188`), a new `SimBoardWindow.tsx` (recommended: the card stays one component and the window a frame around it), and their tests.

## 6. Files this lane touches (Phase 2)

1. `frontend/src/model/simulation/boardCodec.ts`: themes, accent, cols, span, style, `silk` and `buzzer`, covered-cell occupancy, defects per field.
2. `frontend/src/components/editor-v2/sim/simBoard.ts`: occupancy by span with `cols` in `firstFreeCell`, `addDevice`, `moveDevice`; `setSpan`, `setStyle`, `setBoardTheme`, `setBoardCols`, `setAccent`; `maxDisplayLength`; silk and buzzer in `DEVICE_LABELS`, `resolveDevice`, captions and the nuXmv table.
3. `frontend/src/components/editor-v2/sim/simBoardFace.ts`: the silk's face (never flagged), the buzzer read as the LED.
4. `frontend/src/components/editor-v2/sim/simBoardIcons.ts` (new): `eventWords`, `suggestIcon`, `suggestKeys`.
5. Tests: `frontend/src/model/simulation/__tests__/boardCodec.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simBoard.test.ts`, `simBoardFace.test.ts`, `simBoardIcons.test.ts` (new).
6. With Q1 adopted: `SimBoardEditor.tsx` and `simBoardDevices.tsx`, two map entries each.
7. Docs: `docs/decisions.md` (D-UI-16, R-SIM-123..129), this report, the prompt's Status, `docs/log-inbox/simulation.md`.

More than five code files (rule 19), all in the DOVE by directory and kind except item 6; listed here as RC-11 asks.

## 7. Decisions taken (unattended)

- D1. D-UI-16 is written right after the D-UI-14 row, where D-UI-15 sits on the trunk; the merge into the trunk places D-UI-15 before it (expect a hunk at that point of `docs/decisions.md`).
- D2. A default is never written, whether the record holds it explicitly or not (`theme` graphite, `cols` 4, `span` [1, 1], `shape` key and round, `iconMode` both, `size` M, `color` green): the same board gives the same string. Fields whose absence means «suggested» or «the theme's» (`role`, `icon`, `key`, `face`) are written whenever present. An empty `style` is not written.
- D3. A field the decoder drops keeps its device (or the board) and is a defect with the existing codes, `device` with the device's index or `key` with `null` for a board field, plus a new optional `field` naming what was dropped (rule 11: no change to the union).
- D4. A span whose value is out of its domain is a dropped field; a valid span whose cells leave the grid or overlap an earlier device drops the device, as the off-grid and cell-taken defects do today.
- D5. `moveDevice` keeps its swap when the swapped board fits and has no overlap, otherwise refuses; `setSpan` refuses off grid or overlap; `setBoardCols` refuses a narrowing while a device covers a removed column; `setStyle` refuses the whole change when one field is not valid for the kind, and an explicit key another device already holds.
- D6. `maxDisplayLength` reads a domain only from one `X.[attr]` read of a declared attribute; a boolean is 5 (`false`); the configuration is the longest place label.
- D7. Two explicit equal keys: the decoder drops the second's `key` with a defect, and `suggestKeys` treats a duplicate it is given the same way.

## 8. Decisions awaiting Alfonso

- Q1 only, if the chat reads the widening of `DeviceKind` as RC-26 item 2 (an exported-interface change that breaks consumers outside the lane). Recommended reading: the consumers are the chained lane's files, so the chat answers.

## 9. Dependencies and risks

- The intermediate commit of this lane shows Silkscreen and Buzzer in the editor's palette with placeholder faces until P-2026-10-04-1131 lands; no merge happens in between (the chain runs in this worktree).
- `docs/decisions.md` will conflict at the D-UI rows on merge into the trunk (D1).
- `suggestKeys` and `suggestIcon` read the event's label as the panel shows it, which is the event identifier's value when the role binds one (`objectLabel` with `eventIdentifier`), else the object's name.
