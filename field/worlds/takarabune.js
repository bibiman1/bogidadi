// 断片: 宝舟と首振りエンジン。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== 宝舟と首振りエンジン ========
// 今の夜、欠けて輪のある月。名前のない小さな漁港と、岬の上の止まった発電所(D84〜D88)。絵と当たり判定は docs/assets/takarabune/
// 条件(D88): 発電所の奥(正門 → 管理棟 → タービン建屋 → 原子炉建屋 → 炉心)のプールに飛び込んで「ペレット」→ 暗転して港へ
// → 鋳造工房のぼぎにペレットを渡す(炉が青白く燃え、るつぼの金属くずが溶ける。一枚絵)→ 道具「首振りエンジンの部品」
// → 宝舟の機関室で部品を取り付け → ボイラーの火室にペレット → 首振りエンジンが動く → 甲板で沖へ → ペレットを海に投げ込む → 青く光る海(一枚絵)
// → 港で「白紙の海図」。ペレットは一つで、鋳造・エンジン・海に使いまわす。西の坂道からいつでも帰れる。きーは警告に反応しない(D84)
const TK_GRIDS = {
  // 港湾ぼぎ(マトリョシカ)の食堂兼休憩所(D441)。北に調理場とカウンター、長い机 4 つとベンチ、東にだるまストーブ、南に戸口
  canteen: [
    // 外まわりだけマスで決め、中の家具は TK_CANTEEN_SOLID(ドット単位)でふさぐ(机のあいだを、絵のとおりに通れるように)
    "################",
    "################",
    "################",
    "################",
    "#..............#",
    "#..............#",
    "#..............#",
    "#..............#",
    "#..............#",
    "#########..#####",
  ],
  port: [
    "############################",
    "############################",
    "########################....",
    "########################....",
    "########################....",
    "..#######...................",
    "............................",
    "...##.......................",
    "............................",
    "............................",
    "############################",
    "############################",
    "############################",
    "############################",
  ],
  gate: [
    "###########....#############",
    "###########....#############",
    "###########....#############",
    "###########....#############",
    "###########....#############",
    ".................####.......",
    ".................####.......",
    "............................",
    "............................",
    "############################",
  ],
  // 構内(正門と管理棟のあいだ。todo 152、作者「別な画面にして」): 北に管理棟の正面と扉、南は正門の裏(門のすきまだけ通れる)
  // 網小屋の中(D457)。奥の壁に大漁旗、左右に網の山、棚に浮き玉、床に長靴。南のまん中が戸口。暗い(てらすで見える)
  amigoya: [
    "##############",
    "##############",
    "##############",
    "#............#",
    "#............#",
    "#............#",
    "#............#",
    "#............#",
    "######..######",
  ],
  yard: [
    "####################",
    "####################",
    "####################",
    "####################",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "#..................#",
    "#########..#########",
  ],
  admin: [
    "########################",
    "########################",
    "#.############.........#",
    "#.############..######.#",
    "#.############..######.#",
    "#......................#",
    "#......................#",
    "#......................#",
    "#.......................",
    "#.......................",
    "#......................#",
    "####..##################",
  ],
  turbine: [
    "############################",
    "############################",
    "............................",
    "............................",
    "...######################...",
    "...######################...",
    "...######################...",
    "...######################...",
    "............................",
    "............................",
    "############################",
    "############################",
  ],
  reactor: [
    "####################",
    "####################",
    "#..................#",
    "#.#..............#.#",
    "#.......####.......#",
    "#.....########.....#",
    "#.....########.....#",
    "#....##########....#",
    "#....##########....#",
    "#....##########....#",
    "#.#...########...#.#",
    "#.....########.....#",
    "........####.......#",
    "...................#",
    "..##################",
    "####################",
  ],
  core: [
    "################",
    "################",
    "#.....####.....#",
    "#...########...#",
    "#..##########..#",
    "#..##########..#",
    "#..##########..#",
    "#..##########..#",
    "#...########...#",
    "#....######....#",
    "#..............#",
    "#..............#",
    "#..............#",
    "#######..#######",
  ],
  deck: [
    "####################",
    "####################",
    "####################",
    "#####............###",
    "####..###.#.......##",
    "####..###.#.......##",
    "##...............###",
    "####################",
    "####################",
    "####################",
  ],
  workshop: [
    "################",
    "################",
    "#####......#####",
    "#####......#####",
    "#####......#####",
    "####...####.####",
    "####...####.####",
    "##.....####.####",
    "##.....####.####",
    "####........####",
    "####........####",
    "#######..#######",
  ],
  engineroom: [
    "################",
    "################",
    "####...####..###",
    "####...####..###",
    "####...####....#",
    "####...####....#",
    "#......####....#",
    "#......####....#",
    "#..............#",
    "################",
  ],
};
const tkMap = (key, cols, rows, extra) =>
  Object.assign({ tile: T, bg: "#0c1220", map: TK_GRIDS[key], legend: K_LEGEND, drawGround: kImage(`bg_${key}`, cols * T, rows * T) }, extra);
