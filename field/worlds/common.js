// 断片世界の定義。1つの断片 = 1つの世界。1つの世界は複数のマップを持つ。
// 言葉は少なく。きーは意味のわからない固有名詞をつぶやくだけで、意味は絵と体験で少しずつ伝える。
// ぼぎだぢは流ちょうに話さない。短く、口が悪い。
//
// 断片ごとのファイル(field/worlds/*.js)は、ふつうの <script> として index.html の順に読む。
// どのファイルも同じ名前の場(ページの一番外)に置くので、上のファイルの const や function を下のファイルがそのまま使える。
// 読む順: common → lake → void → haihei → … → finale → index(index が window.BOGI_WORLDS にまとめる)
"use strict";

const T = 32;

// 見届け(観測 D189): when(api) のあいだ、きーが spot の近く(r)にとどまっていると、終わっていく様子がひとりでに進み、
// sec 秒で見届けたことになる(api.observe)。場所の外へ出ると止まって、少し戻る(動いていてもよい。作者「動かないのはきづかないから」)
// lure: 見届ける前は、遠くからでも目に入る小さな光がまたたいて、きーを呼ぶ("r, g, b")
// fx(ctx, sx, sy, p, t, api) は、すすみぐあい p(0〜1)に合わせて、終わっていく様子を描く(ほかの絵の上に重ねる)
const kSparkle = (ctx, x, y, s, a, rgb) => {
  if (a <= 0) return;
  ctx.fillStyle = `rgba(${rgb}, ${a})`;
  ctx.fillRect(Math.round(x - s), Math.round(y), Math.round(s * 2 + 1), 1);
  ctx.fillRect(Math.round(x), Math.round(y - s), 1, Math.round(s * 2 + 1));
  ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
};
// keep: 見届けたあとも呼ぶ光を残す(見届けとは別のしかけ。凍った湖のちゃんの座布団)
// lit: 暗いマップで、呼ぶ光と fx を闇の上に描く(宝舟の網小屋の大漁旗 D462)
const kWatch = (o) => {
  const w = kWatch0(o);
  if (o.lit) [w.drawLit, w.drawOver] = [w.drawOver, undefined];
  return w;
};
const kWatch0 = ({ id, x, y, r, sec, when, fx, follow, lure, lx = 0, ly = -1.2 * T, keep, big }) => ({
  id,
  x,
  y,
  w: 1,
  h: 1,
  headY: 40,
  p: 0,
  draw() {},
  update(dt, t, api) {
    const pl = api.player();
    if (follow) Object.assign(this, { x: pl.x, y: pl.y });
    if (api.flag("observed")) {
      this.p = 1;
      return;
    }
    const on = when(api) && Math.hypot(pl.x - this.x, pl.y - this.y) < r;
    if (on) this.p = Math.min(1, this.p + dt / sec);
    else this.p = Math.max(0, this.p - dt / (sec * 3));
    if (this.p >= 1) api.observe();
  },
  drawOver(ctx, sx, sy, t, api) {
    if (!when(api) || (api.flag("observed") && !keep)) return;
    if (lure) {
      // 呼ぶ光: ゆっくり明滅する光と、まわりでまたたく小さな星
      // big: 部屋の中で、入ったときに目に入る大きさと明るさ(凍った湖のちゃんの座布団。批評会で気づかれなかった D311)
      const R = big ? 46 : 30;
      const a = (1 - this.p) * (big ? 0.62 + Math.sin(t * 2.6) * 0.2 : 0.4 + Math.sin(t * 2.6) * 0.18);
      const cx = sx + lx;
      const cy = sy + ly;
      const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, R);
      g.addColorStop(0, `rgba(${lure}, ${a})`);
      g.addColorStop(1, `rgba(${lure}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      for (let k = 0; k < 4; k++) {
        const ph = t * 1.7 + k * 1.9;
        const tw = Math.max(0, Math.sin(ph));
        kSparkle(ctx, cx + Math.cos(k * 2.1 + Math.floor(ph / Math.PI)) * 18, cy + Math.sin(k * 1.7 + Math.floor(ph / Math.PI)) * 12, 2 + tw * 2, tw * (1 - this.p) * 0.9, lure);
      }
    }
    if (fx) fx(ctx, sx, sy, this.p, t, api);
  },
});
// 呼ぶ光だけ(見届けは別のしかけで決まるところ。廃兵院の望遠鏡)
const kLure = ({ id, x, y, when, lure, lx = 0, ly = -1.2 * T, keep, big }) => {
  const w = kWatch({ id, x, y, r: 0, sec: 1, when, lure, lx, ly, keep, big });
  w.update = () => {};
  return w;
};
// ちゃんの痕跡(D174、D193): ちゃんが使っていた子供の物が置き去りになっている。調べると、きーが「ちゃん」とつぶやく
const kTrace = (id, img, x, y, dy = 0) => ({
  id,
  x,
  y,
  w: 1,
  h: 1,
  headY: 30,
  range: 40,
  draw(ctx, sx, sy, t, api) {
    const im = api.image(img);
    if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height + dy));
  },
  interact(api) {
    api.mutter("ちゃん");
    api.setFlag("trace");
  },
});
// 能力を覚えた(D201〜D203)。ジャンプと同じく、名前を上に小さく出す
const kLearn = (api, id, label) => {
  if (api.hasAbility(id)) return;
  api.learnAbility(id);
  api.sfx("chime");
  api.bubble("player", `${label}　を　おぼえた`, 4000); // 何を覚えたかを、きーの吹き出しで(todo 156、todo 161)
};
// 能力がないと入れない所(D201): 円(x, y, r)の中に入ると、何も言わずに外へはじき返す。
// ok(api) が真なら通れる。when(api) が偽のあいだは、ふさがない
// r0 があれば、輪(r0〜r)だけをふさぐ(真ん中は立っていられる)。draw は足もとの絵(ひびなど)
// ey: 縦につぶした楕円(見下ろしの地面の輪)
const kGate = ({ id, x, y, r, r0 = 0, ey = 1, ok, when, push = 220, onBlock, draw }) => ({
  id,
  x,
  y,
  w: 1,
  h: 1,
  sortDy: draw ? -4 * T : 0,
  draw(ctx, sx, sy, t, api) {
    if (draw) draw(ctx, sx, sy, t, api);
  },
  update(dt, t, api) {
    if (when && !when(api)) return;
    if (ok(api)) return;
    const p = api.player();
    const d = Math.hypot(p.x - x, (p.y - y) / ey);
    if (d >= r || d < r0) return;
    const k = Math.hypot(p.x - x, p.y - y) || 1;
    api.knock(((p.x - x) / k) * push, ((p.y - y) / k) * push + (d ? 0 : push));
    if (onBlock && (!this._t || t - this._t > 1)) {
      this._t = t;
      onBlock(api);
    }
  },
});
// 画面ぜんたいに色を重ねる(見届けの演出用)
const kTint = (ctx, color) => {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
};
const kGlowAt = (ctx, x, y, r, rgb, a) => {
  if (a <= 0 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb}, ${a})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
};
const kWord = (ctx, text, x, y, a, color = "#fff6d8") => {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, a);
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(30, 30, 40, 0.8)";
  ctx.fillStyle = color;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
};

// PixelLab の Wang タイルセット(16枚)。キーは角 NW NE SW SE (1 = 上の地形)
const WANG16 = {"1101":[[0,0]],"1010":[[1,0]],"0100":[[2,0]],"1100":[[3,0]],"0110":[[0,1]],"1000":[[1,1]],"0000":[[2,1]],"0001":[[3,1]],"1011":[[0,2]],"0011":[[1,2]],"0010":[[2,2]],"0101":[[3,2]],"1111":[[0,3]],"1110":[[1,3]],"1001":[[2,3]],"0111":[[3,3]]};

// 画像の中身の下端(bottom)と上端(top)から、足もと(fx, fy)に置く
const SPRITES = {
  pine: { img: "s_pine", w: 64, h: 96, top: 5, bottom: 88, solid: [14, 8] },
  bare: { img: "s_pine2", w: 64, h: 96, top: 17, bottom: 77, solid: [12, 8] },
  car: { img: "s_car", w: 96, h: 64, top: 10, bottom: 57, solid: [64, 22] },
  houtou: { img: "s_houtou", w: 160, h: 128, top: 10, bottom: 118, solid: [118, 44] },
  tires: { img: "s_tires", w: 64, h: 48, top: 8, bottom: 40, solid: [44, 12] },
  irori: { img: "k_irori", w: 128, h: 176, top: 0, bottom: 174, solid: [96, 84] },
  sign: { img: "s_sign_r", w: 32, h: 64, top: 1, bottom: 62, solid: [8, 6] },
  closed: { img: "s_closed", w: 64, h: 48, top: 1, bottom: 47, solid: [54, 8] }, // 冬期通行止の看板
  signL: { img: "s_sign_l", w: 32, h: 64, top: 1, bottom: 62, solid: [8, 6] },
  shard: { img: "s_shard", w: 32, h: 32, top: 4, bottom: 26 },
  stove: { img: "k_stove", w: 64, h: 144, top: 0, bottom: 133, solid: [34, 14] }, // 鋳鉄のだるまストーブ
  post: { img: "k_post", w: 32, h: 64, top: 3, bottom: 60, solid: [16, 8] },
  tansu: { img: "k_tansu", w: 64, h: 64, top: 8, bottom: 57, solid: [50, 20] },
  chabudai: { img: "k_table", w: 96, h: 64, top: 6, bottom: 58, solid: [60, 22] },
  zabuton: { img: "k_zabuton", w: 32, h: 32, top: 6, bottom: 27 },
  zabutonS: { img: "k_zabuton_s", w: 32, h: 32, top: 7, bottom: 25 },
  radio: { img: "i_radio", w: 32, h: 32, top: 5, bottom: 27 },
  poster: { img: "k_poster", w: 20, h: 24, top: 0, bottom: 23 },
};

function at(kind, fx, fy, extra) {
  const s = SPRITES[kind];
  const o = {
    img: s.img,
    w: s.w,
    h: s.h,
    x: fx,
    y: fy - (s.bottom - s.h / 2),
    sortDy: s.bottom - s.h / 2,
    headY: s.h / 2 - s.top,
  };
  if (s.solid) o.solid = { w: s.solid[0], h: s.solid[1], dy: o.sortDy - s.solid[1] / 2 };
  return Object.assign(o, extra || {});
}

// 決まった並びの疑似乱数(毎回同じ森になる)
function rand(r, c, k) {
  const x = Math.sin(r * 127.1 + c * 311.7 + k * 74.7) * 43758.5453;
  return x - Math.floor(x);
}
