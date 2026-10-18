//! Which lanes have just started waiting: the transition between two successive
//! `/api/attention` snapshots that the poller turns into system notifications.
//!
//! A notification goes out only when a lane id **enters** `items` (a `question`, a `blocked`
//! or a waiting `hard-stop`, under the board's rule), never on every poll. The first good
//! snapshot after launch seeds the set without notifying; a snapshot that is not a good one
//! (the board unreachable, an HTTP error, a 200 whose `board` reads `error: ...`) leaves the
//! set as it was, so the lanes already waiting do not notify again once the board answers.

use std::collections::HashSet;

use crate::poll::{Item, Snapshot};

/// Same threshold as the board's `ATTENTION_STALE_H`: a lane waiting longer is stale.
const STALE_MS: f64 = 72.0 * 3600e3;

/// One notification to post.
#[derive(Debug, Clone, PartialEq)]
pub struct Notice {
    pub lane: String,
    pub title: String,
    pub body: String,
}

/// The lane ids of the last good snapshot; `None` until the first one.
pub type Seen = Option<HashSet<String>>;

/// The good snapshots carry the board's verdict; the others say nothing about the lanes.
fn good(snap: &Snapshot) -> Option<&crate::poll::Attention> {
    let att = snap.attention.as_ref().filter(|_| snap.state == "ok")?;
    match att.board.as_deref() {
        Some(b) if b.starts_with("error") => None,
        _ => Some(att),
    }
}

fn notice(item: &Item) -> Notice {
    let kind = item.kind.as_deref().unwrap_or("waiting");
    let title = if kind == "blocked" { "Lane blocked" } else { "Lane waiting for you" };
    let body = match item.first_line.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        Some(line) => format!("{} \u{b7} {kind}: {line}", item.id),
        None => format!("{} \u{b7} {kind}", item.id),
    };
    Notice { lane: item.id.clone(), title: title.to_string(), body }
}

