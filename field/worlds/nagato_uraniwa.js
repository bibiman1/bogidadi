// 断片: 本栖湖の長門。ゲームセンターの裏庭(todo 341、D785〜D804)
// ぼぎ雀の半荘できーが 1 位になると、対戦した 3 人が台から飛び出し、奥の裏口へ走って消える。それから裏口はあいたまま(D786、D804。字の知らせは出さない)。
// 裏庭には誰もいない。草の伸びた庭に、自然石の慰霊碑(D800、D801)。碑の前で調べると表(題)、うしろで調べると裏(本文)の大写し(D788、D802、D803)。説明の文は出さない。
// 絵: 裏庭は Pro の案 1(docs/record/2026-11-19/uraniwa/)の柱を、手で自然石に描き替えた物(docs/record/2026-11-20/shizenseki_te/)。大写しは docs/record/2026-11-20/oosha/
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kGrid、K_LEGEND、NG_GAMECEN、bj)をそのまま使う
"use strict";

// 状態: pending は、勝った半荘の相手(裏口へ走る 3 人)。ゲームセンターに戻ったときに走らせる
const ngUra = { pending: null, run: null };
// 走る人の時間表(秒、1 人ずつ RUN_GAP ずらす): 台から飛び出す → 着地 → 裏口まで走る → 戸の中へ消える
const NG_URA_RUN = { gap: 0.4, hop: 0.55, speed: 120, fade: 0.25 };
const NG_URA_CAB = { x: 327, y: 178 }; // ぼぎ雀の台の画面
const NG_URA_DOOR = { x: 418, y: 118 }; // 奥の裏口

// 半荘の終わりに呼ぶ(bjNext): きーが 1 位なら、裏口をあけて、相手 3 人を走らせる用意
function ngUraWin(api) {
  const order = [0, 1, 2, 3].sort((a, b) => bj.pts[b] - bj.pts[a] || a - b);
  if (order[0] !== 0) return;
  api.setFlag("uraOpen");
  ngUra.pending = bj.seats.slice(1).map((f) => Object.assign({}, f));
}

// ゲームセンターに戻ったとき: 用意があれば走らせる
function ngUraStart(api) {
  if (!ngUra.pending) return;
  const foes = ngUra.pending;
  ngUra.pending = null;
  const t0 = performance.now() / 1000 + 0.5;
  ngUra.run = foes.map((f, i) => {
    const land = { x: NG_URA_CAB.x - 26 + i * 26, y: 150 };
    const dist = Math.hypot(NG_URA_DOOR.x - land.x, NG_URA_DOOR.y - land.y);
    const s0 = t0 + i * NG_URA_RUN.gap;
    return { f, land, s0, s1: s0 + NG_URA_RUN.hop, s2: s0 + NG_URA_RUN.hop + dist / NG_URA_RUN.speed, popped: false, gone: false };
  });
  const end = ngUra.run[ngUra.run.length - 1].s2 + NG_URA_RUN.fade;
  api.freeze(end - performance.now() / 1000 + 0.3);
  NG_GAMECEN.objects.push(...ngUra.run.map((r, i) => ngUraRunner(r, i)));
}

// 走る人 1 人(物として置き、足もとの y で前後を決める)
function ngUraRunner(r, i) {
  return {
    id: `uraRun${i}`,
    x: NG_URA_CAB.x,
    y: NG_URA_CAB.y,
    w: 1,
    h: 1,
    update(dt, t, api) {
      const now = performance.now() / 1000;
      if (now < r.s0) return;
      if (!r.popped) {
        r.popped = true;
        api.sfx("pop");
      }
      if (now < r.s1) {
        const k = (now - r.s0) / NG_URA_RUN.hop;
        this.x = NG_URA_CAB.x + (r.land.x - NG_URA_CAB.x) * k;
        this.y = NG_URA_CAB.y + (r.land.y - NG_URA_CAB.y) * k;
        this.lift = Math.sin(k * Math.PI) * 34;
      } else if (now < r.s2) {
        const k = (now - r.s1) / (r.s2 - r.s1);
        this.x = r.land.x + (NG_URA_DOOR.x - r.land.x) * k;
        this.y = r.land.y + (NG_URA_DOOR.y - r.land.y) * k;
        this.lift = Math.abs(Math.sin(now * 16)) * 3;
      } else if (!r.gone) {
        r.gone = true;
        this.x = NG_URA_DOOR.x;
        this.y = NG_URA_DOOR.y;
        this.lift = 0;
        api.sfx("gata");
      }
      if (r.gone && now > r.s2 + NG_URA_RUN.fade) {
        const k = NG_GAMECEN.objects.indexOf(this);
        if (k >= 0) NG_GAMECEN.objects.splice(k, 1);
        if (ngUra.run && ngUra.run.every((q) => q.gone)) ngUra.run = null;
      }
    },
    draw(ctx, sx, sy, t, api) {
      const now = performance.now() / 1000;
      if (now < r.s0) return;
      const a = r.gone ? Math.max(0, 1 - (now - r.s2) / NG_URA_RUN.fade) : 1;
      ngUraDrawFoe(ctx, api, r.f, sx, sy - (this.lift || 0), now, a, now >= r.s1 && !r.gone);
    },
  };
}

