#!/usr/bin/env node
// Connettore cruscotto di tracciabilità <-> GitHub Issues (jjodel).
//
// Ratifiche (2026-08-09, sessione Cowork):
// - Scritture: eseguite in sessione Cowork con fine-grained PAT on-demand
//   (env GITHUB_TOKEN, mai persistito).
// - Scope: sole voci APERTE del seed più quelle future; le voci già chiuse
//   generano issue solo se un'issue esiste già (in quel caso viene chiusa).
// - Master: il cruscotto. Le modifiche manuali fatte su GitHub sono drift:
//   segnalate nel report e sovrascritte.
//
// Uso:
//   node sync_issues_cruscotto.mjs --file tracciabilita-jjodel.jsx [--apply]
// Default: DRY-RUN (stampa il piano, non scrive nulla). Con --apply esegue.
// Richiede: GITHUB_TOKEN nell'ambiente (fine-grained: repo jjodel-frontend,
// permessi Issues Read&Write + Metadata Read).
//
// Idempotenza: ogni issue gestita porta nel body un marker
//   <!-- jjodel-trace id=<seed-id> hash=<sha1> -->
// Se l'hash calcolato dalla voce coincide e lo stato è allineato, nessuna PATCH.
// Al termine (con --apply) stampa la mappa id -> numero issue in JSON, da
// riportare nel campo issue del seed del cruscotto.

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const REPO = "jjodel-modeling/jjodel-frontend";
const API = `https://api.github.com/repos/${REPO}`;
const LABEL_ROOT = "cruscotto";

const args = process.argv.slice(2);
const getArg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const APPLY = args.includes("--apply");
const FILE = getArg("--file", "tracciabilita-jjodel.jsx");
const TOKEN = process.env.GITHUB_TOKEN || "";
if (!TOKEN) { console.error("GITHUB_TOKEN mancante nell'ambiente."); process.exit(1); }

// ---------- estrazione del seed dal sorgente del cruscotto ----------
const src = readFileSync(FILE, "utf8");
const start = src.indexOf("const SEED = [");
const end = src.indexOf("];", start);
if (start < 0) { console.error("SEED non trovato in " + FILE); process.exit(1); }
const SEED = new Function("return " + src.slice(start + "const SEED = ".length, end + 1) + ";")();
const byId = Object.fromEntries(SEED.map((i) => [i.id, i]));

// ---------- client API ----------
const gh = async (method, path, body) => {
  const r = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${path} -> HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : r.json();
};

// ---------- mapping voce -> issue ----------
const TYPE_LABEL = { bug: "trace:bug", feature: "trace:feature", debt: "trace:debt" };
const LABEL_COLORS = {
  [LABEL_ROOT]: "0ea5e9",
  "trace:bug": "dc2626", "trace:feature": "0ea5e9", "trace:debt": "d97706",
  "prio:alta": "dc2626", "prio:media": "64748b", "prio:bassa": "94a3b8",
  "stato:idea": "cbd5e1", "stato:ratificata": "6d28d9", "stato:in-coda": "0369a1",
  "stato:in-lavorazione": "b45309", "stato:chiusa": "15803d",
};
const statoSlug = (s) => "stato:" + s.replace(/\s+/g, "-");
const labelsFor = (it) => [LABEL_ROOT, TYPE_LABEL[it.type], "prio:" + it.priority, statoSlug(it.status)];

