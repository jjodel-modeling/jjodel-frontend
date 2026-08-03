# Metrics snapshot (single source of truth)

> Recomputed from the repository at HEAD `7a048c9e0`, date 2026-07-31, by scripted extraction.
> All deliverables (paper, deck, dashboard doc-type panel) are aligned to these values. Re-run the
> commands in the session to refresh. No em dashes.

## Repository

- Commits (all branches): 2,339
- Date span: 2021-03-31 to 2026-07-31; active days: 678
- LOC (frontend/src, `wc -l`): TS 109,264 · TSX 112,724 · SCSS 87,623 · CSS 9,016 · total 318,627 (about 320k)
- Largest file: `frontend/src/model/logicWrapper/LModelElement.tsx`
- Commit-type prefixes: fix 264 · feat 131 · docs 95 · refactor 38 · chore 31 · style 17 · build 12 · perf 11 · test 9 · revert 4 (fix:feat about 2:1)

## Markdown corpus

- Total authored markdown (excl node_modules, build, dist, public, webjars): 346

Document types (count | first committed):

| Document type | Count | First used |
|---|---|---|
| Discovery report | 193 | 2026-05-02 |
| Handover / session | 24 | 2026-01-22 (last 2026-02-11, retired) |
| Design / redesign note | 16 | 2026-01-16 |
| Reports / audits / analysis | 15 | 2026-03-27 |
| Help / user docs | 7 | 2026-03-22 |
| Governance (CoC, README, CHANGELOG) | 4 | 2021-03-31 |
| Persistent context (CLAUDE.md, AGENTS.md) | 2 | 2026-01-17 |
| Agent memory | 2 | 2026-03-16 |
| Specification (SPEC.md) | 2 | 2026-03-10 |
| Prompt artifact | 2 | 2026-01-24 |
| Operational log | 1 | 2026-03-17 |

Sum of typed types: 268. Three dominant (discovery, handover, design): 233.

## Indicators

| Indicator | Value | Change vs prior snapshot |
|---|---|---|
| Document typing coverage | about 67% (233/346 by 3 dominant types) | up from 60% |
| Handoff incarnation rate | about 3.6% (7 of 193 discovery reports cited downstream) | down from 4-5% |
| Governance-rule conformance | log rotation violated about 33x (657 entries vs 20, no archive) | up from 25x |
| Persistent-context freshness | both stores maintained (CLAUDE.md 6 and AGENTS.md 4 commits since 2026-06-05; both last 2026-07-15) | RESOLVED (was 1 of 2 stale) |
| Retired document type | handover, retired since 2026-02-11 (1 of the types) | unchanged |
| Derived-doc drift | 3-4% (help jjel 21/644, jjtl 26/894 lines) | unchanged |
| Discipline-rule mentions across docs/ | hard-stop 396 · layer-impact-report 345 · critical-zone 190 | up (scales with corpus) |

Notes. The stale twin-constitution finding is resolved: AGENTS.md is now kept in sync with CLAUDE.md,
a debt paid down between snapshots. The discipline-rule figures are substring frequencies that scale
with corpus size, not distinct events; treat as upper bounds. The Notion "jjodel Metrics Snapshots"
(LOC via pygount, cyclomatic complexity via lizard, duplication, AI tokens) is a separate pipeline
and is not refreshed by this pass.
