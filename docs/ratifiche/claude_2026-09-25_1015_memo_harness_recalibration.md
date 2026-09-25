# Memo: harness recalibration (cost per feature, model pin, permission mode)

- **Author**: project chat (claude.ai, Cowork), 2026-09-25 10:15. No Prompt-ID: the memo was asked in chat and no lane executes it.
- **Status**: proposal, to be ratified by Alfonso. Section 6 holds the rows for `docs/decisions.md`; they enter the file only after ratification.
- **Inputs**: `docs/discovery/discovery_2026-09-25_cost_per_feature.md` (c5d1bcfcc), `docs/discovery/discovery_2026-09-24_harness_gate.md` §4 and Q6, `docs/decisions.md` RC-3 and RC-15, `.claude/settings.json` on the trunk.

Tags: **[M]** measured for this memo, **[R]** read, **[D]** deduced.

## 1. What was measured, and how

Git answers what was committed. It cannot say which model ran a session or in which permission mode. That lives in the Claude Code transcripts on Alfonso's Mac (`~/.claude/projects/-Users-alfonso-jjodel*/*.jsonl`, retained 3650 days by `cleanupPeriodDays`). I read them with throwaway read-only Python scripts run through the native shell. I also read the user-level and per-worktree settings and the shell history. Nothing was written outside this memo.

Per session (a `.jsonl` file) since 2026-09-15: the models in the assistant turns, the `permissionMode` field of the user turns, the `/model` commands and their output, and the tool results that report a denial.

## 2. The model pin (RC-16) [M]

**The pin and the runs disagree, and the gap is a ritual.** The trunk `.claude/settings.json` pins `claude-opus-5` (RC-15 decision 1). No commit ever wrote `claude-opus-5-5` there. RC-16 and prompt `P-2026-09-23-0718` do not exist on any ref. The harness gate report (Q6) established this on 2026-09-24, and it still holds.

What the Claude Code sessions ran, by transcript:

- The first Claude Code turn on `claude-opus-5-5` is **2026-09-23 16:05** local, in `~/jjodel`. The 2026-09-22 21:07 commit that names Opus 5.5 (b7b8cbde3) comes from the project chat, not from Claude Code. So "effective use since 22/9" holds for the architect and is off by a day for the implementer.
- Thirteen sessions ran Opus 5.5 from then to this morning. Each one I could trace started with `/model` (`/model Opus` or bare `/model`), whose output reads "Set model to Opus 5.5 and saved as your default for new sessions", followed by ".claude/settings.json pins Opus 5". The others are resumed sessions.
- The channel is `/model`, not a launch flag. The recent launches in the zsh history are `claude --dangerously-skip-permissions` with no `--model`.
- The one session this morning that skipped the switch (`~/jjodel-release`, 2026-09-25 09:25) ran `claude-opus-5`, the pin. **The pin now produces the model nobody wants whenever the human forgets the ritual.**
- `/model` also writes the user-level default (`~/.claude/settings.json` now reads `"model": "opus"`). It has no effect on the next launch, because the project pin outranks the user level. So the ritual repeats in every session.
- The per-worktree override works as designed: `~/jjodel-gate/.claude/settings.local.json` holds `claude-sonnet-5` and the gate sessions ran Sonnet 5.

Adjacent facts: two sessions on 2026-09-18 in `~/jjodel` ran `z-ai/glm-5.3` and `anthropic/claude-sonnet-5` through OpenRouter, about 480 turns in all. `~/.bashrc` still exports the OpenRouter base URL. It is inert under zsh, where the same lines are commented out. P6 already covers other vendors, so this memo only records it. The trailer form drifted: 6 commits carry the bare ID (`Model: claude-opus-5-5`) where P6 asks for `Anthropic Claude Opus 5.5`.

**Recommendation.** Ratify RC-16: the pin becomes `claude-opus-5-5`, superseding the ID in RC-15 decision 1 (the rest of that decision stands: one place, full ID, `CLAUDE.md` §0 defers to it). A deviation goes through the worktree's `settings.local.json`, as for the gate lane. No automatic fallback chain. `/model` at session start stops being needed. P6 is unchanged, and the bare-ID trailers are a P6 deviation to note, not to rewrite. The change is one line in `.claude/settings.json`. It belongs to a small lane of its own, because `.claude/` is harness code.

## 3. `--dangerously-skip-permissions` and what is left of RC-15 [M]

**Every working Claude Code session since 2026-09-19 runs in `bypassPermissions`**: 22 sessions out of 22 since 2026-09-21. The user settings add `"skipDangerousModePermissionPrompt": true`, so no confirmation appears at launch. The three sessions with no mode field hold one turn each and did no work.

RC-15 has three layers. Their state under bypass:

