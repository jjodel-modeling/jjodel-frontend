# ACC Shadow — offline calibration component

Phase 4C.1, implemented 2026-10-23. Explicit invocation only; prospective operation
is not enabled. Node.js 22 standard library; no dependencies, operational imports,
watcher, model calls, network client, subprocess execution or archive writes.

## Usage

From the repository root:

```sh
node tools/acc-shadow/cli.mjs --input tools/acc-shadow/test/fixtures.json --case historical-2001
node tools/acc-shadow/cli.mjs --input tools/acc-shadow/test/fixtures.json --case historical-2001 --semantic-only
node --test tools/acc-shadow/test/acc.test.mjs
```

A standalone record needs only `--input`; `--case` selects a record from the supplied
fixture bundle. Output is one JSON object on stdout. Exit 0 means analysis completed,
including an incomplete/indeterminate/incompatible result: this is not a gate.
Invalid CLI arguments, unreadable transport, invalid JSON or missing case give exit 2
and a generic JSON error without disclosing paths or file contents.

`--input` authorizes that exact file. Referenced file sources require one explicit
`--allow-file /absolute/path` per file. An input cannot authorize another path.
Directories, symlinks (including symlink ancestors), nonregular files and hash
mismatches are rejected. File URLs and network references are not resolved.
Use canonical paths; on macOS `/tmp` may need `/private/tmp`.

Only the test harness creates temporary files and symlinks, outside the repository.
The evaluator returns data; the CLI writes only stdout and never persists a report.
Redirect output only to a diagnostic destination chosen by the operator. No operational
log directory is a default input or output.

## Version 1 input contract

`contract.mjs` is the executable structural contract. `test/fixtures.json` supplies
complete examples. References use `{source, start, quote}` with zero-based JavaScript
UTF-16 offsets; the exact nonempty quote must occur at that offset.

Required for applicable records:

- `schema_version: "1"`, `activation: "applicable"`.
- `requirement.ref`, `strategy.ref`, `counterexample.ref`, `expected_result.ref`.
- `expected_result.valid` and `.invalid`: distinct string labels.
- `sources`: up to 32 unique descriptors, each with `id`, `origin`, lowercase SHA-256,
  and exactly one of inline UTF-8 `text` or local `path`. `origin` records provenance;
  it is never interpreted as a command or fetched.
- `rule.name: "projection_collision"`, `rule.projection`, `rule.valid`, `rule.invalid`.
- `rule.reference` for line-occurrence coverage.
- `rule.support`: `faithful_projection`, `different_expected_results`,
  `no_other_information`. Each requires `status: "attested"` and a resolving `ref`.

`rule.invalid` must be identical to `counterexample.ref`. Unknown rule parameters
are rejected. Unknown rules/projections abstain; no attached script is executed.

A non-applicable record requires only version, activation `not_applicable` and
nonempty `reason`. It does not resolve or analyze sources.

Optional `identity_refs` preserves caller-supplied task/lane/execution/session/
invocation references without merging them or deriving associations. Identity
references and provenance are caller-supplied, not independently authenticated.
Optional `contamination`: `unknown`, `contaminated`, `declared_unexposed`.
Existing-control coverage stays `unknown` and incremental value `unproven`:
post-task adjudication is outside this offline implementation.

Optional `temporal_evidence` uses a resolving `ref`, `captured_at` and
`coding_started_at` with explicit timezone. Missing, malformed or incomplete
information is `unverified`; earlier acquisition is `attested_pre_coding`, otherwise
`late`. Supplied dates do not prove chronology. No current clock is consulted.
Retrospective provenance may instead describe the historical source boundary;
without timestamps it remains `unverified`. Offline calibration can still run,
but `prospective_eligible` is always false. This component cannot authorize a pilot.

## L0 and L1 semantics

L0 validates structural prerequisites, source integrity, exact references, declared
temporal evidence and supported parameters. It does not interpret free prose.

L1 is limited to projection collision with explicit support attestations:

- `identity_text`: retains the exact supplied text, a negative/control projection.
- `line_occurrence_coverage`: splits on LF, strips trailing ASCII spaces/tabs,
  counts occurrences, then projects each reference line to its retained count,
  capped by the reference count. Extra candidate lines are ignored. Sorting is
  deterministic UTF-16 ordering. Blank lines and multiplicities are retained.

Equal projections plus distinct expected outcomes give `incompatible` **under the
explicitly attested conditions**. Different projections give `consistent`, meaning
only that no incompatibility was demonstrated on those inputs. It does not simulate
or certify the proposed implementation.

`incomplete` means missing/invalid prerequisites, references or source integrity.
`indeterminate` means unsupported formalization, equal expected labels, unbound
counterexample, or missing/uncertain support attestations. Unsupported or uncertain
semantic conditions recommend `L2_recommended`; L2 is never executed.
`not_applicable` is an explicit screening record, separate from missing data.

