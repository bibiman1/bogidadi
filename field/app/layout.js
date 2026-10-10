// 懲罰空間。断片の世界と同じRPGエンジン(rpg.js)の上で動く。
// 懲罰空間そのものも1つの世界(field/worlds/void.js)で、断片に触れると別の世界に入り、条件を満たすと戻ってくる。
//
// 画面まわりは field/app/ のファイルに分けて、ふつうの <script> として index.html の順に読む:
// layout → dialog → game → status → title → watch → input → loop。どれもページの一番外の場に置くので、名前を共有する
"use strict";

const canvas = document.getElementById("fieldCanvas");
const ctx = canvas.getContext("2d");
const VW = canvas.width;
const VH = canvas.height;

const introHint = document.getElementById("introHint");
const progressText = document.getElementById("progressText");
const inventoryText = document.getElementById("inventoryText");
const storyOverlay = document.getElementById("storyOverlay");
const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystickKnob");
const actionBtnA = document.getElementById("actionBtnA");
const actionBtnB = document.getElementById("actionBtnB");
const actionBtnC = document.getElementById("actionBtnC");
const actionBtnT = document.getElementById("actionBtnT");
const statusOverlay = document.getElementById("statusOverlay");
const fadeOverlay = document.getElementById("fadeOverlay");
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
// 振動: Android は vibrate。iPhone(Safari 18 から)は、スイッチの入力をさわると本体が小さく震えるのを使う
let hapticLabel = null;
function haptic() {
  if (!isTouchDevice) return;
  try {
    if (navigator.vibrate) return void navigator.vibrate(8);
    if (!hapticLabel) {
      hapticLabel = document.createElement("label");
      hapticLabel.setAttribute("aria-hidden", "true");
      hapticLabel.style.cssText = "position:fixed;left:-99px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
      const sw = document.createElement("input");
      sw.type = "checkbox";
      sw.setAttribute("switch", "");
      sw.tabIndex = -1;
      hapticLabel.appendChild(sw);
      document.body.appendChild(hapticLabel);
    }
    hapticLabel.click();
  } catch (e) {
    // 震えなくても遊べる
  }
}
if (isTouchDevice) {
  joystick.classList.add("touch-enabled");
  actionBtnA.classList.add("touch-enabled");
  actionBtnB.classList.add("touch-enabled");
  actionBtnC.classList.add("touch-enabled");
  actionBtnT.classList.add("touch-enabled");
}

const gameFrame = document.querySelector(".game-frame");
const consoleBezel = document.getElementById("consoleBezel");
// 最後に画面をさわったか(スマホのボタン)、キーボードを使ったか。案内の文字をそれに合わせる
let lastTouch = window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches;
window.addEventListener("keydown", () => (lastTouch = false), true);
window.addEventListener("touchstart", () => (lastTouch = true), { capture: true, passive: true });
const touchLast = () => lastTouch;
// パソコンの操作の一言(D258)は、没入感を損なうので出さない(D300)
const fieldHeader = document.querySelector(".field-header");
const fieldWrap = document.querySelector(".field-wrap");
const fieldStatus = document.querySelector(".field-status");
const JOY_SIZE = 92;
const JOY_INSET = 16;
const BTN_SIZE = 46;
// Diagonal offset (in each of x/y) from the pair's shared center to each
// button's center. Distance between the two centers ends up BTN_DIAG*2*sqrt(2)
// (~62px), safely more than BTN_SIZE (46px) so the circles don't overlap.
const BTN_DIAG = 22;

function fitGameFrame() {
  const isCompact = document.body.classList.contains("landscape-compact");
  if (!isCompact) {
    gameFrame.style.width = "";
    gameFrame.style.height = "";
    return;
  }
  // Compute the exact box available for the game-frame directly from the
  // DOM rather than relying on CSS aspect-ratio + flexbox sizing, which
  // resolves inconsistently between browser engines (notably iOS Safari).
  const wrapStyle = getComputedStyle(fieldWrap);
  const wrapPadTop = parseFloat(wrapStyle.paddingTop) || 0;
  const wrapPadBottom = parseFloat(wrapStyle.paddingBottom) || 0;
  const wrapPadLeft = parseFloat(wrapStyle.paddingLeft) || 0;
  const wrapPadRight = parseFloat(wrapStyle.paddingRight) || 0;
  const gap = parseFloat(wrapStyle.rowGap) || 0;

  // 画面の外の見出しと下の行はなくした(D258)。ないときは 0
  const headerH = fieldHeader ? fieldHeader.getBoundingClientRect().height : 0;
  const statusH = fieldStatus ? fieldStatus.getBoundingClientRect().height : 0;
  const availH = window.innerHeight - headerH - wrapPadTop - wrapPadBottom - gap - statusH;
  const availW = window.innerWidth - wrapPadLeft - wrapPadRight;

  const ratio = 960 / 600;
  let w = Math.max(0, availW);
  let h = w / ratio;
  if (h > availH) {
    h = Math.max(0, availH);
    w = h * ratio;
  }
  gameFrame.style.width = `${w}px`;
  gameFrame.style.height = `${h}px`;
}

