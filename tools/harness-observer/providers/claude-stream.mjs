/** Historical Claude stream adapter. Pure: no I/O and no operational imports. */
export const provider = 'claude';
export const inputKeys = ['input', 'cacheRead', 'cacheCreation'];
const rawKeys = ['input_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens', 'output_tokens'];
const cliKeys = ['inputTokens', 'cacheReadInputTokens', 'cacheCreationInputTokens', 'outputTokens'];

/** Preserve the original numeric fields, including invalid/missing values. */
export function counters(raw, cli = false) {
    const names = cli ? cliKeys : rawKeys;
    return Object.fromEntries(['input', 'cacheRead', 'cacheCreation', 'output'].map((k, i) => [k,
        Object.hasOwn(raw || {}, names[i]) ? raw[names[i]] : null]));
}

/** Normalize only allowlisted metadata; never return message/tool/command bodies. */
export function normalizeEvent(e, source) {
    if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
    const base = { provider, source, sessionId: typeof e.session_id === 'string' ? e.session_id : null };
    if (e.type === 'system' && e.subtype === 'init') return { ...base, kind: 'init', model: e.model || null };
    if (e.type === 'system' && e.subtype === 'compact_boundary') {
        return { ...base, kind: 'compaction', trigger: e.compact_metadata?.trigger || null };
    }
    const m = e.message;
    if (e.type === 'assistant' && m && typeof m === 'object') {
        const lines = Array.isArray(m.content) ? m.content.flatMap(b => b?.type === 'text' && typeof b.text === 'string'
            ? b.text.split('\n').map(t => t.trim()).filter(t => /^Outcome:\s*(done|hard-stop|question|blocked)\s*$/.test(t)) : []) : [];
        return { ...base, kind: 'message', messageId: typeof m.id === 'string' ? m.id : null,
            model: m.model || null, synthetic: m.model === '<synthetic>',
            agent: typeof e.parent_tool_use_id === 'string' ? e.parent_tool_use_id : null,
            sidechain: e.isSidechain === true,
            usage: m.usage && typeof m.usage === 'object' ? counters(m.usage) : null,
            original: m.usage ? Object.fromEntries(rawKeys.filter(k => Object.hasOwn(m.usage, k)).map(k => [k, m.usage[k]])) : null,
            outcome: lines.at(-1)?.split(':')[1].trim() || null };
    }
    if (e.type === 'result') {
        const models = e.modelUsage && typeof e.modelUsage === 'object' && !Array.isArray(e.modelUsage)
            ? Object.entries(e.modelUsage).map(([model, raw]) => ({ model, usage: counters(raw, true),
                original: Object.fromEntries(cliKeys.filter(k => Object.hasOwn(raw || {}, k)).map(k => [k, raw[k]])) })) : null;
        return { ...base, kind: 'result', models, invocationUsage: e.usage ? counters(e.usage) : null,
            originalInvocationUsage: e.usage ? Object.fromEntries(rawKeys.filter(k => Object.hasOwn(e.usage, k)).map(k => [k, e.usage[k]])) : null,
            costCLI: typeof e.total_cost_usd === 'number' && Number.isFinite(e.total_cost_usd) ? e.total_cost_usd : null,
            isError: typeof e.is_error === 'boolean' ? e.is_error : null,
            notification: e.origin?.kind === 'task-notification', durationMs: Number.isSafeInteger(e.duration_ms) ? e.duration_ms : null };
    }
    if (e.type === 'system' && e.subtype === 'direct') return { ...base, kind: 'direct', promptId: e.prompt_id || null };
    return null;
}
