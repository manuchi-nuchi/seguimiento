            

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
        return { x, y };
    }) : [];

    const el = document.createElement('div');
    el.className = 'element';
    el.style.height = ELEMENT_HEIGHT + 'px';
    el.style.marginLeft = ELEMENT_START;
    el.style.marginRight = 'calc(100vw - ' + ELEMENT_END + ')';
    el.style.width = 'calc(' + ELEMENT_END + ' - ' + ELEMENT_START + ')';
    el.style.marginBottom = ELEMENT_GAP + 'px';

    // Inner container for clipping bands and lines
    const inner = document.createElement('div');
    inner.className = 'element-inner';
    el.appendChild(inner);

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

    // 3 horizontal lines positioned by value (0=bottom, 10=top)
    const colors = [COLOR_LINE_1, COLOR_LINE_2, COLOR_LINE_3];
    colors.forEach((color, idx) => {
        const val = parseFloat(lines[1 + idx].trim()) || 0;
        const yPx = ELEMENT_HEIGHT * (1 - val / 10);
        const line = document.createElement('div');
        line.className = 'h-line';
        line.style.top = yPx + 'px';
        line.style.height = LINE_THICKNESS + 'px';
        line.style.backgroundColor = color;
        line.style.boxShadow = '';
        line.style.border = '2px solid #000';
        inner.appendChild(line);
    });

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
