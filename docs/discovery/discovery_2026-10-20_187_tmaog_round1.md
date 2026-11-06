# Discovery — #187 and #186 after @tmaog's test (Phase 1)

- **Prompt-ID**: P-2026-10-20-1123 (`docs/prompts/claude_2026-10-20_1123_prompt_187_tmaog_round1.md`), chat `C-2026-10-14-1020`, director Juri.
- **Session**: 135e6d13-08a8-47d6-98ce-28b3f51cb8c5 (the id `lane-run` keeps in the lane folder, `session.txt`); resumed once on 2026-10-21 after the account's monthly spend limit, no work lost.
- **Tree**: `/Users/juridirocco/development/jjodel-187b`, branch `fix/187-tmaog-round1`, HEAD `850d50359`, clean; no tracked file under `frontend/` edited.
- **Executor**: Anthropic Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

## 0. Answer in brief

The five points can be built in the files the prompt lists, with no edit of `jjform/`, `components/editor-v2/`, `formWrite`,
`InstanceDetail.tsx` or the core. Probe `_tmp_187b_probe.ts` `MODE=before` on `850d50359`, through the launcher on 3187: **24/24 PASS,
0 page errors** (run 4; runs 1-3 failed on the probe's own route, §4.9). BEFORE table: `~/.jjodel-lanes/P-2026-10-20-1123/187b_before.json`.

What the measures say (all on the untouched code):
- **R-CFG-6**: the extended level is the subject's compositions at depth 0 only (`PanelComponents.tsx:378`). After «open» on PhA its
  child StepA is a simplified card with no Expand (C1); every reference, at every depth, is a compact card or row (B1, C1, D1, D3).
- **R-CFG-7**: no single-reference card carries a × (E1); «(none)» only where the lower bound is 0. The core accepts the clear of a
  REQUIRED single reference: `clearValue(Scenario_2, 'goal', 0)` returns ok and changed, the slot keeps a hole, G3 stays in the model,
  and the validation then warns «reference "goal" has 0 links but min is 1» (F2, F3). No `jjform` edit is needed.
- **Save** has the same class and computed background in «Saved» and «Unsaved» (G1-G3). **The remembered instance**: none, on the
  overlay and on the page (H1, K4). **The window**: «Done» only, no arrows; the keyboard arrows wrap; Escape and × close unsaved (I1-I4).
- **Cost**: an inline element card costs 176 ms at the first expansion and about 18 ms more per card already open (379 ms at the
  12th, dev build, J1): every panel render re-renders every open card.

Recommendation: Phase 2 in four code steps, eight files (§7): (1) `canUnlink` in `panelModel` with its test, the × and «(none)»,
Save's look; (2) R-CFG-6 in `PanelComponents` and its stylesheet; (3) the remembered instance in `ConfiguratorTab`; (4) Cancel and
the arrows in `EndpointsWindow`. Step 0 adds one cost arm and re-runs BEFORE on the untouched tree.

Decisions awaiting Juri (RC-26 list): **none**. No critical-zone edit, no exported interface changed (one export added to
`panelModel`), no ratified row amended (R-CFG-7 is the Configurator's; R-REF-3 still binds the Data Manager), nothing deleted.

Questions (detail in §6):
1. Rows of a multi-valued reference: collapsed by default or open?
   Recommended: collapsed, each row expands on its chevron, as compositions do today (J1); the mockup's Antonio is a row the user opened.
2. The mockup's «+ New Goal» button under a filled single card.
   Recommended: no second button; «+ New» stays in the picker's foot, which already replaces at the row's index (R-REF-4).
3. A target shown twice in one body (teacher and cohost both T1), or a reference to the element on screen itself.
   Recommended: twice, both extended, the duplicate field ids declared; a self-reference keeps the compact card.

## 1. Hypotheses under test

- **H1** — R-CFG-6 is a change of the panel's depth rule, with no edit of `jjform/nav`. **Holds**: the panel calls `rendersInline`,
  it does not need to change it (§4.1, §5.1).
- **H2** — A remove on a required single reference needs `jjform/refSlot` or `formWrite` edited. **Falsified**: the rule can be the
  panel's, and the write it calls is accepted by the core on a 1..1 slot (§4.4).
- **H3** — The validation reports a required single reference left empty. **Holds with the model canvas mounted** (F3, a warning).
  Not measured on a consumer page without a canvas (#167, §8).
- **H4** — Save already changes its look between «Saved» and «Unsaved». **Falsified**: only the status text changes (§4.5).
- **H5** — Extending every reference target costs nothing measurable. **Falsified**: each open card adds about 18 ms to every panel
  render in the dev build (§4.8); the multi-valued rows have to stay collapsed by default.

## 2. Objective

Phase 1 of P-2026-10-20-1123: measure what the Configurator panel and the Endpoints window do today on the five points of R-CFG-6..9,
design each change in the lane's files, and plan Phase 2 in steps.

## 3. Files read

- Rules: `CLAUDE.md` (rules 1-11, 19, 20; §3.1, §5, §6, §8, §17, §21), `frontend/src/styles/CLAUDE.md`, `docs/PROTOCOL.md` (whole),
  `docs/decisions.md` (RC-17, RC-21, RC-25..28, RC-48; R-REF-3, R-REF-4; R-CFG-1..9 whole), `docs/claude-code-log.md` (head),
  `docs/log-inbox/configurator-panel.md` (whole).
- Reports: `docs/discovery/discovery_2026-10-14_187_configurator_panel.md` (whole), `docs/discovery/discovery_2026-10-14_186_endpoints.md`
  (§0, §1, outline).
- Issues: #187 and #186, the last three and two comments (@tmaog's test of 2026-10-18 and 2026-10-17); `request.md` of the lane folder.
  Mockups `~/.jjodel-lanes/assets/166/187r_1_inside_scenario.png`, `187r_2_phase_opened.png`, `187r_3_expected.png` (its three blue
  notes cropped and enlarged).
- Code, whole: `frontend/src/components/environment/configurator/ConfiguratorPanel.tsx`, `PanelFields.tsx`, `PanelComponents.tsx`,
  `ComponentPicker.tsx`, `panelModel.ts`, `__tests__/panelModel.test.ts`, `configuratorPanel.scss`;
  `frontend/src/components/environment/ConfiguratorTab.tsx`; `frontend/src/components/project/EndpointsWindow.tsx`, `EndpointsWindow.scss`;
  `frontend/src/jjform/refSlot.ts`.
- Code, sections: `jjform/nav.ts:1-140`; `editor-v2/hooks/multiDraw.ts:99-126` (`navStepOf`, `childrenIn`);
  `editor-v2/viewpoint/ir/formWrite.ts:192-232`, `:340-376`; `editor-v2/viewpoint/ir/useIRFormView.ts:40-112`, `irCrossDeps.ts:124-126`;
  `abstract/tabs/instanceManagerModel.ts:97-119`; `envgen/EnvGenWizardModal.scss:265-375`, `EnvGenWizardModal.tsx:175-225`;
  `pages/components/LeftBar.tsx:470-510`; `frontend/scripts/lane-run.mjs:1254-1340` (`probe`).
- Probes used as models: `frontend/scripts/smoke/_tmp_187_probe.ts` (fixture, helpers, the step-2 arms 877-1335), `_tmp_187_157b.ts`
  (header, panel reader), `_tmp_186_probe.ts` (window instruments 240-480), `_tmp_172_smoke.ts`, `README-probes.md`, `states.ts` (`link`).

## 4. Findings (measured, BEFORE, `_tmp_187b_probe.ts` run 4 on `850d50359`, port 3187)

Fixture MM187B = MM187 of `_tmp_187_probe.ts` plus: `Competency { code }`; `Goal.mapped 0..* -> Competency` (G1 holds C01..C12, @tmaog's
twelve competencies); `Phase.crew 0..* -> Learner` (PhA: L1, L4); `Scenario.cohost 0..1 -> Teacher` (Scenario_0: T1, the same target as
`teacher`); `Teacher.office 0..1 -> Room` (T1: R2); Scenario_2.goal = G3; Scenario_3.phases = Q01..Q12. Top-level types Scenario and
Teacher; role «Edu»: Learner read, Assessment read, Vault hidden. Asserted F0-F6, F4b. The model canvas is mounted (A0.canvas = 1), as
in `_tmp_187_probe.ts`, so the conformance producer runs.

### 4.1 Where the extended level lives (read)

`PanelComponents.tsx:376-378`: «The subject's children are cards with a body at the inline level; a card's own children, and every
child past that level, are simplified (#187 task 10).» / `const inline = via === null && rendersInline(depth);`. `rendersInline` is
`return depth < INLINE_DEPTH_LIMIT;` (`jjform/nav.ts:112-114`, the limit 1 at `:43`). `ObjectView` is mounted with `via={null}` for the
element on screen (`ConfiguratorPanel.tsx:395`) and with `via={{ id, key: ref.key }}` inside a card (`PanelComponents.tsx:424`).
References never get a body: `ReferenceSlot` draws a single target as `.cfg-panel__ref-card` (`:279-289`) and a multi-valued one as
`.cfg-panel__ref-list > .cfg-panel__ref-row` (`:291-312`).

### 4.2 What each component renders today (measured)

| arm | element on screen | components, one line each (markup, name, buttons; EXT = carries an element of its own) |
|---|---|---|
| B1 | Scenario_0, depth 0 | goal, teacher, cohost, vault, topic: `card` with Open and Choose; frozen: `card`, Open only; learners: 3 `row`s, Remove and Open, «Add target»; rooms: 1 `row`; assessment: `child-open` AsA **EXT** identity/attributes, 2 inputs, Delete and Open; phases: 2 `child` with Expand, Delete, Open, «Add Phase». Element views on screen: 2 |
| C1 | PhA after «open», depth 1 | mentor: `card` T2, Open and Choose; crew: 2 `row`s, Remove and Open, «Add target»; steps: `child` StepA, **Delete and Open, no Expand**, «Add Step». Element views: 1 |
| D1 | G1 after «open» | mapped: 12 `row`s C01..C12, Remove and Open, «Add target» |
| D3 | T1 after «open» | office: `card` R2, Open and Choose |
| K2 | Scenario_0, role Edu, page | as B1 minus vault (hidden); assessment `child-open` **EXT**, 0 inputs, Open only (Assessment read); learners rows keep Remove (an unlink is a write on Scenario_0, which the role edits) |
| K3 | PhA after «open», role Edu | as C1 |

So @tmaog's defect is measured as he reports it: the extended level does not follow «open» (C1: StepA simplified, no Expand), and no
reference is ever extended (B1-D3). Screen 2 of his test is C1.

### 4.3 The mockup (read, `187r_3_expected.png`)

After «open» on Phase_0: goal, teacher and the learners are cards with IDENTITY, ATTRIBUTES and, where the class has references,
COMPONENTS; inside the goal card, MappedCompetencies is a list of simplified rows (name, two icons) and «+ Add target». Antonio is
expanded, Anita a row with a chevron. Its three notes, enlarged: «there is the select icon (arrow) because it is NOT a COMPOSITION so it
allows the search of the element»; under the goal card a button «+ New Goal», «it is "new" not "add" because goal is 0..1 or 1..1»;
«there is not "Components" section because iSQDProfile has no references». The mockup draws a trash on reference cards; R-CFG-2 and
#187 Q2 (accepted by @tmaog: «x risulta più logico») keep the × on references.

### 4.4 Single references: the remove, «(none)», the clear of a required one (measured)

E1, Scenario_0: no single card carries a remove (`removeOnCard: false` for goal, teacher, cohost, frozen, vault, topic). Picker rows:
goal `["G1","G2","G3"]` (no «(none)», lower 1); teacher and cohost `["(none)","T1","T2"]`; vault `["(none)","V1"]`; topic
`["(none)","M1"]`; frozen has no picker (changeable=false). E2, PhA.mentor 0..1: no ×, picker `["(none)","T1","T2"]`.

The rule that decides it, read: `refSlot.ts:99-103` — `if (writable && !reads.isLocked?.(value)) { if (single) actions.push('change');`
/ `// On a single-valued slot Remove is the write of «(none)»: a required one has neither.` / `if (!single || optional) actions.push('remove');`.
The panel reads it at four sites: the multi-valued row's × (`PanelComponents.tsx:299` `{row.actions.includes('remove') && (`), the
picker's «(none)» (`:347` `allowNone={!!row?.actions.includes('remove')}`), and the two handlers that re-read the slot at the click
(`:208` `if (row?.actions.includes('remove'))`, `:224` `if (now?.actions.includes('remove'))`).

F, the write the panel would call (feasibility of the layer below, P11: not the gesture, which does not exist yet):
`formWrite.clearValue(Scenario_2, 'goal', 0, true)` on a 1..1 slot holding G3 returned `{ ok: true, changed: true, reason: null }`; the
slot then holds one position and no pointer (the probe's reader prints `[null]`, a hole its `map` skipped); `G3` is still a `DObject`
in the store. `clearSlotValue` has no bound check of its own (`formWrite.ts:192-208`: `verdict = fresh.setValueAtPosition(index,
undefined, { isPtr });`). The panel's chip went from «1 warning» to «2 warnings», and the goal component shows «Object "Scenario_2":
reference "goal" has 0 links but min is 1» as a warning; the card reads «(none selected)» with its chevron. This is R-CFG-7's «a
required slot left empty is reported by the validation», measured with the canvas mounted.

### 4.5 Save (measured)

G1: in «Saved» and in «Unsaved» Save has class `cfg-panel__save`, `background-image: linear-gradient(rgb(100, 116, 139) 0%, rgb(71, 85,
105) 100%)`, white text, no border; G3 = true (identical). Only the status changes, `cfg-panel__status` → `cfg-panel__status
cfg-panel__status--unsaved`. G0 is the positive control (an edit of `title` turned the text into «Unsaved»); G2: Save changed the stored
`lastModified`. Read: `configuratorPanel.scss:103-116` (`&__save`, `background: var(--gradient-primary);` at `:110`), `:118-131`
(`&__delete`, the neutral look: `border: 1px solid var(--color-form-border)`, `background: var(--color-form-surface)`), `:100`
(`&--unsaved { color: var(--color-form-dirty-text); }`); `ConfiguratorPanel.tsx:368-371`.

### 4.6 The remembered instance (measured)

H1, overlay: Scenario → Scenario_0 (selected, panel on it) → Teacher: no row, «Select an instance, or create a new one.» → T1 →
Scenario: no row, the same hint → Teacher: no row. K4, the page (left column): the same. Read: `ConfiguratorTab.tsx:141-142`
(`// Clear the instance selection when the type changes.` / `useEffect(() => { setSelectedInstanceId(null); setCreateFailed(false); },
[selectedTypeId]);`), `:174` (`useEffect(() => { setNav(null); }, [selectedInstanceId]);`), and the #168 J4 effect at `:196-208`, which
is declared after the reset effects so that its own write comes last in the same commit (`:176-182`). `instancesOfClass` lists exact
instances of the class (`instanceManagerModel.ts:108` `if (d.instanceof !== classId) continue;`), so an instance of the selected type is
visible exactly when its type is in the role's type list.

### 4.7 The Endpoints window (measured)

I1: tabs `["Editable metaclasses*","Roles"]`; no other button beside the tablist (`tabArea: []`); footer `["Done|envgen-btn
envgen-btn--primary"]`; header close `Close|Close without saving`; focus on the selected tab. I2: ArrowRight once selects Roles, twice
wraps to Editable metaclasses (`EndpointsWindow.tsx:90` `const next = TABS[(index + TABS.length) % TABS.length];`). I4: with
`U.isProjectModified` true, Escape and the header × both close, stored `lastModified` unchanged, still modified; I3 per contrasto: «Done»
saves and closes. Read: `EnvGenWizardModal.tsx:187` already uses `envgen-btn envgen-btn--secondary` (the wizard's Back), styled at
`EnvGenWizardModal.scss:358-367`: Cancel needs no new class.

### 4.8 Cost of an inline element card (measured)

J1, Scenario_3 with twelve phases collapsed, each expanded in turn, the clock read after the one microtask in which React 18 flushes a
click's update (each entry carries `open: true`, the instrument's own control): 176.5, 187.4, 207.2, 227.0, 243.6, 262.9, 283.3, 301.2,
320.9, 337.9, 356.3, 378.8 ms; element views 1 → 13. The cost grows with the cards already open: an expansion re-renders every open
card. Read: the context value is rebuilt on every render (`ConfiguratorPanel.tsx:284` `const env: PanelEnv = {`), and `ObjectView` is
not memoized. Dev build (vite, React development): the absolute numbers are a dev upper bound; the slope is the finding. A first,
discarded instrument read the clock right after `click()` and printed about 1 ms, the render not included; run 3's numbers are void.

### 4.9 Method notes

Runs 1-3 failed on the probe, not on the code: with the model editor open the left bar is the editor's, which has no «Open Configurator»
(`LeftBar.tsx:496`); `_tmp_187_probe.ts` goes through the Data Manager's tab first, and run 3 did so. On the stand-alone page after the
reload a spinner covered the centre: run 3 waited 45 s for the row click and failed; run 4 read `["span.spinner-animated",
"div.loader-spinner","div.configurator__detail","div.configurator__body"]` on top of the page centre and drove the page by DOM clicks
(the same handlers). Observed, not investigated (§8).

## 5. Design per point

### 5.1 The extended level (R-CFG-6)

- `CompositionSlot`: `const inline = via === null;` — the element on screen extends its compositions at any depth; inside a card
  (`via` set) they stay simplified. `rendersInline` leaves the import list of `PanelComponents.tsx` (`jjform/nav` itself is not touched).
- `ReferenceSlot` with `via === null`: each target is a card with the composition's markup, `.cfg-panel__children >
  .cfg-panel__child` with `-head` and `-body`, the body an `ObjectView` of the target with `via={{ id: target, key: ref.key }}`, so its
  own components are simplified and an «open» from inside passes through it in the breadcrumb, as for a child (`drillTo`,
  `ConfiguratorPanel.tsx:168-183`; a cycle truncates, `nav.ts` `drillInto`). Head: name, then × «Remove from the list» where the rule
  allows (§5.2), «open», and on a single slot the chevron of the picker. A single filled slot is always open (as a single composition,
  `PanelComponents.tsx:397`); a multi-valued one lists rows collapsed, each with its expand chevron (Q1), then «Add target». The
  summary prints only while collapsed. The empty single card «(none selected)», a broken pointer, and a reference the view author hides
  (R-REF-6) keep today's compact markup; a target equal to the element on screen keeps the compact card (Q3).
- What a reference card lacks today to be one, read: a body (`:279-289` has none), an expand state, and a head that holds the picker
  (`togglePicker` anchors on `closest('.cfg-panel__ref-card, .cfg-panel__ref-list')`, `:179`; it gains `.cfg-panel__child-head`, so the
  picker opens under the card's head and not under a tall card).
- Expansion stays the panel's (`ConfiguratorPanel.tsx:223-232`, decision 1 of P-2026-10-14-1100's Phase 2). A composition child keeps
  its id as key; a reference row takes `ref:<owner>:<key>:<raw index>` through the same `isExpanded(key: string)`, so `PanelEnv`'s
  signature does not change (rule 11). The raw index is stable: a clear leaves a hole (R-FORM-7).
- Permissions are `ObjectView`'s own: a target of a `read` type renders its note and no input (K2's AsA: 0 inputs); a hidden type is
  filtered before any card (`PanelComponents.tsx:154`).
- The header's issues chip and `*` already sum every `ObjectView` on screen (`reportIssues`, `ConfiguratorPanel.tsx:235-252`): the
  reference cards join the sum, as the inline children did.
- The grid rule `&__component:has(.cfg-panel__child--open) { grid-column: 1 / -1; }` (`configuratorPanel.scss:230`) makes an open
  reference card span the row, as the mockup's goal and teacher.

### 5.2 The single remove (R-CFG-7)

`panelModel.ts`, pure: `canUnlink(ref: { upper: number }, row: { actions: readonly string[] }): boolean` — `row.actions.includes('remove')
|| (ref.upper === 1 && row.actions.includes('change'))`. On a single slot `refSlot` pushes `change` exactly when the viewer may write and
the value is not locked (`refSlot.ts:99-100`), so the rule adds the required single rows and nothing else: a changeable=false, derived,
role-locked or author-hidden row (actions `['open']`) stays without ×. It replaces the read at the four sites of §4.4 (equal to today on a
multi-valued row, by test); the × goes on every single card, compact ones included; «(none)» follows it. The write is unchanged:
`clearValue` at the row's raw index on the slot re-read at the click, never a delete (R-REF-4). `jjform/refSlot` is not edited, and the
Data Manager keeps R-REF-3.

Tests (first): multi row with remove → true; multi row without → false; a synthetic multi row with `change` only → false; single
optional (change, remove) → true; single required (change) → true; single locked or author-hidden (`['open']`) → false; single broken
required (change, no open) → true. Mutation bench: drop `ref.upper === 1 &&`; read `open` for `change`; drop the `remove` branch;
`return true`.

### 5.3 Save, the remembered instance, Cancel, the arrows

- **Save**: `className={`cfg-panel__save${projectModified ? ' cfg-panel__save--unsaved' : ''}`}`; the base rule takes the Delete's
  neutral tokens (`--color-form-border`, `--color-form-surface`, `--color-text-primary`), `&--unsaved` keeps `--gradient-primary` and
  `--color-text-inverse`. Tokens only (rules 27, 28). New class checked absent: `command grep -rn -- "cfg-panel__save--unsaved" src/`
  exit 1; control `cfg-panel__save` exit 0 (`ConfiguratorPanel.tsx:371`).
- **Remembered instance**: a `useRef<Record<typeId, instanceId>>` in `ConfiguratorTab`; an effect on `[selectedInstanceId]` writes the
  pair when both are set (it does not fire in the commit where only the type changed, so it never files an instance under the wrong
  type); the reset effect of `:142` selects the remembered id when it is still in `instances` and its type is not `hidden` for the role,
  otherwise null as today. The drill-in is not remembered (`:174` still clears `nav`). Session state: a ref, not persisted. The J4 effect
  keeps its last word in the commit (its write comes after the reset's, `:176-182`).
- **Cancel**: `<button type="button" className="envgen-btn envgen-btn--secondary" onClick={onClose}>` «Cancel», title «Close without
  saving», before «Done» in `envgen-footer__right`. No new class.
- **Arrows**: a wrapper `endpoints-window__tabbar` around the tablist (the tablist holds tabs only), ‹ before and › after, class
  `endpoints-window__arrow`, `aria-label` «Previous tab» / «Next tab», `bi-chevron-left` / `bi-chevron-right`, disabled at the first and
  last tab, moving selection and focus through `selectAt`. The `__tabs` margin moves to the wrapper. New classes checked absent:
  `command grep -rn -- "endpoints-window__arrow" src/` exit 1, `"endpoints-window__tabbar"` exit 1; control `endpoints-window__tab` exit 0.
  The keyboard keeps its wrap (I2); the arrows stop at the ends, as the prompt says.

## 6. Questions (each with its recommendation)

1. **Multi-valued reference rows, collapsed or open.** The mockup shows Antonio open and Anita collapsed; R-CFG-6 says «rows that expand
   into that card». Twelve open cards cost about 380 ms per panel render in the dev build (J1), and @tmaog's goal holds twelve
   competencies. Recommended: collapsed, each row expands on its chevron, as compositions do today.
2. **«+ New Goal» under a filled single card** (the mockup's note 2). The picker's foot already offers «+ New», which replaces at the
   row's raw index (`newTargetAt`, `panelModel.ts:164-173`). Recommended: no second button; «+ New» stays in the picker.
3. **One target twice in one body, and a self-reference.** Scenario_0's teacher and cohost both hold T1 (the fixture's case; @tmaog's
   teacher and learners share a type). Two extended cards of T1 render the same field ids twice (`ir-field-<slotId>`, a title's `<label
   for>` then resolves to the first) and share one cross-deps entry, which the first to unmount clears (`useIRFormView.ts:108`).
   Recommended: both extended, the duplicate ids measured and declared in the entry; a reference to the element on screen itself keeps
   the compact card (its fields are already the body).

## 7. Phase 2 plan

Eight files across the steps (rule 19, more than five; each with what changes):

| file | change | step |
|---|---|---|
| `configurator/panelModel.ts` | `canUnlink` | 1 |
| `configurator/__tests__/panelModel.test.ts` | its tests, first | 1 |
| `configurator/PanelComponents.tsx` | the rule at the four sites, × on single cards (1); the extended level, reference cards, expansion keys, picker anchor, docblock (2) | 1, 2 |
| `configurator/ConfiguratorPanel.tsx` | Save's modifier class | 1 |
| `configurator/configuratorPanel.scss` | Save neutral and `--unsaved` (1); the open reference card if the composition's rules do not cover it (2) | 1, 2 |
| `environment/ConfiguratorTab.tsx` | the remembered instance | 3 |
| `project/EndpointsWindow.tsx` | Cancel, the arrows, docblock | 4 |
| `project/EndpointsWindow.scss` | the tab bar and the arrows | 4 |

Not edited: `PanelFields.tsx`, `ComponentPicker.tsx` (its `allowNone` prop already carries «(none)»). Closure, not committed until the
GO (RC-17): `docs/log-inbox/configurator-panel.md`, this prompt's `Status` line.

**Step 0** (no commit): add to `_tmp_187b_probe.ts` arm J2, the cost of one expansion of PhA on Scenario_0 (the panel's re-render with
today's 2 element views; after R-CFG-6 about 8), and the `MODE=after` arms; re-run `MODE=before` on the untouched tree; gates' baseline.
The regression copies of `_tmp_187_probe.ts` and `_tmp_187_157b.ts` read their BEFORE from `~/.jjodel-lanes/P-2026-10-14-1100/` and
write their tables and screenshots into this lane's folder (both write into that lane's folder today, `_tmp_187_probe.ts:33,1361`,
`_tmp_187_157b.ts:17`).

**Step 1** — `fix(#187): a remove on every single reference, Save's look (P-2026-10-20-1123)`. Tests first, bench in the message. Probe
arms: a × on goal, teacher, cohost, vault, topic and mentor, none on frozen; goal's picker offers «(none)»; × on goal empties the slot
(raw `[HOLE]`), G1 still in the model, the warning of F3; × on teacher equals C2 of BEFORE (`[T1]` → `[HOLE]`); role Edu: × on a
single reference of an editable source, none where the source is `read`; Save's class and computed background differ between the two
states, the gradient only in «Unsaved».

**Step 2** — `fix(#187): the element on screen extends its components (P-2026-10-20-1123)`. Probe arms: after «open» on PhA, mentor
is an open card with Identity, Attributes and inputs, crew rows collapsed and expandable, StepA a child card with Expand and its body on
expansion; after «open» on G1, twelve collapsed rows; at depth 0 goal, teacher, cohost, frozen, vault and topic open cards, learners
and rooms collapsed rows; inside each card the components are simplified (no nested body); role Edu: a Learner card has the note and 0
inputs, vault absent; picker gestures C1-C6, C9, D3, D4 equal BEFORE; J1, J2 against BEFORE; duplicate ids of T1 counted (Q3).

**Step 3** — `fix(#187): the Configurator remembers the instance of each type (P-2026-10-20-1123)`. Arms: Scenario → Scenario_0 →
Teacher → T1 → Scenario shows Scenario_0, Teacher shows T1, overlay and page; per contrasto Scenario_0 deleted while on Teacher → back
on Scenario no row; J4 (`CONFIGURATOR_SELECT_INSTANCE`) still lands on its target.

**Step 4** — `feat(#186): Cancel and arrows in the Endpoints window (P-2026-10-20-1123)`. Arms: footer «Cancel», «Done»; Cancel with
unsaved changes closes, stored `lastModified` unchanged, still modified; per contrasto «Done» saves; ‹ disabled on the first tab, ›
moves to Roles and is then disabled, ‹ back; each `aria-label`; ArrowRight still wraps; Escape and × unchanged; the Endpoints arms of
`_tmp_186_probe.ts` (its port check reads 3186: the copy run here is adapted to 3187, named).

Regression on every step: `_tmp_187_probe.ts` `MODE=after STEP=2`, its 78 arms, adapted only where R-CFG-6 changes what they read, each
named: S2.8c (frozen read under `cards`), S2.10a (goal under `cards`, its summary, learners under `rows`), S2.13a (at depth 1 «its
children are simplified cards»), S2.14c (learners `rows` under the role), and the helpers `pOpen`, `pRemove` and the L1 locator of the
D arm (`:ref-list > .cfg-panel__ref-row`); `_tmp_187_157b.ts` 18 arms; the smoke through `_tmp_172_smoke.ts`.

Gates per step, foreground, from `frontend/`, each on its complete output with its exit status: `npm run typecheck` (exit 0, RC-48),
`npm run test` (the nine files of §17 red at import, nothing else), `npm run build`, `npm run check:docs`, `npm run check:addonly`,
`npm run check:scripts`.

Visual checklist for Juri (prepared at the closure; port 3187, setup by the probe's fixture or `_tmp_172_setup.js`): (1) «open» on a
composed element, its components extended; (2) a referenced element opened, its multi-valued rows; (3) × on a required single
reference, the warning; (4) Save in both states; (5) type A → X → type B → type A; (6) the window's Cancel and arrows.

## 8. Dependencies and risks

- **Render cost** (§4.8): with R-CFG-6 Scenario_0 holds about 8 element views instead of 2. J2 measures it; a memo of `ObjectView` is
  not proposed (rule 6) unless the measure says the panel got slower in a way a user feels.
- **Duplicates** (Q3): the same object extended twice shares `form:<id>` and its field ids. Measured in step 2, declared.
- **#167**: the warning of an emptied required reference was measured with the model canvas mounted; a consumer page that mounts no
  canvas may show no warning, as for every other problem (the #167 body).
- **The other lane**: `feat/186-customize-element` (`P-2026-10-17-1053`) edits the panel's files after this lane is merged (merge order
  fixed). Step 2 rewrites `ReferenceSlot`'s render, the largest hunk it will meet.
- **The spinner on the stand-alone page** (§4.9): after a reload of the `&profile=` link on this fixture, `.loader-spinner` sat on top
  of the page centre for more than 45 s in run 3. Not this lane's, not investigated; a ticket for the chat to weigh.

## Decisions taken (unattended)

Within the lane's perimeter, each to be reviewed at the visual check:
1. Reference cards at the extended level use the composition's card markup (`cfg-panel__child`, head and body), with × «Remove from the
   list» in place of the trash (R-CFG-2); references never delete.
2. The × goes on every single card, compact ones at the level below included; «(none)» follows the same rule.
3. `canUnlink` is read at all four sites, multi-valued rows included (equal to today there, by test).
4. A reference the view author hides (R-REF-6), a broken pointer and an empty single slot keep today's compact markup.
5. The picker of an extended card anchors on the card's head.
6. Expansion keys: a child's id; `ref:<owner>:<key>:<raw index>` for a reference row; `PanelEnv` unchanged.
7. The issues chip and `*` include the reference cards on screen.
8. Save in «Saved» takes the Delete's neutral look; the gradient only in «Unsaved»; modifier `cfg-panel__save--unsaved`.
9. The remembered instance is the instance only, not the drill-in; checked by presence in the type's list and the role's permission.
10. Cancel uses the wizard's `envgen-btn--secondary`; the arrows sit outside the tablist, disabled at the ends; the keyboard keeps its wrap.

## Decisions awaiting Juri

None of the RC-26 list: no critical-zone file is edited, no exported interface changes (`canUnlink` is an added export), no ratified
R- row is amended (R-CFG-6 is provisional; R-CFG-7 is the Configurator's and R-REF-3 still binds the Data Manager), nothing is deleted,
the MODELS demo is not touched, the push is not this lane's. The questions of §6 carry their recommendations (RC-21).
