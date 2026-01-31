import React, { useState } from 'react';
import { U } from '../../joiner';
import './error-modal.scss';

interface TechnicalDetails {
  error: string;
  stackTrace?: string;
  lineNumber?: number;
  columnNumber?: number;
  viewName?: string;
  viewpointName?: string;
}

interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  technicalDetails?: TechnicalDetails;
  onClose: () => void;
  onRetry?: () => void;
  onReportBug?: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  title = 'Oops! Something Went Wrong',
  message = "We encountered an error while loading. Don't worry, your work is safe.",
  technicalDetails,
  onClose,
  onRetry,
  onReportBug
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyErrorToClipboard = async () => {
    if (technicalDetails) {
      const errorText = [
        `Error: ${technicalDetails.error}`,
        technicalDetails.viewName && `View: ${technicalDetails.viewName}`,
        technicalDetails.viewpointName && `Viewpoint: ${technicalDetails.viewpointName}`,
        technicalDetails.lineNumber && `Location: Line ${technicalDetails.lineNumber}, Column ${technicalDetails.columnNumber}`,
        technicalDetails.stackTrace && `\nStack Trace:\n${technicalDetails.stackTrace}`
      ].filter(Boolean).join('\n');

      try {
        await navigator.clipboard.writeText(errorText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="error-modal-backdrop" onClick={handleBackdropClick}>
      <div className="error-modal" role="dialog" aria-modal="true" aria-labelledby="error-title">
        <div className="error-modal__content">

          {/* Close Button */}
          <button className="error-modal__close" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>

          {/* Warning Icon */}
          <div className="error-modal__icon">
            <i className="bi bi-exclamation-triangle" />
          </div>

          {/* Title */}
          <h2 id="error-title" className="error-modal__title">{title}</h2>

          {/* User-Friendly Message */}
          <p className="error-modal__message">{message}</p>

          {/* Primary Actions */}
          <div className="error-modal__actions">
            {onRetry && (
              <button className="btn btn--primary" onClick={onRetry}>
                <i className="bi bi-arrow-clockwise" />
                Try Again
              </button>
            )}

            <button className="btn btn--secondary" onClick={onClose}>
              {onRetry ? 'Back to Projects' : 'Close'}
            </button>
          </div>

          {/* Technical Details (Collapsible) */}
          {technicalDetails && (
            <div className="error-modal__details">
              <button
                className="error-modal__details-toggle"
                onClick={() => setShowDetails(!showDetails)}
                aria-expanded={showDetails}
              >
                <i className={`bi bi-chevron-${showDetails ? 'up' : 'down'}`} />
                <span>Technical Details</span>
              </button>

              {showDetails && (
                <div className="error-modal__details-content">
                  {/* Error Message */}
                  <div className="error-modal__details-error">
                    <strong>Error:</strong> {technicalDetails.error}
                  </div>

                  {/* View Info */}
                  {technicalDetails.viewName && (
                    <div className="error-modal__details-view">
                      <strong>View:</strong> {technicalDetails.viewName}
                      {technicalDetails.viewpointName && (
                        <span> in viewpoint "{technicalDetails.viewpointName}"</span>
                      )}
                    </div>
                  )}

                  {/* Stack Trace */}
                  {technicalDetails.stackTrace && (
                    <pre className="error-modal__details-stack">
                      <code>{technicalDetails.stackTrace}</code>
                    </pre>
                  )}

                  {/* Location */}
                  {technicalDetails.lineNumber && (
                    <div className="error-modal__details-location">
                      <i className="bi bi-geo-alt" />
                      Line {technicalDetails.lineNumber}, Column {technicalDetails.columnNumber}
                    </div>
                  )}

                  {/* Copy & Report Actions */}
                  <div className="error-modal__details-actions">
                    <button
                      className="btn-icon"
                      onClick={copyErrorToClipboard}
                      title="Copy error details"
                    >
                      <i className={`bi ${copied ? 'bi-check' : 'bi-clipboard'}`} />
                      {copied ? 'Copied!' : 'Copy Error'}
                    </button>

                    {onReportBug && (
                      <button
                        className="btn-icon"
                        onClick={onReportBug}
                        title="Report this bug"
                      >
                        <i className="bi bi-bug" />
                        Report Bug
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
