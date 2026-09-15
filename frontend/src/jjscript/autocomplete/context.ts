/**
 * JjScript Autocomplete Context Detection
 * Analyzes partial input to determine what suggestions are appropriate
 */

import {
    AutocompleteContext,
    ParseContext,
    PartialToken,
    COMMAND_DEFS,
} from './types';

// ============================================
// CONTEXT DETECTOR
// ============================================

/**
 * Analyze input and determine autocomplete context
 */
export function detectContext(input: string, cursorPosition?: number): AutocompleteContext {
    const pos = cursorPosition ?? input.length;
    const textBeforeCursor = input.substring(0, pos);

    // Tokenize the input
    const tokens = tokenize(textBeforeCursor);

    // Find current word being typed
    const { currentWord, wordStart } = findCurrentWord(textBeforeCursor, pos);

    // Determine parse context
    const parseContext = determineParseContext(tokens, currentWord);

    // Extract command and other context info
    const command = findCommand(tokens);
    const elementType = findElementType(tokens);
    const targetName = findTargetName(tokens);
    const parentName = findParentName(tokens);

    return {
        input,
        cursorPosition: pos,
        currentWord,
        wordStart,
        parseContext,
        command,
        elementType,
        targetName,
        parentName,
        tokens,
    };
}

// ============================================
// TOKENIZER (simplified for autocomplete)
// ============================================

const COMMANDS = ['create', 'delete', 'rename', 'set', 'add', 'remove', 'move', 'copy', 'list', 'show', 'help', 'undo', 'redo', 'validate', 'clear'];
const ELEMENT_TYPES = ['class', 'abstract', 'interface', 'attribute', 'reference', 'operation', 'parameter', 'package', 'enum', 'literal'];
const KEYWORDS = ['in', 'to', 'from', 'as', 'with', 'type', 'extends', 'implements', 'default', 'cascade', 'force', 'deep', 'brief', 'full', 'tree', 'containment', 'opposite', 'derived', 'readonly'];

function tokenize(text: string): PartialToken[] {
    const tokens: PartialToken[] = [];
    let pos = 0;

    // Skip leading / if present
    if (text.startsWith('/')) {
        pos = 1;
    }

    while (pos < text.length) {
        // Skip whitespace
        while (pos < text.length && /\s/.test(text[pos])) {
            pos++;
        }

        if (pos >= text.length) break;

        const start = pos;
        let type: string;
        let value: string;

        // Check for operators and punctuation
        if (text[pos] === '=' || text[pos] === ':' || text[pos] === '.') {
            type = 'OPERATOR';
            value = text[pos];
            pos++;
        } else if (text[pos] === '[') {
            // Multiplicity
            const end = text.indexOf(']', pos);
            if (end !== -1) {
                value = text.substring(pos, end + 1);
                type = 'MULTIPLICITY';
                pos = end + 1;
            } else {
                value = text.substring(pos);
                type = 'MULTIPLICITY_PARTIAL';
                pos = text.length;
            }
        } else if (text[pos] === '"' || text[pos] === "'") {
            // String
            const quote = text[pos];
            pos++;
            const stringStart = pos;
            while (pos < text.length && text[pos] !== quote) {
                if (text[pos] === '\\' && pos + 1 < text.length) pos++;
                pos++;
            }
            value = text.substring(stringStart, pos);
            type = 'STRING';
            if (pos < text.length) pos++; // Skip closing quote
        } else if (/[0-9]/.test(text[pos]) || (text[pos] === '-' && pos + 1 < text.length && /[0-9]/.test(text[pos + 1]))) {
            // Number
            const numStart = pos;
            if (text[pos] === '-') pos++;
            while (pos < text.length && /[0-9.]/.test(text[pos])) {
                pos++;
            }
            value = text.substring(numStart, pos);
            type = 'NUMBER';
        } else if (/[a-zA-Z_]/.test(text[pos])) {
            // Identifier or keyword
            while (pos < text.length && /[a-zA-Z0-9_]/.test(text[pos])) {
                pos++;
            }
            value = text.substring(start, pos);
            const lower = value.toLowerCase();

            if (COMMANDS.includes(lower)) {
                type = 'COMMAND';
            } else if (ELEMENT_TYPES.includes(lower)) {
                type = 'ELEMENT_TYPE';
            } else if (KEYWORDS.includes(lower)) {
                type = 'KEYWORD';
            } else if (lower === 'true' || lower === 'false') {
                type = 'BOOLEAN';
            } else {
                type = 'IDENTIFIER';
            }
        } else {
            // Unknown character, skip
            value = text[pos];
            type = 'UNKNOWN';
            pos++;
        }

        tokens.push({ type, value, start, end: pos });
    }

    return tokens;
}

// ============================================
// WORD DETECTION
// ============================================

function findCurrentWord(text: string, cursorPos: number): { currentWord: string; wordStart: number } {
    // Find the start of the current word
    let wordStart = cursorPos;
    while (wordStart > 0 && /[a-zA-Z0-9_]/.test(text[wordStart - 1])) {
        wordStart--;
    }

    // Handle / prefix for commands
    if (wordStart > 0 && text[wordStart - 1] === '/') {
        wordStart--;
    }

    const currentWord = text.substring(wordStart, cursorPos);

    return { currentWord, wordStart };
}

// ============================================
// CONTEXT DETERMINATION
// ============================================

