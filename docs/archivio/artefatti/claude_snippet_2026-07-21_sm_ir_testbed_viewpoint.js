/**
 * sm_ir_testbed_viewpoint.js
 *
 * Console snippet: installs one complete IR viewpoint "IR Test Bed" for the
 * sm.ecore state-machine test bed (Machine / State / Transition).
 *
 * Consolidates the old separate artifacts (snippet_transitions.js +
 * snippet_containment.js + __jjodelInstallIRDemo) into a single viewpoint.
 *
 * Grounded on the real install API and IR types on branch alfonso-frontend-jjtl:
 *   - frontend/src/components/editor-v2/viewpoint/ir/irDemoFixture.ts
 *       DViewPoint.newVP(name, undefined, true, id)
 *       DViewElement.new2(name, jsxString, vp, d => { ...; d.ir = <IR> }, true, id)
 *   - frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts  (view shapes)
 *
 * Recipe:
 *   1. New project (offline) -> import sm.ecore -> import sm.xmi.
 *   2. Paste this whole file in the browser console, press Enter.
 *   3. Open the viewpoint selector and pick "IR Test Bed".
 *   4. (optional) Save to persist across reloads.
 *
 * Idempotent: fixed Pointer_TB_* ids; re-running is a no-op until a hard
 * refresh (which clears the interpreter's compile cache).
 */
