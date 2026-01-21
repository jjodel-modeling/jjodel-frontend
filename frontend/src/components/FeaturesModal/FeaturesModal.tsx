import React, { useState, useEffect, useCallback } from 'react';
import './features-modal.scss';

export interface FeatureItem {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

export interface FeaturesModalProps {
  isOpen: boolean;
  title?: string;
  features: FeatureItem[];
  onClose: () => void;
  onSelectFeature: (featureId: string) => void;
}

// Default metamodel features
export const METAMODEL_FEATURES: FeatureItem[] = [
  { id: 'DPackage', label: 'Package', icon: 'bi-folder', description: 'Container for organizing classes' },
  { id: 'DClass', label: 'Class', icon: 'bi-box', description: 'Define a new class type' },
  { id: 'DEnumerator', label: 'Enumeration', icon: 'bi-list-ul', description: 'Define enumeration type' },
  { id: 'DDataType', label: 'DataType', icon: 'bi-code-square', description: 'Define primitive data type' },
  { id: 'DInterface', label: 'Interface', icon: 'bi-diagram-3', description: 'Define interface contract' },
];

// Class features (children of a class)
export const CLASS_FEATURES: FeatureItem[] = [
  { id: 'DAttribute', label: 'Attribute', icon: 'bi-tag', description: 'Add a data attribute' },
  { id: 'DReference', label: 'Reference', icon: 'bi-link-45deg', description: 'Add a reference to another class' },
  { id: 'DOperation', label: 'Operation', icon: 'bi-braces', description: 'Add a method or operation' },
];

// Enumerator features
export const ENUM_FEATURES: FeatureItem[] = [
  { id: 'DLiteral', label: 'Literal', icon: 'bi-hash', description: 'Add an enumeration literal' },
];

// Operation features
export const OPERATION_FEATURES: FeatureItem[] = [
  { id: 'DParameter', label: 'Parameter', icon: 'bi-input-cursor', description: 'Add an operation parameter' },
  { id: 'DException', label: 'Exception', icon: 'bi-exclamation-diamond', description: 'Add an exception type' },
];

export const FeaturesModal: React.FC<FeaturesModalProps> = ({
  isOpen,
  title = 'Add Feature',
  features,
  onClose,
  onSelectFeature
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Handle escape key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelectFeature = (featureId: string) => {
    onSelectFeature(featureId);
    onClose();
  };

  // Filter features based on search query
  const filteredFeatures = features.filter(feature =>
    feature.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feature.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="features-modal" onClick={handleBackdropClick}>
      {/* Backdrop */}
      <div className="features-modal__backdrop" />

      {/* Modal Container */}
      <div
        className="features-modal__container"
        role="dialog"
        aria-labelledby="features-modal-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="features-modal__header">
          <div id="features-modal-title" className="features-modal__title">
            <i className="bi bi-plus-circle" />
            <span>{title}</span>
          </div>
          <button
            className="features-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Search (optional - shown if more than 5 features) */}
        {features.length > 5 && (
          <div className="features-modal__search">
            <i className="bi bi-search" />
            <input
              type="text"
              placeholder="Search features..."
              className="features-modal__search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Divider */}
        <div className="features-modal__divider" />

        {/* Features List */}
        <div className="features-modal__list" role="menu">
          {filteredFeatures.length > 0 ? (
            filteredFeatures.map(feature => (
              <button
                key={feature.id}
                className="feature-item"
                role="menuitem"
                aria-label={`Add ${feature.label}`}
                onClick={() => handleSelectFeature(feature.id)}
              >
                <div className="feature-item__icon">
                  <i className={`bi ${feature.icon}`} />
                </div>
                <div className="feature-item__content">
                  <div className="feature-item__label">{feature.label}</div>
                  {feature.description && (
                    <div className="feature-item__description">{feature.description}</div>
                  )}
                </div>
                <div className="feature-item__arrow">
                  <i className="bi bi-chevron-right" />
                </div>
              </button>
            ))
          ) : (
            <div className="features-modal__empty">
              <i className="bi bi-search" />
              <span>No features found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturesModal;
