// 断片: 本栖湖の長門(仮。D532〜D571)。A 湖畔 → B 湖の上 → C 甲板 → D 砲塔(こめる場面)→ E 斉射 → C → B → A の土産物屋。
// 懲罰空間の台座にはまだ置かない(VOID_FRAGMENTS に入れていない)。確かめは shot.js で --world nagato
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kGrid など)をそのまま使う
"use strict";

// ======== D 2 番砲塔の中(16 × 10 マス、北を向いて見る D545)========
// 砲口は南(手前の画面の外)。尾栓は北の奥を向くので、こめるところは上からは見えない。
// 砲尾を調べると、横から見た寄りの絵(souten)に切りかわる(D558)
const ngS = { gun: "L", step: { L: 0, R: 0 }, anim: null, t: 0, ki: { x: 104, face: "e", go: null } };
const ngReset = () => {
  ngS.step = { L: 0, R: 0 };
  ngS.anim = null;
  if (typeof ngD !== "undefined") {
    ngD.sit = null;
    ngD.bell = null;
    NG_HOTOU.hidePlayer = false;
  }
};
// 訓練の旗(こめた、回した、上げた)を消す。斉射のあとと、世界に入りなおしたとき。誰もいない軌道へ、習慣でくり返す訓練(D534)
const ngDrill = (api) => {
  for (const f of ["loadedL", "loadedR", "turned", "elevated"]) api.setFlag(f, false);
  ngS.step = { L: 0, R: 0 };
};
const NG_WALK = (c, r) => r >= 3 && r <= 9 && c >= 6 && c <= 9; // まん中の床(左右の砲のあいだ)
const ngBreech = (gun, x) => ({
  id: "breech" + gun,
  x,
  y: 7.4 * T,
  w: 1,
  h: 1,
  headY: 48,
  range: 1.9 * T,
  interact(api) {
    // こめ終わった砲は、もう寄りの絵に入らない(入ると、することがなく、出方もわからなかった。作者「二回目はいると出れなくなる」)
    if (api.flag("loaded" + gun)) return api.sfx("clang");
    ngS.gun = gun;
    api.warp("souten", "view");
  },
});
// 席(D562): 左の丸椅子が旋回手、右が照尺手。2 門こめると調べられ、きーが椅子に乗ってハンドルを回す。
// 席に座っているあいだだけ、計器の小窓を出す(背景の計器は小さくて針が見えない)。2 つすむと仕切りの頭の電鈴が鳴る。
// 絵は docs/record/2026-11-01/nagato_seat/draw.py
const NG_SEAT = {
  L: { x: 215.5, flag: "turned", dial: "ng_dial_turn", dx: 150, wheel: [204, 145] },
  R: { x: 297, flag: "elevated", dial: "ng_dial_elev", dx: 322, wheel: [286, 145] },
};
const NG_SEAT_Y = 186; // きーの体の下(座面)
const NG_DIAL_Y = 92;
const ngNow = () => performance.now() / 1000;
const ngD = { sit: null, bell: null }; // sit: { side, t0 } / bell: { t0 }
// 針(2 ドットの太さ)。turn は東(右)から南(下)へ、elev は水平(右)から上へ(0〜30 度を 4 分の 1 周に広げる)
const ngNeedle = (ctx, x0, y0, side, u) => {
  const a = ((side === "L" ? 90 : -90) * u * Math.PI) / 180;
  const c = 19.5;
  ctx.fillStyle = "#1e1a1a";
  for (const d of [-0.5, 0.5]) {
    const sx = c + d * Math.sin(a);
    const sy = c - d * Math.cos(a);
    const ex = sx + Math.cos(a) * 13;
    const ey = sy + Math.sin(a) * 13;
    const n = 30;
    for (let i = 0; i <= n; i++) ctx.fillRect(x0 + Math.floor(sx + ((ex - sx) * i) / n), y0 + Math.floor(sy + ((ey - sy) * i) / n), 1, 1);
  }
  ctx.fillStyle = "#291c22";
  ctx.fillRect(x0 + 18, y0 + 19, 4, 2);
  ctx.fillRect(x0 + 19, y0 + 18, 2, 4);
};
const ngSeat = (side) => ({
  id: "seat" + side,
  x: NG_SEAT[side].x,
  y: 180,
  w: 1,
  h: 1,
  headY: 30,
  range: 1.1 * T,
  interact(api) {
    const S = NG_SEAT[side];
    if (ngD.sit || ngD.bell) return;
    if (!api.flag("loadedL") || !api.flag("loadedR") || api.flag(S.flag)) return; // 2 門こめるまで、席は使えない
    const SIT = 3.0;
    api.freeze(SIT + 0.2);
    NG_HOTOU.hidePlayer = true;
    ngD.sit = { side, t0: ngNow() };
    api.sfx("whir");
    api.later(1200, () => api.sfx("whir"));
    api.later(SIT * 1000, () => {
      api.setFlag(S.flag);
      ngD.sit = null;
      NG_HOTOU.hidePlayer = false;
      api.place(S.x, 7.0 * T);
      api.face("south");
      // 2 つの席がすむと、伝声管で注水の号令(音だけ D564)。電鈴は E 斉射の中へ移した
      if (api.flag("turned") && api.flag("elevated") && !api.flag("fired")) {
        api.later(500, () => {
          api.sfx("tube");
          api.freeze(3.2);
          api.later(900, () => (api.sfx("flood"), api.shake(2.0, 1)));
          api.later(3000, () => api.warp("seiha", "view"));
        });
      }
    });
  },
});
// D の前景(todo 217 オ)。背景から切り抜いた物を、きーと前後を比べて描きなおす(docs/record/2026-11-01/nagato_depth/cut.py)
const NG_FG = { wall: [234, 90], dialL: [196, 122], dialR: [276, 122], stoolL: [198, 164], stoolR: [278, 164] };
// ax, ay は物の x, y(描く場所 sx, sy から、背景の原点を出す)
const ngFg = (name, ax, ay, wheel) => (ctx, sx, sy, t, api) => {
  const ox = sx - ax;
  const oy = sy - ay;
  const im = api.image("fg_hotou_" + name);
  const [x, y] = NG_FG[name];
  if (im) ctx.drawImage(im, Math.round(ox + x), Math.round(oy + y));
  // ハンドル(座って回すあいだだけ 4 こまで回る)
  if (!wheel) return;
  const w = api.image("ng_wheel_" + wheel);
  if (!w) return;
  const turning = ngD.sit && ngD.sit.side === wheel;
  const f = turning ? Math.floor((ngNow() - ngD.sit.t0) * 10) % 4 : 0;
  const [wx, wy] = NG_SEAT[wheel].wheel;
  ctx.drawImage(w, f * 23, 0, 23, 21, Math.round(ox + wx), Math.round(oy + wy), 23, 21);
};
const NG_HOTOU = {
  tile: T,
  bg: "#2e2a2e",
  map: kGrid(16, 10, (c, r) => !NG_WALK(c, r)),
  legend: K_LEGEND,
  drawGround(ctx, ox, oy, img, api) {
    const bg = api.image("bg_hotou");
    if (bg) ctx.drawImage(bg, Math.round(ox), Math.round(oy));
  },
  // 座ったきーと計器の小窓
  drawOverlay(ctx, ox, oy, t, api) {
    if (ngD.sit) {
      const S = NG_SEAT[ngD.sit.side];
      const ki = api.image(ngKiImg());
      if (ki) ctx.drawImage(ki, 0, 64, 64, 64, Math.round(ox + S.x - 32), Math.round(oy + NG_SEAT_Y - 47), 64, 64); // 向こう向き(D134)
      const d = api.image(S.dial);
      const dx = Math.round(ox + S.dx);
      const dy = Math.round(oy + NG_DIAL_Y);
      if (d) ctx.drawImage(d, dx, dy);
      const u = ngEase((ngNow() - ngD.sit.t0 - 0.3) / 2.2);
      ngNeedle(ctx, dx, dy, ngD.sit.side, u);
    }
  },
  spawns: {
    start: { x: 7.0 * T, y: 3.5 * T, facing: "south" }, // 奥の戸(C 甲板から)の下
    fromL: { x: 6.3 * T, y: 6.8 * T, facing: "west" },
    fromR: { x: 9.6 * T, y: 6.8 * T, facing: "east" },
  },
  objects: [
    ngBreech("L", 4.7 * T),
    ngBreech("R", 11.3 * T),
    ngSeat("L"),
    ngSeat("R"),
    // 奥の戸(C 甲板へ)。前は出口がなく、斉射のあとにもう一度入ると出られなかった(作者「斉射した後、砲塔にもう一度入ると装填できるが出られなくなる」)
    { id: "exit", x: 7.0 * T, y: 3.1 * T, w: 1, h: 1, headY: 30, range: 1.0 * T, draw() {}, interact: (api) => api.warp("kansen", "door") },
    // まん中の仕切り。戸の前のいちばん上の列だけ、左右に通れる(D562)。絵はきーよりいつも手前(todo 217 オ)
    { id: "wall", x: 8 * T, y: 10 * T, w: 1, h: 1, sortDy: 1000, solid: { w: 0.8 * T, h: 6 * T, dy: -3 * T }, draw: ngFg("wall", 8 * T, 10 * T) },
    // 計器の箱と丸椅子は、きーの足もとと比べて前後を決める
    { id: "fgDialL", x: 196, y: 168, w: 1, h: 1, draw: ngFg("dialL", 196, 168, "L") },
    { id: "fgDialR", x: 276, y: 168, w: 1, h: 1, draw: ngFg("dialR", 276, 168, "R") },
    { id: "fgStoolL", x: 198, y: 216, w: 1, h: 1, draw: ngFg("stoolL", 198, 216) },
    { id: "fgStoolR", x: 278, y: 216, w: 1, h: 1, draw: ngFg("stoolR", 278, 216) },
  ],
  triggers: [],
};

