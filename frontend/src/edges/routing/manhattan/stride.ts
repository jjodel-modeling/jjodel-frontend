import { EdgeBendingMode, Log } from '../../../joiner';

export function svgLetterSize(
    s: string,
    addM: boolean = true,
    doublingMidPoints: boolean = true,
): { first: number; others: number } {
    let ret: { first: number; others: number };
    switch (s) {
        default: ret = Log.exDevv("unexpected svg path letter: \"" + s + "\"", s); break;
        case EdgeBendingMode.Line:
        //case EdgeBendingMode.Bezier_quadratic_mirrored:
            ret = {first:1, others:1}; break;
        case EdgeBendingMode.Bezier_quadratic:
        //case EdgeBendingMode.Bezier_cubic_mirrored:
            ret = {first:2, others:2}; break;
        case EdgeBendingMode.Bezier_cubic: ret = {first:3, others:3}; break;
        case EdgeBendingMode.Elliptical_arc: ret = {first:4, others:4}; break;

        case EdgeBendingMode.Bezier_QT: ret = {first:2, others:1}; break;
        case EdgeBendingMode.Bezier_CS: ret = {first:3, others:2}; break;
    }

    // account for the fact that every midpoint is listed twice: at anchor start and anchor end.
    if (doublingMidPoints) {
        // removing last point (first is already excluded because addM didn't trigger yet)
        // , the remaining are midpoints to double. then i add it back
        ret.first = (ret.first - 1) * 2 + 1;
        ret.others = (ret.others - 1) * 2 + 1;
    }

    // account for the first M letter
    //    (if the segment is not mode.gap or first, M coord still exist in segment but are ignored)
    if (addM) {
        ret.first += 1;
        ret.others += 1;
    }
    return ret;
}
