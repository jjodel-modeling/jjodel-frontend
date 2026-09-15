import React from 'react';

const SHORTCUTS = [
    { category: 'General', shortcuts: [
        { keys: ['Ctrl', 'S'], action: 'Save project' },
        { keys: ['Ctrl', 'Z'], action: 'Undo' },
        { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
        { keys: ['Ctrl', 'F'], action: 'Search' },
        { keys: ['Esc'], action: 'Close dialog / Deselect' },
    ]},
    { category: 'Canvas', shortcuts: [
        { keys: ['Space', 'Drag'], action: 'Pan canvas' },
        { keys: ['Scroll'], action: 'Zoom in/out' },
        { keys: ['Del'], action: 'Delete selected' },
        { keys: ['Ctrl', 'A'], action: 'Select all' },
        { keys: ['Ctrl', 'D'], action: 'Duplicate selection' },
    ]},
    { category: 'Navigation', shortcuts: [
        { keys: ['Alt', 'Cmd', 'Q'], action: 'Sign out' },
        { keys: ['Cmd', 'K'], action: 'Command palette' },
    ]},
];

export function ShortcutsSettings() {
    return (
        <div className="settings-section-content">
            {SHORTCUTS.map((group, index) => (
                <div key={group.category} className="settings-group">
                    <label className="settings-label">{group.category}</label>
                    <div className="shortcuts-list">
                        {group.shortcuts.map((shortcut, i) => (
                            <div key={i} className="shortcut-item">
                                <div className="shortcut-keys">
                                    {shortcut.keys.map((key, j) => (
                                        <React.Fragment key={j}>
                                            <kbd>{key}</kbd>
                                            {j < shortcut.keys.length - 1 && <span className="key-separator">+</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <span className="shortcut-action">{shortcut.action}</span>
                            </div>
                        ))}
                    </div>
                    {index < SHORTCUTS.length - 1 && <div className="settings-divider" />}
                </div>
            ))}

            <div className="settings-divider" />

            <div className="settings-group">
                <div className="coming-soon-notice">
                    <i className="bi bi-sliders" />
                    <div>
                        <p>Custom shortcut configuration coming soon.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShortcutsSettings;
