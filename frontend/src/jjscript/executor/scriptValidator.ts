/**
 * JjScript integrity validator — defense-in-depth against truncated AI-generated scripts.
 *
 * Jjodie generates JjScript with an LLM. When the model's output-token limit is reached
 * mid-generation the script is cut off, sometimes leaving a dangling command
 * (`set x.name =`) and sometimes an unterminated string (`... = "Foo`). Executing such a
 * script command-by-command leaves the model in a half-built state (the incident that
 * motivated this module: 218 of ~230 commands applied, a partial UART model left behind).
 *
 * This module validates the WHOLE script BEFORE the first command runs, so a truncated
 * script is refused with zero commands executed.
 *
 * Safety guarantee — no false positives: the parse check below uses the SAME `parse()`
 * the executor calls per command (`executor.ts` → `execute()` → `parse()`). Any line this
 * validator rejects is a line the executor would itself have failed on; the validator only
 * moves that failure earlier (before command 1) instead of mid-run. It never rejects a
 * script that would have executed cleanly.
 *
 * It additionally detects unterminated string literals, which the lexer silently tolerates
 * (`lexer.ts` `readString` stops at end-of-input without raising), so `parse()` alone would
 * not catch them.
 *
 * Known limitation: a truncation that happens to land on a syntactically- and
 * semantically-complete command is indistinguishable from an intentional command and is
 * NOT flagged. The canonical example is `create instance of Conn` — the instance handle is
 * optional and auto-generated, so this parses and executes as a valid command. Detecting it
 * would require a heuristic that also rejects legitimate auto-named-instance scripts, which
 * is why it is intentionally left uncaught.
 *
 * ── Forward references (second pass) ────────────────────────────────────────────────────
 *
 * A script can also be impossible to complete without being malformed: line 17 may use a
 * class that line 19 creates. JjScript is order-sensitive, so line 17 fails and the run
 * stops with 16 commands already applied. The second pass refuses that script too.
 *
 * Soundness rule, and why it holds only with `existingClassifierNames`: the pass flags a
 * reference to a simple name `X` when (1) `X` is absent from EVERY metamodel of the
 * project, so the reference cannot resolve and the line is certain to fail, and (2) a later
 * line declares `X`, which is what tells a forward reference apart from a plain typo. The
 * naive version of this rule ("if `X` did exist, the later declaration would fail as a
 * duplicate") is NOT available here: `create class|enum|package` performs no duplicate
 * check at all, so a second element with the same name is created happily. Measured in
 * `docs/discovery/discovery_2026-09-16_jjscript_forward_refs_structured_errors.md` §6, which
 * also records the two open defects behind it.
 *
 * Because the certainty in (1) comes from the name set, the pass runs ONLY when the caller
 * supplies one. Called without it, the validator behaves exactly as it did before.
 *
 * The pass is restricted to the three roles measured to fail hard when unresolved (report
 * §4.2): the parent of a nested element (`create attribute a in X`), a `type` / `returns`
 * clause, and the standalone `A extends B` command. It is NOT applied to
 * `create class A extends B`, whose missing superclass is dropped silently, nor to the
 * parent of a class, enum or package, which falls back instead of failing.
 *
 * Both sides of the comparison stay inside the CLASSIFIER namespace (class, abstract class,
 * interface, enum, enumeration, package). Features live in their own namespace, so
 * `create attribute Person in Order` does not count as declaring the class `Person`.
 */

import { parse } from '../parser/parser';
import {
    AddArgs,
    CommandNode,
    CopyArgs,
    CreateArgs,
    DeleteArgs,
    ElementType,
    ExtendsArgs,
    QualifiedName,
    RenameArgs,
    TypeReference,
} from '../types';

