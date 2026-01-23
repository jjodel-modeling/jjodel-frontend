import { useState, useCallback, useEffect } from 'react';

// Console resize constraints
const MIN_CONSOLE_HEIGHT = 200; // px - enough for input + few results
const MAX_CONSOLE_HEIGHT = 600; // px - don't hide too much canvas
const DEFAULT_CONSOLE_HEIGHT = 400; // px - balanced default
const STORAGE_KEY = 'jjodel_console_height';

interface UseResizableConsoleReturn {
  consoleHeight: number;
  isDragging: boolean;
  handleMouseDown: (e?: React.MouseEvent<HTMLDivElement>) => void;
  setConsoleHeight: (height: number) => void;
  resetToDefault: () => void;
}

/**
 * Custom hook for managing resizable console height
 * Tracks drag state, persists to localStorage, and handles mouse events
 */
export const useResizableConsole = (): UseResizableConsoleReturn => {
  // Initialize height from localStorage or use default
  const [consoleHeight, setConsoleHeightState] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= MIN_CONSOLE_HEIGHT && parsed <= MAX_CONSOLE_HEIGHT) {
        return parsed;
      }
    }
    return DEFAULT_CONSOLE_HEIGHT;
  });

  const [isDragging, setIsDragging] = useState(false);

  // Save to localStorage whenever height changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, consoleHeight.toString());
  }, [consoleHeight]);

  // Mouse down handler - initiate drag
 const handleMouseDown = useCallback((e?: React.MouseEvent<HTMLDivElement>) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  console.log('[Hook] Starting drag');
  setIsDragging(true);
}, []);

  // Mouse move handler - update height during drag
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate new height based on mouse position
      const windowHeight = window.innerHeight;
      const mouseY = e.clientY;

      // Distance from bottom of window
      const newHeight = windowHeight - mouseY;

      // Clamp between min and max
      const clampedHeight = Math.max(
        MIN_CONSOLE_HEIGHT,
        Math.min(MAX_CONSOLE_HEIGHT, newHeight)
      );

      setConsoleHeightState(clampedHeight);
    },
    [isDragging]
  );

  // Mouse up handler - end drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // Set cursor and prevent text selection during drag
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Restore cursor and text selection
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Public setter with validation
  const setConsoleHeight = useCallback((height: number) => {
    const clampedHeight = Math.max(
      MIN_CONSOLE_HEIGHT,
      Math.min(MAX_CONSOLE_HEIGHT, height)
    );
    setConsoleHeightState(clampedHeight);
  }, []);

  // Reset to default height
  const resetToDefault = useCallback(() => {
    setConsoleHeightState(DEFAULT_CONSOLE_HEIGHT);
  }, []);

  return {
    consoleHeight,
    isDragging,
    handleMouseDown,
    setConsoleHeight,
    resetToDefault,
  };
};

// Export constants for external use
export { MIN_CONSOLE_HEIGHT, MAX_CONSOLE_HEIGHT, DEFAULT_CONSOLE_HEIGHT };
