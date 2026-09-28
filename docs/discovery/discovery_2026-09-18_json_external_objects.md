# Issue #128 — M1 JSON export and externally referenced objects

Date: 2026-09-18. Base: `4e9192349` (`staging`), branch
`fix/128-json-external-objects`. Working tree clean at resumption.
Issue: https://github.com/jjodel-modeling/jjodel-frontend/issues/128

## Objective and hypothesis

Hypothesis: the M1 serializer emits cross-model `$ref` values without visiting
their targets. Acceptance criterion: every reference to a resolvable `DObject`
reachable from the exported model has exactly one object definition in the
document, including transitive references and containment, even with cycles.
Objects not reachable from the selected model must not be pulled into its export.

## Files read and evidence (line numbers before the fix)

- `frontend/src/services/export/JsonModelService.ts:359-376`:
  `const objects = (model.objects || []).filter((o: LObject | null) => !!o) as LObject[];`
  The root set contains only the selected model's objects. The containment scan
  does not collect non-containment targets.
- Same file, `:424-428`: `// Cross-reference: emit id pointers as { $ref: objectId }.`
  and `.map((v) => ({ $ref: v as string }));`. No target traversal occurs here.
- Same file, `:531-546`: `resolveObject` already resolves raw ids through
  `store.getState().idlookup` and checks `className === 'DObject'` before wrapping
  with `LPointerTargetable.fromD`. Reuse this boundary, without reading proxy
  `values`, which can contain circular data.
- `frontend/src/model/logicWrapper/LModelElement.tsx:5680-5683`:
  `get_objects(context: Context, includeCrossReferences: boolean = false)` reads
  `context.data.objects`. Enabling cross references would include entire model
  dependencies; this is broader than the reachable objects required by the issue.
  The shortened `frontend/src/model/LModelElement.tsx` path in the project
  reference does not exist; the path above was located with `rg --files`.
- `frontend/src/components/project/ProjectEditor.tsx:806-808`: the model export
  invokes `JsonModelService.exportToFile(model, 'model')`.
- Same file, `:847-850`: full megamodel definitions invoke `buildModelDocument`.
- `frontend/src/services/JjodieContext.ts:359`: the AI context uses
  `buildModelDocumentLight`, which calls the same full builder and trims metadata.
- `docs/json-export-schema.md:265-271` explicitly documents the current dangling
  cross-model reference limitation. Read in full; this is the integration contract.
- `frontend/src/services/export/__tests__/ecore-io.test.ts`,
  `frontend/vitest.config.ts`, `frontend/package.json`, `frontend/tsconfig.json`:
  existing test setup uses Vitest in Node. The new tests must execute the public
  serializer, mocking only the store/proxy boundary and browser download APIs.
- Operational context: root `AGENTS.md` / `CLAUDE.md`, `docs/PROTOCOL.md`,
  process decisions and relevant export searches in `docs/decisions.md`, latest
  ten entries in `docs/claude-code-log.md`.

## Implementation boundary and compatibility

Collect the reachable M1 graph before rendering containment trees. Keep the
selected model's roots in `objects`; emit additional reachable roots under the
optional `externalObjects` array, with the same object shape. Discover containment
before rendering so a target encountered through a non-containment reference first
is still nested under its reachable container. Guard collection and serialization
by object id; repeated containment visits emit `$ref` rather than recurse forever.
Serialize the entire object closure before draining `externalMetamodels`, so actual
foreign classes discovered on external objects bring their definitions too.

No format version bump: `externalObjects` is additive, absent when unused, and
the documented versioning policy requires consumers to tolerate optional fields.
Consumers resolving `$ref` must index both arrays and their nested `children`.
The light model document preserves external object definitions and ids.

No core, proxy, sync, view, persistence, or UI write-path change. No migration or
Layer Impact Report required. Both UI export paths reuse the public service;
neither `ProjectEditor.tsx` nor `JjodieContext.ts` needs an edit.

Unresolved/deleted ids remain `$ref` values, as before: the exporter cannot invent
their definitions. This limitation will be documented separately from resolved
cross-model references. External containment owners are not imported just because
their child is referenced: only forward-reachable objects belong to the closure.

## Declared files

1. `frontend/src/services/export/JsonModelService.ts`: graph collection and serialization.
2. `frontend/src/services/export/__tests__/JsonModelService.test.ts`: executable regression tests.
3. `docs/json-export-schema.md`: external objects, reference resolution, example.
4. This report: findings and verification results.
5. `docs/claude-code-log.md`: task entry.
6. `docs/claude-code-log-archive.md`: verbatim rotation to preserve the 40-entry cap.

RC-11 threshold exception declared before edits: six files, including required
documentation and log rotation. The user explicitly requested the fix and current
documentation, and reconfirmed continuation on the updated branch.

## Verification

- Before the service change, the new public API suite produced **12 failures,
  2 passes** (exit 1). Local-only exports and empty/missing-metamodel checks passed;
  external definitions were absent, including in the downloaded Blob.
- After the fix, `npm run test -- src/services/export/__tests__` produced
  **63 passes across 2 files** (exit 0), including all **14 new tests**. Coverage
  includes transitive cycles, self-references, duplicate targets, equal names with
  distinct ids, local and external containment, child-before-container ordering,
  references from nested objects, actual foreign metaclass definitions, stale ids,
  containment cycles, primitive/enum values, repeated exports and the light format.
- Tests execute `exportModelToJSON`, `buildModelDocumentLight`, and `exportToFile`.
  The download test reads the generated Blob and checks all object references;
  it does not assert on source text. The store/proxy boundary is mocked, not the
  serializer. Browser click/render integration and real Redux proxies are not
  exercised by this Node suite.
- `npm run typecheck`: exit **2** before and after; **14 pre-existing errors** in
  both complete outputs. A byte-for-byte comparison returned identical; no new
  errors and none in the changed service or test. Logs captured in this session:
  `/tmp/jjodel-128-typecheck-current-before.log` and
  `/tmp/jjodel-128-typecheck-after.log` (temporary evidence, not reusable fixtures).
- `npm run build`: exit **0**, 42.08 seconds. Warnings include Sass deprecations
  and the bundle-size warning. No dependency or lockfile was changed.
- `npm run smoke`: exit **1 before browser startup**, because the existing local
  installation cannot resolve `@playwright/test` from `scripts/smoke/run.ts`.
  No visual smoke pass is claimed. The download payload is covered by the Node
  test described above; this is not a substitute for a real browser smoke.
- `git diff --check`: passed. Documentation gate and final commits recorded below
  after updating the task log.
