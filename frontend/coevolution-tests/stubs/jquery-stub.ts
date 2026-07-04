/**
 * Headless stub for jquery. Legacy chain (jquery-global / U.tsx helpers)
 * loads it at module init; Sizzle's feature-detection needs a real DOM.
 * The delete-cascade paths under test never exercise jQuery, so a
 * bottomless no-op Proxy is sufficient.
 * Used only by vitest.coevolution.config.ts aliases.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const sink: any = new Proxy(function () {} as any, {
    get(_t, prop) {
        if (prop === Symbol.toPrimitive) return () => '';
        if (prop === 'then') return undefined;
        return sink;
    },
    apply() { return sink; },
    construct() { return sink; },
});

export default sink;
