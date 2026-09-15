/**
 * Settings Drawer Content
 * Settings content adapted for the drawer layout
 * Uses horizontal tabs instead of sidebar navigation
 */

import React, { useState } from 'react';
import { AIAssistantSettings, AppearanceSettings, AdvancedSettings } from '../../pages/settings/index';
import { PromptsSettingsSection } from '../settings/PromptsSettingsSection';

type SettingsSection = 'ai-assistant' | 'ai-prompts' | 'appearance' | 'advanced';

const sections = [
    { id: 'ai-assistant' as const, label: 'AI Assistant', icon: 'bi-robot' },
    { id: 'ai-prompts' as const, label: 'Prompts', icon: 'bi-chat-square-text' },
    { id: 'appearance' as const, label: 'Appearance', icon: 'bi-palette' },
    { id: 'advanced' as const, label: 'Advanced', icon: 'bi-sliders' },
];

export const SettingsDrawerContent: React.FC = () => {
    const [activeSection, setActiveSection] = useState<SettingsSection>('ai-assistant');

    const renderContent = () => {
        switch (activeSection) {
            case 'ai-assistant':
                return <AIAssistantSettings />;
            case 'ai-prompts':
                return <PromptsSettingsSection />;
            case 'appearance':
                return <AppearanceSettings />;
            case 'advanced':
                return <AdvancedSettings />;
        }
    };

    const activeConfig = sections.find(s => s.id === activeSection)!;

    return (
        <div className="drawer-settings-layout">
            {/* Horizontal Tabs */}
            <div className="drawer-settings-tabs">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        className={`drawer-tab ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(section.id)}
                    >
                        <i className={`bi ${section.icon}`} />
                        <span>{section.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="drawer-settings-content">
                <div className="drawer-section-title">
                    <i className={`bi ${activeConfig.icon}`} />
                    <span>{activeConfig.label}</span>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default SettingsDrawerContent;
