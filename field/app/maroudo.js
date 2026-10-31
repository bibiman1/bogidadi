// まろうど(D492〜D494): 懲罰空間から断片に入るとき、画面がブラウン管になり、ガラスが照り返し、
// 電源が切れるように横一本の線にしぼんで暗くなる。文字は出さない(D16)。画面の外の観測者は、ほのめかすだけ(D213)。
// まろうど(客)は画面を見ているプレイヤー自身なので、人影は映さない(D494)。
// はじめての断片は長く、2 回目からは短く。形と動きは docs/assets/void/maroudo_crt.py の試しと同じ。
"use strict";

const MAROUDO_FIRST = { crt: 0.6, zoom: 1.4, refl0: 1.0, refl1: 2.6, off: 2.6, end: 3.4 };
const MAROUDO_SHORT = { crt: 0.25, zoom: 0.5, refl0: 0.3, refl1: 0.75, off: 0.7, end: 1.2 };
const MW = VW / 2, MH = VH / 2; // ゲームのドットの升目(画面は 2 倍で描いている)
const maroudo = { on: false, t: 0, T: null, src: null, done: null };
const maroudoOut = document.createElement("canvas");
maroudoOut.width = MW;
maroudoOut.height = MH;
const maroudoOutCtx = maroudoOut.getContext("2d");
const maroudoImg = maroudoOutCtx.createImageData(MW, MH);

function maroudoEase(a) {
  a = Math.min(1, Math.max(0, a));
  return a * a * (3 - 2 * a);
}

// 断片に入る前に呼ぶ。first: はじめての断片か。done: 暗くなったあとに呼ぶ(そこから今の暗転とフェードイン)
function maroudoPlay(first, done) {
  // いまの画面を、ドットの升目で写しとる(触れたコマの位置で描き直してから)
  rpg.draw(performance.now() / 1000);
  const full = ctx.getImageData(0, 0, VW, VH).data;
  const src = new Uint8ClampedArray(MW * MH * 3);
  for (let y = 0; y < MH; y++)
    for (let x = 0; x < MW; x++) {
      const i = ((y * 2) * VW + x * 2) * 4, j = (y * MW + x) * 3;
      src[j] = full[i];
      src[j + 1] = full[i + 1];
      src[j + 2] = full[i + 2];
    }
  Object.assign(maroudo, { on: true, t: 0, T: first ? MAROUDO_FIRST : MAROUDO_SHORT, src, done });
  transitioning = true; // 入力を受けない
  resetJoy();
}

function updateMaroudo(dt) {
  maroudo.t += dt;
  if (maroudo.t > maroudo.T.end + 0.15) {
    // 暗いまま、今の暗転の幕を一気に下ろしてから、断片へ
    fadeOverlay.style.transition = "none";
    fadeOverlay.classList.add("on");
    void fadeOverlay.offsetWidth;
    fadeOverlay.style.transition = "";
    maroudo.on = false;
    const fn = maroudo.done;
    maroudo.done = null;
    maroudo.src = null;
    if (fn) fn();
  }
}

function drawMaroudo() {
  const T = maroudo.T, t = maroudo.t, src = maroudo.src;
  const out = maroudoImg.data;
  const cx = MW / 2, cy = MH / 2;
  const k = maroudoEase(t / T.crt);
  const z = 1 - 0.22 * maroudoEase((t - T.crt * 0.6) / (T.zoom - T.crt * 0.6)); // 引いて、テレビの縁が見える
  const o = (t - T.off) / (T.end - T.off); // 電源が切れる
  const sqY = o > 0 ? 1 - 0.985 * maroudoEase(o / 0.55) : 1;
  const sqX = o > 0.55 ? 1 - 0.99 * maroudoEase((o - 0.55) / 0.35) : 1;
  const a = Math.sin(Math.PI * Math.min(1, Math.max(0, (t - T.refl0) / (T.refl1 - T.refl0)))); // ガラスの照り返し
  const glow = o > 0 ? Math.min(1, o / 0.4) : 0;
  const fadeOut = o > 0.9 ? Math.max(0, 1 - (o - 0.9) / 0.1) : 1;
  const corner = Math.max(0.18 * k, 1e-3);
  const room = [12, 11, 16], bezel = [38, 36, 42], bezelHi = [62, 60, 68];
  const isBezel = (x, y) => {
    const bu = (x - cx) / (cx * z * 1.07), bv = (y - cy) / (cy * z * 1.1);
    if (Math.abs(bu) > 1 || Math.abs(bv) > 1) return false;
    const qu = Math.max(Math.abs(bu) - 0.86, 0) / 0.14, qv = Math.max(Math.abs(bv) - 0.8, 0) / 0.2;
    return qu * qu + qv * qv <= 1;
  };
  for (let y = 0; y < MH; y++) {
    const ripple = Math.round(1.2 * k * Math.sin(y / 5 - t * 11) * (1 - Math.min(1, Math.max(0, o)))); // さざ波
    const scan = y % 2 === 1 ? 1 - 0.1 * k : 1; // 走査線
    for (let x = 0; x < MW; x++) {
      const p = (y * MW + x) * 4;
      let r, g, b;
      const u = (x - cx) / (cx * z * sqX), v = (y - cy) / (cy * z * sqY);
      const r2 = u * u + v * v;
      const bar = 1 + 0.1 * k * r2; // 丸み
      const su = u * bar, sv = v * bar;
      let inside = Math.abs(su) <= 1 && Math.abs(sv) <= 1;
      if (inside) {
        const qu = Math.max(Math.abs(su) - (1 - corner), 0) / corner, qv = Math.max(Math.abs(sv) - (1 - corner * 1.6), 0) / (corner * 1.6);
        inside = qu * qu + qv * qv <= 1;
      }
      if (inside && t <= T.end) {
        const sy = Math.min(MH - 1, Math.max(0, Math.round(sv * cy + cy)));
        const sx = Math.min(MW - 1, Math.max(0, Math.round(su * cx + cx + ripple)));
        const j = (sy * MW + sx) * 3;
        const dark = scan * (1 - 0.22 * k * Math.min(1, Math.max(0, r2 - 0.5)));
        r = src[j] * dark;
        g = src[j + 1] * dark;
        b = src[j + 2] * dark;
        if (a > 0.01 && Math.abs(su + sv * 0.6 + 0.55) < 0.05) {
          // ガラスの照り返し
          r = r * (1 - 0.12 * a) + 255 * 0.12 * a;
          g = g * (1 - 0.12 * a) + 255 * 0.12 * a;
          b = b * (1 - 0.12 * a) + 255 * 0.12 * a;
        }
        if (glow > 0) {
          r = (r * (1 - glow) + 236 * glow) * fadeOut;
          g = (g * (1 - glow) + 240 * glow) * fadeOut;
          b = (b * (1 - glow) + 248 * glow) * fadeOut;
        }
      } else if (z < 0.999 && t <= T.end && isBezel(x, y)) {
        const c = isBezel(x, y - 1) ? bezel : bezelHi;
        [r, g, b] = c;
      } else {
        [r, g, b] = room;
      }
      out[p] = r;
      out[p + 1] = g;
      out[p + 2] = b;
      out[p + 3] = 255;
    }
  }
  maroudoOutCtx.putImageData(maroudoImg, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(maroudoOut, 0, 0, VW, VH);
  ctx.restore();
}
