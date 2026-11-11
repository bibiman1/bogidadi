// 断片: 形而アップダウンクイズ(本番の画面を描く)。keiji.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";

// ---- 描く ----
const kjMix = (a, b, u) => a.map((v, i) => Math.round(v + (b[i] - v) * u));
const kjRgb = (c, a = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
const kjClamp = (v) => Math.max(0, Math.min(1, v));
const kjGy = (h) => KJ_BASE - Math.max(-KJ_SPAN, Math.min(KJ_SPAN, h)) * KJ_STEP; // その高さのゴンドラの床(画面)
// 目玉: 白目と黒目。黒目はきーのほうを見る
const kjEye = (ctx, x, y, r, tx, ty, open = 1) => {
  ctx.fillStyle = "#f4efe6";
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.3, r * open, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3a1c1c";
  ctx.lineWidth = 1;
  ctx.stroke();
  const a = Math.atan2(ty - y, tx - x);
  ctx.fillStyle = "#120c10";
  ctx.beginPath();
  ctx.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.35 * open, r * 0.5 * open, 0, Math.PI * 2);
  ctx.fill();
};
// 手足: ひじで曲がる細い腕と、小さな手
const kjLimb = (ctx, x, y, ang, len, t, k) => {
  const w = Math.sin(t * 3 + k) * 0.5;
  const ex = x + Math.cos(ang) * len * 0.55;
  const ey = y + Math.sin(ang) * len * 0.55;
  const hx = ex + Math.cos(ang + 0.7 + w) * len * 0.5;
  const hy = ey + Math.sin(ang + 0.7 + w) * len * 0.5;
  ctx.strokeStyle = "#d9b8a2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.fillStyle = "#d9b8a2";
  for (let f = -1; f <= 1; f++) ctx.fillRect(Math.round(hx + Math.cos(ang + 0.7 + w + f * 0.5) * 3), Math.round(hy + Math.sin(ang + 0.7 + w + f * 0.5) * 3), 2, 2);
};
// ゴンドラと、乗っている者
const KJ_LIFT = 11; // 解答席の絵(D516)は仮の箱より高いので、乗っている者をその分持ち上げる
const kjGondola = (ctx, api, who, x, gy0, t) => {
  const im = (k) => api.image(k);
  const gy = gy0 - (im("booth") ? KJ_LIFT : 0);
  // 乗っている者(箱の中に立つ。上半分が出る)
  if (who === "k" || who === "p") {
    const sh = im(who === "k" ? "ki" : "pi");
    if (sh) ctx.drawImage(sh, 0, 0, 64, 64, Math.round(x - 32), Math.round(gy - 8 - 64 + 17), 64, 64);
  } else if (who === "m") {
    const m = im("matryo");
    const open = kjS.phase === "watch" || kjS.phase === "close";
    const sh = kjS.phase === "endU" && kjEl() < KJ.win && kjS.winner !== "m" ? Math.round(Math.sin(t * 40) * 2) : 0; // くやしがる(D514)
    if (m) ctx.drawImage(m, Math.round(x - m.width / 2) + sh, Math.round(gy - 6 - m.height + (open ? 6 : 0)));
  } else if (who === "t") {
    const tb = im("tetsubin");
    if (tb) ctx.drawImage(tb, Math.round(x - tb.width / 2), Math.round(gy - 4 - tb.height));
  }
  if (kjMasked(who)) kjMask(ctx, x + KJ_FACE[who][0], gy + KJ_FACE[who][1]);
  const bt = im("booth"); // 解答席(D516)
  if (bt) ctx.drawImage(bt, Math.round(x - bt.width / 2), Math.round(gy0 - bt.height));
  else {
    ctx.fillStyle = "#c8b478";
    ctx.fillRect(Math.round(x - 16), Math.round(gy - 13), 32, 13);
    ctx.strokeStyle = "#4a3a24";
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x - 16) + 0.5, Math.round(gy - 13) + 0.5, 31, 12);
    ctx.fillStyle = "#f4f2ea"; // 解答札(白紙)
    ctx.fillRect(Math.round(x - 9), Math.round(gy - 10), 18, 6);
    ctx.fillStyle = "#d83a2c"; // 早押しボタン
    ctx.fillRect(Math.round(x - 2), Math.round(gy - 16), 4, 3);
  }
  kjCard(ctx, api, who, x + 23, gy - 30, t);
};
// 一回休みのバツのマスク(D522): お手つきした人は、次の問いのあいだ口にマスク
const KJ_FACE = { k: [0, -14], p: [0, -14], m: [0, -36], t: [-2, -20] }; // 口のあたり(床から)
const kjMasked = (who) => (kjS.rest[who] && ["q", "choose", "reveal", "steer", "move"].includes(kjS.phase)) || (kjS.phase === "reveal" && kjS.ans[who] === -3);
const kjMask = (ctx, cx, cy) => {
  const x = Math.round(cx - 7);
  const y = Math.round(cy - 4);
  ctx.fillStyle = "#3a3440"; // ひも
  ctx.fillRect(x - 4, y + 2, 4, 1);
  ctx.fillRect(x + 14, y + 2, 4, 1);
  ctx.fillStyle = "#f4f2ea";
  ctx.fillRect(x, y, 14, 9);
  ctx.fillStyle = "#c8c2b4";
  ctx.fillRect(x, y + 8, 14, 1);
  ctx.fillStyle = "#d8402c"; // バツ
  for (let k = 0; k < 7; k++) {
    ctx.fillRect(x + 3 + k, y + 1 + k, 2, 1);
    ctx.fillRect(x + 9 - k, y + 1 + k, 2, 1);
  }
};
// 解答札(D513): 答えると、選んだ絵が小さく出る。答え合わせで、正解は光り、まちがいは×。よくわからない物はにじむ
const KJ_PURPLE = "#4e4258"; // よくわからない物の地(くすんだ紫)
const kjCard = (ctx, api, who, x, y, t) => {
  if (!["q", "choose", "reveal", "steer", "move"].includes(kjS.phase)) return;
  x = Math.round(x);
  y = Math.round(y);
  if (kjS.rest[who]) {
    // 一回休み: 札は伏せたまま
    ctx.fillStyle = "#2a2430";
    ctx.fillRect(x, y, 18, 18);
    ctx.strokeStyle = "#6a5a4a";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, 17, 17);
    ctx.fillStyle = "#6a5a4a";
    for (let k = 3; k < 16; k += 4) ctx.fillRect(x + 3, y + k, 12, 1);
    if (window.bogiPix) window.bogiPix.text(ctx, "やすみ", x - 6, y - 12, 1, "#ffd75a"); // D517
    return;
  }
  const i = kjS.ans[who];
  if (i === undefined || i === -1 || i === -3) return; // お手つきは札を出さない(マスク)
  const c = i === -2 ? { key: null } : kjQ().choices[i]; // -2 は時間切れ(白紙で外れ)
  const im = c.key && api.image(c.key);
  ctx.fillStyle = c.unk ? KJ_PURPLE : "#f4f2ea";
  ctx.fillRect(x, y, 18, 18);
  ctx.strokeStyle = "#4a3a24";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, 17, 17);
  if (im) {
    if (c.unk) {
      // にじむ: 少しずらした薄い絵を重ねる
      ctx.globalAlpha = 0.4;
      ctx.drawImage(im, x + 2 + Math.round(Math.sin(t * 5) * 1.5), y + 2, 14, 14);
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(im, x + 2, y + 2, 14, 14);
  }
  if (kjS.phase === "q" || kjS.phase === "choose") return;
  // 答え合わせ(ふつうの問いは正しいおみやげ、よくわからない問いはよくわからない物を選ぶと、ゴンドラは下がらない)
  if (c.ok && !c.unk) {
    ctx.fillStyle = `rgba(255, 230, 140, ${0.3 + 0.2 * Math.sin(t * 8)})`;
    ctx.fillRect(x - 2, y - 2, 22, 22);
  } else if (!c.ok && !c.unk) {
    ctx.strokeStyle = "#e0402c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + 16, y + 16);
    ctx.moveTo(x + 16, y + 2);
    ctx.lineTo(x + 2, y + 16);
    ctx.stroke();
  }
};
// よくわからない物の目(D513): 一つ。ときどきまばたきする
const kjOddEye = (ctx, x, y, t, k) => {
  const blink = (t * 0.6 + k * 0.37) % 1 < 0.07;
  ctx.fillStyle = "#f2ece0";
  ctx.fillRect(x - 3, y - (blink ? 0 : 2), 7, blink ? 1 : 5);
  if (!blink) {
    ctx.fillStyle = "#140c14";
    ctx.fillRect(x - 1, y - 1, 3, 3);
  }
};
// おばけ(穴): 白い懲罰空間の色でぬく。ぼぎにはおばけの形に見える
const kjHole = (ctx, cx, cy, s, t) => {
  if (s <= 0) return;
  const w = 42 * s;
  const h = 54 * s;
  const x = cx - w / 2 + Math.sin(t * 1.3) * 2;
  const y = cy - h / 2 + Math.sin(t * 2.1) * 2;
  ctx.fillStyle = "#f7f7f9";
  ctx.beginPath();
  ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
  ctx.lineTo(x + w, y + h - 4 * s);
  for (let k = 3; k > 0; k--) ctx.arc(x + ((k - 0.5) * w) / 3, y + h - 4 * s, w / 6, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
};
const kjShowBack = (ctx, api, W, H) => {
  // 背景: 上ほど白く(形而上)、下ほど暗い塊(形而下)。まん中はスタジオの暗い縦穴
  const bg = api.image("kj_show"); // 左半分の絵を、右へ反転して並べる(D516)
  if (bg) {
    ctx.drawImage(bg, 0, 0);
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(bg, 0, 0);
    ctx.restore();
    // 上の帯(形而上)と下の帯(形而下)は、絵の上に重ねる
    for (let y = 0; y < H; y += 4) {
      const L = (KJ_BASE - y) / KJ_BG;
      const up = kjClamp((L - 3) / 2.5);
      const dn = kjClamp((-L - 3) / 2.5);
      if (up > 0) (ctx.fillStyle = `rgba(234, 232, 224, ${up * 0.92})`), ctx.fillRect(0, y, W, 4);
      if (dn > 0) (ctx.fillStyle = `rgba(62, 46, 34, ${dn * 0.85})`), ctx.fillRect(0, y, W, 4);
    }
  } else for (let y = 0; y < H; y += 4) {
    const L = (KJ_BASE - y) / KJ_BG;
    const up = kjClamp((L - 3) / 2.5); // 上の帯: 形而上(D513 でいつも見える)
    const dn = kjClamp((-L - 3) / 2.5); // 下の帯: 形而下
    let c = kjMix([22, 22, 30], [234, 232, 224], up);
    c = kjMix(c, [62, 46, 34], dn);
    ctx.fillStyle = kjRgb(c);
    ctx.fillRect(0, y, W, 4);
  }
  // 縦穴のはり(段ごと)
  ctx.fillStyle = "rgba(120, 120, 140, 0.18)";
  for (let k = -KJ_SPAN; k <= KJ_SPAN; k++) ctx.fillRect(0, Math.round(kjGy(k)), W, 1);
  // 形而上の帯に、おみやげの名前の字を浮かべていたのはやめた(D582、todo 226。作者「お土産の名前がかいてあるのもいらない」)
  // 形而下: 名前のはがれた塊
  for (let j = 0; j < 14; j++) {
    const L = -5.2 - (j % 6) * 0.9;
    const y = KJ_BASE - L * KJ_BG;
    const a = 0.35 + (j % 3) * 0.1;
    ctx.fillStyle = kjRgb([96 + (j % 5) * 9, 74 + (j % 3) * 6, 56], a);
    ctx.beginPath();
    ctx.ellipse(16 + ((j * 151) % 450), y, 6 + (j % 4) * 3, 4 + (j % 3), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // はじまりの高さ
  ctx.fillStyle = "rgba(255, 214, 100, 0.55)";
  ctx.fillRect(0, Math.round(kjGy(0)) + 1, W, 1);
  // 柱
  for (const who of ["m", "k", "p", "t"]) {
    ctx.fillStyle = "#8e8e9a";
    ctx.fillRect(KJ_X[who] - 2, 0, 4, H);
    ctx.fillStyle = "#6e6e7a";
    ctx.fillRect(KJ_X[who] + 1, 0, 1, H);
  }
};
const kjShowEyes = (ctx, t, e) => {
  // 不気味さ 4 から: セットに目玉が生える(柱に)
  const kx = KJ_X.k;
  const ky = kjGy(kjS.d.k) - 30;
  if (e >= 4) {
    const n = e >= 6 ? 26 : 8;
    for (let j = 0; j < n; j++) {
      const x = j % 2 ? KJ_X[["m", "p", "t"][j % 3]] : 30 + ((j * 97) % 420);
      const y = 20 + ((j * 61) % 230);
      kjEye(ctx, x, y, 3 + (j % 3), kx, ky, 0.5 + 0.5 * Math.abs(Math.sin(t * 0.7 + j)));
    }
  }
};
const kjShowGondolas = (ctx, api, t) => {
  // ゴンドラ
  for (const who of ["m", "k", "p", "t"]) {
    const hop = kjS.phase === "endU" && kjS.winner === who && kjEl() < KJ.win ? Math.abs(Math.sin(t * 9)) * 5 : 0; // 優勝した者がはねる
    // 怖さ(D522): 1 段からゴンドラが小さくゆれる。ぴーが当てると、しばらくぶるぶるゆれる(ぴーのがいちばん強い)
    const j = { m: 0, k: 1, p: 2, t: 3 }[who];
    const ra = kjClamp(1 - (t - kjS.rattle) / KJ.rattle);
    const wob = kjS.eerie * 0.5 * Math.sin(t * 6.5 + j * 1.7) + (ra ? ra * (who === "p" ? 5 : 3) * Math.sin(t * 61 + j * 2.3) : 0);
    const wy = ra ? ra * 2 * Math.sin(t * 47 + j) : 0;
    kjGondola(ctx, api, who, KJ_X[who] + wob, kjGy(kjS.d[who]) - hop + wy, t);
  }
};
const kjShowSteam = (ctx, t) => {
  // 鉄瓶の湯気: まちがえて怒るときと、見届けの輪
  kjS.steam = kjS.steam.filter((s) => t - s.t0 < 3.4);
  for (const s of kjS.steam) {
    const u = (t - s.t0) / 3.4;
    const sx = KJ_X.t - 10 - (s.angry ? 0 : u * (KJ_X.t - KJ_HOLE.x - 10));
    const sy = kjGy(kjS.d.t) - 51 - u * (s.angry ? 30 : 10);
    ctx.strokeStyle = `rgba(190, 190, 204, ${1 - u})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 5 + u * (s.angry ? 6 : 16), 3 + u * (s.angry ? 3 : 8), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
};
const kjShowMark = (ctx, t, W) => {
  // 物自体の気配(D514): きーがはじまりの高さにいるあいだ、まん中にうすいおばけがちらつく。離れるとうすれ、2 段で消える
  if (["intro", "q", "choose", "reveal", "steer", "move"].includes(kjS.phase)) {
    // はじまりの高さの目印(D517): 光る床の帯を、いつも出す
    const my = Math.round(kjGy(0));
    const gl = 0.45 + 0.15 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(255, 236, 170, ${gl * 0.35})`;
    ctx.fillRect(0, my - 2, W, 6);
    ctx.fillStyle = `rgba(255, 244, 200, ${gl})`;
    ctx.fillRect(0, my + 1, W, 1);
    for (const ex of [6, W - 12]) {
      ctx.fillStyle = `rgba(255, 244, 200, ${gl + 0.2})`; // 両はしの小さな菱形
      for (let k = 0; k < 4; k++) ctx.fillRect(ex + 3 - k, my - 3 + k, k * 2 + 1, 1), ctx.fillRect(ex + 3 - k, my + 5 - k, k * 2 + 1, 1);
    }
    const near = kjClamp(1 - Math.abs(kjS.d.k) / 2);
    if (near > 0) {
      const fl = 0.5 + 0.5 * Math.sin(t * 2.3) * Math.sin(t * 0.9 + 1);
      ctx.globalAlpha = near * (0.45 + 0.3 * fl); // きーがいるあいだは、はっきり白く
      kjHole(ctx, KJ_HOLE.x, kjGy(0) + KJ_HOLE.y, 1, t);
      ctx.globalAlpha = 1;
    }
  }
};
const kjShowThing = (ctx, api, t) => {
  // 露出(D504、D507): きーのとなりの絵がはがれて穴があく。見届けでは、小さな人形たちがまわりで遊ぶ
  if (["gather", "watch", "close", "gift"].includes(kjS.phase)) {
    const el = kjEl();
    const s = kjS.phase === "gather" ? kjClamp(el / KJ.gather) : kjS.phase === "close" ? 1 - kjClamp(el / KJ.close) : kjS.phase === "gift" ? 0 : 1;
    // 励まし(D519): 見届けの終わりに、物自体がきーのそばまで寄り、うなずくように一度ゆれて、閉じる
    const go = kjS.phase === "watch" ? kjClamp((el - (KJ.watch - 4)) / 1.6) : kjS.phase === "close" || kjS.phase === "gift" ? 1 : 0;
    const ease = go * go * (3 - 2 * go);
    const nodU = kjS.phase === "watch" ? kjClamp((el - (KJ.watch - 2)) / 1.2) : 0;
    const nod = Math.sin(nodU * Math.PI) * 6;
    const hx = KJ_HOLE.x + (KJ_X.k + 40 - KJ_HOLE.x) * ease;
    const hy = kjGy(0) + KJ_HOLE.y + nod;
    kjHole(ctx, hx, hy, s, t);
    if (kjS.phase === "watch" && ease < 1) {
      ctx.globalAlpha = 1 - ease; // 物自体が寄っていくあいだに、人形はうすれる
      const dolls = [["matryo_s", 0], ["matryo_xs", 2.1], ["matryo_xs", 4.2]];
      for (const [k, ph] of dolls) {
        const im = api.image(k);
        if (!im) continue;
        const a = t * 1.1 + ph;
        const u = kjClamp(el / 2); // 人形が出てくる
        const x = hx + Math.cos(a) * 40 * u;
        const y = hy + 36 + Math.sin(a) * 16 * u - Math.abs(Math.sin(t * 5 + ph)) * 6;
        ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height));
      }
      ctx.globalAlpha = 1;
    }
  }
};
const kjShowNight = (ctx, t, W, H, e) => {
  // 不気味さ 1 から: 暗くなる
  if (e >= 1) {
    ctx.fillStyle = `rgba(6, 4, 10, ${Math.min(0.6, e * 0.11)})`;
    ctx.fillRect(0, 0, W, H);
  }
  // 悪夢(D511): 手足が生える
  if (e >= 6) {
    for (let j = 0; j < 18; j++) {
      const x = j % 3 === 0 ? KJ_X[["m", "k", "p", "t"][j % 4]] : (j * 131) % W;
      const y = 10 + ((j * 53) % 260);
      kjLimb(ctx, x, y, (j * 1.3) % (Math.PI * 2), 18 + (j % 4) * 6, t, j);
    }
  }
};
const kjShowScreen = (ctx, api, t) => {
  // 白い幕と影(洞窟の比喩 D508)。カメラが動いても、いつも上に見えている
  if (["intro", "q", "choose", "reveal", "steer", "move"].includes(kjS.phase)) {
    const lampOn = kjS.phase === "intro" ? 0 : 1;
    ctx.fillStyle = "#1a1820";
    ctx.fillRect(196, 6, 88, 66);
    const g = ctx.createRadialGradient(240, 40, 4, 240, 40, 46);
    // 変な物の問いは紫がかった暗い幕(D517)。ぴーがいつもわざと押すのが分かる(D598。D527 の白い幕をやめた)
    const odd = kjS.phase !== "intro" && kjQ() && kjQ().kind === "u";
    g.addColorStop(0, odd ? "#a898b4" : "#f0eadb");
    g.addColorStop(1, odd ? "#5e4e6c" : "#cfc6b0");
    ctx.fillStyle = g;
    ctx.fillRect(200, 10, 80, 58);
    const q = kjQ();
    if (q && kjS.phase !== "intro") {
      const sil = kjSil(api.image(q.sil), q.sil);
      if (sil) kjDrawSil(ctx, sil, 216, 15, q, t);
    }
    // ランプ 8 つ(1 秒ずつ消える)
    for (let i = 0; i < 8; i++) {
      const left = kjS.phase === "q" ? KJ.qSec - kjEl() : kjS.phase === "choose" ? KJ.qSec - kjS.qEl : 0;
      const hot = kjS.phase === "choose" && Math.sin(t * 18) > 0; // 押したあとは点滅
      const on = kjQ() && kjQ().kind === "u" ? "#b07ad8" : "#ffd75a"; // 変な物の問いはランプも紫(D517、D598)
      const skip = kjS.eerie >= 2 && kjRnd(Math.floor(t * 6) * 13 + i) < 0.1 * kjS.eerie; // 怖さ 2 から: ランプが飛び飛びに消える
      ctx.fillStyle = lampOn && i < Math.ceil(left) && !skip ? (hot ? "#ff7a4a" : on) : "#3a3228";
      ctx.fillRect(208 + i * 9, 74, 5, 4);
    }
    if (kjS.eerie > 0 && kjS.phase !== "intro") kjGlitchScreen(ctx, kjS.eerie * 0.45, t); // 怖さ 1 から: 幕が少しにじむ(段ごとに強く)
  }
};
const kjShowAnswers = (ctx, api, t) => {
  // 答えの窓: 黒地に白の二重枠。絵が 3 つ
  if (["q", "choose", "reveal", "steer", "move"].includes(kjS.phase)) {
    const q = kjQ();
    const x0 = 140;
    const y0 = 222;
    ctx.fillStyle = "#000";
    ctx.fillRect(x0, y0, 200, 60);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 1.5, y0 + 1.5, 197, 57);
    ctx.strokeRect(x0 + 4.5, y0 + 4.5, 191, 51);
    if (kjS.phase === "q" && !kjS.rest.k) {
      // 早押しボタン(A で押す)
      const on = Math.sin(t * 6) > 0;
      ctx.fillStyle = on ? "#ff5a3c" : "#a8302a";
      ctx.fillRect(x0 + 186, y0 + 48, 8, 5);
    }
    if (kjS.phase === "steer" && window.bogiPix) {
      // きーが当てた(D522): ↑・とどまる・↓ から選ぶ。はじめは「とどまる」
      const P = window.bogiPix;
      P.text(ctx, "ゴンドラを どうする?", x0 + 100 - P.width("ゴンドラを どうする?") / 2, y0 + 9, 1, "#f4f2ea");
      ["↑", "とどまる", "↓"].forEach((lb, i) => {
        const cx = x0 + 40 + i * 60;
        const w = P.width(lb) + 10;
        const on = kjS.cur === i;
        ctx.fillStyle = on ? "#3a3020" : "#000";
        ctx.fillRect(cx - w / 2, y0 + 28, w, 22);
        ctx.strokeStyle = on ? "#ffd75a" : "#6a6a7a";
        ctx.strokeRect(Math.round(cx - w / 2) + 0.5, y0 + 28.5, Math.round(w) - 1, 21);
        P.text(ctx, lb, Math.round(cx - P.width(lb) / 2), y0 + 31, 1, on ? "#ffd75a" : "#c8c2b4");
      });
    } else if (kjS.rest.k && kjS.phase === "q" && window.bogiPix) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(x0, y0, 200, 60);
      window.bogiPix.text(ctx, "1かいやすみ", x0 + 100 - window.bogiPix.width("1かいやすみ") / 2, y0 + 24, 1, "#ffd75a");
    } else q.choices.forEach((c, i) => {
      const x = x0 + 22 + i * 58;
      const y = y0 + 14;
      const im = api.image(c.key);
      if (c.unk) {
        ctx.fillStyle = KJ_PURPLE;
        ctx.fillRect(x - 1, y - 1, 34, 34);
      }
      if (im) ctx.drawImage(im, x, y, 32, 32);
      if (c.unk) kjOddEye(ctx, x + 22, y + 9, t, i);
      const mine = kjS.ans.k === i;
      if (kjS.phase === "choose" && kjS.cur === i) {
        ctx.strokeStyle = "#ffd75a";
        ctx.strokeRect(x - 3.5, y - 3.5, 39, 39);
      } else if (mine) {
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(x - 3.5, y - 3.5, 39, 39);
      }
      // 答え合わせ: 正しいほうが光る
      if ((kjS.phase === "reveal" || kjS.phase === "move") && c.ok) {
        ctx.fillStyle = `rgba(255, 230, 140, ${0.25 + 0.2 * Math.sin(t * 8)})`;
        ctx.fillRect(x - 2, y - 2, 36, 36);
      }
    });
  }
};
const kjShowEnding = (ctx, t, W, H) => {
  // 上で終わる: まぶしく白い字の中へ(D508 の 4)/ 下で終わる: 暗い塊の中へ
  if (kjS.phase === "endU" || kjS.phase === "endD") {
    const u = kjS.phase === "endU" ? kjClamp((kjEl() - KJ.win) / ((KJ.endSecU - KJ.win) * 0.7)) : kjClamp((kjEl() - KJ.prize) / ((KJ.endSec - KJ.prize) * 0.7));
    if (kjS.phase === "endU" && kjEl() < KJ.win + 0.6) kjWin(ctx, t, kjEl());
    if (kjS.phase === "endD") kjPrize(ctx, t, kjEl());
    ctx.fillStyle = kjS.phase === "endU" ? `rgba(255, 253, 244, ${u})` : `rgba(28, 18, 12, ${u})`;
    ctx.fillRect(0, 0, W, H);
    if (kjS.phase === "endU") {
      const g = ctx.createRadialGradient(240, 40, 2, 240, 40, 180 * u + 10);
      g.addColorStop(0, `rgba(255, 255, 255, ${u})`);
      g.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }
};
const kjDrawShow = (ctx, ox, oy, api) => {
  const t = kjS.t;
  const W = 480;
  const H = 288;
  ctx.save();
  ctx.translate(ox, oy);
  kjShowBack(ctx, api, W, H);
  const e = kjS.phase === "night" ? 6 : kjS.eerie; // 不気味さ(悪夢のあいだは 6)
  kjShowEyes(ctx, t, e);
  kjShowGondolas(ctx, api, t);
  kjShowSteam(ctx, t);
  kjShowMark(ctx, t, W);
  kjShowThing(ctx, api, t);
  kjShowNight(ctx, t, W, H, e);
  kjShowScreen(ctx, api, t);
  if (kjS.phase === "intro") kjRules(ctx, api, t);
  kjShowAnswers(ctx, api, t);
  if (["reveal", "steer", "move"].includes(kjS.phase)) kjShowResult(ctx, t);
  if (["q", "choose", "reveal", "steer", "move"].includes(kjS.phase)) kjMeter(ctx, t), kjGauge(ctx, t);
  kjShowEnding(ctx, t, W, H);
  ctx.restore();
  // 不気味さ 3 から: 画面がゆがむ(横の帯をずらす)/ 悪夢: めちゃくちゃにバグる
  if (e >= 3) kjDistort(ctx, e, t);
  // ぴーの混沌(D520): 当てた直後は画面全体がめちゃくちゃにこわれる。そのあとも、混沌が残る間は、ときどき全体にバグが走る
  // 怖さ(D522): 上がった直後は段に合わせて短くこわれる。3 段からは、ときどき全体にバグが走る。5 段でめちゃくちゃにこわれる
  if (kjBursting()) kjChaosBurst(ctx, kjS.burst.c, t, (kjS.t - kjS.burst.t0) / kjS.burst.len, api);
  else if (kjS.eerie >= 3 && ["q", "choose", "reveal", "steer", "move"].includes(kjS.phase)) {
    const c = (kjS.eerie - 2) * 0.5;
    const w = t % (3.6 - c * 0.8); // 一定の間をおいて、短く走る
    if (w < 0.2 + 0.1 * c) kjChaosBurst(ctx, c * 0.6, t, 0.5, api);
  }
};
// ルール(D514): 1 問目の前に、幕に映す。絵が主で、字は少し。変な物を選ぶと何が起きるかは見せない
const kjArrow = (ctx, x, y, up, col) => {
  ctx.fillStyle = col;
  for (let k = 0; k < 6; k++) ctx.fillRect(x - k, up ? y + k : y + 10 - k, k * 2 + 1, 1);
  ctx.fillRect(x - 2, up ? y + 6 : y, 5, 5);
};
// 答え合わせ(D517、D522): 押した人の上に ○ か ×。わきに何が起きるか(↑1、こわさ+1、こわさ-1)。お手つきはバツのマスクと紫のふち
const kjShowResult = (ctx, t) => {
  const who = kjS.buzz;
  if (!who) return;
  const i = kjS.ans[who];
  if (i === undefined || i === -1) return;
  const c = i === -2 || i === -3 ? {} : kjQ().choices[i];
  const kind = i === -3 ? "odd" : c.ok ? "up" : "down";
  const x = KJ_X[who];
  const y = Math.max(14, Math.round(kjGy(kjS.d[who]) - 78));
  const pop = Math.min(1, (kjS.phase === "reveal" ? kjEl() : 1) * 5); // ぽんと出る
  ctx.save();
  ctx.lineWidth = 4;
  if (kind === "up") {
    ctx.strokeStyle = "#ffd75a";
    ctx.beginPath();
    ctx.arc(x, y, 11 * pop, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "down") {
    ctx.strokeStyle = "#e0402c";
    const r = 10 * pop;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r);
    ctx.lineTo(x + r, y + r);
    ctx.moveTo(x + r, y - r);
    ctx.lineTo(x - r, y + r);
    ctx.stroke();
  } else if (kjS.phase === "reveal") {
    // 画面のふちが紫に光る(変な物の影だった)
    ctx.strokeStyle = `rgba(176, 122, 216, ${0.5 + 0.4 * Math.sin(t * 10)})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 474, 282);
  }
  ctx.restore();
  const P = window.bogiPix;
  if (!P || kjS.phase !== "reveal") return;
  const txt = kind === "odd" ? "おてつき こわさ+1" : kind === "down" ? "こわさ+1" : who === "p" ? "こわさ+1" : who === "k" ? "こわさ-1" : "↑1";
  const col = txt === "↑1" ? "#ffd75a" : txt === "こわさ-1" ? "#a8e0c0" : "#c8a0e8";
  // ○×の横(鉄瓶は左)に、暗い地をしいて
  const tw = P.width(txt);
  const tx = Math.round(kind === "odd" ? x - tw / 2 : who === "t" ? x - 16 - tw : x + 16);
  const ty = Math.round(y - 8);
  ctx.fillStyle = "rgba(14, 12, 20, 0.78)";
  ctx.fillRect(tx - 3, ty - 1, tw + 6, 18);
  P.text(ctx, txt, tx, ty, 1, col);
};
// 不気味さの目盛り(D517): 右上に目玉の印が 5 つ。積もるたびに 1 つ開く
const kjMeter = (ctx, t) => {
  for (let k = 0; k < KJ.eerieMax; k++) {
    const x = 404 + k * 14;
    const y = 12;
    const open = k < kjS.eerie;
    ctx.fillStyle = "rgba(20, 14, 24, 0.7)";
    ctx.fillRect(x - 6, y - 5, 13, 10);
    if (open) kjOddEye(ctx, x, y, t, k);
    else {
      ctx.fillStyle = "#6a5a7a";
      ctx.fillRect(x - 3, y, 7, 1);
    }
  }
};
// 高さの目盛り(D519、D520): 左はしに縦の目盛り。上が形而上、下が形而下(対になる 2 つ)。まん中の金の刻みは字なしで、きーの居場所。4 人の印がいまの高さに並ぶ
const KJ_MARK = { m: "#d8402c", k: "#f4e6b0", p: "#f0a0b8", t: "#4a4a52" };
// 字を縦に書く(日本語は 1 字ずつ下へ。英語は横に寝かせる)
const kjVText = (ctx, txt, cx, cy, col) => {
  const P = window.bogiPix;
  if (!P) return;
  const en = window.bogiLang && window.bogiLang.tr(txt) !== txt;
  if (en) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 2);
    P.text(ctx, txt, -P.width(txt) / 2, -8, 1, col);
    ctx.restore();
    return;
  }
  const chars = [...txt];
  chars.forEach((ch, i) => P.text(ctx, ch, cx - P.width(ch) / 2, cy - (chars.length * 16) / 2 + i * 16, 1, col));
};
const kjGauge = (ctx, t) => {
  const top = kjGy(KJ_SPAN);
  const bot = kjGy(-KJ_SPAN);
  ctx.fillStyle = "rgba(14, 12, 20, 0.72)";
  ctx.fillRect(0, top - 34, 40, bot - top + 68);
  // 字(左の列)
  kjVText(ctx, "形而上", 10, top + 4, "#f4f2ea");
  kjVText(ctx, "形而下", 10, bot - 4, "#c8a88e");
  // 目盛りの棒(右の列)。上ほど白く、下ほど暗い
  const bx = 22;
  for (let y = top; y < bot; y += 2) {
    const u = (y - top) / (bot - top);
    ctx.fillStyle = kjRgb(kjMix(kjMix([240, 238, 230], [120, 110, 120], Math.min(1, u * 2)), [120, 86, 60], Math.max(0, u * 2 - 1)));
    ctx.fillRect(bx, y, 2, 2);
  }
  for (let k = -KJ_SPAN; k <= KJ_SPAN; k++) {
    const y = Math.round(kjGy(k));
    ctx.fillStyle = k === 0 ? `rgba(255, 228, 140, ${0.75 + 0.25 * Math.sin(t * 3)})` : "#8a8494";
    ctx.fillRect(k === 0 ? 18 : 20, y, k === 0 ? 22 : 6, 1);
  }
  // 4 人の印(右へずらして並べる。きーは大きく、白いふち)
  ["m", "t", "p", "k"].forEach((who) => {
    const i = { m: 0, k: 1, p: 2, t: 3 }[who];
    const y = Math.round(kjGy(kjS.d[who]));
    const x = 27 + i * 4;
    const r = who === "k" ? 3 : 2;
    ctx.fillStyle = who === "k" ? "#ffffff" : "#bdb6c8"; // ふち(暗い鉄瓶も見えるように)
    ctx.fillRect(x - r - 1, y - r - 1, r * 2 + 3, r * 2 + 3);
    ctx.fillStyle = KJ_MARK[who];
    ctx.fillRect(x - r, y - r, r * 2 + 1, r * 2 + 1);
  });
};
