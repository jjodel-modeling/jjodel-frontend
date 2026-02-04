/**
 * Grammar Diagram Component
 * Displays JjTL grammar rules as interactive railroad diagrams
 */

import React, { useState, useEffect, useRef } from 'react';
import { GrammarRule, GRAMMAR_RULES, GrammarRuleInfo } from './types';
import { renderDiagram } from './diagramRenderer';
import './GrammarDiagram.scss';

interface GrammarDiagramProps {
    /** Initially selected rule */
    initialRule?: GrammarRule;
    /** Compact mode - single diagram only, no sidebar */
    compact?: boolean;
    /** Highlight specific rule (for error display) */
    highlightRule?: GrammarRule;
    /** Callback when rule is selected */
    onRuleSelect?: (rule: GrammarRule) => void;
    /** Show example code */
    showExamples?: boolean;
    /** Custom class name */
    className?: string;
}

const GrammarDiagram: React.FC<GrammarDiagramProps> = ({
    initialRule = 'transformation',
    compact = false,
    highlightRule,
    onRuleSelect,
    showExamples = true,
    className = '',
}) => {
    const [selectedRule, setSelectedRule] = useState<GrammarRule>(() => initialRule);
    const diagramRef = useRef<HTMLDivElement>(null);

    const currentRule = GRAMMAR_RULES.find(r => r.id === selectedRule);

    // Update selection when initialRule prop changes
    useEffect(() => {
        setSelectedRule(initialRule as GrammarRule);
    }, [initialRule]);

    // Render diagram when selection changes
    useEffect(() => {
        if (diagramRef.current && currentRule) {
            // Clear previous diagram
            diagramRef.current.innerHTML = '';
            // Render new diagram
            renderDiagram(currentRule.id, diagramRef.current);
        }
    }, [selectedRule, currentRule]);

    const handleRuleClick = (rule: GrammarRule) => {
        setSelectedRule(rule);
        onRuleSelect?.(rule);
    };

    // Compact mode - just the diagram
    if (compact) {
        return (
            <div className={`grammar-diagram grammar-diagram--compact ${className}`}>
                <div className="grammar-diagram__canvas" ref={diagramRef} />
            </div>
        );
    }

    return (
        <div className={`grammar-diagram ${className}`}>
            {/* Sidebar with rule list */}
            <div className="grammar-diagram__sidebar">
                <h3 className="grammar-diagram__sidebar-title">Grammar Rules</h3>
                <ul className="grammar-diagram__rule-list">
                    {GRAMMAR_RULES.map(rule => (
                        <li
                            key={rule.id}
                            className={`grammar-diagram__rule-item ${
                                selectedRule === rule.id ? 'active' : ''
                            } ${highlightRule === rule.id ? 'highlight' : ''}`}
                            onClick={() => handleRuleClick(rule.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleRuleClick(rule.id);
                                }
                            }}
                        >
                            <span className="grammar-diagram__rule-name">{rule.name}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main content */}
            <div className="grammar-diagram__main">
                {currentRule && (
                    <>
                        {/* Header */}
                        <div className="grammar-diagram__header">
                            <h2 className="grammar-diagram__title">{currentRule.name}</h2>
                            <p className="grammar-diagram__description">{currentRule.description}</p>
                        </div>

                        {/* EBNF notation */}
                        <div className="grammar-diagram__ebnf">
                            <div className="grammar-diagram__ebnf-label">EBNF</div>
                            <code>{currentRule.ebnf}</code>
                        </div>

                        {/* Railroad diagram */}
                        <div className="grammar-diagram__canvas-wrapper">
                            <div className="grammar-diagram__canvas-label">Railroad Diagram</div>
                            <div className="grammar-diagram__canvas" ref={diagramRef} />
                        </div>

                        {/* Example code */}
                        {showExamples && currentRule.example && (
                            <div className="grammar-diagram__example">
                                <div className="grammar-diagram__example-label">Example</div>
                                <pre><code>{currentRule.example}</code></pre>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default GrammarDiagram;
