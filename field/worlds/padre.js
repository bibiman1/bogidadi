// 断片: ぱーでれとだいにち。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== ぱーでれとだいにち(D157、D158) ========
// 霧の夕暮れ、昭和の町はずれの空き地。紙芝居屋の自転車をまねた機械「ぱーでれ」が、紙芝居「だいにち」でぼぎをおびき寄せ、荷台の下の引き出しに入れて連れ去る
// 連れ去られたぼぎは戻らない(正典)。怖さは物悲しさと不穏さまで(紙芝居は楽しそう、ぱーでれはどこか滑稽)
// 向き(D148): きーは左(西 = 過去)から来て、ぱーでれは右(東 = 未来)の霧の中にいて、右へ去る
// 条件: 空いた席に座る → 紙芝居(4 枚、絵だけ)→ 引き出しがあき、でんでん太鼓が入っていく → きーも引き寄せられる(歩いて離れる)
//       → ぱーでれは霧の東へ去る → でんでん太鼓の席に残った水あめのわりばし → 帰る条件。西から帰る
// 下絵(docs/assets/padre/blockout.py)のまま。絵はあとでまとめて作る(D156)。座っているぼぎ、紙芝居の絵、道具、声は仮
const P_SEAT = { x: 11.5 * T, y: 6.6 * T }; // 空いた席
const P_CART = { x: 16 * T, y: 6.6 * T }; // ぱーでれの足もと
const P_DRAWER = { x: 16 * T - 46, y: 6.6 * T - 10 }; // 引き出しの口
const P_PULL = 24; // 引き寄せる速さ(px/秒)。きーの歩き(150)よりずっと遅いので、歩けば離れられる。何もしなければ、ゆっくり引き出しの口へ
const P_PULL_SEC = 7;
// ワンネスの結末(D159、D160、D164 の A): 引き出しに入ると、きーの思い出(終えた断片の一枚絵)が順に光にとけ、白くなって終わる。観測する者が消える
const P_MEMORIES = [["lake", "m_lake"], ["haihei", "m_haihei"], ["kasumi", "m_kasumi"], ["banana", "m_banana"], ["suzuki", "m_suzuki"], ["takarabune", "m_takarabune"], ["noroi", "m_noroi"]];
const pS = { phase: "wait", t0: 0 }; // wait → show → capture → pull → leave → done(引き出しに入れば pull → oneness)
const pNow = () => performance.now() / 1000;
// 霧と夕暮れ: 全体に夕暮れの色、東(右)ほど霧が濃い。霧のかたまりがゆっくり流れる
const pFog = (ctx, ox, oy, mapW, t, base) => {
  ctx.fillStyle = "rgba(92, 76, 96, 0.22)";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const g = ctx.createLinearGradient(ox, 0, ox + mapW, 0);
  g.addColorStop(0, `rgba(226, 222, 216, ${base})`);
  g.addColorStop(1, `rgba(226, 222, 216, ${Math.min(0.85, base + 0.5)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let k = 0; k < 9; k++) {
    const x = ox + ((k * 173 + t * (8 + k)) % (mapW + 200)) - 100;
    const y = oy + 60 + ((k * 97) % 260);
    ctx.fillStyle = "rgba(236, 232, 226, 0.16)";
    ctx.beginPath();
    ctx.ellipse(x, y, 90, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
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
    // 途中で出ていたら、そのあいだに、ぱーでれは霧の東へ去っている
    if (pS.phase !== "wait" && pS.phase !== "done" && !api.flag("gone")) {
      api.setFlag("taken");
      api.setFlag("gone");
    }
    pS.phase = api.flag("gone") ? "done" : "wait";
  },
  debug: () => Object.assign({ now: pNow() }, pS),
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
    // 引き寄せられているあいだ、引き出しに近づくほど色がうすれる(きーの輪郭がほどけていく)
    if (pS.phase === "pull" || pS.phase === "oneness") {
      const p = api.player();
      const c = pS.phase === "oneness" ? 1 : Math.max(0, Math.min(1, 1 - (Math.hypot(P_DRAWER.x - p.x, P_DRAWER.y - p.y) - 26) / (5 * T)));
      if (c > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = `rgba(128, 128, 128, ${c})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
        ctx.fillStyle = `rgba(250, 246, 236, ${0.35 * c})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
    }
  },
  // 紙芝居のあと、ぱーでれが去るまでは、道へ出られない(見届ける)
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
    // 紙芝居の進み具合(見えない係)。引き寄せと、去っていくのを動かす
    {
      id: "pctl",
      x: -100,
      y: -100,
      w: 1,
      h: 1,
      draw() {},
      update(dt, t, api) {
        const now = pNow();
        if (pS.phase === "capture" && now - pS.t0 > 2.8) {
          api.setFlag("taken");
          pS.phase = "pull";
          pS.t0 = now;
          api.mutter("……", 1600);
        }
        if (pS.phase === "pull") {
          const p = api.player();
          const dx = P_DRAWER.x - p.x;
          const dy = P_DRAWER.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 26) {
            // 引き出しの口に入った: ワンネスの結末
            pS.phase = "oneness";
            api.place(P_DRAWER.x, P_DRAWER.y);
            api.freeze(1.6);
            api.later(1400, () => {
              const keys = P_MEMORIES.filter(([id]) => api.cleared(id)).map(([, k]) => k).concat(["v_oneness"]);
              api.showSeq(keys, 2.4, () => {
                // 見た結末は記録する。世界は座る前に戻る(遊び直せる)
                api.setFlag("ending_oneness");
                api.setFlag("taken", false);
                pS.phase = "wait";
                pS.recut = true;
                api.cut("akichi", "west");
              });
            });
            return;
          }
          api.place(p.x + (dx / d) * P_PULL * dt, p.y + (dy / d) * P_PULL * dt);
          if (now - pS.t0 > P_PULL_SEC || (now - pS.t0 > 2 && d > 7 * T)) {
            pS.phase = "leave";
            pS.t0 = now;
            api.bubble("padre", "カチ　カチ", 1400);
            api.later(1800, () => kLearn(api, "funbaru", "ふんばる")); // 引き寄せられても、歩いて離れた(D201)
          }
        }
        if (pS.phase === "leave" && now - pS.t0 > 4.5) {
          api.setFlag("gone");
          pS.phase = "done";
        }
      },
    },
    pImg("padre", P_CART.x, P_CART.y, {
      headY: 96,
      solid: { w: 96, h: 18, dy: -8 },
      range: 70,
      hidden: (api) => api.flag("gone"),
      img: () => (pS.phase === "capture" || pS.phase === "pull" ? "padre_open" : "padre"),
      draw(ctx, sx, sy, t, api) {
        const im = api.image(this.img(api));
        if (!im) return;
        let x = sx;
        let a = 1;
        if (pS.phase === "leave") {
          const u = (pNow() - pS.t0) / 4.5;
          x = sx + u * u * 260; // 霧の東へ、だんだん速く
          a = Math.max(0, 1 - u * 1.1);
        }
        ctx.globalAlpha = a;
        ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(sy - im.height));
        ctx.globalAlpha = 1;
      },
      interact: (api) => api.bubble("padre", "カチ　カチ", 1400),
      canInteract: () => pS.phase === "wait",
    }),
    pImg("b_kobosi", 9.5 * T, 6.6 * T, { range: 40, interact: (api) => api.bubble("b_kobosi", P_VOICE.kobosi, 1400), canInteract: () => pS.phase === "wait" || pS.phase === "done" }),
    pImg("b_denden", 10.5 * T, 6.6 * T, {
      range: 40,
      hidden: (api) => api.flag("taken") && pS.phase !== "capture",
      draw(ctx, sx, sy, t, api) {
        const im = api.image("b_denden");
        if (!im) return;
        let x = sx;
        let y = sy;
        let a = 1;
        if (pS.phase === "capture") {
          // 立ち上がって、引き出しの口へ歩いていき、中へ消える
          const u = Math.min(1, (pNow() - pS.t0) / 2.6);
          x = sx + (P_DRAWER.x - this.x) * u + Math.sin(u * 30) * 1.5;
          y = sy + (P_DRAWER.y - this.y) * u;
          a = u > 0.85 ? (1 - u) / 0.15 : 1;
        }
        ctx.globalAlpha = a;
        ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height));
        ctx.globalAlpha = 1;
      },
      interact: (api) => api.bubble("b_denden", P_VOICE.denden, 1400),
      canInteract: () => pS.phase === "wait",
    }),
    pImg("b_hato", 12.5 * T, 6.6 * T, { range: 40, interact: (api) => api.bubble("b_hato", P_VOICE.hato, 1400), canInteract: () => pS.phase === "wait" || pS.phase === "done" }),
    // 空いた席: 座ると紙芝居がはじまる
    {
      id: "seat",
      x: P_SEAT.x,
      y: P_SEAT.y,
      w: 1,
      h: 1,
      range: 30,
      draw() {},
      canInteract: (api) => pS.phase === "wait" && !api.flag("gone"),
      interact(api) {
        pS.phase = "show";
        api.place(P_SEAT.x, P_SEAT.y);
        api.freeze(1.2);
        api.bubble("padre", "カチ　カチ", 1200);
        api.later(1200, () =>
          api.showSeq(["kami1", "kami2", "kami3", "kami4"], 2.6, () => {
            // 紙芝居は黒く終わる。暗転のまま空き地に戻し(席から)、引き出しがあく
            pS.recut = true;
            api.cut("akichi", "seat");
            pS.phase = "capture";
            pS.t0 = pNow();
            api.shake(0.3, 1);
          })
        );
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
