# Discovery — View error state ("Error in View: Unknown")

**Date**: 2026-05-31
**Branch**: `alfonso-frontend-jjtl`
**Phase**: 1 of 2 — READ-ONLY discovery (no source files modified)
**Status**: ✅ Complete. All Q1–Q9 answered and cross-verified (direct file reads + three independent search passes that agree on every fact).

> Note: the render site is **not** a `ViewErrorState` component or an inline-styled red `<div>`. An early intermediate scratch-read suggested that; it was wrong and is discarded. The verified truth: the badge is `ErrorDisplay` in `common/ErrorPortal.tsx`, styled by classes in `common/error.scss`, rendered from `DV.error()` in `common/DV.tsx`.

---

## Q1 — Render site ✅

The literal is at **`frontend/src/common/ErrorPortal.tsx:177`**, inside the **`ErrorDisplay`** component (a `React.forwardRef`, declared line 122). It is an on-canvas **badge** built from CSS classes (not inline styles):

```tsx
// ErrorPortal.tsx:162-185 (verbatim)
return (
    <>
        {/* Slick error badge on canvas */}
        <div
            ref={ref}
            className='error-badge-slick'
            tabIndex={0}
            onClick={handleBadgeClick}
            title={`${errorType} error - Click for details`}
        >
            <div className="error-badge-icon">
                <i className="bi bi-exclamation-triangle-fill" />
            </div>
            <div className="error-badge-content">
                <span className="error-badge-title">
                    Error in View: <strong>{viewName || 'Unknown'}</strong>
                </span>
                {instanceInfo && (
                    <span className="error-badge-instance">
                        on {instanceInfo}
                    </span>
                )}
            </div>
        </div>

        {/* Modal portal */}
        <ErrorPortal isOpen={isModalOpen} onClose={handleClose} viewName={viewName} ... />
    </>
);
```

`ErrorPortal.tsx` (206 lines) exports exactly two things:
- **`ErrorDisplay`** (named, forwardRef) — the badge above. Clicking it opens the modal.
- **`ErrorPortal`** (named + **default**) — a **modal** rendered via `createPortal(errorContent, document.body)` (line 103). Shown only when `isOpen`.

There is no `ViewErrorState` / `ViewErrorWrapper` / class error-boundary in this file.

---

## Q2 — Mechanism ✅

**Not** a React error boundary. It is a **plain conditional render** triggered by a `try/catch` around JSX-view evaluation, in the **classic editor**.

Flow (verified):

1. The classic graph renderer evaluates a view's compiled `jsxString`. The `try/catch` lives in **`frontend/src/graph/graphElement/graphElement.tsx`**:
   - `GraphElementComponent.displayError(e, where, view, data, node, asString, printData)` — lines **664–714**. It parses `e.message` **and `e.stack`** to locate the offending source line/col, builds a `ReactNode` message, then calls `DV.errorView(...)`.
   - `getTemplate3_` — line **735**: `try { rnode = this.getTemplate3(...) } catch (e) { rnode = GraphElementComponent.displayError(e, "JSX Semantic", ...) }`.
2. `DV.errorView()` (`common/DV.tsx:573`) cleans the message and calls `DefaultView.error(...)`.
3. **`DV.error()`** (`common/DV.tsx:1738-1783`) switches on `notificationType` (a const = `'classic'`, line 33):
   - `'classic'` → renders the `<ErrorDisplay>` badge (see Q1 caller below). **This is the live path.**
   - `'alert'` → `U.alert('e', ...)` toast only, returns null.
   - `'notification'` → a small `.notification-icon`.

Caller of `ErrorDisplay` (the only one), `common/DV.tsx`:
```tsx
// import — DV.tsx:29
import { ErrorDisplay } from "./ErrorPortal";

// DV.tsx:1754-1770 (case 'classic')
case 'classic':
    return (
        <Measurable draggable={true} resizable={false}>
            <ErrorDisplay
                viewName={v?.name}
                viewpointName={viewpointname}
                errorType={errortype}      // "SYNTAX" | "RUNTIME"
                errorContext={on}          // " on <dname> / <nodename>"
                message={msg}              // ReactNode: cleaned error + code snippet
                dname={dname}
                nodename={nodename}
                onClick={clickRetry}       // see Q8 — not wired by errorView path
                dataClassName={data?.className}
            />
        </Measurable>
    );
```

