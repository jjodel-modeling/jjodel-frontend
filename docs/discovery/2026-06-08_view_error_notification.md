# Discovery — View-template error → system notification (read-only)

**Date**: 2026-06-08
**Type**: discovery, read-only. **No source was modified.**
**Goal of the follow-up (NOT this prompt)**: when a view template (`jsxString`) errors in the Classic editor, in addition to the existing inline error badge, emit **one deduped** toast into the existing Toast/Bell system.
**This report only confirms viability and maps the seams.** No implementation proposed.

---

## TL;DR — viability verdict

**The hook point is viable.** The badge is rendered by `ErrorDisplay` (a `forwardRef` **function** component in `frontend/src/common/ErrorPortal.tsx`). It is a **stable, module-level imported component** that is *returned* by the error path and rendered in the **real React tree** by `graphElement.tsx`'s `render()` — it is **not** defined inside the `jsxString` template. Proof: `ErrorDisplay` already uses `useState` (`ErrorPortal.tsx:133`) and its child `ErrorPortal` already uses `useEffect` (`ErrorPortal.tsx:36`), and both work today (the modal opens/closes). Adding a `useEffect` to `ErrorDisplay` is therefore safe and does **not** repeat the `ClassicZoomBridge`-in-template regression.

**Two important constraints the implementer must know:**

1. **No stable numeric id reaches the badge.** `ErrorDisplay` receives only **strings** (`viewName`, `dname`, `nodename`, `dataClassName`, `errorContext`, `errorType`) plus the `message` ReactNode. The view id (`v.id`) and the model-element id exist **upstream** at the `DV.error(...)` call site, but threading them into the badge requires editing **`DV.tsx`** — which the follow-up explicitly avoids. So the de-dup key must be built from the existing string props (see Q2).
2. **De-dup must be module-level + time-throttled.** There is **one `ErrorDisplay` per affected node**, and the element is re-created on every template recompile/re-evaluation. A naive `useEffect([])` would fire once per node *and* re-fire on remounts → toast storm. Confirmed below.

**Out of scope for the follow-up (not implemented today):** the inline "Ask Jjodie" toast action — the `jodie:open` listeners ignore any `detail` payload, so there is no input-prepopulation path (Q5).

---

## Q1 — Badge component nature (hook-point viability)

**Files**
- Badge + modal component: `frontend/src/common/ErrorPortal.tsx`
- Styles: `frontend/src/common/error.scss` (badge `.error-badge-slick` at `error.scss:315`; modal `.error-notification-portal` at `error.scss:210`)

**The screenshot badge** (`Error in View: <name>` + `on <instance>` + chevron) is the `error-badge-slick` block, rendered by **`ErrorDisplay`**, *not* by `ErrorPortal`:

```tsx
// ErrorPortal.tsx:165-186  (rendered INLINE in the React tree — NOT a portal)
<div ref={ref} className='error-badge-slick' tabIndex={0} onClick={handleBadgeClick} ...>
  <span className="error-badge-title">
    Error in View: <span className="error-badge-name">{viewName || 'Unknown'}</span>
  </span>
  {instanceInfo && <span className="error-badge-instance">on {instanceInfo}</span>}
  <i className="bi bi-chevron-right error-badge-hint" .../>
</div>
```

- **Portal?** The **badge is NOT a portal** — it renders inline. The **modal** (`ErrorPortal`, the "Something Went Wrong…" overlay shown on badge click) *is* a portal: `return createPortal(errorContent, document.body);` (`ErrorPortal.tsx:103`). So the prompt's phrase "portal component that renders the badge" maps to **`ErrorDisplay`** (the function component that owns the badge **and** mounts `ErrorPortal`). The `useEffect` for the toast belongs in **`ErrorDisplay`**, because it mounts as soon as the error appears, independent of whether the modal is open.
- **Function or class?** `ErrorDisplay` is a **function component** via `React.forwardRef` (`ErrorPortal.tsx:122`) → can use hooks. `ErrorPortal` is also a function component (`ErrorPortal.tsx:17`).
- **Real tree or inside the template?** **Real React tree.** `ErrorDisplay` is imported as a normal module symbol in `DV.tsx` (`import { ErrorDisplay } from "./ErrorPortal";` — `DV.tsx:29`) and returned by `DefaultView.error(...)` (`DV.tsx:1757-1771`). That return value bubbles up through `displayError → DV.errorView → renderView → render()` (see Q2) and is rendered by React in the real component tree. It is **not** a tag inside the `jsxString` string and is **not** resolved via `windoww[name]`, so React's hook rules hold (unlike `ClassicZoomBridge`, which was *defined inside* the template). Confirmed by the already-working `useState`/`useEffect` in the file.

