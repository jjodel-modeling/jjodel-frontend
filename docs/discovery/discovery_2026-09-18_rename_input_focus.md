# Discovery — the inline rename input never receives focus after view creation

**Prompt**: `claude_2026-09-18_1650_prompt_view_quattro_difetti_minori.md`, item D fase 1
(P-2026-09-18-1650). Read-only phase: measure why the rename `<input>` shown right
after a view is created does not receive keyboard focus, on both creation paths.
No code change in this phase.

## Files read

- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` — `SubViewItem`
  (rename `<input>` render, ~`:1730`), `startRenameView` (~`:2223`), the focus
  `useEffect` keyed on `[renamingViewId]` (~`:2273`), the two creation call sites:
  class context-menu path via `createViewInWorkbench` (~`:1963`) and blank-view path
  via `createBlankViewInViewpoint` (~`:1975`).
- `frontend/src/redux/action/action.ts:349` — `SetFieldAction`/creator dispatch:
  `setTimeout(() => storee.dispatch({...this}), 0)`, i.e. every store write that
  drives the tree's re-render is scheduled on a macrotask, not applied synchronously.
- `frontend/scripts/smoke/states.ts` — `BASE_URL`, `NAV_MS`, `SETTLE_MS`, `seed`,
  `createProject` (probe fixture helpers).

## Method

Temporary instrumentation (`[RENAME-FOCUS]` prefixed `console.log`, 3 blocks, 5
lines) in `startRenameView`, in the focus effect, and in `SubViewItem`'s render
(a probe `useEffect` keyed on `isRenaming`) — see the fase-1 prompt for the exact
lines. Driven by a disposable Playwright script,
`frontend/scripts/smoke/_tmp_rename_focus_probe.ts` (gitignored, not committed),
against the live dev server (`localhost:3000`). The script builds a metamodel with
two classes and one viewpoint via the D/L layer, opens the v2 tab, then for each
path clicks the viewpoint row's `+`, picks the dialog radio (`A class` / `All
classes (default view)`), clicks `Create View`, and reads the `[RENAME-FOCUS]`
console lines plus `document.activeElement` at +0/+50/+300 ms.

Run twice: once before this session (see the prior session's transcript) and once
in this session, both against the same code. Both runs agree on every qualitative
point; the two numeric tables below are the two runs, kept separate rather than
averaged, because the second run's absolute lag differs from the first (expected —
this is a race against an async dispatch, not a fixed delay).

## Measurements

### Q1 — is `renameInputRef.current` null when the effect fires?

**Yes, on both paths, both runs.** Every `effect view=… ref=` line reads `NULL`.
The `<input>` does not exist in the DOM yet at the point the effect body runs.

### Q2 — does the input mount in a later render than the `setState` that starts the rename?

**Yes, on both paths, both runs.** The `SubViewItem` rename-input mount
(`isRenaming` probe effect) always fires strictly after `startRenameView`'s own
log line and after the parent's focus-effect log line — never in the same
`console.log` batch.

Session 1 (prior run, both paths):

| path | `startRenameView` ts | parent effect ts (ref=NULL) | input mount ts | mount lag vs effect |
|---|---|---|---|---|
| 1-class | 24916.9 | 24918.7 | 25024.3 | **+105.6 ms** |
| 2-blank | 32533.7 | 32535.0 | 32832.0 | **+297.0 ms** |

Session 2 (this session, re-run, both paths):

| path | `startRenameView` ts | parent effect ts (ref=NULL) | input mount ts | mount lag vs effect |
|---|---|---|---|---|
| 1-class | 25435.1 | 25436.6 | 25601.6 | **+165.0 ms** |
| 2-blank | 33000.9 | 33002.0 | 33099.8 | **+97.8 ms** |

The lag is never zero and never negative in either run: the parent effect that
tries to focus the input always runs in a commit that predates the child's own
mount, by 98–297 ms depending on run and path. This is consistent with
`action.ts:349`'s `setTimeout(…, 0)`: the store write that adds the new view (and
lets `SubViewItem` render it) is a macrotask, scheduled after the synchronous
`setState(renamingViewId)` that the same click handler issues. React runs the
parent's `useEffect([renamingViewId])` in the commit produced by that synchronous
`setState`, before the macrotask-scheduled store write has even landed.

### Q3 — if focus IS applied, who takes it afterwards?

**Focus is never applied in the first place** — this is stronger than "applied
then stolen." In both runs, on both paths, the `"[RENAME-FOCUS] focus()+select()
called"` line — logged only inside the effect's `if (renamingViewId &&
renameInputRef.current)` guard — **never appears**. The guard's own condition is
false (ref is null, per Q1), so `.focus()`/`.select()` are never invoked at all.

`document.activeElement` at +0/+50/+300 ms after the effect, both runs, both
paths:

| path | +0ms | +50ms | +300ms |
|---|---|---|---|
| 1-class (session 1) | BODY | BODY | BODY |
| 2-blank (session 1) | BODY | BODY | BODY |
| 1-class (session 2) | BODY | BODY | BODY |
| 2-blank (session 2) | BODY | BODY | BODY |

`document.body` stays active through all three checkpoints on every run: no other
element ever takes focus either — there is no competing focus-stealer here, just
an effect that no-ops because its dependency fires before its target exists.

### Q4 — same behaviour on both paths?

**Yes.** Class-context-menu path (`:1963`) and blank-view-via-`+` path (`:1975`)
show the identical sequence: `startRenameView` → effect (ref NULL, no `.focus()`
call) → input mounts later → `activeElement` stays `BODY` throughout. Only the
absolute lag differs (see Q2 table), which tracks the two paths going through
different call chains before the same async store dispatch, not a difference in
the bug itself.

## Falsifies

An existing code comment at the blank-view creation site asserts React 18
automatic batching makes the store dispatch and the `SubViewItem` mount land in
the same commit. The measured mount lag (98–297 ms, both paths, both runs)
contradicts this: the child's mount is gated on the store's `setTimeout(…, 0)`
dispatch (`action.ts:349`), landing in a strictly later commit, not the same one.
`startRenameView`'s own `setState` calls do appear to batch with each other
(single log line, no split), but that is a different claim than "the new view's
row exists at that point."

## Proposed fix (fase 2, not started)

Move the focus call off the parent's `useEffect([renamingViewId])` — which fires
too early, on a stale render where the row does not exist — onto the input's own
mount, inside `SubViewItem`, keyed on `isRenaming`:

```typescript
// inside SubViewItem, near the rename <input> render
useEffect(() => {
    if (isRenaming && renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
    }
}, [isRenaming]);
```

The parent effect's `if (renamingViewId && renameInputRef.current)` block would be
removed (dead once the ref it reads is never populated at that point); the
`setRenamingViewId`/`setRenameValue`/`setIsFirstRename` calls in `startRenameView`
are unaffected.

**Cost**: 1 file (`TreeViewContent.tsx`), one effect moved from the parent
component into `SubViewItem`, net roughly 6 lines added / 4 removed. No new
dependency, no D/L or sync-layer surface (§3.1 not touched — this is local
component state only). No test is executable for this file under vitest (imports
through `joiner` → `window is not defined`, same constraint as items A and C);
the verification is the same Playwright probe used for fase 1, re-run after the
fix with a fifth check — `document.activeElement === the rename input` at +50ms —
added as the pass/fail line, then the probe and its screenshots discarded (not
committed, gitignored). Risk: low — the moved effect only reads/writes the same
ref and the same `renamingViewId`/`isRenaming` state already in scope in
`SubViewItem`; no new coupling introduced.

## Open questions

- Whether `isFirstRename`'s select-all-text behavior (used to prefill a new
  view's default name for full-text replacement) needs to be re-derived inside
  `SubViewItem`, or can stay read from props as-is — fase 2 should check this
  before writing the diff.
- Whether the parent effect's block should be deleted outright or left as an inert
  no-op guard for a future case where the ref happens to be populated already
  (e.g. renaming an existing, already-mounted view) — that path was not measured
  here since fase 1 only covers the two creation flows named in the prompt.
