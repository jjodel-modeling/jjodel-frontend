# Prompt: #186, the Endpoints section on the project page (Editable metaclasses, Roles)

Prompt-ID: P-2026-10-14-1101
Chat: C-2026-10-14-1020
Lane: full (more than three files; a visual check)
Depends: none
Front: standalone-editor
Request: https://github.com/jjodel-modeling/jjodel-frontend/issues/186 (Juri's words in chat are `request.md` in the lane folder, RC-43)
Status: da eseguire
Limite: 45 minuti per la Fase 1, 90 minuti per la Fase 2

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the
RC-26 list, the visual GO), Juri decides for this lane.

Critical zone: none. No file of DOVE is a row of the root rules file §3.1. No Layer Impact Report is owed.

Worktree: `/Users/juridirocco/development/jjodel-186`, branch `feat/186-endpoints`, cut from `staging` at
`358a91da3`; `frontend/node_modules` is a symlink to the main tree's (P14: do not remove it). Before anything
else: `pwd` is that worktree, the branch is `feat/186-endpoints`, `git log -1` is the commit that adds this file
(subject `docs: add prompt P-2026-10-14-1101, #186 Endpoints section`), `git status` is empty; otherwise stop
with `Outcome: blocked`.

A parallel lane runs on `feat/187-configurator-panel` (`P-2026-10-14-1100`, the Configurator panel). The DOVE
lists are disjoint (RC-22). Merge order fixed at launch: that lane first, this one second.

Two phases (P4): Phase 1 read-only on tracked code, the report, `Outcome: hard-stop`; Phase 2 only after a
message `[P-2026-10-14-1101] GO` that carries the decisions and the confirmed file list.

## Lane discipline

Every reply of this session opens with `[P-2026-10-14-1101 · session <id>]` (`session unknown` if you cannot
see it, never invented). Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in one
line: `Recommended: <one line>`. A message with another Prompt-ID, or with none, is not acted on (P13).

## Context (read by the chat on `e8fd99c58`: verify, do not trust; re-measure where a number counts)

**The plan** is `docs/discovery/discovery_2026-10-14_166_configurator_usability_plan.md` (`da72802e7`): read it
whole, §4.5 and §5.3 above all. **The decisions** are R-CFG-1..4 in `docs/decisions.md`, memo
`docs/ratifiche/claude_2026-10-14_memo_166_configurator.md`; R-CFG-4 is this lane's: the Endpoints section is
the one place where the environment is configured, the left-bar entry leads to it, the wizard stays in the code
unreached (rule 9), and the UI says «Role» where it says «Profile» today (identifiers, `DProfile`, the
`?profile=` parameter unchanged, rule 2). This lane is step 3 of the plan's §6, without the «Customize element»
button: that button opens the popup of a later lane, and a button that opens nothing is not shipped.

**The issue** is #186 (`gh issue view 186 --repo jjodel-modeling/jjodel-frontend`), tasks 1 to 3. **The
mockups** are outside every tree, in `~/.jjodel-lanes/assets/166/`: `186_1_endpoints_section.png` (the section
between VIEWPOINTS and DOCUMENTATION, its two tabs), `186_2_roles_customize.png` (the Roles tab),
`186_3_editable_metaclasses.png` (the note on non-selectable metaclasses). GREEN new, BLUE a note.

Read by the chat (plan §4.5): `MetaclassesStep` and `ProfilesStep` take no props and write the store directly
(`ProfilesStep.tsx:35`, `MetaclassesStep.tsx:15`); both call `DEnvironmentConfig.getOrCreate(projectId)` in an
effect at mount (`ProfilesStep.tsx:43-45`, `MetaclassesStep.tsx:19-21`); the wizard mounts them at
`EnvGenWizardModal.tsx:105-108` and saves the project on «Done» (`:66-78`). The project page sections:
Viewpoints `ProjectEditor.tsx:2876-2954`, Documentation `:2956-2959`; the wizard is mounted at `:3134-3140` and
opened by `EnvGenEvents.OPEN_WIZARD` (`:425-431`). The left-bar entry: `LeftBar.tsx:502`. «Profile» in the UI:
`ProfilesStep.tsx:122`, `:133`, `:136`, `:141`, `:155`. Non-selectable metaclasses are listed disabled with
their reason (`MetaclassesStep.tsx:84`).

## COSA

1. **Endpoints** (task 1): a section of the project page after VIEWPOINTS and before DOCUMENTATION, in the
   markup and with the header of its neighbours, titled «ENDPOINTS», with two tabs «Editable metaclasses» and
   «Roles» that show `MetaclassesStep` and `ProfilesStep`. Only for the developer: a consumer never sees it.
2. **Opening a project writes nothing.** A project without an environment must not get one, nor become
   «Unsaved», nor gain an undo entry, because its page now mounts the two steps. The config is created at the
   first write a developer makes in the section (Phase 1 measures what the mount effect does today).
