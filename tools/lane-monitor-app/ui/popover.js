// Lane Monitor popover: renders the snapshot the Rust poller pushes ("attention" event).
// No framework, no network: the board is read by the app, never by this page.
'use strict';

const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const MAX_WAITING = 4;
const KIND_LABEL = { question: 'question', 'hard-stop': 'hard stop', blocked: 'blocked' };
const $ = (id) => document.getElementById(id);

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function hhmm(ms) {
  const d = new Date(ms);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function age(since) {
  if (!since) return '';
  const min = Math.max(0, Math.floor((Date.now() - since) / 60000));
  if (min < 1) return 'now';
  if (min < 60) return min + 'm';
  const h = Math.floor(min / 60);
  return h < 48 ? h + 'h' : Math.floor(h / 24) + 'd';
}

function setCount(id, value) {
  const node = $(id);
  node.textContent = value == null ? '–' : String(value);
  node.classList.toggle('zero', value === 0);
}

function statusOf(snap) {
  const a = snap.attention;
  switch (snap.state) {
    case 'ok': {
      const board = (a && a.board) || 'ok';
      if (board.startsWith('error')) return ['dot-error', 'synced ' + hhmm(snap.syncedAt) + ', board error'];
      if (board === 'refreshing' || (a && a.stale)) return ['dot-refreshing', 'synced ' + hhmm(snap.syncedAt) + ', refreshing'];
      return ['dot-ok', 'synced ' + hhmm(snap.syncedAt)];
    }
    case 'unreachable':
    case 'error':
      return ['dot-error', snap.syncedAt ? 'last synced ' + hhmm(snap.syncedAt) : 'not synced'];
    case 'too-old':
      return ['dot-warn', 'not synced'];
    default:
      return ['dot-pending', 'connecting'];
  }
}

function noticeOf(snap) {
  switch (snap.state) {
    case 'unreachable': return ['error', 'Board unreachable at ' + snap.boardUrl + ' (' + snap.detail + ').'];
    case 'too-old': return ['warn', 'Board too old: update the release tree.'];
    case 'error': return ['error', 'Board error: ' + snap.detail];
    default: {
      const board = snap.attention && snap.attention.board;
      return board && board.startsWith('error') ? ['error', 'Board ' + board] : null;
    }
  }
}

function waitingRow(item) {
  const li = el('li');
  const row = el('button', 'row');
  row.type = 'button';
  row.dataset.id = item.id;
  const kind = item.kind || 'question';
  row.append(
    el('span', 'id mono', item.id),
    el('span', 'kind kind-' + kind, KIND_LABEL[kind] || kind),
    el('span'),
    el('span', 'age', age(item.since)),
    el('span', 'line', item.firstLine || item.title || ''),
  );
  const tip = [item.title, item.recommended && 'Recommended: ' + item.recommended].filter(Boolean);
  if (tip.length) row.title = tip.join('\n');
  row.setAttribute('aria-label', item.id + ', ' + (KIND_LABEL[kind] || kind) + ', ' + age(item.since) + ': ' + (item.firstLine || ''));
  row.addEventListener('click', () => openMonitor(item.id));
  li.append(row);
  return li;
}

function runningRow(item) {
  const li = el('li', 'row');
  const meta = [item.laneKind, item.phase].filter(Boolean).join(' · ');
  li.append(el('span', 'id mono', item.id), el('span', 'meta', meta), el('span'), el('span', 'left', item.left || ''));
  if (item.title) li.title = item.title;
  return li;
}

function render(snap) {
  const [dot, synced] = statusOf(snap);
  $('dot').className = 'dot ' + dot;
  $('synced').textContent = synced;

  const notice = noticeOf(snap);
  $('notice').hidden = !notice;
  if (notice) {
    $('notice').className = 'notice ' + notice[0];
    $('notice').textContent = notice[1];
  }

  const a = snap.state === 'ok' ? snap.attention : null;
  setCount('n-waiting', a ? a.waiting : null);
  setCount('n-blocked', a ? a.blocked : null);
  setCount('n-running', a ? a.running : null);

  $('waiting-sec').hidden = !a;
  $('running-sec').hidden = !a;
  $('stale').hidden = !(a && a.staleCount > 0);
  if (a) {
    const items = a.items || [];
    const list = $('waiting-list');
    list.replaceChildren(...items.slice(0, MAX_WAITING).map(waitingRow));
    if (!items.length) list.append(el('li', 'empty', 'Nothing waiting.'));
    const rest = items.length - MAX_WAITING;
    $('more').hidden = rest <= 0;
    $('more').textContent = rest + ' more in the monitor';

    if (a.staleCount > 0) {
      const days = a.staleOldest ? Math.floor((Date.now() - a.staleOldest) / 86400000) : null;
      $('stale').textContent = a.staleCount + ' stale' + (days != null ? ', oldest ' + days + ' d' : '');
    }

    const running = a.runningItems || [];
    $('running-list').replaceChildren(...running.map(runningRow));
    if (!running.length) $('running-list').append(el('li', 'empty', 'Nothing running.'));
  }
  fit();
}

function fit() {
  requestAnimationFrame(() => {
    invoke('fit_popover', { height: $('pop').getBoundingClientRect().height }).catch(() => {});
  });
}

function openMonitor(lane) {
  invoke('open_monitor', { lane: lane || null }).catch((e) => {
    $('notice').hidden = false;
    $('notice').className = 'notice error';
    $('notice').textContent = String(e);
    fit();
  });
}

function showError(e) {
  $('notice').hidden = false;
  $('notice').className = 'notice error';
  $('notice').textContent = String(e);
  fit();
}

// The footer controls: state and reasons come from Rust (restart.rs), never decided here.
function renderLogin(c) {
  $('login').checked = c.on;
  $('login').disabled = !c.enabled;
  $('login-label').title = c.detail;
}

function renderRestart(c) {
  $('restart').disabled = !c.enabled;
  $('restart').title = c.detail;
  // Disabled, the reason is written out: a disabled button shows no tooltip on hover.
  $('restart-why').hidden = c.enabled;
  $('restart-why').textContent = c.enabled ? '' : c.detail;
  fit();
}

$('login').addEventListener('change', () => {
  const want = $('login').checked;
  $('login').disabled = true;
  invoke('set_login', { on: want })
    .then(renderLogin)
    .catch((e) => {
      showError('Start at login: ' + e);
      invoke('login_state').then(renderLogin);
    });
});

$('restart').addEventListener('click', () => {
  $('restart').disabled = true;
  invoke('restart_board')
    .then(() => {
      $('synced').textContent = 'board restarting';
      setTimeout(() => invoke('restart_state').then(renderRestart), 3000);
    })
    .catch((e) => {
      showError('Restart board: ' + e);
      invoke('restart_state').then(renderRestart);
    });
});

// Settings view. Theme, notifications and the login item apply on change; board URL and
// shortcut on Save. Validation, registration and the write are Rust's (config.rs, main.rs);
// this page only shows the answer, field by field.
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme || 'system';
}

