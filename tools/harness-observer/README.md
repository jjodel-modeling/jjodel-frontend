# Offline harness observer

Version 1.0.0, schema `harness-observer/1`. Node >=22, standard library only.

This is an independent reader. It does not import the launcher, board, usage
script, hooks or tracking. It does not start providers, run repository commands,
access the network, write caches, modify archives or migrate historical data.
Importing its production modules does no I/O. The CLI writes JSON only to stdout
and short error codes to stderr. No provider integration beyond historical
Claude event interpretation is implemented.

## Commands

Run from the repository root; all archive roots must be explicit:

```sh
node tools/harness-observer/cli.mjs inspect --lanes-root /Users/alfonso/.jjodel-lanes --lane P-2026-10-16-1000
node tools/harness-observer/cli.mjs audit --lanes-root /Users/alfonso/.jjodel-lanes --sample tools/harness-observer/test/fixtures/sample-100.json
```

Exit 0 means analysis completed, including genuine discrepancies. Exit 1 means
a source could not be read or changed while being read, or reading failed.
Malformed records remain explicit diagnostics and make the associated record
partial. Exit 2 means invalid arguments/sample. There is no write/repair flag.
The caller may redirect stdout to its own authorized location; the reader never
selects or opens an output file.

## Modules and interfaces

- `reader.mjs`: `readLaneSources(root, laneId)`, `readSample(path)`,
  `readBytes(path, root)`. Explicit allowlist, no following `prompt.txt` or other
  embedded paths. JSONL is parsed incrementally in 64 KiB chunks. Maximum source
  size 128 MiB, maximum JSONL line 16 MiB. Exceeding limits is a diagnostic/failure,
  never a silent truncation. Non-JSONL sources are buffered within the same cap.
- `providers/claude-stream.mjs`: pure `normalizeEvent(event, source)` and
  `counters(raw, cli)`. Returns metadata and token counters, not transcript text,
  tool inputs, commands, credentials or arbitrary tool-result bodies.
- `identity.mjs`: `resolveIdentities(lane)`, evidence-addressed `observationId`.
- `accounting.mjs`: pure `reconstructUsage(events)`,
  `reconcileUsage(events, reconstructed)`.
- `cli.mjs`: `buildReport(lanes)`, `canonicalStringify(report)`, `main(args, io)`.

The adapter boundary is an extension point, not a dynamic plugin loader. A future
provider must declare its own scope/cumulative semantics before its records can
be compared; Claude session/cache assumptions must not be silently inherited.

## Identity contract

Lane identity is the observed directory, not the semantic task. `taskId: null`
means the task identity was not established. Hash IDs identify evidence records,
not invented associations between objectives. No historical task UUIDs are minted.

Session identities are namespaced by provider. Invocation records are emitted
from a ledger; `init` creates an `observedSegment` with `invocationId: null`, not
an inferred launcher invocation. Ledger absence is missing coverage, not zero
actual invocations. A ledger is treated conservatively as partial coverage.

Direct and LLM observations in one container create separate execution records
and `MIXED_CONTAINER`. Without a ledger the LLM execution boundary is ambiguous.
A worktree path is an observation; `persistentWorktreeId` remains null. No Git
command is run to invent a persistent identity or infer an acceptance decision.

In P-2026-10-21-1035, direct artifacts describe `tack-stops`; the later ledger,
LLM input and worktree describe the hardware printer. The reported LLM tokens
are not charged to the direct merge. The report retains both outcomes separately.

## Counters and reconciliation

`originalCounters` retains original usage fields per observed message block and
result. The archive itself is not rewritten. SHA-256, line and byte offsets link
records back to their source. Offsets are UTF-8 byte offsets, end exclusive,
excluding the newline. Metadata fixture offsets refer to original files.

`reconstructedUsage` deduplicates by provider-session/message ID. Missing message
IDs retain separate observations and a diagnostic. Conflicting model/agent IDs
make the record partial. Changed usage versions remain in original counters.
Synthetic messages are excluded from reconstructed API calls.

The four classes are ordinary input, cache read, cache creation and output.
Missing/invalid/unsafe integers never become zero. Overflow suppresses the
aggregate. Stream output is partial: content-block usage does not prove complete
generated output. Main/subagent stream counts are separate; no exact per-agent
final output is invented when the provider exposes only a model-level total.

Final CLI snapshots are retained and the last observed snapshot per session is
compared with the deduplicated stream. Cumulative snapshots are never summed
within a session. Decreases are explicit discontinuities and suppress the
baseline total. A first observed snapshot is NOT proof of a fresh session:
segment zero uses a labelled zero reference solely for historical comparison.
Segment deltas are not claimed as proven invocation charges.

