// 断片: ぼぎボマーと地上ぼぎクルー。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== ぼぎボマーと地上ぼぎクルー(D180、D181) ========
// 草に呑まれかけた山あいの飛行場、朝。人間がいなくなっても、地上ぼぎクルーは毎朝同じ手順で爆装し、発進を見送り、帰りを待つ
// 条件: 安全ピンを抜く(赤いリボン = 道具)→ 車輪止めを外す → 旗を振る → ボマーは東へ飛び立ち、谷の向こうで遠い爆発 → 西から帰る
//       → クルーが紺の作業帽を差し出しに来る。受け取らずに西から去ると帰る条件(執着の誘いを拒むひな形 D175)
//       帽子を受け取ると、同じ朝がもう一度来る(古い命令の輪に入る)。帽子は、クルーに返せる
// 向き(D148): きーは西から来る。ボマーは東へ飛び立ち、西から帰る。下絵(docs/assets/bomber/blockout.py)のまま(D156)
const bS = { phase: "morning", t0: 0, pin: false, chocks: false, offered: false, boomed: false, revT0: -1, farewell: false, capAt: null, greeted: false, salT0: -1 };
const bNow = () => performance.now() / 1000;
const B_HOME = 17 * T; // 止まる位置(機体の中心の x)
const B_RIBBON = { x: B_HOME - 4 * T, y: 18.3 * T }; // リボンが飛ばされた、滑走路わきの草むら(D203)
let bRibbonT0 = -1;
// 飛ばされたリボンが草むらに落ちたか(飛んでいるあいだは、まだ拾えない)
const bRibbonLanded = (api) => api.flag("ribbonBlown") && (bRibbonT0 < 0 || performance.now() / 1000 - bRibbonT0 >= 1.4);
// 朝の手順(D211): クルーの合図の順に、ピン → 車輪止め → 旗。車輪止めを外すとエンジンがかかり、回転が高まっては落ちる。
// 高まりきった一瞬(B_REV_PEAK)に旗を振ると発進。早すぎても遅すぎても、クルーは首をふる
const B_REV_SEC = 5;
const B_REV_PEAK = [3.4, 4.3];
const bRev = () => {
  if (bS.phase === "taxi") return 1;
  if (bS.phase !== "morning" || bS.revT0 < 0) return 0;
  const u = (bNow() - bS.revT0) % B_REV_SEC;
  if (u < B_REV_PEAK[0]) return 0.25 + 0.75 * (u / B_REV_PEAK[0]) ** 2;
  if (u < B_REV_PEAK[1]) return 1;
  return 1 - 0.75 * ((u - B_REV_PEAK[1]) / (B_REV_SEC - B_REV_PEAK[1]));
};
const bPeak = () => {
  if (bS.phase !== "morning" || bS.revT0 < 0) return false;
  const u = (bNow() - bS.revT0) % B_REV_SEC;
  return u >= B_REV_PEAK[0] && u < B_REV_PEAK[1];
};
// いまクルーが合図している手順(0 ピン、1 車輪止め、2 旗)。爆装が終わるまでは合図しない
const bStep = () => (bS.phase !== "morning" || bLoaded() < B_BOMBS.length ? -1 : !bS.pin ? 0 : !bS.chocks ? 1 : 2);
// 発進の地ひびき(D211): プロペラのうしろ(西)へ流れる砂ぼこり。世界の座標で持つ
const bDust = [];
const B_SALUTE = { crew_hawk: "salute_hawk", crew_wagtail: "salute_wagtail", crew_rooster: "salute_rooster" };
// 見送りの列へ歩く
const bWalkTo = (o, [x, y], dt) => {
  const dx = x - o.x;
  const dy = y - o.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return;
  o.x += (dx / d) * Math.min(d, 95 * dt);
  o.y += (dy / d) * Math.min(d, 95 * dt);
};
let bShine = null; // 機体の照り返しを描く下書き
const B_Y = 16.5 * T; // 機体が地面に接する高さ(車輪の下)
// 機体はエクラノプランと同じ、斜め上からの見下ろし(作者「エクラノプランの時みたいに俯瞰図に」)。絵の中の地面の線と、プロペラの軸、脚
// 機首は真東(作者「b」)。絵の中の地面の線(手前の主脚の車輪)と、プロペラの軸、主脚
const B_GROUND = 205;
const B_LAND_SEC = 9; // 着陸にかける秒
const B_PROPS = [[72, 57], [72, 88], [72, 131], [72, 160]];
const B_GEAR = { main: -0.4 * T, nose: 0.5 * T }; // 機体の中心(x)からの、リボンを下げる所と車輪止めの所(どちらも手前の主脚)
const bMorning = () => Object.assign(bS, { phase: "morning", t0: 0, pin: false, chocks: false, offered: false, boomed: false, booms: 0, answered: false, seq: false, revT0: -1, farewell: false, capAt: null, greeted: false, salT0: -1, loadT0: bNow(), shown: false });
// 爆装(D182): 機首の前(東)に、翼の前のふちと平行な列で爆弾とミサイルを並べる(参考写真 docs/record/2026-10-05-bomber/ref_munitions.jpg)
// 列 0 が機首にいちばん近い。クルーは近い列から積んでいく
// 機首の前に、翼の前のふちと平行な列で並べる(D182)。斜めの見下ろしの機体(D208)に合わせ、列の頂点は機首の正面、腕は前縁と同じ傾きで左上・左下へ。
// ところどころに大根とかぼちゃがまじる(作者「大根やかぼちゃがあっても良い」)
const B_NOSE = { x: B_HOME + 100, y: 16.5 * T - 98 }; // 絵の中の機首(260, 107)
// 全弾投下の一枚絵(v_rain01〜16)の、コマごとに新しく起きる爆発の数と大きさの合計(docs/assets/bomber/boom/make_frames.py の予定から)
const B_RAIN_HITS = [[1, 1.1], [2, 2.3], [3, 4.3], [3, 5.0], [2, 2.7], [3, 4.8], [3, 4.9], [3, 4.3], [4, 6.4], [5, 7.6], [5, 8.1], [5, 7.4], [5, 7.3], [2, 3.0], [0, 0], [0, 0]];
const B_BOMBS = (() => {
  // ヤケクソの爆装(D217): 列を 14 まで増やし、間をつめる
  const rows = ["bomb_s", "bomb_s", "bomb_m", "bomb_m", "bomb_w", "bomb_w", "bomb_l", "missile", "bomb_m", "bomb_s", "bomb_w", "bomb_l", "bomb_m", "missile"];
  const out = [];
  const cy = B_NOSE.y;
  rows.forEach((img, i) => {
    const gap = { bomb_s: 9, bomb_m: 11, bomb_w: 13, bomb_l: 12, missile: 15 }[img]; // 絵の高さ + すきま
    const ax = B_NOSE.x + 1.1 * T + i * 1.0 * T; // 列の頂点(機首の正面)
    let k = 0;
    for (let y = cy - 3.6 * T; y <= cy + 3.7 * T; y += gap) {
      if (Math.abs(y - cy) < 7) continue; // まん中の通り道
      const x = ax - Math.abs(y - cy) * 1.6; // 前縁と同じ傾き
      // 大根とかぼちゃ: 中ほどの列に、ぽつぽつと
      const veg = ((i === 3 || i === 10) && k % 4 === 2) || ((i === 4 || i === 12) && k % 5 === 1) ? "daikon" : (i === 6 || i === 9) && k % 3 === 1 ? "kabocha" : null;
      out.push({ img: veg || img, x, y, row: i });
      k++;
    }
  });
  return out;
})();
// 朝の積みこみは、たくさんのぼぎが手伝う(D218)。爆弾は格納庫から持ってきて並べ、並べたものを機体へ積む(D220)。
//   1. 運び手は格納庫(滑走路の北のかまぼこ形)の口から一発ずつかついで出てきて、機首の前の山形の列に置いていく
//   2. 手のあいた者から、列の爆弾を拾って機首の下へ運ぶ(積む番の爆弾がまだ並んでいなければ、その場で待つ)
// 帰ってきたあとは、機首の下から運び出して、列に並べなおす(D204)。
// だれが、いつ、どこからどこへ、何をかついで歩くかは、はじめに区間の並びとして決めておく
const B_PORTER_N = 48;
const B_HATCH = { x: B_NOSE.x - 34, y: B_NOSE.y }; // 機首の下(翼にかくれる所)
const B_HANGAR = { x: 925, y: 186 }; // 格納庫の口(背景の絵の、暗いアーチの下)
// 修理の持ち場(D223、D225): 翼の上の 18 か所だけ(機体の絵の中の位置、絵の左上がマップの (384, 323))
const B_REPAIR = [[115,27],[152,40],[122,66],[182,66],[145,79],[137,92],[182,92],[212,92],[145,105],[205,105],[107,118],[160,131],[197,118],[122,144],[182,144],[160,157],[130,183],[145,183]].map(([x, y]) => ({ x: 384 + x, y: 323 + y, wing: true }));
const bPlan = (morning) => {
  const n = B_PORTER_N;
  const free = Array.from({ length: n }, (_, j) => j * (morning ? 0.12 : 0.07)); // 一体ずつ、つぎつぎに出てくる
  const speed = Array.from({ length: n }, (_, j) => (morning ? 190 : 230) + ((j * 37) % 30)); // 足の速さは少しずつちがう。修理には駆けつける
  const at = Array.from({ length: n }, () => B_HANGAR);
  const segs = Array.from({ length: n }, () => []);
  const LIFT = 0.25; // かつぎ上げる、下ろす手間
  const pick = () => {
    let j = 0;
    for (let i = 1; i < n; i++) if (free[i] < free[j]) j = i;
    return j;
  };
  // j が、いまいる所から to まで歩く(carry: かついでいる絵)。着いた時刻を返す
  const walk = (j, to, carry, k) => {
    const t0 = free[j];
    const t1 = t0 + Math.hypot(to.x - at[j].x, to.y - at[j].y) / speed[j] + LIFT;
    segs[j].push({ t0, t1, from: at[j], to, carry, k });
    free[j] = t1;
    at[j] = to;
    return t1;
  };
  const wait = (j, until, pose) => {
    if (until <= free[j]) return;
    segs[j].push({ t0: free[j], t1: until, from: at[j], to: at[j], carry: null, pose });
    free[j] = until;
  };
  if (morning) {
    // 1. 格納庫から列へ
    B_BOMBS.forEach((b, k) => {
      const j = pick();
      if (at[j] !== B_HANGAR) walk(j, B_HANGAR, null);
      b.ta = walk(j, b, b.img, k);
    });
    // 見せ場(D222): 並べ終えたら、列の手前に二列に整列して敬礼し、記念写真を一枚(D182 の写真のように)
    for (let j = 0; j < n; j++) walk(j, { x: 640 + (j % 24) * 18 + (j >= 24 ? 9 : 0), y: j >= 24 ? 602 : 570 }, null); // 二列の間は 32px(引きの画面でも後ろの列が隠れない D315)
    B_SHOW.lined = Math.max(...free);
    B_SHOW.photo = B_SHOW.lined + 2.2; // シャッター
    B_SHOW.load = B_SHOW.photo + 9.5; // 写真のあと、機体を見せてから積みはじめる
    for (let j = 0; j < n; j++) {
      wait(j, B_SHOW.lined, null);
      wait(j, B_SHOW.load - 0.6 - ((j * 7) % 10) * 0.08, "salute"); // 敬礼をといた者から、持ち場へ
    }
    // 2. 列から機首の下へ
    B_BOMBS.forEach((b, k) => {
      const j = pick();
      walk(j, b, null);
      wait(j, b.ta + 0.3);
      b.tp = free[j];
      walk(j, B_HATCH, b.img, k);
    });
    // 積み終えた者は、翼の下にもぐって見えなくなる
  } else {
    // 帰ってきたら、一斉に修理(D223。爆弾を並べなおすのはやめた)。バンカーから走り出て、翼の上に散る
    // 修理に上がるのは 18 体だけ(作者「修理クルーを機上18人だけに減らそうか。」)。ほかのぼぎは出てこない
    for (let j = 0; j < B_REPAIR.length; j++) {
      walk(j, B_REPAIR[j], null);
      wait(j, 1e5, "repair");
    }
  }
  return segs;
};
const B_SHOW = {}; // 朝の見せ場の時刻(積みこみの段取りから決まる)
const B_SEGS = { morning: bPlan(true), back: bPlan(false) };
// 朝の見せ場のカメラ(D222): バンカーの口 → 運び出す列を追う → 並んだ爆弾 → 引いて全体(整列と記念写真)
// → 銀の機体を翼の端から機首、操縦席のぼぎまでなめる → 機首の下へ吸いこまれていく積みこみ → きーに戻る
const bShowKeys = () => {
  const { lined, photo, load } = B_SHOW;
  const nose = { x: B_NOSE.x, y: B_NOSE.y };
  return [
    { t: 0, x: B_HANGAR.x, y: B_HANGAR.y + 20, z: 1.6 }, // バンカーの暗い口
    { t: 3.2, x: B_HANGAR.x - 10, y: B_HANGAR.y + 40, z: 1.5 }, // 一体目が、かついで出てくる
    { t: 8, x: 860, y: 340, z: 1.15 }, // 列を追って、滑走路へ
    { t: 13, x: 820, y: 430, z: 1.0 }, // 並んでいく爆弾
    { t: lined - 2.5, x: 900, y: 450, z: 1.0 },
    { t: lined + 0.8, x: 720, y: 410, z: 0.55 }, // 引いて、全体(機体、山形の爆弾、整列したぼぎ)
    { t: photo + 2.2, x: 720, y: 410, z: 0.55 }, // 記念写真
    { t: photo + 4.2, x: B_HOME - 150, y: nose.y - 70, z: 1.25 }, // 翼の端、プロペラ
    { t: photo + 7.6, x: nose.x - 40, y: nose.y - 6, z: 1.7 }, // 機首と操縦席のぼぎ
    { t: load + 0.8, x: nose.x - 30, y: nose.y, z: 1.7 },
    { t: load + 3.2, x: nose.x + 70, y: nose.y + 30, z: 1.1 }, // 機首の下へ、つぎつぎに積みこむ
    { t: load + 9, x: nose.x + 110, y: nose.y + 30, z: 1.05 },
  ];
};
const B_LOAD_END = Math.max(...B_BOMBS.map((b) => b.tp));
// 運び手の段取りの、いまの時刻(朝は並べて積む、帰ったあとは並べなおし。それ以外は null)
const bCarryT = () => (bS.phase === "morning" ? bNow() - bS.loadT0 : bS.phase === "back" ? bNow() - bS.t0 - 2 : null);
// 地面にある爆弾か。朝の、もう置かれて、まだ拾われていないもの(帰ったあとは並べない。爆弾は次の朝、またバンカーから)
const bOnGround = (b) => {
  const e = bCarryT();
  return bS.phase === "morning" && e !== null && b.ta <= e && e < b.tp;
};
// 機体に積んである数(朝は拾われた数。帰ったあとは、まだ運び出されていない数)
const bLoaded = () => {
  const e = bCarryT();
  if (bS.phase !== "morning" || e === null) return bS.phase === "back" ? 0 : B_BOMBS.length; // 帰ったときは、全弾投下で空
  return B_BOMBS.reduce((n, b) => n + (b.tp <= e ? 1 : 0), 0);
};
// 機体の位置(x)と、地面からの高さ(影とのずれ)
const bPose = () => {
  const u = bNow() - bS.t0;
  if (bS.phase === "taxi") return { x: B_HOME + 9 * u * u, lift: Math.max(0, u - 4.2) ** 2 * 14 }; // ゆっくり走り出し、画面の中で浮き上がる
  if (bS.phase === "away") return { x: 99 * T, lift: 60 };
  if (bS.phase === "landing") {
    // 左から、高度を下げながらゆっくり入ってくる → 接地(6 割のところ)→ 減速して、朝と同じ位置に止まる(作者「左からゆっくり」)
    const k = Math.min(1, u / B_LAND_SEC);
    return { x: -10 * T + (B_HOME + 10 * T) * (1 - (1 - k) * (1 - k)), lift: Math.max(0, 1 - k / 0.6) ** 1.5 * 70 };
  }
  return { x: B_HOME, lift: 0 };
};
// 爆風が吹いているあいだ(D401): 谷の向こうの投下が始まってから、着陸に入るまで
const bBlast = () => bS.phase === "away" && !bS.seq && bS.booms >= 1;
const bCrew = (id, img, x, y, phase, extra) =>
  Object.assign(
    {
      id,
      x,
      y,
      w: 1,
      h: 1,
      headY: 40,
      draw(ctx, sx, sy, t, api) {
        // 敬礼(D212): 朝、きーが最初に近づいたとき(2.4 秒)と、見送りのあいだ。操縦席のぼぎと同じ形のきーに
        const saluting = (bS.farewell && Math.hypot(this.x - this.line[0], this.y - this.line[1]) < 4) || (bS.salT0 > 0 && bNow() - bS.salT0 < 2.4);
        const im = api.image(saluting ? B_SALUTE[img] : img) || api.image(img);
        if (!im) return;
        const u = saluting ? 0.9 : (t + phase) % 1.3;
        const working = (bS.phase === "morning" || bS.phase === "back") && !bS.farewell; // 帰ってきたら、すぐ傷をふさぐ(D204)。見送るときは手を止める
        const hop = u < 0.12 && working ? 2 : 0; // 整備の手つき
        // D402: 爆風のあいだは、毎朝のことで慣れたクルーも、つぶれて地面に張りつく(きーのふんばると同じ形。言葉なしの手本)
        if (bBlast()) {
          const w = Math.round(im.width * 1.35);
          const h = Math.round(im.height * 0.5);
          ctx.drawImage(im, Math.round(sx - w / 2), Math.round(sy - h), w, h);
          return;
        }
        if (bS.farewell) {
          // 見送るときは、西へ去っていくきーのほうを向く(絵は東向きなので左右を反転。作者「きーの方を向いたほうが」)
          ctx.save();
          ctx.translate(Math.round(sx), 0);
          ctx.scale(-1, 1);
          ctx.drawImage(im, Math.round(-im.width / 2), Math.round(sy - im.height - hop));
          ctx.restore();
        } else ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height - hop));
        if (working && u > 0.1 && u < 0.75) {
          const k = (u - 0.1) / 0.65;
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(30, 30, 40, 0.8)";
          ctx.fillStyle = "#fff6d8";
          ctx.strokeText("カン", sx + 12, sy - im.height - 4 - k * 8);
          ctx.fillText("カン", sx + 12, sy - im.height - 4 - k * 8);
          ctx.restore();
        }
      },
    },
    extra
  );
