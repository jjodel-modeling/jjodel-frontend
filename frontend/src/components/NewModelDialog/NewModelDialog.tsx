import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { U } from '../../joiner';
import '../CreateProjectDialog/create-project-dialog.scss';
import './NewModelDialog.scss';

/** One metamodel of the open project, as the dialog lists it. */
export interface NewModelDialogMetamodel {
    id: string;
    name: string;
    /** Models of the project conforming to it. */
    modelCount: number;
}

export interface NewModelDialogProps {
    isOpen: boolean;
    onClose: () => void;
    /** `name` is what the user typed, trimmed; the creator makes it unique. */
    onSubmit: (data: { metamodelId: string; name: string }) => void;
    metamodels: NewModelDialogMetamodel[];
    /** Every model and metamodel name of the project: `DModel.new` keeps a name only when it is
     *  unique among them, so the default name avoids them all. */
    takenNames: string[];
    /** Metamodel selected when the dialog opens. */
    initialMetamodelId?: string;
}

/** The auto name of `createM1` (`Navbar.tsx`), counted over the pool `DModel.new` checks, so
 *  the default shown is the name the model gets. */
function autoModelName(takenNames: string[]): string {
    return U.increaseEndingNumber('model_' + 1, false, false, n => takenNames.indexOf(n) >= 0);
}

/**
 * New model dialog, «Metamodel in this project» only (R-LIB-20: no Built-in notation tab in
 * 3.2, so no tab bar). Opened by the models section's «+ New», the project rail's `+` and
 * `JjodelEvents.OPEN_NEW_MODEL_DIALOG`.
 */
export const NewModelDialog: React.FC<NewModelDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    metamodels,
    takenNames,
    initialMetamodelId,
}) => {
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const wasOpenRef = useRef(false);

    const selected = metamodels.find(mm => mm.id === selectedId);

    // Reset the form when the dialog opens
    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            const initial = metamodels.find(mm => mm.id === initialMetamodelId)
                || (metamodels.length === 1 ? metamodels[0] : undefined);
            setSelectedId(initial?.id);
            setName(autoModelName(takenNames));
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        wasOpenRef.current = isOpen;
    }, [isOpen]);

    // ESC to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        onSubmit({ metamodelId: selected.id, name: name.trim() });
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="dialog-overlay" onClick={handleOverlayClick}>
            <div
                className="dialog-content tpl-nmd"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tpl-nmd-title"
                aria-describedby="tpl-nmd-subtitle"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="dialog-header">
                    <div className="dialog-header-icon">
                        <i className="bi bi-box" aria-hidden="true" />
                    </div>
                    <div className="tpl-nmd__titles">
                        <h2 id="tpl-nmd-title">New model</h2>
                        <p id="tpl-nmd-subtitle" className="tpl-nmd__subtitle">
                            Choose what the model conforms to.
                        </p>
                    </div>
                    <button type="button" className="dialog-close" onClick={onClose} aria-label="Close">
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="dialog-body">
                        <div className="form-group">
                            <span className="tpl-nmd__label" id="tpl-nmd-mm-label">
                                Metamodel in this project
                            </span>
                            {metamodels.length === 0 ? (
                                <p className="tpl-nmd__empty">This project has no metamodel yet.</p>
                            ) : (
                                <div className="radio-group" role="radiogroup" aria-labelledby="tpl-nmd-mm-label">
                                    {metamodels.map((mm) => (
                                        <label
                                            key={mm.id}
                                            className={`radio-card ${mm.id === selectedId ? 'selected' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="tpl-nmd-metamodel"
                                                value={mm.id}
                                                checked={mm.id === selectedId}
                                                onChange={() => setSelectedId(mm.id)}
                                            />
                                            <div className="radio-card-content">
                                                <i className="bi bi-diagram-3" aria-hidden="true" />
                                                <div className="radio-card-text">
                                                    <span className="radio-card-title">{mm.name || 'Unnamed'}</span>
                                                    <span className="radio-card-desc">
                                                        {mm.modelCount === 1 ? '1 model' : `${mm.modelCount} models`}
                                                    </span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="tpl-nmd-name">Model name</label>
                            <input
                                ref={inputRef}
                                id="tpl-nmd-name"
                                type="text"
                                className="form-input"
                                value={name}
                                disabled={metamodels.length === 0}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <span className="form-hint">
                                <span>A name already used in this project gets a number added.</span>
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="dialog-footer">
                        <Button variant="secondary" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={!selected}>
                            Create model
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewModelDialog;
