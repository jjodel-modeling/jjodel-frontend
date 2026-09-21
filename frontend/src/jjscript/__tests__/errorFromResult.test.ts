import { describe, it, expect } from 'vitest';
import { errorFromResult, parseError } from '../executor/errors';

/**
 * The result `create.ts` returns for `create containment stages in Pipeline type PipelineStage`
 * when `PipelineStage` does not exist. Copied from the `TYPE_CLAUSE_RULES.reference` entry
 * (`executor/commands/create.ts:558-565`) and the failure at `:660-670`.
 */
const PIPELINE_RESULT = {
    message: "Unknown type 'PipelineStage' for reference 'stages'. Expected a class.",
    errors: [{
        code: 'UNKNOWN_REFERENCE_TYPE',
        message: "'PipelineStage' is not a class reachable from this metamodel",
        suggestion: 'Use an existing class. A reference cannot point at an enum or a primitive. Qualify as Metamodel::Name if needed.',
    }],
};

describe('errorFromResult', () => {
    it('shows the executor sentence for the reported case, not the guess from its keywords', () => {
        const err = errorFromResult(PIPELINE_RESULT, 'create containment stages in Pipeline type PipelineStage');
        expect(err.message).toBe("Unknown type 'PipelineStage' for reference 'stages'. Expected a class.");
        expect(err.message).not.toContain('is not a supported element type');
        expect(err.suggestion).toContain('Use an existing class');
    });

    it('is a real change: parseError on the same message says something else entirely', () => {
        // The control for the test above. Remove it and the first test could pass against a
        // parseError that happened to be right.
        const guessed = parseError(PIPELINE_RESULT.message, 'create containment stages in Pipeline type PipelineStage');
        expect(guessed.code).toBe('UNKNOWN_ELEMENT_TYPE');
        expect(guessed.message).toContain('is not a supported element type');
    });

    it('falls back to parseError when the result carries no structured error', () => {
        const message = "Class 'Person' not found.";
        const fallback = errorFromResult({ message }, 'delete class Person');
        expect(fallback).toEqual(parseError(message, 'delete class Person'));
    });

    it('falls back to parseError for a null or undefined result', () => {
        expect(errorFromResult(undefined, 'create class X').message).toBe('Unknown error');
        expect(errorFromResult(null, 'create class X').code).toBe('OPERATION_FAILED');
    });

    it('carries a handler code that JjScriptErrorCode knows', () => {
        const err = errorFromResult({
            message: "Element 'Person' not found.",
            errors: [{ code: 'ELEMENT_NOT_FOUND', message: 'nope' }],
        });
        expect(err.code).toBe('ELEMENT_NOT_FOUND');
        expect(err.message).toBe("Element 'Person' not found.");
    });

    it('carries an unknown handler code as OPERATION_FAILED, keeping the sentence', () => {
        // WRONG_LEVEL is one of the 77 codes `errors.ts` does not know. The dialog never
        // renders the code, so only the message and the suggestion have to survive.
        const err = errorFromResult({
            message: "'create class' modifies the metamodel. Open a metamodel editor (M2).",
            errors: [{ code: 'WRONG_LEVEL', message: 'Open a metamodel editor (M2).' }],
        });
        expect(err.code).toBe('OPERATION_FAILED');
        expect(err.message).toBe("'create class' modifies the metamodel. Open a metamodel editor (M2).");
    });

    it('keeps the error skippable, as parseError did for every non-timeout case', () => {
        expect(errorFromResult(PIPELINE_RESULT).skippable).toBe(true);
        expect(errorFromResult({ message: 'x', errors: [{ code: 'WRONG_LEVEL', message: 'x' }] }).skippable).toBe(true);
    });

    it('uses the handler message when the result has no message of its own', () => {
        const err = errorFromResult({ errors: [{ code: 'SET_ERROR', message: 'the slot refused the value' }] });
        expect(err.message).toBe('the slot refused the value');
    });

    it('keeps the canned suggestion when the handler offers none', () => {
        const err = errorFromResult({
            message: "Element 'Person' not found.",
            errors: [{ code: 'ELEMENT_NOT_FOUND', message: 'nope' }],
        });
        expect(err.suggestion).toBe('Make sure the element exists or was created earlier in the script.');
    });
});
