/**
 * Editor V3 — ViewRegistry: maps (notation, elementKind) → built-in React component.
 *
 * This is the dispatch table for built-in M2 notations.
 * Custom viewpoints (Phase 6) bypass this registry entirely.
 */

import type { ComponentType } from 'react';
import type { NotationMode, ModelSnapshot } from '../../types';

/** Props passed to every built-in view component */
export interface BuiltInViewProps {
    modelElementId: string;
    label: string;
    modelSnapshot: ModelSnapshot;
    notation: NotationMode;
    colorScheme: string;
    theme: string;
    width: number;
    height: number;
    isSelected?: boolean;
    onStartEditing?: (field: string) => void;
}

type ElementKind = ModelSnapshot['kind'];

/**
 * Registry: (notation, elementKind) → component.
 * Lazily populated by registerBuiltInView() calls from notation modules.
 */
const registry = new Map<string, ComponentType<BuiltInViewProps>>();

function key(notation: NotationMode, kind: ElementKind): string {
    return `${notation}:${kind}`;
}

/** Register a built-in view for a specific notation + element kind. */
export function registerBuiltInView(
    notation: NotationMode,
    kind: ElementKind,
    component: ComponentType<BuiltInViewProps>,
): void {
    registry.set(key(notation, kind), component);
}

/** Look up the built-in view for a notation + element kind. Returns null if not found. */
export function getBuiltInView(
    notation: NotationMode,
    kind: ElementKind,
): ComponentType<BuiltInViewProps> | null {
    return registry.get(key(notation, kind)) ?? null;
}

/** Check if a viewId points to a custom (non-built-in) view. */
export function isCustomView(viewId: string | null): boolean {
    if (!viewId) return false;
    // Built-in views have no viewId (null) — any non-null viewId is custom
    return true;
}

/** Get all registered notations that have at least one view for a given kind. */
export function getAvailableNotations(kind: ElementKind): NotationMode[] {
    const notations = new Set<NotationMode>();
    for (const k of registry.keys()) {
        const [notation, registeredKind] = k.split(':');
        if (registeredKind === kind) {
            notations.add(notation as NotationMode);
        }
    }
    return Array.from(notations);
}
