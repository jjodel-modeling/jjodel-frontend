# Discovery: Tack, monitoring versus harness specification (Phase 1)

Prompt-ID: P-2026-10-20-1900 · Chat: C-2026-10-19-1748 · Front: tack · Lane: discovery · Branch `tack-spec` from `c3db63f69`.
Read-only. Companion design note: `tack/docs/design-monitor-vs-spec.md`.

## 0. Answer in brief

1. Tack hard-codes 112 Jjodel harness conventions in `src/` (+4 in the contract); none of the ids, headers, closure or outcome words, lane kinds or paths is configurable, and two "core" places (`collectors/lane-run/`, `contract/`) carry them (§1).
2. Most map onto `harness.emf` v1.5 as it is (FieldSpec, Outcome, Lane, Threshold, ModelTier, Front, Delegation); four gaps: id patterns, field syntax, conditional requirement, trunk (§1.2).
3. 34 document rules, 14 disagreeing pairs (20 vs 40 log entries, two different six-file KB lists, 60% vs 300k checkpoint); every KB rule is discipline only (§2).
4. v1.5 cannot hold placement (one store per kind), bounded windows with rotation or distillation with provenance: proposal G18, Placement + LifecyclePolicy bound to Norm and Threshold (§4).
5. The KB is unreadable from git; a checkpoint manifest is the cheapest reader, and the four red health signals become the first conformance views (§3, §5).

## 1. Convention inventory in Tack today

**Method.** One read-only explorer pass over `tack/src/**`, `tack/bin/tack.mjs` and `tack/contract/v1/*`, with BSD
`command grep` (not the ugrep wrapper) and positive controls (`Co-Authored`, `Outcome:` hit). Absent after the
search: the `Autonomy:` and `Model:` trailers, `120k`, `.agent-logs`, `docs/decisions.md`, `docs/discovery`, and
`tack-*` branch names. Paths below are relative to `tack/`. Element references are to `harness.emf` (v1.5, §4).

**Totals.** 112 sites in `src/` plus 4 id patterns in the contract JSON: threshold 21, outcome 16, log format 13,
id regex 12 (+4), header field 10, path 7, trailer 4, front 3, closure 3, branch 3, port 3, lane kind 2, file-name
pattern 2, event catalogue 1, other 12. By file: `collectors/lane-run/collect.mjs` 27, `importers/jjodel-log.mjs`
12, `notify/notifier.mjs` 11, `board/api.mjs` 9, `contract/validate.mjs` 8, `metrics/layer3.mjs` 7, the rest at
six or fewer.

**Where they sit.** The Jjodel adapters by directory are `importers/` and `parity/`. Two "core" places carry
Jjodel conventions in substance: `collectors/lane-run/collect.mjs` (the README calls it an adapter,
`README.md:10-11`, but it lives in `collectors/`) and `contract/`, whose unit pattern is the Jjodel Prompt-ID
(`contract/validate.mjs:5`, `contract/v1/entry.json:12,45`, `unit.json:10,13`). No adapter interface is declared.

**Already parameterised** (`contract/v1/settings.json`): `limits.laneMinutes` 90 (`:81`, read at
`collectors/lane-run/collect.mjs:379`, `collectors/layers.mjs:12`, `notify/watch.mjs:35`, `board/api.mjs:239`, with
a residual literal at `collectors/lane-run/collect.mjs:347`); `context.hardTokens` 250000 (`:102`, read only by
`notify/notifier.mjs:114`; the 200k of the session views is a literal); `harness.laneRun` (`:74`); notification
kinds and quiet hours (`:60,134-147`). **Nothing** is parameterised for the id pattern, header names, closure words,
outcome words, lane kinds, trailers, paths or fronts.

### 1.1 Conventions and the element they belong to

Grouped by what they encode; a group lists every site. "Monitor" in the last column means the value is the
monitor's own heuristic, not a harness norm: it stays in Tack's settings and never moves to a specification.

