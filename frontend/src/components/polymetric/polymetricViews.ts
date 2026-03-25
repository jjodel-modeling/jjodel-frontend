/**
 * Polymetric Views — Types & Predefined View Configurations
 *
 * Inspired by Lanza & Ducasse (2003) "Polymetric Views".
 * Each view maps software metrics to visual properties (width, height, color, position).
 */

// ---------------------------------------------------------------------------
// Layout types
// ---------------------------------------------------------------------------

export type LayoutType = 'checker' | 'tree' | 'scatterplot';

// ---------------------------------------------------------------------------
// Metric keys
// ---------------------------------------------------------------------------

export type MetricKey =
    // Metaclass metrics (M2)
    | 'NAttr'         // number of own attributes
    | 'NOp'           // number of own operations
    | 'NSub'          // number of direct subclasses (extendedBy)
    | 'NRef'          // number of outgoing references (non-inheritance)
    | 'NInst'         // number of model instances of this metaclass
    | 'Abstractness'  // binary: 1 if abstract hub (NSub > 0 && NInst === 0)
    // Instance metrics (M1)
    | 'NVal'          // number of attribute values set (non-null/non-default)
    | 'NLinkOut'      // number of outgoing reference links
    | 'NLinkIn'       // number of incoming reference links
    | 'Completeness'; // NVal / total attributes defined by metaclass (0-1)

/** @deprecated Use NLinkOut instead */
export type NLink = 'NLink';

// ---------------------------------------------------------------------------
// View configuration
// ---------------------------------------------------------------------------

export interface PolymetricViewConfig {
    id: string;
    name: string;
    description: string;
    /** Interpretive question displayed in the sidebar */
    question?: string;
    target: 'metamodel' | 'model';
    layout: LayoutType;
    metrics: {
        width: MetricKey;
        height: MetricKey;
        color: MetricKey;
        posX?: MetricKey;   // only for scatterplot
        posY?: MetricKey;   // only for scatterplot
    };
    sortBy?: MetricKey;
    icon: string;           // Bootstrap icon class (without 'bi-')
    /** Built-in views cannot be deleted */
    builtIn?: boolean;
    /** Show parent-child edges (only for tree layout) */
    showEdges?: boolean;
}

// ---------------------------------------------------------------------------
// Node data (computed by metric extraction + layout)
// ---------------------------------------------------------------------------

export interface PolymetricNodeData {
    id: string;
    label: string;
    metrics: Partial<Record<MetricKey, number>>;
    /** For tree layout: parent node id (superclass) */
    parentId?: string;
    /** Computed by layout */
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    /** Normalized 0-1 for color rendering */
    colorValue?: number;
    /** Normalized 0-1 width metric (for outlier detection) */
    normWidth?: number;
    /** Normalized 0-1 height metric (for outlier detection) */
    normHeight?: number;
}

// ---------------------------------------------------------------------------
// Predefined views
// ---------------------------------------------------------------------------

