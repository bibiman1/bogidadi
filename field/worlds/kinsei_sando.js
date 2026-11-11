// 断片: きこりと金星(山道)。kinsei.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";

// ---- 山道: 撮影隊が機材を持って登る。きーは木箱を押し付けられる(D380) ----
const KN_CREW_V = 120; // 撮影隊の登る速さ(px/秒)。木箱を運ぶきー(105)より少し速く、先に山頂へ
// D395: 撮影隊は道の終わり(山頂への口の手前)で止まって待ち、きーが近づくと、ひと足先に山頂へ入る(道のはしを越えると見えなくなる)
const KN_CREW_END = 28.4 * T; // ききこり(列のいちばん前)が止まる所。ほかは同じ間をあけて止まる
const KN_CREW_LEAD = 5.6 * T; // ききこりの、はじめの位置
// 撮影隊は木箱を運ぶきーより速いので、きーの少し先(画面の中)で歩みをゆるめて待つ(先に行きすぎて、画面の外で消えていた)
const KN_CREW_AHEAD = 4.2 * T; // ききこりが、きーより先に行ってよいはば
const knCrewX = (x0) => {
  if (knS.walkT0 < 0) return x0;
  const near = (knS.px || x0) + KN_CREW_AHEAD - (KN_CREW_LEAD - x0);
  const key = "c" + x0;
  const x = Math.max(knS[key] || x0, Math.min(x0 + (knNow() - knS.walkT0) * KN_CREW_V, near, KN_CREW_END - (KN_CREW_LEAD - x0))); // あと戻りはしない
  knS[key] = x;
  return knS.crewGoT0 < 0 ? x : x + (knNow() - knS.crewGoT0) * KN_CREW_V;
};
const KN_SANDO = {
  tile: T,
  bg: "#46504a",
  map: kGrid(30, 10, (c, r) => r < 4 || r > 7),
  legend: K_LEGEND,
  drawGround: kImage("bg_sando", 30 * T, 10 * T),
  spawns: {
    start: { x: 1.6 * T, y: 6 * T, facing: "east" },
    east: { x: 28.2 * T, y: 6 * T, facing: "west" },
  },
  drawOverlay(ctx, ox, oy, t) {
    knStorm(ctx, t, 0.32);
  },
  triggers: [
    { id: "leave", x: -T, y: 4 * T, w: 1.6 * T, h: 4 * T, run: (api) => api.exit() },
    { id: "toSancho", x: 29.4 * T, y: 4 * T, w: 1.6 * T, h: 4 * T, warp: { map: "sancho", spawn: "west" } },
    {
      // 押し付け: ごろん(ディレクター)の前まで来ると、ごろんが跳ねて、木箱がきーの頭にのる。ごろんは山頂を指す。言葉はない
      id: "oshitsuke",
      x: 2.3 * T,
      y: 4 * T,
      w: T,
      h: 4 * T,
      enabled: (api) => !api.flag("boxed"),
      run(api) {
        if (knS.phase !== "idle") return;
        knS.phase = "oshitsuke";
        knS.t0 = knNow();
        api.freeze(2.2);
        api.face("east");
        api.later(700, () => api.sfx("pop"));
        api.later(1200, () => {
          api.setFlag("boxed");
          api.sfx("item");
        });
        api.later(2200, () => {
          knS.phase = "climb";
          knS.walkT0 = knNow();
          knS.crewGoT0 = -1;
          for (const k of Object.keys(knS)) if (k.startsWith("c") && /^c\d/.test(k)) delete knS[k];
        });
      },
    },
  ],
  objects: [
    // 拡声器の柱は、背景から切り抜いた絵(fg_sando)を根元の y で前後させる(作者「背景の前後」)。鳴らさない(予報は気象台の中の無線 D380)
    kFg("fg_sando", 161, 70, 45, 91, 158),
    kWall(180, 152, 193, 160),
    {
      // 木箱(ピザの材料)。押し付けられる前は地面に。押し付けのあいだ、地面からきーの頭へ跳ぶ
      id: "crate",
      x: 2.6 * T,
      y: 6.3 * T,
      w: 1,
      h: 1,
      hidden: (api) => api.flag("boxed"),
      draw(ctx, sx, sy, t, api) {
        const im = api.image("k_crate");
        if (!im) return;
        let x = sx;
        let y = sy;
        if (knS.phase === "oshitsuke") {
          const u = Math.max(0, Math.min(1, (knNow() - knS.t0 - 0.7) / 0.5));
          const pl = api.player();
          x = knLerp(sx, pl.x + (sx - this.x), u);
          y = knLerp(sy, pl.y + (sy - this.y) - 22, u) - Math.sin(u * Math.PI) * 18;
        }
        knDraw(ctx, im, x, y);
      },
    },
    knImg("goron", 3.3 * T, 6.6 * T, {
      // ごろん(ディレクター)。押し付けのあと、山頂を指し(右向き)、撮影隊の先頭で登っていく
      // 登るときは、置き場所(x)ごと動かす(絵だけずらすと、置き場所が画面の外に出たところで描かれなくなり、途中で消えていた)
      x0: 3.3 * T,
      update() {
        this.x = knS.phase === "climb" ? knCrewX(this.x0) : this.x0;
      },
      hidden(api) {
        return api.flag("boxed") && ((knS.phase !== "oshitsuke" && knS.phase !== "climb") || this.x > 30 * T);
      },
      draw(ctx, sx, sy, t, api) {
        let x = sx;
        let y = sy;
        let flip = true; // 左(きーの方)を向く
        if (knS.phase === "oshitsuke") {
          const el = knNow() - knS.t0;
          y -= el > 0.3 && el < 0.9 ? Math.abs(Math.sin((el - 0.3) * 10)) * 5 : 0; // 跳ねる
          if (el > 1.3) flip = false; // 山頂の方を向いて指す
          if (el > 1.3) {
            // 指す手の先に、小さな三角(言葉の代わり)
            ctx.fillStyle = "#ffe6a0";
            const ax = Math.round(x + 22 + Math.sin(t * 8) * 2);
            const ay = Math.round(y - 22);
            for (let k = 0; k < 4; k++) ctx.fillRect(ax + k, ay - 3 + k, 1, 7 - k * 2);
          }
        }
        if (knS.phase === "climb") {
          y -= Math.abs(Math.sin(t * 9)) * 1.5;
          flip = false;
        }
        knDraw(ctx, knCrew(api, "goron", flip ? -1 : 1), x, y);
      },
    }),
    knImg("kikikori", 5.6 * T, 6.0 * T, {
      // ききこり(カメラ係)。機材を持って登る(置き場所ごと動かす)
      x0: 5.6 * T,
      update() {
        this.x = knS.phase === "climb" ? knCrewX(this.x0) : this.x0;
      },
      hidden(api) {
        return api.flag("boxed") && ((knS.phase !== "oshitsuke" && knS.phase !== "climb") || this.x > 30 * T);
      },
      draw(ctx, sx, sy, t, api) {
        knDraw(ctx, api.image("kikikori"), sx, sy - (knS.phase === "climb" ? Math.abs(Math.sin(t * 8 + 1)) * 1.5 : 0));
      },
    }),
    knImg("kikori", 9 * T, 6.3 * T, {
      // きこり: 落ち着きなく跳ねる。登るときは、きーより先へ走っては戻る
      hidden: (api) => api.flag("boxed") && (knS.phase !== "oshitsuke" && knS.phase !== "climb"),
      x0: 9 * T,
      update(dt, t, api) {
        if (knS.phase !== "climb") {
          knS.kx = this.x = this.x0;
          return;
        }
        knS.px = api.player().x;
        if (knS.crewGoT0 < 0 && api.player().x > KN_CREW_END - 4 * T) knS.crewGoT0 = knNow(); // きーが来たので、先に山頂へ
        const target = Math.min(29.5 * T, api.player().x + 2.6 * T + Math.sin(t * 1.4) * 2.2 * T);
        knS.kx += Math.max(-1, Math.min(1, target - knS.kx)) * Math.min(Math.abs(target - knS.kx), 260 * dt);
        this.dir = target > knS.kx + 2 ? 1 : target < knS.kx - 2 ? -1 : this.dir || 1;
        this.x = knS.kx; // 置き場所ごと動かす
      },
      draw(ctx, sx, sy, t, api) {
        knDraw(ctx, api.image("kikori"), sx, sy - Math.abs(Math.sin(t * 9)) * 3, { flip: this.dir < 0 });
      },
      range: 40,
      interact: (api) => {
        api.sfx("oink");
        api.bubble("kikori", "ピザ", 900);
      },
      canInteract: (api) => !api.flag("boxed") && knS.phase === "idle",
    }),
    knImg("chirin", 8.2 * T, 6.0 * T, {
      // ちりん: きこりのそばでゆれる(きこりに執着)
      hidden: (api) => api.flag("boxed") && knS.phase !== "oshitsuke" && knS.phase !== "climb",
      x0: 8.2 * T,
      update() {
        this.x = this.x0 + ((knS.kx || 9 * T) - 9 * T) * 0.92; // きこりについていく(置き場所ごと)
      },
      draw(ctx, sx, sy, t, api) {
        knDraw(ctx, api.image("chirin"), sx + Math.sin(t * 3) * 1.5, sy - 6);
      },
      range: 40,
      interact: (api) => api.bubble("chirin", "チリーン", 1200), // 仮
      canInteract: () => knS.phase === "idle",
    }),
  ],
};
