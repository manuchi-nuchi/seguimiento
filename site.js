
function onMobile(){
    var match = window.matchMedia('(pointer:coarse)');
    return (match && match.matches);
}

const ELEMENT_BASELINE_COLOR = '#b1b1b1'; // light gray
const ELEMENT_BASELINE_WIDTH = onMobile() ? 1 : 0.2;

const ELEMENT_HEIGHT = 150;

const ELEMENT_START = '5vw';
const ELEMENT_END = '97vw';
const ELEMENT_GAP = 25;
const TOP_MARGIN = 30;

const COLOR_LINE_1 = '#ffa3eb';
const COLOR_LINE_2 = '#ad9eff';
const COLOR_LINE_3 = '#ffc072';
const COLOR_LINE_4 = '#7ecba1';

const COLOR_BG = '#fcfffe';
const COLOR_WORK_SESSION = '#a0c4ff';
const VLINE_COLOR = '#7197d4';
const VLINE_WIDTH = 2;

const COLOR_POINT_FILL = '#FFFFFF';
const COLOR_POINT_BORDER = '#000000';

const LINE_THICKNESS = 7;
const POINT_SIZE = 30;
const COLOR_ILLNESS = '#f18b8b';
const COLOR_ILLNESS_BORDER = '#cc6464';
const ILLNESS_CORNER_RADIUS = 999;

function hourToPercent(h) {
    return (h - 7) / (24 - 7) * 100;
}

