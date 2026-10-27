<div className={"edge hoverable hide-ep clickthrough fullscreen Association"}>
{/* === EDGE COMPONENT - CHANGELOG ===
 * 
 * =============================================================================
 * v1.7.13 - 2026-01-16 19:00
 * =============================================================================
 *   LOC total: 2360 | LOC+: 50 | LOC-: 0 | LOC net: +50
 *   Author:   Human + Claude (Anthropic Claude Opus 4.5)
 *   Session:  conversational-dev-002 (continued)
 *   Prompts:  ~35
 *   Duration: ~100 min
 *   Context:  Auto-cancel anchor drag when released on empty space
 *   
 *   Key prompts:
 *   - "quando trascino l'anchor handle su area vuota, rimane pending"
 *   - "deve annullare automaticamente se rilascio su area vuota"
 *   - "simulare pressione Esc per attivare cancel di jjodel"
 *   
 *   === INTERACTION SUMMARY (updated) ===
 *   | Action              | Result                                           |
 *   |---------------------|--------------------------------------------------|
 *   | Hover               | Cursor: crosshair, pallina evidenziata           |
 *   | Hover + Shift       | Cursor: ew-resize/ns-resize (not-allowed for '0')|
 *   | Click + Drag        | Ghost circle follows mouse (jjodel behavior)     |
 *   | Release on anchor   | Changes anchor to new position                   |
 *   | Release on empty    | AUTO-CANCEL (simulates Esc) ← NEW                |
 *   | Shift + Click       | Fine-tuning (slide along side)                   |
 *   | Ctrl + Click        | Reset to default position                        |
 *   
 *   === CHANGES BY TYPE ===
 *   [FEATURE]  Auto-cancel on empty release (~50 LOC+)
 *              - isReleasedOnAnchor(): DOM tree walk to check '.anchor' class
 *              - simulateEscapeKey(): dispatches KeyboardEvent('Escape')
 *              - Applied to both start and end anchor handleNormalDragEnd
 *              - Pattern from jjodel: U.ancestorArray(event.target).some(...)
 *   [FIX]      No more "pending" state after releasing on empty space
 *              - Previously required manual Esc press
 *              - Now automatically cancels the operation
 *
 * =============================================================================
 * v1.7.12 - 2026-01-16 17:30
 * =============================================================================
 *   LOC total: 2310 | LOC+: 170 | LOC-: 8 | LOC net: +162
 *   Author:   Human + Claude (Anthropic Claude Opus 4)
 *   Session:  conversational-dev-002 (continued)
 *   Prompts:  ~30
 *   Duration: ~90 min
 *   Context:  Ghost circle visual feedback during anchor drag
 *   
 *   Key prompts:
 *   - "quando vado sull'anchor handle, non si evidenzia come faceva prima"
 *   - "pallina grigia che segue il mouse durante drag"
 *   - "click e tieni premuto per mostrare ghost"
 *   - "il pallino grigio scompare dentro il box" (z-index fix)
 *   
 *   === INTERACTION SUMMARY (updated) ===
 *   | Action              | Result                                           |
 *   |---------------------|--------------------------------------------------|
 *   | Hover               | Cursor: crosshair, pallina evidenziata           |
 *   | Hover + Shift       | Cursor: ew-resize/ns-resize (not-allowed for '0')|
 *   | Click + Drag        | Ghost circle follows mouse (jjodel behavior)     |
 *   | Shift + Click       | Fine-tuning (slide along side)                   |
 *   | Ctrl + Click        | Reset to default position                        |
 *   
 *   === CHANGES BY TYPE ===
 *   [FEATURE]  Ghost circle during normal drag (~60 LOC+)
 *              - Gray circle (#888, opacity 0.7) follows mouse
 *              - Appears after 5px movement threshold
 *              - HTML div with position:fixed, z-index:99999
 *              - Global listeners: mousedown, mousemove, mouseup
 *   [FIX]      Anchor handle hover highlighting (~10 LOC+)
 *              - Added dynamic '.hover' class via onMouseEnter/Leave
 *              - Removed inline cursor style to let CSS handle hover
 *   [FIX]      Shift+hover cursor preview (~5 LOC+)
 *              - Uses hoverAnchor and hoverShiftPressed state
 *              - Cursor set via inline style only when shift pressed
 *   [FIX]      Segment render safety check (~8 LOC+)
 *              - Added null check for s.start/s.end in segments.all.map
 *              - Prevents "Cannot read properties of undefined" error
 *   [CLEANUP]  Removed SVG ghost circle (~12 LOC-)
 *              - Replaced with HTML div approach for z-index control
 *   [CLEANUP]  Removed unused ghost position state code (~20 LOC-)
 *              - Simplified to use global window variables
 *
 * =============================================================================
 * v1.7.11 - 2026-01-16 13:00
 * =============================================================================
 *   LOC total: 2148 | LOC+: 490 | LOC-: 145 | LOC net: +345
 *   Author:   Human + Claude (Anthropic Claude Opus 4)
 *   Session:  conversational-dev-002
 *   Prompts:  45
 *   Duration: ~150 min
 *   Context:  Anchor Handle fine-tuning with full interaction system
 *   
 *   Key prompts:
 *   - "differenziare stile handle quando cerchiamo di cambiarlo (1) da quando lo shiftiamo (2)"
 *   - "Shift+Click visualizza pallino in maniera diversa, frecce che mostrano direzioni"
 *   - "colore #0480A8, bordo 4px stesso colore opacitÃ  1"
 *   - "frecce all'esterno del bordo, unicode â—€â–¶â–²â–¼"
 *   - "proviamo a togliere le frecce"
 *   - "hover + shift deve mostrare cursore ew-resize/ns-resize"
 *   - "anchor '0' deve mostrare not-allowed"
 *   - "Ctrl+Click per reset a posizione default"
 *   
 *   === TERMINOLOGY ===
 *   - Node Anchors: The anchor points on a node (tl, t, tr, l, 0, r, bl, b, br, etc.)
 *   - Endpoint: Where an edge attaches (start endpoint / end endpoint)
 *   - Anchor Handle: The draggable circle on the edge (the UI element)
 *   - Edge Handles: The green squares for bending edges (existing)
 *   
 *   === INTERACTION SUMMARY ===
 *   | Action              | Result                                           |
 *   |---------------------|--------------------------------------------------|
 *   | Hover               | Cursor: pointer                                  |
 *   | Hover + Shift       | Cursor: ew-resize/ns-resize (not-allowed for '0')|
 *   | Click               | Change anchor (jjodel behavior)                  |
 *   | Shift + Click       | Fine-tuning (slide along side)                   |
 *   | Ctrl + Click        | Reset to default position                        |
 *   
 *   === CHANGES BY TYPE ===
 *   [FEATURE]  Shift+Click fine-tuning mode (~150 LOC+)
 *              - Drag anchor handle along its side
 *              - Fluid DOM manipulation during drag
 *              - Snap to grid (30px) on release
 *   [FEATURE]  Ctrl+Click reset to default (~25 LOC+)
 *              - Resets anchor to original position from ANCHOR_POSITIONS
 *              - Works on both start and end endpoints
 *   [FEATURE]  Hover + Shift cursor preview (~60 LOC+)
 *              - Shows directional cursor before clicking
 *              - Shows not-allowed for center anchor ('0')
 *   [UI]       Shift mode visual feedback (~40 LOC+)
 *              - Circle: #0480A8 fill (0.3 opacity) + stroke (100%, 4px)
 *              - Cursor: ew-resize (horizontal) / ns-resize (vertical)
 *   [UI]       Center anchor ('0') handling (~15 LOC+)
 *              - Shows not-allowed cursor on Shift+hover and Shift+click
 *   [CONFIG]   Styling constants (~9 LOC+)
 *              - ANCHOR_SHIFT_FILL = 'rgba(4, 128, 168, 0.3)'
 *              - ANCHOR_SHIFT_RADIUS = 10
 *              - ANCHOR_SHIFT_STROKE = '#0480A8'
 *              - ANCHOR_SHIFT_STROKE_WIDTH = 4
 *              - ANCHOR_ARROW_OFFSET = 30 (arrows disabled but configurable)
 *              - ANCHOR_ARROW_FONT_SIZE = 16
 *              - ANCHOR_ARROW_COLOR = '#0480A8'
 *   [FIX]      Coordinate conversion (~10 LOC+)
 *              - Uses getBoundingClientRect() for mouse-to-canvas mapping
 *   [FIX]      Mouse release handling (~8 LOC+)
 *              - Capture phase listeners to intercept before jjodel
 *              - Proper cleanup of event listeners
 *   [FIX]      JSX Fragment compatibility (~4 LOC+)
 *              - Replaced < > with arrays [] for jjodel compiler
 *   [DISABLED] Arrow indicators (~80 LOC+, commented out)
 *              - Unicode arrows (â—€â–¶â–²â–¼) ready to re-enable if needed
 *
 * =============================================================================
 * v1.7.10 - 2026-01-15 02:30
 * =============================================================================
 *   Lines:    1780 total
 *   Author:   Human + Claude (Anthropic Claude Opus 4)
 *   Session:  conversational-dev-001
 *   Prompts:  56
 *   Duration: ~200 min
 *   Context:  Fluid anchor drag with snap on release
 *   
 *   Changes:
 *   [FEATURE]  Drag anchor handles FLUIDLY along their side
 *   [FEATURE]  Snap to grid (30px) only on mouse release
 *   [FEATURE]  Modifies node anchor position (edge.start.anchors[name].x/y)
 *   [FEATURE]  Anchor stays on its side (no corner jumping)
 *   [REMOVED]  Snap point circles visualization (not needed with fluid drag)
 *   
 *   How it works:
 *   1. Click and drag anchor handle
 *   2. Anchor follows mouse fluidly along its side
 *   3. On release: snap to nearest grid position (ANCHOR_SNAP_GRID = 30px)
 *   4. Corners excluded (ANCHOR_CORNER_THRESHOLD = 0.08)
 *   
 *   Note: This modifies node.anchors[anchorName], not edge.anchorStart/End
 *         The anchor NAME stays the same, only its POSITION changes.
 *
 * =============================================================================
 * v1.7.9 - 2026-01-15 02:00
 * =============================================================================
 *   Lines:    1690 total
 *   Author:   Human + Claude (Anthropic Claude Opus 4)
 *   Session:  conversational-dev-001
 *   Prompts:  52
 *   Duration: ~180 min
 *   Context:  Anchor drag with snap to predefined anchor points
 *   
 *   Changes:
 *   [FEATURE]  Drag anchor handles to snap between predefined anchor points
 *   [FEATURE]  Anchors constrained to their current side (no corner jumping)
 *   [FEATURE]  Valid anchors per side: top=[ttl,t,ttr], bottom=[bbl,b,bbr], 
 *              left=[tll,l,bll], right=[trr,r,brr]
 *   [FEATURE]  Live update: edge.anchorStart/End assigned during drag
 *   [UI]       Snap points shown as circles during drag
 *   [HELPER]   getSideFromAnchorName() - get side from anchor name
 *   [HELPER]   findClosestAnchor() - find nearest anchor to mouse
 *   [HELPER]   getAnchorSnapPoints() - get pixel positions for side anchors
 *   [DATA]     SIDE_ANCHORS - valid anchors per side
 *   [DATA]     ANCHOR_POSITIONS - normalized positions for all anchors
 *   
 *   Note: This version adds drag-to-snap on top of existing jjodel behavior.
 *         If issues occur, rollback to v1.7.8-backup.jsx
 *
 * =============================================================================
 * v1.7.8 - 2026-01-15 01:30
 * =============================================================================
 *   Lines:    1530 total
 *   Author:   Human + Claude (Anthropic Claude Opus 4)
 *   Session:  conversational-dev-001
 *   Prompts:  48
 *   Duration: ~165 min
 *   Context:  Anchor drag with snap grid (preparation)
 *   
 *   Changes:
 *   [FEATURE]  Anchor drag helpers: getAnchorSide, calcAnchorPosOnSide, getSnapPointsForSide
 *   [FEATURE]  Snap points visualization during anchor drag
 *   [CONFIG]   ANCHOR_SNAP_GRID = 30 (same as box snap)
 *   [CONFIG]   ANCHOR_CORNER_THRESHOLD = 0.08 (exclude corners)
 *   [CONFIG]   ANCHOR_HANDLE_RADIUS = 8
 *   [UI]       Show snap point circles when dragging anchor
 *   
 *   Note: This version adds the infrastructure for anchor drag.
 *         The actual snapping during drag requires jjodel integration
 *         (intercepting mouse move events while edge.startFollow is true)
 *
 * =============================================================================
 * v1.7.7 - 2026-01-15 01:00
 * =============================================================================
 *   Lines:    1340 total
 *   Author:   Human + Claude (Anthropic Claude Opus 4)
 *   Session:  conversational-dev-001
 *   Prompts:  42
 *   Duration: ~145 min
 *   Context:  Translation-based rendering for maximum performance
 *   
 *   Changes:
 *   [PERF]     Path calculated ONCE per position (0-3) globally
 *   [PERF]     Paths stored in window.__selfLoopStaticPaths (4 paths total)
 *   [PERF]     Only translateX/translateY change on box move/resize
 *   [PERF]     SVG uses <g transform="translate(x,y)"> with static path
 *   [PERF]     No string concatenation on render - just number updates
 *   
 *   Performance comparison:
 *   - v1.7.6: Recalculate path string on every box change
 *   - v1.7.7: Calculate path ONCE, then just update transform coords
 *
 * =============================================================================
 * v1.7.6 - 2026-01-15 00:45
 * =============================================================================
 *   Lines:    1300 total
 *   Author:   Human + Claude (Anthropic Claude Opus 4)
 *   Session:  conversational-dev-001
 *   Prompts:  38
 *   Duration: ~130 min
 *   Context:  Self-loop path caching for performance
 *   
 *   Changes:
 *   [PERF]     Added caching for self-loop path calculation
 *   [PERF]     Cache key based on box dimensions + selfLoopIndex
 *   [PERF]     Cached: path, startPt, endPt, labelPos, elabelPos, slabelPos
 *   [PERF]     Cache invalidated only when box resizes or moves
 *   
 *   Note: Self-loop now uses same caching pattern as normal edges.
 *         Path recalculated only when cacheKey changes.
 *
 * =============================================================================
 * v1.7.5 - 2026-01-15 00:30
 * =============================================================================
 *   Lines:    1270 total
 *   Author:   Human + Claude (Anthropic Claude Opus 4)
 *   Session:  conversational-dev-001
 *   Prompts:  34
 *   Duration: ~115 min
 *   Context:  Multi-position self-loops with auto-registry (no Model changes needed)
 *   
 *   Changes:
 *   [FEATURE]  Support for up to 4 self-loops per box (clockwise positions)
 *   [FEATURE]  Self-loop positions: top-left, top-right, bottom-right, bottom-left
 *   [FEATURE]  Automatic index assignment via lightweight global registry
 *   [PERF]     O(1) lookup for self-loop index, minimal memory footprint
 *   [CONFIG]   SELF_LOOP_OFFSET: distance loop extends from box (default: 40)
 *   [CONFIG]   SELF_LOOP_PADDING: gap between loop and box edge (default: 30)
 *   [CONFIG]   SELF_LOOP_ANCHOR_OFFSET: fixed pixel offset from corner (default: 25)
 *   [STYLE]    Anchor points now use fixed pixels instead of percentages
 *   [STYLE]    Dynamic label alignment based on loop position
 *   
 *   Note: No Model view changes required! Self-loop indices are auto-assigned.
 *         Optional: pass props.selfLoopIndex to override auto-assignment.
 *
 * =============================================================================
 * v1.7.4 - 2026-01-15 00:00
 * =============================================================================
 *   Lines:    1130 total | +25 added | -15 removed
 *   Author:   Human + Claude (Anthropic Claude Opus 4)
 *   Session:  conversational-dev-001
 *   Prompts:  28
 *   Duration: ~90 min
 *   Context:  Orthogonal rectangular self-loop style (user preference)
 *   
 *   Changes:
 *   [STYLE]    Changed self-loop from circular to orthogonal rectangular
 *   [STYLE]    Self-loop exits from LEFT, goes up, enters from TOP
 *   [STYLE]    Uses same BEND_RADIUS as normal edges for consistency
 *   [STYLE]    Updated label positions for new path geometry
 *   [CLEANUP]  Removed debug console.log statements
 *   
 *   Note: Requires Model view change:
 *         refEdges = (suggestedEdges.reference || []).filter(e => e.sameGraph)
 *         (remove !e.vertexOverlaps filter to allow self-loops)
 *
 * =============================================================================
 * v1.7.3 - 2026-01-14 23:21
 * =============================================================================
 *   Lines:    1080 total | +27 added | -0 removed
 *   Author:   Human + Claude (Anthropic Claude Opus 4)
 *   Session:  conversational-dev-001
 *   Prompts:  18
 *   Duration: ~65 min
 *   Context:  Improved self-loop detection with multiple methods
 *   
 *   Changes:
 *   [BUGFIX]   Added 5 different methods to detect self-loop
 *   [DEBUG]    Added console.log to debug self-loop detection
 *   
 *   Detection methods:
 *   1. Same object reference (startBox === endBox)
 *   2. Same id property (startBox.id === endBox.id)
 *   3. Same model.id (startBox.model.id === endBox.model.id)
 *   4. Same coordinates (x, y, w, h all equal)
 *   5. Edge node references match
 *
 * =============================================================================
 * v1.7.2 - 2026-01-14 23:20
 * =============================================================================
 *   Lines:    1050 total | +130 added | -0 removed
 *   Author:   Human + Claude (Anthropic Claude Opus 4)
 *   Session:  conversational-dev-001
 *   Prompts:  16
 *   Duration: ~60 min
 *   Context:  Minimal changes - self-loop only, no caching (safer approach)
 *   
 *   Changes:
 *   [FEATURE]  Self-loop detection and rendering (circular arc style)
 *   [FEATURE]  Self-loop configurable: SELF_LOOP_RADIUS, SELF_LOOP_PADDING
 *   [BUGFIX]   Fixed hover timeout race condition (stored in edge.state)
 *   [REFACTOR] Cleaner getEdgeState/setEdgeState helpers
 *   
 *   Note: This is a MINIMAL change version. Caching removed for stability.
 *         Future versions can re-add caching after more testing.
 *
 * =============================================================================
 * v1.6.0 - Invisible hover rects for flicker-free hover
 * =============================================================================
 *   Lines:    920 total | +85 added | -12 removed
 *   Author:   Human
 *   Context:  UX improvement - hover detection
 *   
 *   Changes:
 *   [FEATURE]  Added invisible rect for each edge segment
 *   [FEATURE]  Rects have HOVER_RECT_THICKNESS (20px) for easy hover detection
 *   [FEATURE]  onMouseEnter/Leave adds/removes 'force-hover' class to edge div
 *   [BUGFIX]   Small delay (50ms) on leave to prevent flicker between segments
 *   [UX]       No more flicker when moving mouse along edge!
 * 
 * ... (previous changelog entries) ...
 * 
 * === */}

