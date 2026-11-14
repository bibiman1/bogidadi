// 断片: きこりと金星(山頂)。kinsei.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";

// ---- 山頂: 撮影隊は外で準備、きこりはベネラへ(D379〜D381) ----
const KN_VENERA = { x: 17.2 * T, y: 8.0 * T }; // ベネラ 7 号の足もと(さかいの向こう、焼けた地面。D382)
const KN_WINDOW = { x: KN_VENERA.x + KN_MOUTH_DX, y: KN_VENERA.y + KN_MOUTH_DY }; // ふたの飛んだ口(ピザ窯の口に見える)
const KN_RUN = { run: 1.8, leap: 2.6, char: 4.6, melt: 7.0, pop: 7.4, end: 7.6 };
const KN_PEEL = { reach: 0.8, in: 1.2, back: 2.0 }; // ピールをのばして、口から焼けたピザを取り出す(秒)
let knPeelT0 = -1;
const KN_DOOR_OUT = { x: 5.35 * T, y: 3.75 * T };
const knRunEl = () => (knS.phase === "run" ? knNow() - knS.t0 : -1);
const KN_ORO = { oro: 4.0, end: 7.0 }; // きこりが消えてから: オロオロ / ピールを置いて、戸口に着いて中へ
// 撮影隊が追いかけて止まる所(熱ではじかれる線の手前。D394)と、ごろんがピールを置く所
const KN_CHASE_K = { x: KN_HEAT_X - 0.7 * T, y: 7.3 * T };
const KN_CHASE_G = { x: KN_HEAT_X - 1.2 * T, y: 8.1 * T };
const KN_PEEL_DROP = { x: KN_CHASE_G.x + 0.6 * T, y: KN_CHASE_G.y + 0.2 * T };
// 前に持ったピール(柄の先に丸い板)。d は向き
const knPeelHeld = (ctx, x, y, d) => {
  const hx = x + d * 7;
  const hy = y - 12;
  ctx.strokeStyle = "#6e4c28";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx + d * 14, hy);
  ctx.stroke();
  ctx.strokeStyle = "#c4965f";
  ctx.lineWidth = 1;
  ctx.stroke();
  knEll(ctx, hx + d * 20, hy, 7, 4, "#6e4c28");
  knEll(ctx, hx + d * 20, hy, 6, 3, "#c4965f");
};
// ---- 戻ってきたぴー(D736〜D738): 形而アップダウンクイズのあとに来ると、ぴーが山頂で定時の観測を続けている ----
// ピザをベネラの口(窯 D383)に入れ → 百葉箱の北の扉をのぞき → 風の塔を見上げ → 黒焦げを取り出して、その場で貪り食う → 気象台へ戻る。
// 熱の中には入らない(D391)。さかいの手前からピールで出し入れする。きーは無視(調べる物はない)。試し絵 docs/record/2026-11-14/kisho/trial2.py
const KP2 = { door: [170, 116], mid: [300, 210], oven: [428, 262], box: [352, 158], mast: [388, 122], speed: 55 };
const kp2Plan = (() => {
  const P = [];
  const d = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]) / KP2.speed;
  const add = (name, sec, a, b, carry) => P.push({ name, sec, a, b: b || a, carry });
  const { door, mid, oven, box, mast } = KP2;
  add("out", 0.8, door, null, "raw");
  add("walk", d(door, mid), door, mid, "raw");
  add("walk", d(mid, oven), mid, oven, "raw");
  add("put", 1.6, oven, null, null);
  add("walk", d(oven, box), oven, box, "peel");
  add("open", 0.5, box, null, "peel");
  add("read", 2.6, box, null, "peel");
  add("close", 0.5, box, null, "peel");
  add("walk", d(box, mast), box, mast, "peel");
  add("look", 2.0, mast, null, "peel");
  add("walk", d(mast, oven), mast, oven, "peel");
  add("take", 1.6, oven, null, null);
  add("eat", 3.2, oven, null, null);
  add("walk", d(oven, mid), oven, mid, "peel");
  add("walk", d(mid, door), mid, door, "peel");
  add("in", 0.8, door, null, "peel");
  add("gone", 2.0, door, null, null);
  let t = 0;
  for (const p of P) (p.t = t), (t += p.sec);
  P.cycle = t;
  P.afterPut = P[4].t; // 入ったときは、ピザを窯に入れたあとから(ぴーが外にいる所から見せる)
  P.baking = [P[3].t + 0.8, P[11].t + 0.8];
  return P;
})();
const kp2 = { t0: 0 };
const kp2State = () => {
  const P = kp2Plan;
  const tc = (((knNow() - kp2.t0) % P.cycle) + P.cycle) % P.cycle;
  let p = P[P.length - 1];
  for (const q of P) if (tc >= q.t && tc < q.t + q.sec) p = q;
  const k = Math.min(1, (tc - p.t) / p.sec);
  return { p, k, tc, x: p.a[0] + (p.b[0] - p.a[0]) * k, y: p.a[1] + (p.b[1] - p.a[1]) * k };
};
const kp2Shown = (api) => api.cleared("keiji") && api.cleared("kinsei") && knS.phase !== "run";
// 黒焦げのピザ(きこりの焦げ D383 より黒い)
const kp2Burnt = (ctx, x, y, rx) => {
  if (rx < 1) return;
  knEll(ctx, x, y, rx, Math.max(1.5, rx * 0.5), "#241c18");
  knEll(ctx, x, y - 0.5, rx - 1.5, Math.max(1, rx * 0.5 - 1), "#2e2420");
  ctx.fillStyle = "#463a32";
  ctx.fillRect(Math.round(x - 2), Math.round(y - 1), 1, 1);
  ctx.fillRect(Math.round(x + 2), Math.round(y), 1, 1);
};
// のばしたピール(きーがベネラから取り出すときと同じ描き方)
const kp2Peel = (ctx, hx, hy, ex, ey) => {
  ctx.strokeStyle = "#6e4c28";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.strokeStyle = "#c4965f";
  ctx.lineWidth = 1;
  ctx.stroke();
  knEll(ctx, ex, ey, 7, 4, "#6e4c28");
  knEll(ctx, ex, ey, 6, 3, "#c4965f");
};
const kp2Obj = () => ({
  id: "kp2",
  x: KP2.door[0],
  y: KP2.door[1],
  w: 1,
  h: 1,
  headY: 26,
  hidden: (api) => !kp2Shown(api),
  update() {
    const st = kp2State();
    this.x = st.x;
    this.y = st.y;
  },
  draw(ctx, sx, sy, t, api) {
    const pi = api.image("pi");
    if (!pi) return;
    const { p, k } = kp2State();
    // 百葉箱の北の扉(開くと、箱の右うしろに白い板が見える)。百葉箱の切り抜きより奥に描く
    const ox = sx - this.x;
    const oy = sy - this.y;
    const open = p.name === "open" ? k : p.name === "read" ? 1 : p.name === "close" ? 1 - k : 0;
    if (open > 0) {
      const w = Math.round(12 * open);
      ctx.fillStyle = "#deded6";
      ctx.beginPath();
      ctx.moveTo(ox + 342, oy + 108);
      ctx.lineTo(ox + 342 + w, oy + 103 - Math.floor(w / 3));
      ctx.lineTo(ox + 342 + w, oy + 131 - Math.floor(w / 3));
      ctx.lineTo(ox + 342, oy + 136);
      ctx.fill();
      ctx.fillStyle = "#8c8c88";
      ctx.fillRect(ox + 342 + w, oy + 103 - Math.floor(w / 3), 1, 28);
    }
    if (p.name === "gone") return;
    const n = p.name;
    let row = 0;
    let f = 0;
    if (n === "walk") (row = p.b[0] > p.a[0] ? 2 : 3), (f = Math.floor(t * 10) % 7);
    else if (n === "open" || n === "read" || n === "close" || n === "look" || n === "in") row = 1;
    else if (n === "put" || n === "take") row = 2;
    let dx = 0;
    let dy = 0;
    if (n === "read") dy = Math.floor(t * 3) % 2 ? -1 : 0; // 背のびして、のぞきこむ
    if (n === "look" && k > 0.1) dy = -2;
    if (n === "eat") (dy = (t * 7) % 1 < 0.4 ? 3 : 0), (dx = Math.floor(t * 14) % 2 ? 1 : -1); // 前のめりに、速く、何度も
    // 戸口を出入りするときは、下を戸の影に隠す
    const vis = n === "out" ? k : n === "in" ? 1 - k : 1;
    const h = n === "out" || n === "in" ? Math.round(25 + 22 * vis) : 64;
    ctx.drawImage(pi, f * 64, row * 64, 64, h, Math.round(sx - 32 + dx), Math.round(sy - 47 + dy), 64, h);
    // 頭にのせたピール
    const carry = p.carry && n !== "in" ? api.image(p.carry === "raw" ? "k_peel_pizza_carry" : "k_peel_carry") : null;
    if (carry) ctx.drawImage(carry, Math.round(sx - carry.width / 2), Math.round(sy - 22 - carry.height + 3 + (n === "walk" ? Math.floor(t * 10) % 2 : 0)));
    // のばして、窯の口へ入れる / 黒焦げを取り出す
    if (n === "put" || n === "take") {
      const hx = sx + 6;
      const hy = sy - 12;
      const u = k < 0.5 ? k / 0.5 : 1 - (k - 0.5) / 0.5;
      const mx = ox + KN_WINDOW.x;
      const my = oy + KN_WINDOW.y;
      const ex = hx + 14 + (mx - hx - 14) * u;
      const ey = hy + (my - hy) * u;
      kp2Peel(ctx, hx, hy, ex, ey);
      if (n === "put" && k < 0.5) knPizza(ctx, ex, ey - 1, 6, "done");
      if (n === "take" && k >= 0.5) kp2Burnt(ctx, ex, ey - 1, 6);
    }
    if (n === "eat") {
      kp2Peel(ctx, sx - 22, sy + 4, sx + 2, sy + 7);
      kp2Burnt(ctx, sx + 2, sy + 6, 8.4 * Math.max(0, 1 - k * 1.1));
      if (k < 0.9) {
        ctx.fillStyle = "#1e1814";
        const sd = Math.floor(t * 12);
        for (let i = 0; i < 5; i++) {
          const r1 = ((sd * 73 + i * 151) % 97) / 97;
          const r2 = ((sd * 37 + i * 89) % 101) / 101;
          ctx.fillRect(Math.round(sx - 14 + r1 * 28), Math.round(sy + 4 - r2 * 18), 2, 1); // 飛びちる焦げ
        }
      }
    }
  },
  // 焼いているあいだ、窯の口から細い煙
  drawOver(ctx, sx, sy, t, api) {
    if (!kp2Shown(api)) return;
    const { tc } = kp2State();
    if (tc < kp2Plan.baking[0] || tc > kp2Plan.baking[1]) return;
    const mx = sx - this.x + KN_WINDOW.x;
    const my = sy - this.y + KN_WINDOW.y;
    for (let i = 0; i < 2; i++) {
      const v = (t * 0.6 + i * 0.5) % 1;
      ctx.fillStyle = `rgba(90, 84, 78, ${0.5 * (1 - v)})`;
      ctx.fillRect(Math.round(mx - 2 + i * 4 + Math.sin(t * 3 + i) * 2), Math.round(my - 6 - v * 16), 2, 3);
    }
  },
});

