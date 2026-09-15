/**
 * useAdvancedSections Hook
 *
 * Manages the expand/collapse state of advanced sections in the UI.
 * Used in Advanced Mode to provide progressive disclosure of features.
 *
 * Persists section states to localStorage.
 */

import { useState, useEffect, useCallback } from 'react';

export interface AdvancedSections {
    viewpoints: boolean;
    advancedProperties: boolean;
    ocl: boolean;
    styling: boolean;
    events: boolean;
    debugging: boolean;
    state: boolean;
    node: boolean;
    customFeatures: boolean;
}

const STORAGE_KEY = 'jjodel_advanced_sections';

const DEFAULT_SECTIONS: AdvancedSections = {
    viewpoints: false,
    advancedProperties: false,
    ocl: false,
    styling: false,
    events: false,
    debugging: false,
    state: false,
    node: false,
    customFeatures: false
};

/**
 * Get sections state from localStorage
 */
export function getAdvancedSections(): AdvancedSections {
    if (typeof window === 'undefined') return DEFAULT_SECTIONS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return { ...DEFAULT_SECTIONS, ...JSON.parse(stored) };
        } catch {
            return DEFAULT_SECTIONS;
        }
    }
    return DEFAULT_SECTIONS;
}

/**
 * React hook for managing advanced section expand/collapse states
 */
export function useAdvancedSections() {
    const [sections, setSections] = useState<AdvancedSections>(getAdvancedSections);

    // Save to localStorage when sections change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    }, [sections]);

    // Toggle a specific section
    const toggleSection = useCallback((key: keyof AdvancedSections) => {
        setSections(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    }, []);

    // Set a specific section state
    const setSection = useCallback((key: keyof AdvancedSections, expanded: boolean) => {
        setSections(prev => ({
            ...prev,
            [key]: expanded
        }));
    }, []);

    // Expand all sections
    const expandAll = useCallback(() => {
        setSections({
            viewpoints: true,
            advancedProperties: true,
            ocl: true,
            styling: true,
            events: true,
            debugging: true,
            state: true,
            node: true,
            customFeatures: true
        });
    }, []);

    // Collapse all sections
    const collapseAll = useCallback(() => {
        setSections(DEFAULT_SECTIONS);
    }, []);

    // Check if a section is expanded
    const isExpanded = useCallback((key: keyof AdvancedSections) => {
        return sections[key];
    }, [sections]);

    return {
        sections,
        toggleSection,
        setSection,
        expandAll,
        collapseAll,
        isExpanded
    };
}

export default useAdvancedSections;
