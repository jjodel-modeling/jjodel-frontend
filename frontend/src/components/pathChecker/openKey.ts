/**
 * What starts a new open of the store (P-2026-09-25-1440): PathChecker resets the store when this key changes.
 *
 * A change of page changes it, and on `/project` so does a change of project id: back/forward between two
 * projects, or an edited hash, change only the id. No other search param changes it: `filter` on
 * `/allProjects` is changed in place, without a remount (LeftBar.tsx), and `repair` is read inside an open
 * (VersionFixer.tsx).
 */
export function openKey(pathname: string, search: string): string {
    if (pathname !== '/project') return pathname;
    return pathname + '?id=' + (new URLSearchParams(search).get('id') ?? '');
}
