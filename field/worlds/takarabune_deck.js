// 断片: 宝舟と首振りエンジン(機関室、宝舟の甲板)。takarabune.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";


// 宝舟の機関室(舳先は東)。西にボイラー、まんなかに首振りエンジンの台、東にはしご(甲板へ)
// 首振りエンジンは最初から据わっていて、コンロッドだけが欠けている(D92、D95)。コンロッドを取り付け、火室にペレットを入れると、圧力計の針が上がり、安全弁が鳴り、エンジンが動きだす
const TK_ENGINE = tkMap("engineroom", 16, 10, {
  bg: "#1a120c",
  spawns: { ladder: { x: 12 * T, y: 4.6 * T, facing: "south" } },
  drawOverlay(ctx, ox, oy, t, api) {
    const age = tkFireAge(api);
    // 火室: ペレットの青白い光
    if (age >= 0) {
      const k = Math.min(1, age / 1);
      tkLight(ctx, ox + 75, oy + 182, 80, "120, 220, 255", 0.6 * k * (0.9 + 0.1 * Math.sin(t * 11)));
      tkLight(ctx, ox + 75, oy + 182, 22, "235, 255, 255", 0.9 * k);
    }
    // 圧力計の針(0 から、圧力が上がると右へ)
    const p = age < 0 ? 0 : Math.min(1, age / TK_PRESS);
    const ga = -2.4 + 2.9 * p + (age > TK_PRESS ? Math.sin(t * 13) * 0.04 : 0);
    ctx.strokeStyle = "#b02020";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox + 80, oy + 132);
    ctx.lineTo(ox + 80 + Math.sin(ga) * 9, oy + 132 - Math.cos(ga) * 9);
    ctx.stroke();
    // 安全弁: 圧力が上がりきると、シューッと吹く
    if (age > TK_PRESS - 0.6 && age < TK_PRESS + 1.4 && Math.random() < 0.5) tkPuff(100, 70, (Math.random() - 0.5) * 20, -40, 0.8, 6);
    tkDrawPuffs(ctx, ox, oy);
  },
  triggers: [],
  objects: [
    tkEngineObj,
    // エンジンの台: コンロッドが欠けている(▼ が出る)。コンロッドを持って調べると取り付ける
    tkSpot(
      "mount",
      9 * T,
      8.1 * T,
      (api) => {
        if (!api.hasItem("コンロッド")) return api.mutter("……", 1200); // 仮
        api.takeItem("コンロッド");
        api.setFlag("installed");
        api.bubble("mount", "ガチャン", 1400); // 仮
      },
      { range: 50, headY: 30, canInteract: (api) => !api.flag("installed") }
    ),
    // ボイラーの火室: ペレットを入れる
    tkSpot(
      "firebox",
      2.4 * T,
      6.6 * T,
      (api) => {
        tkS.fireT0 = tkNow();
        tkS.lastHalf = -1;
        api.setFlag("running");
        api.later(TK_PRESS * 1000 - 400, () => api.bubble("valve", "シューッ", 1600)); // 仮
      },
      { range: 50, canInteract: (api) => api.flag("installed") && api.hasItem("ペレット") && !api.flag("running") }
    ),
    { id: "valve", x: 100, y: 80, w: 1, h: 1, headY: 6 },
    // はしご: エンジンが動いていれば甲板へ(沖へ出る)。動いていなければ、港へ降りる
    tkSpot(
      "ladder",
      12.4 * T,
      4.2 * T,
      (api) => {
        if (api.flag("running") && !api.flag("glowed")) api.warp("deck", "stern");
        else api.warp("port", "boat");
      },
      { range: 50 }
    ),
  ],
});

