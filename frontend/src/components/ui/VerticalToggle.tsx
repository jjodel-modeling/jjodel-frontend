import React from 'react';
import './VerticalToggle.scss';

interface VerticalToggleProps {
  isActive: boolean;
  onToggle: () => void;
  labelOn: string;
  labelOff: string;
  className?: string;
  variant?: 'default' | 'debug';
  showLabels?: boolean;
}

export function VerticalToggle({
  isActive,
  onToggle,
  labelOn,
  labelOff,
  className = '',
  variant = 'default',
  showLabels = true
}: VerticalToggleProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div className={`toggle-vertical ${variant}-toggle ${className}`}>
      <button
        className={`toggle-switch ${isActive ? 'on' : 'off'}`}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        role="switch"
        aria-checked={isActive}
        aria-label={isActive ? labelOn : labelOff}
        tabIndex={0}
        type="button"
      >
        <span className="toggle-switch-thumb" />
      </button>
      {showLabels && (
        <div className="toggle-labels">
          <span
            className={`toggle-label ${isActive ? 'active' : ''}`}
            onClick={() => !isActive && onToggle()}
          >
            {labelOn}
          </span>
          <span
            className={`toggle-label ${!isActive ? 'active' : ''}`}
            onClick={() => isActive && onToggle()}
          >
            {labelOff}
          </span>
        </div>
      )}
    </div>
  );
}

export default VerticalToggle;
