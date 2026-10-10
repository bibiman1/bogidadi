// 断片: 南極のバナナ農園。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== 南極のバナナ農園 ========
// 今の南極・キングジョージ島。ぼぎたちが、人間のテレビ番組をまねて撮り続けている(見ている人はもういない)。
// 条件: マンゴーを食べに来たきこりを、ちりんと一緒に追いかける → 氷の段々をジャンプで上り、マンゴーに届く → 一枚絵
// 次の世界へのカギ: 道具「マンゴー」
// 台詞や鳴き声はすべて仮(文面は作者が決める)。キャラクターの絵も仮(作者が決めて差し替える)

// きこり: 近づくと、道すじの次の点へ逃げる。最後の点(マップの外)まで行くと、次のマップへ消える
function kikoriRunner(route, goneFlag, shownIf, speed) {
  return {
    id: "kikori",
    img: "kikori",
    w: 32,
    h: 34,
    x: route[0][0] * T,
    y: route[0][1] * T,
    sortDy: 15,
    headY: 30,
    range: 50,
    i: 0,
    dir: 1,
    hidden: (api) => api.flag(goneFlag) || !shownIf(api),
    update(dt, t, api) {
      if (api.flag(goneFlag) || !shownIf(api)) return;
      const [tx, ty] = route[this.i].map((v) => v * T);
      const dx = tx - this.x;
      const dy = ty - this.y;
      const dist = Math.hypot(dx, dy);
      const p = api.player();
      if (dist < 3) {
        if (this.i === route.length - 1) {
          api.setFlag(goneFlag);
          return;
        }
        if (Math.hypot(p.x - this.x, p.y - this.y) < 96) {
          if (this.i === 0) api.bubble("kikori", "！", 900); // 仮
          this.i++;
        }
        return;
      }
      const step = Math.min(dist, speed * dt);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      if (Math.abs(dx) > 1) this.dir = dx > 0 ? -1 : 1; // 絵は左向き
    },
    interact(api) {
      api.bubble("kikori", "！", 900); // 仮
    },
    draw() {},
  };
}
// きこりの絵(走るときは跳ねる)。img の描画を止めて、向きと跳ねを付けて描く
function drawKikori(o) {
  const base = o.img;
  o.img = null;
  o.draw = function (ctx, sx, sy, t, api) {
    const im = api.image(base);
    if (!im) return;
    const hop = Math.round(Math.abs(Math.sin(t * 14)) * 3);
    ctx.save();
    ctx.translate(sx, sy - hop);
    ctx.scale(this.dir || 1, 1);
    ctx.drawImage(im, -im.width / 2, -im.height / 2);
    ctx.restore();
  };
  o.shadow = { dy: 15, rx: 11, ry: 3 };
  return o;
}

// ちりん: 最初に近づくと、きーについてくる(きこりに執着している)
function chirinFollower(home) {
  return {
    id: "chirin",
    img: null,
    w: 12,
    h: 44,
    x: home ? home[0] * T : 0,
    y: home ? home[1] * T : 0,
    sortDy: 22,
    headY: 40,
    range: 56,
    near(api) {
      if (api.flag("chirinJoined")) return;
      api.setFlag("chirinJoined");
      api.bubble("chirin", "ちりん", 1600);
    },
    hidden: (api) => !home && !api.flag("chirinJoined"),
    update(dt, t, api) {
      if (!api.flag("chirinJoined")) return;
      const p = api.player();
      if (this._fresh !== api) {
        this._fresh = api;
      }
      if (this._reset) {
        this.x = p.x - 20;
        this.y = p.y + 4;
        this._reset = false;
      }
      const k = Math.min(1, dt * 3);
      this.x += (p.x - 24 - this.x) * k;
      this.y += (p.y + 6 - this.y) * k;
    },
    draw(ctx, sx, sy, t, api) {
      const im = api.image("chirin");
      if (!im) return;
      const sway = Math.sin(t * 2.4) * 0.12;
      ctx.save();
      ctx.translate(sx, sy - 44 + Math.round(Math.sin(t * 1.7) * 2));
      ctx.rotate(sway);
      ctx.drawImage(im, -im.width / 2, 0);
      ctx.restore();
    },
  };
}
const bSprite = (id, img, fx, fy, w, h, text) => ({
  id,
  img,
  w,
  h,
  x: fx,
  y: fy - h / 2 + 4,
  sortDy: h / 2 - 4,
  headY: h - 6,
  solid: { w: w * 0.7, h: 12, dy: h / 2 - 8 },
  range: 52,
  interact(api) {
    api.bubble(id, text, 1600); // 仮
  },
});
const chirinEnter = (objs) => () => {
  const c = objs.find((o) => o.id === "chirin");
  if (c) c._reset = true;
};

