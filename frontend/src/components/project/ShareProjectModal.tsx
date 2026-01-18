import React, { useState, useEffect } from 'react';
import { LProject } from '../../joiner';
import { getPublicProjectUrl, copyToClipboard } from '../../utils/shareUtils';
import './share-modal.scss';

interface ShareProjectModalProps {
    project: LProject;
    isOpen: boolean;
    onClose: () => void;
}

const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
    project,
    isOpen,
    onClose,
}) => {
    const [copied, setCopied] = useState(false);

    // Reset copied state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCopied(false);
        }
    }, [isOpen]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    if (project.type !== 'public') return null;

    // Use project ID directly for the share URL
    const shareUrl = getPublicProjectUrl(project.id);

    const handleCopy = async () => {
        const success = await copyToClipboard(shareUrl);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="share-modal-overlay" onClick={handleOverlayClick}>
            <div className="share-modal">
                {/* Header */}
                <div className="share-modal__header">
                    <h2>Share Project</h2>
                    <button
                        className="share-modal__close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Body */}
                <div className="share-modal__body">
                    <p className="share-modal__description">
                        Anyone with this link can view this project
                    </p>

                    {/* URL Input + Copy Button */}
                    <div className="share-url-container">
                        <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="share-url-input"
                            onClick={(e) => e.currentTarget.select()}
                        />

                        <button
                            className={`copy-button ${copied ? 'copy-button--copied' : ''}`}
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <>
                                    <i className="bi bi-check2" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-clipboard" />
                                    Copy Link
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className="share-info-box">
                        <i className="bi bi-info-circle share-info-icon" />
                        <div className="share-info-text">
                            <strong>This link is active while the project is public.</strong>
                            <p>If you make this project private, the link will stop working.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="share-modal__footer">
                    <button className="done-button" onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareProjectModal;
