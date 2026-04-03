/**
 * PathPresetsPopover
 * Inspired by the official Bootstrap Icons page.
 *
 *   - Search bar at the top (filters by name, ignores categories)
 *   - "BASIC SHAPES" section always visible (hardcoded geometric presets)
 *   - Bootstrap Icons organized in collapsible category sections
 *   - When searching: flat results (no categories), max 60
 *   - Each icon: ~40×40 SVG preview + name underneath (10 px)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PATH_PRESETS } from './pathPresets';
import {
    BOOTSTRAP_ICON_CATALOG,
    BOOTSTRAP_ICON_CATEGORIES,
    BootstrapIconEntry,
} from './bootstrapIconCatalog';

// ============================================
// TYPES
// ============================================

interface PathPresetsPopoverProps {
    anchorRef: React.RefObject<HTMLElement | null>;
    onSelect: (pathD: string) => void;
    onClose: () => void;
    /** When true, clicking a preset shows an inline "Replace?" confirm instead of selecting immediately */
    hasExistingPath?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_SEARCH_RESULTS = 60;

/** Categories expanded by default (first three) */
const DEFAULT_EXPANDED = new Set(['Shapes', 'Arrows', 'Diagrams']);

/** Pre-group icons by category for instant lookup */
const ICONS_BY_CATEGORY: Map<string, BootstrapIconEntry[]> = (() => {
    const map = new Map<string, BootstrapIconEntry[]>();
    for (const cat of BOOTSTRAP_ICON_CATEGORIES) {
        map.set(cat, []);
    }
    for (const icon of BOOTSTRAP_ICON_CATALOG) {
        const arr = map.get(icon.category);
        if (arr) arr.push(icon);
        else {
            // fallback — shouldn't happen
            if (!map.has('Other')) map.set('Other', []);
            map.get('Other')!.push(icon);
        }
    }
    return map;
})();

/** Pre-group basic presets vs connector sub-categories */
const BASIC_PRESETS = PATH_PRESETS.filter(p =>
    p.category === 'Shapes' || p.category === 'Arrows' || p.category === 'Symbols'
);
const CONNECTOR_GROUPS = (['UML Connectors', 'ER Notation', 'General'] as const).map(cat => ({
    label: cat,
    presets: PATH_PRESETS.filter(p => p.category === cat),
})).filter(g => g.presets.length > 0);

/**
 * Scale a Bootstrap Icons path (viewBox 0 0 16 16) to the editor's
 * 0–10 coordinate system, centered with a small margin.
 */
function scaleBI(pathD: string): string {
    const scale = 8 / 16; // 0.5
    const offset = 1;
    return pathD.replace(
        /([+-]?\d+\.?\d*)/g,
        (_, num) => {
            const val = parseFloat(num) * scale + offset;
            return val.toFixed(2).replace(/\.?0+$/, '');
        },
    );
}

// ============================================
// SUB-COMPONENTS
// ============================================

/** A single icon card: SVG preview + name underneath */
const IconCard: React.FC<{
    name: string;
    viewBox: string;
    pathD: string;
    filled?: boolean;
    pending?: boolean;
    onClick: () => void;
}> = React.memo(({ name, viewBox, pathD, filled = true, pending = false, onClick }) => (
    <button
        className={`path-presets-popover__icon-card${pending ? ' path-presets-popover__icon-card--pending' : ''}`}
        title={name}
        onClick={onClick}
    >
        <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
            <path
                d={pathD}
                fill={filled ? 'currentColor' : 'none'}
                stroke={filled ? 'none' : 'currentColor'}
                strokeWidth={filled ? undefined : '0.6'}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
        <span className="path-presets-popover__icon-name">{name}</span>
    </button>
));

