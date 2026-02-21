/**
 * AI Provider Icons
 *
 * Uses react-icons for OpenAI
 * Uses inline SVG for Claude, DeepSeek, Gemini, Mistral, Groq
 */

import React from 'react';
import { SiOpenai } from 'react-icons/si';

interface IconProps {
    size?: number;
    className?: string;
}

// OpenAI Icon (from react-icons)
export const OpenAIIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <SiOpenai size={size} className={className} />
);

// Claude/Anthropic Icon (custom SVG - stylized "C")
export const ClaudeIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5c-2.49 0-4.5-2.01-4.5-4.5s2.01-4.5 4.5-4.5c1.24 0 2.36.5 3.17 1.32l-1.28 1.28c-.49-.49-1.15-.77-1.89-.77-1.52 0-2.75 1.23-2.75 2.75s1.23 2.75 2.75 2.75c1.34 0 2.17-.78 2.4-1.87h-2.4v-1.75h4.28c.05.27.08.55.08.85 0 2.64-1.77 4.44-4.36 4.44z"/>
    </svg>
);

// Google Gemini Icon (custom SVG - sparkle/star shape)
export const GeminiIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M12 2L9.19 9.19 2 12l7.19 2.81L12 22l2.81-7.19L22 12l-7.19-2.81L12 2zm0 4.83l1.5 3.84 3.84 1.5-3.84 1.5-1.5 3.84-1.5-3.84-3.84-1.5 3.84-1.5L12 6.83z"/>
    </svg>
);

// DeepSeek Icon (custom SVG - stylized "D" wave)
export const DeepSeekIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-1.5-1.5L12 12l-3.5-3.5L10 7l5 5-5 5zm4 0v-2h4v2h-4z"/>
    </svg>
);

// Mistral Icon (custom SVG - geometric M shape based on official logo)
export const MistralIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <rect x="2" y="4" width="4" height="4" />
        <rect x="2" y="10" width="4" height="4" />
        <rect x="2" y="16" width="4" height="4" />
        <rect x="9" y="4" width="4" height="4" fillOpacity="0.6" />
        <rect x="9" y="10" width="4" height="4" />
        <rect x="9" y="16" width="4" height="4" fillOpacity="0.6" />
        <rect x="16" y="4" width="4" height="4" />
        <rect x="16" y="10" width="4" height="4" fillOpacity="0.6" />
        <rect x="16" y="16" width="4" height="4" />
    </svg>
);

// Groq Icon (custom SVG - stylized "G" bolt)
export const GroqIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v2.02c-2.83.48-5 2.94-5 5.91s2.17 5.43 5 5.91v2.02zm2-2.02c2.83-.48 5-2.94 5-5.91h-3v-2h3c0-2.97-2.17-5.43-5-5.91V2.07c3.94.49 7 3.85 7 7.93v4c0 4.08-3.06 7.44-7 7.93v-2.02z"/>
    </svg>
);

// Provider icon mapping
export const ProviderIcon: React.FC<{ provider: string } & IconProps> = ({
    provider,
    size = 18,
    className
}) => {
    switch (provider) {
        case 'openai':
            return <OpenAIIcon size={size} className={className} />;
        case 'claude':
            return <ClaudeIcon size={size} className={className} />;
        case 'gemini':
            return <GeminiIcon size={size} className={className} />;
        case 'deepseek':
            return <DeepSeekIcon size={size} className={className} />;
        case 'mistral':
            return <MistralIcon size={size} className={className} />;
        case 'groq':
            return <GroqIcon size={size} className={className} />;
        default:
            return <span className={className}>AI</span>;
    }
};

export default ProviderIcon;
