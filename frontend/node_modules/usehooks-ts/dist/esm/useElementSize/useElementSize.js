import { useCallback, useState } from 'react';
import { useEventListener, useIsomorphicLayoutEffect } from '..';
function useElementSize() {
    const [ref, setRef] = useState(null);
    const [size, setSize] = useState({
        width: 0,
        height: 0,
    });
    const handleSize = useCallback(() => {
        setSize({
            width: (ref === null || ref === void 0 ? void 0 : ref.offsetWidth) || 0,
            height: (ref === null || ref === void 0 ? void 0 : ref.offsetHeight) || 0,
        });
    }, [ref === null || ref === void 0 ? void 0 : ref.offsetHeight, ref === null || ref === void 0 ? void 0 : ref.offsetWidth]);
    useEventListener('resize', handleSize);
    useIsomorphicLayoutEffect(() => {
        handleSize();
    }, [ref === null || ref === void 0 ? void 0 : ref.offsetHeight, ref === null || ref === void 0 ? void 0 : ref.offsetWidth]);
    return [setRef, size];
}
export default useElementSize;
