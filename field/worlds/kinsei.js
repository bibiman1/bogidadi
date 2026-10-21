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

// ---- 山道: 撮影隊が機材を持って登る。きーは木箱を押し付けられる(D380) ----
const KN_CREW_V = 120; // 撮影隊の登る速さ(px/秒)。木箱を運ぶきー(105)より少し速く、先に山頂へ
// D395: 撮影隊は道の終わり(山頂への口の手前)で止まって待ち、きーが近づくと、ひと足先に山頂へ入る(道のはしを越えると見えなくなる)
const KN_CREW_END = 28.4 * T; // ききこり(列のいちばん前)が止まる所。ほかは同じ間をあけて止まる
const KN_CREW_LEAD = 5.6 * T; // ききこりの、はじめの位置
const knCrewX = (x0) => {
  if (knS.walkT0 < 0) return x0;
  const x = Math.min(x0 + (knNow() - knS.walkT0) * KN_CREW_V, KN_CREW_END - (KN_CREW_LEAD - x0));
  return knS.crewGoT0 < 0 ? x : x + (knNow() - knS.crewGoT0) * KN_CREW_V;
};
const KN_SANDO = {
  tile: T,
  bg: "#46504a",
  map: kGrid(30, 10, (c, r) => r < 4 || r > 7),
  legend: K_LEGEND,
  drawGround: kImage("bg_sando", 30 * T, 10 * T),
  spawns: {
    start: { x: 1.6 * T, y: 6 * T, facing: "east" },
    east: { x: 28.2 * T, y: 6 * T, facing: "west" },
  },
  drawOverlay(ctx, ox, oy, t) {
    knStorm(ctx, t, 0.32);
  },
  triggers: [
    { id: "leave", x: -T, y: 4 * T, w: 1.6 * T, h: 4 * T, run: (api) => api.exit() },
    { id: "toSancho", x: 29.4 * T, y: 4 * T, w: 1.6 * T, h: 4 * T, warp: { map: "sancho", spawn: "west" } },
    {
      // 押し付け: ごろん(ディレクター)の前まで来ると、ごろんが跳ねて、木箱がきーの頭にのる。ごろんは山頂を指す。言葉はない
      id: "oshitsuke",
      x: 2.3 * T,
      y: 4 * T,
      w: T,
      h: 4 * T,
      enabled: (api) => !api.flag("boxed"),
      run(api) {
        if (knS.phase !== "idle") return;
        knS.phase = "oshitsuke";
        knS.t0 = knNow();
        api.freeze(2.2);
        api.face("east");
        api.later(700, () => api.sfx("pop"));
        api.later(1200, () => {
          api.setFlag("boxed");
          api.sfx("item");
        });
        api.later(2200, () => {
          knS.phase = "climb";
          knS.walkT0 = knNow();
          knS.crewGoT0 = -1;
        });
      },
    },
  ],
  objects: [
    // 拡声器の柱は、背景から切り抜いた絵(fg_sando)を根元の y で前後させる(作者「背景の前後」)。鳴らさない(予報は気象台の中の無線 D380)
    kFg("fg_sando", 161, 70, 45, 91, 158),
    kWall(180, 152, 193, 160),
    {
      // 木箱(ピザの材料)。押し付けられる前は地面に。押し付けのあいだ、地面からきーの頭へ跳ぶ
      id: "crate",
      x: 2.6 * T,
      y: 6.3 * T,
      w: 1,
      h: 1,
      hidden: (api) => api.flag("boxed"),
      draw(ctx, sx, sy, t, api) {
        const im = api.image("k_crate");
        if (!im) return;
        let x = sx;
        let y = sy;
        if (knS.phase === "oshitsuke") {
          const u = Math.max(0, Math.min(1, (knNow() - knS.t0 - 0.7) / 0.5));
          const pl = api.player();
          x = knLerp(sx, pl.x + (sx - this.x), u);
          y = knLerp(sy, pl.y + (sy - this.y) - 22, u) - Math.sin(u * Math.PI) * 18;
        }
        knDraw(ctx, im, x, y);
      },
    },
    knImg("goron", 3.3 * T, 6.6 * T, {
      // ごろん(ディレクター)。押し付けのあと、山頂を指し(右向き)、撮影隊の先頭で登っていく
      hidden: (api) => api.flag("boxed") && (knS.phase !== "oshitsuke" && knS.phase !== "climb" || knCrewX(this.x) > 30 * T),
      draw(ctx, sx, sy, t, api) {
        let x = sx;
        let y = sy;
        let flip = true; // 左(きーの方)を向く
        if (knS.phase === "oshitsuke") {
          const el = knNow() - knS.t0;
          y -= el > 0.3 && el < 0.9 ? Math.abs(Math.sin((el - 0.3) * 10)) * 5 : 0; // 跳ねる
          if (el > 1.3) flip = false; // 山頂の方を向いて指す
          if (el > 1.3) {
            // 指す手の先に、小さな三角(言葉の代わり)
            ctx.fillStyle = "#ffe6a0";
            const ax = Math.round(x + 22 + Math.sin(t * 8) * 2);
            const ay = Math.round(y - 22);
            for (let k = 0; k < 4; k++) ctx.fillRect(ax + k, ay - 3 + k, 1, 7 - k * 2);
          }
        }
        if (knS.phase === "climb") {
          x = sx + (knCrewX(this.x) - this.x);
          y -= Math.abs(Math.sin(t * 9)) * 1.5;
          flip = false;
        }
        knDraw(ctx, knCrew(api, "goron", flip ? -1 : 1), x, y);
      },
    }),
    knImg("kikikori", 5.6 * T, 6.0 * T, {
      // ききこり(カメラ係)。機材を持って登る
      hidden: (api) => api.flag("boxed") && (knS.phase !== "oshitsuke" && knS.phase !== "climb" || knCrewX(this.x) > 30 * T),
      draw(ctx, sx, sy, t, api) {
        const x = sx + (knS.phase === "climb" ? knCrewX(this.x) - this.x : 0);
        knDraw(ctx, api.image("kikikori"), x, sy - (knS.phase === "climb" ? Math.abs(Math.sin(t * 8 + 1)) * 1.5 : 0));
      },
    }),
    knImg("kikori", 9 * T, 6.3 * T, {
      // きこり: 落ち着きなく跳ねる。登るときは、きーより先へ走っては戻る
      hidden: (api) => api.flag("boxed") && (knS.phase !== "oshitsuke" && knS.phase !== "climb"),
      update(dt, t, api) {
        if (knS.phase !== "climb") {
          knS.kx = this.x;
          return;
        }
        if (knS.crewGoT0 < 0 && api.player().x > KN_CREW_END - 4 * T) knS.crewGoT0 = knNow(); // きーが来たので、先に山頂へ
        const target = Math.min(29.5 * T, api.player().x + 2.6 * T + Math.sin(t * 1.4) * 2.2 * T);
        knS.kx += Math.max(-1, Math.min(1, target - knS.kx)) * Math.min(Math.abs(target - knS.kx), 260 * dt);
        this.dir = target > knS.kx + 2 ? 1 : target < knS.kx - 2 ? -1 : this.dir || 1;
      },
      draw(ctx, sx, sy, t, api) {
        const x = sx + (knS.kx || this.x) - this.x;
        knDraw(ctx, api.image("kikori"), x, sy - Math.abs(Math.sin(t * 9)) * 3, { flip: this.dir < 0 });
      },
      range: 40,
      interact: (api) => {
        api.sfx("oink");
        api.bubble("kikori", "ピザ", 900);
      },
      canInteract: (api) => !api.flag("boxed") && knS.phase === "idle",
    }),
    knImg("chirin", 8.2 * T, 6.0 * T, {
      // ちりん: きこりのそばでゆれる(きこりに執着)
      hidden: (api) => api.flag("boxed") && knS.phase !== "oshitsuke" && knS.phase !== "climb",
      draw(ctx, sx, sy, t, api) {
        const x = sx + Math.sin(t * 3) * 1.5 + ((knS.kx || 9 * T) - 9 * T) * 0.92;
        knDraw(ctx, api.image("chirin"), x, sy - 6);
      },
      range: 40,
      interact: (api) => api.bubble("chirin", "チリーン", 1200), // 仮
      canInteract: () => knS.phase === "idle",
    }),
  ],
};

