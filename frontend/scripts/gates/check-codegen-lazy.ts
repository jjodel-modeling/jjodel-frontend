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
 * Run: npm run check:codegen-lazy [-- --keep]   (--keep leaves the build in its temp dir and prints the path)
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import type { Plugin } from 'vite';

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND = resolve(HERE, '..', '..');

const CODEGEN = 'src/codegen/';
const EAGER_ALLOWED = 'src/codegen/setting.ts';
const PANEL = 'src/codegen/ui/CodePanel.tsx';

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

/** The recorder: every chunk of the client bundle, with its modules. */
function recorder(out: ChunkRecord[]): Plugin {
    return {
        name: 'check-codegen-lazy:recorder',
        apply: 'build',
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

async function main(): Promise<number> {
    const keep = process.argv.slice(2).includes('--keep');
    const unknown = process.argv.slice(2).filter(a => a !== '--keep');
    if (unknown.length > 0) {
        console.error(`unknown argument: ${unknown.join(' ')}`);
        return 1;
    }
    const outDir = mkdtempSync(join(tmpdir(), 'codegen-lazy-'));
    const chunks: ChunkRecord[] = [];
    const t0 = Date.now();
    try {
        await build({
            root: FRONTEND,
            configFile: resolve(FRONTEND, 'vite.config.ts'),
            mode: 'production',
            logLevel: 'warn',
            build: { outDir, emptyOutDir: true, manifest: true },
            plugins: [recorder(chunks)],
        });
    } catch (error) {
        console.error(`FAIL  the build did not complete: ${(error as Error)?.message ?? String(error)}`);
        return 1;
    }
    console.log(`build  ${Math.round((Date.now() - t0) / 1000)} s, ${chunks.length} chunks, out ${outDir}`);

    const manifestPath = join(outDir, '.vite', 'manifest.json');
    if (!existsSync(manifestPath) || chunks.length === 0) {
        console.error(`FAIL  nothing to read: manifest ${existsSync(manifestPath) ? 'present' : 'absent'}, ${chunks.length} chunks recorded`);
        return 1;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, ManifestEntry>;

    let failures = 0;
    const check = (label: string, ok: boolean, detail: string) => {
        if (!ok) failures++;
        console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`);
    };

    // 1. Modules of the static closure of the entry chunks.
    const byFile = new Map(chunks.map(c => [c.fileName, c]));
    const entries = chunks.filter(c => c.isEntry).map(c => c.fileName);
    const eager = closure(entries, f => byFile.get(f)?.imports ?? []);
    const eagerModules = [...eager].flatMap(f => byFile.get(f)?.modules ?? []);
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

    if (keep) console.log(`kept  ${outDir}`);
    else rmSync(outDir, { recursive: true, force: true });
    console.log(failures === 0 ? 'ALL GREEN' : `${failures} FAILED`);
    return failures === 0 ? 0 : 1;
}

process.exit(await main());
