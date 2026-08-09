import { useState, useEffect, useMemo } from "react";

const REPO = "jjodel-modeling/jjodel-frontend";
const BRANCH = "alfonso-frontend-jjtl";
const STORE_KEY = "jjodel-trace-v15";
const SEED_ID = "p20260809n";
const APP_VERSION = "2026-08-09 · connettore GitHub Issues (seed " + SEED_ID + ")";

const SLATE = "#334155";
const CYAN = "#0ea5e9";
const INK = "#1e293b";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const BG = "#f8fafc";

const TYPES = {
  feature: { label: "Feature", color: CYAN, bg: "#e0f2fe" },
  bug: { label: "Bug", color: "#dc2626", bg: "#fee2e2" },
  debt: { label: "Debito", color: "#d97706", bg: "#fef3c7" },
};

const STATUSES = ["idea", "ratificata", "in coda", "in lavorazione", "chiusa"];
const STATUS_STYLE = {
  idea: { bg: "#f1f5f9", fg: MUTED },
  ratificata: { bg: "#ede9fe", fg: "#6d28d9" },
  "in coda": { bg: "#e0f2fe", fg: "#0369a1" },
  "in lavorazione": { bg: "#fef3c7", fg: "#b45309" },
  chiusa: { bg: "#dcfce7", fg: "#15803d" },
};
const PRIORITIES = ["alta", "media", "bassa"];

const FONT = "'Inter', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";

