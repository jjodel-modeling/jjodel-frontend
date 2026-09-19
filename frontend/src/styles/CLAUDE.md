# styles — design system working rules

Loaded only when working under `frontend/src/styles/`. Moved verbatim out of the root
`CLAUDE.md` (§7) on 2026-09-19 (P-2026-09-18-1930 Phase 3): design-system elaboration that
only matters once work is already under this directory. Rules 26-28 in the non-negotiable
block are the one-line versions that must be known before then.

---

## 7. Design system

**Full spec**: `docs/DESIGN-SYSTEM.md`.

### 7.1 Essentials

- **Icons**: Bootstrap Icons only (`bi bi-*`). No other icon libraries.
- **Code font**: `'IBM Plex Mono', Monaco, Consolas, monospace`.
- **Grid**: 8px base. Standard padding: 8 / 12 / 16 / 24.
- **Cyan (#0ea5e9)**: never as button background. Only focus states, active indicators, links.
- **Primary buttons**: slate gradient `linear-gradient(135deg, #334155, #1e293b)`. White icons.
- **Horizontal toggle switches**: 36×20 px. Active `#334155` (slate, not cyan). Inactive `#cbd5e1`. Label on the left, never inside. Impl: `styles/components/_switch.scss`.
- **Vertical toggles**: only for debug/advanced mode in the navbar.
- **Multi-select chips**: slate-100 (`#f1f5f9`), border slate-200, label slate-700. Selected option subtle cyan `rgba(14,165,233,0.08)`. Impl: `inputselect.scss`, `viewapplyto.scss`.

### 7.2 Token system

**Single source of truth**: `styles/tokens/_colors-light.scss` + `_colors-dark.scss` (both, always). Entry point: `styles/tokens/index.scss`. Active variables in `styles/variables.scss`.

**Legacy tokens — do NOT reintroduce**:
- `--accent` (use `--color-accent`)
- `--bg-1` through `--bg-5`
- `--secondary`
- `--terziary` (typo intentional in the legacy name — also eliminated)
- `--radius`
- `--color` (ambiguous — use `--color-text-primary` or `--color-accent`)

**Current state**: 4 residual `var(--accent)` in `frontend/src/components/editor-v2/EditorV2.scss` awaiting cleanup, measured 2026-08-18 with a regex that separates the bare token from `--accent-muted` / `--accent-subtle`, which are different tokens and not legacy. The count claimed here until then was 1; it was 5 before the `toolbar-syntax-pill` block was retired with R-IRN-10, which took one of them and did **not** close the ticket. Two more live occurrences sit outside that file, in `redux/defaults/views.ts` (249, 659). Do not add new occurrences; the open ticket is for removal, not propagation.

**Rules for new tokens**:
- `grep -r` before adding, to avoid collisions
- Always add to both files (light + dark)
- Never define CSS variables inside component files — everything in `tokens/`
