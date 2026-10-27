/**
 * reservedIdentifierGate — Jjodie never runs a script that declares a reserved identifier
 * (P-2026-10-10-0045).
 *
 * Rule 8 of the system prompt asks the model not to use the reserved words, and a prompt
 * instruction is probabilistic. This module is the check behind it, in two places:
 *
 * - `gateReply`, called by `Jodie.tsx` on every reply before it is shown. A reply whose JjScript
 *   declares a reserved identifier gets ONE repair turn through the model; the user sees only the
 *   repaired reply, with one line naming the identifiers it replaced. A repair that still
 *   violates, or that fails, is shown with a line listing the names.
 * - `findReservedDeclarations`, called by `ScriptBlock` before Run and before Step, so a script
 *   that still declares one is refused before command 1.
 *
 * What counts (the GO of P-2026-10-10-0045): a declared name that is a word of
 * `RESERVED_IDENTIFIERS`, matched exactly and lowercase like the lexer; and a class or enum named
 * after a primitive type name, in any case, since `type <name>` always resolves to the primitive.
 * Feature names are not checked against the primitive type names.
 *
 * Declarations are read from tokens, not from `parse`: the parser rejects a command word as a
 * name (`Expected element name, found 'copy'`), so a parse would hide the very name to report.
 * Typed scripts never pass through here: the JjScript console does not mount `ScriptBlock`.
 *
 * Pure: the lexer, the word lists and the detector only, so it runs under the node bench.
 */

import { tokenize } from '../../jjscript/parser/lexer';
import { isReservedIdentifier } from '../../jjscript/reservedIdentifiers';
import { JJSCRIPT_PRIMITIVE_TYPE_NAMES } from '../../jjscript/types';
import { isJjScriptCode } from '../../jjscript/normalizer/detector';

export type ReservedReason = 'reserved-word' | 'primitive-type-name';

export interface ReservedDeclaration {
    /** The declared name, as written. */
    name: string;
    /** 1-based line in the script, the editor line `ScriptBlock` shows. */
    line: number;
    /** The trimmed line that declares it. */
    command: string;
    reason: ReservedReason;
}

export interface ReplyGateResult {
    /** The reply to show: the original, or the repaired one, with its notice line on top. */
    content: string;
    /** Repair turns made: 0 or 1. */
    repairCalls: number;
    /** The identifiers a successful repair replaced. */
    replaced: string[];
    /** What the shown reply still declares; non-empty means Run and Step will refuse it. */
    remaining: ReservedDeclaration[];
}

/** Element types whose name is declared by `create <kind> <name>`. `instance` names are strings. */
const DECLARING_KINDS: ReadonlySet<string> = new Set([
    'class', 'interface', 'attribute', 'reference', 'containment', 'composition',
    'operation', 'parameter', 'package', 'enum', 'enumeration', 'literal',
]);

/** The kinds whose name a `type` clause can mean, so a primitive type name shadows it. */
const CLASSIFIER_KINDS: ReadonlySet<string> = new Set(['class', 'interface', 'enum', 'enumeration']);

/** Token types the lexer can give a word written in a name position. */
const NAME_TOKEN_TYPES: ReadonlySet<string> = new Set(['IDENTIFIER', 'KEYWORD', 'COMMAND', 'BOOLEAN', 'QUALIFIED_NAME']);

/** The last segment of `Pkg::Name` or `Class.member`, which is the name being declared. */
function lastSegment(value: string): string {
    const parts = value.split(/::|\./);
    return parts[parts.length - 1];
}

function verdict(name: string, kind: string | undefined): ReservedReason | undefined {
    if (isReservedIdentifier(name)) return 'reserved-word';
    if (kind && CLASSIFIER_KINDS.has(kind) && JJSCRIPT_PRIMITIVE_TYPE_NAMES.has(name.toLowerCase())) {
        return 'primitive-type-name';
    }
    return undefined;
}

/**
 * The reserved identifiers a script declares, in script order. Reads `create <kind> <name>`
 * (with `create abstract class <name>`) and the new name of `rename … to|as <name>`. Skips the
 * lines a run skips: blank, `//` and `#` comments, `target …`.
 */
