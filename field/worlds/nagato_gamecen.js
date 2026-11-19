// 断片: 本栖湖の長門。湖畔の通りの、土産物屋と旅館のあいだの切妻の家(戸が開いている)はゲームセンター(todo 335、D767〜D776)
// 中はだれもいない。台はだれもいない画面にデモを流し続ける。テーブル台の「ぼぎ雀」(麻雀風、麻雀そのものではない D768、D770)で遊べる。
// 奥の裏口は裏庭に出る(D772)。裏庭の中身は監督があとで考えるので、いまは開かない戸。
// 絵は docs/record/2026-11-19/gamecen/(Pro 3 案、75 回分。案 1 を使う D776)。ぼぎ雀の画面は docs/record/2026-11-19/bogijan/(D774)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kGrid、NG_KOHAN、ngRyoCut など)をそのまま使う
"use strict";

// ---- 湖畔の通り: 開いた戸の前で調べると中へ ----
NG_KOHAN.spawns.gamecen = { x: 855, y: 11.7 * T, facing: "south" }; // ゲームセンターから出てきた所
NG_KOHAN.objects.push({
  id: "gamecen",
  x: 855,
  y: 11.0 * T,
  w: 1,
  h: 1,
  headY: 40,
  range: 1.4 * T,
  draw() {},
  interact: (api) => api.warp("gamecen", "door"),
});

// ---- ゲームセンターの中(15 × 10 マス、北を向いて見る。手前の南がガラス戸)----
// 奥の壁ぞいの台(r0〜3)、西の壁の台(c0〜1)、東の長いす(c14)と自販機(c13〜14 の r7〜9)は歩かない。まん中のテーブル台といすは物の当たりで
const NG_GC_WALK = (c, r) => r >= 4 && r <= 9 && c >= 2 && c <= 13 && !(c >= 13 && r >= 7);
// 台の画面(デモが流れている)。[x, y, w, h]。絵の画面に合わせた
const NG_GC_SCREENS = [
  [21, 74, 30, 21], [69, 74, 30, 21], [117, 74, 30, 21], [165, 74, 30, 21], [213, 74, 30, 21], // 奥の 5 台
  [31, 134, 6, 16], [24, 170, 6, 17], [20, 206, 8, 18], // 西の壁の 3 台(横から見える)
];
// デモの光: 走査線の明るい帯が流れ、ときどき色がまたたく。台ごとに速さをずらす
function ngGcDemo(ctx, ox, oy, t) {
  NG_GC_SCREENS.forEach(([x, y, w, h], i) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.round(ox + x), Math.round(oy + y), w, h);
    ctx.clip();
    const sp = 9 + ((i * 7) % 5) * 3;
    const by = y + ((t * sp + i * 11) % (h + 8)) - 4;
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fillRect(Math.round(ox + x), Math.round(oy + by), w, 2);
    const k = Math.floor(t * 2 + i * 1.7);
    if ((k * 7 + i) % 5 === 0) {
      ctx.fillStyle = ["rgba(255, 90, 90, 0.18)", "rgba(90, 200, 255, 0.18)", "rgba(255, 230, 90, 0.16)", "rgba(120, 255, 140, 0.16)"][(k + i) % 4];
      ctx.fillRect(Math.round(ox + x), Math.round(oy + y), w, h);
    }
    ctx.restore();
  });
  // ぼぎ雀の台の画面: ゆっくり明るさが息をする
  ctx.fillStyle = `rgba(160, 255, 180, ${0.05 + 0.04 * Math.sin(t * 1.3)})`;
  ctx.fillRect(Math.round(ox + 300), Math.round(oy + 163), 54, 28);
}
const NG_GAMECEN = {
  tile: T,
  bg: "#1a1210",
  bgm: "silence", // だれもいない(旅館と同じ)
  map: kGrid(15, 10, (c, r) => !NG_GC_WALK(c, r)),
  legend: K_LEGEND,
  drawGround(ctx, ox, oy, img, api) {
    const bg = api.image("bg_gamecen");
    if (bg) ctx.drawImage(bg, Math.round(ox), Math.round(oy));
    ngGcDemo(ctx, ox, oy, performance.now() / 1000);
  },
  spawns: {
    door: { x: 7.5 * T, y: 8.9 * T, facing: "north" },
    jan: { x: 327, y: 7.75 * T, facing: "north" }, // ぼぎ雀の台の前(いすの手前)
  },
  objects: [
    // きーが奥へ回ると、手前の物がきーより前に来るように、背景から切り出して描く
    ngRyoCut("gcTableL", "bg_gamecen", 118, 156, 74, 212), // 画面の暗いテーブル台
    ngRyoCut("gcTableJ", "bg_gamecen", 293, 152, 68, 224), // ぼぎ雀の台
    ngRyoCut("gcStoolL", "bg_gamecen", 96, 186, 24, 212), // 暗い台の左のいす
    ngRyoCut("gcStoolL2", "bg_gamecen", 142, 222, 26, 248), // 暗い台の前のいす
    ngRyoCut("gcStoolJ", "bg_gamecen", 314, 216, 28, 244), // ぼぎ雀の台の前のいす
    ngRyoCut("gcVend", "bg_gamecen", 426, 222, 54, 320), // 自販機
    ngRyoCut("gcBench", "bg_gamecen", 436, 134, 44, 226), // 長いす
    // 当たり(テーブル台、いす。奥の台の前、西の壁ぎわ、テーブル台の奥と手前のいす)
    { id: "hTableL", x: 155, y: 196, w: 1, h: 1, solid: { w: 66, h: 26 }, draw() {} },
    { id: "hTableJ", x: 327, y: 204, w: 1, h: 1, solid: { w: 60, h: 30 }, draw() {} },
    { id: "hStoolL", x: 108, y: 204, w: 1, h: 1, solid: { w: 18, h: 10 }, draw() {} },
    { id: "hStoolL2", x: 155, y: 240, w: 1, h: 1, solid: { w: 18, h: 10 }, draw() {} },
    ...[[132, 146], [180, 146], [228, 146], [66, 182], [62, 228], [62, 278], [155, 166], [327, 162], [327, 234]].map(([x, y], i) => ({ id: `hStool${i}`, x, y, w: 1, h: 1, solid: { w: 18, h: 10 }, draw() {} })),
    // ぼぎ雀の台: いすの手前に立って調べる。画面が灯ってから、台の画面へ
    {
      id: "bogijan",
      x: 327,
      y: 222,
      iy: 26,
      w: 1,
      h: 1,
      headY: 70,
      range: 30,
      interact: (api) => {
        api.sfx("ok");
        api.later(300, () => api.warp("jan", "view"));
      },
    },
    // 奥の裏口(裏庭へ D772)。いまは開かない
    {
      id: "uraguchi",
      x: 418,
      y: 112,
      iy: 22,
      w: 1,
      h: 1,
      headY: 70,
      range: 34,
      interact: (api) => api.sfx("gata"),
    },
  ],
  triggers: [{ id: "out", x: 5.5 * T, y: 9.6 * T, w: 4 * T, h: T, run: (api) => api.warp("kohan", "gamecen") }],
};

