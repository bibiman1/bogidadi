// 断片: 呪いの野犬。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== 呪いの野犬 ========
// 今の真昼、陽炎。日本の峠道の先が、ルート 66 のような旧国道に混ざる(D115〜D117)。絵と当たり判定は docs/assets/noroi/、設定資料は docs/assets/noroi/settei/
// 芯(作者 D126): 人も車も絶えて久しい寂寥感のある世界で、ちゃんがいなくなっても走らずにいられないアッパー系ぼぎが、スピードへの衝動を発散している。
// ゴールラインをこえたぼぎには、かつてのちゃんの歓声がきこえてくる。ダイナーはレースの日のまま止まった店(D127、D128)
// 流れ: 峠で、木の葉のぼぎがドラム缶の焚火に木の葉を足す → ぽんぽんカー(有線、D125)がドラム缶を引きずって去る
// → ドライブイン跡(ダイナーの中に入れる)。みとんがぼぎカーに炎を塗る → 旧国道の直線でドラッグレース(勝ち抜き戦: ぽんぽんカー → とりぼぎかー → 赤べこ)
// → 勝つと歓声、一枚絵、タイムスリップ → 道具「クラブの札」。トンネルからいつでも帰れる。台詞はエンジンの音だけで、すべて仮
const N_GRIDS = {
  pass: [
    "############################", // 北の小道は通れない(口にパイロン。作者「余計な詮索でプレイヤーを混乱させたくない」D343)
    "############################",
    "###...######################",
    "###...####........##########",
    "##..........................",
    "............................",
    "............................",
    "............................",
    "............................",
    "############################",
    "############################",
    "############################",
  ],
  drivein: [
    "############################",
    "############################",
    "############################",
    "#.##################.#...#..",
    "#.##################.#...#..",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "############################",
    "############################",
  ],
  strip: [
    "############################",
    "############################",
    "############################",
    "########################....",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "############################",
    "############################",
    "############################",
  ],
  diner: [
    "####################",
    "####################",
    "#############....###",
    "#############......#",
    "#############..#####",
    "#..............#####",
    "#..............#####",
    "##.............#####",
    "##.............#####",
    "##.............#####",
    "#...........########", // 左から 2 マス目はピンボール台の正面(D328)
    "#########..#########",
  ],
};
const nMap = (key, cols, rows, extra) =>
  Object.assign({ tile: T, bg: "#d8bc8a", map: N_GRIDS[key], legend: K_LEGEND, drawGround: kImage(`bg_${key}`, cols * T, rows * T) }, extra);
const nNow = () => performance.now() / 1000;
// 足もと(x, y)に立つ絵。shake があれば、エンジンの振動で 1 ドットふるえる
const nSprite = (id, img, x, y, w, h, extra) =>
  Object.assign(
    {
      id,
      x,
      y,
      w: 1,
      h: 1,
      headY: h - 2,
      draw(ctx, sx, sy, t, api) {
        const im = api.image(typeof this.img === "function" ? this.img(api) : this.img || img);
        const j = this.shake ? Math.round(Math.sin(t * 40 + x) * 0.6) : 0;
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2) + j, Math.round(sy - im.height));
      },
    },
    extra
  );
// 野犬たちの声(エンジンの音)。仮
const N_VOICE = { ponpon: "ポン　ポン　ポン", toribogi: "シュッ　シュッ", akabeko: "ドルルン", kokeshi: "パラララ　キュッ", tansu: "ドッドッドッ" };
const nTalk = (id) => (api) => api.bubble(id, N_VOICE[id], 1800);
// 煙(白いかたまりが流れて消える)
const nPuffs = [];
const nPuff = (x, y, vx, vy, life, size, rgb) => nPuffs.push({ x, y, vx, vy, t0: nNow(), life, size, rgb: rgb || "210, 205, 196" });
const nDrawPuffs = (ctx, ox, oy) => {
  const now = nNow();
  for (let k = nPuffs.length - 1; k >= 0; k--) {
    const p = nPuffs[k];
    const u = (now - p.t0) / p.life;
    if (u >= 1) {
      nPuffs.splice(k, 1);
      continue;
    }
    const s = Math.round(p.size * (0.6 + u * 1.4));
    ctx.fillStyle = `rgba(${p.rgb}, ${0.72 * (1 - u)})`;
    ctx.fillRect(Math.round(ox + p.x + p.vx * u * p.life - s / 2), Math.round(oy + p.y + p.vy * u * p.life - s / 2), s, s);
  }
};
const nGlow = (ctx, x, y, r, rgb, a) => {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb}, ${a})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
};
// ぽんぽんカーとドラム缶をつなぐ黒い線(たるんだ線。原理は説明しない D124)
const nCable = (ctx, x0, y0, x1, y1, sag, race) => {
  const path = (dy) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + dy);
    ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + sag + dy, x1, y1 + dy);
    ctx.stroke();
  };
  if (race) {
    // 競争の画面: 路面にまぎれないよう、太い銅の線に、上のふちの光(D338、作者「引き戻される演出がわかりにくい」)
    ctx.strokeStyle = "#5a3418";
    ctx.lineWidth = 3;
    path(0);
    ctx.strokeStyle = race.taut ? "#ffd890" : "#e09848";
    ctx.lineWidth = 1;
    path(-1);
    return;
  }
  ctx.strokeStyle = "#141210";
  ctx.lineWidth = 2;
  path(0);
};

