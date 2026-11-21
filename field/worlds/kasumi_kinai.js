// 霞ヶ浦のエクラノプランの機内(通路 cabin)の手ざわり(todo 328、D753)。宝舟の発電所と同じ決まり(D741、D742):
// 字は出さず、物が音と動きで一度だけ応える。調べると動く 3 つ(計器盤、無線機、ヘルメット)と、調べなくても動く 1 つ(丸窓から床へ落ちる湖の照り返し)。
// 操縦席は、操縦士の一言が見せ場なので何も足さない。試し絵は docs/record/2026-11-16/kinai/。
"use strict";
(function () {
  const M = window.BOGI_WORLDS.kasumi.maps.cabin;
  const now = () => performance.now() / 1000;
  const hit = {};
  const age = (id) => (hit[id] == null ? Infinity : now() - hit[id]);
  const px = (ctx, x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), w, h));
  // 背景から、印の点を切り出して、元の所を左右の近い色でうめた下地を作る(common.js の kCutFill)。isMark の x, y は切り出しの中の位置
  const cut = (key, img, x0, y0, w, h, isMark) => kCutFill(`kinai:${key}`, img, x0, y0, w, h, (r, g, b, x, y) => isMark(r, g, b, x - x0, y - y0));
  const spot = (id, x, y, sortDy, sound, dur, draw) => ({
    id, x, y, w: 1, h: 1, range: 44, headY: 16, sortDy,
    interact(api) {
      hit[id] = now();
      api.sfx(sound);
    },
    draw(ctx, sx, sy, t, api) {
      const a = age(id);
      if (a > dur) return;
      draw(ctx, (X) => sx + X - x, (Y) => sy + Y - y, a, api);
    },
  });

  M.objects.push(
    // 1 機関士の計器盤: 黒い大きな計器の赤い針がぐっと振れて、ゆれながら戻る。右の小さなランプが順に一度ずつ灯る
    spot("kPanel", 192, 112, 0, "tzNeedle", 1.8, (ctx, X, Y, a, api) => {
      const img = api.image("bg_cabin");
      if (!img) return;
      // 赤い針(黒い文字盤の上の赤い点)を消して描き直す
      const c = cut("panelNeedle", img, 183, 60, 16, 16, (r, g, b) => r > 120 && g < 90 && b < 90);
      ctx.drawImage(c.fill, Math.round(X(183)), Math.round(Y(60)));
      const sw = a < 0.2 ? 1.6 * (a / 0.2) : 1.6 * Math.exp(-(a - 0.2) * 2.4) * Math.cos((a - 0.2) * 9);
      const ang = -Math.PI / 2 + sw;
      for (let r = 0; r <= 5; r++) px(ctx, X(191 + Math.cos(ang) * r), Y(68 + Math.sin(ang) * r), 1, 1, "#e0402c");
      const lamps = [[206, 66], [210, 66], [214, 66], [218, 66], [206, 72], [210, 72], [214, 72], [218, 72]];
      lamps.forEach(([lx, ly], i) => {
        const on = a > 0.1 + i * 0.12 && a < 0.1 + i * 0.12 + 0.35;
        if (on) px(ctx, X(lx), Y(ly), 2, 2, i % 3 === 0 ? "#ff9a3a" : i % 3 === 1 ? "#f2e070" : "#8ef07a");
      });
    }),
    // 2 無線機: 下の目盛りがぼうっと灯り、針がふるえながら振れて、ぷつっと消える(音は雑音)
    spot("kRadio", 308, 150, 20, "kRadio", 1.6, (ctx, X, Y, a) => {
      const k = a < 0.15 ? a / 0.15 : a < 1.25 ? 1 : Math.max(0, 1 - (a - 1.25) / 0.12);
      if (k <= 0) return;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255, 170, 70, ${0.35 * k})`;
      ctx.fillRect(Math.round(X(300)), Math.round(Y(84)), 19, 12);
      ctx.fillStyle = `rgba(255, 150, 60, ${0.12 * k})`;
      ctx.fillRect(Math.round(X(296)), Math.round(Y(80)), 27, 20);
      ctx.restore();
      const jit = Math.sin(a * 47) * 0.12 + Math.sin(a * 23) * 0.1;
      const ang = -Math.PI / 2 - 0.7 + Math.min(1, a / 0.3) * 1.1 + jit;
      for (let r = 0; r <= 7; r++) px(ctx, X(309 + Math.cos(ang) * r), Y(95 + Math.sin(ang) * r), 1, 1, "#3a1c10");
      if (a < 1.25 && Math.floor(a * 8) % 2 === 0) px(ctx, X(302), Y(50), 2, 2, "#ffcc66"); // 上の箱のつまみの灯
    }),
    // 3 ロッカーの上のヘルメット: かたり、と左へ傾き、右へ戻って、落ち着く
    spot("kHelmet", 402, 156, 20, "kHelmet", 0.9, (ctx, X, Y, a, api) => {
      const img = api.image("bg_cabin");
      if (!img) return;
      const c = cut("helmet", img, 386, 8, 32, 30, (r, g, b, x, y) => Math.hypot((x - 16) / 13, (y - 15) / 13) < 1 && (r + g + b > 150 || y < 22) && y < 24); // 下の縁はロッカーに乗ったまま(上だけ傾く)
      const seq = [[0, -2, -2], [0.15, -2, 0], [0.3, 2, -1], [0.45, 1, 0], [0.6, 0, -1], [0.72, 0, 0]];
      let dx = 0, dy = 0;
      for (const [q, x, y] of seq) if (a >= q) (dx = x), (dy = y);
      if (!dx && !dy) return;
      ctx.drawImage(c.fill, Math.round(X(386)), Math.round(Y(8)));
      ctx.drawImage(c.mark, Math.round(X(386)) + dx, Math.round(Y(8)) + dy);
    }),
    // 4 調べなくても動く: 丸窓から入る夕方の湖の照り返しが、床にゆらゆら落ちている
    {
      id: "kGlint", x: 316, y: 150, w: 1, h: 1, sortDy: -60,
      draw(ctx, sx, sy, t) {
        const X = (v) => sx + v - 316, Y = (v) => sy + v - 150;
        ctx.save();
        for (const cx of [255, 376]) {
          for (let i = 0; i < 9; i++) {
            const ph = t * (0.9 + i * 0.13) + i * 1.7;
            const x = cx - 12 + ((i * 7) % 24) + Math.sin(ph) * 2.5;
            const y = 166 + ((i * 5) % 12) + Math.cos(ph * 0.8) * 1.2;
            const al = 0.18 + 0.3 * Math.max(0, Math.sin(ph * 1.6));
            ctx.fillStyle = `rgba(255, 214, 220, ${al})`;
            ctx.fillRect(Math.round(X(x)), Math.round(Y(y)), 4 + (i % 4), 1);
          }
        }
        ctx.restore();
      },
    }
  );
})();
