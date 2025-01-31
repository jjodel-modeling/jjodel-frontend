import { useCallback, useState } from 'react';
function useToggle(defaultValue) {
    const [value, setValue] = useState(!!defaultValue);
    const toggle = useCallback(() => setValue(x => !x), []);
    return [value, toggle, setValue];
}
export default useToggle;
