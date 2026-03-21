import React from 'react';
import './resize-handle.scss';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  isDragging: boolean;
  orientation?: 'horizontal' | 'vertical';
  onDoubleClick?: () => void;
  className?: string;
}

/**
 * ResizeHandle - Minimal draggable divider for resizing panels.
 * Visually a 1px line; hit area is 5px for usability.
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onMouseDown,
  isDragging,
  orientation = 'horizontal',
  onDoubleClick,
  className = ''
}) => {
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onMouseDown(e);
  };

  return (
    <div
      className={`resize-handle resize-handle--${orientation} ${isDragging ? 'dragging' : ''} ${className}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-orientation={orientation}
      aria-label="Resize panel"
      tabIndex={0}
    />
  );
};

export default ResizeHandle;
