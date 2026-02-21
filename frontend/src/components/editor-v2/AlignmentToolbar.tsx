import React from 'react';

// SVG icons for alignment tools
const AlignIcons = {
    left: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="1.5" height="14" rx="0.5" />
            <rect x="4" y="3" width="10" height="3" rx="0.5" />
            <rect x="4" y="9" width="7" height="3" rx="0.5" />
        </svg>
    ),
    centerV: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="7.25" y="1" width="1.5" height="14" rx="0.5" opacity="0.4" />
            <rect x="2" y="3" width="12" height="3" rx="0.5" />
            <rect x="3.5" y="9" width="9" height="3" rx="0.5" />
        </svg>
    ),
    right: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="13.5" y="1" width="1.5" height="14" rx="0.5" />
            <rect x="2" y="3" width="10" height="3" rx="0.5" />
            <rect x="5" y="9" width="7" height="3" rx="0.5" />
        </svg>
    ),
    top: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="14" height="1.5" rx="0.5" />
            <rect x="3" y="4" width="3" height="10" rx="0.5" />
            <rect x="9" y="4" width="3" height="7" rx="0.5" />
        </svg>
    ),
    centerH: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="7.25" width="14" height="1.5" rx="0.5" opacity="0.4" />
            <rect x="3" y="2" width="3" height="12" rx="0.5" />
            <rect x="9" y="3.5" width="3" height="9" rx="0.5" />
        </svg>
    ),
    bottom: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="13.5" width="14" height="1.5" rx="0.5" />
            <rect x="3" y="2" width="3" height="10" rx="0.5" />
            <rect x="9" y="5" width="3" height="7" rx="0.5" />
        </svg>
    ),
    distributeH: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="1.5" height="14" rx="0.5" opacity="0.4" />
            <rect x="13.5" y="1" width="1.5" height="14" rx="0.5" opacity="0.4" />
            <rect x="4" y="3" width="3" height="10" rx="0.5" />
            <rect x="9" y="5" width="3" height="6" rx="0.5" />
        </svg>
    ),
    distributeV: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="14" height="1.5" rx="0.5" opacity="0.4" />
            <rect x="1" y="13.5" width="14" height="1.5" rx="0.5" opacity="0.4" />
            <rect x="3" y="4" width="10" height="3" rx="0.5" />
            <rect x="5" y="9" width="6" height="3" rx="0.5" />
        </svg>
    ),
};

interface AlignmentToolbarProps {
    selectedCount: number;
    onAlignLeft: () => void;
    onAlignCenterV: () => void;
    onAlignRight: () => void;
    onAlignTop: () => void;
    onAlignCenterH: () => void;
    onAlignBottom: () => void;
    onDistributeH: () => void;
    onDistributeV: () => void;
}

function AlignmentToolbar({
    selectedCount,
    onAlignLeft,
    onAlignCenterV,
    onAlignRight,
    onAlignTop,
    onAlignCenterH,
    onAlignBottom,
    onDistributeH,
    onDistributeV,
}: AlignmentToolbarProps) {
    if (selectedCount < 2) return null;

    return (
        <div className="alignment-toolbar">
            {/* Horizontal alignment */}
            <div className="alignment-toolbar__group">
                <span className="alignment-toolbar__label">Align</span>
                <button className="alignment-btn" onClick={onAlignLeft} title="Align left">
                    {AlignIcons.left}
                </button>
                <button className="alignment-btn" onClick={onAlignCenterV} title="Align center (vertical axis)">
                    {AlignIcons.centerV}
                </button>
                <button className="alignment-btn" onClick={onAlignRight} title="Align right">
                    {AlignIcons.right}
                </button>

                <div className="alignment-toolbar__divider" />

                <button className="alignment-btn" onClick={onAlignTop} title="Align top">
                    {AlignIcons.top}
                </button>
                <button className="alignment-btn" onClick={onAlignCenterH} title="Align center (horizontal axis)">
                    {AlignIcons.centerH}
                </button>
                <button className="alignment-btn" onClick={onAlignBottom} title="Align bottom">
                    {AlignIcons.bottom}
                </button>
            </div>

            {/* Distribution — only with 3+ nodes */}
            {selectedCount >= 3 && (
                <>
                    <div className="alignment-toolbar__separator" />
                    <div className="alignment-toolbar__group">
                        <span className="alignment-toolbar__label">Distribute</span>
                        <button className="alignment-btn" onClick={onDistributeH} title="Distribute horizontally">
                            {AlignIcons.distributeH}
                        </button>
                        <button className="alignment-btn" onClick={onDistributeV} title="Distribute vertically">
                            {AlignIcons.distributeV}
                        </button>
                    </div>
                </>
            )}

            <span className="alignment-toolbar__count">{selectedCount} selected</span>
        </div>
    );
}

export default AlignmentToolbar;