{(() => {
  try {
    /* ============================================================
     * 1. CONFIGURATION CONSTANTS
     * ============================================================ */

    const SIDE_TO_RAD = { left: 0, right: Math.PI, top: Math.PI / 2, bottom: -Math.PI / 2, center: 0 };
    const ESCAPE_DIST = 40;
    const BEND_RADIUS = 4;
    const BEND_GRID_SIZE = 25;
    const HOVER_RECT_THICKNESS = 20;
    
    // Self-loop configuration (NEW in v1.7.2, UPDATED v1.7.5)
    const SELF_LOOP_OFFSET = 40;           // How far the loop extends from the box
    const SELF_LOOP_PADDING = 30;          // Padding between loop and box edge
    const SELF_LOOP_ANCHOR_OFFSET = 25;    // Fixed pixel offset from corner for anchor points
    
    // Self-loop positions for multiple loops (clockwise from top-left)
    // Each position defines: exitSide, entrySide, corner for the loop
    const SELF_LOOP_POSITIONS = [
      { name: 'top-left',     exitSide: 'left',   entrySide: 'top',    cornerX: -1, cornerY: -1 },
      { name: 'top-right',    exitSide: 'top',    entrySide: 'right',  cornerX: 1,  cornerY: -1 },
      { name: 'bottom-right', exitSide: 'right',  entrySide: 'bottom', cornerX: 1,  cornerY: 1  },
      { name: 'bottom-left',  exitSide: 'bottom', entrySide: 'left',   cornerX: -1, cornerY: 1  }
    ];
    
    // Anchor drag configuration (NEW in v1.7.8)
    const ANCHOR_SNAP_GRID = 30;           // Snap grid in pixels (same as box snap)
    const ANCHOR_CORNER_THRESHOLD = 0.08;  // Exclude corners: values < 0.08 or > 0.92 are blocked
    const ANCHOR_HANDLE_RADIUS = 8;        // Radius of the draggable anchor handle
    
    // Anchor shift mode styling (NEW in v1.7.11)
    const ANCHOR_SHIFT_FILL = 'rgba(4, 128, 168, 0.3)';   // #0480A8 with 0.3 opacity (lighter fill)
    const ANCHOR_SHIFT_RADIUS = 10;                        // Slightly larger radius in shift mode
    const ANCHOR_SHIFT_STROKE = '#0480A8';                 // Teal/blue stroke (full opacity)
    const ANCHOR_SHIFT_STROKE_WIDTH = 4;                   // Stroke width
    const ANCHOR_ARROW_OFFSET = 30;                        // 10 (radius) + 4 (stroke/2) + 16 = 30
    const ANCHOR_ARROW_FONT_SIZE = 16;                     // Font size for arrow characters
    const ANCHOR_ARROW_COLOR = '#0480A8';                  // Teal/blue for arrows
    
    // Anchor ghost circle styling (NEW in v1.7.11 - normal drag mode)
    const ANCHOR_GHOST_FILL = '#888888';                   // Gray fill for ghost circle
    const ANCHOR_GHOST_OPACITY = 0.7;                      // Opacity for ghost circle
    
    // Label offsets (unchanged from v1.6.0)
    const MAIN_LABEL_ABOVE_X = 0, MAIN_LABEL_ABOVE_Y = 22;
    const MAIN_LABEL_BELOW_X = 0, MAIN_LABEL_BELOW_Y = 22;
    const MAIN_LABEL_TOLEFT_X = 1, MAIN_LABEL_TOLEFT_Y = 8;
    const MAIN_LABEL_TORIGHT_X = 1, MAIN_LABEL_TORIGHT_Y = 8;
    
    const CARD_LABEL_UP_TOLEFT_X = 10, CARD_LABEL_UP_TOLEFT_Y = 7;
    const CARD_LABEL_UP_TORIGHT_X = 10, CARD_LABEL_UP_TORIGHT_Y = 7;
    const CARD_LABEL_DOWN_TOLEFT_X = 10, CARD_LABEL_DOWN_TOLEFT_Y = 30;
    const CARD_LABEL_DOWN_TORIGHT_X = 10, CARD_LABEL_DOWN_TORIGHT_Y = 30;
    const CARD_LABEL_RIGHT_ABOVE_X = 0, CARD_LABEL_RIGHT_ABOVE_Y = 16;
    const CARD_LABEL_RIGHT_BELOW_X = 0, CARD_LABEL_RIGHT_BELOW_Y = 10;
    const CARD_LABEL_LEFT_ABOVE_X = 110, CARD_LABEL_LEFT_ABOVE_Y = 16;
    const CARD_LABEL_LEFT_BELOW_X = 110, CARD_LABEL_LEFT_BELOW_Y = 10;
    
    const MIN_SEGMENT_LENGTH = 50;

    /* ============================================================
     * 2. HELPER FUNCTIONS (NEW - Safe state access)
     * ============================================================ */

    const getEdgeState = function(key, defaultVal) {
      if (!edge.state) return defaultVal;
      if (edge.state[key] === undefined) return defaultVal;
      return edge.state[key];
    };

    const setEdgeState = function(key, value) {
      var newState = {};
      if (edge.state) {
        for (var k in edge.state) {
          if (edge.state.hasOwnProperty(k)) {
            newState[k] = edge.state[k];
          }
        }
      }
      newState[key] = value;
      edge.state = newState;
    };

    /* ============================================================
     * 2b. ANCHOR DRAG HELPERS (NEW in v1.7.8, EXTENDED v1.7.9)
     * ============================================================ */
    
    // Valid anchors for each side (excluding corners)
    const SIDE_ANCHORS = {
      'top':    ['ttl', 't', 'ttr'],
      'bottom': ['bbl', 'b', 'bbr'],
      'left':   ['tll', 'l', 'bll'],
      'right':  ['trr', 'r', 'brr']
    };
    
    // Anchor name to position mapping (normalized 0-1)
    const ANCHOR_POSITIONS = {
      // Corners (excluded from drag)
      'tl':  { x: 0,    y: 0 },
      'tr':  { x: 1,    y: 0 },
      'bl':  { x: 0,    y: 1 },
      'br':  { x: 1,    y: 1 },
      // Centers
      't':   { x: 0.5,  y: 0 },
      'b':   { x: 0.5,  y: 1 },
      'l':   { x: 0,    y: 0.5 },
      'r':   { x: 1,    y: 0.5 },
      '0':   { x: 0.5,  y: 0.5 },
      // Intermediates
      'ttl': { x: 0.25, y: 0 },
      'ttr': { x: 0.75, y: 0 },
      'bbl': { x: 0.25, y: 1 },
      'bbr': { x: 0.75, y: 1 },
      'tll': { x: 0,    y: 0.25 },
      'bll': { x: 0,    y: 0.75 },
      'trr': { x: 1,    y: 0.25 },
      'brr': { x: 1,    y: 0.75 }
    };
    
    // Get side from anchor name
    const getSideFromAnchorName = function(anchorName) {
      if (!anchorName) return null;
      for (var side in SIDE_ANCHORS) {
        if (SIDE_ANCHORS[side].indexOf(anchorName) !== -1) {
          return side;
        }
      }
      // Check corners and assign to a side
      if (anchorName === 'tl' || anchorName === 'tr' || anchorName === 't' || anchorName === 'ttl' || anchorName === 'ttr') return 'top';
      if (anchorName === 'bl' || anchorName === 'br' || anchorName === 'b' || anchorName === 'bbl' || anchorName === 'bbr') return 'bottom';
      if (anchorName === 'tl' || anchorName === 'bl' || anchorName === 'l' || anchorName === 'tll' || anchorName === 'bll') return 'left';
      if (anchorName === 'tr' || anchorName === 'br' || anchorName === 'r' || anchorName === 'trr' || anchorName === 'brr') return 'right';
      return null;
    };
    
    // Get anchor position in pixels
    const getAnchorPixelPos = function(anchorName, box) {
      if (!anchorName || !box) return null;
      var pos = ANCHOR_POSITIONS[anchorName];
      if (!pos) return null;
      return {
        x: box.x + pos.x * box.w,
        y: box.y + pos.y * box.h
      };
    };
    
    // Find closest anchor to mouse position
    const findClosestAnchor = function(mouseX, mouseY, validAnchors, box) {
      if (!validAnchors || !box) return null;
      
      var closestAnchor = null;
      var closestDist = Infinity;
      
      for (var i = 0; i < validAnchors.length; i++) {
        var anchorName = validAnchors[i];
        var pos = getAnchorPixelPos(anchorName, box);
        if (pos) {
          var dx = mouseX - pos.x;
          var dy = mouseY - pos.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < closestDist) {
            closestDist = dist;
            closestAnchor = anchorName;
          }
        }
      }
      
      return closestAnchor;
    };
    
    // Get snap points as pixel positions for a side
    const getAnchorSnapPoints = function(box, side) {
      if (!box || !side) return [];
      var anchors = SIDE_ANCHORS[side] || [];
      var points = [];
      for (var i = 0; i < anchors.length; i++) {
        var pos = getAnchorPixelPos(anchors[i], box);
        if (pos) {
          points.push({ x: pos.x, y: pos.y, name: anchors[i] });
        }
      }
      return points;
    };
    
    // Determine which side of the box an anchor point is on based on its position
    const getAnchorSide = function(anchorPos, box) {
      if (!anchorPos || !box) return null;
      // anchorPos is {x: 0-1, y: 0-1} where (0,0) is top-left of box
      var x = anchorPos.x;
      var y = anchorPos.y;
      
      // Check if on edges (with small tolerance)
      var onLeft = x < 0.02;
      var onRight = x > 0.98;
      var onTop = y < 0.02;
      var onBottom = y > 0.98;
      
      if (onLeft) return 'left';
      if (onRight) return 'right';
      if (onTop) return 'top';
      if (onBottom) return 'bottom';
      return null; // center or unknown
    };
    
    // Calculate new anchor position from mouse coordinates, constrained to a side
    const calcAnchorPosOnSide = function(mouseX, mouseY, box, side) {
      if (!box || !side) return null;
      
      var relX = mouseX - box.x;
      var relY = mouseY - box.y;
      var newVal;
      
      if (side === 'top' || side === 'bottom') {
        // Horizontal movement along top or bottom
        newVal = relX / box.w;
      } else {
        // Vertical movement along left or right
        newVal = relY / box.h;
      }
      
      // Snap to grid
      var sideLength = (side === 'top' || side === 'bottom') ? box.w : box.h;
      var snappedPixel = Math.round((newVal * sideLength) / ANCHOR_SNAP_GRID) * ANCHOR_SNAP_GRID;
      var snappedVal = snappedPixel / sideLength;
      
      // Clamp to exclude corners
      snappedVal = Math.max(ANCHOR_CORNER_THRESHOLD, Math.min(1 - ANCHOR_CORNER_THRESHOLD, snappedVal));
      
      // Return new anchor position
      if (side === 'top') return { x: snappedVal, y: 0 };
      if (side === 'bottom') return { x: snappedVal, y: 1 };
      if (side === 'left') return { x: 0, y: snappedVal };
      if (side === 'right') return { x: 1, y: snappedVal };
      return null;
    };
    
    // Get all valid snap points for a side (for visual feedback)
    const getSnapPointsForSide = function(box, side) {
      if (!box || !side) return [];
      
      var sideLength = (side === 'top' || side === 'bottom') ? box.w : box.h;
      var points = [];
      
      // Calculate snap points based on grid
      for (var pos = ANCHOR_SNAP_GRID; pos < sideLength; pos += ANCHOR_SNAP_GRID) {
        var val = pos / sideLength;
        // Exclude corners
        if (val >= ANCHOR_CORNER_THRESHOLD && val <= 1 - ANCHOR_CORNER_THRESHOLD) {
          var pt;
          if (side === 'top') pt = { x: box.x + pos, y: box.y };
          else if (side === 'bottom') pt = { x: box.x + pos, y: box.y + box.h };
          else if (side === 'left') pt = { x: box.x, y: box.y + pos };
          else if (side === 'right') pt = { x: box.x + box.w, y: box.y + pos };
          if (pt) points.push(pt);
        }
      }
      return points;
    };
    
    // Convert anchor {x, y} (0-1) to absolute pixel position
    const anchorToPixel = function(anchor, box) {
      if (!anchor || !box) return null;
      return {
        x: box.x + anchor.x * box.w,
        y: box.y + anchor.y * box.h
      };
    };

    /* ============================================================
     * 2c. ANCHOR RELEASE HELPERS (NEW in v1.7.13)
     * ============================================================
     * These helpers detect if the mouse was released on a valid anchor
     * and simulate Escape key press to cancel the operation if not.
     * Pattern from jjodel: U.ancestorArray(event.target).some(...)
     * ============================================================ */
    
    // Check if event target or any ancestor has '.anchor' class
    const isReleasedOnAnchor = function(eventTarget) {
      var el = eventTarget;
      while (el && el !== document) {
        if (el.classList && el.classList.contains('anchor')) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    };
    
    // Simulate Escape key press to trigger jjodel's cancel behavior
    const simulateEscapeKey = function() {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true
      }));
    };

    /* ============================================================
     * 3. SELF-LOOP CHECK (NEW in v1.7.2)
     * ============================================================ */
    
    const startBox = edge.start;
    const endBox = edge.end;
    
    // Multiple ways to detect self-loop
    var isSelfLoop = false;
    
    // Method 1: Same object reference
    if (startBox === endBox) {
      isSelfLoop = true;
    }
    // Method 2: Same id property
    else if (startBox && endBox && startBox.id && endBox.id && startBox.id === endBox.id) {
      isSelfLoop = true;
    }
    // Method 3: Same model.id (jjodel structure)
    else if (startBox && endBox && startBox.model && endBox.model && 
             startBox.model.id && endBox.model.id && startBox.model.id === endBox.model.id) {
      isSelfLoop = true;
    }
    // Method 4: Check if coordinates are identical (same position = likely same box)
    else if (startBox && endBox && 
             startBox.x === endBox.x && startBox.y === endBox.y &&
             startBox.w === endBox.w && startBox.h === endBox.h) {
      isSelfLoop = true;
    }
    // Method 5: Check edge's own start/end references
    else if (edge.anchorStart && edge.anchorEnd && edge.start && edge.end) {
      // If the edge references point to same node in model
      var startNodeId = startBox.model ? startBox.model.id : (startBox.id || null);
      var endNodeId = endBox.model ? endBox.model.id : (endBox.id || null);
      if (startNodeId && endNodeId && startNodeId === endNodeId) {
        isSelfLoop = true;
      }
    }
    
    // Self-loop detected, will render orthogonal rectangular style
    
    /* ============================================================
     * 4. SELF-LOOP RENDERING (v1.7.7 - translation-based for performance)
     * ============================================================
     * Optimization: Path is calculated ONCE per position (0-3) in relative
     * coordinates, then translated to box position. Only translateX/Y change
     * when box moves/resizes - no path recalculation needed!
     * ============================================================ */
    
    if (isSelfLoop && startBox) {
      // Get box dimensions
      var boxX = startBox.x || 0;
      var boxY = startBox.y || 0;
      var boxW = startBox.w || 100;
      var boxH = startBox.h || 50;
      var r = BEND_RADIUS;
      
      // Determine which position to use (0-3, cycles through corners)
      var selfLoopIndex = 0;
      
      if (props.selfLoopIndex !== undefined) {
        selfLoopIndex = props.selfLoopIndex;
      } else {
        // Lightweight global registry - O(1) lookup
        var registry = window.__selfLoopRegistry || (window.__selfLoopRegistry = {});
        var boxId = startBox.model ? startBox.model.id : (startBox.id || 'unknown');
        var edgeId = edge.model ? edge.model.id : (edge.id || props.id || 'unknown');
        
        if (!registry[boxId]) registry[boxId] = {};
        
        if (registry[boxId][edgeId] === undefined) {
          var used = Object.values(registry[boxId]);
          var idx = 0;
          while (used.indexOf(idx) !== -1 && idx < 4) idx++;
          registry[boxId][edgeId] = idx % 4;
        }
        
        selfLoopIndex = registry[boxId][edgeId];
      }
      
      var posIndex = selfLoopIndex % 4;
      
      // === STATIC PATHS: Pre-computed relative paths (calculated once) ===
      // These are in RELATIVE coordinates - will be translated to box position
      var staticCache = window.__selfLoopStaticPaths || (window.__selfLoopStaticPaths = {});
      
      if (!staticCache[posIndex]) {
        // Calculate path ONCE for this position (relative to origin 0,0)
        var anchorOffset = SELF_LOOP_ANCHOR_OFFSET;
        var loopOffset = SELF_LOOP_OFFSET;
        var loopPadding = SELF_LOOP_PADDING;
        
        var relPath, relStartPt, relEndPt, relLabelPos, relElabelPos, relSlabelPos;
        
        if (posIndex === 0) { // top-left
          relStartPt = { x: 0, y: anchorOffset };
          relEndPt = { x: anchorOffset, y: 0 };
          var c1 = { x: -loopOffset, y: anchorOffset };
          var c2 = { x: -loopOffset, y: -loopPadding };
          var c3 = { x: anchorOffset, y: -loopPadding };
          
          relPath = 'M 0 ' + anchorOffset;
          relPath += ' L ' + (-loopOffset + r) + ' ' + anchorOffset;
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + (-loopOffset) + ' ' + (anchorOffset - r);
          relPath += ' L ' + (-loopOffset) + ' ' + (-loopPadding + r);
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + (-loopOffset + r) + ' ' + (-loopPadding);
          relPath += ' L ' + (anchorOffset - r) + ' ' + (-loopPadding);
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + anchorOffset + ' ' + (-loopPadding + r);
          relPath += ' L ' + anchorOffset + ' 0';
          
          relLabelPos = { x: (-loopOffset + anchorOffset) / 2, y: -loopPadding - 12 };
          relElabelPos = { x: anchorOffset + 8, y: -loopPadding + 3, align: 'left' };
          relSlabelPos = { x: -loopOffset - 5, y: (anchorOffset - loopPadding) / 2, align: 'right' };
          
        } else if (posIndex === 1) { // top-right (relative to top-right corner)
          relStartPt = { x: -anchorOffset, y: 0 };
          relEndPt = { x: 0, y: anchorOffset };
          
          relPath = 'M ' + (-anchorOffset) + ' 0';
          relPath += ' L ' + (-anchorOffset) + ' ' + (-loopPadding + r);
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + (-anchorOffset + r) + ' ' + (-loopPadding);
          relPath += ' L ' + (loopOffset - r) + ' ' + (-loopPadding);
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + loopOffset + ' ' + (-loopPadding + r);
          relPath += ' L ' + loopOffset + ' ' + (anchorOffset - r);
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + (loopOffset - r) + ' ' + anchorOffset;
          relPath += ' L 0 ' + anchorOffset;
          
          relLabelPos = { x: (-anchorOffset + loopOffset) / 2, y: -loopPadding - 12 };
          relElabelPos = { x: loopOffset + 5, y: (-loopPadding + anchorOffset) / 2, align: 'left' };
          relSlabelPos = { x: -anchorOffset, y: -loopPadding - 5, align: 'center' };
          
        } else if (posIndex === 2) { // bottom-right (relative to bottom-right corner)
          relStartPt = { x: 0, y: -anchorOffset };
          relEndPt = { x: -anchorOffset, y: 0 };
          
          relPath = 'M 0 ' + (-anchorOffset);
          relPath += ' L ' + (loopOffset - r) + ' ' + (-anchorOffset);
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + loopOffset + ' ' + (-anchorOffset + r);
          relPath += ' L ' + loopOffset + ' ' + (loopPadding - r);
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + (loopOffset - r) + ' ' + loopPadding;
          relPath += ' L ' + (-anchorOffset + r) + ' ' + loopPadding;
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + (-anchorOffset) + ' ' + (loopPadding - r);
          relPath += ' L ' + (-anchorOffset) + ' 0';
          
          relLabelPos = { x: (loopOffset - anchorOffset) / 2, y: loopPadding + 5 };
          relElabelPos = { x: -anchorOffset, y: loopPadding + 5, align: 'center' };
          relSlabelPos = { x: loopOffset + 5, y: (-anchorOffset + loopPadding) / 2, align: 'left' };
          
        } else { // bottom-left (posIndex === 3, relative to bottom-left corner)
          relStartPt = { x: anchorOffset, y: 0 };
          relEndPt = { x: 0, y: -anchorOffset };
          
          relPath = 'M ' + anchorOffset + ' 0';
          relPath += ' L ' + anchorOffset + ' ' + (loopPadding - r);
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + (anchorOffset - r) + ' ' + loopPadding;
          relPath += ' L ' + (-loopOffset + r) + ' ' + loopPadding;
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + (-loopOffset) + ' ' + (loopPadding - r);
          relPath += ' L ' + (-loopOffset) + ' ' + (-anchorOffset + r);
          relPath += ' A ' + r + ' ' + r + ' 0 0 1 ' + (-loopOffset + r) + ' ' + (-anchorOffset);
          relPath += ' L 0 ' + (-anchorOffset);
          
          relLabelPos = { x: (anchorOffset - loopOffset) / 2, y: loopPadding + 5 };
          relElabelPos = { x: -loopOffset - 5, y: (-anchorOffset + loopPadding) / 2, align: 'right' };
          relSlabelPos = { x: anchorOffset, y: loopPadding + 5, align: 'center' };
        }
        
        staticCache[posIndex] = {
          path: relPath,
          startPt: relStartPt,
          endPt: relEndPt,
          labelPos: relLabelPos,
          elabelPos: relElabelPos,
          slabelPos: relSlabelPos
        };
      }
      
      // Get the static (relative) path data
      var staticData = staticCache[posIndex];
      
      // === TRANSLATION: Calculate offset based on position ===
      var translateX, translateY;
      
      if (posIndex === 0) { // top-left: translate to (boxX, boxY)
        translateX = boxX;
        translateY = boxY;
      } else if (posIndex === 1) { // top-right: translate to (boxX + boxW, boxY)
        translateX = boxX + boxW;
        translateY = boxY;
      } else if (posIndex === 2) { // bottom-right: translate to (boxX + boxW, boxY + boxH)
        translateX = boxX + boxW;
        translateY = boxY + boxH;
      } else { // bottom-left: translate to (boxX, boxY + boxH)
        translateX = boxX;
        translateY = boxY + boxH;
      }
      
      // Calculate absolute positions for anchors and labels (needed for rendering)
      var startPt = { x: translateX + staticData.startPt.x, y: translateY + staticData.startPt.y };
      var endPt = { x: translateX + staticData.endPt.x, y: translateY + staticData.endPt.y };
      var labelPos = { x: translateX + staticData.labelPos.x, y: translateY + staticData.labelPos.y };
      var elabelPos = { 
        x: translateX + staticData.elabelPos.x, 
        y: translateY + staticData.elabelPos.y, 
        align: staticData.elabelPos.align 
      };
      var slabelPos = { 
        x: translateX + staticData.slabelPos.x, 
        y: translateY + staticData.slabelPos.y, 
        align: staticData.slabelPos.align 
      };
      
      var isEdgeSelectedSL = edge.isSelected && (typeof edge.isSelected === 'function' ? edge.isSelected() : edge.isSelected);
      
      // Calculate label foreignObject positions based on alignment
      var slabelFoX = slabelPos.align === 'right' ? slabelPos.x - 60 : 
                      slabelPos.align === 'center' ? slabelPos.x - 30 : slabelPos.x;
      var elabelFoX = elabelPos.align === 'right' ? elabelPos.x - 60 : 
                      elabelPos.align === 'center' ? elabelPos.x - 30 : elabelPos.x;
      
      // Use the static relative path with transform for maximum performance
      var selfLoopPath = staticData.path;
      var transformStr = 'translate(' + translateX + ', ' + translateY + ')';
      
      return (
        <svg className="clickthrough fullscreen">
          <g transform={transformStr}>
            <path className="preview edge full outline" d={selfLoopPath} />
            <path className="preview edge full" d={selfLoopPath} />
            <path className="preview edge full hover-activator" d={selfLoopPath} />
          </g>
          
          {props.slabel && (
            <foreignObject className="label" x={slabelFoX} y={slabelPos.y - 10} width="60" height="25">
              <div className={'label-text' + (isEdgeSelectedSL ? ' selected' : '')} 
                   style={{ textAlign: slabelPos.align || 'left', pointerEvents: 'auto', background: 'transparent' }}>
                {props.slabel}
              </div>
            </foreignObject>
          )}
          
          {props.elabel && (
            <foreignObject className="label" x={elabelFoX} y={elabelPos.y - 10} width="60" height="25">
              <div className={'label-text' + (isEdgeSelectedSL ? ' selected' : '')}
                   style={{ textAlign: elabelPos.align || 'left', pointerEvents: 'auto', background: 'transparent' }}>
                {props.elabel}
              </div>
            </foreignObject>
          )}
          
          {segments && segments.all && segments.all.map(function(s, i) {
            return s.label ? (
              <g key={i} transform={transformStr}>
                <path tabIndex="-1" className="clickable content segment" d={selfLoopPath} style={{ pointerEvents: 'stroke' }} />
              </g>
            ) : null;
          })}
          
          {segments && segments.all && segments.all.map(function(s, i) {
            return s.label ? (
              <foreignObject key={'label-' + i} className="label" x={labelPos.x - 50} y={labelPos.y} width="100" height="25">
                <div className={'label-text' + (isEdgeSelectedSL ? ' selected' : '')}
                     style={{ textAlign: 'center', pointerEvents: 'auto', background: 'transparent' }}>
                  {s.label}
                </div>
              </foreignObject>
            ) : null;
          })}
          
          <circle className="edge-anchor content clickable no-drag"
                  style={{ transform: 'translate(' + startPt.x + 'px, ' + startPt.y + 'px)' }} />
          <circle className="edge-anchor content clickable no-drag"
                  style={{ transform: 'translate(' + endPt.x + 'px, ' + endPt.y + 'px)' }} />
        </svg>
      );
    }

    /* ============================================================
     * 5. GEOMETRY HELPERS (unchanged from v1.6.0)
     * ============================================================ */

    const getAnchorSideFromData = (anchorObj) => {
      if (!anchorObj) return 'center';
      const { x, y } = anchorObj;
      if (x < 0.05) return 'left';
      if (x > 0.95) return 'right';
      if (y < 0.05) return 'top';
      if (y > 0.95) return 'bottom';
      return 'center';
    };

    const sideToRad = (side) => {
      const val = SIDE_TO_RAD[side];
      return val !== undefined ? val : 0;
    };

    const getArrowPosition = (pt, box, side, w, h) => {
      switch (side) {
        case 'left':   return { x: box.x - w, y: pt.y - h / 2 };
        case 'right':  return { x: box.x + box.w, y: pt.y - h / 2 };
        case 'top':    return { x: pt.x - w / 2, y: box.y - h };
        case 'bottom': return { x: pt.x - w / 2, y: box.y + box.h };
        default:       return { x: pt.x - w / 2, y: pt.y - h / 2 };
      }
    };

    /* ============================================================
     * 6. COLLISION DETECTION (unchanged)
     * ============================================================ */

    const isSegmentCrossingBox = (p1, p2, box) => {
      if (!box) return false;
      const strictPadding = -1;
      const sbx = box.x - strictPadding;
      const sby = box.y - strictPadding;
      const sbw = box.w + strictPadding * 2;
      const sbh = box.h + strictPadding * 2;
      const segMinX = p1.x < p2.x ? p1.x : p2.x;
      const segMaxX = p1.x > p2.x ? p1.x : p2.x;
      const segMinY = p1.y < p2.y ? p1.y : p2.y;
      const segMaxY = p1.y > p2.y ? p1.y : p2.y;
      const noInterior = segMaxX < sbx || segMinX > sbx + sbw || segMaxY < sby || segMinY > sby + sbh;
      if (!noInterior) return true;
      const borderBuffer = 15;
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const isVertical = dx > -1 && dx < 1;
      const isHorizontal = dy > -1 && dy < 1;
      if (isVertical && segMaxY > box.y - borderBuffer && segMinY < box.y + box.h + borderBuffer) {
        const distLeft = p1.x - box.x;
        const distRight = p1.x - box.x - box.w;
        if ((distLeft > -borderBuffer && distLeft < borderBuffer) || 
            (distRight > -borderBuffer && distRight < borderBuffer)) return true;
      }
      if (isHorizontal && segMaxX > box.x - borderBuffer && segMinX < box.x + box.w + borderBuffer) {
        const distTop = p1.y - box.y;
        const distBottom = p1.y - box.y - box.h;
        if ((distTop > -borderBuffer && distTop < borderBuffer) || 
            (distBottom > -borderBuffer && distBottom < borderBuffer)) return true;
      }
      return false;
    };

    const getProjectedBorderPoint = (center, target, box) => {
      const dx = target.x - center.x;
      const dy = target.y - center.y;
      if (dx === 0 && dy === 0) return { x: center.x, y: center.y, side: 'center' };
      let bestT = Infinity;
      let bestSide = 'center';
      if (dx !== 0) {
        const tRight = (box.x + box.w - center.x) / dx;
        const tLeft = (box.x - center.x) / dx;
        if (tRight > 0 && tRight < bestT) { bestT = tRight; bestSide = 'right'; }
        if (tLeft > 0 && tLeft < bestT) { bestT = tLeft; bestSide = 'left'; }
      }
      if (dy !== 0) {
        const tBottom = (box.y + box.h - center.y) / dy;
        const tTop = (box.y - center.y) / dy;
        if (tBottom > 0 && tBottom < bestT) { bestT = tBottom; bestSide = 'bottom'; }
        if (tTop > 0 && tTop < bestT) { bestT = tTop; bestSide = 'top'; }
      }
      switch (bestSide) {
        case 'left':   return { x: box.x, y: box.y + box.h / 2, side: bestSide };
        case 'right':  return { x: box.x + box.w, y: box.y + box.h / 2, side: bestSide };
        case 'top':    return { x: box.x + box.w / 2, y: box.y, side: bestSide };
        case 'bottom': return { x: box.x + box.w / 2, y: box.y + box.h, side: bestSide };
        default:       return { x: center.x, y: center.y, side: 'center' };
      }
    };

    /* ============================================================
     * 7. ANCHORS & CONTROL POINTS (unchanged)
     * ============================================================ */

    const startAnchorData = startBox.anchors[edge.anchorStart] || { x: 0.5, y: 0.5 };
    const endAnchorData = endBox.anchors[edge.anchorEnd] || { x: 0.5, y: 0.5 };

    let alignStart = getAnchorSideFromData(startAnchorData);
    let alignEnd = getAnchorSideFromData(endAnchorData);

    let anchorStartX = startBox.x + startAnchorData.x * startBox.w;
    let anchorStartY = startBox.y + startAnchorData.y * startBox.h;
    let anchorEndX = endBox.x + endAnchorData.x * endBox.w;
    let anchorEndY = endBox.y + endAnchorData.y * endBox.h;

    let isStartCentral = false;
    let isEndCentral = false;

    if (alignStart === 'center') {
      const projected = getProjectedBorderPoint(
        { x: anchorStartX, y: anchorStartY },
        { x: anchorEndX, y: anchorEndY },
        startBox
      );
      anchorStartX = projected.x;
      anchorStartY = projected.y;
      alignStart = projected.side;
      isStartCentral = true;
    }

    if (alignEnd === 'center') {
      const projected = getProjectedBorderPoint(
        { x: anchorEndX, y: anchorEndY },
        { x: anchorStartX, y: anchorStartY },
        endBox
      );
      anchorEndX = projected.x;
      anchorEndY = projected.y;
      alignEnd = projected.side;
      isEndCentral = true;
    }

    const anchorStart = { x: anchorStartX, y: anchorStartY };
    const anchorEnd = { x: anchorEndX, y: anchorEndY };

    /* ============================================================
     * 8. ESCAPE POINTS (unchanged)
     * ============================================================ */

    const getEscapePoint = (pt, side) => {
      let esc;
      switch (side) {
        case 'top':    esc = { x: pt.x, y: pt.y - ESCAPE_DIST }; break;
        case 'bottom': esc = { x: pt.x, y: pt.y + ESCAPE_DIST }; break;
        case 'left':   esc = { x: pt.x - ESCAPE_DIST, y: pt.y }; break;
        case 'right':  esc = { x: pt.x + ESCAPE_DIST, y: pt.y }; break;
        default:       esc = { x: pt.x, y: pt.y }; break;
      }
      if (BEND_GRID_SIZE > 0) {
        if (side === 'top' || side === 'bottom') {
          esc.y = Math.round(esc.y / BEND_GRID_SIZE) * BEND_GRID_SIZE;
        } else if (side === 'left' || side === 'right') {
          esc.x = Math.round(esc.x / BEND_GRID_SIZE) * BEND_GRID_SIZE;
        }
      }
      return esc;
    };

    const sEsc = getEscapePoint(anchorStart, alignStart);
    const eEsc = getEscapePoint(anchorEnd, alignEnd);

    /* ============================================================
     * 9. ROUTING POINT CONSTRUCTION (unchanged)
     * ============================================================ */

    const segmentOffsets = getEdgeState('_segmentOffsets', {});

    const midnodesLen = edge.midnodes ? edge.midnodes.length : 0;
    const routingPoints = [];
    
    routingPoints.push(anchorStart);
    routingPoints.push(sEsc);
    
    if (edge.midnodes) {
      for (let i = 0; i < midnodesLen; i++) {
        const m = edge.midnodes[i];
        routingPoints.push({ x: m.x + 7.5, y: m.y + 7.5 });
      }
    }
    
    routingPoints.push(eEsc);
    routingPoints.push(anchorEnd);

    /* ============================================================
     * 10. ORTHOGONALIZATION (unchanged)
     * ============================================================ */

    const orthogonalizePoints = (pts) => {
      const len = pts.length;
      if (len < 2) return pts;
      const snapToGrid = (val) => {
        if (BEND_GRID_SIZE <= 0) return val;
        return Math.round(val / BEND_GRID_SIZE) * BEND_GRID_SIZE;
      };
      const res = [pts[0]];
      for (let i = 1; i < len; i++) {
        const p0 = res[res.length - 1];
        const p1 = pts[i];
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        if ((dx > -1 && dx < 1) || (dy > -1 && dy < 1)) {
          res.push(p1);
          continue;
        }
        const cornerA = { x: p1.x, y: p0.y };
        const cornerB = { x: p0.x, y: p1.y };
        const hitsA = isSegmentCrossingBox(p0, cornerA, startBox) || 
                      isSegmentCrossingBox(p0, cornerA, endBox) ||
                      isSegmentCrossingBox(cornerA, p1, startBox) || 
                      isSegmentCrossingBox(cornerA, p1, endBox);
        if (!hitsA) {
          res.push(cornerA, p1);
          continue;
        }
        const hitsB = isSegmentCrossingBox(p0, cornerB, startBox) || 
                      isSegmentCrossingBox(p0, cornerB, endBox) ||
                      isSegmentCrossingBox(cornerB, p1, startBox) || 
                      isSegmentCrossingBox(cornerB, p1, endBox);
        if (!hitsB) {
          res.push(cornerB, p1);
          continue;
        }
        const detourX = snapToGrid((p0.x + p1.x) / 2);
        const detourY = snapToGrid((p0.y + p1.y) / 2);
        const midH1 = { x: detourX, y: p0.y };
        const midH2 = { x: detourX, y: p1.y };
        if (!isSegmentCrossingBox(midH1, midH2, startBox) && !isSegmentCrossingBox(midH1, midH2, endBox)) {
          res.push(midH1, midH2, p1);
          continue;
        }
        res.push({ x: p0.x, y: detourY }, { x: p1.x, y: detourY }, p1);
      }
      return res;
    };

    const applySegmentOffsets = (pts) => {
      if (!segmentOffsets || Object.keys(segmentOffsets).length === 0) return pts;
      const result = [];
      for (let i = 0; i < pts.length; i++) {
        result.push({ x: pts[i].x, y: pts[i].y });
      }
      for (let segIdx in segmentOffsets) {
        const i = parseInt(segIdx);
        const offset = segmentOffsets[segIdx];
        if (i < 0 || i >= result.length - 1) continue;
        const p0 = result[i];
        const p1 = result[i + 1];
        const dx = p1.x - p0.x;
        const isVertical = Math.abs(dx) < 1;
        if (isVertical) {
          p0.x += offset;
          p1.x += offset;
        } else {
          p0.y += offset;
          p1.y += offset;
        }
      }
      return result;
    };

    /* ============================================================
     * 11. PATH CLEANUP & BUILDING (unchanged)
     * ============================================================ */

    const cleanPath = (pts) => {
      const len = pts.length;
      if (len < 2) return pts;
      const res = [pts[0]];
      for (let i = 1; i < len; i++) {
        const prev = res[res.length - 1];
        const curr = pts[i];
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        if (dx > -1 && dx < 1 && dy > -1 && dy < 1) continue;
        if (res.length >= 2) {
          const pBefore = res[res.length - 2];
          const dx1 = prev.x - pBefore.x;
          const dy1 = prev.y - pBefore.y;
          if (dy1 > -1 && dy1 < 1 && dy > -1 && dy < 1) res.pop();
          else if (dx1 > -1 && dx1 < 1 && dx > -1 && dx < 1) res.pop();
        }
        res.push(curr);
      }
      return res;
    };

    const buildRoundedPath = (points, R) => {
      const len = points.length;
      if (len < 2) return '';
      const parts = ['M ', points[0].x, ' ', points[0].y];
      for (let i = 1; i < len; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        if (!p2) {
          parts.push(' L ', p1.x, ' ', p1.y);
          continue;
        }
        const dx1 = p1.x - p0.x;
        const dy1 = p1.y - p0.y;
        const dx2 = p2.x - p1.x;
        const dy2 = p2.y - p1.y;
        const isTurn = ((dx1 > -0.1 && dx1 < 0.1) && (dy2 > -0.1 && dy2 < 0.1)) ||
                       ((dy1 > -0.1 && dy1 < 0.1) && (dx2 > -0.1 && dx2 < 0.1));
        if (!isTurn) {
          parts.push(' L ', p1.x, ' ', p1.y);
          continue;
        }
        const len1 = dx1 !== 0 ? Math.abs(dx1) : Math.abs(dy1);
        const len2 = dx2 !== 0 ? Math.abs(dx2) : Math.abs(dy2);
        const r = Math.min(R, len1 / 2, len2 / 2);
        const signDx1 = dx1 > 0 ? 1 : dx1 < 0 ? -1 : 0;
        const signDy1 = dy1 > 0 ? 1 : dy1 < 0 ? -1 : 0;
        const signDx2 = dx2 > 0 ? 1 : dx2 < 0 ? -1 : 0;
        const signDy2 = dy2 > 0 ? 1 : dy2 < 0 ? -1 : 0;
        const sx = p1.x - signDx1 * r;
        const sy = p1.y - signDy1 * r;
        const ex = p1.x + signDx2 * r;
        const ey = p1.y + signDy2 * r;
        const sweep = (signDx1 * signDy2 - signDy1 * signDx2) > 0 ? 1 : 0;
        parts.push(' L ', sx, ' ', sy, ' A ', r, ' ', r, ' 0 0 ', sweep, ' ', ex, ' ', ey);
      }
      return parts.join('');
    };

    /* ============================================================
     * 12. COMPUTE FINAL PATH (unchanged)
     * ============================================================ */

    const rawPoints = orthogonalizePoints(routingPoints);
    const cleanedPoints = cleanPath(rawPoints);
    const orthoPoints = applySegmentOffsets(cleanedPoints);

    const zoomX = (typeof window !== 'undefined' && window.__jjodelZoomX) || 1;
    const zoomY = (typeof window !== 'undefined' && window.__jjodelZoomY) || 1;
    const zoom = zoomX > zoomY ? zoomX : zoomY;
    
    const pathD = buildRoundedPath(orthoPoints, BEND_RADIUS / zoom);
    
    /* ============================================================
     * 13. SEGMENT HANDLES DATA (unchanged)
     * ============================================================ */
    
    const segmentHandles = [];
    for (let i = 1; i < orthoPoints.length - 2; i++) {
      const p0 = orthoPoints[i];
      const p1 = orthoPoints[i + 1];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const isVertical = Math.abs(dx) < 1;
      const isHorizontal = Math.abs(dy) < 1;
      if (isVertical || isHorizontal) {
        segmentHandles.push({
          index: i,
          x: (p0.x + p1.x) / 2,
          y: (p0.y + p1.y) / 2,
          isVertical: isVertical,
          p0: p0,
          p1: p1
        });
      }
    }

    /* ============================================================
     * 14. LABEL POSITIONING (unchanged)
     * ============================================================ */

    let headStyles = { display: 'none' };
    let tailStyles = { display: 'none' };
    let sPos = null;
    let ePos = null;
    let mainLabelPos = null;
    
    const isEdgeSelected = edge.isSelected && (typeof edge.isSelected === 'function' ? edge.isSelected() : edge.isSelected);

    if (orthoPoints.length >= 2) {
      const stateFlip = getEdgeState('_labelFlip', null);
      if (!stateFlip) {
        setEdgeState('_labelFlip', { main: false, start: false, end: false });
      }
      const labelFlip = getEdgeState('_labelFlip', { main: false, start: false, end: false });
      
      // Start label
      const p0 = orthoPoints[0];
      const p1 = orthoPoints[1];
      const startDx = p1.x - p0.x;
      const startDy = p1.y - p0.y;
      
      let sOffX = 8, sOffY = -8;
      const sFlip = labelFlip.start ? -1 : 1;
      
      if (startDy < -1) {
        if (sFlip === 1) { sOffX = CARD_LABEL_UP_TORIGHT_X; sOffY = CARD_LABEL_UP_TORIGHT_Y; }
        else { sOffX = -CARD_LABEL_UP_TOLEFT_X; sOffY = CARD_LABEL_UP_TOLEFT_Y; }
      } else if (startDy > 1) {
        if (sFlip === 1) { sOffX = CARD_LABEL_DOWN_TORIGHT_X; sOffY = -CARD_LABEL_DOWN_TORIGHT_Y; }
        else { sOffX = -CARD_LABEL_DOWN_TOLEFT_X; sOffY = -CARD_LABEL_DOWN_TOLEFT_Y; }
      } else if (startDx < -1) {
        if (sFlip === 1) { sOffX = CARD_LABEL_RIGHT_ABOVE_X; sOffY = -CARD_LABEL_RIGHT_ABOVE_Y; }
        else { sOffX = CARD_LABEL_RIGHT_BELOW_X; sOffY = CARD_LABEL_RIGHT_BELOW_Y; }
      } else if (startDx > 1) {
        if (sFlip === 1) { sOffX = -CARD_LABEL_LEFT_ABOVE_X; sOffY = -CARD_LABEL_LEFT_ABOVE_Y; }
        else { sOffX = -CARD_LABEL_LEFT_BELOW_X; sOffY = CARD_LABEL_LEFT_BELOW_Y; }
      }
      
      let sAlign = 'left';
      if (startDy < -1 || startDy > 1) sAlign = sFlip === 1 ? 'left' : 'right';
      else if (startDx > 1) sAlign = 'right';
      
      sPos = { x: p0.x + sOffX, y: p0.y + sOffY, align: sAlign };

      // End label
      const pN0 = orthoPoints[orthoPoints.length - 2];
      const pN1 = orthoPoints[orthoPoints.length - 1];
      const endDx = pN1.x - pN0.x;
      const endDy = pN1.y - pN0.y;
      
      let eOffX = 8, eOffY = -8;
      const eFlip = labelFlip.end ? -1 : 1;
      
      if (endDy < -1) {
        if (eFlip === 1) { eOffX = CARD_LABEL_UP_TORIGHT_X; eOffY = CARD_LABEL_UP_TORIGHT_Y; }
        else { eOffX = -CARD_LABEL_UP_TOLEFT_X; eOffY = CARD_LABEL_UP_TOLEFT_Y; }
      } else if (endDy > 1) {
        if (eFlip === 1) { eOffX = CARD_LABEL_DOWN_TORIGHT_X; eOffY = -CARD_LABEL_DOWN_TORIGHT_Y; }
        else { eOffX = -CARD_LABEL_DOWN_TOLEFT_X; eOffY = -CARD_LABEL_DOWN_TOLEFT_Y; }
      } else if (endDx < -1) {
        if (eFlip === 1) { eOffX = CARD_LABEL_RIGHT_ABOVE_X; eOffY = -CARD_LABEL_RIGHT_ABOVE_Y; }
        else { eOffX = CARD_LABEL_RIGHT_BELOW_X; eOffY = CARD_LABEL_RIGHT_BELOW_Y; }
      } else if (endDx > 1) {
        if (eFlip === 1) { eOffX = -CARD_LABEL_LEFT_ABOVE_X; eOffY = -CARD_LABEL_LEFT_ABOVE_Y; }
        else { eOffX = -CARD_LABEL_LEFT_BELOW_X; eOffY = CARD_LABEL_LEFT_BELOW_Y; }
      }
      
      let eAlign = 'left';
      if (endDy < -1 || endDy > 1) eAlign = eFlip === 1 ? 'left' : 'right';
      else if (endDx > 1) eAlign = 'right';
      
      ePos = { x: pN1.x + eOffX, y: pN1.y + eOffY, align: eAlign };

      // Main label
      let totalLen = 0;
      const segLengths = [];
      const segIsVertical = [];
      for (let i = 1; i < orthoPoints.length; i++) {
        const dx = orthoPoints[i].x - orthoPoints[i-1].x;
        const dy = orthoPoints[i].y - orthoPoints[i-1].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        segLengths.push(len);
        segIsVertical.push(Math.abs(dx) < Math.abs(dy));
        totalLen += len;
      }
      
      let longestIdx = 0;
      let longestLen = 0;
      for (let i = 0; i < segLengths.length; i++) {
        if (segLengths[i] > longestLen) {
          longestLen = segLengths[i];
          longestIdx = i;
        }
      }
      
      let selectedSegIdx = longestIdx;
      if (longestLen < MIN_SEGMENT_LENGTH) {
        const currentIsVertical = segIsVertical[longestIdx];
        let bestAltIdx = -1;
        let bestAltLen = 0;
        for (let i = 0; i < segLengths.length; i++) {
          if (segIsVertical[i] !== currentIsVertical && segLengths[i] > bestAltLen) {
            bestAltLen = segLengths[i];
            bestAltIdx = i;
          }
        }
        if (bestAltIdx >= 0 && bestAltLen >= MIN_SEGMENT_LENGTH) {
          selectedSegIdx = bestAltIdx;
        }
      }
      
      const segStart = orthoPoints[selectedSegIdx];
      const segEnd = orthoPoints[selectedSegIdx + 1];
      const midX = (segStart.x + segEnd.x) / 2;
      let midY = (segStart.y + segEnd.y) / 2;
      const segDx = segEnd.x - segStart.x;
      const segDy = segEnd.y - segStart.y;
      const isVertical = Math.abs(segDx) < Math.abs(segDy);
      
      let mOffX = 0, mOffY = 0;
      let mAlign = 'left';
      const mFlip = labelFlip.main ? -1 : 1;
      
      if (isVertical) {
        if (mFlip === 1) { mOffX = MAIN_LABEL_TORIGHT_X; mOffY = -MAIN_LABEL_TORIGHT_Y; mAlign = 'left'; }
        else { mOffX = -MAIN_LABEL_TOLEFT_X; mOffY = -MAIN_LABEL_TOLEFT_Y; mAlign = 'right'; }
      } else {
        if (mFlip === 1) { mOffX = MAIN_LABEL_ABOVE_X; mOffY = -MAIN_LABEL_ABOVE_Y; }
        else { mOffX = MAIN_LABEL_BELOW_X; mOffY = MAIN_LABEL_BELOW_Y; }
        mAlign = 'center';
      }
      
      mainLabelPos = { x: midX + mOffX, y: midY + mOffY, align: mAlign };
    }

    if (endBox && segments) {
      const pos = getArrowPosition(anchorEnd, endBox.size, alignEnd, segments.head.w, segments.head.h);
      headStyles = {
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${sideToRad(alignEnd)}rad)`,
        transformOrigin: `${segments.head.w / 2}px ${segments.head.h / 2}px`,
        display: 'block'
      };
    }

    if (startBox && segments) {
      const pos = getArrowPosition(anchorStart, startBox.size, alignStart, segments.tail.w, segments.tail.h);
      tailStyles = {
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${sideToRad(alignStart)}rad)`,
        transformOrigin: `${segments.tail.w / 2}px ${segments.tail.h / 2}px`,
        display: 'block'
      };
    }

    /* ============================================================
     * 15. EVENT HANDLERS (with fixed hover timeout)
     * ============================================================ */

    const handleDoubleClick = () => {
      const mid = startBox.size.tl().add(endBox.size.tl()).divide(2);
      requestAnimationFrame(() => edge.addMidPoint(mid));
    };

    const handleMainLabelDoubleClick = (e) => {
      e.stopPropagation();
      const current = getEdgeState('_labelFlip', { main: false, start: false, end: false });
      setEdgeState('_labelFlip', { main: !current.main, start: current.start, end: current.end });
    };

    const handleStartLabelDoubleClick = (e) => {
      e.stopPropagation();
      const current = getEdgeState('_labelFlip', { main: false, start: false, end: false });
      setEdgeState('_labelFlip', { main: current.main, start: !current.start, end: current.end });
    };

    const handleEndLabelDoubleClick = (e) => {
      e.stopPropagation();
      const current = getEdgeState('_labelFlip', { main: false, start: false, end: false });
      setEdgeState('_labelFlip', { main: current.main, start: current.start, end: !current.end });
    };

    const handleStartAnchorDown = (e) => { 
      e.stopPropagation();
      e.preventDefault();
      
      var isShiftMode = e.shiftKey;
      var isCtrlMode = e.ctrlKey || e.metaKey; // metaKey for Mac
      var anchorName = edge.anchorStart || 't';
      var side = getSideFromAnchorName(anchorName);
      
      if (isCtrlMode) {
        // CTRL + CLICK: Reset anchor to default position
        if (edge.start && edge.start.anchors && edge.start.anchors[anchorName]) {
          var defaultPos = ANCHOR_POSITIONS[anchorName];
          if (defaultPos) {
            edge.start.anchors[anchorName].x = defaultPos.x;
            edge.start.anchors[anchorName].y = defaultPos.y;
          }
        }
        return;
      }
      
      if (isShiftMode) {
        // Check if anchor is center ('0') - cannot slide
        if (!side || anchorName === '0' || anchorName === 'center') {
          // Show not-allowed cursor briefly
          var circleEl = e.target;
          circleEl.style.cursor = 'not-allowed';
          setTimeout(function() {
            circleEl.style.cursor = '';
          }, 500);
          return;
        }
        
        // SHIFT + CLICK: Fine-tuning mode - slide anchor along its side
        if (edge.start && edge.start.anchors && edge.start.anchors[anchorName]) {
          var anchor = edge.start.anchors[anchorName];
          var box = startBox;
          
          // IMPORTANT: Prevent jjodel from taking over
          edge.startFollow = false;
          
          // Get SVG element for coordinate conversion
          var svgElement = e.target.closest('svg');
          var containerElement = svgElement ? svgElement.parentElement : null;
          
          // Store drag state with shift mode
          setEdgeState('_draggingAnchor', 'start');
          setEdgeState('_dragSide', side);
          setEdgeState('_shiftMode', true);
          
          // Get the circle element for direct DOM manipulation
          var circleElement = e.target;
          var currentRelPos = (side === 'top' || side === 'bottom') ? anchor.x : anchor.y;
          
          // Add mousemove listener for fluid drag
          var handleDragMove = function(moveEvent) {
            moveEvent.stopPropagation();
            moveEvent.preventDefault();
            
            if (!box) return;
            
            // Get mouse position and convert to SVG/canvas coordinates
            var rect = containerElement ? containerElement.getBoundingClientRect() : { left: 0, top: 0 };
            var mouseX = moveEvent.clientX - rect.left;
            var mouseY = moveEvent.clientY - rect.top;
            
            // Convert to relative position (0-1) on the side
            var relPos;
            if (side === 'top' || side === 'bottom') {
              relPos = (mouseX - box.x) / box.w;
            } else {
              relPos = (mouseY - box.y) / box.h;
            }
            
            // Clamp to valid range (exclude corners)
            relPos = Math.max(ANCHOR_CORNER_THRESHOLD, Math.min(1 - ANCHOR_CORNER_THRESHOLD, relPos));
            currentRelPos = relPos;
            
            // Calculate absolute pixel position for visual feedback
            var visualX, visualY;
            if (side === 'top') {
              visualX = box.x + relPos * box.w;
              visualY = box.y;
            } else if (side === 'bottom') {
              visualX = box.x + relPos * box.w;
              visualY = box.y + box.h;
            } else if (side === 'left') {
              visualX = box.x;
              visualY = box.y + relPos * box.h;
            } else { // right
              visualX = box.x + box.w;
              visualY = box.y + relPos * box.h;
            }
            
            // Move circle visually via DOM
            circleElement.style.transform = 'translate(' + visualX + 'px, ' + visualY + 'px)';
          };
          
          var handleDragEnd = function(upEvent) {
            upEvent.stopPropagation();
            upEvent.preventDefault();
            
            // Remove listeners FIRST
            document.removeEventListener('mousemove', handleDragMove, true);
            document.removeEventListener('mouseup', handleDragEnd, true);
            
            // SNAP to grid on release
            if (box) {
              var sideLength = (side === 'top' || side === 'bottom') ? box.w : box.h;
              
              var pixelPos = currentRelPos * sideLength;
              var snappedPixel = Math.round(pixelPos / ANCHOR_SNAP_GRID) * ANCHOR_SNAP_GRID;
              var snappedVal = snappedPixel / sideLength;
              
              snappedVal = Math.max(ANCHOR_CORNER_THRESHOLD, Math.min(1 - ANCHOR_CORNER_THRESHOLD, snappedVal));
              
              // Apply to actual anchor
              if (side === 'top' || side === 'bottom') {
                anchor.x = snappedVal;
              } else {
                anchor.y = snappedVal;
              }
            }
            
            // Clear drag state
            setEdgeState('_draggingAnchor', null);
            setEdgeState('_dragSide', null);
            setEdgeState('_shiftMode', false);
            
            // Make absolutely sure jjodel follow is disabled
            edge.startFollow = false;
          };
          
          // Use capture phase to intercept before jjodel
          document.addEventListener('mousemove', handleDragMove, true);
          document.addEventListener('mouseup', handleDragEnd, true);
        }
      } else {
        // NORMAL CLICK: Change anchor mode - use existing jjodel behavior
        setEdgeState('_draggingAnchor', 'start');
        setEdgeState('_shiftMode', false);
        edge.startFollow = true;
        
        // Track ghost position during normal drag
        var svgElement = e.target.closest('svg');
        var containerElement = svgElement ? svgElement.parentElement : null;
        
        var handleNormalDragMove = function(moveEvent) {
          var rect = containerElement ? containerElement.getBoundingClientRect() : { left: 0, top: 0 };
          var mouseX = moveEvent.clientX - rect.left;
          var mouseY = moveEvent.clientY - rect.top;
          setEdgeState('_ghostPosition', { x: mouseX, y: mouseY, clientX: moveEvent.clientX, clientY: moveEvent.clientY });
        };
        
        var handleNormalDragEnd = function(upEvent) {
          document.removeEventListener('mousemove', handleNormalDragMove, true);
          document.removeEventListener('mouseup', handleNormalDragEnd, true);
          setEdgeState('_ghostPosition', null);
          setEdgeState('_draggingAnchor', null);
          
          // NEW in v1.7.13: Auto-cancel if not released on a valid anchor
          if (!isReleasedOnAnchor(upEvent.target)) {
            // Released in empty space - simulate Escape to cancel operation
            simulateEscapeKey();
          }
        };
        
        document.addEventListener('mousemove', handleNormalDragMove, true);
        document.addEventListener('mouseup', handleNormalDragEnd, true);
      }
    };
    
    const handleStartAnchorUp = (e) => { 
      var shiftMode = getEdgeState('_shiftMode', false);
      if (!shiftMode) {
        // Only clear for normal mode, shift mode cleans up in handleDragEnd
        setEdgeState('_draggingAnchor', null);
        edge.startFollow = false;
      }
    };
    
    const handleEndAnchorDown = (e) => { 
      e.stopPropagation();
      e.preventDefault();
      
      var isShiftMode = e.shiftKey;
      var isCtrlMode = e.ctrlKey || e.metaKey; // metaKey for Mac
      var anchorName = edge.anchorEnd || 't';
      var side = getSideFromAnchorName(anchorName);
      
      if (isCtrlMode) {
        // CTRL + CLICK: Reset anchor to default position
        if (edge.end && edge.end.anchors && edge.end.anchors[anchorName]) {
          var defaultPos = ANCHOR_POSITIONS[anchorName];
          if (defaultPos) {
            edge.end.anchors[anchorName].x = defaultPos.x;
            edge.end.anchors[anchorName].y = defaultPos.y;
          }
        }
        return;
      }
      
      if (isShiftMode) {
        // Check if anchor is center ('0') - cannot slide
        if (!side || anchorName === '0' || anchorName === 'center') {
          // Show not-allowed cursor briefly
          var circleEl = e.target;
          circleEl.style.cursor = 'not-allowed';
          setTimeout(function() {
            circleEl.style.cursor = '';
          }, 500);
          return;
        }
        
        // SHIFT + CLICK: Fine-tuning mode - slide anchor along its side
        if (edge.end && edge.end.anchors && edge.end.anchors[anchorName]) {
          var anchor = edge.end.anchors[anchorName];
          var box = endBox;
          
          // IMPORTANT: Prevent jjodel from taking over
          edge.endFollow = false;
          
          // Get SVG element for coordinate conversion
          var svgElement = e.target.closest('svg');
          var containerElement = svgElement ? svgElement.parentElement : null;
          
          // Store drag state with shift mode
          setEdgeState('_draggingAnchor', 'end');
          setEdgeState('_dragSide', side);
          setEdgeState('_shiftMode', true);
          
          // Get the circle element for direct DOM manipulation
          var circleElement = e.target;
          var currentRelPos = (side === 'top' || side === 'bottom') ? anchor.x : anchor.y;
          
          // Add mousemove listener for fluid drag
          var handleDragMove = function(moveEvent) {
            moveEvent.stopPropagation();
            moveEvent.preventDefault();
            
            if (!box) return;
            
            // Get mouse position and convert to SVG/canvas coordinates
            var rect = containerElement ? containerElement.getBoundingClientRect() : { left: 0, top: 0 };
            var mouseX = moveEvent.clientX - rect.left;
            var mouseY = moveEvent.clientY - rect.top;
            
            // Convert to relative position (0-1) on the side
            var relPos;
            if (side === 'top' || side === 'bottom') {
              relPos = (mouseX - box.x) / box.w;
            } else {
              relPos = (mouseY - box.y) / box.h;
            }
            
            // Clamp to valid range (exclude corners)
            relPos = Math.max(ANCHOR_CORNER_THRESHOLD, Math.min(1 - ANCHOR_CORNER_THRESHOLD, relPos));
            currentRelPos = relPos;
            
            // Calculate absolute pixel position for visual feedback
            var visualX, visualY;
            if (side === 'top') {
              visualX = box.x + relPos * box.w;
              visualY = box.y;
            } else if (side === 'bottom') {
              visualX = box.x + relPos * box.w;
              visualY = box.y + box.h;
            } else if (side === 'left') {
              visualX = box.x;
              visualY = box.y + relPos * box.h;
            } else { // right
              visualX = box.x + box.w;
              visualY = box.y + relPos * box.h;
            }
            
            // Move circle visually via DOM
            circleElement.style.transform = 'translate(' + visualX + 'px, ' + visualY + 'px)';
          };
          
          var handleDragEnd = function(upEvent) {
            upEvent.stopPropagation();
            upEvent.preventDefault();
            
            // Remove listeners FIRST
            document.removeEventListener('mousemove', handleDragMove, true);
            document.removeEventListener('mouseup', handleDragEnd, true);
            
            // SNAP to grid on release
            if (box) {
              var sideLength = (side === 'top' || side === 'bottom') ? box.w : box.h;
              
              var pixelPos = currentRelPos * sideLength;
              var snappedPixel = Math.round(pixelPos / ANCHOR_SNAP_GRID) * ANCHOR_SNAP_GRID;
              var snappedVal = snappedPixel / sideLength;
              
              snappedVal = Math.max(ANCHOR_CORNER_THRESHOLD, Math.min(1 - ANCHOR_CORNER_THRESHOLD, snappedVal));
              
              // Apply to actual anchor
              if (side === 'top' || side === 'bottom') {
                anchor.x = snappedVal;
              } else {
                anchor.y = snappedVal;
              }
            }
            
            // Clear drag state
            setEdgeState('_draggingAnchor', null);
            setEdgeState('_dragSide', null);
            setEdgeState('_shiftMode', false);
            
            // Make absolutely sure jjodel follow is disabled
            edge.endFollow = false;
          };
          
          // Use capture phase to intercept before jjodel
          document.addEventListener('mousemove', handleDragMove, true);
          document.addEventListener('mouseup', handleDragEnd, true);
        }
      } else {
        // NORMAL CLICK: Change anchor mode - use existing jjodel behavior
        setEdgeState('_draggingAnchor', 'end');
        setEdgeState('_shiftMode', false);
        edge.endFollow = true;
        
        // Track ghost position during normal drag
        var svgElement = e.target.closest('svg');
        var containerElement = svgElement ? svgElement.parentElement : null;
        
        var handleNormalDragMove = function(moveEvent) {
          var rect = containerElement ? containerElement.getBoundingClientRect() : { left: 0, top: 0 };
          var mouseX = moveEvent.clientX - rect.left;
          var mouseY = moveEvent.clientY - rect.top;
          setEdgeState('_ghostPosition', { x: mouseX, y: mouseY, clientX: moveEvent.clientX, clientY: moveEvent.clientY });
        };
        
        var handleNormalDragEnd = function(upEvent) {
          document.removeEventListener('mousemove', handleNormalDragMove, true);
          document.removeEventListener('mouseup', handleNormalDragEnd, true);
          setEdgeState('_ghostPosition', null);
          setEdgeState('_draggingAnchor', null);
          
          // NEW in v1.7.13: Auto-cancel if not released on a valid anchor
          if (!isReleasedOnAnchor(upEvent.target)) {
            // Released in empty space - simulate Escape to cancel operation
            simulateEscapeKey();
          }
        };
        
        document.addEventListener('mousemove', handleNormalDragMove, true);
        document.addEventListener('mouseup', handleNormalDragEnd, true);
      }
    };
    
    const handleEndAnchorUp = (e) => { 
      var shiftMode = getEdgeState('_shiftMode', false);
      if (!shiftMode) {
        // Only clear for normal mode, shift mode cleans up in handleDragEnd
        setEdgeState('_draggingAnchor', null);
        edge.endFollow = false;
      }
    };
    
    // Get current drag state for rendering
    var draggingAnchor = getEdgeState('_draggingAnchor', null);
    var isShiftMode = getEdgeState('_shiftMode', false);
    var dragSide = getEdgeState('_dragSide', null);
    var hoverAnchor = getEdgeState('_hoverAnchor', null);
    var hoverShiftPressed = getEdgeState('_hoverShiftPressed', false);
    var ghostPosition = getEdgeState('_ghostPosition', null);  // {x, y} for ghost circle during normal drag
    
    // Get side for cursor calculation on hover
    var startAnchorName = edge.anchorStart || 't';
    var endAnchorName = edge.anchorEnd || 't';
    var startSide = getSideFromAnchorName(startAnchorName);
    var endSide = getSideFromAnchorName(endAnchorName);
    
    // Hover handlers for anchor handles
    var handleAnchorMouseEnter = function(which) {
      return function(e) {
        setEdgeState('_hoverAnchor', which);
        
        // Get anchor name to check if it's center ('0')
        var anchorName = which === 'start' ? (edge.anchorStart || 't') : (edge.anchorEnd || 't');
        var side = which === 'start' ? startSide : endSide;
        var isCenterAnchor = !side || anchorName === '0' || anchorName === 'center';
        
        // Add keydown/keyup listeners for shift detection
        var onKeyDown = function(ke) {
          if (ke.key === 'Shift') {
            setEdgeState('_hoverShiftPressed', true);
            // Update cursor immediately - not-allowed for center, resize for sides
            if (isCenterAnchor) {
              e.target.style.cursor = 'not-allowed';
            } else {
              e.target.style.cursor = side === 'top' || side === 'bottom' ? 'ew-resize' : 'ns-resize';
            }
          }
        };
        var onKeyUp = function(ke) {
          if (ke.key === 'Shift') {
            setEdgeState('_hoverShiftPressed', false);
            e.target.style.cursor = '';  // Reset to CSS default
          }
        };
        
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        
        // Store handlers to remove later
        e.target._shiftKeyDown = onKeyDown;
        e.target._shiftKeyUp = onKeyUp;
      };
    };
    
    var handleAnchorMouseLeave = function(which) {
      return function(e) {
        setEdgeState('_hoverAnchor', null);
        setEdgeState('_hoverShiftPressed', false);
        
        // Remove keydown/keyup listeners
        if (e.target._shiftKeyDown) {
          document.removeEventListener('keydown', e.target._shiftKeyDown);
          document.removeEventListener('keyup', e.target._shiftKeyUp);
          e.target._shiftKeyDown = null;
          e.target._shiftKeyUp = null;
        }
        
        // Reset cursor to CSS default
        e.target.style.cursor = '';
      };
    };

    /* ============================================================
     * 15.1 SEGMENT DRAG HANDLER (unchanged)
     * ============================================================ */
    
    const handleSegmentMouseDown = (e, segmentIndex, isVertical) => {
      e.stopPropagation();
      e.preventDefault();
      
      const startX = e.clientX;
      const startY = e.clientY;
      
      const currentOffsets = getEdgeState('_segmentOffsets', {});
      const currentOffset = currentOffsets[segmentIndex] || 0;
      
      const svgElement = e.target.closest('svg');
      const pathElements = svgElement ? svgElement.querySelectorAll('path.edge') : [];
      
      let lastOffset = currentOffset;
      
      var calculateTempPath = function(tempOffset) {
        var tempOffsets = {};
        for (var key in currentOffsets) {
          if (currentOffsets.hasOwnProperty(key)) {
            tempOffsets[key] = currentOffsets[key];
          }
        }
        tempOffsets[segmentIndex] = tempOffset;
        
        var tempPoints = [];
        for (var i = 0; i < cleanedPoints.length; i++) {
          tempPoints.push({ x: cleanedPoints[i].x, y: cleanedPoints[i].y });
        }
        
        for (var segIdx in tempOffsets) {
          var idx = parseInt(segIdx);
          var offset = tempOffsets[segIdx];
          if (idx < 0 || idx >= tempPoints.length - 1) continue;
          var p0 = tempPoints[idx];
          var p1 = tempPoints[idx + 1];
          var dx = p1.x - p0.x;
          var isVert = Math.abs(dx) < 1;
          if (isVert) { p0.x += offset; p1.x += offset; }
          else { p0.y += offset; p1.y += offset; }
        }
        
        return buildRoundedPath(tempPoints, BEND_RADIUS / zoom);
      };
      
      var onMouseMove = function(moveEvent) {
        moveEvent.preventDefault();
        var deltaX = moveEvent.clientX - startX;
        var deltaY = moveEvent.clientY - startY;
        var delta = isVertical ? deltaX : deltaY;
        var newOffset = currentOffset + delta;
        lastOffset = newOffset;
        var newPathD = calculateTempPath(newOffset);
        for (var i = 0; i < pathElements.length; i++) {
          pathElements[i].setAttribute('d', newPathD);
        }
      };
      
      var onMouseUp = function(upEvent) {
        upEvent.preventDefault();
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('mouseup', onMouseUp, true);
        
        var newOffsets = {};
        var existingOffsets = getEdgeState('_segmentOffsets', {});
        for (var key in existingOffsets) {
          if (existingOffsets.hasOwnProperty(key)) {
            newOffsets[key] = existingOffsets[key];
          }
        }
        newOffsets[segmentIndex] = lastOffset;
        setEdgeState('_segmentOffsets', newOffsets);
      };
      
      document.addEventListener('mousemove', onMouseMove, true);
      document.addEventListener('mouseup', onMouseUp, true);
    };

    /* ============================================================
     * 15.2 HOVER HANDLERS (FIXED - timeout stored in edge.state)
     * ============================================================ */
    
    const handleSegmentHoverEnter = (e) => {
      var timeout = getEdgeState('_hoverTimeout', null);
      if (timeout) {
        clearTimeout(timeout);
        setEdgeState('_hoverTimeout', null);
      }
      const edgeDiv = e.target.closest('.edge');
      if (edgeDiv) {
        edgeDiv.classList.add('force-hover');
      }
    };
    
    const handleSegmentHoverLeave = (e) => {
      var newTimeout = setTimeout(() => {
        const edgeDiv = e.target.closest('.edge');
        if (edgeDiv) {
          edgeDiv.classList.remove('force-hover');
        }
      }, 50);
      setEdgeState('_hoverTimeout', newTimeout);
    };

    /* ============================================================
     * 16. BUILD HOVER RECTS (unchanged)
     * ============================================================ */
    
    const segmentHoverRects = [];
    for (let i = 0; i < orthoPoints.length - 1; i++) {
      const p0 = orthoPoints[i];
      const p1 = orthoPoints[i + 1];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const isVertical = Math.abs(dx) < 1;
      const isHorizontal = Math.abs(dy) < 1;
      if (isVertical) {
        const minY = Math.min(p0.y, p1.y);
        const maxY = Math.max(p0.y, p1.y);
        const height = maxY - minY;
        if (height > 1) {
          segmentHoverRects.push({
            x: p0.x - HOVER_RECT_THICKNESS / 2,
            y: minY,
            width: HOVER_RECT_THICKNESS,
            height: height
          });
        }
      } else if (isHorizontal) {
        const minX = Math.min(p0.x, p1.x);
        const maxX = Math.max(p0.x, p1.x);
        const width = maxX - minX;
        if (width > 1) {
          segmentHoverRects.push({
            x: minX,
            y: p0.y - HOVER_RECT_THICKNESS / 2,
            width: width,
            height: HOVER_RECT_THICKNESS
          });
        }
      }
    }

    /* ============================================================
     * 17. RENDER
     * ============================================================ */

    return (
      <svg className="clickthrough fullscreen" onDoubleClick={handleDoubleClick}>
        <path className="preview edge full outline" d={pathD} />
        <path className="preview edge full" d={pathD} />
        <path className="preview edge full hover-activator" d={pathD} />
        
        {segmentHoverRects.map((rect, idx) => (
          <rect
            key={'hover-rect-' + idx}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            style={{
              fill: 'transparent',
              stroke: 'none',
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}
            onMouseEnter={handleSegmentHoverEnter}
            onMouseLeave={handleSegmentHoverLeave}
          />
        ))}

        {props.slabel && sPos && (() => {
          const boxWidth = 150;
          let foX = sPos.x;
          if (sPos.align === 'right') foX = sPos.x - boxWidth;
          return (
            <foreignObject 
              className="label" 
              x={foX} 
              y={sPos.y - 5}
              width={boxWidth}
              height="30"
              onDoubleClick={handleStartLabelDoubleClick}
              style={{ cursor: 'pointer', overflow: 'visible' }}
            >
              <div 
                className={'label-text' + (isEdgeSelected ? ' selected' : '')}
                style={{
                  textAlign: sPos.align,
                  pointerEvents: 'auto',
                  background: 'transparent',
                  width: boxWidth + 'px'
                }}
              >
                {props.slabel}
              </div>
            </foreignObject>
          );
        })()}

        {props.elabel && ePos && (() => {
          const boxWidth = 150;
          let foX = ePos.x;
          if (ePos.align === 'right') foX = ePos.x - boxWidth;
          return (
            <foreignObject 
              className="label" 
              x={foX} 
              y={ePos.y - 5}
              width={boxWidth}
              height="30"
              onDoubleClick={handleEndLabelDoubleClick}
              style={{ cursor: 'pointer', overflow: 'visible' }}
            >
              <div 
                className={'label-text' + (isEdgeSelected ? ' selected' : '')}
                style={{
                  textAlign: ePos.align,
                  pointerEvents: 'auto',
                  background: 'transparent',
                  width: boxWidth + 'px'
                }}
              >
                {props.elabel}
              </div>
            </foreignObject>
          );
        })()}

        {segments && segments.all && segments.all.map((s, i) => {
          // Safety check for s.start and s.end
          if (!s || !s.start || !s.end || !s.start.pt || !s.end.pt) {
            return (
              <g key={i}>
                <path tabIndex="-1" className="clickable content segment" d={pathD} style={{ pointerEvents: 'stroke' }} />
              </g>
            );
          }
          const labelX = mainLabelPos ? mainLabelPos.x : (s.start.pt.x + s.end.pt.x) / 2;
          const labelY = mainLabelPos ? mainLabelPos.y : (s.start.pt.y + s.end.pt.y) / 2;
          const labelAlign = mainLabelPos ? mainLabelPos.align : 'left';
          const labelWidth = 300;
          let foX = labelX;
          if (labelAlign === 'right') foX = labelX - labelWidth;
          else if (labelAlign === 'center') foX = labelX - labelWidth / 2;
          return (
            <g key={i}>
              <path tabIndex="-1" className="clickable content segment" d={pathD} style={{ pointerEvents: 'stroke' }} />
              {s.label && (
                <foreignObject 
                  className="label" 
                  x={foX} 
                  y={labelY}
                  width={labelWidth}
                  height="25"
                  onDoubleClick={handleMainLabelDoubleClick}
                  style={{ cursor: 'pointer', overflow: 'visible' }}
                >
                  <div 
                    className={'label-text' + (isEdgeSelected ? ' selected' : '')} 
                    style={{ 
                      textAlign: labelAlign,
                      pointerEvents: 'auto',
                      width: labelWidth + 'px',
                      background: 'transparent'
                    }}
                  >
                    {s.label}
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}

        <path className="head Association preview" style={headStyles} />
        <path className="head Association clickable content" tabIndex="-1" style={headStyles} />
        <path className="tail Association preview" style={tailStyles} />
        <path className="tail Association clickable content" tabIndex="-1" style={tailStyles} />

        {startBox && (
          <g>
            <circle
              className={'edge-anchor content clickable no-drag' + (hoverAnchor === 'start' ? ' hover' : '')}
              r={draggingAnchor === 'start' && isShiftMode ? ANCHOR_SHIFT_RADIUS : ANCHOR_HANDLE_RADIUS}
              style={{ 
                transform: `translate(${anchorStart.x}px, ${anchorStart.y}px)`,
                fill: draggingAnchor === 'start' && isShiftMode ? ANCHOR_SHIFT_FILL : undefined,
                stroke: draggingAnchor === 'start' && isShiftMode ? ANCHOR_SHIFT_STROKE : undefined,
                strokeWidth: draggingAnchor === 'start' && isShiftMode ? ANCHOR_SHIFT_STROKE_WIDTH : undefined,
                strokeOpacity: draggingAnchor === 'start' && isShiftMode ? 1 : undefined,
                cursor: (hoverAnchor === 'start' && hoverShiftPressed) ? (startSide === 'top' || startSide === 'bottom' ? 'ew-resize' : 'ns-resize') : undefined,
                opacity: (draggingAnchor === 'start' && !isShiftMode && ghostPosition) ? 0 : undefined
              }}
              onMouseDown={handleStartAnchorDown}
              onMouseUp={handleStartAnchorUp}
              onMouseEnter={handleAnchorMouseEnter('start')}
              onMouseLeave={handleAnchorMouseLeave('start')}
            />
            {/* Arrow indicators for shift mode - DISABLED for cleaner look
            {draggingAnchor === 'start' && isShiftMode && dragSide && (
              (dragSide === 'top' || dragSide === 'bottom') ? [
                  <text
                    key="arrow-left"
                    x={anchorStart.x - ANCHOR_ARROW_OFFSET}
                    y={anchorStart.y}
                    dominantBaseline="central"
                    textAnchor="middle"
                    style={{ fontSize: ANCHOR_ARROW_FONT_SIZE + 'px', fill: ANCHOR_ARROW_COLOR, fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none' }}
                  >â—€</text>,
                  <text
                    key="arrow-right"
                    x={anchorStart.x + ANCHOR_ARROW_OFFSET}
                    y={anchorStart.y}
                    dominantBaseline="central"
                    textAnchor="middle"
                    style={{ fontSize: ANCHOR_ARROW_FONT_SIZE + 'px', fill: ANCHOR_ARROW_COLOR, fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none' }}
                  >â–¶</text>
              ] : [
                  <text
                    key="arrow-up"
                    x={anchorStart.x}
                    y={anchorStart.y - ANCHOR_ARROW_OFFSET}
                    dominantBaseline="central"
                    textAnchor="middle"
                    style={{ fontSize: ANCHOR_ARROW_FONT_SIZE + 'px', fill: ANCHOR_ARROW_COLOR, fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none' }}
                  >â–²</text>,
                  <text
                    key="arrow-down"
                    x={anchorStart.x}
                    y={anchorStart.y + ANCHOR_ARROW_OFFSET}
                    dominantBaseline="central"
                    textAnchor="middle"
                    style={{ fontSize: ANCHOR_ARROW_FONT_SIZE + 'px', fill: ANCHOR_ARROW_COLOR, fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none' }}
                  >â–¼</text>
              ]
            )}
            */}
          </g>
        )}
        
        {endBox && (
          <g>
            <circle
              className={'edge-anchor content clickable no-drag' + (hoverAnchor === 'end' ? ' hover' : '')}
              r={draggingAnchor === 'end' && isShiftMode ? ANCHOR_SHIFT_RADIUS : ANCHOR_HANDLE_RADIUS}
              style={{ 
                transform: `translate(${anchorEnd.x}px, ${anchorEnd.y}px)`,
                fill: draggingAnchor === 'end' && isShiftMode ? ANCHOR_SHIFT_FILL : undefined,
                stroke: draggingAnchor === 'end' && isShiftMode ? ANCHOR_SHIFT_STROKE : undefined,
                strokeWidth: draggingAnchor === 'end' && isShiftMode ? ANCHOR_SHIFT_STROKE_WIDTH : undefined,
                strokeOpacity: draggingAnchor === 'end' && isShiftMode ? 1 : undefined,
                cursor: (hoverAnchor === 'end' && hoverShiftPressed) ? (endSide === 'top' || endSide === 'bottom' ? 'ew-resize' : 'ns-resize') : undefined,
                opacity: (draggingAnchor === 'end' && !isShiftMode && ghostPosition) ? 0 : undefined
              }}
              onMouseDown={handleEndAnchorDown}
              onMouseUp={handleEndAnchorUp}
              onMouseEnter={handleAnchorMouseEnter('end')}
              onMouseLeave={handleAnchorMouseLeave('end')}
            />
            {/* Arrow indicators for shift mode - DISABLED for cleaner look
            {draggingAnchor === 'end' && isShiftMode && dragSide && (
              (dragSide === 'top' || dragSide === 'bottom') ? [
                  <text
                    key="arrow-left"
                    x={anchorEnd.x - ANCHOR_ARROW_OFFSET}
                    y={anchorEnd.y}
                    dominantBaseline="central"
                    textAnchor="middle"
                    style={{ fontSize: ANCHOR_ARROW_FONT_SIZE + 'px', fill: ANCHOR_ARROW_COLOR, fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none' }}
                  >â—€</text>,
                  <text
                    key="arrow-right"
                    x={anchorEnd.x + ANCHOR_ARROW_OFFSET}
                    y={anchorEnd.y}
                    dominantBaseline="central"
                    textAnchor="middle"
                    style={{ fontSize: ANCHOR_ARROW_FONT_SIZE + 'px', fill: ANCHOR_ARROW_COLOR, fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none' }}
                  >â–¶</text>
              ] : [
                  <text
                    key="arrow-up"
                    x={anchorEnd.x}
                    y={anchorEnd.y - ANCHOR_ARROW_OFFSET}
                    dominantBaseline="central"
                    textAnchor="middle"
                    style={{ fontSize: ANCHOR_ARROW_FONT_SIZE + 'px', fill: ANCHOR_ARROW_COLOR, fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none' }}
                  >â–²</text>,
                  <text
                    key="arrow-down"
                    x={anchorEnd.x}
                    y={anchorEnd.y + ANCHOR_ARROW_OFFSET}
                    dominantBaseline="central"
                    textAnchor="middle"
                    style={{ fontSize: ANCHOR_ARROW_FONT_SIZE + 'px', fill: ANCHOR_ARROW_COLOR, fontWeight: 'bold', pointerEvents: 'none', userSelect: 'none' }}
                  >â–¼</text>
              ]
            )}
            */}
          </g>
        )}
        
        {segmentHandles.map((handle, idx) => {
          return (
            <rect
              key={'seg-handle-' + idx}
              className={'segment-handle content clickable no-drag ' + (handle.isVertical ? 'vertical' : 'horizontal')}
              x={handle.x}
              y={handle.y}
              onMouseDown={(e) => handleSegmentMouseDown(e, handle.index, handle.isVertical)}
            />
          );
        })}
        
        {/* Ghost circle during normal drag - rendered LAST to be on top */}
        {draggingAnchor && !isShiftMode && ghostPosition && (
          <circle
            r={ANCHOR_HANDLE_RADIUS}
            style={{
              transform: `translate(${ghostPosition.x}px, ${ghostPosition.y}px)`,
              fill: ANCHOR_GHOST_FILL,
              opacity: ANCHOR_GHOST_OPACITY,
              pointerEvents: 'none'
            }}
          />
        )}
      </svg>
    );

  } catch (e) {
    console.error("Edge Render Error:", e);
    return null;
  }
})()}

{/* HTML Ghost circle - tracks mouse during anchor drag */}
{(() => {
  // Setup global ghost system once
  if (!window.__edgeGhostSetup) {
    window.__edgeGhostSetup = true;
    window.__edgeGhostActive = false;
    window.__edgeGhostMouseDown = false;
    window.__edgeGhostStartPos = null;
    window.__edgeGhostThreshold = 5; // pixels to move before showing ghost
    
    // Create ghost div
    window.__edgeGhostDiv = document.createElement('div');
    window.__edgeGhostDiv.style.cssText = 'position:fixed;width:16px;height:16px;border-radius:50%;background:#888;opacity:0.7;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);display:none;';
    document.body.appendChild(window.__edgeGhostDiv);
    
    // Mouse down - start tracking
    window.__edgeGhostDownListener = function(e) {
      // Check if clicked on an anchor handle
      var target = e.target;
      if (target && target.classList && target.classList.contains('edge-anchor')) {
        window.__edgeGhostMouseDown = true;
        window.__edgeGhostStartPos = { x: e.clientX, y: e.clientY };
        window.__edgeGhostActive = false;
      }
    };
    
    // Mouse move - show ghost if moved enough
    window.__edgeGhostMoveListener = function(e) {
      if (window.__edgeGhostMouseDown && window.__edgeGhostStartPos) {
        var dx = e.clientX - window.__edgeGhostStartPos.x;
        var dy = e.clientY - window.__edgeGhostStartPos.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist >= window.__edgeGhostThreshold && !window.__edgeGhostActive) {
          window.__edgeGhostActive = true;
        }
        
        if (window.__edgeGhostActive && window.__edgeGhostDiv) {
          window.__edgeGhostDiv.style.display = 'block';
          window.__edgeGhostDiv.style.left = e.clientX + 'px';
          window.__edgeGhostDiv.style.top = e.clientY + 'px';
        }
      }
    };
    
    // Mouse up - hide ghost and reset (backup, main detection is in mousemove)
    window.__edgeGhostUpListener = function(e) {
      window.__edgeGhostMouseDown = false;
      window.__edgeGhostActive = false;
      window.__edgeGhostStartPos = null;
      if (window.__edgeGhostDiv) {
        window.__edgeGhostDiv.style.display = 'none';
      }
    };
    
    document.addEventListener('mousedown', window.__edgeGhostDownListener, true);
    document.addEventListener('mousemove', window.__edgeGhostMoveListener, true);
    // Use window instead of document for mouseup - might catch it earlier
    window.addEventListener('mouseup', window.__edgeGhostUpListener, true);
    
    // Use pointerup to reset ghost state
    window.addEventListener('pointerup', function(e) {
      window.__edgeGhostMouseDown = false;
      window.__edgeGhostActive = false;
      window.__edgeGhostStartPos = null;
      if (window.__edgeGhostDiv) {
        window.__edgeGhostDiv.style.display = 'none';
      }
    }, true);
  }
  
  return null;
})()}

{edge.midnodes.map(m => (
  <EdgePoint data={edge.father.model.id} initialSize={m} key={m.id} view="EdgePoint" />
))}

{decorators}

</div>