/** Collapsible category section */
const CategorySection: React.FC<{
    label: string;
    count: number;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ label, count, expanded, onToggle, children }) => (
    <div className="path-presets-popover__section">
        <button
            className="path-presets-popover__section-header"
            onClick={onToggle}
        >
            <i className={`bi bi-chevron-${expanded ? 'down' : 'right'}`} />
            <span className="path-presets-popover__section-title">{label}</span>
            <span className="path-presets-popover__section-count">{count}</span>
        </button>
        {expanded && (
            <div className="path-presets-popover__grid">
                {children}
            </div>
        )}
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

const PathPresetsPopover: React.FC<PathPresetsPopoverProps> = ({
    anchorRef,
    onSelect,
    onClose,
    hasExistingPath = false,
}) => {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set(DEFAULT_EXPANDED));
    const [pendingPreset, setPendingPreset] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Focus search on open
    useEffect(() => {
        requestAnimationFrame(() => searchRef.current?.focus());
    }, []);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [onClose]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                popoverRef.current &&
                !popoverRef.current.contains(target) &&
                anchorRef.current &&
                !anchorRef.current.contains(target)
            ) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose, anchorRef]);

    // Toggle a category's expanded state
    const toggleCategory = useCallback((cat: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    }, []);

    // Search results (null = show categories)
    const searchResults = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return null;
        return BOOTSTRAP_ICON_CATALOG
            .filter((icon) => icon.name.includes(q))
            .slice(0, MAX_SEARCH_RESULTS);
    }, [search]);

    const isSearching = searchResults !== null;

    // Handlers — if canvas has content, show inline confirmation first
    const selectOrConfirm = useCallback(
        (pathD: string) => {
            if (hasExistingPath) {
                setPendingPreset(pathD);
            } else {
                onSelect(pathD);
            }
        },
        [hasExistingPath, onSelect],
    );

    const handlePresetClick = useCallback(
        (pathD: string) => selectOrConfirm(pathD),
        [selectOrConfirm],
    );

    const handleIconClick = useCallback(
        (icon: BootstrapIconEntry) => selectOrConfirm(scaleBI(icon.path)),
        [selectOrConfirm],
    );

    const handleConfirmReplace = useCallback(() => {
        if (pendingPreset) {
            onSelect(pendingPreset);
            setPendingPreset(null);
        }
    }, [pendingPreset, onSelect]);

    const handleCancelReplace = useCallback(() => {
        setPendingPreset(null);
    }, []);

    // Compute position relative to anchor
    const [style, setStyle] = useState<React.CSSProperties>({});
    useEffect(() => {
        if (!anchorRef.current || !popoverRef.current) return;
        const anchorRect = anchorRef.current.getBoundingClientRect();
        const popRect = popoverRef.current.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        let top = anchorRect.top;
        let left = anchorRect.right + 8;

        // Try right of anchor, then left, then center over viewport
        if (left + popRect.width > viewportW - 16) {
            left = anchorRect.left - popRect.width - 8;
        }
        if (left < 16) {
            // Neither side fits — center horizontally in viewport
            left = Math.max(16, (viewportW - popRect.width) / 2);
        }
        if (top + popRect.height > viewportH - 16) {
            top = viewportH - popRect.height - 16;
        }
        if (top < 16) top = 16;

        setStyle({ top, left, position: 'fixed' });
    }, [anchorRef]);

    return (
        <div
            ref={popoverRef}
            className="path-presets-popover"
            style={style}
        >
            {/* Search */}
            <div className="path-presets-popover__search">
                <i className="bi bi-search" />
                <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search icons..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="path-presets-popover__search-input"
                />
                {search && (
                    <button
                        className="path-presets-popover__search-clear"
                        onClick={() => setSearch('')}
                        title="Clear"
                    >
                        <i className="bi bi-x" />
                    </button>
                )}
            </div>

            <div className="path-presets-popover__body">
                {/* BASIC SHAPES — always visible */}
                <div className="path-presets-popover__section path-presets-popover__section--basic">
                    <div className="path-presets-popover__section-header path-presets-popover__section-header--static">
                        <span className="path-presets-popover__section-title">Basic Shapes</span>
                        <span className="path-presets-popover__section-count">{BASIC_PRESETS.length}</span>
                    </div>
                    <div className="path-presets-popover__grid">
                        {BASIC_PRESETS.map((preset) => (
                            <IconCard
                                key={preset.name}
                                name={preset.name}
                                viewBox="-1 -1 12 12"
                                pathD={preset.path}
                                filled={false}
                                pending={pendingPreset === preset.path}
                                onClick={() => handlePresetClick(preset.path)}
                            />
                        ))}
                    </div>
                    {CONNECTOR_GROUPS.map((group) => (
                        <React.Fragment key={group.label}>
                            <div className="path-presets-popover__sub-header">{group.label}</div>
                            <div className="path-presets-popover__grid">
                                {group.presets.map((preset) => (
                                    <IconCard
                                        key={preset.name}
                                        name={preset.name}
                                        viewBox="-1 -1 12 12"
                                        pathD={preset.path}
                                        filled={preset.filled ?? false}
                                        pending={pendingPreset === preset.path}
                                        onClick={() => handlePresetClick(preset.path)}
                                    />
                                ))}
                            </div>
                        </React.Fragment>
                    ))}
                </div>

                {/* Divider */}
                <div className="path-presets-popover__divider" />

                {isSearching ? (
                    /* ——— Search results: flat grid, no categories ——— */
                    <>
                        <div className="path-presets-popover__search-status">
                            {searchResults.length > 0
                                ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${search.trim()}"`
                                : `No icons found for "${search.trim()}"`
                            }
                        </div>
                        {searchResults.length > 0 && (
                            <div className="path-presets-popover__grid">
                                {searchResults.map((icon) => {
                                    const scaled = scaleBI(icon.path);
                                    return (
                                        <IconCard
                                            key={icon.name}
                                            name={icon.name}
                                            viewBox={icon.viewBox}
                                            pathD={icon.path}
                                            pending={pendingPreset === scaled}
                                            onClick={() => handleIconClick(icon)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    /* ——— Categories: collapsible sections ——— */
                    BOOTSTRAP_ICON_CATEGORIES.map((cat) => {
                        const icons = ICONS_BY_CATEGORY.get(cat);
                        if (!icons || icons.length === 0) return null;
                        const isExpanded = expanded.has(cat);
                        return (
                            <CategorySection
                                key={cat}
                                label={cat}
                                count={icons.length}
                                expanded={isExpanded}
                                onToggle={() => toggleCategory(cat)}
                            >
                                {icons.map((icon) => {
                                    const scaled = scaleBI(icon.path);
                                    return (
                                        <IconCard
                                            key={icon.name}
                                            name={icon.name}
                                            viewBox={icon.viewBox}
                                            pathD={icon.path}
                                            pending={pendingPreset === scaled}
                                            onClick={() => handleIconClick(icon)}
                                        />
                                    );
                                })}
                            </CategorySection>
                        );
                    })
                )}

                {/* Inline confirm overlay */}
                {pendingPreset !== null && (
                    <div className="path-presets-popover__confirm-overlay">
                        <div className="path-presets-popover__confirm">
                            <span className="path-presets-popover__confirm-text">Replace current path?</span>
                            <div className="path-presets-popover__confirm-actions">
                                <button
                                    className="path-presets-popover__confirm-btn path-presets-popover__confirm-btn--cancel"
                                    onClick={handleCancelReplace}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="path-presets-popover__confirm-btn path-presets-popover__confirm-btn--replace"
                                    onClick={handleConfirmReplace}
                                >
                                    Replace
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PathPresetsPopover;
