import { describe, expect, it } from 'vitest';
import {
    CONSUMER_INPUT_PLACEHOLDER,
    CONSUMER_NO_SCOPE,
    CONSUMER_PROVIDER_INVITE,
    consumerFocusLabel,
    consumerGreeting,
    consumerHelpText,
    consumerSlashCommand,
} from '../consumerVoice';

// #168 lane D (J7). The words Jodie says to the consumer of a stand-alone environment. The issue's
// rule: no M1, M2, metaclass, instance, JjScript or JjEL on screen; «metamodel» joins them, it is
// the developer's word for what the consumer never sees.
const JARGON = /\b(M1|M2|meta-?class(es)?|instances?|JjScript|JjEL|meta-?models?|metamodeling)\b/i;

function everyText(): string[] {
    const g = consumerGreeting('Probe_168_A', 'Edu');
    return [
        consumerFocusLabel({ typeName: 'Scenario', instanceName: 'Arco_0' })!.text,
        consumerFocusLabel({ typeName: 'Scenario', instanceName: 'Arco_0' })!.title,
        g.title, g.intro, g.hint, ...g.items.map((i) => i.text),
        consumerHelpText(),
        CONSUMER_INPUT_PLACEHOLDER, CONSUMER_PROVIDER_INVITE.text, CONSUMER_PROVIDER_INVITE.action, CONSUMER_NO_SCOPE,
    ];
}

describe('consumerFocusLabel', () => {
    it('names the type and the element in focus, in the words of the chat line', () => {
        expect(consumerFocusLabel({ typeName: 'Scenario', instanceName: 'Arco_0' }))
            .toEqual({ text: 'Scenario «Arco_0»', title: 'Jjodie is looking at Scenario «Arco_0»' });
    });
    it('names only the type when no element is selected', () => {
        expect(consumerFocusLabel({ typeName: 'Learner', instanceName: null }))
            .toEqual({ text: 'Learner', title: 'Jjodie is looking at Learner' });
    });
    it('shows nothing without a selection', () => {
        expect(consumerFocusLabel(null)).toBeNull();
        expect(consumerFocusLabel(undefined)).toBeNull();
        expect(consumerFocusLabel({ typeName: '', instanceName: 'x' })).toBeNull();
    });
});

describe('consumerGreeting', () => {
    it('names the project and the profile', () => {
        expect(consumerGreeting('Probe_168_A', 'Edu').intro).toBe("I'm your assistant for Probe_168_A (profile Edu). Ask me to:");
    });
    it('names the project alone when the profile has no name', () => {
        expect(consumerGreeting('Probe_168_A', '').intro).toBe("I'm your assistant for Probe_168_A. Ask me to:");
        expect(consumerGreeting('Probe_168_A', null).intro).toBe("I'm your assistant for Probe_168_A. Ask me to:");
    });
    it('falls back to «this project» without a project name', () => {
        expect(consumerGreeting(undefined, 'Edu').intro).toBe("I'm your assistant for this project (profile Edu). Ask me to:");
        expect(consumerGreeting('  ', '  ').intro).toBe("I'm your assistant for this project. Ask me to:");
    });
    it('lists what can be asked, with Bootstrap icons, and points to /help', () => {
        const g = consumerGreeting('P', 'R');
        expect(g.title).toBe("Hi, I'm Jjodie!");
        expect(g.items).toHaveLength(4);
        expect(g.items.every((i) => /^bi-[a-z0-9-]+$/.test(i.icon))).toBe(true);
        expect(g.hint).toContain('/help');
    });
});

describe('consumerHelpText', () => {
    it('describes what can be asked and the two commands that remain, not the modes', () => {
        const help = consumerHelpText();
        expect(help).toContain('`/help`');
        expect(help).toContain('`/clear`');
        expect(help).not.toMatch(/\/js|\/jjel|\/ask|Cmd|Ctrl|mode/i);
    });
});

describe('consumerSlashCommand', () => {
    it.each([
        ['/clear', 'clear'],
        ['/help', 'help'],
        ['/js', 'unknown'],
        ['/jjel', 'unknown'],
        ['/ask', 'unknown'],
        ['/foo', 'unknown'],
        ['/HELP', 'unknown'],
        ['create class X', null],
        ['what is a Scenario?', null],
    ] as const)('%s → %s', (input, expected) => {
        expect(consumerSlashCommand(input)).toBe(expected);
    });
});

describe('the consumer reads no jargon', () => {
    it('positive control: the regex catches the developer texts it must catch', () => {
        expect("Your metamodeling assistant. I can help you with:").toMatch(JARGON);
        expect('M2 · ScenarioMM').toMatch(JARGON);
        expect('- **JjScript** — every line runs as a JjScript command against the model.').toMatch(JARGON);
        expect('Jjodie answered with no metamodel or model in focus').toMatch(JARGON);
        expect('Create metaclasses').toMatch(JARGON);
    });
    it('no text of this module matches it', () => {
        for (const t of everyText()) expect(t).not.toMatch(JARGON);
    });
});
