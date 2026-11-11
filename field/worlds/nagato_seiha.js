// 断片: 本栖湖の長門(E 斉射)。nagato.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";

// ======== E 斉射(動く場面 D564)========
// カット 1: 艦首をこちらに向けた長門。水平で主砲は前後 → 主砲が旋回し仰角を上げ、同時に注水で傾く → ブザー →
// 各砲塔の左の砲(4 門)が撃つ → 左の砲が下がり右の砲が上がる(左右交互 作者「同じ砲塔の砲は交互に仰角を取る」)→ 残り 4 門。
// カット 2: 夕焼け空を見上げる。間をおいて 4 発、また 4 発、成層圏の核爆発ほど大げさな爆発。
// 艦のこまは docs/record/2026-11-01/nagato_e/anim/ship.py(背景から切り分け、砲身は手で、傾きは RotSprite で回す)。煙と爆発はここで描く
const NG_E = {
  n1: 56, // 旋回と傾きのこま
  n2: 20, // 左右の砲の入れかえのこま
  x0: 36, // こまを置く x
  fw: 240,
  cols: 8,
  muz: [
    [157.4, 91.2],
    [162.5, 102.1],
    [146.4, 102.4],
    [151.4, 113.3],
  ], // 撃つときの砲口(前の 2 砲塔と、艦橋のうしろの 2 砲塔)
  dir: [0.57, -0.82], // 砲の向き(55 度)
  water: 203, // 水面(映りの折り返し)
  // 秒(カット 1)。ゆっくり動かして重さを出す(作者「もう少し動きをゆっくりしたほうが重厚感が出る」)
  move0: 1.5,
  move: 7.0,
  bell: 9.6,
  fireA: 11.6,
  swap0: 14.2,
  swap: 2.6,
  fireB: 17.8,
  cut: 23.0,
  // 秒(カット 2、切りかえから)
  burst1: 3.5,
  burst2: 8.5,
  boom: 3.0, // 音とゆれは、火球と EMP より遅れて届く(作者「火球とEMPが見えて、音が後から聞こえるようにして」)
  boomGap: 0.45, // 火球 4 つの音は 4 回ずつ(作者「爆発音を4回づつにして」)。光の 0.18 秒おきでは 1 つに溶けるので、音は間をあける
  end: 15.0,
};
const NG_BURST = [
  [
    [150, 72],
    [262, 46],
    [352, 88],
    [420, 40],
  ],
  [
    [196, 40],
    [300, 92],
    [392, 58],
    [100, 50],
  ],
];
const ngE = { t: 0, done: {}, off: null };
const ngRnd = (i) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ngOut = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - (1 - u) * (1 - u));
// ドットの丸(1 ドットずつの横線で塗る)
const ngDisc = (g, cx, cy, r, col) => {
  const R = Math.round(r);
  if (R < 1) return;
  g.fillStyle = col;
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  for (let y = -R; y <= R; y++) {
    const w = Math.floor(Math.sqrt(R * R + R * 0.8 - y * y));
    if (w >= 0) g.fillRect(x0 - w, y0 + y, w * 2 + 1, 1);
  }
};
// 点描の丸(ふちをぼかす。d は 0〜1 の濃さ。市松もようの間引き)
const ngDither = (g, cx, cy, r, col, d) => {
  const R = Math.round(r);
  if (R < 1 || d <= 0) return;
  g.fillStyle = col;
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  const step = d > 0.7 ? 1 : d > 0.4 ? 2 : 4;
  for (let y = -R; y <= R; y++) {
    const w = Math.floor(Math.sqrt(R * R + R * 0.8 - y * y));
    for (let x = -w; x <= w; x++) if ((((x + y) % step) + step) % step === 0 && (step < 4 || (y & 1) === 0)) g.fillRect(x0 + x, y0 + y, 1, 1);
  }
};
// なめらかな乱れ(0〜1)。炎のふちと煙のでこぼこに使う
const ngNoise = (x, y) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi));
  const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi));
  const h = (a, b) => ngRnd(a * 57 + b * 131);
  return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
};
// 砲煙: 黒煙がもうもうと湧く(作者「その後のもうもうとして黒煙」、写真 ref_fire.png)。たくさんの玉が、炎の中から湧いてふくらみ、ゆっくり流れる
const NG_SMOKE = ["#0c0809", "#1a1210", "#2c1f1a", "#4a3328", "#6e4a36"];
// ふちが乱れた塊(行ごとに幅を乱れでゆらし、時間でゆっくり形を変える。作者「黒煙が丸いのでもっとランダムな形状に」)
const ngBlob = (g, cx, cy, r, col, seed, tm) => {
  const R = Math.round(r);
  if (R < 1) return;
  g.fillStyle = col;
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  for (let y = -R; y <= R; y++) {
    const base = Math.sqrt(Math.max(0, R * R - y * y));
    const nl = ngNoise((y + seed) / 5.5, seed * 0.37 + tm * 0.6);
    const nr = ngNoise((y + seed) / 5.5 + 40, seed * 0.37 + tm * 0.6 + 9);
    const wl = Math.floor(base * (0.55 + 0.75 * nl));
    const wr = Math.floor(base * (0.55 + 0.75 * nr));
    if (wl + wr > 0) g.fillRect(x0 - wl, y0 + y, wl + wr + 1, 1);
  }
};
const ngSmoke = (g, mx, my, age, seed) => {
  if (age < 0.06) return;
  const a0 = age - 0.06;
  const balls = [];
  for (let k = 0; k < 34; k++) {
    const tb = (k % 6) * 0.05;
    const u = a0 - tb;
    if (u <= 0) continue;
    const s0 = 8 + ngRnd(seed + k) * 92;
    const s = s0 * (0.25 + 0.75 * ngOut(u / 1.2)) + Math.min(u, 6) * 3;
    const side = (ngRnd(seed + k + 99) - 0.5) * (10 + s0 * 0.75);
    const x = mx + NG_E.dir[0] * s - NG_E.dir[1] * side + u * 4;
    const y = my + NG_E.dir[1] * s + NG_E.dir[0] * side - u * 3;
    const q = ngRnd(seed + k + 50);
    const r = (3 + q * q * 18 + s0 * 0.08) * ngOut(u / 1.6) * (1 + Math.min(u, 6) * 0.09);
    balls.push([x, y, r]);
  }
  balls.forEach(([x, y, r], k) => ngBlob(g, x, y, r + 1, NG_SMOKE[0], seed + k * 13, age));
  balls.forEach(([x, y, r], k) => ngBlob(g, x, y, r, NG_SMOKE[1], seed + k * 13, age));
  balls.forEach(([x, y, r], k) => ngBlob(g, x - r * 0.18, y - r * 0.2, r * 0.72, NG_SMOKE[2], seed + k * 13 + 5, age));
  balls.forEach(([x, y, r], k) => ngBlob(g, x - r * 0.32, y - r * 0.36, r * 0.4, NG_SMOKE[3], seed + k * 13 + 11, age));
  for (const [x, y, r] of balls) ngDither(g, x - r * 0.4, y - r * 0.45, r * 0.22, NG_SMOKE[4], 0.5);
};
// 砲口の炎: 丸い玉でなく、砲口から砲の向きへ噴き出す巨大な炎(作者「巨大なマズルフラッシュ」)。0.6 秒。
// 根もとは細く、中ほどで大きくふくらみ、ふちは乱れで切れる。明るさで白 → 黄 → だいだい → 赤 → 暗い赤
const NG_FLAME = [
  [255, 250, 222],
  [255, 214, 90],
  [241, 118, 49],
  [200, 64, 30],
  [120, 32, 22],
];
// 砲口から先にだけ出す(うしろへは出さない)。砲口では砲身の太さで細く噴き出し、先で大きく開いて丸まる(作者「マズルフラッシュが砲から出ていないようにみえる」)
// 激しさ P(todo 217 キ): 炎の長さと太さ、続く時間、砲口の火の玉、画面のひらめき
const ngFlashP = () => globalThis.ngFlashPow ?? 2.4; // 案 2(D574。試しのときだけ ngFlashPow で変える)
const ngBlast = (img, mx, my, age, seed, big) => {
  const P = ngFlashP();
  const DUR = 0.55 * (0.6 + 0.4 * P);
  if (age < 0 || age > DUR) return;
  const grow = ngOut(age / 0.08);
  const hold = 0.14 * (0.5 + 0.5 * P);
  const fade = age < hold ? 0 : (age - hold) / (DUR - hold);
  const L = (big ? 78 : 58) * P * grow + 10 * fade;
  const W = (big ? 22 : 16) * Math.pow(P, 0.8);
  const [dx, dy] = NG_E.dir;
  const d = img.data;
  const ex = mx + dx * L;
  const ey = my + dy * L;
  const x0 = Math.max(0, Math.floor(Math.min(mx, ex) - W - 6));
  const x1 = Math.min(480, Math.ceil(Math.max(mx, ex) + W + 6));
  const y0 = Math.max(0, Math.floor(Math.min(my, ey) - W - 6));
  const y1 = Math.min(288, Math.ceil(Math.max(my, ey) + W + 6));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const px = x - mx;
      const py = y - my;
      const a = px * dx + py * dy;
      if (a < 0 || a > L) continue;
      const b = -px * dy + py * dx;
      const t = a / Math.max(1, L);
      // 幅: 砲口で 2(砲身の太さ)→ 6 割の所まで広がり → 先で丸まる
      const prof = t < 0.6 ? Math.pow(t / 0.6, 0.75) : Math.sqrt(Math.max(0, 1 - ((t - 0.6) / 0.4) ** 2));
      const w = 2 + W * prof * grow * (1 - fade * 0.4);
      const n = ngNoise((x + seed) / 5, (y - age * 70) / 5) * 0.6 + ngNoise((x + seed) / 2.2, (y + seed) / 2.2) * 0.4;
      const e = Math.abs(b) / (w * (0.7 + 0.6 * n));
      if (e > 1) continue;
      // 砲口に近く、軸に近いほど明るい
      const I = 1.1 - e * 0.6 - t * 0.35 + (n - 0.5) * 0.45 - fade * 1.2;
      if (I < 0.06) continue;
      const c = NG_FLAME[I > 0.8 ? 0 : I > 0.6 ? 1 : I > 0.4 ? 2 : I > 0.22 ? 3 : 4];
      const k = (y * 480 + x) * 4;
      d[k] = c[0];
      d[k + 1] = c[1];
      d[k + 2] = c[2];
      d[k + 3] = 255;
    }
  }
  // 砲口の火の玉: 砲口のすぐ先で、ほんの一瞬、まわりへはじける(P が 1 より大きいときだけ)
  if (P <= 1) return;
  const fa = age / (0.22 * P);
  if (fa >= 1) return;
  const R = (big ? 9 : 6) * (P - 0.6) * ngOut(Math.min(1, age / 0.05)) * (1 + 0.4 * fa);
  const cx = mx + dx * R * 0.9;
  const cy = my + dy * R * 0.9;
  for (let y = Math.max(0, Math.floor(cy - R - 3)); y < Math.min(288, cy + R + 3); y++) {
    for (let x = Math.max(0, Math.floor(cx - R - 3)); x < Math.min(480, cx + R + 3); x++) {
      const n = ngNoise((x + seed) / 3, (y + seed) / 3);
      const e = Math.hypot(x - cx, y - cy) / (R * (0.75 + 0.5 * n));
      if (e > 1) continue;
      const I = 1.15 - e * 0.7 - fa * 1.1 + (n - 0.5) * 0.4;
      if (I < 0.1) continue;
      const c = NG_FLAME[I > 0.8 ? 0 : I > 0.6 ? 1 : I > 0.4 ? 2 : I > 0.22 ? 3 : 4];
      const k = (y * 480 + x) * 4;
      d[k] = c[0];
      d[k + 1] = c[1];
      d[k + 2] = c[2];
      d[k + 3] = 255;
    }
  }
};
// 水面の衝撃波の中心(砲口の下の水面。作者「発砲時に水面にも衝撃波の波を描けるか」)
const NG_WAVE = { x: 214, y: 214 };
// 激しい衝撃波(作者「斉射の波紋はもっと激しく」、アイオワ級の斉射の写真): 爆風で押された水面が、ふちの鋭い白い円盤になって広がる。
// 円盤の中はふちほど明るく(ディザ)、外側に暗い谷、中には泡が残る。pow で強さ
const NG_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const ngWaveHard = (img, age, pow) => {
  const D = 2.4 + 0.8 * pow;
  if (age < 0 || age > D) return;
  const d = img.data;
  const u = ngOut(Math.min(1, age / (0.7 + 0.2 * pow)));
  const rx = 18 + 190 * pow * u + 40 * age;
  const ry = rx * 0.2;
  const cx = NG_WAVE.x + 26 * pow * u; // 撃つ向き(右)へずれる
  const cy = NG_WAVE.y + 3;
  const fade = Math.max(0, 1 - age / D);
  const flash = Math.max(0, 1 - age / 0.35);
  const x0 = Math.max(0, Math.floor(cx - rx * 1.12)), x1 = Math.min(479, Math.ceil(cx + rx * 1.12));
  const y0 = Math.max(0, Math.floor(cy - ry * 1.12)), y1 = Math.min(287, Math.ceil(cy + ry * 1.12));
  const put = (k, c, a) => {
    d[k] = d[k] * (1 - a) + c[0] * a;
    d[k + 1] = d[k + 1] * (1 - a) + c[1] * a;
    d[k + 2] = d[k + 2] * (1 - a) + c[2] * a;
    d[k + 3] = Math.max(d[k + 3], 255 * a);
  };
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      // ふちを少し乱す(丸すぎないように)
      const ang = Math.atan2(dy, dx);
      const wob = 0.035 * Math.sin(ang * 7 + age * 3) + 0.025 * Math.sin(ang * 13 + 1.3);
      const e = Math.sqrt(dx * dx + dy * dy) - wob;
      const k = (y * 480 + x) * 4;
      const b = NG_BAYER[(y & 3) * 4 + (x & 3)] / 16;
      if (e <= 1) {
        if (e > 0.93) {
          // 鋭いふち
          if (ngRnd(x * 3 + y * 7 + Math.floor(age * 8)) < 0.9) put(k, [255, 255, 250], Math.min(1, 1.1 * fade + 0.2));
        } else {
          // ふちほど明るい円盤 + はじめのひらめき
          const v = Math.pow(e, 2.2) * 0.85 * fade + flash * 0.9;
          if (v > b) put(k, [255, 244, 224], Math.min(1, 0.55 + 0.45 * fade));
          // 泡
          else if (ngRnd(x * 13 + y * 31) < 0.05 * fade * pow) put(k, [255, 250, 240], 0.8 * fade);
        }
      } else if (e < 1.09) {
        // 外側の暗い谷
        if (b < 0.6) put(k, [70, 45, 70], 0.45 * fade);
      }
    }
  }
};
// しぶきの幕と、水面をはう霧: 円盤のふちから白い水が立ち上がり、撃つ向き(右)へ霧が流れる
const ngSpray = (g, age, pow, half) => {
  const D = 2.8 + 1.0 * pow;
  if (age < 0 || age > D) return;
  const u = ngOut(Math.min(1, age / (0.7 + 0.2 * pow)));
  const rx = 18 + 190 * pow * u + 40 * age;
  const ry = rx * 0.2;
  const cx = NG_WAVE.x + 26 * pow * u;
  const cy = NG_WAVE.y + 3;
  const fade = Math.max(0, 1 - age / D);
  const rise = Math.sin(Math.min(1, age / 1.4) * Math.PI);
  // しぶきの幕(ふちから立つ白いかたまり)。右ほど高い。far は艦のうしろ(奥の半分)、near は手前
  const n = Math.round(90 * pow);
  for (let i = 0; i < n; i++) {
    const a = ngRnd(i * 5 + 1) * Math.PI * 2;
    const nearSide = Math.sin(a) > 0;
    if ((half === "far") === nearSide) continue;
    const px = cx + Math.cos(a) * rx * (0.95 + 0.07 * ngRnd(i));
    const py = cy + Math.sin(a) * ry;
    if (py < 188) continue; // 向こう岸より奥には立てない
    const side = 0.5 + 0.5 * Math.cos(a);
    const h = (3 + ngRnd(i * 3 + 2) * 12) * pow * rise * (0.4 + side);
    if (h < 1) continue;
    const w = 2 + ngRnd(i * 7) * 4;
    for (let j = 0; j < h * w * 0.9; j++) {
      const yy = ngRnd(i * 31 + j) * h;
      const xx = (ngRnd(i * 17 + j * 5) - 0.5) * w * (1 + yy / h);
      g.globalAlpha = fade * (1 - (yy / h) * 0.7);
      g.fillStyle = yy < h * 0.5 ? "#fffaf0" : "#ffe8d8";
      g.fillRect(Math.round(px + xx), Math.round(py - yy), 1, 1);
    }
  }
  if (half === "far") return (g.globalAlpha = 1);
  // 水面をはう霧(右へ流れる、ふちを点で崩したかたまり)
  const m = Math.round(26 * pow);
  for (let i = 0; i < m; i++) {
    const t0 = ngRnd(i * 11) * 0.5;
    const a = age - t0;
    if (a < 0) continue;
    const sp = (60 + ngRnd(i * 7) * 120) * pow;
    const px = NG_WAVE.x - 20 + ngRnd(i * 2) * 50 + sp * ngOut(Math.min(1, a / 2.5)) * 1.3;
    const py = NG_WAVE.y - 2 + (ngRnd(i * 4) - 0.5) * 16 - a * 3;
    const r = (6 + ngRnd(i * 6) * 10) * (0.6 + a * 0.6) * pow;
    const al = 0.55 * Math.max(0, 1 - a / (D - t0));
    if (al <= 0.01) continue;
    g.fillStyle = "#fff2e6";
    for (let j = 0; j < r * r * 0.9; j++) {
      const q = ngRnd(i * 97 + j) * Math.PI * 2;
      const rr = Math.sqrt(ngRnd(i * 53 + j * 3)) * r;
      g.globalAlpha = al * (1 - rr / r * 0.6);
      g.fillRect(Math.round(px + Math.cos(q) * rr * 1.6), Math.round(py + Math.sin(q) * rr * 0.55), 2, 1);
    }
  }
  g.globalAlpha = 1;
};
// 電磁パルス(作者「成層圏で爆発が広がった時に、電磁パルスを表現するために、画面にノイズを載せてほしい」):
// 赤い輪が広がるころから強くなり、数秒で消える。砂のノイズ、横にずれる帯、走査線、画面のはね
const ngEmpPower = (t2) => {
  let k = 0;
  for (const t0 of [NG_E.burst1, NG_E.burst2]) {
    const a = t2 - t0;
    if (a > 0.3) k = Math.max(k, a < 1.0 ? (a - 0.3) / 0.7 : Math.max(0, 1 - (a - 1.0) / 3.5));
  }
  return k;
};
const ngEmp = (ctx, src, X, Y, k) => {
  if (k <= 0.01) return ctx.drawImage(src, X, Y);
  const jump = Math.random() < 0.15 * k ? Math.round((Math.random() - 0.5) * 8 * k) : 0;
  ctx.drawImage(src, X, Y + jump);
  // 横にずれる帯
  const n = Math.round(2 + 9 * k);
  for (let i = 0; i < n; i++) {
    const y = Math.floor(Math.random() * 288);
    const h = 1 + Math.floor(Math.random() * 7 * k);
    const dx = Math.round((Math.random() - 0.5) * 50 * k);
    ctx.drawImage(src, 0, y, 480, h, X + dx, Y + y + jump, 480, h);
  }
  // 走査線
  ctx.fillStyle = `rgba(0,0,0,${0.22 * k})`;
  for (let y = 0; y < 288; y += 2) ctx.fillRect(X, Y + y, 480, 1);
  // 砂のノイズ
  const m = Math.round(2600 * k);
  for (let i = 0; i < m; i++) {
    const v = Math.random();
    ctx.fillStyle = v < 0.45 ? "#ffffff" : v < 0.8 ? "#9a9aa8" : v < 0.9 ? "#ff6070" : "#60e0ff";
    ctx.fillRect(X + Math.floor(Math.random() * 480), Y + Math.floor(Math.random() * 288), 1 + (Math.random() < 0.2 ? 1 : 0), 1);
  }
  // ときどき、一行まるごと白く光る
  if (Math.random() < 0.3 * k) {
    ctx.fillStyle = `rgba(255,255,255,${0.5 * k})`;
    ctx.fillRect(X, Y + Math.floor(Math.random() * 288), 480, 1 + Math.floor(Math.random() * 3));
  }
  // ホワイトノイズの砂あらし(作者「もっとホワイトノイズで画像が見えなくなってもいい」todo 221)。強さ EP、いちばん強い所では絵が見えなくなる
  const EP = ngEmpP();
  if (EP <= 1) return;
  const a = Math.min(1, k * (EP - 1) * 0.6);
  if (a <= 0.02) return;
  const nc = ngEmpNoise.c || (ngEmpNoise.c = document.createElement("canvas"));
  nc.width = 480;
  nc.height = 288;
  const ng = nc.getContext("2d");
  const im = ng.createImageData(480, 288);
  const d = im.data;
  for (let y = 0; y < 288; y++) {
    const row = Math.random() < 0.06 ? 60 : 0; // 明るい横すじ
    for (let x = 0; x < 480; x++) {
      const v = Math.min(255, Math.random() * 235 + row);
      const k4 = (y * 480 + x) * 4;
      d[k4] = d[k4 + 1] = d[k4 + 2] = v;
      d[k4 + 3] = 255;
    }
  }
  ng.putImageData(im, 0, 0);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.drawImage(nc, X, Y);
  ctx.restore();
};
const ngEmpNoise = { c: null };
const ngEmpP = () => globalThis.ngEmpPow ?? 2.8; // 案 2(D578)。試しのときだけ ngEmpPow で変える
// 高い空の爆発(成層圏の核爆発ほど 作者): 白い玉 → 火の玉 → 赤い殻が空いっぱいに広がり、ゆっくり消える
const ngBurst = (g, x, y, age) => {
  if (age < 0) return;
  // 赤い殻(オーロラのような赤)
  if (age > 0.3 && age < 10) {
    const u = ngOut((age - 0.3) / 5);
    const r = 40 + 150 * u;
    const a = Math.max(0, 1 - (age - 0.3) / 9.7);
    ngDither(g, x, y, r, "#ff4a5a", 0.3 * a + 0.1);
    ngDither(g, x, y, r * 0.85, "#ff7a50", 0.5 * a);
    g.globalAlpha = a;
    g.fillStyle = "#ff8a90";
    const R = Math.round(r);
    for (let i = 0; i < 360; i += 1.5) {
      const t = (i * Math.PI) / 180;
      g.fillRect(Math.round(x + Math.cos(t) * R), Math.round(y + Math.sin(t) * R * 0.85), 2, 1);
    }
    g.globalAlpha = 1;
  }
  const f = ngOut(age / 0.6);
  const fade = age < 1.5 ? 1 : Math.max(0, 1 - (age - 1.5) / 3.5);
  if (fade <= 0) return;
  g.globalAlpha = fade;
  const R = 10 + 42 * f;
  const c1 = age < 2 ? "#ff8c32" : "#c83c32";
  const c2 = age < 1.6 ? "#ffc864" : "#ff6a32";
  const c3 = age < 1.2 ? "#ffeeb0" : "#ff9a46";
  ngDither(g, x, y, R * 1.3, "#ffb060", 0.3);
  ngDither(g, x, y, R * 1.12, c1, 0.5);
  ngDisc(g, x, y, R, c1);
  ngDither(g, x, y, R * 0.92, c2, 0.5);
  ngDisc(g, x, y, R * 0.78, c2);
  ngDither(g, x, y, R * 0.7, c3, 0.5);
  ngDisc(g, x, y, R * 0.56, c3);
  if (age < 1.4) ngDisc(g, x, y, R * 0.42 * (1 - age / 1.4) + 1, "#ffffff");
  g.globalAlpha = 1;
};
const ngEFrame = (t) => {
  const { n1, n2 } = NG_E;
  if (t < NG_E.move0) return 0;
  if (t < NG_E.move0 + NG_E.move) return Math.min(n1 - 1, Math.floor(((t - NG_E.move0) / NG_E.move) * n1));
  if (t < NG_E.swap0) return n1 - 1;
  if (t < NG_E.swap0 + NG_E.swap) return n1 + Math.min(n2 - 1, Math.floor(((t - NG_E.swap0) / NG_E.swap) * n2));
  return n1 + n2 - 1;
};
const NG_SEIHA = {
  tile: T,
  bg: "#000",
  hidePlayer: true,
  bgm: "silence", // 斉射のあいだは音楽を止める(轟音だけ)
  map: kGrid(15, 9, () => false),
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 4 * T, facing: "south" } },
  objects: [],
  triggers: [],
  debug: () => ngE,
  onEnter() {
    ngE.t = 0;
    ngE.done = {};
  },
  onA: () => true,
  onB: () => true,
  input(api, dt) {
    ngE.t += dt;
    api.place(7 * T, 4 * T);
    const t = ngE.t;
    const once = (k, at, fn) => {
      if (!ngE.done[k] && t >= at) {
        ngE.done[k] = true;
        fn();
      }
    };
    once("move", NG_E.move0, () => {
      api.sfx("whir");
      api.sfx("flood");
    });
    once("move2", NG_E.move0 + 2.5, () => api.sfx("whir"));
    once("move3", NG_E.move0 + 5.0, () => api.sfx("whir"));
    once("bell", NG_E.bell, () => api.sfx("denrei"));
    once("fireA", NG_E.fireA, () => (api.sfx("salvo"), api.shake(1.2, 4)));
    once("swap", NG_E.swap0, () => api.sfx("whir"));
    once("fireB", NG_E.fireB, () => (api.sfx("salvo"), api.shake(1.2, 4)));
    const c2 = NG_E.cut;
    [NG_E.burst1, NG_E.burst2].forEach((b, s) => {
      for (let i = 0; i < 4; i++) once(`b${s + 1}_${i}`, c2 + b + NG_E.boom + i * NG_E.boomGap, () => (api.sfx("nuke"), api.shake(2.5, 2)));
    });
    once("end", c2 + NG_E.end, () => {
      api.setFlag("fired");
      ngDrill(api);
      api.warp("kansen", "door"); // 斉射のあとは甲板へ。クルーに帽子を返す(D571)
      api.later(1200, () => api.observe()); // 見届け(斉射のあと D573)
    });
  },
  drawGround(ctx, ox, oy, img, api) {
    const t = ngE.t;
    if (!ngE.off) {
      ngE.off = document.createElement("canvas");
      ngE.off.width = 480;
      ngE.off.height = 288;
    }
    const g = ngE.off.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 480, 288);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const X = Math.round(ox);
    const Y = Math.round(oy);
    if (t < NG_E.cut) {
      // ---- カット 1 ----
      const bg = api.image("bg_seiha");
      if (bg) ctx.drawImage(bg, X, Y);
      // 黒煙(A は左の砲、B は右の砲。どちらも 4 門ずつ)と、その上に炎
      NG_E.muz.forEach(([mx, my], i) => {
        ngSmoke(g, mx, my, t - NG_E.fireA - i * 0.05, i * 17);
        ngSmoke(g, mx + 3, my + 2, t - NG_E.fireB - i * 0.05, i * 17 + 200);
      });
      const blasting = [NG_E.fireA, NG_E.fireB].some((tf) => t >= tf && t < tf + 0.8 + 0.4 * ngFlashP());
      if (blasting) {
        const img = g.getImageData(0, 0, 480, 288);
        NG_E.muz.forEach(([mx, my], i) => {
          // 前の 2 砲塔(0、1)は大きく、艦橋のうしろの 2 砲塔(2、3)は遠いので小さく
          ngBlast(img, mx, my, t - NG_E.fireA - i * 0.05, i * 37, i < 2);
          ngBlast(img, mx, my, t - NG_E.fireB - i * 0.05, i * 37 + 500, i < 2);
        });
        g.putImageData(img, 0, 0);
      }
      // 煙の映り(水面で上下を返す)
      ctx.save();
      ctx.beginPath();
      ctx.rect(X, Y + NG_E.water + 1, 480, 288 - NG_E.water - 1);
      ctx.clip();
      ctx.globalAlpha = 0.35;
      ctx.translate(X, Y + NG_E.water * 2 + 1);
      ctx.scale(1, -1);
      ctx.drawImage(ngE.off, 0, 0);
      ctx.restore();
      // 水面の衝撃波(作者「斉射の波紋はもっと激しく」D569): 円盤としぶきの奥の半分は艦のうしろ、手前は艦の映りの上
      const pow = 1.6; // 強さ(作者「２でいい。激しさがつたわるから。」)
      const wg = ngE.wave || (ngE.wave = document.createElement("canvas"));
      wg.width = 480;
      wg.height = 288;
      const w2 = wg.getContext("2d");
      const wi = w2.getImageData(0, 0, 480, 288);
      ngWaveHard(wi, t - NG_E.fireA, pow);
      ngWaveHard(wi, t - NG_E.fireB, pow);
      w2.putImageData(wi, 0, 0);
      const sg = ngE.spray || (ngE.spray = document.createElement("canvas"));
      const s2 = sg.getContext("2d");
      const spray = (half) => {
        sg.width = 480;
        sg.height = 288;
        ngSpray(s2, t - NG_E.fireA, pow, half);
        ngSpray(s2, t - NG_E.fireB, pow, half);
        ctx.drawImage(sg, X, Y);
      };
      const wave = (y0, h) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(X, Y + y0, 480, h);
        ctx.clip();
        ctx.drawImage(wg, X, Y);
        ctx.restore();
      };
      wave(182, 25);
      spray("far");
      const sh = api.image("ng_e_ship");
      if (sh) {
        const f = ngEFrame(t);
        const c = f % NG_E.cols;
        const r = Math.floor(f / NG_E.cols);
        ctx.drawImage(sh, c * NG_E.fw, r * 288, NG_E.fw, 288, X + NG_E.x0, Y, NG_E.fw, 288);
      }
      wave(207, 81);
      spray("near"); // 手前のしぶきと霧は水面より上にも立つ
      ctx.drawImage(ngE.off, X, Y);
      // 撃った瞬間、夕日の色で画面が明るむ
      const FP = ngFlashP();
      for (const tf of [NG_E.fireA, NG_E.fireB]) {
        const u = (t - tf) / (0.5 * (0.6 + 0.4 * FP));
        if (u >= 0 && u < 1) {
          ctx.fillStyle = `rgba(255,214,150,${Math.min(0.8, 0.5 * FP) * (1 - u)})`;
          ctx.fillRect(X, Y, 480, 288);
        }
        // 激しいときは、撃った最初の一瞬だけ白くひらめく
        const w = (t - tf) / 0.09;
        if (FP > 1 && w >= 0 && w < 1) {
          ctx.fillStyle = `rgba(255,250,235,${Math.min(0.85, 0.6 * (FP - 1)) * (1 - w)})`;
          ctx.fillRect(X, Y, 480, 288);
        }
      }
    } else {
      // ---- カット 2: 夕焼け空を見上げる ----
      const t2 = t - NG_E.cut;
      // 裏の画面に描いてから、EMP のノイズをのせて映す
      if (!ngE.c2) {
        ngE.c2 = document.createElement("canvas");
        ngE.c2.width = 480;
        ngE.c2.height = 288;
      }
      const outer = ctx;
      const OX = X;
      const OY = Y;
      {
      const ctx = ngE.c2.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      const X = 0;
      const Y = 0;
      const sky = api.image("bg_sora");
      if (sky) ctx.drawImage(sky, X, Y);
      NG_BURST.forEach((set, s) => {
        const t0 = s === 0 ? NG_E.burst1 : NG_E.burst2;
        set.forEach(([bx, by], i) => ngBurst(g, bx, by, t2 - t0 - i * 0.18));
      });
      // 空が赤くそまる
      let tint = 0;
      for (const t0 of [NG_E.burst1, NG_E.burst2]) {
        const a = t2 - t0;
        if (a >= 0) tint = Math.max(tint, 0.3 * Math.max(0, 1 - a / 4));
      }
      if (tint > 0) {
        ctx.fillStyle = `rgba(255,110,70,${tint})`;
        ctx.fillRect(X, Y, 480, 288);
      }
      ctx.drawImage(ngE.off, X, Y);
      // 爆発の光(空いっぱい)
      for (const t0 of [NG_E.burst1, NG_E.burst2]) {
        for (let i = 0; i < 4; i++) {
          const u = (t2 - t0 - i * 0.18) / 0.25;
          if (u >= 0 && u < 1) {
            ctx.fillStyle = `rgba(255,255,240,${0.6 * (1 - u)})`;
            ctx.fillRect(X, Y, 480, 288);
          }
        }
      }
      // 終わりは暗くなる
      const e = (t2 - (NG_E.end - 1.5)) / 1.5;
      if (e > 0) {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, e)})`;
        ctx.fillRect(X, Y, 480, 288);
      }
      }
      ngEmp(outer, ngE.c2, OX, OY, ngEmpPower(t2));
    }

    // 切りかえの前後は暗くつなぐ
    const k = 1 - Math.abs(t - NG_E.cut) / 0.4;
    if (k > 0) {
      ctx.fillStyle = `rgba(0,0,0,${k})`;
      ctx.fillRect(X, Y, 480, 288);
    }
    ctx.restore();
  },
};
