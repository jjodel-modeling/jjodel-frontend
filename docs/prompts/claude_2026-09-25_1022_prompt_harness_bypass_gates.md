# Prompt: human gates that do not lean on `ask`, and the RC-16 pin (RC-16, RC-17, RC-19)

Prompt-ID: P-2026-09-25-1022
Chat: C-2026-09-25-1022
Lane: full (more than 3 files)
Status: da eseguire

Worktree: `~/jjodel-gate`. First run `pwd` and `git branch --show-current`. Expected: `/Users/alfonso/jjodel-gate` on `harness-gate` with a clean tree. Then `git switch -c harness-bypass alfonso-frontend-jjtl` and work only there. If the tree is not clean or the path differs, stop and say so. Do not touch `~/jjodel`, `~/jjodel-release`, `~/jjodel-sim`, `~/jjodel-open`, `~/jjodel-harness`.

Read first: `CLAUDE.md`, `docs/decisions.md` RC-3, RC-15 to RC-19, `docs/PROTOCOL.md` P5, P6, P13, and `docs/ratifiche/claude_2026-09-25_1015_memo_harness_recalibration.md` §2 and §3. The memo is the rationale; the RC rows are the norm.

## COSA

Three changes ratified on 2026-09-25:

1. **RC-16.** `.claude/settings.json`: `"model": "claude-opus-5"` becomes `"model": "claude-opus-5-5"`. Nothing else in the file changes.
2. **RC-19, critical zone.** `frontend/scripts/hooks/critical-zone.mjs` reads `permission_mode` from the hook input. When it is `bypassPermissions` and the edit is a 3.2 trigger, the hook answers `deny`, with a reason that names what triggered and says: "critical-zone lane: relaunch this session without --dangerously-skip-permissions (RC-19)". In any other mode, or when the field is absent or not a string, the behavior stays exactly as today (`ask` with today's reason). The header comment stops saying "it never denies" and states the new rule in one or two sentences.
3. **RC-19, push.** `frontend/scripts/hooks/bash-guard.mjs`: when `permission_mode` is `bypassPermissions`, any `git push` the analyzer recognizes (the same parsing path as for `git commit`, wrappers included) yields a `deny` finding: "git push is Alfonso's act under bypassPermissions (RC-19)". Other modes: no new finding. The `ask` rules for `git commit*` and `git push*` in `.claude/settings.json` stay as they are.

Also: `.claude/skills/status-flip/SKILL.md` follows the new P13 bullet (one flip, in the closure commit). The `closing` operation writes the full line: the visual suffix when the lane had a human visual check and Alfonso gave the GO, no suffix otherwise. The `visual-passed` and `visual-failed` operations go away. The live extraction by `awk` stays byte for byte (the anchor `- **Every prompt file carries a Status line` still matches).

## DOVE

`.claude/settings.json`, `frontend/scripts/hooks/critical-zone.mjs`, `frontend/scripts/hooks/bash-guard.mjs`, `frontend/scripts/hooks/__tests__/criticalZone.test.ts`, `frontend/scripts/hooks/__tests__/bashGuard.test.ts`, `.claude/skills/status-flip/SKILL.md`. Only the texts that Phase 1 finds describing the old behavior may be added, and only after the GO names them.

## COME

### Phase 1: discovery, read-only, hard stop

Save the report as `docs/discovery/discovery_2026-09-25_harness_bypass_gates.md` (CLAUDE.md, discovery report rule). Commit it alone, as docs. It answers, tagged [M]/[R]/[D]:

1. Does the PreToolUse hook input carry `permission_mode`, and with which values? Look in the Claude Code docs you can reach and in the installed Claude Code (`claude --version`; strings in its install, read-only). A hook that is not already running must not be added to settings for this. If you cannot establish it, say so. In that case Phase 2 reads the field defensively, and the prompt stands.
2. Every text in the repo that describes the `critical-zone` hook as ask-only, the `ask` on `git commit` as a human gate, or the two-flip Status, with path and line. Look in `CLAUDE.md`, `AGENTS.md`, `docs/HARNESS-DOCS.md`, `docs/PROTOCOL.md` and `.claude/skills/`. Check whether any of them is a generated projection (`npm run check:agents`) and name its source.
3. How `hookRunner.ts` feeds the input, so the tests can pass `permission_mode`.
4. The baseline: `npm run check:docs`, `npm run check:agents`, `npx vitest run scripts/hooks` (from `frontend/`).

Stop after the report commit. Reply with the path and the answers to 1 and 2.

### Phase 2: on GO only

- Critical zone: `permission_mode` is read in `main()`. `evaluate()` keeps its signature and its tests. Nothing is written to disk and no marker file is kept (RC-15 decision 3).
- New test cases: bypass + trigger file gives `deny`; bypass + non-trigger gives no output; `default`, `acceptEdits`, absent field and a non-string field + trigger give `ask` with today's reason. For bash-guard: bypass + `git push`, `git -C x push`, `env A=1 git push` and `bash -c "git push"` give `deny`; `default` + `git push` gives no push finding; bypass + `git status` gives nothing.
- Gates: `npx vitest run scripts/hooks` green, `npm run check:docs`, `npm run check:agents`, `npm run typecheck:scripts`. `npm run build` is not needed (no `frontend/src` file is touched).
- Commits (P13): one code commit with the six files (conventional `feat(harness): ...`, trailer `Model:` per P6). Then the **closure commit** of RC-17: Status line of this prompt (no visual suffix, this lane has no human visual check) plus the log inbox entry, in one docs commit, right after the code. Nothing between the two.

## Stop and ask

- `permission_mode` turns out to be absent and not inferable, and the defensive read would leave the change inert. Say so before writing code.
- A test outside `scripts/hooks` fails, or the baseline of item 4 is not green before you start.
- Any file outside DOVE, beyond what the GO named.

## Out of scope

The deny list, `CLAUDE.md` §0, P6 and the trailer form, the other hooks and skills, `settings.local.json` of any worktree, the probe of memo §3 (Alfonso runs it by hand), rewriting old Status lines.
