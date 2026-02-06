/**
 * GrammarTab - Compact accordion view of JjTL grammar rules
 * Used inside SuggestedMappingsPanel as a third tab
 */

import React, { useState, useEffect, useRef } from 'react';
import { GrammarRule, GRAMMAR_RULES } from '../components/GrammarDiagram/types';
import { renderDiagram } from '../components/GrammarDiagram/diagramRenderer';
import GrammarDiagramModal from '../components/GrammarDiagram/GrammarDiagramModal';
import './GrammarTab.scss';

interface GrammarTabProps {
    /** Compact mode for smaller panel */
    compact?: boolean;
    /** Highlighted rule (from editor cursor position) */
    highlightedRule?: GrammarRule | null;
}

const GrammarTab: React.FC<GrammarTabProps> = ({ compact = false, highlightedRule }) => {
    const [expandedRule, setExpandedRule] = useState<GrammarRule | null>('transformation');
    const [searchQuery, setSearchQuery] = useState('');
    const [modalRule, setModalRule] = useState<GrammarRule | null>(null);
    const diagramRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const ruleRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Auto-expand and scroll to highlighted rule when it changes
    useEffect(() => {
        if (highlightedRule) {
            setExpandedRule(highlightedRule);

            // Scroll the rule card into view
            const ruleElement = ruleRefs.current.get(highlightedRule);
            if (ruleElement) {
                ruleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightedRule]);

    // Filter rules by search
    const filteredRules = GRAMMAR_RULES.filter(rule =>
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.ebnf.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Render railroad diagram when rule is expanded
    useEffect(() => {
        if (expandedRule) {
            const container = diagramRefs.current.get(expandedRule);
            if (container) {
                container.innerHTML = '';
                renderDiagram(expandedRule, container);
            }
        }
    }, [expandedRule]);

    const toggleRule = (ruleId: GrammarRule) => {
        setExpandedRule(prev => prev === ruleId ? null : ruleId);
    };

    const openModal = (ruleId: GrammarRule, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent accordion toggle
        setModalRule(ruleId);
    };

    const closeModal = () => {
        setModalRule(null);
    };

    return (
        <div className={`grammar-tab ${compact ? 'grammar-tab--compact' : ''}`}>
            {/* Search */}
            <div className="grammar-tab__search">
                <i className="bi bi-search" />
                <input
                    type="text"
                    placeholder="Search grammar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        className="grammar-tab__search-clear"
                        onClick={() => setSearchQuery('')}
                    >
                        <i className="bi bi-x" />
                    </button>
                )}
            </div>

            {/* Rules List */}
            <div className="grammar-tab__rules">
                {filteredRules.map(rule => (
                    <div
                        key={rule.id}
                        ref={(el) => {
                            if (el) ruleRefs.current.set(rule.id, el);
                        }}
                        className={`grammar-rule ${expandedRule === rule.id ? 'grammar-rule--expanded' : ''} ${highlightedRule === rule.id ? 'grammar-rule--highlighted' : ''}`}
                    >
                        {/* Rule Header */}
                        <button
                            className="grammar-rule__header"
                            onClick={() => toggleRule(rule.id)}
                        >
                            <div className="grammar-rule__title">
                                <span className="grammar-rule__name">{rule.name}</span>
                                <span className="grammar-rule__desc">{rule.description}</span>
                            </div>
                            <div className="grammar-rule__actions">
                                {/* Expand button */}
                                <button
                                    className="grammar-rule__expand-btn"
                                    onClick={(e) => openModal(rule.id, e)}
                                    title="Open enlarged view"
                                >
                                    <i className="bi bi-arrows-fullscreen" />
                                </button>
                                <i className={`bi ${expandedRule === rule.id ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                            </div>
                        </button>

                        {/* Rule Content (expanded) */}
                        {expandedRule === rule.id && (
                            <div className="grammar-rule__content">
                                {/* Railroad Diagram */}
                                <div
                                    className="grammar-rule__diagram"
                                    ref={(el) => {
                                        if (el) diagramRefs.current.set(rule.id, el);
                                    }}
                                />

                                {/* EBNF */}
                                <div className="grammar-rule__ebnf">
                                    <code>{rule.ebnf}</code>
                                </div>

                                {/* Example */}
                                {rule.example && (
                                    <div className="grammar-rule__example">
                                        <span className="grammar-rule__example-label">Example:</span>
                                        <pre>{rule.example}</pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Empty state */}
                {filteredRules.length === 0 && (
                    <div className="grammar-tab__empty">
                        <i className="bi bi-search" />
                        <p>No rules match "{searchQuery}"</p>
                    </div>
                )}
            </div>

            {/* Footer with link to full docs */}
            <div className="grammar-tab__footer">
                <a
                    href="https://github.com/jjodel/jjodel/wiki/JjTL-Grammar"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <i className="bi bi-book" />
                    Full Documentation
                </a>
            </div>

            {/* Modal for enlarged diagram */}
            {modalRule && (
                <GrammarDiagramModal
                    rule={modalRule}
                    isOpen={!!modalRule}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export default GrammarTab;
