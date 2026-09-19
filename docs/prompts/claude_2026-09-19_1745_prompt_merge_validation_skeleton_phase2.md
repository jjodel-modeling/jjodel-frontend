# Prompt: merge `validation-skeleton` into `alfonso-frontend-jjtl` (Phase 2, execution)

Prompt-ID: P-2026-09-19-1745
Follows: P-2026-09-19-1622 (Phase 1, read-only). Its report is the only source of figures for this
lane: `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md` (trunk `7f16439ff`).
Read it in full before anything else, then `CLAUDE.md`, `docs/PROTOCOL.md` (P6, P8, P9, P13, P14, P15,
RC-11, RC-13) and `docs/claude-code-log.md`.
Effort: xhigh. Every message you send opens with `[P-2026-09-19-1745 · session <id>]`. A message with
a different or missing ID is not executed.

Decisions taken in chat on 2026-09-19 (Alfonso, "decidi tu" on the mechanism; the rest ratified by
his GO to this prompt). They answer the twelve questions of section 10 of the report, in order:

1. Corner radius: **superset**. Type from the trunk (`Conditional<number>`), semantics from the
   branch (honoured on rect, rounded, diamond, hexagon, parallelogram through `roundedPolygonPath`,
   clamped at render; ignored on ellipse, circle, stadium, cylinder; absent is "no override", never 0).
   The painter reads the compiled value, not the source IR. R-IRN-35 below.
2. Border: yes. The per-axis border of D1 (`borderColor`, `borderWidth`, `borderStyle`) is the only
   compiled shape; `CompiledView.border` disappears; the parity S2 separator rule reads `borderColor`.
   R-IRN-36 below.
3. #139 twice: take the branch side in all six hunks; visual check at hard stop 1 (P8).
4. Mechanism: **(a) one merge commit**, `--no-ff`.
5. Derogation: RC-14 below, written on the trunk before the merge, in the same lane (commit A).
   Alfonso's GO to this prompt is the ratification; the text is verbatim.
6. Log lane: after the merge, as its own commits (P13), with the `log:rotate` tool the merge brings.
7. The eight simulator-front docs commits arrive by the merge. Nothing to do.
8. `11bd784b6` (`reminder`): accepted as is, named in RC-14. No history rewrite.
9. The Phase 1 prompt file of P-2026-09-18-2219 is now tracked on the trunk (`20a13bb29`). The
   untracked copy in `~/jjodel` is handled in step 1.
10. Both branches were pushed from the chat at 17:30 (`origin/validation-skeleton` = `92d180708`,
    `origin/alfonso-frontend-jjtl` = `20a13bb29`). Moot.
11. `HARNESS-DOCS.md` 1.2 lands stale. Ticket `2b1cc6d05` stays open; not this lane.
12. Freeze: from the GO to this prompt until hard stop 2 is cleared, no other lane runs on either
    branch. Alfonso's three paper files in `~/jjodel` (`docs/mde-intelligence-2026/`) stay modified
    and untouched: they differ on neither ref, so the merge cannot reach them (assert it in step 0).

## COSA

Bring `validation-skeleton` (`92d180708`) into the trunk `alfonso-frontend-jjtl` (HEAD = the commit that adds this prompt file) with
one merge commit, resolve the ten conflicts as decided, unify corner radius and border as R-IRN-35
and R-IRN-36 say, make typecheck, build and the test suite pass, then cherry-pick the three code
commits of `simulation-engine` slice 0, run the log lane, and push. Two hard stops for Alfonso's
visual check.

## DOVE

Work in `~/jjodel` after step 1 (the trunk will be checked out there, where `node_modules` and the
dev server on `http://localhost:3000` live). `~/jjodel-release` is left detached. `~/jjodel-sim` is
touched only in step 5.

Files you write outside conflict resolution: `docs/decisions.md` (commit A and the merge),
`docs/log-inbox/merge-gate.md`, `docs/log-inbox/simulation.md`,
`docs/discovery/discovery_2026-09-19_merge_resolution_ir_trio.md`, and whatever the log lane
touches (`docs/claude-code-log.md`, `docs/claude-code-log-archive.md`). Code files: only the three of
the IR trio and the files that the typecheck or the tests force you to touch because of R-IRN-35 and
R-IRN-36 (`shapeRegistry.ts`, `irValidate.ts`, `SymbolBoxPreview.tsx`, `SymbolPreview.tsx`,
`irDefaults.ts`, their tests). Every file outside this list that you think you need: stop and ask.

## COME

### Step 0. Preconditions (read-only)

