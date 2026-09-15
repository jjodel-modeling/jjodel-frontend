/**
 * classdiagram_row_dispatch.js
 *
 * Console snippet: installa il viewpoint IR "Class Diagram IR" per il
 * metamodello class diagram (namedElement / Class / Feature / Attribute,
 * enum Type, composizione ownedFeatures).
 *
 * Serve alla verifica visiva della Fase R2 (dispatch polimorfico delle righe):
 *   - vertex view per Class: label = nome istanza, compartment "attributes"
 *     con source { from: 'children' } filtrata su Feature;
 *   - row view per Attribute: template "name : type".
 *
 * Stesso pattern e stessa install API del testbed sm
 * (snippet_2026-07-21_sm_ir_testbed_viewpoint.js), verificata sul branch:
 *   DViewPoint.newVP(name, undefined, true, id)
 *   DViewElement.new2(name, jsxString, vp, d => { ...; d.ir = <IR> }, true, id)
 *
 * Ricetta:
 *   1. Aprire il progetto col class diagram (M2 + M1 Person già presenti).
 *   2. Incollare tutto il file nella console del browser, invio.
 *   3. Selezionare "Class Diagram IR" dal viewpoint selector.
 *   4. (opzionale) Save per persistere.
 *
 * Attese (PASS della verifica R2):
 *   - Person: label "Person", righe "name : STRING" e "surname : STRING".
 *   - I nodi name/surname NON compaiono piu' sul canvas; niente edge penzolanti.
 *   - Edit di un Attribute da treeview/Properties -> riga aggiornata live.
 *   - Nuovo Attribute aggiunto a Person -> nuova riga, nessun nuovo nodo.
 *   - Testbed Machine/State (altro progetto) identico a prima.
 *
 * Idempotente: id fissi Pointer_CD_*; ri-eseguirlo e' un no-op fino a un
 * hard-refresh (che svuota la compile cache dell'interprete).
 */
(function installClassDiagramIR() {
  'use strict';
  var w = window;
  var ww = (typeof windoww !== 'undefined') ? windoww : w;

  var store = w.store || ww.store;
  var RA = w.RuntimeAccessibleClass || ww.RuntimeAccessibleClass;
  var DViewPoint   = w.DViewPoint   || ww.DViewPoint   || (RA && RA.get && RA.get('DViewPoint'));
  var DViewElement = w.DViewElement || ww.DViewElement || (RA && RA.get && RA.get('DViewElement'));
  if (!store || !DViewPoint || !DViewElement) {
    console.error('[cd-ir] handle runtime mancanti (store, DViewPoint, DViewElement su window/windoww). Aprire l\'app con il modello M1 caricato e riprovare.');
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

  // ---- id fissi (idempotenza) ------------------------------------------------
  var ID = {
    vp:      'Pointer_CD_Viewpoint',
    clazz:   'Pointer_CD_View_Class',
    attrRow: 'Pointer_CD_View_AttrRow'
  };

  var idl = (store.getState && store.getState().idlookup) || {};
  if (idl[ID.vp]) {
    console.log('[cd-ir] gia\' installato (' + ID.vp + '). Selezionare "Class Diagram IR" dal viewpoint selector, o hard-refresh per reinstallare.');
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
        // rowFormat ignorato per source 'children' (il formato viene dalla row
        // view del child); segments vuoto e' ammesso per questa sorgente.
        rowFormat: { segments: [] },
        separator: true
      }
    ]
  };

  // ---- Attribute: row view, template "name : type" ---------------------------
  // Cascata attesa: metaclasse esatta (Attribute). Un futuro sottotipo senza
  // row view propria cadrebbe prima su una eventuale row view di Feature, poi
  // sul default built-in (intrinsic name).
  var attributeRowView = {
    irVersion: V, kind: 'row', metaclasses: [MC.attribute],
    priority: 1, label: 'Attribute (row)',
    template: [
      { from: 'path', expr: '$' + FEAT.name + '.value' },
      { from: 'literal', text: ' : ' },
      { from: 'path', expr: '$' + FEAT.type + '.value' }
      // Se l'enum non collassa a stringa e la riga mostra un oggetto,
      // provare: { from: 'path', expr: '$' + FEAT.type + '.value.name' }
    ]
  };

  // ---- install ---------------------------------------------------------------
  var vp = DViewPoint.newVP('Class Diagram IR', undefined, true, ID.vp);

  function addView(name, viewId, ir) {
    DViewElement.new2(name, JSX, vp, function (d) {
      d.appliableToClasses = ['DObject'];
      d.appliableTo = 'Vertex'; // campo classic-fallback; l'IR risolve per ir.kind
      d.ir = ir;
    }, true, viewId);
  }

  addView('IR Class',         ID.clazz,   classView);
  addView('IR Attribute Row', ID.attrRow, attributeRowView);

  console.log('[cd-ir] installato viewpoint "Class Diagram IR": Class vertex con compartment children + Attribute row view. Selezionarlo dal viewpoint selector; Save per persistere.');
})();

/* ---------------------------------------------------------------------------
 * Sentinella anti-duplicazione metamodello (da eseguire PRIMA della verifica,
 * convenzione di progetto per il dogfooding):
 *
 *   LProject.getProject().metamodels.map(function(m){ return m.id; })
 *
 * 1 id = ok. 2 id = il metamodello e' stato re-importato: congelare e non
 * usare questo progetto per la verifica (import non idempotente, won't-fix).
 * ---------------------------------------------------------------------------
 * Smoke aggiuntivo del fallback (opzionale, dopo il PASS principale):
 * hard-refresh, ri-eseguire lo snippet SENZA la view "IR Attribute Row"
 * (commentare la riga addView corrispondente): le righe devono comparire
 * comunque, rese dal default built-in (solo il nome). E' la P1: il filtro
 * decide chi e' riga, il fallback garantisce che la riga non fallisca mai.
 * --------------------------------------------------------------------------- */
