/**
 * JjEL Evaluator - Public Exports
 */

export { JjelEvaluator, JjelEvaluationError, evaluate } from './evaluator';
export {
    EvaluationContext,
    TypeRegistry,
    createFunction,
    isJjelFunction,
    isJjelObject,
    toJjelValue,
    fromJjelValue
} from './context';
export type { JjelValue, JjelObject, JjelFunction, JjelWarning } from './context';

// Re-export builtins for advanced usage
export {
    getCollectionMethod,
    getStringMethod,
    getNumberMethod,
    getDateMethod,
    getDateConstructor
} from './builtins';
