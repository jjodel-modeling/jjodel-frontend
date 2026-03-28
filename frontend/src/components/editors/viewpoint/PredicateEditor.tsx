import React, { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { LViewElement } from '../../../joiner';
import { compactMonacoOptions, withReadOnly } from '../monacoConfig';
import EditorFullscreenOverlay from './EditorFullscreenOverlay';

type PredicateLanguage = 'js' | 'ocl' | 'jjel';

interface PredicateEditorProps {
    view: LViewElement;
    readOnly: boolean;
    onViewUpdate: () => void;
}

const LANG_MAP: Record<PredicateLanguage, string> = {
    js: 'javascript',
    ocl: 'plaintext',
    jjel: 'plaintext',
};

const PredicateEditor: React.FC<PredicateEditorProps> = ({ view, readOnly, onViewUpdate }) => {
    const [language, setLanguage] = useState<PredicateLanguage>('js');
    const [fullscreen, setFullscreen] = useState(false);

    // Get value based on language
    const getValue = useCallback((): string => {
        switch (language) {
            case 'js': return view.__raw.jsCondition || '';
            case 'ocl': return view.__raw.oclCondition || '';
            case 'jjel': return ''; // JjEL predicate not yet stored in model
        }
    }, [language, view]);

    const [localValue, setLocalValue] = useState(getValue());

    // Sync when view or language changes
    useEffect(() => {
        setLocalValue(getValue());
    }, [getValue, view.id]);

    const handleChange = useCallback((value: string | undefined) => {
        if (value !== undefined) setLocalValue(value);
    }, []);

    const handleBlur = useCallback(() => {
        switch (language) {
            case 'js':
                view.jsCondition = localValue;
                break;
            case 'ocl':
                view.oclCondition = localValue;
                break;
            case 'jjel':
                // TODO: P-future — persist JjEL predicate when model supports it
                break;
        }
        onViewUpdate();
    }, [language, localValue, view, onViewUpdate]);

    const handleFullscreenClose = useCallback(() => {
        handleBlur();
        setFullscreen(false);
    }, [handleBlur]);

    const monacoLang = LANG_MAP[language];
    const badgeClass = `editor-section__header-badge editor-section__header-badge--${language}`;

    return (
        <>
            {/* Header */}
            <div className="editor-section__header">
                <div className="editor-section__header-left">
                    <span className="editor-section__header-title">Predicate</span>
                    <div className="lang-toggle">
                        {(['js', 'ocl', 'jjel'] as PredicateLanguage[]).map((lang) => (
                            <button
                                key={lang}
                                className={`lang-toggle__btn ${language === lang ? 'lang-toggle__btn--active' : ''}`}
                                onClick={() => { if (language !== lang) { handleBlur(); setLanguage(lang); } }}
                            >
                                {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="editor-section__header-actions">
                    <span className={badgeClass}>{language.toUpperCase()}</span>
                    <button
                        className="editor-section__header-fullscreen"
                        onClick={() => setFullscreen(true)}
                        title="Open fullscreen"
                    >
                        <i className="bi bi-arrows-fullscreen" />
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div
                className="editor-section__body"
                tabIndex={-1}
                onBlur={handleBlur}
            >
                <Editor
                    className="monaco-editor-container"
                    value={localValue}
                    language={monacoLang}
                    theme="vs"
                    options={{
                        ...withReadOnly(compactMonacoOptions, readOnly),
                        automaticLayout: true,
                    }}
                    onChange={handleChange}
                />
            </div>

            {/* Fullscreen overlay */}
            <EditorFullscreenOverlay
                isOpen={fullscreen}
                onClose={handleFullscreenClose}
                title={`Predicate — ${view.name || 'View'} (${language.toUpperCase()})`}
                language={monacoLang}
                value={localValue}
                onChange={handleChange}
                readOnly={readOnly}
            />
        </>
    );
};

export default PredicateEditor;
