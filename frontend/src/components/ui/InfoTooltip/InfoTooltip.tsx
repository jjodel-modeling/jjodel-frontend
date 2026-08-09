/**
 * InfoTooltip Component
 *
 * Inline info icon with a hover tooltip, shown beside a form field label.
 *
 * Born from the voce 5 hygiene consolidation (D-5-1): four byte-identical local
 * copies lived in `editors/Info.tsx:64`, `editors/views/data/InfoData.tsx:33`,
 * `editor-v2/viewpoint/authoring/irTabs.tsx:66` and
 * `viewParenting/ViewParentingFields.tsx:33`, none of them exported. That commit
 * carried the body over character-identical, md5 and all, so the extraction could be
 * proven rather than eyeballed; this one restyles it once, in the single place.
 *
 * D-5-2 gives it the dark panel of the traceability dashboard and an optional `title`
 * line. `title` is API, not yet exercised: none of the four call sites passes it today.
 * The dashboard's status badge is deliberately NOT part of the primitive — it carries
 * R→D→I→P→C coverage semantics that belong to the dashboard, not to a tooltip.
 *
 * The `jj-info-*` classes stay global and keep their names (internal API, D-5-1), but
 * their rules now live in `InfoTooltip.scss` next to this file instead of in
 * `components/editors/info-improvements.scss`: the component is self-contained on the
 * style side, which it was not before. Entry into the design-system showcase is still
 * deferred to point 4 of the DS sequence.
 *
 * The panel is anchored to the RIGHT of the icon and vertically centred, which is where
 * it already was — not above it as in the dashboard screenshot. All four call sites sit
 * inside a scroll container, so an upward panel would be clipped; the measurement is in
 * `docs/discovery/discovery_2026-08-09_infotooltip_ui_consolidation.md` §A2, the choice
 * is option A of §A4.
 *
 * @example
 * <InfoTooltip text="Display name of this view" />
 * <InfoTooltip title="Path style" text="How the L2 overlay draws this edge." />
 */

import { useState } from 'react';
import './InfoTooltip.scss';

export type InfoTooltipProps = {
  /**
   * Tooltip body, revealed on hover.
   */
  text: string;

  /**
   * Optional bold line above the body. Omit it for a body-only tooltip, which is what
   * every call site does today.
   */
  title?: string;
};

export function InfoTooltip(props: { text: string; title?: string }) {
    const [show, setShow] = useState(false);
    return (
        <span className="jj-info-icon-wrapper"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <span className="jj-info-icon">i</span>
            {show && (
                <span className="jj-info-tooltip" role="tooltip">
                    {props.title && <span className="jj-info-tooltip-title">{props.title}</span>}
                    <span className="jj-info-tooltip-text">{props.text}</span>
                </span>
            )}
        </span>
    );
}

export default InfoTooltip;
