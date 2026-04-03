#!/usr/bin/env node
/**
 * extract-bi-paths.js
 * Reads all SVG files from bootstrap-icons/icons/, extracts path `d` attributes,
 * assigns a category based on the icon name prefix, and writes a typed TypeScript catalog file.
 *
 * Usage:  node scripts/extract-bi-paths.js
 * Output: frontend/src/components/panels/viewpoint-editor/tabs/bootstrapIconCatalog.ts
 */

const fs = require('fs');
const path = require('path');
const svgpath = require(path.resolve(__dirname, '../frontend/node_modules/svgpath'));

const ICONS_DIR = path.resolve(__dirname, '../frontend/node_modules/bootstrap-icons/icons');
const OUTPUT_FILE = path.resolve(
    __dirname,
    '../frontend/src/components/panels/viewpoint-editor/tabs/bootstrapIconCatalog.ts',
);

// Regex to extract viewBox
const VIEWBOX_RE = /viewBox="([^"]+)"/;

// ============================================================
// Category rules — order matters: first match wins.
// More specific prefixes MUST come before broader ones
// (e.g. x-circle before x-).
// ============================================================
const CATEGORY_RULES = [
    { category: 'Arrows',           pattern: /^(arrow|caret-|chevron-)/ },
    { category: 'Shapes',           pattern: /^(circle|square|triangle|diamond|hexagon|octagon|pentagon|star|heart)/ },
    { category: 'Diagrams',         pattern: /^(diagram|share|node-|bezier|bounding-box)/ },
    // Alerts before Interface so x-circle, x-octagon, x-square, x-diamond land here
    { category: 'Alerts & Status',  pattern: /^(exclamation|info-|question|check|x-circle|x-octagon|x-square|x-diamond|shield)/ },
    { category: 'Security',         pattern: /^(lock|unlock|key|eye)/ },
    { category: 'Communication',    pattern: /^(chat|envelope|send|inbox|reply)/ },
    { category: 'Files & Data',     pattern: /^(file|folder|database|server|hdd|cloud)/ },
    { category: 'People',           pattern: /^(person|people)/ },
    { category: 'Media',            pattern: /^(play|pause|stop|camera|image|film|music|volume|speaker)/ },
    // Interface is broad — catches remaining gear, pencil, trash, plus, dash, x-, toggle, sliders
    { category: 'Interface',        pattern: /^(gear|sliders|toggle|pencil|trash|plus|dash|x-|x$)/ },
];

/** Display order of categories in the UI */
const CATEGORY_ORDER = [
    'Shapes', 'Arrows', 'Diagrams',
    'Communication', 'Files & Data', 'Interface',
    'People', 'Alerts & Status', 'Security', 'Media',
    'Other',
];

function categorize(name) {
    for (const rule of CATEGORY_RULES) {
        if (rule.pattern.test(name)) return rule.category;
    }
    return 'Other';
}

// ============================================================
// Path normalization — convert all commands to absolute form
// (M, L, C, Q, A, Z) so the path editor can parse them.
// ============================================================

function normalizePath(d) {
    if (!d) return d;
    try {
        // abs()    — convert relative to absolute
        // unshort() — expand s→C, t→Q
        // unarc()  — convert A→C (arcs to cubic beziers)
        // iterate() — convert H→L, V→L
        return svgpath(d)
            .abs()
            .unshort()
            .unarc()
            .iterate(function (segment, index, x, y) {
                // Convert H x → L x, currentY
                if (segment[0] === 'H') {
                    segment[0] = 'L';
                    segment.push(y);
                }
                // Convert V y → L currentX, y
                if (segment[0] === 'V') {
                    segment[0] = 'L';
                    segment.splice(1, 0, x);
                }
            })
            .round(4)
            .toString();
    } catch (e) {
        console.warn(`  ⚠ Failed to normalize path, using original: ${e.message}`);
        return d;
    }
}

