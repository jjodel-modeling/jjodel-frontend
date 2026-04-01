import React, { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { LViewElement } from '../../../../joiner';
import { cssMonacoOptions, withReadOnly } from '../../../editors/monacoConfig';
import EditorToolbar, { LANGUAGE_BADGES } from '../EditorToolbar';
import EditorFullscreenModal from '../EditorFullscreenModal';
import CssVariablesEditor from './CssVariablesEditor';

interface StyleTabProps {
    view: LViewElement;
    isViewpointLevel?: boolean;
    onViewUpdate: () => void;
}

const StyleTab: React.FC<StyleTabProps> = ({ view, isViewpointLevel = false, onViewUpdate }) => {
    const dview = view.__raw;
    const [css, setCss] = useState(dview.css || '');
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
    const [cssIsGlobal, setCssIsGlobal] = useState(dview.cssIsGlobal ?? false);

    // Sync when view changes externally
    useEffect(() => {
        if (!isFullscreenOpen) {
            setCss(dview.css || '');
            setCssIsGlobal(dview.cssIsGlobal ?? false);
        }
    }, [dview.css, dview.cssIsGlobal, isFullscreenOpen]);

    const handleCssChange = useCallback((value: string | undefined) => {
        if (value !== undefined) setCss(value);
    }, []);

    const handleCssBlur = useCallback(() => {
        view.css = css;
        onViewUpdate();
    }, [css, view, onViewUpdate]);

    const handleGlobalToggle = useCallback(() => {
        const next = !cssIsGlobal;
        setCssIsGlobal(next);
        view.cssIsGlobal = next;
        onViewUpdate();
    }, [cssIsGlobal, view, onViewUpdate]);

    const handleFullscreenClose = useCallback(() => {
        // Persist CSS from fullscreen
        view.css = css;
        onViewUpdate();
        setIsFullscreenOpen(false);
    }, [css, view, onViewUpdate]);

    const editorLabel = isViewpointLevel ? 'viewpoint styles' : 'local styles';

    return (
        <div className="vep-style-tab">
            {/* Top section: CSS Variables */}
            <CssVariablesEditor view={view} onViewUpdate={onViewUpdate} />

            {/* Divider */}
            <div className="vep-style-tab__divider" />

            {/* Bottom section: CSS/LESS editor */}
            <EditorToolbar
                languageBadge={LANGUAGE_BADGES.css}
                editorLabel={editorLabel}
                onFullscreen={() => setIsFullscreenOpen(true)}
            />

            {/* Global CSS toggle */}
            <div className="vep-style-tab__options">
                <span className="vep-style-tab__option-label">Global CSS</span>
                <button
                    type="button"
                    className={`vep-style-tab__switch ${cssIsGlobal ? 'vep-style-tab__switch--active' : ''}`}
                    onClick={handleGlobalToggle}
                    title={cssIsGlobal ? 'CSS applies globally' : 'CSS is scoped to this element'}
                />
            </div>

            <div
                className="vep-style-tab__editor"
                tabIndex={-1}
                onBlur={handleCssBlur}
            >
                <Editor
                    className="monaco-editor-container"
                    value={css}
                    language="less"
                    theme="vs"
                    options={{
                        ...withReadOnly(cssMonacoOptions, false),
                        automaticLayout: true,
                    }}
                    onChange={handleCssChange}
                />
            </div>

            <EditorFullscreenModal
                isOpen={isFullscreenOpen}
                onClose={handleFullscreenClose}
                title={`Style — ${view.name || 'View'}`}
                subtitle={isViewpointLevel ? 'Viewpoint-level CSS/LESS' : 'Local CSS/LESS for this view'}
                languageBadge={LANGUAGE_BADGES.css}
                language="less"
                value={css}
                onChange={setCss}
            />
        </div>
    );
};

export default StyleTab;
