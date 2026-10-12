# Anonymization map for the CAIN 2027 short paper and its artifact

Prompt-ID: P-2026-10-11-1630 · written 2026-10-11 · status: proposal, nothing rewritten yet.

The CSVs in `data/` keep the real ids: they stay in this repository. This file lists every identifying
string the paper or a public artifact would expose, the cover proposed for it, and the columns of each CSV
that must be rewritten before the artifact leaves the repository. Counts were taken on 2026-10-11 at
`154311f55` with `command grep -o` (BSD grep, not the ugrep wrapper) and `git log` on
`alfonso-frontend-jjtl`; the commands are listed in §5.

## 1. Inventory

| Category | Identifying strings | Where, how many |
|---|---|---|
| Project and product | `Jjodel`/`jjodel`, `JjEL`, `JjTL`, `JjScript`, `JjOM`, `Jodie`/`Jjodie`, `jjform`, `windoww`, the `.jjodel` file extension | `jjodel` 37 in `docs/decisions.md`, 402 in tracked `frontend/scripts/`, 577 in commit messages; 489 of 7567 tracked paths carry a product token |
| Venue | «MODELS demo» (a conference), `CAIN`, branch `cain-data` | `MODELS` (case-sensitive) 23 in `docs/decisions.md`, 43 in commit messages |
| Organisation and hosting | GitHub org `jjodel-modeling` (repos `jjodel-frontend`, `jjodel-lanes`), `MDEGroup/jjodel`, `app.jjodel.io`, a Docker Hub account in the README | `jjodel-modeling` 3 in `docs/decisions.md` (RC-41), 27 in `frontend/scripts/` (auto-intake config, fixtures) |
| Affiliation | the university e-mail domain of the maintainer and a student; a research-centre domain | on about 4230 of 5772 trunk commits (author e-mail; 4231 when re-run) |
| People | the maintainer's first name «Alfonso» in rules and markers (`ratified by Alfonso`), his full name and handle `apierantonio`; co-maintainer handle `jdirocco` (RC-41); six other commit authors; external handles `tmaog`, `jean-malm-mdh`, `DamianoNaraku`, `rik1599` | «Alfonso» 383 in `docs/decisions.md`, 18 in `docs/PROTOCOL.md`; label `needs-alfonso` in the auto-intake config |
| Chats and sessions | chat ids `C-YYYY-MM-DD-HHmm` (55 distinct), `Claude-Session:` trailers with `https://claude.ai/code/session_…` URLs (87 distinct), local session UUIDs in `~/.jjodel-lanes/*/session.txt` (327) | `Claude-Session` on 745 trunk commits |
| Paths | `/Users/alfonso/…`, `~/jjodel`, `~/jjodel-release`, `~/jjodel-w-<x>` (125 worktrees), `~/jjodel-a-<n>`, `~/.jjodel-lanes/` | `/Users/alfonso` 59 times in script fixtures; `.jjodel-lanes` 86 in `frontend/scripts/` |
| Branches | trunk `alfonso-frontend-jjtl`, `alfonso_dev`, `alfonso-frontend-dev`, lane branches with product tokens (`jjel-lexer-own-keys`, `jjodie-reserved`, `jjscript-*`) | trunk name in 513 commit messages |
| Language | `docs/decisions.md` is mostly Italian: 64 of 79 headings, 403 «…» quotes, many verbatim from the maintainer («procedi», «decidi tu su tutto ma avanza il più possibile») | a verbatim Italian quote is a full-text search key and a language signal |
| Time zone | P- and C- ids are local wall-clock times; git dates carry `+0200` | every id |
| Domain fingerprint | a web metamodelling workbench with M1/M2 levels, viewpoints, an expression, a transformation and a scripting language, an in-tool assistant, a Petri/state-machine simulator with an «I/O board» | not a string; recognisable by MDE reviewers under any cover name |
| Models | `claude-opus-5-5` pin, `Co-Authored-By` model names, `Model:` trailers | public models; keep. The Fable 5.1 and 1M-context commits (216 and 146) narrow the population only if those models had restricted access at the time: check before quoting per-model counts |