| # | Convention (what it encodes) | Sites (`file:line`) | Harness element (`harness.emf`) |
|---|---|---|---|
| C1 | Unit id `P-YYYY-MM-DD-HHmm` (+ `-suffix`) | `collectors/lane-run/collect.mjs:23`; `contract/validate.mjs:5`; `contract/linkage.mjs:18`; `metrics/layer3.mjs:6,23,38-39`; `parity/jjodel.mjs:63`; `importers/jjodel-log.mjs:50-52,56,107,124`; `contract/v1/entry.json:12,45`, `unit.json:10,13` | `Change.ident` (`:267`) with `ArtifactType.namingPattern` of the prompt kind (`:114`; instance `atPrompt`, `jjodel.harness.jjs:292`). The id *pattern* has no slot: `namingPattern` is over the file name, not the id. Gap **N1**. |
| C2 | Chat id `C-...` and `found_in [PC]-...` | `collectors/lane-run/collect.mjs:180`; `contract/validate.mjs:6` | `Change.ident` with `kind = Chat` (`:256`), `Change.owner` (`:283`). Pattern: gap **N1**. |
| C3 | Prompt header fields `Prompt-ID`, `Chat`, `Front`, `Lane`, `Status`, `Depends`, `Corregge`; title is the first `# ` line | `collectors/lane-run/collect.mjs:179-182,214`; `collectors/claude-code/collect.mjs:64`; `board/lanes.js:13,77,86`; `board/api.mjs:200-202` | `ArtifactType.fields : FieldSpec[*]` (`:123,126-130`); instances `atPromptF0..F7` (`jjodel.harness.jjs:298-326`). Fits; the model instance lacks `Corregge`, which Tack reads (`board/api.mjs:200-202`). |
| C4 | Header block layout: ends at the first `## `, read within 8192 bytes / 4000 chars; `[P-...]` tag opening the first user message | `collectors/lane-run/collect.mjs:204-205,218-220`; `collectors/claude-code/collect.mjs:63,69-72` | No element: `FieldSpec` has a name and a domain, not a syntax or a position. Gap **N2**. |
| C5 | Closure words `Status: eseguito` / `done`, and the closure rule (a commit naming the id after the lane ended, or the flipped Status) | `collectors/lane-run/collect.mjs:242-243,263`; `board/api.mjs:200-202,213-214` | Words: `FieldSpec.domain` of `Status` + `Artifact.status` (`:294`); the model says `da eseguire | eseguito date lane sha` (`jjodel.harness.jjs:323-324`), Tack also accepts `done`. Rule: `Norm` P13/RC-17 as free text (`:213`). The *derivation* (which trace event closes a lane) is monitor logic. |
| C6 | Outcome words `done`, `hard-stop`, `question`, `blocked`; the `^Outcome:` line; `unparsed`, `none` | `collectors/lane-run/collect.mjs:80,118,172,174,346`; `metrics/layer3.mjs:30,64-65,80`; `notify/notifier.mjs:99,101`; `board/api.mjs:243,259-267`; `board/lanes.js:21,63`; `board/insights.js:41`; `bin/tack.mjs:324` | `enum Outcome { Done; HardStop; Question; Blocked; }` (`:255`), `Change.outcome` (`:273`). `unparsed`/`none` are monitor states (no element, correctly). The *line syntax* is gap **N2**. |
| C7 | Lane kinds `merge`, `fast`, `discovery`, `phase2`, inferred from `Lane:` phrases and file names (`_prompt_merge_`, `_take_trunk`) | `collectors/lane-run/collect.mjs:188-195,190`; `board/api.mjs:249` | `Lane{name, criterion}` (`:140-143`), `Change.lane` (`:279`); instances `lFast`, `lFull`, `lDiscovery` (`jjodel.harness.jjs:526-532`). `merge` is `ChangeKind.Merge` (`:256`); `phase2` is an `Activity` (`:156`), not a lane. The inference phrases have no element (gap **N2**). |
| C8 | Lane time limit 90 min | `collectors/lane-run/collect.mjs:347,379` (+ settings) | `Threshold` of norm RC-20 (`:233-240`; `thRC_20_0`, `jjodel.harness.jjs:1073`). Fits. |
| C9 | Context threshold 200k (marker, `context_peak`) and 250k (notifier) | `metrics/layer1.mjs:106-107`; `board/api.mjs:13`; `board/board.js:52,132`; `board/page.html:36`; `board/timeline.js:34`; `board/insights.js:13,70`; `notify/notifier.mjs:114` | `Threshold{soft, hard}` of RC-51 (`thRC_51_0`, `jjodel.harness.jjs:1455`): 200k soft, 250k hard. Fits; Tack splits one threshold into a literal and a setting. |
| C10 | Model tiers `heavy`, `light`; critical-zone tier reasons (`names <file>`, `--critical-zone-goahead`) | `collectors/lane-run/collect.mjs:178,341` | `ModelTier` (`:78-82`), `Change.tier` (`:281`); critical zone is a `FileSet` (`:206-209`) with a reserved `DecisionClass` (`:86`). Fits. |
| C11 | Resume-input classes: recovery, corrective, ack, answer, go, `/status-flip` | `collectors/lane-run/collect.mjs:122-133` | Partly: `Continuation {Resume; Fresh; Handoff}` (`:257`) and `Flow.kind = Message` (`:188-194`) for go/ack/answer; corrective is `Artifact.corrects` (`:299`). The classifier phrases: gap **N2**. |
| C12 | «Decisions taken (unattended)» section of the closing message | `collectors/lane-run/collect.mjs:136-138` | `Decision.provisional`, `decidedUnder` (`:308,311`) under a `Delegation` (`:89-97`, RC-21). The section heading: gap **N2**. |
| C13 | Lane folder layout `~/.jjodel-lanes/<id>/` (`exit.txt`, `tier.txt`, `log.jsonl`, `result.json` with `merged`/`red`/`blocked`, `input-N.md`, …) | `collectors/lane-run/collect.mjs:1,46,277,285-288` | `Repository repoLanes` kind `Local` (`jjodel.harness.jjs:204`) exists; its files are artifacts of the *launcher*, not of the harness norms. Adapter, not specification. |
| C14 | Prompt path `docs/prompts/<file>`, file name `claude_YYYY-MM-DD_HHmm_` | `collectors/lane-run/collect.mjs:255`; `importers/jjodel-log.mjs:51` | `ArtifactType.namingPattern` + `storedIn` of `atPrompt`. Fits (placement, §4). |
| C15 | Commit linkage: trailer `Unit: <id>`, subject suffix `(P-...)`; `Co-Authored-By` naming Claude; merge subject `merge: <branch>` | `contract/linkage.mjs:6-7`; `metrics/layer2.mjs:1-2,74`; `collectors/git/collect.mjs:43`; `collectors/git/infer.mjs:20-23` | `atCommit` with fields (`jjodel.harness.jjs:428`): fits as `FieldSpec`. `Unit:` is Tack's own contract (`contract/v1/README.md:84-85`), not a Jjodel norm; `(P-...)` is CLAUDE.md §6.2. |
| C16 | Log entry grammar: `## YYYY-MM-DD — type:`, `**Field**: value`, ✅/⚠/❌, `Causa` a..g, ticket fields, lint-from date 2026-09-24 | `importers/jjodel-log.mjs:18-21,52-86,67,78-79` | `atLog` with `atLogF0..F8` (`jjodel.harness.jjs:348-386`), `Norm.validFrom` (`:215`) for the lint date. Fits; the syntax is gap **N2**. |
| C17 | Contract v1 log rules: outcomes completed/partial/problems, causes a..g, priorities, task/ticket, notes ≤ 500, title ≤ 200, cause required when `corrects` is set or outcome is not completed | `contract/validate.mjs:8,10-12,40,60,65-66,168-182`; `metrics/layer3.mjs:105` | `FieldSpec{domain, required}` (`:126-130`) holds the enumerations and fixed requirements. A *conditional* requirement has no element: gap **N3**. |
| C18 | Log store paths `docs/claude-code-log.md`, `-archive.md`, `docs/log-inbox/` | `importers/jjodel-log.mjs:2,96-97` | `atLog`, `atArchive`, `atInbox` (`jjodel.harness.jjs:348-404`). Fits; their rotation does not (§4). |
| C19 | Trunk `alfonso-frontend-jjtl` (`DEFAULT_TRUNK`, `JJODEL_TRUNK`) | `importers/jjodel-log.mjs:14`; `bin/tack.mjs:364` | `Change.base` (`:272`) names a commit; the repository's integration branch has no slot. Gap **N4**. |
| C20 | Fronts as a notification scope; `front` message field | `notify/notifier.mjs:47,147-150`; `board/settings.js:55` | `Front` (`:146-154`), `Change.front` (`:280`). Fits. |
| C21 | Notification catalogue (15 kinds), quiet hours, stale 24 h, lease 60 s, re-arm 0.85 | `notify/notifier.mjs:24-25,28-43,62,137` | Monitor. Kinds map onto `Outcome` and `Threshold` crossings; the catalogue itself is not a norm. |
| C22 | Commit window 1 h, attention 72 h, median over 30 days with n ≥ 5, poll 20 s, tick 20 s / scan 30 min, load 20 and 0.85, port 4710 | `collectors/units.mjs:11-12,42,76`; `store/sessions.mjs:14,22`; `metrics/layer1.mjs:218-219`; `board/api.mjs:17,175,197-199,257`; `board/lanes.js:14`; `notify/watch.mjs:13-14`; `board/loadmeter.js:10,23,45,73`; `host/load.mjs:7-8`; `board/server.mjs:24,191` | Monitor. |
| C23 | Parity tolerance 1%, signal names; commands `import jjodel-log`, `parity jjodel` | `parity/jjodel.mjs:11,13,22`; `bin/tack.mjs:33-37` | Adapter. |
| C24 | Model families opus/sonnet/haiku; `~/.claude/projects`; `cleanupPeriodDays` | `metrics/layer1.mjs:25`; `collectors/claude-code/collect.mjs:11`; `notify/notifier.mjs:67` | Platform (Claude Code), not harness. `ModelTier.modelId` (`:80`) is the nearest element. |

