import React from 'react';
import { useDevMode } from '../../contexts/DevModeContext';
import './dev-mode-label.scss';

interface DevModeLabelProps {
  componentId: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const DevModeLabel: React.FC<DevModeLabelProps> = ({
  componentId,
  position = 'top-right'
}) => {
  const { isDevMode, isComponentLocked, getComponentName } = useDevMode();

  if (!isDevMode) return null;

  const locked = isComponentLocked(componentId);
  const componentName = getComponentName(componentId);

  return (
    <div
      className={`dev-mode-label dev-mode-label--${position} ${locked ? 'dev-mode-label--locked' : 'dev-mode-label--unlocked'}`}
      title={`${componentId}: ${componentName}`}
    >
      <i className={`bi ${locked ? 'bi-lock-fill' : 'bi-unlock-fill'}`} />
      <span className="dev-mode-label__status">{locked ? 'LOCKED' : 'UNLOCKED'}</span>
      <span className="dev-mode-label__id">{componentId}</span>
    </div>
  );
};

export default DevModeLabel;
