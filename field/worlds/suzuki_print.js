// 断片: 荒川の鈴木商店。印刷屋(鈴木印刷)の中と、活字ひろいの勝負(D630、D631)。
// suzuki.js のあとに読む(T、sMap、sSpot などを使う)
"use strict";

// ---- B' 印刷屋の中(15 × 9 マス、北を向いて見る)。背景は Pro に 1 回(docs/record/2026-11-06/print_shop/)。
// 手前(南)がガラス戸で、路地へ出る。奥の活字の棚の前にマトリョシカ(長門・宝舟と同じ絵)。
// 伝票を持って話しかけると、活字ひろいの勝負。勝てば荷札、負けたら路地へ追い出される(D630)
const SP_WALK = (c, r) => (r >= 4 && r <= 5 && c >= 4 && c <= 10) || (r >= 6 && r <= 8 && c >= 6 && c <= 8);
const SP_MATRYO = { x: 240, y: 132 };
const S_PRINT = {
  tile: T,
  bg: "#2a1c14",
  map: kGrid(15, 9, (c, r) => !SP_WALK(c, r)),
  legend: K_LEGEND,
  drawGround: kImage("bg_print", 15 * T, 9 * T),
  drawOverlay: sNight(15, 9),
  spawns: {
    door: { x: 7.5 * T, y: 8.2 * T, facing: "north" },
    front: { x: 7.5 * T, y: 5.4 * T, facing: "north" },
  },
  objects: [
    {
      id: "matryo",
      x: SP_MATRYO.x,
      y: SP_MATRYO.y,
      w: 1,
      h: 1,
      headY: 40,
      range: 2.2 * T,
      solid: { w: 26, h: 30, dy: 6 }, // きーが前に立っても、マトリョシカに重ならない所で止まる
      draw(ctx, sx, sy, t, api) {
        const im = api.image("matryo");
        if (!im) return;
        const rock = Math.round(Math.sin(t * 1.6) * 0.6);
        ctx.drawImage(im, Math.round(sx - im.width / 2 + rock), Math.round(sy - im.height));
      },
      interact(api) {
        if (api.hasItem("荷札") || !api.hasItem("伝票")) return api.bubble("matryo", "……", 1200);
        api.sfx("pop");
        api.warp("katsuji", "view");
      },
    },
  ],
  triggers: [{ id: "out", x: 6 * T, y: 8.75 * T, w: 3 * T, h: T, warp: { map: "alley", spawn: "printer" } }],
};

// ---- 活字ひろい(画面と同じ広さ。カメラは動かない)----
// お手本は荷札の言葉(D82)から、入るたびに 1 つ(D631、todo 259)。マトリョシカと早く拾い合う。
// 字は読ませない: お手本の字に印をつけ、棚から同じ形の活字(左右が逆)を選ぶ。説明の文は出さない。
// はじめにマトリョシカが 1 字拾ってみせる。まちがえると少し手が止まる
// 棚には、戦争の言葉の活字がばらばらにまざっている(D632、D634。お手本には出さず、説明もしない)
const SK_WORDS = ["取扱注意", "天地無用", "鈴木商店", "荒川区"];
const SK_WAR = ["熱核弾頭", "極超音速", "有人誘導式", "総員転身", "絶対防衛線"]; // 作者の言葉(11-06)。私からは足さない
const SK_OTHERS = ["品", "名", "発", "着", "荒", "川", "区", "鈴", "木", "商", "店", "取", "扱", "注", "意", "印", "天", "地", "無", "用"]; // 荷札と看板の字
const SK_COLS = 8;
const SK_ROWS = 2;
const SK = { demo: 2.6, pace: 3.3, stun: 0.8, end: 1.3, war: 8 }; // 秒: 見本の 1 字、マトリョシカが 1 字拾う間、まちがいで止まる間、勝負のあと。war は棚にまぜる戦争の言葉の字の数
const sK = { phase: "idle", t: 0, word: [], cells: [], cur: 0, ki: 0, m: 0, mx: 0, my: 0, mNext: 0, stunT: -9, lastX: 0, lastY: 0 };

const skShuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
// 1 回分(お手本と棚を入れかえる)。3 回戦で先に 2 勝(D635)
const skRound = () => {
  const word = [...SK_WORDS[Math.floor(Math.random() * SK_WORDS.length)]];
  const war = skShuffle([...new Set(SK_WAR.join(""))]).slice(0, SK.war); // 戦争の言葉の字から
  const fill = skShuffle(SK_OTHERS.filter((ch) => !word.includes(ch))).slice(0, SK_COLS * SK_ROWS - word.length - war.length);
  const cells = skShuffle(word.concat(war, fill));
  Object.assign(sK, { phase: "demo", t: 0, word, cells, cur: 0, ki: 0, m: 0, stunT: -9, lastX: 0, lastY: 0 });
  [sK.mx, sK.my] = skCellXY(SK_COLS * SK_ROWS - 1, 0, 0); // マトリョシカの手は、右下から動きだす
  sK.mNext = SK.demo;
};
const skStart = () => {
  sK.results = []; // 回ごとの勝ち: "k" きー、"m" マトリョシカ
  sK.done = false;
  skRound();
};
const skCellOf = (ch) => sK.cells.indexOf(ch);
const skEnd = (api, who) => {
  sK.results.push(who);
  sK.phase = "round";
  sK.endT = sK.t;
  api.sfx(who === "k" ? "pinpon" : "back");
};
const skWins = (who) => sK.results.filter((r) => r === who).length;
const skTick = (api, dt) => {
  sK.t += dt;
  // マトリョシカの手: 次に拾う字へ動き、時間が来たら拾う
  if (sK.phase === "demo" || sK.phase === "race") {
    if (sK.m < sK.word.length) {
      const [tx, ty] = skCellXY(skCellOf(sK.word[sK.m]), 0, 0);
      const k = Math.min(1, dt * 3);
      sK.mx += (tx - sK.mx) * k;
      sK.my += (ty - sK.my) * k;
      if (sK.t >= sK.mNext) {
        sK.m++;
        sK.mNext = sK.t + SK.pace;
        api.sfx("clang");
        if (sK.phase === "demo") sK.phase = "race";
        else if (sK.m >= sK.word.length) skEnd(api, "m");
      }
    }
  }
  if (sK.phase === "round" && sK.t - sK.endT > SK.end && !sK.done) {
    if (skWins("k") < 2 && skWins("m") < 2) return skRound(); // まだ決まらなければ、次の回
    sK.done = true;
    sK.phase = skWins("k") >= 2 ? "win" : "lose";
    if (sK.phase === "win") {
      api.sfx("item");
      // 勝てば、マトリョシカが荷札をくれる
      api.giveItem("荷札");
      api.show("v_nifuda", () => api.warp("print", "front"));
    } else {
      // 負けたら、路地へ追い出される(D630)
      api.cut("alley", "printer");
      api.knock(0, 520);
      api.shake(0.3, 3);
      api.sfx("knock");
      api.bubble("printer", "ポイッ！", 1400); // 仮
    }
  }
};

// 絵: 木の作業台、お手本の荷札、2 本の植字のステッキ(きーとマトリョシカ)、活字の棚
const skFont = (px) =>
  `${px}px ${document.fonts && document.fonts.check(`${px}px DotGothic16`) ? '"DotGothic16", ' : ""}"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif`;
