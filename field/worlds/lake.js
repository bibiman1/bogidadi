// 断片: 富士山の湖(峠道、湖畔、ほうとう屋)。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ---- 峠道: 曲がりくねった道を北へのぼると、富士山が見えてくる ----
const ROAD_COLS = 15;
const ROAD_ROWS = 60;
// 道が通る点(行, 列)。この点をなめらかな曲線(Catmull-Rom)でつなぐ
const ROAD_POINTS = [[61, 7], [55, 7], [50, 5.5], [46, 3.5], [42, 4], [39, 7], [36, 10.5], [32, 11], [28, 9], [25, 5], [21, 3.5], [17, 5], [14, 8.5], [11.5, 11], [10.5, 13], [10.5, 16]];
const ROAD_WIDTH = 1.5; // 中心線から道の端まで(マス)

function catmullRom(points, step) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let t = 0; t < 1; t += step) {
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

const ROAD_CURVE = catmullRom(ROAD_POINTS, 0.05);

function roadGrid() {
  const g = [];
  for (let r = 0; r < ROAD_ROWS; r++) g.push(Array(ROAD_COLS).fill(r < 8 ? "#" : "."));
  for (let r = 8; r < ROAD_ROWS; r++) {
    for (let c = 0; c < ROAD_COLS; c++) {
      if (ROAD_CURVE.some(([pr, pc]) => Math.hypot(pr - r, pc - c) <= ROAD_WIDTH)) g[r][c] = "=";
    }
  }
  return g.map((row) => row.join(""));
}

// センターライン: 道の中心を点線でなぞる
function centerLine(ctx, ox, oy, points) {
  ctx.fillStyle = "#f4f6f8";
  const DASH = 10;
  const GAP = 8;
  let run = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let d = 0; d < len; d += 2) {
      if ((run + d) % (DASH + GAP) < DASH) {
        const x = Math.round(x0 + ((x1 - x0) * d) / len + ox);
        const y = Math.round(y0 + ((y1 - y0) * d) / len + oy);
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
    run += len;
  }
}

// 曲がった道: 曲線を太い線で2回なぞる(外側が雪の土手、内側が道)。
// マス目のタイルだと縁が階段になるので、道だけは線で描く。
// 舗装は格子のない粒のアスファルト(road_asphalt、120 ドットのくり返し。D282。docs/assets/lake/asphalt/)
function drawRoadVector(ctx, ox, oy, asphalt, cache) {
  if (!cache.pattern) cache.pattern = ctx.createPattern(asphalt, "repeat");
  ctx.save();
  ctx.translate(ox, oy);
  // 継ぎ目ごとに線の幅の丸も重ねる。iPhone の Safari では、短い線をつないだ太い線の継ぎ目に、
  // 下の色がのぞく細いくさびが出ることがある(2026-10-10、作者「道路に切れ込み」)
  const pts = ROAD_CURVE.map(([r, c]) => [(c + 0.5) * T, Math.max(8 * T, (r + 0.5) * T)]);
  const line = (w, style) => {
    ctx.strokeStyle = style;
    ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  };
  const dots = (rad, style) => {
    ctx.fillStyle = style;
    ctx.beginPath();
    for (const [x, y] of pts.slice(1, -1)) {
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, 0, Math.PI * 2);
    }
    ctx.fill();
  };
  ctx.lineCap = "butt";
  ctx.lineJoin = "round";
  line(96, "#c4dae6");
  dots(48, "#c4dae6");
  line(88, cache.pattern);
  dots(44, cache.pattern);
  ctx.restore();
}

function nearRoad(grid, r, c, d) {
  for (let dr = -d; dr <= d; dr++)
    for (let dc = -d; dc <= d; dc++) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < grid.length && cc >= 0 && cc < grid[0].length && grid[rr][cc] === "=") return true;
    }
  return false;
}

// 森: 道から離れた雪の上に木を立てる。keep に入る場所には立てない
function forest(grid, fromRow, keep) {
  const trees = [];
  for (let r = fromRow; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] !== ".") continue;
      if (nearRoad(grid, r, c, 1)) continue;
      if (keep.some(([r0, c0, r1, c1]) => r >= r0 && r <= r1 && c >= c0 && c <= c1)) continue;
      const edge = c === 0 || c === grid[0].length - 1;
      const p = rand(r, c, 1);
      if (!edge && p > 0.55) continue;
      const kind = rand(r, c, 2) < 0.8 ? "pine" : "bare";
      trees.push(at(kind, (c + 0.5) * T + (rand(r, c, 3) - 0.5) * 12, (r + 1) * T - 2));
    }
  }
  return trees;
}