// ======== ぼぎ雀(D768、D770、D771、D774、D777、D778)========
// 牌はぼぎだぢの世界の物: 持ち帰ったおもいで 12 種と、形而アップダウンクイズの変な物 6 種。1 種 4 枚、72 枚(D778)。
// あがりは同じ絵 3 枚の組が 3 つ(ポンした組も数える)。ツモとロン、ポン、リーチ。親と子、点数、半荘(東南 8 局)。はじめの親はサイコロ(D777)。
// きーの相手 3 人は 7 人から毎回ランダムで、画面の中だけ(D771、D773)。あがっても何ももらえない(D768)。説明は出さず、あがりの役と点だけ出す(D213)
// 操作: 十字キーの左右で牌を選び A で捨てる。上でリーチをつける(もう一度でやめる)。ポンを聞かれたら A で鳴く、B で見送る。B で台を離れる(勝負の途中は聞く)
const BJ_KINDS = ["kori", "hasu", "mango", "fuda", "poppo", "kaizu", "slice", "nouhin", "ribbon", "ame", "kaitou", "ehagaki", "u1", "u2", "u3", "u4", "u5", "u6"];
const BJ_IMG = (k) => (k[0] === "u" ? k : `ic_${k}`); // 変な物は形而の絵(u1〜u6)
const BJ_COPIES = 4;
const BJ_FOES = [
  { key: "matryo" }, // マトリョーシカ大
  { key: "matryo_s" }, // マトリョーシカ中
  { key: "crew", crew: true }, // 地上ぼぎクルー(3 羽のうち 1 羽)
  { key: "pi", cell: 64 }, // ぴー(歩きの絵の南向きの 1 こま)
  { key: "chirin" },
  { key: "kikori" },
  { key: "goron" },
];
let BJ_PON_RATE = 1; // 相手が鳴ける牌で鳴く割合
const BJ_STEP = 0.45; // 相手が引いて捨てるまで(秒)
const BJ_HAN = [0, 1000, 2000, 4000, 8000]; // 翻 → 点(D777)。親は 1.5 倍
const BJ_START = 25000;
// 席: 0 きー(下)、1 右、2 上、3 左。順番は 下 → 右 → 上 → 左(反時計回り)
const bj = { seats: null, pts: [], wind: 0, kyoku: 0, oya: 0, sticks: 0, deck: [], hands: [], melds: [], rivers: [], riichi: [], turn: 0, phase: "", drawn: null, cur: 0, arm: false, wait: 0, t: 0, end: null, dice: null, prevX: 0, prevY: 0, back: null };
const bjCount = (h) => {
  const c = {};
  for (const k of h) c[k] = (c[k] || 0) + 1;
  return c;
};
const bjSets = (h, m) => m.length + Object.values(bjCount(h)).reduce((s, v) => s + Math.floor(v / 3), 0);
const bjWin = (h, m) => bjSets(h, m) >= 3;
const bjTenpai = (h, m) => BJ_KINDS.some((k) => bjWin(h.concat(k), m));
const bjShuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const bjSort = (h) => h.sort((a, b) => BJ_KINDS.indexOf(a) - BJ_KINDS.indexOf(b));
const bjSeen = () => bjCount(bj.rivers.flat().map((r) => r.k).concat(...bj.melds.flat()));
// 相手の捨て方: 3 枚そろった組は残す。あと何枚出てきうるか(4 枚から、手と場に見えている数を引く)で値をつけ、
// 値のいちばん低い絵から捨てる。対子は 1 枚物より大事にするが、残りがもうなければ捨てる
function bjAiDiscard(hand) {
  const c = bjCount(hand);
  const seen = bjSeen();
  let best = null;
  let bs = Infinity;
  for (const k of new Set(hand)) {
    const left = Math.max(0, BJ_COPIES - c[k] - (seen[k] || 0));
    const v = (c[k] >= 3 ? 1000 : c[k] === 2 ? (left ? 20 + left * 5 : 2) : left * 3) + Math.random() * 2;
    if (v < bs) {
      bs = v;
      best = k;
    }
  }
  return best;
}
// 半荘のはじめ: 相手を選び、点を戻し、サイコロで親を決める
function bjMatch() {
  const foes = bjShuffle(BJ_FOES.slice()).slice(0, 3).map((f) => Object.assign({}, f, f.crew ? { key: ["crew_hawk", "crew_wagtail", "crew_rooster"][Math.floor(Math.random() * 3)] } : {}));
  bj.seats = [null, ...foes];
  bj.pts = [BJ_START, BJ_START, BJ_START, BJ_START];
  const d = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
  bj.dice = { d, t: bj.t, oya: (d[0] + d[1] - 1) % 4 }; // 1・5・9 きー、2・6・10 右、3・7・11 上、4・8・12 左
  Object.assign(bj, { wind: 0, kyoku: 0, sticks: 0, oya: bj.dice.oya, phase: "dice", end: null, back: null, hands: [[], [], [], []], melds: [[], [], [], []], rivers: [[], [], [], []], riichi: [false, false, false, false], drawn: null });
}
function bjDeal() {
  bj.deck = bjShuffle(BJ_KINDS.flatMap((k) => Array(BJ_COPIES).fill(k)));
  bj.hands = [0, 1, 2, 3].map(() => bj.deck.splice(0, 8));
  bjSort(bj.hands[0]);
  bj.melds = [[], [], [], []];
  bj.rivers = [[], [], [], []];
  bj.riichi = [false, false, false, false];
  Object.assign(bj, { turn: bj.oya, phase: "draw", drawn: null, cur: 0, arm: false, wait: 0.6, end: null });
}
const bjUp = (n) => Math.ceil(n / 100) * 100;
// あがり: 役と点を数えて、払う
function bjAgari(api, kind, who, from) {
  const yaku = ["あがり"];
  if (!bj.melds[who].length) yaku.push("面前");
  if (kind === "tsumo") yaku.push("ツモ");
  if (bj.riichi[who]) yaku.push("リーチ");
  const isOya = who === bj.oya;
  const pts = BJ_HAN[yaku.length] * (isOya ? 1.5 : 1);
  const pay = [0, 0, 0, 0];
  if (kind === "ron") pay[from] = pts;
  else
    for (let p = 0; p < 4; p++) {
      if (p === who) continue;
      pay[p] = isOya ? bjUp(pts / 3) : bjUp(p === bj.oya ? pts / 2 : pts / 4);
    }
  let got = 0;
  for (let p = 0; p < 4; p++) {
    bj.pts[p] -= pay[p];
    got += pay[p];
  }
  got += bj.sticks * 1000; // 場に出たリーチの 1000 点
  bj.sticks = 0;
  bj.pts[who] += got;
  bjSort(bj.hands[who]);
  bj.end = { kind, who, from, yaku, got, t: bj.t };
  bj.phase = "kyokuEnd";
  api.sfx("pinpon");
}
function bjNagare(api) {
  bj.end = { kind: "nagare", who: -1, t: bj.t };
  bj.phase = "kyokuEnd";
  api.sfx("back");
}
// 局のあと: 親があがれば親はそのまま(連荘)。ほかは親が次へ。南 4 局が終わるか、だれかが 0 点を下回れば半荘の終わり
function bjNext(api) {
  const renchan = bj.end && bj.end.who === bj.oya;
  if (!renchan) {
    bj.oya = (bj.oya + 1) % 4;
    bj.kyoku += 1;
    if (bj.kyoku > 3) {
      bj.kyoku = 0;
      bj.wind += 1;
    }
  }
  if (bj.wind > 1 || bj.pts.some((p) => p < 0)) {
    bj.phase = "matchEnd";
    bj.end = { kind: "match", t: bj.t };
    api.sfx("ok");
    return;
  }
  bjDeal();
}
// 捨てたあと: ほかの 3 人のだれかがその牌でそろえばロン(打った人の次から順に)。だれもいなければ、手に同じ絵 2 枚の人がポンできる
function bjAfterDiscard(api, p, tile, riichi) {
  bj.rivers[p].push({ k: tile, side: riichi });
  api.sfx("hyoshigi");
  for (let q = 1; q < 4; q++) {
    const o = (p + q) % 4;
    if (bjWin(bj.hands[o].concat(tile), bj.melds[o])) {
      bj.rivers[p].pop(); // 取られた牌は場から消える
      bj.hands[o].push(tile);
      return bjAgari(api, "ron", o, p);
    }
  }
  for (let q = 1; q < 4; q++) {
    const o = (p + q) % 4;
    if (bj.riichi[o] || bj.hands[o].filter((k) => k === tile).length < 2 || !bj.deck.length) continue;
    if (o === 0) {
      bj.phase = "ponAsk"; // きーに聞く
      bj.ponFrom = p;
      bj.ponTile = tile;
      return;
    }
    if (Math.random() < BJ_PON_RATE) return bjPon(api, o, p, tile); // 相手はたいてい鳴く
    break;
  }
  bj.turn = (p + 1) % 4;
  bj.phase = "draw";
  bj.wait = BJ_STEP;
}
function bjPon(api, o, from, tile) {
  bj.rivers[from].pop();
  for (let i = 0; i < 2; i++) bj.hands[o].splice(bj.hands[o].indexOf(tile), 1);
  bj.melds[o].push(tile);
  bj.turn = o;
  bj.drawn = null;
  bj.ponT = bj.t;
  bj.ponWho = o;
  api.sfx("clang");
  if (o === 0) {
    bj.phase = "pick";
    bj.cur = bj.hands[0].length - 1;
    bj.arm = false;
  } else {
    bj.phase = "ai";
    bj.wait = BJ_STEP;
  }
}
function bjStep(api, dt) {
  if (bj.phase === "dice") {
    if (bj.t - bj.dice.t > 2.4) bjDeal();
    return;
  }
  if (!["draw", "ai", "pick"].includes(bj.phase)) return;
  if (bj.wait > 0) {
    bj.wait -= dt;
    return;
  }
  const p = bj.turn;
  if (bj.phase === "draw") {
    if (!bj.deck.length) return bjNagare(api);
    bj.drawn = bj.deck.pop();
    if (bjWin(bj.hands[p].concat(bj.drawn), bj.melds[p])) {
      bj.hands[p].push(bj.drawn);
      bj.drawn = null;
      return bjAgari(api, "tsumo", p, -1);
    }
    if (p === 0) {
      bj.phase = "pick"; // きーが選ぶ(引いた牌が上がっている)
      bj.cur = bj.hands[0].length;
      bj.arm = false;
      if (bj.riichi[0]) bj.wait = 0.5; // リーチのあとは、引いた牌をそのまま捨てる
      return;
    }
    bj.phase = "ai";
    bj.wait = BJ_STEP;
    return;
  }
  if (bj.phase === "pick" && bj.riichi[0]) return bjKiDiscard(api);
  if (bj.phase === "ai") {
    const h = bj.hands[p];
    let d;
    if (bj.drawn && bj.riichi[p]) d = bj.drawn;
    else {
      if (bj.drawn) h.push(bj.drawn);
      d = bjAiDiscard(h);
    }
    if (d === bj.drawn && bj.riichi[p]) bj.drawn = null;
    else {
      bj.drawn = null;
      h.splice(h.indexOf(d), 1);
    }
    // 面前で、あと 1 枚になったら、たいていリーチ
    let ri = false;
    if (!bj.riichi[p] && !bj.melds[p].length && bj.pts[p] >= 1000 && bj.deck.length >= 4 && bjTenpai(h, bj.melds[p]) && Math.random() < 0.7) {
      ri = bjRiichi(api, p);
    }
    bjAfterDiscard(api, p, d, ri);
  }
}
function bjRiichi(api, p) {
  bj.riichi[p] = true;
  bj.pts[p] -= 1000;
  bj.sticks += 1;
  bj.riichiT = bj.t;
  bj.riichiWho = p;
  return true;
}
// きーがリーチをかけられるか(面前、1000 点ある、山が残っている、捨てたあとあと 1 枚になる牌がある)
const bjCanRiichi = () => !bj.riichi[0] && !bj.melds[0].length && bj.pts[0] >= 1000 && bj.deck.length >= 4 && bj.drawn && bjKiChoices().some((i) => bjTenpai(bjKiAfter(i), []));
const bjKiChoices = () => [...Array(bj.hands[0].length + (bj.drawn ? 1 : 0)).keys()];
// i 番目を捨てたあとの手
function bjKiAfter(i) {
  const h = bj.hands[0].concat(bj.drawn ? [bj.drawn] : []);
  h.splice(i, 1);
  return h;
}
function bjKiDiscard(api) {
  const n = bj.hands[0].length;
  const i = bj.riichi[0] ? n : bj.cur;
  const all = bj.hands[0].concat(bj.drawn ? [bj.drawn] : []);
  const tile = all[i];
  const after = bjKiAfter(i);
  let ri = false;
  if (bj.arm && !bj.riichi[0] && bjTenpai(after, [])) ri = bjRiichi(api, 0);
  bj.hands[0] = bjSort(after);
  bj.drawn = null;
  bj.arm = false;
  bj.phase = "wait";
  bjAfterDiscard(api, 0, tile, ri);
}
const bjLeave = (api) => api.warp("gamecen", "jan");

