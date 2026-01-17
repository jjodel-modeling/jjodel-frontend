/**
 * Keyboard Shortcuts Configuration
 * Platform-specific shortcuts for menu items
 */

export interface ShortcutDef {
    mac: string;
    win: string;
}

export const SHORTCUTS: Record<string, ShortcutDef> = {
    // File menu
    'file.new.project': { mac: '⌘N', win: 'Ctrl+N' },
    'file.new.metamodel': { mac: '⇧⌘M', win: 'Ctrl+Shift+M' },
    'file.new.model': { mac: '⇧⌘O', win: 'Ctrl+Shift+O' },
    'file.import': { mac: '⌘I', win: 'Ctrl+I' },
    'file.save': { mac: '⌘S', win: 'Ctrl+S' },
    'file.favorites': { mac: '⌘D', win: 'Ctrl+D' },
    'file.close': { mac: '⌘E', win: 'Ctrl+E' },

    // Edit menu
    'edit.undo': { mac: '⌘Z', win: 'Ctrl+Z' },
    'edit.redo': { mac: '⇧⌘Z', win: 'Ctrl+Shift+Z' },
    'edit.copyLink': { mac: '⇧⌘S', win: 'Ctrl+Shift+S' },

    // View menu
    'view.zoomIn': { mac: '⌘=', win: 'Ctrl+=' },
    'view.zoomOut': { mac: '⌘-', win: 'Ctrl+-' },
    'view.sidebar': { mac: '⌘B', win: 'Ctrl+B' },
    'view.toolbar': { mac: '⇧⌘B', win: 'Ctrl+Shift+B' },
    'view.fullscreen': { mac: '⌃⌘F', win: 'F11' },
};

/**
 * Get the shortcut for current platform
 */
export const getShortcut = (id: string): string => {
    const shortcut = SHORTCUTS[id];
    if (!shortcut) return '';

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return isMac ? shortcut.mac : shortcut.win;
};
