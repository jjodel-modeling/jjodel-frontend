import { describe, it, expect } from 'vitest';
import { skippedLinesAsEditorLines } from '../components/summaryLines';

/**
 * The skipped lines the execution summary shows, in editor numbering.
 *
 * The scenario lane L3 exists for: a comment and a blank line before the skipped command,
 * so its editor line and its command index differ, which is exactly when the dialog used
 * to print a number that matched no row of the script.
 *
 * `lineToCommandIndex` is written here by hand the way `ScriptBlock.tsx` builds it
 * (`:269-279`): the running command index per editor line, `null` for a blank line, a
 * `//` or `#` comment and a `target ...` directive. The component's builder cannot be
 * imported: the module pulls the `joiner` barrel and does not load under vitest.
 */
describe('skippedLinesAsEditorLines', () => {
    it('shows the editor line when a comment and a blank line precede the skipped command', () => {
        // 1: `// one comment`        -> null
        // 2: `` (blank)              -> null
        // 3: `create class Pipeline` -> command 0
        // 4: `create class Register` -> command 1
        const lineToCommandIndex = [null, null, 0, 1];
        // The summary holds the 1-based command index: command 1, `create class Register`.
        expect(skippedLinesAsEditorLines([2], lineToCommandIndex)).toEqual([4]);
    });

    it('is the identity when no non-command line precedes anything', () => {
        // 1: `create class A` -> command 0
        // 2: `create class B` -> command 1
        const lineToCommandIndex = [0, 1];
        expect(skippedLinesAsEditorLines([1, 2], lineToCommandIndex)).toEqual([1, 2]);
    });

    it('maps several skipped commands preserving their written order', () => {
        // 1: `# a hash comment`      -> null
        // 2: `target MM`             -> null
        // 3: `create class A`        -> command 0
        // 4: `` (blank)              -> null
        // 5: `create class B`        -> command 1
        // 6: `create class C`        -> command 2
        const lineToCommandIndex = [null, null, 0, null, 1, 2];
        // Command 2 skipped before command 0: the summary keeps the skip order it was
        // given, so the dialog lists the deeper line first.
        expect(skippedLinesAsEditorLines([3, 1], lineToCommandIndex)).toEqual([6, 3]);
    });

    it('falls back to the 1-based command index when the map has no entry for it', () => {
        // Defensive: every real skipped index has an editor line. The fallback is the one
        // `getScriptLine` applies (`commandIndex + 1`), so the two never disagree.
        expect(skippedLinesAsEditorLines([7], [0, 1])).toEqual([7]);
    });
});
