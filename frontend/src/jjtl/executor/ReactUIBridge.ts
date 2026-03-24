/**
 * React UI Bridge Implementation
 *
 * Provides React-based UI for JjTL interactive statements/expressions.
 * Uses a dialog manager to coordinate between executor and React components.
 */

import { AlertType, InputType } from '../types';
import { UIBridge, InputResult, SelectOption } from './UIBridge';

/**
 * Dialog request types
 */
export type DialogRequest =
    | { type: 'alert'; message: string; alertType: AlertType; resolve: () => void }
    | { type: 'notify'; message: string; duration: number }
    | { type: 'prompt'; message: string; typeRef: string; defaultValue?: string; resolve: (result: InputResult<string>) => void }
    | { type: 'input'; message: string; inputType: InputType; defaultValue?: unknown; options?: SelectOption[] | string[]; resolve: (result: InputResult<unknown>) => void };

/**
 * Dialog Manager - coordinates between executor and React components
 */
export class DialogManager {
    private listeners: Set<(request: DialogRequest) => void> = new Set();
    private pendingRequests: DialogRequest[] = [];

    /**
     * Subscribe to dialog requests
     */
    subscribe(listener: (request: DialogRequest) => void): () => void {
        this.listeners.add(listener);

        // Send any pending requests
        this.pendingRequests.forEach(req => listener(req));
        this.pendingRequests = [];

        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Emit a dialog request to all listeners
     */
    emit(request: DialogRequest): void {
        if (this.listeners.size === 0) {
            // No listeners yet, queue the request
            this.pendingRequests.push(request);
        } else {
            this.listeners.forEach(listener => listener(request));
        }
    }
}

// Global dialog manager instance
export const dialogManager = new DialogManager();

/**
 * React UI Bridge implementation
 * Emits dialog requests that React components can handle
 */
export class ReactUIBridge implements UIBridge {
    private manager: DialogManager;

    constructor(manager: DialogManager = dialogManager) {
        this.manager = manager;
    }

    async showAlert(message: string, alertType: AlertType): Promise<void> {
        return new Promise((resolve) => {
            this.manager.emit({
                type: 'alert',
                message,
                alertType,
                resolve,
            });
        });
    }

    showNotify(message: string, duration: number = 3000): void {
        this.manager.emit({
            type: 'notify',
            message,
            duration,
        });
    }

    async showPrompt(message: string, typeRef: string, defaultValue?: string): Promise<InputResult<string>> {
        return new Promise((resolve) => {
            this.manager.emit({
                type: 'prompt',
                message,
                typeRef,
                defaultValue,
                resolve,
            });
        });
    }

    async showInput<T>(
        message: string,
        inputType: InputType,
        defaultValue?: T,
        options?: SelectOption[] | string[]
    ): Promise<InputResult<T>> {
        return new Promise((resolve) => {
            this.manager.emit({
                type: 'input',
                message,
                inputType,
                defaultValue,
                options,
                resolve: resolve as (result: InputResult<unknown>) => void,
            });
        });
    }
}

/**
 * Create and register a React UI Bridge
 */
export function createReactUIBridge(): ReactUIBridge {
    return new ReactUIBridge(dialogManager);
}
