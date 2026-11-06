// タイトル。
// field/app/ のファイルは index.html の順に読む(上のファイルで決めた名前を、下のファイルがそのまま使う)
"use strict";

// ---- タイトル(D259、todo 54): きーの部屋の引きの絵がそのままタイトル。A で寄って、そのまま遊ぶ ----
// 遊び進めると、引きの絵の台座が灯っていく。題の下に「つづきから」「さいしょから」(D261。保存がなければ「さいしょから」だけ)
// 保存があって「さいしょから」を選ぶと、消してよいか聞く(本番の「はじめから」はここだけ)
// テストの ?debug と、書庫から戻ったとき(本棚が skipTitle を置く)は出さない
const T32 = 32;
const TITLE_CAM = { x: 22 * T32, y: 18.6 * T32, z: 0.27 }; // 扉からきーの部屋まで、10 の台座が一画面に入る引き
const TITLE_ROW = 16.4; // 題を置く高さ(3 段と 2 段のあいだの、何もない帯)
let skipTitle = BOGI_DEBUG;
try {
  if (sessionStorage.getItem("bogidachi.skipTitle")) skipTitle = true;
  sessionStorage.removeItem("bogidachi.skipTitle");
} catch (e) {
  // 保存が使えない環境では、毎回タイトルを出す
}
let hasSave = false;
try {
  hasSave = !!localStorage.getItem(SAVE_KEY);
} catch (e) {
  // 保存が使えない環境では、いつも最初から
}
let TITLE_MENU = hasSave ? ["つづきから", "さいしょから"] : ["さいしょから"];
// menu: 最初は題だけ。なにかボタンを押すと「つづきから」「さいしょから」の窓が出る(D298)
const title = { on: !skipTitle, leaving: false, menu: false, ask: false, cur: 0, sel: 0 };
function titleApi() {
  return rpg.debug && rpg.debug.api && rpg.debug.api();
}
function titleCam() {
  const api = titleApi();
  if (!api) return;
  const c = TITLE_CAM;
  api.camPath([{ t: 0, ...c }, { t: 100000, ...c }]);
}
function titleStart(cont) {
  if (!title.on || title.leaving) return;
  title.leaving = true;
  const api = titleApi();
  // つづきから(D262): セーブした場所へ。断片なら、その断片の入り口へ切りかえる
  const place = cont && gameState.place;
  if (place && place.world !== HUB && window.BOGI_WORLDS[place.world]) {
    title.on = false;
    transition(() => {
      rpg.enter(window.BOGI_WORLDS[place.world]);
      updateStatus();
    });
    return;
  }
  if (place && place.world === HUB && place.x) rpg.debug.teleport(place.x, place.y);
  const p = api && api.player();
  if (api && p) {
    const c = TITLE_CAM;
    api.camPath([{ t: 0, ...c }, { t: 1.8, x: p.x, y: p.y - 20, z: 1 }], () => (title.on = false));
  } else title.on = false;
  if (window.bogiAudio) window.bogiAudio.sfx("chime");
}
// 結末 B のスタッフロールが終わったら、タイトルに戻る(D277)。保存は残したまま、「つづきから」を出す
function backToTitle() {
  try {
    hasSave = !!localStorage.getItem(SAVE_KEY);
  } catch (e) {
    hasSave = false;
  }
  TITLE_MENU = hasSave ? ["つづきから", "さいしょから"] : ["さいしょから"];
  Object.assign(title, { on: true, leaving: false, leaveT: 0, menu: false, ask: false, cur: 0, sel: 0 });
  transition(() => {
    rpg.enter(window.BOGI_WORLDS[HUB]);
    updateStatus();
  });
}
window.bogiToTitle = backToTitle;
function titleInput(action) {
  if (title.leaving) return;
  if (title.crash) return crashRecover(); // こわれたタイトル(D521): どのボタンでも、スタジオへ戻る
  // 題だけの画面: どのボタンでも、窓を出すだけ(押したボタンの役目はしない)
  if (!title.menu) {
    title.menu = true;
    menuFeedback("a");
    return;
  }
  if (action === "any") return;
  menuFeedback(action);
  if (title.ask) {
    if (action === "up" || action === "down" || action === "left" || action === "right") title.cur = 1 - title.cur;
    else if (action === "a") {
      if (title.cur === 1) return resetGame();
      title.ask = false;
    } else if (action === "b") title.ask = false;
    return;
  }
  const n = TITLE_MENU.length;
  if (action === "up") title.sel = (title.sel + n - 1) % n;
  else if (action === "down") title.sel = (title.sel + 1) % n;
  else if (action === "a") {
    if (TITLE_MENU[title.sel] === "さいしょから" && hasSave) {
      title.ask = true;
      title.cur = 0;
    } else titleStart(TITLE_MENU[title.sel] === "つづきから");
  }
}

