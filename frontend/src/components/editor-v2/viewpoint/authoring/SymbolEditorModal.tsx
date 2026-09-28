/**
 * SymbolEditorModal — the modal surface of the symbol authoring (D15/D15b, 1b shell).
 *
 * Canonical cross-cutting pattern (CLAUDE.md 8.7, cf. ImportSummaryModal):
 * mounted once at the app root, CustomEvent dispatcher + local useState
 * listener, no Redux state.
 *
 * Since slice 4b the scene is the 1b shell. The persistent catalog column is
 * GONE: the catalog is reached through the preset chip in the header, which
 * opens it as a popover (D7), and the 264px it freed go to the panel — that is
 * the whole point of the change, not a side effect. The body is
 * `section nav (170px) | main`, the nav showing ONE section of the re-hosted
 * panel at a time with a count badge where an axis carries rules, and
 * «Revert to preset» has moved out of the header into the footer beside «Done».
 * The main pane keeps the realistic preview strip above VertexAuthoringPanel
 * re-hosted UNCHANGED (same component, no editorial fork: the Editor V3 lesson),
 * now driven by one more prop, `activeSection`.
 *
 * Since slice 5 the strip is MULTI-INSTANCE (D8): up to three real canvas nodes of
 * this view, in DOM order, active pane only, each tile drawn with the axes THAT
 * instance resolves to and captioned with the rule that won on it — or with its own
 * size, on a section where size is the point. The resolution and the caption live in
 * `previewInstances.ts`, pure and tested; this file wires the boxes, the ReadCtx and
 * the tiles. With no instance on canvas the strip is the symbolic replica it has
 * always been, now drawing a conditional form's fallback glyph instead of refusing
 * (D8-b).
 *
 * Writing stays live: applying a preset and «Revert to preset» go through the
 * same canonical whole-object set_ir the panel uses; the hosted panel realigns
 * through its own external-change reseed. «Modified from X» is session state
 * of this modal (memo D14), never persisted. Closing unmounts the panel,
 * which flushes its pending edit itself.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { LPointerTargetable, store, U, type LViewElement } from '../../../../joiner';
import { JjodelEvents } from '../../../../events/registry';
import { recognizeSymbol } from '../ir/symbolRecognition';
import { applyPresetToShape, type SymbolPreset } from '../ir/notationCatalog';
import type { VertexViewIR } from '../ir/irTypes';
import { toRules } from '../../../ui/ConditionalEditor/conditional';
import { VertexAuthoringPanel } from './VertexAuthoringPanel';
import { SymbolCatalogPicker } from './SymbolCatalogPicker';
import { borderOverrideRows } from './borderOverrides';
import SymbolPreview from './SymbolPreview';
import { SymbolBoxPreview, captionForBox } from './SymbolBoxPreview';
import { resolvePreviewInstances, thumbnailCornerRadius, type ResolvedPreviewInstance } from './previewInstances';
import { makeReadCtx } from '../ir/irReadCtxLproxy';
import { useCanvasNodeBoxes } from './useCanvasNodeBox';
import { readVertexLayout, type VertexLayoutSource } from '../layout/vertexLayout';
import { getLayoutKeyOf } from '../layout/vertexLayoutAdapter';
import { IR_SECTION_LABELS, IR_TAB_LABELS, type IRSectionId, type IRTabId } from './irTabs';
import './SymbolEditorModal.scss';

/**
 * One entry of the 170px section nav (1b). `section` absent means the entry shows a
 * whole BODY instead of one section of it, which is what Text is: its three sections
 * (General, Symbol text, Labels) are one subject and the spec lists them as one name.
 */
interface NavEntry {
    key: string;
    label: string;
    tab: IRTabId;
    section?: IRSectionId;
}

/**
 * The sections of the Appearance body, in nav order. `padding` is Advanced-only in the
 * panel, so the entry that would show an unrendered section is filtered out below
 * rather than left to point at nothing.
 */
const NAV_SECTIONS: readonly IRSectionId[] = [
    'symbol', 'fill', 'border', 'padding', 'marker', 'sizing', 'badges',
];

/**
 * Stage bounds of the preview strip (D8 wiring). The strip keeps its FIXED
 * 132px height (no layout shifts): a large box scales down to fit these
 * bounds, it never stretches the strip. Height leaves room for the Preview
 * tag above and the caption below; width stays inside the main pane.
 */
