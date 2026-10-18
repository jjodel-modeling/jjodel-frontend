//! Lane Monitor: a menu bar app over the lane board's `GET /api/attention`.
//!
//! The tray shows the `waiting` count as its title beside a monochrome template icon; a left
//! click toggles the popover, a borderless always-on-top 400 px webview placed under the icon
//! and hidden when it loses focus. The poller runs on its own thread every 30 s (and at once
//! when the popover opens) and pushes each snapshot to the tray and to the popover. A lane
//! that starts waiting posts a system notification (`notify.rs`); a click on it opens the
//! monitor on that lane.

mod notify;
mod poll;

use std::sync::mpsc::{self, Receiver, RecvTimeoutError, Sender};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, Rect, RunEvent, State, Url,
    WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
};

use tauri_plugin_notification::NotificationExt;

use poll::Snapshot;

const TRAY_ID: &str = "lanes";
const POPOVER: &str = "popover";
const MONITOR: &str = "monitor";
const POPOVER_W: f64 = 400.0;
const POLL_EVERY: Duration = Duration::from_secs(30);
/// A click on the tray right after the popover hid on blur is the same gesture: ignore it.
const REOPEN_GUARD: Duration = Duration::from_millis(300);

struct Shared {
    board: String,
    /// `LANE_MONITOR_OPEN_POPOVER=1`: the popover opens at launch and stays open on blur.
    pinned: bool,
    snapshot: Mutex<Snapshot>,
    poke: Mutex<Sender<()>>,
    hidden_at: Mutex<Option<Instant>>,
    /// The lane ids of the last good snapshot, for `notify::step`.
    seen: Mutex<notify::Seen>,
}

impl Shared {
    fn poll_now(&self) {
        let _ = self.poke.lock().unwrap().send(());
    }
}

#[tauri::command]
fn current(shared: State<'_, Shared>) -> Snapshot {
    shared.snapshot.lock().unwrap().clone()
}

#[tauri::command]
fn refresh(shared: State<'_, Shared>) {
    shared.poll_now();
}

#[tauri::command]
fn fit_popover(app: AppHandle, height: f64) {
    if let Some(w) = app.get_webview_window(POPOVER) {
        let _ = w.set_size(LogicalSize::new(POPOVER_W, height.clamp(120.0, 680.0)));
    }
}

#[tauri::command]
fn hide_popover(app: AppHandle) {
    hide(&app);
}

#[tauri::command]
async fn open_monitor(app: AppHandle, lane: Option<String>) -> Result<(), String> {
    open_monitor_window(&app, lane.as_deref())
}

/// Opens the board in an app window (1280x860), or brings it back; with a lane id, on the
/// board's `/#lane=<id>` mark.
fn open_monitor_window(app: &AppHandle, lane: Option<&str>) -> Result<(), String> {
    let base = app.state::<Shared>().board.trim_end_matches('/').to_string();
    let url = match lane {
        Some(id) if !id.is_empty() && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') => {
            format!("{base}/#lane={id}")
        }
        Some(id) if !id.is_empty() => return Err(format!("not a lane id: {id}")),
        _ => format!("{base}/"),
    };
    let url: Url = url.parse().map_err(|e| format!("{url}: {e}"))?;
    hide(app);
    if let Some(w) = app.get_webview_window(MONITOR) {
        if lane.is_some() {
            w.navigate(url).map_err(|e| e.to_string())?;
        }
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
        return Ok(());
    }
    WebviewWindowBuilder::new(app, MONITOR, WebviewUrl::External(url))
        .title("Lane board")
        .inner_size(1280.0, 860.0)
        .min_inner_size(800.0, 500.0)
        .center()
        .focused(true)
        .build()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

fn hide(app: &AppHandle) {
    if let Some(w) = app.get_webview_window(POPOVER) {
        let _ = w.hide();
        *app.state::<Shared>().hidden_at.lock().unwrap() = Some(Instant::now());
    }
}

