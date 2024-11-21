interface UseDarkModeOutput {
    isDarkMode: boolean;
    toggle: () => void;
    enable: () => void;
    disable: () => void;
}
declare function useDarkMode(defaultValue?: boolean): UseDarkModeOutput;
export default useDarkMode;
