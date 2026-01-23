import React from 'react';
import './resize-handle.scss';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;  // ✅ Required event parameter
  isDragging: boolean;
  onDoubleClick?: () => void;
  className?: string;
}

/**
 * ResizeHandle - Draggable handle for resizing console
 *
 * Features:
 * - Horizontal bar with indicator
 * - Hover and dragging visual feedback
 * - Double-click to reset (optional)
 * - Keyboard support for accessibility
 * - Prevents default drag behavior
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onMouseDown,
  isDragging,
  onDoubleClick,
  className = ''
}) => {
  // ✅ Internal wrapper that prevents default and passes event
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('[ResizeHandle] handleMouseDown called');
    e.preventDefault();      // Prevent text selection
    e.stopPropagation();     // Stop event bubbling
    console.log('[ResizeHandle] calling parent onMouseDown');
    onMouseDown(e);          // Pass event to parent callback
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard support for accessibility
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Create a synthetic mouse event for keyboard activation
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
        clientY: window.innerHeight / 2
      } as React.MouseEvent<HTMLDivElement>;
      onMouseDown(syntheticEvent);  // Call with synthetic event
    }

    if (e.key === 'Escape' && isDragging) {
      e.preventDefault();
      // Dragging will be stopped by mouseup event
    }
  };

  return (
    <div
      className={`resize-handle ${isDragging ? 'dragging' : ''} ${className}`}
      onMouseDown={handleMouseDown}  // ✅ Use wrapper
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize console panel"
      aria-valuenow={isDragging ? 1 : 0}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="resize-handle__track">
        <div className="resize-handle__indicator" />
      </div>
    </div>
  );
};

export default ResizeHandle;