// A 峠のトンネルの出口(入口で出口)。待避所に、ぽんぽんカーとドラム缶(れんがの上で木の葉が燃える)
// 木の葉のぼぎが北の小道から木の葉を運んできて、ドラム缶にあける(「もってきた　ぽんぽんカー　もってきた」作者のスケッチ)
// 火が燃えあがると、ぽんぽんカーは東へ走り去る。ドラム缶は峠に残り、線だけがのびてついていく(有線 D125。ドラム缶ごと動くのはだめ D131)
const N_CAR0 = 13 * T; // 待避所のぽんぽんカーの x
const N_DRUM = 2.2 * T; // ドラム缶(ぽんぽんカーの西どなり)
let nFuelT0 = -1;
const nFuelAge = (api) => (nFuelT0 >= 0 ? nNow() - nFuelT0 : api.flag("ponponGone") ? 99 : -1);
const N_FUEL = { walk: 1.6, say: 1.6, dump: 5.2, fire: 5.8, step: 6.4, go: 7.4, gone: 10.4 };
// 木の葉を入れたあと、お世話係はドラム缶の西どなりへ一歩出て、そこにいる(うしろにいると、ドラム缶に隠れて見えなかった)
const N_FUEL_REST = { x: 9.6 * T, y: 4.5 * T };
const nCarX = (api) => {
  const e = nFuelAge(api) - N_FUEL.go;
  if (e <= 0) return N_CAR0;
  return N_CAR0 + 40 * e * e + 30 * e;
};
const nGone = (api) => api.flag("ponponGone") && nFuelT0 < 0;
// きーが帰るときの抗議(D364、作者「きーが帰るとき、無慣性粘着駆動への抗議をマシン達が表明する演出を考えて」todo 94 の A)。
// 札をもらったあと、マシン達は峠のトンネルの前へ先回りして並ぶ。はじめて帰るときは、いっせいに空ぶかしし、1 台ずつその車らしいしぐさで「いやだ」を示す
// (みな体を左右にゆすって「いやいや」。赤べこは首を横に振る、ぽんぽんカーは目を点滅させて黒い煙、とりぼぎかーは子がもの噴流、こけしは前をはね上げる、車箪笥は引き出しをガタガタ、みとんは「……」)。
// マシンのセリフ(オノマトペ)はなく、エンジンの音としぐさだけ。2 回目からは、並んで空ぶかしするだけ。トンネルに入ると、うしろでクラクション
const N_SO = { rev: 0.4, tansu: 1.9, miton: 2.7, kok: 3.4, tori: 4.2, pon: 5.0, aka: 5.9, kin: 7.5, horn: 11.1, end: 12.4 }; // 東(きーの来たほう)から順に、最後にトンネルにいちばん近い赤べこ。そのあと、ぽんぽんカーのお世話係が来て、きーのおでこに禁止マークを貼る(D365)
let nSoT0 = -1; // 抗議が始まった時刻
let nSoShort = false; // 2 回目からの空ぶかし(この入場で鳴らしたか)
// リプレイ券で最初からやり直したときは、札を持ったまま(D366)。もう一度勝つまでは、札をもらう前と同じにする
const nFudaKept = (api) => api.flag("fudaKept");
const nSoOn = (api) => api.hasItem("クラブの札") && !nFudaKept(api);
const nSoAge = () => (nSoT0 >= 0 ? nNow() - nSoT0 : -1);
const nSoWin = (k, len) => {
  const u = nSoAge() - N_SO[k];
  return u >= 0 && u < len ? u / len : -1;
};
const nSoRev = () => {
  const u = nSoAge() - N_SO.rev;
  return u >= 0 && u < 1.1;
};
// 赤べこの正面の絵(akabeko_s)を、頭と、頭を外した体に分ける(頭は前の顔を重ねた楕円 aka_map/face.py: 中心 (22, 28.5)、半径 12.6・13.2)。
// 頭を外したあとは、首の穴(上半分)を暗い赤、下は前輪のあいだの空き(透明)にする。支点は首の付け根
const N_AKA_HEAD = { cx: 22, cy: 28.5, rx: 12.8, ry: 13.4, px: 22, py: 17 };
let nAkaParts = null;
const nAkaHeadParts = (im) => {
  if (nAkaParts && nAkaParts.src === im) return nAkaParts;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = im.width;
    c.height = im.height;
    return c;
  };
  const body = mk(), head = mk();
  const bg = body.getContext("2d"), hg = head.getContext("2d");
  bg.drawImage(im, 0, 0);
  hg.drawImage(im, 0, 0);
  const bd = bg.getImageData(0, 0, im.width, im.height), hd = hg.getImageData(0, 0, im.width, im.height);
  const H = N_AKA_HEAD;
  for (let y = 0; y < im.height; y++)
    for (let x = 0; x < im.width; x++) {
      const i = (y * im.width + x) * 4;
      const inside = ((x + 0.5 - H.cx) / H.rx) ** 2 + ((y + 0.5 - H.cy) / H.ry) ** 2 <= 1;
      if (inside) {
        if (y < H.cy - 2) bd.data.set([70, 18, 14, bd.data[i + 3]], i); // 首の穴
        else bd.data[i + 3] = 0;
      } else hd.data[i + 3] = 0;
    }
  bg.putImageData(bd, 0, 0);
  hg.putImageData(hd, 0, 0);
  nAkaParts = { src: im, body, head };
  return nAkaParts;
};
const N_SO_KEY = { so_tansu: "tansu", so_miton: "miton", so_kokeshi: "kok", so_toribogi: "tori", so_ponpon: "pon", so_akabeko: "aka" };
// 並ぶ 1 台。draw(ctx, sx, sy, t, im, api) でしぐさを描く
const nSoCar = (id, img, x, y, w, h, gesture, solid) =>
  nSprite(id, img, x, y, w, h, {
    hidden: (api) => !nSoOn(api),
    solid,
    range: 56,
    interact: (api) => (N_VOICE[id.slice(3)] ? api.bubble(id, N_VOICE[id.slice(3)], 1600) : api.bubble(id, "……", 1200)),
    draw(ctx, sx, sy, t, api) {
      const im = api.image(img);
      if (!im) return;
      const j = nSoRev() ? Math.round(Math.sin(t * 47 + x) * 1.2) : 0; // 空ぶかしのふるえ
      const x0 = Math.round(sx - im.width / 2) + j;
      const y0 = Math.round(sy - im.height);
      // いやいや: 自分の番に、足もとを支点に体を左右にゆする(だんだん小さく。作者「いやいやをするように他のマシンも動きをつけていい」)
      const key = N_SO_KEY[id];
      const u = key ? nSoWin(key, 1.3) : -1;
      if (u >= 0) {
        const tau = u * 1.3;
        const ang = (key === "aka" ? 0.06 : 0.11) * Math.exp(-1.4 * tau) * Math.sin(2 * Math.PI * 2.6 * tau);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(ang);
        ctx.translate(-sx, -sy);
      }
      if (!gesture(ctx, x0, y0, t, im)) ctx.drawImage(im, x0, y0);
      if (u >= 0) ctx.restore();
    },
  });
