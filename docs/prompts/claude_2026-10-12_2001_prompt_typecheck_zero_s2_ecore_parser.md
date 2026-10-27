# Prompt: typecheck baseline to zero, slice 2 of 3: the Ecore parser's missing import

Prompt-ID: P-2026-10-12-2001
Chat: C-2026-10-12-1955
Lane: fast (one file, two lines, both measured by the chat; one browser probe for the single runtime delta, no human visual check)
Depends: P-2026-10-12-2000
Front: maintenance
Request: none (no URL: Juri asked in a local Claude Code session on 2026-10-12; his words are `request.md` in the lane folder, RC-43)
Status: eseguito 2026-10-12 · lane fix/typecheck-baseline-zero · 315c62715
Limite: 60 minuti

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).
Deroga: P8 non si applica nella forma della checklist visiva (motivo: nothing that renders changes; the one runtime delta, an import binding, is measured by the probe of step 3, which executes the subject, P11).

Director of this lane: **Juri**. Where `docs/PROTOCOL.md` and `docs/decisions.md` say «Alfonso» (GO, the
RC-26 list, the digest), Juri decides for this lane.

Critical zone: none. The one code file of this lane is no row of the table of the root rules file §3.1 and
none of the six files of §3.2; no Layer Impact Report is owed. It is core (rule 5), the Ecore import
parser: the go-ahead is Juri's request of 2026-10-12, «risolvere una volta per tutte i 14 errori di
baseline», and the edit is one imported name and one cast.

