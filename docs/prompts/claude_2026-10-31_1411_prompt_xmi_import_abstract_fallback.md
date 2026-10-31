# XMI import: never instantiate an abstract class when `xsi:type` is unknown

Prompt-ID: P-2026-10-31-1411
Chat: C-2026-10-31-1328
Front: release-3-2
Status: da eseguire
Lane: full (XMI importer behaviour change, one file plus tests; from the discovery of P-2026-10-31-1342, point 5)
Depends: none
Worktree: ~/jjodel-w-xmiabs, branch xmi-abstract (from alfonso-frontend-jjtl 5b19ebfc8)
Request: none (typed in the project chat on 2026-10-31; kept locally via --request)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-xmiabs` on
`xmi-abstract`, stop with `Outcome: blocked`. Check that `P-2026-10-31-1411` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1411 · session <id>]`.

No subagents, no background tasks. One probe run per tool call. Commit as soon as the gates are green.

## COSA

Measured in the discovery of P-2026-10-31-1342 (branch gen-anomalies, report
`docs/discovery/discovery_2026-10-31_generators_export_and_import_anomalies.md`, point 5; read it with
`git show gen-anomalies:<path>`): when `xsi:type` names a class the loaded metamodel lacks, `XMIService.ts`
(around `:1049-1054`) falls back to the feature's declared type and never checks `abstract`; the root path does
not check either. An XMI written for a newer metamodel version then creates instances of the abstract supertype,
drops their children as unknown features, and ends «Success with warnings»: the model looks loaded while every
affected subtree is empty.

Decided (unattended, the discovery's recommendation): skip and count. An object whose `xsi:type` is unknown, or
whose resolved class is abstract, is not created, and neither is its subtree. The import ends with one warning
per missing or abstract class naming the class and the number of skipped objects (not one warning per child
feature). References to skipped objects are dropped and counted in the same summary. If every root object is
skipped, the import fails with that summary and nothing is written. Known classes keep importing as today.

## DOVE

`frontend/src/.../XMIService.ts` (confirm the path in the report) and new tests next to its existing tests. The
status line text of the import dialog only if the summary needs a place. Out of scope: the Ecore importer and the
nsURI collision (point 6, held for Alfonso), the Generators panel.

## COME

Read the discovery's point 5 and the importer's object creation path (root and nested). Implement the skip,
the per-class summary and the all-skipped failure. Tests: an XMI with one unknown `xsi:type` child holding a
subtree (skipped, counted, siblings intact); `xsi:type` resolving to an abstract class (skipped); a reference to a
skipped object (dropped, counted); all roots unknown (import fails, nothing written); an XMI with only known
classes imports byte-identical to before.

Gates: `npx tsc --noEmit`, the importer's vitest suite, `npm run build`, `npm run check:docs`.

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1411)`.
Log entry per the current log convention (`docs/log-inbox/`) and the `Status: da eseguire` flip with date, lane,
branch and sha in one docs-only commit. No push, no merge into the trunk. Report closes with «Decisions taken
(unattended)» and «Decisions awaiting Alfonso», then `Outcome: done | hard-stop | question | blocked`.
