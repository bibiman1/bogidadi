// 断片: 呪いの野犬(1/4)。共通の部品と A 峠。B・C は noroi_diner.js、D は noroi_strip.js、E は noroi_race.js
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
// この断片の「今どうなっているか」(遊ぶ間に変わる値)。ここに全部まとめる。入場のたびに戻すものは worlds/index.js の onEnterWorld
const nS = {
  fuelT0: -1,
  soT0: -1, // 抗議が始まった時刻
  soShort: false, // 2 回目からの空ぶかし(この入場で鳴らしたか)
  kinshi: false,
  takeT0: -1, // お世話係が券を受け取った時刻
  replaying: false, // 券をわたしている途中(A の押しなおしで二重にわたさない)
  soKi: null, // 抗議が始まったときのきーの足もと
  jukeT0: -1,
  jukeN: 0, // 最後にかけたレコード(0 はまだ)
  pinT0: -1,
  card: null, // { t0, round, sec }
  raceGo: false, // カードのあと、競争の画面へ切りかわるまで(そのあいだの A で、もう一度話しかけないように)
};
const nFuelAge = (api) => (nS.fuelT0 >= 0 ? nNow() - nS.fuelT0 : api.flag("ponponGone") ? 99 : -1);
const N_FUEL = { walk: 1.6, say: 1.6, dump: 5.2, fire: 5.8, step: 6.4, go: 7.4, gone: 10.4 };
// 木の葉を入れたあと、お世話係はドラム缶の西どなりへ一歩出て、そこにいる(うしろにいると、ドラム缶に隠れて見えなかった)
const N_FUEL_REST = { x: 9.6 * T, y: 4.5 * T };
const nCarX = (api) => {
  const e = nFuelAge(api) - N_FUEL.go;
  if (e <= 0) return N_CAR0;
  return N_CAR0 + 40 * e * e + 30 * e;
};
const nGone = (api) => api.flag("ponponGone") && nS.fuelT0 < 0;
// きーが帰るときの抗議(D364、作者「きーが帰るとき、無慣性粘着駆動への抗議をマシン達が表明する演出を考えて」todo 94 の A)。
// 札をもらったあと、マシン達は峠のトンネルの前へ先回りして並ぶ。はじめて帰るときは、いっせいに空ぶかしし、1 台ずつその車らしいしぐさで「いやだ」を示す
// (みな体を左右にゆすって「いやいや」。赤べこは首を横に振る、ぽんぽんカーは目を点滅させて黒い煙、とりぼぎかーは子がもの噴流、こけしは前をはね上げる、車箪笥は引き出しをガタガタ、みとんは「……」)。
// マシンのセリフ(オノマトペ)はなく、エンジンの音としぐさだけ。2 回目からは、並んで空ぶかしするだけ。トンネルに入ると、うしろでクラクション
const N_SO = { rev: 0.4, tansu: 1.9, miton: 2.7, kok: 3.4, tori: 4.2, pon: 5.0, aka: 5.9, kin: 7.5, horn: 11.1, end: 12.4 }; // 東(きーの来たほう)から順に、最後にトンネルにいちばん近い赤べこ。そのあと、ぽんぽんカーのお世話係が来て、きーのおでこに禁止マークを貼る(D365)
// リプレイ券で最初からやり直したときは、札を持ったまま(D366)。もう一度勝つまでは、札をもらう前と同じにする
const nFudaKept = (api) => api.flag("fudaKept");
const nSoOn = (api) => api.hasItem("クラブの札") && !nFudaKept(api);
const nSoAge = () => (nS.soT0 >= 0 ? nNow() - nS.soT0 : -1);
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
// リプレイ券(D366): ピンボールで 10,000 点を超えるともらえる券を、お世話係にわたすと、この断片を最初からやり直せる。
// 戻すのは断片の中の進みだけ。ピンボールの最高点、覚えた能力、見届け、太宰の本、持ち帰った札はそのまま
const N_REPLAY_FLAGS = ["custom", "ponponGone", "seeOffDone", "stripSeen", "won", "nrR1", "nrR2", "nrRound"];
function nReplay(api) {
  if (nS.replaying) return;
  nS.replaying = true;
  api.hold("ic_ticket", 1.4, () => {
    api.takeItem("リプレイ券");
    api.sfx("pop");
    nS.takeT0 = nNow();
    api.freeze(1.3);
    api.later(1000, () => {
      const kept = api.hasItem("クラブの札");
      N_REPLAY_FLAGS.forEach((f) => api.setFlag(f, false));
      api.setFlag("fudaKept", kept);
      nS.kinshi = false;
      nS.fuelT0 = -1;
      nS.soT0 = -1;
      nS.soShort = false;
      nS.takeT0 = -1;
      nS.replaying = false;
      api.warp("pass", "start");
    });
  });
}
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
  if (!nS.soKi || !nKinPts || e < 0 || e > nKinWalk * 2 + N_KIN_STAY) return null;
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
  if (!nS.kinshi) return;
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
  nS.soT0 = nNow();
  nS.soKi = { x: api.player().x, y: api.player().y };
  nKinPlan(nS.soKi);
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
  api.later((N_SO.kin + nKinWalk + 0.35) * 1000, () => (nS.kinshi = true, api.sfx("pop"))); // ぺたっ
  for (const k of [0, 380, 760]) api.later(N_SO.horn * 1000 + k, () => api.sfx("horn"));
  api.later(N_SO.end * 1000, () => api.setFlag("seeOffDone"));
};
// 2 回目からは、近づくと並んで空ぶかしするだけ(止めない)
const nSoShortRev = (api) => {
  nS.soShort = true;
  nS.soT0 = nNow() - N_SO.rev + 0.05;
  api.sfx("rev");
  api.later(1200, () => (nS.soT0 = -1));
};
const N_PASS = nMap("pass", 28, 12, {
  spawns: {
    start: { x: 4.5 * T, y: 4.7 * T, facing: "south" },
    east: { x: 26.4 * T, y: 6.8 * T, facing: "west" },
  },
  onEnter() {
    nS.soShort = false;
    nS.soT0 = -1;
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
        nS.kinshi = false; // 禁止マークは、この断片を出るまで
        api.exit();
      },
    },
    {
      id: "seeoff",
      x: 0,
      y: 4 * T,
      w: 21.5 * T,
      h: 5 * T,
      enabled: (api) => nSoOn(api) && nS.soT0 < 0 && !(api.flag("seeOffDone") && nS.soShort),
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
        if (nS.fuelT0 >= 0) return;
        nS.fuelT0 = nNow();
        api.freeze(N_FUEL.walk + 0.2);
        api.later(N_FUEL.walk * 1000, () => api.bubble("fueler", "もってきた　ぽんぽんカー　もってきた", 3400));
        api.later(N_FUEL.fire * 1000, () => api.bubble("ponpon", N_VOICE.ponpon, 1600));
        api.later(N_FUEL.gone * 1000, () => {
          api.setFlag("ponponGone");
          nS.fuelT0 = -1;
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
      canInteract: (api) => nS.fuelT0 < 0,
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
        if (nS.takeT0 >= 0) this.y -= Math.abs(Math.sin((nNow() - nS.takeT0) * 9)) * 4; // 券を受け取って、ぴょんぴょんはねる
        const so = nFuelerSo(); // きーに禁止マークを貼りにいく(D365)
        if (so) {
          this.x = so.x;
          this.y = so.y;
        }
      },
    }),
  ],
});
