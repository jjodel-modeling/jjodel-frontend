import React, { useCallback, useEffect, useRef, useState } from 'react';
import './bottom-drawer.scss';

export interface BottomDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    height?: number;
    minHeight?: number;
    maxHeightRatio?: number;
    children: React.ReactNode;
}

/**
 * BottomDrawer — a resizable panel that takes real space below the canvas.
 * The canvas shrinks when the drawer opens (NOT an overlay).
 */
const BottomDrawer: React.FC<BottomDrawerProps> = ({
    isOpen,
    onClose,
    title,
    height: initialHeight = 250,
    minHeight = 100,
    maxHeightRatio = 0.5,
    children,
}) => {
    const [height, setHeight] = useState(initialHeight);
    const dragging = useRef(false);
    const startY = useRef(0);
    const startHeight = useRef(0);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [isOpen, onClose]);

    // Drag resize
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current = true;
        startY.current = e.clientY;
        startHeight.current = height;
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
    }, [height]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!dragging.current) return;
            const delta = startY.current - e.clientY;
            const parentHeight = window.innerHeight;
            const maxH = parentHeight * maxHeightRatio;
            const newH = Math.max(minHeight, Math.min(maxH, startHeight.current + delta));
            setHeight(newH);
        };
        const onMouseUp = () => {
            if (dragging.current) {
                dragging.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [minHeight, maxHeightRatio]);

    if (!isOpen) return null;

    return (
        <div className="bottom-drawer" style={{ height }}>
            {/* Drag handle */}
            <div className="bottom-drawer__resize-handle" onMouseDown={onMouseDown}>
                <div className="bottom-drawer__resize-grip" />
            </div>
            {/* Header */}
            <div className="bottom-drawer__header">
                <span className="bottom-drawer__title">{title}</span>
                <button
                    className="bottom-drawer__close"
                    onClick={onClose}
                    title="Close (Escape)"
                >
                    <i className="bi bi-x" />
                </button>
            </div>
            {/* Content */}
            <div className="bottom-drawer__content">
                {children}
            </div>
        </div>
    );
};

export default BottomDrawer;
