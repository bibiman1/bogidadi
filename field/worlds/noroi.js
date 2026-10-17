// 断片: 呪いの野犬。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== 呪いの野犬 ========
// 今の真昼、陽炎。日本の峠道の先が、ルート 66 のような旧国道に混ざる(D115〜D117)。絵と当たり判定は docs/assets/noroi/、設定資料は docs/assets/noroi/settei/
// 芯(作者 D126): 人も車も絶えて久しい寂寥感のある世界で、ちゃんがいなくなっても走らずにいられないアッパー系ぼぎが、スピードへの衝動を発散している。
// ゴールラインをこえたぼぎには、かつてのちゃんの歓声がきこえてくる。ダイナーはレースの日のまま止まった店(D127、D128)
// 流れ: 峠で、木の葉のぼぎがドラム缶の焚火に木の葉を足す → ぽんぽんカー(有線、D125)がドラム缶を引きずって去る
// → ドライブイン跡(ダイナーの中に入れる)。みとんがぼぎカーに炎を塗る → 旧国道の直線でドラッグレース(勝ち抜き戦: ぽんぽんカー → とりぼぎかー → 赤べこ)
// → 勝つと歓声、一枚絵、タイムスリップ → 道具「クラブの札」。トンネルからいつでも帰れる。台詞はエンジンの音だけで、すべて仮
const N_GRIDS = {
  pass: [
    "############################", // 北の小道は通れない(口にパイロン。作者「余計な詮索でプレイヤーを混乱させたくない」D343)
    "############################",
    "###...######################",
    "###...####........##########",
    "##..........................",
    "............................",
    "............................",
    "............................",
    "............................",
    "############################",
    "############################",
    "############################",
  ],
  drivein: [
    "############################",
    "############################",
    "############################",
    "#.##################.#...#..",
    "#.##################.#...#..",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "############################",
    "############################",
  ],
  strip: [
    "############################",
    "############################",
    "############################",
    "########################....",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "############################",
    "############################",
    "############################",
  ],
  diner: [
    "####################",
    "####################",
    "#############....###",
    "#############......#",
    "#############..#####",
    "#..............#####",
    "#..............#####",
    "##.............#####",
    "##.............#####",
    "##.............#####",
    "#...........########", // 左から 2 マス目はピンボール台の正面(D328)
    "#########..#########",
  ],
};
const nMap = (key, cols, rows, extra) =>
  Object.assign({ tile: T, bg: "#d8bc8a", map: N_GRIDS[key], legend: K_LEGEND, drawGround: kImage(`bg_${key}`, cols * T, rows * T) }, extra);
const nNow = () => performance.now() / 1000;
// 足もと(x, y)に立つ絵。shake があれば、エンジンの振動で 1 ドットふるえる
const nSprite = (id, img, x, y, w, h, extra) =>
  Object.assign(
    {
      id,
      x,
      y,
      w: 1,
      h: 1,
      headY: h - 2,
      draw(ctx, sx, sy, t, api) {
        const im = api.image(typeof this.img === "function" ? this.img(api) : this.img || img);
        const j = this.shake ? Math.round(Math.sin(t * 40 + x) * 0.6) : 0;
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2) + j, Math.round(sy - im.height));
      },
    },
    extra
  );
// 野犬たちの声(エンジンの音)。仮
const N_VOICE = { ponpon: "ポン　ポン　ポン", toribogi: "シュッ　シュッ", akabeko: "ドルルン", kokeshi: "パラララ　キュッ", tansu: "ドッドッドッ" };
const nTalk = (id) => (api) => api.bubble(id, N_VOICE[id], 1800);
// 煙(白いかたまりが流れて消える)
const nPuffs = [];
const nPuff = (x, y, vx, vy, life, size, rgb) => nPuffs.push({ x, y, vx, vy, t0: nNow(), life, size, rgb: rgb || "210, 205, 196" });
const nDrawPuffs = (ctx, ox, oy) => {
  const now = nNow();
  for (let k = nPuffs.length - 1; k >= 0; k--) {
    const p = nPuffs[k];
    const u = (now - p.t0) / p.life;
    if (u >= 1) {
      nPuffs.splice(k, 1);
      continue;
    }
    const s = Math.round(p.size * (0.6 + u * 1.4));
    ctx.fillStyle = `rgba(${p.rgb}, ${0.72 * (1 - u)})`;
    ctx.fillRect(Math.round(ox + p.x + p.vx * u * p.life - s / 2), Math.round(oy + p.y + p.vy * u * p.life - s / 2), s, s);
  }
};
const nGlow = (ctx, x, y, r, rgb, a) => {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb}, ${a})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
};
// ぽんぽんカーとドラム缶をつなぐ黒い線(たるんだ線。原理は説明しない D124)
const nCable = (ctx, x0, y0, x1, y1, sag, race) => {
  const path = (dy) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + dy);
    ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + sag + dy, x1, y1 + dy);
    ctx.stroke();
  };
  if (race) {
    // 競争の画面: 路面にまぎれないよう、太い銅の線に、上のふちの光(D338、作者「引き戻される演出がわかりにくい」)
    ctx.strokeStyle = "#5a3418";
    ctx.lineWidth = 3;
    path(0);
    ctx.strokeStyle = race.taut ? "#ffd890" : "#e09848";
    ctx.lineWidth = 1;
    path(-1);
    return;
  }
  ctx.strokeStyle = "#141210";
  ctx.lineWidth = 2;
  path(0);
};

