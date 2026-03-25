/**
 * Composition compatibility utilities for M1 editor.
 *
 * Reused by:
 * - onDrop handler (validate drop-on-node)
 * - onDragOver handler (cursor feedback)
 * - Context menu (group children by reference name)
 */

import type { MetaclassInfo, MetaclassReference } from '../hooks/useEditorMode';

/**
 * Result of a compatibility check: which containment references
 * on the parent class can accept the dropped class.
 */
export interface CompatibleRef {
    /** The containment reference on the parent metaclass */
    ref: MetaclassReference;
    /** Concrete classes that can be instantiated for this ref */
    concreteOptions: MetaclassInfo[];
}

/**
 * Check if a specific metaclass can be dropped as a composition child of a parent instance.
 * Returns the matching containment references (empty array if incompatible).
 *
 * @param parentMetaclass - MetaclassInfo of the parent instance's class
 * @param droppedClassId  - ID of the metaclass being dropped
 * @param allClasses      - All classes from modeInfo.allClasses
 */
export function getCompatibleContainmentRefs(
    parentMetaclass: MetaclassInfo,
    droppedClassId: string,
    allClasses: MetaclassInfo[],
): CompatibleRef[] {
    const classById = new Map(allClasses.map(c => [c.id, c]));
    const result: CompatibleRef[] = [];

    for (const ref of parentMetaclass.references) {
        if (!ref.containment) continue;

        const targetClass = classById.get(ref.targetClassId);
        if (!targetClass) continue;

        // Direct match: dropped class IS the target
        if (ref.targetClassId === droppedClassId) {
            const dropped = classById.get(droppedClassId);
            if (dropped && !dropped.isAbstract) {
                result.push({ ref, concreteOptions: [dropped] });
            }
            continue;
        }

        // Subclass match: dropped class is a concrete descendant of the target
        if (targetClass.concreteSubclasses.some(sub => sub.id === droppedClassId)) {
            const dropped = classById.get(droppedClassId);
            if (dropped) {
                result.push({ ref, concreteOptions: [dropped] });
            }
        }
    }

    return result;
}

/**
 * Quick boolean check: is the dropped class compatible with ANY containment on the parent?
 */
export function isDropCompatible(
    parentMetaclass: MetaclassInfo,
    droppedClassId: string,
    allClasses: MetaclassInfo[],
): boolean {
    return getCompatibleContainmentRefs(parentMetaclass, droppedClassId, allClasses).length > 0;
}

/**
 * For context menu: get all instantiable children grouped by containment reference.
 * Returns each ref with all its concrete instantiable types.
 */
/**
 * Result of a reference compatibility check for M1 edge drawing.
 */
export interface CompatibleReference {
    /** The reference on the source metaclass */
    ref: MetaclassReference;
    /** Whether this is a containment (composition) reference */
    isContainment: boolean;
}

/**
 * Find all references on sourceMetaclass that can target an instance of targetMetaclassId.
 * Includes both composition and non-composition references.
 * Used when drawing an edge between two ObjectNodes in M1 mode.
 *
 * @param sourceMetaclass  - MetaclassInfo of the source object's class
 * @param targetMetaclassId - ID of the target object's metaclass
 * @param allClasses       - All classes from modeInfo.allClasses
 */
export function getCompatibleReferences(
    sourceMetaclass: MetaclassInfo,
    targetMetaclassId: string,
    allClasses: MetaclassInfo[],
): CompatibleReference[] {
    const classById = new Map(allClasses.map(c => [c.id, c]));
    const result: CompatibleReference[] = [];

    for (const ref of sourceMetaclass.references) {
        const declaredTargetClass = classById.get(ref.targetClassId);
        if (!declaredTargetClass) continue;

        // Direct match: target metaclass IS the declared target
        const isMatch = ref.targetClassId === targetMetaclassId
            // Subclass match: target metaclass is a concrete descendant of the declared target
            || declaredTargetClass.concreteSubclasses.some(sub => sub.id === targetMetaclassId);

        if (isMatch) {
            result.push({
                ref,
                isContainment: ref.containment,
            });
        }
    }

    return result;
}

export function getCompositionChildOptions(
    parentMetaclass: MetaclassInfo,
    allClasses: MetaclassInfo[],
): CompatibleRef[] {
    const classById = new Map(allClasses.map(c => [c.id, c]));
    const result: CompatibleRef[] = [];

    for (const ref of parentMetaclass.references) {
        if (!ref.containment && !ref.aggregation) continue;

        const targetClass = classById.get(ref.targetClassId);
        if (!targetClass) continue;

        const concreteOptions: MetaclassInfo[] = [];

        // If target itself is concrete, include it
        if (!targetClass.isAbstract) {
            concreteOptions.push(targetClass);
        }

        // Add all concrete subclasses
        for (const sub of targetClass.concreteSubclasses) {
            concreteOptions.push(sub);
        }

        if (concreteOptions.length > 0) {
            result.push({ ref, concreteOptions });
        }
    }

    return result;
}
