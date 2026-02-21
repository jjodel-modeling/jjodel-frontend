/**
 * Marker Presets
 * Predefined SVG path configurations for edge head/tail markers
 */

export interface MarkerPreset {
    name: string;
    category: string;
    path: string;        // SVG path d attribute
    fill: 'currentColor' | 'white' | 'none';
    stroke: 'currentColor' | 'none';
    viewBox: string;     // e.g. "0 0 10 10"
}

export interface PresetCategory {
    name: string;
    presets: MarkerPreset[];
}

/**
 * All available marker presets organized by category
 */
export const MARKER_PRESETS: PresetCategory[] = [
    {
        name: 'None',
        presets: [
            {
                name: 'No Marker',
                category: 'None',
                path: '',
                fill: 'none',
                stroke: 'none',
                viewBox: '0 0 10 10',
            },
        ],
    },
    {
        name: 'Arrows',
        presets: [
            {
                name: 'Open Arrow',
                category: 'Arrows',
                path: 'M 0 0 L 10 5 L 0 10',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: 'Filled Arrow',
                category: 'Arrows',
                path: 'M 0 0 L 10 5 L 0 10 Z',
                fill: 'currentColor',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: 'Thin Arrow',
                category: 'Arrows',
                path: 'M 0 2 L 10 5 L 0 8',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: 'Notched Arrow',
                category: 'Arrows',
                path: 'M 0 0 L 10 5 L 0 10 L 3 5 Z',
                fill: 'currentColor',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
        ],
    },
    {
        name: 'Diamonds',
        presets: [
            {
                name: 'Open Diamond',
                category: 'Diamonds',
                path: 'M 0 5 L 5 0 L 10 5 L 5 10 Z',
                fill: 'white',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: 'Filled Diamond',
                category: 'Diamonds',
                path: 'M 0 5 L 5 0 L 10 5 L 5 10 Z',
                fill: 'currentColor',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
        ],
    },
    {
        name: 'Circles',
        presets: [
            {
                name: 'Open Circle',
                category: 'Circles',
                path: 'M 5 0 A 5 5 0 1 1 5 10 A 5 5 0 1 1 5 0 Z',
                fill: 'white',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: 'Filled Circle',
                category: 'Circles',
                path: 'M 5 0 A 5 5 0 1 1 5 10 A 5 5 0 1 1 5 0 Z',
                fill: 'currentColor',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
        ],
    },
    {
        name: 'Bars',
        presets: [
            {
                name: 'Simple Bar',
                category: 'Bars',
                path: 'M 0 0 L 0 10',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: 'Double Bar',
                category: 'Bars',
                path: 'M 0 0 L 0 10 M 3 0 L 3 10',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
        ],
    },
    {
        name: 'UML',
        presets: [
            {
                name: 'Inheritance',
                category: 'UML',
                path: 'M 0 0 L 10 5 L 0 10 Z',
                fill: 'white',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: 'Aggregation',
                category: 'UML',
                path: 'M 0 5 L 5 0 L 10 5 L 5 10 Z',
                fill: 'white',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: 'Composition',
                category: 'UML',
                path: 'M 0 5 L 5 0 L 10 5 L 5 10 Z',
                fill: 'currentColor',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: 'Association',
                category: 'UML',
                path: 'M 0 0 L 10 5 L 0 10',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
        ],
    },
    {
        name: 'Multiplicity',
        presets: [
            {
                name: '[0] Zero',
                category: 'Multiplicity',
                path: 'M 5 0 A 5 5 0 1 1 5 10 A 5 5 0 1 1 5 0 Z',
                fill: 'white',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: '[1] One',
                category: 'Multiplicity',
                path: 'M 5 0 L 5 10',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: '[0..*] Many',
                category: 'Multiplicity',
                path: 'M 10 1 L 0 5 L 10 9 M 10 5 L 0 5',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: '[0..1] Optional',
                category: 'Multiplicity',
                path: 'M 3 0 A 3 3 0 1 1 3 6 A 3 3 0 1 1 3 0 Z M 8 0 L 8 10',
                fill: 'white',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
            {
                name: '[1..*] OneOrMany',
                category: 'Multiplicity',
                path: 'M 0 0 L 0 10 M 10 1 L 0 5 L 10 9 M 10 5 L 0 5',
                fill: 'none',
                stroke: 'currentColor',
                viewBox: '0 0 10 10',
            },
        ],
    },
];

/**
 * Get a flat list of all presets
 */
export function getAllPresets(): MarkerPreset[] {
    return MARKER_PRESETS.flatMap(category => category.presets);
}

/**
 * Find a preset by its path value
 */
export function findPresetByPath(path: string): MarkerPreset | undefined {
    return getAllPresets().find(preset => preset.path === path);
}

/**
 * Get default fill/stroke for a path based on preset or fallback
 */
export function getDefaultStyles(path: string): { fill: string; stroke: string } {
    const preset = findPresetByPath(path);
    if (preset) {
        return {
            fill: preset.fill,
            stroke: preset.stroke,
        };
    }
    // Default for custom paths
    return {
        fill: 'currentColor',
        stroke: 'currentColor',
    };
}
