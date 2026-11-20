// 断片: 本栖湖の長門。ゲームセンターの裏庭(todo 341、D785〜D804)
// ぼぎ雀の半荘できーが 1 位になると、台が震え、対戦した 3 人が天板を突き破って飛び出し、天板の上で跳ねてから奥の裏口へ走り、戸をあけて入る。それから裏口はあいたまま(D786、D804、D806。字の知らせは出さない)。
// 割れた天板は、ゲームセンターを出ると直る。割れているあいだは台に座れない(D806)。試しは docs/record/2026-11-20/tobidasu/
// 裏庭には誰もいない。草の伸びた庭に、自然石の慰霊碑(D800、D801)。碑の前で調べると表(題)、うしろで調べると裏(本文)の大写し(D788、D802、D803)。説明の文は出さない。
// 絵: 裏庭は Pro の案 1(docs/record/2026-11-19/uraniwa/)の柱を、手で自然石に描き替えた物(docs/record/2026-11-20/shizenseki_te/)。大写しは docs/record/2026-11-20/oosha/
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kGrid、K_LEGEND、NG_GAMECEN、bj)をそのまま使う
"use strict";

// 状態: pending は、勝った半荘の相手(裏口へ走る 3 人)。ゲームセンターに戻ったときに走らせる
// broken: 天板が割れている(D806。ゲームセンターを出ると直る)。door: 裏口の戸のあき(0 閉 〜 1 開)
const ngUra = { pending: null, run: null, t0: 0, broken: false, door: 0, debris: null };
// 時間表(秒、t0 から。D806): 台が震える → 天板を割って 3 人が飛び出す → 天板の上で跳ねる → 降りて裏口へ → 戸があき、入り、閉まる
const NG_URA_T = { shake: 1.0, pop: 0.5, popGap: 0.08, hops: 3, hop: 0.34, hopH: 11, downGap: 0.22, down: 0.45, speed: 120, open: 0.2, enter: 0.3, close: 0.25 };
const NG_URA_CAB = { x: 327, y: 178 }; // ぼぎ雀の台の画面
const NG_URA_HOLE = { x: 328, y: 180 }; // 天板の割れ目の中ほど
const NG_URA_TOP = 184; // 天板の上に立つ足もと
const NG_URA_SORT = 230; // 天板の上にいるあいだの前後(台の切り抜き 224 より手前、きー 248 より奥)
const NG_URA_DOOR = { x: 418, y: 118 }; // 奥の裏口の前
const NG_URA_DOORBOX = { x: 393, y: 14, w: 51, h: 90 }; // 戸の板(背景の中)

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
  ngUra.t0 = t0;
  const T = NG_URA_T;
  const sBreak = t0 + T.shake;
  const sDown0 = sBreak + T.pop + T.popGap * 2 + T.hops * T.hop;
  ngUra.run = foes.map((f, i) => {
    const spot = { x: 306 + i * 22, y: NG_URA_TOP + [0, -5, 2][i] };
    const land = { x: 300 + i * 24, y: 140 };
    const s0 = sBreak + i * T.popGap; // 割れ目から飛び出す
    const s1 = s0 + T.pop; // 天板に立つ
    const s2 = sDown0 + i * T.downGap; // 跳ねるのをやめて降りる
    const s3 = s2 + T.down; // 床に着く
    const s4 = s3 + Math.hypot(NG_URA_DOOR.x - land.x, NG_URA_DOOR.y - land.y) / T.speed; // 戸の前
    const s5 = s4 + T.enter; // 戸の中へ消える
    return { f, i, spot, land, s0, s1, s2, s3, s4, s5, popped: false, landed: false, gone: false };
  });
  const run = ngUra.run;
  ngUra.sBreak = sBreak;
  ngUra.sOpen = run[0].s4 - T.open; // 先頭が着く少し前にあく
  ngUra.sClose = run[run.length - 1].s5 + 0.1; // 最後が入ったら閉まる
  ngUra.debris = ngUraDebris();
  ngUra.cues = { shake: false, brk: false, open: false, close: false };
  api.freeze(ngUra.sClose + T.close + 0.3 - performance.now() / 1000);
  NG_GAMECEN.objects.push(ngUraFx(), ...run.map((r) => ngUraRunner(r)));
}

