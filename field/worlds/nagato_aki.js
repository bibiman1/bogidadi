// 断片: 本栖湖の長門の寄り道。秋の凍った湖(D674、D675、todo 278)
// 絵葉書を買うと、湖畔の通りの東のはしが開き、秋の湖畔(冬は通行止めのゲートの所)に着く。
// 秋の湖畔 → ほうとう屋の中(ちゃんの席に湯のみ) / 西へ → 秋の峠道(ぴーとお世話係の落ち葉焚き)→ 下りきると、凍った湖の台座の前へ
// 冬の湖(lake.js)の形をそのまま使い、絵だけ秋にする。冬の断片そのものは変えない(D471)。説明の言葉は出さない
// field/worlds/ のファイルは index.html の順に読む。lake.js と nagato_kohan.js の名前をそのまま使う
"use strict";

const AKI_GRASS = "#6c6440"; // 雪の土手の代わりの、枯れ草の土手
const AKI_BG = "#5e5838";
const AKI_SPR = {
  pine: { img: "aki_pine", w: 64, h: 96, top: 5, bottom: 88, solid: [14, 8] },
  maple: { img: "aki_maple", w: 64, h: 96, top: 16, bottom: 80, solid: [12, 8] },
  houtou: { img: "aki_houtou", w: 160, h: 128, top: 8, bottom: 120, solid: [118, 44] },
  tires: { img: "aki_tires", w: 64, h: 48, top: 8, bottom: 36, solid: [44, 12] },
};
const akiAt = (kind, fx, fy, extra) => placeAt(AKI_SPR[kind], fx, fy, extra);
// 冬の森(雪のもみの木と、葉の落ちた木)を、秋の木に置きかえる。足もとの位置はそのまま
const akiTree = (o) => {
  const kind = o.img === "s_pine" ? "pine" : "maple";
  const s = SPRITES[o.img === "s_pine" ? "pine" : "bare"];
  return akiAt(kind, o.x, o.y + (s.bottom - s.h / 2));
};


