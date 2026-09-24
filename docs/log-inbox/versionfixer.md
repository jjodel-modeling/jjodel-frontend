# log-inbox — lane «versionfixer»

Entries written by the versionfixer lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-24 — fix(redux): unversioned saves pass the 2.1 and 2.2 VersionFixer steps (P-2026-09-24-1610)
**Prompt**: `claude_2026-09-24_1610_prompt_versionfixer_old_states.md`, two-phase. Phase 1 report `5f17cf4e3` (`docs/discovery/discovery_2026-09-24_versionfixer_old_states.md`). GO with seven rulings: no toast in this lane; the examples stay in place as test data; guards on all seven loops of `'2.2 -> 2.201'`; fix 1 is `return s` only, no guard in the runner; one ticket joining Q1 and Q5, one on the examples; this new inbox; the console snippet reported here, not in code. The GO added a vitest test running the chain on the 7 distinct examples, red before the fix and green after. Conditional ACK on the Layer Impact Report, four conditions, all met.
**Files touched**: code `d1db82011`: `frontend/src/redux/VersionFixer.tsx`, `frontend/src/redux/__tests__/versionfixer_old_states.test.ts` (new). Docs: the Phase 1 report `5f17cf4e3`; this commit: this inbox (new), a dated addendum to the Phase 1 report, the Status line of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d1db82011`: `npm run typecheck` exit 2, 14 errors, the baseline set (diff empty); `npx vitest run` 4273 passed (4248 + 25), the same 9 files red at import; `npm run build` exit 0; `check:docs` 4/4, `check:agents` green. The new test: 24 failed and 1 passed before the fix, 25 passed after; mutation bench 18/18 killed (commit message). Regression on 3001 checked by Alfonso: a current project saved and reopened, no difference.
**Out-of-scope changes**: no — two code files, both declared in the report §8 and in the LIR; five files over the lane counting the docs.
**Layer Impact Report**: produced
**Smoke visivo**: fallito (A4 in all three states, the only new pattern is `403 (Forbidden)` on font files, 3x per state: environmental, the same as P-2026-09-24-1455, no asset in the diff. A1-A3 and A5 pass. Run from a scratchpad copy of `scripts/smoke` with `BASE_URL` on 3001, because `states.ts` hardcodes 3000, which serves `~/jjodel`; from the copy the RUN VALIDITY block watches 0 files.)
**Notes**: `Log.exDev` throws (`Log.ts:152`, `canthrow` true): Phase 1 §1 said it did not; dated addendum in the report. R-IRN-20, note only, rule unchanged: its premise that `VersionFixer.tsx` cannot be imported in vitest holds with the real joiner; under a joiner mock the real class imports and runs, so this test exercises the steps themselves. Probes on 3001 as predicted: chain 7/7 to 2.228, load dies at `reducer.ts:708`.
**Prompt document name**: 2026-09-24 16:10

**Console snippet** (ruling 7). Counts the projects in `localStorage['projects']` of the page it runs in, by the `version.n` of their saved state. Tested on 3001 with one current save, one unversioned blob and one never-saved project, output `{"2.228":1,"(no version)":1,"(never saved)":1}`.

```js
(async () => {
  const lz = await import('/node_modules/.vite/deps/async-lz-string.js');
  const decompress = lz.decompressFromUTF16 || lz.default.decompressFromUTF16;
  const projects = JSON.parse(localStorage.getItem('projects') || '[]');
  const byVersion = {};
  for (const p of projects) {
    let key;
    if (!p.state) key = '(never saved)';
    else {
      try {
        const s = JSON.parse(await decompress(p.state));
        key = !s.version ? '(no version)' : String(s.version.n);
      } catch (e) { key = '(unreadable)'; }
    }
    byVersion[key] = (byVersion[key] || 0) + 1;
  }
  console.table(byVersion);
  return byVersion;
})();
```

**Ticket** (opened, not implemented here). Failures along the whole open path, migration and reducer (Q1 and Q5 of the report, joined by the GO). A state that cannot be loaded leaves "Loading Project..." on screen forever: `ProjectsApi.isLoading` goes false only in `checkLoaded` (`reducer.ts:1529-1538`). A throw in `VersionFixer` lands in the `stateInitializer` catch and is logged as `Failed to fetch projects` (`reducer.ts:1578`), a false label; a throw inside the `LoadAction` dispatch (`reducer.ts:708`, `:776`, and at element level `:740`, `:852`, `:930`, report §4) is an uncaught page error that no catch sees. Wanted: catch both, show a message to the user, stop the infinite loading, correct the label. Two facts to carry: the snippet above sees only the `localStorage` of the dev-server origin it runs in (3000 and 3001 do not share it), not projects saved on the server; and it remains to be verified whether projects saved on the server between 2024-06-28 and 2024-08-27 exist, since they carry a `version` but lack `NODES_RECOMPILE_labels` and would die at `reducer.ts:776` (report §6, risk 3).

**Ticket** (opened, not implemented here). The examples of `frontend/src/examples/`: delete or regenerate. Eleven blob files (7 distinct, 4 duplicates under `examples/examples/`, 2 786 754 bytes), reachable from no UI path, none loading after this lane (they now fail in the reducer). Since `d1db82011` they are the fixtures of `versionfixer_old_states.test.ts`: deleting them means giving that test other old-shape fixtures first. Regenerating the teaching examples as current projects is a content task. Related: the Jodie `/examples` command parses to type `'EXAMPLES'`, which no executor handles (`JjodieCommandParser.ts:152`, `:828-840`).
