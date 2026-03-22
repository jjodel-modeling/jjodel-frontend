/**
 * Maps helpKey identifiers to their corresponding Markdown doc paths.
 * Used by HelpDrawer to resolve which document to fetch/import.
 */

import { useMemo } from 'react';

const DOCS_BASE = 'https://raw.githubusercontent.com/jjodel-modeling/jjodel-docs/main';
const WEB_BASE = 'https://github.com/jjodel-modeling/jjodel-docs/blob/main';

const HELP_MAP: Record<string, string> = {
    'properties-panel': 'panels/properties.md',
    'properties-panel-advanced': 'panels/properties-advanced.md',
    'transformation-panel': 'panels/transformation.md',
    'palette': 'panels/palette.md',
    'canvas-metamodel': 'panels/canvas-metamodel.md',
    'canvas-model': 'panels/canvas-model.md',
    'jjel-editor': 'reference/jjel/overview.md',
    'jjtl-editor': 'reference/jjtl/overview.md',
};

export interface HelpResolved {
    /** Raw content URL for fetching markdown */
    url: string;
    /** Human-readable GitHub URL for "open in browser" */
    webUrl: string;
    /** Relative path within the docs repo */
    path: string;
}

export function useHelpResolver(helpKey: string | null): HelpResolved | null {
    return useMemo(() => {
        if (!helpKey) return null;
        const path = HELP_MAP[helpKey] ?? null;
        if (!path) return null;
        return {
            url: `${DOCS_BASE}/${path}`,
            webUrl: `${WEB_BASE}/${path}`,
            path,
        };
    }, [helpKey]);
}

export default useHelpResolver;
