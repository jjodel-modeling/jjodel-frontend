import React, { useEffect, useState } from 'react';
import {
    Button, ColorPicker, ErrorText, FormSection, HelpText, Input, NumberInput, PathBuilder, PRESERVED_CHIP,
    SegmentedControl, Select, Toggle, forPredicateKind, type PathBuilderFeatures,
} from '../../../ui';
import type {
    BadgePosition, ChannelEdges, ContainmentLayoutMode, GraphVertexViewIR, HeaderSide, MembershipMode, PartitionAxis,
    Predicate, ShapeForm,
} from '../ir/irTypes';
import {
    DEFAULT_COLLAPSED_BADGE, admittedMembershipModes, channelFacts, channelHops, hopExpr, wholeListHop,
    withChannel, withChannelEdges, withChildFilter, withCollapsedForm, withCollapsedKey, withCollapsible,
    withHeaderSide, withHeaderSize, withLayoutAxis, withLayoutMode, withLayoutPadding, withMembershipCreate,
    withMembershipMode, withChannelStep, withoutLastChannelStep, type ChannelClass, type ChannelFacts, type ChannelHop,
} from './graphVertexAuthoring';

export interface ContainmentSectionProps {
    draft: GraphVertexViewIR;
    patch: (next: GraphVertexViewIR) => void;
    /** Global disclosure mode: Basic shows the channel, the layout mode and the channel edges; Advanced the rest. */
    advanced: boolean;
    /** The view's metaclass as the metamodel checks read it; null for the wildcard or an unresolved name. */
    rootClass: ChannelClass | null;
    /** The class a hop reaches, by the id of its reference's type. */
    classById: (id: string) => ChannelClass | null;
    /** A class by name, for the creation owner of a `reference` container. */
    classByName: (name: string) => ChannelClass | null;
    /** All project class names: the isKind filter and the creation owner offer them. */
    classNames: string[];
    /** Shown where no metaclass is set (cross-tab, R-B: it names the tab that holds the cause). */
    featuresHint: string;
}

const CHANNEL_PATH = 'path';
/** The shared Select prepends an empty option (nota Select condiviso, 2026-08-08): it carries the default channel. */
const CHANNEL_MODE_OPTIONS = [{ value: CHANNEL_PATH, label: 'Follow a reference path' }];
const CHANNEL_DEFAULT_LABEL = 'Composition children';
const CHANNEL_ARRAY_ERROR = 'A step before the last cannot read the whole list (.values): choose values[N] (for example values[0]).';

const LAYOUT_MODE_OPTIONS: { value: ContainmentLayoutMode; label: string }[] = [
    { value: 'free', label: 'Free' },
    { value: 'partitions', label: 'Partitions' },
];
const EDGES_OPTIONS: { value: ChannelEdges; label: string }[] = [
    { value: 'show', label: 'Show' },
    { value: 'hide', label: 'Hide' },
];
const AXIS_OPTIONS: { value: PartitionAxis; label: string }[] = [
    { value: 'vertical', label: 'Top to bottom' },
    { value: 'horizontal', label: 'Left to right' },
];
const HEADER_SIDE_OPTIONS: { value: HeaderSide | 'none'; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'w', label: 'Left' },
    { value: 'n', label: 'Top' },
];
const MEMBERSHIP_LABELS: Record<MembershipMode, string> = {
    none: 'None: a drag moves the node only',
    forbid: 'Forbid: a node dropped elsewhere snaps back',
    reference: 'Reference: a drop edits the channel list',
    reparent: 'Reparent: a drop moves the object by containment',
};
const COLLAPSED_FORM_OPTIONS: { value: ShapeForm; label: string }[] = [
    { value: 'rect', label: 'Rectangle' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'ellipse', label: 'Ellipse' },
    { value: 'circle', label: 'Circle' },
    { value: 'diamond', label: 'Diamond' },
    { value: 'stadium', label: 'Stadium' },
    { value: 'hexagon', label: 'Hexagon' },
    { value: 'parallelogram', label: 'Parallelogram' },
    { value: 'cylinder', label: 'Cylinder' },
    { value: 'cloud', label: 'Cloud' },
];
const BADGE_POSITION_OPTIONS: { value: BadgePosition; label: string }[] = [
    { value: 'tl', label: 'Top-left' },
    { value: 'tr', label: 'Top-right' },
    { value: 'bl', label: 'Bottom-left' },
    { value: 'br', label: 'Bottom-right' },
];

