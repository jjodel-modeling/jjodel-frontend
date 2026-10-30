import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '../common/Button';
import { createProjectRefactoring, projectTargetCandidates, readProjectScripts } from './scriptFiles';
import { uniqueScriptName, type TargetCandidate } from './projectScripts';
import '../CreateProjectDialog/create-project-dialog.scss';
import '../NewModelDialog/NewModelDialog.scss';

export interface NewRefactoringDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_NAME = 'refactoring';

const sameCandidates = (a: TargetCandidate[], b: TargetCandidate[]) =>
    a.length === b.length && a.every((m, i) => m.id === b[i].id && m.name === b[i].name && m.isMetamodel === b[i].isMetamodel);

/**
 * New Refactoring dialog (R-JJD-14): the target level, Metamodel or Model, and for Model the
 * metamodel whose models it changes. Opened by the «+» artifact menu and the tree's «New
 * refactoring»; creates an empty entry of `DProject.scripts` and opens its tab. Builds on the New
 * model dialog's classes (`tpl-nmd`), so the two read as one family.
 */
export const NewRefactoringDialog: React.FC<NewRefactoringDialogProps> = ({ isOpen, onClose }) => {
    const candidates = useSelector((state: any) => projectTargetCandidates(state), sameCandidates);
    const metamodels = candidates.filter(c => c.isMetamodel);
    const [level, setLevel] = useState<'M2' | 'M1'>('M2');
    const [metamodelId, setMetamodelId] = useState<string | undefined>(undefined);
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const wasOpenRef = useRef(false);

    // Reset the form when the dialog opens
    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            setLevel('M2');
            setMetamodelId(metamodels.length === 1 ? metamodels[0].id : undefined);
            setName(uniqueScriptName(DEFAULT_NAME, readProjectScripts()));
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        wasOpenRef.current = isOpen;
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    // ESC to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const selectedMetamodel = metamodels.find(mm => mm.id === metamodelId);
    const canSubmit = level === 'M2' || !!selectedMetamodel;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        createProjectRefactoring({
            name: name.trim() || DEFAULT_NAME,
            level,
            metamodelId: level === 'M1' ? selectedMetamodel?.id : undefined,
        });
        onClose();
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    const levels: Array<{ id: 'M2' | 'M1'; title: string; desc: string; icon: string }> = [
        { id: 'M2', title: 'Metamodel', desc: 'Changes a metamodel in place', icon: 'boxes' },
        { id: 'M1', title: 'Model', desc: 'Changes a model of one metamodel in place', icon: 'box' },
    ];

    return (
        <div className="dialog-overlay" onClick={handleOverlayClick}>
            <div
                className="dialog-content tpl-nmd tpl-nrd"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tpl-nrd-title"
                aria-describedby="tpl-nrd-subtitle"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="dialog-header">
                    <div className="dialog-header-icon">
                        <i className="bi bi-arrow-repeat" aria-hidden="true" />
                    </div>
                    <div className="tpl-nmd__titles">
                        <h2 id="tpl-nrd-title">New refactoring</h2>
                        <p id="tpl-nrd-subtitle" className="tpl-nmd__subtitle">
                            Choose what the refactoring changes.
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
                            <span className="tpl-nmd__label" id="tpl-nrd-level-label">Target level</span>
                            <div className="radio-group" role="radiogroup" aria-labelledby="tpl-nrd-level-label">
                                {levels.map(l => (
                                    <label key={l.id} className={`radio-card ${l.id === level ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="tpl-nrd-level"
                                            value={l.id}
                                            checked={l.id === level}
                                            onChange={() => setLevel(l.id)}
                                        />
                                        <div className="radio-card-content">
                                            <i className={`bi bi-${l.icon}`} aria-hidden="true" />
                                            <div className="radio-card-text">
                                                <span className="radio-card-title">{l.title}</span>
                                                <span className="radio-card-desc">{l.desc}</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {level === 'M1' && (
                            <div className="form-group">
                                <span className="tpl-nmd__label" id="tpl-nrd-mm-label">Models of the metamodel</span>
                                {metamodels.length === 0 ? (
                                    <p className="tpl-nmd__empty">This project has no metamodel yet.</p>
                                ) : (
                                    <div className="radio-group" role="radiogroup" aria-labelledby="tpl-nrd-mm-label">
                                        {metamodels.map(mm => {
                                            const count = candidates.filter(c => c.metamodelId === mm.id).length;
                                            return (
                                                <label key={mm.id} className={`radio-card ${mm.id === metamodelId ? 'selected' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="tpl-nrd-metamodel"
                                                        value={mm.id}
                                                        checked={mm.id === metamodelId}
                                                        onChange={() => setMetamodelId(mm.id)}
                                                    />
                                                    <div className="radio-card-content">
                                                        <i className="bi bi-diagram-3" aria-hidden="true" />
                                                        <div className="radio-card-text">
                                                            <span className="radio-card-title">{mm.name || 'Unnamed'}</span>
                                                            <span className="radio-card-desc">
                                                                {count === 1 ? '1 model' : `${count} models`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="tpl-nrd-name">Refactoring name</label>
                            <input
                                ref={inputRef}
                                id="tpl-nrd-name"
                                type="text"
                                className="form-input"
                                value={name}
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
                        <Button variant="primary" type="submit" disabled={!canSubmit}>
                            Create refactoring
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewRefactoringDialog;
