// snippet_2026-07-26_edge_view_ir_e0.js  (rev.2)
// Seed di edge view IR per la verifica visiva di E0 (rendering IR-driven degli edge).
//
// ORDINE D'USO:
//   1. hard-refresh UNA volta per caricare la build E0
//   2. tieni ATTIVO sul canvas il viewpoint che vuoi testare (v3 o v4)
//   3. incolla questo snippet in console
//   4. NON fare hard-refresh dopo (seed in-sessione, un refresh lo azzera)
//
// rev.2: risolve il viewpoint per NOME (quello del tree) e usa una vista SMOKE con
// metaclasses:'*' senza reference -> stila OGNI reference-as-edge, quindi NON ti serve
// conoscere i nomi delle reference per la prima verifica. Forma EdgeViewIR verificata
// su irTypes.ts (@4273317f8).

// --- TODO UNICO: il nome del viewpoint ATTIVO sul canvas (dal tree) ---
const VP_NAME = 'Class Diagram IR v4';   // oppure 'Class Diagram IR v3'

const idl = store.getState().idlookup;
const entry = Object.entries(idl).find(
  ([id, o]) => o && o.name === VP_NAME && id.indexOf('Viewpoint') >= 0
);
if (!entry) throw new Error('Viewpoint non trovato per nome: ' + VP_NAME);
const VP_ID = entry[0];
const vp = entry[1];
console.log('[E0] viewpoint:', VP_NAME, '=', VP_ID);

const mkEdgeView = (name, ir) => DViewElement.new2(
  name, '', vp,
  d => { d.appliableToClasses = ['DObject']; d.appliableTo = 'Edge'; d.ir = ir; },
  true
);

// --- SMOKE (zero-config): stila TUTTI gli edge reference, qualunque metaclasse/reference ---
mkEdgeView('E0_smoke_all', {
  irVersion: 'ir-1.2', kind: 'edge',
  metaclasses: '*',
  edge: {
    line: { color: '#0ea5e9', width: 3, style: 'dashed' },
    terminations: { targetEnd: 'hollowTriangle' },
    labels: { center: { from: 'literal', text: 'E0' } },
  },
});
console.log('[E0] smoke edge view seedata. Se lo stile non appare, ri-seleziona il ' +
  'viewpoint nel selector per forzare il rebuild dell\'indice IR.');

// --- metaclasse sorgente reale, auto dalla Class view del viewpoint (per le viste rifinite) ---
const classView = idl[VP_ID.replace('_Viewpoint', '_View_Class')];
const SRC_METACLASS = classView && classView.ir && classView.ir.metaclasses && classView.ir.metaclasses[0];
console.log('[E0] metaclasse sorgente rilevata:', SRC_METACLASS);

// --- (OPZIONALE) viste per-reference: scommenta e metti i nomi reali quando li conosci ---
// mkEdgeView('E0_inheritance', {
//   irVersion: 'ir-1.2', kind: 'edge', metaclasses: [SRC_METACLASS], reference: '<REF_EREDITARIETA>',
//   edge: { line: { color: '#0ea5e9', width: 2, style: 'dashed' },
//           terminations: { targetEnd: 'hollowTriangle' },
//           labels: { center: { from: 'literal', text: 'extends' } } },
// });
// mkEdgeView('E0_association', {
//   irVersion: 'ir-1.2', kind: 'edge', metaclasses: [SRC_METACLASS], reference: '<REF_DOMINIO>',
//   edge: { line: { color: '#e11d48', width: 2, style: 'solid' },
//           terminations: { targetEnd: 'openArrow' },
//           labels: { center: { from: 'literal', text: '<REF_DOMINIO>' } } },
// });

// --- (OPZIONALE) object-as-edge: solo se una metaclasse reifica una relazione come oggetto ---
// mkEdgeView('E0_objectAsEdge', {
//   irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['<OAE_METACLASS>'],
//   edge: { source: '$src.value', target: '$tgt.value',
//           line: { color: '#334155', width: 2, style: 'solid' },
//           terminations: { targetEnd: 'filledDiamond' },
//           labels: { center: { from: 'intrinsic', prop: 'name' } } },
// });
