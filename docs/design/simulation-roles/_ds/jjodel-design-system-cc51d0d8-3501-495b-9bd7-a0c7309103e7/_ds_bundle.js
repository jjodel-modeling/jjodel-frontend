/* @ds-bundle: {"format":3,"namespace":"JjodelDesignSystem_cc51d0","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"EntityBadge","sourcePath":"components/core/EntityBadge.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"ProjectCard","sourcePath":"components/core/ProjectCard.jsx"},{"name":"StatusDot","sourcePath":"components/core/StatusDot.jsx"},{"name":"Switch","sourcePath":"components/core/Switch.jsx"},{"name":"Tabs","sourcePath":"components/core/Tabs.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"VersionChip","sourcePath":"components/core/VersionChip.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"446753383f70","components/core/Badge.jsx":"cb10293a6484","components/core/Button.jsx":"d477f2516a0a","components/core/Card.jsx":"034627c64e0a","components/core/EntityBadge.jsx":"3a1a807c79d2","components/core/IconButton.jsx":"969d3ba42edc","components/core/Input.jsx":"f739a689a1c0","components/core/ProjectCard.jsx":"136b7343aae1","components/core/StatusDot.jsx":"93633fcec267","components/core/Switch.jsx":"a78c27e072d1","components/core/Tabs.jsx":"d88ba79be85a","components/core/Tag.jsx":"fec7c8625234","components/core/VersionChip.jsx":"045a317d9f29"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.JjodelDesignSystem_cc51d0 = window.JjodelDesignSystem_cc51d0 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel Avatar — circular user initials badge. Slate fill, white
 * text. Appears in the navbar and on collaborative projects.
 */
function Avatar({
  initials = 'JJ',
  size = 32,
  tone = 'slate',
  style,
  ...rest
}) {
  const tones = {
    slate: 'var(--color-accent)',
    red: '#e11d48',
    indigo: 'var(--color-entity-operation-fg)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: '50%',
      background: tones[tone] || tone,
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      fontSize: size <= 28 ? 'var(--text-xs)' : 'var(--text-sm)',
      fontWeight: 'var(--font-semibold)',
      flexShrink: 0,
      userSelect: 'none',
      ...style
    }
  }, rest), initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel Badge — a small status/label chip. Used for project status
 * (Active / Idle / Stale) and semantic states. Subtle pastel fill,
 * 4px radius, 11px medium text.
 */
function Badge({
  variant = 'neutral',
  children,
  style,
  ...rest
}) {
  const variants = {
    neutral: {
      bg: 'var(--color-bg-tertiary)',
      fg: 'var(--color-text-tertiary)'
    },
    active: {
      bg: 'var(--color-success-bg)',
      fg: 'var(--color-success-hover)'
    },
    idle: {
      bg: 'var(--color-warning-bg)',
      fg: 'var(--color-warning-hover)'
    },
    stale: {
      bg: 'var(--color-bg-tertiary)',
      fg: 'var(--color-text-placeholder)'
    },
    success: {
      bg: 'var(--color-success-bg)',
      fg: 'var(--color-success-hover)'
    },
    warning: {
      bg: 'var(--color-warning-bg)',
      fg: 'var(--color-warning-hover)'
    },
    error: {
      bg: 'var(--color-error-bg)',
      fg: 'var(--color-error-hover)'
    },
    info: {
      bg: 'var(--color-info-bg)',
      fg: 'var(--color-info-hover)'
    }
  };
  const v = variants[variant] || variants.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      background: v.bg,
      color: v.fg,
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-medium)',
      lineHeight: 1.5,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel Button — the standard action control.
 * Monochrome slate system: primary is a slate gradient, everything
 * else is quiet. 36px tall by default, 8px radius, sentence-case labels.
 */
