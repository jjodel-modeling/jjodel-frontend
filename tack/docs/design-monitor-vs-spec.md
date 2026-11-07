# Design note: monitoring versus harness specification

Status: design, not implemented. Source: P-2026-10-20-1900 (front `tack`). Evidence for every claim below is in
`docs/discovery/discovery_2026-10-20_tack_monitor_vs_spec.md` (cited as «R §n»). The keywords MUST, MUST NOT, SHOULD
and MAY are used in their usual normative sense.

## 1. Purpose

Tack observes a harness. Today it also *believes* one: the Jjodel harness's ids, prompt headers, closure words, outcome
words, lane kinds, limits and paths are literals in its code (112 sites in `src/`, R §1). This note separates the two
roles:

- **Monitoring** answers *what happened*. It is computed from traces: transcripts, git, lane folders, logs.
- **Specification** answers *what should happen*: actors, roles, artifacts and where they live, norms and their
  thresholds, the process, delegation. It is a harness model conforming to the Harness metamodel
  (`harness.emf`, v1.5 at the time of writing).

The goals are three. Tack works on a repository that has no specification. Tack works on a harness other than
Jjodel's by swapping a specification, not by editing code. And Tack can judge a trace against a norm, which is what
the Health tab (R-TACK-5) needs.

## 2. The two halves and the boundary

### 2.1 Monitoring

Monitoring MUST work with no specification at all. It owns:

1. Layer 1 (transcripts and git): sessions, cost, context per call, commits, overlap, waits, the timeline.
2. Layer 2 (identity) by Tack's own contract: the `Unit:` trailer, the subject suffix as an alias.
3. Layer 3 (self-assessment) from `.tack/log.jsonl` against contract v1.
4. Its own heuristics: commit window, staleness, medians, polling, notification plumbing, the load strip.
   These are settings of the monitor (`contract/v1/settings.json`), never norms of a harness (R §1.1, C21-C22).

### 2.2 Specification

The specification owns every value that a harness's own documents state as a rule:

- identity: the id pattern of a unit and of a chat, which header fields a prompt has and how they are written;
- vocabulary: outcomes, lane kinds, model tiers, fronts, the `Status` domain;
- thresholds: lane time limit, context ceiling, bounds of document windows;
- delegation: which decision classes a role may take unattended, on which fronts;
- process: the order of activities per lane (the phase ladder);
- documents: stores, placement, lifecycle policies (§4).

### 2.3 The boundary

1. A monitor value MUST NOT be moved into the specification, and a specification value MUST NOT stay a literal in
   core code. The test: is it stated as a rule in a governance document of the observed harness? If yes, it is
   specification.
2. Launcher layout (the lane-folder files of `lane-run`) and platform facts (Claude Code paths, stream-json, model
   families) are neither. They belong to **adapters** (§2.4).
3. Every view that needs a specification value and has none MUST say «no specification», as layer-2 and layer-3
   cells say `not adopted` today: a sentence, never a zero, never a green.
4. A view that shows a trace MUST still show it without a specification. Only the verdict disappears.

### 2.4 Adapters

An adapter reads one tool's traces into the store: Claude Code transcripts, git, `lane-run` lane folders, the Jjodel
log. Adapters MAY know file layouts and platform formats. They MUST NOT know a harness norm: where an adapter needs
one (the `Outcome:` line, the `Status:` field), it asks the specification and falls back to monitoring-only behaviour
without one. `collectors/lane-run/` and the unit pattern in `contract/` are the two places where this is violated
today (R §1).

## 3. The specification as a harness model

1. The specification is an instance of `harness.emf`. Tack MUST NOT define a parallel schema of harness concepts.
   Where Tack needs something the metamodel lacks, the gap goes to the metamodel first (R §1.2, §4).
2. Tack reads a JSON serialisation using the `harness.emf` feature names, at a fixed path in the observed repository
   (proposed `.tack/harness.json`). It is versioned with the norms it describes. Tack does not parse XMI or JjScript
   and does not read models across repositories (R §6 Q1, Q2).
3. `tack check` validates the specification: well-formedness against the metamodel, the constraints the metamodel
   declares (C-G6 ... C-G17, and C-G18 once adopted), and that every pattern compiles.