// 地面の落ち葉(作者「地面に落ち葉を散りばめられるか？」)。かえで・さくら・くぬぎの色の小さな葉を、決まった並びで散らす。
// 水の上(i)には置かない。マップごとに一度だけ別の紙に描いておき、毎回それを重ねる
const AKI_LEAF_COL = [[196, 58, 38], [222, 104, 40], [236, 156, 52], [168, 46, 40], [150, 96, 50], [210, 176, 70]];
const AKI_LEAF_SHAPE = [
  [[2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [0, 3], [2, 3], [4, 3], [2, 4]], // かえで(5 × 5)
  [[1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2], [2, 3]], // 丸い葉(さくら)
  [[3, 0], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [1, 3]], // 細い葉(くぬぎ)、ななめ
  [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [3, 2]], // 小さなかえで
];
function akiLeaves(grid, skip, per) {
  // per: マスの文字ごとの、1 マスあたりの葉の数のめやす(作者「落ち葉は絨毯のように沢山。なんなら道路にも」)
  const c = document.createElement("canvas");
  c.width = grid[0].length * T;
  c.height = grid.length * T;
  const g = c.getContext("2d");
  for (let r = 0; r < grid.length; r++)
    for (let cc = 0; cc < grid[0].length; cc++) {
      if (skip.includes(grid[r][cc])) continue;
      const p = per[grid[r][cc]] || 0;
      const n = Math.floor(p * (0.6 + 0.8 * rand(r, cc, 7)) + 0.5);
      for (let k = 0; k < n; k++) {
        const x = Math.floor(cc * T + rand(r, cc, 10 + k * 3) * T);
        const y = Math.floor(r * T + rand(r, cc, 31 + k * 3) * T);
        const col = AKI_LEAF_COL[Math.floor(rand(r, cc, 52 + k * 5) * AKI_LEAF_COL.length)];
        const sh = AKI_LEAF_SHAPE[Math.floor(rand(r, cc, 73 + k * 7) * AKI_LEAF_SHAPE.length)];
        for (const [dx, dy] of sh) {
          const d = dx + dy < 3 ? 1 : 0.8; // 葉の片側を少し暗く
          g.fillStyle = `rgb(${col[0] * d | 0}, ${col[1] * d | 0}, ${col[2] * d | 0})`;
          g.fillRect(x + dx, y + dy, 1, 1);
        }
        g.fillStyle = "rgba(40, 30, 20, 0.35)"; // 葉の下の小さな影
        g.fillRect(x + 1, y + 5, 3, 1);
      }
    }
  return c;
}

// 峠道のアスファルト(lake.js の drawRoadVector と同じ。土手の色だけ枯れ草)
function akiRoadVector(ctx, ox, oy, cache) {
  ctx.save();
  ctx.translate(ox, oy);
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
  line(96, AKI_GRASS);
  dots(48, AKI_GRASS);
  line(88, cache.pattern);
  dots(44, cache.pattern);
  ctx.restore();
}

// ---- 秋の峠道(冬の ROAD と同じ形) ----
function akiRoadGround(ctx, ox, oy, img) {
  if (typeof img !== "function") return;
  const tile = img("road_asphalt");
  if (!tile) return;
  if (!this.pattern) this.pattern = ctx.createPattern(tile, "repeat");
  // 谷の靄: 背景の森の裾を、崖の縁へつなぐ
  const g = ctx.createLinearGradient(0, 6.9 * T + oy, 0, 8.05 * T + oy);
  g.addColorStop(0, "rgba(94, 88, 56, 0)");
  g.addColorStop(1, "rgba(94, 88, 56, 0.95)");
  ctx.fillStyle = g;
  ctx.fillRect(ox, 6.9 * T + oy, ROAD_COLS * T, 1.15 * T);
  ctx.fillStyle = "#7a7048";
  ctx.fillRect(ox, 8 * T + oy, ROAD_COLS * T, 5);
  ctx.fillStyle = "#4e4830";
  ctx.fillRect(ox, 8 * T + 5 + oy, ROAD_COLS * T, 2);
  const { c0, c1, r0, r1 } = LAYBY;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.fillStyle = AKI_GRASS;
  ctx.beginPath();
  ctx.roundRect(c0 * T - 4, r0 * T - 4, (c1 - c0) * T + 8, (r1 - r0) * T + 8, 18);
  ctx.fill();
  ctx.restore();
  akiRoadVector(ctx, ox, oy, this);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.fillStyle = this.pattern;
  ctx.beginPath();
  ctx.roundRect(c0 * T, r0 * T, (c1 - c0) * T, (r1 - r0) * T, 14);
  ctx.fill();
  ctx.restore();
  centerLine(ctx, ox, oy, ROAD_CURVE.filter(([r]) => r > 10.9).map(([r, c]) => [(c + 0.5) * T, (r + 0.5) * T]));
  if (!this.leaves) this.leaves = akiLeaves(roadMapGrid, "#", { ".": 22, "=": 8 });
  ctx.drawImage(this.leaves, Math.round(ox), Math.round(oy));
  guardrail(ctx, ox, oy, [[LAYBY.c0 * T - 2, 8.55 * T], [LAYBY.c1 * T + 2, 8.55 * T]]);
  ROAD_RAILS.forEach((run) => guardrail(ctx, ox, oy, run));
}

// 峠の待避所の落ち葉焚き(D674): ぴーとお世話係が、いっしょに落ち葉を燃やしている。
// きーが近づくと、お世話係が枝にさしたイモを差し出すが、ぴーが横から奪っていく(毎回。イモは道具にしない)
const AKI_FIRE = { x: 7.6 * T, y: 9.95 * T };
const AKI_SEWA = { x: 9.3 * T, y: 9.85 * T }; // お世話係(呪いの野犬の木の葉のぼぎ)。焚き火の東、きーの来るほう
const AKI_PI = { x: 5.9 * T, y: 9.95 * T }; // ぴーは焚き火の西
const AKI_NEAR = 1.9 * T; // ここまで寄ると、イモを差し出す
const AKI_AWAY = 3.6 * T; // ここまで離れると、また差し出す
const aki = { phase: "idle", t0: 0, armed: true, pi: { x: AKI_PI.x, y: AKI_PI.y }, imo: null, hand: null };
const akiReset = () => Object.assign(aki, { phase: "idle", t0: 0, armed: true, pi: { x: AKI_PI.x, y: AKI_PI.y }, imo: null, hand: null });
const AKI_OFFER = 0.7; // 枝を差し出す
const AKI_HOLD = 0.7; // 差し出したまま
const AKI_DASH = 0.32; // ぴーが飛んでくる
const AKI_BACK = 0.8; // ぴーがイモを持って戻る
const AKI_EAT = 2.6; // ぴーがイモを持っている
const AKI_REDO = 0.6; // お世話係が、次のイモを焚き火にかざす
const akiLerp = (a, b, k) => a + (b - a) * k;
const akiEase = (k) => 1 - (1 - k) * (1 - k);
const akiHand = () => ({ x: AKI_SEWA.x - 9, y: AKI_SEWA.y - 15 }); // 枝の根もと(かごの横)
const akiOverFire = () => ({ x: AKI_FIRE.x + 4, y: AKI_FIRE.y - 28 });

function akiBonfire() {
  return {
    id: "aki_bonfire",
    x: AKI_FIRE.x,
    y: AKI_FIRE.y,
    w: 1,
    h: 1,
    sortDy: 0,
    solid: { w: 40, h: 12, dy: -6 },
    update(dt, t, api) {
      const pl = api.player();
      const d = Math.hypot(pl.x - AKI_SEWA.x, pl.y - AKI_SEWA.y);
      const go = (p) => {
        aki.phase = p;
        aki.t0 = t;
      };
      const e = t - aki.t0;
      if (aki.phase === "idle") {
        if (d > AKI_AWAY) aki.armed = true;
        if (aki.armed && d < AKI_NEAR) {
          aki.armed = false;
          aki.to = { x: akiLerp(AKI_SEWA.x, pl.x, 0.62), y: Math.min(pl.y, AKI_SEWA.y) - 22 }; // きーの前、少し上
          go("offer");
        }
      } else if (aki.phase === "offer" && e >= AKI_OFFER) go("hold");
      else if (aki.phase === "hold" && e >= AKI_HOLD) go("dash");
      else if (aki.phase === "dash" && e >= AKI_DASH) {
        api.sfx("pop");
        go("back");
      } else if (aki.phase === "back" && e >= AKI_BACK) go("eat");
      else if (aki.phase === "eat" && e >= AKI_EAT) go("redo");
      else if (aki.phase === "redo" && e >= AKI_REDO) go("idle");
      // 枝の先のイモと、ぴーの位置
      const fire = akiOverFire();
      let imo = fire;
      let pi = { x: AKI_PI.x, y: AKI_PI.y };
      const k = Math.min(1, e / ({ offer: AKI_OFFER, dash: AKI_DASH, back: AKI_BACK, redo: AKI_REDO }[aki.phase] || 1));
      const piAt = { x: (aki.to || fire).x - 6, y: (aki.to || fire).y + 30 }; // イモの下(ぴーはイモに跳びつく)
      if (aki.phase === "offer") imo = { x: akiLerp(fire.x, aki.to.x, akiEase(k)), y: akiLerp(fire.y, aki.to.y, akiEase(k)) };
      else if (aki.phase === "hold") imo = aki.to;
      else if (aki.phase === "dash") {
        imo = aki.to;
        pi = { x: akiLerp(AKI_PI.x, piAt.x, akiEase(k)), y: akiLerp(AKI_PI.y, piAt.y, akiEase(k)) - Math.sin(k * Math.PI) * 18 };
      } else if (aki.phase === "back") {
        pi = { x: akiLerp(piAt.x, AKI_PI.x, k), y: akiLerp(piAt.y, AKI_PI.y, k) - Math.abs(Math.sin(k * Math.PI * 3)) * 5 };
        imo = null;
      } else if (aki.phase === "eat") imo = null;
      else if (aki.phase === "redo") imo = null;
      aki.pi = pi;
      aki.imo = imo;
      aki.withPi = aki.phase === "back" || aki.phase === "eat";
      // 枝: 奪われたあとは空の枝が残り、ゆっくり焚き火の上へ戻す
      if (aki.phase === "back" || aki.phase === "eat") aki.tip = aki.to;
      else if (aki.phase === "redo") aki.tip = { x: akiLerp(aki.to.x, fire.x, k), y: akiLerp(aki.to.y, fire.y, k) };
      else aki.tip = imo;
      aki.newImo = aki.phase === "redo" ? k : 1; // 次のイモは、枝が焚き火の上に戻るころ現れる
      // 走るぴーにはじかれる(当たっても止めない)
      if (aki.phase === "dash" || aki.phase === "back") {
        const dx = pl.x - pi.x;
        const dy = pl.y - pi.y;
        const kk = Math.hypot(dx, dy);
        if (kk < 22 && (!aki.hitT || t - aki.hitT > 0.8)) {
          aki.hitT = t;
          api.knock((dx / (kk || 1)) * 160, (dy / (kk || 1)) * 160);
        }
      }
    },
    draw(ctx, sx, sy, t, api) {
      const im = api.image("aki_fire");
      if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - 40));
      // 炎のゆらぎ(小さな火の粉が上がって消える)と、細い煙
      for (let i = 0; i < 4; i++) {
        const k = (t * 0.9 + i * 0.25) % 1;
        const x = Math.round(sx + Math.sin(t * 3 + i * 2.1) * 4 + (i - 1.5) * 3);
        const y = Math.round(sy - 26 - k * 18);
        ctx.fillStyle = `rgba(255, ${170 + i * 20}, 60, ${1 - k})`;
        ctx.fillRect(x, y, 1, 1);
      }
      for (let i = 0; i < 5; i++) {
        const k = (t * 0.25 + i * 0.2) % 1;
        ctx.fillStyle = `rgba(200, 196, 186, ${0.35 * (1 - k)})`;
        const r = 2 + k * 5;
        ctx.beginPath();
        ctx.arc(sx + Math.sin(t * 0.7 + i) * 3 + k * 10, sy - 40 - k * 46, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}
// 枝にさしたイモ(手で描いた絵の、イモのところだけ)
const akiImo = (ctx, api, x, y, a = 1) => {
  const im = api.image("aki_imo");
  if (!im || a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.drawImage(im, 9, 1, 13, 9, Math.round(x - 6), Math.round(y - 4), 13, 9);
  ctx.restore();
};
function akiSewa() {
  return {
    id: "aki_sewa",
    x: AKI_SEWA.x,
    y: AKI_SEWA.y,
    w: 1,
    h: 1,
    headY: 38,
    solid: { w: 18, h: 8, dy: -4 },
    draw(ctx, sx, sy, t, api) {
      const im = api.image("fueler");
      if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height));
      // 枝(かごの横から、枝先へ)と、枝先のイモ
      const tip = aki.tip || akiOverFire();
      const h = akiHand();
      const ox = sx - this.x;
      const oy = sy - this.y;
      ctx.strokeStyle = "#5c3e24";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.round(h.x + ox) + 0.5, Math.round(h.y + oy) + 0.5);
      ctx.lineTo(Math.round(tip.x + ox) + 0.5, Math.round(tip.y + oy) + 0.5);
      ctx.stroke();
      if (aki.imo) akiImo(ctx, api, aki.imo.x + ox, aki.imo.y + oy);
      else if (aki.phase === "redo") akiImo(ctx, api, tip.x + ox, tip.y + oy, aki.newImo > 0.8 ? 1 : 0);
    },
  };
}
function akiPi() {
  return {
    id: "aki_pi",
    x: AKI_PI.x,
    y: AKI_PI.y,
    w: 1,
    h: 1,
    headY: 26,
    update() {
      this.x = aki.pi.x;
      this.y = aki.pi.y;
    },
    draw(ctx, sx, sy, t, api) {
      const pi = api.image("pi");
      if (!pi) return;
      const run = aki.phase === "dash" || aki.phase === "back";
      // 向き: 飛んでいくときは東、戻るときは西、ふだんは正面(焚き火を見ている)
      const row = aki.phase === "dash" ? 2 : aki.phase === "back" ? 3 : 0;
      const f = run ? Math.floor(t * 12) % 7 : 0;
      ctx.drawImage(pi, f * 64, row * 64, 64, 64, Math.round(sx - 32), Math.round(sy - 47), 64, 64);
      if (aki.withPi) akiImo(ctx, api, sx + (aki.phase === "back" ? -10 : 0), sy - 26 + (aki.phase === "eat" ? Math.round(Math.sin(t * 5)) : 0));
    },
  };
}

const NA_ROAD = {
  tile: T,
  bgm: "silence", // 秋の寄り道では、長門のカノンを流さない(作者「カノンは流さなくていい」)
  bg: AKI_BG,
  map: roadMapGrid,
  legend: {
    "#": { solid: true, none: true },
    ".": { wang: "road" },
    "=": { wang: "road" },
  },
  wang: { road: { img: "aki_wang_road", size: 32, lookup: WANG16 } },
  backdrop: { img: "aki_fuji", x: 0, y: 16, scale: 2 },
  rails: [[[LAYBY.c0 * T - 2, 8.55 * T], [LAYBY.c1 * T + 2, 8.55 * T]], ...ROAD_RAILS],
  drawGround: akiRoadGround,
  spawns: { pass: { x: 13.2 * T, y: 10.6 * T, facing: "west" } },
  triggers: [
    // 道のはじまり(冬の断片の入口)まで下ると、凍った湖の台座の前へ(D674)
    { id: "leave", x: 5.5 * T, y: 59.35 * T, w: 4 * T, h: T, run: (api) => api.exit("lake") },
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
    { id: "toLake", x: 14.3 * T, y: 8 * T, w: T, h: 4 * T, warp: { map: "akiLake", spawn: "west" } },
  ],
  objects: [
    ...ROAD.objects.filter((o) => o.img === "s_sign_r" || o.img === "s_sign_l"),
    akiAt("tires", 7 * T, 45.5 * T),
    { id: "lookout", x: 8 * T, y: 8.6 * T, w: 4 * T, h: 8, range: 60, interact: (api) => api.pan(0, 2600) },
    akiBonfire(),
    akiSewa(),
    akiPi(),
  ].concat(forest(roadMapGrid, 8, [[8, 0, 13, 14], [44, 5, 46, 10]]).map(akiTree)),
};

// ---- 秋の湖畔(冬の LAKE と同じ形)。湖は凍っていない。ちゃんの車は置かない(D674)。通行止めのゲートは開いている ----
const NA_LAKE = {
  tile: T,
  bgm: "silence",
  bg: AKI_BG,
  map: LAKE_GRID,
  legend: {
    "#": { solid: true, none: true },
    ".": { wang: "road" },
    "=": { wang: "road", lowerOf: ["road"] },
    i: { wang: "ice", lowerOf: ["ice"], solid: true }, // 水の上は歩けない
  },
  wang: {
    road: { img: "aki_wang_road", size: 32, lookup: WANG16 },
    ice: { img: "aki_wang_ice", size: 32, lookup: WANG16 },
  },
  backdrop: { img: "aki_fuji", x: 0, y: 16, scale: 2 },
  drawGround(ctx, ox, oy, img) {
    const asphalt = typeof img === "function" && img("road_asphalt");
    if (asphalt) {
      if (!this.pattern) this.pattern = ctx.createPattern(asphalt, "repeat");
      ctx.save();
      ctx.translate(ox, oy);
      ctx.fillStyle = AKI_GRASS;
      ctx.fillRect(0, 17 * T - 4, 16 * T, 2 * T + 8);
      ctx.fillStyle = this.pattern;
      ctx.fillRect(0, 17 * T, 16 * T, 2 * T);
      ctx.restore();
    }
    centerLine(ctx, ox, oy, [[-T, 18 * T], [16 * T, 18 * T]]);
    if (!this.leaves) this.leaves = akiLeaves(LAKE_GRID, "#i", { ".": 22, "=": 8 });
    ctx.drawImage(this.leaves, Math.round(ox), Math.round(oy));
    // 開いたゲート: 支柱だけが道の両わきに立ち、バーは上がっている(道のわきに立てかけてある)
    const gx = GATE_X + ox;
    const y0 = 16.6 * T + oy;
    const y1 = 19.4 * T + oy;
    for (const py of [y0, y1]) {
      ctx.fillStyle = "#8a9099";
      ctx.fillRect(gx - 4, py - 16, 8, 18);
      ctx.fillStyle = "#b8bec6";
      ctx.fillRect(gx - 4, py - 16, 2, 18);
    }
    for (let y = y0 - 52; y < y0 - 12; y += 8) {
      ctx.fillStyle = Math.floor((y - y0) / 8) % 2 ? "#1e1e22" : "#f0c020";
      ctx.fillRect(gx - 3, y, 6, 8);
    }
    ctx.strokeStyle = "#1a1a1e";
    ctx.lineWidth = 1;
    ctx.strokeRect(gx - 3.5, y0 - 52.5, 7, 41);
  },
  spawns: {
    west: { x: 0.9 * T, y: 18 * T, facing: "east" },
    east: { x: 13.3 * T, y: 18 * T, facing: "west" }, // 長門の湖畔の通りから来た所(冬はゲートの先)
    door: { x: 13.1 * T, y: 17 * T, facing: "south" },
  },
  triggers: [
    { id: "toRoad", x: -T, y: 16.5 * T, w: 1.6 * T, h: 3 * T, warp: { map: "akiRoad", spawn: "pass" } },
    { id: "toNagato", x: 14.5 * T, y: 16.5 * T, w: 1.6 * T, h: 3 * T, warp: { map: "kohan", spawn: "east" } },
  ],
  objects: [
    akiAt("houtou", 12 * T, 16.4 * T, { id: "houtou" }),
    { id: "door", x: 13.1 * T, y: 16.4 * T, w: 1, h: 1, headY: 30, range: 40, interact: (api) => api.warp("akiShop", "door") },
    akiAt("pine", 13.6 * T, 9 * T),
    akiAt("pine", 12.2 * T, 8.8 * T),
    akiAt("maple", 14.4 * T, 11 * T),
    akiAt("pine", 0.4 * T, 21 * T),
    akiAt("pine", 3.1 * T, 21.2 * T),
    akiAt("maple", 6.5 * T, 21 * T),
    akiAt("pine", 10.2 * T, 21.1 * T),
    akiAt("pine", 13.8 * T, 21.3 * T),
  ],
};

// ---- 秋のほうとう屋の中(冬の SHOP と同じ作り)。ちゃんの席に湯のみ。文化祭のポスターは貼ったばかり(D222)。説明はしない ----
const NA_SHOP = Object.assign({}, SHOP, {
  bgm: "silence",
  triggers: [{ id: "out", x: 2 * T, y: 9.4 * T, w: 3 * T, h: T, warp: { map: "akiLake", spawn: "door" } }],
  objects: SHOP.objects
    .filter((o) => !["chair", "chair_lure", "radio", "poster"].includes(o.id))
    .concat([
      at("poster", 13.2 * T, 1.75 * T, { id: "poster", img: "aki_poster", range: 40, interact: (api) => api.show("aki_v_poster") }),
      Object.assign(at("radio", TANSU_FOOT[0] + 6, TANSU_FOOT[1] - 38), { id: "radio", sortDy: 60, iy: 49 }),
      at("zabuton", 7.6 * T, 4.5 * T, { id: "chair", sortDy: -20 }),
      // ちゃんの席の前、ちゃぶ台の上の湯のみ
      {
        id: "yunomi",
        x: 7.6 * T + 25,
        y: 6.3 * T - 30,
        w: 1,
        h: 1,
        sortDy: 40,
        draw(ctx, sx, sy) {
          const x = Math.round(sx - 3);
          const y = Math.round(sy - 7);
          ctx.fillStyle = "#3a2c22";
          ctx.fillRect(x - 1, y - 1, 8, 9);
          ctx.fillStyle = "#c8bca2";
          ctx.fillRect(x, y, 6, 7);
          ctx.fillStyle = "#a89a80";
          ctx.fillRect(x + 4, y + 1, 2, 6);
          ctx.fillStyle = "#4e7a5a"; // 中のお茶
          ctx.fillRect(x + 1, y, 4, 1);
        },
      },
    ]),
});

// 長門の湖畔の通りの東のはし: 絵葉書を買ったあとだけ、秋の湖畔へ続く(D674)
NG_KOHAN.spawns.east = { x: 48.3 * T, y: 12.6 * T, facing: "west" };
NG_KOHAN.triggers.push({ id: "toAki", x: 49.2 * T, y: 10.5 * T, w: 1.6 * T, h: 5 * T, enabled: (api) => api.flag("bought"), warp: { map: "akiLake", spawn: "east" } });

// 東のはしの霧と、暴走する野犬の車たち、追いかけるパトカー(D677)。
// 絵葉書を買って店を出ると、呪いの野犬の 5 台が通りを東へ蛇行しながら暴走し、少しおくれてサイレンを鳴らしたパトカーが追う。
// みんな霧に消えると、霧が晴れて東のはしから秋の湖畔へ行ける(toAki は akiOpen を見る)。説明の言葉は出さない
const AKI_FOG_X = 46.2 * T; // 霧のかかりはじめ
const AKI_ROAD_Y = 13.6 * T; // 車道のまん中(足もと)
// 野犬の 5 台(呪いの野犬の東向きの絵)。lane: 車道のまん中からのずれ、v: 速さ(px/秒)、d: 出る遅れ(秒)、sw: 蛇行の幅
const AKI_GANG = [
  { img: "ponpon_e", lane: -10, v: 330, d: 0.0, sw: 9, f: 2.1 },
  { img: "tori_e", lane: 12, v: 360, d: 0.35, sw: 11, f: 2.7 },
  { img: "akabeko_e", lane: -4, v: 345, d: 0.75, sw: 13, f: 3.3 },
  { img: "kokeshi_e", lane: 14, v: 375, d: 1.0, sw: 8, f: 2.4 },
  { img: "aki_tansu", lane: 2, v: 310, d: 1.4, sw: 6, f: 1.7 }, // 車箪笥は真横の絵(呪いの野犬のレースの rcs_tansu を半分に。作者「車箪笥横向きじゃない」)
];
const AKI_COP = { img: "aki_police", lane: 10, v: 400, d: 3.0, sw: 3, f: 1.2, foot: 72 }; // パトカー(作者が選んだ真横の案。絵の 128 × 96 のうち、車は下から 24 ドット上まで)
const akiCar = { on: false, t0: 0, x0: 0, clearT: -1, sirenT: 0 };
// 車の今の位置(足もと)。出る前は null、霧を抜けたら null
const akiCarAt = (c, t) => {
  const e = t - akiCar.t0 - c.d;
  if (e < 0) return null;
  const x = akiCar.x0 + c.v * e;
  if (x > AKI_FOG_X + 3.4 * T) return null;
  return { x, y: AKI_ROAD_Y + c.lane + Math.sin(e * c.f * 2.2 + c.d * 3) * c.sw, e };
};
function akiFog() {
  return {
    id: "aki_fog",
    x: 48 * T,
    y: 16 * T,
    w: 1,
    h: 1,
    update(dt, t, api) {
      if (api.flag("akiOpen")) {
        if (akiCar.clearT < 0) akiCar.clearT = t;
      } else akiCar.clearT = -1;
      // 絵葉書を買って、店から通りへ出てきたら、少しおいて暴走が来る(遠くのエンジン音から)
      if (api.flag("bought") && !akiCar.on && !api.flag("akiCar")) {
        api.setFlag("akiCar");
        const px = api.player().x;
        Object.assign(akiCar, { on: true, x0: px - 11 * T, t0: t + 1.0, sirenT: 0, hornT: 0 });
        api.later(400, () => api.sfx("rev"));
        // 引きのカメラ(作者「湖畔の背景、建物がよく描けているので、引きでみせたいね」): 通り全体へ引いて、暴走を追って東へ流れ、霧が晴れるまで見せる
        const end = AKI_COP.d + (AKI_FOG_X + 2.4 * T - (px - 11 * T)) / AKI_COP.v + 1.0;
        api.camPath([
          { t: 0, x: px, y: 11.5 * T, z: 1 },
          { t: 1.4, x: Math.min(px + 4 * T, 35 * T), y: 9 * T, z: 0.5 },
          { t: end, x: 35 * T, y: 9 * T, z: 0.5 },
          { t: end + 3.0, x: 35 * T, y: 9 * T, z: 0.5 },
        ]);
      }
      if (!akiCar.on || t < akiCar.t0) return;
      // 空ぶかしとクラクション
      if (t - (akiCar.hornT || 0) > 0.7 && t < akiCar.t0 + 3) {
        akiCar.hornT = t;
        api.sfx(Math.random() < 0.5 ? "rev" : "horn");
      }
      // パトカーのサイレン(霧に入るまで)
      const cop = akiCarAt(AKI_COP, t);
      if (cop && cop.x < AKI_FOG_X + T && t - akiCar.sirenT > 0.9) {
        akiCar.sirenT = t;
        api.sfx("siren");
      }
      // 走る車にぶつかると、はじかれる
      const pl = api.player();
      for (const c of [...AKI_GANG, AKI_COP]) {
        const q = akiCarAt(c, t);
        if (!q) continue;
        const dx = pl.x - q.x;
        const dy = pl.y - q.y;
        if (Math.abs(dx) < 40 && Math.abs(dy) < 14 && (!akiCar.hitT || t - akiCar.hitT > 0.6)) {
          akiCar.hitT = t;
          api.knock(0, dy < 0 ? -260 : 260);
          api.sfx("pop");
        }
      }
      // パトカーが霧に消えたら、霧が晴れる
      if (t - akiCar.t0 - AKI_COP.d > (AKI_FOG_X + 2.4 * T - akiCar.x0) / AKI_COP.v && !api.flag("akiOpen")) {
        api.setFlag("akiOpen");
        akiCar.on = false;
      }
    },
    draw() {},
    drawOver(ctx, sx, sy, t, api) {
      const ox = sx - this.x;
      const oy = sy - this.y;
      if (akiCar.on && t >= akiCar.t0) {
        // 足もとの y の順に描く(手前の車があと)
        const cars = [...AKI_GANG, AKI_COP].map((c) => ({ c, q: akiCarAt(c, t) })).filter((o) => o.q).sort((a, b) => a.q.y - b.q.y);
        for (const { c, q } of cars) {
          const im = api.image(c.img);
          if (!im) continue;
          const fade = Math.max(0, Math.min(1, (q.x - AKI_FOG_X) / (2.2 * T)));
          const bx = Math.round(q.x + ox - im.width / 2);
          const by = Math.round(q.y + oy - (c.foot || im.height) + (Math.floor(t * 18 + c.d * 7) % 2)); // がたがた
          ctx.save();
          ctx.globalAlpha = 1 - fade;
          // 砂ぼこり(うしろへ流れて消える)
          for (let k = 0; k < 4; k++) {
            const u = (t * 2.2 + k * 0.25 + c.d) % 1;
            ctx.fillStyle = `rgba(186, 172, 150, ${0.45 * (1 - u)})`;
            ctx.beginPath();
            ctx.ellipse(bx - 6 - u * 34, q.y + oy - 4 - u * 6, 5 + u * 9, 3 + u * 4, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          // 排気の火(野犬だけ。ぱっぱっと出る)
          if (c !== AKI_COP && Math.floor(t * 9 + c.d * 5) % 3 !== 0) {
            const fy = by + Math.round((c.foot || im.height) * 0.62);
            const L = 8 + Math.floor((t * 23 + c.d * 11) % 7);
            ctx.fillStyle = "#ff9a2a";
            ctx.beginPath();
            ctx.moveTo(bx + 2, fy - 4);
            ctx.lineTo(bx - L, fy);
            ctx.lineTo(bx + 2, fy + 4);
            ctx.fill();
            ctx.fillStyle = "#ffe27a";
            ctx.fillRect(bx - Math.floor(L / 2), fy - 1, Math.floor(L / 2) + 2, 2);
          }
          ctx.drawImage(im, bx, by);
          // パトカーの赤い灯(回る)
          if (c === AKI_COP) {
            const on = Math.floor(t * 8) % 2 === 0;
            ctx.fillStyle = on ? "rgba(255, 40, 40, 0.95)" : "rgba(150, 20, 20, 0.9)";
            const lx = bx + 60;
            ctx.fillRect(lx - 6, by + 31, 12, 4);
            if (on) {
              ctx.fillStyle = "rgba(255, 60, 60, 0.25)";
              ctx.beginPath();
              ctx.arc(lx, by + 33, 14, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }
      // 霧: 東のはしに、白っぽいかたまりがゆっくり流れる。晴れるときは 2.5 秒で薄れて消える
      let a = 1;
      if (api.flag("akiOpen")) a = akiCar.clearT < 0 ? 0 : Math.max(0, 1 - (t - akiCar.clearT) / 2.5);
      if (a <= 0) return;
      const g = ctx.createLinearGradient(AKI_FOG_X + ox, 0, AKI_FOG_X + 2.4 * T + ox, 0);
      g.addColorStop(0, "rgba(226, 228, 230, 0)");
      g.addColorStop(1, `rgba(226, 228, 230, ${0.96 * a})`);
      ctx.fillStyle = g;
      ctx.fillRect(AKI_FOG_X + ox, 8.5 * T + oy, 4.6 * T, 9 * T);
      for (let i = 0; i < 9; i++) {
        const px = AKI_FOG_X + ((i * 53 + t * 9) % (3.6 * T)) + 0.4 * T;
        const py = 9.5 * T + ((i * 37) % (6.5 * T));
        const r = 18 + (i % 3) * 8;
        ctx.fillStyle = `rgba(236, 238, 240, ${0.45 * a * Math.min(1, (px - AKI_FOG_X) / (1.2 * T))})`;
        ctx.beginPath();
        ctx.ellipse(px + ox, py + oy, r * 1.6, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}
NG_KOHAN.objects.push(akiFog());
NG_KOHAN.triggers.find((tr) => tr.id === "toAki").enabled = (api) => api.flag("akiOpen");
