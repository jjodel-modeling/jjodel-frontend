//! Polls the lane board's `GET /api/attention` over a plain `std::net::TcpStream`.
//!
//! The board is a local HTTP server (`frontend/scripts/lane-board/lane-board.mjs`), so the
//! client is a single GET with `Connection: close`: no HTTP crate, no TLS, no redirects. The
//! response parser accepts a `Content-Length` body, a chunked body and a body read to EOF.

use std::io::{Read, Write};
use std::net::{TcpStream, ToSocketAddrs};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

pub const ATTENTION_PATH: &str = "/api/attention";
pub const DEFAULT_BOARD: &str = "http://127.0.0.1:4700";
/// Connecting to a local port either works at once or not at all.
const CONNECT_TIMEOUT: Duration = Duration::from_secs(2);
/// The board answers from a cached snapshot, but a refresh can hold a request for seconds
/// (measured 3.6 s on 4712, 2026-10-19).
const READ_TIMEOUT: Duration = Duration::from_secs(15);
const MAX_RESPONSE: usize = 1 << 20;

/// Host and port of the board, from a `http://host:port` URL.
#[derive(Debug, Clone, PartialEq)]
pub struct Endpoint {
    pub host: String,
    pub port: u16,
}

/// Parses the board URL. Only `http://` is accepted; a trailing slash is ignored; a path is
/// refused (the board serves from its root).
pub fn parse_base(url: &str) -> Result<Endpoint, String> {
    let rest = url
        .trim()
        .strip_prefix("http://")
        .ok_or_else(|| format!("not an http:// URL: {url}"))?;
    let authority = rest.trim_end_matches('/');
    if authority.is_empty() || authority.contains('/') {
        return Err(format!("expected http://host:port, got {url}"));
    }
    let (host, port) = match authority.rsplit_once(':') {
        Some((h, p)) => (h, p.parse::<u16>().map_err(|_| format!("bad port in {url}"))?),
        None => (authority, 80),
    };
    if host.is_empty() {
        return Err(format!("no host in {url}"));
    }
    Ok(Endpoint { host: host.to_string(), port })
}

