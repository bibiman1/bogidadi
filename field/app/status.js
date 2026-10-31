// ステータス画面。
// field/app/ のファイルは index.html の順に読む(上のファイルで決めた名前を、下のファイルがそのまま使う)
"use strict";

// ---- ステータス画面 ----
// スーファミのドラクエ風: 320×200 に描き、文字は白黒の2値にしてから CSS でぼかさず拡大する
let statusOpen = false;
const stCanvas = document.getElementById("statusCanvas");
const stCtx = stCanvas.getContext("2d");
// 文字はほかの画面と同じ(window.bogiPix)。このキャンバスは 1 倍で描いて CSS で拡大する
const ST_FONT = () => "";
const stTmpCtx = { measureText: (t) => ({ width: window.bogiPix.width(t) }), set font(v) {} };
function stText(text, x, y, color = "#ffffff", maxW = 999) {
  const P = window.bogiPix;
  const full = window.bogiLang ? window.bogiLang.tr(text) : text; // 削る前に訳す(D487)
  let t = full;
  while (t.length > 1 && P.width(t) > maxW) t = t.slice(0, -1);
  if (t !== full) t = t.slice(0, -1) + "…";
  P.text(stCtx, t, x, y, 1, color);
}
// 白い二重枠の窓(角を 1 ドット落とす)
function stWindow(x, y, w, h) {
  window.bogiPix.win(stCtx, x, y, w, h, 1);
}

