import React from 'react';

type QuickActionButtonProps = {
    icon: string;
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
};

export const QuickActionButton = (props: QuickActionButtonProps) => {
    return (
        <button
            className={`quick-action-btn ${props.variant || 'secondary'}`}
            onClick={props.action}
            disabled={props.disabled}
        >
            <i className={`bi ${props.icon}`} />
            <span>{props.label}</span>
        </button>
    );
};