// 遊ぶ人に見せるバージョン(版の番号 version.json とは別。作者が決める)。タイトルの右下に小さく(作者「ぼぎだち　Var.1.0　にしておいて。タイトル画面にバージョン表記。」D297)
const GAME_VERSION = "Ver.1.9.4"; // 断片を 1 つ更新して公開するたびに点のあとを 1 つ上げ、10 個の断片を一回りしたら Ver.2.0(D335)
function drawTitle(t) {
  if (!title.on) return;
  const P = window.bogiPix;
  const fade = title.leaving ? Math.max(0, 1 - (performance.now() / 1000 - (title.leaveT || (title.leaveT = performance.now() / 1000))) / 0.8) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  const S = 4;
  const name = title.crash && title.crash.fx.includes("moji") ? crashGarble("ぼぎだぢ", t) : "ぼぎだぢ";
  const w = P.width(name) * S;
  const cy = VH / 2 + (TITLE_ROW * T32 - TITLE_CAM.y) * TITLE_CAM.z * 2; // 2 は画面の拡大(rpg の ZOOM)
  P.text(ctx, name, Math.round((VW - w) / 2 / S) * S, Math.round((cy - 8 * S) / S) * S, S, "#2b2b33");
  // つづきから / さいしょから(D261)。ほかの文字と同じ黒い窓に、選んでいる方に ▶。なにかボタンを押すまでは出さない(D298)
  const S2 = 2;
  const ver = GAME_VERSION;
  P.text(ctx, ver, VW - P.width(ver) * S2 - 12 * S2, VH - 22 * S2, S2, "#8a8a92");
  if (!title.menu) {
    ctx.restore();
    if (title.crash) drawCrashTitle(t);
    return;
  }
  const mw = Math.max(...TITLE_MENU.map((m) => P.width(m))) + 44;
  const mh = TITLE_MENU.length * 18 + 18;
  const mx = Math.round((VW - mw * S2) / 2 / S2) * S2;
  const my = Math.round((cy + 9 * S + 6) / S2) * S2;
  P.win(ctx, mx, my, mw * S2, mh * S2, S2);
  TITLE_MENU.forEach((m, i) => {
    const ty = my + (8 + i * 18) * S2;
    P.text(ctx, title.crash ? crashGarble(m, t + i) : m, mx + 28 * S2, ty, S2);
    if (i === title.sel && !title.ask) P.text(ctx, "▶", mx + 12 * S2, ty, S2);
  });
  if (title.ask) {
    const S2 = 2;
    const ww = 300 * S2;
    const hh = 64 * S2;
    const x = Math.round((VW - ww) / 2 / S2) * S2;
    const y = Math.round((VH * 0.74) / S2) * S2;
    P.win(ctx, x, y, ww, hh, S2);
    P.text(ctx, "さいしょから　あそびなおしますか？", x + 14 * S2, y + 10 * S2, S2);
    ["いいえ", "はい"].forEach((s2, i) => {
      const tx = x + (90 + i * 80) * S2;
      P.text(ctx, s2, tx, y + 36 * S2, S2);
      if (title.cur === i) P.text(ctx, "▶", tx - 14 * S2, y + 36 * S2, S2);
    });
  }
  ctx.restore();
  if (title.crash) drawCrashTitle(t);
}