| Layer | RC-15 says | Under bypass | Evidence |
|---|---|---|---|
| Deny list (`permissions.deny`) | fails closed | **active** | 5 denials of `rm -rf` forms in bypass sessions (09-21, 09-23, 09-24 ×3); the docs state that deny rules block in every mode |
| Hook `deny` (`bash-guard`) | fails open, adds refusals | **active** | 6 denials in bypass sessions: commit without pathspec (09-21 20:35), docs and code in one pathspec (09-24 17:38) |
| Hook `ask` (`critical-zone`, decision 3) | the Layer Impact Report gate | **not verified** | fired at least 5 times on `VersionFixer.tsx` (09-21, 09-24 twice); every edit went through; the transcript does not record whether a prompt was shown |
| Settings `ask` on `git commit*`, `git push*` (decision 7) | "the human gate" | **not verified** | 43 commits by sessions since 09-21; median 20 s between call and result, compatible with a click but not proof; 3 pushes by sessions since 09-15, all to the trunk |
| Skills | give the form of artifacts | unaffected | not a permission mechanism |

The docs are explicit only on the deny list. On `ask` rules and on a hook's `ask` under bypass they say nothing I can quote. So the two gates RC-15 calls human gates have an unknown status, and the harness has been relying on them for four days.

A structural limit, already declared in RC-15, weighs more under bypass: the deny list sees only the literal form. Under bypass, anything not denied runs. `python3 -c` with `shutil.rmtree` is not `rm -rf`.

**Recommendation.** Keep the bypass. It carries the throughput, and the deny layer works under it. Make the two human gates independent of whether bypass honors `ask`. The PreToolUse input carries `permission_mode`, so the hooks can read it without keeping state:

1. `critical-zone`: in `bypassPermissions`, **deny** with the message "critical-zone lane: relaunch this session without --dangerously-skip-permissions". In every other mode, `ask` as today. Critical-zone lanes are rare (two in four days) and are full lanes by RC-3 anyway, so launching them in the default mode costs little.
2. `bash-guard`: in `bypassPermissions`, **deny** `git push`. Pushing becomes Alfonso's own act, as the working rules already say. Push is the only step that leaves the machine.
3. `git commit` stops being called a human gate. A commit is local and revertible, and the human gates that remain are the GO visivo and the push. RC-15 decision 7 is amended accordingly.

Before writing RC-19, a two-minute probe settles the question for the record, since only an interactive session shows a prompt. In `~/jjodel-gate`, on a scratch branch, launch `claude --dangerously-skip-permissions` and ask for two things: (a) one comment line added to `VersionFixer.tsx`, (b) `git commit --allow-empty -m "probe"`. Note whether a prompt appears for each, then drop the branch. The outcome goes into RC-19 as a measured fact. The three changes above stand either way. If the prompt does appear, change 1 is stricter than needed, and that is acceptable for a zone this rare.

## 4. The four questions of the cost report (§4)

### 4.1 Harness budget

Yes, as a measurement, not as a gate. A warning in `check:docs` would itself be new harness code, which is the problem being measured. The budget: over a rolling week, at most one lane in four whose code commits touch only `frontend/scripts/`, `.claude/` or `docs/`. That test is mechanical, which the cost report's own classification was not. The cost-per-feature script computes it; the project chat runs it once a week and puts the number in the checkpoint. When the budget is exceeded, the only harness lanes allowed are repairs to an enforcement that is shown not to hold. The lane of section 3 is exactly that, and it counts toward the budget.

### 4.2 One closure commit per lane

Yes. After the code commit, the lane writes Status, log entry (or inbox entry) and the visual-check line **into its own worktree and does not commit them**. After Alfonso's GO visivo, a single docs commit carries all three, with the real outcome. An ACK correction before the GO becomes an edit, not a commit. A false ACK stays in the working tree and never enters history. Lanes with no visual check (harness, docs) close with the same single commit right after the code. Per-lane worktrees make this safe: nobody else's index shares that tree (RC-13 stays intact). Consequences: RC-15 decision 8 (two Status flips by hand) becomes one flip, and P13's Status clause is amended. The prompt commit stays: the prompt must be on disk before execution, because the Status guard reads it there. Expected effect on the measured lanes: S6 from 7 commits to 3, the fill lane from 8 to 3.

### 4.3 Fast lane as the declared default

Yes, and it needs no new rule, because RC-3 already says so. The measurement shows it is not practiced: the S6 lane, 142 src lines, carried a full envelope. The one who fails RC-3 is the architect writing the prompts, not the executor. The rule becomes checkable by eye: every prompt header carries `Lane: fast`, or `Lane: full (<RC-3 trigger>)`, where the trigger is one of RC-3's four (critical zone, migration, more than 3 files, exported interface). A full lane without a named trigger is a prompt defect.

