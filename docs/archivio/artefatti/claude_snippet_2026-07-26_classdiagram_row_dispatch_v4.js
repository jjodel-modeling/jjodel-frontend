/**
 * classdiagram_row_dispatch_v4.js
 *
 * Console snippet: installa il viewpoint IR "Class Diagram IR v4" (id
 * Pointer_CD4_*) per il metamodello class diagram.
 *
 * v4 = v3 + copertura di Enumeration/Literal.
 *
 * MOTIVO (root cause del sintomo "con il viewpoint IR esce solo Class"):
 * La palette M1 / lista delle root class e' filtrata alle metaclassi che hanno
 * una view *vertex* (o graphVertex) dichiarata nel viewpoint IR attivo,
 * intersecata con le metaclassi rootable (decisione 2026-07-18, spec v1.2 sez. 6:
 * "il filtro derivato e' un aiuto di focusing"). I viewpoint CD IR v1/v2/v3
 * dichiarano una vertex view SOLO per Class (la view di Attribute e' kind:'row',
 * non conta per la palette). Rootable = { Class, Enumeration }; intersezione con
 * le vertex dichiarate = { Class } -> NON vuota -> il filtro e' attivo ed
 * Enumeration sparisce dalla palette. Con "Default" / nessun viewpoint non c'e'
 * filtro IR, quindi compaiono sia Class sia Enumeration. Comportamento previsto,
 * non un bug del platform: manca la copertura di Enumeration nel viewpoint.
 *
 * FIX: dichiarare una vertex view per Enumeration (cosi' rientra nel set delle
 * vertex dichiarate -> intersezione { Class, Enumeration } -> entrambe in palette)
 * piu' una row view per Literal, simmetriche a Class/Attribute. Enumeration rende
 * i suoi ownedLiterals come righe nel compartment, esattamente come Class rende
 * gli ownedFeatures.
 *
 * Id freschi Pointer_CD4_* per bypassare no-op e stato sporco dei CD precedenti.
 *
 * Ricetta:
 *   1. Progetto class diagram aperto (M2 + M1 Person presenti).
 *   2. Incollare in console, invio.
 *   3. Selezionare "Class Diagram IR v4" dal viewpoint selector.
 *
 * Verifica visiva attesa:
 *   - Palette / root class: compaiono SIA Class SIA Enumeration.
 *   - "IR Class v4": Class vertex con compartment children (isKind Feature).
 *   - "IR Attribute Row v4": row [Attribute], template "name : type".
 *   - "IR Enumeration v4": Enumeration vertex con compartment children
 *     (isKind Literal).
 *   - "IR Literal Row v4": row [Literal], template = nome del literal.
 *   - Person: label "Person", righe "name : STRING" / "surname : STRING".
 *
 * Idempotente: id fissi Pointer_CD4_*.
 */