function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  icon,
  iconRight,
  children,
  style,
  ...rest
}) {
  const heights = {
    sm: 28,
    md: 36,
    lg: 44
  };
  const padding = {
    sm: '4px 12px',
    md: '8px 16px',
    lg: '12px 24px'
  };
  const fontSize = {
    sm: 'var(--text-xs)',
    md: 'var(--text-sm)',
    lg: 'var(--text-base)'
  };
  const base = {
    display: block ? 'flex' : 'inline-flex',
    width: block ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    minHeight: heights[size],
    padding: padding[size],
    fontFamily: 'var(--font-sans)',
    fontSize: fontSize[size],
    fontWeight: 'var(--font-medium)',
    lineHeight: 'var(--leading-normal)',
    whiteSpace: 'nowrap',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'var(--transition-button)',
    userSelect: 'none',
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : undefined
  };
  const variants = {
    primary: {
      background: 'var(--gradient-primary)',
      color: 'var(--color-text-inverse)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    secondary: {
      background: 'var(--color-bg-secondary)',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-border-primary)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-border-primary)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-secondary)'
    },
    danger: {
      background: 'var(--color-error)',
      color: 'var(--color-text-inverse)'
    },
    slate: {
      background: 'var(--color-accent)',
      color: 'var(--color-text-inverse)'
    }
  };
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const iconNode = name => name ? /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${name}`,
    style: {
      fontSize: iconSize,
      lineHeight: 1
    }
  }) : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    style: {
      ...base,
      ...variants[variant],
      ...style
    },
    disabled: disabled
  }, rest), iconNode(icon), children, iconNode(iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel Card — generic white surface. 12px radius, soft shadow,
 * hairline border optional. Hover-lift is opt-in.
 */
function Card({
  hover = false,
  padding = 'var(--panel-padding)',
  bordered = false,
  children,
  style,
  ...rest
}) {
  const [raised, setRaised] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--color-bg-secondary)',
      border: bordered ? '0.5px solid var(--color-border-secondary)' : 'none',
      borderRadius: 'var(--radius-lg)',
      boxShadow: raised && hover ? 'var(--shadow-project-card-hover)' : 'var(--shadow-project-card)',
      padding,
      transition: 'box-shadow var(--duration-normal) var(--ease-out)',
      ...style
    },
    onMouseEnter: () => hover && setRaised(true),
    onMouseLeave: () => hover && setRaised(false)
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/EntityBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel EntityBadge — the rounded-square type chip used throughout
 * the tree view, project lists, and canvas to identify a modeling
 * artifact. Shows either the single-letter glyph (M/m/T/V/C/…) or
 * the Bootstrap icon, in the type's pastel-bg / saturated-fg pair.
 *
 * Source of truth: frontend/src/common/entityMeta.ts
 */
const ENTITY_META = {
  metamodel: {
    letter: 'M',
    icon: 'boxes',
    bg: 'var(--color-entity-metamodel-bg)',
    fg: 'var(--color-entity-metamodel-fg)'
  },
  model: {
    letter: 'm',
    icon: 'box',
    bg: 'var(--color-entity-model-bg)',
    fg: 'var(--color-entity-model-fg)'
  },
  transformation: {
    letter: 'T',
    icon: 'arrow-left-right',
    bg: 'var(--color-entity-transformation-bg)',
    fg: 'var(--color-entity-transformation-fg)'
  },
  viewpoint: {
    letter: 'V',
    icon: 'eye',
    bg: 'var(--color-entity-viewpoint-bg)',
    fg: 'var(--color-entity-viewpoint-fg)'
  },
  package: {
    letter: 'P',
    icon: 'folder',
    bg: 'var(--color-entity-package-bg)',
    fg: 'var(--color-entity-package-fg)'
  },
  class: {
    letter: 'C',
    icon: 'diagram-3',
    bg: 'var(--color-entity-class-bg)',
    fg: 'var(--color-entity-class-fg)'
  },
  enum: {
    letter: 'E',
    icon: 'list-ol',
    bg: 'var(--color-entity-enum-bg)',
    fg: 'var(--color-entity-enum-fg)'
  },
  attribute: {
    letter: 'A',
    icon: 'card-text',
    bg: 'var(--color-entity-attribute-bg)',
    fg: 'var(--color-entity-attribute-fg)'
  },
  reference: {
    letter: 'R',
    icon: 'link-45deg',
    bg: 'var(--color-entity-reference-bg)',
    fg: 'var(--color-entity-reference-fg)'
  },
  operation: {
    letter: 'O',
    icon: 'gear',
    bg: 'var(--color-entity-operation-bg)',
    fg: 'var(--color-entity-operation-fg)'
  },
  literal: {
    letter: 'L',
    icon: 'hash',
    bg: 'var(--color-entity-neutral-bg)',
    fg: 'var(--color-entity-neutral-fg)'
  },
  parameter: {
    letter: 'P',
    icon: 'three-dots',
    bg: 'var(--color-entity-neutral-bg)',
    fg: 'var(--color-entity-neutral-fg)'
  },
  dataType: {
    letter: 'D',
    icon: 'file-earmark-code',
    bg: 'var(--color-entity-neutral-bg)',
    fg: 'var(--color-entity-neutral-fg)'
  }
};
function EntityBadge({
  type = 'metamodel',
  show = 'letter',
  size = 'md',
  style,
  ...rest
}) {
  const meta = ENTITY_META[type] || ENTITY_META.metamodel;
  const dim = {
    sm: 22,
    md: 32,
    lg: 40
  }[size];
  const fs = {
    sm: 11,
    md: 15,
    lg: 19
  }[size];
  return /*#__PURE__*/React.createElement("span", _extends({
    title: type,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dim,
      height: dim,
      flexShrink: 0,
      background: meta.bg,
      color: meta.fg,
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--font-bold)',
      fontSize: fs,
      lineHeight: 1,
      ...style
    }
  }, rest), show === 'icon' ? /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${meta.icon}`,
    style: {
      fontSize: fs
    }
  }) : meta.letter);
}
Object.assign(__ds_scope, { EntityBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/EntityBadge.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel IconButton — a square, borderless button for a single
 * Bootstrap icon. Used in card action rows, toolbars, and row hovers.
 */
function IconButton({
  icon,
  size = 'md',
  active = false,
  label,
  style,
  ...rest
}) {
  const dim = {
    sm: 28,
    md: 32,
    lg: 36
  }[size];
  const fs = {
    sm: 14,
    md: 16,
    lg: 18
  }[size];
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    title: label,
    style: {
      width: dim,
      height: dim,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: active ? 'var(--color-bg-active)' : 'transparent',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      color: active ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
      cursor: 'pointer',
      transition: 'var(--transition-fast-all)',
      ...style
    },
    onMouseEnter: e => {
      if (active) return;
      e.currentTarget.style.background = 'var(--color-bg-hover)';
      e.currentTarget.style.color = 'var(--color-text-primary)';
    },
    onMouseLeave: e => {
      if (active) return;
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = 'var(--color-text-tertiary)';
    }
  }, rest), /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${icon}`,
    style: {
      fontSize: fs,
      lineHeight: 1
    }
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel Input — text field. 40px tall, 8px radius, slate border,
 * sky-blue focus ring. Optional leading Bootstrap icon.
 */
function Input({
  icon,
  label,
  hint,
  invalid = false,
  style,
  ...rest
}) {
  const field = /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'block'
    }
  }, icon && /*#__PURE__*/React.createElement("i", {
    className: `bi bi-${icon}`,
    style: {
      position: 'absolute',
      left: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: 15,
      color: 'var(--color-text-placeholder)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("input", _extends({
    style: {
      width: '100%',
      height: 'var(--input-height)',
      padding: icon ? '0 12px 0 36px' : '0 12px',
      background: 'var(--color-bg-elevated)',
      border: `1px solid ${invalid ? 'var(--color-error)' : 'var(--color-border-primary)'}`,
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      color: 'var(--color-text-primary)',
      outline: 'none',
      transition: 'var(--transition-input)',
      ...style
    },
    onFocus: e => {
      e.target.style.borderColor = invalid ? 'var(--color-error)' : 'var(--color-link)';
      e.target.style.boxShadow = invalid ? '0 0 0 3px rgba(239,68,68,0.15)' : '0 0 0 3px rgba(14,165,233,0.15)';
    },
    onBlur: e => {
      e.target.style.borderColor = invalid ? 'var(--color-error)' : 'var(--color-border-primary)';
      e.target.style.boxShadow = 'none';
    }
  }, rest)));
  if (!label && !hint) return field;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-sans)'
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--font-medium)',
      color: 'var(--color-text-primary)',
      marginBottom: 'var(--space-2)'
    }
  }, label), field, hint && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 'var(--text-xs)',
      color: invalid ? 'var(--color-error)' : 'var(--color-text-tertiary)',
      marginTop: 'var(--space-1)'
    }
  }, hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusDot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel StatusDot — a small colored dot used before project names
 * in list/row views to signal status at a glance.
 */
function StatusDot({
  tone = 'active',
  size = 10,
  style,
  ...rest
}) {
  const tones = {
    active: 'var(--color-success)',
    idle: 'var(--color-warning)',
    stale: 'var(--color-text-disabled)',
    public: 'var(--color-link)',
    collaborative: 'var(--color-warning)',
    metamodel: 'var(--color-entity-metamodel-fg)',
    model: 'var(--color-entity-model-fg)',
    viewpoint: 'var(--color-entity-viewpoint-fg)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      background: tones[tone] || tones.active,
      flexShrink: 0,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { StatusDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusDot.jsx", error: String((e && e.message) || e) }); }

// components/core/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel Switch — a controlled toggle. 44×24 track, white knob,
 * slate accent when on. 250ms ease.
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  label,
  style,
  ...rest
}) {
  const toggle = () => {
    if (!disabled && onChange) onChange(!checked);
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    },
    onClick: toggle,
    role: "switch",
    "aria-checked": checked
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 44,
      height: 24,
      borderRadius: 12,
      background: checked ? 'var(--color-accent)' : 'var(--color-border-primary)',
      transition: 'background-color var(--duration-normal) var(--ease-in-out)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transform: checked ? 'translateX(20px)' : 'translateX(0)',
      transition: 'transform var(--duration-normal) var(--ease-in-out)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-sm)',
      color: 'var(--color-text-secondary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Switch.jsx", error: String((e && e.message) || e) }); }

// components/core/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel Tabs — the navbar tab row (Projects / Templates / Explore)
 * and the underline tab style (All / Public / Private / Collaborative).
 */
function Tabs({
  tabs = [],
  value,
  onChange,
  variant = 'pill',
  style,
  ...rest
}) {
  const active = value ?? (tabs[0] && tabs[0].id);
  if (variant === 'underline') {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: 'flex',
        gap: 'var(--space-6)',
        borderBottom: '1px solid var(--color-border-secondary)',
        ...style
      }
    }, rest), tabs.map(t => {
      const on = t.id === active;
      return /*#__PURE__*/React.createElement("button", {
        key: t.id,
        onClick: () => onChange && onChange(t.id),
        style: {
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 0 10px',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-medium)',
          color: on ? 'var(--color-link)' : 'var(--color-text-tertiary)',
          borderBottom: `2px solid ${on ? 'var(--color-link)' : 'transparent'}`,
          marginBottom: -1,
          transition: 'var(--transition-fast-all)'
        }
      }, t.label);
    }));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 'var(--space-1)',
      ...style
    }
  }, rest), tabs.map(t => {
    const on = t.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => onChange && onChange(t.id),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '8px 16px',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        color: on ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
        background: on ? 'var(--color-bg-secondary)' : 'transparent',
        boxShadow: on ? 'var(--shadow-sm)' : 'none',
        transition: 'var(--transition-fast-all)'
      }
    }, t.icon && /*#__PURE__*/React.createElement("i", {
      className: `bi bi-${t.icon}`,
      style: {
        fontSize: 15
      }
    }), t.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel Tag — a fully-rounded pill for free-form project tags.
 * Slate-200 fill, slate-600 text by default.
 */
function Tag({
  children,
  muted = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      background: muted ? 'var(--color-bg-tertiary)' : 'var(--color-bg-active)',
      color: muted ? 'var(--color-text-disabled)' : 'var(--color-text-tertiary)',
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--font-medium)',
      lineHeight: 1.5,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/core/VersionChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel VersionChip — a monospace revision/version chip (e.g. "Rev 2.2",
 * "v3.0.0-beta"). De-emphasized slate, IBM Plex Mono, tiny.
 */
function VersionChip({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      background: 'var(--color-bg-tertiary)',
      color: 'var(--color-text-disabled)',
      border: '0.5px solid var(--color-border-secondary)',
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      fontWeight: 'var(--font-medium)',
      letterSpacing: 0,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { VersionChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/VersionChip.jsx", error: String((e && e.message) || e) }); }

// components/core/ProjectCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Jjodel ProjectCard — the dashboard project tile. White card, 3px
 * colored accent bar on top (by visibility), status dot + name,
 * status badge + revision, a models/metamodels progress bar, and a
 * "modified" footer. Favorite + menu actions reveal on hover.
 */
function ProjectCard({
  name = 'Untitled',
  status = 'active',
  rev = '1.0',
  models = 0,
  metamodels = 0,
  modified = 'just now',
  visibility = 'private',
  favorite = false,
  onToggleFavorite,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const accent = {
    private: 'var(--color-border-primary)',
    public: 'var(--color-link)',
    collaborative: 'var(--color-warning)'
  }[visibility];
  const total = Math.max(models, metamodels, 1);
  const pct = Math.round(models / total * 100);
  const dotTone = visibility === 'public' ? 'public' : status;
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      borderRadius: 'var(--radius-lg)',
      boxShadow: hover ? 'var(--shadow-project-card-hover)' : 'var(--shadow-project-card)',
      transition: 'box-shadow var(--duration-normal) var(--ease-out)',
      overflow: 'hidden',
      cursor: 'pointer',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      width: '100%',
      background: accent
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      minHeight: 28
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.StatusDot, {
    tone: dotTone
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--font-semibold)',
      color: 'var(--color-text-primary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 2,
      opacity: hover || favorite ? 1 : 0,
      transition: 'opacity var(--duration-fast) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    size: "sm",
    icon: favorite ? 'star-fill' : 'star',
    label: "Favorite",
    style: favorite ? {
      color: '#facc15'
    } : undefined,
    onClick: e => {
      e.stopPropagation();
      onToggleFavorite && onToggleFavorite();
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    size: "sm",
    icon: "three-dots",
    label: "More",
    onClick: e => e.stopPropagation()
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    variant: status
  }, status[0].toUpperCase() + status.slice(1)), /*#__PURE__*/React.createElement(__ds_scope.VersionChip, null, "Rev ", rev)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-tertiary)',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "Models / Metamodels"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--font-semibold)',
      color: 'var(--color-text-secondary)'
    }
  }, models, " / ", metamodels)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      borderRadius: 2,
      background: 'var(--color-bg-active)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${pct}%`,
      background: accent === 'var(--color-border-primary)' ? 'var(--color-accent)' : accent
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-2)',
      paddingTop: 'var(--space-2)',
      borderTop: '1px solid var(--color-bg-tertiary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-disabled)'
    }
  }, "Modified ", modified)));
}
Object.assign(__ds_scope, { ProjectCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProjectCard.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.EntityBadge = __ds_scope.EntityBadge;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.ProjectCard = __ds_scope.ProjectCard;

__ds_ns.StatusDot = __ds_scope.StatusDot;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.VersionChip = __ds_scope.VersionChip;

})();
