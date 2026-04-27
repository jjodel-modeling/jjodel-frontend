import React from 'react';
import './coming-soon-placeholder.scss';

interface ComingSoonPlaceholderProps {
    icon: string;
    title: string;
    description: string;
}

export const ComingSoonPlaceholder: React.FC<ComingSoonPlaceholderProps> = ({
    icon,
    title,
    description,
}) => {
    return (
        <div className="coming-soon">
            <div className="coming-soon__icon">
                <i className={`bi ${icon}`} aria-hidden="true" />
            </div>
            <h2 className="coming-soon__title">{title}</h2>
            <p className="coming-soon__sub">{description}</p>
            <span className="coming-soon__badge">Coming soon</span>
        </div>
    );
};

export default ComingSoonPlaceholder;
