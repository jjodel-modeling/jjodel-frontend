import { useEffect, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '..';
function useEventListener(eventName, handler, element, options) {
    const savedHandler = useRef(handler);
    useIsomorphicLayoutEffect(() => {
        savedHandler.current = handler;
    }, [handler]);
    useEffect(() => {
        var _a;
        const targetElement = (_a = element === null || element === void 0 ? void 0 : element.current) !== null && _a !== void 0 ? _a : window;
        if (!(targetElement && targetElement.addEventListener))
            return;
        const listener = event => savedHandler.current(event);
        targetElement.addEventListener(eventName, listener, options);
        return () => {
            targetElement.removeEventListener(eventName, listener, options);
        };
    }, [eventName, element, options]);
}
export default useEventListener;