In `~/jjodel`: `git worktree list`; assert `validation-skeleton` = `92d180708` and
`alfonso-frontend-jjtl` HEAD = the commit that adds this prompt file
(`git log -1 --format=%H -- docs/prompts/claude_2026-09-19_1745_prompt_merge_validation_skeleton_phase2.md`
equals `git rev-parse HEAD`). If either moved, hard stop. The report measured the trunk at
`2da08a722`; the commits since (`7f16439ff`, `65c092604`, `20a13bb29`, this one) are docs-only lane
commits: assert that `git diff --name-only 2da08a722 HEAD` lists no file of the ten in conflict, so
the report's figures hold for this pair. Record the trunk sha: it goes into RC-14. Assert no `MERGE_HEAD` and no `index.lock` in `$(git rev-parse --git-dir)` of both
trees. Assert `git diff --name-only alfonso-frontend-jjtl validation-skeleton -- docs/mde-intelligence-2026/`
is empty (positive control: without the pathspec it lists 258 files). Ask Alfonso to confirm no
other Claude Code session is open on either tree.

### Step 1. Swap the worktrees

`git -C ~/jjodel-release switch --detach` (frees the trunk). In `~/jjodel`: compare the untracked
`docs/prompts/claude_2026-09-18_2219_prompt_default_view_parity.md` with
`git show alfonso-frontend-jjtl:docs/prompts/claude_2026-09-18_2219_prompt_default_view_parity.md`
by md5. Identical: delete the untracked copy (the checkout would refuse otherwise). Different: hard
stop, show the diff. Then `git switch alfonso-frontend-jjtl`. Assert `git branch --show-current`
= `alfonso-frontend-jjtl` and `git status --short` shows only the three paper files, `.lsp.json`,
`.tracer/`. `npm run typecheck` from `frontend/`: record the error count as the trunk baseline
(the report says 33; do not fix them).

### Step 2. Commit A: ratifications on the trunk, before the merge (docs only)

Insert in `docs/decisions.md`, following the file's own conventions (ASCII apostrophes for accents,
bold id, date, bold title), three entries. RC-14 goes after RC-13-bis in the Processo series;
R-IRN-35 and R-IRN-36 after R-IRN-34. Verbatim, the one placeholder in RC-14 filled with the trunk
sha of step 0:

> - **RC-14** (2026-09-19) — **Deroga a P14 per il merge una tantum di `validation-skeleton` nel
>   tronco.** P14 ammette solo `cherry-pick -x` di sha espliciti; il ramo porta 261 commit oltre il
>   tronco, 220 senza patch equivalente (48 di codice), intrecciati su cinque corsie e sugli stessi
>   file. Con questi numeri il cherry-pick per fronte e' un rebase mascherato e lo squash perde la
>   catena `Model:`/`Corregge` (RC-7). Si merga con un solo merge commit `--no-ff`, storia
>   conservata, sulla coppia (`<sha del HEAD del tronco misurato al passo 0>`, `92d180708`): il report
>   `discovery_2026-09-19_merge_gate_validation_skeleton.md` ha misurato il tronco a `2da08a722` e i
>   quattro commit successivi sono solo documentazione fuori dai file in conflitto. Il merge commit e' l'unico commit
>   esente da RC-13 (docs e codice insieme) perche' e' un merge. Si accetta senza riscrittura il
>   commit `11bd784b6` con subject `reminder`. I 41 commit duplicati restano entrambi nella storia.
>   La deroga vale per questo merge e per nessun altro: P14 resta la regola.

> **R-IRN-35** (2026-09-19) — **Un solo `cornerRadius`, tipo del tronco e semantica del ramo.** Il
> giro parita' (R-IRN-31) e il Symbol Editor 1b (D5 in `docs/handoff/decisions-symbol-editor-1b.md`)
> hanno introdotto lo stesso asse due volte, con tipo e semantica diversi. Si unifica:
> `ShapeSpec.cornerRadius?: Conditional<number>` (px), compilato in `irCompile` come gia' fa il
> tronco, fallback non emesso e mai 0 (assente = nessun override, il raggio base della forma resta).
> Il valore risolto per l'istanza e' onorato da rect, rounded, diamond, hexagon e parallelogram
> tramite `roundedPolygonPath`, con clamp a `min(w,h)/4` al render, ed e' ignorato da ellipse,
> circle, stadium e cylinder. Il painter legge il valore compilato, non l'IR sorgente. La clausola di
> R-IRN-31 «ignorato sulle forme dipinte in SVG» e' superata; D5 resta valido nella semantica e
> superato nel tipo. Il controllo del Symbol Editor scrive una costante numerica, che e' un
> `Conditional` valido; la preview mostra il raggio solo per una costante, un raggio a regole non ha
> preview in v1 (ticket). Il seme della object view (`cornerRadius: 8`) e' compatibile e resta.

