# Layer Impact Report: JjTL output tab opened after the write-back (P-2026-11-03-1232)

**Prompt-ID**: P-2026-11-03-1232. **Prompt**: `docs/prompts/claude_2026-11-03_1232_prompt_*` (the commit `6571f548a` adds it).
**Chat**: C-2026-11-03-1020. **Tree**: `~/jjodel-w-jjtltab`, branch `jjtl-output-tab-late`, HEAD `6571f548a` at the start.
**Ticket**: #475. **Evidence base**: `docs/discovery/discovery_2026-11-03_jjtl_writeback_time.md` §0, §6 (candidate A);
the log entry of P-2026-11-03-1137 (`docs/log-inbox/hw-notation.md`).

Written before any edit. Line numbers are those of `6571f548a`. None of the files of `CLAUDE.md` §3.1 is edited; the report
is owed because what `useJjomSync` receives, and when, changes (prompt, DOVE).

## What changes, read on the code

Today STEP 7 (`ProjectEditor.tsx:1922-1943`) schedules `DockManager.open2` on a fixed `setTimeout(2000)` right after the
STEP 6 `TRANSACTION`, before STEP 6b and before the STEP 8 timer (`:1984-2357`) that runs the nested walk (STEP 6c), the
nested-attribute writer and the pointer writes. When the tab mounts, `useJjomSync` Step 2bis (`useJjomSync.ts:741-772`,
read, not edited) makes one `DVertex.new` per object of the model that has no vertex yet, in one synchronous loop. With the
tab open at +2 s that loop runs once per level as the walk delivers the objects; after the flush per level of
P-2026-11-03-1137 the walk delivers them sooner, so the loop meets more objects at once (the regression of that entry).

The change: STEP 7 opens the tab when the write-back has ended (walk, nested attributes, pointers), also when it fails,
never before the old 2 s floor. A write-back with nothing to do keeps today's timing. The toast counts roots plus nested
objects.

## LAYER IMPACT REPORT

```
Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)  (indirect: the output graph mounts on a finished model)
  [ ] Canvas classic
  [x] Sync layer (useJjomSync hooks)    (indirect, not edited: the timing of its input)
  [ ] Persistence (VersionFixer / jsxString)
```

### Canvas v2-flow and sync layer
- What changes: when the output graph mounts. `useJjomSync` meets the whole tree at mount instead of growing it level by
  level, so Step 2bis creates every missing vertex in one loop, and `useM1ReferenceEdges` meets every pointer already
  written instead of pointers arriving after mount.
- What does NOT change: no hook, guard, key or dependency of `useJjomSync.ts`, `useM1ReferenceEdges.ts`, `syncState.ts`,
  `portDistribution.ts` is edited. STEP 6b still makes the root vertices outside any `TRANSACTION`; no `TRANSACTION` is
  added around a creator (NN-12). The auto-population is not touched (prompt item 3).
- Cross-layer interaction: the D-layer writes of the write-back no longer interleave with the vertex creation of the
  auto-population; the model the canvas reads at mount is the final one.
- Side-effect safety: the same vertices and edges are created, by the same code, later. Risk: the cost is paid in one
  block at mount and may freeze the UI as long as today, only later (report §6). Measured by the probe, not assumed.

### D-layer
- Not touched: the walk, the writer and the pointer writes are unchanged in content and order; only `open2` and the toast
  move. `markDirty` moves with them.

## Smoke-test scenarios potentially affected

- JjTL run with nested creations (`b7_7`, `b10_8`, `b11_9`, `c60`): every object and `num` written, tab opens after.
- JjTL run with no nested creation and no pending sets: tab at +2 s as today.
- Forced failure of the attribute writer: tab still opens, panel line shown.
- Save, reopen: same `out1` tree.

Uncertain about propagation: the canvas cost at mount is the open point; if spreading it needs a §3.1 file, stop and ask.
