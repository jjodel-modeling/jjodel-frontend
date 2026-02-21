/**
 * AST to Grammar Rule Mapping
 *
 * Maps cursor position in the editor to the corresponding grammar rule
 * Used for highlighting the grammar tab when the cursor moves in the editor
 */

import type {
    ASTNode,
    TransformationAST,
    ClassMappingAST,
    AttributeMappingAST,
    ConversionAST,
    ValueMappingAST,
    MultiplicityAST,
    HelperAST,
    ParameterAST,
    ObjectCreationAST,
    ExpressionAST,
    AlertStatementAST,
    NotifyStatementAST,
    PromptExpressionAST,
    InputExpressionAST,
    LiteralAST,
    MemberAccessAST,
} from '../types/ast';
import type { GrammarRule } from '../components/GrammarDiagram/types';

interface CursorPosition {
    line: number;
    column: number;
}

/**
 * Check if a cursor position is within an AST node's location
 */
function isPositionInNode(pos: CursorPosition, node: ASTNode): boolean {
    if (!node.location) return false;

    const { start, end } = node.location;

    // Check if cursor is between start and end
    if (pos.line < start.line || pos.line > end.line) {
        return false;
    }

    if (pos.line === start.line && pos.column < start.column) {
        return false;
    }

    if (pos.line === end.line && pos.column > end.column) {
        return false;
    }

    return true;
}

/**
 * Find the deepest AST node that contains the cursor position
 */
function findNodeAtPosition(ast: TransformationAST, pos: CursorPosition): ASTNode | null {
    let deepestNode: ASTNode | null = null;

    function visit(node: ASTNode | null): void {
        if (!node || !node.location) return;

        if (isPositionInNode(pos, node)) {
            deepestNode = node;

            // Visit children based on node type
            switch (node.type) {
                case 'Transformation': {
                    const t = node as TransformationAST;
                    t.mappings.forEach(visit);
                    t.helpers.forEach(visit);
                    break;
                }
                case 'ClassMapping': {
                    const cm = node as ClassMappingAST;
                    if (cm.targetMultiplicity) visit(cm.targetMultiplicity);
                    if (cm.condition) visitExpression(cm.condition);
                    cm.body.forEach(item => visit(item as ASTNode));
                    break;
                }
                case 'AttributeMapping': {
                    const am = node as AttributeMappingAST;
                    if (am.conversion) visit(am.conversion);
                    if (am.objectCreation) visit(am.objectCreation);
                    break;
                }
                case 'Conversion': {
                    const c = node as ConversionAST;
                    if (c.mappings) c.mappings.forEach(visit);
                    if (c.expression) visitExpression(c.expression);
                    break;
                }
                case 'ObjectCreation': {
                    const oc = node as ObjectCreationAST;
                    oc.body.forEach(visit);
                    break;
                }
                case 'Helper': {
                    const h = node as HelperAST;
                    h.parameters.forEach(visit);
                    visitExpression(h.body);
                    break;
                }
                case 'AlertStatement': {
                    const a = node as AlertStatementAST;
                    visitExpression(a.message);
                    break;
                }
                case 'NotifyStatement': {
                    const n = node as NotifyStatementAST;
                    visitExpression(n.message);
                    break;
                }
                case 'PromptExpression': {
                    const p = node as PromptExpressionAST;
                    visitExpression(p.message);
                    if (p.defaultValue) visitExpression(p.defaultValue);
                    break;
                }
                case 'InputExpression': {
                    const i = node as InputExpressionAST;
                    visitExpression(i.message);
                    if (i.defaultValue) visitExpression(i.defaultValue);
                    break;
                }
            }
        }
    }

    function visitExpression(expr: ExpressionAST | null): void {
        if (!expr) return;
        visit(expr as ASTNode);

        // Handle expression-specific children
        switch (expr.type) {
            case 'MemberAccess':
            case 'NullSafeMemberAccess': {
                const ma = expr as MemberAccessAST;
                visitExpression(ma.object);
                break;
            }
            case 'FunctionCall':
            case 'NullSafeFunctionCall': {
                const fc = expr as any;
                visitExpression(fc.callee);
                fc.arguments?.forEach(visitExpression);
                break;
            }
            case 'BinaryExpression': {
                const be = expr as any;
                visitExpression(be.left);
                visitExpression(be.right);
                break;
            }
            case 'UnaryExpression': {
                const ue = expr as any;
                visitExpression(ue.operand);
                break;
            }
            case 'ConditionalExpression': {
                const ce = expr as any;
                visitExpression(ce.condition);
                visitExpression(ce.thenBranch);
                if (ce.elseBranch) visitExpression(ce.elseBranch);
                break;
            }
            case 'LambdaExpression': {
                const le = expr as any;
                visitExpression(le.body);
                break;
            }
            case 'ArrayLiteral': {
                const al = expr as any;
                al.elements?.forEach(visitExpression);
                break;
            }
        }
    }

    // Start traversal
    visit(ast);
    return deepestNode;
}

/**
 * Map an AST node type to a grammar rule
 */
function nodeTypeToGrammarRule(node: ASTNode): GrammarRule | null {
    switch (node.type) {
        case 'Transformation':
            return 'transformation';

        case 'ClassMapping':
            return 'classMapping';

        case 'Multiplicity':
            return 'multiplicity';

        case 'AttributeMapping':
            return 'attributeMapping';

        case 'Conversion':
            return 'conversion';

        case 'ValueMapping':
            return 'valueMapping';

        case 'ObjectCreation':
            return 'objectCreation';

        case 'Helper':
            return 'helper';

        case 'Parameter':
            return 'parameter';

        case 'Literal':
            return 'literal';

        case 'Identifier':
        case 'MemberAccess':
        case 'NullSafeMemberAccess':
            return 'memberAccess';

        case 'FunctionCall':
        case 'NullSafeFunctionCall':
        case 'BinaryExpression':
        case 'UnaryExpression':
        case 'ConditionalExpression':
        case 'NullCoalesceExpression':
        case 'IsTypeExpression':
        case 'LambdaExpression':
            return 'expression';

        case 'AlertStatement':
            return 'alertStatement';

        case 'NotifyStatement':
            return 'notifyStatement';

        case 'PromptExpression':
            return 'promptExpression';

        case 'InputExpression':
            return 'inputExpression';

        default:
            return null;
    }
}

/**
 * Get the grammar rule corresponding to a cursor position in the editor
 *
 * @param ast The parsed transformation AST
 * @param line 1-based line number
 * @param column 1-based column number
 * @returns The grammar rule to highlight, or null if no matching rule
 */
export function getGrammarRuleAtPosition(
    ast: TransformationAST | null,
    line: number,
    column: number
): GrammarRule | null {
    if (!ast) return null;

    const pos: CursorPosition = { line, column };
    const node = findNodeAtPosition(ast, pos);

    if (!node) {
        // Cursor is somewhere in the transformation but not in a specific node
        // Return 'transformation' as a fallback
        return 'transformation';
    }

    return nodeTypeToGrammarRule(node);
}

/**
 * Get all grammar rules that apply to a range in the editor
 * (useful for selection-based highlighting)
 */
export function getGrammarRulesInRange(
    ast: TransformationAST | null,
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number
): GrammarRule[] {
    if (!ast) return [];

    const rules = new Set<GrammarRule>();

    // Get rules at start and end positions
    const startRule = getGrammarRuleAtPosition(ast, startLine, startColumn);
    const endRule = getGrammarRuleAtPosition(ast, endLine, endColumn);

    if (startRule) rules.add(startRule);
    if (endRule) rules.add(endRule);

    return Array.from(rules);
}
