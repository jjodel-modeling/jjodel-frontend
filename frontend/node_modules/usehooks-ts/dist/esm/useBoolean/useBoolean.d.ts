import { Dispatch, SetStateAction } from 'react';
interface UseBooleanOutput {
    value: boolean;
    setValue: Dispatch<SetStateAction<boolean>>;
    setTrue: () => void;
    setFalse: () => void;
    toggle: () => void;
}
declare function useBoolean(defaultValue?: boolean): UseBooleanOutput;
export default useBoolean;