4. Tack reads only. It never writes the specification, and it never decides on its basis (the autonomy engine of
   `ROADMAP.md` is a later consumer, not part of this design).
5. Gaps found while mapping Tack's literals (R §1.2), proposed for the metamodel:
   - **N1** an identifier pattern for the prompt kind;
   - **N2** `FieldSpec.syntax`, the concrete syntax of a field or a marker line (one capture group);
   - **N3** a conditional requirement on a field (`requiredWhen`);
   - **N4** the integration branch (`trunk`) of a `Repository`.

## 4. Stores, placement and lifecycle policies

### 4.1 Stores

A store is a `Repository`. The kinds are those of v1.5 plus one:

| Kind | Example in Jjodel | Readable by the monitor |
|---|---|---|
| Versioned | the git repository | yes |
| KnowledgeBase | the claude.ai Project Knowledge (capacity 6) | no; only through a manifest (§4.5) |
| Session | the chat context | no |
| Local | the lane folders | yes, through an adapter |
| Tracker | GitHub issues and project | out of scope |
| **Memory** (new) | Claude Code auto-memory | yes when local; rules only |

`capacity` keeps its meaning (documents in the store). A capacity is a bound like any other and SHOULD be a
`Threshold` of the norm that states it.

### 4.2 Placement

An artifact kind has exactly one **Original** placement and any number of **Projections**. Each placement names a
store, a path pattern and one lifecycle policy. Examples: the session checkpoint has its Original in the KB as a
replaced slot and a Projection in git as immutable dated copies; `spec_attive.md` is a distilled Projection of
`docs/spec/` in the KB; `AGENTS.md` is a distilled Projection of the `CLAUDE.md` files in git.

### 4.3 The closed list of policy kinds

| Kind | Meaning | Required parts |
|---|---|---|
| Immutable | written once, never changed; a correction is a new artifact | — |
| AppendOnly | entries are added; none is changed or removed (a repair needs an explicit trailer) | — |
| ReplacedSlot | exactly one instance at a path, overwritten whole | trigger |
| BoundedWindow | at most *n* entries; older ones move, verbatim and in order, to an archive placement | `bound` (a Threshold), `archive` (an AppendOnly placement) |
| Distilled | produced from named sources; checked by provenance, never by content | `sources`, and provenance on each artifact |

The list is closed. A rule that is a schema (the log-entry format), an order (newest first), a move (archive out of
the KB) or an operation (how to restore a file) is not a lifecycle policy: it is a `Norm` on the artifact kind, and
the specification MUST NOT stretch a policy kind to hold it (R §2, rows marked DNF).

### 4.4 Trigger, condition, owner

Each policy names:

- **trigger**, from a closed list: on write, on session end, on checkpoint, on lane close, on threshold, on schedule,
  on source change;
- **condition**, a predicate over the trace or the store (e.g. «entries > bound», «context ≥ 300k per call»);
- **owner**, the one role accountable for applying it (architect chat, Claude Code session, a script, Alfonso);
- **norm**, the `Norm` that states it, which carries `statedIn`, `enforcedBy` and `origin`.

At most one policy is in force per (artifact kind, store) at a date. Two documents stating different numbers for the
same placement (20 against 40 log entries, R §2.1 X1) are then a model fact the check can report, not two texts that
silently drift.

### 4.5 Provenance for distilled documents

A distilled artifact carries a list of sources, each with path, content hash and, in a versioned store, the revision.
It is **current** iff every source hash equals the hash of that path at the store's head. The check is mechanical,
never semantic: the monitor MUST NOT read a distilled document to judge whether it is right.

For the KB, which the monitor cannot read, the owner commits a **manifest** at each checkpoint: per KB file its name,
size, upload time and, for projections, the git path and blob hash it was copied from. The monitor checks the
manifest against git (staleness of projections) and against the store capacity. A manifest is self-reported; its
absence or its age is itself shown (R §5).

### 4.6 Proposal for the metamodel

