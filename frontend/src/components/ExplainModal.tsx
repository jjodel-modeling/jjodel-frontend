import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { registry } from '../services/ai';
import { preferredModelId, preferredProviderId } from './common/ProviderModelSelector';
import { JjodelEvents } from '../events/registry';
import './ExplainModal.scss';

export interface ExplainDetail {
    elementName: string;
    elementType: string;
    metamodelName: string;
    properties: Record<string, any>;
}

function buildPrompt(detail: ExplainDetail): string {
    return `You are explaining a metamodel element in Jjodel, a web-based metamodeling tool.

Element: ${detail.elementName}
Type: ${detail.elementType}
Metamodel: ${detail.metamodelName}
Properties: ${JSON.stringify(detail.properties, null, 2)}

Explain what this element represents in the context of this metamodel, its current properties, and how it relates to other elements.
Be concise (3-5 sentences). Use simple, clear language suitable for students learning Model-Driven Engineering.`;
}

async function* streamExplain(prompt: string, signal: AbortSignal) {
    // Resolve per-feature provider for 'explain'. Falls back to the first enabled provider.
    const provider = registry.get(preferredProviderId('explain'));

    if (!provider.enabled()) {
        throw new Error('No AI provider configured. Please add an API key in Settings.');
    }

    // Every provider streams; the per-feature model when set, otherwise the provider's own.
    yield* provider.chatStream({
        history: [{ role: 'user', content: prompt }],
        model: preferredModelId('explain'),
        maxOutputTokens: 1024,
        signal,
    });
}

const ExplainModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [detail, setDetail] = useState<ExplainDetail | null>(null);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => {
        abortRef.current?.abort();
        setIsOpen(false);
        setText('');
        setError(null);
        setLoading(false);
    }, []);

    // Listen for explain-open events
    useEffect(() => {
        const handler = (e: Event) => {
            const d = (e as CustomEvent<ExplainDetail>).detail;
            setDetail(d);
            setIsOpen(true);
        };
        window.addEventListener(JjodelEvents.EXPLAIN_OPEN, handler);
        return () => window.removeEventListener(JjodelEvents.EXPLAIN_OPEN, handler);
    }, []);

    // Stream response when opened
    useEffect(() => {
        if (!isOpen || !detail) return;

        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        setText('');
        setError(null);

        (async () => {
            try {
                const prompt = buildPrompt(detail);
                for await (const chunk of streamExplain(prompt, controller.signal)) {
                    if (controller.signal.aborted) break;
                    setText(prev => prev + chunk);
                    setLoading(false);
                    // Auto-scroll
                    if (bodyRef.current) {
                        bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
                    }
                }
            } catch (err: any) {
                // A closed modal aborts the request; the SDKs name that error differently.
                if (!controller.signal.aborted) {
                    setError(err.message ?? 'Unknown error');
                }
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [isOpen, detail]);

    // Escape to close
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [isOpen, close]);

    if (!isOpen || !detail) return null;

    const typeBadge = detail.elementType.replace(/^D/, '');

    return (
        <div className="explain-modal-overlay" onClick={close}>
            <div className="explain-modal" onClick={e => e.stopPropagation()}>
                <div className="explain-modal-header">
                    <div className="explain-modal-title">
                        <i className="bi bi-stars" />
                        <span>Explaining: <strong>{detail.elementName}</strong></span>
                        <span className="explain-modal-badge">{typeBadge}</span>
                    </div>
                    <button className="explain-modal-close" onClick={close} title="Close (Esc)">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>
                <div className="explain-modal-body" ref={bodyRef}>
                    {loading && !text && (
                        <div className="explain-modal-loading">
                            <i className="bi bi-stars explain-spin" />
                            <span>Thinking...</span>
                        </div>
                    )}
                    {text && <div className="explain-modal-text"><ReactMarkdown>{text}</ReactMarkdown></div>}
                    {error && (
                        <div className="explain-modal-error">
                            <i className="bi bi-exclamation-triangle" /> {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExplainModal;
