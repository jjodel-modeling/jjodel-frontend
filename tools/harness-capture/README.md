# Harness Capture — point acquisition, schema 1

Phase 4C.3 (2026-10-23). Standalone Node.js standard-library component, validated
initially against synthetic fixtures and isolated temporary archives. Phase 5
adds the explicit concluded-historical-lane exception described below. No live
lane is captured. No ACC execution, watcher, polling, service, operational
imports, subprocess, network client or LLM call is included.

## Explicit CLI

The source root and lane must be specified. There is no default source directory,
archive scan or daemon mode. Example paths below are placeholders for an isolated
archive and its separate diagnostic storage, not operational lanes:

```sh
node tools/harness-capture/cli.mjs capture \
  --source-root /absolute/isolated-archive \
  --lane P-2026-01-01-1000 \
  --destination /absolute/diagnostic-store

node tools/harness-capture/cli.mjs verify \
  --destination /absolute/diagnostic-store \
  --manifest SHA256_FROM_CAPTURE \
  --observation OBSERVATION_SHA256_FROM_CAPTURE

node --test tools/harness-capture/test/acquisition.test.mjs
```

`--observation` is optional when verifying just the manifest and source blobs.
`--retries 0|1|2` is optional for capture, default 2. CLI output is one JSON object;
exit 0 means the operation completed, not that every source was acquired. Source
failures and missing data remain in the manifest. Exit 2 is a configuration,
storage-integrity or fatal acquisition error, also JSON without OS path dumps.

The destination's parent must already exist. Use canonical paths (on macOS,
`/private/tmp`, not its `/tmp` symlink). The source and destination cannot overlap;
storage inside a Git worktree/repository is rejected. Source roots under
`~/.jjodel-lanes` are refused by default; only the exact historical-lane capability
described below can enable a concluded lane. Storage overlapping that archive
remains forbidden.
These guards are not a discovery mechanism for every possible operational archive:
the operator must authorize and supply an isolated source, not an alternate real
archive. No real-lane activation is authorized by this implementation.

## Authorized source surface

Only one explicitly selected lane directory is enumerated. Readable names:

- `input-<positive integer>.md` (maximum 64 inputs, numeric ordering).
- `runs.jsonl`, `session.txt`, `worktree.txt`, `prompt.txt`, `started.txt`, `exit.txt`.

Other files, credential/config files and conversational `log.jsonl` are ignored.
Prompt/worktree paths found in metadata are preserved as references only: they are
never followed. The component does not invoke Git or open `.git` file contents.
It checks `.git` existence in destination ancestors only to reject repository storage.
No prompt, discovery or unversioned document outside this enumerated surface is
implicitly copied. Such a document remains a reference, and might not be recoverable.

Symlink roots, symlink ancestors, symlink source files, traversal arguments and
nonregular source files are rejected. Reads use no-follow, nonblocking file opens,
bounded chunks and size/identity/signature checks before and after reading.
Per-source cap: 1 MiB. Total attempted source-read budget: 8 MiB (at most one byte
over the threshold to detect growth). Metadata is subject to the same limits.
No source locks, chmod, mutation or operational status commands are used.

## Snapshot contract and storage

```text
diagnostic-store/
  blobs/<sha256>          exact acquired source bytes
  manifests/<sha256>      canonical deterministic snapshot JSON
  observations/<sha256>  canonical variable acquisition envelope
```

Versioned manifest fields:

- `schema_version: 1`, `kind: passive_evidence_snapshot`.
- `lane.observed_id`: selected lane directory label, not proof of task identity.
- `lane.task_refs`: explicit Prompt-ID headers in acquired inputs, with source hashes.
- `lane.task`: only a unique header matching the directory label, otherwise null.
- `lane.invocation` and `lane.session`: null; this version does not invent bindings.
- `lane.session_file`, `session_candidates`, `runs`: observed session references
  and complete parseable ledger rows, including their line/hash references.
