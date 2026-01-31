/**
 * Platform Detection Utilities
 * Used for keyboard shortcuts and platform-specific behavior
 */

/**
 * Detects if the user is on macOS
 */
export const isMac = (): boolean => {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

/**
 * Detects if the user is on Windows
 */
export const isWindows = (): boolean => {
    return navigator.platform.toUpperCase().indexOf('WIN') >= 0;
};

/**
 * Returns the appropriate shortcut string based on platform
 * @param mac - Mac shortcut (e.g., '⌘N')
 * @param win - Windows shortcut (e.g., 'Ctrl+N')
 */
export const formatShortcut = (mac: string, win: string): string => {
    return isMac() ? mac : win;
};

/**
 * Returns the modifier key name for the current platform
 * Mac: ⌘ (Command)
 * Windows: Ctrl
 */
export const getModifierKey = (): string => {
    return isMac() ? '⌘' : 'Ctrl';
};

/**
 * Returns the alt/option key name for the current platform
 * Mac: ⌥ (Option)
 * Windows: Alt
 */
export const getAltKey = (): string => {
    return isMac() ? '⌥' : 'Alt';
};

/**
 * Returns the shift symbol for the current platform
 */
export const getShiftKey = (): string => {
    return isMac() ? '⇧' : 'Shift';
};

/**
 * Platform symbols reference:
 * Mac: ⌘ (Command), ⌥ (Option), ⇧ (Shift), ⌃ (Control)
 * Win: Ctrl, Alt, Shift
 */
