import React from 'react';
import './EmptyState.scss';

export interface EmptyStateHint {
    icon: string;
    text: string;
}

export interface EmptyStateAction {
    label: string;
    onClick: () => void;
}

export interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: EmptyStateAction;
    hints?: EmptyStateHint[];
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    hints,
    className,
}) => {
    return (
        <div className={`jj-empty-state${className ? ' ' + className : ''}`}>
            <div className="jj-empty-state__icon-circle">
                <i className={`bi ${icon}`} />
            </div>
            <div className="jj-empty-state__title">{title}</div>
            <div className="jj-empty-state__description">{description}</div>
            {action && (
                <div className="jj-empty-state__action">
                    <button
                        className="jj-empty-state__action-btn"
                        onClick={action.onClick}
                    >
                        {action.label}
                    </button>
                </div>
            )}
            {hints && hints.length > 0 && (
                <div className="jj-empty-state__hints">
                    {hints.map((hint, i) => (
                        <div className="jj-empty-state__hint" key={i}>
                            <i className={`bi ${hint.icon}`} />
                            <span>{hint.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
