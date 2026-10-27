// 断片: 霞ヶ浦のエクラノプラン。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ================================================================
// 断片: 霞ヶ浦のエクラノプラン(晩秋の明け方)。廃兵院を終えると懲罰空間に現れる
// 条件: 格納庫で地上ぼぎクルー(笹野一刀彫)にジャンプを教わる → 傾斜路の先から翼へ跳び乗る
//       → 機体の上を歩いて乗降口へ → 機内を通って操縦席へ → ミイラさまの遊覧飛行 → 懲罰空間に帰る
// 背景は docs/assets/kasumi の設計図と下絵(*_blockout.png)から生成
// ================================================================
const kGrid = (cols, rows, solidAt) => {
  const g = [];
  for (let r = 0; r < rows; r++) {
    let row = "";
    for (let c = 0; c < cols; c++) row += solidAt(c, r) ? "#" : ".";
    g.push(row);
  }
  return g;
};
const K_LEGEND = { "#": { solid: true }, ".": {} };
const kImage = (key, w, h) => (ctx, ox, oy, img) => {
  const im = typeof img === "function" && img(key);
  if (im) ctx.drawImage(im, ox, oy, w, h);
};
// 床に立つ物の切り出し(fg_<map>.png の x0, y0, w, h)を、足もとの y(base)できーと前後させる
// 2026-10-03、作者「重ね合わせみてね」。切り出しは docs/assets/kasumi/fg_kasumi.py
const kFg = (img, x0, y0, w, h, base) => ({
  id: `fg${x0}_${y0}`,
  x: x0 + w / 2,
  y: base,
  w: 1,
  h: 1,
  draw(ctx, sx, sy, t, api) {
    const im = api.image(img);
    if (im) ctx.drawImage(im, x0, y0, w, h, sx - this.x + x0, sy - this.y + y0, w, h);
  },
});
const kWall = (x0, y0, x1, y1) => ({ id: `wall${x0}_${y0}`, x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: 1, h: 1, solid: { w: x1 - x0, h: y1 - y0 } });

// A 蓮田のあぜ道(入口。北の門柱の先が基地跡)
const K_LOTUS = {
  tile: T,
  bg: "#6b5f3e",
  tint: "rgba(255, 190, 150, 0.06)",
  map: kGrid(12, 14, (c) => c < 5 || c > 6),
  legend: K_LEGEND,
  drawGround: kImage("bg_lotus", 12 * T, 14 * T),
  spawns: {
    start: { x: 6 * T, y: 12.6 * T, facing: "north" },
    north: { x: 6 * T, y: 1.4 * T, facing: "south" },
  },
  triggers: [
    { id: "toShore", x: 5 * T, y: -T, w: 2 * T, h: 1.3 * T, warp: { map: "shore", spawn: "gate" } },
    { id: "leave", x: 5 * T, y: 13.6 * T, w: 2 * T, h: T, run: (api) => api.exit() },
  ],
  objects: [], // 案山子は背景の絵に描いてある(田の中なので歩いては行けない)
};

