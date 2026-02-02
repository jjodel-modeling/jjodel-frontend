/**
 * Chat Messages Component
 * Displays the conversation history with the AI
 */

import React, { useEffect, useRef } from 'react';
import { ChatMessage, PROVIDER_INFO } from '../../types/jodie';
import { MarkdownMessage } from './MarkdownMessage';

interface ChatMessagesProps {
    messages: ChatMessage[];
    isWaiting?: boolean;
}

function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2) || 'U';
}

function MessageBubble({ message }: { message: ChatMessage }): JSX.Element {
    const isUser = message.role === 'user';
    const providerInfo = message.provider ? PROVIDER_INFO[message.provider] : null;
    const displayName = message.userName || 'You';
    const isJjScript = !!message.jjscriptResult;
    const jjScriptSuccess = message.jjscriptResult?.success ?? true;

    return (
        <div className={`jodie-message ${isUser ? 'jodie-message-user' : 'jodie-message-assistant'}`}>
            {/* User avatar with initials */}
            {isUser && (
                <div className="jodie-message-avatar jodie-user-avatar">
                    <span>{getInitials(displayName)}</span>
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
                    style={{ backgroundColor: providerInfo.color }}
                >
                    <span style={{ fontWeight: 600 }}>{providerInfo.textIcon}</span>
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
                        <MarkdownMessage content={message.content} isUser={isUser} />
                    </div>
                </div>
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

export function ChatMessages({ messages, isWaiting }: ChatMessagesProps): JSX.Element {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isWaiting]);

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
                    {messages.map(message => (
                        <MessageBubble key={message.id} message={message} />
                    ))}
                    {isWaiting && <TypingIndicator />}
                </>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default ChatMessages;
