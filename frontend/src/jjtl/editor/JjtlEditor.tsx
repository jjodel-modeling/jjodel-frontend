/**
 * JjTL Editor Component
 * Monaco Editor configured for JjTL language
 */

import React, { useRef, useEffect, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { registerJjtlLanguage, JJTL_LANGUAGE_ID } from './jjtlLanguage';
import { registerJjtlTheme, JJTL_THEME_ID } from './jjtlTheme';
import { tokenize } from '../lexer';
import { parse } from '../parser';
import { ParserError } from '../types';

interface JjtlEditorProps {
    value: string;
    onChange?: (value: string) => void;
    onParse?: (result: { errors: ParserError[] }) => void;
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

        const editor = monaco.editor.create(containerRef.current, {
            value,
            language: JJTL_LANGUAGE_ID,
            theme: JJTL_THEME_ID,
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            readOnly,
            wordWrap: 'on',
        });

        editorRef.current = editor;

        // Handle changes
        editor.onDidChangeModelContent(() => {
            const newValue = editor.getValue();
            onChange?.(newValue);
            parseContent(newValue);
        });

        // Initial parse
        parseContent(value);

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