Important limit: resolving a quote proves its presence and integrity, not that it
logically supports an attestation. The operator must establish the faithful
projection, distinct expected outcomes and absence of other strategy inputs.
No automatic natural-language semantic verification is claimed. A caller who
cannot substantiate these conditions must mark them unknown; the evaluator abstains.
A dishonest or mistaken `attested` declaration is not independently detectable.

## Output, determinism and overhead

`{result, overhead}` separates semantic fields from variable measurements.
`--semantic-only` emits just `result`. Object keys are serialized canonically;
source resolution uses sorted IDs. Version and rule names fix projection semantics.
The semantic result includes the canonical input SHA-256, verdict, capability list,
evidence references, projection hashes, condition basis and uncertainty states.
Reordering an input array changes the input digest, but not the underlying finding.

`overhead.runtime_ms` measures evaluator execution (including source resolution),
not Node startup or CLI transport parsing. `bytes_read` counts source bytes
processed, including inline sources; `documents_read` counts source descriptors.
`input_bytes` is canonical selected-record size. CLI additionally reports raw
`transport_bytes` and `transport_documents`. Inline source bytes are already in
the transport; these measures must not be summed as unique disk bytes.
Human preparation and adjudication are `null`, not zero. `llm_usage` is always 0.

Maximum source-byte budget is 2,000,000 bytes, with the same cap on transport;
CLI also rejects combined transport plus processed-source totals above this cap.
This is a bounded offline reader, not a security boundary against an adversary
concurrently replacing/growing authorized files. Use stable snapshots and an OS
sandbox for stronger isolation.

## Historical calibration: P-2026-09-28-2001

The fixture uses only the initial prompt revision `dd1d9906f` and the already-known
incident `447e4239b` with its first parent `888ea9a9d`. Both log revisions were
verified as ancestors of the initial prompt during fixture preparation. No later
implementation or repair contents were used as evaluator input.

Rather than duplicating full documents, the fixture contains:

1. The 12-line original P-2026-09-26-2350 entry from the first parent.
2. All 116 lines from the incident log matching any trailing-space-normalized line
   in that entry, retaining original order and duplicates.
3. Two initial-prompt excerpts: rejection of the incident and the line comparison
   strategy treating identical moved lines as unchanged.

Provenance records original full-document hashes, source revisions and original
line positions. The extraction omits candidate-only lines, which cannot affect
this reference-line-coverage projection. The original entry is no longer contiguous
in the incident log, while every required line occurrence survives. Thus original
and incident yield identical old-entry coverage although the prompt requires the
incident to be rejected. This is a localized witness, not an implementation of the
entire proposed gate, rotation handling or batch closure.

The fixture is calibration selected from a known defect. Its success is not an
independent effectiveness result. The historical boundary is verified by Git
ancestry during preparation; the evaluator itself never invokes Git, verifies
repository ancestry, or claims a prospective acquisition timestamp.

## Validation record (2026-10-23)

Node v22.23.3: 44 tests passed, zero failed. Coverage includes collision, negative
examples, incomplete/unknown conditions, unsupported rules, bad hashes/references,
path allowlists, symlinks, byte limits, temporal uncertainty, identity preservation,
CLI JSON and repeatability. Behavioral denial tests replace write, subprocess,
network/fetch and current-clock APIs with throwing implementations while exercising
the evaluator and CLI.

The complete suite also passed in a macOS sandbox denying network, process forks
and repository writes. The CLI passed with the same OS restrictions plus Node
file permissions restricted to this component directory. A stricter full-suite
Node-permission attempt was unsuitable because Node forbids creating the negative
symlink fixture without unrestricted filesystem permissions; the OS-sandbox suite
and restricted CLI were therefore validated separately.

Three mutations in temporary copies were detected: inverted collision verdict
(8 failed tests), dropped multiplicity (1), ignored attestation status (4).

Ten in-process historical repetitions had identical semantic output:
SHA-256 `7fa024f5f34afc1007958c4a25d5455bc985f0e0881e6e89018961c03933b0da`.
Observed evaluator times: minimum 0.581 ms, median 0.860 ms, maximum 3.267 ms;
3 source documents / 6,842 bytes processed; canonical selected input 24,660 bytes.
These are local observations, not a general benchmark. Human preparation cost is
unknown. No token savings or overall economic advantage is inferred.

## Scope, rollback and next authorization

Exactly seven new files: this README, cli.mjs, contract.mjs, sources.mjs, rules.mjs,
test/acc.test.mjs and test/fixtures.json. No existing file, observer, protocol,
operational gate or model routing is changed. No commit, push or merge is performed.
No frontend build is needed to exercise these independent Node modules; frontend
build/typecheck were not run because this task authorizes only offline component
tests and no modifications to preexisting files or generated outputs.

Rollback: remove only these seven newly created files after preserving any desired
diagnostic output. No harness configuration needs restoring. Before any prospective
pilot, separately authorize activation, establish verifiable pre-coding capture,
prevent findings from reaching task decision-makers, define sampling and overhead
budgets, and assign post-task adjudication. If those roles cannot be separated,
remain offline. No pilot, warning or gate is activated by this implementation.