// G 宝舟の甲板。海が西へ流れる(舳先は東)。煙突から、エンジンが蒸気を吐くたびに湯気。外輪がかく水しぶき
// 舳先で調べると、きーがペレットを海に投げ込む → 沈んで、底から青い光が広がる → 一枚絵(D88)
const tkDeckBob = () => Math.round(Math.sin(tkNow() * 1.3) * 1); // 甲板のゆれ
const TK_DECK = {
  tile: T,
  bg: "#0a1430",
  map: TK_GRIDS.deck,
  legend: K_LEGEND,
  drawGround(ctx, ox, oy, img, api) {
    const get = (k) => (typeof img === "function" ? img(k) : null);
    const t = tkNow();
    const sea = get("sea");
    if (sea) {
      const off = (t * 36) % sea.width;
      for (let x = -off - sea.width; x < 20 * T + sea.width; x += sea.width) ctx.drawImage(sea, Math.round(ox + x), oy, sea.width, 10 * T);
    }
    // ペレットが沈んだところから、青い光が広がる
    if (tkS.throwT0 > 0) {
      const e = t - tkS.throwT0 - 1.0;
      if (e > 0) {
        const r = 30 + 300 * Math.min(1, e / 3.2);
        tkLight(ctx, ox + 19.6 * T, oy + 5 * T, r, "60, 200, 255", Math.min(0.85, e / 1.4));
        tkLight(ctx, ox + 19.6 * T, oy + 5 * T, r * 0.45, "210, 252, 255", Math.min(0.7, e / 2));
      }
    }
    const deck = get("bg_deck");
    if (deck) ctx.drawImage(deck, ox, oy + tkDeckBob(), 20 * T, 10 * T);
    // 外輪がかく水しぶき(エンジンの回転といっしょ)
    const th = tkCrank(api);
    ctx.fillStyle = "rgba(220, 235, 255, 0.75)";
    for (let k = 0; k < 6; k++) {
      const u = (th / (Math.PI * 2) + k / 6) % 1;
      for (const y of [1.5 * T, 8.4 * T]) ctx.fillRect(Math.round(ox + 6 * T - u * 44), Math.round(oy + y + (k % 3) * 6), 3, 2);
    }
    // 煙突(ボイラーの上)から、蒸気を吐くたびに湯気
    if (tkExhaust(api)) tkPuff(3 * T + 6, 5 * T - 8, -46, -22, 1.6, 9);
    tkDrawPuffs(ctx, ox, oy);
  },
  drawOverlay(ctx, ox, oy) {
    // ペレットを投げる(弧を描いて舳先の先の海へ)→ しぶき
    if (tkS.throwT0 < 0) return;
    const e = tkNow() - tkS.throwT0;
    const x0 = ox + 17.4 * T;
    const y0 = oy + 4.4 * T;
    const x1 = ox + 19.6 * T;
    const y1 = oy + 5 * T;
    const pel = this._pel;
    if (e < 0.8 && pel) {
      const u = e / 0.8;
      ctx.drawImage(pel, Math.round(x0 + (x1 - x0) * u - pel.width / 2), Math.round(y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 40 - pel.height / 2));
    } else if (e < 1.8) {
      const u = (e - 0.8) / 1;
      ctx.fillStyle = `rgba(230, 250, 255, ${1 - u})`;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        ctx.fillRect(Math.round(x1 + Math.cos(a) * 14 * (u + 0.3)), Math.round(y1 - 12 * Math.sin(u * Math.PI) + Math.sin(a) * 5), 3, 3);
      }
    }
  },
  spawns: { stern: { x: 4.8 * T, y: 6.5 * T, facing: "east" } },
  onEnter() {
    tkS.throwT0 = -1;
  },
  triggers: [],
  objects: [
    // 煙突のついた丸い窯と、ろうそく(fg_deck。docs/assets/takarabune/fg_more.py)。窯のうしろとろうそくのマスはふさぐ
    tkFg("fg_deck", 62, 82, 69, 117, 197, tkDeckBob),
    tkFg("fg_deck", 143, 85, 19, 29, 113, tkDeckBob),
    // 帆は帆桁から頭の上に張られている。きーはその下をくぐるので、帆はいつもきーより手前。下にいるあいだは透かす
    // 2026-10-03、作者「宝船の帆の前後がおかしい。船の中も、港も。」
    {
      id: "sail",
      x: 361,
      y: 9.9 * T, // マップのいちばん下(いつもきーより手前)
      w: 1,
      h: 1,
      draw(ctx, sx, sy, t, api) {
        const im = api.image("fg_deck");
        if (!im) return;
        const pl = api.player();
        const under = pl.x > 331 - 14 && pl.x < 392 + 14 && pl.y > 48 && pl.y - 34 < 250;
        const ox = sx - this.x;
        const oy = sy - this.y + tkDeckBob();
        ctx.save();
        ctx.globalAlpha = under ? 0.45 : 1;
        ctx.drawImage(im, 330, 40, 64, 212, ox + 330, oy + 40, 64, 212);
        ctx.restore();
      },
    },
    tkSpot(
      "bow",
      17.4 * T,
      5 * T,
      (api) => {
        api.setFlag("sowing");
        api.takeItem("ペレット");
        tkS.throwT0 = tkNow();
        TK_DECK._pel = api.image("pellet");
        // しぶきのあと、水の中へ。光りながら沈んでいくペレットを、水面から追いかけて最後の絵へ(D92)
        // 水面から寄ってきた絵が、そのままキメの一枚絵になる(A で閉じる)。一枚絵を出しなおさない(2026-10-03、作者「最後の絵の出方が2回でる」)
        api.later(2600, () =>
          api.burst(
            [{ img: "v_glow", sec: 3.2, z0: 2.4, z1: 1, cx: 240, cy: 36, cy1: 144, fadeIn: 0.9, ease: "out" }],
            () => {
              api.setFlag("sowing", false);
              api.setFlag("glowed");
              api.warp("port", "boat");
              api.later(1600, () => kLearn(api, "terasu", "てらす")); // 青く光る海から(D201)
            },
            { hold: true }
          )
        );
      },
      { range: 56, canInteract: (api) => api.hasItem("ペレット") && !api.flag("sowing") && !api.flag("glowed") }
    ),
  ],
};