// 蓮の花を取る(跳んでも、A でも。二度は取らない)
const hasuGet = (api) => {
  if (api.hasItem("蓮の花") || hasuGet.busy) return;
  hasuGet.busy = true;
  api.hold("ic_hasu", 1.8, () => {
    api.giveItem("蓮の花");
    hasuGet.busy = false;
  });
};
// B 基地跡の岸(背景は一枚絵。当たり判定は背景に合わせる)
const SHORE_SOLID = (c, r) => {
  if (r <= 8 && !(c >= 15 && c <= 17 && r >= 8)) return true; // 湖(傾斜路の先端まで歩ける)
  if (r >= 17 && !(c === 15 || c === 16)) return true; // 塀と蓮田(門だけ通れる)
  if (c >= 1 && c <= 13 && r >= 9 && r <= 15) return true; // 格納庫
  if (c >= 19 && c <= 21 && r === 16) return true; // 衛兵所
  if (c >= 20 && c <= 23 && r === 13) return true; // 燃料ドラム
  if ((c === 25 || c === 26) && r === 14) return true; // 見張り台の脚
  return false;
};
const K_SHORE = {
  tile: T,
  bg: "#3a4a58",
  map: kGrid(32, 20, SHORE_SOLID),
  legend: K_LEGEND,
  drawGround: kImage("bg_shore", 32 * T, 20 * T),
  spawns: {
    gate: { x: 16 * T, y: 16.4 * T, facing: "north" },
    hangar: { x: 9 * T, y: 16.5 * T, facing: "south" },
    slip: { x: 16.5 * T, y: 9.6 * T, facing: "south" },
  },
  triggers: [
    { id: "toLotus", x: 15 * T, y: 17.2 * T, w: 2 * T, h: T, warp: { map: "lotus", spawn: "north" } },
    { id: "toHangar", x: 8 * T, y: 15.8 * T, w: 2.4 * T, h: 0.5 * T, warp: { map: "hangar", spawn: "door" } },
  ],
  onEnter() {
    hintB(false);
  },
  // 傾斜路の先端で北を向いて跳ぶと、エクラノプランの翼に跳び移る(渡り板は落ちている)
  onJump(api, p) {
    if (p.facing === "north" && p.x > 15 * T && p.x < 18 * T && p.y < 9.8 * T) {
      api.later(420, () => api.warp("wing", "land"));
    }
    // 蓮の花(D201、D280): 傾斜路の先で跳ぶと(北のほかの向き。北は翼へ跳ぶ)、水の上の花に手が届く。A で調べても取れる
    if (p.facing !== "north" && Math.hypot(p.x - 13.9 * T, p.y - 8.5 * T) < 3.2 * T && api.cleared("kasumi") && !api.hasItem("蓮の花")) {
      api.later(260, () => hasuGet(api));
    }
  },
  objects: [
    // おもいで(D198): 遊覧飛行のあと、傾斜路の先の水の上に、蓮の花が一輪咲いている。歩いては届かない。跳ぶと届く(D201)
    {
      id: "hasu",
      x: 13.9 * T,
      y: 8.5 * T,
      w: 1,
      h: 1,
      headY: 30,
      range: 3 * T, // 傾斜路の先の足場から届く(前は 40 で、足場の端からも届かなかった)
      hidden: (api) => !api.cleared("kasumi") || api.hasItem("蓮の花"),
      interact(api) {
        hasuGet(api);
      },
      draw(ctx, sx, sy, t, api) {
        const im = api.image("i_hasu");
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height + Math.sin(t * 2) * 1));
      },
    },
    // 門柱 2 本、衛兵所、見張り台、吹き流しは、足もとの y できーと前後。門柱と吹き流しの根もと、右はしのドラム缶はふさぐ
    // 門柱のあいだは道(前は上に看板があると読みちがえて、門をくぐるきーを道の絵で隠していた。2026-10-03、作者「おかしい」)
    kFg("fg_shore", 463, 500, 26, 56, 553),
    kFg("fg_shore", 533, 500, 27, 56, 553),
    kFg("fg_shore", 603, 489, 106, 68, 555),
    kFg("fg_shore", 799, 318, 78, 162, 478),
    kFg("fg_shore", 941, 318, 72, 136, 452),
    kWall(463, 540, 488, 556),
    kWall(533, 540, 559, 556),
    kWall(940, 444, 950, 454),
    kWall(764, 416, 786, 448),
    {
      id: "slipTip",
      x: 16.5 * T,
      y: 9.2 * T,
      w: 1,
      h: 1,
      range: 40,
      interact(api) {
        if (api.cleared("kasumi") && !api.hasItem("蓮の花")) return hasuGet(api); // 遊覧飛行のあとは、足場の先の蓮の花を取る(D280)
        if (api.flag("jump")) api.mutter("……", 1400); // 跳べばとどく
        else api.bubble("slipTip", "とどかない", 1800);
      },
    },
  ],
};

// C 格納庫の中(地上ぼぎクルーが、今朝も整備している。ここでジャンプを教わる)
// 当たり判定は背景の絵に合わせる(奥の壁、機体、燃料ドラム、木、整備台、ゴンドラ)
const HANGAR_SOLID = (c, r) =>
  r <= 2 ||
  c === 0 ||
  c === 13 ||
  (r === 9 && !(c === 6 || c === 7)) ||
  (r === 3 && c >= 1 && c <= 10) || // 木のうしろ(11・12 列)は歩ける。葉のすきまから、きーが顔を出す(2026-10-03、作者「キーが葉っぱから顔を出すのはのこしてほしい」)
  (r === 4 && c >= 1 && c <= 11) || // 機体の模型とドラム缶の手前まで(うしろに回りこまない)
  (r === 6 && c >= 5 && c <= 7) ||
  (r === 7 && c >= 8 && c <= 12);
