// 断片: きこりと金星。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== きこりと金星(D175〜D177) ========
// 嵐の山。惑星混交で、山頂の東のはしに金星のかけらが混ざり込んでいる(硫酸の黄色い雲、焼けた地面、陽炎)。山頂に無人の気象台
// 条件: 山道で気象台のスピーカーが金星の天気予報を流す → きこりが衝動で東へ駆け出す → ちりんと一緒に追って山頂へ
//       → きこりは金星の側へ突っ込み、陽炎の向こうでゆらいで見えなくなる(溶ける瞬間は見せない)→ ちりんはいつもと違う音で鳴る
//       → 残った電池を拾う → 帰る条件。西から帰る
// 向き(D148): きーは左(西)から登り、金星は右(東)のはし。下絵(docs/assets/kinsei/blockout.py)のまま(D156)。天気予報の文面、鳴き声、ちりんの音は仮
const knS = { phase: "idle", t0: 0 };
const knNow = () => performance.now() / 1000;
// 嵐: 暗い空、斜めに降る雨、ときどき稲光
const knStorm = (ctx, t, dark) => {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.fillStyle = `rgba(28, 34, 48, ${dark})`;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(200, 210, 224, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k < 70; k++) {
    const x = (k * 137 + t * 520) % (W + 60) - 30;
    const y = (k * 89 + t * 760) % (H + 40) - 20;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + 16);
  }
  ctx.stroke();
  const f = (t * 0.37) % 7;
  if (f < 0.12 || (f > 0.2 && f < 0.26)) {
    ctx.fillStyle = "rgba(236, 240, 255, 0.35)";
    ctx.fillRect(0, 0, W, H);
  }
};
const knImg = (key, x, y, extra) =>
  Object.assign(
    {
      id: key,
      x,
      y,
      w: 1,
      h: 1,
      headY: 40,
      draw(ctx, sx, sy, t, api) {
        const im = api.image(key);
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height));
      },
    },
    extra
  );
