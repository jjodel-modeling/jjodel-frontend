import React, { useState, useEffect, CSSProperties } from 'react';

interface SimpleFooterResizeHandleProps {
  onHeightChange: (height: number) => void;
  currentHeight: number;
  minHeight?: number;
  maxHeight?: number;
  containerSelector: string; // CSS selector for the container (e.g., '.console-tab-v2')
}

/**
 * SimpleFooterResizeHandle - Adapted for footer resize within a container
 *
 * Calculates height from container bottom to mouse position (upward resize)
 * Perfect for resizing footers inside containers like Console
 */
export const SimpleFooterResizeHandle: React.FC<SimpleFooterResizeHandleProps> = ({
  onHeightChange,
  currentHeight,
  minHeight = 100,
  maxHeight = 400,
  containerSelector
}) => {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent) => {
      const container = document.querySelector(containerSelector);
      if (!container) {
        console.warn('[SimpleFooterResizeHandle] Container not found:', containerSelector);
        return;
      }

      const containerBottom = container.getBoundingClientRect().bottom;
      const mouseY = e.clientY;
      const newHeight = containerBottom - mouseY;

      // Clamp between min and max
      const clamped = Math.max(minHeight, Math.min(maxHeight, newHeight));
      onHeightChange(clamped);
    };

    const handleUp = () => {
      setDragging(false);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging, onHeightChange, minHeight, maxHeight, containerSelector]);

  const handleStyle: CSSProperties = {
    position: 'relative',
    height: '8px',
    background: 'transparent',
    cursor: 'ns-resize',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const indicatorStyle: CSSProperties = {
    width: '40px',
    height: '4px',
    background: dragging ? '#3b82f6' : '#cbd5e1',
    borderRadius: '2px',
    transition: 'background 0.2s'
  };

  return (
    <div
      style={handleStyle}
      onMouseDown={(e) => {
        e.preventDefault();
        console.log('[SimpleFooterResizeHandle] Mouse down - starting drag');
        setDragging(true);
      }}
    >
      <div style={indicatorStyle} />
    </div>
  );
};
