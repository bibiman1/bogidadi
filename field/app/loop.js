// ループ。全部を読んだあとで、懲罰空間に入って動かしはじめる。
// field/app/ のファイルは index.html の順に読む(上のファイルで決めた名前を、下のファイルがそのまま使う)
"use strict";

// ---- ループ ----
// 起きたエラーを画面に出す(スマホでも原因がわかるように)。最初の1件だけ
let reportedError = false;
function reportLoopError(e) {
  if (reportedError) return;
  reportedError = true;
  introHint.textContent = `エラー: ${(e && e.message) || e}`;
  introHint.classList.remove("hidden");
  introHint.style.whiteSpace = "normal";
  introHint.style.maxWidth = "90%";
}
window.bogiReportError = reportLoopError;
window.addEventListener("error", (ev) => reportLoopError(ev.error || ev.message));

let lastTime = 0;
function loop(timestamp) {
  requestAnimationFrame(loop);
  try {
    frame(timestamp);
  } catch (e) {
    reportLoopError(e);
  }
}

function frame(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
  lastTime = timestamp;
  const t = timestamp / 1000;

  if (watch.on) {
    // 時計のあいだは、ゲームを止める(D269)
    updateWatch(dt);
    drawWatch(t);
    return;
  }
  if (maroudo.on) {
    // まろうど(D493)のあいだは、ゲームを止めて画面の効果だけ描く
    updateMaroudo(dt);
    if (maroudo.on) drawMaroudo();
    return;
  }
  if (statusOpen) statusJoystick();
  else if (title.on) statusJoystick(titleInput); // タイトルの「つづきから」「さいしょから」も十字キーで選ぶ(スマホで選べなかった)
  if (story) {
    updateStory(dt);
    choiceJoystick();
  }
  else if (!transitioning && !statusOpen) {
    if (title.on && !title.leaving && !(titleApi() && titleApi().camPathOn())) titleCam(); // タイトルの引き(暗転があけてから)
    const input = title.on ? { x: 0, y: 0 } : readInput();
    rpg.update(dt, t, input);
  } else if (transitioning) {
    // 暗転しているあいだも世界の時間は進める(入った直後に動き出す人や車椅子が、明ける前に位置についておくように)
    rpg.update(dt, t, { x: 0, y: 0 });
  }
  rpg.draw(t);
  drawTitle(t);
  if (story) drawStory(t);
  document.body.classList.toggle("viewing", rpg.viewing);
}

rpg.enter(window.BOGI_WORLDS[HUB]);
updateStatus();
// 最初も、画像を読み終わってからフェードイン
rpg.whenReady(() => fadeOverlay.classList.remove("on"));
requestAnimationFrame(loop);
