// orthogonal-router.js

function pointKey(p) {
  return p.x + "," + p.y;
}

function heuristic(p1, p2) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

function rectToLines(rect) {
  return {
    xs: [rect.x, rect.x + rect.width],
    ys: [rect.y, rect.y + rect.height],
  };
}

function generateRulers(start, end, obstacles) {
  const xs = [start.x, end.x];
  const ys = [start.y, end.y];

  for (const rect of obstacles) {
    const { xs: ox, ys: oy } = rectToLines(rect);
    xs.push(...ox);
    ys.push(...oy);
  }

  return {
    xs: [...new Set(xs)].sort((a, b) => a - b),
    ys: [...new Set(ys)].sort((a, b) => a - b),
  };
}

function isBlocked(x, y, obstacles) {
  return obstacles.some(
    (r) => x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height
  );
}

function buildGraph(xs, ys, obstacles) {
  const graph = new Map();

  for (let xi = 0; xi < xs.length; xi++) {
    for (let yi = 0; yi < ys.length; yi++) {
      const x = xs[xi];
      const y = ys[yi];

      if (isBlocked(x, y, obstacles)) continue;

      const neighbors = [];
      if (xi > 0 && !isBlocked(xs[xi - 1], y, obstacles))
        neighbors.push({ x: xs[xi - 1], y });
      if (xi < xs.length - 1 && !isBlocked(xs[xi + 1], y, obstacles))
        neighbors.push({ x: xs[xi + 1], y });
      if (yi > 0 && !isBlocked(x, ys[yi - 1], obstacles))
        neighbors.push({ x, y: ys[yi - 1] });
      if (yi < ys.length - 1 && !isBlocked(x, ys[yi + 1], obstacles))
        neighbors.push({ x, y: ys[yi + 1] });

      graph.set(pointKey({ x, y }), neighbors);
    }
  }

  return graph;
}

export function findOrthogonalPath(start, end, obstacles = []) {
  const { xs, ys } = generateRulers(start, end, obstacles);
  const graph = buildGraph(xs, ys, obstacles);

  const open = new Set([pointKey(start)]);
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  gScore.set(pointKey(start), 0);
  fScore.set(pointKey(start), heuristic(start, end));

  while (open.size > 0) {
    let currentKey = null;
    let currentF = Infinity;

    for (const key of open) {
      const f = fScore.get(key) || Infinity;
      if (f < currentF) {
        currentF = f;
        currentKey = key;
      }
    }

    if (currentKey === pointKey(end)) {
      const path = [];
      let k = currentKey;
      while (k) {
        const [x, y] = k.split(",").map(Number);
        path.unshift({ x, y });
        k = cameFrom.get(k);
      }
      return path;
    }

    open.delete(currentKey);
    const [cx, cy] = currentKey.split(",").map(Number);
    const current = { x: cx, y: cy };

    for (const neighbor of graph.get(currentKey) || []) {
      const nk = pointKey(neighbor);
      const tentativeG = (gScore.get(currentKey) || Infinity) + heuristic(current, neighbor);

      if (tentativeG < (gScore.get(nk) || Infinity)) {
        cameFrom.set(nk, currentKey);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + heuristic(neighbor, end));
        open.add(nk);
      }
    }
  }

  return [start, end];
}

export function toSvgPath(points) {
  return points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
}