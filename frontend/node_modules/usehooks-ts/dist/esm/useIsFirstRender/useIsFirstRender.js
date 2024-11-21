import { useRef } from 'react';
function useIsFirstRender() {
    const isFirst = useRef(true);
    if (isFirst.current) {
        isFirst.current = false;
        return true;
    }
    return isFirst.current;
}
export default useIsFirstRender;
