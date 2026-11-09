/* The import of `.jjodel` files, shared by the dashboard drop, the modal drop and the picker (P-2026-11-08-2015).
 * It imports nothing from the joiner, so it loads in node: the importer is injected. */

const JJODEL_EXTENSION = /\.jjodel$/i;

/** Resolves with the id of the project it stored, rejects when no project was stored. */
export type JjodelImporter = (content: string) => Promise<string>;

export type JjodelImportResult =
    | { file: File; ok: true; projectId: string }
    | { file: File; ok: false; reason: 'extension' | 'failed' };

export function isJjodelFile(file: File): boolean {
    return JJODEL_EXTENSION.test(file.name);
}

export function partitionJjodelFiles(files: FileList | File[]): { accepted: File[]; rejected: File[] } {
    const accepted: File[] = [];
    const rejected: File[] = [];
    for (const file of Array.from(files)) (isJjodelFile(file) ? accepted : rejected).push(file);
    return { accepted, rejected };
}

export async function importJjodelFile(file: File, importer: JjodelImporter): Promise<JjodelImportResult> {
    if (!isJjodelFile(file)) return { file, ok: false, reason: 'extension' };
    try {
        return { file, ok: true, projectId: await importer(await file.text()) };
    } catch (e) {
        return { file, ok: false, reason: 'failed' };
    }
}

/** One file at a time: every import is a TRANSACTION on the same flat action queue. */
export async function importJjodelFiles(files: FileList | File[], importer: JjodelImporter): Promise<JjodelImportResult[]> {
    // Taken before the first await: a drop's FileList is emptied when its event ends.
    const list = Array.from(files);
    const results: JjodelImportResult[] = [];
    for (const file of list) results.push(await importJjodelFile(file, importer));
    return results;
}

/** The id stored by an import's transaction. TRANSACTION's boolean cannot say: it is false on success at depth above 0. */
export function requireStoredProject(id: string | undefined, projects: string[]): string {
    if (id === undefined || !projects.includes(id)) throw new Error('The project was not stored.');
    return id;
}
