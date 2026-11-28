// 南極の浜の正教会の燭台の火(D844、D846): 描いてある火を目覚めさせる。新しい物は足さない(D758 の形)。
// 炎ごとに明るさがゆっくりゆらぎ、ときどき先が 1 ドット伸びる。燭台のまわりの火あかりも同じ拍子で。字も音もなし
// 試し絵は docs/record/2026-11-28/church_hi/。PixelLab 0 回。
(function () {
  const now = () => performance.now() / 1000;
  // 炎 [x, y(先), 幅, 高さ](bg_church のドット)と、燭台の火あかりの中心
  const FLAMES = [[61, 92, 1, 2], [57, 94, 2, 1], [43, 95, 2, 2], [53, 100, 2, 2], [416, 92, 2, 2], [426, 102, 2, 2], [433, 104, 2, 2]];
  const GLOW = [[52, 97], [425, 99]];
  const k = (t, i) => 0.8 + 0.12 * Math.sin(t * 2.1 + i * 1.9) + 0.08 * Math.sin(t * 6.7 + i * 0.7);
  function fx(ctx, ox, oy) {
    const t = now();
    GLOW.forEach(([gx, gy], i) => {
      const a = Math.max(0, (k(t, i * 3) - 0.66) * 0.55);
      const g = ctx.createRadialGradient(ox + gx, oy + gy, 1, ox + gx, oy + gy, 30);
      g.addColorStop(0, `rgba(255, 200, 110, ${a})`);
      g.addColorStop(1, "rgba(255, 200, 110, 0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g;
      ctx.fillRect(ox + gx - 30, oy + gy - 30, 60, 60);
      ctx.restore();
    });
    FLAMES.forEach(([x, y, w, h], i) => {
      const v = k(t, i);
      ctx.fillStyle = v > 0.9 ? "rgb(255, 250, 222)" : v > 0.76 ? "rgb(255, 226, 150)" : "rgb(240, 160, 70)"; // 白 → 黄 → 橙(パレットの段で)
      ctx.fillRect(ox + x, oy + y, w, h);
      // 先が 1 ドット伸びる(ときどき)
      if (v > 0.84 && Math.sin(t * 5.3 + i * 2.3) + Math.sin(t * 8.1 - i) > 0.6) {
        ctx.fillStyle = "rgb(255, 214, 120)";
        ctx.fillRect(ox + x + (w > 1 ? (Math.sin(t * 3 + i) > 0 ? 1 : 0) : 0), oy + y - 1, 1, 1);
      }
      // 暗くなる瞬間は、炎の下半分だけ橙に寄せる
      
    });
  }
  const M = window.BOGI_WORLDS.banana.maps.church;
  const g0 = M.drawGround;
  M.drawGround = function (ctx, ox, oy, img, api) {
    g0.call(M, ctx, ox, oy, img, api);
    fx(ctx, ox, oy);
  };
})();
