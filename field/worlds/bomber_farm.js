// 断片: ぼぎボマーと地上ぼぎクルー(ハンガーの中の畑)。bomber.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";

// ---- ハンガーの中の畑(D408、D409)。飛行場の北の掩体壕の口から入る。13 × 16 マス(絵は 416 × 496)。下絵は docs/assets/bomber/plan/farm.py ----
// 背景は PixelLab の絵をそのまま(作者「２でいい。」。奥ほど少しせまく描かれているので、うねの位置は絵に合わせて斜めにとる)
// 爆弾を野菜のように育てている。うね 5 本に、爆弾が頭を下にして植わり、尾翼が土から出ている。ところどころに大根とかぼちゃ。
// きーは植わっているものを引きぬける(掲げる)。世話は運び手のぼぎだぢ。ぬいたあとは、近くのぼぎがすぐ植えなおす(畑はへらない)
const BF_RY = [210, 410]; // うねの上はしと下はしの y(絵の上)
const BF_RX = [
  [78, 55],
  [147, 130],
  [212, 212],
  [281, 290],
  [350, 365],
]; // うねのまん中の x(上はし、下はし)
const bfRidgeX = (k, y) => BF_RX[k][0] + ((BF_RX[k][1] - BF_RX[k][0]) * (y - BF_RY[0])) / (BF_RY[1] - BF_RY[0]);
const bfWallX = (y) => {
  const u = Math.max(0, Math.min(1, (y - 200) / 245));
  return [32 - 28 * u, 388 + 24 * u]; // 左右の壁の内がわ
};
// 通り道のまん中の x(0 = 左の壁と 1 本目のあいだ … 5 = 5 本目と右の壁のあいだ)
const bfPathX = (q, y) => (q === 0 ? (bfWallX(y)[0] + bfRidgeX(0, y)) / 2 : q === 5 ? (bfRidgeX(4, y) + bfWallX(y)[1]) / 2 : (bfRidgeX(q - 1, y) + bfRidgeX(q, y)) / 2);
const BF_KINDS = { s: "bomb_s", m: "bomb_m", w: "bomb_w", l: "bomb_l", daikon: "daikon", kabocha: "kabocha" };
// pulled: ぬかれて、まだ植えなおされていないもの(植わっているものの番号)。carry: きーが頭にのせて運んでいるもの。
// thrown: きーが放り投げたもの({ n, x0, y0, x1, y1, t0, by })。by は拾いに来た世話係(拾ったあとは、その頭の上)
// boom: 投げた爆弾が大爆発した({ t0, leaving })。真っ白になって、ゲームオーバー(D415)
const bfS = { pulled: [], carry: null, thrown: null, boom: null };
const bfReset = () => {
  Object.assign(bfS, { pulled: [], carry: null, thrown: null, boom: null, lifting: false });
  for (const o of BF_CARE) Object.assign(o, { task: null, x: o.home[0], y: o.home[1] });
};
const BF_FLY = 0.5; // 投げてから落ちるまで(秒)
const BF_BOOM_P = 0.1; // 投げた爆弾が、落ちたところで大爆発する見こみ(毎回 10% のくじ。野菜は爆発しない D415)
const BF_WHITE = [1.4, 1.9]; // 落ちてから、画面全体が白くなりはじめ、真っ白になるまで(秒)
// 真っ白になったら、白だけが 2 秒 → 「ゲームオーバー」が 3 秒かけて白の中から浮かぶ → 1 秒おいて、セーブを消してタイトルへ(D421)
const BF_OVER = [3.9, 6.9]; // 落ちてから、字が浮かびはじめ、出きるまで(秒)
const BF_TITLE = 7.9; // 落ちてから、タイトルへ戻るまで(秒)
// 大爆発のつくり(D416): 爆心地で閃光 → 火の玉がゆらぎながらふくらむ → 土と煙とかけらが飛ぶ。
// まわりに植わっている爆弾が、爆心地から近い順に誘爆する。最後に画面全体が白に飛ぶ
const bfRand = (k) => {
  const v = Math.sin(k * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
// 背景の絵(bg_hatake)の明るさ(0〜1)を読む関数を、一度だけ作る(α と Ω のペンキを壁の凹凸に沿わせる D417)
let bfLum = null;
const bfWallLum = (api) => {
  if (bfLum) return bfLum;
  const im = api.image("bg_hatake");
  if (!im || !im.width) return null;
  const c = document.createElement("canvas");
  c.width = im.width;
  c.height = im.height;
  const g = c.getContext("2d");
  g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  bfLum = (x, y) => {
    if (x < 0 || y < 0 || x >= c.width || y >= c.height) return 0.5;
    const k = (y * c.width + x) * 4;
    return (d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11) / 255;
  };
  return bfLum;
};
const bfChain = (x, y) => {
  const near = BF_PLANTS.map((q, n) => ({ n, x: q.x, y: q.y, d: Math.hypot(q.x - x, q.y - y), kind: q.kind }))
    .filter((q) => ["s", "m", "w", "l"].includes(q.kind) && !bfS.pulled.includes(q.n))
    .sort((a, b) => a.d - b.d);
  // ハンガーじゅうの爆弾が、爆心地から近い順に、次々と誘爆する(D420「もっともっとめちゃくちゃに」)。
  // 一つの爆弾が二度三度はじけ、そのあいだにも、あちこちで大きな火の玉が上がる
  // 火の玉はハンガーより大きく、壁も天井もこえて、画面の外まで広がる(D420「ハンガーの中だけでこじんまりしない」)
  const c = [{ x, y, t: 0, R: 96, seed: 1 }];
  near.forEach((q, i) => {
    const t = 0.1 + q.d / 330 + bfRand(i + 3) * 0.12;
    c.push({ n: q.n, x: q.x, y: q.y - 6, t, R: 44 + bfRand(i + 7) * 40, seed: i + 2 });
    c.push({ x: q.x + (bfRand(i + 11) - 0.5) * 50, y: q.y - 24 - bfRand(i + 13) * 40, t: t + 0.12 + bfRand(i + 17) * 0.15, R: 34 + bfRand(i + 19) * 34, seed: i + 50 });
  });
  for (let k = 0; k < 22; k++) {
    c.push({ x: -80 + bfRand(k * 3 + 101) * 576, y: 40 + bfRand(k * 5 + 103) * 460, t: 0.3 + bfRand(k * 7 + 107) * 1.0, R: 70 + bfRand(k + 109) * 70, seed: k + 100 });
  }
  return c.sort((a, b) => a.t - b.t);
};
// 一つの火の玉(2 ドットのます目で描く)。u は火の玉ができてからの秒
const bfFireball = (ctx, X, Y, R0, u, seed) => {
  if (u < 0 || u > 1.6) return;
  const G = R0 > 90 ? 5 : R0 > 60 ? 4 : R0 > 34 ? 3 : 2;
  // 閃光: はじめの一瞬、小さく強く光る
  if (u < 0.09) {
    ctx.fillStyle = "#ffffff";
    const r = 3 + (u / 0.09) * Math.min(R0 * 0.15, 9); // 小さく(大きな白い丸にしない)
    for (let dy = -r; dy <= r; dy += G) for (let dx = -r; dx <= r; dx += G) if (dx * dx + dy * dy < r * r) ctx.fillRect(Math.round(X + dx), Math.round(Y + dy), G, G);
    return;
  }
  const grow = Math.min(1, (u - 0.09) / 0.35);
  const R = R0 * (0.35 + 0.65 * (1 - (1 - grow) * (1 - grow)));
  const cool = Math.max(0, Math.min(1, (u - 0.5) / 0.7)); // 燃えつきて、煙に変わる
  const rise = cool * R0 * 0.6; // 煙は上へ
  // もこもこした玉をいくつか重ねて、カリフラワーのような形に(きれいな丸にしない)
  const puffs = [[0, 0, 0.62]];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + bfRand(seed * 5 + k) * 0.8;
    const d = 0.38 + bfRand(seed * 9 + k) * 0.22;
    puffs.push([Math.cos(a) * d, Math.sin(a) * d * 0.85 - 0.08, 0.3 + bfRand(seed * 3 + k) * 0.18]);
  }
  const hot = ["#fffbe0", "#ffd84a", "#ff8a1e", "#b8321a"];
  const smoke = ["#d8b890", "#9a7a62", "#6a5a52", "#3e3632"];
  // 色ごとに、ます目をまとめて一度に塗る(色を 1 ドットごとに変えると重い)
  const paths = [0, 0, 0, 0, 0, 0, 0, 0].map(() => new Path2D());
  const pr = puffs.map(([px, py, r]) => [px * R, py * R, r * R]);
  const wob = 1 + 0.06 * Math.sin(u * 13);
  const lim = R * 1.2;
  for (let dy = -lim; dy <= lim; dy += G) {
    for (let dx = -lim; dx <= lim; dx += G) {
      let f = 9;
      for (const [px, py, r] of pr) {
        const ex = dx - px, ey = dy - py;
        const q = (ex * ex + ey * ey) / (r * r * wob * wob);
        if (q < f) f = q;
      }
      if (f > 1) continue;
      f = Math.sqrt(f);
      // 中ほど熱く、ふちほど暗い。燃えつきると煙の色へ
      const g = Math.min(0.99, Math.sqrt(dx * dx + dy * dy) / (R * 1.05)) * 0.6 + f * 0.4 + (bfRand(dx * 13 + dy * 7 + seed) - 0.5) * 0.14;
      const k = (bfRand(dx * 3 + dy * 11 + seed) < cool ? 4 : 0) + (g < 0.32 ? 0 : g < 0.55 ? 1 : g < 0.8 ? 2 : 3);
      paths[k].rect(Math.round(X + dx), Math.round(Y + dy - rise), G, G);
    }
  }
  paths.forEach((pa, k) => {
    ctx.fillStyle = k < 4 ? hot[k] : smoke[k - 4];
    ctx.fill(pa);
  });
  // 土とかけら: 四方へ飛んで、落ちる
  for (let k = 0; k < 18; k++) {
    const a = bfRand(seed * 31 + k) * Math.PI * 2, v = R0 * (1.2 + bfRand(seed * 17 + k) * 1.6);
    const s = Math.min(u, 1.1);
    const px = X + Math.cos(a) * v * s, py = Y + Math.sin(a) * v * s * 0.7 - (s * 90 - s * s * 80) * (0.5 + bfRand(k + seed));
    ctx.fillStyle = k % 3 ? "#3a2c22" : "#55504a";
    ctx.fillRect(Math.round(px), Math.round(py), k % 4 ? 2 : 3, 2);
  }
};
const BF_PLANTS = [];
BF_RX.forEach((_, i) => {
  for (let k = 0; k < 8; k++) {
    const kind = (i * 7 + k * 3) % 11 === 2 ? "daikon" : (i * 5 + k * 2) % 13 === 4 ? "kabocha" : ["s", "m", "w", "l"][(i + k) % 4];
    const y = 230 + k * 24;
    BF_PLANTS.push({ x: bfRidgeX(i, y), y, kind });
  }
});
// いちばん近い通り道の上の、植わっているものの横
const bfBeside = (p) => {
  let best = 0;
  for (let q = 1; q < 6; q++) if (Math.abs(bfPathX(q, p.y) - p.x) < Math.abs(bfPathX(best, p.y) - p.x)) best = q;
  return [bfPathX(best, p.y), p.y + 12]; // きーと重ならないよう、少し手前に立つ
};
const BF_CARE = [
  ["crew_hawk", 1, 260],
  ["crew_wagtail", 3, 330],
  ["crew_rooster", 4, 250],
  ["crew_wagtail", 2, 390],
].map(([img, q, y], j) => ({
  id: `care${j}`,
  x: bfPathX(q, y),
  y,
  w: 1,
  h: 1,
  img,
  q,
  home: [bfPathX(q, y), y],
  task: null, // 投げられたものの始末(D414): fetch 拾いに行く → hit きーを殴りに行く → replant 元の穴に植えなおす
  t0: 0,
  update(dt, t, api) {
    const go = (to, spd) => {
      const dx = to[0] - this.x, dy = to[1] - this.y, d = Math.hypot(dx, dy);
      this.moving = d > 2;
      if (this.moving) {
        this.west = dx < 0;
        this.x += (dx / d) * Math.min(d, spd * dt);
        this.y += (dy / d) * Math.min(d, spd * dt);
      }
      return !this.moving;
    };
    // きーが放り投げたものが落ちたら、いちばん近い者が、すぐ拾いに駆けつける
    const th = bfS.thrown;
    if (bfS.boom) return; // 大爆発のあとは、だれも駆けつけない(D415)
    if (!this.task && th && !th.by && bNow() - th.t0 > BF_FLY) {
      const near = BF_CARE.filter((o) => !o.task).sort((a, b) => Math.hypot(a.x - th.x1, a.y - th.y1) - Math.hypot(b.x - th.x1, b.y - th.y1))[0];
      if (near === this) {
        th.by = this;
        this.task = { kind: "fetch", n: th.n };
        this.t0 = 0;
      }
    }
    if (this.task) {
      const tk = this.task;
      if (tk.kind === "fetch") {
        if (go([th.x1, th.y1 + 4], 170)) {
          tk.kind = "hit"; // 拾った。頭にのせて、きーを殴りに行く
          th.held = true;
        }
      } else if (tk.kind === "hit") {
        const p = api.player();
        const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy) || 1;
        if (d > 18) go([p.x, p.y], 170);
        else {
          // 殴る。きーは大きくはじき飛ばされる(ほかの罰はない)
          this.moving = false;
          this.west = dx < 0;
          api.knock((dx / d) * 700, (dy / d) * 700); // 大きくはじき飛ばす(3 マスほど。D420。「ポカ」の吹き出しは出さない)
          api.sfx("knock");
          tk.kind = "replant";
          this.t0 = -0.4; // 殴ったあと、少し間をおく
        }
      } else if (tk.kind === "replant") {
        this.t0 += dt;
        if (this.t0 > 0 && go(bfBeside(BF_PLANTS[tk.n]), 120)) {
          this.west = BF_PLANTS[tk.n].x < this.x;
          if (this.t0 > 1.4) {
            // 元の穴に植えなおした
            bfS.pulled = bfS.pulled.filter((n) => n !== tk.n);
            if (bfS.thrown && bfS.thrown.n === tk.n) bfS.thrown = null;
            this.task = null;
          }
        }
      }
      return;
    }
    // ふだんは、持ち場の通り道を、ゆっくり行ったり来たりして世話をする(水やり、草ぬき)
    const u = (t * 0.12 + this.home[1] * 0.01) % 2;
    const ty = this.home[1] + Math.sin(u * Math.PI) * 1.2 * T;
    this.moving = Math.abs(ty - this.y) > 0.5;
    this.x += (bfPathX(this.q, this.y) - this.x) * Math.min(1, dt * 3);
    this.y += (ty - this.y) * Math.min(1, dt * 3);
  },
  draw(ctx, sx, sy, t, api) {
    const im = api.image(this.img);
    if (!im) return;
    const working = this.task ? !this.moving : !this.moving || Math.floor(t * 0.5 + j) % 3 === 0;
    const hop = this.moving && this.task ? (Math.floor(t * 9 + j) % 2 ? 2 : 0) : working ? [0, 1, 2, 1][Math.floor(t * 14 + j * 1.7) % 4] : 0; // 修理と同じ、ぴょこぴょこ
    ctx.save();
    ctx.translate(Math.round(sx), Math.round(sy - hop));
    if (this.west) ctx.scale(-1, 1);
    ctx.drawImage(im, -Math.round(im.width / 2), -im.height);
    ctx.restore();
    // 拾ったものは、頭にのせて運ぶ(植えなおすまで)
    if (this.task && this.task.kind !== "fetch") {
      const it = api.image(BF_KINDS[BF_PLANTS[this.task.n].kind]);
      if (it) ctx.drawImage(it, Math.round(sx - it.width / 2), Math.round(sy - hop - im.height - it.height + 4));
    }
    // 水やり: 手もとから、しずくが 3 つ
    if (working && !this.task && j % 2 === 0) {
      ctx.fillStyle = "rgba(150, 200, 255, 0.85)";
      for (let k = 0; k < 3; k++) {
        const f = (t * 1.6 + k / 3) % 1;
        ctx.fillRect(Math.round(sx + (this.west ? -12 : 12) + (k - 1) * 2), Math.round(sy - 14 + f * 12), 1, 2);
      }
    }
  },
}));
const BF_MAP = {
  tile: T,
  bg: "#2e2a26",
  map: kGrid(13, 16, (c, r) => r < 6 || c < 1 || c > 11 || (r > 14 && (c < 5 || c > 7))),
  legend: K_LEGEND,
  drawGround: kImage("bg_hatake", 416, 496),
  spawns: {
    door: { x: 208, y: 14.3 * T, facing: "north" },
  },
  onEnter() {
    bfReset();
  },
  // 大爆発のあとは、操作を止める。ボタンは受けつけず、そのままタイトルへ(D421。D415 の「A で畑の入り口から」は替えた)
  get lockInput() {
    return !!bfS.boom;
  },
  onLockedPress() {},
  drawOverlay(ctx, ox, oy, t, api) {
    // 天井から下がる裸電球。通り道の上に、4 つ(奥の壁の 2 つは壁といっしょに描く)
    for (const y of [270, 360]) {
      for (const q of [1, 4]) {
        const X = Math.round(ox + bfPathX(q, y)), Y = Math.round(oy + y);
        const g = ctx.createRadialGradient(X, Y + 2 * T, 4, X, Y + 2 * T, 3 * T);
        g.addColorStop(0, "rgba(255, 220, 140, 0.16)");
        g.addColorStop(1, "rgba(255, 220, 140, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(X - 3 * T, Y - T, 6 * T, 6 * T);
        ctx.fillStyle = "#28241f";
        ctx.fillRect(X, Y - 18, 1, 18);
        ctx.fillStyle = "#fff0b0";
        ctx.fillRect(X - 3, Y, 6, 6);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(X - 1, Y + 1, 2, 2);
      }
    }
    // 大爆発: 落ちたところから白い光がひろがって、画面が真っ白になる。白の中に「ゲームオーバー」(D415)
    const b = bfS.boom;
    if (b) {
      const u = bNow() - b.t0;
      // 誘爆のたびに、音とゆれ(D416)
      while (b.hit < b.chain.length && u >= b.chain[b.hit].t) {
        if (b.hit > 0 && window.bogiAudio && b.hit % 2 === 0) window.bogiAudio.sfx(b.hit % 6 ? "knock" : "boom");
        if (b.chain[b.hit].R > 80 && api) api.shake(0.6, 16); // 大きな火の玉のたびに、画面ごと暴れる
        b.hit++;
      }
      for (const c of b.chain) bfFireball(ctx, ox + c.x, oy + c.y, c.R, u - c.t, c.seed);
      const W = ctx.canvas.width, H = ctx.canvas.height;
      // 画面全体が白に飛ぶ(丸くひろげない)。はじめは明滅しながら、だんだん白く
      const w = Math.max(0, Math.min(1, (u - BF_WHITE[0]) / (BF_WHITE[1] - BF_WHITE[0])));
      // 閃光の瞬間と、大きな火の玉が上がるたびに、画面が一度白む
      let flick = u < 0.12 ? 0.6 : 0;
      for (const c of b.chain) if (c.R > 80 && u - c.t >= 0 && u - c.t < 0.07) flick = Math.max(flick, 0.45);
      const al = Math.min(1, Math.max(flick, w * (0.85 + 0.15 * Math.sin(u * 40))));
      if (al > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = `rgba(255, 255, 255, ${w >= 1 ? 1 : al})`;
        ctx.fillRect(0, 0, W, H);
        const P = window.bogiPix;
        if (P && u > BF_OVER[0]) {
          // 白の中から、じわじわ浮かぶ
          const S = Math.max(2, Math.round(W / 320));
          const text = "ゲームオーバー";
          ctx.globalAlpha = Math.min(1, (u - BF_OVER[0]) / (BF_OVER[1] - BF_OVER[0]));
          P.text(ctx, text, Math.round((W - P.width(text) * S) / 2), Math.round(H / 2 - 8 * S), S, "#28241f");
          ctx.globalAlpha = 1;
        }
        // 真っ白のあいだは、音楽も止めて静かに
        if (!b.quiet && window.bogiAudio) {
          b.quiet = true;
          window.bogiAudio.bgm("silence");
        }
        // ペナルティ: セーブを全部消して、タイトルへ(作者「セーブも消そう」「ペナルティをあたえたい」)
        if (u > BF_TITLE && !b.leaving) {
          b.leaving = true;
          if (window.bogiGameOver) window.bogiGameOver();
        }
        ctx.restore();
      }
    }
  },
  triggers: [
    // 持ったままは外へ出られない。そっとはじき返す(D414)
    { id: "bfKeep", x: 150, y: 14.75 * T, w: 115, h: 0.5 * T, enabled: () => bfS.carry !== null, run: (api) => api.knock(0, -200) },
    { id: "toKichi", x: 150, y: 15.0 * T, w: 115, h: 0.6 * T, enabled: () => bfS.carry === null, warp: { map: "kichi", spawn: "farm" } },
  ],
  objects: [
    {
      // 奥の壁の掛け時計(D409)。針がぐるぐる速く回る。時間の進みかたが速い
      id: "clock",
      x: 208,
      y: 6 * T,
      w: 1,
      h: 1,
      draw(ctx, sx, sy, t, api) {
        const cx = Math.round(sx), cy = Math.round(sy - 74), r = 23; // 奥の壁のまん中の柱に
        ctx.fillStyle = "#28241f";
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5a4632";
        ctx.beginPath();
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e8e2cc";
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#28241f";
        for (let k = 0; k < 12; k++) {
          const a = (k * Math.PI) / 6;
          ctx.fillRect(Math.round(cx + Math.sin(a) * (r - 4)) - (k % 3 ? 0 : 1), Math.round(cy - Math.cos(a) * (r - 4)) - (k % 3 ? 0 : 1), k % 3 ? 1 : 2, k % 3 ? 1 : 2);
        }
        const m = t * Math.PI * 2; // 長針は 1 秒で 1 回り
        const h = m / 3; // 短針は 3 秒で 1 回り
        ctx.lineCap = "round";
        ctx.strokeStyle = "#28241f";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.sin(h) * r * 0.45, cy - Math.cos(h) * r * 0.45);
        ctx.stroke();
        ctx.strokeStyle = "#962820";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.sin(m) * r * 0.8, cy - Math.cos(m) * r * 0.8);
        ctx.stroke();
        ctx.fillStyle = "#28241f";
        ctx.fillRect(cx - 1, cy - 1, 3, 3);
        // 時計をはさんで、左にアルファ、右にオメガ(はじまりと、おわり。D417)。壁にペンキで手描きした字:
        // 影はつけず、筆のはばがところどころ太く、はげて、下へたれている
        const BF_GLYPH = {
          a: ["...###....#", "..#...#..#.", ".#.....##..", ".#.....#...", ".#.....##..", "..#...#..#.", "...###....#"],
          o: ["...#####...", "..#.....#..", ".#.......#.", ".#.......#.", "..#.....#..", "...#...#...", ".###...###."],
        };
        // 壁の凹凸に沿わせる: 背景の明るさを、ペンキの下で 1 ドットずつ読む。
        // 出っぱり(明るい)ではペンキも明るく、くぼみ(暗い)では暗く、溝や柱のふちの黒い線には入らない
        const lum = bfWallLum(api);
        const ix = sx - 208, iy = sy - 6 * T; // 画面の座標 → 背景の絵の座標
        for (const [g, gx, sd] of [["a", -52, 3], ["o", 52, 11]]) {
          const rows = BF_GLYPH[g], G = 2;
          const x0 = Math.round(cx + gx - (rows[0].length * G) / 2), y0 = Math.round(cy - (rows.length * G) / 2);
          const dots = new Map(); // "x,y" → 濃さ
          const put = (x, y, w, h, a) => {
            for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) dots.set(`${xx},${yy}`, Math.max(a, dots.get(`${xx},${yy}`) || 0));
          };
          rows.forEach((r, j) =>
            [...r].forEach((c, i) => {
              if (c !== "#") return;
              const h = bfRand(sd * 37 + i * 7 + j * 13);
              // 筆のはばは 3 ドット(となりと重なる)。はげたところは消さずに、うすくなる
              put(x0 + i * G, y0 + j * G, 3, 3, h < 0.18 ? 0.45 : 0.85);
              if (h > 0.8) put(x0 + i * G - 1, y0 + j * G + 1, 1, 2, 0.85); // 筆のむら
              if (j === rows.length - 1 && h > 0.5) put(x0 + i * G + 1, y0 + (j + 1) * G + 1, 1, 2 + Math.round(h * 6), 0.7); // たれ
            })
          );
          for (const [k, al] of dots) {
            const [x, y] = k.split(",").map(Number);
            const L = lum ? lum(Math.round(x - ix), Math.round(y - iy)) : 0.5;
            if (L < 0.16) continue; // 溝や柱のふちの黒い線
            const sh = Math.min(1.08, 0.5 + L * 1.1);
            ctx.fillStyle = `rgba(${Math.round(226 * sh)}, ${Math.round(214 * sh)}, ${Math.round(188 * sh)}, ${al})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
        // 奥の壁の裸電球(時計の左右)
        for (const x of [-100, 100]) {
          const X = Math.round(sx + x), Y = Math.round(sy - 70);
          ctx.fillStyle = "#28241f";
          ctx.fillRect(X, Y - 1.4 * T, 1, 1.4 * T);
          ctx.fillStyle = "#fff0b0";
          ctx.fillRect(X - 3, Y, 6, 6);
        }
      },
    },
    // うね(歩けない)
    ...BF_RX.flatMap((_, k) => [0, 1, 2, 3, 4].map((m) => ({ id: `ridge${k}_${m}`, x: bfRidgeX(k, 230 + m * 40), y: 230 + m * 40, w: 1, h: 1, solid: { w: 28, h: 40 }, sortDy: -40, draw() {} }))),
    // 植わっているもの。A で引きぬいて掲げる
    ...BF_PLANTS.map((p, n) => ({
      id: `plant${n}`,
      x: p.x,
      y: p.y,
      w: 1,
      h: 1,
      range: 44,
      noLook: true,
      hidden: () => bfS.pulled.includes(n) || (bfS.boom && bfS.boom.chain.some((c) => c.n === n && bNow() - bfS.boom.t0 > c.t + 0.05)),
      // 持っている間と、掲げている間は、次のものを引きぬけない(大爆発のあとも)。
      // 掲げている間に A を続けて押すと、となりのものを引きぬいて掲げなおし、テンポが悪かった(作者「テンポわるくなるから直して」)
      canInteract: () => bfS.carry === null && !bfS.lifting && !bfS.boom,
      draw(ctx, sx, sy, t, api) {
        const im = api.image(`plant_${p.kind}`);
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height));
      },
      interact(api) {
        bfS.pulled.push(n);
        bfS.lifting = true;
        api.sfx("spon"); // スポン(作者「スポンと気持ちいい効果音」)
        api.hold(BF_KINDS[p.kind], 1.4, () => {
          bfS.lifting = false;
          bfS.carry = n; // 掲げたあと、頭にのせて運ぶ(木箱と同じ: 少し遅く、跳べない D414)
        });
      },
    })),
    {
      // 持っている間、もう一度 A で、向いている方へ放り投げる(D414)。きーについて歩く、見えない調べ先
      id: "bfThrow",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      range: 400,
      noLook: true,
      canInteract: () => bfS.carry !== null,
      update(dt, t, api) {
        const p = api.player();
        this.x = p.x;
        this.y = p.y;
      },
      draw() {},
      interact(api) {
        const p = api.player();
        const v = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] }[p.facing] || [0, 1];
        const x1 = Math.max(40, Math.min(376, p.x + v[0] * 2.5 * T));
        const y1 = Math.max(215, Math.min(440, p.y + v[1] * 2.5 * T));
        bfS.thrown = { n: bfS.carry, x0: p.x, y0: p.y, x1, y1, t0: bNow(), by: null };
        bfS.carry = null;
        api.sfx("whir");
      },
    },
    {
      // 放り投げたもの: 弧をえがいて飛び、落ちたら拾われるまで地面に置かれている(転がらない、爆発しない)
      id: "bfFly",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      hidden: () => !bfS.thrown || bfS.thrown.held || !!bfS.boom,
      update(dt, t, api) {
        const th = bfS.thrown;
        if (!th) return;
        const u = Math.min(1, (bNow() - th.t0) / BF_FLY);
        // 落ちたとき、爆弾なら 10 回に 1 回、大爆発する(D415。D414 の「爆発しない」を上書き)
        if (u >= 1 && !th.landed) {
          th.landed = true;
          const kind = BF_PLANTS[th.n].kind;
          if (["s", "m", "w", "l"].includes(kind) && Math.random() < BF_BOOM_P) {
            bfS.boom = { t0: bNow(), x: th.x1, y: th.y1, leaving: false, chain: bfChain(th.x1, th.y1), hit: 0 };
            api.sfx("boom");
            api.shake(2.0, 9);
          }
        }
        this.x = th.x0 + (th.x1 - th.x0) * u;
        this.y = th.y0 + (th.y1 - th.y0) * u;
        this.z = Math.sin(u * Math.PI) * 26 + (1 - u) * 22; // 頭の高さから投げて、地面に落ちる
      },
      draw(ctx, sx, sy, t, api) {
        const th = bfS.thrown;
        const it = th && api.image(BF_KINDS[BF_PLANTS[th.n].kind]);
        if (!it) return;
        if (this.z > 1) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
          ctx.beginPath();
          ctx.ellipse(Math.round(sx), Math.round(sy), 7, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.drawImage(it, Math.round(sx - it.width / 2), Math.round(sy - it.height - this.z));
      },
    },
    ...BF_CARE,
  ],
};
