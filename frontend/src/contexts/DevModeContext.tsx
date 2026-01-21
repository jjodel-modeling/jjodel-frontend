import React, { createContext, useContext, useState, useEffect } from 'react';

// Component lock status - update this when /lock or /unlock is used
const componentLockStatus: Record<string, boolean> = {
  // TIER 1
  'T1.1': true,  // Design Token System
  'T1.2': true,  // Notification Widget
  'T1.3': true,  // Authentication Page
  'T1.4': true,  // Registration Page
  'T1.5': true,  // Password Recovery Page

  // TIER 2
  'T2.1': false, // Empty Dashboard
  'T2.2': true,  // Create Project Dialog
  'T2.3': false, // Sidebar

  // TIER 3
  'T3.1': true,  // Project Cards
  'T3.2': true,  // Project Grid

  // TIER 4
  'T4.1': false, // Form Controls
  'T4.2': false, // Main Menu
  'T4.3': false, // Dialogs & Modals
  'T4.4': false, // Right Panel Tabs
  'T4.5': false, // Editor Components
};

// Component ID to readable name mapping
const componentNames: Record<string, string> = {
  'T1.1': 'Design Token System',
  'T1.2': 'Notification Widget',
  'T1.3': 'Authentication Page',
  'T1.4': 'Registration Page',
  'T1.5': 'Password Recovery Page',
  'T2.1': 'Empty Dashboard',
  'T2.2': 'Create Project Dialog',
  'T2.3': 'Sidebar',
  'T3.1': 'Project Cards',
  'T3.2': 'Project Grid',
  'T4.1': 'Form Controls',
  'T4.2': 'Main Menu',
  'T4.3': 'Dialogs & Modals',
  'T4.4': 'Right Panel Tabs',
  'T4.5': 'Editor Components',
};

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
  isComponentLocked: (componentId: string) => boolean;
  getComponentName: (componentId: string) => string;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

export const DevModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDevMode, setIsDevMode] = useState(false);

  // Keyboard shortcut: Ctrl+Shift+D (or Cmd+Shift+D on Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsDevMode(prev => {
          const newState = !prev;
          console.log(`Dev Mode: ${newState ? 'ON' : 'OFF'}`);
          return newState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isComponentLocked = (componentId: string): boolean => {
    return componentLockStatus[componentId] ?? false;
  };

  const getComponentName = (componentId: string): string => {
    return componentNames[componentId] ?? componentId;
  };

  const toggleDevMode = () => {
    setIsDevMode(prev => !prev);
  };

  return (
    <DevModeContext.Provider
      value={{
        isDevMode,
        toggleDevMode,
        isComponentLocked,
        getComponentName
      }}
    >
      {children}
    </DevModeContext.Provider>
  );
};

export const useDevMode = () => {
  const context = useContext(DevModeContext);
  if (!context) {
    throw new Error('useDevMode must be used within DevModeProvider');
  }
  return context;
};