Worktree: `/Users/juridirocco/development/jjodel-tc0`, branch `fix/typecheck-baseline-zero`;
`frontend/node_modules` is a symlink to the main tree's (P14: do not remove it). This lane is the second of
three run by `lane-run chain` in this worktree. Before anything else: `pwd` is that worktree, the branch is
`fix/typecheck-baseline-zero`, `git log -1` is the commit that adds this file (subject
`docs: add prompt P-2026-10-12-2001, lane 2/3 of chain-P-2026-10-12-2000`), its parent is the closure of
slice 1 (`docs: lane closure, entry and Status (P-2026-10-12-2000)`), `git status` is empty; otherwise stop
with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-12-2001 · session <id>]` (`session unknown` if you
cannot see it, never invented). Every final message ends with one line:
`Outcome: done | hard-stop | question | blocked`. Every question that has a recommendation carries it in
one line: `Recommended: <one line>`. A message with another Prompt-ID, or with none, is not acted on (P13).
The chain starts the next lane only on `Outcome: done` with a clean tree: every commit of this lane is
made before the final message.

## Context (measured by the chat on `38f0add16`: verify, do not trust; re-measure where a number counts)

After slice 1 (P-2026-10-12-2000) `npm run typecheck` reports 3 errors, all in `frontend/src/api/data.ts`:

- `:899`, TS2304 twice. `parseDDataType` reads `let dObject: DDataType = DDataType.new(...)`: the name is
  used as a type and as a value and the file does not import it. **It runs today all the same**: the class
  is declared `@RuntimeAccessible('DDataType')` (`frontend/src/model/logicWrapper/LModelElement.tsx:3870`),
  and that decorator publishes every such class on the global object under its cname
  (`frontend/src/joiner/classes.ts:466`, `windoww[constructor.cname] = constructor`), so the bare
  identifier resolves to the global at call time. The path is live: `parseDPackage` calls
  `parseDDataType` for every `ecore:EDataType` child (`:777`, `:807`), under `EcoreParser.parse`, which the
  Ecore import calls (`SaveManager.importEcore`, `frontend/src/components/topbar/SaveManager.ts:158-159`).
- `:1163`, TS2322. `getMultiPackageChildren(json: Json): Json[] | null` returns
  `Array.isArray(val) ? val : [val]`, and `val`, a member of a `Json`, is wider than `Json`.

The chat's measure in a throwaway worktree, with the two edits below on top of slice 1: typecheck exit 0,
0 errors. Transpiled one module at a time, the file's emitted JavaScript differs from the base **in one
line only**: the import list from `../joiner` gains the name `DDataType`. The cast is erased. So the only
runtime delta of this lane is that `DDataType`, inside `parseDDataType`, binds to the module's export
instead of the global of the same name. Read, not measured: the two are the same class object, since
`frontend/src/joiner/index.ts:182` re-exports the class the decorator publishes. The probe measures it.

## COSA

In `frontend/src/api/data.ts`, two edits and nothing else:

1. In the second import from `"../joiner"` (the value import that opens at line 8 with `Log,`), add one
   line `    DDataType,` right after the line `    LClass,` (line 25). No other name moves.
2. Line 1163: `return Array.isArray(val) ? val : [val];` becomes
   `return (Array.isArray(val) ? val : [val]) as Json[];`. Line 559 holds the same expression under an
   explicit `Json[]` annotation and is not touched.

**If a site reads differently from the text quoted here, stop with `Outcome: question`; do not adapt.**

## DOVE

- `frontend/src/api/data.ts`: one line added in the import list, one line changed at 1163.
- `docs/log-inbox/maintenance.md`: the closing entry (the `log-entry` skill, P9 format).
- `docs/prompts/claude_2026-10-12_2001_prompt_typecheck_zero_s2_ecore_parser.md`: the `Status` line.

Not committed (gitignored, `_tmp_*`): `frontend/scripts/smoke/_tmp_tc0_probe.ts`, which you write;
`frontend/scripts/smoke/_tmp_tc0_jsdelta.cjs`, the oracle, and `frontend/scripts/smoke/_tmp_174_p2.ts`,
boot material, both placed by the chat.

Any other file (the `joiner` barrel, `LModelElement.tsx`, `SaveManager.ts`, another parser): stop and ask.

## COME

1. Read the root rules file (the non-negotiable block, §2, §5, §6, §17, §21), `docs/PROTOCOL.md` P6, P9,
   P11, P12, P13, P16, `docs/decisions.md` RC-17, RC-20, RC-21, the last five entries of
   `docs/claude-code-log.md`, `frontend/scripts/smoke/README-probes.md`, and in `frontend/src/api/data.ts`
   the import block, `parse` (from line 170), `parseDPackage`, `parseDDataType` and
   `getMultiPackageChildren`.

2. **BEFORE, typecheck.** From `frontend/`, in the foreground: `npm run typecheck`, complete output kept in
   `~/.jjodel-lanes/P-2026-10-12-2001/` with the exit status. It must be exit 2 with exactly 3 errors, all
   in `src/api/data.ts` (TS2304 ×2, TS2322). Anything else: stop with `Outcome: blocked` and the list.

3. **The probe**, `frontend/scripts/smoke/_tmp_tc0_probe.ts`, written before the edit and run on the
   untouched file first. Start from `_tmp_174_p2.ts`: keep its boot (`chromium`, the constants of
   `states.ts`, `createProjectAt`), its `check` / `meas` helpers and its `page.evaluate` idiom of importing
   `/src/...` modules in the page; drop every arm and fixture of #174; set the port guard to `3190`. Count
   failures with `const r = await …; failures += r;`, never `failures += await …`
   (`npm run check:scripts` refuses it). Run it only through the launcher, in the foreground, from the
   worktree root:
   `MODE=before node frontend/scripts/lane-run.mjs probe . frontend/scripts/smoke/_tmp_tc0_probe.ts --port 3190 --id P-2026-10-12-2001`
   (then `MODE=after` after the edit). The arms:

   - **G0, the identity** (asserted in both modes; it is also the control of the Context's claim). In the
     page: `const j = await import('/src/joiner/index.ts')`; `typeof window.DDataType === 'function'` and
     `window.DDataType === j.DDataType`. If it is false in `MODE=before`, the chat's reading is wrong:
     stop with `Outcome: question`, without editing.
   - **E1, the subject runs** (P11). In a fresh project, feed the importer one Ecore metamodel the way the
     Ecore import does (`SaveManager.ts:123-159`: the XML string through `DOMParser`, then
     `prxml2json.xml2jsonobj(doc, ' ')`, then `SaveManager.importEcore(json, true, 'tc0_probe.ecore', true)`):
     a package `tc0` with one `EClass` `Thing` and one `ecore:EDataType` `Money`
     (`instanceClassName="java.math.BigDecimal"`). Record the outcome as one string: the returned elements
     mapped to `className + ':' + name` and sorted, or, when the call throws, the error's message. Record
     too the console errors and the page errors of the whole run.
     `MODE=before` only measures (`MEAS`) and prints that string. `MODE=after` asserts that its string is
     **equal to the BEFORE string** (passed in as `E1_BEFORE` in the environment, which the launcher
     hands on to the probe, or read from a file the BEFORE run wrote in
     `~/.jjodel-lanes/P-2026-10-12-2001/`), and that no page error appears that the BEFORE run lacks. The claim is equality of behaviour, not that the import is right:
     an import that throws before and throws the same after passes, and is reported.
   - **E0, the control of E1** (P12, asserted in both modes): the same call on the same metamodel
     **without** the `ecore:EDataType` returns a list with no `DDataType:` item, and the E1 list (when E1
     did not throw) holds exactly one `DDataType:Money`. If E1 throws in both modes, E0 still has to pass
     and the report says that `parseDDataType` was not reached, with the error.

   An arm that cannot be built as written: say which and why and stop with `Outcome: question`; do not
   replace it with a reading of the source.

4. The two edits of COSA. Then the oracle, from `frontend/`:
   `node scripts/smoke/_tmp_tc0_jsdelta.cjs HEAD src/api/data.ts`. Expected: `CONTROL ok`, then
   `DIFFERENT JS  src/api/data.ts` with **one** differing line, the import from `../joiner`, whose `+`
   side has `DDataType` and is otherwise the `-` side (exit 1 is the expected exit here). A second
   differing line, or `IDENTICAL JS`: stop with `Outcome: question`, quoting the output.

5. **AFTER.** The probe in `MODE=after` against the BEFORE string: every arm `PASS`, `EXIT=0`. Then every gate
   in the foreground, from `frontend/`, read on its **complete** output with its exit status:
   - `npm run typecheck`: **exit 0, no `error TS` line.** One error left or a new one: stop with
     `Outcome: question`.
   - `npm run test`: the nine files of §17 red at import, nothing else red. Another red is not
     pre-existing until you have run the same file on `HEAD` and seen it red there.
   - `npm run build`: exit 0.
   - `npm run check:docs`, `npm run check:addonly`, `npm run check:scripts`: exit 0 each.

6. One code commit, the pathspec on the commit itself (`git commit ... -- frontend/src/api/data.ts`),
   subject `fix(types): import DDataType in the Ecore parser, typecheck at zero (P-2026-10-12-2001)`.
   Body: the two sites with their codes, typecheck 3 to 0, the oracle's one differing line, the probe's
   arms BEFORE and AFTER in three lines, the `Model:` trailer of P6 (the model your session banner shows).

7. Closure, at once (no human visual check, RC-17): the entry in `docs/log-inbox/maintenance.md` and this
   prompt's `Status` line, `Status: eseguito <YYYY-MM-DD> · lane fix/typecheck-baseline-zero · <sha of step 6>`,
   in one docs commit, `docs: lane closure, entry and Status (P-2026-10-12-2001)`. In the entry:
   `Corregge` and `Causa` are `—`; `Regressions: no` only if the probe passed in `MODE=after` and every
   gate read as expected, otherwise `unknown` with the reason; `Out-of-scope changes: no`;
   `Layer Impact Report: not-required`; `Smoke visivo` says what was run, the probe and its arms, not a
   checklist; `Notes` within 500 characters, with the P8 derogation and what E1 returned.

8. `git status` is empty. Final message: the two shas; the typecheck BEFORE and AFTER; the oracle's output
   verbatim; the probe's BEFORE and AFTER table, arm by arm, with the E1 string; every gate with its
   numbers and exit status; the diff of `data.ts`; «Decisions taken (unattended)»; «Decisions awaiting
   Juri»; then `Outcome: done`.

## NON FARE

- No file outside DOVE; no third edit in `data.ts`; no fix to anything the probe finds in the Ecore import
  (a wrong or failing import of a datatype is reported as a ticket in the final message, never fixed here).
- No `@ts-ignore`, `@ts-expect-error` or `@ts-nocheck`; no change to `tsconfig.json`; no change to the
  `Json` type or to any exported signature; no import reordered; no rename; no reformat; no new dependency;
  no test written on source text (§5).
- `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git restore .`,
  `git clean`, `--no-verify`, push, merge, log rotation or folding, writes in another tree (the main tree
  is read-only for this lane), a port other than 3190, a vite started by hand, a real call to an AI
  provider, a background gate.

## RIFERIMENTI

- Root rules file §17 (the gates), §5 (complete output, positive control), §15.4 (`windoww`).
- `frontend/src/api/data.ts:170` (`parse`), `:777`, `:807`, `:896-916` (`parseDDataType`), `:1159-1164`.
- `frontend/src/joiner/classes.ts:466`, `frontend/src/joiner/index.ts:182`,
  `frontend/src/model/logicWrapper/LModelElement.tsx:3870-3895` (`DDataType`, its `new`): read, not edited.
- `frontend/src/components/topbar/SaveManager.ts:123-159` (the import path the probe copies).
- Slice 1, `docs/prompts/claude_2026-10-12_2000_prompt_typecheck_zero_s1_type_only.md`; slice 3,
  `claude_2026-10-12_2002_prompt_typecheck_zero_s3_gate_at_zero.md` (committed by the chain at its launch).
