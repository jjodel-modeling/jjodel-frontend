/**
 * #196 L6 lane 1: the provider GUI table against `AI[p]` of `types/jodie.ts`, compared by value for
 * every provider it defines. Lane 2 deleted `types/jodie.ts`: the values below are literals copied
 * from it on `f2beb5798` (the `addGUIinfo(...)` rows, the `keyUrl` of `new AI(...)`, the logo imports).
 */
import { describe, expect, it } from 'vitest';
import { PROVIDER_IDS } from '../../../services/ai';
import { PROVIDER_VISUALS, providerVisual } from '../providerVisuals';

import openaiLogo from '../../../assets/icons/providers/openai.svg';
import anthropicLogo from '../../../assets/icons/providers/anthropic.svg';
import deepseekLogo from '../../../assets/icons/providers/deepseek.svg';
import mistralLogo from '../../../assets/icons/providers/mistral.svg';
import geminiLogo from '../../../assets/icons/providers/gemini.svg';
import groqLogo from '../../../assets/icons/providers/groq.svg';
import kimiLogo from '../../../assets/icons/providers/kimi.svg';
import ollamaLogo from '../../../assets/icons/providers/ollama.svg';

/** `AI[p]` of types/jodie.ts: initial, key placeholder, colour, background, logo, key page. */
const TODAY: Record<string, [string, string, string, string, string | undefined, string]> = {
    Claude:   ['C',   'sk-ant-...',    '#D97706', '#FEF3C7', anthropicLogo, 'https://console.anthropic.com/settings/keys'],
    GPT:      ['GPT', 'sk-...',        '#059669', '#D1FAE5', openaiLogo,    'https://platform.openai.com/api-keys'],
    DeepSeek: ['D',   'sk-...',        '#2563EB', '#DBEAFE', deepseekLogo,  'https://platform.deepseek.com/api_keys'],
    Gemini:   ['Gm',  '',              '#7C3AED', '#EDE9FE', geminiLogo,    'https://aistudio.google.com/apikey'],
    Mistral:  ['M',   '',              '#ff7000', '#EDE9FE', mistralLogo,   'https://console.mistral.ai/api-keys'],
    Groq:     ['Gq',  'gsk_...',       '#EF4444', '#FEE2E2', groqLogo,      'https://console.groq.com/keys'],
    Ollama:   ['O',   '',              '#475569', '#F1F5F9', ollamaLogo,    ''],
    Llama:    ['L',   '',              '#8a6565', '#FEE2E2', undefined,     '?'],
    Copilot:  ['Cp',  '',              '#4ab409', '#FEE2E2', undefined,     '?'],
    Kimi:     ['K',   '',              '#0891B2', '#CFFAFE', kimiLogo,      'https://platform.moonshot.cn/console/api-keys'],
    Custom:   ['-',   'Enter api key', '#000',    '#fff',    undefined,     ''],
};

describe('PROVIDER_VISUALS', () => {
    it('has a row for every provider of today, parked ones included, and no other', () => {
        expect(Object.keys(PROVIDER_VISUALS).sort()).toEqual(Object.keys(TODAY).sort());
    });

    it('answers the GUI values AI[p] answered', () => {
        for (const [p, [initial, keyPlaceholder, color, bgColor, logo, keyUrl]] of Object.entries(TODAY)) {
            expect(providerVisual(p), p).toEqual({ initial, keyPlaceholder, color, bgColor, logo, keyUrl });
        }
        // Positive control: a logo is a resolved asset, not an empty import.
        expect(typeof anthropicLogo === 'string' && anthropicLogo.length > 0).toBe(true);
    });

    it('covers every registry provider', () => {
        for (const p of PROVIDER_IDS) expect(providerVisual(p), p).toBeDefined();
    });
});

describe('providerVisual', () => {
    it('answers undefined for no name, an unknown name and an inherited property', () => {
        expect(providerVisual(undefined)).toBeUndefined();
        expect(providerVisual(null)).toBeUndefined();
        expect(providerVisual('')).toBeUndefined();
        expect(providerVisual('Copilot2')).toBeUndefined();
        expect(providerVisual('toString')).toBeUndefined();
    });
});
