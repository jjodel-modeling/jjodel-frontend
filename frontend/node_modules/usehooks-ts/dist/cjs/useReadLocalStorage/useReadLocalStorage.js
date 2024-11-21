"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
function useReadLocalStorage(key) {
    var readValue = (0, react_1.useCallback)(function () {
        if (typeof window === 'undefined') {
            return null;
        }
        try {
            var item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        }
        catch (error) {
            console.warn("Error reading localStorage key \u201C".concat(key, "\u201D:"), error);
            return null;
        }
    }, [key]);
    var _a = (0, react_1.useState)(readValue), storedValue = _a[0], setStoredValue = _a[1];
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
    (0, __1.useEventListener)('local-storage', handleStorageChange);
    return storedValue;
}
exports.default = useReadLocalStorage;
