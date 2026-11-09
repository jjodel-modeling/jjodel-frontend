/**
 * The mapping from a drop's results to the panel rows and the toasts (P-2026-11-08-2145). Each test name says which
 * break kills it.
 */
import { describe, expect, it } from 'vitest';
import { dropImportView, MAX_PER_FILE_TOASTS, OPEN_PROJECT_TOAST_MS } from '../DropImportPanel';
import type { JjodelImportResult } from '../../../api/persistance/jjodelImport';

const file = (name: string) => new File(['{}'], name);
const imported = (name: string, projectId: string = `id-${name}`): JjodelImportResult => ({ file: file(name), ok: true, projectId });
const failed = (name: string): JjodelImportResult => ({ file: file(name), ok: false, reason: 'failed' });
const skipped = (name: string): JjodelImportResult => ({ file: file(name), ok: false, reason: 'extension' });
const settledView = (results: JjodelImportResult[]) => dropImportView({ files: results.map(r => r.file), results });
const titles = (results: JjodelImportResult[]) => settledView(results).toasts.map(t => `${t.priority}:${t.title}`);

describe('dropImportView rows', () => {
    it('keeps the drop order, one row per file, the skipped ones included', () => {
        const view = settledView([imported('b.jjodel'), skipped('a.pdf'), failed('c.jjodel')]);
        expect(view.rows).toEqual([
            { name: 'b.jjodel', state: 'imported' },
            { name: 'a.pdf', state: 'skipped' },
            { name: 'c.jjodel', state: 'failed' },
        ]);
    });

    it('shows one file importing, the first unsettled, and the next ones pending', () => {
        const files = [file('a.jjodel'), file('b.jjodel'), file('c.jjodel')];
        const view = dropImportView({ files, results: [imported('a.jjodel')] });
        expect(view.rows.map(r => r.state)).toEqual(['imported', 'importing', 'pending']);
    });

    it('marks a rejected extension skipped before its turn comes', () => {
        const files = [file('a.jjodel'), file('b.pdf')];
        expect(dropImportView({ files, results: [] }).rows.map(r => r.state)).toEqual(['importing', 'skipped']);
    });

    it('does not spend the importing state on a skipped file', () => {
        const files = [file('a.pdf'), file('b.jjodel')];
        expect(dropImportView({ files, results: [] }).rows.map(r => r.state)).toEqual(['skipped', 'importing']);
    });
});

describe('dropImportView title and settled', () => {
    it('is singular for one project', () => {
        expect(dropImportView({ files: [file('a.jjodel')], results: [] }).title).toBe('Importing 1 project');
    });

    it('is plural for two projects', () => {
        expect(dropImportView({ files: [file('a.jjodel'), file('b.jjodel')], results: [] }).title).toBe('Importing 2 projects');
    });

    it('counts projects, not skipped files', () => {
        expect(dropImportView({ files: [file('a.jjodel'), file('b.pdf')], results: [] }).title).toBe('Importing 1 project');
    });

    it('has its own title when nothing can be imported', () => {
        expect(dropImportView({ files: [file('b.pdf')], results: [] }).title).toBe('No projects to import');
    });

    it('is settled only when every file has a result', () => {
        const files = [file('a.jjodel'), file('b.jjodel')];
        expect(dropImportView({ files, results: [imported('a.jjodel')] }).settled).toBe(false);
        expect(dropImportView({ files, results: [imported('a.jjodel'), imported('b.jjodel')] }).settled).toBe(true);
    });
});

describe('dropImportView toasts', () => {
    it('gives a success toast the project id and a duration long enough to be clicked', () => {
        expect(settledView([imported('a.jjodel', 'p1')]).toasts).toEqual([{
            priority: 'success',
            title: 'Project imported',
            message: '"a.jjodel" has been imported.',
            duration: OPEN_PROJECT_TOAST_MS,
            projectId: 'p1',
        }]);
        expect(OPEN_PROJECT_TOAST_MS).toBeGreaterThan(3000);
    });

    it('gives a failed file an error toast naming it, with no project', () => {
        expect(settledView([failed('a.jjodel')]).toasts).toEqual([{
            priority: 'error',
            title: 'Import failed',
            message: '"a.jjodel" could not be imported. Please check the file format.',
        }]);
    });

    it('raises one warning for the whole drop, naming how many were skipped', () => {
        expect(settledView([skipped('a.pdf'), skipped('b.pdf')]).toasts).toEqual([{
            priority: 'warning',
            title: 'Invalid file type',
            message: '2 files skipped: only .jjodel files are imported.',
        }]);
    });

    it('is singular for one skipped file', () => {
        expect(settledView([skipped('a.pdf')]).toasts[0].message).toBe('1 file skipped: only .jjodel files are imported.');
    });

    it('stays per file at the threshold, in drop order', () => {
        const results = [imported('a.jjodel'), failed('b.jjodel'), imported('c.jjodel')];
        expect(results).toHaveLength(MAX_PER_FILE_TOASTS);
        expect(settledView(results).toasts.map(t => t.message.split('"')[1])).toEqual(['a.jjodel', 'b.jjodel', 'c.jjodel']);
    });

    it('does not count skipped files towards the threshold', () => {
        expect(titles([imported('a.jjodel'), imported('b.jjodel'), imported('c.jjodel'), skipped('d.pdf')])).toEqual([
            'success:Project imported', 'success:Project imported', 'success:Project imported', 'warning:Invalid file type',
        ]);
    });

    it('summarises above the threshold, one toast per outcome and no project to open', () => {
        const toasts = settledView([imported('a.jjodel'), imported('b.jjodel'), imported('c.jjodel'), failed('d.jjodel'), failed('e.jjodel'), skipped('f.pdf')]).toasts;
        expect(toasts).toEqual([
            { priority: 'success', title: 'Projects imported', message: '3 projects imported.' },
            { priority: 'error', title: 'Import failed', message: '2 files could not be imported. Please check the file format.' },
            { priority: 'warning', title: 'Invalid file type', message: '1 file skipped: only .jjodel files are imported.' },
        ]);
    });

    it('omits the summary of an outcome that did not happen', () => {
        const fourImported = ['a', 'b', 'c', 'd'].map(n => imported(`${n}.jjodel`));
        const fourFailed = ['a', 'b', 'c', 'd'].map(n => failed(`${n}.jjodel`));
        expect(titles(fourImported)).toEqual(['success:Projects imported']);
        expect(titles(fourFailed)).toEqual(['error:Import failed']);
    });

    it('never raises five toasts for one drop, so nothing older is pushed out by it alone', () => {
        const three = [imported('a.jjodel'), imported('b.jjodel'), imported('c.jjodel'), skipped('d.pdf')];
        expect(settledView(three).toasts.length).toBeLessThan(5);
    });
});
