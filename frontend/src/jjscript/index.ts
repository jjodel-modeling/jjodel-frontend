/**
 * JjScript - Jjodel Scripting Language
 *
 * A text-based command language for manipulating Jjodel metamodels.
 *
 * Usage:
 *   import { executeCommand, parse, JjScriptService } from './jjscript';
 *
 *   // Execute a command
 *   const result = await executeCommand('create class Person');
 *
 *   // Parse without executing
 *   const parseResult = parse('create class Person');
 *
 *   // Check if message is a JjScript command
 *   if (JjScriptService.isJjScriptCommand(message)) {
 *       const result = await JjScriptService.execute(message);
 *   }
 */

// Types
export * from './types';

// Parser
export { Lexer, tokenize, Parser, parse } from './parser';
export {
    parseQualifiedName,
    qualifiedNameToString,
    parseMultiplicity,
    multiplicityToString,
    parseTypeReference,
    typeReferenceToString,
    parseLiteralValue,
    literalValueToString,
    isValidIdentifier,
    isValidClassName,
    isValidAttributeName,
    suggestCorrection
} from './parser/grammar';

// Executor
export {
    JjScriptExecutor,
    getExecutor,
    executeCommand,
    executeBatch,
    executeScript
} from './executor/executor';

// Let command handler
export { executeLet } from './executor/commands/let';

// ForAll command handler
export { executeForAll } from './executor/commands/forall';

// Eval command handler + JjEL context builder (reused by Jjodie code-mode console)
export { executeEval, buildEvalContext } from './executor/commands/eval';

// Resolvers
export {
    resolveElement,
    resolveParent,
    findElements,
    getElementPath,
    isAncestor
} from './executor/resolvers';

// Services
export { JjScriptService } from './services';

// Autocomplete - Engine & Functions
export {
    AutocompleteEngine,
    getAutocompleteEngine,
    getSuggestions,
    applySuggestion,
    setMetamodelContext,
    addRecentCommand,
    detectContext,
} from './autocomplete';

// Autocomplete - Types (separate export for type-only exports)
export type {
    Suggestion,
    SuggestionType,
    AutocompleteContext,
    MetamodelContext,
    AutocompleteOptions,
} from './autocomplete';

// Normalizer - Functions
export {
    normalize,
    normalizeWithDetails,
    normalizeLine,
    needsNormalization,
    getMatchingRule,
    addNormalizationRule,
    previewNormalization,
} from './normalizer';

// Normalizer - Detection
export {
    detectJjScript,
    isJjScriptCode,
    isJjScriptLine,
    detectSyntaxType,
} from './normalizer/detector';

// Normalizer - Types (separate export for type-only exports)
export type {
    NormalizationRule,
    NormalizationResult,
    NormalizationSummary,
} from './normalizer';

// UI Components
export {
    JjScriptInput,
    JjScriptOutput,
    JjScriptInlineOutput,
    JjScriptConsole,
    JjScriptChatMessage,
    ScriptBlock,
} from './components';

// UI Components - Types (separate export for type-only exports)
export type {
    ScriptBlockProps,
    ScriptLineResult,
} from './components';

// Default export for convenience
import { executeCommand } from './executor/executor';
export default executeCommand;
