import { useEffect } from 'react';
function useEffectOnce(effect) {
    useEffect(effect, []);
}
export default useEffectOnce;
