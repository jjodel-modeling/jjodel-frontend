# Tack roadmap

Design inputs accepted for later versions. Each entry names its source and the version it targets. Nothing here is implemented until a slice prompt says so.

## After v0: autonomy policy in the harness engine

Source: the harness front, 2026-10-19, recorded by the chat that owns the `tack` front.

**Idea.** A project setting in `tack.json` grants the chat autonomy per front, by decision category. Candidate categories: merge of branches that touch only scripts or docs; continuation lanes of work already approved; GO on closures. Below every setting sits a fixed floor, the RC-26 list (governance files, deletions, push, model, effort and cost, critical zone, demo), which no setting can lower.

**Constraints for the design slice.**

1. Every category must be decidable from data Tack already has, or the setting is prose. Scripts or docs only: the paths of the branch diff. Continuation: `Depends:` on an approved prompt, `Corregge: none`, same DOVE. GO on a closure: the merged tree of the checked paths equals the tree that was checked visually.
2. The floor lives in code, not in the settings schema. `tack check` rejects any key that names a floor category.
3. Autonomy keys are project level only (versioned in `tack.json`), never in `tack.local.json` or the user file, so no personal file can raise autonomy silently.
4. A grant names a front and the chat that owns it. Ownership already exists in `docs/harness/fronts.json` (`ownerChat`).
5. Every autonomous decision leaves a machine-readable trace. Lane-side adoptions (RC-21, RC-25) are already in the lane logs. Chat-side decisions (a continuation launched, a smoke reused, a register row renumbered) are not: they need a commit trailer such as `Autonomy: <category>` so Tack can count them.

**Available before this.** A read-only view of the decisions taken unattended, from the lane logs, can ship with the Lanes page.

**Refinement from the harness front, 2026-10-19 23:38.** The rule exists on the Jjodel harness front as RC-53 (not yet on trunk when recorded). For Tack:

1. Categories are a closed list defined by the schema: `merge-scripts-docs`, `continuation`, `closure-go`. No free text.
2. The RC-26 categories are never delegable at any level (user, project, local). A configuration that tries is rejected by `tack check` with an error, not ignored.
3. The harness engine reads the rule, not the chat. Tack v0 decides nothing, so the key is not added before the engine exists.
4. Decisions the chat takes under RC-53 are reported in chat, one line each. To be counted by Tack they also need a machine-readable form (commit trailer or log-inbox line); this is a prerequisite of the view below, to be agreed with the harness front.

**View wanted before the engine:** unattended decisions per front, with how many were later corrected. Lane-side adoptions (RC-21) are counted per lane by slice 8. «Corrected» can only be measured per lane, not per decision: a lane counts as corrected when a later prompt names it in `Corregge:`.

## After v0: phase ladder per project

Source: Tack slice 8, the Lanes page (P-2026-10-19-2320 discovery §2, P-2026-10-19-2330), 2026-10-19.

**Idea.** A ladder of phases defined in `tack.json` replaces the Jjodel-specific regexes of the 4700 board (`frontend/scripts/lane-board/lane-board.mjs`, milestones 210-215, matchers 217-246: tests first, gates, probe). Each project names its milestones and the tool-call pattern that marks each one reached; the Lanes page shows `k/n · <last milestone>` on a running card. Until then the page shows the phase cell disabled with the reason «Phase progress is not tracked in v0».

**Constraints for the design slice.**

1. The ladder is project level only (`tack.json`), one per lane kind, with no default ladder: without one the cell stays disabled.
2. Matching reads the tool calls of `log.jsonl` in memory and stores only the milestone index reached, never the command text (the `readLane` rule: text is classed and dropped).
3. `tack check` validates the patterns (compilable, bounded length) and rejects a ladder whose milestones cannot be told apart.

## Health tab (harness health signals)

Source: R-TACK-5, 2026-10-20; signals and thresholds from `docs/discovery/discovery_2026-10-18_harness_health_retrospective.md` §4.

**Idea.** A Health tab and a banner showing the worst state (red for an invariant break, yellow for a diagnosis line crossed) and the signal that set it, with one sparkline per signal over a rolling 4 weeks. No composite index. The signals are defined by the harness front; Tack reads them, preferably from its own store, and shows what the report says they cannot see.