function diagonalPair(cx, cy) {
  return {
    aLeft: cx - BTN_SIZE / 2 + BTN_DIAG,
    aTop: cy - BTN_SIZE / 2 + BTN_DIAG,
    bLeft: cx - BTN_SIZE / 2 - BTN_DIAG,
    bTop: cy - BTN_SIZE / 2 - BTN_DIAG,
  };
}
// Shared margin threshold so the joystick and A/B buttons always agree on
// whether there's "enough" letterbox space to escape into, given the left
// and right margins are normally equal. Must clear the larger of the two
// controls (the joystick) plus a little breathing room.
const MARGIN_THRESHOLD = JOY_SIZE + 8;

function positionJoystick() {
  const frameRect = gameFrame.getBoundingClientRect();
  const isCompact = document.body.classList.contains("landscape-compact");
  const leftMargin = frameRect.left;

  let left, top;
  if (isCompact && leftMargin > MARGIN_THRESHOLD) {
    // enough letterbox space beside the game view: rest the stick there
    // instead of covering the field
    left = leftMargin / 2 - JOY_SIZE / 2;
    top = frameRect.top + frameRect.height / 2 - JOY_SIZE / 2;
  } else {
    left = frameRect.left + JOY_INSET;
    top = frameRect.bottom - JOY_INSET - JOY_SIZE;
  }
  joystick.style.left = `${left}px`;
  joystick.style.top = `${top}px`;
}

function positionActionButtons() {
  const frameRect = gameFrame.getBoundingClientRect();
  const isCompact = document.body.classList.contains("landscape-compact");
  const rightMargin = window.innerWidth - frameRect.right;

  let aLeft, aTop, bLeft, bTop;
  if (isCompact && rightMargin > MARGIN_THRESHOLD) {
    // enough letterbox space beside the game view: rest the buttons there,
    // diagonally, instead of covering the field
    const cx = frameRect.right + rightMargin / 2;
    const cy = frameRect.top + frameRect.height / 2;
    ({ aLeft, aTop, bLeft, bTop } = diagonalPair(cx, cy));
  } else {
    // overlay the bottom-right corner of the game view: pick the pair's
    // center so its bounding box corner lands at the inset point
    const cx = frameRect.right - JOY_INSET - BTN_SIZE / 2 - BTN_DIAG;
    const cy = frameRect.bottom - JOY_INSET - BTN_SIZE / 2 - BTN_DIAG;
    ({ aLeft, aTop, bLeft, bTop } = diagonalPair(cx, cy));
  }
  actionBtnA.style.left = `${aLeft}px`;
  actionBtnA.style.top = `${aTop}px`;
  actionBtnB.style.left = `${bLeft}px`;
  actionBtnB.style.top = `${bTop}px`;
  // C(ステータス)は A の上に
  actionBtnC.style.left = `${aLeft}px`;
  actionBtnC.style.top = `${aTop - 70}px`;
}

