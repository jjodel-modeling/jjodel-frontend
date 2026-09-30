# Metrics snapshot (single source of truth)

> Recomputed from the repository at HEAD `11bd784b6`, date 2026-09-15, by scripted extraction.
> All deliverables (paper, deck, dashboard doc-type panel) are aligned to these values. Re-run the
> commands in the session to refresh. No em dashes.
>
> IMPORTANT: between the mid-2026 snapshot and this one, a major recalibration (2026-08-10)
> introduced a formal protocol layer (docs/PROTOCOL.md, docs/decisions.md) plus prompt, session,
> and ratification document folders. Most of the knowledge-debt indicators we had measured were
> paid down. The trajectory is recorded below because it is the finding.

## Repository

- Commits (all branches): 3,489
- Date span: 2021-03-31 to 2026-09-15; active days: 723
- LOC (frontend/src, `wc -l`): TS 163,488 · TSX 129,732 · SCSS 94,594 · CSS 9,061 · total 396,875 (about 400k)
- Commit-type prefixes: docs 792 · fix 446 · feat 293 · refactor 88 · chore 51 · style 22 · test 17 · build 12 · perf 11 · revert 4 (fix:feat about 1.5:1; docs now the largest class)

## Markdown corpus

- Total authored markdown: 1,104; typed by a named type: about 1,008 (91%)

Document types (count | first committed):

| Document type | Count | First used |
|---|---|---|
| Discovery report | 412 | 2026-05-02 |
| Prompt document (docs/prompts) | 354 | 2026-08-10 |
| Session file (docs/sessioni) | 62 | 2026-08-10 |
| Ratification memo (docs/ratifiche) | 52 | 2026-08-10 |
| Archive (docs/archivio) | 34 | 2026-08-10 |
| Handover | 25 | 2026-01-22 (last 2026-08-13) |
| Reports / analysis | 18 | 2026-03-27 |
| Design / redesign | 17 | 2026-01-16 |
| Specification (docs/spec + jjel/jjtl SPEC) | 16 | 2026-03-10 |
| Help / user docs | 7 | 2026-03-22 |
| Governance (PROTOCOL, decisions, CoC, README, CHANGELOG) | 6 | 2021-03-31 (protocol/decisions 2026-08-01) |
| Persistent context (CLAUDE.md, AGENTS.md) | 2 | 2026-01-17 |
| Agent memory | 2 | 2026-03-16 |
| Operational log (+ archive) | 1 | 2026-03-17 |

## Indicators (current vs earlier snapshot)

| Indicator | 2026-09-15 | earlier | reading |
|---|---|---|---|
| Document typing coverage | about 91% (1,008/1,104) | 60-67% | debt paid down |
| Handoff incarnation (discovery cited downstream, excl. log) | about 89% (367/411) | about 4% | paid down by the prompt/session/ratification layer |
| Governance log rotation | 84 active + 1,069 archived; archive now exists | 657 active, no archive (33x) | largely paid down (active still above the 20 target) |
| Persistent-context freshness | both stores maintained (last 2026-09-15) | 1 of 2 stale | resolved |
| Handover retired | last used 2026-08-13 (no longer strictly retired) | retired since 2026-02 | reversed |
| Derived-doc drift | 2-3% (jjel 21/644, jjtl 26/1061) | 3-4% | persists (the one durable debt) |
| Corrective overhead | fix:feat about 1.5:1 (446:293) | about 2:1 | improving |

Notes. The instrument is longitudinal: the debts it flagged at the mid-2026 snapshot were
subsequently addressed by recalibration, and the re-measurement shows it. The one debt that persists
is derived-document drift (user-facing references stay a small fraction of the specs they mirror).
Discipline-rule mentions scale with corpus size and are not reported as an indicator. The Notion
"jjodel Metrics Snapshots" (LOC via pygount, complexity, duplication, AI tokens) is a separate
pipeline and is not refreshed by this pass.
