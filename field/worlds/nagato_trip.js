// 幻覚の世界(todo 369、D847〜D854)。秋の湖ぞいの道(akiWind)のかえでの根もとの松茸を食べると、トリップに入る。
// - 上から見た画面はけばけばしくなる(色の濃さ、色相の回り、色数の減り、道の外のマスの入れかわり。D853)。来訪神と非常口だけはふだんの色のまま(きーとぴーもずれる D859)
// - 道のはしが反対のはしにつながる(非ユークリッド)。来訪神がきーより少し遅く追う。逃げる非常口の走る人に追いつくと、白く飛んで目がさめる
// - 来訪神につかまった瞬間だけ、きーの主観(D849)。段ごとに出かたと拍子が変わる(D867): 1 段目はかけらが明るさの順で飛んで次の像を組み立てる(D850)。
//   2 段目は渦。天体ははっきり、木星の穴は真円(D870)、月は爆散して欠け(円弧 D869)輪をまとう(D868)、ネオン街をきーがさまよう(D874)。
//   3 段目はもぐる。ぼぎがまねて書いた字(ニセひらがな 1 文字 D873、D875)→ 写真 → 字 …。次の像は丸くぼけて広がる(D871)。モビールのあと目がさめる。
//   試し絵は docs/record/2026-11-28/vision/(vision.py)、moon_burst/、usoji/
// 仕様は docs/record/2026-11-28/trip/spec.md、試し絵は同じフォルダの mock/(来訪神・看板・松茸の形)と anim2.py(主観)。PixelLab 0 回(D852)。
// 字も音もなし。見届けの条件にしない(D674 の寄り道)。テスト: 長門のフラグ tripD1〜3(その段のトリップから)、tripP1〜3(その段の主観から)
(function () {
  const NG = window.BOGI_WORLDS.nagato;
  const M = NG.maps.akiWind;
  const PICS = ["kinoko", "heitai", "iss", "jupiter", "moon", "neon", "kimokei", "usagi", "niwatori", "kao", "bento", "cake", "candle", "mobile"];
  PICS.forEach((n) => (NG.images[`trip_${n}`] = `trip/trip_${n}.jpg`)); // 監督の写真の切り抜き(D851)と、NASA の公有の写真(出典はスタッフロール)。neon は嘘字の繁華街(D874)
  NG.images.trip_nise = "trip/trip_nise.png"; // ぼぎがまねて書いた字(D875)。256 の升を 8 × 6

  const KI_SPEED = 150;
  const GOD_SPEED = 110; // きーより少し遅い
  const STEP = 0.14;
  const EAT_SEC = 2.0; // キノコを食べるあいだ(D865)
  const EAT_PICK = 0.3; // つまみ上げて、地面から消える
  const EAT_BITES = [0.75, 1.15, 1.55]; // かじる時刻(3 口)
  const MISS_SEC = 2.2; // はずれの色のゆらぎ(D857) // 色相が回る、来訪神のかけらが入れかわる拍子(試し絵の 1 こま)
  // 深さ(つかまった回数 + 1)ごとの、上から見た画面の色(garish.py と同じ数)
  const SAT = [1, 2.2, 3.0, 3.6];
  const HUE = [0, 25, 45, 70]; // 1 拍子あたりの色相の回り(度)
  const POST = [0, 0, 0xfff0f0f0, 0xffe0e0e0]; // 色数を減らす(4 ビット、3 ビット)
  const SHUF = [0, 0, 0.06, 0.18]; // 道の外のマスの入れかわる割合(D853)
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
  // キノコは 7 本。当たりは 2 本で、生え直すたびにくじ(D856、D857、D864)
  const N_SHROOM = 7;
  const shroom = { hits: [0, 1], eaten: Array(N_SHROOM).fill(false) };
  const regrow = () => {
    const a = Math.floor(Math.random() * N_SHROOM);
    const b = (a + 1 + Math.floor(Math.random() * (N_SHROOM - 1))) % N_SHROOM;
    shroom.hits = [a, b];
    shroom.eaten = Array(N_SHROOM).fill(false);
  };
  regrow();
  let gods = []; // 来訪神の絵(3 とおり)
  let cv = null; // ゲームの画面(主観の材料を撮る)
  let tmp = null;
  let tmp2 = null;

  // 当たりを食べたときは、じわじわ始まる(D863): 3 秒は何も起きない → 3〜6 秒は色がかすかに波打つ → 6〜10 秒で色が深さ 1 まで回る
  // → 10〜12 秒で来訪神がうっすら現れ、非常口の看板も出る → 12 秒で追いはじめる。テストのフラグで入ったときは、すぐ(ons 0)
  const ONSET = 12;
  function startTrip(level, api, ons = 0) {
    const p = api.player();
    const ps = proj(p.x, p.y).s;
    tS = { level, ons, time: 0, gods: [], run: { state: "in", s: proj(SIGN_XY[0], SIGN_XY[1] + 4).s, lat: 30, t: 0, face: 1 }, pov: null, white: null, snapAt: 0 };
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
  // 目がさめる所は、キノコを食べたときに立っていた所(歩ける所)。テストのフラグで入ったときは、キノコの前の道のまんなか寄り。
  // (11-28、キノコを移したあと、目がさめる所が道の外の歩けないマスになり、動けなくなった。監督「キノコ食うと動けなくなる」)
  let eatAt = null;
  function wake(api) {
    let x, y;
    if (eatAt) [x, y] = eatAt;
    else {
      const pm = proj(SHROOMS[0][0], SHROOMS[0][1]);
      [x, y] = at(pm.s, Math.sign(pm.lat) * 12);
    }
    api.place(x, y);
    api.face(SHROOMS[0][0] > x ? "east" : "west");
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

  // 段ごとの出かたと拍子(D867): 1 段目はかけらが飛ぶ(ゆっくり)、2 段目は渦(天体ははっきり、月の爆散、ネオン街)、3 段目はもぐる(ぼぎの字 1 文字 → 写真)
  const DEPTHS = {
    1: { seq: ["kinoko", "heitai"], fly: 1.4, em: 1.0 },
  };
  const D3 = ["kimokei", "usagi", "niwatori", "kao", "bento", "cake", "candle"];
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
    const steps = [];
    if (depth === 1) {
      const D = DEPTHS[1];
      const seq = D.seq;
      steps.push({ k: "fly", to: V, dur: 1.2 });
      steps.push({ k: "em", to: V, dur: 0.7, upto: 0.75, ghost: seq[0] });
      seq.forEach((key, i) => {
        steps.push({ k: "fly", to: key, dur: D.fly });
        steps.push({ k: "em", to: key, dur: D.em, upto: 0.75, ghost: seq[i + 1] || R });
      });
      steps.push({ k: "fly", to: R, dur: 1.1 });
      steps.push({ k: "em", to: R, dur: 0.5, upto: 1 });
    } else if (depth === 2) {
      // 渦に吸いこまれ、短く切りかわる。宇宙ステーションと木星ははっきり(D867)、木星の穴は真円(D870)。月は爆散(D868、D869)。ネオン街をきーがさまよう(D874)
      steps.push({ k: "swirl", from: R, to: V, dur: 0.7 });
      steps.push({ k: "clear", to: V, dur: 0.25, z1: 1 });
      steps.push({ k: "swirl", from: V, to: "iss", dur: 0.6 });
      steps.push({ k: "clear", to: "iss", dur: 1.1, z1: 1.06 });
      steps.push({ k: "swirl", from: "iss", to: "jupiter", dur: 0.5 });
      steps.push({ k: "clear", to: "jupiter", dur: 1.1, z1: 1.06 });
      steps.push({ k: "swirl", from: "jupiter", to: "moon", dur: 0.5 });
      steps.push({ k: "burst", dur: BURST_SEC });
      steps.push({ k: "swirl", from: "prev", to: "neon", dur: 0.6 });
      steps.push({ k: "neon", dur: 4.6 });
      steps.push({ k: "swirl", from: "prev", to: R, dur: 0.8 });
    } else {
      // もぐる。ぼぎの字 1 文字 → 写真 → ぼぎの字 → 写真(D872、D873、D875)。だんだん遅く、モビールで止まる
      const seq = [{ c: R }, { c: V }];
      const used = new Set();
      D3.forEach((key) => {
        let n;
        do n = Math.floor(Math.random() * NISE_N);
        while (used.has(n) && used.size < NISE_N);
        used.add(n);
        seq.push({ nise: n });
        seq.push({ key });
      });
      seq.push({ key: "mobile" });
      const n = seq.length - 1;
      for (let i = 0; i < n; i++) {
        const q = i / (n - 1);
        const toWord = !!seq[i + 1].nise || seq[i + 1].nise === 0;
        steps.push({ k: "dive", from: seq[i], to: seq[i + 1], dur: toWord ? 0.45 + 0.4 * q : 0.6 + 1.3 * q * q });
        if (i + 1 < n) steps.push({ k: "dhold", to: seq[i + 1], dur: toWord ? 0.4 : 0.15 + 0.25 * q });
      }
      steps.push({ k: "dhold", to: { key: "mobile" }, dur: 0.6 });
      steps.push({ k: "dhold", to: { key: "mobile" }, dur: 1.4, cross: true }); // 非常口の走る人が横切る(ここだけ定まる)
      steps.push({ k: "white", dur: 0.5 });
    }
    let total = 0;
    steps.forEach((s) => {
      s.at = total;
      total += s.dur;
    });
    // 主観の途中で、非常口の走る人が一度横切る(触れない。D850)
    const cross = depth === 3 ? null : total * 0.45;
    tS.pov = { depth, t0: tS.time, steps, total, i: -1, R, V, cross, out: pc, rnd: rng(depth * 101 + tS.level) };
    // もぐる所と両はしの像は、はじめに決めておく(途中で画面を読み直して止まらない)
    steps.forEach((st) => {
      if (st.k === "dive") {
        st.A = diveSide(st.from, api);
        st.B = diveSide(st.to, api);
        st.p = diveSpot(st.A);
      }
    });
    if (depth === 2 && !BU) BU = burstInit(api); // 月の割れ方も先に作っておく
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
    } else if (st.k === "swirl") {
      st.a = swirlSrc(st.from, api);
      st.b = swirlSrc(st.to, api);
    } else if (st.k === "clear") {
      st.tgt = picture(st.to, api);
    } else if (st.k === "dive") {
      if (!st.A) {
        st.A = diveSide(st.from, api);
        st.B = diveSide(st.to, api);
        st.p = diveSpot(st.A);
      }
      tS.pov.out = hc;
    } else if (st.k === "dhold") {
      st.S = diveSide(st.to, api);
      tS.pov.out = hc;
    } else if (st.k === "neon" || st.k === "burst") {
      tS.pov.out = pc;
    }
    if (st.k === "swirl" || st.k === "clear" || st.k === "fly") tS.pov.out = pc;
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
  // ---- 2 段目: 渦(D867)。半分の細かさで、中心へ巻きこまれて消え、次の像が中心からほどける ----
  const SW = PW / 2;
  const SH = PH / 2;
  const swc = canvas(SW, SH);
  const swg = swc.getContext("2d", { willReadFrequently: true });
  const swOut = swg.createImageData(SW, SH);
  const SWR = new Float32Array(SW * SH);
  const SWT = new Float32Array(SW * SH);
  let SWRM = 0;
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++) {
      const dx = x - SW / 2;
      const dy = y - SH / 2;
      SWR[y * SW + x] = Math.hypot(dx, dy);
      SWT[y * SW + x] = Math.atan2(dy, dx);
      SWRM = Math.max(SWRM, SWR[y * SW + x]);
    }
  function smallData(c) {
    swg.imageSmoothingEnabled = true;
    swg.clearRect(0, 0, SW, SH);
    swg.drawImage(c, 0, 0, SW, SH);
    return swg.getImageData(0, 0, SW, SH).data;
  }
  function swirlSrc(x, api) {
    if (x === "prev") return smallData(copyOf(pc));
    if (x === "neon") return smallData(neonBase(api));
    return smallData(picture(x, api));
  }
  function drawSwirl(st, t) {
    const a = t < 0.5;
    const tt = a ? ease(t * 2) : ease((1 - t) * 2);
    const src = a ? st.a : st.b;
    const o = swOut.data;
    const sc = 1 + 7 * tt * tt;
    const dim = 1 - 0.5 * tt;
    for (let i = 0; i < SW * SH; i++) {
      const r = SWR[i];
      const tw = 7 * tt * Math.pow(1 - r / SWRM, 1.5) + 2.5 * tt;
      const th = SWT[i] + tw;
      const sx = Math.floor(SW / 2 + Math.cos(th) * r * sc);
      const sy = Math.floor(SH / 2 + Math.sin(th) * r * sc);
      const k = i * 4;
      if (sx >= 0 && sx < SW && sy >= 0 && sy < SH) {
        const j = (sy * SW + sx) * 4;
        o[k] = src[j] * dim;
        o[k + 1] = src[j + 1] * dim;
        o[k + 2] = src[j + 2] * dim;
      } else o[k] = o[k + 1] = o[k + 2] = 0;
      o[k + 3] = 255;
    }
    swg.putImageData(swOut, 0, 0);
    pg.imageSmoothingEnabled = false;
    pg.drawImage(swc, 0, 0, PW, PH);
  }
  function drawClear(st, t) {
    // 天体ははっきり。ゆっくり寄る(D867)
    const z = 1 + (st.z1 - 1) * t;
    const w = PW / z;
    const h = PH / z;
    pg.imageSmoothingEnabled = true;
    pg.drawImage(st.tgt, (PW - w) / 2, (PH - h) / 2, w, h, 0, 0, PW, PH);
  }

  // ---- 2 段目: 月の爆散(D868)。満月の右上に落ちて、破片と粉に割れ、欠けたへりは円弧(D869)、粉は傾いた輪になる ----
  // 試し絵 docs/record/2026-11-28/moon_burst/burst.py と同じ数
  const BURST_SEC = 6.0;
  const B_HIT = 0.9;
  let BU = null;
  function burstInit(api) {
    const im = api.image("trip_moon");
    if (!im) return null;
    const R0 = 96;
    const C = [PW / 2, PH / 2 + 4];
    const ang = (-42 * Math.PI) / 180;
    const D = [Math.cos(ang), Math.sin(ang)];
    const I = [C[0] + R0 * D[0], C[1] + R0 * D[1]];
    const CC = [C[0] + 0.98 * R0 * D[0], C[1] + 0.98 * R0 * D[1]];
    const CR = 0.62 * R0;
    const O = [C[0] + 0.55 * R0 * D[0], C[1] + 0.55 * R0 * D[1]];
    const src = canvas(PW, PH);
    const sg = src.getContext("2d", { willReadFrequently: true });
    sg.drawImage(im, 0, 0, PW, PH);
    const sd = sg.getImageData(0, 0, PW, PH).data;
    const R = rng(868);
    const inDisk = (x, y) => (x - C[0]) ** 2 + (y - C[1]) ** 2 <= (R0 - 0.5) ** 2;
    const dC = (x, y) => Math.hypot(x - CC[0], y - CC[1]);
    // 残る月(欠けたへりのきわは影で落ちこむ)と、焼けたへり(粒)
    const keep = canvas(PW, PH);
    const kg = keep.getContext("2d");
    const kd = kg.createImageData(PW, PH);
    const rim = canvas(PW, PH);
    const rgx = rim.getContext("2d");
    const rd = rgx.createImageData(PW, PH);
    const craterPx = [];
    for (let y = 0; y < PH; y++)
      for (let x = 0; x < PW; x++) {
        if (!inDisk(x, y)) continue;
        const k = (y * PW + x) * 4;
        const d = dC(x, y);
        if (d <= CR) {
          craterPx.push(x, y);
          continue;
        }
        const sh = d < CR + 12 ? 1 - 0.45 * (1 - (d - CR) / 12) : 1;
        kd.data[k] = sd[k] * sh;
        kd.data[k + 1] = sd[k + 1] * sh;
        kd.data[k + 2] = sd[k + 2] * sh;
        kd.data[k + 3] = 255;
        if (d < CR + 3 && R() < 0.85) {
          rd.data[k] = 255;
          rd.data[k + 1] = 255;
          rd.data[k + 2] = 255;
          rd.data[k + 3] = 255;
        }
      }
    kg.putImageData(kd, 0, 0);
    rgx.putImageData(rd, 0, 0);
    const tint = (c, col) => {
      const t = canvas(c.width, c.height);
      const g = t.getContext("2d");
      g.drawImage(c, 0, 0);
      g.globalCompositeOperation = "source-in";
      g.fillStyle = col;
      g.fillRect(0, 0, t.width, t.height);
      return t;
    };
    const rimHot = tint(rim, "rgb(255,245,225)");
    const rimCool = tint(rim, "rgb(255,95,25)");
    const rimGlow = canvas(PW, PH);
    const rgg = rimGlow.getContext("2d");
    rgg.filter = "blur(5px)";
    rgg.drawImage(rimCool, 0, 0);
    rgg.filter = "none";
    // 破片(ふぞろいなボロノイ、46)
    const NS = 46;
    const nC = craterPx.length / 2;
    const seeds = [];
    for (let i = 0; i < NS; i++) {
      const j = Math.floor(R() * nC);
      seeds.push([craterPx[j * 2], craterPx[j * 2 + 1]]);
    }
    const groups = seeds.map(() => []);
    for (let j = 0; j < nC; j++) {
      const x = craterPx[j * 2];
      const y = craterPx[j * 2 + 1];
      let b = 0;
      let bd = Infinity;
      for (let s = 0; s < NS; s++) {
        const d = (x - seeds[s][0]) ** 2 + (y - seeds[s][1]) ** 2;
        if (d < bd) {
          bd = d;
          b = s;
        }
      }
      groups[b].push(x, y);
    }
    const frags = [];
    groups.forEach((g) => {
      const n = g.length / 2;
      if (n < 6) return;
      let x0 = PW;
      let y0 = PH;
      let x1 = 0;
      let y1 = 0;
      let gx = 0;
      let gy = 0;
      for (let j = 0; j < n; j++) {
        const x = g[j * 2];
        const y = g[j * 2 + 1];
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x + 1);
        y1 = Math.max(y1, y + 1);
        gx += x;
        gy += y;
      }
      gx /= n;
      gy /= n;
      const w = x1 - x0;
      const h = y1 - y0;
      const mk = () => {
        const c = canvas(w, h);
        return [c, c.getContext("2d"), c.getContext("2d").createImageData(w, h)];
      };
      const [face, fg, fd] = mk();
      const [back, bg, bd] = mk();
      const [edge, eg, ed] = mk();
      const has = new Uint8Array(w * h);
      for (let j = 0; j < n; j++) has[(g[j * 2 + 1] - y0) * w + (g[j * 2] - x0)] = 1;
      for (let j = 0; j < n; j++) {
        const x = g[j * 2];
        const y = g[j * 2 + 1];
        const lx = x - x0;
        const ly = y - y0;
        const k = (ly * w + lx) * 4;
        const s = (y * PW + x) * 4;
        fd.data[k] = sd[s] * 0.92;
        fd.data[k + 1] = sd[s + 1] * 0.92;
        fd.data[k + 2] = sd[s + 2] * 0.92;
        fd.data[k + 3] = 255;
        const nz = (R() - 0.5) * 36;
        bd.data[k] = 92 + nz;
        bd.data[k + 1] = 84 + nz;
        bd.data[k + 2] = 78 + nz;
        bd.data[k + 3] = 255;
        const isE = lx === 0 || ly === 0 || lx === w - 1 || ly === h - 1 || !has[ly * w + lx - 1] || !has[ly * w + lx + 1] || !has[(ly - 1) * w + lx] || !has[(ly + 1) * w + lx];
        if (isE) {
          ed.data[k] = 255;
          ed.data[k + 1] = 120;
          ed.data[k + 2] = 30;
          ed.data[k + 3] = 255;
        }
      }
      fg.putImageData(fd, 0, 0);
      bg.putImageData(bd, 0, 0);
      eg.putImageData(ed, 0, 0);
      const dx = gx - O[0];
      const dy = gy - O[1];
      const dl = Math.hypot(dx, dy) || 1;
      const sp = (40 + R() * 130) * (n < 60 ? 1.25 : 1);
      const jit = (R() - 0.5) * 0.7;
      frags.push({
        face,
        back,
        edge,
        side: tint(face, "rgb(52,46,42)"),
        dark: tint(face, "#000"),
        g: [gx, gy],
        v: [((dx / dl) * Math.cos(jit) - (dy / dl) * Math.sin(jit)) * sp, ((dx / dl) * Math.sin(jit) + (dy / dl) * Math.cos(jit)) * sp],
        w: (R() - 0.5) * 320,
        grow: R() * 0.5,
        n,
        shade: 0.45 + R() * 0.5,
        fw: (1.5 + R() * 3.5) * (R() < 0.5 ? -1 : 1),
        fp: R() * 6.28,
        th: Math.min(4, 1 + n / 120),
      });
    });
    frags.sort((a, b) => a.n - b.n);
    // 粉 9000(はじめは飛び、あとで傾いた輪に寄る)
    const NP = 9000;
    const gauss = () => (R() + R() + R() - 1.5) * 1.6;
    const p0 = new Float32Array(NP * 2);
    const pv = new Float32Array(NP * 2);
    const pdrag = new Float32Array(NP);
    const pbr = new Float32Array(NP);
    const pth = new Float32Array(NP);
    const prad = new Float32Array(NP);
    const base = Math.atan2(D[1], D[0]);
    for (let i = 0; i < NP; i++) {
      const a = base + (R() * 2 - 1) * (R() < 0.8 ? 1.2 : 3.1);
      let sp = 15;
      for (let k = 0; k < 4; k++) sp -= Math.log(R() + 1e-6) * 27; // ガンマ分布のかわり
      p0[i * 2] = O[0] + gauss() * 10;
      p0[i * 2 + 1] = O[1] + gauss() * 10;
      pv[i * 2] = Math.cos(a) * sp;
      pv[i * 2 + 1] = Math.sin(a) * sp;
      pdrag[i] = 0.6 + R() * 0.8;
      pbr[i] = 0.35 + R() * 0.65;
      pth[i] = R() * 6.283;
      prad[i] = 1 + gauss() * 0.1;
    }
    const stars = canvas(PW, PH);
    const stg = stars.getContext("2d");
    stg.fillStyle = "#000";
    stg.fillRect(0, 0, PW, PH);
    for (let i = 0; i < 110; i++) {
      const b = Math.round(255 * (0.2 + R() * 0.6));
      stg.fillStyle = `rgb(${b},${b},${b})`;
      stg.fillRect(Math.floor(R() * PW), Math.floor(R() * PH), 1, 1);
    }
    const dustC = [canvas(PW, PH), canvas(PW, PH)];
    const dustD = dustC.map((c) => c.getContext("2d").createImageData(PW, PH));
    return { im, C, R0, I, O, D, keep, rimHot, rimCool, rimGlow, frags, NP, p0, pv, pdrag, pbr, pth, prad, stars, dustC, dustD };
  }
  const B_TILT = (-14 * Math.PI) / 180;
  function drawBurst(t, api) {
    if (!BU) BU = burstInit(api);
    const B = BU;
    if (!B) return;
    const u = t - B_HIT;
    pg.globalAlpha = 1;
    pg.globalCompositeOperation = "source-over";
    pg.imageSmoothingEnabled = true;
    pg.drawImage(B.stars, 0, 0);
    // 粉: 奥(月のうしろ)と手前に分けて点を打つ
    let haveDust = false;
    if (u > 0) {
      haveDust = true;
      const RA = 1.85 * B.R0;
      const RB = 0.3 * B.R0;
      const sr = ease(Math.max(0, Math.min(1, (u - 1.2) / 2.6)));
      const heat = Math.exp(-u * 1.3);
      const cr = 255 * (0.55 + 0.45 * heat);
      const cgc = 255 * (0.52 + 0.1 * heat);
      const cb = 255 * (0.5 - 0.25 * heat);
      const fade = Math.max(0.55, Math.min(1, 1.2 - u * 0.15));
      const bufs = B.dustD.map((d) => {
        const u32 = new Uint32Array(d.data.buffer);
        u32.fill(0);
        return d.data;
      });
      const ct = Math.cos(B_TILT);
      const stl = Math.sin(B_TILT);
      for (let i = 0; i < B.NP; i++) {
        const dr = 0.55 * B.pdrag[i];
        const kk = (1 - Math.exp(-dr * u)) / dr;
        let x = B.p0[i * 2] + B.pv[i * 2] * kk;
        let y = B.p0[i * 2 + 1] + B.pv[i * 2 + 1] * kk;
        let sa = 1;
        if (sr > 0) {
          const a = B.pth[i] + 0.18 * t;
          const ex = Math.cos(a) * RA * B.prad[i];
          const ey = Math.sin(a) * RB * B.prad[i];
          const rx = B.C[0] + ex * ct - ey * stl;
          const ry = B.C[1] + ex * stl + ey * ct;
          x = x * (1 - sr) + rx * sr;
          y = y * (1 - sr) + ry * sr;
          sa = Math.sin(a);
        }
        const ix = x | 0;
        const iy = y | 0;
        if (ix < 0 || iy < 0 || ix >= PW || iy >= PH) continue;
        const d = bufs[sa < 0 && sr > 0.5 ? 0 : 1];
        const k = (iy * PW + ix) * 4;
        const f = B.pbr[i] * fade * 0.55;
        d[k] = Math.min(255, d[k] + cr * f);
        d[k + 1] = Math.min(255, d[k + 1] + cgc * f);
        d[k + 2] = Math.min(255, d[k + 2] + cb * f);
        d[k + 3] = 255;
      }
      B.dustC.forEach((c, j) => c.getContext("2d").putImageData(B.dustD[j], 0, 0));
      pg.globalCompositeOperation = "lighter";
      pg.drawImage(B.dustC[0], 0, 0);
      pg.globalCompositeOperation = "source-over";
    }
    // 月
    if (u <= 0) pg.drawImage(B.im, 0, 0, PW, PH);
    else {
      pg.drawImage(B.keep, 0, 0);
      const hot = Math.exp(-u * 0.9);
      pg.drawImage(B.rimCool, 0, 0);
      pg.globalAlpha = hot;
      pg.drawImage(B.rimHot, 0, 0);
      pg.globalAlpha = Math.min(1, 0.2 + 1.6 * hot);
      pg.globalCompositeOperation = "lighter";
      pg.drawImage(B.rimGlow, 0, 0);
      pg.globalCompositeOperation = "source-over";
      pg.globalAlpha = 1;
      // 破片: 回り、軸のまわりにも転がり(裏は割れた岩)、厚み(暗い側面)、熱いうちはふちが焼ける
      const kk = (1 - Math.exp(-0.12 * u)) / 0.12;
      const fhot = Math.exp(-u * 1.1);
      for (const f of B.frags) {
        const gx = f.g[0] + f.v[0] * kk;
        const gy = f.g[1] + f.v[1] * kk;
        if (gx < -60 || gy < -60 || gx > PW + 60 || gy > PH + 60) continue;
        const sc = 1 + f.grow * Math.min(u, 3) * 0.25;
        const flip = Math.cos(f.fw * kk + f.fp);
        const sx = Math.max(0.12, Math.abs(flip)) * sc;
        const la = f.fw * kk * 0.7 + f.fp;
        const thick = Math.max(1, Math.round(f.th * sc));
        const w = f.face.width;
        const h = f.face.height;
        const draw = (img) => pg.drawImage(img, -w / 2, -h / 2);
        for (let k = thick; k >= 1; k--) {
          pg.save();
          pg.translate(gx + Math.cos(la + 0.6) * k, gy + Math.sin(la + 0.6) * k);
          pg.rotate((f.w * kk * Math.PI) / 180);
          pg.scale(sx, sc);
          draw(f.side);
          pg.restore();
        }
        pg.save();
        pg.translate(gx, gy);
        pg.rotate((f.w * kk * Math.PI) / 180);
        pg.scale(sx, sc);
        draw(flip >= 0 ? f.face : f.back);
        pg.globalAlpha = 1 - Math.min(1, f.shade * (0.55 + 0.45 * Math.abs(flip)));
        draw(f.dark);
        pg.globalAlpha = Math.min(1, 1.3 * fhot);
        pg.globalCompositeOperation = "lighter";
        draw(f.edge);
        pg.restore();
      }
    }
    if (haveDust) {
      pg.globalCompositeOperation = "lighter";
      pg.drawImage(B.dustC[1], 0, 0);
    }
    // 落ちてくる光(当たる前)
    pg.globalCompositeOperation = "lighter";
    if (u <= 0) {
      const q = ease(t / B_HIT);
      const sx = B.I[0] + 260 * (1 - q);
      const sy = B.I[1] - 150 * (1 - q);
      const gr = pg.createLinearGradient(sx, sy, sx + 45, sy - 26);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      pg.strokeStyle = gr;
      pg.lineWidth = 2;
      pg.beginPath();
      pg.moveTo(sx, sy);
      pg.lineTo(sx + 45, sy - 26);
      pg.stroke();
    }
    // 閃光、火の玉、衝撃の輪
    if (u > -0.05) {
      const uu = Math.max(u, 0);
      const fl = Math.exp(-uu * 3.2);
      const fr = 18 + 60 * Math.min(uu, 1);
      let g = pg.createRadialGradient(B.I[0], B.I[1], 0, B.I[0], B.I[1], fr * 2.2);
      g.addColorStop(0, `rgba(255,245,225,${Math.min(1, 1.6 * fl)})`);
      g.addColorStop(1, "rgba(255,245,225,0)");
      pg.fillStyle = g;
      pg.fillRect(0, 0, PW, PH);
      if (uu > 0) {
        const rr = 14 + 75 * (1 - Math.exp(-uu * 1.6));
        const fo = [B.O[0] + B.D[0] * 40 * Math.min(uu, 2), B.O[1] + B.D[1] * 40 * Math.min(uu, 2)];
        const cool = Math.exp(-uu);
        const a = Math.exp(-uu * 0.75) * 0.9;
        g = pg.createRadialGradient(fo[0], fo[1], 0, fo[0], fo[1], rr * 2);
        g.addColorStop(0, `rgba(255,${Math.round(70 + 150 * cool)},${Math.round(20 + 120 * cool)},${a})`);
        g.addColorStop(1, "rgba(255,60,20,0)");
        pg.fillStyle = g;
        pg.fillRect(0, 0, PW, PH);
      }
      if (uu > 0 && uu < 1.6) {
        const rr = 10 + uu * 230;
        const al = (1 - uu / 1.6) * 0.9;
        for (const [lw, aa] of [[10, 0.15], [5, 0.35], [2, 0.8]]) {
          pg.strokeStyle = `rgba(200,210,255,${al * aa})`;
          pg.lineWidth = lw + uu * 4;
          pg.beginPath();
          pg.arc(B.I[0], B.I[1], rr, 0, Math.PI * 2);
          pg.stroke();
        }
      }
      pg.globalCompositeOperation = "source-over";
      pg.fillStyle = `rgba(255,255,255,${0.45 * fl ** 4})`;
      pg.fillRect(0, 0, PW, PH);
      tS.pov.shake = uu > 0 && uu < 0.7 ? (0.7 - uu) * 6 : 0;
    }
    pg.globalCompositeOperation = "source-over";
    pg.globalAlpha = 1;
  }

  // ---- 2 段目: ネオン街をきーがさまよう(D874) ----
  function neonBase(api) {
    const c = canvas(PW, PH);
    const g = c.getContext("2d");
    const im = api.image("trip_neon");
    if (im) g.drawImage(im, 0, 0, PW, PH);
    return c;
  }
  const NEON_GY = 238;
  const NEON_PATH = [
    ["w", 2, 30, 170, 1.6],
    ["s", 1, 170, 170, 0.7],
    ["s", 3, 170, 170, 0.35],
    ["w", 3, 170, 130, 0.8],
    ["s", 0, 130, 130, 9],
  ]; // 右へ歩く → 見上げる → 左を向く → 少し戻る → こちらを向いて止まる
  function drawNeon(st, t, api) {
    const tt = t * st.dur;
    pg.imageSmoothingEnabled = false;
    const im = api.image("trip_neon");
    if (im) pg.drawImage(im, 0, 0, PW, PH);
    // 看板がときどきまたたく
    const R = tS.pov.rnd;
    if (R() < 0.18) {
      pg.fillStyle = "rgba(0,0,0,0.45)";
      pg.fillRect(Math.floor(R() * (PW - 50)), 0, 44, NEON_GY);
    }
    let acc = 0;
    let row = 0;
    let col = 0;
    let x = 30;
    for (const [kind, r, x0, x1, d] of NEON_PATH) {
      if (tt < acc + d) {
        const k = (tt - acc) / d;
        x = x0 + (x1 - x0) * k;
        row = r;
        col = kind === "w" ? Math.floor(tt * 9) % 7 : 0;
        break;
      }
      acc += d;
    }
    const ki = api.image(typeof ngKiImg === "function" ? ngKiImg() : "ki");
    if (ki) {
      const ky = NEON_GY + 6 - 40;
      pg.drawImage(ki, col * 64, row * 64, 64, 64, Math.round(x) - 32, ky, 64, 64);
      pg.save();
      pg.globalAlpha = 0.3; // 路面に映る
      pg.translate(Math.round(x) - 32, ky + 104);
      pg.scale(1, -1);
      pg.drawImage(ki, col * 64, row * 64, 64, 64, 0, 0, 64, 64);
      pg.restore();
    }
  }

  // ---- 3 段目: もぐる(D867)。ぼぎの字(D875)と写真。次の像は丸く、ぼけたふちで広がり、外は折り返して続く(D871) ----
  const HW = PW * 2;
  const HH = PH * 2;
  const hc = canvas(HW, HH);
  const hg = hc.getContext("2d");
  const tc = canvas(HW, HH);
  const tg = tc.getContext("2d");
  const NISE_N = 48;
  const NISE_CELL = 256;
  const niseCache = new Map();
  function niseCanvas(n, api) {
    if (niseCache.has(n)) return niseCache.get(n);
    const c = canvas(HW, HH);
    const g = c.getContext("2d");
    g.fillStyle = "rgb(6,4,6)";
    g.fillRect(0, 0, HW, HH);
    const sh = api.image("trip_nise");
    if (!sh) return c;
    // 白い字を、生成りの色で。真ん中に 320 ドット
    const t = canvas(NISE_CELL, NISE_CELL);
    const tg2 = t.getContext("2d");
    tg2.drawImage(sh, (n % 8) * NISE_CELL, Math.floor(n / 8) * NISE_CELL, NISE_CELL, NISE_CELL, 0, 0, NISE_CELL, NISE_CELL);
    tg2.globalCompositeOperation = "source-in";
    tg2.fillStyle = "rgb(236,226,214)";
    tg2.fillRect(0, 0, NISE_CELL, NISE_CELL);
    g.imageSmoothingEnabled = true;
    g.drawImage(t, HW / 2 - 160, HH / 2 - 160, 320, 320);
    niseCache.set(n, c);
    return c;
  }
  // もぐる端の像: { c: 480 × 300 のキャンバス, s: 倍率, smooth }
  function diveSide(x, api) {
    if (x.nise != null) return { c: niseCanvas(x.nise, api), s: 2, smooth: true };
    return { c: x.c || picture(x.key, api), s: 1, smooth: false };
  }
  function diveSpot(side) {
    // いちばん目を引く所(明るさの差が大きいマス)へもぐる。はしは避ける。字は線の上
    const c = side.c;
    const g = c.getContext("2d", { willReadFrequently: true });
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const S = 10 * side.s;
    const gw = Math.floor(c.width / S);
    const gh = Math.floor(c.height / S);
    let best = -1;
    let bx = c.width / 2;
    let by = c.height / 2;
    for (let cy = 3; cy < gh - 3; cy++)
      for (let cx = 4; cx < gw - 4; cx++) {
        let s = 0;
        let s2 = 0;
        let n = 0;
        for (let y = cy * S; y < cy * S + S; y += side.s)
          for (let x = cx * S; x < cx * S + S; x += side.s) {
            const k = (y * c.width + x) * 4;
            const l = d[k] * 0.3 + d[k + 1] * 0.59 + d[k + 2] * 0.11;
            s += l;
            s2 += l * l;
            n++;
          }
        const v = s2 / n - (s / n) ** 2;
        if (v > best) {
          best = v;
          bx = cx * S + S / 2;
          by = cy * S + S / 2;
        }
      }
    return [bx / side.s, by / side.s]; // 480 × 300 の座標で
  }
  function drawDive(st, t) {
    const e = ease(t);
    const Z = (PW / 10) * 0.5;
    const z = Math.pow(Z, e);
    const [px, py] = st.p;
    const ax = px + (PW / 2 - px) * e;
    const ay = py + (PH / 2 - py) * e;
    // 今の像を、もぐる所を中心に拡大(写真はマスになる。字はなめらか)
    const A = st.A;
    hg.globalAlpha = 1;
    hg.fillStyle = "#000";
    hg.fillRect(0, 0, HW, HH);
    hg.imageSmoothingEnabled = A.smooth;
    hg.drawImage(A.c, (px - ax / z) * A.s, (py - ay / z) * A.s, (PW / z) * A.s, (PH / z) * A.s, 0, 0, HW, HH);
    // 次の像: 画面の上で、左上 (bx, by)、大きさ (bw, bh)。外は折り返して 3 × 3 に並べる
    const B = st.B;
    const k = z / Z;
    const bw = PW * k * 2;
    const bh = PH * k * 2;
    const bx = (ax - (PW / 2) * k) * 2;
    const by = (ay - (PH / 2) * k) * 2;
    // 丸く、ぼけたふち。だんだん広がって画面をおおう。描くのは丸の外わくの中だけ(軽くする)
    const al = Math.min(1, e * 1.3) ** 2;
    if (al < 0.01) return;
    const rad = (0.4 * PH + Math.pow(e, 2.5) * PW) * 2 * k;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const x0 = Math.max(0, Math.floor(cx - rad));
    const y0 = Math.max(0, Math.floor(cy - rad));
    const x1 = Math.min(HW, Math.ceil(cx + rad));
    const y1 = Math.min(HH, Math.ceil(cy + rad));
    if (x1 <= x0 || y1 <= y0) return;
    tg.globalCompositeOperation = "source-over";
    tg.globalAlpha = 1;
    tg.clearRect(x0, y0, x1 - x0, y1 - y0);
    tg.save();
    tg.beginPath();
    tg.rect(x0, y0, x1 - x0, y1 - y0);
    tg.clip();
    tg.imageSmoothingEnabled = B.smooth;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const tx = bx + i * bw;
        const ty = by + j * bh;
        if (tx > x1 || ty > y1 || tx + bw < x0 || ty + bh < y0) continue; // 丸にかからない折り返しは描かない
        tg.save();
        tg.translate(i > 0 ? bx + 2 * bw : i < 0 ? bx : bx, j > 0 ? by + 2 * bh : by);
        tg.scale(i ? -1 : 1, j ? -1 : 1);
        tg.drawImage(B.c, 0, 0, B.c.width, B.c.height, 0, 0, bw, bh);
        tg.restore();
      }
    const gr = tg.createRadialGradient(cx, cy, rad * 0.45, cx, cy, Math.max(rad, 1));
    gr.addColorStop(0, "rgba(0,0,0,1)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    tg.globalCompositeOperation = "destination-in";
    tg.fillStyle = gr;
    tg.fillRect(x0, y0, x1 - x0, y1 - y0);
    tg.restore();
    tg.globalCompositeOperation = "source-over";
    hg.globalAlpha = al;
    hg.drawImage(tc, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    hg.globalAlpha = 1;
  }
  function drawDHold(st) {
    const S = st.S;
    hg.globalAlpha = 1;
    hg.imageSmoothingEnabled = S.smooth;
    hg.drawImage(S.c, 0, 0, HW, HH);
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
    pov.shake = 0;
    if (st.k === "fly") drawFly(st, t);
    else if (st.k === "em") drawEmerge(st, t, dt);
    else if (st.k === "hold") pg.drawImage(st.tgt, 0, 0);
    else if (st.k === "swirl") drawSwirl(st, t);
    else if (st.k === "clear") drawClear(st, t);
    else if (st.k === "burst") drawBurst(t * st.dur, api);
    else if (st.k === "neon") drawNeon(st, t, api);
    else if (st.k === "dive") drawDive(st, t);
    else if (st.k === "dhold") drawDHold(st);
    // 非常口の走る人が横切る
    const ct = st.cross ? t : pov.cross != null ? (e - pov.cross) / 1.3 : -1;
    if (ct >= 0 && ct <= 1) {
      const x = Math.round(-50 + ct * (PW + 100));
      const y = Math.round(212 - Math.abs(Math.sin(ct * 14)) * 10);
      if (pov.out === hc) {
        hg.imageSmoothingEnabled = false;
        hg.drawImage(runBig, x * 2, y * 2, runBig.width * 2, runBig.height * 2);
      } else pg.drawImage(runBig, x, y);
    }
    const W = ctx.canvas.width / ctx.getTransform().a;
    const H = ctx.canvas.height / ctx.getTransform().d;
    ctx.imageSmoothingEnabled = pov.out === hc;
    if (pov.shake) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
    }
    const sx = pov.shake ? (pov.rnd() - 0.5) * 2 * pov.shake * (W / PW) : 0;
    const sy = pov.shake ? (pov.rnd() - 0.5) * 2 * pov.shake * (H / PH) : 0;
    ctx.drawImage(pov.out, sx, sy, W, H);
    ctx.imageSmoothingEnabled = false;
    if (st.k === "white") {
      ctx.fillStyle = `rgba(255, 252, 240, ${0.6 + 0.4 * t})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ---- 上から見た画面をけばけばしく(D853) ----
  // トリップの段の色(D853)。はずれのときは、色相と濃さだけが短くゆらぐ(D857)
  function tripLook() {
    const lv = tS.level;
    const tt = tS.time;
    const step = Math.floor(tt / STEP);
    if (tS.ons && tt < 6) {
      // じわじわ(D863): はじめの 3 秒は何も起きない。3〜6 秒は、色がかすかに波打っては戻る
      const w = Math.max(0, (tt - 3) / 3);
      const e = w * (0.5 + 0.5 * Math.sin(tt * 2.1));
      return { sat: 1 + 0.35 * e, con: 1 + 0.05 * e, hue: Math.round(Math.sin(tt * 1.3) * 14 * e), post: 0, shuf: 0, step };
    }
    if (tS.ons && tt < 10) {
      // 6〜10 秒: 色相は拍子で跳ばさず、ゆっくり流れながら振れ幅を広げる。濃さも少しずつ(D863)
      const k = (tt - 6) / 4;
      const e = k * k;
      return { sat: 1 + (SAT[lv] - 1) * (0.25 + 0.75 * k), con: 1 + 0.25 * lv * k, hue: Math.round(Math.sin(tt * 0.9) * (25 + 110 * e)), post: 0, shuf: 0, step };
    }
    const k = tS.ons ? 1 : Math.min(1, tt / 1.5); // 食べたあと、少しずつずれる
    return { sat: 1 + (SAT[lv] - 1) * k, con: 1 + 0.25 * lv * k, hue: Math.round(((step * HUE[lv]) % 360) * k), post: POST[lv], shuf: SHUF[lv], step };
  }
  function missLook() {
    const e = Math.sin(Math.min(1, miss.t / MISS_SEC) * Math.PI); // ふくらんで、しぼむ
    return { sat: 1 + 1.3 * e, con: 1 + 0.15 * e, hue: Math.round(Math.sin(miss.t * 4) * 70 * e), post: 0, shuf: 0, step: 0 };
  }
  // 画面の加工は、画面の半分の細かさ(ゲームの 1 倍の絵)でする。絵はもともと 2 倍に拡大して描いているので、見た目は同じで軽い(D859)。
  // トリップ中は、きーもぴーも世界といっしょに色がずれる(D859。来訪神と非常口だけは、このあと drawFigures でふだんの色)
  function garish(ctx, ox, oy, L) {
    const c = ctx.canvas;
    const Z = ctx.getTransform().a;
    const W = Math.round(c.width / Z);
    const H = Math.round(c.height / Z);
    if (!tmp || tmp.width !== W || tmp.height !== H) {
      tmp = canvas(W, H);
      tmp2 = canvas(W, H);
    }
    const step = L.step;
    const g = tmp.getContext("2d", { willReadFrequently: true });
    g.imageSmoothingEnabled = false;
    g.filter = `saturate(${L.sat}) contrast(${L.con}) hue-rotate(${L.hue}deg)`;
    g.drawImage(c, 0, 0, W, H);
    g.filter = "none";
    if (L.post) {
      const id = g.getImageData(0, 0, W, H);
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
      for (let i = 0; i < n; i++) g.drawImage(tmp2, src[i][0], src[i][1], C, C, dst[i][0], dst[i][1], C, C);
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, c.width, c.height);
    ctx.restore();
  }
  // 来訪神、看板、走る人は、ずれた世界の上にふだんの色で浮く
  function drawFigures(ctx, ox, oy) {
    const step = Math.floor(tS.time / STEP);
    const list = [];
    // 来訪神は、色がずれはじめてから立つ。じわじわのときは 10 秒から 2 秒かけて、うっすら濃くなる(D863)
    const show = tS.ons ? Math.min(1, Math.max(0, (tS.time - 10) / 2)) : Math.min(1, Math.max(0, (tS.time - 0.6) / 0.6));
    const signOn = !tS.ons || tS.time >= 10; // 非常口の看板も、じわじわのときは 10 秒から
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
    if (signOn) list.push({ y: SIGN_XY[1], f: () => ctx.drawImage(r.state === "in" ? signFull : signEmpty, Math.round(SIGN_XY[0] + ox - 11), Math.round(SIGN_XY[1] + oy - 17)) });
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

  // ---- 松茸 3 本(かえでの根もと)。当たりの 1 本だけがトリップに入る(D856)。目がさめるとまた生えている ----
  // 場所は、長門から入ってすぐの内回り、かえで (271, 62) の根もと。道とのあいだにガードレールがない(D858。
  // 版 639 の (60, 632) あたりはガードレールの外で、監督「ガードレールの外にあるのが嫌だな」)
  const SHROOM_S = 312;
  const SHROOM_SIDE = -1;
  // 7 本(D864): かえでの根もとに大小 4 本の群れ、かえで寄りに散らして 3 本。[道ぞいの位置, 道の中心からのへだたり, 大きさ]。
  // 試し絵 docs/record/2026-11-28/kinoko7/。道ぞいに一列に並べるとガードレールの端に重なったので、かえで寄りに散らした
  const SHROOM_PLAN = [[306, 62, 1], [314, 70, 0.8], [321, 58, 1.1], [298, 71, 0.7], [336, 66, 0.9], [343, 55, 0.75], [351, 64, 1]];
  const SHROOMS = SHROOM_PLAN.map(([ss, l]) => at(ss, SHROOM_SIDE * l));
  const MATSUS = SHROOMS.map(([mx, my], i) => ({
    id: `tripMatsu${i}`,
    x: mx,
    y: my,
    range: 58,
    hidden: () => !!tS || shroom.eaten[i] || !!(eat && eat.i === i && eat.t > EAT_PICK),
    canInteract: () => !tS && !eat && !miss,
    interact(api) {
      const p = api.player();
      api.face(Math.abs(mx - p.x) > Math.abs(my - p.y) ? (mx > p.x ? "east" : "west") : my > p.y ? "south" : "north");
      api.freeze(EAT_SEC);
      api.peck(); // かがんで、つまみ上げる(D865。へこむのはやめた)
      eat = { t: 0, i, hit: shroom.hits.includes(i), bites: 0 };
      eatAt = [p.x, p.y];
    },
    draw(ctx, sx, sy) {
      const k = SHROOM_PLAN[i][2];
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(k, k);
      ctx.fillStyle = "rgba(0,0,0,0.27)";
      ctx.beginPath();
      ctx.ellipse(0, -1, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(matsu, -6, -13);
      ctx.restore();
    },
  }));

  // ---- 中毒のぴー(D856、D858)。先にキノコを食べていて、キノコのそばでひっくり返り、口から泡をブクブクと垂れ流し、ときどきけいれんする。色はピンクのまま(D859) ----
  // 試し絵は docs/record/2026-11-28/trip/game/place_inject.js、foam.gif。
  // ぴーは足のない丸い体なので、正面をさかさにしても倒れて見えない。横向き(くちばしが東)の絵をさかさにすると、影が上・つやが下になって腹を見せて見える
  const PI_XY = at(SHROOM_S - 30, SHROOM_SIDE * 66);
  const hash = (n) => {
    const v = Math.sin(n * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  };
  const PI = {
    id: "tripPi",
    x: PI_XY[0],
    y: PI_XY[1],
    w: 1,
    h: 1,
    headY: 20,
    solid: { w: 32, h: 10, dy: -8 }, // きーが重ならない(倒れた体の大きさ)
    hidden: (api) => api.flag("akiPiCame"), // 峠道の焚き火にぴーが来たら、ここのぴーは消えたまま(同じ個体 D876)
    draw(ctx, sx, sy, t, api) {
      const im = api.image("pi");
      if (!im) return;
      // けいれん: 1.5 秒おきに 0.5 秒、体が小刻みにふるえ、縮んではのびる
      const fit = t % 1.5 < 0.5;
      const tw = fit ? Math.round(Math.sin(t * 55) * 2) : 0;
      const tv = fit ? Math.round(Math.sin(t * 43)) : 0;
      const sq = fit ? 1 + Math.sin(t * 31) * 0.08 : 1;
      ctx.save();
      ctx.translate(Math.round(sx) + tw, Math.round(sy - 12) + tv);
      ctx.scale(2 - sq, -sq);
      ctx.drawImage(im, 0, 128, 64, 64, -32, -30, 64, 64); // いつものピンク(色を変えると別の個体に見える D859)
      ctx.restore();
      // 泡: くちばし(横向きの絵の (48, 37) をさかさにした所)から、細かい泡がわいてははじけ、地面へ垂れて泡だまりになる
      const mx = sx + 17 + tw;
      const my = sy - 19 + tv;
      const dot = (x, y, big, a) => {
        x = Math.round(x);
        y = Math.round(y);
        ctx.fillStyle = `rgba(250, 252, 255, ${a})`;
        if (big) ctx.fillRect(x, y, 2, 2);
        else ctx.fillRect(x, y, 1, 1);
        ctx.fillStyle = `rgba(160, 178, 205, ${a * 0.9})`;
        if (big) ctx.fillRect(x + 1, y + 1, 1, 1);
        else if ((x + y) % 3 === 0) ctx.fillRect(x, y, 1, 1);
      };
      const pool = 8 + Math.sin(t * 0.8);
      for (let i = 0; i < 44; i++) {
        const ang = hash(i) * Math.PI * 2;
        const rr = Math.sqrt(hash(i + 50)) * pool;
        dot(mx + 2 + Math.cos(ang) * rr * 1.6, sy + Math.sin(ang) * rr * 0.4, hash(i + 90) < 0.35, 0.9);
      }
      for (let i = 0; i < 14; i++) {
        const ph = (t * 1.6 + hash(i + 7)) % 1;
        const ang = hash(i + 3) * Math.PI * 2;
        const rr = 1 + hash(i + 11) * 3;
        if (ph < 0.9) dot(mx + Math.cos(ang) * rr * 1.3, my + Math.sin(ang) * rr, ph > 0.4, 0.95);
      }
      for (let i = 0; i < 28; i++) {
        const u = (t * 0.9 + i / 28) % 1;
        dot(mx + (i % 2) + Math.sin(i * 1.7 + u * 3) * 1.2 + u * 2, my + u * (sy + 1 - my), hash(i + 30) < 0.3, 0.9);
      }
    },
  };

  // 食べている 1 本(D865): つまみ上げたキノコを、こちらを向いて口の前に持ち、3 口かじって食べきる。かじるたびに上から欠ける。峠道のイモも同じ食べ方(todo 378)
  const HELD = {
    id: "tripHeld",
    x: -100,
    y: -100,
    w: 1,
    h: 1,
    update(dt, t, api) {
      const p = api.player();
      this.x = p.x;
      this.y = p.y + 1; // きーの手前に描く
    },
    draw(ctx, sx, sy) {
      if (!eat || eat.t < EAT_PICK) return;
      const k = SHROOM_PLAN[eat.i][2];
      const left = 1 - eat.bites / EAT_BITES.length; // 残り
      if (left <= 0) return;
      const H = matsu.height;
      const cut = Math.round(H * (1 - left)); // 上(かさ)からかじる
      const dip = EAT_BITES.some((b) => eat.t >= b && eat.t < b + 0.24) ? 2 : 0; // かじるとき、体といっしょに下がる
      ctx.save();
      // くちばし(正面の絵で足もとから 11 ドット上)にかさの上が来るように、体の前に持つ。顔(目)にはかからない
      // かじった分だけ持ち上げて、残りの上がいつも口に付くようにする
      const sc = k * 0.85;
      ctx.translate(Math.round(sx + 1), Math.round(sy + 3 + dip - cut * sc));
      ctx.scale(sc, sc);
      ctx.drawImage(matsu, 0, cut, matsu.width, H - cut, -6, -H + cut, matsu.width, H - cut);
      // かじった跡: 欠けた所に白い身が見える
      if (cut > 0 && cut < H) {
        ctx.fillStyle = "#efe6d2";
        ctx.fillRect(-4, -H + cut, 8, 1);
      }
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
      // つまみ上げたら、こちらを向いて、3 口かじる(D865)
      if (eat.t >= EAT_PICK && !eat.turned) {
        eat.turned = true;
        api.face("south");
      }
      if (eat.bites < EAT_BITES.length && eat.t >= EAT_BITES[eat.bites]) {
        eat.bites++;
        api.peck(); // 字は出さず、動きで見せる(監督「もぐもぐはいらない」todo 378)
      }
      if (eat.t > EAT_SEC) {
        const e = eat;
        eat = null;
        shroom.eaten[e.i] = true;
        if (e.hit) startTrip(1, api, ONSET);
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
    if (tS.time > (tS.ons ? tS.ons : 0.9) && tS.time - (tS.caughtAt || -9) > 0.8)
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
      if ((!tS.ons || tS.time >= 10) && Math.hypot(SIGN_XY[0] - p.x, SIGN_XY[1] - p.y) < 80) {
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
  M.objects.push(...MATSUS, PI, HELD, CTL);

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
