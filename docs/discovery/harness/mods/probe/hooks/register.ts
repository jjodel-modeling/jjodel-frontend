// Scratch probe, P-2026-10-11-1745. Loaded only with --plugin-dir; mode from JJPROBE_MODE.
// Every event it sees is appended to an in-memory list and the whole list rewritten to
// $JJPROBE_OUT (default /tmp/jjodel-mods-probe/out/probe.jsonl) after each entry.
import type { Register, EngineInterface } from 'claude-code'

const lines: string[] = []
let out = '/tmp/jjodel-mods-probe/out/probe.jsonl'
let mode = 'pass'
let folded: readonly string[] = []
const PROBE_EDIT = /JJPROBE_NONEXISTENT_STRING/

async function log($: EngineInterface, ev: string, data: Record<string, unknown> = {}) {
  lines.push(JSON.stringify({ t: Date.now(), ev, mode, ...data }))
  try { await $.fs.write(out, lines.join('\n') + '\n') } catch { /* logging must not change the measure */ }
}

function isProbeCmd(c: string) {
  return /git stash list|git commit -m jjprobe/.test(c)
}

function tiers(trace: readonly unknown[] | undefined) {
  return (trace ?? []).map((x: any) => ({ tier: x?.tier, plugin: x?.plugin }))
}

export const register: Register = on => {
  on('engine.create', async ($, e, next) => {
    folded = e.plugins
    return next(e)
  })

  on('session.start', async ($, e, next) => {
    mode = (await $.env.get('JJPROBE_MODE')) || 'pass'
    out = (await $.env.get('JJPROBE_OUT')) || out
    await log($, 'session.start', { cwd: e.cwd, version: await $.session.version(), engineCreatePlugins: folded })
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await log($, 'prompt.submit', { head: e.text.slice(0, 60), origin: e.origin })
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await log($, 'turn.start', { turnId: e.turnId })
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    await log($, 'turn.complete', { tail: e.answer.slice(-80), usage: e.usage, durationMs: e.durationMs })
    return r
  })

  on('session.measure', async ($, e, next) => {
    await log($, 'session.measure', { context: e.context, changed: e.changed, cost: e.cost })
    return next(e)
  })

  on('classic.PreToolUse', async ($, e, next) => {
    await log($, 'classic.PreToolUse:enter', { tool: e.tool })
    const r = await next(e)
    await log($, 'classic.PreToolUse:exit', { r })
    return r
  })

  on('tool.check', async ($, e, next) => {
    const r = await next(e)
    await log($, 'tool.check', { tool: e.tool, input: e.input, verdict: r, trace: tiers(next.trace) })
    if (mode === 'allow' && e.tool === 'Bash' && isProbeCmd(String((e.input as any)?.command ?? ''))) {
      await log($, 'tool.check:override-allow')
      return { decision: 'allow', reason: 'jjprobe allow override' }
    }
    return r
  })

  // czcheck: read the verdict beneath for an Edit (critical-zone included), then refuse it whatever it was.
  on('tool.check', { tool: 'Edit' }, async ($, e, next) => {
    const r = await next(e)
    await log($, 'tool.check:edit-verdict-beneath', { verdict: r })
    return { decision: 'deny', reason: 'jjprobe: Edit refused at tool.check after reading the verdict beneath' }
  }).catch(() => ({ decision: 'deny', reason: 'jjprobe: Edit guard failed' }))

  // Safety net: no file tool runs in a probe session except the one no-op probe Edit.
  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    await log($, 'tool.call:file-denied', { tool: e.tool, file: e.file_path })
    return { deny: 'jjprobe: file tools are off in a probe session' }
  }).catch(() => ({ deny: 'jjprobe: file guard failed' }))

  on('tool.call', { tool: 'NotebookEdit' }, async ($, e, next) => {
    await log($, 'tool.call:file-denied', { tool: e.tool })
    return { deny: 'jjprobe: file tools are off in a probe session' }
  }).catch(() => ({ deny: 'jjprobe: file guard failed' }))

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    if (!PROBE_EDIT.test(String(e.old_string)) && mode !== 'czcheck') {
      await log($, 'tool.call:file-denied', { tool: e.tool, file: e.file_path })
      return { deny: 'jjprobe: file tools are off in a probe session' }
    }
    await log($, 'tool.call:edit-enter', { file: e.file_path })
    const r = await next(e)
    await log($, 'tool.call:edit-exit', { deny: r.deny, isError: r.isError, text: String(r.text ?? '').slice(0, 300) })
    return r
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'jjprobe: file guard failed' }))

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const cmd = e.command
    await log($, 'tool.call:enter', { cmd })
    if (isProbeCmd(cmd)) {
      if (mode === 'answer') {
        await log($, 'tool.call:answer-fabricated')
        return { result: { stdout: 'jjprobe answered without running anything', stderr: '', interrupted: false } }
      }
      if (mode === 'run') {
        const r = await $.process.run(['git', 'stash', 'list'])
        await log($, 'tool.call:answer-process-run', { exitCode: r.exitCode, stdoutLen: r.stdout.length })
        return { result: { stdout: `jjprobe ran it through $.process.run: exit ${r.exitCode}, ${r.stdout.split('\n').filter(Boolean).length} stash entries`, stderr: r.stderr, interrupted: false } }
      }
      if (mode === 'throw' || mode === 'throwcatch') {
        await log($, 'tool.call:throwing')
        throw new Error('jjprobe deliberate throw')
      }
      if (mode === 'hang' || mode === 'hangcatch') {
        await log($, 'tool.call:hanging')
        await new Promise(() => {})
      }
    }
    const r = await next(e)
    await log($, 'tool.call:exit', { deny: r.deny, isError: r.isError, text: String(r.text ?? '').slice(0, 300), trace: tiers(next.trace) })
    return r
  }).catch(async ($, e, next) => {
    // Fails closed only in the *catch modes; elsewhere it replays (or runs) what is beneath.
    lines.push(JSON.stringify({ t: Date.now(), ev: 'tool.call:catch', mode, error: (next as any).error, called: next.called }))
    if (mode === 'throwcatch' || mode === 'hangcatch') return { deny: 'jjprobe: guard failed, failing closed' }
    return next(e)
  })

  // throwbare / hangbare: the same failures on a hook with no .catch, the engine's own default.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (isProbeCmd(e.command) && mode === 'throwbare') {
      await log($, 'tool.call(bare):throwing')
      throw new Error('jjprobe deliberate throw, no catch')
    }
    if (isProbeCmd(e.command) && mode === 'hangbare') {
      await log($, 'tool.call(bare):hanging')
      await new Promise(() => {})
    }
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    await log($, 'session.end', { reason: e.reason })
    return next(e)
  })
}
