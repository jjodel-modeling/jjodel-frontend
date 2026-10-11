# Prompt: release 3.1, L5, pin a 3.0.0 save through the migration chain

Prompt-ID: P-2026-10-12-0116
Chat: C-2026-10-11-1812
Front: release-3-2
Lane: full (test of the migration chain; reads a 3.0.0 build)
Depends: P-2026-10-12-0010
Request: none (Alfonso, 2026-10-12 00:06, "ok alle raccomandazioni, procedi in lane auto"; L5 of the 1812 report)
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Worktree: `~/jjodel-w-rel31-fixture`, branch `rel31-fixture`, created by the chat from `alfonso-frontend-jjtl` at the docs commit that added this prompt (format 2.230 is on the trunk), with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-12-0116 · session <id>]` and ends with an `Outcome:` line (P16). Gates run in the foreground.

## COSA

No project saved by 3.0.0 (format 2.228) is tracked in the repo (§3.6 of `docs/discovery/discovery_2026-10-11_release_3_1_scope.md`), so the 3.0 → 3.1 path is shown by reading, not measured. This lane measures it.

1. **Produce the fixture.** `git archive 3.0.0` (tag; fall back to `cb699ad58`) into a `/tmp` folder, link `node_modules`, start its dev server on port 3145, create a small project with the 3.0.0 UI (one metamodel with two classes, an attribute of each primitive type including EDouble, a reference, one model with two instances, the default views untouched) and export it with «Download Project». Check the file reads `2.228`. Save it as `frontend/src/redux/__tests__/fixtures/save_3_0_0.jjodel` (create the folder if needed; if the repo has a fixtures convention elsewhere, follow it and say so).
2. **The test**, a new file in `frontend/src/redux/__tests__/`: the fixture goes through `VersionFixer` to the highest version (2.230 today, read the constant, do not hard-code it); primitives keep their identity after EDouble; the migrated default view is kept (rule 14, `isMigratedDefaultView`); instance and reference counts are unchanged. A second case: a chain without the 2.229 → 2.230 adapter throws on a 2.230 save (mock or a subclass, whichever the existing VersionFixer tests use; follow `versionfixer_old_states.test.ts`). The test must fail on a mutation of the 2.228 → 2.229 step: show one.
3. **Browser check**: open the fixture on this tree's dev server on port 3146, record version read and load errors, one crop in the lane folder.
4. Gates: typecheck 14, vitest, build, check:docs.

Report: `docs/discovery/discovery_2026-10-12_rel31_fixture.md`, with «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Log entry in `docs/log-inbox/release-3-1-fixture.md`. Commit, stop with `Outcome: hard-stop`.

## NON FARE

No push, no tag, no merge. Do not edit `VersionFixer.tsx` or any source file: a test, a fixture, the report and the inbox only. If the 3.0.0 save does not migrate cleanly, that is a finding: stop with `Outcome: question`, do not fix it here.

## RIFERIMENTI

CLAUDE.md §3 (VersionFixer is critical zone: this lane only reads it), §17; PROTOCOL P4, P9, P14, P16.