> **R-IRN-36** (2026-09-19) — **Il separatore legge `borderColor` per asse.** Con D1 il bordo compilato
> e' per asse (`borderColor`, `borderWidth`, `borderStyle`) e `CompiledView.border` non esiste piu'.
> La regola S2 della parita' (il colore del separatore fra header e compartimento riusa il colore del
> bordo del box) resta e legge `borderColor`; `separatorColorStyle` in `IRNodeContent.tsx` si
> ricostruisce da `borderColorV`. Nessun cambio visivo atteso sulla view di default: la sonda di
> parita' del 19/9 deve dare ancora zero delta.

Commit A: `docs: RC-14, R-IRN-35, R-IRN-36 before the merge of validation-skeleton (P-2026-09-19-1745)`,
pathspec `docs/decisions.md` only, `Model:` trailer (P6).

### Step 3. The merge

`git merge --no-ff --no-commit validation-skeleton`. Expect exactly the ten files of the report in
conflict; a different set is a hard stop (the pair moved or the report is wrong). Resolve:

- `docs/archivio/claude_milestone_validazione_scheletro.md`: take ours (trunk). The branch side is
  the shared original.
- `docs/claude-code-log.md`: union by entry heading, newest first, no entry lost, no entry twice.
  Do not rotate here; Check D stays red until step 6. Do not touch the archive here beyond what the
  auto-merge did.
- `docs/decisions.md`: take theirs (branch) for the hunk; the trunk side is a strict prefix of it.
  Then assert: every `**R-...**` and `**RC-...**` id unique, none lost from either side (131 R ids
  of the report plus R-IRN-35, R-IRN-36, RC-14), no `##` heading twice, no marker left.
- `docs/spec/spec_attive.md`: take theirs.
- `SymbolEditorModal.scss`, `SymbolEditorModal.tsx`, `frontend/src/utils/lastViewpoint.ts`: take
  theirs in every hunk. Verify the merged `lastViewpoint.ts` has one vertex seed inside the `new2`
  callback and sets `appliableTo = 'Vertex'`, and the modal has one `createPortal(..., document.body)`
  and z-index `var(--z-alert, 10000)`.
- `irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx`: hand resolution per R-IRN-35 and R-IRN-36:
  - `ShapeSpec`: one `cornerRadius?: Conditional<number>`, doc comment merged (trunk type, branch
    semantics: which forms honour it, clamp, absent is not zero). `border` per axis as the branch.
    `TextStyle.underline` (trunk) untouched. `CompiledView`: no `border`; the three per-axis fields
    of the branch; `cornerRadius: CompiledConditional<number | undefined> | null` of the trunk.
  - `irCompile.ts`: compile `cornerRadius` as the trunk does; compile the border per axis as the
    branch does.
  - `IRNodeContent.tsx`: keep the branch's paint path (`cornerPaint`, `roundedD`, `svgViewBox`,
    `resolveCornerRadius`) but feed it the resolved compiled radius of this instance instead of
    `authoredCornerRadius(ir)`; rebuild `separatorColorStyle` from `borderColorV`; remove the
    trunk's inline `borderRadius` on box shapes if it duplicates what the branch painter does
    (one mechanism, not two). Everything else of both sides stays.
  - `shapeRegistry.ts` / `irValidate.ts` / previews: adapt only what the compiler and the tests
    force: the validation guard accepts a number or a conditional shape for `cornerRadius` (as
    `validateIR` already does for the other conditionals); `authoredCornerRadius` returns the
    number when the value is a plain constant, `undefined` otherwise (ticket for rule-based radius
    in the preview).
  - Write the resolution note `docs/discovery/discovery_2026-09-19_merge_resolution_ir_trio.md`:
    per file, what was taken from which side, what was rewritten, the identifiers that crossed the
    hunks (`separatorColorStyle`, `borderColorV`, `cornerPaint`, `roundedD`, `svgViewBox`), open
    tickets.
- No marker left anywhere: `git grep -n '^<<<<<<<\|^>>>>>>>' -- .` is empty.

Then, from `frontend/`: `npm run typecheck` (target: the trunk baseline of step 1, not one more;
list any new error and fix only those caused by the merge), `npm run build`, `npx vitest run` (all
green; the parity snapshot tests of `ir.test.ts`, `shapeRegistry.test.ts`, `irValidate.test.ts`,
`symbolRecognition.test.ts` and the three regression tests of `516afd310` in particular). Run the
parity probe `docs/discovery/harness/probe_2026-09-19_ir_vs_native_object_style_parity.mts` against
the dev server: zero delta expected (R-IRN-36). Failing any of these: fix inside the scope of DOVE
or hard stop.