### 1.2 Gaps: conventions with no element in v1.5

- **N1. Identifier patterns.** The grammar of a `Change.ident` per `ChangeKind` (Prompt-ID, chat id). Today Tack
  needs it in C1, C2 and four contract JSON patterns. Proposal: `attr String identPattern` on a per-kind
  declaration, or on `Lane`/`ArtifactType` of the prompt (§4 does not include it; open question Q3).
- **N2. Concrete syntax of a field or a marker.** v1.5 says *that* a prompt has a `Status` field with domain
  `da eseguire | eseguito`, not *how* it is written (`Key: value` at line start, before the first `## `), nor
  marker lines inside a message (`Outcome: <word>`, «Decisions taken (unattended)», the resume phrases). Every
  Tack regex lives here (C4, C6, C7, C11, C12, C16). Proposal: `attr String syntax` on `FieldSpec` (a regular
  expression with one capture), and a `FieldSpec` list on the artifact type of the closing message.
- **N3. Conditional requirement.** `FieldSpec.required` is a boolean; «`Causa` required iff the outcome is not ✅ or
  `Corregge` is filled» (CLAUDE.md §21.3, `contract/validate.mjs:168-182`) is not expressible. Proposal: `attr
  String requiredWhen` (a JjEL expression over the sibling fields), or a constraint in `constraints.json`.
- **N4. Integration branch of a repository.** `Repository` has no trunk (C19). Proposal: `attr String trunk` on
  `Repository`.

C13, C21, C22, C23 and C24 are not gaps: they are the launcher's, the monitor's or the platform's, and the
boundary of §3 keeps them out of the specification.

## 2. Document policy catalogue

**Method.** One read-only explorer pass with `command grep` and ranged reads over `CLAUDE.md`, `docs/PROTOCOL.md`,
`docs/HARNESS-DOCS.md`, the cited rows of `docs/decisions.md`, `frontend/scripts/gates/*.ts`, `.claude/settings.json`,
`.claude/skills/`, plus `git ls-files` counts. Spot-checked by me: `PROTOCOL.md:105` (40 entries),
`HARNESS-DOCS.md:44-63` (the six KB files, `CLAUDE.md` never in the KB), `log-tools.ts:7` (`LOG_MAX_ENTRIES = 40`),
`decisions.md:296` (RC-50). No gate was run: "gate" means the script exists and states the rule, not that it passes.
The project instructions are cited as «PI» («project instructions, claude.ai, read 2026-10-20»).

**Live state (2026-10-20, this branch).** Active log 40 entries (12 tickets); archive 1843 entries, 4.9 MB; 59 inbox
files, 19 non-empty, 139 entries waiting; `docs/sessioni/` 101 files (42 `claude_sessione_*`, 59 `sessione_*`, the
newest `sessione_<date>_C-<chat>.md`); `docs/prompts/` 1105; `docs/discovery/` 636, of which 118 lack the
`discovery_` prefix. `sessione_CORRENTE.md` and `contesto_progetto.md` are not in git.

Policy kinds: IM immutable, AO append-only, RS single replaced slot, BW bounded window with rotation to an archive,
DS distilled from sources, DNF does not fit. Owner: A architect (project chat), CC Claude Code session, AL Alfonso,
S script.

