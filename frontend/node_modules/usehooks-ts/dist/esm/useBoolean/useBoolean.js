import { useCallback, useState } from 'react';
function useBoolean(defaultValue) {
    const [value, setValue] = useState(!!defaultValue);
    const setTrue = useCallback(() => setValue(true), []);
    const setFalse = useCallback(() => setValue(false), []);
    const toggle = useCallback(() => setValue(x => !x), []);
    return { value, setValue, setTrue, setFalse, toggle };
}
export default useBoolean;