const nSoCars = () => [
  // 赤べこ: 張り子の首を横に振る(首振り人形の「いいえ」)。頭は首の付け根(頭のてっぺん)にぶら下がっているので、
  // そこを支点に振り子のように回し、ばねのようにだんだん小さくなる(作者「あかべこの首振りが不自然。」で、平行にずらすのをやめた)
  nSoCar("so_akabeko", "akabeko_s", 7.4 * T, 4.9 * T, 44, 41, (ctx, x0, y0, t, im) => {
    const u = nSoWin("aka", 1.6);
    if (u < 0) return false;
    const parts = nAkaHeadParts(im);
    const tau = u * 1.6;
    const ang = 0.3 * Math.exp(-1.5 * tau) * Math.sin(2 * Math.PI * 2.4 * tau);
    ctx.drawImage(parts.body, x0, y0);
    ctx.save();
    ctx.translate(x0 + N_AKA_HEAD.px, y0 + N_AKA_HEAD.py);
    ctx.rotate(ang);
    ctx.drawImage(parts.head, -N_AKA_HEAD.px, -N_AKA_HEAD.py);
    ctx.restore();
    return true;
  }, { w: 40, h: 22, dy: -10 }),
  // ぽんぽんカー: 丸い目(ライト x 22・68、y 65)を点滅させる
  nSoCar("so_ponpon", "ponpon_s", 13.4 * T, 4.8 * T, 91, 77, (ctx, x0, y0, t, im) => {
    ctx.drawImage(im, x0, y0);
    const u = nSoWin("pon", 1.1);
    if (u >= 0 && Math.floor(u * 8) % 2 === 0) for (const ex of [22, 68]) nGlow(ctx, x0 + ex, y0 + 65, 9, "255, 240, 170", 0.85);
    return true;
  }, { w: 70, h: 22, dy: -10 }),
  // とりぼぎかー: 子がもの噴流(白い筋を左右へ)
  nSoCar("so_toribogi", "tori_s", 15.6 * T, 4.8 * T, 42, 55, (ctx, x0, y0, t, im) => {
    const u = nSoWin("tori", 1.1);
    const jx = u >= 0 ? Math.round(Math.sin(t * 60) * 1) : 0;
    ctx.drawImage(im, x0 + jx, y0);
    if (u >= 0) {
      ctx.fillStyle = "rgba(250, 250, 255, 0.85)";
      const L = 6 + Math.round(Math.random() * 8);
      for (let i = 0; i < L; i++) {
        ctx.fillRect(x0 + 12 - i, y0 + 6 + (Math.random() < 0.3 ? 1 : 0), 1, 1);
        ctx.fillRect(x0 + 32 + i, y0 + 4 + (Math.random() < 0.3 ? 1 : 0), 1, 1);
      }
    }
    return true;
  }, { w: 46, h: 22, dy: -10 }),
  // こけし: 前をはね上げて、ふかす
  nSoCar("so_kokeshi", "kokeshi_s", 17.3 * T, 4.8 * T, 28, 54, (ctx, x0, y0, t, im) => {
    const u = nSoWin("kok", 1.1);
    if (u < 0) return false;
    ctx.drawImage(im, x0, y0 - Math.round(Math.sin(u * Math.PI) * 5 + Math.abs(Math.sin(t * 30)) * 1));
    return true;
  }, { w: 22, h: 14, dy: -7 }),
  // 車箪笥: 引き出しをガタガタ(上下左右に細かくゆれる)
  nSoCar("so_tansu", "tansu_w", 22.8 * T, 4.9 * T, 116, 100, (ctx, x0, y0, t, im) => {
    const u = nSoWin("tansu", 1.2);
    if (u < 0) return false;
    ctx.drawImage(im, x0 + Math.round(Math.sin(t * 70) * 2), y0 + Math.round(Math.sin(t * 53) * 1.5));
    return true;
  }, { w: 100, h: 24, dy: -12 }),
  nSoCar("so_miton", "miton_s", 25.4 * T, 4.8 * T, 40, 75, () => false, { w: 24, h: 14, dy: -7 }),
];
// ぽんぽんカーのお世話係(木の葉のぼぎ)が、きーに禁止マークを貼る(D365、作者「ぽんぽんかーのお世話係がやってきて、きーに禁止マークをはりつけるのはどうか」「おすすめどおり」)。
// 札は白地に赤い丸と斜線だけ(小さいので絵は入れない)。この断片を出るまで、きーのおでこに貼ったまま(トンネルに入ると消す)
let nKinshi = false;
// リプレイ券(D366): ピンボールで 10,000 点を超えるともらえる券を、お世話係にわたすと、この断片を最初からやり直せる。
// 戻すのは断片の中の進みだけ。ピンボールの最高点、覚えた能力、見届け、太宰の本、持ち帰った札はそのまま
const N_REPLAY_FLAGS = ["custom", "ponponGone", "seeOffDone", "stripSeen", "won", "nrR1", "nrR2", "nrRound"];
let nTakeT0 = -1; // お世話係が券を受け取った時刻
let nReplaying = false; // 券をわたしている途中(A の押しなおしで二重にわたさない)
function nReplay(api) {
  if (nReplaying) return;
  nReplaying = true;
  api.hold("ic_ticket", 1.4, () => {
    api.takeItem("リプレイ券");
    api.sfx("pop");
    nTakeT0 = nNow();
    api.freeze(1.3);
    api.later(1000, () => {
      const kept = api.hasItem("クラブの札");
      N_REPLAY_FLAGS.forEach((f) => api.setFlag(f, false));
      api.setFlag("fudaKept", kept);
      nKinshi = false;
      nFuelT0 = -1;
      nSoT0 = -1;
      nSoShort = false;
      nTakeT0 = -1;
      nReplaying = false;
      api.warp("pass", "start");
    });
  });
}
let nSoKi = null; // 抗議が始まったときのきーの足もと
// 通り道(D367、作者「おせわぼぎがいろいろなものをすり抜けて、きーに近寄って禁止マークをはるのがおかしい。」):
// ドラム缶の西どなりから南の道へ出て、マシンの列の前を横に歩き、きーの横で止まる。帰りは同じ道を逆に。歩く時間は道のりで決める
const N_KIN_STAY = 0.7, N_KIN_SPEED = 120, N_KIN_LANE = 5.6 * T; // 列の前の道(マシンの足もとは 4.9T)
let nKinPts = null, nKinLen = [0], nKinWalk = 1.6;
const nKinPlan = (ki) => {
  const S = N_FUEL_REST, G = { x: ki.x - 32, y: ki.y - 2 };
  nKinPts = [S, { x: S.x, y: N_KIN_LANE }, { x: G.x, y: N_KIN_LANE }, G];
  nKinLen = [0];
  for (let k = 1; k < nKinPts.length; k++) nKinLen.push(nKinLen[k - 1] + Math.hypot(nKinPts[k].x - nKinPts[k - 1].x, nKinPts[k].y - nKinPts[k - 1].y));
  nKinWalk = Math.max(1.2, nKinLen[nKinLen.length - 1] / N_KIN_SPEED);
};
const nKinAt = (d) => {
  let k = 1;
  while (k < nKinPts.length - 1 && nKinLen[k] < d) k++;
  const a = nKinPts[k - 1], b = nKinPts[k], seg = nKinLen[k] - nKinLen[k - 1] || 1;
  const u = Math.max(0, Math.min(1, (d - nKinLen[k - 1]) / seg));
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
};
const nFuelerSo = () => {
  const e = nSoAge() - N_SO.kin;
  if (!nSoKi || !nKinPts || e < 0 || e > nKinWalk * 2 + N_KIN_STAY) return null;
  const L = nKinLen[nKinLen.length - 1];
  const walking = e < nKinWalk || e > nKinWalk + N_KIN_STAY;
  const d = e < nKinWalk ? (e / nKinWalk) * L : walking ? (1 - (e - nKinWalk - N_KIN_STAY) / nKinWalk) * L : L;
  const q = nKinAt(d);
  const hop = walking ? Math.abs(Math.sin(e * 12)) * 2 : 0; // とことこ
  const reach = e > nKinWalk + 0.15 && e < nKinWalk + 0.45 ? 3 : 0; // 背のび
  return { x: q.x, y: q.y - hop - reach };
};
// きーの体の禁止マーク(13×13。作者「禁止マークはもっと大きくていい。」D367)。赤い輪と、左上から右下への斜線、白地。ふちに暗い線
const N_KINSHI = (() => {
  const N = 13, c = 6, M = [];
  for (let j = 0; j < N; j++) {
    let row = "";
    for (let i = 0; i < N; i++) {
      const r = Math.hypot(i - c, j - c);
      const slash = Math.abs(i - j) <= 1 && r < 5.2;
      row += r > 6.5 ? "." : r > 5.6 ? "k" : r > 4.4 || slash ? "r" : "w";
    }
    M.push(row);
  }
  return M;
})();
const nKinshiDraw = (ctx, ox, oy, api) => {
  if (!nKinshi) return;
  const p = api.player();
  if (p.facing === "north") return; // うしろ向きのときは見えない
  const dx = p.facing === "west" ? -6 : p.facing === "east" ? 6 : 0;
  const x = Math.round(ox + p.x + dx) - 6, y = Math.round(oy + p.y - 9) - 6; // 体のまん中(きーの絵を撮って合わせた)
  const col = { r: "#d42a20", w: "#f6f2ea", k: "#5a1a14" };
  N_KINSHI.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === ".") return;
    ctx.fillStyle = col[ch];
    ctx.fillRect(x + i, y + j, 1, 1);
  }));
};
// はじめて帰るときの抗議の流れ(カメラを引いて、並んだマシン達を見せる)
const nSoStart = (api) => {
  nSoT0 = nNow();
  nSoKi = { x: api.player().x, y: api.player().y };
  nKinPlan(nSoKi);
  // お世話係が歩くぶん、クラクションと終わりをうしろへずらす
  N_SO.horn = N_SO.kin + nKinWalk + N_KIN_STAY + 0.9;
  N_SO.end = N_SO.horn + 1.3;
  api.freeze(N_SO.end);
  const p = api.player();
  // 引いて全員の空ぶかしを見せ、そのあと 1 台ずつ寄る(しぐさが小さいので)
  const Y = 4.1 * T, Z = 1.5;
  api.camPath([
    { t: 0, x: p.x, y: p.y - 20, z: 1 },
    { t: 0.5, x: 15.5 * T, y: 4.6 * T, z: 0.55 },
    { t: 1.5, x: 15.5 * T, y: 4.6 * T, z: 0.55 },
    { t: N_SO.tansu, x: 23.6 * T, y: Y, z: Z },
    { t: N_SO.miton + 0.4, x: 24.2 * T, y: Y, z: Z },
    { t: N_SO.kok, x: 17.3 * T, y: Y, z: Z },
    { t: N_SO.kok + 0.6, x: 17.3 * T, y: Y, z: Z },
    { t: N_SO.tori, x: 15.6 * T, y: Y, z: Z },
    { t: N_SO.tori + 0.6, x: 15.6 * T, y: Y, z: Z },
    { t: N_SO.pon, x: 13.4 * T, y: Y, z: Z },
    { t: N_SO.pon + 0.6, x: 13.4 * T, y: Y, z: Z },
    { t: N_SO.aka, x: 7.4 * T, y: 4.4 * T, z: 1.8 },
    { t: N_SO.kin - 0.1, x: 7.4 * T, y: 4.4 * T, z: 1.8 },
    { t: N_SO.kin + 0.5, x: N_FUEL_REST.x, y: 5.2 * T, z: 1.3 },
    { t: N_SO.kin + nKinWalk - 0.3, x: p.x - 10, y: p.y - 24, z: 1.3 },
    { t: N_SO.kin + nKinWalk, x: p.x - 10, y: p.y - 24, z: 1.7 },
    { t: N_SO.kin + nKinWalk + N_KIN_STAY + 0.4, x: p.x - 10, y: p.y - 24, z: 1.7 },
    { t: N_SO.horn, x: 13 * T, y: 4.8 * T, z: 0.8 },
    { t: N_SO.end - 0.6, x: 13 * T, y: 4.8 * T, z: 0.8 },
  ]);
  const say = (ms, id, text, dur) => api.later(ms, () => api.bubble(id, text, dur || 1300));
  api.later(N_SO.rev * 1000, () => (api.sfx("rev"), api.shake(0.5, 1)));
  api.later(N_SO.rev * 1000 + 350, () => api.sfx("rev"));
  // この場面ではマシンにセリフ(オノマトペ)を言わせない。音としぐさだけ(作者「このシーンでマシンのセリフはいらない」)
  api.later(N_SO.pon * 1000, () => {
    for (let k = 0; k < 6; k++) api.later(k * 140, () => nPuff(13.4 * T + (Math.random() - 0.5) * 20, 4.8 * T - 60, (Math.random() - 0.5) * 30, -20 - Math.random() * 10, 1.2, 9, "46, 42, 42"));
  });
  api.later(N_SO.kok * 1000, () => api.sfx("rev"));
  say(N_SO.miton * 1000, "so_miton", "……", 1200);
  api.later((N_SO.kin + nKinWalk + 0.35) * 1000, () => (nKinshi = true, api.sfx("pop"))); // ぺたっ
  for (const k of [0, 380, 760]) api.later(N_SO.horn * 1000 + k, () => api.sfx("horn"));
  api.later(N_SO.end * 1000, () => api.setFlag("seeOffDone"));
};
// 2 回目からは、近づくと並んで空ぶかしするだけ(止めない)
const nSoShortRev = (api) => {
  nSoShort = true;
  nSoT0 = nNow() - N_SO.rev + 0.05;
  api.sfx("rev");
  api.later(1200, () => (nSoT0 = -1));
};
const N_PASS = nMap("pass", 28, 12, {
  spawns: {
    start: { x: 4.5 * T, y: 4.7 * T, facing: "south" },
    east: { x: 26.4 * T, y: 6.8 * T, facing: "west" },
  },
  onEnter() {
    nSoShort = false;
    nSoT0 = -1;
  },
  drawOverlay(ctx, ox, oy, t, api) {
    const e = nFuelAge(api);
    const dx = N_CAR0 - N_DRUM;
    const up = e > N_FUEL.dump && e < N_FUEL.go + 1 ? 1.7 : 1;
    nGlow(ctx, ox + dx, oy + 4.7 * T - 46, 20 * up, "255, 150, 60", 0.32 + 0.1 * Math.sin(t * 11));
    // 線: ドラム缶から、ぽんぽんカーへ(走り去ったあとは、東の道の先へのびたまま)
    // 札をもらったあとは、ぽんぽんカーが峠に戻って並んでいる(D364)ので、線はそのぽんぽんカーへ
    const cx = nSoOn(api) ? 13.4 * T + 10 : nGone(api) ? 28 * T + 40 : nCarX(api);
    nCable(ctx, ox + dx + 12, oy + 4.7 * T - 44, ox + cx - 30, oy + 4.7 * T - 30, nGone(api) && !nSoOn(api) ? 2 : 10);
    if (!nGone(api) && e > N_FUEL.fire && Math.random() < 0.35) nPuff(cx - 34, 4.7 * T - 30, -30, -18, 0.8, 7);
    nDrawPuffs(ctx, ox, oy);
    nKinshiDraw(ctx, ox, oy, api);
  },
  triggers: [
    {
      id: "leave",
      x: 3 * T,
      y: 1.8 * T,
      w: 3 * T,
      h: 1.2 * T,
      run(api) {
        if (nSoOn(api)) {
          api.sfx("horn"); // トンネルに入るきーのうしろで、まだクラクション
          setTimeout(() => window.bogiAudio && window.bogiAudio.sfx("horn"), 420);
        }
        nKinshi = false; // 禁止マークは、この断片を出るまで
        api.exit();
      },
    },
    {
      id: "seeoff",
      x: 0,
      y: 4 * T,
      w: 21.5 * T,
      h: 5 * T,
      enabled: (api) => nSoOn(api) && nSoT0 < 0 && !(api.flag("seeOffDone") && nSoShort),
      run(api) {
        if (!api.flag("seeOffDone")) nSoStart(api);
        else nSoShortRev(api);
      },
    },
    { id: "toDrivein", x: 27.6 * T, y: 4 * T, w: 1.4 * T, h: 5 * T, warp: { map: "drivein", spawn: "west" } },
    {
      id: "fuel",
      x: 10.4 * T,
      y: 3 * T,
      w: 1.2 * T,
      h: 6 * T,
      enabled: (api) => !api.flag("ponponGone"),
      run(api) {
        if (nFuelT0 >= 0) return;
        nFuelT0 = nNow();
        api.freeze(N_FUEL.walk + 0.2);
        api.later(N_FUEL.walk * 1000, () => api.bubble("fueler", "もってきた　ぽんぽんカー　もってきた", 3400));
        api.later(N_FUEL.fire * 1000, () => api.bubble("ponpon", N_VOICE.ponpon, 1600));
        api.later(N_FUEL.gone * 1000, () => {
          api.setFlag("ponponGone");
          nFuelT0 = -1;
        });
      },
    },
  ],
  objects: [
    nSprite("ponpon", "ponpon_e", N_CAR0, 4.75 * T, 80, 59, {
      hidden: nGone,
      shake: true,
      solid: { w: 66, h: 22, dy: -10 },
      range: 56,
      interact: nTalk("ponpon"),
      canInteract: (api) => nFuelT0 < 0,
      update(dt, t, api) {
        this.x = nCarX(api);
        if (this.x > N_CAR0) this.solid = null;
      },
    }),
    nSprite("drum", "drum", N_CAR0 - N_DRUM, 4.7 * T, 46, 62, { solid: { w: 34, h: 16, dy: -8 } }),
    ...nSoCars(), // きーが帰るときの抗議(D364)
    // 北の小道の口のパイロン(D343)。木の葉のぼぎは小道から来るが、きーは入れない
    ...[18.3, 18.95, 19.6, 20.25, 20.9].map((x, k) => nSprite("pylon" + k, "pylon", x * T, 4.05 * T, 12, 16, {})),
    nSprite("fueler", "fueler", 18.9 * T, 1.2 * T, 26, 40, {
      hidden: (api) => nFuelerAtStrip(api), // カスタムのあと札をもらうまでは、ストリップの入口にいる(D367)
      range: 44,
      // リプレイ券を持っていれば、わたす(D366)
      interact: (api) => (api.hasItem("リプレイ券") ? nReplay(api) : api.bubble("fueler", "……", 1200)),
      update(dt, t, api) {
        const e = nFuelAge(api);
        const u = e < 0 ? 0 : Math.min(1, e / N_FUEL.walk);
        const v = e < N_FUEL.say + N_FUEL.walk ? 0 : Math.min(1, (e - N_FUEL.walk - N_FUEL.say) / 1.4);
        this.x = 18.9 * T + (17.2 * T - 18.9 * T) * u - 6.2 * T * v;
        this.y = 1.2 * T + (4.2 * T - 1.2 * T) * u;
        const w = Math.max(0, Math.min(1, (e - N_FUEL.step) / 0.7)); // ドラム缶の西どなりへ
        this.x += (N_FUEL_REST.x - 11 * T) * w;
        this.y += (N_FUEL_REST.y - 4.2 * T) * w;
        if (nTakeT0 >= 0) this.y -= Math.abs(Math.sin((nNow() - nTakeT0) * 9)) * 4; // 券を受け取って、ぴょんぴょんはねる
        const so = nFuelerSo(); // きーに禁止マークを貼りにいく(D365)
        if (so) {
          this.x = so.x;
          this.y = so.y;
        }
      },
    }),
  ],
});

