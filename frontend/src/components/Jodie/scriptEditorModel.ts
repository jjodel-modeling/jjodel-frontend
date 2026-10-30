/**
 * Script editor model — the pure side of the Jjodie script editor (S5, R-JJD-2).
 *
 * `editedLines` compares the edited text with the generated one line by line (a longest common
 * subsequence, no dependency) and returns the edited lines that are not in it: the lines that get
 * the green margin bar. The editor store holds the one script open in the editor and the edited
 * text of every card in this session, so that a card reopened in the editor shows its edits and
 * reads `applied` when its edited text is the one applied. Outside Redux on purpose, as the
 * preview store: an edit in progress is not model data.
 */

function splitLines(text: string): string[] {
    return text.split(/\r?\n/);
}

export interface LineDiffRow {
    kind: 'same' | 'added' | 'removed';
    text: string;
}

/**
 * `before` against `after` line by line, over their longest common subsequence: the common lines
 * as `same`, the lines of `after` outside it as `added`, those of `before` as `removed`.
 */
export function lineDiff(before: string, after: string): LineDiffRow[] {
    const a = splitLines(before);
    const b = splitLines(after);
    const n = a.length;
    const m = b.length;
    // lcs[i][j]: length of the common subsequence of a[i..] and b[j..].
    const lcs: Uint32Array[] = [];
    for (let i = 0; i <= n; i++) lcs.push(new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
        }
    }
    const out: LineDiffRow[] = [];
    let i = 0;
    let j = 0;
    while (j < m) {
        if (i < n && a[i] === b[j]) { out.push({ kind: 'same', text: b[j] }); i++; j++; continue; }
        if (i < n && lcs[i + 1][j] >= lcs[i][j + 1]) { out.push({ kind: 'removed', text: a[i] }); i++; continue; }
        out.push({ kind: 'added', text: b[j] });
        j++;
    }
    for (; i < n; i++) out.push({ kind: 'removed', text: a[i] });
    return out;
}

/** 1-based numbers of the lines of `edited` that are not in its common subsequence with `generated`. */
export function editedLines(generated: string, edited: string): number[] {
    if (generated === edited) return [];
    const out: number[] = [];
    let line = 0;
    for (const row of lineDiff(generated, edited)) {
        if (row.kind === 'removed') continue;
        line++;
        if (row.kind === 'added') out.push(line);
    }
    return out;
}

/** The follow-up message `Ask Jjodie to review` sends. */
export function reviewRequest(edited: string): string {
    return `I edited the script you generated. Please review my version against the model and send the corrected script if anything is wrong.\n\n\`\`\`jjscript\n${edited}\n\`\`\``;
}

// ── The editor store ──────────────────────────────────────────────────────────

export interface ScriptEditorTarget {
    /** The card's key: message, model and generated text. */
    key: string;
    /** The script as Jjodie generated it. */
    generated: string;
    modelId: string;
    name: string;
    /** Send Jjodie a follow-up message (the chat's one-shot ask). */
    onFollowUp?: (input: string) => void;
    /** The card's message id: links a `Save as file` to the card (S6c). */
    messageId?: string;
    /** Set when the view is the `Update file` diff of the card (S6c), not its editor. */
    update?: { scriptId: string; script: string };
}

let target: ScriptEditorTarget | null = null;
const edits = new Map<string, string>();
let version = 0;
const listeners = new Set<() => void>();

function emit(): void {
    version++;
    for (const l of [...listeners]) l();
}

