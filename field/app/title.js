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
const GAME_VERSION = "Ver.1.2"; // 断片を 1 つ更新して公開するたびに点のあとを 1 つ上げ、10 個の断片を一回りしたら Ver.2.0(D335)
function drawTitle(t) {
  if (!title.on) return;
  const P = window.bogiPix;
  const fade = title.leaving ? Math.max(0, 1 - (performance.now() / 1000 - (title.leaveT || (title.leaveT = performance.now() / 1000))) / 0.8) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  const S = 4;
  const name = "ぼぎだぢ";
  const w = P.width(name) * S;
  const cy = VH / 2 + (TITLE_ROW * T32 - TITLE_CAM.y) * TITLE_CAM.z * 2; // 2 は画面の拡大(rpg の ZOOM)
  P.text(ctx, name, Math.round((VW - w) / 2 / S) * S, Math.round((cy - 8 * S) / S) * S, S, "#2b2b33");
  // つづきから / さいしょから(D261)。ほかの文字と同じ黒い窓に、選んでいる方に ▶。なにかボタンを押すまでは出さない(D298)
  const S2 = 2;
  const ver = GAME_VERSION;
  P.text(ctx, ver, VW - P.width(ver) * S2 - 12 * S2, VH - 22 * S2, S2, "#8a8a92");
  if (!title.menu) {
    ctx.restore();
    return;
  }
  const mw = Math.max(...TITLE_MENU.map((m) => P.width(m))) + 44;
  const mh = TITLE_MENU.length * 18 + 18;
  const mx = Math.round((VW - mw * S2) / 2 / S2) * S2;
  const my = Math.round((cy + 9 * S + 6) / S2) * S2;
  P.win(ctx, mx, my, mw * S2, mh * S2, S2);
  TITLE_MENU.forEach((m, i) => {
    const ty = my + (8 + i * 18) * S2;
    P.text(ctx, m, mx + 28 * S2, ty, S2);
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
}
