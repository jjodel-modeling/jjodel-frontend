import { defineConfig } from 'vitest/config';
import path from 'path';

const __dirname = import.meta.dirname

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            'src': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'node',
        globals: true,
        include: ['src/**/__tests__/**/*.test.ts', 'scripts/gates/__tests__/**/*.test.ts', 'scripts/hooks/__tests__/**/*.test.ts'],
    },
});