const label = {
  fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em",
  color: MUTED, fontWeight: 600, display: "block", marginBottom: 6,
};
const input = {
  width: "100%", boxSizing: "border-box", fontSize: 13, padding: "7px 10px",
  border: `1px solid ${LINE}`, borderRadius: 6, background: "#fff",
  color: INK, outline: "none", fontFamily: FONT,
};
const btn = {
  fontSize: 12.5, padding: "7px 13px", borderRadius: 6, cursor: "pointer",
  border: `1px solid ${LINE}`, background: "#fff", color: SLATE, fontWeight: 500,
  display: "inline-flex", alignItems: "center", gap: 7, lineHeight: "16px", fontFamily: FONT,
};
const btnPrimary = { ...btn, background: SLATE, borderColor: SLATE, color: "#fff" };
const panel = {
  background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10,
  padding: "14px 16px", marginBottom: 16, boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const parseCommitInput = (s) =>
  (s || "").split(/[\s,;]+/).map((h) => h.trim()).filter((h) => /^[0-9a-f]{7,40}$/i.test(h));

// Storage a tre livelli: window.storage (artefatto claude.ai) -> localStorage
// (webview desktop Cowork) -> memoria (fallback, dura quanto la pagina).
const memStore = {};
const store = {
  async get(k) {
    try {
      if (typeof window !== "undefined" && window.storage && window.storage.get) {
        const r = await window.storage.get(k);
        return r && r.value ? r.value : null;
      }
    } catch (e) { /* chiave assente o api non disponibile */ }
    try { const v = window.localStorage.getItem(k); if (v != null) return v; } catch (e) { /* storage bloccato */ }
    return memStore[k] != null ? memStore[k] : null;
  },
  async set(k, v) {
    try {
      if (typeof window !== "undefined" && window.storage && window.storage.set) {
        await window.storage.set(k, v); return;
      }
    } catch (e) { /* api non disponibile */ }
    try { window.localStorage.setItem(k, v); return; } catch (e) { /* storage bloccato */ }
    memStore[k] = v;
  },
};

// Icone inline (path lucide, 24x24 stroke): nessuna dipendenza esterna.
const Ic = ({ size = 14, style, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
    {children}
  </svg>
);
const IcPaste = (p) => <Ic {...p}><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></Ic>;
const IcFileDown = (p) => <Ic {...p}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></Ic>;
const IcSparkles = (p) => <Ic {...p}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /></Ic>;
const IcSliders = (p) => <Ic {...p}><line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" /><line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" /><line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" /><line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="16" x2="16" y1="18" y2="22" /></Ic>;
const IcPlus = (p) => <Ic {...p}><path d="M5 12h14" /><path d="M12 5v14" /></Ic>;
const IcList = (p) => <Ic {...p}><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></Ic>;
const IcNetwork = (p) => <Ic {...p}><rect x="16" y="16" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="9" y="2" width="6" height="6" rx="1" /><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" /><path d="M12 12V8" /></Ic>;
const IcBranch = (p) => <Ic {...p}><line x1="6" x2="6" y1="3" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></Ic>;
const IcSearch = (p) => <Ic {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Ic>;
const IcChevron = (p) => <Ic {...p}><path d="m6 9 6 6 6-6" /></Ic>;
const IcRefresh = (p) => <Ic {...p}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></Ic>;
const IcAlert = (p) => <Ic {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.73-2Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></Ic>;

const CONCERNS = [
  "concrete-syntax", "design-system", "properties-card", "sync-layer", "tooling",
  "process", "languages", "jjom-architecture", "language-editors", "jodie-console",
  "ai-integration", "documentation-site",
];

// Seed p20260809n: allineato al secondo giro del 2026-08-09 notte
// (R-B9-bis a verbale e rotazione log pushati, origin = 8704221de).
// Nessun meccanismo di patch: chiave di storage nuova a ogni reseed
// (precedente ratificato: v1 -> ... -> v10).
const SEED = [
  { id: "seed-father", type: "bug", title: "Voce 4 — doppio writer di father",
    desc: "Chiusa con D-4-1..D-4-9: cascata del viewpoint sul sottoalbero dentro set_father (modulo puro viewSubtree.ts, BFS su state.viewelements con visited set e snapshot pre-scrittura, 9 test), riga viewpoint read-only, Select 'Parent view' filtrato, azione 'Move to viewpoint' (10 test). Catena commit corretta in corsa: 0eb281ce7 è il fix di truthiness su indexOf nel calcolo peso di set_father; 1dd464162 riattribuito alla voce 5. Smoke cross-viewpoint 7/7 su localhost:3000 (incluso il discendente di secondo grado V3), chiusura con GO visivo a 8 punti. Residuo R-F4 = U-2.",
    status: "chiusa", priority: "alta", decision: "D-4-1..D-4-9", issue: "", prompt: "claude/2026-08-08_prompt_discovery_father_single_writer.md", commits: "0eb281ce7 f5c71d5db 65f18ceb1", concerns: ["concrete-syntax", "properties-card"], milestone: "Coda post-arco A (2026-08-06)", deps: [] },
  { id: "seed-smoke4", type: "debt", title: "Smoke punto 4 — cascata cross-viewpoint",
    desc: "PASSATO 7/7 il 2026-08-08 (localhost:3000): fixture V1>V2>V3, Move di V1 in B, le tre rendono in B, nessuna rende in A (V3 incluso: cascata verificata al secondo grado), Source con viewpoint riallineato e father invariato, nessun dirty spurio alla riapertura di Applies to. La voce 4 è chiusa anche a video. Verbale riportato nella entry di log (pattern 7de92c6cd).",
    status: "chiusa", priority: "alta", decision: "D-4-1..D-4-8", issue: "", prompt: "", commits: "", concerns: ["concrete-syntax", "sync-layer", "properties-card"], milestone: "Coda post-arco A (2026-08-06)", deps: ["seed-father"] },
  { id: "seed-voce3", type: "bug", title: "Voce 3 — routing persistito come stringa vuota",
    desc: "Chiusa. Colpevole unico: components/ui/Select/Select.tsx:91 antepone sempre un'opzione vuota; su un campo a vocabolario chiuso (R-B9: orthogonal|straight|curved) la stringa vuota finiva serializzata al primo commit del draft. Fix: drop della chiave su '' al commit, placeholder Manhattan (default). Smoke visivo passato, nessun secondo writer emerso. Il gemello corretto è forEndUser/Input.tsx:451 (opzione vuota disabled).",
    status: "chiusa", priority: "media", decision: "R-B9", issue: "", prompt: "claude/2026-08-08_prompt_voce3_routing_stringa_vuota.md", commits: "7450eb256 7de92c6cd", concerns: ["concrete-syntax", "design-system"], milestone: "Coda post-arco A (2026-08-06)", deps: [] },
  { id: "seed-irvalidate", type: "debt", title: "Regola routing in irValidate",
    desc: "Chiusa con 1cee0e252 (3 file: irValidate.ts, il suo test, entry di log). La regola vive in validateIR, chiamato dai soli quattro pannelli di authoring, mai dal path di render: innestarla in compileEdgeView avrebbe scartato in silenzio le view già persistite con routing '' che oggi rendono ortogonali (UnifiedEdge.tsx:142). Nasce VALID_ROUTING_VALUES esportata (vocabolario da tre copie a due; EdgeAuthoringPanel la importerà quando sarà lecito toccarlo). Quattro test verdi (assente/valido/vuoto/arbitrario); gate tutti verdi (build, tsc 33 baseline, vitest 58/58, check:docs 2/2). Principio da verbalizzare: R-B9-bis.",
    status: "chiusa", priority: "media", decision: "R-B9, R-B9-bis", issue: "", prompt: "", commits: "1cee0e252", concerns: ["concrete-syntax"], milestone: "Seguiti sessione 2026-08-08", deps: [] },
  { id: "seed-rb9bis", type: "debt", title: "R-B9-bis a verbale in decisions.md",
    desc: "CHIUSA E PUSHATA il 9/8 notte (secondo giro): 7ce6cdd90 mette R-B9-bis a verbale subito dopo R-B9, sezione Edge IR (+10 righe, zero cancellazioni: criterio authoring-time vs render-time, precedente compileEdgeView/validateIR); 8704221de ruota il log da 58 a 20 entry attive, 38 in coda all'archivio preesistente (da 673 a 711; totale conservato 731). check:docs 2/2 dopo ciascun commit; scope verificato su origin da clone shallow: solo i tre file docs attesi. Nuovo tip del branch: 8704221de.",
    status: "chiusa", priority: "media", decision: "R-B9-bis", issue: "", prompt: "claude/2026-08-09_prompt_rb9bis_rotazione_log.md", commits: "7ce6cdd90 8704221de", concerns: ["process"], milestone: "Consolidamento 2026-08-09", deps: ["seed-irvalidate"] },
  { id: "seed-igiene", type: "debt", title: "Voce 5 — grappolo igiene",
    desc: "TUTTI E TRE I PUNTI CHIUSI. Test duplicato: falso positivo (e23fb6439). Stringa B-5: chiusa (e5d238cd9). InfoTooltip: ESEGUITO IN LOCALE — Alfonso ha portato il git log del suo Mac il 9/8 tarda notte, 10 commit locali mai pushati, tra cui db6ca7155 (estrazione primitiva) + 9e8b07162 (restyle + title) + d8096803a (verbale smoke), esattamente D-5-1/D-5-2 come pianificato. Non è mai stato un incidente di deriva: era lavoro reale, solo non pushato — il 404 su origin era corretto per origin, non per l'esistenza del lavoro. Push eseguito il 9/8 notte (e5d238cd9..956392965): i tre commit InfoTooltip sono su origin.",
    status: "chiusa", priority: "media", decision: "nota 7 (2026-08-05), D-5-1, D-5-2", issue: "", prompt: "claude/2026-08-09_prompt_voce5_infotooltip_ui.md; claude/2026-08-09_prompt_voce5_infotooltip_emendamento_1_restyle.md", commits: "1dd464162 e23fb6439 e5d238cd9 db6ca7155 9e8b07162 d8096803a", concerns: ["concrete-syntax", "design-system", "properties-card"], milestone: "Coda post-arco A (2026-08-06)", deps: ["seed-infotooltip"] },
  { id: "seed-infotooltip", type: "debt", title: "InfoTooltip — primitiva condivisa in ui/",
    desc: "CHIUSA IN LOCALE il 9/8 tarda notte: db6ca7155 (extract shared InfoTooltip primitive from four duplicated copies) + 9e8b07162 (dark panel styling and optional title for InfoTooltip) + d8096803a (verbale smoke di entrambi i commit). Git log del Mac di Alfonso confermato: origin/alfonso-frontend-jjtl..HEAD mostra i tre commit tra i 10 non ancora pushati. D-5-1 e D-5-2 eseguite come ratificate. Push eseguito il 9/8 notte: i tre commit sono su origin, verificati singolarmente come antenati del branch remoto.",
    status: "chiusa", priority: "media", decision: "D-5-1, D-5-2", issue: "", prompt: "claude/2026-08-09_prompt_voce5_infotooltip_ui.md; claude/2026-08-09_prompt_voce5_infotooltip_emendamento_1_restyle.md; claude/2026-08-09_prompt_voce5_emendamento_2_push.md", commits: "db6ca7155 9e8b07162 d8096803a", concerns: ["design-system", "concrete-syntax"], milestone: "Consolidamento 2026-08-09", deps: [] },
  { id: "seed-select", type: "debt", title: "Micro-commit decisions.md — D-4-9 + nota Select",
    desc: "Registrata chiusa con e9e6d1ccd: riga D-4-9 (riconciliazione R-F di chat ≡ D-4-1..D-4-8, residuo = U-2) più nota Select in coda ad Arco A, con i path dei DUE Select omonimi: components/ui/Select/Select.tsx:91 (opzione vuota non disabilitata, il colpevole della voce 3) vs forEndUser/Input.tsx:451 (disabled, il pattern giusto). DIVERGENZA RISOLTA (9/8 sera): il ricontrollo esaustivo ha verificato e9e6d1ccd sulla pagina commit reale di GitHub, tra i dieci del push 40820fe21..e5d238cd9, con contenuto conforme (riga D-4-9 più nota Select). La voce resta chiusa; la riga di backlog 'nota Select non ancora scritta' era stale ed è stata rimossa dal contesto al consolidamento del 9/8 notte.",
    status: "chiusa", priority: "bassa", decision: "RC-4, D-4-9", issue: "", prompt: "claude/2026-08-08_prompt_microcommit_decisions_d49_select.md", commits: "e9e6d1ccd", concerns: ["design-system", "process"], milestone: "Seguiti sessione 2026-08-08", deps: [] },
  { id: "seed-ctx", type: "debt", title: "Consolidare contesto_progetto.md",
    desc: "RISOLTO il 9/8 notte: Alfonso ha portato il git log reale del suo Mac (origin/alfonso-frontend-jjtl..HEAD, 10 commit). Il gap segnalato nel giro precedente (report Fase 0 voce 6 assente da origin) era lavoro locale non pushato, non un buco di processo: e78afff00 lo contiene. Voce 5 e voce 6 sono COMPLETE in locale, mai eseguite in modo fasullo. Push eseguito il 9/8 notte. Lezione: la verifica su origin da sola non basta quando l'esecutore lavora in locale prima del push — va sempre chiesto anche un git log locale quando lo stato appare incoerente.",
    status: "chiusa", priority: "alta", decision: "", issue: "", prompt: "", commits: "", concerns: ["process"], milestone: "Seguiti sessione 2026-08-08", deps: [] },
  { id: "seed-branch", type: "debt", title: "Verifica ahead reale e push del ramo",
    desc: "DUE GIRI COMPLETATI. Primo: 40820fe21..e5d238cd9 (10 commit). Secondo (9/8 notte): push in due range, e5d238cd9..956392965 (i 10 commit di voce 5 e voce 6) più 956392965..3fdb4c14f (entry di log, solo docs/claude-code-log.md). Tip locale = tip remoto = 3fdb4c14f; origin..HEAD = 0; tutti e dieci gli hash verificati singolarmente come antenati di origin. Gate sul push: build ok, tsc 33 baseline, vitest 1122 passed (9 collection failures note), check:docs 2/2 rilanciato dopo l'entry di log. Residuo noto del working tree, fuori scope del push: 2 file CSS della serie U modificati più 2 path docs non tracciati, da sciogliere alla ripresa di Slice B2 + A3-bis.",
    status: "chiusa", priority: "alta", decision: "", issue: "", prompt: "", commits: "40820fe21 e5d238cd9 956392965 3fdb4c14f", concerns: ["process", "tooling"], milestone: "Consolidamento 2026-08-09", deps: [] },
  { id: "seed-parentviews", type: "bug", title: "Bug allPossibleParentViews (null-check)",
    desc: "view.tsx:446-447, null-check mancante: alimenta il Select 'Parent view' esposto dal terzo commit della voce 4 (65f18ceb1). Prima di aprire un fix, verificare su HEAD se sia già stato toccato durante quell'esecuzione (non confermato in chat).",
    status: "idea", priority: "alta", decision: "", issue: "", prompt: "", commits: "", concerns: ["concrete-syntax", "properties-card"], milestone: "Consolidamento 2026-08-09", deps: [] },
  { id: "seed-q4b", type: "debt", title: "Amendment q4b (sospensiva)",
    desc: "Rimandato al cruscotto per decisione di Alfonso (9/8 pomeriggio): resta a registro qui come voce da verificare in una prossima sessione; la voce 5 non lo aspetta. Dipendente da voce 4/q4, dettaglio della sospensiva ancora da consolidare.",
    status: "in coda", priority: "media", decision: "", issue: "", prompt: "", commits: "", concerns: ["concrete-syntax"], milestone: "Consolidamento 2026-08-09", deps: ["seed-father"] },
  { id: "seed-flatten", type: "debt", title: "Flattening di editors/viewpoint/",
    desc: "Debito cosmetico, deferred a quando quell'area viene toccata di nuovo per altri motivi.",
    status: "idea", priority: "bassa", decision: "", issue: "", prompt: "", commits: "", concerns: ["tooling"], milestone: "Consolidamento 2026-08-09", deps: [] },
  { id: "seed-ghsync", type: "feature", title: "Connettore GitHub Issues del cruscotto",
    desc: "Sync della tracciabilità con le issue di jjodel-frontend. Ratifiche del 9/8 sera: scritture eseguite in sessione Cowork con fine-grained PAT on-demand (mai persistito); scope = sole voci aperte e future (le chiuse storiche non generano issue retroattive); master = cruscotto (le modifiche manuali su GitHub sono drift: segnalate e sovrascritte alla sync successiva). Motore: claude/sync_issues_cruscotto.mjs nel knowledge base, idempotente via marker con id della voce nel body; label cruscotto/trace/prio/stato, milestone GitHub reali, report created/updated/closed/reopened/drift/orfane; dry-run di default. Nel cruscotto: bottone 'Sincronizza issue' read-only senza token (API pubblica del repo), che valida l'anello I e segnala il drift di stato voce/issue. I commit restano sul pannello git log: per le issue l'API è la fonte di verità, per i commit non pushati no. Prima sync reale da eseguire col PAT.",
    status: "in lavorazione", priority: "media", decision: "", issue: "", prompt: "", commits: "", concerns: ["tooling", "process"], milestone: "Consolidamento 2026-08-09", deps: [] },
  { id: "seed-commenti", type: "debt", title: "Pass sui commenti di codice in italiano",
    desc: "Nato da Voce 6/D9 e dichiarato fuori da R-4: 593 righe di commenti italiani in 99 file, volume 3,5 volte le stringhe UI, con file della critical zone dove il diff di commento è rumore puro. Se mai si farà, sarà una voce a sé con costo e rischio valutati separatamente.",
    status: "idea", priority: "bassa", decision: "D9", issue: "", prompt: "", commits: "", concerns: ["tooling", "process"], milestone: "Consolidamento 2026-08-09", deps: [] },
  { id: "seed-cruscotto-v3", type: "feature", title: "Cruscotto di tracciabilità in gallery Cowork",
    desc: "Attività Cowork del 9/8: cruscotto riallineato ai consolidamenti (seed p20260809b, poi p20260809c, poi p20260809i con la voce 6) e migrato ad artefatto persistente jjodel-tracciabilita nella sidebar del desktop, aggiornabile in place dalle sessioni Cowork; sorgente salvato in claude/tracciabilita-jjodel.jsx nel knowledge base. Design v2 confermato: seed incorporato senza patch (chiave storage nuova a ogni reseed, ora jjodel-trace-v10), sync GitHub sostituita dal pannello incolla git log. Ritocchi UI: voci chiuse verdi nel grafo, filtro stati a checkbox multi-selezione su lista e grafo, card con angoli arrotondati solo a destra, stato di completamento sulle milestone. La grafica dei suoi tooltip è il riferimento visivo della primitiva InfoTooltip dell'app (D-5-2).",
    status: "chiusa", priority: "bassa", decision: "", issue: "", prompt: "", commits: "", concerns: ["process", "tooling", "design-system"], milestone: "Consolidamento 2026-08-09", deps: [] },
  { id: "seed-u-b4", type: "feature", title: "Serie U — unificazione Properties (skin B4)",
    desc: "Fronte separato aperto l'8 agosto (rientro: sessione 'Mockup property card' del 2026-08-08). Slice A chiusa (ddfa53179, U-6, endpoint editing non distruttivo); Slice B chiusa con H-B falsificata: causa reale una collisione CSS zero-width in properties-with-tree-view.scss, non lo stato interno di NumberInput. Pendenti in ordine: Slice B2 + A3-bis (dopo il test Ordinal discriminante), Slice C (U-3+U-7), Slice D (breadcrumb via readViewParenting, ritiro portale). Fuori scope dichiarato: sezione NODE, allowConditional in Basic, Q-A2 dark mode, indipendenza Composition/Aggregation, gating Extends. Nel working tree del Mac restano 2 file CSS della serie U modificati non committati più 2 path docs non tracciati (rilevati al push del 9/8): da sciogliere come primo atto della ripresa.",
    status: "in lavorazione", priority: "media", decision: "U-1..U-8", issue: "", prompt: "", commits: "ddfa53179 4e9255462", concerns: ["properties-card", "design-system"], milestone: "Serie U / skin B4", deps: [] },
  { id: "seed-u2", type: "feature", title: "U-2 — breadcrumb viewpoint › parent › view",
    desc: "Residuo R-F4 della voce 4, sbloccato dalla sua chiusura: breadcrumb read-only in testa ad Applies to, sensata ora che viewpoint e parent sono distinguibili. Nel fronte U corrisponde alla Slice D pendente (breadcrumb via readViewParenting, ritiro portale). Discovery già scritta.",
    status: "in coda", priority: "media", decision: "R-F4 → U-2", issue: "", prompt: "", commits: "", concerns: ["properties-card", "concrete-syntax"], milestone: "Serie U / skin B4", deps: ["seed-smoke4"] },
  { id: "seed-r4", type: "debt", title: "Voce 6 — pass di lingua R-4",
    desc: "CHIUSA IN LOCALE il 9/8 tarda notte, confermata dal git log reale del Mac di Alfonso: e78afff00 (Fase 0, censimento) + a54f3b7c4/22b563638/a0bf4d1d2/970dfa761/2563b3a95 (i cinque commit di Fase 1, nell'ordine esatto del prompt) + 956392965 (verbale smoke dei cinque). Le nove ratifiche D1-D9 eseguite come decise. Push eseguito il 9/8 notte: tutti e sette i commit su origin.",
    status: "chiusa", priority: "media", decision: "R-4, D1..D9", issue: "", prompt: "claude/2026-08-09_prompt_voce6_langpass_r4_fase0_discovery.md; claude/2026-08-09_prompt_voce6_langpass_r4_fase1_traduzione.md", commits: "e78afff00 a54f3b7c4 22b563638 a0bf4d1d2 970dfa761 2563b3a95 956392965", concerns: ["concrete-syntax", "design-system", "properties-card"], milestone: "Coda post-arco A (2026-08-06)", deps: ["seed-r4c5"] },
  { id: "seed-r4c1", type: "debt", title: "R-4 Commit 1 — stringhe sparse",
    desc: "8 file, 21 stringhe. Eseguito in locale: a54f3b7c4 (refactor(i18n): translate scattered UI strings to English). Su origin dal 9/8 notte.",
    status: "chiusa", priority: "media", decision: "R-4", issue: "", prompt: "claude/2026-08-09_prompt_voce6_langpass_r4_fase1_traduzione.md", commits: "a54f3b7c4", concerns: ["design-system"], milestone: "Voce 6 — Fase 1 traduzione", deps: [] },
  { id: "seed-r4c2", type: "debt", title: "R-4 Commit 2 — TextStyle",
    desc: "2 file, 16 stringhe. Eseguito in locale: 22b563638 (refactor(i18n): translate TextStyle panel to English). Su origin dal 9/8 notte.",
    status: "chiusa", priority: "media", decision: "R-4", issue: "", prompt: "claude/2026-08-09_prompt_voce6_langpass_r4_fase1_traduzione.md", commits: "22b563638", concerns: ["design-system", "concrete-syntax"], milestone: "Voce 6 — Fase 1 traduzione", deps: ["seed-r4c1"] },
  { id: "seed-r4c3", type: "debt", title: "R-4 Commit 3 — PredicateBuilder",
    desc: "2 file, 26 stringhe, primitiva condivisa ui/. Eseguito in locale: a0bf4d1d2 (refactor(ui): translate PredicateBuilder to English). Su origin dal 9/8 notte.",
    status: "chiusa", priority: "media", decision: "R-4, D3", issue: "", prompt: "claude/2026-08-09_prompt_voce6_langpass_r4_fase1_traduzione.md", commits: "a0bf4d1d2", concerns: ["design-system", "language-editors"], milestone: "Voce 6 — Fase 1 traduzione", deps: ["seed-r4c2"] },
  { id: "seed-r4c4", type: "debt", title: "R-4 Commit 4 — Authoring IR",
    desc: "6 file, 86 stringhe, il più esposto. Eseguito in locale: 970dfa761 (refactor(i18n): translate IR authoring panels to English). Su origin dal 9/8 notte.",
    status: "chiusa", priority: "media", decision: "R-4, D1, D2", issue: "", prompt: "claude/2026-08-09_prompt_voce6_langpass_r4_fase1_traduzione.md", commits: "970dfa761", concerns: ["concrete-syntax", "properties-card"], milestone: "Voce 6 — Fase 1 traduzione", deps: ["seed-r4c3"] },
  { id: "seed-r4c5", type: "debt", title: "R-4 Commit 5 — Jodie",
    desc: "3 file: consolidamento più traduzione. Eseguito in locale: 2563b3a95 (refactor(content): consolidate and translate Jodie greeting to English), seguito da 956392965 (verbale smoke dei cinque commit). Su origin dal 9/8 notte.",
    status: "chiusa", priority: "media", decision: "R-4, D4", issue: "", prompt: "claude/2026-08-09_prompt_voce6_langpass_r4_fase1_traduzione.md", commits: "2563b3a95 956392965", concerns: ["jodie-console", "ai-integration"], milestone: "Voce 6 — Fase 1 traduzione", deps: ["seed-r4c4"] },
  { id: "seed-undo", type: "bug", title: "Undo dei valori di modello",
    desc: "useHistory fotografa React Flow: ripristina struttura e layout ma non i valori in Redux. Serve una discovery sul canale Redux. Congelato fuori archi, ma resta il bug aperto con la priorità più alta.",
    status: "idea", priority: "alta", decision: "", issue: "", prompt: "", commits: "", concerns: ["sync-layer"], milestone: "Fuori archi (congelati)", deps: [] },
  { id: "seed-ds", type: "feature", title: "Design system di piattaforma (DS-1..DS-10)",
    desc: "Fronte congelato, documento di rientro claude/2026-08-05_3_kickoff_prossima_sessione.md. DS-1..DS-10 ratificate; slice 0 (checkbox) chiusa con 3e99044d8.",
    status: "in coda", priority: "bassa", decision: "DS-1..DS-10", issue: "", prompt: "", commits: "3e99044d8", concerns: ["design-system"], milestone: "Fuori archi (congelati)", deps: [] },
];
const withDate = (s) => ({ ...s, createdAt: new Date().toISOString() });
const SEED_MILESTONES = ["Arco edge v2 (E-mark, E-lab, congelato)"];

export default function App() {
  const [items, setItems] = useState([]);
  const [issues, setIssues] = useState([]);
  const [commits, setCommits] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [issuesBusy, setIssuesBusy] = useState(false);
  const [issuesError, setIssuesError] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("feature");
  const [expanded, setExpanded] = useState(null);
  const [fType, setFType] = useState("tutti");
  const [fStatuses, setFStatuses] = useState([]);
  const [statusOpen, setStatusOpen] = useState(false);
  const [fText, setFText] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [fConcern, setFConcern] = useState("tutti");
  const [newConcern, setNewConcern] = useState("");
  const [concernList, setConcernList] = useState(CONCERNS);
  const [showManage, setShowManage] = useState(false);
  const [newTaxConcern, setNewTaxConcern] = useState("");
  const [editingConcern, setEditingConcern] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [confirmConcernDelete, setConfirmConcernDelete] = useState(null);
  const [viewMode, setViewMode] = useState("lista");
  const [fMilestone, setFMilestone] = useState("tutte");
  const [msList, setMsList] = useState([]);
  const [newTaxMs, setNewTaxMs] = useState("");
  const [editingMs, setEditingMs] = useState(null);
  const [editMsValue, setEditMsValue] = useState("");
  const [confirmMsDelete, setConfirmMsDelete] = useState(null);

  useEffect(() => {
    (async () => {
      let d = null;
      try {
        const raw = await store.get(STORE_KEY);
        if (raw) d = JSON.parse(raw);
      } catch (e) { /* chiave assente al primo avvio: normale */ }
      if (d) {
        const its = (d.items || []).map((i) => ({ ...i, concerns: i.concerns || [], milestone: i.milestone || "", deps: i.deps || [] }))
          .map((i) => {
            const s = SEED.find((x) => x.id === i.id);
            if (!s) return i;
            return {
              ...i,
              concerns: [...new Set([...(i.concerns || []), ...(s.concerns || [])])],
              milestone: i.milestone || s.milestone || "",
              deps: (i.deps || []).length ? i.deps : (s.deps || []),
            };
          });
        setItems(its);
        setIssues(d.issues || []);
        setCommits(d.commits || []);
        const cl = new Set(d.concernList || CONCERNS);
        its.forEach((i) => (i.concerns || []).forEach((c) => cl.add(c)));
        setConcernList([...cl]);
        const ml = new Set([...(d.milestoneList || []), ...SEED_MILESTONES]);
        its.forEach((i) => { if (i.milestone) ml.add(i.milestone); });
        setMsList([...ml]);
        setSavedAt(d.savedAt || null);
      } else {
        const seeded = SEED.map(withDate);
        setItems(seeded);
        const seedMs = [...new Set([...SEED.map((s) => s.milestone).filter(Boolean), ...SEED_MILESTONES])];
        setMsList(seedMs);
        const data = { items: seeded, issues: [], commits: [], concernList: CONCERNS, milestoneList: seedMs, seedId: SEED_ID, savedAt: new Date().toISOString() };
        setSavedAt(data.savedAt);
        try { await store.set(STORE_KEY, JSON.stringify(data)); } catch (e) { console.error("storage", e); }
      }
      setLoaded(true);
    })();
  }, []);

  const persist = async (over = {}) => {
    const data = {
      items: over.items ?? items,
      issues: over.issues ?? issues,
      commits: over.commits ?? commits,
      concernList: over.concernList ?? concernList,
      milestoneList: over.milestoneList ?? msList,
      seedId: SEED_ID,
      savedAt: new Date().toISOString(),
    };
    setSavedAt(data.savedAt);
    try { await store.set(STORE_KEY, JSON.stringify(data)); } catch (e) { console.error("storage", e); }
  };

  const updateItems = (next) => { setItems(next); persist({ items: next }); };

  const addSeedMissing = () => {
    const missing = SEED.filter((s) => !items.some((i) => i.id === s.id));
    let touched = false;
    const merged = items.map((i) => {
      const s = SEED.find((x) => x.id === i.id);
      if (!s) return i;
      const union = [...new Set([...(i.concerns || []), ...(s.concerns || [])])];
      const nMilestone = i.milestone || s.milestone || "";
      const nDeps = (i.deps || []).length ? i.deps : (s.deps || []);
      if (union.length === (i.concerns || []).length && nMilestone === (i.milestone || "") && nDeps === (i.deps || [])) return i;
      touched = true;
      return { ...i, concerns: union, milestone: nMilestone, deps: nDeps };
    });
    const nextItems = missing.length || touched ? [...missing.map(withDate), ...merged] : items;
    const seedMs = [...new Set([...SEED.map((s) => s.milestone).filter(Boolean), ...SEED_MILESTONES])];
    const msUnion = [...new Set([...msList, ...seedMs])];
    const msTouched = msUnion.length !== msList.length;
    if (missing.length || touched || msTouched) {
      setItems(nextItems);
      setMsList(msUnion);
      persist({ items: nextItems, milestoneList: msUnion });
    }
  };

  const addItem = () => {
    const t = newTitle.trim();
    if (!t) return;
    const it = {
      id: uid(), type: newType, title: t, desc: "", status: "idea",
      priority: "media", decision: "", issue: "", prompt: "", commits: "",
      concerns: [], milestone: "", deps: [], createdAt: new Date().toISOString(),
    };
    updateItems([it, ...items]);
    setNewTitle("");
    setExpanded(it.id);
  };

  const patch = (id, delta) =>
    updateItems(items.map((it) => (it.id === id ? { ...it, ...delta } : it)));
  const remove = (id) => updateItems(items.filter((it) => it.id !== id));

  // Lettura issue senza token: il repo è pubblico e per le issue l'API è la
  // fonte di verità (a differenza dei commit non pushati). Solo GET, mai scritture:
  // quelle passano dalla sessione Cowork col PAT (master: cruscotto).
  const loadIssues = async () => {
    setIssuesBusy(true); setIssuesError("");
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/issues?state=all&labels=cruscotto&per_page=100`,
        { headers: { Accept: "application/vnd.github+json" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const ni = j.filter((x) => !x.pull_request).map((x) => ({
        number: x.number, title: x.title, state: x.state, url: x.html_url,
      }));
      setIssues(ni); persist({ issues: ni });
    } catch (e) {
      setIssuesError("Fetch verso api.github.com non riuscita (sandbox o rete). Riprova dalla sidebar Cowork; restano valide le issue in cache.");
    }
    setIssuesBusy(false);
  };

  const applyPaste = () => {
    const nc = pasteText.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const m = l.match(/^([0-9a-f]{7,40})\s+(.*)$/i);
      return m ? { sha: m[1], msg: m[2] } : null;
    }).filter(Boolean);
    if (nc.length) { setCommits(nc); persist({ commits: nc }); setShowPaste(false); }
  };

  const findCommit = (hash) =>
    commits.find((c) => c.sha.toLowerCase().startsWith(hash.toLowerCase()));
  const findIssue = (num) => issues.find((i) => String(i.number) === String(num));

  const normC = (s) => s.trim().toLowerCase().replace(/\s+/g, "-");

  const allConcerns = useMemo(() => {
    const used = new Set(concernList);
    items.forEach((it) => (it.concerns || []).forEach((c) => used.add(c)));
    return [...used].sort();
  }, [items, concernList]);

  const concernUsage = (c) => items.filter((i) => (i.concerns || []).includes(c)).length;

  const toggleConcern = (id, c) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    const cur = it.concerns || [];
    patch(id, { concerns: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] });
  };

  const addCustomConcern = (id) => {
    const c = normC(newConcern);
    if (!c) return;
    const it = items.find((i) => i.id === id);
    const nextList = concernList.includes(c) ? concernList : [...concernList, c];
    const nextItems = it && !(it.concerns || []).includes(c)
      ? items.map((i) => (i.id === id ? { ...i, concerns: [...(i.concerns || []), c] } : i))
      : items;
    setConcernList(nextList); setItems(nextItems);
    persist({ concernList: nextList, items: nextItems });
    setNewConcern("");
  };

  const addTaxConcern = () => {
    const c = normC(newTaxConcern);
    if (!c || concernList.includes(c)) { setNewTaxConcern(""); return; }
    const nextList = [...concernList, c];
    setConcernList(nextList); persist({ concernList: nextList });
    setNewTaxConcern("");
  };

  const renameConcern = (oldC) => {
    const c = normC(editValue);
    if (!c || c === oldC) { setEditingConcern(null); return; }
    const nextList = [...new Set(concernList.map((x) => (x === oldC ? c : x)))];
    const nextItems = items.map((i) => ({
      ...i, concerns: [...new Set((i.concerns || []).map((x) => (x === oldC ? c : x)))],
    }));
    setConcernList(nextList); setItems(nextItems);
    persist({ concernList: nextList, items: nextItems });
    if (fConcern === oldC) setFConcern(c);
    setEditingConcern(null);
  };

  const deleteConcern = (c) => {
    const nextList = concernList.filter((x) => x !== c);
    const nextItems = items.map((i) => ({
      ...i, concerns: (i.concerns || []).filter((x) => x !== c),
    }));
    setConcernList(nextList); setItems(nextItems);
    persist({ concernList: nextList, items: nextItems });
    if (fConcern === c) setFConcern("tutti");
    setConfirmConcernDelete(null);
  };

  const allMilestones = useMemo(() => {
    const s = new Set(msList);
    items.forEach((i) => { if (i.milestone) s.add(i.milestone); });
    return [...s].sort();
  }, [items, msList]);

  const msUsage = (m) => items.filter((i) => i.milestone === m).length;

  const addTaxMs = () => {
    const m = newTaxMs.trim();
    if (!m || allMilestones.includes(m)) { setNewTaxMs(""); return; }
    const next = [...msList, m];
    setMsList(next); persist({ milestoneList: next });
    setNewTaxMs("");
  };

  const renameMs = (oldM) => {
    const m = editMsValue.trim();
    if (!m || m === oldM) { setEditingMs(null); return; }
    const nextList = [...new Set(msList.map((x) => (x === oldM ? m : x)).concat(m))];
    const nextItems = items.map((i) => (i.milestone === oldM ? { ...i, milestone: m } : i));
    setMsList(nextList); setItems(nextItems);
    persist({ milestoneList: nextList, items: nextItems });
    if (fMilestone === oldM) setFMilestone(m);
    setEditingMs(null);
  };

  const deleteMs = (m) => {
    const nextList = msList.filter((x) => x !== m);
    const nextItems = items.map((i) => (i.milestone === m ? { ...i, milestone: "" } : i));
    setMsList(nextList); setItems(nextItems);
    persist({ milestoneList: nextList, items: nextItems });
    if (fMilestone === m) setFMilestone("tutte");
    setConfirmMsDelete(null);
  };

  const isRunnable = (it) =>
    it.status !== "chiusa" &&
    (it.deps || []).every((d) => {
      const t = items.find((x) => x.id === d);
      return !t || t.status === "chiusa";
    });

  const filtered = useMemo(() => {
    const q = fText.trim().toLowerCase();
    return items.filter((it) => {
      if (fType !== "tutti" && it.type !== fType) return false;
      if (fStatuses.length && !fStatuses.includes(it.status)) return false;
      if (fConcern !== "tutti" && !(it.concerns || []).includes(fConcern)) return false;
      if (fMilestone !== "tutte" && (it.milestone || "") !== (fMilestone === "(nessuna)" ? "" : fMilestone)) return false;
      if (q && !(it.title + " " + it.desc + " " + it.decision + " " + (it.milestone || "") + " " + (it.concerns || []).join(" ")).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, fType, fStatuses, fConcern, fMilestone, fText]);

  const GraphView = () => {
    const NW = 150, NH = 42, GXi = 20, GYi = 46, GROUP_GAP = 44;
    const ROOT_W = 200, ROOT_H = 36, MS_H = 32, MS_Y = 86, ITEMS_TOP = 164;

    const order = [...allMilestones, ""];
    const rawGroups = order
      .map((m) => ({ name: m || "Senza milestone", items: filtered.filter((i) => (i.milestone || "") === m) }))
      .filter((g) => g.items.length > 0);

    if (rawGroups.length === 0)
      return <div style={{ textAlign: "center", padding: "40px 0", color: MUTED, fontSize: 13 }}>Nessuna voce con i filtri correnti.</div>;

    const layersFor = (group) => {
      const byId = Object.fromEntries(group.map((i) => [i.id, i]));
      const memo = {};
      const depth = (id, seen) => {
        if (memo[id] !== undefined) return memo[id];
        if (seen.has(id)) return 0;
        seen.add(id);
        const ds = (byId[id].deps || []).filter((d) => byId[d]);
        memo[id] = ds.length ? 1 + Math.max(...ds.map((d) => depth(d, seen))) : 0;
        return memo[id];
      };
      group.forEach((i) => depth(i.id, new Set()));
      const layers = [];
      group.forEach((i) => { (layers[memo[i.id]] = layers[memo[i.id]] || []).push(i); });
      return layers;
    };

    const pos = {};
    const msNodes = [];
    let gx = 12, maxLayers = 1;
    for (const g of rawGroups) {
      const layers = layersFor(g.items);
      maxLayers = Math.max(maxLayers, layers.length);
      const groupW = Math.max(Math.max(...layers.map((L) => L.length)) * (NW + GXi), 220);
      layers.forEach((L, li) => {
        const rowW = L.length * (NW + GXi);
        L.forEach((it, ci) => {
          pos[it.id] = {
            x: gx + (groupW - rowW) / 2 + ci * (NW + GXi) + GXi / 2,
            y: ITEMS_TOP + li * (NH + GYi),
            group: g.name,
          };
        });
      });
      msNodes.push({
        name: g.name, cx: gx + groupW / 2,
        roots: layers[0] || [],
        done: g.items.filter((i) => i.status === "chiusa").length,
        tot: g.items.length,
      });
      gx += groupW + GROUP_GAP;
    }
    const totalW = Math.max(gx - GROUP_GAP + 12, 360);
    const totalH = ITEMS_TOP + (maxLayers - 1) * (NH + GYi) + NH + 16;
    const rootCx = totalW / 2;
    const allDrawn = filtered.filter((i) => pos[i.id]);

    const curve = (x1, y1, x2, y2) =>
      `M ${x1} ${y1} C ${x1} ${y1 + 24}, ${x2} ${y2 - 24}, ${x2} ${y2}`;
    const arrow = (x, y, color) =>
      <path d={`M ${x - 4} ${y - 6} L ${x} ${y} L ${x + 4} ${y - 6}`} fill="none" stroke={color} strokeWidth="1.5" />;

    return (
      <div>
        <div style={{ overflowX: "auto", background: "#fff", border: `1px solid ${LINE}`, borderRadius: 8 }}>
          <svg width={totalW} height={totalH} style={{ display: "block" }}>
            {msNodes.map((m) => (
              <g key={"re-" + m.name}>
                <path d={curve(rootCx, 10 + ROOT_H, m.cx, MS_Y)} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                {arrow(m.cx, MS_Y, "#cbd5e1")}
              </g>
            ))}
            {msNodes.map((m) =>
              m.roots.map((it) => (
                <g key={"me-" + it.id}>
                  <path d={curve(m.cx, MS_Y + MS_H, pos[it.id].x + NW / 2, pos[it.id].y)}
                    fill="none" stroke="#c4b5fd" strokeWidth="1.5" />
                  {arrow(pos[it.id].x + NW / 2, pos[it.id].y, "#c4b5fd")}
                </g>
              ))
            )}
            {allDrawn.flatMap((it) =>
              (it.deps || []).filter((d) => pos[d]).map((d) => {
                const cross = pos[d].group !== pos[it.id].group;
                const x1 = pos[d].x + NW / 2, y1 = pos[d].y + NH;
                const x2 = pos[it.id].x + NW / 2, y2 = pos[it.id].y;
                return (
                  <g key={"de-" + d + "-" + it.id}>
                    <path d={curve(x1, y1, x2, y2)} fill="none" stroke="#64748b"
                      strokeWidth="1.5" strokeDasharray={cross ? "5 4" : "none"} />
                    {arrow(x2, y2, "#64748b")}
                  </g>
                );
              })
            )}

            <g style={{ cursor: "pointer" }} onClick={() => setFMilestone("tutte")}>
              <rect x={rootCx - ROOT_W / 2} y="10" width={ROOT_W} height={ROOT_H} rx={ROOT_H / 2} fill={SLATE} />
              <text x={rootCx} y={10 + ROOT_H / 2 + 4} fontSize="12" fontWeight="600" fill="#fff" textAnchor="middle">
                Jjodel — tracciabilità
              </text>
            </g>

            {msNodes.map((m) => {
              const complete = m.tot > 0 && m.done === m.tot;
              const pct = m.tot ? Math.round((m.done / m.tot) * 100) : 0;
              const nm = m.name.length > 26 ? m.name.slice(0, 25) + "…" : m.name;
              const txt = complete ? `◆ ${nm} ✓ ${m.done}/${m.tot}` : `◆ ${nm} · ${m.done}/${m.tot} · ${pct}%`;
              const w = Math.min(Math.max(txt.length * 6.2 + 26, 130), 300);
              return (
                <g key={"ms-" + m.name} style={{ cursor: "pointer" }}
                  onClick={() => setFMilestone(fMilestone === m.name ? "tutte" : m.name === "Senza milestone" ? "(nessuna)" : m.name)}>
                  <rect x={m.cx - w / 2} y={MS_Y} width={w} height={MS_H} rx={MS_H / 2}
                    fill={complete ? "#dcfce7" : "#ede9fe"} stroke={complete ? "#16a34a" : "#6d28d9"} strokeWidth="1" />
                  <text x={m.cx} y={MS_Y + MS_H / 2 + 4} fontSize="11" fontWeight="600" fill={complete ? "#15803d" : "#6d28d9"} textAnchor="middle">
                    {txt}
                  </text>
                </g>
              );
            })}

            {allDrawn.map((it) => {
              const p = pos[it.id];
              const T = TYPES[it.type];
              const ready = isRunnable(it);
              const closed = it.status === "chiusa";
              const title = it.title.length > 23 ? it.title.slice(0, 22) + "…" : it.title;
              return (
                <g key={it.id} transform={`translate(${p.x},${p.y})`} opacity={closed ? 0.5 : 1}
                  style={{ cursor: "pointer" }}
                  onClick={() => { setViewMode("lista"); setExpanded(it.id); setConfirmDelete(null); }}>
                  {ready && !closed &&
                    <rect x="-3" y="-3" width={NW + 6} height={NH + 6} rx="13" fill="none" stroke="#16a34a" strokeWidth="1.5" />}
                  <rect width={NW} height={NH} rx="10" fill={closed ? "#dcfce7" : T.bg} stroke={closed ? "#16a34a" : T.color} strokeWidth="1" />
                  <text x={NW / 2} y="17" fontSize="10.5" fontWeight="600" fill={INK} textAnchor="middle">{title}</text>
                  <text x={NW / 2} y="32" fontSize="9.5" fill={closed ? "#15803d" : ready ? "#16a34a" : MUTED} textAnchor="middle">
                    {closed ? "chiusa ✓" : ready ? "eseguibile" : "bloccata"}{it.priority === "alta" && !closed ? " · alta" : ""}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, margin: "6px 0 0" }}>
          Dalla radice alle foglie: milestone (◆) e poi attività in livelli di dipendenza. Frecce grigie piene = dipendenze;
          tratteggiate = dipendenze tra milestone diverse. Nodi sulla stessa riga di una milestone sono parallelizzabili;
          anello verde = eseguibile ora (dipendenze tutte chiuse); sfondo verde = voce chiusa. Il parallelismo reale resta soggetto a RC-5: perimetri di file
          disgiunti dichiarati in apertura. Click su un nodo apre la voce; click su una milestone filtra.
        </p>
      </div>
    );
  };

  const listGroups = useMemo(() => {
    const order = [...allMilestones, ""];
    const prio = { alta: 0, media: 1, bassa: 2 };
    return order.map((m) => {
      const g = filtered.filter((i) => (i.milestone || "") === m);
      const byId = Object.fromEntries(g.map((i) => [i.id, i]));
      const memo = {};
      const depth = (id, seen) => {
        if (memo[id] !== undefined) return memo[id];
        if (seen.has(id)) return 0;
        seen.add(id);
        const ds = (byId[id].deps || []).filter((x) => byId[x]);
        memo[id] = ds.length ? 1 + Math.max(...ds.map((x) => depth(x, seen))) : 0;
        return memo[id];
      };
      g.forEach((i) => depth(i.id, new Set()));
      const rank = (i) => (i.status === "chiusa" ? 0 : isRunnable(i) ? 1 : 2);
      const sorted = [...g].sort((a, b) =>
        memo[a.id] - memo[b.id] || rank(a) - rank(b) || (prio[a.priority] ?? 1) - (prio[b.priority] ?? 1)
      );
      return [m || "Senza milestone", sorted];
    }).filter(([, g]) => g.length > 0);
  }, [filtered, allMilestones, items]);

  const exportMd = useMemo(() => {
    const lines = [
      "# Tracciabilità requisiti — Jjodel", "",
      `Esportato il ${new Date().toISOString().slice(0, 10)} dal cruscotto di tracciabilità (seed ${SEED_ID}). ` +
      `Registro operativo: le decisioni vincolanti restano in docs/decisions.md (RC-4).`, "",
    ];
    for (const it of items) {
      const hashes = parseCommitInput(it.commits);
      lines.push(`## [${TYPES[it.type].label}] ${it.title}`);
      lines.push("");
      lines.push(`- Stato: ${it.status} · Priorità: ${it.priority}`);
      if (it.milestone) lines.push(`- Milestone: ${it.milestone}`);
      if ((it.deps || []).length) {
        const names = it.deps.map((d) => items.find((x) => x.id === d)?.title || d);
        lines.push(`- Dipende da: ${names.join("; ")}`);
      }
      if ((it.concerns || []).length) lines.push(`- Concern: ${it.concerns.join(", ")}`);
      if (it.desc) lines.push(`- Descrizione: ${it.desc}`);
      if (it.decision) lines.push(`- Decisioni: ${it.decision}`);
      if (it.issue) {
        const gi = findIssue(it.issue);
        lines.push(`- Issue: #${it.issue}${gi ? ` (${gi.state}) ${gi.url}` : ""}`);
      }
      if (it.prompt) lines.push(`- Prompt: ${it.prompt}`);
      if (hashes.length) {
        lines.push(`- Commit: ${hashes.map((h) => {
          const c = findCommit(h);
          return c ? `\`${h}\` (${c.msg})` : `\`${h}\` (non verificato nel log caricato)`;
        }).join("; ")}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }, [items, commits, issues]);

  const [tip, setTip] = useState(null);

  const Chain = ({ it }) => {
    const hashes = parseCommitInput(it.commits);
    const nOk = hashes.filter((h) => findCommit(h)).length;
    const verified = hashes.length > 0 && nOk === hashes.length;
    const gi = it.issue ? findIssue(it.issue) : null;
    const steps = [
      { k: "R", full: "Requisito", on: true,
        detail: "L'esigenza com'è dichiarata nella voce: titolo e descrizione." },
      { k: "D", full: "Decisione", on: !!it.decision.trim(),
        detail: it.decision.trim()
          ? `Ratifiche collegate: ${it.decision}. Il registro canonico è docs/decisions.md.`
          : "Nessun id di ratifica collegato. La scelta di design in chat precede il codice." },
      { k: "I", full: "Issue", on: !!String(it.issue).trim(),
        warn: !!String(it.issue).trim() && issues.length > 0 && (!gi || (it.status === "chiusa") !== (gi.state === "closed")),
        detail: gi
          ? `#${gi.number} (${gi.state}) su GitHub: ${gi.title.slice(0, 60)}${(it.status === "chiusa") !== (gi.state === "closed") ? " — DRIFT: stato dell'issue diverso dalla voce (master: cruscotto, si riallinea alla prossima sync)." : ""}`
          : String(it.issue).trim()
            ? issues.length
              ? `#${it.issue} dichiarata ma non trovata tra le issue sincronizzate (label cruscotto).`
              : `#${it.issue} dichiarata; premi 'Sincronizza issue' per verificarla.`
            : "Nessuna issue GitHub collegata. Si aggancia con la sync Cowork o a mano col numero." },
      { k: "P", full: "Prompt", on: !!it.prompt.trim(),
        detail: it.prompt.trim()
          ? `Documento di delega a Claude Code: ${it.prompt}`
          : "Nessun documento prompt collegato. È l'atto di delega dalla chat all'esecutore." },
      { k: "C", full: "Commit", on: hashes.length > 0,
        warn: hashes.length > 0 && commits.length > 0 && !verified,
        detail: hashes.length
          ? commits.length
            ? `${nOk} su ${hashes.length} hash verificat${hashes.length === 1 ? "o" : "i"} nel log incollato. La verifica è dal log, non dalla memoria (lezione 8).`
            : `${hashes.length} hash dichiarat${hashes.length === 1 ? "o" : "i"}; incolla il git log per verificarli.`
          : "Nessun commit collegato: il lavoro non è ancora atterrato nel repo." },
    ];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {steps.map((s, i) => {
          const key = it.id + ":" + s.k;
          const state = s.warn ? "da verificare" : s.on ? "coperto" : "mancante";
          return (
            <div key={s.k} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div style={{ width: 14, height: 1.5, background: s.on && steps[i - 1].on ? CYAN : LINE }} />}
              <div style={{ position: "relative" }}
                onMouseEnter={() => setTip(key)}
                onMouseLeave={() => setTip((t) => (t === key ? null : t))}
                onClick={(e) => { e.stopPropagation(); setTip((t) => (t === key ? null : key)); }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "help",
                  background: s.on ? (s.warn ? "#fef3c7" : "#e0f2fe") : "#fff",
                  color: s.on ? (s.warn ? "#b45309" : "#0369a1") : "#cbd5e1",
                  border: `1.5px solid ${s.on ? (s.warn ? "#f59e0b" : CYAN) : LINE}`,
                }}>{s.k}</div>
                {tip === key && (
                  <div style={{
                    position: "absolute", bottom: "calc(100% + 8px)", right: -10, width: 230,
                    background: SLATE, color: "#f1f5f9", borderRadius: 8, padding: "8px 10px",
                    fontSize: 11, lineHeight: 1.5, zIndex: 20, cursor: "default",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.25)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 11 }}>{s.k} — {s.full}</span>
                      <span style={{ fontSize: 10, color: s.warn ? "#fbbf24" : s.on ? "#7dd3fc" : "#94a3b8" }}>{state}</span>
                    </div>
                    <div style={{ color: "#cbd5e1" }}>{s.detail}</div>
                    <div style={{
                      position: "absolute", top: "100%", right: 14, width: 0, height: 0,
                      borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
                      borderTop: `6px solid ${SLATE}`,
                    }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!loaded) return (
    <div style={{ fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 10, color: MUTED, fontSize: 13 }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: CYAN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>Jj</div>
      Carico il taccuino…
    </div>
  );

  const nOpen = items.filter((i) => i.status !== "chiusa").length;

  return (
    <div className="tjx" style={{ fontFamily: FONT, background: BG, minHeight: "100vh", color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes tjspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .tjx button { transition: filter .12s ease, background .12s ease, border-color .12s ease; }
        .tjx button:hover { filter: brightness(0.96); }
        .tjx button:active { transform: translateY(0.5px); }
        .tjx button:disabled { opacity: .55; cursor: default; }
        .tjx input:focus, .tjx select:focus, .tjx textarea:focus {
          border-color: ${SLATE}; box-shadow: 0 0 0 3px rgba(51,65,85,0.12);
        }
        .tjx ::selection { background: #bae6fd; }
        .tjx .tj-card { transition: box-shadow .15s ease, border-color .15s ease; }
        .tjx .tj-card:hover { box-shadow: 0 4px 14px rgba(15,23,42,0.07); border-color: #cbd5e1; }
        .tjx .tj-tl { position: relative; }
        .tjx .tj-tl::before { content: ''; position: absolute; left: 9px; top: 12px; bottom: 12px; width: 2px; background: ${LINE}; border-radius: 1px; }
        .tjx * { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
      `}</style>

      <div style={{ background: SLATE, color: "#f1f5f9" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "18px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: CYAN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, letterSpacing: "-0.5px", flexShrink: 0 }}>
            Jj
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>Tracciabilità Jjodel</div>
            <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>
              Requisiti → Decisioni → Issue → Prompt → Commit · taccuino operativo (RC-4: il registro vive nel repo)
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontFamily: MONO, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", padding: "5px 10px", borderRadius: 6, color: "#cbd5e1" }}>
              <IcBranch size={13} /> {BRANCH}
            </span>
            {savedAt && (
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                salvato {new Date(savedAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px 64px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 18 }}>
          {[
            { v: items.length, l: "voci totali" },
            { v: nOpen, l: "aperte", c: nOpen > 0 ? "#b45309" : "#15803d" },
            { v: items.filter((i) => isRunnable(i)).length, l: "eseguibili ora", c: "#15803d" },
            { v: items.length - nOpen, l: "chiuse", c: "#15803d" },
            { v: commits.length, l: "commit in cache" },
            { v: issues.length, l: "issue in cache" },
          ].map((s) => (
            <div key={s.l} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: s.c || INK, fontFamily: MONO, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.07em", color: MUTED, fontWeight: 600, marginTop: 5 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <button style={btnPrimary} onClick={() => setShowPaste(!showPaste)}><IcPaste size={14} /> Incolla git log</button>
          <button style={btn} disabled={issuesBusy} onClick={loadIssues} title={`Lettura senza token delle issue con label cruscotto da ${REPO}`}>
            <IcRefresh size={14} style={issuesBusy ? { animation: "tjspin 1s linear infinite" } : undefined} />
            {issuesBusy ? "Sincronizzo…" : "Sincronizza issue"}
          </button>
          <button style={btn} onClick={() => setShowExport(!showExport)}><IcFileDown size={14} /> Esporta markdown</button>
          <button style={btn} onClick={addSeedMissing} title="Reintegra voci, concern e milestone proposti dalla chat"><IcSparkles size={14} /> Voci proposte</button>
          <button style={btn} onClick={() => { setShowManage(!showManage); setEditingConcern(null); setConfirmConcernDelete(null); setEditingMs(null); setConfirmMsDelete(null); }}>
            <IcSliders size={14} /> Concern e milestone
          </button>
        </div>

        {issuesError && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12.5, color: "#92400e", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", marginBottom: 14, lineHeight: 1.5 }}>
            <IcAlert size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{issuesError}</span>
          </div>
        )}

        {showPaste && (
          <div style={panel}>
            <span style={label}>Output di: git log --oneline origin/{BRANCH}..HEAD (o più ampio)</span>
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
              rows={5} style={{ ...input, fontFamily: MONO, fontSize: 12, lineHeight: 1.6 }}
              placeholder={"7de92c6cd docs(log): smoke visivo passato…\n7450eb256 fix(editor-v2): drop empty routing key…"} />
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button style={btnPrimary} onClick={applyPaste}>Usa questi commit</button>
              <span style={{ fontSize: 11, color: MUTED }}>
                Fonte unica di verità per i nodi C: l'API pubblica vedrebbe uno stato indietro rispetto ai commit non pushati.
              </span>
            </div>
          </div>
        )}

        {showExport && (
          <div style={panel}>
            <span style={label}>Markdown pronto per il repo (es. docs/tracciabilita.md)</span>
            <textarea readOnly value={exportMd} rows={10}
              style={{ ...input, fontFamily: MONO, fontSize: 12, lineHeight: 1.6 }}
              onFocus={(e) => e.target.select()} />
          </div>
        )}

        {showManage && (
          <div style={panel}>
            <span style={label}>Tassonomia dei concern</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {allConcerns.map((c) => {
                const n = concernUsage(c);
                const editing = editingConcern === c;
                const confirming = confirmConcernDelete === c;
                return (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: `1px solid ${BG}`, flexWrap: "wrap" }}>
                    {editing ? (
                      <>
                        <input autoFocus style={{ ...input, width: 200, fontFamily: "monospace", fontSize: 12 }}
                          value={editValue} onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") renameConcern(c); if (e.key === "Escape") setEditingConcern(null); }} />
                        <button style={btnPrimary} onClick={() => renameConcern(c)}>Salva</button>
                        <button style={btn} onClick={() => setEditingConcern(null)}>Annulla</button>
                      </>
                    ) : confirming ? (
                      <>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: SLATE }}>{c}</span>
                        <span style={{ fontSize: 12, color: "#dc2626" }}>
                          Eliminare{n > 0 ? ` (verrà rimosso da ${n} voc${n === 1 ? "e" : "i"})` : ""}?
                        </span>
                        <button style={{ ...btn, background: "#dc2626", borderColor: "#dc2626", color: "#fff" }}
                          onClick={() => deleteConcern(c)}>Sì, elimina</button>
                        <button style={btn} onClick={() => setConfirmConcernDelete(null)}>Annulla</button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: 12, fontFamily: "monospace", color: SLATE, flex: "0 0 auto" }}>{c}</span>
                        <span style={{ fontSize: 11, color: MUTED }}>{n} voc{n === 1 ? "e" : "i"}</span>
                        <span style={{ flex: 1 }} />
                        <button style={{ ...btn, padding: "3px 10px" }}
                          onClick={() => { setEditingConcern(c); setEditValue(c); setConfirmConcernDelete(null); }}>
                          Rinomina
                        </button>
                        <button style={{ ...btn, padding: "3px 10px", color: "#dc2626", borderColor: "#fecaca" }}
                          onClick={() => { setConfirmConcernDelete(c); setEditingConcern(null); }}>
                          Elimina
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...input, width: 220, fontFamily: "monospace", fontSize: 12 }}
                value={newTaxConcern} onChange={(e) => setNewTaxConcern(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTaxConcern()}
                placeholder="nuovo-concern" />
              <button style={btnPrimary} onClick={addTaxConcern}>Aggiungi</button>
            </div>

            <div style={{ marginTop: 18 }}>
              <span style={label}>Milestone</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                {allMilestones.length === 0 && (
                  <span style={{ fontSize: 12, color: MUTED }}>Nessuna milestone. Creane una qui sotto.</span>
                )}
                {allMilestones.map((m) => {
                  const n = msUsage(m);
                  const doneMs = items.filter((i) => i.milestone === m && i.status === "chiusa").length;
                  const completeMs = n > 0 && doneMs === n;
                  const pctMs = n ? Math.round((doneMs / n) * 100) : 0;
                  const editing = editingMs === m;
                  const confirming = confirmMsDelete === m;
                  return (
                    <div key={m} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: `1px solid ${BG}`, flexWrap: "wrap" }}>
                      {editing ? (
                        <>
                          <input autoFocus style={{ ...input, width: 260, fontSize: 12 }}
                            value={editMsValue} onChange={(e) => setEditMsValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") renameMs(m); if (e.key === "Escape") setEditingMs(null); }} />
                          <button style={btnPrimary} onClick={() => renameMs(m)}>Salva</button>
                          <button style={btn} onClick={() => setEditingMs(null)}>Annulla</button>
                        </>
                      ) : confirming ? (
                        <>
                          <span style={{ fontSize: 12, color: "#6d28d9" }}>◆ {m}</span>
                          <span style={{ fontSize: 12, color: "#dc2626" }}>
                            Eliminare{n > 0 ? ` (${n} voc${n === 1 ? "e resterà" : "i resteranno"} senza milestone)` : ""}?
                          </span>
                          <button style={{ ...btn, background: "#dc2626", borderColor: "#dc2626", color: "#fff" }}
                            onClick={() => deleteMs(m)}>Sì, elimina</button>
                          <button style={btn} onClick={() => setConfirmMsDelete(null)}>Annulla</button>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: 12, color: "#6d28d9", flex: "0 0 auto" }}>◆ {m}</span>
                          <span style={{ fontSize: 11, color: MUTED }}>{n} voc{n === 1 ? "e" : "i"}</span>
                          {n > 0 && (completeMs ? (
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#15803d", background: "#dcfce7", border: "1px solid #86efac", padding: "1px 8px", borderRadius: 99 }}>chiusa ✓</span>
                          ) : (
                            <span style={{ fontSize: 10.5, fontWeight: 600, color: pctMs ? "#15803d" : MUTED, fontFamily: MONO }}>{doneMs}/{n} · {pctMs}%</span>
                          ))}
                          <span style={{ flex: 1 }} />
                          <button style={{ ...btn, padding: "3px 10px" }}
                            onClick={() => { setEditingMs(m); setEditMsValue(m); setConfirmMsDelete(null); }}>
                            Rinomina
                          </button>
                          <button style={{ ...btn, padding: "3px 10px", color: "#dc2626", borderColor: "#fecaca" }}
                            onClick={() => { setConfirmMsDelete(m); setEditingMs(null); }}>
                            Elimina
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...input, width: 280, fontSize: 12 }}
                  value={newTaxMs} onChange={(e) => setNewTaxMs(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTaxMs()}
                  placeholder="es. Arco edge v2 (E-mark, E-lab)" />
                <button style={btnPrimary} onClick={addTaxMs}>Aggiungi</button>
              </div>
            </div>
            <p style={{ fontSize: 11, color: MUTED, margin: "10px 0 0" }}>
              Rinominare propaga il nuovo nome a tutte le voci; eliminare un concern lo rimuove dalle voci, eliminare una milestone lascia le sue voci senza milestone. I nomi dei concern sono normalizzati in minuscolo-con-trattini; le milestone sono testo libero.
            </p>
          </div>
        )}

        <div style={{ ...panel, padding: "12px 14px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...input, flex: "2 1 220px" }} value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Nuovo requisito, bug o debito…" />
          <select style={{ ...input, flex: "0 0 110px" }} value={newType} onChange={(e) => setNewType(e.target.value)}>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button style={btnPrimary} onClick={addItem}><IcPlus size={14} /> Aggiungi</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <select style={{ ...input, width: "auto" }} value={fType} onChange={(e) => setFType(e.target.value)}>
            <option value="tutti">Tutti i tipi</option>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div style={{ position: "relative" }}>
            <button style={{ ...(fStatuses.length ? btnPrimary : btn), gap: 6 }}
              onClick={() => setStatusOpen(!statusOpen)}
              title="Filtra per stato (selezione multipla)">
              {fStatuses.length === 0 ? "Tutti gli stati"
                : fStatuses.length === 1 ? `Stato: ${fStatuses[0]}`
                : `Stati: ${fStatuses.length} di ${STATUSES.length}`}
              <IcChevron size={13} style={{ transform: statusOpen ? "rotate(180deg)" : "none", transition: "transform .12s ease" }} />
            </button>
            {statusOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setStatusOpen(false)} />
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 41,
                  background: "#fff", border: `1px solid ${LINE}`, borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(15,23,42,0.14)", padding: 6, minWidth: 200,
                }}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: 9, padding: "7px 10px",
                    borderRadius: 6, cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: SLATE,
                    borderBottom: `1px solid ${BG}`, marginBottom: 4,
                  }}>
                    <input type="checkbox" checked={fStatuses.length === 0}
                      onChange={() => setFStatuses([])}
                      style={{ accentColor: SLATE, width: 14, height: 14, margin: 0 }} />
                    Tutti gli stati
                  </label>
                  {STATUSES.map((s) => {
                    const on = fStatuses.includes(s);
                    return (
                      <label key={s} style={{
                        display: "flex", alignItems: "center", gap: 9, padding: "6px 10px",
                        borderRadius: 6, cursor: "pointer", fontSize: 12.5,
                        color: on ? INK : "#475569", background: on ? "#f1f5f9" : "transparent",
                      }}>
                        <input type="checkbox" checked={on}
                          onChange={() => setFStatuses(on ? fStatuses.filter((x) => x !== s) : [...fStatuses, s])}
                          style={{ accentColor: SLATE, width: 14, height: 14, margin: 0 }} />
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_STYLE[s].fg, flexShrink: 0 }} />
                        {s}
                        <span style={{ flex: 1 }} />
                        <span style={{ fontSize: 10.5, color: MUTED, fontFamily: MONO }}>
                          {items.filter((i) => i.status === s).length}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <select style={{ ...input, width: "auto", fontFamily: MONO, fontSize: 12 }} value={fConcern} onChange={(e) => setFConcern(e.target.value)}>
            <option value="tutti">Tutti i concern</option>
            {allConcerns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={{ ...input, width: "auto", fontSize: 12 }} value={fMilestone} onChange={(e) => setFMilestone(e.target.value)}>
            <option value="tutte">Tutte le milestone</option>
            {allMilestones.map((m) => <option key={m} value={m}>{m}</option>)}
            <option value="(nessuna)">(nessuna)</option>
          </select>
          <div style={{ position: "relative", flex: "1 1 150px", minWidth: 150 }}>
            <IcSearch size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none" }} />
            <input style={{ ...input, paddingLeft: 30 }} value={fText}
              onChange={(e) => setFText(e.target.value)} placeholder="Cerca…" />
          </div>
          <div style={{ display: "flex", gap: 0 }}>
            <button style={{ ...(viewMode === "lista" ? btnPrimary : btn), borderRadius: "6px 0 0 6px" }}
              onClick={() => setViewMode("lista")}><IcList size={14} /> Lista</button>
            <button style={{ ...(viewMode === "grafo" ? btnPrimary : btn), borderRadius: "0 6px 6px 0", marginLeft: -1 }}
              onClick={() => setViewMode("grafo")}><IcNetwork size={14} /> Grafo</button>
          </div>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: MUTED, fontSize: 13 }}>
            Nessuna voce. Aggiungi il primo requisito qui sopra.
          </div>
        )}

        {viewMode === "grafo" && filtered.length > 0 && <GraphView />}

        {viewMode === "lista" && <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {listGroups.map(([mName, group]) => {
            const done = group.filter((i) => i.status === "chiusa").length;
            const tot = group.length;
            const complete = tot > 0 && done === tot;
            const pct = tot ? Math.round((done / tot) * 100) : 0;
            return (
            <div key={mName}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6d28d9", textTransform: "uppercase", letterSpacing: "0.06em" }}>◆ {mName}</span>
                {complete ? (
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#15803d", background: "#dcfce7", border: "1px solid #86efac", padding: "2px 9px", borderRadius: 99 }}>
                    chiusa ✓
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 64, height: 5, borderRadius: 3, background: LINE, overflow: "hidden", display: "inline-block" }}>
                      <span style={{ display: "block", width: `${pct}%`, height: "100%", background: "#16a34a", borderRadius: 3 }} />
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: pct ? "#15803d" : MUTED, fontFamily: MONO }}>{pct}%</span>
                  </span>
                )}
                <span style={{ fontSize: 11, color: MUTED }}>
                  {done}/{tot} chiuse · ordine di esecuzione dall'alto
                </span>
              </div>
              <div className="tj-tl">
              {group.map((it) => {
            const T = TYPES[it.type];
            const S = STATUS_STYLE[it.status];
            const open = expanded === it.id;
            const gi = it.issue ? findIssue(it.issue) : null;
            const hashes = parseCommitInput(it.commits);
            const closed = it.status === "chiusa";
            const ready = isRunnable(it);
            const dotColor = closed ? "#16a34a" : ready ? CYAN : "#cbd5e1";
            return (
              <div key={it.id} style={{ position: "relative", paddingLeft: 32, marginBottom: 10 }}>
                <div style={{ position: "absolute", left: 0, top: 16, width: 20, height: 20, borderRadius: "50%", background: "#fff", border: `2px solid ${dotColor}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, fontSize: 10, color: dotColor, fontWeight: 700 }}
                  title={closed ? "Chiusa" : ready ? "Eseguibile ora" : "Bloccata da dipendenze aperte"}>
                  {closed ? "✓" : ready ? "●" : ""}
                </div>
                <div className="tj-card" style={{
                background: "#fff", border: `1px solid ${LINE}`, borderLeft: `3px solid ${T.color}`,
                borderRadius: "0 10px 10px 0",
              }}>
                <div onClick={() => { setExpanded(open ? null : it.id); setConfirmDelete(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, letterSpacing: "-0.01em" }}>{it.title}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.color, background: T.bg, padding: "2.5px 7px", borderRadius: 99 }}>{T.label}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: S.fg, background: S.bg, padding: "2.5px 7px", borderRadius: 99 }}>{it.status}</span>
                      {it.priority === "alta" && (
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "#dc2626", background: "#fee2e2", padding: "2.5px 7px", borderRadius: 99 }}>alta</span>
                      )}
                      {it.milestone && (
                        <span onClick={(e) => { e.stopPropagation(); setFMilestone(fMilestone === it.milestone ? "tutte" : it.milestone); }}
                          title="Filtra per milestone" className="tj-chip"
                          style={{ fontSize: 10.5, cursor: "pointer", color: "#6d28d9", background: "#ede9fe", padding: "2.5px 7px", borderRadius: 99 }}>
                          ◆ {it.milestone}
                        </span>
                      )}
                      {gi && (
                        <span style={{ fontSize: 10.5, fontFamily: MONO, color: gi.state === "open" ? "#15803d" : MUTED, background: "#f1f5f9", padding: "2.5px 7px", borderRadius: 99 }}>
                          #{gi.number} {gi.state}
                        </span>
                      )}
                      {(it.concerns || []).map((c) => (
                        <span key={c} className="tj-chip"
                          onClick={(e) => { e.stopPropagation(); setFConcern(fConcern === c ? "tutti" : c); }}
                          title={fConcern === c ? "Rimuovi il filtro" : "Filtra per questo concern"}
                          style={{ fontSize: 10.5, fontFamily: MONO, cursor: "pointer",
                            color: fConcern === c ? "#fff" : "#475569",
                            background: fConcern === c ? SLATE : "#f1f5f9",
                            border: `1px solid ${fConcern === c ? SLATE : "transparent"}`,
                            padding: "2px 7px", borderRadius: 99 }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Chain it={it} />
                </div>

                {open && (
                  <div style={{ borderTop: `1px solid ${LINE}`, padding: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, background: "#fafbfc", borderRadius: "0 0 10px 0" }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={label}>Titolo</span>
                      <input style={input} value={it.title} onChange={(e) => patch(it.id, { title: e.target.value })} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={label}>Descrizione / requisito</span>
                      <textarea style={{ ...input, resize: "vertical" }} rows={2} value={it.desc}
                        onChange={(e) => patch(it.id, { desc: e.target.value })} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={label}>Concern</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {allConcerns.map((c) => {
                          const on = (it.concerns || []).includes(c);
                          return (
                            <span key={c} onClick={() => toggleConcern(it.id, c)}
                              style={{ fontSize: 11, fontFamily: "monospace", cursor: "pointer", userSelect: "none",
                                color: on ? "#fff" : MUTED,
                                background: on ? SLATE : "#fff",
                                border: `1px solid ${on ? SLATE : LINE}`,
                                padding: "3px 8px", borderRadius: 12 }}>
                              {c}
                            </span>
                          );
                        })}
                        <input style={{ ...input, width: 150, fontFamily: "monospace", fontSize: 11 }}
                          value={newConcern} onChange={(e) => setNewConcern(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addCustomConcern(it.id)}
                          placeholder="nuovo concern ⏎" />
                      </div>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={label}>Milestone</span>
                      <select style={input} value={it.milestone || ""}
                        onChange={(e) => patch(it.id, { milestone: e.target.value })}>
                        <option value="">(nessuna)</option>
                        {allMilestones.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={label}>Dipende da</span>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {(it.deps || []).map((d) => {
                          const t = items.find((x) => x.id === d);
                          return (
                            <span key={d} style={{ fontSize: 11, display: "inline-flex", alignItems: "center", gap: 6,
                              color: t && t.status === "chiusa" ? "#15803d" : SLATE,
                              background: "#f1f5f9", border: `1px solid ${LINE}`,
                              padding: "3px 8px", borderRadius: 12 }}>
                              {t ? t.title.slice(0, 34) : d}{t && t.status === "chiusa" ? " ✓" : ""}
                              <span onClick={() => patch(it.id, { deps: (it.deps || []).filter((x) => x !== d) })}
                                style={{ cursor: "pointer", color: MUTED, fontWeight: 700 }}>×</span>
                            </span>
                          );
                        })}
                        <select style={{ ...input, width: "auto", fontSize: 11 }} value=""
                          onChange={(e) => { if (e.target.value) patch(it.id, { deps: [...(it.deps || []), e.target.value] }); }}>
                          <option value="">aggiungi dipendenza…</option>
                          {items.filter((o) => o.id !== it.id && !(it.deps || []).includes(o.id))
                            .map((o) => <option key={o.id} value={o.id}>{o.title.slice(0, 44)}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <span style={label}>Stato</span>
                      <select style={input} value={it.status} onChange={(e) => patch(it.id, { status: e.target.value })}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={label}>Priorità</span>
                      <select style={input} value={it.priority} onChange={(e) => patch(it.id, { priority: e.target.value })}>
                        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={label}>Decisioni (id, es. R-B9, RC-3)</span>
                      <input style={{ ...input, fontFamily: "monospace" }} value={it.decision}
                        onChange={(e) => patch(it.id, { decision: e.target.value })} placeholder="R-H, RC-3" />
                    </div>
                    <div>
                      <span style={label}>Issue GitHub (numero)</span>
                      {issues.length > 0 ? (
                        <select style={input} value={String(it.issue)} onChange={(e) => patch(it.id, { issue: e.target.value })}>
                          <option value="">nessuna</option>
                          {issues.map((i) => (
                            <option key={i.number} value={String(i.number)}>#{i.number} · {i.title.slice(0, 40)}</option>
                          ))}
                        </select>
                      ) : (
                        <input style={{ ...input, fontFamily: "monospace" }} value={it.issue}
                          onChange={(e) => patch(it.id, { issue: e.target.value })} placeholder="42" />
                      )}
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={label}>Documento prompt Claude Code</span>
                      <input style={{ ...input, fontFamily: "monospace" }} value={it.prompt}
                        onChange={(e) => patch(it.id, { prompt: e.target.value })}
                        placeholder="claude/2026-08-09_prompt_….md" />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={label}>Commit (hash, separati da spazio)</span>
                      <input style={{ ...input, fontFamily: "monospace" }} value={it.commits}
                        onChange={(e) => patch(it.id, { commits: e.target.value })}
                        placeholder="7450eb256 7de92c6cd" />
                      {hashes.length > 0 && (
                        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                          {hashes.map((h) => {
                            const c = findCommit(h);
                            return (
                              <div key={h} style={{ fontSize: 11, fontFamily: "monospace", color: c ? "#15803d" : commits.length ? "#b45309" : MUTED }}>
                                {c ? "✓" : commits.length ? "?" : "·"} {h}
                                {c ? `  ${c.msg}` : commits.length ? "  non trovato nel log caricato" : "  (log non caricato)"}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
                      {confirmDelete === it.id ? (
                        <>
                          <span style={{ fontSize: 12, color: "#dc2626" }}>Eliminare definitivamente?</span>
                          <button style={{ ...btn, background: "#dc2626", borderColor: "#dc2626", color: "#fff" }}
                            onClick={() => { setConfirmDelete(null); setExpanded(null); remove(it.id); }}>
                            Sì, elimina
                          </button>
                          <button style={btn} onClick={() => setConfirmDelete(null)}>Annulla</button>
                        </>
                      ) : (
                        <button style={{ ...btn, color: "#dc2626", borderColor: "#fecaca" }}
                          onClick={() => setConfirmDelete(it.id)}>
                          Elimina
                        </button>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div>
            );
          })}
              </div>
            </div>
          ); })}
        </div>}

        <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 28, paddingTop: 14 }}>
          <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.7, margin: 0 }}>
            Taccuino operativo, non registro: le decisioni vincolanti vivono in <span style={{ fontFamily: MONO }}>docs/decisions.md</span> (RC-4).
            La catena R → D → I → P → C mostra la copertura di tracciabilità; il nodo C diventa ambra se un hash
            non risulta nel log incollato. I dati persistono nello storage locale di questo artefatto; il seed riparte
            solo su chiave nuova (qui: <span style={{ fontFamily: MONO }}>{STORE_KEY}</span>).
          </p>
          <p style={{ fontSize: 10.5, color: "#94a3b8", fontFamily: MONO, margin: "8px 0 0" }}>
            Versione: {APP_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}