| # | Artifact kind | Store | Policy | Trigger / condition | Owner | Written at | Gate |
|---|---|---|---|---|---|---|---|
| D1 | KB document set (six names) | KB | DNF: a whitelist with a capacity, a property of the store, not of one kind | always; «if the count exceeds 6, something is out of control» | A | PI; `HARNESS-DOCS.md:44-68`; `PROTOCOL.md:148-150` | none (`HARNESS-DOCS.md:413-416`) |
| D2 | `contesto_progetto.md` | KB (original, no git copy since `docs/archivio/claude_contesto_progetto_2026-08-10.md`) | RS | end of session, or when the state diverges | A | `HARNESS-DOCS.md:48` | none |
| D3 | `sessione_CORRENTE.md` | KB | RS | each checkpoint: ~60% of context, keyword «checkpoint», end of session | A | PI; `HARNESS-DOCS.md:49,311-319` | none |
| D4 | dated checkpoint copy | git `docs/sessioni/` | IM, one file per checkpoint | when D3 is replaced | A | PI; `HARNESS-DOCS.md:318-319,540`; `docs/sessioni/README.md:3-5` | none |
| D5 | `spec_attive.md` | KB and git `docs/spec/` | DS (an index of the spec files; the full file wins on conflict) | a spec born or amended | A | `HARNESS-DOCS.md:50,331-336` | none |
| D6 | `HARNESS-DOCS.md` | git (original), KB (copy) | RS in the KB, edited in git | the document organisation changes; version bump | A | `HARNESS-DOCS.md:4-5,51,376` | none |
| D7 | two active templates | KB (git copies in `docs/archivio/template-*.md`) | RS, «rarely» | when active | A | `HARNESS-DOCS.md:52-53` | none |
| D8 | exclusions from the KB: prompts, memos, discoveries, old checkpoints, specs, `CLAUDE.md` | — | DNF: a negative placement | always | A | `HARNESS-DOCS.md:60-63,628` | none |
| D9 | archiving out of the KB | KB → git | DNF: a move, copy then delete | on archive | A | `PROTOCOL.md:159-162`; `HARNESS-DOCS.md:598-600` | none |
| D10 | prompt | git `docs/prompts/` | IM after execution; a correction is a new prompt with `Corregge` | born in chat, run once | A | `HARNESS-DOCS.md:103-174,535`; `PROTOCOL.md:152-155` | `check:docs` E on `Front:` only (`check-docs.ts:457`) |
| D11 | prompt header fields | git | DNF: a schema, not a lifecycle | at creation | A | `PROTOCOL.md:258-305` | `Front:` by `check:docs` E and `lane-run start`; `Request:` by `lane-run start`; others none |
| D12 | prompt `Status:` line | git | RS, flipped once (`da eseguire` → `eseguito`) | in the closure commit, after the GO | CC | `PROTOCOL.md:308-321`; `decisions.md:118` (RC-17) | none; `status-flip` skill assists |
| D13 | discovery report | git `docs/discovery/` | IM; a later finding is an addendum | end of every exploratory phase | CC | PI; `PROTOCOL.md:36-43`; `HARNESS-DOCS.md:178-201,536` | none (`HARNESS-DOCS.md:415`); `## 0` ≤ 40 lines warned by `lane-run status` (`lane-run.mjs:99,1501`) |
| D14 | ratification memo | git `docs/ratifiche/` | IM | after ratification; open until its row exists | A | `HARNESS-DOCS.md:203-218,537` | none |
| D15 | decision row | git `docs/decisions.md` | AO, superseded rows moved to «Superate» | each ratification | A | `HARNESS-DOCS.md:220-237,538`; `decisions.md:1-7` | none (parsed by `docs:digest`, `trace-index`) |
| D16 | decisions digest | git `docs/digest/<date>.md` | DS from `decisions.md`; hand part kept after a marker | on request | S | `docs-digest.ts:1-40` | the script refuses to overwrite without the marker |
| D17 | active prompt log | git `docs/claude-code-log.md` | BW: 40 entries, older to the archive | above 40 | S, exclusive lane | `PROTOCOL.md:105`; `HARNESS-DOCS.md:295-299,539`; PI says **20** | `check:docs` D (`check-docs.ts:408-455`); `log-tools.ts:7` |
| D18 | log ordering | git | DNF: an order (newest first per day, R-RAIL-45) | every insert | any writer | `CLAUDE.md` §21; `decisions.md:964` | `check:addonly` allows reordering |
| D19 | log entry format | git | DNF: a schema, byte-identical in `CLAUDE.md` §21.2 and P9 | every entry; Notes ≤ 500 from 08-19; tickets from 09-24 | CC | `PROTOCOL.md:107-136`; `log-tools.ts:10,13,20,23` | `check:docs` A, B, C |
| D20 | log inbox | git `docs/log-inbox/<lane>.md` | AO, emptied by the fold | parallel lanes write here, never to the active log | CC | `PROTOCOL.md:140`; `log-entry` skill | `check:docs` B, C; D only warns (`check-docs.ts:441-447`); no bound |
| D21 | fold and rotation | inbox → log → archive | the move of BW: verbatim, in file order, never summarised | batch closure, clean tree | S, exclusive lane | `PROTOCOL.md:105,140,250-252`; `decisions.md:49` (RC-12) | `rotate-log.ts:11,19,65,86` |
| D22 | log archive | git `docs/claude-code-log-archive.md` | AO, nothing leaves | on rotation | S | `check-addonly.ts:1-60`; `check-docs.ts:360` | `check:addonly` |
| D23 | add-only log files | git | AO per entry; repair only with a `Log-Repair:` trailer | every merge | S | `decisions.md:274` (RC-34); `PROTOCOL.md:466` | `check:addonly` on every merge (`lane-run.mjs:2782`) |
| D24 | log restore | git | DNF: an operation constraint (`git checkout HEAD -- <file>` only) | always | any | `PROTOCOL.md:142-144` | deny list `settings.json:21-38`, `bash-guard` |
| D25 | `CLAUDE.md` | git, one home | DNF: edited in place under git history; neither a slot nor append-only | a rule change | AL, CC | `PROTOCOL.md:375-396`; `HARNESS-DOCS.md:370` | `check:docs` A, `check:agents`, `check:triggers` |
| D26 | `AGENTS.md` | git | DS from every `CLAUDE.md`, never by hand, same commit | after a `CLAUDE.md` edit | S (`gen:agents`) | `CLAUDE.md:5`; `decisions.md:23` (RC-7) | `check:agents` (byte compare) |
| D27 | `rule-triggers.json` | git `docs/harness/` | DNF: an index kept total (one entry per nested `CLAUDE.md`) | a nested rule file added | CC | `check-triggers.ts:1-25` | `check:triggers`; `rule-trigger.mjs` hook |
| D28 | `PROTOCOL.md` | git | as D25, with a version bump | by hand | AL, A | `HARNESS-DOCS.md:372` | `check:docs` A for the log block only |
| D29 | lane handoff (`handoff.md`, `handoff.diff`) | lane folder `~/.jjodel-lanes/<id>/` | RS | context at 200k soft, 250k hard | CC | `decisions.md:297` (RC-51); `PROTOCOL.md:454` | `context-ceiling.mjs` hook (`settings.json:72-81`) |
| D30 | architect checkpoint, RC-50 form | KB `sessione_CORRENTE.md`, then a new chat | RS | ~300k tokens per call; 60% only where no transcript is measurable | A | `decisions.md:296` (RC-50) | none |
| D31 | trace index | derived, not stored | DS from prompts, log, decisions, commits | `npm run trace:index` | S | `trace-index.ts:1-30` | none |
| D32 | specs | git `docs/spec/` | IM; a superseded spec stays | on supersession | A | `HARNESS-DOCS.md:328-342,541` | none |
| D33 | working material | git `docs/archivio/` | AO folder | on creation | A | `HARNESS-DOCS.md:342-358` | none |
| D34 | auto-memory | Claude Code memory (`~/.claude/projects/.../memory/`) | DNF: one fact per file plus an index, updated or deleted when wrong | when something non-obvious is learned | CC | the Claude Code system prompt; not in this repository | none |

