/**
 * entityMeta.ts — Single source of truth for entity type icons and colors.
 *
 * Colors come from docs/DESIGN-SYSTEM.md §2.2 (artifact types) and
 * tree-view-sidebar.scss (sub-entity types: class, attribute, etc.).
 *
 * Icons are Bootstrap Icons (bi-*).
 */

// SYNC: i valori bg/text di questo file sono replicati come CSS variables
// in frontend/src/styles/tokens/_colors-light.scss e _colors-dark.scss
// (token --color-entity-<type>-{bg,fg}). Mantenere in sync.

// ─── Entity type union ──────────────────────────────────────────────────────

export type EntityType =
    | 'metamodel'
    | 'model'
    | 'package'
    | 'class'
    | 'abstractClass'
    | 'enum'
    | 'enumLiteral'
    | 'attribute'
    | 'reference'
    | 'operation'
    | 'parameter'
    | 'object'
    | 'transformation'
    | 'viewpoint'
    | 'dataType';

// ─── Entity metadata ────────────────────────────────────────────────────────

export interface EntityMeta {
    /** Bootstrap Icon name WITHOUT 'bi-' prefix */
    icon: string;
    /** Icon / text color (hex). Matches tree-view-sidebar $color-* variables. */
    color: string;
    /** Badge background (light mode) */
    badgeBg: string;
    /** Badge text color (light mode) */
    badgeText: string;
    /** Badge background (dark mode) */
    badgeBgDark: string;
    /** Badge text color (dark mode) */
    badgeTextDark: string;
    /** Single-letter label for badges */
    letter: string;
    /** If true, icon should render with reduced opacity */
    abstract?: boolean;
}

/**
 * Canonical entity metadata.
 *
 * Top-level artifacts (metamodel, model, transformation) use DESIGN-SYSTEM.md §2.2.
 * Sub-entity types (class, attribute, etc.) use tree-view-sidebar.scss colors.
 */
export const ENTITY_META: Record<EntityType, EntityMeta> = {
    // ── Artifact types (DESIGN-SYSTEM.md §2.2) ──────────────────────────────

    metamodel: {
        icon: 'boxes',
        color: '#534AB7',              // Violet — $color-model in tree-view-sidebar
        badgeBg: '#EEEDFE',
        badgeText: '#534AB7',
        badgeBgDark: 'rgba(127, 119, 221, 0.2)',
        badgeTextDark: '#AFA9EC',
        letter: 'M',
    },
    model: {
        icon: 'box',
        color: '#f59e0b',              // Amber — DESIGN-SYSTEM Strong
        badgeBg: '#FAEEDA',
        badgeText: '#854F0B',
        badgeBgDark: 'rgba(186, 117, 23, 0.2)',
        badgeTextDark: '#FAC775',
        letter: 'm',
    },
    transformation: {
        icon: 'arrow-left-right',
        color: '#10b981',              // Teal/Emerald — DESIGN-SYSTEM Strong
        badgeBg: '#E1F5EE',
        badgeText: '#0F6E56',
        badgeBgDark: 'rgba(29, 158, 117, 0.2)',
        badgeTextDark: '#5DCAA5',
        letter: 'T',
    },
    viewpoint: {
        icon: 'eye',
        color: '#DB2777',              // Pink — element-badge existing
        badgeBg: '#FCE7F3',
        badgeText: '#DB2777',
        badgeBgDark: 'rgba(219, 39, 119, 0.15)',
        badgeTextDark: '#F9A8D4',
        letter: 'V',
    },

    // ── Sub-entity types (tree-view-sidebar.scss $color-* vars) ──────────────

    package: {
        icon: 'folder',
        color: '#f59e0b',              // $color-package — Amber
        badgeBg: '#DBEAFE',
        badgeText: '#2563EB',
        badgeBgDark: 'rgba(59, 130, 246, 0.15)',
        badgeTextDark: '#60A5FA',
        letter: 'P',
    },
    class: {
        icon: 'diagram-3',
        color: '#0ea5e9',              // $color-class — Cyan
        badgeBg: '#FEE2E2',
        badgeText: '#DC2626',
        badgeBgDark: 'rgba(239, 68, 68, 0.15)',
        badgeTextDark: '#F87171',
        letter: 'C',
    },
    abstractClass: {
        icon: 'diagram-3',
        color: '#0ea5e9',              // Same as class
        badgeBg: '#FEE2E2',
        badgeText: '#DC2626',
        badgeBgDark: 'rgba(239, 68, 68, 0.15)',
        badgeTextDark: '#F87171',
        letter: 'C',
        abstract: true,
    },
    enum: {
        icon: 'list-ol',
        color: '#ec4899',              // $color-enum — Pink
        badgeBg: '#FEF3C7',
        badgeText: '#D97706',
        badgeBgDark: 'rgba(245, 158, 11, 0.15)',
        badgeTextDark: '#FBBF24',
        letter: 'E',
    },
    enumLiteral: {
        icon: 'hash',
        color: '#f472b6',              // $color-literal — Light Pink
        badgeBg: '#F3F4F6',
        badgeText: '#6B7280',
        badgeBgDark: 'rgba(107, 114, 128, 0.15)',
        badgeTextDark: '#9CA3AF',
        letter: 'L',
    },
    attribute: {
        icon: 'card-text',
        color: '#10b981',              // $color-attribute — Green
        badgeBg: '#D1FAE5',
        badgeText: '#059669',
        badgeBgDark: 'rgba(16, 185, 129, 0.15)',
        badgeTextDark: '#34D399',
        letter: 'A',
    },
    reference: {
        icon: 'link-45deg',
        color: '#8b5cf6',              // $color-reference — Purple
        badgeBg: '#CFFAFE',
        badgeText: '#0891B2',
        badgeBgDark: 'rgba(6, 182, 212, 0.15)',
        badgeTextDark: '#22D3EE',
        letter: 'R',
    },
    operation: {
        icon: 'gear',
        color: '#06b6d4',              // $color-operation — Cyan (darker)
        badgeBg: '#E0E7FF',
        badgeText: '#4F46E5',
        badgeBgDark: 'rgba(99, 102, 241, 0.15)',
        badgeTextDark: '#818CF8',
        letter: 'O',
    },
    parameter: {
        icon: 'three-dots',
        color: '#9ca3af',              // $color-parameter — Gray (light)
        badgeBg: '#F1F5F9',
        badgeText: '#475569',
        badgeBgDark: 'rgba(71, 85, 105, 0.15)',
        badgeTextDark: '#94A3B8',
        letter: 'P',
    },
    object: {
        icon: 'app-fill',
        color: '#6b7280',              // $color-object — Gray
        badgeBg: '#CCFBF1',
        badgeText: '#0D9488',
        badgeBgDark: 'rgba(20, 184, 166, 0.15)',
        badgeTextDark: '#2DD4BF',
        letter: 'O',
    },
    dataType: {
        icon: 'file-earmark-code',
        color: '#0ea5e9',              // Same as class
        badgeBg: '#F1F5F9',
        badgeText: '#475569',
        badgeBgDark: 'rgba(71, 85, 105, 0.15)',
        badgeTextDark: '#94A3B8',
        letter: 'D',
    },
};

