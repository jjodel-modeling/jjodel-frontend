/**
 * Chat Input Component
 * Text input for sending messages to the AI with image and PDF support
 */

import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent, useCallback } from 'react';
import { ChatImage, ChatDocument } from '../../types/jodie';
import { JjScriptService } from '../../jjscript';
import './ChatInput.scss';

interface ChatInputProps {
    onSend: (message: string, images?: ChatImage[], documents?: ChatDocument[]) => void;
    disabled?: boolean;
    placeholder?: string;
    supportsVision?: boolean;
    supportsPDF?: boolean;
    /** External prefill (e.g. from "Ask Jjodie" notifications link). Nonce changes to re-trigger same prompt. */
    prefilledMessage?: { prompt: string; nonce: number } | null;
}

// Generate unique ID for attachments
function generateAttachmentId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Convert File to ChatImage
async function fileToImage(file: File): Promise<ChatImage> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64Data = dataUrl.split(',')[1];
            resolve({
                id: generateAttachmentId('img'),
                data: base64Data,
                mimeType: file.type,
                preview: dataUrl,
                name: file.name,
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Convert File to ChatDocument
async function fileToDocument(file: File): Promise<ChatDocument> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64Data = dataUrl.split(',')[1];
            resolve({
                id: generateAttachmentId('doc'),
                data: base64Data,
                mimeType: file.type,
                name: file.name,
                size: file.size,
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Format file size for display
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatInput({
    onSend,
    disabled,
    placeholder,
    supportsVision = false,
    supportsPDF = false,
    prefilledMessage,
}: ChatInputProps): JSX.Element {
    const [message, setMessage] = useState('');
    const [images, setImages] = useState<ChatImage[]>([]);
    const [documents, setDocuments] = useState<ChatDocument[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [savedMessage, setSavedMessage] = useState(''); // Save current input when navigating history
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check if any attachments are supported
    const supportsAttachments = supportsVision || supportsPDF;

    // External prefill: set the textarea content and focus it. Nonce ensures
    // re-trigger when the same prompt is requested twice in a row.
    useEffect(() => {
        if (!prefilledMessage?.prompt) return;
        setMessage(prefilledMessage.prompt);
        setHistoryIndex(-1);
        setSavedMessage('');
        const ta = textareaRef.current;
        if (ta) {
            ta.focus();
            const len = prefilledMessage.prompt.length;
            try { ta.setSelectionRange(len, len); } catch { /* ignore */ }
        }
    }, [prefilledMessage]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, [message]);

    const handleSubmit = useCallback(() => {
        const trimmed = message.trim();
        const hasAttachments = images.length > 0 || documents.length > 0;

        if ((trimmed || hasAttachments) && !disabled) {
            onSend(
                trimmed,
                images.length > 0 ? images : undefined,
                documents.length > 0 ? documents : undefined
            );
            setMessage('');
            setImages([]);
            setDocuments([]);
            // Reset history navigation
            setHistoryIndex(-1);
            setSavedMessage('');
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    }, [message, images, documents, disabled, onSend]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
            return;
        }

        // History navigation with ArrowUp/ArrowDown
        const history = JjScriptService.getHistory();
        if (history.length === 0) return;

        if (e.key === 'ArrowUp') {
            // Only navigate if cursor is at the start of the input
            const textarea = textareaRef.current;
            if (textarea && textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
                e.preventDefault();

                if (historyIndex === -1) {
                    // Save current message before navigating
                    setSavedMessage(message);
                }

                const newIndex = historyIndex + 1;
                if (newIndex < history.length) {
                    setHistoryIndex(newIndex);
                    // History is stored oldest to newest, so we read from the end
                    const historyMessage = history[history.length - 1 - newIndex];
                    setMessage(historyMessage);
                }
            }
        } else if (e.key === 'ArrowDown') {
            // Only navigate if we're in history mode
            if (historyIndex > -1) {
                const textarea = textareaRef.current;
                if (textarea) {
                    e.preventDefault();

                    const newIndex = historyIndex - 1;
                    if (newIndex === -1) {
                        // Return to saved message
                        setHistoryIndex(-1);
                        setMessage(savedMessage);
                    } else if (newIndex >= 0) {
                        setHistoryIndex(newIndex);
                        const historyMessage = history[history.length - 1 - newIndex];
                        setMessage(historyMessage);
                    }
                }
            }
        }
    };

    // Handle paste event for images
    const handlePaste = useCallback(async (e: ClipboardEvent<HTMLTextAreaElement>) => {
        if (!supportsVision) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        const imageItems: DataTransferItem[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                imageItems.push(item);
            }
        }

        if (imageItems.length === 0) return;

        e.preventDefault();

        const newImages: ChatImage[] = [];
        for (const item of imageItems) {
            const file = item.getAsFile();
            if (file) {
                try {
                    const chatImage = await fileToImage(file);
                    newImages.push(chatImage);
                } catch (err) {
                    console.error('Error processing pasted image:', err);
                }
            }
        }

        if (newImages.length > 0) {
            setImages(prev => [...prev, ...newImages]);
        }
    }, [supportsVision]);

    // Handle file input change
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: ChatImage[] = [];
        const newDocuments: ChatDocument[] = [];
        const unsupportedFiles: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Handle images
            if (file.type.startsWith('image/')) {
                if (supportsVision) {
                    try {
                        const chatImage = await fileToImage(file);
                        newImages.push(chatImage);
                    } catch (err) {
                        console.error('Error processing image file:', err);
                    }
                } else {
                    unsupportedFiles.push(`${file.name} (images not supported by this provider)`);
                }
            }
            // Handle PDFs
            else if (file.type === 'application/pdf') {
                if (supportsPDF) {
                    try {
                        const chatDoc = await fileToDocument(file);
                        newDocuments.push(chatDoc);
                    } catch (err) {
                        console.error('Error processing PDF file:', err);
                    }
                } else {
                    unsupportedFiles.push(`${file.name} (PDF not supported - use Claude or Gemini)`);
                }
            }
            // Unknown file type
            else {
                unsupportedFiles.push(`${file.name} (unsupported file type)`);
            }
        }

        // Show alert for unsupported files
        if (unsupportedFiles.length > 0) {
            alert(`Could not attach:\n${unsupportedFiles.join('\n')}`);
        }

        if (newImages.length > 0) {
            setImages(prev => [...prev, ...newImages]);
        }
        if (newDocuments.length > 0) {
            setDocuments(prev => [...prev, ...newDocuments]);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [supportsVision, supportsPDF]);

    // Remove image by ID
    const removeImage = useCallback((imageId: string) => {
        setImages(prev => prev.filter(img => img.id !== imageId));
    }, []);

    // Remove document by ID
    const removeDocument = useCallback((docId: string) => {
        setDocuments(prev => prev.filter(doc => doc.id !== docId));
    }, []);

    // Open file picker
    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // Build accepted file types
    const acceptedTypes = [
        supportsVision ? 'image/*' : '',
        supportsPDF ? 'application/pdf' : '',
    ].filter(Boolean).join(',');

    const hasContent = message.trim() || images.length > 0 || documents.length > 0;

    // Build placeholder text
    const getPlaceholder = () => {
        if (placeholder) return placeholder;
        if (supportsVision && supportsPDF) return 'Message, paste image, or attach PDF...';
        if (supportsVision) return 'Message or paste an image...';
        if (supportsPDF) return 'Message or attach a PDF...';
        return 'Ask Jjodie about metamodeling...';
    };

    return (
        <div className="jodie-input-container">
            {/* Attachment previews */}
            {(images.length > 0 || documents.length > 0) && (
                <div className="jodie-attachment-previews">
                    {/* Image previews */}
                    {images.map(img => (
                        <div key={img.id} className="jodie-image-preview">
                            <img src={img.preview} alt={img.name || 'Pasted image'} />
                            <button
                                className="jodie-attachment-remove"
                                onClick={() => removeImage(img.id)}
                                title="Remove image"
                            >
                                <i className="bi bi-x" />
                            </button>
                        </div>
                    ))}

                    {/* Document previews */}
                    {documents.map(doc => (
                        <div key={doc.id} className="jodie-document-preview">
                            <div className="jodie-document-icon">
                                <i className="bi bi-file-earmark-pdf" />
                            </div>
                            <div className="jodie-document-info">
                                <span className="jodie-document-name" title={doc.name}>
                                    {doc.name.length > 20 ? doc.name.slice(0, 17) + '...' : doc.name}
                                </span>
                                <span className="jodie-document-size">{formatFileSize(doc.size)}</span>
                            </div>
                            <button
                                className="jodie-attachment-remove"
                                onClick={() => removeDocument(doc.id)}
                                title="Remove document"
                            >
                                <i className="bi bi-x" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="jodie-input-row">
                {/* Attachment button (if any attachments supported) */}
                {supportsAttachments && (
                    <button
                        className="jodie-attach-btn"
                        onClick={openFilePicker}
                        disabled={disabled}
                        title={supportsPDF ? 'Attach image or PDF' : 'Attach image'}
                    >
                        <i className={supportsPDF ? 'bi bi-paperclip' : 'bi bi-image'} />
                    </button>
                )}

                <textarea
                    ref={textareaRef}
                    className="jodie-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={getPlaceholder()}
                    disabled={disabled}
                    rows={1}
                />

                <button
                    className="jodie-send-btn"
                    onClick={handleSubmit}
                    disabled={disabled || !hasContent}
                    title="Send message"
                >
                    <i className="bi bi-send-fill" />
                </button>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes}
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </div>
    );
}

export default ChatInput;
