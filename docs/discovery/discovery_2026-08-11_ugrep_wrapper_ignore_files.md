# Discovery — the interactive `grep` skips gitignored paths, `node_modules` included

**Tipo**: relocation of an existing measurement, not new discovery. The account below was
authored inline in root `CLAUDE.md` §5 ("Sub-rule: an assertion of absence requires proof that
the search ran") on 2026-08-11 and moved here verbatim on 2026-09-18
(P-2026-09-18-1930 Phase 2) so that §5 can hold a one-sentence pointer instead of the full
account. No rewording of the measurement itself.

**Ipotesi in gioco**: "X does not exist" / "X is not used anywhere" claims made from a `grep -r`
run from the repo root are trustworthy, because a `grep` that finds nothing has actually searched
everywhere a match could be.

**Obiettivo**: establish whether the interactive shell's `grep` reaches gitignored paths
(`node_modules` in particular), since a negative result from a search that cannot reach its
subject is indistinguishable from a genuine absence.

---

## Misura

```
$ type grep
grep is a function
grep (...) { ... ugrep --ignore-files ... }
```

`grep` in this shell is a function wrapping `ugrep --ignore-files`, not the system `grep`/BSD
`grep` binary.

```
$ grep -rn "(a)" --include="*.md" .
```

Returns **513 lines**, none of them from `node_modules`. Adding `--exclude-dir=node_modules`
changes nothing — the flag is already redundant, because `--ignore-files` (the wrapper's default)
has already excluded every gitignored path, `node_modules` included, before `--exclude-dir` would
have had anything to add.

An explicitly named path *inside* a gitignored directory is still searched (`grep` on a literal
path bypasses the recursive gitignore-walk logic) — so the failure mode is specific to a recursive
search from a root that contains the ignored directory, not to `grep` in general.

## Conclusione

A search that cannot reach its subject returns the same silence as a subject that is not there.
"Nothing found" is only evidence of absence when the search's reach has been checked — a positive
control (searching for something known to be present) is one way to check it, but the control must
run through the *same* tool as the search it validates: an interactive `grep` positive-controlled
by `command grep` (the BSD binary, which honours `--exclude-dir`) would not have detected this,
because the two resolve differently.

## Dipendenze e rischi

- Any prior or future "grep found nothing under X" claim made with the interactive `grep` and a
  search root above a gitignored directory should be treated as unverified until re-run with
  `command grep` or an explicit path inside the ignored directory.
- `--include=<glob>` has a separate, unrelated failure mode covered in root `CLAUDE.md` §5,
  "Sub-rule: the interactive `grep` is not the system `grep`" (not moved here — out of scope for
  this relocation, since that subsection was not named for compression).

## Domande aperte

None outstanding for this specific measurement; it is closed and stable (re-affirmed structurally
by the sibling sub-rule in CLAUDE.md §5).
