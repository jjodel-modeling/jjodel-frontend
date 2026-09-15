/**
 * probe_2026-09-08_jjel_keyword_after_dot — quanto e' larga la ferita
 * «keyword dopo il punto» nel lexer JjEL, e se il metamodello la lasci aprire.
 *
 * Nasce da un difetto gia' misurato su UNA keyword: `coll.forAll(...)` non parsa mai,
 * perche' il lexer minuscola il testo PRIMA di consultare la tabella delle keyword
 * (`jjel/lexer/lexer.ts:397-400`), cosi' `forAll` diventa il token FORALL e non puo'
 * stare dopo un `.`. La domanda che questa sonda risponde e' se `forAll` sia un caso
 * isolato o l'esemplare di una classe, e quanto quella classe sia raggiungibile da un
 * utente che nomina le feature del proprio metamodello.
 *
 * ── Che cosa misura, e perche' ciascun blocco esiste ─────────────────────────
 *
 *  A. LE DUE TABELLE, LETTE DAL SORGENTE. `JJEL_KEYWORDS` e `JJTL_KEYWORDS` sono
 *     IMPORTATE, non ricopiate: una sonda che trascrive la lista misura la
 *     trascrizione, e la lista puo' cambiare sotto il referto senza che nessuno se ne
 *     accorga. Da qui esce anche il confronto fra le due (comune / solo JjEL / solo
 *     JjTL), che e' la domanda 4 del prompt.
 *
 *  B. JjEL, OGNI KEYWORD DOPO UN PUNTO. Per ciascuna: che token esce dopo il DOT, e
 *     che cosa dice il parser di `a.<kw>`. E' la domanda 2, e la risposta e' per
 *     keyword, non per campione: il campione lo sceglie chi scrive la sonda, e
 *     sceglierlo male e' il modo piu' facile per non trovare quello che c'e'.
 *
 *  C. IL CONTROLLO POSITIVO, e serve DAVVERO. Un elenco di fallimenti e' identico a
 *     un parser rotto: se anche `a.type`, `a.name`, `a.value` fallissero, il blocco B
 *     non direbbe niente sulle keyword. Questi nomi NON sono in tabella e devono
 *     parsare tutti. Se uno solo fallisce, la sonda e' rotta e va letta cosi'.
 *
 *  D. JjTL, LA STESSA MISURA SUL SUO LEXER. Misurata al LIVELLO DEL LEXER, non del
 *     parser: il parser JjTL vuole un programma intero, e il soggetto qui e' la
 *     tokenizzazione. Dichiarato, non nascosto.
 *
 *  E. LA FERITA OLTRE IL PUNTO. La stessa keyword come identificatore nudo (`kw`) e
 *     come chiave di object literal (`{kw: 1}`): serve a sapere se il difetto e' solo
 *     della navigazione o anche del binding, perche' le due cose si riparano in punti
 *     diversi.
 *
 *  F. IL METAMODELLO LA LASCIA APRIRE? `checkNameShape` e' l'unico controllo lessicale
 *     sul nome di un elemento (CHECK 12 della conformance). Passato ogni keyword: se
 *     le accetta tutte, chiamare una feature `in` o `do` e' legale, e il difetto e'
 *     raggiungibile scrivendo un metamodello, non solo scrivendo un'espressione.
 *
 * ── Che cosa NON prova ───────────────────────────────────────────────────────
 *
 * Non prova che qualcuno abbia gia' un metamodello con una feature cosi' chiamata:
 * misura che nulla lo impedisce, che e' una cosa diversa. E non tocca il lexer: il
 * fix e' una corsia separata, questa sonda serve a decidere se aprirla prima o dopo.
 *
 *   cd frontend && npx tsx ../docs/discovery/harness/probe_2026-09-08_jjel_keyword_after_dot.mts
 */

