// 保存と、世界の出入り。ここでエンジン(rpg.js)を作る。
// field/app/ のファイルは index.html の順に読む(上のファイルで決めた名前を、下のファイルがそのまま使う)
"use strict";

// ---- デバッグ(D301、D385、D386) ----
// URL の ?debug か、ゲームの中で 上上下下左右左右BA を入れたとき(この端末に覚える。もう一度入れると消える)
const DEBUG_KEY = "bogidachi.debug";
const BOGI_DEBUG = /[?&]debug\b/.test(location.search) || (() => {
  try {
    return localStorage.getItem(DEBUG_KEY) === "1";
  } catch (e) {
    return false;
  }
})();
const CHEAT = ["up", "up", "down", "down", "left", "right", "left", "right", "b", "a"];
let cheatPos = 0;
// 上下左右と A・B を一つずつ受けとり、上上下下左右左右BA がそろったら、デバッグを入れる / 切って、読みこみなおす
function cheatFeed(t) {
  cheatPos = t === CHEAT[cheatPos] ? cheatPos + 1 : t === CHEAT[0] ? 1 : 0;
  if (cheatPos < CHEAT.length) return;
  cheatPos = 0;
  try {
    if (localStorage.getItem(DEBUG_KEY) === "1") localStorage.removeItem(DEBUG_KEY);
    else localStorage.setItem(DEBUG_KEY, "1");
  } catch (e) {
    return;
  }
  if (window.bogiAudio) window.bogiAudio.sfx("chime");
  setTimeout(() => location.reload(), 400);
}

// ---- 保存 ----
const SAVE_KEY = "bogidachi.field.v1";
const gameState = loadState();

function loadState() {
  const empty = { items: [], words: [], cleared: [], flags: {} };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return empty;
    const st = Object.assign(empty, JSON.parse(raw));
    // 廃兵院は景品をもらえば終わり(D266)。前の版で景品だけもらって屋上へ行かなかった保存も、終えたことにする
    if (st.items.includes("おたかぽっぽ") && !st.cleared.includes("haihei")) st.cleared.push("haihei");
    // きこりと金星の持ち帰る物は、電池から焼けたピザに替えた(D380)。前の版の保存の電池は、焼けたピザにする
    // さらに、ピザを切り分けて残ったひと切れに替えた(D395)
    st.items = st.items.map((it) => (it === "電池" || it === "焼けたピザ" ? "焼けたピザのひと切れ" : it));
    return st;
  } catch (e) {
    return empty;
  }
}

// はじめから(デバッグ用): 保存を消して、読みこみ直す(最初の状態にもどる)
function resetGame() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    // 保存できない環境でも、読みこみ直せば最初からになる
  }
  location.reload();
}

// テストプレイ用(作者の注文): すべての条件を満たした状態にする。断片を見つけて終え、見届け、持ち帰った物、
// 太宰治全集 10 冊、とくぎ全部、真のエンディング(C)を見たしるし(書庫が開く)。扉が開く場面などは、懲罰空間に戻ったときに流れる
function grantAll() {
  const hub = window.BOGI_WORLDS[HUB];
  const f = gameState.flags;
  for (const id of hub.fragments || []) {
    f[`${HUB}.found.${id}`] = true;
    f[`${id}.observed`] = true;
    if (!gameState.cleared.includes(id)) gameState.cleared.push(id);
    const thing = (hub.souvenirs || {})[id];
    if (thing && !gameState.items.includes(thing)) gameState.items.push(thing);
  }
  for (const b of window.BOGI_DAZAI || []) f[`${b.w}.dazai`] = true;
  for (const a of ABILITIES) f[`ability.${a.id}`] = true;
  f["finale.ending_c"] = true;
  saveState();
}

// セーブ(D262): いる場所を記録する。懲罰空間はその場所、断片(と最後の場面)はその世界の入り口
// 断片の途中の段取り(紙芝居の何枚目か、競争の何戦目か)は記録できないので、入り口から
function saveHere() {
  const id = rpg.worldId;
  const st = rpg.debug.state();
  gameState.place = id === HUB ? { world: HUB, x: Math.round(st.x), y: Math.round(st.y) } : { world: id };
  saveState();
  if (window.bogiAudio) window.bogiAudio.sfx("chime");
}

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  } catch (e) {
    // 保存できない環境(プライベートモードなど)では、その回かぎり
  }
  updateStatus();
}

// ---- 世界の出入り ----
const HUB = "void";
let transitioning = false;

function transition(fn) {
  transitioning = true;
  resetJoy();
  fadeOverlay.classList.add("on");
  setTimeout(() => {
    fn();
    // 画像を読み終わるまで暗いまま。読み終わったらフェードイン
    rpg.whenReady(() => {
      // 読み終わってからも少しだけ暗いまま待つ(入った直後に位置を決め直す人や車椅子が、一瞬ワープして見えないように)
      setTimeout(() => {
        fadeOverlay.classList.remove("on");
        setTimeout(() => {
          transitioning = false;
        }, 300);
      }, 350);
    });
  }, 480);
}

const rpg = window.createBogiRPG({
  ctx,
  VW,
  VH,
  host: {
    say: startDialog,
    state: gameState,
    save: saveState,
    fade: (fn) => transition(fn),
    // 懲罰空間の断片から、その断片の世界へ
    enterWorld(id) {
      if (!window.BOGI_WORLDS[id]) return;
      transition(() => {
        rpg.enter(window.BOGI_WORLDS[id]);
        updateStatus();
      });
    },
    // 断片の世界から、懲罰空間のその断片の前へ
    exit(id) {
      transition(() => {
        rpg.enter(window.BOGI_WORLDS[HUB], `from_${id}`);
        updateStatus();
      });
    },
  },
});

if (BOGI_DEBUG) {
  window.bogiDebug = { rpg, gameState, enterWorld: (id) => rpg.enter(window.BOGI_WORLDS[id]) };
}

function updateStatus() {
  if (!progressText || !inventoryText) return; // 画面の外の行はなくした(D258)
  const hub = window.BOGI_WORLDS[HUB];
  const frags = hub.fragments || [];
  const found = frags.filter((id) => gameState.flags[`${HUB}.found.${id}`]).length;
  progressText.textContent = rpg.isHub ? `見つけた断片: ${found} / ${frags.length}` : `断片のなか: ${rpg.worldName}`;
  const parts = [];
  if (gameState.items.length) parts.push(`もちもの: ${gameState.items.join("、")}`);
  if (gameState.words.length) parts.push(`ことば: ${gameState.words.join("、")}`);
  inventoryText.textContent = parts.join("　／　");
  inventoryText.hidden = parts.length === 0;
}