// ─── Alias map: raw codebase strings → canonical EntityType ──────────────────

const TYPE_ALIASES: Record<string, EntityType> = {
    // D-prefix class names (from data layer)
    'DModel': 'metamodel',
    'DPackage': 'package',
    'DClass': 'class',
    'DEnum': 'enum',
    'DEnumerator': 'enum',
    'DEnumLiteral': 'enumLiteral',
    'DAttribute': 'attribute',
    'DReference': 'reference',
    'DOperation': 'operation',
    'DParameter': 'parameter',
    'DObject': 'object',
    // ElementBadge normalized strings
    'concept': 'class',
    'enumerator': 'enum',
    'literal': 'enumLiteral',
    'epsilon': 'transformation',
    // Palette action types
    'createClass': 'class',
    'createEnum': 'enum',
    'createDataType': 'dataType',
    'createPackage': 'package',
    'addAttribute': 'attribute',
    'addOperation': 'operation',
    'addLiteral': 'enumLiteral',
};

/**
 * Resolve a raw type string to a canonical EntityType.
 * Handles D-prefixed class names, ElementBadge strings, and palette action types.
 */
export function resolveEntityType(raw: string): EntityType | undefined {
    // Direct match
    if (raw in ENTITY_META) return raw as EntityType;
    // Alias match
    if (raw in TYPE_ALIASES) return TYPE_ALIASES[raw];
    // Try lowercase
    const lower = raw.toLowerCase();
    if (lower in ENTITY_META) return lower as EntityType;
    if (lower in TYPE_ALIASES) return TYPE_ALIASES[lower];
    return undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the full Bootstrap Icon class (e.g. 'bi-diagram-3') */
export function entityIcon(type: EntityType): string {
    return `bi-${ENTITY_META[type].icon}`;
}

/** Returns the icon/text color */
export function entityColor(type: EntityType): string {
    return ENTITY_META[type].color;
}

/** Returns the single-letter badge label */
export function entityLetter(type: EntityType): string {
    return ENTITY_META[type].letter;
}

/** Returns true if the entity should render with reduced opacity (abstract) */
export function entityIsAbstract(type: EntityType): boolean {
    return !!ENTITY_META[type].abstract;
}