function darkenColor(hexColor, percent) {
    const num = parseInt(hexColor.replace('#',''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function roundedPolygonPath(points, radii) {
    const pts = [{ ...points[0], r: radii[0] }];
    for (let i = 1; i < points.length; i++) {
        if (points[i].x !== pts[pts.length - 1].x || points[i].y !== pts[pts.length - 1].y)
            pts.push({ ...points[i], r: radii[i] });
    }
    if (pts.length > 1 && pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y)
        pts.pop();
    const n = pts.length;
    if (n < 3) return '';
    let d = '';
    for (let i = 0; i < n; i++) {
        const prev = pts[(i - 1 + n) % n];
        const curr = pts[i];
        const next = pts[(i + 1) % n];
        const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const r = Math.min(curr.r, len1 / 2, len2 / 2);
        const x1 = curr.x - (dx1 / len1) * r;
        const y1 = curr.y - (dy1 / len1) * r;
        const x2 = curr.x + (dx2 / len2) * r;
        const y2 = curr.y + (dy2 / len2) * r;
        if (i === 0) d += 'M ' + x1 + ' ' + y1 + ' ';
        else d += 'L ' + x1 + ' ' + y1 + ' ';
        d += 'Q ' + curr.x + ' ' + curr.y + ' ' + x2 + ' ' + y2 + ' ';
    }
    d += 'Z';
    return d;
}


const GOOGLE_DOC_URL = 'https://docs.google.com/document/d/1bFv__rkfud3QeKkt3E_FrutASBv4vxwb8HY1B9-zu6c/export?format=txt';

const allTooltips = [];

async function init() {
    let DATA;
    const res = await fetch(GOOGLE_DOC_URL);
    DATA = (await res.text()).replace(/\r\n/g, '\n');

const blocks = DATA.trim().split(/\n-[^\n]*\n/);
const container = document.getElementById('container');
container.style.marginTop = TOP_MARGIN + 'px';

// Create legend at the top
const legend = document.createElement('div');
legend.style.display = 'flex';
legend.style.alignItems = 'center';
legend.style.gap = '40px';
legend.style.height = '50px';
legend.style.marginTop = '20px';
legend.style.marginRight = '60px';
legend.style.justifyContent = 'flex-end';

const legendItems = [
    { color: COLOR_LINE_1, letter: 'l' },
    { color: COLOR_LINE_2, letter: 'h' },
    { color: COLOR_LINE_3, letter: 'i' },
    { color: COLOR_LINE_4, letter: 'e' }
];

for (const item of legendItems) {
    const legendItem = document.createElement('div');
    legendItem.style.display = 'flex';
    legendItem.style.alignItems = 'center';
    legendItem.style.gap = '8px';

    const circle = document.createElement('div');
    circle.style.width = '20px';
    circle.style.height = '20px';
    circle.style.borderRadius = '50%';
    circle.style.backgroundColor = item.color;
    circle.style.border = '2px solid ' + darkenColor(item.color, 50);
    circle.style.boxSizing = 'border-box';

    const letter = document.createElement('span');
    letter.style.fontSize = '16px';
    letter.style.fontWeight = 'bold';
    letter.textContent = item.letter;

    legendItem.appendChild(circle);
    legendItem.appendChild(letter);
    legend.appendChild(legendItem);
}

const sessionLegendItem = document.createElement('div');
sessionLegendItem.style.display = 'flex';
sessionLegendItem.style.alignItems = 'center';
sessionLegendItem.style.gap = '8px';

const sessionSquare = document.createElement('div');
sessionSquare.style.width = '20px';
sessionSquare.style.height = '20px';
sessionSquare.style.borderRadius = '4px';
sessionSquare.style.backgroundColor = COLOR_WORK_SESSION;
sessionSquare.style.border = '2px solid ' + darkenColor(COLOR_WORK_SESSION, 50);
sessionSquare.style.boxSizing = 'border-box';

const sessionLetter = document.createElement('span');
sessionLetter.style.fontSize = '16px';
sessionLetter.style.fontWeight = 'bold';
sessionLetter.textContent = 'c';

sessionLegendItem.appendChild(sessionSquare);
sessionLegendItem.appendChild(sessionLetter);
legend.appendChild(sessionLegendItem);

container.parentNode.insertBefore(legend, container);

let _maskId = 0;
for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => !l.trim().startsWith(':'));
    if (lines.length < 1) continue;
    const name = lines[0].trim();
    // Collect the 3 curve slot lines dynamically.
    // Google Docs TXT export adds an extra \n for blank paragraphs, so each blank
    // curve definition appears as 2 blank lines. Skip the extra one after each blank slot.
    const curveLines = [];
    let ci = 1;
    while (ci < lines.length && curveLines.length < 4) {
        const l = lines[ci].trim();
        curveLines.push(l);
        ci++;
        if (!l && ci < lines.length && !lines[ci].trim()) ci++;
    }
    const remaining = [];
    for (let i = ci; i < lines.length; i++) {
        const l = lines[i].trim();
        if (l) remaining.push(l);
    }
    let pointsRaw = '', workSessionsRaw = '', rectsRaw = '';
    const cMarkers = [];
    for (const r of remaining) {
        if (/^c\s+/i.test(r)) {
            const parts = r.slice(1).trim().split(/\s+/);
            const hour = parseFloat(parts[0]);
            const text = parts.slice(1).join(' ');
            cMarkers.push({ hour, text });
            continue;
        }
        const firstToken = r.split(/\s+/)[0];
        const commaCount = (firstToken.match(/,/g) || []).length;
        if (commaCount === 0) pointsRaw = r;
        else if (commaCount >= 2) workSessionsRaw = r;
        else if (commaCount === 1) rectsRaw = r;
    }
    const points = pointsRaw ? pointsRaw.split(/\s+/).map(Number) : [];
    const workSessions = workSessionsRaw ? workSessionsRaw.split(/\s+/).map(s => {
        const parts = s.split(',');
        const [x, y, z] = parts.slice(0, 3).map(Number);
        let w = parts[3] || '';
        return { start: x, end: y, opacity: z / 100, topic: w };
    }) : [];
    const rects = rectsRaw ? rectsRaw.split(/\s+/).map(s => {
        const [x, y] = s.split(',').map(Number);
        var scaledY = y * 1.5;
        return { x, y: scaledY };
    }) : [];

    const el = document.createElement('div');
    el.className = 'element';
    el.style.height = ELEMENT_HEIGHT + 'px';
    el.style.position = 'relative';
    el.style.marginLeft = ELEMENT_START;
    el.style.marginRight = 'calc(100vw - ' + ELEMENT_END + ')';
    el.style.width = 'calc(' + ELEMENT_END + ' - ' + ELEMENT_START + ')';
    el.style.minWidth = '600px'; // Ensure enough width for SVG
    el.style.marginBottom = (ELEMENT_GAP + (cMarkers.length > 0 ? 40 : 0)) + 'px';


    // Inner container for clipping bands and lines
    const inner = document.createElement('div');
    inner.className = 'element-inner';
    inner.style.width = '100%';
    inner.style.height = '100%';
    inner.style.position = 'absolute';
    inner.style.left = 0;
    inner.style.top = 0;
    el.appendChild(inner);

    // ...existing code for background and vertical lines...

    // Baseline (horizontal line above bg on and vertical lines)
    const baseline = document.createElement('div');
    baseline.style.position = 'absolute';
    baseline.style.left = '0';
    baseline.style.width = '100%';
    baseline.style.top = '50%';
    baseline.style.transform = 'translateY(-50%)';
    baseline.style.height = ELEMENT_BASELINE_WIDTH + 'px';
    baseline.style.background = ELEMENT_BASELINE_COLOR;
    baseline.style.zIndex = 1;
    inner.appendChild(baseline);

    // Triangles at 8h, 12h, 16h, 20h (downward, anchored at top)
    [8, 12, 16, 20].forEach(hour => {
        const base = 8; // px, 50% wider than previous 18px
        const height = 5; // px
        const curvature = 0.001;
        // SVG path for triangle with both visible sides curved inward
        // Points: A (0,0), B (base,0), C (base/2,height)
        // Both AB and BC are quadratic Beziers curving inward
        function curvedTrianglePath() {
            const cy = height * curvature;
            const cx1 = base * 0.25, cx2 = base * 0.75;
            return `M0,0 Q${cx1},${cy} ${base/2},${height} Q${cx2},${cy} ${base},0 Z`;
        }
        // Top triangle (downward)
        const svgTop = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgTop.setAttribute('width', base);
        svgTop.setAttribute('height', height);
        svgTop.style.position = 'absolute';
        svgTop.style.left = `calc(${hourToPercent(hour)}% - ${base/2}px)`;
        svgTop.style.top = '0';
        svgTop.style.zIndex = 50;
        const pathTop = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathTop.setAttribute('d', curvedTrianglePath());
        pathTop.setAttribute('fill', 'black');
        svgTop.appendChild(pathTop);
        inner.appendChild(svgTop);

        // Bottom triangle (upward, mirrored)
        const svgBot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgBot.setAttribute('width', base);
        svgBot.setAttribute('height', height);
        svgBot.style.position = 'absolute';
        svgBot.style.left = `calc(${hourToPercent(hour)}% - ${base/2}px)`;
        svgBot.style.bottom = '0';
        svgBot.style.zIndex = 50;
        svgBot.style.transform = 'scaleY(-1)';
        const pathBot = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathBot.setAttribute('d', curvedTrianglePath());
        pathBot.setAttribute('fill', 'black');
        svgBot.appendChild(pathBot);
        inner.appendChild(svgBot);
    });

    // Solid background
    inner.style.background = COLOR_BG;

    // Work session rectangles on top of background
    for (const session of workSessions) {
        const rect = document.createElement('div');
        rect.style.position = 'absolute';
        rect.style.left = hourToPercent(session.start) + '%';
        rect.style.right = (100 - hourToPercent(session.end)) + '%';
        rect.style.top = '0';
        rect.style.height = '100%';
        rect.style.backgroundColor = COLOR_WORK_SESSION;
        rect.style.opacity = session.opacity;
        rect.style.zIndex = 10;
        rect.style.cursor = 'pointer';
        rect.dataset.tooltipTrigger = '1';

        // Tooltip for topic
        const tooltip = document.createElement('div');
        tooltip.style.position = 'fixed';
        tooltip.style.background = '#333';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '999px';
        tooltip.style.fontSize = '14px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = 1000;
        tooltip.style.display = 'none';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.textContent = session.topic.replace(/['"`]/g, '');

        rect.addEventListener('mouseover', () => {
            allTooltips.forEach(t => t.style.display = 'none');
            tooltip.style.display = 'block';
        });

        rect.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY + 10) + 'px';
        });

        rect.addEventListener('mouseout', () => {
            tooltip.style.display = 'none';
        });

        document.body.appendChild(tooltip);
        allTooltips.push(tooltip);
        inner.appendChild(rect);
    }

    // Vertical lines at work session transitions
    for (const session of workSessions) {
        const vline = document.createElement('div');
        vline.className = 'v-line';
        vline.style.left = hourToPercent(session.start) + '%';
        vline.style.width = VLINE_WIDTH + 'px';
        vline.style.backgroundColor = VLINE_COLOR;
        inner.appendChild(vline);

        const vlineEnd = document.createElement('div');
        vlineEnd.className = 'v-line';
        vlineEnd.style.left = hourToPercent(session.end) + '%';
        vlineEnd.style.width = VLINE_WIDTH + 'px';
        vlineEnd.style.backgroundColor = VLINE_COLOR;
        inner.appendChild(vlineEnd);
    }

    // 3 colored lines as hour,value pairs (drawn as SVG polylines)
    const lineColors = [COLOR_LINE_1, COLOR_LINE_2, COLOR_LINE_3, COLOR_LINE_4];
    for (let idx = 0; idx < 4; idx++) {
        const lineData = (curveLines[idx] || '').trim();

        if (!lineData){
            //console.log(`Line ${idx+1} is empty, skipping.`);
            continue;
        }
        let points;
        if (/^\d+(\.\d+)?$/.test(lineData)) {
            // Single number, treat as flat line from firsthour to lasthour
            const v = parseFloat(lineData);
            points = [
                { h: 7, v },
                { h: 24, v }
            ];
        } else {
            points = lineData.split(/\s+/).map(pair => {
                if (pair.includes(',')) {
                    const [h, v] = pair.split(',').map(Number);
                    return { h, v };
                }
                return null;
            }).filter(Boolean);
        }
        if (points.length < 1){
            console.log(`Line ${idx+1} has no valid points, skipping.`);
            continue;
        }
        // Ensure first point at 7h
        if (points[0].h > 7) {
            points.unshift({ h: 7, v: points[0].v });
        } else if (points[0].h < 7) {
            points[0].h = 7;
        }
        // Ensure last point at 24h
        if (points[points.length - 1].h < 24) {
            points.push({ h: 24, v: points[points.length - 1].v });
        } else if (points[points.length - 1].h > 24) {
            points[points.length - 1].h = 24;
        }
        if (points.length < 2) continue;

        // Defer SVG rendering until after layout is complete
        requestAnimationFrame(() => {
            // Use the actual rendered width of the element for the SVG
            const elWidthPx = el.getBoundingClientRect().width;
            const EXTRA = 20; // px, how much to extend past each edge
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', elWidthPx + EXTRA * 2);
            svg.setAttribute('height', ELEMENT_HEIGHT);
            svg.setAttribute('viewBox', `0 0 ${elWidthPx + EXTRA * 2} ${ELEMENT_HEIGHT}`);
            svg.style.position = 'absolute';
            svg.style.left = `-${EXTRA}px`;
            svg.style.top = 0;
            svg.style.width = `calc(100% + ${EXTRA * 2}px)`;
            svg.style.height = '100%';
            svg.style.zIndex = 20;
            svg.style.pointerEvents = 'none';
            function hourToPixel(h) {
                // Map hour 7 to x=0, hour 24 to x=elWidthPx+EXTRA*2
                return ((h - 7) / (24 - 7)) * (elWidthPx + EXTRA * 2);
            }
            // Cubic Bezier path for smooth lines
            let d = '';
            const HANDLE_FRAC = 0.4; // 0.4 = 40% of segment length
            for (let i = 0; i < points.length; i++) {
                const x = hourToPixel(points[i].h);
                const y = ELEMENT_HEIGHT * (1 - points[i].v / 10);
                if (i === 0) {
                    d += `M${x},${y} `;
                } else {
                    // Calculate control points for smooth cubic Bezier
                    const prev = points[i - 1];
                    const prevX = hourToPixel(prev.h);
                    const prevY = ELEMENT_HEIGHT * (1 - prev.v / 10);
                    // Use only the segment length for handle
                    const segLen = x - prevX;
                    const handle = segLen * HANDLE_FRAC;
                    const c1x = prevX + handle;
                    const c1y = prevY;
                    const c2x = x - handle;
                    const c2y = y;
                    d += `C${c1x},${c1y} ${c2x},${c2y} ${x},${y} `;
                }
            }
            // Build closed shape path offset from centerline by LINE_THICKNESS/2
            function bezPt(p0, p1, p2, p3, t) {
                const u = 1 - t;
                return {
                    x: u*u*u*p0.x + 3*u*u*t*p1.x + 3*u*t*t*p2.x + t*t*t*p3.x,
                    y: u*u*u*p0.y + 3*u*u*t*p1.y + 3*u*t*t*p2.y + t*t*t*p3.y
                };
            }
            function bezTan(p0, p1, p2, p3, t) {
                const u = 1 - t;
                return {
                    x: 3*(u*u*(p1.x-p0.x) + 2*u*t*(p2.x-p1.x) + t*t*(p3.x-p2.x)),
                    y: 3*(u*u*(p1.y-p0.y) + 2*u*t*(p2.y-p1.y) + t*t*(p3.y-p2.y))
                };
            }
            const SHAPE_SAMPLES = 20;
            const halfW = LINE_THICKNESS / 2;
            const topPts = [], botPts = [];
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = { x: hourToPixel(points[i].h), y: ELEMENT_HEIGHT * (1 - points[i].v / 10) };
                const p3 = { x: hourToPixel(points[i+1].h), y: ELEMENT_HEIGHT * (1 - points[i+1].v / 10) };
                const segHandle = (p3.x - p0.x) * HANDLE_FRAC;
                const p1 = { x: p0.x + segHandle, y: p0.y };
                const p2 = { x: p3.x - segHandle, y: p3.y };
                const n = (i === points.length - 2) ? SHAPE_SAMPLES + 1 : SHAPE_SAMPLES;
                for (let s = 0; s < n; s++) {
                    const t = s / SHAPE_SAMPLES;
                    const pt = bezPt(p0, p1, p2, p3, t);
                    const tan = bezTan(p0, p1, p2, p3, t);
                    const len = Math.hypot(tan.x, tan.y);
                    if (len < 1e-6) continue;
                    const nx = -tan.y / len, ny = tan.x / len;
                    topPts.push({ x: pt.x + nx * halfW, y: pt.y + ny * halfW });
                    botPts.push({ x: pt.x - nx * halfW, y: pt.y - ny * halfW });
                }
            }
            let shapePath = `M${topPts[0].x},${topPts[0].y}`;
            for (let i = 1; i < topPts.length; i++) shapePath += ` L${topPts[i].x},${topPts[i].y}`;
            for (let i = botPts.length - 1; i >= 0; i--) shapePath += ` L${botPts[i].x},${botPts[i].y}`;
            shapePath += ' Z';

            // actually paint the curve
            const colorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            colorPath.setAttribute('d', shapePath);
            colorPath.setAttribute('fill', lineColors[idx]);
            colorPath.setAttribute('opacity', 0.5);
            colorPath.setAttribute('stroke', darkenColor(lineColors[idx], 50));
            colorPath.setAttribute('stroke-width', 1);
            colorPath.setAttribute('stroke-linecap', 'round');
            colorPath.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(colorPath);
            inner.appendChild(svg);

            const svgBase = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgBase.setAttribute('width', elWidthPx + EXTRA * 2);
            svgBase.setAttribute('height', ELEMENT_HEIGHT);
            svgBase.setAttribute('viewBox', `0 0 ${elWidthPx + EXTRA * 2} ${ELEMENT_HEIGHT}`);
            svgBase.style.position = 'absolute';
            svgBase.style.left = `-${EXTRA}px`;
            svgBase.style.top = 0;
            svgBase.style.width = `calc(100% + ${EXTRA * 2}px)`;
            svgBase.style.height = '100%';
            svgBase.style.zIndex = 19;
            svgBase.style.pointerEvents = 'none';
            const basePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            basePath.setAttribute('d', shapePath);
            basePath.setAttribute('fill', lineColors[idx]);
            basePath.setAttribute('stroke', darkenColor(lineColors[idx], 50));
            basePath.setAttribute('stroke-width', 1);
            basePath.setAttribute('opacity', 0.5);
            svgBase.appendChild(basePath);
            inner.appendChild(svgBase);
        });
    }

    // Points (white circles, black outline)
    points.forEach(p => {
        const dot = document.createElement('div');
        dot.className = 'point';
        dot.style.left = hourToPercent(p) + '%';
        dot.style.bottom = -(POINT_SIZE / 2) + 'px';
        dot.style.width = POINT_SIZE + 'px';
        dot.style.height = POINT_SIZE + 'px';
        dot.style.background = COLOR_POINT_FILL;
        dot.style.borderColor = COLOR_POINT_BORDER;
        dot.style.zIndex = 100;
        el.appendChild(dot);
    });

    // Illness area as SVG path with rounded corners
    if (rects.length > 0) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.className.baseVal = 'illness-svg';
        svg.style.position = 'absolute';
        svg.style.left = '0';
        svg.style.top = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.zIndex = 20;
        svg.style.pointerEvents = 'none';

        // Use pixel-based viewBox for uniform corner radius
        const vwPx = document.documentElement.clientWidth / 100;
        const elWidthPx = parseFloat(ELEMENT_END) * vwPx - parseFloat(ELEMENT_START) * vwPx;
        svg.setAttribute('viewBox', '0 0 ' + elWidthPx + ' ' + ELEMENT_HEIGHT);
        svg.setAttribute('preserveAspectRatio', 'none');

        function hourToPixel(h) {
            return hourToPercent(h) / 100 * elWidthPx;
        }

        const polyPts = [];
        const polyRadii = [];
        const startsAtFirst = rects[0].x === 7;
        const lastRectEnd = rects.length > 1 ? rects[rects.length - 1].x : 24;
        const endsAtLast = true; // last rect always extends to 24

        // Bottom-left corner
        polyPts.push({ x: hourToPixel(rects[0].x), y: ELEMENT_HEIGHT });
        polyRadii.push(0);

        rects.forEach((r, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === rects.length - 1;
            const next = !isLast ? rects[idx + 1] : { x: 24, y: 0 };
            const nextX = next.x;
            // Top-left of this step
            let leftY = ELEMENT_HEIGHT - (r.y / 2);
            let leftRadius = leftY === ELEMENT_HEIGHT ? 0 : (isFirst && startsAtFirst ? 0 : ILLNESS_CORNER_RADIUS);
            polyPts.push({ x: hourToPixel(r.x), y: leftY });
            polyRadii.push(leftRadius);
            // Top-right of this step
            let rightY = ELEMENT_HEIGHT - (r.y / 2);
            let rightRadius = rightY === ELEMENT_HEIGHT ? 0 : (isLast && endsAtLast ? 0 : ILLNESS_CORNER_RADIUS);
            polyPts.push({ x: hourToPixel(nextX), y: rightY });
            polyRadii.push(rightRadius);

            // If next illness value is 0, add a bottom point at the transition (straight down, then right)
            if (!isLast && next.y === 0) {
                // Go straight down
                polyPts.push({ x: hourToPixel(nextX), y: ELEMENT_HEIGHT });
                polyRadii.push(0);
            }
        });

        // Bottom-right corner
        polyPts.push({ x: hourToPixel(24), y: ELEMENT_HEIGHT });
        polyRadii.push(0);

        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', roundedPolygonPath(polyPts, polyRadii));
        path.setAttribute('fill', COLOR_ILLNESS);
        path.setAttribute('stroke', COLOR_ILLNESS_BORDER);
        path.setAttribute('stroke-width', VLINE_WIDTH);
        path.setAttribute('stroke-linejoin', 'miter');
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.appendChild(path);
        inner.appendChild(svg);
    }

    // c markers: gray squares below the element
    const CMARKER_SIZE = 28;
    for (const marker of cMarkers) {
        const sq = document.createElement('div');
        sq.style.position = 'absolute';
        sq.style.width = CMARKER_SIZE + 'px';
        sq.style.height = CMARKER_SIZE + 'px';
        sq.style.borderRadius = '10px';
        sq.style.backgroundColor = 'rgba(170,170,170,0.8)';
        sq.style.border = '2px solid #777';
        sq.style.boxSizing = 'border-box';
        sq.style.left = `calc(${hourToPercent(marker.hour)}% - ${CMARKER_SIZE / 2}px)`;
        sq.style.top = (ELEMENT_HEIGHT + 14) + 'px';
        sq.style.cursor = 'pointer';
        sq.style.zIndex = 10;
        sq.dataset.tooltipTrigger = '1';

        const CMARKER_DOT = 8;
        const dot = document.createElement('div');
        dot.style.position = 'absolute';
        dot.style.width = CMARKER_DOT + 'px';
        dot.style.height = CMARKER_DOT + 'px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = 'rgba(172,169,164,0.8)';
        dot.style.border = '2px solid #777';
        dot.style.boxSizing = 'border-box';
        dot.style.left = `calc(${hourToPercent(marker.hour)}% - ${CMARKER_DOT / 2}px)`;
        dot.style.top = (ELEMENT_HEIGHT + 14 - CMARKER_DOT - 4) + 'px';
        dot.style.zIndex = 10;
        el.appendChild(dot);

        const tooltip = document.createElement('div');
        tooltip.style.position = 'fixed';
        tooltip.style.background = '#333';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '20px';
        tooltip.style.fontSize = '14px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = 1000;
        tooltip.style.display = 'none';
        tooltip.style.whiteSpace = 'pre';
        tooltip.textContent = marker.text.replace(/\\n/g, '\n');

        if (onMobile()) {
            sq.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isVisible = tooltip.style.display !== 'none';
                allTooltips.forEach(t => t.style.display = 'none');
                if (!isVisible) {
                    const rect = sq.getBoundingClientRect();
                    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
                    tooltip.style.top = (rect.bottom + 8) + 'px';
                    tooltip.style.display = 'block';
                }
            });
        } else {
            sq.addEventListener('mouseover', () => { allTooltips.forEach(t => t.style.display = 'none'); tooltip.style.display = 'block'; });
            sq.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.clientX + 10) + 'px';
                tooltip.style.top = (e.clientY + 10) + 'px';
            });
            sq.addEventListener('mouseout', () => { tooltip.style.display = 'none'; });
            sq.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = tooltip.style.display !== 'none';
                allTooltips.forEach(t => t.style.display = 'none');
                if (!isVisible) {
                    const rect = sq.getBoundingClientRect();
                    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
                    tooltip.style.top = (rect.bottom + 8) + 'px';
                    tooltip.style.display = 'block';
                }
            });
        }

        document.body.appendChild(tooltip);
        allTooltips.push(tooltip);
        el.appendChild(sq);
    }

    container.appendChild(el);

    // Name label (outside element, centered between 0vw and ELEMENT_START, vertically centered)
    const label = document.createElement('div');
    label.className = 'element-label';
    label.textContent = name;
    label.style.position = 'absolute';
    label.style.left = '0';
    label.style.width = `calc(${ELEMENT_START})`;
    label.style.top = `calc(${el.offsetTop + ELEMENT_HEIGHT/2}px)`;
    label.style.transform = `translateY(-50%)`;
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.justifyContent = 'center';
    label.style.height = ELEMENT_HEIGHT + 'px';
    label.style.fontWeight = 'bold';
    label.style.zIndex = 10;
    container.appendChild(label);
}
}

init();

document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-tooltip-trigger]')) {
        allTooltips.forEach(t => t.style.display = 'none');
    }
});

window.addEventListener('scroll', () => {
    allTooltips.forEach(t => t.style.display = 'none');
}, { passive: true });
