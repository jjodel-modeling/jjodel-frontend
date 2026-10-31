# Ecore import: refuse an nsURI that is already loaded

Prompt-ID: P-2026-10-31-1711
Chat: C-2026-10-31-1328
Front: release-3-2
Status: da eseguire
Lane: fast (one importer path plus tests, behaviour decided by Alfonso)
Depends: none
Worktree: ~/jjodel-w-ecorensuri, branch ecore-nsuri (from the trunk tip after P-2026-10-31-1702)
Request: none (Alfonso, «ok alle raccomandazioni», 2026-10-31 15:08, point 6 of P-2026-10-31-1342)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-ecorensuri` on
`ecore-nsuri`, stop with `Outcome: blocked`. Check that `P-2026-10-31-1711` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1711 · session <id>]`.
No subagents, no background tasks. Commit as soon as the gates are green.

## COSA

Measured in `docs/discovery/discovery_2026-10-31_generators_export_and_import_anomalies.md` (point 6): the Ecore
importer does not check the nsURI, so importing a newer Ecore with the nsURI of a loaded metamodel adds a second
metamodel. After that an XMI whose default namespace is that nsURI is refused as ambiguous, and a prefixed `xsi:type`
on it resolves to nothing.

Decided: refuse. Importing an Ecore whose package nsURI equals the nsURI of a metamodel already in the project
writes nothing and shows an error naming the loaded metamodel and the nsURI, and saying to delete or rename the
loaded one first. Every import entry point that reaches the Ecore importer behaves the same (dashboard Import,
left bar, drag and drop if present). An Ecore with no nsURI, or with a new one, imports as today.

## DOVE

The Ecore import path (find it from the discovery report and the dashboard Import menu) and tests next to its
existing tests. Out of scope: the XMI importer, replacing metamodels, nsURI editing.

## COME

Tests: same nsURI refused with the message, nothing written; different nsURI imports; no nsURI imports; the
existing Ecore import tests unchanged.

Gates: `npx tsc --noEmit`, the importer's vitest suite, `npm run build`, `npm run check:docs`.

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1711)`.
Log entry in `docs/log-inbox/` and the `Status: da eseguire` flip in one docs-only commit. No push, no merge into the
trunk. Report closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso», then
`Outcome: done | hard-stop | question | blocked`.
