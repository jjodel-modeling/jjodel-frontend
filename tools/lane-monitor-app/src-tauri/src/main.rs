//! Lane Monitor: a menu bar app over the lane board's `GET /api/attention`.
//!
//! The tray shows the `waiting` count as its title beside a monochrome template icon; a left
//! click toggles the popover, a borderless always-on-top 400 px webview placed under the icon
//! and hidden when it loses focus. The poller runs on its own thread every 30 s (and at once
//! when the popover opens) and pushes each snapshot to the tray and to the popover. A lane
//! that starts waiting posts a system notification (`notify.rs`); a click on it opens the
//! monitor on that lane. A `jjodel-lanes://<Prompt-ID>` link opens the monitor on that lane,
//! and a global shortcut (default ⌃⌥⌘L) toggles the popover (`links.rs`).

mod links;
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

use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
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
    /// A config or shortcut problem, shown in the popover footer.
    footer: Mutex<Option<String>>,
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
fn footer_note(shared: State<'_, Shared>) -> Option<String> {
    shared.footer.lock().unwrap().clone()
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
    let url = links::monitor_url(&app.state::<Shared>().board, lane)?;
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

fn toggle(app: &AppHandle, rect: Option<Rect>) {
    let Some(w) = app.get_webview_window(POPOVER) else { return };
    if w.is_visible().unwrap_or(false) {
        hide(app);
        return;
    }
    let recently = app.state::<Shared>().hidden_at.lock().unwrap().map(|t| t.elapsed() < REOPEN_GUARD);
    if recently != Some(true) {
        show(app, rect);
    }
}

/// `open_monitor_window` from a thread of its own, for the callbacks that run on the main
/// thread (the link's Apple event, the tray menu, the notification tap): building the window
/// there waits on that same thread (measured with a link: the app hung).
fn open_monitor_soon(app: &AppHandle, lane: Option<String>, from: &'static str) {
    let app = app.clone();
    thread::spawn(move || {
        if let Err(e) = open_monitor_window(&app, lane.as_deref()) {
            eprintln!("[lane-monitor] {from}: {lane:?}: {e}");
        }
    });
}

/// Opens the monitor on the lane a `jjodel-lanes://` link names; any other link is logged
/// and dropped.
fn open_link(app: &AppHandle, link: &str) {
    match links::lane_of_link(link) {
        Ok(id) => {
            eprintln!("[lane-monitor] deep link: opening {id}");
            open_monitor_soon(app, Some(id), "deep link");
        }
        Err(why) => eprintln!("[lane-monitor] deep link refused: {link:?}: {why}"),
    }
}

/// `$HOME/<CONFIG_PATH>`: no file is no config; a file that cannot be read is reported.
fn read_config() -> (links::Config, Vec<String>) {
    let path = std::env::var("HOME").map(|h| std::path::Path::new(&h).join(links::CONFIG_PATH));
    let text = match path.as_ref().map(std::fs::read_to_string) {
        Ok(Ok(t)) => Some(t),
        Ok(Err(e)) if e.kind() != std::io::ErrorKind::NotFound => {
            let (config, _) = links::Config::parse(None);
            return (config, vec![format!("config.json unreadable: {e}")]);
        }
        _ => None,
    };
    let (config, err) = links::Config::parse(text.as_deref());
    (config, err.into_iter().collect())
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
    let (config, mut problems) = read_config();
    let nonempty = |s: &String| !s.trim().is_empty();
    let (board, from) = match std::env::var("LANE_MONITOR_BOARD").ok().filter(nonempty) {
        Some(b) => (b, "LANE_MONITOR_BOARD"),
        None => match config.board.clone().filter(nonempty) {
            Some(b) => (b, "config.json"),
            None => (poll::DEFAULT_BOARD.to_string(), "default"),
        },
    };
    eprintln!("[lane-monitor] board {board} (from {from})");
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
            footer: Mutex::new(None),
        })
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _, event| {
                    if event.state == ShortcutState::Pressed {
                        let rect = app.tray_by_id(TRAY_ID).and_then(|t| t.rect().ok().flatten());
                        toggle(app, rect);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            current,
            refresh,
            footer_note,
            fit_popover,
            hide_popover,
            open_monitor
        ])
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
                        eprintln!("[lane-monitor] tray menu: open monitor");
                        open_monitor_soon(app, None, "tray menu");
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
                        toggle(tray.app_handle(), Some(rect));
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
                    open_monitor_soon(&handle, lane, "notification");
                }
            })?;

            // `jjodel-lanes://<id>`: LaunchServices delivers it as an Apple event to the running
            // app, or launches the app with it; the plugin reports both through on_open_url.
            let handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                for url in event.urls() {
                    open_link(&handle, url.as_str());
                }
            });
            if let Ok(Some(urls)) = app.deep_link().get_current() {
                for url in urls {
                    open_link(app.handle(), url.as_str());
                }
            }

            match links::shortcut_of(&config) {
                Ok(Some(s)) => match app.global_shortcut().register(s) {
                    Ok(()) => eprintln!("[lane-monitor] shortcut {} registered", links::label(&s)),
                    Err(e) => {
                        eprintln!("[lane-monitor] shortcut {} not registered: {e}", links::label(&s));
                        problems.push(format!("Shortcut {} not registered: {e}", links::label(&s)));
                    }
                },
                Ok(None) => eprintln!("[lane-monitor] shortcut disabled by config.json"),
                Err(e) => {
                    eprintln!("[lane-monitor] {e}");
                    problems.push(e);
                }
            }
            if !problems.is_empty() {
                *app.state::<Shared>().footer.lock().unwrap() = Some(problems.join(" \u{b7} "));
            }

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