const KN_SANDO = {
  tile: T,
  bg: "#46504a",
  map: kGrid(30, 10, (c, r) => r < 4 || r > 7),
  legend: K_LEGEND,
  drawGround: kImage("bg_sando", 30 * T, 10 * T),
  spawns: {
    start: { x: 1.6 * T, y: 6 * T, facing: "east" },
    east: { x: 28.2 * T, y: 6 * T, facing: "west" },
  },
  drawOverlay(ctx, ox, oy, t) {
    knStorm(ctx, t, 0.32);
  },
  triggers: [
    { id: "leave", x: -T, y: 4 * T, w: 1.6 * T, h: 4 * T, run: (api) => api.exit() },
    { id: "toSancho", x: 29.4 * T, y: 4 * T, w: 1.6 * T, h: 4 * T, warp: { map: "sancho", spawn: "west" } },
    {
      // 気象台のスピーカー(絵の柱、x 5.8 マス)の下まで来ると、金星の天気予報が流れ、きこりが駆け出す
      id: "forecast",
      x: 5.3 * T,
      y: 4 * T,
      w: T,
      h: 4 * T,
      enabled: (api) => !api.flag("dashed"),
      run(api) {
        if (knS.phase !== "idle") return;
        knS.phase = "forecast";
        api.bubble("speaker", "無風、92気圧、456℃、雲", 3400); // 金星の天気予報(作者 D178)
        api.later(3500, () => {
          api.bubble("kikori", "ブヒッ", 900); // 鳴き声(仮)。スピーカーの吹き出しが消えてから
          knS.phase = "dash";
          knS.t0 = knNow();
          api.setFlag("dashed");
        });
      },
    },
  ],
  objects: [
    // 拡声器の柱は、背景から切り抜いた絵(fg_sando)を根元の y で前後させる(作者「背景の前後」)
    kFg("fg_sando", 161, 70, 45, 91, 158),
    kWall(180, 152, 193, 160),
    { id: "speaker", x: 5.8 * T, y: 4.3 * T, w: 1, h: 1, headY: 96, draw() {} },
    knImg("kikori", 7.4 * T, 6.4 * T, {
      hidden: (api) => api.flag("dashed") && knS.phase !== "dash",
      draw(ctx, sx, sy, t, api) {
        const im = api.image("kikori");
        if (!im) return;
        let x = sx;
        let y = sy - Math.abs(Math.sin(t * 9)) * 3; // 落ち着きなく跳ねる
        if (knS.phase === "dash") x = sx + (knNow() - knS.t0) * 330; // 一直線に東へ
        ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height));
      },
      range: 40,
      interact: (api) => api.bubble("kikori", "ブヒッ", 900),
      canInteract: () => knS.phase === "idle",
    }),
    knImg("chirin", 6.7 * T, 6.2 * T, {
      hidden: (api) => api.flag("dashed") && knS.phase !== "dash",
      draw(ctx, sx, sy, t, api) {
        const im = api.image("chirin");
        if (!im) return;
        let x = sx + Math.sin(t * 3) * 1.5; // 風にゆれる
        if (knS.phase === "dash") x += Math.max(0, knNow() - knS.t0 - 0.8) * 70; // 少し遅れて、きこりを追う
        ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(sy - im.height - 6));
      },
      range: 40,
      interact: (api) => api.bubble("chirin", "チリーン", 1200), // 仮
      canInteract: () => knS.phase === "idle",
    }),
  ],
};
const KN_EDGE = 14.6 * T; // 金星のさかい
const KN_SANCHO = {
  tile: T,
  bg: "#5e5a54",
  map: kGrid(20, 12, (c, r) => r < 3 || r > 10 || c >= 15 || (c === 0 && (r < 5 || r > 8))),
  legend: K_LEGEND,
  drawGround: kImage("bg_sancho", 20 * T, 12 * T),
  spawns: { west: { x: 1 * T, y: 6.5 * T, facing: "east" } },
  onEnter(api) {
    if (api.flag("dashed") && !api.flag("gone")) {
      knS.phase = "run";
      knS.t0 = knNow();
    }
  },
  debug: () => Object.assign({ now: knNow() }, knS),
  // きこりが消えたあと、金星のさかいから熱い風が吹きつける(D201)。ふんばる(ぱーでれで覚える)なら、つぶれて張りつき、じりじり進める
  wind(api, x) {
    return api.flag("gone") && x > 10.4 * T ? { x: -300, y: 0 } : null;
  },
  drawOverlay(ctx, ox, oy, t) {
    // 金星の熱: 東から黄色い光
    const g = ctx.createLinearGradient(ox + 12 * T, 0, ox + 20 * T, 0);
    g.addColorStop(0, "rgba(255, 200, 90, 0)");
    g.addColorStop(1, "rgba(255, 200, 90, 0.4)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    knStorm(ctx, t, 0.22);
  },
  triggers: [{ id: "toSando", x: -T, y: 5 * T, w: 1.6 * T, h: 4 * T, enabled: () => knS.phase !== "melt", warp: { map: "sando", spawn: "east" } }],
  objects: [
    // 背景の前後(作者「背景の前後」): 百葉箱と風の塔は、背景から切り抜いた絵(fg_sancho。docs/assets/kinsei/fg_kinsei.py)を根元の y で前後させる
    kFg("fg_sancho", 298, 104, 45, 74, 176),
    kFg("fg_sancho", 364, 18, 36, 95, 111),
    kWall(300, 166, 343, 177), // 百葉箱の脚
    kWall(374, 104, 389, 112), // 風の塔の根元
    kWall(86, 96, 256, 106), // 気象台の建物の下のふち(壁の上を歩かないように)
    kTrace("t_sticker", "t_sticker", 6.7 * T, 3.4 * T, -12), // 気象台の白い壁に、色あせた太陽のシール
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
        const now = knNow();
        if (knS.phase === "run" && now - knS.t0 > 1.6) knS.phase = "edge";
        // さかいで足ぶみして待つ。見える所まで来たら、陽炎の向こうへ
        if (knS.phase === "edge" && api.player().x > 8.5 * T) {
          knS.phase = "melt";
          knS.t0 = now;
        }
        if (knS.phase === "melt" && now - knS.t0 > 3.2) {
          knS.phase = "gone";
          api.setFlag("gone");
          // 金星は、ほかの星と逆向きに、ゆっくり回っている。きーも、逆向きにくるっと回る(まわる D203)
          // まわるは能力としてはやめた(D226)。回る姿だけが残る
          api.later(900, () => api.spin());
        }
        // ちりんは、きこりが消えたあと、いつもと違う音で鳴り続ける(仮)
        if (api.flag("gone") && !api.flag("observed") && t - this.last > 3.5) {
          this.last = t;
          api.bubble("chirin", "チリ　リ……", 1800);
        }
      },
    },
    knImg("kikori", 1.5 * T, 7 * T, {
      hidden: (api) => !["run", "edge", "melt"].includes(knS.phase),
      draw(ctx, sx, sy, t, api) {
        const im = api.image("kikori");
        if (!im) return;
        const now = knNow();
        let x = sx;
        let a = 1;
        let wob = 0;
        if (knS.phase === "run") x = sx + Math.min(1, (now - knS.t0) / 1.6) * (KN_EDGE - this.x);
        if (knS.phase === "edge") {
          x = sx + (KN_EDGE - this.x);
          wob = 1.5; // 陽炎がかかりはじめる
        }
        if (knS.phase === "melt") {
          // 陽炎の向こうで、ゆらいで見えなくなる(溶ける瞬間は見せない)
          const u = Math.min(1, (now - knS.t0) / 3.2);
          x = sx + (KN_EDGE - this.x) + u * 2.4 * T;
          a = 1 - u;
          wob = Math.sin(t * 22) * (2 + u * 5);
        }
        ctx.globalAlpha = Math.max(0, a);
        for (let row = 0; row < im.height; row += 2) {
          const off = Math.round(Math.sin(row * 0.6 + t * 14) * wob * 0.5);
          ctx.drawImage(im, 0, row, im.width, 2, Math.round(x - im.width / 2 + off), Math.round(sy - im.height + row), im.width, 2);
        }
        ctx.globalAlpha = 1;
      },
    }),
    knImg("chirin", 13.4 * T, 6.8 * T, {
      draw(ctx, sx, sy, t, api) {
        const im = api.image("chirin");
        if (!im) return;
        let x = sx + Math.sin(t * (api.flag("gone") ? 9 : 3)) * (api.flag("gone") ? 3 : 1.5);
        if (knS.phase === "run") {
          const el = knNow() - knS.t0;
          x = sx - Math.max(0, 1 - el / 1.6) * (13.4 - 1.5) * T; // 追いかけて、さかいの手前まで
        }
        ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(sy - im.height - 6));
      },
      range: 40,
      interact: (api) => api.bubble("chirin", api.flag("gone") ? "チリ　リ……" : "チリーン", 1400),
    }),
    knImg("i_denchi", 14.1 * T, 7.6 * T, {
      range: 36,
      hidden: (api) => !api.flag("gone") || api.hasItem("電池"),
      interact(api) {
        api.hold("ic_denchi", 1.8, () => {
          api.giveItem("電池");
          api.clear();
        });
      },
    }),
  ],
};
