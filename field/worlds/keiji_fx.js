// 断片: 形而アップダウンクイズ(ルールの紙、結果、こわれ方)。keiji.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";

// ルールは 1 枚ずつ 4 枚(D517)。小さな実演と、一行の字
// 0 枚目は、正しい物(おみやげ)と変な物の見本(D518)
// 最後の 1 枚は、だれがどこを目指すか(D519、D520): マトリョーシカと鉄瓶は上、きーはまん中。ぴーは上でも下でもなく、番組をこわす(混沌)
// D522 で作り直し: 当てた人がゴンドラを操る / 外すとこわさ +1 / 変な物の影で押すと一回休み
const KJ_RULES = ["", "あてたら ゴンドラを うごかせる", "はずれ → こわさ +1", "へんな物で おすと こわさ+1 やすみ", "いちばん先に押した人だけ", "きーは まんなかに ふみとどまる"];
const KJ_PAGES = KJ_RULES.length;
const kjRules = (ctx, api, t) => {
  const P = window.bogiPix;
  const page = Math.min(KJ_PAGES - 1, kjS.page);
  const pt = kjEl();
  const x0 = 80;
  const y0 = 70;
  const w = 320;
  const h = 140;
  ctx.fillStyle = "#1a1820";
  ctx.fillRect(x0 - 4, y0 - 4, w + 8, h + 8);
  ctx.fillStyle = "#efe8d8";
  ctx.fillRect(x0, y0, w, h);
  if (P) P.text(ctx, "ルール", x0 + w / 2 - P.width("ルール") / 2, y0 + 5, 1, "#3a3228");
  const img = (key, x, y, z = 28) => {
    const im = api.image(key);
    if (im) ctx.drawImage(im, x, y, z, z);
  };
  const shadow = (key, x, y) => {
    const sl = kjSil(api.image(key), key);
    if (sl) ctx.drawImage(sl, x, y, 28, 28);
  };
  const eq = (x, y, not) => {
    ctx.fillStyle = "#3a3228";
    ctx.fillRect(x, y + 10, 10, 2);
    ctx.fillRect(x, y + 16, 10, 2);
    if (not) for (let k = 0; k < 12; k++) ctx.fillRect(x + 8 - k * 0.6, y + 7 + k, 1, 1);
  };
  const booth = (x, y) => {
    const bt = api.image("booth");
    if (bt) ctx.drawImage(bt, Math.round(x - bt.width / 2), Math.round(y - bt.height));
  };
  const ry = y0 + 36; // 実演の段
  const u = kjClamp((pt - 0.8) / 1.2); // 実演の進み
  if (page === 0) {
    // おみやげ 10 と、変な物 6
    const P2 = (txt, y) => P && P.text(ctx, txt, x0 + w / 2 - P.width(txt) / 2, y, 1, "#3a3228");
    P2("おみやげ = 正しい物", y0 + 26);
    KJ_SOUV.forEach(([, key], k) => img(key, x0 + 40 + k * 24, y0 + 40, 22));
    P2("へんな物 = どこにもない物", y0 + 72);
    KJ_UNK.forEach((key, k) => {
      const x = x0 + 88 + k * 26;
      ctx.fillStyle = KJ_PURPLE;
      ctx.fillRect(x - 1, y0 + 87, 24, 24);
      img(key, x, y0 + 88, 22);
      kjOddEye(ctx, x + 16, y0 + 94, t, k);
    });
  } else if (page === 1) {
    shadow("ic_mango", x0 + 72, ry);
    eq(x0 + 108, ry + 2, false);
    img("ic_mango", x0 + 126, ry);
    // 当てた人の解答席が動く
    const bx = x0 + 226;
    const base = ry + 34;
    ctx.fillStyle = "rgba(160, 140, 110, 0.5)";
    ctx.fillRect(bx - 1, ry - 10, 2, 70);
    booth(bx, base - 18 * u);
    kjArrow(ctx, bx + 32, ry + 6, true, "#d0902a");
  } else if (page === 2) {
    shadow("ic_mango", x0 + 72, ry);
    eq(x0 + 108, ry + 2, true);
    img("ic_slice", x0 + 126, ry);
    // こわさの目が 1 つ開く
    for (let k = 0; k < 5; k++) {
      const ex = x0 + 196 + k * 16;
      ctx.fillStyle = "rgba(20, 14, 24, 0.85)";
      ctx.fillRect(ex - 6, ry + 9, 13, 10);
      if (k === 0 && u >= 1) kjOddEye(ctx, ex, ry + 14, t, k);
      else (ctx.fillStyle = "#6a5a7a"), ctx.fillRect(ex - 3, ry + 14, 7, 1);
    }
  } else if (page === 3) {
    // 変な物の影には、選べるおみやげの中に答えがない。押した人はバツのマスクで一回休み
    shadow("u2", x0 + 56, ry);
    eq(x0 + 90, ry + 2, true);
    ["ic_kori", "ic_hasu", "ic_fuda"].forEach((k, i) => img(k, x0 + 106 + i * 22, ry + 5, 20));
    const ki = api.image("ki");
    const kx = x0 + 232;
    if (ki) ctx.drawImage(ki, 0, 0, 64, 64, kx - 24, ry - 14, 48, 48);
    if (u >= 1) kjMask(ctx, kx, ry + 18);
    if (P && u >= 1) P.text(ctx, "やすみ", kx + 20, ry + 2, 1, "#a8302a");
  } else if (page === 5) {
    // 目盛りの上に 4 人。上が形而上、下が形而下、まん中の金の線にきー。ぴーはゴンドラをゆする(D522)
    const ly = { u: y0 + 24, m: y0 + 50, d: y0 + 76 };
    if (P) {
      P.text(ctx, "形而上", x0 + 14, ly.u, 1, "#6a6a86");
      P.text(ctx, "形而下", x0 + 14, ly.d, 1, "#7a5a3a");
    }
    const my = ly.m + 8;
    ctx.fillStyle = `rgba(230, 170, 40, ${0.6 + 0.3 * Math.sin(t * 3)})`;
    ctx.fillRect(x0 + 80, my, w - 96, 2);
    const fig = (key, x, y, sz) => {
      const im = api.image(key);
      if (!im) return;
      const z = sz / Math.max(im.width, im.height);
      ctx.drawImage(im, Math.round(x - (im.width * z) / 2), Math.round(y - im.height * z), Math.round(im.width * z), Math.round(im.height * z));
    };
    const bob = u * 6; // 実演: 上へ、下へ、少し動く
    fig("matryo", x0 + 100, ly.u + 22 - bob, 26);
    kjArrow(ctx, x0 + 120, ly.u + 2 - bob, true, "#d0902a");
    fig("tetsubin", x0 + 210, ly.u + 22 - bob, 24);
    kjArrow(ctx, x0 + 230, ly.u + 2 - bob, true, "#d0902a");
    const sh = (key, x, y) => {
      const im = api.image(key);
      if (im) ctx.drawImage(im, 0, 0, 64, 64, Math.round(x - 16), Math.round(y - 30), 32, 32);
    };
    // ぴー: 当てるとゴンドラをぶるぶるゆする(こわさ +1)
    const pim = api.image("pi");
    const rx = Math.sin(t * 50) * 2 * u;
    if (pim) ctx.drawImage(pim, 0, 0, 64, 64, Math.round(x0 + 272 - 16 + rx), Math.round(my + 4 - 30), 32, 32);
    if (u > 0) {
      ctx.fillStyle = "rgba(240, 160, 184, 0.8)"; // ゆれの線
      for (const sx of [-22, 18]) for (let k = 0; k < 3; k++) ctx.fillRect(x0 + 272 + sx + (k % 2), my - 20 + k * 6, 3, 1);
    }
    // きー: ↑・とどまる・↓ を自分で選べる。とどまるのが、きーの意思
    kjArrow(ctx, x0 + 182, my - 22, true, "#a89a80");
    kjArrow(ctx, x0 + 182, my + 6, false, "#a89a80");
    sh("ki", x0 + 160, my + 1);
  } else {
    // 4 つの席。いちばん先に押した席のボタンだけ光る
    for (let k = 0; k < 4; k++) {
      const bx = x0 + 82 + k * 52;
      booth(bx, ry + 34);
      if (k === 1 && u > 0) {
        ctx.fillStyle = Math.sin(t * 14) > 0 ? "#ffe27a" : "#ff5a3c";
        ctx.beginPath();
        ctx.arc(bx, ry + 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const line = KJ_RULES[page];
  if (P && line) P.text(ctx, line, x0 + w / 2 - P.width(line) / 2, y0 + h - 30, 1, "#3a3228");
  // 何枚目か
  for (let k = 0; k < KJ_PAGES; k++) {
    ctx.fillStyle = k === page ? "#3a3228" : "#c8bca4";
    ctx.fillRect(x0 + w / 2 - KJ_PAGES * 6 + 3 + k * 12, y0 + h - 10, 6, 4);
  }
};
// 上で終わる(D514): 番組の上では優勝。紙吹雪と、字
const kjWin = (ctx, t, el) => {
  for (let j = 0; j < 60; j++) {
    const x = (j * 97 + Math.sin(t * 2 + j) * 10) % 480;
    const y = ((j * 53) % 120) - 40 + el * (60 + (j % 5) * 14);
    ctx.fillStyle = ["#e0402c", "#ffd75a", "#4a9ad8", "#6ac06a", "#f4f2ea"][j % 5];
    ctx.fillRect(Math.round(x), Math.round(y), 3, 2);
  }
  const P = window.bogiPix;
  if (P) {
    const a = kjClamp(el / 0.3) * kjClamp((KJ.win + 0.6 - el) / 0.6);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#1a1820";
    // まん中の上(幕のあった所)に。だれの優勝かは、はねている者でわかる(D515)
    const tw = P.width("ゆうしょう") * 2;
    const bx = 240;
    const by = 24;
    ctx.fillRect(bx - tw / 2 - 10, by, tw + 20, 30);
    P.text(ctx, "ゆうしょう", bx - tw / 2, by + 6, 2, "#ffd75a");
    ctx.globalAlpha = 1;
  }
};
// 下で終わる(D526): 番組の下では賞金。硬貨と札束が、いちばん低い人の上にどすんどすんと降って積もる。字は「しょうきん」
const kjPrize = (ctx, t, el) => {
  const who = kjS.loser || "k";
  const cx = KJ_X[who];
  const base = Math.round(kjGy(kjS.d[who]) - 4); // ゴンドラの床(箱の上)
  for (let j = 0; j < 22; j++) {
    const t0 = 0.2 + (j % 3) * 0.6 + Math.floor(j / 3) * 0.05; // 3 回に分けて、どすんと降る
    const ft = el - t0;
    if (ft < 0) continue;
    const dx = Math.round((kjRnd(j * 7 + 1) - 0.5) * 34);
    const land = base - 2 - Math.floor(j / 3) * 3;
    const y = Math.round(Math.min(land, -10 + ft * ft * 900));
    const x = cx + dx;
    if (j % 4 === 3) {
      ctx.fillStyle = "#2e4a2a"; // 札束
      ctx.fillRect(x - 6, y - 4, 13, 6);
      ctx.fillStyle = "#7aa868";
      ctx.fillRect(x - 5, y - 3, 11, 4);
      ctx.fillStyle = "#e8e0c0";
      ctx.fillRect(x - 1, y - 3, 2, 4);
    } else {
      ctx.fillStyle = "#5a3a10"; // 硬貨
      ctx.fillRect(x - 4, y - 3, 9, 5);
      ctx.fillStyle = "#e8b83a";
      ctx.fillRect(x - 3, y - 2, 7, 3);
      ctx.fillStyle = "#fff2a8";
      ctx.fillRect(x - 2, y - 2, 2, 1);
    }
  }
  const P = window.bogiPix;
  if (!P) return;
  const a = kjClamp(el / 0.3) * kjClamp((KJ.prize + 0.6 - el) / 0.6);
  if (a <= 0) return;
  ctx.globalAlpha = a;
  const tw = P.width("しょうきん") * 2;
  ctx.fillStyle = "#1a1820";
  ctx.fillRect(240 - tw / 2 - 10, 24, tw + 20, 30);
  P.text(ctx, "しょうきん", 240 - tw / 2, 30, 2, "#e8b83a");
  ctx.globalAlpha = 1;
};
// 影(D513): はじめ荒いモザイクで、8 秒を 4 段に分けて 2 秒ごとに細かくなる。よくわからない問いの影だけ、うごめいてにじむ
const KJ_MOSAIC = [6, 12, 24, 48]; // 段ごとの目の数(48 ならくっきり)
const kjTmp = [document.createElement("canvas"), document.createElement("canvas")];
const kjDrawSil = (ctx, sil, x, y, q, t) => {
  const qe = kjS.phase === "q" ? kjEl() : kjS.phase === "choose" ? kjS.qEl : KJ.qSec; // 押したら、そこで止まる
  const n = KJ_MOSAIC[Math.min(3, Math.floor((qe / KJ.qSec) * 4))];
  const [a, b] = kjTmp;
  a.width = a.height = n;
  b.width = b.height = 48;
  const ga = a.getContext("2d");
  ga.imageSmoothingEnabled = true;
  ga.drawImage(sil, 0, 0, n, n);
  const gb = b.getContext("2d");
  gb.imageSmoothingEnabled = false;
  gb.drawImage(a, 0, 0, 48, 48);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (q.kind !== "u") ctx.drawImage(b, x, y);
  else {
    ctx.globalAlpha = 0.35; // にじむ
    ctx.drawImage(b, x + Math.round(Math.sin(t * 1.7) * 3), y + Math.round(Math.cos(t * 1.3) * 2));
    ctx.globalAlpha = 1;
    for (let r = 0; r < 48; r += 2) {
      const dx = Math.round(Math.sin(t * 3 + r * 0.25) * 2); // うごめく
      ctx.drawImage(b, 0, r, 48, 2, x + dx, y + r, 48, 2);
    }
  }
  ctx.restore();
};
// ぴーの混沌(D520): 幕がバグる。影の帯が横にずれて裂ける(積もるほど多く、大きく)
const kjRnd = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const kjGlitchScreen = (ctx, c, t) => {
  const m = ctx.getTransform();
  const f = Math.floor(t * 7);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const X = m.a * 196 + m.e;
  const Y = m.d * 6 + m.f;
  const W = m.a * 88;
  const H = m.d * 66;
  for (let k = 0; k < 1 + c * 2; k++) {
    const y = Math.floor(Y + kjRnd(f * 7 + k) * H * 0.9);
    const h = Math.max(2, Math.floor(m.d * (2 + kjRnd(f * 3 + k) * 6)));
    const dx = Math.round((kjRnd(f * 5 + k) - 0.5) * m.a * 10 * c);
    ctx.drawImage(ctx.canvas, X, y, W, h, X + dx, y, W, h);
  }
  if (kjRnd(f) < 0.25 * c) {
    ctx.fillStyle = "rgba(240, 160, 184, 0.35)"; // ぴーの色がにじむ
    ctx.fillRect(X, Math.floor(Y + kjRnd(f + 9) * H), W, Math.max(2, Math.floor(m.d * 3)));
  }
  ctx.restore();
};
const kjBursting = () => !!kjS.burst && kjS.t - kjS.burst.t0 < kjS.burst.len;
// 画面全体のバグ: 横の帯が大きくずれる、縦に裂ける、色がずれて裏返る、ぴーの色の塊、ぴーの顔がばらまかれる
const kjChaosBurst = (ctx, c, t, u, api) => {
  const cv = ctx.canvas;
  const CW = cv.width;
  const CH = cv.height;
  const f = Math.floor(t * 14);
  const k = 0.6 + c * 0.5; // 強さ
  const fade = u < 0.85 ? 1 : (1 - u) / 0.15; // 終わりぎわに少しずつ戻る
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  // 横の帯
  for (let j = 0; j < Math.round((8 + 10 * k) * fade); j++) {
    const y = Math.floor(kjRnd(f * 31 + j) * CH);
    const h = 2 + Math.floor(kjRnd(f * 17 + j) * 50 * k);
    const dx = Math.round((kjRnd(f * 13 + j) - 0.5) * 260 * k);
    ctx.drawImage(cv, 0, y, CW, h, dx, y + Math.round((kjRnd(f * 7 + j) - 0.5) * 16), CW, h);
  }
  // 縦の裂け目
  for (let j = 0; j < Math.round(3 * k * fade); j++) {
    const x = Math.floor(kjRnd(f * 41 + j) * CW);
    const w = 6 + Math.floor(kjRnd(f * 23 + j) * 60);
    ctx.drawImage(cv, x, 0, w, CH, x, Math.round((kjRnd(f * 29 + j) - 0.5) * 120 * k), w, CH);
  }
  // 色がずれる(ぴーのピンクと、青みどり)
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.25 * fade;
  ctx.drawImage(cv, Math.round(6 * k), 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  for (let j = 0; j < Math.round(10 * k * fade); j++) {
    ctx.fillStyle = ["rgba(240, 160, 184, 0.75)", "rgba(80, 220, 210, 0.55)", "rgba(20, 10, 24, 0.85)", "rgba(255, 255, 255, 0.7)"][j % 4];
    ctx.fillRect(Math.floor(kjRnd(f * 3 + j) * CW), Math.floor(kjRnd(f * 5 + j) * CH), 8 + Math.floor(kjRnd(f * 11 + j) * 120 * k), 2 + Math.floor(kjRnd(f * 19 + j) * 18));
  }
  // ぴーの顔が、ちらばって増える
  const pi = api && api.image("pi");
  if (pi && fade > 0.3) {
    for (let j = 0; j < Math.round(2 + 4 * k); j++) {
      if (kjRnd(f * 37 + j) < 0.4) continue;
      const z = 1 + kjRnd(f * 43 + j) * 2.5 * k;
      ctx.drawImage(pi, 0, 0, 64, 64, Math.floor(kjRnd(f * 47 + j) * CW) - 32 * z, Math.floor(kjRnd(f * 53 + j) * CH) - 32 * z, 64 * z, 64 * z * (0.4 + kjRnd(f * 59 + j)));
    }
  }
  // ときどき裏返る
  if (kjRnd(f * 61) < 0.22 * k * fade) {
    ctx.globalCompositeOperation = "difference";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CW, CH);
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
};
const kjDistort = (ctx, e, t) => {
  const cv = ctx.canvas;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const CW = cv.width;
  const CH = cv.height;
  if (e < 6) {
    const band = 8;
    const amp = (e - 2) * 1.6;
    for (let y = 0; y < CH; y += band * 2) {
      const dx = Math.round(Math.sin(t * 2.4 + y * 0.03) * amp * 2);
      if (dx) ctx.drawImage(cv, 0, y, CW, band * 2, dx, y, CW, band * 2);
    }
  } else {
    // 悪夢: 帯がでたらめにずれ、色が裏返る
    for (let k = 0; k < 14; k++) {
      const y = Math.floor(Math.random() * CH);
      const h = 4 + Math.floor(Math.random() * 40);
      ctx.drawImage(cv, 0, y, CW, h, Math.floor((Math.random() - 0.5) * 120), y + Math.floor((Math.random() - 0.5) * 20), CW, h);
    }
    if (Math.floor(t * 9) % 3 === 0) {
      ctx.globalCompositeOperation = "difference";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CW, CH);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.fillStyle = `rgba(150, 0, 20, ${0.18 + 0.12 * Math.random()})`;
    ctx.fillRect(0, 0, CW, CH);
  }
  ctx.restore();
};
