import React, { useMemo } from 'react';

interface ViewpointRendererProps {
    jsxString: string;
    context: Record<string, any>;
}

/**
 * Renders a jsxString using eval/Function.
 * In production, this will use the full DSL.parser → UX.parseAndInject → new Function pipeline.
 */
function ViewpointRenderer({ jsxString, context }: ViewpointRendererProps) {
    const rendered = useMemo(() => {
        try {
            // Compile jsxString into a function
            // eslint-disable-next-line no-new-func
            const fn = new Function('React', 'data', `return (${jsxString})`);
            return fn(React, context);
        } catch (e) {
            return (
                <div className="viewpoint-error">
                    Viewpoint render error: {String(e)}
                </div>
            );
        }
    }, [jsxString, context]);

    return <div className="viewpoint-container">{rendered}</div>;
}

export default ViewpointRenderer;
