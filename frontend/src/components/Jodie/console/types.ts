/**
 * Console language registry — shared types.
 *
 * Step 1 of the console v1 refactor (behavior-preserving). Defines the minimal
 * provider abstraction the console uses to route input: a LanguageProvider
 * turns an input string into ConsoleEntry items appended to the unified Jjodie
 * history. The current routing decision (JjScript vs Jjodie in chat, JjEL in
 * code) is unchanged; only its plumbing moves behind this interface. The mode
 * defaulting, auto-switch and detection semantics arrive in later steps.
 */
import type {
    ChatImage,
    ChatDocument,
    ChatMessage,
    CodeFlavor,
    ConsoleEntry,
    TAIProvider,
} from '../../../types/jodie';

/** Result of running a provider: the entries to append to the history. */
export interface ConsoleResult {
    entries: ConsoleEntry[];
}

/**
 * Handle to the console state/services a provider needs to produce its result.
 * The Jodie handler populates the fields relevant to the provider it invokes;
 * each provider reads only its own subset (documented per field). Fields other
 * than `makeId` are optional so a handler can build a minimal context for a
 * provider that does not need them (e.g. the code-mode handler for jjel).
 */
export interface ConsoleContext {
    /** Unique entry id generator (mirrors Jodie's generateMessageId). Always provided. */
    makeId: () => string;
    /** Code-mode flavor. Required by the jjel provider. */
    codeFlavor?: CodeFlavor;
    /** Resolved LLM provider after the handler's auto-switch. Required by the jjodie provider. */
    activeProvider?: TAIProvider;
    /** Chat-only history passed to the LLM. Used by the jjodie provider. */
    history?: ChatMessage[];
    /** Structural project context string. Used by the jjodie provider. */
    projectContext?: string;
    /** Whether the RAG service is initialized. Used by the jjodie provider. */
    ragInitialized?: boolean;
    /** Attached images for vision-capable providers. Used by the jjodie provider. */
    images?: ChatImage[];
    /** Attached documents (PDF). Used by the jjodie provider. */
    documents?: ChatDocument[];
}

/** Stable identifiers of the three built-in console providers. */
export type LanguageProviderId = 'jjodie' | 'jjscript' | 'jjel';

/**
 * A console language: given an input string and a context, produces the entries
 * to append to the unified history. The interface is intentionally minimal for
 * this step (no sigil/parse/actions — those arrive with the mode redesign).
 */
export interface LanguageProvider {
    id: LanguageProviderId;
    displayName: string;
    run(input: string, ctx: ConsoleContext): Promise<ConsoleResult>;
    /**
     * Optional strict detector: returns true iff `input` parses completely as
     * this language. Used in Jjodie mode to OFFER execution (not run silently)
     * instead of routing the input to the LLM. A provider without `detect` does
     * not participate in detection.
     */
    detect?(input: string): boolean;
}
