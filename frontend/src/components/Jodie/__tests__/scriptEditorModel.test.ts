/**
 * Script editor model (S5, R-JJD-2): the edited lines that get the green bar, and the editor store.
 */
import { describe, it, expect } from 'vitest';
import {
    closeScriptEditor,
    editedLines,
    editedScript,
    getScriptEditorTarget,
    getScriptEditorVersion,
    openScriptEditor,
    reviewRequest,
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