- `lane.worktree`, `prompt_path`: available literal metadata, never dereferenced.
- `sources`: logical path, artifact type, read outcome/stability, attempts,
  anomalies, acquired bytes, SHA-256, preservation and uncertain identity fields.
- `sources.git_revision`: null; no current worktree revision is inferred.
- `temporal`: conservative relationships, always unverified in schema 1.

Successful sources have `preservation: full` and a verified content blob. Failed
sources have `preservation: unavailable`, a null hash and a specific failure status.
There is no automatic claim of byte completeness for Markdown: `completeness` stays
unknown even for a stable read. A writer may have paused halfway through a document.

The observation includes source root, local start/completion timestamps, manifest
hash and measured resource counters. It is separate from the reproducible manifest.
Capture's JSON receipt also includes both hashes and completion metrics measured
after publishing the observation. `verify` checks the canonical manifest schema,
its SHA-256 and referenced blob hashes/lengths. With `--observation`, it additionally
checks the observation's integrity and its binding to that manifest. Integrity does
not authenticate the truth of recorded metadata or the origin of an archive.

## Safe publication and deduplication

Storage directories created by the component use mode 0700; files use 0600.
Content is written to a uniquely named exclusive temporary file, synced, hash
checked and published using a hard link that cannot replace an existing target.
The temporary link is then removed. Identical existing content is verified and
reused; conflicting/corrupt content causes an error and is not repaired or overwritten.

Concurrent publication of identical content is accepted; conflicting publication
is rejected. An interrupted run may leave an unreferenced blob or hidden temporary
file. Later captures ignore orphan temporaries; they do not delete or adopt them.
A manifest is published after its acquired blobs; an observation follows the manifest.
There is no transaction across all files or automatic orphan garbage collection.

Publication assumes a filesystem supporting hard links within the diagnostic
store. File fsync and atomic linking do not constitute a complete power-loss
recovery guarantee; directory durability and tamper-proof storage are not claimed.

## Identity and concurrent source changes

A ledger row is a reference to a recorded launch, not an invented stable invocation
identifier. Input ordinal and ledger row number are not automatically joined.
A recorded resume session is retained on that ledger row; it is not assigned to
an input. Multiple task headers or session candidates remain explicit ambiguities.
Chain fixture coverage retains `kind: chain`; no supervisor is started or followed.
Missing ledger, session or worktree data does not prevent preserving available inputs.

A source whose inode, size, mtime or ctime changes during acquisition is retried
at most twice, then retained as an anomaly without publishing unstable bytes.
Previous failed attempts remain visible even if a later retry succeeds. Truncation,
replacement, short reads and disappearance are handled without unbounded waits.
Complete ledger lines are interpreted; a final unterminated line is preserved as
raw source bytes but not promoted into a parsed row. Malformed lines are anomalies.

A snapshot is not cross-file atomic: every file can be stable yet represent a
different moment. A directory-wide consistent state or adversarial parent-directory
replacement resistance is not claimed. Run on controlled isolated roots; no-follow
and signature checks are not a substitute for OS isolation against hostile actors.

## Temporal semantics

The reviewed launcher code runs keepInput before spawn. This is a documented code
ordering, not proof that a particular archive file was produced by that launcher
version or that it equals bytes actually consumed on stdin.

`observed_at`/`completed_at` delimit this acquisition on the local clock. They do
not prove anteriority to coding. `started.txt`, ledger timestamps, input numbering
and system/init are not barriers. system/init and tool events are not read here.

Schema 1 produces only `temporal.status: unverified`, with both spawn/coding
relationships unverified and `acc_judgment: not_produced`. `verified` would require
sufficient causal evidence; `late` would require an established boundary proving
lateness. Neither is inferred from the current source surface. This is conservative
abstention, not a missing-data substitution with a positive claim.

## Validation and indicative overhead

Node v22.23.3: 55 node:test cases, all passed. Cases include single/multiple inputs,
resume/chain, missing/partial/malformed ledger, reused identity, source mutation,
inode replacement, truncation, short/premature reads, bounded retries, restart,
deduplication, corrupt manifests/blobs/observations, concurrent publication,
symlinks/traversal, resource caps, deterministic manifest and uncertain timing.

