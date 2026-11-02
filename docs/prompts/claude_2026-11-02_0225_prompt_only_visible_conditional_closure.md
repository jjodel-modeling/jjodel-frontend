# Canvas: commit and close the conditional only-visible lane

Prompt-ID: P-2026-11-02-0225
Chat: C-2026-11-01-1434
Front: maintenance
Lane: fast (closure of P-2026-11-02-0020, no product change)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp
Depends: P-2026-11-02-0020

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-onlyviscond`, branch `only-visible-conditional`, HEAD at the commit that adds this prompt.
Expected `git status`: `M frontend/src/components/editor-v2/EditorV2.tsx`, untracked `onlyRenderVisible.ts` and
`__tests__/onlyRenderVisible.test.ts`, nothing else. Otherwise stop. Model and tier as pinned, effort as default.

## Lane discipline

Every reply opens with `[P-2026-11-02-0225 · session <id>]`; final message ends with `Outcome: done | hard-stop |
question | blocked`. Time limit 20 minutes. Read only `~/.jjodel-lanes/P-2026-11-02-0020/handoff.md`. No push, no merge.

## COSA

Alfonso accepted on 2026-11-02 at 02:20 the open time and his hand measurement of 2026-10-31 as enough evidence for
the no-viewpoint case; the no-viewpoint drag timing goes to its own lane.

1. Rerun only `npm run typecheck` and the colocated test (`npx vitest run src/components/editor-v2/__tests__/onlyRenderVisible.test.ts`)
   to confirm the tree is the one P-2026-11-02-0020 measured.
2. Code commit with explicit pathspec: the three files above, message per the handoff.
3. Log entry in `docs/log-inbox/maintenance.md` from the handoff's numbers and checks (timing table, gates, DOM checks,
   the smoke cold-server retry as Causa (g) note, the parked branch `only-visible-wip` and prompts
   P-2026-11-01-0040..2335, the unmeasured no-viewpoint drag and why), Status flip of P-2026-11-02-0020 and of this
   prompt, uncommitted (RC-17).
4. Cleanup per the handoff: delete `frontend/scripts/smoke/_tmp_ort_dom.ts`; `git worktree remove --force /tmp/ort-trunk`.
5. Exit `Outcome: hard-stop (visual check due)`.

## HARD STOP

Typecheck or the test red, or a tree different from the expected one: stop, no commit, one `Recommended:` line.
