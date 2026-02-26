import type { EnvGenConfig } from '../types';
import {
    FRAMEWORK_OPTIONS,
    UI_LIBRARY_OPTIONS,
    ICON_LIBRARY_OPTIONS,
    BUILD_TOOL_OPTIONS,
    STATE_MANAGEMENT_OPTIONS,
    PERSISTENCE_OPTIONS,
    STYLE_REFERENCE_OPTIONS,
    FONT_SIZE_OPTIONS,
    BORDER_RADIUS_OPTIONS,
    DENSITY_OPTIONS,
    OUTPUT_FORMAT_OPTIONS,
} from '../types';

function labelFor(options: Array<{ value: string; label: string }>, value: string): string {
    return options.find(o => o.value === value)?.label || value;
}

function buildLayer1(config: EnvGenConfig): string {
    const lines: string[] = [];
    lines.push('# LAYER 1: General Architecture');
    lines.push('');

    // Environment
    lines.push('## Environment');
    lines.push(`- **Name:** ${config.general.name || 'Unnamed'}`);
    if (config.general.description) {
        lines.push(`- **Description:** ${config.general.description}`);
    }
    lines.push('');

    // Tech Stack
    lines.push('## Technology Stack');
    lines.push(`- **Framework:** ${labelFor(FRAMEWORK_OPTIONS, config.techStack.framework)}`);
    lines.push(`- **UI Library:** ${labelFor(UI_LIBRARY_OPTIONS, config.techStack.uiLibrary)}`);
    lines.push(`- **Icon Library:** ${labelFor(ICON_LIBRARY_OPTIONS, config.techStack.iconLibrary)}`);
    lines.push(`- **Build Tool:** ${labelFor(BUILD_TOOL_OPTIONS, config.techStack.buildTool)}`);
    lines.push(`- **State Management:** ${labelFor(STATE_MANAGEMENT_OPTIONS, config.techStack.stateManagement)}`);
    lines.push(`- **Persistence:** ${labelFor(PERSISTENCE_OPTIONS, config.techStack.persistence)}`);
    lines.push('');

    // Design
    lines.push('## Design & UI');
    lines.push(`- **UI Reference Style:** ${labelFor(STYLE_REFERENCE_OPTIONS, config.design.styleReference)}`);
    lines.push(`- **Default Theme:** ${config.design.theme}`);
    lines.push(`- **Accent Color:** ${config.design.accentColor}`);
    lines.push(`- **Base Font Size:** ${labelFor(FONT_SIZE_OPTIONS, config.design.fontSize)}`);
    lines.push(`- **Border Radius:** ${labelFor(BORDER_RADIUS_OPTIONS, config.design.borderRadius)}`);
    lines.push(`- **Spacing Density:** ${labelFor(DENSITY_OPTIONS, config.design.density)}`);
    lines.push('');

    // Features
    lines.push('## Enabled Features');
    const featureLabels: Record<string, string> = {
        undoRedo: 'Undo / Redo',
        modelVersioning: 'Model Versioning',
        autoSave: 'Auto-save',
        validationEngine: 'Validation Engine',
        exportFormats: 'Export (JSON / PNG / SVG)',
        infiniteCanvas: 'Infinite Canvas with Inertial Scrolling',
        minimap: 'Minimap',
        snapToGrid: 'Snap-to-Grid',
        multipleSelection: 'Multiple Selection & Alignment',
        inlineEditing: 'Inline Canvas Editing',
        directEdges: 'Direct (straight lines)',
        bezierCurves: 'Bezier Curves',
        manhattanRouting: 'Manhattan Routing',
        commandPalette: 'Command Palette (Ctrl+Shift+P)',
        quickSearch: 'Quick Search (Ctrl+F)',
        scriptingConsole: 'Scripting Console',
        aiAssistant: 'AI Assistant',
    };

    const enabled: string[] = [];
    const disabled: string[] = [];
    for (const [key, label] of Object.entries(featureLabels)) {
        if ((config.features as any)[key]) {
            enabled.push(label);
        } else {
            disabled.push(label);
        }
    }

    if (enabled.length > 0) {
        lines.push('### Enabled');
        for (const f of enabled) {
            lines.push(`- ${f}`);
        }
    }
    if (disabled.length > 0) {
        lines.push('### Disabled');
        for (const f of disabled) {
            lines.push(`- ~~${f}~~`);
        }
    }
    lines.push('');

    // Output preferences
    lines.push('## Output Format');
    lines.push(`- **Format:** ${labelFor(OUTPUT_FORMAT_OPTIONS, config.output.format)}`);
    lines.push(`- **Include Sample Data:** ${config.output.includeSampleData ? 'Yes' : 'No'}`);
    lines.push(`- **Include Documentation Comments:** ${config.output.includeDocComments ? 'Yes' : 'No'}`);
    lines.push('');

    return lines.join('\n');
}

function buildLayer2(metamodelMarkdown: string): string {
    const lines: string[] = [];
    lines.push('# LAYER 2: Domain-Specific (Metamodel)');
    lines.push('');
    lines.push(metamodelMarkdown || '> No metamodel selected.');
    lines.push('');
    return lines.join('\n');
}

function buildLayer3(config: EnvGenConfig): string {
    const lines: string[] = [];
    lines.push('# LAYER 3: Concrete Syntax & Adjustments');
    lines.push('');

    if (config.concreteSyntax.length > 0) {
        lines.push('## Concrete Syntaxes');
        for (const syntax of config.concreteSyntax) {
            const defaultBadge = syntax.isDefault ? ' (DEFAULT)' : '';
            lines.push(`### ${syntax.name}${defaultBadge}`);
            lines.push(`- **Preset:** ${syntax.preset}`);
            if (syntax.description) {
                lines.push(`- **Description:** ${syntax.description}`);
            }
            lines.push('');
        }
    }

    lines.push('## Adjustments');
    lines.push('No adjustments yet.');
    lines.push('');

    return lines.join('\n');
}

export function buildPrompt(config: EnvGenConfig, metamodelMarkdown: string): string {
    const header = [
        '---',
        `title: "${config.general.name || 'Untitled'} - Environment Generation Prompt"`,
        `generated: "${new Date().toISOString()}"`,
        'generator: "Jjodel Environment Generation"',
        '---',
        '',
        '> This prompt was generated by Jjodel\'s Environment Generation feature.',
        '> Use it with Claude Code, ChatGPT, or any other LLM to generate a standalone modeling environment.',
        '',
    ].join('\n');

    return [
        header,
        buildLayer1(config),
        buildLayer2(metamodelMarkdown),
        buildLayer3(config),
    ].join('\n');
}
