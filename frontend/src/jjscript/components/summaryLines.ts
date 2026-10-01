/**
 * The execution summary's skipped lines, in editor numbering.
 *
 * `ExecutionSummary.skippedLines` holds 1-based COMMAND indices: every writer of the
 * field stores `i + 1` (the skip paths of `ScriptBlock.tsx`), and the run's control
 * state reads them back in that space (`skippedLinesSet`, `runCommandsFromIndex`, the
 * `EXECUTION_PAUSED` detail), so the field itself must not change. But the dialog prints
 * the list beside the errors, which are already in EDITOR numbering (every error writer
 * passes `getScriptLine(i)`), so the two rows disagreed whenever a comment or a blank
 * line preceded a skipped command.
 *
 * This module is the render-side translation: each command index becomes the editor
 * line the component's `lineToCommandIndex` array says it sits on, the same lookup
 * `getScriptLine` performs, falling back to the 1-based command index itself when the
 * array has no entry (defensive: a skipped index always has an editor line).
 *
 * Pure and beside the component on purpose: `ScriptBlock.tsx` imports the `joiner`
 * barrel, which pulls monaco, so it does not load under vitest and the mapping could
 * not be executed from there (the same reason `create.ts` has
 * `superclassResolution.ts`).
 */

/**
 * Map 1-based command indices to the 1-based editor lines they are rendered on.
 *
 * `lineToCommandIndex` is the component's per-editor-line array: the running command
 * index for an executable line, `null` for a blank line, a `//` or `#` comment or a
 * `target ...` directive.
 */
export function skippedLinesAsEditorLines(
    skippedLines: readonly number[],
    lineToCommandIndex: readonly (number | null)[]
): number[] {
    return skippedLines.map(n => {
        const editorLine = lineToCommandIndex.findIndex(x => x === n - 1);
        return editorLine >= 0 ? editorLine + 1 : n;
    });
}
