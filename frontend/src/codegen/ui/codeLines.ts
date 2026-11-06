/**
 * codeLines — the generated text cut into lines and spans, for the `<pre>`-with-gutter form of the Code panel's
 * Output (CodePanel.tsx) and of the Template Editor's preview (TemplateEditorTab.tsx) (slice S3, P-2026-10-23-2225;
 * discovery 2026-10-23 codegen authoring §3.4). Moved from CodePanel.tsx unchanged.
 *
 * Pure: no React, no store.
 */

import type { TextMapEntry } from '../engine/text';

/** One rendered piece of a line: plain text (an indentation prefix) or the span of a map entry. */
export interface Piece {
    readonly text: string;
    readonly entry: TextMapEntry | null;
}

/** The lines of the code, each cut at its map entries; a zero-width entry (an error fragment) writes nothing. */
export function linesOf(code: string, map: readonly TextMapEntry[]): Piece[][] {
    const texts = code.split('\n');
    if (texts.length > 1 && texts[texts.length - 1] === '') texts.pop();
    const byLine = new Map<number, TextMapEntry[]>();
    for (const e of map) {
        if (e.end <= e.start) continue;
        const list = byLine.get(e.line);
        if (list) list.push(e);
        else byLine.set(e.line, [e]);
    }
    return texts.map((text, i) => {
        const pieces: Piece[] = [];
        let at = 0;
        for (const e of byLine.get(i + 1) ?? []) {
            if (e.start > at) pieces.push({ text: text.slice(at, e.start), entry: null });
            pieces.push({ text: text.slice(e.start, e.end), entry: e });
            at = e.end;
        }
        if (at < text.length) pieces.push({ text: text.slice(at), entry: null });
        return pieces;
    });
}
