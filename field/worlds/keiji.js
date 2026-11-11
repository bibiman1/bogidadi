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
