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
    // SHAPES (viewBox 0 0 10 10, centered on 5,5)
    // ========================================
    {
        name: 'Circle',
        category: 'Shapes',
        path: 'M 5 0 A 5 5 0 1 1 5 10 A 5 5 0 1 1 5 0 Z',
    },
    {
        name: 'Square',
        category: 'Shapes',
        path: 'M 0 0 L 10 0 L 10 10 L 0 10 Z',
    },
    {
        name: 'Triangle',
        category: 'Shapes',
        path: 'M 5 0 L 10 10 L 0 10 Z',
    },
    {
        name: 'Diamond',
        category: 'Shapes',
        path: 'M 5 0 L 10 5 L 5 10 L 0 5 Z',
    },
    {
        name: 'Hexagon',
        category: 'Shapes',
        path: 'M 5 0 L 9.33 2.5 L 9.33 7.5 L 5 10 L 0.67 7.5 L 0.67 2.5 Z',
    },
    {
        name: 'Pentagon',
        category: 'Shapes',
        path: 'M 5 0 L 9.76 3.45 L 7.94 9.05 L 2.06 9.05 L 0.24 3.45 Z',
    },
    {
        name: 'Star',
        category: 'Shapes',
        path: 'M 5 0 L 6.18 3.82 L 10 3.82 L 6.91 6.18 L 8.09 10 L 5 7.64 L 1.91 10 L 3.09 6.18 L 0 3.82 L 3.82 3.82 Z',
    },
    {
        name: 'Rounded Rect',
        category: 'Shapes',
        path: 'M 2 0 L 8 0 A 2 2 0 0 1 10 2 L 10 8 A 2 2 0 0 1 8 10 L 2 10 A 2 2 0 0 1 0 8 L 0 2 A 2 2 0 0 1 2 0 Z',
    },

    // ========================================
    // ARROWS
    // ========================================
    {
        name: 'Arrow Right',
        category: 'Arrows',
        path: 'M 0 3 L 6 3 L 6 0 L 10 5 L 6 10 L 6 7 L 0 7 Z',
    },
    {
        name: 'Arrow Left',
        category: 'Arrows',
        path: 'M 10 3 L 4 3 L 4 0 L 0 5 L 4 10 L 4 7 L 10 7 Z',
    },
    {
        name: 'Arrow Up',
        category: 'Arrows',
        path: 'M 3 10 L 3 4 L 0 4 L 5 0 L 10 4 L 7 4 L 7 10 Z',
    },
    {
        name: 'Arrow Down',
        category: 'Arrows',
        path: 'M 3 0 L 3 6 L 0 6 L 5 10 L 10 6 L 7 6 L 7 0 Z',
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
        path: 'M 0 1 L 1 0 L 5 4 L 9 0 L 10 1 L 6 5 L 10 9 L 9 10 L 5 6 L 1 10 L 0 9 L 4 5 Z',
    },
    {
        name: 'Check',
        category: 'Symbols',
        path: 'M 0 5.5 L 1 4.5 L 4 7.5 L 9 2 L 10 3 L 4 9.5 Z',
    },
    {
        name: 'Heart',
        category: 'Symbols',
        path: 'M 5 9 C 1 6 0 3 0 2.5 A 2.5 2.5 0 0 1 5 1 A 2.5 2.5 0 0 1 10 2.5 C 10 3 9 6 5 9 Z',
    },
    {
        name: 'Lightning',
        category: 'Symbols',
        path: 'M 6 0 L 2 6 L 5 6 L 4 10 L 8 4 L 5 4 Z',
    },
    {
        name: 'Gear',
        category: 'Symbols',
        path: 'M 4.5 0 L 5.5 0 L 5.8 1.5 L 7.2 2 L 8.5 1 L 9 1.5 L 8 2.8 L 8.5 4.2 L 10 4.5 L 10 5.5 L 8.5 5.8 L 8 7.2 L 9 8.5 L 8.5 9 L 7.2 8 L 5.8 8.5 L 5.5 10 L 4.5 10 L 4.2 8.5 L 2.8 8 L 1.5 9 L 1 8.5 L 2 7.2 L 1.5 5.8 L 0 5.5 L 0 4.5 L 1.5 4.2 L 2 2.8 L 1 1.5 L 1.5 1 L 2.8 2 L 4.2 1.5 Z',
    },

    // ========================================
    // UML CONNECTORS
    // ========================================

    // Open Arrowhead — two lines forming a V, no base
    // Dependency, directed association
    {
        name: 'Open Arrowhead',
        category: 'UML Connectors',
        path: 'M 0 0 L 10 5 L 0 10',
    },
    // Closed Arrowhead — filled triangle
    // Navigability
    {
        name: 'Closed Arrowhead',
        category: 'UML Connectors',
        path: 'M 0 0 L 10 5 L 0 10 Z',
        filled: true,
    },
    // Inheritance Triangle — hollow isosceles
    // Generalization / specialization
    {
        name: 'Inheritance Triangle',
        category: 'UML Connectors',
        path: 'M 0 0 L 10 5 L 0 10 Z',
    },
    // Aggregation Diamond — hollow rhombus
    // Shared aggregation
    {
        name: 'Aggregation Diamond',
        category: 'UML Connectors',
        path: 'M 5 0 L 10 5 L 5 10 L 0 5 Z',
    },
    // Composition Diamond — filled rhombus, same geometry as aggregation
    // Composite aggregation
    {
        name: 'Composition Diamond',
        category: 'UML Connectors',
        path: 'M 5 0 L 10 5 L 5 10 L 0 5 Z',
        filled: true,
    },
    // Interface Lollipop — full circle (arc-based)
    // Provided interface
    {
        name: 'Interface Lollipop',
        category: 'UML Connectors',
        path: 'M 5 0 A 5 5 0 1 1 5 10 A 5 5 0 1 1 5 0 Z',
    },
    // Socket — right semicircle, concavity facing left
    // Required interface
    {
        name: 'Socket',
        category: 'UML Connectors',
        path: 'M 10 0 A 5 5 0 0 0 10 10',
    },
    // Containment — circle with centered plus
    // Containment, nesting
    {
        name: 'Containment',
        category: 'UML Connectors',
        path: 'M 5 0 A 5 5 0 1 1 5 10 A 5 5 0 1 1 5 0 Z M 5 2 L 5 8 M 2 5 L 8 5',
    },
    // Prohibition — circle with diagonal slash (top-right to bottom-left)
    // XOR, constraint
    {
        name: 'Prohibition',
        category: 'UML Connectors',
        path: 'M 5 0 A 5 5 0 1 1 5 10 A 5 5 0 1 1 5 0 Z M 2 8 L 8 2',
    },

    // ========================================
    // ER NOTATION (CROW'S FOOT)
    // ========================================

    // One — single perpendicular bar
    {
        name: 'One',
        category: 'ER Notation',
        path: 'M 5 0 L 5 10',
    },
    // Many — crow's foot / trident (3 lines from single point)
    {
        name: 'Many',
        category: 'ER Notation',
        path: 'M 5 10 L 0 0 M 5 10 L 5 0 M 5 10 L 10 0',
    },
    // One-and-Only-One — two parallel perpendicular bars
    {
        name: 'One-and-Only-One',
        category: 'ER Notation',
        path: 'M 4 0 L 4 10 M 6 0 L 6 10',
    },
    // Zero-or-One — circle + bar
    {
        name: 'Zero-or-One',
        category: 'ER Notation',
        path: 'M 5 0 A 2 2 0 1 1 5 4 A 2 2 0 1 1 5 0 Z M 5 5 L 5 10',
    },
    // Zero-or-Many — circle + crow's foot
    {
        name: 'Zero-or-Many',
        category: 'ER Notation',
        path: 'M 5 0 A 2 2 0 1 1 5 4 A 2 2 0 1 1 5 0 Z M 5 10 L 0 4 M 5 10 L 5 4 M 5 10 L 10 4',
    },
    // One-or-Many — bar + crow's foot
    {
        name: 'One-or-Many',
        category: 'ER Notation',
        path: 'M 5 5 L 5 10 M 5 10 L 0 4 M 5 10 L 10 4 M 3 5 L 7 5',
    },

    // ========================================
    // GENERAL CONNECTORS
    // ========================================

    // Filled Circle — solid dot endpoint
    {
        name: 'Filled Circle',
        category: 'General',
        path: 'M 5 2 A 3 3 0 1 1 5 8 A 3 3 0 1 1 5 2 Z',
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
        path: 'M 2 2 L 8 2 L 8 8 L 2 8 Z',
    },
    // Double Line — two parallel perpendicular lines (wider spacing)
    {
        name: 'Double Line',
        category: 'General',
        path: 'M 3 0 L 3 10 M 7 0 L 7 10',
    },
    // Fork — Y shape, line bifurcates into two branches
    // Activity diagram fork/join
    {
        name: 'Fork',
        category: 'General',
        path: 'M 5 0 L 5 5 L 0 10 M 5 5 L 10 10',
    },
];

/** Get unique categories in display order */
export const PRESET_CATEGORIES = ['Shapes', 'Arrows', 'Symbols', 'UML Connectors', 'ER Notation', 'General'] as const;
