import React, { useState, useRef, useEffect, useCallback, JSX } from 'react';
import './jjodie-widget.scss';

/**
 * Message interface for chat history
 */
interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

/**
 * Demo responses for keyword-based AI simulation
 */
const demoResponses: Record<string, string> = {
    model: `A **model** in Jjodel represents an instance of your metamodel. Think of it as the actual data that conforms to the structure you've defined.

For example, if your metamodel defines a "Class" with attributes, a model would contain specific classes like "Customer" or "Order" with their actual values.

Would you like me to explain how to create a new model?`,

    metamodel: `A **metamodel** defines the structure and rules for your models. It's like a template or schema that specifies:

• What types of elements can exist
• What attributes they can have
• How they can relate to each other

In Jjodel, you start by creating a metamodel, then create models that follow its rules.`,

    validate: `To **validate** your model in Jjodel:

1. Open your model in the editor
2. Look for the "Validate" button in the toolbar (or press Ctrl+V)
3. The validation panel will show any errors or warnings

Common validation issues include:
• Missing required attributes
• Type mismatches
• Constraint violations

Need help with a specific validation error?`,

    help: `I'm Jjodie, your Jjodel assistant! I can help you with:

• **Creating models** - structuring your data
• **Understanding metamodels** - defining schemas
• **Validation** - checking your work
• **Navigation** - finding features in Jjodel

Just type your question or click one of the suggested topics below!`,

    create: `To **create a new project** in Jjodel:

1. Click the "+ New Project" button in the dashboard
2. Choose between Metamodel or Model type
3. Give your project a name and optional description
4. Click "Create" to get started!

You can also import existing projects using the "Import" button.`,

    export: `To **export** your work from Jjodel:

1. Open your project
2. Click the menu icon (three dots) in the top-right
3. Select "Export" from the dropdown
4. Choose your format (JSON, XMI, or custom)

Your file will download automatically!`,
};

/**
 * Default response when no keyword matches
 */
const defaultResponse = `That's an interesting question! I'm currently in demo mode with limited responses.

In the full version, I'll be able to help you with:
• Detailed modeling guidance
• Code generation
• Best practices
• And much more!

Try asking about: **model**, **metamodel**, **validate**, or **help**`;

/**
 * Suggested questions for new users
 */
const suggestedQuestions = [
    { text: 'What is a metamodel?', icon: 'bi-diagram-3' },
    { text: 'How do I validate my model?', icon: 'bi-check-circle' },
    { text: 'Help me get started', icon: 'bi-rocket-takeoff' },
    { text: 'How do I create a project?', icon: 'bi-plus-circle' },
];

/**
 * Generate unique ID for messages
 */
const generateId = (): string => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Find matching response based on keywords in the query
 */
const findResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    // Check for keyword matches
    for (const [keyword, response] of Object.entries(demoResponses)) {
        if (lowerQuery.includes(keyword)) {
            return response;
        }
    }

    return defaultResponse;
};

/**
 * JjodieWidget - Floating AI Assistant Chat Widget
 *
 * A demo UI-only implementation of the Jjodel AI assistant.
 * Features simulated responses based on keywords.
 */
