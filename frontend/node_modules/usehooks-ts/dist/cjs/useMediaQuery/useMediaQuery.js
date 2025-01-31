"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function useMediaQuery(query) {
    var getMatches = function (query) {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    };
    var _a = (0, react_1.useState)(getMatches(query)), matches = _a[0], setMatches = _a[1];
    function handleChange() {
        setMatches(getMatches(query));
    }
    (0, react_1.useEffect)(function () {
        var matchMedia = window.matchMedia(query);
        handleChange();
        if (matchMedia.addListener) {
            matchMedia.addListener(handleChange);
        }
        else {
            matchMedia.addEventListener('change', handleChange);
        }
        return function () {
            if (matchMedia.removeListener) {
                matchMedia.removeListener(handleChange);
            }
            else {
                matchMedia.removeEventListener('change', handleChange);
            }
        };
    }, [query]);
    return matches;
}
exports.default = useMediaQuery;