const PREVIEW_MAX_W = 560;
const PREVIEW_MAX_H = 88;

/**
 * How many real instances the strip draws (D8) and the gap between two tiles, which
 * must stay equal to the `gap` of `&__preview-strip` in SymbolEditorModal.scss: the
 * width each tile gets is `(PREVIEW_MAX_W - gaps) / n`, so three tiles occupy exactly
 * the width one tile occupied before. The strip's own bounds never change with the
 * count (D8-e).
 */
const PREVIEW_MAX_INSTANCES = 3;
const PREVIEW_TILE_GAP = 16;

/**
 * Recents (D18): per-project preset ids, most recent first, persisted in
 * localStorage under the documented key idiom (cf. EditorSwitch,
 * `jjodel.editorPrefs.${modelid}`). Modal state is the source of truth while
 * the app runs; storage is read on every open (the project can differ between
 * opens) and written on every apply. Storage failures (privacy mode, quota)
 * are swallowed: recents are a convenience, never load-bearing. Ids are
 * resolved against the catalog at render, so stale ids simply disappear.
 */
const RECENTS_KEY_PREFIX = 'jjodel.symbolRecents.';
const RECENTS_CAP = 6;

function readRecents(projectId: string | null): string[] {
    if (!projectId) return [];
    try {
        const raw = localStorage.getItem(RECENTS_KEY_PREFIX + projectId);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((x): x is string => typeof x === 'string').slice(0, RECENTS_CAP);
    } catch {
        return [];
    }
}

function writeRecents(projectId: string | null, ids: readonly string[]): void {
    if (!projectId) return;
    try {
        localStorage.setItem(RECENTS_KEY_PREFIX + projectId, JSON.stringify(ids));
    } catch {
        // best-effort persistence, the in-memory state keeps working
    }
}

/**
 * The current authored axes as a preset VALUE for SymbolPreview.
 *
 * The form is the scalar when there is one, and the conditional's FALLBACK otherwise
 * (D8-b): the `else` of a `{when, then, else}`, the `default` of a `{rules, default}`,
 * `'rect'` when neither is written — the same fallback `compileConditional` receives
 * at `irCompile.ts:305`. `toRules` normalizes all three shapes to that one field.
 * Drawing that glyph is honest where refusing to draw was not: it is exactly what an
 * instance matching no rule renders as on the canvas, so the symbolic strip now shows
 * a symbol instead of «Conditional form: no static preview».
 *
 * Conditional marker/fill are still simply omitted: the strip previews the scalar
 * baseline, and the per-instance values live on the tiles.
 */
function currentAxesPreset(shape: VertexViewIR['shape']): SymbolPreset {
    return {
        id: '__current-axes',
        label: '',
        notation: '',
        values: {
            form: toRules(shape.form).default ?? 'rect',
            // Scalar or omitted (slice 2), like marker and fill above: a conditional axis
            // has no single value the static strip could preview, and the preset shape
            // wants both style and width together.
            border: (typeof shape.border?.style === 'string' && typeof shape.border?.width === 'number')
                ? { style: shape.border.style, width: shape.border.width }
                : undefined,
            marker: typeof shape.marker === 'string' && shape.marker !== '' ? shape.marker : undefined,
            fill: typeof shape.fill === 'string' && shape.fill !== '' ? shape.fill : undefined,
        },
    };
}

/**
 * One instance's RESOLVED axes as a preset VALUE, the shape SymbolBoxPreview draws.
 * No conditional survives here: `previewInstances` has already evaluated every axis
 * against this instance through the same `ReadCtx` the canvas uses.
 *
 * `border` travels as a pair because the preset shape wants both together, so an
 * author who varied only the width still gets the width they wrote, with the style
 * on the canvas default. Absent on BOTH axes leaves `border` out, which is what keeps
 * the CSS box's own `1px solid` in force — the same fallback IRNodeContent leaves.
 */
function instanceAxesPreset(r: ResolvedPreviewInstance): SymbolPreset {
    const hasBorder = r.borderWidth !== undefined || r.borderStyle !== undefined;
    return {
        id: '__instance-axes',
        label: '',
        notation: '',
        values: {
            form: r.form,
            border: hasBorder ? { style: r.borderStyle ?? 'solid', width: r.borderWidth ?? 1 } : undefined,
            marker: typeof r.marker === 'string' && r.marker !== '' ? r.marker : undefined,
            fill: typeof r.fill === 'string' && r.fill !== '' ? r.fill : undefined,
        },
    };
}

