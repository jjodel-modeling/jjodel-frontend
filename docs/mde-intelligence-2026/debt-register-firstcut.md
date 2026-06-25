# Knowledge debt register (first cut) and assessment indicators

> Scope. T4 first cut: knowledge debt as conformance gaps in the FTG+PM harness model, one row per
> finding, grounded in the evidence sweep (`evidence/inventory-and-traces.md`). Followed by a T5
> preview: the indicators these findings yield, with real counts from the 2026-06-18 tree. All
> counts are scripted and re-runnable. No em dashes. Each finding cites its conformance class from
> the project lens.

## Debt register

| ID | Finding | Conformance class | Evidence | Suggested remedy |
|---|---|---|---|---|
| D1 | `AGENTS.md` (Codex constitution, 1000 lines) and `CLAUDE.md` (1073 lines) are near-duplicate persistent stores that have diverged: AGENTS.md has a single commit (2026-06-05) and CLAUDE.md changed twice afterward and again today. | stale context store; persistent `Object` whose definition no longer matches its twin | git log of both files | one source of truth, or model two `Object`s typed by one `Language` with an explicit sync transformation and a freshness check |
| D2 | Agent memory (`.claude/.../memory/MEMORY.md` plus one memory file) is live persistent context that no `Language` types. | missing `Language` | tree | add a `L_memory` Language or fold into `L_claude` with a documented distinction |
| D3 | Discovery to implementation handoff is largely not incarnated: only 4 of 97 discovery reports are cited by any downstream design, spec, or implementation document, 5 if the codebase-overview analysis counts (74 of 97 appear elsewhere, but the rest only inside the append-only log). | undocumented knowledge in transit; aspirational `dataFlow` edge | scripted citation count over `docs/discovery/` | make the implementation activity consume the discovery `Object` explicitly, or record why the carry-forward is in-session only |
| D4 | Review or verdict records (`docs/reports/`, 11) and audit or inventory records (about 13 loose `docs/*.md` such as `audit-*.md`, `feature-inventory.md`, `jjel-jjtl-audit.md`) are real documents that no `Language` types. | missing `Language` | role-classified inventory | add a verdict or review Language and an audit or analysis record Language, or fold into `L_discovery` and document it |
| D5 | Prompt artifacts (`docs/SESSION-STARTER-PROMPT.md`, `frontend/prompts/*`) are ambiguous between `L_brief` and `L_spec`. | under-typed `Object` | tree plus model | split the two roles in the FTG or define the boundary in each `Language.definition` |
| D6 | The director describes "session documents" as the post-February replacement for end-overs (M4), but no session-document type is incarnated; discovery reports absorbed the role in practice. | knowledge living only in the director's head, never incarnated; missing `Language` | trace 1; absence of a `session/` cluster | name the de facto Language and model it, or record the intent as retired |
| D7 | `docs/claude-code-log.md` violates its own rotation rule: CLAUDE.md section 21.1 mandates "keep only the last 20 active, move older to `docs/claude-code-log-archive.md`", but the active log holds 514 dated entries and no archive file exists. | persistent `Object` not conforming to the invariant stated in its `Language.definition` | grep of `## YYYY-MM-DD` entries; missing archive | enforce rotation, or relax the rule in CLAUDE.md so the definition matches practice |
| D8 | `FTG_PM.ecore`, the designated metamodel authority, is absent from the corpus; only XMI instances are present. | type-level authority missing (FTG incomplete at the meta level) | tree search | add `FTG_PM.ecore` to the repo and project knowledge |
| D9 | User-facing reference docs are thin, drifting projections of the specs they mirror: `help/reference/jjel.md` is 21 lines against `jjel/SPEC.md` 644; `jjtl.md` is 26 against 894. | stale derived document | line counts | regenerate the reference from the SPEC, or mark it as an intentional summary with a freshness link |
| D10 | The `L_handover` production transformation (`T_handover`) no longer fires: 24 handover docs, all 2025-01 to 2026-02, none since. | dead or merely aspirational edge in the current enactment | trace 1 | model `L_handover` as retired with a validity interval, so the PM reflects the enacted process |

## Assessment indicators (T5 preview)

These are the candidate indicators the register yields, each backed by a real count. They are the
empirical spine the special theme requires. Numbers are from the 2026-06-18 tree and are
re-runnable.

| Indicator | Definition | Value (2026-06-18) | Reads on |
|---|---|---|---|
| Document typing coverage | share of authored markup typed by an FTG `Language` cleanly | about 60 percent (141 of 233 by the 3 dominant Languages; about 40 percent in unmodeled or under-typed roles) | completeness of the FTG |
| Handoff incarnation rate | share of discovery reports carried forward in writing to a downstream consumer | about 4 to 5 percent (4 to 5 of 97) | undocumented knowledge in transit |
| Persistent-context freshness | share of persistent stores updated within the active window | 1 of 2 stale (CLAUDE.md fresh, AGENTS.md untouched 13 days while its twin changed) | context staleness |
| Governance-rule conformance | stated invariants in CLAUDE.md that the corpus actually satisfies | at least 1 violated by 25x (log rotation: 514 vs 20, archive absent) | definition-versus-artifact conformance |
| Retired-edge fraction | Languages whose production transformation no longer fires | 1 of 11 (`L_handover`) | dead or aspirational edges |
| Derived-doc drift | size ratio of a derived doc to its source spec | 3 to 4 percent (jjel 21/644, jjtl 26/894) | stale derived documents |
| Type-authority presence | whether the metamodel authority is in the corpus | absent (`FTG_PM.ecore` missing) | falsifiability of the model |

## Reading

Seven indicators hold up with concrete numbers, and every one is a conformance gap, not prose. Two
are strong enough to anchor the paper's assessment section on their own: the handoff incarnation rate
(about 4 to 5 percent) operationalizes knowledge debt as a measured property of the harness, and the
governance-rule conformance finding shows the persistent context store asserting an invariant the
process does not keep. Both are exactly the kind of result the special theme asks for: they measure
how faithfully domain knowledge survives the LLM-assisted process and locate where it thins out.

Honest limits. All indicators are n equals 1 (one harness, one director) and several depend on
classification choices that a reviewer can contest (what counts as a downstream consumer, what
counts as cleanly typed). They measure incarnation and conformance, not whether the resulting
software is correct. State these threats plainly.
