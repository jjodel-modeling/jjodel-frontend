# Prompt: the «Editable» toggle of a Symbol label has no visible effect

Prompt-ID: P-2026-10-01-2349
Chat: C-2026-10-01-2349
Lane: fast (one authoring component and one shared predicate, root cause already read by the chat). Phase 1 short, then Phase 2 in cascade. Tier: light.
Status: eseguito 2026-10-02 · lane label-editable-toggle · 20c843f14, 6652bcb9d · two Phase 1 questions adopted as recommended, two predicates instead of one (unattended) · verifica della chat sulle misure DOM della probe (23/23, scene 0 px), crop non ispezionati a vista · merge senza GO visivo di Alfonso: non cambia la demo (RC-26), su suo «riprendi» del 2026-10-02

Worktree: `~/jjodel-w-labeledit`, branch `label-editable-toggle`, created from the trunk `alfonso-frontend-jjtl` at `4b9bc5836`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-labeledit`, branch `label-editable-toggle`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked`.

## COSA

Alfonso, 2026-10-01 about 23:45 (verbatim): «'editable' per la sezione text del symbol editor non ha effetto».

What the chat read on the trunk (verify, do not trust):

1. `LabelEntryEditor.tsx:105-112` draws the toggle as `checked={editable === true}`. The IR default is the opposite: `irTypes.ts:123-124` says «absent = default: intrinsic name labels are editable», and `irCompile.ts:476-478` compiles `editsName` as `intrinsic name|qualifiedName && l.editable !== false`. Every seeded and derived label (`irDefaults.ts`, `irCreationSeed.ts`, `viewpointDerivation.ts:389,426`) is intrinsic with `editable` absent: the toggle shows OFF while double-click renames. Switching it ON changes nothing on the canvas, because the label was already editable.
2. On a label whose source is `literal`, `path` or `intrinsic metaclassName`, the toggle is live but `editsName` is always false: ON has no effect at all.
3. With `editable: false` on an intrinsic name label the runtime does respect it (`IRNodeContent.tsx:614,638`; the IR wrapper in `ObjectNode.tsx:935-952` has no double-click of its own). Confirm this in the probe, it is the half that works.

The fix:

- One pure predicate decides whether a label edits the name, used by both `irCompile.ts` (to compute `editsName`) and `LabelEntryEditor.tsx` (to draw the toggle), so the panel and the canvas cannot disagree again. Grep the name before introducing it.
- The toggle shows the effective value: for an intrinsic `name` or `qualifiedName` source, `checked = editable !== false`. Turning it OFF writes `editable: false`; turning it ON removes the key (absent is the default, the IR stays minimal). A persisted `editable: true` keeps working and reads ON.
- For a source that cannot edit (`literal`, `path`, `intrinsic metaclassName`) the toggle is disabled and OFF, with a one-line `HelpText`: «Only a name label can be renamed on the canvas.» The stored value is left as it is (no write on render).
- The widget-object variant (`editable: { widget }`) keeps its read-only chip, unchanged.

Out of scope, a ticket only: making a single-attribute `path` label editable on the canvas (it would reuse the row value editing of `IRNodeContent.tsx:764`). Phase 1 says in two lines what it would cost; Phase 2 does not do it.

## DOVE

Phase 1 (read-only): a short report `docs/discovery/discovery_2026-10-01_label_editable_toggle.md` with: points 1-3 above confirmed or corrected with file and line; every caller of `LabelEntryEditor` (the Symbol Text section, and any other) and whether the change is right for each; the tests that pin the current toggle (`__tests__/labelEntryEditor.test.ts` and others); the cost of the path-label ticket; questions with `Recommended:`. Commit it (`docs:`) and go on to Phase 2 in cascade, unless a question has no single recommendation or the fix needs a file outside the list below: then stop with `Outcome: hard-stop`.

Phase 2: `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx`, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (the `editsName` line only, to call the predicate), the file that hosts the predicate (a new small module under `viewpoint/ir/`, or an existing one the report names), their tests under `__tests__/`. Docs: the report, one row in `docs/decisions.md`, a log entry in `docs/log-inbox/symbol-editor.md`, this prompt's Status. Anything else: stop and ask.

The decision row is the next free R-IRN id (the trunk ends at R-IRN-37; check the open branches for a collision and say what you found), evidence: measured, reversible: branch, `provisional, unattended` (RC-25).

## COME

1. Read `CLAUDE.md` (§3.1, §5, §6), `frontend/src/components/editor-v2/CLAUDE.md`, `docs/PROTOCOL.md` P16, RC-20..RC-34.
2. Phase 1 report, committed.
3. Tests first, red before the change and green after: the predicate over the five sources × {absent, true, false, widget}; the toggle reads ON for an intrinsic name label with `editable` absent; OFF writes `false`; ON removes the key; disabled for literal, path and metaclassName; `editsName` in the compiled label agrees with the predicate. Mutation bench on the predicate (drop the `!== false`, drop `qualifiedName`, accept `metaclassName`); report the score.
4. Implement. Gates: typecheck (the known 14), full vitest (the known 9 red at import), build exit 0, `check:docs`, `check:addonly`.
5. Visual: `lane-run probe` on a free port (not 3000, 3001, 3003, 3077), light theme. On an M1 node drawn by a user Symbol view with an intrinsic name label: the Text section toggle reads ON at rest; double-click on the label opens the input; toggle OFF, double-click opens nothing and the name is unchanged; toggle ON again, rename works and the IR has no `editable` key. On a literal label: toggle disabled, hint visible. Crops `sips -Z 600` under `frontend/scripts/smoke/_tmp_labeledit_crops/` (gitignored): the Text section at rest, and the disabled toggle with its hint. The four demo scenes in the default viewpoint: 0 px from `4b9bc5836`.
6. Commits: `fix:` code and tests, `docs:` report, row, log entry, Status; stage by explicit path. Stop with `Outcome: hard-stop`, the shas, the measures, the mutation score, «Decisions taken (unattended)» and «Decisions awaiting Alfonso». The merge waits for the chat's visual check on the crops.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree (no `/tmp` either), a call to an AI model, renaming or removing an existing IR property or exported identifier, a VersionFixer migration (nothing persisted changes shape), changing the default viewpoint.

## RIFERIMENTI

`irTypes.ts:123-124` (`LabelSpec.editable`), `irTypes.ts:944-945` (`CompiledLabel.editsName`), `irCompile.ts:476-479`, `IRNodeContent.tsx:605-645`, `LabelEntryEditor.tsx:64-115`, `VertexAuthoringPanel.tsx:953-990` (the Text section), spec v1.2 §5. Lane running in parallel on disjoint files: P-2026-10-01-2336 (`~/jjodel-w-irclip`, SCSS only).
