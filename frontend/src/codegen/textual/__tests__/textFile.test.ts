/**
 * Lane T8b (P-2026-11-08-0206; R-TXT-55 F8 to F10, R-TXT-21 (8)): the text file of a model. The export is the print with
 * the ids on; the import plans a file's text against the model with no carried spans, so the match starts at the ids,
 * then names, through the same `planTextEdit` the Text tab uses.
 */

import { describe, it, expect } from 'vitest';
import { printTextModel } from '../printer';
import { exportText, planTextImport, textFileName, textImportRows } from '../textFile';
import type { TextImportBase } from '../textFile';
import { tolerantCases } from './tolerantCorpus';

const lib = tolerantCases()[0];
const base: TextImportBase = { mm: lib.mm, grammar: lib.g, objects: lib.objects, unprinted: [] };
const exported = exportText(lib.g, lib.objects);
/** The Text tab's print: the ids off. */
const plain = printTextModel(lib.g, lib.objects).text;

/** `book0` renamed and its genre changed: nothing of it equal by name or by value. */
function renamed(text: string): string {
    const at = text.indexOf('book0');
    const out = text.slice(0, at) + 'novel' + text.slice(at + 'book0'.length);
    const genre = out.indexOf('FICTION', at);
    return out.slice(0, genre) + 'HISTORY' + out.slice(genre + 'FICTION'.length);
}

describe('T8b export', () => {
    it('carries one @id comment per object head, each the id of an object', () => {
        const comments = [...exported.matchAll(/\/\/ @id (\S+)$/gm)].map(m => m[1]);
        expect(comments.length).toBe(lib.objects.length);
        expect(new Set(comments)).toEqual(new Set(lib.objects.map(o => o.id)));
    });

    it('turns the ids on for the export only: the grammar the Text tab prints with is unchanged', () => {
        expect(lib.g.style.printIds).toBeUndefined();
        expect(plain).not.toMatch(/@id/);
        expect(exported.replace(/ \/\/ @id \S+$/gm, '')).toBe(plain);
    });

    it('names the file after the model', () => {
        expect(textFileName('city')).toBe('city.txt');
        expect(textFileName('')).toBe('model.txt');
    });
});

describe('T8b import', () => {
    it('an exported text re-imported unchanged plans no change', () => {
        const { plan } = planTextImport(base, exported);
        expect(plan.refusals).toEqual([]);
        expect(plan.lines).toEqual([]);
        expect(plan.diff?.ops).toEqual([]);
    });

    it('matches every object by its id', () => {
        const { plan, ids } = planTextImport(base, exported);
        expect(ids.size).toBe(lib.objects.length);
        expect(plan.diff?.match.matches.every(m => m.by === 'id' && !m.uncertain)).toBe(true);
    });

    it('an edited value plans one change', () => {
        const { plan } = planTextImport(base, exported.replace('1901', '1950'));
        expect(plan.refusals).toEqual([]);
        expect(plan.diff?.ops).toEqual([{ op: 'attribute', target: { model: 'b1' }, feature: 'year', value: 1950 }]);
        expect(plan.lines?.length).toBe(1);
    });

    it('a file without ids still plans by names', () => {
        expect(planTextImport(base, plain).plan.lines).toEqual([]);
        const { plan, ids } = planTextImport(base, plain.replace('1901', '1950'));
        expect(ids.size).toBe(0);
        expect(plan.diff?.ops).toEqual([{ op: 'attribute', target: { model: 'b1' }, feature: 'year', value: 1950 }]);
        expect(plan.diff?.match.matches.some(m => m.by === 'id')).toBe(false);
    });

    it('an object renamed with its values changed is the same object by its id, a create and a delete without', () => {
        const byId = planTextImport(base, renamed(exported)).plan;
        expect(byId.diff?.match.created).toEqual([]);
        expect(byId.diff?.match.deleted).toEqual([]);
        expect(byId.diff?.ops.map(op => op.op === 'attribute' ? `${op.feature}=${op.value}` : op.op).sort()).toEqual(['genre=HISTORY', 'name=novel']);
        const byName = planTextImport(base, renamed(plain)).plan;
        expect(byName.diff?.match.deleted).toEqual(['b0']);
        expect(byName.diff?.match.created.length).toBe(1);
    });

    it('carries no spans: an id comment is the only evidence beyond names', () => {
        const { plan } = planTextImport(base, exported);
        expect(plan.diff?.match.matches.some(m => m.by === 'span')).toBe(false);
    });

    it('refuses a recovered object (R-TXT-21 (8)): no lines, the parse refusal', () => {
        const broken = exported.replace('1901', '1901 ]');
        const { parsed, plan } = planTextImport(base, broken);
        expect(parsed.recovered.length + parsed.errors.length).toBeGreaterThan(0);
        expect(plan.lines).toBeNull();
        expect(plan.refusals.map(r => r.code)).toContain('parse');
    });
});

describe('T8b import rows', () => {
    it('no change, no row', () => {
        const imported = planTextImport(base, exported);
        expect(textImportRows(base, imported)).toEqual([]);
    });

    it('one row per changed object, naming the features', () => {
        const imported = planTextImport(base, exported.replace('1901', '1950'));
        expect(textImportRows(base, imported)).toEqual([{ old: 'Book book1', new: 'Book book1', reason: 'changed: year', flagged: false }]);
    });

    it('a deletion and a creation each have their row', () => {
        const imported = planTextImport(base, renamed(plain));
        const rows = textImportRows(base, imported);
        expect(rows).toContainEqual({ old: 'Book book0', new: null, reason: 'deleted', flagged: false });
        expect(rows).toContainEqual({ old: '—', new: 'Book novel', reason: 'created', flagged: false });
    });
});
