
const ELEMENT_BASELINE_COLOR = '#b1b1b1'; // light gray
const ELEMENT_BASELINE_WIDTH = 0.2; // px (thickness of the line)

const ELEMENT_HEIGHT = 150;

const ELEMENT_START = '5vw';
const ELEMENT_END = '97vw';
const ELEMENT_GAP = 25;
const TOP_MARGIN = 30;

const COLOR_LINE_1 = '#ffa3eb';
const COLOR_LINE_2 = '#ad9eff';
const COLOR_LINE_3 = '#ffc072';

const COLOR_BG_OFF = '#fcfffe';
const COLOR_BG_ON = '#a0c4ff';
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

async function init() {
    let DATA;
    const res = await fetch(GOOGLE_DOC_URL);
    DATA = await res.text();

const blocks = DATA.trim().split('---');
const container = document.getElementById('container');
container.style.marginTop = TOP_MARGIN + 'px';

for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 7) continue;
    const name = lines[0].trim();
    // lines[1], [2], [3]: pink, blue, orange lines (content ignored)
    const points = lines[4].trim() ? lines[4].trim().split(/\s+/).map(Number) : [];
    const transitions = lines[5].trim() ? lines[5].trim().split(/\s+/).map(Number) : [];
    const rects = lines[6].trim() ? lines[6].trim().split(/\s+/).map(s => {
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
    el.style.marginBottom = ELEMENT_GAP + 'px';


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
    baseline.style.left = 0;
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
        svgTop.style.zIndex = 3;
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
        svgBot.style.zIndex = 3;
        svgBot.style.transform = 'scaleY(-1)';
        const pathBot = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathBot.setAttribute('d', curvedTrianglePath());
        pathBot.setAttribute('fill', 'black');
        svgBot.appendChild(pathBot);
        inner.appendChild(svgBot);
    });

    // Background bands (hard transitions)
    let bgColor = COLOR_BG_OFF;
    const stops = [];
    for (const t of transitions) {
        const pct = hourToPercent(t);
        const nextColor = bgColor === COLOR_BG_OFF ? COLOR_BG_ON : COLOR_BG_OFF;
        stops.push(bgColor + ' ' + pct + '%');
        stops.push(nextColor + ' ' + pct + '%');
        bgColor = nextColor;
    }
    stops.push(bgColor + ' 100%');
    inner.style.background = 'linear-gradient(to right, ' + COLOR_BG_OFF + ' 0%, ' + stops.join(', ') + ')';

    // Vertical lines at bg transitions
    for (const t of transitions) {
        const vline = document.createElement('div');
        vline.className = 'v-line';
        vline.style.left = hourToPercent(t) + '%';
        vline.style.width = VLINE_WIDTH + 'px';
        vline.style.backgroundColor = VLINE_COLOR;
        inner.appendChild(vline);
    }

    // 3 colored lines as hour,value pairs (drawn as SVG polylines)
    const lineColors = [COLOR_LINE_1, COLOR_LINE_2, COLOR_LINE_3];
    for (let idx = 0; idx < 3; idx++) {
        const lineData = lines[1 + idx].trim();
        if (!lineData) continue;
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
        if (points.length < 1) continue;
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
            svg.style.zIndex = 2;
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
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d.trim());
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', lineColors[idx]);
            path.setAttribute('stroke-width', LINE_THICKNESS);
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('stroke', '#000');
            path.setAttribute('stroke-opacity', '0.25');
            svg.appendChild(path);
            // Overlay the colored stroke
            const colorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            colorPath.setAttribute('d', d.trim());
            colorPath.setAttribute('fill', 'none');
            colorPath.setAttribute('stroke', lineColors[idx]);
            colorPath.setAttribute('stroke-width', LINE_THICKNESS - 2);
            colorPath.setAttribute('stroke-linecap', 'round');
            colorPath.setAttribute('stroke-linejoin', 'round');
            svg.appendChild(colorPath);
            inner.appendChild(svg);
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
        dot.style.zIndex = 99;
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
