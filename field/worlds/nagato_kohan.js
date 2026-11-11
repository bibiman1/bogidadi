// 断片: 本栖湖の長門(A 湖畔の通り、B 湖の上、土産物屋、C 甲板)。nagato.js から場面ごとに分けた(D666)
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前をそのまま使う
"use strict";

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
  (c === 14 && r >= 3 && r <= 12) || // 艦橋と 2 番砲塔のあいだ(第 1 版の絵に戻した。todo 266)
  (c === 15 && r >= 9 && r <= 11) ||
  (r >= 12 && r <= 14 && c >= 9 && c <= 26) ||
  (r === 15 && c >= 1 && c <= 26) ||
  (r >= 13 && r <= 15 && c >= 27 && c <= 28) || // 1 番砲塔の土台と砲身の前まで(作者「一番砲塔のギリギリまで近づきたい」)
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
  ngRopeLine("ropeS", [16, 106, 196, 286, 376, 466, 556, 646, 736, 826, 916].map((x) => [x, 508]), true), // 南のはし
  ngCrewBlock("crewN", "crew_wagtail", 22.4 * T, 3.7 * T), // 北の通りの奥
  ngCrewBlock("crewW", "crew_rooster", 0.7 * T, 14.4 * T), // 西のはし(艦尾)
);