**Enforcement, in one line.** Of 34 rows, the log family (D17-D23), `AGENTS.md` (D26), the triggers (D27) and the
handoff (D29) have a gate or a hook. Every KB rule (D1-D9, D30), the prompt lifecycle beyond `Front:` (D10-D12), the
discovery report (D13) and every rule in `docs/ratifiche/`, `docs/spec/`, `docs/archivio/` are discipline only.

### 2.1 Pairs of rules that disagree

| # | Side 1 | Side 2 | Kind |
|---|---|---|---|
| X1 | PI: the log keeps **20** entries | **40**: `PROTOCOL.md:105`, `log-tools.ts:7`, `rotate-log.ts:11`, `check-docs.ts:422`, `HARNESS-DOCS.md:295-299,539,635`; live count 40. The history is incidents I01 and I02 (`discovery_2026-10-18_harness_health_retrospective.md:28-29,52-54`). | number |
| X2 | PI: the KB holds `CLAUDE.md`, `PROTOCOL.md`, `contesto_progetto.md`, `sessione_CORRENTE.md`, two templates | `PROTOCOL.md:148-150` and `HARNESS-DOCS.md:46-53`: `contesto_progetto`, `sessione_CORRENTE`, `spec_attive`, `HARNESS-DOCS`, two templates; `HARNESS-DOCS.md:60-63`: `CLAUDE.md` **never** enters the KB. The harness model follows HARNESS-DOCS (`atKbDoc.namingPattern`, `jjodel.harness.jjs:454`). Same count, two different members. | membership |
| X3 | PI and `HARNESS-DOCS.md:311,453`: checkpoint at ~60% of context | `decisions.md:296` (RC-50): above ~300k tokens per call; 60% only without a measurable transcript | condition |
| X4 | PI: dated copies `sessione_YYYY-MM-DD.md` | `HARNESS-DOCS.md:319,517`: `claude_sessione_<date>[_N].md`; `PROTOCOL.md:155`: prefix `claude_` everywhere but discovery; practice: three forms, the newest `sessione_<date>_C-<chat>.md` | naming |
| X5 | `docs/sessioni/README.md:3-5`: checkpoints «archived from the Project Knowledge» | commits `a2341d870`, `449e8ec2b`: committed directly at checkpoint time | trigger |
| X6 | `CLAUDE.md:59-60,368`: Claude Code updates `docs/claude-code-log.md` at task end | `PROTOCOL.md:140` and the `log-entry` skill: under parallel lanes, only the inbox | placement |
| X7 | `CLAUDE.md` §6.1 and `HARNESS-DOCS.md:301-303`: back the log up to `/tmp/log-backup.md` and restore | `PROTOCOL.md:142` (RC-13-bis): `/tmp` backups across sessions are banned, `log-backup.md` named as an incident | operation |
| X8 | `HARNESS-DOCS.md:402`: checks A, B, C, E | `check-docs.ts:4,24`: five checks, D included | enforcement list |
| X9 | `HARNESS-DOCS.md:74-92,242-244`: counts of 2026-08-18 (prompts 195, sessioni 32, log 27 + 799) in a file that calls itself normative (`:7-10`) | live counts above | stale fact |
| X10 | `PROTOCOL.md:105,140`: the active log is bounded at 40 | inboxes are unbounded (139 entries waiting); a fold would move ~139 entries to the archive in one run (`rotate-log.ts:21-25`) | missing bound |
| X11 | `docs/harness/gates.md:3-6`: the gate list, `CLAUDE.md` §17 binds on disagreement | `HARNESS-DOCS.md:396-412`: a third copy; `PROTOCOL.md:5` and `HARNESS-DOCS.md:389-392` call every duplication a defect | duplication |
| X12 | P10 and `HARNESS-DOCS.md:60-61`: specs, archive and templates live in `docs/`, out of the KB | `spec_attive.md` and the two templates are in both, and the «copy, then delete from KB» step is unenforced (`HARNESS-DOCS.md:598-600`) | placement |
| X13 | `HARNESS-DOCS.md:246`: the entry is written after visual confirmation | RC-17 (`decisions.md:118`, `PROTOCOL.md:308-321`): after the code commit, uncommitted until the GO | trigger |
| X14 | `atPromptF6.domain` = `da eseguire \| eseguito date lane sha` (`jjodel.harness.jjs:324`) | Tack closes on `eseguito` **or `done`** (`board/api.mjs:213-214`, `collectors/lane-run/collect.mjs:242-243`) | domain |

X1 to X4, X12 and X14 are the cases a specification with placements and policies (§4) makes checkable: each pair
states one property of one placement twice. X5, X7, X8, X9, X11 and X13 are prose drift that only generation from a
single source (`Norm.statedIn`) removes.

## 3. Boundary

**Rule.** Monitoring states *what happened* and is computed from traces (transcripts, git, lane folders, the log).
Specification states *what should happen* and is a harness model conforming to `harness.emf`. The monitor never
needs a specification to show a trace; it needs one only to *judge* a trace. A Tack with no specification is
exactly the Tack of slices 1-8 minus its Jjodel literals, which move to an adapter (§1: C1-C20) or to defaults.

