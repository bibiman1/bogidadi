// 断片: 本栖湖の長門(湖畔の旅館。todo 282、D685〜D692)
// はじめから(斉射の前でも D703)、湖畔の通りの旅館の暖簾をくぐると夜。一階(土間、帳場、広間、階段)→ 二階(階段の口、客室、広縁)→
// 広縁の籐椅子に座ると、縁側から湖の向こうに、長門の斉射の高空の爆発が花火のように開く(クルーが習慣で撃つ D534)。
// 中にはだれもいない。音楽は止める。旅館を出ると、湖畔の通りも夜になる(D686)。湯殿はのれんから湯気だけ(D687)
// 花火を見終えると、きーは泊まって朝。暗転のあと二階の広縁に戻り、夜の色が外れる(D704、D705)
// 絵は docs/record/2026-11-12/ryokan/(Pro 3 回、75 回分)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kGrid、ngBurst など)をそのまま使う
"use strict";

// ---- 湖畔の通り: 旅館の暖簾と、夜 ----
const NG_RYO = { door: { x: 1185, y: 11.0 * T }, view: 0 };
NG_KOHAN.spawns.ryokan = { x: 1185, y: 11.7 * T, facing: "south" }; // 旅館から出てきた所
NG_KOHAN.objects.push({
  id: "ryokan",
  x: NG_RYO.door.x,
  y: NG_RYO.door.y,
  w: 1,
  h: 1,
  headY: 40,
  range: 1.4 * T,
  draw() {},
  interact: (api) => {
    api.setFlag("night"); // 暖簾をくぐると夜。出ると通りも夜(D686)。いつでも入れる(D703)
    api.warp("ryo1", "door");
  },
});
// 夜の通り: 全体を青く暗くし、店と旅館の灯りをともす(今の絵に色を重ねるだけ。PixelLab 0 回 D686)
const NG_NIGHT_LIGHTS = [
  // [x, y, 半径]: 旅館の 1 階の格子窓と行灯、2 階の窓、土産物屋の提灯、白い商店の窓
  [1067, 300, 40], [1300, 300, 40], [1120, 290, 22], [1250, 290, 22], [1110, 130, 34], [1190, 130, 34], [1270, 130, 34],
  [650, 268, 46], [360, 150, 30], [440, 150, 30],
];
NG_KOHAN.drawOverlay = (ctx, ox, oy, t, api) => {
  if (!api.flag("night")) return;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgb(70, 82, 150)";
  ctx.fillRect(-T, -T, 60 * T, 30 * T);
  ctx.globalCompositeOperation = "lighter";
  for (const [x, y, r] of NG_NIGHT_LIGHTS) {
    const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
    const k = 0.9 + Math.sin(t * 2 + x) * 0.05;
    g.addColorStop(0, `rgba(255, 170, 80, ${0.42 * k})`);
    g.addColorStop(1, "rgba(255, 170, 80, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
  }
  ctx.restore();
};

// ---- 一階(15 × 10 マス、北を向いて見る。手前の南が暖簾)----
// 下から: 土間と下足箱、上がり框、左に広間、まん中に階段(奥へ上がる)、右に帳場。奥の壁に調理場と湯殿ののれん
const NG_RYO1_WALK = (c, r) => (r >= 7 && r <= 9 && c >= 1 && c <= 13 && !(r === 9 && (c <= 1 || c >= 13))) || (c >= 7 && c <= 8 && r >= 4 && r <= 6);
const ngRyoBg = (key) => (ctx, ox, oy, img, api) => {
  const bg = api.image(key);
  if (bg) ctx.drawImage(bg, Math.round(ox), Math.round(oy));
};
// 湯殿ののれんの下から、湯気がもれる(D687)
const ngSteam = (ctx, ox, oy, t) => {
  for (let i = 0; i < 9; i++) {
    const u = (t * 0.22 + i / 9) % 1;
    const x = 400 + ((i * 37) % 46) + Math.sin(t * 0.8 + i) * 4;
    const y = 74 - u * 30; // のれんのすそから、廊下へもれて消える
    const r = 3 + u * 8;
    ctx.fillStyle = `rgba(235, 232, 226, ${0.22 * Math.sin(u * Math.PI)})`;
    ctx.beginPath();
    ctx.ellipse(Math.round(x + ox), Math.round(y + oy), r * 1.4, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
};
const NG_RYO1 = {
  tile: T,
  bg: "#1a1210",
  bgm: "silence", // だれもいない旅館は静か
  map: kGrid(15, 10, (c, r) => !NG_RYO1_WALK(c, r)),
  legend: K_LEGEND,
  drawGround(ctx, ox, oy, img, api) {
    ngRyoBg("bg_ryokan1")(ctx, ox, oy, img, api);
    ngSteam(ctx, ox, oy, performance.now() / 1000);
  },
  spawns: {
    door: { x: 7.5 * T, y: 9.3 * T, facing: "north" },
    stairs: { x: 8.0 * T, y: 6.6 * T, facing: "south" }, // 二階から下りてきた所
  },
  objects: [],
  triggers: [
    { id: "out", x: 5 * T, y: 9.75 * T, w: 5 * T, h: T, run: (api) => api.warp("kohan", "ryokan") },
    { id: "up", x: 7 * T, y: 4.0 * T, w: 2 * T, h: 0.5 * T, run: (api) => api.warp("ryo2", "stairs") },
  ],
};

// ---- 二階(15 × 10 マス)。まん中が階段の口(一階とそろえる D690)、右の踊り場から手前の広縁へ ----
// 左は床の間の客室(襖が開いている)、右は襖の閉じた客室。広縁に籐椅子 2 脚。籐椅子に座ると、花火の場面
const NG_RYO2_WALK = (c, r) => (c >= 9 && c <= 10 && r >= 4 && r <= 6) || (r === 7 && c >= 0 && c <= 14);
const NG_RYO2 = {
  tile: T,
  bg: "#1a1210",
  bgm: "silence",
  map: kGrid(15, 10, (c, r) => !NG_RYO2_WALK(c, r)),
  legend: K_LEGEND,
  drawGround: ngRyoBg("bg_ryokan2"),
  spawns: {
    stairs: { x: 10.0 * T, y: 5.6 * T, facing: "south" }, // 一階から上がってきた所
    chair: { x: 10.4 * T, y: 7.6 * T, facing: "west" }, // 花火を見て泊まった朝(D705)
  },
  objects: [
    // 籐椅子(絵に描いてある)。上を歩かない。右の椅子に座ると、花火の場面
    { id: "chairL", x: 202, y: 246, w: 1, h: 1, solid: { w: 30, h: 14, dy: -6 }, draw() {} },
    { id: "table", x: 241, y: 246, w: 1, h: 1, solid: { w: 18, h: 10, dy: -5 }, draw() {} },
    {
      id: "chairR",
      x: 280,
      y: 246,
      w: 1,
      h: 1,
      headY: 30,
      range: 1.6 * T,
      solid: { w: 30, h: 14, dy: -6 },
      draw() {},
      interact: (api) => api.warp("hanabi", "view"),
    },
  ],
  triggers: [{ id: "down", x: 9 * T, y: 4.0 * T, w: 2 * T, h: 0.5 * T, run: (api) => api.warp("ryo1", "stairs") }],
};

// ---- 花火の場面(動く一枚。カメラの決まりの外)。縁側から南を向き、湖の向こうの長門と富士 ----
// 長門が撃つ(湖の上に小さな火)→ 2 秒ほどで、空に火球が 4 つ、また 4 つ。光が先で、音は遅れて届く(D592)。
// 遠いので EMP の砂あらしはなし、画面が少しゆらぐだけ。ぴーの顔は出さない(D685)。きーも椅子も描かず、眺めだけ(D706)
// 終わりは暗転を長めにして一晩たち、朝(D704、D705)
const NG_HB = {
  ship: [214, 186], // 長門の砲(夜景の絵の上)
  fire: [2.0, 7.0], // 長門が撃つ秒
  rise: 2.0, // 撃ってから空で開くまで
  boom: 3.0, // 開いてから音が届くまで
  gap: 0.45,
  end: 17.0, // 暗くなりきる秒
  sleep: 2.0, // 暗いまま待つ(泊まる)
  k: 0.5, // 火球の大きさ(斉射の場面の半分。遠くから見る)
  bursts: [
    [[150, 70], [262, 44], [352, 86], [420, 50]],
    [[196, 46], [300, 90], [392, 60], [100, 56]],
  ],
};
const ngHb = { t: 0, done: {}, off: null };
const NG_HANABI = {
  tile: T,
  bg: "#0a0c1e",
  bgm: "silence",
  hidePlayer: true,
  map: kGrid(15, 9, () => false),
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 4 * T, facing: "south" } },
  objects: [],
  triggers: [],
  debug: () => ngHb,
  onEnter() {
    ngHb.t = 0;
    ngHb.done = {};
  },
  onA: () => true,
  onB: () => true,
  input(api, dt) {
    ngHb.t += dt;
    api.place(7 * T, 4 * T);
    const t = ngHb.t;
    const once = (k, at, fn) => {
      if (!ngHb.done[k] && t >= at) {
        ngHb.done[k] = true;
        fn();
      }
    };
    NG_HB.fire.forEach((f, s) => {
      for (let i = 0; i < 4; i++) once(`b${s}_${i}`, f + NG_HB.rise + NG_HB.boom + i * NG_HB.gap, () => (api.sfx("nuke"), api.shake(0.8, 1)));
    });
    once("end", NG_HB.end + NG_HB.sleep, () => {
      api.setFlag("night", false); // 朝。旅館の中は今の絵のまま、通りは西日に戻る(D705)
      api.warp("ryo2", "chair");
    });
  },
  drawGround(ctx, ox, oy, img, api) {
    const t = ngHb.t;
    const X = Math.round(ox);
    const Y = Math.round(oy);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const bg = api.image("bg_ryokan_view");
    if (bg) ctx.drawImage(bg, X, Y);
    // 火球は斉射の場面の絵(ngBurst)を、裏の画面に 2 倍の座標で描いて、半分に縮めて重ねる
    if (!ngHb.off) {
      ngHb.off = document.createElement("canvas");
      ngHb.off.width = 960;
      ngHb.off.height = 576;
    }
    const g = ngHb.off.getContext("2d");
    g.clearRect(0, 0, 960, 576);
    let tint = 0;
    let flash = 0;
    NG_HB.fire.forEach((f, s) => {
      const t0 = f + NG_HB.rise;
      NG_HB.bursts[s].forEach(([bx, by], i) => ngBurst(g, bx * 2, by * 2, t - t0 - i * 0.18));
      const a = t - t0;
      if (a >= 0) tint = Math.max(tint, 0.22 * Math.max(0, 1 - a / 4));
      for (let i = 0; i < 4; i++) {
        const u = (t - t0 - i * 0.18) / 0.25;
        if (u >= 0 && u < 1) flash = Math.max(flash, 0.35 * (1 - u));
      }
      // 湖の上の長門が撃つ(小さな火が 2 度またたく)
      const w = t - f;
      if (w >= 0 && w < 0.5) {
        const [sx, sy] = NG_HB.ship;
        ctx.fillStyle = `rgba(255, 200, 110, ${1 - w * 2})`;
        for (let i = 0; i < 4; i++) ctx.fillRect(X + sx + i * 7, Y + sy - 2 - (i % 2), 3, 2);
      }
    });
    if (tint > 0) {
      ctx.fillStyle = `rgba(255, 110, 70, ${tint})`;
      ctx.fillRect(X, Y, 480, 228); // 空と湖(手すりの上)
    }
    ctx.drawImage(ngHb.off, 0, 0, 960, 576, X, Y, 480, 288);
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 250, 235, ${flash})`;
      ctx.fillRect(X, Y, 480, 288);
    }
    // きーも籐椅子も描かない。縁側からの眺めだけ(D706)
    // 入りと終わりは暗くつなぐ
    const e = Math.max(1 - t / 0.8, (t - (NG_HB.end - 1.5)) / 1.5);
    if (e > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, e)})`;
      ctx.fillRect(X, Y, 480, 288);
    }
    ctx.restore();
  },
};
