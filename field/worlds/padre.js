// 断片: ぱーでれとだいにち。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== ぱーでれとだいにち(D157、D158) ========
// 霧の夕暮れ、昭和の町はずれの空き地。紙芝居屋の自転車をまねた機械「ぱーでれ」が、紙芝居「だいにち」でぼぎをおびき寄せ、荷台の下の引き出しに入れて連れ去る
// 連れ去られたぼぎは戻らない(正典)。怖さは物悲しさと不穏さまで(紙芝居は楽しそう、ぱーでれはどこか滑稽)
// 向き(D148): きーは左(西 = 過去)から来て、ぱーでれは右(東 = 未来)の霧の中にいて、右へ去る
// 流れ(D425、作者とのまとめ todo 143): 空き地に入ると、針金の姿のぱーでれの一枚絵 → 空いた席に座る → 紙芝居「だいにち」4 枚
//   (下手で素朴な絵で、戦いと死、ぼぎだぢが消えたことを暗示)→ 座っていたぼぎと、集まっていた壊れたぼぎだぢが列になる
//   → きーが列のうしろにならぶと、先頭から一つずつ空へのぼって消える(昇天)→ きーの番で、ぴーが突然来て押しのけ、先に昇天
//   → ぱーでれも昇天 → 空き地にきーだけ残る。ふんばる、水あめのわりばし。西から帰る。このあと、富士山の峠のぴーもいない
// きーはついていけない(結末 A ワンネスは、なくした D425)
// 下絵(docs/assets/padre/d425/)。本番の絵はあとで PixelLab に(費用を先に相談)
const P_SEAT = { x: 11.5 * T, y: 6.6 * T }; // 空いた席
const P_CART = { x: 16 * T, y: 6.6 * T }; // ぱーでれの足もと
const P_HEAD = { x: 15 * T - 8, y: 8.3 * T }; // 列の先頭。ここで空へのぼる
const P_GAP = 26; // 列のあいだ
const P_UP_SEC = 1.9; // 一つのぼって、次がのぼるまで
const pS = { phase: "wait", t0: 0, joined: false, lastUp: 0, pi: null }; // wait → show → gather → queue → ascend → pi → leave → done
const pNow = () => performance.now() / 1000;
// 霧と夕暮れ: 全体に夕暮れの色、東(右)ほど霧が濃い。霧のかたまりがゆっくり流れる
const pFog = (ctx, ox, oy, mapW, t, base) => {
  ctx.fillStyle = "rgba(92, 76, 96, 0.22)";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const g = ctx.createLinearGradient(ox, 0, ox + mapW, 0);
  g.addColorStop(0, `rgba(226, 222, 216, ${base})`);
  g.addColorStop(1, `rgba(226, 222, 216, ${Math.min(0.85, base + 0.5)})`);
  ctx.fillStyle = g;
  // 手前(画面の下)ほど霧をうすく(todo 41 の 4)。上 6 割はそのまま、下へ 3 段でうすくする
  const H = ctx.canvas.height;
  ctx.fillRect(0, 0, ctx.canvas.width, H * 0.6);
  for (const [y0, y1, a] of [[0.6, 0.73, 0.7], [0.73, 0.86, 0.45], [0.86, 1, 0.25]]) {
    ctx.globalAlpha = a;
    ctx.fillRect(0, H * y0, ctx.canvas.width, H * (y1 - y0) + 1);
  }
  ctx.globalAlpha = 1;
  for (let k = 0; k < 9; k++) {
    const x = ox + ((k * 173 + t * (8 + k)) % (mapW + 200)) - 100;
    const y = oy + 60 + ((k * 97) % 260);
    ctx.fillStyle = "rgba(236, 232, 226, 0.16)";
    ctx.beginPath();
    ctx.ellipse(x, y, 90, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
};
// ぱーでれの姿を描く。霧の下で 1 回、霧の上にうすく 1 回(東の濃い霧に沈んで見えにくいので。todo 143)
const pPadreDraw = (ctx, sx, sy, api, k) => {
  const im = api.image(["gather", "queue", "ascend", "pi"].includes(pS.phase) ? "padre_fig_open" : "padre_fig");
  if (!im) return;
  let dy = 0, a = 1;
  if (pS.phase === "leave") {
    const u = (pNow() - pS.t0) / 4.5;
    dy = pRise(u) * 1.4; // ぱーでれも、自転車ごと空へ
    a = Math.max(0, 1 - u * 1.05);
  }
  ctx.globalAlpha = a * k;
  ctx.drawImage(im, Math.round(sx - 24), Math.round(sy - im.height - dy)); // 光の柱(P_HEAD)にかからないよう、右へ(D425 の本番の絵)
  ctx.globalAlpha = 1;
};
const pImg = (key, x, y, extra) =>
  Object.assign(
    {
      id: key,
      x,
      y,
      w: 1,
      h: 1,
      headY: 40,
      draw(ctx, sx, sy, t, api) {
        const im = api.image(typeof this.img === "function" ? this.img(api) : key);
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height));
      },
    },
    extra
  );