// 割れたときに飛ぶかけら(牌、フェルト、木)。毎回同じ飛び方
function ngUraDebris() {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const kinds = ["tile", "tile", "tile", "tile", "tile", "felt", "felt", "felt", "wood", "wood", "wood", "wood"];
  return kinds.map((k) => ({ k, vx: (rnd() - 0.5) * 140, vy: -60 - rnd() * 90, life: 0.6 + rnd() * 0.4, dx: (rnd() - 0.5) * 14, dy: (rnd() - 0.5) * 6 }));
}

// 台のまわりの出来事: 割れ目、かけら、戸。音もここで鳴らす
function ngUraFx() {
  return {
    id: "uraFx",
    x: NG_URA_HOLE.x,
    y: 224.5, // 台の切り抜きのすぐ手前(天板の上の人より奥)
    w: 1,
    h: 1,
    update(dt, t, api) {
      const now = performance.now() / 1000;
      const c = ngUra.cues;
      if (!c) return;
      if (!c.shake && now >= ngUra.t0) ((c.shake = true), api.sfx("gata"), api.later(500, () => api.sfx("gata")));
      if (!c.brk && now >= ngUra.sBreak) ((c.brk = true), (ngUra.broken = true), api.sfx("bari"));
      if (!c.open && now >= ngUra.sOpen) ((c.open = true), api.sfx("doorOpen"));
      if (!c.close && now >= ngUra.sClose) ((c.close = true), api.sfx("doorClose"));
      const T = NG_URA_T;
      ngUra.door = now < ngUra.sOpen ? 0 : now < ngUra.sOpen + T.open ? (now - ngUra.sOpen) / T.open : now < ngUra.sClose ? 1 : Math.max(0, 1 - (now - ngUra.sClose) / T.close);
      if (now > ngUra.sClose + T.close + 0.2) {
        ngUra.cues = null;
        ngUra.debris = null;
        ngUra.door = 0;
        const k = NG_GAMECEN.objects.indexOf(this);
        if (k >= 0) NG_GAMECEN.objects.splice(k, 1);
      }
    },
    draw(ctx, sx, sy) {
      const now = performance.now() / 1000;
      const ox = sx - NG_URA_HOLE.x; // 背景の座標 → 画面
      const oy = sy - 224.5;
      if (!ngUra.debris || now < ngUra.sBreak) return;
      const u = now - ngUra.sBreak;
      for (const d of ngUra.debris) {
        if (u > d.life) continue;
        const x = NG_URA_HOLE.x + d.dx + d.vx * u;
        const y = NG_URA_HOLE.y + d.dy + d.vy * u + 260 * u * u;
        ctx.globalAlpha = Math.min(1, (d.life - u) / 0.15);
        ngUraBit(ctx, d.k, Math.round(ox + x), Math.round(oy + y));
      }
      ctx.globalAlpha = 1;
    },
  };
}

// かけら 1 つ
function ngUraBit(ctx, k, x, y) {
  if (k === "tile") {
    ctx.fillStyle = "#2a1c14";
    ctx.fillRect(x - 1, y - 1, 5, 6);
    ctx.fillStyle = "#f2ead8";
    ctx.fillRect(x, y, 3, 4);
    ctx.fillStyle = "#d8833a";
    ctx.fillRect(x, y + 3, 3, 1);
  } else {
    ctx.fillStyle = k === "felt" ? "#2b8846" : "#7a4a2a";
    ctx.fillRect(x, y, 2, 2);
    ctx.fillStyle = k === "felt" ? "#1d5b41" : "#4a2a18";
    ctx.fillRect(x + 1, y + 1, 1, 1);
  }
}

// 天板の割れ目(背景の座標で描く。割れているあいだはずっと)
function ngUraDrawHole(ctx, ox, oy) {
  const P = (pts, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(ox + x, oy + y) : ctx.moveTo(ox + x, oy + y)));
    ctx.closePath();
    ctx.fill();
  };
  // 割れ目: 星形に裂けたフェルト(明るい緑)、割れた板(木の色)、穴の中(暗い)
  P([[349, 180], [340, 183], [344, 191], [331, 187], [323, 191], [320, 185], [307, 185], [313, 180], [309, 175], [320, 175], [322, 166], [331, 173], [340, 172], [340, 177]], "#4fb267");
  P([[345, 180], [337, 182], [341, 189], [330, 186], [324, 188], [322, 184], [311, 184], [316, 180], [313, 176], [322, 176], [323, 169], [330, 174], [338, 174], [337, 178]], "#8a5a34");
  P([[341, 180], [334, 182], [338, 187], [330, 184], [325, 186], [324, 183], [315, 183], [320, 180], [316, 177], [324, 177], [324, 171], [330, 176], [335, 175], [334, 178]], "#120b08");
  // 割れ目から走るひび
  ctx.fillStyle = "#1d5b41";
  [[311, 174], [309, 172], [307, 171], [347, 176], [349, 175], [351, 173], [327, 190], [326, 192], [345, 187], [347, 189]].forEach(([x, y]) => ctx.fillRect(ox + x, oy + y, 1, 1));
}

