import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../common/Button';
import '../CreateProjectDialog/create-project-dialog.scss';

/** One class of the project, as the tree lists it. */
export interface NewViewClassOption {
    id: string;
    name: string;
    metamodelId: string;
    metamodelName: string;
}

/**
 * What the new view applies to. A class goes through `createViewInWorkbench`, the same
 * creator as the class's own context menu; `all` is the wildcard default view.
 */
export type NewViewTarget =
    | { kind: 'class'; classId: string; className: string }
    | { kind: 'all' };

export interface NewViewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (target: NewViewTarget) => void;
    classes: NewViewClassOption[];
}

/**
 * The one question the viewpoint `+` asks before creating a view: what it applies to.
 * A view born with an IR cannot be neutral on the canvas, so the question cannot be
 * postponed to the editor (discovery_2026-09-15_plus_view_ir_seed.md §3).
 */
export const NewViewDialog: React.FC<NewViewDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    classes,
}) => {
    const hasClasses = classes.length > 0;
    const [targetKind, setTargetKind] = useState<'class' | 'all'>('class');
    const [classId, setClassId] = useState('');
    const selectRef = useRef<HTMLSelectElement>(null);
    const wasOpenRef = useRef(false);

    // Classes grouped by metamodel, keyed by id: two metamodels may share a name.
    const groups = useMemo(() => {
        const byMetamodel = new Map<string, { name: string; classes: NewViewClassOption[] }>();
        for (const c of classes) {
            const g = byMetamodel.get(c.metamodelId) ?? { name: c.metamodelName, classes: [] };
            g.classes.push(c);
            byMetamodel.set(c.metamodelId, g);
        }
        return Array.from(byMetamodel.entries());
    }, [classes]);

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            setTargetKind(hasClasses ? 'class' : 'all');
            setClassId(classes[0]?.id ?? '');
            if (hasClasses) setTimeout(() => selectRef.current?.focus(), 100);
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
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (targetKind === 'class') {
            const picked = classes.find((c) => c.id === classId);
            if (!picked) return;
            onSubmit({ kind: 'class', classId: picked.id, className: picked.name });
        } else {
            onSubmit({ kind: 'all' });
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="dialog-overlay" onClick={handleOverlayClick}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="dialog-header">
                    <div className="dialog-header-icon">
                        <i className="bi bi-easel" />
                    </div>
                    <h2>New view</h2>
                    <button className="dialog-close" onClick={onClose} aria-label="Close">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="dialog-body">
                        <div className="form-group">
                            <label>Applies to</label>
                            <div className="radio-group">
                                {hasClasses && (
                                    <label className={`radio-card ${targetKind === 'class' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="new-view-target"
                                            value="class"
                                            checked={targetKind === 'class'}
                                            onChange={() => setTargetKind('class')}
                                        />
                                        <div className="radio-card-content">
                                            <i className="bi bi-box-seam" />
                                            <div className="radio-card-text">
                                                <span className="radio-card-title">A class</span>
                                                <span className="radio-card-desc">Objects of the class picked below</span>
                                            </div>
                                        </div>
                                    </label>
                                )}
                                <label className={`radio-card ${targetKind === 'all' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="new-view-target"
                                        value="all"
                                        checked={targetKind === 'all'}
                                        onChange={() => setTargetKind('all')}
                                    />
                                    <div className="radio-card-content">
                                        <i className="bi bi-asterisk" />
                                        <div className="radio-card-text">
                                            <span className="radio-card-title">All classes (default view)</span>
                                            <span className="radio-card-desc">Applies to every object with no more specific view. Choosing it changes how the canvas renders.</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {hasClasses ? (
                            <div className="form-group">
                                <label htmlFor="new-view-class">Class</label>
                                <select
                                    ref={selectRef}
                                    id="new-view-class"
                                    className="form-select"
                                    value={classId}
                                    disabled={targetKind !== 'class'}
                                    onChange={(e) => setClassId(e.target.value)}
                                >
                                    {groups.map(([mmId, g]) => (
                                        <optgroup key={mmId} label={g.name}>
                                            {g.classes.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <span className="form-hint">
                                <span>No classes in this project yet.</span>
                            </span>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="dialog-footer">
                        <Button variant="secondary" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            <i className="bi bi-plus-lg" />
                            Create View
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewViewDialog;
