/* The progress panel of a dashboard drop, the mapping from its results to rows and toasts (P-2026-11-08-2145).
 * It imports nothing from the joiner, so the mapping loads in node: the importer is injected. */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { importJjodelFile, isJjodelFile } from '../../api/persistance/jjodelImport';
import type { JjodelImporter, JjodelImportResult } from '../../api/persistance/jjodelImport';
import type { ToastPriority } from '../../components/Toast/toastTypes';
import './DropImportPanel.scss';

export type DropImportRowState = 'pending' | 'importing' | 'imported' | 'failed' | 'skipped';

export interface DropImportRow {
    name: string;
    state: DropImportRowState;
}

export interface DropImportToast {
    priority: ToastPriority;
    title: string;
    message: string;
    duration?: number;
    /** The project "Open project" reaches; absent on a toast that speaks of more than one. */
    projectId?: string;
}

export interface DropImportBatch {
    /** In drop order. */
    files: File[];
    /** The settled prefix of `files`: the imports run one at a time, in order. */
    results: JjodelImportResult[];
}

export interface DropImportView {
    title: string;
    rows: DropImportRow[];
    settled: boolean;
    toasts: DropImportToast[];
}

/** Beyond this many outcomes, one toast per outcome kind: with the skipped warning a drop raises at most four, under the cap of 5. */
export const MAX_PER_FILE_TOASTS = 3;
/** A success toast carries "Open project": the 3 s default is too short to reach it. */
export const OPEN_PROJECT_TOAST_MS = 10000;
const CLOSE_AFTER_SETTLED_MS = 5000;

const counted = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

function dropImportTitle(files: File[]): string {
    const accepted = files.filter(isJjodelFile).length;
    return accepted === 0 ? 'No projects to import' : `Importing ${counted(accepted, 'project')}`;
}

function dropImportRows({ files, results }: DropImportBatch): DropImportRow[] {
    let importingShown = false;
    return files.map((file, index) => {
        const name = file.name;
        if (!isJjodelFile(file)) return { name, state: 'skipped' };
        const result = results[index];
        if (result) return { name, state: result.ok ? 'imported' : 'failed' };
        if (importingShown) return { name, state: 'pending' };
        importingShown = true;
        return { name, state: 'importing' };
    });
}

function fileToast(result: JjodelImportResult): DropImportToast {
    const name = result.file.name;
    if (result.ok) return {
        priority: 'success',
        title: 'Project imported',
        message: `"${name}" has been imported.`,
        duration: OPEN_PROJECT_TOAST_MS,
        projectId: result.projectId,
    };
    return { priority: 'error', title: 'Import failed', message: `"${name}" could not be imported. Please check the file format.` };
}

function dropImportToasts(results: JjodelImportResult[]): DropImportToast[] {
    const outcomes = results.filter(result => result.ok || result.reason === 'failed');
    const skipped = results.length - outcomes.length;
    const imported = outcomes.filter(result => result.ok).length;
    const failed = outcomes.length - imported;

    const toasts: DropImportToast[] = [];
    if (outcomes.length <= MAX_PER_FILE_TOASTS) {
        toasts.push(...outcomes.map(fileToast));
    } else {
        if (imported > 0) toasts.push({ priority: 'success', title: 'Projects imported', message: `${counted(imported, 'project')} imported.` });
        if (failed > 0) toasts.push({ priority: 'error', title: 'Import failed', message: `${counted(failed, 'file')} could not be imported. Please check the file format.` });
    }
    if (skipped > 0) toasts.push({ priority: 'warning', title: 'Invalid file type', message: `${counted(skipped, 'file')} skipped: only .jjodel files are imported.` });
    return toasts;
}

export function dropImportView(batch: DropImportBatch): DropImportView {
    return {
        title: dropImportTitle(batch.files),
        rows: dropImportRows(batch),
        settled: batch.results.length === batch.files.length,
        toasts: dropImportToasts(batch.results),
    };
}

export function useDropImport(importer: JjodelImporter, onSettled: (toasts: DropImportToast[]) => void) {
    const [batch, setBatch] = useState<DropImportBatch | null>(null);
    const running = useRef<DropImportBatch | null>(null);
    const view = batch && dropImportView(batch);

    useEffect(() => {
        if (!view?.settled) return;
        const timer = setTimeout(() => setBatch(null), CLOSE_AFTER_SETTLED_MS);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [batch]);

    const publish = (current: DropImportBatch) => setBatch({ files: [...current.files], results: [...current.results] });

    const importFiles = async (dropped: FileList | File[]) => {
        // Taken before the first await: a drop's FileList is emptied when its event ends.
        const files = Array.from(dropped);
        if (files.length === 0) return;
        if (running.current) {
            running.current.files.push(...files);
            publish(running.current);
            return;
        }
        const current: DropImportBatch = { files, results: [] };
        running.current = current;
        publish(current);
        // The length is read at every turn: a drop during the import extends this batch, so the imports stay one at a time.
        for (let index = 0; index < current.files.length; index++) {
            current.results.push(await importJjodelFile(current.files[index], importer));
            publish(current);
        }
        running.current = null;
        onSettled(dropImportView(current).toasts);
    };

    return { view, importFiles, close: () => setBatch(null) };
}

const ROW_ICON: Record<DropImportRowState, string> = {
    pending: 'bi-clock',
    importing: 'bi-arrow-repeat',
    imported: 'bi-check-circle-fill',
    failed: 'bi-x-circle-fill',
    skipped: 'bi-dash-circle',
};

const ROW_LABEL: Record<DropImportRowState, string> = {
    pending: 'Pending',
    importing: 'Importing',
    imported: 'Imported',
    failed: 'Failed',
    skipped: 'Skipped',
};

export interface DropImportPanelProps {
    view: DropImportView;
    onClose: () => void;
}

export const DropImportPanel: React.FC<DropImportPanelProps> = ({ view, onClose }) => createPortal(
    <section className="drop-import-panel" aria-label="Import progress">
        <div className="drop-import-panel__header">
            <span className="drop-import-panel__title">{view.title}</span>
            {view.settled && (
                <button type="button" className="drop-import-panel__close" onClick={onClose} aria-label="Close">
                    <i className="bi bi-x" aria-hidden="true" />
                </button>
            )}
        </div>
        <ul className="drop-import-panel__rows">
            {view.rows.map((row, index) => (
                <li key={index} className={`drop-import-panel__row drop-import-panel__row--${row.state}`}>
                    <i className={`drop-import-panel__icon bi ${ROW_ICON[row.state]}`} aria-hidden="true" />
                    <span className="drop-import-panel__name" title={row.name}>{row.name}</span>
                    <span className="drop-import-panel__state">{ROW_LABEL[row.state]}</span>
                </li>
            ))}
        </ul>
    </section>,
    document.body,
);

export default DropImportPanel;
