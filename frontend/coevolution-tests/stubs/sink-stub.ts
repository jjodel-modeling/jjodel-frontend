/**
 * Generic bottomless no-op stub for browser-only UI libraries that the
 * joiner chain pulls in at module load (sweetalert2, toasts, ...).
 * Any property access / call / construction returns the sink itself.
 * Used only by vitest.coevolution.config.ts aliases.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const sink: any = new Proxy(function () {} as any, {
    get(_t, prop) {
        if (prop === Symbol.toPrimitive) return () => '';
        if (prop === 'then') return undefined;
        if (prop === 'default') return sink;
        return sink;
    },
    apply() { return sink; },
    construct() { return sink; },
});

export default sink;
