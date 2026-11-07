//! The `jjodel-lanes://<Prompt-ID>` deep link and the app config file (board URL, shortcut).
//!
//! Pure functions, tested here: `lane_of_link` decides whether a URL handed over by
//! LaunchServices names a lane; `Config::parse` reads `config.json`; `shortcut_of` turns its
//! `shortcut` field into the chord to register. The Settings view's write side is `config.rs`.

use serde::{Deserialize, Serialize};
use tauri_plugin_global_shortcut::{Modifiers, Shortcut};

pub const SCHEME: &str = "jjodel-lanes";
/// Control-Option-Command-L (report P-2026-10-18-2255 §Q5); the fallback is `Ctrl+Alt+Cmd+J`.
pub const DEFAULT_SHORTCUT: &str = "Ctrl+Alt+Cmd+L";
/// Relative to `$HOME`: the app's config directory (its bundle identifier), then the file.
pub const CONFIG_PATH: &str = "Library/Application Support/io.jjodel.lane-monitor/config.json";

/// `P-YYYY-MM-DD-HHmm`, digits only, nothing else: the board's `laneLinkId` rule.
fn is_prompt_id(s: &str) -> bool {
    let b = s.as_bytes();
    b.len() == 17
        && b[0] == b'P'
        && [1, 6, 9, 12].iter().all(|&i| b[i] == b'-')
        && b.iter().enumerate().all(|(i, c)| [0, 1, 6, 9, 12].contains(&i) || c.is_ascii_digit())
}

/// The lane id of `jjodel-lanes://P-YYYY-MM-DD-HHmm` (one trailing `/` allowed), or the reason
/// the link is refused. Anything else is refused: another scheme, a path, a query, a fragment.
pub fn lane_of_link(link: &str) -> Result<String, String> {
    let rest = link
        .split_once("://")
        .filter(|(scheme, _)| scheme.eq_ignore_ascii_case(SCHEME))
        .map(|(_, rest)| rest)
        .ok_or_else(|| format!("not a {SCHEME}:// link"))?;
    let id = rest.strip_suffix('/').unwrap_or(rest);
    if is_prompt_id(id) {
        Ok(id.to_string())
    } else {
        Err(format!("not a Prompt-ID: {rest:?}"))
    }
}

/// The monitor window's URL: the board root, or its `/#lane=<id>` mark. The id is checked
/// again here because a notification's `extra` and the popover also pass one.
pub fn monitor_url(board: &str, lane: Option<&str>) -> Result<String, String> {
    let base = board.trim_end_matches('/');
    match lane {
        Some(id) if !id.is_empty() && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') => {
            Ok(format!("{base}/#lane={id}"))
        }
        Some(id) if !id.is_empty() => Err(format!("not a lane id: {id}")),
        _ => Ok(format!("{base}/")),
    }
}

/// `config.json`. Every field optional; unknown fields are refused so a typo is not silent.
/// Written back by the Settings view (`config::to_json`) with only the fields that are set.
#[derive(Clone, Debug, Default, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Config {
    /// Board URL, `http://host:port`; `LANE_MONITOR_BOARD` wins over it.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub board: Option<String>,
    /// A chord such as `Ctrl+Alt+Cmd+J`; `""` registers none.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shortcut: Option<String>,
    /// `system` (the default), `light` or `dark`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub theme: Option<crate::config::Theme>,
    /// Lane notifications on (the default) or off; off leaves the macOS permission alone.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notifications: Option<bool>,
}

impl Config {
    /// No file is the default config; a file that does not parse is the default config plus
    /// the error, which the popover footer shows.
    pub fn parse(text: Option<&str>) -> (Config, Option<String>) {
        match text {
            None => (Config::default(), None),
            Some(t) => match serde_json::from_str(t) {
                Ok(c) => (c, None),
                Err(e) => (Config::default(), Some(format!("config.json ignored: {e}"))),
            },
        }
    }
}

