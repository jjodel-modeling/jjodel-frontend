// Prompt-ID guard prototype, P-2026-10-11-1745. Scratch; loaded only with --plugin-dir.
// JJGUARD_MODE: refuse (default) drops a user message with a missing or different [P-...] prefix
// and blocks a Stop whose final message breaks the reply rules once; warn only records.
// Every verdict is appended to JJGUARD_OUT (a JSONL file the chat could read), and the session's
// Prompt-ID is kept in $.store under the session id, so a `claude -p --resume` (a new process,
// module variables gone) still knows it.
import type { Register, EngineInterface } from 'claude-code'

const HEADER_ID = /^Prompt-ID: (P-\d{4}-\d{2}-\d{2}-\d{4})\s*$/m
const PREFIX_ID = /^\[(P-\d{4}-\d{2}-\d{2}-\d{4})[\] ]/
const OUTCOME = /^Outcome: (done|hard-stop|question|blocked)$/
let out = '/tmp/jjodel-mods-probe/out/guard.jsonl'
let mode = 'refuse'

async function record($: EngineInterface, check: string, ok: boolean, detail: Record<string, unknown> = {}) {
  // Appends: a resume is a new process, so the file is read back before it is rewritten.
  const line = JSON.stringify({ t: Date.now(), check, ok, mode, ...detail }) + '\n'
  let prior = ''
  try { if (await $.fs.exists(out)) prior = await $.fs.read(out) } catch { /* start a fresh file */ }
  try { await $.fs.write(out, prior + line) } catch { /* the verdict still stands */ }
}

async function storedId($: EngineInterface): Promise<string | undefined> {
  const v = await $.store.get('jjguard:' + (await $.session.id()))
  return typeof v === 'string' ? v : undefined
}

function replyPrefix(id: string) {
  return new RegExp('^\\[' + id + ' · session [^\\]\\s]+\\]')
}

function lastLine(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  return lines.length ? lines[lines.length - 1] : ''
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    mode = (await $.env.get('JJGUARD_MODE')) || 'refuse'
    out = (await $.env.get('JJGUARD_OUT')) || out
    return next(e)
  })

  // Check 1 and 2: the first message names the Prompt-ID; every later one opens with [<same id>].
  on('prompt.submit', async ($, e, next) => {
    const known = await storedId($)
    if (!known) {
      const m = HEADER_ID.exec(e.text) || PREFIX_ID.exec(e.text)
      await record($, 'first-message-id', !!m, { id: m?.[1] })
      if (m) await $.store.set('jjguard:' + (await $.session.id()), m[1])
      return next(e)
    }
    const m = PREFIX_ID.exec(e.text)
    const ok = !!m && m[1] === known
    await record($, 'message-prefix', ok, { expected: known, got: m?.[1] ?? null, head: e.text.slice(0, 40) })
    if (ok || mode === 'warn') return next(e)
    return { drop: `jjguard (P13): this session runs ${known}; a message ${m ? 'with ' + m[1] : 'without a [P-...] prefix'} is not executed.` }
  }).catch(($, e, next) => (next.called ? next(e) : { drop: 'jjguard: the Prompt-ID check failed; message not executed.' }))

  // Check 3: each assistant reply opens with [<id> · session <id>], read on the first text block of each response row.
  on('session.append', { door: 'response' }, async ($, e, next) => {
    const r = await next(e)
    const id = await storedId($)
    const first = (e.message.content as readonly any[]).find(b => b?.type === 'text')
    if (id && first && !e.agentId) await record($, 'reply-prefix', replyPrefix(id).test(String(first.text)), { head: String(first.text).slice(0, 60) })
    return r
  })

  // Check 3 and 4 at the stop: the final message opens with the prefix and ends with one Outcome line.
  on('classic.Stop', async ($, e, next) => {
    const r = await next(e)
    const id = await storedId($)
    const text = String(e.last_assistant_message ?? '')
    const prefixOk = !id || replyPrefix(id).test(text)
    const outcomeOk = OUTCOME.test(lastLine(text))
    await record($, 'final-message', prefixOk && outcomeOk, { prefixOk, outcomeOk, last: lastLine(text).slice(0, 60), stopHookActive: e.stop_hook_active })
    if (prefixOk && outcomeOk) return r
    if (mode === 'warn' || e.stop_hook_active) return r
    const missing = [!prefixOk && `open with [${id} · session <id>]`, !outcomeOk && 'end with one line Outcome: done | hard-stop | question | blocked'].filter(Boolean).join(' and ')
    return { ...r, block: `jjguard (RC-20): the final message must ${missing}. Rewrite the final message.` }
  })
}
