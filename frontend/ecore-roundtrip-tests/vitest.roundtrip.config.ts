/**
 * Vitest config for the headless Ecore/XMI round-trip suite.
 *
 * Same philosophy as coevolution-tests: lives OUTSIDE src/ so the root
 * vitest.config.ts include pattern does not pick it up, and reuses the
 * coevolution stubs (monaco/jquery/sweetalert2/DOM) verbatim.
 *
 * Run from frontend/:
 *   npx vitest run --config ecore-roundtrip-tests/vitest.roundtrip.config.ts
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

const __dirname = import.meta.dirname;
const root = path.resolve(__dirname, '..'); // frontend/
const stubs = path.resolve(root, 'coevolution-tests/stubs');

export default defineConfig({
    define: {
        global: 'globalThis',
        __APP_VERSION__: JSON.stringify('0.0.0-test'),
        __BUILD_COUNT__: JSON.stringify('0'),
        __BUILD_SHA__: JSON.stringify('test'),
    },
    resolve: {
        alias: [
            { find: 'monaco-editor/esm/vs/editor/editor.main', replacement: path.resolve(stubs, 'monaco-stub.ts') },
            { find: /^monaco-editor$/, replacement: path.resolve(stubs, 'monaco-stub.ts') },
            { find: '@monaco-editor/react', replacement: path.resolve(stubs, 'monaco-react-stub.ts') },
            { find: /^jquery$/, replacement: path.resolve(stubs, 'jquery-stub.ts') },
            { find: /^sweetalert2$/, replacement: path.resolve(stubs, 'sink-stub.ts') },
            { find: /^jqueryui$/, replacement: path.resolve(stubs, 'sink-stub.ts') },
            { find: '@', replacement: path.resolve(root, 'src') },
            { find: 'src', replacement: path.resolve(root, 'src') },
        ],
    },
    test: {
        environment: 'node',
        globals: true,
        include: ['ecore-roundtrip-tests/**/*.test.ts'],
        setupFiles: [path.resolve(stubs, 'dom-setup.ts')],
        root,
        // joiner transform is slow on cold cache; UML.ecore import is heavy.
        hookTimeout: 120_000,
        testTimeout: 300_000,
        teardownTimeout: 1000,
    },
});
