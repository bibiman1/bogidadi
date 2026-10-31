// 断片: 形而アップダウンクイズ(D503〜D511)。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kGrid など)をそのまま使う
"use strict";

// ======== 形而アップダウンクイズ ========
// 夜の古いテレビ局のスタジオ。ぼぎのテレビの番組で、撮影隊のききこり(カメラ)とごろん(ディレクター、司会)が撮る(D505)
// 解答者は、きー、マトリョーシカ、ぴー、鉄瓶。ゴンドラは 4 つ(D511)
// 本番の画面だけは上下で動く。上が形而上(物が名前や字にほどける)、下が形而下(名前がはがれ、形と重さだけの塊)(D504)
// クイズ(D507〜D510): 白い幕に影だけが映る。答えは絵を 3 つから選ぶ。1 問 8 秒、出さなければ黙った(動かない)。
//   問いは 2 種類で、毎回シャッフル(ふつう 5、よくわからない 5)
//   ふつうの問い: おみやげの影 → 正しいおみやげで上がる(不気味さは 0 に戻る)。まちがいで下がる
//   よくわからない問い: よくわからない物を選ぶと、動かずに不気味さが 1 段積もる。ぴーは毎回それを選ぶ(D511)
//   不気味さ(5 段): 暗い → 音楽のテンポがくるう → 画面がゆがむ → セットに目玉 → 手足で悪夢(番組がこわれて、やり直し)
// 洞窟の比喩(D508): 幕はうしろから照らされ、塀の上を棒にさした物が通って影を落とす。空の客席から拍手だけ(こだま)
// 10 問のあと、はじまりの高さなら、となりの絵がはがれて穴があく(物自体。白い懲罰空間がすける)。ぼぎにはおばけに見える。
//   小さな人形たちと鉄瓶の湯気の輪が、おばけと遊ぶ(見届け、約 20 秒)。穴はその場で閉じる。おみやげ「白紙の解答札」
// 絵はすべて仮(下絵。docs/assets/keiji/)。本番の絵は、遊んでもらったあと PixelLab に(D512)
// 人物の動き(マトリョーシカがふつうの問いで正解して上がる、よくわからない問いでは黙る、鉄瓶は半分まちがえる)と秒数は仮