export const SymbolEditorModal: React.FC = () => {
    const [viewId, setViewId] = useState<string | null>(null);
    // The nav entry in force. One piece of state for both the tab and the section:
    // they are two projections of one choice, and keeping them apart would let them
    // disagree (a section of Appearance selected while the Text body is showing).
    const [navKey, setNavKey] = useState<string>('symbol');
    // «Modified from X» (memo D14): remembered only after an application in
    // THIS modal session; reset on every open.
    const [lastApplied, setLastApplied] = useState<SymbolPreset | null>(null);
    // Recents (D18): reloaded per project on open, NOT reset like lastApplied.
    const [recentIds, setRecentIds] = useState<readonly string[]>([]);
    // Catalog popover (D7) and its preservation flag, both session state of one
    // opening. `keepRules` is checked by default, as the mockup has it.
    const [pickerOpen, setPickerOpen] = useState(false);
    const [keepRules, setKeepRules] = useState(true);
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<{ viewId?: string }>).detail;
            if (detail?.viewId) {
                setViewId(detail.viewId);
                setNavKey('symbol');
                setLastApplied(null);
                setPickerOpen(false);
                setKeepRules(true);
                setRecentIds(readRecents(U.getProjectID_URL()));
            }
        };
        window.addEventListener(JjodelEvents.SYMBOL_EDITOR_OPEN, handler);
        return () => window.removeEventListener(JjodelEvents.SYMBOL_EDITOR_OPEN, handler);
    }, []);

    // Esc closes. The hosted panel flushes its pending valid edit on unmount,
    // so closing loses nothing (criterion d of the D15 prompt).
    useEffect(() => {
        if (!viewId) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            // The popover is the inner layer: Escape dismisses IT first, and only a
            // second Escape closes the modal. Closing both at once would throw away
            // the author's place for one keystroke they meant for the catalog.
            if (pickerOpen) setPickerOpen(false);
            else setViewId(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [viewId, pickerOpen]);

    useEffect(() => {
        if (viewId && closeBtnRef.current) closeBtnRef.current.focus();
    }, [viewId]);

    // Read-only subscription on the raw ir: header, preview and recognition
    // follow the live edits the hosted panel commits. No write path here
    // besides the canonical set_ir of apply/revert below.
    const ir = useSelector((s: any): VertexViewIR | undefined =>
        viewId ? s?.idlookup?.[viewId]?.ir : undefined);

    // Disclosure mode, read-only, exactly as the hosted panel reads it: the nav must
    // not offer Padding when the panel does not render it.
    const advanced = useSelector((s: any) => !!s.advanced);

    // Realistic preview (D8): the boxes of the canvas nodes rendering this view, in
    // DOM order, active pane only, read from the DOM (the canvas stays mounted under
    // the modal). Up to three — the strip draws one tile each.
    const boxes = useCanvasNodeBoxes(viewId, PREVIEW_MAX_INSTANCES);
    // Per-vertex facts, as ONE primitive signature (D8-d): the subscription must not
    // re-render the modal on unrelated store updates, and an object is not a
    // signature. Per vertex it joins the manual size of the layout in force (slice 1c:
    // the size to show is the layout's, not the seed's, and reading the key here makes
    // the signature move at a layout change with no extra dependency), the object id,
    // and that object's feature-slot snapshot — the last one is what makes a caption
    // follow an edit to the very attribute its predicate reads. Same shape and same
    // reason as the selector of useIRView (irResolve.ts:49-72).
    const instanceSig = useSelector((s: any): string => {
        const lookup = s?.idlookup ?? {};
        const layoutKey = getLayoutKeyOf(s);
        const parts: string[] = [];
        for (const b of boxes) {
            const raw = lookup[b.vertexId];
            const eff = readVertexLayout((raw ?? {}) as VertexLayoutSource, layoutKey);
            const w = typeof eff.w === 'number' && eff.w > 0 ? eff.w : 0;
            const h = typeof eff.h === 'number' && eff.h > 0 ? eff.h : 0;
            const manual = eff.isResized ? `${w}x${h}` : '';
            const objectId = typeof raw?.model === 'string' ? raw.model : '';
            const dObject = objectId ? lookup[objectId] : undefined;
            const feats: string[] = [];
            if (Array.isArray(dObject?.features)) {
                for (const fid of dObject.features) {
                    const dv = lookup[fid];
                    if (dv && Array.isArray(dv.values)) feats.push(`${fid}=${JSON.stringify(dv.values)}`);
                }
            }
            parts.push(`${b.vertexId}|${manual}|${objectId}|${dObject?.name ?? ''}|${feats.join(',')}`);
        }
        return parts.join(';');
    });

    // The DATA behind that signature, READ from the store rather than subscribed to.
    // `makeReadCtx` needs the whole `idlookup`, and a selector returning `idlookup`
    // would re-render this modal on every action in the app — the object is replaced
    // by every write. So the signature above carries the subscription and
    // `store.getState()` carries the read, which is exactly the split useIRView makes
    // (irResolve.ts:103-110). Known v1 limit, inherited and not introduced here: a
    // predicate navigating to ANOTHER object reads it correctly but is not subscribed
    // to it, same as the canvas before cross-deps.
    const instances = useMemo(() => {
        const s: any = store.getState();
        const lookup = s?.idlookup ?? {};
        const layoutKey = getLayoutKeyOf(s);
        const readCtx = makeReadCtx(lookup);
        const inputs: { objectId: string; box: { w: number; h: number }; sizeCaption: string }[] = [];
        for (const b of boxes) {
            const raw = lookup[b.vertexId];
            // Vertex -> object: one plain D-layer field, the same read useIRView makes
            // at irResolve.ts:56 and :108. A vertex without it has no instance to show.
            const objectId = typeof raw?.model === 'string' ? raw.model : '';
            if (!objectId) continue;
            // Per-instance precedence (D8-d), the same the single box applied: a valid
            // manual size of the layout in force wins and switches the derivation off,
            // the DOM box otherwise. A raised isResized with an invalid D-layer size
            // keeps the manual WORD on the DOM numbers — the flag is the user's intent.
            const eff = readVertexLayout((raw ?? {}) as VertexLayoutSource, layoutKey);
            const manualValid = eff.isResized
                && typeof eff.w === 'number' && eff.w > 0
                && typeof eff.h === 'number' && eff.h > 0;
            const box = manualValid ? { w: eff.w as number, h: eff.h as number } : { w: b.w, h: b.h };
            inputs.push({ objectId, box, sizeCaption: captionForBox(box, eff.isResized ? 'manual' : 'derived') });
        }
        return { readCtx, inputs };
    }, [instanceSig, boxes]);

    if (!viewId) return null;

    let view: LViewElement | null = null;
    try { view = LPointerTargetable.fromPointer(viewId) as unknown as LViewElement; } catch { view = null; }
    // View deleted (or ir gone) while the modal is open: nothing to edit.
    if (!view || !ir || ir.kind !== 'vertex') return null;

    const matches = recognizeSymbol(ir.shape);
    const first = matches.length > 0 ? matches[0] : null;
    const notations = [...new Set(matches.map((m) => m.notation))].join(' · ');
    const la = lastApplied;
    const modified = la !== null && !matches.some((m) => m.id === la.id);
    const titleLabel = modified && la ? la.label : first ? first.label : 'Custom symbol';

    const target = Array.isArray(ir.metaclasses) && ir.metaclasses.length > 0 ? ir.metaclasses[0] : null;
    const previewPreset = currentAxesPreset(ir.shape);
    // Corner radius (slice 3): not a preset axis, so it travels beside the preset, and
    // only when written. For the two thumbnails (the chip, the symbolic preview) a rule-driven
    // radius draws its `otherwise` (S6); absent or invalid leaves them on the base radius.
    // The strip resolves the radius per instance instead, through `tiles` below.
    const cornerRadius = thumbnailCornerRadius(ir.shape.cornerRadius);
    const previewLabel = (typeof ir.label === 'string' && ir.label !== '') ? ir.label : (view.name as string);

    const navEntries: NavEntry[] = [
        ...NAV_SECTIONS
            .filter((id) => id !== 'padding' || advanced)
            .map((id): NavEntry => ({
                key: id, label: IR_SECTION_LABELS[id], tab: 'ir-appearance', section: id,
            })),
        { key: 'text', label: IR_TAB_LABELS['ir-text'], tab: 'ir-text' },
    ];
    // A nav key can survive a change that removes its entry (Advanced switched off
    // while Padding was showing), so the entry in force is resolved, never assumed.
    const active = navEntries.find((e) => e.key === navKey) ?? navEntries[0];

    /**
     * The count beside a nav entry. Fill and Marker report `rules.length` of the axis;
     * Border reports the rows of `borderOverrideRows`, the SAME grouping the OVERRIDES
     * table renders — deriving the number a second time here is how the badge and the
     * table would come to disagree. A scalar or absent axis has no rules, so it
     * reports 0 and no badge is drawn.
     */
    const badgeOf = (key: string): number => {
        if (key === 'fill') return toRules(ir.shape.fill).rules.length;
        if (key === 'marker') return toRules(ir.shape.marker).rules.length;
        if (key === 'border') return borderOverrideRows(ir.shape.border).rows.length;
        return 0;
    };

    // The strip, resolved per instance against the section in force (D8-a/D8-b). The
    // caption of a tile is the rule that won on THAT instance where the active section
    // has rules to report, and the size caption everywhere else; both come back
    // composed from the pure helper, which is where they are tested.
    const tiles = resolvePreviewInstances(ir.shape, active.section, instances.readCtx, instances.inputs);
    // Each tile takes its share of the SAME total width (D8-e): three tiles occupy
    // what one occupied, by reduction only, so the strip neither grows nor shifts when
    // the instance count changes.
    const tileMaxW = tiles.length > 0
        ? (PREVIEW_MAX_W - PREVIEW_TILE_GAP * (tiles.length - 1)) / tiles.length
        : PREVIEW_MAX_W;

    // Same canonical write path as the panel (set_ir, whole-object replace);
    // the hosted panel realigns via its external-change reseed.
    const applyPreset = (preset: SymbolPreset) => {
        const current = (view as any).ir as VertexViewIR;
        (view as any).ir = {
            ...current,
            shape: applyPresetToShape(current.shape, preset, { keepRules }),
        };
        setLastApplied(preset);
        // A popover is transient by construction: it sits over the panel it is about,
        // so it closes on the click that did the thing it was opened for. The chip
        // behind it already reads the new preset.
        setPickerOpen(false);
        // Recents (D18): dedupe, most recent first, capped; applying from the
        // strip itself re-applies and moves the preset back to the front.
        setRecentIds((prev) => {
            const next = [preset.id, ...prev.filter((id) => id !== preset.id)].slice(0, RECENTS_CAP);
            writeRecents(U.getProjectID_URL(), next);
            return next;
        });
    };

    const close = () => setViewId(null);

    /**
     * PORTAL ONTO `document.body`, per D-UI-14. Not ceremony: `#root` is
     * `position: fixed` (`index.scss:31`), so it creates a stacking context and enters
     * the root one at level `auto` = 0, while the Properties rail is itself portaled
     * onto `body` at 900. Rendered inside `#root`, this modal was therefore painted
     * OVER by the rail whatever its own z-index — measured 2026-09-16, report
     * `docs/discovery/discovery_2026-09-16_rail_modal_stacking.md`: at 1600px the rail
     * covered the right 104px of the modal (Fill's row actions, Sizing, and the close
     * button itself, blocked by the rail's tree filter box), and a `z-index: 999999`
     * probe injected inside `#root` lost too. The portal is what moves the comparison
     * to body level; the `--z-alert` in the stylesheet is what wins it there. The two
     * go together, neither works alone. Same pattern and same reason as
     * `ValidationRulesModal` (`a5ed5406d`) and `EdgeMarkerEditorModal`.
     */
    return createPortal((
        <div className="symbol-editor-modal-backdrop" onClick={close} role="presentation">
            <div
                className="symbol-editor-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="symbol-editor-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="symbol-editor-modal__header">
                    <div className="symbol-editor-modal__icon"><i className="bi bi-shapes" aria-hidden="true" /></div>
                    <div className="symbol-editor-modal__heading">
                        <h2 id="symbol-editor-modal-title" className="symbol-editor-modal__title">Symbol</h2>
                        <span className="symbol-editor-modal__subtitle">
                            View for <strong>{target ?? (view.name as string)}</strong>
                        </span>
                    </div>

                    {/* The preset chip (1b): the glyph, the recognized name, the modified
                        marker, and the affordance that opens the catalog. One control and
                        not two — the chip IS the «Change…» button, so there is a single
                        place to click for a single job. */}
                    <div className="symbol-editor-modal__preset">
                        <button
                            type="button"
                            className="symbol-editor-modal__chip"
                            aria-haspopup="dialog"
                            aria-expanded={pickerOpen}
                            title={notations ? `${titleLabel} · ${notations}` : titleLabel}
                            onClick={() => setPickerOpen((o) => !o)}
                        >
                            <SymbolPreview preset={previewPreset} width={22} cornerRadius={cornerRadius} />
                            <span className="symbol-editor-modal__chip-name">{titleLabel}</span>
                            {modified && (
                                <span className="symbol-editor-modal__chip-modified">modified</span>
                            )}
                            <span className="symbol-editor-modal__chip-change">Change…</span>
                        </button>
                        {pickerOpen && (
                            <>
                                <div
                                    className="symbol-editor-modal__popover-backdrop"
                                    onClick={() => setPickerOpen(false)}
                                    role="presentation"
                                />
                                <div
                                    className="symbol-editor-modal__popover"
                                    role="dialog"
                                    aria-label="Symbol catalog"
                                >
                                    <SymbolCatalogPicker
                                        variant="popover"
                                        onApply={applyPreset}
                                        recentIds={recentIds}
                                        keepRules={keepRules}
                                        onKeepRulesChange={setKeepRules}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        className="symbol-editor-modal__close-btn"
                        onClick={close}
                        aria-label="Close"
                        ref={closeBtnRef}
                    >
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>

                <div className="symbol-editor-modal__body">
                    <nav className="symbol-editor-modal__nav" aria-label="Symbol sections">
                        {navEntries.map((e) => {
                            const count = badgeOf(e.key);
                            const isActive = e.key === active.key;
                            return (
                                <button
                                    key={e.key}
                                    type="button"
                                    className={`symbol-editor-modal__nav-item${isActive ? ' is-active' : ''}`}
                                    aria-current={isActive ? 'true' : undefined}
                                    onClick={() => setNavKey(e.key)}
                                >
                                    <span className="symbol-editor-modal__nav-label">{e.label}</span>
                                    {count > 0 && (
                                        <span className="symbol-editor-modal__nav-count">{count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="symbol-editor-modal__main">
                        <div className="symbol-editor-modal__preview">
                            <span className="symbol-editor-modal__preview-tag">Preview</span>
                            {tiles.length > 0 ? (
                                <div className="symbol-editor-modal__preview-strip">
                                    {tiles.map((t, i) => (
                                        <SymbolBoxPreview
                                            key={`${t.objectId}:${i}`}
                                            preset={instanceAxesPreset(t)}
                                            box={instances.inputs[i].box}
                                            label={previewLabel}
                                            borderColor={typeof t.borderColor === 'string' && t.borderColor !== ''
                                                ? t.borderColor : undefined}
                                            cornerRadius={t.cornerRadius}
                                            maxW={tileMaxW}
                                            maxH={PREVIEW_MAX_H}
                                            caption={t.caption}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="symbol-editor-modal__preview-stage">
                                        <SymbolPreview preset={previewPreset} width={168} cornerRadius={cornerRadius} />
                                        {previewLabel ? (
                                            <span className="symbol-editor-modal__preview-label">{previewLabel}</span>
                                        ) : null}
                                    </div>
                                    <span className="symbol-editor-modal__preview-caption">
                                        symbolic preview · no node on canvas
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="symbol-editor-modal__panel">
                            <VertexAuthoringPanel
                                view={view}
                                activeTab={active.tab}
                                activeSection={active.section}
                            />
                        </div>
                    </div>
                </div>

                <div className="symbol-editor-modal__footer">
                    <span className="symbol-editor-modal__hint">
                        <i className="bi bi-info-circle" aria-hidden="true" /> Changes apply immediately to the canvas. Esc closes.
                    </span>
                    {/* Moved down from the header (1b). Rendered at all times and disabled
                        when there is nothing to revert to, rather than appearing and
                        disappearing: a footer button that comes and goes moves the one
                        beside it under the pointer. */}
                    <button
                        type="button"
                        className="btn btn-secondary symbol-editor-modal__revert"
                        disabled={!modified || !la}
                        title="Reapply the preset axes; the border color stays yours"
                        onClick={() => { if (la) applyPreset(la); }}
                    >
                        <i className="bi bi-arrow-counterclockwise" aria-hidden="true" /> Revert to preset
                    </button>
                    <button type="button" className="btn btn-primary" onClick={close}>Done</button>
                </div>
            </div>
        </div>
    ), document.body);
};

export default SymbolEditorModal;