Repository visibility is not determined here (no network access). Origin is
`github.com/jjodel-modeling/jjodel-frontend`; 5582 of the 5772 trunk commits are on
`origin/alfonso-frontend-jjtl`, including `docs/decisions.md`, `docs/PROTOCOL.md` and `frontend/scripts/`. If that
repository is public, every verbatim quote, every rare id (`R-SIM-120`, `RC-45`) and every commit sha is a search
key that leads to it, under any renaming.

## 2. Covers

| Original | Cover in prose | Cover in identifiers and paths |
|---|---|---|
| Jjodel (project, tool) | ProjectM, MTool | `mtool` |
| JjEL, JjTL, JjScript, JjOM | EL, TL, SL, OM | `el`, `tl`, `sl`, `om` (`useJjomSync.ts` becomes `useOmSync.ts`) |
| Jodie / Jjodie | the assistant | `assistant` |
| MODELS demo | the conference demo | `<CONF>` |
| `frontend/scripts/lane-run.mjs` | the lane runner | `harness/lane-runner.mjs` |
| `frontend/scripts/auto-intake.mjs` | the intake bot | `harness/intake.mjs` |
| `frontend/scripts/lane-tracking.mjs`, `lane-board/` | the lane tracker, the lane board | `harness/lane-tracker.mjs`, `harness/board/` |
| `frontend/scripts/gates/docs-digest.ts` | the digest generator | `harness/gates/docs-digest.ts` |
| `frontend/scripts/gates/check-*.ts`, `hooks/*.mjs` | the doc gates, the tool hooks | `harness/gates/`, `harness/hooks/` |
| `docs/decisions.md`, `docs/PROTOCOL.md` | the decision register, the protocol | `rules/decisions.md`, `rules/PROTOCOL.md` |
| `docs/claude-code-log.md`, `docs/log-inbox/` | the prompt log, the lane inboxes | `log/prompt-log.md`, `log/inbox/` |
| the maintainer («Alfonso», full name, `apierantonio`, label `needs-alfonso`) | M, «the maintainer» | `maintainer`, `needs-maintainer` |
| co-maintainer (`jdirocco`) | C1 | `comaintainer` |
| other commit authors, in order of commit count | D1..D6 | — |
| external testers and issue authors (`tmaog`, `jean-malm-mdh`) | T1, X1 | — |
| GitHub org and repos | `<org>/<repo>`, `<org>/<lanes-repo>` | — |
| `/Users/alfonso/jjodel`, `~/jjodel-release`, `~/jjodel-w-<x>`, `~/.jjodel-lanes/` | — | `<MAIN>`, `<RELEASE>`, `<WT>/<x>`, `<LANES>/` |
| trunk `alfonso-frontend-jjtl`; `alfonso_dev`, `alfonso-frontend-dev` | the trunk; dev | `trunk`, `dev` |
| `Claude-Session` URLs, session UUIDs | dropped | a boolean `has_session` or `S-<hmac8>` |
| commit shas | — | HMAC-SHA256 with a private key, 12 hex, the same in every CSV; the key is released at camera-ready |
| e-mail addresses | dropped | — |

Kept as they are: decision ids (`RC-n`, `R-<SERIES>-n`, `D-UI-n`: no prefix spells the product), prompt ids
`P-…` and chat ids `C-…` (timestamps, not accounts; remap chat ids to `C-001…` if R1 below applies), dates (date
only, or UTC), model names, port numbers.

## 3. Columns to rewrite in the public artifact