Commit the merge: `merge: validation-skeleton into alfonso-frontend-jjtl (RC-14, P-2026-09-19-1745)`,
body: the pair of shas, the ten files and their resolution shape in one line each, the typecheck
count, the test count, `Report: docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md`,
`Model:` trailer.

### Hard stop 1: visual check by Alfonso (P8), on `http://localhost:3000`, hard refresh

1. Symbol Editor modal paints above the Properties rail (#139 and `bc42b259c`).
2. Tree "+" on a viewpoint creates a view born with IR (#139 and `1731cbc66`).
3. Canvas v2 menu: "Create edge view" on a reference and "Create row view" on an attribute both work.
4. A new object view in a syntax viewpoint has the native chrome (border, radius 8, underline,
   separator) in light and dark (R-IRN-29..34).
5. Symbol Editor: set a corner radius on a diamond and on a rect; both round (R-IRN-35). Absent
   leaves the base radii.
6. A project saved before `400095370` still renders its default views natively (R-IRN-34).
7. R-MCID: two homonymous metaclasses of different metamodels are distinct in the picker.

Post the checklist and wait for `GO 1`. Nothing before it.

### Step 4 (after GO 1). `simulation-engine` slice 0 onto the trunk, P14 literal

`git tag archive/simulation-engine-2026-09-14 baf7b2b8a`. In `~/jjodel` (trunk checked out, clean):
`git cherry-pick -x 2f53c876a c70c9f7b5 c09cf4353`, one at a time, each expected clean (measured
2026-09-19: zero conflicts for the three code commits against the trunk; re-measure with
`git merge-tree` before each). `npx vitest run` green after the third (`step.test.ts` included).
Then one docs commit: `docs/log-inbox/simulation.md` with the three log entries taken verbatim from
the bodies of `22a593315`, `960de31d8`, `baf7b2b8a` (the three docs commits are not picked: they
conflict on the log by construction; the inbox is P9's answer). Then move the branch onto the trunk:
`git -C ~/jjodel-sim reset --hard alfonso-frontend-jjtl` (the six original shas stay reachable from
the tag and cited by the `-x` trailers).

### Step 5. `validation-skeleton` after the merge

Leave the branch in place, do not delete it, do not push anything yet. `~/jjodel-release` stays
detached; whether to remove that worktree is Alfonso's call, not this lane's.

### Step 6. The log lane (P13, exclusive, own commits)

Write this lane's entry first in `docs/log-inbox/merge-gate.md` (format of the existing entry;
`Regressions:` honest; `Layer Impact Report: not-required` unless a critical-zone file was touched,
which this lane must not). Then from `frontend/`:
`npm run log:rotate -- --fold --rotate --write` (folds every inbox: `harness`, `merge-gate`,
`simulation`, and any other non-empty one; rotates to 40 or fewer). Then the archive: remove the
seven duplicate headings the report measured, only where the two entries are byte-identical; where
they differ keep both and open a ticket in the Notes of this lane's entry. `npm run check:docs`
green (Check D included). One commit for fold and rotate, one for the archive de-duplication,
pathspecs explicit. `git add .` is never used in this lane.

### Hard stop 2: push

Report the final `git log --oneline -12`, `git status --short`, `check:docs` output. Wait for
`GO 2`. On `GO 2`: `git push origin alfonso-frontend-jjtl` and `git push origin --tags` (the archive
tag). Then `git push origin simulation-engine --force-with-lease` only if Alfonso says so in the GO;
otherwise leave it.

## RIFERIMENTI

- Report: `docs/discovery/discovery_2026-09-19_merge_gate_validation_skeleton.md` (sections 5, 6, 9, 10).
- Trunk parity lane: `400095370`, `6ee6efcd5`, `516afd310`; R-IRN-29..34 in `docs/decisions.md`.
- Branch Symbol Editor 1b: `8da572191` (corner radius, `shapeRegistry.ts`), `3e4f7536f` (border per
  axis); D1 and D5 in `docs/handoff/decisions-symbol-editor-1b.md`.
- Branch fixes duplicated by #139: `bc42b259c`, `1731cbc66`; trunk `7b5f4fd3a`.
- Simulation slice 0: `2f53c876a`, `c70c9f7b5`, `c09cf4353` (code); `22a593315`, `960de31d8`,
  `baf7b2b8a` (log entries).
- Parity probe: `docs/discovery/harness/probe_2026-09-19_ir_vs_native_object_style_parity.mts`
  (Node 26 runs `.mts` directly, no `tsx`; probe the mounted, unselected node).
- P14 (worktrees, cherry-pick), P13 (log lane exclusive), P9 (inbox), P8 (visual check), P6
  (`Model:` trailer), RC-11 (derogations declared), RC-13 (docs and code never in one commit; the
  merge commit is exempt by RC-14).
