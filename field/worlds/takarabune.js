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
    "################",
    "################",
    "################",
    "################",
    "#########.######",
    "######.......###",
    "#..#..###...#..#",
    "#..#..###...#..#",
    "#..#........#..#",
    "#########..#####",
  ],
  port: [
    "############################",
    "############################",
    "########################....",
    "########################....",
    "########################....",
    "..#######..#####..#####.....",
    "..#######...................",
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
let tkFireT0 = -1; // ペレットを火室に入れた時刻(読みこみ直したあとは、すでに全速として扱う)
const tkFireAge = (api) => (!api.flag("running") ? -1 : tkFireT0 < 0 ? 999 : tkNow() - tkFireT0);
const tkCrank = (api) => {
  const a = tkFireAge(api) - TK_PRESS;
  if (a <= 0) return 0;
  return a < TK_SPIN ? (TK_OMEGA * a * a) / (2 * TK_SPIN) : TK_OMEGA * (a - TK_SPIN / 2);
};
// 死点をまたいだら蒸気を吐く(甲板の煙突、機関室のシリンダーの口)
let tkLastHalf = -1;
const tkExhaust = (api) => {
  const h = Math.floor(tkCrank(api) / Math.PI);
  if (h !== tkLastHalf) {
    const fire = tkLastHalf >= 0 && h > tkLastHalf;
    tkLastHalf = h;
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
const tkWall = (x0, y0, x1, y1) => ({ id: `wall${x0}`, x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: 1, h: 1, solid: { w: x1 - x0, h: y1 - y0 } });
const TK_PORT = tkMap("port", 28, 14, {
  spawns: {
    start: { x: 1.2 * T, y: 6.6 * T, facing: "east" },
    east: { x: 26.4 * T, y: 4 * T, facing: "west" },
    boat: { x: 11.2 * T, y: 9.2 * T, facing: "south" },
    shop: { x: 5.6 * T, y: 7.9 * T, facing: "south" },
    canteen: { x: 19 * T, y: 6.6 * T, facing: "south" },
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
  ],
  objects: [
    // 見届け: 青い光漁の光が沖へ消えるまで見ている(D189)
    kWatch({
      id: "w_bluelight",
      x: 11.2 * T,
      y: 9.2 * T,
      r: 2.6 * T,
      sec: 6, lure: "120, 220, 255",
      when: (api) => api.flag("glowed"),
      fx(ctx, sx, sy, p, t) {
        kGlowAt(ctx, sx + 1.5 * T + p * 7 * T, sy + 2.6 * T - p * 0.6 * T, 140 * (1 - p) + 14, "150, 230, 255", (1 - p) * 1);
        kGlowAt(ctx, sx + 1.5 * T + p * 7 * T, sy + 2.6 * T - p * 0.6 * T, 40 * (1 - p) + 6, "235, 252, 255", (1 - p) * 0.9);
      },
    }),
    // 宝舟は岸壁より手前(水の上)。帆・帆柱・竜頭・煙突は、岸壁を歩くきーより手前に描く(fg_port。docs/assets/takarabune/fg_port.py)
    // 帆のうしろの岸壁は通れる。うしろに入ると、きーは帆に隠れる(2026-10-03、作者「帆の後ろは通り抜けるが、きーが隠れるはできる？」)
    // 竜頭と首のうしろの岸壁も通れて、うしろに入ると竜頭と首に隠れる(2026-10-03、作者「通りぬけるようにして」→「首と竜頭のうしろに隠れる」)
    // 切り出しは物ごとに分けて、それぞれの x に置く(一枚のまま x: 0 に置くと、画面が右へ動いたとき画面の外の物として描かれなかった)
    tkFg("fg_port", 412, 254, 136, 108, 11.6 * T), // 帆
    tkFg("fg_port", 472, 248, 13, 149, 11.6 * T), // 帆柱
    tkFg("fg_port", 602, 245, 140, 135, 11.6 * T), // 竜頭と首
    tkFg("fg_port", 316, 318, 24, 64, 11.6 * T), // 煙突
    // 鋳物小屋(鋳造工房)の大戸
    tkSpot("shopDoor", 5.6 * T, 7.2 * T, (api) => api.warp("workshop", "door"), { range: 44 }),
    // 灯りのついた小屋の戸口: 港湾ぼぎ(マトリョシカ)の食堂兼休憩所(D441)
    tkSpot("canteenDoor", 19 * T, 6.2 * T, (api) => api.warp("canteen", "door"), { range: 44 }),
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
let tkForgeT0 = -1;
const TK_WORKSHOP = tkMap("workshop", 16, 12, {
  bg: "#14121a",
  spawns: { door: { x: 7.9 * T, y: 10.4 * T, facing: "north" } },
  drawOverlay(ctx, ox, oy, t, api) {
    const fx = ox + 3 * T;
    const fy = oy + 4 * T;
    const e = tkForgeT0 < 0 ? (api.flag("cast") ? 99 : -1) : tkNow() - tkForgeT0;
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
        tkForgeT0 = tkNow();
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
let tkMealT0 = -1;
const TK_SEAT = { x: 8.2 * T, y: 8.4 * T }; // きーの席(まん中の机の手前のベンチ)。本番の絵(PixelLab)に合わせた
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
        ctx.drawImage(im, Math.round(sx - im.width / 2 + sway), Math.round(sy - im.height));
      },
      interact: (api) => api.bubble(id, voice, 1400),
    },
    extra
  );
const TK_CANTEEN = tkMap("canteen", 16, 10, {
  bg: "#1c140e",
  spawns: { door: { x: 10 * T, y: 8.5 * T, facing: "north" } },
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
    // 食堂のおかみ(大きなマトリョシカ)。話しかけると、もつ煮とウォッカ
    tkMatry("okami", "m_okami", 4.2 * T, 3.75 * T, "……", {
      headY: 64,
      range: 100,
      interact(api) {
        if (tkMealT0 > 0 && tkNow() - tkMealT0 < 7) return;
        api.bubble("okami", "……", 1000);
        api.later(900, () => {
          api.place(TK_SEAT.x, TK_SEAT.y);
          api.face("north");
          api.freeze(6.2);
          tkMealT0 = tkNow();
          api.later(1200, () => api.mutter("もぐもぐ", 1300));
          api.later(2900, () => api.mutter("もぐもぐ", 1100));
          api.later(4400, () => api.mutter("くいっ", 1100)); // ウォッカ
          api.later(5600, () => api.mutter("ふう", 1000));
        });
      },
    }),
    // 食堂の人たち(マトリョシカ): 手伝いは大鍋のそば、いちばん小さい子はカウンターの西のはし(D441)
    tkMatry("mt_help", "m_mid2", 1.4 * T, 3.7 * T, "……"),
    tkMatry("mt_small", "m_small2", 5.2 * T, 3.75 * T, "……"),
    // 港湾ぼぎ(仕事帰りの客。ヘルメット、手ぬぐい、ゴム長): もつ煮を食べる / 湯のみで休む / 居眠り(D441)
    tkMatry("w1", "w_eat", 6.9 * T, 8.4 * T, "もぐもぐ", { headY: 40 }),
    tkMatry("w2", "w_tea", 11 * T, 5.6 * T, "ずず……", { headY: 40 }),
    tkMatry("w3", "w_sleep", 13.7 * T, 7.6 * T, "Zzzzzzzz…", { headY: 40 }),
    // きーの前に出る、もつ煮とウォッカ
    {
      id: "meal",
      x: TK_SEAT.x,
      y: 7.4 * T,
      w: 1,
      h: 1,
      draw(ctx, sx, sy, t, api) {
        if (tkMealT0 < 0 || tkNow() - tkMealT0 > 7) return;
        const e = tkNow() - tkMealT0;
        const b = api.image("c_motsu"), v = api.image("c_vodka");
        if (b) ctx.drawImage(b, Math.round(sx - 12), Math.round(sy - 12));
        if (v && e < 4.4) ctx.drawImage(v, Math.round(sx + 8), Math.round(sy - 9));
        if (e < 3.5 && Math.random() < 0.15) tkPuff(this.x - 4, this.y - 12, 0, -14, 1.2, 4);
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
    { id: "toAdmin", x: 11 * T, y: -T, w: 4 * T, h: 1.45 * T, warp: { map: "admin", spawn: "south" } },
  ],
  // 門の通り道(x 404〜432)の左右: 扉の足もとの線より奥を、段々にふさぐ
  objects: [...TK_GATE_FG, tkWall(352, 0, 378, 180), tkWall(378, 0, 404, 200), tkWall(432, 0, 455, 192), tkWall(455, 0, 480, 175)],
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
    { id: "toGate", x: 4 * T, y: 11.5 * T, w: 2 * T, h: T, warp: { map: "gate", spawn: "north" } },
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
let tkAlarmT = -99;
let tkDoorT0 = -1; // 二重扉が開きはじめた時刻(一度開いたら、開いたまま)
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
    if (t - tkAlarmT > 3.2) {
      tkAlarmT = t;
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
        tkDoorT0 = tkNow();
        api.setFlag("airlock");
        api.bubble("airlock", "ゴゴゴ……", 1200); // 仮
        api.freeze(0.9);
      },
      update(dt, t, api) {
        if (!tkDoorOpen(api) || tkNow() - tkDoorT0 < 0.9) return;
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
        const u = tkDoorT0 < 0 ? 1 : Math.min(1, (tkNow() - tkDoorT0) / 0.9);
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
let tkDiveT0 = -1;
let tkDiveFrom = [8 * T, 10.4 * T]; // 飛び込んだ場所(ふちのどこからでも)
const TK_DIVE = 2.4;
// プールのふち(だ円)。きーにいちばん近いふちの点
const TK_POOL = { cx: 8 * T, cy: 6 * T + 5, rx: 5 * T + 10, ry: 4 * T + 16 };
const tkRim = (x, y) => {
  const a = Math.atan2((y - TK_POOL.cy) / TK_POOL.ry, (x - TK_POOL.cx) / TK_POOL.rx);
  return [TK_POOL.cx + TK_POOL.rx * Math.cos(a), TK_POOL.cy + TK_POOL.ry * Math.sin(a)];
};
const tkDive = (api) => {
  if (tkDiveT0 >= 0) return;
  const pl = api.player();
  tkDiveFrom = [pl.x, pl.y];
  tkDiveT0 = tkNow();
  TK_CORE._ki = api.image("ki");
  api.freeze(TK_DIVE + 0.2);
  api.later(TK_DIVE * 1000, () => {
    tkDiveT0 = -1;
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
    if (tkDiveT0 < 0) return;
    const e = tkNow() - tkDiveT0;
    // 跳びこむ先: ふちから、プールの水の上へ 3 マス
    const [fx, fy] = tkDiveFrom;
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
      canInteract: (api) => !api.hasItem("ペレット") && !api.flag("cast") && tkDiveT0 < 0,
      interact: (api) => tkDive(api),
      update(dt, t, api) {
        // ▼ と調べる場所を、きーにいちばん近いふちに置く
        const pl = api.player();
        const [rx, ry] = tkRim(pl.x, pl.y);
        this.x = rx;
        this.y = ry;
        if (api.hasItem("ペレット") || api.flag("cast") || tkDiveT0 >= 0) return;
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
Object.defineProperty(TK_CORE, "hidePlayer", { get: () => tkDiveT0 >= 0 });

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
        tkFireT0 = tkNow();
        tkLastHalf = -1;
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
let tkThrowT0 = -1;
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
    if (tkThrowT0 > 0) {
      const e = t - tkThrowT0 - 1.0;
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
    if (tkThrowT0 < 0) return;
    const e = tkNow() - tkThrowT0;
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
    tkThrowT0 = -1;
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
        tkThrowT0 = tkNow();
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
