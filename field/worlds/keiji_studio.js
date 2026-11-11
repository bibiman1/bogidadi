// 断片: 形而アップダウンクイズ(A スタジオと、2 つのマップ)。keiji.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";

// ---- A スタジオ(24×14、見下ろし)。配置図 Q1 第 2 版(docs/assets/keiji/plan/layout_q1.png)----
// スタジオの絵(D516、PixelLab): 上に幕、まん中に舞台(5〜19 列、5〜9 行)、10 行目に低い塀(11、12 列が切れ目)、下に客席と通路
const KJ_G = { m: 7.5 * T, k: 10.5 * T, p: 13.5 * T, t: 16.5 * T, y: 7.4 * T }; // ゴンドラ(舞台の上)
const KJ_WALK = (c, r) => (r >= 5 && r <= 8 && c >= 3 && c <= 4) || (r >= 5 && r <= 9 && c >= 5 && c <= 19) || (r >= 10 && c >= 11 && c <= 12);
const KJ_SEATS = (c, r) => r >= 9 && r <= 13 && ((c >= 4 && c <= 10) || (c >= 14 && c <= 20));
const kjStudioGround = (ctx, ox, oy, img, api) => {
  const lit = api && api.flag("lit");
  ctx.save();
  ctx.translate(ox, oy);
  const bg = api && api.image("kj_studio");
  if (bg) {
    ctx.drawImage(bg, 0, 0);
    // 柱(幕のうしろから下りてくる)と、床の穴(下へ)
    for (const k of ["m", "k", "p", "t"]) {
      ctx.fillStyle = "#8e8e9a";
      ctx.fillRect(KJ_G[k] - 5, 4.7 * T, 10, KJ_G.y - 4.7 * T - 8);
      ctx.fillStyle = "#6e6e7a";
      ctx.fillRect(KJ_G[k] + 2, 4.7 * T, 2, KJ_G.y - 4.7 * T - 8);
      ctx.fillStyle = "#0c0b10";
      ctx.fillRect(KJ_G[k] - 18, KJ_G.y + 4, 36, 7);
    }
    // スクリーンの番組名は、作者のバナーを縮めて背景に入れた(todo 245、D596 の案 5。左右の余白に上下の矢印 todo 248、D597。docs/record/2026-11-04/keiji_banner/side.py)
    if (lit) (ctx.fillStyle = "rgba(255, 250, 235, 0.12)"), ctx.fillRect(0, 0, 24 * T, 14 * T);
    ctx.restore();
    return;
  }
  ctx.fillStyle = "#3a3440";
  ctx.fillRect(0, 0, 24 * T, 14 * T);
  ctx.fillStyle = "#211d28"; // 北の壁
  ctx.fillRect(0, 0, 24 * T, 3 * T);
  // 白い幕(うしろの影が映る)
  ctx.fillStyle = lit ? "#efe9da" : "#d9d1bd";
  ctx.fillRect(9 * T, 0.4 * T, 6 * T, 2.2 * T);
  ctx.fillStyle = "#6e3e36"; // 舞台
  ctx.fillRect(3 * T, 3 * T, 18 * T, 4 * T);
  ctx.fillStyle = "#5a322c";
  ctx.fillRect(3 * T, 6.8 * T, 18 * T, 0.2 * T);
  // 柱(天井を抜けて上へ)と、床の穴(下へ)
  for (const k of ["m", "k", "p", "t"]) {
    ctx.fillStyle = "#8e8e9a";
    ctx.fillRect(KJ_G[k] - 6, 0, 12, KJ_G.y - 8);
    ctx.fillStyle = "#0c0b10";
    ctx.fillRect(KJ_G[k] - 20, KJ_G.y + 4, 40, 8);
  }
  // 低い塀(洞窟の比喩)。まん中は切れていて、舞台へ上がれる
  ctx.fillStyle = "#8f7d68";
  ctx.fillRect(4 * T, 7.3 * T, 7.4 * T, 0.45 * T);
  ctx.fillRect(12.6 * T, 7.3 * T, 7.4 * T, 0.45 * T);
  // 空の客席
  for (let r = 9; r <= 13; r++)
    for (let c = 0; c < 24; c++) {
      if (!KJ_SEATS(c, r)) continue;
      ctx.fillStyle = "#5a3a46";
      ctx.fillRect(c * T + 5, r * T + 6, T - 10, T - 12);
      ctx.fillStyle = "#422a34";
      ctx.fillRect(c * T + 5, r * T + 6, T - 10, 4);
    }
  // 西の戸口
  ctx.fillStyle = "#0e0d12";
  ctx.fillRect(0, 7.5 * T, 0.4 * T, 2 * T);
  ctx.restore();
};
// 塀の上を、棒にさした物が通る(運ぶ手は見えない)。明かりがついたあとは、並んで止まっている(D508 の 1、5)
const KJ_PARADE = ["ic_kori", "u3", "ic_mango", "ic_fuda", "u5", "ic_slice", "ic_ribbon", "u1"];
const kjParade = {
  id: "parade",
  x: 12 * T,
  y: 10.1 * T,
  w: 1,
  h: 1,
  draw(ctx, sx, sy, t, api) {
    const lit = api.flag("lit");
    const span = 14 * T; // 8 つを等しい間で回す(2 マスおきだと 8 つめが 1 つめに重なった、todo 252)
    KJ_PARADE.forEach((k, i) => {
      const im = api.image(k);
      if (!im) return;
      let x = lit ? 5.6 * T + i * 1.5 * T : 5.2 * T + ((i * (span / KJ_PARADE.length) + t * 18) % span);
      if (!lit && x > 10.9 * T && x < 13.1 * T) return; // 塀の切れ目では見えない
      if (lit && x > 10.6 * T) x += 2.6 * T;
      const px = Math.round(sx - 12 * T + x);
      ctx.fillStyle = "#5a4430";
      ctx.fillRect(px, sy - 12, 2, 12);
      ctx.drawImage(im, px - 11, sy - 34, 24, 24);
    });
  },
};
const kjSprite = (key, x, y, extra) =>
  Object.assign(
    {
      id: key,
      x,
      y,
      w: 1,
      h: 1,
      headY: 40,
      draw(ctx, sx, sy, t, api) {
        const im = api.image(key);
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height));
      },
    },
    extra
  );
