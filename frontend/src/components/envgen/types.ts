// === Wizard Step Identifiers ===
export type EnvGenStepId = 'general' | 'tech-stack' | 'design' | 'features' | 'concrete-syntax' | 'output';

export const STEP_ORDER: EnvGenStepId[] = ['general', 'tech-stack', 'design', 'features', 'concrete-syntax', 'output'];

// === Sidebar Nav Structure ===
export interface EnvGenNavGroup {
    label: string;
    items: Array<{ id: EnvGenStepId; label: string; icon: string }>;
}

export const ENVGEN_NAV_GROUPS: EnvGenNavGroup[] = [
    {
        label: 'CONFIGURATION',
        items: [
            { id: 'general', label: 'General', icon: 'bi-info-circle' },
            { id: 'tech-stack', label: 'Tech Stack', icon: 'bi-layers' },
        ],
    },
    {
        label: 'DESIGN',
        items: [
            { id: 'design', label: 'Design & UI', icon: 'bi-palette' },
            { id: 'features', label: 'Features', icon: 'bi-toggles2' },
        ],
    },
    {
        label: 'LANGUAGE',
        items: [
            { id: 'concrete-syntax', label: 'Concrete Syntax', icon: 'bi-aspect-ratio' },
        ],
    },
    {
        label: 'OUTPUT',
        items: [
            { id: 'output', label: 'Output', icon: 'bi-file-earmark-text' },
        ],
    },
];

// === Step 1: General ===
export interface EnvGenGeneral {
    name: string;
    description: string;
    metamodelId: string;
}

// === Step 2: Tech Stack ===
export interface EnvGenTechStack {
    framework: string;
    uiLibrary: string;
    iconLibrary: string;
    buildTool: string;
    stateManagement: string;
    persistence: string;
}

// === Step 3: Design ===
export interface EnvGenDesign {
    styleReference: string;
    theme: string;
    accentColor: string;
    fontSize: string;
    borderRadius: string;
    density: string;
}

// === Step 4: Features ===
export interface EnvGenFeatures {
    undoRedo: boolean;
    modelVersioning: boolean;
    autoSave: boolean;
    validationEngine: boolean;
    exportFormats: boolean;
    infiniteCanvas: boolean;
    minimap: boolean;
    snapToGrid: boolean;
    multipleSelection: boolean;
    inlineEditing: boolean;
    directEdges: boolean;
    bezierCurves: boolean;
    manhattanRouting: boolean;
    commandPalette: boolean;
    quickSearch: boolean;
    scriptingConsole: boolean;
    aiAssistant: boolean;
}

// === Step 5: Concrete Syntax ===
export interface ConcreteSyntaxEntry {
    id: string;
    name: string;
    isDefault: boolean;
    preset: string;
    description: string;
    imageDataUrl: string | null;
}

// === Step 6: Output ===
export interface EnvGenOutput {
    format: string;
    provider: string;
    includeSampleData: boolean;
    includeDocComments: boolean;
}

// === Combined Config ===
export interface EnvGenConfig {
    id: string;
    general: EnvGenGeneral;
    techStack: EnvGenTechStack;
    design: EnvGenDesign;
    features: EnvGenFeatures;
    concreteSyntax: ConcreteSyntaxEntry[];
    output: EnvGenOutput;
    status: 'draft' | 'ready' | 'generating';
    createdAt: number;
    updatedAt: number;
}

// === Saved Config Summary (for project page cards) ===
export interface EnvGenConfigSummary {
    id: string;
    name: string;
    metamodelName: string;
    techStackSummary: string;
    status: 'draft' | 'ready' | 'generating';
    updatedAt: number;
}

// === Metamodel Info (for info box) ===
export interface MetamodelInfo {
    id: string;
    name: string;
    classCount: number;
    enumCount: number;
    referenceCount: number;
    attributeCount: number;
}

// === Dropdown Options ===
export const FRAMEWORK_OPTIONS = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue 3' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'vanilla', label: 'Vanilla JS' },
];

export const UI_LIBRARY_OPTIONS = [
    { value: 'bootstrap', label: 'Bootstrap 5' },
    { value: 'tailwind', label: 'Tailwind CSS' },
    { value: 'mui', label: 'MUI (Material)' },
    { value: 'antdesign', label: 'Ant Design' },
    { value: 'custom', label: 'Custom CSS' },
];

export const ICON_LIBRARY_OPTIONS = [
    { value: 'bootstrap-icons', label: 'Bootstrap Icons' },
    { value: 'lucide', label: 'Lucide' },
    { value: 'heroicons', label: 'Heroicons' },
    { value: 'fontawesome', label: 'Font Awesome' },
    { value: 'phosphor', label: 'Phosphor' },
];