// ガードレール: 点列にそって、支柱と白いレールを描く(3/4見下ろしなので、レールは少し上に浮かせる)
function guardrail(ctx, ox, oy, pts) {
  if (pts.length < 2) return;
  const H = 7;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.fillStyle = "#4f5863"; // 支柱
  let run = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let d = (20 - (run % 20)) % 20; d < len; d += 20) {
      const x = x0 + ((x1 - x0) * d) / len;
      const y = y0 + ((y1 - y0) * d) / len;
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - H, 3, H + 2);
    }
    run += len;
  }
  const line = (dy, col, w) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y - dy) : ctx.moveTo(x, y - dy)));
    ctx.stroke();
  };
  ctx.lineJoin = "round";
  line(H - 1, "#4f5863", 6);
  line(H - 1, "#f4f7f9", 3);
  line(H - 2, "#aab4bd", 1);
  ctx.restore();
}
// 峠道のガードレール: カーブの外側にだけ
const ROAD_RAILS = (() => {
  const px = ROAD_CURVE.map(([r, c]) => [(c + 0.5) * T, (r + 0.5) * T]);
  const off = ROAD_WIDTH * T + 10;
  const runs = [];
  let cur = [];
  const K = 5;
  for (let i = K; i < px.length - K; i++) {
    const [ax, ay] = px[i - K];
    const [bx, by] = px[i];
    const [cx, cy] = px[i + K];
    const tx = cx - ax;
    const ty = cy - ay;
    const tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl;
    const ny = tx / tl;
    const l1 = Math.hypot(bx - ax, by - ay) || 1;
    const l2 = Math.hypot(cx - bx, cy - by) || 1;
    const turn = ((bx - ax) * (cy - by) - (by - ay) * (cx - bx)) / (l1 * l2); // 曲がる向き(sin)
    const outer = turn > 0 ? -1 : 1;
    const ok = by > 12.5 * T && by < 58 * T && Math.abs(turn) > 0.12;
    if (ok) {
      const p = [bx + nx * off * outer, by + ny * off * outer];
      if (cur.length && cur.side !== outer) {
        runs.push(cur);
        cur = [];
      }
      cur.side = outer;
      cur.push(p);
    } else if (cur.length) {
      runs.push(cur);
      cur = [];
    }
  }
  if (cur.length) runs.push(cur);
  return runs.filter((r) => r.length > 4);
})();
// 帰り道(ほうとうを食べたあと): 道に雪が積もって、つるつるすべる
// 行きは雪のない道。ほうとうを食べると、その回の帰り道だけ雪が積もる(入り直すと行きに戻る)
const homeward = (api) => api.flag("homeward");
const HOMEWARD_SLIP = 0.45; // 湖の氷(1.6)より、ずっとつるつる
// 峠の待避所(行と列)。崖の縁にガードレール、谷の向こうに富士山
// 東のはしまでのばす: 湖へ向かう東の道と待避所のあいだに、四角い切れ込みができていた(作者「道路が切れ込みある」)
const LAYBY = { c0: 3.5, c1: 15.6, r0: 8.35, r1: 11 };

