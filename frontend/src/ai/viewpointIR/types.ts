// Intermediate Representation (IR) for AI-generated syntactic viewpoints.
// Type declarations only — no runtime logic. Schema version: ir-1.0.
// The deterministic generator (later task) lowers each ViewIR into a persisted
// DViewElement; the runtime interpreter (IRView) renders a node from a ViewIR.

export type PathExpr = string;

export type Literal =
  | { kind: 'string';  value: string }
  | { kind: 'number';  value: number }
  | { kind: 'boolean'; value: boolean };

export type Predicate =
  | { op: 'and' | 'or'; args: Predicate[] }
  | { op: 'not'; arg: Predicate }
  | { op: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte'; left: PathExpr | Literal; right: PathExpr | Literal }
  | { op: 'exists'; path: PathExpr }
  | { op: 'empty';  path: PathExpr }
  | { op: 'isKind'; class: string; path?: PathExpr }
  | { op: 'literal'; value: boolean };

export type Conditional<T> =
  | T
  | { when: Predicate; then: T; else?: T }
  | { rules: { when: Predicate; then: T }[]; default?: T };

export type ColorToken = string;
export interface BorderSpec { color: ColorToken; width: number; style: 'solid' | 'dashed' | 'dotted'; }
export interface TextStyle {
  fontStyle?: Conditional<'normal' | 'italic'>;
  fontWeight?: Conditional<'normal' | 'bold'>;
  color?: Conditional<ColorToken>;
  size?: number;
}

export type TextSource =
  | { from: 'path';    expr: PathExpr }
  | { from: 'literal'; text: string };

export interface LabelSpec {
  position: 'top' | 'center' | 'inside' | 'bottom';
  source: TextSource;
  visible?: Conditional<boolean>;
  style?: TextStyle;
}

export interface BadgeSpec {
  icon: Conditional<string>;
  position: 'tl' | 'tr' | 'bl' | 'br' | 'inline';
  visible: Conditional<boolean>;
  tooltip?: Conditional<string>;
  color?: Conditional<ColorToken>;
}

export type FieldSegment =
  | { kind: 'name' }
  | { kind: 'type' }
  | { kind: 'value'; path?: PathExpr }
  | { kind: 'multiplicity' }
  | { kind: 'literal'; text: string }
  | { kind: 'badge'; badge: BadgeSpec };

export interface FieldFormat {
  segments: FieldSegment[];
  visible?: Conditional<boolean>;
  style?: TextStyle;
}

export type RowSource =
  | { from: 'attributes' }
  | { from: 'references' }
  | { from: 'operations' }
  | { from: 'features'; filter?: Predicate }
  | { from: 'query'; path: PathExpr };

export interface FieldCompartment {
  id: string;
  title?: Conditional<string>;
  source: RowSource;
  rowFormat: FieldFormat;
  visible?: Conditional<boolean>;
  separator?: boolean;
}

export interface Shape {
  form: Conditional<'rect' | 'rounded' | 'ellipse' | 'diamond' | 'hexagon' | 'icon'>;
  icon?: Conditional<string>;
  fill?: Conditional<ColorToken>;
  border?: Conditional<BorderSpec>;
  labels?: LabelSpec[];
  badges?: BadgeSpec[];
  minWidth?: number;
  minHeight?: number;
}

export interface LayoutSpec { mode: 'free' | 'vertical' | 'horizontal' | 'grid'; gap?: number; padding?: number; }
export interface Containment { layout: LayoutSpec; childFilter?: Predicate; }

export interface EdgeSpec {
  source?: PathExpr;
  target?: PathExpr;
  line?: { color?: Conditional<ColorToken>; width?: Conditional<number>; style?: Conditional<'solid' | 'dashed' | 'dotted'>; };
  terminations?: { sourceEnd?: EdgeTermination; targetEnd?: EdgeTermination; };
  routing?: 'orthogonal' | 'straight' | 'curved';
  labels?: { source?: TextSource; center?: TextSource; target?: TextSource; };
}
export type EdgeTermination = 'none' | 'openArrow' | 'closedArrow' | 'hollowTriangle' | 'filledDiamond' | 'hollowDiamond';

export interface ViewCommon {
  irVersion: string;
  id?: string;
  metaclasses: string[];
  predicate?: Predicate;
  priority?: number;
  exclusive?: boolean;
  label?: string;
}

export type ViewIR =
  | ({ kind: 'graph' }       & ViewCommon & { containment: Containment; background?: ColorToken; grid?: boolean; decorations?: BadgeSpec[] })
  | ({ kind: 'vertex' }      & ViewCommon & { shape: Shape; fieldCompartments?: FieldCompartment[] })
  | ({ kind: 'graphVertex' } & ViewCommon & { shape: Shape; fieldCompartments?: FieldCompartment[]; containment: Containment })
  | ({ kind: 'field' }       & ViewCommon & { field: FieldFormat })
  | ({ kind: 'edge' }        & ViewCommon & { edge: EdgeSpec });

export interface ViewpointIR { irVersion: string; name?: string; metamodel?: string; views: ViewIR[]; }
