# T1 evidence sweep: inventory and traces

> Scope. Phase 1 (evidence sweep) over the jJodel corpus as of commit state on 2026-06-18. Counts
> are produced by scripted enumeration of the working tree and git history, not by hand, so they are
> re-runnable. Observed means read directly from the tree or git; inferred is marked. No em dashes.
> Paths are repo-relative. This file feeds T2 (FTG synthesis), T4 (debt register), and T5
> (assessment).

## Corpus size

Observed. Authored markup (markdown), excluding `node_modules`, `build`, `dist`, `public`, and
vendored `webjars`: 233 files. Including build copies the raw count is 257. The serialized harness
model exists as three XMI instances at the repo root (`harness_FTG_PM.xmi`,
`harness_FTG_PM_generic.xmi`, `harness_FTG_PM_reference.xmi`). The designated metamodel authority
`FTG_PM.ecore` is not present anywhere in the tree (finding D8).

## The current FTG type space (from harness_FTG_PM.xmi)

Observed. 11 `Language`, 13 `Transformation`, 9 `Activity`, 7 `Object`, 3 `Decision`, 1 `Initial`,
1 `ActivityFinal`.

Languages: `L_brief`, `L_claude`, `L_code`, `L_design`, `L_discovery`, `L_governance`, `L_handover`,
`L_langspec`, `L_log`, `L_migration`, `L_spec`.

Transformations: `T_author`, `T_commit`, `T_design`, `T_discover`, `T_governance`, `T_handover`,
`T_implement`, `T_langspec`, `T_log`, `T_migrate`, `T_read`, `T_spec`, `T_update_context`.

## Role-classified inventory

Counts are observed. Mapping of each cluster to a model `Language` is the synthesis claim; where the
model has no fitting Language the cell reads "no Language (finding)".

| Cluster (path) | Count | Role | Typed by |
|---|---|---|---|
| `docs/discovery/` + `frontend/docs/discovery/` | 101 | verdict on codebase state, read before implementation | `L_discovery` |
| `docs/handover/` | 24 | handoff between sessions (end-overs) | `L_handover` (retired, see T3 below) |
| `docs/redesign/` | 16 | design notes and UI specs | `L_design` |
| `docs/reports/` | 11 | analysis and diagnostic records | no Language (finding D4: review or record role unmodeled) |
| `docs/help/` (+ build copies) | 7 | user-facing documentation | no Language (out of dev loop, or unmodeled domain Language) |
| `frontend/src/jjel/SPEC.md`, `frontend/src/jjtl/SPEC.md` | 2 | language specification | `L_langspec` |
| `CLAUDE.md` | 1 | persistent context, Claude Code constitution | `L_claude` |
| `AGENTS.md` | 1 | persistent context, Codex constitution (twin) | no Language (finding D1) |
| `docs/claude-code-log.md` | 1 | append-only operational log | `L_log` |
| `.claude/projects/.../memory/MEMORY.md` (+1 memory file) | 2 | agent memory | no Language (finding D2) |
| `docs/SESSION-STARTER-PROMPT.md`, `frontend/prompts/*` | 2 | prompt artifacts (brief or spec) | `L_brief` or `L_spec` (ambiguous, finding D5) |
| loose guides, audits, inventories, maps in `docs/` (e.g. `DEVELOPER_GUIDE.md`, `audit-*.md`, `feature-inventory.md`, `viewpoint-codebase-map.md`, `LANGUAGE-DOCS-AUDIT.md`, `jjel-jjtl-audit.md`) | ~13 | reference and audit records | no Language (finding D4) |
| `CODE_OF_CONDUCT.md`, `README.md`, `CHANGELOG.md` | 3 | governance and record | `L_governance` / record |

Coverage reading (observed, conservative). Three Languages (`L_discovery`, `L_handover`, `L_design`)
already type 141 of 233 authored documents, about 60 percent. The remaining roughly 40 percent sit
in roles the 11-Language FTG either lacks (review or verdict records, audits, user help, agent
memory) or under-specifies (the twin constitution, ambiguous prompt artifacts). This is the raw
material for the coverage indicator in T5.

## T3-relevant traces reconstructed

### Trace 1: the end-over to session-document recalibration (observed, corroborates M4)

`docs/handover/` holds 24 documents dated 2025-01 (1), 2026-01 (15), 2026-02 (4), and zero after
February 2026. Document creation across the whole corpus then dips in 2026-02 (4 new markup files)
and surges in 2026-04 (18), 2026-05 (65), and 2026-06 (47). This matches the director's account in
meeting 4 that end-overs were used "until the first week of February" and then replaced after a
recalibration. The `L_handover` production transformation effectively stopped firing in February
2026. Note (inferred): no `session/` document cluster exists in the tree, so the "session documents"
that the director says replaced end-overs are not present as a distinct named type; in practice the
discovery reports (starting 2026-05-09) became the dominant handoff and record carrier. This gap
between the described intent and the incarnated artifact is itself a knowledge-debt instance (D6).

### Trace 2: discovery report production and consumption (observed, sharpens M6)

`docs/discovery/` holds 97 dated reports spanning 2026-05-09 to 2026-06-17. Of these, 74 appear by
filename somewhere outside the discovery folder, but 69 of those occurrences are only in the
append-only log (`claude-code-log.md`), which records every file touched. Excluding the log, only 4
of 97 discovery reports are referenced by a downstream design, spec, or implementation document (5
if the 2026-06-08 codebase-overview analysis is counted as a consumer). The discovery to implementation dataFlow is therefore largely not
incarnated in writing: the report is produced, read once by the director in-session, and not carried
forward as a cited Object. This is the quantified version of the meeting-6 observation that the
discovery report "is not used by anyone."

### Trace 3: authorship is committer, not executor (observed, methodological caveat)

Git authorship over the whole repo is dominated by humans (Damiano Di Vincenzo 886 commits, Alfonso
Pierantonio 762, GiordanoT 274, Juri Di Rocco 96, Andrea Perelli 84). But per the harness model the
text is authored by the architect and implementer agents under human direction. So git authorship
records the committer, not the FTG executor. The trace log must not read writer or executor off git
`%an`; executor is read off the FTG (the transformation that produces a Language), per the project
convention. Flag for T2: do not store writer or reader attributes; derive them from the graph.

### Trace 4: persistent context freshness (observed)

`CLAUDE.md` is actively maintained: first commit 2026-01-17, last commit 2026-06-18 (today), with a
self-reported "last calibration 2026-05-22". `AGENTS.md`, the Codex twin (1000 lines versus
CLAUDE.md's 1073), has a single commit, 2026-06-05, and has not been touched since, while CLAUDE.md
has been committed twice after that date. The two persistent stores have already diverged (D1).

## Pointers for T2 (FTG synthesis)

1. Add a verdict or review Language and an audit or analysis record Language, or fold reports and
   audits into `L_discovery` explicitly and document the choice.
2. Decide whether `AGENTS.md` shares `L_claude` (one Language, two Objects) or needs its own; either
   way the divergence is a finding, not a modeling convenience.
3. Resolve the end-over versus session-document question with trace 1: model `L_handover` as retired
   from 2026-02, and decide whether discovery absorbed its role.
4. Add `FTG_PM.ecore` to the corpus so the type-level authority is present and citable.
