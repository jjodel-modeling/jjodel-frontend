/**
 * Headless stub for @monaco-editor/react. The joiner calls
 * loader.config({ monaco }) at module load (src/joiner/index.ts:35).
 * Used only by vitest.coevolution.config.ts aliases.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const loader: any = {
    config: () => {},
    init: () => Promise.resolve({}),
};

const EditorStub: any = () => null;
export const Editor: any = EditorStub;
export const DiffEditor: any = EditorStub;
export const useMonaco: any = () => null;
export default EditorStub;
