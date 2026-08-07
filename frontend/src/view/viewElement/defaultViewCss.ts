/**
 * defaultViewCss — the factory CSS every DViewElement is born with.
 *
 * Extracted verbatim from the `DViewElement` constructor in `joiner/classes.ts`,
 * which used to build this text by string concatenation inline. Nothing about the
 * value changed: the string literals are the same ones, in the same order, so the
 * css a freshly created view carries is byte-identical to before.
 *
 * It lives in its own leaf module (no imports, so it cannot close an import cycle)
 * because a second reader now needs the exact same text: `utils/globalCssAudit.ts`
 * compares a view's css against this baseline to tell an authored css from an
 * untouched one. Keeping two copies would have been a silent failure: an edit here
 * would leave the audit comparing against a stale baseline, every view would look
 * author-modified, and the warning would fire on every project.
 *
 * The block carries twelve `!important` declarations. That is not incidental: with
 * `cssIsGlobal` on, they are what repaints elements this view never matched. See
 * `docs/discovery/discovery_2026-08-07_style_window_channel.md`.
 */
export const DEFAULT_VIEW_CSS: string =
    "\n/* placeholder justification, add .center, .left, .start, .right, or .end in the <Input /> container */\n\n" +

    "input:placeholder-shown {\n" +
    "  width: 120px !important;\n" +
    "  font-style: italic !important;\n" +
    "  text-align: right;\n" +
    "  left: -120px !important;\n" +
    "}\n\n" +

    ".center {\n" +
    "  & input:placeholder-shown {\n" +
    "    width: 120px !important;\n" +
    "    font-style: italic !important;\n" +
    "    text-align: center;\n" +
    "    left: -60px !important;\n" +
    "  }\n" +
    "}\n\n" +

    ".left, .start {\n" +
    "  & input:placeholder-shown {\n" +
    "    width: 120px !important;\n" +
    "    font-style: italic !important;\n" +
    "    text-align: left;\n" +
    "    left: 0 !important;\n" +
    "  }\n" +
    "}\n\n" +

    ".right, .end {\n" +
    "  & input:placeholder-shown {\n" +
    "    width: 120px !important;\n" +
    "    font-style: italic !important;\n" +
    "    text-align: right;\n" +
    "    left: -120px !important;\n" +
    "  }\n" +
    "}\n\n" +

    ".input-container {\n" +
    "   & select {\n" +
    "        border: none;\n" +
    "        text-align: right;\n" +
    "     }\n" +
    "}\n\n" +

    "&,[data-nodetype], [data-nodetype]>.visible{ /* corresponds to \"overflow: visible\" */   \n" +
    "   overflow: visible;\n" +
    "}\n\n";