// ============================================================
// SVG primitive → path converters
// ============================================================

function attr(el, name) {
    const m = el.match(new RegExp(`\\b${name}="([^"]*)"`, ''));
    return m ? m[1] : null;
}
function numAttr(el, name, fallback = 0) {
    const v = attr(el, name);
    return v !== null ? parseFloat(v) : fallback;
}

function circleToPath(el) {
    const cx = numAttr(el, 'cx');
    const cy = numAttr(el, 'cy');
    const r = numAttr(el, 'r');
    if (r <= 0) return '';
    return `M${cx - r},${cy}A${r},${r} 0 1,0 ${cx + r},${cy}A${r},${r} 0 1,0 ${cx - r},${cy}Z`;
}

function rectToPath(el) {
    const x = numAttr(el, 'x');
    const y = numAttr(el, 'y');
    const w = numAttr(el, 'width');
    const h = numAttr(el, 'height');
    let rx = numAttr(el, 'rx');
    let ry = numAttr(el, 'ry', rx); // ry defaults to rx
    // Clamp to half-size
    rx = Math.min(rx, w / 2);
    ry = Math.min(ry, h / 2);
    // Handle transform="matrix(1 0 0 -1 tx ty)" (vertical flip)
    const transform = attr(el, 'transform');
    let flipY = false, tx = 0, ty = 0;
    if (transform) {
        const matrixMatch = transform.match(/matrix\(\s*1\s+0\s+0\s+-1\s+([\d.]+)\s+([\d.]+)\s*\)/);
        if (matrixMatch) {
            flipY = true;
            tx = parseFloat(matrixMatch[1]);
            ty = parseFloat(matrixMatch[2]);
        }
    }
    let ax = flipY ? tx + x : x;
    let ay = flipY ? ty - y - h : y;
    if (rx <= 0 && ry <= 0) {
        return `M${ax},${ay}L${ax + w},${ay}L${ax + w},${ay + h}L${ax},${ay + h}Z`;
    }
    return `M${ax + rx},${ay}`
        + `L${ax + w - rx},${ay}`
        + `A${rx},${ry} 0 0,1 ${ax + w},${ay + ry}`
        + `L${ax + w},${ay + h - ry}`
        + `A${rx},${ry} 0 0,1 ${ax + w - rx},${ay + h}`
        + `L${ax + rx},${ay + h}`
        + `A${rx},${ry} 0 0,1 ${ax},${ay + h - ry}`
        + `L${ax},${ay + ry}`
        + `A${rx},${ry} 0 0,1 ${ax + rx},${ay}Z`;
}

function lineToPath(el) {
    const x1 = numAttr(el, 'x1');
    const y1 = numAttr(el, 'y1');
    const x2 = numAttr(el, 'x2');
    const y2 = numAttr(el, 'y2');
    return `M${x1},${y1}L${x2},${y2}`;
}

function pointsToCoords(el) {
    const pts = attr(el, 'points');
    if (!pts) return [];
    return pts.trim().split(/[\s,]+/).reduce((acc, _, i, arr) => {
        if (i % 2 === 0) acc.push([parseFloat(arr[i]), parseFloat(arr[i + 1])]);
        return acc;
    }, []);
}

function polylineToPath(el) {
    const coords = pointsToCoords(el);
    if (coords.length === 0) return '';
    return 'M' + coords.map(c => c.join(',')).join('L');
}

function polygonToPath(el) {
    const p = polylineToPath(el);
    return p ? p + 'Z' : '';
}

// ============================================================
// Main path extraction — handles <path>, <circle>, <rect>,
// <line>, <polyline>, <polygon>
// ============================================================