import { JJEL_KEYWORDS, JjelTokenType } from '../../../frontend/src/jjel/types/tokens.ts';
import { JJTL_KEYWORDS } from '../../../frontend/src/jjtl/types/tokens.ts';
import { tokenize as jjelTokenize } from '../../../frontend/src/jjel/lexer/index.ts';
import { parseExpression } from '../../../frontend/src/jjel/parser/index.ts';
import { jjelEval } from '../../../frontend/src/jjel/index.ts';
import { tokenize as jjtlTokenize } from '../../../frontend/src/jjtl/lexer/lexer.ts';
import { checkNameShape } from '../../../frontend/src/model/conformance/nameShape.ts';

let pass = 0, fail = 0;
const ok = (c: boolean, msg: string) => { if (c) { pass++; console.log('  PASS  ' + msg); } else { fail++; console.log('  FAIL  ' + msg); } };
const h = (s: string) => console.log('\n' + s + '\n' + '─'.repeat(s.length));

const jjelKw = Object.keys(JJEL_KEYWORDS).sort();
const jjtlKw = Object.keys(JJTL_KEYWORDS).sort();

// ── A ────────────────────────────────────────────────────────────────────────
h('A. Le due tabelle, importate dal sorgente');
console.log(`JJEL_KEYWORDS (${jjelKw.length}): ${jjelKw.join(', ')}`);
console.log(`JJTL_KEYWORDS (${jjtlKw.length}): ${jjtlKw.join(', ')}`);
const common = jjelKw.filter(k => jjtlKw.includes(k));
const onlyJjel = jjelKw.filter(k => !jjtlKw.includes(k));
const onlyJjtl = jjtlKw.filter(k => !jjelKw.includes(k));
console.log(`\ncomune     (${common.length}): ${common.join(', ')}`);
console.log(`solo JjEL  (${onlyJjel.length}): ${onlyJjel.join(', ')}`);
console.log(`solo JjTL  (${onlyJjtl.length}): ${onlyJjtl.join(', ')}`);
ok(common.length + onlyJjel.length === jjelKw.length, 'la partizione copre JJEL_KEYWORDS');
ok(common.length + onlyJjtl.length === jjtlKw.length, 'la partizione copre JJTL_KEYWORDS');

// ── B ────────────────────────────────────────────────────────────────────────
h('B. JjEL: ogni keyword dopo un punto  ->  a.<kw>');
const tokenAfterDot = (src: string): string => {
    const r: any = jjelTokenize(src);
    const toks = r.tokens ?? r;
    const i = toks.findIndex((t: any) => t.type === JjelTokenType.DOT);
    return i >= 0 && toks[i + 1] ? String(toks[i + 1].type) : '(nessuno)';
};
const jjelRows: {kw: string; tok: string; err: string}[] = [];
for (const kw of jjelKw) {
    const src = `a.${kw}`;
    const r = parseExpression(src);
    jjelRows.push({ kw, tok: tokenAfterDot(src), err: r.errors.length ? `${r.errors[0].line}:${r.errors[0].column} ${r.errors[0].message}` : '' });
}
const wJ = Math.max(...jjelRows.map(r => r.kw.length));
for (const r of jjelRows) {
    console.log(`  a.${r.kw.padEnd(wJ)}  token: ${r.tok.padEnd(14)}  ${r.err ? 'PARSE-FAIL  ' + r.err : 'parsa'}`);
}
const jjelBroken = jjelRows.filter(r => r.err);
console.log(`\n  rotte: ${jjelBroken.length} / ${jjelRows.length}  ->  ${jjelBroken.map(r => r.kw).join(', ')}`);
ok(jjelBroken.length > 0, 'almeno una keyword rompe la navigazione (il difetto esiste)');

// ── C ────────────────────────────────────────────────────────────────────────
h('C. Controllo positivo: nomi NON in tabella, devono parsare tutti');
const controls = ['type', 'name', 'value', 'values', 'abstract', 'owner', 'label', 'father'];
for (const c of controls) {
    const r = parseExpression(`a.${c}`);
    ok(r.errors.length === 0 && r.expression !== null, `a.${c} parsa (non e' keyword: ${!jjelKw.includes(c)})`);
}

