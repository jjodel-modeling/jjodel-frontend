import React from 'react';

export interface LanguageBadge {
    label: string;
    bgColor: string;
    textColor: string;
}

export interface LanguageToggleOption {
    label: string;
    value: string;
}

export interface EditorToolbarProps {
    languageBadge: LanguageBadge;
    editorLabel: string;
    onRefresh?: () => void;
    onFullscreen: () => void;
    languageToggle?: {
        options: LanguageToggleOption[];
        active: string;
        onChange: (value: string) => void;
    };
}

// Pre-defined badge colors for common languages
export const LANGUAGE_BADGES: Record<string, LanguageBadge> = {
    jsx:  { label: 'JSX',  bgColor: '#fef3c7', textColor: '#92400e' },
    css:  { label: 'CSS',  bgColor: '#ede9fe', textColor: '#5b21b6' },
    ocl:  { label: 'OCL',  bgColor: '#fee2e2', textColor: '#991b1b' },
    js:   { label: 'JS',   bgColor: '#dbeafe', textColor: '#1e40af' },
    jjel: { label: 'JjEL', bgColor: '#f0fdf4', textColor: '#166534' },
};

const EditorToolbar: React.FC<EditorToolbarProps> = ({
    languageBadge,
    editorLabel,
    onRefresh,
    onFullscreen,
    languageToggle,
}) => {
    return (
        <div className="vep-editor-toolbar">
            <div className="vep-editor-toolbar__left">
                {languageToggle ? (
                    <div className="vep-editor-toolbar__toggle">
                        {languageToggle.options.map(opt => (
                            <button
                                key={opt.value}
                                className={`vep-editor-toolbar__toggle-btn ${
                                    languageToggle.active === opt.value ? 'vep-editor-toolbar__toggle-btn--active' : ''
                                }`}
                                onClick={() => languageToggle.onChange(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <>
                        <span
                            className="vep-editor-toolbar__badge"
                            style={{ background: languageBadge.bgColor, color: languageBadge.textColor }}
                        >
                            {languageBadge.label}
                        </span>
                        <span className="vep-editor-toolbar__label">{editorLabel}</span>
                    </>
                )}
            </div>
            <div className="vep-editor-toolbar__right">
                {onRefresh && (
                    <button
                        className="vep-editor-toolbar__btn"
                        onClick={onRefresh}
                        title="Refresh"
                    >
                        <i className="bi bi-arrow-clockwise" />
                    </button>
                )}
                <button
                    className="vep-editor-toolbar__btn vep-editor-toolbar__btn--fullscreen"
                    onClick={onFullscreen}
                    title="Open fullscreen"
                >
                    <i className="bi bi-arrows-fullscreen" />
                </button>
            </div>
        </div>
    );
};

export default EditorToolbar;