(function installClassDiagramIRv4() {
  'use strict';
  var w = window;
  var ww = (typeof windoww !== 'undefined') ? windoww : w;

  var store = w.store || ww.store;
  var RA = w.RuntimeAccessibleClass || ww.RuntimeAccessibleClass;
  var DViewPoint   = w.DViewPoint   || ww.DViewPoint   || (RA && RA.get && RA.get('DViewPoint'));
  var DViewElement = w.DViewElement || ww.DViewElement || (RA && RA.get && RA.get('DViewElement'));
  if (!store || !DViewPoint || !DViewElement) {
    console.error('[cd-ir-v4] handle runtime mancanti (store, DViewPoint, DViewElement su window/windoww). Aprire l\'app con il modello M1 caricato e riprovare.');
    return;
  }

  // ---- CONFIG: adattare qui se i nomi nel metamodello differiscono ----------
  var MC = {
    clazz:       'Class',       // metaclasse host dei nodi
    feature:     'Feature',     // superclasse astratta (filtro compartment attributi)
    attribute:   'Attribute',   // sottotipo concreto (target della row view attributi)
    enumeration: 'Enumeration', // NEW: root metaclass, oggi filtrata via dalla palette
    literal:     'Literal'      // NEW: child di Enumeration (ownedLiterals)
  };
  var FEAT = {
    name: 'name',            // ereditata da namedElement (Class, Attribute, Enumeration, Literal)
    type: 'type'             // attributo enum di Attribute
  };

  // ---- id fissi (idempotenza) -- v4: Pointer_CD4_* --------------------------
  var ID = {
    vp:      'Pointer_CD4_Viewpoint',
    clazz:   'Pointer_CD4_View_Class',
    attrRow: 'Pointer_CD4_View_AttrRow',
    enumv:   'Pointer_CD4_View_Enum',    // NEW
    litRow:  'Pointer_CD4_View_LitRow'   // NEW
  };

  var idl = (store.getState && store.getState().idlookup) || {};
  if (idl[ID.vp]) {
    console.log('[cd-ir-v4] gia\' installato (' + ID.vp + '). Selezionare "Class Diagram IR v4" dal viewpoint selector, o hard-refresh per reinstallare.');
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

  // ---- Enumeration: vertex, label = nome istanza, compartment children -------
  // NEW: simmetrica a classView. La sua sola presenza (kind:'vertex') rimette
  // Enumeration nella palette; il compartment rende gli ownedLiterals come righe.
  var enumView = {
    irVersion: V, kind: 'vertex', metaclasses: [MC.enumeration],
    priority: 1, exclusive: true, label: 'Enumeration (IR)',
    shape: {
      form: 'rect', fill: '#ffffff',
      border: { color: '#334155', width: 1, style: 'solid' },
      labels: [ { position: 'top', source: { from: 'intrinsic', prop: 'name' } } ]
    },
    fieldCompartments: [
      {
        id: 'literals',
        source: { from: 'children', filter: { op: 'isKind', class: MC.literal } },
        rowFormat: { segments: [] },
        separator: true
      }
    ]
  };

  // ---- Literal: row view, template = nome del literal ------------------------
  // NEW: simmetrica a attributeRowView, ma il Literal ha solo il nome.
  var literalRowView = {
    irVersion: V, kind: 'row', metaclasses: [MC.literal],
    priority: 1, label: 'Literal (row)',
    template: [
      { from: 'path', expr: '$' + FEAT.name + '.value' }
    ]
  };

  // ---- install ---------------------------------------------------------------
  var vp = DViewPoint.newVP('Class Diagram IR v4', undefined, true, ID.vp);

  function addView(name, viewId, ir) {
    DViewElement.new2(name, JSX, vp, function (d) {
      d.appliableToClasses = ['DObject'];
      d.appliableTo = 'Vertex';
      d.ir = ir;
    }, true, viewId);
  }

  addView('IR Class v4',         ID.clazz,   classView);
  addView('IR Attribute Row v4', ID.attrRow, attributeRowView);
  addView('IR Enumeration v4',   ID.enumv,   enumView);        // NEW
  addView('IR Literal Row v4',   ID.litRow,  literalRowView);  // NEW

  console.log('[cd-ir-v4] installato viewpoint "Class Diagram IR v4": Class + Enumeration vertex (compartment children), Attribute + Literal row. Selezionarlo dal viewpoint selector; Save per persistere.');
  dumpCD();

  // ---- inventario diagnostico: tutti gli id Pointer_CD* nell'idlookup -------
  function dumpCD() {
    try {
      var st = (store.getState && store.getState().idlookup) || {};
      var mine = Object.keys(st).filter(function (k) { return k.indexOf('Pointer_CD') === 0; })
                       .map(function (k) { var o = st[k]; return k + '  ->  ' + (o && o.name ? o.name : '(no name)'); });
      console.log('[cd-ir-v4] id Pointer_CD* nell\'idlookup (' + mine.length + '):');
      mine.forEach(function (r) { console.log('   ' + r); });
    } catch (e) { console.warn('[cd-ir-v4] dump CD* fallito', e); }
  }
})();

/* ---------------------------------------------------------------------------
 * Sentinella anti-duplicazione metamodello (PRIMA della verifica):
 *   LProject.getProject().metamodels.map(function(m){ return m.id; })
 * 1 id = ok. 2 id = re-import: congelare (import non idempotente, won't-fix).
 * ---------------------------------------------------------------------------
 * Cleanup (task post-PASS): i CD v1/v2/v3 orfani/corrotti vanno cancellati dal
 * progetto di test. Il v4 e' quello su cui si verifica la copertura Enumeration.
 * --------------------------------------------------------------------------- */