// A 峠のトンネルの出口(入口で出口)。待避所に、ぽんぽんカーとドラム缶(れんがの上で木の葉が燃える)
// 木の葉のぼぎが北の小道から木の葉を運んできて、ドラム缶にあける(「もってきた　ぽんぽんカー　もってきた」作者のスケッチ)
// 火が燃えあがると、ぽんぽんカーは東へ走り去る。ドラム缶は峠に残り、線だけがのびてついていく(有線 D125。ドラム缶ごと動くのはだめ D131)
const N_CAR0 = 13 * T; // 待避所のぽんぽんカーの x
const N_DRUM = 2.2 * T; // ドラム缶(ぽんぽんカーの西どなり)
let nFuelT0 = -1;
const nFuelAge = (api) => (nFuelT0 >= 0 ? nNow() - nFuelT0 : api.flag("ponponGone") ? 99 : -1);
const N_FUEL = { walk: 1.6, say: 1.6, dump: 5.2, fire: 5.8, go: 7.4, gone: 10.4 };
const nCarX = (api) => {
  const e = nFuelAge(api) - N_FUEL.go;
  if (e <= 0) return N_CAR0;
  return N_CAR0 + 40 * e * e + 30 * e;
};
const nGone = (api) => api.flag("ponponGone") && nFuelT0 < 0;
const N_PASS = nMap("pass", 28, 12, {
  spawns: {
    start: { x: 4.5 * T, y: 4.7 * T, facing: "south" },
    east: { x: 26.4 * T, y: 6.8 * T, facing: "west" },
  },
  drawOverlay(ctx, ox, oy, t, api) {
    const e = nFuelAge(api);
    const dx = N_CAR0 - N_DRUM;
    const up = e > N_FUEL.dump && e < N_FUEL.go + 1 ? 1.7 : 1;
    nGlow(ctx, ox + dx, oy + 4.7 * T - 46, 20 * up, "255, 150, 60", 0.32 + 0.1 * Math.sin(t * 11));
    // 線: ドラム缶から、ぽんぽんカーへ(走り去ったあとは、東の道の先へのびたまま)
    const cx = nGone(api) ? 28 * T + 40 : nCarX(api);
    nCable(ctx, ox + dx + 12, oy + 4.7 * T - 44, ox + cx - 30, oy + 4.7 * T - 30, nGone(api) ? 2 : 10);
    if (!nGone(api) && e > N_FUEL.fire && Math.random() < 0.35) nPuff(cx - 34, 4.7 * T - 30, -30, -18, 0.8, 7);
    nDrawPuffs(ctx, ox, oy);
  },
  triggers: [
    { id: "leave", x: 3 * T, y: 1.8 * T, w: 3 * T, h: 1.2 * T, run: (api) => api.exit() },
    { id: "toDrivein", x: 27.6 * T, y: 4 * T, w: 1.4 * T, h: 5 * T, warp: { map: "drivein", spawn: "west" } },
    {
      id: "fuel",
      x: 10.4 * T,
      y: 3 * T,
      w: 1.2 * T,
      h: 6 * T,
      enabled: (api) => !api.flag("ponponGone"),
      run(api) {
        if (nFuelT0 >= 0) return;
        nFuelT0 = nNow();
        api.freeze(N_FUEL.walk + 0.2);
        api.later(N_FUEL.walk * 1000, () => api.bubble("fueler", "もってきた　ぽんぽんカー　もってきた", 3400));
        api.later(N_FUEL.fire * 1000, () => api.bubble("ponpon", N_VOICE.ponpon, 1600));
        api.later(N_FUEL.gone * 1000, () => {
          api.setFlag("ponponGone");
          nFuelT0 = -1;
        });
      },
    },
  ],
  objects: [
    nSprite("ponpon", "ponpon_e", N_CAR0, 4.75 * T, 80, 59, {
      hidden: nGone,
      shake: true,
      solid: { w: 66, h: 22, dy: -10 },
      range: 56,
      interact: nTalk("ponpon"),
      canInteract: (api) => nFuelT0 < 0,
      update(dt, t, api) {
        this.x = nCarX(api);
        if (this.x > N_CAR0) this.solid = null;
      },
    }),
    nSprite("drum", "drum", N_CAR0 - N_DRUM, 4.7 * T, 46, 62, { solid: { w: 34, h: 16, dy: -8 } }),
    // 北の小道の口のパイロン(D343)。木の葉のぼぎは小道から来るが、きーは入れない
    ...[18.3, 18.95, 19.6, 20.25, 20.9].map((x, k) => nSprite("pylon" + k, "pylon", x * T, 4.05 * T, 12, 16, {})),
    nSprite("fueler", "fueler", 18.9 * T, 1.2 * T, 26, 40, {
      range: 44,
      interact: (api) => api.bubble("fueler", "……", 1200), // 仮
      update(dt, t, api) {
        const e = nFuelAge(api);
        const u = e < 0 ? 0 : Math.min(1, e / N_FUEL.walk);
        const v = e < N_FUEL.say + N_FUEL.walk ? 0 : Math.min(1, (e - N_FUEL.walk - N_FUEL.say) / 1.4);
        this.x = 18.9 * T + (17.2 * T - 18.9 * T) * u - 6.2 * T * v;
        this.y = 1.2 * T + (4.2 * T - 1.2 * T) * u;
      },
    }),
  ],
});

// B ドライブイン跡(野犬のたまり場)。ダイナーの戸(北の建物の真ん中)から中へ入れる。みとんの車箪笥は駐車場の東(家なので)
// みとんに話しかけると、車箪笥の引き出しからぼぎカーが出て、炎を塗ってくれる(一枚絵 v_custom、仮)。そのあと野犬たちは直線へ
const nAtStrip = (api) => api.flag("custom");
const N_DRIVEIN = nMap("drivein", 28, 14, {
  spawns: {
    west: { x: 1.2 * T, y: 8.5 * T, facing: "east" },
    east: { x: 26.8 * T, y: 8.5 * T, facing: "west" },
    diner: { x: 14 * T, y: 6 * T, facing: "south" },
  },
  // ぽんぽんカーの線は、西の峠のドラム缶からのびてくる
  drawOverlay(ctx, ox, oy, t, api) {
    if (!nAtStrip(api)) nCable(ctx, ox - 10, oy + 9.6 * T, ox + 10.6 * T - 24, oy + 11.2 * T - 26, 30);
  },
  triggers: [
    { id: "toPass", x: -T, y: 5 * T, w: 1.45 * T, h: 7 * T, warp: { map: "pass", spawn: "east" } },
    { id: "toStrip", x: 27.55 * T, y: 5 * T, w: 1.45 * T, h: 7 * T, warp: { map: "strip", spawn: "west" } },
    { id: "toDiner", x: 13.2 * T, y: 4.9 * T, w: 1.6 * T, h: 0.45 * T, warp: { map: "diner", spawn: "door" } },
  ],
  objects: [
    kWall(22 * T, 0, 28 * T, 150), // 北東の砂地(サボテン、矢印の看板)は景色。背景の絵の物の奥に回りこまないように、ふさぐ
    nSprite("ponpon", "ponpon_s", 10.6 * T, 11.2 * T, 65, 60, { hidden: nAtStrip, shake: true, solid: { w: 56, h: 22, dy: -10 }, range: 56, interact: nTalk("ponpon") }),
    nSprite("toribogi", "tori_s", 5.2 * T, 11.3 * T, 64, 86, { hidden: nAtStrip, solid: { w: 52, h: 22, dy: -10 }, range: 56, interact: nTalk("toribogi") }),
    nSprite("akabeko", "akabeko_s", 16.6 * T, 11.2 * T, 46, 50, { hidden: nAtStrip, shake: true, solid: { w: 40, h: 22, dy: -10 }, range: 56, interact: nTalk("akabeko") }),
    nSprite("kokeshi", "kokeshi_s", 19.6 * T, 11.2 * T, 25, 56, { hidden: nAtStrip, solid: { w: 22, h: 14, dy: -7 }, range: 50, interact: nTalk("kokeshi") }),
    nSprite("tansu", "tansu_w", 23.2 * T, 10.4 * T, 118, 89, { shake: true, solid: { w: 108, h: 26, dy: -13 }, range: 70, interact: nTalk("tansu") }),
    nSprite("miton", "miton_s", 26.2 * T, 10.2 * T, 36, 66, {
      solid: { w: 24, h: 14, dy: -7 },
      range: 50,
      interact(api) {
        if (api.flag("custom")) return api.bubble("miton", "……", 1400); // 仮
        api.bubble("miton", "……", 1400); // 仮
        api.later(1500, () =>
          api.show("v_custom", () => {
            api.setFlag("custom");
            api.bubble("tansu", N_VOICE.tansu, 1800);
          }, { full: true })
        );
      },
    }),
    nSprite("bogicar", "bogicar_e_flame", 23.2 * T, 11.8 * T, 77, 37, { hidden: (api) => !api.flag("custom") || api.flag("won") }),
  ],
});

