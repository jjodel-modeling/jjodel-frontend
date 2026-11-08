# Levels lane 3: S4, a link drawn between two instances, and its edge

Prompt-ID: P-2026-11-08-2012
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full, critical zone (`viewpoint/ir/`): Layer Impact Report first; go-ahead by Alfonso 2026-11-08 20:11
Status: da eseguire
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-08 20:11: «1 yes» to lane 3 and its critical-zone go-ahead; «2 drawing it from the source to the target object»: finding 4's gesture is an edge drag from one object node to another)
Depends: P-2026-11-08-1822
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-rail`, branch `oi-rail`, its tip this prompt's `docs:` commit, whose parent is `7da4590f6`
(levels lane 2 closed). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome:
blocked`. Model and tier: heavy, effort `xhigh`. Alfonso's dev server runs from this worktree on port 3005 and reloads
on save: do not stop it; probe ports outside 3000, 3001, 3005, 3015. Probe assets never under `docs/`.

## Lane discipline

Every reply opens with `[P-2026-11-08-2012 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 100 minutes.

- **First reply: the Layer Impact Report** for the files below (which layer each change reaches; what a change in
  `useIRContainment.ts` can break outside the object viewpoint) and the rule-19 file list. Then proceed.
- **Context economy**: windows of at most 50 lines; never a whole diff, never `EditorV2.tsx` or `useIRContainment.ts`
  whole, never a whole probe log. **Commit the code as soon as its gates are green.** At the ceiling write `handoff.md`
  and stop with `Outcome: hard-stop`.
- `uptime` in a separate call before each probe; start only with the 1-minute load under 20; one probe run per call.
  When a mutant is applied, Alfonso's server on 3005 serves it: keep each mutant run short and revert at once.
- Code, probe and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer.
- No push, no merge. No edit to `reducer.ts`, `portDistribution.ts`, `useM1ReferenceEdges.ts`, `canvasToJjom.ts`, a
  CLAUDE.md §3.2 file, or an exported interface beyond optional props; if one becomes necessary, stop with `Outcome:
  question`.

## Source

`docs/discovery/discovery_2026-11-08_onto_levels_class_rail_links.md` §6, §8 **lane 3**, §12 Q3, Q6, Q7, and the
addendum §13 (a link with its two InstanceValues already draws as an edge in the object tab; seed the values through
`addSlots`, not a bare `createInstance`; `useIRInteractionPlan` follows the root viewpoint, §3.3).

## COSA

1. **The gesture** (Alfonso's finding 4, gesture confirmed): on a tab at level `instance` (or `both`), an edge drag from
   one object node to another opens a menu of the associations whose two ends accept the classifiers of the two
   instances, with the generalization closure (R-OI-5); one match is auto-selected (Q7); no match opens nothing and
   writes nothing. The choice creates the link `InstanceSpecification` classified by the association, with its two end
   slots in `memberEnds` order and their InstanceValues, through `instantiate.ts`'s queue, in **one undo entry**. At
   level `class` the edge drag keeps today's behaviour. Files: `EditorV2.tsx` (the drag branch near `:1992`),
   `hooks/instantiate.ts`, `model/ontological/bindingReader.ts` (end-type conformance), `viewpoint/ir/useIRContainment.ts`
   only for the tab's viewpoint (§3.3), and `viewpoint/ir/irEdgeViews.ts` only if a reference slot's edge needs it.
2. **Q6**: diagnose why `nature` is missing from the object canvas DOM (§13.1); fix it only if the cause is in this
   lane's files, otherwise report it.
3. Tests: end-type matrix with the closure; both ends in order; a pair with no association opens no menu; one match
   auto-selects. Gates: typecheck 0; the new tests, `instantiate.test.ts`, `undoGroup.test.ts`, `bindingDetect.test.ts`,
   `classElement.test.ts` green; `npm run build` 0 (read its exit status). Code commit.
4. Probe on `UML_FILE=~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel`, object tab at `instance`: drag alice →
   history (a Loan, or whatever pair the fixture's Borrowing association accepts) → menu limited by R-OI-5 → one undo
   entry → one new edge drawn at once; Cmd+Z removes link, slots and edge; save, reload, the edge is there; a pair with
   no association: nothing; the class tab's own edge drag unchanged. Regression, one run each: the S2 suite with the
   level block (52/52), `onto-s3a-slot-problems.ts`, `onto-s3b-ghost-rows.ts` (`uml-s3b`), `onto-binding-editor.ts`.
   Crops to `~/.jjodel-lanes/P-2026-11-08-2012/crops/`: the drag with the menu, the new edge, the properties panel of the
   link. `chore(probe)` commit.
5. Mutants, each red and reverted, to `bench.txt` in the lane folder: closure dropped from the end check; ends swapped;
   the link written outside the queue (two undo entries).
6. Docs commit: rows **R-OI-24** (the gesture and its menu), **R-OI-25** (the interaction plan read per tab, if
   changed), **R-OI-26** (a reference slot drawn as an edge, if done), 2026-11-08, provisional, Alfonso's go-ahead
   recorded, reversible: branch; `parseRows` reads them. One entry in `docs/log-inbox/instance-of.md` (the Layer Impact
   Report summary, Q6 result); flip `Status:`. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree. Earlier with `Outcome: question` as stated, or if a
regression in the class tab or in another notation's canvas appears.

## RIFERIMENTI

The discovery report above; `docs/decisions.md` R-OI-1, R-OI-5, R-OI-8, R-OI-18..23, R-MT-*; CLAUDE.md §3.1, §3.2,
rule 19.
