// 断片: 宝舟と首振りエンジン(発電所の正門から炉心まで、網小屋)。takarabune.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";


// 手ざわり(D741、todo 319): 調べると、字は出さず、物が音と動きで一度だけ応える。人はもういないが、機械はまだ人を待っている
const tkTz = {};
const tzNow = () => performance.now() / 1000;
const tzAge = (id) => (tkTz[id] == null ? Infinity : tzNow() - tkTz[id]);
const tzCache = {};
// 背景の一部を切り出し、印の点(鎖、針)を左右のいちばん近い点の色でうめた下地(印の所だけ)と、印だけの絵に分ける
const tzCut = (key, img, x0, y0, w, h, isMark) => {
  if (tzCache[key]) return tzCache[key];
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  const a = mk(), m = mk(), f = mk();
  const g = a.getContext("2d");
  g.drawImage(img, x0, y0, w, h, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  const mark = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mark[i] = isMark(d[i * 4], d[i * 4 + 1], d[i * 4 + 2], x0 + (i % w), y0 + ((i / w) | 0)) ? 1 : 0;
  const mi = m.getContext("2d").createImageData(w, h);
  const fi = f.getContext("2d").createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    if (!mark[i]) continue;
    for (let k = 0; k < 4; k++) mi.data[i * 4 + k] = d[i * 4 + k];
    const x = i % w, y = (i / w) | 0;
    let l = x, r = x;
    while (l > 0 && mark[y * w + l]) l--;
    while (r < w - 1 && mark[y * w + r]) r++;
    const pick = mark[y * w + l] ? r : mark[y * w + r] ? l : x - l <= r - x ? l : r;
    const j = (y * w + pick) * 4;
    fi.data[i * 4] = d[j];
    fi.data[i * 4 + 1] = d[j + 1];
    fi.data[i * 4 + 2] = d[j + 2];
    fi.data[i * 4 + 3] = 255;
  }
  m.getContext("2d").putImageData(mi, 0, 0);
  f.getContext("2d").putImageData(fi, 0, 0);
  return (tzCache[key] = { mark: m, fill: f });
};
// 調べなくても動く物(D742): 人がいなくても続いている揺れ。period 秒ごとに dur 秒だけ draw を呼ぶ。調べられない(印も出ない)
const tzAmbient = (id, x, y, period, dur, draw, sortDy) => ({
  id,
  x,
  y,
  w: 1,
  h: 1,
  sortDy: sortDy || 0,
  draw(ctx, sx, sy, t, api) {
    const age = tzNow() % period;
    if (age > dur) return;
    draw(ctx, (X) => sx + X - x, (Y) => sy + Y - y, age, api);
  },
});
// 調べる点(x, y)と、背景の上に描く応え draw(ctx, X, Y, age, api)(X, Y は背景の点を画面に写す)
const tzSpot = (id, x, y, sound, dur, draw, extra) =>
  Object.assign(
    {
      id,
      x,
      y,
      w: 1,
      h: 1,
      range: 44,
      headY: 30,
      interact(api) {
        tkTz[id] = tzNow();
        api.sfx(sound);
        if (extra && extra.onHit) extra.onHit(api);
      },
      draw(ctx, sx, sy, t, api) {
        const age = tzAge(id);
        if (age > dur || !draw) return;
        draw(ctx, (X) => sx + X - x, (Y) => sy + Y - y, age, api);
      },
    },
    extra && extra.props
  );

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
  objects: [
    ...TK_GATE_FG,
    tkWall(352, 0, 378, 180),
    tkWall(378, 0, 404, 200),
    tkWall(432, 0, 455, 192),
    tkWall(455, 0, 480, 175),
    // 調べなくても動く(D742): 門の柱から垂れた鎖が、ときどき風でかすかに揺れる(音なし)
    tzAmbient("tzChain", 440, 236, 7.3, 1.4, (ctx, X, Y, age, api) => {
      const img = api.image("bg_gate");
      if (!img) return;
      const c = tzCut("chain", img, 420, 182, 50, 64, (r, g, b) => !(b > r + 22 && b > 45));
      const k = 1 - age / 1.4;
      const dx = Math.round(Math.sin(age * 9) * 1.4 * k);
      const dy = 0;
      ctx.drawImage(c.fill, Math.round(X(420)), Math.round(Y(182)));
      ctx.drawImage(c.mark, Math.round(X(420)) + dx, Math.round(Y(182)) + dy);
    }, -60), // 地面に垂れているので、きーより先に描く
  ],
});

