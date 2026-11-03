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

// ======== E 斉射(動く場面 D564)========
// カット 1: 艦首をこちらに向けた長門。水平で主砲は前後 → 主砲が旋回し仰角を上げ、同時に注水で傾く → ブザー →
// 各砲塔の左の砲(4 門)が撃つ → 左の砲が下がり右の砲が上がる(左右交互 作者「同じ砲塔の砲は交互に仰角を取る」)→ 残り 4 門。
// カット 2: 夕焼け空を見上げる。間をおいて 4 発、また 4 発、成層圏の核爆発ほど大げさな爆発。
// 艦のこまは docs/record/2026-11-01/nagato_e/anim/ship.py(背景から切り分け、砲身は手で、傾きは RotSprite で回す)。煙と爆発はここで描く
const NG_E = {
  n1: 56, // 旋回と傾きのこま
  n2: 20, // 左右の砲の入れかえのこま
  x0: 36, // こまを置く x
  fw: 240,
  cols: 8,
  muz: [
    [157.4, 91.2],
    [162.5, 102.1],
    [146.4, 102.4],
    [151.4, 113.3],
  ], // 撃つときの砲口(前の 2 砲塔と、艦橋のうしろの 2 砲塔)
  dir: [0.57, -0.82], // 砲の向き(55 度)
  water: 203, // 水面(映りの折り返し)
  // 秒(カット 1)。ゆっくり動かして重さを出す(作者「もう少し動きをゆっくりしたほうが重厚感が出る」)
  move0: 1.5,
  move: 7.0,
  bell: 9.6,
  fireA: 11.6,
  swap0: 14.2,
  swap: 2.6,
  fireB: 17.8,
  cut: 23.0,
  // 秒(カット 2、切りかえから)
  burst1: 3.5,
  burst2: 8.5,
  boom: 3.0, // 音とゆれは、火球と EMP より遅れて届く(作者「火球とEMPが見えて、音が後から聞こえるようにして」)
  end: 15.0,
};
const NG_BURST = [
  [
    [150, 72],
    [262, 46],
    [352, 88],
    [420, 40],
  ],
  [
    [196, 40],
    [300, 92],
    [392, 58],
    [100, 50],
  ],
];
const ngE = { t: 0, done: {}, off: null };
const ngRnd = (i) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ngOut = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - (1 - u) * (1 - u));
// ドットの丸(1 ドットずつの横線で塗る)
const ngDisc = (g, cx, cy, r, col) => {
  const R = Math.round(r);
  if (R < 1) return;
  g.fillStyle = col;
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  for (let y = -R; y <= R; y++) {
    const w = Math.floor(Math.sqrt(R * R + R * 0.8 - y * y));
    if (w >= 0) g.fillRect(x0 - w, y0 + y, w * 2 + 1, 1);
  }
};
// 点描の丸(ふちをぼかす。d は 0〜1 の濃さ。市松もようの間引き)
const ngDither = (g, cx, cy, r, col, d) => {
  const R = Math.round(r);
  if (R < 1 || d <= 0) return;
  g.fillStyle = col;
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  const step = d > 0.7 ? 1 : d > 0.4 ? 2 : 4;
  for (let y = -R; y <= R; y++) {
    const w = Math.floor(Math.sqrt(R * R + R * 0.8 - y * y));
    for (let x = -w; x <= w; x++) if ((((x + y) % step) + step) % step === 0 && (step < 4 || (y & 1) === 0)) g.fillRect(x0 + x, y0 + y, 1, 1);
  }
};
// なめらかな乱れ(0〜1)。炎のふちと煙のでこぼこに使う
const ngNoise = (x, y) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi));
  const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi));
  const h = (a, b) => ngRnd(a * 57 + b * 131);
  return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
};
// 砲煙: 黒煙がもうもうと湧く(作者「その後のもうもうとして黒煙」、写真 ref_fire.png)。たくさんの玉が、炎の中から湧いてふくらみ、ゆっくり流れる
const NG_SMOKE = ["#0c0809", "#1a1210", "#2c1f1a", "#4a3328", "#6e4a36"];
// ふちが乱れた塊(行ごとに幅を乱れでゆらし、時間でゆっくり形を変える。作者「黒煙が丸いのでもっとランダムな形状に」)
const ngBlob = (g, cx, cy, r, col, seed, tm) => {
  const R = Math.round(r);
  if (R < 1) return;
  g.fillStyle = col;
  const x0 = Math.round(cx);
  const y0 = Math.round(cy);
  for (let y = -R; y <= R; y++) {
    const base = Math.sqrt(Math.max(0, R * R - y * y));
    const nl = ngNoise((y + seed) / 5.5, seed * 0.37 + tm * 0.6);
    const nr = ngNoise((y + seed) / 5.5 + 40, seed * 0.37 + tm * 0.6 + 9);
    const wl = Math.floor(base * (0.55 + 0.75 * nl));
    const wr = Math.floor(base * (0.55 + 0.75 * nr));
    if (wl + wr > 0) g.fillRect(x0 - wl, y0 + y, wl + wr + 1, 1);
  }
};
const ngSmoke = (g, mx, my, age, seed) => {
  if (age < 0.06) return;
  const a0 = age - 0.06;
  const balls = [];
  for (let k = 0; k < 34; k++) {
    const tb = (k % 6) * 0.05;
    const u = a0 - tb;
    if (u <= 0) continue;
    const s0 = 8 + ngRnd(seed + k) * 92;
    const s = s0 * (0.25 + 0.75 * ngOut(u / 1.2)) + Math.min(u, 6) * 3;
    const side = (ngRnd(seed + k + 99) - 0.5) * (10 + s0 * 0.75);
    const x = mx + NG_E.dir[0] * s - NG_E.dir[1] * side + u * 4;
    const y = my + NG_E.dir[1] * s + NG_E.dir[0] * side - u * 3;
    const q = ngRnd(seed + k + 50);
    const r = (3 + q * q * 18 + s0 * 0.08) * ngOut(u / 1.6) * (1 + Math.min(u, 6) * 0.09);
    balls.push([x, y, r]);
  }
  balls.forEach(([x, y, r], k) => ngBlob(g, x, y, r + 1, NG_SMOKE[0], seed + k * 13, age));
  balls.forEach(([x, y, r], k) => ngBlob(g, x, y, r, NG_SMOKE[1], seed + k * 13, age));
  balls.forEach(([x, y, r], k) => ngBlob(g, x - r * 0.18, y - r * 0.2, r * 0.72, NG_SMOKE[2], seed + k * 13 + 5, age));
  balls.forEach(([x, y, r], k) => ngBlob(g, x - r * 0.32, y - r * 0.36, r * 0.4, NG_SMOKE[3], seed + k * 13 + 11, age));
  for (const [x, y, r] of balls) ngDither(g, x - r * 0.4, y - r * 0.45, r * 0.22, NG_SMOKE[4], 0.5);
};
// 砲口の炎: 丸い玉でなく、砲口から砲の向きへ噴き出す巨大な炎(作者「巨大なマズルフラッシュ」)。0.6 秒。
// 根もとは細く、中ほどで大きくふくらみ、ふちは乱れで切れる。明るさで白 → 黄 → だいだい → 赤 → 暗い赤
const NG_FLAME = [
  [255, 250, 222],
  [255, 214, 90],
  [241, 118, 49],
  [200, 64, 30],
  [120, 32, 22],
];
// 砲口から先にだけ出す(うしろへは出さない)。砲口では砲身の太さで細く噴き出し、先で大きく開いて丸まる(作者「マズルフラッシュが砲から出ていないようにみえる」)
// 激しさ P(todo 217 キ): 炎の長さと太さ、続く時間、砲口の火の玉、画面のひらめき
const ngFlashP = () => globalThis.ngFlashPow ?? 2.4; // 案 2(D574。試しのときだけ ngFlashPow で変える)
const ngBlast = (img, mx, my, age, seed, big) => {
  const P = ngFlashP();
  const DUR = 0.55 * (0.6 + 0.4 * P);
  if (age < 0 || age > DUR) return;
  const grow = ngOut(age / 0.08);
  const hold = 0.14 * (0.5 + 0.5 * P);
  const fade = age < hold ? 0 : (age - hold) / (DUR - hold);
  const L = (big ? 78 : 58) * P * grow + 10 * fade;
  const W = (big ? 22 : 16) * Math.pow(P, 0.8);
  const [dx, dy] = NG_E.dir;
  const d = img.data;
  const ex = mx + dx * L;
  const ey = my + dy * L;
  const x0 = Math.max(0, Math.floor(Math.min(mx, ex) - W - 6));
  const x1 = Math.min(480, Math.ceil(Math.max(mx, ex) + W + 6));
  const y0 = Math.max(0, Math.floor(Math.min(my, ey) - W - 6));
  const y1 = Math.min(288, Math.ceil(Math.max(my, ey) + W + 6));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const px = x - mx;
      const py = y - my;
      const a = px * dx + py * dy;
      if (a < 0 || a > L) continue;
      const b = -px * dy + py * dx;
      const t = a / Math.max(1, L);
      // 幅: 砲口で 2(砲身の太さ)→ 6 割の所まで広がり → 先で丸まる
      const prof = t < 0.6 ? Math.pow(t / 0.6, 0.75) : Math.sqrt(Math.max(0, 1 - ((t - 0.6) / 0.4) ** 2));
      const w = 2 + W * prof * grow * (1 - fade * 0.4);
      const n = ngNoise((x + seed) / 5, (y - age * 70) / 5) * 0.6 + ngNoise((x + seed) / 2.2, (y + seed) / 2.2) * 0.4;
      const e = Math.abs(b) / (w * (0.7 + 0.6 * n));
      if (e > 1) continue;
      // 砲口に近く、軸に近いほど明るい
      const I = 1.1 - e * 0.6 - t * 0.35 + (n - 0.5) * 0.45 - fade * 1.2;
      if (I < 0.06) continue;
      const c = NG_FLAME[I > 0.8 ? 0 : I > 0.6 ? 1 : I > 0.4 ? 2 : I > 0.22 ? 3 : 4];
      const k = (y * 480 + x) * 4;
      d[k] = c[0];
      d[k + 1] = c[1];
      d[k + 2] = c[2];
      d[k + 3] = 255;
    }
  }
  // 砲口の火の玉: 砲口のすぐ先で、ほんの一瞬、まわりへはじける(P が 1 より大きいときだけ)
  if (P <= 1) return;
  const fa = age / (0.22 * P);
  if (fa >= 1) return;
  const R = (big ? 9 : 6) * (P - 0.6) * ngOut(Math.min(1, age / 0.05)) * (1 + 0.4 * fa);
  const cx = mx + dx * R * 0.9;
  const cy = my + dy * R * 0.9;
  for (let y = Math.max(0, Math.floor(cy - R - 3)); y < Math.min(288, cy + R + 3); y++) {
    for (let x = Math.max(0, Math.floor(cx - R - 3)); x < Math.min(480, cx + R + 3); x++) {
      const n = ngNoise((x + seed) / 3, (y + seed) / 3);
      const e = Math.hypot(x - cx, y - cy) / (R * (0.75 + 0.5 * n));
      if (e > 1) continue;
      const I = 1.15 - e * 0.7 - fa * 1.1 + (n - 0.5) * 0.4;
      if (I < 0.1) continue;
      const c = NG_FLAME[I > 0.8 ? 0 : I > 0.6 ? 1 : I > 0.4 ? 2 : I > 0.22 ? 3 : 4];
      const k = (y * 480 + x) * 4;
      d[k] = c[0];
      d[k + 1] = c[1];
      d[k + 2] = c[2];
      d[k + 3] = 255;
    }
  }
};
// 水面の衝撃波の中心(砲口の下の水面。作者「発砲時に水面にも衝撃波の波を描けるか」)
const NG_WAVE = { x: 214, y: 214 };
// 激しい衝撃波(作者「斉射の波紋はもっと激しく」、アイオワ級の斉射の写真): 爆風で押された水面が、ふちの鋭い白い円盤になって広がる。
// 円盤の中はふちほど明るく(ディザ)、外側に暗い谷、中には泡が残る。pow で強さ
const NG_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const ngWaveHard = (img, age, pow) => {
  const D = 2.4 + 0.8 * pow;
  if (age < 0 || age > D) return;
  const d = img.data;
  const u = ngOut(Math.min(1, age / (0.7 + 0.2 * pow)));
  const rx = 18 + 190 * pow * u + 40 * age;
  const ry = rx * 0.2;
  const cx = NG_WAVE.x + 26 * pow * u; // 撃つ向き(右)へずれる
  const cy = NG_WAVE.y + 3;
  const fade = Math.max(0, 1 - age / D);
  const flash = Math.max(0, 1 - age / 0.35);
  const x0 = Math.max(0, Math.floor(cx - rx * 1.12)), x1 = Math.min(479, Math.ceil(cx + rx * 1.12));
  const y0 = Math.max(0, Math.floor(cy - ry * 1.12)), y1 = Math.min(287, Math.ceil(cy + ry * 1.12));
  const put = (k, c, a) => {
    d[k] = d[k] * (1 - a) + c[0] * a;
    d[k + 1] = d[k + 1] * (1 - a) + c[1] * a;
    d[k + 2] = d[k + 2] * (1 - a) + c[2] * a;
    d[k + 3] = Math.max(d[k + 3], 255 * a);
  };
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      // ふちを少し乱す(丸すぎないように)
      const ang = Math.atan2(dy, dx);
      const wob = 0.035 * Math.sin(ang * 7 + age * 3) + 0.025 * Math.sin(ang * 13 + 1.3);
      const e = Math.sqrt(dx * dx + dy * dy) - wob;
      const k = (y * 480 + x) * 4;
      const b = NG_BAYER[(y & 3) * 4 + (x & 3)] / 16;
      if (e <= 1) {
        if (e > 0.93) {
          // 鋭いふち
          if (ngRnd(x * 3 + y * 7 + Math.floor(age * 8)) < 0.9) put(k, [255, 255, 250], Math.min(1, 1.1 * fade + 0.2));
        } else {
          // ふちほど明るい円盤 + はじめのひらめき
          const v = Math.pow(e, 2.2) * 0.85 * fade + flash * 0.9;
          if (v > b) put(k, [255, 244, 224], Math.min(1, 0.55 + 0.45 * fade));
          // 泡
          else if (ngRnd(x * 13 + y * 31) < 0.05 * fade * pow) put(k, [255, 250, 240], 0.8 * fade);
        }
      } else if (e < 1.09) {
        // 外側の暗い谷
        if (b < 0.6) put(k, [70, 45, 70], 0.45 * fade);
      }
    }
  }
};
// しぶきの幕と、水面をはう霧: 円盤のふちから白い水が立ち上がり、撃つ向き(右)へ霧が流れる
const ngSpray = (g, age, pow, half) => {
  const D = 2.8 + 1.0 * pow;
  if (age < 0 || age > D) return;
  const u = ngOut(Math.min(1, age / (0.7 + 0.2 * pow)));
  const rx = 18 + 190 * pow * u + 40 * age;
  const ry = rx * 0.2;
  const cx = NG_WAVE.x + 26 * pow * u;
  const cy = NG_WAVE.y + 3;
  const fade = Math.max(0, 1 - age / D);
  const rise = Math.sin(Math.min(1, age / 1.4) * Math.PI);
  // しぶきの幕(ふちから立つ白いかたまり)。右ほど高い。far は艦のうしろ(奥の半分)、near は手前
  const n = Math.round(90 * pow);
  for (let i = 0; i < n; i++) {
    const a = ngRnd(i * 5 + 1) * Math.PI * 2;
    const nearSide = Math.sin(a) > 0;
    if ((half === "far") === nearSide) continue;
    const px = cx + Math.cos(a) * rx * (0.95 + 0.07 * ngRnd(i));
    const py = cy + Math.sin(a) * ry;
    if (py < 188) continue; // 向こう岸より奥には立てない
    const side = 0.5 + 0.5 * Math.cos(a);
    const h = (3 + ngRnd(i * 3 + 2) * 12) * pow * rise * (0.4 + side);
    if (h < 1) continue;
    const w = 2 + ngRnd(i * 7) * 4;
    for (let j = 0; j < h * w * 0.9; j++) {
      const yy = ngRnd(i * 31 + j) * h;
      const xx = (ngRnd(i * 17 + j * 5) - 0.5) * w * (1 + yy / h);
      g.globalAlpha = fade * (1 - (yy / h) * 0.7);
      g.fillStyle = yy < h * 0.5 ? "#fffaf0" : "#ffe8d8";
      g.fillRect(Math.round(px + xx), Math.round(py - yy), 1, 1);
    }
  }
  if (half === "far") return (g.globalAlpha = 1);
  // 水面をはう霧(右へ流れる、ふちを点で崩したかたまり)
  const m = Math.round(26 * pow);
  for (let i = 0; i < m; i++) {
    const t0 = ngRnd(i * 11) * 0.5;
    const a = age - t0;
    if (a < 0) continue;
    const sp = (60 + ngRnd(i * 7) * 120) * pow;
    const px = NG_WAVE.x - 20 + ngRnd(i * 2) * 50 + sp * ngOut(Math.min(1, a / 2.5)) * 1.3;
    const py = NG_WAVE.y - 2 + (ngRnd(i * 4) - 0.5) * 16 - a * 3;
    const r = (6 + ngRnd(i * 6) * 10) * (0.6 + a * 0.6) * pow;
    const al = 0.55 * Math.max(0, 1 - a / (D - t0));
    if (al <= 0.01) continue;
    g.fillStyle = "#fff2e6";
    for (let j = 0; j < r * r * 0.9; j++) {
      const q = ngRnd(i * 97 + j) * Math.PI * 2;
      const rr = Math.sqrt(ngRnd(i * 53 + j * 3)) * r;
      g.globalAlpha = al * (1 - rr / r * 0.6);
      g.fillRect(Math.round(px + Math.cos(q) * rr * 1.6), Math.round(py + Math.sin(q) * rr * 0.55), 2, 1);
    }
  }
  g.globalAlpha = 1;
};
// 電磁パルス(作者「成層圏で爆発が広がった時に、電磁パルスを表現するために、画面にノイズを載せてほしい」):
// 赤い輪が広がるころから強くなり、数秒で消える。砂のノイズ、横にずれる帯、走査線、画面のはね
const ngEmpPower = (t2) => {
  let k = 0;
  for (const t0 of [NG_E.burst1, NG_E.burst2]) {
    const a = t2 - t0;
    if (a > 0.3) k = Math.max(k, a < 1.0 ? (a - 0.3) / 0.7 : Math.max(0, 1 - (a - 1.0) / 3.5));
  }
  return k;
};
const ngEmp = (ctx, src, X, Y, k) => {
  if (k <= 0.01) return ctx.drawImage(src, X, Y);
  const jump = Math.random() < 0.15 * k ? Math.round((Math.random() - 0.5) * 8 * k) : 0;
  ctx.drawImage(src, X, Y + jump);
  // 横にずれる帯
  const n = Math.round(2 + 9 * k);
  for (let i = 0; i < n; i++) {
    const y = Math.floor(Math.random() * 288);
    const h = 1 + Math.floor(Math.random() * 7 * k);
    const dx = Math.round((Math.random() - 0.5) * 50 * k);
    ctx.drawImage(src, 0, y, 480, h, X + dx, Y + y + jump, 480, h);
  }
  // 走査線
  ctx.fillStyle = `rgba(0,0,0,${0.22 * k})`;
  for (let y = 0; y < 288; y += 2) ctx.fillRect(X, Y + y, 480, 1);
  // 砂のノイズ
  const m = Math.round(2600 * k);
  for (let i = 0; i < m; i++) {
    const v = Math.random();
    ctx.fillStyle = v < 0.45 ? "#ffffff" : v < 0.8 ? "#9a9aa8" : v < 0.9 ? "#ff6070" : "#60e0ff";
    ctx.fillRect(X + Math.floor(Math.random() * 480), Y + Math.floor(Math.random() * 288), 1 + (Math.random() < 0.2 ? 1 : 0), 1);
  }
  // ときどき、一行まるごと白く光る
  if (Math.random() < 0.3 * k) {
    ctx.fillStyle = `rgba(255,255,255,${0.5 * k})`;
    ctx.fillRect(X, Y + Math.floor(Math.random() * 288), 480, 1 + Math.floor(Math.random() * 3));
  }
  // ホワイトノイズの砂あらし(作者「もっとホワイトノイズで画像が見えなくなってもいい」todo 221)。強さ EP、いちばん強い所では絵が見えなくなる
  const EP = ngEmpP();
  if (EP <= 1) return;
  const a = Math.min(1, k * (EP - 1) * 0.6);
  if (a <= 0.02) return;
  const nc = ngEmpNoise.c || (ngEmpNoise.c = document.createElement("canvas"));
  nc.width = 480;
  nc.height = 288;
  const ng = nc.getContext("2d");
  const im = ng.createImageData(480, 288);
  const d = im.data;
  for (let y = 0; y < 288; y++) {
    const row = Math.random() < 0.06 ? 60 : 0; // 明るい横すじ
    for (let x = 0; x < 480; x++) {
      const v = Math.min(255, Math.random() * 235 + row);
      const k4 = (y * 480 + x) * 4;
      d[k4] = d[k4 + 1] = d[k4 + 2] = v;
      d[k4 + 3] = 255;
    }
  }
  ng.putImageData(im, 0, 0);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.drawImage(nc, X, Y);
  ctx.restore();
};
const ngEmpNoise = { c: null };
const ngEmpP = () => globalThis.ngEmpPow ?? 2.8; // 案 2(D578)。試しのときだけ ngEmpPow で変える
// 高い空の爆発(成層圏の核爆発ほど 作者): 白い玉 → 火の玉 → 赤い殻が空いっぱいに広がり、ゆっくり消える
const ngBurst = (g, x, y, age) => {
  if (age < 0) return;
  // 赤い殻(オーロラのような赤)
  if (age > 0.3 && age < 10) {
    const u = ngOut((age - 0.3) / 5);
    const r = 40 + 150 * u;
    const a = Math.max(0, 1 - (age - 0.3) / 9.7);
    ngDither(g, x, y, r, "#ff4a5a", 0.3 * a + 0.1);
    ngDither(g, x, y, r * 0.85, "#ff7a50", 0.5 * a);
    g.globalAlpha = a;
    g.fillStyle = "#ff8a90";
    const R = Math.round(r);
    for (let i = 0; i < 360; i += 1.5) {
      const t = (i * Math.PI) / 180;
      g.fillRect(Math.round(x + Math.cos(t) * R), Math.round(y + Math.sin(t) * R * 0.85), 2, 1);
    }
    g.globalAlpha = 1;
  }
  const f = ngOut(age / 0.6);
  const fade = age < 1.5 ? 1 : Math.max(0, 1 - (age - 1.5) / 3.5);
  if (fade <= 0) return;
  g.globalAlpha = fade;
  const R = 10 + 42 * f;
  const c1 = age < 2 ? "#ff8c32" : "#c83c32";
  const c2 = age < 1.6 ? "#ffc864" : "#ff6a32";
  const c3 = age < 1.2 ? "#ffeeb0" : "#ff9a46";
  ngDither(g, x, y, R * 1.3, "#ffb060", 0.3);
  ngDither(g, x, y, R * 1.12, c1, 0.5);
  ngDisc(g, x, y, R, c1);
  ngDither(g, x, y, R * 0.92, c2, 0.5);
  ngDisc(g, x, y, R * 0.78, c2);
  ngDither(g, x, y, R * 0.7, c3, 0.5);
  ngDisc(g, x, y, R * 0.56, c3);
  if (age < 1.4) ngDisc(g, x, y, R * 0.42 * (1 - age / 1.4) + 1, "#ffffff");
  g.globalAlpha = 1;
};
const ngEFrame = (t) => {
  const { n1, n2 } = NG_E;
  if (t < NG_E.move0) return 0;
  if (t < NG_E.move0 + NG_E.move) return Math.min(n1 - 1, Math.floor(((t - NG_E.move0) / NG_E.move) * n1));
  if (t < NG_E.swap0) return n1 - 1;
  if (t < NG_E.swap0 + NG_E.swap) return n1 + Math.min(n2 - 1, Math.floor(((t - NG_E.swap0) / NG_E.swap) * n2));
  return n1 + n2 - 1;
};
const NG_SEIHA = {
  tile: T,
  bg: "#000",
  hidePlayer: true,
  bgm: "silence", // 斉射のあいだは音楽を止める(轟音だけ)
  map: kGrid(15, 9, () => false),
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 4 * T, facing: "south" } },
  objects: [],
  triggers: [],
  debug: () => ngE,
  onEnter() {
    ngE.t = 0;
    ngE.done = {};
  },
  onA: () => true,
  onB: () => true,
  input(api, dt) {
    ngE.t += dt;
    api.place(7 * T, 4 * T);
    const t = ngE.t;
    const once = (k, at, fn) => {
      if (!ngE.done[k] && t >= at) {
        ngE.done[k] = true;
        fn();
      }
    };
    once("move", NG_E.move0, () => {
      api.sfx("whir");
      api.sfx("flood");
    });
    once("move2", NG_E.move0 + 2.5, () => api.sfx("whir"));
    once("move3", NG_E.move0 + 5.0, () => api.sfx("whir"));
    once("bell", NG_E.bell, () => api.sfx("denrei"));
    once("fireA", NG_E.fireA, () => (api.sfx("salvo"), api.shake(1.2, 4)));
    once("swap", NG_E.swap0, () => api.sfx("whir"));
    once("fireB", NG_E.fireB, () => (api.sfx("salvo"), api.shake(1.2, 4)));
    const c2 = NG_E.cut;
    once("b1", c2 + NG_E.burst1 + NG_E.boom, () => (api.sfx("nuke"), api.shake(2.5, 2)));
    once("b2", c2 + NG_E.burst2 + NG_E.boom, () => (api.sfx("nuke"), api.shake(2.5, 2)));
    once("end", c2 + NG_E.end, () => {
      api.setFlag("fired");
      ngDrill(api);
      api.warp("kansen", "door"); // 斉射のあとは甲板へ。クルーに帽子を返す(D571)
      api.later(1200, () => api.observe()); // 見届け(斉射のあと D573)
    });
  },
  drawGround(ctx, ox, oy, img, api) {
    const t = ngE.t;
    if (!ngE.off) {
      ngE.off = document.createElement("canvas");
      ngE.off.width = 480;
      ngE.off.height = 288;
    }
    const g = ngE.off.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, 480, 288);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const X = Math.round(ox);
    const Y = Math.round(oy);
    if (t < NG_E.cut) {
      // ---- カット 1 ----
      const bg = api.image("bg_seiha");
      if (bg) ctx.drawImage(bg, X, Y);
      // 黒煙(A は左の砲、B は右の砲。どちらも 4 門ずつ)と、その上に炎
      NG_E.muz.forEach(([mx, my], i) => {
        ngSmoke(g, mx, my, t - NG_E.fireA - i * 0.05, i * 17);
        ngSmoke(g, mx + 3, my + 2, t - NG_E.fireB - i * 0.05, i * 17 + 200);
      });
      const blasting = [NG_E.fireA, NG_E.fireB].some((tf) => t >= tf && t < tf + 0.8 + 0.4 * ngFlashP());
      if (blasting) {
        const img = g.getImageData(0, 0, 480, 288);
        NG_E.muz.forEach(([mx, my], i) => {
          // 前の 2 砲塔(0、1)は大きく、艦橋のうしろの 2 砲塔(2、3)は遠いので小さく
          ngBlast(img, mx, my, t - NG_E.fireA - i * 0.05, i * 37, i < 2);
          ngBlast(img, mx, my, t - NG_E.fireB - i * 0.05, i * 37 + 500, i < 2);
        });
        g.putImageData(img, 0, 0);
      }
      // 煙の映り(水面で上下を返す)
      ctx.save();
      ctx.beginPath();
      ctx.rect(X, Y + NG_E.water + 1, 480, 288 - NG_E.water - 1);
      ctx.clip();
      ctx.globalAlpha = 0.35;
      ctx.translate(X, Y + NG_E.water * 2 + 1);
      ctx.scale(1, -1);
      ctx.drawImage(ngE.off, 0, 0);
      ctx.restore();
      // 水面の衝撃波(作者「斉射の波紋はもっと激しく」D569): 円盤としぶきの奥の半分は艦のうしろ、手前は艦の映りの上
      const pow = 1.6; // 強さ(作者「２でいい。激しさがつたわるから。」)
      const wg = ngE.wave || (ngE.wave = document.createElement("canvas"));
      wg.width = 480;
      wg.height = 288;
      const w2 = wg.getContext("2d");
      const wi = w2.getImageData(0, 0, 480, 288);
      ngWaveHard(wi, t - NG_E.fireA, pow);
      ngWaveHard(wi, t - NG_E.fireB, pow);
      w2.putImageData(wi, 0, 0);
      const sg = ngE.spray || (ngE.spray = document.createElement("canvas"));
      const s2 = sg.getContext("2d");
      const spray = (half) => {
        sg.width = 480;
        sg.height = 288;
        ngSpray(s2, t - NG_E.fireA, pow, half);
        ngSpray(s2, t - NG_E.fireB, pow, half);
        ctx.drawImage(sg, X, Y);
      };
      const wave = (y0, h) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(X, Y + y0, 480, h);
        ctx.clip();
        ctx.drawImage(wg, X, Y);
        ctx.restore();
      };
      wave(182, 25);
      spray("far");
      const sh = api.image("ng_e_ship");
      if (sh) {
        const f = ngEFrame(t);
        const c = f % NG_E.cols;
        const r = Math.floor(f / NG_E.cols);
        ctx.drawImage(sh, c * NG_E.fw, r * 288, NG_E.fw, 288, X + NG_E.x0, Y, NG_E.fw, 288);
      }
      wave(207, 81);
      spray("near"); // 手前のしぶきと霧は水面より上にも立つ
      ctx.drawImage(ngE.off, X, Y);
      // 撃った瞬間、夕日の色で画面が明るむ
      const FP = ngFlashP();
      for (const tf of [NG_E.fireA, NG_E.fireB]) {
        const u = (t - tf) / (0.5 * (0.6 + 0.4 * FP));
        if (u >= 0 && u < 1) {
          ctx.fillStyle = `rgba(255,214,150,${Math.min(0.8, 0.5 * FP) * (1 - u)})`;
          ctx.fillRect(X, Y, 480, 288);
        }
        // 激しいときは、撃った最初の一瞬だけ白くひらめく
        const w = (t - tf) / 0.09;
        if (FP > 1 && w >= 0 && w < 1) {
          ctx.fillStyle = `rgba(255,250,235,${Math.min(0.85, 0.6 * (FP - 1)) * (1 - w)})`;
          ctx.fillRect(X, Y, 480, 288);
        }
      }
    } else {
      // ---- カット 2: 夕焼け空を見上げる ----
      const t2 = t - NG_E.cut;
      // 裏の画面に描いてから、EMP のノイズをのせて映す
      if (!ngE.c2) {
        ngE.c2 = document.createElement("canvas");
        ngE.c2.width = 480;
        ngE.c2.height = 288;
      }
      const outer = ctx;
      const OX = X;
      const OY = Y;
      {
      const ctx = ngE.c2.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      const X = 0;
      const Y = 0;
      const sky = api.image("bg_sora");
      if (sky) ctx.drawImage(sky, X, Y);
      NG_BURST.forEach((set, s) => {
        const t0 = s === 0 ? NG_E.burst1 : NG_E.burst2;
        set.forEach(([bx, by], i) => ngBurst(g, bx, by, t2 - t0 - i * 0.18));
      });
      // 空が赤くそまる
      let tint = 0;
      for (const t0 of [NG_E.burst1, NG_E.burst2]) {
        const a = t2 - t0;
        if (a >= 0) tint = Math.max(tint, 0.3 * Math.max(0, 1 - a / 4));
      }
      if (tint > 0) {
        ctx.fillStyle = `rgba(255,110,70,${tint})`;
        ctx.fillRect(X, Y, 480, 288);
      }
      ctx.drawImage(ngE.off, X, Y);
      // 爆発の光(空いっぱい)
      for (const t0 of [NG_E.burst1, NG_E.burst2]) {
        for (let i = 0; i < 4; i++) {
          const u = (t2 - t0 - i * 0.18) / 0.25;
          if (u >= 0 && u < 1) {
            ctx.fillStyle = `rgba(255,255,240,${0.6 * (1 - u)})`;
            ctx.fillRect(X, Y, 480, 288);
          }
        }
      }
      // 終わりは暗くなる
      const e = (t2 - (NG_E.end - 1.5)) / 1.5;
      if (e > 0) {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, e)})`;
        ctx.fillRect(X, Y, 480, 288);
      }
      }
      ngEmp(outer, ngE.c2, OX, OY, ngEmpPower(t2));
    }

    // 切りかえの前後は暗くつなぐ
    const k = 1 - Math.abs(t - NG_E.cut) / 0.4;
    if (k > 0) {
      ctx.fillStyle = `rgba(0,0,0,${k})`;
      ctx.fillRect(X, Y, 480, 288);
    }
    ctx.restore();
  },
};

// ======== A 湖畔の通り、B 湖の上、C 甲板と、帽子と絵葉書(D571)========
// 流れ: A 湖畔に来る → 桟橋のスワンボートで B 湖の上へ(湖のまん中で遠景の一枚絵)→ C 甲板で地上ぼぎクルーから水兵帽を受け取り、かぶる
//   → D 砲塔(こめる、席)→ E 斉射 → C 甲板でクルーに帽子を返す → B を戻る → A の土産物屋で絵葉書を買って終わり
// 旗: hat(かぶっている)、fired(撃った)、hatBack(返した)、bought(買った)。世界に入るたびに消す(毎回はじめから)
// 背景はまだ半分を 2 倍(D563。原寸で頼み直すときは 1 枚 25 回、そのつど了承)
const NG_CARD = "絵葉書";
const ngHat = { on: false };
const ngHatSet = (api, on) => {
  api.setFlag("hat", on);
  ngHat.on = on;
};
const ngKiImg = () => (ngHat.on ? "ki_hat" : "ki");
const ngBg = (key) => (ctx, ox, oy, img, api) => {
  const bg = api.image(key);
  if (bg) ctx.drawImage(bg, Math.round(ox), Math.round(oy));
};

// ---- A 湖畔の通り(50 × 18 マス、北を向いて見る D545)。西から来る。上は店の並び、下は湖。桟橋は東のはし ----
const NG_A_WALK = (c, r) => (r >= 11 && r <= 14) || (r >= 15 && c >= 45 && c <= 46);
const NG_KOHAN = {
  tile: T,
  bg: "#4a6a96",
  map: kGrid(50, 18, (c, r) => !NG_A_WALK(c, r)),
  legend: K_LEGEND,
  drawGround: ngBg("bg_kohan"),
  spawns: {
    start: { x: 1.2 * T, y: 12.6 * T, facing: "east" },
    pier: { x: 45.9 * T, y: 15.4 * T, facing: "north" }, // 帰りに、スワンボートから桟橋へ上がった所
    mise: { x: 20.5 * T, y: 11.7 * T, facing: "south" }, // 土産物屋から出てきた所
  },
  objects: [
    // 桟橋のわきのスワンボート(背景に描いてある)。調べると乗る
    {
      id: "swan",
      x: 44.3 * T,
      y: 17.0 * T,
      w: 1,
      h: 1,
      headY: 30,
      range: 1.7 * T,
      draw() {},
      // 帽子を返したあとは、もう乗らない(土産物屋へ)。ただし甲板の『十二月八日』を拾い忘れていたら、取りに戻れる(todo 229)
      canInteract: (api) => !api.flag("hatBack") || !api.flag("dazai"),
      interact(api) {
        ngRide.dir = "go";
        api.warp("kojo", "ride");
      },
    },
    // 看板建築の土産物屋(緑)の店先。はじめから、店先のどこからでも調べると店に入る(D573、todo 219。絵葉書は店の中で、店番のマトリョーシカから買う)
    {
      id: "mise",
      x: 20.5 * T,
      y: 11.0 * T,
      w: 1,
      h: 1,
      headY: 40,
      range: 3.0 * T,
      draw() {},
      interact: (api) => api.warp("mise", "door"),
    },
  ],
  triggers: [{ id: "leave", x: -T, y: 10 * T, w: 1.6 * T, h: 6 * T, run: (api) => api.exit() }],
};

// ---- B 湖の上(30 × 16 マス)。長門は岸に着いていない(D573)。行き: 何もない水面を長く進み(とちゅうで遠景の一枚絵 D549、D551)、
// 長門の舷に着く → 縄梯子をのぼって C へ。帰り: 縄梯子を下りてボートへ → 水面 → A の桟橋。こぐのは自動。きーはボートに重ねない
const NG_WATER = [70, 112, 156];
const NG_RIDE = { open: 15.0, near: 5.0, climb: 1.6, from: [130, -40], foot: [802, 280], ladder: [836, 280], top: [836, 334] }; // 縄梯子は艦橋の右、係船柱の右(C とそろえる todo 218)
const ngRide = { dir: "go", phase: "open", t: 0, shown: false, done: false };
const ngEase2 = (u) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
// 近くの場面でのボートの位置(行きは左上の沖から舷へ、帰りはその逆)
const ngBoatNear = () => {
  const u = ngEase2(Math.min(1, ngRide.t / NG_RIDE.near));
  const [a, b] = ngRide.dir === "go" ? [NG_RIDE.from, NG_RIDE.foot] : [NG_RIDE.foot, NG_RIDE.from];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
};
// 縄梯子をのぼる(下りる)きーの位置
const ngClimbPos = () => {
  const u = Math.min(1, ngRide.t / NG_RIDE.climb);
  const [a, b] = ngRide.dir === "go" ? [NG_RIDE.ladder, NG_RIDE.top] : [NG_RIDE.top, NG_RIDE.ladder];
  return [a[0], a[1] + (b[1] - a[1]) * u];
};
const ngSwanDraw = (ctx, api, bx, by, flip, moving) => {
  const sw = api.image("ng_swan");
  if (!sw) return;
  const t = ngNow();
  by = Math.round(by + Math.sin(t * 2.6) * 1);
  if (moving) {
    // 水を分ける細い波
    ctx.fillStyle = "rgba(220, 235, 250, 0.7)";
    for (let i = 1; i <= 3; i++) {
      const k = (t * 2 + i / 3) % 1;
      ctx.fillRect(bx + (flip ? 1 : -1) * (14 + k * 16), by + 14 + i, Math.round(6 * (1 - k)) + 1, 1);
    }
  }
  ctx.save();
  ctx.translate(bx, by);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sw, -28, -30); // きーは重ねない(todo 217 イ)
  ctx.restore();
};
const NG_KOJO = {
  tile: T,
  bg: "#466e9c",
  hidePlayer: true,
  map: kGrid(30, 16, () => false),
  legend: K_LEGEND,
  spawns: { ride: { x: 240, y: 150, facing: "east" } },
  objects: [],
  triggers: [],
  debug: () => ngRide,
  onEnter() {
    ngRide.t = 0;
    ngRide.shown = false;
    ngRide.done = false;
    ngRide.phase = ngRide.dir === "go" ? "open" : "climb";
  },
  onA: () => true,
  onB: () => true,
  input(api, dt) {
    ngRide.t += dt;
    const R = NG_RIDE;
    const next = (phase) => ((ngRide.phase = phase), (ngRide.t = 0));
    if (ngRide.phase === "open") {
      api.place(15 * T, 8 * T);
      // 行きは、航行の終わりごろ(15 秒のうち 13 秒。D582)に遠景の一枚絵。閉じるまでボートは止まって待つ(一枚絵のあいだ input は来ない)
      if (ngRide.dir === "go" && ngRide.t >= R.open - 2 && !ngRide.shown) {
        ngRide.shown = true;
        api.show("ng_far", null, { full: true });
      }
      if (ngRide.t >= R.open) {
        if (ngRide.dir === "go") next("near");
        else if (!ngRide.done) (ngRide.done = true), api.warp("kohan", "pier");
      }
      return;
    }
    if (ngRide.phase === "near") {
      const [x, y] = ngBoatNear();
      api.place(x, Math.max(150, y + 20)); // カメラはボートにつく
      if (ngRide.t >= R.near) next(ngRide.dir === "go" ? "climb" : "open");
      return;
    }
    // climb: 縄梯子をのぼる / 下りる
    const [x, y] = ngClimbPos();
    api.place(x, y);
    if (ngRide.t >= R.climb && !ngRide.done) {
      if (ngRide.dir === "go") {
        ngRide.done = true;
        api.later(300, () => api.warp("kansen", "ladder"));
      } else next("near");
    }
  },
  drawGround(ctx, ox, oy, img, api) {
    const t = ngNow();
    if (ngRide.phase === "open") {
      // 何もない水面(画面いっぱい)。水面の短い線が、うしろ(左上)へ流れて、進んでいるのがわかる
      // カメラはマップのまん中(15, 8 マス)に置いてある。画面はそのまわり 480 × 288
      const W = 480;
      const H = 300;
      const L = Math.round(ox + 15 * T - W / 2);
      const Tp = Math.round(oy + 8 * T - H / 2);
      ctx.save();
      ctx.translate(L, Tp);
      ctx.fillStyle = `rgb(${NG_WATER.join(",")})`;
      ctx.fillRect(-20, -20, W + 40, H + 40);
      ctx.fillStyle = "rgb(112, 146, 188)";
      const sp = ngRide.dir === "go" ? 1 : -1;
      for (let i = 0; i < 70; i++) {
        const hx = (((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1;
        const hy = (((Math.sin(i * 78.233) * 24634.6345) % 1) + 1) % 1;
        const x = (((hx * (W + 40) - ngRide.t * 46 * sp) % (W + 40)) + W + 40) % (W + 40) - 20;
        const y = (((hy * (H + 20) - ngRide.t * 22 * sp) % (H + 20)) + H + 20) % (H + 20) - 10;
        ctx.fillRect(Math.round(x), Math.round(y), 4 + (i % 3) * 2, 1);
      }
      ngSwanDraw(ctx, api, Math.round(W / 2), Math.round(H / 2), ngRide.dir !== "go", true);
      ctx.restore();
      return;
    }
    ngBg("bg_kojo2")(ctx, ox, oy, img, api);
    // 縄梯子(手すりにかけた鉤から、水まで)
    const lad = api.image("ng_ladder");
    if (lad) ctx.drawImage(lad, Math.round(ox + 828), Math.round(oy + 279));
    if (ngRide.phase === "near") {
      const [x, y] = ngBoatNear();
      ngSwanDraw(ctx, api, Math.round(ox + x), Math.round(oy + y), ngRide.dir !== "go", ngRide.t < NG_RIDE.near);
      // ボートは艦橋のうしろを通る(艦橋だけを切り抜いた絵を上に重ねる。D582、todo 226)
      const br = api.image("ng_kojo2_bridge");
      if (br) ctx.drawImage(br, Math.round(ox + 340), Math.round(oy));
      return;
    }
    // のぼっているあいだ、ボートは梯子のわきで待つ
    ngSwanDraw(ctx, api, Math.round(ox + NG_RIDE.foot[0]), Math.round(oy + NG_RIDE.foot[1]), false, false);
    const ki = api.image(ngKiImg());
    if (ki) {
      const [x, y] = ngClimbPos();
      const bob = Math.floor(t * 8) % 2;
      ctx.drawImage(ki, bob * 64, 0, 64, 64, Math.round(ox + x - 32), Math.round(oy + y - 47), 64, 64); // こちら向き(舷に向かう)
    }
  },
};

// ---- 土産物屋の店内(15 × 9 マス、北を向いて見る)。背景は Pro に 1 回(D574、docs/record/2026-11-01/nagato_shop/)。
// 手前(南)が通りへの戸口。奥の帳場に店番のマトリョーシカ(形而の絵)。帽子を返したあとに、長門と富士山の絵葉書を買って終わり(D571)
const NG_MISE_WALK = (c, r) => (r >= 5 && r <= 6 && c >= 6 && c <= 10) || (r >= 7 && r <= 8 && c >= 4 && c <= 10);
const NG_MATRYO = { x: 262, y: 104 };
const NG_MISE = {
  tile: T,
  bg: "#2a1c16",
  map: kGrid(15, 9, (c, r) => !NG_MISE_WALK(c, r)),
  legend: K_LEGEND,
  drawGround: ngBg("bg_mise"),
  spawns: { door: { x: 7.5 * T, y: 8.2 * T, facing: "north" } },
  objects: [
    {
      id: "matryo",
      x: NG_MATRYO.x,
      y: NG_MATRYO.y,
      w: 1,
      h: 1,
      headY: 40,
      range: 2.4 * T,
      draw(ctx, sx, sy, t, api) {
        const im = api.image("matryo");
        if (!im) return;
        const rock = Math.round(Math.sin(t * 1.6) * 0.6); // 店番は、少しゆれている
        ctx.drawImage(im, Math.round(sx - im.width / 2 + rock), Math.round(sy - im.height));
      },
      interact(api) {
        if (!api.flag("hatBack") || api.flag("bought")) return api.bubble("matryo", "……", 1200);
        api.setFlag("bought");
        api.sfx("pop");
        api.hold("ic_ehagaki", 1.8, () => {
          api.sfx("item");
          if (!api.hasItem(NG_CARD)) api.giveItem(NG_CARD);
          api.clear();
        });
      },
    },
  ],
  triggers: [{ id: "out", x: 3 * T, y: 8.75 * T, w: 9 * T, h: T, run: (api) => api.warp("kohan", "mise") }],
};

// ---- C 甲板(32 × 16 マス)。西のはしが舷梯(B から上がってくる)。2 番砲塔のうしろ(西)の戸から D へ ----
// 戸の前に、砲員の地上ぼぎクルー(D538。ボマーのクルーと同じ形)。はじめは水兵帽をくれ、斉射のあとは返す
// 甲板を広く歩ける(D573): 北の通り(縄梯子から)、艦橋と 2 番砲塔のあいだ、砲塔の南、東の通り。行けない所はロープとクルーでふさぐ
const NG_C_WALK = (c, r) =>
  (r === 3 && c >= 14 && c <= 21) ||
  (c === 14 && r >= 3 && r <= 12) ||
  (c === 15 && r >= 9 && r <= 11) ||
  (r >= 12 && r <= 14 && c >= 9 && c <= 26) ||
  (r === 15 && c >= 1 && c <= 26) ||
  (r >= 13 && r <= 14 && c >= 1 && c <= 2) ||
  (c >= 24 && c <= 26 && r >= 8 && r <= 11);
// ロープの柵: 真鍮の支柱(ng_post)のあいだに、たるんだロープ。y は支柱の足もと(きーと前後を比べる)
const ngRopeLine = (id, pts, solid) => {
  const xs = pts.map((p) => p[0]);
  const y = pts[0][1];
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  return {
    id,
    x: (x0 + x1) / 2,
    y,
    w: 1,
    h: 1,
    solid: solid ? { w: x1 - x0 + 8, h: 8, dy: 2 } : undefined,
    draw(ctx, sx, sy, t, api) {
      const ox = sx - (x0 + x1) / 2;
      const oy = sy - y;
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[i + 1];
        for (const [col, w] of [["#281c16", 3], ["#c4a068", 1]]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(ox + ax, oy + ay - 14);
          ctx.quadraticCurveTo(ox + (ax + bx) / 2, oy + (ay + by) / 2 - 6, ox + bx, oy + by - 14);
          ctx.stroke();
        }
      }
      const post = api.image("ng_post");
      if (post) for (const [px, py] of pts) ctx.drawImage(post, Math.round(ox + px - 3), Math.round(oy + py - 18));
    },
  };
};
// 道をふさぐクルー(調べると「……」)
const ngCrewBlock = (id, img, x, y) => ({
  id,
  x,
  y,
  w: 1,
  h: 1,
  headY: 42,
  range: 1.3 * T,
  solid: { w: 0.7 * T, h: 0.4 * T, dy: -0.2 * T },
  draw(ctx, sx, sy, t, api) {
    const im = api.image(img);
    if (!im) return;
    const hop = ((t + x / 100) % 2.1) < 0.12 ? 2 : 0;
    ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height - hop));
  },
  interact: (api) => api.bubble(id, "……", 1200),
});
const NG_CREW = { x: 17.2 * T, y: 13.4 * T };
const NG_KANSEN = {
  tile: T,
  bg: "#c79a68",
  map: kGrid(32, 16, (c, r) => !NG_C_WALK(c, r)),
  legend: K_LEGEND,
  drawGround(ctx, ox, oy, img, api) {
    ngBg("bg_kansen")(ctx, ox, oy, img, api);
    const lad = api.image("ng_ladder"); // 北の手すりの縄梯子(B と同じ絵)
    if (lad) ctx.drawImage(lad, Math.round(ox + 548), Math.round(oy + 44));
  },
  spawns: {
    ladder: { x: 556, y: 3.5 * T, facing: "south" }, // 縄梯子をのぼってきた所
    door: { x: 15.0 * T, y: 12.5 * T, facing: "south" }, // 斉射のあと、戸から出てきた所
  },
  objects: [
    {
      id: "door",
      x: 15.5 * T,
      y: 9.6 * T,
      w: 1,
      h: 1,
      headY: 36,
      range: 1.2 * T,
      draw() {},
      interact(api) {
        if (!ngHat.on) return api.bubble("crew", "……", 1200); // 帽子をかぶってから
        api.warp("hotou", "start");
      },
    },
    {
      id: "crew",
      x: NG_CREW.x,
      y: NG_CREW.y,
      w: 1,
      h: 1,
      headY: 42,
      range: 1.3 * T,
      solid: { w: 0.7 * T, h: 0.4 * T, dy: -0.2 * T },
      draw(ctx, sx, sy, t, api) {
        const im = api.image("crew_hawk");
        if (!im) return;
        const hop = (t % 1.6) < 0.12 ? 2 : 0;
        ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height - hop));
        // まだ渡していない帽子を手に持っている
        const hat = api.image("ng_hat");
        if (hat && !api.flag("hat") && !api.flag("fired")) ctx.drawImage(hat, Math.round(sx - 14 - hat.width / 2), Math.round(sy - 22 + Math.sin(t * 3)));
      },
      interact(api) {
        if (!api.flag("hat") && !api.flag("fired")) {
          // 水兵帽を受け取って、かぶる
          api.hold("ng_hat", 1.6, () => {
            api.sfx("item");
            ngHatSet(api, true);
          });
          return;
        }
        if (api.flag("hat") && api.flag("fired")) {
          // 斉射のあと、帽子を返す
          ngHatSet(api, false);
          api.setFlag("hatBack");
          api.bubble("crew", "……", 1400);
          return;
        }
        api.bubble("crew", "……", 1200);
      },
    },
  ],
  triggers: [],
};
NG_KANSEN.objects.push(
  // 縄梯子: 調べると下りて、ボートで帰る
  {
    id: "ladder",
    x: 556,
    y: 3.3 * T,
    w: 1,
    h: 1,
    headY: 30,
    range: 1.2 * T,
    draw() {},
    interact(api) {
      ngRide.dir = "back";
      api.warp("kojo", "ride");
    },
  },
  // 係船柱(背景の絵)。上を歩かない
  { id: "bitt", x: 481, y: 100, w: 1, h: 1, solid: { w: 40, h: 12, dy: -2 }, draw() {} },
  ngRopeLine("ropeE", [[768, 250], [812, 250], [858, 250]], false), // 東の通りの奥(砲身の下へ行かない)
  ngRopeLine("ropeS", [16, 106, 196, 286, 376, 466, 556, 646, 736, 826].map((x) => [x, 508]), true), // 南のはし
  ngCrewBlock("crewN", "crew_wagtail", 22.4 * T, 3.7 * T), // 北の通りの奥
  ngCrewBlock("crewW", "crew_rooster", 0.7 * T, 14.4 * T), // 西のはし(艦尾)
);
