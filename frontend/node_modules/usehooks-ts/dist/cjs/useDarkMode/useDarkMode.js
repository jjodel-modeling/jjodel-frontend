"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';
function useDarkMode(defaultValue) {
    var _a;
    var isDarkOS = (0, __1.useMediaQuery)(COLOR_SCHEME_QUERY);
    var _b = (0, __1.useLocalStorage)('usehooks-ts-dark-mode', (_a = defaultValue !== null && defaultValue !== void 0 ? defaultValue : isDarkOS) !== null && _a !== void 0 ? _a : false), isDarkMode = _b[0], setDarkMode = _b[1];
    (0, __1.useUpdateEffect)(function () {
        setDarkMode(isDarkOS);
    }, [isDarkOS]);
    return {
        isDarkMode: isDarkMode,
        toggle: function () { return setDarkMode(function (prev) { return !prev; }); },
        enable: function () { return setDarkMode(true); },
        disable: function () { return setDarkMode(false); },
    };
}
exports.default = useDarkMode;
