import React, { useState, useEffect } from 'react';
import './shortcuts-reference.scss';

interface ShortcutsReferenceProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'all' | 'dashboard' | 'project' | 'metamodel' | 'profile';

interface Shortcut {
    keys: string[];
    description: string;
    action: string;
}

export const ShortcutsReference: React.FC<ShortcutsReferenceProps> = ({
    isOpen,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            requestAnimationFrame(() => {
                setIsAnimating(true);
            });
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle Escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isVisible) return null;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? '\u2318' : 'Ctrl';
    const shiftKey = '\u21E7';
    const altKey = isMac ? '\u2325' : 'Alt';

    const shortcuts: Record<string, Shortcut[]> = {
        dashboard: [
            {
                keys: [altKey, modKey, 'N'],
                description: 'Create New Project',
                action: 'Opens Create Project dialog'
            }
        ],
        project: [
            {
                keys: [altKey, modKey, 'N'],
                description: 'Create New Metamodel',
                action: 'createM2(project)'
            },
            {
                keys: [altKey, shiftKey, modKey, 'N'],
                description: 'Create New Model',
                action: 'createM1(project, metamodel)'
            },
            {
                keys: [modKey, 'S'],
                description: 'Save Project',
                action: 'ProjectsApi.save(project)'
            },
            {
                keys: [altKey, modKey, 'W'],
                description: 'Close Project',
                action: 'CloseProject()'
            }
        ],
        metamodel: [
            {
                keys: [altKey, modKey, 'N'],
                description: 'Add New Class',
                action: 'package.addClass()'
            },
            {
                keys: [modKey, 'S'],
                description: 'Save Project',
                action: 'ProjectsApi.save(project)'
            },
            {
                keys: [altKey, modKey, 'W'],
                description: 'Close Project',
                action: 'CloseProject()'
            },
            {
                keys: [modKey, 'Z'],
                description: 'Undo',
                action: 'UndoAction.new()'
            },
            {
                keys: isMac ? [modKey, shiftKey, 'Z'] : ['Ctrl', 'Y'],
                description: 'Redo',
                action: 'RedoAction.new()'
            },
            {
                keys: [modKey, '+'],
                description: 'Zoom In',
                action: 'jjodel:zoom in'
            },
            {
                keys: [modKey, '-'],
                description: 'Zoom Out',
                action: 'jjodel:zoom out'
            },
            {
                keys: [modKey, '0'],
                description: 'Reset Zoom (100%)',
                action: 'jjodel:zoom reset'
            }
        ],
        profile: [
            {
                keys: [modKey, 'S'],
                description: 'Save Profile',
                action: 'Auto-saved notification'
            },
            {
                keys: [altKey, modKey, 'W'],
                description: 'Close Profile',
                action: 'Navigate to dashboard'
            }
        ],
        global: [
            {
                keys: [altKey, modKey, 'Q'],
                description: 'Sign Out',
                action: 'AuthApi.logout()'
            },
            {
                keys: [shiftKey, modKey, 'M'],
                description: 'Toggle Advanced Mode',
                action: 'toggleAdvancedMode()'
            },
            {
                keys: [altKey, modKey, 'M'],
                description: 'Create Metamodel (specific)',
                action: 'createM2(project)'
            },
            {
                keys: [modKey, '?'],
                description: 'Show Keyboard Shortcuts',
                action: 'Opens this dialog'
            }
        ]
    };

    const getFilteredShortcuts = () => {
        if (activeTab === 'all') {
            return [
                { title: 'Dashboard', shortcuts: shortcuts.dashboard },
                { title: 'Project Editor', shortcuts: shortcuts.project },
                { title: 'Metamodel Editor', shortcuts: shortcuts.metamodel },
                { title: 'User Profile', shortcuts: shortcuts.profile },
                { title: 'Global (All Contexts)', shortcuts: shortcuts.global }
            ];
        }

        const tabMap: Record<string, { title: string; shortcuts: Shortcut[] }> = {
            dashboard: { title: 'Dashboard', shortcuts: shortcuts.dashboard },
            project: { title: 'Project Editor', shortcuts: shortcuts.project },
            metamodel: { title: 'Metamodel Editor', shortcuts: shortcuts.metamodel },
            profile: { title: 'User Profile', shortcuts: shortcuts.profile }
        };

        const result = [];
        if (tabMap[activeTab]) {
            result.push(tabMap[activeTab]);
        }
        // Always include global shortcuts
        result.push({ title: 'Global (All Contexts)', shortcuts: shortcuts.global });
        return result;
    };

    return (
        <>
            <div
                className={`shortcuts-reference-backdrop ${isAnimating ? 'visible' : ''}`}
                onClick={onClose}
            />

            <div className={`shortcuts-reference-modal ${isAnimating ? 'visible' : ''}`}>
                <div className="shortcuts-reference-modal__header">
                    <h2 className="shortcuts-reference-modal__title">
                        <i className="bi bi-keyboard" />
                        Keyboard Shortcuts
                    </h2>
                    <button
                        className="shortcuts-reference-modal__close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="shortcuts-reference-modal__tabs">
                    <button
                        className={activeTab === 'all' ? 'active' : ''}
                        onClick={() => setActiveTab('all')}
                    >
                        All
                    </button>
                    <button
                        className={activeTab === 'dashboard' ? 'active' : ''}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        Dashboard
                    </button>
                    <button
                        className={activeTab === 'project' ? 'active' : ''}
                        onClick={() => setActiveTab('project')}
                    >
                        Project
                    </button>
                    <button
                        className={activeTab === 'metamodel' ? 'active' : ''}
                        onClick={() => setActiveTab('metamodel')}
                    >
                        Metamodel
                    </button>
                    <button
                        className={activeTab === 'profile' ? 'active' : ''}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile
                    </button>
                </div>

                <div className="shortcuts-reference-modal__content">
                    {getFilteredShortcuts().map((section, idx) => (
                        <div key={idx} className="shortcuts-section">
                            <h3 className="shortcuts-section__title">{section.title}</h3>

                            <table className="shortcuts-table">
                                <thead>
                                    <tr>
                                        <th>Shortcut</th>
                                        <th>Description</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.shortcuts.map((shortcut, i) => (
                                        <tr key={i}>
                                            <td className="shortcuts-table__keys">
                                                {shortcut.keys.map((key, j) => (
                                                    <kbd key={j} className="keystroke">{key}</kbd>
                                                ))}
                                            </td>
                                            <td className="shortcuts-table__description">
                                                {shortcut.description}
                                            </td>
                                            <td className="shortcuts-table__action">
                                                <code>{shortcut.action}</code>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                <div className="shortcuts-reference-modal__footer">
                    <p className="shortcuts-reference-modal__hint">
                        <i className="bi bi-lightbulb" />
                        Tip: Press <kbd className="keystroke">{modKey}</kbd> <kbd className="keystroke">?</kbd> anytime to show this dialog
                    </p>
                </div>
            </div>
        </>
    );
};

export default ShortcutsReference;
