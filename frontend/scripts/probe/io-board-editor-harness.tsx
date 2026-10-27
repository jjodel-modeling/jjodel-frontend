/**
 * io-board-editor-harness — mounts the board editor in the running app for the probe io-board-lane1.ts
 * (P-2026-10-03-1845 Lane 1). Lane 1 gives the editor no entry in the app (report §8): the board that opens
 * it is Lane 2's. The probe imports this module through the dev server (`/scripts/probe/…`), so the editor
 * runs on the app's own React, store and joiner, the same module instances the app loaded.
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { SimBoardEditor } from '../../src/components/editor-v2/sim/SimBoardEditor';

let root: Root | null = null;
let host: HTMLDivElement | null = null;

export function unmountBoardEditor(): void {
    root?.unmount();
    root = null;
    host?.remove();
    host = null;
}

/** The editor over a model, as the board will open it; Apply and Cancel close it, as the board will. */
export function mountBoardEditor(props: { modelId: string; modelName: string; boardRaw: string | null }): void {
    unmountBoardEditor();
    host = document.createElement('div');
    host.id = 'io-board-editor-harness';
    document.body.appendChild(host);
    root = createRoot(host);
    root.render(createElement(SimBoardEditor, { ...props, onClose: unmountBoardEditor, onApplied: unmountBoardEditor }));
}
