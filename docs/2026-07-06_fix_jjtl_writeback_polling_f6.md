# Fix JjTL write-back timing (F6): poll for Redux propagation instead of a fixed 1000ms delay

Read `CLAUDE.md` first and follow it. If anything in this prompt conflicts with `CLAUDE.md`, stop and report the conflict. Execute AFTER the visual gate in `docs/2026-07-06_gate_visivo_jjtl_binding.md` has passed.

## COSA

STEP 8/8b of the transformation write-back runs inside a fixed `setTimeout(..., 1000)`. The store commit is asynchronous (see `docs/discovery/2026-07-05_ecore_xmi_roundtrip_audit.md`, harness learnings), so on large models the LModel proxy may not yet expose all created objects after 1 second: lookups fail with "Object not found in model" and attributes or references are silently lost. This is the intermittent failure mode F6 in `docs/discovery/2026-07-05_jjtl_binding_audit.md`.

Replace the single fixed delay with a bounded poll: wait until the created objects are visible through the LModel proxy, then run the existing STEP 8/8b body unchanged.

One atomic commit.

## DOVE

Single file: `frontend/src/components/project/ProjectEditor.tsx`, inside `handleExecuteTransformation`, the block currently guarded by `if ((pendingAttributeSets.length > 0 || pendingReferenceSets.length > 0) && createdModelId)`. Do not touch STEP 6, STEP 6b (DVertex), the tab-open timeout, or the executor.

## COME

1. Add a small local helper (function declaration inside `handleExecuteTransformation`, no export, no new file):

```ts
const waitForObjects = (modelId: string, expectedCount: number, timeoutMs: number, onReady: (lModel: LModel) => void): void => {
    const started = Date.now();
    const tick = () => {
        const lModel = LPointerTargetable.fromD(modelId) as LModel;
        const count = lModel?.objects?.length ?? 0;
        if (count >= expectedCount) { onReady(lModel); return; }
        if (Date.now() - started >= timeoutMs) {
            console.warn(`[ProjectEditor] waitForObjects timeout: ${count}/${expectedCount} objects visible after ${timeoutMs}ms; proceeding with partial write-back.`);
            onReady(lModel);
            return;
        }
        setTimeout(tick, 100);
    };
    setTimeout(tick, 100);
};
```

2. Replace the `setTimeout(() => { ... }, 1000)` wrapper of STEP 8/8b with `waitForObjects(modelId, instancesCreated, 5000, (lModel) => { ... })`. The body stays byte-identical except: the body's own `LPointerTargetable.fromD(modelId)` lookup and its null-check can be removed since `lModel` now arrives as the callback argument (keep a guard `if (!lModel) { console.error(...); return; }`).

3. Grep first to confirm `waitForObjects` is not an existing identifier:

```bash
grep -rn "waitForObjects" frontend/src/
```

4. Before the commit: `cd frontend && npm run build` must pass with no NEW errors over the 26-error baseline.

Commit: `fix: poll for object propagation before transformation attribute/reference write-back`

### HARD STOP

Show the diff and stop before committing. Visual gate for Alfonso: rerun Fase A and Fase B of `docs/2026-07-06_gate_visivo_jjtl_binding.md` (outcome must be identical, just no longer timing-dependent); optionally a larger source model (50+ objects) to exercise the polling path. After confirmation, update `docs/claude-code-log.md`.

## RIFERIMENTI

- Audit F6: `docs/discovery/2026-07-05_jjtl_binding_audit.md`.
- Current fixed delay: `ProjectEditor.tsx`, STEP 8 guard (search for `pendingAttributeSets.length > 0 || pendingReferenceSets.length > 0`), `}, 1000);` at the end of the block.
- `instancesCreated` is already in scope in `handleExecuteTransformation`.
- Async store commit evidence: `docs/discovery/2026-07-05_ecore_xmi_roundtrip_audit.md`.
- Scope: `git add frontend/src/components/project/ProjectEditor.tsx` only, plus the log after the gate.