G18 adds `Placement`, `LifecyclePolicy`, `SourceRef`, `RepositoryKind.Memory`, the enumerations `PlacementRole`,
`PolicyKind`, `PolicyTrigger`, and six constraints C-G18a ... f. It renames nothing: `storedIn` stays the store of the
Original placement, `lifecycle` stays for compatibility. Full text in R §4. Not applied by this note.

## 5. Conformance as the bridge

A **conformance view** joins a trace view to a norm and shows three things: the measure, the norm's threshold or
domain, and a verdict. It exists only when a specification exists.

1. A health signal of the invariant kind MUST be derived from a norm, not defined with its own number. Its red
   threshold is read from the specification.
2. The first four are the invariant signals of the retrospective (R §3):

   | Signal | Norm | What the specification supplies |
   |---|---|---|
   | S2t lane over time | RC-20 | `Threshold` hard 90 min |
   | S4a log above bound | P9 | `BoundedWindow.bound` of the log placement |
   | S4d prompt not closed | P13 / RC-17 | the `Status` field, its domain and syntax |
   | S5 front interleaving | RC-33 | `Front`, `Change.owner` |

3. Diagnosis signals (trend lines with no norm behind them) stay monitoring and show with or without a
   specification.
4. Existing views gain a verdict column only when they show a normed quantity: lane time, context peak, closure,
   unattended decisions, critical-zone questions (R §3).
5. The Health banner shows the worst verdict and the signal that set it (R-TACK-5). With no specification it shows
   «no specification» and the diagnosis lines only.
6. Rules that contradict each other (R §2.1) are checked on the specification itself (C-G18f), not on traces. The
   monitor shows the result next to the signals, as its own class: «specification inconsistent».

## 6. What stays out of v0

- Reading any specification. v0 closes as a monitor with its present literals.
- The autonomy engine and its settings (`ROADMAP.md`, R-TACK-4): a consumer of `Delegation`, later.
- Writing to the KB, or any reader of claude.ai. The manifest is a harness-front change; Tack only reads it.
- The Tracker store (GitHub issues and projects).
- Generating governance prose from the specification (`Norm.statedIn`). It removes prose drift but is a harness-front
  tool, not a monitor feature.
- Applying G18 or N1-N4 to the metamodel: proposals for the paper repository.

## 7. Migration order

Each slice leaves Tack green on Jjodel with byte-identical `parity jjodel` output, and green on a repository with no
specification. A slice moves literals only after the reader that replaces them exists.

1. **S1, adapter boundary.** Move `collectors/lane-run/` behind an adapter interface; take the Prompt-ID pattern out
   of `contract/` into the adapter's configuration. No behaviour change. Removes the two core violations (R §1).
2. **S2, specification reader.** `tack check` accepts `.tack/harness.json` and validates it against the metamodel
   subset Tack reads (ArtifactType, FieldSpec, Lane, Outcome, Norm, Threshold, Front, ModelTier). A Jjodel
   specification is exported from the papers model into the repository (harness front). Views unchanged.
3. **S3, thresholds.** Lane time and context ceiling read from `Norm.thresholds`; the residual literals
   (`collectors/lane-run/collect.mjs:347`, the 200k sites) go. The settings keys stay as overrides of the monitor.
4. **S4, vocabulary.** Outcomes, lane kinds, tiers and fronts read from the specification; the adapter maps
   trace words onto them. Without a specification the adapter keeps its own words and the verdict cells say so.
5. **S5, prompt and closure.** Header fields, the `Status` domain and syntax (needs N2) read from `atPrompt`. The
   closure rule keeps its monitoring half (a commit naming the unit) without a specification.
6. **S6, conformance and Health.** The four invariant signals as conformance views; the Health tab and banner of
   R-TACK-5.
7. **S7, documents.** After G18 is in the metamodel: placements and policies, the log bound (S4a), distilled
   provenance (`AGENTS.md` first, it is fully in git), then the KB manifest when the harness front writes one.
8. **S8, the log adapter.** `importers/jjodel-log.mjs` reads the log grammar from `atLog.fields` (needs N2, N3) and
   becomes the generic reader of a field-structured log.

S1 can start at once; S2 depends on the export; S7 depends on the metamodel change; the others are in order.
