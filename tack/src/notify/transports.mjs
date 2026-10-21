// The two channels of v0 behind one interface: { name, send(message) -> Promise }. A message is the
// output of buildMessage (title, body, click, urgent) and nothing else. The desktop channel runs osascript
// with execFile and the message as arguments of `on run argv`: no shell, and no event text inside the
// script source. ntfy is a fetch POST. Both take their process primitive by injection, so tests never send.
import { execFile as nodeExecFile } from 'node:child_process';

/** The osascript argv of a desktop notification: a fixed script, title and body as run arguments. */
export const desktopArgs = (m) => ['-e', 'on run argv', '-e', 'display notification (item 2 of argv) with title (item 1 of argv)', '-e', 'end run', m.title, m.body];

export function desktopTransport({ execFile = nodeExecFile, platform = process.platform } = {}) {
  return {
    name: 'desktop',
    send: (m) => new Promise((resolve, reject) => {
      if (platform !== 'darwin') return reject(new Error('desktop notifications need macOS (osascript)'));
      execFile('osascript', desktopArgs(m), { timeout: 10_000 }, (err) => (err ? reject(err) : resolve()));
    }),
  };
}

const ascii = (s) => String(s).replace(/[^\x20-\x7E]/g, '-');

/** The fetch request of an ntfy message: POST <server>/<topic>, the body as text, metadata in headers. */
export function ntfyRequest(m, { server = 'https://ntfy.sh', topic, token = null }) {
  const headers = { Title: ascii(m.title), Priority: m.urgent ? '5' : '3', 'Content-Type': 'text/plain; charset=utf-8' };
  if (m.click) headers.Click = ascii(m.click);
  if (token) headers.Authorization = `Bearer ${token}`;
  return { url: `${server.replace(/\/+$/, '')}/${encodeURIComponent(topic)}`, init: { method: 'POST', headers, body: m.body } };
}

export function ntfyTransport({ fetch = globalThis.fetch, config }) {
  return {
    name: 'ntfy',
    send: async (m) => {
      if (!config || !config.topic) throw new Error('ntfy has no topic: set channels.ntfy.topic in the user settings');
      const { url, init } = ntfyRequest(m, config);
      const r = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
      if (!r.ok) throw new Error(`ntfy answered ${r.status}`);
    },
  };
}

/** The real transports of a user's settings; ntfy reads its configuration when it sends. */
export function defaultTransports(settings) {
  return {
    desktop: desktopTransport(),
    ntfy: { name: 'ntfy', send: (m) => ntfyTransport({ config: settings().value('channels.ntfy') }).send(m) },
  };
}
