/**
 * displayJson — `JSON.stringify` for a value the code panel shows, safe on a JjEL bit-vector (P-2026-10-21-0715).
 *
 * A bit-vector carries its payload as a `bigint`, which `JSON.stringify` refuses. A vector that crossed the run
 * worker is a structured clone, so it has lost the `toJSON` of its class and the render threw. Here a bit-vector
 * prints in its Verilog form (`8'hff`) and any other `bigint` as its decimal text, both bare, at any depth; every
 * other value prints exactly as `JSON.stringify(value, null, indent)` prints it, `undefined` included.
 */

import { isBitVector } from '../../jjel/evaluator/context';
import { toVerilog } from '../../jjel/evaluator/builtins/bitvectors';

// A private-use code point: JSON.stringify leaves it unescaped, so a marked string survives to the unquoting pass.
const MARK = '';
const MARKED = new RegExp(`"${MARK}([^"${MARK}]*)${MARK}"`, 'g');

export function displayJson(value: unknown, indent?: number): string | undefined {
    let marked = false;
    const text = JSON.stringify(value, function (this: Record<string, unknown>, key: string, v: unknown) {
        // The holder's own value, read before `toJSON` ran, so a live vector and a cloned one print alike.
        const raw = this[key];
        if (isBitVector(raw)) {
            marked = true;
            return MARK + toVerilog(raw) + MARK;
        }
        if (typeof v === 'bigint') {
            marked = true;
            return MARK + v.toString() + MARK;
        }
        return v;
    }, indent);
    return marked && text !== undefined ? text.replace(MARKED, '$1') : text;
}