`ErrorPortal.tsx` is in `common/` and is **not** a critical-zone file (not `useJjomSync.ts` / `portDistribution.ts`). No Layer Impact Report needed for Phase 2.

---

## Q3 — The `Unknown` value ✅

Fallback expression (`ErrorPortal.tsx:177`): `Error in View: <strong>{viewName || 'Unknown'}</strong>`.

`viewName` is the `ErrorDisplay` prop, fed `viewName={v?.name}` at `DV.tsx:1759`, where `v: LViewElement | DViewElement` is the view that failed. **A real view name is normally available** at the point the error fires (the failing view is known). `'Unknown'` only appears when `v` is undefined or `v.name` is empty — an edge case, not the norm. So the redesign's demoted name chip will usually show the real view name, occasionally `unknown`.

---

## Q4 — Current styling ✅

Styling is via **CSS classes in `frontend/src/common/error.scss`** (464 lines), imported at **`DV.tsx:28`** (`import "./error.scss";`). Not inline, not a styled wrapper.

Classes — **badge** (the box the user sees): `error-badge-slick`, `error-badge-icon` (the pink chip), `error-badge-content`, `error-badge-title`, `error-badge-instance`.
Classes — **modal** (`ErrorPortal`): `error-notification-portal`, `error-notification`, `error-notification-close`, `error-instance-info` (+ `-name`/`-class-name`/`-node-name`), `error-type`, `error-details`, `error-notification-actions`, `btn-dismiss`.

Verbatim badge rules (`error.scss:314-391`) — **this is the primary Phase-2 edit target**:
```scss
.error-badge-slick {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: #ffffff;                 /* NOT red-flooded */
    border: 1px solid #fecaca;
    border-left: 4px solid #ef4444;      /* red left accent */
    border-radius: 8px;
    cursor: pointer;
    transition: all 200ms ease;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
    min-width: 200px;
    max-width: 350px;
    animation: errorPulse 2s ease-in-out infinite;   /* pulsing red glow */

    &:hover { background: #fef2f2; border-color: #fca5a5; box-shadow: 0 4px 12px rgba(239,68,68,0.15); transform: translateY(-1px); animation: none; }
    &:active { transform: translateY(0); }

    .error-badge-icon {                  /* the "pink chip" */
        display: flex; align-items: center; justify-content: center;
        width: 32px; height: 32px;
        background: #fef2f2;
        border-radius: 8px;
        flex-shrink: 0;
        i { font-size: 16px; color: #ef4444; }
    }
    .error-badge-content { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .error-badge-title {
        font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 13px; color: #991b1b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        strong { font-weight: 600; color: #7f1d1d; }   /* the bold view name */
    }
    .error-badge-instance {
        font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
}
```
Dark mode (`error.scss:466-664`) re-skins the badge to `background:#1e293b`, `border-left-color:#f87171`, title `#fca5a5`.

**All values are raw hex / rgba — no `var(--...)` tokens used.** No prohibited legacy tokens (`--accent`, `--bg-1..5`, `--secondary`, `--terziary`, `--radius`, `--color`) appear in `error.scss`.

### ⚠️ Discrepancy with the reported screenshot (§5.1)
The committed `.error-badge-slick` is already a **white** badge with a thin light-red border, a red left-accent, a **pink icon chip** (matches the report), a pulsing glow, and a maroon title. It is **not** "red-flooded background with a heavy dark border". The pink chip + warning triangle + "Error in View: Unknown" match; the "red flood / heavy dark border" do **not** match HEAD (closest match is the dark-mode skin, dark bg). Before Phase 2, confirm the running build is on HEAD of this branch so the restyle targets the CSS that is actually shipping. Either way the file to edit is `error.scss` (light + dark blocks).

---

## Q5 — Available design tokens ✅

From `frontend/src/styles/tokens/_colors-light.scss` (+ `_colors-dark.scss`, `_typography.scss`, `_radius.scss`):

