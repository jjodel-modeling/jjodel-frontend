# Discovery: the Bootstrap Icons font returns 403 on every worktree dev server

- **Prompt-ID**: P-2026-09-26-1335 — `docs/prompts/claude_2026-09-26_1335_prompt_bootstrap_icons_font.md`
- **Session**: fa370223-cb38-4559-be22-f0f5361f84fb
- **Tree**: `~/jjodel-icons`, branch `icons-font`, HEAD `9290c17be` (measurements before the fix); fix in `frontend/vite.config.ts` uncommitted while measuring after
- **Executor**: Claude Code, Opus 5.5 (`claude-opus-5-5`), as the session banner shows it
- **Toolchain, measured**: Vite 7.3.2, Node 26.8.1, through the temporary symlink `frontend/node_modules -> ~/jjodel/frontend/node_modules` (absent at lane start, kept for every measurement)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

Tags: **[M]** measured in this lane, **[R]** read from a file. Vite line numbers refer to `frontend/node_modules/vite/dist/node/chunks/config.js` of Vite 7.3.2, read through the symlink.

## 0. Hypotheses under test

- **H1** (from the prompt): in a worktree the resolver follows the `node_modules` symlink to its real path under `~/jjodel`, so the icons CSS and its font get `/@fs/Users/alfonso/jjodel/...` URLs. **Holds** (§1, §2.1).
- **H2** (from the prompt): the font request is refused by the `server.fs.allow` check, whose default is the workspace root of this tree, which does not contain the real path. **Holds** (§1, §2.2, §2.3).
- **H3**: the CSS itself is refused as well. **Falsified**: the CSS returns 200 on the same `/@fs` prefix, because import analysis puts every imported module into `safeModulePaths`; the font is reached through a CSS `url()`, which does not (§1, §2.4).
- **H4**: adding the real `node_modules` to `server.fs.allow`, with the default root kept, makes the font 200 and leaves paths outside both roots at 403. **Holds** (§3).
- **H5**: the change is dev-only and leaves the production build byte-identical. **Holds** (§4).
- **H6**: `~/jjodel` sees no effective change. **Holds by computation**, no server started there (§3.3).

## 1. Before the fix [M, on `9290c17be`]

Server: `nohup npx vite --port 3005 --strictPort > /tmp/s5/vite3005.log` from `frontend/`, cold cache (`frontend/.vite-cache` absent). Log kept as `/tmp/s5/vite3005_before.log`.

Module graph, as the browser follows it:

- `curl -s http://localhost:3005/src/index.tsx`, line 12 of the transformed module:
  `import "/@fs/Users/alfonso/jjodel/frontend/node_modules/bootstrap-icons/font/bootstrap-icons.css";`
- That CSS module: `200 text/javascript`, 108618 bytes. Its first `url(...)`:
  `/@fs/Users/alfonso/jjodel/frontend/node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2?e34853135f9e39acf64315236852cd5a`

| Request | Code | Content-Type |
|---|---|---|
| font `.woff2` (the URL above) | **403** | — |
| font, with `Sec-Fetch-Dest: font`, `Origin`, `Referer` | **403** | — |
| control `/@fs/Users/alfonso/jjodel/frontend/package.json` | **403** | — |
| control `/@fs/etc/hosts` | **403** | — |

Log lines for the four requests (verbatim):

```
The request id "/Users/alfonso/jjodel/frontend/node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2" is outside of Vite serving allow list.

- /Users/alfonso/jjodel-icons/frontend
- /Users/alfonso/jjodel/frontend/node_modules/vite/dist/client
...
The request id "/Users/alfonso/jjodel/frontend/node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2" is outside of Vite serving allow list.
The request id "/Users/alfonso/jjodel/frontend/package.json" is outside of Vite serving allow list.
The request id "/etc/hosts" is outside of Vite serving allow list.
```

