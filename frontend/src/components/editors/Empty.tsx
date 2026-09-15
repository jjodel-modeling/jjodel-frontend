import React, {ReactNode} from "react";
import { EmptyState } from '../ui/EmptyState';
import './empty.scss';

type Props = {
    msg?: ReactNode;
    icon?: string;
    title?: string;
    description?: string;
}

/**
 * Empty state component for Properties panel
 * Shows when no element is selected on the canvas
 */
export function Empty(props: Props){
    const {
        msg,
        icon = 'bi-cursor',
        title = 'No element selected',
        description = 'Select an element on the canvas to view and edit its properties.'
    } = props;

    // Legacy mode: just show the message
    if (msg) {
        return (
            <section className={'no-data-to-display'}>
                <label className={'d-block text-center'}>
                    {msg}
                </label>
            </section>
        );
    }

    // Unified empty state
    return (
        <section className="properties-empty-state">
            <EmptyState
                icon={icon}
                title={title}
                description={description}
                hints={[
                    { icon: 'bi-mouse', text: 'Click an element to select it' },
                    { icon: 'bi-diagram-2', text: 'Use Tree View to navigate the model' },
                ]}
            />
        </section>
    );
}
