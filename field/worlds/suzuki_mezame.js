// 鈴木商店の路地で、描いてある物を目覚めさせる(todo 330、D757、D758)。新しい物は足さない。PixelLab 0 回。
// 試し絵は docs/record/2026-11-17/suzuki_mezame/(suzuki_trial.js)
// 1 鋳物工場の結晶炉の火: 人はいないが、火だけが燃え続けている。炎の明るさがゆらぎ、炎の先が 1 ドット上下し、
//   小屋の中に火あかりが差す。濡れた地面に映った火も、同じ拍子でゆらぎ、さざ波で横にゆれる
// 2 軒のしずく: 雨上がり(D76)。ときどき軒からしずくが落ちて、濡れた地面に小さな輪が広がる
(function () {
  const TRIAL = false; // true にすると、しずくの間をつめる(試し絵)
  const now = () => performance.now() / 1000;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mk = (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h });

  // ---- 1 結晶炉 ----
  const FURN = [540, 398, 34, 50]; // 炉の箱(炎の先から台まで)
  const ROOM = [530, 380, 70, 70]; // 小屋の中(火あかりを差す所)
  const REFL = [538, 450, 38, 40]; // 濡れた地面に映った炉
  const hot = (r, g, b) => r > 170 && r > g + 60 && r > b + 80; // 炎の赤と橙
  // 2 軒のしずく [x, 軒の y, 落ちる先の y]
  const DRIPS = [[44, 128, 236], [110, 128, 236], [240, 128, 236], [310, 128, 236], [70, 382, 462], [160, 382, 462], [250, 382, 462], [330, 382, 462], [720, 382, 462], [790, 382, 462], [850, 382, 462]];

  let base = null, out = null;
  const drops = [];
  let nextDrop = 0;
  function frame(bg) {
    if (!base) {
      base = mk(bg.width, bg.height);
      base.getContext("2d", { willReadFrequently: true }).drawImage(bg, 0, 0);
      out = mk(bg.width, bg.height);
    }
    const g = out.getContext("2d", { willReadFrequently: true }), t = now();
    g.drawImage(base, 0, 0);
    // 炎のゆらぎ: ゆっくりの波と、細かいちらつきを重ねる(怖くならないよう、暗くはしすぎない)
    const k = 0.9 + 0.08 * Math.sin(t * 2.3) + 0.06 * Math.sin(t * 7.1 + 1.3) + 0.04 * Math.sin(t * 13.7);
    const lift = (x) => (Math.sin(t * 6.1 + x * 1.7) + Math.sin(t * 9.3 - x * 0.8) > 0.6 ? 1 : 0); // 炎の先が列ごとに 1 ドット伸び縮みする
    const bc = base.getContext("2d");
    {
      const [x0, y0, w, h] = FURN;
      const src = bc.getImageData(x0, y0, w, h), d = g.getImageData(x0, y0, w, h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4, s = src.data;
          if (!hot(s[i], s[i + 1], s[i + 2])) continue;
          d.data[i] = Math.min(255, s[i] * (0.97 + 0.06 * (k - 0.9) * 5));
          d.data[i + 1] = Math.min(255, s[i + 1] * k * (1 + (k - 0.95)));
          d.data[i + 2] = Math.min(255, s[i + 2] * k);
          // 炎の上のふち: 上の 1 ドットにも火を伸ばす
          if (lift(x) && y > 0 && y < 14) {
            const j = ((y - 1) * w + x) * 4;
            if (!hot(s[j], s[j + 1], s[j + 2])) for (let c = 0; c < 3; c++) d.data[j + c] = d.data[i + c];
          }
        }
      g.putImageData(d, x0, y0);
    }
    // 小屋の中の火あかり
    {
      const [x0, y0, w, h] = ROOM;
      g.save();
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = Math.max(0, (k - 0.78) * 1.2);
      const gr = g.createRadialGradient(557, 425, 2, 557, 425, 40);
      gr.addColorStop(0, "rgba(255,120,40,1)");
      gr.addColorStop(1, "rgba(255,120,40,0)");
      g.fillStyle = gr;
      g.fillRect(x0, y0, w, h);
      g.restore();
    }
    // 地面に映った炉: 同じ拍子で明るさを変え、行ごとに 1 ドット横にゆらす
    {
      const [x0, y0, w, h] = REFL;
      const src = bc.getImageData(x0 - 2, y0, w + 4, h);
      const d = g.getImageData(x0 - 2, y0, w + 4, h);
      const W = w + 4;
      for (let y = 0; y < h; y++) {
        const sh = Math.round(Math.sin(t * 3 + y * 0.9) * 0.8);
        for (let x = 2; x < W - 2; x++) {
          const i = (y * W + x) * 4, j = (y * W + x - sh) * 4, s = src.data;
          if (s[j] < s[j + 2] + 30) continue; // 赤みのある所(映り)だけ
          d.data[i] = Math.min(255, s[j] * (0.9 + (k - 0.9) * 1.5));
          d.data[i + 1] = Math.min(255, s[j + 1] * k);
          d.data[i + 2] = s[j + 2];
        }
      }
      g.putImageData(d, x0 - 2, y0);
    }
    // しずく
    if (t > nextDrop) {
      const [x, ey, gy] = DRIPS[Math.floor(Math.random() * DRIPS.length)];
      drops.push({ x: x + Math.round(rnd(-6, 6)), ey, gy, t0: t });
      nextDrop = t + (TRIAL ? rnd(0.25, 0.7) : rnd(0.5, 2.2));
    }
    for (let n = drops.length - 1; n >= 0; n--) {
      const p = drops[n], u = t - p.t0, fall = 0.32;
      if (u < fall) {
        const y = Math.round(p.ey + (p.gy - p.ey) * (u / fall) * (u / fall));
        g.fillStyle = "rgba(236,240,246,0.95)";
        g.fillRect(p.x, y, 1, 3);
      } else if (u < fall + 0.9) {
        const v = (u - fall) / 0.9, rw = Math.round(2 + v * 8), rh = Math.max(1, Math.round(1 + v * 2));
        // 輪はドットで(ぼかさない)
        g.fillStyle = `rgba(232,228,236,${0.9 * (1 - v)})`;
        const seen = new Set();
        for (let a = 0; a < 64; a++) {
          const px = Math.round(p.x + Math.cos((a / 64) * Math.PI * 2) * rw), py = Math.round(p.gy + Math.sin((a / 64) * Math.PI * 2) * rh);
          const key = px * 9999 + py;
          if (!seen.has(key)) (seen.add(key), g.fillRect(px, py, 1, 1));
        }
      } else drops.splice(n, 1);
    }
    return out;
  }

  const M = window.BOGI_WORLDS.suzuki.maps.alley;
  const g0 = M.drawGround;
  M.drawGround = function (ctx, ox, oy, img, api) {
    const bg = typeof img === "function" && img("bg_alley");
    if (!bg) return g0.call(M, ctx, ox, oy, img, api);
    const f = frame(bg);
    g0.call(M, ctx, ox, oy, (k) => (k === "bg_alley" ? f : img(k)), api);
  };
})();
