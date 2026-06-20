# Paper build

ACM `acmart` `sigconf`, single-blind (authored). Source: `main.tex`, bibliography `references.bib`.

## Compile

Overleaf: upload `main.tex` and `references.bib`, set compiler to pdfLaTeX, the `acmart` class is
built in. Local TeX Live with `acmart` installed:

```
pdflatex main
bibtex main
pdflatex main
pdflatex main
```

`main.pdf` is the last build (4 pages, compact draft).

## Notes

- Top matter is set for a clean workshop draft (`rightsretained`, no ACM reference block, no
  watermark). Relax for camera-ready once rights and conference metadata are confirmed.
- Author list is a placeholder (Alfonso Pierantonio only). Confirm co-authors before submission; note
  the single-blind conflict if Di Ruscio co-authors (he is on the PC).
- Every entry in `references.bib` is marked for verification. Do not submit unverified citations.
- The draft is currently about extended-abstract length. To reach the 10-page research paper, expand
  sections 4 to 6 and add the full debt-register table (see `../debt-register-firstcut.md`).
