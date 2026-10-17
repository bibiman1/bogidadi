// 断片「呪いの野犬」のダイナーのピンボール台「FREEWAY DOGS」(D327)。
// 調べると台の画面に切りかわる。B が左のフリッパー、A が右のフリッパー、十字キーの下を押して離すと玉を打ち出す。玉は 3 つ。
// 進み具合とは関係しない。最高点だけ、台に残す(保存の flags の noroi.pinHigh)。
// 盤面の絵はここで描き、頭の絵(backglass)は docs/assets/noroi/pinball/make.py
"use strict";

// 盤面(画面の座標で、左上 PB_X, PB_Y、幅 168、高さ 280)。当たり判定は盤面の座標
const PB_X = 156;
const PB_Y = 4;
const PB_W = 168;
const PB_H = 280;
const PB_R = 4; // 玉の半径
const PB_G = 300; // 重力(盤面の傾き)
const PB_FLIP = { len: 30, rest: 0.5, up: -0.42, wUp: 24, wDown: 12, thick: 3 };
const PB_LANE = { x: 157, rest: 264 }; // 打ち出しの通路
const PB_BUMPERS = [
  { x: 52, y: 96, r: 11, kind: "beko" }, // 赤べこの頭
  { x: 112, y: 96, r: 11, kind: "drum" }, // ぽんぽんカーのドラム缶
  { x: 82, y: 134, r: 11, kind: "duck" }, // とりぼぎかーの子がも
];
const PB_TOPLANES = [66, 90, 114]; // 上の 3 つのレーン(全部ともすと 1000 点)
const PB_POSTS = [54, 78, 102, 126];
// 壁(はね返る)。上の丸い天井、左右の壁、打ち出しの通路、下のすべり台
const PB_WALLS = (() => {
  const w = [];
  let prev = null;
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI + (Math.PI * i) / 18;
    const p = [84 + 80 * Math.cos(a), 84 + 80 * Math.sin(a)];
    if (prev) w.push([prev[0], prev[1], p[0], p[1]]);
    prev = p;
  }
  w.push([4, 84, 4, 206], [4, 206, 40, 246]); // 左の壁とすべり台
  w.push([164, 84, 164, 284], [150, 104, 150, 284], [150, 206, 110, 246]); // 右の壁、通路の仕切り、右のすべり台
  w.push([150, 272, 164, 272]); // 打ち出し棒の頭
  for (const x of PB_POSTS) w.push([x, 32, x, 46]); // 上のレーンの仕切り
  return w;
})();
const PB_SLINGS = [
  [20, 188, 36, 222],
  [130, 188, 114, 222],
];
const pb = { x: 0, y: 0, vx: 0, vy: 0, live: false, balls: 3, score: 0, over: false, charge: 0, lanes: [false, false, false], flash: {}, flips: null, high: 0, t: 0, drainT: -1 };
const pbFlipper = (left) => ({ left, px: left ? 40 : 110, py: 246, th: PB_FLIP.rest, w: 0 });
// フリッパーの画面での角度(左は右下へ、右は左下へのびる)
const pbAng = (f) => (f.left ? f.th : Math.PI - f.th);
const pbTip = (f) => ({ x: f.px + PB_FLIP.len * Math.cos(pbAng(f)), y: f.py + PB_FLIP.len * Math.sin(pbAng(f)) });
function pbNewBall() {
  Object.assign(pb, { x: PB_LANE.x, y: PB_LANE.rest, vx: 0, vy: 0, live: true, charge: 0, drainT: -1 });
}
function pbReset(api) {
  Object.assign(pb, { balls: 3, score: 0, over: false, lanes: [false, false, false], flash: {}, flips: [pbFlipper(true), pbFlipper(false)], t: 0 });
  pb.high = Number(api.flagValue("pinHigh")) || 0;
  pbNewBall();
}
const pbInLane = () => pb.x > 150 && pb.y >= PB_LANE.rest - 1 && Math.hypot(pb.vx, pb.vy) < 30;
// 玉と線分(太さ th)の当たり。surf は線のその点の速さ。当たったら法線を返す
function pbHitSeg(ax, ay, bx, by, th, e, surf) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((pb.x - ax) * dx + (pb.y - ay) * dy) / l2));
  const cx = ax + dx * t;
  const cy = ay + dy * t;
  let nx = pb.x - cx;
  let ny = pb.y - cy;
  const d = Math.hypot(nx, ny);
  const rr = PB_R + th;
  if (d >= rr || d === 0) return null;
  nx /= d;
  ny /= d;
  pb.x = cx + nx * rr;
  pb.y = cy + ny * rr;
  const sv = surf ? surf(cx, cy) : { x: 0, y: 0 };
  let rvx = pb.vx - sv.x;
  let rvy = pb.vy - sv.y;
  const vn = rvx * nx + rvy * ny;
  if (vn < 0) {
    rvx -= (1 + e) * vn * nx;
    rvy -= (1 + e) * vn * ny;
    pb.vx = rvx + sv.x;
    pb.vy = rvy + sv.y;
  }
  return { nx, ny, vn };
}
function pbStep(api, h) {
  pb.vy += PB_G * h;
  pb.x += pb.vx * h;
  pb.y += pb.vy * h;
  for (const w of PB_WALLS) pbHitSeg(w[0], w[1], w[2], w[3], 0.5, 0.45, null);
  for (const x of PB_POSTS) {
    const c = pbHitSeg(x, 32, x, 32, 2, 0.5, null);
    if (c) break;
  }
  for (const [i, s] of PB_SLINGS.entries()) {
    const c = pbHitSeg(s[0], s[1], s[2], s[3], 1.5, 0.5, null);
    if (c && c.vn < -40) {
      // はじき返す(スリングショット)
      pb.vx += c.nx * 150;
      pb.vy += c.ny * 150;
      pbScore(api, 10, "sling" + i);
      api.sfx("pb_sling");
    }
  }
  for (const [i, b] of PB_BUMPERS.entries()) {
    let nx = pb.x - b.x;
    let ny = pb.y - b.y;
    const d = Math.hypot(nx, ny);
    if (d < b.r + PB_R && d > 0) {
      nx /= d;
      ny /= d;
      pb.x = b.x + nx * (b.r + PB_R);
      pb.y = b.y + ny * (b.r + PB_R);
      const vn = pb.vx * nx + pb.vy * ny;
      if (vn < 0) {
        pb.vx -= 2 * vn * nx;
        pb.vy -= 2 * vn * ny;
      }
      pb.vx += nx * 170;
      pb.vy += ny * 170;
      pbScore(api, 100, "b" + i);
      api.sfx("pb_bumper");
    }
  }
  for (const f of pb.flips) {
    const tip = pbTip(f);
    const ws = f.left ? f.w : -f.w; // 画面での回る速さ
    pbHitSeg(f.px, f.py, tip.x, tip.y, PB_FLIP.thick, 0.3, (cx, cy) => ({ x: -ws * (cy - f.py), y: ws * (cx - f.px) }));
  }
  // 上のレーン
  if (pb.y > 34 && pb.y < 46 && pb.vy > 0)
    PB_TOPLANES.forEach((x, i) => {
      if (Math.abs(pb.x - x) < 7 && !pb.lanes[i]) {
        pb.lanes[i] = true;
        pbScore(api, 50, "lane" + i);
        api.sfx("pb_lane");
        if (pb.lanes.every(Boolean)) {
          pbScore(api, 1000, "lanes");
          pb.lanes = [false, false, false];
          api.sfx("chime");
        }
      }
    });
  const sp = Math.hypot(pb.vx, pb.vy);
  if (sp > 620) {
    pb.vx *= 620 / sp;
    pb.vy *= 620 / sp;
  }
}
function pbScore(api, n, what) {
  pb.score += n;
  pb.flash[what] = pb.t;
}
function pbLeave(api) {
  api.warp("diner", "pinball");
}
const N_PIN = {
  tile: T,
  bg: "#1a1512",
  hidePlayer: true,
  map: kGrid(15, 9, () => false), // 画面とちょうど同じ広さ(カメラが動かない)
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 4 * T, facing: "north" } },
  objects: [],
  triggers: [],
  onEnter(api) {
    pbReset(api);
  },
  debug: () => pb,
  onA(api) {
    if (pb.over) pbLeave(api); // 終わったら、A でダイナーへ
    return true; // フリッパーは押し続けで(input)
  },
  onB() {
    return true;
  },
  input(api, dt, inp) {
    if (!pb.flips) pbReset(api);
    pb.t += dt;
    // フリッパー
    for (const f of pb.flips) {
      const on = f.left ? inp.b : inp.a;
      const target = on ? PB_FLIP.up : PB_FLIP.rest;
      const prevTh = f.th;
      const sp = on ? PB_FLIP.wUp : PB_FLIP.wDown;
      if (on && !f.on) api.sfx("pb_flip");
      f.on = on;
      f.th = f.th > target ? Math.max(target, f.th - sp * dt) : Math.min(target, f.th + sp * dt);
      f.w = (f.th - prevTh) / Math.max(dt, 1e-4);
    }
    if (pb.over) return;
    // 打ち出し: 下を押してためる、離すと打つ。通路で止まっているときに上を押すと、台を離れる
    if (pb.live && pbInLane()) {
      if (inp.y > 0.5) pb.charge = Math.min(1, pb.charge + dt * 1.2);
      else if (pb.charge > 0) {
        pb.vy = -(260 + 340 * pb.charge);
        pb.charge = 0;
        api.sfx("pb_launch");
      } else if (inp.y < -0.6) return pbLeave(api);
    }
    if (!pb.live) {
      if (pb.drainT >= 0 && pb.t - pb.drainT > 1.2) {
        if (pb.balls > 0) pbNewBall();
        else {
          pb.over = true;
          if (pb.score > pb.high) {
            pb.high = pb.score;
            api.setFlag("pinHigh", pb.score);
          }
        }
      }
      return;
    }
    const h0 = Math.min(dt, 1 / 30);
    const n = Math.ceil(h0 / 0.002);
    for (let i = 0; i < n; i++) pbStep(api, h0 / n);
    if (pb.y > PB_H + 8) {
      // 落ちた
      pb.live = false;
      pb.balls -= 1;
      pb.drainT = pb.t;
      api.sfx("back");
    }
  },
  drawGround(ctx, ox, oy, img) {
    if (!pb.flips) return;
    const get = (k) => (typeof img === "function" ? img(k) : null);
    const X = Math.round(ox + PB_X);
    const Y = Math.round(oy + PB_Y);
    // 台のまわり(暗いダイナーの壁)
    ctx.fillStyle = "#1a1512";
    ctx.fillRect(ox, oy, 480, 288);
    // 頭の絵(左)と得点
    const bg = get("pb_backglass");
    if (bg) ctx.drawImage(bg, Math.round(ox + 10), Math.round(oy + 6));
    pbPanel(ctx, ox + 10, oy + 220, 136, 62);
    pbText(ctx, ox + 18, oy + 226, "SCORE", "#e8c060", 2);
    pbDigits(ctx, ox + 18, oy + 242, pb.score, 7, "#ff7a3c");
    // 右: 玉と最高点
    pbPanel(ctx, ox + 334, oy + 6, 136, 110);
    pbText(ctx, ox + 344, oy + 14, "BALL", "#e8c060", 2);
    for (let i = 0; i < 3; i++) {
      const on = i < pb.balls; // 残りの玉(打っている玉もふくむ)
      ctx.fillStyle = on ? "#ffe8a0" : "#3a3028";
      ctx.beginPath();
      ctx.arc(Math.round(ox + 352 + i * 22), Math.round(oy + 44), 6, 0, Math.PI * 2);
      ctx.fill();
    }
    pbText(ctx, ox + 344, oy + 64, "HIGH", "#e8c060", 2);
    pbDigits(ctx, ox + 344, oy + 80, pb.high, 7, "#9fe0ff");
    if (pb.over && Math.floor(pb.t * 2) % 2 === 0) {
      pbPanel(ctx, ox + 334, oy + 124, 136, 40);
      pbText(ctx, ox + 346, oy + 134, "GAME OVER", "#ff5a4a", 2);
    }
    // 盤面
    if (!pb.field || (!pb.fieldArt && get("pb_field"))) {
      pb.fieldArt = get("pb_field");
      pb.field = pbFieldArt(pb.fieldArt);
    }
    ctx.drawImage(pb.field, X, Y);
    // 上のレーンの灯り
    PB_TOPLANES.forEach((x, i) => {
      ctx.fillStyle = pb.lanes[i] ? "#ffd84a" : "#5a4a30";
      ctx.fillRect(X + x - 3, Y + 50, 6, 4);
    });
    // バンパー(当たった直後は光る)
    PB_BUMPERS.forEach((b, i) => pbBumper(ctx, X + b.x, Y + b.y, b, pb.t - (pb.flash["b" + i] ?? -9) < 0.12));
    // スリングショット
    PB_SLINGS.forEach((s, i) => {
      const lit = pb.t - (pb.flash["sling" + i] ?? -9) < 0.1;
      ctx.strokeStyle = lit ? "#ffffff" : "#f0e8d8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(X + s[0], Y + s[1]);
      ctx.lineTo(X + s[2], Y + s[3]);
      ctx.stroke();
    });
    // 打ち出し棒(ためると縮む)
    const pk = Math.round(pb.charge * 10);
    ctx.fillStyle = "#c8c8d0";
    ctx.fillRect(X + 152, Y + 273 + pk, 10, 3);
    ctx.fillStyle = "#806040";
    for (let y = Y + 277 + pk; y < Y + PB_H; y += 2) ctx.fillRect(X + 154, y, 6, 1);
    // フリッパー
    for (const f of pb.flips) {
      const tip = pbTip(f);
      ctx.lineCap = "round";
      ctx.strokeStyle = "#b02a24";
      ctx.lineWidth = PB_FLIP.thick * 2 + 2;
      ctx.beginPath();
      ctx.moveTo(X + f.px, Y + f.py);
      ctx.lineTo(X + tip.x, Y + tip.y);
      ctx.stroke();
      ctx.strokeStyle = "#f4ecd8";
      ctx.lineWidth = PB_FLIP.thick * 2 - 2;
      ctx.stroke();
      ctx.lineCap = "butt";
    }
    // 玉
    if (pb.live) {
      const bx = Math.round(X + pb.x);
      const by = Math.round(Y + pb.y);
      ctx.fillStyle = "#7c8088";
      ctx.beginPath();
      ctx.arc(bx, by, PB_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e8ecf0";
      ctx.beginPath();
      ctx.arc(bx - 1, by - 1, PB_R - 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx - 2, by - 2, 1, 1);
    }
  },
};
// 盤面の絵(一度だけ描く)。art(PixelLab の盤面の絵 pb_field、D328)があればそれに、当たり判定どおりのメッキの壁を重ねる。
// なければ、ドラッグストリップの路面、白い線、チェッカーの帯、炎の絵を描く(盤面の絵の下絵にもした)
function pbFieldArt(art) {
  const c = document.createElement("canvas");
  c.width = PB_W;
  c.height = PB_H;
  const g = c.getContext("2d");
  if (art) {
    g.imageSmoothingEnabled = false;
    g.drawImage(art, 0, 0, PB_W, PB_H);
    g.strokeStyle = "rgba(200, 204, 214, 0.85)";
    g.lineWidth = 1.5;
    for (const w of PB_WALLS) {
      g.beginPath();
      g.moveTo(w[0], w[1]);
      g.lineTo(w[2], w[3]);
      g.stroke();
    }
    g.fillStyle = "#e0e4ec";
    for (const x of PB_POSTS) g.fillRect(x - 2, 30, 4, 4);
    g.fillStyle = "rgba(14, 10, 8, 0.85)";
    g.fillRect(56, 268, 38, PB_H - 268); // 落ちる口
    return c;
  }
  g.fillStyle = "#3a2c22"; // 台の木
  g.fillRect(0, 0, PB_W, PB_H);
  // 天井の丸みに合わせた路面
  g.save();
  g.beginPath();
  g.arc(84, 84, 80, Math.PI, Math.PI * 2);
  g.lineTo(164, PB_H);
  g.lineTo(4, PB_H);
  g.closePath();
  g.clip();
  g.fillStyle = "#2c3446";
  g.fillRect(0, 0, PB_W, PB_H);
  for (let y = 0; y < PB_H; y += 3) {
    g.fillStyle = y % 6 ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.05)";
    g.fillRect(0, y, PB_W, 1);
  }
  // 路面の白い線(まん中の破線)と、黄色いへりの線
  g.fillStyle = "#e8e0c8";
  for (let y = 150; y < 236; y += 12) g.fillRect(81, y, 2, 6);
  g.fillStyle = "#d8b040";
  g.fillRect(14, 60, 2, 130);
  g.fillRect(136, 60, 2, 130);
  // チェッカーの帯(ゴールの線)
  for (let x = 6; x < 148; x += 6) for (let r = 0; r < 2; r++) {
    g.fillStyle = (x / 6 + r) % 2 ? "#e8e4dc" : "#141414";
    g.fillRect(x, 58 + r * 4, 6, 4);
  }
  // 炎の絵(すべり台のそば)
  const flame = (x, y, dir) => {
    const cols = ["#ffde4a", "#ff9a2a", "#e0402a"];
    cols.forEach((col, i) => {
      g.fillStyle = col;
      for (let k = 0; k < 5; k++) g.fillRect(x + dir * (k * 4 + i * 2), y - k * 3 - i, 6 - i * 2, 2);
    });
  };
  flame(18, 238, 1);
  flame(132, 238, -1);
  g.restore();
  // 打ち出しの通路
  g.fillStyle = "#241c18";
  g.fillRect(151, 104, 12, PB_H - 104);
  // 壁のメッキ
  g.strokeStyle = "#a8acb4";
  g.lineWidth = 2;
  for (const w of PB_WALLS) {
    g.beginPath();
    g.moveTo(w[0], w[1]);
    g.lineTo(w[2], w[3]);
    g.stroke();
  }
  g.fillStyle = "#d8dce4";
  for (const x of PB_POSTS) g.fillRect(x - 2, 30, 4, 4);
  // フリッパーの下(落ちる口)
  g.fillStyle = "#120e0c";
  g.fillRect(56, 268, 38, PB_H - 268);
  return c;
}
function pbBumper(ctx, x, y, b, lit) {
  const cap = { beko: ["#c8282a", "#1a1a1a"], drum: ["#f0e4c8", "#c83a2a"], duck: ["#f09a2a", "#6a8a3a"] }[b.kind];
  ctx.fillStyle = "#e8ecf0";
  ctx.beginPath();
  ctx.arc(x, y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lit ? "#fff6c0" : cap[0];
  ctx.beginPath();
  ctx.arc(x, y, b.r - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cap[1];
  if (b.kind === "beko") {
    // 赤べこの黒いまだら
    ctx.fillRect(x - 4, y - 3, 3, 2);
    ctx.fillRect(x + 1, y + 1, 3, 2);
    ctx.fillRect(x - 2, y + 4, 2, 2);
  } else if (b.kind === "drum") {
    // ドラム缶のたが
    ctx.fillRect(x - 7, y - 2, 14, 1);
    ctx.fillRect(x - 7, y + 2, 14, 1);
  } else {
    // 子がもの頭
    ctx.beginPath();
    ctx.arc(x, y - 1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8c040";
    ctx.fillRect(x + 3, y - 1, 3, 2);
  }
}
function pbPanel(ctx, x, y, w, h) {
  ctx.fillStyle = "#0e0b0a";
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
  ctx.strokeStyle = "#806040";
  ctx.lineWidth = 2;
  ctx.strokeRect(Math.round(x) + 1, Math.round(y) + 1, w - 2, h - 2);
}
// 3×5 のドットの字(得点板の字。台の字はゲームの文の字ではなく、機械の字)
const PB_FONT = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", E: "111100110100111", G: "011100101101011", H: "101101111101101",
  I: "111010010010111", L: "100100100100111", M: "101111111101101", O: "010101101101010", R: "110101110101101", S: "011100010001110",
  V: "101101101101010", " ": "000000000000000",
};
function pbText(ctx, x, y, s, col, k) {
  ctx.fillStyle = col;
  [...s].forEach((ch, i) => {
    const f = PB_FONT[ch] || PB_FONT[" "];
    for (let j = 0; j < 15; j++) if (f[j] === "1") ctx.fillRect(Math.round(x + i * 4 * k + (j % 3) * k), Math.round(y + Math.floor(j / 3) * k), k, k);
  });
}
// 7 つの棒の数字
const PB_SEG = ["1110111", "0010010", "1011101", "1011011", "0111010", "1101011", "1101111", "1010010", "1111111", "1111011"];
function pbDigits(ctx, x, y, n, len, col) {
  const s = String(Math.max(0, Math.floor(n))).padStart(len, " ");
  [...s].forEach((ch, i) => {
    const dx = Math.round(x + i * 16);
    const segs = ch === " " ? "0000000" : PB_SEG[+ch];
    // 棒の並び: 上、左上、右上、まん中、左下、右下、下
    const bars = [[2, 0, 8, 2], [0, 2, 2, 8], [10, 2, 2, 8], [2, 10, 8, 2], [0, 12, 2, 8], [10, 12, 2, 8], [2, 20, 8, 2]];
    bars.forEach((b, j) => {
      ctx.fillStyle = segs[j] === "1" ? col : "rgba(255,255,255,0.06)";
      ctx.fillRect(dx + b[0], Math.round(y) + b[1], b[2], b[3]);
    });
  });
}
