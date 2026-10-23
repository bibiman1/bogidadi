// 断片: 呪いの野犬(2/4)。B ドライブイン跡と C ダイナーの中。共通の部品と A 峠は noroi.js
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、nS、nMap など)をそのまま使う
"use strict";

// B ドライブイン跡(野犬のたまり場)。ダイナーの戸(北の建物の真ん中)から中へ入れる。みとんの車箪笥は駐車場の東(家なので)
// みとんに話しかけると、車箪笥の引き出しからぼぎカーが出て、炎を塗ってくれる(一枚絵 v_custom、仮)。そのあと野犬たちは直線へ
const nAtStrip = (api) => api.flag("custom");
// 車箪笥とみとんは、カスタムの場面のあともドライブイン跡に残り、きーがストリップへ行ったらストリップだけにいる
// (ドライブイン跡とストリップの両方にいて、別の個体に見えないように。作者「ダイナーの前のミトンと車箪笥はずっといると、コースにいる個体と別にみえないか」)
const nMovedToStrip = (api) => api.flag("custom") && api.flag("stripSeen");
const N_DRIVEIN = nMap("drivein", 28, 14, {
  spawns: {
    west: { x: 1.2 * T, y: 8.5 * T, facing: "east" },
    east: { x: 26.8 * T, y: 8.5 * T, facing: "west" },
    diner: { x: 14 * T, y: 6 * T, facing: "south" },
  },
  // ぽんぽんカーの線は、西の峠のドラム缶からのびてくる
  drawOverlay(ctx, ox, oy, t, api) {
    nKinshiDraw(ctx, ox, oy, api); // 禁止マーク(D365)
    if (!nAtStrip(api)) nCable(ctx, ox - 10, oy + 9.6 * T, ox + 10.6 * T - 24, oy + 11.2 * T - 26, 30);
  },
  triggers: [
    { id: "toPass", x: -T, y: 5 * T, w: 1.45 * T, h: 7 * T, warp: { map: "pass", spawn: "east" } },
    { id: "toStrip", x: 27.55 * T, y: 5 * T, w: 1.45 * T, h: 7 * T, warp: { map: "strip", spawn: "west" } },
    { id: "toDiner", x: 13.2 * T, y: 4.9 * T, w: 1.6 * T, h: 0.45 * T, warp: { map: "diner", spawn: "door" } },
  ],
  objects: [
    kWall(22 * T, 0, 28 * T, 150), // 北東の砂地(サボテン、矢印の看板)は景色。背景の絵の物の奥に回りこまないように、ふさぐ
    nSprite("ponpon", "ponpon_s", 10.6 * T, 11.2 * T, 91, 77, { hidden: nAtStrip, shake: true, solid: { w: 56, h: 22, dy: -10 }, range: 56, interact: nTalk("ponpon") }),
    nSprite("toribogi", "tori_s", 5.2 * T, 11.3 * T, 42, 55, { hidden: nAtStrip, solid: { w: 52, h: 22, dy: -10 }, range: 56, interact: nTalk("toribogi") }),
    nSprite("akabeko", "akabeko_s", 16.6 * T, 11.2 * T, 44, 41, { hidden: nAtStrip, shake: true, solid: { w: 40, h: 22, dy: -10 }, range: 56, interact: nTalk("akabeko") }),
    nSprite("kokeshi", "kokeshi_s", 19.6 * T, 11.2 * T, 28, 54, { hidden: nAtStrip, solid: { w: 22, h: 14, dy: -7 }, range: 50, interact: nTalk("kokeshi") }),
    nSprite("tansu", "tansu_w", 23.2 * T, 10.4 * T, 116, 100, { hidden: nMovedToStrip, shake: true, solid: { w: 108, h: 26, dy: -13 }, range: 70, interact: nTalk("tansu") }),
    nSprite("miton", "miton_s", 26.2 * T, 10.2 * T, 36, 66, {
      hidden: nMovedToStrip, // カスタムのあと、きーがストリップへ行ったら、車箪笥といっしょにストリップだけにいる
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
const N_JUKE = ["juke_1", "juke_2", "juke_3"]; // 3 枚(D337、D342)
const nJukePlaying = () => !!window.bogiAudio && N_JUKE.includes(window.bogiAudio.state().bgm);
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
    const e = nS.jukeT0 < 0 ? -1 : nNow() - nS.jukeT0;
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
    const pe = nS.pinT0 < 0 ? -1 : nNow() - nS.pinT0;
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
        nS.jukeT0 = nNow();
        nS.jukeN = (nS.jukeN % N_JUKE.length) + 1;
        const key = "juke_" + nS.jukeN;
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
       interact: (api) => { nS.pinT0 = nNow(); api.later(500, () => api.warp("pinball", "view")); } }, // ピンボール: 灯りがまたたいてから、台の画面へ(D327。pinball.js)
    {
      // カウンターの新聞(D424): 断片を終えたら置かれる。見出し「卑怯なり無慣性粘着駆動」「地元レーサー憤慨」、
      // 写真は差しかえる前のゴールの絵(赤べこ)、「きーは無期限出場停止」(絵は docs/assets/noroi/news/make.py)。リプレイ券の競争はそのまま
      id: "news",
      x: 140, // 砂糖入れとコーヒーカップのあいだ(左のはしは、床の『走れメロス』の調べる所に近すぎる)
      y: 103,
      iy: 1.6 * T, // 調べる点は、カウンターの手前(きーはカウンターの中へは入れない)
      w: 1,
      h: 1,
      range: 40,
      headY: 0.5 * T,
      hidden: (api) => !api.cleared("noroi"),
      draw(ctx, sx, sy, t, api) {
        const im = api.image("np_counter");
        if (im) ctx.drawImage(im, Math.round(sx - 9), Math.round(sy - 10));
      },
      interact: (api) => api.show("v_news"),
    },
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