// ぴーの登場(D520): はじめて舞台に上がると、ぱーでれの光の柱が天井からさし、ぴーが落ちてきて、きーにぶつかってから自分のゴンドラへ跳ぶ
// (ぱーでれとだいにちで、ぴーはきーを押しのけて光の柱をのぼっていった)
const KJ_FALL = { light: 0.6, fall: 0.5, hop: 1.0, fade: 0.8 };
let kjFall = null;
const kjPiFall = {
  id: "piFall",
  x: 0,
  y: 14 * T, // いちばん手前に描く
  w: 1,
  h: 1,
  hidden: () => !kjFall,
  draw(ctx, sx, sy, t, api) {
    if (!kjFall) return;
    if (kjFall.t0 === null) kjFall.t0 = t;
    const el = t - kjFall.t0;
    const ox = sx;
    const oy = sy - 14 * T;
    const px = ox + kjFall.x;
    const py = oy + kjFall.y;
    const F = KJ_FALL;
    // 光の柱(ぱーでれと同じ、うすい黄色の帯)
    const tEnd = F.light + F.fall + F.hop + F.fade;
    const la = el < F.light ? el / F.light : el < F.light + F.fall + 0.3 ? 1 : Math.max(0, 1 - (el - F.light - F.fall - 0.3) / F.fade);
    if (la > 0) {
      const g = ctx.createLinearGradient(px - 20, 0, px + 20, 0);
      g.addColorStop(0, "rgba(255, 246, 214, 0)");
      g.addColorStop(0.5, `rgba(255, 246, 214, ${0.6 * la * (0.85 + 0.15 * Math.sin(t * 3))})`);
      g.addColorStop(1, "rgba(255, 246, 214, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(px - 20, 0, 40, py + 4);
    }
    const pi = api.image("pi");
    if (!pi) return;
    let x, y;
    if (el < F.light) return;
    if (el < F.light + F.fall) {
      // 落ちる(だんだん速く)
      const u = (el - F.light) / F.fall;
      x = px;
      y = oy - 20 + (py - 26 - (oy - 20)) * u * u;
    } else if (el < F.light + F.fall + F.hop) {
      // はね返って、自分のゴンドラへ
      const u = (el - F.light - F.fall) / F.hop;
      const gx = ox + KJ_G.p;
      const gy = oy + KJ_G.y - (api.image("booth") ? KJ_LIFT : 0) - 8;
      x = px + (gx - px) * u;
      y = py - 26 + (gy - (py - 26)) * u - Math.sin(u * Math.PI) * 40;
    } else return;
    ctx.drawImage(pi, 0, 0, 64, 64, Math.round(x - 32), Math.round(y - 47), 64, 64);
    if (el > tEnd) kjFall = null;
  },
};
const kjPiFallStart = (api) => {
  if (api.flag("piCame") || kjFall) return;
  const p = api.player();
  kjFall = { t0: null, x: p.x, y: p.y };
  const F = KJ_FALL;
  api.freeze(F.light + F.fall + F.hop + 0.3);
  api.sfx("chime");
  api.later((F.light + F.fall) * 1000, () => {
    api.sfx("knock");
    api.shake(0.3, 3);
    api.face("north"); // ぶつかっても、きーの場所は動かさない(舞台のふちで壁にめりこんで動けなくなった)
    if (api.dent) api.dent(0.9); // ぴーが頭にぶつかって、きーがへこむ(todo 195)
  });
  api.later((F.light + F.fall + F.hop) * 1000, () => {
    api.sfx("pop");
    api.setFlag("piCame");
  });
};
// スタジオのゴンドラ(舞台の上)。まん中の空いたゴンドラを調べると、本番(B の画面へ)
const kjStudioGondola = (who) => ({
  id: `g_${who}`,
  x: KJ_G[who],
  y: KJ_G.y,
  w: 1,
  h: 1,
  headY: 46,
  range: 40,
  solid: { w: 34, h: 12, dy: -6 },
  draw(ctx, sx, sy0, t, api) {
    const sy = sy0 - (api.image("booth") ? KJ_LIFT : 0);
    if (who === "m") {
      const m = api.image("matryo");
      if (m) ctx.drawImage(m, Math.round(sx - m.width / 2), Math.round(sy - 6 - m.height));
    } else if (who === "t") {
      const tb = api.image("tetsubin");
      if (tb) ctx.drawImage(tb, Math.round(sx - tb.width / 2), Math.round(sy - 4 - tb.height));
    } else if (who === "p" && api.flag("piCame")) {
      const pi = api.image("pi");
      if (pi) ctx.drawImage(pi, 0, 0, 64, 64, Math.round(sx - 32), Math.round(sy - 8 - 64 + 17), 64, 64);
    }
    const bt = api.image("booth");
    if (bt) return ctx.drawImage(bt, Math.round(sx - bt.width / 2), Math.round(sy0 - bt.height));
    ctx.fillStyle = "#c8b478";
    ctx.fillRect(Math.round(sx - 16), Math.round(sy - 13), 32, 13);
    ctx.strokeStyle = "#4a3a24";
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(sx - 16) + 0.5, Math.round(sy - 13) + 0.5, 31, 12);
    ctx.fillStyle = "#f4f2ea";
    ctx.fillRect(Math.round(sx - 9), Math.round(sy - 10), 18, 6);
    ctx.fillStyle = "#d83a2c";
    ctx.fillRect(Math.round(sx - 2), Math.round(sy - 16), 4, 3);
  },
  ...(who === "k"
    ? {
        interact(api) {
          // ききこりのカチンコ → 本番
          api.freeze(1.4);
          api.sfx("hyoshigi");
          api.later(900, () => api.warp("show", "view"));
        },
      }
    : {}),
});
const KJ_STUDIO = {
  tile: T,
  bg: "#3a3440",
  bgm: "keiji",
  map: kGrid(24, 14, (c, r) => !KJ_WALK(c, r)),
  legend: K_LEGEND,
  drawGround: kjStudioGround,
  spawns: {
    start: { x: 3.9 * T, y: 7.7 * T, facing: "east" }, // 扉の手前(todo 246)
    stage: { x: 12 * T, y: 8.6 * T, facing: "north" },
  },
  onEnter() {
    kjWarp(0);
    kjFall = null;
  },
  // 客席のほうは暗い。明かりがつくまで、舞台だけ明るい(ランプの灯り)
  drawOverlay(ctx, ox, oy, t, api) {
    if (api.flag("lit")) return;
    ctx.fillStyle = "rgba(8, 6, 14, 0.42)";
    ctx.fillRect(0, Math.round(oy + 10.3 * T), ctx.canvas.width, ctx.canvas.height);
    const g = ctx.createRadialGradient(ox + 12 * T, oy + 11 * T, 2, ox + 12 * T, oy + 11 * T, 60);
    g.addColorStop(0, `rgba(255, 210, 120, ${0.35 + 0.06 * Math.sin(t * 7)})`);
    g.addColorStop(1, "rgba(255, 210, 120, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(ox + 12 * T - 60, oy + 11 * T - 60, 120, 120);
  },
  // 西の戸口(絵の左の扉。x 2.7〜4.4 マス、下の端 6.9 マス)。扉に向かって上へ歩くか、扉の下で左へ歩くと出る。
  // 上へ歩くと y 6.23 マス、左へ歩くと x 3.34 マスで止まるので、そこまで届くようにする(todo 202)。
  // 戸口の前の通り道は 4 マスの高さ(5〜8 段。todo 227)。前は左の帯が 4 マスぜんぶと入口の 2 ドット隣にかかり、
  // 入ってすぐ左や下へ少し動くだけで出てしまった(todo 246)。左の帯は扉の下(7.2 マスまで)だけにし、入口は扉の手前に下げた
  triggers: [
    { id: "leave", x: 2.9 * T, y: 5.6 * T, w: 1.5 * T, h: 0.85 * T, run: (api) => api.exit() },
    { id: "leaveW", x: 2.9 * T, y: 5 * T, w: 0.55 * T, h: 2.2 * T, run: (api) => api.exit() },
    { id: "piFall", x: 5 * T, y: 5 * T, w: 15 * T, h: 5 * T, run: kjPiFallStart }, // 舞台に上がると(D520)
  ],
  objects: [
    kjParade,
    kjPiFall,
    kjStudioGondola("m"),
    kjStudioGondola("k"),
    kjStudioGondola("p"),
    kjStudioGondola("t"),
    // 司会台とごろん(ディレクター、司会)
    {
      id: "desk",
      x: 6.1 * T,
      y: 7.5 * T,
      w: 1,
      h: 1,
      solid: { w: 40, h: 12, dy: -6 },
      draw(ctx, sx, sy, t, api) {
        const bt = api.image("kj_desk") || api.image("booth"); // 司会台(todo 200。解答席とは別の形)
        if (bt) ctx.drawImage(bt, Math.round(sx - bt.width / 2), Math.round(sy - bt.height));
      },
    },
    kjSprite("goron", 6.1 * T, 7 * T, { solid: { w: 24, h: 10, dy: -5 } }),
    // ききこり(カメラ係)。客席の通路から舞台を撮る
    kjSprite("kikikori", 12 * T, 12.8 * T, { solid: { w: 30, h: 12, dy: -6 } }),
    // ランプ(洞窟の火)。塀のうしろから幕を照らす
    {
      id: "lamp",
      x: 12.5 * T,
      y: 11 * T,
      w: 1,
      h: 1,
      draw(ctx, sx, sy, t) {
        ctx.fillStyle = "#3a2c1c";
        ctx.fillRect(Math.round(sx - 2), Math.round(sy - 10), 4, 10);
        ctx.fillStyle = `rgb(255, ${200 + Math.round(20 * Math.sin(t * 9))}, 110)`;
        ctx.beginPath();
        ctx.ellipse(sx, sy - 13, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      },
    },
  ],
};
// ---- B 本番の画面(画面と同じ広さ。カメラは動かない)----
const KJ_SHOW = {
  tile: T,
  bg: "#16161e",
  hidePlayer: true,
  bgm: "keiji",
  map: kGrid(15, 9, () => false),
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 4 * T, facing: "north" } },
  objects: [],
  triggers: [],
  onEnter(api) {
    kjStart(api);
    api.sfx("clap");
  },
  debug: () => kjS,
  onA(api) {
    if (kjS.phase === "intro" && kjEl() > 0.4) kjS.t0 = kjS.t - KJ.rulePage; // ルールの次の 1 枚へ
    if (kjS.phase === "q" && !kjS.rest.k) {
      // 押す(D515): 3 秒のうちに選ぶ。変な物の影なら、選択肢に答えがないのでお手つき(D522)
      kjS.buzz = "k";
      kjS.qEl = kjEl();
      kjS.cur = 1;
      api.sfx("pinpon");
      if (kjQ().kind === "u") {
        kjS.ans.k = -3;
        kjGo("reveal");
      } else kjGo("choose");
    } else if (kjS.phase === "steer" && kjEl() > 0.2) kjSteer(api);
    else if (kjS.phase === "choose" && kjEl() > 0.15) {
      kjS.ans.k = kjS.cur;
      api.sfx("ok");
      kjGo("reveal");
    }
    return true;
  },
  onB() {
    return true;
  },
  input(api, dt, inp) {
    if (kjS.phase === "idle") kjStart(api);
    // 左右で選ぶ(押したときだけ 1 つ動く)
    if (kjS.phase === "choose" || kjS.phase === "steer") {
      if (inp.x < -0.5 && kjS.lastX >= -0.5) (kjS.cur = (kjS.cur + 2) % 3), api.sfx("cursor");
      if (inp.x > 0.5 && kjS.lastX <= 0.5) (kjS.cur = (kjS.cur + 1) % 3), api.sfx("cursor");
    }
    // ↑・↓ を選ぶときは、上下でもそのまま選べる
    if (kjS.phase === "steer") {
      if (inp.y < -0.5 && kjS.lastY >= -0.5 && kjS.cur !== 0) (kjS.cur = 0), api.sfx("cursor");
      if (inp.y > 0.5 && kjS.lastY <= 0.5 && kjS.cur !== 2) (kjS.cur = 2), api.sfx("cursor");
    }
    kjS.lastX = inp.x;
    kjS.lastY = inp.y;
    // 見えないきー(歩く体)は、番組のあいだ動かさない(↓で選ぶと下へ歩いていき、懲罰空間へ戻ってしまった todo 194)
    if (kjS.phase !== "gift") api.place(7 * T, 4 * T);
    kjTick(api, dt);
  },
  drawGround(ctx, ox, oy, img, api) {
    kjDrawShow(ctx, ox, oy, api);
  },
};
