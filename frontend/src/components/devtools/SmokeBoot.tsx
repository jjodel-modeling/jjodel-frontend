/**
 * SmokeBoot — the dev-only door to the visual smoke fixtures.
 *
 * Mounted once, inside the router, next to `PathChecker`. Reads `smoke` from
 * the hash query (`U.getHashParam`, the same reader the project id goes
 * through) and runs the matching fixture.
 *
 * ── Why the hash and not `?smoke=` before it ───────────────────────────────
 *
 * The app is on a `HashRouter`, and every parameter it already reads —
 * `U.getProjectID_URL()` is `getHashParam('id')` — lives after the `#`. A
 * param before the hash would be the only one in the app that does not, and
 * would survive navigation the others do not.
 *
 * ── Why it does not navigate ───────────────────────────────────────────────
 *
 * `PathChecker` calls `U.resetState()` on every pathname change after the
 * first, which wipes Redux and re-runs the state initializer. A fixture that
 * built a project and THEN navigated to it would be destroyed on arrival. So
 * the URL lands directly on `/project` with the project's fixed id already in
 * it, the fixture builds into that id, and no navigation ever happens.
 *
 * ── Why nothing here reaches production ────────────────────────────────────
 *
 * `IS_DEV` is `import.meta.env.DEV`, which Vite replaces with a literal at
 * build time; the whole body, the dynamic `import()` included, is statically
 * unreachable in a production build and is dropped. The fixture is therefore
 * not merely unloaded in production — it is not emitted. Verified by grepping
 * the built bundle for `AllNine`.
 */

import { useEffect } from 'react';
import { U } from '../../joiner';

const IS_DEV: boolean = (import.meta as any).env?.DEV ?? false;

function SmokeBoot() {
    useEffect(() => {
        if (!IS_DEV) return;
        const which = U.getHashParam('smoke');
        if (which !== 'rowviews') return;

        let cancelled = false;
        // Deferred to a macrotask: the state initializer runs on the same boot
        // and the fixture must build on top of a settled store, not race it.
        const timer = setTimeout(() => {
            if (cancelled) return;
            import('../../examples/RowViewSmoke').then(async ({ loadRowViewSmoke }) => {
                if (cancelled) return;
                const report = await loadRowViewSmoke();
                console.log('[smoke:rowviews] fixture loaded', report);
                if (report.findings.length) {
                    for (const f of report.findings) console.warn('[smoke:rowviews] FINDING —', f);
                }
                console.log('[smoke:rowviews] singleton instances created by the persist callback:',
                    report.autoSingletons.length ? report.autoSingletons : '(none)');
            }).catch((e) => console.error('[smoke:rowviews] fixture failed', e));
        }, 0);

        return () => { cancelled = true; clearTimeout(timer); };
    }, []);

    return null;
}

export default SmokeBoot;
