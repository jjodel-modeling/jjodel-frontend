import type { LabelSpec, TextSource } from './irTypes';

/**
 * Which labels rename the element on the canvas (spec v1.2 sez. 5). One predicate for the compile
 * (`CompiledLabel.editsName`) and the label editor's Editable toggle, so the panel and the canvas
 * cannot disagree. Pure, types only: it loads in the node bench.
 */

/** The sources that can edit the name: the intrinsic `name` and `qualifiedName`. A literal, a
 *  path and the intrinsic `metaclassName` have no name to write back to. */
export function labelCanRename(source: TextSource): boolean {
    return source.from === 'intrinsic' && (source.prop === 'name' || source.prop === 'qualifiedName');
}

/** True when double-click edits the element name: a source that can rename, unless the IR opts out
 *  with `editable: false`. Absent, `true` and the widget object all rename (absent is the default). */
export function labelEditsName(label: Pick<LabelSpec, 'source' | 'editable'>): boolean {
    return labelCanRename(label.source) && label.editable !== false;
}