export interface ScriptValidationIssue {
    /** 1-based line number in the original script. */
    line: number;
    /** The offending (trimmed) command text. */
    command: string;
    /** Human-readable cause. */
    reason: string;
    /**
     * Which check produced the issue. Absent means `'malformed'`, the truncation/parse
     * check, so existing callers keep their wording unchanged.
     */
    kind?: 'malformed' | 'forward-reference';
}

export interface ScriptValidationResult {
    valid: boolean;
    /** Present only when `valid === false` — the first issue found (execution is refused). */
    issue?: ScriptValidationIssue;
}

/** Element types whose name lives in the classifier namespace. */
const CLASSIFIER_ELEMENT_TYPES: ReadonlySet<string> = new Set<ElementType>([
    'class', 'abstract class', 'interface', 'enum', 'enumeration', 'package',
]);

/**
 * Element types that cannot be created without a parent: `create.ts` returns
 * PARENT_NOT_FOUND for them (`needsParent`), so an unresolved parent is a certain failure.
 */
const NESTED_ELEMENT_TYPES: ReadonlySet<string> = new Set<ElementType>([
    'attribute', 'reference', 'containment', 'composition', 'operation', 'parameter', 'literal',
]);

/**
 * Element types carrying a `type` / `returns` clause that is resolved strictly:
 * `resolveTypeClause` fails with UNKNOWN_<KIND>_TYPE when the name is not a primitive and
 * not a reachable classifier.
 */
const TYPED_ELEMENT_TYPES: ReadonlySet<string> = new Set<ElementType>([
    'attribute', 'reference', 'containment', 'composition', 'parameter', 'operation',
]);

/**
 * Commands whose effect on the name space cannot be read statically: `forall` and `block`
 * hide their body from a single-command walk, `let` binds names, and `eval` is also the
 * parser's fallback for any unrecognised line. Any of them anywhere in the script disables
 * the forward-reference pass, because a name they bring into existence would satisfy a
 * reference this pass would otherwise call undeclared.
 */
const OPAQUE_COMMANDS: ReadonlySet<string> = new Set(['forall', 'block', 'let', 'eval']);

/**
 * Detect a string literal that opens but never closes on the same line. Mirrors the lexer's
 * escaping rule (a backslash escapes the next character) but, unlike the lexer, reports the
 * unterminated case instead of silently closing it at end-of-input.
 */
function hasUnterminatedString(line: string): boolean {
    let i = 0;
    const n = line.length;
    while (i < n) {
        const ch = line[i];
        if (ch === '"' || ch === "'") {
            const quote = ch;
            i++;
            let closed = false;
            while (i < n) {
                if (line[i] === '\\') { i += 2; continue; } // escape: skip escaped char
                if (line[i] === quote) { closed = true; i++; break; }
                i++;
            }
            if (!closed) return true; // reached end-of-line still inside the string
        } else {
            i++;
        }
    }
    return false;
}

/**
 * Collect the names already present in the project, from the metamodel proxies handed in.
 *
 * Pure on purpose: the caller does the L-layer access, this walks plain objects so it can be
 * tested. It reads EVERY metamodel, not just the run's target, because an unbound reference
 * also resolves project-wide, so a name living in a sibling metamodel makes the earlier
 * reference succeed.
 *
 * Over-collecting is the safe direction: an extra name can only suppress a refusal, never
 * cause one, which is why non-classifier children are swept in too rather than filtered.
 */
export function collectClassifierNames(metamodels: readonly any[]): Set<string> {
    const names = new Set<string>();

    const sweep = (bucket: any): void => {
        if (!Array.isArray(bucket)) return;
        for (const el of bucket) {
            if (el && typeof el.name === 'string' && el.name) names.add(el.name);
        }
    };

    for (const mm of metamodels || []) {
        if (!mm) continue;
        sweep(mm.classes);
        sweep(mm.enumerators);
        sweep(mm.packages);
        sweep(mm.children);
        if (Array.isArray(mm.packages)) {
            for (const pkg of mm.packages) {
                if (!pkg) continue;
                sweep(pkg.classes);
                sweep(pkg.enumerators);
                sweep(pkg.children);
            }
        }
    }

    return names;
}

