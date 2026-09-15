import React, { useState, useEffect, CSSProperties } from 'react';

interface SimpleResizeHandleProps {
  onHeightChange: (height: number) => void;
  currentHeight: number;
}

export const SimpleResizeHandle: React.FC<SimpleResizeHandleProps> = ({
  onHeightChange,
  currentHeight
}) => {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      const clamped = Math.max(200, Math.min(600, newHeight));
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
  }, [dragging, onHeightChange]);

  const handleStyle: CSSProperties = {
    position: 'relative',
    height: '16px',
    background: 'transparent',
    cursor: 'ns-resize',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    userSelect: 'none',
  };

  return (
    <div
      style={handleStyle}
      onMouseDown={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      role="separator"
      aria-orientation="horizontal"
      tabIndex={0}
      title="Drag to resize"
    >
      <i className={`bi bi-grip-horizontal resize-grip-icon ${dragging ? 'dragging' : ''}`} />
    </div>
  );
};