// 前後の重なり: 背景の絵から切り出した木・小屋・看板などを、根もとの高さで、きーと前後を並べて描く。
// きーが根もとより奥にいると、葉の後ろに隠れる。切り出しと数字は docs/assets/banana/blockout2.py が書き出す
// B_FG の一件は [絵の中の x, y, 幅, 高さ, マップの x, y, 根もとの y]
const B_FG = {
  shore: [[0,0,92,64,777,0,64],[93,0,85,79,537,0,79],[179,0,88,79,591,0,79],[268,0,60,82,0,0,82],[329,0,86,82,36,1,83],[416,0,71,74,214,9,83],[488,0,78,82,266,4,86],[567,0,75,69,499,17,86],[643,0,84,86,145,1,87],[728,0,68,74,99,14,88],[797,0,80,88,332,1,89],[878,0,86,83,659,6,89],[0,89,68,92,294,80,172],[69,89,79,99,619,86,185],[149,89,73,96,47,115,211],[223,89,71,90,466,127,217],[309,89,71,90,209,134,224]],
  farm: [[0,0,57,30,351,0,30],[58,0,38,30,858,0,30],[97,0,51,31,481,0,31],[149,0,55,31,682,0,31],[205,0,48,31,747,0,31],[254,0,57,31,805,0,31],[312,0,53,32,611,0,32],[366,0,49,33,0,0,33],[416,0,56,33,416,0,33],[473,0,62,34,224,0,34],[536,0,52,36,289,0,36],[589,0,54,36,551,0,36],[644,0,81,67,521,0,67],[726,0,92,67,578,0,67],[819,0,76,67,775,0,67],[896,0,67,68,210,0,68],[964,0,59,69,648,0,69],[0,70,80,73,8,0,73],[81,70,77,73,713,0,73],[159,70,52,70,844,70,140],[212,70,42,66,0,94,160],[255,70,70,82,80,88,170],[326,70,81,79,140,91,170],[408,70,86,89,5,82,171],[495,70,79,82,264,93,175],[575,70,137,69,521,127,196],[713,70,131,97,671,127,224],[845,70,42,71,854,223,294],[888,70,73,71,75,223,294],[0,168,73,83,137,211,294],[74,168,99,90,704,204,294],[174,168,73,80,9,215,295],[248,168,92,93,261,203,296],[341,168,88,90,776,207,297],[430,168,46,76,0,228,304],[477,168,70,80,331,313,393],[548,168,75,86,142,310,396],[624,168,79,88,648,308,396],[704,168,84,82,777,314,396],[789,168,83,82,196,315,397],[873,168,78,81,724,316,397],[0,262,77,87,262,311,398],[78,262,81,87,521,312,399],[160,262,67,59,487,355,414],[228,262,44,65,0,370,435],[273,262,57,74,839,367,441]],
  canal: [[0,0,52,30,237,0,30],[53,0,56,30,561,0,30],[110,0,45,31,0,0,31],[156,0,46,31,175,0,31],[203,0,51,31,493,0,31],[255,0,48,32,308,0,32],[304,0,53,33,619,0,33],[358,0,57,34,50,0,34],[416,0,55,34,114,0,34],[472,0,64,35,363,0,35],[537,0,57,35,433,0,35],[595,0,56,36,682,0,36],[652,0,41,38,855,0,38],[694,0,56,58,228,6,64],[751,0,75,92,37,16,108],[827,0,74,88,528,27,115],[902,0,81,99,650,19,118],[0,100,70,85,739,139,224],[71,100,74,85,540,158,243],[146,100,69,82,208,167,249],[216,100,40,62,0,254,316],[257,100,69,69,203,247,316],[327,100,68,72,273,244,316],[396,100,81,73,320,243,316],[478,100,63,63,463,253,316],[542,100,67,76,528,240,316],[610,100,69,65,594,251,316],[680,100,69,66,658,250,316],[750,100,62,59,721,257,316],[813,100,74,64,782,252,316],[888,100,48,69,848,247,316]],
  steps: [[0,0,43,63,0,129,192],[44,0,49,60,463,138,198],[94,0,151,175,147,53,228],[246,0,46,48,28,227,275],[293,0,48,43,437,238,281],[342,0,36,57,0,275,332],[379,0,40,61,472,278,339],[420,0,70,86,395,330,416],[491,0,70,85,39,337,422],[562,0,53,64,0,416,480],[616,0,48,64,464,422,486],[665,0,71,89,393,455,544],[737,0,60,77,72,479,556],[798,0,40,62,0,565,627],[839,0,44,57,468,576,633]],
};
const bFront = (img, list) =>
  list.map(([ax, ay, w, h, x0, y0, base]) => ({
    x: x0 + w / 2,
    y: base,
    draw(ctx, sx, sy, t, api) {
      const im = api.image(img);
      if (im) ctx.drawImage(im, ax, ay, w, h, sx - w / 2, sy - (base - y0), w, h);
    },
  }));

