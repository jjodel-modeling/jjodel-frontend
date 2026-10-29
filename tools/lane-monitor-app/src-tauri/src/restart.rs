//! The popover footer's two controls: «Restart board» and «Start at login».
//!
//! Pure functions, tested here: `restart_command` builds the `launchctl kickstart` argv for
//! the board's own LaunchAgent, and only for the board on 4700 (report P-2026-10-18-2255 §Q7
//! row S5); `restart_view` and `login_view` map that rule and the autostart plugin's answer to
//! what the footer shows. Nothing here runs a command: `main.rs` does, on a click.

use serde::Serialize;

/// The board's LaunchAgent label. Its plist is never written by this app.
pub const BOARD_LABEL: &str = "io.jjodel.lane-board";
/// The only board URL «Restart board» acts on: the one `BOARD_LABEL` serves.
pub const REAL_BOARD: &str = "http://127.0.0.1:4700";
/// The app's own login agent, `~/Library/LaunchAgents/<LOGIN_LABEL>.plist`: the bundle
/// identifier, a second agent distinct from `BOARD_LABEL` (report §Q4 «Login item»).
pub const LOGIN_LABEL: &str = "io.jjodel.lane-monitor";
pub const LAUNCHCTL: &str = "/bin/launchctl";

/// The argv that restarts the board's agent, `launchctl kickstart -k gui/<uid>/<label>`, or
/// the reason it is not offered: any board URL other than `REAL_BOARD` (one trailing `/`
/// allowed) is a check or a second board, never the agent's.
pub fn restart_command(board: &str, uid: u32) -> Result<Vec<String>, String> {
    let url = board.strip_suffix('/').unwrap_or(board);
    if url != REAL_BOARD {
        return Err(format!("Restart board acts only on the board at {REAL_BOARD}; this run reads {url}"));
    }
    Ok(vec![
        LAUNCHCTL.to_string(),
        "kickstart".to_string(),
        "-k".to_string(),
        format!("gui/{uid}/{BOARD_LABEL}"),
    ])
}

/// One footer control as the popover draws it.
#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Control {
    /// The toggle's position; always false for the button.
    pub on: bool,
    pub enabled: bool,
    /// The tooltip: what a click does, or why the control is disabled.
    pub detail: String,
}

pub fn restart_view(board: &str, uid: u32) -> Control {
    match restart_command(board, uid) {
        Ok(argv) => Control { on: false, enabled: true, detail: format!("Runs {}", argv.join(" ")) },
        Err(why) => Control { on: false, enabled: false, detail: why },
    }
}

/// The autostart plugin's `is_enabled` (for a LaunchAgent: whether the plist exists) as the
/// toggle: on or off, or disabled with the error when the state cannot be read.
pub fn login_view(state: Result<bool, String>) -> Control {
    let plist = format!("~/Library/LaunchAgents/{LOGIN_LABEL}.plist");
    match state {
        Ok(true) => Control { on: true, enabled: true, detail: format!("Starts at login ({plist})") },
        Ok(false) => Control { on: false, enabled: true, detail: format!("Off: a click writes {plist}") },
        Err(e) => Control { on: false, enabled: false, detail: format!("Login item unavailable: {e}") },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn restart_command_is_kickstart_of_the_board_agent() {
        assert_eq!(
            restart_command("http://127.0.0.1:4700", 501).unwrap(),
            vec!["/bin/launchctl", "kickstart", "-k", "gui/501/io.jjodel.lane-board"]
        );
    }

    #[test]
    fn restart_command_carries_the_uid() {
        assert_eq!(restart_command(REAL_BOARD, 502).unwrap()[3], "gui/502/io.jjodel.lane-board");
    }

    #[test]
    fn restart_command_accepts_one_trailing_slash() {
        assert!(restart_command("http://127.0.0.1:4700/", 501).is_ok());
        assert!(restart_command("http://127.0.0.1:4700//", 501).is_err());
    }

    #[test]
    fn restart_command_refuses_every_other_board() {
        for board in [
            "http://127.0.0.1:4712",
            "http://localhost:4700",
            "https://127.0.0.1:4700",
            "http://127.0.0.1:47000",
            "http://127.0.0.1:4700/api",
            "",
        ] {
            let err = restart_command(board, 501).unwrap_err();
            assert!(err.contains(REAL_BOARD), "{board}: {err}");
        }
    }

    #[test]
    fn restart_refusal_names_the_board_of_this_run() {
        let err = restart_command("http://127.0.0.1:4712/", 501).unwrap_err();
        assert!(err.ends_with("this run reads http://127.0.0.1:4712"), "{err}");
    }

    #[test]
    fn restart_view_enables_only_on_4700() {
        let on = restart_view(REAL_BOARD, 501);
        assert!(on.enabled && !on.on);
        assert_eq!(on.detail, "Runs /bin/launchctl kickstart -k gui/501/io.jjodel.lane-board");
        let off = restart_view("http://127.0.0.1:4712", 501);
        assert!(!off.enabled && !off.on);
        assert!(off.detail.contains("4712"));
    }

    #[test]
    fn login_view_maps_the_plugin_state() {
        let on = login_view(Ok(true));
        assert!(on.on && on.enabled);
        let off = login_view(Ok(false));
        assert!(!off.on && off.enabled);
        let err = login_view(Err("no home".into()));
        assert!(!err.on && !err.enabled);
        assert_eq!(err.detail, "Login item unavailable: no home");
    }

    #[test]
    fn login_view_names_the_app_plist() {
        assert!(login_view(Ok(false)).detail.ends_with("~/Library/LaunchAgents/io.jjodel.lane-monitor.plist"));
    }

    #[test]
    fn login_agent_is_the_bundle_identifier_and_not_the_board() {
        let conf: serde_json::Value = serde_json::from_str(include_str!("../tauri.conf.json")).unwrap();
        assert_eq!(conf["identifier"], LOGIN_LABEL);
        assert_ne!(LOGIN_LABEL, BOARD_LABEL);
    }
}
