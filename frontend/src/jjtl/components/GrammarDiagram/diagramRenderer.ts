/**
 * Railroad Diagram Renderer
 * Pure SVG implementation for railroad diagrams - no external dependencies
 */

import { GrammarRule } from './types';

// ============================================
// SVG BUILDER TYPES
// ============================================

interface DiagramNode {
    type: 'terminal' | 'nonterminal' | 'sequence' | 'choice' | 'optional' | 'zeroOrMore' | 'oneOrMore';
    value?: string;
    children?: DiagramNode[];
}

interface RenderResult {
    svg: string;
    width: number;
    height: number;
}

// ============================================
// CONSTANTS
// ============================================

const CHAR_WIDTH = 8;
const NODE_HEIGHT = 28;
const NODE_PADDING = 12;
const NODE_RADIUS = 4;
const TERMINAL_RADIUS = 14;
const LINE_SPACING = 16;
const ARROW_SIZE = 6;
const CONNECTOR_LENGTH = 20;

// ============================================
// NODE BUILDERS
// ============================================

function Terminal(value: string): DiagramNode {
    return { type: 'terminal', value };
}

function NonTerminal(value: string): DiagramNode {
    return { type: 'nonterminal', value };
}

function Sequence(...children: DiagramNode[]): DiagramNode {
    return { type: 'sequence', children };
}

function Choice(...children: DiagramNode[]): DiagramNode {
    return { type: 'choice', children };
}

function Optional(child: DiagramNode): DiagramNode {
    return { type: 'optional', children: [child] };
}

function ZeroOrMore(child: DiagramNode): DiagramNode {
    return { type: 'zeroOrMore', children: [child] };
}

function OneOrMore(child: DiagramNode): DiagramNode {
    return { type: 'oneOrMore', children: [child] };
}

// ============================================
// SVG RENDERING
// ============================================

function getNodeWidth(node: DiagramNode): number {
    switch (node.type) {
        case 'terminal':
        case 'nonterminal':
            return (node.value?.length || 0) * CHAR_WIDTH + NODE_PADDING * 2;
        case 'sequence':
            return (node.children || []).reduce((sum, child) => sum + getNodeWidth(child) + CONNECTOR_LENGTH, 0);
        case 'choice':
            return Math.max(...(node.children || []).map(getNodeWidth)) + CONNECTOR_LENGTH * 2;
        case 'optional':
        case 'zeroOrMore':
        case 'oneOrMore':
            return getNodeWidth(node.children![0]) + CONNECTOR_LENGTH * 3;
        default:
            return 0;
    }
}

function getNodeHeight(node: DiagramNode): number {
    switch (node.type) {
        case 'terminal':
        case 'nonterminal':
            return NODE_HEIGHT;
        case 'sequence':
            return Math.max(...(node.children || []).map(getNodeHeight));
        case 'choice':
            return (node.children || []).reduce((sum, child) => sum + getNodeHeight(child) + LINE_SPACING, -LINE_SPACING);
        case 'optional':
            return NODE_HEIGHT + LINE_SPACING + 10;
        case 'zeroOrMore':
        case 'oneOrMore':
            return NODE_HEIGHT + LINE_SPACING * 2;
        default:
            return NODE_HEIGHT;
    }
}

