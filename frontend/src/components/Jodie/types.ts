/**
 * Chat and console types of the Jodie panel (#196 L6, spec §7): moved verbatim from `types/jodie.ts`,
 * with `ProviderId` of `src/services/ai` where that file named `TAIProvider`.
 */
import type { ProviderId } from '../../services/ai';

/**
 * Image attached to a chat message
 */
export interface ChatImage {
    id: string;
    data: string;        // Base64 encoded image data
    mimeType: string;    // e.g., 'image/png', 'image/jpeg'
    preview: string;     // Data URL for preview display
    name?: string;       // Optional filename
}

/**
 * Document (PDF) attached to a chat message
 */
export interface ChatDocument {
    id: string;
    data: string;        // Base64 encoded document data
    mimeType: string;    // e.g., 'application/pdf'
    name: string;        // Filename (required for documents)
    size: number;        // File size in bytes
}

export interface ChatMessage {
    id: string;
    /** Discriminator. Optional for backwards-compatibility; absent treated as 'chat'. */
    kind?: 'chat';
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    provider?: ProviderId;
    userName?: string;
    images?: ChatImage[];      // Attached images for vision-capable providers
    documents?: ChatDocument[]; // Attached documents (PDF) for supported providers
    jjscriptResult?: {         // JjScript command result metadata
        success: boolean;
        command: string;
        input?: string;        // original typed input, for the one-shot "Ask Jjodie" on a parse error
    };
    /**
     * Jjodie-mode offer: set when the typed input parsed as a complete JjScript
     * command. Rendered as an offer card ([Esegui] / [Chiedi a Jjodie]) instead
     * of being run silently or sent to the LLM. `consumed` disables the buttons
     * after a tap.
     */
    jjscriptOffer?: { input: string; consumed?: boolean };
    /**
     * Jjodie reply: the scope its context showed the model when it was asked for. Run
     * executes the reply's JjScript there, whatever tab is focused by then. Absent when no
     * metamodel or model was in focus, and Run then refuses instead of guessing.
     */
    jjodieScope?: JjodieScope;
}

/** The metamodel (and, at M1, the model) a Jjodie reply was written against. */
export interface JjodieScope {
    level: 'M1' | 'M2';
    metamodelId: string;
    metamodelName: string;
    /** The M1 model, when `level` is 'M1'. */
    modelId?: string;
}

// ============================================
// CONSOLE MODE (Jjodie / JjScript / JjEL)
// ============================================

// One console mode per language provider (id ↔ mode, 1:1). Legacy persisted
// values ('chat'/'code') are normalized on boot in Jodie.tsx.
export type ConsoleMode = 'jjodie' | 'jjscript' | 'jjel';
export type CodeFlavor = 'jjel' | 'js';

/** Cycle/selection order used by the chip picker and the Cmd+J / Ctrl+. cycle. */
export const CONSOLE_MODES: ConsoleMode[] = ['jjodie', 'jjscript', 'jjel'];

/** Human-facing label per mode (chip + picker). */
export const CONSOLE_MODE_LABELS: Record<ConsoleMode, string> = {
    jjodie: 'Jjodie',
    jjscript: 'JjScript',
    jjel: 'JjEL',
};

/** Origin of a console mode switch — groundwork for the announced switch event. */
export type ConsoleModeSwitchVia = 'cmdj' | 'ctrl-dot' | 'pill' | 'slash' | 'backtick';

/** REPL-style entry produced when the console runs in Code mode. */
export interface CodeEntry {
    id: string;
    kind: 'code';
    flavor: CodeFlavor;
    input: string;
    output:
        | { ok: true; value: unknown }
        | { ok: false; error: string };
    timestamp: number;
    /**
     * Diagnostic warnings emitted during evaluation (e.g. references to
     * undefined identifiers). Always defined; absent when the source had no
     * issues. Independent of `output.ok` — a successful expression can carry
     * warnings, and a failure does not necessarily produce them.
     */
    warnings?: CodeWarning[];
    /** Raw JjEL value when ok, retained for the inline inspector. */
    rawValue?: unknown;
    /** The evaluation hit its deadline (R-JJD-9): the error text renders muted. */
    timedOut?: boolean;
}

/**
 * UI-side projection of a JjEL evaluator warning. Decoupled from
 * `JjelWarning` so the type used in chat history doesn't bleed jjel internals
 * into the Jodie types. Today they map 1:1.
 */
export interface CodeWarning {
    kind: 'undefined-identifier' | 'property-not-found' | 'ambiguous-instance';
    identifier: string;
    suggestion: string | null;
    /** ambiguous-instance only: number of pool instances sharing the name. */
    count?: number;
    /** ambiguous-instance only: a sample owning class name for the hint, or null. */
    sampleClass?: string | null;
    /**
     * ambiguous-instance only: the instances the name could have meant, when the
     * producer named them. Structural twin of jjel's `AmbiguousInstanceCandidate`,
     * restated rather than imported so this file keeps not depending on jjel.
     * Absent, not empty, when nobody was named.
     */
    candidates?: { id: string; className: string | null; path: string | null }[];
}

/** Anything that may appear in the unified Jjodie history. */
export type ConsoleEntry = ChatMessage | CodeEntry;

export function isCodeEntry(e: ConsoleEntry): e is CodeEntry {
    return (e as CodeEntry).kind === 'code';
}

export function isChatEntry(e: ConsoleEntry): e is ChatMessage {
    return (e as CodeEntry).kind !== 'code';
}

export interface ChatState {
    /** Unified history: chat messages and code REPL entries, sorted chronologically. */
    messages: ConsoleEntry[];
    isOpen: boolean;
    isMinimized: boolean;
    isWaiting: boolean;
    hasUnread: boolean;
}
