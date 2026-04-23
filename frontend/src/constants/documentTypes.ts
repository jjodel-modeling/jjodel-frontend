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
        badgeBg: '#E9D5FF',
        badgeColor: '#7C3AED',
        available: true,
    },
    {
        type: 'model',
        label: 'Model',
        description: 'Instances of a metamodel',
        badge: 'm',
        badgeBg: '#e2e8f0',
        badgeColor: '#475569',
        available: true,
    },
    {
        type: 'transformation',
        label: 'Transformation',
        description: 'JjTL model-to-model rules',
        badge: 'T',
        badgeBg: '#e0f2fe',
        badgeColor: '#0369a1',
        available: true,
    },
    {
        // Pink from common/entityMeta.ts viewpoint entry (badgeBg: #FCE7F3, badgeText: #DB2777).
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
        badgeBg: '#FCE7F3',
        badgeColor: '#DB2777',
        available: false,
    },
    {
        type: 'refactoring',
        label: 'Refactoring',
        description: 'Model refactoring rules',
        badge: 'R',
        badgeBg: '#f1f5f9',
        badgeColor: '#94a3b8',
        available: false,
        comingSoon: true,
    },
];