// 活字 1 本(上から見た金属の角柱。字は左右が逆)
const skPiece = (ctx, x, y, s, ch, dim) => {
  ctx.fillStyle = "#4a4a50";
  ctx.fillRect(x, y, s, s);
  ctx.fillStyle = dim ? "#6a6a70" : "#a8a6a0";
  ctx.fillRect(x + 1, y + 1, s - 3, s - 3);
  ctx.fillStyle = dim ? "#5a5a60" : "#8c8a86";
  ctx.fillRect(x + 3, y + 3, s - 7, s - 7);
  ctx.save();
  ctx.translate(Math.round(x + s / 2 - 1), Math.round(y + s / 2));
  ctx.scale(-1, 1);
  ctx.fillStyle = dim ? "#3e3e44" : "#1e1e24";
  ctx.font = skFont(Math.round(s * 0.62 / 8) * 8 || 16);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ch, 0, 1);
  ctx.restore();
};
const skCellXY = (i, ox, oy) => [ox + 44 + (i % SK_COLS) * 50, oy + 166 + Math.floor(i / SK_COLS) * 52];
const skDrawScore = (ctx, ox, oy) => {
  // 勝ち負け(3 回戦 D635): 右上に 3 つの丸。きーの勝ちは白い ○、マトリョシカの勝ちは赤い ●、まだの回は点線
  for (let i = 0; i < 3; i++) {
    const cx = ox + 386 + i * 26;
    const cy = oy + 13;
    const r = sK.results[i];
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    if (r === "m") {
      ctx.fillStyle = "#d8342c"; // マトリョシカの赤
      ctx.fill();
    } else if (r === "k") {
      ctx.strokeStyle = "#efe3c4";
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#6a5a4a";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
};
const skDraw = (ctx, ox, oy, api) => {
  const t = sK.t;
  // 作業台
  ctx.fillStyle = "#2b1d14";
  ctx.fillRect(ox, oy, 15 * T, 9 * T);
  ctx.fillStyle = "#33231a";
  for (let y = 0; y < 9 * T; y += 24) ctx.fillRect(ox, oy + y, 15 * T, 2);
  // お手本の荷札(字はふつうの向き。次に拾う字に赤い枠)
  ctx.fillStyle = "#d9c9a2";
  ctx.fillRect(ox + 24, oy + 22, 176, 112);
  ctx.fillStyle = "#efe3c4";
  ctx.fillRect(ox + 26, oy + 24, 172, 108);
  ctx.fillStyle = "#2b1d14";
  ctx.beginPath();
  ctx.arc(ox + 42, oy + 40, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = skFont(32);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  sK.word.forEach((ch, i) => {
    const cx = ox + 112 + (i - (sK.word.length - 1) / 2) * 38;
    const cy = oy + 84;
    ctx.fillStyle = i < sK.ki ? "#a89a80" : "#1e1a18";
    ctx.fillText(ch, cx, cy);
    if (i === sK.ki && sK.phase === "race" && Math.floor(t * 3) % 3) {
      ctx.strokeStyle = "#c8322a";
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 18, cy - 19, 36, 38);
    }
  });
  // 植字のステッキ 2 本(上がきー、下がマトリョシカ)
  const stick = (y, n, face) => {
    ctx.fillStyle = "#5c5a58";
    ctx.fillRect(ox + 250, oy + y, 206, 44);
    ctx.fillStyle = "#3a3836";
    ctx.fillRect(ox + 254, oy + y + 4, 198, 36);
    // 活字は左右が逆なので、右から左へ詰める。左から並べると、刷ったときに「用無地天」になる(11-06、作者)
    for (let i = 0; i < n; i++) skPiece(ctx, ox + 258 + (sK.word.length - 1 - i) * 48, oy + y + 6, 32, sK.word[i]);
    face(ox + 222, oy + y + 40);
  };
  stick(26, sK.ki, (x, y) => {
    const ki = api.image("ki");
    if (ki) ctx.drawImage(ki, 0, 0, 64, 64, x - 32, y - 49, 64, 64);
  });
  stick(86, sK.m, (x, y) => {
    const m = api.image("matryo");
    if (m) ctx.drawImage(m, Math.round(x - m.width / 2), Math.round(y - m.height));
  });
  // 活字の棚
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(ox + 32, oy + 154, 416, 120);
  ctx.fillStyle = "#24160e";
  ctx.fillRect(ox + 36, oy + 158, 408, 112);
  sK.cells.forEach((ch, i) => {
    const [x, y] = skCellXY(i, ox, oy);
    const taken = (sK.word.indexOf(ch) >= 0 && sK.word.indexOf(ch) < sK.ki) || false;
    skPiece(ctx, x, y, 40, ch, taken);
  });
  // マトリョシカの手(棚の上を動く小さな姿)
  const m = api.image("matryo");
  if (m && sK.m < sK.word.length && (sK.phase === "demo" || sK.phase === "race")) {
    // 桃色の枠でねらう活字を示し、小さな姿は枠の左上のすみに乗る(活字を隠さない)
    const [mx, my] = [Math.round(ox + sK.mx), Math.round(oy + sK.my)];
    ctx.strokeStyle = "#e86a9a";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(mx - 2, my - 2, 44, 44);
    ctx.setLineDash([]);
    ctx.drawImage(m, 0, 0, m.width, m.height, mx - 12, Math.round(my - 18 + Math.sin(t * 8)), Math.round(m.width * 0.6), Math.round(m.height * 0.6));
  }
  // きーの手(黄色い枠)。まちがえたあとは赤くふるえる
  if (sK.phase === "race") {
    const stunned = t - sK.stunT < SK.stun;
    const [x, y] = skCellXY(sK.cur, ox, oy);
    const jx = stunned ? Math.round(Math.sin(t * 60) * 2) : 0;
    ctx.strokeStyle = stunned ? "#e04030" : Math.floor(t * 4) % 2 ? "#ffd84a" : "#fff0a0";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 3 + jx, y - 3, 46, 46);
  }
  skDrawScore(ctx, ox, oy);
  // 1 回が終わったあとは、棚を少し暗く
  if (sK.phase === "round" || sK.phase === "win" || sK.phase === "lose") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(ox + 32, oy + 154, 416, 120);
  }
};

