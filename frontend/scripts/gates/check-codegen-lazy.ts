/**
 * check-codegen-lazy.ts — the code generator loads only through its lazy panel (P-2026-10-10-1825; R-GEN-2, spec §2,
 * discovery §E.4, U7).
 *
 * R-GEN-2: with the experimental setting off, no module of the generator is loaded, proved on the build output. The
 * one way into `src/codegen/` is EditorV2's `React.lazy(() => import('../../codegen/ui/CodePanel'))`; the eager
 * residue is `src/codegen/setting.ts` alone.
 *
 * One production build with the project's own config (`vite.config.ts`, not edited), into a temp dir, with
 * `build.manifest` (the CLI's `--manifest`) and one inline plugin that records, per output chunk, the modules Rollup
 * put in it. Then, from the entry chunks, the closure of static `imports`:
 *   1. red when a chunk of the closure holds a module under `src/codegen/` other than `setting.ts`, by module id;
 *   2. red when a manifest entry of the closure has a `src` under `src/codegen/` other than `setting.ts` (the
 *      discovery's literal clause);
 *   3. red unless `src/codegen/ui/CodePanel.tsx` is a `dynamicImports` target of a manifest entry of the closure, and
 *      a dynamic entry of its own: the positive control, proof that the walk reached the generator.
 * Clause 1 is the one with signal for a static import. The manifest lists chunks, not modules: a generator module
 * statically imported from the entry is inlined into the entry chunk and gets no manifest entry, so clause 2 alone
 * stays green over it (measured on the mutation bench of this lane, commit body).
 *
 * Exit 0 green, 1 red, and 1 when the build or the manifest cannot be read: a gate that cannot look does not say green.
 *
 * Two modes, one build each (P-2026-10-12-0012, release 3.1): the generator ships only in a build with
 * `VITE_CODEGEN=true` (EditorV2 and Settings read it as a literal, so Rollup drops the panel without it).
 *   off  the build 3.1 makes, the variable unset: 1. no module under `src/codegen/` but `setting.ts` in any chunk;
 *        2. `setting.ts` in a chunk, the control that the recorder sees the directory; 3. no chunk names a
 *        `runner.worker` file, so none is ever fetched. The worker is a bundle of its own, outside the recorder, and Vite
 *        emits it even without the flag: Rollup loads the module a dead `import()` names, and Vite's worker plugin emits
 *        every worker it bundled while transforming (measured in this lane; the orphan file is listed, not failed).
 *   on   the build 3.2 makes, `VITE_CODEGEN=true`: clauses 1-3 above, and 4. a chunk names the `runner.worker` file,
 *        the control of off 3 by the same reading.
 * In both, clause 0 reads the value Vite resolved for the variable: a build that did not see its mode is red.
 *
 * Run: npm run check:codegen-lazy [-- --off | --on] [--keep]   (both modes by default, off first; --keep leaves each
 * build in its temp dir and prints the path)
 */

import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import type { Plugin } from 'vite';

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND = resolve(HERE, '..', '..');

const CODEGEN = 'src/codegen/';
const EAGER_ALLOWED = 'src/codegen/setting.ts';
const PANEL = 'src/codegen/ui/CodePanel.tsx';
const FLAG = 'VITE_CODEGEN';
const WORKER = 'runner.worker';

type Mode = 'off' | 'on';

/** What the build resolved for the flag; `resolved` false when `configResolved` never ran. */
interface FlagRecord {
    resolved: boolean;
    value: string | undefined;
}

interface ChunkRecord {
    readonly fileName: string;
    readonly isEntry: boolean;
    readonly isDynamicEntry: boolean;
    readonly facade: string | null;
    readonly imports: readonly string[];
    readonly dynamicImports: readonly string[];
    readonly modules: readonly string[];
}

interface ManifestEntry {
    readonly file: string;
    readonly src?: string;
    readonly isEntry?: boolean;
    readonly isDynamicEntry?: boolean;
    readonly imports?: readonly string[];
    readonly dynamicImports?: readonly string[];
}

