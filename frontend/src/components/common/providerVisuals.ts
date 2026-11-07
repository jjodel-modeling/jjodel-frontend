/**
 * The GUI data of each AI provider (#196 L6, R-AI-23): avatar initial and colours, logo, API-key
 * placeholder and the page where a key is obtained. `src/services/ai` carries no UI, so these rows
 * live here; they are the `addGUIinfo(...)` rows and the key pages of `new AI(...)` of
 * `types/jodie.ts`, copied verbatim. Llama and Copilot are parked (no route, not in the settings)
 * but keep their row: a stored chat message may still name them.
 */
import type { ProviderId } from '../../services/ai';

import openaiLogo from '../../assets/icons/providers/openai.svg';
import anthropicLogo from '../../assets/icons/providers/anthropic.svg';
import deepseekLogo from '../../assets/icons/providers/deepseek.svg';
import mistralLogo from '../../assets/icons/providers/mistral.svg';
import geminiLogo from '../../assets/icons/providers/gemini.svg';
import groqLogo from '../../assets/icons/providers/groq.svg';
import kimiLogo from '../../assets/icons/providers/kimi.svg';
import ollamaLogo from '../../assets/icons/providers/ollama.svg';

export interface ProviderVisual {
    /** Shown in the avatar tile when there is no logo. */
    initial: string;
    keyPlaceholder: string;
    color: string;
    bgColor: string;
    logo?: string;
    /** Where the user gets an API key; empty for local and custom providers. */
    keyUrl: string;
}

export type VisualProviderId = ProviderId | 'Llama' | 'Copilot';

function row(initial: string, keyPlaceholder: string, color: string, bgColor: string, logo: string | undefined, keyUrl: string): ProviderVisual {
    return { initial, keyPlaceholder, color, bgColor, logo, keyUrl };
}

export const PROVIDER_VISUALS: Readonly<Record<VisualProviderId, ProviderVisual>> = {
    GPT:      row('GPT','sk-...',      '#059669', '#D1FAE5', openaiLogo,    'https://platform.openai.com/api-keys'),
    Claude:   row('C',  'sk-ant-...',  '#D97706', '#FEF3C7', anthropicLogo, 'https://console.anthropic.com/settings/keys'),
    Mistral:  row('M',  '',            '#ff7000', '#EDE9FE', mistralLogo,   'https://console.mistral.ai/api-keys'),
    Gemini:   row('Gm', '',            '#7C3AED', '#EDE9FE', geminiLogo,    'https://aistudio.google.com/apikey'),
    DeepSeek: row('D',  'sk-...',      '#2563EB', '#DBEAFE', deepseekLogo,  'https://platform.deepseek.com/api_keys'),
    Groq:     row('Gq', 'gsk_...',     '#EF4444', '#FEE2E2', groqLogo,      'https://console.groq.com/keys'),
    Kimi:     row('K',  '',            '#0891B2', '#CFFAFE', kimiLogo,      'https://platform.moonshot.cn/console/api-keys'),
    Ollama:   row('O',  '',            '#475569', '#F1F5F9', ollamaLogo,    ''),
    Llama:    row('L',  '',            '#8a6565', '#FEE2E2', undefined,     '?'),
    Copilot:  row('Cp', '',            '#4ab409', '#FEE2E2', undefined,     '?'),
    Custom:   row('-', 'Enter api key','#000',    '#fff',    undefined,     ''),
};

/** The row of `id`, or undefined for a name with none (as `AI[id]` was for an unknown provider). */
export function providerVisual(id: string | undefined | null): ProviderVisual | undefined {
    return id && Object.prototype.hasOwnProperty.call(PROVIDER_VISUALS, id) ? PROVIDER_VISUALS[id as VisualProviderId] : undefined;
}
