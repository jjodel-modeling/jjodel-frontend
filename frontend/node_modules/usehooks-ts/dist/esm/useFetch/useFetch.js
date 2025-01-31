var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useReducer, useRef } from 'react';
function useFetch(url, options) {
    const cache = useRef({});
    const cancelRequest = useRef(false);
    const initialState = {
        error: undefined,
        data: undefined,
    };
    const fetchReducer = (state, action) => {
        switch (action.type) {
            case 'loading':
                return Object.assign({}, initialState);
            case 'fetched':
                return Object.assign(Object.assign({}, initialState), { data: action.payload });
            case 'error':
                return Object.assign(Object.assign({}, initialState), { error: action.payload });
            default:
                return state;
        }
    };
    const [state, dispatch] = useReducer(fetchReducer, initialState);
    useEffect(() => {
        if (!url)
            return;
        cancelRequest.current = false;
        const fetchData = () => __awaiter(this, void 0, void 0, function* () {
            dispatch({ type: 'loading' });
            if (cache.current[url]) {
                dispatch({ type: 'fetched', payload: cache.current[url] });
                return;
            }
            try {
                const response = yield fetch(url, options);
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
                const data = (yield response.json());
                cache.current[url] = data;
                if (cancelRequest.current)
                    return;
                dispatch({ type: 'fetched', payload: data });
            }
            catch (error) {
                if (cancelRequest.current)
                    return;
                dispatch({ type: 'error', payload: error });
            }
        });
        void fetchData();
        return () => {
            cancelRequest.current = true;
        };
    }, [url]);
    return state;
}
export default useFetch;