// ---- こわれたふり(D521) ----
// 形而アップダウンクイズで、ぴーが 3 回目に当てると、バグが番組の外まであふれる。
// 絵が固まり、音が一つで鳴りっぱなし → ぷつっと暗転 → タイトル。タイトルもバグっている(毎回いくつかを選ぶ)。
// どのボタンでも、バグが一瞬強くなってから、何事もなかったようにスタジオの舞台の前に戻る。保存はこわさない
const CRASH = { freeze: 2.5, black: 0.8, spike: 0.8 };
const CRASH_FX = ["moji", "shift", "invert", "flip", "stuck", "dots", "color", "tear"];
const crash = { on: false, t: 0, snap: null };
const crashTmp = document.createElement("canvas");
crashTmp.width = VW;
crashTmp.height = VH;
const crashTmpCtx = crashTmp.getContext("2d");
const crashRnd = (n) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};
const CRASH_CHARS = "縺ｼ縺弱□縺｢ぼぎだぢ■▒░▓◆ﾎﾞｷﾞﾀﾞﾁﾞ#%&@";
function crashGarble(str, t) {
  const f = Math.floor(t * 6);
  return [...str].map((ch, i) => (crashRnd(f * 7 + i) < 0.7 ? [...CRASH_CHARS][Math.floor(crashRnd(f * 13 + i * 3) * [...CRASH_CHARS].length)] : ch)).join("");
}
function bogiCrash() {
  if (crash.on) return;
  const snap = document.createElement("canvas");
  snap.width = VW;
  snap.height = VH;
  snap.getContext("2d").drawImage(canvas, 0, 0);
  // タイトルのバグを毎回 4 つ選ぶ
  const fx = CRASH_FX.slice().sort(() => Math.random() - 0.5).slice(0, 4);
  if (!fx.includes("moji") && Math.random() < 0.6) fx[0] = "moji";
  Object.assign(crash, { on: true, t: 0, snap, fx });
  transitioning = true; // 入力を受けない
  resetJoy();
  if (window.bogiAudio) window.bogiAudio.bgm("silence"), window.bogiAudio.sfx("crashBuzz");
}
window.bogiCrash = bogiCrash;
function updateCrash(dt) {
  crash.t += dt;
  if (crash.t < CRASH.freeze + CRASH.black) return;
  crash.on = false;
  // タイトルへ(結末のあとと同じ戻り方。暗転のまま入れかえる)
  try {
    hasSave = !!localStorage.getItem(SAVE_KEY);
  } catch (e) {
    hasSave = false;
  }
  TITLE_MENU = hasSave ? ["つづきから", "さいしょから"] : ["さいしょから"];
  fadeOverlay.style.transition = "none";
  fadeOverlay.classList.add("on");
  void fadeOverlay.offsetWidth;
  fadeOverlay.style.transition = "";
  Object.assign(title, { on: true, leaving: false, leaveT: 0, menu: false, ask: false, cur: 0, sel: 0, crash: { fx: crash.fx, snap: crash.snap, spike: 0 } });
  transition(() => {
    rpg.enter(window.BOGI_WORLDS[HUB]);
    updateStatus();
  });
}
// 固まった絵: 写しとった最後の画面のまま。ときどき 1 本だけ帯がずれる。そのあと真っ黒
function drawCrash(t) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (crash.t < CRASH.freeze) {
    ctx.drawImage(crash.snap, 0, 0);
    const f = Math.floor(crash.t * 3);
    if (crashRnd(f) < 0.5) {
      const y = Math.floor(crashRnd(f + 1) * VH);
      ctx.drawImage(crash.snap, 0, y, VW, 6, Math.round((crashRnd(f + 2) - 0.5) * 40), y, VW, 6);
    }
    // 下の数行がくり返す(よくある止まり方)
    const ry = Math.floor(VH * 0.62);
    for (let y = ry + 8; y < VH; y += 8) ctx.drawImage(crash.snap, 0, ry, VW, 8, 0, y, VW, 8);
  } else {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, VW, VH);
  }
  ctx.restore();
}
function crashRecover() {
  if (title.leaving) return;
  title.leaving = true;
  title.crash.spike = performance.now() / 1000;
  if (window.bogiAudio) window.bogiAudio.sfx("crashTick");
  setTimeout(() => {
    transition(() => {
      title.on = false;
      title.crash = null;
      rpg.enter(window.BOGI_WORLDS.keiji);
      if (rpg.debug && rpg.debug.load) rpg.debug.load("studio", "stage");
      updateStatus();
    });
  }, CRASH.spike * 1000);
}
function drawCrashTitle(t) {
  const c = title.crash;
  const fx = c.fx;
  const f = Math.floor(t * 9);
  const sp = c.spike ? 2.5 : 1; // 押したあとは強く
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (fx.includes("flip") && (c.spike || Math.floor(t * 0.7) % 2 === 0)) {
    crashTmpCtx.clearRect(0, 0, VW, VH);
    crashTmpCtx.drawImage(canvas, 0, 0);
    ctx.save();
    ctx.translate(0, VH);
    ctx.scale(1, -1);
    ctx.drawImage(crashTmp, 0, 0);
    ctx.restore();
  }
  if (fx.includes("stuck")) {
    // クイズの画面の一部が、タイトルの上に残ったまま
    const sx = Math.floor(VW * 0.04), sy = Math.floor(VH * 0.62); // 題の字にはかからない、左下に
    ctx.drawImage(c.snap, sx, sy, VW * 0.42, VH * 0.32, sx, sy, VW * 0.42, VH * 0.32);
  }
  if (fx.includes("shift") || c.spike) {
    for (let j = 0; j < 6 * sp; j++) {
      const y = Math.floor(crashRnd(f * 31 + j) * VH);
      const h = 2 + Math.floor(crashRnd(f * 17 + j) * 30);
      ctx.drawImage(canvas, 0, y, VW, h, Math.round((crashRnd(f * 13 + j) - 0.5) * 160 * sp), y, VW, h);
    }
  }
  if (fx.includes("tear")) {
    for (let j = 0; j < 3 * sp; j++) {
      const x = Math.floor(crashRnd(f * 41 + j) * VW);
      const w = 8 + Math.floor(crashRnd(f * 23 + j) * 50);
      ctx.drawImage(canvas, x, 0, w, VH, x, Math.round((crashRnd(f * 29 + j) - 0.5) * 80 * sp), w, VH);
    }
  }
  if (fx.includes("dots")) {
    // 台座がでたらめに灯る(灯りの粒がばらばらにまたたく)
    for (let j = 0; j < 14; j++) {
      if (crashRnd(Math.floor(t * 4) * 5 + j) < 0.5) continue;
      ctx.fillStyle = j % 3 ? "rgba(255, 228, 140, 0.85)" : "rgba(240, 160, 184, 0.85)";
      ctx.fillRect(Math.floor(crashRnd(j * 7 + 1) * VW), Math.floor(crashRnd(j * 11 + 2) * VH), 6, 6);
    }
  }
  if (fx.includes("color")) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.3;
    ctx.drawImage(canvas, 8 * sp, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = Math.floor(t * 2) % 2 ? "#f0a0b8" : "#80e0d0";
    ctx.fillRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = "source-over";
  }
  if ((fx.includes("invert") && crashRnd(f * 61) < 0.25) || (c.spike && crashRnd(f * 67) < 0.5)) {
    ctx.globalCompositeOperation = "difference";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = "source-over";
  }
  // ぴーの色の塊
  for (let j = 0; j < 4 * sp; j++) {
    if (crashRnd(f * 3 + j) < 0.5) continue;
    ctx.fillStyle = ["rgba(240, 160, 184, 0.7)", "rgba(20, 10, 24, 0.85)", "rgba(80, 220, 210, 0.5)"][j % 3];
    ctx.fillRect(Math.floor(crashRnd(f * 5 + j) * VW), Math.floor(crashRnd(f * 9 + j) * VH), 10 + Math.floor(crashRnd(f * 11 + j) * 200), 2 + Math.floor(crashRnd(f * 19 + j) * 14));
  }
  ctx.restore();
}
