import { useLocalStorage, useMediaQuery, useUpdateEffect } from '..';
const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';
function useDarkMode(defaultValue) {
    var _a;
    const isDarkOS = useMediaQuery(COLOR_SCHEME_QUERY);
    const [isDarkMode, setDarkMode] = useLocalStorage('usehooks-ts-dark-mode', (_a = defaultValue !== null && defaultValue !== void 0 ? defaultValue : isDarkOS) !== null && _a !== void 0 ? _a : false);
    useUpdateEffect(() => {
        setDarkMode(isDarkOS);
    }, [isDarkOS]);
    return {
        isDarkMode,
        toggle: () => setDarkMode(prev => !prev),
        enable: () => setDarkMode(true),
        disable: () => setDarkMode(false),
    };
}
export default useDarkMode;
