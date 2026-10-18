/**
 * Gallery references (R-LIB-9, P-2026-10-18-2300): `<id>@<n>` names one published version of a gallery entry, `<id>`
 * its current version. The deep link `#/templates/<ref>` and the `_clonedFrom` of a clone carry it.
 *
 * Pure, with no app import, so the gallery test executes it in node.
 */

/** One published version of a gallery entry (docs/library/catalog.json, version 2). */
export interface GalleryVersion {
    n: number;
    file: string;
    published: string;
    sha256: string;
    notes?: string;
}

/** What a reference needs of a catalog entry. */
export interface VersionedEntry {
    id: string;
    version?: number;
    versions?: GalleryVersion[];
}

/** An id is lower-case words joined by single hyphens; a version is a positive integer with no leading zero. */
const REF = /^([a-z0-9]+(?:-[a-z0-9]+)*)(?:@([1-9][0-9]*))?$/;

/** `<id>@<n>` or `<id>`, split; null when the text is neither. */
export function parseGalleryRef(ref: string): { id: string; n?: number } | null {
    const m = REF.exec(ref);
    if (!m) return null;
    return m[2] === undefined ? {id: m[1]} : {id: m[1], n: Number(m[2])};
}

export const galleryRefOf = (id: string, n: number): string => `${id}@${n}`;

/** The entry and the version a reference names, `<id>` naming the current one; null for an unknown id or version. */
export function resolveGalleryRef<E extends VersionedEntry>(entries: E[], ref: string): { entry: E; version: GalleryVersion } | null {
    const parsed = parseGalleryRef(ref);
    if (!parsed) return null;
    const entry = entries.find(e => e.id === parsed.id);
    if (!entry) return null;
    const n = parsed.n ?? entry.version;
    const version = (entry.versions || []).find(v => v.n === n);
    return version ? {entry, version} : null;
}

/** The current version of an entry: the one its `version` names. */
export const currentVersion = (entry: VersionedEntry): GalleryVersion | undefined =>
    (entry.versions || []).find(v => v.n === entry.version);