// スマホの本体: ボタンを続けて押したときの拡大(ダブルタップ、ピンチ)と、画面のすべりを止める
if (isTouchDevice) {
  const stop = (e) => e.preventDefault();
  document.addEventListener("gesturestart", stop, { passive: false });
  document.addEventListener("dblclick", stop, { passive: false });
  document.addEventListener("touchmove", (e) => e.touches.length > 1 && e.preventDefault(), { passive: false });
  let lastEnd = 0;
  document.addEventListener(
    "touchend",
    (e) => {
      const now = Date.now();
      if (now - lastEnd < 350) e.preventDefault(); // すばやい二度押しで拡大しないように
      lastEnd = now;
    },
    { passive: false }
  );
}
// スマホ: 画面ぜんたいを携帯ゲーム機の本体にする(D263)。ゲームの画面は本体のくぼみ、ボタンは本体の面に置き、絵にかぶらない
function place(el, cx, cy, w, h) {
  el.style.left = `${Math.round(cx - w / 2)}px`;
  el.style.top = `${Math.round(cy - h / 2)}px`;
  el.style.width = `${Math.round(w)}px`;
  el.style.height = `${Math.round(h)}px`;
}
function layoutConsole() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const land = W > H;
  // 本体の絵(todo 60)は、どの部品も絵の 1 ドット = 画面の K ドットにそろえる(ドットの粗さをそろえる)
  const K = 2;
  const BEZ = 14 * K; // くぼみの絵の、画面のふちまでの幅(14 ドット)
  const CROSS = 64 * K;
  const BTN = 32 * K;
  const ratio = 960 / 600;
  let gx, gy, gw, gh;
  if (land) {
    // 横(ゲームウォッチ風): 左に十字キー、右に TIME・C と A・B
    const side = Math.min(220, Math.max(84 * K + 8, W * 0.2));
    const top = 12;
    gw = W - side * 2 - BEZ * 2;
    gh = gw / ratio;
    if (gh > H - top - BEZ * 2 - 8) {
      gh = H - top - BEZ * 2 - 8;
      gw = gh * ratio;
    }
    gx = (W - gw) / 2;
    gy = top + BEZ + (H - top - BEZ * 2 - 8 - gh) / 2;
    place(joystick, side / 2, H * 0.6, CROSS, CROSS);
    place(actionBtnT, W - side / 2, 12 + 9 * K, 48 * K, 18 * K); // TIME は右上(D269)。C と同じ大きさ
    place(actionBtnC, W - side / 2, 12 + 27 * K + 8, 48 * K, 18 * K);
    place(actionBtnB, W - side * 0.68, H * 0.5, BTN, BTN);
    place(actionBtnA, W - side * 0.3, H * 0.7, BTN, BTN);
  } else {
    // 縦: 上に画面、下に十字キーと A・B、いちばん下に C
    // 題字はなし(D272)。でも画面は上につめず、題字があったときの位置のまま(作者「上には詰めないで」)
    const top = 8 + 16 * K + 6;
    gw = W - 16 - BEZ * 2;
    gh = gw / ratio;
    gx = (W - gw) / 2;
    gy = top + BEZ;
    const y1 = gy + gh + BEZ + 8;
    const cy = y1 + (H - y1) * 0.4;
    place(actionBtnT, W - 8 - 24 * K, y1 + 9 * K + 4, 48 * K, 18 * K); // TIME は画面の下の右はし(D269)。C と同じ大きさ
    place(joystick, W * 0.27, cy, CROSS, CROSS);
    place(actionBtnA, W * 0.8, cy + BTN * 0.45, BTN, BTN);
    place(actionBtnB, W * 0.58, cy - BTN * 0.45, BTN, BTN);
    place(actionBtnC, W / 2, H - Math.max(48, (H - y1) * 0.14), 48 * K, 18 * K);
  }
  for (const b of [actionBtnA, actionBtnB]) b.style.lineHeight = b.style.height;
  actionBtnC.style.lineHeight = actionBtnC.style.height;
  actionBtnT.style.lineHeight = actionBtnT.style.height;
  consoleBezel.style.borderWidth = `${16 * K}px`;
  consoleBezel.style.borderImageWidth = `${16 * K}px`;
  const BO = 16 * K - BEZ; // くぼみの絵の内側のすきま(透明)の分だけ外へ
  // 画面のくぼみの絵(todo 60): 画面のまわりに、BEZ の幅で重ねる
  consoleBezel.style.left = `${Math.round(gx - BEZ - BO)}px`;
  consoleBezel.style.top = `${Math.round(gy - BEZ - BO)}px`;
  consoleBezel.style.width = `${Math.round(gw + (BEZ + BO) * 2)}px`;
  consoleBezel.style.height = `${Math.round(gh + (BEZ + BO) * 2)}px`;
  gameFrame.style.left = `${Math.round(gx)}px`;
  gameFrame.style.top = `${Math.round(gy)}px`;
  gameFrame.style.width = `${Math.round(gw)}px`;
  gameFrame.style.height = `${Math.round(gh)}px`;
}

function updateLayoutMode() {
  if (isTouchDevice) {
    document.body.classList.add("console");
    document.documentElement.classList.add("console");
    layoutConsole();
    return;
  }
  const isLandscape = window.innerWidth > window.innerHeight;
  const compact = isTouchDevice && isLandscape;
  document.body.classList.toggle("landscape-compact", compact);
  document.documentElement.classList.toggle("landscape-compact", compact);
  fitGameFrame();
  positionJoystick();
  positionActionButtons();
}
updateLayoutMode();
window.addEventListener("resize", updateLayoutMode);
window.addEventListener("orientationchange", updateLayoutMode);
gameFrame.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);

const fullscreenBtn = document.getElementById("fullscreenBtn");
const fullscreenSupported = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);

if (!fullscreenSupported) {
  // iPhone Safari exposes no working Fullscreen API for non-video elements;
  // showing a button that can't do anything is worse than no button.
  fullscreenBtn.style.display = "none";
} else {
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function requestFullscreen(el) {
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    return req.call(el);
  }

  function exitFullscreen() {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    return exit.call(document);
  }

  fullscreenBtn.addEventListener("click", async () => {
    if (isFullscreen()) {
      try {
        await exitFullscreen();
      } catch (e) {
        // ignore
      }
      return;
    }
    // スマホ(本体の形 D263)は、ページぜんたいを全画面にする。十字キーとボタンは画面の外にあるので、
    // ゲームの画面だけを全画面にすると、押せなくなっていた(Android)。向きは、持っている向きのまま
    const touchConsole = document.body.classList.contains("console");
    try {
      await requestFullscreen(touchConsole ? document.documentElement : gameFrame);
    } catch (e) {
      // fullscreen request rejected; nothing more we can do
      return;
    }
    if (!touchConsole && screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("landscape").catch(() => {
        // orientation lock not supported; ignore
      });
    }
  });

  document.addEventListener("fullscreenchange", () => {
    fullscreenBtn.classList.toggle("is-full", isFullscreen());
  });
  document.addEventListener("webkitfullscreenchange", () => {
    fullscreenBtn.classList.toggle("is-full", isFullscreen());
  });
}
