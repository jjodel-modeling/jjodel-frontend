import React from 'react';
import './unsaved-changes-dialog.scss';

interface UnsavedChangesDialogProps {
    isOpen: boolean;
    onDontSave: () => void;
    onCancel: () => void;
    onSave: () => void;
    isSaving?: boolean;
}

const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
    isOpen,
    onDontSave,
    onCancel,
    onSave,
    isSaving = false,
}) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="unsaved-dialog-overlay" onClick={handleOverlayClick}>
            <div className="unsaved-dialog">
                <div className="unsaved-dialog__icon">
                    <i className="bi bi-exclamation-triangle" />
                </div>
                <h2 className="unsaved-dialog__title">Unsaved changes</h2>
                <p className="unsaved-dialog__message">
                    You have unsaved changes. What do you want to do?
                </p>
                <div className="unsaved-dialog__actions">
                    <button
                        className="unsaved-dialog__btn unsaved-dialog__btn--text"
                        onClick={onDontSave}
                        disabled={isSaving}
                    >
                        Don't save
                    </button>
                    <button
                        className="unsaved-dialog__btn unsaved-dialog__btn--secondary"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        className="unsaved-dialog__btn unsaved-dialog__btn--primary"
                        onClick={onSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <i className="bi bi-arrow-repeat spinning" />
                                Saving...
                            </>
                        ) : (
                            'Save & Exit'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnsavedChangesDialog;
