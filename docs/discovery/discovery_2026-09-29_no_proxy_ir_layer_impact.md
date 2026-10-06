# Layer Impact Report 2026-09-29: no L-proxy stored inside a view's IR (F1)

Prompt `P-2026-09-29-2121`, chat `C-2026-09-29-1840`, branch `no-proxy-ir` at `361eadedd`. Critical-zone
go-ahead (RC-30): `JJODEL_CRITICAL_ZONE_GOAHEAD=P-2026-09-29-2121` in the session. Written before the diff
(CLAUDE.md §3.2). Source: lane F1 of `docs/discovery/discovery_2026-09-29_ir_authoring_freeze.md` (`a50fa6607`,
§0 H1, §6 F1). Evidence: [M] measured in this lane, [R] read in code.

## 0. Answer in brief

- **What changes.** Three call sites and one new pure module, `frontend/src/model/unproxy.ts`:
  - `LViewElement.set_ir` (`view/viewElement/view.tsx`) passes the value through `unproxyDeep` before the
    `TRANSACTION`: every nested L object becomes its `id`. A value that cannot be mapped (the value itself an
    L object, an L object without a string id, a circular structure) is refused with a `Log.ee` naming the
    view and the path, and nothing is written, `appliableTo` included.
  - `irHash` (`viewpoint/ir/irCompile.ts`) and `U.compressedState` (`common/U.tsx`) stringify with
    `proxyToIdReplacer`, which writes an L object as its `id` and returns every other value untouched.
- **What does not change.** `Action.fire` (core, Rule 5): untouched. A value without proxies: `set_ir` writes
  the same reference as before, and both stringify calls produce byte-identical output, so compile-cache keys,
  the persisted `migratedHash` stamps and the saved state are unchanged.
- **Red, measured before the diff** [M]:
  - vitest `src/model/__tests__/unproxy.test.ts` on the tip's `irHash`: 2 failed, 14 passed (16); both reds
    are `irHash` reaching the fixture's budget («lazy L graph walked past 1000 gets»).
  - Lane probe on 3059, the discovery's fixture: 5/10. The LClass pin is stored as a proxy; Cmd+S leaves the
    page unresponsive from 5 s to past 30 s; with the proxy already stored, one `irHash` call does not return
    within 15 s. Id control: Cmd+S saves in 331 ms and the saved pin is the id.

**Decisions taken (unattended):**
- A circular structure is refused by `set_ir` along with an unmappable proxy: no save can serialize it.
- A top-level L object is refused by `set_ir` itself, with a message. Before, `Action.fire` refused it with
  «Attempted to set a proxy object inside the store»; the net effect, nothing stored, is the same.
- The replacer drops an L object without a string `id`, as `JSON.stringify` drops `undefined`: a lost node
  instead of a hung page. It logs nothing: the module is pure.
- Only arrays and plain objects are walked by `unproxyDeep`; any other object is kept as it is.

**Decisions awaiting Alfonso:** none. The go-ahead is in the session.

## 1. Layer Impact Report

```
LAYER IMPACT REPORT

Layers touched:
  [x] D-layer (Redux raw data)
  [x] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [x] Canvas v2-flow (ReactFlow nodes/edges)   -- only the IR compile-cache key
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [x] Persistence (VersionFixer / jsxString)   -- the save serialization only; no VersionFixer, no jsxString
```

**D-layer.**
- What changes: what `set_ir` writes to `DViewElement.ir`. A nested L object becomes its id; an unmappable
  value is not written.
- What does NOT change: the D shape of `ir`; every other writer of `ir` (below); `Action.fire`; `appliableTo`,
  still derived from `ir.kind` in the same `TRANSACTION`.
- Cross-layer interaction: none new. The `TRANSACTION` holds two `SetFieldAction`s and no creator, so Rule 12
  does not apply.
- Side-effect safety: the value is copied on write only where a proxy sat; a draft without proxies reaches
  `SetFieldAction` as the same reference as today.

**L-layer.**
- What changes: `LViewElement.set_ir`, the setter the proxy calls for `view.ir = draft`. It returns `false` on
  a refusal; the proxy's `set` trap ignores the return and returns `true` (`joiner/proxy.ts:476-481`), so a
  refused assignment throws nothing in strict code.
