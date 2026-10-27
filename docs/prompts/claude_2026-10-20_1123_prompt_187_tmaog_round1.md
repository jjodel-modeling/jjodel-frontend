# Prompt: #187 and #186 after @tmaog's test: the extended level at any depth, a remove on single references, Save, the remembered instance, Cancel and arrows

Prompt-ID: P-2026-10-20-1123
Chat: C-2026-10-14-1020
Lane: full (more than three files; a visual check)
Depends: P-2026-10-14-1100, P-2026-10-14-1101
Front: standalone-editor
Request: https://github.com/jjodel-modeling/jjodel-frontend/issues/187 (and #186; Juri's words in chat are `request.md` in the lane folder, RC-43)
Status: eseguito 2026-10-27 · lane configurator-panel · 4bdf69ed6 · verifica visiva passata 2026-10-27
Limite: 45 minuti per la Fase 1, 90 minuti per ogni passo della Fase 2

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the
RC-26 list, the visual GO), Juri decides for this lane.

Critical zone: **none is edited.** The panel imports from `components/editor-v2/viewpoint/ir/` and `jjform/`;
importing is not editing. An edit under `components/editor-v2/`, of `InstanceDetail.tsx`, of `jjform/`, of
`joiner/` or of the core is a `question`, never a step. No Layer Impact Report is owed while that holds.

Worktree: `/Users/juridirocco/development/jjodel-187b`, branch `fix/187-tmaog-round1`, cut from `staging` at
`26c2814ef`; `frontend/node_modules` is a symlink to the main tree's (P14: do not remove it). Before anything else:
`pwd` is that worktree, the branch is `fix/187-tmaog-round1`, `git log -1` is the commit that adds this file
(subject `docs: add prompt P-2026-10-20-1123, #187 #186 after @tmaog's test`), `git status` is empty; otherwise
stop with `Outcome: blocked`.

Another lane is in Phase 1 on `feat/186-customize-element` (`P-2026-10-17-1053`, read-only for now); its Phase 2
will edit the panel's files after this lane is merged and it has taken the trunk. Merge order fixed: this lane first.

Two phases (P4): Phase 1 read-only on tracked code, the report, `Outcome: hard-stop`; Phase 2 only after a
message `[P-2026-10-20-1123] GO` that carries the decisions and the confirmed file list.

## Lane discipline

Every reply of this session opens with `[P-2026-10-20-1123 · session <id>]` (`session unknown` if you cannot
see it, never invented). Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in one
line: `Recommended: <one line>`. A message with another Prompt-ID, or with none, is not acted on (P13).

## Context (read by the chat on `26c2814ef`: verify, do not trust; re-measure where a number counts)

@tmaog tested the two merged lanes on beta: #187 issuecomment of 2026-10-18, #186 of 2026-10-17
(`gh issue view 187 --comments`, `gh issue view 186 --comments`, his last comment on each). Everything passed but
the points below. **The decisions** are **R-CFG-6..9** in `docs/decisions.md` (`26c2814ef`): read them whole.

His three screenshots and his mockup of the expected behaviour are outside every tree:
`~/.jjodel-lanes/assets/166/187r_1_inside_scenario.png` (Phase_0 inside Scenario: extended, its goal / teacher /
learners / subphases simplified), `187r_2_phase_opened.png` (Phase_0 opened with «open»: its components still
simplified, the defect), `187r_3_expected.png` (the expected «Phase properties»: goal, teacher and each learner as
cards with Identity, Attributes and their own Components simplified; read its blue notes).