const KN_SANCHO = {
  tile: T,
  bg: "#5e5a54",
  map: kGrid(20, 12, (c, r) => r < 3 || r > 10 || c >= 15 || (c === 0 && (r < 5 || r > 8))),
  legend: K_LEGEND,
  drawGround: kImage("bg_sancho", 20 * T, 12 * T),
  spawns: {
    west: { x: 1 * T, y: 6.5 * T, facing: "east" },
    door: { x: 5.35 * T, y: 4.0 * T, facing: "south" },
  },
  onEnter(api) {
    kp2.t0 = knNow() - kp2Plan.afterPut; // 戻ってきたぴー: ピザを窯に入れたところから(D738)
    if (api.flag("dashed") && !api.flag("gone") && knS.phase !== "run") {
      knS.phase = "run";
      knS.t0 = knNow();
      const R = KN_RUN;
      api.camPath([
        { t: 0, x: 6.5 * T, y: 4.8 * T, z: 1 },
        { t: R.run, x: 12.8 * T, y: 6.8 * T, z: 1 },
        { t: R.leap, x: 15.6 * T, y: 6.6 * T, z: 1.3 },
        { t: R.end + 0.4, x: 15.2 * T, y: 6.9 * T, z: 1.3 },
      ]);
      api.later(R.leap * 1000 - 200, () => api.sfx("pop"));
      api.later(R.char * 1000 - 1500, () => api.sfx("whir"));
      api.later(R.melt * 1000, () => {
        knS.phase = "gone";
        knS.goneT0 = knNow();
        api.setFlag("gone");
      });
      // 金星は、ほかの星と逆向きに、ゆっくり回っている。きーも、逆向きにくるっと回る(まわる D203。能力としてはやめ D226、回る姿だけが残る)
      api.later((R.end + 1.4) * 1000, () => api.spin());
    }
  },
  debug: () => Object.assign({ now: knNow(), runEl: knRunEl(), cookEl: knCookEl() }, knS),
  // 熱い風(D201)はやめた(D391)。さかいの手前で、熱くてはじき返される(heat)
  drawOverlay(ctx, ox, oy, t) {
    // 金星の熱: 東から黄色い光
    const g = ctx.createLinearGradient(ox + 12 * T, 0, ox + 20 * T, 0);
    g.addColorStop(0, "rgba(255, 200, 90, 0)");
    g.addColorStop(1, "rgba(255, 200, 90, 0.4)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    knStorm(ctx, t, 0.22, ox + KN_EDGE); // 雨はさかいの左だけ(D381)
    knHaze(ctx, ox + KN_EDGE, t, 2); // 陽炎(D381)
  },
  triggers: [
    { id: "toSando", x: -T, y: 5 * T, w: 1.6 * T, h: 4 * T, enabled: () => knS.phase !== "run", warp: { map: "sando", spawn: "east" } },
    // 気象台の戸口(建物の下のふちの、まん中の黒い戸)
    { id: "toNaka", x: 4.95 * T, y: 3.2 * T, w: 0.85 * T, h: 0.55 * T, enabled: () => knS.phase !== "run", warp: { map: "naka", spawn: "door" } },
  ],
  objects: [
    // 背景の前後(作者「背景の前後」): 百葉箱と風の塔は、背景から切り抜いた絵(fg_sancho。docs/assets/kinsei/fg_kinsei.py)を根元の y で前後させる
    kFg("fg_sancho", 298, 104, 45, 74, 176),
    kFg("fg_sancho", 364, 18, 36, 95, 111),
    kWall(300, 166, 343, 177), // 百葉箱の脚
    kWall(374, 104, 389, 112), // 風の塔の根元
    kWall(86, 96, 158, 106), // 気象台の建物の下のふち(戸口の左)
    kWall(184, 96, 256, 106), // 戸口の右
    kTrace("t_sticker", "t_sticker", 6.7 * T, 3.4 * T, -12), // 気象台の白い壁に、色あせた太陽のシール
    knImg("venera", KN_VENERA.x, KN_VENERA.y, {
      // ベネラの着陸機(三面図 K1)。窓の中が赤く光り、ピザ窯の口に見える(言葉では言わない)
      draw(ctx, sx, sy, t, api) {
        knDraw(ctx, api.image("venera"), sx, sy);
        const el = knRunEl();
        const flare = el > KN_RUN.leap && el < KN_RUN.melt ? 1 - (el - KN_RUN.leap) / (KN_RUN.melt - KN_RUN.leap) : 0;
        const a = 0.18 + Math.sin(t * 3) * 0.08 + flare * 0.5;
        const cx = sx;
        const cy = sy - 30;
        const gg = ctx.createRadialGradient(cx, cy, 1, cx, cy, 14 + flare * 10);
        gg.addColorStop(0, `rgba(255, 140, 60, ${a})`);
        gg.addColorStop(1, "rgba(255, 120, 40, 0)");
        ctx.fillStyle = gg;
        ctx.fillRect(cx - 26, cy - 26, 52, 52);
      },
    }),
    {
      // 撮影隊: ロケのあと、さかいの手前で三脚を立てて準備している
      id: "crewOut",
      x: KN_CHASE_G.x,
      y: KN_CHASE_G.y,
      w: 1,
      h: 1,
      // D394: きこりを追いかけて、戸口から、さかいの手前まで走る(ごろんはピールを持つ)→ きこりが消える →
      // 4 秒ほどオロオロ → ごろんがピールをその場に置き、あきらめて戸口へ歩いて中へ(中では別のピザを食べている D388)
      hidden: (api) => !api.flag("dashed") || (api.flag("gone") && (knS.goneT0 < 0 || knNow() - knS.goneT0 > KN_ORO.end)),
      draw(ctx, sx, sy, t, api) {
        const ox = sx - this.x;
        const oy = sy - this.y;
        const re = knRunEl();
        const ge = api.flag("gone") && knS.goneT0 >= 0 ? knNow() - knS.goneT0 : -1;
        const crew = [
          ["kikikori", KN_CHASE_K, 0.4, 0, false],
          ["goron", KN_CHASE_G, 0.7, 1.7, true],
        ];
        for (const [key, at, delay, ph, carry] of crew) {
          let x = ox + at.x;
          let y = oy + at.y;
          let dir = 1;
          let peel = carry;
          if (re >= 0) {
            // 追いかける(戸口から出てくるのは、きこりより少しおくれて)
            if (re < delay) continue;
            const u = Math.min(1, (re - delay) / 2.4);
            const [ax, ay] = knAlong([[KN_DOOR_OUT.x, KN_DOOR_OUT.y], [8 * T, 5.8 * T], [11 * T, 6.9 * T], [at.x, at.y]], u);
            x = ox + ax;
            y = oy + ay - (u < 1 ? Math.abs(Math.sin(re * 16 + ph)) * 2.5 : 0);
          } else if (ge >= 0 && ge < KN_ORO.oro) {
            const w = Math.sin(ge * 3.1 + ph);
            x += w * 0.6 * T;
            y -= Math.abs(Math.sin(ge * 11 + ph)) * 3;
            dir = Math.cos(ge * 3.1 + ph) >= 0 ? 1 : -1;
          } else if (ge >= KN_ORO.oro) {
            const u = Math.min(1, (ge - KN_ORO.oro) / (KN_ORO.end - KN_ORO.oro));
            x = knLerp(x, ox + KN_DOOR_OUT.x, u);
            y = knLerp(y, oy + KN_DOOR_OUT.y, u) - Math.abs(Math.sin(ge * 8 + ph)) * 1.5;
            dir = -1;
            peel = false; // ピールは、その場に置いていく
          }
          knDraw(ctx, knCrew(api, key, dir), x, y);
          if (peel) knPeelHeld(ctx, x, y, dir);
        }
      },
    },
    {
      // 撮影隊が置いていったピール(D394)。拾うと頭にのせて運び、さかいの手前から口へのばして、きこりのピザを取り出す(D383)
      id: "peelGround",
      x: KN_PEEL_DROP.x,
      y: KN_PEEL_DROP.y,
      w: 1,
      h: 1,
      headY: 16,
      range: 38,
      hidden: (api) => !api.flag("gone") || api.flag("peel") || (knS.goneT0 >= 0 && knNow() - knS.goneT0 < KN_ORO.oro),
      draw(ctx, sx, sy, t, api) {
        knDraw(ctx, api.image("k_peel"), sx, sy);
      },
      interact(api) {
        api.setFlag("peel");
        api.sfx("item");
      },
    },
    {
      // 金星の熱(D391): さかいの手前まで来ると、熱くて、ぴょんとはじき返される。いつでも(荷物を持っていても)。言葉なし
      // 熱の中へ突っこめるのは、きこりだけ。焼けたピザは、ここからピールをのばして取り出す(D383)
      id: "heat",
      x: KN_HEAT_X,
      y: 7 * T,
      w: 1,
      h: 1,
      hitT: -9,
      draw() {},
      update(dt, t, api) {
        if (knS.phase === "run") return;
        const p = api.player();
        if (p.x < KN_HEAT_X) return;
        api.knock(-240, 0);
        if (t - this.hitT > 0.6) {
          this.hitT = t;
          api.sfx("pop");
        }
      },
      drawOver(ctx, sx, sy, t, api) {
        const e = t - this.hitT;
        if (e < 0 || e > 1.1) return;
        const p = api.player();
        const px = Math.round(sx - this.x + p.x);
        const py = Math.round(sy - this.y + p.y);
        const a = Math.max(0, 1 - e / 1.1);
        // きーが赤くほてる
        ctx.fillStyle = `rgba(255, 70, 40, ${0.45 * a})`;
        ctx.beginPath();
        ctx.ellipse(px, py - 9, 11, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        // 湯気が三すじ、のぼって消える
        for (let k = 0; k < 3; k++) {
          const v = Math.min(1, e / 1.1 + k * 0.12);
          ctx.fillStyle = `rgba(240, 240, 236, ${0.8 * a})`;
          ctx.fillRect(px - 6 + k * 5 + Math.round(Math.sin(t * 9 + k) * 1.5), py - 20 - Math.round(v * 14), 2, 3);
        }
      },
    },
    // 見届け: きこりが消えたあと、ちりんの音が止むまでそばにいる(D189)
    kWatch({ id: "w_chirin", x: 13.2 * T, y: 7 * T, r: 2.2 * T, sec: 6, lure: "200, 230, 255", when: (api) => api.flag("gone") }),
    {
      id: "knctl",
      x: -100,
      y: -100,
      w: 1,
      h: 1,
      draw() {},
      last: 0,
      update(dt, t, api) {
        // ちりんは、きこりが消えたあと、いつもと違う音で鳴り続ける(仮)
        if (api.flag("gone") && !api.flag("observed") && t - this.last > 3.5) {
          this.last = t;
          api.bubble("chirin", "チリ　リ……", 1800);
        }
      },
    },
    {
      // きこり: 戸口から飛び出し、ピザを持ってさかいへ走り、ベネラの窓へ飛びこむ → こげて煙 → 陽炎の向こうで見えなくなる
      id: "kikoriOut",
      x: KN_DOOR_OUT.x,
      y: KN_DOOR_OUT.y,
      w: 1,
      h: 1,
      headY: 40,
      hidden: () => knS.phase !== "run",
      draw() {},
      // ベネラより手前に描く(足もとの y で前後を決めると、窓に飛びこんだところがベネラの裏に隠れる)
      drawOver(ctx, sx, sy, t, api) {
        const im = api.image("kikori");
        if (!im) return;
        const el = knRunEl();
        const R = KN_RUN;
        const ox = sx - this.x;
        const oy = sy - this.y;
        let x;
        let y;
        let o = { t };
        let pizza = true;
        if (el < R.run) {
          [x, y] = knAlong([[KN_DOOR_OUT.x, KN_DOOR_OUT.y], [8 * T, 5.6 * T], [12 * T, 6.4 * T], [14.4 * T, 7.0 * T]], el / R.run);
          y -= Math.abs(Math.sin(el * 18)) * 3;
        } else if (el < R.leap) {
          // 窓へ、跳ねるように飛びこむ
          const u = (el - R.run) / (R.leap - R.run);
          x = knLerp(14.4 * T, KN_WINDOW.x - 2, u);
          y = knLerp(7.0 * T, KN_WINDOW.y + 16, u) - Math.sin(u * Math.PI) * 30;
        } else if (el < R.char) {
          // 窓に頭から突っこんだまま、黒くこげていく。煙
          const u = (el - R.leap) / (R.char - R.leap);
          x = KN_WINDOW.x - 2 + Math.round(Math.sin(el * 40) * (1 - u));
          y = KN_WINDOW.y + 16;
          o = { t, tint: `rgba(24, 16, 12, ${0.25 + u * 0.7})` };
          pizza = u < 0.3;
          for (let k = 0; k < 5; k++) {
            const v = (el * 0.8 + k * 0.2) % 1;
            const r = 2 + v * 5;
            ctx.fillStyle = `rgba(70, 66, 62, ${0.6 * (1 - v)})`;
            ctx.fillRect(Math.round(ox + x - 4 + Math.sin(k * 2 + el * 3) * 4 - r / 2), Math.round(oy + y - im.height - v * 26 - r / 2), Math.round(r), Math.round(r));
          }
        } else if (el < R.melt) {
          // 陽炎の向こうで、ゆらいで見えなくなる(溶ける瞬間は見せない)
          const u = (el - R.char) / (R.melt - R.char);
          x = KN_WINDOW.x - 2 + u * 0.4 * T;
          y = KN_WINDOW.y + 16;
          o = { t, tint: "rgba(24, 16, 12, 0.95)", alpha: 1 - u, wob: 2 + u * 5 };
          pizza = false;
        } else {
          x = null;
        }
        if (x !== null) {
          knDraw(ctx, im, ox + x, oy + y, o);
          if (pizza) knPizza(ctx, ox + x, oy + y - im.height - 3, 13, "done");
        }
      },
    },
    knImg("chirin", 3.4 * T, 4.9 * T, {
      // ちりん: 外で待つ。きこりが飛び出すと、さかいの手前まで追う
      draw(ctx, sx, sy, t, api) {
        const im = api.image("chirin");
        if (!im) return;
        const gone = api.flag("gone");
        let x = sx;
        let y = sy;
        const el = knRunEl();
        if (gone || el >= 0) {
          const u = gone ? 1 : Math.max(0, Math.min(1, (el - 0.5) / 2.2));
          x = knLerp(sx, 13.4 * T - this.x + sx, u);
          y = knLerp(sy, 6.8 * T - this.y + sy, u);
        }
        x += Math.sin(t * (gone ? 9 : 3)) * (gone ? 3 : 1.5);
        knDraw(ctx, im, x, y - 6);
      },
      update(dt, t, api) {
        // 吹き出しの位置(headY)を、追いかけた先に合わせる
        if (api.flag("gone")) Object.assign(this, { x: 13.4 * T, y: 6.8 * T });
      },
      range: 40,
      interact: (api) => api.bubble("chirin", api.flag("gone") ? "チリ　リ……" : "チリーン", 1400),
    }),
    {
      // 焼けたピザはベネラの口の中(D383)。さかいの手前でベネラの方を向いて調べると、ピールがのびて取り出す
      id: "oven",
      x: 14.25 * T,
      y: 7.3 * T,
      w: 1,
      h: 1,
      headY: 30,
      // 調べる点は、熱ではじかれる線の手前、ちりんより南(D391。ちりんと同じ所だと、ちりんが先に答えた)
      ix: KN_HEAT_X - 0.3 * T - 14.25 * T,
      iy: 0.9 * T,
      range: 34,
      draw() {},
      drawOver(ctx, sx, sy, t, api) {
        const ox = sx - this.x;
        const oy = sy - this.y;
        const mx = ox + KN_WINDOW.x;
        const my = oy + KN_WINDOW.y;
        // 口の中の焼けたピザ(まだ取り出していないとき)と、細い煙
        const inside = api.flag("gone") && !api.flag("pizza") && knPeelT0 < 0;
        if (inside) {
          knPizza(ctx, mx, my + 1, 6, "burnt");
          for (let k = 0; k < 2; k++) {
            const v = (t * 0.6 + k * 0.5) % 1;
            ctx.fillStyle = `rgba(90, 84, 78, ${0.5 * (1 - v)})`;
            ctx.fillRect(Math.round(mx - 2 + k * 4 + Math.sin(t * 3 + k) * 2), Math.round(my - 6 - v * 16), 2, 3);
          }
        }
        if (knPeelT0 < 0) return;
        // ピールがのびる → 口に入る → 焼けたピザをのせて戻る
        const el = knNow() - knPeelT0;
        const P = KN_PEEL;
        const pl = api.player();
        const hx = ox + pl.x + 6;
        const hy = oy + pl.y - 12;
        const u = el < P.reach ? el / P.reach : el < P.in ? 1 : Math.max(0, 1 - (el - P.in) / (P.back - P.in));
        const ex = knLerp(hx + 14, mx, u);
        const ey = knLerp(hy, my, u);
        ctx.strokeStyle = "#6e4c28";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.strokeStyle = "#c4965f";
        ctx.lineWidth = 1;
        ctx.stroke();
        knEll(ctx, ex, ey, 7, 4, "#6e4c28");
        knEll(ctx, ex, ey, 6, 3, "#c4965f");
        if (el >= P.in - 0.1) knPizza(ctx, ex, ey - 1, 6, "burnt");
      },
      // 取り出したかは、持ち物ではなく旗で見る(前の版で持ち帰った電池が焼けたピザに替わっていると、持ち物で見ると、ピールもピザも出なかった)
      canInteract: (api) => api.flag("gone") && api.flag("peel") && !api.flag("pizza") && knPeelT0 < 0,
      interact(api) {
        api.face("east");
        knPeelT0 = knNow();
        api.freeze(KN_PEEL.back + 0.1);
        api.sfx("whir");
        api.later(KN_PEEL.in * 1000, () => api.sfx("pop"));
        api.later(KN_PEEL.back * 1000, () => {
          knPeelT0 = -1;
          // ピールにのせたまま、気象台の中の作業台へ運ぶ(D395)。おみやげは、切り分けて残ったひと切れ
          api.hold("ic_pizza", 1.8, () => api.setFlag("pizza"));
        });
      },
    },
    {
      // 百葉箱(D382、D383): 調べると、こわれた温度計の一枚絵。言葉なし。いつでも
      id: "hyakuyo",
      x: 10.0 * T,
      y: 5.6 * T,
      w: 1,
      h: 1,
      headY: 70,
      range: 44,
      draw() {},
      interact: (api) => api.show("v_thermo"),
    },
    kp2Obj(),
  ],
};