const KJ_SOUV = [
  ["氷のかけら", "ic_kori"],
  ["おたかぽっぽ", "ic_poppo"],
  ["蓮の花", "ic_hasu"],
  ["マンゴー", "ic_mango"],
  ["納品書", "ic_nouhin"],
  ["白紙の海図", "ic_kaizu"],
  ["クラブの札", "ic_fuda"],
  ["水あめのわりばし", "ic_ame"],
  ["焼けたピザのひと切れ", "ic_slice"],
  ["安全ピンのリボン", "ic_ribbon"],
];
const KJ_UNK = ["u1", "u2", "u3", "u4", "u5", "u6"]; // よくわからない物(影は docs/assets/keiji/plan/unknown_sil.py)
const KJ_CARD = "白紙の解答札";
// 秒数の表(仮)
const KJ = {
  qN: 10,
  qSec: 8, // 1 問の長さ(ランプ 8 つ)
  rulePage: 4.2, // ルール 1 枚の長さ(4 枚。A で次へ D517)
  reveal: 2.5, // 答えが出てから、ゴンドラが動きだすまで(○×と↑↓を見せる D517)
  move: 1.1, // ゴンドラが動いて、次の問いまで
  // 早押し(D515): いちばん先に押した 1 人だけが答える
  mAt: 3.5, // マトリョーシカが押す秒(ふつうの問いだけ)
  pAt: 2.5, // ぴーが押す秒(よくわからない問いだけ)
  tAt: [2.5, 6.0], // 鉄瓶が押す秒(この間でばらつく)
  tPress: 0.7, // 鉄瓶が押す見こみ
  choose: 3, // きーが押してから選ぶまで(時間切れは外れ)
  eerieMax: 5,
  night: 3.8, // 悪夢の場面
  endSec: 3.2, // 下で終わる場面
  endSecU: 5.2, // 上で終わる場面(番組の上では優勝 D514。紙吹雪のあと、字の白い世界にほどける)
  win: 2.2, // 優勝の紙吹雪
  gather: 2.4, // 露出: ほかのゴンドラが寄ってくる
  watch: 20, // 見届け
  close: 1.6, // 穴が閉じる
};
// 本番の画面(480×288)の中の位置
// 上下は一画面(D513): カメラは動かさず、4 人がいつも見える。表示は上下 KJ_SPAN 段で止める(高さの数は D506 のまま数える)
const KJ_X = { m: 60, k: 150, p: 330, t: 420 }; // ゴンドラの柱(左から マトリョーシカ、きー、ぴー、鉄瓶)。まん中は幕
const KJ_BASE = 135; // はじまりの高さのゴンドラの床
const KJ_STEP = 15; // 1 段
const KJ_SPAN = 5; // 表示で止める段
const KJ_HOLE = { x: 240, y: -40 }; // 露出の穴(きーとぴーのあいだ。y ははじまりの高さの床から)
const kjS = { phase: "idle", lastSteam: 0, t: 0, t0: 0, qs: [], qi: 0, h: { m: 0, k: 0, p: 0, t: 0 }, d: { m: 0, k: 0, p: 0, t: 0 }, ans: {}, cur: 1, lastX: 0, eerie: 0, steam: [] };
const kjShuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
// 10 問を組む(D510): ふつう 5、よくわからない 5 を、まぜた順で。おみやげは 10 のうち 5 つ、よくわからない物は 6 つのうち 5 つ
const kjBuild = () => {
  const souv = kjShuffle(KJ_SOUV.slice());
  const unk = kjShuffle(KJ_UNK.slice());
  const kinds = kjShuffle(["n", "n", "n", "n", "n", "u", "u", "u", "u", "u"]);
  let si = 0;
  let ui = 0;
  const other = (not) => kjShuffle(KJ_SOUV.filter((s) => !not.includes(s[1])))[0];
  return kinds.map((k) => {
    if (k === "n") {
      const s = souv[si++];
      const o = other([s[1]]);
      const u = unk[Math.floor(Math.random() * unk.length)];
      return { kind: "n", sil: s[1], choices: kjShuffle([{ key: s[1], ok: true }, { key: o[1] }, { key: u, unk: true }]) };
    }
    const u = unk[ui++];
    const a = other([]);
    const b = other([a[1]]);
    // よくわからない問い: 正しいおみやげは並ばない。正しい手は黙ること(D514)
    return { kind: "u", sil: u, choices: kjShuffle([{ key: u, unk: true }, { key: a[1] }, { key: b[1] }]) };
  });
};
// 影: 絵をまっ黒にぬった物(読めたら一度だけ作る)
const kjSilCache = {};
const kjSil = (im, key) => {
  if (kjSilCache[key]) return kjSilCache[key];
  if (!im || !im.width) return null;
  const c = document.createElement("canvas");
  c.width = im.width;
  c.height = im.height;
  const g = c.getContext("2d");
  g.drawImage(im, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = "#16141a";
  g.fillRect(0, 0, c.width, c.height);
  kjSilCache[key] = c;
  return c;
};
const kjWarp = (k) => window.bogiAudio && window.bogiAudio.bgmWarp && window.bogiAudio.bgmWarp(k);
const kjReset = () => {
  Object.assign(kjS, { phase: "idle", lastSteam: 0, t: 0, t0: 0, qs: [], qi: 0, ans: {}, rest: {}, page: 0, buzz: null, when: {}, qEl: 0, winner: null, cur: 1, eerie: 0, steam: [] });
  kjS.h = { m: 0, k: 0, p: 0, t: 0 };
  kjS.d = { m: 0, k: 0, p: 0, t: 0 };
  kjWarp(0);
};
const kjStart = () => {
  kjReset();
  kjS.qs = kjBuild();
  kjS.phase = "intro";
};
const kjQ = () => kjS.qs[kjS.qi];
const kjEl = () => kjS.t - kjS.t0;
const kjGo = (phase) => {
  kjS.phase = phase;
  kjS.t0 = kjS.t;
};
// ある解答者が、どの絵を選ぶか(仮の性格)
const kjPick = (who, q) => {
  if (kjS.rest[who]) return -1; // 一回休み(D514)
  const ok = q.choices.findIndex((c) => c.ok);
  const unk = q.choices.findIndex((c) => c.unk);
  const souv = q.choices.map((c, i) => (c.unk ? -1 : i)).filter((i) => i >= 0);
  // ぴー(D514、D515): よくわからない問いで、影と同じ形の変な物に飛びつく
  if (who === "p") return unk;
  if (who === "m") return ok; // マトリョーシカは、ふつうの問いで当てる
  // 鉄瓶: ふつうの問いは半分まちがえる。よくわからない問いは、おみやげを選んでまちがえる
  if (q.kind === "n") return Math.random() < 0.5 ? ok : souv.find((i) => i !== ok);
  return souv[Math.floor(Math.random() * souv.length)];
};
// 問いのはじめに、ほかの 3 人がいつ押すかを決める(D515)。押さない者は Infinity
const kjBeginQ = (api) => {
  const q = kjQ();
  if (api) api.sfx(q.kind === "u" ? "kjOdd" : "kjNorm"); // 問いの合図: よくわからない問いは濁った音(D517)
  const r = (w) => (kjS.rest[w] ? Infinity : 0);
  const [a, b] = KJ.tAt;
  kjS.when = {
    m: r("m") || (q.kind === "n" ? KJ.mAt + Math.random() * 0.6 : Infinity),
    p: r("p") || (q.kind === "u" ? KJ.pAt + Math.random() * 0.4 : Infinity),
    t: r("t") || (Math.random() < KJ.tPress ? a + Math.random() * (b - a) : Infinity),
  };
  kjS.ans = {};
  kjS.buzz = null;
  kjS.cur = 1;
  kjGo("q");
};
// 答えが出たら: 上がる・下がる・積もる
const kjJudge = (api) => {
  // ルール(D514): 同じおみやげ → 上がる / ちがうおみやげ → 下がり、次は一回休み / 変な物 → 不気味さが積もる(動かない)/ 黙る → 動かない
  const q = kjQ();
  let reset = false;
  const rest = {};
  for (const who of ["m", "k", "p", "t"]) {
    const i = kjS.ans[who];
    if (i === undefined || i === -1) continue; // 押さなかった(休みもふくむ)
    const c = i === -2 ? { late: true } : q.choices[i]; // -2 は時間切れ(外れ)
    if (c.unk) kjS.eerie += 1; // 答えてはいけない物を答えた
    else if (c.ok) {
      kjS.h[who] += 1;
      if (who === "k") reset = true;
    } else {
      kjS.h[who] -= 1;
      rest[who] = true;
      if (who === "t") kjS.steam.push({ t0: kjS.t, angry: true });
    }
  }
  kjS.rest = rest;
  if (reset) kjS.eerie = 0; // きーが正しいおみやげを当てると、不気味さは消える(D509)
  kjS.eerie = Math.min(KJ.eerieMax, kjS.eerie);
  kjWarp(kjS.eerie >= 2 ? kjS.eerie - 1 : 0);
  api.sfx("clap"); // 空の客席から、拍手だけ(こだま D508 の 3)
};
const kjBackToStudio = (api) => {
  const ended = kjS.phase === "endU" || kjS.phase === "endD";
  kjWarp(0);
  kjS.phase = "leaving"; // 暗転のあいだに、もう一度始まらないように
  api.warp("studio", "stage");
  // 上か下で終わった 1 回目だけ、ごろんが一言(D517。目的はルールでは言わない)
  if (ended && !api.flag("hintMiddle")) {
    api.setFlag("hintMiddle");
    api.later(1400, () => api.bubble("goron", "まんなかに なにか いたような……", 3200));
  }
};
// 本番の進み(毎フレーム)
const kjTick = (api, dt) => {
  kjS.t += dt;
  // 表示の高さは、ほんとうの高さへ寄っていく
  for (const k of ["m", "k", "p", "t"]) kjS.d[k] += (kjS.h[k] - kjS.d[k]) * Math.min(1, dt * 3.2);
  const el = kjEl();
  const P = kjS.phase;
  if (P === "intro" && el > KJ.rulePage) {
    kjS.page += 1; // ルールの次の 1 枚
    kjS.t0 = kjS.t;
    if (kjS.page >= KJ_PAGES) {
      kjS.qi = 0;
      kjBeginQ(api);
    }
  } else if (P === "q") {
    // 早押し(D515): いちばん先に押した者だけが答える
    const q = kjQ();
    const first = ["m", "p", "t"].filter((w) => el > kjS.when[w]).sort((a, b) => kjS.when[a] - kjS.when[b])[0];
    if (first) {
      kjS.buzz = first;
      kjS.qEl = el;
      kjS.ans[first] = kjPick(first, q);
      api.sfx("pinpon");
      kjGo("reveal");
    } else if (el > KJ.qSec) {
      kjS.qEl = el;
      kjGo("reveal"); // だれも押さなかった
    }
  } else if (P === "choose" && el > KJ.choose) {
    kjS.ans.k = -2; // 時間切れは外れ
    kjGo("reveal");
  } else if (P === "reveal" && el > KJ.reveal) {
    kjJudge(api);
    kjGo("move");
  } else if (P === "move" && el > KJ.move) {
    if (kjS.eerie >= KJ.eerieMax) {
      kjGo("night");
      api.sfx("boom");
      kjWarp(6);
      return;
    }
    kjS.qi += 1;
    if (kjS.qi < KJ.qN) {
      kjBeginQ(api);
      return;
    }
    // 10 問のあと
    if (kjS.h.k > 0) {
      // 優勝は、いちばん高い人(D515。並んだらきー)
      kjS.winner = ["k", "m", "p", "t"].reduce((a, b) => (kjS.h[b] > kjS.h[a] ? b : a));
      kjGo("endU");
      api.sfx("clap");
      api.sfx("item");
    }
    else if (kjS.h.k < 0) kjGo("endD");
    else {
      kjGo("gather");
      kjS.h.m = kjS.h.p = kjS.h.t = 0; // ほかのゴンドラも、同じ高さまで寄ってくる
      kjS.eerie = 0;
      kjWarp(0);
      if (window.bogiAudio) window.bogiAudio.bgm("silence"); // 音が止む
    }
  } else if ((P === "endU" && el > KJ.endSecU) || (P === "endD" && el > KJ.endSec)) kjBackToStudio(api);
  else if (P === "night" && el > KJ.night) kjBackToStudio(api);
  else if (P === "gather" && el > KJ.gather) kjGo("watch");
  else if (P === "watch") {
    if (el > 2 && el < KJ.watch - 4 && kjS.t - (kjS.lastSteam || 0) > 2.4) {
      kjS.steam.push({ t0: kjS.t }); // 鉄瓶は怒らずに、湯気の輪をぽっと吹く
      kjS.lastSteam = kjS.t;
    }
    if (el > KJ.watch) kjGo("close");
  } else if (P === "close" && el > KJ.close) {
    kjS.phase = "gift";
    api.observe(); // 見届け
    api.later(1800, () => {
      api.setFlag("lit"); // スタジオの明かりがつく(塀の上に物が並んで止まっている D508)
      api.warp("studio", "stage");
      api.later(1300, () =>
        api.hold("ic_kaitou", 1.8, () => {
          api.sfx("item");
          if (!api.hasItem(KJ_CARD)) api.giveItem(KJ_CARD);
          api.clear();
          kjS.phase = "idle";
        })
      );
    });
  }
};
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
// 解答札(D513): 答えると、選んだ絵が小さく出る。答え合わせで、正解は光り、まちがいは×。よくわからない物はにじむ
const KJ_PURPLE = "#4e4258"; // よくわからない物の地(くすんだ紫)
const kjCard = (ctx, api, who, x, y, t) => {
  if (!["q", "choose", "reveal", "move"].includes(kjS.phase)) return;
  x = Math.round(x);
  y = Math.round(y);
  if (kjS.rest[who] && kjS.phase !== "move") {
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
  if (i === undefined || i === -1) return;
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
const kjDrawShow = (ctx, ox, oy, api) => {
  const t = kjS.t;
  const W = 480;
  const H = 288;
  ctx.save();
  ctx.translate(ox, oy);
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
      const L = (KJ_BASE - y) / KJ_STEP;
      const up = kjClamp((L - 3) / 2.5);
      const dn = kjClamp((-L - 3) / 2.5);
      if (up > 0) (ctx.fillStyle = `rgba(234, 232, 224, ${up * 0.92})`), ctx.fillRect(0, y, W, 4);
      if (dn > 0) (ctx.fillStyle = `rgba(62, 46, 34, ${dn * 0.85})`), ctx.fillRect(0, y, W, 4);
    }
  } else for (let y = 0; y < H; y += 4) {
    const L = (KJ_BASE - y) / KJ_STEP;
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
  // 形而上: 名前の字が浮かぶ(物は字にほどける)
  const P = window.bogiPix;
  if (P) {
    // 幕(まん中)をよけて、左右に少しだけ
    for (let j = 0; j < 8; j++) {
      const L = 5 + (j % 4) * 0.9;
      const y = Math.round(KJ_BASE - L * KJ_STEP);
      const x = j < 4 ? 8 + ((j * 37) % 60) : 300 + ((j * 41) % 70);
      ctx.globalAlpha = 0.22 + (j % 3) * 0.06;
      P.text(ctx, KJ_SOUV[(j * 3) % KJ_SOUV.length][0], x, y, 1, "#7a7a96");
    }
    ctx.globalAlpha = 1;
  }
  // 形而下: 名前のはがれた塊
  for (let j = 0; j < 14; j++) {
    const L = -5.2 - (j % 6) * 0.9;
    const y = KJ_BASE - L * KJ_STEP;
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
  // 不気味さ 4 から: セットに目玉が生える(柱に)
  const e = kjS.phase === "night" ? 6 : kjS.eerie;
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
  // ゴンドラ
  for (const who of ["m", "k", "p", "t"]) {
    const hop = kjS.phase === "endU" && kjS.winner === who && kjEl() < KJ.win ? Math.abs(Math.sin(t * 9)) * 5 : 0; // 優勝した者がはねる
    kjGondola(ctx, api, who, KJ_X[who], kjGy(kjS.d[who]) - hop, t);
  }
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
  // 物自体の気配(D514): きーがはじまりの高さにいるあいだ、まん中にうすいおばけがちらつく。離れるとうすれ、2 段で消える
  if (["intro", "q", "choose", "reveal", "move"].includes(kjS.phase)) {
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
  // 露出(D504、D507): きーのとなりの絵がはがれて穴があく。見届けでは、小さな人形たちがまわりで遊ぶ
  if (["gather", "watch", "close", "gift"].includes(kjS.phase)) {
    const el = kjEl();
    const s = kjS.phase === "gather" ? kjClamp(el / KJ.gather) : kjS.phase === "close" ? 1 - kjClamp(el / KJ.close) : kjS.phase === "gift" ? 0 : 1;
    const hx = KJ_HOLE.x;
    const hy = kjGy(0) + KJ_HOLE.y;
    kjHole(ctx, hx, hy, s, t);
    if (kjS.phase === "watch") {
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
    }
  }
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
  // 白い幕と影(洞窟の比喩 D508)。カメラが動いても、いつも上に見えている
  if (["intro", "q", "choose", "reveal", "move"].includes(kjS.phase)) {
    const lampOn = kjS.phase === "intro" ? 0 : 1;
    ctx.fillStyle = "#1a1820";
    ctx.fillRect(196, 6, 88, 66);
    const g = ctx.createRadialGradient(240, 40, 4, 240, 40, 46);
    const odd = kjS.phase !== "intro" && kjQ() && kjQ().kind === "u"; // よくわからない問いは紫がかった暗い幕(D517)
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
      const on = kjQ() && kjQ().kind === "u" ? "#b07ad8" : "#ffd75a";
      ctx.fillStyle = lampOn && i < Math.ceil(left) ? (hot ? "#ff7a4a" : on) : "#3a3228";
      ctx.fillRect(208 + i * 9, 74, 5, 4);
    }
  }
  if (kjS.phase === "intro") kjRules(ctx, api, t);
  // 答えの窓: 黒地に白の二重枠。絵が 3 つ
  if (["q", "choose", "reveal", "move"].includes(kjS.phase)) {
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
    if (kjS.rest.k && kjS.phase === "q" && window.bogiPix) {
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
  if (["reveal", "move"].includes(kjS.phase)) kjShowResult(ctx, t);
  if (["q", "choose", "reveal", "move"].includes(kjS.phase)) kjMeter(ctx, t);
  // 上で終わる: まぶしく白い字の中へ(D508 の 4)/ 下で終わる: 暗い塊の中へ
  if (kjS.phase === "endU" || kjS.phase === "endD") {
    const u = kjS.phase === "endU" ? kjClamp((kjEl() - KJ.win) / ((KJ.endSecU - KJ.win) * 0.7)) : kjClamp(kjEl() / (KJ.endSec * 0.7));
    if (kjS.phase === "endU" && kjEl() < KJ.win + 0.6) kjWin(ctx, t, kjEl());
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
  ctx.restore();
  // 不気味さ 3 から: 画面がゆがむ(横の帯をずらす)/ 悪夢: めちゃくちゃにバグる
  if (e >= 3) kjDistort(ctx, e, t);
};
// ルール(D514): 1 問目の前に、幕に映す。絵が主で、字は少し。変な物を選ぶと何が起きるかは見せない
const kjArrow = (ctx, x, y, up, col) => {
  ctx.fillStyle = col;
  for (let k = 0; k < 6; k++) ctx.fillRect(x - k, up ? y + k : y + 10 - k, k * 2 + 1, 1);
  ctx.fillRect(x - 2, up ? y + 6 : y, 5, 5);
};
// 答え合わせ(D517): 押した人の上に ○ か ×、わきに ↑1 ↓1。変な物なら画面のふちが紫に光る
const kjShowResult = (ctx, t) => {
  const who = kjS.buzz;
  if (!who) return;
  const i = kjS.ans[who];
  if (i === undefined || i === -1) return;
  const c = i === -2 ? {} : kjQ().choices[i];
  const kind = c.unk ? "odd" : c.ok ? "up" : "down";
  const x = KJ_X[who];
  const y = Math.round(kjGy(kjS.d[who]) - 78);
  const pop = Math.min(1, kjEl() * 5); // ぽんと出る
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
  } else {
    ctx.fillStyle = KJ_PURPLE;
    ctx.fillRect(x - 12, y - 10, 24, 20);
    kjOddEye(ctx, x, y, t, 0);
    // 画面のふちが紫に光る
    ctx.strokeStyle = `rgba(176, 122, 216, ${0.5 + 0.4 * Math.sin(t * 10)})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 474, 282);
  }
  ctx.restore();
  const P = window.bogiPix;
  if (P && kind !== "odd" && kjS.phase === "reveal") {
    const txt = kind === "up" ? "↑1" : "↓1";
    P.text(ctx, txt, x - 40, Math.round(kjGy(kjS.d[who]) - 26), 1, kind === "up" ? "#ffd75a" : "#8ab0e0");
  }
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
// ルールは 1 枚ずつ 4 枚(D517)。小さな実演と、一行の字
// 0 枚目は、正しい物(おみやげ)と変な物の見本(D518)
const KJ_RULES = ["", "おなじ おみやげ → あがる", "ちがう おみやげ → さがる 1かいやすみ", "へんな物 → こたえちゃダメ", "いちばん先に押した人だけ"];
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
  } else if (page === 1 || page === 2) {
    shadow("ic_mango", x0 + 72, ry);
    eq(x0 + 108, ry + 2, page === 2);
    img(page === 1 ? "ic_mango" : "ic_slice", x0 + 126, ry);
    // 解答席が上がる・下がる
    const bx = x0 + 226;
    const base = ry + 34;
    ctx.fillStyle = "rgba(160, 140, 110, 0.5)";
    ctx.fillRect(bx - 1, ry - 10, 2, 70);
    booth(bx, base + (page === 1 ? -18 : 18) * u);
    kjArrow(ctx, bx + 32, ry + 6, page === 1, page === 1 ? "#d0902a" : "#6a8ab0");
    if (page === 2 && u >= 1) {
      // 一回休み: 札が伏せられる
      ctx.fillStyle = "#2a2430";
      ctx.fillRect(bx + 22, base + 8, 14, 14);
    }
  } else if (page === 3) {
    shadow("u2", x0 + 80, ry);
    eq(x0 + 116, ry + 2);
    ctx.fillStyle = KJ_PURPLE;
    ctx.fillRect(x0 + 133, ry - 1, 30, 30);
    img("u2", x0 + 134, ry);
    kjOddEye(ctx, x0 + 153, ry + 8, t, 0);
    if (Math.sin(t * 6) > -0.3) {
      ctx.strokeStyle = "#d8402c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0 + 186, ry + 4);
      ctx.lineTo(x0 + 206, ry + 24);
      ctx.moveTo(x0 + 206, ry + 4);
      ctx.lineTo(x0 + 186, ry + 24);
      ctx.stroke();
    }
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

// ---- A スタジオ(24×14、見下ろし)。配置図 Q1 第 2 版(docs/assets/keiji/plan/layout_q1.png)----
// スタジオの絵(D516、PixelLab): 上に幕、まん中に舞台(5〜19 列、5〜9 行)、10 行目に低い塀(11、12 列が切れ目)、下に客席と通路
const KJ_G = { m: 7.5 * T, k: 10.5 * T, p: 13.5 * T, t: 16.5 * T, y: 7.4 * T }; // ゴンドラ(舞台の上)
const KJ_WALK = (c, r) => (r === 6 && c >= 3 && c <= 4) || (r >= 5 && r <= 9 && c >= 5 && c <= 19) || (r >= 10 && c >= 11 && c <= 12);
const KJ_SEATS = (c, r) => r >= 9 && r <= 13 && ((c >= 4 && c <= 10) || (c >= 14 && c <= 20));
const kjStudioGround = (ctx, ox, oy, img, api) => {
  const lit = api && api.flag("lit");
  ctx.save();
  ctx.translate(ox, oy);
  const bg = api && api.image("kj_studio");
  if (bg) {
    ctx.drawImage(bg, 0, 0);
    // 柱(幕のうしろから下りてくる)と、床の穴(下へ)
    for (const k of ["m", "k", "p", "t"]) {
      ctx.fillStyle = "#8e8e9a";
      ctx.fillRect(KJ_G[k] - 5, 4.7 * T, 10, KJ_G.y - 4.7 * T - 8);
      ctx.fillStyle = "#6e6e7a";
      ctx.fillRect(KJ_G[k] + 2, 4.7 * T, 2, KJ_G.y - 4.7 * T - 8);
      ctx.fillStyle = "#0c0b10";
      ctx.fillRect(KJ_G[k] - 18, KJ_G.y + 4, 36, 7);
    }
    if (lit) (ctx.fillStyle = "rgba(255, 250, 235, 0.12)"), ctx.fillRect(0, 0, 24 * T, 14 * T);
    ctx.restore();
    return;
  }
  ctx.fillStyle = "#3a3440";
  ctx.fillRect(0, 0, 24 * T, 14 * T);
  ctx.fillStyle = "#211d28"; // 北の壁
  ctx.fillRect(0, 0, 24 * T, 3 * T);
  // 白い幕(うしろの影が映る)
  ctx.fillStyle = lit ? "#efe9da" : "#d9d1bd";
  ctx.fillRect(9 * T, 0.4 * T, 6 * T, 2.2 * T);
  ctx.fillStyle = "#6e3e36"; // 舞台
  ctx.fillRect(3 * T, 3 * T, 18 * T, 4 * T);
  ctx.fillStyle = "#5a322c";
  ctx.fillRect(3 * T, 6.8 * T, 18 * T, 0.2 * T);
  // 柱(天井を抜けて上へ)と、床の穴(下へ)
  for (const k of ["m", "k", "p", "t"]) {
    ctx.fillStyle = "#8e8e9a";
    ctx.fillRect(KJ_G[k] - 6, 0, 12, KJ_G.y - 8);
    ctx.fillStyle = "#0c0b10";
    ctx.fillRect(KJ_G[k] - 20, KJ_G.y + 4, 40, 8);
  }
  // 低い塀(洞窟の比喩)。まん中は切れていて、舞台へ上がれる
  ctx.fillStyle = "#8f7d68";
  ctx.fillRect(4 * T, 7.3 * T, 7.4 * T, 0.45 * T);
  ctx.fillRect(12.6 * T, 7.3 * T, 7.4 * T, 0.45 * T);
  // 空の客席
  for (let r = 9; r <= 13; r++)
    for (let c = 0; c < 24; c++) {
      if (!KJ_SEATS(c, r)) continue;
      ctx.fillStyle = "#5a3a46";
      ctx.fillRect(c * T + 5, r * T + 6, T - 10, T - 12);
      ctx.fillStyle = "#422a34";
      ctx.fillRect(c * T + 5, r * T + 6, T - 10, 4);
    }
  // 西の戸口
  ctx.fillStyle = "#0e0d12";
  ctx.fillRect(0, 7.5 * T, 0.4 * T, 2 * T);
  ctx.restore();
};
// 塀の上を、棒にさした物が通る(運ぶ手は見えない)。明かりがついたあとは、並んで止まっている(D508 の 1、5)
const KJ_PARADE = ["ic_kori", "u3", "ic_mango", "ic_fuda", "u5", "ic_slice", "ic_ribbon", "u1"];
const kjParade = {
  id: "parade",
  x: 12 * T,
  y: 10.1 * T,
  w: 1,
  h: 1,
  draw(ctx, sx, sy, t, api) {
    const lit = api.flag("lit");
    const span = 14 * T;
    KJ_PARADE.forEach((k, i) => {
      const im = api.image(k);
      if (!im) return;
      let x = lit ? 5.6 * T + i * 1.5 * T : 5.2 * T + ((i * 2 * T + t * 18) % span);
      if (!lit && x > 10.9 * T && x < 13.1 * T) return; // 塀の切れ目では見えない
      if (lit && x > 10.6 * T) x += 2.6 * T;
      const px = Math.round(sx - 12 * T + x);
      ctx.fillStyle = "#5a4430";
      ctx.fillRect(px, sy - 12, 2, 12);
      ctx.drawImage(im, px - 11, sy - 34, 24, 24);
    });
  },
};
const kjSprite = (key, x, y, extra) =>
  Object.assign(
    {
      id: key,
      x,
      y,
      w: 1,
      h: 1,
      headY: 40,
      draw(ctx, sx, sy, t, api) {
        const im = api.image(key);
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height));
      },
    },
    extra
  );
// スタジオのゴンドラ(舞台の上)。まん中の空いたゴンドラを調べると、本番(B の画面へ)
const kjStudioGondola = (who) => ({
  id: `g_${who}`,
  x: KJ_G[who],
  y: KJ_G.y,
  w: 1,
  h: 1,
  headY: 46,
  range: 40,
  solid: { w: 34, h: 12, dy: -6 },
  draw(ctx, sx, sy0, t, api) {
    const sy = sy0 - (api.image("booth") ? KJ_LIFT : 0);
    if (who === "m") {
      const m = api.image("matryo");
      if (m) ctx.drawImage(m, Math.round(sx - m.width / 2), Math.round(sy - 6 - m.height));
    } else if (who === "t") {
      const tb = api.image("tetsubin");
      if (tb) ctx.drawImage(tb, Math.round(sx - tb.width / 2), Math.round(sy - 4 - tb.height));
    } else if (who === "p") {
      const pi = api.image("pi");
      if (pi) ctx.drawImage(pi, 0, 0, 64, 64, Math.round(sx - 32), Math.round(sy - 8 - 64 + 17), 64, 64);
    }
    const bt = api.image("booth");
    if (bt) return ctx.drawImage(bt, Math.round(sx - bt.width / 2), Math.round(sy0 - bt.height));
    ctx.fillStyle = "#c8b478";
    ctx.fillRect(Math.round(sx - 16), Math.round(sy - 13), 32, 13);
    ctx.strokeStyle = "#4a3a24";
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(sx - 16) + 0.5, Math.round(sy - 13) + 0.5, 31, 12);
    ctx.fillStyle = "#f4f2ea";
    ctx.fillRect(Math.round(sx - 9), Math.round(sy - 10), 18, 6);
    ctx.fillStyle = "#d83a2c";
    ctx.fillRect(Math.round(sx - 2), Math.round(sy - 16), 4, 3);
  },
  ...(who === "k"
    ? {
        interact(api) {
          // ききこりのカチンコ → 本番
          api.freeze(1.4);
          api.sfx("hyoshigi");
          api.later(900, () => api.warp("show", "view"));
        },
      }
    : {}),
});
const KJ_STUDIO = {
  tile: T,
  bg: "#3a3440",
  bgm: "keiji",
  map: kGrid(24, 14, (c, r) => !KJ_WALK(c, r)),
  legend: K_LEGEND,
  drawGround: kjStudioGround,
  spawns: {
    start: { x: 3.5 * T, y: 6.7 * T, facing: "east" },
    stage: { x: 12 * T, y: 8.6 * T, facing: "north" },
  },
  onEnter() {
    kjWarp(0);
  },
  // 客席のほうは暗い。明かりがつくまで、舞台だけ明るい(ランプの灯り)
  drawOverlay(ctx, ox, oy, t, api) {
    if (api.flag("lit")) return;
    ctx.fillStyle = "rgba(8, 6, 14, 0.42)";
    ctx.fillRect(0, Math.round(oy + 10.3 * T), ctx.canvas.width, ctx.canvas.height);
    const g = ctx.createRadialGradient(ox + 12 * T, oy + 11 * T, 2, ox + 12 * T, oy + 11 * T, 60);
    g.addColorStop(0, `rgba(255, 210, 120, ${0.35 + 0.06 * Math.sin(t * 7)})`);
    g.addColorStop(1, "rgba(255, 210, 120, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(ox + 12 * T - 60, oy + 11 * T - 60, 120, 120);
  },
  // 西の戸口(絵の左の扉)。扉に向かって歩くと出る
  triggers: [{ id: "leave", x: 2.9 * T, y: 5.6 * T, w: 1.1 * T, h: 0.5 * T, run: (api) => api.exit() }],
  objects: [
    kjParade,
    kjStudioGondola("m"),
    kjStudioGondola("k"),
    kjStudioGondola("p"),
    kjStudioGondola("t"),
    // 司会台とごろん(ディレクター、司会)
    {
      id: "desk",
      x: 6.1 * T,
      y: 7.5 * T,
      w: 1,
      h: 1,
      solid: { w: 40, h: 12, dy: -6 },
      draw(ctx, sx, sy, t, api) {
        const bt = api.image("booth"); // 解答席と同じ台(D516)
        if (bt) ctx.drawImage(bt, Math.round(sx - bt.width / 2), Math.round(sy - bt.height));
      },
    },
    kjSprite("goron", 6.1 * T, 7 * T, { solid: { w: 24, h: 10, dy: -5 } }),
    // ききこり(カメラ係)。客席の通路から舞台を撮る
    kjSprite("kikikori", 12 * T, 12.8 * T, { solid: { w: 30, h: 12, dy: -6 } }),
    // ランプ(洞窟の火)。塀のうしろから幕を照らす
    {
      id: "lamp",
      x: 12.5 * T,
      y: 11 * T,
      w: 1,
      h: 1,
      draw(ctx, sx, sy, t) {
        ctx.fillStyle = "#3a2c1c";
        ctx.fillRect(Math.round(sx - 2), Math.round(sy - 10), 4, 10);
        ctx.fillStyle = `rgb(255, ${200 + Math.round(20 * Math.sin(t * 9))}, 110)`;
        ctx.beginPath();
        ctx.ellipse(sx, sy - 13, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      },
    },
  ],
};
// ---- B 本番の画面(画面と同じ広さ。カメラは動かない)----
const KJ_SHOW = {
  tile: T,
  bg: "#16161e",
  hidePlayer: true,
  bgm: "keiji",
  map: kGrid(15, 9, () => false),
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 4 * T, facing: "north" } },
  objects: [],
  triggers: [],
  onEnter(api) {
    kjStart(api);
    api.sfx("clap");
  },
  debug: () => kjS,
  onA(api) {
    if (kjS.phase === "intro" && kjEl() > 0.4) kjS.t0 = kjS.t - KJ.rulePage; // ルールの次の 1 枚へ
    if (kjS.phase === "q" && !kjS.rest.k) {
      // 押す(D515): 3 秒のうちに選ぶ
      kjS.buzz = "k";
      kjS.qEl = kjEl();
      kjS.cur = 1;
      api.sfx("pinpon");
      kjGo("choose");
    } else if (kjS.phase === "choose" && kjEl() > 0.15) {
      kjS.ans.k = kjS.cur;
      api.sfx("ok");
      kjGo("reveal");
    }
    return true;
  },
  onB() {
    return true;
  },
  input(api, dt, inp) {
    if (kjS.phase === "idle") kjStart(api);
    // 左右で選ぶ(押したときだけ 1 つ動く)
    if (kjS.phase === "choose") {
      if (inp.x < -0.5 && kjS.lastX >= -0.5) (kjS.cur = (kjS.cur + 2) % 3), api.sfx("cursor");
      if (inp.x > 0.5 && kjS.lastX <= 0.5) (kjS.cur = (kjS.cur + 1) % 3), api.sfx("cursor");
    }
    kjS.lastX = inp.x;
    kjTick(api, dt);
  },
  drawGround(ctx, ox, oy, img, api) {
    kjDrawShow(ctx, ox, oy, api);
  },
};
