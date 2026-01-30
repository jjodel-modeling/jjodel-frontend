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

// UI Components
export {
    JjScriptInput,
    JjScriptOutput,
    JjScriptInlineOutput,
    JjScriptConsole,
    JjScriptChatMessage
} from './components';

// Default export for convenience
import { executeCommand } from './executor/executor';
export default executeCommand;
