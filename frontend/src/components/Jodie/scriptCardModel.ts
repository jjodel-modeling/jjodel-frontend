/**
 * Script card model — what the collapsed script card (S2, R-JJD-2) shows, from the planner's plan.
 *
 * Pure: no store, no React, so the bench imports it. The counts come only from an `EffectsPlan`
 * (`planEffects` over `buildPlanWorld`), never from the script text; the text gives only the
 * card's name and its line count.
 */
import type { EffectsPlan, PlanIssue } from '../../jjscript/executor/effectsPlanner';

export interface ScriptCardChip {
    /** `+4 State`, `+2 outgoing`. */
    label: string;
    kind: 'create' | 'reference';
    count: number;
}

export type ScriptCardStatus =
    | { kind: 'planning' }
    | { kind: 'planned' }
    | { kind: 'applied' }
    | { kind: 'error'; line: number; message: string };

/**
 * A fenced block becomes a card where the old Run button showed: a multi-line block tagged
 * `jjscript` or `jjs`, or one that reads as JjScript. `looksLikeJjScript` is `isJjScriptCode`.
 */
export function isScriptCardBlock(language: string, code: string, looksLikeJjScript: (code: string) => boolean): boolean {
    if (!code.includes('\n')) return false;
    return language === 'jjscript' || language === 'jjs' || looksLikeJjScript(code);
}

/** The first `//` comment line, without the slashes; `script` when there is none. */
export function scriptCardName(code: string): string {
    for (const raw of code.split('\n')) {
        const line = raw.trim();
        if (!line.startsWith('//')) continue;
        const name = line.replace(/^\/\/+/, '').trim();
        if (name) return name;
    }
    return 'script';
}

export function scriptCardLineCount(code: string): number {
    return code.split('\n').length;
}

/**
 * One chip per created metaclass, then one per reference feature written (`=` and `+=` with a
 * target), each in the order the plan first meets it.
 */
export function scriptCardChips(plan: EffectsPlan): ScriptCardChip[] {
    const creates = new Map<string, number>();
    for (const c of plan.created) creates.set(c.metaclass, (creates.get(c.metaclass) ?? 0) + 1);
    const refs = new Map<string, number>();
    for (const r of plan.references) {
        if ((r.operator === '=' || r.operator === '+=') && r.target !== null) refs.set(r.feature, (refs.get(r.feature) ?? 0) + 1);
    }
    return [
        ...[...creates].map(([name, count]) => ({ label: `+${count} ${name}`, kind: 'create' as const, count })),
        ...[...refs].map(([name, count]) => ({ label: `+${count} ${name}`, kind: 'reference' as const, count })),
    ];
}

export function scriptCardStatus(plan: EffectsPlan | null, applied: boolean): ScriptCardStatus {
    if (applied) return { kind: 'applied' };
    if (!plan) return { kind: 'planning' };
    if (plan.error) return { kind: 'error', line: plan.error.line, message: plan.error.message };
    return { kind: 'planned' };
}

/** `2 warnings · line 3: …`; null when there is none. The card truncates it with an ellipsis. */
export function scriptCardWarningLine(warnings: readonly PlanIssue[]): string | null {
    if (warnings.length === 0) return null;
    const first = warnings[0];
    return `${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'} · line ${first.line}: ${first.message}`;
}

/** The follow-up `Fix warnings` sends Jjodie: the warnings, then the script they belong to. */
export function fixWarningsRequest(code: string, warnings: readonly PlanIssue[]): string {
    const list = warnings.map((w) => `- line ${w.line}: ${w.message}`).join('\n');
    return `The script below has ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'} when planned against the model:\n${list}\n\nPlease fix them and send the corrected script.\n\n\`\`\`jjscript\n${code}\n\`\`\``;
}