// ぼぎ雀の相手の絵を、足もとを (x, y) に合わせて描く。ぴーは歩きの絵(東向きの行)、ほかは 1 枚の絵
function ngUraDrawFoe(ctx, api, f, x, y, now, alpha, running) {
  const im = api.image(f.key);
  if (!im) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(20, 14, 10, 0.3)";
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y), 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  if (f.cell) {
    const fr = running ? Math.floor(now * 10) % 7 : 0;
    ctx.drawImage(im, fr * f.cell, 2 * f.cell, f.cell, f.cell, Math.round(x - f.cell / 2), Math.round(y - f.cell / 2 - 17), f.cell, f.cell);
  } else {
    const s = im.height > 40 ? 40 / im.height : 1;
    const w = Math.round(im.width * s);
    const h = Math.round(im.height * s);
    ctx.drawImage(im, Math.round(x - w / 2), Math.round(y - h), w, h);
  }
  ctx.restore();
}

// ---- 裏庭(15 × 10 マス、北を向いて見る。手前の南が家の裏の壁、右下が裏口)----
// 歩けるのは、碑のまわりの砂利と土。左右の草むら、奥の塀、手前の壁は歩かない。碑のうしろ(塀とのあいだ)も歩ける
const NG_URA_WALK = (c, r) =>
  (r === 3 && c >= 4 && c <= 10) || (r === 4 && c >= 4 && c <= 11) || (r === 5 && c >= 4 && c <= 12) || (r === 6 && c >= 4 && c <= 11) || (r === 7 && c >= 4 && c <= 12);
const NG_URANIWA = {
  tile: T,
  bg: "#16120e",
  bgm: "kaze", // 曲はなく、風の音だけ(audio.js)
  map: kGrid(15, 10, (c, r) => !NG_URA_WALK(c, r)),
  legend: K_LEGEND,
  drawGround(ctx, ox, oy, img, api) {
    const bg = api.image("bg_uraniwa");
    if (bg) ctx.drawImage(bg, Math.round(ox), Math.round(oy));
  },
  spawns: {
    door: { x: 12.5 * T, y: 7.3 * T, facing: "north" }, // 裏口から出てきた所
  },
  objects: [
    // 碑(と台の上の段)を背景から切り出して、うしろに回ったきーの前に描く
    {
      id: "hiCut",
      x: 240,
      y: 143,
      w: 1,
      h: 1,
      draw(ctx, sx, sy, t, api) {
        const im = api.image("ng_hi_cut");
        if (im) ctx.drawImage(im, sx - 240 + 215, sy - 143 + 41);
      },
    },
    { id: "hiBase", x: 240, y: 156, w: 1, h: 1, solid: { w: 76, h: 48 }, draw() {} }, // 台(二段の切石)
    // 碑の前で調べると表、うしろで調べると裏の大写し(説明の文は出さない)
    { id: "hiOmote", x: 240, y: 196, w: 1, h: 1, headY: 60, range: 30, draw() {}, interact: (api) => api.show("ng_hi_omote", null, { full: true }) },
    { id: "hiUra", x: 240, y: 114, w: 1, h: 1, headY: 30, range: 30, draw() {}, interact: (api) => api.show("ng_hi_ura", null, { full: true }) },
  ],
  triggers: [{ id: "out", x: 12 * T, y: 7.7 * T, w: T, h: 0.5 * T, run: (api) => api.warp("gamecen", "ura") }],
};

// ---- ゲームセンターの側: 裏口と、戻ったときに走らせる ----
NG_GAMECEN.spawns.ura = { x: 418, y: 140, facing: "south" }; // 裏庭から戻った所
NG_GAMECEN.onEnter = (api) => ngUraStart(api);
{
  const door = NG_GAMECEN.objects.find((o) => o.id === "uraguchi");
  door.interact = (api) => {
    if (!api.flag("uraOpen")) return api.sfx("gata"); // 優勝するまでは開かない
    api.sfx("ok");
    api.warp("uraniwa", "door");
  };
}
