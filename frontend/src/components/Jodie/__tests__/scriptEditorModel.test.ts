/**
 * Script editor model (S5, R-JJD-2): the edited lines that get the green bar, and the editor store.
 * S6c: the line diff, the input of `Update file`, and the links of cards to script files.
 */
import { describe, it, expect } from 'vitest';
import {
    closeScriptEditor,
    editedLines,
    editedScript,
    fileUpdateInput,
    getScriptEditorTarget,
    getScriptEditorVersion,
    lineDiff,
    openScriptEditor,
    reviewRequest,
    ScriptFileLinks,
    setEditedScript,
    subscribeScriptEditor,
} from '../scriptEditorModel';

const GEN = ['// Two states', 'create State s1', 'create State s2', 'set s1.name = "Idle"'].join('\n');

describe('editedLines', () => {
    it('is empty when nothing changed', () => {
        expect(editedLines(GEN, GEN)).toEqual([]);
    });

    it('marks one changed line, and only that line', () => {
        const edited = GEN.replace('create State s2', 'create State s3');
        expect(editedLines(GEN, edited)).toEqual([3]);
    });

    it('marks an inserted line without marking the lines it pushes down', () => {
        const lines = GEN.split('\n');
        lines.splice(2, 0, 'create Initial i0');
        expect(editedLines(GEN, lines.join('\n'))).toEqual([3]);
    });

    it('marks nothing for a deleted line: the lines left are all generated', () => {
        const lines = GEN.split('\n');
        lines.splice(1, 1);
        expect(editedLines(GEN, lines.join('\n'))).toEqual([]);
    });

    it('marks lines appended at the end', () => {
        expect(editedLines(GEN, `${GEN}\ncreate State s4\n`)).toEqual([5, 6]);
    });

    it('marks a moved line once, where it now is', () => {
        const lines = GEN.split('\n');
        const moved = [lines[0], lines[2], lines[1], lines[3]].join('\n');
        expect(editedLines(GEN, moved)).toHaveLength(1);
    });

    it('treats CRLF and LF as the same line break', () => {
        expect(editedLines(GEN, GEN.replace(/\n/g, '\r\n'))).toEqual([]);
    });

    it('marks every line of an edit of an empty script', () => {
        expect(editedLines('', 'a\nb')).toEqual([1, 2]);
    });
});

describe('reviewRequest', () => {
    it('carries the edited script in a jjscript block', () => {
        const msg = reviewRequest('create State s9');
        expect(msg).toContain('```jjscript\ncreate State s9\n```');
        expect(msg).toMatch(/review/i);
    });
});

describe('editor store', () => {
    it('opens and closes a target, notifying and bumping the version', () => {
        let calls = 0;
        const off = subscribeScriptEditor(() => { calls++; });
        const v0 = getScriptEditorVersion();
        openScriptEditor({ key: 'k1', generated: GEN, modelId: 'm1', name: 'Two states' });
        expect(getScriptEditorTarget()?.key).toBe('k1');
        closeScriptEditor();
        expect(getScriptEditorTarget()).toBeNull();
        closeScriptEditor();
        off();
        expect(calls).toBe(2);
        expect(getScriptEditorVersion()).toBe(v0 + 2);
    });

    it('keeps the edited text per card, and forgets it when it is back to the generated one', () => {
        expect(editedScript('k2', GEN)).toBe(GEN);
        setEditedScript('k2', GEN, `${GEN}\nx`);
        expect(editedScript('k2', GEN)).toBe(`${GEN}\nx`);
        expect(editedScript('k3', 'other')).toBe('other');
        setEditedScript('k2', GEN, GEN);
        expect(editedScript('k2', GEN)).toBe(GEN);
    });

    it('does not notify when the edited text does not change', () => {
        let calls = 0;
        const off = subscribeScriptEditor(() => { calls++; });
        setEditedScript('k4', GEN, 'y');
        setEditedScript('k4', GEN, 'y');
        setEditedScript('k5', GEN, GEN);
        off();
        expect(calls).toBe(1);
    });
});

