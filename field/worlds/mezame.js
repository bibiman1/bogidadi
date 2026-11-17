// 背景に描きこまれた生き物を目覚めさせる 二(todo 327、D755)。新しい物は足さない。PixelLab 0 回。
// 試し絵は docs/record/2026-11-17/ikimono/(ikimono2_trial.js。TRIAL を true にすると間隔が短くなる)
// 1 長門 本栖湖の水鳥 3 羽(bg_kojo2): ふだんは浮いて、ゆっくり上下し、少し流れる。白鳥のボートが近づくと、水をかいてよける
// 2 バナナ 浜のキングペンギン 7 羽(fg_shore2): ふだんは立っている。ときどき首をのばす、体をゆらす、向きを変える。きーが近づくと、近くの一羽がきーのほうを向く
(function () {
  const TRIAL = false;
  const now = () => performance.now() / 1000;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mk = (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h });

  // ---- 1 本栖湖の水鳥 ----
  const WATER = [70, 112, 156];
  const BIRDS = [
    { box: [148, 2, 18, 26], away: [-16, 18] },
    { box: [114, 26, 22, 24], away: [-18, 14] },
    { box: [144, 42, 24, 22], away: [-10, 22] },
  ];
  let kojo = null;
  function kojoCut(bg) {
    if (kojo) return kojo;
    const clean = mk(bg.width, bg.height), g = clean.getContext("2d");
    g.drawImage(bg, 0, 0);
    const birds = BIRDS.map((b) => {
      const [x0, y0, w, h] = b.box;
      const d = g.getImageData(x0, y0, w, h);
      const m = mk(w, h), mi = m.getContext("2d").createImageData(w, h);
      for (let i = 0; i < w * h; i++) {
        const p = d.data.slice(i * 4, i * 4 + 3);
        if (p[0] === WATER[0] && p[1] === WATER[1] && p[2] === WATER[2]) continue;
        for (let k = 0; k < 4; k++) mi.data[i * 4 + k] = d.data[i * 4 + k];
        d.data[i * 4] = WATER[0], d.data[i * 4 + 1] = WATER[1], d.data[i * 4 + 2] = WATER[2];
      }
      m.getContext("2d").putImageData(mi, 0, 0);
      g.putImageData(d, x0, y0);
      return { ...b, m, w, h, dx: 0, dy: 0, ph: Math.random() * 6, fled: 0 };
    });
    const out = mk(bg.width, bg.height);
    return (kojo = { clean, out, birds });
  }
  function kojoFrame(bg, boat) {
    const k = kojoCut(bg), g = k.out.getContext("2d"), t = now();
    g.drawImage(k.clean, 0, 0);
    for (const b of k.birds) {
      const [x0, y0] = b.box;
      const cx = x0 + b.w / 2 + b.dx, cy = y0 + b.h / 2 + b.dy;
      // ボートが近づいたら、水をかいてよける(2 秒ほど)
      if (boat && !b.fled && Math.hypot(boat[0] - cx, boat[1] - cy) < 90) b.fled = t;
      let vx = 0, vy = 0;
      if (b.fled) {
        const u = Math.min(1, (t - b.fled) / 2.2), e = 1 - (1 - u) * (1 - u);
        const nx = b.away[0] * e, ny = b.away[1] * e;
        vx = nx - b.dx, vy = ny - b.dy;
        b.dx = nx, b.dy = ny;
      }
      const bob = Math.sin(t * 1.6 + b.ph) > 0.3 ? 1 : 0; // ゆっくり浮き沈み
      const drift = Math.round(Math.sin(t * 0.25 + b.ph) * 2); // 少し流れる
      const X = Math.round(x0 + b.dx + drift), Y = Math.round(y0 + b.dy + bob);
      // 水をかいているあいだは、うしろに細い V の波
      if (Math.abs(vx) + Math.abs(vy) > 0.05) {
        g.fillStyle = "rgba(200, 222, 242, 0.75)";
        for (let i = 1; i <= 3; i++) {
          const q = (t * 2.5 + i / 3) % 1, s = Math.round(4 + q * 10);
          g.fillRect(X + b.w / 2 + Math.round(q * 6) , Y + b.h - 6 - Math.round(q * 4) - s / 3, 2, 1);
          g.fillRect(X + b.w / 2 + Math.round(q * 6) + s / 2, Y + b.h - 4 + Math.round(q * 2), 2, 1);
        }
      }
      // まわりの小さな波の輪(ときどき)
      const r = (t * 0.7 + b.ph) % 4;
      if (r < 1.2) {
        g.fillStyle = `rgba(112, 146, 188, ${1 - r / 1.2})`;
        const rw = Math.round(b.w * 0.6 + r * 10);
        g.fillRect(Math.round(X + b.w / 2 - rw / 2), Y + b.h - 3, 4, 2);
        g.fillRect(Math.round(X + b.w / 2 + rw / 2 - 4), Y + b.h - 3, 4, 2);
      }
      g.drawImage(b.m, X, Y);
    }
    return k.out;
  }
  {
    const M = window.BOGI_WORLDS.nagato.maps.kojo;
    const g0 = M.drawGround;
    M.drawGround = function (ctx, ox, oy, img, api) {
      const bg = api.image("bg_kojo2");
      if (!bg) return g0.call(M, ctx, ox, oy, img, api);
      let boat = null;
      if (ngRide.phase === "near") boat = ngBoatNear();
      const frame = kojoFrame(bg, boat);
      const api2 = Object.create(api);
      api2.image = (k) => (k === "bg_kojo2" ? frame : api.image(k));
      g0.call(M, ctx, ox, oy, img, api2);
    };
  }

  // ---- 2 浜のキングペンギン ----
  // B_PENGUINS_FG と同じ [絵の x, y, 幅, 高さ, マップの x, y, 根もとの y]。side は横向き(向きを変えられる)
  const PEN = [[0, 0, 26, 45, 645, 157, 201], [26, 0, 28, 46, 674, 161, 207], [54, 0, 26, 49, 702, 172, 216], [80, 0, 52, 57, 595, 176, 216], [132, 0, 26, 41, 590, 188, 228], [158, 0, 49, 39, 663, 207, 245], [207, 0, 26, 43, 643, 216, 257]];
  const PBOX = [];
  const SIDE = [false, false, false, true, true, false, false];
  const FACE = [0, 0, 0, -1, 1, 0, 0]; // 横向きの二羽のもとの向き(-1 は左、1 は右)。二羽は向き合っている
  const pst = PEN.map((p, i) => ({ mode: "still", until: now() + rnd(1, TRIAL ? 4 : 12), t0: 0, flip: false, side: SIDE[i] }));
  let kiPos = null;
  function penDraw(i, ctx, sx, sy, t, api) {
    const [ax, ay, w, h, x0, y0, base] = PEN[i];
    const im = api.image("fg_shore2");
    if (!im) return;
    const s = pst[i], T = now();
    // きーが近づいたら、横向きの近い一羽がきーのほうを向く
    if (kiPos && s.side) {
      const cx = x0 + w / 2, near = Math.hypot(kiPos.x - cx, kiPos.y - base) < 75;
      if (near) {
        const want = (kiPos.x < cx ? -1 : 1) !== FACE[i]; // きーのほうを向くには反転が要るか
        if (s.flip !== want && s.mode === "still") (s.flip = want), (s.until = T + 3);
      }
    }
    if (T > s.until) {
      if (s.mode !== "still") (s.mode = "still"), (s.until = T + rnd(TRIAL ? 2 : 8, TRIAL ? 6 : 20));
      else {
        const opts = ["neck", "rock"].concat(s.side ? ["turn"] : []);
        s.mode = opts[Math.floor(Math.random() * opts.length)];
        s.t0 = T;
        s.until = T + (s.mode === "neck" ? 1.6 : s.mode === "rock" ? 1.4 : 0.1);
        if (s.mode === "turn") s.flip = !s.flip;
      }
    }
    const L = Math.round(sx - w / 2), Tp = Math.round(sy - (base - y0));
    // 反転は、絵の箱ではなく、ペンギンの体(いちばん大きいひとかたまり)の幅のまん中で折り返す。
    // 切り抜きには体から離れた 1 ドットのかけら(雪の粒)が残っていて、かけらまで含めると軸がずれる(11-17)。
    // かけらは反転せず、もとの所にそのまま描く
    if (!PBOX[i]) {
      const c = mk(w, h).getContext("2d");
      c.drawImage(im, ax, ay, w, h, 0, 0, w, h);
      const id = c.getImageData(0, 0, w, h), d = id.data;
      const lab = new Int32Array(w * h).fill(-1);
      let best = -1, bestN = 0, n = 0;
      for (let q = 0; q < w * h; q++) {
        if (d[q * 4 + 3] === 0 || lab[q] >= 0) continue;
        let cnt = 0;
        const st = [q];
        lab[q] = n;
        while (st.length) {
          const p = st.pop(), px = p % w, py = (p - px) / w;
          cnt++;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = px + dx, ny = py + dy, r = ny * w + nx;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && lab[r] < 0 && d[r * 4 + 3] > 0) (lab[r] = n), st.push(r);
          }
        }
        if (cnt > bestN) (bestN = cnt), (best = n);
        n++;
      }
      const body = mk(w, h), rest = mk(w, h);
      const bi = body.getContext("2d").createImageData(w, h), ri = rest.getContext("2d").createImageData(w, h);
      let l = w, r = 0;
      for (let q = 0; q < w * h; q++) {
        if (lab[q] < 0) continue;
        const dst = lab[q] === best ? bi.data : ri.data;
        for (let k = 0; k < 4; k++) dst[q * 4 + k] = d[q * 4 + k];
        if (lab[q] === best) (l = Math.min(l, q % w)), (r = Math.max(r, q % w));
      }
      body.getContext("2d").putImageData(bi, 0, 0);
      rest.getContext("2d").putImageData(ri, 0, 0);
      PBOX[i] = [l, r, body, rest, n > 1];
    }
    const [bl, br, body, rest, hasRest] = PBOX[i];
    if (hasRest) ctx.drawImage(rest, L, Tp);
    ctx.save();
    if (s.flip) (ctx.translate(L * 2 + bl + br + 1, 0), ctx.scale(-1, 1));
    if (s.mode === "neck") {
      // 首をのばす: 上の 4 割を 2 ドット上げ、すき間は首のつけねの行をのばしてうめる
      const k = Math.min(1, (T - s.t0) / 0.3, (s.until - T) / 0.3), up = Math.round(2 * k), cut = Math.round(h * 0.4);
      ctx.drawImage(body, 0, cut, w, h - cut, L, Tp + cut, w, h - cut);
      for (let j = 0; j < up; j++) ctx.drawImage(body, 0, cut, w, 1, L, Tp + cut - 1 - j, w, 1);
      ctx.drawImage(body, 0, 0, w, cut, L, Tp - up, w, cut);
    } else if (s.mode === "rock") {
      // 体を左右にゆらす(上だけ 1 ドットずらす)
      const d = Math.floor((T - s.t0) * 5) % 2 ? 1 : -1, cut = Math.round(h * 0.6);
      ctx.drawImage(body, 0, cut, w, h - cut, L, Tp + cut, w, h - cut);
      ctx.drawImage(body, 0, 0, w, cut, L + d, Tp, w, cut);
    } else ctx.drawImage(body, 0, 0, w, h, L, Tp, w, h);
    ctx.restore();
  }
  {
    const M = window.BOGI_WORLDS.banana.maps.shore;
    const xs = PEN.map(([, , w, , x0]) => x0 + w / 2);
    const ys = PEN.map((p) => p[6]);
    for (const o of M.objects) {
      const i = xs.findIndex((x, j) => o.x === x && o.y === ys[j]);
      if (i >= 0 && o.draw) o.draw = (ctx, sx, sy, t, api) => penDraw(i, ctx, sx, sy, t, api);
    }
    const ov = M.drawOverlay;
    M.drawOverlay = function (ctx, ox, oy, t, api) {
      if (ov) ov.call(M, ctx, ox, oy, t, api);
      const p = api && api.player && api.player();
      kiPos = p ? { x: p.x, y: p.y } : null;
    };
  }
})();
