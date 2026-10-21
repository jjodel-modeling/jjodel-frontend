# Tack contract v1

Two JSON Schema 2020-12 documents describe the two records an adopting repository can keep:

- `unit.json`: the **identity layer**, one record per unit of work. Not read by `tack check` in
  slice 1 (the identity collector arrives in slice 6); the schema is the contract it will follow.
- `entry.json`: the **self-assessment layer**, one line of `.tack/log.jsonl`. This is what
  `tack check` validates.

A third document, `settings.json`, is the schema of the Tack settings files (user, project, local);
see the Settings section of `tack/README.md`.

The log is append-only JSON Lines, one object per line, blank lines ignored. Entries are never
amended; a correction is a new entry whose `corrects` names the earlier unit.

## Entry fields

"Origin" is the field of the Jjodel log format (`CLAUDE.md` section 21.2) it derives from.

Common to both types:

| Field | Type | Required | Meaning | Origin |
|---|---|---|---|---|
| `contract` | `1` | yes | contract version; older history is contract 0 and unvalidated | replaces the lint-from dates |
| `type` | `"task"` or `"ticket"` | yes | kind of entry | heading `type:` for the two entry types |
| `date` | `YYYY-MM-DD` | yes | calendar date of the entry | heading date |
| `title` | string, 1 to 200 chars | yes | short description | heading short description |
| `unit` | unit id, in the trace source's syntax (`ids.unit`) | task: yes; ticket: no | id of the unit of work | `Prompt document name`, replaced by the identity key |
| `notes` | string, up to 500 chars | no | free notes | `Notes` |

Type `task`:

| Field | Type | Required | Meaning | Origin |
|---|---|---|---|---|
| `kind` | string | no | free label for the sort of work | heading `type:` label |
| `summary` | string, non-empty | yes | what was asked | `Prompt` |
| `files` | array of strings | no | files touched (derivable from git) | `Files touched` |
| `outcome` | `completed`, `partial`, `problems` | yes | result | `Outcome` (emoji to enum) |
| `corrects` | unit id or `null` | yes | the unit this one remedies | `Corregge` (now an id) |
| `cause` | `a`..`g` or `null` | yes | prevailing cause, taxonomy of section 21.3 | `Causa` |
| `regressions` | `yes`, `no`, `unknown` | yes | did the change break something | `Regressions` |
| `out_of_scope` | boolean | yes | files touched beyond what was asked | `Out-of-scope changes` |

Type `ticket`:

| Field | Type | Required | Meaning | Origin |
|---|---|---|---|---|
| `finding` | string, non-empty | yes | the finding | `Ticket` |
| `priority` | `high`, `medium`, `low` | yes | urgency | `Priority` |
| `found_in` | unit or conversation id, in the trace source's syntax (`ids.ref`) | yes | unit or conversation that found it | `Found in` |
| `detail` | string, non-empty | no | path of the evidence document | `Detail` |

Unknown fields are allowed and ignored (forward compatibility).

## Cause taxonomy

`a` ambiguous or incomplete specification; `b` scope exceeded; `c` insufficient discovery or wrong
assumption; `d` visual regression found late; `e` conflict with uncommitted git state; `f`
architectural decision changed midway; `g` environmental or operational.

## Which rules are structural, which referential

**Structural** (one line at a time, equivalent to the schema; `tack check` pass 1): `json-syntax`,
`contract-version`, `type-enum`, `date-format`, `title-length`, `unit-required`, `unit-format`,
`notes-length`, `field-required`, `outcome-enum`, `regressions-enum`, `out-of-scope-type`,
`files-type`, `corrects-format`, `cause-vocabulary`, `priority-enum`, `found-in-format`,
`detail-empty`.

**Referential** (across lines or between fields; `tack check` pass 2, run only on lines that passed
pass 1, so one defect is reported once):

| Rule | Meaning |
|---|---|
| `unit-duplicate` | a task unit id appears on more than one line |
| `corrects-unresolved` | `corrects` names a unit that is not the `unit` of an earlier task line |
| `cause-required` | `cause` is `null` although `outcome` is `partial` or `problems`, or `corrects` is set |
| `cause-forbidden` | `cause` is set although `outcome` is `completed` and `corrects` is `null` |

The two `cause` rules express section 21.3 («Otherwise `—`»); no gate of the Jjodel log checks
them today.

## Commit linkage

A commit belongs to a unit when its message carries the trailer `Unit: <id>` (canonical) or ends
its subject with ` (<id>)` (alias). The log entry itself holds no commit data.
