/**
 * Mode System Components
 *
 * Components for the Basic/Advanced mode system with progressive disclosure.
 */

export { ModeToggle } from './ModeToggle';
export { CollapsibleSection } from './CollapsibleSection';
export type { SectionBadge } from './CollapsibleSection';
export { UpgradePrompt } from './UpgradePrompt';
export { LockedFeature } from './LockedFeature';

// Re-export hooks for convenience
export { useInterfaceMode, isAdvancedMode, isBasicMode } from '../../hooks/useInterfaceMode';
export type { InterfaceMode } from '../../hooks/useInterfaceMode';
export { useAdvancedSections } from '../../hooks/useAdvancedSections';
export type { AdvancedSections } from '../../hooks/useAdvancedSections';
