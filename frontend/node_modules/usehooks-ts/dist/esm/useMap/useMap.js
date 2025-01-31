import { useCallback, useState } from 'react';
function useMap(initialState = new Map()) {
    const [map, setMap] = useState(new Map(initialState));
    const actions = {
        set: useCallback((key, value) => {
            setMap(prev => {
                const copy = new Map(prev);
                copy.set(key, value);
                return copy;
            });
        }, []),
        setAll: useCallback(entries => {
            setMap(() => new Map(entries));
        }, []),
        remove: useCallback(key => {
            setMap(prev => {
                const copy = new Map(prev);
                copy.delete(key);
                return copy;
            });
        }, []),
        reset: useCallback(() => {
            setMap(() => new Map());
        }, []),
    };
    return [map, actions];
}
export default useMap;