function extractPaths(svgContent) {
    const paths = [];

    // <path d="...">
    const pathRe = /<path\b[^>]*\bd="([^"]+)"[^>]*\/?>/g;
    let m;
    while ((m = pathRe.exec(svgContent)) !== null) {
        paths.push(normalizePath(m[1]));
    }

    // <circle>
    const circleRe = /<circle\b[^>]*\/?>/g;
    while ((m = circleRe.exec(svgContent)) !== null) {
        const p = circleToPath(m[0]);
        if (p) paths.push(p);
    }

    // <rect> (skip the outer <svg> viewBox rect if any — only match <rect with attributes)
    const rectRe = /<rect\b[^>]*(?:width|height)[^>]*\/?>/g;
    while ((m = rectRe.exec(svgContent)) !== null) {
        const p = rectToPath(m[0]);
        if (p) paths.push(p);
    }

    // <line>
    const lineRe = /<line\b[^>]*\/?>/g;
    while ((m = lineRe.exec(svgContent)) !== null) {
        const p = lineToPath(m[0]);
        if (p) paths.push(p);
    }

    // <polyline>
    const polylineRe = /<polyline\b[^>]*\/?>/g;
    while ((m = polylineRe.exec(svgContent)) !== null) {
        const p = polylineToPath(m[0]);
        if (p) paths.push(p);
    }

    // <polygon>
    const polygonRe = /<polygon\b[^>]*\/?>/g;
    while ((m = polygonRe.exec(svgContent)) !== null) {
        const p = polygonToPath(m[0]);
        if (p) paths.push(p);
    }

    // Normalize the final combined path — converts any A commands from
    // circleToPath/rectToPath and ensures only M, L, C, Q, Z remain.
    return normalizePath(paths.join(' '));
}

function extractViewBox(svgContent) {
    const m = VIEWBOX_RE.exec(svgContent);
    return m ? m[1] : '0 0 16 16';
}

function main() {
    if (!fs.existsSync(ICONS_DIR)) {
        console.error(`Icons directory not found: ${ICONS_DIR}`);
        console.error('Make sure bootstrap-icons is installed (npm install in frontend/).');
        process.exit(1);
    }

    const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.svg')).sort();
    console.log(`Found ${files.length} SVG icons in ${ICONS_DIR}`);

    const entries = [];
    const categoryCounts = {};

    for (const file of files) {
        const name = file.replace('.svg', '');
        const content = fs.readFileSync(path.join(ICONS_DIR, file), 'utf-8');
        const pathD = extractPaths(content);
        const viewBox = extractViewBox(content);

        if (!pathD) continue;

        const category = categorize(name);
        entries.push({ name, path: pathD, viewBox, category });

        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }

    console.log(`Extracted ${entries.length} icons with valid path data.`);
    console.log('Category breakdown:');
    for (const cat of CATEGORY_ORDER) {
        if (categoryCounts[cat]) {
            console.log(`  ${cat}: ${categoryCounts[cat]}`);
        }
    }

    // Generate TypeScript output
    const lines = [
        '// AUTO-GENERATED — do not edit. Run: node scripts/extract-bi-paths.js',
        `// Generated from ${entries.length} bootstrap-icons SVGs`,
        '',
        'export interface BootstrapIconEntry {',
        '    name: string;',
        '    path: string;',
        '    viewBox: string;',
        '    category: string;',
        '}',
        '',
        `/** Display order of Bootstrap Icon categories */`,
        `export const BOOTSTRAP_ICON_CATEGORIES: string[] = [`,
    ];

    for (const cat of CATEGORY_ORDER) {
        lines.push(`    '${cat}',`);
    }
    lines.push('];');
    lines.push('');

    lines.push('export const BOOTSTRAP_ICON_CATALOG: BootstrapIconEntry[] = [');

    for (const entry of entries) {
        const safePath = entry.path.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        lines.push(`    { name: '${entry.name}', path: '${safePath}', viewBox: '${entry.viewBox}', category: '${entry.category}' },`);
    }

    lines.push('];');
    lines.push('');

    // Write output
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf-8');
    console.log(`Written to ${OUTPUT_FILE}`);
}

main();
