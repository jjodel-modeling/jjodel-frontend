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
        console.log('✅ MOUSE DOWN');
        setDragging(true);
      }}
    >
      <div style={indicatorStyle} />
    </div>
  );
};
