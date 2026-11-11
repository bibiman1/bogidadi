// 断片: きこりと金星。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== きこりと金星(D175〜D177、ロケ「ぼぎだぢクッキング」D378〜D381) ========
// 嵐の山。惑星混交で、山頂の東のはしに金星のかけらが混ざり込んでいる(硫酸の黄色い雲、焼けた地面、陽炎)。山頂に無人の気象台
// 流れ(D380): 山道で南極の撮影隊(ききこり、ごろん)に、ピザの材料の木箱を押し付けられる → 頭にのせて山頂の気象台へ運ぶ
//       → 気象台の中で木箱を作業台に置くと、ロケが始まり、きこりがマルゲリータを作る(言葉なし)
//       → できると無線で金星の天気予報。撮影隊は外へ撮影の準備に。待ちきれないきこりがピザを持って飛び出す
//       → 外で、ベネラ 7 号(D382)のふたの飛んだ口(ピザ窯に見える)へ飛びこみ、真っ黒にこげて煙、陽炎の向こうで見えなくなる(溶ける瞬間は見せない)
//       → 作業台に残ったピザピールを持って、さかいの手前から口へのばし、焼けたピザを取り出す(D383。電池はなくした D380)→ 帰る条件。西から帰る
//       山頂の百葉箱を調べると、こわれた温度計の一枚絵(D382)
// 向き(D148): きーは左(西)から登り、金星は右(東)のはし。図: docs/assets/kinsei/plan/(配置図 K2、絵コンテ K3)、三面図 K1(sanmen/venera7.py、第 3 版)
const knS = { phase: "idle", t0: 0, walkT0: -1, cookT0: -1, setupT0: -1, goneT0: -1, crewGoT0: -1, cutT0: -1, cutDoneT0: -1, cuts: [], kx: 0 };
const knNow = () => performance.now() / 1000;
const KN_EDGE = 14.6 * T; // 金星のさかい(山頂)
const KN_HEAT_X = KN_EDGE - 0.9 * T; // ここより東へは、熱くて行けない(D391)
// ベネラ 7 号の絵(venera.png)の、足もとから口のまん中までのずれ(絵を替えたら測りなおす)
const KN_MOUTH_DX = -25;
const KN_MOUTH_DY = -45;
const KN_FORECAST = "……きょうの金星は、無風、92気圧、456℃、雲……"; // 予報の文(D178)の頭に「きょうの金星は」(D381)

