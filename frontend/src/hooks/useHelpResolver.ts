/**
 * Maps helpKey identifiers to their corresponding Markdown doc paths.
 * Used by HelpDrawer to resolve which document to fetch/import.
 */

import { useMemo } from 'react';

const DOCS_BASE = 'https://raw.githubusercontent.com/jjodel-modeling/jjodel-docs/main';
const WEB_BASE = 'https://github.com/jjodel-modeling/jjodel-docs/blob/main';

const HELP_MAP: Record<string, string> = {
    // Panels
    'properties-panel':      'panels/properties.md',
    'transformation-panel':  'panels/transformation.md',
    'canvas-metamodel':      'panels/canvas-metamodel.md',
    'canvas-model':          'panels/canvas-model.md',
    'palette':               'panels/palette.md',
    'jjel-editor':           'reference/jjel/overview.md',
    'jjtl-editor':           'reference/jjtl/overview.md',
    // M2 elements
    'element-class':         'concepts/classes-attributes.md',
    'element-attribute':     'concepts/classes-attributes.md',
    'element-reference':     'concepts/references.md',
    'element-enum':          'concepts/enumerations.md',
    'element-operation':     'concepts/classes-attributes.md',
    'element-package':       'panels/properties.md',
    // M1 elements
    'element-object':        'panels/canvas-model.md',
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