// ---- 気象台の中: ロケ「ぼぎだぢクッキング」(D378〜D380、絵コンテ K3) ----
// 時刻(ロケが始まってからの秒)。カチンコ → こねる → 丸める → 押し広げる → 放り投げて回す ×3 → ソース → チーズ → バジル → 予報 → 撮影隊は外へ → きこりが飛び出す
// D394: 予報のあと、きこりがピザだけつかんで飛び出し(crew〜bolt)、撮影隊がピールを持って追いかける(chase〜end)
const KN_COOK = { clap: 1.0, knead: 3.0, ball: 5.0, press: 7.0, toss1: 9.0, toss3: 13.0, sauce: 16.0, cheese: 18.0, basil: 20.0, radio: 23.5, crew: 25.0, bolt: 26.0, chase: 25.6, grab: 26.0, end: 27.0 };
const KN_TABLE = { x: 7 * T, y: 4.45 * T }; // 作業台の足もと
const KN_TV = { x: 10.1 * T, y: 3.45 * T }; // テレビの足もと(北の壁ぎわ、戸棚の左)
const KN_TV_SCREEN = { x: 6, y: 19, w: 29, h: 19 }; // テレビの絵の中の画面(左上と大きさ。絵を替えたら測りなおす)
const KN_PZ = { x: 7 * T, y: 4.45 * T - 21 }; // 作業台の上のピザの中心
const KN_KIKORI_IN = { x: 7 * T, y: 3.62 * T }; // 台の向こうのきこり
const KN_DOOR_IN = { x: 6.5 * T, y: 9.2 * T };
const knCookEl = () => (knS.cookT0 < 0 ? -1 : knNow() - knS.cookT0);
// 木箱を置く → 暗転して設営(D389): 暗いあいだに、照明が立ち、きーはカメラのうしろへ(カメラに映らない)。明けるとカチンコ
const KN_SETUP = { dark: 0.5, light: 1.3, end: 1.8 };
const KN_KI_BEHIND = { x: 4.9 * T, y: 8.0 * T }; // カメラ(ききこり)の左うしろ
const knSetupStart = (api) => {
  knS.setupT0 = knNow();
  api.freeze(KN_SETUP.end + KN_COOK.end + 0.3);
  api.later(KN_SETUP.dark * 1000 + 100, () => {
    api.place(KN_KI_BEHIND.x, KN_KI_BEHIND.y);
    api.face("north");
  });
  api.later(KN_SETUP.end * 1000, () => {
    knS.setupT0 = -1;
    knCookStart(api);
  });
};
const knSetupEl = () => (knS.setupT0 < 0 ? -1 : knNow() - knS.setupT0);
const knCookStart = (api) => {
  knS.cookT0 = knNow();
  api.freeze(KN_COOK.end + 0.2);
  api.later(300, () => api.sfx("knock")); // カチンコ
  const cx = KN_PZ.x;
  const cy = KN_PZ.y;
  api.camPath([
    { t: 0, x: 7 * T, y: 4.5 * T, z: 1 },
    { t: 1.6, x: cx, y: cy - 6, z: 1.5 },
    { t: KN_COOK.basil, x: cx, y: cy - 10, z: 1.5 },
    { t: KN_COOK.radio - 0.8, x: 5.6 * T, y: 4.6 * T, z: 1.15 },
    { t: KN_COOK.end, x: 7 * T, y: 4.6 * T, z: 1 },
  ]);
  api.later(KN_COOK.basil * 1000, () => api.bubble("radio", KN_FORECAST, 3400));
  api.later(KN_COOK.crew * 1000, () => api.sfx("oink"));
  api.later(KN_COOK.end * 1000, () => {
    api.setFlag("dashed"); // きこりはピザを持って飛び出し、撮影隊はピールを持って追いかけた(D394)
    knS.cookT0 = -1;
  });
};
// ---- ピザを 3 つに切る(D395) ----
// 上から見たピザの上を、切る線が中心のまわりを回る。A で 1 本ずつ切る。3 本で 3 切れ。
// 切ったあと、ごろんがいちばん大きい切れ、ききこりが 2 番目を取り、きーには残りのひと切れ(おみやげ)
const KN_CUT = { spin: 1.7, sep: 0.6, take1: 1.0, take2: 2.1, end: 3.4 }; // 回る速さ(ラジアン/秒)と、切ったあとの段(秒)
const KN_SLICE = "焼けたピザのひと切れ";
const knCutStart = (api) => {
  knS.cutT0 = knNow();
  knS.cuts = [];
  knS.cutDoneT0 = -1;
  api.face("north");
  api.freeze(600);
  api.sfx("item");
};
// 切った角度から、3 切れの [はじめ, おわり, 大きさの順位](大きい順に 0, 1, 2)
const knCutPieces = () => {
  const c = knS.cuts.slice().sort((a, b) => a - b);
  const ps = [0, 1, 2].map((k) => ({ a0: c[k], a1: k < 2 ? c[k + 1] : c[0] + Math.PI * 2 }));
  ps.slice().sort((p, q) => q.a1 - q.a0 - (p.a1 - p.a0)).forEach((p, k) => (p.rank = k));
  return ps;
};
// A を押すたび(短く押しても)、作業台の interact から呼ばれる(切っているあいだ、きーは台の前で止まっている)
const knCutPress = (api) => {
  if (knS.cutT0 < 0 || knS.cutDoneT0 >= 0 || knNow() - knS.cutT0 < 0.3) return;
  const ang = ((knNow() - knS.cutT0) * KN_CUT.spin) % (Math.PI * 2);
  knS.cuts.push(ang);
  api.sfx("knock");
  if (knS.cuts.length < 3) return;
  // 3 本切れた: 切れが離れる → ごろんが大きい切れ → ききこりが 2 番目 → きーにひと切れ
  knS.cutDoneT0 = knNow();
  const C = KN_CUT;
  api.later(C.take1 * 1000, () => api.sfx("pop"));
  api.later(C.take2 * 1000, () => api.sfx("pop"));
  api.later(C.end * 1000, () => {
    knS.cutT0 = -1;
    knS.cutDoneT0 = -1;
    api.freeze(0);
    api.hold("ic_slice", 1.8, () => {
      api.setFlag("cut");
      api.takeItem("焼けたピザ"); // 前の版のおみやげ(丸ごと)
      if (!api.hasItem(KN_SLICE)) api.giveItem(KN_SLICE);
      api.clear();
    });
  });
};
const knCutDraw = (ctx, api, t) => {
  if (knS.cutT0 < 0) return;
  const im = api.image("k_pizza_top"); // 上から見たピザ(PixelLab、D396 でふつうのピザに)
  if (!im) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.fillStyle = "rgba(10, 8, 6, 0.6)";
  ctx.fillRect(0, 0, W, H);
  const k = Math.max(2, Math.floor((Math.min(W, H) * 0.55) / im.width));
  const R = (im.width / 2) * k;
  const cx = Math.round(W / 2);
  const cy = Math.round(H / 2);
  const C = KN_CUT;
  const de = knS.cutDoneT0 < 0 ? -1 : knNow() - knS.cutDoneT0;
  if (de < 0) {
    ctx.drawImage(im, cx - R, cy - R, R * 2, R * 2);
    // 切ったあと
    ctx.strokeStyle = "#1c120a";
    ctx.lineWidth = k;
    for (const a of knS.cuts) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.stroke();
    }
    // 回る切る線(ピザカッター)。刃の輪が、ふちを回る
    const a = ((knNow() - knS.cutT0) * C.spin) % (Math.PI * 2);
    const wr = Math.max(3 * k, Math.round(R * 0.08)); // 刃の輪の大きさ(ピザに合わせる)
    const ex = cx + Math.cos(a) * (R + wr);
    const ey = cy + Math.sin(a) * (R + wr);
    ctx.strokeStyle = "rgba(242, 240, 234, 0.9)";
    ctx.lineWidth = Math.max(2, k);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.fillStyle = "#c9ccd1";
    ctx.beginPath();
    ctx.arc(ex, ey, wr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6c7076";
    ctx.fillRect(Math.round(ex - wr / 4), Math.round(ey - wr / 4), Math.round(wr / 2), Math.round(wr / 2));
    // A の合図(言葉なし)
    if (Math.floor(t * 2.5) % 2 === 0) {
      const ts = Math.max(1, Math.round(k / 4));
      const br = 10 * ts;
      const bx = cx;
      const by = Math.min(H - br - 4, cy + R + 4 * k + br);
      ctx.fillStyle = "#b5352b";
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      if (window.bogiPix) {
        const tw = window.bogiPix.width("A") * ts;
        window.bogiPix.text(ctx, "A", Math.round(bx - tw / 2), Math.round(by - 8 * ts), ts, "#f2f0ea");
      }
    }
  } else {
    // 3 切れ: 離れる → 大きい順に持っていかれる(右上、テレビの方へ)
    const sep = Math.min(1, de / C.sep) * 4 * k;
    for (const p of knCutPieces()) {
      const go = p.rank === 0 ? (de - C.take1) / 0.8 : p.rank === 1 ? (de - C.take2) / 0.8 : 0;
      const u = Math.max(0, Math.min(1, go));
      if (u >= 1) continue;
      const mid = (p.a0 + p.a1) / 2;
      const dx = Math.cos(mid) * sep + u * W * 0.5;
      const dy = Math.sin(mid) * sep - u * H * 0.35;
      ctx.save();
      ctx.globalAlpha = 1 - u;
      ctx.beginPath();
      ctx.moveTo(cx + dx, cy + dy);
      ctx.arc(cx + dx, cy + dy, R + k, p.a0, p.a1);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(im, cx - R + dx, cy - R + dy, R * 2, R * 2);
      ctx.restore();
    }
  }
  ctx.restore();
};
const KN_NAKA = {
  tile: T,
  bg: "#1e1c1a",
  map: kGrid(14, 9, (c, r) => r < 2 || c >= 13),
  legend: K_LEGEND,
  drawGround: kImage("bg_naka", 14 * T, 9 * T),
  spawns: { door: { x: 6.5 * T, y: 8.3 * T, facing: "north" } },
  onEnter(api) {
    // 途中で出ていたら、木箱は台の上。ロケをはじめからやり直す
    if (api.flag("placed") && !api.flag("dashed")) api.later(400, () => knSetupStart(api));
  },
  drawOverlay(ctx, ox, oy, t, api) {
    // 窓の外の嵐: ときどき稲光が部屋を白く照らす
    const f = (t * 0.37) % 7;
    if (f < 0.12 || (f > 0.2 && f < 0.26)) {
      ctx.fillStyle = "rgba(236, 240, 255, 0.18)";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    // 暗転と設営(D389)
    const se = knSetupEl();
    if (se >= 0) {
      const a = se < KN_SETUP.dark ? se / KN_SETUP.dark : se < KN_SETUP.light ? 1 : Math.max(0, 1 - (se - KN_SETUP.light) / (KN_SETUP.end - KN_SETUP.light));
      ctx.fillStyle = `rgba(0, 0, 0, ${a})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    // カチンコ(番組名「ぼぎだぢクッキング」。ごろんが鳴らす)。絵は PixelLab の板と拍子木、字は板に書いてある(D389)
    const el = knCookEl();
    const board = api && api.image("k_clap_board");
    const stick = api && api.image("k_clap_stick");
    if (el >= 0 && el < KN_COOK.clap && board && stick) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      const W = ctx.canvas.width;
      const H = ctx.canvas.height;
      const k = Math.max(1, Math.floor((W * 0.45) / board.width)); // 画面の半分弱、整数倍で
      const bw = board.width * k;
      const bh = board.height * k;
      const bx = Math.round((W - bw) / 2);
      const by = Math.round((H - bh) / 2) + 10 * k;
      ctx.drawImage(board, bx, by, bw, bh);
      // 拍子木: はじめ開いていて、0.3 秒で閉じる。左はしの留め金が軸
      const a = el < 0.3 ? -0.5 * (1 - el / 0.3) : 0;
      ctx.translate(bx + 6 * k, by);
      ctx.rotate(a);
      ctx.drawImage(stick, -6 * k, -stick.height * k, stick.width * k, stick.height * k);
      ctx.restore();
    }
    knCutDraw(ctx, api, t); // ピザを 3 つに切る(D395)
  },
  triggers: [{ id: "toSancho", x: 5.55 * T, y: 8.75 * T, w: 1.9 * T, h: T, enabled: () => knS.cookT0 < 0, warp: { map: "sancho", spawn: "door" } }],
  objects: [
    // 絵(bg_naka)に合わせた壁: 北の壁のすそ、西の壁、東の壁、無線の机
    kWall(0, 64, 448, 92),
    kWall(0, 64, 28, 288),
    kWall(384, 64, 416, 288),
    kWall(33, 118, 119, 158),
    { id: "radio", x: 2 * T, y: 3.4 * T, w: 1, h: 1, headY: 30, draw() {} },
    {
      // 作業台(気象台の机を外に出した物)。木箱をのせると、ロケが始まる
      id: "table",
      x: KN_TABLE.x,
      y: KN_TABLE.y,
      w: 1,
      h: 1,
      headY: 40,
      solid: { w: 58, h: 14, dy: -6 },
      range: 44,
      draw(ctx, sx, sy, t, api) {
        knDraw(ctx, api.image("k_table"), sx, sy);
        if (api.flag("placed")) knDraw(ctx, api.image("k_crate"), sx + 40, sy + 2); // 置いた木箱(台のよこ)
        // 台の上のピザ(ロケの段に合わせて)
        const el = knCookEl();
        // ピザピール(D383): できたピザはピールにのる。きこりがピザだけつかんで飛び出したあと、ピールが台に残る
        const peelOnTable = el >= KN_COOK.basil && el < KN_COOK.grab; // ごろんがつかんで、追いかけていく(D394)
        if (peelOnTable) knDraw(ctx, api.image("k_peel"), sx + 4, sy - 17);
        if (el < 0) return;
        const C = KN_COOK;
        const px = sx;
        const py = sy - 21;
        const u = (a, b) => Math.max(0, Math.min(1, (el - a) / (b - a)));
        if (el < C.clap) return;
        if (el < C.knead) {
          // こねる: 丸い生地がつぶれては戻る
          const sq = Math.sin(el * 12);
          knEll(ctx, px, py, 5 + sq, 3.2 - sq * 0.8, KN_CRUST);
          knEll(ctx, px, py - 0.5, 4 + sq, 2.4 - sq * 0.8, KN_DOUGH);
        } else if (el < C.ball) knPizza(ctx, px + Math.sin(el * 7) * 1.5, py, 5, "ball");
        else if (el < C.press) knPizza(ctx, px, py, knLerp(5, 11, u(C.ball, C.press)), "flat");
        else if (el < C.toss3) return; // 宙にある(きこりの方で描く)
        else if (el < C.sauce) knPizza(ctx, px, py, 19, "sauce", u(C.toss3, C.sauce));
        else if (el < C.cheese) knPizza(ctx, px, py, 19, "cheese", u(C.sauce, C.cheese));
        else if (el < C.basil) knPizza(ctx, px, py, 19, "basil", u(C.cheese, C.basil));
        else if (el < C.basil + 0.6) knPizza(ctx, knLerp(px, px + 13, u(C.basil, C.basil + 0.6)), py - 1, 19 - 6 * u(C.basil, C.basil + 0.6), "done"); // ピールへすべらせる
        else if (el < C.crew + 0.35 * (C.bolt - C.crew)) knPizza(ctx, px + 13, py - 1, 13, "done"); // ピールの上
      },
      interact(api) {
        if (knS.cutT0 >= 0) {
          knCutPress(api); // 切っているあいだの A は、ミニゲームが受けとる
          return;
        }
        if (api.flag("pizza") && !api.flag("cut")) {
          knCutStart(api);
          return;
        }
        api.setFlag("placed");
        api.sfx("item");
        knSetupStart(api);
      },
      canInteract: (api) => (api.flag("boxed") && !api.flag("placed")) || (api.flag("pizza") && !api.flag("cut")),
    },
    {
      // きこり: 台の向こうでピザを作る。できたら掲げ、予報のあと、待ちきれずに飛び出す
      id: "kikori",
      x: KN_KIKORI_IN.x,
      y: KN_KIKORI_IN.y,
      w: 1,
      h: 1,
      headY: 40,
      hidden: (api) => api.flag("dashed"),
      draw(ctx, sx, sy, t, api) {
        const im = api.image("kikori");
        if (!im) return;
        const el = knCookEl();
        const C = KN_COOK;
        let x = sx;
        let y = sy;
        let flip = false;
        if (el < 0) y -= Math.abs(Math.sin(t * 9)) * 3; // 待っている: 落ち着きなく跳ねる
        else if (el < C.knead) y -= Math.abs(Math.sin(el * 12)) * 2; // こねる
        else if (el < C.press) y -= Math.abs(Math.sin(el * 7)) * 1.5;
        else if (el < C.toss3) {
          // 放り投げて回し、伸ばす(1 回 2 秒 × 3、だんだん大きく)
          const k = Math.floor((el - C.press) / 2);
          const v = ((el - C.press) % 2) / 2;
          y -= v < 0.15 || v > 0.85 ? 3 : 0;
          const rx = knLerp(11, 19, (k + v) / 3);
          const h = Math.sin(v * Math.PI) * (20 + k * 5);
          const spin = Math.abs(Math.cos(el * 16)); // 回っていて、横幅がふくらんだり縮んだり
          const dx = x;
          const dy = sy - 36 - h;
          knEll(ctx, dx, dy, rx * (0.55 + 0.45 * spin), 3, KN_CRUST);
          knEll(ctx, dx, dy - 0.5, rx * (0.55 + 0.45 * spin) - 1, 2, KN_DOUGH);
          // 生地が落ちるまで、手(体)は上を向いて待つ
        } else if (el < C.basil) y -= Math.abs(Math.sin(el * 5)) * 1;
        else if (el < C.crew) {
          // できあがり。ピールの上のピザを見つめて、予報を聞く
          y -= Math.abs(Math.sin(el * 4)) * 1;
        } else if (el < C.bolt) {
          // 待ちきれない: 身ぶるいして、戸口へ駆け出す
          const v = (el - C.crew) / (C.bolt - C.crew);
          if (v < 0.35) x += Math.round(Math.sin(el * 60) * 1.5);
          else {
            const [ax, ay] = knAlong([[KN_KIKORI_IN.x, KN_KIKORI_IN.y], [5.0 * T, 6.0 * T], [KN_DOOR_IN.x, KN_DOOR_IN.y]], (v - 0.35) / 0.65);
            x = sx + ax - this.x;
            y = sy + ay - this.y - Math.abs(Math.sin(el * 18)) * 3;
            flip = true;
          }
        } else return;
        knDraw(ctx, im, x, y, { flip });
        if (el >= C.crew + 0.35 * (C.bolt - C.crew)) knPizza(ctx, x, y - im.height - 3, 13, "done"); // ピールからピザだけつかんで掲げる
      },
      range: 40,
      interact: (api) => {
        api.sfx("oink");
        api.bubble("kikori", "ピザ", 900);
      },
      canInteract: () => knCookEl() < 0,
    },
    {
      // ききこり(カメラ係): 台の方を向いて撮る。できたら外へ
      id: "kikikori",
      x: 6.0 * T,
      y: 7.1 * T,
      w: 1,
      h: 1,
      headY: 46,
      hidden: (api) => api.flag("dashed"),
      draw(ctx, sx, sy, t, api) {
        const el = knCookEl();
        let x = sx;
        let y = sy;
        const C = KN_COOK;
        if (el >= C.chase) {
          // きこりを追いかけて、戸口へ走る(D394)
          const u = (el - C.chase) / (C.end - C.chase - 0.2);
          if (u >= 1) return;
          x = knLerp(sx, KN_DOOR_IN.x - this.x + sx, u);
          y = knLerp(sy, KN_DOOR_IN.y - this.y + sy, u) - Math.abs(Math.sin(el * 16)) * 2.5;
        }
        knDraw(ctx, knCrew(api, "kikikori", el >= C.chase ? -1 : 1), x, y); // 台の方(東)を向いて撮る。戸口へは西へ
      },
    },
    {
      // ブラウン管のテレビ(D389): 撮った映像、「ぼぎだぢクッキング」のタイトル画がちらつく。調べると一枚絵
      id: "tv",
      x: KN_TV.x,
      y: KN_TV.y,
      w: 1,
      h: 1,
      headY: 44,
      range: 44,
      solid: { w: 40, h: 8, dy: -4 },
      hidden: (api) => !api.image("k_tv"), // 絵ができるまで出さない
      draw(ctx, sx, sy, t, api) {
        const im = api.image("k_tv");
        if (!im) return;
        knDraw(ctx, im, sx, sy);
        // 画面のちらつき(走査線のような横すじと、明るさのゆれ)
        const x0 = Math.round(sx - im.width / 2) + KN_TV_SCREEN.x;
        const y0 = Math.round(sy - im.height) + KN_TV_SCREEN.y;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.06 + 0.06 * Math.abs(Math.sin(t * 23))})`;
        ctx.fillRect(x0, y0, KN_TV_SCREEN.w, KN_TV_SCREEN.h);
        ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        const r = Math.floor(t * 30) % KN_TV_SCREEN.h;
        ctx.fillRect(x0, y0 + r, KN_TV_SCREEN.w, 1);
      },
      interact: (api) => api.show("v_title"),
    },
    {
      // 照明(D389、仮の絵): 暗転のあいだに立つ。作業台を照らす
      id: "light",
      x: 5.3 * T,
      y: 4.1 * T,
      w: 1,
      h: 1,
      hidden: (api) => !api.flag("placed") || (knSetupEl() >= 0 && knSetupEl() < KN_SETUP.dark),
      draw(ctx, sx, sy, t, api) {
        ctx.fillStyle = "#1e1e22";
        ctx.fillRect(sx - 5, sy - 1, 11, 2); // 足
        ctx.fillRect(sx - 1, sy - 30, 3, 30); // 柱
        ctx.fillStyle = "#9a9aa2";
        ctx.fillRect(sx - 5, sy - 37, 10, 8); // 灯具
        ctx.fillStyle = "#1e1e22";
        ctx.fillRect(sx - 5, sy - 37, 10, 1);
        const on = knCookEl() >= 0 || knSetupEl() >= KN_SETUP.light;
        ctx.fillStyle = on ? "#fff4cc" : "#8a8a8e";
        ctx.fillRect(sx + 3, sy - 34, 2, 3); // 光る面(台の方 = 東)
        if (on) {
          const g = ctx.createRadialGradient(sx + 30, sy - 12, 2, sx + 30, sy - 12, 34);
          g.addColorStop(0, "rgba(255, 244, 200, 0.22)");
          g.addColorStop(1, "rgba(255, 244, 200, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(sx - 6, sy - 48, 72, 72);
        }
      },
    },
    {
      // ロケのあと(きこりが消えたあと)、撮影隊は中でピザを食べている(D388。「スタッフがおいしくいただきました」。言葉は出さない)
      // D389: 撮った映像をテレビで見ながら。オロオロしてから中へ入るので、外にいるあいだは出さない
      // 作業台に何切れか欠けたピザ。ききこりとごろんが一切れずつ持って、もぐもぐ。話しかけると、もぐもぐが少し速くなるだけ
      id: "crewEat",
      x: KN_TABLE.x,
      y: KN_TABLE.y + 2,
      w: 1,
      h: 1,
      headY: 40,
      range: 70,
      fastUntil: 0,
      // D395: きこりが消えたあと、撮影隊は中でテレビを見て待つ。きーが運んできたきこりのピザを切り分けると、
      // 大きい切れから取って、食べる(「スタッフがおいしくいただきました」D388。言葉なし)
      hidden: (api) => !api.flag("gone") || (knS.goneT0 >= 0 && knNow() - knS.goneT0 < KN_ORO.end),
      draw(ctx, sx, sy, t, api) {
        const fast = knNow() < this.fastUntil ? 2.2 : 1;
        const ate = api.flag("cut");
        const eat = (key, x, y, d, ph, mouthY) => {
          const chew = ate ? Math.floor((t * 6 * fast + ph) % 2) : 0; // 1 ドット上下
          knDraw(ctx, knCrew(api, key, d), x, y - chew);
          if (!ate) return;
          // 口の前に、こげたピザのひと切れ(耳が外がわ、とがった方が口へ)
          const hx = Math.round(x + d * 9);
          const hy = Math.round(y - mouthY - chew);
          for (let k = 0; k < 7; k++) {
            const w = 7 - k;
            ctx.fillStyle = k === 0 ? "#3a2416" : k % 3 === 1 ? "#2a1a10" : "#a8361f";
            ctx.fillRect(hx - d * k, hy - Math.ceil(w / 2), 1, w);
          }
          ctx.fillStyle = "#e9c46a";
          ctx.fillRect(hx - d * 3, hy - 1, 1, 1);
        };
        eat("goron", sx + (KN_TV.x - 1.1 * T - this.x), sy + (KN_TV.y + 1.25 * T - this.y), 1, 1, 17);
        eat("kikikori", sx + (KN_TV.x + 1.2 * T - this.x), sy + (KN_TV.y + 1.1 * T - this.y), -1, 0, 26);
      },
      interact() {
        this.fastUntil = knNow() + 1.5;
      },
      canInteract: (api) => api.flag("cut") && knS.cutT0 < 0,
    },
    {
      // ごろん(ディレクター): カチンコを鳴らす。できたら外へ
      id: "goron",
      x: 9.4 * T,
      y: 6.3 * T,
      w: 1,
      h: 1,
      headY: 36,
      hidden: (api) => api.flag("dashed"),
      draw(ctx, sx, sy, t, api) {
        const el = knCookEl();
        let x = sx;
        let y = sy;
        const C = KN_COOK;
        let peel = false;
        if (el >= C.chase) {
          // 台のピールをつかんで(D394)、きこりを追いかけて戸口へ
          const u = Math.min(1, (el - C.chase) / (C.end - C.chase));
          if (u >= 1) return;
          const [ax, ay] = knAlong([[this.x, this.y], [KN_TABLE.x + 0.9 * T, KN_TABLE.y + 0.6 * T], [KN_DOOR_IN.x, KN_DOOR_IN.y]], u);
          x = sx + ax - this.x;
          y = sy + ay - this.y - Math.abs(Math.sin(el * 16)) * 2.5;
          peel = el >= C.grab;
        }
        knDraw(ctx, knCrew(api, "goron", -1), x, y); // 台の方(西)を向く。戸口へも西へ
        if (peel) knPeelHeld(ctx, x, y, -1);
      },
    },
  ],
};

// ---- 山頂: 撮影隊は外で準備、きこりはベネラへ(D379〜D381) ----
const KN_VENERA = { x: 17.2 * T, y: 8.0 * T }; // ベネラ 7 号の足もと(さかいの向こう、焼けた地面。D382)
const KN_WINDOW = { x: KN_VENERA.x + KN_MOUTH_DX, y: KN_VENERA.y + KN_MOUTH_DY }; // ふたの飛んだ口(ピザ窯の口に見える)
const KN_RUN = { run: 1.8, leap: 2.6, char: 4.6, melt: 7.0, pop: 7.4, end: 7.6 };
const KN_PEEL = { reach: 0.8, in: 1.2, back: 2.0 }; // ピールをのばして、口から焼けたピザを取り出す(秒)
let knPeelT0 = -1;
const KN_DOOR_OUT = { x: 5.35 * T, y: 3.75 * T };
const knRunEl = () => (knS.phase === "run" ? knNow() - knS.t0 : -1);
const KN_ORO = { oro: 4.0, end: 7.0 }; // きこりが消えてから: オロオロ / ピールを置いて、戸口に着いて中へ
// 撮影隊が追いかけて止まる所(熱ではじかれる線の手前。D394)と、ごろんがピールを置く所
const KN_CHASE_K = { x: KN_HEAT_X - 0.7 * T, y: 7.3 * T };
const KN_CHASE_G = { x: KN_HEAT_X - 1.2 * T, y: 8.1 * T };
const KN_PEEL_DROP = { x: KN_CHASE_G.x + 0.6 * T, y: KN_CHASE_G.y + 0.2 * T };
// 前に持ったピール(柄の先に丸い板)。d は向き
const knPeelHeld = (ctx, x, y, d) => {
  const hx = x + d * 7;
  const hy = y - 12;
  ctx.strokeStyle = "#6e4c28";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx + d * 14, hy);
  ctx.stroke();
  ctx.strokeStyle = "#c4965f";
  ctx.lineWidth = 1;
  ctx.stroke();
  knEll(ctx, hx + d * 20, hy, 7, 4, "#6e4c28");
  knEll(ctx, hx + d * 20, hy, 6, 3, "#c4965f");
};
const KN_SANCHO = {
  tile: T,
  bg: "#5e5a54",
  map: kGrid(20, 12, (c, r) => r < 3 || r > 10 || c >= 15 || (c === 0 && (r < 5 || r > 8))),
  legend: K_LEGEND,
  drawGround: kImage("bg_sancho", 20 * T, 12 * T),
  spawns: {
    west: { x: 1 * T, y: 6.5 * T, facing: "east" },
    door: { x: 5.35 * T, y: 4.0 * T, facing: "south" },
  },
  onEnter(api) {
    if (api.flag("dashed") && !api.flag("gone") && knS.phase !== "run") {
      knS.phase = "run";
      knS.t0 = knNow();
      const R = KN_RUN;
      api.camPath([
        { t: 0, x: 6.5 * T, y: 4.8 * T, z: 1 },
        { t: R.run, x: 12.8 * T, y: 6.8 * T, z: 1 },
        { t: R.leap, x: 15.6 * T, y: 6.6 * T, z: 1.3 },
        { t: R.end + 0.4, x: 15.2 * T, y: 6.9 * T, z: 1.3 },
      ]);
      api.later(R.leap * 1000 - 200, () => api.sfx("pop"));
      api.later(R.char * 1000 - 1500, () => api.sfx("whir"));
      api.later(R.melt * 1000, () => {
        knS.phase = "gone";
        knS.goneT0 = knNow();
        api.setFlag("gone");
      });
      // 金星は、ほかの星と逆向きに、ゆっくり回っている。きーも、逆向きにくるっと回る(まわる D203。能力としてはやめ D226、回る姿だけが残る)
      api.later((R.end + 1.4) * 1000, () => api.spin());
    }
  },
  debug: () => Object.assign({ now: knNow(), runEl: knRunEl(), cookEl: knCookEl() }, knS),
  // 熱い風(D201)はやめた(D391)。さかいの手前で、熱くてはじき返される(heat)
  drawOverlay(ctx, ox, oy, t) {
    // 金星の熱: 東から黄色い光
    const g = ctx.createLinearGradient(ox + 12 * T, 0, ox + 20 * T, 0);
    g.addColorStop(0, "rgba(255, 200, 90, 0)");
    g.addColorStop(1, "rgba(255, 200, 90, 0.4)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    knStorm(ctx, t, 0.22, ox + KN_EDGE); // 雨はさかいの左だけ(D381)
    knHaze(ctx, ox + KN_EDGE, t, 2); // 陽炎(D381)
  },
  triggers: [
    { id: "toSando", x: -T, y: 5 * T, w: 1.6 * T, h: 4 * T, enabled: () => knS.phase !== "run", warp: { map: "sando", spawn: "east" } },
    // 気象台の戸口(建物の下のふちの、まん中の黒い戸)
    { id: "toNaka", x: 4.95 * T, y: 3.2 * T, w: 0.85 * T, h: 0.55 * T, enabled: () => knS.phase !== "run", warp: { map: "naka", spawn: "door" } },
  ],
  objects: [
    // 背景の前後(作者「背景の前後」): 百葉箱と風の塔は、背景から切り抜いた絵(fg_sancho。docs/assets/kinsei/fg_kinsei.py)を根元の y で前後させる
    kFg("fg_sancho", 298, 104, 45, 74, 176),
    kFg("fg_sancho", 364, 18, 36, 95, 111),
    kWall(300, 166, 343, 177), // 百葉箱の脚
    kWall(374, 104, 389, 112), // 風の塔の根元
    kWall(86, 96, 158, 106), // 気象台の建物の下のふち(戸口の左)
    kWall(184, 96, 256, 106), // 戸口の右
    kTrace("t_sticker", "t_sticker", 6.7 * T, 3.4 * T, -12), // 気象台の白い壁に、色あせた太陽のシール
    knImg("venera", KN_VENERA.x, KN_VENERA.y, {
      // ベネラの着陸機(三面図 K1)。窓の中が赤く光り、ピザ窯の口に見える(言葉では言わない)
      draw(ctx, sx, sy, t, api) {
        knDraw(ctx, api.image("venera"), sx, sy);
        const el = knRunEl();
        const flare = el > KN_RUN.leap && el < KN_RUN.melt ? 1 - (el - KN_RUN.leap) / (KN_RUN.melt - KN_RUN.leap) : 0;
        const a = 0.18 + Math.sin(t * 3) * 0.08 + flare * 0.5;
        const cx = sx;
        const cy = sy - 30;
        const gg = ctx.createRadialGradient(cx, cy, 1, cx, cy, 14 + flare * 10);
        gg.addColorStop(0, `rgba(255, 140, 60, ${a})`);
        gg.addColorStop(1, "rgba(255, 120, 40, 0)");
        ctx.fillStyle = gg;
        ctx.fillRect(cx - 26, cy - 26, 52, 52);
      },
    }),
    {
      // 撮影隊: ロケのあと、さかいの手前で三脚を立てて準備している
      id: "crewOut",
      x: KN_CHASE_G.x,
      y: KN_CHASE_G.y,
      w: 1,
      h: 1,
      // D394: きこりを追いかけて、戸口から、さかいの手前まで走る(ごろんはピールを持つ)→ きこりが消える →
      // 4 秒ほどオロオロ → ごろんがピールをその場に置き、あきらめて戸口へ歩いて中へ(中では別のピザを食べている D388)
      hidden: (api) => !api.flag("dashed") || (api.flag("gone") && (knS.goneT0 < 0 || knNow() - knS.goneT0 > KN_ORO.end)),
      draw(ctx, sx, sy, t, api) {
        const ox = sx - this.x;
        const oy = sy - this.y;
        const re = knRunEl();
        const ge = api.flag("gone") && knS.goneT0 >= 0 ? knNow() - knS.goneT0 : -1;
        const crew = [
          ["kikikori", KN_CHASE_K, 0.4, 0, false],
          ["goron", KN_CHASE_G, 0.7, 1.7, true],
        ];
        for (const [key, at, delay, ph, carry] of crew) {
          let x = ox + at.x;
          let y = oy + at.y;
          let dir = 1;
          let peel = carry;
          if (re >= 0) {
            // 追いかける(戸口から出てくるのは、きこりより少しおくれて)
            if (re < delay) continue;
            const u = Math.min(1, (re - delay) / 2.4);
            const [ax, ay] = knAlong([[KN_DOOR_OUT.x, KN_DOOR_OUT.y], [8 * T, 5.8 * T], [11 * T, 6.9 * T], [at.x, at.y]], u);
            x = ox + ax;
            y = oy + ay - (u < 1 ? Math.abs(Math.sin(re * 16 + ph)) * 2.5 : 0);
          } else if (ge >= 0 && ge < KN_ORO.oro) {
            const w = Math.sin(ge * 3.1 + ph);
            x += w * 0.6 * T;
            y -= Math.abs(Math.sin(ge * 11 + ph)) * 3;
            dir = Math.cos(ge * 3.1 + ph) >= 0 ? 1 : -1;
          } else if (ge >= KN_ORO.oro) {
            const u = Math.min(1, (ge - KN_ORO.oro) / (KN_ORO.end - KN_ORO.oro));
            x = knLerp(x, ox + KN_DOOR_OUT.x, u);
            y = knLerp(y, oy + KN_DOOR_OUT.y, u) - Math.abs(Math.sin(ge * 8 + ph)) * 1.5;
            dir = -1;
            peel = false; // ピールは、その場に置いていく
          }
          knDraw(ctx, knCrew(api, key, dir), x, y);
          if (peel) knPeelHeld(ctx, x, y, dir);
        }
      },
    },
    {
      // 撮影隊が置いていったピール(D394)。拾うと頭にのせて運び、さかいの手前から口へのばして、きこりのピザを取り出す(D383)
      id: "peelGround",
      x: KN_PEEL_DROP.x,
      y: KN_PEEL_DROP.y,
      w: 1,
      h: 1,
      headY: 16,
      range: 38,
      hidden: (api) => !api.flag("gone") || api.flag("peel") || (knS.goneT0 >= 0 && knNow() - knS.goneT0 < KN_ORO.oro),
      draw(ctx, sx, sy, t, api) {
        knDraw(ctx, api.image("k_peel"), sx, sy);
      },
      interact(api) {
        api.setFlag("peel");
        api.sfx("item");
      },
    },
    {
      // 金星の熱(D391): さかいの手前まで来ると、熱くて、ぴょんとはじき返される。いつでも(荷物を持っていても)。言葉なし
      // 熱の中へ突っこめるのは、きこりだけ。焼けたピザは、ここからピールをのばして取り出す(D383)
      id: "heat",
      x: KN_HEAT_X,
      y: 7 * T,
      w: 1,
      h: 1,
      hitT: -9,
      draw() {},
      update(dt, t, api) {
        if (knS.phase === "run") return;
        const p = api.player();
        if (p.x < KN_HEAT_X) return;
        api.knock(-240, 0);
        if (t - this.hitT > 0.6) {
          this.hitT = t;
          api.sfx("pop");
        }
      },
      drawOver(ctx, sx, sy, t, api) {
        const e = t - this.hitT;
        if (e < 0 || e > 1.1) return;
        const p = api.player();
        const px = Math.round(sx - this.x + p.x);
        const py = Math.round(sy - this.y + p.y);
        const a = Math.max(0, 1 - e / 1.1);
        // きーが赤くほてる
        ctx.fillStyle = `rgba(255, 70, 40, ${0.45 * a})`;
        ctx.beginPath();
        ctx.ellipse(px, py - 9, 11, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        // 湯気が三すじ、のぼって消える
        for (let k = 0; k < 3; k++) {
          const v = Math.min(1, e / 1.1 + k * 0.12);
          ctx.fillStyle = `rgba(240, 240, 236, ${0.8 * a})`;
          ctx.fillRect(px - 6 + k * 5 + Math.round(Math.sin(t * 9 + k) * 1.5), py - 20 - Math.round(v * 14), 2, 3);
        }
      },
    },
    // 見届け: きこりが消えたあと、ちりんの音が止むまでそばにいる(D189)
    kWatch({ id: "w_chirin", x: 13.2 * T, y: 7 * T, r: 2.2 * T, sec: 6, lure: "200, 230, 255", when: (api) => api.flag("gone") }),
    {
      id: "knctl",
      x: -100,
      y: -100,
      w: 1,
      h: 1,
      draw() {},
      last: 0,
      update(dt, t, api) {
        // ちりんは、きこりが消えたあと、いつもと違う音で鳴り続ける(仮)
        if (api.flag("gone") && !api.flag("observed") && t - this.last > 3.5) {
          this.last = t;
          api.bubble("chirin", "チリ　リ……", 1800);
        }
      },
    },
    {
      // きこり: 戸口から飛び出し、ピザを持ってさかいへ走り、ベネラの窓へ飛びこむ → こげて煙 → 陽炎の向こうで見えなくなる
      id: "kikoriOut",
      x: KN_DOOR_OUT.x,
      y: KN_DOOR_OUT.y,
      w: 1,
      h: 1,
      headY: 40,
      hidden: () => knS.phase !== "run",
      draw() {},
      // ベネラより手前に描く(足もとの y で前後を決めると、窓に飛びこんだところがベネラの裏に隠れる)
      drawOver(ctx, sx, sy, t, api) {
        const im = api.image("kikori");
        if (!im) return;
        const el = knRunEl();
        const R = KN_RUN;
        const ox = sx - this.x;
        const oy = sy - this.y;
        let x;
        let y;
        let o = { t };
        let pizza = true;
        if (el < R.run) {
          [x, y] = knAlong([[KN_DOOR_OUT.x, KN_DOOR_OUT.y], [8 * T, 5.6 * T], [12 * T, 6.4 * T], [14.4 * T, 7.0 * T]], el / R.run);
          y -= Math.abs(Math.sin(el * 18)) * 3;
        } else if (el < R.leap) {
          // 窓へ、跳ねるように飛びこむ
          const u = (el - R.run) / (R.leap - R.run);
          x = knLerp(14.4 * T, KN_WINDOW.x - 2, u);
          y = knLerp(7.0 * T, KN_WINDOW.y + 16, u) - Math.sin(u * Math.PI) * 30;
        } else if (el < R.char) {
          // 窓に頭から突っこんだまま、黒くこげていく。煙
          const u = (el - R.leap) / (R.char - R.leap);
          x = KN_WINDOW.x - 2 + Math.round(Math.sin(el * 40) * (1 - u));
          y = KN_WINDOW.y + 16;
          o = { t, tint: `rgba(24, 16, 12, ${0.25 + u * 0.7})` };
          pizza = u < 0.3;
          for (let k = 0; k < 5; k++) {
            const v = (el * 0.8 + k * 0.2) % 1;
            const r = 2 + v * 5;
            ctx.fillStyle = `rgba(70, 66, 62, ${0.6 * (1 - v)})`;
            ctx.fillRect(Math.round(ox + x - 4 + Math.sin(k * 2 + el * 3) * 4 - r / 2), Math.round(oy + y - im.height - v * 26 - r / 2), Math.round(r), Math.round(r));
          }
        } else if (el < R.melt) {
          // 陽炎の向こうで、ゆらいで見えなくなる(溶ける瞬間は見せない)
          const u = (el - R.char) / (R.melt - R.char);
          x = KN_WINDOW.x - 2 + u * 0.4 * T;
          y = KN_WINDOW.y + 16;
          o = { t, tint: "rgba(24, 16, 12, 0.95)", alpha: 1 - u, wob: 2 + u * 5 };
          pizza = false;
        } else {
          x = null;
        }
        if (x !== null) {
          knDraw(ctx, im, ox + x, oy + y, o);
          if (pizza) knPizza(ctx, ox + x, oy + y - im.height - 3, 13, "done");
        }
      },
    },
    knImg("chirin", 3.4 * T, 4.9 * T, {
      // ちりん: 外で待つ。きこりが飛び出すと、さかいの手前まで追う
      draw(ctx, sx, sy, t, api) {
        const im = api.image("chirin");
        if (!im) return;
        const gone = api.flag("gone");
        let x = sx;
        let y = sy;
        const el = knRunEl();
        if (gone || el >= 0) {
          const u = gone ? 1 : Math.max(0, Math.min(1, (el - 0.5) / 2.2));
          x = knLerp(sx, 13.4 * T - this.x + sx, u);
          y = knLerp(sy, 6.8 * T - this.y + sy, u);
        }
        x += Math.sin(t * (gone ? 9 : 3)) * (gone ? 3 : 1.5);
        knDraw(ctx, im, x, y - 6);
      },
      update(dt, t, api) {
        // 吹き出しの位置(headY)を、追いかけた先に合わせる
        if (api.flag("gone")) Object.assign(this, { x: 13.4 * T, y: 6.8 * T });
      },
      range: 40,
      interact: (api) => api.bubble("chirin", api.flag("gone") ? "チリ　リ……" : "チリーン", 1400),
    }),
    {
      // 焼けたピザはベネラの口の中(D383)。さかいの手前でベネラの方を向いて調べると、ピールがのびて取り出す
      id: "oven",
      x: 14.25 * T,
      y: 7.3 * T,
      w: 1,
      h: 1,
      headY: 30,
      // 調べる点は、熱ではじかれる線の手前、ちりんより南(D391。ちりんと同じ所だと、ちりんが先に答えた)
      ix: KN_HEAT_X - 0.3 * T - 14.25 * T,
      iy: 0.9 * T,
      range: 34,
      draw() {},
      drawOver(ctx, sx, sy, t, api) {
        const ox = sx - this.x;
        const oy = sy - this.y;
        const mx = ox + KN_WINDOW.x;
        const my = oy + KN_WINDOW.y;
        // 口の中の焼けたピザ(まだ取り出していないとき)と、細い煙
        const inside = api.flag("gone") && !api.flag("pizza") && knPeelT0 < 0;
        if (inside) {
          knPizza(ctx, mx, my + 1, 6, "burnt");
          for (let k = 0; k < 2; k++) {
            const v = (t * 0.6 + k * 0.5) % 1;
            ctx.fillStyle = `rgba(90, 84, 78, ${0.5 * (1 - v)})`;
            ctx.fillRect(Math.round(mx - 2 + k * 4 + Math.sin(t * 3 + k) * 2), Math.round(my - 6 - v * 16), 2, 3);
          }
        }
        if (knPeelT0 < 0) return;
        // ピールがのびる → 口に入る → 焼けたピザをのせて戻る
        const el = knNow() - knPeelT0;
        const P = KN_PEEL;
        const pl = api.player();
        const hx = ox + pl.x + 6;
        const hy = oy + pl.y - 12;
        const u = el < P.reach ? el / P.reach : el < P.in ? 1 : Math.max(0, 1 - (el - P.in) / (P.back - P.in));
        const ex = knLerp(hx + 14, mx, u);
        const ey = knLerp(hy, my, u);
        ctx.strokeStyle = "#6e4c28";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.strokeStyle = "#c4965f";
        ctx.lineWidth = 1;
        ctx.stroke();
        knEll(ctx, ex, ey, 7, 4, "#6e4c28");
        knEll(ctx, ex, ey, 6, 3, "#c4965f");
        if (el >= P.in - 0.1) knPizza(ctx, ex, ey - 1, 6, "burnt");
      },
      // 取り出したかは、持ち物ではなく旗で見る(前の版で持ち帰った電池が焼けたピザに替わっていると、持ち物で見ると、ピールもピザも出なかった)
      canInteract: (api) => api.flag("gone") && api.flag("peel") && !api.flag("pizza") && knPeelT0 < 0,
      interact(api) {
        api.face("east");
        knPeelT0 = knNow();
        api.freeze(KN_PEEL.back + 0.1);
        api.sfx("whir");
        api.later(KN_PEEL.in * 1000, () => api.sfx("pop"));
        api.later(KN_PEEL.back * 1000, () => {
          knPeelT0 = -1;
          // ピールにのせたまま、気象台の中の作業台へ運ぶ(D395)。おみやげは、切り分けて残ったひと切れ
          api.hold("ic_pizza", 1.8, () => api.setFlag("pizza"));
        });
      },
    },
    {
      // 百葉箱(D382、D383): 調べると、こわれた温度計の一枚絵。言葉なし。いつでも
      id: "hyakuyo",
      x: 10.0 * T,
      y: 5.6 * T,
      w: 1,
      h: 1,
      headY: 70,
      range: 44,
      draw() {},
      interact: (api) => api.show("v_thermo"),
    },
  ],
};
