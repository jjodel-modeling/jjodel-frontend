# Discovery: the Vite dependency scan fails on every cold start

- **Prompt-ID**: P-2026-09-25-1820 — `docs/prompts/claude_2026-09-25_1820_prompt_vite_dep_scan.md`
- **Session**: 1ab9b703-a340-48f3-be5b-bbf12b7c49bb
- **Tree**: `~/jjodel-vite`, branch `vite-dep-scan`, HEAD `a5a0bcfbf` (measurements before the fix), fix in `frontend/vite.config.ts` uncommitted while measuring
- **Executor**: Claude Code, Opus 5.5 (`claude-opus-5-5`), as the session banner shows it
- **Toolchain, measured**: Vite 7.3.2, esbuild 0.27.7, vite-plugin-node-polyfills 0.26.0, through the temporary symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules` (absent at lane start)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

Tags: **[M]** measured in this lane, **[R]** read from a file.

## 0. Hypotheses under test

- **H1** (from the prompt): the scanner fails because it does not know about the legacy decorators (`experimentalDecorators` missing), so `@RuntimeAccessible` before `export class` does not parse. **Falsified** (§2).
- **H2**: the failure is the decorator syntax, or the `export` placed after a decorator, as such. **Falsified**: the scan passes with the same syntax once `experimentalDecorators` is false (§2.3).
- **H3**: a duplicate or circular export in `nearley.tsx`. **Falsified**: the file has one binding `Nearley` and one export (§2.2).
- **H4**: an esbuild transform bug, triggered only by a specific combination in `nearley.tsx`. **Holds** (§2.2, §2.3).
- **H5**: the scan stops at the first error, which is why only one file shows. **Falsified**: esbuild reports every error of a failed build (§2.4).
- **H6**: fixing the scan is enough to remove the runtime optimize-and-reload. **Falsified**: four ids are never visible to the scan (§3).

## 1. Before the fix [M, on `a5a0bcfbf`]

Cold start (`frontend/.vite-cache` absent), `npx vite --port 3005 --strictPort`, logs in `/tmp/s5/`.

Full scan error, the only error printed (`/tmp/s5/vite3005_before.log`):

```
(!) Failed to run dependency scan. Skipping dependency pre-bundling. Error:   Failed to scan for dependencies from entries:
  /Users/alfonso/jjodel-vite/frontend/index.html
  /Users/alfonso/jjodel-vite/frontend/test.html
  /Users/alfonso/jjodel-vite/frontend/public/index.html
  /Users/alfonso/jjodel-vite/frontend/public/webjars/ace/1.3.3/... (16 more .html entries)

  ✘ [ERROR] No matching export in "src/DSL/nearley/nearley.tsx" for import "Nearley"

    src/components/forEndUser/MTM.tsx:27:8:
      27 │ import {Nearley} from "../../DSL/nearley/nearley";
         ╵         _Nearley

  Did you mean to import "_Nearley" instead?

    src/DSL/nearley/nearley.tsx:34:13:
      34 │ export class Nearley{
```

| Run | Scan | Runtime optimize + reload | `_metadata.json` after load |
|---|---|---|---|
| curl `/` then `/src/index.tsx` | failed (above) | yes: `✨ new dependencies optimized: …` (58 ids) then `✨ optimized dependencies changed. reloading` | optimized 58, discovered 0, chunks 1091 |
| headless Chromium (Playwright), run 1 | failed | yes, same two lines; two `504 (Outdated Optimize Dep)` in the page console | optimized 58, discovered 0 |
| headless Chromium, run 2 | failed | yes | optimized 58, discovered 0, chunks 1091 |

Browser runs: 3 main-frame navigations each. #2 coincides with Vite's `reloading` line; #3 is the app's own same-document history change (§4).

`DEBUG=vite:deps npx vite --port 3005 --force` (`/tmp/s5/vite3005_debug.log`): the import crawl completes and lists 59 dependencies under `Scan completed in 487.74ms`, then the esbuild build fails and the result is dropped: `new dependencies found: svgpath, react, react-dom, react/jsx-dev-runtime, react/jsx-runtime`, the `include` of `vite.config.ts` plus plugin-react's. That is why 3001 shows "58 optimized, 0 from the scan": all 58 arrive at runtime.

## 2. Cause

### 2.1 What the scanner passes to esbuild [R]

`node_modules/vite/dist/node/chunks/config.js:31446-31457` (Vite 7.3.2, `prepareEsbuildScanner`):

```
const { plugins: plugins$1 = [], ...esbuildOptions } = environment.config.optimizeDeps.esbuildOptions ?? {};
let tsconfigRaw = esbuildOptions.tsconfigRaw;
if (!tsconfigRaw && !esbuildOptions.tsconfig) {
    const { tsconfig } = await loadTsconfigJsonForFile(path.join(environment.config.root, "_dummy.js"));
    if (tsconfig.compilerOptions?.experimentalDecorators || ...) tsconfigRaw = { compilerOptions: {
        experimentalDecorators: tsconfig.compilerOptions?.experimentalDecorators,
```

So the scanner already reads `experimentalDecorators: true` from `frontend/tsconfig.json` ("experimentalDecorators": true, [R]). The scan runs esbuild with `bundle: true` over the entries, without the Babel plugins of `@vitejs/plugin-react`. The dev server and the build never meet the esbuild path for decorators: Babel lowers them first (`vite.config.ts`, `['@babel/plugin-proposal-decorators', { legacy: true }]`).

### 2.2 The esbuild bug [M]

`src/DSL/nearley/nearley.tsx` [R]:

- `:33` `@RuntimeAccessible('Nearley')`
- `:34` `export class Nearley{`
- `:61` `else { Nearley.import(joined, grammarInfoObject); }` (the class names itself)
- `:68`, `:79`, `:107` `try { eval(grammarJs); } catch(e: any) {` (direct `eval`)

`esbuild.transform` of the file with `tsconfigRaw: { compilerOptions: { experimentalDecorators: true } }` emits `let _Nearley = class {`, `_Nearley = __decorateClass([...], _Nearley);` and `export { _Nearley };`, **without** `as Nearley`. With `experimentalDecorators: false` it keeps `class Nearley` and `export { Nearley }`.

A minimal case isolates the trigger (esbuild 0.27.7, transform, ED = experimentalDecorators):

| Source | ED=true | ED=false |
|---|---|---|
| `@dec export class A { static f(s){ eval(s); } }` | `export { A }` | `export { A }` |
| `@dec export class A { static f(s){ eval(s); return A; } }` | **`export { _A }`** | `export { A }` |
| same, indirect `(0,eval)(s)` | `export { A }` | `export { A }` |
| same, no decorator | `export { A }` | `export { A }` |
| `@dec class A { …eval…; return A } export {A}` | `export { _A as A }` | `export { A }` |

All three are needed: legacy decorators, `@dec export class X`, and a direct `eval` in a class body that names `X`. The direct eval pins the inner name, esbuild renames the outer binding to `_X`, and the inline-export path forgets the alias.

### 2.3 The scan reproduced outside Vite [M]

`esbuild.build` of `src/index.tsx`, `bundle: true`, bare imports and assets external, Vite's extension order (`.mjs .js .mts .ts .jsx .tsx .json`; without it `Collaborative.tsx`, 1 line, shadows `Collaborative.ts` and adds four false errors):

| tsconfigRaw | Result |
|---|---|
| none (esbuild reads `tsconfig.json`) | 1 error, the Nearley one |
| `{experimentalDecorators: true}` | 1 error, the Nearley one |
| `{experimentalDecorators: true, jsx: 'react-jsx'}` | 1 error, the Nearley one |
| `{experimentalDecorators: false}` | OK, 835 inputs |
| `{jsx: 'react-jsx'}` | OK, 835 inputs |

### 2.4 Why the other decorated classes do not fail [M]

Files under `src/` with both `@RuntimeAccessible` and `eval(` (`command grep -rln 'eval('` piped to a decorator grep; positive control: `nearley.tsx` listed, 3 hits): `src/joiner/classes.ts`, `src/common/U.tsx`, `src/model/logicWrapper/LModelElement.tsx`, `src/DSL/nearley/nearley.tsx`. Transform with ED=true, bare `_X` entries in the export lists: `classes.ts` none, `LModelElement.tsx` none, **`U.tsx` `_U`**, `nearley.tsx` `_Nearley`.

`U.tsx` is mangled too (`:172` `@RuntimeAccessible('U')`, `:173` `export class U {`, `:1032` `eval(codeStr);`), but no module imports the value `U` from it by name. The barrel reads the global: `src/joiner/index.ts:134` `export var U = windoww.U as typeof UType;`, and `:14` is `import type {U as UType} from "../common/U";`, which is erased. Search: `command grep -rn "from ['\"]\(\.\./\)*common/U['\"]" src | command grep -w U`; it returns only `joiner/index.ts:14` (type) and `:70` (a comment); positive control, same search without `-w U`: `ExecutionErrorDialog.tsx:15` `import {Keystrokes} from "../../common/U";`. `Nearley` is the only mangled export imported by name (`components/forEndUser/MTM.tsx:27`).

esbuild reports every error of a failed build, not the first: the same harness with the wrong extension order printed 5 errors in one run (§2.3).

## 3. The fix and what it needed

`frontend/vite.config.ts`, `optimizeDeps` only:

1. `esbuildOptions.tsconfigRaw: { compilerOptions: { experimentalDecorators: false, jsx: 'react-jsx' } }`. The scan only collects imports. Standard decorators parse the same syntax and are left unlowered, so the rename does not happen. `jsx` restates the tsconfig value, which Vite would otherwise derive (§2.1) and which a user `tsconfigRaw` replaces.
2. `include` gains `util` and `vite-plugin-node-polyfills/shims/{buffer,global,process}`. After step 1 alone, a cold start pre-bundled 60 deps with 0 discovered, but a browser load still logged `✨ new dependencies optimized: vite-plugin-node-polyfills/shims/buffer, …/global, …/process, util` and `reloading` (`/tmp/s5/vite3005_after.log:547-548`). Reasons [R], `vite-plugin-node-polyfills/dist/index.js` 0.26.0: the shims are imported by bare id from the dev banner (`"import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'"`), while `optimizeDeps.exclude` lists them by resolved path (`f.resolve(...)`), so the scan never sees them. `util` is aliased by the plugin to an absolute path, so the scan follows it into the package (and records `inherits`, `is-arguments`, …) but never records `util` itself. It is imported by `src/common/U.tsx:46`, `components/commandbar/CommandBar.tsx:3` and `model/dataStructure/GraphDataElements.tsx:2`.

`optimizeDeps.esbuildOptions` also reaches the pre-bundle step (`config.js`, `prepareEsbuildOptimizerRun`, `...esbuildOptions`), and Vite merges it with the plugin's own `esbuildOptions` (banner, define, inject, plugins).

## 4. After the fix [M]

| Run | Scan | Runtime optimize + reload | `_metadata.json` |
|---|---|---|---|
| cold start (own cache deleted) | no error | — | 64 optimized, 0 discovered, at startup |
| + headless Chromium load, 100 s | — | none (no `new dependencies`, no `reloading`, no 504) | 64 / 0, chunks 1098, unchanged by the load |
| warm restart, cache present, + load | no rescan (0 lines matching `scan|optimiz|reloading|Forced`) | none | byte-identical (md5) |

Navigations: 2 after the fix (cold and warm), 3 before. The remaining #2 is not a document load. An init script logs `performance.getEntriesByType('navigation')[0].type` on each `load` and printed once (`navigate`), so #2 is a same-document history change by the app. The only document load is the first.

Pre-bundled content, before (run 2) vs after, normalised for chunk names: 51/58 entries identical, and the 7 others differ only in the grouping of chunk imports and the numbering of `import_distN` variables. Over the whole `deps/` as a line multiset, 40 lines are only in before (wiring, 4 `"use strict"`) and 903 only in after, mostly `path-data-polyfill` (864 lines), a new entry the scan now reaches. No module body changed.

## 5. Gates [M, on the fix]

- `npm run typecheck`: exit 2, 14 errors, the §17 set by file and code.
- `npm run build`: exit 0. `dist/` compared with a build of the HEAD config (a temporary untracked copy, removed afterwards): 3494 files, md5 list identical. Warnings identical, with one line reordered (`/static/img/close-on.png … didn't resolve at build time`). Production does not use `optimizeDeps`.
- `npx vitest run`: 4629 passed, 0 failed, 9 files red at import (`ReferenceError: window is not defined`), the §17 nine.
- `npm run check:docs`: 4/4.
- `vite.config.ts` has a TS2769 at `:23` in the IDE (`css.preprocessorOptions.scss`, `{ api: string; includePaths: string[] }`). It is the same at HEAD. With the scss block patched in a scratch copy, both HEAD and the fix check with exit 0, so the addition adds no type error. The file is outside `tsconfig.json`'s `include`.

## 6. Dependencies and risks

- The fix pins a workaround for an esbuild bug. An esbuild upgrade that fixes it makes item 1 unnecessary, not wrong.
- `experimentalDecorators: false` in the scan would reject TS-only decorator forms (parameter decorators) if they appear in `src/`. Today the full graph (835 inputs) parses.
- `tsconfigRaw` now also governs the pre-bundle of dependencies. §4 shows no change in module bodies for today's 58.
- The scan entries include `test.html`, `public/index.html` and 17 ace webjars demo pages (Vite's default glob). They scan cleanly and were left alone. Narrowing `optimizeDeps.entries` is a separate choice.

## 7. Open questions

1. Should the esbuild bug be reported upstream (minimal case in §2.2), or a ticket opened to drop item 1 at the next esbuild upgrade?
2. Should `optimizeDeps.entries` be narrowed to `index.html`, so the public webjars demos stop being scanned?
3. `U.tsx` carries the same mangled export under esbuild with ED=true. Is that worth a ticket, given that nothing imports it by name today?
