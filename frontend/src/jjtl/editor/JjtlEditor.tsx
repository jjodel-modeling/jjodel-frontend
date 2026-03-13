/**
 * JjTL Editor Component
 * Monaco Editor configured for JjTL language
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {monaco} from "../../joiner";
import { registerJjtlLanguage, JJTL_LANGUAGE_ID } from './jjtlLanguage';
import { registerJjtlTheme, JJTL_THEME_ID } from './jjtlTheme';
import { tokenize } from '../lexer';
import { parse } from '../parser';
import { ParserError } from '../types';
import { largeMonacoOptions, mergeMonacoOptions } from '../../components/editors/monacoConfig';

interface CursorPosition {
    line: number;
    column: number;
}

interface JjtlEditorProps {
    value: string;
    onChange?: (value: string) => void;
    onParse?: (result: { errors: ParserError[] }) => void;
    onCursorPositionChange?: (position: CursorPosition) => void;
    height?: string | number;
    readOnly?: boolean;
}

// Register language and theme once
let registered = false;
function ensureRegistered() {
    if (!registered) {
        registerJjtlLanguage();
        registerJjtlTheme();
        registered = true;
    }
}

export const JjtlEditor: React.FC<JjtlEditorProps> = ({
    value,
    onChange,
    onParse,
    onCursorPositionChange,
    height = '400px',
    readOnly = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    // Parse and report errors
    const parseContent = useCallback((content: string) => {
        const lexerResult = tokenize(content);
        const parserResult = parse(lexerResult.tokens);

        const allErrors = [
            ...lexerResult.errors.map(e => ({ ...e, message: `Lexer: ${e.message}` })),
            ...parserResult.errors,
        ];

        // Set markers in Monaco
        if (editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                const markers: monaco.editor.IMarkerData[] = allErrors.map(error => ({
                    severity: monaco.MarkerSeverity.Error,
                    message: error.message,
                    startLineNumber: error.line,
                    startColumn: error.column,
                    endLineNumber: error.line,
                    endColumn: error.column + 1,
                }));
                monaco.editor.setModelMarkers(model, 'jjtl', markers);
            }
        }

        onParse?.({ errors: allErrors });
    }, [onParse]);

    // Initialize editor
    useEffect(() => {
        if (!containerRef.current) return;

        ensureRegistered();

        // JjTL Editor options - aligned with JSX Editor configuration
        const jjtlEditorOptions = mergeMonacoOptions(largeMonacoOptions, {
            // Font - same as JSX Editor
            fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace",
            fontSize: 13,
            fontWeight: '400',
            lineHeight: 20,
            fontLigatures: false,

            // Layout
            wordWrap: 'on',
            folding: true,

            // Cursor
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            cursorStyle: 'line',

            // Tab
            tabSize: 4,
            insertSpaces: true,
        });

        const editor = monaco.editor.create(containerRef.current, {
            ...jjtlEditorOptions,
            value,
            language: JJTL_LANGUAGE_ID,
            theme: JJTL_THEME_ID,
            readOnly,
        });

        editorRef.current = editor;

        // Handle changes
        editor.onDidChangeModelContent(() => {
            const newValue = editor.getValue();
            onChange?.(newValue);
            parseContent(newValue);
        });

        // Handle cursor position changes
        editor.onDidChangeCursorPosition((e) => {
            onCursorPositionChange?.({
                line: e.position.lineNumber,
                column: e.position.column,
            });
        });

        // Initial parse
        parseContent(value);

        // Report initial cursor position
        const initialPosition = editor.getPosition();
        if (initialPosition) {
            onCursorPositionChange?.({
                line: initialPosition.lineNumber,
                column: initialPosition.column,
            });
        }

        return () => {
            editor.dispose();
        };
    }, []);

    // Update value when prop changes
    useEffect(() => {
        if (editorRef.current) {
            const currentValue = editorRef.current.getValue();
            if (currentValue !== value) {
                editorRef.current.setValue(value);
            }
        }
    }, [value]);

    return (
        <div
            ref={containerRef}
            style={{
                height: typeof height === 'number' ? `${height}px` : height,
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
            }}
        />
    );
};

export default JjtlEditor;