function determineParseContext(tokens: PartialToken[], currentWord: string): ParseContext {
    if (tokens.length === 0) {
        return 'start';
    }

    const lastToken = tokens[tokens.length - 1];
    const prevTokens = tokens.slice(0, -1);

    // Check if we're still typing the current token
    const isTypingLastToken = currentWord.length > 0 &&
        (lastToken.value.toLowerCase().startsWith(currentWord.toLowerCase()) ||
         currentWord.toLowerCase().startsWith(lastToken.value.toLowerCase()));

    const effectiveTokens = isTypingLastToken ? prevTokens : tokens;

    if (effectiveTokens.length === 0) {
        // Just started typing
        return 'start';
    }

    const firstToken = effectiveTokens[0];
    const lastEffective = effectiveTokens[effectiveTokens.length - 1];

    // If first token is a command
    if (firstToken.type === 'COMMAND') {
        const command = firstToken.value.toLowerCase();

        // After command, check what comes next
        if (effectiveTokens.length === 1) {
            // Just the command
            const def = COMMAND_DEFS.find(c => c.name === command);
            if (def && def.nextContexts.length > 0) {
                return def.nextContexts[0];
            }
            return 'element_type';
        }

        // Look at the last effective token
        switch (lastEffective.type) {
            case 'ELEMENT_TYPE':
                return 'name';
            case 'IDENTIFIER':
                return determineAfterIdentifier(effectiveTokens, command);
            case 'KEYWORD':
                return determineAfterKeyword(effectiveTokens, lastEffective.value.toLowerCase());
            case 'OPERATOR':
                if (lastEffective.value === '=') return 'value';
                if (lastEffective.value === '.') return 'property';
                if (lastEffective.value === ':') return 'type';
                return 'name';
            case 'MULTIPLICITY':
                return 'default';
            default:
                return 'keyword';
        }
    }

    // If we have an element type first (implicit create?)
    if (firstToken.type === 'ELEMENT_TYPE') {
        if (effectiveTokens.length === 1) {
            return 'name';
        }
        return 'keyword';
    }

    return 'start';
}

function determineAfterIdentifier(tokens: PartialToken[], command: string): ParseContext {
    // Count identifiers to understand structure
    const identifiers = tokens.filter(t => t.type === 'IDENTIFIER');
    const hasIn = tokens.some(t => t.type === 'KEYWORD' && t.value.toLowerCase() === 'in');
    const hasTo = tokens.some(t => t.type === 'KEYWORD' && t.value.toLowerCase() === 'to');
    const hasType = tokens.some(t => t.type === 'KEYWORD' && t.value.toLowerCase() === 'type');

    switch (command) {
        case 'create':
        case 'add':
            if (hasType) return 'type';
            if (hasIn) return 'keyword'; // Might need more options
            return 'keyword'; // in, type, extends, etc.

        case 'delete':
            return 'keyword'; // cascade, force

        case 'rename':
            if (hasTo) return 'name';
            return 'keyword'; // to

        case 'set':
            return 'keyword'; // expect . for property

        case 'move':
        case 'copy':
            if (hasTo) return 'keyword'; // as, deep
            return 'keyword'; // to

        case 'list':
            if (hasIn) return 'target';
            return 'keyword'; // in

        case 'show':
            return 'keyword'; // brief, full, tree

        default:
            return 'keyword';
    }
}

function determineAfterKeyword(tokens: PartialToken[], keyword: string): ParseContext {
    switch (keyword) {
        case 'in':
        case 'to':
        case 'from':
            return 'target';
        case 'type':
        case 'extends':
            return 'type';
        case 'as':
            return 'name';
        case 'default':
            return 'value';
        default:
            return 'name';
    }
}

// ============================================
// CONTEXT EXTRACTION
// ============================================

function findCommand(tokens: PartialToken[]): string | undefined {
    const commandToken = tokens.find(t => t.type === 'COMMAND');
    return commandToken?.value.toLowerCase();
}

function findElementType(tokens: PartialToken[]): string | undefined {
    const typeToken = tokens.find(t => t.type === 'ELEMENT_TYPE');
    if (!typeToken) return undefined;

    // Check for "abstract class" compound type
    const typeIndex = tokens.indexOf(typeToken);
    if (typeToken.value.toLowerCase() === 'abstract' &&
        typeIndex + 1 < tokens.length &&
        tokens[typeIndex + 1].type === 'ELEMENT_TYPE' &&
        tokens[typeIndex + 1].value.toLowerCase() === 'class') {
        return 'abstract class';
    }

    return typeToken.value.toLowerCase();
}

function findTargetName(tokens: PartialToken[]): string | undefined {
    // The first identifier after the element type is usually the name/target
    let foundType = false;
    for (const token of tokens) {
        if (token.type === 'ELEMENT_TYPE') {
            foundType = true;
            continue;
        }
        if (foundType && token.type === 'IDENTIFIER') {
            return token.value;
        }
        // For commands without element type, first identifier is target
        if (token.type === 'COMMAND') {
            const cmd = token.value.toLowerCase();
            if (['delete', 'rename', 'show', 'move', 'copy', 'set'].includes(cmd)) {
                const nextIdent = tokens.find(t => t.type === 'IDENTIFIER');
                return nextIdent?.value;
            }
        }
    }
    return undefined;
}

function findParentName(tokens: PartialToken[]): string | undefined {
    // Look for "in <parent>"
    for (let i = 0; i < tokens.length - 1; i++) {
        if (tokens[i].type === 'KEYWORD' &&
            tokens[i].value.toLowerCase() === 'in' &&
            tokens[i + 1].type === 'IDENTIFIER') {
            return tokens[i + 1].value;
        }
    }
    return undefined;
}

// ============================================
// EXPORTS
// ============================================

export { tokenize, findCurrentWord };
