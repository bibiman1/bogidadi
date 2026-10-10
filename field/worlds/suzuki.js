// 断片: 荒川の鈴木商店。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== 荒川の鈴木商店 ========
// 今の雨上がりの夕方、荒川区の下町(D73〜D76)。マップの絵と当たり判定は docs/assets/suzuki/blockout.py から
// 条件: 店で伝票 → 印刷屋で荷札 → 単結晶(両端に穴の空いた透明な筒)の穴で荷札を結んで中へ(一枚絵)→ 上昇(成層圏、熱圏)→ 衛星軌道で
// 筒の端の穴から出る → 流れ星(一枚絵)→ 夜、河川敷のクレーターの真ん中 → 店で納品書 → 都電で帰る
const S_GRIDS = {
  stop: [
    "############...#############",
    "############...#############",
    "............................",
    "............................",
    "##########........##########",
    "###################.########",
    "############################",
    "############################",
    "############################",
    "############################",
  ],
  alley: [
    "############...#############",
    "############...#############",
    "############...#############",
    "############...#############",
    "############...#############",
    "############...#############",
    "############...#############",
    "....##......................",
    "............................",
    "############...#############",
    "############...#############",
    "############...#############",
    "############...#############",
    "############...#############",
    "............................",
    "............................",
  ],
  shop: [
    "################",
    "################",
    "#..............#",
    "#####......#####",
    "#####......#####",
    "#####......#####",
    "#....######....#",
    "#..............#",
    "####........####",
    "####........####",
    "####........####",
    "#######..#######",
  ],
  river: [
    "############################",
    "############################",
    "............................",
    "....####################....",
    "...######################...",
    "...######################...",
    "...######################...",
    "....####################....",
    "............................",
    "............................",
    "............................",
    "............................",
    "############...#############",
    "............................",
  ],
  crater: [
    "############################",
    "############################",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "############...#############",
    "............................",
  ],
  orbit: [
    "############################",
    "############################",
    "############################",
    "############################",
    "############################",
    "##..........................",
    "##..........................",
    "############################",
    "############################",
    "############################",
  ],
};
const sMap = (key, cols, rows, extra) =>
  Object.assign({ tile: T, bg: "#2e2838", map: S_GRIDS[key], legend: K_LEGEND, drawGround: kImage(`bg_${key}`, cols * T, rows * T) }, extra);
// 流れ星のあとは夜。町のマップに夜の色を重ねる
const sNight = (cols, rows) => (ctx, ox, oy, t, api) => {
  if (!api.flag("fallen")) return;
  ctx.fillStyle = "rgba(14, 22, 64, 0.5)";
  ctx.fillRect(ox, oy, cols * T, rows * T);
};
const sSpot = (id, x, y, interact, extra) => Object.assign({ id, x, y, w: 1, h: 1, range: 44, headY: 40, interact }, extra);

// A 都電の停留場(入口で出口。北の路地の先が町工場の路地)
const S_STOP = sMap("stop", 28, 10, {
  drawOverlay: sNight(28, 10),
  spawns: {
    start: { x: 11 * T, y: 4.7 * T, facing: "north" },
    north: { x: 13.5 * T, y: 1.2 * T, facing: "south" },
  },
  triggers: [{ id: "toAlley", x: 12 * T, y: -T, w: 3 * T, h: 1.3 * T, warp: { map: "alley", spawn: "south" } }],
  objects: [
    // 都電は、納品書を持つまで乗れない(D75)
    sSpot("tram", 11 * T, 5.4 * T, (api) => {
      if (api.hasItem("納品書")) api.exit();
      else api.mutter("まだ帰れない。", 1600); // 仮
    }),
  ],
});

