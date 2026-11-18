/**
 * The drag state behind the dashboard drop overlay, pure so the bench can run it. The file list is empty during
 * `dragover`, so the caller passes `dataTransfer.types.includes('Files')` as `hasFiles`.
 */
export type DashboardDragState = { active: boolean };

export type DashboardDragInput =
    | { type: 'dragenter' | 'dragover'; hasFiles: boolean; route: string; modalOpen: boolean }
    /** `null` when the related target is null: the pointer left the window. */
    | { type: 'dragleave'; relatedTargetInside: boolean | null }
    | { type: 'drop' | 'dragend' | 'escape' };

export const DASHBOARD_DRAG_IDLE: DashboardDragState = { active: false };

const DASHBOARD_DRAG_ACTIVE: DashboardDragState = { active: true };

/** `active: 'All'` of the dashboard: the only page that imports a drop (D1). */
const DROP_IMPORT_ROUTE = 'All';

/** Returns `state` itself when nothing changes, so a stream of `dragover` does not render. */
export function nextDashboardDragState(state: DashboardDragState, input: DashboardDragInput): DashboardDragState {
    const clear = state.active ? DASHBOARD_DRAG_IDLE : state;
    switch (input.type) {
        case 'dragenter':
        case 'dragover':
            if (state.active) return state;
            return input.hasFiles && input.route === DROP_IMPORT_ROUTE && !input.modalOpen ? DASHBOARD_DRAG_ACTIVE : state;
        case 'dragleave':
            return input.relatedTargetInside === true ? state : clear;
        case 'drop':
        case 'dragend':
        case 'escape':
            return clear;
    }
}
