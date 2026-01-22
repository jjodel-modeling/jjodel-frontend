/**
 * Keyboard shortcuts utility for cross-platform support
 * Adapts keyboard shortcuts display based on user's operating system
 * Supports context-aware shortcuts that adapt to current application context
 */

export type ModifierKey = 'cmd' | 'ctrl' | 'shift' | 'alt';

export interface ShortcutConfig {
    key: string;
    modifiers: ModifierKey[];
}

/**
 * Application context for context-aware shortcuts
 */
export type AppContext = 'DASHBOARD' | 'PROJECT_EDITOR' | 'METAMODEL_EDITOR' | 'USER_PROFILE';

/**
 * Detect if user is on Mac
 */
export function isMac(): boolean {
    if (typeof navigator === 'undefined') return false;
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Detects the current application context for context-aware shortcuts
 * NOTE: App uses HashRouter, so we check window.location.hash (e.g., "#/project")
 */
export function detectCurrentContext(): AppContext {
    // App uses HashRouter, so the route is in the hash (e.g., "#/project" or "#/allProjects")
    const hash = window.location.hash || '';
    // Remove the leading "#" to get the path
    const path = hash.startsWith('#') ? hash.substring(1) : hash;

    // Dashboard: all projects page
    if (path === '/allProjects' || path === '/dashboard' || path === '/' || path === '') {
        return 'DASHBOARD';
    }

    // User Profile
    if (path.includes('/account') || path.includes('/profile') || path.includes('/settings')) {
        return 'USER_PROFILE';
    }

    // Check if we're editing a metamodel (canvas is visible)
    // Look for metamodel editor indicators in the DOM
    // Note: GraphContainer class is used in MetamodelTab.tsx (capital G)
    const isMetamodelEditorActive = document.querySelector('.GraphContainer') !== null
        || document.querySelector('[data-context="metamodel-editor"]') !== null
        || document.querySelector('.Graph') !== null;

    if (isMetamodelEditorActive && path.includes('/project')) {
        return 'METAMODEL_EDITOR';
    }

    // Project Editor: inside a project but not editing metamodel
    if (path.includes('/project')) {
        return 'PROJECT_EDITOR';
    }

    // Default to dashboard if uncertain
    return 'DASHBOARD';
}

/**
 * Get modifier symbol for the current platform
 */
export function getModifierSymbol(modifier: ModifierKey): string {
    const isMacOS = isMac();

    switch (modifier) {
        case 'cmd':
            return isMacOS ? '⌘' : 'Ctrl';
        case 'ctrl':
            return isMacOS ? '⌃' : 'Ctrl';
        case 'shift':
            return isMacOS ? '⇧' : 'Shift';
        case 'alt':
            return isMacOS ? '⌥' : 'Alt';
        default:
            return '';
    }
}

/**
 * Format a keyboard shortcut for display (legacy - single string)
 * @example formatShortcut({ key: 'S', modifiers: ['cmd'] }) → "⌘S" on Mac, "Ctrl+S" on Windows
 */
export function formatShortcut(config: ShortcutConfig): string {
    const isMacOS = isMac();
    const modifierSymbols = config.modifiers.map(m => getModifierSymbol(m));

    if (isMacOS) {
        // Mac style: ⌘S (no separator)
        return modifierSymbols.join('') + config.key.toUpperCase();
    } else {
        // Windows/Linux style: Ctrl+S (with +)
        return [...modifierSymbols, config.key.toUpperCase()].join('+');
    }
}

/**
 * Format a keyboard shortcut as individual pills for display
 * @example formatShortcutPills({ key: 'S', modifiers: ['cmd'] }) → ['⌘', 'S'] on Mac, ['Ctrl', 'S'] on Windows
 */
export function formatShortcutPills(config: ShortcutConfig): string[] {
    const modifierSymbols = config.modifiers.map(m => getModifierSymbol(m));
    return [...modifierSymbols, config.key.toUpperCase()];
}

/**
 * Common shortcuts used in the app
 * Organized by context-aware and specific shortcuts
 */
export const SHORTCUTS = {
    // Context-aware shortcuts (behavior changes based on current context)
    // NOTE: Using Alt+CMD to avoid Chrome intercepting CMD+N, CMD+W, etc.
    NEW: { key: 'N', modifiers: ['alt', 'cmd'] as ModifierKey[] },             // Context-aware: Project/Metamodel/Class (⌥⌘N)
    NEW_MODEL: { key: 'N', modifiers: ['alt', 'cmd', 'shift'] as ModifierKey[] }, // Specific: New Model (⌥⇧⌘N)
    SAVE: { key: 'S', modifiers: ['cmd'] as ModifierKey[] },                   // Context-aware: Save Project/Profile (⌘S works)
    CLOSE: { key: 'W', modifiers: ['alt', 'cmd'] as ModifierKey[] },           // Context-aware: Close Project/Profile (⌥⌘W)
    SIGN_OUT: { key: 'Q', modifiers: ['alt', 'cmd'] as ModifierKey[] },        // Always: Sign Out (⌥⌘Q)

    // Editor-specific shortcuts
    UNDO: { key: 'Z', modifiers: ['cmd'] as ModifierKey[] },                   // Metamodel Editor
    REDO_MAC: { key: 'Z', modifiers: ['cmd', 'shift'] as ModifierKey[] },      // Metamodel Editor (Mac)
    REDO_WIN: { key: 'Y', modifiers: ['cmd'] as ModifierKey[] },               // Metamodel Editor (Windows)

    // Zoom shortcuts (editor context only)
    ZOOM_IN: { key: '+', modifiers: ['cmd'] as ModifierKey[] },                 // CMD++ / Ctrl++
    ZOOM_OUT: { key: '-', modifiers: ['cmd'] as ModifierKey[] },                // CMD+- / Ctrl+-
    ZOOM_RESET: { key: '0', modifiers: ['cmd'] as ModifierKey[] },              // CMD+0 / Ctrl+0

    // Legacy/specific shortcuts (kept for backwards compatibility)
    NEW_METAMODEL: { key: 'M', modifiers: ['alt', 'cmd'] as ModifierKey[] },   // Alternative: New Metamodel (any context)
    COPY_LINK: { key: 'S', modifiers: ['shift', 'cmd'] as ModifierKey[] },
    ADVANCED_MODE: { key: 'M', modifiers: ['shift', 'cmd'] as ModifierKey[] },
    FULLSCREEN: { key: 'F11', modifiers: [] as ModifierKey[] },

    // Tree View toggle (⌘B / Ctrl+B)
    TOGGLE_TREE_VIEW: { key: 'B', modifiers: ['cmd'] as ModifierKey[] },
} as const;

/**
 * Get Redo shortcut based on platform
 * Mac uses ⌘⇧Z, Windows uses Ctrl+Y
 */
export function getRedoShortcut(): string {
    return isMac()
        ? formatShortcut(SHORTCUTS.REDO_MAC)
        : formatShortcut(SHORTCUTS.REDO_WIN);
}

/**
 * Get Redo shortcut pills based on platform
 * Mac uses ['⌘', '⇧', 'Z'], Windows uses ['Ctrl', 'Y']
 */
export function getRedoShortcutPills(): string[] {
    return isMac()
        ? formatShortcutPills(SHORTCUTS.REDO_MAC)
        : formatShortcutPills(SHORTCUTS.REDO_WIN);
}

/**
 * Check if a keyboard event matches a shortcut config
 * NOTE: On Mac, Alt (Option) modifies the key character, so we use event.code for Alt shortcuts
 */
export function matchesShortcut(event: KeyboardEvent, config: ShortcutConfig): boolean {
    const isMacOS = isMac();

    // Check modifiers
    const cmdOrCtrl = isMacOS ? event.metaKey : event.ctrlKey;
    const needsCmd = config.modifiers.includes('cmd');
    const needsShift = config.modifiers.includes('shift');
    const needsAlt = config.modifiers.includes('alt');

    if (needsCmd && !cmdOrCtrl) return false;
    if (!needsCmd && cmdOrCtrl) return false; // Extra modifier check
    if (needsShift !== event.shiftKey) return false;
    if (needsAlt !== event.altKey) return false;

    // Check key - use event.code for Alt shortcuts on Mac (Alt changes the key character)
    // event.code gives us "KeyN" for the N key regardless of Alt modifier
    if (needsAlt && isMacOS) {
        const expectedCode = `Key${config.key.toUpperCase()}`;
        return event.code === expectedCode;
    }

    // For non-Alt shortcuts, use event.key
    return event.key.toUpperCase() === config.key.toUpperCase();
}

/**
 * Check if a keyboard event matches a zoom in shortcut
 * Special handling because '+' is '=' on unshifted keyboard
 */
export function matchesZoomIn(event: KeyboardEvent): boolean {
    const isMacOS = isMac();
    const cmdOrCtrl = isMacOS ? event.metaKey : event.ctrlKey;

    if (!cmdOrCtrl) return false;
    if (event.altKey) return false;

    // Accept '+' or '=' (unshifted plus on US keyboard)
    return event.key === '+' || event.key === '=';
}

/**
 * Check if a keyboard event matches a zoom out shortcut
 */
export function matchesZoomOut(event: KeyboardEvent): boolean {
    const isMacOS = isMac();
    const cmdOrCtrl = isMacOS ? event.metaKey : event.ctrlKey;

    if (!cmdOrCtrl) return false;
    if (event.altKey) return false;
    if (event.shiftKey) return false;

    return event.key === '-';
}

/**
 * Check if a keyboard event matches a zoom reset shortcut
 */
export function matchesZoomReset(event: KeyboardEvent): boolean {
    const isMacOS = isMac();
    const cmdOrCtrl = isMacOS ? event.metaKey : event.ctrlKey;

    if (!cmdOrCtrl) return false;
    if (event.altKey) return false;
    if (event.shiftKey) return false;

    return event.key === '0';
}

/**
 * Get the label for CMD+N based on current context
 */
export function getNewActionLabel(context: AppContext): string {
    switch (context) {
        case 'DASHBOARD':
            return 'New Project';
        case 'PROJECT_EDITOR':
            return 'New Metamodel';
        case 'METAMODEL_EDITOR':
            return 'New Class';
        case 'USER_PROFILE':
            return 'New'; // No specific "new" action in profile
        default:
            return 'New';
    }
}

/**
 * Get the label for CMD+S based on current context
 */
export function getSaveActionLabel(context: AppContext): string {
    switch (context) {
        case 'DASHBOARD':
            return 'Save'; // No save action on dashboard
        case 'PROJECT_EDITOR':
        case 'METAMODEL_EDITOR':
            return 'Save Project';
        case 'USER_PROFILE':
            return 'Save Profile';
        default:
            return 'Save';
    }
}

/**
 * Get the label for CMD+W based on current context
 */
export function getCloseActionLabel(context: AppContext): string {
    switch (context) {
        case 'DASHBOARD':
            return 'Close'; // No close action on dashboard
        case 'PROJECT_EDITOR':
        case 'METAMODEL_EDITOR':
            return 'Close Project';
        case 'USER_PROFILE':
            return 'Close';
        default:
            return 'Close';
    }
}
