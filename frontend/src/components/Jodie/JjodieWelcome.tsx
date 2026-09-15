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
            <h1 className="welcome-title">Hi, I'm Jjodie!</h1>

            {/* Subtitle */}
            <p className="welcome-subtitle">
                Your metamodeling assistant. I can help you with:
            </p>

            {/* Capabilities — same four entries, same icons and order, as the empty-state
                block of ChatMessages: one wording for one content (voce 6, D4). */}
            <div className="welcome-capabilities">
                <div className="capability-item">
                    <i className="bi bi-diagram-3"></i>
                    <span>Metamodel design patterns</span>
                </div>

                <div className="capability-item">
                    <i className="bi bi-check-circle"></i>
                    <span>Validation and constraints</span>
                </div>

                <div className="capability-item">
                    <i className="bi bi-lightbulb"></i>
                    <span>Best practices and trade-offs</span>
                </div>

                <div className="capability-item">
                    <i className="bi bi-code-slash"></i>
                    <span>Code generation guidance</span>
                </div>
            </div>

            {/* CTA — no twin in ChatMessages, translated on its own. */}
            <p className="welcome-cta">
                Tell me what you want to create, or type <code>/help</code> for the commands!
            </p>
        </div>
    );
};

export default JjodieWelcome;
