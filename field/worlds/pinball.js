// 断片「呪いの野犬」のダイナーのピンボール台「FREEWAY DOGS」(D327)。
// 調べると台の画面に切りかわる。十字キーの左が左のフリッパー、A が右のフリッパー(D329)、十字キーの下を押して離すと玉を打ち出す。玉は 3 つ。
// 進み具合とは関係しない。最高点だけ、台に残す(保存の flags の noroi.pinHigh)。
// 盤面の絵はここで描き、頭の絵(backglass)は docs/assets/noroi/pinball/make.py
"use strict";

// 盤面(画面の座標で、左上 PB_X, PB_Y、幅 168、高さ 280)。当たり判定は盤面の座標
const PB_X = 156;
const PB_Y = 4;
const PB_W = 168;
const PB_H = 280;
const PB_R = 4; // 玉の半径
// 玉の跳ね方(D331 で調整。作者「ピンボールの玉の跳ね方を調整して」): 前は重力 300、壁 0.45、バンパー +170、スリング +150、フリッパー 0.3・24 rad/s、上限 620、空気の抵抗なし
// D336(作者「無限に跳ね返るから点数がはいる。下向きの重力をすこしかけて」): 重力 190 → 240(左右のスリングの間を同じ高さで行き来し続けていた)
// D333(作者「玉は遅くていい」): D331 の値(重力 240、スリング +110、バンパー +120、上限 480、打ち出し 220+300)を、もう一段ゆっくりに
const PB_TUNE = { g: 240, wallE: 0.35, postE: 0.4, slingE: 0.4, slingKick: 90, bumperE: 0.6, bumperKick: 100, flipE: 0.15, maxV: 380, drag: 0.15, launch0: 180, launchK: 240 };
const PB_G = PB_TUNE.g; // 重力(盤面の傾き)
const PB_FLIP = { len: 38, rest: 0.5, up: -0.42, wUp: 18, wDown: 12, thick: 3 }; // 長さは絵(pb_flipper、支点から先まで 38 ドット)に合わせる(D330)
// 打ち出しの通路。打ち出し棒の頭は y 248、その下に巻いたバネ(作者「バネはちゃんと描写してほしい」)。ためると頭が下がり、バネが縮む
const PB_LANE = { x: 157, rest: 240, head: 248, base: 278, pull: 14 };
// 離すと 0.06 秒で頭が戻る(一度に戻すと、玉が頭の下へもぐる)
// 経過時間は 0〜1 におさえる(台を離れてまた遊ぶと pb.t が 0 に戻り、前のゲームの shotT が先の時刻になる。
// 引き算がマイナスになって頭が画面の下へ消え、玉が落ち続けて勝手にゲームオーバーになっていた。作者「ばねがなくなって勝手にGAMEOVERになる」)
const pbHeadY = () => PB_LANE.head + PB_LANE.pull * Math.max(pb.charge || 0, (pb.shotC || 0) * (1 - Math.max(0, Math.min(1, (pb.t - (pb.shotT ?? -9)) / 0.06))));
const PB_BUMPERS = [
  { x: 52, y: 96, r: 14, kind: "beko" }, // 赤べこの頭(半径は絵 pb_bump_* に合わせる D330)
  { x: 112, y: 96, r: 14, kind: "drum" }, // ぽんぽんカーの燃えるドラム缶
  { x: 82, y: 134, r: 14, kind: "duck" }, // とりぼぎかーの子がも
  // 下の空いた所に、上へ弾き返す小さなバンパー 2 つ(D336、作者「上に反射するバンパーとかないから、スカスカになる」)。車のホイールキャップの形
  { x: 52, y: 168, r: 8, kind: "cap", kick: 80, pts: 50 },
  { x: 112, y: 168, r: 8, kind: "cap", kick: 80, pts: 50 },
];
const PB_TOPLANES = [66, 90, 114]; // 上の 3 つのレーン(全部ともすと 1000 点)
const PB_POSTS = [54, 78, 102, 126];
// 壁(はね返る)。上の丸い天井、左右の壁、打ち出しの通路、下のすべり台
const PB_WALLS = (() => {
  const w = [];
  let prev = null;
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI + (Math.PI * i) / 18;
    const p = [84 + 80 * Math.cos(a), 84 + 80 * Math.sin(a)];
    if (prev) w.push([prev[0], prev[1], p[0], p[1]]);
    prev = p;
  }
  w.push([4, 84, 4, 206], [4, 206, 33, 246]); // 左の壁とすべり台
  w.push([164, 84, 164, 284], [150, 104, 150, 284], [150, 206, 117, 246]); // 右の壁、通路の仕切り、右のすべり台
  for (const x of PB_POSTS) w.push([x, 32, x, 46]); // 上のレーンの仕切り
  return w;
})();
const PB_SLINGS = [
  [20, 188, 36, 222],
  [130, 188, 114, 222],
];
const pb = { x: 0, y: 0, vx: 0, vy: 0, live: false, balls: 3, score: 0, over: false, charge: 0, lanes: [false, false, false], flash: {}, flips: null, high: 0, t: 0, drainT: -1 };
const pbFlipper = (left) => ({ left, px: left ? 33 : 117, py: 246, th: PB_FLIP.rest, w: 0 });
// フリッパーの画面での角度(左は右下へ、右は左下へのびる)
const pbAng = (f) => (f.left ? f.th : Math.PI - f.th);
const pbTip = (f) => ({ x: f.px + PB_FLIP.len * Math.cos(pbAng(f)), y: f.py + PB_FLIP.len * Math.sin(pbAng(f)) });
function pbNewBall() {
  Object.assign(pb, { x: PB_LANE.x, y: PB_LANE.rest, vx: 0, vy: 0, live: true, charge: 0, drainT: -1, inPlay: false, shotC: 0, shotT: -9 });
}
function pbReset(api) {
  Object.assign(pb, { balls: 3, score: 0, over: false, lanes: [false, false, false], flash: {}, flips: [pbFlipper(true), pbFlipper(false)], t: 0 });
  pb.high = Number(api.flagValue("pinHigh")) || 0;
  pbNewBall();
}
const pbInLane = () => pb.x > 150 && pb.y >= PB_LANE.head - PB_R - 3 && Math.hypot(pb.vx, pb.vy) < 30;
// 玉と線分(太さ th)の当たり。surf は線のその点の速さ。当たったら法線を返す
function pbHitSeg(ax, ay, bx, by, th, e, surf) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((pb.x - ax) * dx + (pb.y - ay) * dy) / l2));
  const cx = ax + dx * t;
  const cy = ay + dy * t;
  let nx = pb.x - cx;
  let ny = pb.y - cy;
  const d = Math.hypot(nx, ny);
  const rr = PB_R + th;
  if (d >= rr || d === 0) return null;
  nx /= d;
  ny /= d;
  pb.x = cx + nx * rr;
  pb.y = cy + ny * rr;
  const sv = surf ? surf(cx, cy) : { x: 0, y: 0 };
  let rvx = pb.vx - sv.x;
  let rvy = pb.vy - sv.y;
  const vn = rvx * nx + rvy * ny;
  if (vn < 0) {
    rvx -= (1 + e) * vn * nx;
    rvy -= (1 + e) * vn * ny;
    pb.vx = rvx + sv.x;
    pb.vy = rvy + sv.y;
  }
  return { nx, ny, vn };
}
// フリッパーを h 秒ぶん回す。1 コマでまとめて回すと、先が 1 度に 10 ドットほど飛び、玉を飛びこえて裏へ押し出していた
// (作者「フリッパーをボールがすり抜ける事がある」)。玉が動いている間は pbStep の細かい刻みごとに呼ぶ
function pbMoveFlips(h) {
  for (const f of pb.flips) {
    const target = f.on ? PB_FLIP.up : PB_FLIP.rest;
    const sp = f.on ? PB_FLIP.wUp : PB_FLIP.wDown;
    const prevTh = f.th;
    f.th = f.th > target ? Math.max(target, f.th - sp * h) : Math.min(target, f.th + sp * h);
    f.w = (f.th - prevTh) / Math.max(h, 1e-6);
  }
}
function pbStep(api, h) {
  pbMoveFlips(h);
  pb.vy += PB_G * h;
  const dr = 1 - PB_TUNE.drag * h; // 空気と盤面の抵抗(少しずつ遅くなる)
  pb.vx *= dr;
  pb.vy *= dr;
  pb.x += pb.vx * h;
  pb.y += pb.vy * h;
  for (const w of PB_WALLS) pbHitSeg(w[0], w[1], w[2], w[3], 0.5, PB_TUNE.wallE, null);
  const hy = pbHeadY(); // 打ち出し棒の頭(ためると下がる)
  pbHitSeg(150, hy, 164, hy, 0.5, PB_TUNE.wallE, null);
  // 通路の口の仕切り(一方通行): 玉が盤面に出たら閉じて、通路へ落ち戻らないようにする
  if (!pb.inPlay && pb.y < 96 && pb.x < 150) pb.inPlay = true;
  if (pb.inPlay) pbHitSeg(150, 100, 164, 92, 0.5, PB_TUNE.wallE, null);
  for (const x of PB_POSTS) {
    const c = pbHitSeg(x, 32, x, 32, 2, PB_TUNE.postE, null);
    if (c) break;
  }
  for (const [i, s] of PB_SLINGS.entries()) {
    const c = pbHitSeg(s[0], s[1], s[2], s[3], 1.5, PB_TUNE.slingE, null);
    if (c && c.vn < -40) {
      // はじき返す(スリングショット)
      pb.vx += c.nx * PB_TUNE.slingKick;
      pb.vy += c.ny * PB_TUNE.slingKick;
      pbScore(api, 10, "sling" + i);
      api.sfx("pb_sling");
    }
  }
  for (const [i, b] of PB_BUMPERS.entries()) {
    let nx = pb.x - b.x;
    let ny = pb.y - b.y;
    const d = Math.hypot(nx, ny);
    if (d < b.r + PB_R && d > 0) {
      nx /= d;
      ny /= d;
      pb.x = b.x + nx * (b.r + PB_R);
      pb.y = b.y + ny * (b.r + PB_R);
      const vn = pb.vx * nx + pb.vy * ny;
      if (vn < 0) {
        pb.vx -= (1 + PB_TUNE.bumperE) * vn * nx;
        pb.vy -= (1 + PB_TUNE.bumperE) * vn * ny;
      }
      pb.vx += nx * (b.kick ?? PB_TUNE.bumperKick);
      pb.vy += ny * (b.kick ?? PB_TUNE.bumperKick);
      pbScore(api, b.pts ?? 100, "b" + i);
      api.sfx("pb_bumper");
    }
  }
  for (const f of pb.flips) {
    const tip = pbTip(f);
    const ws = f.left ? f.w : -f.w; // 画面での回る速さ
    pbHitSeg(f.px, f.py, tip.x, tip.y, PB_FLIP.thick, PB_TUNE.flipE, (cx, cy) => ({ x: -ws * (cy - f.py), y: ws * (cx - f.px) }));
  }
  // 上のレーン
  if (pb.y > 34 && pb.y < 46 && pb.vy > 0)
    PB_TOPLANES.forEach((x, i) => {
      if (Math.abs(pb.x - x) < 7 && !pb.lanes[i]) {
        pb.lanes[i] = true;
        pbScore(api, 50, "lane" + i);
        api.sfx("pb_lane");
        if (pb.lanes.every(Boolean)) {
          pbScore(api, 1000, "lanes");
          pb.lanes = [false, false, false];
          api.sfx("chime");
        }
      }
    });
  const sp = Math.hypot(pb.vx, pb.vy);
  if (sp > PB_TUNE.maxV) {
    pb.vx *= PB_TUNE.maxV / sp;
    pb.vy *= PB_TUNE.maxV / sp;
  }
}
function pbScore(api, n, what) {
  pb.score += n;
  pb.flash[what] = pb.t;
}
function pbLeave(api) {
  api.warp("diner", "pinball");
}
const N_PIN = {
  tile: T,
  bg: "#1a1512",
  hidePlayer: true,
  // ダイナーのジュークボックスのレコードがかかっていれば、台の前でもそのまま(少し小さく。D334)
  get bgm() {
    const k = window.bogiAudio && window.bogiAudio.state().bgm;
    return k && k.startsWith("juke_") ? k : undefined;
  },
  bgmLevel: 0.7,
  map: kGrid(15, 9, () => false), // 画面とちょうど同じ広さ(カメラが動かない)
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 4 * T, facing: "north" } },
  objects: [],
  triggers: [],
  onEnter(api) {
    pbReset(api);
  },
  debug: () => pb,
  onA(api) {
    if (pb.over) pbLeave(api); // 終わったら、A でダイナーへ
    return true; // フリッパーは押し続けで(input)
  },
  onB() {
    return true;
  },
  input(api, dt, inp) {
    if (!pb.flips) pbReset(api);
    pb.t += dt;
    // フリッパー
    for (const f of pb.flips) {
      const on = f.left ? inp.x < -0.5 : inp.a; // 左のフリッパーは十字キーの左、右は A(作者「フリッパーは左とAで操作」D329)
      if (on && !f.on) api.sfx("pb_flip");
      f.on = on; // 角度は玉と同じ細かい刻みで動かす(pbMoveFlips)
    }
    if (!pb.live || pb.over) pbMoveFlips(dt);
    if (pb.over) return;
    // 打ち出し: 下を押してためる、離すと打つ。通路で止まっているときに上を押すと、台を離れる
    if (pb.live && pbInLane()) {
      if (inp.y > 0.5) pb.charge = Math.min(1, pb.charge + dt * 1.2);
      else if (pb.charge > 0) {
        pb.vy = -(PB_TUNE.launch0 + PB_TUNE.launchK * pb.charge);
        pb.shotC = pb.charge;
        pb.shotT = pb.t;
        pb.charge = 0;
        api.sfx("pb_launch");
      } else if (inp.y < -0.6) return pbLeave(api);
    }
    if (!pb.live) {
      if (pb.drainT >= 0 && pb.t - pb.drainT > 1.2) {
        if (pb.balls > 0) pbNewBall();
        else {
          pb.over = true;
          if (pb.score > pb.high) {
            pb.high = pb.score;
            api.setFlag("pinHigh", pb.score);
          }
        }
      }
      return;
    }
    const h0 = Math.min(dt, 1 / 30);
    const n = Math.ceil(h0 / 0.002);
    for (let i = 0; i < n; i++) pbStep(api, h0 / n);
    if (pb.y > PB_H + 8) {
      // 落ちた
      pb.live = false;
      pb.balls -= 1;
      pb.drainT = pb.t;
      api.sfx("back");
    }
  },
  drawGround(ctx, ox, oy, img) {
    if (!pb.flips) return;
    const get = (k) => (typeof img === "function" ? img(k) : null);
    const X = Math.round(ox + PB_X);
    const Y = Math.round(oy + PB_Y);
    // 台のまわり(暗いダイナーの壁)
    ctx.fillStyle = "#1a1512";
    ctx.fillRect(ox, oy, 480, 288);
    // 頭の絵(左)と得点
    const bg = get("pb_backglass");
    if (bg) ctx.drawImage(bg, Math.round(ox + 10), Math.round(oy + 6));
    pbPanel(ctx, ox + 10, oy + 220, 136, 62);
    pbText(ctx, ox + 18, oy + 226, "SCORE", "#e8c060", 2);
    pbDigits(ctx, ox + 18, oy + 242, pb.score, 7, "#ff7a3c");
    // 右: 玉と最高点
    pbPanel(ctx, ox + 334, oy + 6, 136, 110);
    pbText(ctx, ox + 344, oy + 14, "BALL", "#e8c060", 2);
    for (let i = 0; i < 3; i++) {
      const on = i < pb.balls; // 残りの玉(打っている玉もふくむ)
      ctx.fillStyle = on ? "#ffe8a0" : "#3a3028";
      ctx.beginPath();
      ctx.arc(Math.round(ox + 352 + i * 22), Math.round(oy + 44), 6, 0, Math.PI * 2);
      ctx.fill();
    }
    pbText(ctx, ox + 344, oy + 64, "HIGH", "#e8c060", 2);
    pbDigits(ctx, ox + 344, oy + 80, pb.high, 7, "#9fe0ff");
    if (pb.over && Math.floor(pb.t * 2) % 2 === 0) {
      pbPanel(ctx, ox + 334, oy + 124, 136, 40);
      pbText(ctx, ox + 346, oy + 134, "GAME OVER", "#ff5a4a", 2);
    }
    // 盤面
    if (!pb.field || (!pb.fieldArt && get("pb_field"))) {
      pb.fieldArt = get("pb_field");
      pb.field = pbFieldArt(pb.fieldArt);
    }
    ctx.drawImage(pb.field, X, Y);
    // 上のレーンの灯り
    PB_TOPLANES.forEach((x, i) => {
      ctx.fillStyle = pb.lanes[i] ? "#ffd84a" : "#5a4a30";
      ctx.fillRect(X + x - 3, Y + 50, 6, 4);
    });
    // バンパー(当たった直後は光る)
    PB_BUMPERS.forEach((b, i) => {
      const lit = pb.t - (pb.flash["b" + i] ?? -9) < 0.12;
      const im = get("pb_bump_" + b.kind); // 絵(D330)。なければ手描き
      if (!im) return pbBumper(ctx, X + b.x, Y + b.y, b, lit);
      ctx.drawImage(im, Math.round(X + b.x - im.width / 2), Math.round(Y + b.y - im.height / 2));
      if (lit) {
        ctx.fillStyle = "rgba(255, 246, 200, 0.55)";
        ctx.beginPath();
        ctx.arc(X + b.x, Y + b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // スリングショット
    PB_SLINGS.forEach((s, i) => {
      const lit = pb.t - (pb.flash["sling" + i] ?? -9) < 0.1;
      ctx.strokeStyle = lit ? "#ffffff" : "#f0e8d8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(X + s[0], Y + s[1]);
      ctx.lineTo(X + s[2], Y + s[3]);
      ctx.stroke();
    });
    // 通路の口の仕切り(玉が盤面に出たあと)
    if (pb.inPlay) {
      ctx.strokeStyle = "#d8dce4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X + 150, Y + 100);
      ctx.lineTo(X + 164, Y + 92);
      ctx.stroke();
    }
    // 打ち出し棒とバネ(ためると頭が下がり、巻いたバネが縮む。作者「バネはちゃんと描写してほしい」)
    pbPlunger(ctx, X, Y);
    // フリッパー(絵 pb_flipper は右向き、支点が (8, 8)。右のフリッパーは左右を返す D330)
    const fim = get("pb_flipper");
    for (const f of pb.flips) {
      if (fim) {
        ctx.save();
        ctx.translate(X + f.px, Y + f.py);
        if (!f.left) ctx.scale(-1, 1);
        ctx.rotate(f.th);
        ctx.drawImage(fim, -8, -8);
        ctx.restore();
        continue;
      }
      const tip = pbTip(f);
      ctx.lineCap = "round";
      ctx.strokeStyle = "#b02a24";
      ctx.lineWidth = PB_FLIP.thick * 2 + 2;
      ctx.beginPath();
      ctx.moveTo(X + f.px, Y + f.py);
      ctx.lineTo(X + tip.x, Y + tip.y);
      ctx.stroke();
      ctx.strokeStyle = "#f4ecd8";
      ctx.lineWidth = PB_FLIP.thick * 2 - 2;
      ctx.stroke();
      ctx.lineCap = "butt";
    }
    // 玉
    if (pb.live) {
      const bx = Math.round(X + pb.x);
      const by = Math.round(Y + pb.y);
      ctx.fillStyle = "#7c8088";
      ctx.beginPath();
      ctx.arc(bx, by, PB_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e8ecf0";
      ctx.beginPath();
      ctx.arc(bx - 1, by - 1, PB_R - 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx - 2, by - 2, 1, 1);
    }
  },
};
// 打ち出し棒: 後ろは盤面の絵のまま(作者「バネの後ろ、黒いけど、背景つけれる？」)。まん中の棒、巻いたバネ(7 巻き、手前の線は明るく、奥は暗く)、メッキの頭、底の台
function pbPlunger(ctx, X, Y) {
  const hy = Math.round(pbHeadY());
  const x0 = X + 151;
  ctx.fillStyle = "#6c7078"; // 棒
  ctx.fillRect(X + 156, Y + hy + 3, 3, PB_LANE.base - hy - 3);
  const y1 = Y + hy + 3;
  const y2 = Y + PB_LANE.base;
  const turns = 7;
  const step = (y2 - y1) / turns;
  for (let i = 0; i < turns; i++) {
    const ya = Math.round(y1 + i * step);
    const yb = Math.round(y1 + (i + 0.5) * step);
    const yc = Math.round(y1 + (i + 1) * step);
    // 奥の線(右上から左下へ、暗い)と手前の線(左から右へ、明るい)
    ctx.strokeStyle = "#5a5e66";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X + 162.5, ya + 0.5);
    ctx.lineTo(X + 152.5, yb + 0.5);
    ctx.stroke();
    ctx.strokeStyle = "#2a2420"; // 手前の線の影(盤面の明るい絵の上でも見えるように)
    ctx.beginPath();
    ctx.moveTo(X + 152.5, yb + 1.5);
    ctx.lineTo(X + 162.5, yc + 1.5);
    ctx.stroke();
    ctx.strokeStyle = "#e4e8f0";
    ctx.beginPath();
    ctx.moveTo(X + 152.5, yb + 0.5);
    ctx.lineTo(X + 162.5, yc + 0.5);
    ctx.stroke();
  }
  ctx.fillStyle = "#e8ecf2"; // 頭(メッキ)
  ctx.fillRect(x0, Y + hy, 13, 3);
  ctx.fillStyle = "#9aa0aa";
  ctx.fillRect(x0, Y + hy + 2, 13, 1);
  ctx.fillStyle = "#4a3a2a"; // 底の台
  ctx.fillRect(x0, Y + PB_LANE.base, 13, 2);
}
// 盤面の絵(一度だけ描く)。art(PixelLab の盤面の絵 pb_field、D328)があればそれに、当たり判定どおりのメッキの壁を重ねる。
// なければ、ドラッグストリップの路面、白い線、チェッカーの帯、炎の絵を描く(盤面の絵の下絵にもした)
function pbFieldArt(art) {
  const c = document.createElement("canvas");
  c.width = PB_W;
  c.height = PB_H;
  const g = c.getContext("2d");
  if (art) {
    g.imageSmoothingEnabled = false;
    g.drawImage(art, 0, 0, PB_W, PB_H);
    g.strokeStyle = "rgba(200, 204, 214, 0.85)";
    g.lineWidth = 1.5;
    for (const w of PB_WALLS) {
      g.beginPath();
      g.moveTo(w[0], w[1]);
      g.lineTo(w[2], w[3]);
      g.stroke();
    }
    g.fillStyle = "#e0e4ec";
    for (const x of PB_POSTS) g.fillRect(x - 2, 30, 4, 4);
    g.fillStyle = "rgba(14, 10, 8, 0.85)";
    g.fillRect(56, 268, 38, PB_H - 268); // 落ちる口
    return c;
  }
  g.fillStyle = "#3a2c22"; // 台の木
  g.fillRect(0, 0, PB_W, PB_H);
  // 天井の丸みに合わせた路面
  g.save();
  g.beginPath();
  g.arc(84, 84, 80, Math.PI, Math.PI * 2);
  g.lineTo(164, PB_H);
  g.lineTo(4, PB_H);
  g.closePath();
  g.clip();
  g.fillStyle = "#2c3446";
  g.fillRect(0, 0, PB_W, PB_H);
  for (let y = 0; y < PB_H; y += 3) {
    g.fillStyle = y % 6 ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.05)";
    g.fillRect(0, y, PB_W, 1);
  }
  // 路面の白い線(まん中の破線)と、黄色いへりの線
  g.fillStyle = "#e8e0c8";
  for (let y = 150; y < 236; y += 12) g.fillRect(81, y, 2, 6);
  g.fillStyle = "#d8b040";
  g.fillRect(14, 60, 2, 130);
  g.fillRect(136, 60, 2, 130);
  // チェッカーの帯(ゴールの線)
  for (let x = 6; x < 148; x += 6) for (let r = 0; r < 2; r++) {
    g.fillStyle = (x / 6 + r) % 2 ? "#e8e4dc" : "#141414";
    g.fillRect(x, 58 + r * 4, 6, 4);
  }
  // 炎の絵(すべり台のそば)
  const flame = (x, y, dir) => {
    const cols = ["#ffde4a", "#ff9a2a", "#e0402a"];
    cols.forEach((col, i) => {
      g.fillStyle = col;
      for (let k = 0; k < 5; k++) g.fillRect(x + dir * (k * 4 + i * 2), y - k * 3 - i, 6 - i * 2, 2);
    });
  };
  flame(18, 238, 1);
  flame(132, 238, -1);
  g.restore();
  // 打ち出しの通路
  g.fillStyle = "#241c18";
  g.fillRect(151, 104, 12, PB_H - 104);
  // 壁のメッキ
  g.strokeStyle = "#a8acb4";
  g.lineWidth = 2;
  for (const w of PB_WALLS) {
    g.beginPath();
    g.moveTo(w[0], w[1]);
    g.lineTo(w[2], w[3]);
    g.stroke();
  }
  g.fillStyle = "#d8dce4";
  for (const x of PB_POSTS) g.fillRect(x - 2, 30, 4, 4);
  // フリッパーの下(落ちる口)
  g.fillStyle = "#120e0c";
  g.fillRect(56, 268, 38, PB_H - 268);
  return c;
}
function pbBumper(ctx, x, y, b, lit) {
  if (b.kind === "cap") {
    // ホイールキャップ: メッキの輪、まん中に赤い灯り(当たると光る)、5 本のスポーク
    x = Math.round(x);
    y = Math.round(y);
    ctx.fillStyle = "#3a3a42";
    ctx.beginPath();
    ctx.arc(x, y + 1, b.r + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d8dce4";
    ctx.beginPath();
    ctx.arc(x, y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a8e98";
    for (let k = 0; k < 5; k++) {
      const a = (k * Math.PI * 2) / 5 - Math.PI / 2;
      ctx.fillRect(Math.round(x + Math.cos(a) * (b.r - 3)) - 1, Math.round(y + Math.sin(a) * (b.r - 3)) - 1, 2, 2);
    }
    ctx.fillStyle = lit ? "#fff6c0" : "#c8282a";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 3, y - b.r + 1, 3, 1);
    return;
  }
  const cap = { beko: ["#c8282a", "#1a1a1a"], drum: ["#f0e4c8", "#c83a2a"], duck: ["#f09a2a", "#6a8a3a"] }[b.kind];
  ctx.fillStyle = "#e8ecf0";
  ctx.beginPath();
  ctx.arc(x, y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lit ? "#fff6c0" : cap[0];
  ctx.beginPath();
  ctx.arc(x, y, b.r - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cap[1];
  if (b.kind === "beko") {
    // 赤べこの黒いまだら
    ctx.fillRect(x - 4, y - 3, 3, 2);
    ctx.fillRect(x + 1, y + 1, 3, 2);
    ctx.fillRect(x - 2, y + 4, 2, 2);
  } else if (b.kind === "drum") {
    // ドラム缶のたが
    ctx.fillRect(x - 7, y - 2, 14, 1);
    ctx.fillRect(x - 7, y + 2, 14, 1);
  } else {
    // 子がもの頭
    ctx.beginPath();
    ctx.arc(x, y - 1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8c040";
    ctx.fillRect(x + 3, y - 1, 3, 2);
  }
}
function pbPanel(ctx, x, y, w, h) {
  ctx.fillStyle = "#0e0b0a";
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
  ctx.strokeStyle = "#806040";
  ctx.lineWidth = 2;
  ctx.strokeRect(Math.round(x) + 1, Math.round(y) + 1, w - 2, h - 2);
}
// 3×5 のドットの字(得点板の字。台の字はゲームの文の字ではなく、機械の字)
const PB_FONT = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", E: "111100110100111", G: "011100101101011", H: "101101111101101",
  I: "111010010010111", L: "100100100100111", M: "101111111101101", O: "010101101101010", R: "110101110101101", S: "011100010001110",
  V: "101101101101010", " ": "000000000000000",
};
function pbText(ctx, x, y, s, col, k) {
  ctx.fillStyle = col;
  [...s].forEach((ch, i) => {
    const f = PB_FONT[ch] || PB_FONT[" "];
    for (let j = 0; j < 15; j++) if (f[j] === "1") ctx.fillRect(Math.round(x + i * 4 * k + (j % 3) * k), Math.round(y + Math.floor(j / 3) * k), k, k);
  });
}
// 7 つの棒の数字
const PB_SEG = ["1110111", "0010010", "1011101", "1011011", "0111010", "1101011", "1101111", "1010010", "1111111", "1111011"];
function pbDigits(ctx, x, y, n, len, col) {
  const s = String(Math.max(0, Math.floor(n))).padStart(len, " ");
  [...s].forEach((ch, i) => {
    const dx = Math.round(x + i * 16);
    const segs = ch === " " ? "0000000" : PB_SEG[+ch];
    // 棒の並び: 上、左上、右上、まん中、左下、右下、下
    const bars = [[2, 0, 8, 2], [0, 2, 2, 8], [10, 2, 2, 8], [2, 10, 8, 2], [0, 12, 2, 8], [10, 12, 2, 8], [2, 20, 8, 2]];
    bars.forEach((b, j) => {
      ctx.fillStyle = segs[j] === "1" ? col : "rgba(255,255,255,0.06)";
      ctx.fillRect(dx + b[0], Math.round(y) + b[1], b[2], b[3]);
    });
  });
}
