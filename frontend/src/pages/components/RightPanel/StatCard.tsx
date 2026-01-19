import React from 'react';

type StatCardProps = {
    icon: string;
    label: string;
    value: number | string;
    accent?: 'default' | 'success' | 'warning' | 'error' | 'info';
};

export const StatCard = (props: StatCardProps) => {
    return (
        <div className={`stat-card ${props.accent || 'default'}`}>
            <i className={`bi ${props.icon}`} />
            <div className="stat-content">
                <span className="stat-value">{props.value}</span>
                <span className="stat-label">{props.label}</span>
            </div>
        </div>
    );
};
