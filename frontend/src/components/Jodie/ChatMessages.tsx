/**
 * Chat Messages Component
 * Displays the conversation history with the AI
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {AI, ChatMessage, ConsoleEntry, CodeEntry, isCodeEntry} from '../../types/jodie';
import { MarkdownMessage } from './MarkdownMessage';
import { JjelValueInspector, detectKind } from './JjelValueInspector';
import { executeCommand, ScriptLineResult } from '../../jjscript';
import { DUser, L, LUser, LProject, LModel, store } from '../../joiner';
import { Selectors } from '../../redux/selectors/selectors';
import { ProviderIcon } from '../icons';
import { useAvatar } from '../../hooks/useAvatar';
import { AVATAR_COLORS, AVATAR_ICONS } from '../../constants/avatarConfig';

interface ChatMessagesProps {
    messages: ConsoleEntry[];
    isWaiting?: boolean;
    /** Optional callback when JjScript execution completes (for refresh/update) */
    onJjScriptExecuted?: () => void;
    /** Promotion: switch to Code mode and prefill the input with an extracted snippet. */
    onTestInCode?: (code: string, language: string | null) => void;
    /** Promotion: switch to Chat mode and prefill the input with a template describing a failed code entry. */
    onAskJjodie?: (entry: CodeEntry) => void;
}

type ExtractedCodeBlock = { language: string | null; content: string };

// Extracts the first markdown fenced code block (```lang? ... ```) from text.
// Powers the "Test in code mode" promotion shown under assistant messages.
// Captures group 1 (language tag) is optional and may be undefined.
function extractFirstCodeBlock(text: string): ExtractedCodeBlock | null {
    const match = text.match(/```(\w+)?\n([\s\S]*?)```/);
    if (!match) return null;
    return {
        language: match[1] ?? null,
        content: match[2].trim(),
    };
}

function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || 'U';
}