// B ドライブイン跡(野犬のたまり場)。ダイナーの戸(北の建物の真ん中)から中へ入れる。みとんの車箪笥は駐車場の東(家なので)
// みとんに話しかけると、車箪笥の引き出しからぼぎカーが出て、炎を塗ってくれる(一枚絵 v_custom、仮)。そのあと野犬たちは直線へ
const nAtStrip = (api) => api.flag("custom");
// 車箪笥とみとんは、カスタムの場面のあともドライブイン跡に残り、きーがストリップへ行ったらストリップだけにいる
// (ドライブイン跡とストリップの両方にいて、別の個体に見えないように。作者「ダイナーの前のミトンと車箪笥はずっといると、コースにいる個体と別にみえないか」)
const nMovedToStrip = (api) => api.flag("custom") && api.flag("stripSeen");
const N_DRIVEIN = nMap("drivein", 28, 14, {
  spawns: {
    west: { x: 1.2 * T, y: 8.5 * T, facing: "east" },
    east: { x: 26.8 * T, y: 8.5 * T, facing: "west" },
    diner: { x: 14 * T, y: 6 * T, facing: "south" },
  },
  // ぽんぽんカーの線は、西の峠のドラム缶からのびてくる
  drawOverlay(ctx, ox, oy, t, api) {
    nKinshiDraw(ctx, ox, oy, api); // 禁止マーク(D365)
    if (!nAtStrip(api)) nCable(ctx, ox - 10, oy + 9.6 * T, ox + 10.6 * T - 24, oy + 11.2 * T - 26, 30);
  },
  triggers: [
    { id: "toPass", x: -T, y: 5 * T, w: 1.45 * T, h: 7 * T, warp: { map: "pass", spawn: "east" } },
    { id: "toStrip", x: 27.55 * T, y: 5 * T, w: 1.45 * T, h: 7 * T, warp: { map: "strip", spawn: "west" } },
    { id: "toDiner", x: 13.2 * T, y: 4.9 * T, w: 1.6 * T, h: 0.45 * T, warp: { map: "diner", spawn: "door" } },
  ],
  objects: [
    kWall(22 * T, 0, 28 * T, 150), // 北東の砂地(サボテン、矢印の看板)は景色。背景の絵の物の奥に回りこまないように、ふさぐ
    nSprite("ponpon", "ponpon_s", 10.6 * T, 11.2 * T, 91, 77, { hidden: nAtStrip, shake: true, solid: { w: 56, h: 22, dy: -10 }, range: 56, interact: nTalk("ponpon") }),
    nSprite("toribogi", "tori_s", 5.2 * T, 11.3 * T, 42, 55, { hidden: nAtStrip, solid: { w: 52, h: 22, dy: -10 }, range: 56, interact: nTalk("toribogi") }),
    nSprite("akabeko", "akabeko_s", 16.6 * T, 11.2 * T, 44, 41, { hidden: nAtStrip, shake: true, solid: { w: 40, h: 22, dy: -10 }, range: 56, interact: nTalk("akabeko") }),
    nSprite("kokeshi", "kokeshi_s", 19.6 * T, 11.2 * T, 28, 54, { hidden: nAtStrip, solid: { w: 22, h: 14, dy: -7 }, range: 50, interact: nTalk("kokeshi") }),
    nSprite("tansu", "tansu_w", 23.2 * T, 10.4 * T, 116, 100, { hidden: nMovedToStrip, shake: true, solid: { w: 108, h: 26, dy: -13 }, range: 70, interact: nTalk("tansu") }),
    nSprite("miton", "miton_s", 26.2 * T, 10.2 * T, 36, 66, {
      hidden: nMovedToStrip, // カスタムのあと、きーがストリップへ行ったら、車箪笥といっしょにストリップだけにいる
      solid: { w: 24, h: 14, dy: -7 },
      range: 50,
      interact(api) {
        if (api.flag("custom")) return api.bubble("miton", "……", 1400); // 仮
        api.bubble("miton", "……", 1400); // 仮
        api.later(1500, () =>
          api.show("v_custom", () => {
            api.setFlag("custom");
            api.bubble("tansu", N_VOICE.tansu, 1800);
          }, { full: true })
        );
      },
    }),
    nSprite("bogicar", "bogicar_e_flame", 23.2 * T, 11.8 * T, 77, 37, { hidden: (api) => !api.flag("custom") || api.flag("won") }),
  ],
});