// A 浜(入口。湾に突き出た桟橋から上がる。北の密林の切れ目の道の先が農園)
// 「熱帯雨林に一日だけドカ雪が積もった」南極。マップの絵と当たり判定は docs/assets/banana/blockout2.py から
// 浜のペンギン 7 羽は、足もとの y できーと前後(fg_shore2。docs/assets/banana/fg_penguins.py)。群れの足もとは通れない
// 2026-10-03、作者「おかしい」。2026-10-10、作者「ペンギンが木と重なりが違和感」で、群れを貫くヤシを抜き、群れの西に浜のヤシを反転して植えた(docs/assets/banana/move_palm.py)
const B_PENGUINS = [
  ...[[542, 118, 569, 158], [569, 116, 595, 152], [596, 124, 623, 158], [625, 124, 651, 158]].map(([x0, y0, x1, y1]) => kFg("fg_shore2", x0, y0, x1 - x0, y1 - y0, 155)),
  ...[[544, 152, 571, 187], [569, 152, 595, 187], [596, 154, 623, 188]].map(([x0, y0, x1, y1]) => kFg("fg_shore2", x0, y0, x1 - x0, y1 - y0, 186)),
  kWall(542, 138, 651, 188),
];
const B_SHORE_OBJS = [chirinFollower(null), ...bFront("fg_shore", B_FG.shore), ...B_PENGUINS];
const B_SHORE = {
  tile: T,
  bg: "#e8eef6",
  map: [
    "#############..#############",
    "#############..#############",
    "#############..#############",
    "......................######",
    "......................######",
    "..........#.........#.######",
    "...#...#.......#......######",
    "......................######",
    "#############..#############",
    "#############..#############",
    "#############..#############",
  ],
  legend: K_LEGEND,
  drawGround: kImage("bg_shore", 28 * T, 11 * T),
  snow: 2,
  spawns: {
    start: { x: 14 * T, y: 10.2 * T, facing: "north" },
    north: { x: 14 * T, y: 1.2 * T, facing: "south" },
  },
  triggers: [
    { id: "toFarm", x: 13 * T, y: -T, w: 2 * T, h: 1.3 * T, warp: { map: "farm", spawn: "south" } },
    { id: "leave", x: 13 * T, y: 10.75 * T, w: 2 * T, h: T, run: (api) => api.exit() },
  ],
  onEnter: chirinEnter(B_SHORE_OBJS),
  objects: B_SHORE_OBJS,
};