/** The single name a qualified name denotes, or undefined when it is qualified (`A::B`). */
function simpleName(qn: QualifiedName | undefined): string | undefined {
    if (!qn || qn.segments.length !== 1) return undefined;
    const name = qn.segments[0];
    return name || undefined;
}

/** Every identifier a qualified name mentions, used to build the skip set. */
function allNames(qn: QualifiedName | undefined): string[] {
    if (!qn) return [];
    return qn.member ? [...qn.segments, qn.member] : [...qn.segments];
}

/** The classifier a `type` / `returns` clause names, when it is a simple name. */
function typeClauseName(typeRef: TypeReference | undefined): string | undefined {
    if (!typeRef) return undefined;
    if (typeRef.kind === 'class' || typeRef.kind === 'enum') return simpleName(typeRef.name);
    return undefined;
}

/**
 * The classifier this command declares, if any. `create instance of Person` is not one:
 * its `args.name` is the class being instantiated, and `'instance'` is not a classifier
 * element type, so the set membership test already excludes it.
 */
function declaredClassifier(ast: CommandNode): string | undefined {
    if (ast.command === 'create') {
        const args = ast.args as CreateArgs;
        return CLASSIFIER_ELEMENT_TYPES.has(args.elementType) ? args.name : undefined;
    }
    if (ast.command === 'add') {
        const args = ast.args as AddArgs;
        return CLASSIFIER_ELEMENT_TYPES.has(args.elementType) ? args.name : undefined;
    }
    return undefined;
}

/**
 * The simple classifier names this command references in a role that fails hard when the
 * name does not resolve. `add` is included because it is converted to a `create` with
 * `parent = to` before execution (`commands/add.ts`), so it runs the same resolution.
 */
function hardClassifierReferences(ast: CommandNode): string[] {
    const out: string[] = [];

    const push = (name: string | undefined): void => { if (name) out.push(name); };

    if (ast.command === 'extends') {
        const args = ast.args as ExtendsArgs;
        push(simpleName(args.childClass));
        push(simpleName(args.parentClass));
        return out;
    }

    let elementType: ElementType | undefined;
    let parent: QualifiedName | undefined;
    let options: CreateArgs['options'];

    if (ast.command === 'create') {
        const args = ast.args as CreateArgs;
        elementType = args.elementType;
        parent = args.parent;
        options = args.options;
    } else if (ast.command === 'add') {
        const args = ast.args as AddArgs;
        elementType = args.elementType;
        parent = args.to;
        options = args.options;
    } else {
        return out;
    }

    if (NESTED_ELEMENT_TYPES.has(elementType) && parent) {
        // `create parameter p in Shape.draw` carries the classifier in segments[0] and the
        // operation in `member`; the classifier is the part that must already exist.
        push(simpleName(parent));
    }
    if (TYPED_ELEMENT_TYPES.has(elementType)) {
        push(typeClauseName(options?.type));
        push(typeClauseName(options?.returnType));
    }

    return out;
}

/** Names a script mutates, which makes their existence at a given line unknowable here. */
function mutatedNames(ast: CommandNode): string[] {
    switch (ast.command) {
        case 'delete':
            return allNames((ast.args as DeleteArgs).target);
        case 'rename': {
            const args = ast.args as RenameArgs;
            return [...allNames(args.target), args.newName];
        }
        case 'copy': {
            const args = ast.args as CopyArgs;
            const extra = args.newName ? [args.newName] : [];
            return [...allNames(args.target), ...allNames(args.to), ...extra];
        }
        default:
            return [];
    }
}

interface ParsedLine {
    line: number;
    command: string;
    ast: CommandNode;
}

/**
 * Second pass: the first reference to a name that cannot resolve yet and is declared
 * further down the script. Returns undefined when nothing can be asserted.
 */
