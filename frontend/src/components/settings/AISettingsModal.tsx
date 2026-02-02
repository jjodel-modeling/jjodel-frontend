import React, { useEffect } from 'react';
import { AISettingsContent } from './AISettingsContent';
import './AISettingsModal.scss';

interface AISettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
    // Close with ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="ai-settings-modal-overlay" onClick={onClose}>
            <div
                className="ai-settings-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>
                        <i className="bi bi-gear" />
                        AI Provider Settings
                    </h2>
                    <button className="close-btn" onClick={onClose}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="modal-body">
                    <AISettingsContent onClose={onClose} showHeader={false} />
                </div>
            </div>
        </div>
    );
}

export default AISettingsModal;
