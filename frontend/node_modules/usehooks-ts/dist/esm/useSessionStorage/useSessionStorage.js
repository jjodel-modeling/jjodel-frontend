import { useCallback, useEffect, useState, } from 'react';
import { useEventCallback, useEventListener } from '..';
function useSessionStorage(key, initialValue) {
    const readValue = useCallback(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? parseJSON(item) : initialValue;
        }
        catch (error) {
            console.warn(`Error reading sessionStorage key “${key}”:`, error);
            return initialValue;
        }
    }, [initialValue, key]);
    const [storedValue, setStoredValue] = useState(readValue);
    const setValue = useEventCallback(value => {
        if (typeof window == 'undefined') {
            console.warn(`Tried setting sessionStorage key “${key}” even though environment is not a client`);
        }
        try {
            const newValue = value instanceof Function ? value(storedValue) : value;
            window.sessionStorage.setItem(key, JSON.stringify(newValue));
            setStoredValue(newValue);
            window.dispatchEvent(new Event('session-storage'));
        }
        catch (error) {
            console.warn(`Error setting sessionStorage key “${key}”:`, error);
        }
    });
    useEffect(() => {
        setStoredValue(readValue());
    }, []);
    const handleStorageChange = useCallback((event) => {
        if ((event === null || event === void 0 ? void 0 : event.key) && event.key !== key) {
            return;
        }
        setStoredValue(readValue());
    }, [key, readValue]);
    useEventListener('storage', handleStorageChange);
    useEventListener('session-storage', handleStorageChange);
    return [storedValue, setValue];
}
export default useSessionStorage;
function parseJSON(value) {
    try {
        return value === 'undefined' ? undefined : JSON.parse(value !== null && value !== void 0 ? value : '');
    }
    catch (_a) {
        console.log('parsing error on', { value });
        return undefined;
    }
}