/// The chord to register: the default when the config names none, `None` when it names `""`,
/// an error when the string is not a chord.
pub fn shortcut_of(config: &Config) -> Result<Option<Shortcut>, String> {
    let s = config.shortcut.as_deref().unwrap_or(DEFAULT_SHORTCUT).trim();
    if s.is_empty() {
        return Ok(None);
    }
    s.parse::<Shortcut>()
        .map(Some)
        .map_err(|e| format!("shortcut {s:?} in config.json is not a chord: {e}"))
}

/// The chord in menu notation, `⌃⌥⌘L`.
pub fn label(s: &Shortcut) -> String {
    let mut out = String::new();
    for (m, sym) in [
        (Modifiers::CONTROL, "\u{2303}"),
        (Modifiers::ALT, "\u{2325}"),
        (Modifiers::SHIFT, "\u{21e7}"),
        (Modifiers::SUPER, "\u{2318}"),
    ] {
        if s.mods.contains(m) {
            out.push_str(sym);
        }
    }
    let key = format!("{:?}", s.key);
    out.push_str(key.strip_prefix("Key").or_else(|| key.strip_prefix("Digit")).unwrap_or(&key));
    out
}

/// Where a navigation or new-window request from the board's webview goes.
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum Route {
    /// Same scheme, host and port as the board: the webview follows it.
    Inside,
    /// Any other `http` or `https` URL: handed to the default browser.
    Browser,
    /// Anything else (file, javascript, data, other schemes): dropped.
    Refuse,
}