/** A module id as a path from the frontend root: no `\0` prefix, no query, forward slashes. */
function relativeId(id: string): string {
    const clean = id.replace(/^\0+/, '').replace(/[?#].*$/, '');
    const root = FRONTEND.endsWith('/') ? FRONTEND : FRONTEND + '/';
    return clean.startsWith(root) ? clean.slice(root.length) : clean;
}

const isGenerator = (path: string): boolean => path.startsWith(CODEGEN) && path !== EAGER_ALLOWED;

/** The recorder: every chunk of the client bundle, with its modules, and the flag as the build resolved it. */
function recorder(out: ChunkRecord[], flag: FlagRecord): Plugin {
    return {
        name: 'check-codegen-lazy:recorder',
        apply: 'build',
        configResolved(config) {
            flag.resolved = true;
            flag.value = config.env[FLAG];
        },
        generateBundle(_options, bundle) {
            for (const item of Object.values(bundle)) {
                if (item.type !== 'chunk') continue;
                out.push({
                    fileName: item.fileName,
                    isEntry: item.isEntry,
                    isDynamicEntry: item.isDynamicEntry,
                    facade: item.facadeModuleId ? relativeId(item.facadeModuleId) : null,
                    imports: [...item.imports],
                    dynamicImports: [...item.dynamicImports],
                    modules: item.moduleIds.map(relativeId),
                });
            }
        },
    };
}

/** The closure of `next` from `start`, `start` included. */
function closure<K>(start: readonly K[], next: (k: K) => readonly K[]): Set<K> {
    const seen = new Set<K>();
    const stack = [...start];
    while (stack.length > 0) {
        const k = stack.pop() as K;
        if (seen.has(k)) continue;
        seen.add(k);
        for (const n of next(k)) stack.push(n);
    }
    return seen;
}

/** One production build in `mode`, the flag set or unset in this process for its duration, then the mode's clauses. */
async function checkBuild(mode: Mode, keep: boolean): Promise<number> {
    const before = process.env[FLAG];
    if (mode === 'on') process.env[FLAG] = 'true';
    else delete process.env[FLAG];
    const outDir = mkdtempSync(join(tmpdir(), 'codegen-lazy-'));
    const chunks: ChunkRecord[] = [];
    const flag: FlagRecord = { resolved: false, value: undefined };
    const t0 = Date.now();
    try {
        await build({
            root: FRONTEND,
            configFile: resolve(FRONTEND, 'vite.config.ts'),
            mode: 'production',
            logLevel: 'warn',
            build: { outDir, emptyOutDir: true, manifest: true },
            plugins: [recorder(chunks, flag)],
        });
    } catch (error) {
        console.error(`FAIL  ${mode}: the build did not complete: ${(error as Error)?.message ?? String(error)}`);
        return 1;
    } finally {
        if (before === undefined) delete process.env[FLAG];
        else process.env[FLAG] = before;
    }
    console.log(`build  ${mode} (${FLAG} ${mode === 'on' ? 'true' : 'unset'}): ${Math.round((Date.now() - t0) / 1000)} s, ${chunks.length} chunks, out ${outDir}`);

    const manifestPath = join(outDir, '.vite', 'manifest.json');
    if (!existsSync(manifestPath) || chunks.length === 0) {
        console.error(`FAIL  ${mode}: nothing to read: manifest ${existsSync(manifestPath) ? 'present' : 'absent'}, ${chunks.length} chunks recorded`);
        return 1;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, ManifestEntry>;

    let failures = 0;
    const check = (label: string, ok: boolean, detail: string) => {
        if (!ok) failures++;
        console.log(`${ok ? 'PASS' : 'FAIL'}  ${mode} ${label}  ${detail}`);
    };

    // 0. The build saw the flag of its mode: read from the resolved config, not from this process's env.
    check(
        `0. the build resolved ${FLAG} ${mode === 'on' ? 'as "true"' : 'as anything but "true"'}`,
        flag.resolved && (mode === 'on') === (flag.value === 'true'),
        flag.resolved ? `resolved ${flag.value === undefined ? 'unset' : JSON.stringify(flag.value)}` : 'configResolved never ran',
    );

    const byFile = new Map(chunks.map(c => [c.fileName, c]));
    const entries = chunks.filter(c => c.isEntry).map(c => c.fileName);
    const eager = closure(entries, f => byFile.get(f)?.imports ?? []);
    const eagerModules = [...eager].flatMap(f => byFile.get(f)?.modules ?? []);
    const files = readdirSync(outDir, { recursive: true }) as string[];
    const workers = files.filter(f => f.includes(WORKER)).sort();
    const scripts = files.filter(f => f.endsWith('.js') && !f.includes(WORKER));
    const namedBy = new Map(workers.map(w => [w, scripts.filter(f => readFileSync(join(outDir, f), 'utf8').includes(basename(w))).sort()]));
    const workerDetail = workers.map(w => `${w} named by ${namedBy.get(w)!.join(', ') || 'no chunk'}`).join('; ') || 'none emitted';

    if (mode === 'off') {
        // The build without the flag: the generator is in no chunk at all, eager or lazy, and its worker is not emitted.
        const modules = chunks.flatMap(c => c.modules);
        const codegen = modules.filter(m => m.startsWith(CODEGEN)).sort();
        const leaked = codegen.filter(isGenerator);
        const settingChunks = chunks.filter(c => c.modules.includes(EAGER_ALLOWED)).map(c => c.fileName);
        console.log(`MEAS  ${chunks.length} chunks, ${modules.length} modules; src/codegen/ in them: ${codegen.join(', ') || 'none'}; ${WORKER} files: ${workerDetail}`);
        check(`1. no module under ${CODEGEN} but ${EAGER_ALLOWED} in any chunk`, leaked.length === 0, leaked.length === 0 ? `${chunks.length} chunks read` : `${leaked.length}: ${leaked.join(', ')}`);
        check(`2. ${EAGER_ALLOWED} is in a chunk (the control: the recorder sees ${CODEGEN})`, settingChunks.length > 0, settingChunks.join(', ') || 'in no chunk');
        const named = workers.filter(w => namedBy.get(w)!.length > 0);
        check(`3. no chunk names a ${WORKER} file (never fetched)`, named.length === 0, `${scripts.length} scripts read; ${workerDetail}`);
    } else {
        // 1. Modules of the static closure of the entry chunks.
        const leaked = eagerModules.filter(isGenerator).sort();
        const residue = eagerModules.filter(m => m.startsWith(CODEGEN) && !isGenerator(m));
        console.log(`MEAS  entries ${entries.join(', ')}; eager closure ${eager.size} chunks, ${eagerModules.length} modules; src/codegen/ in it: ${residue.concat(leaked).join(', ') || 'none'}`);
        check('1. no generator module in the eager closure (Rollup module ids)', leaked.length === 0, leaked.length === 0 ? `only ${EAGER_ALLOWED} allowed, found ${residue.length}` : leaked.join(', '));

        // 2. Manifest entries of the static closure from the manifest's own entries.
        const manifestEntries = Object.keys(manifest).filter(k => manifest[k].isEntry);
        const manifestEager = closure(manifestEntries, k => manifest[k]?.imports ?? []);
        const manifestLeaked = [...manifestEager].filter(k => typeof manifest[k]?.src === 'string' && isGenerator(manifest[k].src as string)).sort();
        check('2. no manifest entry of the eager closure has a generator src', manifestLeaked.length === 0, manifestLeaked.length === 0 ? `${manifestEager.size} entries walked from ${manifestEntries.join(', ')}` : manifestLeaked.join(', '));

        // 3. The positive control: the panel is a dynamic import target of the eager closure, and a lazy entry of its own.
        const targets = [...manifestEager].filter(k => (manifest[k]?.dynamicImports ?? []).includes(PANEL));
        const panelChunk = chunks.find(c => c.facade === PANEL);
        const lazyGenerator = chunks.filter(c => !eager.has(c.fileName)).flatMap(c => c.modules).filter(isGenerator);
        check(
            `3. ${PANEL} is a dynamicImports target of the eager closure`,
            targets.length > 0 && manifest[PANEL]?.isDynamicEntry === true && !!panelChunk && panelChunk.isDynamicEntry,
            `targeted by ${targets.join(', ') || 'nothing'}; manifest isDynamicEntry ${manifest[PANEL]?.isDynamicEntry === true}; chunk ${panelChunk?.fileName ?? 'none'}; ${lazyGenerator.length} generator modules outside the eager closure`,
        );

        // 4. The control of off 3: the same reading finds the worker named when the panel ships.
        check(`4. a chunk names a ${WORKER} file (the control of off 3)`, workers.some(w => namedBy.get(w)!.length > 0), `${scripts.length} scripts read; ${workerDetail}`);
    }

    if (keep) console.log(`kept  ${outDir}`);
    else rmSync(outDir, { recursive: true, force: true });
    console.log(`${mode}  ${failures === 0 ? 'green' : `${failures} FAILED`}`);
    return failures === 0 ? 0 : 1;
}

async function main(): Promise<number> {
    const args = process.argv.slice(2);
    const keep = args.includes('--keep');
    const unknown = args.filter(a => a !== '--keep' && a !== '--off' && a !== '--on');
    if (unknown.length > 0) {
        console.error(`unknown argument: ${unknown.join(' ')}`);
        return 1;
    }
    const only = (['off', 'on'] as const).filter(m => args.includes(`--${m}`));
    const modes: readonly Mode[] = only.length > 0 ? only : ['off', 'on'];
    let failed = 0;
    for (const mode of modes) {
        const result = await checkBuild(mode, keep);
        failed += result;
    }
    console.log(failed === 0 ? `ALL GREEN (${modes.join(', ')})` : `${failed} of ${modes.length} modes FAILED`);
    return failed === 0 ? 0 : 1;
}

process.exit(await main());