export function findReservedDeclarations(script: string): ReservedDeclaration[] {
    const found: ReservedDeclaration[] = [];
    const lines = script.split('\n');

    for (let idx = 0; idx < lines.length; idx++) {
        const trimmed = lines[idx].trim();
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
        if (trimmed.toLowerCase().startsWith('target ')) continue;

        const tokens = tokenize(trimmed).filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF');
        if (tokens.length < 3 || tokens[0].type !== 'COMMAND') continue;

        let kind: string | undefined;
        let nameAt = -1;
        if (tokens[0].value === 'create') {
            kind = tokens[1].value.toLowerCase();
            nameAt = 2;
            if (kind === 'abstract' && tokens[2]?.value.toLowerCase() === 'class') {
                kind = 'class';
                nameAt = 3;
            }
            if (!DECLARING_KINDS.has(kind)) continue;
        } else if (tokens[0].value === 'rename') {
            const head = tokens[1].value.toLowerCase();
            kind = DECLARING_KINDS.has(head) ? head : undefined;
            const toAt = tokens.findIndex((t, j) => j > 1 && (t.value.toLowerCase() === 'to' || t.value.toLowerCase() === 'as'));
            if (toAt < 0) continue;
            nameAt = toAt + 1;
        } else {
            continue;
        }

        const nameToken = tokens[nameAt];
        if (!nameToken || !NAME_TOKEN_TYPES.has(nameToken.type)) continue;
        const name = lastSegment(nameToken.value);
        const reason = verdict(name, kind);
        if (reason) found.push({ name, line: idx + 1, command: trimmed, reason });
    }

    return found;
}

/**
 * The scripts of a reply the chat would offer to run: fenced, multi-line blocks tagged `jjscript`
 * or `jjs`, or recognised as JjScript, the same selection as `MarkdownRenderer`'s CodeBlock.
 */
export function replyScripts(reply: string): string[] {
    const scripts: string[] = [];
    const fence = /```([^\n`]*)\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = fence.exec(reply)) !== null) {
        const language = match[1].trim().split(/\s+/)[0].toLowerCase();
        const code = match[2].replace(/\n$/, '');
        if (!code.includes('\n')) continue;
        if (language === 'jjscript' || language === 'jjs' || isJjScriptCode(code)) scripts.push(code);
    }
    return scripts;
}

/** The reserved identifiers declared by every runnable script of a reply. */
export function findReservedInReply(reply: string): ReservedDeclaration[] {
    return replyScripts(reply).flatMap(findReservedDeclarations);
}

function reasonText(found: ReservedDeclaration): string {
    return found.reason === 'reserved-word' ? 'a JjScript reserved word' : 'a primitive type name, used for a class or an enum';
}

/** Each name once, in the order first declared. */
function distinctNames(found: readonly ReservedDeclaration[]): string[] {
    return [...new Set(found.map(f => f.name))];
}

/** The repair turn sent to the model: what is wrong, where, and what to send back. */
export function buildRepairRequest(found: readonly ReservedDeclaration[]): string {
    const rows = found.map(f => `- \`${f.name}\` (line ${f.line}: \`${f.command}\`): ${reasonText(f)}`);
    return [
        'The JjScript in your previous reply cannot run: it declares identifiers that JjScript reserves.',
        ...rows,
        'Reply with the complete JjScript again, each of these identifiers renamed to a name that is not reserved, and nothing else changed. Reserved words match exactly and are lowercase (`copy` is reserved, `bookCopy` is not); a primitive type name, in any case, cannot name a class or an enum.',
    ].join('\n');
}

/** The refusal in words, for the chat notice and for `ScriptBlock`'s strip and summary. */
export function reservedRefusalMessage(found: readonly ReservedDeclaration[]): string {
    const list = found.map(f => `'${f.name}' (line ${f.line})`).join(', ');
    return `the script declares reserved identifiers: ${list}. Ask Jjodie to rename them.`;
}

function withNotice(reply: string, notice: string): string {
    return `> ${notice}\n\n${reply}`;
}

function refusedNotice(found: readonly ReservedDeclaration[]): string {
    const list = found.map(f => `\`${f.name}\` (line ${f.line})`).join(', ');
    return `Run and Step are refused: this script declares reserved identifiers, ${list}. Ask Jjodie to rename them.`;
}

/**
 * The gate on one reply. A clean reply passes untouched. Otherwise ONE repair turn goes to the
 * model through `askRepair`; the repaired reply is shown if it is clean, and if it still violates,
 * or the call fails, the reply is shown with the names and `ScriptBlock` refuses it. Never more
 * than one repair call: a model that keeps answering with a reserved name cannot loop.
 */
export async function gateReply(
    reply: string,
    askRepair: (request: string) => Promise<string>
): Promise<ReplyGateResult> {
    const first = findReservedInReply(reply);
    if (first.length === 0) return { content: reply, repairCalls: 0, replaced: [], remaining: [] };

    let repaired: string;
    try {
        repaired = await askRepair(buildRepairRequest(first));
    } catch (err) {
        console.warn('[Jodie] The repair turn for reserved identifiers failed; the reply is shown refused.', err);
        return { content: withNotice(reply, refusedNotice(first)), repairCalls: 1, replaced: [], remaining: first };
    }

    const second = findReservedInReply(repaired);
    if (second.length > 0) {
        return { content: withNotice(repaired, refusedNotice(second)), repairCalls: 1, replaced: [], remaining: second };
    }

    const replaced = distinctNames(first);
    const list = replaced.map(name => `\`${name}\``).join(', ');
    return {
        content: withNotice(repaired, `Reserved identifiers replaced before this reply was shown: ${list}.`),
        repairCalls: 1,
        replaced,
        remaining: [],
    };
}
