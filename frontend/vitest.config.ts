import { defineConfig } from 'vitest/config';
// import react from '@vitejs/plugin-react/dist/index.js';
import react from './node_modules/@vitejs/plugin-react/dist/index.js';


export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom', // Allows testing React components if needed
        globals: true,        // Optional: lets you use describe/test without importing them
    },
});