import { useState } from 'react';
import { useEventListener, useIsomorphicLayoutEffect } from '..';
function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
        width: 0,
        height: 0,
    });
    const handleSize = () => {
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    };
    useEventListener('resize', handleSize);
    useIsomorphicLayoutEffect(() => {
        handleSize();
    }, []);
    return windowSize;
}
export default useWindowSize;
