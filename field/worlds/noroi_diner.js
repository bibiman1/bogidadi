// 断片: 呪いの野犬(2/4)。B ドライブイン跡と C ダイナーの中。共通の部品と A 峠は noroi.js
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、nS、nMap など)をそのまま使う
"use strict";

// B ドライブイン跡(野犬のたまり場)。ダイナーの戸(北の建物の真ん中)から中へ入れる。みとんの車箪笥は駐車場の東(家なので)
// みとんに話しかけると、車箪笥の引き出しからぼぎカーが出て、炎を塗ってくれる(一枚絵 v_custom、仮)。そのあと野犬たちは直線へ
// 車箪笥とみとんは、カスタムの場面のあともドライブイン跡に残り、きーがストリップへ行ったらストリップだけにいる
// (ドライブイン跡とストリップの両方にいて、別の個体に見えないように。作者「ダイナーの前のミトンと車箪笥はずっといると、コースにいる個体と別にみえないか」)
const nMovedToStrip = (api) => api.flag("custom") && api.flag("stripSeen");

// ---- 戻ってきたぴー 三つ目(D736、D737、D739): クイズのあとに来ると、ぴーが古タイヤをマシンにして、北の車線を往復している ----
// ぴーは自分のマシンがほしいが持っていない。給油機のわきの古タイヤの山(2 本)から 1 本。行きは中に入って転がり、帰りは上に乗る。
// 端では遅くなって傾き、傾いた側へ曲がり、首振りが速くなってぱたりと寝て(オイラーのディスク)、少し弾んで止まる。穴からひょっこり出て、体で起こす。
// タイヤは 3 次元の輪(外 26、穴 13、幅 14、見下ろし約 30 度)を毎こま 1 倍の小さな画面に描き、ふちを切り立ててふちどる。きーは無視(調べる物はない)。
// 試し絵 docs/record/2026-11-14/noroi_pi/trial3.py(同じ数)
const NPT = { RO: 26, RI: 13, WD: 14, FY: 0.5, FZ: 0.87, Y0: 206, XW: 300, LX: 400, DT: 1 / 60, CX: 56, CY: 76 };
const nptShown = (api) => api.cleared("keiji") && api.cleared("noroi");
const nptBasis = (beta, phi) => {
  const u = [Math.cos(phi), Math.sin(phi), 0];
  const n0 = [-Math.sin(phi), Math.cos(phi), 0];
  const v = [n0[0] * Math.sin(beta), n0[1] * Math.sin(beta), Math.cos(beta)]; // 輪の「上」(n0 の側へ傾く)
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  return { u, v, n };
};
const nptPlan = (() => {
  const { DT, RO, XW, LX, Y0 } = NPT;
  const segs = [];
  const push = (name, pm, arr) => segs.push({ name, pm, arr });
  const hold = (st, sec) => Array.from({ length: Math.round(sec / DT) }, () => Object.assign({}, st));
  // 押されて転がり、遅くなると傾いて、傾いた側へ曲がる
  const roll = (st, phi0) => {
    const n = Math.round(7.0 / DT);
    const vs = [];
    for (let i = 0; i < n; i++) {
      const u = i / n;
      vs.push(u < 0.12 ? u / 0.12 : u < 0.55 ? 1 : Math.max(0.12, 1 - (u - 0.55) / 0.45));
    }
    const scale = LX / (vs.reduce((a, b) => a + b, 0) * DT);
    let phi = phi0, alpha = 0, x = st.X, y = st.Y;
    const out = [];
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const ds = vs[i] * scale * DT;
      const beta = u < 0.6 ? 0 : (24 * Math.PI / 180) * ((u - 0.6) / 0.4) ** 2;
      phi += 0.07 * Math.sin(beta) * ds;
      x += Math.cos(phi) * ds;
      y += Math.sin(phi) * ds;
      alpha += ds / RO;
      out.push({ X: x, Y: y, beta, phi, alpha });
    }
    return out;
  };
  // 傾きが深くなるほど首振りが速くなり、ぱたりと寝て、少し弾んで、ふるえて止まる
  const wobble = (st) => {
    const out = [];
    let phi = st.phi, alpha = st.alpha;
    const n = Math.round(1.6 / DT);
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const w = 3.0 + 26.0 * u ** 2.2;
      phi += w * DT;
      alpha += w * DT * 0.35;
      out.push({ X: st.X, Y: st.Y, beta: Math.min(Math.PI / 2, st.beta + (Math.PI / 2 - st.beta) * u ** 1.7), phi, alpha });
    }
    const m = Math.round(0.45 / DT);
    for (let i = 0; i < m; i++) {
      const u = i / m;
      out.push({ X: st.X, Y: st.Y, beta: Math.PI / 2 - 0.03 * Math.sin(u * 40) * (1 - u), phi, alpha, zb: 3 * Math.abs(Math.sin(u * Math.PI * 2.2)) * (1 - u) ** 1.5 });
    }
    return out;
  };
  const standup = (st, phiTo) =>
    Array.from({ length: Math.round(0.6 / DT) }, (_, i) => {
      const u = i / Math.round(0.6 / DT);
      return { X: st.X, Y: st.Y, beta: (Math.PI / 2) * (1 - u * u * (3 - 2 * u)), phi: phiTo, alpha: st.alpha };
    });
  const last = (arr) => { const s = Object.assign({}, arr[arr.length - 1]); delete s.zb; return s; };
  let st = { X: XW, Y: Y0, beta: 0, phi: 0, alpha: 0 };
  push("enter", "enter", hold(st, 0.8));
  const r = roll(st, 0);
  push("rollE", "in", r);
  const w = wobble(r[r.length - 1]);
  push("fallE", "in", w);
  st = last(w);
  push("still", null, hold(st, 0.5));
  push("pop", "pop", hold(st, 0.7));
  push("look", "look", hold(st, 0.8));
  push("hopside", "hopside+", hold(st, 0.4));
  const up = standup(st, Math.PI);
  push("push", "push+", up);
  st = Object.assign(last(up), { beta: 0 });
  push("hopon", "hopon+", hold(st, 0.5));
  const r2 = roll(st, Math.PI);
  push("rollW", "on", r2);
  const w2 = wobble(r2[r2.length - 1]);
  push("fallW", "onfall", w2);
  st = last(w2);
  push("still", null, hold(st, 0.4));
  push("pop", "pop", hold(st, 0.5));
  push("hopside", "hopside-", hold(st, 0.4));
  push("push", "push-", standup(st, 0));
  let t = 0;
  for (const s of segs) (s.t = t), (t += s.arr.length * DT);
  segs.cycle = t;
  return segs;
})();
const npt = { t0: 0, can: null, stack: null };
const nptState = () => {
  const P = nptPlan;
  const tc = (((nNow() - npt.t0) % P.cycle) + P.cycle) % P.cycle;
  let s = P[P.length - 1];
  for (const q of P) if (tc >= q.t && tc < q.t + q.arr.length * NPT.DT) s = q;
  const i = Math.min(s.arr.length - 1, Math.floor((tc - s.t) / NPT.DT));
  return { name: s.name, pm: s.pm, st: s.arr[i], k: i / s.arr.length };
};
// タイヤを 1 倍の小さな画面に描く。地面の点(X, Y)が (CX, CY)。inner(g, hx, hy) は穴の中に描く物(穴の形で切る)
const nptRender = (g, st, inner) => {
  const { RO, RI, WD, FY, FZ, CX, CY } = NPT;
  const { u, v, n } = nptBasis(st.beta, st.phi);
  const zc = RO * Math.cos(st.beta) + (WD / 2) * Math.sin(st.beta) + (st.zb || 0);
  const N = 36;
  const ring = (r, side) => {
    const pts = [];
    for (let k = 0; k < N; k++) {
      const a = (2 * Math.PI * k) / N;
      const p = [0, 1, 2].map((j) => r * (Math.cos(a) * u[j] + Math.sin(a) * v[j]) + side * (WD / 2) * n[j]);
      pts.push([CX + p[0], CY + p[1] * FY - (p[2] + zc) * FZ]);
    }
    return pts;
  };
  const near = FZ * n[1] + FY * n[2] >= 0 ? 1 : -1;
  const facing = (k, sgn) => {
    const a = (2 * Math.PI * (k + 0.5)) / N;
    return sgn * ((Math.cos(a) * u[1] + Math.sin(a) * v[1]) * FZ + (Math.cos(a) * u[2] + Math.sin(a) * v[2]) * FY) > 0;
  };
  const poly = (pts, fill) => {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  };
  const oN = ring(RO, near), oF = ring(RO, -near), iN = ring(RI, near), iF = ring(RI, -near);
  g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  for (let k = 0; k < N; k++) {
    const k1 = (k + 1) % N;
    if (facing(k, -1)) poly([iN[k], iN[k1], iF[k1], iF[k]], k % 2 ? "#201e20" : "#1c1a1c"); // 穴の内がわ
  }
  const groove = Math.floor((st.alpha / (2 * Math.PI)) * N);
  for (let k = 0; k < N; k++) {
    const k1 = (k + 1) % N;
    if (facing(k, 1)) poly([oN[k], oN[k1], oF[k1], oF[k]], (((k + groove) % 3) + 3) % 3 === 0 ? "#181618" : "#222022"); // 踏み面と溝
  }
  const hx = iN.reduce((a, p) => a + p[0], 0) / N;
  const hy = iN.reduce((a, p) => a + p[1], 0) / N;
  if (inner) {
    g.save();
    g.beginPath();
    iN.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.closePath();
    g.clip();
    inner(g, hx, hy);
    g.restore();
  }
  // 手前の横の面(輪)
  g.beginPath();
  oN.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  g.closePath();
  iN.slice().reverse().forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  g.closePath();
  g.fillStyle = "#2e2c2e";
  g.fill("evenodd");
  g.lineWidth = 1;
  for (const [r, col] of [[RO - 3, "#403e3e"], [RI + 3, "#3a3838"]]) {
    const pts = ring(r, near);
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    g.closePath();
    g.strokeStyle = col;
    g.stroke();
  }
  g.fillStyle = "#8c7a60"; // 砂ぼこり
  for (const a0 of [0.4, 1.9, 3.3, 4.6, 5.5]) {
    const a = a0 + st.alpha * near;
    const r = (RO + RI) / 2;
    const p = [0, 1, 2].map((j) => r * (Math.cos(a) * u[j] + Math.sin(a) * v[j]) + near * (WD / 2) * n[j]);
    g.fillRect(Math.round(CX + p[0]), Math.round(CY + p[1] * FY - (p[2] + zc) * FZ), 1, 1);
  }
  // ふちを切り立てて(半透明をなくし)、外がわを 1 ドットふちどる
  const W = g.canvas.width, H = g.canvas.height;
  const im = g.getImageData(0, 0, W, H);
  const d = im.data;
  const on = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    if (d[i * 4 + 3] >= 128) (on[i] = 1), (d[i * 4 + 3] = 255);
    else d[i * 4 + 3] = 0;
  }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (on[i]) continue;
      if ((x > 0 && on[i - 1]) || (x < W - 1 && on[i + 1]) || (y > 0 && on[i - W]) || (y < H - 1 && on[i + W])) {
        d[i * 4] = 14, d[i * 4 + 1] = 12, d[i * 4 + 2] = 14, d[i * 4 + 3] = 255;
      }
    }
  g.putImageData(im, 0, 0);
  const top = Math.min(...oN.map((p) => p[1]), ...oF.map((p) => p[1]));
  return { top: top - CY, hx: hx - CX, hy: hy - CY };
};
const nptCanvas = () => {
  const c = document.createElement("canvas");
  c.width = 112;
  c.height = 96;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  return g;
};
const nptPi = (ctx, pi, row, f, x, foot, h) => ctx.drawImage(pi, f * 64, row * 64, 64, h || 64, Math.round(x - 32), Math.round(foot - 47), 64, h || 64);
const nptObj = () => ({
  id: "npt",
  x: NPT.XW,
  y: NPT.Y0,
  w: 1,
  h: 1,
  headY: 26,
  hidden: (api) => !nptShown(api),
  update() {
    const { st } = nptState();
    this.x = st.X;
    this.y = st.Y;
  },
  draw(ctx, sx, sy, t, api) {
    const pi = api.image("pi");
    if (!pi) return;
    if (!npt.can) npt.can = nptCanvas();
    const { pm, st, k } = nptState();
    const ease = (q) => q * q * (3 - 2 * q);
    const inside = pm === "in" && st.beta <= (72 * Math.PI) / 180;
    const enterIn = pm === "enter" && k >= 0.7;
    const inner = inside || enterIn
      ? (g, hx, hy) => {
          g.translate(hx, hy - 3);
          if (inside) g.rotate(st.alpha);
          g.drawImage(pi, 0, 0, 64, 64, -32, -32, 64, 64);
        }
      : null;
    const r = nptRender(npt.can, st, inner);
    ctx.drawImage(npt.can.canvas, Math.round(sx - NPT.CX), Math.round(sy - NPT.CY));
    const top = sy + r.top, hx = sx + r.hx, hy = sy + r.hy;
    const sd = pm && pm.endsWith("+") ? 1 : -1;
    if (pm === "enter" && k < 0.7) {
      const u = k / 0.7;
      nptPi(ctx, pi, 2, Math.floor(t * 10) % 7, sx - 40 + 40 * u, sy - 2 - Math.sin(u * Math.PI) * 30 - 10 * u);
    } else if (pm === "on") {
      const bob = Math.floor(t * 12) % 2;
      nptPi(ctx, pi, 2, Math.floor(t * 16) % 7, sx + (bob ? 1 : -1), top + 4 - bob); // 東を向いて足ぶみ(タイヤは西へ)
    } else if (pm === "onfall") {
      if (k < 0.75) nptPi(ctx, pi, Math.floor(t * 8) % 2 ? 2 : 3, Math.floor(t * 20) % 7, sx + Math.sin(t * 25) * 3, top + 4); // 首振りにあおられる
      else if (k < 0.85) nptPi(ctx, pi, 1, 0, hx, top + 4 + (hy - top) * ((k - 0.75) / 0.1)); // 寝たタイヤの穴へ落ちる
    } else if (pm === "pop" || pm === "look") {
      const vis = pm === "pop" ? ease(Math.min(1, k / 0.7)) : 1;
      const row = pm === "pop" ? 0 : k < 0.45 ? 3 : 2;
      const foot = hy + 4 - (pm === "look" && Math.floor(k * 6) % 2 ? 1 : 0);
      nptPi(ctx, pi, row, 0, hx, foot, Math.min(Math.round(25 + 22 * vis), Math.round(hy + 1 - (foot - 47))));
    } else if (pm && pm.startsWith("hopside")) {
      const u = ease(k);
      nptPi(ctx, pi, sd < 0 ? 3 : 2, 2, hx + sd * 40 * u, (hy + 4) * (1 - u) + (sy - 2) * u - Math.sin(u * Math.PI) * 12);
    } else if (pm && pm.startsWith("push")) {
      const bump = Math.sin(Math.min(1, k * 1.5) * Math.PI) * 5;
      nptPi(ctx, pi, sd > 0 ? 3 : 2, 0, sx + sd * (40 - bump), sy - 2); // 体でぐいっと起こす
    } else if (pm && pm.startsWith("hopon")) {
      const u = ease(k);
      nptPi(ctx, pi, sd < 0 ? 2 : 3, 1, sx + sd * 40 * (1 - u), (sy - 2) * (1 - u) + (top + 4) * u - Math.sin(u * Math.PI) * 18);
    }
  },
});
// 給油機のわきの古タイヤの山(寝たタイヤ 2 本)
const nptStackObj = () => ({
  id: "nptStack",
  x: 257,
  y: 162,
  w: 1,
  h: 1,
  headY: 30,
  solid: { w: 54, h: 14, dy: -6 },
  hidden: (api) => !nptShown(api),
  draw(ctx, sx, sy) {
    if (!npt.stack) {
      const g = nptCanvas();
      const tmp = nptCanvas();
      for (const [i, dx] of [[0, -1], [1, 1]]) {
        nptRender(tmp, { X: 0, Y: 0, beta: Math.PI / 2, phi: 0, alpha: i, zb: i * NPT.WD }, null);
        g.drawImage(tmp.canvas, dx, 0);
      }
      npt.stack = g.canvas;
    }
    ctx.drawImage(npt.stack, Math.round(sx - NPT.CX), Math.round(sy - NPT.CY));
  },
});

const N_DRIVEIN = nMap("drivein", 28, 14, {
  onEnter() {
    npt.t0 = nNow(); // 戻ってきたぴー: 西の端で、タイヤに跳びこむところから
  },
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
    nptStackObj(),
    nptObj(),
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