---

## Q2 — Error capture and data shape

### Where the view-template error is caught

Two distinct capture sites, both funnel into the same badge:

1. **Compile-time** (parsing `jsxString` into the `JSXFunction`), `try/catch` in the reducer:
   ```ts
   // reducer.ts:993-1006
   const body = 'return (' + UX.parseAndInject(DSL.parser(dv.jsxString), dv) + ')';
   try { tv.JSXFunction = new Function(paramStr, body) as ...; }
   catch (e:any) {
       console.error('error jsxparse', {vid, e, paramStr, body});
       tv.JSXFunction = (context) => GraphElementComponent.displayError(e, 'JSX Syntax', dv);  // :1005
   }
   ```
   (A sibling `Measurable … Syntax` compile-error path exists at `reducer.ts:1067`.)

2. **Runtime** (executing the compiled template), `try/catch` in the renderer:
   ```ts
   // graphElement.tsx:1369-1375
   try { rnode = this.getTemplate3(vid, v, context); }
   catch (e:any) {
       rnode = GraphElementComponent.displayError(e, "JSX Semantic", v.__raw,
                 this.props.data?.__raw, this.props.node?.__raw, false, {context});
   }
   ```
   The template itself runs at `graphElement.tsx:731` (`tv.JSXFunction.call(context, context)`), and the result is cached in `tnv.jsxOutput`.

**The funnel** (both sites → badge):
`GraphElementComponent.displayError(...)` (`graphElement.tsx:664`) builds the error message/code-frame, then returns
`DV.errorView(...)` (`DV.tsx:573`) → `DefaultView.error(...)` (`DV.tsx:1738`) → the `'classic'` switch branch returns:

```tsx
// DV.tsx:1757-1771   (notificationType === 'classic' is the ACTIVE constant, DV.tsx:33)
<Measurable draggable={true} resizable={false}>
  <ErrorDisplay viewName={v?.name} viewpointName={viewpointname}
    errorType={errortype} errorContext={on} message={msg}
    dname={dname} nodename={nodename} onClick={clickRetry}
    dataClassName={data?.className} />
</Measurable>
```

### What data reaches the badge (props of `ErrorDisplay`, `ErrorPortal.tsx:110-120`)

| Need | Prop | Source (in `DV.error`, DV.tsx) | Notes |
|------|------|--------------------------------|-------|
| view name (`EdgeAssociation`) | `viewName` | `v?.name` | string |
| element / context (`nextState: E`) | `errorContext` / (`dname`+`nodename`) | `on` = `" on " + dname + " / " + nodename` (`DV.tsx:1744`); badge re-formats as `dname: nodename` (`ErrorPortal.tsx:158-160`) | strings |
| underlying error message | `message` | `msg` (a **ReactNode**: code-frame `<div>` + `@ line/col`, built in `displayError`, `graphElement.tsx:696-704`) | ReactNode, not a string |
| data class | `dataClassName` | `data?.className` | string |

**Stable ids — what is actually available:**
- **view id**: **NOT passed to the badge.** Only `viewName` (string) is forwarded. The id exists upstream as `v.id` / `v.__raw.id` at the `DV.error`/`displayError` call site, but reaching it from `ErrorDisplay` requires adding a prop **threaded through `DV.tsx`** (out of scope).
- **element / model id**: **NOT passed.** `data` (`DModelElement`) is available in `DV.error`, but only `dname` (name, truncated to 7 chars + `…` at `DV.tsx:1742`) and `dataClassName` are forwarded — no raw id.

**Most stable distinct-error key obtainable WITHOUT touching `DV.tsx`:**
```
`${viewName}|${dataClassName}|${dname}|${nodename}|${errorType}|${errorContext}`
```
`errorContext` already encodes the instance/node, and `dname` is the (truncated) element name — there is **no** numeric `viewId`/`elementId` in the badge's props. Optionally fold in a hash of the `message` text (extract via a `nodeToString`-style walk — see the helper at `ToastContext.tsx:9-18`); the message includes `@ line N, col M`, which makes the key *more* specific per defect. If a strictly stable `viewId | elementId | messageHash` key is required, **`DV.tsx` must be edited to forward `v.id` and the element id** — flag this as a scope decision.