function findForwardReference(
    parsed: readonly ParsedLine[],
    existingClassifierNames: ReadonlySet<string>,
    targetDirectives: ReadonlySet<string>
): ScriptValidationIssue | undefined {
    // Two different `target` directives mean two namespaces, and "declared later" would no
    // longer be about the same metamodel as "referenced earlier".
    if (targetDirectives.size > 1) return undefined;

    for (const entry of parsed) {
        if (OPAQUE_COMMANDS.has(entry.ast.command)) return undefined;
    }

    const skip = new Set<string>();
    for (const entry of parsed) {
        for (const name of mutatedNames(entry.ast)) skip.add(name);
    }

    // First declaration wins: a name declared before the reference is not a forward one.
    const declaredAt = new Map<string, number>();
    for (const entry of parsed) {
        const name = declaredClassifier(entry.ast);
        if (name && !declaredAt.has(name)) declaredAt.set(name, entry.line);
    }

    for (const entry of parsed) {
        for (const name of hardClassifierReferences(entry.ast)) {
            if (existingClassifierNames.has(name)) continue;
            if (skip.has(name)) continue;
            const declLine = declaredAt.get(name);
            if (declLine === undefined || declLine <= entry.line) continue;
            return {
                line: entry.line,
                command: entry.command,
                kind: 'forward-reference',
                reason: `line ${entry.line} references '${name}', which is created at line ${declLine}. `
                      + 'Move the reference after it.',
            };
        }
    }

    return undefined;
}

/**
 * Validate an entire JjScript script for integrity before execution. Returns the first
 * problem found (execution should be refused entirely) or `{ valid: true }`.
 *
 * The executable-line filter mirrors `ScriptBlock`'s exactly (skip blank lines, `//` and `#`
 * comments, and `target ...` directives) so validation covers precisely the lines that would
 * be executed.
 *
 * `existingClassifierNames` are the names already present in the project (see
 * `collectClassifierNames`). Supplying them enables the forward-reference pass; omitting
 * them leaves only the malformed/truncated checks, which is the original behaviour.
 */
export function validateScriptIntegrity(
    script: string,
    existingClassifierNames?: ReadonlySet<string>
): ScriptValidationResult {
    const lines = script.split('\n');
    const parsed: ParsedLine[] = [];
    const targetDirectives = new Set<string>();

    for (let idx = 0; idx < lines.length; idx++) {
        const trimmed = lines[idx].trim();

        // Skip non-executable lines — must match ScriptBlock's command filter.
        if (!trimmed) continue;
        if (trimmed.startsWith('//')) continue;
        if (trimmed.startsWith('#')) continue;
        if (trimmed.toLowerCase().startsWith('target ')) {
            targetDirectives.add(trimmed.slice('target '.length).trim().toLowerCase());
            continue;
        }

        const line = idx + 1; // 1-based, original line number

        // 1) Unterminated string — the lexer swallows this, so parse() would not flag it.
        if (hasUnterminatedString(trimmed)) {
            return {
                valid: false,
                issue: {
                    line,
                    command: trimmed,
                    kind: 'malformed',
                    reason: 'unterminated string literal (a quote is opened but never closed)',
                },
            };
        }

        // 2) Incomplete / malformed command — same parser the executor uses, so any failure
        //    here is a line the executor would also have rejected.
        const result = parse(trimmed);
        if (!result.success) {
            const parserMsg = result.errors?.[0]?.message || 'could not be parsed as a complete command';
            return {
                valid: false,
                issue: { line, command: trimmed, kind: 'malformed', reason: parserMsg },
            };
        }
        if (result.ast) parsed.push({ line, command: trimmed, ast: result.ast });
    }

    // 3) Forward reference: only when the caller can say what already exists.
    if (existingClassifierNames) {
        const issue = findForwardReference(parsed, existingClassifierNames, targetDirectives);
        if (issue) return { valid: false, issue };
    }

    return { valid: true };
}
