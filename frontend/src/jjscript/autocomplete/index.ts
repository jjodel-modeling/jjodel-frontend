/**
 * JjScript Autocomplete Module
 *
 * Provides intelligent autocomplete for JjScript commands.
 *
 * Usage:
 *   import { getSuggestions, applySuggestion, setMetamodelContext } from './autocomplete';
 *
 *   // Get suggestions for partial input
 *   const suggestions = getSuggestions('create cl');
 *
 *   // Apply a selected suggestion
 *   const { text, cursorPosition } = applySuggestion(input, suggestions[0]);
 *
 *   // Set metamodel context for element suggestions
 *   setMetamodelContext({ classes: [...], enums: [...], packages: [...] });
 */

// Types
export * from './types';

// Context detection
export { detectContext, tokenize, findCurrentWord } from './context';

// Ranking
export { rankSuggestions, expandSnippet } from './ranking';

// Providers
export { KeywordProvider, keywordProvider } from './providers/keyword';
export { MetamodelProvider, metamodelProvider } from './providers/metamodel';
export { TypeProvider, typeProvider } from './providers/type';

// Engine
export {
    AutocompleteEngine,
    getAutocompleteEngine,
    resetAutocompleteEngine,
    getSuggestions,
    applySuggestion,
    setMetamodelContext,
    addRecentCommand,
} from './engine';

// Default export
import { getAutocompleteEngine } from './engine';
export default getAutocompleteEngine;
