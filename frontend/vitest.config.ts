import { defineConfig } from 'vite';
import path from 'path';

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
        include: ['src/**/__tests__/**/*.test.ts'],
    },
} as any);