(function installSmIrTestBed() {
  'use strict';
  var w = window;
  var ww = (typeof windoww !== 'undefined') ? windoww : w; // Jjodel aliases window as windoww

  // ---- runtime handles (D-classes are RuntimeAccessible in this app) --------
  var store = w.store || ww.store;
  var RA = w.RuntimeAccessibleClass || ww.RuntimeAccessibleClass;
  var DViewPoint   = w.DViewPoint   || ww.DViewPoint   || (RA && RA.get && RA.get('DViewPoint'));
  var DViewElement = w.DViewElement || ww.DViewElement || (RA && RA.get && RA.get('DViewElement'));
  if (!store || !DViewPoint || !DViewElement) {
    console.error('[ir-testbed] missing runtime handles (need store, DViewPoint, DViewElement on window/windoww). Open the app with an M1 model loaded, then retry.');
    return;
  }

  // ---- CONFIG: change here if your sm.ecore uses different names -------------
  var MC   = { machine: 'Machine', state: 'State', transition: 'Transition' };
  var REF  = { source: 'source', target: 'target' }; // Transition -> State references
  var ATTR = { initial: 'isInitial', final: 'isFinal' }; // State boolean attributes

  // ---- fixed ids (idempotency) ----------------------------------------------
  var ID = {
    vp:      'Pointer_TB_Viewpoint',
    state:   'Pointer_TB_View_State',
    machine: 'Pointer_TB_View_Machine',
    trans:   'Pointer_TB_View_Transition'
  };

  var idl = (store.getState && store.getState().idlookup) || {};
  if (idl[ID.vp]) {
    console.log('[ir-testbed] already installed (' + ID.vp + '). Pick "IR Test Bed" from the viewpoint selector, or hard-refresh to reinstall.');
    return;
  }

  // ---- jsxString: classic fallback only; we stay in IR, any placeholder ok ---
  function pickDefaultJsx() {
    try {
      for (var k in idl) {
        var o = idl[k];
        if (o && typeof o.jsxString === 'string' && o.jsxString.length > 0 && o.appliableTo) return o.jsxString;
      }
    } catch (e) { /* ignore */ }
    return '<div className="node"></div>';
  }
  var JSX = pickDefaultJsx();

  var V = 'ir-1.0';
  var attrsCompartment = {
    id: 'attrs',
    source: { from: 'attributes' },
    rowFormat: { segments: [ { kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' } ] },
    separator: true
  };

  // ---- State: vertex (name label + initial/final badges + attr compartment) --
  var stateView = {
    irVersion: V, kind: 'vertex', metaclasses: [MC.state],
    priority: 1, exclusive: true, label: 'State (IR)',
    shape: {
      form: 'rounded', fill: '#f8fafc',
      border: { color: '#334155', width: 1, style: 'solid' },
      labels: [ { position: 'center', source: { from: 'intrinsic', prop: 'name' } } ],
      badges: [
        { icon: 'bi-play-circle-fill', position: 'tl',
          visible: { when: { op: 'eq', left: '$' + ATTR.initial + '.value', right: { kind: 'boolean', value: true } }, then: true, else: false },
          tooltip: 'initial' },
        { icon: 'bi-check-circle-fill', position: 'tr',
          visible: { when: { op: 'eq', left: '$' + ATTR.final + '.value', right: { kind: 'boolean', value: true } }, then: true, else: false },
          tooltip: 'final' }
      ]
    },
    fieldCompartments: [ attrsCompartment ]
  };

  // ---- Machine: graphVertex (container hull around its States, collapsible) ---
  var machineView = {
    irVersion: V, kind: 'graphVertex', metaclasses: [MC.machine],
    priority: 1, exclusive: true, label: 'Machine (IR container)',
    shape: {
      form: 'rect', fill: '#ffffff',
      border: { color: '#0ea5e9', width: 1.5, style: 'solid' },
      labels: [ { position: 'top', source: { from: 'intrinsic', prop: 'name' } } ]
    },
    containment: {
      childFilter: { op: 'isKind', class: MC.state }, // States render inside the hull
      collapsible: true
      // collapsed omitted -> interpreter default child-count badge
    }
  };

  // ---- Transition: object-as-edge (source/target endpoints, arrow, label) ----
  var transitionView = {
    irVersion: V, kind: 'edge', metaclasses: [MC.transition],
    priority: 1, exclusive: true, label: 'Transition (IR object-as-edge)',
    edge: {
      source: '$' + REF.source + '.value',
      target: '$' + REF.target + '.value',
      line: { color: '#334155', width: 1.5, style: 'solid' },
      terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
      routing: 'orthogonal',
      labels: { center: { from: 'intrinsic', prop: 'name' }, placement: 'above' },
      persistWaypoints: true
    }
  };

  // ---- install ---------------------------------------------------------------
  var vp = DViewPoint.newVP('IR Test Bed', undefined, true, ID.vp);

  function addView(name, appliableTo, viewId, ir) {
    DViewElement.new2(name, JSX, vp, function (d) {
      d.appliableToClasses = ['DObject'];
      d.appliableTo = appliableTo; // classic-fallback field only; IR resolves by ir.kind
      d.ir = ir;
    }, true, viewId);
  }

  addView('IR State',      'Vertex', ID.state,   stateView);
  addView('IR Machine',    'Vertex', ID.machine, machineView);
  addView('IR Transition', 'Vertex', ID.trans,   transitionView);

  console.log('[ir-testbed] installed viewpoint "IR Test Bed": State vertex, Machine graphVertex, Transition object-as-edge. Pick it from the viewpoint selector; save to persist.');
})();

/* ---------------------------------------------------------------------------
 * OPTIONAL: cross-object reactivity smoke (discriminating vertex case)
 *
 * Point a node label at a feature of ANOTHER object, then edit that feature on
 * the target and check the observer label updates without touching the observer.
 *
 * Guaranteed by the metamodel (Machine contains States; State has isFinal):
 *   set machineView.shape.labels to
 *     [ { position: 'top', source: { from: 'path', expr: '$states.values[0].$isFinal.value' } } ]
 *   then toggle isFinal on the first contained State via the Properties panel
 *   and watch the Machine label flip true/false without selecting the Machine.
 *
 * Textbook plain-vertex variant (only if your State has a `machine` opposite ref):
 *   set stateView label source to
 *     { from: 'path', expr: '$machine.value.$<someAttr>.value' }
 *   then edit that attribute on the Machine and watch the State label update.
 *
 * Pre-fix: the observer label stays stale until you click/drag it.
 * Post-fix (current landed opzione-d): it updates in the same interaction.
 * --------------------------------------------------------------------------- */