#[derive(Debug, PartialEq)]
pub struct Response {
    pub status: u16,
    /// Header names lowercased, in arrival order.
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

impl Response {
    pub fn header(&self, name: &str) -> Option<&str> {
        self.headers.iter().find(|(n, _)| n == name).map(|(_, v)| v.as_str())
    }
}

fn find(hay: &[u8], needle: &[u8]) -> Option<usize> {
    hay.windows(needle.len()).position(|w| w == needle)
}

/// Parses a complete HTTP/1.x response as read from a closed connection.
pub fn parse_response(raw: &[u8]) -> Result<Response, String> {
    let split = find(raw, b"\r\n\r\n").ok_or("no end of headers")?;
    let head = std::str::from_utf8(&raw[..split]).map_err(|_| "headers are not UTF-8")?;
    let rest = &raw[split + 4..];
    let mut lines = head.split("\r\n");
    let status_line = lines.next().unwrap_or("");
    let mut parts = status_line.splitn(3, ' ');
    let version = parts.next().unwrap_or("");
    if !version.starts_with("HTTP/1.") {
        return Err(format!("bad status line: {status_line}"));
    }
    let status = parts
        .next()
        .and_then(|s| s.parse::<u16>().ok())
        .ok_or_else(|| format!("bad status line: {status_line}"))?;
    let mut headers = Vec::new();
    for line in lines {
        let (name, value) = line.split_once(':').ok_or_else(|| format!("bad header: {line}"))?;
        headers.push((name.trim().to_ascii_lowercase(), value.trim().to_string()));
    }
    let mut res = Response { status, headers, body: Vec::new() };
    let chunked = res
        .header("transfer-encoding")
        .map(|v| v.to_ascii_lowercase().contains("chunked"))
        .unwrap_or(false);
    res.body = if chunked {
        decode_chunked(rest)?
    } else if let Some(len) = res.header("content-length") {
        let len: usize = len.parse().map_err(|_| format!("bad content-length: {len}"))?;
        if rest.len() < len {
            return Err(format!("body cut short: {} of {len} bytes", rest.len()));
        }
        rest[..len].to_vec()
    } else {
        rest.to_vec()
    };
    Ok(res)
}

fn decode_chunked(mut data: &[u8]) -> Result<Vec<u8>, String> {
    let mut out = Vec::new();
    loop {
        let eol = find(data, b"\r\n").ok_or("chunk size line not terminated")?;
        let line = std::str::from_utf8(&data[..eol]).map_err(|_| "chunk size is not UTF-8")?;
        let hex = line.split(';').next().unwrap_or("").trim();
        let size = usize::from_str_radix(hex, 16).map_err(|_| format!("bad chunk size: {line}"))?;
        data = &data[eol + 2..];
        if size == 0 {
            return Ok(out);
        }
        if data.len() < size + 2 || &data[size..size + 2] != b"\r\n" {
            return Err("chunk cut short".into());
        }
        out.extend_from_slice(&data[..size]);
        data = &data[size + 2..];
    }
}

#[derive(Debug, PartialEq)]
pub enum FetchError {
    /// No TCP connection: refused, timed out, host not resolved.
    Unreachable(String),
    /// Connected, but no complete answer before the read timeout.
    NoAnswer(String),
    /// Connected, but the bytes are not an HTTP response.
    Malformed(String),
}

/// One GET of `path` on the board, read to EOF.
pub fn get(
    ep: &Endpoint,
    path: &str,
    connect_timeout: Duration,
    read_timeout: Duration,
) -> Result<Response, FetchError> {
    let addr = (ep.host.as_str(), ep.port)
        .to_socket_addrs()
        .map_err(|e| FetchError::Unreachable(e.to_string()))?
        .next()
        .ok_or_else(|| FetchError::Unreachable(format!("{} does not resolve", ep.host)))?;
    let mut stream = TcpStream::connect_timeout(&addr, connect_timeout)
        .map_err(|e| FetchError::Unreachable(format!("{addr}: {e}")))?;
    let io = |e: std::io::Error| FetchError::NoAnswer(e.to_string());
    stream.set_read_timeout(Some(read_timeout)).map_err(io)?;
    stream.set_write_timeout(Some(read_timeout)).map_err(io)?;
    let request = format!(
        "GET {path} HTTP/1.1\r\nHost: {}:{}\r\nAccept: application/json\r\n\
         User-Agent: lane-monitor/{}\r\nConnection: close\r\n\r\n",
        ep.host,
        ep.port,
        env!("CARGO_PKG_VERSION")
    );
    stream.write_all(request.as_bytes()).map_err(io)?;
    let mut raw = Vec::new();
    stream
        .take(MAX_RESPONSE as u64 + 1)
        .read_to_end(&mut raw)
        .map_err(io)?;
    if raw.len() > MAX_RESPONSE {
        return Err(FetchError::Malformed("response over 1 MB".into()));
    }
    parse_response(&raw).map_err(FetchError::Malformed)
}

// The `/api/attention` payload (shape in frontend/scripts/lane-board/README.md). Every field
// is optional so that a board one version ahead still parses.

#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Item {
    pub id: String,
    pub kind: Option<String>,
    pub lane_kind: Option<String>,
    pub title: Option<String>,
    pub chat: Option<String>,
    pub chat_url: Option<String>,
    pub first_line: Option<String>,
    pub recommended: Option<String>,
    pub since: Option<f64>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase")]
pub struct RunningItem {
    pub id: String,
    pub lane_kind: Option<String>,
    pub title: Option<String>,
    pub phase: Option<String>,
    pub left: Option<String>,
    pub since: Option<f64>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Attention {
    pub v: u32,
    pub now: Option<f64>,
    pub stale: bool,
    pub board: Option<String>,
    pub waiting: u32,
    pub blocked: u32,
    pub running: u32,
    pub stale_count: u32,
    pub stale_oldest: Option<f64>,
    pub items: Vec<Item>,
    pub running_items: Vec<RunningItem>,
}

/// What the tray and the popover show. `state` is one of `pending`, `ok`, `unreachable`,
/// `too-old` (the board answers 404 on `/api/attention`: the release tree predates S1) and
/// `error` (anything else).
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub state: &'static str,
    pub detail: String,
    pub board_url: String,
    /// Epoch milliseconds of the last successful poll, kept across failures.
    pub synced_at: Option<u64>,
    pub attention: Option<Attention>,
}

impl Snapshot {
    pub fn pending(board_url: &str) -> Self {
        Snapshot {
            state: "pending",
            detail: String::new(),
            board_url: board_url.to_string(),
            synced_at: None,
            attention: None,
        }
    }
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Turns one fetch result into the next snapshot; `prev_synced` survives a failure.
pub fn classify(
    result: Result<Response, FetchError>,
    board_url: &str,
    prev_synced: Option<u64>,
    now: u64,
) -> Snapshot {
    let mut snap = Snapshot { synced_at: prev_synced, ..Snapshot::pending(board_url) };
    match result {
        Err(FetchError::Unreachable(e)) => {
            snap.state = "unreachable";
            snap.detail = e;
        }
        Err(FetchError::NoAnswer(e)) => {
            snap.state = "error";
            snap.detail = format!("no answer: {e}");
        }
        Err(FetchError::Malformed(e)) => {
            snap.state = "error";
            snap.detail = e;
        }
        Ok(res) if res.status == 404 => {
            snap.state = "too-old";
            snap.detail = "board too old: update the release tree".into();
        }
        Ok(res) if res.status != 200 => {
            snap.state = "error";
            snap.detail = format!("HTTP {}", res.status);
        }
        Ok(res) => match serde_json::from_slice::<Attention>(&res.body) {
            Ok(att) => {
                snap.state = "ok";
                snap.synced_at = Some(now);
                snap.attention = Some(att);
            }
            Err(e) => {
                snap.state = "error";
                snap.detail = format!("bad JSON: {e}");
            }
        },
    }
    snap
}

/// One poll of the board at `board_url`.
pub fn poll_once(board_url: &str, prev_synced: Option<u64>) -> Snapshot {
    let result = match parse_base(board_url) {
        Ok(ep) => get(&ep, ATTENTION_PATH, CONNECT_TIMEOUT, READ_TIMEOUT),
        Err(e) => Err(FetchError::Malformed(format!("LANE_MONITOR_BOARD: {e}"))),
    };
    classify(result, board_url, prev_synced, now_ms())
}

/// The menu bar title: `⏸<waiting>` then `▶<running>`, a zero count left out, `!` right after
/// the waiting count when a lane is blocked (a template icon cannot carry a coloured dot). A
/// blocked lane with nothing waiting still shows `⏸0!`. Empty when idle (only the icon
/// remains); `–` when there is no count to show.
pub fn title_for(snap: &Snapshot) -> String {
    match (&snap.attention, snap.state) {
        (Some(att), "ok") => {
            let mut parts: Vec<String> = Vec::new();
            if att.waiting > 0 || att.blocked > 0 {
                parts.push(format!("\u{23F8}{}{}", att.waiting, if att.blocked > 0 { "!" } else { "" }));
            }
            if att.running > 0 {
                parts.push(format!("\u{25B6}{}", att.running));
            }
            parts.join(" ")
        }
        _ => "\u{2013}".to_string(),
    }
}

fn lanes(n: u32, rest: &str) -> String {
    format!("{} {}{}", n, if n == 1 { "lane" } else { "lanes" }, rest)
}

/// The tray tooltip in full words; the board's own detail when there is no count.
pub fn tooltip_for(snap: &Snapshot) -> String {
    match (&snap.attention, snap.state) {
        (Some(a), "ok") => {
            let mut parts: Vec<String> = Vec::new();
            if a.waiting > 0 {
                let blocked = if a.blocked > 0 { format!(" ({} blocked)", a.blocked) } else { String::new() };
                parts.push(format!("{}{}", lanes(a.waiting, " waiting for you"), blocked));
            } else if a.blocked > 0 {
                parts.push(lanes(a.blocked, " blocked"));
            }
            if a.running > 0 {
                parts.push(lanes(a.running, " running"));
            }
            if parts.is_empty() {
                "No lanes waiting or running".to_string()
            } else {
                parts.join(", ")
            }
        }
        _ if snap.state == "unreachable" => format!("Lanes: board unreachable ({})", snap.detail),
        _ => format!("Lanes: {}", snap.detail),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::TcpListener;
    use std::thread;

    const BODY: &str = r#"{"v":1,"now":1792300000000,"stale":false,"board":"ok","waiting":2,"blocked":1,"running":1,"staleCount":12,"staleOldest":1790960000000,"items":[{"id":"P-2026-10-18-2220","kind":"hard-stop","laneKind":"discovery","title":"Harness health","chat":"C-2026-10-18-2225","chatUrl":null,"firstLine":"The slice works, but I can't commit it yet.","recommended":"GO","since":1792298000000},{"id":"P-2026-10-18-2300","kind":"blocked","firstLine":"over its limit since 22:10","since":1792299000000}],"runningItems":[{"id":"P-2026-10-19-0000","laneKind":"phase2","title":"Tauri shell","phase":"build","left":"about 20 min","since":1792299500000}],"futureField":true}"#;

    fn content_length_fixture() -> Vec<u8> {
        format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{BODY}",
            BODY.len()
        )
        .into_bytes()
    }

    fn chunked_fixture() -> Vec<u8> {
        let (a, b) = BODY.split_at(40);
        format!(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n{:x}\r\n{a}\r\n{:x};ext=1\r\n{b}\r\n0\r\n\r\n",
            a.len(),
            b.len()
        )
        .into_bytes()
    }

    const NOT_FOUND: &[u8] =
        b"HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: 9\r\n\r\nnot found";

    fn ok(raw: &[u8]) -> Snapshot {
        classify(parse_response(raw).map_err(FetchError::Malformed), "http://b", None, 42)
    }

    #[test]
    fn status_line_and_headers() {
        let res = parse_response(&content_length_fixture()).unwrap();
        assert_eq!(res.status, 200);
        assert_eq!(res.header("content-type"), Some("application/json"));
        assert_eq!(res.header("connection"), Some("close"));
        assert_eq!(res.headers.len(), 3);
    }

    #[test]
    fn content_length_body() {
        let mut raw = content_length_fixture();
        raw.extend_from_slice(b"trailing bytes past content-length");
        assert_eq!(parse_response(&raw).unwrap().body, BODY.as_bytes());
    }

    #[test]
    fn content_length_cut_short_is_an_error() {
        let raw = content_length_fixture();
        assert!(parse_response(&raw[..raw.len() - 5]).unwrap_err().contains("cut short"));
    }

    #[test]
    fn chunked_body() {
        assert_eq!(parse_response(&chunked_fixture()).unwrap().body, BODY.as_bytes());
    }

    #[test]
    fn chunked_cut_short_is_an_error() {
        let raw = chunked_fixture();
        assert!(parse_response(&raw[..raw.len() - 30]).is_err());
    }

    #[test]
    fn body_to_eof_without_length() {
        let res = parse_response(b"HTTP/1.0 200 OK\r\nX-A: 1\r\n\r\n{\"waiting\":3}").unwrap();
        assert_eq!(res.body, b"{\"waiting\":3}");
    }

    #[test]
    fn garbage_is_rejected() {
        assert!(parse_response(b"hello").is_err());
        assert!(parse_response(b"SSH-2.0-OpenSSH\r\n\r\n").is_err());
        assert!(parse_response(b"HTTP/1.1 abc OK\r\n\r\n").is_err());
        assert!(parse_response(b"HTTP/1.1 200 OK\r\nno colon\r\n\r\n").is_err());
    }

    #[test]
    fn a_404_is_too_old() {
        let snap = ok(NOT_FOUND);
        assert_eq!(snap.state, "too-old");
        assert_eq!(snap.detail, "board too old: update the release tree");
        assert_eq!(title_for(&snap), "\u{2013}");
    }

    #[test]
    fn a_500_is_an_error() {
        let snap = ok(b"HTTP/1.1 500 Internal\r\nContent-Length: 0\r\n\r\n");
        assert_eq!((snap.state, snap.detail.as_str()), ("error", "HTTP 500"));
    }

    #[test]
    fn bad_json_is_an_error() {
        let snap = ok(b"HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\n<html");
        assert_eq!(snap.state, "error");
        assert!(snap.detail.starts_with("bad JSON"));
    }

    #[test]
    fn payload_parses_with_nulls_and_unknown_fields() {
        let snap = ok(&chunked_fixture());
        assert_eq!(snap.state, "ok");
        assert_eq!(snap.synced_at, Some(42));
        let att = snap.attention.unwrap();
        assert_eq!((att.waiting, att.blocked, att.running, att.stale_count), (2, 1, 1, 12));
        assert_eq!(att.items[0].id, "P-2026-10-18-2220");
        assert_eq!(att.items[0].chat_url, None);
        assert_eq!(att.items[1].kind.as_deref(), Some("blocked"));
        assert_eq!(att.running_items[0].left.as_deref(), Some("about 20 min"));
    }

    #[test]
    fn synced_at_survives_a_failure() {
        let snap = classify(Err(FetchError::Unreachable("refused".into())), "http://b", Some(7), 99);
        assert_eq!((snap.state, snap.synced_at), ("unreachable", Some(7)));
    }

    #[test]
    fn title_formatter() {
        let with = |waiting, blocked, running| Snapshot {
            state: "ok",
            attention: Some(Attention { waiting, blocked, running, ..Default::default() }),
            ..Snapshot::pending("http://b")
        };
        assert_eq!(title_for(&with(0, 0, 2)), "\u{25B6}2");
        assert_eq!(title_for(&with(1, 0, 2)), "\u{23F8}1 \u{25B6}2");
        assert_eq!(title_for(&with(0, 0, 0)), "");
        assert_eq!(title_for(&with(1, 1, 0)), "\u{23F8}1!");
        assert_eq!(title_for(&with(3, 1, 1)), "\u{23F8}3! \u{25B6}1");
        assert_eq!(title_for(&with(0, 2, 0)), "\u{23F8}0!");
        assert_eq!(title_for(&Snapshot::pending("http://b")), "\u{2013}");
        let unreachable = classify(Err(FetchError::Unreachable("x".into())), "http://b", Some(1), 2);
        assert_eq!(title_for(&unreachable), "\u{2013}");
    }

    #[test]
    fn tooltip_formatter() {
        let with = |waiting, blocked, running| Snapshot {
            state: "ok",
            attention: Some(Attention { waiting, blocked, running, ..Default::default() }),
            ..Snapshot::pending("http://b")
        };
        assert_eq!(tooltip_for(&with(0, 0, 2)), "2 lanes running");
        assert_eq!(tooltip_for(&with(1, 0, 2)), "1 lane waiting for you, 2 lanes running");
        assert_eq!(tooltip_for(&with(0, 0, 0)), "No lanes waiting or running");
        assert_eq!(tooltip_for(&with(1, 1, 0)), "1 lane waiting for you (1 blocked)");
        assert_eq!(tooltip_for(&with(0, 2, 1)), "2 lanes blocked, 1 lane running");
        let unreachable = classify(Err(FetchError::Unreachable("x".into())), "http://b", Some(1), 2);
        assert!(tooltip_for(&unreachable).starts_with("Lanes: board unreachable"));
    }

    #[test]
    fn base_url() {
        let ep = parse_base("http://127.0.0.1:4712/").unwrap();
        assert_eq!(ep, Endpoint { host: "127.0.0.1".into(), port: 4712 });
        assert_eq!(parse_base("http://localhost").unwrap().port, 80);
        assert!(parse_base("https://127.0.0.1:4700").is_err());
        assert!(parse_base("http://127.0.0.1:4700/board").is_err());
        assert!(parse_base("http://127.0.0.1:x").is_err());
        assert!(parse_base("http://:4700").is_err());
    }

    /// Serves `raw` once on a free port and returns the port and the request it received.
    fn serve_once(raw: Vec<u8>) -> (u16, thread::JoinHandle<String>) {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let handle = thread::spawn(move || {
            let (mut s, _) = listener.accept().unwrap();
            let mut buf = [0u8; 1024];
            let n = s.read(&mut buf).unwrap();
            s.write_all(&raw).unwrap();
            String::from_utf8_lossy(&buf[..n]).into_owned()
        });
        (port, handle)
    }

    #[test]
    fn get_over_tcp_chunked() {
        let (port, server) = serve_once(chunked_fixture());
        let ep = Endpoint { host: "127.0.0.1".into(), port };
        let res = get(&ep, ATTENTION_PATH, CONNECT_TIMEOUT, READ_TIMEOUT).unwrap();
        assert_eq!(res.body, BODY.as_bytes());
        let request = server.join().unwrap();
        assert!(request.starts_with("GET /api/attention HTTP/1.1\r\n"));
        assert!(request.contains(&format!("Host: 127.0.0.1:{port}\r\n")));
        assert!(request.contains("Connection: close\r\n"));
    }

    #[test]
    fn poll_once_over_tcp_404() {
        let (port, server) = serve_once(NOT_FOUND.to_vec());
        let snap = poll_once(&format!("http://127.0.0.1:{port}"), None);
        server.join().unwrap();
        assert_eq!(snap.state, "too-old");
    }

    #[test]
    fn silent_server_is_no_answer() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let ep = Endpoint { host: "127.0.0.1".into(), port: listener.local_addr().unwrap().port() };
        match get(&ep, ATTENTION_PATH, CONNECT_TIMEOUT, Duration::from_millis(200)) {
            Err(FetchError::NoAnswer(_)) => {}
            other => panic!("expected NoAnswer, got {other:?}"),
        }
        drop(listener);
    }

    #[test]
    fn refused_connection_is_unreachable() {
        let port = {
            let l = TcpListener::bind("127.0.0.1:0").unwrap();
            l.local_addr().unwrap().port()
        };
        let ep = Endpoint { host: "127.0.0.1".into(), port };
        match get(&ep, ATTENTION_PATH, CONNECT_TIMEOUT, READ_TIMEOUT) {
            Err(FetchError::Unreachable(_)) => {}
            other => panic!("expected Unreachable, got {other:?}"),
        }
        let snap = poll_once(&format!("http://127.0.0.1:{port}"), Some(5));
        assert_eq!((snap.state, snap.synced_at), ("unreachable", Some(5)));
        assert_eq!(title_for(&snap), "\u{2013}");
    }
}
