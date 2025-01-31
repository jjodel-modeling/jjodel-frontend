import { useEffect, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '..';
function useTimeout(callback, delay) {
    const savedCallback = useRef(callback);
    useIsomorphicLayoutEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
    useEffect(() => {
        if (!delay && delay !== 0) {
            return;
        }
        const id = setTimeout(() => savedCallback.current(), delay);
        return () => clearTimeout(id);
    }, [delay]);
}
export default useTimeout;
