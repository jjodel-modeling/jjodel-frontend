/** Plain-text tables for the command line: one line per row, widths from the visible content. */

export const CELL_MAX = 60;

/** Code points, so a multi-byte character counts once; control characters become '?' so a row stays one line. */
const clean = (s) => String(s).replace(/[\u0000-\u001f\u007f]/g, '?');
const width = (s) => [...s].length;

/** A cell of at most `max` visible characters; a longer one keeps its tail behind a leading ellipsis. */
export function fit(s, max = CELL_MAX) {
  const c = clean(s);
  const chars = [...c];
  return chars.length <= max ? c : '…' + chars.slice(chars.length - (max - 1)).join('');
}

/** The first toplevel and a count of the others (`/Users/x/repo +3 more`), within `max` characters. */
export function toplevelsCell(toplevels, max = CELL_MAX) {
  if (!toplevels.length) return '-';
  const more = toplevels.length > 1 ? ` +${toplevels.length - 1} more` : '';
  return fit(toplevels[0], max - more.length) + more;
}

/** The lines of a table: every cell fitted to `max`, columns padded to their widest cell, two spaces apart. */
export function tableLines(table, max = CELL_MAX) {
  const rows = table.map((row) => row.map((c) => fit(c, max)));
  const widths = rows[0].map((_, i) => Math.max(...rows.map((row) => width(row[i]))));
  return rows.map((row) => row.map((c, i) => c + ' '.repeat(widths[i] - width(c))).join('  ').trimEnd());
}
