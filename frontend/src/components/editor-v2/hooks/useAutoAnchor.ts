import { useCallback } from 'react';
import { useNodes } from '@xyflow/react';
import type { AnchorConfig, AnchorSide } from '../types';
import { MAX_HANDLES_PER_SIDE, sideCapacity } from '../utils/portDistribution';
import { chooseEdgeSides, type SidePair } from '../utils/edgeRouting';

const SIDES = ['top', 'right', 'bottom', 'left'] as const;
type Side = (typeof SIDES)[number];

interface NodeRect {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

/**
 * Gets the bounding rect for a node including center coordinates.
 */
function getNodeRect(node: any): NodeRect {
    const x = node.position.x;
    const y = node.position.y;
    const width = node.measured?.width ?? node.width ?? node.style?.width ?? 180;
    const height = node.measured?.height ?? node.height ?? node.style?.height ?? 80;

    return {
        x,
        y,
        width,
        height,
        centerX: x + width / 2,
        centerY: y + height / 2,
    };
}

/**
 * Bundles every co-located edge group onto a shared facing channel.
 *
 * Any group of edges sharing the same unordered node pair {A,B} with two or more
 * routable edges (references; inheritance and self-references are excluded) is forced
 * onto the facing (opposing) side-pair, chosen by the dominant axis between the two
 * nodes — the same rule as jjomTransformers.computeOptimalHandles (vertical-dominant on
 * ties) so load-time and post-drag side selection agree. Each edge's source endpoint
 * lands on the source box's facing side and its target endpoint on the target box's
 * facing side, so covariant ({A→B, A→B}) and contravariant ({A→B, B→A}) groups share the
 * same two facing sides; the directions are separated downstream on that shared channel
 * by computeSidePositions' pair-stable ordering.
 *
 * Name retained for historical continuity even though the scope is no longer limited to
 * bidirectional pairs.
 *
 * @param edges - Array of edges with their computed anchors
 * @param nodeRects - Map of node IDs to their rectangles
 * @returns Map of edge IDs to adjusted anchor handles
 */
function deconflictBidirectionalEdges(
    edges: { id: string; source: string; target: string; sourceHandle: string; targetHandle: string; type?: string }[],
    nodeRects: Map<string, NodeRect>
): Map<string, { sourceHandle: string; targetHandle: string }> {
    const result = new Map<string, { sourceHandle: string; targetHandle: string }>();

    // Group edges by node pair (sorted to group A→B with B→A)
    const pairMap = new Map<string, typeof edges>();
    for (const edge of edges) {
        const pairKey = [edge.source, edge.target].sort().join('::');
        const group = pairMap.get(pairKey) || [];
        group.push(edge);
        pairMap.set(pairKey, group);
    }

    // Process each pair group
    for (const [, group] of pairMap) {
        // Only references participate: inheritance keeps its sacred top/bottom convention
        // and self-references have a dedicated routing, so both are left untouched here.
        const routable = group.filter(e => e.type !== 'inheritance' && e.source !== e.target);

        // A facing channel is only meaningful when two or more edges share the pair.
        // Single edges keep the per-edge side selection computed upstream.
        if (routable.length < 2) continue;

        // The two distinct endpoint nodes of this group (every routable edge connects them).
        const nodeA = routable[0].source;
        const nodeB = routable[0].target;
        const rectA = nodeRects.get(nodeA);
        const rectB = nodeRects.get(nodeB);
        if (!rectA || !rectB) continue;

        // Facing side-pair by dominant axis (vertical-dominant on ties), mirroring
        // jjomTransformers.computeOptimalHandles so load-time and post-drag agree.
        // sideA faces from A toward B; sideB is its opposite, on B.
        const dx = rectB.centerX - rectA.centerX;
        const dy = rectB.centerY - rectA.centerY;
        const isVerticalDominant = Math.abs(dy) >= Math.abs(dx);
        let sideA: Side;
        let sideB: Side;
        if (isVerticalDominant) {
            if (dy >= 0) { sideA = 'bottom'; sideB = 'top'; } // B below A
            else { sideA = 'top'; sideB = 'bottom'; }         // B above A
        } else {
            if (dx > 0) { sideA = 'right'; sideB = 'left'; }  // B right of A
            else { sideA = 'left'; sideB = 'right'; }         // B left of A
        }

        // Per-edge, direction-aware assignment: each endpoint lands on its own box's
        // facing side. Covariant and contravariant groups thus share the same two facing
        // sides; computeSidePositions' pair-stable ordering then separates the edges into
        // parallel paths on that shared channel.
        for (const edge of routable) {
            const sourceHandle = edge.source === nodeA ? sideA : sideB;
            const targetHandle = edge.target === nodeA ? sideA : sideB;
            result.set(edge.id, { sourceHandle, targetHandle });
        }
    }

    return result;
}

/**
 * Computes the best anchor pair.
 *
 * Dal 2026-08-27 la scelta e' quella di `edgeRouting.chooseEdgeSides`: si valutano
 * tutti e sedici gli accoppiamenti sul tracciato che il router produrrebbe davvero e
 * vince quello con meno svolte, a parita' il piu' corto, scartando i tracciati che
 * entrano nei corpi dei due nodi.
 *
 * Sostituisce la classificazione angolare con dead zone 30°-60°. Quella dead zone
 * congelava i lati precedenti e, senza lati precedenti, li faceva ripiegare entrambi
 * su `right` (il default di `getBaseSide(null)`): l'accoppiamento `right → right`
 * misurato il 2026-08-27, cioe' la U che gira attorno al nodo di destinazione. La
 * stabilita' che la dead zone dava e' ora il margine di miglioramento di
 * `chooseEdgeSides`, che pero' non puo' ripiegare su un accoppiamento che nessuno ha
 * scelto: senza `current` vince sempre la geometria.
 *
 * @param sourceRect - The source node rectangle
 * @param targetRect - The target node rectangle
 * @param isSelfReference - Whether this is a self-referencing edge
 * @param edgeType - Optional edge type for semantic preferences
 * @param currentSourceSide - Lato sorgente corrente (soglia di miglioramento)
 * @param currentTargetSide - Lato destinazione corrente (soglia di miglioramento)
 */
function computeBestAnchors(
    sourceRect: NodeRect,
    targetRect: NodeRect,
    isSelfReference: boolean,
    edgeType?: 'inheritance' | 'reference',
    currentSourceSide?: Side,
    currentTargetSide?: Side,
): { sourceHandle: string; targetHandle: string } {
    // Self-reference: fixed handles for compact loop
    if (isSelfReference) {
        return { sourceHandle: 'right', targetHandle: 'top' };
    }

    // Inheritance: always child=top, parent=bottom (UML convention)
    if (edgeType === 'inheritance') {
        return { sourceHandle: 'top', targetHandle: 'bottom' };
    }

    // Reference: minimo di svolte, poi lunghezza, sui sedici accoppiamenti.
    const chosen = chooseEdgeSides(sourceRect, targetRect, {
        current: currentSourceSide && currentTargetSide
            ? { sourceSide: currentSourceSide, targetSide: currentTargetSide }
            : undefined,
    });
    return { sourceHandle: chosen.sourceSide, targetHandle: chosen.targetSide };
}

/** Edge shape consumed by computeAnchorsWithHysteresis */
interface MinimalEdgeWithData {
    id: string;
    source: string;
    target: string;
    type?: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    data?: {
        sourceAnchor?: AnchorConfig;
        targetAnchor?: AnchorConfig;
        [key: string]: unknown;
    };
}

/** Result shape returned per edge */
interface AnchorResult {
    sourceHandle: string;
    targetHandle: string;
    sourceAnchor: AnchorConfig;
    targetAnchor: AnchorConfig;
}

/**
 * Extracts the base side from a handle ID string.
 * "right" → "right", "right-0" → "right", "bottom-1" → "bottom"
 */
function getBaseSide(handleId: string | null | undefined): Side {
    if (!handleId) return 'right';
    const base = handleId.split('-')[0];
    if (SIDES.includes(base as Side)) return base as Side;
    return 'right';
}

/**
 * Reads anchor config from edge data with fallback for legacy edges.
 */
function getAnchorConfig(
    edgeData: MinimalEdgeWithData['data'],
    endpoint: 'source' | 'target',
    handleId: string | null | undefined
): AnchorConfig {
    const config = endpoint === 'source' ? edgeData?.sourceAnchor : edgeData?.targetAnchor;
    if (config) return config;
    // Default: treat as auto — a pin must be EXPLICIT (the edge carries a
    // data.sourceAnchor/targetAnchor with mode === 'pinned', written only by a manual
    // endpoint drag). Edges without any anchor config (e.g. from load/import) stay
    // re-routable by the hysteresis when nodes are dragged, instead of being frozen at
    // their initial placement.
    return { mode: 'auto', side: getBaseSide(handleId) as AnchorSide };
}

/**
 * Computes anchors for all edges with hysteresis — only switches sides when
 * the new side is significantly better (30% improvement threshold).
 *
 * Respects pinned anchors and applies bidirectional deconfliction.
 */
function computeAnchorsWithHysteresis(
    edges: MinimalEdgeWithData[],
    nodeRects: Map<string, NodeRect>,
    contextEdges?: EdgeContext[],
): Map<string, AnchorResult> {
    const result = new Map<string, AnchorResult>();

    // First pass: compute anchors per edge with hysteresis
    const edgesWithAnchors: Array<MinimalEdgeWithData & { sourceHandle: string; targetHandle: string }> = [];

    for (const edge of edges) {
        const sourceRect = nodeRects.get(edge.source);
        const targetRect = nodeRects.get(edge.target);

        if (!sourceRect || !targetRect) {
            const fallback: AnchorResult = {
                sourceHandle: 'right', targetHandle: 'left',
                sourceAnchor: { mode: 'auto', side: 'right' },
                targetAnchor: { mode: 'auto', side: 'left' },
            };
            result.set(edge.id, fallback);
            edgesWithAnchors.push({ ...edge, sourceHandle: 'right', targetHandle: 'left' });
            continue;
        }

        const isSelfReference = edge.source === edge.target;
        const currentSource = getAnchorConfig(edge.data, 'source', edge.sourceHandle);
        const currentTarget = getAnchorConfig(edge.data, 'target', edge.targetHandle);

        // Self-reference: fixed handles
        if (isSelfReference) {
            const r: AnchorResult = {
                sourceHandle: 'right', targetHandle: 'top',
                sourceAnchor: { mode: 'auto', side: 'right' },
                targetAnchor: { mode: 'auto', side: 'top' },
            };
            result.set(edge.id, r);
            edgesWithAnchors.push({ ...edge, sourceHandle: 'right', targetHandle: 'top' });
            continue;
        }

        // Any pinned anchor: freeze the entire edge — don't reroute either endpoint.
        // Once the user manually places an anchor, automatic rerouting must not
        // override their intent (even for the other, non-pinned endpoint).
        if (currentSource.mode === 'pinned' || currentTarget.mode === 'pinned') {
            const r: AnchorResult = {
                sourceHandle: currentSource.side, targetHandle: currentTarget.side,
                sourceAnchor: currentSource, targetAnchor: currentTarget,
            };
            result.set(edge.id, r);
            edgesWithAnchors.push({ ...edge, sourceHandle: currentSource.side, targetHandle: currentTarget.side });
            continue;
        }

        // After the pinned-anchor early return above, both endpoints are 'auto' here.

        // Inheritance: enforce top→bottom convention (source=child→top, target=parent→bottom).
        // The edge creation pipeline (handleEdgeTypeSelected) establishes this convention;
        // hysteresis must never invert it regardless of relative node positions.
        const edgeType = edge.type === 'inheritance' ? 'inheritance' : 'reference';
        if (edgeType === 'inheritance') {
            const r: AnchorResult = {
                sourceHandle: 'top', targetHandle: 'bottom',
                sourceAnchor: { mode: 'auto', side: 'top' },
                targetAnchor: { mode: 'auto', side: 'bottom' },
            };
            result.set(edge.id, r);
            edgesWithAnchors.push({ ...edge, sourceHandle: 'top', targetHandle: 'bottom' });
            continue;
        }

        // Reference con entrambi i capi auto: la scelta e' quella di
        // `computeBestAnchorsWithContext` (minimo di svolte, poi lunghezza,
        // occupazione solo a spareggio), filtrata dalla soglia di miglioramento.
        //
        // Cade qui la regola «tipo diverso sulla stessa coppia», che forzava la U
        // quando fra i due nodi c'era gia' un'ereditarieta': la motivazione era
        // «invece di girare attorno a entrambi i nodi», ma la U misurata il
        // 2026-08-27 su nodi affiancati collassava dentro il corpo del target. Il
        // minimizzatore, che scarta i tracciati dentro i corpi, la sostituisce.
        const edgeContext = contextEdges || edges as unknown as EdgeContext[];
        // L'id serve ancora, ma per un'altra ragione: la scansione della coppia per
        // «tipo diverso» non esiste piu' (era li' che nasceva l'auto-riconoscimento
        // di un arco M1 'instanceRef', il self-match di :498), e oggi identifica
        // l'arco perche' non si conti da solo nell'occupazione dei lati.
        //
        // La coppia corrente entra nella stessa chiamata: la soglia di miglioramento
        // sostituisce la dead zone angolare. Si cambia lato solo se il nuovo
        // accoppiamento ha meno svolte, o a parita' di svolte e' piu' corto oltre il
        // margine; sotto la soglia si resta dove si e', che e' cio' che tiene fermi i
        // lati durante un trascinamento.
        const best = computeBestAnchorsWithContext(
            sourceRect, targetRect, edge.source, edge.target,
            edgeType, edgeContext, edge.id,
            { sourceSide: currentSource.side as Side, targetSide: currentTarget.side as Side },
        );
        const finalSourceSide = best.sourceHandle as AnchorSide;
        const finalTargetSide = best.targetHandle as AnchorSide;

        const r: AnchorResult = {
            sourceHandle: finalSourceSide,
            targetHandle: finalTargetSide,
            sourceAnchor: { mode: 'auto', side: finalSourceSide },
            targetAnchor: { mode: 'auto', side: finalTargetSide },
        };
        result.set(edge.id, r);
        edgesWithAnchors.push({ ...edge, sourceHandle: finalSourceSide, targetHandle: finalTargetSide });
    }

    // Second pass: bidirectional deconfliction
    const deconflicted = deconflictBidirectionalEdges(edgesWithAnchors, nodeRects);

    // Merge deconfliction results — update handle IDs and anchor sides.
    // IMPORTANT: never overwrite a pinned endpoint's side or an inheritance edge's convention.
    for (const [edgeId, adjusted] of deconflicted) {
        const existing = result.get(edgeId);
        if (existing) {
            // Find the original edge to check its type
            const originalEdge = edges.find(e => e.id === edgeId);
            const isInheritance = originalEdge?.type === 'inheritance';

            // Inheritance edges: never override — top→bottom convention is sacred
            if (isInheritance) continue;

            // Any pinned anchor: freeze entire edge — don't let deconfliction
            // override user's manual placement
            const srcPinned = existing.sourceAnchor.mode === 'pinned';
            const tgtPinned = existing.targetAnchor.mode === 'pinned';
            if (srcPinned || tgtPinned) continue;

            result.set(edgeId, {
                sourceHandle: adjusted.sourceHandle,
                targetHandle: adjusted.targetHandle,
                sourceAnchor: { mode: 'auto', side: adjusted.sourceHandle as AnchorSide },
                targetAnchor: { mode: 'auto', side: adjusted.targetHandle as AnchorSide },
            });
        }
    }

    return result;
}

// Le due tabelle del punteggio geometrico (SIDE_VECTORS, direzioni dei lati; e
// SIDE_PREFERENCE, spareggio bottom > right > left > top) sono state rimosse il
// 2026-08-27 insieme al ciclo che le leggeva: la scelta dei lati non passa piu' da
// un prodotto scalare ma dalla misura di svolte e lunghezza in `edgeRouting`, il cui
// spareggio e' l'asse dominante. Non sono codice «apparentemente inutilizzato»:
// erano lette solo li'.

/** Minimal edge shape for occupancy context */
interface EdgeContext {
    id?: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type?: string;
}

/**
 * Computes the best anchor pair considering existing edges on each side.
 * Used during edge creation to avoid crowding occupied sides.
 *
 * Algoritmo (dal 2026-08-27):
 * 1. Self-reference / Inheritance: same rules as computeBestAnchors
 * 2. `edgeRouting.chooseEdgeSides` sceglie per svolte e lunghezza; l'occupazione dei
 *    lati entra **solo come spareggio** fra accoppiamenti pari merito, non come
 *    penale che possa scavalcare la geometria.
 *
 * Rispetto a prima cadono tre politiche, tutte per ratifica esplicita:
 * - la regola «tipo diverso sulla stessa coppia», che imponeva la U all'associazione
 *   quando fra i due nodi c'era gia' un'ereditarieta'. Misurato il 2026-08-27: su
 *   nodi affiancati quella U collassava per collinearita' in una retta che
 *   attraversava il corpo del target;
 * - il cancello di saturazione frontale, che ammetteva gli accoppiamenti a U solo
 *   sopra capienza: ora i sedici accoppiamenti sono tutti candidati, e a filtrarli e'
 *   il criterio sui corpi;
 * - il punteggio geometrico a prodotto scalare con le sue penali, sostituito dalla
 *   misura diretta su svolte e lunghezza.
 */
function computeBestAnchorsWithContext(
    sourceRect: NodeRect,
    targetRect: NodeRect,
    sourceId: string,
    targetId: string,
    edgeType: 'inheritance' | 'reference' | undefined,
    existingEdges: EdgeContext[],
    currentEdgeId?: string,
    current?: SidePair,
): { sourceHandle: string; targetHandle: string } {
    // Self-reference: fixed handles
    if (sourceId === targetId) {
        return { sourceHandle: 'right', targetHandle: 'top' };
    }

    // Inheritance: always child=top, parent=bottom (UML convention)
    if (edgeType === 'inheritance') {
        return { sourceHandle: 'top', targetHandle: 'bottom' };
    }

    // Occupazione per lato, su entrambi i nodi. Non decide piu' la scelta: la usa
    // `chooseEdgeSides` per spareggiare fra accoppiamenti identici su svolte,
    // lunghezza e sporgenza — cosi' due archi che partono dallo stesso nodo con la
    // stessa geometria si distribuiscono su lati diversi.
    const sourceSideInfo: Record<Side, { count: number; hasInheritance: boolean }> = {
        top: { count: 0, hasInheritance: false },
        right: { count: 0, hasInheritance: false },
        bottom: { count: 0, hasInheritance: false },
        left: { count: 0, hasInheritance: false },
    };
    const targetSideInfo: Record<Side, { count: number; hasInheritance: boolean }> = {
        top: { count: 0, hasInheritance: false },
        right: { count: 0, hasInheritance: false },
        bottom: { count: 0, hasInheritance: false },
        left: { count: 0, hasInheritance: false },
    };

    for (const e of existingEdges) {
        // Skip self-references — they loop on the same node and don't block sides
        if (e.source === e.target) continue;
        const isInh = e.type === 'inheritance';
        if (e.source === sourceId) {
            const side = getBaseSide(e.sourceHandle);
            sourceSideInfo[side].count++;
            if (isInh) sourceSideInfo[side].hasInheritance = true;
        }
        if (e.target === sourceId) {
            const side = getBaseSide(e.targetHandle);
            sourceSideInfo[side].count++;
            if (isInh) sourceSideInfo[side].hasInheritance = true;
        }
        if (e.source === targetId) {
            const side = getBaseSide(e.sourceHandle);
            targetSideInfo[side].count++;
            if (isInh) targetSideInfo[side].hasInheritance = true;
        }
        if (e.target === targetId) {
            const side = getBaseSide(e.targetHandle);
            targetSideInfo[side].count++;
            if (isInh) targetSideInfo[side].hasInheritance = true;
        }
    }

    // I lati che l'arco in esame occupa gia': nello spareggio non deve contarsi da
    // solo, altrimenti un arco isolato vedrebbe occupato il proprio lato e lo
    // eviterebbe. Nel conteggio di capienza invece si conta, perche' li' la domanda
    // e' se il lato regge anche lui — ed e' la semantica di prima, invariata.
    const self = currentEdgeId === undefined
        ? undefined
        : existingEdges.find(e => e.id === currentEdgeId && e.source !== e.target);
    const selfSourceSide = self?.source === sourceId ? getBaseSide(self.sourceHandle) : undefined;
    const selfTargetSide = self?.target === targetId ? getBaseSide(self.targetHandle) : undefined;

    // Un arco in piu' su un lato pesa il doppio della sola presenza di
    // un'ereditarieta': a parita' di affollamento si preferisce il lato senza.
    const occupancy = (pair: SidePair): number => {
        const src = sourceSideInfo[pair.sourceSide];
        const tgt = targetSideInfo[pair.targetSide];
        const own = (selfSourceSide === pair.sourceSide ? 1 : 0) + (selfTargetSide === pair.targetSide ? 1 : 0);
        return (src.count + tgt.count - own) * 2 + (src.hasInheritance ? 1 : 0) + (tgt.hasInheritance ? 1 : 0);
    };

    // Capienza fisica del lato frontale (per asse dominante, verticale a parità):
    // resta l'unica cosa che sopravanza la geometria. Sopra capienza l'accoppiamento
    // frontale viene negato e l'arco cerca altrove — è il cancello introdotto con
    // `sideCapacity` (2f58de915) e qui preservato, tradotto da penale di punteggio a
    // veto sul candidato. Esattamente la capienza ci sta ancora: il confronto è
    // stretto, come prima.
    let frontalSrc: Side;
    let frontalTgt: Side;
    if (Math.abs(targetRect.centerY - sourceRect.centerY) >= Math.abs(targetRect.centerX - sourceRect.centerX)) {
        if (targetRect.centerY - sourceRect.centerY >= 0) { frontalSrc = 'bottom'; frontalTgt = 'top'; }
        else { frontalSrc = 'top'; frontalTgt = 'bottom'; }
    } else {
        if (targetRect.centerX - sourceRect.centerX > 0) { frontalSrc = 'right'; frontalTgt = 'left'; }
        else { frontalSrc = 'left'; frontalTgt = 'right'; }
    }
    // Saturato quando il lato frontale tiene gia' piu' di un lato pieno d'archi a uno
    // dei due capi. Esattamente la capienza ci sta ancora (confronto stretto), e il
    // conteggio resta cieco al ruolo: un lato fisico e' condiviso dai due ruoli.
    const frontalSaturated =
        sourceSideInfo[frontalSrc].count > sideCapacity(frontalSrc, sourceRect) ||
        targetSideInfo[frontalTgt].count > sideCapacity(frontalTgt, targetRect);
    const deny = frontalSaturated
        ? (pair: SidePair) => pair.sourceSide === frontalSrc && pair.targetSide === frontalTgt
        : undefined;

    // `current` porta qui la soglia di miglioramento: la decisione se muoversi e
    // quella su dove muoversi stanno nella stessa chiamata, ed e' l'unico modo perche'
    // il veto di capienza possa scavalcare l'inerzia (un lato frontale saturo va
    // lasciato anche quando la geometria da sola direbbe di restare).
    const chosen = chooseEdgeSides(sourceRect, targetRect, { occupancy, deny, current });
    return { sourceHandle: chosen.sourceSide, targetHandle: chosen.targetSide };
}

/**
 * Pure core of getOptimalAnchorsForAllEdges: geometry-only side selection
 * (computeBestAnchors — dominant axis, no occupancy, no same-side U candidate)
 * plus bidirectional deconfliction, driven by an explicit nodeRects map instead
 * of the live React Flow node list.
 *
 * This is the load / auto-layout path: side choice must follow the post-layout
 * geometry, so passing freshly-computed rects (e.g. the ELK output, before the
 * async setNodes has propagated) yields correct sides without reading stale state.
 * Inheritance keeps top/bottom (computeBestAnchors) and is skipped by deconfliction.
 */
function computeGeometricAnchorsForAllEdges(
    edges: { id: string; source: string; target: string; type?: string }[],
    nodeRects: Map<string, NodeRect>,
): Map<string, { sourceHandle: string; targetHandle: string }> {
    // First pass: geometry-only best anchors per edge
    const edgesWithAnchors = edges.map(edge => {
        const sourceRect = nodeRects.get(edge.source);
        const targetRect = nodeRects.get(edge.target);
        if (!sourceRect || !targetRect) {
            return { ...edge, sourceHandle: 'right', targetHandle: 'left' };
        }
        const isSelfReference = edge.source === edge.target;
        const edgeType = edge.type === 'inheritance' ? 'inheritance' : 'reference';
        const anchors = computeBestAnchors(sourceRect, targetRect, isSelfReference, edgeType);
        return { ...edge, ...anchors };
    });

    // Second pass: bidirectional deconfliction (shared facing channel per pair)
    const deconflicted = deconflictBidirectionalEdges(edgesWithAnchors, nodeRects);

    const result = new Map<string, { sourceHandle: string; targetHandle: string }>();
    for (const edge of edgesWithAnchors) {
        const adjusted = deconflicted.get(edge.id);
        result.set(edge.id, adjusted ?? { sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle });
    }
    return result;
}

/**
 * Hook that provides a function to compute optimal anchor positions for edges.
 *
 * @returns A function that takes source and target node IDs and returns optimal handles
 */
export function useAutoAnchor() {
    const nodes = useNodes();

    const getOptimalAnchors = useCallback(
        (
            sourceId: string,
            targetId: string,
            edgeType?: 'inheritance' | 'reference',
            existingEdges?: EdgeContext[],
        ): { sourceHandle: string; targetHandle: string } => {
            const sourceNode = nodes.find((n) => n.id === sourceId);
            const targetNode = nodes.find((n) => n.id === targetId);

            if (!sourceNode || !targetNode) {
                return { sourceHandle: 'right', targetHandle: 'left' };
            }

            const sourceRect = getNodeRect(sourceNode);
            const targetRect = getNodeRect(targetNode);

            // Use context-aware scoring when existing edges are provided
            if (existingEdges && existingEdges.length > 0) {
                return computeBestAnchorsWithContext(
                    sourceRect, targetRect, sourceId, targetId, edgeType, existingEdges,
                );
            }

            // Fallback: geometry-only (no context)
            return computeBestAnchors(sourceRect, targetRect, sourceId === targetId, edgeType);
        },
        [nodes]
    );

    /**
     * Computes optimal anchors for all edges at once, with bidirectional deconfliction.
     * Use this when you have multiple edges and want to prevent overlap between
     * bidirectional pairs (A→B and B→A).
     */
    const getOptimalAnchorsForAllEdges = useCallback(
        (
            edges: { id: string; source: string; target: string; type?: string }[]
        ): Map<string, { sourceHandle: string; targetHandle: string }> => {
            // Build node rects map from the live node list, then delegate to the
            // pure geometry-only core (shared with the auto-layout recalc path).
            const nodeRects = new Map<string, NodeRect>();
            for (const node of nodes) {
                nodeRects.set(node.id, getNodeRect(node));
            }
            return computeGeometricAnchorsForAllEdges(edges, nodeRects);
        },
        [nodes]
    );

    return { getOptimalAnchors, getOptimalAnchorsForAllEdges };
}

export { computeBestAnchors, getNodeRect, computeAnchorsWithHysteresis, getAnchorConfig, computeGeometricAnchorsForAllEdges };
export type { NodeRect, Side, MinimalEdgeWithData, AnchorResult };