/** A hop navigates references only: an attribute would compile and reach nothing (the endpoint rule of the edge panel). */
const hopFeatures = (owner: ChannelClass | null): PathBuilderFeatures | null =>
    owner ? {
        attributes: [],
        references: owner.references.map(r => ({ name: r.name, targetClassName: r.targetClassName, upperBound: r.upperBound })),
    } : null;

/** One line on what the metamodel says about the channel, and the membership modes it admits (spec addendum §2.4). */
function channelSummary(facts: ChannelFacts, declared: boolean): string {
    if (!declared) return 'The container draws its composition children, the objects held in its containment references.';
    if (!facts.resolved) return 'This path does not resolve on the metamodel, so its last step cannot be checked: every membership mode is offered.';
    const last = facts.hops[facts.hops.length - 1];
    const where = `${last.owner}.${last.reference.name}`;
    return facts.terminalContainment
        ? `The channel ends on ${where}, a containment reference.`
        : `The channel ends on ${where}, a plain reference: the container draws the objects it lists.`;
}

/**
 * ContainmentSection — the `containment` keys of a graphVertex (P-2026-10-10-1156; spec addendum 2026-10-10 §2).
 *
 * Presentational and stateless on the draft, like MatchingSection: it reads `draft` and re-patches through the
 * pure writes of `graphVertexAuthoring.ts`, so the panel's single draft, validation and debounce cover it. The only
 * local state is a path step the author opened and has not picked yet: an empty step is not a PathExpr, and
 * `validateIR` refuses an empty channel, so it waits here and never reaches the IR.
 *
 * The metamodel checks run here, as inline help (the prompt's rule: no modal): what the channel's last step is,
 * and which membership modes that admits. They advise; they do not block the commit, which `validateIR` alone gates.
 */
