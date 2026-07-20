/**
 * Headless stub for monaco-editor (and its editor.main entry).
 * The joiner imports monaco eagerly at module load (src/joiner/index.ts:29),
 * which crashes in a node test environment. Every member is a bottomless
 * no-op Proxy: any property access returns the sink, any call returns the
 * sink, so module-level registrations (languages.register, loader.config,
 * editor.defineTheme, ...) are silently absorbed.
 *
 * Used only by vitest.coevolution.config.ts aliases. Never bundled in the app.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const sink: any = new Proxy(function () {} as any, {
    get(_t, prop) {
        if (prop === Symbol.toPrimitive) return () => '';
        if (prop === 'then') return undefined; // never thenable
        return sink;
    },
    apply() { return sink; },
    construct() { return sink; },
});

export const editor: any = sink;
export const languages: any = sink;
export const Uri: any = sink;
export const Range: any = sink;
export const Position: any = sink;
export const Selection: any = sink;
export const KeyMod: any = sink;
export const KeyCode: any = sink;
export const MarkerSeverity: any = sink;
export const MarkerTag: any = sink;
export const CancellationTokenSource: any = sink;
export const Emitter: any = sink;
export const Token: any = sink;
export default sink;
