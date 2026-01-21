import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LModel, LProject, LViewPoint, U, store } from '../../joiner';
import DockManager from '../abstract/DockManager';
import { createM2 } from '../../pages/components/Navbar';
import { formatVersionNumber } from '../../utils/versionUtils';
import ShareProjectModal from './ShareProjectModal';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import './project-editor.scss';

/**
 * Get the engine (platform) version from the Redux store
 */
const getEngineVersion = (): string => {
    const state = store.getState();
    return `v${state.version?.n || '2.0'}`;
};

interface ProjectEditorProps {
    project: LProject;
    onNavigateBack?: () => void;  // Optional callback when user wants to navigate back
}

/**
 * Format date for display
 */
const formatDate = (date: Date | string | number | undefined): string => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Project Editor - Clean minimal layout
 * Shows project header with badges, and sections for metamodels, models, viewpoints
 */
const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, onNavigateBack }) => {
    const metamodels = project.metamodels || [];
    const models = project.models || [];
    const viewpoints = project.viewpoints || [];
    const tags = project.tags || [];

    // Editing states
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedName, setEditedName] = useState(project.name || '');
    const [editedDescription, setEditedDescription] = useState(project.description || '');
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Unsaved changes tracking
    const [isDirty, setIsDirty] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const pendingActionRef = useRef<(() => void) | null>(null);

    const nameInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
    const tagInputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    useEffect(() => {
        if (isEditingDescription && descriptionInputRef.current) {
            descriptionInputRef.current.focus();
            descriptionInputRef.current.select();
        }
    }, [isEditingDescription]);

    useEffect(() => {
        if (isAddingTag && tagInputRef.current) {
            tagInputRef.current.focus();
        }
    }, [isAddingTag]);

    // Sync with project changes
    useEffect(() => {
        setEditedName(project.name || '');
        setEditedDescription(project.description || '');
    }, [project.name, project.description]);

    // Browser beforeunload handler - use global handler from U
    // This allows LeftBar and other components to disable it before programmatic navigation
    useEffect(() => {
        // Enable the warning when component mounts
        U.enableUnsavedChangesWarning();

        // Disable when component unmounts
        return () => U.disableUnsavedChangesWarning();
    }, []);

    // Mark project as dirty (unsaved changes)
    // Sets both local state and global U.isProjectModified for consistency
    const markDirty = useCallback(() => {
        setIsDirty(true);
        U.isProjectModified = true;
    }, []);

    // Clear dirty state (after save)
    // Resets both local state and global U.isProjectModified
    const clearDirty = useCallback(() => {
        setIsDirty(false);
        U.isProjectModified = false;
    }, []);

    // Handle navigation with unsaved changes check
    const handleNavigateWithCheck = useCallback((action: () => void) => {
        if (isDirty) {
            pendingActionRef.current = action;
            setShowUnsavedDialog(true);
        } else {
            action();
        }
    }, [isDirty]);

    // Handle back navigation with unsaved changes check
    const handleBackNavigation = useCallback(() => {
        if (onNavigateBack) {
            handleNavigateWithCheck(onNavigateBack);
        }
    }, [onNavigateBack, handleNavigateWithCheck]);

    // Unsaved dialog handlers
    const handleDontSave = useCallback(() => {
        setShowUnsavedDialog(false);
        clearDirty();
        if (pendingActionRef.current) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }
    }, [clearDirty]);

    const handleCancelDialog = useCallback(() => {
        setShowUnsavedDialog(false);
        pendingActionRef.current = null;
    }, []);

    const handleSaveAndContinue = useCallback(async () => {
        setIsSaving(true);
        try {
            // Trigger project save - this depends on your save implementation
            // For example: await project.save() or dispatch a save action
            // For now, we'll simulate a brief delay for the save operation
            await new Promise(resolve => setTimeout(resolve, 500));

            clearDirty();
            setShowUnsavedDialog(false);

            if (pendingActionRef.current) {
                pendingActionRef.current();
                pendingActionRef.current = null;
            }
        } catch (error) {
            console.error('Failed to save project:', error);
            U.alert('e', 'Save failed', 'Could not save the project. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }, [clearDirty]);

    // Name editing handlers
    const handleStartEditName = () => {
        setEditedName(project.name || '');
        setIsEditingName(true);
    };

    const handleSaveName = () => {
        if (editedName.trim()) {
            const newName = editedName.trim();
            if (newName !== project.name) {
                project.name = newName;
                markDirty();
            }
        } else {
            U.alert('e', 'Name required', 'Project name cannot be empty');
            setEditedName(project.name || '');
        }
        setIsEditingName(false);
    };

    const handleCancelEditName = () => {
        setEditedName(project.name || '');
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveName();
        } else if (e.key === 'Escape') {
            handleCancelEditName();
        }
    };

    // Description editing handlers
    const handleStartEditDescription = () => {
        setEditedDescription(project.description || '');
        setIsEditingDescription(true);
    };

    const handleSaveDescription = () => {
        const newDescription = editedDescription.trim();
        if (newDescription !== project.description) {
            project.description = newDescription;
            markDirty();
        }
        setIsEditingDescription(false);
    };

    const handleCancelEditDescription = () => {
        setEditedDescription(project.description || '');
        setIsEditingDescription(false);
    };

    const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancelEditDescription();
        }
    };

    // Tag handlers - supports comma-separated multiple tags
    const handleAddTag = () => {
        if (newTag.trim()) {
            // Split by comma, trim each, filter empty and duplicates
            const newTags = newTag
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0 && !tags.includes(t));

            if (newTags.length > 0) {
                project.tags = [...tags, ...newTags];
                markDirty();
            }
            setNewTag('');
        }
        setIsAddingTag(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        project.tags = tags.filter(t => t !== tagToRemove);
        markDirty();
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddTag();
        } else if (e.key === 'Escape') {
            setNewTag('');
            setIsAddingTag(false);
        }
    };

    // Type toggle handler - toggles between public/private
    const handleToggleType = () => {
        project.type = project.type === 'public' ? 'private' : 'public';
        markDirty();
    };

    // Handle badge click - if public, open share modal; if private, toggle to public
    const handleVisibilityBadgeClick = () => {
        if (project.type === 'public') {
            setShowShareModal(true);
        } else {
            handleToggleType();
        }
    };

    const handleOpenMetamodel = async (mm: LModel) => {
        await DockManager.open2(mm);
    };

    const handleOpenModel = async (model: LModel) => {
        await DockManager.open2(model);
    };

    const handleCreateMetamodel = () => {
        createM2(project);
    };

    const handleDeleteMetamodel = (mm: LModel) => {
        mm.delete();
    };

    const handleDeleteModel = (model: LModel) => {
        model.delete();
    };

    const handleDuplicateViewpoint = (vp: LViewPoint) => {
        vp.duplicate();
    };

    const handleDeleteViewpoint = (vp: LViewPoint) => {
        vp.delete();
    };

    return (
        <div className="project-editor">
            {/* Header */}
            <div className="project-header">
                <div className="project-header__badges">
                    <button
                        className={`badge badge--type badge--clickable ${project.type === 'public' ? 'badge--public' : ''}`}
                        onClick={handleVisibilityBadgeClick}
                        title={project.type === 'public' ? 'Click to get share link' : 'Click to make public'}
                    >
                        {project.type || 'private'}
                        {project.type === 'public' ? (
                            <i className="bi bi-link-45deg" />
                        ) : (
                            <i className="bi bi-arrow-left-right" />
                        )}
                    </button>
                    {project.type === 'public' && (
                        <button
                            className="badge-toggle-btn"
                            onClick={handleToggleType}
                            title="Make private"
                        >
                            <i className="bi bi-lock" />
                        </button>
                    )}
                    <span
                        className="badge badge--engine"
                        title="Jjodel platform version - Same for all projects"
                    >
                        <i className="bi bi-gear" />
                        {getEngineVersion()}
                    </span>
                    <span
                        className="badge badge--content"
                        title="Project revision - Auto-increments on each save"
                    >
                        Rev {formatVersionNumber(project.version)}
                    </span>
                </div>

                {/* Editable Name */}
                <div className="project-header__title-row">
                    {isEditingName ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            className="project-header__title-input"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={handleNameKeyDown}
                        />
                    ) : (
                        <h1
                            className="project-header__title"
                            onClick={handleStartEditName}
                        >
                            {project.name || 'Unnamed Project'}
                            <button className="edit-btn" title="Edit name">
                                <i className="bi bi-pencil" />
                            </button>
                        </h1>
                    )}
                </div>

                {/* Editable Description */}
                <div className="project-header__description-row">
                    {isEditingDescription ? (
                        <textarea
                            ref={descriptionInputRef}
                            className="project-header__description-input"
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            onBlur={handleSaveDescription}
                            onKeyDown={handleDescriptionKeyDown}
                            rows={3}
                            placeholder="Add a project description..."
                        />
                    ) : (
                        <p
                            className="project-header__description"
                            onClick={handleStartEditDescription}
                        >
                            {project.description || 'Click to add a description...'}
                            <button className="edit-btn" title="Edit description">
                                <i className="bi bi-pencil" />
                            </button>
                        </p>
                    )}
                </div>

                {/* Tags */}
                <div className="project-tags">
                    {tags.map((tag) => (
                        <span key={tag} className="project-tag">
                            {tag}
                            <button
                                className="project-tag__remove"
                                onClick={() => handleRemoveTag(tag)}
                                title="Remove tag"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {isAddingTag ? (
                        <div className="project-tag__input-wrapper">
                            <input
                                ref={tagInputRef}
                                type="text"
                                className="project-tag__input"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onBlur={handleAddTag}
                                onKeyDown={handleTagKeyDown}
                                placeholder="e.g. client, server, api"
                            />
                            <span className="project-tag__hint">
                                Use commas to add multiple tags
                            </span>
                        </div>
                    ) : (
                        <button
                            className="project-tag project-tag--add"
                            onClick={() => setIsAddingTag(true)}
                        >
                            + Add tags
                        </button>
                    )}
                </div>

                {/* Dates */}
                <div className="project-dates">
                    <span>Created: {formatDate(project.creation)}</span>
                    <span className="project-dates__separator">·</span>
                    <span>Modified: {formatDate(project.lastModified)}</span>
                </div>
            </div>

            {/* Metamodels Section */}
            <div className="project-section">
                <div className="project-section__header">
                    <h2 className="project-section__title">METAMODELS</h2>
                    {metamodels.length > 0 && (
                        <button className="btn btn--primary" onClick={handleCreateMetamodel}>
                            + New
                        </button>
                    )}
                </div>

                {metamodels.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">
                            <i className="bi bi-diagram-3" />
                        </div>
                        <h3 className="empty-state__title">No metamodels yet</h3>
                        <p className="empty-state__description">
                            Create a metamodel to define the structure and rules for your domain models.
                        </p>
                        <button
                            className="btn btn--primary btn--empty-state"
                            onClick={handleCreateMetamodel}
                        >
                            Create Your First Metamodel
                        </button>
                    </div>
                ) : (
                    <div className="list-card">
                        {metamodels.map((mm) => (
                            <div className="list-card__item" key={mm.id}>
                                <span className="list-card__icon list-card__icon--mm">M</span>
                                <div className="list-card__content">
                                    <div className="list-card__name">{mm.name || 'Unnamed'}</div>
                                    <div className="list-card__type">Metamodel</div>
                                </div>
                                <div className="list-card__actions">
                                    <button
                                        className="icon-btn"
                                        title="Open"
                                        onClick={() => handleOpenMetamodel(mm)}
                                    >
                                        <i className="bi bi-box-arrow-up-right" />
                                    </button>
                                    <button
                                        className="icon-btn icon-btn--danger"
                                        title="Delete"
                                        onClick={() => handleDeleteMetamodel(mm)}
                                    >
                                        <i className="bi bi-trash" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Models Section */}
            <div className="project-section">
                <div className="project-section__header">
                    <h2 className="project-section__title">MODELS</h2>
                    <button
                        className="btn btn--primary"
                        disabled={metamodels.length === 0}
                        title={metamodels.length === 0 ? 'Create a metamodel first' : 'Create new model'}
                    >
                        + New
                    </button>
                </div>

                {models.length === 0 ? (
                    <div className="empty-state empty-state--secondary">
                        <div className="empty-state__icon empty-state__icon--small">
                            <i className="bi bi-box" />
                        </div>
                        <h3 className="empty-state__title">
                            {metamodels.length === 0 ? 'Create a metamodel first' : 'No models yet'}
                        </h3>
                        <p className="empty-state__description">
                            {metamodels.length === 0
                                ? 'Models are instances of metamodels. You need to create a metamodel structure before you can create models.'
                                : 'Create a model to instantiate your metamodel.'}
                        </p>
                        {metamodels.length === 0 && (
                            <div className="empty-state__hint">
                                <i className="bi bi-arrow-up" />
                                <span>Create your first metamodel in the section above</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="list-card">
                        {models.map((model) => (
                            <div className="list-card__item" key={model.id}>
                                <span className="list-card__icon list-card__icon--model">m</span>
                                <div className="list-card__content">
                                    <div className="list-card__name">{model.name || 'Unnamed'}</div>
                                    <div className="list-card__type">
                                        Model {model.instanceof?.name ? `· ${model.instanceof.name}` : ''}
                                    </div>
                                </div>
                                <div className="list-card__actions">
                                    <button
                                        className="icon-btn"
                                        title="Open"
                                        onClick={() => handleOpenModel(model)}
                                    >
                                        <i className="bi bi-box-arrow-up-right" />
                                    </button>
                                    <button
                                        className="icon-btn icon-btn--danger"
                                        title="Delete"
                                        onClick={() => handleDeleteModel(model)}
                                    >
                                        <i className="bi bi-trash" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Viewpoints Section */}
            <div className="project-section">
                <div className="project-section__header">
                    <h2 className="project-section__title">
                        VIEWPOINTS {viewpoints.length > 0 && `(${viewpoints.length})`}
                    </h2>
                    <button className="btn btn--secondary" disabled>
                        + Add
                    </button>
                </div>

                {viewpoints.length === 0 ? (
                    <div className="empty-state empty-state--subtle">
                        <p className="empty-state__text-inline">No viewpoints defined</p>
                    </div>
                ) : (
                    <div className="list-card">
                        {viewpoints.map((vp) => {
                            if (!vp) return null;
                            const isDefault = vp.name === 'Default' || vp.name === 'Validation default';
                            return (
                                <div className="list-card__item" key={vp.id || vp.name}>
                                    <span className="list-card__icon list-card__icon--vp">V</span>
                                    <div className="list-card__content">
                                        <div className="list-card__name">{vp.name || 'Unnamed'}</div>
                                        <div className="list-card__type">
                                            {vp.isOverlay ? 'Overlay Viewpoint' : 'Viewpoint'}
                                        </div>
                                    </div>
                                    <div className="list-card__actions">
                                        <button className="icon-btn" title="View" disabled>
                                            <i className="bi bi-eye" />
                                        </button>
                                        <button
                                            className="icon-btn"
                                            title="Duplicate"
                                            onClick={() => handleDuplicateViewpoint(vp)}
                                        >
                                            <i className="bi bi-copy" />
                                        </button>
                                        {!isDefault && (
                                            <button
                                                className="icon-btn icon-btn--danger"
                                                title="Delete"
                                                onClick={() => handleDeleteViewpoint(vp)}
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Share Modal */}
            <ShareProjectModal
                project={project}
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
            />

            {/* Unsaved Changes Dialog */}
            <UnsavedChangesDialog
                isOpen={showUnsavedDialog}
                onDontSave={handleDontSave}
                onCancel={handleCancelDialog}
                onSave={handleSaveAndContinue}
                isSaving={isSaving}
            />
        </div>
    );
};

export default ProjectEditor;