### 4.4 Measuring ambient friction

No `Rounds` field. It would be one more field in the envelope. The executor would fill it by self-report, and the executor never sees the rounds between Alfonso and the chat. The transcripts already hold what is needed, and this memo used them: human turns per session, time between a tool call and its result, `/model` switches, denials, sessions per Prompt-ID. The weekly measurement of 4.1 adds a friction table computed from the transcripts: turns per lane and wall-clock time from the first turn to the closure commit. The report carries the numbers, and the transcripts never enter the repo.

## 5. Order of work

1. Alfonso ratifies (or amends) sections 2 to 4, and runs the probe of section 3.
2. The chat writes RC-16 to RC-19 into `docs/decisions.md` (section 6), with the probe outcome in RC-19. One docs commit.
3. One harness lane, fast, three files: the pin line in `.claude/settings.json`, and the `permission_mode` branch in `critical-zone.mjs` and `bash-guard.mjs` with their subprocess tests. It is the first lane to close with a single closure commit (RC-17).
4. P13 amendment (one Status flip, closure commit) and the `Lane:` header in the prompt template: docs, in the same commit as step 2 if Alfonso prefers.

## 6. Rows for `docs/decisions.md` (after ratification)

Written in Italian like the rest of the file.

```
- **RC-16** (2026-09-25): **Il pin dell'implementer è `claude-opus-5-5`.** `.claude/settings.json` fissa
  `claude-opus-5-5`; sostituisce l'ID della decisione (1) di RC-15, il resto della decisione resta (un solo
  luogo, ID intero, `CLAUDE.md` §0 vi rimanda). Le deroghe passano dal `settings.local.json` del worktree e si
  dichiarano nel prompt; nessuna catena di ripiego. Misura (memo del 2026-09-25 §2): Opus 5.5 gira nelle
  sessioni Claude Code dal 2026-09-23 16:05 (nella chat di progetto dal 2026-09-22), sempre via `/model`
  contro un pin che diceva Opus 5; la sola sessione senza il rito (2026-09-25 09:25) ha girato Opus 5.
  Il trailer resta quello di P6 (`Anthropic Claude Opus 5.5`); le 6 forme a ID nudo sono una deroga notata.
- **RC-17** (2026-09-25): **Una corsia chiude con un solo commit di docs.** Dopo il commit di codice la
  corsia scrive Status, voce di log (o inbox) e riga di verifica visiva nel proprio worktree senza
  committarle; dopo il GO visivo un solo commit le porta insieme con l'esito reale. Le correzioni di ACK
  prima del GO sono modifiche, non commit. Le corsie senza verifica visiva chiudono con lo stesso commit
  subito dopo il codice. Il commit del prompt resta. Emenda RC-15 (8): un solo flip dello Status, e la
  clausola Status di P13. La corsia veloce di RC-3 è il default dichiarato: l'intestazione del prompt porta
  `Lane: fast` oppure `Lane: full (<trigger di RC-3>)`, e una corsia completa senza trigger è un difetto del
  prompt.
- **RC-18** (2026-09-25): **L'harness ha un budget misurato, non un gate.** Su una settimana mobile, al
  più una corsia su quattro i cui commit di codice toccano solo `frontend/scripts/`, `.claude/` o `docs/`.
  La chat lo misura una volta a settimana con lo script del costo per feature e lo riporta nel checkpoint,
  insieme a una tabella di attrito calcolata dai transcript locali di Claude Code (turni per corsia, tempo
  dal primo turno al commit di chiusura); nessun campo nuovo nella voce di log. A budget superato, sono
  ammesse solo corsie di harness che riparano un enforcement che si è mostrato non tenere.
- **RC-19** (2026-09-25): **Le sessioni girano in `bypassPermissions`; i gate umani non si appoggiano ad
  `ask`.** Misura (memo del 2026-09-25 §3): 22 sessioni su 22 dal 2026-09-21; la deny list e i `deny` degli
  hook tengono; `ask` sotto bypass: <esito del probe>. Gli hook leggono `permission_mode`: in bypass
  `critical-zone` nega (la corsia di critical zone si rilancia senza il flag) e `bash-guard` nega
  `git push`; negli altri modi resta `ask`. Il `git commit` non è più un gate umano: restano il GO visivo e
  il push. Emenda RC-15 (3) e (7).
```

## 7. Limits

- The transcript scan covers only the sessions on this Mac. Sessions from other machines (Juri's configurator branches) are outside it.
- "Thirteen sessions" counts transcript files, and a resumed session can span more than one.
- The timing of `ask` is circumstantial by nature. Only the probe answers it.
- The weekly measures of 4.1 and 4.4 cost a chat round each week. That cost is small but not zero, and the checkpoint should show it.
