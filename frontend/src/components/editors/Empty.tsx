import React, {ReactNode} from "react";
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
 * Following CLAUDE.md design guidelines
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

    // New empty state design
    return (
        <section className="properties-empty-state">
            <div className="properties-empty-state__content">
                <div className="properties-empty-state__icon">
                    <i className={`bi ${icon}`} />
                </div>
                <h3 className="properties-empty-state__title">{title}</h3>
                <p className="properties-empty-state__description">{description}</p>
                <div className="properties-empty-state__hints">
                    <div className="properties-empty-state__hint">
                        <i className="bi bi-mouse" />
                        <span>Click an element to select it</span>
                    </div>
                    <div className="properties-empty-state__hint">
                        <i className="bi bi-diagram-2" />
                        <span>Use Tree View to navigate the model</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