let sPrinting = false;
// B 町工場と長屋の路地(北の階段の先が土手。入口はどれも南の小道に向く)
const S_ALLEY = sMap("alley", 28, 16, {
  drawOverlay: sNight(28, 16),
  spawns: {
    south: { x: 13.5 * T, y: 15.2 * T, facing: "north" },
    north: { x: 13.5 * T, y: 1.2 * T, facing: "south" },
    shop: { x: 19.25 * T, y: 7.6 * T, facing: "south" },
  },
  triggers: [
    { id: "toStop", x: 12 * T, y: 15.75 * T, w: 3 * T, h: T, warp: { map: "stop", spawn: "north" } },
    // 流れ星のあとは、夜のクレーターの河川敷へ
    { id: "toRiver", x: 12 * T, y: -T, w: 3 * T, h: 1.3 * T, run: (api) => api.warp(api.flag("fallen") ? "crater" : "river", "south") },
  ],
  objects: [
    // 鋳物工場ののこぎり屋根は、北の道まで立ち上がっている。道を歩くきーより手前に描く(fg_alley。docs/assets/suzuki/fg_suzuki.py)
    // 2026-10-03、作者「背景がおかしい」
    kFg("fg_alley", 478, 258, 200, 76, 440),
    sSpot("shopDoor", 19.25 * T, 7.15 * T, (api) => api.warp("shop", "door")),
    // 印刷屋は無人。伝票を差しこむと、印刷機がひとりでに荷札を刷る(D75)
    sSpot("printer", 8.5 * T, 7.15 * T, (api) => {
      if (api.hasItem("荷札") || !api.hasItem("伝票") || sPrinting) return api.mutter("……", 1200); // 仮
      // 刷っているあいだにもう一度調べても、2 枚目は刷らない(2026-10-03、作者「荷札が2回でる」)
      sPrinting = true;
      api.bubble("printer", "ガシャン ガシャン", 1400); // 仮
      api.later(1500, () => {
        sPrinting = false;
        if (api.hasItem("荷札")) return;
        api.giveItem("荷札");
        api.show("v_nifuda");
      });
    }),
  ],
});

