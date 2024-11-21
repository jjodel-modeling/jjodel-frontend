import { Dispatch, SetStateAction } from 'react';
declare function useToggle(defaultValue?: boolean): [boolean, () => void, Dispatch<SetStateAction<boolean>>];
export default useToggle;