export function JjodieWidget(): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /**
     * Scroll to bottom when new messages arrive
     */
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    /**
     * Focus input when chat opens
     */
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    /**
     * Handle opening the chat panel
     */
    const handleOpen = useCallback(() => {
        setIsOpen(true);
    }, []);

    /**
     * Handle closing the chat panel
     */
    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    /**
     * Handle sending a message
     */
    const handleSend = useCallback(() => {
        const trimmedValue = inputValue.trim();
        if (!trimmedValue || isTyping) return;

        // Add user message
        const userMessage: Message = {
            id: generateId(),
            type: 'user',
            content: trimmedValue,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI response with delay
        const responseDelay = 1000 + Math.random() * 1000; // 1-2 seconds

        setTimeout(() => {
            const response = findResponse(trimmedValue);
            const assistantMessage: Message = {
                id: generateId(),
                type: 'assistant',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
            setIsTyping(false);
        }, responseDelay);
    }, [inputValue, isTyping]);

    /**
     * Handle keyboard events in input
     */
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    /**
     * Handle clicking a suggested question
     */
    const handleSuggestedClick = useCallback((question: string) => {
        setInputValue(question);
        // Automatically send after a brief delay
        setTimeout(() => {
            const userMessage: Message = {
                id: generateId(),
                type: 'user',
                content: question,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, userMessage]);
            setIsTyping(true);

            const responseDelay = 1000 + Math.random() * 1000;

            setTimeout(() => {
                const response = findResponse(question);
                const assistantMessage: Message = {
                    id: generateId(),
                    type: 'assistant',
                    content: response,
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, assistantMessage]);
                setIsTyping(false);
            }, responseDelay);
        }, 100);
        setInputValue('');
    }, []);

    /**
     * Render markdown-like content (basic support)
     */
    const renderContent = (content: string): JSX.Element => {
        // Simple markdown parsing for bold text and bullet points
        const lines = content.split('\n');

        return (
            <>
                {lines.map((line, index) => {
                    // Handle bullet points
                    if (line.startsWith('• ') || line.startsWith('- ')) {
                        const bulletContent = line.substring(2);
                        return (
                            <div key={index} className="jjodie-bullet">
                                <span className="bullet">•</span>
                                <span dangerouslySetInnerHTML={{
                                    __html: bulletContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                }} />
                            </div>
                        );
                    }

                    // Handle numbered lists
                    const numberedMatch = line.match(/^(\d+)\.\s(.*)$/);
                    if (numberedMatch) {
                        return (
                            <div key={index} className="jjodie-numbered">
                                <span className="number">{numberedMatch[1]}.</span>
                                <span dangerouslySetInnerHTML={{
                                    __html: numberedMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                }} />
                            </div>
                        );
                    }

                    // Regular text with bold support
                    if (line.trim()) {
                        return (
                            <p key={index} dangerouslySetInnerHTML={{
                                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }} />
                        );
                    }

                    // Empty lines for spacing
                    return <br key={index} />;
                })}
            </>
        );
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    className="jjodie-fab"
                    onClick={handleOpen}
                    aria-label="Open Jjodie Assistant"
                >
                    <i className="bi bi-chat-dots-fill" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="jjodie-panel">
                    {/* Header */}
                    <div className="jjodie-header">
                        <div className="jjodie-header-info">
                            <div className="jjodie-avatar">
                                <i className="bi bi-robot" />
                            </div>
                            <div className="jjodie-header-text">
                                <span className="jjodie-name">Jjodie</span>
                                <span className="jjodie-status">AI Assistant</span>
                            </div>
                        </div>
                        <div className="jjodie-header-actions">
                            <button
                                className="jjodie-header-btn"
                                onClick={handleClose}
                                aria-label="Close"
                            >
                                <i className="bi bi-x-lg" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="jjodie-messages">
                        {messages.length === 0 ? (
                            /* Welcome State */
                            <div className="jjodie-welcome">
                                <div className="jjodie-welcome-icon">
                                    <i className="bi bi-stars" />
                                </div>
                                <h3>Hi, I'm Jjodie!</h3>
                                <p>Your Jjodel assistant. I can help you with modeling, metamodels, and navigating the platform.</p>

                                <div className="jjodie-suggestions">
                                    <span className="jjodie-suggestions-label">Try asking:</span>
                                    {suggestedQuestions.map((q, index) => (
                                        <button
                                            key={index}
                                            className="jjodie-suggestion-btn"
                                            onClick={() => handleSuggestedClick(q.text)}
                                        >
                                            <i className={`bi ${q.icon}`} />
                                            <span>{q.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Messages List */
                            <>
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`jjodie-message jjodie-message-${msg.type}`}
                                    >
                                        {msg.type === 'assistant' && (
                                            <div className="jjodie-message-avatar">
                                                <i className="bi bi-robot" />
                                            </div>
                                        )}
                                        <div className="jjodie-message-content">
                                            {msg.type === 'user' ? (
                                                <p>{msg.content}</p>
                                            ) : (
                                                renderContent(msg.content)
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isTyping && (
                                    <div className="jjodie-message jjodie-message-assistant">
                                        <div className="jjodie-message-avatar">
                                            <i className="bi bi-robot" />
                                        </div>
                                        <div className="jjodie-typing">
                                            <span className="jjodie-typing-dot"></span>
                                            <span className="jjodie-typing-dot"></span>
                                            <span className="jjodie-typing-dot"></span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="jjodie-input-area">
                        <div className="jjodie-input-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                className="jjodie-input"
                                placeholder="Ask Jjodie anything..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isTyping}
                            />
                            <button
                                className="jjodie-send-btn"
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isTyping}
                                aria-label="Send message"
                            >
                                <i className="bi bi-send-fill" />
                            </button>
                        </div>
                        <span className="jjodie-disclaimer">
                            Demo mode - responses are simulated
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}

export default JjodieWidget;
