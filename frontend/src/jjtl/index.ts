/**
 * JjTL - Jjodel Transformation Language
 *
 * JjTL uses JjEL (Jjodel Expression Language) for expressions.
 * This module provides lexer, parser, executor, and analyzer for JjTL.
 */

// Types
export * from './types';

// Lexer
export { tokenize, JjtlLexer } from './lexer';

// Parser
export { parse, JjtlParser } from './parser';

// Executor
export { execute, JjtlExecutor } from './executor';

// Analyzer
export {
    BidirectionalityAnalyzer,
    analyzeBidirectionality,
    isBidirectional,
} from './analyzer';
export type {
    BidirectionalityLevel,
    BidirectionalityIssue,
    MappingAnalysis,
    AttributeAnalysis,
    BidirectionalityAnalysis,
} from './analyzer';

// Editor
export { JjtlEditor, registerJjtlLanguage, registerJjtlTheme, registerJjtlCompletions, setCompletionContext } from './editor';

// Views
export * from './views';

// Components
export * from './components';

// Hooks
export * from './hooks';

// Utils
export * from './utils';

// Services
export * from './services';
