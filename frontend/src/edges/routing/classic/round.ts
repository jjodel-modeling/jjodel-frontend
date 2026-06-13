/**
 * Quadratic-fillet rounding for axis-aligned Manhattan paths. Extracted VERBATIM from
 * `LVoidEdge.roundManhattanCorners` (`model/dataStructure/GraphDataElements.tsx`) so the native
 * classic edges and the isEdge `EdgeOverlay` share one implementation and one radius (R=5).
 *
 * Each interior corner Pi between two axis-aligned legs becomes a quadratic fillet: a straight `L`
 * up to r before Pi, then `Q Pi <point r after Pi>`, with r = min(R, half each adjacent leg) so the
 * arc never overshoots the shorter leg. P0 and Pn are kept unchanged; degenerate or collinear
 * corners emit a plain `L`. Defensive gate: only a pure absolute M/L polyline is rounded — any other
 * SVG command returns `d` untouched. Pure string -> string, no state.
 */
export function roundManhattanCorners(d: string, R: number = 5): string {
    const letters = d.match(/[a-zA-Z]/g);
    if (!letters || letters.some(ch => ch !== 'M' && ch !== 'L')) return d;
    // Tokenize on spaces and commas; the moveto glues its letter to the first number ("M100 200,"),
    // so split a leading command letter off its token before reading coordinate pairs.
    const flat: string[] = [];
    for (const t of d.trim().split(/[\s,]+/)) {
        if (!t) continue;
        const m = /^([ML])(.*)$/.exec(t);
        if (m) { flat.push(m[1]); if (m[2]) flat.push(m[2]); }
        else flat.push(t);
    }
    const P: { x: number, y: number }[] = [];
    for (let j = 0; j < flat.length;) {
        if (flat[j] === 'M' || flat[j] === 'L') {
            const x = parseFloat(flat[j + 1]), y = parseFloat(flat[j + 2]);
            if (Number.isFinite(x) && Number.isFinite(y)) P.push({ x, y });
            j += 3;
        } else j += 1;
    }
    if (P.length < 3) return d; // straight or single leg: no interior corner to fillet
    let out = `M ${P[0].x} ${P[0].y}`;
    for (let i = 1; i < P.length - 1; i++) {
        const prev = P[i - 1], cur = P[i], next = P[i + 1];
        const inX = cur.x - prev.x, inY = cur.y - prev.y;
        const outX = next.x - cur.x, outY = next.y - cur.y;
        const lenIn = Math.hypot(inX, inY), lenOut = Math.hypot(outX, outY);
        const cross = inX * outY - inY * outX;
        if (lenIn === 0 || lenOut === 0 || Math.abs(cross) < 1e-6) { // degenerate or collinear
            out += ` L ${cur.x} ${cur.y}`;
            continue;
        }
        const r = Math.min(R, lenIn / 2, lenOut / 2);
        const ax = cur.x - (inX / lenIn) * r, ay = cur.y - (inY / lenIn) * r;
        const bx = cur.x + (outX / lenOut) * r, by = cur.y + (outY / lenOut) * r;
        out += ` L ${ax} ${ay} Q ${cur.x} ${cur.y} ${bx} ${by}`;
    }
    const last = P[P.length - 1];
    out += ` L ${last.x} ${last.y}`;
    return out;
}