Default allow list of this tree, as Vite printed it: `/Users/alfonso/jjodel-icons/frontend` plus the Vite client directory. The same root from `node -e` with `vite.searchForWorkspaceRoot(process.cwd())` in `frontend/`: `/Users/alfonso/jjodel-icons/frontend` [M]. No `package.json`, `pnpm-workspace.yaml` or `lerna.json` at `~/jjodel-icons` (`ls`, exit 1, each file named in the error) [M], so the search falls back to the package root.

## 2. Mechanism [R, Vite 7.3.2]

### 2.1 The resolver returns the real path

`config.js:32936-32937`:

```
function getRealPath(resolved, preserveSymlinks) {
	if (!preserveSymlinks) resolved = safeRealpathSync(resolved);
```

`bootstrap-icons/font/bootstrap-icons.css` resolves through `frontend/node_modules` (the symlink) to `/Users/alfonso/jjodel/frontend/node_modules/...`. When the id does not start with the root, the dev URL gets the `/@fs` prefix, `config.js:8735-8736` (`fileToDevUrl`):

```
	else if (id.startsWith(withTrailingSlash(config$2.root))) rtn = "/" + path.posix.relative(config$2.root, id);
	else rtn = path.posix.join(FS_PREFIX, id);
```

The CSS plugin's `url()` rewrite goes through the same function: `config.js:29584`, `let url$4 = await fileToUrl$1(this, resolved);`.

### 2.2 The `/@fs` middleware checks the allow list

`serveRawFsMiddleware` hands `/@fs` requests to sirv with `sirvOptions` (`config.js:22462-22476`); its `shouldServe`, `config.js:22391-22395`:

```
		shouldServe: disableFsServeCheck ? void 0 : (filePath) => {
			const servingAccessResult = checkLoadingAccess(config$2, filePath);
			...
				error$1.code = ERR_DENIED_FILE;
```

`checkLoadingAccess` and `isFileLoadingAllowed`, `config.js:22510-22516`:

```
	if (config$2.safeModulePaths.has(filePath)) return true;
	if (fs$12.allow.some((uri) => isFileInTargetPath(uri, filePath))) return true;
	return false;
...
	if (isFileLoadingAllowed(config$2, slash(path$13))) return "allowed";
	if (isFileReadable(path$13)) return "denied";
```

A readable file outside every allow entry is `denied`, and `respondWithAccessDenied` writes the log line and `res.statusCode = 403;` (`config.js:22520`, `22527`).

### 2.3 The default allow list

`config.js:25735`: `allow: raw?.fs?.allow ?? [searchForWorkspaceRoot(root)]`. Entries are resolved with `resolvedAllowDir`, `config.js:25693-25694`, `return normalizePath(path.resolve(root, dir));`: **no realpath** on the allow entries. So an entry naming the symlink `frontend/node_modules` would not cover the real path the resolver produces; the entry must be the real path itself. The client directory is appended only when no entry already contains it (`config.js:25751`).

In `~/jjodel` the real path of `node_modules` is under the root, so `fileToDevUrl` yields a root-relative URL and the allow check passes: the prompt's 200 on 3000.

### 2.4 Why the CSS is served and the font is not

Import analysis adds every imported module URL to `safeModulePaths`, `config.js:27183`: `config$2.safeModulePaths.add(fsPathFromUrl(stripBase(url$3, base)));`. The CSS is imported by `src/index.tsx:7`, so it is in the set and passes `config.js:22510`. The font is referenced by a CSS `url()`, which goes through `urlResolver` (`config.js:29576-29589`) and never reaches `safeModulePaths`; the transform-side gate (`config.js:24456-24457`) only checks `?raw`, `?url`, `?inline` and svg ids, so it does not apply either. The browser's font request therefore meets the plain allow list and gets 403.

## 3. The fix and after [M]

### 3.1 Change, `frontend/vite.config.ts` only

- `:1` `import { defineConfig, searchForWorkspaceRoot } from 'vite'`; `:6` `import { readFileSync, realpathSync } from 'node:fs'`.
- `:23-29` `realpathSafe(p)`, `realpathSync` in a `try`, `undefined` on failure: a missing `node_modules` does not throw at config load.
- `:31` `const NODE_MODULES_REAL = realpathSafe(path.resolve(__dirname, 'node_modules'))`.
- `:54-56`, under `server`:
  `// In a worktree node_modules is the P14 symlink: Vite serves its real path, outside this root.`
  `allow: [searchForWorkspaceRoot(__dirname), ...(NODE_MODULES_REAL ? [NODE_MODULES_REAL] : [])]`

