// 入力(キー、十字キー、ボタン)。
// field/app/ のファイルは index.html の順に読む(上のファイルで決めた名前を、下のファイルがそのまま使う)
"use strict";

// ---- 入力 ----
const keys = { up: false, down: false, left: false, right: false };
const KEY_MAP = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
};

window.addEventListener("keydown", (e) => {
  // 上上下下左右左右BA(D386): どの画面でも数える
  if (!e.repeat) {
    const t = KEY_MAP[e.code] || (e.code === "KeyX" || e.code === "Escape" ? "b" : e.code === "Enter" || e.code === "Space" || e.code === "KeyZ" ? "a" : null);
    if (t) cheatFeed(t);
  }
  // 操作を止めているあいだ(B のスタッフロール D277)は、どのキーも受けつけない
  if (rpg.locked) {
    if (!e.code.startsWith("F")) e.preventDefault();
    if (!e.repeat && !e.code.startsWith("F")) rpg.lockedPress(); // スタッフロールの「おわり」のあとは、どのキーでもタイトルへ
    return;
  }
  const isAction = e.code === "Enter" || e.code === "Space" || e.code === "KeyZ";
  // TIME(D269): 時計のあいだは、どのキーでも元の場面へ。パソコンには時計の入り口はない(D270)
  if (watch.on) {
    if (!e.repeat && !e.code.startsWith("F")) toggleWatch(false);
    if (!e.code.startsWith("F")) e.preventDefault();
    return;
  }

  // タイトル: A で始める、B 長押しで「はじめから」。ほかの操作は止める
  if (title.on) {
    const dir = KEY_MAP[e.code];
    if (!e.repeat) {
      if (dir) titleInput(dir);
      else if (isAction) titleInput("a");
      else if (e.code === "KeyX" || e.code === "Escape") titleInput("b");
      else if (!e.code.startsWith("F")) titleInput("any"); // 題だけの画面は、どのキーでも窓を出す(D298)
    }
    if (!e.code.startsWith("F")) e.preventDefault();
    return;
  }
  // ステータス画面: C で開閉。開いているあいだは C・B(X)・Esc・決定でとじ、ほかの操作は止める
  if (statusOpen) {
    const dir = KEY_MAP[e.code];
    if (dir) statusInput(dir);
    else if (!e.repeat) {
      if (isAction) statusInput("a");
      else if (e.code === "KeyX" || e.code === "Escape" || e.code === "Backspace") statusInput("b");
      else if (e.code === "KeyC") statusInput("c");
    }
    if (!e.code.startsWith("F")) e.preventDefault();
    return;
  }
  if (e.code === "KeyC" && !story) {
    if (!e.repeat) toggleStatus(true);
    e.preventDefault();
    return;
  }
  if (story) {
    if (isAction) {
      advanceStory();
      e.preventDefault();
    } else if (choosing() && (KEY_MAP[e.code] === "up" || KEY_MAP[e.code] === "down")) {
      moveChoice(KEY_MAP[e.code] === "up" ? -1 : 1);
      e.preventDefault();
    } else if (e.code === "KeyX" || e.code === "Escape") {
      if (!e.repeat) skipStory();
      e.preventDefault();
    }
    return;
  }
  if (isAction) {
    if (!transitioning && !e.repeat) rpg.interact();
    e.preventDefault();
    return;
  }
  if (e.code === "KeyX" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
    if (!transitioning && !e.repeat) rpg.pressB(); // 短く押すとジャンプ、押し続けると走る(はしる)
    e.preventDefault();
    return;
  }
  const dir = KEY_MAP[e.code];
  if (!dir) return;
  keys[dir] = true;
  e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  if (e.code === "KeyX" || e.code === "ShiftLeft" || e.code === "ShiftRight") rpg.releaseB();
  if (e.code === "Enter" || e.code === "Space" || e.code === "KeyZ") rpg.releaseA(); // 押し続け(ピンボールのフリッパー)
  const dir = KEY_MAP[e.code];
  if (!dir) return;
  keys[dir] = false;
  e.preventDefault();
});

const joyVec = { x: 0, y: 0 };
let joyActive = false;
let joyPointerId = null;
const JOY_RADIUS = 36;
const JOY_DEADZONE = 0.15;

function updateJoyKnob(dx, dy) {
  joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
}