export const PREDEFINED_VIEWS: PolymetricViewConfig[] = [
    // ── METAMODEL VIEWS ────────────────────────────────────────────────
    {
        id: 'structural-weight',
        name: 'Structural Weight',
        description: 'Overview of metaclass structural complexity. Width encodes attributes, height encodes references, color encodes subclass fan-out.',
        question: 'Which metaclasses carry the most structural complexity?',
        target: 'metamodel',
        layout: 'checker',
        metrics: { width: 'NAttr', height: 'NRef', color: 'NSub' },
        sortBy: 'NAttr',
        icon: 'grid-3x3-gap',
        builtIn: true,
    },
    {
        id: 'usage-vs-definition',
        name: 'Usage vs Definition',
        description: 'Compares instantiation frequency against definition richness. Wide = heavily instantiated, tall = many attributes, dark = many references.',
        question: 'Which metaclasses are heavily instantiated but poorly defined?',
        target: 'metamodel',
        layout: 'checker',
        metrics: { width: 'NInst', height: 'NAttr', color: 'NRef' },
        sortBy: 'NInst',
        icon: 'bar-chart-steps',
        builtIn: true,
    },
    {
        id: 'coupling-hotspots',
        name: 'Coupling Hotspots',
        description: 'Reference coupling (X) vs subclass fan-out (Y). Top-right outliers are architectural hotspots with high coupling and inheritance.',
        question: 'Which metaclasses are most coupled to the rest of the metamodel?',
        target: 'metamodel',
        layout: 'scatterplot',
        metrics: { width: 'NAttr', height: 'NAttr', color: 'NAttr', posX: 'NRef', posY: 'NSub' },
        icon: 'scatter-chart',
        builtIn: true,
    },
    {
        id: 'abstractness-map',
        name: 'Abstractness Map',
        description: 'Inheritance hierarchy colored by abstractness. Dark nodes are abstract hubs (subclasses but no instances), light nodes are concrete leaves.',
        question: 'Which metaclasses are abstract hubs vs concrete leaves?',
        target: 'metamodel',
        layout: 'tree',
        metrics: { width: 'NAttr', height: 'NRef', color: 'Abstractness' },
        icon: 'layers',
        builtIn: true,
        showEdges: true,
    },
    {
        id: 'inheritance-tree',
        name: 'Inheritance Tree',
        description: 'System complexity view: inheritance hierarchy as a node-link tree. Width = attributes, height = references, color = subclass fan-out.',
        question: 'How is the inheritance hierarchy structured? Which classes carry the most complexity?',
        target: 'metamodel',
        layout: 'tree',
        metrics: { width: 'NAttr', height: 'NRef', color: 'NSub' },
        icon: 'diagram-3',
        builtIn: true,
        showEdges: true,
    },
    {
        id: 'inheritance-complexity',
        name: 'Inheritance Complexity',
        description: 'Inheritance hierarchy with functionality distribution. Width = attributes, height = subclass fan-out, color = reference coupling.',
        question: 'How is functionality distributed across inheritance hierarchies?',
        target: 'metamodel',
        layout: 'tree',
        metrics: { width: 'NAttr', height: 'NSub', color: 'NRef' },
        icon: 'diagram-3',
        builtIn: true,
        showEdges: true,
    },

    // ── MODEL VIEWS ────────────────────────────────────────────────────
    {
        id: 'population-completeness',
        name: 'Population & Completeness',
        description: 'Instance density and attribute completeness. Width = outgoing links, height = values set, color = fill rate.',
        question: 'Which instances are incomplete or isolated?',
        target: 'model',
        layout: 'checker',
        metrics: { width: 'NLinkOut', height: 'NVal', color: 'Completeness' },
        sortBy: 'Completeness',
        icon: 'people',
        builtIn: true,
    },
    {
        id: 'connectivity-map',
        name: 'Connectivity Map',
        description: 'Outgoing links (X) vs incoming links (Y). Hub instances cluster top-right, isolated leaves near the origin.',
        question: 'Which instances are hubs, which are isolated leaves?',
        target: 'model',
        layout: 'scatterplot',
        metrics: { width: 'NLinkOut', height: 'NLinkOut', color: 'Completeness', posX: 'NLinkOut', posY: 'NLinkIn' },
        icon: 'scatter-chart',
        builtIn: true,
    },
    {
        id: 'density-overview',
        name: 'Density Overview',
        description: 'How dense and well-connected is the model. Width = incoming links, height = outgoing links, color = values set.',
        question: 'How dense and well-connected is the model overall?',
        target: 'model',
        layout: 'checker',
        metrics: { width: 'NLinkIn', height: 'NLinkOut', color: 'NVal' },
        sortBy: 'NLinkOut',
        icon: 'grid-fill',
        builtIn: true,
    },
];

/**
 * Returns the default view config for a given target type.
 */
export function getDefaultView(target: 'metamodel' | 'model'): PolymetricViewConfig {
    return target === 'model'
        ? PREDEFINED_VIEWS.find(v => v.id === 'population-completeness')!
        : PREDEFINED_VIEWS[0];
}

/**
 * Returns views applicable to a given target type.
 */
export function getViewsForTarget(target: 'metamodel' | 'model'): PolymetricViewConfig[] {
    return PREDEFINED_VIEWS.filter(v => v.target === target);
}

// ---------------------------------------------------------------------------
// Metric labels (human-readable)
// ---------------------------------------------------------------------------

export const METRIC_LABELS: Record<MetricKey, string> = {
    NAttr: 'Attributes',
    NOp: 'Operations',
    NSub: 'Subclasses',
    NRef: 'References',
    NInst: 'Instances',
    Abstractness: 'Abstractness',
    NVal: 'Values Set',
    NLinkOut: 'Outgoing Links',
    NLinkIn: 'Incoming Links',
    Completeness: 'Completeness',
};

// ---------------------------------------------------------------------------
// Metric groups for the mapping editor
// ---------------------------------------------------------------------------

export const METAMODEL_METRICS: MetricKey[] = ['NAttr', 'NOp', 'NRef', 'NSub', 'NInst', 'Abstractness'];
export const MODEL_METRICS: MetricKey[] = ['NVal', 'NLinkOut', 'NLinkIn', 'Completeness'];

// ---------------------------------------------------------------------------
// localStorage preset helpers
// ---------------------------------------------------------------------------

const PRESETS_KEY = 'jjodel_polymetric_presets';

export function loadUserPresets(): PolymetricViewConfig[] {
    try {
        const raw = localStorage.getItem(PRESETS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveUserPresets(presets: PolymetricViewConfig[]): void {
    try {
        localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch { /* localStorage may be unavailable */ }
}

export function deleteUserPreset(presetId: string): PolymetricViewConfig[] {
    const presets = loadUserPresets().filter(p => p.id !== presetId);
    saveUserPresets(presets);
    return presets;
}