describe('lineDiff', () => {
    it('marks the lines of the new text outside the common subsequence as added and the old ones as removed', () => {
        const rows = lineDiff('a\nb\nc', 'a\nB\nc\nd');
        expect(rows).toEqual([
            { kind: 'same', text: 'a' },
            { kind: 'removed', text: 'b' },
            { kind: 'added', text: 'B' },
            { kind: 'same', text: 'c' },
            { kind: 'added', text: 'd' },
        ]);
    });

    it('keeps the removed lines after the end of the new text', () => {
        expect(lineDiff('a\nb\nc', 'a')).toEqual([
            { kind: 'same', text: 'a' },
            { kind: 'removed', text: 'b' },
            { kind: 'removed', text: 'c' },
        ]);
    });
});

describe('fileUpdateInput', () => {
    const FILE = ['// Two states', 'create State s1', 'create State s2 // mine'].join('\n');
    const NEXT = ['// Two states', 'create State s1', 'create State s3', 'set s1.name = "Idle"'].join('\n');

    it('puts the file as it is now on the left, the user edits included, and counts the rows', () => {
        const input = fileUpdateInput(FILE, NEXT)!;
        expect(input.original).toBe(FILE);
        expect(input.modified).toBe(NEXT);
        expect(input.added).toBe(2);
        expect(input.removed).toBe(1);
    });

    it('counts nothing when the file already holds the script', () => {
        expect(fileUpdateInput(NEXT, NEXT)).toEqual({ original: NEXT, modified: NEXT, added: 0, removed: 0 });
    });

    it('is undefined when the file is gone', () => {
        expect(fileUpdateInput(undefined, NEXT)).toBeUndefined();
    });
});

describe('ScriptFileLinks', () => {
    it('targets the file of an earlier card with the same name from a later message', () => {
        const links = new ScriptFileLinks();
        links.link('m1:a', 'm1', 'Two states', 'S1');
        expect(links.targetOf('m2:a', 'm2', 'Two states')).toBe('S1');
    });

    it('does not target from the linked card itself, a card of the same message, another name or an earlier message', () => {
        const links = new ScriptFileLinks();
        links.see('m0');
        links.link('m1:a', 'm1', 'Two states', 'S1');
        expect(links.targetOf('m1:a', 'm1', 'Two states')).toBeUndefined();
        expect(links.targetOf('m1:b', 'm1', 'Two states')).toBeUndefined();
        expect(links.targetOf('m2:a', 'm2', 'Three states')).toBeUndefined();
        expect(links.targetOf('m0:a', 'm0', 'Two states')).toBeUndefined();
    });

    it('targets the newest earlier link of the name', () => {
        const links = new ScriptFileLinks();
        links.link('m1:a', 'm1', 'Two states', 'S1');
        links.link('m2:a', 'm2', 'Two states', 'S2');
        expect(links.targetOf('m3:a', 'm3', 'Two states')).toBe('S2');
    });

    it('binds the first new message after a follow-up to the file of the asking card, whatever its name', () => {
        const links = new ScriptFileLinks();
        links.link('m1:a', 'm1', 'Two states', 'S1');
        links.followUp(links.fileOf('m1:a', 'm1', 'Two states')!);
        expect(links.targetOf('m1:a', 'm1', 'Two states')).toBeUndefined();
        expect(links.targetOf('m2:a', 'm2', 'Fixed states')).toBe('S1');
        // Sticky for that message, and spent: the next message is not an answer.
        expect(links.targetOf('m2:a', 'm2', 'Fixed states')).toBe('S1');
        expect(links.targetOf('m3:a', 'm3', 'Other')).toBeUndefined();
    });

    it('carries the file through a card that targets it', () => {
        const links = new ScriptFileLinks();
        links.link('m1:a', 'm1', 'Two states', 'S1');
        expect(links.fileOf('m2:a', 'm2', 'Two states')).toBe('S1');
        links.followUp(links.fileOf('m2:a', 'm2', 'Two states')!);
        expect(links.targetOf('m3:a', 'm3', 'Renamed')).toBe('S1');
    });

    it('keeps an accepted card on its file, as the newest link of its name', () => {
        const links = new ScriptFileLinks();
        links.link('m1:a', 'm1', 'Two states', 'S1');
        expect(links.targetOf('m2:a', 'm2', 'Two states')).toBe('S1');
        links.link('m2:a', 'm2', 'Two states', 'S1', false);
        expect(links.targetOf('m2:a', 'm2', 'Two states')).toBe('S1');
        expect(links.targetOf('m3:a', 'm3', 'Two states')).toBe('S1');
    });
});
