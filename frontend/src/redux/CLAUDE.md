# redux — VersionFixer working rules

Loaded only when working under `frontend/src/redux/`. Moved verbatim out of the root `CLAUDE.md`
(§3.9) on 2026-09-18 (P-2026-09-18-1930 Phase 1): VersionFixer/jsxString migration mechanics that
only matter once work is already under this directory. §3.1 (the critical-zone file table) and
§3.2 (the Layer Impact Report template) stay in the root `CLAUDE.md` — an agent must see them
*before* deciding to act, and therefore before this module could have loaded.

---

### 3.9 VersionFixer & jsxString persistence

View templates are persisted as `jsxString` strings in Redux project state. Changes to default-view source files (`DV.tsx`, `defaultViewTemplate.ts`) **do not propagate to existing saved projects automatically**.

Whenever you modify a default-view source file, you must:

1. Add a migration method in `VersionFixer.tsx`. Naming pattern:
   ```typescript
   private ['2.216 -> 2.217'](s: DState): DState { ... }
   ```
   `highestVersion` is computed automatically from method names — no separate constant to bump.

2. Inside the migration, iterate over `DViewElement` entries and rewrite `e.jsxString` for views matching the detection marker. Existing migrations (`2.211 -> 2.212`, `2.213 -> 2.214`) are reference templates.

3. If a new detection marker is needed, add it to `defaultViewTemplate.ts` (e.g., `V2_X_TO_V2_Y_DETECT_MARKER`).

**Skipping the migration leaves every existing project on the old `jsxString`. The "fix" appears to work in dev (new projects look right) but breaks on every saved file.**

Note: `frontend/src/common/DV.tsx` is also governed by this subsection (rule 14 in the
non-negotiable block covers both files) but sits under `frontend/src/common/`, not
`frontend/src/redux/`. No fourth module was created for that one file (P-2026-09-18-1930 Phase 1);
an agent working on `DV.tsx` alone will not have this file auto-loaded and must read it directly.
