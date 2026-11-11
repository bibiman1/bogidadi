// 断片: きこりと金星(気象台の中、ピザ)。kinsei.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";

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
        const x0 = Math.round(sx - im.width / 2) + KN_TV_SCREEN.x;
        const y0 = Math.round(sy - im.height) + KN_TV_SCREEN.y;
        // D400: タイトル画が映るのは、ピザを切ったあと。それまでは消えている(暗いガラス)
        if (!api.flag("cut")) {
          ctx.fillStyle = "#26292c";
          ctx.fillRect(x0, y0, KN_TV_SCREEN.w, KN_TV_SCREEN.h);
          ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
          ctx.fillRect(x0 + 3, y0 + 2, 4, 1);
          ctx.fillRect(x0 + 2, y0 + 3, 1, 3);
          return;
        }
        // 画面のちらつき(走査線のような横すじと、明るさのゆれ)
        ctx.fillStyle = `rgba(255, 255, 255, ${0.06 + 0.06 * Math.abs(Math.sin(t * 23))})`;
        ctx.fillRect(x0, y0, KN_TV_SCREEN.w, KN_TV_SCREEN.h);
        ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        const r = Math.floor(t * 30) % KN_TV_SCREEN.h;
        ctx.fillRect(x0, y0 + r, KN_TV_SCREEN.w, 1);
      },
      interact: (api) => api.show("v_title"),
      canInteract: (api) => api.flag("cut"), // 消えているあいだは調べられない(D400)
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
