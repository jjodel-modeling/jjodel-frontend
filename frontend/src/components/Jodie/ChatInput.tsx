/**
 * Chat Input Component
 * Text input for sending messages to the AI with image and PDF support
 */

import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent, useCallback, useMemo } from 'react';
import {
    ChatImage, ChatDocument, JodieConfig, ConsoleMode, ConsoleModeSwitchVia, CodeFlavor,
    ConsoleEntry, ChatMessage, CodeEntry,
} from '../../types/jodie';
import { AIEvents } from '../../events/registry';
import { getJjelSuggestions, applyJjelSuggestion } from '../../jjel/autocomplete';
import type { Suggestion } from '../../jjscript/autocomplete/types';
import './ChatInput.scss';

interface ChatInputProps {
    onSend: (message: string, images?: ChatImage[], documents?: ChatDocument[]) => void;
    disabled?: boolean;
    placeholder?: string;
    supportsVision?: boolean;
    supportsPDF?: boolean;
    /** External prefill (e.g. from "Ask Jjodie" notifications link). Nonce changes to re-trigger same prompt. */
    prefilledMessage?: { prompt: string; nonce: number } | null;
    /** Stop the in-flight AI response (UI-only — fetch is not actually aborted). */
    onStop?: () => void;
    /** Open the AI Settings modal (used by the no-provider warning state). */
    onOpenSettings?: () => void;
    /** Active console mode (Jjodie / JjScript / JjEL). Drives placeholder, font, prompt glyph and submit behavior. */
    consoleMode: ConsoleMode;
    /** Switch to a different mode (backtick shortcut, `/` meta-commands). */
    onConsoleModeChange: (m: ConsoleMode, via?: ConsoleModeSwitchVia) => void;
    /** Active flavor in JjEL mode (today: 'jjel'). */
    codeFlavor: CodeFlavor;
    /** Submit handler for JjEL (code) mode: parent evaluates and appends a CodeEntry. */
    onSubmitCode: (input: string) => void;
    /** Slash `/help` in Jjodie mode: parent appends a static help entry. */
    onHelpRequested?: () => void;
    /** Unknown `/…` in Jjodie mode: parent appends a static "unknown command" entry (no LLM). */
    onUnknownCommand?: (raw: string) => void;
    /** Unified history; ChatInput filters by mode (and flavor in code) for the up/down nav. */
    entries: ConsoleEntry[];
    /** Clear the entries of the active mode. Triggered by the `/clear` slash command. */
    onClearRequested?: () => void;
}

type SendBtnState = 'empty' | 'ready' | 'sending' | 'no-provider';

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