| CSV | Columns to rewrite | Rule |
|---|---|---|
| `data/decisions.csv` | `section`, `header_at_intro`, `header_now`, `rc26_hand_note` | product tokens, «Alfonso», `MODELS`; translate Italian headings or replace them with an English label |
| | `intro_commit`, `trunk_commit`, `ratification_commit`, `amendment_commits` | HMAC |
| | `intro_author` | pseudonym (M, C1, D1..D6, `agent`) |
| | `adopting_chat` | keep or remap to `C-nnn` |
| | `id`, `id_token`, `series`, `intro_prompt_id` | keep |
| `data/conformance_daily.csv` | `trunk_commit` | HMAC |
| `data/conformance_failures.csv` | `first_commit`, `fixed_commit` | HMAC |
| | `author` | pseudonym |
| | `chat` | keep or remap |
| `data/rc18_daily.csv` | none | — |
| `data/autonomy_weekly.csv` | none | — |
| `data/rules.csv` | `enforced_by`, `evidence` | path cover (§2); quotes reviewed by hand for names, product tokens and Italian |
| `data/violations_daily.csv`, `data/comparison.csv` | `rule` | keep the rule ids; the rule names carry no product token |
| `scripts/governance-dataset.ts` | the import path, `REF`, `LANES`, `REGISTER`, comments naming the product | path cover; the default `--ref` becomes an HMAC or is dropped |
| `scripts/rc26-hand-check.json` | `note` | product tokens and «Alfonso» |

The paper text: no verbatim Italian quote, no section title, no path, no sha. Paraphrase the rules and say so.

## 4. Residual risks

- **R1. A public origin.** If `jjodel-modeling/jjodel-frontend` is public, ids, quotes and shas lead to it. In order
  of cost: paraphrase every quote; remap id prefixes (`RC` to `G`) and shift every timestamp by a constant; host
  the artifact on an anonymising mirror. Recommended: check the visibility before the artifact is built.
- **R2. Language, venue and affiliation together** narrow the author set to a handful of groups. The Italian is the
  hardest to remove; the artifact ships English labels only.
- **R3. Domain fingerprint.** Describe the tool as «a web-based modelling workbench», nothing more specific.
- **R4. Raw lane data.** `~/.jjodel-lanes/*/log.jsonl` embeds `/Users/alfonso` (328 lanes), session ids (327) and
  e-mail addresses (149). Ship derived CSVs only, never the lane folders.
- **R5. Third parties.** Six commit authors other than the maintainer, and two external handles, appear in commit
  metadata and fixtures. They are not authors of the paper; they are removed regardless of anonymity.
- **R6. Time zone.** Local-time ids and `+0200` offsets place the authors in Central Europe; normalise to UTC if
  that matters.

## 5. Commands behind the counts

- `command grep -o -i -E '<re>' docs/decisions.md | wc -l`, same on `docs/PROTOCOL.md`;
  `git ls-files -z frontend/scripts | xargs -0 command grep -o -i -E '<re>' | wc -l` (control: `jjodel`, 402);
  `git log --format=%B alfonso-frontend-jjtl | command grep -o -i -E '<re>' | wc -l`.
- `git log --format='%an|%ae' alfonso-frontend-jjtl | sort | uniq -c | sort -rn` (authors and domains);
  `git log --format='%(trailers:only,unfold)' alfonso-frontend-jjtl | sed 's/:.*//' | sort | uniq -c` (trailer keys);
  `git rev-list --count origin/alfonso-frontend-jjtl` (5582).
- `git ls-files | command grep -c -i -E 'jj|jodie'` (489 of 7567 paths); `git worktree list | wc -l` (125).
- `command grep -l '/Users/alfonso' ~/.jjodel-lanes/*/log.jsonl | wc -l` (328).

The inventory was taken by a helper agent of this lane. Re-run by the lane at 16:46 with the same commands:
«Alfonso» in `docs/decisions.md` 383, `jjodel` 37, `MODELS` 23, university domain on 4231 author lines, distinct
`Claude-Session` values 92 (87 URLs and 5 chat ids). The other counts are the agent's, not re-run.