// C ダイナーの中(D127、D128)。レースの日のまま止まった店。中に入るのはきーだけ
// 南の窓からの光の帯の中で、ほこりがゆっくり舞う。ジュークボックスは、調べると泡が光ってのぼり、色の光が床を流れる(電気が来ていないわけは説明しない)
// 壁の写真を調べると、レースの日の一枚絵(後ろ姿の見物人と、走る車。v_photo)
let nJukeT0 = -1;
let nJukeN = 0; // 最後にかけたレコード(0 はまだ)
const N_JUKE = ["juke_1", "juke_2", "juke_3"]; // 3 枚(D337、D342)
const nJukePlaying = () => !!window.bogiAudio && N_JUKE.includes(window.bogiAudio.state().bgm);
let nPinT0 = -1;
const nMotes = [];
for (let i = 0; i < 46; i++) nMotes.push({ x: Math.random(), y: Math.random(), p: Math.random() * 6, s: Math.random() < 0.3 ? 2 : 1 });
const N_SHAFTS = [3, 7.5, 12.5]; // 光の帯の南のはし(マス)
const N_DINER = nMap("diner", 20, 12, {
  bg: "#2a2420",
  spawns: { door: { x: 10 * T, y: 10.5 * T, facing: "north" }, pinball: { x: 1.5 * T, y: 10.85 * T, facing: "north" } /* 左の壁のマスにかからない所(作者「ゲームしたあとにハマる」) */ },
  drawOverlay(ctx, ox, oy, t, api) {
    // ほこり: 光の帯の中だけ、ゆっくり上下に漂う
    for (const m of nMotes) {
      const k = Math.floor(m.x * N_SHAFTS.length) % N_SHAFTS.length;
      const v = (m.y + t * 0.012 * (1 + m.p * 0.1)) % 1;
      const yy = 5 * T + v * 7 * T;
      const w0 = N_SHAFTS[k] * T + (1 - v) * 0.8 * T * 0 + (yy - 5 * T) * 0;
      const xx = w0 + 0.8 * T + ((m.x * 97) % 1) * 2 * T - (yy - 5 * T) * 0.11 + Math.sin(t * 0.6 + m.p) * 4;
      ctx.fillStyle = `rgba(255, 248, 220, ${0.35 + 0.3 * Math.sin(t * 1.3 + m.p)})`;
      ctx.fillRect(Math.round(ox + xx), Math.round(oy + yy), m.s, m.s);
    }
    // ジュークボックス(1963 Seeburg のコンソール型 D141): 前の格子と下の灯りの帯が、色を変えながら光る
    // レコードがかかっている間は光り続ける(音が出ない環境では 14 秒)
    const e = nJukeT0 < 0 ? -1 : nNow() - nJukeT0;
    const on = nJukePlaying() ? 1e9 : 14;
    if (e >= 0 && e < on) {
      const a = Math.min(1, e / 0.8) * Math.min(1, (on - e) / 2);
      const jx = ox + 18.06 * T;
      const jy = oy + 1.4 * T;
      const cols = ["255, 90, 60", "255, 210, 80", "90, 220, 130", "90, 160, 240"];
      nGlow(ctx, jx, jy, 46, cols[Math.floor(t * 2) % 4], 0.32 * a);
      nGlow(ctx, jx, jy + 0.55 * T, 30, cols[(Math.floor(t * 2) + 1) % 4], 0.45 * a);
      // 色の光が、床の市松の上を流れる
      for (let k = 0; k < 4; k++) {
        const ang = t * 0.5 + (k * Math.PI) / 2;
        nGlow(ctx, ox + 8 * T + Math.cos(ang) * 5 * T, oy + 7.2 * T + Math.sin(ang * 1.3) * 2.2 * T, 34, cols[k], 0.2 * a);
      }
    }
    // ピンボール(1960 年代の Gottlieb のくさび形の頭): 調べると、頭の絵のガラスとバンパーの灯りがまたたく
    const pe = nPinT0 < 0 ? -1 : nNow() - nPinT0;
    if (pe >= 0 && pe < 3.2) {
      const on = Math.floor(pe * 8) % 2 === 0;
      nGlow(ctx, ox + 1.2 * T, oy + 7.6 * T, 22, "255, 200, 90", (on ? 0.55 : 0.25) * Math.min(1, (3.2 - pe) / 0.6));
      nGlow(ctx, ox + 1.2 * T, oy + 9.0 * T, 16, "255, 240, 150", (on ? 0.2 : 0.5) * Math.min(1, (3.2 - pe) / 0.6));
    }
  },
  // レコードがかかっている間は、ジュークボックスに近いほど大きく聞こえる(店の反対のはしで半分くらい)
  bgmLevel: (p) => (nJukePlaying() ? 1 - 0.5 * Math.min(1, Math.hypot(p.x - 18.06 * T, p.y - 3.3 * T) / (16 * T)) : 1),
  triggers: [{ id: "out", x: 9 * T, y: 11.55 * T, w: 2 * T, h: T, warp: { map: "drivein", spawn: "diner" } }],
  objects: [
    {
      id: "juke",
      x: 18.06 * T,
      y: 3.3 * T,
      w: 1,
      h: 1,
      headY: 2.4 * T,
      range: 56,
      // 調べると、次のレコードを 1 枚かける(D334。3 枚を順に D342)。かかっている間は灯りが光り続け、終わるとダイナーの静けさに戻る
      interact(api) {
        nJukeT0 = nNow();
        nJukeN = (nJukeN % N_JUKE.length) + 1;
        const key = "juke_" + nJukeN;
        if (window.bogiAudio)
          window.bogiAudio.bgm(key, {
            once: true,
            onEnd: () => {
              if (window.bogiAudio.state().bgm === key) window.bogiAudio.bgm("noroi");
            },
          });
        api.bubble("juke", "♪　　♪", 2600);
        api.later(3200, () => api.bubble("juke", "♪", 2200));
      },
    },
    { id: "photo", x: 14.3 * T, y: 3.2 * T, w: 1, h: 1, headY: 2.2 * T, range: 48, interact: (api) => api.show("v_photo") },
    { id: "plaques", x: 13.2 * T, y: 3.2 * T, w: 1, h: 1, headY: 2.6 * T, range: 44, interact: (api) => api.show("v_plaque") }, // 一つ分あいた釘。並んだ札を調べると、クラブの札の大写し(作者「プラークのデザインを見せてあげればよい」)
    { id: "pinball", x: 1.25 * T, y: 9.3 * T, iy: 1.6 * T, w: 1, h: 1, headY: 2.4 * T, range: 30, // 台の正面(下)に立って調べる(D328)
       interact: (api) => { nPinT0 = nNow(); api.later(500, () => api.warp("pinball", "view")); } }, // ピンボール: 灯りがまたたいてから、台の画面へ(D327。pinball.js)
    {
      // ボックス席のテーブルの雑誌「BOGICAR GRAPHIC」(D320): 表紙から、A でめくって 6 台を 1 台ずつ(絵は docs/assets/noroi/magazine/make.py)
      id: "magazine",
      x: 17.2 * T, // 調味料のびんの右
      y: 8.75 * T,
      ix: -1.7 * T, // 調べる点は、通路(テーブルの左のはし)に寄せる。きーはテーブルの中へは入れない(作者「出ない」)
      w: 1,
      h: 1,
      range: 40,
      headY: 0.6 * T,
      draw(ctx, sx, sy) {
        // 赤い題の帯の、少し斜めに置かれた一冊
        ctx.fillStyle = "rgba(40, 30, 20, 0.25)";
        ctx.fillRect(sx - 6, sy - 9, 13, 10);
        ctx.fillStyle = "#e8e0cc";
        ctx.fillRect(sx - 7, sy - 11, 12, 10);
        ctx.fillStyle = "#b4281f";
        ctx.fillRect(sx - 7, sy - 11, 12, 3);
        ctx.fillStyle = "#5a3a28";
        ctx.fillRect(sx - 4, sy - 5, 6, 2);
      },
      interact(api) {
        // めくる音と、紙がめくれる効果(D325、D326)
        const page = (i) => {
          api.sfx("page");
          // ページの枠(make.py): 表紙は x 140〜340、見開きはのど 238・右はし 466、どちらも y 8〜280
          const box = i === 1 ? { spine: 140 / 480, right: 340 / 480 } : { spine: 238 / 480, right: 466 / 480 };
          api.show(`v_mag_${i}`, i < 6 ? () => page(i + 1) : null, i > 0 ? { flip: `v_mag_${i - 1}`, page: Object.assign(box, { top: 8 / 288, bottom: 280 / 288 }) } : null);
        };
        page(0);
      },
    },
  ],
});
// レコードがかかっていれば、そのまま(ピンボールから戻ったときに止めない)。nMap は Object.assign なので、あとから getter をつける
Object.defineProperty(N_DINER, "bgm", { get: () => (nJukePlaying() ? window.bogiAudio.state().bgm : undefined) });
// 店の外(ドライブイン跡)でも、レコードは小さく聞こえる。扉の前で 3 割、遠ざかるほど小さく(D339、作者「ダイナーの外でも小さく聞こえるようにして」)
Object.defineProperty(N_DRIVEIN, "bgm", { get: () => (nJukePlaying() ? window.bogiAudio.state().bgm : undefined) });
N_DRIVEIN.bgmLevel = (p) => (nJukePlaying() ? Math.max(0.05, 0.3 * (1 - Math.hypot(p.x - 14 * T, p.y - 5 * T) / (14 * T))) : 1);

