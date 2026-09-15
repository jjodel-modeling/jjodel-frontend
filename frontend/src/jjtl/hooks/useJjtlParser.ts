/**
 * useJjtlParser Hook
 * React hook for parsing JjTL code
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { tokenize } from '../lexer';
import { parse } from '../parser';
import { TransformationAST, ParserError } from '../types';

export interface UseJjtlParserResult {
    ast: TransformationAST | null;
    errors: ParserError[];
    isValid: boolean;
    isParsing: boolean;
    parse: (source: string) => void;
    parseAsync: (source: string) => Promise<void>;
    /** Parse immediately and return the result (no debounce, returns AST directly) */
    parseNow: (source: string) => { ast: TransformationAST | null; errors: ParserError[] };
}

export interface UseJjtlParserOptions {
    debounceMs?: number;
    validateOnParse?: boolean;
}

/**
 * Hook for parsing JjTL source code
 */
export function useJjtlParser(options: UseJjtlParserOptions = {}): UseJjtlParserResult {
    const { debounceMs = 300, validateOnParse = true } = options;

    const [ast, setAst] = useState<TransformationAST | null>(null);
    const [errors, setErrors] = useState<ParserError[]>([]);
    const [isParsing, setIsParsing] = useState(false);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSourceRef = useRef<string>('');

    // Parse source synchronously
    const parseSource = useCallback((source: string): { ast: TransformationAST | null; errors: ParserError[] } => {
        // console.log('[useJjtlParser] Parsing source, length:', source.length);

        // Tokenize
        const lexerResult = tokenize(source);
        // console.log('[useJjtlParser] Tokens count:', lexerResult.tokens.length);

        // Convert lexer errors to parser errors format
        const lexerErrors: ParserError[] = lexerResult.errors.map(e => ({
            message: `Lexer: ${e.message}`,
            line: e.line,
            column: e.column,
        }));

        // DEBUG: log full token stream
        // console.log('[useJjtlParser] Full token stream:', lexerResult.tokens.map(
            // (t, i) => `${i}:[${t.type}:${JSON.stringify(t.value)}]`
        // ).join(' '));

        // Parse
        const parserResult = parse(lexerResult.tokens);
        // console.log('[useJjtlParser] Parse result:', {
            // hasAst: !!parserResult.ast,
            // mappingsCount: parserResult.ast?.mappings?.length || 0,
            // errorsCount: parserResult.errors.length
        // });

        // Combine errors
        const allErrors = [...lexerErrors, ...parserResult.errors];

        return {
            ast: parserResult.ast,
            errors: allErrors,
        };
    }, []);

    // Parse with debouncing
    const debouncedParse = useCallback((source: string) => {
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Skip if same source
        if (source === lastSourceRef.current) {
            return;
        }

        lastSourceRef.current = source;
        setIsParsing(true);

        debounceTimerRef.current = setTimeout(() => {
            const result = parseSource(source);
            setAst(result.ast);
            setErrors(result.errors);
            setIsParsing(false);
        }, debounceMs);
    }, [debounceMs, parseSource]);

    // Parse immediately (no debounce)
    const parseImmediate = useCallback((source: string) => {
        // Clear any pending debounced parse
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        lastSourceRef.current = source;
        setIsParsing(true);

        const result = parseSource(source);
        setAst(result.ast);
        setErrors(result.errors);
        setIsParsing(false);
    }, [parseSource]);

    // Async parse (for use with React Suspense or loading states)
    const parseAsync = useCallback(async (source: string): Promise<void> => {
        return new Promise((resolve) => {
            // Use requestAnimationFrame to avoid blocking UI
            requestAnimationFrame(() => {
                parseImmediate(source);
                resolve();
            });
        });
    }, [parseImmediate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Compute isValid
    const isValid = ast !== null && errors.length === 0;

    // Parse immediately and return result (useful for getting fresh AST at execution time)
    const parseNow = useCallback((source: string): { ast: TransformationAST | null; errors: ParserError[] } => {
        // console.log('[useJjtlParser] parseNow called - immediate parse with result');
        const result = parseSource(source);
        // Also update state
        setAst(result.ast);
        setErrors(result.errors);
        return result;
    }, [parseSource]);

    return {
        ast,
        errors,
        isValid,
        isParsing,
        parse: debouncedParse,
        parseAsync,
        parseNow,
    };
}

export default useJjtlParser;
