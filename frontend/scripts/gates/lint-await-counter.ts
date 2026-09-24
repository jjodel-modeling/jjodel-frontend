// The lost-update pattern that printed ALL GREEN over failures (P-2026-09-24-1005):
//
//     failures += await e2e.run(...)
//
// evaluates `failures + await ...` with the left operand read BEFORE the await and
// the sum written AFTER it, so every increment made while the await was pending is
// overwritten. Found by parsing, not by matching text: the pattern also appears in
// strings, comments and this very header, and `n += 1 + (await f()).length` does
// not look like it. The fix is `const r = await f(); failures += r;`.
//
// Pure: source text in, findings out. The CLI that walks the disk is check-scripts.ts.

import ts from 'typescript';

export interface AwaitCounterFinding {
    line: number;
    column: number;
    kind: 'compound' | 'self-assign';
    operator: string;
    /** First line of the offending statement, for the report. */
    text: string;
}

/** `x <op>= <rhs>`: reads x, then evaluates the rhs, then writes. */
const COMPOUND_OPERATORS = new Set<ts.SyntaxKind>([
    ts.SyntaxKind.PlusEqualsToken,
    ts.SyntaxKind.MinusEqualsToken,
    ts.SyntaxKind.AsteriskEqualsToken,
    ts.SyntaxKind.AsteriskAsteriskEqualsToken,
    ts.SyntaxKind.SlashEqualsToken,
    ts.SyntaxKind.PercentEqualsToken,
    ts.SyntaxKind.LessThanLessThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.AmpersandEqualsToken,
    ts.SyntaxKind.BarEqualsToken,
    ts.SyntaxKind.CaretEqualsToken,
    ts.SyntaxKind.BarBarEqualsToken,
    ts.SyntaxKind.AmpersandAmpersandEqualsToken,
    ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

/** The binary operators an `x = x <op> ...` can spell the same read-modify-write with. */
const BINARY_OPERATORS = new Set<ts.SyntaxKind>([
    ts.SyntaxKind.PlusToken,
    ts.SyntaxKind.MinusToken,
    ts.SyntaxKind.AsteriskToken,
    ts.SyntaxKind.AsteriskAsteriskToken,
    ts.SyntaxKind.SlashToken,
    ts.SyntaxKind.PercentToken,
    ts.SyntaxKind.LessThanLessThanToken,
    ts.SyntaxKind.GreaterThanGreaterThanToken,
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
    ts.SyntaxKind.AmpersandToken,
    ts.SyntaxKind.BarToken,
    ts.SyntaxKind.CaretToken,
    ts.SyntaxKind.BarBarToken,
    ts.SyntaxKind.AmpersandAmpersandToken,
    ts.SyntaxKind.QuestionQuestionToken,
]);

/**
 * An await inside the expression that belongs to the SAME function: an await in a
 * nested function, arrow or method suspends that function, not this one. A
 * top-level await counts (the file is the function). `for await` is a statement
 * modifier, not an AwaitExpression, and does not count.
 */
function containsAwait(node: ts.Node): boolean {
    if (ts.isAwaitExpression(node)) return true;
    if (ts.isFunctionLike(node)) return false;
    return ts.forEachChild(node, containsAwait) ?? false;
}

function unwrap(e: ts.Expression): ts.Expression {
    while (ts.isParenthesizedExpression(e)) e = e.expression;
    return e;
}

/** The operand a `a <op> b <op> c` chain reads first: `a`, walking the left spine. */
function leftmostOperand(e: ts.Expression): ts.Expression {
    e = unwrap(e);
    while (ts.isBinaryExpression(e) && BINARY_OPERATORS.has(e.operatorToken.kind)) e = unwrap(e.left);
    return e;
}

export function findAwaitCounters(source: string, fileName: string): AwaitCounterFinding[] {
    const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
    const findings: AwaitCounterFinding[] = [];

    const report = (node: ts.BinaryExpression, kind: AwaitCounterFinding['kind']): void => {
        const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        findings.push({
            line: line + 1,
            column: character + 1,
            kind,
            operator: node.operatorToken.getText(sf),
            text: node.getText(sf).split('\n')[0].trim(),
        });
    };

    const visit = (node: ts.Node): void => {
        if (ts.isBinaryExpression(node)) {
            const op = node.operatorToken.kind;
            if (COMPOUND_OPERATORS.has(op)) {
                if (containsAwait(node.right)) report(node, 'compound');
            } else if (op === ts.SyntaxKind.EqualsToken) {
                const rhs = unwrap(node.right);
                if (
                    ts.isBinaryExpression(rhs) &&
                    BINARY_OPERATORS.has(rhs.operatorToken.kind) &&
                    leftmostOperand(rhs).getText(sf) === node.left.getText(sf) &&
                    containsAwait(rhs)
                ) {
                    report(node, 'self-assign');
                }
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);

    return findings;
}