const B_KICHI = {
  tile: T,
  bg: "#62804e",
  map: kGrid(36, 20, (c, r) => r < 5 || r > 18 || (r < 6 && c >= 2 && c <= 5) || (r < 7 && c >= 26 && c <= 34)), // 森、管制塔、掩体壕(絵に合わせる)
  legend: K_LEGEND,
  drawGround: kImage("bg_kichi", 36 * T, 20 * T),
  spawns: {
    start: { x: 1.2 * T, y: 13.5 * T, facing: "east" },
    morning: { x: 12 * T, y: 17.6 * T, facing: "east" },
  },
  // D401: 谷の向こうの投下のたびに、東から爆風が飛行場へ吹きつける(地ひびきと同じとき)。見届けの間ずっと。
  // ふんばる(ぱーでれで覚える)なら、つぶれて張りつき、旗の台で空を見ていられる。覚えていなければ、西へ押し戻されて見届けられない
  wind(api, x) {
    if (!bBlast() || x < 12 * T) return null;
    const gust = bS.boomAt && bNow() - bS.boomAt < 0.6 ? 160 : 0; // 一発ごとに、ひときわ強く
    return { x: -260 - gust, y: 0 };
  },
  onEnter(api) {
    // 朝の持ち場へ(見送りの列から戻す)
    for (const [id, x, y] of [["crew1", 14.6, 17.3], ["crew2", 18.5, 17.4], ["crew3", 21.6, 17.0]]) Object.assign(B_KICHI.objects.find((o) => o.id === id), { x: x * T, y: y * T });
    if (bS.phase === "loop") {
      bMorning();
      api.toast("つぎの朝", 2.4);
    }
  },
  debug: () => Object.assign({ now: bNow(), loadEnd: B_LOAD_END }, bS),
  drawOverlay(ctx, ox, oy, t) {
    // 谷の向こうの遠い爆発: 東の空がいっとき橙に
    if (bS.phase === "away" && bS.boomed) {
      const u = bNow() - bS.boomAt;
      if (u < 1.4) {
        const vw = ctx.canvas.width / (ctx.getTransform().a || 1);
        const g = ctx.createLinearGradient(vw * 0.5, 0, vw, 0);
        g.addColorStop(0, "rgba(255, 150, 60, 0)");
        g.addColorStop(1, `rgba(255, 150, 60, ${0.35 * (1 - u / 1.4)})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // 山脈の向こうの閃光(D206): 一瞬、東の空が白く光る
        if (u < 0.18) {
          const wg = ctx.createLinearGradient(vw * 0.35, 0, vw, 0);
          wg.addColorStop(0, "rgba(255, 252, 240, 0)");
          wg.addColorStop(1, `rgba(255, 252, 240, ${0.55 * (1 - u / 0.18)})`);
          ctx.fillStyle = wg;
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
      }
    }
    // 撃ち返し(D183)は、山の向こうの一枚絵の迎撃レーザーだけで見せる。飛行場の画面には出さない(作者「飛行場のレーザーはいらないかな」)
    // 発進の地ひびき: 砂ぼこり(D211)
    for (const d of bDust) {
      ctx.fillStyle = `rgba(214, 200, 176, ${Math.max(0, d.a)})`;
      ctx.beginPath();
      ctx.ellipse(Math.round(d.x + ox), Math.round(d.y + oy), d.r * 1.6, d.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 朝の光
    ctx.fillStyle = "rgba(255, 236, 200, 0.08)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  },
  triggers: [
    {
      id: "leave",
      x: -T,
      y: 4 * T,
      w: 1.6 * T,
      h: 15 * T,
      run(api) {
        // 帽子を差し出されて、受け取らずに去る(帽子をかぶったままなら、まだ隊の一員)
        if (bS.offered && !api.flag("cap") && api.hasItem("安全ピンのリボン")) api.clear();
        api.exit();
      },
    },
  ],
  objects: [
    kTrace("t_plane", "t_plane", 8 * T, 17.8 * T), // 滑走路わきの草の中に、色あせた紙飛行機
    // 見届け: 旗の台のあたりで、投下から撃ち返しの光が消えるまで、空を見ている(D189)
    kWatch({ id: "w_sky", x: 24 * T, y: 17.6 * T, r: 4 * T, sec: 5.5, lure: "255, 220, 160", ly: -2 * T, when: () => bS.phase === "away" && bS.booms >= 1 }),
    {
      id: "bctl",
      x: -100,
      y: -100,
      w: 1,
      h: 1,
      draw() {},
      update(dt, t, api) {
        const now = bNow();
        const u = now - bS.t0;
        // 朝、きーが最初に近づくと、クルーは手を止めて敬礼する(D212)
        if (bS.phase === "morning" && !bS.greeted) {
          const pl = api.player();
          const lead = B_KICHI.objects.find((o) => o.id === "crew1");
          if (Math.hypot(pl.x - lead.x, pl.y - lead.y) < 3 * T) {
            bS.greeted = true;
            bS.salT0 = now;
          }
        }
        // 回転が高まりきったら、先頭のクルーが「！」(旗を振る合図)
        const pk = bPeak();
        if (pk && !this._pk) api.bubble("crew1", "！", 700);
        this._pk = pk;
        // 発進の地ひびき: エンジンの回転につれて、地面がふるえる
        const rv = bRev();
        if (rv > 0.85 && (!this._sh || now - this._sh > 0.5)) {
          this._sh = now;
          api.shake(0.45, bS.phase === "taxi" ? 2.5 : 1);
        }
        // 砂ぼこり: プロペラのうしろ(西)へ流れる
        if (rv > 0.2 && (bS.phase === "morning" || bS.phase === "taxi")) {
          const bx = bPose().x;
          const n = Math.random() < rv * 0.9 ? 1 + Math.floor(rv * 2) : 0;
          for (let k = 0; k < n; k++) {
            const [px, py] = B_PROPS[Math.floor(Math.random() * 4)];
            bDust.push({ x: bx - 160 + px - 6, y: 16.5 * T - B_GROUND + py + 30 + Math.random() * 20, vx: -(60 + 160 * rv) * (0.7 + Math.random() * 0.6), r: 3, a: 0.5 * rv, t: 0 });
          }
        }
        for (const d of bDust) {
          d.t += dt;
          d.x += d.vx * dt;
          d.r += 14 * dt;
          d.a -= 0.35 * dt;
        }
        while (bDust.length && (bDust[0].a <= 0 || bDust.length > 160)) bDust.shift();
        // 去る場面(D211): 帽子を差し出されたまま、受け取らずに西へ歩きだすと、クルーは一列に並んで見送る。帽子は滑走路に残る
        if (bS.phase === "back" && bS.offered && !api.flag("cap") && !bS.farewell && api.player().x < 12.5 * T) {
          bS.farewell = true;
          const lead = B_KICHI.objects.find((o) => o.id === "crew1");
          bS.capAt = { x: lead.x + 8, y: lead.y };
        }
        if (bS.phase === "taxi" && u > 8) {
          bS.phase = "away";
          bS.t0 = now;
          // 爆撃は直接見せない(D206)。一枚絵で(D209): 山脈へ遠ざかる → 見えなくなる → 稜線の向こうの白い光、火の玉、煙の柱 → 迎撃レーザーの乱射、一本がボマーをかすめる(D210)
          bS.seq = true;
          const fr = (img, sec, fadeIn) => ({ img, sec, z0: 1, z1: 1.03, cx: 240, cy: 144, ease: "out", fadeIn });
          api.burst(
            [fr("v_fly1", 1.1, 0.6), fr("v_fly2", 1.1, 0.3), fr("v_fly3", 1.1, 0.3), fr("v_fly4", 1.2, 0.3), fr("v_fly5", 2, 0.4), fr("v_boom1", 0.35), fr("v_rain01", 0.42), fr("v_rain02", 0.42), fr("v_rain03", 0.42), fr("v_rain04", 0.42), fr("v_rain05", 0.42), fr("v_rain06", 0.42), fr("v_rain07", 0.42), fr("v_rain08", 0.3), fr("v_rain09", 0.3), fr("v_rain10", 0.3), fr("v_rain11", 0.3), fr("v_rain12", 0.3), fr("v_rain13", 0.3), fr("v_rain14", 0.3), fr("v_rain15", 0.3), fr("v_rain16", 0.3), fr("v_laser1", 0.35), fr("v_laser2", 0.35), fr("v_laser1", 0.3), fr("v_laser2", 0.3), fr("v_laser1", 0.3), fr("v_laser3", 1.6)],
            () => {
              bS.seq = false;
              bS.t0 = bNow(); // 飛行場に戻ってから、遠い地ひびきの余韻
            },
            { white: false }
          );
          // 全弾投下(D217): 爆発の一つ一つに合わせて、光から少し遅れて(山の向こうの遠さ)、音と地ひびきが届く。
          // 後ろほど大きく、間もつまって、さいごは画面ごと暴れる(作者「爆発に合わせて、ラグを設けて、画面を揺らしたい」)
          const LAG = 0.55;
          const hit = (sec, amp, len) => {
            api.later(Math.round(sec * 1000), () => api.shake(len, amp));
            api.later(Math.round(sec * 1000), () => api.sfx("boom"));
          };
          const t0 = 1.1 + 1.1 + 1.1 + 1.2 + 2; // v_boom1 が出るまで
          hit(t0 + LAG + 0.15, 7, 1.4); // 最初の閃光。いちばん遠くから、重く
          let at = t0 + 0.35;
          B_RAIN_HITS.forEach(([n, size], f) => {
            const dur = f < 7 ? 0.42 : 0.3;
            for (let i = 0; i < n; i++) hit(at + LAG + (i * dur) / n, Math.min(12, 1.5 + (size / n) * 2.2 + f * 0.45), 0.5 + f * 0.03);
            at += dur;
          });
          hit(at + LAG + 0.4, 10, 2.2); // 煙の壁の向こうから、さいごの地ひびき
        }
        // 谷の向こうで、つづけざまに落とす(殺傷力は高め D182)
        if (bS.phase === "away" && !bS.seq && u > 2.5 + bS.booms * 0.45 && bS.booms < 7) {
          bS.booms += 1;
          bS.boomed = true;
          bS.boomAt = now;
          api.shake(0.5, 2 + bS.booms * 0.6);
          if (bS.booms === 1) api.bubble("valley", "ドォン　ドォン　ドォン……", 3400);
        }
        if (bS.phase === "away" && !bS.seq && bS.booms >= 7 && !bS.answered && u > 6) {
          bS.answered = true;
          api.shake(0.4, 2);
          api.bubble("valley", "ブン……", 1600);
        }
        if (bS.phase === "away" && !bS.seq && u > 9) {
          bS.phase = "landing";
          bS.t0 = now;
        }
        // 着陸に切りかわった同じ瞬間に、古い経過時間で終わらないように、ここで測りなおす
        if (bS.phase === "landing" && bNow() - bS.t0 > B_LAND_SEC) {
          bS.phase = "back";
          bS.t0 = now;
          // 止まった機体の下にきーがいたら、南へよける
          const p = api.player();
          if (p.x > 12 * T && p.x < 22 * T && p.y > 10 * T && p.y < 16.9 * T) api.place(p.x, 17.4 * T);
        }
      },
    },
    {
      // 谷の向こう(東)の音の出どころ。きーの右上についてくる
      id: "valley",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      headY: 60,
      draw() {},
      update(dt, t, api) {
        const p = api.player();
        this.x = p.x + 4 * T;
        this.y = p.y - 2 * T;
      },
    },
    {
      // 並べた爆弾とミサイル。地面の高さなので、いちばん奥に描く
      id: "munitions",
      x: B_NOSE.x + 4 * T, // 列のまん中あたり(画面の外で描くのを省かれないように)
      y: B_NOSE.y,
      sortDy: -10 * T, // 地面に置いてあるので、いちばん奥に描く
      w: 1,
      h: 1,
      update(dt, t, api) {
        // 爆装を一度見届けたら覚えておく。2 回目からは、A で見せ場を飛ばすと、爆装も終わったことにする(D268)
        if (bS.phase === "morning" && bLoaded() >= B_BOMBS.length) api.setFlag("loadSeen");
        else if (bS.phase === "morning" && bS.shown && !api.camPathOn() && api.flag("loadSeen")) bS.loadT0 = bNow() - B_LOAD_END - 0.1;
        // 朝の見せ場(D222): 朝が始まったら一度だけ。カメラが運び出しから積みこみまでを追う(A で飛ばせる)
        if (bS.phase !== "morning" || bS.shown) return;
        const e = bCarryT();
        if (e > 2) return; // 途中から(撮影の道具などで)入ったときは見せない
        bS.shown = true;
        const keys = bShowKeys().map((k) => Object.assign({}, k, { t: Math.max(0, k.t - e) }));
        api.camPath(keys);
        api.later(Math.max(0, (B_SHOW.photo - e) * 1000), () => {
          if (bS.phase !== "morning" || !api.camPathOn()) return;
          api.sfx("shutter");
          api.flash(0.45);
        });
      },
      draw(ctx, sx, sy, t, api) {
        // 朝は積んだ分だけ地面から消える。帰ってきたあとは、機首に近い列から地面に並べなおされる(D204)
        for (const b of B_BOMBS) {
          if (!bOnGround(b)) continue;
          const im = api.image(b.img);
          if (im) ctx.drawImage(im, Math.round(sx - this.x + b.x - im.width / 2), Math.round(sy - this.y + b.y - im.height / 2));
        }
      },
    },
    {
      id: "bomber",
      x: B_HOME,
      y: 10.5 * T,
      sortDy: 6 * T, // 重なり順は、機体が地面に接する所で決める(北にいるきーは、翼の向こうに隠れる)
      w: 1,
      h: 1,
      headY: 200,
      get solid() {
        return bS.phase === "morning" || bS.phase === "back" ? { w: 5 * T, h: 0.8 * T, dx: 1.4 * T, dy: 5.7 * T } : null;
      },
      hidden: () => bS.phase === "away",
      update() {
        this.x = bPose().x;
      },
      draw(ctx, sx, sy, t, api) {
        const im = api.image("bomber");
        const sh = api.image("bomber_shadow");
        if (!im) return;
        const { lift } = bPose();
        const x0 = Math.round(sx - im.width / 2);
        const y0 = Math.round(sy + (B_Y - 10.5 * T) - B_GROUND);
        if (sh) ctx.drawImage(sh, x0 + Math.round(lift * 0.3), y0 + Math.round(lift * 0.6));
        // ジュラルミン無塗装の XB-35(D205)。帰ってきたときはボロボロ(D206)。クルーがふさいでいくと、少しずつ元の銀にもどる
        const ly = y0 - Math.round(lift);
        const dmg = api.image("bomber_dmg");
        const hurt = bS.phase === "landing" ? 1 : bS.phase === "back" ? Math.max(0, 1 - Math.max(0, bNow() - bS.t0 - 5) / 30) : 0; // みんなが翼に散ってから、30 秒ほどで傷がふさがる(D223)
        // 浮き上がるとき、機首が少し上がる(主脚のあたりを軸に)
        const pitch = bS.phase === "taxi" ? Math.min(0.1, lift * 0.004) : bS.phase === "landing" ? Math.min(0.06, lift * 0.002) : 0;
        ctx.save();
        if (pitch) {
          const px0 = x0 + 160;
          const py0 = ly + B_GROUND;
          ctx.translate(px0, py0);
          ctx.rotate(-pitch);
          ctx.translate(-px0, -py0);
        }
        // 後ろ向きのプロペラ 4 基。エンジンが回っているあいだは、止まった羽根のない絵にして、回る円盤を描く。帰りは 1 基もげている
        const running = bS.phase === "taxi" || bS.phase === "landing" || (bS.phase === "morning" && bS.chocks);
        ctx.drawImage((running && api.image("bomber_spin")) || im, x0, ly);
        if (dmg && hurt > 0) {
          ctx.save();
          ctx.globalAlpha = hurt;
          ctx.drawImage((running && api.image("bomber_dmg_spin")) || dmg, x0, ly);
          ctx.restore();
        }
        B_PROPS.forEach(([px, py], i) => {
          if (hurt > 0 && i === 2 && bS.phase !== "morning") {
            // もげたプロペラの付け根から、黒い煙
            if (bS.phase === "landing") {
              for (let k = 0; k < 6; k++) {
                const u = (t * 1.5 + k / 6) % 1;
                ctx.fillStyle = `rgba(40, 36, 34, ${0.5 * (1 - u)})`;
                ctx.beginPath();
                ctx.arc(x0 + px - 6 - u * 60, ly + py + Math.sin(k + t) * 3, 4 + u * 10, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            return;
          }
          if (!running) return;
          const cx = x0 + px;
          const cy = ly + py;
          // 回る円盤(うすい灰)と、ふちのにじみ。羽根の影が 3 枚、ちらちら回る。回転が上がるほど濃く
          const rvk = bS.phase === "landing" ? 0.8 : Math.max(0.35, bRev());
          ctx.fillStyle = `rgba(190, 194, 200, ${0.42 * rvk})`;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 4, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(120, 124, 130, 0.5)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 4, 20, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = "rgba(40, 40, 46, 0.55)";
          ctx.lineWidth = 2;
          for (let k = 0; k < 3; k++) {
            const a = t * (14 + 30 * rvk) + i * 0.7 + (k * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 19);
            ctx.stroke();
          }
        });
        if (bS.phase === "landing" || bS.phase === "back") {
          // 裂け目に、撃ち返しと同じ白紫の光がまとわりついて明滅する。着地のあとで、ふっと消える(D204)
          const ga = bS.phase === "landing" ? 1 : Math.max(0, 1 - (bNow() - bS.t0) / 1.4);
          if (ga > 0) {
            const fl = (0.55 + 0.45 * Math.abs(Math.sin(t * 17) * Math.sin(t * 5.3))) * ga;
            const cx = x0 + 120;
            const cy = ly + 175;
            kGlowAt(ctx, cx, cy, 56, "200, 170, 255", 0.75 * fl);
            kGlowAt(ctx, cx, cy, 16, "255, 255, 255", 1 * fl);
            // 裂け目から走る、細い白紫のすじ(撃ち返しの光と同じ色)
            ctx.strokeStyle = `rgba(245, 230, 255, ${fl})`;
            ctx.lineWidth = 1;
            for (let k = 0; k < 4; k++) {
              if (Math.sin(t * 23 + k * 2.1) < 0.2) continue;
              const a = k * 1.6 + Math.sin(t * 3 + k);
              ctx.beginPath();
              ctx.moveTo(cx, cy);
              ctx.lineTo(cx + Math.cos(a) * 12 + Math.sin(t * 40 + k) * 3, cy + Math.sin(a) * 8);
              ctx.lineTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 15 + Math.sin(t * 31 + k) * 3);
              ctx.stroke();
            }
          }
        }
        ctx.restore(); // 機首の上げ下げ、ここまで
        if (bS.phase === "morning" || bS.phase === "back") {
          // 安全ピンのリボンと、車輪止め(朝の手順)
          const rb = api.image("i_ribbon");
          if (rb && !bS.pin) ctx.drawImage(rb, Math.round(sx + B_GEAR.main - rb.width / 2), Math.round(sy + 5.6 * T - rb.height / 2)); // 主脚にさがっている
          const ck = api.image("chock");
          if (ck) {
            const cx = bS.chocks ? sx + B_GEAR.nose + 1 * T : sx + B_GEAR.nose; // 主脚の車輪に
            ctx.drawImage(ck, Math.round(cx - ck.width / 2), Math.round(sy + (bS.chocks ? 6.7 : 5.95) * T - ck.height / 2));
          }
        }
      },
    },
    {
      id: "pin",
      x: B_HOME + B_GEAR.main,
      y: 17.1 * T,
      w: 1,
      h: 1,
      draw() {},
      range: 40,
      canInteract: () => bS.phase === "morning" && !bS.pin,
      interact(api) {
        if (bStep() !== 0) return api.bubble("crew1", "……", 1000); // まだ合図が来ていない(爆装の途中)
        bS.pin = true;
        if (api.hasItem("安全ピンのリボン")) return api.mutter("……", 900);
        // 抜いたリボンは、朝の風にさらわれて、滑走路のわきの草むらへ(D203)
        api.setFlag("ribbonBlown");
        bRibbonT0 = performance.now() / 1000;
      },
      drawOver(ctx, sx, sy, t) {
        if (bRibbonT0 < 0) return;
        const u = (performance.now() / 1000 - bRibbonT0) / 1.4;
        if (u >= 1) return;
        const x = sx + (B_RIBBON.x - this.x) * u;
        const y = sy + (B_RIBBON.y - this.y) * u - Math.sin(u * Math.PI) * 50;
        ctx.fillStyle = "#d8262c";
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        ctx.rotate(Math.sin(u * 20) * 0.8);
        ctx.fillRect(-2, -8, 4, 16);
        ctx.restore();
      },
    },
    // 草むら(D203): 飛ばされたリボンが、背の高い草の中に落ちて、赤い端がのぞいている(まわるはやめた D226。そのまま拾える)
    {
      id: "kusa",
      x: B_RIBBON.x,
      y: B_RIBBON.y,
      w: 1,
      h: 1,
      headY: 24,
      range: 36,
      canInteract: (api) => bRibbonLanded(api) && !api.hasItem("安全ピンのリボン"),
      draw(ctx, sx, sy, t, api) {
        const im = api.image("kusa");
        if (im) {
          for (const [dx, dy] of [[-12, -2], [10, -4], [0, 3], [-20, 6], [18, 5]]) {
            const sway = Math.round(Math.sin(t * 2.4 + dx) * 1.5);
            ctx.drawImage(im, Math.round(sx + dx - im.width / 2 + sway), Math.round(sy + dy - im.height));
          }
        }
        // 草の間から、リボンの赤い端が風にゆれている
        if (bRibbonLanded(api) && !api.hasItem("安全ピンのリボン")) {
          ctx.fillStyle = "#d8262c";
          ctx.save();
          ctx.translate(Math.round(sx + 3), Math.round(sy - 10));
          ctx.rotate(0.5 + Math.sin(t * 3) * 0.25);
          ctx.fillRect(-2, -7, 4, 10);
          ctx.restore();
        }
      },
      interact(api) {
        api.hold("ic_ribbon", 1.8, () => api.giveItem("安全ピンのリボン"));
      },
    },
    {
      id: "chocks",
      x: B_HOME + B_GEAR.nose,
      y: 17.1 * T,
      w: 1,
      h: 1,
      draw() {},
      range: 40,
      canInteract: () => bS.phase === "morning" && !bS.chocks,
      interact(api) {
        if (bStep() !== 1) return api.bubble("crew1", "……", 1000); // ピンが先
        bS.chocks = true;
        bS.revT0 = bNow(); // エンジンがかかる
        api.bubble("crew1", "カン", 700);
        api.sfx("whir");
      },
    },
    {
      id: "flag",
      x: 24 * T,
      y: 17.9 * T,
      w: 1,
      h: 1,
      headY: 44,
      draw(ctx, sx, sy, t, api) {
        const im = api.image("flag");
        if (!im) return;
        const waving = bS.phase === "taxi" && bNow() - bS.t0 < 2.5;
        // 合図: いまの手順の所が、きらっと光る(旗は、回転が高まりきった一瞬だけ強く)
        const st = bStep();
        const spot = st === 0 ? [B_HOME + B_GEAR.main, 16.2 * T] : st === 1 ? [B_HOME + B_GEAR.nose, 16.3 * T] : st === 2 ? [this.x, this.y - 30] : null;
        if (spot) {
          const sx2 = sx + spot[0] - this.x;
          const sy2 = sy + spot[1] - this.y;
          const on = st === 2 ? (bPeak() ? 1 : 0.25) : 0.5 + 0.5 * Math.sin(t * 5);
          kGlowAt(ctx, sx2, sy2, st === 2 && bPeak() ? 26 : 14, "255, 240, 190", 0.8 * on);
          kSparkle(ctx, sx2 + 6, sy2 - 6, 2 + 2 * on, on, "255, 240, 190");
        }
        ctx.save();
        ctx.translate(Math.round(sx), Math.round(sy - 6));
        if (waving) ctx.rotate(Math.sin(t * 12) * 0.5);
        ctx.drawImage(im, -3, -im.height);
        ctx.restore();
      },
      range: 40,
      canInteract: () => bS.phase === "morning",
      interact(api) {
        if (bStep() !== 2) return api.bubble("crew1", "……", 1200); // まだ手順(と爆装)が残っている
        if (!bPeak()) {
          // 回転が高まりきっていない(または落ちはじめた): もう一度、高まるのを待つ
          api.bubble("crew1", "……", 900);
          return;
        }
        bS.phase = "taxi";
        bS.t0 = bNow();
        api.shake(0.6, 3);
      },
    },
    bCrew("crew1", "crew_hawk", 14.6 * T, 17.3 * T, 0, {
      range: 40,
      iy: 0, // 重なり順を変えても、調べる距離は足もとから
      line: [12.6 * T, 16.95 * T],
      update(dt, t, api) {
        // 帽子を持って機体の向こう(北)へ歩くときは、翼の上を越えていく(機体の陰に隠れない。修理のぼぎと同じ)
        this.sortDy = bS.phase === "back" && !bS.farewell && this.y < B_Y ? B_Y - this.y + 2 : 0;
        if (bS.farewell) return bWalkTo(this, this.line, dt);
        // 帰ってきたら、帽子を差し出しに、きーのほうへ歩いてくる
        if (bS.phase !== "back" || api.flag("cap")) return;
        bS.offered = true;
        const p = api.player();
        const dx = p.x - this.x;
        const dy = p.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 28 && p.x > 4 * T) {
          this.x += (dx / dist) * 34 * dt;
          this.y += (dy / dist) * 34 * dt;
        }
      },
      draw(ctx, sx, sy, t, api) {
        bCrew("", "crew_hawk", 0, 0, 0).draw.call(this, ctx, sx, sy, t, api);
        const cap = api.image("cap");
        if (cap && bS.phase === "back" && !api.flag("cap") && !bS.farewell) ctx.drawImage(cap, Math.round(sx + 8), Math.round(sy - 30 + Math.sin(t * 3) * 2));
      },
      canInteract: (api) => bS.phase === "back" || bS.phase === "morning",
      interact(api) {
        if (bS.phase === "morning") return api.bubble("crew1", "カン　カン", 1200);
        if (api.flag("cap")) {
          // 帽子を返す
          api.setFlag("cap", false);
          api.bubble("crew1", "……", 1400);
          return;
        }
        // 受け取ると、隊の一員になって、同じ朝がもう一度来る
        api.setFlag("cap", true);
        api.hold("cap", 1.6, () => {
          bS.phase = "loop";
          api.warp("kichi", "morning");
        });
      },
    }),
    bCrew("crew2", "crew_wagtail", 18.5 * T, 17.4 * T, 0.45, { line: [13.7 * T, 16.95 * T], update(dt) { if (bS.farewell) bWalkTo(this, this.line, dt); } }),
    bCrew("crew3", "crew_rooster", 21.6 * T, 17.0 * T, 0.8, { line: [14.8 * T, 16.95 * T], update(dt) { if (bS.farewell) bWalkTo(this, this.line, dt); } }),
    ...Array.from({ length: B_PORTER_N }, (_, j) => ({
      // 運び手のぼぎ。クルーと同じ三つの形
      id: `porter${j}`,
      x: B_HANGAR.x,
      y: B_HANGAR.y,
      w: 1,
      h: 1,
      img: ["crew_hawk", "crew_wagtail", "crew_rooster"][j % 3],
      seg: null,
      hidden() {
        return !this.seg;
      },
      update() {
        const e = bCarryT();
        const segs = e === null ? null : B_SEGS[bS.phase][j]; // 修理は、きーが去るあいだも続く
        this.seg = (segs && segs.find((sg) => sg.t0 <= e && e < sg.t1)) || null;
        if (!this.seg) return;
        const sg = this.seg;
        const k = Math.min(1, (e - sg.t0) / Math.max(0.01, sg.t1 - sg.t0 - 0.25)); // さいごの 0.25 秒は、かつぐ・下ろす
        this.x = sg.from.x + (sg.to.x - sg.from.x) * k;
        this.y = sg.from.y + (sg.to.y - sg.from.y) * k + 6;
        if (sg.to.x !== sg.from.x) this.west = sg.to.x < sg.from.x;
        this.moving = k < 1 && sg.to !== sg.from;
        // 修理の持ち場は翼の上なので、機体より手前に描く
        this.sortDy = sg.pose === "repair" && sg.to.wing ? B_Y - this.y + 2 : 0;
        if (sg.pose === "repair") this.west = j % 2 === 1; // 持ち場では、半分ずつ左右を向く
        this.e = e;
      },
      draw(ctx, sx, sy, t, api) {
        const im = api.image(this.seg && this.seg.pose === "salute" ? B_SALUTE[this.img] : this.img) || api.image(this.img);
        if (!im || !this.seg) return;
        // 小走り。修理は、ぴょこぴょこ小刻みに上下する(作者「ぴょこぴょこ上下に小刻みに動いていると、修理みたいになる」)
        const hop = this.moving ? (Math.floor(this.e * 9 + j) % 2 ? 2 : 0) : this.seg.pose === "repair" ? [0, 1, 2, 1][Math.floor(this.e * 14 + j * 1.7) % 4] : 0;
        const b = this.seg.carry ? api.image(this.seg.carry) : null;
        ctx.save();
        ctx.translate(Math.round(sx), Math.round(sy - hop));
        if (this.west) ctx.scale(-1, 1); // 絵は東向き。西へ行くときは反転
        ctx.drawImage(im, -Math.round(im.width / 2), -im.height);
        ctx.restore();
        if (b) ctx.drawImage(b, Math.round(sx - b.width / 2), Math.round(sy - hop - im.height - b.height + 6)); // 頭の上にかついで
        if (this.seg.pose === "repair") {
          // 金づちをふるう: 打つたびに小さな火花
          const u = (this.e * 1.6 + j * 0.37) % 1;
          if (u < 0.18) {
            const fx = Math.round(sx + (this.west ? -10 : 10));
            const fy = Math.round(sy - 6);
            ctx.fillStyle = u < 0.08 ? "#fffbe0" : "#ffc24a";
            ctx.fillRect(fx, fy, 2, 2);
            ctx.fillRect(fx + (j % 2 ? 3 : -3), fy - 2, 1, 1);
            ctx.fillRect(fx + (j % 2 ? -2 : 2), fy - 3, 1, 1);
          }
        }
      },
    })),
    {
      // 差し出されたまま、受け取られなかった帽子。滑走路に置かれている(D211)
      id: "capLeft",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      hidden: () => !bS.farewell || !bS.capAt,
      update() {
        if (bS.capAt) Object.assign(this, bS.capAt);
      },
      draw(ctx, sx, sy, t, api) {
        const cap = api.image("cap");
        if (cap) ctx.drawImage(cap, Math.round(sx - cap.width / 2), Math.round(sy - cap.height + 2));
      },
    },
    {
      // 帽子をかぶっている(隊の一員)
      id: "capOn",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      hidden: (api) => !api.flag("cap"),
      update(dt, t, api) {
        const p = api.player();
        this.x = p.x;
        this.y = p.y + 1;
      },
      draw(ctx, sx, sy, t, api) {
        const cap = api.image("cap");
        if (cap) ctx.drawImage(cap, Math.round(sx - cap.width / 2), Math.round(sy - 34));
      },
    },
  ],
};