// 背景の絵の中の、きーが奥に回れる物(電柱、土管)。背景から切り抜いた絵を、根元の高さで前後を決めて重ねる(作者「背景の前後」)
// 切り抜きは docs/assets/padre/fg_cut.py。x0, y0 は切り抜いた絵の左上(背景の絵の中の位置)、baseY は根元
const pFg = (key, x0, y0, baseY, solid) => ({
  id: key,
  x: x0,
  y: baseY,
  w: 1,
  h: 1,
  solid,
  draw(ctx, sx, sy, t, api) {
    const im = api.image(key);
    if (im) ctx.drawImage(im, Math.round(sx), Math.round(sy + (y0 - baseY)));
  },
});
const P_VOICE = { kobosi: "コロン", denden: "デン　デン", hato: "ポー" }; // 仮
const P_MICHI = {
  tile: T,
  bg: "#9a9484",
  map: kGrid(30, 10, (c, r) => r < 4 || r > 7),
  legend: K_LEGEND,
  drawGround: kImage("bg_michi", 30 * T, 10 * T),
  spawns: {
    start: { x: 1.6 * T, y: 6 * T, facing: "east" },
    east: { x: 28.2 * T, y: 6 * T, facing: "west" },
  },
  drawOverlay(ctx, ox, oy, t) {
    pFog(ctx, ox, oy, 30 * T, t, 0.15);
  },
  triggers: [
    { id: "leave", x: -T, y: 4 * T, w: 1.6 * T, h: 4 * T, run: (api) => api.exit() },
    { id: "toAkichi", x: 29.4 * T, y: 4 * T, w: 1.6 * T, h: 4 * T, warp: { map: "akichi", spawn: "west" } },
  ],
  objects: [
    pFg("fg_michi_pole1", 200, 0, 172, { w: 12, h: 6, dx: 10, dy: -3 }),
    pFg("fg_michi_pole2", 520, 0, 172, { w: 12, h: 6, dx: 10, dy: -3 }),
    // 霧の東から聞こえる拍子木(姿は見えない)
    {
      id: "hyoshigi",
      x: 28.5 * T,
      y: 4.6 * T,
      w: 1,
      h: 1,
      headY: 30,
      last: 0,
      draw() {},
      update(dt, t, api) {
        if (api.flag("gone")) return;
        const p = api.player();
        if (p.x > 6 * T && t - this.last > 4.5) {
          this.last = t;
          api.bubble("hyoshigi", "カチ　カチ", 1400);
        }
      },
    },
  ],
};
const pDone = (api) => api.flag("gone");
// 列にならぶもの: 座っていたぼぎ 3 つと、集まっていた壊れたぼぎだぢ 5 つ(D425)。order の順に先頭から空へのぼる
const P_Q = [
  { key: "b_denden", home: [10.5 * T, 6.6 * T] },
  { key: "b_kobosi", home: [9.5 * T, 6.6 * T] },
  { key: "b_hato", home: [12.5 * T, 6.6 * T] },
  { key: "pb_1", home: [7.6 * T, 8.9 * T] },
  { key: "pb_2", home: [13.8 * T, 5.1 * T] },
  { key: "pb_3", home: [8.8 * T, 10.1 * T] },
  { key: "pb_4", home: [14.2 * T, 9.8 * T] },
  { key: "pb_5", home: [6.4 * T, 5.2 * T] },
].map((q, i) => Object.assign(q, { i, x: q.home[0], y: q.home[1], up: null }));
const P_VOICES = { b_denden: "デン　デン", b_kobosi: "コロン", b_hato: "ポー" };
const pLeft = () => P_Q.filter((q) => q.up == null);
const pSlot = (k) => [P_HEAD.x - k * P_GAP, P_HEAD.y];
const pKiSlot = () => pSlot(pLeft().length);
const pRise = (u) => Math.min(1, u) ** 2 * 170; // のぼる高さ
const P_AKICHI = {
  tile: T,
  bg: "#848c68",
  // 土管(絵の 1〜6 列、5〜7 行)は、絵のとおりにふさぐ。西の出入り口は、土管の下の地面(8〜10 行)
  map: kGrid(20, 12, (c, r) => r < 4 || r > 10 || c >= 19 || (c === 0 && (r < 8 || r > 10)) || (c >= 1 && c <= 6 && r >= 6 && r <= 7) || (c >= 2 && c <= 5 && r === 5)),
  legend: K_LEGEND,
  drawGround: kImage("bg_akichi", 20 * T, 12 * T),
  spawns: {
    west: { x: 1 * T, y: 9 * T, facing: "east" },
    seat: { x: P_SEAT.x, y: P_SEAT.y, facing: "east" },
  },
  onEnter(api) {
    if (pS.recut) {
      pS.recut = false; // 紙芝居のあとで、席に戻しただけ
      return;
    }
    // 途中で出ていたら、そのあいだに、みんな空へのぼっている(ぴーも)
    if (pS.phase !== "wait" && pS.phase !== "done" && !api.flag("gone")) {
      api.setFlag("taken");
      api.setFlag("gone");
    }
    pS.phase = api.flag("gone") ? "done" : "wait";
    pS.joined = false;
    for (const q of P_Q) Object.assign(q, { x: q.home[0], y: q.home[1], up: null });
    // はじめて空き地に入ったとき、ぱーでれの一枚絵(針金の姿が紙芝居の自転車を引く)
    if (!api.flag("gone") && !api.flag("sawPadre")) {
      api.setFlag("sawPadre");
      api.later(700, () => api.show("v_padre"));
    }
  },
  debug: () => Object.assign({ now: pNow(), left: pLeft().length }, pS),
  // ぱーでれが去ったあと、東へ行くほど霧が暗い(てらす D201)
  dark(api) {
    if (pS.phase !== "done") return 0;
    return Math.max(0, Math.min(1, (api.player().x - 12.5 * T) / (2.5 * T))) * 0.93;
  },
  darkColor: "rgb(28, 24, 34)",
  drawOverlay(ctx, ox, oy, t, api) {
    // 裸電球の街灯(夕暮れにともる)
    const lg = ctx.createRadialGradient(ox + 10 * T, oy + 1.35 * T, 2, ox + 10 * T, oy + 1.35 * T, 70);
    lg.addColorStop(0, "rgba(255, 228, 160, 0.55)");
    lg.addColorStop(1, "rgba(255, 228, 160, 0)");
    ctx.fillStyle = lg;
    ctx.fillRect(ox + 10 * T - 70, oy + 1.35 * T - 70, 140, 140);
    pFog(ctx, ox, oy, 20 * T, t, 0.08);
    if (!api.flag("gone")) pPadreDraw(ctx, ox + P_CART.x, oy + P_CART.y, api, 0.55);
    // 列の先頭に、空へのびる光の柱(列ができてから、ぱーでれがのぼりきるまで)
    if (["gather", "queue", "ascend", "pi", "leave"].includes(pS.phase)) {
      let a = 0.5;
      if (pS.phase === "gather") a *= Math.min(1, (pNow() - pS.t0) / 2);
      if (pS.phase === "leave") a *= Math.max(0, 1 - (pNow() - pS.t0) / 4.5);
      const X = ox + P_HEAD.x, Y = oy + P_HEAD.y;
      const g = ctx.createLinearGradient(X - 20, 0, X + 20, 0);
      g.addColorStop(0, "rgba(255, 246, 214, 0)");
      g.addColorStop(0.5, `rgba(255, 246, 214, ${a * (0.85 + 0.15 * Math.sin(t * 3))})`);
      g.addColorStop(1, "rgba(255, 246, 214, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(X - 20, 0, 40, Y + 4);
    }
  },
  // 紙芝居のあと、みんながのぼりきるまでは、道へ出られない(見届ける)
  triggers: [{ id: "toMichi", x: -T, y: 7.8 * T, w: 1.4 * T, h: 3.2 * T, enabled: () => pS.phase === "wait" || pS.phase === "done", warp: { map: "michi", spawn: "east" } }],
  objects: [
    pFg("fg_akichi_pole", 183, 2, 205, { w: 12, h: 6, dx: 26, dy: -3 }),
    pFg("fg_akichi_pipes", 44, 148, 250),
    kTrace("t_zori", "t_zori", 12.8 * T, 7.3 * T), // 空いた席の横に、子供のゴム草履が片方(ちゃんもこの紙芝居を見ていた)
    // 霧の奥(D201): ぱーでれが去ったあと、東の霧は暗くて、道が見えない。てらす(宝舟で覚える)がないと、霧に押し戻される
    kGate({ id: "fogGate", x: 18.6 * T, y: 6.6 * T, r: 2.8 * T, when: () => pS.phase === "done", ok: (api) => api.can("terasu") }),
    // 見届け: ぱーでれが去ったあと、霧の奥で、拍子木の音が止むまで待つ(D189)
    kWatch({
      id: "w_hyoshigi",
      x: 18.2 * T,
      y: 6.6 * T,
      r: 1.8 * T,
      sec: 5.5, lure: "255, 230, 180",
      when: () => pS.phase === "done",
      fx(ctx, sx, sy, p, t) {
        if (p < 0.9 && (t * (1.6 - p)) % 1 < 0.6) kWord(ctx, "カチ　カチ", sx + 1.6 * T + p * 2 * T, sy - 2.2 * T, (1 - p) * 1.3);
      },
    }),
    // 進み具合(見えない係): 列をつくる → きーを待つ → 一つずつのぼる → ぴー → ぱーでれがのぼる
    {
      id: "pctl",
      x: -100,
      y: -100,
      w: 1,
      h: 1,
      draw() {},
      update(dt, t, api) {
        const now = pNow();
        const p = api.player();
        if (pS.phase === "gather" && now - pS.t0 > 2.6) {
          pS.phase = "queue";
          pS.t0 = now;
          api.bubble("padre", "カチ　カチ", 1400);
        }
        if (pS.phase === "queue") {
          // 列のうしろにならぶと、のぼりはじめる(ならばないと、先に進まない)
          const [kx, ky] = pKiSlot();
          if (Math.hypot(p.x - kx, p.y - ky) < 16) {
            pS.joined = true;
            pS.phase = "ascend";
            pS.lastUp = now - P_UP_SEC + 0.8;
            api.freeze(999);
            api.face("east");
            api.setFlag("taken");
          } else if (now - pS.t0 > 6) {
            pS.t0 = now;
            api.bubble("padre", "カチ　カチ", 1400);
          }
        }
        if (pS.phase === "ascend" && now - pS.lastUp > P_UP_SEC) {
          const left = pLeft();
          if (left.length) {
            left[0].up = now;
            pS.lastUp = now;
            const v = P_VOICES[left[0].key];
            if (v) api.bubble(left[0].key, v, 1200);
          } else {
            // きーの番。少しして、ぴーが突然かけこんでくる
            pS.phase = "pi";
            pS.t0 = now;
            pS.pi = { x: -1 * T, y: P_HEAD.y, step: "run", t0: now, up: null };
            api.mutter("……", 1400);
          }
        }
        // ならんでいるあいだ、きーは列といっしょに前へ進む
        if (pS.joined && (pS.phase === "ascend" || (pS.phase === "pi" && pS.pi.step === "run"))) {
          const [kx, ky] = pKiSlot();
          const dx = kx - p.x, dy = ky - p.y, d = Math.hypot(dx, dy);
          if (d > 1) api.place(p.x + (dx / d) * Math.min(d, 50 * dt), p.y + (dy / d) * Math.min(d, 50 * dt));
        }
        if (pS.phase === "pi") {
          const pi = pS.pi;
          if (pi.step === "run" && now - pi.t0 > 1.4) {
            // 西から、まっすぐ、きーへ
            pi.x += 230 * dt;
            if (pi.x > p.x - 20) {
              pi.step = "shove";
              pi.t0 = now;
              api.freeze(0);
              api.knock(-320, 360); // 押しのけられて、南西へよろける(東の暗い霧の外へ)
              api.sfx("knock");
              api.bubble("pi", "どけ", 1400);
              pS.joined = false;
            }
          } else if (pi.step === "shove" && now - pi.t0 > 0.5) {
            pi.x += Math.min(P_HEAD.x - pi.x, 90 * dt);
            if (P_HEAD.x - pi.x < 1) {
              pi.step = "up";
              pi.up = now;
            }
          } else if (pi.step === "up" && now - pi.up > 2.4) {
            pS.phase = "leave";
            pS.t0 = now;
            api.bubble("padre", "カチ　カチ", 1400);
          }
        }
        if (pS.phase === "leave" && now - pS.t0 > 4.5) {
          api.setFlag("gone");
          pS.phase = "done";
          api.later(800, () => kLearn(api, "funbaru", "ふんばる")); // 押しのけられても、ここに残った(D201、D425)
        }
      },
    },
    // ぴー(D425): きーの番に突然来て、押しのけ、先にのぼる。富士山の峠道のぴーは、このあと、いない
    {
      id: "pi",
      x: -100,
      y: -100,
      w: 1,
      h: 1,
      headY: 40,
      hidden: () => !(pS.phase === "pi" && pS.pi),
      update() {
        if (pS.phase === "pi" && pS.pi) {
          this.x = pS.pi.x;
          this.y = pS.pi.y;
        }
      },
      draw(ctx, sx, sy, t, api) {
        const im = api.image("pi");
        const pi = pS.pi;
        if (!im || !pi) return;
        let dy = 0, a = 1;
        if (pi.step === "up") {
          const u = (pNow() - pi.up) / 2.2;
          dy = pRise(u);
          a = Math.max(0, 1 - u);
        }
        const fr = pi.step === "up" ? 0 : 1 + (Math.floor(t * (pi.step === "run" ? 18 : 10)) % 6);
        ctx.globalAlpha = a;
        ctx.drawImage(im, fr * 64, 2 * 64, 64, 64, Math.round(sx - 32), Math.round(sy - 64 + 17 - dy), 64, 64);
        ctx.globalAlpha = 1;
      },
    },
    pImg("padre", P_CART.x, P_CART.y, {
      headY: 118,
      solid: { w: 100, h: 18, dy: -8, dx: 34 }, // 絵の位置に合わせる(sx - 24 から 115 幅)
      range: 70,
      hidden: (api) => api.flag("gone"),
      img: () => (["gather", "queue", "ascend", "pi"].includes(pS.phase) ? "padre_fig_open" : "padre_fig"),
      draw(ctx, sx, sy, t, api) {
        pPadreDraw(ctx, sx, sy, api, 1);
      },
      interact: (api) => api.bubble("padre", "カチ　カチ", 1400),
      canInteract: () => pS.phase === "wait",
    }),
    // ぼぎと、壊れたぼぎだぢ
    ...P_Q.map((q) => ({
      id: q.key,
      x: q.home[0],
      y: q.home[1],
      w: 1,
      h: 1,
      headY: 40,
      range: 40,
      hidden: (api) => api.flag("gone") || (q.up != null && pNow() - q.up > 2.4),
      update(dt) {
        if (q.up != null) return;
        const lining = ["gather", "queue", "ascend", "pi", "leave"].includes(pS.phase);
        const [tx, ty] = lining ? pSlot(pLeft().indexOf(q)) : q.home;
        const dx = tx - q.x, dy = ty - q.y, d = Math.hypot(dx, dy);
        if (d > 0.5) {
          q.x += (dx / d) * Math.min(d, 46 * dt);
          q.y += (dy / d) * Math.min(d, 46 * dt);
        }
        this.x = q.x;
        this.y = q.y;
      },
      draw(ctx, sx, sy, t, api) {
        const im = api.image(q.key);
        if (!im) return;
        let dy = 0, a = 1;
        if (q.up != null) {
          const u = (pNow() - q.up) / 2.2;
          dy = pRise(u);
          a = Math.max(0, 1 - u);
        }
        const moving = pS.phase === "gather" && q.up == null;
        const bob = moving ? Math.abs(Math.sin(t * 9 + q.i)) * 2 : 0;
        ctx.globalAlpha = a;
        ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height - dy - bob));
        ctx.globalAlpha = 1;
      },
      interact: (api) => api.bubble(q.key, P_VOICES[q.key] || "……", 1400),
      canInteract: () => pS.phase === "wait" && !!P_VOICES[q.key],
    })),
    // 空いた席: 座布団。座ると紙芝居がはじまる(todo 41 の 1)
    {
      id: "seat",
      x: P_SEAT.x,
      y: P_SEAT.y,
      w: 1,
      h: 1,
      range: 30,
      draw(ctx, sx, sy, t) {
        if (pS.phase !== "wait") return;
        ctx.fillStyle = "#7a3c34";
        ctx.fillRect(Math.round(sx - 11), Math.round(sy - 7), 22, 7);
        ctx.fillStyle = "#9a5444";
        ctx.fillRect(Math.round(sx - 10), Math.round(sy - 7), 20, 2);
        // かすかに呼ぶ光
        const a = 0.18 + 0.12 * Math.sin(t * 2.4);
        ctx.fillStyle = `rgba(255, 236, 190, ${a})`;
        ctx.fillRect(Math.round(sx - 13), Math.round(sy - 10), 26, 12);
      },
      canInteract: (api) => pS.phase === "wait" && !api.flag("gone"),
      interact(api) {
        pS.phase = "show";
        api.place(P_SEAT.x, P_SEAT.y);
        api.freeze(1.2);
        api.bubble("padre", "カチ　カチ", 1200);
        api.later(1200, () =>
          api.showSeq(["kami1", "kami2", "kami3", "kami4"], 2.8, () => {
            // 紙芝居は黒く終わる。暗転のまま空き地に戻し(席から)、みんなが列になる
            pS.recut = true;
            api.cut("akichi", "seat");
            pS.phase = "gather";
            pS.t0 = pNow();
          }, { slide: true })
        );
      },
    },
    // 列のうしろの、きーのならぶ所(かすかに光る)
    {
      id: "kiSpot",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      hidden: () => pS.phase !== "queue",
      update() {
        [this.x, this.y] = pKiSlot();
      },
      draw(ctx, sx, sy, t) {
        const a = 0.25 + 0.15 * Math.sin(t * 3);
        ctx.fillStyle = `rgba(255, 240, 200, ${a})`;
        ctx.beginPath();
        ctx.ellipse(Math.round(sx), Math.round(sy), 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      },
    },
    // でんでん太鼓の席に残った、水あめのわりばし(道具は仮)
    pImg("i_ame", 10.5 * T, 6.7 * T, {
      range: 36,
      hidden: (api) => !api.flag("gone") || api.hasItem("水あめのわりばし"),
      interact(api) {
        api.hold("ic_ame", 1.8, () => {
          api.giveItem("水あめのわりばし");
          api.clear();
        });
      },
    }),
  ],
};
