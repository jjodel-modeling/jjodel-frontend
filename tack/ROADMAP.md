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