// D 旧国道の直線(ドラッグストリップ)。競争の画面と同じ場所(D140): 北と南に空っぽの木のスタンド、スタートの白線と信号の柱、東にゴールの線と計時の小屋
// 炎を塗ったあと、野犬たちが北の路肩に並び、スタートの白線の手前に三台(ぽんぽんカー、赤べこ、ぼぎカー)
const nRace = (api) => api.warp("race", "view");
// 対戦カード(D367): 左にぼぎカー、右に 5 台(勝ち抜きの順)。勝った相手は暗くして「かち」、次の相手は黄の枠が点滅
let nCard = null; // { t0, round, sec }
let nRaceGo = false; // カードのあと、競争の画面へ切りかわるまで(そのあいだの A で、もう一度話しかけないように)
const N_CARD_SEC = 3.2;
function nCardShow(api, round, then) {
  // カードが出ているあいだも A は効くので、押すたびにカードと「競争へ」が積み重なり、競争が何度も始め直されていた
  // (作者「ポンポンカーとの競争の際、後ろからの絵が2回出た。」)。カードが出ている間は、新しいカードを出さない
  if (nCard) return;
  nCard = { t0: nNow(), round, sec: N_CARD_SEC };
  api.freeze(N_CARD_SEC);
  api.sfx("pop");
  api.later(N_CARD_SEC * 1000, () => {
    nCard = null;
    then();
  });
}
function nCardDraw(ctx, api) {
  if (!nCard) return;
  const e = nNow() - nCard.t0;
  const pix = window.bogiPix;
  const k = Math.min(1, e / 0.25); // 上から降りてくる
  const X = 40, Y = Math.round(-280 + 296 * (1 - (1 - k) * (1 - k))), W = 400, H = 268;
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${0.55 * k})`;
  ctx.fillRect(0, 0, 480, 300);
  ctx.fillStyle = "#1c1410";
  ctx.fillRect(X, Y, W, H);
  ctx.fillStyle = "#e8c060";
  ctx.fillRect(X + 3, Y + 3, W - 6, 2);
  ctx.fillRect(X + 3, Y + H - 5, W - 6, 2);
  ctx.fillRect(X + 3, Y + 3, 2, H - 6);
  ctx.fillRect(X + W - 5, Y + 3, 2, H - 6);
  for (let c = 0; c < 24; c++) for (let r = 0; r < 2; r++) if ((c + r) % 2 === 0) { ctx.fillStyle = "#f4f0dc"; ctx.fillRect(X + 8 + c * 16, Y + 10 + r * 6, 16, 6); } // チェッカーの帯
  if (pix) pix.text(ctx, "かちぬきせん", X + W / 2 - 48, Y + 30, 1, "#ffd84a");
  const im = (key) => (api.image ? api.image(key) : null);
  // 左: ぼぎカー(炎を塗った横向き)
  const bc = im("bogicar_e_flame");
  if (bc) ctx.drawImage(bc, X + 14, Y + 132, 77 * 1.3, 37 * 1.3);
  if (pix) pix.text(ctx, "きー", X + 48, Y + 192, 1, "#f4f0dc");
  if (pix) pix.text(ctx, "VS", X + 118, Y + 140, 2, "#ff7a3c");
  // 右: 5 台。相手は左(ぼぎカー)を向くように左右を反転
  N_ROUNDS.forEach((rd, i) => {
    const ry = Y + 52 + i * 42;
    const a = im(rd.img);
    const beaten = i < nCard.round;
    const cur = i === nCard.round;
    if (cur && Math.floor(e * 5) % 2 === 0) {
      ctx.fillStyle = "#ffd84a";
      ctx.fillRect(X + 156, ry - 2, 236, 40);
      ctx.fillStyle = "#1c1410";
      ctx.fillRect(X + 158, ry, 232, 36);
    }
    if (a) {
      const sc = Math.min(34 / a.height, 76 / a.width);
      const w = a.width * sc, h = a.height * sc;
      ctx.globalAlpha = beaten ? 0.35 : 1;
      ctx.save();
      ctx.translate(X + 162 + 76, ry + 36 - h);
      ctx.scale(-1, 1);
      ctx.drawImage(a, 0, 0, w, h);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    if (pix) pix.text(ctx, rd.name, X + 248, ry + 12, 1, beaten ? "#7a6440" : "#f4f0dc");
    if (beaten && pix) pix.text(ctx, "かち", X + 184, ry + 12, 1, "#ff4a3c");
  });
  ctx.restore();
}
// お世話係(木の葉のぼぎ)は、カスタムのあと札をもらうまで、ストリップの入口にいる(D367。峠からはいなくなる)
const nFuelerAtStrip = (api) => nAtStrip(api) && !nSoOn(api);
// ストリップでのマシンの場所(D367): 次の相手だけがスタートの白線(ぼぎカーのとなり)、ほかは北の路肩。ぽんぽんカーの路肩は線のつながる待避所
const N_STRIP_HOME = { ponpon: [7.6, 5.25], toribogi: [12, 4.4], kokeshi: [15.4, 4.4], tansu: [19.4, 4.4], akabeko: [25.2, 4.4] };
const N_STRIP_SLOT = [7.6, 6.9];
const nStripPos = (api, id) => {
  const cur = !api.flag("won") && N_ROUNDS[nRound(api)].id === id;
  const [x, y] = cur ? N_STRIP_SLOT : N_STRIP_HOME[id];
  return { x: x * T, y: y * T };
};
// 札をもらったマシン達は、峠のトンネルの前へ先回りしている(D367。作者「トンネル入り口にマシンがそろっていたら、レース場にはいないとおかしい。」)
const nStripHidden = (api) => !nAtStrip(api) || nSoOn(api);
const nStripCar = (id) => ({
  hidden: nStripHidden,
  update(dt, t, api) {
    const q = nStripPos(api, id);
    this.x = q.x;
    this.y = q.y;
  },
});
const N_STRIP = nMap("strip", 28, 12, {
  spawns: {
    west: { x: 1.2 * T, y: 6.6 * T, facing: "east" },
    start: { x: 4.4 * T, y: 7.8 * T, facing: "east" },
    finish: { x: 10.2 * T, y: 7.8 * T, facing: "west" },
  },
  onEnter(api) {
    if (api.flag("custom")) api.setFlag("stripSeen");
    if (api.flag("won") && (!api.hasItem("クラブの札") || nFudaKept(api))) {
      api.freeze(3.4);
      api.later(500, () => api.bubble("akabeko", N_VOICE.akabeko, 1600));
      api.later(900, () => api.bubble("kokeshi", N_VOICE.kokeshi, 1500));
      api.later(1300, () => api.bubble("ponpon", N_VOICE.ponpon, 1400));
      api.later(2000, () =>
        api.hold("ic_fuda", 1.8, () => {
          if (api.hasItem("クラブの札")) api.sfx("item"); // やり直したとき(D366)は、もう持っている
          else api.giveItem("クラブの札");
          api.setFlag("fudaKept", false);
          api.clear();
          api.show("v_plaque", () => kLearn(api, "hashiru", "はしる")); // もらった札の大写し(カークラブの札だとわかるように)。競争に勝って、はしるを覚える(D201)
        })
      );
    }
  },
  drawOverlay(ctx, ox, oy, t, api) {
    if (nAtStrip(api) && !nSoOn(api)) {
      const q = nStripPos(api, "ponpon");
      nCable(ctx, ox - 10, oy + 4.2 * T, ox + q.x - 40, oy + q.y - 24, 18); // 線は西の峠のドラム缶から
    }
    // バーンナウト(D146、D147): スタートの白線の手前で、ぽんぽんカーと赤べこがタイヤを空まわりさせ、白煙がうしろ(西 = 過去)へ流れる。
    // きーが近づくほど激しくなる
    if (nAtStrip(api) && !api.flag("won")) {
      const p = api.player();
      const q = nStripPos(api, "ponpon");
      const d = Math.hypot(p.x - 7.6 * T, p.y - 7 * T);
      const k = Math.max(0.15, Math.min(1, 1 - (d - 2 * T) / (10 * T)));
      for (const [wx, wy] of [[q.x - 26, q.y - 5], [7.6 * T - 22, 6.9 * T - 5]]) {
        if (Math.random() < 0.55 * k) nPuff(wx + Math.random() * 6, wy - Math.random() * 4, -40 - 60 * k * Math.random(), -8 - Math.random() * 14, 0.8 + 0.7 * k, 6 + 9 * k);
      }
      if (k > 0.85 && Math.random() < 0.02) api.shake(0.2, 1);
    }
    nDrawPuffs(ctx, ox, oy);
    nKinshiDraw(ctx, ox, oy, api);
    nCardDraw(ctx, api);
  },
  triggers: [{ id: "toDrivein", x: -T, y: 3 * T, w: 1.45 * T, h: 7 * T, warp: { map: "drivein", spawn: "east" } }],
  objects: [
    // 見届け: 競争のあと、空っぽのスタンドの見物人の影が消えるまで待つ(D189)
    kWatch({
      id: "w_crowd",
      x: 14 * T,
      y: 4.6 * T,
      r: 3.4 * T,
      sec: 6, lure: "255, 240, 210",
      when: (api) => api.flag("won") && api.hasItem("クラブの札") && !nFudaKept(api), // スタンドの砂(まわる)はやめた(D226)
      fx(ctx, sx, sy, p, t) {
        const a = (p < 0.3 ? p / 0.3 : (1 - p) / 0.7) * 0.5;
        ctx.fillStyle = `rgba(30, 26, 30, ${a})`;
        for (let k = 0; k < 18; k++) {
          const x = sx - 7 * T + k * 0.8 * T;
          const y = sy - 2.2 * T + Math.sin(t * 6 + k) * 1.5;
          ctx.beginPath();
          ctx.arc(x, y - 10, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(x - 6, y - 6, 12, 14);
        }
      },
    }),
    nSprite("tree", "tree", 9 * T, 4.9 * T, 20, 65, { solid: { w: 12, h: 10, dy: -5 } }), // 信号の柱はスタートの白線(D140)
    nSprite("toribogi", "tori_e", 12 * T, 4.4 * T, 93, 81, { ...nStripCar("toribogi"), range: 60, interact: nTalk("toribogi") }),
    nSprite("kokeshi", "kokeshi_e", 15.4 * T, 4.4 * T, 72, 51, { ...nStripCar("kokeshi"), range: 56, interact: nTalk("kokeshi") }),
    nSprite("tansu", "tansu_e", 19.4 * T, 4.4 * T, 118, 89, { ...nStripCar("tansu"), shake: true, range: 70, interact: nTalk("tansu") }),
    nSprite("miton", "miton_s", 22.4 * T, 4.4 * T, 36, 66, { hidden: nStripHidden, range: 50, interact: (api) => api.bubble("miton", "……", 1400) }),
    nSprite("ponpon", "ponpon_e", 7.6 * T, 5.25 * T, 80, 59, { ...nStripCar("ponpon"), shake: true, range: 56, interact: nTalk("ponpon") }),
    nSprite("akabeko", "akabeko_e", 7.6 * T, 6.9 * T, 71, 45, { ...nStripCar("akabeko"), shake: true, solid: { w: 58, h: 16, dy: -8 }, range: 60, interact: nTalk("akabeko") }),
    nSprite("bogicar", "bogicar_e_flame", 7.4 * T, 8.7 * T, 77, 37, { hidden: nStripHidden, solid: { w: 66, h: 12, dy: -6 } }),
    // お世話係: 話しかけると対戦カードが映って、5 回のレースへ(D367)。リプレイ券を持っていれば、わたす(D366)
    nSprite("fuelerS", "fueler", 2.8 * T, 8.6 * T, 26, 40, {
      hidden: (api) => !nFuelerAtStrip(api),
      range: 44,
      interact: (api) => {
        if (api.hasItem("リプレイ券")) return nReplay(api);
        if (api.flag("won")) return api.bubble("fuelerS", "……", 1200);
        if (nCard || nRaceGo) return;
        nCardShow(api, nRound(api), () => {
          nRaceGo = true;
          nRace(api);
        });
      },
      update() {
        this.y = 8.6 * T - (nTakeT0 >= 0 ? Math.abs(Math.sin((nNow() - nTakeT0) * 9)) * 4 : 0);
      },
    }),
  ],
});

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
  rcs_pon: [[18, 33, -0.6, -1], [32, 34, -0.6, -1], [44, 34, -0.6, -1], [55, 35, -0.6, -1]],
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
    nRaceGo = false;
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
