/**
 * The pure part of the pinned hover card (lane D6, R-TXT-42; design in docs/discovery/discovery_2026-11-08_textual_d6_pinned_hover.md):
 * the links of a hover as data, so the hover writes them in Markdown and the card as buttons, and what the widget asks of
 * the editor's layout and of Tab.
 */

import type { TextAnalysis } from './languageService';

/** The lines of uses a hover or a card lists before it counts the rest. */
const HOVER_USE_LINES = 12;
/** A use's line is cut at this length. */
const USE_TEXT_MAX = 40;
const CARD_MAX_WIDTH = 480;
const CARD_MAX_HEIGHT = 320;
const CARD_MIN_HEIGHT = 96;
/** Monaco's public API gives no hover rect: a hover's far corner from its Pin link, in px. */
const HOVER_CLEAR_DISTANCE = 400;

export type HoverCardAnalysis = Pick<TextAnalysis, 'definitionAt' | 'referencesAt' | 'hoverAt'>;

/** A model's lines, 1-based as Monaco counts them. */
export interface HoverCardLines {
    lineOf(offset: number): number;
    textOf(line: number): string;
}

export interface HoverCardUse {
    readonly line: number;
    /** The offset of the line's first use. */
    readonly at: number;
    readonly text: string;
}

export interface HoverCardLinks {
    readonly definition: { readonly at: number; readonly line: number } | null;
    /** At most `HOVER_USE_LINES`. */
    readonly uses: readonly HoverCardUse[];
    /** The lines that use the reference, those not listed included. */
    readonly usedOn: number;
}

export interface HoverCard {
    /** The hovered token's start: the card's anchor. */
    readonly start: number;
    readonly contents: readonly string[];
    readonly links: HoverCardLinks;
}

/** The definition, and one entry per line that uses the object declared or named at `offset`. */
export function hoverLinks(a: HoverCardAnalysis, offset: number, lines: HoverCardLines): HoverCardLinks {
    const d = a.definitionAt(offset);
    const first = new Map<number, number>();
    for (const r of a.referencesAt(offset, false)) {
        const line = lines.lineOf(r.start);
        if (!first.has(line)) first.set(line, r.start);
    }
    const uses = [...first].slice(0, HOVER_USE_LINES).map(([line, at]) => {
        const text = lines.textOf(line).trim();
        return { line, at, text: text.length > USE_TEXT_MAX ? `${text.slice(0, USE_TEXT_MAX - 1)}…` : text };
    });
    return { definition: d ? { at: d.start, line: lines.lineOf(d.start) } : null, uses, usedOn: first.size };
}

/** The hover's paragraphs of links, each link written by `link`. */
export function hoverLinksMarkdown(l: HoverCardLinks, link: (label: string, offset: number) => string): string[] {
    const out: string[] = [];
    if (l.definition) out.push(`${link('Go to definition', l.definition.at)} · line ${l.definition.line}`);
    if (!l.usedOn) return out;
    const shown = l.uses.map(u => `${link(`line ${u.line}`, u.at)} \`${u.text.replace(/`/g, "'")}\``);
    const more = l.usedOn > l.uses.length ? [`and ${l.usedOn - l.uses.length} more lines`] : [];
    out.push([`Used on ${l.usedOn} line${l.usedOn === 1 ? '' : 's'}:`, ...shown, ...more].join('  \n'));
    return out;
}

/** What a card pinned at `offset` shows: the hover there, or nothing where there is no hover. */
export function hoverCard(a: HoverCardAnalysis, offset: number, lines: HoverCardLines): HoverCard | null {
    const h = a.hoverAt(offset);
    return h ? { start: h.start, contents: h.contents, links: hoverLinks(a, offset, lines) } : null;
}

/**
 * Whether the card's line is on screen (R-TXT-42, its fifth rule). A fold splits the visible ranges. An editor of no height
 * is a hidden panel, not a scroll: no verdict.
 */
export function cardLineInView(line: number, ranges: readonly { readonly startLineNumber: number; readonly endLineNumber: number }[], height: number): boolean {
    return height <= 0 || ranges.some(r => r.startLineNumber <= line && line <= r.endLineNumber);
}

export interface CardLimits {
    readonly maxWidth: number;
    readonly maxHeight: number;
}

/** Monaco clamps a card inside the text's width, if it fits there, and above or below its line, if it fits in half the rest. */
export function cardLimits(layout: { readonly contentWidth: number; readonly height: number; readonly lineHeight: number }): CardLimits {
    return {
        maxWidth: Math.min(CARD_MAX_WIDTH, layout.contentWidth),
        maxHeight: Math.min(CARD_MAX_HEIGHT, Math.max(CARD_MIN_HEIGHT, Math.floor((layout.height - layout.lineHeight) / 2))),
    };
}

/** Whether the pointer has travelled off the hover it pinned from, so a hover it starts now cannot be that one's place, over the card. */
export function pointerClearOfHover(from: { readonly x: number; readonly y: number }, to: { readonly x: number; readonly y: number }): boolean {
    return Math.hypot(to.x - from.x, to.y - from.y) > HOVER_CLEAR_DISTANCE;
}

/** The index Tab moves to among `count` focusable items, wrapping; `at` is -1 on the card itself. */
export function cardTabTarget(at: number, count: number, back: boolean): number {
    if (back) return at <= 0 ? count - 1 : at - 1;
    return (at + 1) % count;
}