**What the monitor derives alone (no specification).** Layer 1 of `tack/README.md:13-20`: sessions, cost, context
per call, commits, overlap, waits, subagent share, the timeline. Layer 2 by Tack's own contract (`Unit:` trailer,
`contract/v1/README.md:84-85`). Layer 3 from `.tack/log.jsonl` validated against contract v1. Its own heuristics
(C21-C22): commit window, staleness, medians, polling, notification plumbing. None of these is a harness norm.

**What it reads from a specification when one exists.**

| Monitor need | Today (literal) | From the specification |
|---|---|---|
| How to recognise a unit and its owner chat | C1, C2 | `Change.ident` pattern per kind (gap N1) |
| How to read a prompt header and its closure | C3-C5, C14 | `atPrompt.fields`, `namingPattern`, `storedIn`; `Status` domain; field syntax (gap N2) |
| The outcome vocabulary | C6 | `enum Outcome` + the closing-message syntax (N2) |
| Lane kinds and how a prompt declares one | C7 | `Harness.lanes`, `Lane.criterion` |
| Limits (lane time, context ceiling) | C8, C9 | `Norm.thresholds` (RC-20, RC-51) |
| Tiers and the critical zone | C10 | `Harness.tiers`, `FileSet`, reserved `DecisionClass` |
| Unattended decisions and autonomy categories (R-TACK-4) | C12, ROADMAP `:5-28` | `Delegation{classes, condition, review, onFronts}`, `Decision.decidedUnder` |
| Fronts and their owners | C20 | `Harness.fronts`; ownership is `Change.owner` of the front's changes |
| The phase ladder (ROADMAP `:30-40`) | 4700 board regexes | the control flow of v1.4: `Activity`, `Flow`, `DecisionNode`, per `Lane` |
| Where documents live and their lifecycle | C18 | `Placement` and `LifecyclePolicy` (proposal G18, §4) |
| Log entry schema | C16, C17 | `atLog.fields` (+ N2, N3) |

**What it shows when there is none.** Every conformance cell says «no specification» in the same way the layer-2
and layer-3 cells say `not adopted` today (`tack/README.md:20,245-247`): a sentence, never a zero and never a green.
The Lanes page keeps its trace columns; the closure rule falls back to «a commit naming the unit after the lane
ended» (the half of C5 that needs no `Status` vocabulary).

**Current views that become conformance views.** A conformance view is a trace view joined to a norm: it shows the
measure, the norm's threshold or domain, and the verdict.

| View today | Norm it checks | Element |
|---|---|---|
| Lanes, «over time» and the 90-minute residue (`collectors/lane-run/collect.mjs:347,379`) | RC-20 lane time limit | `thRC_20_0` |
| Timeline marker and `context_peak` at 200k (`metrics/layer1.mjs:106-107`, `board/api.mjs:13`) | RC-51 context ceiling, soft/hard | `thRC_51_0` |
| Lanes attention, «waiting» lanes not closed (`board/api.mjs:197-214`) | P13 / RC-17: the `Status` flip in the closure commit | `atPrompt` `Status` + `nRC_17` |
| Lanes, «Decisions taken (unattended)» counts (`collectors/lane-run/collect.mjs:136-138`) | RC-21, RC-25, R-TACK-4 | `Delegation`, `Decision.provisional` |
| Insights, first-shot share and causes (`metrics/layer3.mjs:30,64-65,105`) | §21.3 self-assessment fields | `atLog.fields` |
| Notifications `cz_ask` (`notify/notifier.mjs:101`) | RC-26 critical zone | `FileSet`, reserved `DecisionClass` |

**The health invariants are the first case.** The four signals kept as invariant breaks
(`discovery_2026-10-18_harness_health_retrospective.md:264-272`) are each a norm with a threshold over a trace:

| Signal | Red when | Norm in the specification | Trace Tack already holds |
|---|---|---|---|
| S2t | a lane turn over its limit this week | RC-20, `Threshold` hard 90 min | lane work time (R-TACK-5) |
| S4a | active log above 40 entries | P9, `LifecyclePolicy` BW on the log placement, `bound` = 40 | not held: needs a document reader (a count over `docs/claude-code-log.md`) |
| S4d | a prompt `da eseguire` > 1 day after its lane closed | P13/RC-17, `Status` domain, owner CC | lane outcome and stop; prompt status (`board/api.mjs:213-214`) |
| S5 | an interleaving on a front | RC-33 one chat per front, `Change.owner` | front and chat per lane |

Derived from the specification, the signal definition no longer carries a number: S4a reads its bound from the
policy, so the 20/40 disagreement (X1) becomes either impossible (one bound) or a visible conformance failure of
the KB-side statement against the model. The retrospective's blind class «rules inconsistent with each other»
(`:302-307`) becomes, for placements and thresholds, a model check (C-G18f) rather than a signal.

The yellow (diagnosis) signals (S1a/b, S2, S3a/b, S4b/c, S6/S6u, `:278-287`) stay monitoring: trend lines with no
norm behind them, shown with or without a specification.

## 4. Metamodel fit

**Version.** The prompt names v1.3; the files in `~/jjodel-papers/2026-sosym-harness-models/jjodel/` are at **v1.5**
(`harness.emf:1`, `@namespace uri .../1.5` at `harness.emf:32`). v1.4 (G16, control flow) and v1.5 (G17, lanes of the
flow) add nothing about documents, so the fit below holds for v1.3 to v1.5 alike. Everything cited is v1.5.

**What v1.5 already holds.**

