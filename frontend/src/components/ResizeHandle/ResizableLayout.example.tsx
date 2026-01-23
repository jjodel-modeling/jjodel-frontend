/**
 * ResizableLayout - Example Component
 *
 * This file demonstrates how to use the useResizableConsole hook and ResizeHandle component
 * to create a vertical split layout with Canvas on top and Console on bottom.
 *
 * INTEGRATION INSTRUCTIONS:
 *
 * Option 1: Integrate into existing tab content
 * --------------------------------------------
 * Wrap your canvas and console within a single tab content area.
 *
 * Option 2: Create a new layout mode
 * -----------------------------------
 * Add a new layout mode to Dock.tsx that renders this component.
 *
 * Option 3: Modify Console tab
 * -----------------------------
 * If Console should always be resizable, modify its tab rendering.
 */

import React from 'react';
import { useResizableConsole } from '../../hooks/useResizableConsole';
import { ResizeHandle } from './ResizeHandle';
import './resizable-layout.example.scss';

// Import your actual components
// import { Canvas } from '../editors/Canvas';
// import { Console } from '../editors/Console';

interface ResizableLayoutProps {
  // Canvas component or render function
  canvasContent?: React.ReactNode;
  // Console component or render function
  consoleContent?: React.ReactNode;
}

/**
 * ResizableLayout Component
 *
 * Provides a vertical split layout with:
 * - Canvas area (flexible, fills remaining space)
 * - Draggable resize handle
 * - Console area (fixed height, resizable)
 */
export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  canvasContent,
  consoleContent
}) => {
  const {
    consoleHeight,
    isDragging,
    handleMouseDown,
    resetToDefault
  } = useResizableConsole();

  return (
    <div className="resizable-layout">
      {/* Canvas Area (flexible) */}
      <div
        className="resizable-layout__canvas"
        style={{
          height: `calc(100vh - ${consoleHeight}px)`
        }}
      >
        {canvasContent || (
          <div className="resizable-layout__placeholder">
            <i className="bi bi-diagram-3" />
            <p>Canvas Area</p>
            <span>Your canvas/graph/diagram component goes here</span>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <ResizeHandle
        onMouseDown={handleMouseDown}
        isDragging={isDragging}
        onDoubleClick={resetToDefault}
      />

      {/* Console Area (fixed height) */}
      <div
        className="resizable-layout__console"
        style={{
          height: `${consoleHeight}px`
        }}
      >
        {consoleContent || (
          <div className="resizable-layout__placeholder">
            <i className="bi bi-terminal" />
            <p>Console Area</p>
            <span>Your console component goes here</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * USAGE EXAMPLE 1: Basic Usage
 * ------------------------------
 */
export const BasicExample: React.FC = () => {
  return (
    <ResizableLayout
      canvasContent={<div>My Canvas Component</div>}
      consoleContent={<div>My Console Component</div>}
    />
  );
};

/**
 * USAGE EXAMPLE 2: With Actual Components
 * ----------------------------------------
 */
/*
export const IntegratedExample: React.FC = () => {
  return (
    <ResizableLayout
      canvasContent={<Canvas />}
      consoleContent={<Console />}
    />
  );
};
*/

/**
 * USAGE EXAMPLE 3: Integrate into Dock.tsx
 * -----------------------------------------
 */
/*
// In Dock.tsx, modify the layout to use ResizableLayout:

import { ResizableLayout } from '../ResizeHandle/ResizableLayout.example';

// Option A: Replace the entire left panel (ModelsSummary)
const canvasWithConsole = {
  id: id(),
  title: <TabHeader tid={tid()}>Workspace</TabHeader>,
  group: 'models',
  closable: false,
  content: (
    <TabContent tid={tid()}>
      <ResizableLayout
        canvasContent={<ModelsSummaryTab />}
        consoleContent={<Console />}
      />
    </TabContent>
  )
};

// Then use it in layout:
layout.dockbox.children.push({tabs: [canvasWithConsole], size: leftSize});

// Option B: Create a toggle button to switch between layouts
// Add state to track if console should be shown as bottom panel
const [showConsoleBottom, setShowConsoleBottom] = useState(false);

// Conditionally render layout based on state
if (showConsoleBottom) {
  // Use ResizableLayout
} else {
  // Use standard rc-dock layout
}
*/

/**
 * USAGE EXAMPLE 4: Keyboard Support Enhancement
 * ----------------------------------------------
 */
/*
// Extend the hook with keyboard controls:

export const KeyboardControlledExample: React.FC = () => {
  const {
    consoleHeight,
    isDragging,
    handleMouseDown,
    setConsoleHeight,
    resetToDefault
  } = useResizableConsole();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setConsoleHeight(consoleHeight + 20);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setConsoleHeight(consoleHeight - 20);
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setConsoleHeight(200); // MIN_CONSOLE_HEIGHT
    }
    if (e.key === 'End') {
      e.preventDefault();
      setConsoleHeight(600); // MAX_CONSOLE_HEIGHT
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      resetToDefault();
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <ResizableLayout ... />
    </div>
  );
};
*/

export default ResizableLayout;