// C ダイナーの中(D127、D128)。レースの日のまま止まった店。中に入るのはきーだけ
// 南の窓からの光の帯の中で、ほこりがゆっくり舞う。ジュークボックスは、調べると泡が光ってのぼり、色の光が床を流れる(電気が来ていないわけは説明しない)
// 壁の写真を調べると、レースの日の一枚絵(後ろ姿の見物人と、走る車。v_photo)
let nJukeT0 = -1;
let nJukeN = 0; // 最後にかけたレコード(0 はまだ)
const N_JUKE = ["juke_1", "juke_2", "juke_3"]; // 3 枚(D337、D342)
const nJukePlaying = () => !!window.bogiAudio && N_JUKE.includes(window.bogiAudio.state().bgm);
let nPinT0 = -1;
const nMotes = [];
for (let i = 0; i < 46; i++) nMotes.push({ x: Math.random(), y: Math.random(), p: Math.random() * 6, s: Math.random() < 0.3 ? 2 : 1 });
const N_SHAFTS = [3, 7.5, 12.5]; // 光の帯の南のはし(マス)
const N_DINER = nMap("diner", 20, 12, {
  bg: "#2a2420",
  spawns: { door: { x: 10 * T, y: 10.5 * T, facing: "north" }, pinball: { x: 1.5 * T, y: 10.85 * T, facing: "north" } /* 左の壁のマスにかからない所(作者「ゲームしたあとにハマる」) */ },
  drawOverlay(ctx, ox, oy, t, api) {
    // ほこり: 光の帯の中だけ、ゆっくり上下に漂う
    for (const m of nMotes) {
      const k = Math.floor(m.x * N_SHAFTS.length) % N_SHAFTS.length;
      const v = (m.y + t * 0.012 * (1 + m.p * 0.1)) % 1;
      const yy = 5 * T + v * 7 * T;
      const w0 = N_SHAFTS[k] * T + (1 - v) * 0.8 * T * 0 + (yy - 5 * T) * 0;
      const xx = w0 + 0.8 * T + ((m.x * 97) % 1) * 2 * T - (yy - 5 * T) * 0.11 + Math.sin(t * 0.6 + m.p) * 4;
      ctx.fillStyle = `rgba(255, 248, 220, ${0.35 + 0.3 * Math.sin(t * 1.3 + m.p)})`;
      ctx.fillRect(Math.round(ox + xx), Math.round(oy + yy), m.s, m.s);
    }
    // ジュークボックス(1963 Seeburg のコンソール型 D141): 前の格子と下の灯りの帯が、色を変えながら光る
    // レコードがかかっている間は光り続ける(音が出ない環境では 14 秒)
    const e = nJukeT0 < 0 ? -1 : nNow() - nJukeT0;
    const on = nJukePlaying() ? 1e9 : 14;
    if (e >= 0 && e < on) {
      const a = Math.min(1, e / 0.8) * Math.min(1, (on - e) / 2);
      const jx = ox + 18.06 * T;
      const jy = oy + 1.4 * T;
      const cols = ["255, 90, 60", "255, 210, 80", "90, 220, 130", "90, 160, 240"];
      nGlow(ctx, jx, jy, 46, cols[Math.floor(t * 2) % 4], 0.32 * a);
      nGlow(ctx, jx, jy + 0.55 * T, 30, cols[(Math.floor(t * 2) + 1) % 4], 0.45 * a);
      // 色の光が、床の市松の上を流れる
      for (let k = 0; k < 4; k++) {
        const ang = t * 0.5 + (k * Math.PI) / 2;
        nGlow(ctx, ox + 8 * T + Math.cos(ang) * 5 * T, oy + 7.2 * T + Math.sin(ang * 1.3) * 2.2 * T, 34, cols[k], 0.2 * a);
      }
    }
    // ピンボール(1960 年代の Gottlieb のくさび形の頭): 調べると、頭の絵のガラスとバンパーの灯りがまたたく
    const pe = nPinT0 < 0 ? -1 : nNow() - nPinT0;
    if (pe >= 0 && pe < 3.2) {
      const on = Math.floor(pe * 8) % 2 === 0;
      nGlow(ctx, ox + 1.2 * T, oy + 7.6 * T, 22, "255, 200, 90", (on ? 0.55 : 0.25) * Math.min(1, (3.2 - pe) / 0.6));
      nGlow(ctx, ox + 1.2 * T, oy + 9.0 * T, 16, "255, 240, 150", (on ? 0.2 : 0.5) * Math.min(1, (3.2 - pe) / 0.6));
    }
  },
  // レコードがかかっている間は、ジュークボックスに近いほど大きく聞こえる(店の反対のはしで半分くらい)
  bgmLevel: (p) => (nJukePlaying() ? 1 - 0.5 * Math.min(1, Math.hypot(p.x - 18.06 * T, p.y - 3.3 * T) / (16 * T)) : 1),
  triggers: [{ id: "out", x: 9 * T, y: 11.55 * T, w: 2 * T, h: T, warp: { map: "drivein", spawn: "diner" } }],
  objects: [
    {
      id: "juke",
      x: 18.06 * T,
      y: 3.3 * T,
      w: 1,
      h: 1,
      headY: 2.4 * T,
      range: 56,
      // 調べると、次のレコードを 1 枚かける(D334。3 枚を順に D342)。かかっている間は灯りが光り続け、終わるとダイナーの静けさに戻る
      interact(api) {
        nJukeT0 = nNow();
        nJukeN = (nJukeN % N_JUKE.length) + 1;
        const key = "juke_" + nJukeN;
        if (window.bogiAudio)
          window.bogiAudio.bgm(key, {
            once: true,
            onEnd: () => {
              if (window.bogiAudio.state().bgm === key) window.bogiAudio.bgm("noroi");
            },
          });
        api.bubble("juke", "♪　　♪", 2600);
        api.later(3200, () => api.bubble("juke", "♪", 2200));
      },
    },
    { id: "photo", x: 14.3 * T, y: 3.2 * T, w: 1, h: 1, headY: 2.2 * T, range: 48, interact: (api) => api.show("v_photo") },
    { id: "plaques", x: 13.2 * T, y: 3.2 * T, w: 1, h: 1, headY: 2.6 * T, range: 44, interact: (api) => api.show("v_plaque") }, // 一つ分あいた釘。並んだ札を調べると、クラブの札の大写し(作者「プラークのデザインを見せてあげればよい」)
    { id: "pinball", x: 1.25 * T, y: 9.3 * T, iy: 1.6 * T, w: 1, h: 1, headY: 2.4 * T, range: 30, // 台の正面(下)に立って調べる(D328)
       interact: (api) => { nPinT0 = nNow(); api.later(500, () => api.warp("pinball", "view")); } }, // ピンボール: 灯りがまたたいてから、台の画面へ(D327。pinball.js)
    {
      // ボックス席のテーブルの雑誌「BOGICAR GRAPHIC」(D320): 表紙から、A でめくって 6 台を 1 台ずつ(絵は docs/assets/noroi/magazine/make.py)
      id: "magazine",
      x: 17.2 * T, // 調味料のびんの右
      y: 8.75 * T,
      ix: -1.7 * T, // 調べる点は、通路(テーブルの左のはし)に寄せる。きーはテーブルの中へは入れない(作者「出ない」)
      w: 1,
      h: 1,
      range: 40,
      headY: 0.6 * T,
      draw(ctx, sx, sy) {
        // 赤い題の帯の、少し斜めに置かれた一冊
        ctx.fillStyle = "rgba(40, 30, 20, 0.25)";
        ctx.fillRect(sx - 6, sy - 9, 13, 10);
        ctx.fillStyle = "#e8e0cc";
        ctx.fillRect(sx - 7, sy - 11, 12, 10);
        ctx.fillStyle = "#b4281f";
        ctx.fillRect(sx - 7, sy - 11, 12, 3);
        ctx.fillStyle = "#5a3a28";
        ctx.fillRect(sx - 4, sy - 5, 6, 2);
      },
      interact(api) {
        // めくる音と、紙がめくれる効果(D325、D326)
        const page = (i) => {
          api.sfx("page");
          // ページの枠(make.py): 表紙は x 140〜340、見開きはのど 238・右はし 466、どちらも y 8〜280
          const box = i === 1 ? { spine: 140 / 480, right: 340 / 480 } : { spine: 238 / 480, right: 466 / 480 };
          api.show(`v_mag_${i}`, i < 6 ? () => page(i + 1) : null, i > 0 ? { flip: `v_mag_${i - 1}`, page: Object.assign(box, { top: 8 / 288, bottom: 280 / 288 }) } : null);
        };
        page(0);
      },
    },
  ],
});
// レコードがかかっていれば、そのまま(ピンボールから戻ったときに止めない)。nMap は Object.assign なので、あとから getter をつける
Object.defineProperty(N_DINER, "bgm", { get: () => (nJukePlaying() ? window.bogiAudio.state().bgm : undefined) });
// 店の外(ドライブイン跡)でも、レコードは小さく聞こえる。扉の前で 3 割、遠ざかるほど小さく(D339、作者「ダイナーの外でも小さく聞こえるようにして」)
Object.defineProperty(N_DRIVEIN, "bgm", { get: () => (nJukePlaying() ? window.bogiAudio.state().bgm : undefined) });
N_DRIVEIN.bgmLevel = (p) => (nJukePlaying() ? Math.max(0.05, 0.3 * (1 - Math.hypot(p.x - 14 * T, p.y - 5 * T) / (14 * T))) : 1);