| Purpose | Token | Light value | Dark value |
|---|---|---|---|
| Danger base | `--color-error` | `#ef4444` (143) | `#f87171` |
| Danger hover | `--color-error-hover` | `#dc2626` (144) | `#fca5a5` |
| Danger bg | `--color-error-bg` | `#fef2f2` (145) | — |
| Danger muted | `--color-error-muted` | `rgba(239,68,68,.12)` (146) | `rgba(248,113,113,.15)` |
| Danger subtle | `--color-error-subtle` | `rgba(239,68,68,.06)` (147) | `rgba(248,113,113,.08)` |
| Surface (card/elevated) | `--color-bg-secondary` / `--color-bg-elevated` | `#ffffff` (81/83) | `#0f1012` / `rgba(255,255,255,.04)` |
| Subtle surface | `--color-bg-tertiary` | `#f1f5f9` (82) | `#16181a` |
| Border (neutral) | `--color-border-primary` | `#cbd5e1` (90) | `rgba(255,255,255,.08)` |
| Border subtle | `--color-border-secondary` | `#d1d9e3` (91) | `rgba(255,255,255,.04)` |
| Text primary | `--color-text-primary` | `#0f172a` (98) | `#f0f0f0` |
| Text secondary | `--color-text-secondary` | `#334155` (99) | `#a0a0a0` |
| Text tertiary | `--color-text-tertiary` | `#475569` (100) | `#606060` |
| Text placeholder | `--color-text-placeholder` | `#64748b` (101) | — |
| Accent (current, correct) | `--color-accent` | `#334155` (118) | `#94a3b8` |
| Mono font | `--font-mono` | `'IBM Plex Mono', Monaco, …` (`_typography.scss:16`) | — |
| Radius sm / md / lg | `--radius-sm`/`-md`/`-lg` | `4px` / `8px` / `12px` (`_radius.scss`) | — |

There is no dedicated `--color-error-border` or `--color-error-text`; use `--color-error` (icon/accent) + `--color-error-bg` (chip) + neutral border/text tokens.

**Legacy tokens** still exist elsewhere (do not propagate; not in `error.scss`): bare `--accent` in `redux/defaults/views.ts:249` and `EditorV2.scss:475/857/2183/2212/2228`; `--bg-1..3` in `variables.scss:65-67`; bare `--radius` in `views.ts` / `store.tsx:393` / a couple of components; bare `--color` in `variables.scss:24`. **`error.scss` is clean of all of these.**

---

## Q6 — Existing empty/error pattern to match ✅

Canonical centered pattern: **`frontend/src/components/ui/EmptyState/`** (`EmptyState.tsx` + `EmptyState.scss`), class root `jj-empty-state`. Structure = centered column: `&__icon-circle` (48px circle, `bi` icon) → `&__title` (14px/500) → `&__description` (12px, max-width 320px) → optional `&__action`/`&__action-btn` (slate gradient button) → optional `&__hints` (icon+text rows). Used via `components/editors/Empty.tsx` ("No element selected" etc.).

```tsx
<div className="jj-empty-state">
    <div className="jj-empty-state__icon-circle"><i className={`bi ${icon}`} /></div>
    <div className="jj-empty-state__title">{title}</div>
    <div className="jj-empty-state__description">{description}</div>
    {action && <div className="jj-empty-state__action"><button className="jj-empty-state__action-btn" onClick={action.onClick}>{action.label}</button></div>}
    {hints && <div className="jj-empty-state__hints">…</div>}
</div>
```
This is the structure/altitude Phase 2's calm centered error state should match (icon-circle + title + helper + optional action). Note it too uses raw hex, not tokens — Phase 2 can do better by using the tokens in Q5.

---

## Q7 — Icon library ✅

Bootstrap Icons, imported at **`frontend/src/index.tsx:7`** (`import 'bootstrap-icons/font/bootstrap-icons.css';`, pkg `bootstrap-icons@^1.13.1`). Convention is `<i className="bi bi-..." />`.

- `bi-exclamation-triangle-fill` — already used at `ErrorPortal.tsx:173` (the badge icon) and widely (`Toast.tsx`, `NotificationWidget.tsx`, `ProblemsPanel.tsx`, …).
- `bi-exclamation-triangle` (non-fill, requested for the redesign) — used in 20+ places (`ErrorModal.tsx:77`, `ConfirmDialog.tsx:55`, `ScriptBlock.tsx:1210`, …). Renders fine.
- `bi-x-lg` — modal close button (`ErrorPortal.tsx:66`).

---

## Q8 — Action feasibility ✅

**`Show details` — feasible now (already effectively exists).** Clicking the badge (`handleBadgeClick` → `setIsModalOpen(true)`) opens the `ErrorPortal` modal, which already shows `errorType`/`errorContext` (`.error-type`), the full `message` (`.error-details`), Instance/Class/Node info, and a `Dismiss` button. Phase 2 can keep/relabel this badge→modal behavior as the "Show details" affordance with zero architectural work.