// 帰り道のぴー(D283): 古タイヤに乗って峠の上から滑りおり、下についたら古タイヤを引いて登り、また滑る
// 滑っているぴーにぶつかると、きーははじかれて少しすべる(止めはしない)。行きは古タイヤの山のとなりに立っているだけ
const PI_PATH = (() => {
  const pts = ROAD_CURVE.map(([r, c]) => [(c + 0.5) * T, (r + 0.5) * T]).filter(([, y]) => y > 12.5 * T && y < 57.5 * T);
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len[len.length - 1] };
})();
function piPathAt(d) {
  const { pts, len } = PI_PATH;
  let i = 1;
  while (i < len.length - 1 && len[i] < d) i++;
  const k = Math.max(0, Math.min(1, (d - len[i - 1]) / (len[i] - len[i - 1] || 1)));
  const [x0, y0] = pts[i - 1];
  const [x1, y1] = pts[i];
  const l = Math.hypot(x1 - x0, y1 - y0) || 1;
  return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, tx: (x1 - x0) / l, ty: (y1 - y0) / l };
}
const PI_SLIDE = 170; // px / 秒(きーの歩き 150 より少し速い。追いこしていく)
const PI_CLIMB = 42;
function piSled() {
  return {
    id: "pi_sled",
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    phase: null,
    hidden: (api) => !homeward(api),
    update(dt, t, api) {
      if (!homeward(api)) {
        this.phase = null;
        return;
      }
      if (!this.phase) {
        // きーが峠の上に着いたところで、ちょうど滑りだす
        this.phase = "slide";
        this.d = PI_PATH.total;
      }
      if (this.phase === "slide") {
        this.d -= PI_SLIDE * dt;
        if (this.d <= 0) {
          this.d = 0;
          this.phase = "climb";
        }
      } else {
        this.d += PI_CLIMB * dt;
        if (this.d >= PI_PATH.total) {
          this.d = PI_PATH.total;
          this.phase = "slide";
        }
      }
      const p = piPathAt(this.d);
      // 滑るときは左右にゆれる。登るときは道の東より(下るきーとすれちがえるように)
      const off = this.phase === "slide" ? Math.sin(t * 1.4) * 26 : 26;
      this.x = p.x - p.ty * off;
      this.y = p.y + p.tx * off;
      this.dir = p;
      const pl = api.player();
      if (this.phase === "slide") {
        const dx = pl.x - this.x;
        const dy = pl.y - this.y;
        const k = Math.hypot(dx, dy);
        if (k < 24 && (!this.hitT || t - this.hitT > 0.8)) {
          this.hitT = t;
          api.knock((dx / (k || 1)) * 220, (dy / (k || 1)) * 220 + 60);
          api.sfx("pop");
        }
        return;
      }
      // 登るぴーと、引いている古タイヤにも当たる(よけて通る。2026-10-10、作者「上りのぴーに当たり判定がない」)
      for (const [bx, by, r] of [[this.x, this.y, 20], [this.x - p.tx * 40, this.y - p.ty * 40, 22]]) {
        const dx = pl.x - bx;
        const dy = pl.y - by;
        const k = Math.hypot(dx, dy);
        if (k < r) {
          api.knock((dx / (k || 1)) * 120, (dy / (k || 1)) * 120);
          break;
        }
      }
    },
    draw(ctx, sx, sy, t, api) {
      const pi = api.image("pi");
      const tire = api.image("pi_tire");
      if (!pi || !tire || !this.dir) return;
      const { tx, ty } = this.dir;
      if (this.phase === "slide") {
        // タイヤに乗って、下を向いて滑る(ぴーは正面の絵)
        ctx.drawImage(tire, sx - tire.width / 2, sy - tire.height / 2);
        ctx.drawImage(pi, 0, 0, 64, 64, sx - 32, sy - 32 - 7, 64, 64);
        return;
      }
      // 古タイヤをひもで引いて登る: タイヤは坂の下(うしろ)、ぴーは前。ぴーは登る向きの絵
      const bx = Math.round(sx - tx * 40);
      const by = Math.round(sy - ty * 40);
      const row = Math.abs(ty) >= Math.abs(tx) ? (ty < 0 ? 1 : 0) : tx > 0 ? 2 : 3;
      const f = Math.floor(t * 6) % 7;
      ctx.strokeStyle = "#3b3440";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 0.5, by - 4.5);
      ctx.lineTo(Math.round(sx) + 0.5, Math.round(sy) + 2.5);
      ctx.stroke();
      const drawPi = () => ctx.drawImage(pi, f * 64, row * 64, 64, 64, sx - 32, sy - 32, 64, 64);
      const drawTire = () => ctx.drawImage(tire, bx - tire.width / 2, by - tire.height / 2);
      // 画面の下にあるほうを、あとに描く
      if (by > sy) {
        drawPi();
        drawTire();
      } else {
        drawTire();
        drawPi();
      }
    },
  };
}

const roadMapGrid = roadGrid();