/// From the previous set and the new snapshot, the next set and the notices to post.
pub fn step(seen: &Seen, snap: &Snapshot) -> (Seen, Vec<Notice>) {
    let Some(att) = good(snap) else { return (seen.clone(), Vec::new()) };
    let now: HashSet<String> = att.items.iter().map(|i| i.id.clone()).collect();
    let Some(prev) = seen else { return (Some(now), Vec::new()) };
    let notices = att
        .items
        .iter()
        .filter(|i| !prev.contains(&i.id))
        .filter(|i| matches!(i.kind.as_deref(), Some("question" | "blocked" | "hard-stop")))
        .filter(|i| match (att.now, i.since) {
            (Some(n), Some(s)) => n - s <= STALE_MS,
            _ => true,
        })
        .map(notice)
        .collect();
    (Some(now), notices)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::poll::Attention;

    const NOW: f64 = 1_792_300_000_000.0;

    fn item(id: &str, kind: &str) -> Item {
        Item {
            id: id.into(),
            kind: Some(kind.into()),
            first_line: Some(format!("first line of {id}")),
            since: Some(NOW - 60_000.0),
            ..Item::default()
        }
    }

    fn ok(items: Vec<Item>) -> Snapshot {
        Snapshot {
            state: "ok",
            attention: Some(Attention {
                v: 1,
                now: Some(NOW),
                board: Some("ok".into()),
                waiting: items.len() as u32,
                items,
                ..Attention::default()
            }),
            ..Snapshot::pending("http://127.0.0.1:4712")
        }
    }

    fn failed(state: &'static str) -> Snapshot {
        Snapshot { state, detail: "x".into(), ..Snapshot::pending("http://127.0.0.1:4712") }
    }

    /// A 200 from a board whose own refresh failed: `board: "error: ..."`, no rows.
    fn board_error() -> Snapshot {
        let mut s = ok(vec![]);
        s.attention.as_mut().unwrap().board = Some("error: lane-run status failed".into());
        s
    }

    /// Runs the snapshots in order from launch and returns the lane ids notified at each poll.
    fn run(snaps: &[Snapshot]) -> Vec<Vec<String>> {
        let mut seen: Seen = None;
        snaps
            .iter()
            .map(|s| {
                let (next, notices) = step(&seen, s);
                seen = next;
                notices.into_iter().map(|n| n.lane).collect()
            })
            .collect()
    }

    fn ids(v: &[&str]) -> Vec<String> {
        v.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn first_poll_after_launch_seeds_without_notifying() {
        let got = run(&[ok(vec![item("P-1", "question"), item("P-2", "blocked")]), ok(vec![item("P-1", "question"), item("P-2", "blocked")])]);
        assert_eq!(got, vec![ids(&[]), ids(&[])]);
    }

    #[test]
    fn an_id_entering_items_notifies_once_and_staying_does_not() {
        let got = run(&[ok(vec![]), ok(vec![item("P-1", "question")]), ok(vec![item("P-1", "question")])]);
        assert_eq!(got, vec![ids(&[]), ids(&["P-1"]), ids(&[])]);
    }

    #[test]
    fn leaving_and_re_entering_notifies_again() {
        let a = || ok(vec![item("P-1", "hard-stop")]);
        let got = run(&[ok(vec![]), a(), ok(vec![]), a()]);
        assert_eq!(got, vec![ids(&[]), ids(&["P-1"]), ids(&[]), ids(&["P-1"])]);
    }

    #[test]
    fn a_board_error_between_two_polls_does_not_reset_the_seed() {
        let a = || ok(vec![item("P-1", "question")]);
        for err in [failed("unreachable"), failed("error"), failed("too-old"), board_error()] {
            let got = run(&[a(), err.clone(), a()]);
            assert_eq!(got, vec![ids(&[]), ids(&[]), ids(&[])], "{err:?}");
        }
    }

    #[test]
    fn an_error_before_the_first_good_poll_does_not_seed() {
        let got = run(&[board_error(), failed("unreachable"), ok(vec![item("P-1", "question")])]);
        assert_eq!(got, vec![ids(&[]), ids(&[]), ids(&[])]);
    }

    #[test]
    fn a_lane_entering_while_the_board_errs_notifies_when_it_answers() {
        let got = run(&[ok(vec![]), failed("unreachable"), ok(vec![item("P-1", "blocked")])]);
        assert_eq!(got, vec![ids(&[]), ids(&[]), ids(&["P-1"])]);
    }

    #[test]
    fn stale_items_never_notify() {
        let mut old = item("P-1", "question");
        old.since = Some(NOW - STALE_MS - 1.0);
        let mut counted = ok(vec![]);
        let att = counted.attention.as_mut().unwrap();
        att.stale_count = 3;
        att.stale_oldest = Some(NOW - 2.0 * STALE_MS);
        let got = run(&[ok(vec![]), ok(vec![old]), counted]);
        assert_eq!(got, vec![ids(&[]), ids(&[]), ids(&[])]);
    }

    #[test]
    fn only_waiting_kinds_notify() {
        let got = run(&[ok(vec![]), ok(vec![item("P-1", "done"), item("P-2", "resolved"), item("P-3", "blocked")])]);
        assert_eq!(got, vec![ids(&[]), ids(&["P-3"])]);
    }

    #[test]
    fn title_and_body_name_the_lane_the_kind_and_the_first_line() {
        let (seen, _) = step(&None, &ok(vec![]));
        let mut bare = item("P-3", "hard-stop");
        bare.first_line = Some("  ".into());
        let (_, n) = step(&seen, &ok(vec![item("P-1", "question"), item("P-2", "blocked"), bare]));
        let got: Vec<(&str, &str)> = n.iter().map(|n| (n.title.as_str(), n.body.as_str())).collect();
        assert_eq!(
            got,
            vec![
                ("Lane waiting for you", "P-1 \u{b7} question: first line of P-1"),
                ("Lane blocked", "P-2 \u{b7} blocked: first line of P-2"),
                ("Lane waiting for you", "P-3 \u{b7} hard-stop"),
            ]
        );
    }
}
