import React, { useState, useRef, useEffect } from 'react';
import { LModel, LProject, LViewPoint, U } from '../../joiner';
import DockManager from '../abstract/DockManager';
import { createM2 } from '../../pages/components/Navbar';
import { formatVersion } from '../../utils/versionUtils';
import './project-editor.scss';

interface ProjectEditorProps {
    project: LProject;
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
const ProjectEditor: React.FC<ProjectEditorProps> = ({ project }) => {
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

    // Name editing handlers
    const handleStartEditName = () => {
        setEditedName(project.name || '');
        setIsEditingName(true);
    };

    const handleSaveName = () => {
        if (editedName.trim()) {
            project.name = editedName.trim();
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
        project.description = editedDescription.trim();
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
            }
            setNewTag('');
        }
        setIsAddingTag(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        project.tags = tags.filter(t => t !== tagToRemove);
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddTag();
        } else if (e.key === 'Escape') {
            setNewTag('');
            setIsAddingTag(false);
        }
    };

    // Type toggle handler
    const handleToggleType = () => {
        project.type = project.type === 'public' ? 'private' : 'public';
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
                        onClick={handleToggleType}
                        title="Click to toggle visibility"
                    >
                        {project.type || 'private'}
                        <i className="bi bi-arrow-left-right" />
                    </button>
                    <span className="badge badge--version">{formatVersion(project.version)}</span>
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
                    <button className="btn btn--primary" onClick={handleCreateMetamodel}>
                        + New
                    </button>
                </div>

                {metamodels.length === 0 ? (
                    <div className="empty-state empty-state--dashed">
                        <span className="empty-state__icon">
                            <i className="bi bi-diagram-3" />
                        </span>
                        <h3 className="empty-state__title">No metamodels yet</h3>
                        <p className="empty-state__text">Create your first metamodel to get started</p>
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
                    <div className="empty-state empty-state--subtle">
                        <p className="empty-state__text-inline">
                            {metamodels.length === 0
                                ? 'No models yet · Create a metamodel first'
                                : 'No models yet · Create a model from a metamodel'}
                        </p>
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
        </div>
    );
};

export default ProjectEditor;
