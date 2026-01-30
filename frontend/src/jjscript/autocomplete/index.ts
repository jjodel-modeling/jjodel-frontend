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

// Types - explicit exports for better compatibility
export type {
    Suggestion,
    SuggestionType,
    ParseContext,
    AutocompleteContext,
    PartialToken,
    SuggestionProvider,
    MetamodelContext,
    ClassInfo,
    AttributeInfo,
    ReferenceInfo,
    OperationInfo,
    ParameterInfo,
    EnumInfo,
    PackageInfo,
    AutocompleteOptions,
    CommandDef,
} from './types';

export {
    DEFAULT_OPTIONS,
    COMMAND_DEFS,
    ELEMENT_TYPE_DEFS,
    PRIMITIVE_TYPES,
    KEYWORDS,
    CLASS_PROPERTIES,
    ATTRIBUTE_PROPERTIES,
    REFERENCE_PROPERTIES,
} from './types';

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
