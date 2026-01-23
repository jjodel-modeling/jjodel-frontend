import React, { useState, useEffect } from 'react';
import { SimpleResizeHandle } from './SimpleResizeHandle';

export const TestLayout: React.FC = () => {
  const [consoleHeight, setConsoleHeight] = useState(() => {
    const stored = localStorage.getItem('console_height');
    return stored ? parseInt(stored, 10) : 400;
  });

  useEffect(() => {
    localStorage.setItem('console_height', consoleHeight.toString());
  }, [consoleHeight]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* CANVAS */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        flexDirection: 'column'
      }}>
        <div>CANVAS AREA</div>
        <div>Height: {window.innerHeight - consoleHeight}px</div>
      </div>

      {/* RESIZE HANDLE */}
      <SimpleResizeHandle
        onHeightChange={setConsoleHeight}
        currentHeight={consoleHeight}
      />

      {/* CONSOLE */}
      <div style={{
        height: `${consoleHeight}px`,
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#64748b',
        flexDirection: 'column'
      }}>
        <div>CONSOLE AREA</div>
        <div>Height: {consoleHeight}px</div>
      </div>
    </div>
  );
};