const ROAD = {
  tile: T,
  bg: "#eef2f6",
  snow: true,
  map: roadMapGrid,
  legend: {
    "#": { solid: true, none: true },
    ".": { wang: "road" },
    "=": { wang: "road" }, // 道そのものは drawGround で描く
  },
  wang: { road: { img: "wang_road", size: 32, lookup: WANG16 } },
  backdrop: { img: "fuji", x: 0, y: 16, scale: 2 },
  rails: [[[LAYBY.c0 * T - 2, 8.55 * T], [LAYBY.c1 * T + 2, 8.55 * T]], ...ROAD_RAILS],
  slippery(api, x, y) {
    if (!homeward(api)) return false;
    const r = Math.floor(y / T);
    const c = Math.floor(x / T);
    const inLayby = x > LAYBY.c0 * T && x < LAYBY.c1 * T && y > LAYBY.r0 * T && y < LAYBY.r1 * T;
    return inLayby || (roadMapGrid[r] && roadMapGrid[r][c] === "=") ? HOMEWARD_SLIP : false;
  },
  drawGround(ctx, ox, oy, img, api) {
    if (typeof img !== "function") return; // 古い rpg.js と混ざったとき(キャッシュ)に止まらないように
    const tile = img("road_asphalt");
    if (!tile) return;
    // 谷の靄: 背景の森の裾をぼかし、崖の縁へつなぐ
    const g = ctx.createLinearGradient(0, 6.9 * T + oy, 0, 8.05 * T + oy);
    g.addColorStop(0, "rgba(238, 242, 246, 0)");
    g.addColorStop(1, "rgba(238, 242, 246, 0.95)");
    ctx.fillStyle = g;
    ctx.fillRect(ox, 6.9 * T + oy, ROAD_COLS * T, 1.15 * T);
    // 崖の縁(雪の土手)
    ctx.fillStyle = "#d6e4ec";
    ctx.fillRect(ox, 8 * T + oy, ROAD_COLS * T, 5);
    ctx.fillStyle = "#b8ccd8";
    ctx.fillRect(ox, 8 * T + 5 + oy, ROAD_COLS * T, 2);
    // 待避所: 道からふくらんだ舗装
    {
      const { c0, c1, r0, r1 } = LAYBY;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.fillStyle = "#c4dae6";
      ctx.beginPath();
      ctx.roundRect(c0 * T - 4, r0 * T - 4, (c1 - c0) * T + 8, (r1 - r0) * T + 8, 18);
      ctx.fill();
      ctx.restore();
      drawRoadVector(ctx, ox, oy, tile, this); // 道と待避所の舗装をつなげる
      ctx.save();
      ctx.translate(ox, oy);
      ctx.fillStyle = this.pattern;
      ctx.beginPath();
      ctx.roundRect(c0 * T, r0 * T, (c1 - c0) * T, (r1 - r0) * T, 14);
      ctx.fill();
      ctx.restore();
    }
    if (api && homeward(api)) {
      // 積もった雪: 道の上を白くなぞる(センターラインは雪の下)
      // 半透明の線は継ぎ目の割れ(iPhone の Safari)を丸で埋めると重なって濃くなるので、
      // 別の紙に不透明で描いて(線 + 継ぎ目の丸 + 待避所)、まとめて半透明で重ねる(2026-10-10、作者「切れ込みあり」)
      {
        const cv = ctx.canvas;
        const snow = this.snowCanvas || (this.snowCanvas = document.createElement("canvas"));
        if (snow.width !== cv.width || snow.height !== cv.height) {
          snow.width = cv.width;
          snow.height = cv.height;
        }
        const g = snow.getContext("2d");
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, snow.width, snow.height);
        g.setTransform(ctx.getTransform());
        g.translate(ox, oy);
        const pts = ROAD_CURVE.map(([r, c]) => [(c + 0.5) * T, Math.max(8 * T, (r + 0.5) * T)]);
        g.fillStyle = g.strokeStyle = "rgb(243, 246, 249)";
        g.lineJoin = "round";
        g.lineWidth = 90;
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.stroke();
        g.beginPath();
        for (const [x, y] of pts.slice(1, -1)) {
          g.moveTo(x + 45, y);
          g.arc(x, y, 45, 0, Math.PI * 2);
        }
        g.fill();
        g.beginPath();
        g.roundRect(LAYBY.c0 * T, LAYBY.r0 * T, (LAYBY.c1 - LAYBY.c0) * T, (LAYBY.r1 - LAYBY.r0) * T, 14);
        g.fill();
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 0.88;
        ctx.drawImage(snow, 0, 0);
        ctx.restore();
      }
      ctx.save();
      ctx.translate(ox, oy);
      // わだち
      ctx.strokeStyle = "rgba(170, 190, 204, 0.5)";
      ctx.lineWidth = 3;
      for (const off of [-12, 12]) {
        ctx.beginPath();
        ROAD_CURVE.forEach(([r, c], i) => {
          const x = (c + 0.5) * T + off;
          const y = Math.max(8 * T, (r + 0.5) * T);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
      ctx.restore();
    } else {
      centerLine(ctx, ox, oy, ROAD_CURVE.filter(([r]) => r > 10.9).map(([r, c]) => [(c + 0.5) * T, (r + 0.5) * T]));
    }
    // ガードレール: 待避所の崖側と、峠道のカーブの外側
    guardrail(ctx, ox, oy, [[LAYBY.c0 * T - 2, 8.55 * T], [LAYBY.c1 * T + 2, 8.55 * T]]);
    ROAD_RAILS.forEach((run) => guardrail(ctx, ox, oy, run));
  },
  spawns: {
    start: { x: 7.5 * T, y: 58.5 * T, facing: "north" },
    pass: { x: 13.2 * T, y: 10.6 * T, facing: "west" },
  },
  triggers: [
    // 道のはじまり(来たところ)から、懲罰空間へ戻る
    {
      id: "leave",
      x: 5.5 * T,
      y: 59.35 * T,
      w: 4 * T,
      h: T,
      run(api) {
        // 帰り道: エリアを出る前に、ちゃんの車で帰っていく絵
        if (homeward(api)) api.show("v_road", () => api.exit());
        else api.exit();
      },
    },
    // 峠: 森が切れて、富士山が見えてくる(北へ越えるたびに)
    {
      id: "vista",
      x: 0,
      y: 12 * T,
      w: ROAD_COLS * T,
      h: T,
      run(api) {
        if (api.player().facing !== "north") return;
        api.pan(0, 2200);
      },
    },
    { id: "toLake", x: 14.3 * T, y: 8 * T, w: T, h: 4 * T, warp: { map: "lake", spawn: "west" } },
  ],
  objects: [
    // カーブの外側の標識(道の上に来るものは置かない)
    ...[[48.9, 1.5], [37.9, 13.4], [26.9, 8.6], [19.9, 1.3], [13.9, 12.4]]
      .filter(([r, c]) => roadMapGrid[Math.floor(r)][Math.floor(c)] === ".")
      .map(([r, c]) => {
        // 警戒標識(右方/左方屈曲): この先、北へ進むと道がどちらへ曲がるか
        const colAt = (row) => {
          let best = ROAD_CURVE[0];
          for (const p of ROAD_CURVE) if (Math.abs(p[0] - row) < Math.abs(best[0] - row)) best = p;
          return best[1];
        };
        const right = colAt(r - 5) > colAt(r);
        return at(right ? "sign" : "signL", c * T, r * T);
      }),
    at("tires", 7 * T, 45.5 * T),
    // 待避所のガードレール: 調べると、何回でも富士山の全景を見わたせる
    {
      id: "lookout",
      x: 8 * T,
      y: 8.6 * T,
      w: 4 * T,
      h: 8,
      range: 60,
      interact(api) {
        api.pan(0, 2600);
      },
    },
    Object.assign(
      {
        id: "pi",
        anim: { img: "pi", cell: 64, row: 3, frames: 1, fps: 1 },
        w: 64,
        h: 64,
        x: 8.6 * T,
        y: 45.3 * T - 15,
        sortDy: 15,
        headY: 14,
        solid: { w: 18, h: 8, dy: 9 },
        range: 36,
        nearRange: 56,
        hidden: (api) => homeward(api), // 帰り道は古タイヤで遊んでいる(piSled)
        near(api) {
          api.bubble("pi", "どけ");
        },
        interact(api) {
          api.bubble("pi", "古タイヤをみつけたらおしえろ", 3600);
        },
      },
      {}
    ),
    piSled(),
  ].concat(forest(roadMapGrid, 8, [[8, 0, 13, 14], [44, 5, 46, 10]])),
};

// ---- 湖畔: 凍った湖、ちゃんの車、ほうとう屋 ----
const LAKE_GRID = [
  "###############",
  "###############",
  "###############",
  "###############",
  "###############",
  "###############",
  "###############",
  "###############",
  "...............",
  ".iiiiiiiii.....",
  "iiiiiiiiiii....",
  "iiiiiiiiiii....",
  "iiiiiiiiii.....",
  ".iiiiiiii......",
  "..iiiiii.......",
  "...............",
  "...............",
  "===============",
  "===============",
  "...............",
  "...............",
  "...............",
];

const houtou = at("houtou", 12 * T, 16.4 * T, { id: "houtou" });
const GATE_X = 13.6 * T; // ほうとう屋の先の冬期通行止ゲート

const LAKE = {
  tile: T,
  bg: "#eef2f6",
  snow: true,
  map: LAKE_GRID,
  legend: {
    "#": { solid: true, none: true },
    ".": { wang: "road" },
    "=": { wang: "road", lowerOf: ["road"] },
    i: { wang: "ice", lowerOf: ["ice"], ice: true },
  },
  wang: {
    road: { img: "wang_road", size: 32, lookup: WANG16 },
    ice: { img: "wang_ice", size: 32, lookup: WANG16 },
  },
  backdrop: { img: "fuji", x: 0, y: 16, scale: 2 },
  slippery(api, x, y) {
    return homeward(api) && y > 17 * T && y < 19 * T ? HOMEWARD_SLIP : false;
  },
  // ほうとう屋の先は冬期通行止: ゲートで行けない(ぶつかるとはじかれる)
  rails: [[[GATE_X, 8 * T], [GATE_X, 22 * T]]],
  drawGround(ctx, ox, oy, img, api) {
    // 道の舗装は峠道と同じ粒のアスファルト(D282)。マス目の絵の格子の舗装の上から、土手のふちと舗装を敷く
    const asphalt = typeof img === "function" && img("road_asphalt");
    if (asphalt) {
      if (!this.pattern) this.pattern = ctx.createPattern(asphalt, "repeat");
      ctx.save();
      ctx.translate(ox, oy);
      ctx.fillStyle = "#c4dae6";
      ctx.fillRect(0, 17 * T - 4, 16 * T, 2 * T + 8);
      ctx.fillStyle = this.pattern;
      ctx.fillRect(0, 17 * T, 16 * T, 2 * T);
      ctx.restore();
    }
    if (api && homeward(api)) {
      ctx.fillStyle = "rgba(243, 246, 249, 0.88)";
      ctx.fillRect(ox, 17 * T + oy, 16 * T, 2 * T);
    } else {
      centerLine(ctx, ox, oy, [[-T, 18 * T], [GATE_X - 6, 18 * T]]);
    }
    // ゲートの先: 除雪されず、深い雪に埋もれた道
    const gx = GATE_X + ox;
    const g = ctx.createLinearGradient(gx, 0, gx + 1.2 * T, 0);
    g.addColorStop(0, "rgba(244, 247, 250, 0.7)");
    g.addColorStop(1, "rgba(244, 247, 250, 1)");
    ctx.fillStyle = g;
    ctx.fillRect(gx, 16.8 * T + oy, 16 * T - GATE_X, 2.4 * T);
    // ゲートバー(道を横切る、黄と黒のしま)と支柱
    const y0 = 16.6 * T + oy;
    const y1 = 19.4 * T + oy;
    for (let y = y0; y < y1; y += 8) {
      ctx.fillStyle = Math.floor((y - y0) / 8) % 2 ? "#1e1e22" : "#f0c020";
      ctx.fillRect(gx - 3, y - 10, 6, Math.min(8, y1 - y));
    }
    ctx.strokeStyle = "#1a1a1e";
    ctx.lineWidth = 1;
    ctx.strokeRect(gx - 3.5, y0 - 10.5, 7, y1 - y0 + 1);
    ctx.fillStyle = "#f7f9fb"; // バーに積もった雪
    ctx.fillRect(gx - 4, y0 - 12, 8, 3);
    for (const py of [y0, y1]) {
      ctx.fillStyle = "#8a9099";
      ctx.fillRect(gx - 4, py - 16, 8, 18);
      ctx.fillStyle = "#b8bec6";
      ctx.fillRect(gx - 4, py - 16, 2, 18);
      ctx.fillStyle = "#f7f9fb";
      ctx.fillRect(gx - 5, py - 18, 10, 3);
    }
  },
  spawns: {
    west: { x: 0.9 * T, y: 18 * T, facing: "east" },
    door: { x: 9.3 * T, y: 17 * T, facing: "south" },
  },
  // 左の端から、ワインディングロードへ戻る
  triggers: [{ id: "toRoad", x: -T, y: 16.5 * T, w: 1.6 * T, h: 3 * T, warp: { map: "road", spawn: "pass" } }],
  objects: [
    at("car", 2.6 * T, 16.7 * T, {
      id: "car",
      range: 44,
      interact(api) {
        api.mutter("ちゃん");
        api.later(1300, () => api.show("v_window", () => api.setFlag("memory")));
      },
    }),
    // ひびの入った氷: はじめは、はしる(D201)でしか渡れなかったが、ふつうに取れるようにした(D265)
    kGate({
      id: "crack",
      x: 5 * T,
      y: 11.6 * T,
      r: 1.9 * T,
      r0: 0.6 * T,
      ey: 0.55,
      // ふつうに歩いて乗れる(D265。能力も走りの操作もいらない。ひびは見た目だけ)
      ok: () => true,
      onBlock(api) {
        api.sfx("pop");
        api.shake(0.18, 2);
      },
      draw(ctx, sx, sy, t, api) {
        if (api.hasItem("氷のかけら")) return;
        // かけらのまわりに、放射状のひびと、輪のひび
        ctx.fillStyle = "rgba(120, 150, 180, 0.75)";
        for (let k = 0; k < 9; k++) {
          const a = k * 0.7 + (k % 3) * 0.2;
          for (let r = 0.5 * T; r < 1.85 * T; r += 2) {
            const w = Math.sin(r * 0.21 + k) * 3;
            ctx.fillRect(Math.round(sx + Math.cos(a) * r - Math.sin(a) * w), Math.round(sy + (Math.sin(a) * r + Math.cos(a) * w) * 0.55), 1, 1);
          }
        }
        for (const rr of [1.05 * T, 1.6 * T]) {
          for (let a = 0; a < Math.PI * 2; a += 0.05) {
            if (Math.sin(a * 5 + rr) > 0.55) continue;
            ctx.fillRect(Math.round(sx + Math.cos(a) * rr), Math.round(sy + Math.sin(a) * rr * 0.55), 1, 1);
          }
        }
      },
    }),
    at("shard", 5 * T, 11.8 * T, {
      id: "shard",
      bob: 1,
      range: 26,
      hidden: (api) => api.hasItem("氷のかけら"),
      // 近くまで行けば、そのまま拾う(少しそれて通っても拾える)
      update(dt, t, api) {
        if (api.hasItem("氷のかけら") || this._got) return;
        const p = api.player();
        if (Math.hypot(p.x - this.x, p.y - this.y) > 40) return;
        this._got = true;
        api.hold("ic_kori", 1.8, () => api.giveItem("氷のかけら"));
      },
      interact(api) {
        api.hold("ic_kori", 1.8, () => api.giveItem("氷のかけら"));
      },
    }),
    houtou,
    // 見届け: 湖畔で、富士山に日が沈むまで待つ(D189)
    kWatch({
      id: "w_sunset",
      x: 12.5 * T,
      y: 11.5 * T,
      r: 2.4 * T,
      sec: 6, lure: "255, 170, 90",
      when: () => true,
      fx(ctx, sx, sy, p) {
        if (p <= 0) return;
        kTint(ctx, `rgba(255, 150, 80, ${Math.min(0.32, p * 0.6) * (p < 0.7 ? 1 : (1 - p) / 0.3)})`);
        if (p > 0.5) kTint(ctx, `rgba(30, 40, 90, ${(p - 0.5) * 0.7})`);
      },
    }),
    // のれんの前
    {
      id: "door",
      x: 9.7 * T,
      y: 16 * T,
      w: 1,
      h: 1,
      headY: 30,
      range: 30,
      nearRange: 64,
      near(api) {
        if (api.flag("saidHoutou")) return;
        api.setFlag("saidHoutou");
        api.mutter("ほうとう");
      },
      interact(api) {
        api.warp("shop", "door");
      },
    },
    // 冬期通行止の看板(道ばた)
    at("closed", 12.6 * T, 20.3 * T, {
      id: "closed",
      range: 40,
      interact(api) {
        api.mutter("……");
      },
    }),
    at("pine", 13.6 * T, 9 * T),
    at("pine", 12.2 * T, 8.8 * T),
    at("bare", 14.4 * T, 11 * T),
    at("pine", 0.4 * T, 21 * T),
    at("pine", 3.1 * T, 21.2 * T),
    at("bare", 6.5 * T, 21 * T),
    at("pine", 10.2 * T, 21.1 * T),
    at("pine", 13.8 * T, 21.3 * T),
  ],
};

// ---- ほうとう屋の中(古民家): 左が土間とかまど、右が板の間とちゃぶ台 ----
const TANSU_FOOT = [8.2 * T, 2.9 * T];
const SHOP = {
  tile: T,
  bg: "#140f12",
  map: [
    "XUUUUUUUUUUUUUX",
    "XLLLLLLLLLLLLLX",
    "XdddddffffffffX",
    "XdddddffffffffX",
    "XdddddffffffffX",
    "XdddddffffffffX",
    "XdddddffffffffX",
    "XdddddffffffffX",
    "XdddddffffffffX",
    "XXdddXXXXXXXXXX",
  ],
  legend: {
    X: { solid: true, color: "#1e1511" },
    U: { solid: true, img: "k_wall", crop: [0, 0] },
    L: { solid: true, img: "k_wall", crop: [0, 32] },
    f: { wang: "floor" },
    d: { wang: "floor", lowerOf: ["floor"] },
  },
  wang: { floor: { img: "wang_floor", size: 32, lookup: WANG16 } },
  spawns: { door: { x: 3.5 * T, y: 8.4 * T, facing: "north" } },
  triggers: [{ id: "out", x: 2 * T, y: 9.4 * T, w: 3 * T, h: T, warp: { map: "lake", spawn: "door" } }],
  objects: [
    // 土間: 鋳鉄のだるまストーブ(上にやかん、煙突は天井へ)
    at("stove", 3 * T, 3.9 * T),
    // 囲炉裏。自在鉤に吊った土鍋で、土星を煮ている(水に浮くから)
    at("irori", 11.4 * T, 7.6 * T, {
      id: "pot",
      headY: 40,
      range: 44,
      interact(api) {
        api.show("v_pot");
      },
    }),
    // 板壁の文化祭のポスター(廃兵院の十月の文化祭。ここは冬)
    at("poster", 13.2 * T, 1.75 * T, {
      id: "poster",
      range: 40,
      interact(api) {
        api.show("v_poster");
      },
    }),
    at("post", 6 * T, 3 * T),
    at("post", 6 * T, 8.9 * T),
    at("tansu", TANSU_FOOT[0], TANSU_FOOT[1]),
    // たんすの上のラジオ
    Object.assign(at("radio", TANSU_FOOT[0] + 6, TANSU_FOOT[1] - 38), {
      id: "radio",
      sortDy: 60,
      iy: 49,
      range: 40,
      interact(api) {
        api.bubble("radio", "……あすの金星は、晴れ……", 3600);
        if (!api.hasWord("金星の天気予報")) {
          api.learnWord("金星の天気予報");
          api.later(3700, () => api.toast("金星の天気予報")); // ラジオの吹き出しが消えてから(窓が重ならないように)
        }
      },
    }),
    // ちゃんの座布団
    at("zabuton", 7.6 * T, 4.5 * T, {
      id: "chair",
      sortDy: -20,
      range: 44, // 30 では、となりの座布団と取りちがえやすかった(批評会 D308)
      interact(api) {
        if (!api.flag("memory")) {
          api.mutter("……");
          return;
        }
        api.mutter("ちゃん");
        // 何度でも見られる。はじめて見たときに断片の条件を満たす
        api.later(1300, () =>
          api.show("v_table", () => {
            api.setFlag("ate");
            api.setFlag("homeward");
            api.clear();
          })
        );
      },
    }),
    at("chabudai", 7.6 * T, 6.3 * T),
    // 車の回想のあと、まだ座っていなければ、ちゃんの座布団だけがほのかに光って呼ぶ(ほかの座布団と見分けられるように。批評会 D308)
    kLure({ id: "chair_lure", x: 7.6 * T, y: 4.5 * T, ly: -0.3 * T, lure: "255, 205, 150", keep: true, when: (api) => api.flag("memory") && !api.flag("ate") }),
    // 囲炉裏のまわりの座布団(奥は自在鉤の竿がかかるので空ける)
    at("zabuton", 9.5 * T, 6.4 * T, { sortDy: -20 }),
    at("zabuton", 13.4 * T, 6.4 * T, { sortDy: -20 }),
    at("zabuton", 11.4 * T, 8.7 * T, { sortDy: -20 }),
    // きーの小さな座布団
    at("zabutonS", 7.6 * T, 7.7 * T, { sortDy: -20 }),
    {
      id: "noren",
      x: 3.5 * T,
      y: 9 * T,
      w: 1,
      h: 1,
      sortDy: 40,
      draw(ctx, sx, sy) {
        ctx.fillStyle = "#1f2e52";
        ctx.fillRect(sx - 46, sy - 2, 92, 10);
        ctx.fillStyle = "#16213d";
        for (let i = -46; i < 46; i += 23) ctx.fillRect(sx + i + 21, sy - 2, 2, 10);
      },
    },
  ],
};
