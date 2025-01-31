import { Dispatch, SetStateAction } from 'react';
interface Helpers {
    goToNextStep: () => void;
    goToPrevStep: () => void;
    reset: () => void;
    canGoToNextStep: boolean;
    canGoToPrevStep: boolean;
    setStep: Dispatch<SetStateAction<number>>;
}
declare function useStep(maxStep: number): [number, Helpers];
export default useStep;
