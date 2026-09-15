/**
 * JjTL UI Bridge Interface
 *
 * Defines the contract for UI interactions during transformation execution.
 * Implementations can be React-based, console-based, or mock for testing.
 */

import { AlertType, InputType } from '../types';

/**
 * Result from user input dialogs
 */
export interface InputResult<T = unknown> {
    value: T;
    cancelled: boolean;
}

/**
 * Options for select input type
 */
export interface SelectOption {
    label: string;
    value: string;
}

/**
 * UI Bridge interface for JjTL interactive statements/expressions
 */
export interface UIBridge {
    /**
     * Show a blocking alert dialog
     * @param message - The message to display
     * @param alertType - Type of alert (info, warning, error, success)
     * @returns Promise that resolves when dialog is dismissed
     */
    showAlert(message: string, alertType: AlertType): Promise<void>;

    /**
     * Show a non-blocking toast notification
     * @param message - The message to display
     * @param duration - Duration in milliseconds (default 3000)
     */
    showNotify(message: string, duration?: number): void;

    /**
     * Show a prompt dialog for typed input
     * @param message - The prompt message
     * @param typeRef - Type reference (e.g. 'EString', 'EInt', 'EBoolean', 'EDate')
     * @param defaultValue - Optional default value
     * @returns Promise with user input or cancelled flag
     */
    showPrompt(message: string, typeRef: string, defaultValue?: string, executionContext?: string): Promise<InputResult<string>>;

    /**
     * Show an input dialog for typed input
     * @param message - The prompt message
     * @param inputType - Type of input (string, number, boolean, date, select)
     * @param defaultValue - Optional default value
     * @param options - Options for select type
     * @returns Promise with user input or cancelled flag
     */
    showInput<T>(
        message: string,
        inputType: InputType,
        defaultValue?: T,
        options?: SelectOption[] | string[]
    ): Promise<InputResult<T>>;

    /**
     * Show a blocking confirm dialog (Yes/No)
     * @param message - The question to display
     * @param executionContext - Optional rule/instance context string
     * @returns Promise with true (Yes) or false (No/dismissed)
     */
    showConfirm(message: string, executionContext?: string): Promise<boolean>;
}

/**
 * No-op UI Bridge for headless/testing execution
 * Returns default values without user interaction
 */
export class NoopUIBridge implements UIBridge {
    async showAlert(_message: string, _alertType: AlertType): Promise<void> {
        // No-op
    }

    showNotify(_message: string, _duration?: number): void {
        // No-op
    }

    async showPrompt(_message: string, _typeRef: string, defaultValue?: string, _executionContext?: string): Promise<InputResult<string>> {
        return { value: defaultValue ?? '', cancelled: false };
    }

    async showInput<T>(
        _message: string,
        _inputType: InputType,
        defaultValue?: T,
        _options?: SelectOption[] | string[]
    ): Promise<InputResult<T>> {
        return { value: defaultValue as T, cancelled: false };
    }

    async showConfirm(_message: string, _executionContext?: string): Promise<boolean> {
        return false;
    }
}

/**
 * Console UI Bridge for CLI/debugging
 * Uses console.log and returns defaults
 */
export class ConsoleUIBridge implements UIBridge {
    async showAlert(message: string, alertType: AlertType): Promise<void> {
        const prefix = {
            info: 'ℹ️ INFO',
            warning: '⚠️ WARNING',
            error: '❌ ERROR',
            success: '✅ SUCCESS',
        }[alertType];
        // console.log(`[JjTL] ${prefix}: ${message}`);
    }

    showNotify(message: string, duration?: number): void {
        // console.log(`[JjTL] 📢 NOTIFY (${duration ?? 3000}ms): ${message}`);
    }

    async showPrompt(message: string, typeRef: string, defaultValue?: string, _executionContext?: string): Promise<InputResult<string>> {
        // console.log(`[JjTL] ❓ PROMPT: ${message} [type: ${typeRef}] (default: "${defaultValue ?? ''}")`);
        return { value: defaultValue ?? '', cancelled: false };
    }

    async showInput<T>(
        message: string,
        inputType: InputType,
        defaultValue?: T,
        options?: SelectOption[] | string[]
    ): Promise<InputResult<T>> {
        // console.log(`[JjTL] 📝 INPUT (${inputType}): ${message}`);
        if (options) {
            // console.log(`[JjTL]    Options: ${JSON.stringify(options)}`);
        }
        // console.log(`[JjTL]    Default: ${JSON.stringify(defaultValue)}`);
        return { value: defaultValue as T, cancelled: false };
    }

    async showConfirm(message: string, _executionContext?: string): Promise<boolean> {
        // console.log(`[JjTL] ❓ CONFIRM: ${message}`);
        return false;
    }
}

// Global UI Bridge instance (set by React context or test setup)
let currentUIBridge: UIBridge = new ConsoleUIBridge();

/**
 * Set the global UI Bridge instance
 */
export function setUIBridge(bridge: UIBridge): void {
    currentUIBridge = bridge;
}

/**
 * Get the current UI Bridge instance
 */
export function getUIBridge(): UIBridge {
    return currentUIBridge;
}
