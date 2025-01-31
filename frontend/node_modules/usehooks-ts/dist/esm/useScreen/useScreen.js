import { useState } from 'react';
import { useEventListener, useIsomorphicLayoutEffect } from '..';
function useScreen() {
    const getScreen = () => {
        if (typeof window !== 'undefined' && window.screen) {
            return window.screen;
        }
        return undefined;
    };
    const [screen, setScreen] = useState(getScreen());
    function handleSize() {
        setScreen(getScreen());
    }
    useEventListener('resize', handleSize);
    useIsomorphicLayoutEffect(() => {
        handleSize();
    }, []);
    return screen;
}
export default useScreen;