const crewMember = (id, img, fx, fy, phase) =>
  Object.assign(hat(img, fx, fy), {
    id,
    bob: 0,
    update(dt, t) {
      this.hopping = this.hopUntil && t < this.hopUntil;
    },
    draw(ctx, sx, sy, t) {
      // 教える場面では、順番に跳んでみせる
      if (!this.hopUntil || t > this.hopUntil || t < this.hopFrom) return;
      const u = (t - this.hopFrom) / (this.hopUntil - this.hopFrom);
      this.y = this.baseY - Math.sin(u * Math.PI) * 14;
    },
  });
const CREW = [
  crewMember("crew1", "crew_hawk", 5.3 * T, 5.6 * T, 0),
  crewMember("crew2", "crew_wagtail", 6.4 * T, 5.7 * T, 1),
  crewMember("crew3", "crew_rooster", 7.5 * T, 5.6 * T, 2),
];
CREW.forEach((c) => (c.baseY = c.y));
// ジャンプの習い方: クルーが順番に跳んでみせる → どのボタンで跳ぶかを出す → きーが自分で跳べたら覚える
// どのボタンで跳ぶか: 最後にキーボードを使っていれば「Xキー」、画面をさわっていれば「Bボタン」
let lastInputTouch = false;
window.addEventListener("keydown", () => (lastInputTouch = false), true);
window.addEventListener("touchstart", () => (lastInputTouch = true), { capture: true, passive: true });
const jumpKey = () => (lastInputTouch ? "Bボタン" : "Xキー");
const hintB = (on) => {
  const b = document.getElementById("actionBtnB");
  if (b) b.classList.toggle("hint", on);
};
const crewHop = (delay) => {
  const now = performance.now() / 1000 + delay;
  CREW.forEach((c, i) => {
    c.hopFrom = now + i * 0.55;
    c.hopUntil = c.hopFrom + 0.5;
  });
};
function teachJump(api) {
  crewHop(0);
  api.later(1900, () => {
    CREW.forEach((c) => (c.y = c.baseY));
    if (api.flag("jumpLearned")) return;
    api.setFlag("jump"); // ここから跳べる(まだ覚えてはいない)
    api.toast(`${jumpKey()}で　とんでみよう`, 8);
    hintB(true);
  });
}
function learnedJump(api) {
  if (api.flag("jumpLearned")) return;
  hintB(false);
  api.later(500, () => {
    crewHop(0); // クルーも一緒に跳ぶ
    api.setFlag("jumpLearned");
    api.learnAbility("jump"); // ここで習得。ほかのフィールドでも跳べるようになる
    api.bubble("player", `ジャンプ　を　おぼえた（${jumpKey()}）`, 4000); // きーの吹き出しで(todo 156、todo 161)
  });
}
const K_HANGAR = {
  tile: T,
  bg: "#2a2622",
  tint: "rgba(255, 190, 150, 0.05)",
  map: kGrid(14, 10, HANGAR_SOLID),
  legend: K_LEGEND,
  drawGround: kImage("bg_hangar", 14 * T, 10 * T),
  spawns: { door: { x: 7 * T, y: 8.6 * T, facing: "north" } },
  triggers: [{ id: "out", x: 6 * T, y: 9.4 * T, w: 2 * T, h: T, warp: { map: "shore", spawn: "hangar" } }],
  onJump(api) {
    learnedJump(api);
  },

  objects: [
    // 木、整備台、ゴンドラは、足もとの y できーと前後
    kFg("fg_hangar", 318, 86, 74, 96, 178),
    kFg("fg_hangar", 156, 186, 102, 48, 231),
    kFg("fg_hangar", 266, 200, 150, 72, 258),
    // ドラム缶の上の波板の壁に、夏の日の集合写真(機体とパイロットと整備兵。黒い台紙)
    {
      id: "photo",
      img: "photo_summer",
      w: 22,
      h: 15,
      x: 8.4 * T,
      y: 2.6 * T,
      sortDy: -30,
      iy: 76, // 調べる場所はドラム缶の手前(ドラム缶のうしろへは回りこまない)
      // ドラム缶の前のどこからでも写真を調べられる(調べる場所を、ドラム缶の幅の中できーの真上に寄せる)。
      // 近くのクルーより写真が先になるように。2026-10-03、作者「エクラノプランの夏の思い出写真が見れない」
      update(dt, t, api) {
        const px = api.player().x;
        this.ix = Math.max(222, Math.min(318, px)) - this.x;
      },
      range: 44,
      interact(api) {
        api.show("v_summer");
      },
    },
    {
      id: "bench",
      x: 6.4 * T,
      y: 7.1 * T,
      w: 1,
      h: 1,
      range: 52,
      interact(api) {
        teachJump(api); // 整備台のまわりで、跳んでみせてくれる
      },
    },
    ...CREW.map((c) =>
      Object.assign(c, {
        range: 44,
        interact(api) {
          api.bubble(c.id, "……", 1200);
          teachJump(api);
        },
      })
    ),
  ],
};

