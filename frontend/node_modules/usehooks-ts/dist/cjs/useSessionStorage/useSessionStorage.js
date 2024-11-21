"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useSessionStorage(key, initialValue) {
    var readValue = (0, react_1.useCallback)(function () {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            var item = window.sessionStorage.getItem(key);
            return item ? parseJSON(item) : initialValue;
        }
        catch (error) {
            console.warn("Error reading sessionStorage key \u201C".concat(key, "\u201D:"), error);
            return initialValue;
        }
    }, [initialValue, key]);
    var _a = (0, react_1.useState)(readValue), storedValue = _a[0], setStoredValue = _a[1];
    var setValue = (0, __1.useEventCallback)(function (value) {
        if (typeof window == 'undefined') {
            console.warn("Tried setting sessionStorage key \u201C".concat(key, "\u201D even though environment is not a client"));
        }
        try {
            var newValue = value instanceof Function ? value(storedValue) : value;
            window.sessionStorage.setItem(key, JSON.stringify(newValue));
            setStoredValue(newValue);
            window.dispatchEvent(new Event('session-storage'));
        }
        catch (error) {
            console.warn("Error setting sessionStorage key \u201C".concat(key, "\u201D:"), error);
        }
    });
    (0, react_1.useEffect)(function () {
        setStoredValue(readValue());
    }, []);
    var handleStorageChange = (0, react_1.useCallback)(function (event) {
        if ((event === null || event === void 0 ? void 0 : event.key) && event.key !== key) {
            return;
        }
        setStoredValue(readValue());
    }, [key, readValue]);
    (0, __1.useEventListener)('storage', handleStorageChange);
    (0, __1.useEventListener)('session-storage', handleStorageChange);
    return [storedValue, setValue];
}
exports.default = useSessionStorage;
function parseJSON(value) {
    try {
        return value === 'undefined' ? undefined : JSON.parse(value !== null && value !== void 0 ? value : '');
    }
    catch (_a) {
        console.log('parsing error on', { value: value });
        return undefined;
    }
}