const bodyFor = (it) => {
  const deps = (it.deps || []).map((d) => byId[d] ? `${byId[d].title}${byId[d].issue ? ` (#${byId[d].issue})` : ""}` : d);
  const hashes = (it.commits || "").split(/\s+/).filter(Boolean);
  const lines = [
    `<!-- jjodel-trace id=${it.id} hash=__HASH__ -->`,
    "",
    it.desc || "",
    "",
    "### Tracciabilità (R→D→I→P→C)",
    "",
    `- **Stato**: ${it.status} · **Priorità**: ${it.priority}`,
    it.milestone ? `- **Milestone**: ${it.milestone}` : null,
    it.decision ? `- **Decisioni**: ${it.decision} (registro: docs/decisions.md)` : null,
    it.prompt ? `- **Prompt Claude Code**: ${it.prompt}` : null,
    hashes.length ? `- **Commit**: ${hashes.map((h) => "`" + h + "`").join(", ")}` : null,
    deps.length ? `- **Dipende da**: ${deps.join("; ")}` : null,
    "",
    "---",
    "_Specchio del cruscotto di tracciabilità Jjodel (master: cruscotto). Le modifiche manuali a questa issue vengono sovrascritte alla sync successiva._",
  ].filter((l) => l !== null);
  const raw = lines.join("\n");
  const hash = createHash("sha1").update(
    JSON.stringify([it.title, it.desc, it.status, it.priority, it.milestone, it.decision, it.prompt, it.commits, it.deps]),
  ).digest("hex").slice(0, 12);
  return { body: raw.replace("__HASH__", hash), hash };
};
const markerOf = (body) => {
  const m = (body || "").match(/<!-- jjodel-trace id=([\w-]+) hash=([0-9a-f]+) -->/);
  return m ? { id: m[1], hash: m[2] } : null;
};

// ---------- sync ----------
const plan = { create: [], update: [], close: [], reopen: [], drift: [], orphan: [], ok: [], skip: [] };

const ensureLabels = async (existing) => {
  const have = new Set(existing.map((l) => l.name));
  for (const [name, color] of Object.entries(LABEL_COLORS)) {
    if (!have.has(name)) {
      plan.create.push(`label ${name}`);
      if (APPLY) await gh("POST", "/labels", { name, color, description: "Cruscotto di tracciabilità Jjodel" });
    }
  }
};

const ensureMilestone = async (title, cache) => {
  if (!title) return null;
  if (cache.has(title)) return cache.get(title);
  plan.create.push(`milestone "${title}"`);
  if (!APPLY) { cache.set(title, null); return null; }
  const m = await gh("POST", "/milestones", { title });
  cache.set(title, m.number);
  return m.number;
};

const run = async () => {
  const labels = await gh("GET", "/labels?per_page=100");
  await ensureLabels(labels);
  const msList = await gh("GET", "/milestones?state=all&per_page=100");
  const msCache = new Map(msList.map((m) => [m.title, m.number]));
  const issues = (await gh("GET", `/issues?state=all&labels=${LABEL_ROOT}&per_page=100`)).filter((x) => !x.pull_request);
  const byMarker = new Map();
  issues.forEach((is) => { const mk = markerOf(is.body); if (mk) byMarker.set(mk.id, is); });

  const mapping = {};
  for (const it of SEED) {
    const linked = byMarker.get(it.id) || (it.issue ? issues.find((x) => String(x.number) === String(it.issue)) : null);
    const open = it.status !== "chiusa";
    if (!open && !linked) { plan.skip.push(`${it.id} (chiusa, mai specchiata)`); continue; }

    const { body, hash } = bodyFor(it);
    const wantLabels = labelsFor(it);
    const wantState = open ? "open" : "closed";
    const msNumber = await ensureMilestone(it.milestone, msCache);

    if (!linked) {
      plan.create.push(`issue "${it.title}" [${it.id}]`);
      if (APPLY) {
        const created = await gh("POST", "/issues", { title: it.title, body, labels: wantLabels, ...(msNumber ? { milestone: msNumber } : {}) });
        mapping[it.id] = created.number;
      }
      continue;
    }

    mapping[it.id] = linked.number;
    const mk = markerOf(linked.body);
    const sameHash = mk && mk.hash === hash;
    const sameTitle = linked.title === it.title;
    const sameState = linked.state === wantState;
    const haveLabels = new Set((linked.labels || []).map((l) => (typeof l === "string" ? l : l.name)));
    const sameLabels = wantLabels.every((l) => haveLabels.has(l)) && [...haveLabels].filter((l) => l.startsWith("stato:") || l.startsWith("prio:") || l.startsWith("trace:")).every((l) => wantLabels.includes(l));

    if (sameHash && sameTitle && sameState && sameLabels) { plan.ok.push(`#${linked.number} ${it.id}`); continue; }
    if (!sameState) (wantState === "closed" ? plan.close : plan.reopen).push(`#${linked.number} ${it.id}`);
    if (!sameHash || !sameTitle || !sameLabels) {
      plan.update.push(`#${linked.number} ${it.id}${!sameHash && mk ? " (drift contenuto)" : ""}`);
      if (mk && !sameHash) plan.drift.push(`#${linked.number} ${it.id}: body/campi divergenti, sovrascrivo (master: cruscotto)`);
    }
    if (APPLY) {
      await gh("PATCH", `/issues/${linked.number}`, {
        title: it.title, body, labels: wantLabels, state: wantState,
        ...(wantState === "closed" ? { state_reason: "completed" } : {}),
        ...(msNumber ? { milestone: msNumber } : {}),
      });
    }
  }

  for (const is of issues) {
    const mk = markerOf(is.body);
    if (!mk || !byId[mk.id]) plan.orphan.push(`#${is.number} "${is.title}" (nessuna voce corrispondente: solo segnalata, non tocco)`);
  }

  const report = [
    `# Sync cruscotto -> GitHub Issues (${APPLY ? "APPLY" : "DRY-RUN"})`,
    `Repo: ${REPO} · voci nel seed: ${SEED.length} · issue con label ${LABEL_ROOT}: ${issues.length}`,
    "",
    ...Object.entries(plan).map(([k, v]) => `## ${k} (${v.length})\n${v.map((x) => "- " + x).join("\n") || "- (niente)"}`),
  ].join("\n\n");
  writeFileSync("sync_report.md", report);
  console.log(report);
  if (APPLY) console.log("\nMAPPING_JSON=" + JSON.stringify(mapping));
};

run().catch((e) => { console.error("ERRORE:", e.message); process.exit(1); });