// C' エクラノプランの上(翼に跳び乗ってから、背中を歩いて乗降口へ。機首から尾翼まで歩ける)
// 背景は設計図(全長24マス・翼幅12マス)から、ほかのマップと同じ斜め上から見た下絵を描いて生成。歩けるのは胴体と主翼の上だけ
const WING_POLYS = [
  [[11, 6], [17, 6], [15.6, 1.5], [13.2, 1.5]], // 北の主翼(奥)
  [[11, 10], [17.9, 10], [17.9, 10.9], [15.6, 14.8], [13.2, 14.8]], // 南の主翼(手前、岸の側)。付け根の後ろのすみ(発射筒とジェットの間)から胴体の上へ上がれる
  [[6, 6], [22.5, 6], [22.5, 10], [6, 10]], // 胴体の上面(T字尾翼の下と、操縦席の窓には上がらない)
];
// 背中の発射筒(一段高い筒)は歩けない
// 南の列のいちばん後ろ(翼の付け根の上)は、翼から胴体へ上がる通り道として2マス分あける
const WING_TUBES = [8, 11.1, 14.2].flatMap((x0) => [[x0, 6, x0 + 2.6, 6.8], [x0, 8.8, x0 === 14.2 ? 16.2 : x0 + 2.6, 9.6]]);

