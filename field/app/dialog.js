// 会話(文字の出る窓)。
// field/app/ のファイルは index.html の順に読む(上のファイルで決めた名前を、下のファイルがそのまま使う)
"use strict";

// ---- 会話(文字の出る窓) ----
// 画面下の黒い窓にドット文字で出す(ステータスや吹き出しと同じ文字と窓)。1 ページは 3 行まで、あふれたら次のページへ
const STORY_REVEAL_CHARS_PER_SEC = 38;
const MSG = { x: 12, y: 186, w: 456, h: 102, lines: 3, textW: 420 }; // 480×300 の単位(マップの絵と同じドット)
let story = null; // { pages, index, lines, total, revealed, onDone }

// pages: 文字列(ナレーション) / [話者, 台詞] / { title, text, face, choices } の配列
// face: 顔の絵(今の世界の画像の名前)。窓の左に出す。choices: 選択肢(最後のページで選ぶ)。onDone(選んだ番号)
const FACE_W = 88; // 顔の窓の幅(480×300 の単位)
function startDialog(pages, onDone) {
  const norm = [];
  for (const p of pages) {
    const page = typeof p === "string" ? { title: "", text: p } : Array.isArray(p) ? { title: p[0], text: p[1] } : p;
    const textW = MSG.textW - (page.face ? FACE_W + 6 : 0);
    const lines = window.bogiPix.wrap(page.text, textW);
    for (let i = 0; i < lines.length; i += MSG.lines) {
      const last = i + MSG.lines >= lines.length;
      norm.push({ title: page.title, face: page.face, voice: page.voice, lines: lines.slice(i, i + MSG.lines), choices: last ? page.choices : null });
    }
  }
  story = { pages: norm, index: 0, lines: [], total: 0, revealed: 0, choice: 0, onDone: onDone || null };
  showStoryPage();
  storyOverlay.hidden = false;
  resetJoy();
  joystick.style.display = "none";
}

function showStoryPage() {
  const page = story.pages[story.index];
  story.lines = page.lines;
  story.title = page.title;
  story.face = page.face;
  story.choices = page.choices;
  story.voice = page.voice; // 声: 文字が出るあいだ、数文字ごとに鳴らす効果音の名前
  story.choice = 0;
  story.total = page.lines.join("").length;
  story.revealed = 0;
  // 選択肢のあるページでは、スマホのジョイスティックで選べるように出しておく
  joystick.style.display = page.choices ? "" : "none";
}

function updateStory(dt) {
  const before = Math.floor(story.revealed);
  story.revealed = Math.min(story.total, story.revealed + STORY_REVEAL_CHARS_PER_SEC * dt);
  // 声: 3 文字ごとに一つ(空白と記号は鳴らさない)
  if (story.voice && window.bogiAudio) {
    const text = story.lines.join("");
    for (let i = before; i < Math.floor(story.revealed); i++) {
      if (i % 3 === 0 && /[^\s!?.,…]/.test(text[i] || "")) {
        window.bogiAudio.sfx(story.voice);
        break;
      }
    }
  }
}

// 選択肢が出ているか(文字を出し終わったあと)
const choosing = () => story && story.choices && story.revealed >= story.total;

function drawStory(t) {
  const P = window.bogiPix;
  const S = 2;
  // 顔の窓(左)。文字の窓はその右
  let tx = MSG.x;
  if (story.face) {
    P.win(ctx, MSG.x * S, MSG.y * S, FACE_W * S, MSG.h * S, S);
    const im = rpg.image(story.face);
    if (im) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(im, (MSG.x + (FACE_W - 64) / 2) * S, (MSG.y + (MSG.h - 64) / 2) * S, 64 * S, 64 * S);
      ctx.restore();
    }
    tx = MSG.x + FACE_W + 6;
  }
  const tw = MSG.x + MSG.w - tx;
  // 話者(題)は窓の上に小さな窓で
  if (story.title) {
    const tw2 = P.width(story.title) + 20;
    P.win(ctx, tx * S, (MSG.y - 30) * S, tw2 * S, 30 * S, S);
    P.text(ctx, story.title, (tx + 10) * S, (MSG.y - 23) * S, S, "#ffe08a");
  }
  P.win(ctx, tx * S, MSG.y * S, tw * S, MSG.h * S, S);
  let left = Math.floor(story.revealed);
  story.lines.forEach((line, i) => {
    if (left <= 0) return;
    const part = line.slice(0, left);
    left -= line.length;
    P.text(ctx, part, (tx + 16) * S, (MSG.y + 12 + i * 26) * S, S);
  });
  if (choosing()) {
    // 選択肢の窓(文字の窓の右上に重ねる)。▶ で選ぶ
    const cw = Math.max(...story.choices.map((c) => P.width(c))) + 44;
    const ch = 16 + story.choices.length * 24;
    const cx = MSG.x + MSG.w - cw;
    const cy = MSG.y - ch - 4;
    P.win(ctx, cx * S, cy * S, cw * S, ch * S, S);
    story.choices.forEach((c, i) => {
      P.text(ctx, c, (cx + 28) * S, (cy + 9 + i * 24) * S, S);
      if (i === story.choice) {
        ctx.fillStyle = "#fff";
        for (let k = 0; k < 6; k++) ctx.fillRect((cx + 12 + k) * S, (cy + 12 + i * 24 + k) * S, S, (13 - k * 2) * S);
      }
    });
  } else if (story.revealed >= story.total && Math.floor(t * 2.5) % 2 === 0) {
    // 読み終わったら ▼ を点滅(次へ)
    P.text(ctx, "▼", (MSG.x + MSG.w - 26) * S, (MSG.y + MSG.h - 24) * S, S);
  }
}

// 選択肢: 上下で選ぶ
function moveChoice(d) {
  if (!choosing()) return;
  const n = story.choices.length;
  story.choice = (story.choice + d + n) % n;
}
// スマホ: 選択肢のあいだはジョイスティックを倒すたびに 1 つ動く
let choiceJoyDir = 0;
function choiceJoystick() {
  if (!choosing()) return;
  const d = joyActive ? (joyVec.y < -0.6 ? -1 : joyVec.y > 0.6 ? 1 : 0) : 0;
  if (d && d !== choiceJoyDir) moveChoice(d);
  choiceJoyDir = d;
}

function closeStory(choice) {
  const done = story.onDone;
  story = null;
  storyOverlay.hidden = true;
  joystick.style.display = "";
  if (done) done(choice);
}

function advanceStory() {
  if (!story) return;
  if (story.revealed < story.total) {
    story.revealed = story.total;
    return;
  }
  if (story.index < story.pages.length - 1) {
    story.index += 1;
    showStoryPage();
    return;
  }
  closeStory(story.choices ? story.choice : undefined);
}

// Bは会話を飛ばす。飛ばしても、会話の結果(道具・フラグ)は反映する
function skipStory() {
  if (!story) return;
  // 選択肢があるなら B は「いいえ」(最後の選択肢)
  const last = story.pages[story.pages.length - 1];
  closeStory(last.choices ? last.choices.length - 1 : undefined);
}
