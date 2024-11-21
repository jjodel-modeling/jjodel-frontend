"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var __1 = require("..");
var COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';
function useTernaryDarkMode() {
    var isDarkOS = (0, __1.useMediaQuery)(COLOR_SCHEME_QUERY);
    var _a = (0, __1.useLocalStorage)('usehooks-ts-ternary-dark-mode', 'system'), ternaryDarkMode = _a[0], setTernaryDarkMode = _a[1];
    var _b = (0, react_1.useState)(isDarkOS), isDarkMode = _b[0], setDarkMode = _b[1];
    (0, __1.useUpdateEffect)(function () {
        if (ternaryDarkMode === 'system') {
            setDarkMode(isDarkOS);
        }
    }, [isDarkOS]);
    (0, react_1.useEffect)(function () {
        switch (ternaryDarkMode) {
            case 'light':
                setDarkMode(false);
                break;
            case 'system':
                setDarkMode(isDarkOS);
                break;
            case 'dark':
                setDarkMode(true);
                break;
        }
    }, [ternaryDarkMode, isDarkOS]);
    function toggleTernaryDarkMode() {
        var toggleDict = {
            light: 'system',
            system: 'dark',
            dark: 'light',
        };
        setTernaryDarkMode(function (prevMode) { return toggleDict[prevMode]; });
    }
    return {
        isDarkMode: isDarkMode,
        ternaryDarkMode: ternaryDarkMode,
        setTernaryDarkMode: setTernaryDarkMode,
        toggleTernaryDarkMode: toggleTernaryDarkMode,
    };
}
exports.default = useTernaryDarkMode;
