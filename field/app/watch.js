// TIME の時計(スマホだけ)。
// field/app/ のファイルは index.html の順に読む(上のファイルで決めた名前を、下のファイルがそのまま使う)
"use strict";

// ---- TIME(D269、todo 59): ゲームウォッチのように、時計になる ----
// 白い懲罰空間の床に、大きな時刻(AM / PM、12 時間)。「:」は 1 秒ごとに点滅。
// そのまわりを、きーがひとりで歩き、ときどき止まって時計を見上げる。何か押すと元の場面に戻る(そのあいだゲームは止める)
const watchKi = new Image();
watchKi.src = "./assets/worlds/lake/ki_walk.png";
const watch = { on: false, x: 0, y: 0, tx: 0, ty: 0, rest: 0, facing: "south", moving: false };
const W_ROW = { south: 0, north: 1, east: 2, west: 3 };
function watchPickTarget() {
  // 時刻の下の帯を、左右に行き来する(数字の上は歩かない)
  watch.tx = 100 + Math.random() * (VW - 200);
  watch.ty = VH - 60 - Math.random() * 50;
}
function toggleWatch(open = !watch.on) {
  if (open === watch.on) return;
  watch.on = open;
  document.body.classList.toggle("watching", open);
  if (window.bogiAudio) window.bogiAudio.sfx(open ? "ok" : "back");
  haptic();
  resetJoy();
  for (const k in keys) keys[k] = false;
  if (open) {
    Object.assign(watch, { x: VW * 0.3, y: VH - 85, rest: 0.6, facing: "south", moving: false });
    watchPickTarget();
  }
}
function updateWatch(dt) {
  if (watch.rest > 0) {
    watch.rest -= dt;
    watch.moving = false;
    if (watch.rest <= 0) watchPickTarget();
    return;
  }
  const dx = watch.tx - watch.x;
  const dy = watch.ty - watch.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) {
    // 着いたら止まって、時計(まん中)のほうを見上げる
    watch.rest = 1.2 + Math.random() * 1.8;
    watch.facing = "north";
    watch.moving = false;
    return;
  }
  const v = 110 * dt;
  watch.x += (dx / d) * Math.min(d, v);
  watch.y += (dy / d) * Math.min(d, v);
  watch.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "east" : "west") : dy > 0 ? "south" : "north";
  watch.moving = true;
}
function drawWatch(t) {
  const P = window.bogiPix;
  ctx.save();
  ctx.fillStyle = "#f7f7f9"; // 懲罰空間の床の色
  ctx.fillRect(0, 0, VW, VH);
  const now = new Date();
  const h24 = now.getHours();
  const h = h24 % 12 || 12;
  const hh = String(h).padStart(2, " ");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const S = 9;
  const ink = "#2b2b33";
  // 数字は幅をそろえて並べる(1 と 0 で時刻が左右にゆれないように)
  const cw = Math.max(...["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((c) => P.width(c))) * S;
  const colW = P.width(":") * S;
  const total = cw * 4 + colW + S * 4;
  let x = Math.round((VW - total) / 2 / S) * S;
  const y = Math.round((VH / 2 - 8 * S - 6) / S) * S;
  const digit = (c) => {
    if (c !== " ") P.text(ctx, c, x + Math.round((cw - P.width(c) * S) / 2 / S) * S, y, S, ink);
    x += cw;
  };
  digit(hh[0]);
  digit(hh[1]);
  x += S * 2;
  if (now.getSeconds() % 2 === 0) P.text(ctx, ":", x, y, S, ink);
  x += colW + S * 2;
  digit(mm[0]);
  digit(mm[1]);
  // AM / PM(ゲームウォッチのように、時刻の左上に小さく)
  const S2 = 3;
  P.text(ctx, h24 < 12 ? "AM" : "PM", Math.round((VW - total) / 2 / S2) * S2, y - 16 * S2 - 6, S2, ink);
  // きー(ゲームと同じ 2 倍)
  const cell = 64;
  const Z = 2;
  ctx.fillStyle = "rgba(40, 50, 70, 0.25)";
  ctx.beginPath();
  ctx.ellipse(watch.x, watch.y + 2, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  if (watchKi.complete && watchKi.naturalWidth) {
    const frame = watch.moving ? 1 + (Math.floor(t * 10) % 6) : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(watchKi, frame * cell, W_ROW[watch.facing] * cell, cell, cell, Math.round(watch.x - (cell * Z) / 2), Math.round(watch.y - (cell - 17) * Z), cell * Z, cell * Z);
  }
  ctx.restore();
}