// 嵐: 暗い空、斜めに降る雨、ときどき稲光。rainTo(画面の x)より右には雨を降らせない(金星は無風 D381)
const knStorm = (ctx, t, dark, rainTo) => {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.fillStyle = `rgba(28, 34, 48, ${dark})`;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (rainTo !== undefined) {
    ctx.beginPath();
    ctx.rect(0, 0, rainTo, H);
    ctx.clip();
  }
  ctx.strokeStyle = "rgba(200, 210, 224, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k < 70; k++) {
    const x = ((k * 137 + t * 520) % (W + 60)) - 30;
    const y = ((k * 89 + t * 760) % (H + 40)) - 20;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + 16);
  }
  ctx.stroke();
  ctx.restore();
  const f = (t * 0.37) % 7;
  if (f < 0.12 || (f > 0.2 && f < 0.26)) {
    ctx.fillStyle = "rgba(236, 240, 255, 0.35)";
    ctx.fillRect(0, 0, W, H);
  }
};
// 陽炎(D381、強さ 2 ドット): 描き終えた画面の、さかいより右を、細い横の帯ごとに左右へずらす。下ほど強く、下から上へ流れる
const knHazeBuf = document.createElement("canvas");
const knHaze = (ctx, edgeX, t, amp = 2) => {
  const s = ctx.getTransform().a; // 1 ドット = s 画素
  const c = ctx.canvas;
  const x0 = Math.max(0, Math.round((edgeX - 8) * s));
  const w = c.width - x0;
  if (w <= 0) return;
  knHazeBuf.width = w;
  knHazeBuf.height = c.height;
  knHazeBuf.getContext("2d").drawImage(c, x0, 0, w, c.height, 0, 0, w, c.height);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const rows = Math.ceil(c.height / s);
  for (let r = 0; r < rows; r++) {
    const a = amp * (0.35 + 0.65 * (r / rows));
    const off = Math.round(Math.sin(r * 0.45 + t * 7) * a + Math.sin(r * 0.13 - t * 2.3) * a * 0.4) * s;
    if (off) ctx.drawImage(knHazeBuf, 0, r * s, w, s, x0 + off, r * s, w, s);
  }
  ctx.restore();
};
// ドットのだ円(行ごとの四角で塗る。ふちがぼやけない)
const knEll = (ctx, cx, cy, rx, ry, color) => {
  if (rx < 0.5 || ry < 0.5) return;
  ctx.fillStyle = color;
  const r0 = Math.ceil(ry);
  for (let dy = -r0; dy <= r0; dy++) {
    const k = 1 - (dy * dy) / (ry * ry);
    if (k <= 0) continue;
    const hw = Math.round(rx * Math.sqrt(k));
    ctx.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2 + 1, 1);
  }
};
// ピザ(マルゲリータ)。stage: ball / flat / sauce / cheese / basil / done / burnt。p はその段の進み(0〜1)
const KN_DOUGH = "#efdcae";
const KN_CRUST = "#c99a5e";
const knPizza = (ctx, x, y, rx, stage, p = 1) => {
  const ry = Math.max(1.5, rx * 0.36);
  if (stage === "ball") {
    knEll(ctx, x, y, rx, rx * 0.75, KN_CRUST);
    knEll(ctx, x, y - 0.5, rx - 1, rx * 0.75 - 1, KN_DOUGH);
    return;
  }
  knEll(ctx, x, y, rx, ry, stage === "burnt" ? "#3a2014" : KN_CRUST);
  knEll(ctx, x, y - 0.5, rx - 1, ry - 0.7, stage === "burnt" ? "#5a2e1a" : KN_DOUGH);
  if (stage === "flat") return;
  // トマトソース: 渦巻きに広がる
  const sr = stage === "sauce" ? (rx - 2.5) * p : rx - 2.5;
  knEll(ctx, x, y - 0.5, sr, Math.max(0.8, sr * 0.36), stage === "burnt" ? "#8e3420" : "#c8402c");
  if (stage === "sauce") return;
  const dots = [
    [-0.45, -0.2],
    [0.1, 0.3],
    [0.5, -0.1],
    [-0.15, -0.45],
    [0.3, 0.55],
  ];
  const nC = stage === "cheese" ? Math.ceil(dots.length * p) : dots.length;
  for (let i = 0; i < nC; i++) knEll(ctx, x + dots[i][0] * (rx - 3), y - 0.5 + dots[i][1] * (ry - 1), 2.2, 1.2, stage === "burnt" ? "#f0c070" : "#fbf6e6");
  if (stage === "cheese" || stage === "burnt") return;
  const leaves = [
    [-0.25, 0.1],
    [0.35, 0.25],
    [0.05, -0.35],
  ];
  const nB = stage === "basil" ? Math.ceil(leaves.length * p) : leaves.length;
  ctx.fillStyle = "#3f9a3c";
  for (let i = 0; i < nB; i++) ctx.fillRect(Math.round(x + leaves[i][0] * (rx - 3)), Math.round(y - 0.5 + leaves[i][1] * (ry - 1)), 2, 1);
};
// 絵を描く(足もとが x, y)。flip で左右反転、alpha、tint(色をのせる: こげる)
const knTintBuf = document.createElement("canvas");
const knDraw = (ctx, im, x, y, o = {}) => {
  if (!im) return;
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha = Math.max(0, o.alpha);
  let src = im;
  if (o.tint) {
    knTintBuf.width = im.width;
    knTintBuf.height = im.height;
    const g = knTintBuf.getContext("2d");
    g.clearRect(0, 0, im.width, im.height);
    g.globalCompositeOperation = "source-over";
    g.drawImage(im, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = o.tint;
    g.fillRect(0, 0, im.width, im.height);
    src = knTintBuf;
  }
  const dx = Math.round(x - im.width / 2);
  const dy = Math.round(y - im.height);
  if (o.wob) {
    // 陽炎の向こうでゆらぐ: 2 行ずつ左右へずらす
    for (let row = 0; row < im.height; row += 2) {
      const off = Math.round(Math.sin(row * 0.6 + o.t * 14) * o.wob * 0.5);
      if (o.flip) {
        ctx.save();
        ctx.translate(dx + im.width + off, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(src, 0, row, im.width, 2, 0, dy + row, im.width, 2);
        ctx.restore();
      } else ctx.drawImage(src, 0, row, im.width, 2, dx + off, dy + row, im.width, 2);
    }
  } else if (o.flip) {
    ctx.translate(dx + im.width, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
  } else ctx.drawImage(src, dx, dy);
  ctx.restore();
};
// 撮影隊の向き(D389): 仮の絵の左右反転(kikikori_l、goron_l)を、向きで使い分ける。dir は 1 = 右(東)、-1 = 左(西)
const knCrew = (api, key, dir) => api.image(dir < 0 ? `${key}_l` : key);
const knLerp = (a, b, u) => a + (b - a) * Math.max(0, Math.min(1, u));
// 道すじ(点の列)の上を u(0〜1)だけ進んだ所
const knAlong = (pts, u) => {
  const seg = [];
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d);
    L += d;
  }
  let s = Math.max(0, Math.min(1, u)) * L;
  for (let i = 0; i < seg.length; i++) {
    if (s <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, s / seg[i]) : 1;
      return [knLerp(pts[i][0], pts[i + 1][0], k), knLerp(pts[i][1], pts[i + 1][1], k)];
    }
    s -= seg[i];
  }
  return pts[pts.length - 1];
};
const knImg = (key, x, y, extra) =>
  Object.assign(
    {
      id: key,
      x,
      y,
      w: 1,
      h: 1,
      headY: 40,
      draw(ctx, sx, sy, t, api) {
        knDraw(ctx, api.image(key), sx, sy);
      },
    },
    extra
  );
