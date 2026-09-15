import React from 'react';
import './Badge.scss';

type BadgeCategory = 'type' | 'state' | 'state-danger' | 'version' | 'context';

interface BadgeProps {
    category: BadgeCategory;
    children: React.ReactNode;
    className?: string;
    title?: string;
}

const Badge: React.FC<BadgeProps> = ({ category, children, className = '', ...otherProps}) => {
    return (
        <span className={`jj-badge jj-badge--${category} ${className}`.trim()} {...otherProps}>
            {children}
        </span>
    );
};

export { Badge };
export type { BadgeCategory, BadgeProps };
export default Badge;
