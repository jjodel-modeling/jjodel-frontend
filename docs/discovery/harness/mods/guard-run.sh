#!/bin/sh
# guard-run.sh <tag> <first-message-file> [<resume-message-file>...] : one session, then one resume per extra file.
tag="$1"; shift; first="$1"; shift
O=/tmp/jjodel-mods-probe/out/$tag; mkdir -p "$O"
CL="env -u CLAUDECODE -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_CODE_MESSAGING_SOCKET -u CLAUDE_CODE_MESSAGING_TOKEN -u CLAUDE_PID -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_CODE_EXECPATH -u CLAUDE_CODE_SESSION_ATTENDED JJGUARD_MODE=${JJGUARD_MODE:-refuse} JJGUARD_OUT=$O/guard.jsonl /Users/alfonso/.local/bin/claude -p --output-format stream-json --verbose --permission-mode bypassPermissions --model claude-haiku-5-5 --max-turns 4 --plugin-dir /tmp/jjodel-mods-probe/prompt-id-guard --debug-file $O/debug.log"
cd /tmp/jjodel-mods-probe/guard-cwd || exit 9
$CL < "$first" > "$O/run-1.jsonl" 2> "$O/stderr-1.txt"; echo "run 1 exit $?" >> "$O/exits.txt"
sid=$(node -e 'for(const l of require("fs").readFileSync(process.argv[1],"utf8").split("\n")){if(!l)continue;const j=JSON.parse(l);if(j.session_id){console.log(j.session_id);break}}' "$O/run-1.jsonl")
echo "$sid" > "$O/session.txt"
n=1
for f in "$@"; do n=$((n+1)); $CL --resume "$sid" < "$f" > "$O/run-$n.jsonl" 2> "$O/stderr-$n.txt"; echo "run $n exit $?" >> "$O/exits.txt"; done
