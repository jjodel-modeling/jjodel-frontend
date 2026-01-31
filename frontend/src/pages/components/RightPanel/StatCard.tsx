import React from 'react';

type StatCardProps = {
    icon: string;
    label: string;
    value: number | string;
    accent?: 'default' | 'success' | 'warning' | 'error' | 'info';
    onClick?: () => void;
};

export const StatCard = (props: StatCardProps) => {
    const isTextValue = typeof props.value === 'string' && isNaN(Number(props.value));

    return (
        <div
            className={`stat-card ${props.accent || 'default'}`}
            onClick={props.onClick}
            role={props.onClick ? 'button' : undefined}
            tabIndex={props.onClick ? 0 : undefined}
            onKeyDown={props.onClick ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    props.onClick?.();
                }
            } : undefined}
        >
            <div className="stat-icon">
                <i className={`bi ${props.icon}`} />
            </div>
            <div className="stat-content">
                <span className={`stat-value ${isTextValue ? 'text-value' : ''}`}>
                    {props.value}
                </span>
                <span className="stat-label">{props.label}</span>
            </div>
        </div>
    );
};
