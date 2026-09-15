/**
 * entityMeta.ts — Single source of truth for entity type icons and letters.
 *
 * Icons are Bootstrap Icons (bi-*).
 *
 * Colori: qui non ce ne sono più. Dal 2026-08-11 la scala entity ha una sorgente
 * sola, i token --color-entity-<kind>-{bg,fg} in styles/tokens/_colors-light.scss e
 * _colors-dark.scss, generata in OKLCH (R-RAIL-30). I cinque campi di colore che
 * questo file esponeva non avevano consumatori ed erano divergenti dai token.
 */

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
    /** Single-letter label for badges */
    letter: string;
    /** If true, icon should render with reduced opacity */
    abstract?: boolean;
}

/**
 * Canonical entity metadata: glifo e lettera per kind.
 */
export const ENTITY_META: Record<EntityType, EntityMeta> = {
    // ── Artifact types (DESIGN-SYSTEM.md §2.2) ──────────────────────────────

    metamodel: {
        icon: 'boxes',
        letter: 'M',
    },
    model: {
        icon: 'box',
        letter: 'm',
    },
    transformation: {
        icon: 'arrow-left-right',
        letter: 'T',
    },
    viewpoint: {
        icon: 'eye',
        letter: 'V',
    },

    // ── Sub-entity types (tree-view-sidebar.scss $color-* vars) ──────────────

    package: {
        icon: 'folder',
        letter: 'P',
    },
    class: {
        icon: 'diagram-3',
        letter: 'C',
    },
    abstractClass: {
        icon: 'diagram-3',
        letter: 'C',
        abstract: true,
    },
    enum: {
        icon: 'list-ol',
        letter: 'E',
    },
    enumLiteral: {
        icon: 'hash',
        letter: 'L',
    },
    attribute: {
        icon: 'card-text',
        letter: 'A',
    },
    reference: {
        icon: 'link-45deg',
        letter: 'R',
    },
    operation: {
        icon: 'gear',
        letter: 'O',
    },
    parameter: {
        icon: 'three-dots',
        letter: 'P',
    },
    object: {
        icon: 'app-fill',
        letter: 'O',
    },
    dataType: {
        icon: 'file-earmark-code',
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

/** Returns the single-letter badge label */
export function entityLetter(type: EntityType): string {
    return ENTITY_META[type].letter;
}

/** Returns true if the entity should render with reduced opacity (abstract) */
export function entityIsAbstract(type: EntityType): boolean {
    return !!ENTITY_META[type].abstract;
}
