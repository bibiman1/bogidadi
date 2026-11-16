// 霞ヶ浦のエクラノプランのサギ(todo 327、D751、D752): 翼の上の背景に描きこまれていたサギ 5 羽を目覚めさせる。新しい物は足さない。
// 背景(bg_wing)は PixelLab の描き直しでサギを消した絵。サギは消す前と後の差で切り出した絵(sagi_w1〜w5。脚と足もとの影もふくむ)。
// サギは長く動かない鳥。ふだんは止まっていて、ときどき向きを変える、首をのばす。まれに一羽が飛んで近くへ移り、また戻る。
// きーが近づくと飛び立って、水ぎわへおりる。飛ぶ姿は立っている絵とつりあう大きさで描く(D752)。
// TRIAL を true にすると、動きの間隔を短くする(試し絵を撮るとき。docs/record/2026-11-16/sagi/kesu_pl/)。
(function () {
  const TRIAL = false;
  const now = () => performance.now() / 1000;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // 切り出しの絵から、左右反転と、白い体の上と下(首をのばす切れ目)を一度だけ作る
  const cache = {};
  function sprite(api, key) {
    if (cache[key]) return cache[key];
    const im = api.image("sagi_" + key);
    if (!im || !im.width) return null;
    const w = im.width, h = im.height;
    const mk = () => Object.assign(document.createElement("canvas"), { width: w, height: h });
    const m = mk(), fl = mk();
    m.getContext("2d").drawImage(im, 0, 0);
    const g = fl.getContext("2d");
    g.translate(w, 0);
    g.scale(-1, 1);
    g.drawImage(im, 0, 0);
    const d = m.getContext("2d").getImageData(0, 0, w, h).data;
    let top = h, bot = 0;
    for (let i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] && Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) > 182) (top = Math.min(top, (i / w) | 0)), (bot = Math.max(bot, (i / w) | 0));
    }
    return (cache[key] = { m, fl, w, h, top, bot, foot: h - 1 });
  }

  // 飛ぶサギ(D752): 斜め上から見る(D678)ので、奥の翼は上へ、手前の翼は下へのびる。
  // ダイサギの飛び方: 首を S 字にちぢめて胸がふくらみ、黒い脚を尾のうしろへのばし、広い白い翼でゆっくり大きくはばたく。
  // dir: 1 = 右へ進む、-1 = 左へ。ph: 0 上げ、1 広げ、2 下げ
  function drawFlying(ctx, X, Y, dir, ph) {
    const W = "#fbfaf6", S = "#d8d4ca", S2 = "#b9b4aa", K = "#2a2622", Bk = "#e8b030";
    X = Math.round(X);
    Y = Math.round(Y);
    const px = (x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(dir > 0 ? X + x : X - x - w + 1, Y + y, w, h));
    ctx.fillStyle = "rgba(30, 40, 60, 0.22)"; // 影
    ctx.fillRect(X - 16, Y + 30, 33, 2);
    ctx.fillRect(X - 12, Y + 32, 25, 1);
    // 翼一枚: 肩(sy)から先(ty)まで、行ごとに前のふちと後ろのふちをのばす。後ろのふちは灰、先は風切り羽のぎざぎざ
    const wing = (sy, ty) => {
      const n = Math.abs(ty - sy), sg = Math.sign(ty - sy);
      for (let i = 0; i <= n; i++) {
        const q = i / n, y = sy + sg * i;
        const lead = Math.round(4 - 9 * q * q), trail = Math.round(-5 - 6 * q);
        const tip = q > 0.8 ? Math.round((q - 0.8) * 20) : 0;
        const a = trail + (q > 0.55 && i % 2 ? 1 : 0), b = lead - tip;
        if (b < a) continue;
        px(a, y, b - a + 1, 1, W);
        px(a, y, 1, 1, q > 0.55 ? S2 : S);
        if (b - a > 4) px(a + 1, y, 1, 1, S);
      }
    };
    const [far, near] = [[-22, 7], [-17, 15], [-7, 21]][ph];
    wing(-2, far); // 奥
    px(-10, -2, 17, 4, W), px(-9, 2, 15, 1, S); // 胴と腹の影
    px(-12, -1, 3, 2, W); // 尾
    px(6, -4, 5, 6, W), px(6, 2, 4, 1, S); // 胸(S 字の首)
    px(10, -6, 4, 3, W); // 頭
    px(12, -6, 1, 1, K); // 目
    px(14, -5, 5, 1, Bk), px(14, -4, 3, 1, Bk); // くちばし
    px(-20, 0, 9, 1, K), px(-21, -1, 2, 1, K), px(-21, 1, 2, 1, K); // うしろへのばした脚と指
    wing(2, near); // 手前
  }

  // サギ一羽: at は絵の中の場所(切り出しの左上)、away は飛んで移る先(足もとの点)
  function heron(key, at, away) {
    const st = { mode: "still", until: 0, flip: false, neck: 0, fly: null, at: "home", seen: false };
    const [x0, y0] = at;
    return {
      ground(ctx, ox, oy, api) {
        const c = sprite(api, key);
        if (!c) return;
        const t = now();
        if (!st.seen) (st.seen = true), (st.until = t + rnd(3, 10)); // 地図に入ってから数える
        if (st.mode === "still" && t > st.until) {
          const r = Math.random();
          if (r < (TRIAL ? 0.3 : 0.12)) (st.mode = "fly"), (st.fly = { t0: t, from: st.at, dur: 2.2 });
          else if (r < 0.65) (st.flip = !st.flip), (st.until = t + rnd(TRIAL ? 2 : 6, TRIAL ? 5 : 16));
          else (st.neck = t), (st.until = t + rnd(TRIAL ? 2 : 6, TRIAL ? 5 : 14));
        }
        // きーが近づくと飛び立つ
        if (st.mode === "still" && st.at === "home") {
          const p = api.player();
          if (Math.hypot(p.x - (x0 + c.w / 2), p.y - (y0 + c.foot)) < 56) (st.mode = "fly"), (st.fly = { t0: t, from: "home", dur: 1.8 });
        }
        if (st.mode === "fly") return; // 飛んでいるあいだは上の層で描く
        const bx = st.at === "home" ? x0 : away.x - c.w / 2, by = st.at === "home" ? y0 : away.y - c.foot;
        const spr = st.flip ? c.fl : c.m;
        const nk = st.neck && t - st.neck < 1.6 ? (t - st.neck < 0.25 || t - st.neck > 1.35 ? 1 : 2) : 0;
        if (!nk) ctx.drawImage(spr, Math.round(bx + ox), Math.round(by + oy));
        else {
          // 首をのばす: 上の 4 割を上へずらし、すきまは首の行をのばしてうめる
          const cutY = Math.round(c.top + (c.bot - c.top) * 0.4);
          ctx.drawImage(spr, 0, cutY, c.w, c.h - cutY, Math.round(bx + ox), Math.round(by + oy + cutY), c.w, c.h - cutY);
          ctx.drawImage(spr, 0, 0, c.w, cutY, Math.round(bx + ox), Math.round(by + oy - nk), c.w, cutY);
          for (let k = 0; k < nk; k++) ctx.drawImage(spr, 0, cutY, c.w, 1, Math.round(bx + ox), Math.round(by + oy + cutY - nk + k), c.w, 1);
        }
      },
      over(ctx, ox, oy, api) {
        if (st.mode !== "fly") return;
        const c = sprite(api, key);
        if (!c) return;
        const t = now(), q = Math.min(1, (t - st.fly.t0) / st.fly.dur);
        const hx = x0 + c.w / 2, hy = y0 + c.foot;
        const [ax, ay, bx, by] = st.fly.from === "home" ? [hx, hy, away.x, away.y] : [away.x, away.y, hx, hy];
        const x = ax + (bx - ax) * q, y = ay + (by - ay) * q - Math.sin(q * Math.PI) * 26 - 8;
        drawFlying(ctx, x + ox, y + oy, bx > ax ? 1 : -1, Math.floor(t * 3) % 3);
        if (q >= 1) {
          st.at = st.fly.from === "home" ? "away" : "home";
          st.flip = bx < ax;
          st.mode = "still";
          st.until = t + (st.at === "away" ? rnd(TRIAL ? 5 : 20, TRIAL ? 8 : 30) : rnd(TRIAL ? 3 : 8, TRIAL ? 6 : 18));
        }
      },
      afterAway() {
        if (st.at === "away" && st.mode === "still" && st.seen && now() > st.until) (st.mode = "fly"), (st.fly = { t0: now(), from: "away", dur: 2.2 });
      },
    };
  }

  // 翼の上の 5 羽。位置は切り出しの左上(docs/record/2026-11-16/sagi/kesu_pl/sagi_box.js)、移る先は水ぎわ
  const M = window.BOGI_WORLDS.kasumi.maps.wing;
  const hs = [
    ["w1", [133, 34], { x: 60, y: 30 }],
    ["w2", [508, 68], { x: 470, y: 30 }],
    ["w3", [92, 127], { x: 40, y: 200 }],
    ["w4", [737, 152], { x: 820, y: 120 }],
    ["w5", [194, 198], { x: 36, y: 300 }],
  ].map((h) => heron(...h));
  const g = M.drawGround, o = M.drawOverlay;
  M.drawGround = function (ctx, ox, oy, imgf, api) {
    if (g) g.call(M, ctx, ox, oy, imgf, api);
    if (!api) return;
    hs.forEach((h) => (h.afterAway(), h.ground(ctx, ox, oy, api)));
  };
  M.drawOverlay = function (ctx, ox, oy, t, api) {
    if (o) o.call(M, ctx, ox, oy, t, api);
    if (api) hs.forEach((h) => h.over(ctx, ox, oy, api));
  };
})();
