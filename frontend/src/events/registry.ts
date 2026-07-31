/**
 * Centralized event registry for all custom DOM events in Jjodel.
 * Import from here instead of using hardcoded strings.
 */

// ─── UI & Navigation ────────────────────────────────────────────
export const JjodelEvents = {
  // UI Navigation
  ACTIVE_TAB: 'jjodel:active-tab',
  EDITOR_TYPE_CHANGE: 'jjodel:editor-type-change',
  TOGGLE_TREE_VIEW: 'jjodel:toggle-tree-view',
  TOGGLE_SINGLETONS: 'jjodel:toggle-singletons',
  TOGGLE_EDGE_LABELS: 'jjodel:toggle-edge-labels',
  TOGGLE_BACKGROUND: 'jjodel:toggle-background',
  TOGGLE_GRID: 'jjodel:toggle-grid',
  TOGGLE_HIGHLIGHT_MODE: 'jjodel:toggle-highlight-mode',
  // Canvas
  CANVAS_ELEMENT_SELECTED: 'jjodel:canvas-element-selected',
  SELECT_NODE: 'jjodel:selectNode',
  PROPAGATE_VIEW_SIZE: 'jjodel:propagate-view-size',
  SELECT_VIEW_IN_WORKBENCH: 'jjodel:selectViewInWorkbench',
  POLYMETRIC_NODE_SELECTED: 'jjodel:polymetric-node-selected',
  CHILD_CONTEXT_MENU: 'jjodel:child-context-menu',
  CLASSIC_NODE_MOUNTED: 'jjodel:classic-node-mounted',
  CLASSIC_NODE_UNMOUNTED: 'jjodel:classic-node-unmounted',
  // Viewpoint
  OPEN_VIEWPOINT_EDITOR: 'jjodel:openViewpointEditor',
  CLOSE_VIEWPOINT_EDITOR: 'jjodel:closeViewpointEditor',
  VIEWPOINT_EDITOR_STATE: 'jjodel:viewpoint-editor-state',
  VIEW_CREATED: 'jjodel:viewCreated',
  // Panels
  HELP_OPEN: 'jjodel:help-open',
  EXPLAIN_OPEN: 'jjodel:explain-open',
  OPEN_POLYMETRIC: 'jjodel:open-polymetric',
  OPEN_MEGAMODEL: 'jjodel:openMegamodel',
  MEGAMODEL_OPEN_ARTIFACT: 'jjodel:megamodel:open-artifact',
  PROPERTIES_PIN_VIEW: 'jjodel:properties-pin-view',
  // Project
  NEW_PROJECT: 'jjodel:new-project',
  CREATE_MODEL: 'jjodel:createModel',
  CREATE_VIEWPOINT: 'jjodel:createViewpoint',
  SHARE_PROJECT: 'jjodel:shareProject',
  OPEN_TRANSFORMATION: 'jjodel:openTransformation',
  TRANSFORMATIONS: 'jjodel:transformations',
  OPEN_NEW_TRANSFORMATION_DIALOG: 'jjodel:open-new-transformation-dialog',
  // Export
  EXPORT_CANVAS: 'jjodel:export-canvas',
  // Layout
  LAYOUT_MODE_CHANGE: 'jjodel:layout-mode-change',
  // Theme
  THEME_CHANGED: 'jjodel:theme-changed',
  // Notifications
  TOAST: 'jjodel:toast',
  TOAST_PREFS_CHANGED: 'jjodel:toast-prefs-changed',
  HISTORY_CHANGED: 'jjodel:history-changed',
  GUARD_VIOLATION: 'jjodel:guard-violation',
  NOTIFICATIONS_POPOVER_TOGGLE: 'jjodel:notifications-popover-toggle',
  JODIE_PREFILL_AND_OPEN: 'jjodel:jodie-prefill-and-open',
  // Status
  JJTL_STATUSBAR: 'jjodel:jjtl-statusbar',
  // Activity
  ACTIVITY_LOGGED: 'jjodel:activity-logged',
  // Import summary modal (post-import feedback for .ecore / .xmi)
  IMPORT_SUMMARY_SHOW: 'jjodel:import-summary-show',
} as const;

// ─── JjScript ───────────────────────────────────────────────────
export const JjScriptEvents = {
  EXECUTING: 'jjscript:executing',
  EXECUTION_START: 'jjscript:execution-start',
  EXECUTION_END: 'jjscript:execution-end',
  EXECUTION_PAUSED: 'jjscript:execution-paused',
  EXECUTED: 'jjscript:executed',
  METAMODEL_CREATED: 'jjscript:metamodel-created',
  ELEMENT_MODIFIED: 'jjscript:element-modified',
} as const;

// ─── AI providers ───────────────────────────────────────────────
export const AIEvents = {
  PROVIDER_CHANGED: 'ai-provider-changed',
  SETTINGS_CHANGED: 'ai-settings-changed',
  PROMPT_CHANGED: 'prompt-changed',
} as const;

// ─── Jjodie chat agent ─────────────────────────────────────────
export const JjodieEvents = {
  METAMODEL_UPDATED: 'jjodie:metamodel-updated',
  OPEN: 'jodie:open',
  CONSOLE_MODE_CHANGE: 'jodie:console-mode-change',
} as const;

// ─── EnvGen (environment generation) ────────────────────────────
export const EnvGenEvents = {
  CONFIG_CHANGED: 'envgen-config-changed',
  OPEN_WIZARD: 'envgen-open-wizard',
} as const;

// ─── Avatar ─────────────────────────────────────────────────────
export const AvatarEvents = {
  CONFIG_CHANGE: 'avatar-config-change',
} as const;

// ─── Uncategorized / cross-cutting ──────────────────────────────
export const SystemEvents = {
  INTERFACE_MODE_CHANGE: 'interfaceModeChange',
  JJTL_EXECUTION_RESULT: 'jjtl-execution-result',
  TREEVIEW_SCROLL: 'treeview:scroll-to-element',
} as const;

// ─── Type helpers ───────────────────────────────────────────────
export type JjodelEventName = typeof JjodelEvents[keyof typeof JjodelEvents];
export type JjScriptEventName = typeof JjScriptEvents[keyof typeof JjScriptEvents];
export type AIEventName = typeof AIEvents[keyof typeof AIEvents];
export type JjodieEventName = typeof JjodieEvents[keyof typeof JjodieEvents];
export type EnvGenEventName = typeof EnvGenEvents[keyof typeof EnvGenEvents];
export type AvatarEventName = typeof AvatarEvents[keyof typeof AvatarEvents];
export type SystemEventName = typeof SystemEvents[keyof typeof SystemEvents];