/// Puts the popover under the tray icon, centred on it and kept inside the screen.
fn place(w: &WebviewWindow, rect: Option<Rect>) {
    let app = w.app_handle();
    let fallback = w.scale_factor().unwrap_or(2.0);
    let (x, y, scale) = match rect {
        Some(r) => {
            let pos = r.position.to_physical::<f64>(fallback);
            let size = r.size.to_physical::<f64>(fallback);
            let scale = app
                .monitor_from_point(pos.x, pos.y)
                .ok()
                .flatten()
                .map(|m| m.scale_factor())
                .unwrap_or(fallback);
            let x = pos.x + size.width / 2.0 - POPOVER_W * scale / 2.0;
            (x, pos.y + size.height + 6.0 * scale, scale)
        }
        None => match app.primary_monitor().ok().flatten() {
            Some(m) => {
                let s = m.scale_factor();
                let right = m.position().x as f64 + m.size().width as f64;
                (right - (POPOVER_W + 12.0) * s, m.position().y as f64 + 30.0 * s, s)
            }
            None => (0.0, 30.0, fallback),
        },
    };
    let x = match app.monitor_from_point(x.max(0.0), y).ok().flatten() {
        Some(m) => {
            let left = m.position().x as f64 + 8.0 * scale;
            let right = m.position().x as f64 + m.size().width as f64 - (POPOVER_W + 8.0) * scale;
            x.clamp(left, right.max(left))
        }
        None => x,
    };
    let _ = w.set_position(PhysicalPosition::new(x, y));
}

fn show(app: &AppHandle, rect: Option<Rect>) {
    let Some(w) = app.get_webview_window(POPOVER) else { return };
    place(&w, rect);
    let _ = w.show();
    let _ = w.set_focus();
    app.state::<Shared>().poll_now();
}

fn toggle(app: &AppHandle, rect: Rect) {
    let Some(w) = app.get_webview_window(POPOVER) else { return };
    if w.is_visible().unwrap_or(false) {
        hide(app);
        return;
    }
    let recently = app.state::<Shared>().hidden_at.lock().unwrap().map(|t| t.elapsed() < REOPEN_GUARD);
    if recently != Some(true) {
        show(app, Some(rect));
    }
}

/// Posts one notification and logs it on stderr; the lane id rides in `extra` for the click.
fn post(app: &AppHandle, n: notify::Notice) {
    let result = app
        .notification()
        .builder()
        .title(&n.title)
        .body(&n.body)
        .extra("lane", &n.lane)
        .show();
    match result {
        Ok(()) => eprintln!("[lane-monitor] notification posted: {} | {} | {}", n.lane, n.title, n.body),
        Err(e) => eprintln!("[lane-monitor] notification failed: {}: {e}", n.lane),
    }
}

fn start_poller(app: AppHandle, rx: Receiver<()>) {
    thread::spawn(move || loop {
        let shared = app.state::<Shared>();
        let prev = shared.snapshot.lock().unwrap().synced_at;
        let snap = poll::poll_once(&shared.board, prev);
        if let Some(tray) = app.tray_by_id(TRAY_ID) {
            let _ = tray.set_title(Some(poll::title_for(&snap)));
            let tip = match (&snap.attention, snap.state) {
                (Some(a), "ok") => format!("Lanes: {} waiting, {} blocked, {} running", a.waiting, a.blocked, a.running),
                _ if snap.state == "unreachable" => format!("Lanes: board unreachable ({})", snap.detail),
                _ => format!("Lanes: {}", snap.detail),
            };
            let _ = tray.set_tooltip(Some(tip));
        }
        *shared.snapshot.lock().unwrap() = snap.clone();
        let _ = app.emit_to(POPOVER, "attention", &snap);
        let notices = {
            let mut seen = shared.seen.lock().unwrap();
            let (next, notices) = notify::step(&seen, &snap);
            *seen = next;
            notices
        };
        for n in notices {
            post(&app, n);
        }
        if let Err(RecvTimeoutError::Disconnected) = rx.recv_timeout(POLL_EVERY) {
            break;
        }
        while rx.try_recv().is_ok() {}
    });
}

