//! The Settings view over `config.json`: the theme, the board URL rule of the Settings field,
//! the patch a save applies, and the atomic write.
//!
//! Pure functions, tested here, except `write_atomic` (a temp file and a rename, tested on a
//! scratch directory). `links::Config` stays the parser of the file; `main.rs` registers the
//! chord, swaps the board and calls the write.

use std::fs;
use std::io::Write;
use std::path::Path;

use serde::{Deserialize, Serialize};
use tauri_plugin_global_shortcut::Shortcut;

use crate::links::{self, Config};

/// The popover's palette: `system` follows the macOS appearance (`prefers-color-scheme`).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    #[default]
    System,
    Light,
    Dark,
}

/// The Settings field's rule: `http://127.0.0.1:<port>` or `http://localhost:<port>`, port
/// 1-65535 in decimal, one trailing `/` allowed and dropped. Narrower than `poll::parse_base`,
/// which still reads whatever `config.json` or `LANE_MONITOR_BOARD` names at launch.
pub fn validate_board(url: &str) -> Result<String, String> {
    let u = url.trim();
    let u = u.strip_suffix('/').unwrap_or(u);
    let port = u
        .strip_prefix("http://127.0.0.1:")
        .or_else(|| u.strip_prefix("http://localhost:"))
        .ok_or_else(|| "Board URL must be http://127.0.0.1:<port> or http://localhost:<port>".to_string())?;
    let digits = !port.is_empty() && port.len() <= 5 && port.bytes().all(|c| c.is_ascii_digit()) && !port.starts_with('0');
    match port.parse::<u16>() {
        Ok(_) if digits => Ok(u.to_string()),
        _ => Err(format!("Board URL: {port:?} is not a port (1-65535)")),
    }
}

/// What the Settings view shows.
#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct View {
    pub theme: Theme,
    /// The board this run reads, whichever source named it.
    pub board: String,
    /// The chord as written in `config.json`, or the default; `""` is none.
    pub shortcut: String,
    pub notifications: bool,
    /// Set when `LANE_MONITOR_BOARD` named the board at launch: it wins again at the next one.
    pub board_note: Option<String>,
    /// The absolute path of `config.json`, for the view's footer line.
    pub config_path: String,
}

pub fn view(config: &Config, board: &str, env_board: Option<&str>, config_path: &str) -> View {
    View {
        theme: config.theme.unwrap_or_default(),
        board: board.to_string(),
        shortcut: config.shortcut.clone().unwrap_or_else(|| links::DEFAULT_SHORTCUT.to_string()),
        notifications: config.notifications.unwrap_or(true),
        board_note: env_board.map(|b| format!("LANE_MONITOR_BOARD={b} names the board at launch, over config.json")),
        config_path: config_path.to_string(),
    }
}

/// One save from the Settings view: only the fields it carries change.
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Patch {
    pub theme: Option<Theme>,
    pub notifications: Option<bool>,
    pub board: Option<String>,
    pub shortcut: Option<String>,
}

/// Why a save did not apply, by field; the view writes each under its own control.
#[derive(Clone, Debug, Default, PartialEq, Serialize)]
pub struct FieldErrors {
    pub board: Option<String>,
    pub shortcut: Option<String>,
    /// The file could not be written.
    pub file: Option<String>,
}

/// The chord of a Settings field: `None` for `""`, an error when it is not a chord.
pub fn parse_chord(s: &str) -> Result<Option<Shortcut>, String> {
    let s = s.trim();
    if s.is_empty() {
        return Ok(None);
    }
    s.parse::<Shortcut>().map(Some).map_err(|e| format!("Shortcut {s:?} is not a chord: {e}"))
}

/// The config after `patch`, or the errors of the fields that do not pass (nothing applies
/// then). The board is stored as validated, the chord as written, trimmed.
pub fn apply(config: &Config, patch: &Patch) -> Result<Config, FieldErrors> {
    let mut errors = FieldErrors::default();
    let mut next = config.clone();
    if let Some(t) = patch.theme {
        next.theme = Some(t);
    }
    if let Some(n) = patch.notifications {
        next.notifications = Some(n);
    }
    if let Some(b) = &patch.board {
        match validate_board(b) {
            Ok(b) => next.board = Some(b),
            Err(e) => errors.board = Some(e),
        }
    }
    if let Some(s) = &patch.shortcut {
        match parse_chord(s) {
            Ok(_) => next.shortcut = Some(s.trim().to_string()),
            Err(e) => errors.shortcut = Some(e),
        }
    }
    if errors == FieldErrors::default() {
        Ok(next)
    } else {
        Err(errors)
    }
}

