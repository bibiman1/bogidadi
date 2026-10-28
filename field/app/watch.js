// TIME の時計(スマホだけ)。
// field/app/ のファイルは index.html の順に読む(上のファイルで決めた名前を、下のファイルがそのまま使う)
"use strict";

// ---- TIME(D269、todo 59): ゲームウォッチのように、時計になる ----
// 白い懲罰空間の床に、大きな時刻(AM / PM、12 時間)。「:」は 1 秒ごとに点滅。
// そのまわりを、きーがひとりで動く。何か押すと元の場面に戻る(そのあいだゲームは止める)
// きーの動き(D472、todo 162): ゲームの中と同じ動き(歩く、走る、跳ぶ、ふんばる、まわる)と、見上げる、きょろきょろ。
// 分が変わった瞬間は、時計を見上げて 2 回跳ぶ。絵は歩きの絵だけで、ほかはコードで動かす(rpg.js と同じやり方)
const watchKi = new Image();
watchKi.src = "./assets/worlds/lake/ki_walk.png";
const watch = { on: false, x: 0, y: 0, tx: 0, ty: 0, act: "rest", t: 0, dur: 0, hops: 0, facing: "south", moving: false, min: -1 };
const W_ROW = { south: 0, north: 1, east: 2, west: 3 };
const W_SPIN = ["south", "west", "north", "east"];
const W_HOP = 0.5; // 1 回の跳びの秒数(ゲームのジャンプと同じ)
// 次の動きを選ぶ(重みつき)
const W_ACTS = [
  ["walk", 32],
  ["run", 14],
  ["look", 12],
  ["glance", 12],
  ["hop", 11],
  ["squash", 9],
  ["spin", 10],
];
function watchSet(act, dur) {
  Object.assign(watch, { act, t: 0, dur, moving: act === "walk" || act === "run" });
}
function watchPickTarget() {
  // 時刻の下の帯を、左右に行き来する(数字の上は歩かない)
  watch.tx = 100 + Math.random() * (VW - 200);
  watch.ty = VH - 60 - Math.random() * 50;
}
function watchNext() {
  let r = Math.random() * W_ACTS.reduce((a, [, w]) => a + w, 0);
  let act = W_ACTS[0][0];
  for (const [a, w] of W_ACTS) {
    if ((r -= w) < 0) {
      act = a;
      break;
    }
  }
  // 同じ場所での動きが続きすぎないように、止まる動きのあとは歩きを出やすくする
  if (act === watch.act && act !== "walk") act = "walk";
  if (act === "walk" || act === "run") {
    watchPickTarget();
    watchSet(act, 0);
  } else if (act === "look") {
    watch.facing = "north";
    watchSet("look", 1.2 + Math.random() * 1.8);
  } else if (act === "glance") {
    watchSet("glance", 1.8);
  } else if (act === "hop") {
    watch.hops = 1 + Math.floor(Math.random() * 3);
    watchSet("hop", watch.hops * W_HOP + 0.3);
  } else if (act === "squash") {
    watch.facing = "south";
    watchSet("squash", 1.1);
  } else {
    watchSet("spin", 1.0);
  }
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
    Object.assign(watch, { x: VW * 0.3, y: VH - 85, facing: "south", min: new Date().getMinutes() });
    watchSet("rest", 0.6);
  }
}
function updateWatch(dt) {
  // 分が変わったら、時計を見上げて 2 回跳ぶ
  const m = new Date().getMinutes();
  if (m !== watch.min) {
    watch.min = m;
    watch.facing = "north";
    watch.hops = 2;
    watchSet("hop", 2 * W_HOP + 0.4);
    return;
  }
  watch.t += dt;
  if (watch.act === "walk" || watch.act === "run") {
    const dx = watch.tx - watch.x;
    const dy = watch.ty - watch.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) {
      // 着いたら、時計(まん中)のほうを見上げることが多い
      if (Math.random() < 0.5) {
        watch.facing = "north";
        watchSet("look", 1.0 + Math.random() * 1.5);
      } else watchNext();
      return;
    }
    const v = (watch.act === "run" ? 190 : 110) * dt;
    watch.x += (dx / d) * Math.min(d, v);
    watch.y += (dy / d) * Math.min(d, v);
    watch.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "east" : "west") : dy > 0 ? "south" : "north";
    return;
  }
  if (watch.t >= watch.dur) {
    if (watch.act === "spin" || watch.act === "glance") watch.facing = "south";
    watchNext();
  }
}
// いまの向き、浮き(跳び)、つぶれ
function watchPose() {
  let facing = watch.facing;
  let jz = 0;
  if (watch.act === "spin") facing = W_SPIN[Math.floor(watch.t * 14) % 4];
  if (watch.act === "glance") facing = ["west", "west", "east", "east", "south"][Math.min(4, Math.floor(watch.t / 0.36))];
  if (watch.act === "hop" && watch.t < watch.hops * W_HOP) jz = Math.sin(((watch.t % W_HOP) / W_HOP) * Math.PI) * 20;
  return { facing, jz, squash: watch.act === "squash" };
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
    const pose = watchPose();
    const frame = watch.moving ? 1 + (Math.floor(t * (watch.act === "run" ? 18 : 10)) % 6) : 0;
    const sx = frame * cell;
    const sy = W_ROW[pose.facing] * cell;
    ctx.imageSmoothingEnabled = false;
    if (pose.squash) {
      // ふんばる: つぶれて床に張りつく(ゲームと同じ。横に 1.35 倍、高さは半分)
      const w = Math.round(cell * Z * 1.35);
      const h = Math.round(cell * Z * 0.5);
      ctx.drawImage(watchKi, sx, sy, cell, cell, Math.round(watch.x - w / 2), Math.round(watch.y - (cell - 17) * Z * 0.5), w, h);
    } else {
      const jz = Math.round(pose.jz * Z); // 跳んでいる間は体だけ浮く(影は床に残る)
      ctx.drawImage(watchKi, sx, sy, cell, cell, Math.round(watch.x - (cell * Z) / 2), Math.round(watch.y - (cell - 17) * Z) - jz, cell * Z, cell * Z);
    }
  }
  ctx.restore();
}
