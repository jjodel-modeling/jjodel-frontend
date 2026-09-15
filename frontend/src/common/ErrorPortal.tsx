import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from '../components/Toast/toastDispatch';

// Module-level, per-defect throttle so a broken template across N nodes
// (and React re-renders / StrictMode double-invoke) yields a single toast.
const VIEW_ERROR_TOAST_WINDOW_MS = 5000;
const lastViewErrorToast = new Map<string, number>();

// Flatten a ReactNode error message to plain text for the toast + dedup key.
function reactNodeToText(node: React.ReactNode): string {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(reactNodeToText).join(' ');
    if (React.isValidElement(node)) return reactNodeToText((node.props as any)?.children);
    return '';
}

interface ErrorPortalProps {
    isOpen: boolean;
    onClose: () => void;
    viewName?: string;
    viewpointName?: string;
    errorType: string;
    errorContext: string; // e.g., "on ClassName / NodeName"
    message: React.ReactNode;
    dname?: string;
    nodename?: string;
    dataClassName?: string; // The className of the data object (e.g., "DAttribute")
}

export const ErrorPortal: React.FC<ErrorPortalProps> = ({
    isOpen,
    onClose,
    viewName,
    viewpointName,
    errorType,
    errorContext,
    message,
    dname,
    nodename,
    dataClassName
}) => {
    // Handle Escape key to close
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    // Handle backdrop click to close
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const errorContent = (
        <div className='error-notification-portal' onClick={handleBackdropClick}>
            <div className='error-notification' tabIndex={-1}>
                {/* Close button */}
                <button
                    className='error-notification-close'
                    onClick={onClose}
                    aria-label="Close"
                >
                    <i className="bi bi-x-lg" />
                </button>

                <h1>Something Went Wrong...</h1>
                {viewName && (
                    <h2>
                        Error in "{viewName}" syntax view definition
                        {viewpointName ? ' in viewpoint ' + viewpointName : ''}.
                    </h2>
                )}

                {/* Instance info */}
                {(dname || nodename || dataClassName) && (
                    <div className='error-instance-info'>
                        {dname && <span className='error-instance-name'><strong>Instance:</strong> {dname}</span>}
                        {dataClassName && <span className='error-class-name'><strong>Class:</strong> {dataClassName}</span>}
                        {nodename && <span className='error-node-name'><strong>Node:</strong> {nodename}</span>}
                    </div>
                )}

                <div className='error-type'>
                    <b data-dname={dname} data-nodename={nodename} data-str={false}>
                        {errorType} Error {errorContext}
                    </b>
                </div>
                <div className='error-details'>{message}</div>

                {/* Action buttons */}
                <div className='error-notification-actions'>
                    <button className='btn-dismiss' onClick={onClose}>
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(errorContent, document.body);
};

// ============================================
// ERROR DISPLAY - Wrapper component with state
// Manages both the badge and the portal modal
// ============================================
interface ErrorDisplayProps {
    viewName?: string;
    viewpointName?: string;
    errorType: string;
    errorContext: string;
    message: React.ReactNode;
    dname?: string;
    nodename?: string;
    onClick?: (e:any)=>void;
    dataClassName?: string; // The className of the data object (e.g., "DAttribute")
}

export const ErrorDisplay = React.forwardRef<HTMLDivElement, ErrorDisplayProps>(({
    viewName,
    viewpointName,
    errorType,
    errorContext,
    message,
    dname,
    nodename,
    onClick,
    dataClassName,
}, ref) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Only show error badge in the editor (project page)
    // Check both pathname (BrowserRouter) and hash (HashRouter) for compatibility
    const isInEditor = typeof window !== 'undefined' && (
        window.location.pathname.startsWith('/project') ||
        window.location.hash.includes('/project')
    );

    // Per-defect identity: VIEW + error type + error text. Deliberately excludes
    // the per-instance dname/nodename, so the same broken template across many
    // nodes collapses to a single toast.
    const errorText = reactNodeToText(message).replace(/\s+/g, ' ').trim();
    const dedupKey = `${viewName || 'Unknown'}|${errorType || ''}|${errorText}`;

    // Additive to the inline badge: emit one deduped, time-throttled, auto-
    // dismissing error toast (it also lands in the Bell history) per defect.
    useEffect(() => {
        if (!isInEditor) return;
        const now = Date.now();
        const last = lastViewErrorToast.get(dedupKey);
        if (last != null && now - last < VIEW_ERROR_TOAST_WINDOW_MS) return;
        lastViewErrorToast.set(dedupKey, now);
        if (lastViewErrorToast.size > 50) {
            for (const [k, ts] of lastViewErrorToast) {
                if (now - ts >= VIEW_ERROR_TOAST_WINDOW_MS) lastViewErrorToast.delete(k);
            }
        }

        const instance = [dname, nodename].filter(Boolean).join(': ');
        const detail = errorText || `${errorType || 'View'} error`;
        const messageStr = instance ? `on ${instance} — ${detail}` : detail;

        toast.error(messageStr.slice(0, 160), {
            title: `Error in View: ${viewName || 'Unknown'}`,
            duration: 7000,   // auto-dismiss; overrides the persistent error default
            dismiss: 'auto',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dedupKey, isInEditor]);

    // Don't render anything if not in editor
    if (!isInEditor) {
        return null;
    }

    const handleBadgeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsModalOpen(true);
        onClick?.(e);
    };

    const handleClose = () => {
        setIsModalOpen(false);
    };

    // Format instance info: "instanceName: ClassName"
    const instanceInfo = dname && nodename
        ? `${dname}: ${nodename}`
        : dname || nodename || '';

    return (
        <>
            {/* Slick error badge on canvas */}
            <div
                ref={ref}
                className='error-badge-slick'
                tabIndex={0}
                onClick={handleBadgeClick}
                title={`${errorType} error - Click for details`}
            >
                <div className="error-badge-icon">
                    <i className="bi bi-exclamation-triangle-fill" />
                </div>
                <div className="error-badge-content">
                    <span className="error-badge-title">
                        Error in View: <span className="error-badge-name">{viewName || 'Unknown'}</span>
                    </span>
                    {instanceInfo && (
                        <span className="error-badge-instance">
                            on {instanceInfo}
                        </span>
                    )}
                </div>
                <i className="bi bi-chevron-right error-badge-hint" aria-hidden="true" />
            </div>

            {/* Modal portal */}
            <ErrorPortal
                isOpen={isModalOpen}
                onClose={handleClose}
                viewName={viewName}
                viewpointName={viewpointName}
                errorType={errorType}
                errorContext={errorContext}
                message={message}
                dname={dname}
                nodename={nodename}
                dataClassName={dataClassName}
            />
        </>
    );
});

ErrorDisplay.displayName = 'ErrorDisplay';

export default ErrorPortal;