function setJoyFromPointer(e, rect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const dist = Math.hypot(dx, dy);
  const R0 = isTouchDevice ? rect.width * 0.3 : JOY_RADIUS; // 十字キーは大きさに合わせる(D263)
  if (dist > R0) {
    dx = (dx / dist) * R0;
    dy = (dy / dist) * R0;
  }
  updateJoyKnob(dx, dy);
  joyVec.x = dx / R0;
  joyVec.y = dy / R0;
  if (isTouchDevice && dist > R0 * 0.25) {
    // 十字キー(D263): 8 方向にそろえる(キーボードの矢印と同じ動き)
    const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    joyVec.x = Math.round(Math.cos(ang) * 1000) / 1000;
    joyVec.y = Math.round(Math.sin(ang) * 1000) / 1000;
    // 押している所を丸で示す(8 方向のどれか。向きが変わったら小さく震える)
    updateJoyKnob(joyVec.x * R0 * 0.85, joyVec.y * R0 * 0.85);
    const d = Math.round(ang / (Math.PI / 4));
    if (d !== joyDir) {
      haptic();
      // 十字キーの上下左右も、上上下下左右左右BA に数える(ななめは数えない)
      const t = { "-2": "up", 2: "down", 0: "right", 4: "left", "-4": "left" }[d];
      if (t) cheatFeed(t);
    }
    joyDir = d;
  } else if (isTouchDevice) joyDir = null;
}
let joyDir = null;

function resetJoy() {
  joyActive = false;
  joyPointerId = null;
  joyVec.x = 0;
  joyVec.y = 0;
  joystick.classList.remove("active");
  updateJoyKnob(0, 0);
  joyDir = null;
}

// 十字キーを短くタップしても、一歩ぶんは歩く(すぐ離すと、ほとんど動かなかった。批評会 2 回目、D310)
const JOY_MIN_MS = 180;
let joyDownAt = 0;
let joyEndTimer = null;
joystick.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (watch.on) return toggleWatch(false);
  clearTimeout(joyEndTimer);
  joyDownAt = performance.now();
  joyActive = true;
  joyPointerId = e.pointerId;
  joystick.classList.add("active");
  joystick.setPointerCapture(e.pointerId);
  setJoyFromPointer(e, joystick.getBoundingClientRect());
});
joystick.addEventListener("pointermove", (e) => {
  if (!joyActive || e.pointerId !== joyPointerId) return;
  e.preventDefault();
  setJoyFromPointer(e, joystick.getBoundingClientRect());
});
const endJoy = (e) => {
  if (e.pointerId !== joyPointerId) return;
  const left = JOY_MIN_MS - (performance.now() - joyDownAt);
  if (left > 0 && e.type === "pointerup") {
    joyPointerId = null; // 次に押すまで、向きだけ残す
    joyEndTimer = setTimeout(resetJoy, left);
    return;
  }
  resetJoy();
};
joystick.addEventListener("pointerup", endJoy);
joystick.addEventListener("pointercancel", endJoy);

storyOverlay.addEventListener("click", () => {
  if (rpg.locked) return rpg.lockedPress();
  advanceStory();
});

// pointerdown (not click) so touch input reacts immediately, matching the
// joystick's own event handling rather than waiting on click synthesis
actionBtnA.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  cheatFeed("a");
  if (rpg.locked) return rpg.lockedPress();
  haptic();
  if (watch.on) return toggleWatch(false);
  if (title.on) titleInput("a");
  else if (statusOpen) statusInput("a");
  else if (story) advanceStory();
  else if (!transitioning) rpg.interact();
});
actionBtnC.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (rpg.locked) return rpg.lockedPress();
  haptic();
  if (watch.on) return toggleWatch(false);
  if (title.on) return titleInput("any"); // 題だけの画面なら窓を出す(D298)
  if (statusOpen) statusInput("c");
  else toggleStatus(true);
});
actionBtnB.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  cheatFeed("b");
  if (rpg.locked) return rpg.lockedPress();
  haptic();
  if (watch.on) return toggleWatch(false);
  if (title.on) return titleInput("b");
  if (statusOpen) return statusInput("b");
  if (story) skipStory();
  else if (!transitioning) rpg.pressB(); // B: 短く押すとジャンプ、押し続けると走る(覚えたあと)
});
actionBtnT.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (rpg.locked) return rpg.lockedPress();
  toggleWatch();
});
// 押した絵(todo 60): 押しているあいだ、ボタンを沈んだ絵にする
for (const b of [actionBtnA, actionBtnB, actionBtnC, actionBtnT]) {
  b.addEventListener("pointerdown", () => b.classList.add("pressed"));
  for (const ev of ["pointerup", "pointercancel", "pointerleave"]) b.addEventListener(ev, () => b.classList.remove("pressed"));
}
actionBtnB.addEventListener("pointerup", () => rpg.releaseB());
for (const ev of ["pointerup", "pointercancel", "pointerleave"]) actionBtnA.addEventListener(ev, () => rpg.releaseA());
actionBtnB.addEventListener("pointercancel", () => rpg.releaseB());
actionBtnB.addEventListener("pointerleave", () => rpg.releaseB());

function readInput() {
  if (rpg.locked) return { x: 0, y: 0 };
  let dx = 0;
  let dy = 0;
  const joyMag = Math.hypot(joyVec.x, joyVec.y);
  if (joyActive && joyMag > JOY_DEADZONE) {
    dx = joyVec.x;
    dy = joyVec.y;
  } else {
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
  }
  const len = Math.hypot(dx, dy);
  if (len > 1) {
    dx /= len;
    dy /= len;
  }
  return { x: dx, y: dy };
}
