import React, { useState, useEffect, useCallback, CSSProperties } from 'react';

interface SimpleFooterResizeHandleProps {
  onHeightChange: (height: number) => void;
  currentHeight: number;
  minHeight?: number;
  maxHeight?: number;           // Fixed max height (deprecated, use maxHeightPercent)
  maxHeightPercent?: number;    // Percentage of container height (e.g., 0.4 = 40%)
  containerSelector: string;    // CSS selector for the container (e.g., '.console-tab-v2')
}

/**
 * SimpleFooterResizeHandle - Barra di resize per il footer della console
 *
 * Supports maxHeightPercent to limit resize to a percentage of container.
 * Double-click to reset to default height (200px).
 */
export const SimpleFooterResizeHandle: React.FC<SimpleFooterResizeHandleProps> = ({
  onHeightChange,
  currentHeight,
  minHeight = 100,
  maxHeight,
  maxHeightPercent = 0.4,  // Default: 40% of container
  containerSelector
}) => {
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);

  // Calculate max height based on container size
  const getMaxHeight = useCallback((): number => {
    const container = document.querySelector(containerSelector);
    if (!container) return maxHeight || 400; // fallback

    const containerHeight = container.getBoundingClientRect().height;
    const percentMax = Math.floor(containerHeight * maxHeightPercent);

    // If both maxHeight and maxHeightPercent are set, use the smaller one
    if (maxHeight) {
      return Math.min(maxHeight, percentMax);
    }
    return percentMax;
  }, [containerSelector, maxHeightPercent, maxHeight]);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent) => {
      const container = document.querySelector(containerSelector);
      if (!container) {
        console.warn('[SimpleFooterResizeHandle] Container not found:', containerSelector);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const containerBottom = containerRect.bottom;
      const mouseY = e.clientY;

      // Calculate new height (distance from mouse to container bottom)
      const newHeight = containerBottom - mouseY;

      // Calculate dynamic max height
      const currentMaxHeight = getMaxHeight();

      // Clamp between min and max
      const clamped = Math.max(minHeight, Math.min(currentMaxHeight, newHeight));
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
  }, [dragging, onHeightChange, minHeight, getMaxHeight, containerSelector]);

  const handleStyle: CSSProperties = {
    position: 'relative',
    height: '8px',
    background: 'transparent',
    cursor: 'ns-resize',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    userSelect: 'none',
  };

  // Barra originale con hover effect
  const indicatorStyle: CSSProperties = {
    width: hovering || dragging ? '80px' : '40px',
    height: '4px',
    background: dragging ? '#475569' : hovering ? '#64748b' : '#cbd5e1',
    borderRadius: '3px',
    transition: 'background 150ms ease, width 150ms ease',
  };

  return (
    <div
      style={handleStyle}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
      }}
      onDoubleClick={() => {
        // Double-click to reset to default
        onHeightChange(200);
      }}
      role="separator"
      aria-orientation="horizontal"
      tabIndex={0}
      title="Drag to resize - Double-click to reset"
    >
      <div style={indicatorStyle} />
    </div>
  );
};

export default SimpleFooterResizeHandle;