export function subscribeScriptEditor(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

export function getScriptEditorTarget(): ScriptEditorTarget | null {
    return target;
}

/** Changes on every open, close and edit: a snapshot for `useSyncExternalStore`. */
export function getScriptEditorVersion(): number {
    return version;
}

export function openScriptEditor(next: ScriptEditorTarget): void {
    target = next;
    emit();
}

export function closeScriptEditor(): void {
    if (!target) return;
    target = null;
    emit();
}

/** The edited text of the card `key`, or its generated text when it was never edited. */
export function editedScript(key: string, generated: string): string {
    return edits.get(key) ?? generated;
}

export function setEditedScript(key: string, generated: string, text: string): void {
    const before = edits.get(key);
    if (text === generated) edits.delete(key);
    else edits.set(key, text);
    if (before !== edits.get(key)) emit();
}

// ── Cards linked to script files (S6c) ────────────────────────────────────────

export interface ScriptFileLink {
    scriptId: string;
    /** The card's script name (its first comment) when it was linked. */
    name: string;
    messageId: string;
    /** The card stored the file (`Open as file`, `Save as file`), not a later update of it. */
    origin: boolean;
}

export interface ScriptFileUpdateInput {
    /** The file's current text, on the left: the user's own edits, not the old generated text. */
    original: string;
    modified: string;
    added: number;
    removed: number;
}

/**
 * The diff of `Update file`: the file as it is now against the new script. Undefined when the
 * file is gone.
 */
export function fileUpdateInput(fileText: string | undefined, script: string): ScriptFileUpdateInput | undefined {
    if (fileText === undefined) return undefined;
    let added = 0;
    let removed = 0;
    if (fileText !== script) {
        for (const row of lineDiff(fileText, script)) {
            if (row.kind === 'added') added++;
            else if (row.kind === 'removed') removed++;
        }
    }
    return { original: fileText, modified: script, added, removed };
}

/**
 * Which file a later Jjodie answer targets, for the conversation of one session. A card is linked
 * when its script is opened or saved as a file. A card of a later message targets the file of the
 * newest earlier card linked under the same name, or the file whose card asked the follow-up this
 * message answers (Fix warnings, Ask Jjodie to review). Messages are ordered as their cards first
 * resolve, which is the chat's order. Outside the project on purpose: nothing here is persisted.
 */
export class ScriptFileLinks {
    private readonly links = new Map<string, ScriptFileLink>();
    private readonly order = new Map<string, number>();
    private readonly answers = new Map<string, string>();
    private pending: { scriptId: string; known: Set<string> } | null = null;

    /** Register `messageId` in the chat's order; the first new message after a follow-up answers it. */
    see(messageId: string): void {
        if (this.order.has(messageId)) return;
        if (this.pending && !this.pending.known.has(messageId)) {
            this.answers.set(messageId, this.pending.scriptId);
            this.pending = null;
        }
        this.order.set(messageId, this.order.size);
    }

    /** `origin` false: the card's script was accepted into the file, which it keeps targeting. */
    link(cardKey: string, messageId: string, name: string, scriptId: string, origin = true): void {
        this.see(messageId);
        this.links.set(cardKey, { scriptId, name, messageId, origin });
    }

    linkOf(cardKey: string): ScriptFileLink | undefined {
        return this.links.get(cardKey);
    }

    /** A follow-up was sent from a card on file `scriptId`: the next new message answers it. */
    followUp(scriptId: string): void {
        this.pending = { scriptId, known: new Set(this.order.keys()) };
    }

    /** The file a card of `messageId` named `name` updates, undefined when none or when the card stored it. */
    targetOf(cardKey: string, messageId: string, name: string): string | undefined {
        this.see(messageId);
        const own = this.links.get(cardKey);
        if (own) return own.origin ? undefined : own.scriptId;
        const answered = this.answers.get(messageId);
        if (answered) return answered;
        const at = this.order.get(messageId)!;
        let best: ScriptFileLink | undefined;
        for (const l of this.links.values()) {
            if (l.name !== name || l.messageId === messageId) continue;
            const lat = this.order.get(l.messageId)!;
            if (lat >= at) continue;
            if (!best || lat >= this.order.get(best.messageId)!) best = l;
        }
        return best?.scriptId;
    }

    /** The file of a card: its own link, else the file it targets. */
    fileOf(cardKey: string, messageId: string, name: string): string | undefined {
        return this.links.get(cardKey)?.scriptId ?? this.targetOf(cardKey, messageId, name);
    }
}

const fileLinks = new ScriptFileLinks();

export function linkScriptFile(cardKey: string, messageId: string | undefined, name: string, scriptId: string, origin = true): void {
    if (!messageId) return;
    fileLinks.link(cardKey, messageId, name, scriptId, origin);
    emit();
}

export function scriptFileTarget(cardKey: string, messageId: string, name: string): string | undefined {
    return fileLinks.targetOf(cardKey, messageId, name);
}

/** Before a follow-up from a card: when the card is on a file, the answer targets that file. */
export function noteScriptFollowUp(cardKey: string, messageId: string | undefined, name: string): void {
    if (!messageId) return;
    const scriptId = fileLinks.fileOf(cardKey, messageId, name);
    if (scriptId) fileLinks.followUp(scriptId);
}