// B 第三バナナ農園(当たり判定は、下絵で描いたバナナの株の根もと・小屋・撮影の道具・看板)
const B_FARM_GRID = [
  "##.....#####################",
  ".......#.........#.#.#...#..",
  ".#.....................#....",
  "............................",
  "#..........................#",
  ".#.#.#...#......#########...",
  ".....................####...",
  "............................",
  "............................",
  "##.#.#...#.............#.#.#",
  "............................",
  "............................",
  ".....#.#.#.#.....#...#.#.#..",
  "#..............##..........#",
];
const B_FARM_OBJS = [
  drawKikori(kikoriRunner([[8, 8], [12.5, 8], [12.5, 3.2], [7, 3.2], [4.5, 1.2], [4.5, -1.5]], "fledFarm", () => true, 170)),
  chirinFollower([9.5, 8.6]),
  bSprite("kikikori", "kikikori", 16.6 * T, 7.6 * T, 47, 47, "……"),
  bSprite("goron", "goron", 20.2 * T, 7.8 * T, 40, 34, "……"),
  ...bFront("fg_farm", B_FG.farm),
];
const B_FARM = {
  tile: T,
  bg: "#e8eef6",
  map: B_FARM_GRID,
  legend: K_LEGEND,
  drawGround: kImage("bg_farm", 28 * T, 14 * T),
  snow: 2,
  spawns: {
    south: { x: 14 * T, y: 12.6 * T, facing: "north" },
    north: { x: 4.5 * T, y: 1.4 * T, facing: "south" },
  },
  triggers: [
    { id: "toShore", x: 13 * T, y: 13.6 * T, w: 2 * T, h: T, warp: { map: "shore", spawn: "north" } },
    { id: "toCanal", x: 3 * T, y: -T, w: 3 * T, h: 1.3 * T, warp: { map: "canal", spawn: "south" } },
  ],
  onEnter: chirinEnter(B_FARM_OBJS),
  objects: B_FARM_OBJS,
};

// C 雪に埋もれかけた用水路(丸木橋で渡る)
const B_CANAL_OBJS = [
  drawKikori(kikoriRunner([[7, 7.3], [12.9, 7.3], [12.9, 2.6], [19, 2.6], [25.5, 2.6], [25.5, -1.5]], "fledCanal", (api) => api.flag("fledFarm"), 230)),
  chirinFollower(null),
  ...bFront("fg_canal", B_FG.canal),
];
const B_CANAL = {
  tile: T,
  bg: "#e8eef6",
  map: [
    "########################...#",
    "........#..................#",
    "............................",
    "..#..............#...#......",
    "############..##############",
    "############..##############",
    ".......................#....",
    "..................#.........",
    "............................",
    "###....#####################",
  ],
  legend: K_LEGEND,
  drawGround: kImage("bg_canal", 28 * T, 10 * T),
  snow: 2,
  spawns: {
    south: { x: 4.5 * T, y: 8.6 * T, facing: "north" },
    north: { x: 25.5 * T, y: 1.2 * T, facing: "south" },
  },
  triggers: [
    { id: "toFarm", x: 3 * T, y: 9.6 * T, w: 3 * T, h: T, warp: { map: "farm", spawn: "north" } },
    { id: "toSteps", x: 24 * T, y: -T, w: 3 * T, h: 1.3 * T, warp: { map: "steps", spawn: "south" } },
  ],
  onEnter: chirinEnter(B_CANAL_OBJS),
  objects: B_CANAL_OBJS,
};