// C 鈴木商店の中(外より広い)。店番は鉄瓶(絵は仮、D70)。しゃべらず、怒ると湯気がふき出す
const S_SHOP = sMap("shop", 16, 12, {
  drawOverlay: sNight(16, 12),
  bg: "#3a3230",
  spawns: { door: { x: 8 * T, y: 10.5 * T, facing: "north" } },
  triggers: [{ id: "out", x: 7 * T, y: 11.7 * T, w: 2 * T, h: T, warp: { map: "alley", spawn: "shop" } }],
  // 机の前の脚のあたりまで(机の足もと)は通れない(2026-10-03、作者「重ね合わせみてね」)
  objects: [
    kWall(160, 224, 356, 250),
    {
      id: "tetsubin",
      w: 44,
      h: 44,
      x: 8 * T,
      y: 5.9 * T,
      sortDy: 12,
      iy: 48, // 調べる場所は机の手前
      headY: 36,
      range: 56,
      interact(api) {
        if (api.flag("charred")) {
          // 真っ黒にこげたきーに、お湯を注ぐ → クリーム色にもどる
          api.bubble("tetsubin", "シューッ！", 1400); // 仮
          this._pourT0 = performance.now() / 1000;
          api.later(1500, () => api.setFlag("charred", false));
          return;
        }
        api.bubble("tetsubin", api.flag("fallen") ? "……" : "シューッ！", 1400); // 仮
        this._puff = 2;
      },
      // 怒っているあいだ、口から湯気(流れ星のあとは止む)
      draw(ctx, sx, sy, t, api) {
        // お湯を注ぐときは、鉄瓶がきーのほうへ傾き(0.3 秒)、注ぎ口からお湯が出て、注ぎ終わると戻る(2026-10-03、作者)
        const pe = this._pourT0 ? performance.now() / 1000 - this._pourT0 : 99;
        const pl0 = api.player();
        const side = pl0.x >= this.x ? 1 : -1; // 注ぎ口はきーのほう
        const tilt = pe < 1.9 ? side * 0.7 * Math.min(1, pe / 0.3, (1.9 - pe) / 0.3) : 0;
        const im = api.image("tetsubin");
        if (im) {
          ctx.save();
          ctx.translate(sx, sy + 14); // 底のまわりで傾ける
          ctx.rotate(tilt);
          if (side > 0) ctx.scale(-1, 1); // 絵の注ぎ口は左。きーが右なら左右を返す
          ctx.drawImage(im, -22, -44, 44, 44); // 44 ドットの絵。底は 41 段目(きーと同じくらいの大きさ。2026-10-03、作者)
          ctx.restore();
        }
        if (pe < 1.5) {
          const pl = api.player();
          const tx = sx + (pl.x - this.x);
          const ty = sy + (pl.y - this.y) - 30;
          // 注ぎ口(傾いた鉄瓶の口の先)
          const ca = Math.cos(tilt);
          const sa = Math.sin(tilt);
          const lx = 18 * side; // 注ぎ口の先(絵の (4, 19))
          const ly = -25;
          const x0 = sx + lx * ca - ly * sa;
          const y0 = sy + 14 + lx * sa + ly * ca;
          // お湯は注ぎ口から前へ少し出て、そのまま下へ落ちる(上へ弧を描いて鉄瓶の上を越えない。2026-10-03、作者「湯口から反対にでるのはおかしい」)。
          // 落ちる先は、きーの頭の高さ。横は注ぎ口の前(きーが真下にいても、お湯は注ぎ口の側に落ちる)
          const lx1 = x0 + side * 4;
          const hx = side * (tx - lx1) > 0 ? tx : lx1; // きーが注ぎ口より前にいれば、きーのほうへ。そうでなければ注ぎ口からほぼまっすぐ下へ(お湯が戻ってこない)
          ctx.fillStyle = "rgba(220, 240, 255, 1)";
          for (let k = 0; k < 18; k++) {
            const u = ((pe * 1.6 + k / 14) % 1);
            const x = x0 + (hx - x0) * u;
            const y = y0 + (ty - y0) * u * u;
            ctx.fillRect(Math.round(x), Math.round(y), 3, 4);
          }
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          for (let k = 0; k < 6; k++) {
            const u = (pe * 0.8 + k / 6) % 1;
            ctx.fillRect(Math.round(hx - 10 + k * 4), Math.round(ty - 4 - u * 24), 4, 4);
          }
        }
        if (api.flag("fallen")) return;
        // 湯気も注ぎ口から(注ぎ口はきーのほうを向く)
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        const n = this._puff ? 6 : 3;
        for (let k = 0; k < n; k++) {
          const u = (t * 0.7 + k / n) % 1;
          const s = 2 + Math.floor(u * 3);
          ctx.fillRect(Math.round(sx + side * (18 + u * 8)) - (side < 0 ? s : 0), Math.round(sy - 12 - u * 22), s, s);
        }
      },
    },
    // カウンターの紙: 流れ星の前は伝票、あとは納品書(宛先がにじんで読めない)
    sSpot(
      "counter",
      6.1 * T,
      6.4 * T,
      (api) => {
        if (api.flag("fallen")) {
          if (api.hasItem("納品書")) return;
          api.giveItem("納品書");
          api.clear();
          api.show("v_nouhin");
        } else if (!api.hasItem("伝票")) {
          api.giveItem("伝票");
          api.show("v_denpyo");
        }
      },
      { canInteract: (api) => (api.flag("fallen") ? !api.hasItem("納品書") : !api.hasItem("伝票")), range: 50, iy: 45 } // 調べる場所は机の手前
    ),
  ],
});

// D 土手と河川敷。単結晶は、両端が狭まった透明な円柱(作者)。両端に穴が空いている
// 荷札を持って穴を調べると、荷札を結んで中へ入る → 一枚絵 → 上昇(成層圏、熱圏)→ 衛星軌道
// 筒の中の絵を閉じると、暗転せずに、絵の上から上昇の場面へじかに重ねる(D91。前のマップを見せない)
const sEnter = (api) => {
  api.setFlag("launched");
  api.show("v_inside", null, { full: true, into: { map: "rise", spawn: "view" } });
};
const sHole = (id, x) =>
  sSpot(id, x, 5.6 * T, sEnter, { range: 50, canInteract: (api) => api.hasItem("荷札") && !api.flag("launched") });
