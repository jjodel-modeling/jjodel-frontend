# Prompt: «Derive viewpoint» only on metamodel rows of the tree

Prompt-ID: P-2026-09-29-0305
Chat: C-2026-09-28-1936
Lane: fast (one file, one test). Tier: light.
Status: eseguito 2026-09-29 · lane derive-viewpoint-m2-only · f2e5b086e · non fuso: hard-stop, verifica visiva alla chat

Worktree: `~/jjodel-w-derivem1`, branch `derive-viewpoint-m2-only` (cut by the chat from `alfonso-frontend-jjtl` at `76c7b4f7f`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-derivem1`, branch `derive-viewpoint-m2-only`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

`TreeViewContent.tsx` (`frontend/src/components/TreeViewSidebar/`, around `:651` and `:690`) shows «Derive viewpoint» when `className === 'DModel'`, so it appears on M1 model rows too, where `createDerivedViewpoint` (`utils/deriveViewpoint.ts`) returns null and the click does nothing. Show the item only when the row is a metamodel, using the same test `createDerivedViewpoint` uses (reuse it or its predicate; do not write a second one). The menu height estimate (`menuHeight`) follows the same condition.

## DOVE

- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx`; if the predicate is private in `deriveViewpoint.ts`, an additive export there.
- A test next to the existing ones for the derivation utility or the tree (the folder that fits): the predicate is true on a metamodel, false on a model.
- Closure: `docs/log-inbox/views.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (Rule 11, naming), `docs/PROTOCOL.md` P16, RC-33.
2. Test first (red, then green). Implement.
3. Gates: `npm run typecheck` (14, the known set), the vitest of the touched folders green, `npm run build`, `check:docs`, `check:addonly`.
4. One code commit, one docs commit (log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas and the diff.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file.

## RIFERIMENTI

- The viewpoint derivation merge (P-2026-09-29-0233); `docs/decisions.md` for the derivation rows if any.