/// Decides the fate of `target` for a webview showing `board`.
pub fn route(board: &tauri::Url, target: &tauri::Url) -> Route {
    let same_origin = target.scheme() == board.scheme()
        && target.host_str() == board.host_str()
        && target.port_or_known_default() == board.port_or_known_default();
    if same_origin && matches!(target.scheme(), "http" | "https") {
        Route::Inside
    } else if matches!(target.scheme(), "http" | "https") {
        Route::Browser
    } else {
        Route::Refuse
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri_plugin_global_shortcut::Code;

    fn url(s: &str) -> tauri::Url {
        s.parse().unwrap()
    }

    #[test]
    fn route_keeps_the_board_inside() {
        let board = url("http://localhost:4700/");
        assert_eq!(route(&board, &url("http://localhost:4700/#lane=P-2026-10-21-1000")), Route::Inside);
        assert_eq!(route(&board, &url("http://localhost:4700/api/state")), Route::Inside);
    }

    #[test]
    fn route_sends_other_web_urls_to_the_browser() {
        let board = url("http://localhost:4700/");
        assert_eq!(route(&board, &url("https://claude.ai/chat/abc")), Route::Browser);
        assert_eq!(route(&board, &url("http://localhost:3001/")), Route::Browser);
        assert_eq!(route(&board, &url("https://localhost:4700/")), Route::Browser);
    }

    #[test]
    fn route_refuses_non_web_schemes() {
        let board = url("http://localhost:4700/");
        for bad in ["javascript:alert(1)", "file:///etc/passwd", "data:text/html,x", "jjodel-lanes://P-2026-10-21-1000", "about:blank"] {
            assert_eq!(route(&board, &url(bad)), Route::Refuse, "{bad}");
        }
    }

    #[test]
    fn accepts_a_prompt_id_link() {
        assert_eq!(lane_of_link("jjodel-lanes://P-2026-10-18-2255").as_deref(), Ok("P-2026-10-18-2255"));
        assert_eq!(lane_of_link("jjodel-lanes://P-2026-10-18-2255/").as_deref(), Ok("P-2026-10-18-2255"));
        assert_eq!(lane_of_link("JJODEL-LANES://P-2026-10-18-2255").as_deref(), Ok("P-2026-10-18-2255"));
    }

    #[test]
    fn the_url_crate_keeps_the_id_as_written() {
        // LaunchServices hands the plugin a `url::Url`; a non-special scheme keeps the host's case.
        let u: tauri::Url = "jjodel-lanes://P-2026-10-18-2255".parse().unwrap();
        assert_eq!(lane_of_link(u.as_str()).as_deref(), Ok("P-2026-10-18-2255"));
    }

    #[test]
    fn refuses_anything_else() {
        for bad in [
            "jjodel-lanes://",
            "jjodel-lanes://p-2026-10-18-2255",
            "jjodel-lanes://C-2026-10-18-2255",
            "jjodel-lanes://P-2026-10-18-225",
            "jjodel-lanes://P-2026-10-18-22555",
            "jjodel-lanes://P-2026-1a-18-2255",
            "jjodel-lanes://P-2026-10-18-2255//",
            "jjodel-lanes://P-2026-10-18-2255?x=1",
            "jjodel-lanes://P-2026-10-18-2255#x",
            "jjodel-lanes://P-2026-10-18-2255/evil",
            "jjodel-lanes://host/P-2026-10-18-2255",
            "jjodel-lanes:P-2026-10-18-2255",
            "http://P-2026-10-18-2255",
            "javascript://P-2026-10-18-2255",
            "P-2026-10-18-2255",
            "",
        ] {
            assert!(lane_of_link(bad).is_err(), "{bad:?} accepted");
        }
    }

    #[test]
    fn monitor_url_is_the_root_or_the_lane_mark() {
        assert_eq!(monitor_url("http://127.0.0.1:4712/", None).as_deref(), Ok("http://127.0.0.1:4712/"));
        assert_eq!(monitor_url("http://127.0.0.1:4712", Some("")).as_deref(), Ok("http://127.0.0.1:4712/"));
        assert_eq!(
            monitor_url("http://127.0.0.1:4712", Some("P-2026-10-18-2255")).as_deref(),
            Ok("http://127.0.0.1:4712/#lane=P-2026-10-18-2255")
        );
        for bad in ["P-1&x=<b>", "P 1", "../x", "P-1#y"] {
            assert!(monitor_url("http://127.0.0.1:4712", Some(bad)).is_err(), "{bad:?} accepted");
        }
    }

    #[test]
    fn config_absent_is_the_default_chord() {
        let (c, err) = Config::parse(None);
        assert_eq!((c.board.as_deref(), err), (None, None));
        let s = shortcut_of(&c).unwrap().unwrap();
        assert_eq!(s.mods, Modifiers::CONTROL | Modifiers::ALT | Modifiers::SUPER);
        assert_eq!(s.key, Code::KeyL);
        assert_eq!(label(&s), "\u{2303}\u{2325}\u{2318}L");
    }

    #[test]
    fn config_overrides_board_and_chord() {
        let (c, err) = Config::parse(Some(r#"{"board":"http://127.0.0.1:4712","shortcut":"Ctrl+Alt+Cmd+J"}"#));
        assert_eq!(err, None);
        assert_eq!(c.board.as_deref(), Some("http://127.0.0.1:4712"));
        let s = shortcut_of(&c).unwrap().unwrap();
        assert_eq!((s.mods, s.key), (Modifiers::CONTROL | Modifiers::ALT | Modifiers::SUPER, Code::KeyJ));
        assert_eq!(label(&s), "\u{2303}\u{2325}\u{2318}J");
        let (c, _) = Config::parse(Some(r#"{"shortcut":""}"#));
        assert_eq!(shortcut_of(&c), Ok(None));
    }

    #[test]
    fn config_invalid_is_reported() {
        let (c, err) = Config::parse(Some("{not json"));
        assert_eq!(c, Config::default());
        assert!(err.unwrap().starts_with("config.json ignored"));
        let (_, err) = Config::parse(Some(r#"{"shortcutt":"Ctrl+L"}"#));
        assert!(err.is_some(), "an unknown field is a typo, not silence");
        for bad in ["Ctrl+Alt+Cmd+", "Hyper+L", "Ctrl+Alt+Cmd+L+K"] {
            let (c, _) = Config::parse(Some(&format!(r#"{{"shortcut":"{bad}"}}"#)));
            assert!(shortcut_of(&c).is_err(), "{bad:?} accepted");
        }
    }
}
