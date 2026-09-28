/**
 * Canvas connection validity (R-EDGE-1, P-2026-09-27-0120).
 *
 * In a metamodel a canvas connection is valid only when both ends are class
 * nodes: class -> enumeration, enumeration -> class, enumeration ->
 * enumeration and class -> package are refused at the gesture, before the
 * edge-type popup. The rule is positive ("both ends are classes"), so any
 * other node type, unknown or missing included, is refused. It is symmetric:
 * the inheritance swap in EditorV2 decides direction by geometry, so neither
 * end is read as "the child".
 *
 * In a model the predicate is always true: the M1 branch of onConnectEnd and
 * the reconnect handlers stay the judges. The mode is the editor's
 * (useEditorMode), never inferred from the node types.
 *
 * Pure module: EditorV2.tsx does not import under vitest, so the decision
 * lives here and is executed by utils/__tests__/connectionValidity.test.ts.
 */

import type { EditorMode } from '../hooks/useEditorMode';
import type { ClassNodeType } from '../nodes/ClassNode';

// The key the node type registry (EditorV2.tsx `nodeTypes`) maps to ClassNode,
// typed by the node's own declaration: a drifted literal fails typecheck.
const CLASS_NODE_TYPE: NonNullable<ClassNodeType['type']> = 'classNode';

export function isMetamodelConnectionValid(
    mode: EditorMode,
    sourceNodeType: string | undefined,
    targetNodeType: string | undefined,
): boolean {
    if (mode === 'model') return true;
    return sourceNodeType === CLASS_NODE_TYPE && targetNodeType === CLASS_NODE_TYPE;
}