/// `config.json` as written: only the fields that are set, two-space indent, final newline.
pub fn to_json(config: &Config) -> String {
    let mut s = serde_json::to_string_pretty(config).expect("Config serializes");
    s.push('\n');
    s
}

/// Writes `<path>.tmp` beside the file, syncs it, then renames it over the file: a reader
/// sees the old file or the new one, never half of one. Creates the directory if missing.
pub fn write_atomic(path: &Path, text: &str) -> std::io::Result<()> {
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir)?;
    }
    let tmp = path.with_extension("json.tmp");
    {
        let mut f = fs::File::create(&tmp)?;
        f.write_all(text.as_bytes())?;
        f.sync_all()?;
    }
    fs::rename(&tmp, path)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri_plugin_global_shortcut::{Code, Modifiers};

    #[test]
    fn new_fields_parse_and_default() {
        let (c, err) = Config::parse(Some(r#"{"theme":"light","notifications":false}"#));
        assert_eq!(err, None);
        assert_eq!((c.theme, c.notifications), (Some(Theme::Light), Some(false)));
        let v = view(&Config::default(), "http://127.0.0.1:4700", None, "/h/config.json");
        assert_eq!(v.config_path, "/h/config.json");
        assert_eq!((v.theme, v.notifications), (Theme::System, true));
        assert_eq!(v.shortcut, links::DEFAULT_SHORTCUT);
        assert_eq!(v.board_note, None);
        for t in ["system", "dark"] {
            let (c, err) = Config::parse(Some(&format!(r#"{{"theme":"{t}"}}"#)));
            assert_eq!(err, None, "{t}");
            assert!(c.theme.is_some());
        }
    }

    #[test]
    fn unknown_field_and_unknown_theme_are_refused() {
        let (c, err) = Config::parse(Some(r#"{"theme":"dark","colour":"red"}"#));
        assert_eq!(c, Config::default());
        assert!(err.unwrap().contains("colour"));
        let (_, err) = Config::parse(Some(r#"{"theme":"sepia"}"#));
        assert!(err.is_some(), "a theme outside system|light|dark");
        let (_, err) = Config::parse(Some(r#"{"notifications":"no"}"#));
        assert!(err.is_some(), "notifications is a boolean");
    }

    #[test]
    fn round_trip_keeps_every_field_and_writes_only_the_set_ones() {
        let full = Config {
            board: Some("http://localhost:4712".into()),
            shortcut: Some("Ctrl+Alt+Cmd+J".into()),
            theme: Some(Theme::Dark),
            notifications: Some(false),
        };
        let (back, err) = Config::parse(Some(&to_json(&full)));
        assert_eq!((back, err), (full, None));
        let partial = Config { theme: Some(Theme::Light), ..Config::default() };
        assert_eq!(to_json(&partial), "{\n  \"theme\": \"light\"\n}\n");
        assert_eq!(to_json(&Config::default()), "{}\n");
    }

    #[test]
    fn board_url_validation() {
        for (ok, want) in [
            ("http://127.0.0.1:4712", "http://127.0.0.1:4712"),
            ("http://localhost:4700/", "http://localhost:4700"),
            (" http://127.0.0.1:1 ", "http://127.0.0.1:1"),
            ("http://127.0.0.1:65535", "http://127.0.0.1:65535"),
        ] {
            assert_eq!(validate_board(ok).as_deref(), Ok(want), "{ok:?}");
        }
        for bad in [
            "",
            "127.0.0.1:4712",
            "https://127.0.0.1:4712",
            "http://127.0.0.2:4712",
            "http://example.com:4712",
            "http://LOCALHOST:4712",
            "http://127.0.0.1",
            "http://127.0.0.1:",
            "http://127.0.0.1:0",
            "http://127.0.0.1:04712",
            "http://127.0.0.1:65536",
            "http://127.0.0.1:+4712",
            "http://127.0.0.1:4712//",
            "http://127.0.0.1:4712/api",
            "http://127.0.0.1:4712?x",
            "http://user@127.0.0.1:4712",
        ] {
            assert!(validate_board(bad).is_err(), "{bad:?} accepted");
        }
    }

    #[test]
    fn apply_changes_only_the_patched_fields() {
        let base = Config { board: Some("http://127.0.0.1:4700".into()), ..Config::default() };
        let next = apply(&base, &Patch { theme: Some(Theme::Dark), ..Patch::default() }).unwrap();
        assert_eq!(next, Config { theme: Some(Theme::Dark), ..base.clone() });
        let next = apply(&base, &Patch { notifications: Some(false), ..Patch::default() }).unwrap();
        assert_eq!(next, Config { notifications: Some(false), ..base.clone() });
        let next = apply(
            &base,
            &Patch { board: Some("http://localhost:4712/".into()), shortcut: Some(" Ctrl+Alt+Cmd+J ".into()), ..Patch::default() },
        )
        .unwrap();
        assert_eq!(next.board.as_deref(), Some("http://localhost:4712"));
        assert_eq!(next.shortcut.as_deref(), Some("Ctrl+Alt+Cmd+J"));
        let none = apply(&base, &Patch { shortcut: Some("".into()), ..Patch::default() }).unwrap();
        assert_eq!(none.shortcut.as_deref(), Some(""));
    }

    #[test]
    fn apply_refuses_the_whole_patch_on_a_bad_field() {
        let base = Config::default();
        let err = apply(
            &base,
            &Patch {
                theme: Some(Theme::Light),
                board: Some("http://example.com:80".into()),
                shortcut: Some("Hyper+L".into()),
                ..Patch::default()
            },
        )
        .unwrap_err();
        assert!(err.board.unwrap().starts_with("Board URL must be"));
        assert!(err.shortcut.unwrap().contains("Hyper+L"));
        let err = apply(&base, &Patch { theme: Some(Theme::Dark), board: Some("http://127.0.0.1:0".into()), ..Patch::default() });
        assert_eq!(err.unwrap_err().shortcut, None);
    }

    #[test]
    fn patch_refuses_an_unknown_field() {
        assert!(serde_json::from_str::<Patch>(r#"{"theme":"dark"}"#).is_ok());
        assert!(serde_json::from_str::<Patch>(r#"{"them":"dark"}"#).is_err());
    }

    #[test]
    fn parse_chord_reads_the_field() {
        assert_eq!(parse_chord("  "), Ok(None));
        let s = parse_chord("Ctrl+Alt+Cmd+J").unwrap().unwrap();
        assert_eq!((s.mods, s.key), (Modifiers::CONTROL | Modifiers::ALT | Modifiers::SUPER, Code::KeyJ));
        assert!(parse_chord("Ctrl+Alt+Cmd+").is_err());
    }

    #[test]
    fn view_notes_the_environment_board() {
        let v = view(&Config::default(), "http://127.0.0.1:4712", Some("http://127.0.0.1:4712"), "/h/config.json");
        assert_eq!(v.board, "http://127.0.0.1:4712");
        assert!(v.board_note.unwrap().starts_with("LANE_MONITOR_BOARD=http://127.0.0.1:4712"));
    }

    #[test]
    fn write_atomic_creates_replaces_and_leaves_no_temp() {
        let dir = std::env::temp_dir().join(format!("lane-monitor-config-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        let path = dir.join("sub").join("config.json");
        write_atomic(&path, "{}\n").unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), "{}\n");
        let next = Config { notifications: Some(false), ..Config::default() };
        write_atomic(&path, &to_json(&next)).unwrap();
        assert_eq!(Config::parse(Some(&fs::read_to_string(&path).unwrap())), (next, None));
        let names: Vec<_> = fs::read_dir(path.parent().unwrap()).unwrap().map(|e| e.unwrap().file_name()).collect();
        assert_eq!(names, vec![std::ffi::OsString::from("config.json")]);
        fs::remove_dir_all(&dir).unwrap();
    }
}
