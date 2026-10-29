/**
 * copy-catalog (P-2026-10-18-1800, slice S2): copies the library catalog, docs/library/catalog.json, to
 * frontend/public/library/catalog.json, the copy the Templates page fetches. Vite cannot import the docs file: its
 * serving allow list is the frontend root (vite.config.ts, `searchForWorkspaceRoot`), and docs/ sits outside it.
 *
 * Runs as `prebuild`. The copy is committed too, so a dev server started without npm (lane-run probe) serves it;
 * src/library/__tests__/gallery.test.ts fails when the two differ. A tree without docs/ keeps the committed copy.
 *
 * Run:  node frontend/scripts/library/copy-catalog.mjs
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const src = new URL('../../../docs/library/catalog.json', import.meta.url);
const dst = new URL('../../public/library/catalog.json', import.meta.url);

if (!existsSync(src)) {
    console.warn('copy-catalog: ' + src.pathname + ' not found, the committed copy is kept');
} else {
    mkdirSync(new URL('.', dst), { recursive: true });
    copyFileSync(src, dst);
    console.log('copy-catalog: ' + dst.pathname);
}
