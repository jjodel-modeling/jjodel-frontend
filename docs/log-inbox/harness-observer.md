# Offline harness observer implementation record

## 2026-10-23 — implementation: independent offline identity and accounting reader
**Prompt**: User approval in this chat to implement and validate exactly the thirteen new files of the offline observer plan. No operational changes, provider execution, commits, push or merge authorized.
**Files touched**: New files only: `tools/harness-observer/README.md`, `cli.mjs`, `reader.mjs`, `identity.mjs`, `accounting.mjs`, `providers/claude-stream.mjs`, `report.schema.json`, `test/observer.test.mjs`, `test/fixtures/historical-minimal.json`, `test/fixtures/synthetic.json`, `test/fixtures/sample-100.json`, `test/fixtures/expected.json`; `docs/log-inbox/harness-observer.md`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — isolated observer tests and fixed-archive validation; no operational components edited. This is not a claim of a newly executed product build or full frontend regression suite.
**Out-of-scope changes**: no — thirteen files explicitly authorized by the user, above the five-file threshold. No existing file modified.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — offline JSON reader, no product UI change
**Notes**: Exact Phase 3A compatibility: 100 directories, 75 LLM, 73 reconciled, 1034170964 technical tokens. Both historical discrepancies retained. 1035 direct merge and printer distinguished. No migration or source writes; fixture mutations occur only in test-owned temporary directories. No commits.
**Prompt document name**: — (direct chat authorization, no timestamped prompt document exists)

### Validation evidence

Runtime: Node v22.23.3. Tests use the built-in runner in one process. The integral
test checks all 100 originals, all three required cases, fixed source hashes,
token-class totals, canonical JSON equality across two readings and source stability.
Synthetic tests cover cumulative counters, partial output, missing identities,
resets, malformed sources, overflow, source mutation and access escapes.
Runtime effect traps cover production imports and inspection; static checks reject
operational, process and network imports. Full frontend build/typecheck and harness
gates were not run: the user authorized only isolated tests for this new component.

The expected values are stated independently in the fixture contract. Metadata
projections retain original usage fields and provenance without transcript bodies.
`expected.json` records a validation-time source fingerprint, not a retroactive
historical snapshot. See the README for the executable validation commands.

Final isolated run: 26 tests passed, 0 failed, 0 skipped. All 654 allowlisted
sources matched the validation fingerprint. Two reports were byte-identical;
file lists and inode/size/mtime/ctime of all entries in the 100 selected archive
directories were unchanged across validation. Three in-memory negative mutations
were rejected. Runtime effect guards were positive-controlled and recorded zero
write/process/network attempts by the production modules.

### Limits retained

Task identity is unknown without explicit evidence. Missing ledgers do not prove
zero invocations. Worktree paths are observations, not persistent IDs. The first
observed CLI snapshot does not prove a fresh session. Architect totals remain
partial. Output cannot always be split by agent. No token-to-subscription conversion
is provided. In 0105, compaction is correlated with a residual, not proven to explain
it. The reader is bounded (128 MiB/source, 16 MiB/JSONL line) and not an atomic
archive snapshot or an OS security sandbox. No subsequent interventions started.