No literal `/Users` in the file (`command grep -n '/Users' vite.config.ts`, exit 1). Name check for `realpathSafe` and `NODE_MODULES_REAL` over `frontend` and `docs`, BSD grep excluding `node_modules`, `dist`, `.vite-cache`, `.git`: exit 1, empty; positive control `BUILD_SHA`, same command: 7 lines. No new dependency.

### 3.2 After, on 3005 restarted with the fix (warm cache)

The module graph gives the same CSS URL and the same font URL as §1 (string-compared, identical).

| Request | Before | After |
|---|---|---|
| font `.woff2` | 403 | **200 `font/woff2`**, 134044 bytes, `cmp` identical to the file on disk |
| font `.woff2`, browser-like headers | 403 | **200 `font/woff2`** |
| font `.woff` (second `url()`) | not probed | 200 `font/woff` |
| control `/@fs/Users/alfonso/jjodel/frontend/package.json` | 403 | **403** |
| control `/@fs/etc/hosts` | 403 | **403** |

Log after: `bootstrap-icons.woff2` appears 0 times; the two controls are logged as before, and the allow list Vite now prints is:

```
- /Users/alfonso/jjodel-icons/frontend
- /Users/alfonso/jjodel/frontend/node_modules
```

(the client directory is no longer appended because it lies inside the second entry, `config.js:25751`).

### 3.3 `~/jjodel` is unaffected [M, by computation]

`node -e` with Vite's own `searchForWorkspaceRoot` and `fs.realpathSync`: for `~/jjodel/frontend` the list becomes `[/Users/alfonso/jjodel/frontend, /Users/alfonso/jjodel/frontend/node_modules]`; the second entry is inside the first, so the effective allow set equals the default. No server started in `~/jjodel`.

## 4. Gates [M]

| Gate | Before (tip `9290c17be`) | After |
|---|---|---|
| `npm run typecheck` | exit 2, 14, the §17 set | exit 2, 14; file:code list identical (`diff` exit 0) |
| `npm run typecheck:scripts` | — | exit 0 |
| `npm run build` | exit 0, 51 warning lines | exit 0, 51 warning lines, identical (`diff` exit 0) |
| `dist/` | 3494 files, copied to `/tmp/s5/dist-before` | 3494 files; md5 lists identical (`diff` exit 0); positive control, one altered hash: `diff` exit 1 |
| `npx vitest run` | 4818 passed, 0 failed, 9 files red at import | 4818 passed, 0 failed, the same 9 files (`diff` of FAIL lines exit 0) |
| `npm run check:docs` | — | 4/4 |

`vite.config.ts` is not covered by `npm run typecheck` (tsconfig `include: ["src"]`). Ad-hoc `npx tsc --noEmit --skipLibCheck --module esnext --moduleResolution bundler --target es2022 --types node`: one TS2769 on `css.preprocessorOptions.scss` both on the HEAD config (checked from a temporary copy, removed) and on the fixed one; nothing on `server.fs`. Pre-existing, not touched.

## 5. Dependencies and risks

- The allow entry widens serving to the whole real `node_modules`, which is exactly what `~/jjodel` already serves under its root. `fsDenyGlob` (`config.js:22509`) still applies before the allow list.
- A tree where `node_modules` is a real directory inside the root (as `~/jjodel`) gets a redundant entry and no change.
- Symlinks elsewhere (a package inside `node_modules` symlinked out of it, e.g. `npm link`) are not covered; none measured.
- `searchForWorkspaceRoot(__dirname)` equals Vite's default `searchForWorkspaceRoot(root)` only while the server is launched with `frontend/` as root, which is how every tree here starts it.

## 6. Open questions

1. None blocking; the visual check on 3005 (step 6) is the remaining evidence.
