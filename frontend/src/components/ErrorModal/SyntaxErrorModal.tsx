import React, { useState, useEffect, useCallback } from 'react';
import { U } from '../../joiner';
import './syntax-error-modal.scss';

export interface SyntaxErrorModalProps {
  isOpen: boolean;
  errorTitle: string;              // e.g., "Class"
  errorContext?: string;           // e.g., "in viewpoint Default"
  technicalMessage: string;        // e.g., "USAGE DECLARATION SEMANTIC ERROR..."
  codeSnippet?: string;            // The code that causes the error
  stackTrace?: string;             // Full stack trace (optional)
  errorType?: 'syntax' | 'semantic' | 'runtime' | 'usage';
  onClose: () => void;
  onRetry?: () => void;
}

export const SyntaxErrorModal: React.FC<SyntaxErrorModalProps> = ({
  isOpen,
  errorTitle,
  errorContext,
  technicalMessage,
  codeSnippet,
  stackTrace,
  errorType = 'syntax',
  onClose,
  onRetry
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

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

  const copyToClipboard = async (text: string, type: 'code' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      }
      U.alert('i', 'Copied', 'Error details copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      U.alert('e', 'Error', 'Failed to copy to clipboard');
    }
  };

  const copyAllErrorDetails = () => {
    const allDetails = [
      `Error: ${errorTitle}${errorContext ? ' ' + errorContext : ''}`,
      `Type: ${errorType.toUpperCase()}`,
      '',
      'Technical Message:',
      technicalMessage,
      '',
      codeSnippet ? `Code:\n${codeSnippet}` : '',
      stackTrace ? `\nStack Trace:\n${stackTrace}` : ''
    ].filter(Boolean).join('\n').trim();

    copyToClipboard(allDetails, 'all');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getErrorTypeLabel = () => {
    switch (errorType) {
      case 'syntax': return 'Syntax Error';
      case 'semantic': return 'Semantic Error';
      case 'runtime': return 'Runtime Error';
      case 'usage': return 'Usage Declaration Error';
      default: return 'Error';
    }
  };

  const getUserFriendlyMessage = () => {
    switch (errorType) {
      case 'syntax':
        return "There's a syntax error in your view definition. Please check the code below and fix the issue.";
      case 'semantic':
        return "There's a semantic error in your view. The code structure is correct but the meaning is invalid.";
      case 'runtime':
        return "An error occurred while executing the view code. Please check your logic.";
      case 'usage':
        return "There's an issue with the usage declaration. Please verify the dependencies and references.";
      default:
        return "An error occurred in your view definition. Please check the details below.";
    }
  };

  return (
    <div className="syntax-error-modal">
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={handleBackdropClick} />

      {/* Modal Container */}
      <div
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="syntax-error-title"
      >
        {/* Close Button */}
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <i className="bi bi-x-lg" />
        </button>

        {/* Warning Icon */}
        <div className="modal-icon modal-icon--warning">
          <i className="bi bi-exclamation-triangle" />
        </div>

        {/* Title */}
        <h2 id="syntax-error-title" className="modal-title">
          {getErrorTypeLabel()}
        </h2>

        {/* User-friendly description */}
        <div className="modal-description">
          <p className="error-context">
            Error in <strong>"{errorTitle}"</strong>
            {errorContext && <span> {errorContext}</span>}
          </p>
          <p className="error-help">
            {getUserFriendlyMessage()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry}>
              <i className="bi bi-arrow-clockwise" />
              Try Again
            </button>
          )}
        </div>

        {/* Collapsible Technical Details */}
        <div className="technical-details">
          <button
            className="technical-details__toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`} />
            <span>Technical Details</span>
          </button>

          {isExpanded && (
            <div className="technical-details__content">
              {/* Error Message */}
              <div className="error-message">
                <div className="error-message__label">Error Message</div>
                <div className="error-message__text">{technicalMessage}</div>
              </div>

              {/* Code Snippet */}
              {codeSnippet && (
                <div className="code-box">
                  <div className="code-box__header">
                    <span className="code-box__label">Code</span>
                    <button
                      className={`code-box__copy ${copiedCode ? 'code-box__copy--copied' : ''}`}
                      onClick={() => copyToClipboard(codeSnippet, 'code')}
                    >
                      <i className={`bi ${copiedCode ? 'bi-check' : 'bi-clipboard'}`} />
                      <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="code-box__content">
                    <code>{codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* Stack Trace */}
              {stackTrace && (
                <div className="stack-trace">
                  <div className="stack-trace__label">Stack Trace</div>
                  <pre className="stack-trace__content">{stackTrace}</pre>
                </div>
              )}

              {/* Copy All Button */}
              <div className="technical-details__actions">
                <button
                  className="btn btn-ghost btn-small"
                  onClick={copyAllErrorDetails}
                >
                  <i className={`bi ${copiedAll ? 'bi-check' : 'bi-clipboard'}`} />
                  {copiedAll ? 'Copied!' : 'Copy All Details'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyntaxErrorModal;
