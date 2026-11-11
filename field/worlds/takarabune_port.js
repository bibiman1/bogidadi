// 断片: 宝舟と首振りエンジン(漁港、工房、食堂)。takarabune.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";

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