function renderNode(node: DiagramNode, x: number, y: number): { svg: string; endX: number } {
    let svg = '';
    let endX = x;

    switch (node.type) {
        case 'terminal': {
            const width = getNodeWidth(node);
            const textX = x + width / 2;
            const textY = y + NODE_HEIGHT / 2 + 4;

            // Rounded rectangle for terminal
            svg += `<rect class="terminal" x="${x}" y="${y}" width="${width}" height="${NODE_HEIGHT}" rx="${TERMINAL_RADIUS}" ry="${TERMINAL_RADIUS}"/>`;
            svg += `<text class="terminal-text" x="${textX}" y="${textY}">${escapeHtml(node.value || '')}</text>`;
            endX = x + width;
            break;
        }

        case 'nonterminal': {
            const width = getNodeWidth(node);
            const textX = x + width / 2;
            const textY = y + NODE_HEIGHT / 2 + 4;

            // Rectangle for non-terminal
            svg += `<rect class="nonterminal" x="${x}" y="${y}" width="${width}" height="${NODE_HEIGHT}" rx="${NODE_RADIUS}" ry="${NODE_RADIUS}"/>`;
            svg += `<text class="nonterminal-text" x="${textX}" y="${textY}">${escapeHtml(node.value || '')}</text>`;
            endX = x + width;
            break;
        }

        case 'sequence': {
            let currentX = x;
            const centerY = y + NODE_HEIGHT / 2;

            for (let i = 0; i < (node.children || []).length; i++) {
                const child = node.children![i];

                // Draw connector before (except first)
                if (i > 0) {
                    svg += `<line class="connector" x1="${currentX}" y1="${centerY}" x2="${currentX + CONNECTOR_LENGTH}" y2="${centerY}"/>`;
                    currentX += CONNECTOR_LENGTH;
                }

                const result = renderNode(child, currentX, y);
                svg += result.svg;
                currentX = result.endX;
            }
            endX = currentX;
            break;
        }

        case 'choice': {
            const children = node.children || [];
            const maxWidth = Math.max(...children.map(getNodeWidth));
            const totalHeight = getNodeHeight(node);
            const startY = y;

            let currentY = startY;
            const centerX = x + CONNECTOR_LENGTH;
            const endCenterX = x + CONNECTOR_LENGTH + maxWidth + CONNECTOR_LENGTH;

            // Entry line
            svg += `<line class="connector" x1="${x}" y1="${startY + totalHeight / 2}" x2="${centerX}" y2="${startY + totalHeight / 2}"/>`;

            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const childHeight = getNodeHeight(child);
                const childCenterY = currentY + childHeight / 2;

                // Branch line from start
                if (i === 0) {
                    svg += `<line class="connector" x1="${centerX}" y1="${startY + totalHeight / 2}" x2="${centerX}" y2="${childCenterY}"/>`;
                } else {
                    svg += `<path class="connector" d="M${centerX},${startY + totalHeight / 2} Q${centerX},${childCenterY} ${centerX},${childCenterY}" fill="none"/>`;
                }

                // Draw child
                const result = renderNode(child, centerX, currentY);
                svg += result.svg;

                // Branch line to end
                svg += `<line class="connector" x1="${result.endX}" y1="${childCenterY}" x2="${endCenterX}" y2="${childCenterY}"/>`;
                if (i === 0) {
                    svg += `<line class="connector" x1="${endCenterX}" y1="${childCenterY}" x2="${endCenterX}" y2="${startY + totalHeight / 2}"/>`;
                }

                currentY += childHeight + LINE_SPACING;
            }

            // Exit line
            svg += `<line class="connector" x1="${endCenterX}" y1="${startY + totalHeight / 2}" x2="${endCenterX + CONNECTOR_LENGTH}" y2="${startY + totalHeight / 2}"/>`;
            endX = endCenterX + CONNECTOR_LENGTH;
            break;
        }

        case 'optional': {
            const child = node.children![0];
            const childWidth = getNodeWidth(child);
            const centerY = y + NODE_HEIGHT / 2;
            const bypassY = y + NODE_HEIGHT + LINE_SPACING / 2;

            // Main path through child
            svg += `<line class="connector" x1="${x}" y1="${centerY}" x2="${x + CONNECTOR_LENGTH}" y2="${centerY}"/>`;
            const result = renderNode(child, x + CONNECTOR_LENGTH, y);
            svg += result.svg;
            svg += `<line class="connector" x1="${result.endX}" y1="${centerY}" x2="${result.endX + CONNECTOR_LENGTH}" y2="${centerY}"/>`;

            // Bypass path (skip)
            svg += `<path class="connector bypass" d="M${x},${centerY} Q${x},${bypassY} ${x + CONNECTOR_LENGTH / 2},${bypassY} L${result.endX + CONNECTOR_LENGTH / 2},${bypassY} Q${result.endX + CONNECTOR_LENGTH},${bypassY} ${result.endX + CONNECTOR_LENGTH},${centerY}" fill="none"/>`;

            endX = result.endX + CONNECTOR_LENGTH;
            break;
        }

        case 'zeroOrMore': {
            const child = node.children![0];
            const childWidth = getNodeWidth(child);
            const centerY = y + NODE_HEIGHT / 2;
            const loopY = y - LINE_SPACING;
            const bypassY = y + NODE_HEIGHT + LINE_SPACING / 2;

            // Main path
            svg += `<line class="connector" x1="${x}" y1="${centerY}" x2="${x + CONNECTOR_LENGTH}" y2="${centerY}"/>`;
            const result = renderNode(child, x + CONNECTOR_LENGTH, y);
            svg += result.svg;
            svg += `<line class="connector" x1="${result.endX}" y1="${centerY}" x2="${result.endX + CONNECTOR_LENGTH}" y2="${centerY}"/>`;

            // Loop back path
            svg += `<path class="connector loop" d="M${result.endX},${centerY} Q${result.endX + CONNECTOR_LENGTH / 2},${loopY} ${x + CONNECTOR_LENGTH + childWidth / 2},${loopY} Q${x + CONNECTOR_LENGTH / 2},${loopY} ${x + CONNECTOR_LENGTH},${centerY}" fill="none"/>`;

            // Bypass path
            svg += `<path class="connector bypass" d="M${x},${centerY} Q${x},${bypassY} ${x + CONNECTOR_LENGTH / 2},${bypassY} L${result.endX + CONNECTOR_LENGTH / 2},${bypassY} Q${result.endX + CONNECTOR_LENGTH},${bypassY} ${result.endX + CONNECTOR_LENGTH},${centerY}" fill="none"/>`;

            endX = result.endX + CONNECTOR_LENGTH;
            break;
        }

        case 'oneOrMore': {
            const child = node.children![0];
            const childWidth = getNodeWidth(child);
            const centerY = y + NODE_HEIGHT / 2;
            const loopY = y - LINE_SPACING;

            // Main path
            svg += `<line class="connector" x1="${x}" y1="${centerY}" x2="${x + CONNECTOR_LENGTH}" y2="${centerY}"/>`;
            const result = renderNode(child, x + CONNECTOR_LENGTH, y);
            svg += result.svg;
            svg += `<line class="connector" x1="${result.endX}" y1="${centerY}" x2="${result.endX + CONNECTOR_LENGTH}" y2="${centerY}"/>`;

            // Loop back path
            svg += `<path class="connector loop" d="M${result.endX},${centerY} Q${result.endX + CONNECTOR_LENGTH / 2},${loopY} ${x + CONNECTOR_LENGTH + childWidth / 2},${loopY} Q${x + CONNECTOR_LENGTH / 2},${loopY} ${x + CONNECTOR_LENGTH},${centerY}" fill="none"/>`;

            endX = result.endX + CONNECTOR_LENGTH;
            break;
        }
    }

    return { svg, endX };
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ============================================
// DIAGRAM DEFINITIONS
// ============================================

