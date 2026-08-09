/**
 * InfoTooltip Component
 *
 * Inline info icon with a hover tooltip, shown beside a form field label.
 *
 * Born from the voce 5 hygiene consolidation (D-5-1): four byte-identical local
 * copies lived in `editors/Info.tsx:64`, `editors/views/data/InfoData.tsx:33`,
 * `editor-v2/viewpoint/authoring/irTabs.tsx:66` and
 * `viewParenting/ViewParentingFields.tsx:33`, none of them exported. The mandate was
 * identical rendering, proven by md5 rather than by eye, so the body below is
 * character-identical to those four copies — including its 4-space indentation and
 * the inline `{ text: string }` signature, which is deliberately NOT rewritten as
 * `props: InfoTooltipProps`. That rewrite is safe to do once the md5 proof stops
 * being load-bearing; doing it here would have broken the proof.
 *
 * The `jj-info-icon-wrapper` / `jj-info-icon` / `jj-info-tooltip` classes are global
 * and defined in `components/editors/info-improvements.scss:975-1015`. They are
 * internal API and deliberately NOT migrated to a CSS Module: the mandate is
 * identical rendering, and this component therefore is not self-contained on the
 * style side — it relies on that stylesheet reaching the global bundle, exactly as
 * the four call sites already did. Entry into the design-system showcase is deferred
 * to point 4 of the DS sequence.
 *
 * @example
 * <InfoTooltip text="Display name of this view" />
 */

import { useState } from 'react';

export type InfoTooltipProps = {
  /**
   * Tooltip body, revealed on hover.
   */
  text: string;
};

export function InfoTooltip(props: { text: string }) {
    const [show, setShow] = useState(false);
    return (
        <span className="jj-info-icon-wrapper"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <span className="jj-info-icon">i</span>
            {show && <span className="jj-info-tooltip">{props.text}</span>}
        </span>
    );
}

export default InfoTooltip;