**Error / stack availability.** The caught `Error` (with `.message` and `.stack`) is fully in scope upstream in `graphElement.tsx:displayError` (lines 664–700 parse `e.stack` for the source line/col). By the time it reaches the badge/modal it is the prebuilt `message: ReactNode` prop. So a detail view can surface the message today; surfacing a raw stack would mean threading `e.stack` through `DV.error` → `ErrorDisplay`/`ErrorPortal` (small, additive).

**`Reload view` — NOT feasible without new wiring → park it.** There is no re-render / re-evaluate / force-remount / error-boundary-reset / React-key-bump mechanism for a failed view anywhere in the pipeline. `DV.error` accepts a `clickRetry` param, but `DV.errorView` does **not** pass one, and `ErrorDisplay.onClick` only opens the modal — so retry is dead-ended. Ship the visual restyle + `Show details` in Phase 2; keep `Reload view` parked unless a retry path is built first.

---

## Q9 — Positioning / layering ✅

- **Badge**: `.error-badge-slick` has **no `position`/`top`/`left`/`z-index`** — it is `display:inline-flex` in normal flow, wrapped by `<Measurable draggable={true} resizable={false}>` at `DV.tsx:1758`. So its on-canvas placement (the "top-left" the user sees) and its draggability come from **`Measurable`**, not from CSS. **Implication for Phase 2**: moving to a *centered* state means changing the `<Measurable>` wrapper / its placement in `DV.tsx` (or overriding via CSS), not just editing `.error-badge-slick`. Dropping `draggable` is also a Phase-2 decision.
- **Modal**: `.error-notification-portal` is `position:fixed; inset:0; z-index:9998`, rendered via `createPortal(..., document.body)` — it escapes every canvas stacking context. No `.GraphContainer` (z-index:100) conflict.
- **Editor context**: this error UI appears in the **classic editor only** (`DV.error` ← `graphElement.tsx` ← classic `GraphContainer` in `ModelTab`/`MetamodelTab`/`WorkbenchCanvas`). The **v2-flow editor (`components/editor-v2/`) does not use `ErrorDisplay`/`DV.error`** (its only mention is a comment). `.GraphContainer` has no explicit z-index of its own; the badge sits at auto/0 within it, and the modal (9998 via portal) clears everything — no layering problem.

---

## Phase 2 readiness

**Render site confirmed and correct to target.** Phase 2 = restyle the badge into a calm centered error state.

**Files Phase 2 will touch:**
1. `frontend/src/common/error.scss` — `.error-badge-slick` + nested `.error-badge-*` (light block ~314-391 and the dark block ~466-664). Primary edit. Move to: neutral surface, `0.5px` slate border (`--color-border-primary/secondary`), red **only** on the icon (`--color-error`), drop the red flood / pulsing animation, demote the view name to a small mono chip (`--font-mono`, neutral bg).
2. `frontend/src/common/ErrorPortal.tsx` — `ErrorDisplay` JSX (lines ~162-185): change title copy `Error in View: …` → `This view couldn't render`; add a helper line; render the view name as a `view: {viewName||'unknown'}` mono chip instead of bold-red `<strong>`; keep `bi-exclamation-triangle`/`-fill`.
3. (If centering, not just restyling) `frontend/src/common/DV.tsx:1758` — the `<Measurable draggable resizable={false}>` wrapper governs placement; centering/removing-drag happens here, or via CSS override.
4. Tokens to use (Q5): `--color-error` (icon), `--color-error-bg` (icon chip), `--color-bg-secondary`/`-elevated` (surface), `--color-border-primary`/`-secondary` (0.5px border), `--color-text-primary`/`-secondary`/`-tertiary`, `--font-mono`, `--radius-md`/`-lg`. Match the `jj-empty-state` altitude (Q6).

**Buttons:**
- `Show details` — feasible (reuse/relabel the existing badge→`ErrorPortal` modal).
- `Reload view` — **parked**: no view-retry mechanism exists; building one is separate work.

**Pre-Phase-2 check (§5.1):** confirm the running build matches HEAD, since the committed badge is already a white/pink-chip style rather than the "red-flooded, heavy dark border" in the report.
