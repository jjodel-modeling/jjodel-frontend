import React from 'react';
import './browser-warning-modal.scss';

interface BrowserWarningModalProps {
    isOpen: boolean;
    browserName: string;
    onClose: () => void;
}

/**
 * BrowserWarningModal - Warning for non-Chromium browsers
 * Shows an informative message suggesting the use of Chrome
 */
export const BrowserWarningModal: React.FC<BrowserWarningModalProps> = ({
    isOpen,
    browserName,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className="browser-warning-overlay" onClick={onClose}>
            <div className="browser-warning-modal" onClick={(e) => e.stopPropagation()}>
                {/* Icon */}
                <div className="browser-warning-modal__icon">
                    <i className="bi bi-exclamation-triangle" />
                </div>

                {/* Title */}
                <h2 className="browser-warning-modal__title">
                    Browser Not Optimized
                </h2>

                {/* Message */}
                <div className="browser-warning-modal__content">
                    <p className="browser-warning-modal__message">
                        You're currently using <strong>{browserName}</strong>.
                        Jjodel is optimized for <strong>Chrome</strong> and other Chromium-based browsers
                        for the best experience.
                    </p>
                    <p className="browser-warning-modal__suggestion">
                        We recommend using:
                    </p>
                    <ul className="browser-warning-modal__list">
                        <li>
                            <i className="bi bi-check-circle" />
                            <strong>Google Chrome</strong> (Recommended)
                        </li>
                        <li>
                            <i className="bi bi-check-circle" />
                            <strong>Microsoft Edge</strong>
                        </li>
                        <li>
                            <i className="bi bi-check-circle" />
                            <strong>Brave, Opera, or Vivaldi</strong>
                        </li>
                    </ul>
                    <p className="browser-warning-modal__note">
                        You can continue using {browserName}, but some features may not work as expected.
                    </p>
                </div>

                {/* Actions */}
                <div className="browser-warning-modal__actions">
                    <button
                        className="browser-warning-modal__btn browser-warning-modal__btn--primary"
                        onClick={onClose}
                    >
                        Continue with {browserName}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BrowserWarningModal;
