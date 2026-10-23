// 断片: 呪いの野犬(4/4)。E 競争の画面(うしろから、横向きの再現)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、nS、nMap など)をそのまま使う
"use strict";

// E 競争(D133、D134、D146、D148、D152): スタートはうしろから(バーンナウト、信号、青で A、発進のウィリー)。押して 1.1 秒で、横向きの再現シーンへ切りかえ、
// 青の少し前から同じ出来事を真横から見せる。左がスタート(過去)、右がゴール(未来)。ウィリーはスタートのときだけ、うしろからも横からも。2 台ずつの勝ち抜き戦
// 手前に信号の柱(ツリー)。手順は本物のドラッグレース(D125): バーンナウト(タイヤが空まわりして白煙)→ ステージ → 黄が 0.5 秒ごと → 青で A(青より前は赤で負け)→ 発進
// 赤べこは前輪を上げて出る(ウィリー)。カメラは先を行く車を追って右へ流れ、ゴールは右のはし
// 5 台の勝ち抜き戦(D367): 1 回戦 ぽんぽんカー(ゴールの手前で線がのびきり、左の峠(過去)のドラム缶へ引き戻される)→ 2 回戦 とりぼぎかー
// → 3 回戦 車箪笥 → 準決勝 赤べこ → 決勝 こけし(遅い順)。負けたらその回からやり直し。回の合間に対戦カード
// ゴール: 勝った側の灯り、空っぽのスタンドに、かつてのちゃんの見物人の影が満ちて消える(歓声 D126)
// きーは歩きの絵の右向きを、同じ描き方で 2 倍に直接描いた絵(勝手に作らない D134、docs/assets/noroi/race/ki_side.py)。青で押すと、つぶれて背中に張り付く(粘着駆動 D123)
// マシンの絵は三面図(docs/assets/noroi/sanmen/)の横の下絵から。空・スタンド・道は 1 ドット = ゲームの 1 ドット(D145)
const N_RACE_D = 402; // クォーターマイル(m)
const N_GREEN = 5.6; // 青の時刻(ステージ 3.4、黄 4.1、4.6、5.1)
const N_KI_ET = 2.4; // ぼぎカーは無慣性: 押した瞬間に全速、ゴールまで 2.4 秒
// 相手: ゴールまでの時間(青から)。ぼぎカーが勝つには、青から押すまでが (et - 2.4) 秒より短いこと
const N_ROUNDS = [
  { id: "ponpon", img: "rcs_pon", name: "１かいせん", et: 3.0, snap: 0.86, lift: 0.07, snd: "pon" }, // バンジーで戻されるので、フライングしなければ勝てる
  { id: "toribogi", img: "rcs_tori", name: "２かいせん", et: N_KI_ET + 1.4, lift: 0, snd: "jet" },
  { id: "tansu", img: "rcs_tansu", name: "３かいせん", et: N_KI_ET + 1.2, lift: 0, rattle: 2, snd: "v8big" }, // ヘミ V8 の重い箱。出だしで引き出しがガタつく(みとんが中に乗る)
  { id: "akabeko", img: "rcs_aka", name: "じゅんけっしょう", et: N_KI_ET + 0.9, lift: 0.2, snd: "v8" },
  { id: "kokeshi", img: "rcs_kokeshi", name: "けっしょう", et: N_KI_ET + 0.6, lift: 0.1, snd: "bike" }, // いちばん速い。反応が遅いと負ける
];
// D341 の優勝のあとの一騎打ちはやめた(D367。作者「もう一度レースしたいなら、ピンボールでリプレイでいい。」)
const nCurRd = () => N_ROUNDS[nr.round];
const N_PX = 3; // 1 m = 3 ドット
const N_SNAP_HOLD = 0.35; // ぽんぽんカーの線が張って止まっている秒(D338)
const N_SNAP_FLY = 1.0; // そこから峠へ飛んでいく秒
const N_SX = 196; // スタートの線(世界の x)。マシンの鼻先がここにそろう
const N_FX = N_SX + N_RACE_D * N_PX; // ゴールの線
const N_GY = { opp: 220, ki: 286 }; // 奥の車線と手前の車線の地面の y
const N_TREE = { x: 214, foot: 298, xs: [7, 23], ys: [8, 24, 40, 56, 72, 89, 105], r: 5 }; // 手前の信号の柱(左の列 = 相手、右の列 = ぼぎカー)
const N_LAMP = { stage: "#f4f0dc", amber: "#ffbe3c", green: "#7cf08a", red: "#ff4a3c" };
const nr = { t0: 0, foul: -1, go: -1, end: null, endT: 0, snapT: -1, round: 0, repT: -1, rep0: 0, flash: -1 };
// 今の回(0〜4)。前の 3 回戦のころの記録(nrR1、nrR2)も読む
const nRound = (api) => Math.min(N_ROUNDS.length - 1, Number(api.flagValue("nrRound")) || (api.flag("nrR2") ? 2 : api.flag("nrR1") ? 1 : 0));
const nRaceReset = (api) => {
  nr.t0 = nNow();
  nr.foul = -1;
  nr.go = -1;
  nr.end = null;
  nr.snapT = -1;
  nr.snapSfx = false;
  nr.repT = -1;
  nr.flash = -1;
  nr.round = nRound(api);
  nRcPuffs.length = 0;
  nRrPuffs.length = 0;
};
// 相手の位置(m)。青から少し遅れて出て、だんだん速く
// ゴールのあとは慣性で走り抜け、N_BRAKE 秒のブレーキで止まる(D347。相手は無慣性ではない)
const N_BRAKE = 1.2;
const nOpp = (rd, t) => {
  const react = 0.25;
  if (t <= react) return 0;
  if (t <= rd.et) return N_RACE_D * Math.pow((t - react) / (rd.et - react), 1.7);
  const vf = (N_RACE_D * 1.7) / (rd.et - react); // ゴールでの速さ(m/秒)
  const d = Math.min(N_BRAKE, t - rd.et);
  return N_RACE_D + vf * d - (0.5 * vf * d * d) / N_BRAKE;
};
// 時計: うしろからの画面では本当の時間。横向きの再現シーンでは、青の少し前から同じ出来事をもう一度たどる
const nRaceState = () => {
  const real = nNow() - nr.t0;
  const s = nr.repT >= 0 ? nr.rep0 + (real - nr.repT) : real;
  const rd = nCurRd();
  const ki = nr.go < 0 ? 0 : Math.max(0, Math.min(N_RACE_D + 24, (s - nr.go) * (N_RACE_D / N_KI_ET))); // 無慣性なので、ゴールを過ぎたらその場でぴたりと止まる
  let opp = nr.foul >= 0 ? 0 : nOpp(rd, s - N_GREEN);
  let back = 0;
  let taut = 0;
  if (rd.snap) {
    const lim = N_RACE_D * rd.snap;
    if (opp >= lim && nr.snapT < 0) nr.snapT = s;
    if (nr.snapT >= 0) {
      // 線がのびきる: まず「ピン」と張って一瞬止まり(前へ少しのびる)、それからゴムのように左の峠(過去)へ飛んでいく(D338)
      const d = s - nr.snapT;
      if (d < N_SNAP_HOLD) {
        opp = lim + 2 * Math.sin((Math.PI * d) / N_SNAP_HOLD);
        taut = 1 - d / N_SNAP_HOLD;
      } else {
        const u = Math.min(1, (d - N_SNAP_HOLD) / N_SNAP_FLY);
        opp = lim - (lim + 90) * u * u;
        back = Math.max(0.001, u);
      }
    }
  }
  return { s, real, rd, ki, opp, back, taut };
};
// タイムスリップ(D346、作者「無慣性粘着駆動が卑怯という演出をいれたい」): ぼぎカーのイーティーは、押した時刻に関係なく毎回まったく同じ 2.400。
// 最高速は「----」(はかれない)。相手の欄には、ふつうの数字。説明はせず、数字だけで気づかせる
// 勝ってからタイムスリップを出すまで(ミリ秒)。相手が戻ってきて空ぶかしするのを待つ(D347)
const nSlipDelay = (rd, s) => (rd.snap ? 3400 : Math.max(3400, (nProtestT0(rd) + N_PROTEST.back + N_PROTEST.rev - s) * 1000));
const nSlip = (rd, rt) => [
  `リアクション　${rt}`,
  `イーティー　${N_KI_ET.toFixed(3)}`,
  `さいこうそく　----`,
  rd.snap ? `あいて　ゴールせず` : `あいて　${(rd.et - 0.25 + Math.random() * 0.04).toFixed(3)}`,
];
// 負けた相手の抗議(D346): ゴールのあと、相手がぼぎカーのとなりへ戻ってきて、何度もエンジンをふかす。言葉はなく、音としぐさだけ
// 動き(D347、作者「走り抜けてから戻ってきて空ぶかししないとおかしいでしょ。ほかのマシンも無慣性駆動ってことになるじゃない。」):
// ゴールを走り抜け(nOpp のブレーキで止まる)→ 0.3 秒おいて、バックでぼぎカーのとなりへ戻る(ゆっくり動きだし、ゆっくり止まる)→ 空ぶかし
// 返す値: null か { pos(m), rev(0〜1) }。ぽんぽんカーは峠へ引き戻されたので、しない
const N_PROTEST = { wait: 0.3, back: 1.8, rev: 2.2 };
const nProtestT0 = (rd) => N_GREEN + rd.et + N_BRAKE + N_PROTEST.wait; // バックしはじめる時刻(競争の時計)
const nProtest = (st0) => {
  const { s, rd, ki } = st0;
  if (nr.end !== "win" || rd.snap || nr.repT < 0) return null;
  const t0 = nProtestT0(rd);
  if (s < t0) return null;
  const stop = nOpp(rd, rd.et + N_BRAKE + 1); // 止まった所
  const target = ki + 6; // ぼぎカーのとなり、鼻先を少し前に
  const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const w = sm((s - t0) / N_PROTEST.back);
  return { pos: stop + (target - stop) * w, rev: s >= t0 + N_PROTEST.back ? 1 : 0, backing: s < t0 + N_PROTEST.back };
};
// 排気管の炎(D349、作者「排気管からは、炎がバリバリと出てくる演出をすると、強大なパワーを感じさせられるので、いれて」
// 「それ以外でも排気管があるマシンには炎をえがいて」)。絵の中の排気管の口の位置(ドット)と、炎の向き。向き 0,0 は手前へ噴く(うしろから見た口)
// 車箪笥は絵に排気管が見えない、とりぼぎかーはジェットなので、なし
const N_FLAME = {
  rcs_aka: [[56, 64, -1, 0.15]],
  rc_aka_back: [[20, 49, 0, 0], [21, 53, 0, 0], [22, 57, 0, 0], [73, 49, 0, 0], [72, 53, 0, 0], [71, 57, 0, 0]], // 胴の左右の横腹の外の口 6 つから手前へ(D357)
  rcs_pon: [[22, 33, -0.6, -1], [36, 34, -0.6, -1], [48, 34, -0.6, -1], [59, 35, -0.6, -1]], // 絵を左へ 4 ドット広げた分(D418)
  rc_pon_back: [[25, 43, -0.6, -1], [23, 49, -0.6, -1], [21, 54, -0.6, -1], [18, 63, -0.6, -1], [149, 43, 0.6, -1], [151, 49, 0.6, -1], [153, 54, 0.6, -1], [156, 63, 0.6, -1]], // 左右 4 本ずつ。炎は管の傾き(外へ 20、上へ 32)に合わせて V 字に(D361、作者「マフラーの角度に合うようにV字に」)
  rcs_kokeshi: [[8, 62, -1, -0.35]],
  rc_kokeshi_back: [[5, 66, 0, 0], [29, 66, 0, 0]],
};
// 炎の強さ(0〜1) = アクセルの開き(D356、作者「排気炎、アイドリングではでないが小さい。アクセル開度に比例して炎が大きくなる。」)。
// アイドリングは出さない。バーンナウトとステージのあおりは開いたぶんだけ、走っている間は全開(ギアの変わり目で一瞬もどる)、ゴールのあとは閉じていく。
// 大げさに(D350、作者「排気管の炎は大げさなほうがいい。バリバリバリバリバリってかんじで、排気煙のフレアパターンが高速で切り替わるとかっけえな」)
const nThrottle = (st0) => {
  const { s, rd, opp, back, taut } = st0;
  const st = s - N_GREEN;
  let T = 0.04; // アイドリング
  if (s > 1 && s < 3.2) T = 0.8 + 0.15 * Math.sin(s * 9); // バーンナウト
  if (s >= 3.2 && st < 0) T = 0.05 + 0.75 * Math.max(0, Math.sin(s * 5)); // ステージのあおり
  if (st >= 0 && nr.foul < 0 && !back && !(taut > 0)) {
    if (opp < N_RACE_D) {
      T = 1;
      const g = (Math.max(0, opp) / N_RACE_D) * 3.2;
      if (g % 1 < 0.08 && g > 0.5) T = 0.45; // ギアを変える一瞬、アクセルを戻す
    } else T = Math.max(0.04, 0.6 - (s - (N_GREEN + rd.et)) * 0.6); // ブレーキで、閉じていく
  }
  const pr = nProtest(st0);
  if (pr) T = pr.rev ? 0.05 + 0.95 * Math.max(0, Math.sin(s * 11)) : 0.12;
  return T;
};
const nFlameI = (st0) => {
  const T = nThrottle(st0);
  return T < 0.15 ? 0 : T; // アイドリングと、ほんの少し開いただけでは出ない
};
// とりぼぎかーの子がもターボジェット(D352、D354。設計図 docs/assets/noroi/settei/tori_jet/)。
// くちばしから噴く反動で、子がもは尻から進み、回転台は上から見て反時計回り。子がもを消した桶の絵の上に、
// 2 羽を点対称に置いて、向きごとの絵(kogamo: 0 くちばし右、1 右手前、2 手前、3 右奥、4 奥。左向きは裏返す)で、奥から描く。
// 毎コマ、その絵をマシンの絵の代わりに渡す(ウィリーのまわし、うしろの画面の縮みはそのまま)。速く回るとコマごとに飛んで、ストロボのようにちらつく
const N_KOGAMO = {
  rcs_tori: { tub: "rcs_tori_tub", cx: 39.5, cy: 31, rx: 13, ry: 3.4, rear: false },
  rc_tori_back: { tub: "rc_tori_tub", cx: 51.5, cy: 57, rx: 14, ry: 4.5, rear: true },
};
const nKg = { s: -1, th: 0.6, cv: {} };
const N_KG_PAD = 12; // 子がもの絵の高さ 32 から、いちばん奥の足もと(横の画面で y 27.6)を引いた分より大きく
const nKogamoW = (st0) => 1 + 16 * nThrottle(st0); // 回る速さ(回/秒): アクセルの開きに比例(D356)
const nKogamo = (get, key, st0) => {
  const K = N_KOGAMO[key];
  const tub = K && get(K.tub);
  const sh = get("kogamo");
  if (!tub || !sh) return null;
  const w = nKogamoW(st0);
  let ds = st0.s - nKg.s;
  if (ds < 0 || ds > 0.2) ds = 1 / 60;
  if (st0.s !== nKg.s) nKg.th += 2 * Math.PI * w * ds;
  nKg.s = st0.s;
  let cv = nKg.cv[key];
  if (!cv) {
    cv = nKg.cv[key] = document.createElement("canvas");
    cv.width = tub.width;
    cv.height = tub.height + N_KG_PAD; // 上に余白: 奥に回った子がもの頭が、桶の絵の上のはしで切れないように
  }
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, cv.width, cv.height);
  c.drawImage(tub, 0, N_KG_PAD);
  const ducks = [0, Math.PI].map((o) => {
    const th = nKg.th + o;
    const X = Math.cos(th), Y = Math.sin(th); // 上から見て X = 車の右、Y = 前
    const bx = Math.sin(th), by = -Math.cos(th); // くちばし = 時計回りの接線
    const right = K.rear ? bx : by;
    const toward = K.rear ? -by : bx;
    return { sx: K.cx + (K.rear ? X : Y) * K.rx, sy: N_KG_PAD + K.cy + (K.rear ? -Y : X) * K.ry, depth: K.rear ? -Y : X, right, toward };
  });
  ducks.sort((a, b) => a.depth - b.depth);
  for (const d of ducks) {
    const phi = Math.atan2(d.right, d.toward);
    const fr = [2, 1, 0, 3, 4][Math.min(4, Math.round(Math.abs(phi) / (Math.PI / 4)))];
    const flip = d.right < -0.05;
    const x = Math.round(d.sx), y = Math.round(d.sy);
    c.save();
    c.translate(x, y);
    if (flip) c.scale(-1, 1);
    c.drawImage(sh, fr * 32, 0, 32, 32, -16, -32, 32, 32);
    c.restore();
    // くちばしの噴流(白い筋)。回るほど長い
    if (w > 1.5 && d.toward < 0.9) {
      const L = Math.round(3 + 9 * Math.min(1, w / 14));
      const tx = x + Math.round(d.right * 13), ty = y - 21;
      for (let i = 0; i < L; i++) {
        c.fillStyle = `rgba(250, 250, 255, ${0.85 * (1 - i / L)})`;
        c.fillRect(Math.round(tx + d.right * i - d.toward * 0), Math.round(ty - d.toward * i * 0.35 + (Math.random() - 0.5)), 1 + (i < 3 ? 1 : 0), 1);
      }
    }
  }
  return cv;
};
// 炎を描く。(x, y) が口、(dx, dy) が向き、k が絵の倍率。毎コマ、形を 4 つから選びなおす(高速で切りかわる)。ときどき一瞬消える
const N_FLAME_COL = ["#ffffff", "#fff4b0", "#ffc83a", "#ff8a1e", "#ff4a14", "#b8201a"];
const nFlameCol = (t) => N_FLAME_COL[Math.min(N_FLAME_COL.length - 1, Math.floor(t * N_FLAME_COL.length))];
const nFlame = (ctx, x, y, dx, dy, I, k) => {
  if (I <= 0.02 || Math.random() < 0.18) return; // バリバリ: 一瞬消える
  const burst = dx === 0 && dy === 0;
  const d = Math.hypot(dx, dy) || 1;
  const ux0 = burst ? 0 : dx / d;
  const uy0 = burst ? -0.35 : dy / d;
  const pat = Math.floor(Math.random() * 4); // 0 長い噴射、1 扇、2 輝きの粒が並ぶ噴射、3 火の玉
  // 光の輪(根もと、丸く)。開くほど大きい
  ctx.fillStyle = `rgba(255, 190, 80, ${0.4 * I})`;
  const g = Math.max(2, Math.round((burst ? 10 : 8) * k * I));
  for (let yy = -g; yy <= g; yy++) {
    const hw = Math.floor(Math.sqrt(g * g - yy * yy));
    ctx.fillRect(Math.round(x - hw), Math.round(y + yy), 2 * hw + 1, 1);
  }
  const tongue = (a, lenK, wK, diamonds) => {
    const ux = burst ? Math.sin(a) * 0.7 : ux0 * Math.cos(a) - uy0 * Math.sin(a);
    const uy = burst ? uy0 - Math.abs(Math.cos(a)) * 0.3 : ux0 * Math.sin(a) + uy0 * Math.cos(a);
    const len = 80 * I * k * lenK * (0.7 + Math.random() * 0.6); // 長さはアクセルの開きに比例(全開で 80 ドットほど)
    const n = Math.max(3, Math.round(len));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      let w = Math.max(1, Math.round((2 + 8 * I) * k * wK * (1 - t * 0.75) * (0.7 + Math.random() * 0.6)));
      if (diamonds && i % Math.max(3, Math.round(6 * k)) < 2) w += Math.round(3 * k); // 衝撃波の輝き
      const cx = Math.round(x + ux * i + (Math.random() - 0.5) * 2 * k);
      const cy = Math.round(y + uy * i + (Math.random() - 0.5) * 2 * k);
      ctx.fillStyle = nFlameCol(t);
      ctx.fillRect(cx - (w >> 1), cy - (w >> 1), w, w);
    }
    return [x + ux * n, y + uy * n];
  };
  if (pat === 0) {
    tongue(0, 1.2, 1.1, false);
    tongue((Math.random() - 0.5) * 0.3, 0.7, 0.6, false);
  } else if (pat === 1) {
    for (let j = -2; j <= 2; j++) tongue(j * 0.32 + (Math.random() - 0.5) * 0.2, 0.55 + Math.random() * 0.3, 0.7, false);
  } else if (pat === 2) {
    tongue(0, 1.0, 0.8, true);
  } else {
    const [ex, ey] = tongue(0, 0.5, 0.9, false);
    const R = Math.round(16 * I * k * (0.8 + Math.random() * 0.4));
    for (let yy = -R; yy <= R; yy++) {
      const w = Math.floor(Math.sqrt(R * R - yy * yy));
      const t = Math.abs(yy) / R;
      ctx.fillStyle = nFlameCol(0.25 + t * 0.7);
      ctx.fillRect(Math.round(ex - w), Math.round(ey + yy), 2 * w + 1, 1);
    }
  }
};
// 競争の音(D344): 相手のエンジン(マシンごとの音色)、スキール音、ぼぎカーの風。毎コマ、時計から決める
// cam: 横からの画面のカメラ(null ならうしろからの画面)。左右と遠さを、車の見える位置から決める(D345)
const nRaceSound = (st0, cam) => {
  const A = window.bogiAudio && window.bogiAudio.race;
  if (!A) return;
  const { s, rd, ki, opp, back, taut } = st0;
  if (A.kind() !== rd.snd) A.start(rd.snd);
  const st = s - N_GREEN;
  let rpm = 0.08;
  let eng = 0.35;
  let squeal = 0;
  if (s > 1 && s < 3.2) {
    // バーンナウト: 空ぶかしとホイールスピン
    rpm = 0.6 + 0.1 * Math.sin(s * 9);
    eng = 0.85;
    squeal = 0.85;
  } else if (s >= 3.2 && st < 0) {
    rpm = 0.22 + 0.18 * Math.max(0, Math.sin(s * 5)); // ステージで、ブォンブォンとあおる
    eng = 0.6;
  }
  if (st >= 0 && nr.foul < 0) {
    const u = Math.max(0, opp) / N_RACE_D;
    const g = Math.min(2.95, u * 3.2); // 3 速まで。ギアが変わるたびに回転が落ちる
    rpm = st < 0.25 ? 0.5 : 0.45 + 0.55 * (g - Math.floor(g));
    eng = 1;
    squeal = Math.max(0, 1 - st / 0.8);
    if (opp >= N_RACE_D || (nr.end && !rd.snap)) {
      const e = Math.max(0, s - (nr.endT || s));
      rpm = Math.max(0.1, 0.7 - e * 0.4);
      eng = Math.max(0.25, 1 - e * 0.5);
    }
    if (taut > 0) (rpm = 1), (eng = 1);
    else if (back > 0) (rpm = 0.15 + 0.3 * (1 - back)), (eng = 0.5 * (1 - back) + 0.2);
  }
  if (nr.go >= 0 && s >= nr.go && s - nr.go < 0.5) squeal = Math.max(squeal, 1 - (s - nr.go) / 0.5);
  const wind = nr.go >= 0 && s >= nr.go && ki < N_RACE_D ? 0.9 : 0;
  // ぼぎカーのタイヤ: バーンナウトと、押した瞬間
  let squealKi = s > 1 && s < 3.2 ? 0.7 : 0;
  if (nr.go >= 0 && s >= nr.go && s - nr.go < 0.4) squealKi = Math.max(squealKi, 1 - (s - nr.go) / 0.4);
  // 負けた相手の抗議(D346): となりへ戻りながら低く、着いたら何度もふかす
  const pr = nProtest(st0);
  const oppAt = pr ? pr.pos : opp;
  if (pr) {
    rpm = pr.rev ? 0.25 + 0.7 * Math.max(0, Math.sin(s * 11)) : 0.3;
    eng = pr.rev ? 1 : 0.6;
  }
  let oppPan, kiPan, oppVol, kiVol;
  if (cam == null) {
    // うしろから: 相手は左、ぼぎカーは右の車線。走り出すと前へ遠のく
    oppPan = -0.6;
    kiPan = 0.6;
    oppVol = 1 / (1 + Math.max(0, opp) / 70);
    kiVol = 1 / (1 + Math.max(0, ki) / 70);
  } else {
    // 横から: 画面の左右の位置で振り、画面のまん中(240)から離れるほど小さく。相手は奥の車線なので少し小さい
    const sx = (d) => N_SX + d * N_PX - cam;
    const pan = (x) => Math.max(-1, Math.min(1, (x - 240) / 260));
    const vol = (x) => Math.max(0.15, 1 - Math.abs(x - 240) / 700);
    oppPan = pan(sx(oppAt));
    kiPan = pan(sx(ki));
    oppVol = 0.85 * vol(sx(oppAt));
    kiVol = vol(sx(ki));
  }
  const crackle = N_FLAME[rd.img] ? nFlameI(st0) : 0; // 炎が出ているときは、バリバリ(D349)
  A.set({ rpm, eng, squeal, squealKi, wind, oppPan, kiPan, oppVol, kiVol, crackle });
};
// 白煙(うしろへ流れて広がり、消える)
// ---- バーンナウトの煙(D362、作者「バーンナウトの煙、自然な表現にできるか」todo 93 の A) ----
// 1 つの煙 = ふちのくっきりした丸 3〜5 個のかたまり。明るい・ふつう・影の 3 色(左上が明るい)。
// 出たときは速く、空気の抵抗で遅くなり、少し上がりながら流れて大きくなる。薄れるときはドットを間引く(4×4 の網目で 4 段)
const N_SMOKE_TONES = ["248,246,240", "218,214,206", "172,168,162"];
let nSmokePat = null;
const nSmokePatterns = (ctx) => {
  if (nSmokePat) return nSmokePat;
  const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  nSmokePat = N_SMOKE_TONES.map((c) =>
    [1, 2, 3, 4].map((lv) => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 4;
      const g = cv.getContext("2d");
      g.fillStyle = `rgb(${c})`;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (B[y][x] < lv * 4) g.fillRect(x, y, 1, 1);
      return ctx.createPattern(cv, "repeat");
    })
  );
  return nSmokePat;
};
const nSmokeNew = (x, y, vx, vy, f, rm) => {
  const n = 3 + Math.floor(Math.random() * 3);
  const blobs = [];
  for (let i = 0; i < n; i++) blobs.push({ a: Math.random() * Math.PI * 2, d: 0.2 + Math.random() * 0.45, s: 0.5 + Math.random() * 0.4 });
  return { x, y, vx, vy, f, t0: nNow(), life: 1.6 + Math.random() * 0.9, r0: 3 + Math.random() * 2, rm: rm * (0.8 + Math.random() * 0.4), blobs, spin: (Math.random() - 0.5) * 1.6 };
};
// list の煙を描く。sx(p, x) で画面の x にする(横の画面はカメラを引く)
const nSmokeDraw = (ctx, list, sx, oy) => {
  const now = nNow();
  const pats = nSmokePatterns(ctx);
  const k = 2.4; // 空気の抵抗
  for (let i = list.length - 1; i >= 0; i--) if (now - list[i].t0 >= list[i].life) list.splice(i, 1);
  for (const p of list) {
    const t = now - p.t0;
    const u = t / p.life;
    const e = (1 - Math.exp(-k * t)) / k;
    const cx = sx(p, p.x + p.vx * e);
    const cy = oy + p.y + p.vy * e - 10 * p.f * t;
    const r = (p.r0 + (p.rm - p.r0) * (1 - Math.exp(-1.8 * t))) * p.f;
    const lv = u < 0.45 ? 3 : u < 0.65 ? 2 : u < 0.82 ? 1 : 0;
    for (let tone = 2; tone >= 0; tone--) {
      ctx.fillStyle = pats[tone][lv];
      for (const b of p.blobs) {
        const a = b.a + p.spin * t;
        const bx = cx + Math.cos(a) * b.d * r;
        const by = cy + Math.sin(a) * b.d * r * 0.7;
        const br = b.s * r;
        if (tone === 2) nDisk(ctx, Math.round(bx + 1), Math.round(by + br * 0.25), Math.max(1, Math.round(br)));
        else if (tone === 1) nDisk(ctx, Math.round(bx), Math.round(by), Math.max(1, Math.round(br * 0.9)));
        else nDisk(ctx, Math.round(bx - br * 0.25), Math.round(by - br * 0.3), Math.max(1, Math.round(br * 0.5)));
      }
    }
  }
};
// 横の画面の煙(x は道の上の位置。vx はうしろへ噴き出す速さ)
const nRcPuffs = [];
const nRcPuff = (x, y, vx) => {
  if (nRcPuffs.length > 140) return;
  nRcPuffs.push(nSmokeNew(x, y, vx - 30 - Math.random() * 70, -10 - Math.random() * 25, 1, 18));
};
const nDrawRcPuffs = (ctx, ox, oy, cam) => nSmokeDraw(ctx, nRcPuffs, (p, x) => ox + x - cam, oy);
// 横向きの絵を、鼻先 fx(画面)、地面 gy に置く。lift = うしろのタイヤを軸に前を上げる角度(ウィリー)
const nDrawSide = (ctx, im, fx, gy, shake, lift) => {
  if (!im) return null;
  const x0 = Math.round(fx - im.width);
  const y0 = Math.round(gy - im.height + shake);
  if (lift) {
    const px = x0 + im.width * 0.2;
    ctx.save();
    ctx.translate(px, gy);
    ctx.rotate(-lift);
    ctx.drawImage(im, x0 - px, y0 - gy);
    ctx.restore();
  } else ctx.drawImage(im, x0, y0);
  return { x0, y0, w: im.width, h: im.height };
};
// ドットの円(ふちをぼかさない)
const nDisk = (ctx, cx, cy, r) => {
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
    ctx.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
  }
};
// 横に流れる層(左右を返しながら並べて、つなぎ目を目立たせない)
const nStrip = (ctx, im, ox, y, off) => {
  if (!im) return;
  const w = im.width;
  const k0 = Math.floor(off / w);
  for (let k = k0; k <= k0 + 2; k++) {
    const x = ox + Math.round(k * w - off);
    if (x > ox + 480 || x + w < ox) continue;
    if (k % 2) {
      ctx.save();
      ctx.translate(x + w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(im, 0, y);
      ctx.restore();
    } else ctx.drawImage(im, x, y);
  }
};
// ---- うしろから見たスタート(D152): バーンナウト → ステージ → 黄 → 青で A → 発進(ウィリー)。押して 1.1 秒で横向きの再現シーンへ ----
// 絵は D134 の真うしろの画面(rc_plate、rc_lamps、rc_*_back)。とりぼぎかーのうしろ姿の子がもは Z に直した(D151)
const NR_VP = { x: 240, y: 108 };
const NR_LANE = { opp: 140, ki: 340 };
const NR_CAR_Y = 274;
const NR_Z0 = 10.9; // カメラからスタートまで(m)。白線(4 m 先)が絵の白線の高さ(y 228)にくる
const NR_BACK = 1.4; // うしろから見た画面で、引き戻されたぽんぽんカーが止まる所(スタートのうしろ m)。カメラのうしろまで飛ぶと、排気管しか映らなかった(D353)
const nRearD = (d) => (d < 0 ? -NR_BACK * (1 - Math.exp(d / NR_BACK)) : d);
const NR_TREE = { xs: [232, 247], ys: [130, 146, 162, 177, 192], r: 8 }; // 灯り(左の列 = 相手、右の列 = ぼぎカー)
// 奥行き: d(m)の所の大きさと y
const nScale = (d) => NR_Z0 / (NR_Z0 + Math.max(-NR_Z0 * 0.7, d));
const nAt = (lane, d) => {
  const f = nScale(d);
  return { x: NR_VP.x + (lane - NR_VP.x) * f, y: NR_VP.y + (NR_CAR_Y - NR_VP.y) * f, f };
};
// うしろからの画面の煙(f は遠さの倍率。タイヤから左右と上へ噴き出す)
const nRrPuffs = [];
const nRrPuff = (x, y, f) => {
  if (nRrPuffs.length > 140) return;
  nRrPuffs.push(nSmokeNew(x, y, (Math.random() - 0.5) * 90 * f, (-15 - Math.random() * 30) * f, f, 20));
};
const nDrawRrPuffs = (ctx, ox, oy) => nSmokeDraw(ctx, nRrPuffs, (p, x) => ox + x, oy);
const nDrawCar = (ctx, im, ox, oy, lane, d, shake, lift) => {
  if (!im) return null;
  const { x, y, f } = nAt(lane, d);
  const w = im.width * f;
  const h = im.height * f * (1 + (lift || 0) * 1.6);
  if (w < 1) return null;
  ctx.drawImage(im, Math.round(ox + x - w / 2), Math.round(oy + y - h + shake), Math.round(w), Math.round(h));
  return { x, y, f, w, h };
};
const N_REAR = { ponpon: "rc_pon_back", toribogi: "rc_tori_back", akabeko: "rc_aka_back", tansu: "rc_tansu_back", kokeshi: "rc_kokeshi_back" };
const nDrawRear = (ctx, ox, oy, get, api, st0) => {
  const { s, rd, ki, opp, back } = st0;
  const plate = get("rc_plate");
  if (plate) ctx.drawImage(plate, ox, oy);
  // 信号の灯り
  const lamps = get("rc_lamps");
  const lamp = (col, row, kind) => {
    if (!lamps) return;
    const R = NR_TREE.r;
    ctx.drawImage(lamps, kind * 2 * R, 0, 2 * R, 2 * R, ox + NR_TREE.xs[col] - R, oy + NR_TREE.ys[row] - R, 2 * R, 2 * R);
  };
  const fouled = nr.foul >= 0;
  for (const col of [0, 1]) {
    if (s > 3.4 && !(nr.end && s - nr.endT > 0.2)) lamp(col, 0, 2); // ステージ
    for (let k = 0; k < 3; k++) if (!fouled && s > N_GREEN - 1.5 + k * 0.5 && s < N_GREEN) lamp(col, 1 + k, 3);
    if (!fouled && s >= N_GREEN && !nr.end) lamp(col, 4, 4);
  }
  if (fouled) lamp(1, 4, 5); // ぼぎカーの列だけ赤
  if (nr.end && Math.floor((s - nr.endT) * 4) % 2 === 0 && s - nr.endT < 3) lamp(nr.end === "win" ? 1 : 0, 0, 2); // 勝った側の灯り
  // 揺れ(バーンナウトと発進で、空気がふるえる)
  const burn = s > 1 && s < 3.2;
  const shk = (on, a) => (on ? Math.round(Math.sin(s * 47) * a) : 0);
  // 相手(左の車線)。遠い方から描く
  const oim = (N_KOGAMO[N_REAR[rd.id]] && nKogamo(get, N_REAR[rd.id], st0)) || get(N_REAR[rd.id]); // とりぼぎかーは子がもが回る(D352)
  const kim = get("rc_bogi_back");
  const drawOpp = () => {
    const st = s - N_GREEN;
    const lift = rd.lift && st > 0 && st < 1.1 && !back ? rd.lift * Math.sin((Math.PI * st) / 1.1) : 0;
    const r = nDrawCar(ctx, oim, ox, oy, NR_LANE.opp, nRearD(opp), shk(burn || (st > 0 && st < (rd.rattle ? 1.2 : 0.8)), rd.rattle || 1), lift);
    if (!r) return;
    if (N_FLAME[N_REAR[rd.id]] && oim) {
      // うしろから: 絵の倍率(f)に合わせて、口の位置と炎の大きさを縮める(D349)
      const I = nFlameI(st0);
      const sy = r.h / oim.height;
      for (const [ax, ay, dx, dy] of N_FLAME[N_REAR[rd.id]]) nFlame(ctx, ox + r.x - r.w / 2 + ax * r.f, oy + r.y - r.h + ay * sy, dx, dy, I, Math.max(0.6, r.f));
    }
    if (rd.snap) {
      // 線: 画面の左下の外(峠のドラム缶)から、ぽんぽんカーのエンジンの右へ
      nCable(ctx, ox - 30, oy + 310, ox + r.x + r.w * 0.35, oy + r.y - r.h * 0.55, st0.taut > 0 ? 0 : back > 0 ? 6 : Math.max(4, 60 * (1 - opp / N_RACE_D)), { taut: st0.taut > 0 });
    }
    if ((burn || (st > 0.2 && st < 1.0)) && Math.random() < 0.6 && r.f > 0.25) {
      nRrPuff(r.x - r.w * 0.38, r.y - 4 * r.f, r.f);
      nRrPuff(r.x + r.w * 0.38, r.y - 4 * r.f, r.f);
    }
  };
  const drawKi = () => {
    const shake = shk(burn, 1);
    // きー: 立つ(向こう向き)。うしろから見ると、顔のうしろのくぼみに立つきーの下半分は、板のうしろのはしに隠れる
    // 青で押すと、つぶれて背中に張り付く(粘着駆動 D123)
    const { x, y, f } = nAt(NR_LANE.ki, ki);
    const bh = kim ? kim.height * f : 0;
    const stand = get("rc_ki_back");
    if (nr.go < 0 && stand && kim) {
      const w = stand.width * f, h = stand.height * f;
      const footY = y - bh + 22 * f;
      ctx.drawImage(stand, Math.round(ox + x - w / 2), Math.round(oy + footY - h + shake), Math.round(w), Math.round(h));
    }
    const r = nDrawCar(ctx, kim, ox, oy, NR_LANE.ki, ki, shake);
    if (!r) return;
    const stick = get("rc_ki_stick");
    if (nr.go >= 0 && stick) {
      const w = stick.width * f, h = stick.height * f;
      const footY = y - bh + 12 * f;
      ctx.drawImage(stick, Math.round(ox + x - w / 2), Math.round(oy + footY - h + shake), Math.round(w), Math.round(h));
    }
    if (burn && Math.random() < 0.55) {
      nRrPuff(r.x - r.w * 0.42, r.y - 4, r.f);
      nRrPuff(r.x + r.w * 0.42, r.y - 4, r.f);
    }
  };
  if (opp > ki) {
    drawOpp();
    drawKi();
  } else {
    drawKi();
    drawOpp();
  }
  nDrawRrPuffs(ctx, ox, oy);
  if (burn && Math.random() < 0.05) api.shake(0.25, 1);
};
const N_RACE = {
  tile: T,
  bg: "#000",
  hidePlayer: true,
  map: kGrid(15, 10, () => false),
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 5 * T, facing: "east" } },
  onEnter(api) {
    nS.raceGo = false;
    nRaceReset(api);
  },
  debug: () => Object.assign({ s: nNow() - nr.t0, green: N_GREEN }, nr),
  drawOverlay(ctx, ox, oy, t, api) {
    nCardDraw(ctx, api);
  },
  onA(api) {
    const { s } = nRaceState();
    if (nr.end || nr.foul >= 0 || nr.go >= 0 || s < 3.4) return true;
    if (s < N_GREEN) {
      nr.foul = s; // 青より前は赤(フライング)
      api.later(2000, () => nRaceReset(api));
      return true;
    }
    nr.go = s;
    api.shake(0.5, 2);
    return true;
  },
  drawGround(ctx, ox, oy, img, api) {
    const get = (k) => (typeof img === "function" ? img(k) : null);
    // 押して 1.1 秒たったら、横向きの再現シーンへ(青の 0.5 秒前から、同じ出来事をもう一度たどる D152)
    if (nr.go >= 0 && nr.repT < 0 && nNow() - nr.t0 >= nr.go + 1.1) {
      nr.repT = nNow() - nr.t0;
      nr.rep0 = Math.min(nr.go, N_GREEN) - 0.5;
      nr.snapT = -1;
      nr.snapSfx = false;
      nRcPuffs.length = 0;
      nr.flash = nr.repT;
    }
    const st0 = nRaceState();
    const { s, real, rd, ki, opp, back } = st0;
    // 勝ち負け
    if (!nr.end) {
      const kiIn = ki >= N_RACE_D;
      const oppIn = !rd.snap && opp >= N_RACE_D;
      const timeout = nr.foul < 0 && s > N_GREEN + 7; // 押さなかった(再現の時計でも同じ)
      if (kiIn || oppIn || timeout) {
        nr.end = kiIn && !oppIn ? "win" : "lose";
        nr.endT = s;
        if (nr.end === "win") {
          const rt = (nr.go - N_GREEN).toFixed(3);
          const last = nr.round === N_ROUNDS.length - 1;
          api.later(nSlipDelay(rd, s), () => {
            if (last) {
              api.show("v_finish", () =>
                api.say([`タイム　スリップ`, ...nSlip(rd, rt)], () => {
                  api.setFlag("won");
                  api.warp("strip", "finish");
                }), { full: true });
            } else {
              api.say([`タイム　スリップ`, ...nSlip(rd, rt), `つぎは　${N_ROUNDS[nr.round + 1].name}`], () => {
                api.setFlag("nrRound", nr.round + 1);
                nCardShow(api, nr.round + 1, () => nRaceReset(api)); // 対戦カード(D367)
              });
            }
          });
        } else api.later(2200, () => nRaceReset(api)); // 負けたら、その回からやり直し
      }
    }
    if (nr.repT < 0) {
      nRaceSound(st0, null);
      nDrawRear(ctx, ox, oy, get, api, st0);
      return;
    }
    // カメラ: 先を行く車の鼻先を画面の 300 に。ゴールの線が画面の 240 まで来たら止まる
    const lead = Math.max(ki, opp, 0);
    let cam = Math.max(0, Math.min(N_FX - 240, N_SX + lead * N_PX - 300));
    // 1 回戦: ぼぎカーがゴールするか、線がのびきったら、カメラを左へ流して、ぽんぽんカーを画面のまん中に。
    // 張って、飛んでいくのを見せてから、ゴールへ戻る(D338、作者「ポンポンカーが引き戻される演出がわかりにくい」)
    if (rd.snap) {
      const lim = N_RACE_D * rd.snap;
      const t1 = Math.min(nr.end ? nr.endT : 1e9, nr.snapT >= 0 ? nr.snapT : 1e9);
      if (t1 < 1e9) {
        const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
        let w = sm((s - t1) / 0.45);
        if (nr.snapT >= 0) w *= 1 - sm((s - (nr.snapT + N_SNAP_HOLD + N_SNAP_FLY + 0.5)) / 0.5);
        const pc = N_SX + (nr.snapT >= 0 ? lim : Math.min(opp, lim)) * N_PX - 300;
        cam = cam + (pc - cam) * w;
      }
    }
    nRaceSound(st0, cam);
    const sky = get("rcs_sky");
    if (sky) ctx.drawImage(sky, ox, oy);
    const pcam = cam * 0.35; // スタンドは遠いので、ゆっくり流れる
    nStrip(ctx, get("rcs_stands"), ox, oy + 64, pcam);
    // 歓声: 勝つと、空っぽのスタンドに、かつてのちゃんの見物人の影が満ちて消える(D126)
    if (nr.end === "win") {
      const u = (s - nr.endT) / 3.2;
      const a = u < 0.25 ? u / 0.25 : u < 0.7 ? 1 : Math.max(0, (1 - u) / 0.3);
      if (a > 0) {
        ctx.globalAlpha = 0.85 * a;
        nStrip(ctx, get("rcs_crowd"), ox, oy + 64 + Math.round(Math.sin(s * 9) * 1.5), pcam); // 帯の上のほうは薄くしてある(D291)
        ctx.globalAlpha = 1;
      }
    }
    nStrip(ctx, get("rcs_road"), ox, oy + 150, cam);
    // スタートとゴールの白線(道を横切る)
    ctx.fillStyle = "rgba(236, 232, 220, 0.85)";
    for (const lx of [N_SX, N_FX]) {
      const x = ox + Math.round(lx - cam);
      if (x < ox - 20 || x > ox + 500) continue;
      for (let y = 196; y < 300; y++) ctx.fillRect(x + Math.round((300 - y) * 0.12), oy + y, lx === N_FX ? 4 : 2, 1);
    }
    const burn = s > 1 && s < 3.2;
    const shk = (on, a) => (on ? Math.round(Math.sin(s * 47) * a) : 0);
    const st = s - N_GREEN;
    // 相手(奥の車線)
    const oim = (N_KOGAMO[rd.img] && nKogamo(get, rd.img, st0)) || get(rd.img); // とりぼぎかーは子がもが回る(D352)
    const pr = nProtest(st0);
    const ofx = ox + N_SX + (pr ? pr.pos : opp) * N_PX - cam;
    let lift = rd.lift && st > 0 && st < 1.1 && !back ? rd.lift * Math.sin((Math.PI * st) / 1.1) : 0;
    if (pr && pr.rev) lift = 0.05 * Math.max(0, Math.sin(s * 11)); // ふかすたびに、前がはね上がる(首を振るように)
    if (st0.taut > 0) lift = -0.06 * Math.sin(Math.PI * (1 - st0.taut)); // 張った瞬間、前のめりに
    const r = nDrawSide(ctx, oim, ofx, oy + N_GY.opp, st0.taut > 0 ? Math.round(Math.sin(s * 90) * 1.5) : pr && pr.rev ? Math.round(Math.sin(s * 60) * 2) : shk(burn || (st > 0 && st < (rd.rattle ? 1.2 : 0.8)), rd.rattle || 1), lift);
    if (r && pr && pr.rev && Math.sin(s * 11) > 0.6 && Math.random() < 0.5) nRcPuff(r.x0 - ox + cam + 10, N_GY.opp - 8, -50); // ふかした煙
    if (r && N_FLAME[rd.img]) {
      const I = nFlameI(st0);
      const gy = oy + N_GY.opp;
      const pv = r.x0 + r.w * 0.2;
      for (const [ax, ay, dx, dy] of N_FLAME[rd.img]) {
        // 前がはね上がっているときは、絵と同じだけ口の位置もまわす
        let px = r.x0 + ax, py = r.y0 + ay, vx = dx, vy = dy;
        if (lift) {
          const c = Math.cos(-lift), sn = Math.sin(-lift);
          const qx = px - pv, qy = py - gy;
          px = pv + qx * c - qy * sn;
          py = gy + qx * sn + qy * c;
          [vx, vy] = [dx * c - dy * sn, dx * sn + dy * c];
        }
        nFlame(ctx, px, py, vx, vy, I, 1);
      }
    }
    if (r && rd.snap) {
      // 線: 画面の左の外(峠のドラム缶 = 過去)から、ぽんぽんカーのうしろへ。張ったときは真っすぐ、ふるえる
      const sag = st0.taut > 0 ? Math.sin(s * 70) * 2 : back > 0 ? 6 + back * 30 : Math.max(3, 40 * (1 - opp / N_RACE_D));
      nCable(ctx, ox - 20, oy + N_GY.opp - 24, r.x0 + 14, r.y0 + r.h * 0.45, sag, { taut: st0.taut > 0 });
      if (st0.taut > 0 && !nr.snapSfx) {
        nr.snapSfx = true;
        api.sfx("pon_snap");
        api.shake(0.3, 2);
      }
      if (back > 0 && back < 0.9 && Math.random() < 0.3) nRcPuff(r.x0 - ox + cam + 60, N_GY.opp - 10, 30);
    }
    if (r && (burn || (st > 0.1 && st < 0.9)) && Math.random() < 0.7) nRcPuff(r.x0 - ox + cam + 22, N_GY.opp - 6, -40);
    // ぼぎカー(手前の車線)ときー
    const kim = get("rcs_bogi");
    const kfx = ox + N_SX + ki * N_PX - cam;
    const shake = shk(burn, 1);
    const kr = nDrawSide(ctx, kim, kfx, oy + N_GY.ki, shake, 0);
    if (kr) {
      const im = get(nr.go < 0 || s < nr.go ? "rcs_ki" : "rcs_ki_stick"); // 再現シーンでは、押した時刻まで立っている
      // 顔のうしろのくぼみに立つ。押すと、つぶれて背中に張り付く(粘着駆動 D123)
      if (im) {
        const standing = nr.go < 0 || s < nr.go;
        const kx = standing ? kr.x0 + 60 : kr.x0 + 30;
        const ky = standing ? kr.y0 + 20 : kr.y0 + 22;
        ctx.drawImage(im, kx, ky - im.height);
      }
      if (burn && Math.random() < 0.7) nRcPuff(kr.x0 - ox + cam + 26, N_GY.ki - 6, -60);
    }
    nDrawRcPuffs(ctx, ox, oy, cam);
    // 手前の信号の柱(スタートの線の少し先)
    const tree = get("rcs_tree");
    const tx = ox + N_TREE.x - cam;
    if (tree && tx > ox - 40) {
      const ty = oy + N_TREE.foot - tree.height;
      ctx.drawImage(tree, tx, ty);
      const lamp = (col, row, c) => {
        const cx = tx + N_TREE.xs[col];
        const cy = ty + N_TREE.ys[row];
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = c;
        nDisk(ctx, cx, cy, N_TREE.r + 3);
        ctx.globalAlpha = 1;
        nDisk(ctx, cx, cy, N_TREE.r - 1);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx - 2, cy - 2, 2, 1);
      };
      const fouled = nr.foul >= 0;
      for (const col of [0, 1]) {
        if (s > 3.4 && !(nr.end && s - nr.endT > 0.2)) lamp(col, 0, N_LAMP.stage);
        for (let k = 0; k < 3; k++) if (!fouled && s > N_GREEN - 1.5 + k * 0.5 && s < N_GREEN) lamp(col, 1 + k, N_LAMP.amber);
        if (!fouled && s >= N_GREEN && !nr.end) lamp(col, 4, N_LAMP.green);
      }
      if (fouled) {
        lamp(1, 5, N_LAMP.red);
        lamp(1, 6, N_LAMP.red);
      }
      if (nr.end && Math.floor((s - nr.endT) * 4) % 2 === 0 && s - nr.endT < 3) lamp(nr.end === "win" ? 1 : 0, 0, N_LAMP.stage); // 勝った側の灯り
    }
    if (burn && Math.random() < 0.05) api.shake(0.25, 1);
    // 切りかえの白い光
    const fu = (real - nr.flash) / 0.25;
    if (nr.flash >= 0 && fu < 1) {
      ctx.fillStyle = `rgba(255, 252, 240, ${1 - fu})`;
      ctx.fillRect(ox, oy, 480, 300);
    }
  },
  triggers: [],
  objects: [],
};
