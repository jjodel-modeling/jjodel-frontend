/**
 * Editor V3 — Notation side-effect imports.
 *
 * Importing this module triggers all registerBuiltInView() calls
 * so the ViewRegistry is fully populated before first render.
 */

// UML notation
import './UMLClassView';
import './UMLEnumView';
import './UMLPackageView';
import './UMLDataTypeView';

// Simplified notation
import './SimplifiedClassView';

// Object views (M1 — both UML and Simplified)
import './GenericObjectView';