const tkSpot = (id, x, y, interact, extra) => Object.assign({ id, x, y, w: 1, h: 1, range: 48, headY: 40, interact }, extra);
// 灯りのゆらぎ(非常灯、回転灯、炉の火)を、絵の上に光の輪として重ねる
const tkLight = (ctx, x, y, r, rgb, a) => {
  const g = ctx.createRadialGradient(x, y, 2, x, y, r);
  g.addColorStop(0, `rgba(${rgb}, ${a})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
};
const tkNow = () => performance.now() / 1000;
// 湯気のかたまり(上へのぼりながら広がって消える)
const tkPuffs = [];
const tkPuff = (x, y, vx, vy, life, size) => tkPuffs.push({ x, y, vx, vy, t0: tkNow(), life, size });
const tkDrawPuffs = (ctx, ox, oy) => {
  const now = tkNow();
  for (let k = tkPuffs.length - 1; k >= 0; k--) {
    const p = tkPuffs[k];
    const u = (now - p.t0) / p.life;
    if (u >= 1) {
      tkPuffs.splice(k, 1);
      continue;
    }
    const s = Math.round(p.size * (0.6 + u * 1.4));
    ctx.fillStyle = `rgba(232, 236, 244, ${0.75 * (1 - u)})`;
    ctx.fillRect(Math.round(ox + p.x + p.vx * u * p.life - s / 2), Math.round(oy + p.y + p.vy * u * p.life - s / 2), s, s);
  }
};

// ---- 首振りエンジン(首振り式の蒸気機関、D88)----
// しくみ: ピストン棒の先がクランクピンに直につながる。クランクが回ると、ピンを追ってシリンダー全体が下の軸(トラニオン)で首を振る。
// 首を振ると、軸の面の口が蒸気の入口と出口に交互に重なる(弁の仕掛けがいらない)。複動式なので、1 回転に 2 回、蒸気を吐く(上と下の死点)。
// 回転は、ペレットを火室に入れてから、圧力が上がるのを待って(TK_PRESS 秒)、ゆっくり回りはじめ、TK_SPIN 秒で全速になる
const TK_PRESS = 2.6;
const TK_SPIN = 4;
const TK_OMEGA = 2 * Math.PI * 1.1; // 全速(1 秒に 1.1 回転)
// この断片の「今どうなっているか」(遊ぶ間に変わる値)。ここに全部まとめる。入場のたびに戻すものは worlds/index.js の onEnterWorld
const tkS = {
  fireT0: -1, // ペレットを火室に入れた時刻(読みこみ直したあとは、すでに全速として扱う)
  lastHalf: -1,
  forgeT0: -1,
  mealT0: -1, // 料理が机に置かれた時刻(小さい子が運んでくる、todo 145)
  serveT0: -1, // きーが座った時刻。ここから小さい子が運びはじめる
  alarmT: -99,
  doorT0: -1, // 二重扉が開きはじめた時刻(一度開いたら、開いたまま)
  diveT0: -1,
  diveFrom: [8 * T, 10.4 * T], // 飛び込んだ場所(ふちのどこからでも)
  throwT0: -1,
  ordering: false, // 食堂: 注文して、席へ歩いている間
};
const tkFireAge = (api) => (!api.flag("running") ? -1 : tkS.fireT0 < 0 ? 999 : tkNow() - tkS.fireT0);
const tkCrank = (api) => {
  const a = tkFireAge(api) - TK_PRESS;
  if (a <= 0) return 0;
  return a < TK_SPIN ? (TK_OMEGA * a * a) / (2 * TK_SPIN) : TK_OMEGA * (a - TK_SPIN / 2);
};
// 死点をまたいだら蒸気を吐く(甲板の煙突、機関室のシリンダーの口)
const tkExhaust = (api) => {
  const h = Math.floor(tkCrank(api) / Math.PI);
  if (h !== tkS.lastHalf) {
    const fire = tkS.lastHalf >= 0 && h > tkS.lastHalf;
    tkS.lastHalf = h;
    return fire;
  }
  return false;
};
// 機関室の首振りエンジン(前から見る)。クランク軸の中心 C、シリンダーの軸 O(map のドット)
const TK_C = [288, 79];
const TK_O = [288, 214];
const TK_R = 26; // クランクの半径(首の振れ幅が見えるように、実物の比より少し大きく)
const tkEngineObj = {
  id: "engine",
  x: 9 * T,
  y: 7.4 * T,
  w: 1,
  h: 1,
  sortDy: 0,
  headY: 6.2 * T,
  draw(ctx, sx, sy, t, api) {
    const ok = api.flag("installed"); // コンロッドが付くまでは、シリンダーとクランクのあいだが空いている
    const ox = sx - this.x;
    const oy = sy - this.y;
    const th = tkCrank(api);
    const cx = ox + TK_C[0];
    const cy = oy + TK_C[1];
    const px = cx + TK_R * Math.sin(th);
    const py = cy - TK_R * Math.cos(th);
    const qx = ox + TK_O[0];
    const qy = oy + TK_O[1];
    const phi = Math.atan2(px - qx, qy - py); // シリンダーの傾き
    const cyl = api.image("cyl");
    const fly = api.image("fly");
    ctx.imageSmoothingEnabled = false;
    // はずみ車(クランク軸といっしょに回る)
    if (fly) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(th);
      ctx.drawImage(fly, -fly.width / 2, -fly.height / 2);
      ctx.restore();
    }
    // シリンダー(下の軸で首を振る)と、ピストン棒(シリンダーの先からクランクピンまで)
    const SC = 1.6; // シリンダーの絵の倍率
    const L = cyl ? cyl.height * SC - 8 : 88;
    const tx = qx + L * Math.sin(phi);
    const ty = qy - L * Math.cos(phi);
    const rod = api.image("conrod");
    if (ok && rod) {
      // コンロッドの絵: 上の目玉をクランクピンに合わせ、シリンダーの軸の向きに下へのばす(下のはしはシリンダーの中に隠れる)
      const RS = 1.4;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(phi);
      ctx.drawImage(rod, (-rod.width * RS) / 2, -4 * RS, rod.width * RS, rod.height * RS);
      ctx.restore();
    }
    if (cyl) {
      ctx.save();
      ctx.translate(qx, qy);
      ctx.rotate(phi);
      ctx.drawImage(cyl, (-cyl.width * SC) / 2, -cyl.height * SC + 6, cyl.width * SC, cyl.height * SC);
      ctx.restore();
    }
    // 蒸気を吐くたびに、シリンダーの口(軸のところ)から湯気
    if (tkExhaust(api)) tkPuff(TK_O[0] + (Math.sin(phi) > 0 ? -12 : 12), TK_O[1] - 6, Math.sin(phi) > 0 ? -14 : 14, -16, 0.9, 8);
  },
};

// A 漁港と岸壁(入口で出口。西の坂道。東の坂道の先が岬の発電所)
// 切り出した絵(fg_*.png の x0, y0, w, h)を、足もとの y(base)できーと前後させる。bob は絵のゆれ(甲板)
const tkFg = (img, x0, y0, w, h, base, bob) => ({
  id: `fg${x0}_${y0}`,
  x: x0 + w / 2,
  y: base,
  w: 1,
  h: 1,
  draw(ctx, sx, sy, t, api) {
    const im = api.image(img);
    const dy = bob ? bob() : 0;
    if (im) ctx.drawImage(im, x0, y0, w, h, sx - this.x + x0, sy - this.y + y0 + dy, w, h);
  },
});
const tkNorth = (api) => api.player().facing === "north";
const tkWall = (x0, y0, x1, y1) => ({ id: `wall${x0}`, x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: 1, h: 1, solid: { w: x1 - x0, h: y1 - y0 } });
const TK_PORT = tkMap("port", 28, 14, {
  spawns: {
    start: { x: 1.2 * T, y: 6.6 * T, facing: "east" },
    east: { x: 26.4 * T, y: 4 * T, facing: "west" },
    boat: { x: 11.2 * T, y: 9.2 * T, facing: "south" },
    shop: { x: 5.6 * T, y: 7.9 * T, facing: "south" },
    canteen: { x: 19 * T, y: 6.6 * T, facing: "south" },
    net: { x: 434, y: 184, facing: "south" }, // 網小屋の戸口の前(todo 155)
  },
  drawOverlay(ctx, ox, oy, t, api) {
    // 宝舟のボイラーが焚けているあいだ、煙突から湯気(エンジンと同じ調子で)
    if (api.flag("running") && tkExhaust(api)) tkPuff(10 * T + 6, 10.3 * T, -10, -26, 1.4, 10);
    tkDrawPuffs(ctx, ox, oy);
  },
  triggers: [
    { id: "toGate", x: 27.6 * T, y: 2 * T, w: 1.4 * T, h: 4.6 * T, warp: { map: "gate", spawn: "west" } },
    // 西の坂道から、いつでも帰れる(D88)
    { id: "leave", x: -T, y: 5 * T, w: 1.45 * T, h: 3 * T, run: (api) => api.exit() },
    // 戸のない黒い入口は、上を向いて歩いて重なれば入る(▼ と A はなし。前を横切っただけでは入らない。todo 154)
    { id: "shopDoor", x: 145, y: 192, w: 63, h: 14, enabled: tkNorth, warp: { map: "workshop", spawn: "door" } }, // 鋳物小屋の大戸
    { id: "canteenDoor", x: 598, y: 160, w: 24, h: 14, enabled: tkNorth, warp: { map: "canteen", spawn: "door" } }, // 食堂の戸口(D441)
    { id: "netDoor", x: 423, y: 160, w: 22, h: 14, enabled: tkNorth, warp: { map: "amigoya", spawn: "door" } }, // 網小屋の戸口(D457)
  ],
  objects: [
    // 青い光漁の光が沖へ消えていく(前の見届け。D462 で見届けは網小屋の大漁旗へ移した。景色として残す。呼ぶ光はなし)
    Object.assign(
      kWatch({
        id: "s_bluelight",
        keep: true, // 見届けたあとも景色として描く
        x: 11.2 * T,
        y: 9.2 * T,
        r: 2.6 * T,
        sec: 6,
        when: (api) => api.flag("glowed"),
        fx(ctx, sx, sy, p, t) {
          kGlowAt(ctx, sx + 1.5 * T + p * 7 * T, sy + 2.6 * T - p * 0.6 * T, 140 * (1 - p) + 14, "150, 230, 255", (1 - p) * 1);
          kGlowAt(ctx, sx + 1.5 * T + p * 7 * T, sy + 2.6 * T - p * 0.6 * T, 40 * (1 - p) + 6, "235, 252, 255", (1 - p) * 0.9);
        },
      }),
      {
        update(dt, t, api) {
          const pl = api.player();
          if (this.p >= 1) return; // 一度消えたら、そのまま
          if (api.flag("glowed") && Math.hypot(pl.x - this.x, pl.y - this.y) < this.r) this.p = Math.min(1, this.p + dt / 6);
          else this.p = Math.max(0, this.p - dt / 18);
        },
        r: 2.6 * T,
      }
    ),
    // 宝舟は岸壁より手前(水の上)。帆・帆柱・竜頭・煙突は、岸壁を歩くきーより手前に描く(fg_port。docs/assets/takarabune/fg_port.py)
    // 帆のうしろの岸壁は通れる。うしろに入ると、きーは帆に隠れる(2026-10-03、作者「帆の後ろは通り抜けるが、きーが隠れるはできる？」)
    // 竜頭と首のうしろの岸壁も通れて、うしろに入ると竜頭と首に隠れる(2026-10-03、作者「通りぬけるようにして」→「首と竜頭のうしろに隠れる」)
    // 切り出しは物ごとに分けて、それぞれの x に置く(一枚のまま x: 0 に置くと、画面が右へ動いたとき画面の外の物として描かれなかった)
    tkFg("fg_port", 412, 254, 136, 108, 11.6 * T), // 帆
    tkFg("fg_port", 472, 248, 13, 149, 11.6 * T), // 帆柱
    tkFg("fg_port", 602, 245, 140, 135, 11.6 * T), // 竜頭と首
    tkFg("fg_port", 316, 318, 24, 64, 11.6 * T), // 煙突
    // 建物の前は、絵の壁のふちに合わせてドット単位でふさぐ(マスのままだと、黒い入口の手前で止まった。todo 154)
    // 鋳物小屋: 大戸の左右の壁、右の木箱、たらいの上半分
    tkWall(64, 192, 141, 200),
    tkWall(212, 192, 288, 200),
    tkWall(221, 192, 250, 208),
    tkWall(96, 208, 172, 224),
    // 食堂: 戸口の左右の壁
    tkWall(576, 160, 596, 170),
    tkWall(624, 160, 736, 170),
    // 網小屋: 戸口の左右の壁(todo 155)
    tkWall(352, 160, 421, 170),
    tkWall(447, 160, 512, 170),
    // 宝舟: 乗りこむと機関室。沖から帰ってきたら、舵のそばに白紙の海図
    tkSpot(
      "boat",
      11.2 * T,
      9.8 * T,
      (api) => {
        if (api.flag("glowed")) {
          if (api.hasItem("白紙の海図")) return;
          api.giveItem("白紙の海図");
          api.clear();
          api.show("v_kaizu");
          return;
        }
        api.warp("engineroom", "ladder");
      },
      { range: 56, canInteract: (api) => !api.hasItem("白紙の海図") }
    ),
  ],
});

// 鋳造工房(鋳物小屋の中)。るつぼ炉、トングとシャンク、二つ割の木の鋳枠と砂型、込め台、鋳物砂の山、型ばらしの格子、仕上げ台
// ぼぎ(仮の絵、D70)にペレットを渡すと、炉が青白く燃え、るつぼの中の金属くずが溶ける → 鋳造の一枚絵 → コンロッド(D95)
const TK_WORKSHOP = tkMap("workshop", 16, 12, {
  bg: "#14121a",
  spawns: { door: { x: 7.9 * T, y: 10.4 * T, facing: "north" } },
  drawOverlay(ctx, ox, oy, t, api) {
    const fx = ox + 3 * T;
    const fy = oy + 4 * T;
    const e = tkS.forgeT0 < 0 ? (api.flag("cast") ? 99 : -1) : tkNow() - tkS.forgeT0;
    if (e < 0) return;
    // ペレットの熱で、炉が青白く燃える(鋳造のあとは、ゆっくり冷めていく)
    const heat = api.flag("cast") && e > 6 ? 0.35 : Math.min(1, e / 1.2);
    tkLight(ctx, fx, fy, 130, "120, 220, 255", 0.55 * heat * (0.9 + 0.1 * Math.sin(t * 9)));
    tkLight(ctx, fx, fy, 40, "230, 255, 255", 0.8 * heat);
    // るつぼの中の金属くずが溶けていく(赤 → 橙 → 白っぽい黄)
    const melt = Math.min(1, Math.max(0, (e - 0.8) / 1.6));
    if (melt > 0 && !(api.flag("cast") && e > 6)) {
      ctx.fillStyle = `rgba(255, ${Math.round(120 + 100 * melt)}, ${Math.round(40 + 60 * melt)}, ${0.85 * melt})`;
      ctx.beginPath();
      ctx.ellipse(fx, fy + 1, 15, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  triggers: [{ id: "out", x: 7 * T, y: 11.5 * T, w: 2 * T, h: T, warp: { map: "port", spawn: "shop" } }],
  objects: [
    {
      id: "bogi",
      img: "bogi",
      w: 48,
      h: 48,
      x: 5.6 * T,
      y: 3.9 * T,
      sortDy: 18,
      headY: 30,
      range: 56,
      interact(api) {
        if (api.flag("cast") || !api.hasItem("ペレット")) return api.bubble("bogi", "……", 1200); // 仮
        tkS.forgeT0 = tkNow();
        api.bubble("bogi", "……！", 1400); // 仮
        api.later(3000, () =>
          api.show("v_cast", () => {
            api.setFlag("cast");
            // 鋳あがったコンロッドを、きーが頭の上にななめに掲げる(D92、D95)
            api.hold("conrod", 1.8, () => api.giveItem("コンロッド"), { rot: -0.7 });
          }, { full: true })
        );
      },
    },
  ],
});

// 港湾ぼぎの食堂兼休憩所(D441、作者「港湾ぼぎの食堂兼休憩所」「マトリョシカにして。わたしのスケッチ参考に。きーも飲食する。」「もつ煮とウォッカ」)
// 食堂の人たちはマトリョシカ(作者のイメージボードのとおり、頭巾、丸い顔にほお紅、前かけの花。大きさがばらばら)。客は港湾ぼぎ(ヘルメット、手ぬぐい、ゴム長)。下絵(docs/assets/takarabune/canteen/)
// おかみに話しかけると、きーは空いた席に座り、もつ煮とウォッカが出て、食べて飲む
// 食堂で食べる流れの時間表(秒)。おかみ・小さい子・料理の 3 か所は、ここだけを見て動く(数字を書き散らさない)
// serve の前は「座ってから」、うしろは「料理が机に置かれてから」の時刻
const TK_MEAL = {
  toPick: 1.4, // 座ってから: 小さい子がカウンターの右はしに着く
  picked: 1.8, //             受け取って歩きだす
  serve: 4.0, //              きーの机に置く(ここから下は、置いてからの時刻)
  steam: 3.5, // もつ煮の湯気が立つあいだ
  chew: [0.4, 2.1], // 食べる: 上下に小刻みにゆれはじめる時刻(2 回)
  chewN: 12, //       ゆれる数(1 回ぶん)
  chewStep: 0.08, //  ゆれの間
  chewAmp: 2, //      ゆれの大きさ(ドット)
  sip: 4.4, //   飲む: 上下に小刻みにゆれはじめる(グラスを傾けるのと同時)
  sipN: 8,
  sipStep: 0.07,
  lift: 4.0, //  グラスが口もとへ上がりはじめる
  tilt: 4.4, //  傾けはじめる
  gone: 4.9, //  飲みほして消える
  sigh: 5.6, //  手前を向いて白い息
  done: 6.2, //  きーが動けるようになる
  clear: 7.0, // 料理が消える(このあと、また頼める)
};
const TK_SERVE_SEC = TK_MEAL.serve; // 座ってから料理が届くまで
// きーの席(作者「食べる場所、ここがいい。」): 手前の左の机の、西の長いす。机に向いて東を向く
const TK_SEAT = { x: 74, y: 234 };
// 机の下の手前の通り(机の脚と南の壁のあいだ)。席へも、小さい子が運ぶのも、ここを通る
const TK_UNDER_Y = 266;
// おかみの前から席までの道(机の上は通らない): カウンターの右はし → 左の通り → 机の下の手前 → 席
function tkSeatRoute(p) {
  const tail = [[TK_SEAT.x, TK_UNDER_Y], [TK_SEAT.x, TK_SEAT.y]];
  // もう机の西(壁とのあいだ)にいるときは、そのまま下へ出て回る
  if (p.x < 100) return [[p.x, TK_UNDER_Y], ...tail];
  const pts = [];
  if (p.x < 5.8 * T && p.y > 6.15 * T) pts.push([p.x, 6.15 * T]);
  pts.push([5.8 * T, 6.15 * T], [5.8 * T, 7.8 * T], [164, TK_UNDER_Y], ...tail);
  return pts;
}
// 小さい子(給仕)が歩き回る床の道(マス単位。机と長いすの上は通らない)
// 上の通り(6.15)は奥の長いすの足もとより手前、下の通り(7.8)はまん中の机と長いすのあいだ。南の壁ぎわは歩かない
const TK_SMALL_PATH = [[5.8, 6.15], [5.8, 7.8], [9.35, 7.8], [9.35, 6.15]];
const TK_SMALL_PICK = [5.8, 6.15]; // カウンターの右はしで受け取る
const TK_SMALL_SERVE = [3.5, TK_UNDER_Y / T]; // きーの机の手前(南)から置く
// 運ぶ道: カウンターの右はし → 左の通り → 机の下の手前を西へ(机の上は通らない)。帰りは逆にたどって角 0 へ
const TK_SMALL_SERVE_ROUTE = [TK_SMALL_PICK, [5.8, 7.8], [5.12, TK_UNDER_Y / T], TK_SMALL_SERVE];
const tkLerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
// 折れ線 pts の上を、全体の k(0〜1)だけ進んだ点
function tkAlong(pts, k) {
  const ds = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += ds[i - 1] = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let u = Math.max(0, Math.min(1, k)) * total;
  for (let i = 1; i < pts.length; i++) {
    if (u <= ds[i - 1] || i === pts.length - 1) return tkLerp(pts[i - 1], pts[i], ds[i - 1] ? Math.min(1, u / ds[i - 1]) : 1);
    u -= ds[i - 1];
  }
  return pts[pts.length - 1];
}
// 見回りの道(まん中の机をかこむ四角)の上の点から、カウンターの右はし(角 0)までの道。机の上は通らない
function tkSmallToPick(pos) {
  const [A, B, C, D] = TK_SMALL_PATH;
  if (pos[1] > 7.5) return [pos, B, A]; // 下の通り(角 1→2)にいる
  if (pos[0] > 9.0) return [pos, D, A]; // 右の通り(角 2→3)にいる
  return [pos, A];
}
// ふだんの見回り: 区間を 0.8 マス/秒で歩き、角で 1.2 秒とまる
function tkSmallPatrol(pt) {
  const P = TK_SMALL_PATH, legs = [];
  let total = 0;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.8;
    legs.push([a, b, d]);
    total += d + 1.2;
  }
  let u = pt % total;
  for (const [a, b, d] of legs) {
    if (u < 1.2) return a;
    u -= 1.2;
    if (u < d) return tkLerp(a, b, u / d);
    u -= d;
  }
  return P[0];
}
const tkMatry = (id, img, x, y, voice, extra) =>
  Object.assign(
    {
      id,
      x,
      y,
      w: 1,
      h: 1,
      headY: 46,
      range: 44,
      draw(ctx, sx, sy, t, api) {
        const im = api.image(img);
        if (!im) return;
        const sway = Math.sin(t * 1.4 + x) * 0.6; // 人形がかすかにゆれる
        // behind: カウンターの奥に立つ人は、カウンターの天板の線(この y)より下を描かない
        const cut = this.behind ? Math.max(0, Math.min(im.height, Math.round(y - this.behind))) : 0;
        const h = im.height - cut;
        if (h <= 0) return;
        ctx.drawImage(im, 0, 0, im.width, h, Math.round(sx - im.width / 2 + sway), Math.round(sy - im.height), im.width, h);
      },
      interact: (api) => api.bubble(id, voice, 1400),
    },
    extra
  );
// 食堂の家具と壁(背景の絵から、ドットではかった。x0, y0, x1, y1)。長いすは低いので、ふさがない(またいで歩ける)
// 机・カウンター・たる・ストーブはふさぐ。下の段の机は、脚の手前を通れるよう、絵の下はしより少し上までにする
const TK_CANTEEN_SOLID = [
  [32, 128, 46, 288], // 西の壁
  [468, 128, 480, 288], // 東の壁
  [46, 128, 172, 158], // カウンターの天板だけ(手前の板の前には立てる。作者「天板だけ当たり判定でいい」)
  [172, 128, 202, 164], // たる
  [202, 128, 290, 166], // 奥の左の机
  [308, 128, 397, 166], // 奥の右の机
  [428, 128, 468, 186], // ストーブ
  [88, 196, 139, 256], // 手前の左の机
  [200, 200, 291, 240], // まん中の机(きーの席の机)
  [379, 196, 431, 256], // 手前の右の机
  [46, 275, 292, 288], // 南の壁(戸の西)
  [356, 275, 468, 288], // 南の壁(戸の東)
].map(([x0, y0, x1, y1]) => tkWall(x0, y0, x1, y1));
const TK_CANTEEN = tkMap("canteen", 16, 10, {
  bg: "#1c140e",
  spawns: { door: { x: 10 * T, y: 8.5 * T, facing: "north" } },
  onEnter() {
    tkS.ordering = false; // 歩いている途中で出ていたら、注文はなかったことに
  },
  drawOverlay(ctx, ox, oy, t) {
    // 天井の電灯と、ストーブのあたたかい灯り(絵の電灯の位置に合わせる)
    tkLight(ctx, ox + 3.4 * T, oy + 3 * T, 150, "255, 200, 120", 0.16 + 0.02 * Math.sin(t * 3));
    tkLight(ctx, ox + 7.6 * T, oy + 3.5 * T, 170, "255, 200, 120", 0.16);
    tkLight(ctx, ox + 11.5 * T, oy + 3 * T, 150, "255, 200, 120", 0.14);
    tkLight(ctx, ox + 14.3 * T, oy + 4.8 * T, 60, "255, 140, 60", 0.22 + 0.06 * Math.sin(t * 7));
    // もつ煮の大鍋から湯気
    if (Math.random() < 0.05) tkPuff(2.4 * T, 3.6 * T, (Math.random() - 0.5) * 6, -18, 1.6, 6);
    tkDrawPuffs(ctx, ox, oy);
  },
  triggers: [{ id: "out", x: 9 * T, y: 9.6 * T, w: 2 * T, h: T, warp: { map: "port", spawn: "canteen" } }],
  objects: [
    ...TK_CANTEEN_SOLID,
    // 食堂のおかみ(大きなマトリョシカ)。話しかけると、もつ煮とウォッカ
    tkMatry("okami", "m_okami", 3.9 * T, 4.5 * T, "……", {
      behind: 3.97 * T, // カウンターの奥。天板より下は隠れる
      headY: 64,
      range: 100,
      interact(api) {
        if (tkS.ordering || (tkS.mealT0 > 0 && tkNow() - tkS.mealT0 < TK_MEAL.clear)) return;
        tkS.ordering = true;
        api.bubble("okami", "……", 1000);
        // 注文したら、きーは自分で席まで歩く(ワープしない。作者「女将に話しかけるときーがワープするのおかしい」→ B)
        api.later(700, () => api.walk(tkSeatRoute(api.player()), 90, () => {
          tkS.ordering = false;
          api.face("east");
          api.freeze(TK_MEAL.done + TK_SERVE_SEC);
          tkS.serveT0 = tkNow();
          tkS.mealT0 = tkS.serveT0 + TK_SERVE_SEC; // 小さい子が運んできて、机に置く(todo 145)
          const w = TK_SERVE_SEC * 1000;
          // 字は出さず、動きで見せる(作者「もぐもぐ　くぃっ　はいらないかな。動きでわかるようにして」)
          // 食べる: 机に向いて、こくこくと小さくうなずく(2 回に分けて)
          const ms = (sec) => w + sec * 1000;
          // 上下に小刻みにゆらす(t0 からの n 回、step 秒ごと)。食べるのも飲むのも同じしぐさ(作者「上下に小刻みに動かすのはどうか」)
          const jiggle = (t0, n, step) => {
            for (let i = 0; i < n; i++) api.later(ms(t0 + i * step), () => api.place(TK_SEAT.x, TK_SEAT.y - (i % 2 ? 0 : TK_MEAL.chewAmp)));
            api.later(ms(t0 + n * step), () => api.place(TK_SEAT.x, TK_SEAT.y));
          };
          for (const c of TK_MEAL.chew) jiggle(c, TK_MEAL.chewN, TK_MEAL.chewStep);
          // 飲む: グラスが口もとへ上がって傾く(絵は meal の側)。そのあいだ、小刻みにゆれる
          jiggle(TK_MEAL.sip, TK_MEAL.sipN, TK_MEAL.sipStep);
          // ひと息: 手前を向いて、白い息
          api.later(ms(TK_MEAL.sigh), () => {
            api.face("south");
            tkPuff(TK_SEAT.x - 6, TK_SEAT.y - 14, -6, -10, 1.4, 5);
          });
        }));
      },
    }),
    // 食堂の人たち(マトリョシカ): 手伝いは大鍋のそば、いちばん小さい子はカウンターの西のはし(D441)
    tkMatry("mt_help", "m_mid2", 12.85 * T, 5.4 * T, "……", { solid: { w: 20, h: 8 } }), // ストーブのそば(床)。きーは重ならない
    // いちばん小さい子は給仕(todo 145): ふだんは床を歩き回り、きーが座ると、カウンターで料理と酒を受け取って運ぶ
    tkMatry("mt_small", "m_small2", 5.8 * T, 6.0 * T, "……", {
      canInteract: () => false, // 給仕で歩き回るので、話しかけない(おかみへの話しかけをじゃましない)
      pt: 0, // 見回りの時計(運んでいるあいだは止まる)
      last: -1,
      pos: [5.8, 6.15],
      back: null, // 運び終えて道へもどる途中 [出発点, 出発時刻]
      draw(ctx, sx, sy, t, api) {
        const now = tkNow();
        const dt = this.last < 0 ? 0 : Math.min(0.1, Math.max(0, now - this.last));
        this.last = now;
        let carry = false;
        const e = tkS.serveT0 < 0 ? -1 : now - tkS.serveT0;
        if (e >= 0 && e < TK_SERVE_SEC) {
          // カウンターの右はしへ → 受け取る → きーの机へ(時刻は TK_MEAL)
          // 机の上は通らない: 行きは道ぞいにカウンターへ、運ぶのは左の通りから机の下の手前へ回る
          if (!this.from) this.from = tkSmallToPick(this.pos.slice());
          const M = TK_MEAL;
          if (e < M.toPick) this.pos = tkAlong(this.from, e / M.toPick);
          else if (e < M.picked) this.pos = TK_SMALL_PICK.slice();
          else this.pos = tkAlong(TK_SMALL_SERVE_ROUTE, (e - M.picked) / (M.serve - M.picked));
          carry = e >= M.toPick;
          this.back = null;
        } else {
          if (this.from) {
            // 置き終えたら、運んだ道を逆にたどってカウンターの右はし(角 0)へもどり、そこから見回りをつづける
            this.from = null;
            this.back = [TK_SMALL_SERVE_ROUTE.slice().reverse(), now];
            this.pt = 0;
          }
          let target;
          if (this.back) {
            const k = (now - this.back[1]) / 2.4;
            target = tkSmallPatrol(this.pt);
            if (k >= 1) this.back = null;
            else target = tkAlong(this.back[0], k);
          } else {
            this.pt += dt;
            target = tkSmallPatrol(this.pt);
          }
          this.pos = target;
        }
        // 動いた分だけ描く位置をずらす(この絵は今の位置から描く)
        const nx = this.pos[0] * T, ny = this.pos[1] * T;
        sx += nx - this.x;
        sy += ny - this.y;
        this.x = nx;
        this.y = ny;
        const im = api.image("m_small2");
        if (!im) return;
        ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height));
        if (carry) {
          // 胸の前に、もつ煮とウォッカ
          const b = api.image("c_motsu"), v = api.image("c_vodka");
          if (b) ctx.drawImage(b, Math.round(sx - 10), Math.round(sy - 16));
          if (v) ctx.drawImage(v, Math.round(sx + 5), Math.round(sy - 14));
        }
      },
    }),
    // 港湾ぼぎ(仕事帰りの客。ヘルメット、手ぬぐい、ゴム長): もつ煮を食べる / 湯のみで休む / 居眠り(D441)
    tkMatry("w1", "w_eat", 6.9 * T, 8.4 * T, "もぐもぐ", { headY: 40 }),
    tkMatry("w2", "w_tea", 11 * T, 5.6 * T, "ずず……", { headY: 40 }),
    tkMatry("w3", "w_sleep", 13.7 * T, 7.6 * T, "Zzzzzzzz…", { headY: 40 }),
    // きーの前に出る、もつ煮とウォッカ
    {
      id: "meal",
      x: TK_SEAT.x + 32, // 机の西のはし(きーの前)
      y: TK_SEAT.y + 4,
      w: 1,
      h: 1,
      draw(ctx, sx, sy, t, api) {
        if (tkS.mealT0 < 0 || tkNow() < tkS.mealT0 || tkNow() - tkS.mealT0 > TK_MEAL.clear) return;
        const e = tkNow() - tkS.mealT0;
        const b = api.image("c_motsu"), v = api.image("c_vodka");
        if (b) ctx.drawImage(b, Math.round(sx - 12), Math.round(sy - 12));
        const M = TK_MEAL;
        if (v && e < M.gone) {
          // lift まで机の上。lift〜tilt できーの口もとへ上がり、tilt〜gone で傾けて飲みほす(消える)
          const k = Math.max(0, Math.min(1, (e - M.lift) / (M.tilt - M.lift)));
          // 口もと: 東を向いたきーの、くちばしの少し上
          const gx = sx + 8 + (TK_SEAT.x + 8 - (this.x + 8)) * k;
          const gy = sy - 9 + (TK_SEAT.y - 22 - (this.y - 9)) * k;
          const tilt = e > M.tilt ? -Math.min(1, (e - M.tilt) / 0.4) * 1.6 : 0;
          ctx.save();
          ctx.translate(Math.round(gx + 3), Math.round(gy + 4));
          ctx.rotate(tilt);
          ctx.drawImage(v, -3, -4);
          ctx.restore();
        }
        if (e < M.steam && Math.random() < 0.15) tkPuff(this.x - 4, this.y - 12, 0, -14, 1.2, 4);
      },
    },
  ],
});

// B 正門(西から坂道で上がってくる。鎖の切れた門を抜けて北へ)
// 正門の前後(fg_gate。docs/assets/takarabune/fg_gate.py)。2026-10-03、作者「金網フェンスは？前後関係」
// フェンスの根もと(y 158)より北へは行けない。門は半開きで、2 枚の扉のあいだだけ通れる(扉の足もとの線の奥はふさぐ)。
// 扉は地面に斜めに立つので、幅 6 の縦の帯に切って、帯ごとの足もとの y できーと前後を決める。守衛所と立て札は足もとの y で
const TK_GATE_FG = [];
for (let x = 356; x < 414; x += 6) TK_GATE_FG.push(tkFg("fg_gate", x, 68, 6, 136, 160 + ((x + 3 - 355) * 40) / 55));   // 左の扉: (355,160)→(410,200)
for (let x = 424; x < 478; x += 6) TK_GATE_FG.push(tkFg("fg_gate", x, 68, 6, 136, 158 + ((478 - x - 3) * 32) / 51));   // 右の扉: (478,158)→(427,190)
TK_GATE_FG.push(tkFg("fg_gate", 537, 125, 113, 90, 214), tkFg("fg_gate", 646, 174, 32, 43, 216));   // 守衛所、立て札
const TK_GATE = tkMap("gate", 28, 10, {
  spawns: {
    west: { x: 1.2 * T, y: 7.4 * T, facing: "east" },
    north: { x: 419, y: 1.3 * T, facing: "south" },
  },
  triggers: [
    { id: "toPort", x: -T, y: 6 * T, w: 1.45 * T, h: 3 * T, warp: { map: "port", spawn: "east" } },
    { id: "toYard", x: 11 * T, y: -T, w: 4 * T, h: 1.45 * T, warp: { map: "yard", spawn: "south" } },
  ],
  // 門の通り道(x 404〜432)の左右: 扉の足もとの線より奥を、段々にふさぐ
  objects: [...TK_GATE_FG, tkWall(352, 0, 378, 180), tkWall(378, 0, 404, 200), tkWall(432, 0, 455, 192), tkWall(455, 0, 480, 175)],
});

// B2 構内(todo 152): 正門を北へ抜けると、夜の発電所の敷地。北の管理棟の扉(緑の非常灯)から中へ。南の門のすきまから正門へ
// 網小屋の中(D457、todo 155): 宝舟の港の網小屋。真っ暗で、てらすがないと、きーのまわりしか見えない
// 絵は PixelLab の案を手で直し、大漁旗(PixelLab の絵に手描きの字、赤白の放射。D461、flag_rays.py)を掛けた(docs/assets/takarabune/amigoya/finish.py)。持ち帰るものはない
const TK_AMIGOYA = tkMap("amigoya", 14, 9, {
  spawns: { door: { x: 7 * T, y: 8.1 * T, facing: "north" } },
  dark: 1, // てらすがないと、きーのまわりのほかは何も見えない
  triggers: [{ id: "out", x: 6 * T, y: 8.55 * T, w: 2 * T, h: T, warp: { map: "port", spawn: "net" } }],
  objects: [
    tkWall(14, 120, 108, 210), // 左の網の山(下の段)
    tkWall(372, 96, 432, 120), // 右の網の山
    tkWall(382, 150, 432, 200), // 浮き玉の棚
    tkWall(334, 226, 366, 238), // 長靴
    // 見届け(D462): 大漁旗の前にいると、祝の丸から放射にそって、ほのかな光が旗いっぱいに広がり、ゆっくり消える(ちゃんの祝いの名残)
    // 部屋は真っ暗なので、てらすがないと見届けられない(D201)。光は闇の上に描く(lit)
    kWatch({
      id: "w_flag",
      x: 226,
      y: 104,
      r: 1.6 * T,
      sec: 6,
      lure: "255, 226, 170",
      lit: true,
      ly: 19 - 104, // 祝の丸
      when: (api) => api.hasAbility("terasu") || api.flag("terasu"), // rpg.js の can("terasu") と同じ
      fx(ctx, sx, sy, p) {
        if (p <= 0) return;
        const fx0 = sx - 66, fy0 = sy - 98; // 旗の左上(網小屋の絵の 160, 6)
        const show = Math.min(1, p / 0.3) * (p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4); // 光が強まり、また消える
        ctx.save();
        ctx.beginPath();
        ctx.rect(fx0, fy0, 132, 88);
        ctx.clip();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1;
        const cx = sx, cy = sy - 85; // 祝の丸
        const R = 6 + Math.min(1, p / 0.7) * 110; // 光の輪が、放射にそって外へ走る
        const a = 0.42 * show;
        const out = R + 10;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, out);
        g.addColorStop(0, `rgba(255, 210, 140, ${a * 0.1})`);
        g.addColorStop(Math.max(0, (R - 12) / out), `rgba(255, 210, 140, ${a * 0.08})`);
        g.addColorStop(R / out, `rgba(255, 190, 90, ${a})`);
        g.addColorStop(1, "rgba(255, 190, 90, 0)");
        ctx.fillStyle = g;
        for (let i = 0; i < 16; i++) {
          // 放射の赤い筋(16 本)の向きだけ光らせる
          const a0 = (2 * Math.PI * i) / 16 + Math.PI / 32;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, out, a0 - Math.PI / 32, a0 + Math.PI / 32);
          ctx.closePath();
          ctx.fill();
        }
        kGlowAt(ctx, cx, cy, 16, "255, 236, 200", a * 0.8); // 祝の丸のまわり
        ctx.restore();
      },
    }),
  ],
});
const TK_YARD = tkMap("yard", 20, 10, {
  spawns: {
    south: { x: 10 * T, y: 8.6 * T, facing: "north" },
    door: { x: 10 * T, y: 4.5 * T, facing: "south" },
  },
  drawOverlay(ctx, ox, oy, t) {
    tkLight(ctx, ox + 10 * T, oy + 2 * T + 11, 70, "90, 255, 140", 0.18 + 0.08 * Math.sin(t * 1.7)); // 扉の上の非常灯
  },
  triggers: [
    { id: "toAdmin", x: 9 * T, y: 3 * T, w: 2 * T, h: 1.4 * T, warp: { map: "admin", spawn: "south" } },
    { id: "toGate", x: 9 * T, y: 9.6 * T, w: 2 * T, h: T, warp: { map: "gate", spawn: "north" } },
  ],
  // 左右のフェンス(絵では奥ほど内側へ寄る)。絵のフェンスの線に合わせて、段々にふさぐ
  objects: [
    tkWall(0, 116, 52, 222), tkWall(0, 222, 46, 252), tkWall(0, 252, 34, 290),
    tkWall(588, 116, 640, 222), tkWall(594, 222, 640, 252), tkWall(606, 252, 640, 290),
  ],
});

// C 管理棟(南の玄関から入り、東の扉から出る)。非常灯の緑だけが、ゆっくり明滅する
const TK_ADMIN = tkMap("admin", 24, 12, {
  spawns: {
    south: { x: 5 * T, y: 10.3 * T, facing: "north" },
    east: { x: 22 * T, y: 9 * T, facing: "west" },
  },
  drawOverlay(ctx, ox, oy, t) {
    const a = 0.16 + 0.08 * Math.sin(t * 1.7);
    for (const [x, y] of [[23 * T, 7.2 * T], [5 * T, 10.7 * T], [9 * T, 1.2 * T]]) tkLight(ctx, ox + x, oy + y, 90, "90, 255, 140", a);
  },
  triggers: [
    { id: "toYard", x: 4 * T, y: 11.5 * T, w: 2 * T, h: T, warp: { map: "yard", spawn: "door" } },
    { id: "toTurbine", x: 23.55 * T, y: 8 * T, w: 1.45 * T, h: 2 * T, warp: { map: "turbine", spawn: "west" } },
  ],
  objects: [],
});

// D タービン建屋(西から入り、東の扉から出る)。止まったタービンの南北に 2 マスの通路
const TK_TURBINE = tkMap("turbine", 28, 12, {
  spawns: {
    west: { x: 1.2 * T, y: 9 * T, facing: "east" },
    east: { x: 26.6 * T, y: 3 * T, facing: "west" },
  },
  drawOverlay(ctx, ox, oy, t) {
    // 切れかけた灯り(ときどき、ちらつく)
    const flick = Math.sin(t * 13) > 0.92 ? 0.05 : 0.22;
    for (const x of [6 * T, 16 * T]) tkLight(ctx, ox + x, oy + 2 * T, 100, "255, 140, 60", flick);
  },
  triggers: [
    { id: "toAdmin", x: -T, y: 8 * T, w: 1.45 * T, h: 2 * T, warp: { map: "admin", spawn: "east" } },
    { id: "toReactor", x: 27.55 * T, y: 2 * T, w: 1.45 * T, h: 2 * T, warp: { map: "reactor", spawn: "west" } },
  ],
  // 床に立つ操作盤と立て看板(fg_turbine。docs/assets/takarabune/fg_more.py)。足もとはふさぐ
  objects: [
    tkFg("fg_turbine", 393, 240, 27, 61, 300),
    tkFg("fg_turbine", 812, 238, 39, 47, 284),
    tkWall(392, 284, 420, 300),
    tkWall(812, 226, 851, 285), // 看板のうしろもふさぐ(きーが看板にすっかり隠れるので)
  ],
});

// E 原子炉建屋(西から入る。北の二重扉の先が炉心)。赤い回転灯が回り、警報が鳴りっぱなし
const tkDoorOpen = (api) => api.flag("airlock");
const TK_DOOR = { x0: 279, y0: 3, x1: 361, y1: 68, fx0: 262, fx1: 380 }; // 扉の板と、それが引きこまれる枠(背景の絵のドット)
// 床に立つものは、きーとの前後を足もとの y で決める(fg_reactor。docs/assets/takarabune/fg_reactor.py)。
// [x0, y0, w, h, 足もとの y]。回転灯は通れない(マスをふさぐ)。標識の列も通れない(うしろに入ると、きーが板にすっかり隠れるので)。格納容器は北半分(盛り上がったふち)
// 2026-10-03、作者「原子炉建屋内の前後関係もみて」
const TK_REACTOR_FG = [
  ...[[2, 3], [17, 3], [2, 10], [17, 10]].map(([c, r]) => [c * T - 4, r * T - 6, 41, 44, r * T + 32]),
  ...[82, 178, 400, 495].map((x0) => [x0, 444, 54, 36, 480]),
  [157, 130, 326, 144, 274],
].map(([x0, y0, w, h, base], i) => ({
  id: "fg" + i,
  x: x0 + w / 2,
  y: base,
  w: 1,
  h: 1,
  draw(ctx, sx, sy, t, api) {
    const im = api.image("fg_reactor");
    if (im) ctx.drawImage(im, x0, y0, w, h, sx - this.x + x0, sy - this.y + y0, w, h);
  },
}));
const TK_REACTOR = tkMap("reactor", 20, 16, {
  spawns: {
    west: { x: 1.2 * T, y: 13.5 * T, facing: "east" },
    north: { x: 10 * T, y: 2.4 * T, facing: "south" },
  },
  drawOverlay(ctx, ox, oy, t, api) {
    // 回転灯: 光の筋がぐるぐる回る
    for (const [c, r, ph] of [[2, 3, 0], [17, 3, 1.6], [2, 10, 3.1], [17, 10, 4.7]]) {
      const x = ox + c * T + 16;
      const y = oy + r * T + 16;
      const ang = t * 3.2 + ph;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      const g = ctx.createLinearGradient(0, 0, 150, 0);
      g.addColorStop(0, "rgba(255, 50, 30, 0.5)");
      g.addColorStop(1, "rgba(255, 50, 30, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 150, -0.22, 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = `rgba(255, 30, 20, ${0.06 + 0.06 * Math.max(0, Math.sin(t * 6.4))})`;
    ctx.fillRect(ox, oy, 20 * T, 16 * T);
    if (t - tkS.alarmT > 3.2) {
      tkS.alarmT = t;
      api.bubble("alarm", "ウーー　ウーー", 2400); // 仮
    }
  },
  triggers: [
    { id: "toTurbine", x: -T, y: 12 * T, w: 1.45 * T, h: 3 * T, warp: { map: "turbine", spawn: "east" } },

  ],
  objects: [
    ...TK_REACTOR_FG,
    { id: "alarm", x: 10 * T, y: 1.4 * T, w: 1, h: 1, headY: 4 },
    // 二重扉: 調べると、重い扉が右の壁へすべって開く(0.9 秒)。開いた奥は暗く、炉心の青い光がもれる
    // 二重扉が開いているときだけ、炉心へ入れる(2026-10-03、作者「プール前の扉が閉まったまま入れたりするのは変」)。
    // 開いたあとは、A でも、扉へ向かって歩きつづけても入る。扉の絵はきーより奥に描く(y を壁ぎわに置き、調べる場所は iy で手前に)
    {
      id: "airlock",
      x: 10 * T,
      y: 1 * T,
      iy: 1.6 * T,
      w: 1,
      h: 1,
      range: 46,
      headY: 0,
      interact(api) {
        if (tkDoorOpen(api)) return api.warp("core", "south");
        tkS.doorT0 = tkNow();
        api.setFlag("airlock");
        api.bubble("airlock", "ゴゴゴ……", 1200); // 仮
        api.freeze(0.9);
      },
      update(dt, t, api) {
        if (!tkDoorOpen(api) || tkNow() - tkS.doorT0 < 0.9) return;
        const pl = api.player();
        const at = Math.abs(pl.x - this.x) < 0.9 * T && pl.y < 2.5 * T && pl.facing === "north";
        const still = this._ly === pl.y;
        this._ly = pl.y;
        this._push = at && still ? (this._push || 0) + dt : 0;
        if (this._push > 0.2) {
          this._push = -99;
          api.warp("core", "south");
        }
      },
      draw(ctx, sx, sy, t, api) {
        if (!tkDoorOpen(api)) return;
        const bg = api.image("bg_reactor");
        if (!bg) return;
        const ox = sx - this.x;
        const oy = sy - this.y;
        const D = TK_DOOR;
        const u = tkS.doorT0 < 0 ? 1 : Math.min(1, (tkNow() - tkS.doorT0) / 0.9);
        const k = u * u * (3 - 2 * u);
        // 開いた奥: 暗がりと、炉心の青い光
        ctx.fillStyle = "#06080e";
        ctx.fillRect(ox + D.x0, oy + D.y0, D.x1 - D.x0, D.y1 - D.y0);
        tkLight(ctx, ox + (D.x0 + D.x1) / 2, oy + D.y1, 50, "120, 210, 255", 0.55 * k);
        // 扉の板(背景の絵の扉を切り出して)を、右の枠の中へすべらせる。枠の外ははみ出さない
        ctx.save();
        ctx.beginPath();
        ctx.rect(ox + D.fx0, oy + D.y0, D.fx1 - D.fx0, D.y1 - D.y0);
        ctx.clip();
        const dx = Math.round((D.x1 - D.x0 + 4) * k);
        ctx.drawImage(bg, D.x0, D.y0, D.x1 - D.x0, D.y1 - D.y0, ox + D.x0 + dx, oy + D.y0, D.x1 - D.x0, D.y1 - D.y0);
        ctx.restore();
      },
    },
  ],
});

// F 格納容器の中(炉心)。行き止まり。ふたの開いた炉はプール。ふちで調べると飛び込んで、ペレットを抱えて上がってくる → 暗転して港へ(D88)
const TK_DIVE = 2.4;
// プールのふち(だ円)。きーにいちばん近いふちの点
const TK_POOL = { cx: 8 * T, cy: 6 * T + 5, rx: 5 * T + 10, ry: 4 * T + 16 };
const tkRim = (x, y) => {
  const a = Math.atan2((y - TK_POOL.cy) / TK_POOL.ry, (x - TK_POOL.cx) / TK_POOL.rx);
  return [TK_POOL.cx + TK_POOL.rx * Math.cos(a), TK_POOL.cy + TK_POOL.ry * Math.sin(a)];
};
const tkDive = (api) => {
  if (tkS.diveT0 >= 0) return;
  const pl = api.player();
  tkS.diveFrom = [pl.x, pl.y];
  tkS.diveT0 = tkNow();
  TK_CORE._ki = api.image("ki");
  api.freeze(TK_DIVE + 0.2);
  api.later(TK_DIVE * 1000, () => {
    tkS.diveT0 = -1;
    // 上がってきたきーが、ペレットを頭の上に掲げる(D92)→ 名前 → 暗転して港へ
    api.hold("pellet", 1.8, () => {
      api.giveItem("ペレット");
      api.later(900, () => api.warp("port", "shop"));
    });
  });
};
const TK_CORE = tkMap("core", 16, 14, {
  spawns: { south: { x: 8 * T, y: 12.3 * T, facing: "north" } },
  drawOverlay(ctx, ox, oy, t) {
    tkLight(ctx, ox + 8 * T, oy + 6 * T, 7 * T, "120, 210, 255", 0.14 + 0.06 * Math.sin(t * 2.1));
    if (tkS.diveT0 < 0) return;
    const e = tkNow() - tkS.diveT0;
    // 跳びこむ先: ふちから、プールの水の上へ 3 マス
    const [fx, fy] = tkS.diveFrom;
    const dx = TK_POOL.cx - fx;
    const dy = TK_POOL.cy - fy;
    const dl = Math.hypot(dx, dy) || 1;
    const x = ox + fx + (dx / dl) * 3 * T;
    const y = oy + fy + (dy / dl) * 3 * T;
    // 跳びこむ(弧)→ しぶきと波紋 → 水の中で光る → ペレットを抱えて上がってくる
    const ki = this._ki;
    if (e < 0.5 && ki) {
      const u = e / 0.5;
      const row = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 3) : dy < 0 ? 1 : 0;
      const kx = ox + fx + (x - ox - fx) * u;
      const footY = oy + fy + (y - oy - fy) * u - Math.sin(u * Math.PI) * 30;
      ctx.drawImage(ki, 0, row * 64, 64, 64, Math.round(kx - 32), Math.round(footY - 64 + 17), 64, 64);
    }
    if (e > 0.45 && e < 2.2) {
      const u = (e - 0.45) / 1.75;
      ctx.strokeStyle = `rgba(220, 250, 255, ${1 - u})`;
      ctx.lineWidth = 2;
      for (const k of [0, 0.3, 0.6]) {
        const r = 6 + (u + k) * 50;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (u < 0.35) {
        ctx.fillStyle = `rgba(230, 250, 255, ${1 - u / 0.35})`;
        for (let k = 0; k < 14; k++) {
          const a = (k / 14) * Math.PI * 2;
          ctx.fillRect(Math.round(x + Math.cos(a) * 20 * (u / 0.35 + 0.3)), Math.round(y - 10 * Math.sin((u / 0.35) * Math.PI) + Math.sin(a) * 8), 3, 3);
        }
      }
      tkLight(ctx, x, y, 60, "200, 250, 255", 0.6 * Math.sin(u * Math.PI));
    }
  },
  triggers: [{ id: "toReactor", x: 7 * T, y: 13.5 * T, w: 2 * T, h: T, warp: { map: "reactor", spawn: "north" } }],
  objects: [
    // プールのふち: どこからでも、調べると飛び込む。水に向かって歩きつづけても飛び込む(作者「プールに入れない」2026-10-03)
    {
      id: "pool",
      x: 8 * T,
      y: 10.4 * T,
      w: 1,
      h: 1,
      range: 54,
      headY: 30,
      canInteract: (api) => !api.hasItem("ペレット") && !api.flag("cast") && tkS.diveT0 < 0,
      interact: (api) => tkDive(api),
      update(dt, t, api) {
        // ▼ と調べる場所を、きーにいちばん近いふちに置く
        const pl = api.player();
        const [rx, ry] = tkRim(pl.x, pl.y);
        this.x = rx;
        this.y = ry;
        if (api.hasItem("ペレット") || api.flag("cast") || tkS.diveT0 >= 0) return;
        // ふちで、水のほうを向いて立ち止まったまま(壁を押している)なら飛び込む
        const near = Math.hypot(pl.x - rx, pl.y - ry) < 26;
        const fx = { east: 1, west: -1 }[pl.facing] || 0;
        const fy = { south: 1, north: -1 }[pl.facing] || 0;
        const tx = TK_POOL.cx - pl.x;
        const ty = TK_POOL.cy - pl.y;
        const toward = (fx * tx + fy * ty) / (Math.hypot(tx, ty) || 1) > 0.5;
        const still = this._lx === pl.x && this._ly === pl.y;
        this._lx = pl.x;
        this._ly = pl.y;
        this._push = near && toward && still ? (this._push || 0) + dt : 0;
        if (this._push > 0.35) {
          this._push = 0;
          tkDive(api);
        }
      },
    },
  ],
});
// 飛び込んでいるあいだは、きーを消す(水の中)
Object.defineProperty(TK_CORE, "hidePlayer", { get: () => tkS.diveT0 >= 0 });

// 宝舟の機関室(舳先は東)。西にボイラー、まんなかに首振りエンジンの台、東にはしご(甲板へ)
// 首振りエンジンは最初から据わっていて、コンロッドだけが欠けている(D92、D95)。コンロッドを取り付け、火室にペレットを入れると、圧力計の針が上がり、安全弁が鳴り、エンジンが動きだす
const TK_ENGINE = tkMap("engineroom", 16, 10, {
  bg: "#1a120c",
  spawns: { ladder: { x: 12 * T, y: 4.6 * T, facing: "south" } },
  drawOverlay(ctx, ox, oy, t, api) {
    const age = tkFireAge(api);
    // 火室: ペレットの青白い光
    if (age >= 0) {
      const k = Math.min(1, age / 1);
      tkLight(ctx, ox + 75, oy + 182, 80, "120, 220, 255", 0.6 * k * (0.9 + 0.1 * Math.sin(t * 11)));
      tkLight(ctx, ox + 75, oy + 182, 22, "235, 255, 255", 0.9 * k);
    }
    // 圧力計の針(0 から、圧力が上がると右へ)
    const p = age < 0 ? 0 : Math.min(1, age / TK_PRESS);
    const ga = -2.4 + 2.9 * p + (age > TK_PRESS ? Math.sin(t * 13) * 0.04 : 0);
    ctx.strokeStyle = "#b02020";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox + 80, oy + 132);
    ctx.lineTo(ox + 80 + Math.sin(ga) * 9, oy + 132 - Math.cos(ga) * 9);
    ctx.stroke();
    // 安全弁: 圧力が上がりきると、シューッと吹く
    if (age > TK_PRESS - 0.6 && age < TK_PRESS + 1.4 && Math.random() < 0.5) tkPuff(100, 70, (Math.random() - 0.5) * 20, -40, 0.8, 6);
    tkDrawPuffs(ctx, ox, oy);
  },
  triggers: [],
  objects: [
    tkEngineObj,
    // エンジンの台: コンロッドが欠けている(▼ が出る)。コンロッドを持って調べると取り付ける
    tkSpot(
      "mount",
      9 * T,
      8.1 * T,
      (api) => {
        if (!api.hasItem("コンロッド")) return api.mutter("……", 1200); // 仮
        api.takeItem("コンロッド");
        api.setFlag("installed");
        api.bubble("mount", "ガチャン", 1400); // 仮
      },
      { range: 50, headY: 30, canInteract: (api) => !api.flag("installed") }
    ),
    // ボイラーの火室: ペレットを入れる
    tkSpot(
      "firebox",
      2.4 * T,
      6.6 * T,
      (api) => {
        tkS.fireT0 = tkNow();
        tkS.lastHalf = -1;
        api.setFlag("running");
        api.later(TK_PRESS * 1000 - 400, () => api.bubble("valve", "シューッ", 1600)); // 仮
      },
      { range: 50, canInteract: (api) => api.flag("installed") && api.hasItem("ペレット") && !api.flag("running") }
    ),
    { id: "valve", x: 100, y: 80, w: 1, h: 1, headY: 6 },
    // はしご: エンジンが動いていれば甲板へ(沖へ出る)。動いていなければ、港へ降りる
    tkSpot(
      "ladder",
      12.4 * T,
      4.2 * T,
      (api) => {
        if (api.flag("running") && !api.flag("glowed")) api.warp("deck", "stern");
        else api.warp("port", "boat");
      },
      { range: 50 }
    ),
  ],
});

// G 宝舟の甲板。海が西へ流れる(舳先は東)。煙突から、エンジンが蒸気を吐くたびに湯気。外輪がかく水しぶき
// 舳先で調べると、きーがペレットを海に投げ込む → 沈んで、底から青い光が広がる → 一枚絵(D88)
const tkDeckBob = () => Math.round(Math.sin(tkNow() * 1.3) * 1); // 甲板のゆれ
const TK_DECK = {
  tile: T,
  bg: "#0a1430",
  map: TK_GRIDS.deck,
  legend: K_LEGEND,
  drawGround(ctx, ox, oy, img, api) {
    const get = (k) => (typeof img === "function" ? img(k) : null);
    const t = tkNow();
    const sea = get("sea");
    if (sea) {
      const off = (t * 36) % sea.width;
      for (let x = -off - sea.width; x < 20 * T + sea.width; x += sea.width) ctx.drawImage(sea, Math.round(ox + x), oy, sea.width, 10 * T);
    }
    // ペレットが沈んだところから、青い光が広がる
    if (tkS.throwT0 > 0) {
      const e = t - tkS.throwT0 - 1.0;
      if (e > 0) {
        const r = 30 + 300 * Math.min(1, e / 3.2);
        tkLight(ctx, ox + 19.6 * T, oy + 5 * T, r, "60, 200, 255", Math.min(0.85, e / 1.4));
        tkLight(ctx, ox + 19.6 * T, oy + 5 * T, r * 0.45, "210, 252, 255", Math.min(0.7, e / 2));
      }
    }
    const deck = get("bg_deck");
    if (deck) ctx.drawImage(deck, ox, oy + tkDeckBob(), 20 * T, 10 * T);
    // 外輪がかく水しぶき(エンジンの回転といっしょ)
    const th = tkCrank(api);
    ctx.fillStyle = "rgba(220, 235, 255, 0.75)";
    for (let k = 0; k < 6; k++) {
      const u = (th / (Math.PI * 2) + k / 6) % 1;
      for (const y of [1.5 * T, 8.4 * T]) ctx.fillRect(Math.round(ox + 6 * T - u * 44), Math.round(oy + y + (k % 3) * 6), 3, 2);
    }
    // 煙突(ボイラーの上)から、蒸気を吐くたびに湯気
    if (tkExhaust(api)) tkPuff(3 * T + 6, 5 * T - 8, -46, -22, 1.6, 9);
    tkDrawPuffs(ctx, ox, oy);
  },
  drawOverlay(ctx, ox, oy) {
    // ペレットを投げる(弧を描いて舳先の先の海へ)→ しぶき
    if (tkS.throwT0 < 0) return;
    const e = tkNow() - tkS.throwT0;
    const x0 = ox + 17.4 * T;
    const y0 = oy + 4.4 * T;
    const x1 = ox + 19.6 * T;
    const y1 = oy + 5 * T;
    const pel = this._pel;
    if (e < 0.8 && pel) {
      const u = e / 0.8;
      ctx.drawImage(pel, Math.round(x0 + (x1 - x0) * u - pel.width / 2), Math.round(y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 40 - pel.height / 2));
    } else if (e < 1.8) {
      const u = (e - 0.8) / 1;
      ctx.fillStyle = `rgba(230, 250, 255, ${1 - u})`;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        ctx.fillRect(Math.round(x1 + Math.cos(a) * 14 * (u + 0.3)), Math.round(y1 - 12 * Math.sin(u * Math.PI) + Math.sin(a) * 5), 3, 3);
      }
    }
  },
  spawns: { stern: { x: 4.8 * T, y: 6.5 * T, facing: "east" } },
  onEnter() {
    tkS.throwT0 = -1;
  },
  triggers: [],
  objects: [
    // 煙突のついた丸い窯と、ろうそく(fg_deck。docs/assets/takarabune/fg_more.py)。窯のうしろとろうそくのマスはふさぐ
    tkFg("fg_deck", 62, 82, 69, 117, 197, tkDeckBob),
    tkFg("fg_deck", 143, 85, 19, 29, 113, tkDeckBob),
    // 帆は帆桁から頭の上に張られている。きーはその下をくぐるので、帆はいつもきーより手前。下にいるあいだは透かす
    // 2026-10-03、作者「宝船の帆の前後がおかしい。船の中も、港も。」
    {
      id: "sail",
      x: 361,
      y: 9.9 * T, // マップのいちばん下(いつもきーより手前)
      w: 1,
      h: 1,
      draw(ctx, sx, sy, t, api) {
        const im = api.image("fg_deck");
        if (!im) return;
        const pl = api.player();
        const under = pl.x > 331 - 14 && pl.x < 392 + 14 && pl.y > 48 && pl.y - 34 < 250;
        const ox = sx - this.x;
        const oy = sy - this.y + tkDeckBob();
        ctx.save();
        ctx.globalAlpha = under ? 0.45 : 1;
        ctx.drawImage(im, 330, 40, 64, 212, ox + 330, oy + 40, 64, 212);
        ctx.restore();
      },
    },
    tkSpot(
      "bow",
      17.4 * T,
      5 * T,
      (api) => {
        api.setFlag("sowing");
        api.takeItem("ペレット");
        tkS.throwT0 = tkNow();
        TK_DECK._pel = api.image("pellet");
        // しぶきのあと、水の中へ。光りながら沈んでいくペレットを、水面から追いかけて最後の絵へ(D92)
        // 水面から寄ってきた絵が、そのままキメの一枚絵になる(A で閉じる)。一枚絵を出しなおさない(2026-10-03、作者「最後の絵の出方が2回でる」)
        api.later(2600, () =>
          api.burst(
            [{ img: "v_glow", sec: 3.2, z0: 2.4, z1: 1, cx: 240, cy: 36, cy1: 144, fadeIn: 0.9, ease: "out" }],
            () => {
              api.setFlag("sowing", false);
              api.setFlag("glowed");
              api.warp("port", "boat");
              api.later(1600, () => kLearn(api, "terasu", "てらす")); // 青く光る海から(D201)
            },
            { hold: true }
          )
        );
      },
      { range: 56, canInteract: (api) => api.hasItem("ペレット") && !api.flag("sowing") && !api.flag("glowed") }
    ),
  ],
};
