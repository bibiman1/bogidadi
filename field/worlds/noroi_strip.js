// 断片: 呪いの野犬(3/4)。D 旧国道の直線(ドラッグストリップ)と対戦カード
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、nS、nMap など)をそのまま使う
"use strict";

// D 旧国道の直線(ドラッグストリップ)。競争の画面と同じ場所(D140): 北と南に空っぽの木のスタンド、スタートの白線と信号の柱、東にゴールの線と計時の小屋
// 炎を塗ったあと、野犬たちが北の路肩に並び、スタートの白線の手前に三台(ぽんぽんカー、赤べこ、ぼぎカー)
const nRace = (api) => api.warp("race", "view");
// 対戦カード(D367): 左にぼぎカー、右に 5 台(勝ち抜きの順)。勝った相手は暗くして「かち」、次の相手は黄の枠が点滅
const N_CARD_SEC = 3.2;
function nCardShow(api, round, then) {
  // カードが出ているあいだも A は効くので、押すたびにカードと「競争へ」が積み重なり、競争が何度も始め直されていた
  // (作者「ポンポンカーとの競争の際、後ろからの絵が2回出た。」)。カードが出ている間は、新しいカードを出さない
  if (nS.card) return;
  nS.card = { t0: nNow(), round, sec: N_CARD_SEC };
  api.freeze(N_CARD_SEC);
  api.sfx("pop");
  api.later(N_CARD_SEC * 1000, () => {
    nS.card = null;
    then();
  });
}
function nCardDraw(ctx, api) {
  if (!nS.card) return;
  const e = nNow() - nS.card.t0;
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
    const beaten = i < nS.card.round;
    const cur = i === nS.card.round;
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
        if (nS.card || nS.raceGo) return;
        nCardShow(api, nRound(api), () => {
          nS.raceGo = true;
          nRace(api);
        });
      },
      update() {
        this.y = 8.6 * T - (nS.takeT0 >= 0 ? Math.abs(Math.sin((nNow() - nS.takeT0) * 9)) * 4 : 0);
      },
    }),
  ],
});
