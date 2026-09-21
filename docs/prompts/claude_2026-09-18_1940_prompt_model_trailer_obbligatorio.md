# Every commit records the model that executed it

Prompt-ID: P-2026-09-18-1940
Chat: C-2026-09-18-1940
Status: da eseguire, con precedenza su P-2026-09-18-1930
Date: 2026-09-18 19:40 (Europe/Rome)
Type: chore (docs only, one commit)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`, measured at `b3c6b6976`
Effort: medium
Lane: harness. This lane owns `docs/PROTOCOL.md` for this task and nothing else. No code file is
touched. `CLAUDE.md` is deliberately NOT touched, because it is 22,440 characters over the 40k
context limit and its split is a separate prompt (P-2026-09-18-1930).

## Contesto

The executor changed vendor today. Sessions now run `Z.ai: GLM 5.3` under Claude Code v2.1.276,
while `CLAUDE.md` §0 declares Claude Opus 5 and `.claude/settings.json` pins `claude-opus-4-8`.
Three sources, three answers. This prompt does not resolve that inconsistency (it belongs to the
§0 and settings owners); it protects the one thing that degrades irreversibly if left alone.

Measured at `b3c6b6976`: 47 of the last 60 commit bodies carry `Co-Authored-By: Claude Opus 5`.
That trailer is the only record of which model produced a commit, and every claim that separates the
effect of the harness from the effect of the model reads it. A commit written by a model that does
not emit it is a commit that leaves no trace of its executor, and the loss is silent: nothing fails,
the history simply stops answering the question. Commits already written keep their trailer and need
no backfill, since the switch happens now.

## COSA

Add to `docs/PROTOCOL.md`, inside P6 (Commit), a clause requiring that every commit body carry a
trailer naming the model that executed the task, in the form:

```
Model: <vendor> <name> <version>
```

for example `Model: Z.ai GLM 5.3` or `Model: Anthropic Claude Opus 5`. The value is what the session
banner reports, not what `CLAUDE.md` §0 or `.claude/settings.json` declare: the three disagree today,
and the trailer records the executor, not the intention.

Keep the existing `Co-Authored-By` line where the tooling emits it. The new trailer is additive and
does not replace it, because the historical series is keyed on `Co-Authored-By` and breaking that key
would cost more than the duplication.

## DOVE

`docs/PROTOCOL.md`, clause P6 only. Do not renumber the clauses. Do not touch `CLAUDE.md`: §1 already
states that shared engagement rules live in `docs/PROTOCOL.md` and that prompts cite them by number,
so no pointer needs to be added to a file that is already over its limit.

## COME

Verbatim addition, minimal wording, in the language P6 already uses. Do not restructure P6, do not
reflow its existing lines, do not "improve" adjacent text (rules 8 and 10).

State in the closing report, and do not implement here: a gate that refuses a commit without the
trailer is the natural follow-up and belongs with `frontend/scripts/gates/`, but a rule that has not
yet been observed in practice should not be automated on the same day it is written.

## Verification

`npm run check:docs` must pass. Check A of that gate compares the §21.2 entry-format block in
`CLAUDE.md` with P9 byte for byte; this edit touches P6 and must leave P9 untouched, so a green gate
is also the proof that nothing drifted into the wrong clause.

Then the real verification, which is behavioural and belongs in the log entry: this commit itself
carries the new trailer. If it does not, the rule failed at its first application and that is the
finding, not a detail to fix quietly.

## Nota per il log

This task is the first instruction given to a new executor under an unchanged harness, and whether
the rule is followed from the first commit is a measurement, not a formality. Record it plainly in
the entry: `Model:` present or absent on this very commit, and on the next three.