// 戸があいた形(背景の座標)。戸の板を左の蝶番へ縮め、あいた所は暗がり
function ngUraDrawDoor(ctx, api, ox, oy, open) {
  const b = NG_URA_DOORBOX;
  const bg = api.image("bg_gamecen");
  if (!bg) return;
  ctx.fillStyle = "#0e0907";
  ctx.fillRect(ox + b.x, oy + b.y, b.w, b.h);
  // 外の夜気がうっすら(足もと)
  ctx.fillStyle = "#1c1814";
  ctx.fillRect(ox + b.x + 2, oy + b.y + b.h - 10, b.w - 4, 10);
  ctx.fillStyle = "#26201a";
  ctx.fillRect(ox + b.x + 4, oy + b.y + b.h - 4, b.w - 8, 4);
  const w = Math.max(6, Math.round(b.w * (1 - open * 0.86)));
  ctx.drawImage(bg, b.x, b.y, b.w, b.h, ox + b.x, oy + b.y, w, b.h);
  ctx.fillStyle = `rgba(0, 0, 0, ${0.35 * open})`; // 向こうへ回った板は暗く
  ctx.fillRect(ox + b.x, oy + b.y, w, b.h);
  ctx.fillStyle = "#1a1210";
  ctx.fillRect(ox + b.x + w, oy + b.y, 1, b.h);
}

// 走る人 1 人(物として置き、足もとの y で前後を決める)
function ngUraRunner(r) {
  const T = NG_URA_T;
  const arc = (a, b, k, h) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, lift: Math.sin(k * Math.PI) * h });
  return {
    id: `uraRun${r.i}`,
    x: NG_URA_HOLE.x,
    y: NG_URA_SORT,
    w: 1,
    h: 1,
    update(dt, t, api) {
      const now = performance.now() / 1000;
      if (now < r.s0) return;
      if (!r.popped) ((r.popped = true), api.sfx("pop"));
      let p;
      if (now < r.s1) {
        // 割れ目から飛び出して、天板の上の持ち場へ
        p = arc(NG_URA_HOLE, r.spot, (now - r.s0) / T.pop, 34);
        r.clip = (now - r.s0) / T.pop < 0.35;
      } else if (now < r.s2) {
        // 天板の上で跳ねる(1 人ずつ少しずらす)
        r.clip = false;
        const k = ((now - r.s1 + r.i * 0.11) % T.hop) / T.hop;
        p = { x: r.spot.x, y: r.spot.y, lift: Math.sin(k * Math.PI) * T.hopH };
      } else if (now < r.s3) {
        // 天板から奥の床へ飛び降りる
        p = arc(r.spot, r.land, (now - r.s2) / T.down, 18);
      } else if (now < r.s4) {
        if (!r.landed) ((r.landed = true), api.sfx("pb_flip"));
        const k = (now - r.s3) / (r.s4 - r.s3);
        p = { x: r.land.x + (NG_URA_DOOR.x - r.land.x) * k, y: r.land.y + (NG_URA_DOOR.y - r.land.y) * k, lift: Math.abs(Math.sin(now * 16)) * 3 };
      } else if (now < r.s5) {
        // 戸の中へ(奥へ進みながら暗がりに消える)
        const k = (now - r.s4) / T.enter;
        p = { x: NG_URA_DOOR.x, y: NG_URA_DOOR.y - 12 * k, lift: 0 };
        r.dark = k;
      } else {
        r.gone = true;
        const k = NG_GAMECEN.objects.indexOf(this);
        if (k >= 0) NG_GAMECEN.objects.splice(k, 1);
        if (ngUra.run && ngUra.run.every((q) => q.gone)) ngUra.run = null;
        return;
      }
      // 天板の上と、飛び降りるあいだは、台より手前に描く(y は前後のため。見た目の高さは lift で出す)
      if (now < r.s3) {
        this.x = p.x;
        this.y = NG_URA_SORT;
        this.lift = NG_URA_SORT - p.y + p.lift;
      } else {
        this.x = p.x;
        this.y = p.y;
        this.lift = p.lift;
      }
    },
    draw(ctx, sx, sy, t, api) {
      const now = performance.now() / 1000;
      if (now < r.s0 || r.gone) return;
      ctx.save();
      if (r.clip) {
        // 割れ目から出てくるあいだは、穴より下を描かない
        const holeY = sy - (NG_URA_SORT - NG_URA_HOLE.y) + 3;
        ctx.beginPath();
        ctx.rect(sx - 60, holeY - 120, 120, 120);
        ctx.clip();
      }
      const onTop = now < r.s3;
      if (now >= r.s4) {
        // 戸の中: 左右は戸の枠にかくれ、暗がりに沈む
        const b = NG_URA_DOORBOX;
        const ox = sx - this.x;
        const oy = sy - this.y;
        ctx.beginPath();
        ctx.rect(ox + b.x + 2, oy + b.y, b.w - 4, b.h + 30);
        ctx.clip();
      }
      ngUraDrawFoe(ctx, api, r.f, sx, sy - (this.lift || 0), now, 1, now >= r.s3, !onTop, now >= r.s4 ? r.dark : 0);
      ctx.restore();
    },
  };
}