3. **«Role»** (task 2, the wording only): every text of the two steps and of the section that names a profile
   says role: «Roles», «Add role», «New role name», «No roles yet.», «Delete role», the description. The texts
   that say «Done» saves the project are reworded for a page that has no «Done» (the project's Save and Ctrl+S).
4. **Editable metaclasses** (task 3, short term): the classes that cannot be created on their own (a reason from
   `topLevelReason`) and are not marked are folded away per metamodel behind «Show N not selectable»; a marked
   one stays visible, so it can be removed.
5. **The left-bar entry** «Configure environment» leads to the Endpoints section of the project page (scrolled
   into view), not to the wizard. The wizard component and its event stay (rule 9).

Not in this lane: «Manage Profiles (Users)» (needs #170), the «Customize element» button and popup (a later
lane, R-CFG-3), anything in the Configurator (`P-2026-10-14-1100`).

Acceptance, read from the DOM: the section is the next sibling section after Viewpoints and the previous one
before Documentation; its two tabs switch the two steps; no text of the section contains «profile» or «Profile»
but the URL example; a project opened without an environment has none after the page settles, and is not
«Unsaved»; a metamodel with non-selectable classes shows only the selectable and marked ones until «Show N not
selectable» is pressed; the left-bar entry scrolls the section into view; the permissions and the stand-alone
link work as in the wizard (the same raw `typePermissions` after the same gestures).

## Phase 1: discovery (read-only on tracked code)

1. Read the root rules file (rules 1-11, 19, 20; §5, §6, §8, §17, §21), `frontend/src/styles/CLAUDE.md`,
   `docs/PROTOCOL.md` (P4, P6, P8, P9, P11, P12, P13, P16), `docs/decisions.md` (RC-17, RC-21, RC-25, RC-26,
   RC-48, R-CFG-1..4), the chat's plan whole, the last entries of `docs/log-inbox/standalone-environment.md`, and
   the whole of `MetaclassesStep.tsx`, `ProfilesStep.tsx`, `EnvGenWizardModal.tsx` and its stylesheet,
   `joiner/environmentConfig.ts`, the `DEnvironmentConfig`/`DProfile` statics of `joiner/classes.ts`,
   `LeftBar.tsx`, and in `ProjectEditor.tsx` the section components, the section ids, how the page scrolls to a
   section, and the wizard's mount and event.
2. **The probe**, `frontend/scripts/smoke/_tmp_186_probe.ts` (gitignored). Models, copied by the chat into this
   worktree: `_tmp_157_b_verify.ts` with `_tmp_157_b_setup.js` (a project with an environment and roles),
   `_tmp_172_probe.ts` (boot, helpers), `_tmp_172_smoke.ts` (the committed smoke through a wrapper);
   `README-probes.md`. `MODE=before` measures on the untouched code: the order of the project page's sections;
   what the left-bar entry opens; for a fresh project, whether mounting the two steps (in the wizard today)
   creates a `DEnvironmentConfig`, sets `U.isProjectModified`, adds an undo entry; whether the steps' classes are
   styled outside `.envgen-modal` (their rules' selectors, then the computed style of one mounted element);
   whether `ProjectEditor` is mounted in consumer mode; for a role, the raw `typePermissions` after three
   permission gestures and the link copied. That table is the oracle. Run it only through the launcher, in the
   foreground:
   `node frontend/scripts/lane-run.mjs probe . frontend/scripts/smoke/_tmp_186_probe.ts --port 3186 --id P-2026-10-14-1101`.
   Count failures with `const r = await …; failures += r;` (`npm run check:scripts`). The probe gotchas of the
   lane harness hold (dismiss `.donation-banner`, wait after a save, scroll then click).
3. **The mount effect.** Where the config should be created instead (at the first write), in which files, and
   what reads a null config in the meantime. Recommendation, and in one line what would falsify it.
4. **The left-bar entry.** How the page reaches a section today (if it does), what the entry should do when the
   project page is not the active tab, and the smallest change. Recommendation.
5. **The filter.** Where it lives (a pure helper with a test, importable under node, outside `joiner/`: a later
   lane edits `environmentConfig.ts`), its signature, the test list and the mutation bench.
6. **Markup and styles.** The DOM of the section and of its tabs, class names (one new prefix, checked absent with
   `command grep` and a positive control, P2; no existing class renamed), the tokens (rules 27 and 28), keyboard
   order and roles of the tabs (`role="tablist"`), texts in English.
7. **Phase 2 plan**, files (rule 19: more than five, each with what changes), tests with their bench, probe arms,
   gates, items of the visual checklist.
8. Write `docs/discovery/discovery_2026-10-14_186_endpoints.md`: it opens with `## 0. Answer in brief` (at most
   40 lines: the answer, the recommendation, the decisions awaiting Juri, the questions each with its
   `Recommended:` line) and closes with «Decisions taken (unattended)» and «Decisions awaiting Juri» (items of
   the RC-26 list only). Do not write rows in `docs/decisions.md`: the chat writes them.
9. Commit the report alone: `docs(#186): Phase 1 report on the Endpoints section (P-2026-10-14-1101)`.
   `Outcome: hard-stop`.

## Phase 2: implementation (after `[P-2026-10-14-1101] GO`)

The GO carries the decisions and the confirmed file list. Then:

1. Baseline of the gates on your tree before the first diff.
2. Tests before code for the pure helper; components that do not import under node get no source-text test (root
   rules file §5): the probe is their measure and the gap goes in the entry. The mutation bench goes in the
   commit message.
3. The probe, `MODE=after`, on port 3186, against the BEFORE table and the acceptance above.
4. Gates, all in the foreground, from `frontend/`, each read on its **complete** output with its exit status:
   `npm run typecheck` (exit 0, no `error TS`: the baseline is zero, RC-48), `npm run test` (the nine files red at
   import of the root rules file §17, nothing else red), `npm run build` (exit 0), `npm run check:docs`,
   `npm run check:addonly`, `npm run check:scripts`; the committed smoke through `_tmp_172_smoke.ts`.
5. Code commits `feat(#186): <what> (P-2026-10-14-1101)`, the pathspec on the commit itself.
6. The closure prepared and **not committed** (RC-17): the entry in `docs/log-inbox/endpoints.md` (a new inbox;
   the `log-entry` skill) and this prompt's `Status` line; then the final message with the shas, the BEFORE/AFTER
   table, the gates with their numbers, the diff of the touched files, «Decisions taken (unattended)», «Decisions
   awaiting Juri», a numbered visual checklist for Juri saying what the probe already covers, and
   `Outcome: hard-stop`.
7. On a message `[P-2026-10-14-1101] GO` after the visual check: one commit,
   `docs(#186): lane closure, entry and Status (P-2026-10-14-1101)`, then `Outcome: done`. Do not merge.

## DOVE

Phase 1:

- `docs/discovery/discovery_2026-10-14_186_endpoints.md`
- not committed: `frontend/scripts/smoke/_tmp_186_*.ts`; port **3186** only.

Phase 2, candidates the GO confirms or narrows (a file outside the confirmed list is a question):

- `frontend/src/components/project/ProjectEditor.tsx` (the section's mount, nothing else)
- `frontend/src/components/project/` : new files only (the section, its stylesheet, the pure helper and its test
  under `__tests__/`)
- `frontend/src/components/envgen/steps/ProfilesStep.tsx`, `frontend/src/components/envgen/steps/MetaclassesStep.tsx`
- `frontend/src/pages/components/LeftBar.tsx` (the entry «Configure environment» only)
- `docs/log-inbox/endpoints.md`, this prompt's `Status` line.

Commits with the pathspec on the commit itself (`git commit -- <paths>`), the `Model:` trailer of P6 (the model
your session banner shows) and the tooling's `Co-Authored-By` line; the subject within 72 characters without the
`(P-…)` suffix. Docs and code never in one commit (P13).

## HARD STOP

- End of Phase 1: the report committed, `Outcome: hard-stop`.
- A measure of Phase 1 that contradicts the plan or the Context in a point that changes the design: written in the
  report, not worked around.
- In Phase 2: a worsened behaviour, a new red gate, a file outside the confirmed list (`joiner/`,
  `EnvGenWizardModal.*`, `environment/` among them): `Outcome: question`.

## NON FARE

- No edit to a tracked file under `frontend/` in Phase 1.
- No edit of `joiner/` (classes, `environmentConfig.ts`), of the wizard modal and its hook, of `components/environment/`,
  of `Navbar.tsx`; no removed code (rule 9: the wizard stays); no new dependency; no renamed or removed
  identifier, CSS classes included; no exported interface changed except by an optional property.
- `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git restore .`, `git clean`,
  `--no-verify`, push, merge, log rotation or folding, writes in another tree (the main tree is read-only for this
  lane), a port other than 3186, a comment on an issue, a background gate.

## RIFERIMENTI

- Issues #186, #166, #157 (R3, R6, F4a), #170.
- `docs/discovery/discovery_2026-10-14_166_configurator_usability_plan.md`; R-CFG-1..4;
  `docs/discovery/discovery_2026-10-01_157_r3_rootable_types.md`.
- `ProfilesStep.tsx`, `MetaclassesStep.tsx`, `EnvGenWizardModal.tsx:66-108`; `ProjectEditor.tsx:281-283, 415-431,
  2876-2959, 3134-3140`; `LeftBar.tsx:480-520`; `joiner/environmentConfig.ts:149-161`.
- Mockups: `~/.jjodel-lanes/assets/166/186_1_endpoints_section.png`, `186_2_roles_customize.png`,
  `186_3_editable_metaclasses.png`.
