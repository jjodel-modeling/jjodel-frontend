/**
 * Vitest config for the headless co-evolution suite.
 *
 * The suite lives OUTSIDE src/ on purpose: the root vitest.config.ts include
 * pattern ("src/.../__tests__/...test.ts") must NOT pick these files up,
 * because they need the monaco/jquery stubs below to run headless.
 *
 * Same path aliases as the root vitest.config.ts PLUS browser-only library
 * stubs: the joiner imports monaco-editor, jquery/jqueryui and sweetalert2
 * eagerly at module load.
 *
 * Run from frontend/:
 *   npx vitest run --config coevolution-tests/vitest.coevolution.config.ts
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

const __dirname = import.meta.dirname;
const root = path.resolve(__dirname, '..'); // frontend/

export default defineConfig({
    define: {
        global: 'globalThis',
        __APP_VERSION__: JSON.stringify('0.0.0-test'),
        __BUILD_COUNT__: JSON.stringify('0'),
        __BUILD_SHA__: JSON.stringify('test'),
    },
    resolve: {
        alias: [
            { find: 'monaco-editor/esm/vs/editor/editor.main', replacement: path.resolve(__dirname, 'stubs/monaco-stub.ts') },
            { find: /^monaco-editor$/, replacement: path.resolve(__dirname, 'stubs/monaco-stub.ts') },
            { find: '@monaco-editor/react', replacement: path.resolve(__dirname, 'stubs/monaco-react-stub.ts') },
            { find: /^jquery$/, replacement: path.resolve(__dirname, 'stubs/jquery-stub.ts') },
            { find: /^sweetalert2$/, replacement: path.resolve(__dirname, 'stubs/sink-stub.ts') },
            { find: /^jqueryui$/, replacement: path.resolve(__dirname, 'stubs/sink-stub.ts') },
            { find: '@', replacement: path.resolve(root, 'src') },
            { find: 'src', replacement: path.resolve(root, 'src') },
        ],
    },
    test: {
        environment: 'node',
        globals: true,
        include: ['coevolution-tests/**/*.test.ts'],
        setupFiles: [path.resolve(__dirname, 'stubs/dom-setup.ts')],
        root,
        // The joiner keeps timers alive (AT_TRANSACTION test hook); don't hang.
        teardownTimeout: 1000,
    },
});