function getDiagramForRule(rule: GrammarRule): DiagramNode {
    switch (rule) {
        case 'transformation':
            return Sequence(
                Terminal('transformation'),
                NonTerminal('name'),
                Terminal('from'),
                NonTerminal('sourceMM'),
                Terminal('to'),
                NonTerminal('targetMM'),
                ZeroOrMore(
                    Choice(
                        NonTerminal('classMapping'),
                        NonTerminal('helper')
                    )
                )
            );

        case 'classMapping':
            return Sequence(
                NonTerminal('SourceClass'),
                Terminal('->'),
                NonTerminal('TargetClass'),
                Optional(NonTerminal('multiplicity')),
                Optional(NonTerminal('condition')),
                Terminal('{'),
                NonTerminal('mappingBody'),
                Terminal('}')
            );

        case 'multiplicity':
            return Sequence(
                Terminal('['),
                NonTerminal('int'),
                Terminal('..'),
                Choice(
                    NonTerminal('int'),
                    Terminal('*')
                ),
                Terminal(']')
            );

        case 'condition':
            return Sequence(
                Terminal('where'),
                NonTerminal('expression')
            );

        case 'mappingBody':
            return ZeroOrMore(NonTerminal('attributeMapping'));

        case 'attributeMapping':
            return Sequence(
                NonTerminal('targetFeature'),
                Terminal(':='),
                NonTerminal('expression')
            );

        case 'helper':
            return Sequence(
                Terminal('helper'),
                NonTerminal('ID'),
                Terminal('('),
                Optional(NonTerminal('params')),
                Terminal(')'),
                Terminal('->'),
                NonTerminal('TYPE'),
                Terminal('{'),
                NonTerminal('expr'),
                Terminal('}')
            );

        case 'parameter':
            return Sequence(
                NonTerminal('ID'),
                Terminal(':'),
                NonTerminal('TYPE'),
                ZeroOrMore(
                    Sequence(
                        Terminal(','),
                        NonTerminal('ID'),
                        Terminal(':'),
                        NonTerminal('TYPE')
                    )
                )
            );

        case 'expression':
            return Sequence(
                NonTerminal('primary'),
                ZeroOrMore(
                    Sequence(
                        Terminal('.'),
                        NonTerminal('member')
                    )
                )
            );

        case 'memberAccess':
            return Sequence(
                NonTerminal('ID'),
                Optional(
                    Sequence(
                        Terminal('('),
                        Optional(NonTerminal('args')),
                        Terminal(')')
                    )
                )
            );

        case 'literal':
            return Choice(
                NonTerminal('STRING'),
                NonTerminal('NUMBER'),
                NonTerminal('BOOLEAN')
            );

        // ================================================
        // INTERACTIVE STATEMENTS & EXPRESSIONS
        // ================================================

        case 'interactiveStatement':
            return Choice(
                NonTerminal('alertStatement'),
                NonTerminal('notifyStatement')
            );

        case 'alertStatement':
            return Sequence(
                Terminal('alert'),
                Terminal('('),
                NonTerminal('expression'),
                Optional(
                    Sequence(
                        Terminal(','),
                        NonTerminal('alertType')
                    )
                ),
                Terminal(')')
            );

        case 'notifyStatement':
            return Sequence(
                Terminal('notify'),
                Terminal('('),
                NonTerminal('expression'),
                Optional(
                    Sequence(
                        Terminal(','),
                        NonTerminal('NUMBER')
                    )
                ),
                Terminal(')')
            );

        case 'promptExpression':
            return Sequence(
                Terminal('prompt'),
                Terminal('('),
                NonTerminal('expression'),
                Optional(
                    Sequence(
                        Terminal(','),
                        NonTerminal('expression')
                    )
                ),
                Terminal(')')
            );

        case 'inputExpression':
            return Sequence(
                Terminal('input'),
                Terminal('('),
                NonTerminal('expression'),
                Terminal(','),
                NonTerminal('inputType'),
                Optional(
                    Sequence(
                        Terminal(','),
                        Choice(
                            NonTerminal('expression'),
                            NonTerminal('arrayLiteral')
                        )
                    )
                ),
                Terminal(')')
            );

        case 'alertType':
            return Choice(
                Terminal('"info"'),
                Terminal('"warning"'),
                Terminal('"error"'),
                Terminal('"success"')
            );

        case 'inputType':
            return Choice(
                Terminal('"string"'),
                Terminal('"number"'),
                Terminal('"boolean"'),
                Terminal('"date"'),
                Terminal('"select"')
            );

        default:
            return NonTerminal(rule);
    }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Render a grammar rule diagram to a container
 */
export function renderDiagram(rule: GrammarRule, container: HTMLElement): void {
    const diagram = getDiagramForRule(rule);
    const padding = 30;

    // Calculate dimensions
    const width = getNodeWidth(diagram) + padding * 2 + CONNECTOR_LENGTH * 2;
    const height = getNodeHeight(diagram) + padding * 2 + LINE_SPACING * 2;

    // Render diagram content
    const startX = padding;
    const startY = padding + LINE_SPACING;
    const centerY = startY + NODE_HEIGHT / 2;

    let svgContent = '';

    // Entry arrow
    svgContent += `<line class="connector" x1="${padding / 2}" y1="${centerY}" x2="${startX}" y2="${centerY}"/>`;
    svgContent += `<polygon class="arrow" points="${startX - ARROW_SIZE},${centerY - ARROW_SIZE / 2} ${startX},${centerY} ${startX - ARROW_SIZE},${centerY + ARROW_SIZE / 2}"/>`;

    // Render the diagram
    const result = renderNode(diagram, startX, startY);
    svgContent += result.svg;

    // Exit arrow
    const exitX = result.endX + CONNECTOR_LENGTH;
    svgContent += `<line class="connector" x1="${result.endX}" y1="${centerY}" x2="${exitX}" y2="${centerY}"/>`;
    svgContent += `<polygon class="arrow" points="${exitX},${centerY - ARROW_SIZE / 2} ${exitX + ARROW_SIZE},${centerY} ${exitX},${centerY + ARROW_SIZE / 2}"/>`;

    // Build final SVG
    const svg = `
        <svg class="railroad-diagram" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
            <defs>
                <style>
                    .connector { stroke: #64748b; stroke-width: 2; fill: none; }
                    .bypass { stroke-dasharray: 4,2; }
                    .loop { stroke: #94a3b8; }
                    .arrow { fill: #64748b; stroke: none; }
                    .terminal { fill: #f0f9ff; stroke: #0ea5e9; stroke-width: 1.5; }
                    .terminal-text { fill: #0369a1; font-family: 'IBM Plex Mono', Monaco, monospace; font-size: 12px; font-weight: 600; text-anchor: middle; }
                    .nonterminal { fill: #fefce8; stroke: #ca8a04; stroke-width: 1.5; }
                    .nonterminal-text { fill: #854d0e; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; text-anchor: middle; }
                </style>
            </defs>
            ${svgContent}
        </svg>
    `;

    container.innerHTML = svg;
}

/**
 * Export diagram as SVG string
 */
export function exportDiagramAsSVG(rule: GrammarRule): string {
    const container = document.createElement('div');
    renderDiagram(rule, container);
    return container.innerHTML;
}
