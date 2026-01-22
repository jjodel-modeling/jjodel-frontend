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
 */
export function detectCurrentContext(): AppContext {
    const pathname = window.location.pathname;

    // Dashboard: all projects page
    if (pathname === '/allProjects' || pathname === '/dashboard' || pathname === '/') {
        return 'DASHBOARD';
    }

    // User Profile
    if (pathname.includes('/account') || pathname.includes('/profile') || pathname.includes('/settings')) {
        return 'USER_PROFILE';
    }

    // Check if we're editing a metamodel (canvas is visible)
    // Look for metamodel editor indicators in the DOM
    const isMetamodelEditorActive = document.querySelector('.graph-container') !== null
        || document.querySelector('[data-context="metamodel-editor"]') !== null
        || document.querySelector('.metamodel-canvas') !== null;

    if (isMetamodelEditorActive && pathname.includes('/project')) {
        return 'METAMODEL_EDITOR';
    }

    // Project Editor: inside a project but not editing metamodel
    if (pathname.includes('/project')) {
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
    NEW: { key: 'N', modifiers: ['cmd'] as ModifierKey[] },                    // Context-aware: Project/Metamodel/Class
    NEW_MODEL: { key: 'N', modifiers: ['cmd', 'shift'] as ModifierKey[] },     // Specific: New Model (in project context)
    SAVE: { key: 'S', modifiers: ['cmd'] as ModifierKey[] },                   // Context-aware: Save Project/Profile
    CLOSE: { key: 'W', modifiers: ['cmd'] as ModifierKey[] },                  // Context-aware: Close Project/Profile
    SIGN_OUT: { key: 'Q', modifiers: ['cmd'] as ModifierKey[] },               // Always: Sign Out

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

    // Check key
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