function MessageBubble({ message, onJjScriptExecute, onTestInCode }: { message: ChatMessage; onJjScriptExecute?: (commands: string[]) => Promise<ScriptLineResult[]>; onTestInCode?: (code: string, language: string | null) => void }): JSX.Element {
    const isUser = message.role === 'user';
    const providerInfo = message.provider ? AI[message.provider] : null;
    const displayName = message.userName || 'You';
    const isJjScript = !!message.jjscriptResult;
    const jjScriptSuccess = message.jjscriptResult?.success ?? true;
    const [avatarConfig] = useAvatar();
    const avatarColor = AVATAR_COLORS[avatarConfig.colorIndex];
    const avatarIcon = AVATAR_ICONS[avatarConfig.iconIndex];

    // Promotion is shown only on real assistant replies (not user messages, not
    // JjScript success/error feedback) and only when the reply contains a fenced code block.
    const promoteCodeBlock = !isUser && !isJjScript ? extractFirstCodeBlock(message.content) : null;

    return (
        <div className={`jodie-message ${isUser ? 'jodie-message-user' : 'jodie-message-assistant'}`}>
            {/* User avatar with initials or icon */}
            {isUser && (
                <div className="jodie-message-avatar jodie-user-avatar"
                     style={{ background: avatarColor.hex }}>
                    {avatarIcon
                        ? <i className={`bi ${avatarIcon}`} style={{ fontSize: 11 }} />
                        : <span>{getInitials(displayName)}</span>
                    }
                </div>
            )}
            {/* JjScript avatar */}
            {!isUser && isJjScript && (
                <div className={`jodie-message-avatar jodie-jjscript-avatar ${jjScriptSuccess ? 'jodie-jjscript-success' : 'jodie-jjscript-error'}`}>
                    <i className={`bi ${jjScriptSuccess ? 'bi-check-lg' : 'bi-x-lg'}`} />
                </div>
            )}
            {/* Assistant avatar with provider icon */}
            {!isUser && !isJjScript && providerInfo && (
                <div
                    className="jodie-message-avatar"
                    style={{ backgroundColor: providerInfo.bgColor, color: providerInfo.color }}
                >
                    <ProviderIcon provider={message.provider || ''} size={16} />
                </div>
            )}
            <div className="jodie-message-content">
                <div className={`jodie-message-bubble ${isJjScript ? `jodie-jjscript-bubble ${jjScriptSuccess ? 'jodie-jjscript-bubble-success' : 'jodie-jjscript-bubble-error'}` : ''}`}>
                    {/* Display attached images */}
                    {message.images && message.images.length > 0 && (
                        <div className="jodie-message-images">
                            {message.images.map(img => (
                                <img
                                    key={img.id}
                                    src={img.preview}
                                    alt={img.name || 'Attached image'}
                                    className="jodie-message-image"
                                />
                            ))}
                        </div>
                    )}
                    {/* Display attached documents */}
                    {message.documents && message.documents.length > 0 && (
                        <div className="jodie-message-documents">
                            {message.documents.map(doc => (
                                <div key={doc.id} className="jodie-message-document">
                                    <i className="bi bi-file-earmark-pdf" />
                                    <span className="jodie-document-name">{doc.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="jodie-message-text">
                        <MarkdownMessage
                            content={message.content}
                            isUser={isUser}
                            onJjScriptExecute={onJjScriptExecute}
                        />
                    </div>
                </div>
                {promoteCodeBlock && onTestInCode && (
                    <button
                        className="jodie-promote-btn"
                        onClick={() => onTestInCode(promoteCodeBlock.content, promoteCodeBlock.language)}
                        title="Switch to console mode and prefill this snippet"
                    >
                        <i className="bi bi-arrow-right-square" />
                        <span>Test in console mode</span>
                    </button>
                )}
                <div className="jodie-message-meta">
                    {isUser && (
                        <span className="jodie-message-author">{displayName}</span>
                    )}
                    <span className="jodie-message-time">{formatTimestamp(message.timestamp)}</span>
                    {!isUser && !isJjScript && providerInfo && (
                        <span
                            className="jodie-message-provider"
                            style={{ color: providerInfo.color }}
                        >
                            {providerInfo.name}
                        </span>
                    )}
                    {isJjScript && (
                        <span className={`jodie-message-provider ${jjScriptSuccess ? 'jodie-jjscript-label-success' : 'jodie-jjscript-label-error'}`}>
                            JjScript
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function CodeReplEntry({ entry, onAskJjodie }: { entry: CodeEntry; onAskJjodie?: (entry: CodeEntry) => void }): JSX.Element {
    const isError = !entry.output.ok;
    const outputText = entry.output.ok
        ? String(entry.output.value)
        : entry.output.error;
    const warnings = entry.warnings ?? [];
    const inspectorKind = !isError ? detectKind(entry.rawValue) : null;
    const [inspectorOpen, setInspectorOpen] = useState(false);
    return (
        <div className={`jodie-code-entry${isError ? ' jodie-code-entry--error' : ''}`}>
            <div className="jodie-code-entry__row jodie-code-entry__input-row">
                <span className="jodie-code-entry__prompt" aria-hidden="true">›</span>
                <code className="jodie-code-entry__input">{entry.input}</code>
                <span className="jodie-code-entry__flavor">{entry.flavor}</span>
            </div>
            <div className={`jodie-code-entry__row jodie-code-entry__output-row${isError ? ' jodie-code-entry__output-row--error' : ''}`}>
                <code className="jodie-code-entry__output">{outputText}</code>
                {inspectorKind && (
                    <button
                        type="button"
                        className="jodie-inspect-toggle"
                        onClick={() => setInspectorOpen(prev => !prev)}
                        title={inspectorOpen ? 'Collapse properties' : 'Inspect properties'}
                        aria-expanded={inspectorOpen}
                        aria-label={inspectorOpen ? 'Collapse object inspector' : 'Inspect object properties'}
                    >
                        <i className={`bi bi-chevron-${inspectorOpen ? 'down' : 'right'}`} aria-hidden="true" />
                    </button>
                )}
            </div>
            {inspectorKind && inspectorOpen && entry.rawValue && (
                <JjelValueInspector
                    value={entry.rawValue as Record<string, unknown>}
                    kind={inspectorKind}
                />
            )}
            {warnings.length > 0 && (
                <div className="jodie-code-entry__warnings">
                    {warnings.map((w, i) => (
                        <div key={`${w.kind}:${w.identifier}:${i}`} className="jodie-code-entry__warning">
                            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                            <span>
                                {w.kind === 'property-not-found'
                                    ? <>Property <code>{w.identifier}</code> not found on object.</>
                                    : <>Unknown identifier <code>{w.identifier}</code>.</>}
                                {w.suggestion && <> Did you mean <code>{w.suggestion}</code>?</>}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            {isError && onAskJjodie && (
                <button
                    className="jodie-promote-btn jodie-code-entry__promote"
                    onClick={() => onAskJjodie(entry)}
                    title="Switch to chat mode and ask Jjodie about this error"
                >
                    <i className="bi bi-question-circle" />
                    <span>Ask Jjodie about this</span>
                </button>
            )}
            <div className="jodie-message-meta jodie-code-entry__meta">
                <span className="jodie-message-time">{formatTimestamp(entry.timestamp)}</span>
            </div>
        </div>
    );
}

function TypingIndicator(): JSX.Element {
    return (
        <div className="jodie-message jodie-message-assistant">
            <div className="jodie-message-avatar jodie-avatar-typing">
                <i className="bi bi-three-dots" />
            </div>
            <div className="jodie-message-content">
                <div className="jodie-message-bubble jodie-typing-bubble">
                    <div className="jodie-typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ChatMessages({ messages, isWaiting, onJjScriptExecuted, onTestInCode, onAskJjodie }: ChatMessagesProps): JSX.Element {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isWaiting]);

    // Helper function to get project context
    const getProjectContext = useCallback(() => {
        try {
            const user: LUser = L.fromPointer(DUser.current);
            if (!user?.project) {
                return { hasProject: false, hasMetamodel: false, metamodelName: null, metamodelCount: 0 };
            }
            const project = user.project as LProject;
            const metamodels = (project as any).metamodels || [];

            // Try to get the active/selected metamodel
            const activeModel = Selectors.getActiveModel();
            let targetMetamodel: LModel | null = null;
            let metamodelName: string | null = null;

            if (activeModel && activeModel.isMetamodel) {
                targetMetamodel = activeModel;
                metamodelName = activeModel.name || 'Unnamed';
            } else if (metamodels.length > 0) {
                targetMetamodel = metamodels[0];
                metamodelName = targetMetamodel?.name || 'Unnamed';
            }

            return {
                hasProject: true,
                hasMetamodel: metamodels.length > 0,
                metamodelName,
                metamodelCount: metamodels.length,
            };
        } catch {
            return { hasProject: false, hasMetamodel: false, metamodelName: null, metamodelCount: 0 };
        }
    }, []);

    // Subscribe to Redux store changes to detect metamodel creation
    const [projectContext, setProjectContext] = useState(() => getProjectContext());

    useEffect(() => {
        // Update context immediately
        setProjectContext(getProjectContext());

        // Subscribe to Redux store changes
        const unsubscribe = store.subscribe(() => {
            const newContext = getProjectContext();
            setProjectContext(prev => {
                // Only update if actually changed
                if (prev.hasProject !== newContext.hasProject ||
                    prev.hasMetamodel !== newContext.hasMetamodel ||
                    prev.metamodelCount !== newContext.metamodelCount) {
                    return newContext;
                }
                return prev;
            });
        });

        return () => unsubscribe();
    }, [getProjectContext]);

    // JjScript execution handler
    const handleJjScriptExecute = useCallback(async (commands: string[]): Promise<ScriptLineResult[]> => {
        // Check if project is available
        if (!projectContext.hasProject) {
            return [{
                command: commands[0] || '',
                success: false,
                message: 'Per eseguire questo script, apri prima un progetto.',
            }];
        }

        // Check if metamodel is available
        if (!projectContext.hasMetamodel) {
            return [{
                command: commands[0] || '',
                success: false,
                message: 'Il progetto non ha metamodelli. Clicca "+ New" nella sezione METAMODELS per crearne uno, poi esegui di nuovo lo script.',
            }];
        }

        const results: ScriptLineResult[] = [];

        for (const command of commands) {
            try {
                const result = await executeCommand(command);
                results.push({
                    command,
                    success: result.success,
                    message: result.message,
                    warnings: result.warnings,
                });
            } catch (err) {
                results.push({
                    command,
                    success: false,
                    message: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }

        // Notify parent that execution completed (for metamodel refresh)
        if (onJjScriptExecuted) {
            onJjScriptExecuted();
        }

        return results;
    }, [onJjScriptExecuted, projectContext]);

    return (
        <div className="jodie-messages">
            {messages.length === 0 ? (
                <div className="jodie-welcome">
                    <div className="jodie-welcome-icon">
                        <i className="bi bi-chat-heart" />
                    </div>
                    <h3>Hi, I'm Jjodie!</h3>
                    <p>Your metamodeling assistant. I can help you with:</p>
                    <ul>
                        <li><i className="bi bi-diagram-3" /> Metamodel design patterns</li>
                        <li><i className="bi bi-check-circle" /> Validation and constraints</li>
                        <li><i className="bi bi-lightbulb" /> Best practices and trade-offs</li>
                        <li><i className="bi bi-code-slash" /> Code generation guidance</li>
                    </ul>
                </div>
            ) : (
                <>
                    {messages.map(entry => (
                        isCodeEntry(entry) ? (
                            <CodeReplEntry key={entry.id} entry={entry} onAskJjodie={onAskJjodie} />
                        ) : (
                            <MessageBubble
                                key={entry.id}
                                message={entry as ChatMessage}
                                onJjScriptExecute={handleJjScriptExecute}
                                onTestInCode={onTestInCode}
                            />
                        )
                    ))}
                    {isWaiting && <TypingIndicator />}
                </>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default ChatMessages;
