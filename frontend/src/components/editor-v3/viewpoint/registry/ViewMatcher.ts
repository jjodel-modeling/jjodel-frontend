/**
 * Editor V3 — ViewMatcher: resolves the best DViewElement for a given model element.
 *
 * Priority:
 * 1. vertex.view (if already assigned)
 * 2. Matching by appliableToClasses
 * 3. Matching by appliableTo (generic type)
 * 4. Filter by jsCondition
 * 5. Sort by explicitApplicationPriority
 */

import { LPointerTargetable } from '../../../../joiner';
import type { EditorMode } from '../../types';

/**
 * Resolve the viewId for a model element + vertex pair.
 *
 * Returns null if no custom view applies (fall through to built-in).
 */
export function resolveViewForElement(
    element: any,          // LModelElement or LObject
    vertex: any,           // LVertex (optional)
    viewpointId: string | null,
    mode: EditorMode,
): string | null {
    // 1. View already assigned to vertex
    if (vertex?.view) return vertex.view;

    // 2. No active viewpoint → use built-in
    if (!viewpointId) return null;

    // 3. Load viewpoint and filter applicable views
    let viewpoint: any;
    try {
        viewpoint = LPointerTargetable.fromPointer(viewpointId);
    } catch {
        return null;
    }

    const views: any[] = viewpoint?.views || [];
    if (views.length === 0) return null;

    const applicable = views.filter((view: any) => {
        // Check appliableToClasses
        if (view.appliableToClasses?.length > 0) {
            const className = element?.instanceof?.name || element?.name;
            if (!className || !view.appliableToClasses.includes(className)) return false;
        }

        // Check appliableTo (generic type: 'Class', 'Enum', 'Object', 'Any')
        if (view.appliableTo && view.appliableTo !== 'Any') {
            const elementGraphType = getGraphType(element);
            if (view.appliableTo !== elementGraphType) return false;
        }

        // Check jsCondition
        if (view.jsCondition) {
            try {
                const fn = new Function('data', `return (${view.jsCondition})`);
                if (!fn(element)) return false;
            } catch {
                return false;
            }
        }

        return true;
    });

    if (applicable.length === 0) return null;

    // 4. Sort by priority (higher first) and return the best match
    applicable.sort((a: any, b: any) =>
        (b.explicitApplicationPriority ?? 0) - (a.explicitApplicationPriority ?? 0)
    );

    return applicable[0]?.id ?? null;
}

/**
 * Determine the graph type string for a model element.
 * Maps DClass → 'Class', DEnumerator → 'Enum', DObject → 'Object', etc.
 */
function getGraphType(element: any): string {
    if (!element) return 'Unknown';

    const className = element?.className ?? element?.__raw?.className ?? '';

    if (className.includes('DClass') || className === 'DClass') return 'Class';
    if (className.includes('DEnum') || className === 'DEnumerator') return 'Enum';
    if (className.includes('DObject') || className === 'DObject') return 'Object';
    if (className.includes('DPackage') || className === 'DPackage') return 'Package';
    if (className.includes('DDataType') || className === 'DDataType') return 'DataType';

    return 'Unknown';
}
