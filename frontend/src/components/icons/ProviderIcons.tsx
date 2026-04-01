/**
 * AI Provider Icons
 *
 * Uses bootstrap-icons 1.13.1 for Claude, OpenAI
 * Uses react-icons for Gemini
 * Uses inline SVG for Mistral, Groq, DeepSeek
 */

import React from 'react';
import { RiGeminiLine } from 'react-icons/ri';

interface IconProps {
    size?: number;
    className?: string;
}

// OpenAI Icon (bootstrap-icons 1.13.1)
export const OpenAIIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <i className={`bi bi-openai ${className || ''}`} style={{ fontSize: size }} />
);

// Claude/Anthropic Icon (bootstrap-icons 1.13.1)
export const ClaudeIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <i className={`bi bi-claude ${className || ''}`} style={{ fontSize: size }} />
);

// Google Gemini Icon (react-icons)
export const GeminiIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <RiGeminiLine size={size} className={className} />
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

// Groq Icon (custom SVG - based on official logo)
export const GroqIcon: React.FC<IconProps> = ({ size = 18, className }) => (
    <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect width="100" height="100" rx="16" fill="#F55036"/>
        <path d="M 67 32 A 24 24 0 1 0 67 68 L 67 54
                 A 10 10 0 1 1 57 40 L 67 40 Z"
              fill="white"/>
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
