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
        title: 'Creare Metaclassi',
        desc: 'Nuove metaclassi con attributi specifici',
    },
    {
        icon: 'bi-trash3',
        title: 'Eliminare Metaclassi',
        desc: 'Rimuovere metaclassi esistenti',
    },
    {
        icon: 'bi-pencil',
        title: 'Modificare Attributi',
        desc: 'Aggiungere, rimuovere o modificare attributi',
    },
    {
        icon: 'bi-link-45deg',
        title: 'Creare Riferimenti',
        desc: 'Composizioni, associazioni e aggregazioni',
    },
    {
        icon: 'bi-diagram-2',
        title: 'Gestire Ereditarietà',
        desc: 'Relazioni di ereditarietà tra metaclassi',
    },
];

interface JjodieGreetingProps {
    className?: string;
}

export const JjodieGreeting: React.FC<JjodieGreetingProps> = ({ className = '' }) => {
    return (
        <div className={`jjodie-greeting ${className}`}>
            <p className="greeting-intro">
                Ciao! Sono <strong>Jjodie</strong>, il tuo assistente per la metamodellazione.
                Posso aiutarti a creare e modificare metamodelli in Jjodel.
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
                Dimmi cosa vuoi creare o digita <code>/help</code> per vedere i comandi disponibili!
            </p>
        </div>
    );
};

export default JjodieGreeting;
