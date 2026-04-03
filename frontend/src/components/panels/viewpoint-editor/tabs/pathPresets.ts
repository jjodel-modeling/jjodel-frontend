/**
 * SVG Path Presets
 * Pre-built shapes for quick starting points in the path editor.
 * All paths are normalized to a 0–10 viewBox (matching the editor grid).
 */

export interface PathPreset {
    name: string;
    path: string;
    category: 'Shapes' | 'Arrows' | 'Symbols' | 'UML Connectors' | 'ER Notation' | 'General';
    /** When true, the shape renders filled in the preset popover (e.g. composition diamond) */
    filled?: boolean;
}

export const PATH_PRESETS: PathPreset[] = [
    // ========================================
    // SHAPES
    // ========================================
    {
        name: 'Circle',
        category: 'Shapes',
        path: 'M 5 0 C 7.8 0 10 2.2 10 5 C 10 7.8 7.8 10 5 10 C 2.2 10 0 7.8 0 5 C 0 2.2 2.2 0 5 0 Z',
    },
    {
        name: 'Square',
        category: 'Shapes',
        path: 'M 1 1 L 9 1 L 9 9 L 1 9 Z',
    },
    {
        name: 'Triangle',
        category: 'Shapes',
        path: 'M 5 1 L 9 9 L 1 9 Z',
    },
    {
        name: 'Diamond',
        category: 'Shapes',
        path: 'M 5 0 L 10 5 L 5 10 L 0 5 Z',
    },
    {
        name: 'Hexagon',
        category: 'Shapes',
        path: 'M 2.5 0.7 L 7.5 0.7 L 10 5 L 7.5 9.3 L 2.5 9.3 L 0 5 Z',
    },
    {
        name: 'Pentagon',
        category: 'Shapes',
        path: 'M 5 0 L 9.8 3.5 L 8 9 L 2 9 L 0.2 3.5 Z',
    },
    {
        name: 'Star',
        category: 'Shapes',
        path: 'M 5 0 L 6.2 3.5 L 10 3.5 L 7 5.8 L 8 9.5 L 5 7.2 L 2 9.5 L 3 5.8 L 0 3.5 L 3.8 3.5 Z',
    },
    {
        name: 'Rounded Rect',
        category: 'Shapes',
        path: 'M 3 1 L 7 1 C 8.5 1 9 2.5 9 3 L 9 7 C 9 8.5 7.5 9 7 9 L 3 9 C 1.5 9 1 7.5 1 7 L 1 3 C 1 1.5 2.5 1 3 1 Z',
    },

    // ========================================
    // ARROWS
    // ========================================
    {
        name: 'Arrow Right',
        category: 'Arrows',
        path: 'M 0 4 L 6 4 L 6 1 L 10 5 L 6 9 L 6 6 L 0 6 Z',
    },
    {
        name: 'Arrow Left',
        category: 'Arrows',
        path: 'M 10 4 L 4 4 L 4 1 L 0 5 L 4 9 L 4 6 L 10 6 Z',
    },
    {
        name: 'Arrow Up',
        category: 'Arrows',
        path: 'M 4 10 L 4 4 L 1 4 L 5 0 L 9 4 L 6 4 L 6 10 Z',
    },
    {
        name: 'Arrow Down',
        category: 'Arrows',
        path: 'M 4 0 L 4 6 L 1 6 L 5 10 L 9 6 L 6 6 L 6 0 Z',
    },
    {
        name: 'Double Arrow',
        category: 'Arrows',
        path: 'M 0 5 L 3 2 L 3 4 L 7 4 L 7 2 L 10 5 L 7 8 L 7 6 L 3 6 L 3 8 Z',
    },

    // ========================================
    // SYMBOLS
    // ========================================
    {
        name: 'Plus',
        category: 'Symbols',
        path: 'M 4 0 L 6 0 L 6 4 L 10 4 L 10 6 L 6 6 L 6 10 L 4 10 L 4 6 L 0 6 L 0 4 L 4 4 Z',
    },
    {
        name: 'Cross',
        category: 'Symbols',
        path: 'M 1.5 0 L 5 3.5 L 8.5 0 L 10 1.5 L 6.5 5 L 10 8.5 L 8.5 10 L 5 6.5 L 1.5 10 L 0 8.5 L 3.5 5 L 0 1.5 Z',
    },
    {
        name: 'Check',
        category: 'Symbols',
        path: 'M 1 5.5 L 2 4.5 L 4 6.5 L 8 2 L 9 3 L 4 8.5 Z',
    },
    {
        name: 'Heart',
        category: 'Symbols',
        path: 'M 5 9 C 3 7 0 5.5 0 3 C 0 1 1.5 0 3 0 C 4 0 4.8 0.5 5 1.2 C 5.2 0.5 6 0 7 0 C 8.5 0 10 1 10 3 C 10 5.5 7 7 5 9 Z',
    },
    {
        name: 'Lightning',
        category: 'Symbols',
        path: 'M 6 0 L 3 5 L 5.5 5 L 4 10 L 8 4.5 L 5.5 4.5 L 7.5 0 Z',
    },
    {
        name: 'Gear',
        category: 'Symbols',
        path: 'M 4 0 L 6 0 L 6.5 1.5 L 8 1.5 L 9 0.5 L 10 1.5 L 9 3 L 9.5 4 L 10 4 L 10 6 L 8.5 6.5 L 8.5 8 L 9.5 9 L 8.5 10 L 7 9 L 6 9.5 L 6 10 L 4 10 L 3.5 8.5 L 2 8.5 L 1 9.5 L 0 8.5 L 1 7 L 0.5 6 L 0 6 L 0 4 L 1.5 3.5 L 1.5 2 L 0.5 1 L 1.5 0 L 3 1 L 4 0.5 Z',
    },

    // ========================================
    // UML CONNECTORS
    // ========================================

    // Open Arrowhead — two lines forming a V, no base (~60° opening)
    // Dependency, directed association
    {
        name: 'Open Arrowhead',
        category: 'UML Connectors',
        path: 'M 2 1.5 L 8 5 L 2 8.5',
    },
    // Closed Arrowhead — filled triangle (~60° opening)
    // Navigability
    {
        name: 'Closed Arrowhead',
        category: 'UML Connectors',
        path: 'M 2 1.5 L 8 5 L 2 8.5 Z',
        filled: true,
    },
    // Inheritance Triangle — hollow isosceles, slightly taller (~67° opening)
    // Generalization / specialization
    {
        name: 'Inheritance Triangle',
        category: 'UML Connectors',
        path: 'M 2 1 L 8 5 L 2 9 Z',
    },
    // Aggregation Diamond — hollow rhombus, height:width = 2:1
    // Shared aggregation
    {
        name: 'Aggregation Diamond',
        category: 'UML Connectors',
        path: 'M 5 0 L 7.5 5 L 5 10 L 2.5 5 Z',
    },
    // Composition Diamond — filled rhombus, same geometry as aggregation
    // Composite aggregation
    {
        name: 'Composition Diamond',
        category: 'UML Connectors',
        path: 'M 5 0 L 7.5 5 L 5 10 L 2.5 5 Z',
        filled: true,
    },
    // Interface Lollipop — small circle (arc-based)
    // Provided interface
    {
        name: 'Interface Lollipop',
        category: 'UML Connectors',
        path: 'M 2 5 A 3 3 0 1 1 8 5 A 3 3 0 1 1 2 5 Z',
    },
    // Socket — left semicircle, concavity facing right
    // Required interface
    {
        name: 'Socket',
        category: 'UML Connectors',
        path: 'M 5 2 A 3 3 0 0 0 5 8',
    },
    // Containment — circle with centered plus
    // Containment, nesting
    {
        name: 'Containment',
        category: 'UML Connectors',
        path: 'M 2 5 A 3 3 0 1 1 8 5 A 3 3 0 1 1 2 5 Z M 5 3 L 5 7 M 3 5 L 7 5',
    },
    // Prohibition — circle with diagonal slash (top-right to bottom-left)
    // XOR, constraint
    {
        name: 'Prohibition',
        category: 'UML Connectors',
        path: 'M 2 5 A 3 3 0 1 1 8 5 A 3 3 0 1 1 2 5 Z M 7 3 L 3 7',
    },

    // ========================================
    // ER NOTATION (CROW'S FOOT)
    // ========================================

    // One — single perpendicular bar
    {
        name: 'One',
        category: 'ER Notation',
        path: 'M 5 1 L 5 9',
    },
    // Many — crow's foot / trident (3 lines from single point)
    {
        name: 'Many',
        category: 'ER Notation',
        path: 'M 8 5 L 2 1 M 8 5 L 2 5 M 8 5 L 2 9',
    },
    // One-and-Only-One — two parallel perpendicular bars
    {
        name: 'One-and-Only-One',
        category: 'ER Notation',
        path: 'M 4 1 L 4 9 M 6 1 L 6 9',
    },
    // Zero-or-One — circle + bar
    {
        name: 'Zero-or-One',
        category: 'ER Notation',
        path: 'M 1 5 A 2 2 0 1 1 5 5 A 2 2 0 1 1 1 5 Z M 8 1 L 8 9',
    },
    // Zero-or-Many — circle + crow's foot
    {
        name: 'Zero-or-Many',
        category: 'ER Notation',
        path: 'M 0.5 5 A 1.5 1.5 0 1 1 3.5 5 A 1.5 1.5 0 1 1 0.5 5 Z M 6 5 L 10 1 M 6 5 L 10 5 M 6 5 L 10 9',
    },
    // One-or-Many — bar + crow's foot
    {
        name: 'One-or-Many',
        category: 'ER Notation',
        path: 'M 2 1 L 2 9 M 6 5 L 10 1 M 6 5 L 10 5 M 6 5 L 10 9',
    },

    // ========================================
    // GENERAL CONNECTORS
    // ========================================

    // Filled Circle — solid dot endpoint
    {
        name: 'Filled Circle',
        category: 'General',
        path: 'M 2 5 A 3 3 0 1 1 8 5 A 3 3 0 1 1 2 5 Z',
        filled: true,
    },
    // Cross Endpoint — X shape, two diagonal crossing lines
    {
        name: 'Cross Endpoint',
        category: 'General',
        path: 'M 2 2 L 8 8 M 8 2 L 2 8',
    },
    // Square Endpoint — small centered square
    {
        name: 'Square Endpoint',
        category: 'General',
        path: 'M 3 3 L 7 3 L 7 7 L 3 7 Z',
    },
    // Double Line — two parallel perpendicular lines (wider spacing)
    {
        name: 'Double Line',
        category: 'General',
        path: 'M 3.5 1 L 3.5 9 M 6.5 1 L 6.5 9',
    },
    // Fork — Y shape, line bifurcates into two branches
    // Activity diagram fork/join
    {
        name: 'Fork',
        category: 'General',
        path: 'M 5 9 L 5 5 L 2 1 M 5 5 L 8 1',
    },
];

/** Get unique categories in display order */
export const PRESET_CATEGORIES = ['Shapes', 'Arrows', 'Symbols', 'UML Connectors', 'ER Notation', 'General'] as const;
