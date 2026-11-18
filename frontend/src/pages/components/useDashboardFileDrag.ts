import React, {useLayoutEffect, useReducer, useRef, useState} from 'react';
import {DASHBOARD_DRAG_IDLE, nextDashboardDragState} from './dashboardFileDrag';

/** The modal is not a descendant of the dashboard and keeps its open state to itself. */
const IMPORT_MODAL_SELECTOR = '.project-dropping-container';

type OverlayBox = Pick<React.CSSProperties, 'top' | 'left' | 'right' | 'bottom'>;

/**
 * Drag tracking of the dashboard drop overlay. The handlers go on the React tree of the dashboard, never on `window`:
 * a drop on the modal must not reach them. `.dash-content` scrolls and is static, so the overlay is fixed over its
 * rect, read when the drag starts and on resize.
 */
export function useDashboardFileDrag(route: string) {
    const [{active}, dispatch] = useReducer(nextDashboardDragState, DASHBOARD_DRAG_IDLE);
    const [overlayBox, setOverlayBox] = useState<OverlayBox | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!active) return;
        const measure = () => {
            if (!contentRef.current) return;
            const rect = contentRef.current.getBoundingClientRect();
            const viewport = document.documentElement;
            setOverlayBox({
                top: rect.top,
                left: rect.left,
                right: viewport.clientWidth - rect.right,
                bottom: viewport.clientHeight - rect.bottom,
            });
        };
        // A reset only: no dragend arrives for a file dragged from outside the document.
        const onDragEnd = () => dispatch({type: 'dragend'});
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') dispatch({type: 'escape'}); };
        measure();
        window.addEventListener('resize', measure);
        window.addEventListener('dragend', onDragEnd);
        window.addEventListener('keydown', onKeyDown, true);
        return () => {
            window.removeEventListener('resize', measure);
            window.removeEventListener('dragend', onDragEnd);
            window.removeEventListener('keydown', onKeyDown, true);
        };
    }, [active]);

    const trackDrag = (type: 'dragenter' | 'dragover', e: React.DragEvent) => dispatch({
        type,
        hasFiles: e.dataTransfer.types.includes('Files'),
        route,
        modalOpen: document.querySelector(IMPORT_MODAL_SELECTOR) !== null,
    });

    const trackLeave = (e: React.DragEvent) => {
        const related = e.relatedTarget as Node | null;
        dispatch({type: 'dragleave', relatedTargetInside: related === null ? null : e.currentTarget.contains(related)});
    };

    const trackDrop = () => dispatch({type: 'drop'});

    return {active, overlayBox, contentRef, trackDrag, trackLeave, trackDrop};
}