- What does NOT change: `get_ir`, `set_irStash`, every other setter.
- Cross-layer interaction: `unproxyDeep` reads `__isProxy` and `id` on an L object and nothing else. On the
  real handler both are cheap: `__isProxy` is a `switch` case, `id` its getter. `toJSON`, which
  `JSON.stringify` reads before any replacer, resolves to `c.data.toJSON`, undefined
  (`joiner/classes.ts:2432-2435`).

**Canvas v2-flow (IR compile cache).**
- What changes: `irHash` terminates on an IR holding an L object; the object hashes as its id.
- What does NOT change: the hash of any IR without proxies. The replacer returns every non-proxy value
  untouched, and `JSON.stringify` with such a replacer is byte-identical to a plain one. Pinned by a test over
  the three factory IRs and a pinned draft. That matters because `irHash` also produces the persisted
  `migratedHash` stamp (`irDefaults.ts:287-305`, VersionFixer 2.225 to 2.226) that `isMigratedDefaultView`
  compares against.
- Side-effect safety: `compileView`, `compileEdgeView` and `compileRowView` keep their cache keys.

**Persistence.**
- What changes: `U.compressedState` writes any L object in the state as its id. A project that already
  holds a proxy (written before this fix) saves in the normal time, and the saved state holds the id. After a
  reload the pin is a plain id: one save and reload heals such a project.
- What does NOT change: VersionFixer, `jsxString`, the saved format, the compression. On a state without
  proxies the string is byte-identical.
- Cost: a replacer function is called once per value of the state. Measured on the probe's saves (below).

**Not guarded by this lane, declared** [R]. These write `ir` on the D object directly, not through the L setter:
- the creation seeds: `view.tsx:512`, `utils/lastViewpoint.ts:246,414`;
- `utils/deriveViewpoint.ts:69`;
- `irDemoFixture.ts:134,140`;
- `DataManagerViewpointPanel.tsx:178`.

They write values the product builds from ids, not user drafts. `set_irStash` stays unguarded, as scoped. The
backstop for all of them is the replacer: none of them can hang a save or the compile.

## 2. Smoke-test scenarios potentially affected

- Authoring a vertex, edge or row view in the panels: `VertexAuthoringPanel.tsx:215,244`,
  `EdgeAuthoringPanel.tsx:206`, `RowAuthoringPanel.tsx:108`, `irTabs.tsx:185`, `SymbolEditorModal.tsx:397`,
  `EnableIRPanel.tsx:107`, `ObjectNode.tsx:790`, `DataManagerViewpointPanel.tsx:339`. Expected: their drafts
  carry ids, so `set_ir` writes the same reference as today. Covered by the existing vitest suites (drafts)
  and the probe's id control.
- Save, then reopen: identical state. The probe's id control saves in 331 ms today; the same arm after the
  fix must save in under 1 s with the id in the saved state.
- Migrated default views: `isMigratedDefaultView` compares the persisted stamp against `irHash`, which is
  byte-identical on proxy-free IRs (test).
- A project saved with a proxy in `ir` (the probe's `proxy-stored` arm): Cmd+S under 1 s and the id in
  the saved state; `irHash` of that `ir` under 50 ms.

## 3. Method

- vitest `frontend/src/model/__tests__/unproxy.test.ts`. The fixture is a Proxy whose every get returns a
  fresh proxy, so the graph never ends and `JSON.stringify`'s cycle check never fires. A budget throws at
  1000 gets. `__isProxy`, `id` and `toJSON` answer as the real handler does and are not counted.
  `compressedState` and `set_ir` cannot be executed there: `common/U.tsx` and `view.tsx` reach monaco through
  the `joiner` barrel (`window is not defined`). The probe covers them.
- Probe `frontend/scripts/smoke/_tmp_noproxy_save.ts`, gitignored, run by `lane-run probe --port 3059`. It
  runs on the discovery's fixture, copied as `_tmp_irfreeze_common.ts`. Log:
  `~/.jjodel-lanes/P-2026-09-29-2121/probe-noproxy-prefix.log`.