// ======== こめる場面の寄りの絵(480 × 288、画面と同じ広さ)========
// 西から東を向き、右の砲をまん中の仕切りのがわから見る(左の砲も同じ絵。尾栓は左右対称 D557)。
// 左から、装填棒(鎖)、2 段の籠(上: 装薬 4 袋 / 下: 砲弾)と揚弾機のレール、尾栓、砲身(research.md の 6)
// きーは A で一つずつ進める(D556): 尾栓を開ける → 揚弾機 → 砲弾を押しこむ → 装薬を押しこむ → 尾栓を閉める
// きーは床を歩いて持ち場へ行き、着いてから物が動く(D560)
// 字は出さない。次に動かす所に ▼ を出す。絵は docs/record/2026-11-01/nagato_load/(export.py で書き出す)
const NG = {
  axis: 136, // 砲の軸の高さ
  cageX: 161, // 籠の左(前の枠)。揚弾機の塔と床の穴に収める(todo 212)
  cageUp: 100, // 籠の上のはし: 下の段(砲弾)が軸にそろう
  cageMid: 124, // 上の段(装薬)が軸にそろう
  cageLow: 284, // 床の穴の下(手前の床に隠れて見えない)
  ramX: 150, // 装填棒の頭が休む所
  ramIn: 246, // 押しこみきった所(尾栓の口)
  shellX: 166,
  bagX: 165,
  bagStep: 18, // 装薬の袋の間(1 袋 17)
  // 秒数
  open: 1.2,
  hoist: 1.6,
  ram: 2.4,
  lower: 0.7,
  close: 1.4,
};
// 手順(A を押すごと)。mark は ▼ の場所、at はきーの持ち場(床の上の x と向き。D560)
const NG_AT = { plug: [262, "e"], hoist: [118, "e"], ram: [76, "w"] };
const NG_STEPS = [
  { anim: "open", mark: [250, 106], at: NG_AT.plug }, // 尾栓
  { anim: "hoist", mark: [202, 258], at: NG_AT.hoist }, // 床の口(揚弾機)
  { anim: "ram1", mark: [96, 120], at: NG_AT.ram }, // 装填棒
  { anim: "ram2", mark: [96, 120], at: NG_AT.ram },
  { anim: "close", mark: [250, 106], at: NG_AT.plug },
];
// きー(歩きの絵の横向きを 1.5 倍に直接描いた絵 D134、docs/record/2026-11-01/nagato_ki/)。床を歩いて持ち場へ行き、着いてから物が動く
const NG_KI = { feet: 273, speed: 90, start: 104 };
// 寄りの絵は 1.5 倍に広げて映す(きーは今の大きさのまま、場面を大きくする D561)。画面は横だけ、きーについて流れる。
// 縦は下にそろえる(尾栓の ▼ から床のきーまでが一つの画面に入る)
const NG_Z = 1.5;
const NG_VIEW = { w: 480, h: 288 };
const ngCamX = () => Math.max(0, Math.min(480 * NG_Z - NG_VIEW.w, ngS.ki.x * NG_Z - NG_VIEW.w / 2));
const NG_CAMY = 288 * NG_Z - NG_VIEW.h;
let ngOff = null;
const ngLen = { open: NG.open, hoist: NG.hoist, ram1: NG.ram, ram2: NG.lower + NG.ram, close: NG.close };
const ngEase = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const ngLerp = (a, b, u) => a + (b - a) * u;
// 押して戻る(前の 6 割で押し、うしろの 4 割で戻る)
const ngRamHead = (u) => (u < 0.6 ? ngLerp(NG.ramX, NG.ramIn, ngEase(u / 0.6)) : ngLerp(NG.ramIn, NG.ramX, ngEase((u - 0.6) / 0.4)));
const ngMark = (ctx, x, y, t) => {
  y = Math.round(y + (Math.sin(t * 5) > 0 ? 1 : 0));
  ctx.fillStyle = "#000";
  ctx.fillRect(x - 4, y - 1, 9, 1);
  for (let i = 0; i < 5; i++) ctx.fillRect(x - 4 + i, y + i, 9 - i * 2, 1);
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 4; i++) ctx.fillRect(x - 3 + i, y + i, 7 - i * 2, 1);
};
// 今の絵の状態(手順と動きの途中から)
const ngPose = () => {
  const st = ngS.step[ngS.gun];
  const a = ngS.anim;
  const u = a ? Math.min(1, (ngS.t - a.t0) / ngLen[a.name]) : 1;
  const p = { plug: st >= 1 && st <= 4 ? "open" : "shut", plugU: 1, cage: null, shell: null, bags: null, ram: NG.ramX };
  // 籠の中身: 砲弾は 3 まで、装薬は 4 まで
  if (st === 2) p.cage = NG.cageUp;
  if (st === 3) p.cage = NG.cageUp;
  if (st === 4) p.cage = NG.cageMid;
  if (st >= 2 && st <= 2) p.shell = { x: NG.shellX, inCage: true };
  if (st >= 2 && st <= 3) p.bags = { x: NG.bagX, inCage: true };
  if (!a) return p;
  if (a.name === "open") {
    p.plug = u < 0.45 ? "out" : "open";
    p.plugU = u < 0.45 ? u / 0.45 : 1;
  } else if (a.name === "hoist") {
    p.cage = ngLerp(NG.cageLow, NG.cageUp, ngEase(u));
    p.shell = { x: NG.shellX, inCage: true };
    p.bags = { x: NG.bagX, inCage: true };
  } else if (a.name === "ram1") {
    p.cage = NG.cageUp;
    p.ram = ngRamHead(u);
    const pushed = u < 0.6 ? Math.max(NG.shellX, p.ram + 7) : 999;
    p.shell = pushed < 300 ? { x: pushed, inCage: false } : null;
    p.bags = { x: NG.bagX, inCage: true };
  } else if (a.name === "ram2") {
    const ul = Math.min(1, (ngS.t - a.t0) / NG.lower);
    const ur = Math.max(0, (ngS.t - a.t0 - NG.lower) / NG.ram);
    p.cage = ngLerp(NG.cageUp, NG.cageMid, ngEase(ul));
    p.ram = ur > 0 ? ngRamHead(ur) : NG.ramX;
    const pushed = ur < 0.6 ? Math.max(NG.bagX, p.ram + 7) : 999;
    p.bags = pushed < 300 ? { x: pushed, inCage: ur <= 0 } : null;
  } else if (a.name === "close") {
    p.cage = ngLerp(NG.cageMid, NG.cageLow, ngEase(Math.min(1, u * 1.4)));
    p.plug = u < 0.55 ? "open" : u < 0.9 ? "out" : "shut";
    p.plugU = u < 0.55 ? 1 : 1 - (u - 0.55) / 0.35;
  }
  return p;
};
// 原寸の場面(きーと ▼ のぞく)を裏の画面に描き、1.5 倍に広げて映す。きーと ▼ は広げたあとに今の大きさで描く
const ngDraw = (ctx, ox, oy, api, t) => {
  if (!ngOff) {
    ngOff = document.createElement("canvas");
    ngOff.width = 480;
    ngOff.height = 288;
  }
  const g = ngOff.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, 480, 288);
  ngScene(g, 0, 0, api);
  const cx = ngCamX();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ngOff, cx / NG_Z, NG_CAMY / NG_Z, NG_VIEW.w / NG_Z, NG_VIEW.h / NG_Z, Math.round(ox), Math.round(oy), NG_VIEW.w, NG_VIEW.h);
  ctx.restore();
  const sx = (x) => Math.round(ox + x * NG_Z - cx);
  const sy = (y) => Math.round(oy + y * NG_Z - NG_CAMY);
  // きー(床の上、いちばん手前)。歩くあいだは 1 ドットはずむ
  const ki = ngS.ki;
  const kim = api.image((ki.face === "w" ? "ng_ki_w" : "ng_ki_e") + (ngHat.on ? "_hat" : "")); // 水兵帽(D571)
  if (kim) {
    const bob = ki.go && Math.sin(t * 18) > 0 ? 1 : 0;
    ctx.drawImage(kim, Math.round(sx(ki.x) - kim.width / 2), sy(NG_KI.feet) - kim.height - bob);
  }
  // 次に動かす所
  const st = ngS.step[ngS.gun];
  if (!ngS.anim && !ki.go && st < NG_STEPS.length) ngMark(ctx, sx(NG_STEPS[st].mark[0]), sy(NG_STEPS[st].mark[1]), t);
};
const ngScene = (ctx, ox, oy, api) => {
  const im = (k) => api.image(k);
  const at = (k, x, y) => {
    const i = im(k);
    if (i) ctx.drawImage(i, Math.round(ox + x), Math.round(oy + y));
  };
  at("bg_souten", 0, 0);
  const p = ngPose();
  const shellAt = (x, y) => at("ng_shell", x - 1, y - 1);
  const bagsAt = (x, y) => {
    for (let i = 0; i < 4; i++) at("ng_bag", x + i * NG.bagStep - 1, y - 1);
  };
  // 籠の奥の板と中身(籠の上のはしから: 上の段の袋は +4、下の段の砲弾は +28)
  if (p.cage != null) {
    at("ng_cage_back", NG.cageX + 3, p.cage + 2);
    if (p.shell && p.shell.inCage) shellAt(p.shell.x, p.cage + 28);
    if (p.bags && p.bags.inCage) bagsAt(p.bags.x, p.cage + 4);
  }
  // 押しこまれる物(軸の高さ)と装填棒
  if (p.shell && !p.shell.inCage) shellAt(p.shell.x, NG.axis - 8);
  if (p.bags && !p.bags.inCage) bagsAt(p.bags.x, NG.axis - 8);
  const ram = im("ng_ram");
  if (ram) {
    const hx = Math.round(p.ram);
    const chain = hx - NG.ramX;
    if (chain > 0) ctx.drawImage(ram, 0, 0, chain, ram.height, Math.round(ox + NG.ramX), Math.round(oy + NG.axis - 9), chain, ram.height);
    ctx.drawImage(ram, 110, 0, 6, ram.height, Math.round(ox + hx), Math.round(oy + NG.axis - 9), 6, ram.height);
  }
  if (p.cage != null) at("ng_cage_front", NG.cageX, p.cage);
  // 床: 籠が穴へ下りるとき、穴の手前のふちと左右の床が前に来る(作者「穴に入った時に、背景の前後を配慮してね」)
  at("fg_souten_floor", 140, 266);
  // 手前の物: 砲の台の梁(籠が上がり下りするとき、その前を通る)、砲尾の筒(砲の中へ入った物を隠す)
  at("fg_souten_beam", 140, 172);
  at("fg_souten_drum", 246, 94);
  // 尾栓: 引いた姿は筒から出てくる。開いた姿はいちばん手前
  if (p.plug === "out") {
    const i = im("ng_plug_out");
    if (i) {
      const w = Math.max(1, Math.round(i.width * p.plugU));
      ctx.drawImage(i, i.width - w, 0, w, i.height, Math.round(ox + 252 - w), Math.round(oy + 118), w, i.height);
    }
  } else if (p.plug === "open") at("ng_plug_open", 234, 121);
};
const NG_SFX = { open: "clang", hoist: "whir", ram1: "knock", ram2: "knock", close: "clang" };
const NG_SOUTEN = {
  tile: T,
  bg: "#1e1c20",
  hidePlayer: true,
  map: kGrid(15, 9, () => false),
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 4 * T, facing: "east" } },
  objects: [],
  triggers: [],
  debug: () => ngS,
  onEnter() {
    ngS.anim = null;
    ngS.ki = { x: NG_KI.start, face: "e", go: null };
  },
  // A: きーが持ち場へ歩き、着いたら動かす
  onA(api) {
    const st = ngS.step[ngS.gun];
    if (ngS.anim || ngS.ki.go) return true;
    // 手順が全部すんでいたら、A でも D へもどる
    if (st >= NG_STEPS.length) return api.warp("hotou", ngS.gun === "L" ? "fromL" : "fromR"), true;
    ngS.ki.go = { x: NG_STEPS[st].at[0], face: NG_STEPS[st].at[1] };
    return true;
  },
  // B で D へもどる(動いている間はもどらない)。手順はそのまま残る
  onB(api) {
    if (!ngS.anim && !ngS.ki.go) api.warp("hotou", ngS.gun === "L" ? "fromL" : "fromR");
    return true;
  },
  input(api, dt) {
    ngS.t += dt;
    api.place(7 * T, 4 * T);
    const ki = ngS.ki;
    if (ki.go) {
      const d = ki.go.x - ki.x;
      const step = NG_KI.speed * dt;
      if (Math.abs(d) <= step) {
        // 着いた: 持ち場の向きになって、物を動かす
        ki.x = ki.go.x;
        ki.face = ki.go.face;
        ki.go = null;
        const name = NG_STEPS[ngS.step[ngS.gun]].anim;
        ngS.anim = { name, t0: ngS.t };
        api.sfx(NG_SFX[name]);
      } else {
        ki.x += Math.sign(d) * step;
        ki.face = d > 0 ? "e" : "w";
      }
    }
    const a = ngS.anim;
    if (a && ngS.t - a.t0 >= ngLen[a.name]) {
      ngS.anim = null;
      ngS.step[ngS.gun]++;
      if (a.name === "ram2" || a.name === "ram1") api.sfx("clang");
      // こめ終わったら、少し見せて D へもどる
      if (ngS.step[ngS.gun] >= NG_STEPS.length) {
        api.setFlag("loaded" + ngS.gun);
        api.later(900, () => api.warp("hotou", ngS.gun === "L" ? "fromL" : "fromR"));
      }
    }
  },
  drawGround(ctx, ox, oy, img, api) {
    ngDraw(ctx, ox, oy, api, ngS.t);
  },
};
