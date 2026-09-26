/** The part of a Navigation API `navigate` event that hashReload reads. */
export interface ReloadNavigateEvent {
    navigationType: string;
    signal: { addEventListener(type: 'abort', listener: () => void): void };
}

/** The part of `window` that R.navigate's reload needs; `navigation` is absent where the Navigation API is. */
export interface ReloadWindow {
    location: { href: string; hash: string; reload(): void; replace(url: string): void };
    navigation?: {
        addEventListener(type: 'navigate', listener: (e: ReloadNavigateEvent) => void): void;
        removeEventListener(type: 'navigate', listener: (e: ReloadNavigateEvent) => void): void;
    };
}

/**
 * Sets the hash and reloads, as R.navigate always did. "Stay on page" at the unsaved-changes prompt cancels the
 * reload and nothing unloads: then the page gets back the URL it still shows, and actions go through again.
 * Returns false in that case (P-2026-09-25-1905).
 *
 * Why the signal is trusted: the prompt blocks inside `reload()`, and Chromium aborts the reload's own `navigate`
 * event before `reload()` returns when the user stays, and never when the user leaves (measured,
 * discovery_2026-09-25_navigate_cancel.md §2.4). Both the restore and the reset run in this same task, before React
 * renders the target route. Without that signal (no Navigation API, or a browser that fires no event on a cancelled
 * reload) the reload is taken as proceeding, which is the behavior before this change.
 */
export function hashReload(win: ReloadWindow, hash: string, setNavigating: (v: boolean) => void): boolean {
    const shown = win.location.href;
    let cancelled = false;
    // Only the reload's own event: setting the hash starts a `push` navigation that the reload always aborts.
    const onNavigate = (e: ReloadNavigateEvent) => {
        if (e.navigationType === 'reload') e.signal.addEventListener('abort', () => { cancelled = true; });
    };
    win.navigation?.addEventListener('navigate', onNavigate);
    setNavigating(true);
    try {
        win.location.hash = hash;
        win.location.reload();
    } finally {
        win.navigation?.removeEventListener('navigate', onNavigate);
    }
    if (!cancelled) return true;
    win.location.replace(shown);
    setNavigating(false);
    return false;
}
