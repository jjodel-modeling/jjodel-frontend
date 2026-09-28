# Decisions digest

One file per day, `<YYYY-MM-DD>.md`: the rows of `docs/decisions.md` dated that day, each with the
confidence it was taken with. Reading the day's file replaces reading the register (RC-25, RC-28).

## How it is generated

From `frontend/`:

```
npm run docs:digest -- --date 2026-09-27           # print, write nothing
npm run docs:digest -- --date 2026-09-27 --write   # write docs/digest/2026-09-27.md
npm run docs:digest -- --all                       # every date that has rows (backfill)
```

`--date` defaults to today, local time. The script only reads the register; a second `--write` on an
unchanged register changes nothing. The first line names the commit the register was last changed in,
and the RC-28 counts: rows of the day, ratified and provisional, the provisional ones by label, and by
`reversible`. Exit 2 lists every row header it cannot parse; fix the register, not the digest.

## Confidence

Computed from the header of the row, `(date, provisional, unattended, evidence: ..., verified: ...,
reversible: ...)`, the grammar of RC-25..27.

| Label | When |
|-------|------|
| ratified | no `provisional` marker |
| high | evidence `measured`, verified `agent` |
| medium | `measured` and `none`, or `read` and `agent` |
| low | evidence `inferred`, or `read` and `none` |
| unmarked | provisional without the three fields (rows before RC-25's grammar) |

`reversible` (`branch`, `trunk`, `persisted`) does not change the label; it is printed beside it,
because a `low` on a branch and a `low` persisted call for different attention. Within a section the
order is low, unmarked, medium, high, then ratified.

## The hand-written section

Everything after the line `<!-- digest:manual -->` is written by the chat (RC-26 items, deviations,
tickets) and preserved verbatim when the file is regenerated. A file in this folder without that
marker is never overwritten.
