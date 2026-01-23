import { useState, useCallback, useEffect } from 'react';

// Footer resize constraints
const MIN_FOOTER_HEIGHT = 100; // px - enough for collapsed sections
const MAX_FOOTER_HEIGHT = 400; // px - don't take too much space
const DEFAULT_FOOTER_HEIGHT = 200; // px - balanced default
const STORAGE_KEY = 'jjodel_console_footer_height';

interface UseResizableFooterReturn {
  footerHeight: number;
  isDragging: boolean;
  handleMouseDown: () => void;
  setFooterHeight: (height: number) => void;
  resetToDefault: () => void;
}

/**
 * Custom hook for managing resizable console footer height
 * Used for the collapsible Context Keys and Code Shortcuts section
 */
export const useResizableFooter = (): UseResizableFooterReturn => {
  // Initialize height from localStorage or use default
  const [footerHeight, setFooterHeightState] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= MIN_FOOTER_HEIGHT && parsed <= MAX_FOOTER_HEIGHT) {
        return parsed;
      }
    }
    return DEFAULT_FOOTER_HEIGHT;
  });

  const [isDragging, setIsDragging] = useState(false);

  // Save to localStorage whenever height changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, footerHeight.toString());
  }, [footerHeight]);

  // Mouse down handler - initiate drag
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Mouse move handler - update height during drag
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate new height based on mouse position
      // Footer grows upward, so we calculate from bottom of viewport
      const containerBottom = document.querySelector('.console-tab-v2')?.getBoundingClientRect().bottom || window.innerHeight;
      const mouseY = e.clientY;

      // Distance from mouse to bottom of container
      const newHeight = containerBottom - mouseY;

      // Clamp between min and max
      const clampedHeight = Math.max(
        MIN_FOOTER_HEIGHT,
        Math.min(MAX_FOOTER_HEIGHT, newHeight)
      );

      setFooterHeightState(clampedHeight);
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
  const setFooterHeight = useCallback((height: number) => {
    const clampedHeight = Math.max(
      MIN_FOOTER_HEIGHT,
      Math.min(MAX_FOOTER_HEIGHT, height)
    );
    setFooterHeightState(clampedHeight);
  }, []);

  // Reset to default height
  const resetToDefault = useCallback(() => {
    setFooterHeightState(DEFAULT_FOOTER_HEIGHT);
  }, []);

  return {
    footerHeight,
    isDragging,
    handleMouseDown,
    setFooterHeight,
    resetToDefault,
  };
};

// Export constants for external use
export { MIN_FOOTER_HEIGHT, MAX_FOOTER_HEIGHT, DEFAULT_FOOTER_HEIGHT };
