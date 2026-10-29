# Shell S7: right-rail section titles in sentence case

Prompt-ID: P-2026-10-19-1830
Chat: C-2026-10-19-1610
Front: shell-ui
Lane: full (three components, one sheet, two docs)
Status: eseguito 2026-10-19, lane P-2026-10-19-1830 (shell-ui-s7, fbb1531f9); visual check passed (chat, 3017, 1600x1000)
Depends: P-2026-10-19-1742
Request: Alfonso, 2026-10-19 17:45: «ok alle raccomandazioni» (A1 in the discovery §8), ratified as R-SHELL-4.

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-shellui-s7`, branch `shell-ui-s7`, from the trunk commit that adds this prompt (S1, S3, S4 and S6 are on the trunk there). Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-19-1830 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`.

## Context (do not redo the analysis)
Read §3.4, §3.5 (the `b.me-2` line) and §4 (S7) of `docs/discovery/discovery_2026-10-19_shell_visual_consolidation.md`, and the rows R-SHELL-4 and R-SHELL-5 in `docs/decisions.md`. The `--shell-*` tokens exist since S1; S6 already styled the rail surfaces.

## COSA
1. Source strings: every right-rail section title written uppercase in the source becomes sentence case in the source: the `<CollapsibleSection title="...">` titles in `components/editors/Info.tsx` (`GENERAL`, `TYPE & BOUNDS`, `DISPLAY`, `SEMANTIC TYPE CLASS`, `DEPENDENCIES`, `CONTENTS`, `INHERITANCE`, `RETURN`, `VALUE`, `TYPE`, `SLOTS`, `REFERENCES`, all occurrences listed in §3.4), `NODE` in `components/editors/PropertiesWithTreeView.tsx`, and `TRANSFORM`, `RELATIONSHIPS`, `ANCHORS` in `components/editors/NodeEditor.tsx`. Acronyms keep their case (none expected; say so if you find one).
2. Rail-scoped style in `properties-with-tree-view.scss` (under the rail scope, never in the sidebar sheet): `.tree-section__label`, `.props-section__title`, `.properties-node-section__label`, `.jj-flags__title` and the Advanced disclosure title at 12 px, weight 500, `text-transform: none`, `letter-spacing: 0`, colour `--shell-text-2`. `.props-header__kind` (the type badge) stays uppercase. The left palette label stays uppercase.
3. `b.me-2` in `Info.tsx` (two occurrences, "Depends from models" and "Topic"): replace the Bootstrap utility as styling hook with a semantic class (checked unused by a global grep) and move its rule from `info-improvements.scss` to that class, same computed values.
4. Docs (R-SHELL-4): in `docs/demo/models_2026_simulator_demo.md` (lines near 20, 35, 109, 501) and in the R-SIM row of `docs/decisions.md` that quotes it (near line 2526), the label `SEMANTIC TYPE CLASS` becomes `Semantic type class`. Leave `docs/redesign/rail/README.md` as a historical spec; say so in the entry.

## DOVE
`frontend/src/components/editors/Info.tsx`, `frontend/src/components/editors/PropertiesWithTreeView.tsx`, `frontend/src/components/editors/NodeEditor.tsx`, `frontend/src/components/editors/properties-with-tree-view.scss`, `frontend/src/components/editors/info-improvements.scss`; docs: `docs/demo/models_2026_simulator_demo.md`, `docs/decisions.md` (only the quoted label). Nothing else.

## Gates
typecheck at baseline (CLAUDE.md §17), vitest on `panelSections.test.ts`, `dataManagerSection.test.ts` and any test touching the three components, `npm run build` exit 0, `npm run smoke`. DOM measures at 1600x1000 on three rail states (metamodel, class, attribute selected), Basic and Advanced: rail rect `1200,91,400,877` and canvas rect unchanged; every section title in sentence case, 12 px, 500, no tracking; type badge still uppercase; no text under 11 px; no new clipped text; console errors no more than `init_dash`.

## Closure
Code commit (pathspec, code files only); docs edits of COSA 4 go in the closure docs commit with the entry. Write the log entry in `docs/log-inbox/shell-ui.md` and the `Status:` flip, uncommitted (RC-17). Start a dev server on port 3017 from this worktree (`npm start -- --port 3017`, detached), write its PID to `~/.jjodel-lanes/P-2026-10-19-1830/dev.pid`, leave it running, and exit with `Outcome: hard-stop` (visual check due). On the GO: one docs commit (entry, Status, the two docs of COSA 4), stop the dev server, `check:docs`, `Outcome: done`.

## NON FARE
No change to `:root` or token files; no rule in `tree-view-sidebar.scss`; no change to the left palette; no file outside DOVE; no dev server on 3000, 3001 or 3003; no push, no merge.

## RIFERIMENTI
`CLAUDE.md` (naming checks, §17); `docs/decisions.md` R-SHELL-4, R-SHELL-5, D-UI-11; the discovery report.
