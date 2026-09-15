/**
 * Jjodie Greeting Component
 * Compact, visually appealing greeting with capabilities list
 */

import React from 'react';
import './JjodieGreeting.css';

interface Capability {
    icon: string;
    title: string;
    desc: string;
}

const CAPABILITIES: Capability[] = [
    {
        icon: 'bi-box-seam',
        title: 'Create metaclasses',
        desc: 'New metaclasses with specific attributes',
    },
    {
        icon: 'bi-trash3',
        title: 'Delete metaclasses',
        desc: 'Remove existing metaclasses',
    },
    {
        icon: 'bi-pencil',
        title: 'Edit attributes',
        desc: 'Add, remove or edit attributes',
    },
    {
        icon: 'bi-link-45deg',
        title: 'Create references',
        desc: 'Compositions, associations and aggregations',
    },
    {
        icon: 'bi-diagram-2',
        title: 'Manage inheritance',
        desc: 'Inheritance relations between metaclasses',
    },
];

interface JjodieGreetingProps {
    className?: string;
}

export const JjodieGreeting: React.FC<JjodieGreetingProps> = ({ className = '' }) => {
    return (
        <div className={`jjodie-greeting ${className}`}>
            <p className="greeting-intro">
                Hi! I'm <strong>Jjodie</strong>, your metamodeling assistant.
                I can help you create and edit metamodels in Jjodel.
            </p>

            <div className="capabilities-list">
                {CAPABILITIES.map((cap, idx) => (
                    <div key={idx} className="capability-item">
                        <span className="capability-icon">
                            <i className={`bi ${cap.icon}`}></i>
                        </span>
                        <div className="capability-content">
                            <span className="capability-title">{cap.title}</span>
                            <span className="capability-separator">—</span>
                            <span className="capability-desc">{cap.desc}</span>
                        </div>
                    </div>
                ))}
            </div>

            <p className="greeting-cta">
                Tell me what you want to create, or type <code>/help</code> to see the available commands!
            </p>
        </div>
    );
};

export default JjodieGreeting;
