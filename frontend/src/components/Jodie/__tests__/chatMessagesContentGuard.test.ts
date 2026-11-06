import { describe, expect, it, vi } from 'vitest';

// ChatMessages.tsx reaches monaco through these imports, and monaco needs `window`: the bench stubs
// them, since the two functions under test use none of them.
vi.mock('../../../joiner', () => ({ RuntimeAccessible: () => (target: unknown) => target }));
vi.mock('../../../jjscript', () => ({ JjScriptService: {}, isJjScriptCode: () => false }));
vi.mock('../../../jjel/evaluator/context', () => ({ formatAmbiguousCandidates: () => '' }));
vi.mock('../../../redux/selectors/selectors', () => ({ Selectors: {} }));
vi.mock('../../../joiner/environmentConfig', () => ({ findProfile: () => undefined }));
vi.mock('../../environment/consumerMode', () => ({ activeProfileId: () => null, isConsumerMode: () => false }));
vi.mock('../../icons', () => ({ ProviderIcon: () => null }));
vi.mock('../MarkdownMessage', () => ({ MarkdownMessage: () => null }));
vi.mock('../JjelValueInspector', () => ({ JjelValueInspector: () => null, detectKind: () => null }));
vi.mock('../ScriptCard', () => ({ ScriptCardContext: { Provider: () => null } }));
vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => undefined });

const { extractFirstCodeBlock, hasScriptCardBlock } = await import('../ChatMessages');

// P-2026-10-30-1215: a message whose content is not a string (a provider reply without text) reached
// `text.match` / `text.matchAll` during render and took the panel down to the Try fallback.
describe('ChatMessages content guard', () => {
    it.each([undefined, null])('a %s content yields no code block and no script card', content => {
        expect(() => extractFirstCodeBlock(content)).not.toThrow();
        expect(extractFirstCodeBlock(content)).toBeNull();
        expect(hasScriptCardBlock(content)).toBe(false);
    });

    it('control: a string content still yields its first fenced block', () => {
        expect(extractFirstCodeBlock('see\n```jjscript\ncreate class A\n```\n')).toEqual({ language: 'jjscript', content: 'create class A' });
    });
});