const S_KATSUJI = {
  tile: T,
  bg: "#2b1d14",
  hidePlayer: true,
  map: kGrid(15, 9, () => false),
  legend: K_LEGEND,
  spawns: { view: { x: 7 * T, y: 4 * T, facing: "north" } },
  objects: [],
  triggers: [],
  onEnter() {
    skStart();
  },
  debug: () => sK,
  onA(api) {
    if (sK.phase !== "race" || sK.t - sK.stunT < SK.stun) return true;
    if (sK.cells[sK.cur] === sK.word[sK.ki]) {
      sK.ki++;
      api.sfx("ok");
      if (sK.ki >= sK.word.length) skEnd(api, "k");
    } else {
      sK.stunT = sK.t;
      api.sfx("back");
    }
    return true;
  },
  // B で勝負をやめて、店の中へ戻る
  onB(api) {
    if (sK.phase === "demo" || sK.phase === "race") {
      sK.phase = "idle";
      api.warp("print", "front");
    }
    return true;
  },
  input(api, dt, inp) {
    if (sK.phase === "race" && sK.t - sK.stunT >= SK.stun) {
      const c = sK.cur % SK_COLS;
      const r = Math.floor(sK.cur / SK_COLS);
      let nc = c;
      let nr = r;
      if (inp.x < -0.5 && sK.lastX >= -0.5) nc = (c + SK_COLS - 1) % SK_COLS;
      if (inp.x > 0.5 && sK.lastX <= 0.5) nc = (c + 1) % SK_COLS;
      if (inp.y < -0.5 && sK.lastY >= -0.5) nr = (r + SK_ROWS - 1) % SK_ROWS;
      if (inp.y > 0.5 && sK.lastY <= 0.5) nr = (r + 1) % SK_ROWS;
      if (nc !== c || nr !== r) {
        sK.cur = nr * SK_COLS + nc;
        api.sfx("cursor");
      }
    }
    sK.lastX = inp.x;
    sK.lastY = inp.y;
    api.place(7 * T, 4 * T);
    skTick(api, dt);
  },
  drawGround(ctx, ox, oy, img, api) {
    skDraw(ctx, ox, oy, api);
  },
};
