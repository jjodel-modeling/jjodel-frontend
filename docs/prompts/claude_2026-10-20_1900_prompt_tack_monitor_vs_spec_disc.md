# Tack: monitor versus harness specification, design note (discovery)

Prompt-ID: P-2026-10-20-1900
Chat: C-2026-10-19-1748
Front: tack
Lane: discovery (read-only inventory; two documents, no code)
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-20 11:27 («distinguere la parte di monitoraggio (lanes, sessions, timelines, requirements) da quella di specifica dell'harness»), 18:53 (the specification also states what goes into the document repository and what into the KB, and the lifecycle of documents: rotation over a finite number, distilled versions, conditions to update, insert or remove), 18:56 («Si va»)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-tack-spec`, branch `tack-spec`, created by the chat from `alfonso-frontend-jjtl` at the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` link); otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-20-1900 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`.

**Context budget, strict.** Never read a whole file over 300 lines: `grep -n`, then ranges. Write the inventories to the report as you go, not at the end. Handoff at 120k.

## Context
Tack (`tack/`, slices 1-8 on trunk) observes a harness: sessions, lanes, timeline, insights, settings. It hard-codes the conventions of the Jjodel harness: the prompt header (`Prompt-ID`, `Chat`, `Front`, `Lane`, `Status`, `Corregge`), closure by `Status: eseguito`, lane kinds, the 90-minute limit, the context ceilings, the notification catalogue. The v0 extraction discovery counted 235 harness-convention couplings in the old lane board (`docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §3). `tack/ROADMAP.md` already lists three items that are specification, not monitoring: the autonomy policy (R-TACK-4, RC-53), the phase ladder per project, and the Health tab (R-TACK-5, signals from `docs/discovery/discovery_2026-10-18_harness_health_retrospective.md` §4).

Alfonso's direction: separate **monitoring** (what happened, read from traces) from **specification** (what should happen: actors, artifacts, norms, process, delegation). The specification is a harness model conforming to the Harness metamodel v1.3 in `~/jjodel-papers/2026-sosym-harness-models/jjodel/` (`harness.emf`, `harness.ecore`, `constraints.json`, `gaps.md`; read-only, outside this repository). Monitoring must keep working with no specification at all.

The specification also states **where documents live and how they evolve**: stores (the git document repository, the claude.ai project knowledge base, memory, the chat context), the placement of each artifact kind (original in one store, an optional projection such as a distilled version in another), and lifecycle policies from a closed list (immutable, append-only, single replaced slot, bounded window with rotation to an archive, distilled from sources) with trigger, condition and owner. A distilled document is checked by provenance (source paths and hashes), never by content.

The KB rules are not in git. They are in the claude.ai project instructions, quoted here as the source to cite («project instructions, claude.ai, read 2026-10-20»): the KB holds at most 6 files (CLAUDE.md, PROTOCOL.md, contesto_progetto.md, sessione_CORRENTE.md, two templates when active), «if the count exceeds 6, something is out of control»; one session file only, `sessione_CORRENTE.md`, **replaced** at each session end or checkpoint, while dated copies `sessione_YYYY-MM-DD.md` go to `docs/sessioni/` in the repository; an automatic checkpoint at about 60% of the chat context and on the keyword «checkpoint»; the prompt log keeps the last **20** entries and moves older ones to `docs/claude-code-log-archive.md`; every discovery produces a report file in `docs/discovery/`.

## COSA (Phase 1 only, read-only, then hard stop)
Write two documents, in English:

**A. `docs/discovery/discovery_2026-10-20_tack_monitor_vs_spec.md`**, opening with `## 0. Answer in brief` (five lines at most), with `file:line` evidence:
1. **Convention inventory in Tack today.** Every place in `tack/src/**` where a Jjodel harness convention is hard-coded (regexes, constants, header names, outcome words, kinds, limits, the event catalogue). For each: what it encodes, and the Harness metamodel v1.3 element it belongs to (class and feature in `harness.emf`), or «no element» (a gap in the metamodel, listed separately).
2. **Document policy catalogue.** Every rule in force today that places a document or governs its lifecycle, from `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/HARNESS-DOCS.md` (or wherever the harness docs live), the scripts under `frontend/scripts/gates/` that enforce them, and the project instructions quoted above. For each: artifact kind, store, policy kind from the closed list (or «does not fit», with why), trigger, condition, owner, where it is written, and whether a gate enforces it. Flag every pair of rules that disagree (for example 20 against 40 log entries, incidents I01 and I02 of the health report).
3. **Boundary.** What the monitor reads from a specification when one exists, what it derives alone, and what it shows when there is none. Which current Tack views become conformance views (traces checked against norms), with the health invariants of the retrospective report as the first case.
4. **Metamodel fit.** Whether v1.3 can hold stores, placement and lifecycle policies as they are, or which additions it needs (classes, features, enumerations), written as a proposal in the notation of `harness.emf`, not applied.
5. **The KB as a source.** How a monitor could read the KB (it lives on claude.ai, outside git), what it would need, and what can be checked without it.
6. Open questions, each with `Recommended:`.

**B. `tack/docs/design-monitor-vs-spec.md`**: the design note, at most 250 lines, normative in tone, citing report A for evidence. Sections: purpose; the two halves and the boundary; the specification as a harness model; stores, placement and lifecycle policies (the closed list, trigger, condition, owner, provenance for distilled documents); conformance as the bridge (health signals derived from norms); what stays out of v0; a migration order for moving conventions from code to the specification, in slices.

Commit A and B together in one docs commit, then stop with `Outcome: hard-stop`.

## DOVE
The two documents and this prompt's `Status:` line. Nothing else. `~/jjodel-papers/` is read-only.

## NON FARE
No code change. No change to the metamodel files. No change to `CLAUDE.md`, `docs/PROTOCOL.md` or any governance file (RC-26). No push.

## HARD STOP
End of Phase 1 (both documents committed).

## RIFERIMENTI
- `tack/ROADMAP.md`, `docs/decisions.md` section R-TACK
- `docs/discovery/discovery_2026-10-19_tack_v0_extraction.md` §3 and §5
- `docs/discovery/discovery_2026-10-18_harness_health_retrospective.md` §1, §4, §5
- `~/jjodel-papers/2026-sosym-harness-models/jjodel/` (`harness.emf`, `gaps.md`, `README.md`)
