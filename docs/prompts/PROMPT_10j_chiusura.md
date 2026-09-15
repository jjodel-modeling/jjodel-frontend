# PROMPT — 10j-CHIUSURA (SERIALE)

Depositato il 2026-09-01 10:20 (RC-9). Testo ricevuto in chat, verbatim.

---

Stato misurato 01-09 (autoritativo, supera §7 del referto): i sorgenti 10j
(tsx+scss) e il riallineo del test 10c sono già dentro dc6ae5c52 (il commit
intitolato 10i); untracked restano instanceManager10j.test.ts e il referto;
l'entry di log 10j è assente e quella di 10i dichiara meno di ciò che il commit
porta.

## 1. Le due leve (decisione presa, referto §1)

padding-block: 48px → 24px sul cartello.

Riga toolbar spenta a 0 istanze (il suo solo «New» è duplicato dalla CTA);
«resta la testata» = titolo+sottotitolo. Card attesa ~261px (≤ before 298px).

Riallinea suite 10j e sonda _tmp_10j_verify.ts; atteso verde con card compatta.

Il foglio è condiviso con DS3 (&__draft-label, già in db7e7610a): se servisse,
commit per hunk.

## 2. Commit

Leve + suite 10j + referto (aggiornato: leve applicate, misura finale, e la nota
che i sorgenti viaggiarono in dc6ae5c52) — pathspec, feat(manager).

Entry di log 10j riscritta (l'originale è persa): dichiara esplicitamente che il
delta 10j è dentro dc6ae5c52 e correggi così il non-detto dell'entry 10i — senza
modificare l'entry 10i (add-only): la rettifica vive nella entry nuova. Commit a
sé.

## 3. §5 (Export già assente a 0 righe)

Nessuna azione: era vero prima della slice, resta scritto nel referto.

## 4. Dopo, stessa sessione, a corsie ferme

Rotazione P9 (45+ > 40): git mv delle entry più vecchie in
docs/claude-code-log-archive.md, commit a sé.

Commit dei prompt untracked in docs/prompts/ (RC-9), inclusi referto 10j e questo
prompt se lo depositi lì.
