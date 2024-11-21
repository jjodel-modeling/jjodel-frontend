import { Dispatch, SetStateAction } from 'react';
declare type TernaryDarkMode = 'system' | 'dark' | 'light';
interface UseTernaryDarkModeOutput {
    isDarkMode: boolean;
    ternaryDarkMode: TernaryDarkMode;
    setTernaryDarkMode: Dispatch<SetStateAction<TernaryDarkMode>>;
    toggleTernaryDarkMode: () => void;
}
declare function useTernaryDarkMode(): UseTernaryDarkModeOutput;
export default useTernaryDarkMode;
