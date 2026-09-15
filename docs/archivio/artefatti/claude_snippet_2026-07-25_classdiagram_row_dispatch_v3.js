/**
 * classdiagram_row_dispatch_v3.js
 *
 * Console snippet: installa il viewpoint IR "Class Diagram IR v3" (id
 * Pointer_CD3_*) per il metamodello class diagram.
 *
 * v3: identico a v1/v2 nella sostanza; cambiano SOLO nome viewpoint, nomi view
 * e id. Motivo del v3: il CD2 e' rimasto persistito nel progetto ma orfano (c'e'
 * nell'idlookup, ma non compare nel viewpoint selector) e lo snippet v2 no-oppa
 * sul suo id. Id freschi (Pointer_CD3_*) bypassano no-op e stato sporco.
 *
 * Ricetta:
 *   1. Progetto class diagram aperto (M2 + M1 Person presenti).
 *   2. Incollare in console, invio.
 *   3. Selezionare "Class Diagram IR v3" dal viewpoint selector.
 *
 * Verifica visiva R3:
 *   - "IR Class v3": tab IR apribile SENZA corruzione; source 'children' filtro
 *     isKind Feature + HelpText; chiudi/riapri -> canvas INVARIATO.
 *   - "IR Attribute Row v3": pannello row [Attribute], template a 3 segmenti;
 *     literal ' : ' -> ' = ' riflesso live.
 *
 * Idempotente: id fissi Pointer_CD3_*.
 */
(function installClassDiagramIRv3() {
  'use strict';
  var w = window;
  var ww = (typeof windoww !== 'undefined') ? windoww : w;

  var store = w.store || ww.store;
  var RA = w.RuntimeAccessibleClass || ww.RuntimeAccessibleClass;
  var DViewPoint   = w.DViewPoint   || ww.DViewPoint   || (RA && RA.get && RA.get('DViewPoint'));
  var DViewElement = w.DViewElement || ww.DViewElement || (RA && RA.get && RA.get('DViewElement'));
  if (!store || !DViewPoint || !DViewElement) {
    console.error('[cd-ir-v3] handle runtime mancanti (store, DViewPoint, DViewElement su window/windoww). Aprire l\'app con il modello M1 caricato e riprovare.');
    return;
  }

  // ---- CONFIG: adattare qui se i nomi nel metamodello differiscono ----------
  var MC = {
    clazz:     'Class',      // la metaclasse dei nodi host
    feature:   'Feature',    // superclasse astratta (filtro del compartment)
    attribute: 'Attribute'   // sottotipo concreto (target della row view)
  };
  var FEAT = {
    name: 'name',            // ereditata da namedElement
    type: 'type'             // attributo enum di Attribute
  };

  // ---- id fissi (idempotenza) -- v3: Pointer_CD3_* --------------------------
  var ID = {
    vp:      'Pointer_CD3_Viewpoint',
    clazz:   'Pointer_CD3_View_Class',
    attrRow: 'Pointer_CD3_View_AttrRow'
  };

  var idl = (store.getState && store.getState().idlookup) || {};
  if (idl[ID.vp]) {
    console.log('[cd-ir-v3] gia\' installato (' + ID.vp + '). Selezionare "Class Diagram IR v3" dal viewpoint selector, o hard-refresh per reinstallare.');
    dumpCD();
    return;
  }

  // ---- jsxString: solo fallback classic; qualsiasi placeholder va bene ------
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

  // ---- Class: vertex, label = nome istanza, compartment children ------------
  var classView = {
    irVersion: V, kind: 'vertex', metaclasses: [MC.clazz],
    priority: 1, exclusive: true, label: 'Class (IR)',
    shape: {
      form: 'rect', fill: '#ffffff',
      border: { color: '#334155', width: 1, style: 'solid' },
      labels: [ { position: 'top', source: { from: 'intrinsic', prop: 'name' } } ]
    },
    fieldCompartments: [
      {
        id: 'attributes',
        source: { from: 'children', filter: { op: 'isKind', class: MC.feature } },
        rowFormat: { segments: [] },
        separator: true
      }
    ]
  };

  // ---- Attribute: row view, template "name : type" ---------------------------
  var attributeRowView = {
    irVersion: V, kind: 'row', metaclasses: [MC.attribute],
    priority: 1, label: 'Attribute (row)',
    template: [
      { from: 'path', expr: '$' + FEAT.name + '.value' },
      { from: 'literal', text: ' : ' },
      { from: 'path', expr: '$' + FEAT.type + '.value' }
      // enum non collassato? provare: { from: 'path', expr: '$' + FEAT.type + '.value.name' }
    ]
  };

  // ---- install ---------------------------------------------------------------
  var vp = DViewPoint.newVP('Class Diagram IR v3', undefined, true, ID.vp);

  function addView(name, viewId, ir) {
    DViewElement.new2(name, JSX, vp, function (d) {
      d.appliableToClasses = ['DObject'];
      d.appliableTo = 'Vertex';
      d.ir = ir;
    }, true, viewId);
  }

  addView('IR Class v3',         ID.clazz,   classView);
  addView('IR Attribute Row v3', ID.attrRow, attributeRowView);

  console.log('[cd-ir-v3] installato viewpoint "Class Diagram IR v3": Class vertex con compartment children + Attribute row view. Selezionarlo dal viewpoint selector; Save per persistere.');
  dumpCD();

  // ---- inventario diagnostico: tutti gli id Pointer_CD* nell'idlookup -------
  function dumpCD() {
    try {
      var st = (store.getState && store.getState().idlookup) || {};
      var mine = Object.keys(st).filter(function (k) { return k.indexOf('Pointer_CD') === 0; })
                       .map(function (k) { var o = st[k]; return k + '  ->  ' + (o && o.name ? o.name : '(no name)'); });
      console.log('[cd-ir-v3] id Pointer_CD* nell\'idlookup (' + mine.length + '):');
      mine.forEach(function (r) { console.log('   ' + r); });
    } catch (e) { console.warn('[cd-ir-v3] dump CD* fallito', e); }
  }
})();

/* ---------------------------------------------------------------------------
 * Sentinella anti-duplicazione metamodello (PRIMA della verifica):
 *   LProject.getProject().metamodels.map(function(m){ return m.id; })
 * 1 id = ok. 2 id = re-import: congelare (import non idempotente, won't-fix).
 * ---------------------------------------------------------------------------
 * Cleanup (task post-PASS): il CD2 orfano e il CD v1 corrotto vanno cancellati
 * dal progetto di test. Il v3 e' quello su cui si verifica R3.
 * --------------------------------------------------------------------------- */