// ぼぎ雀の相手の絵を、足もとを (x, y) に合わせて描く。ぴーは歩きの絵(東向きの行)、ほかは 1 枚の絵
function ngUraDrawFoe(ctx, api, f, x, y, now, alpha, running, shadow, dark) {
  const im = api.image(f.key);
  if (!im) return;
  if (dark > 0) {
    // 暗がりに沈む: いったん別の紙に描いて、絵のある所だけ黒をかぶせる
    const c = ngUraDrawFoe.tmp || (ngUraDrawFoe.tmp = document.createElement("canvas"));
    c.width = 80;
    c.height = 80;
    const g = c.getContext("2d");
    ngUraDrawFoe(g, api, f, 40, 70, now, 1, running, false, 0);
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = `rgba(14, 9, 7, ${Math.min(1, dark * 1.3)})`;
    g.fillRect(0, 0, 80, 80);
    ctx.save();
    ctx.globalAlpha = alpha * (dark > 0.75 ? (1 - dark) / 0.25 : 1);
    ctx.drawImage(c, Math.round(x - 40), Math.round(y - 70));
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  if (shadow !== false) {
    ctx.fillStyle = "rgba(20, 14, 10, 0.3)";
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
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
  // ぼぎ雀の台: 震える、割れ目(D806)。割れているあいだは座れない
  const cab = NG_GAMECEN.objects.find((o) => o.id === "gcTableJ");
  const cabDraw = cab.draw;
  cab.draw = function (ctx, sx, sy, t, api) {
    const now = performance.now() / 1000;
    let dx = 0;
    let dy = 0;
    if (ngUra.cues && now >= ngUra.t0 && now < ngUra.sBreak) {
      const amp = now > ngUra.sBreak - 0.35 ? 2 : 1;
      dx = (Math.floor(now * 28) % 2 ? 1 : -1) * amp;
      dy = Math.floor(now * 19) % 3 === 0 ? -1 : 0;
    }
    cabDraw.call(this, ctx, sx + dx, sy + dy, t, api);
    if (ngUra.broken) ngUraDrawHole(ctx, sx - 293, sy - 224);
  };
  const jan = NG_GAMECEN.objects.find((o) => o.id === "bogijan");
  const janAct = jan.interact;
  jan.interact = (api) => (ngUra.broken ? api.sfx("gata") : janAct(api));
  // 裏口の戸があいた形(戸の足もとの y で前後を決める)
  NG_GAMECEN.objects.push({ id: "uraDoor", x: 418, y: 104.5, w: 1, h: 1, draw: (ctx, sx, sy, t, api) => ngUra.door > 0 && ngUraDrawDoor(ctx, api, sx - 418, sy - 104.5, ngUra.door) });
  // ゲームセンターを出ると、天板は直っている
  const out = NG_GAMECEN.triggers.find((tr) => tr.id === "out");
  const outRun = out.run;
  out.run = (api) => ((ngUra.broken = false), outRun(api));
}
