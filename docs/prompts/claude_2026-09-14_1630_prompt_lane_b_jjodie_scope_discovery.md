# Lane B: Jjodie metamodel scope (Phase 1, discovery only)

Date: 2026-09-14 16:30
Type: discovery (read-only), two-phase with hard stop
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh

## Parallel-lane discipline (applies to this whole prompt)

This lane runs concurrently with other Claude Code sessions in the same working tree (simulation engine; lanes C and D on `jjscript/executor` and `ProjectEditor.tsx`; possibly a docs-only lane on `CLAUDE.md`). Their uncommitted files are expected in `git status`. Never touch, stash, checkout or revert them. Never switch branch.

- Before any write, assert `git rev-parse --abbrev-ref HEAD` prints `validation-skeleton`. Otherwise stop and report.
- Read `CLAUDE.md` and `docs/claude-code-log.md` first.
- Stage only the files this prompt names, with `git add <path>`. Never `git add .`, `-A` or `-u`.
- `docs/claude-code-log.md` is shared with the other lanes. Write your entry only at the very end, immediately before your docs commit. Before staging it, `git diff docs/claude-code-log.md` must show only your entry; if another lane's uncommitted entry is present, do not commit the log: report and leave it.
- Cherry-pick to `alfonso-frontend-jjtl` is not part of this prompt. It happens at lane close, after Alfonso's visual verification, following the worktree rule (operate in the tree where the target branch is checked out, if clean).

## COSA

Discovery on how Jjodie resolves class names when it executes actions, to prepare the fix of the known defect: Jjodie shows the model the names of one metamodel (the scope) and then writes into the first metamodel that has a class with that name, in any metamodel of the project. No code changes in this phase.

## DOVE

Locate with `grep -rn` under `frontend/src` (expected under `frontend/src/ai/`, verify):

- `JjodieContext.resolveMetamodelScope`
- `JjodieActionExecutor.findClassByName`
- every call site of `findClassByName` (the inventory `docs/discovery/discovery_2026-09-11_name_resolution_scope.md` counts 13; confirm the number, list every one with `file:line`)
- the code that builds the prompt context sent to the LLM (which metamodel names and class names it includes, and from which scope)

Read the existing inventory first: `docs/discovery/discovery_2026-09-11_name_resolution_scope.md`, sections on Jjodie and on the "pass a scope" signatures. Read `frontend/src/jjscript/executor/resolvers.ts` (`selectTarget`, the A1 ambiguity rule, `ambiguityMessage`, `QUALIFY_ADVICE`) and `frontend/src/model/nameLookup.ts` (`lookupNamedEntry`) to know what already exists.

## COME

Answer these questions in the report, each with file:line evidence:

1. What `resolveMetamodelScope` returns (type, how it picks the scope: active metamodel, selection, explicit argument), and who calls it.
2. What `findClassByName` does today: pool searched (project-wide? which collections?), exact or case-insensitive, first match or all matches, what it returns when nothing matches.
3. For each of the call sites: which Jjodie action it serves, whether a scope (the result of `resolveMetamodelScope` or an equivalent metamodel reference) is already available in that function, and whether it is passed on. A table is fine.
4. Whether Jjodie actions go through the JjScript executor (`selectTarget`, which already raises the A1 ambiguity) or through their own lookup. If both paths exist, which actions use which.
5. What the LLM actually sees: does the prompt context list class names of one metamodel only, or of the whole project, and are they qualified (`Metamodel::Class`)?
6. A minimal repro scenario for Alfonso on localhost: two metamodels `A` and `B`, both with `Person`, `B` active in the scope, Jjodie asked to add an attribute to `Person`. State where the write lands today, with the code path that explains it.
7. Whether the A1 payload (`ambiguousWith`, qualified names) is reusable by Jjodie to ask the model to qualify, or whether Jjodie must resolve within the scope silently. Do not decide; describe both options with their touched files and the number of call sites each would change.

Do not implement anything. Do not create test files. Do not modify `resolvers.ts` or `nameLookup.ts` (lane C is working next to them).

## Discovery report (mandatory)

Save the report to `docs/discovery/discovery_2026-09-14_jjodie_metamodel_scope.md`. Content: objective, files read (full paths), findings per question above, dependencies and risks (in particular any overlap with `resolvers.ts`), open questions for Alfonso. The hard stop is not complete until this file exists.

## Hard stop

After the report is saved, stop. Commit only the report:

`git add docs/discovery/discovery_2026-09-14_jjodie_metamodel_scope.md` then `git commit -m "docs: discovery report on Jjodie metamodel scope"`.

Then append the log entry (see discipline above) and commit it separately: `docs: log entry for lane B discovery`.

Report back in chat: the number of call sites, the answer to question 4 and question 6, and the two options from question 7 with their cost. Phase 2 starts only after an explicit go-ahead from the project chat.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-11_name_resolution_scope.md` (inventory: 56 sites, 33 correct, 17 first-match project-wide)
- `docs/claude-code-log.md`: entries of lane A (A1 `a52dfe5f3`, A4 `dc5f8d3aa`) for the ambiguity rule and `nameLookup.ts`
- Decisions of 2026-09-11: one ambiguity rule for all callers, no opt-in; qualifier `::`, documented form `Metamodel::Element`
- `CLAUDE.md`: no renaming of existing identifiers, minimal diff, log never amended in place