Behavioral denial tests prohibit network, subprocess and watcher APIs, and constrain
write/open/link/unlink/mkdir operations to the diagnostic store. The whole suite
also passed in a macOS sandbox denying network, process forks and all writes except
its isolated temporary workspace, with reads of operational lanes, observer and ACC
explicitly denied. CLI capture and read-only verify were additionally exercised as
real commands on a synthetic archive. No product test or ACC command was run.

Mutation checks on temporary copies detected removal of source-stability checks,
false temporal verification and omitted stored-content hash verification. Detailed
counts are reported in the closing implementation report.

Five isolated stores using the resume fixture (8 artifacts, 375 source bytes each),
with one first and one repeated capture per store:

- First capture: 60.17–87.85 ms, median 67.83 ms.
- Repeated capture: 9.69–15.04 ms, median 9.79 ms.
- CPU user+system on first capture: 10.78–27.72 ms, median 15.61 ms.
- Initial logical file sizes in storage: 5,173–5,182 bytes including metadata.
- Retry count: 0. Repeated new content bytes: 0; all five manifest hashes unchanged.

An earlier local measurement series ranged 72.67–407.03 ms for first captures and
11.71–24.14 ms for repeats, demonstrating environmental variability. These are
fixture observations, not a general benchmark or proof of operational noninterference.
OS resource counters fsRead/fsWrite returned zero here; that is not evidence of zero
physical I/O. File sync/publication adds real overhead. No token savings are inferred.

`bytes_read` counts attempted source bytes including retries. `bytes_preserved`
counts unique source content represented by the snapshot; `new_content_bytes`
counts newly published source blobs. `storage_bytes_written_before_observation`
includes temporary publication writes for blobs and manifest, excluding the envelope.
Observation `duration_ms` similarly excludes its own publication; receipt completion
metrics include it. CPU counters and timestamps are variable. Logical storage size
is distinct from allocated disk blocks. No human preparation cost is assigned zero.

## Scope and rollback

Only five new files: this README, cli.mjs, acquisition.mjs,
test/acquisition.test.mjs and test/fixtures.json. Existing observer, ACC, launcher,
hooks, protocol and logs remain unchanged. No commits, model calls or live captures.
Frontend build/typecheck/product tests were not run: this is a separate offline Node
component, tested without creating product outputs or touching existing files.

Rollback removes only these five new files. Diagnostic stores are independent and
can be retained; cleanup is an explicit separate action, never automatic deletion of
an archive. Controlled activation needs separate authorization, a designated isolated
input surface/storage, resource budgets and access separation. Technical validation
does not demonstrate experimental utility or permit a prospective ACC pilot.

## Phase 5: explicit historical-lane exception

Default operational-source refusal remains enabled. Historical acquisition requires
`--allow-historical-lane /absolute/.jjodel-lanes/P-...` in addition to the explicit
source root and lane. The capability must equal the selected lane directory;
passing the archive root or another lane does not authorize acquisition.

Before capture and again before publishing its manifest, the component reads stable
pid/started/exit markers, probes the recorded PID using signal 0, and requires ESRCH
plus consistent wrapper-completion chronology. A live/reused PID is potentially
active, EPERM/missing/invalid/stale markers are unknown: all are refused. The PID's
absence alone, exit.txt alone, and Outcome/Board status are insufficient. This
establishes completion of the observed launcher wrapper, not absence of untracked
processes or a promise that no future invocation can start. A restart observed
during acquisition prevents manifest publication; unreferenced diagnostic blobs
may remain. No archive lock or source write is introduced.

Marker evidence is retained in `historical_acquisition`; temporal pre-coding status
stays unverified. Exact input/run/session bindings are still not inferred. Additional
offline tests cover concluded/active/unknown states, exact-path authorization,
ambiguous identities, source preservation and restart rejection. Tests run before
any authorized real historical capture.