// 2段構え(スーファミのドラクエ風): 左のコマンドで選ぶ → 一覧(あふれたらページ送り)。右は数だけの要約
const ST_PAGE = 5; // 一覧の1ページの行数
const stMenu = { mode: "top", cmd: 0, cur: 0 };
const ST_CMDS = [
  { key: "items", label: "どうぐ" },
  { key: "memories", label: "おもいで" },
  { key: "skills", label: "とくぎ" },
  { key: "sound", label: "おと" }, // BGM と効果音の大きさ(D195)
  { key: "lang", label: "Language" }, // 日本語 / English(D487)。どちらの言葉でも読めるよう、名前は英語のまま
  { key: "save", label: "セーブ" }, // いる場所を記録する(D262、todo 55)。進み具合は前から自動で記録している
  // テストプレイ用: すべての条件を満たす(D294。灰色の字)。公開版では出さず、?debug のときだけ(D301)
  // フラグ(D385): 断片の旗を一つずつ ON / OFF、断片をはじめから。これも ?debug のときだけ
  ...(BOGI_DEBUG ? [{ key: "grant", label: "テスト" }, { key: "flags", label: "フラグ" }] : []),
  // はじめから(D94 のデバッグ用)は、タイトルで B を長押しする形に移した(D259)
];
// きーの能力(とくぎ)。断片で習得する。新しい能力はここに 1 行足し、断片で api.learnAbility(id) を呼ぶ
const ABILITIES = [
  { id: "osu", text: "おす", note: "押せる物に　むかって　あるく。" },
  { id: "jump", text: "ジャンプ", note: "Bボタン / Xキーで　とぶ。" },
  { id: "terasu", text: "てらす", note: "くらい所で　あおく　ひかる。" },
  { id: "hashiru", text: "はしる", note: "おなじ　むきに　あるきつづける。" },
  { id: "funbaru", text: "ふんばる", note: "風の中で　つぶれて　はりつく。" },
];
// フラグの画面(D385)で、はじめから並べる断片ごとの主な旗(名前: 説明)。保存に入っているほかの旗も並ぶ。
// 名前だけのものは、コードの setFlag から拾った(説明はまだない)
const ST_FLAGS = {
  kinsei: { boxed: "木箱をもった", placed: "台に置いた(ロケ)", dashed: "きこりが飛び出した", peel: "ピールをもった", gone: "きこりが消えた", pizza: "焼けたピザを取り出した", cut: "ピザを切り分けた", observed: "見届けた" },
  lake: { ate: "", homeward: "", memory: "", saidHoutou: "", observed: "見届けた" },
  haihei: { card: "", heard: "", prize: "", stand: "", observed: "見届けた" },
  kasumi: { jump: "", observed: "見届けた" },
  banana: { caught: "", chirinJoined: "", gotMango: "", observed: "見届けた" },
  suzuki: { cartOff: "", charred: "", fallen: "", landing: "", launched: "", observed: "見届けた" },
  takarabune: { airlock: "", cast: "", glowed: "", installed: "", running: "", sowing: "", observed: "見届けた" },
  noroi: { custom: "", fudaKept: "", nrRound: "", ponponGone: "", seeOffDone: "", stripSeen: "", won: "", pinHigh: "", observed: "見届けた" },
  padre: { ending_oneness: "", gone: "", taken: "", observed: "見届けた" },
  bomber: { cap: "", loadSeen: "", ribbonBlown: "", observed: "見届けた" },
  keiji: { lit: "明かりがついた(露出のあと)", observed: "見届けた" },
};
const stFlagWorld = () => (rpg.isHub ? stMenu.fw : rpg.worldId);
function stFlagRows() {
  const hub = window.BOGI_WORLDS[HUB];
  // 懲罰空間では、先に断片を選ぶ
  if (rpg.isHub && !stMenu.fw) return (hub.fragments || []).map((id) => ({ text: window.BOGI_WORLDS[id].name, pick: id }));
  const w = stFlagWorld();
  const names = Object.keys(ST_FLAGS[w] || {});
  for (const k of Object.keys(gameState.flags)) if (k.startsWith(`${w}.`) && !names.includes(k.slice(w.length + 1))) names.push(k.slice(w.length + 1));
  const rows = names.map((n) => {
    const v = gameState.flags[`${w}.${n}`];
    const on = !!v;
    return { flag: n, text: n, mark: typeof v === "number" ? String(v) : on ? "ON" : "OFF", on, note: (ST_FLAGS[w] || {})[n] || null };
  });
  rows.push({ text: "この断片をはじめから", reset: true, note: "旗、終えたこと、持ち帰った物を消す" });
  return rows;
}
// この断片をはじめから: その断片の旗、終えたこと、持ち帰った物(と謎解きの物)を消して、入りなおす
function stFlagReset(w) {
  const hub = window.BOGI_WORLDS[HUB];
  for (const k of Object.keys(gameState.flags)) if (k.startsWith(`${w}.`)) delete gameState.flags[k];
  gameState.cleared = gameState.cleared.filter((id) => id !== w);
  const pz = hub.puzzleItems || {};
  const sv = (hub.souvenirs || {})[w];
  gameState.items = gameState.items.filter((t) => t !== sv && pz[t] !== w);
  saveState();
  if (!rpg.isHub && rpg.worldId === w) {
    toggleStatus(false);
    rpg.enter(window.BOGI_WORLDS[w]);
  }
}
function stRows(key) {
  if (key === "flags") return stFlagRows();
  const hub = window.BOGI_WORLDS[HUB];
  // どうぐ: いまいる断片の謎解きに使う物だけ(断片を出たら出さない。持ち帰った物は「おもいで」へ)
  if (key === "items") {
    const pz = hub.puzzleItems || {};
    return gameState.items.filter((t) => pz[t] && pz[t] === rpg.worldId).map((t) => ({ text: t }));
  }
  // デバッグのとき(D301、todo 176)は、覚えていない能力も灰色で並べ、A で ON / OFF を切りかえる
  if (key === "skills" && BOGI_DEBUG) return ABILITIES.map((a) => {
    const on = rpg.hasAbility(a.id);
    return { ability: a.id, text: a.text, note: a.note, mark: on ? "ON" : "OFF", on, dim: !on };
  });
  if (key === "skills") return ABILITIES.filter((a) => rpg.hasAbility(a.id)).map((a) => ({ text: a.text, note: a.note }));
  // おもいで: 断片ごとに 1 枚。持ち帰った物と、見届けたしるし(見届けていなければ「……」。説明はしない)
  const texts = hub.fragmentTexts || {};
  const sv = hub.souvenirs || {};
  return (hub.fragments || []).map((id) => {
    if (!gameState.flags[`${HUB}.found.${id}`]) return { text: "？？？？", dim: true };
    const done = gameState.cleared.includes(id);
    const seen = !!gameState.flags[`${id}.observed`];
    const thing = sv[id] && gameState.items.includes(sv[id]) ? sv[id] : null;
    const icon = thing && (hub.souvenirIcons || {})[thing];
    // 説明は終えた断片にだけ(入る前に読むとネタバレになる)
    // 太宰治全集(D267): その断片の 1 冊を拾ったか。拾っていれば本、まだなら薄い本の影
    const bk = (window.BOGI_DAZAI || []).find((b) => b.w === id);
    const book = bk ? (gameState.flags[`${id}.dazai`] ? "got" : "miss") : null;
    const L = window.bogiLang;
    const tr = (s) => (L ? L.tr(s) : s);
    const note = done ? [tr(texts[id]), thing ? tr(`「${thing}」`) : null, book === "got" ? tr(`『${bk.title}』`) : null].filter(Boolean).join(L && L.get() === "en" ? " " : "　") : null;
    return { text: window.BOGI_WORLDS[id].name, done, mark: done ? (seen ? "✦" : "……") : null, note, icon, book };
  });
}
const stIcons = {};
function stIcon(key) {
  if (!stIcons[key]) {
    stIcons[key] = new Image();
    stIcons[key].onload = () => statusOpen && renderStatus();
    stIcons[key].src = `./assets/icons/${key}.png`;
  }
  return stIcons[key];
}
function stCursor(x, y) {
  // ▶ をドットで描く
  stCtx.fillStyle = "#fff";
  for (let i = 0; i < 6; i++) stCtx.fillRect(x + i, y + i, 1, 13 - i * 2);
}
function renderStatus() {
  const hub = window.BOGI_WORLDS[HUB];
  stCtx.fillStyle = "#000";
  stCtx.fillRect(0, 0, 480, 300);
  // 左: コマンド
  stWindow(12, 12, 156, 118);
  // デバッグのとき(コマンドが 6 つより多い)は、テストとフラグを右の列の下に置く(縦に 7 つは窓に入らない)
  const cmdPos = (i) => (ST_CMDS.length > 6 && i >= 5 ? [118, 21 + (i - 2) * 17] : [42, 21 + i * 17]);
  ST_CMDS.forEach((c, i) => {
    const [x, y] = cmdPos(i);
    stText(c.label, x, y, c.key === "reset" || c.key === "grant" || c.key === "flags" ? "#8a8a8a" : "#ffffff");
    if (stMenu.cmd === i) stCursor(x - 18, y + 3);
  });
  // 右: 要約(数だけ。いくつ増えてもあふれない)
  const frags = hub.fragments || [];
  const found = frags.filter((id) => gameState.flags[`${HUB}.found.${id}`]).length;
  stWindow(176, 12, 292, 118);
  stText("きー", 192, 24);
  stText(`ばしょ：${rpg.isHub ? hub.name : rpg.worldName}`, 192, 48, "#ffffff", 264);
  stText(`断片　${found}/${frags.length}`, 192, 72);
  stText(`おもいで　${frags.filter((id) => gameState.cleared.includes(id)).length}`, 192, 96);
  // 太宰治全集(D214): 拾った冊数だけ(全部で何冊かは見せない。小さなメダルのように)
  const books = (window.BOGI_DAZAI || []).filter((b) => gameState.flags[`${b.w}.dazai`]).length;
  if (books) stText(`ほん　${books}`, 340, 96);
  if (stMenu.mode === "save") {
    // セーブ(D262): 懲罰空間ではその場所、断片の中ではその断片の入り口から、つづきができる
    stWindow(12, 138, 456, 150);
    stText("きろくしました。", 28, 150);
    stText(rpg.isHub ? "つづきは　ここから。" : "つづきは　この断片の　はじめから。", 40, 184, "#8a8a8a");
  } else if (stMenu.mode === "sound") {
    // おと: 上下で選び、左右で大きさを変える(0〜5)
    const A = window.bogiAudio;
    stWindow(12, 138, 456, 150);
    stText("おと", 28, 150);
    [["bgm", "BGM"], ["sfx", "こうかおん"]].forEach(([k, label], i) => {
      const ty = 184 + i * 32;
      if (stMenu.cur === i) stCursor(28, ty + 2);
      stText(label, 50, ty);
      const v = A ? A.volume[k] : 0;
      stText("■".repeat(v) + "□".repeat(5 - v), 200, ty, v ? "#ffffff" : "#8a8a8a");
    });
    stText("左右で　かえる", 300, 262, "#8a8a8a");
  } else if (stMenu.mode === "lang") {
    // ことば(D487): 上下で選び、A で決める。絵の中の文字は日本語のまま
    const now = window.bogiLang ? window.bogiLang.get() : "ja";
    stWindow(12, 138, 456, 150);
    stText("Language", 28, 150);
    [["ja", "日本語"], ["en", "English"]].forEach(([k, label], i) => {
      const ty = 184 + i * 32;
      if (stMenu.cur === i) stCursor(28, ty + 2);
      stText(label, 50, ty, now === k ? "#ffffff" : "#8a8a8a");
    });
  } else if (stMenu.mode === "grant") {
    // テストプレイ用: すべての条件を満たす
    stWindow(12, 138, 456, 150);
    stText("テスト　(テストプレイ用)", 28, 150);
    if (stMenu.cur === 2) {
      stText("そろえました。", 40, 184);
      stText(rpg.isHub ? "懲罰空間に　入りなおすと　扉が開きます。" : "懲罰空間に　もどると　扉が開きます。", 40, 212, "#8a8a8a");
    } else {
      stText("断片、おもいで、本、とくぎを　ぜんぶ", 40, 178);
      stText("そろえますか？", 40, 200);
      ["いいえ", "はい"].forEach((t, i) => {
        stText(t, 80 + i * 120, 240);
        if (stMenu.cur === i) stCursor(62 + i * 120, 243);
      });
    }
  } else if (stMenu.mode === "reset") {
    // はじめから(デバッグ用): 保存を消して、最初の状態から遊び直す
    stWindow(12, 138, 456, 150);
    stText("はじめから　(デバッグ用)", 28, 150);
    stText("どうぐ、ことば、断片、とくぎを　ぜんぶ消して", 40, 178);
    stText("最初の状態にもどしますか？", 40, 200);
    ["いいえ", "はい"].forEach((t, i) => {
      stText(t, 80 + i * 120, 240);
      if (stMenu.cur === i) stCursor(62 + i * 120, 243);
    });
  } else if (stMenu.mode === "list") {
    const cmd = ST_CMDS[stMenu.cmd];
    const rows = stRows(cmd.key);
    const pages = Math.max(1, Math.ceil(rows.length / ST_PAGE));
    const page = Math.floor(stMenu.cur / ST_PAGE);
    stWindow(12, 138, 456, 150);
    stText(cmd.key === "flags" && stFlagWorld() ? `フラグ　${window.BOGI_WORLDS[stFlagWorld()].name}` : cmd.label, 28, 150, "#ffffff", 380);
    if (pages > 1) stText(`${page + 1}/${pages}`, 420, 150, "#8a8a8a");
    if (!rows.length) stText("なし", 50, 174, "#8a8a8a");
    rows.slice(page * ST_PAGE, page * ST_PAGE + ST_PAGE).forEach((r, i) => {
      const ty = 174 + i * 22;
      if (page * ST_PAGE + i === stMenu.cur) stCursor(28, ty + 2);
      if (r.done) stText("✓", 40, ty);
      stText(r.text, 58, ty, r.dim ? "#8a8a8a" : "#ffffff", 196);
      if (r.mark) stText(r.mark, 258, ty, r.mark === "✦" || r.mark === "ON" || /^\d/.test(r.mark) ? "#ffe08a" : "#8a8a8a");
      if (r.book) {
        const bim = stIcon("../props/bunko");
        if (bim && bim.complete) {
          stCtx.globalAlpha = r.book === "got" ? 1 : 0.22;
          stCtx.drawImage(bim, 274, ty + 1);
          stCtx.globalAlpha = 1;
        }
      }
    });
    if (page < pages - 1) stText("▼", 440, 264);
    // 選んでいるものの説明(あれば)
    const sel = rows[stMenu.cur];
    if (sel && sel.note) {
      // 行の数に合わせて窓をのばす(作品名まで入ると 3 行におさまらず切れていた。2026-10-10、作者「文字が切れて読めない」)
      // アイコン(持ち帰った物)の横の 2 行はせまく、その下は窓の幅いっぱいに
      const P = window.bogiPix;
      const note = window.bogiLang ? window.bogiLang.tr(sel.note) : sel.note;
      const en = window.bogiLang && window.bogiLang.get() === "en";
      let lines = P.wrap(note, sel.icon ? 106 : 146);
      if (sel.icon && lines.length > 2) {
        const head = lines.slice(0, 2);
        lines = head.concat(P.wrap(note.slice(head.join(en ? " " : "").length).trimStart(), 146));
      }
      const lh = lines.length > 5 ? 18 : 21;
      const h = Math.min(132, 22 + lines.length * lh);
      const wy = Math.min(164, 286 - h);
      stWindow(290, wy, 168, h);
      lines.forEach((line, i) => stText(line, 302, wy + 12 + i * lh));
      const im = sel.icon && stIcon(sel.icon);
      if (im && im.complete) stCtx.drawImage(im, 418, wy + 8);
    }
  } else {
    // パソコンでは A ボタンがないので、キーの名前で(画面をさわっていればボタンの名前)
    stText(touchLast() ? "A でひらく　C でとじる" : "Enter でひらく　C でとじる", touchLast() ? 262 : 232, 276, "#8a8a8a");
  }
}
// スマホ: ジョイスティックを倒すたびに1つ動く(倒しっぱなしなら少しずつ送る)
let stJoyDir = null;
let stJoyNext = 0;
function statusJoystick(input = statusInput) {
  const now = performance.now();
  let dir = null;
  if (joyActive) {
    if (joyVec.y < -0.6) dir = "up";
    else if (joyVec.y > 0.6) dir = "down";
    else if (joyVec.x < -0.6) dir = "left";
    else if (joyVec.x > 0.6) dir = "right";
  }
  if (dir && (dir !== stJoyDir || now >= stJoyNext)) {
    input(dir);
    stJoyNext = now + (dir !== stJoyDir ? 420 : 160);
  }
  stJoyDir = dir;
}
// 操作: 上下で選ぶ、A でひらく、B / C でひとつ戻る(最初の画面ならとじる)
// メニューの音(カーソル / 決める / もどる)と、スマホの振動
function menuFeedback(action) {
  const name = action === "a" ? "ok" : action === "b" || action === "c" ? "back" : "cursor";
  if (window.bogiAudio) window.bogiAudio.sfx(name);
}
function statusInput(action) {
  if (!(stMenu.mode === "sound" && (action === "left" || action === "right"))) menuFeedback(action);
  if (stMenu.mode === "top") {
    if (action === "up") stMenu.cmd = (stMenu.cmd + ST_CMDS.length - 1) % ST_CMDS.length;
    else if (action === "down") stMenu.cmd = (stMenu.cmd + 1) % ST_CMDS.length;
    else if (action === "a") {
      const k = ST_CMDS[stMenu.cmd].key;
      if (k === "save") saveHere();
      stMenu.mode = k === "reset" || k === "sound" || k === "save" || k === "grant" || k === "lang" ? k : "list";
      stMenu.cur = k === "lang" && window.bogiLang && window.bogiLang.get() === "en" ? 1 : 0;
      stMenu.fw = null;
    } else if (action === "b" || action === "c") return toggleStatus(false);
  } else if (stMenu.mode === "save") {
    stMenu.mode = "top"; // 「きろくしました」は、どのボタンでも閉じる
  } else if (stMenu.mode === "sound") {
    const A = window.bogiAudio;
    const k = stMenu.cur === 0 ? "bgm" : "sfx";
    if (action === "up" || action === "down") stMenu.cur = 1 - stMenu.cur;
    else if (A && (action === "left" || action === "right")) {
      A.setVolume(k, A.volume[k] + (action === "right" ? 1 : -1));
      if (k === "sfx") A.sfx("pop");
    } else if (action === "b" || action === "c" || action === "a") stMenu.mode = "top";
  } else if (stMenu.mode === "lang") {
    if (action === "up" || action === "down") stMenu.cur = 1 - stMenu.cur;
    else if (action === "a") {
      if (window.bogiLang) window.bogiLang.set(stMenu.cur === 1 ? "en" : "ja");
      stMenu.mode = "top";
    } else if (action === "b" || action === "c") stMenu.mode = "top";
  } else if (stMenu.mode === "grant") {
    if (stMenu.cur === 2) stMenu.mode = "top"; // 「そろえました」は、どのボタンでも閉じる
    else if (action === "left" || action === "right" || action === "up" || action === "down") stMenu.cur = 1 - stMenu.cur;
    else if (action === "a") {
      if (stMenu.cur === 1) {
        grantAll();
        stMenu.cur = 2;
      } else stMenu.mode = "top";
    } else if (action === "b" || action === "c") stMenu.mode = "top";
  } else if (stMenu.mode === "reset") {
    if (action === "left" || action === "right" || action === "up" || action === "down") stMenu.cur = 1 - stMenu.cur;
    else if (action === "a") {
      if (stMenu.cur === 1) return resetGame();
      stMenu.mode = "top";
    } else if (action === "b" || action === "c") stMenu.mode = "top";
  } else {
    const n = stRows(ST_CMDS[stMenu.cmd].key).length;
    if (action === "up" && n) stMenu.cur = (stMenu.cur + n - 1) % n;
    else if (action === "down" && n) stMenu.cur = (stMenu.cur + 1) % n;
    else if (action === "left" && n) stMenu.cur = Math.max(0, stMenu.cur - ST_PAGE);
    else if (action === "right" && n) stMenu.cur = Math.min(n - 1, stMenu.cur + ST_PAGE);
    else if (action === "a" && ST_CMDS[stMenu.cmd].key === "flags") {
      // フラグ(D385): 断片を選ぶ / 旗を ON・OFF / この断片をはじめから
      const r = stRows("flags")[stMenu.cur];
      if (r && r.pick) {
        stMenu.fw = r.pick;
        stMenu.cur = 0;
      } else if (r && r.reset) stFlagReset(stFlagWorld());
      else if (r && r.flag) {
        const k = `${stFlagWorld()}.${r.flag}`;
        if (r.on) delete gameState.flags[k];
        else gameState.flags[k] = true;
        saveState();
      }
    } else if (action === "a" && ST_CMDS[stMenu.cmd].key === "skills" && BOGI_DEBUG) {
      // 能力の ON / OFF(デバッグ用、todo 176)。OFF は、ジャンプの古い保存のしるしも消す
      const r = stRows("skills")[stMenu.cur];
      if (r && r.ability) {
        if (r.on) {
          delete gameState.flags[`ability.${r.ability}`];
          if (r.ability === "jump") delete gameState.flags["kasumi.jumpLearned"];
        } else gameState.flags[`ability.${r.ability}`] = true;
        saveState();
      }
    } else if (action === "b" || action === "c") {
      // 懲罰空間で断片を選んだあとは、断片えらびへ戻る
      if (ST_CMDS[stMenu.cmd].key === "flags" && rpg.isHub && stMenu.fw) {
        stMenu.cur = 0;
        stMenu.fw = null;
      } else stMenu.mode = "top"; // 一覧からは C でもひとつ戻る
    }
  }
  if (statusOpen) renderStatus();
}
function toggleStatus(open = !statusOpen) {
  if (open && (story || transitioning || rpg.viewing)) return;
  statusOpen = open;
  if (open) {
    if (window.bogiAudio) window.bogiAudio.sfx("ok");
    stMenu.mode = "top";
    stMenu.cur = 0;
    renderStatus();
    resetJoy();
    for (const k in keys) keys[k] = false;
  }
  statusOverlay.hidden = !open;
  document.body.classList.toggle("status-open", open);
}
