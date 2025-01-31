import { useState } from 'react';
function useImageOnLoad() {
    const [isLoaded, setIsLoaded] = useState(false);
    const handleImageOnLoad = () => {
        setIsLoaded(true);
    };
    const css = {
        thumbnail: {
            visibility: isLoaded ? 'hidden' : 'visible',
            filter: 'blur(8px)',
            transition: 'visibility 0ms ease-out 500ms',
        },
        fullSize: {
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 500ms ease-in 0ms',
        },
    };
    return { handleImageOnLoad, css };
}
export default useImageOnLoad;