// ---- 画面(480 × 288)----
const BJ_FELT = "#0f3a2c";
function bjTile(ctx, img, x, y, k) {
  x = Math.round(x);
  y = Math.round(y);
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(x + 2, y + 3, 34, 44);
  ctx.fillStyle = "#efe6cf";
  ctx.fillRect(x, y, 34, 44);
  ctx.fillStyle = "#d6c9a6";
  ctx.fillRect(x, y + 38, 34, 6);
  ctx.strokeStyle = "#3a2f22";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, 33, 43);
  const im = img(BJ_IMG(k));
  if (im) ctx.drawImage(im, x + 1, y + 3, 32, 32);
}
// 小さい牌(捨て牌、鳴いた組、あがった相手の手)。中心 (cx, cy)、向き a(持ち主のほうを向く D774)
function bjSmall(ctx, img, cx, cy, k, a) {
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  ctx.rotate(a);
  ctx.fillStyle = "#efe6cf";
  ctx.fillRect(-9, -11, 18, 22);
  ctx.fillStyle = "#d6c9a6";
  ctx.fillRect(-9, 7, 18, 4);
  ctx.strokeStyle = "#3a2f22";
  ctx.strokeRect(-8.5, -10.5, 17, 21);
  const im = img(BJ_IMG(k));
  if (im) ctx.drawImage(im, -8, -9, 16, 16);
  ctx.restore();
}
function bjBackH(ctx, x, y) {
  ctx.fillStyle = "#2f6b4f";
  ctx.fillRect(x, y, 18, 24);
  ctx.fillStyle = "#24543d";
  ctx.fillRect(x, y + 20, 18, 4);
  ctx.strokeStyle = "#3a2f22";
  ctx.strokeRect(x + 0.5, y + 0.5, 17, 23);
}
function bjBackV(ctx, x, y, right) {
  ctx.fillStyle = "#2f6b4f";
  ctx.fillRect(x, y, 24, 13);
  ctx.fillStyle = "#24543d";
  ctx.fillRect(right ? x : x + 20, y, 4, 13);
  ctx.strokeStyle = "#3a2f22";
  ctx.strokeRect(x + 0.5, y + 0.5, 23, 12);
}
function bjFace(ctx, img, x, y, foe, lit) {
  ctx.fillStyle = lit ? "#2a5a44" : "#08241b";
  ctx.fillRect(x, y, 44, 46);
  ctx.strokeStyle = lit ? "#f2d27a" : "#5d8f77";
  ctx.strokeRect(x + 0.5, y + 0.5, 43, 45);
  const im = img(foe.key);
  if (!im) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, y + 1, 42, 44);
  ctx.clip();
  if (foe.cell) ctx.drawImage(im, 0, 0, foe.cell, foe.cell, x - 10, y - 14, foe.cell, foe.cell);
  else {
    const s = im.height > 42 ? 42 / im.height : 1;
    ctx.drawImage(im, Math.round(x + 22 - (im.width * s) / 2), Math.round(y + 45 - im.height * s), Math.round(im.width * s), Math.round(im.height * s));
  }
  ctx.restore();
}
// 打った人ごとの捨て牌の並べ方(打った人から見て左から右、行は外へ)。リーチの牌は横にする
function bjRiverPos(p, i) {
  const R = Math.PI / 2;
  if (p === 0) return [166 + (i % 8) * 19 + 9, 192 + Math.floor(i / 8) * 23, 0];
  if (p === 2) return [318 - (i % 8) * 19 - 9, 80 - Math.floor(i / 8) * 23, 2 * R];
  if (p === 3) return [154 - Math.floor(i / 4) * 23, 92 + (i % 4) * 22 + 11, R];
  return [326 + Math.floor(i / 4) * 23, 180 - (i % 4) * 22 - 11, -R];
}
// サイコロの目
function bjDie(ctx, x, y, n) {
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(x + 2, y + 2, 28, 28);
  ctx.fillStyle = "#f4efe2";
  ctx.fillRect(x, y, 28, 28);
  const P = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] }[n];
  ctx.fillStyle = n === 1 ? "#c8282a" : "#2a2420";
  for (const [c, r] of P) ctx.fillRect(x + 5 + c * 7, y + 5 + r * 7, n === 1 ? 6 : 4, n === 1 ? 6 : 4);
}
const BJ_WINDS = ["東", "南"];
function bjDraw(ctx, ox, oy, img) {
  if (!bj.seats) return;
  const X = Math.round(ox);
  const Y = Math.round(oy);
  ctx.fillStyle = BJ_FELT;
  ctx.fillRect(X, Y, 480, 300);
  const P = window.bogiPix;
  const txt = (s, x, y, col, k = 1, right) => P && P.text(ctx, s, right ? x - P.width(s) * k : x, y, k, col);
  txt("ぼぎ雀", X + 8, Y + 6, "#f2d27a");
  if (bj.phase !== "dice") txt(`${BJ_WINDS[Math.min(bj.wind, 1)]}${bj.kyoku + 1}局`, X + 8, Y + 22, "#9fc7b0");
  if (bj.phase !== "dice") txt(`のこり ${bj.deck.length}`, X + 472, Y + 6, "#9fc7b0", 1, true);
  const end = bj.end && bj.end.who >= 0 && bj.phase === "kyokuEnd" ? bj.end : null;
  const lit = (p) => end && end.who === p;
  // 相手(上・左・右)の顔、点、親の印、伏せた手と鳴いた組。あがった人の手は表を向ける
  bjFace(ctx, img, X + 120, Y + 4, bj.seats[2], lit(2) || (bj.phase === "dice" && bj.t - bj.dice.t > 1.4 && bj.dice.oya === 2));
  bjFace(ctx, img, X + 6, Y + 40, bj.seats[3], lit(3) || (bj.phase === "dice" && bj.t - bj.dice.t > 1.4 && bj.dice.oya === 3));
  bjFace(ctx, img, X + 430, Y + 40, bj.seats[1], lit(1) || (bj.phase === "dice" && bj.t - bj.dice.t > 1.4 && bj.dice.oya === 1));
  // 点(顔のそば)。親は顔の右下に「親」の札(きーは点のとなり)
  const oyaTag = (x, y) => {
    ctx.fillStyle = "#c8482a";
    ctx.fillRect(x, y, 18, 18);
    txt("親", x + 1, y + 1, "#fff4e0");
  };
  if (P) {
    txt(`${bj.pts[2]}`, X + 114, Y + 34, "#e8e0c8", 1, true);
    txt(`${bj.pts[3]}`, X + 6, Y + 90, "#e8e0c8");
    txt(`${bj.pts[1]}`, X + 474, Y + 90, "#e8e0c8", 1, true);
    txt(`${bj.pts[0]}`, X + 8, Y + 216, "#e8e0c8");
    if (bj.phase !== "dice") {
      if (bj.oya === 0) oyaTag(X + 12 + P.width(`${bj.pts[0]}`), Y + 214);
      else oyaTag(X + [0, 430, 120, 6][bj.oya] + 26, Y + [0, 40, 4, 40][bj.oya] + 28);
    }
  }
  // 上の人: 伏せた手のあとに鳴いた組
  {
    const h = bj.hands[2];
    let x = X + 170;
    for (let i = 0; i < h.length; i++, x += 18) {
      if (lit(2)) bjSmall(ctx, img, x + 9, Y + 20, h[i], Math.PI);
      else bjBackH(ctx, x, Y + 8);
    }
    for (const k of bj.melds[2]) {
      x += 4;
      for (let j = 0; j < 3; j++, x += 18) bjSmall(ctx, img, x + 9, Y + 20, k, Math.PI);
    }
  }
  // 左と右の人: 縦に
  for (const [p, hx, right] of [[3, 56, false], [1, 400, true]]) {
    const h = bj.hands[p];
    const a = right ? -Math.PI / 2 : Math.PI / 2;
    let y = Y + 92;
    for (let i = 0; i < h.length; i++) {
      if (lit(p)) {
        bjSmall(ctx, img, X + hx + 12, y + 8, h[i], a);
        y += 16;
      } else {
        bjBackV(ctx, X + hx, y, right);
        y += 13;
      }
    }
    for (const k of bj.melds[p]) {
      y += 3;
      for (let j = 0; j < 3; j++, y += 16) bjSmall(ctx, img, X + hx + 12, y + 8, k, a);
    }
  }
  // 引いた相手の牌(伏せたまま、少しはなして)
  if (bj.drawn && bj.turn !== 0 && bj.phase === "ai") {
    if (bj.turn === 2) bjBackH(ctx, X + 148, Y + 8);
    if (bj.turn === 3) bjBackV(ctx, X + 56, Y + 76, false);
    if (bj.turn === 1) bjBackV(ctx, X + 400, Y + 76, true);
  }
  // 捨て牌(リーチの牌は横)
  bj.rivers.forEach((r, p) =>
    r.forEach((t, i) => {
      const [cx, cy, a] = bjRiverPos(p, i);
      bjSmall(ctx, img, X + cx, Y + cy, t.k, a + (t.side ? Math.PI / 2 : 0));
    })
  );
  // リーチの棒(場のまん中に、リーチした人のほうへ)
  for (let p = 0; p < 4; p++) {
    if (!bj.riichi[p]) continue;
    const [sx, sy, w, h] = [[200, 172, 80, 4], [314, 96, 4, 80], [200, 100, 80, 4], [162, 96, 4, 80]][p];
    ctx.fillStyle = "#f4efe2";
    ctx.fillRect(X + sx, Y + sy, w, h);
    ctx.fillStyle = "#c8282a";
    ctx.fillRect(X + sx + w / 2 - 2, Y + sy + h / 2 - 2, 4, 4);
  }
  // きーの手と、引いた牌(右に少しはなして)。選んでいる牌は少し上へ。鳴いた組は右下に小さく
  const h = bj.hands[0];
  const pick = bj.phase === "pick" && !bj.riichi[0];
  for (let i = 0; i < h.length; i++) bjTile(ctx, img, X + 70 + i * 35, Y + 236 - (pick && bj.cur === i ? 8 : 0), h[i]);
  if (bj.drawn && bj.turn === 0) bjTile(ctx, img, X + 70 + h.length * 35 + 12, Y + 236 - (pick && bj.cur === h.length ? 8 : 0), bj.drawn);
  {
    let x = X + 470;
    for (const k of bj.melds[0]) {
      for (let j = 0; j < 3; j++, x -= 19) bjSmall(ctx, img, x - 9, Y + 266, k, 0);
      x -= 4;
    }
  }
  if (pick) {
    const cx = X + 70 + bj.cur * 35 + (bj.cur === h.length ? 12 : 0) + 17;
    ctx.fillStyle = "#f2d27a";
    for (let r = 0; r < 5; r++) ctx.fillRect(cx - r, Y + 214 + r, r * 2 + 1, 1); // ▲(上げた牌の上)
    if (bjCanRiichi()) txt(bj.arm ? "▲ リーチ" : "△ リーチ", X + 360, Y + 216, bj.arm ? "#ff8a5a" : "#9fc7b0");
  }
  if (bj.phase === "ponAsk") {
    ctx.fillStyle = "rgba(8, 20, 14, 0.86)";
    ctx.fillRect(X + 160, Y + 116, 160, 66);
    txt("ポン？", X + 228 - P.width("ポン？"), Y + 124, "#f2d27a", 2);
    bjSmall(ctx, img, X + 300, Y + 140, bj.ponTile, 0); // 鳴く牌
    txt("A ポン　B みおくる", X + 240 - P.width("A ポン　B みおくる") / 2, Y + 160, "#9fc7b0");
  }
  // 鳴いた・リーチの声(少しのあいだ、その人の近くに)
  const shout = (word, who, t0) => {
    if (t0 == null || bj.t - t0 > 1.0) return;
    const [sx, sy] = [[240, 206], [400, 70], [240, 56], [80, 70]][who];
    const w = P.width(word);
    ctx.fillStyle = "rgba(8, 20, 14, 0.85)";
    ctx.fillRect(X + sx - w / 2 - 6, Y + sy - 4, w + 12, 22);
    txt(word, X + sx - w / 2, Y + sy, "#ff8a5a");
  };
  if (P) {
    shout("ポン", bj.ponWho, bj.ponT);
    shout("リーチ", bj.riichiWho, bj.riichiT);
  }
  // サイコロ(半荘のはじめ)
  if (bj.phase === "dice") {
    const roll = bj.t - bj.dice.t < 1.2;
    const a = roll ? 1 + Math.floor(bj.t * 17) % 6 : bj.dice.d[0];
    const b = roll ? 1 + Math.floor(bj.t * 13 + 3) % 6 : bj.dice.d[1];
    bjDie(ctx, X + 204, Y + 120, a);
    bjDie(ctx, X + 248, Y + 120, b);
  }
  // 局の終わり: ツモ / ロン / ながれ、役、点
  if (bj.phase === "kyokuEnd" && P) {
    const e = bj.end;
    const word = { tsumo: "ツモ", ron: "ロン", nagare: "ながれ" }[e.kind];
    ctx.fillStyle = "rgba(8, 20, 14, 0.86)";
    ctx.fillRect(X + 150, Y + 100, 180, e.kind === "nagare" ? 48 : 82);
    txt(word, X + 240 - P.width(word), Y + 108, e.kind === "nagare" ? "#9fc7b0" : "#f2d27a", 2);
    if (e.kind !== "nagare") {
      let x = X + 160;
      for (const y of e.yaku) {
        txt(y, x, Y + 146, "#e8e0c8");
        x += P.width(y) + 8;
      }
      txt(`${e.got}`, X + 320, Y + 162, "#ff8a5a", 1, true);
    }
  }
  // 半荘の終わり: 点の多い順
  if (bj.phase === "matchEnd" && P) {
    const order = [0, 1, 2, 3].sort((a, b) => bj.pts[b] - bj.pts[a] || a - b);
    ctx.fillStyle = "rgba(8, 20, 14, 0.9)";
    ctx.fillRect(X + 130, Y + 58, 220, 200);
    order.forEach((p, i) => {
      const y = Y + 64 + i * 48;
      txt(`${i + 1}`, X + 142, y + 14, i === 0 ? "#f2d27a" : "#9fc7b0", 2);
      if (p === 0) {
        const ki = img("ki");
        ctx.fillStyle = "#08241b";
        ctx.fillRect(X + 176, y, 44, 46);
        if (ki) ctx.drawImage(ki, 0, 0, 64, 64, X + 166, y - 14, 64, 64);
      } else bjFace(ctx, img, X + 176, y, bj.seats[p], i === 0);
      txt(`${bj.pts[p]}`, X + 336, y + 16, "#e8e0c8", 1, true);
    });
  }
  // やめるか聞く
  if (bj.phase === "quitAsk" && P) {
    ctx.fillStyle = "rgba(8, 20, 14, 0.92)";
    ctx.fillRect(X + 150, Y + 110, 180, 60);
    txt("やめますか？", X + 240 - P.width("やめますか？") / 2, Y + 118, "#e8e0c8");
    txt("A はい　B いいえ", X + 240 - P.width("A はい　B いいえ") / 2, Y + 144, "#9fc7b0");
  }
  // 走査線(ブラウン管)
  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  for (let y = 0; y < 300; y += 2) ctx.fillRect(X, Y + y, 480, 1);
}
const NG_JAN = {
  tile: T,
  bg: BJ_FELT,
  hidePlayer: true,
  bgm: "silence",
  map: kGrid(15, 9, () => false), // 画面とちょうど同じ広さ(カメラが動かない。ピンボールと同じ)
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 4 * T, facing: "north" } },
  objects: [],
  triggers: [],
  onEnter() {
    bj.t = 0;
    bjMatch();
  },
  debug: () => bj,
  onA(api) {
    if (bj.phase === "pick" && !bj.riichi[0]) bjKiDiscard(api);
    else if (bj.phase === "ponAsk") bjPon(api, 0, bj.ponFrom, bj.ponTile);
    else if (bj.phase === "kyokuEnd" && bj.t - bj.end.t > 0.8) {
      api.sfx("ok");
      bjNext(api);
    } else if (bj.phase === "matchEnd" && bj.t - bj.end.t > 0.8) {
      api.sfx("ok");
      bjMatch();
    } else if (bj.phase === "quitAsk") bjLeave(api);
    return true;
  },
  onB(api) {
    if (bj.phase === "ponAsk") {
    ctx.fillStyle = "rgba(8, 20, 14, 0.86)";
    ctx.fillRect(X + 160, Y + 116, 160, 66);
      // 見送る: 番は打った人の次へ
      bj.turn = (bj.ponFrom + 1) % 4;
      bj.phase = "draw";
      bj.wait = BJ_STEP;
    } else if (bj.phase === "quitAsk") bj.phase = bj.back;
    else if (bj.phase === "matchEnd") bjLeave(api);
    else {
      bj.back = bj.phase; // 勝負の途中は聞く
      bj.phase = "quitAsk";
    }
    return true;
  },
  input(api, dt, inp) {
    if (!bj.seats) bjMatch();
    bj.t += dt;
    // 十字キーの左右で選ぶ(押したときだけ 1 つ動く)。上でリーチをつける
    const dx = inp.x > 0.5 ? 1 : inp.x < -0.5 ? -1 : 0;
    const dy = inp.y < -0.5 ? -1 : 0;
    if (bj.phase === "pick" && !bj.riichi[0]) {
      const n = bj.hands[0].length + (bj.drawn ? 1 : 0);
      if (dx && dx !== bj.prevX) {
        bj.cur = (bj.cur + dx + n) % n;
        api.sfx("cursor");
      }
      if (dy && dy !== bj.prevY && bjCanRiichi()) {
        bj.arm = !bj.arm;
        api.sfx("cursor");
      }
    }
    bj.prevX = dx;
    bj.prevY = dy;
    if (bj.phase !== "quitAsk") bjStep(api, dt);
  },
  drawGround(ctx, ox, oy, img) {
    bjDraw(ctx, ox, oy, typeof img === "function" ? img : () => null);
  },
};
