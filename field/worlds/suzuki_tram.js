// 断片: 荒川の鈴木商店。都電で着く(todo 277、D669〜D672)
// ホームの側(向こうの見えない面)の扉が開いたしるし: 車内の明かりがホームにこぼれ、踏み台が出る。top は都電の屋根の上のふち
function sDoorLight(ctx, sx, top) {
  [70, 110, 150].forEach((a, k) => {
    const w = 30 - k * 6;
    ctx.fillStyle = `rgba(255, 206, 130, ${a / 255})`;
    ctx.beginPath();
    ctx.moveTo(sx - w, top - 12 - k * 3);
    ctx.lineTo(sx + w, top - 12 - k * 3);
    ctx.lineTo(sx + w - 4, top);
    ctx.lineTo(sx - w + 4, top);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = "#786460";
  ctx.fillRect(sx - 12, top - 4, 25, 5);
}

// 乗る停留場(名前はにじむ)で都電が来て止まり、前の扉から乗る → 車内を歩ける(だれもいない、放送なし、
// 窓の外を夕方の下町が右から左へ流れる)→ 降車ボタンを押すと次で止まり、後ろの扉から A 停留場(stop)へ降りる。
// 押すまで走りつづける。帰りは今まで通り(A の都電を調べると帰る)。絵は docs/record/2026-11-11/toden/
// suzuki.js の sMap・sSpot を使う(index.html で、このファイルより前に読む)
"use strict";

// 都電の時間表(秒)と、絵の中の位置(ドット)
const ST = {
  arriveWait: 1.2, // 乗る停留場に入ってから、都電が見えはじめるまで
  arriveSec: 5, // 左の外から止まるまで(だんだん遅く)
  tramY: 160, // 都電の絵の上の y(A 停留場の絵と同じ高さ)
  tramStopX: 200, // 止まったときの都電の絵の左の x
  frontDoor: [243, 275], // 都電の絵の中の前の扉(右)の x の範囲
  doorY: [44, 94], // 都電の絵の中の扉の y の範囲
  speed: 40, // 窓の外が流れる速さ(ドット/秒)
  runAfterPress: 4, // 降車ボタンを押してから、止まりはじめるまで
  brakeSec: 3, // 止まるまで
  rearDoor: [50, 96, 22, 160], // 車内の絵の後ろの扉(左)の x0, x1, y0, y1
  aDoorX: 549, // A 停留場の絵の都電の、前の扉のまん中の x
  aTramTop: 174, // A 停留場の絵の都電の、屋根の上のふちの y
  retWhite: 14, // 帰り(D673): 乗ってから、窓の外が白くなりはじめるまで
  retWhiteSec: 6, // 白くなりきるまで。なりきったら懲罰空間へ
};
// 今どうなっているか(マップに入るたびに戻す)
const sT = { t0: 0, off: 0, pressT: -1, stopT: -1, boarding: false, ret: false, retT0: 0, leaving: false };
const sTNow = () => performance.now() / 1000;

S_GRIDS.board = [
  "########################",
  "########################",
  "########################",
  "........................",
  "###########.....########",
  "###########........#####",
  "########################",
  "########################",
  "########################",
  "########################",
];
S_GRIDS.car = [
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  "#..................#",
  "####################",
];

// 都電が左から来て止まるまでの、絵の左の x
function sTramX() {
  const u = (sTNow() - sT.t0 - ST.arriveWait) / ST.arriveSec;
  if (u <= 0) return -400;
  if (u >= 1) return ST.tramStopX;
  return ST.tramStopX - 600 * (1 - u) * (1 - u); // 止まる前はゆっくり
}
const sTramArrived = () => sTramX() === ST.tramStopX;

// 乗る停留場(停留場の名前の札の字は、絵の中でにじませてある。D75)
const S_BOARD = sMap("board", 24, 10, {
  spawns: { start: { x: 13 * T, y: 4.9 * T, facing: "south" } },
  onEnter() {
    sT.t0 = sTNow();
    sT.boarding = false;
    sT.ret = false;
  },
  objects: [
    kWall(0, 5.4 * T, 24 * T, 6 * T), // ホームの前のふち(都電の屋根に重ならないところまで)
    {
      id: "tram",
      x: 12 * T,
      y: ST.tramY + 102, // 都電の絵の下のはしで、きーと前後
      w: 1,
      h: 1,
      draw(ctx, sx, sy, t, api) {
        const im = api.image("tram_side");
        if (!im) return;
        const x = Math.round(sTramX() + sx - this.x);
        const y = sy - 102;
        ctx.drawImage(im, x, y);
      },
    },
    // 止まったら、ホームの側(向こうの見えない面)の前の扉が開く。車内の明かりがホームにこぼれ、踏み台が出る
    // (見える手前の面は線路の側なので、扉は閉じたまま。作者「ドア、反対側じゃないか」)
    {
      id: "doorLight",
      x: ST.tramStopX + (ST.frontDoor[0] + ST.frontDoor[1]) / 2,
      y: ST.tramY - 10, // きーより先に描く(明かりの上にきーが立つ)
      w: 1,
      h: 1,
      draw(ctx, sx, sy) {
        if (sTramArrived()) sDoorLight(ctx, sx, sy + 10 + 14);
      },
    },
    // 前の扉から乗る
    sSpot(
      "tramDoor",
      ST.tramStopX + (ST.frontDoor[0] + ST.frontDoor[1]) / 2,
      5.3 * T,
      (api) => {
        if (sT.boarding) return;
        sT.boarding = true;
        const p = api.player();
        api.walk([[ST.tramStopX + (ST.frontDoor[0] + ST.frontDoor[1]) / 2, p.y]], null, () => api.warp("car", "front"));
      },
      { canInteract: () => sTramArrived(), range: 52 }
    ),
  ],
});

const sRetWhite = () => ease((sTNow() - sT.retT0 - ST.retWhite) / ST.retWhiteSec);

// 車内の窓の外(夕方の下町の帯。ぐるりとつながる。D671 の案 2 の高さ)
function sCarDrawGround(ctx, ox, oy, img) {
  const get = (k) => (typeof img === "function" ? img(k) : null);
  const town = get("car_town");
  const car = get("bg_car");
  if (town) {
    const W = town.width;
    const run = sT.stopT < 0;
    const bob = run && Math.floor(sTNow() * 2.5) % 2 ? 1 : 0; // ごとん、ごとん
    const x0 = -(Math.floor(sT.off) % W);
    for (let x = x0; x < 20 * T; x += W) ctx.drawImage(town, Math.round(ox + x), oy + bob);
  }
  if (sT.ret) {
    // 帰りは夜の下町(D673)。しばらくすると、窓の外が白くなっていく
    ctx.fillStyle = "rgba(14, 22, 64, 0.55)";
    ctx.fillRect(ox, oy, 20 * T, 7 * T);
    const w = sRetWhite();
    if (w > 0) {
      ctx.fillStyle = `rgba(250, 250, 248, ${Math.min(0.97, w)})`;
      ctx.fillRect(ox, oy, 20 * T, 7 * T);
    }
  }
  if (car) ctx.drawImage(car, ox, oy);
  if (sT.ret) {
    ctx.fillStyle = "rgba(20, 24, 60, 0.25)"; // 車内も少し夜
    ctx.fillRect(ox, oy, 20 * T, 7 * T);
  }
  // 止まったら、後ろの扉が開く(外の夕方が見える)
  if (sT.stopT >= 0 && sTNow() - sT.stopT > 0.6) {
    const [x0, x1, y0, y1] = ST.rearDoor;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox + x0, oy + y0, x1 - x0, y1 - y0);
    ctx.clip();
    ctx.fillStyle = "#5a4a58";
    ctx.fillRect(ox + x0, oy + y0, x1 - x0, y1 - y0);
    if (town) ctx.drawImage(town, Math.round(ox + x0 - (Math.floor(sT.off) % town.width)), oy + 10);
    ctx.fillStyle = "rgba(150, 132, 140, 0.9)"; // 扉の下に、A 停留場のホーム
    ctx.fillRect(ox + x0, oy + y1 - 34, x1 - x0, 34);
    ctx.restore();
  }
}

// 降車ボタン(扉のそばの柱。押すと赤く灯る)
const sTButton = (id, x) =>
  sSpot(
    id,
    x,
    5.4 * T,
    (api) => {
      if (sT.pressT >= 0) return;
      sT.pressT = sTNow();
      api.sfx("pinpon");
      api.bubble(id, "とまります", 2600);
    },
    {
      headY: 52,
      draw(ctx, sx, sy) {
        const on = sT.pressT >= 0 && sT.stopT < 0;
        const bx = sx - 3;
        const by = sy - 52;
        ctx.fillStyle = "#e8dcc0";
        ctx.fillRect(bx - 1, by - 1, 8, 9);
        ctx.fillStyle = on ? "#ff5a3c" : "#a8322a";
        ctx.fillRect(bx + 1, by + 1, 4, 5);
        if (on) {
          ctx.fillStyle = "rgba(255, 110, 70, 0.35)";
          ctx.fillRect(bx - 3, by - 3, 12, 13);
        }
      },
    }
  );

// 車内(6000 形のころの古い都電。だれもいない。放送なし)
const S_CAR = sMap("car", 20, 7, {
  drawGround: sCarDrawGround,
  spawns: { front: { x: 14.3 * T, y: 5.5 * T, facing: "west" } },
  onEnter() {
    sT.off = 0;
    sT.pressT = -1;
    sT.stopT = -1;
    sT.boarding = false;
    sT.leaving = false;
    sT.retT0 = sTNow();
  },
  objects: [
    // 走る、止まる(窓の外を流すだけ。押すまで走りつづける)
    {
      id: "ride",
      x: -100,
      y: -100,
      w: 1,
      h: 1,
      update(dt, t, api) {
        if (sT.stopT >= 0) return;
        let v = ST.speed;
        if (sT.ret) {
          // 帰りは止まらない(降りる停留場はもうない)。白くなりきったら懲罰空間へ
          if (sRetWhite() >= 1 && !sT.leaving) {
            sT.leaving = true;
            api.exit();
          }
        } else if (sT.pressT >= 0) {
          const u = (sTNow() - sT.pressT - ST.runAfterPress) / ST.brakeSec;
          if (u >= 1) {
            sT.stopT = sTNow();
            return;
          }
          if (u > 0) v *= 1 - ease(u);
        }
        sT.off += v * Math.min(dt, 0.1);
      },
    },
    sTButton("btnRear", 3.3 * T),
    sTButton("btnFront", 13.2 * T),
    // 止まったら、後ろの扉から降りて A 停留場へ
    sSpot(
      "rearDoor",
      (ST.rearDoor[0] + ST.rearDoor[1]) / 2,
      5.4 * T,
      (api) => {
        if (sT.boarding) return;
        sT.boarding = true;
        const p = api.player();
        api.walk([[(ST.rearDoor[0] + ST.rearDoor[1]) / 2, p.y]], null, () => api.warp("stop", "start"));
      },
      { canInteract: () => sT.stopT >= 0 && sTNow() - sT.stopT > 0.6, range: 52 }
    ),
  ],
});

// A 停留場の都電(D75、D673): 納品書を持つまで乗れない。持っていれば、ホームの側の前の扉から乗って帰る(夜の車内)
S_STOP.objects.push(
  {
    id: "aDoorLight",
    x: ST.aDoorX,
    y: ST.aTramTop - 24, // きーより先に描く
    w: 1,
    h: 1,
    draw(ctx, sx, sy, t, api) {
      if (api.hasItem("納品書")) sDoorLight(ctx, sx, sy + 24);
    },
  },
  sSpot("tram", 11 * T, 5.4 * T, (api) => {
    if (!api.hasItem("納品書")) return api.mutter("まだ帰れない。", 1600); // 仮
    if (sT.boarding) return;
    sT.boarding = true;
    sT.ret = true;
    api.walk([[ST.aDoorX, api.player().y]], null, () => api.warp("car", "front"));
  })
);
// 車内から降りてきたとき、乗る動きの途中のしるしを戻す
S_STOP.onEnter = () => {
  sT.boarding = false;
};
