/**
 * consumerVoice — #168 lane D (J7): what Jodie says to the consumer of a stand-alone environment
 * (`?profile=`, see `environment/consumerMode.ts`). The consumer is not a developer: no console
 * modes, no M1/M2, no metaclass, instance, JjScript or JjEL on screen. The components ask
 * `isConsumerMode()` and take their words from here; the developer's texts stay where they are.
 *
 * Zero imports on purpose, so the `node` bench loads it (the Jodie components reach `joiner`, which
 * does not import there: `window is not defined`, CLAUDE.md §5).
 */

/**
 * The header's focus, in the words of the chat line (`selectionNotice` of
 * `consumerJodieContext.ts`): the type and the element in focus, only the type when no element is
 * selected, nothing without a selection.
 */
export function consumerFocusLabel(
    described: { typeName: string; instanceName: string | null } | null | undefined,
): { text: string; title: string } | null {
    if (!described?.typeName) return null;
    const text = described.instanceName ? `${described.typeName} «${described.instanceName}»` : described.typeName;
    return { text, title: `Jjodie is looking at ${text}` };
}

export interface ConsumerGreeting {
    title: string;
    intro: string;
    items: Array<{ icon: string; text: string }>;
    hint: string;
}

const CONSUMER_GREETING_ITEMS: ConsumerGreeting['items'] = [
    { icon: 'bi-search', text: 'Explain what you are looking at' },
    { icon: 'bi-pencil-square', text: 'Create, fill in or link elements, with your confirmation' },
    { icon: 'bi-check2-circle', text: 'Find what is missing or does not fit' },
    { icon: 'bi-lightbulb', text: 'Suggest what to add next' },
];

/**
 * The empty-chat welcome. The environment has no name of its own (a project and a profile, D2 of
 * #157), so the greeting names both; without the profile's name it names the project only.
 */
export function consumerGreeting(projectName?: string | null, profileName?: string | null): ConsumerGreeting {
    const project = projectName?.trim() || 'this project';
    const profile = profileName?.trim();
    return {
        title: "Hi, I'm Jjodie!",
        intro: `I'm your assistant for ${project}${profile ? ` (profile ${profile})` : ''}. Ask me to:`,
        items: CONSUMER_GREETING_ITEMS,
        hint: 'Type /help to see what you can ask.',
    };
}

/** `/help` for the consumer: what can be asked, and the two commands that remain. */
export function consumerHelpText(): string {
    return [
        '**What you can ask Jjodie**',
        '',
        '- **Explain** — what you are looking at, what its fields mean, how it is linked to the rest.',
        '- **Change** — create, fill in or link elements. Nothing changes until you confirm.',
        '- **Check** — what is missing or does not fit.',
        '',
        'Jjodie follows what you select in the Configurator.',
        '',
        '**Commands:** `/help` shows this message · `/clear` clears the chat.',
    ].join('\n');
}

/**
 * A typed line in the consumer's chat: `/clear` and `/help` are commands, any other `/…` is an
 * unknown command (no mode switch, no call to the AI), anything else is a message (null).
 */
export function consumerSlashCommand(trimmed: string): 'clear' | 'help' | 'unknown' | null {
    if (!trimmed.startsWith('/')) return null;
    if (trimmed === '/clear') return 'clear';
    if (trimmed === '/help') return 'help';
    return 'unknown';
}

/** The input's placeholder, where the developer reads the `jjodie>` prompt. */
export const CONSUMER_INPUT_PLACEHOLDER = 'Ask a question or describe a change';

/** The invitation shown in the empty chat when no AI provider is configured (D1: the key is yours). */
export const CONSUMER_PROVIDER_INVITE = {
    text: 'Jjodie answers through an AI provider of your choice, with your own key.',
    action: 'Set up an AI provider',
};

/** A change proposed with nothing in focus: there is no part of the project to apply it to. */
export const CONSUMER_NO_SCOPE = 'Select an element in the Configurator, then ask again.';