`difference` is stream minus CLI, by input class. A mismatch is a result, not a
reason to change counters. Compaction is an observed correlated event, not an
automatic explanation for residual usage. Availability and equality differ:
available values may disagree. Unknown consumption is null; direct-only token
consumption is not applicable, not a claimed zero total cost of the work.

`baselineTechnicalTotal` is the named Phase 3A compatibility view: all observed
input classes (main plus subagents), plus final CLI output, once. It is eligible
only for exact input reconciliation and usable sources. It does not establish
complete historical coverage, exclusive task attribution or economic equivalence
of token classes. API-list costs stay original CLI observations, not subscription
spend. No conversion to Claude Max quota is made.

Architect data is retained if present but is always partial until completeness
and exclusive attribution are demonstrated. Open, missing and unknown-schema
cases are distinct. Closed files do not automatically establish reliable totals.

## Determinism and source safety

Reports contain no current timestamp, elapsed-now estimate, random UUID or
machine-dependent root prefix. Original worktree strings are source observations
and may themselves contain historical absolute paths. Arrays use deterministic
input order; object keys and lane IDs use code-point ordering. Same bytes,
reader version and options produce identical JSON.

Each source is hashed while read. Descriptor/path identity, size, mtime and ctime
are checked before/after reading. Symbolic links and escapes are refused; final
file opens use O_NOFOLLOW where available. A source that changes is not certified.
This is not an atomic snapshot of a concurrently modified directory or an OS
security sandbox. Access-time changes caused by the filesystem are not archive
content writes. The tool does not read credential/configuration files.

Operational outcomes are observations, separate from acceptance and integration,
which remain unknown. An older Outcome is not inherited by a newer ledger range
or, without a ledger, a newer observed segment. Notification result durations are
labelled and not summed into invented execution or CPU time.

## Tests and historical validation

Tests run in one Node process, using `node:test`; no test-worker process or
repository runtime is needed:

```sh
node tools/harness-observer/test/observer.test.mjs
HARNESS_OBSERVER_ARCHIVE_ROOT=/Users/alfonso/.jjodel-lanes node tools/harness-observer/test/observer.test.mjs
```

Only test-owned directories under the system temporary directory are written,
then removed. The archive test is skipped unless an explicit root is supplied.
Production imports and inspection are exercised under traps for filesystem
writes, child-process entrypoints, HTTP/HTTPS, socket connections and fetch.
These executable checks supplement the restricted import graph; they are not a
formal proof against arbitrary untested code paths.

The local schema evaluator checks only the standard JSON Schema keywords used
by the bundled schema; it performs no remote resolution or code execution.
Fixtures include independently stated expected values, not generated goldens
from the implementation. Historical fixtures are metadata projections, not
complete transcripts. Their source hashes are checked against the originals.

The fixed sample is exactly the 100 approved Phase 3A IDs. The three intentional
external investigations remain excluded. Integral validation reproduces:

| Measure | Expected |
|---|---:|
| Direct/LLM directories | 100 |
| Directories with LLM calls | 75 |
| Numerically reconciled directories | 73 |
| Technical compatibility total | 1,034,170,964 |
| Ordinary input | 11,298 |
| Cache read | 1,009,590,655 |
| Cache creation | 18,757,078 |
| Final CLI output | 5,811,933 |

The two discrepant lanes remain outside these 73. `0105` retains differences
(-2702, -4400955, -184234), localized to segments 0 and 3. `1000` retains
(2, 397421, 1359), matching the interrupted thinking event at original line 1390.
No assertion is made about actual provider charging of that partial response.

`expected.json` pins a fingerprint of allowlisted bytes observed during
implementation validation on 2026-10-23. It is not a fabricated snapshot of the
earlier audit date. Source drift must be reviewed, not fixed by regenerating the
expected fingerprint until tests pass.

## Scope and rollback

Thirteen new files only, including `docs/log-inbox/harness-observer.md`. No package
script, operational source, hook, model-routing configuration or board change.
No installation, commit, push, merge or provider invocation is part of validation.
Stop using the CLI to roll back its use. Any later removal must preserve the
add-only documentation and historical evidence; archives need no reverse migration.

## Implementation validation, 2026-10-23

Validated on Node v22.23.3: 26 tests passed, zero failed/skipped with the explicit
archive root. All 100 original directories and three required original logs were
checked. Across two readings, JSON was byte-identical; 654 allowlisted source
files matched the pinned fingerprint. Directory file lists and inode, size, mtime
and ctime of all entries in the 100 directories were unchanged, including entries
not parsed by the reader. The fingerprint is
`c90bc18bc776687174a0fa5a402ba84dc3d2223feae19fff67257f0def72c7bf`.

The runtime guards were positive-controlled by denied write, child-launch and
fetch attempts before exercising the production modules; zero effect attempts
were observed from those modules. Three in-memory forbidden-import/write-source
mutations were rejected by the static boundary check. No product build or broad
operational harness suite was executed, and no dependency was installed.