// B2 構内(todo 152): 正門を北へ抜けると、夜の発電所の敷地。北の管理棟の扉(緑の非常灯)から中へ。南の門のすきまから正門へ
// 網小屋の中(D457、todo 155): 宝舟の港の網小屋。真っ暗で、てらすがないと、きーのまわりしか見えない
// 絵は PixelLab の案を手で直し、大漁旗(PixelLab の絵に手描きの字、赤白の放射。D461、flag_rays.py)を掛けた(docs/assets/takarabune/amigoya/finish.py)。持ち帰るものはない
const TK_AMIGOYA = tkMap("amigoya", 14, 9, {
  spawns: { door: { x: 7 * T, y: 8.1 * T, facing: "north" } },
  dark: 1, // てらすがないと、きーのまわりのほかは何も見えない
  triggers: [{ id: "out", x: 6 * T, y: 8.55 * T, w: 2 * T, h: T, warp: { map: "port", spawn: "net" } }],
  objects: [
    tkWall(14, 96, 108, 210), // 左の網の山(上の丸い所まで。乗れないように)
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
    // 調べなくても動く(D742): 非常灯が、まれにひとりでにじじっと瞬いて消えかけ、また灯る
    const now = tzNow();
    const age = now % 11.3;
    const cyc = Math.floor(now / 11.3);
    if (age < 0.1 && tkTz.exitCyc !== cyc) {
      tkTz.exitCyc = cyc;
      if (window.bogiAudio) window.bogiAudio.sfx("tzBuzzSoft");
    }
    const off = age < 0.55 && [0.04, 0.12, 0.2, 0.34, 0.42].some((q) => age > q && age < q + 0.05 + (q > 0.3 ? 0.04 : 0));
    if (off) {
      ctx.fillStyle = "rgba(14, 34, 24, 0.9)";
      ctx.fillRect(ox + 312, oy + 68, 14, 6);
      return;
    }
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
  objects: [
    // 6 制御盤のブラウン管: 一瞬ついて走査線が流れ、横一本に縮んで、点になって消える
    tzSpot("tzCrt", 331, 176, "tzCrt", 1.3, (ctx, X, Y, age) => {
      const x0 = Math.round(X(314)), y0 = Math.round(Y(130)), w = 35, h = 24;
      ctx.save();
      if (age < 0.06) {
        ctx.fillStyle = "rgba(220, 255, 230, 0.9)";
        ctx.fillRect(x0, y0, w, h);
      } else if (age < 0.95) {
        ctx.fillStyle = `rgba(110, 230, 140, ${0.32 + 0.05 * Math.sin(age * 60)})`;
        ctx.fillRect(x0, y0, w, h);
        ctx.fillStyle = "rgba(200, 255, 210, 0.55)";
        ctx.fillRect(x0, y0 + Math.floor(((age * 1.6) % 1) * h), w, 2);
        ctx.fillStyle = "rgba(20, 60, 30, 0.35)";
        for (let y = 0; y < h; y += 2) ctx.fillRect(x0, y0 + y, w, 1);
      } else if (age < 1.1) {
        const q = (age - 0.95) / 0.15;
        const lw = Math.max(2, Math.round(w * (1 - q)));
        ctx.fillStyle = "rgba(230, 255, 235, 0.95)";
        ctx.fillRect(x0 + Math.round((w - lw) / 2), y0 + 11, lw, 1);
      } else {
        ctx.fillStyle = `rgba(230, 255, 235, ${1 - (age - 1.1) / 0.2})`;
        ctx.fillRect(x0 + 17, y0 + 11, 1, 1);
      }
      ctx.restore();
    }),
    // 7 大きな計器: 針がぐっと振れて、ゆれながら元に戻る
    tzSpot("tzGauge", 293, 176, "tzNeedle", 1.8, (ctx, X, Y, age, api) => {
      const img = api.image("bg_admin");
      if (!img) return;
      const cx = 293.5, cy = 79;
      const c = tzCut("gauge", img, 281, 67, 26, 25, (r, g, b, x, y) => r < 70 && g < 90 && Math.hypot(x - cx, y - cy) < 9);
      ctx.drawImage(c.fill, Math.round(X(281)), Math.round(Y(67)));
      const sw = age < 0.22 ? 1.5 * (age / 0.22) : 1.5 * Math.exp(-(age - 0.22) * 2.6) * Math.cos((age - 0.22) * 9);
      const a = -2.35 + sw; // 元の針は左上を向く
      ctx.fillStyle = "rgb(33, 53, 44)";
      for (let r = 0; r <= 8; r++) ctx.fillRect(Math.round(X(cx + Math.cos(a) * r)), Math.round(Y(cy + Math.sin(a) * r)), 1, 1);
    }),
  ],
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
    // 調べなくても動く(D742): 天井からのしずくが、水たまりに間をあけて落ち、波紋が広がる(地面の上なので、きーより先に描く)
    tzAmbient(
      "tzDrip",
      345,
      300,
      3.7,
      1.3,
      (ctx, X, Y, age) => {
        const q = age / 1.3;
        const rx = 1 + q * 9, ry = rx * 0.45;
        ctx.save();
        ctx.strokeStyle = `rgba(150, 170, 190, ${0.55 * (1 - q)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(Math.round(X(345)) + 0.5, Math.round(Y(300)) + 0.5, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (q > 0.3) {
          const r2 = (q - 0.3) * 9;
          ctx.strokeStyle = `rgba(150, 170, 190, ${0.4 * (1 - q)})`;
          ctx.beginPath();
          ctx.ellipse(Math.round(X(345)) + 0.5, Math.round(Y(300)) + 0.5, r2, r2 * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      },
      -120
    ),
    // 13 タービンの胴: ごうん、と一度だけ低くうなって、胴が身ぶるいし、建屋がかすかにゆれる
    tzSpot(
      "tzTurbine",
      330,
      268,
      "tzTurbine",
      1.2,
      (ctx, X, Y, age, api) => {
        const img = api.image("bg_turbine");
        if (!img) return;
        const k = Math.max(0, 1 - age / 1.2);
        const dx = Math.round(Math.sin(age * 55) * 1.4 * k);
        if (!dx) return;
        ctx.drawImage(img, 92, 108, 480, 156, Math.round(X(92)) + dx, Math.round(Y(108)), 480, 156);
      },
      { onHit: (api) => api.shake(0.9, 2.5) }
    ),
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