const inPoly = (x, y, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const WING_SOLID = (c, r) =>
  !WING_POLYS.some((p) => inPoly(c + 0.5, r + 0.5, p)) ||
  WING_TUBES.some(([x0, y0, x1, y1]) => c + 0.5 > x0 && c + 0.5 < x1 && r + 0.5 > y0 && r + 0.5 < y1);
// 機体の脇で、地上ぼぎクルーが直している(カン、カン)
const repairCrew = (id, img, fx, fy, phase) =>
  hat(img, fx, fy, {
    id,
    range: 44,
    update(dt, t) {
      const u = (t + phase) % 1.3;
      this.y = this.baseY - (u < 0.12 ? 2 : 0);
    },
    draw(ctx, sx, sy, t) {
      const u = (t + phase) % 1.3;
      if (u < 0.1 || u > 0.75) return;
      const k = (u - 0.1) / 0.65;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(30, 30, 40, 0.8)";
      ctx.fillStyle = "#fff6d8";
      const ty = sy - this.h / 2 - 4 - k * 8;
      ctx.strokeText("カン", sx + 12, ty);
      ctx.fillText("カン", sx + 12, ty);
      ctx.fillStyle = "#ffe27a";
      ctx.fillRect(sx + 9, sy - 2, 2, 2);
      ctx.restore();
    },
    interact(api) {
      api.bubble(id, "カン", 900);
    },
  });
const WING_CREW = [
  repairCrew("fix1", "crew_hawk", 19.6 * T, 9.7 * T, 0), // 南のジェットの付け根
  repairCrew("fix2", "crew_wagtail", 15.4 * T, 11.4 * T, 0.45), // 主翼の錆
  repairCrew("fix3", "crew_rooster", 6.7 * T, 7.6 * T, 0.8), // 尾翼の付け根
];
WING_CREW.forEach((c) => (c.baseY = c.y));
const K_WING = {
  tile: T,
  bg: "#6f8fa6",
  tint: "rgba(255, 190, 150, 0.05)",
  map: kGrid(28, 16, WING_SOLID),
  legend: K_LEGEND,
  drawGround: kImage("bg_wing", 28 * T, 16 * T),
  spawns: {
    land: { x: 14.4 * T, y: 13.6 * T, facing: "north" }, // 南の主翼の先
    hatch: { x: 16.4 * T, y: 8.1 * T, facing: "west" }, // 乗降口のわき
  },
  triggers: [{ id: "hatch", x: 17.2 * T, y: 7.55 * T, w: 0.7 * T, h: 0.9 * T, warp: { map: "cabin", spawn: "aft" } }],
  // 南の主翼の先から南へ跳ぶと、傾斜路にもどる
  onJump(api, p) {
    if (p.facing === "south" && p.y > 13 * T && p.x > 12.5 * T && p.x < 16.5 * T) {
      api.later(420, () => api.warp("shore", "slip"));
    }
  },
  objects: WING_CREW,
};

// C'' 機内(背中の乗降口から、はしごで胴体の中の通路へ。機関士席と通信士席の横を抜け、右へそのまま進むと操縦席)
// 当たり判定は背景の絵に合わせる(奥の壁、酸素ボンベの架台、機関士の座席、通信士の腰掛け、ロッカー)
const CABIN_SOLID = (c, r) =>
  r <= 2 ||
  r >= 7 ||
  ((r === 3 || r === 4) && (c === 3 || c === 4 || c === 5 || c === 6 || c === 9 || c === 12));
const K_CABIN = {
  tile: T,
  bg: "#141414",
  map: kGrid(15, 8, CABIN_SOLID),
  legend: K_LEGEND,
  drawGround: kImage("bg_cabin", 15 * T, 8 * T),
  spawns: {
    aft: { x: 2 * T, y: 3.8 * T, facing: "south" }, // 後ろのはしごの下
    fore: { x: 13.6 * T, y: 5.5 * T, facing: "west" }, // 操縦席から出たところ(右端)
  },
  // 後ろのはしごは、歩いて触れるのではなく、調べて上る(入った直後に上を押したままでも、戻されない)
  // 前(右)はそのまま操縦席へ抜ける
  triggers: [{ id: "cockpit", x: 14.6 * T, y: 3 * T, w: T, h: 4 * T, warp: { map: "cockpit", spawn: "door" } }],
  objects: [
    { id: "ladderAft", x: 2 * T, y: 3.1 * T, w: 1, h: 1, range: 44, interact: (api) => api.warp("wing", "hatch") },
    // 酸素ボンベの架台、機関士の座席、通信機の台と腰掛け、ロッカーは、足もとの y できーと前後
    kFg("fg_cabin", 98, 30, 56, 122, 150),
    kFg("fg_cabin", 163, 90, 59, 76, 163),
    kFg("fg_cabin", 268, 30, 76, 136, 163),
    kFg("fg_cabin", 381, 8, 46, 148, 154),
  ],
};

// D 操縦席(左の機長席にミイラさま。右席にきー)
const K_COCKPIT = {
  tile: T,
  bg: "#1d201f",
  // 背景の絵に合わせる: 計器盤と2つの座席の間(操縦桿の台の手前)と、床の乗降口のまわりだけ歩ける
  map: kGrid(10, 7, (c, r) => c === 0 || c === 9 || (r <= 5 && !(r === 5 && (c === 4 || c === 5)))),
  legend: K_LEGEND,
  drawGround: kImage("bg_cockpit", 10 * T, 7 * T),
  spawns: { door: { x: 5 * T, y: 5.5 * T, facing: "north" } },
  // 床の乗降口(下の段)に下りると外へ
  triggers: [{ id: "out", x: 3.6 * T, y: 6 * T, w: 2.8 * T, h: T, warp: { map: "cabin", spawn: "fore" } }],
  objects: [
    // 2 つの座席(左はミイラさまごと)は、足もとの y できーと前後
    // 見届け: 遊覧飛行のあと、ミイラさまが眠るまでそばにいる(D189)
    kWatch({
      id: "w_sleep",
      x: 4 * T,
      y: 5.4 * T,
      r: 2.2 * T,
      sec: 5.5, lure: "255, 236, 200",
      when: (api) => api.cleared("kasumi"),
      fx(ctx, sx, sy, p) {
        kTint(ctx, `rgba(10, 14, 30, ${p * 0.45})`);
        kWord(ctx, "Zzzzzzzz…", sx - 1.2 * T, sy - 3 * T - p * 6, p > 0.4 ? (p - 0.4) * 2 : 0);
      },
    }),
    kFg("fg_cockpit", 44, 70, 88, 128, 196),
    kFg("fg_cockpit", 188, 94, 90, 104, 196),
    // 左の機長席のミイラさま(背景に描いてある)。話しかけると遊覧飛行
    {
      id: "mummy",
      x: 2.8 * T,
      y: 5.6 * T,
      w: 1,
      h: 1,
      headY: 90,
      range: 70,
      interact(api) {
        // ミイラさまはロシア語(キリル文字)で話す。「こんにちは、小さな友だち。遊覧飛行をするかい？」はい / いいえ
        api.say(
          [
            {
              face: "face_mummy",
              voice: "mumble", // 文字が出るあいだ、低いもごもごした声(作者「ミイラさまのロシア語に音をつけて」)
              text: "Здравствуй, маленький друг!\nХочешь совершить прогулочный полёт?",
              choices: ["Да", "Нет"],
            },
          ],
          (choice) => {
            if (choice === 0) api.warp("flight", "view");
          }
        );
      },
    },
  ],
};

// E 遊覧飛行: ① 飛び立つ多重スクロール(空・山なみ・水面) → ② 湖を一周する地図 → ③ キメの一枚絵 → 乗りこむ前の桟橋
let flightT0 = 0;
// 止まった機体が走り出して、3秒で巡航の速さになる(進んだ量)
const runDist = (t) => (t < 3 ? (t * t * t) / 27 : 1 + (t - 3));
const K_FLIGHT = {
  tile: T,
  bg: "#000",
  hidePlayer: true,
  map: kGrid(15, 10, () => false),
  legend: K_LEGEND,
  drawGround(ctx, ox, oy, img) {
    const t = performance.now() / 1000 - flightT0;
    const d = runDist(t);
    const get = (k) => (typeof img === "function" ? img(k) : null);
    const layer = (k, y, speed) => {
      const im = get(k);
      if (!im) return;
      const off = (d * speed) % im.width;
      for (let x = -off; x < 15 * T; x += im.width) ctx.drawImage(im, Math.round(x + ox), y + oy);
    };
    const sky = get("fl_sky");
    if (sky) ctx.drawImage(sky, ox, oy); // 空と朝日は動かない
    layer("fl_hills", 100, 12); // 遠い対岸の山なみ(ゆっくり)
    const wb = get("fl_wbase");
    if (wb) ctx.drawImage(wb, ox, 170 + oy); // 水面の色と朝日のきらめき(太陽の真下で動かない)
    const hl = get("fl_hills");
    if (hl) {
      // 水面に映る山なみ: 山と同じ速さで流れる(上下を返して薄く)
      const off = (d * 12) % hl.width;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.scale(1, -1);
      for (let x = -off; x < 15 * T; x += hl.width) ctx.drawImage(hl, Math.round(x + ox), -(170 + oy) - 50, hl.width, 50);
      ctx.restore();
    }
    layer("fl_ripple", 170, 150); // さざ波だけが速く流れる
    layer("fl_mist", 160, 220);
    const ek = get("fl_ekrano");
    const lift = Math.min(1, t / 3) * 8; // 走り出して、湖面すれすれに浮く(高くは舞い上がれない)
    if (ek) ctx.drawImage(ek, 96 + Math.round(Math.sin(t * 0.7) * 6 * Math.min(1, t / 3)) + ox, 150 - Math.round(lift) + Math.round(Math.sin(t * 1.3) * 2) + oy);
    layer("fl_mist", 196, 300);
  },
  spawns: { view: { x: 7 * T, y: 5 * T, facing: "east" } },
  onEnter(api) {
    flightT0 = performance.now() / 1000;
    api.later(7000, () => api.warp("tour", "view"));
  },
  triggers: [],
  objects: [],
};
// 湖を一周(南岸の上空から北を見下ろす鳥瞰図。基地跡の傾斜路から出て、ぐるりと回って帰ってくる)
// 画面(480×300)ちょうどの絵。機体は横から見た姿で、奥へ行くほど小さく
let tourT0 = 0;
const TOUR_TIME = 13;
const K_TOUR = {
  tile: T,
  bg: "#000",
  hidePlayer: true,
  map: kGrid(15, 10, () => false), // 高さ320にしておくと、カメラが上端(0〜300)にそろう
  legend: K_LEGEND,
  drawGround(ctx, ox, oy, img) {
    const get = (k) => (typeof img === "function" ? img(k) : null);
    const lake = get("fl_lake");
    if (lake) ctx.drawImage(lake, ox, oy);
    const t = Math.min(1, (performance.now() / 1000 - tourT0) / TOUR_TIME);
    const at = (t) => {
      const u = t * t * (3 - 2 * t); // ゆっくり出て、ゆっくり帰る
      const a = Math.PI / 2 - u * Math.PI * 2; // 手前(南岸)から、右回りに奥へ、左から手前へ
      return [240 + Math.cos(a) * 170, 178 + Math.sin(a) * 78]; // 奥行きがつぶれて見える
    };
    const [x, y] = at(t);
    const sheet = get("fl_ekrano8");
    if (!sheet) return;
    // 8 方向の絵(D281。PixelLab、1 コマ 136 ドット。並びは 南・南東・東・北東・北・北西・西・南西)。
    // 画面の動きを湖の上の向きに戻し(奥行きのつぶれ 0.46)、いちばん近い 2 枚を重ねて、向きをなめらかに変える
    const [x2, y2] = at(Math.min(1, t + 0.004));
    const [x0, y0] = at(Math.max(0, t - 0.004));
    const head = Math.atan2((y2 - y0) / 0.46, x2 - x0); // 東 0、南 +90°
    let f = (((Math.PI / 2 - head) / (Math.PI / 4)) % 8 + 8) % 8;
    const i0 = Math.floor(f);
    const i1 = (i0 + 1) % 8;
    const mix = f - i0;
    const C = 136;
    const s = 0.1 + ((y - 100) / 160) * 0.14; // 手前ほど大きい
    const k = s * 2.1; // 機体の長さが、前の横向きの絵とおなじくらいになる倍率
    const w = C * k;
    ctx.save();
    ctx.fillStyle = "rgba(60, 60, 90, 0.25)"; // 湖面すれすれなので、影がすぐ下にある
    ctx.beginPath();
    ctx.ellipse(Math.round(x + ox), Math.round(y + oy + w * 0.18), w * 0.32, Math.max(1.5, w * 0.06), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = true;
    const put = (i, alpha) => {
      ctx.globalAlpha = alpha;
      ctx.drawImage(sheet, i * C, 0, C, C, Math.round(x + ox - w / 2), Math.round(y + oy - w / 2), w, w);
    };
    // 近いほうを地に描き、境目(0.3〜0.7)だけ、もう一方をうすく重ねる
    if (mix < 0.5) {
      put(i0, 1);
      if (mix > 0.3) put(i1, ((mix - 0.3) / 0.2) * 0.5);
    } else {
      put(i1, 1);
      if (mix < 0.7) put(i0, ((0.7 - mix) / 0.2) * 0.5);
    }
    ctx.restore();
  },
  spawns: { view: { x: 7 * T, y: 5 * T, facing: "east" } },
  onEnter(api) {
    tourT0 = performance.now() / 1000;
    api.later(TOUR_TIME * 1000 + 600, () =>
      api.show(
        "v_flight",
        () => {
          api.clear();
          api.warp("shore", "slip"); // 乗りこむ前の傾斜路にもどってくる
        },
        { full: true } // キメの一枚絵は画面いっぱいに
      )
    );
  },
  triggers: [],
  objects: [],
};
