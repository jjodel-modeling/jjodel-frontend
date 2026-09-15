# Prompt Claude Code: Settings · AI Providers — revisione light densa (mockup 5a)

**Data**: 2026-08-26 19:00
**Branch**: `alfonso-frontend-jjtl`, HEAD `4b18c349f`. Il working tree ha modifiche non committate di altri fronti (`featureSignature.ts`, `StatusBar.*`, `docs/decisions.md`): non toccarle, non stagiarle.
**Tipo**: feat
**Corsia**: veloce (RC-3): tre file di prodotto, nessuno in §3.1, nessuna interfaccia esportata toccata.
**Mockup**: variante 5a, scelta fra cinque in chat. Il file `AI Providers Settings.dc.html` vive nel canvas di design, non nel repo.

---

## 0. Contesto

Il pannello Providers mostra oggi undici card da 68px, ciascuna con lo stesso chip «Not configured»: undici volte la stessa informazione, cioè nessuna. Il design va giudicato anche nello stato misto (2 configurate, 9 no): lì serve che le configurate emergano.

---

## 1. COSA

Il pannello Providers va ristrutturato per stato, con righe dense e senza chip ripetuti:

- **Modale Settings**: ridurre leggermente a ~960×700 (era quasi fullscreen); il layout sidebar+contenuto resta.
- **Due sezioni** con eyebrow 11px/600 uppercase #94a3b8: «Configured · N» e «Available · N». Un provider è configured se ha API key/endpoint salvati. Sezione Configured assente se N=0 (stato attuale dell'utente: tutte in Available).
- **Righe** al posto delle card attuali: Configured 46px, Available 42px, radius 8, hover #f1f5f9, intera riga cliccabile per espandere il dettaglio (chevron `bi-chevron-down` 11px slate-400 a destra, ruota da aperto). Logo in contenitore 28×28 radius 8 con coppia pastello/saturato per provider (normalizzare i loghi esistenti in questo formato). Nome 14px/600 + elenco modelli inline 12px slate-400 accanto al nome con ellipsis — niente seconda riga.
- **Stato**: sulle Configured, dot verde 7px + nome del modello attivo in 12px #16a34a. Sulle Available solo «Set up» 12px slate-400. Il chip «Not configured» sparisce ovunque.
- **Footer**: «API keys are stored locally in your browser.» con `bi-shield-lock` (non info), 12px slate-400, sopra hairline, ancorato in fondo al pannello.
- **Custom**: sottotitolo «OpenAI-compatible endpoint» (non «Custom»); vive in fondo ad Available, senza separatore «CUSTOM PROVIDER».

**Invarianti**: form di configurazione espanso, salvataggio chiavi, dark mode (token, non hardcode), scroll solo se il viewport è più basso del modale.

---

## 2. COME si verifica

Sonda con un caso per punto (sezioni con N misto e N=0, riga cliccabile, dot+modello attivo, footer, Custom) in light e dark + gate typecheck/build/smoke contro baseline.