fn main() {
    let board = std::env::var("LANE_MONITOR_BOARD")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| poll::DEFAULT_BOARD.to_string());
    let pinned = std::env::var("LANE_MONITOR_OPEN_POPOVER").map(|v| v == "1").unwrap_or(false);
    let (tx, rx) = mpsc::channel();

    tauri::Builder::default()
        .manage(Shared {
            snapshot: Mutex::new(Snapshot::pending(&board)),
            board,
            pinned,
            poke: Mutex::new(tx),
            hidden_at: Mutex::new(None),
            seen: Mutex::new(None),
        })
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![current, refresh, fit_popover, hide_popover, open_monitor])
        .setup(move |app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let popover = WebviewWindowBuilder::new(app, POPOVER, WebviewUrl::App("popover.html".into()))
                .title("Lanes")
                .inner_size(POPOVER_W, 420.0)
                .resizable(false)
                .decorations(false)
                .always_on_top(true)
                .skip_taskbar(true)
                .visible_on_all_workspaces(true)
                .visible(false)
                .build()?;
            let handle = app.handle().clone();
            popover.on_window_event(move |event| {
                if let WindowEvent::Focused(false) = event {
                    if !handle.state::<Shared>().pinned {
                        hide(&handle);
                    }
                }
            });

            let retina = app.primary_monitor()?.map(|m| m.scale_factor() >= 1.5).unwrap_or(true);
            let icon = if retina {
                tauri::include_image!("icons/tray-32.png")
            } else {
                tauri::include_image!("icons/tray-16.png")
            };
            let menu = MenuBuilder::new(app)
                .item(&MenuItemBuilder::with_id("open", "Open monitor").build(app)?)
                .item(&MenuItemBuilder::with_id("refresh", "Refresh now").build(app)?)
                .separator()
                .item(&MenuItemBuilder::with_id("quit", "Quit Lane Monitor").build(app)?)
                .build()?;
            TrayIconBuilder::with_id(TRAY_ID)
                .icon(icon)
                .icon_as_template(true)
                .title("\u{2013}")
                .tooltip("Lanes")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => {
                        let _ = open_monitor_window(app, None);
                    }
                    "refresh" => app.state::<Shared>().poll_now(),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        rect,
                        ..
                    } = event
                    {
                        toggle(tray.app_handle(), rect);
                    }
                })
                .build(app)?;

            // A click on a notification (`tap`) opens the monitor on its lane. Registered
            // before the first poll: notifications shown with no handler report nothing.
            let handle = app.handle().clone();
            app.notification().on_action(move |performed| {
                let lane = performed
                    .notification()
                    .and_then(|n| n.extra().get("lane"))
                    .and_then(|v| v.as_str())
                    .map(str::to_string);
                eprintln!("[lane-monitor] notification action: {} on {lane:?}", performed.action_id());
                if performed.action_id() == "tap" {
                    let _ = open_monitor_window(&handle, lane.as_deref());
                }
            })?;

            start_poller(app.handle().clone(), rx);

            if pinned {
                let handle = app.handle().clone();
                thread::spawn(move || {
                    thread::sleep(Duration::from_millis(600));
                    let rect = handle.tray_by_id(TRAY_ID).and_then(|t| t.rect().ok().flatten());
                    show(&handle, rect);
                });
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Lane Monitor")
        .run(|_, event| {
            // Closing the monitor window must not quit a menu bar app; the tray's Quit
            // passes an exit code and goes through.
            if let RunEvent::ExitRequested { code: None, api, .. } = event {
                api.prevent_exit();
            }
        });
}