// D 旧国道の直線(ドラッグストリップ)。競争の画面と同じ場所(D140): 北と南に空っぽの木のスタンド、スタートの白線と信号の柱、東にゴールの線と計時の小屋
// 炎を塗ったあと、野犬たちが北の路肩に並び、スタートの白線の手前に三台(ぽんぽんカー、赤べこ、ぼぎカー)
const nRace = (api, duel) => {
  nDuelNext = duel || null;
  api.warp("race", "view");
};
// 優勝のあとは、話しかけたマシンと一騎打ち(D341)。その前は、いつもの声だけ(または fallback)
const nDuelOr = (id, fallback) => (api) => {
  if (!api.flag("won")) return (fallback || nTalk(id))(api);
  nTalk(id)(api);
  api.later(900, () => nRace(api, id));
};
const N_STRIP = nMap("strip", 28, 12, {
  spawns: {
    west: { x: 1.2 * T, y: 6.6 * T, facing: "east" },
    start: { x: 4.4 * T, y: 7.8 * T, facing: "east" },
    finish: { x: 10.2 * T, y: 7.8 * T, facing: "west" },
  },
  onEnter(api) {
    if (api.flag("won") && !api.hasItem("クラブの札")) {
      api.freeze(3.4);
      api.later(500, () => api.bubble("akabeko", N_VOICE.akabeko, 1600));
      api.later(900, () => api.bubble("kokeshi", N_VOICE.kokeshi, 1500));
      api.later(1300, () => api.bubble("ponpon", N_VOICE.ponpon, 1400));
      api.later(2000, () =>
        api.hold("ic_fuda", 1.8, () => {
          api.giveItem("クラブの札");
          api.clear();
          api.show("v_plaque", () => kLearn(api, "hashiru", "はしる")); // もらった札の大写し(カークラブの札だとわかるように)。競争に勝って、はしるを覚える(D201)
        })
      );
    }
  },
  drawOverlay(ctx, ox, oy, t, api) {
    if (nAtStrip(api)) nCable(ctx, ox - 10, oy + 4.2 * T, ox + 7.6 * T - 40, oy + 5.25 * T - 24, 18); // 線は西の峠のドラム缶から
    // バーンナウト(D146、D147): スタートの白線の手前で、ぽんぽんカーと赤べこがタイヤを空まわりさせ、白煙がうしろ(西 = 過去)へ流れる。
    // きーが近づくほど激しくなる
    if (nAtStrip(api) && !api.flag("won")) {
      const p = api.player();
      const d = Math.hypot(p.x - 7.6 * T, p.y - 7 * T);
      const k = Math.max(0.15, Math.min(1, 1 - (d - 2 * T) / (10 * T)));
      for (const [wx, wy] of [[7.6 * T - 26, 5.25 * T - 5], [7.6 * T - 22, 6.9 * T - 5]]) {
        if (Math.random() < 0.55 * k) nPuff(wx + Math.random() * 6, wy - Math.random() * 4, -40 - 60 * k * Math.random(), -8 - Math.random() * 14, 0.8 + 0.7 * k, 6 + 9 * k);
      }
      if (k > 0.85 && Math.random() < 0.02) api.shake(0.2, 1);
    }
    nDrawPuffs(ctx, ox, oy);
  },
  triggers: [{ id: "toDrivein", x: -T, y: 3 * T, w: 1.45 * T, h: 7 * T, warp: { map: "drivein", spawn: "east" } }],
  objects: [
    // 見届け: 競争のあと、空っぽのスタンドの見物人の影が消えるまで待つ(D189)
    kWatch({
      id: "w_crowd",
      x: 14 * T,
      y: 4.6 * T,
      r: 3.4 * T,
      sec: 6, lure: "255, 240, 210",
      when: (api) => api.flag("won") && api.hasItem("クラブの札"), // スタンドの砂(まわる)はやめた(D226)
      fx(ctx, sx, sy, p, t) {
        const a = (p < 0.3 ? p / 0.3 : (1 - p) / 0.7) * 0.5;
        ctx.fillStyle = `rgba(30, 26, 30, ${a})`;
        for (let k = 0; k < 18; k++) {
          const x = sx - 7 * T + k * 0.8 * T;
          const y = sy - 2.2 * T + Math.sin(t * 6 + k) * 1.5;
          ctx.beginPath();
          ctx.arc(x, y - 10, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(x - 6, y - 6, 12, 14);
        }
      },
    }),
    nSprite("tree", "tree", 9 * T, 4.9 * T, 20, 65, { solid: { w: 12, h: 10, dy: -5 } }), // 信号の柱はスタートの白線(D140)
    nSprite("toribogi", "tori_e", 12 * T, 4.4 * T, 93, 81, { hidden: (api) => !nAtStrip(api), range: 60, interact: nDuelOr("toribogi") }),
    nSprite("kokeshi", "kokeshi_e", 15.4 * T, 4.4 * T, 72, 51, { hidden: (api) => !nAtStrip(api), range: 56, interact: nDuelOr("kokeshi") }),
    nSprite("tansu", "tansu_e", 19.4 * T, 4.4 * T, 118, 89, { hidden: (api) => !nAtStrip(api), shake: true, range: 70, interact: nDuelOr("tansu") }),
    nSprite("miton", "miton_s", 22.4 * T, 4.4 * T, 36, 66, { hidden: (api) => !nAtStrip(api), range: 50, interact: (api) => api.bubble("miton", "……", 1400) }),
    nSprite("ponpon", "ponpon_e", 7.6 * T, 5.25 * T, 80, 59, { hidden: (api) => !nAtStrip(api), shake: true, range: 56, interact: nDuelOr("ponpon") }),
    nSprite("akabeko", "akabeko_e", 7.6 * T, 6.9 * T, 67, 46, {
      hidden: (api) => !nAtStrip(api),
      shake: true,
      solid: { w: 58, h: 16, dy: -8 },
      range: 60,
      interact: nDuelOr("akabeko", (api) => nRace(api)),
    }),
    nSprite("bogicar", "bogicar_e_flame", 7.4 * T, 8.7 * T, 77, 37, {
      hidden: (api) => !nAtStrip(api),
      solid: { w: 66, h: 12, dy: -6 },
      range: 52,
      interact: (api) => nRace(api),
      canInteract: (api) => !api.flag("won"),
    }),
  ],
});

// E 競争(D133、D134、D146、D148、D152): スタートはうしろから(バーンナウト、信号、青で A、発進のウィリー)。押して 1.1 秒で、横向きの再現シーンへ切りかえ、
// 青の少し前から同じ出来事を真横から見せる。左がスタート(過去)、右がゴール(未来)。ウィリーはスタートのときだけ、うしろからも横からも。2 台ずつの勝ち抜き戦
// 手前に信号の柱(ツリー)。手順は本物のドラッグレース(D125): バーンナウト(タイヤが空まわりして白煙)→ ステージ → 黄が 0.5 秒ごと → 青で A(青より前は赤で負け)→ 発進
// 赤べこは前輪を上げて出る(ウィリー)。カメラは先を行く車を追って右へ流れ、ゴールは右のはし
// 1 回戦 ぽんぽんカー(ゴールの手前で線がのびきり、左の峠(過去)のドラム缶へ引き戻される)→ 準決勝 とりぼぎかー → 決勝 赤べこ。負けたらその回からやり直し
// ゴール: 勝った側の灯り、空っぽのスタンドに、かつてのちゃんの見物人の影が満ちて消える(歓声 D126)
// きーは歩きの絵の右向きを、同じ描き方で 2 倍に直接描いた絵(勝手に作らない D134、docs/assets/noroi/race/ki_side.py)。青で押すと、つぶれて背中に張り付く(粘着駆動 D123)
// マシンの絵は三面図(docs/assets/noroi/sanmen/)の横の下絵から。空・スタンド・道は 1 ドット = ゲームの 1 ドット(D145)
const N_RACE_D = 402; // クォーターマイル(m)
const N_GREEN = 5.6; // 青の時刻(ステージ 3.4、黄 4.1、4.6、5.1)
const N_KI_ET = 2.4; // ぼぎカーは無慣性: 押した瞬間に全速、ゴールまで 2.4 秒
// 相手: ゴールまでの時間(青から)。ぼぎカーが勝つには、青から押すまでが (et - 2.4) 秒より短いこと
const N_ROUNDS = [
  { id: "ponpon", img: "rcs_pon", name: "１かいせん", et: 3.0, snap: 0.86, lift: 0.07, snd: "pon" }, // バンジーで戻されるので、フライングしなければ勝てる
  { id: "toribogi", img: "rcs_tori", name: "じゅんけっしょう", et: N_KI_ET + 1.4, lift: 0, snd: "jet" },
  { id: "akabeko", img: "rcs_aka", name: "けっしょう", et: N_KI_ET + 0.9, lift: 0.2, snd: "v8" },
];
// 優勝のあとの一騎打ち(D341、作者「ドラッグレースは何回もチャレンジできるようにして。あと、車箪笥やこけしとも競争したい。」)
// ドラッグストリップでマシンに話しかけると、そのマシンと何度でも。勝ち負けで進み具合は変わらない(タイムだけ)
const N_DUEL = {
  ponpon: N_ROUNDS[0],
  toribogi: N_ROUNDS[1],
  akabeko: N_ROUNDS[2],
  tansu: { id: "tansu", img: "rcs_tansu", name: "くるまだんす", et: N_KI_ET + 1.2, lift: 0, rattle: 2, snd: "v8big" }, // ヘミ V8 の重い箱。出だしで引き出しがガタつく(みとんが中に乗る)
  kokeshi: { id: "kokeshi", img: "rcs_kokeshi", name: "こけし", et: N_KI_ET + 0.6, lift: 0.1, snd: "bike" }, // いちばん速い。反応が遅いと負ける
};
let nDuelNext = null; // 次の競争の一騎打ちの相手(nRace で決める)
const nCurRd = () => (nr.duel ? N_DUEL[nr.duel] : N_ROUNDS[nr.round]);
const N_PX = 3; // 1 m = 3 ドット
const N_SNAP_HOLD = 0.35; // ぽんぽんカーの線が張って止まっている秒(D338)
const N_SNAP_FLY = 1.0; // そこから峠へ飛んでいく秒
const N_SX = 196; // スタートの線(世界の x)。マシンの鼻先がここにそろう
const N_FX = N_SX + N_RACE_D * N_PX; // ゴールの線
const N_GY = { opp: 220, ki: 286 }; // 奥の車線と手前の車線の地面の y
const N_TREE = { x: 214, foot: 298, xs: [7, 23], ys: [8, 24, 40, 56, 72, 89, 105], r: 5 }; // 手前の信号の柱(左の列 = 相手、右の列 = ぼぎカー)
const N_LAMP = { stage: "#f4f0dc", amber: "#ffbe3c", green: "#7cf08a", red: "#ff4a3c" };
const nr = { t0: 0, foul: -1, go: -1, end: null, endT: 0, snapT: -1, round: 0, repT: -1, rep0: 0, flash: -1 };
const nRound = (api) => (api.flag("nrR2") ? 2 : api.flag("nrR1") ? 1 : 0);
const nRaceReset = (api) => {
  nr.t0 = nNow();
  nr.foul = -1;
  nr.go = -1;
  nr.end = null;
  nr.snapT = -1;
  nr.snapSfx = false;
  nr.repT = -1;
  nr.flash = -1;
  nr.round = nRound(api);
  nr.duel = nDuelNext;
  nRcPuffs.length = 0;
  nRrPuffs.length = 0;
};
// 相手の位置(m)。青から少し遅れて出て、だんだん速く
const nOpp = (rd, t) => {
  const react = 0.25;
  if (t <= react) return 0;
  const u = Math.min(1.2, (t - react) / (rd.et - react));
  return N_RACE_D * Math.pow(u, 1.7);
};
// 時計: うしろからの画面では本当の時間。横向きの再現シーンでは、青の少し前から同じ出来事をもう一度たどる
const nRaceState = () => {
  const real = nNow() - nr.t0;
  const s = nr.repT >= 0 ? nr.rep0 + (real - nr.repT) : real;
  const rd = nCurRd();
  const ki = nr.go < 0 ? 0 : Math.max(0, Math.min(N_RACE_D + 24, (s - nr.go) * (N_RACE_D / N_KI_ET))); // 無慣性なので、ゴールを過ぎたらその場でぴたりと止まる
  let opp = nr.foul >= 0 ? 0 : nOpp(rd, s - N_GREEN);
  let back = 0;
  let taut = 0;
  if (rd.snap) {
    const lim = N_RACE_D * rd.snap;
    if (opp >= lim && nr.snapT < 0) nr.snapT = s;
    if (nr.snapT >= 0) {
      // 線がのびきる: まず「ピン」と張って一瞬止まり(前へ少しのびる)、それからゴムのように左の峠(過去)へ飛んでいく(D338)
      const d = s - nr.snapT;
      if (d < N_SNAP_HOLD) {
        opp = lim + 2 * Math.sin((Math.PI * d) / N_SNAP_HOLD);
        taut = 1 - d / N_SNAP_HOLD;
      } else {
        const u = Math.min(1, (d - N_SNAP_HOLD) / N_SNAP_FLY);
        opp = lim - (lim + 90) * u * u;
        back = Math.max(0.001, u);
      }
    }
  }
  return { s, real, rd, ki, opp, back, taut };
};
// タイムスリップ(D346、作者「無慣性粘着駆動が卑怯という演出をいれたい」): ぼぎカーのイーティーは、押した時刻に関係なく毎回まったく同じ 2.400。
// 最高速は「----」(はかれない)。相手の欄には、ふつうの数字。説明はせず、数字だけで気づかせる
const nSlip = (rd, rt) => [
  `リアクション　${rt}`,
  `イーティー　${N_KI_ET.toFixed(3)}`,
  `さいこうそく　----`,
  rd.snap ? `あいて　ゴールせず` : `あいて　${(rd.et - 0.25 + Math.random() * 0.04).toFixed(3)}`,
];
// 負けた相手の抗議(D346): ゴールのあと、相手がぼぎカーのとなりへ戻ってきて、何度もエンジンをふかす。言葉はなく、音としぐさだけ
// 返す値: null か { pos(m), rev(0〜1) }。ぽんぽんカーは峠へ引き戻されたので、しない
const nProtest = (st0) => {
  const { s, rd, ki, opp } = st0;
  if (nr.end !== "win" || rd.snap || nr.repT < 0) return null;
  const t = s - nr.endT;
  if (t < 0.6) return null;
  const target = ki + 6; // ぼぎカーのとなり、鼻先を少し前に
  const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const w = sm((t - 0.6) / 0.8);
  return { pos: opp + (target - opp) * w, rev: t > 1.4 ? 1 : 0 };
};
// 競争の音(D344): 相手のエンジン(マシンごとの音色)、スキール音、ぼぎカーの風。毎コマ、時計から決める
// cam: 横からの画面のカメラ(null ならうしろからの画面)。左右と遠さを、車の見える位置から決める(D345)
const nRaceSound = (st0, cam) => {
  const A = window.bogiAudio && window.bogiAudio.race;
  if (!A) return;
  const { s, rd, ki, opp, back, taut } = st0;
  if (A.kind() !== rd.snd) A.start(rd.snd);
  const st = s - N_GREEN;
  let rpm = 0.08;
  let eng = 0.35;
  let squeal = 0;
  if (s > 1 && s < 3.2) {
    // バーンナウト: 空ぶかしとホイールスピン
    rpm = 0.6 + 0.1 * Math.sin(s * 9);
    eng = 0.85;
    squeal = 0.85;
  } else if (s >= 3.2 && st < 0) {
    rpm = 0.22 + 0.18 * Math.max(0, Math.sin(s * 5)); // ステージで、ブォンブォンとあおる
    eng = 0.6;
  }
  if (st >= 0 && nr.foul < 0) {
    const u = Math.max(0, opp) / N_RACE_D;
    const g = Math.min(2.95, u * 3.2); // 3 速まで。ギアが変わるたびに回転が落ちる
    rpm = st < 0.25 ? 0.5 : 0.45 + 0.55 * (g - Math.floor(g));
    eng = 1;
    squeal = Math.max(0, 1 - st / 0.8);
    if (opp >= N_RACE_D || (nr.end && !rd.snap)) {
      const e = Math.max(0, s - (nr.endT || s));
      rpm = Math.max(0.1, 0.7 - e * 0.4);
      eng = Math.max(0.25, 1 - e * 0.5);
    }
    if (taut > 0) (rpm = 1), (eng = 1);
    else if (back > 0) (rpm = 0.15 + 0.3 * (1 - back)), (eng = 0.5 * (1 - back) + 0.2);
  }
  if (nr.go >= 0 && s >= nr.go && s - nr.go < 0.5) squeal = Math.max(squeal, 1 - (s - nr.go) / 0.5);
  const wind = nr.go >= 0 && s >= nr.go && ki < N_RACE_D ? 0.9 : 0;
  // ぼぎカーのタイヤ: バーンナウトと、押した瞬間
  let squealKi = s > 1 && s < 3.2 ? 0.7 : 0;
  if (nr.go >= 0 && s >= nr.go && s - nr.go < 0.4) squealKi = Math.max(squealKi, 1 - (s - nr.go) / 0.4);
  // 負けた相手の抗議(D346): となりへ戻りながら低く、着いたら何度もふかす
  const pr = nProtest(st0);
  const oppAt = pr ? pr.pos : opp;
  if (pr) {
    rpm = pr.rev ? 0.25 + 0.7 * Math.max(0, Math.sin(s * 11)) : 0.3;
    eng = pr.rev ? 1 : 0.6;
  }
  let oppPan, kiPan, oppVol, kiVol;
  if (cam == null) {
    // うしろから: 相手は左、ぼぎカーは右の車線。走り出すと前へ遠のく
    oppPan = -0.6;
    kiPan = 0.6;
    oppVol = 1 / (1 + Math.max(0, opp) / 70);
    kiVol = 1 / (1 + Math.max(0, ki) / 70);
  } else {
    // 横から: 画面の左右の位置で振り、画面のまん中(240)から離れるほど小さく。相手は奥の車線なので少し小さい
    const sx = (d) => N_SX + d * N_PX - cam;
    const pan = (x) => Math.max(-1, Math.min(1, (x - 240) / 260));
    const vol = (x) => Math.max(0.15, 1 - Math.abs(x - 240) / 700);
    oppPan = pan(sx(oppAt));
    kiPan = pan(sx(ki));
    oppVol = 0.85 * vol(sx(oppAt));
    kiVol = vol(sx(ki));
  }
  A.set({ rpm, eng, squeal, squealKi, wind, oppPan, kiPan, oppVol, kiVol });
};
// 白煙(うしろへ流れて広がり、消える)
const nRcPuffs = [];
const nRcPuff = (x, y, vx) => nRcPuffs.push({ x, y, t0: nNow(), vx: vx - 10 - Math.random() * 30, life: 0.8 + Math.random() * 0.6 });
const nDrawRcPuffs = (ctx, ox, oy, cam) => {
  const now = nNow();
  for (let k = nRcPuffs.length - 1; k >= 0; k--) {
    const p = nRcPuffs[k];
    const u = (now - p.t0) / p.life;
    if (u >= 1) {
      nRcPuffs.splice(k, 1);
      continue;
    }
    const r = 5 + u * 18;
    ctx.fillStyle = `rgba(232, 228, 220, ${0.45 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(ox + p.x + p.vx * u - cam, oy + p.y - u * 16, r, 0, Math.PI * 2);
    ctx.fill();
  }
};
// 横向きの絵を、鼻先 fx(画面)、地面 gy に置く。lift = うしろのタイヤを軸に前を上げる角度(ウィリー)
const nDrawSide = (ctx, im, fx, gy, shake, lift) => {
  if (!im) return null;
  const x0 = Math.round(fx - im.width);
  const y0 = Math.round(gy - im.height + shake);
  if (lift) {
    const px = x0 + im.width * 0.2;
    ctx.save();
    ctx.translate(px, gy);
    ctx.rotate(-lift);
    ctx.drawImage(im, x0 - px, y0 - gy);
    ctx.restore();
  } else ctx.drawImage(im, x0, y0);
  return { x0, y0, w: im.width, h: im.height };
};
// ドットの円(ふちをぼかさない)
const nDisk = (ctx, cx, cy, r) => {
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
    ctx.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
  }
};
// 横に流れる層(左右を返しながら並べて、つなぎ目を目立たせない)
const nStrip = (ctx, im, ox, y, off) => {
  if (!im) return;
  const w = im.width;
  const k0 = Math.floor(off / w);
  for (let k = k0; k <= k0 + 2; k++) {
    const x = ox + Math.round(k * w - off);
    if (x > ox + 480 || x + w < ox) continue;
    if (k % 2) {
      ctx.save();
      ctx.translate(x + w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(im, 0, y);
      ctx.restore();
    } else ctx.drawImage(im, x, y);
  }
};
// ---- うしろから見たスタート(D152): バーンナウト → ステージ → 黄 → 青で A → 発進(ウィリー)。押して 1.1 秒で横向きの再現シーンへ ----
// 絵は D134 の真うしろの画面(rc_plate、rc_lamps、rc_*_back)。とりぼぎかーのうしろ姿の子がもは Z に直した(D151)
const NR_VP = { x: 240, y: 108 };
const NR_LANE = { opp: 140, ki: 340 };
const NR_CAR_Y = 274;
const NR_Z0 = 10.9; // カメラからスタートまで(m)。白線(4 m 先)が絵の白線の高さ(y 228)にくる
const NR_TREE = { xs: [232, 247], ys: [130, 146, 162, 177, 192], r: 8 }; // 灯り(左の列 = 相手、右の列 = ぼぎカー)
// 奥行き: d(m)の所の大きさと y
const nScale = (d) => NR_Z0 / (NR_Z0 + Math.max(-NR_Z0 * 0.7, d));
const nAt = (lane, d) => {
  const f = nScale(d);
  return { x: NR_VP.x + (lane - NR_VP.x) * f, y: NR_VP.y + (NR_CAR_Y - NR_VP.y) * f, f };
};
// 白煙(画面の上で広がって消える)
const nRrPuffs = [];
const nRrPuff = (x, y, f) => nRrPuffs.push({ x, y, f, t0: nNow(), vx: (Math.random() - 0.5) * 40 * f, life: 0.9 + Math.random() * 0.5 });
const nDrawRrPuffs = (ctx, ox, oy) => {
  const now = nNow();
  for (let k = nRrPuffs.length - 1; k >= 0; k--) {
    const p = nRrPuffs[k];
    const u = (now - p.t0) / p.life;
    if (u >= 1) {
      nRrPuffs.splice(k, 1);
      continue;
    }
    const r = (6 + u * 16) * p.f;
    ctx.fillStyle = `rgba(232, 228, 220, ${0.4 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(ox + p.x + p.vx * u, oy + p.y - u * 22 * p.f, r, 0, Math.PI * 2);
    ctx.fill();
  }
};
const nDrawCar = (ctx, im, ox, oy, lane, d, shake, lift) => {
  if (!im) return null;
  const { x, y, f } = nAt(lane, d);
  const w = im.width * f;
  const h = im.height * f * (1 + (lift || 0) * 1.6);
  if (w < 1) return null;
  ctx.drawImage(im, Math.round(ox + x - w / 2), Math.round(oy + y - h + shake), Math.round(w), Math.round(h));
  return { x, y, f, w, h };
};
const N_REAR = { ponpon: "rc_pon_back", toribogi: "rc_tori_back", akabeko: "rc_aka_back", tansu: "rc_tansu_back", kokeshi: "rc_kokeshi_back" };
const nDrawRear = (ctx, ox, oy, get, api, st0) => {
  const { s, rd, ki, opp, back } = st0;
  const plate = get("rc_plate");
  if (plate) ctx.drawImage(plate, ox, oy);
  // 信号の灯り
  const lamps = get("rc_lamps");
  const lamp = (col, row, kind) => {
    if (!lamps) return;
    const R = NR_TREE.r;
    ctx.drawImage(lamps, kind * 2 * R, 0, 2 * R, 2 * R, ox + NR_TREE.xs[col] - R, oy + NR_TREE.ys[row] - R, 2 * R, 2 * R);
  };
  const fouled = nr.foul >= 0;
  for (const col of [0, 1]) {
    if (s > 3.4 && !(nr.end && s - nr.endT > 0.2)) lamp(col, 0, 2); // ステージ
    for (let k = 0; k < 3; k++) if (!fouled && s > N_GREEN - 1.5 + k * 0.5 && s < N_GREEN) lamp(col, 1 + k, 3);
    if (!fouled && s >= N_GREEN && !nr.end) lamp(col, 4, 4);
  }
  if (fouled) lamp(1, 4, 5); // ぼぎカーの列だけ赤
  if (nr.end && Math.floor((s - nr.endT) * 4) % 2 === 0 && s - nr.endT < 3) lamp(nr.end === "win" ? 1 : 0, 0, 2); // 勝った側の灯り
  // 揺れ(バーンナウトと発進で、空気がふるえる)
  const burn = s > 1 && s < 3.2;
  const shk = (on, a) => (on ? Math.round(Math.sin(s * 47) * a) : 0);
  // 相手(左の車線)。遠い方から描く
  const oim = get(N_REAR[rd.id]);
  const kim = get("rc_bogi_back");
  const drawOpp = () => {
    const st = s - N_GREEN;
    const lift = rd.lift && st > 0 && st < 1.1 && !back ? rd.lift * Math.sin((Math.PI * st) / 1.1) : 0;
    const r = nDrawCar(ctx, oim, ox, oy, NR_LANE.opp, opp, shk(burn || (st > 0 && st < (rd.rattle ? 1.2 : 0.8)), rd.rattle || 1), lift);
    if (!r) return;
    if (rd.snap) {
      // 線: 画面の左下の外(峠のドラム缶)から、ぽんぽんカーのエンジンの右へ
      nCable(ctx, ox - 30, oy + 310, ox + r.x + r.w * 0.35, oy + r.y - r.h * 0.55, st0.taut > 0 ? 0 : back > 0 ? 6 : Math.max(4, 60 * (1 - opp / N_RACE_D)), { taut: st0.taut > 0 });
    }
    if ((burn || (st > 0.2 && st < 1.0)) && Math.random() < 0.35 && r.f > 0.25) {
      nRrPuff(r.x - r.w * 0.38, r.y - 4 * r.f, r.f);
      nRrPuff(r.x + r.w * 0.38, r.y - 4 * r.f, r.f);
    }
  };
  const drawKi = () => {
    const shake = shk(burn, 1);
    // きー: 立つ(向こう向き)。うしろから見ると、顔のうしろのくぼみに立つきーの下半分は、板のうしろのはしに隠れる
    // 青で押すと、つぶれて背中に張り付く(粘着駆動 D123)
    const { x, y, f } = nAt(NR_LANE.ki, ki);
    const bh = kim ? kim.height * f : 0;
    const stand = get("rc_ki_back");
    if (nr.go < 0 && stand && kim) {
      const w = stand.width * f, h = stand.height * f;
      const footY = y - bh + 22 * f;
      ctx.drawImage(stand, Math.round(ox + x - w / 2), Math.round(oy + footY - h + shake), Math.round(w), Math.round(h));
    }
    const r = nDrawCar(ctx, kim, ox, oy, NR_LANE.ki, ki, shake);
    if (!r) return;
    const stick = get("rc_ki_stick");
    if (nr.go >= 0 && stick) {
      const w = stick.width * f, h = stick.height * f;
      const footY = y - bh + 12 * f;
      ctx.drawImage(stick, Math.round(ox + x - w / 2), Math.round(oy + footY - h + shake), Math.round(w), Math.round(h));
    }
    if (burn && Math.random() < 0.3) {
      nRrPuff(r.x - r.w * 0.42, r.y - 4, r.f);
      nRrPuff(r.x + r.w * 0.42, r.y - 4, r.f);
    }
  };
  if (opp > ki) {
    drawOpp();
    drawKi();
  } else {
    drawKi();
    drawOpp();
  }
  nDrawRrPuffs(ctx, ox, oy);
  if (burn && Math.random() < 0.05) api.shake(0.25, 1);
};
const N_RACE = {
  tile: T,
  bg: "#000",
  hidePlayer: true,
  map: kGrid(15, 10, () => false),
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 5 * T, facing: "east" } },
  onEnter(api) {
    nRaceReset(api);
  },
  debug: () => Object.assign({ s: nNow() - nr.t0, green: N_GREEN }, nr),
  onA(api) {
    const { s } = nRaceState();
    if (nr.end || nr.foul >= 0 || nr.go >= 0 || s < 3.4) return true;
    if (s < N_GREEN) {
      nr.foul = s; // 青より前は赤(フライング)
      if (nr.duel) api.later(2000, () => api.say(["フライング"], () => api.warp("strip", "start")));
      else api.later(2000, () => nRaceReset(api));
      return true;
    }
    nr.go = s;
    api.shake(0.5, 2);
    return true;
  },
  drawGround(ctx, ox, oy, img, api) {
    const get = (k) => (typeof img === "function" ? img(k) : null);
    // 押して 1.1 秒たったら、横向きの再現シーンへ(青の 0.5 秒前から、同じ出来事をもう一度たどる D152)
    if (nr.go >= 0 && nr.repT < 0 && nNow() - nr.t0 >= nr.go + 1.1) {
      nr.repT = nNow() - nr.t0;
      nr.rep0 = Math.min(nr.go, N_GREEN) - 0.5;
      nr.snapT = -1;
      nr.snapSfx = false;
      nRcPuffs.length = 0;
      nr.flash = nr.repT;
    }
    const st0 = nRaceState();
    const { s, real, rd, ki, opp, back } = st0;
    // 勝ち負け
    if (!nr.end) {
      const kiIn = ki >= N_RACE_D;
      const oppIn = !rd.snap && opp >= N_RACE_D;
      const timeout = nr.foul < 0 && s > N_GREEN + 7; // 押さなかった(再現の時計でも同じ)
      if (kiIn || oppIn || timeout) {
        nr.end = kiIn && !oppIn ? "win" : "lose";
        nr.endT = s;
        if (nr.duel) {
          // 一騎打ち: 勝っても負けても、タイムを出してドラッグストリップへ戻る(また話しかければ、もう一度)
          const lines = nr.end === "win" ? ["かち", ...nSlip(rd, (nr.go - N_GREEN).toFixed(3))] : [nr.foul >= 0 ? "フライング" : "まけ"];
          if (nr.end !== "win" && nr.go >= 0) lines.push(`リアクション　${(nr.go - N_GREEN).toFixed(3)}`);
          api.later(nr.end === "win" ? 3400 : 2200, () => api.say(lines, () => api.warp("strip", "start")));
        } else if (nr.end === "win") {
          const rt = (nr.go - N_GREEN).toFixed(3);
          const last = nr.round === N_ROUNDS.length - 1;
          api.later(3400, () => {
            if (last) {
              api.show("v_finish", () =>
                api.say([`タイム　スリップ`, ...nSlip(rd, rt)], () => {
                  api.setFlag("won");
                  api.warp("strip", "finish");
                }), { full: true });
            } else {
              api.say([`タイム　スリップ`, ...nSlip(rd, rt), `つぎは　${N_ROUNDS[nr.round + 1].name}`], () => {
                api.setFlag(nr.round === 0 ? "nrR1" : "nrR2");
                nRaceReset(api);
              });
            }
          });
        } else if (!nr.duel) api.later(2200, () => nRaceReset(api)); // 負けたら、その回からやり直し
      }
    }
    if (nr.repT < 0) {
      nRaceSound(st0, null);
      nDrawRear(ctx, ox, oy, get, api, st0);
      return;
    }
    // カメラ: 先を行く車の鼻先を画面の 300 に。ゴールの線が画面の 240 まで来たら止まる
    const lead = Math.max(ki, opp, 0);
    let cam = Math.max(0, Math.min(N_FX - 240, N_SX + lead * N_PX - 300));
    // 1 回戦: ぼぎカーがゴールするか、線がのびきったら、カメラを左へ流して、ぽんぽんカーを画面のまん中に。
    // 張って、飛んでいくのを見せてから、ゴールへ戻る(D338、作者「ポンポンカーが引き戻される演出がわかりにくい」)
    if (rd.snap) {
      const lim = N_RACE_D * rd.snap;
      const t1 = Math.min(nr.end ? nr.endT : 1e9, nr.snapT >= 0 ? nr.snapT : 1e9);
      if (t1 < 1e9) {
        const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
        let w = sm((s - t1) / 0.45);
        if (nr.snapT >= 0) w *= 1 - sm((s - (nr.snapT + N_SNAP_HOLD + N_SNAP_FLY + 0.5)) / 0.5);
        const pc = N_SX + (nr.snapT >= 0 ? lim : Math.min(opp, lim)) * N_PX - 300;
        cam = cam + (pc - cam) * w;
      }
    }
    nRaceSound(st0, cam);
    const sky = get("rcs_sky");
    if (sky) ctx.drawImage(sky, ox, oy);
    const pcam = cam * 0.35; // スタンドは遠いので、ゆっくり流れる
    nStrip(ctx, get("rcs_stands"), ox, oy + 64, pcam);
    // 歓声: 勝つと、空っぽのスタンドに、かつてのちゃんの見物人の影が満ちて消える(D126)
    if (nr.end === "win") {
      const u = (s - nr.endT) / 3.2;
      const a = u < 0.25 ? u / 0.25 : u < 0.7 ? 1 : Math.max(0, (1 - u) / 0.3);
      if (a > 0) {
        ctx.globalAlpha = 0.85 * a;
        nStrip(ctx, get("rcs_crowd"), ox, oy + 64 + Math.round(Math.sin(s * 9) * 1.5), pcam); // 帯の上のほうは薄くしてある(D291)
        ctx.globalAlpha = 1;
      }
    }
    nStrip(ctx, get("rcs_road"), ox, oy + 150, cam);
    // スタートとゴールの白線(道を横切る)
    ctx.fillStyle = "rgba(236, 232, 220, 0.85)";
    for (const lx of [N_SX, N_FX]) {
      const x = ox + Math.round(lx - cam);
      if (x < ox - 20 || x > ox + 500) continue;
      for (let y = 196; y < 300; y++) ctx.fillRect(x + Math.round((300 - y) * 0.12), oy + y, lx === N_FX ? 4 : 2, 1);
    }
    const burn = s > 1 && s < 3.2;
    const shk = (on, a) => (on ? Math.round(Math.sin(s * 47) * a) : 0);
    const st = s - N_GREEN;
    // 相手(奥の車線)
    const oim = get(rd.img);
    const pr = nProtest(st0);
    const ofx = ox + N_SX + (pr ? pr.pos : opp) * N_PX - cam;
    let lift = rd.lift && st > 0 && st < 1.1 && !back ? rd.lift * Math.sin((Math.PI * st) / 1.1) : 0;
    if (pr && pr.rev) lift = 0.05 * Math.max(0, Math.sin(s * 11)); // ふかすたびに、前がはね上がる(首を振るように)
    if (st0.taut > 0) lift = -0.06 * Math.sin(Math.PI * (1 - st0.taut)); // 張った瞬間、前のめりに
    const r = nDrawSide(ctx, oim, ofx, oy + N_GY.opp, st0.taut > 0 ? Math.round(Math.sin(s * 90) * 1.5) : pr && pr.rev ? Math.round(Math.sin(s * 60) * 2) : shk(burn || (st > 0 && st < (rd.rattle ? 1.2 : 0.8)), rd.rattle || 1), lift);
    if (r && pr && pr.rev && Math.sin(s * 11) > 0.6 && Math.random() < 0.5) nRcPuff(r.x0 - ox + cam + 10, N_GY.opp - 8, -50); // ふかした煙
    if (r && rd.snap) {
      // 線: 画面の左の外(峠のドラム缶 = 過去)から、ぽんぽんカーのうしろへ。張ったときは真っすぐ、ふるえる
      const sag = st0.taut > 0 ? Math.sin(s * 70) * 2 : back > 0 ? 6 + back * 30 : Math.max(3, 40 * (1 - opp / N_RACE_D));
      nCable(ctx, ox - 20, oy + N_GY.opp - 24, r.x0 + 14, r.y0 + r.h * 0.45, sag, { taut: st0.taut > 0 });
      if (st0.taut > 0 && !nr.snapSfx) {
        nr.snapSfx = true;
        api.sfx("pon_snap");
        api.shake(0.3, 2);
      }
      if (back > 0 && back < 0.9 && Math.random() < 0.3) nRcPuff(r.x0 - ox + cam + 60, N_GY.opp - 10, 30);
    }
    if (r && (burn || (st > 0.1 && st < 0.9)) && Math.random() < 0.45) nRcPuff(r.x0 - ox + cam + 22, N_GY.opp - 6, -40);
    // ぼぎカー(手前の車線)ときー
    const kim = get("rcs_bogi");
    const kfx = ox + N_SX + ki * N_PX - cam;
    const shake = shk(burn, 1);
    const kr = nDrawSide(ctx, kim, kfx, oy + N_GY.ki, shake, 0);
    if (kr) {
      const im = get(nr.go < 0 || s < nr.go ? "rcs_ki" : "rcs_ki_stick"); // 再現シーンでは、押した時刻まで立っている
      // 顔のうしろのくぼみに立つ。押すと、つぶれて背中に張り付く(粘着駆動 D123)
      if (im) {
        const standing = nr.go < 0 || s < nr.go;
        const kx = standing ? kr.x0 + 60 : kr.x0 + 30;
        const ky = standing ? kr.y0 + 20 : kr.y0 + 22;
        ctx.drawImage(im, kx, ky - im.height);
      }
      if (burn && Math.random() < 0.5) nRcPuff(kr.x0 - ox + cam + 26, N_GY.ki - 6, -60);
    }
    nDrawRcPuffs(ctx, ox, oy, cam);
    // 手前の信号の柱(スタートの線の少し先)
    const tree = get("rcs_tree");
    const tx = ox + N_TREE.x - cam;
    if (tree && tx > ox - 40) {
      const ty = oy + N_TREE.foot - tree.height;
      ctx.drawImage(tree, tx, ty);
      const lamp = (col, row, c) => {
        const cx = tx + N_TREE.xs[col];
        const cy = ty + N_TREE.ys[row];
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = c;
        nDisk(ctx, cx, cy, N_TREE.r + 3);
        ctx.globalAlpha = 1;
        nDisk(ctx, cx, cy, N_TREE.r - 1);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx - 2, cy - 2, 2, 1);
      };
      const fouled = nr.foul >= 0;
      for (const col of [0, 1]) {
        if (s > 3.4 && !(nr.end && s - nr.endT > 0.2)) lamp(col, 0, N_LAMP.stage);
        for (let k = 0; k < 3; k++) if (!fouled && s > N_GREEN - 1.5 + k * 0.5 && s < N_GREEN) lamp(col, 1 + k, N_LAMP.amber);
        if (!fouled && s >= N_GREEN && !nr.end) lamp(col, 4, N_LAMP.green);
      }
      if (fouled) {
        lamp(1, 5, N_LAMP.red);
        lamp(1, 6, N_LAMP.red);
      }
      if (nr.end && Math.floor((s - nr.endT) * 4) % 2 === 0 && s - nr.endT < 3) lamp(nr.end === "win" ? 1 : 0, 0, N_LAMP.stage); // 勝った側の灯り
    }
    if (burn && Math.random() < 0.05) api.shake(0.25, 1);
    // 切りかえの白い光
    const fu = (real - nr.flash) / 0.25;
    if (nr.flash >= 0 && fu < 1) {
      ctx.fillStyle = `rgba(255, 252, 240, ${1 - fu})`;
      ctx.fillRect(ox, oy, 480, 300);
    }
  },
  triggers: [],
  objects: [],
};
