#!/bin/sh
# run.sh <tag> <mode> <plugin-dir|none> <prompt-text>  — one probe session, lane-run's flags (RC-19/RC-20).
tag="$1"; mode="$2"; pdir="$3"; prompt="$4"
O=/tmp/jjodel-mods-probe/out/$tag; mkdir -p "$O"
plug=""; [ "$pdir" != none ] && plug="--plugin-dir $pdir"
cd /Users/alfonso/jjodel-w-mods || exit 9
start=$(node -e 'console.log(Date.now())')
printf '%s' "$prompt" | env -u CLAUDECODE -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_CODE_MESSAGING_SOCKET \
  -u CLAUDE_CODE_MESSAGING_TOKEN -u CLAUDE_PID -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_CODE_EXECPATH -u CLAUDE_CODE_SESSION_ATTENDED \
  JJPROBE_MODE="$mode" JJPROBE_OUT="$O/probe.jsonl" JJPROBE_SETTINGS_OUT="$O/settings-hook.log" ${EXTRA_ENV} \
  ${CLAUDE_BIN:-/Users/alfonso/.local/bin/claude} -p --output-format stream-json --verbose --permission-mode bypassPermissions \
  --model claude-haiku-5-5 --max-turns ${MAX_TURNS:-4} $plug --settings /tmp/jjodel-mods-probe/order-settings.json \
  --debug-file "$O/debug.log" ${EXTRA_FLAGS} > "$O/stream.jsonl" 2> "$O/stderr.txt"
code=$?
end=$(node -e 'console.log(Date.now())')
echo "{\"tag\":\"$tag\",\"mode\":\"$mode\",\"exit\":$code,\"start\":$start,\"end\":$end,\"ms\":$((end-start))}" > "$O/run.json"
cat "$O/run.json"
