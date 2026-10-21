/**
 * Composed cases of the Verilog printer (slice S-D0, test (b)): expressions
 * where a Verilog context would change the value of an unwrapped operand
 * (the width trap, IEEE 1800-2017 §11.6). Every row of `bv-cases.json` holds
 * one operator, so these are the oracle of the wrapping rule. `printer.test.ts`
 * checks `text` and computes `value` with the S1 evaluator;
 * `scripts/oracle/bv-printer-verilator.mjs` compiles `text` and compares with
 * `value`. The comment of each case names the mutation it kills.
 */

export interface ComposedCase {
    readonly name: string;
    readonly jjel: string;
    /** Operands: name -> [width, signed, hex bits]. */
    readonly vars: Readonly<Record<string, readonly [number, boolean, string]>>;
    /** The printed text, operands named as in `vars`. */
    readonly text: string;
    /** The S1 value: hex padded to the result width, `1`/`0` for a boolean. */
    readonly value: string;
}

export const COMPOSED_CASES: readonly ComposedCase[] = [
    // The carry of an unwrapped `a + b` survives in the 16-bit context.
    { name: 'zext of a sum', jjel: '(a + b).zext(16)', vars: { a: [8, false, 'ff'], b: [8, false, '02'] }, text: '{a + b}', value: '0001' },
    { name: 'a sum with a carry compared', jjel: '(a + b) == c', vars: { a: [8, false, 'ff'], b: [8, false, '02'], c: [8, false, '01'] }, text: '{a + b} == c', value: '1' },
    { name: 'slice of a shift', jjel: '(a.shl(1)).slice(8, 1)', vars: { a: [12, false, '8ff'] }, text: "8'({a << 32'd1} >> 32'd1)", value: 'ff' },
    // Without `$signed` the wrapped sum is zero-extended.
    { name: 'sext of a signed sum', jjel: '(a + b).sext(16)', vars: { a: [8, true, '7f'], b: [8, true, '01'] }, text: '$signed({a + b})', value: 'ff80' },
    // Without the cast `>>>` is logical on the unsigned sum.
    { name: 'ashr of an unsigned sum', jjel: '(a + b).ashr(1)', vars: { a: [8, false, 'ff'], b: [8, false, '81'] }, text: "$signed({a + b}) >>> 32'd1", value: 'c0' },
    // Without the size cast `$signed(a)` meets an unsigned operand and is zero-extended.
    { name: 'sext as an operand', jjel: 'a.sext(16) + b', vars: { a: [8, false, '80'], b: [16, false, '0001'] }, text: "{16'($signed(a))} + b", value: 'ff81' },
    // Without `$signed` on the wrap the comparison is unsigned.
    { name: 'signed comparison of a sum', jjel: '(a + b) < c', vars: { a: [8, true, '7f'], b: [8, true, '01'], c: [8, true, '00'] }, text: '$signed({a + b}) < c', value: '1' },
    // Without the size cast the operand is sign-extended; without `$signed` the comparison is unsigned.
    { name: 'zext of a signed word compared', jjel: 'a.zext(16) > b', vars: { a: [8, true, '80'], b: [16, true, 'ffff'] }, text: "$signed({16'($unsigned(a))}) > b", value: '1' },
    // Without the size cast the branch is zero-extended by the conditional.
    { name: 'sext in a branch', jjel: 'if a < b then (a + b).sext(16) else c', vars: { a: [8, false, '01'], b: [8, false, '7f'], c: [16, false, '1234'] }, text: "(a < b) ? {16'($signed({a + b}))} : c", value: 'ff80' },
    // Without the size cast the truncated bits come back.
    { name: 'zext of a truncated sum', jjel: '(a + b).trunc(4).zext(8)', vars: { a: [8, false, '0f'], b: [8, false, '01'] }, text: "{4'(a + b)}", value: '00' },
    { name: 'bit of an expression', jjel: '(a.xor(b)).bit(4)', vars: { a: [8, false, '1f'], b: [8, false, '01'] }, text: "1'({a ^ b} >> 32'd4)", value: '1' },
    { name: 'concat of a sum', jjel: '(a + b).concat(c)', vars: { a: [8, false, 'ff'], b: [8, false, '02'], c: [4, false, 'a'] }, text: '{{a + b}, c}', value: '01a' },
    // Unwrapped, the signed `a` is sign-extended before the logical shift.
    { name: 'sext of a logical shift of a signed word', jjel: 'a.shr(1).sext(16)', vars: { a: [8, true, '80'] }, text: "$signed({a >> 32'd1})", value: '0040' },
];
