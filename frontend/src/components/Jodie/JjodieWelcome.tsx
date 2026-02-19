/**
 * Jjodie Welcome Component
 * Clean, centered welcome screen for the AI assistant
 */

import React from 'react';
import './JjodieWelcome.css';

export const JjodieWelcome: React.FC = () => {
    return (
        <div className="jjodie-welcome">
            {/* Icon */}
            <div className="welcome-icon">
                <i className="bi bi-chat-heart"></i>
            </div>

            {/* Title */}
            <h1 className="welcome-title">Ciao, sono Jjodie!</h1>

            {/* Subtitle */}
            <p className="welcome-subtitle">
                Il tuo assistente per la metamodellazione. Posso aiutarti con:
            </p>

            {/* Capabilities */}
            <div className="welcome-capabilities">
                <div className="capability-item">
                    <i className="bi bi-diagram-3"></i>
                    <span>Design di metamodelli</span>
                </div>

                <div className="capability-item">
                    <i className="bi bi-check-circle"></i>
                    <span>Validazione e vincoli</span>
                </div>

                <div className="capability-item">
                    <i className="bi bi-lightbulb"></i>
                    <span>Best practices</span>
                </div>

                <div className="capability-item">
                    <i className="bi bi-code-slash"></i>
                    <span>Generazione codice</span>
                </div>
            </div>

            {/* CTA */}
            <p className="welcome-cta">
                Dimmi cosa vuoi creare o digita <code>/help</code> per i comandi!
            </p>
        </div>
    );
};

export default JjodieWelcome;
