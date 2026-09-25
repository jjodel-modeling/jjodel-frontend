# Discovery: why a feature costs more now than before

- **Executor**: project chat (claude.ai), not Claude Code. Read-only, on a fresh clone of `origin/alfonso-frontend-jjtl` at `3092e5aa8` (2026-09-24 10:05). No Prompt-ID: the measurement was asked in chat, and this report is its only artifact.
- **Not covered**: everything after `3092e5aa8`. The three lanes of 2026-09-24 afternoon (`P-2026-09-24-1520`, `1610`, `1630`) are unpushed and missing from every number below.
- **Script**: `docs/discovery/harness/claude_harness_2026-09-25_cost_per_feature.py`, run from the repo root on a full clone. It prints Tables 1 to 3.

Tags: **[M]** measured by the script, **[D]** deduced, **[R]** read from a checkpoint.

## 0. Hypotheses under test

- **H1**: the harness adds a fixed per-lane cost that is now larger than the code it wraps.
- **H2**: a growing share of lanes works on the harness itself, not on the product.
- **H3**: code throughput collapsed.
- **H4**: ambient friction (worktrees, ports, misrouting) is the growing cause of rework.
- **H5**: the extra cost buys something measurable: less rework, more tests.

## 1. Method

Every non-merge commit since 2026-03-01 is classified by the files it touches. The classes are `src` (TS, TSX, SCSS or JS under `frontend/src`, not tests), `test`, `docs` (anything under `docs/` or any `.md`), `harn` (`frontend/scripts`, `.claude`) and `other`. Files with more than 5000 changed lines in one commit are excluded as bulk or generated.

A lane is the set of commits whose subject or body carries a Prompt-ID. This tagging is reliable only from mid-September. Log entries come from the active log, the archive and the inboxes, de-duplicated on (date, title), from 2026-08-02, when `Corregge` and `Causa` became fields.

Periods run by calendar month, and September is split into 09a (1 to 14) and 09b (15 to 24).

## 2. Findings

### 2.1 Envelope versus code [M]

| Period | Active days | Commits | Docs-only | Src commits | Src lines | Test lines | Docs lines |
|---|---|---|---|---|---|---|---|
| 2026-07 | 24 | 190 | 58 | 127 | 26701 | 4870 | 20981 |
| 2026-08 | 31 | 751 | 426 | 309 | 67242 | 19100 | 154267 |
| 2026-09a | 13 | 299 | 203 | 89 | 14879 | 12151 | 40470 |
| 2026-09b | 9 | 312 | 244 | 60 | 9696 | 7526 | 40058 |

The ratio of docs-only commits to commits touching `src` shows the trend:

| Period | Docs-only commits per src commit |
|---|---|
| March | 0.01 |
| April | 0.15 |
| May | 0.24 |
| June | 0.12 |
| July | 0.46 |
| August | 1.38 |
| 09a | 2.28 |
| 09b | 4.07 |

Docs lines per src line went from 0.79 in July to 4.13 in 09b.

**H3 is falsified.** Src lines per active day are about 1110 in July, 1145 in 09a and 1077 in 09b. The code produced per day has not collapsed. What grew is everything around it.

### 2.2 Per-lane envelope, 2026-09-17 to 09-24 [M]

In product lanes the code is a small share of the output.

| Lane | Commits | Docs-only | Src lines | Test lines | Docs lines |
|---|---|---|---|---|---|
| S6 Symbol Editor (`P-2026-09-21-1455`) | 7 | 6 | 142 | 151 | 401 |
| Default view fill (`P-2026-09-22-2105`) | 8 | 7 | 55 | 43 | 660 |
| Simulator step 1 (`P-2026-09-23-1850`) | 6 | 5 | 599 | 549 | 363 |

The S6 lane has four docs commits after the code commit:

- the Status flip;
- the log entry and addendum;
- the human visual-check line;
- the rectification of that line.

The fill lane has five docs commits after its single code commit: log entry and Status, ACK, false-ACK correction, real outcome. **H1 holds**: for a small fix, the fixed cost dominates. The simulator lane shows the opposite, with real code and a proportionate envelope. The fixed cost hurts small lanes, and small lanes are most of them.

### 2.3 Lanes about the harness or about integration [M, classification D]

Nineteen lanes carry a Prompt-ID in the week. Ten of them work on process or integration, not on the product:

- the CLAUDE.md split (1930, 2110);
- log rotation tooling (2015);
- the merge gate sequence (1622, 1735, 1740, 1745);
- harness mechanization (1835, 1620);
- the docs repair (1420).

| Group | Lanes | Commits | Docs-only | Src lines | Test lines | Docs lines | Harness lines |
|---|---|---|---|---|---|---|---|
| Product | 9 | 39 | 33 | 968 | 880 | 3609 | 0 |
| Harness / integration | 10 | 67 | 63 | 0 | 792 | 16266 | 814 |

**H2 holds.** In one week the harness and integration lanes took more lanes than the product, 63% of the commits and 82% of the docs lines. The classification of the lanes is mine, and the merge gate is arguably product work. Moving it to the product side still leaves six lanes out of nineteen on the harness proper.

### 2.4 Rework and causes [M]

| Period | Entries | With `Corregge` | Rework rate | Cause (a) | Cause (c) | Cause (f) | Cause (g) |
|---|---|---|---|---|---|---|---|
| August | 362 | 75 | 21% | 41 | 42 | 13 | 6 |
| 09a | 122 | 22 | 18% | 14 | 14 | 1 | 2 |
| 09b | 69 | 9 | 13% | 5 | 9 | 2 | 2 |

**H4 is not supported by the log.** Ambient cause (g) stays marginal. The misrouting of 2026-09-24 [R] was stopped by the Prompt-ID guard and produced no rework entry. The log cannot see that friction because it costs time, not correctness, so H4 stays open but unmeasurable here. The dominant causes are still (a), an ambiguous prompt, and (c), a wrong assumption about the code.

**H5 holds in part.** The rework rate fell from 21% to 13%, and test lines per src line rose from 0.18 in July to 0.78 in 09b. The harness buys something real.

## 3. Reading

The executor produces about the same amount of code per day as in July. It spends a large and growing multiple of that on the envelope, and half the lanes now serve the harness itself. The envelope is not waste: rework fell by a third and tests quadrupled relative to code. But the envelope is flat per lane, so it hits small fixes hardest. Several records of one event are written as separate commits:

- Status;
- log entry;
- ACK;
- ACK correction;
- checkpoint;
- `contesto_progetto`.

Each is a separate round with Alfonso.

## 4. Open questions for Alfonso

1. Is a harness budget acceptable? For example, at most one lane in four whose subject is the harness, with the ratio of docs-only to src commits tracked as a gate warning.
2. Can the post-code docs of a lane collapse into one commit? That commit would hold Status, log entry and visual-check line together, written once after the GO.
3. Should RC-3's fast lane become the declared default, with the full lane reserved to critical zone, migrations and exported interfaces?
4. How should time lost to ambient friction be measured, since the log does not see it? One option is an optional `Rounds` field (messages exchanged with the operator) in the entry.

## 5. Limits

- Line counts measure size, not value or effort.
- Lanes are identifiable only from mid-September, so the per-lane comparison has no "before".
- The period 09b has 9 active days, so its ratios are noisy.
- Docs lines include prompts and reports, which carry real design work.
- The product-versus-harness split of lanes is a judgment call.
