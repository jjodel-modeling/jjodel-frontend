/**
 * JjScriptSuccessNotification Component
 * Displays beautiful success notifications for JjScript commands
 */

import React from 'react';
import './JjScriptSuccessNotification.scss';

// ============================================
// OPERATION ICONS MAPPING
// ============================================

const OPERATION_ICONS: Record<string, string> = {
    // Create operations
    'created': 'bi-plus-circle-fill',
    'create': 'bi-plus-circle-fill',

    // Delete operations
    'deleted': 'bi-trash-fill',
    'delete': 'bi-trash-fill',
    'removed': 'bi-trash-fill',

    // Update operations
    'renamed': 'bi-pencil-fill',
    'rename': 'bi-pencil-fill',
    'updated': 'bi-pencil-fill',
    'set': 'bi-gear-fill',
    'moved': 'bi-arrows-move',
    'move': 'bi-arrows-move',

    // Add operations
    'added': 'bi-plus-lg',
    'add': 'bi-plus-lg',

    // Inheritance
    'extends': 'bi-diagram-2-fill',

    // Copy
    'copied': 'bi-copy',
    'copy': 'bi-copy',

    // Validation
    'validated': 'bi-check2-all',
    'validate': 'bi-check2-all',

    // Default
    'success': 'bi-check-circle-fill',
};

function getOperationIcon(operation: string): string {
    const op = operation.toLowerCase();

    for (const [key, icon] of Object.entries(OPERATION_ICONS)) {
        if (op.includes(key)) {
            return icon;
        }
    }

    return 'bi-check-circle-fill'; // Default
}

function getOperationVariant(operation: string): 'create' | 'delete' | 'update' | '' {
    const op = operation.toLowerCase();

    if (op.includes('delete') || op.includes('removed')) {
        return 'delete';
    }
    if (op.includes('rename') || op.includes('update') || op.includes('set') || op.includes('moved') || op.includes('move')) {
        return 'update';
    }

    return ''; // Default green for create/add
}

// ============================================
// INTERFACES
// ============================================

export interface JjScriptSuccessNotificationProps {
    /** Operation description (e.g., "Deleted", "Created class", "Added literal") */
    operation: string;
    /** Primary target element name (e.g., "Status", "MyClass") */
    target: string;
    /** Secondary target for relations (e.g., "Status" for "Added ACTIVE to Status") */
    secondary?: string;
    /** Connector text between targets (default: "to") */
    connector?: string;
    /** Additional details to show */
    details?: string;
    /** Whether to show compact variant */
    compact?: boolean;
    /** Custom variant override */
    variant?: 'create' | 'delete' | 'update';
}

// ============================================
// COMPONENT
// ============================================

export const JjScriptSuccessNotification: React.FC<JjScriptSuccessNotificationProps> = ({
    operation,
    target,
    secondary,
    connector = 'to',
    details,
    compact = false,
    variant: variantOverride,
}) => {
    const icon = getOperationIcon(operation);
    const variant = variantOverride || getOperationVariant(operation);

    if (compact) {
        return (
            <div className={`jjscript-success-notification compact ${variant}`}>
                <i className={`bi ${icon} notification-icon`} />
                <span className="operation-text">{operation}</span>
                <span className="target-badge">{target}</span>
                {secondary && (
                    <>
                        <span className="connector">{connector}</span>
                        <span className="target-badge secondary">{secondary}</span>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className={`jjscript-success-notification ${variant}`}>
            <div className="notification-header">
                <i className={`bi ${icon} notification-icon`} />
                <span className="operation-text">{operation}</span>
            </div>

            <div className="notification-body">
                <span className="target-badge">{target}</span>

                {secondary && (
                    <>
                        <span className="connector">{connector}</span>
                        <span className="target-badge secondary">{secondary}</span>
                    </>
                )}
            </div>

            {details && (
                <div className="notification-details">
                    {details}
                </div>
            )}
        </div>
    );
};

// ============================================
// HELPER TO PARSE EXECUTION RESULT
// ============================================

export interface ParsedNotification {
    operation: string;
    target: string;
    secondary?: string;
    connector?: string;
    details?: string;
}

/**
 * Parse an ExecutionResult message into notification props
 */
export function parseExecutionResult(
    command: string,
    message: string,
    data?: any
): ParsedNotification {
    // Try to extract meaningful parts from the message
    // Common patterns:
    // "Created class 'MyClass'"
    // "Deleted 'Status'"
    // "Renamed 'oldName' to 'newName'"
    // "Added literal 'ACTIVE' to 'Status'"
    // "Set MyClass.singleton = true"

    // Extract quoted names
    const quotedNames = message.match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || [];

    // Determine operation text based on command and message
    let operation = command.charAt(0).toUpperCase() + command.slice(1);
    let target = quotedNames[0] || data?.name || 'element';
    let secondary: string | undefined;
    let connector = 'to';
    let details: string | undefined;

    // Handle specific command patterns
    switch (command.toLowerCase()) {
        case 'create':
            // "Created class 'MyClass'" -> operation: "Created class", target: "MyClass"
            const typeMatch = message.match(/Created (\w+(?:\s+\w+)?)/i);
            if (typeMatch) {
                operation = `Created ${typeMatch[1]}`;
            }
            break;

        case 'delete':
            operation = 'Deleted';
            if (data?.type) {
                operation = `Deleted ${data.type}`;
            }
            break;

        case 'rename':
            operation = 'Renamed';
            if (quotedNames.length >= 2) {
                target = quotedNames[0];
                secondary = quotedNames[1];
                connector = '\u2192'; // Arrow
            }
            break;

        case 'add':
            // "Added literal 'ACTIVE' to 'Status'"
            const addTypeMatch = message.match(/Added (\w+)/i);
            if (addTypeMatch) {
                operation = `Added ${addTypeMatch[1]}`;
            }
            if (quotedNames.length >= 2) {
                target = quotedNames[0];
                secondary = quotedNames[1];
            }
            break;

        case 'remove':
            operation = 'Removed';
            if (message.includes('superclass')) {
                operation = 'Removed inheritance';
            }
            break;

        case 'set':
            operation = 'Updated';
            // "Set MyClass.singleton = true"
            const setMatch = message.match(/Set (\S+)\s*=\s*(.+)/i);
            if (setMatch) {
                target = setMatch[1];
                details = `= ${setMatch[2]}`;
            }
            break;

        case 'move':
            operation = 'Moved';
            if (quotedNames.length >= 2) {
                target = quotedNames[0];
                secondary = quotedNames[1];
            }
            break;

        case 'copy':
            operation = 'Copied';
            if (quotedNames.length >= 2) {
                target = quotedNames[0];
                secondary = quotedNames[1];
            }
            break;

        case 'extends':
            operation = 'Set inheritance';
            if (data?.childName && data?.parentName) {
                target = data.childName;
                secondary = data.parentName;
                connector = 'extends';
            } else if (quotedNames.length >= 2) {
                target = quotedNames[0];
                secondary = quotedNames[1];
                connector = 'extends';
            }
            break;
    }

    return { operation, target, secondary, connector, details };
}

export default JjScriptSuccessNotification;
