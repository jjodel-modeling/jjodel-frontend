/**
 * JjTL Dialog Manager Component
 * Orchestrates all JjTL interactive dialogs and toasts
 *
 * Mount this component once at app level to enable JjTL interactive features.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { dialogManager, DialogRequest } from '../../executor/ReactUIBridge';
import { setUIBridge, ReactUIBridge } from '../../executor';
import { JjtlAlertDialog } from './JjtlAlertDialog';
import { JjtlPromptDialog } from './JjtlPromptDialog';
import { JjtlInputDialog } from './JjtlInputDialog';
import { JjtlNotifyToast, useToasts } from './JjtlNotifyToast';
import './JjtlDialogs.scss';

interface DialogState {
    request: DialogRequest | null;
}

export const JjtlDialogManager: React.FC = () => {
    const [dialog, setDialog] = useState<DialogState>({ request: null });
    const { toasts, addToast, removeToast } = useToasts();

    // Handle incoming dialog requests
    const handleRequest = useCallback((request: DialogRequest) => {
        if (request.type === 'notify') {
            // Notify is non-blocking, just add toast
            addToast(request.message, request.duration);
        } else {
            // Blocking dialogs
            setDialog({ request });
        }
    }, [addToast]);

    // Subscribe to dialog manager
    useEffect(() => {
        // Register React UI Bridge as the active bridge
        const reactBridge = new ReactUIBridge(dialogManager);
        setUIBridge(reactBridge);

        // Subscribe to dialog requests
        const unsubscribe = dialogManager.subscribe(handleRequest);

        return () => {
            unsubscribe();
        };
    }, [handleRequest]);

    // Handle dialog close
    const handleClose = useCallback(() => {
        setDialog({ request: null });
    }, []);

    // Render current dialog
    const renderDialog = () => {
        const { request } = dialog;
        if (!request) return null;

        switch (request.type) {
            case 'alert':
                return (
                    <JjtlAlertDialog
                        message={request.message}
                        alertType={request.alertType}
                        onClose={() => {
                            request.resolve();
                            handleClose();
                        }}
                    />
                );

            case 'prompt':
                return (
                    <JjtlPromptDialog
                        message={request.message}
                        defaultValue={request.defaultValue}
                        onSubmit={(result) => {
                            request.resolve(result);
                            handleClose();
                        }}
                    />
                );

            case 'input':
                return (
                    <JjtlInputDialog
                        message={request.message}
                        inputType={request.inputType}
                        defaultValue={request.defaultValue}
                        options={request.options}
                        onSubmit={(result) => {
                            request.resolve(result);
                            handleClose();
                        }}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <>
            {renderDialog()}
            <JjtlNotifyToast toasts={toasts} onRemove={removeToast} />
        </>
    );
};

export default JjtlDialogManager;