// ── D ────────────────────────────────────────────────────────────────────────
h('D. JjTL: ogni keyword dopo un punto, al livello del LEXER');
const jjtlRows: {kw: string; tok: string}[] = [];
for (const kw of jjtlKw) {
    const r: any = jjtlTokenize(`a.${kw}`);
    const toks = r.tokens ?? r;
    const i = toks.findIndex((t: any) => String(t.type) === 'DOT');
    jjtlRows.push({ kw, tok: i >= 0 && toks[i + 1] ? String(toks[i + 1].type) : '(nessuno)' });
}
const wT = Math.max(...jjtlRows.map(r => r.kw.length));
for (const r of jjtlRows) {
    const isIdent = r.tok === 'IDENTIFIER';
    console.log(`  a.${r.kw.padEnd(wT)}  token: ${r.tok.padEnd(16)}  ${isIdent ? 'identificatore' : 'KEYWORD (non puo\' seguire un punto)'}`);
}
const jjtlBroken = jjtlRows.filter(r => r.tok !== 'IDENTIFIER');
console.log(`\n  keyword dopo il punto: ${jjtlBroken.length} / ${jjtlRows.length}`);
ok(jjtlBroken.length === jjtlRows.length, 'in JjTL nessuna keyword sopravvive al punto (stessa meccanica)');

// ── E ────────────────────────────────────────────────────────────────────────
h('E. La ferita oltre il punto: identificatore nudo e chiave di object literal');
const bareBroken: string[] = [], keyBroken: string[] = [];
for (const kw of jjelKw) {
    if (parseExpression(kw).errors.length) bareBroken.push(kw);
    if (parseExpression(`{${kw}: 1}`).errors.length) keyBroken.push(kw);
}
console.log(`  come identificatore nudo, rotte: ${bareBroken.length} / ${jjelKw.length}  ->  ${bareBroken.join(', ') || '(nessuna)'}`);
console.log(`  come chiave di object literal, rotte: ${keyBroken.length} / ${jjelKw.length}  ->  ${keyBroken.join(', ') || '(nessuna)'}`);

// ── F ────────────────────────────────────────────────────────────────────────
h('F. Il metamodello lascia chiamare una feature come una keyword?');
const rejected = jjelKw.filter(kw => checkNameShape(kw) !== 'ok');
for (const kw of jjelKw) console.log(`  checkNameShape(${JSON.stringify(kw)}) -> ${checkNameShape(kw)}`);
console.log(`\n  rifiutate: ${rejected.length} / ${jjelKw.length}  ->  ${rejected.join(', ') || '(nessuna)'}`);
ok(checkNameShape('') === 'empty' && checkNameShape('9bad') === 'bad_first_char',
   'controllo positivo: checkNameShape sa dire di no quando deve');

// ── G ────────────────────────────────────────────────────────────────────────
h('G. Esiste una via di scampo? a["<kw>"] con l\'index access');
const escapeBroken: string[] = [];
for (const kw of jjelKw) {
    const r = parseExpression(`a["${kw}"]`);
    if (r.errors.length) escapeBroken.push(kw);
}
console.log(`  a["<kw>"] rotte: ${escapeBroken.length} / ${jjelKw.length}  ->  ${escapeBroken.join(', ') || '(nessuna)'}`);
ok(parseExpression('a["type"]').errors.length === 0, 'controllo positivo: a["type"] parsa');
// Parsare non basta: la via di scampo vale solo se LEGGE il valore. Il contesto M1
// appiattisce gli slot (`extractAttributeValues`), quindi la feature `in` di
// un'istanza e' una proprieta' nuda dell'oggetto, ed e' li' che l'index access arriva.
ok(jjelEval('a["in"]', { a: { in: 42 } } as any) === 42, 'a["in"] legge davvero il valore (42)');
ok(jjelEval('a["do"] == null', { a: {} } as any) === true, 'a["do"] su feature assente da' + ' null, non lancia');

console.log(`\n${'='.repeat(78)}\n  ${pass} PASS  ${fail} FAIL\n`);
process.exit(fail ? 1 : 0);