// D 雪の棚田とマンゴーの丘。段の石垣は、手前で北を向いて跳ぶと上がれる(南を向いて跳ぶと下りる)
// 歩ける所: 下の雪原(15〜19 行)、段 1 の上(11〜13 行)、段 2 の上(7〜9 行)。段 3 はマンゴーの木の下で上がれない
const STEPS_GRID = [
  "################",
  "################",
  "################",
  "################",
  "################",
  "################",
  "################",
  "###...##.....###",
  "###..........###",
  "###..........###",
  "################",
  "##............##",
  "##............##",
  "##............##",
  "################",
  "#..............#",
  "#...........#..#",
  "#..#...........#",
  "#..............#",
  "#..............#",
];
const B_STEPS_OBJS = [
  // 見届け: きこりとちりんがマンゴーを食べ終わるまで待つ(D189)
  kWatch({
    id: "w_mango",
    x: 8 * T,
    y: 8.6 * T,
    r: 2.6 * T,
    sec: 5.5, lure: "255, 200, 80",
    when: (api) => api.flag("caught"),
    fx(ctx, sx, sy, p, t) {
      kWord(ctx, "もぐ　もぐ", sx + 1.2 * T, sy - 2 * T - Math.abs(Math.sin(t * 5)) * 3, (1 - p) * 1.4);
    },
  }),
  Object.assign(
    drawKikori({
      id: "kikori",
      img: "kikori",
      w: 32,
      h: 34,
      x: 9.2 * T,
      y: 8.2 * T,
      sortDy: 15,
      headY: 30,
      range: 56,
      dir: 1,
      hidden: (api) => !api.flag("fledCanal"),
      // マンゴーのあと(D201): きこりはマンゴーをくわえたまま、下の雪原を逃げまわる。歩いて近づくと逃げられる。
      // はしる(呪いの野犬で覚える)で追いつくと、立ち止まって、ちりんと食べはじめる(見届け)
      ang: 0,
      update(dt, t, api) {
        if (!api.cleared("banana")) return;
        const C = { x: 8 * T, y: 17.3 * T, rx: 5.4 * T, ry: 1.5 * T };
        const at = () => ({ x: C.x + Math.cos(this.ang) * C.rx, y: C.y + Math.sin(this.ang) * C.ry });
        if (api.flag("caught")) return;
        if (!this.fleeing) {
          this.fleeing = true;
          this.ang = Math.PI / 2;
          Object.assign(this, at());
        }
        const p = api.player();
        const d = Math.hypot(p.x - this.x, p.y - this.y);
        if (api.running() && d < 1.1 * T) {
          api.setFlag("caught");
          api.bubble("kikori", "！", 900);
          return;
        }
        if (d < 3 * T) {
          // きーから遠ざかる向きへ、輪の上を走る
          const step = (175 / ((C.rx + C.ry) / 2)) * dt;
          const a1 = this.ang + step;
          const a2 = this.ang - step;
          const dist = (a) => Math.hypot(p.x - (C.x + Math.cos(a) * C.rx), p.y - (C.y + Math.sin(a) * C.ry));
          this.ang = dist(a1) >= dist(a2) ? a1 : a2;
          const nx = at().x;
          this.dir = nx >= this.x ? 1 : -1;
          Object.assign(this, at());
        }
      },
      interact(api) {
        api.bubble("kikori", "！", 900); // 仮
      },
    }),
    {}
  ),
  chirinFollower(null),
  ...bFront("fg_steps", B_FG.steps),
];
// 見届けは、きこりのいる所で(追いついて、食べはじめたら)
(() => {
  const w = B_STEPS_OBJS.find((o) => o.id === "w_mango");
  const k = B_STEPS_OBJS.find((o) => o.id === "kikori");
  const u0 = w.update;
  w.update = function (dt, t, api) {
    if (api.cleared("banana")) Object.assign(this, { x: k.x, y: k.y + 0.4 * T });
    u0.call(this, dt, t, api);
  };
})();
// きこりは木の下で、とどかないマンゴーに跳びつき続けている
(() => {
  const k = B_STEPS_OBJS.find((o) => o.id === "kikori");
  const d0 = k.draw;
  k.draw = function (ctx, sx, sy, t, api) {
    const u = (t * 1.3) % 1;
    const lift = api.flag("gotMango") ? 0 : Math.round(Math.max(0, Math.sin(u * Math.PI * 2)) * 10);
    d0.call(this, ctx, sx, sy - lift, t, api);
  };
})();
const B_STEPS = {
  tile: T,
  bg: "#e8eef6",
  map: STEPS_GRID,
  legend: K_LEGEND,
  drawGround: kImage("bg_steps", 16 * T, 20 * T),
  snow: 2,
  spawns: {
    south: { x: 8 * T, y: 18.6 * T, facing: "north" },
  },
  triggers: [{ id: "toCanal", x: 7 * T, y: 19.6 * T, w: 2 * T, h: T, warp: { map: "canal", spawn: "north" } }],
  onEnter: chirinEnter(B_STEPS_OBJS),
  onJump(api, p) {
    const up = (y) => api.later(240, () => api.place(p.x, y));
    if (p.facing === "north") {
      if (p.y >= 15 * T && p.y < 16 * T && p.x > 2 * T && p.x < 14 * T) up(13.4 * T);
      else if (p.y >= 11 * T && p.y < 12 * T && p.x > 3 * T && p.x < 13 * T) up(9.4 * T);
      else if (p.y < 8.8 * T && p.x > 4.6 * T && p.x < 10 * T && !api.flag("gotMango") && api.flag("fledCanal")) {
        // マンゴーに届く → きこりが追いつき、かぶりつく(一枚絵)
        api.setFlag("gotMango");
        api.later(300, () => {
          api.giveItem("マンゴー");
          api.later(900, () => api.show("v_final", () => api.clear(), { full: true }));
        });
      }
    } else if (p.facing === "south") {
      if (p.y >= 13 * T && p.y < 14 * T) up(15.5 * T);
      else if (p.y >= 9 * T && p.y < 10 * T) up(11.5 * T);
    }
  },
  objects: B_STEPS_OBJS,
};
