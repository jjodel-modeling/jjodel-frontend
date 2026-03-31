import React, { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { LViewElement } from '../../../../joiner';
import { baseMonacoOptions, withReadOnly } from '../../../editors/monacoConfig';
import EditorToolbar, { LANGUAGE_BADGES } from '../EditorToolbar';
import EditorFullscreenModal from '../EditorFullscreenModal';

type PredicateLanguage = 'ocl' | 'js' | 'jjel';

interface PredicateTabProps {
    view: LViewElement;
    onViewUpdate: () => void;
}

const LANGUAGE_TOGGLE_OPTIONS = [
    { label: 'OCL', value: 'ocl' },
    { label: 'JS', value: 'js' },
    { label: 'JjEL', value: 'jjel' },
];

/** Map predicate language to Monaco language id */
const MONACO_LANG: Record<PredicateLanguage, string> = {
    ocl: 'plaintext',
    js: 'javascript',
    jjel: 'plaintext',
};

const PredicateTab: React.FC<PredicateTabProps> = ({ view, onViewUpdate }) => {
    const dview = view.__raw;
    const [language, setLanguage] = useState<PredicateLanguage>('ocl');
    const [localValue, setLocalValue] = useState('');
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

    /** Read the persisted value for the current language */
    const getPersistedValue = useCallback((lang: PredicateLanguage): string => {
        switch (lang) {
            case 'ocl': return (dview as any).oclCondition || '';
            case 'js': return (dview as any).jsCondition || '';
            case 'jjel': return (dview as any).jjelCondition || '';
        }
    }, [dview]);

    // Sync local value when view or language changes externally
    useEffect(() => {
        if (!isFullscreenOpen) {
            setLocalValue(getPersistedValue(language));
        }
    }, [language, dview, getPersistedValue, isFullscreenOpen]);

    /** Persist current value to the model */
    const persist = useCallback(() => {
        switch (language) {
            case 'ocl':
                view.oclCondition = localValue;
                break;
            case 'js':
                view.jsCondition = localValue;
                break;
            case 'jjel':
                (view as any).jjelCondition = localValue;
                break;
        }
        onViewUpdate();
    }, [language, localValue, view, onViewUpdate]);

    const handleBlur = useCallback(() => {
        persist();
    }, [persist]);

    const handleLanguageChange = useCallback((newLang: string) => {
        // Persist current language's value before switching
        persist();
        setLanguage(newLang as PredicateLanguage);
    }, [persist]);

    const handleFullscreenClose = useCallback(() => {
        persist();
        setIsFullscreenOpen(false);
    }, [persist]);

    const activeBadge = LANGUAGE_BADGES[language];
    const monacoLang = MONACO_LANG[language];

    return (
        <div className="vep-template-tab">
            <EditorToolbar
                languageBadge={activeBadge}
                editorLabel="predicate"
                onFullscreen={() => setIsFullscreenOpen(true)}
                languageToggle={{
                    options: LANGUAGE_TOGGLE_OPTIONS,
                    active: language,
                    onChange: handleLanguageChange,
                }}
            />

            <div
                className="vep-template-tab__body"
                tabIndex={-1}
                onBlur={handleBlur}
            >
                <Editor
                    className="monaco-editor-container"
                    value={localValue}
                    language={monacoLang}
                    theme="vs"
                    options={{
                        ...withReadOnly(baseMonacoOptions, false),
                        automaticLayout: true,
                        lineNumbers: 'on',
                    }}
                    onChange={(val) => setLocalValue(val || '')}
                />
            </div>

            <EditorFullscreenModal
                isOpen={isFullscreenOpen}
                onClose={handleFullscreenClose}
                title={`Predicate — ${view.name || 'View'}`}
                subtitle={`${activeBadge.label} predicate for this view element`}
                languageBadge={activeBadge}
                language={monacoLang}
                value={localValue}
                onChange={setLocalValue}
            />
        </div>
    );
};

export default PredicateTab;
