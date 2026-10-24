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

/** 1-based numbers of the lines of `edited` that are not in its common subsequence with `generated`. */
export function editedLines(generated: string, edited: string): number[] {
    if (generated === edited) return [];
    const a = splitLines(generated);
    const b = splitLines(edited);
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
    const out: number[] = [];
    let i = 0;
    let j = 0;
    while (j < m) {
        if (i < n && a[i] === b[j]) { i++; j++; continue; }
        if (i < n && lcs[i + 1][j] >= lcs[i][j + 1]) { i++; continue; }
        out.push(j + 1);
        j++;
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
