// 断片: 形而アップダウンクイズ(D503〜D511)。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kGrid など)をそのまま使う
"use strict";

// ======== 形而アップダウンクイズ ========
// 夜の古いテレビ局のスタジオ。ぼぎのテレビの番組で、撮影隊のききこり(カメラ)とごろん(ディレクター、司会)が撮る(D505)
// 解答者は、きー、マトリョーシカ、ぴー、鉄瓶。ゴンドラは 4 つ(D511)
// 本番の画面だけは上下で動く。上が形而上(物が名前や字にほどける)、下が形而下(名前がはがれ、形と重さだけの塊)(D504)
// クイズ(D507〜D510、ルールは D522 で作り直し): 白い幕に影だけが映る。選択肢はいつもおみやげ 3 つ。1 問 8 秒、早押し。
//   問いは 2 種類で、毎回シャッフル(ふつう 5、変な物 5)
//   ふつうの問い: おみやげの影。当てた人がゴンドラを操る(マトリョーシカと鉄瓶は上へ、きーは ↑・とどまる・↓ を選び怖さ −1、
//     ぴーはゴンドラをゆすって怖さ +1)。外すと、だれでも怖さ +1
//   変な物の問い: 選択肢に答えがない。押した人(お手つき)は答えられず、怖さ +1、次の問いは一回休み(バツのマスク D523)
//   怖さ = バグ(5 段): ゆれとにじみ → 音楽がくるう → 画面がゆがむ → セットに目玉 → めちゃくちゃにこわれて、こわれたタイトルへ(D521)
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
  mPressU: 0.25, // マトリョーシカが変な物の問いで押してしまう見こみ(お手つき)
  pAt: 2.5, // ぴーが変な物の問いで押す秒(いつも飛びつく。お手つき)
  pAtN: 3.0, // ぴーがふつうの問いで押す秒(当てる。D520)
  pPressN: 0.5, // ぴーがふつうの問いで押す見こみ
  rattle: 1.4, // ぴーが当てて、ゴンドラをぶるぶるゆする長さ(D522)
  burst: [0, 0, 0, 0.5, 0.9], // 怖さが上がった直後、画面全体が短くこわれる長さ(怖さの段ごと。はじめは無し)
  burstMax: 4.2, // 怖さ 5: めちゃくちゃにこわれる長さ。そのあと固まって、こわれたタイトルへ(D521)
  tAt: [2.5, 6.0], // 鉄瓶が押す秒(この間でばらつく)
  tPress: 0.7, // 鉄瓶が押す見こみ
  choose: 3, // きーが押してから選ぶまで(時間切れは外れ)
  steer: 3, // きーが当ててから、↑・とどまる・↓ を選ぶまで(時間切れはとどまる)
  eerieMax: 5, // 怖さの段(kjS.eerie。目玉の印 5 つ)
  endSec: 5.2, // 下で終わる場面(賞金が降ってから、暗い塊の中へ沈む D526)
  prize: 2.4, // 賞金の硬貨と札束が降る長さ
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
const KJ_STEP = 20; // 1 段(15 では動きが小さかった D519)
const KJ_SPAN = 4; // 表示で止める段
const KJ_BG = 15; // 背景の帯と字の間かく(段を広げる前のまま)
const KJ_HOLE = { x: 240, y: -40 }; // 露出の穴(きーとぴーのあいだ。y ははじまりの高さの床から)
const kjS = { phase: "idle", lastSteam: 0, t: 0, t0: 0, qs: [], qi: 0, h: { m: 0, k: 0, p: 0, t: 0 }, d: { m: 0, k: 0, p: 0, t: 0 }, ans: {}, cur: 1, lastX: 0, eerie: 0, steam: [] };
const kjShuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
// 10 問を組む(D510、D522): ふつう 5、変な物 5 を、まぜた順で。選択肢はいつもおみやげ 3 つ(変な物は選択肢に出さない)
const kjBuild = () => {
  const souv = kjShuffle(KJ_SOUV.slice());
  const unk = kjShuffle(KJ_UNK.slice());
  const kinds = kjShuffle(["n", "n", "n", "n", "n", "u", "u", "u", "u", "u"]);
  let si = 0;
  let ui = 0;
  const others = (not, n) => kjShuffle(KJ_SOUV.filter((s) => !not.includes(s[1]))).slice(0, n);
  return kinds.map((k) => {
    if (k === "n") {
      const s = souv[si++];
      return { kind: "n", sil: s[1], choices: kjShuffle([{ key: s[1], ok: true }, ...others([s[1]], 2).map((o) => ({ key: o[1] }))]) };
    }
    // 変な物の問い: 答えは選択肢にない。押したらお手つき
    return { kind: "u", sil: unk[ui++], choices: others([], 3).map((o) => ({ key: o[1] })) };
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
  Object.assign(kjS, { loser: null, phase: "idle", lastSteam: 0, t: 0, t0: 0, qs: [], qi: 0, ans: {}, rest: {}, page: 0, buzz: null, when: {}, qEl: 0, winner: null, cur: 1, eerie: 0, rattle: -9, burst: null, broken: false, steerOn: false, steam: [], leaving: false });
  kjS.h = { m: 0, k: 0, p: 0, t: 0 };
  kjS.d = { m: 0, k: 0, p: 0, t: 0 };
  kjS.v = { m: 0, k: 0, p: 0, t: 0 };
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
// ある解答者が、どの絵を選ぶか(仮の性格。ふつうの問いだけ。変な物の問いで押すと、選ばずにお手つき)
const kjPick = (who, q) => {
  const ok = q.choices.findIndex((c) => c.ok);
  if (who === "m" || who === "p") return ok; // マトリョーシカとぴーは当てる
  const bad = q.choices.map((c, i) => i).filter((i) => i !== ok);
  return Math.random() < 0.5 ? ok : bad[Math.floor(Math.random() * bad.length)]; // 鉄瓶は半分まちがえる
};
// 問いのはじめに、ほかの 3 人がいつ押すかを決める(D515)。押さない者は Infinity
const kjBeginQ = (api) => {
  const q = kjQ();
  if (api) api.sfx(q.kind === "u" ? "kjOdd" : "kjNorm"); // 問いの合図: 変な物の問いは濁った音(D517。D527 をやめて戻した D598)
  const r = (w) => (kjS.rest[w] ? Infinity : 0);
  const [a, b] = KJ.tAt;
  const n = q.kind === "n";
  kjS.when = {
    m: r("m") || (n ? KJ.mAt + Math.random() * 0.6 : Math.random() < KJ.mPressU ? 4 + Math.random() * 1.5 : Infinity),
    p: r("p") || (!n ? KJ.pAt + Math.random() * 0.4 : Math.random() < KJ.pPressN ? KJ.pAtN + Math.random() * 0.3 : Infinity),
    t: r("t") || (Math.random() < KJ.tPress ? a + Math.random() * (b - a) : Infinity),
  };
  kjS.ans = {};
  kjS.buzz = null;
  kjS.cur = 1;
  kjGo("q");
};
// 怖さを上げ下げする(D522)。怖さ = バグ。上がった直後は段に合わせて短くこわれ、5 段でめちゃくちゃにこわれて、こわれたタイトルへ
const kjFear = (api, d) => {
  const was = kjS.eerie;
  kjS.eerie = Math.max(0, Math.min(KJ.eerieMax, was + d));
  kjWarp(kjS.eerie >= 2 ? kjS.eerie - 1 : 0);
  if (kjS.eerie <= was) return;
  if (kjS.eerie >= KJ.eerieMax) {
    kjS.broken = true; // 番組はここで止まる
    kjS.burst = { t0: kjS.t, len: KJ.burstMax, c: 3 };
    if (api) {
      api.sfx("boom");
      api.shake(1.2, 6);
      api.later(KJ.burstMax * 1000, () => (window.bogiCrash ? window.bogiCrash() : kjBackToStudio(api)));
    }
    return;
  }
  const len = KJ.burst[kjS.eerie - 1] || 0;
  if (len) kjS.burst = { t0: kjS.t, len, c: (kjS.eerie - 2) * 0.6 };
};
// 答えが出たら(D522): 押した 1 人だけ。当てた人がゴンドラを操る / 外すと怖さ +1 / お手つきは次の問いが一回休み
const kjJudge = (api) => {
  const q = kjQ();
  const who = kjS.buzz;
  const rest = {};
  let fear = 0;
  kjS.steerOn = false;
  const i = who ? kjS.ans[who] : undefined;
  if (i === -3) {
    rest[who] = true; // お手つき(変な物の影で押した)。変な物にさわると怖い(D523)
    fear += 1;
  }
  else if (i !== undefined && i !== -1) {
    const c = i === -2 ? {} : q.choices[i]; // -2 は時間切れ(外れ)
    if (!c.ok) {
      fear += 1;
      if (who === "t") kjS.steam.push({ t0: kjS.t, angry: true });
    } else if (who === "m" || who === "t") kjS.h[who] += 1; // ワンネスへ、上へ
    else if (who === "p") {
      fear += 1; // ぴーはゴンドラをぶるぶるゆする
      kjS.rattle = kjS.t;
      if (api) api.sfx("kjOdd"), api.shake(0.5, 3);
    } else if (who === "k") {
      fear -= 1; // きーが当てると落ち着く。高さは自分で選ぶ
      kjS.steerOn = true;
    }
  }
  kjS.rest = rest;
  kjFear(api, fear);
  if (api) api.sfx("clap"); // 空の客席から、拍手だけ(こだま D508 の 3)
};
const KJ_PRIZE = "賞金";
const kjBackToStudio = (api) => {
  if (kjS.leaving) return; // 暗転のあいだに、もう一度呼ばれないように
  const ended = kjS.phase === "endU" || kjS.phase === "endD";
  // 下で終わった 1 回目は、スタジオで賞金の袋を掲げる(D526。使い道はない)
  const prize = kjS.phase === "endD" && !api.hasItem(KJ_PRIZE);
  kjWarp(0);
  kjS.leaving = true; // 終わりの場面(暗い塊、白い字)は、暗転し終わるまで描いたまま(todo 198。消すと、ゴンドラの場面が一瞬もどって見えた)
  api.warp("studio", "stage");
  if (prize)
    api.later(1300, () =>
      api.hold("ic_shoukin", 1.8, () => {
        api.sfx("item");
        if (!api.hasItem(KJ_PRIZE)) api.giveItem(KJ_PRIZE);
      })
    );
  // 上か下で終わった 1 回目だけ、ごろんが一言(D517。目的はルールでは言わない)
  if (ended && !api.flag("hintMiddle")) {
    api.setFlag("hintMiddle");
    api.later(prize ? 3600 : 1400, () => api.bubble("goron", "まんなかに なにか いたような……", 3200));
  }
};
// きーが当てたあと、ゴンドラを ↑・とどまる・↓ のどれにするか(D522)
const KJ_STEER = [1, 0, -1];
const kjSteer = (api) => {
  const d = KJ_STEER[kjS.cur];
  kjS.h.k += d;
  if (api) api.sfx(d ? "ok" : "cursor");
  kjGo("move");
};
// 本番の進み(毎フレーム)
const kjTick = (api, dt) => {
  kjS.t += dt;
  // 表示の高さは、ほんとうの高さへ寄っていく。少し行きすぎて戻る(はずむ D519)
  const sd = Math.min(dt, 0.05);
  for (const k of ["m", "k", "p", "t"]) {
    kjS.v[k] = (kjS.v[k] || 0) + ((kjS.h[k] - kjS.d[k]) * 90 - kjS.v[k] * 9) * sd;
    kjS.d[k] += kjS.v[k] * sd;
  }
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
      kjS.ans[first] = q.kind === "u" ? -3 : kjPick(first, q); // 変な物の影で押したらお手つき
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
    if (kjS.steerOn && !kjS.broken) {
      kjS.cur = 1; // はじめは「とどまる」
      kjGo("steer");
    } else kjGo("move");
  } else if (P === "steer" && el > KJ.steer) kjSteer(api); // 時間切れはとどまる
  else if (P === "move" && el > KJ.move && !kjBursting() && !kjS.broken) {
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
    else if (kjS.h.k < 0) {
      // 下で終わると賞金(D526)。いちばん低い人の上に、硬貨と札束がどすんどすんと降る(並んだらきー)
      kjS.loser = ["k", "m", "p", "t"].reduce((a, b) => (kjS.h[b] < kjS.h[a] ? b : a));
      kjGo("endD");
      api.sfx("clap");
      for (const ms of [500, 1100, 1700]) api.later(ms, () => (api.sfx("knock"), api.shake(0.15, 2)));
    }
    else {
      kjGo("gather");
      kjS.h.m = kjS.h.p = kjS.h.t = 0; // ほかのゴンドラも、同じ高さまで寄ってくる
      kjS.eerie = 0;
      kjWarp(0);
      if (window.bogiAudio) window.bogiAudio.bgm("silence"); // 音が止む
    }
  } else if ((P === "endU" && el > KJ.endSecU) || (P === "endD" && el > KJ.endSec)) kjBackToStudio(api);
  else if (P === "gather" && el > KJ.gather) kjGo("watch");
  else if (P === "watch") {
    if (el > 2 && el < KJ.watch - 4 && kjS.t - (kjS.lastSteam || 0) > 2.4) {
      kjS.steam.push({ t0: kjS.t }); // 鉄瓶は怒らずに、湯気の輪をぽっと吹く
      kjS.lastSteam = kjS.t;
    }
    if (el > KJ.watch) kjGo("close");
  } else if (P === "close" && el > KJ.close) {
    kjS.phase = "gift";
    api.place(KJ_X.k, kjGy(0) - 14); // 見届けの光は、ゴンドラのきーの上に降らせる(D524。歩く体は見えないまま)
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
    // 怖さ(D522): 1 段からゴンドラが小さくゆれる。ぴーが当てると、しばらくぶるぶるゆれる(ぴーのがいちばん強い)
    const j = { m: 0, k: 1, p: 2, t: 3 }[who];
    const ra = kjClamp(1 - (t - kjS.rattle) / KJ.rattle);
    const wob = kjS.eerie * 0.5 * Math.sin(t * 6.5 + j * 1.7) + (ra ? ra * (who === "p" ? 5 : 3) * Math.sin(t * 61 + j * 2.3) : 0);
    const wy = ra ? ra * 2 * Math.sin(t * 47 + j) : 0;
    kjGondola(ctx, api, who, KJ_X[who] + wob, kjGy(kjS.d[who]) - hop + wy, t);
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
  if (kjS.phase === "intro") kjRules(ctx, api, t);
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
  if (["reveal", "steer", "move"].includes(kjS.phase)) kjShowResult(ctx, t);
  if (["q", "choose", "reveal", "steer", "move"].includes(kjS.phase)) kjMeter(ctx, t), kjGauge(ctx, t);
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

// ---- A スタジオ(24×14、見下ろし)。配置図 Q1 第 2 版(docs/assets/keiji/plan/layout_q1.png)----
// スタジオの絵(D516、PixelLab): 上に幕、まん中に舞台(5〜19 列、5〜9 行)、10 行目に低い塀(11、12 列が切れ目)、下に客席と通路
const KJ_G = { m: 7.5 * T, k: 10.5 * T, p: 13.5 * T, t: 16.5 * T, y: 7.4 * T }; // ゴンドラ(舞台の上)
const KJ_WALK = (c, r) => (r >= 5 && r <= 8 && c >= 3 && c <= 4) || (r >= 5 && r <= 9 && c >= 5 && c <= 19) || (r >= 10 && c >= 11 && c <= 12);
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
    // スクリーンの番組名は、作者のバナーを縮めて背景に入れた(todo 245、D596 の案 5。左右の余白に上下の矢印 todo 248、D597。docs/record/2026-11-04/keiji_banner/side.py)
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
// ぴーの登場(D520): はじめて舞台に上がると、ぱーでれの光の柱が天井からさし、ぴーが落ちてきて、きーにぶつかってから自分のゴンドラへ跳ぶ
// (ぱーでれとだいにちで、ぴーはきーを押しのけて光の柱をのぼっていった)
const KJ_FALL = { light: 0.6, fall: 0.5, hop: 1.0, fade: 0.8 };
let kjFall = null;
const kjPiFall = {
  id: "piFall",
  x: 0,
  y: 14 * T, // いちばん手前に描く
  w: 1,
  h: 1,
  hidden: () => !kjFall,
  draw(ctx, sx, sy, t, api) {
    if (!kjFall) return;
    if (kjFall.t0 === null) kjFall.t0 = t;
    const el = t - kjFall.t0;
    const ox = sx;
    const oy = sy - 14 * T;
    const px = ox + kjFall.x;
    const py = oy + kjFall.y;
    const F = KJ_FALL;
    // 光の柱(ぱーでれと同じ、うすい黄色の帯)
    const tEnd = F.light + F.fall + F.hop + F.fade;
    const la = el < F.light ? el / F.light : el < F.light + F.fall + 0.3 ? 1 : Math.max(0, 1 - (el - F.light - F.fall - 0.3) / F.fade);
    if (la > 0) {
      const g = ctx.createLinearGradient(px - 20, 0, px + 20, 0);
      g.addColorStop(0, "rgba(255, 246, 214, 0)");
      g.addColorStop(0.5, `rgba(255, 246, 214, ${0.6 * la * (0.85 + 0.15 * Math.sin(t * 3))})`);
      g.addColorStop(1, "rgba(255, 246, 214, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(px - 20, 0, 40, py + 4);
    }
    const pi = api.image("pi");
    if (!pi) return;
    let x, y;
    if (el < F.light) return;
    if (el < F.light + F.fall) {
      // 落ちる(だんだん速く)
      const u = (el - F.light) / F.fall;
      x = px;
      y = oy - 20 + (py - 26 - (oy - 20)) * u * u;
    } else if (el < F.light + F.fall + F.hop) {
      // はね返って、自分のゴンドラへ
      const u = (el - F.light - F.fall) / F.hop;
      const gx = ox + KJ_G.p;
      const gy = oy + KJ_G.y - (api.image("booth") ? KJ_LIFT : 0) - 8;
      x = px + (gx - px) * u;
      y = py - 26 + (gy - (py - 26)) * u - Math.sin(u * Math.PI) * 40;
    } else return;
    ctx.drawImage(pi, 0, 0, 64, 64, Math.round(x - 32), Math.round(y - 47), 64, 64);
    if (el > tEnd) kjFall = null;
  },
};
const kjPiFallStart = (api) => {
  if (api.flag("piCame") || kjFall) return;
  const p = api.player();
  kjFall = { t0: null, x: p.x, y: p.y };
  const F = KJ_FALL;
  api.freeze(F.light + F.fall + F.hop + 0.3);
  api.sfx("chime");
  api.later((F.light + F.fall) * 1000, () => {
    api.sfx("knock");
    api.shake(0.3, 3);
    api.face("north"); // ぶつかっても、きーの場所は動かさない(舞台のふちで壁にめりこんで動けなくなった)
    if (api.dent) api.dent(0.9); // ぴーが頭にぶつかって、きーがへこむ(todo 195)
  });
  api.later((F.light + F.fall + F.hop) * 1000, () => {
    api.sfx("pop");
    api.setFlag("piCame");
  });
};
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
    } else if (who === "p" && api.flag("piCame")) {
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
    start: { x: 3.9 * T, y: 7.7 * T, facing: "east" }, // 扉の手前(todo 246)
    stage: { x: 12 * T, y: 8.6 * T, facing: "north" },
  },
  onEnter() {
    kjWarp(0);
    kjFall = null;
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
  // 西の戸口(絵の左の扉。x 2.7〜4.4 マス、下の端 6.9 マス)。扉に向かって上へ歩くか、扉の下で左へ歩くと出る。
  // 上へ歩くと y 6.23 マス、左へ歩くと x 3.34 マスで止まるので、そこまで届くようにする(todo 202)。
  // 戸口の前の通り道は 4 マスの高さ(5〜8 段。todo 227)。前は左の帯が 4 マスぜんぶと入口の 2 ドット隣にかかり、
  // 入ってすぐ左や下へ少し動くだけで出てしまった(todo 246)。左の帯は扉の下(7.2 マスまで)だけにし、入口は扉の手前に下げた
  triggers: [
    { id: "leave", x: 2.9 * T, y: 5.6 * T, w: 1.5 * T, h: 0.85 * T, run: (api) => api.exit() },
    { id: "leaveW", x: 2.9 * T, y: 5 * T, w: 0.55 * T, h: 2.2 * T, run: (api) => api.exit() },
    { id: "piFall", x: 5 * T, y: 5 * T, w: 15 * T, h: 5 * T, run: kjPiFallStart }, // 舞台に上がると(D520)
  ],
  objects: [
    kjParade,
    kjPiFall,
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
        const bt = api.image("kj_desk") || api.image("booth"); // 司会台(todo 200。解答席とは別の形)
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
      // 押す(D515): 3 秒のうちに選ぶ。変な物の影なら、選択肢に答えがないのでお手つき(D522)
      kjS.buzz = "k";
      kjS.qEl = kjEl();
      kjS.cur = 1;
      api.sfx("pinpon");
      if (kjQ().kind === "u") {
        kjS.ans.k = -3;
        kjGo("reveal");
      } else kjGo("choose");
    } else if (kjS.phase === "steer" && kjEl() > 0.2) kjSteer(api);
    else if (kjS.phase === "choose" && kjEl() > 0.15) {
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
    if (kjS.phase === "choose" || kjS.phase === "steer") {
      if (inp.x < -0.5 && kjS.lastX >= -0.5) (kjS.cur = (kjS.cur + 2) % 3), api.sfx("cursor");
      if (inp.x > 0.5 && kjS.lastX <= 0.5) (kjS.cur = (kjS.cur + 1) % 3), api.sfx("cursor");
    }
    // ↑・↓ を選ぶときは、上下でもそのまま選べる
    if (kjS.phase === "steer") {
      if (inp.y < -0.5 && kjS.lastY >= -0.5 && kjS.cur !== 0) (kjS.cur = 0), api.sfx("cursor");
      if (inp.y > 0.5 && kjS.lastY <= 0.5 && kjS.cur !== 2) (kjS.cur = 2), api.sfx("cursor");
    }
    kjS.lastX = inp.x;
    kjS.lastY = inp.y;
    // 見えないきー(歩く体)は、番組のあいだ動かさない(↓で選ぶと下へ歩いていき、懲罰空間へ戻ってしまった todo 194)
    if (kjS.phase !== "gift") api.place(7 * T, 4 * T);
    kjTick(api, dt);
  },
  drawGround(ctx, ox, oy, img, api) {
    kjDrawShow(ctx, ox, oy, api);
  },
};