// Cursor row helpers for textarea history navigation: "first/last visual line".
// Using newline scan rather than caret coordinates keeps behavior consistent across
// fonts and zoom levels.
function isCursorOnFirstLine(el: HTMLTextAreaElement): boolean {
    return !el.value.substring(0, el.selectionStart).includes('\n');
}
function isCursorOnLastLine(el: HTMLTextAreaElement): boolean {
    return !el.value.substring(el.selectionEnd).includes('\n');
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
    onStop,
    onOpenSettings,
    consoleMode,
    onConsoleModeChange,
    codeFlavor,
    onSubmitCode,
    onHelpRequested,
    onUnknownCommand,
    entries,
    onClearRequested,
}: ChatInputProps): JSX.Element {
    // JjEL mode is the "code" bucket (local REPL, autocomplete, CodeEntry history).
    const isCode = consoleMode === 'jjel';
    // Jjodie is the only mode that talks to an AI provider and takes attachments.
    const isJjodie = consoleMode === 'jjodie';
    const [message, setMessage] = useState('');
    const [images, setImages] = useState<ChatImage[]>([]);
    const [documents, setDocuments] = useState<ChatDocument[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [savedMessage, setSavedMessage] = useState(''); // Save current input when navigating history
    const [hasProvider, setHasProvider] = useState<boolean>(() => JodieConfig.hasEnabledProviders());
    // Autocomplete dropdown state. Active only in Code mode + JjEL flavor.
    const [completions, setCompletions] = useState<Suggestion[]>([]);
    const [completionIndex, setCompletionIndex] = useState(0);
    const [isCompletionVisible, setIsCompletionVisible] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const completionDebounceRef = useRef<number | null>(null);
    // Cursor position last seen by the autocompletion effect — kept in a ref so
    // ↑/↓ don't trigger re-runs (only the textarea selectionStart matters at fire time).
    const cursorRef = useRef<number>(0);
    // Suppress the JjEL dropdown after a submit until the user types a printable
    // character (or Backspace). Prevents the dropdown from re-opening over the
    // freshly-printed result entry when setMessage('') triggers the suggestion
    // effect with an empty/typo prefix that some providers still return matches for.
    const suppressUntilNextCharRef = useRef<boolean>(false);

    // Filtered, in-session history for ↑/↓ navigation.
    // Chat: user messages only (assistant replies excluded). Code: same flavor only.
    // Newest first so historyIndex 0 is the most recent submission.
    const userHistory = useMemo<string[]>(() => {
        if (isCode) {
            return entries
                .filter((e): e is CodeEntry => e.kind === 'code' && e.flavor === codeFlavor)
                .map(e => e.input)
                .reverse();
        }
        return entries
            .filter((e): e is ChatMessage => e.kind !== 'code' && e.role === 'user')
            .map(e => e.content)
            .reverse();
    }, [entries, isCode, codeFlavor]);

    // Check if any attachments are supported
    const supportsAttachments = supportsVision || supportsPDF;

    // Track AI provider configuration to drive the send button "no-provider" state
    useEffect(() => {
        const refresh = () => setHasProvider(JodieConfig.hasEnabledProviders());
        refresh();
        window.addEventListener(AIEvents.SETTINGS_CHANGED, refresh);
        return () => window.removeEventListener(AIEvents.SETTINGS_CHANGED, refresh);
    }, []);

    // Switching console mode or code flavor invalidates the in-flight history
    // navigation: the underlying list changes, so caret position and draft are no
    // longer meaningful. Also drop the autocomplete dropdown — its state is tied
    // to a specific flavor.
    useEffect(() => {
        setHistoryIndex(-1);
        setSavedMessage('');
        setCompletions([]);
        setCompletionIndex(0);
        setIsCompletionVisible(false);
    }, [consoleMode, codeFlavor]);

    // Recompute JjEL autocomplete suggestions when the user types or the cursor moves.
    // Active only in Code+JjEL. Debounced ~50ms to avoid recomputing on every keystroke
    // when typing fast.
    const jjelAutocompleteEnabled = isCode && codeFlavor === 'jjel';
    useEffect(() => {
        if (!jjelAutocompleteEnabled) {
            setCompletions([]);
            setIsCompletionVisible(false);
            return;
        }
        if (completionDebounceRef.current !== null) {
            window.clearTimeout(completionDebounceRef.current);
        }
        // Regola B: don't open the dropdown when the input is empty or contains
        // only whitespace. Skip the suggestion computation entirely.
        if (message.trim().length === 0) {
            setCompletions([]);
            setCompletionIndex(0);
            setIsCompletionVisible(false);
            return;
        }
        // Regola C: while the suppression flag is armed (post-submit), keep the
        // dropdown closed even if `message` would otherwise produce suggestions.
        // The flag is cleared by handleKeyDown when the user types a printable
        // character or Backspace.
        if (suppressUntilNextCharRef.current) {
            setCompletions([]);
            setCompletionIndex(0);
            setIsCompletionVisible(false);
            return;
        }
        completionDebounceRef.current = window.setTimeout(() => {
            const ta = textareaRef.current;
            const caret = ta ? ta.selectionStart : message.length;
            cursorRef.current = caret;
            const sugs = getJjelSuggestions(message, caret);
            setCompletions(sugs);
            setCompletionIndex(0);
            setIsCompletionVisible(sugs.length > 0);
        }, 50);
        return () => {
            if (completionDebounceRef.current !== null) {
                window.clearTimeout(completionDebounceRef.current);
                completionDebounceRef.current = null;
            }
        };
    }, [message, jjelAutocompleteEnabled]);

    /** Insert the selected suggestion into the textarea. */
    const acceptCompletion = useCallback((suggestion: Suggestion) => {
        const ta = textareaRef.current;
        const caret = ta ? ta.selectionStart : message.length;
        const { text, cursorPosition } = applyJjelSuggestion(message, suggestion, caret);
        setMessage(text);
        setIsCompletionVisible(false);
        setCompletions([]);
        setCompletionIndex(0);
        // Restore caret after React re-renders the controlled textarea.
        requestAnimationFrame(() => {
            const el = textareaRef.current;
            if (el) {
                try { el.setSelectionRange(cursorPosition, cursorPosition); } catch { /* ignore */ }
                el.focus();
            }
        });
    }, [message]);

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

        // Slash commands: intercepted before mode-specific submit so they
        // don't reach onSend/onSubmitCode and aren't appended to the unified
        // history (= invisible to the up/down nav). Case-sensitive by design.
        if (trimmed === '/clear') {
            onClearRequested?.();
            setMessage('');
            setHistoryIndex(-1);
            setSavedMessage('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            return;
        }

        // `/` meta-commands: switch mode or show help, in ALL modes. The `/`
        // authority is per-component, not per-mode — the escape hatch must work
        // from the formal modes too (e.g. `/ask` from jjscript → back to Jjodie).
        // Same reset shape as `/clear`; not sent, not appended to history.
        if (trimmed === '/js' || trimmed === '/jjel' || trimmed === '/ask' || trimmed === '/help') {
            if (trimmed === '/js') onConsoleModeChange('jjscript', 'slash');
            else if (trimmed === '/jjel') onConsoleModeChange('jjel', 'slash');
            else if (trimmed === '/ask') onConsoleModeChange('jjodie', 'slash');
            else onHelpRequested?.();
            setMessage('');
            setHistoryIndex(-1);
            setSavedMessage('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            return;
        }

        // Jjodie only: an unknown `/…` is a typo, not a message → static hint,
        // no LLM call. In JjScript/JjEL a leading `/` falls through to the
        // provider (which strips the prefix or reports a parse error).
        if (consoleMode === 'jjodie' && trimmed.startsWith('/')) {
            onUnknownCommand?.(trimmed);
            setMessage('');
            setHistoryIndex(-1);
            setSavedMessage('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            return;
        }

        if (isCode) {
            if (!trimmed) return;
            onSubmitCode(trimmed);
            setMessage('');
            setHistoryIndex(-1);
            setSavedMessage('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            // Regola A: close the autocomplete dropdown explicitly on submit and
            // reset its tracked state. Same reset shape as the mode/flavor effect
            // and acceptCompletion, so callers see a consistent post-submit state.
            setCompletions([]);
            setCompletionIndex(0);
            setIsCompletionVisible(false);
            // Regola C: arm the suppression flag so the next message-driven effect
            // run (caused by setMessage('') above) does not re-open the dropdown.
            // The flag is cleared by handleKeyDown on the next printable keypress.
            suppressUntilNextCharRef.current = true;
            return;
        }

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
    }, [message, images, documents, disabled, onSend, isCode, consoleMode, onConsoleModeChange, onHelpRequested, onSubmitCode, onClearRequested]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Regola C: any printable character or Backspace counts as the user
        // resuming typing after a submit, so disarm the suppression flag here.
        // Non-printable keys (arrows, modifiers, Tab, Esc, ...) leave the flag
        // intact, keeping the dropdown closed during caret moves and history nav.
        if (suppressUntilNextCharRef.current && (e.key.length === 1 || e.key === 'Backspace')) {
            suppressUntilNextCharRef.current = false;
        }

        // Backtick on an empty non-JjEL input switches to JjEL mode (and swallows the char).
        if (!isCode && e.key === '`' && message === '') {
            e.preventDefault();
            onConsoleModeChange('jjel', 'backtick');
            return;
        }

        // Autocomplete dropdown takes priority over history nav and Enter/Tab/Esc
        // when it is open. This is the JjEL Code-mode-only path.
        if (isCompletionVisible && completions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setCompletionIndex(prev => (prev + 1) % completions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setCompletionIndex(prev => (prev - 1 + completions.length) % completions.length);
                return;
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                acceptCompletion(completions[completionIndex]);
                return;
            }
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                acceptCompletion(completions[completionIndex]);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setIsCompletionVisible(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const trimmed = message.trim();
            // Slash commands bypass the mode/provider/disabled gates so the
            // user can always clear history via the keyboard, even when the
            // chat send button would otherwise refuse Enter.
            if (trimmed === '/clear') {
                handleSubmit();
                return;
            }
            // `/` meta-commands (all modes) and unknown `/…` in Jjodie bypass the
            // provider/disabled gate so they fire even with no provider configured
            // (handleSubmit intercepts them).
            if (trimmed === '/js' || trimmed === '/jjel' || trimmed === '/ask' || trimmed === '/help') {
                handleSubmit();
                return;
            }
            if (consoleMode === 'jjodie' && trimmed.startsWith('/')) {
                handleSubmit();
                return;
            }
            if (isCode) {
                if (trimmed) handleSubmit();
                return;
            }
            // JjScript runs locally: submit on content, no provider needed.
            if (!isJjodie) {
                if (!disabled && trimmed) handleSubmit();
                return;
            }
            // Jjodie: only submit when the send button would actually send (state === 'ready').
            // Other states (empty, sending, no-provider) ignore Enter.
            const hasAttachments = images.length > 0 || documents.length > 0;
            if (hasProvider && !disabled && (trimmed || hasAttachments)) {
                handleSubmit();
            }
            return;
        }

        // Esc: leave history navigation, restore the draft. If not navigating,
        // do not intercept (let any future Esc handler take it).
        if (e.key === 'Escape') {
            if (historyIndex !== -1) {
                e.preventDefault();
                setMessage(savedMessage);
                setHistoryIndex(-1);
            }
            return;
        }

        // History navigation with ArrowUp/ArrowDown.
        // Source: per-mode/per-flavor user history derived from `entries`.
        if (userHistory.length === 0) return;
        const textarea = textareaRef.current;

        if (e.key === 'ArrowUp') {
            // First-line check: in a textarea, only steal ↑ when the caret is on
            // the first visual line. Otherwise let the browser move the caret up.
            if (textarea && !isCursorOnFirstLine(textarea)) return;

            e.preventDefault();

            // Already at the oldest entry: nothing to do.
            if (historyIndex >= userHistory.length - 1) return;

            // Entering navigation: save the current draft.
            if (historyIndex === -1) setSavedMessage(message);

            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setMessage(userHistory[newIndex]);
        } else if (e.key === 'ArrowDown') {
            // Not navigating: pass through.
            if (historyIndex === -1) return;

            // Last-line check.
            if (textarea && !isCursorOnLastLine(textarea)) return;

            e.preventDefault();

            if (historyIndex === 0) {
                // Step back out to the draft.
                setHistoryIndex(-1);
                setMessage(savedMessage);
            } else {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setMessage(userHistory[newIndex]);
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
    // No placeholder: the persistent `<mode>>` prompt (and, in Jjodie, the attach
    // button on the right) already convey what to do. An externally-supplied
    // `placeholder` prop still wins if set.
    const getPlaceholder = () => placeholder ?? '';

    // Send button: 4 mutually-exclusive states.
    // The provider check is only relevant in Jjodie mode: JjEL and JjScript run
    // locally against the model.
    const sendBtnState: SendBtnState = useMemo(() => {
        // JjEL evaluates synchronously — no provider, no waiting state.
        if (isCode) return message.trim() ? 'ready' : 'empty';
        // JjScript runs locally (no provider) but is async, so honor the waiting state.
        if (!isJjodie) {
            if (disabled) return 'sending';
            return hasContent ? 'ready' : 'empty';
        }
        if (!hasProvider) return 'no-provider';
        if (disabled) return 'sending';
        if (!hasContent) return 'empty';
        return 'ready';
    }, [hasProvider, disabled, hasContent, isCode, isJjodie, message]);

    // TODO: real abort wired to AbortController in AIProviderService — currently UI-only
    const handleStopClick = useCallback(() => {
        if (onStop) onStop();
    }, [onStop]);

    const handleOpenSettingsClick = useCallback(() => {
        if (onOpenSettings) onOpenSettings();
    }, [onOpenSettings]);

    const sendBtnConfig = useMemo(() => {
        switch (sendBtnState) {
            case 'empty':
                return {
                    modifier: 'jodie-send-btn--empty',
                    icon: 'bi-arrow-up',
                    onClick: undefined,
                    disabled: true,
                    title: 'Type a message',
                    ariaLabel: 'Type a message to enable send',
                };
            case 'ready':
                return {
                    modifier: 'jodie-send-btn--ready',
                    icon: 'bi-arrow-up',
                    onClick: handleSubmit,
                    disabled: false,
                    title: 'Send (Enter)',
                    ariaLabel: 'Send message',
                };
            case 'sending':
                return {
                    modifier: 'jodie-send-btn--sending',
                    icon: 'bi-stop-fill',
                    onClick: handleStopClick,
                    disabled: false,
                    title: 'Stop generation',
                    ariaLabel: 'Stop AI response',
                };
            case 'no-provider':
                return {
                    modifier: 'jodie-send-btn--no-provider',
                    icon: 'bi-exclamation-triangle-fill',
                    onClick: handleOpenSettingsClick,
                    disabled: false,
                    title: 'Configure an AI provider in Settings',
                    ariaLabel: 'No AI provider configured. Open Settings.',
                };
        }
    }, [sendBtnState, handleSubmit, handleStopClick, handleOpenSettingsClick]);

    return (
        <div className={`jodie-input-container${isCode ? ' jodie-input-container--code' : ''}`}>
            {/* Attachment previews (Jjodie mode only) */}
            {isJjodie && (images.length > 0 || documents.length > 0) && (
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
                <div className={`jodie-composer${isCode ? ' jodie-composer--code' : ''}`}>
                    <span className="jodie-code-prompt" aria-hidden="true">{`${consoleMode}>`}</span>
                    <textarea
                        ref={textareaRef}
                        className={`jodie-input${isCode ? ' jodie-input--code' : ''}`}
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            // User-driven typing while navigating: drop out of history
                            // and treat the recovered text as the new draft.
                            if (historyIndex !== -1) setHistoryIndex(-1);
                        }}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={getPlaceholder()}
                        disabled={isCode ? false : disabled}
                        rows={1}
                    />

                    {/* Attachment button — right side, before the send button
                        (Jjodie mode + provider supports images/PDF). */}
                    {isJjodie && supportsAttachments && (
                        <button
                            className="jodie-attach-btn"
                            onClick={openFilePicker}
                            disabled={disabled}
                            title={supportsPDF ? 'Attach image or PDF' : 'Attach image'}
                        >
                            <i className={supportsPDF ? 'bi bi-paperclip' : 'bi bi-image'} />
                        </button>
                    )}
                    <button
                        className={`jodie-send-btn ${sendBtnConfig.modifier}`}
                        onClick={sendBtnConfig.onClick}
                        disabled={sendBtnConfig.disabled}
                        title={sendBtnConfig.title}
                        aria-label={sendBtnConfig.ariaLabel}
                    >
                        <i className={`bi ${sendBtnConfig.icon}`} />
                    </button>

                    {/* JjEL autocomplete dropdown — anchored above the composer (bottom of the Jodie window).
                        Visible only in Code+JjEL when there are matching suggestions. */}
                    {jjelAutocompleteEnabled && isCompletionVisible && completions.length > 0 && (
                        <div
                            className="jodie-completion-dropdown"
                            role="listbox"
                            // Keep focus on the textarea: if the click lands on the dropdown chrome
                            // (between rows), the textarea would lose focus and the dropdown would
                            // close before the row's onClick fires.
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            {completions.map((sug, i) => {
                                const kind = (sug.metadata as any)?.jjelKind ?? sug.type;
                                return (
                                    <div
                                        key={`${sug.type}:${sug.text}:${i}`}
                                        className={`jodie-completion-row${i === completionIndex ? ' jodie-completion-row--active' : ''}`}
                                        role="option"
                                        aria-selected={i === completionIndex}
                                        onMouseEnter={() => setCompletionIndex(i)}
                                        onClick={() => acceptCompletion(sug)}
                                    >
                                        <span className={`jodie-completion-badge jodie-completion-badge--${kind}`}>
                                            {kind === 'method' ? 'fn'
                                                : kind === 'collection' ? 'coll'
                                                : kind === 'class' ? 'class'
                                                : kind === 'class-property' ? 'cls'
                                                : kind === 'meta-property' ? 'meta'
                                                : kind === 'context' ? 'var'
                                                : kind === 'keyword' ? 'kw'
                                                : sug.type}
                                        </span>
                                        <span className="jodie-completion-text">{sug.displayText}</span>
                                        {sug.description && (
                                            <span className="jodie-completion-desc">{sug.description}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
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