| Concept of the prompt | v1.5 element | Fits? |
|---|---|---|
| Store | `Repository{name, kind, capacity, public}` (`harness.emf:105-110`), `RepositoryKind {Versioned; KnowledgeBase; Session; Local; Tracker}` (`:101`) | Mostly. Git = Versioned, KB = KnowledgeBase with `capacity = 6` (instance `repoKB`, `jjodel.harness.jjs:199-203`), chat context = Session. No kind for **memory** (Claude Code auto-memory, claude.ai memory): `Local` is the nearest and loses the distinction "loaded every session". |
| Placement of an artifact kind | `ArtifactType.storedIn : Repository[1]` (`harness.emf:118`) | **No.** One store per kind. "Original in git, distilled projection in the KB" cannot be said. The model works around it with `storedIn +=` (`jjodel.harness.jjs:1952-1978`, 27 assignments), which a `[1]` feature does not allow, and with a separate kind for each copy (`atCheckpoint` in `repoKB`, `:447-450,1973`; the dated copies in `docs/sessioni/` have no kind at all). |
| Lifecycle policy kind | `ArtifactType.lifecycle : Lifecycle` with `{Transient; WriteOnce; AppendOnly; Replaceable; Generated}` (`harness.emf:102,115`) | **Partly.** immutable = `WriteOnce`; append-only = `AppendOnly`; single replaced slot ≈ `Replaceable` (but `Replaceable` is also used for every edited governance file, `jjodel.harness.jjs:223-289`, so "one slot, overwritten whole" is not distinguished from "edited in place"); **bounded window with rotation**: missing; **distilled from sources**: `Generated` + `generatedFrom : ArtifactType[0..1]` (`harness.emf:121`) covers one deterministic source (AGENTS.md), not N sources distilled by an agent. |
| Trigger, condition, owner | `Activity.trigger : TriggerKind {Request; Event; Schedule}` (`:134,158`), `ArtifactType.producers : Role[*]` (`:119`) | Indirectly. A policy's trigger can only be expressed by inventing an `Activity` that outputs the kind; the condition has no slot; "owner" is any producer, not the one role accountable for the rule. |
| Numeric bound (20 or 40 entries, 6 KB files) | `Threshold{name, metric, unit, soft, hard, origin}` contained by `Norm` (`:228,233-240`) | **Yes, but unused for documents.** P9's 40 is free text in `nP9.statement` (`jjodel.harness.jjs:1525-1527`); the model has seven thresholds, none on a document (`:1048-1455`). |
| Provenance of a distilled copy | `Artifact{name, date, status, producedIn, trust, verified, corrects}` (`:290-301`) | **No.** No source list, no hash. `Trust` + `verified` is a date of human/agent check, i.e. a check by content, which the prompt rules out. |
| "Rules disagree" | `Norm.supersededBy`, `Norm.statedIn : ArtifactType[1..*]` (`:224,227`) | Partly. `statedIn` records where a norm is written; nothing says that two artifacts stating the same norm must state the same number. |

**Proposal (G18, not applied).** Written in the notation of `harness.emf`. It adds; it renames nothing.

```
// G18. Stores, placement and lifecycle policies of documents.
enum RepositoryKind { Versioned; KnowledgeBase; Session; Local; Tracker; Memory; }   // G18: Memory
enum PlacementRole { Original; Projection; }
enum PolicyKind { Immutable; AppendOnly; ReplacedSlot; BoundedWindow; Distilled; }
enum PolicyTrigger { OnWrite; OnSessionEnd; OnCheckpoint; OnLaneClose; OnThreshold; OnSchedule; OnSourceChange; }

class Repository {
  // existing features unchanged; capacity keeps its meaning (documents), 0 = unbounded
  attr String capacityUnit;          // G18: "files", "entries"; empty = files
}

class ArtifactType {
  // existing features unchanged; storedIn is kept and means the store of the Original placement
  val Placement[*] placements;       // G18: one Original, any number of Projections
}

class Placement {
  ref Repository[1] store;
  attr PlacementRole[1] role;
  attr String pathPattern;           // regular expression in that store, e.g. ^docs/sessioni/sessione_[0-9-]{10}(_[0-9])?[.]md$
  val LifecyclePolicy[1] policy;
}

class LifecyclePolicy {
  attr PolicyKind[1] kind;
  attr PolicyTrigger[*] triggers;
  attr String condition;             // e.g. "entries > bound", "context >= 60%", "keyword checkpoint"
  ref Role[1] owner;                 // the one role accountable for applying the policy
  ref Norm[1] norm;                  // the norm that states it (its statedIn, enforcedBy, origin)
  ref Threshold bound;               // BoundedWindow: the window; must be one of norm.thresholds
  ref Placement archive;             // BoundedWindow: where rotated entries go
  ref ArtifactType[*] sources;       // Distilled: the kinds it is distilled from
}

class Artifact {
  // existing features unchanged
  val SourceRef[*] provenance;       // G18: Distilled only
}

class SourceRef {
  attr String[1] path;
  attr String[1] hash;               // content hash of the source at distillation time (git blob id in a Versioned store)
  attr String revision;              // commit of the store, when Versioned
}

// C-G18a ArtifactType: placements->select(role = Original)->size() = 1 when placements is not empty,
//        and that placement's store = storedIn
// C-G18b LifecyclePolicy: kind = BoundedWindow implies bound <> null and archive <> null
//        and archive.policy.kind = AppendOnly and norm.thresholds->includes(bound)
// C-G18c LifecyclePolicy: kind = Distilled implies sources->notEmpty();
//        Artifact of a Distilled placement: provenance->notEmpty()
// C-G18d Placement: role = Projection implies policy.kind in {ReplacedSlot, Distilled}
// C-G18e Repository: capacity > 0 implies the Artifacts placed in it count <= capacity
// C-G18f at most one LifecyclePolicy per (ArtifactType, Repository) whose norm is in force at a date
```

Notes on the choices.
- **Memory** is a kind of its own because its loading differs from `Local` (loaded at every session start, the
  `MEMORY.md` index) and its owner differs (the agent writes it, the human never does).
- **Bound via `Threshold`**, not a new integer attribute: v1.3 already says a ratified number changes only by a
  decision (RC-51, `harness.emf:231-232`). The 20/40 disagreement (I01, I02) then becomes a model fact: two
  thresholds on one placement, or one threshold and a different number in a `statedIn` text, which C-G18f and a
  generator over `statedIn` can catch. This is the class the retrospective lists as invisible to every signal
  (`discovery_2026-10-18_harness_health_retrospective.md:302-307`).
