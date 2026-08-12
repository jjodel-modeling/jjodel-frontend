export type DocumentTypeKind = 'metamodel' | 'model' | 'transformation' | 'viewpoint' | 'refactoring';

export interface DocumentTypeEntry {
    type: DocumentTypeKind;
    label: string;
    description: string;
    badge: string;
    badgeBg: string;
    badgeColor: string;
    available: boolean;
    comingSoon?: boolean;
}

export const DOCUMENT_TYPES: readonly DocumentTypeEntry[] = [
    {
        // Lavender from .appbar-tab__badge--metamodel (navbar.scss:1779-1787).
        type: 'metamodel',
        label: 'Metamodel',
        description: 'Classes, attributes, references',
        badge: 'M',
        badgeBg: 'var(--color-entity-metamodel-bg)',
        badgeColor: 'var(--color-entity-metamodel-fg)',
        available: true,
    },
    {
        type: 'model',
        label: 'Model',
        description: 'Instances of a metamodel',
        badge: 'm',
        badgeBg: 'var(--color-entity-model-bg)',
        badgeColor: 'var(--color-entity-model-fg)',
        available: true,
    },
    {
        type: 'transformation',
        label: 'Transformation',
        description: 'JjTL model-to-model rules',
        badge: 'T',
        badgeBg: 'var(--color-entity-transformation-bg)',
        badgeColor: 'var(--color-entity-transformation-fg)',
        available: true,
    },
    {
        // TODO: wire onCreate when a standalone viewpoint creation path is exposed.
        // DockManager.openViewpoint(vp) opens an EXISTING viewpoint — it does not create one.
        // Creation today goes through <NewViewpointDialog>, whose open state lives in ProjectEditor
        // (showNewViewpointDialog). To wire this entry, add a JjodelEvents.OPEN_NEW_VIEWPOINT_DIALOG
        // event + listener in ProjectEditor, mirroring OPEN_NEW_TRANSFORMATION_DIALOG.
        // Out of scope for the current change (registry.ts + ProjectEditor.tsx not in scope).
        type: 'viewpoint',
        label: 'Viewpoint',
        description: 'Visual representation rules',
        badge: 'V',
        badgeBg: 'var(--color-entity-viewpoint-bg)',
        badgeColor: 'var(--color-entity-viewpoint-fg)',
        available: false,
    },
    {
        type: 'refactoring',
        label: 'Refactoring',
        description: 'Model refactoring rules',
        badge: 'R',
        badgeBg: 'var(--color-entity-refactoring-bg)',
        badgeColor: 'var(--color-entity-refactoring-fg)',
        available: false,
        comingSoon: true,
    },
];