**Mount vs remount while the error persists:**
- `getTemplate3_` caches the output: `if (!tnv.shouldUpdate && tnv.jsxOutput) return tnv.jsxOutput;` (`graphElement.tsx:726`). While `shouldUpdate` is false, the same cached `ErrorDisplay` element is returned → React keeps it **mounted** (state preserved, a `useEffect([])` fires once).
- BUT on any recompile / re-evaluation (data change, zoom, `VIEWS_RECOMPILE_jsxString`, force-rerender) a **fresh** `ErrorDisplay` element is produced (`displayError` runs again). Same-type-same-position reconciliation usually preserves the instance, but **virtualization / view-switch / key changes can remount it**, re-firing the effect.
- Critically, there is **one `ErrorDisplay` per affected node** — a broken view applied to N nodes mounts N badges → N effect fires.

**⇒ Conclusion:** de-dup **must** be module-level and **time-throttled** (a tiny `Map<key, lastTs>` with a window of, say, a few seconds) to collapse both the multi-node storm and remount re-fires. A per-component `useEffect` guard alone is insufficient.

---

## Q3 — Classic vs Flow v2

**Classic editor only.** `ErrorDisplay`/`ErrorPortal` is imported and rendered **only** from `DV.tsx:29` / `DV.tsx:1759` (via `DV.error`), reached only through `GraphElementComponent.displayError`. `GraphElementComponent` lives in the classic graph stack (`graph/`, `model/`, `joiner/`, `UX.tsx`) and has **zero** references under `frontend/src/components/editor-v2/` (grep clean). The two mentions of "ErrorDisplay" in `EditorV2.tsx` (`:706`, `:3051`) are **comments** about measurement oscillation, not renders. The v2-flow editor renders its own React-Flow custom nodes (`ClassNode`, etc.), not `jsxString` view templates, so this error path does not fire there. **Single mount point: the Classic-editor view-template render.**

---

## Q4 — Notification entry point from inside a component

**Cleanest fire-and-forget (recommended): `toast` from `frontend/src/components/Toast/toastDispatch.ts`.** No React context needed; it dispatches the `jjodel:toast` CustomEvent. It is also the **only** entry point that supports an **action button**.

```ts
// toastDispatch.ts — usable anywhere
import { toast } from '../../components/Toast/toastDispatch';
toast.error(message, { title, action: { label, onClick } });   // object form
// or toast({ message, priority: 'error', title, action })
```

**Payload the `ToastProvider` listener expects** — an **OBJECT**, `JjodelToastDetail`, NOT a `type£title£message` string:
```ts
// ToastContext.tsx:120-137  (listener on JjodelEvents.TOAST = 'jjodel:toast')
const detail = (e as CustomEvent<JjodelToastDetail>).detail;        // {priority,title?,message,dismiss?,duration?,action?}
addToastRef.current(detail.message, detail.priority,
   { title: detail.title, dismiss: detail.dismiss, duration: detail.duration, action: detail.action });
```
`JjodelToastDetail` shape: `toastTypes.ts:95-102`. Event constant: `registry.ts:54` (`TOAST: 'jjodel:toast'`).

**Alternatives:**
- `U.alert('e', title, message)` (`U.tsx:388-405`) — deprecated facade; dispatches the **same object** `{priority,title,message}` but **drops `action`** (no button). Already used in DV's *inactive* `'notification'`/`'alert'` branches (`DV.tsx:1750,1774`); the active `'classic'` branch fires **no** toast today.
- Raw `dispatchEvent(new CustomEvent(JjodelEvents.TOAST, { detail }))` — what `toast`/`U.alert` do under the hood.

**Action-button support:** **Yes.** `ToastAction = { label: string; onClick: () => void }` (`toastTypes.ts:7-10`), threaded end-to-end (`toastDispatch` → `ToastContext` → `Toast`) and rendered as `jj-toast__action` (`Toast.tsx:125-129`).

