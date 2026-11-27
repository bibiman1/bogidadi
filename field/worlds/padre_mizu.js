// ぱーでれの空き地の水たまり(D841): 描いてある水たまりを目覚めさせる。新しい物は足さない。
// 1 きーが水たまりを通ると、輪が広がって、少しして静まる(D743 の形)
// 2 裸電球の灯りを受けた水面の照りが、ゆっくりゆらぐ。輪が来るとゆれが大きくなる(D758 の形)
// 試し絵は docs/record/2026-11-27/padre_mizu/。PixelLab 0 回。
(function () {
  const now = () => performance.now() / 1000;
  // 水たまり [中心 x, y, 横の半径, 縦の半径](bg_akichi のドット)
  const PUD = [[113, 302, 30, 13], [390, 318, 44, 14], [470, 361, 15, 6]];
  // 照り [x, y, 水たまり]: 街灯(231, 96)に向いた側のふち
  const GLINT = [[133, 298, 0], [357, 313, 1]];
  const inP = (x, y) => PUD.findIndex(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1);
  const LIFE = 2.2;
  let rings = [], last = null, next = 0;
  function fx(ctx, ox, oy, api) {
    const t = now(), p = api.player();
    const moved = last && Math.hypot(p.x - last.x, p.y - last.y);
    last = { x: p.x, y: p.y };
    const k = inP(p.x, p.y);
    if (k >= 0 && moved > 0.3 && moved < 40 && t > next && !(p.z > 0.5)) {
      rings.push({ x: p.x, y: p.y, k, t0: t });
      next = t + 0.35;
    }
    rings = rings.filter((r) => t - r.t0 < LIFE && t >= r.t0);
    // 輪: ドットで描き、水たまりの外にははみ出さない
    for (const r of rings) {
      const a = (t - r.t0) / LIFE, [cx, cy, rx, ry] = PUD[r.k];
      const rw = 2 + a * 22, rh = Math.max(1, rw * 0.36);
      ctx.fillStyle = `rgba(214, 208, 222, ${0.75 * (1 - a)})`;
      const seen = new Set();
      for (let i = 0; i < 72; i++) {
        const px = Math.round(r.x + Math.cos((i / 72) * Math.PI * 2) * rw), py = Math.round(r.y + Math.sin((i / 72) * Math.PI * 2) * rh);
        if (((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 >= 0.92) continue;
        const key = px * 9999 + py;
        if (!seen.has(key)) (seen.add(key), ctx.fillRect(ox + px, oy + py, 1, 1));
      }
    }
  }
  // 照り: 霧の上に描く(霧の下では灯りの色が抜けて、白い印に見えた)。
  // 水面に落ちた灯りなので、横に平たい光の帯。真ん中ほど明るく、行ごとに 1 ドット横にゆれる。輪が来るとゆれが大きくなる
  function glint(ctx, ox, oy) {
    const t = now();
    for (const [gx, gy, gk] of GLINT) {
      let stir = 0;
      for (const r of rings) if (r.k === gk) stir = Math.max(stir, 1 - (t - r.t0) / LIFE);
      const fl = 0.8 + 0.12 * Math.sin(t * 1.7 + gx) + 0.08 * Math.sin(t * 4.3 + gy);
      const [cx, cy, rx, ry] = PUD[gk];
      [[11, 0.22], [7, 0.4], [3, 0.6]].forEach(([w, al], i) => {
        for (let row = 0; row < 3; row++) {
          const sh = Math.round(Math.sin(t * 2.1 + row * 1.4) * (0.5 + stir * 2.5));
          const ww = w - row * 2;
          if (ww <= 0) continue;
          const x = Math.round(gx - ww / 2 + sh), y = gy + row * 2;
          ctx.fillStyle = `rgba(255, 206, 136, ${al * fl * (1 - row * 0.25)})`;
          for (let px = x; px < x + ww; px++) if (((px - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 0.95) ctx.fillRect(ox + px, oy + y, 1, 1);
        }
      });
    }
  }
  const M = window.BOGI_WORLDS.padre.maps.akichi;
  const o0 = M.drawOverlay;
  M.drawOverlay = function (ctx, ox, oy, t, api) {
    o0.call(M, ctx, ox, oy, t, api);
    glint(ctx, ox, oy);
  };
  const g0 = M.drawGround;
  M.drawGround = function (ctx, ox, oy, img, api) {
    g0.call(M, ctx, ox, oy, img, api);
    if (api) fx(ctx, ox, oy, api);
  };
})();