const S_RIVER = sMap("river", 28, 14, {
  spawns: { south: { x: 13.5 * T, y: 13.3 * T, facing: "north" } },
  triggers: [{ id: "toAlley", x: 12 * T, y: 13.75 * T, w: 3 * T, h: T, warp: { map: "alley", spawn: "north" } }],
  objects: [
    sHole("holeW", 2.4 * T),
    sHole("holeE", 25.6 * T),
    // 木の輪は、足もとの y できーと前後(下をくぐれる)。根もとはふさぐ。切り出しは docs/assets/suzuki/fg_suzuki.py
    kFg("fg_river", 706, 218, 194, 80, 292),
    kWall(708, 284, 722, 294),
    kWall(882, 284, 898, 294),
  ],
});
// 上昇: 外から見る。単結晶は画面のまんなかに止まり、背景(荒川の町 → 夕焼けの雲 → 成層圏 → 熱圏 → 宇宙)が下へ流れる。
// 手前の雲は空より速く流れる。はじめゆっくり、だんだん速く。軌道に出たら、筒の中の絵をもう一度見せる(作者)
const RISE_DUR = 9;
let riseT0 = 0;
const S_RISE = {
  tile: T,
  bg: "#04060f",
  hidePlayer: true,
  map: Array(10).fill(".".repeat(15)),
  legend: K_LEGEND,
  drawGround(ctx, ox, oy, img) {
    const get = (k) => (typeof img === "function" ? img(k) : null);
    const t = Math.max(0, Math.min(RISE_DUR, performance.now() / 1000 - riseT0));
    const p = Math.pow(t / RISE_DUR, 1.7);
    const sky = get("rise_sky");
    const VWm = 15 * T;
    const VHm = 10 * T;
    if (!sky) return;
    const pos = (sky.height - VHm) * (1 - p);
    ctx.drawImage(sky, 0, Math.round(pos), VWm, VHm, ox, oy, VWm, VHm);
    // 手前の雲(空の雲の帯の高さを、1.5 倍の速さで通り過ぎる)
    const cl = get("rise_cloud");
    if (cl) {
      for (const [band, dx] of [[1360, 0], [1720, -170], [1900, 120]]) {
        const y = (band - pos) * 1.5 - VHm * 0.25;
        if (y > -cl.height && y < VHm) for (let x = dx - cl.width; x < VWm; x += cl.width) ctx.drawImage(cl, Math.round(x + ox), Math.round(y + oy));
      }
    }
    // 宇宙に出ると、下に地球のふちがせり上がる
    const ea = get("rise_earth");
    if (ea && p > 0.82) ctx.drawImage(ea, ox, Math.round(oy + VHm - ea.height * Math.min(1, (p - 0.82) / 0.18)));
    // 単結晶(透明な筒)と、中のきー。小さくゆれる
    const tube = get("rise_tube");
    const shake = Math.round(Math.sin(t * 23) * (1 + 1.5 * p));
    const cx = VWm / 2 + ox + shake;
    const cy = VHm / 2 + oy;
    const ki = get("ki");
    if (ki) ctx.drawImage(ki, 0, 2 * 64, 64, 64, Math.round(cx - 32), Math.round(cy - 26), 64, 64);
    if (tube) ctx.drawImage(tube, Math.round(cx - tube.width / 2), Math.round(cy - tube.height / 2));
  },
  spawns: { view: { x: 7 * T, y: 5 * T, facing: "east" } },
  onEnter(api) {
    // 筒の中の絵が薄くなりきってから(0.8 秒)、上がりはじめる
    riseT0 = performance.now() / 1000 + 0.8;
    api.later(RISE_DUR * 1000 + 1200, () => api.show("v_rise3", null, { full: true, into: { map: "orbit", spawn: "west" } }));
  },
  triggers: [],
  objects: [],
};
// 衛星軌道: 単結晶の中。透明な床を歩いて、右の端の穴から外へ出ると、宇宙をただよって落ち、流れ星になる
// 右の穴から出ると、暗転せずに宇宙へ(船殻を見せ直さない。テンポを切らない)。左の穴からは出られない(流れ星の右下がりに合わせる)
const sOut = (api) => {
  if (api.flag("fallen") || !api.flag("launched")) return;
  api.cut("space", "view");
};
// 宇宙を遊泳するきー。右の穴から出たときの画面(衛星軌道のマップの右端)とまったく同じ絵から始め、
// 船殻は左上へ遠ざかって小さくなり、きーは右へただよいながら、引力に引かれてじわじわ右下へ落ちていく。最後は赤く光って流れ星の絵へ
const SPACE_DUR = 9;
let spaceT0 = 0;
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const S_SPACE = {
  tile: T,
  bg: "#04060f",
  hidePlayer: true,
  map: Array(10).fill(".".repeat(15)),
  legend: K_LEGEND,
  drawGround(ctx, ox, oy, img) {
    const get = (k) => (typeof img === "function" ? img(k) : null);
    const t = Math.min(SPACE_DUR, performance.now() / 1000 - spaceT0);
    const VWm = 15 * T;
    const VHm = 300; // 画面の高さ(ドット)
    const CX = 28 * T - VWm; // 衛星軌道のマップの右端で、カメラが見ていた範囲
    const CY = 10 * T - VHm;
    const orb = get("bg_orbit");
    const sky = get("rise_sky");
    // 星空(ゆっくり上へ流れる = きーが落ちていく)
    const fall = ease((t - 2) / (SPACE_DUR - 2));
    if (sky) ctx.drawImage(sky, 0, Math.round(40 * fall), VWm, VHm, ox, oy, VWm, VHm);
    // カメラはきーを追って右へ動く(船殻と地球は左へ流れる)。きーは右下へ落ちていく
    const pan = 240 * ease((t - 0.8) / 5);
    // 地球: はじめは衛星軌道のマップの地球と同じ場所。落ちるにつれて大きく、上へ(遠いので、流れはゆっくり)
    if (orb) {
      const sx0 = CX, sy0 = 252, sw = VWm, sh = 10 * T - 252;
      const k = 1 + 1.4 * fall;
      const w = sw * k, h = sh * k;
      const ex = ox + (VWm - w) / 2 - pan * 0.35;
      const ey = oy + (sy0 - CY) - 120 * fall;
      ctx.fillStyle = "#2a5a9e"; // 地球の下の海(大きくなっても下が抜けないように)
      ctx.fillRect(Math.round(ex), Math.round(ey + h - 2), Math.round(w), VHm);
      ctx.drawImage(orb, sx0, sy0, sw, sh, Math.round(ex), Math.round(ey), Math.round(w), Math.round(h));
    }
    // 船殻: はじめは衛星軌道のマップと同じ大きさ・位置。左上へ遠ざかって小さくなり、消える
    const tube = get("rise_tube");
    const lv = ease(t / 3.2);
    if (tube && lv < 1) {
      const sc = 2 * (1 - 0.8 * lv); // rise_tube は半分の大きさなので 2 倍から
      const hx = ox + (27 * T - CX) - pan, hy = oy + (5 * T - CY); // 右の穴の位置
      const px = hx - 120 * lv, py = hy - 90 * lv;
      ctx.globalAlpha = 1 - ease((t - 2) / 1.4);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tube, Math.round(px - tube.width * sc + 6 * sc), Math.round(py - (tube.height * sc) / 2), Math.round(tube.width * sc), Math.round(tube.height * sc));
      ctx.globalAlpha = 1;
    }
    // 最初の一瞬は、衛星軌道のマップの絵そのものを重ねて、つなぎ目をなくす
    if (orb && t < 0.7) {
      ctx.globalAlpha = 1 - t / 0.7;
      ctx.drawImage(orb, CX, CY, VWm, VHm, ox, oy, VWm, VHm);
      ctx.globalAlpha = 1;
    }
    // きー: 穴を出たところから、右へただよい、だんだん右下へ落ちる
    const ki = get("ki");
    const x0 = ox + (26.8 * T - CX), y0 = oy + (6 * T - CY);
    const drift = ease(t / 3);
    const kx = x0 + 50 * drift + 110 * fall - pan + Math.sin(t * 1.1) * 4 * drift; // 右下がり(カメラが追う)
    const ky = y0 + 6 * drift + 90 * fall + Math.sin(t * 0.8) * 3 * drift;
    const glow = ease((t - (SPACE_DUR - 2.6)) / 2.2);
    if (glow > 0) {
      const gr = ctx.createRadialGradient(kx, ky - 8, 2, kx, ky - 8, 26 + 30 * glow);
      gr.addColorStop(0, `rgba(255, 240, 200, ${0.9 * glow})`);
      gr.addColorStop(0.4, `rgba(255, 140, 60, ${0.6 * glow})`);
      gr.addColorStop(1, "rgba(255, 80, 30, 0)");
      ctx.fillStyle = gr;
      ctx.fillRect(kx - 70, ky - 78, 140, 140);
    }
    if (ki) {
      ctx.save();
      ctx.translate(Math.round(kx), Math.round(ky - 8));
      ctx.rotate(0.9 * Math.max(0, t - 1.5) * (0.4 + 0.6 * fall)); // 穴を出てしばらくしてから、ゆっくり回りはじめる
      const walk = t < 0.6 ? 1 + (Math.floor(t * 10) % 6) : 0; // 出た瞬間は歩いている
      ctx.drawImage(ki, walk * 64, 2 * 64, 64, 64, -32, -64 + 17 + 8, 64, 64);
      ctx.restore();
    }
  },
  spawns: { view: { x: 7 * T, y: 4 * T, facing: "south" } }, // カメラが画面のいちばん上(oy = 0)に来る位置
  onEnter(api) {
    spaceT0 = performance.now() / 1000;
    // 流れ星 → 爆発(D91): ボタンを待たない。流れ星の絵から、流れ星の頭へ寄る絵を、だんだん短く切りかえる(1.3 → 0.6 → 0.3 → 0.15 秒)
    // → 白く光った裏で、夜の河川敷のクレーターへ(暗転しない)
    const HX = 212; // 流れ星の頭(v_fall の中のドット)
    const HY = 91;
    api.later(SPACE_DUR * 1000, () =>
      api.burst(
        [
          { img: "v_fall", sec: 1.6, z0: 1, z1: 1.12, cx: 160, cy: 96, fadeIn: 0.3 },
          { img: "v_fall", sec: 0.6, z0: 1.7, z1: 1.9, cx: HX + 4, cy: HY + 3 },
          { img: "v_fall", sec: 0.3, z0: 2.8, z1: 3.1, cx: HX + 4, cy: HY + 3 },
          { img: "v_fall", sec: 0.15, z0: 4.5, z1: 5, cx: HX + 3, cy: HY + 2 },
          { white: true, sec: 0.08 },
        ],
        () => {
          api.setFlag("fallen");
          api.setFlag("charred"); // 着地のあと、きーは真っ黒
          api.setFlag("landing");
          api.cut("crater", "center");
        }
      )
    );
  },
  triggers: [],
  objects: [],
};
const S_ORBIT = sMap("orbit", 28, 10, {
  bg: "#060814",
  spawns: { west: { x: 3 * T, y: 6 * T, facing: "east" } },
  triggers: [
    { id: "outE", x: 26.8 * T, y: 5 * T, w: 2.2 * T, h: 2 * T, run: sOut },
  ],
  objects: [],
});
// 夜の河川敷。単結晶が寝ていた所が、クレーターになっている。きーは、その真ん中にいる
// 着地の爆発: 白い光、飛び散る土、広がる煙の輪(1.6 秒)
let boomT0 = -1;
const S_EMBER = { x: 18.6 * T, y: 7.4 * T }; // 残り火と、その上に倒れた荷車
const S_CRATER = sMap("crater", 28, 14, {
  bg: "#101830",
  onEnter(api) {
    if (api.flag("landing")) {
      // 白が引くと、もう火の玉が上がっている。画面がゆれ、煙が晴れるまで、きーは動かない(D91)
      api.setFlag("landing", false);
      boomT0 = performance.now() / 1000;
      api.shake(0.7, 7);
      api.freeze(1.9);
    }
  },
  drawOverlay(ctx, ox, oy) {
    if (boomT0 < 0) return;
    const e = performance.now() / 1000 - boomT0;
    if (e < 0 || e > 2.2) return;
    const cx = ox + 14 * T;
    const cy = oy + 5.8 * T;
    // 白い光(一瞬)
    if (e < 0.35) {
      ctx.fillStyle = `rgba(255, 250, 230, ${1 - e / 0.35})`;
      ctx.fillRect(ox - 20 * T, oy - 20 * T, 70 * T, 60 * T);
    }
    // 火の玉
    const a = Math.max(0, 1 - e / 1.6);
    const r = 30 + 120 * Math.min(1, e / 0.5);
    const gr = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    gr.addColorStop(0, `rgba(255, 250, 210, ${a})`);
    gr.addColorStop(0.3, `rgba(255, 170, 60, ${0.9 * a})`);
    gr.addColorStop(0.7, `rgba(200, 70, 30, ${0.6 * a})`);
    gr.addColorStop(1, "rgba(120, 40, 20, 0)");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // 衝撃の輪(地面を走る)
    const rr = 40 + 420 * e;
    ctx.strokeStyle = `rgba(255, 230, 190, ${Math.max(0, 0.8 - e / 1.2)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, rr, rr * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    // 立ちのぼる煙
    for (let k = 0; k < 7; k++) {
      const sx = cx + (k - 3) * 22;
      const sy = cy - 20 - 70 * e - (k % 2) * 10;
      const sr = 14 + 30 * e;
      ctx.fillStyle = `rgba(70, 60, 64, ${Math.max(0, 0.55 - e / 4)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    // 飛び散る土くれ
    ctx.fillStyle = `rgba(80, 56, 38, ${Math.min(1, 2 - e)})`;
    for (let k = 0; k < 40; k++) {
      const ang = (k / 40) * Math.PI * 2 + k * 0.7;
      const sp = 120 + ((k * 37) % 110);
      const x = cx + Math.cos(ang) * sp * e;
      const y = cy + Math.sin(ang) * sp * 0.5 * e - 180 * e + 220 * e * e;
      ctx.fillRect(Math.round(x), Math.round(y), 4, 4);
    }
  },
  spawns: {
    center: { x: 14 * T, y: 5.8 * T, facing: "south" },
    south: { x: 13.5 * T, y: 13.3 * T, facing: "north" },
  },
  triggers: [{ id: "toAlley", x: 12 * T, y: 13.75 * T, w: 3 * T, h: T, warp: { map: "alley", spawn: "north" } }],
  // 石のアーチと小さな柱は、足もとの y できーと前後(アーチの下はくぐれる)。根もとはふさぐ
  objects: [
    kFg("fg_crater", 704, 218, 194, 100, 313),
    // 倒れた荷車(D201): 着地の爆風で、土手の小屋から飛んできた。下に、大気圏突入の残り火が光っている。押してどけると見届けられる
    {
      id: "niguruma",
      x: S_EMBER.x,
      y: S_EMBER.y,
      w: 64,
      h: 48,
      headY: 30,
      solid: { w: 52, h: 14, dy: -6 },
      push: { area: [2 * T, 3 * T, 26 * T, 11.2 * T] },
      update(dt, t, api) {
        if (api.flag("cartOff") && !this._moved) {
          this._moved = true;
          this.x = S_EMBER.x + 2 * T;
        }
      },
      draw(ctx, sx, sy, t, api) {
        if (!api.flag("cartOff")) {
          // 荷車のすきまから、もれる光
          kGlowAt(ctx, sx - (this.x - S_EMBER.x), sy - 6 - (this.y - S_EMBER.y), 26 + Math.sin(t * 4) * 3, "255, 150, 60", 0.55);
        }
        const im = api.image("niguruma");
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height + 6));
      },
      onPush(api) {
        if (!api.flag("cartOff") && Math.hypot(this.x - S_EMBER.x, this.y - S_EMBER.y) > 1.3 * T) {
          api.setFlag("cartOff");
          this._moved = true;
        }
      },
    },
    // 見届け: 大気圏突入の光が消えるまで見ている(D189)
    kWatch({
      id: "w_ember",
      x: S_EMBER.x,
      y: S_EMBER.y,
      r: 2.6 * T,
      sec: 6, lure: "255, 140, 60",
      when: (api) => api.flag("fallen") && api.flag("cartOff"),
      fx(ctx, sx, sy, p, t) {
        kGlowAt(ctx, sx, sy - 0.6 * T, 160 * (1 - p) + 16, "255, 150, 60", (1 - p) * (0.85 + Math.sin(t * 5) * 0.1));
      },
    }),
    kFg("fg_crater", 788, 314, 34, 48, 357),
    kWall(706, 296, 734, 316),
    kWall(868, 296, 896, 316),
    kWall(790, 344, 820, 358),
  ],
});