**Bell synergy (free):** `error`/`warning` toasts are written to Bell history automatically (`ToastContext.tsx:77-86` → `toastHistory.add`, capped at `MAX_HISTORY = 20`, `toastHistory.ts:4,56`). So an `error` toast lands in the Bell with no extra work. No content-dedup exists in `ToastContainer` (it only `.slice(0, MAX_TOASTS=5)`, `ToastContext.tsx:38,75`) — another reason the follow-up's own dedup is required.

---

## Q5 — "Ask Jjodie" inline action status

**Not implemented.** No `Ask Jjodie` / `Ask Jodie` string, and no `jodie:open` reference, exists anywhere in the Toast files or in `U.tsx`/`DV.tsx` (grep clean).

- The toast **mechanism** to attach an action exists generically (`action: { label, onClick }`, Q4) — so an action *could* be added by the follow-up.
- However, the Jodie open listeners **ignore the event payload**: both `Jodie.tsx:138-146` (`handleOpenJodie = () => setChatState(... isOpen:true ...)`) and `JjodieWidget.tsx:159-166` (`handleOpenEvent = () => setIsOpen(true)`) take **no `detail`** and only open the panel. There is **no input-prepopulation path** today.
- Event constant: `JjodieEvents.OPEN = 'jodie:open'` (`registry.ts:89`).

**⇒** An action that merely *opens* Jodie is feasible (`dispatchEvent(new CustomEvent(JjodieEvents.OPEN))`), but **pre-populating Jodie's input with the error text is NOT possible without new code inside the Jodie components** (reading `event.detail`). That wiring is **out of scope** for the badge-only follow-up. Recommend: ship the toast (+ Bell) without the Jjodie action, or scope a separate task for the Jodie payload wiring.

---

## Q6 — Existing dedup/throttle utilities

- **lodash** is available (`package.json:46`, `lodash@^4.17.21`) → `_.throttle` / `_.debounce` exist, but they throttle a **single function**, not **per-key** — wrong granularity for "one toast per distinct error identity."
- **`frontend/src/utils/DragThrottle.ts`** is a `requestAnimationFrame`-based, per-string-key throttle built for drag/resize (`throttleStates: Map<string, ThrottleState>`, RAF-driven). Not suitable for a multi-second error-identity window.
- **No** in-house time-windowed per-key dedup utility was found.

**⇒ Recommendation:** a **tiny colocated module-level map** in (or next to) `ErrorPortal.tsx`, e.g. `const lastFired = new Map<string, number>();` keyed by the Q2 key, gating on `now - last > WINDOW_MS`. Do **not** pull in lodash for this. (Note: scripts/components here have access to `Date.now()` normally — the `Date.now()` prohibition only applies to Workflow scripts, not app code; `ToastContext.tsx:58,71` already uses `Date.now()`.)

---

## Cross-references / hard-stop files (do NOT edit in the follow-up unless re-scoped)
`graphElement.tsx`, `DV.tsx`, `Measurable`. The follow-up's edit target is **`ErrorDisplay`** in `frontend/src/common/ErrorPortal.tsx` (the prompt lists `ErrorPortal`/`ErrorDisplay` as read-only **for this discovery only**; the follow-up will add the `useEffect` there). Note `error.scss` needs no change (no new DOM).

## Key line references (quick index)
- Badge JSX: `ErrorPortal.tsx:165-186` · ErrorDisplay fn component: `:122` · existing `useState`: `:133` · modal `createPortal`: `:103` · `useEffect` (modal): `:36`
- `error.scss`: badge `:315`, modal `:210`
- Capture (compile): `reducer.ts:1005` (+`:1067`) · Capture (runtime): `graphElement.tsx:1369-1374` · template exec: `:731` · cache: `:726`
- Funnel: `displayError` `graphElement.tsx:664` → `DV.errorView` `DV.tsx:573` → `DefaultView.error` `DV.tsx:1738` → classic branch `:1757-1771` (active const `:33`)
- Toast: dispatch `toastDispatch.ts:71-106` · listener `ToastContext.tsx:120-137` · detail type `toastTypes.ts:95-102` · `ToastAction` `:7-10` · action render `Toast.tsx:125-129` · Bell history `ToastContext.tsx:77-86`, cap `toastHistory.ts:4`
- `U.alert`: `U.tsx:388-405` · `JjodelEvents.TOAST` `registry.ts:54` · `JjodieEvents.OPEN` `registry.ts:89` · Jodie open listeners `Jodie.tsx:138-146`, `JjodieWidget.tsx:159-166`
