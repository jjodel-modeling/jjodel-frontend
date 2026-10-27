// Tack board, Settings view (/settings or #settings): every key with its effective value and the level it comes
// from. A change is written at once through POST /api/settings to the user file, or, for a notification row, to
// the repository's tack.local.json when the row says so; project keys are shown read-only with the path of
// tack.json, which the board never writes. Appearance applies live on <html>. html() is pure.
'use strict';
(function (root) {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const LEVEL_TAG = { default: 'default', user: 'user', project: 'tack.json', local: 'tack.local.json' };

  function select(key, field, options, value) {
    return '<select data-key="' + esc(key) + '"' + (field ? ' data-field="' + esc(field) + '"' : '') + '>' +
      options.map((o) => '<option' + (o === value ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
  }
  const check = (key, field, on, label) => '<label class="chk"><input type="checkbox" data-key="' + esc(key) + '"' + (field ? ' data-field="' + esc(field) + '"' : '') + (on ? ' checked' : '') + '> ' + esc(label) + '</label>';
  const text = (key, field, value, attrs = '') => '<input type="text" data-key="' + esc(key) + '"' + (field ? ' data-field="' + esc(field) + '"' : '') + ' value="' + esc(value ?? '') + '" ' + attrs + '>';
  const src = (e) => '<span class="tag st-' + esc(e.source) + '" title="Where the effective value comes from">' + esc(LEVEL_TAG[e.source]) + '</span>';

  /** The view's HTML from the GET /api/settings payload. */
  function html(d) {
    const K = Object.fromEntries(d.keys.map((e) => [e.key, e]));
    const v = (k) => K[k].value;
    const row = (label, control, k) => '<div class="se-row"><span class="se-l">' + esc(label) + '</span><span class="se-c">' + control + '</span>' + (k ? src(K[k]) : '') + '</div>';
    const f = d.files;
    const out = [];
    out.push('<div class="se-files"><div><span class="se-l">User</span><span class="mono">' + esc(f.user.path) + '</span>' + (f.user.exists ? '' : ' <span class="dim">(not created yet)</span>') + '</div>' +
      '<div><span class="se-l">Project</span>' + (f.project.path ? '<span class="mono">' + esc(f.project.path) + '</span> <span class="dim">read-only here: versioned, edit and commit it</span>' : '<span class="dim">pick a repository with a work tree</span>') + '</div>' +
      '<div><span class="se-l">Local</span>' + (f.local.path ? '<span class="mono">' + esc(f.local.path) + '</span>' + (f.local.ignored === true ? ' <span class="dim">git-ignored</span>' : f.local.ignored === false ? ' <span class="se-warn">not git-ignored</span>' : '') : '<span class="dim">–</span>') + '</div></div>');
    if (d.warning) out.push('<div class="se-warn se-banner">' + esc(d.warning) + '</div>');
    if (d.violations.length) out.push('<div class="se-warn se-banner">' + d.violations.map((x) => esc(x.file + ': ' + x.key + ' ' + x.rule + ': ' + x.message + ' (ignored)')).join('<br>') + '</div>');
    out.push('<h2>Appearance</h2><div class="se-card">' +
      row('Theme', select('appearance.theme', null, ['system', 'light', 'dark', 'high-contrast'], v('appearance.theme')), 'appearance.theme') +
      row('Density', select('appearance.density', null, ['comfortable', 'compact'], v('appearance.density')), 'appearance.density') +
      row('Font scale', '<input type="number" min="0.8" max="1.5" step="0.05" data-key="appearance.fontScale" value="' + esc(v('appearance.fontScale')) + '">', 'appearance.fontScale') +
      row('Motion', select('appearance.reducedMotion', null, ['system', 'reduce', 'no-preference'], v('appearance.reducedMotion')), 'appearance.reducedMotion') +
      row('Load per core', check('appearance.loadNormalised', null, v('appearance.loadNormalised'), 'divide host load by the core count'), 'appearance.loadNormalised') + '</div>');
    out.push('<h2>Locale</h2><div class="se-card">' +
      row('Time zone', text('locale.timeZone', null, v('locale.timeZone'), 'placeholder="system"'), 'locale.timeZone') +
      row('Dates', select('locale.dateFormat', null, ['iso', 'locale'], v('locale.dateFormat')), 'locale.dateFormat') + '</div>');
    const nt = v('channels.ntfy');
    out.push('<h2>Channels</h2><div class="se-card">' +
      row('Desktop', check('channels.desktop', 'enabled', v('channels.desktop').enabled, 'macOS notification') + ' <button type="button" class="btn" data-test="desktop">Send test</button>', 'channels.desktop') +
      row('ntfy', check('channels.ntfy', 'enabled', nt.enabled, 'on') + ' ' + text('channels.ntfy', 'server', nt.server, 'aria-label="ntfy server"') + ' ' + text('channels.ntfy', 'topic', nt.topic, 'aria-label="ntfy topic" placeholder="topic"') +
        ' <input type="password" data-key="channels.ntfy" data-field="token" aria-label="ntfy token" placeholder="token (optional)" value="' + esc(nt.token ?? '') + '"> <button type="button" class="btn" data-test="ntfy">Send test</button>', 'channels.ntfy') +
      row('Quiet hours', check('quietHours', 'enabled', v('quietHours').enabled, 'on') + ' <input type="time" data-key="quietHours" data-field="start" value="' + esc(v('quietHours').start) + '"> to <input type="time" data-key="quietHours" data-field="end" value="' + esc(v('quietHours').end) + '"> <span class="dim">one digest when they end; urgent events pass</span>', 'quietHours') +
      row('Privacy', check('privacy.repoName', null, v('privacy.repoName'), 'repository name') + ' ' + check('privacy.boardLink', null, v('privacy.boardLink'), 'board link'), null) +
      '<div class="se-row"><span class="se-l"></span><span class="se-c dim" id="se-test"></span></div></div>');
    const ev = d.catalogue.map((c) => {
      if (c.disabled) return '<tr class="se-off"><td>' + esc(c.label) + '</td><td colspan="5" class="dim">' + esc(c.disabled) + '</td></tr>';
      const k = 'notifications.events.' + c.kind, e = K[k], r = e.value;
      const scope = r.scope ?? { kind: 'all', values: [] };
      const ch = r.channels ?? [];
      const target = e.source === 'local' ? 'local' : 'user';
      return '<tr data-row="' + esc(k) + '"><td>' + esc(c.label) + (c.urgent ? ' <span class="tag se-urgent" title="Passes quiet hours">urgent</span>' : '') + '</td>' +
        '<td>' + check(k, 'enabled', r.enabled, '') + '</td>' +
        '<td>' + (c.lane ? select(k, 'scope.kind', ['all', 'fronts', 'chats'], scope.kind) + ' ' + text(k, 'scope.values', (scope.values ?? []).join(', '), 'aria-label="Fronts or chats, comma-separated"' + (scope.kind === 'all' ? ' hidden' : '')) : '<span class="dim">–</span>') + '</td>' +
        '<td>' + check(k, 'channels.desktop', ch.includes('desktop'), 'desktop') + ' ' + check(k, 'channels.ntfy', ch.includes('ntfy'), 'ntfy') + '</td>' +
        '<td>' + src(e) + '</td>' +
        '<td><select data-target="' + esc(k) + '" aria-label="Write to">' + '<option value="user"' + (target === 'user' ? ' selected' : '') + '>user</option><option value="local"' + (target === 'local' ? ' selected' : '') + (f.local.path ? '' : ' disabled') + '>tack.local.json</option></select>' +
        (e.source === 'user' || e.source === 'local' ? ' <button type="button" class="btn" data-reset="' + esc(k) + '" data-level="' + esc(e.source) + '">Reset</button>' : '') + '</td></tr>';
    });
    out.push('<h2>Notifications</h2><div class="wrap"><table class="se-ev"><thead><tr><th>Event</th><th>On</th><th>Scope (lane events)</th><th>Channels</th><th>From</th><th>Write to</th></tr></thead><tbody>' + ev.join('') + '</tbody></table></div>');
    const proj = d.keys.filter((e) => e.levels.length === 1 && e.levels[0] === 'project');
    out.push('<h2>Project <span class="h2n">' + esc(f.project.path ?? 'no repository selected') + '</span></h2><div class="wrap"><table class="se-ev"><thead><tr><th>Key</th><th>Value</th><th>From</th></tr></thead><tbody>' +
      proj.map((e) => '<tr><td class="mono">' + esc(e.key) + '</td><td class="mono">' + esc(JSON.stringify(e.value)) + '</td><td>' + src(e) + '</td></tr>').join('') + '</tbody></table></div>');
    return out.join('');
  }

  /** The new value of a key after one control changed: whole keys are replaced, fields set inside a copy. */
  function nextValue(current, field, raw) {
    if (!field) return raw;
    const v = JSON.parse(JSON.stringify(current ?? {}));
    if (field.startsWith('channels.')) {
      const name = field.slice(9), set = new Set(v.channels ?? []);
      if (raw) set.add(name); else set.delete(name);
      v.channels = ['desktop', 'ntfy'].filter((c) => set.has(c));
      return v;
    }
    if (field === 'scope.kind') { v.scope = { kind: raw, values: raw === 'all' ? [] : (v.scope && v.scope.values) || [] }; return v; }
    if (field === 'scope.values') { v.scope = { kind: (v.scope && v.scope.kind) || 'all', values: String(raw).split(',').map((s) => s.trim()).filter(Boolean) }; return v; }
    v[field] = raw === '' && (field === 'topic' || field === 'token') ? null : raw;
    return v;
  }

  root.TackSettings = { html, nextValue };
  root.TackViews = root.TackViews || {};
  if (typeof document === 'undefined') return;

  const repo = () => new URL(location.href).searchParams.get('repo') || 'all';
  let data = null;

  function apply(d) {
    const K = Object.fromEntries(d.keys.map((e) => [e.key, e.value]));
    const h = document.documentElement;
    h.dataset.theme = K['appearance.theme']; h.dataset.density = K['appearance.density']; h.dataset.motion = K['appearance.reducedMotion'];
    h.style.setProperty('--font-scale', K['appearance.fontScale']);
  }

  async function post(path, body) {
    const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || r.status);
    return j;
  }

  function draw(el, d) {
    data = d;
    el.innerHTML = html(d);
    el.dataset.repo = repo();
    apply(d);
  }

  async function write(el, body) {
    try { draw(el, await post('/api/settings', { repo: repo() === 'all' ? null : repo(), ...body })); }
    catch (e) { const t = el.querySelector('#se-test'); if (t) t.textContent = 'Not saved: ' + e.message; else alert('Not saved: ' + e.message); }
  }

  function wire(el) {
    if (el.dataset.wired) return;
    el.dataset.wired = '1';
    el.addEventListener('change', (ev) => {
      const c = ev.target;
      if (c.dataset.target) return;
      const key = c.dataset.key;
      if (!key || !data) return;
      const cur = data.keys.find((e) => e.key === key);
      const raw = c.type === 'checkbox' ? c.checked : c.type === 'number' ? Number(c.value) : c.value;
      const tr = c.closest('tr[data-row]');
      const target = tr ? tr.querySelector('select[data-target]').value : 'user';
      write(el, { target, key, value: nextValue(cur.value, c.dataset.field || null, raw) });
    });
    el.addEventListener('click', async (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.reset) write(el, { target: b.dataset.level, key: b.dataset.reset, op: 'reset' });
      if (b.dataset.test) {
        const t = el.querySelector('#se-test');
        t.textContent = 'Sending a test on ' + b.dataset.test + '…';
        try { await post('/api/notify-test', { channel: b.dataset.test }); t.textContent = 'Test sent on ' + b.dataset.test + '.'; }
        catch (e) { t.textContent = 'Test on ' + b.dataset.test + ' failed: ' + e.message; }
      }
    });
  }

  root.TackViews.settings = {
    async render(state, el) {
      wire(el);
      if (data && el.dataset.repo === repo()) return;
      try {
        const r = await fetch('/api/settings?repo=' + encodeURIComponent(repo()), { cache: 'no-store' });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || r.status);
        draw(el, d);
      } catch (e) { el.innerHTML = '<div class="err">Could not load the settings: ' + esc(e.message) + '</div>'; }
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