- **`Lifecycle` is left as it is** (`harness.emf:102`) for compatibility; `PolicyKind` is the closed list of the
  prompt. A later version may derive `lifecycle` from the Original placement's policy.
- **Provenance by hash, never by content**: a distilled copy is current iff every `SourceRef.hash` equals the
  hash of `path` at the store's head. The check is mechanical and needs no reading of the copy.

## 5. The KB as a source

**Where it lives.** The KB is the Project Knowledge of the claude.ai project (`repoKB`, `jjodel.harness.jjs:199-203`).
Nothing in this repository reads it: no script, gate or Tack collector names it (§1, §2). Its rules are in the
claude.ai project instructions only («project instructions, claude.ai, read 2026-10-20»), and one of the six files,
`contesto_progetto.md`, has no current original in git: the last tracked copy is
`docs/archivio/claude_contesto_progetto_2026-08-10.md` (commit `e14c2b17d`, 2026-08-14). The KB is therefore a
store of projections (copies of git files: `CLAUDE.md` and `PROTOCOL.md` per PI, or `HARNESS-DOCS.md` and
`spec_attive.md` per HARNESS-DOCS, X2) and of originals with no git source (`contesto_progetto.md`,
`sessione_CORRENTE.md`, whose dated copies are what git keeps).

**What a monitor would need to read it.** Three routes, in order of cost:
1. **A manifest written by the owner at each checkpoint**, committed to git: one line per KB file with name, size,
   upload time and, for projections, the source path and the git blob hash it was copied from
   (`docs/harness/kb-manifest.json`, name to be decided). The chat already replaces `sessione_CORRENTE.md` and writes
   the dated copy at each checkpoint; the manifest is one more file in the same step. The monitor reads git only.
   Its weakness: it is self-reported, so it can drift from the real KB exactly as I01 drifted from CLAUDE.md.
2. **An export by Alfonso** (the file list of the project as shown by claude.ai), pasted into a file on demand. Same
   reader as route 1, human-triggered, rare.
3. **A direct reader** of the claude.ai project. This repository has no client for it and the harness has never
   used one; it would bring credentials into a monitor that today keeps metadata only and binds to 127.0.0.1
   (`tack/README.md:215,268-270`). Out of v0.

**What can be checked without the KB, from git alone.**
- Every dated session copy exists in `docs/sessioni/` with the expected name, and the gap between consecutive
  copies of one chat (a proxy for "a checkpoint happened").
- The originals of the KB projections (`CLAUDE.md`, `docs/PROTOCOL.md`) and their change dates: a change after the
  last dated session copy means the KB copy is stale **unless** the checkpoint re-uploaded it, which only a manifest
  can say.
- The log bound (P9 and the project instructions, §2) on `docs/claude-code-log.md`.
- That every discovery lane produced a file in `docs/discovery/` (lane closed, report path committed).

**What cannot be checked without it.** The KB file count against 6; whether `sessione_CORRENTE.md` was replaced or a
second session file was added; whether a projection is stale; the content of `contesto_progetto.md`. The
retrospective already lists KB weight (I05, 339 documents) as having no series in the repository
(`discovery_2026-10-18_harness_health_retrospective.md:310-311`); route 1 is the cheapest way to give it one.

## 6. Open questions

- **Q1. Where does the specification live for Tack?** A model file in the observed repository (e.g. `.tack/harness.json`,
  a serialisation of a `harness.emf` instance), or the Jjodel model in `~/jjodel-papers/` read by path.
  Recommended: in the observed repository, versioned with the norms it describes; the papers model stays the source
  for the paper and is exported into it, never read across repositories.
- **Q2. Which serialisation does Tack read?** XMI (`jjodel.harness.xmi`), the JjScript (`.jjs`), or JSON.
  Recommended: JSON with the `harness.emf` feature names, validated by `tack check`; Tack stays dependency-free and
  does not parse XMI or JjScript.
- **Q3. Should the identifier pattern (N1) and the field syntax (N2) go into the metamodel or into Tack's adapter?**
  Recommended: N2 into the metamodel as `FieldSpec.syntax` (it is a harness fact, and two tools already parse it:
  `check:docs` and Tack); N1 as `identPattern` on `ArtifactType` of the prompt, since the id is a field of the prompt.
- **Q4. Which of the 20/40 log bounds is the norm?** Recommended: 40, the bound every gate and P9 enforce (X1); the
  claude.ai project instructions are the stale side. Changing them is Alfonso's (they are outside git and outside
  this lane).
- **Q5. Which KB membership is the norm?** Recommended: the HARNESS-DOCS list (X2), already followed by the model;
  the PI list is to be aligned by Alfonso. Not decided here: it touches the KB, an RC-26-adjacent governance store.
- **Q6. KB reading (§5).** Recommended: route 1, a manifest committed at each checkpoint, as a harness-front change
  (it adds a step to the checkpoint procedure); Tack only reads it.
- **Q7. Does G18 extend `ArtifactType` or replace `storedIn` and `lifecycle`?** Recommended: extend (placements and
  policies alongside), keep `storedIn` as the store of the Original placement, derive `lifecycle` later. No rename,
  no break of the existing model instance.
- **Q8. Does the conformance layer belong in v0?** Recommended: no. v0 closes as a monitor; conformance starts at the
  slice that reads a specification (design note §6, §7).

## 7. Decisions taken (unattended)

- The metamodel is read at v1.5 although the prompt names v1.3; v1.4 and v1.5 add nothing on documents (§4).
- The closed list of policy kinds is applied as given; rows that are schemas, orders, moves or operations are marked
  DNF with the reason (§2), not forced into a kind.
- Monitor heuristics (C21, C22), launcher layout (C13) and platform facts (C24) are classed as out of the
  specification (§1.2, §3).
- The design note sets Q1, Q2, Q3, Q7 and Q8 as recommended; they bind only the design, not code.

## 8. Decisions awaiting Alfonso (RC-26 list only)

- Q4 and Q5 change the claude.ai project instructions, a governance text outside git. Alfonso's to change.
- The metamodel files are read-only to this lane; G18, N1 to N4 are proposals for the paper repository.