function renderSettings(v, fields) {
  applyTheme(v.theme);
  for (const r of document.querySelectorAll('input[name="theme"]')) r.checked = r.value === v.theme;
  $('notifications').checked = v.notifications;
  if (!fields) return;
  $('board').value = v.board;
  $('shortcut').value = v.shortcut;
  $('board-note').hidden = !v.boardNote;
  $('board-note').textContent = v.boardNote || '';
  // Head and tail of the path; the tail is the last two segments, never cut.
  const cut = v.configPath.lastIndexOf('/', v.configPath.lastIndexOf('/') - 1) + 1;
  $('path-head').textContent = v.configPath.slice(0, cut);
  $('path-tail').textContent = v.configPath.slice(cut);
  $('path-line').title = v.configPath;
}

function fieldError(name, text) {
  const node = $(name + '-err');
  node.hidden = !text;
  node.textContent = text || '';
  const input = $(name);
  if (input) input.setAttribute('aria-invalid', text ? 'true' : 'false');
}

function clearErrors() {
  for (const name of ['board', 'shortcut', 'file']) fieldError(name, null);
}

// Resolves with the saved view, or shows each field's error and rejects.
function save(patch) {
  clearErrors();
  $('saved').textContent = '';
  return invoke('save_settings', { patch }).catch((e) => {
    const errs = typeof e === 'object' && e ? e : { file: String(e) };
    fieldError('board', errs.board);
    fieldError('shortcut', errs.shortcut);
    fieldError('file', errs.file);
    fit();
    throw e;
  });
}

function showSettings() {
  $('lanes-view').hidden = true;
  $('status').hidden = true;
  $('gear').hidden = true;
  $('settings-view').hidden = false;
  $('back').hidden = false;
  $('title').textContent = 'Settings';
  clearErrors();
  $('saved').textContent = '';
  invoke('settings').then((v) => { renderSettings(v, true); fit(); });
  invoke('login_state').then(renderLogin);
  fit();
}

function showLanes() {
  $('settings-view').hidden = true;
  $('back').hidden = true;
  $('lanes-view').hidden = false;
  $('status').hidden = false;
  $('gear').hidden = false;
  $('title').textContent = 'Lanes';
  fit();
}

$('gear').addEventListener('click', showSettings);
$('back').addEventListener('click', showLanes);

for (const r of document.querySelectorAll('input[name="theme"]')) {
  r.addEventListener('change', () => {
    const before = document.documentElement.dataset.theme;
    applyTheme(r.value);
    save({ theme: r.value }).then((v) => renderSettings(v, false)).catch(() => applyTheme(before));
  });
}

$('notifications').addEventListener('change', () => {
  const want = $('notifications').checked;
  save({ notifications: want }).then((v) => renderSettings(v, false)).catch(() => { $('notifications').checked = !want; });
});

$('settings-view').addEventListener('submit', (e) => {
  e.preventDefault();
  $('save').disabled = true;
  save({ board: $('board').value, shortcut: $('shortcut').value })
    .then((v) => {
      renderSettings(v, true);
      $('saved').textContent = 'Saved';
      invoke('restart_state').then(renderRestart);
    })
    .catch(() => {})
    .finally(() => { $('save').disabled = false; fit(); });
});

$('open').addEventListener('click', () => openMonitor(null));
$('quit').addEventListener('click', () => invoke('quit'));
$('more').addEventListener('click', () => openMonitor(null));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') invoke('hide_popover');
  // Cmd+Q, when the app menu's key equivalent does not take it first.
  if (e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'q') {
    e.preventDefault();
    invoke('quit');
  }
});

listen('attention', (e) => render(e.payload));
// Each show from the tray or the shortcut opens on the lanes.
listen('shown', () => { if (!$('settings-view').hidden) showLanes(); });
invoke('settings').then((v) => renderSettings(v, false));
// A config or shortcut problem the app found at launch (registration failure included).
invoke('footer_note').then((note) => {
  if (!note) return;
  $('foot-note').textContent = note;
  $('foot-note').hidden = false;
  fit();
});
invoke('login_state').then(renderLogin);
// The agent's plist can change outside the app (removed by hand): read it again on each show.
window.addEventListener('focus', () => invoke('login_state').then(renderLogin));
invoke('restart_state').then(renderRestart);
invoke('current').then(render);
// Ages are relative to now: refresh them while the popover is open.
setInterval(() => { if (!document.hidden) invoke('current').then(render); }, 60000);
