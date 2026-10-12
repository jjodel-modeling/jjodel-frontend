/**
 * reservedIdentifiers — the one list of the words the JjScript lexer reserves (P-2026-10-10-0045).
 *
 * Read by the lexer (`parser/lexer.ts`, which never tokenizes these words as IDENTIFIER), by
 * `types.ts` (`COMMANDS`, `ELEMENT_TYPES` and `KEYWORDS` keep their names and types), by rule 8 of
 * Jjodie's system prompt (`constants/defaultPrompts.ts`) and by the gate on Jjodie's replies
 * (`components/Jodie/reservedIdentifierGate.ts`). There is no other copy.
 *
 * The match is exact and lowercase, like the lexer's: `copy` is reserved, `Copy` is an ordinary
 * name, so a class can still be called `Attribute` or `Class`. Measured in
 * `docs/discovery/discovery_2026-10-10_jjodie_reserved_identifiers.md` §4.1: a command word or a
 * boolean can never be a name (`Expected element name, found 'copy'`); an element type or a
 * keyword can be declared, but a later script cannot address the element by its bare name.
 *
 * Pure: no imports. Lookups go through a `Set`, so they never walk the prototype.
 */

/** Command words: the lexer reads them as COMMAND tokens. */
export const JJSCRIPT_COMMAND_WORDS = [
    'create', 'delete', 'rename', 'set', 'add', 'remove',
    'move', 'copy', 'list', 'show', 'help', 'undo', 'redo',
    'clear', 'export', 'import', 'validate', 'extends', 'eval',
    'let', 'forall', 'abstract'
] as const;

/** Element types: the lexer reads them as KEYWORD tokens. `abstract class` is two words. */
export const JJSCRIPT_ELEMENT_TYPE_WORDS = [
    'class', 'abstract class', 'interface', 'attribute', 'reference',
    'containment', 'composition',  // Shortcuts for "reference ... containment"
    'operation', 'parameter', 'package', 'enum', 'enumeration',
    'literal', 'model', 'metamodel', 'project', 'annotation',
    'instance'   // M1: DObject instance
] as const;

/** Keywords: the lexer reads them as KEYWORD tokens. */
export const JJSCRIPT_KEYWORD_WORDS = [
    'to', 'from', 'in', 'of', 'as', 'with', 'type', 'extends', 'implements',
    'abstract', 'readonly', 'derived', 'transient', 'volatile',
    'containment', 'opposite', 'default', 'ordered', 'unique',
    'cascade', 'force', 'deep', 'brief', 'full', 'tree'
] as const;

/** Boolean literals: the lexer reads them as BOOLEAN tokens. */
export const JJSCRIPT_BOOLEAN_WORDS = ['true', 'false'] as const;

export const JJSCRIPT_COMMAND_SET: ReadonlySet<string> = new Set<string>(JJSCRIPT_COMMAND_WORDS);
export const JJSCRIPT_ELEMENT_TYPE_SET: ReadonlySet<string> = new Set<string>(JJSCRIPT_ELEMENT_TYPE_WORDS);
export const JJSCRIPT_KEYWORD_SET: ReadonlySet<string> = new Set<string>(JJSCRIPT_KEYWORD_WORDS);

/** Every word the lexer reserves, as single words (63): none of them can safely name an element. */
export const RESERVED_IDENTIFIERS: ReadonlySet<string> = new Set<string>(
    [
        ...JJSCRIPT_COMMAND_WORDS,
        ...JJSCRIPT_ELEMENT_TYPE_WORDS,
        ...JJSCRIPT_KEYWORD_WORDS,
        ...JJSCRIPT_BOOLEAN_WORDS,
    ].filter(word => !word.includes(' '))
);

/** True when `name` is a reserved word, matched exactly: `copy` is, `Copy` and `copyOf` are not. */
export function isReservedIdentifier(name: string): boolean {
    return RESERVED_IDENTIFIERS.has(name);
}
