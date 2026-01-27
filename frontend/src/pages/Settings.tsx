import React, { useState } from 'react';
import { Try, R } from '../joiner';
import { Dashboard } from './components';
import { AIAssistantSettings, AppearanceSettings, AdvancedSettings } from './settings/index';
import './settings.scss';

type SettingsSection = 'ai-assistant' | 'appearance' | 'advanced';

const sections = [
    { id: 'ai-assistant' as const, label: 'AI Assistant', icon: 'bi-robot' },
    { id: 'appearance' as const, label: 'Appearance', icon: 'bi-palette' },
    { id: 'advanced' as const, label: 'Advanced', icon: 'bi-sliders' },
];

function SettingsContent() {
    const [activeSection, setActiveSection] = useState<SettingsSection>('ai-assistant');

    const renderContent = () => {
        switch (activeSection) {
            case 'ai-assistant':
                return <AIAssistantSettings />;
            case 'appearance':
                return <AppearanceSettings />;
            case 'advanced':
                return <AdvancedSettings />;
        }
    };

    const activeConfig = sections.find(s => s.id === activeSection)!;

    return (
        <div className="settings-page">
            {/* Page Header */}
            <div className="page-header">
                <i className="bi bi-gear page-header-icon" />
                <div className="page-header-text">
                    <h1>Settings</h1>
                    <p>Manage your preferences and configuration</p>
                </div>
            </div>

            <div className="settings-layout">
                {/* Sidebar Navigation */}
                <nav className="settings-sidebar">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <i className={`bi ${section.icon}`} />
                            <span>{section.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Content Area */}
                <div className="settings-content">
                    <div className="settings-section">
                        <div className="section-header">
                            <i className={`bi ${activeConfig.icon}`} />
                            <span>{activeConfig.label}</span>
                        </div>
                        <div className="section-content">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsPage(): JSX.Element {
    return (
        <Try>
            <Dashboard active={'Settings'} version={{ n: 0, date: 'fake-date' }}>
                <SettingsContent />
            </Dashboard>
        </Try>
    );
}

export { SettingsPage };
