import React, { useState, useEffect, useRef } from 'react';
import './create-project-dialog.scss';
import { DevModeLabel } from '../DevModeLabel/DevModeLabel';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: ProjectFormData) => void;
}

export interface ProjectFormData {
  name: string;
  description: string;
  type: 'private' | 'public' | 'collaborative';
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    type: 'private'
  });

  const [errors, setErrors] = useState<{ name?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setErrors({ name: 'Project name is required' });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);

      // Reset form on success
      setFormData({
        name: '',
        description: '',
        type: 'private'
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: '',
      description: '',
      type: 'private'
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={handleCancel}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        {/* Dev Mode Label */}
        <DevModeLabel componentId="T2.2" />

        {/* Header */}
        <div className="dialog-header">
          <div className="dialog-header-icon">
            <i className="bi bi-folder-plus" />
          </div>
          <h2>Create New Project</h2>
          <button className="dialog-close" onClick={handleCancel} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="dialog-body">

            {/* Project Name */}
            <div className="form-group">
              <label htmlFor="project-name">
                Project Name <span className="required">*</span>
              </label>
              <input
                ref={inputRef}
                id="project-name"
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="My Metamodel Project"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({});
                }}
                disabled={isSubmitting}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="project-description">Description</label>
              <textarea
                id="project-description"
                className="form-textarea"
                placeholder="Brief description of your project (optional)"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Project Type */}
            <div className="form-group">
              <label>Project Type</label>
              <div className="radio-group">
                <label className={`radio-card ${formData.type === 'private' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="projectType"
                    value="private"
                    checked={formData.type === 'private'}
                    onChange={() => setFormData({ ...formData, type: 'private' })}
                    disabled={isSubmitting}
                  />
                  <div className="radio-card-content">
                    <i className="bi bi-lock" />
                    <div className="radio-card-text">
                      <span className="radio-card-title">Private</span>
                      <span className="radio-card-desc">Only you can access this project</span>
                    </div>
                  </div>
                </label>

                <label className={`radio-card ${formData.type === 'public' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="projectType"
                    value="public"
                    checked={formData.type === 'public'}
                    onChange={() => setFormData({ ...formData, type: 'public' })}
                    disabled={isSubmitting}
                  />
                  <div className="radio-card-content">
                    <i className="bi bi-globe" />
                    <div className="radio-card-text">
                      <span className="radio-card-title">Public</span>
                      <span className="radio-card-desc">Anyone with the link can view</span>
                    </div>
                  </div>
                </label>

                <label className={`radio-card ${formData.type === 'collaborative' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="projectType"
                    value="collaborative"
                    checked={formData.type === 'collaborative'}
                    onChange={() => setFormData({ ...formData, type: 'collaborative' })}
                    disabled={isSubmitting}
                  />
                  <div className="radio-card-content">
                    <i className="bi bi-people" />
                    <div className="radio-card-text">
                      <span className="radio-card-title">Collaborative</span>
                      <span className="radio-card-desc">Invite others to edit together</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="dialog-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="bi bi-arrow-repeat spinning" />
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-lg" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreateProjectDialog;