Read by the chat on the code of `26c2814ef`:
- `components/environment/configurator/PanelComponents.tsx:377-378`: «and every child past that level, are
  simplified (#187 task 10)» / `const inline = via === null && rendersInline(depth);` — the extended level is
  tied to depth 0 (`rendersInline` of `jjform`), and only compositions get it; references render as compact cards.
- remove on a row: `PanelComponents.tsx:299` `{row.actions.includes('remove') && (`, the actions coming from
  `jjform/refSlot` (R-REF-3: on a single-valued reference only when its lower bound is 0).
- the selected instance is cleared on a type change: `ConfiguratorTab.tsx:142`
  `useEffect(() => { setSelectedInstanceId(null); setCreateFailed(false); }, [selectedTypeId]);`
- Save in the panel's header: `ConfiguratorPanel.tsx:369-371` (`saveStatus(projectModified)`, `cfg-panel__save`).
- the Endpoints window: `components/project/EndpointsWindow.tsx` (tabs, «Done» at `:81-85`, Escape `:67`, the
  close button `:116` «Close without saving»).

## COSA

1. **The extended level at any depth** (R-CFG-6, @tmaog's [ISSUE] on #187 points 5–6): whatever element is the
   body of the panel (the selected row, or the element reached by «open»), each element held by its components,
   references and compositions alike, is a card with its Identity and Attributes editable and its own Components
   simplified (name and summary); the card keeps its header controls (open; remove or delete by kind; the picker
   on a reference). A multi-valued component lists its elements as rows that expand into that card (his learners:
   Antonio expanded, Anita a row). The level below stays simplified. After «open» on Phase_0, Phase_0's goal,
   teacher and learners render as the mockup `187r_3_expected.png` shows. The permissions stay as they are: a
   card of a type the role reads has no input, a hidden type is not shown.
2. **A remove on every single-valued reference** (R-CFG-7): the × «Remove from the list» on the card of a single
   reference, required ones included; it unlinks (`clearValue` at the row's raw index, the slot re-read at the
   click, R-REF-4) and never deletes. `jjform/refSlot` is not edited: the panel decides this gesture itself, with a
   pure rule in `panelModel.ts` and its test. The picker's «(none)» follows the same rule.
3. **Save changes colour while the project has unsaved changes** (R-CFG-9): the panel's Save reads as the primary
   action when the status is «Unsaved», as the neutral one when «Saved»; tokens only (rules 27, 28).
4. **The remembered instance** (R-CFG-9, @tmaog's [ADDITIONAL FEATURE]): `ConfiguratorTab` remembers, per type,
   the instance selected last; back on that type, it is selected again if it still exists and the role still sees
   it (otherwise none, as today). Session state, not persisted.
5. **The Endpoints window** (R-CFG-8): «Cancel» beside «Done», closing without saving as Escape and the close button
   do; arrows ‹ › beside the tabs, moving to the previous and next tab (disabled at the ends), with an
   `aria-label` each, beside the click and the keyboard that already work.

Not this lane: the per-role presentation and «Customize element» (`P-2026-10-17-1053`), the `&role=` parameter
(R-CFG-9: it stays `&profile=`), #188.

Acceptance, read from the DOM: after «open» on a composed element, every element of its components is a card with
an Identity section and editable inputs (none for a `read` type), its own components as name + summary; a
multi-valued component as rows that expand; a × on every single-valued reference card, which empties the slot and
leaves the target in the model; Save's class or computed background differs between «Unsaved» and «Saved»; type A →
instance X → type B → type A shows X; «Cancel» closes and leaves `lastModified` unchanged; the arrows move the tab.
Everything else the probe of P-2026-10-14-1100 measured stays equal (its 78 arms, the Data Manager unchanged).

## Phase 1: discovery (read-only on tracked code)

1. Read the root rules file (rules 1-11, 19, 20; §3.1, §5, §6, §8, §17, §21), `frontend/src/styles/CLAUDE.md`,
   `docs/PROTOCOL.md` (P4, P6, P8, P9, P11, P12, P13, P16), `docs/decisions.md` (RC-17, RC-21, RC-25, RC-26, RC-48;
   R-REF-3, R-REF-4; R-CFG-1..9), the Phase 1 reports of P-2026-10-14-1100 and P-2026-10-14-1101, and the whole of
   `ConfiguratorPanel.tsx`, `PanelFields.tsx`, `PanelComponents.tsx`, `ComponentPicker.tsx`, `panelModel.ts` and its
   test, `configuratorPanel.scss`, `ConfiguratorTab.tsx`, `EndpointsWindow.tsx` and its stylesheet, `jjform/refSlot.ts`.
2. **The probe**, `frontend/scripts/smoke/_tmp_187b_probe.ts` (gitignored). Models, copied by the chat into this
   worktree: `_tmp_187_probe.ts` (the panel's fixture MM187, its role, its helpers, the 78 arms), `_tmp_187_157b.ts`
   (the #157 step B verifier on the panel), `_tmp_186_probe.ts` (the Endpoints window and its menu),
   `_tmp_172_setup.js`, `_tmp_172_smoke.ts`; `README-probes.md`. `MODE=before` measures on the untouched code:
   after «open» on a composed element and on a referenced one, what each component renders (card or summary,
   inputs or none); the rows of a multi-valued component; which single references carry a remove; Save's class and
   computed background in both states; the instance shown after type A → X → type B → type A; the window's buttons.
   Run it only through the launcher, in the foreground:
   `node frontend/scripts/lane-run.mjs probe . frontend/scripts/smoke/_tmp_187b_probe.ts --port 3187 --id P-2026-10-20-1123`.
   Count failures with `const r = await …; failures += r;` (`npm run check:scripts`).
3. **The extended level**: where the depth rule lives in the panel, how the extended card is built for a composition
   today and what a reference card lacks to be one, how the picker and the remove sit in the extended card's
   header, how expansion state is kept (the panel holds it, decision 1 of P-2026-10-14-1100's Phase 2), and the
   cost of rendering one extended card per element of a long multi-valued reference (12 competencies on his
   screen). Recommendation.
4. **The single remove**: the rule in `panelModel.ts` (signature, tests, mutation bench) and where it replaces the
   `row.actions` read for single references only; what the picker's «(none)» does today.
5. **Save, the remembered instance, Cancel, the arrows**: markup, class names (new ones checked absent with
   `command grep` and a positive control, P2), tokens, keyboard and `aria-label`s.
6. **Phase 2 plan in steps**, per step: files (rule 19: more than five, each with what changes), tests and bench,
   probe arms, gates, visual checklist items.
7. Write `docs/discovery/discovery_2026-10-20_187_tmaog_round1.md`: it opens with `## 0. Answer in brief` (at most
   40 lines: the answer, the recommendation, the decisions awaiting Juri, the questions each with its
   `Recommended:` line) and closes with «Decisions taken (unattended)» and «Decisions awaiting Juri» (items of the
   RC-26 list only). Do not write rows in `docs/decisions.md`: the chat writes them.
8. Commit the report alone: `docs(#187): Phase 1 report after @tmaog's test (P-2026-10-20-1123)`.
   `Outcome: hard-stop`.

## Phase 2: implementation (after `[P-2026-10-20-1123] GO`)

The GO carries the decisions and the confirmed file list. For each step:

1. Baseline of the gates on your tree before the first diff.
2. Tests before code for `panelModel.ts`; the components do not import under node, so no source-text test (root
   rules file §5): the probe is their measure and the gap goes in the entry. The mutation bench goes in the commit
   message.
3. The probe, `MODE=after`, on port 3187, against the BEFORE table and the acceptance above; the regression runs of
   `_tmp_187_probe.ts` (78 arms, adapted only where R-CFG-6 changes what they read, each adaptation named),
   `_tmp_187_157b.ts`, and the Endpoints arms of `_tmp_186_probe.ts`.
4. Gates, all in the foreground, from `frontend/`, each read on its **complete** output with its exit status:
   `npm run typecheck` (exit 0, RC-48), `npm run test` (the nine files red at import of §17, nothing else red),
   `npm run build` (exit 0), `npm run check:docs`, `npm run check:addonly`, `npm run check:scripts`; the committed
   smoke through `_tmp_172_smoke.ts`.
5. Code commits `fix(#187): <what> (P-2026-10-20-1123)` (and `feat(#186): …` for the window), the pathspec on the
   commit itself.
6. After the last step: the closure prepared and **not committed** (RC-17): the entry in
   `docs/log-inbox/configurator-panel.md` (the `log-entry` skill; `Corregge: 2026-10-14 11:00`) and this prompt's
   `Status` line; then the final message with the shas, the BEFORE/AFTER table, the gates with their numbers, the
   diff of the touched files, «Decisions taken (unattended)», «Decisions awaiting Juri», a numbered visual
   checklist for Juri that names the port (3187) and the setup script, and `Outcome: hard-stop`.
7. On a message `[P-2026-10-20-1123] GO` after the visual check: one commit,
   `docs(#187): lane closure, entry and Status (P-2026-10-20-1123)`, then `Outcome: done`. Do not merge.

## DOVE

Phase 1:

- `docs/discovery/discovery_2026-10-20_187_tmaog_round1.md`
- not committed: `frontend/scripts/smoke/_tmp_187b_*.ts`; port **3187** only.

Phase 2, candidates the GO confirms or narrows (a file outside the confirmed list is a question):

- `frontend/src/components/environment/configurator/`: `ConfiguratorPanel.tsx`, `PanelFields.tsx`,
  `PanelComponents.tsx`, `ComponentPicker.tsx`, `panelModel.ts`, `__tests__/panelModel.test.ts`, `configuratorPanel.scss`
- `frontend/src/components/environment/ConfiguratorTab.tsx` (the remembered instance only)
- `frontend/src/components/project/EndpointsWindow.tsx`, `EndpointsWindow.scss` (Cancel and the arrows only)
- `docs/log-inbox/configurator-panel.md`, this prompt's `Status` line.

Commits with the pathspec on the commit itself (`git commit -- <paths>`), the `Model:` trailer of P6 and the
tooling's `Co-Authored-By` line; the subject within 72 characters without the `(P-…)` suffix. Docs and code never
in one commit (P13).

## HARD STOP

- End of Phase 1: the report committed, `Outcome: hard-stop`.
- A measure that contradicts R-CFG-6..9 or the Context in a point that changes the design: written in the report,
  not worked around.
- In Phase 2: a worsened behaviour, a new red gate, a file outside the confirmed list, an edit under
  `components/editor-v2/`, of `jjform/` or of `joiner/` that turns out to be needed: `Outcome: question`.

## NON FARE

- No edit to a tracked file under `frontend/` in Phase 1.
- No edit of `jjform/refSlot.ts` or any `jjform/` file, `InstanceDetail.tsx`, `InstanceManagerTab.tsx`, `IRForm.tsx`,
  `IRFormField.tsx`, the widgets under `viewpoint/ir/widgets/`, `ProfilesStep.tsx`, `MetaclassesStep.tsx`, `Navbar.tsx`,
  `joiner/`; no VersionFixer migration; no new dependency; no renamed or removed identifier, CSS classes included;
  no exported interface changed except by an optional property.
- `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git restore .`, `git clean`,
  `--no-verify`, push, merge, log rotation or folding, writes in another tree (the main tree is read-only for this
  lane), a port other than 3187, a comment on an issue, a background gate.

## RIFERIMENTI

- Issues #187 and #186 with @tmaog's test comments; R-CFG-1..9; R-REF-3, R-REF-4.
- `docs/discovery/discovery_2026-10-14_187_configurator_panel.md`, `docs/discovery/discovery_2026-10-14_186_endpoints.md`.
- `PanelComponents.tsx:290-430`, `ConfiguratorPanel.tsx:350-380`, `ConfiguratorTab.tsx:140-145`, `EndpointsWindow.tsx:60-130`.
- Mockups: `~/.jjodel-lanes/assets/166/187r_*.png`, `187_3_panel_sections_components.png`.
