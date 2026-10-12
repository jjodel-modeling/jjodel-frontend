# Guard probe

Prompt-ID: P-2099-01-01-0001
Chat: C-2099-01-01-0000

## Lane discipline
Every reply of this session opens with `[P-2099-01-01-0001 · session <id>]`, where <id> is any short token.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.

## COSA
Reply with the single word `ready` (after the prefix), then the Outcome line with `done`. Call no tool.
