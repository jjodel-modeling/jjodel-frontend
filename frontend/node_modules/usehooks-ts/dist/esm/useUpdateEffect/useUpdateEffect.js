import { useEffect } from 'react';
import { useIsFirstRender } from '..';
function useUpdateEffect(effect, deps) {
    const isFirst = useIsFirstRender();
    useEffect(() => {
        if (!isFirst) {
            return effect();
        }
    }, deps);
}
export default useUpdateEffect;
