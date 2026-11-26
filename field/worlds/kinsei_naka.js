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
// ---- 戻ってきたぴーの、うまく焼けた回(D829): 気象台の中へ持ち帰り、撮影隊と三人で分ける。切り方は縦の雑な 2 本 ----
const KP2I = { door: [208, 268], stand: [222, 160], walk: 2.0, put: 0.8, cut: 1.5, sep: 0.6, give: 1.0, eat: 4.0 };
const KP2I_CUTS = [3, 8]; // ピザ(rx 13)のまん中からの、縦の 2 本の位置。三等分の所(±4.3)に当ててから、東へずらして切る(D830: 自分の分を大きく)
const KP2I_CUT0 = [-4.3, 4.3];
// 切る線の、いまの横の位置と、下まで入った割合
const kp2Knife = (j, u) => {
  const t0 = j ? KP2I_T.cut2 : KP2I_T.cut1;
  const v = (u - t0) / KP2I.cut;
  const m = Math.max(0, Math.min(1, (v - 0.3) / 0.25));
  return { v, x: KP2I_CUT0[j] + (KP2I_CUTS[j] - KP2I_CUT0[j]) * m, down: Math.max(0, Math.min(1, (v - 0.6) / 0.35)) };
};
const kp2InT = () => {
  if (typeof kp2State !== "function") return -1;
  const st = kp2State();
  return st.p.name === "inside" ? st.tc - st.p.t : -1;
};
// 段の秒(はじめ)
const KP2I_T = (() => {
  const C = KP2I;
  const t = { walkIn: 0.2 };
  t.put = t.walkIn + C.walk;
  t.cut1 = t.put + C.put;
  t.cut2 = t.cut1 + C.cut;
  t.sep = t.cut2 + C.cut;
  t.give1 = t.sep + C.sep;
  t.give2 = t.give1 + C.give;
  t.eat = t.give2 + C.give;
  t.walkOut = t.eat + C.eat;
  t.end = t.walkOut + C.walk;
  return t;
})();
// ピザを作る(todo 364): ロケのきこりと同じ手順を、ぴーがまねる。段の秒
const KP2I_MK = { knead: 2.4, ball: 0.8, press: 1.0, toss: 4.8, sauce: 1.4, cheese: 1.4, basil: 1.0, slide: 0.6 };
const KP2I_MKLEN = Object.values(KP2I_MK).reduce((a, b) => a + b, 0);
// 気象台の中の段(焼けた回: 分けて食べてから作る / 焦げた回: 入って台へ歩き、作る)。どちらも最後にピールにのせて出ていく
const KP2I_TLG = (() => {
  const t = Object.assign({}, KP2I_T, { good: true });
  t.make = KP2I_T.walkOut;
  t.out = t.make + KP2I_MKLEN;
  t.end = t.out + KP2I.walk;
  return t;
})();
const KP2I_TLB = (() => {
  const N = 1e9;
  const t = { good: false, walkIn: 0.2, put: 0.2 + KP2I.walk, cut1: N, cut2: N, sep: N, give1: N, give2: N, eat: N };
  t.make = t.put;
  t.out = t.make + KP2I_MKLEN;
  t.end = t.out + KP2I.walk;
  return t;
})();
const kp2TL = () => (typeof kp2State === "function" && kp2State().good ? KP2I_TLG : KP2I_TLB);
// 作っている台の上のピザ(mu は作りはじめからの秒)。宙にある生地は null を返す
const kp2MakeDraw = (ctx, px, py, mu, sx, sy, t) => {
  const M = KP2I_MK;
  let a = 0;
  const seg = (k) => {
    const s0 = a;
    a += M[k];
    return [s0, a];
  };
  const [k0, k1] = seg("knead");
  const [b0, b1] = seg("ball");
  const [p0, p1] = seg("press");
  const [t0, t1] = seg("toss");
  const [s0, s1] = seg("sauce");
  const [c0, c1] = seg("cheese");
  const [z0, z1] = seg("basil");
  const u = (x0, x1) => Math.max(0, Math.min(1, (mu - x0) / (x1 - x0)));
  if (mu < k1) {
    const sq = Math.sin(mu * 12);
    knEll(ctx, px, py, 5 + sq, 3.2 - sq * 0.8, KN_CRUST);
    knEll(ctx, px, py - 0.5, 4 + sq, 2.4 - sq * 0.8, KN_DOUGH);
  } else if (mu < b1) knPizza(ctx, px + Math.sin(mu * 7) * 1.5, py, 5, "ball");
  else if (mu < p1) knPizza(ctx, px, py, knLerp(5, 11, u(p0, p1)), "flat");
  else if (mu < t1) {
    // 放り投げて回し、伸ばす(3 回、だんだん大きく)。ぴーの頭の上で
    const per = M.toss / 3;
    const k = Math.floor((mu - t0) / per);
    const v = ((mu - t0) % per) / per;
    const rx = knLerp(11, 19, (k + v) / 3);
    const h = Math.sin(v * Math.PI) * (18 + k * 5);
    const spin = Math.abs(Math.cos(mu * 16));
    knEll(ctx, sx, sy - 34 - h, rx * (0.55 + 0.45 * spin), 3, KN_CRUST);
    knEll(ctx, sx, sy - 34.5 - h, rx * (0.55 + 0.45 * spin) - 1, 2, KN_DOUGH);
  } else if (mu < s1) knPizza(ctx, px, py, 19, "sauce", u(s0, s1));
  else if (mu < c1) knPizza(ctx, px, py, 19, "cheese", u(c0, c1));
  else if (mu < z1) knPizza(ctx, px, py, 19, "basil", u(z0, z1));
  else knPizza(ctx, knLerp(px, sx, u(z1, z1 + M.slide)), knLerp(py, sy - 26, u(z1, z1 + M.slide)), 19 - 6 * u(z1, z1 + M.slide), "basil"); // ピールへすべらせる
};
const KP2I_MOUTH = { goron: [297, 133], kikikori: [353, 120] };
const KP2I_MID = [-5.5, 5.5, 11]; // 切れごとの、ピザのまん中からの横のずれ(口や手に合わせるとき引く)
// 切れ i(0 = 左、1 = まん中、2 = 右)を描く。clip で、縦の 2 本のあいだだけ
const kp2Piece = (ctx, i, x, y, rx) => {
  const xs = [-rx - 1, KP2I_CUTS[0], KP2I_CUTS[1], rx + 1];
  ctx.save();
  ctx.beginPath();
  ctx.rect(Math.round(x + xs[i]), y - rx, xs[i + 1] - xs[i], rx * 2);
  ctx.clip();
  knPizza(ctx, x, y, rx, "done");
  ctx.restore();
};
// 上から見たピザに縦の 2 本(寄りの絵。きーが切ったときと同じ見え方 D830)
const kp2Zoom = (ctx, api, u) => {
  const T0 = KP2I_T;
  if (u < T0.cut1 - 0.2 || u > T0.sep + 0.4) return;
  const im = api.image("k_pizza_top");
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
  ctx.drawImage(im, cx - R, cy - R, R * 2, R * 2);
  ctx.fillStyle = "#1c120a";
  KP2I_CUTS.forEach((c, j) => {
    const kn = kp2Knife(j, u);
    if (kn.v < 0) return;
    const lx = cx + (kn.x / 13) * R;
    const half = Math.sqrt(Math.max(0, R * R - (lx - cx) * (lx - cx)));
    if (kn.down > 0) ctx.fillRect(Math.round(lx - k / 2), Math.round(cy - half), k, Math.round(2 * half * kn.down));
    if (kn.v < 1) {
      // 包丁の刃(当てる所を探して、東へずらす)
      const ky = Math.round(cy - half + 2 * half * kn.down);
      ctx.fillStyle = "#1c120a";
      ctx.fillRect(Math.round(lx - 2 * k), ky - 26 * k, 4 * k, 26 * k);
      ctx.fillStyle = "#d6d9de";
      ctx.fillRect(Math.round(lx - k), ky - 17 * k, 3 * k, 16 * k); // 刃
      ctx.fillStyle = "#6a4a2a";
      ctx.fillRect(Math.round(lx - k), ky - 25 * k, 3 * k, 7 * k); // 柄
      ctx.fillStyle = "#1c120a";
    }
  });
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
    if (typeof kp2 !== "undefined") kp2.nakaT = knNow(); // 山頂に出たとき、ぴーの時計を続けるかの目じるし
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
    if (kp2InT() >= 0 && kp2TL().good) kp2Zoom(ctx, api, kp2InT());
  },
  triggers: [{ id: "toSancho", x: 5.55 * T, y: 8.75 * T, w: 1.9 * T, h: T, enabled: () => knS.cookT0 < 0, warp: { map: "sancho", spawn: "door" } }],
  objects: [
    {
      // 戻ってきたぴーの、うまく焼けた回(D829)
      id: "kp2In",
      x: KP2I.door[0],
      y: KP2I.door[1],
      w: 1,
      h: 1,
      headY: 26,
      hidden: (api) => !(api.cleared("keiji") && api.cleared("kinsei")) || kp2InT() < 0,
      update() {
        const u = kp2InT();
        const T0 = kp2TL();
        const a = KP2I.door;
        const b = KP2I.stand;
        const w = u < T0.put ? (u - T0.walkIn) / KP2I.walk : u < T0.out ? 1 : 1 - (u - T0.out) / KP2I.walk;
        const v = Math.max(0, Math.min(1, w));
        this.x = a[0] + (b[0] - a[0]) * v;
        this.y = a[1] + (b[1] - a[1]) * v;
      },
      draw(ctx, sx, sy, t, api) {
        const pi = api.image("pi");
        const u = kp2InT();
        const T0 = kp2TL();
        if (!pi || u < 0 || u > T0.end) return;
        const ox = sx - this.x;
        const oy = sy - this.y;
        let row = 1;
        let f = 0;
        let dx = 0;
        let dy = 0;
        const walking = (u >= T0.walkIn && u < T0.put) || u >= T0.out;
        const making = u >= T0.make && u < T0.out;
        if (walking) (row = u < T0.put ? 3 : 2), (f = Math.floor(t * 10) % 7);
        else if (u < T0.sep) row = 2; // 台に向かって手を出す
        if (u >= T0.eat && u < T0.make) (dy = (t * 7) % 1 < 0.4 ? 3 : 0), (dx = Math.floor(t * 14) % 2 ? 1 : -1);
        if (making) dy = -Math.round(Math.abs(Math.sin((u - T0.make) * 10)) * 2); // こねて、のばして、のせる
        kp2Pi(ctx, api, f, row, Math.round(sx - 32 + dx), Math.round(sy - 47 + dy));
        // 行きは、焼けた回は焼けたピザをピールごと、焦げた回はからのピール。帰りは作った生のピザをピールにのせて
        const carry = api.image(u < T0.put ? (T0.good ? "k_peel_pizza_carry" : "k_peel_carry") : "k_peel_pizza_carry");
        if (carry && walking) ctx.drawImage(carry, Math.round(sx - carry.width / 2), Math.round(sy - 22 - carry.height + 3 + (Math.floor(t * 10) % 2)));
        // 台の上のピザ
        const px = ox + KN_PZ.x;
        const py = oy + KN_PZ.y;
        if (making) kp2MakeDraw(ctx, px, py, u - T0.make, sx, sy, t);
        if (T0.good && u >= T0.put + 0.4 && u < T0.make) {
          const sep = Math.min(1, Math.max(0, (u - T0.sep) / KP2I.sep)) * 2;
          for (let i = 0; i < 3; i++) {
            const go = i === 1 ? (u - T0.give1) / 0.8 : i === 2 ? (u - T0.give2) / 0.8 : -1;
            if (go >= 1) continue; // 撮影隊の手に渡った
            if (i === 0 && u >= T0.eat) continue; // ぴーが食べている(下で描く)
            let x = px + (i - 1) * sep;
            let y = py;
            if (go > 0) {
              const m = KP2I_MOUTH[i === 1 ? "goron" : "kikikori"];
              x += (ox + m[0] - KP2I_MID[i] - x) * go;
              y += (oy + m[1] - y) * go - Math.sin(go * Math.PI) * 10;
            }
            kp2Piece(ctx, i, x, y, 13);
          }
          // 縦の 2 本: 三等分の所に当ててから、東へずらし(ぴーの分を大きく)、北のはしから南へ
          KP2I_CUTS.forEach((c, j) => {
            const kn = kp2Knife(j, u);
            if (kn.v < 0 || u >= T0.sep) return;
            const h = 2 * Math.sqrt(Math.max(0, 1 - (kn.x / 13) ** 2)) * Math.max(1.5, 13 * 0.36);
            ctx.fillStyle = "#3a2416";
            if (kn.down > 0) ctx.fillRect(Math.round(px + kn.x), Math.round(py - 0.5 - h / 2), 1, Math.max(1, Math.round(h * kn.down)));
            if (kn.v < 1) {
              ctx.fillStyle = "#c9ccd1";
              ctx.fillRect(Math.round(px + kn.x), Math.round(py - 0.5 - h / 2 + h * kn.down - 7), 1, 6);
              ctx.fillStyle = "#4a3a2a";
              ctx.fillRect(Math.round(px + kn.x), Math.round(py - 0.5 - h / 2 + h * kn.down - 10), 1, 3);
            }
          });
        }
        // ぴーは台の前で、いちばん大きい左の切れを台の上で食べる(D830)。東から減っていく
        if (u >= T0.eat && u < T0.make) {
          const k2 = (u - T0.eat) / KP2I.eat;
          if (k2 < 0.85) {
            const L = px - 14;
            const left = 17 - Math.floor(17 * (k2 / 0.85));
            ctx.save();
            ctx.beginPath();
            ctx.rect(L, py - 14, left, 28);
            ctx.clip();
            kp2Piece(ctx, 0, px, py, 13);
            ctx.restore();
          }
        }
      },
    },
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
          const u2 = kp2InT();
          if (u2 >= 0 && kp2TL().good) {
            const got = key === "goron" ? KP2I_T.give1 + 0.8 : KP2I_T.give2 + 0.8;
            if (u2 < got) return; // 前の切れは食べ終わって、手がから
            const m = KP2I_MOUTH[key];
            const pi = key === "goron" ? 1 : 2;
            kp2Piece(ctx, pi, sx - this.x + m[0] - KP2I_MID[pi], sy - this.y + m[1] - chew, 13);
            return;
          }
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
