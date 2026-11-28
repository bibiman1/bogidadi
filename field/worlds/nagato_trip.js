// 幻覚の世界(todo 369、D847〜D854)。秋の湖ぞいの道(akiWind)のかえでの根もとの松茸を食べると、トリップに入る。
// - 上から見た画面はけばけばしくなる(色の濃さ、色相の回り、色数の減り、道の外のマスの入れかわり。D853)。きー、来訪神、非常口はふだんの色のまま
// - 道のはしが反対のはしにつながる(非ユークリッド)。来訪神がきーより少し遅く追う。逃げる非常口の走る人に追いつくと、白く飛んで目がさめる
// - 来訪神につかまった瞬間だけ、きーの主観(D849)。世界を小さな四角に切って明るさの順で並べかえ、次の像を組み立てる(D850)。3 段目のモビールのあとも目がさめる
// 仕様は docs/record/2026-11-28/trip/spec.md、試し絵は同じフォルダの mock/(来訪神・看板・松茸の形)と anim2.py(主観)。PixelLab 0 回(D852)。
// 字も音もなし。見届けの条件にしない(D674 の寄り道)。テスト: 長門のフラグ tripD1〜3(その段のトリップから)、tripP1〜3(その段の主観から)
(function () {
  const NG = window.BOGI_WORLDS.nagato;
  const M = NG.maps.akiWind;
  const PICS = ["kinoko", "heitai", "iss", "jupiter", "moon", "kimokei", "usagi", "niwatori", "kao", "bento", "cake", "candle", "mobile"];
  PICS.forEach((n) => (NG.images[`trip_${n}`] = `trip/trip_${n}.jpg`)); // 監督の写真の切り抜き(D851)と、NASA の公有の写真(出典はスタッフロール)

  const KI_SPEED = 150;
  const GOD_SPEED = 110; // きーより少し遅い
  const STEP = 0.14;
  const MISS_SEC = 2.2; // はずれの色のゆらぎ(D857) // 色相が回る、来訪神のかけらが入れかわる拍子(試し絵の 1 こま)
  // 深さ(つかまった回数 + 1)ごとの、上から見た画面の色(garish.py と同じ数)
  const SAT = [1, 2.2, 3.0, 3.6];
  const HUE = [0, 25, 45, 70]; // 1 拍子あたりの色相の回り(度)
  const POST = [0, 0, 0xfff0f0f0, 0xffe0e0e0]; // 色数を減らす(4 ビット、3 ビット)
  const SHUF = [0, 0, 0.06, 0.18]; // 道の外のマスの入れかわる割合(D853)
  const MATSU_XY = [60, 632]; // 道に近いかえで(43, 606)の、道の側の根もと。試し絵の位置 (302, 561) は道から 90 ドット離れていて、歩いて届かなかった
  const SIGN_XY = [340, 406]; // 非常口の看板(道の上手、右の路肩)

  // ---- 道の中心線(WIND_PX)にそった、道のりと横のずれ ----
  const PTS = WIND_PX;
  const CUM = [0];
  for (let i = 1; i < PTS.length; i++) CUM.push(CUM[i - 1] + Math.hypot(PTS[i][0] - PTS[i - 1][0], PTS[i][1] - PTS[i - 1][1]));
  function proj(x, y) {
    let best = { d: Infinity, s: 0, lat: 0 };
    for (let i = 0; i < PTS.length - 1; i++) {
      const [ax, ay] = PTS[i];
      const dx = PTS[i + 1][0] - ax;
      const dy = PTS[i + 1][1] - ay;
      const l2 = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
      const qx = ax + dx * u;
      const qy = ay + dy * u;
      const d = Math.hypot(x - qx, y - qy);
      if (d < best.d) {
        const l = Math.sqrt(l2);
        best = { d, s: CUM[i] + u * l, lat: (dx * (y - ay) - dy * (x - ax)) / l };
      }
    }
    return best;
  }
  function at(s, lat) {
    s = wrapS(s);
    let lo = 0;
    let hi = CUM.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (CUM[m] <= s) lo = m;
      else hi = m;
    }
    const [ax, ay] = PTS[lo];
    const dx = PTS[hi][0] - ax;
    const dy = PTS[hi][1] - ay;
    const l = Math.hypot(dx, dy) || 1;
    const u = (s - CUM[lo]) / l;
    return [ax + dx * u - (dy / l) * lat, ay + dy * u + (dx / l) * lat];
  }
  // 道のはしからはしまで(きーの出る所。長門へ ↔ 秋の湖畔へ)を、輪にする
  const S0 = proj(M.spawns.top.x, M.spawns.top.y).s;
  const S1 = proj(M.spawns.bottom.x, M.spawns.bottom.y).s;
  const LOOP = S1 - S0;
  const wrapS = (s) => S0 + ((((s - S0) % LOOP) + LOOP) % LOOP);
  const loopD = (a, b) => {
    let d = b - a;
    d -= LOOP * Math.round(d / LOOP);
    return d;
  };
  // 道の外か(マスの入れかわりは道の外だけ D853)。8 ドットの升目で一度だけ測る
  const OFF = (() => {
    const cols = Math.ceil((WIND_COLS * T) / 8);
    const rows = Math.ceil((WIND_ROWS * T) / 8);
    const a = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) a[r * cols + c] = proj(c * 8 + 4, r * 8 + 4).d > ROAD_WIDTH * T + 16 ? 1 : 0;
    return { a, cols, rows };
  })();
  const offroad = (x, y) => {
    const c = Math.floor(x / 8);
    const r = Math.floor(y / 8);
    if (c < 0 || r < 0 || c >= OFF.cols || r >= OFF.rows) return true;
    return !!OFF.a[r * OFF.cols + c];
  };

  // ---- 手で描く絵(mock.py と同じ形) ----
  const canvas = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };
  function grid(rows, pal, scale = 1) {
    const w = Math.max(...rows.map((r) => r.length));
    const c = canvas(w * scale, rows.length * scale);
    const g = c.getContext("2d");
    rows.forEach((r, y) =>
      [...r].forEach((ch, x) => {
        if (!pal[ch]) return;
        g.fillStyle = pal[ch];
        g.fillRect(x * scale, y * scale, scale, scale);
      })
    );
    return c;
  }
  const SIGN = [
    "KKKKKKKKKKKKKKKKKKKKKK",
    "KGGGGGGGGGGGGGGGGGGGGK",
    "KGWWWWWGGGGGGGGWWGGGGK",
    "KGWGGGWGGGGGGGGWWGGGGK",
    "KGWGGGWGGGGGWWWWGGGGGK",
    "KGWGGGWGGGGWGWWWWGGGGK",
    "KGWGGGWGGGGGGWWGGWGGGK",
    "KGWGGGWGGGGGWWGWGGGGGK",
    "KGWGGGWGGGGWGGGGWGGGGK",
    "KGWWWWWGGGWGGGGGGWGGGK",
    "KGGGGGGGGGGGGGGGGGGGGK",
    "KKKKKKKKKKKKKKKKKKKKKK",
    "..........PP..........",
    "..........PP..........",
    "..........PP..........",
    "..........PP..........",
    "..........PP..........",
  ];
  const SPAL = { K: "rgb(20,40,28)", G: "rgb(0,150,70)", W: "rgb(245,250,245)", P: "rgb(120,124,130)" };
  const signFull = grid(SIGN, SPAL);
  const signEmpty = grid(SIGN.map((r) => r.slice(0, 9) + [...r.slice(9, 21)].map((c) => (c === "W" ? "G" : c)).join("") + r.slice(21)), SPAL); // 走る人が抜けたあと(戸口だけ)
  const RUN = [
    ".....KKK..",
    "....KGGGK.",
    "....KGGGK.",
    "..KKKKGKK.",
    ".KGGGGGGGK",
    "KGKGGGGKGK",
    ".K.KGGGK.K",
    "...KGGGK..",
    "..KGGKGGK.",
    ".KGGK.KGGK",
    "KGGK...KGK",
    "KKK.....KK",
  ];
  const run1 = grid(RUN, { K: SPAL.K, G: SPAL.G });
  const runner = canvas(15, 18); // きーの半分ほど(1.5 倍)
  (() => {
    const g = runner.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(run1, 0, 0, 15, 18);
  })();
  const runBig = grid(RUN, { K: SPAL.K, G: "rgb(0,130,60)" }, 4); // 主観の画面を横切る走る人
  const matsu = grid(
    [
      "....KKKK....",
      "..KKCCCCKK..",
      ".KCCDDDDCCK.",
      "KCDDDDDDDDCK",
      "KCCCCCCCCCCK",
      ".KKSSSSSSKK.",
      "...KSSSSK...",
      "...KSSSTK...",
      "...KSSSTK...",
      "...KSSSTK...",
      "..KSSSSSTK..",
      "..KSSSSSTK..",
      "...KKKKKK...",
    ],
    { K: "rgb(50,32,20)", C: "rgb(120,78,46)", D: "rgb(156,108,66)", S: "rgb(232,222,200)", T: "rgb(196,182,160)" }
  );
  // 来訪神の影の形(背の高いわらの塊、上に羽が立つ。特定の仮面は写さない)。# = 中身、o = 目の穴(2 × 2 マス、真っ黒 D854)
  const SHAPE = [
    "...#.....#....#...",
    "...#..#..#...#....",
    "....#.#..#..#.....",
    "....#.#.##.#......",
    ".....######.......",
    "....########......",
    "...##########.....",
    "...##oo##oo##.....",
    "...##oo##oo##.....",
    "..############....",
    "..############....",
    ".##############...",
    ".##############...",
    "################..",
    "################..",
    ".##############...",
    "################..",
    "################..",
    ".################.",
    "##################",
    "##################",
    ".################.",
    "##################",
    "#.##.###.###.##.#.",
    "..#...#...#...#...",
  ];
  // 種の決まった乱数(こまごとに同じ並びを出す)
  const rng = (seed) => {
    let a = seed >>> 0 || 1;
    return () => {
      a ^= a << 13;
      a ^= a >>> 17;
      a ^= a << 5;
      return (a >>> 0) / 4294967296;
    };
  };
  // 来訪神: 秋の画面ぜんぶから 2 × 2 のかけらを集め、明るい順に上から詰める(D850。道だけから取ると道に溶けた)
  function makeGod(snap, seed) {
    const R = rng(seed * 7919 + 13);
    const w = SHAPE[0].length;
    const h = SHAPE.length;
    const c = canvas(w * 2, h * 2);
    const g = c.getContext("2d");
    const out = g.createImageData(w * 2, h * 2);
    const src = snap.data;
    const SW = snap.width;
    const SH = snap.height;
    const patches = [];
    for (let i = 0; i < w * h; i++) {
      const x = Math.floor(R() * (SW - 2));
      const y = Math.floor(R() * (SH - 2));
      let l = 0;
      const px = [];
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const k = ((y + dy) * SW + x + dx) * 4;
        px.push([src[k], src[k + 1], src[k + 2]]);
        l += src[k] + src[k + 1] + src[k + 2];
      }
      patches.push({ l, px });
    }
    patches.sort((a, b) => b.l - a.l);
    const cells = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (SHAPE[y][x] === "#") cells.push({ x, y, k: y + R() * 3 });
    cells.sort((a, b) => a.k - b.k || a.x - b.x);
    const put = (x, y, [r, gg, b]) => {
      const k = (y * w * 2 + x) * 4;
      out.data[k] = r;
      out.data[k + 1] = gg;
      out.data[k + 2] = b;
      out.data[k + 3] = 255;
    };
    cells.forEach((cl, i) => {
      const p = patches[i].px;
      put(cl.x * 2, cl.y * 2, p[0]);
      put(cl.x * 2 + 1, cl.y * 2, p[1]);
      put(cl.x * 2, cl.y * 2 + 1, p[2]);
      put(cl.x * 2 + 1, cl.y * 2 + 1, p[3]);
    });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (SHAPE[y][x] === "o") for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(x * 2 + dx, y * 2 + dy, [14, 10, 12]);
    // 縁取り(暗い 1 ドット)
    const W2 = w * 2;
    const H2 = h * 2;
    const a = (x, y) => x >= 0 && y >= 0 && x < W2 && y < H2 && out.data[(y * W2 + x) * 4 + 3];
    const edge = [];
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) if (!a(x, y) && (a(x + 1, y) || a(x - 1, y) || a(x, y + 1) || a(x, y - 1))) edge.push([x, y]);
    edge.forEach(([x, y]) => put(x, y, [30, 20, 24]));
    g.putImageData(out, 0, 0);
    return c;
  }

  // ---- 状態 ----
  let tS = null; // トリップ中だけ。{ level, time, t0, gods, run, pov, white, ... }
  let eat = null; // 食べている最中 { t, i, hit }
  let miss = null; // はずれを食べたあとの、短い色のゆらぎ { t }(D857)
  // キノコは 3 本。当たりは 1 本で、生え直すたびにくじ(D856、D857)
  const shroom = { hit: 0, eaten: [false, false, false] };
  const regrow = () => {
    shroom.hit = Math.floor(Math.random() * 3);
    shroom.eaten = [false, false, false];
  };
  regrow();
  let gods = []; // 来訪神の絵(3 とおり)
  let cv = null; // ゲームの画面(主観の材料を撮る)
  const kiCap = { a: null, b: null, box: null, layer: canvas(1, 1) };
  let tmp = null;
  let tmp2 = null;

  function startTrip(level, api) {
    const p = api.player();
    const ps = proj(p.x, p.y).s;
    tS = { level, time: 0, gods: [], run: { state: "in", s: proj(SIGN_XY[0], SIGN_XY[1] + 4).s, lat: 30, t: 0, face: 1 }, pov: null, white: null, snapAt: 0 };
    const n = level >= 3 ? 3 : 2;
    for (let i = 0; i < n; i++) tS.gods.push({ s: wrapS(ps + (i === 2 ? LOOP / 2 : i ? 240 : -240)), lat: 0, v: i });
    gods = [];
  }
  function endTrip() {
    tS = null;
    eat = null;
    miss = null;
    regrow();
  }
  // 目がさめる: キノコの前(道の路肩)。白はゆっくり引く
  function wake(api) {
    const pm = proj(MATSU_XY[0], MATSU_XY[1]);
    const [x, y] = at(pm.s, Math.sign(pm.lat) * 34);
    api.place(x, y);
    api.face("east");
    api.freeze(0);
    endTrip();
    api.flash(1.6);
  }

  // ---- 主観(D849、D850) ----
  const PW = 480;
  const PH = 300;
  const PS = 10; // かけらの大きさ
  const GW = PW / PS;
  const GH = PH / PS;
  const N = GW * GH;
  const pc = canvas(PW, PH);
  const pg = pc.getContext("2d", { willReadFrequently: true });
  const noiseC = canvas(PW / 4, PH / 4);
  const strip = canvas(PW, 12);
  const lumCache = new Map();
  function lumOf(c) {
    const d = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, PW, PH).data;
    const L = new Float32Array(N);
    for (let y = 0; y < PH; y++)
      for (let x = 0; x < PW; x++) {
        const k = (y * PW + x) * 4;
        L[Math.floor(y / PS) * GW + Math.floor(x / PS)] += d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11;
      }
    return L;
  }
  function picture(key, api) {
    if (typeof key !== "string") return key;
    if (lumCache.has(key)) return lumCache.get(key).c;
    const c = canvas(PW, PH);
    const g = c.getContext("2d", { willReadFrequently: true });
    g.fillStyle = "#000";
    g.fillRect(0, 0, PW, PH);
    const im = api.image(`trip_${key}`);
    if (!im) return c; // 読めていなければ黒(覚えない)
    g.drawImage(im, 0, 0, PW, PH);
    lumCache.set(key, { c, L: lumOf(c) });
    return c;
  }
  const lumPic = (key, c) => (typeof key === "string" && lumCache.has(key) ? lumCache.get(key).L : lumOf(c));
  const copyOf = (c) => {
    const d = canvas(c.width, c.height);
    d.getContext("2d").drawImage(c, 0, 0);
    return d;
  };
  const ease = (t) => t * t * (3 - 2 * t);
  const cellX = (i) => (i % GW) * PS;
  const cellY = (i) => Math.floor(i / GW) * PS;

  // 段ごとの並び(D851)。sec は 1 枚ごとの (飛ぶ, 浮かぶ) 秒。深いほど速く乗りかわる
  const DEPTHS = {
    1: { seq: ["kinoko", "heitai"], fly: 0.75, em: 0.45 },
    2: { seq: ["iss", "jupiter", "moon"], fly: 1.2, em: 0.7 },
    3: { seq: ["kimokei", "usagi", "niwatori", "kao", "bento", "cake", "candle"], fly: 1.0, em: 0.6 },
  };
  function povStart(depth, api) {
    const R = canvas(PW, PH);
    if (cv) R.getContext("2d").drawImage(cv, 0, 0, PW, PH); // つかまった所の画面(けばけばしいまま)
    pg.globalAlpha = 1;
    pg.drawImage(R, 0, 0); // 最初は、この画面のかけらが飛ぶ
    const V = canvas(PW, PH);
    const vg = V.getContext("2d");
    vg.fillStyle = "rgb(6,4,4)";
    vg.fillRect(0, 0, PW, PH);
    if (gods[0]) {
      vg.imageSmoothingEnabled = false;
      vg.drawImage(gods[0], PW / 2 - 90, 20, 180, 250);
    }
    const D = DEPTHS[depth];
    const steps = [];
    const seq = D.seq;
    steps.push({ k: "fly", to: V, dur: 0.9 });
    steps.push({ k: "em", to: V, dur: 0.45, upto: 0.7, ghost: seq[0] });
    seq.forEach((key, i) => {
      const deep = depth === 3 ? i / seq.length : 0;
      const next = seq[i + 1] || (depth === 3 ? "mobile" : R);
      steps.push({ k: "fly", to: key, dur: D.fly * (1 - 0.35 * deep), stuck: key === "moon" });
      steps.push({ k: "em", to: key, dur: D.em * (1 - 0.3 * deep), upto: 0.75 - 0.25 * deep, ghost: next });
    });
    if (depth === 3) {
      steps.push({ k: "fly", to: "mobile", dur: 2.0 });
      steps.push({ k: "em", to: "mobile", dur: 1.3, upto: 1 });
      steps.push({ k: "hold", to: "mobile", dur: 0.8 });
      steps.push({ k: "hold", to: "mobile", dur: 1.4, cross: true }); // 非常口の走る人が横切る(ここだけ定まる)
      steps.push({ k: "white", dur: 0.5 });
    } else {
      steps.push({ k: "fly", to: R, dur: 0.7 });
      steps.push({ k: "em", to: R, dur: 0.3, upto: 1 });
    }
    let total = 0;
    steps.forEach((s) => {
      s.at = total;
      total += s.dur;
    });
    // 主観の途中で、非常口の走る人が一度横切る(触れない。D850)
    const cross = depth === 3 ? null : total * 0.45;
    tS.pov = { depth, t0: tS.time, steps, total, i: -1, R, cross, rnd: rng(depth * 101 + tS.level) };
    api.freeze(999);
  }
  function povEnd(api) {
    const pov = tS.pov;
    tS.pov = null;
    if (pov.depth >= 3) return wake(api);
    api.freeze(0);
    tS.level = pov.depth + 1;
    tS.time = Math.max(tS.time, 0);
    const p = api.player();
    const ps = proj(p.x, p.y).s;
    // つかまえた来訪神は、少しはなれた所に置き直す。近すぎるほかの来訪神も
    tS.gods.forEach((g, i) => {
      const d = loopD(ps, g.s);
      if (Math.abs(d) < 200) g.s = wrapS(ps + (d >= 0 ? 1 : -1) * (260 + i * 40));
    });
    if (tS.level >= 3 && tS.gods.length < 3) tS.gods.push({ s: wrapS(ps + LOOP / 2), lat: 0, v: 2 }); // 3 回目の前は 3 体
    tS.caughtAt = tS.time;
  }
  function stepInit(st, prev, api) {
    if (st.k === "fly") {
      const src = copyOf(pc);
      const tgt = picture(st.to, api);
      const LS = lumOf(src);
      const LT = lumPic(st.to, tgt);
      const R = tS.pov.rnd;
      const os = [...Array(N).keys()].map((i) => [LS[i] + (R() - 0.5) * 40, i]).sort((a, b) => a[0] - b[0]);
      const ot = [...Array(N).keys()].sort((a, b) => LT[a] - LT[b]);
      const perm = new Int32Array(N);
      ot.forEach((cell, j) => (perm[cell] = os[j][1]));
      const delay = new Float32Array(N);
      const sw = new Float32Array(N * 2);
      const dmax = Math.hypot(PW / 2, PH / 2);
      for (let i = 0; i < N; i++) {
        delay[i] = (Math.hypot(cellX(i) - PW / 2, cellY(i) - PH / 2) / dmax) * 0.45 + R() * 0.15;
        sw[i * 2] = (R() + R() + R() - 1.5) * 55;
        sw[i * 2 + 1] = (R() + R() + R() - 1.5) * 55;
      }
      const order = [...Array(N).keys()].sort(() => R() - 0.5);
      Object.assign(st, { src, perm, delay, sw, order });
      if (st.stuck) {
        // 言いよどみ: いちばん明るいかけらが、まわりを食って増える(月の段)
        let seed = 0;
        for (let i = 1; i < N; i++) if (LS[perm[i]] > LS[perm[seed]]) seed = i;
        st.seed = seed;
        st.stuckCells = [...Array(N).keys()].sort((a, b) => Math.hypot(cellX(a) - cellX(seed), cellY(a) - cellY(seed)) - Math.hypot(cellX(b) - cellX(seed), cellY(b) - cellY(seed)));
      }
    } else if (st.k === "em") {
      if (prev && prev.k === "fly") drawFly(prev, 1);
      st.mosaic = copyOf(pc);
      st.tgt = picture(st.to, api);
      st.gh = st.ghost ? picture(st.ghost, api) : null;
    } else if (st.k === "hold") {
      st.tgt = picture(st.to, api);
    }
  }
  function drawFly(st, t) {
    pg.fillStyle = "#000";
    pg.fillRect(0, 0, PW, PH);
    const k = st.stuck ? Math.floor(N * 0.25 * t) : 0;
    const stuckSet = k ? new Set(st.stuckCells.slice(0, k)) : null;
    for (const i of st.order) {
      const tt = Math.max(0, Math.min(1, (t - st.delay[i]) / 0.55));
      const e = ease(tt);
      const wob = Math.sin(tt * Math.PI);
      const from = stuckSet && stuckSet.has(i) ? st.perm[st.seed] : st.perm[i];
      const sx = cellX(st.perm[i]);
      const sy = cellY(st.perm[i]);
      const x = sx * (1 - e) + cellX(i) * e + wob * st.sw[i * 2];
      const y = sy * (1 - e) + cellY(i) * e + wob * st.sw[i * 2 + 1];
      pg.drawImage(st.src, cellX(from), cellY(from), PS, PS, Math.round(x), Math.round(y), PS, PS);
    }
  }
  function drawEmerge(st, t, dt) {
    const a = st.upto * ease(t);
    pg.globalAlpha = 1;
    pg.drawImage(st.mosaic, 0, 0);
    pg.globalAlpha = a;
    pg.drawImage(st.tgt, 0, 0);
    // ノイズ(自信のなさ)。荒い升目で
    const ng = noiseC.getContext("2d");
    const id = ng.createImageData(noiseC.width, noiseC.height);
    const R = tS.pov.rnd;
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.max(0, Math.min(255, 128 + (R() + R() + R() - 1.5) * 150));
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
    ng.putImageData(id, 0, 0);
    pg.imageSmoothingEnabled = false;
    pg.globalAlpha = 0.35 * (1 - a);
    pg.drawImage(noiseC, 0, 0, PW, PH);
    if (st.gh && t > 0.5) {
      pg.globalAlpha = (t - 0.5) * 2 * 0.3; // 次の像が透けて混ざる
      pg.drawImage(st.gh, 0, 0);
    }
    pg.globalAlpha = 1;
    // こまごとに、一部の行が横へずれる
    if (st.upto < 1 && R() < 0.4 * Math.min(1, dt * 15)) {
      const y0 = Math.floor(R() * (PH - 20));
      const sg = strip.getContext("2d");
      sg.clearRect(0, 0, PW, 12);
      sg.drawImage(pc, 0, y0, PW, 12, 0, 0, PW, 12);
      pg.drawImage(strip, Math.round((R() - 0.5) * 60), y0);
    }
  }
  function drawPov(ctx, api, dt) {
    const pov = tS.pov;
    const e = tS.time - pov.t0;
    if (e >= pov.total) return povEnd(api);
    let i = pov.i < 0 ? 0 : pov.i;
    while (i < pov.steps.length - 1 && e >= pov.steps[i + 1].at) i++;
    while (pov.i < i) {
      pov.i++;
      stepInit(pov.steps[pov.i], pov.steps[pov.i - 1], api);
    }
    const st = pov.steps[pov.i];
    const t = Math.min(1, (e - st.at) / st.dur);
    if (st.k === "fly") drawFly(st, t);
    else if (st.k === "em") drawEmerge(st, t, dt);
    else if (st.k === "hold") pg.drawImage(st.tgt, 0, 0);
    // 非常口の走る人が横切る
    const ct = st.cross ? t : pov.cross != null ? (e - pov.cross) / 1.3 : -1;
    if (ct >= 0 && ct <= 1) {
      const x = Math.round(-50 + ct * (PW + 100));
      const y = Math.round(212 - Math.abs(Math.sin(ct * 14)) * 10);
      pg.drawImage(runBig, x, y);
    }
    const W = ctx.canvas.width / ctx.getTransform().a;
    const H = ctx.canvas.height / ctx.getTransform().d;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pc, 0, 0, W, H);
    if (st.k === "white") {
      ctx.fillStyle = `rgba(255, 252, 240, ${0.6 + 0.4 * t})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---- 上から見た画面をけばけばしく(D853) ----
  // トリップの段の色(D853)。はずれのときは、色相と濃さだけが短くゆらぐ(D857)
  function tripLook() {
    const lv = tS.level;
    const k = Math.min(1, tS.time / 1.5); // 食べたあと、少しずつずれる
    const step = Math.floor(tS.time / STEP);
    return { sat: 1 + (SAT[lv] - 1) * k, con: 1 + 0.25 * lv * k, hue: Math.round(((step * HUE[lv]) % 360) * k), post: POST[lv], shuf: SHUF[lv], step };
  }
  function missLook() {
    const e = Math.sin(Math.min(1, miss.t / MISS_SEC) * Math.PI); // ふくらんで、しぼむ
    return { sat: 1 + 1.3 * e, con: 1 + 0.15 * e, hue: Math.round(Math.sin(miss.t * 4) * 70 * e), post: 0, shuf: 0, step: 0 };
  }
  function garish(ctx, ox, oy, L) {
    const c = ctx.canvas;
    const Z = ctx.getTransform().a;
    if (!tmp || tmp.width !== c.width || tmp.height !== c.height) {
      tmp = canvas(c.width, c.height);
      tmp2 = canvas(c.width, c.height);
    }
    const step = L.step;
    if (kiCap.box) {
      // きーのあとに描かれた物(手前の木など)に隠れた所は、戻さない
      const b = kiCap.box;
      const F = ctx.getImageData(...b).data;
      const B = kiCap.B;
      const d = B.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] && Math.abs(d[i] - F[i]) + Math.abs(d[i + 1] - F[i + 1]) + Math.abs(d[i + 2] - F[i + 2]) > 6) d[i + 3] = 0;
      if (kiCap.layer.width !== b[2] || kiCap.layer.height !== b[3]) {
        kiCap.layer.width = b[2];
        kiCap.layer.height = b[3];
      }
      kiCap.layer.getContext("2d").putImageData(B, 0, 0);
    }
    const g = tmp.getContext("2d", { willReadFrequently: true });
    g.filter = `saturate(${L.sat}) contrast(${L.con}) hue-rotate(${L.hue}deg)`;
    g.drawImage(c, 0, 0);
    g.filter = "none";
    if (L.post) {
      const id = g.getImageData(0, 0, c.width, c.height);
      const u = new Uint32Array(id.data.buffer);
      const m = L.post;
      for (let i = 0; i < u.length; i++) u[i] &= m;
      g.putImageData(id, 0, 0);
    }
    if (L.shuf) {
      // 道の外(木と草)のマスが、ときどき入れかわる。道の形は残す
      const g2 = tmp2.getContext("2d");
      g2.drawImage(tmp, 0, 0);
      const C = 16;
      const W = c.width / Z;
      const H = c.height / Z;
      const cells = [];
      for (let y = 0; y < H; y += C) for (let x = 0; x < W; x += C) if (offroad(x - ox + C / 2, y - oy + C / 2) && offroad(x - ox, y - oy) && offroad(x - ox + C, y - oy + C)) cells.push([x, y]);
      const R = rng(step + 1);
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(R() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }
      const n = Math.floor(cells.length * L.shuf);
      const src = cells.slice(0, n);
      const dst = src.slice(1).concat(src.slice(0, 1));
      for (let i = 0; i < n; i++) g.drawImage(tmp2, src[i][0] * Z, src[i][1] * Z, C * Z, C * Z, dst[i][0] * Z, dst[i][1] * Z, C * Z, C * Z);
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(tmp, 0, 0);
    if (kiCap.box) ctx.drawImage(kiCap.layer, kiCap.box[0], kiCap.box[1]); // きーはふだんの色(ドット絵がきーの現実)
    ctx.restore();
    kiCap.box = null;
  }
  // 来訪神、看板、走る人は、ずれた世界の上にふだんの色で浮く
  function drawFigures(ctx, ox, oy) {
    const step = Math.floor(tS.time / STEP);
    const list = [];
    const show = Math.min(1, Math.max(0, (tS.time - 0.6) / 0.6)); // 来訪神は、色がずれはじめてから立つ
    if (show > 0 && gods.length)
      tS.gods.forEach((g) => {
        const [x, y] = at(g.s, g.lat);
        list.push({ y, f: () => {
          ctx.fillStyle = "rgba(0,0,0,0.28)";
          ctx.beginPath();
          ctx.ellipse(Math.round(x + ox), Math.round(y + oy), 13, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = show;
          ctx.drawImage(gods[(step + g.v) % gods.length], Math.round(x + ox - 18), Math.round(y + oy - 50));
          ctx.globalAlpha = 1;
        } });
      });
    const r = tS.run;
    list.push({ y: SIGN_XY[1], f: () => ctx.drawImage(r.state === "in" ? signFull : signEmpty, Math.round(SIGN_XY[0] + ox - 11), Math.round(SIGN_XY[1] + oy - 17)) });
    if (r.state !== "in") {
      const [x, y] = at(r.s, r.lat);
      list.push({ y, f: () => {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(Math.round(x + ox - 5), Math.round(y + oy - 1), 10, 2);
        const bob = r.pause > 0 ? 0 : Math.round(Math.abs(Math.sin(tS.time * 16)) * 2);
        ctx.save();
        ctx.translate(Math.round(x + ox), Math.round(y + oy - 18 - bob));
        if (r.face < 0) ctx.scale(-1, 1);
        ctx.drawImage(runner, -8, 0);
        ctx.restore();
      } });
    }
    list.sort((a, b) => a.y - b.y).forEach((d) => d.f());
  }

  // ---- きーだけを抜き出す(きーを描く前と後の画面を比べる) ----
  const KB = [-26, -56, 52, 64]; // 足もとからの箱(ドット)
  function kiBox(ctx, sx, sy) {
    const Z = ctx.getTransform().a;
    const x = Math.max(0, Math.round((sx + KB[0]) * Z));
    const y = Math.max(0, Math.round((sy + KB[1]) * Z));
    const w = Math.min(ctx.canvas.width - x, Math.round(KB[2] * Z));
    const h = Math.min(ctx.canvas.height - y, Math.round(KB[3] * Z));
    return w > 0 && h > 0 ? [x, y, w, h] : null;
  }
  const tripTopDown = () => (tS && !tS.pov && !tS.white) || !!miss;
  const KI_A = {
    id: "tripKiA",
    x: 0,
    y: 0,
    hidden(api) {
      const p = api.player();
      KI_A.x = p.x;
      KI_A.y = p.y - 0.01;
      return !tripTopDown();
    },
    draw(ctx, sx, sy) {
      const b = kiBox(ctx, sx, sy);
      kiCap.a = b ? ctx.getImageData(...b) : null;
      kiCap.abox = b;
    },
  };
  const KI_B = {
    id: "tripKiB",
    x: 0,
    y: 0,
    hidden(api) {
      const p = api.player();
      KI_B.x = p.x;
      KI_B.y = p.y + 0.01;
      return !tripTopDown();
    },
    draw(ctx) {
      const b = kiCap.abox;
      if (!b || !kiCap.a) return;
      const B = ctx.getImageData(...b);
      const A = kiCap.a.data;
      const d = B.data;
      for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - A[i]) + Math.abs(d[i + 1] - A[i + 1]) + Math.abs(d[i + 2] - A[i + 2]) < 6) d[i + 3] = 0;
      kiCap.B = B;
      kiCap.box = b;
    },
  };

  // ---- 松茸 3 本(かえでの根もと)。当たりの 1 本だけがトリップに入る(D856)。目がさめるとまた生えている ----
  const SHROOMS = [MATSU_XY, [71, 617], [68, 647]];
  const MATSUS = SHROOMS.map(([mx, my], i) => ({
    id: `tripMatsu${i}`,
    x: mx,
    y: my,
    range: 58,
    hidden: () => !!tS || shroom.eaten[i] || !!(eat && eat.i === i && eat.t > 0.45),
    canInteract: () => !tS && !eat && !miss,
    interact(api) {
      const p = api.player();
      api.face(Math.abs(mx - p.x) > Math.abs(my - p.y) ? (mx > p.x ? "east" : "west") : my > p.y ? "south" : "north");
      api.freeze(1.2);
      api.dent(0.9); // しゃがんで食べる
      eat = { t: 0, i, hit: i === shroom.hit };
    },
    draw(ctx, sx, sy) {
      ctx.fillStyle = "rgba(0,0,0,0.27)";
      ctx.beginPath();
      ctx.ellipse(sx, sy - 1, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(matsu, sx - 6, sy - 13);
    },
  }));

  // ---- 中毒のぴー(D856、D857)。先にキノコを食べていて、色が回り続け、回る → 道を横切る → 真上を見上げて固まる、をくり返す ----
  const PI_S = proj(MATSU_XY[0], MATSU_XY[1]).s - 70; // キノコより少し道の上手
  const PI_SIDE = Math.sign(proj(MATSU_XY[0], MATSU_XY[1]).lat) || 1;
  const PI_PH = [["spin", 1.8], ["cross", 2.8], ["look", 2.4]];
  const piS = { t: 0, ph: 0, side: PI_SIDE, ang: 0, x: 0, y: 0, dir: 1 };
  const PI = {
    id: "tripPi",
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    headY: 26,
    update(dt) {
      piS.t += dt;
      const [ph, len] = PI_PH[piS.ph];
      if (piS.t > len) {
        piS.t = 0;
        piS.ph = (piS.ph + 1) % PI_PH.length;
        if (PI_PH[piS.ph][0] === "cross") piS.dir = -piS.side;
        if (ph === "cross") piS.side = -piS.side;
        piS.ang = 0;
      }
      const cur = PI_PH[piS.ph][0];
      const u = Math.min(1, piS.t / PI_PH[piS.ph][1]);
      let lat = piS.side * 30;
      let ds = 0;
      if (cur === "cross") {
        lat = piS.side * 30 * (1 - ease(u) * 2); // 反対の路肩へ
        ds = Math.sin(piS.t * 4.5) * 9; // ふらふら
      }
      if (cur === "spin") piS.ang += dt * 10;
      const [x, y] = at(PI_S + ds, lat);
      piS.vx = x - PI.x;
      PI.x = x;
      PI.y = y;
    },
    draw(ctx, sx, sy, t, api) {
      const pi = api.image("pi");
      if (!pi) return;
      const cur = PI_PH[piS.ph][0];
      const row = cur === "cross" ? (piS.vx >= 0 ? 2 : 3) : 0;
      const f = cur === "cross" ? Math.floor(t * 9) % 7 : 0;
      ctx.save();
      ctx.filter = `hue-rotate(${Math.round((t * 140) % 360)}deg) saturate(1.8)`; // 色が回り続ける
      if (cur === "spin") {
        ctx.translate(Math.round(sx), Math.round(sy - 10));
        ctx.rotate(piS.ang);
        ctx.translate(-Math.round(sx), -Math.round(sy - 10));
      }
      if (cur === "look") {
        // 真上を見上げて固まる: 少し伸び上がる(足もとはそのまま)
        const k = Math.min(1, piS.t / 0.25);
        ctx.translate(Math.round(sx), Math.round(sy));
        ctx.scale(1 - 0.06 * k, 1 + 0.14 * k);
        ctx.translate(-Math.round(sx), -Math.round(sy));
      }
      ctx.drawImage(pi, f * 64, row * 64, 64, 64, Math.round(sx - 32), Math.round(sy - 47), 64, 64);
      ctx.restore();
    },
  };

  // ---- 動き(毎こま) ----
  function update(dt, api) {
    if (miss) {
      miss.t += dt;
      if (miss.t > MISS_SEC) miss = null;
    }
    if (eat && !tS) {
      eat.t += dt;
      if (eat.t > 1.2) {
        const e = eat;
        eat = null;
        shroom.eaten[e.i] = true;
        if (e.hit) startTrip(1, api);
        else miss = { t: 0 }; // はずれ: 2 秒ほど色がゆらいで戻る(来訪神は出ない)
      }
      return;
    }
    if (!tS) return;
    tS.time += dt;
    if (tS.pov) return; // 主観の進みは描くほうで
    if (tS.white) {
      if (tS.time - tS.white > 0.5) wake(api);
      return;
    }
    if (tS.povAt != null && tS.time >= tS.povAt) {
      tS.povAt = null;
      povStart(tS.level, api);
      return;
    }
    const p = api.player();
    const pp = proj(p.x, p.y);
    const ps = pp.s;
    // 来訪神: 道ぞいに、きーへ(輪の近いほうから回ってくる)
    if (tS.time > 0.9 && tS.time - (tS.caughtAt || -9) > 0.8)
      for (const g of tS.gods) {
        const d = loopD(g.s, ps);
        g.s = wrapS(g.s + Math.sign(d) * Math.min(Math.abs(d), GOD_SPEED * dt));
        const dl = Math.max(-ROAD_WIDTH * T, Math.min(ROAD_WIDTH * T, pp.lat)) - g.lat; // 路肩まで寄る(道の外のきーにも届く)
        g.lat += Math.sign(dl) * Math.min(Math.abs(dl), 55 * dt);
        const [gx, gy] = at(g.s, g.lat);
        if (Math.hypot(gx - p.x, gy - p.y) < 18 && !tS.pov) {
          povStart(tS.level, api); // つかまった瞬間だけ、きーの主観(D849)
          return;
        }
      }
    // 非常口: 近づくと、看板から走る人が抜けて、道ぞいに逃げる。ときどき止まって振りかえる
    const r = tS.run;
    if (r.state === "in") {
      if (Math.hypot(SIGN_XY[0] - p.x, SIGN_XY[1] - p.y) < 80) {
        r.state = "out";
        r.t = 0;
        r.pause = 0;
      }
    } else {
      r.t += dt;
      const d = loopD(r.s, ps);
      if (r.pause > 0) {
        r.pause -= dt;
        r.face = Math.sign(d) || 1; // 振りかえる
      } else {
        const dir = -Math.sign(d) || 1;
        r.s = wrapS(r.s + dir * KI_SPEED * dt);
        r.face = dir;
        if (r.t > 2.2) {
          r.t = 0;
          r.pause = 0.7;
        }
      }
      r.lat += (Math.sin(tS.time * 1.7) * 26 - r.lat) * Math.min(1, dt * 2);
      const [rx, ry] = at(r.s, r.lat);
      if (Math.hypot(rx - p.x, ry - p.y) < 16) {
        tS.white = tS.time; // 追いついた: 白く飛ぶ
        api.freeze(999);
      }
    }
  }

  const CTL = {
    id: "tripCtl",
    x: -100,
    y: -100,
    hidden: () => true,
    update(dt, t, api) {
      update(dt, api);
    },
  };
  M.objects.push(...MATSUS, PI, KI_A, KI_B, CTL);

  // 来訪神の絵は、ふだんの色の画面から作る(トリップの最初のこま)
  const og = M.drawOverlay;
  let lastT = null;
  M.drawOverlay = function (ctx, ox, oy, t, api) {
    if (og) og.call(M, ctx, ox, oy, t, api);
    cv = ctx.canvas;
    const dt = lastT == null ? 0 : Math.min(0.1, Math.max(0, t - lastT));
    lastT = t;
    if (miss && !tS) return garish(ctx, ox, oy, missLook());
    if (!tS) return;
    if (!gods.length) {
      const Z = ctx.getTransform().a;
      const s = canvas(PW, PH);
      const sg = s.getContext("2d", { willReadFrequently: true });
      sg.drawImage(ctx.canvas, 0, 0, Math.round(ctx.canvas.width / Z), Math.round(ctx.canvas.height / Z), 0, 0, PW, PH);
      const snap = sg.getImageData(0, 0, PW, PH);
      gods = [1, 2, 3].map((sd) => makeGod(snap, sd + tS.level * 10));
    }
    if (tS.pov) {
      drawPov(ctx, api, dt);
      if (!tS || tS.pov) return; // 主観が終わったこまは、そのまま上から見た画面を描く
    }
    garish(ctx, ox, oy, tripLook());
    drawFigures(ctx, ox, oy);
    if (tS.white) {
      const W = ctx.canvas.width / ctx.getTransform().a;
      const H = ctx.canvas.height / ctx.getTransform().d;
      ctx.fillStyle = `rgba(255, 252, 240, ${Math.min(1, (tS.time - tS.white) / 0.45)})`;
      ctx.fillRect(0, 0, W, H);
    }
  };

  // 道のはしが反対のはしにつながる(トリップ中だけ)
  const toN = M.triggers.find((tr) => tr.id === "toNagato");
  const toL = M.triggers.find((tr) => tr.id === "toLake");
  toN.enabled = toL.enabled = () => !tS;
  M.triggers.push(
    { id: "tripLoopTop", x: toN.x, y: toN.y, w: toN.w, h: toN.h, enabled: () => !!tS, run: (api) => api.place(M.spawns.bottom.x, M.spawns.bottom.y) },
    { id: "tripLoopBottom", x: toL.x, y: toL.y, w: toL.w, h: toL.h, enabled: () => !!tS, run: (api) => api.place(M.spawns.top.x, M.spawns.top.y) }
  );

  NG.tripDebug = { state: () => tS, at, proj, shroom, miss: () => miss }; // テスト用(走る人や来訪神の位置を見る)

  // 入るたびに、トリップは終わっている。テストのフラグ(tripD1〜3、tripP1〜3)なら、その段から
  const oe = M.onEnter;
  M.onEnter = function (api) {
    if (oe) oe.call(M, api);
    endTrip();
    for (const n of [1, 2, 3]) {
      if (api.flag(`tripD${n}`)) startTrip(n, api);
      if (api.flag(`tripP${n}`)) {
        startTrip(n, api);
        tS.povAt = 0.8;
      }
    }
  };
})();
