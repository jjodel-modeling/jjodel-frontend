# Realign the trunk with staging, on a branch

Prompt-ID: P-2026-11-04-1640
Chat: C-2026-11-04-1615
Front: maintenance
Status: da eseguire
Lane: full (merge of two long-lived lines; 4 measured conflicts)
Depends: none
Worktree: ~/jjodel-w-stagingsync, branch staging-realign
Request: none (Alfonso's go of 2026-11-04 16:31, words kept locally)

Run pwd, git branch --show-current, git status --short: that worktree and branch, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-1640 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. Gates in the foreground. Never cat a gate log: grep its summary lines. Commit as soon as the gates are green.

## COSA

Merge origin/staging, explicit sha b619c8300, into this branch with one merge commit, --no-ff. Measured at 16:31: the trunk has 944 commits staging lacks, staging has 81 the trunk lacks. Staging carries the #196 AI layer lanes (L3, L4, L6): AIProviderService and types/jodie.ts are gone, the code lives in frontend/src/services/ai, the proxy Worker surface is removed.

Measured conflicts:
- docs/decisions.md: keep both sides' rows. Check that no R- id exists on both sides with different text; a collision is a stop.
- docs/harness/fronts.json: union of the two.
- frontend/src/services/AIProviderService.ts and its test: deleted on staging, changed on the trunk by 8d5b5a1fe (P-2026-10-30-1215). Keep them deleted, and carry that fix's behaviour into the new layer: the Claude path joins the text blocks and throws naming stop_reason and block types when there is none; the OpenAI-compatible path throws on non-string content naming finish_reason and refusal. Port its five tests to the new layer's test file. If the new layer already does this, say so with file:line and port only the missing tests.

Then look for what merges silently and breaks, because trunk code written since the base may still use what staging removed:
- git grep for jjodel-ai-proxy, PROXY_ENDPOINTS, PROXY_BASE_URL, AIProviderService, types/jodie in frontend/src, cloudflare-worker: after the merge there must be no runtime caller of the Worker. Report the result with file:line; the Worker's deletion depends on it.
- If the merged frontend/package-lock.json differs from the trunk's, run npm ci in this worktree. Otherwise symlink frontend/node_modules to ~/jjodel/frontend/node_modules, and remove the symlink at the end.

Gates from frontend/: npm run typecheck against the §17 baseline, npx vitest run against the known baseline, npm run build, npm run check:docs, npm run check:agents. Compare red tests with the same run on the trunk tip before attributing them. CLAUDE.md §16 changed on staging: read the merged text and follow it.

Do not push. Do not merge into the trunk. Do not touch staging. Do not rewrite history. Do not edit a critical zone file outside what the merge itself brings: if a conflict or a typecheck error needs it, stop with Outcome: question and a Layer Impact Report.

Report in docs/discovery/discovery_2026-11-04_staging_realign.md: conflicts and how each was resolved, the silent breakages found, gate numbers, the Worker grep, and what bringing this branch onto staging would add, by front, in at most fifteen lines, naming unreleased features and anything behind no flag. Log entry in the P9 format in docs/log-inbox/maintenance.md, Status line, in one docs commit. Close with «Decisions taken (unattended)» and «Decisions awaiting Alfonso».
