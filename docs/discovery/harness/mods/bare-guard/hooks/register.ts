// Scratch probe, P-2026-10-11-1745: a guard meant to deny `git log -1 --oneline`, with no .catch.
// JJPROBE_MODE=throwbare throws before deciding, hangbare never decides; the engine's default decides.
import type { Register } from 'claude-code'

let mode = 'throwbare'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    mode = (await $.env.get('JJPROBE_MODE')) || mode
    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (!/git log -1 --oneline/.test(e.command)) return next(e)
    if (mode === 'throwbare') throw new Error('jjbare: guard crashed before deciding')
    if (mode === 'hangbare') await new Promise(() => {})
    return { deny: 'jjbare: git log -1 is refused by the guard' }
  })
}