export const BUILD_TOOL_OPTIONS = [
    { value: 'vite', label: 'Vite' },
    { value: 'webpack', label: 'Webpack' },
    { value: 'parcel', label: 'Parcel' },
    { value: 'esbuild', label: 'esbuild' },
];

export const STATE_MANAGEMENT_OPTIONS = [
    { value: 'zustand', label: 'Zustand' },
    { value: 'react-context', label: 'React Context' },
    { value: 'redux-toolkit', label: 'Redux Toolkit' },
    { value: 'jotai', label: 'Jotai' },
    { value: 'mobx', label: 'MobX' },
];

export const PERSISTENCE_OPTIONS = [
    { value: 'localstorage', label: 'localStorage (no backend)' },
    { value: 'firebase', label: 'Firebase' },
    { value: 'supabase', label: 'Supabase' },
    { value: 'rest-api', label: 'Custom REST API' },
];

export const STYLE_REFERENCE_OPTIONS = [
    { value: 'bubbleio', label: 'Bubble.io' },
    { value: 'vscode', label: 'VS Code' },
    { value: 'figma', label: 'Figma' },
    { value: 'drawio', label: 'draw.io' },
    { value: 'enterprise-architect', label: 'Enterprise Architect' },
    { value: 'custom', label: 'Custom' },
];

export const THEME_OPTIONS = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'system', label: 'System (auto)' },
];

export const ACCENT_COLORS = [
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#6366f1', label: 'Indigo' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#ef4444', label: 'Red' },
    { value: '#f97316', label: 'Orange' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#10b981', label: 'Green' },
    { value: '#14b8a6', label: 'Teal' },
];

export const FONT_SIZE_OPTIONS = [
    { value: '14px', label: '14px (Compact)' },
    { value: '16px', label: '16px (Standard)' },
    { value: '19px', label: '19px (Large)' },
    { value: '22px', label: '22px (Extra Large)' },
];

export const BORDER_RADIUS_OPTIONS = [
    { value: '0px', label: '0px (Sharp)' },
    { value: '4px', label: '4px (Subtle)' },
    { value: '8px', label: '8px (Rounded)' },
    { value: '12px', label: '12px (Soft)' },
];

export const DENSITY_OPTIONS = [
    { value: 'compact', label: 'Compact' },
    { value: 'normal', label: 'Normal' },
    { value: 'relaxed', label: 'Relaxed' },
];

export const SYNTAX_PRESET_OPTIONS = [
    { value: 'uml', label: 'UML-like' },
    { value: 'chen', label: 'Chen (ER)' },
    { value: 'crowsfoot', label: "Crow's Foot (IE)" },
    { value: 'bpmn', label: 'BPMN-like' },
    { value: 'custom', label: 'Custom (describe below)' },
];

export const OUTPUT_FORMAT_OPTIONS = [
    { value: 'react-project', label: 'React Project (npm install && npm run dev)' },
    { value: 'single-html', label: 'Single HTML File (standalone)' },
    { value: 'prompt-markdown', label: 'Prompt Markdown (for Claude Code)' },
];

export const GENERATION_PROVIDER_OPTIONS = [
    { value: 'claude', label: 'Claude (Anthropic)' },
    { value: 'openai', label: 'OpenAI GPT' },
    { value: 'manual', label: 'Manual (export prompt only)' },
];

// === Default Values ===
export const DEFAULT_GENERAL: EnvGenGeneral = {
    name: '',
    description: '',
    metamodelId: '',
};

export const DEFAULT_TECH_STACK: EnvGenTechStack = {
    framework: 'react',
    uiLibrary: 'bootstrap',
    iconLibrary: 'bootstrap-icons',
    buildTool: 'vite',
    stateManagement: 'zustand',
    persistence: 'localstorage',
};

export const DEFAULT_DESIGN: EnvGenDesign = {
    styleReference: 'vscode',
    theme: 'dark',
    accentColor: '#06b6d4',
    fontSize: '16px',
    borderRadius: '8px',
    density: 'normal',
};

export const DEFAULT_FEATURES: EnvGenFeatures = {
    undoRedo: true,
    modelVersioning: true,
    autoSave: true,
    validationEngine: true,
    exportFormats: true,
    infiniteCanvas: true,
    minimap: true,
    snapToGrid: true,
    multipleSelection: true,
    inlineEditing: true,
    directEdges: true,
    bezierCurves: true,
    manhattanRouting: true,
    commandPalette: true,
    quickSearch: true,
    scriptingConsole: true,
    aiAssistant: true,
};

export const DEFAULT_OUTPUT: EnvGenOutput = {
    format: 'react-project',
    provider: 'claude',
    includeSampleData: true,
    includeDocComments: true,
};
