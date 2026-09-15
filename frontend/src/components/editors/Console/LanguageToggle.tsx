/**
 * Language Toggle for Console
 * Allows switching between JavaScript and JjEL modes
 */
import React from 'react';
import './LanguageToggle.scss';

export type ConsoleLanguage = 'js' | 'jjel';

interface LanguageToggleProps {
    language: ConsoleLanguage;
    onChange: (language: ConsoleLanguage) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
    language,
    onChange
}) => {
    return (
        <div className="console-language-toggle">
            <button
                className={`toggle-option ${language === 'js' ? 'active' : ''}`}
                onClick={() => onChange('js')}
                title="JavaScript mode - Full JS evaluation"
                type="button"
            >
                JS
            </button>
            <button
                className={`toggle-option ${language === 'jjel' ? 'active' : ''}`}
                onClick={() => onChange('jjel')}
                title="JjEL mode - Jjodel Expression Language"
                type="button"
            >
                JjEL
            </button>
        </div>
    );
};

export default LanguageToggle;
