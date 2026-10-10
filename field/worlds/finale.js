// 最後の場面。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== 最後の場面(D173、D174、D184〜D187、D229〜D234) ========
// すべての断片を終えて懲罰空間に戻ると、カメラが引いて月の欠けが見え、北の奥の扉が開く(懲罰空間の onEnter)
// → 扉の先はボタンの部屋。地球シミュレータの筐体(D233)のまん中の赤い丸がボタン(D234)。案内板は絵記号だけ(D231)
// → きーが押せば B。押さずに待つと(D232)、そのあいだにちゃんの痕跡が浮かぶ(執着の誘い D174)
//   観測がそろっていれば C(懲罰空間の 10 の台座が灯り、白にとける)。そろっていなければ、きこりが突っ込んできて押す(B)
// → 一枚絵 → スタッフロール(C は作者のイメージボード)→ おわり → 懲罰空間へ
// 観測(D189): 断片ごとの「見届け」(kWatch、api.observe)。10 の断片すべてで見届けていれば C。?debug&endc で C を見られる
const fObservedAll = (api) => /[?&]endc\b/.test(location.search) || VOID_FRAGMENTS.every((f) => api.observed(f.id));
const fS = { phase: "room", t0: 0, ending: "b", touchAt: -9 };
const fNow = () => performance.now() / 1000;
const F_SIM = { x: 15 * T, y: 13.4 * T }; // 稼働している 1 台の足もと(D238)
const F_SIM_BTN = { x: 17.5 - 18, y: 44 - 90 }; // 赤い丸の中心(足もとからのずれ)。筐体は正面向き(作者「筐体は正面にして」)
const F_LEAVE_Y = 17.7 * T; // ここより扉のほうへ出ると、押さずに去ったことになる(D251。前の「14 秒待つ」D232 は取りかえた)
// ボタンの部屋に浮かんでいたちゃんの痕跡(D174)は、ノイズなので外した(D248)
// C: 懲罰空間の 10 の台座が、一つずつ灯る(D229 の空の台座が、ここで全部灯る)
const fPedestal = (f, i) => ({
  id: `fp_${f.id}`,
  x: f.object.x,
  y: f.object.y,
  w: 1,
  h: 1,
  solid: { w: 44, h: 18, dy: -8 },
  draw(ctx, sx, sy, t, api) {
    const lit = fS.phase === "c_light" ? Math.max(0, Math.min(1, (fNow() - fS.t1 - 0.8 - i * 0.35) / 0.8)) : 0;
    const r = 54 + lit * 90;
    const g = ctx.createRadialGradient(sx, sy - 40, 4, sx, sy - 40, r);
    g.addColorStop(0, `rgba(${200 + lit * 55}, ${225 - lit * 35}, ${240 - lit * 130}, ${0.4 + lit * 0.45})`);
    g.addColorStop(1, "rgba(255, 190, 110, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(sx - r, sy - 40 - r, r * 2, r * 2);
    if (lit > 0) {
      // 灯った台座から、上へ光の柱
      const h = 260 * lit;
      const pg = ctx.createLinearGradient(0, sy - 40, 0, sy - 40 - h);
      pg.addColorStop(0, `rgba(255, 196, 120, ${0.55 * lit})`);
      pg.addColorStop(1, "rgba(255, 196, 120, 0)");
      ctx.fillStyle = pg;
      ctx.fillRect(sx - 14, sy - 40 - h, 28, h);
    }
    const ped = api.image("pedestal");
    const ico = api.image(`frag_${f.id}`);
    if (ped) ctx.drawImage(ped, sx - 32, sy - 58);
    if (ico) ctx.drawImage(ico, sx - 24, sy - 86 + Math.round(Math.sin(t * 2) * 2));
  },
});
const fEnd = (api, ending) => {
  fS.phase = "end";
  fS.ending = ending;
  api.setFlag(`ending_${ending}`);
  api.clear(); // 最後の場面を見た(懲罰空間に戻っても、もう始まらない)
};
// 赤い丸が押される(B。D238)。だれが押しても同じ: 寄って、押しこまれ、灰色の筐体に順に火が灯り、演算が始まる
const fPress = (api, who) => {
  if (fS.phase === "pressed") return;
  fS.phase = "pressed";
  fS.pressT = fNow();
  fS.by = who;
  fS.peek = 0;
  api.freeze(40);
  const bx = F_SIM.x + F_SIM_BTN.x;
  const by = F_SIM.y + F_SIM_BTN.y;
  const p = api.player();
  api.camPath([
    { t: 0, x: p.x, y: p.y - 20, z: 1 },
    { t: 0.6, x: bx, y: by + 10, z: 2.2 },
    { t: 2.0, x: bx, y: by + 10, z: 2.2 },
    { t: 4.8, x: 15 * T, y: 9.5 * T, z: 0.55 }, // 引いて、墓標の列に火が灯っていくのを見せる
    { t: 8.2, x: 15 * T, y: 9.5 * T, z: 0.55 },
  ]);
  if (who === "kikori") api.later(400, () => (api.bubble("kikori", "ブヒッ", 900), api.sfx("oink"))); // 鳴き声(仮)
  api.later(1000, () => {
    fS.down = true;
    api.sfx("clang");
    api.shake(0.4, 3);
  });
  api.later(2000, () => {
    fS.litT0 = fNow();
    [0, 700, 1400, 2100, 2800].forEach((ms) => api.later(ms, () => api.sfx("whir")));
  });
  // 地平まで: パースの一枚絵で、灯りが列ごとに地平へ走る → 閃光 → 月がなおる
  api.later(8600, () =>
    api.showSeq(["v_cl1", "v_cl2", "v_cl3"], 1.7, () => {
      api.flash(0.6);
      // 引きつづける(todo 62 の C、D276): 画面いっぱいの白い床 → 引くと、月面の丸い白いクレーター → 欠けに寄った月面(白い点)→ 月の裏の全体。
      // さっきまでいた所が月ごとふさがるのを、一つのカメラの動きで見せる → 欠けがふさがる → 町 → 棚 → 誰もいないゴール(D273)
      const pull = (img, w, h, fadeIn) => ({ img, sec: 2, z0: 1.35, z1: 1, cx: w / 2, cy: h / 2, ease: "out", fadeIn });
      api.later(500, () =>
        api.burst(
          [
            { img: "v_pull1", sec: 1.8, z0: 1.12, z1: 1, cx: 480, cy: 288, ease: "out" },
            { img: "v_pull1c", sec: 2.6, z0: 5.5, z1: 1, cx: 326, cy: 153, ease: "out", fadeIn: 0.5 }, // まっ白(クレーターの底)から引く。クレーターは絵の (326, 153)(D299 で描き直し)
            { img: "v_pull2", sec: 2, z0: 2.2, z1: 1, cx: 236, cy: 140, ease: "out", fadeIn: 0.9 }, // 白い点(懲罰空間)に寄った所から
            pull("v_pull3", 480, 288, 1), { img: "v_b_heal", sec: 1.6, z0: 1, z1: 1, cx: 240, cy: 144, fadeIn: 1.4 }],
          () =>
            api.showSeq(["v_b_heal", "v_b_town", "v_b_shelf", "v_b_flag"], 3, () => {
              fEnd(api, "b");
              api.cut("roll", "b");
            }),
          { white: false }
        )
      );
    })
  );
};
// 灰色の筐体(D238、D239): 全人類の墓標。墓地の区画のように、4 台ごとの通路で区切った列
const F_CABS = (() => {
  const out = [];
  const xs = [];
  for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) xs.push(13.6 - k * 6 - j * 1.25);
  const cols = xs.filter((x) => x >= 1.4).flatMap((x) => [x, 30 - x]);
  for (const y of [4.2, 6.4, 8.6, 10.8]) for (const x of cols) out.push([x, y]);
  for (const y of [12.8, 15]) for (const x of cols) if (x <= 9.9 || x >= 20.1) out.push([x, y]);
  return out;
})();
const fCabLit = (x, y) => {
  if (!fS.litT0) return 0;
  const d = Math.hypot(x - F_SIM.x, y - F_SIM.y);
  return Math.max(0, Math.min(1, (fNow() - fS.litT0 - d / 220) / 0.35));
};
const fCab = ([cx, cy], i) => ({
  id: `cab${i}`,
  x: cx * T,
  y: cy * T,
  w: 1,
  h: 1,
  solid: { w: 36, h: 10, dy: -5 },
  draw(ctx, sx, sy, t, api) {
    const lit = fCabLit(this.x, this.y);
    const gray = api.image("sim_gray");
    const live = api.image("simulator");
    if (!gray || !live) return;
    const x0 = Math.round(sx - live.width / 2);
    const y0 = Math.round(sy - live.height);
    if (lit < 1) {
      ctx.drawImage(gray, x0, y0);
      // 足もとに積もったうすいほこり
      ctx.fillStyle = "rgba(170, 168, 190, 0.55)";
      for (let k = 0; k < 6; k++) ctx.fillRect(x0 + 3 + ((i * 7 + k * 11) % 30), y0 + live.height - 3 - (k % 2), 2, 1);
    }
    if (lit > 0) {
      ctx.save();
      ctx.globalAlpha = lit;
      ctx.drawImage(live, x0, y0);
      const bx = Math.round(sx + F_SIM_BTN.x);
      const by = Math.round(sy + F_SIM_BTN.y);
      const g = ctx.createRadialGradient(bx, by, 1, bx, by, 22);
      g.addColorStop(0, `rgba(255, 120, 90, ${0.35 + Math.sin(t * 3 + i) * 0.1})`);
      g.addColorStop(1, "rgba(255, 120, 90, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(bx - 22, by - 22, 44, 44);
      // 火が灯る瞬間の白い光
      const f = fNow() - fS.litT0 - Math.hypot(this.x - F_SIM.x, this.y - F_SIM.y) / 220;
      if (f > 0 && f < 0.5) {
        ctx.globalAlpha = 1 - f / 0.5;
        ctx.fillStyle = "#fff";
        ctx.fillRect(x0, y0, live.width, live.height);
      }
      ctx.restore();
    }
  },
});
// 赤い丸を覗く(D240、D249): 赤い丸の中に、分かれ道の絵記号が一つずつ浮かぶ。
// 上にボタン。そこから二つに分かれ、上の段は電源オン(かりそめの再建 D247)→ 欠けた月→丸い月、こわれた町→元の町、ぼぎ→置物。
// 下の段は電源オフ(遠い未来の再会)→ 目、砂時計と∞、ちゃんときーの再会。下の段は見届けの数で少しずつ開き、まだのものは「?」
const F_OFF_NEED = [3, 7, 10]; // 目、砂時計と∞、再会が開く見届けの数
const fObservedN = (api) => (/[?&]endc\b/.test(location.search) ? 10 : VOID_FRAGMENTS.filter((f) => api.observed(f.id)).length);
const fDrawPeek = (ctx, api) => {
  if (!fS.peek) return;
  const now = fNow();
  const el = now - fS.peek;
  const u = Math.min(1, el / 0.35);
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = `rgba(8, 7, 16, ${0.85 * u})`;
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * 0.34 * (0.6 + 0.4 * u);
  const k = R / 204; // 下絵(docs/record/2026-10-07/picto_branch_mock.png)は R = 204 で描いた
  ctx.fillStyle = "#c9cbe0";
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
  g.addColorStop(0, "#d23a3a");
  g.addColorStop(0.6, "#a81c2a");
  g.addColorStop(1, "#5e0a16");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  // 浮かぶ順: ボタン → 分かれ道 → オンの記号 → オンの 3 つ → オフの記号 → オフの 3 つ(0.55 秒ずつ)
  // 出そろって少したつと、図は消えて、大きな電源ボタンの記号に切りかわる(D252。押すか、去るか)
  const F_SWITCH = 0.4 + 9 * 0.55 + 2.6;
  const sw = Math.max(0, Math.min(1, (el - F_SWITCH) / 0.6));
  const at = (i) => Math.max(0, Math.min(1, (el - 0.4 - i * 0.55) / 0.3)) * u * (1 - sw);
  const WH = "#f6f8ff";
  const by = cy - 130 * k;
  const x0 = cx - 170 * k;
  const rowOn = cy - 30 * k;
  const rowOff = cy + 70 * k;
  ctx.lineWidth = Math.max(2, 3 * k);
  ctx.strokeStyle = WH;
  ctx.fillStyle = WH;
  // ボタン
  ctx.globalAlpha = at(0);
  ctx.beginPath();
  ctx.arc(cx, by, 18 * k, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ff7a5a";
  ctx.beginPath();
  ctx.arc(cx, by, 11 * k, 0, Math.PI * 2);
  ctx.fill();
  // 分かれ道
  ctx.globalAlpha = at(1);
  ctx.beginPath();
  ctx.moveTo(cx, by + 20 * k);
  ctx.lineTo(cx, by + 44 * k);
  ctx.lineTo(x0 - 14 * k, by + 44 * k);
  ctx.lineTo(x0 - 14 * k, rowOff);
  ctx.lineTo(x0 + 2 * k, rowOff);
  ctx.moveTo(x0 - 14 * k, rowOn);
  ctx.lineTo(x0 + 2 * k, rowOn);
  ctx.stroke();
  // 電源の記号: オン = 輪に縦の線(白く灯る)/ オフ = 輪だけ(うすい)
  const power = (y, on, a) => {
    ctx.globalAlpha = a * (on ? 1 : 0.65);
    ctx.strokeStyle = WH;
    ctx.lineWidth = Math.max(3, 4 * k);
    ctx.beginPath();
    if (on) ctx.arc(x0 + 20 * k, y, 16 * k, -Math.PI * 0.32, Math.PI * 1.32);
    else ctx.arc(x0 + 20 * k, y, 16 * k, 0, Math.PI * 2);
    ctx.stroke();
    if (on) {
      ctx.beginPath();
      ctx.moveTo(x0 + 20 * k, y - 22 * k);
      ctx.lineTo(x0 + 20 * k, y - 2 * k);
      ctx.stroke();
    }
  };
  power(rowOn, true, at(2));
  const sc = Math.max(1, Math.round(2 * k));
  const pic = (i, x, y, a) => {
    const im = api.image(`picto${i}`);
    if (!im || a <= 0) return;
    ctx.globalAlpha = a;
    ctx.drawImage(im, Math.round(x), Math.round(y - (im.height * sc) / 2), im.width * sc, im.height * sc);
  };
  [2, 3, 4].forEach((n, j) => pic(n, x0 + (56 + j * 96) * k, rowOn, at(3 + j)));
  power(rowOff, false, at(6));
  const seen = fObservedN(api);
  const P = window.bogiPix;
  [5, 6, 7].forEach((n, j) => {
    const a = at(7 + j);
    const x = x0 + (56 + j * 96) * k;
    if (seen >= F_OFF_NEED[j]) pic(n, x, rowOff, a);
    else if (a > 0) {
      // まだ見届けが足りない: 「?」。ときどき、ちらつく
      ctx.globalAlpha = a * (Math.sin(now * 5 + j * 1.7) > -0.6 ? 0.85 : 0.35);
      if (P) {
        const S = Math.max(2, Math.round(3 * k));
        P.text(ctx, "?", Math.round(x + 40 * sc / 2 - (P.width("?") * S) / 2), Math.round(rowOff - 8 * S), S, WH);
      }
    }
  });
  if (sw > 0) {
    // 電源ボタンの記号(輪の上が開いて、縦の線)。ゆっくり息をする
    const pr = R * 0.42;
    ctx.globalAlpha = sw * (0.85 + Math.sin(now * 2.4) * 0.15);
    ctx.strokeStyle = WH;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(6, R * 0.09);
    ctx.beginPath();
    ctx.arc(cx, cy + pr * 0.08, pr, -Math.PI * 0.3, Math.PI * 1.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - pr * 1.05);
    ctx.lineTo(cx, cy - pr * 0.05);
    ctx.stroke();
  }
  ctx.restore();
};
// ボタンの部屋(D229〜D240): 暗いラベンダーの広間。灰色の筐体が墓標のように並び、扉の正面の 1 台だけが稼働している
const F_WHITE = {
  tile: T,
  bg: "#16152a",
  map: kGrid(30, 20, (c, r) => r < 2 || r > 18 || c < 1 || c > 28),
  legend: K_LEGEND,
  spawns: { start: { x: 15 * T, y: 16.6 * T, facing: "north" } }, // 去る線(F_LEAVE_Y)より奥。扉の絵にきーが隠れないように
  onEnter(api) {
    // 扉を開けた瞬間: 地平まで続く墓標のパースの一枚絵(D239)。待つ時間は見終えてから数える
    if (fS.phase !== "room" || fS.shown) return;
    fS.shown = true;
    api.freeze(1);
    api.later(300, () =>
      api.showSeq(["v_cluster"], 3.4, () => {
        api.cut("white", "start"); // showSeq は終わると黒いままなので、同じ所に入りなおす
        fS.t0 = fNow();
      })
    );
  },
  drawGround(ctx, ox, oy) {
    // 奥の壁
    ctx.fillStyle = "#211f3c";
    ctx.fillRect(ox + T, oy, 28 * T, 2 * T);
    // 格子の床
    ctx.fillStyle = "#2a2848";
    ctx.fillRect(ox + T, oy + 2 * T, 28 * T, 17 * T);
    ctx.fillStyle = "#38365e";
    for (let c = 1; c <= 29; c++) ctx.fillRect(ox + c * T, oy + 2 * T, 1, 17 * T);
    for (let r = 2; r <= 19; r++) ctx.fillRect(ox + T, oy + r * T, 28 * T, 1);
    // 稼働している筐体の赤い丸が、床にうすく映る(自分で電源を切ると消える)
    const lit = 1 - (fS.offT ? Math.min(1, (fNow() - fS.offT) / 0.9) : 0);
    const g = ctx.createRadialGradient(ox + F_SIM.x, oy + F_SIM.y + 14, 2, ox + F_SIM.x, oy + F_SIM.y + 14, 70);
    g.addColorStop(0, `rgba(230, 70, 50, ${0.24 * lit})`);
    g.addColorStop(1, "rgba(230, 70, 50, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(ox + F_SIM.x - 70, oy + F_SIM.y - 56, 140, 140);
  },
  drawOverlay(ctx, ox, oy, t, api) {
    // 奥ほど暗く、終わりが見えない。火が灯っていくと晴れる
    const clear = fS.litT0 ? Math.min(1, (fNow() - fS.litT0) / 2.5) : 0;
    const g = ctx.createLinearGradient(0, oy, 0, oy + 12 * T);
    g.addColorStop(0, `rgba(10, 9, 20, ${0.92 * (1 - clear * 0.7)})`);
    g.addColorStop(1, "rgba(10, 9, 20, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, 30 * T, 12 * T);
    fDrawPeek(ctx, api);
  },
  debug: () => Object.assign({ now: fNow() }, fS),
  objects: [
    {
      id: "fctl",
      x: -100,
      y: -100,
      w: 1,
      h: 1,
      draw() {},
      update(dt, t, api) {
        const now = fNow();
        // 覗くのは、立ち止まっているあいだだけ(歩くと離れる)
        if (fS.peek) {
          const p = api.player();
          if (fS.phase !== "room" || Math.hypot(p.x - fS.peekX, p.y - fS.peekY) > 3) fS.peek = 0;
        }
        const p = api.player();
        if (fS.phase === "room" && fS.t0 && p.y > F_LEAVE_Y && !api.camPathOn()) {
          // 押さずに去ろうとした(D247、D251): きこりが右から突っ込んでくる
          fS.peek = 0;
          fS.t1 = now;
          if (fObservedAll(api)) {
            // 見届けがそろっている: きこりが着く前に、地球シミュレータが自分で電源を切る(D251)。
            // きこりは消えた赤い丸を押すが、何も起きない。押しても押しても動かず、手を止める
            // きーはふり返って、電源が切れるのを見届ける(D253)
            fS.phase = "selfoff";
            api.freeze(10);
            api.camPath([
              { t: 0, x: p.x, y: p.y, z: 1 },
              { t: 1.0, x: F_SIM.x + 10, y: (F_SIM.y + p.y) / 2 - 30, z: 1.1 }, // ふり返ったきーと筐体が、一つの画面に
              { t: 8.4, x: F_SIM.x + 10, y: (F_SIM.y + p.y) / 2 - 30, z: 1.1 },
            ]);
            api.later(500, () => api.face("north"));
            api.later(1000, () => {
              fS.offT = fNow();
              api.sfx("whir");
            });
            api.later(6000, () => api.showObserve());
            [3200, 3800, 4400, 5000].forEach((ms, i) =>
              api.later(ms, () => {
                fS.pokeT = fNow();
                api.sfx("pop");
                if (i === 0) api.bubble("kikori", "ブヒッ", 800); // 鳴き声(仮)
              })
            );
            api.later(8600, () => {
              fS.phase = "c_light";
              fS.t1 = fNow();
              api.cut("hub", "c");
            });
          } else {
            fS.phase = "kikori";
            api.freeze(9);
          }
        }
        if (fS.phase === "kikori" && now - fS.t1 > 1.4) fPress(api, "kikori");
      },
    },
    {
      // 稼働している 1 台(D233、D238)。A で赤い丸を覗く(D240)、覗いているあいだに A で押す(D234)
      id: "sim",
      x: F_SIM.x,
      y: F_SIM.y,
      w: 1,
      h: 1,
      headY: 96,
      range: 44,
      solid: { w: 36, h: 12, dy: -6 },
      canInteract: () => fS.phase === "room" && !!fS.t0,
      noMark: () => !!fS.peek, // 覗いている大写しの上に、A の印を重ねない
      interact(api) {
        if (fS.peek) {
          fPress(api, "ki");
          return;
        }
        const p = api.player();
        Object.assign(fS, { peek: fNow(), peekX: p.x, peekY: p.y });
      },
      draw(ctx, sx, sy, t, api) {
        const im = api.image("simulator");
        if (!im) return;
        const x0 = Math.round(sx - im.width / 2);
        const y0 = Math.round(sy - im.height);
        ctx.drawImage(im, x0, y0);
        const bx = Math.round(sx + F_SIM_BTN.x);
        const by = Math.round(sy + F_SIM_BTN.y);
        ctx.save();
        const off = fS.offT ? Math.min(1, (fNow() - fS.offT) / 0.9) : 0;
        if (off > 0) {
          // 自分で電源を切った: 赤い丸の光がしぼんで、暗く沈む(D251)
          ctx.fillStyle = `rgba(30, 24, 34, ${0.82 * off})`;
          ctx.beginPath();
          ctx.arc(bx, by, 10.5, 0, Math.PI * 2);
          ctx.fill();
          const last = Math.max(0, 1 - off * 1.4);
          if (last > 0) {
            const g = ctx.createRadialGradient(bx, by, 1, bx, by, 20 * last + 2);
            g.addColorStop(0, `rgba(255, 140, 110, ${0.5 * last})`);
            g.addColorStop(1, "rgba(255, 120, 90, 0)");
            ctx.fillStyle = g;
            ctx.fillRect(bx - 22, by - 22, 44, 44);
          }
        } else if (fS.down) {
          // 押しこまれた: 赤い丸が沈んで暗くなる
          ctx.fillStyle = "rgba(40, 0, 0, 0.45)";
          ctx.beginPath();
          ctx.arc(bx, by + 1, 10, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // 赤い丸が、ゆっくり息をする
          const a = 0.18 + Math.sin(t * 2.2) * 0.12;
          const g = ctx.createRadialGradient(bx, by, 1, bx, by, 20);
          g.addColorStop(0, `rgba(255, 120, 90, ${a})`);
          g.addColorStop(1, "rgba(255, 120, 90, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(bx - 20, by - 20, 40, 40);
        }
        ctx.restore();
      },
    },
    {
      // 入ってきた扉(開いたまま)
      id: "fdoor",
      x: 15 * T,
      y: 19.95 * T,
      w: 1,
      h: 1,
      draw(ctx, sx, sy, t, api) {
        const im = api.image("door_open");
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height));
      },
    },
    {
      id: "kikori",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      headY: 40,
      hidden: () => !["kikori", "pressed", "selfoff"].includes(fS.phase) || fS.by === "ki",
      update() {
        if (fS.phase !== "kikori" && fS.phase !== "selfoff") return;
        // 右(未来)から、筐体の右わきへ突っ込んでくる(電源を切るのを見せるため、去るときは少し遅れて)
        const delay = fS.phase === "selfoff" ? 1.6 : 0;
        const u = Math.max(0, Math.min(1, (fNow() - fS.t1 - delay) / 1.3));
        this.x = F_SIM.x + 30 + (1 - u) * 10 * T;
        this.y = F_SIM.y + 6;
        this.arrived = u >= 1;
      },
      draw(ctx, sx, sy, t, api) {
        const im = api.image("kikori");
        if (!im) return;
        let run = (fS.phase === "kikori" || fS.phase === "selfoff") && !this.arrived ? Math.abs(Math.sin(t * 14)) * 3 : 0;
        // 消えた赤い丸を押す: 押すたびに前へのめる。最後は止まる
        if (fS.phase === "selfoff" && this.arrived && fS.pokeT) {
          const k = fNow() - fS.pokeT;
          if (k < 0.25) {
            sx -= 3 * (1 - k / 0.25);
            run = 0;
          }
        }
        ctx.save();
        ctx.translate(Math.round(sx), Math.round(sy - im.height - run));
        ctx.scale(-1, 1);
        ctx.drawImage(im, -im.width / 2, 0);
        ctx.restore();
      },
    },
  ]
    .concat(F_CABS.map(fCab)),
};
// C の場面: 懲罰空間に戻って、10 の台座が一つずつ灯り、白にとける
const F_HUB = {
  tile: T,
  bg: "#f7f7f9",
  map: voidGrid(),
  legend: {
    ".": { wang: "void", lowerOf: ["void"] },
    ",": { wang: "void" },
  },
  wang: { void: { img: "wang_void", size: 32, lookup: WANG16 } },
  spawns: { c: { x: 22 * T, y: 17 * T, facing: "south" } },
  onEnter(api) {
    fS.t1 = fNow();
    api.freeze(12);
    api.camPath([
      { t: 0, x: 22 * T, y: 17 * T, z: 1 },
      { t: 4.5, x: 22 * T, y: 16 * T, z: 0.32 },
      { t: 7.5, x: 22 * T, y: 16 * T, z: 0.32 },
    ]);
    VOID_FRAGMENTS.forEach((f, i) => api.later(800 + i * 350, () => api.sfx("pop")));
    // 台座が灯って白くなる → ∞の彼方の時空(D242〜D245。todo 46 の「定点と引き」。きーがとける絵は D278 で外した)
    // 一部・定点: 最後の一台の電源が切れる → 月の裏の墓地から見た空が、数十億年かけて変わる(昼夜が流れる、アンドロメダが近づいて合体する、
    //   太陽が赤色巨星にふくらみ、墓標の列がその前の小さな影になる、地面が焼けて白くとぶ)
    // 二部・引き: 惑星状星雲と白色矮星 → ミルコメダ → 星が赤くなって減る → ほとんど見えない → ブラックホールの最後の小さな光 → まっ暗(熱的死)
    // 絵の間は、先へ行くほど長く。まっ暗のあとの声とスタッフロールは F_ROLL
    // きーがとける絵(v_c_one)は出さない(D278): 白くなったところから、最後の一台の電源が切れる墓標の絵へ
    const groups = [
      [["v_cluster", "v_off"], 2.4],
      [["v_s1", "v_s2"], 2.6],
      [["v_s3", "v_s4"], 2.8],
      [["v_s5", "v_s6", "v_s7", "v_s8"], 3.2],
      [["v_q1"], 3.8],
      [["v_q2", "v_q3", "v_q4"], 4],
      [["v_q5"], 4.5],
    ];
    const play = (i) => {
      if (i >= groups.length) {
        fEnd(api, "c");
        api.cut("roll", "c");
        return;
      }
      api.showSeq(groups[i][0], groups[i][1], () => play(i + 1));
    };
    api.later(7000, () => play(0));
  },
  drawOverlay(ctx) {
    // きーが白にとけていく
    if (fS.phase !== "c_light") return;
    const u = Math.min(1, Math.max(0, (fNow() - fS.t1 - 4.6) / 2.4));
    // カメラが引いて(縮めて)いても画面全体にかかるように、縮みを外して塗る(縮んだまま塗ると左上の四角だけ白くなっていた)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(252, 252, 255, ${u})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  },
  objects: VOID_FRAGMENTS.map(fPedestal).concat([
    {
      id: "fhdoor",
      x: VOID_DOOR.x,
      y: VOID_DOOR.y,
      w: 1,
      h: 1,
      draw(ctx, sx, sy, t, api) {
        const im = api.image("door_open");
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height));
      },
    },
  ]),
};
// スタッフロール(D171、D172)
// B(電源オン): 絵を出さない簡素な字だけのロール。ロールのあいだは操作できない。終わったらタイトルへ(D277)
// C: 作者のイメージボード(pic/ の手描き)だけを額で流す(D284、D285。docs/assets/finale/roll_sketch.py)
const F_ROLL_ITEMS = ["凍った湖と富士山", "アンバリッド・ホテル", "霞ヶ浦のエクラノプラン", "南極のバナナ農園", "荒川の鈴木商店", "宝舟と首振りエンジン", "呪いの野犬", "ぱーでれとだいにち", "きこりと金星", "ぼぎボマーと地上ぼぎクルー"];
// C のスタッフロールの文字(D286)。スケッチ 1 枚ごとに 1 組、絵の反対側に出す
// 作者「人間の作者、あなた、pixelラボ、スペシャルサンクス、GitHubとか、適当に役目を割り当てて」
const F_CREDITS = [
  ["原作・絵", ["bibiman1"]],
  ["世界とことば", ["bibiman1"]],
  ["ゲームデザイン", ["bibiman1", "Claude"]],
  ["プログラム", ["Claude"]],
  ["ドット絵", ["PixelLab", "下絵 Claude"]],
  ["音と制作日記", ["Claude"]],
  ["文字", ["DotGothic16", "(Fontworks)"]],
  ["道具", ["Claude Code", "GitHub", "Playwright"]],
  ["音楽", ["Iskander Ramazanov", "（Pixabay）"]],
  ["スペシャルサンクス", ["太宰治"]],
];
// 絵のあとに、まん中に字だけで出す(使った曲と音の出典と作者。todo 69、D301)。最後は、あそんでくれたあなた
const F_CREDITS_TAIL = [
  ["音楽", ["「Accordion Passion of the Roma」", "「Melancholic Accordion in the Rain」", "Music by Iskander from Pixabay"]],
  ["音", ["赤ちゃんの笑い声", "reinsamba（CC BY 3.0）", "公園の遊び場", "foongaz（CC0）", "Wikimedia Commons"]],
  ["スペシャルサンクス", ["あそんでくれた", "あなた"]],
];
const F_ROLL = {
  tile: T,
  // C はまっ暗の無音から(笑い声のあとで公園の音にかえる D292)。B はいまのまま
  get bgm() {
    return fS.ending === "c" ? "silence" : undefined;
  },
  bg: "#0a0c14",
  hidePlayer: true,
  // ロールのあいだは、キーもボタンも受けつけない(B は D277。C も同じに)。「おわり」で止まったら、どれかを押すとタイトルへ(D296)
  lockInput: true,
  onLockedPress(api) {
    if (!fS.rollDone || fS.exiting) return;
    fS.exiting = true;
    api.sfx("ok");
  },
  map: kGrid(15, 9, () => false),
  legend: K_LEGEND,
  spawns: { b: { x: 7 * T, y: 4 * T, facing: "south" }, c: { x: 7 * T, y: 4 * T, facing: "south" } },
  onEnter(api) {
    fS.rollT0 = null;
    fS.rollDone = false; // 二度目の結末でも、ロールを最後まで流す
    fS.exiting = false;
    fS.left = false;
    api.freeze(99);
    const go = () => {
      fS.rollT0 = fNow();
    };
    // C: 熱的死のまっ暗のまま、しばらく音もない。そこで、楽しそうに笑う赤ちゃんの声(D170、D279、D292)。
    // 笑い声のあとにスタッフロールが流れはじめ、公園の遊び場の音がする
    if (fS.ending === "c") {
      api.later(4500, () => api.sfx("baby_laugh"));
      api.later(8000, () => {
        if (window.bogiAudio) window.bogiAudio.bgm("roll_c");
        go();
      });
    } else api.later(600, go);
  },
  drawOverlay(ctx, ox, oy, t, api) {
    const P = window.bogiPix;
    if (!P || fS.rollT0 == null) return;
    const S = 2;
    const VWc = ctx.canvas.width;
    const VHc = ctx.canvas.height;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const y0 = VHc - (fNow() - fS.rollT0) * 90;
    const c = fS.ending === "c";
    const title = "ぼぎだぢ";
    P.text(ctx, title, Math.round((VWc - P.width(title) * S) / 2), Math.round(y0), S, "#ffffff");
    if (!c) {
      // B: 字だけ。C と同じ役目と名前を、絵を出さずに流して、おわり(D277、D287)
      const lineH = 22 * S;
      let yy = y0 + 70 * S;
      F_CREDITS.concat(F_CREDITS_TAIL).forEach(([role, names]) => {
        [[role, "#9a9aa6"], ...names.map((n) => [n, "#ffffff"])].forEach(([text, col], k) => {
          const y = yy + k * lineH + (k ? 6 * S : 0);
          if (y > -lineH && y < VHc + 10) P.text(ctx, text, Math.round((VWc - P.width(text) * S) / 2), Math.round(y), S, col);
        });
        yy += (names.length + 1) * lineH + 30 * S;
      });
      // おわりは、最後の名前が画面の上へ出きってから、まん中で止まる
      const endB = yy + VHc / 2;
      const owariB = "おわり";
      P.text(ctx, owariB, Math.round((VWc - P.width(owariB) * S) / 2), Math.round(Math.max(VHc / 2 - 16, endB)), S, "#ffffff");
      if (endB < VHc / 2 - 16) fS.rollDone = true;
      ctx.restore();
      return;
    }
    // C: 作者のイメージボード(手描き)だけを、額に入れて流す。断片の名も、最後の写真も出さない(D284、D285)
    const fw = 160 * S;
    const fh = 112 * S;
    const items = F_ROLL_ITEMS.map((_, i) => `roll_${String(i).padStart(2, "0")}`);
    items.forEach((key, i) => {
      const y = y0 + 90 * S + i * (fh + 40 * S);
      if (y < -fh - 40 * S || y > VHc + 10) return;
      const x = Math.round((VWc - fw) / 2) + (i % 2 ? 40 : -40) * S;
      ctx.fillStyle = "#e8e2d4";
      ctx.fillRect(x, y, fw, fh);
      const im = api && api.image(key);
      if (im) {
        // 絵はキャンバスの画素と 1 対 1 の大きさ(152×104 ドット × 2)。拡大しないので、元の線の細かさがそのまま出る
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(im, x + 4 * S, Math.round(y) + 4 * S, 152 * S, 104 * S);
      }
      // 絵の反対側に、役目と名前
      const [role, names] = F_CREDITS[i] || ["", []];
      const lines = [[role, "#9a9aa6"], ...names.map((n) => [n, "#ffffff"])];
      const lh = 22 * S;
      const ty = Math.round(y + fh / 2 - (lines.length * lh) / 2);
      const left = i % 2 === 1; // 絵が右にあるときは、文字を左に
      const area = left ? [16, x - 24] : [x + fw + 24, VWc - 16];
      lines.forEach(([text, col], k) => {
        const w = P.width(text) * S;
        const tx = left ? area[1] - w : area[0];
        P.text(ctx, text, Math.round(tx), ty + k * lh + (k ? 6 * S : 0), S, col);
      });
    });
    // 絵のあとに、使った曲と音の出典と作者を、まん中に字だけで(todo 69、D301)
    const lineH = 22 * S;
    let yy = y0 + 90 * S + items.length * (fh + 40 * S) + 20 * S;
    F_CREDITS_TAIL.forEach(([role, names]) => {
      [[role, "#9a9aa6"], ...names.map((n) => [n, "#ffffff"])].forEach(([text, col], k) => {
        const ty = yy + k * lineH + (k ? 6 * S : 0);
        if (ty > -lineH && ty < VHc + 10) P.text(ctx, text, Math.round((VWc - P.width(text) * S) / 2), Math.round(ty), S, col);
      });
      yy += (names.length + 1) * lineH + 30 * S;
    });
    // おわりは、最後の字が画面の上へ出きってから、まん中で止まる(作者「おわり　でとめる。絵がはいらないように」)
    const endY = yy + VHc / 2;
    const owari = "おわり";
    P.text(ctx, owari, Math.round((VWc - P.width(owari) * S) / 2), Math.round(Math.max(VHc / 2 - 16, endY)), S, "#ffffff");
    if (endY < VHc / 2 - 16) fS.rollDone = true;
    ctx.restore();
  },
  objects: [
    {
      id: "rollend",
      x: 7 * T,
      y: 4 * T,
      w: 1,
      h: 1,
      draw() {},
      update(dt, t, api) {
        // 「おわり」で止まったあと、キーかボタンを押すと(onLockedPress)タイトルへ。B も C も(D296)
        if (fS.exiting && !fS.left) {
          fS.left = true;
          api.freeze(0); // スタッフロールのあいだの止めを解いてから帰る
          if (window.bogiToTitle) window.bogiToTitle();
          else api.exit();
        }
      },
    },
  ],
};