export const ContainmentSection: React.FC<ContainmentSectionProps> = ({
    draft, patch, advanced, rootClass, classById, classByName, classNames, featuresHint,
}) => {
    const c = draft.containment;
    const hops = channelHops(c.children);
    const [pendingStep, setPendingStep] = useState(false);
    // A persisted channel replaced from outside (the other mount, a kind switch) closes an open step.
    useEffect(() => { setPendingStep(false); }, [c.children]);

    const facts = channelFacts(c.children, rootClass, classById);
    const admitted = admittedMembershipModes(facts);
    const membershipMode: MembershipMode = c.membership?.mode ?? 'none';
    const layoutMode: ContainmentLayoutMode = c.layout?.mode ?? 'free';
    const header = c.layout?.header;
    const pathMode = hops.length > 0 || pendingStep;

    // The owner class of every step: the view's metaclass, then the type each resolved step reaches.
    const ownerOf = (i: number): ChannelClass | null =>
        i === 0 ? rootClass : (facts.hops[i - 1] ? classById(facts.hops[i - 1].reference.targetClassId) : null);

    const changeStep = (i: number, expr: string) => {
        setPendingStep(false);
        patch(withChannelStep(draft, i, expr, rootClass, classById));
    };
    const removeLastStep = () => {
        if (pendingStep) { setPendingStep(false); return; }
        patch(withoutLastChannelStep(draft, rootClass, classById));
    };
    const changeChannelMode = (value: string) => {
        if (value === CHANNEL_PATH) { if (hops.length === 0) setPendingStep(true); return; }
        setPendingStep(false);
        patch(withChannel(draft, undefined));
    };

    const steps: (ChannelHop | null)[] = pendingStep ? [...hops, null] : hops;
    const lastHop = hops[hops.length - 1];
    const canFollow = !pendingStep && lastHop !== undefined && lastHop.take !== 'values' && facts.resolved;
    const arrayHop = wholeListHop(hops);

    // Child filter (isKind chip pattern of FieldCompartmentListEditor): a bare isKind is editable inline, any other
    // predicate is preserved verbatim behind a chip.
    const childFilter = c.childFilter;
    const basicIsKind = childFilter !== undefined && childFilter.op === 'isKind' && childFilter.path === undefined;
    const advancedFilter = childFilter !== undefined && !basicIsKind;

    const create = c.membership?.create;
    const ownerClass = create?.ownerKind ? classByName(create.ownerKind) : null;
    const ownerFeatureOptions = (ownerClass?.references ?? [])
        .filter(r => r.containment)
        .map(r => ({ value: r.name, label: `${r.name} → ${r.targetClassName}` }));

    const collapsible = c.collapsible !== false;
    const collapsedForm = c.collapsed?.form;
    const collapsedFill = c.collapsed?.fill;
    const collapsedBadge = c.collapsed?.badge;
    const badgeIsScalar = collapsedBadge !== undefined
        && typeof collapsedBadge.icon === 'string' && typeof collapsedBadge.visible === 'boolean';

    return (
        <FormSection title="Containment" divider={false}>
            {/* ── Basic: channel, layout mode, channel edges ── */}
            <div className="jj-field" data-testid="gv-channel">
                <label className="jj-field-label">Children</label>
                <Select
                    options={CHANNEL_MODE_OPTIONS}
                    placeholder={CHANNEL_DEFAULT_LABEL}
                    value={pathMode ? CHANNEL_PATH : ''}
                    onChange={(e) => changeChannelMode(e.target.value)}
                />
                {pathMode && steps.map((hop, i) => (
                    <div key={i} data-testid={`gv-channel-step-${i}`} style={{ marginTop: 4 }}>
                        <PathBuilder
                            features={hopFeatures(ownerOf(i))}
                            value={hop ? hopExpr(hop) : ''}
                            disabledHint={i === 0 ? featuresHint : 'The previous step does not resolve on the metamodel.'}
                            onChange={(expr) => changeStep(i, expr)}
                        />
                    </div>
                ))}
                {pathMode && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
                        <Button variant="ghost" size="sm" disabled={!canFollow} onClick={() => setPendingStep(true)}
                            title="Navigate one more reference from the object this step reaches">
                            <i className="bi bi-arrow-return-right" aria-hidden="true" /> Then follow
                        </Button>
                        <Button variant="ghost" size="sm" disabled={steps.length === 0} onClick={removeLastStep}
                            title="Remove the last step">
                            <i className="bi bi-x" aria-hidden="true" /> Remove step
                        </Button>
                    </div>
                )}
                {arrayHop !== -1 && <ErrorText>{CHANNEL_ARRAY_ERROR}</ErrorText>}
                {/* The whole channel, where the step pickers each preview one step only. */}
                {hops.length > 1 && <div data-testid="gv-channel-expr" style={{ fontFamily: "'IBM Plex Mono', Monaco, Consolas, monospace", fontSize: 11, marginTop: 4 }}>{c.children}</div>}
                <HelpText icon={false}>{channelSummary(facts, c.children !== undefined)}</HelpText>
            </div>

            <div className="jj-field" data-testid="gv-layout-mode">
                <label className="jj-field-label">Layout</label>
                <SegmentedControl<ContainmentLayoutMode>
                    ariaLabel="How the children are arranged"
                    value={layoutMode}
                    options={LAYOUT_MODE_OPTIONS}
                    onChange={(v) => patch(withLayoutMode(draft, v))}
                />
                <HelpText icon={false}>{layoutMode === 'partitions'
                    ? 'The children are stacked and fill the container, like the lanes of a pool.'
                    : 'The children keep the positions they have.'}</HelpText>
            </div>

            <div className="jj-field" data-testid="gv-edges">
                <label className="jj-field-label">Channel edges</label>
                <SegmentedControl<ChannelEdges>
                    ariaLabel="Whether the edges that draw the channel itself are drawn"
                    value={c.edges ?? 'show'}
                    options={EDGES_OPTIONS}
                    onChange={(v) => patch(withChannelEdges(draft, v))}
                />
                <HelpText icon={false}>The edges between the container and the children it draws. Picking a channel that is not made of containment references hides them; you can still show them.</HelpText>
            </div>

            {/* ── Advanced: the rest ── */}
            {advanced && (
                <>
                    <div className="jj-field" data-testid="gv-child-filter">
                        <label className="jj-field-label">Filter by metaclass (isKind)</label>
                        {advancedFilter ? (
                            <span style={PRESERVED_CHIP}>advanced predicate (preserved)</span>
                        ) : (
                            <>
                                <Toggle
                                    checked={basicIsKind}
                                    onChange={(checked) => patch(withChildFilter(draft, checked ? forPredicateKind('isKind', classNames) as Predicate : undefined))}
                                    size="xs"
                                />
                                {basicIsKind && childFilter?.op === 'isKind' && (
                                    <Select
                                        options={classNames.map((n) => ({ value: n, label: n }))}
                                        value={childFilter.class}
                                        onChange={(e) => patch(withChildFilter(draft, { op: 'isKind', class: e.target.value }))}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {layoutMode === 'partitions' && (
                        <div className="jj-field" data-testid="gv-layout-axis">
                            <label className="jj-field-label">Stacking</label>
                            <SegmentedControl<PartitionAxis>
                                ariaLabel="Direction the partitions are stacked in"
                                value={c.layout?.axis ?? 'vertical'}
                                options={AXIS_OPTIONS}
                                onChange={(v) => patch(withLayoutAxis(draft, v))}
                            />
                        </div>
                    )}

                    <div className="jj-field" data-testid="gv-header">
                        <label className="jj-field-label">Header band</label>
                        <SegmentedControl<HeaderSide | 'none'>
                            ariaLabel="Side of the header band"
                            value={header?.side ?? 'none'}
                            options={HEADER_SIDE_OPTIONS}
                            onChange={(v) => patch(withHeaderSide(draft, v))}
                        />
                        {header && (
                            <div data-testid="gv-header-size" style={{ marginTop: 4 }}>
                                <label className="jj-field-label">Band size <span style={{ color: '#94a3b8' }}>· px</span></label>
                                <NumberInput value={header.size} min={1} onChange={(n) => patch(withHeaderSize(draft, n))} />
                            </div>
                        )}
                        <HelpText icon={false}>A label placed «In the header band» (Text tab) is drawn here.</HelpText>
                    </div>

                    <div className="jj-field" data-testid="gv-padding">
                        <label className="jj-field-label">Padding <span style={{ color: '#94a3b8' }}>· px</span></label>
                        <NumberInput value={c.layout?.padding ?? 0} min={0} onChange={(n) => patch(withLayoutPadding(draft, n))} />
                    </div>

                    <div className="jj-field" data-testid="gv-membership">
                        <label className="jj-field-label">Membership</label>
                        <Select
                            options={(Object.keys(MEMBERSHIP_LABELS) as MembershipMode[]).filter(m => m !== 'none').map(m => ({ value: m, label: MEMBERSHIP_LABELS[m] }))}
                            placeholder={MEMBERSHIP_LABELS.none}
                            value={membershipMode === 'none' ? '' : membershipMode}
                            onChange={(e) => patch(withMembershipMode(draft, (e.target.value || 'none') as MembershipMode))}
                        />
                        <HelpText icon={false}>
                            {`What a drop across the container's boundary does to the model. This channel admits: ${admitted.join(', ')}.`}
                        </HelpText>
                        {!admitted.includes(membershipMode) && (
                            <ErrorText>{membershipMode === 'reference'
                                ? 'Reference edits a plain reference list, and this channel ends on a containment reference: use reparent.'
                                : 'Reparent appends to a containment slot, and this channel ends on a plain reference: use reference.'}</ErrorText>
                        )}
                    </div>

                    {membershipMode === 'reference' && (
                        <div className="jj-field" data-testid="gv-membership-create">
                            <label className="jj-field-label">New children are created in</label>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Select
                                        options={classNames.map((n) => ({ value: n, label: n }))}
                                        placeholder="Owner metaclass…"
                                        value={create?.ownerKind ?? ''}
                                        onChange={(e) => patch(withMembershipCreate(draft, { ownerKind: e.target.value }))}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {ownerClass ? (
                                        <Select
                                            options={ownerFeatureOptions}
                                            placeholder="Containment reference…"
                                            value={create?.feature ?? ''}
                                            onChange={(e) => patch(withMembershipCreate(draft, { feature: e.target.value }))}
                                        />
                                    ) : (
                                        <Input
                                            value={create?.feature ?? ''}
                                            placeholder="feature"
                                            onChange={(e) => patch(withMembershipCreate(draft, { feature: e.target.value }))}
                                        />
                                    )}
                                </div>
                            </div>
                            <HelpText icon={false}>A new child goes in this reference of the nearest container of that metaclass, and its id is added to the channel. Empty: drops on the container are refused.</HelpText>
                        </div>
                    )}

                    <div className="jj-field" data-testid="gv-collapsible">
                        <Toggle checked={collapsible} onChange={(checked) => patch(withCollapsible(draft, checked))} label="Collapsible" size="xs" />
                    </div>

                    {collapsible && (
                        <div className="jj-field" data-testid="gv-collapsed">
                            <label className="jj-field-label">When collapsed</label>
                            {collapsedForm === undefined || typeof collapsedForm === 'string' ? (
                                <Select
                                    options={COLLAPSED_FORM_OPTIONS}
                                    placeholder="Same shape as expanded"
                                    value={collapsedForm ?? ''}
                                    onChange={(e) => patch(withCollapsedForm(draft, e.target.value as ShapeForm | ''))}
                                />
                            ) : (
                                <span style={PRESERVED_CHIP}>shape: conditional (preserved)</span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 4 }}>
                                {collapsedFill === undefined || typeof collapsedFill === 'string' ? (
                                    <>
                                        <ColorPicker value={collapsedFill ?? ''} onChange={(hex) => patch(withCollapsedKey(draft, 'fill', hex))} />
                                        {collapsedFill !== undefined && (
                                            <Button variant="ghost" size="sm" onClick={() => patch(withCollapsedKey(draft, 'fill', undefined))}>Reset</Button>
                                        )}
                                    </>
                                ) : (
                                    <span style={PRESERVED_CHIP}>fill: conditional (preserved)</span>
                                )}
                            </div>
                            <div style={{ marginTop: 4 }}>
                                {collapsedBadge !== undefined && !badgeIsScalar ? (
                                    <span style={PRESERVED_CHIP}>badge: conditional (preserved)</span>
                                ) : (
                                    <>
                                        <Toggle
                                            checked={collapsedBadge !== undefined}
                                            onChange={(checked) => patch(withCollapsedKey(draft, 'badge', checked ? { ...DEFAULT_COLLAPSED_BADGE } : undefined))}
                                            label="Custom badge"
                                            size="xs"
                                        />
                                        {collapsedBadge && (
                                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 4 }}>
                                                <Input
                                                    value={collapsedBadge.icon as string}
                                                    placeholder="bi-collection"
                                                    onChange={(e) => patch(withCollapsedKey(draft, 'badge', { ...collapsedBadge, icon: e.target.value }))}
                                                />
                                                <Select
                                                    options={BADGE_POSITION_OPTIONS}
                                                    value={collapsedBadge.position}
                                                    onChange={(e) => patch(withCollapsedKey(draft, 'badge', { ...collapsedBadge, position: (e.target.value || 'tr') as BadgePosition }))}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <HelpText icon={false}>Empty fields keep the expanded look; without a custom badge the collapsed node shows its child count.</HelpText>
                        </div>
                    )}
                </>
            )}
        </FormSection>
    );
};

export default ContainmentSection;
