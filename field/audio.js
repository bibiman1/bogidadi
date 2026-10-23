// 音(D171、D195)。BGM は場所ごとに切りかえ(重ねて入れかえる)、効果音は名前で鳴らす
// 音のファイル(音楽生成 AI、フリー素材、録音)は BGM_FILES / SFX_FILES に足すだけで差しかわる。ファイルがない間は、仮の合成音で鳴らす
// スマホのブラウザは、最初に画面にふれる(キーを押す)までは音を出せないので、そこで有効にする
(function () {
  const BASE = "./assets/sound/";
  // 真のエンディング(C)のスタッフロールは公園の遊び場の音、最後の声は赤ちゃんの笑い声(D292。出どころは assets/sound/CREDITS.md)
  // ダイナーのジュークボックスのレコード(D334。出どころは assets/sound/CREDITS.md)。調べるたびに次の 1 枚を、1 回だけかける
  const BGM_FILES = { roll_c: "bgm/park.mp3", haihei: ["bgm/haihei_1.mp3", "bgm/haihei_2.mp3"], juke_1: "bgm/juke_sock_hop.mp3", juke_2: "bgm/juke_surfing.mp3", juke_3: "bgm/juke_sax_rock.mp3" }; // 3 枚目はロックンロール(D342)。Surf Shimmy は取れたら足す // 廃兵院は舞台の楽団の曲(作者がアップロード)。並べると、順にかけてくり返す // 例: { void: "bgm/void.mp3", lake: "bgm/lake.mp3" }
  const SFX_FILES = { baby_laugh: "rec/baby_laugh.mp3" }; // 例: { hyoshigi: "sfx/hyoshigi.mp3" }
  const KEY = "bogidachi.audio.v1";
  const vol = { bgm: 3, sfx: 4 }; // 0〜5
  try {
    Object.assign(vol, JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch (e) {
    // 保存できない環境では、その回かぎり
  }
  let ctx = null;
  let bgmGain = null;
  let sfxGain = null;
  let cur = null; // { key, node, gain, place }
  let placeLv = 1; // 場所による大きさ(0〜1)。楽団から離れるほど小さく、など
  let want = null; // まだ有効になる前に頼まれた BGM
  const buffers = {};
  const level = (v) => (v / 5) ** 2;
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(vol));
    } catch (e) {
      // 保存できなくても続ける
    }
  }
  // iPhone(Safari)は、指を離したとき(touchend / click)でないと音を始めさせない。触れた瞬間に作ると止まったままになり、
  // ずっと無音だった(作者「アイフォンはずっと無音」)。どのきっかけでも、止まっていれば動かし、無音の一瞬を鳴らして目を覚まさせる
  function wake() {
    if (ctx.state !== "running") ctx.resume().catch(() => {});
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(ctx.destination);
    s.start(0);
  }
  function unlock() {
    if (ctx) {
      if (ctx.state !== "running") wake();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    // iPhone のマナーモード(消音スイッチ)のときは鳴らさない(端末の決まりのまま。作者「マナーモードでは鳴らさない」D304)
    ctx = new AC();
    wake();
    bgmGain = ctx.createGain();
    sfxGain = ctx.createGain();
    bgmGain.gain.value = level(vol.bgm) * 0.5;
    sfxGain.gain.value = level(vol.sfx) * 0.7;
    bgmGain.connect(ctx.destination);
    sfxGain.connect(ctx.destination);
    if (want) {
      const k = want;
      want = null;
      bgm(k);
    }
  }
  ["pointerdown", "keydown", "touchstart", "touchend", "pointerup", "click"].forEach((ev) => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  function load(path) {
    if (!buffers[path])
      buffers[path] = fetch(BASE + path)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(path))))
        .then((b) => ctx.decodeAudioData(b))
        .catch(() => null);
    return buffers[path];
  }
  // 仮の BGM: 場所ごとに高さを変えた、静かな持続音(本物の曲が来るまでの目印)
  function droneNode(key) {
    let h = 0;
    for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 997;
    const base = 110 * 2 ** ((h % 12) / 12);
    const out = ctx.createGain();
    out.gain.value = 0.18;
    const oscs = [1, 1.5, 2.01].map((m, i) => {
      const o = ctx.createOscillator();
      o.type = i ? "sine" : "triangle";
      o.frequency.value = base * m;
      const g = ctx.createGain();
      g.gain.value = [0.5, 0.25, 0.12][i];
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07 + i * 0.05;
      const lg = ctx.createGain();
      lg.gain.value = 0.1;
      lfo.connect(lg).connect(g.gain);
      lfo.start();
      o.connect(g).connect(out);
      o.start();
      return [o, lfo];
    });
    out.stop = () => oscs.forEach(([o, l]) => (o.stop(), l.stop()));
    return out;
  }
  // 旋律を音の部品で鳴らす(ファイルなし)。ぱーでれの断片の「遠き山に日は落ちて」(ドヴォルザーク「新世界より」第 2 楽章の旋律。D432)
  // 霧の向こうから聞こえるように、やわらかい音、こもった音色、こだま。1 回ごとに間をあけてくり返す
  const MELODIES = {
    padre: {
      beat: 0.92,
      gap: 7,
      base: 261.63 * 2 ** (1 / 12), // ハ長調より半音上(原曲の変ニ長調)
      // [半音(ドから), 拍]
      // 1 番の終わりまで(フルコーラス D434): 遠き山に / 星は空を / 今日のわざを / 心軽く / 風は涼し / いざや楽しき / まどいせん
      // 中ほどと最後は、楽譜で確かめられず、記憶で組んだ(作者が試し聞きで「よい」)
      notes: [
        [4, 1.5], [7, 0.5], [7, 2], [4, 1.5], [2, 0.5], [0, 2], [2, 1], [4, 1], [7, 1], [4, 1], [2, 4],
        [4, 1.5], [7, 0.5], [7, 2], [4, 1.5], [2, 0.5], [0, 2], [2, 1], [4, 1], [2, 1], [0, 1], [0, 4],
        [9, 1.5], [12, 0.5], [12, 2], [11, 1.5], [7, 0.5], [9, 2], [9, 1], [12, 1], [11, 1], [9, 1], [7, 4],
        [9, 1.5], [12, 0.5], [12, 2], [11, 1.5], [7, 0.5], [9, 2], [9, 1], [12, 1], [11, 1], [7, 1], [4, 4],
        [4, 1.5], [7, 0.5], [7, 2], [4, 1.5], [2, 0.5], [0, 2], [2, 1], [4, 1], [7, 1], [4, 1], [2, 4],
        [4, 1.5], [7, 0.5], [7, 2], [4, 1.5], [2, 0.5], [0, 2], [2, 1], [4, 1], [2, 1], [0, 1], [0, 4],
        [2, 1], [4, 1], [2, 1], [0, 1], [0, 4],
      ],
    },
  };
  function melodyNode(m) {
    const out = ctx.createGain();
    out.gain.value = 0.32;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1500;
    // こだま(遠く、霧の向こう)
    const dl = ctx.createDelay(2);
    dl.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    lp.connect(out);
    lp.connect(dl);
    dl.connect(fb).connect(dl);
    dl.connect(out);
    let timer = null;
    let next = 0; // つぎの回が始まる時刻
    const total = m.notes.reduce((a, n) => a + n[1], 0) * m.beat + m.gap;
    const note = (semi, t0, dur) => {
      const f = m.base * 2 ** (semi / 12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.5, t0 + 0.08);
      g.gain.setTargetAtTime(0.28, t0 + 0.12, 0.4);
      g.gain.setTargetAtTime(0, t0 + dur * 0.92, 0.18);
      g.connect(lp);
      const vib = ctx.createOscillator();
      vib.frequency.value = 4.6;
      const vg = ctx.createGain();
      vg.gain.value = f * 0.004;
      vib.connect(vg);
      [[1, "sine", 1], [2, "triangle", 0.22], [0.5, "sine", 0.18]].forEach(([mul, type, amp]) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f * mul;
        vg.connect(o.frequency);
        const og = ctx.createGain();
        og.gain.value = amp;
        o.connect(og).connect(g);
        o.start(t0);
        o.stop(t0 + dur + 1);
      });
      vib.start(t0);
      vib.stop(t0 + dur + 1);
    };
    const queue = () => {
      // 次の回を、始まる 2 秒前までに並べておく
      while (next < ctx.currentTime + 2) {
        let t = next;
        for (const [semi, b] of m.notes) {
          note(semi, t, b * m.beat);
          t += b * m.beat;
        }
        next += total;
      }
    };
    out.start = () => {
      next = ctx.currentTime + 1.2;
      queue();
      timer = setInterval(queue, 500);
    };
    out.stop = () => {
      clearInterval(timer);
      out.disconnect();
    };
    return out;
  }
  // opts.once: くり返さず 1 回だけかけ、終わったら opts.onEnd(ジュークボックスのレコード)
  function bgm(key, opts = {}) {
    if (!key) return;
    if (!ctx) {
      want = key;
      return;
    }
    if (cur && cur.key === key) return;
    const old = cur;
    const g = ctx.createGain();
    g.gain.value = 0;
    const p = ctx.createGain(); // 場所による大きさ(bgmLevel)
    p.gain.value = placeLv;
    g.connect(p).connect(bgmGain);
    cur = { key, gain: g, node: null, place: p };
    const mine = cur;
    const start = (node) => {
      if (cur !== mine) return node && node.stop && node.stop();
      mine.node = node;
      node.connect(g);
      if (node.start) node.start();
      g.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.4);
    };
    if (key === "silence") {
      // 無音: 前の音を消すだけ(仮の持続音も鳴らさない)
    } else if (Array.isArray(BGM_FILES[key])) {
      // 何曲か: 1 曲目から順にかけて、最後の曲のあとは 1 曲目へ(読めない曲はとばす)
      const files = BGM_FILES[key];
      Promise.all(files.map(load)).then((bufs) => {
        const list = bufs.filter(Boolean);
        if (!list.length) return start(droneNode(key));
        const out = ctx.createGain();
        let src = null;
        let stopped = false;
        const play = (i) => {
          if (stopped) return;
          src = ctx.createBufferSource();
          src.buffer = list[i % list.length];
          src.connect(out);
          src.onended = () => play(i + 1);
          src.start();
        };
        out.start = () => play(0);
        out.stop = () => {
          stopped = true;
          if (src) src.stop();
        };
        start(out);
      });
    } else if (BGM_FILES[key])
      load(BGM_FILES[key]).then((buf) => {
        if (!buf) return start(droneNode(key));
        const s = ctx.createBufferSource();
        s.buffer = buf;
        s.loop = !opts.once;
        if (opts.once)
          s.onended = () => {
            if (cur === mine && opts.onEnd) opts.onEnd();
          };
        start(s);
      });
    else if (MELODIES[key]) start(melodyNode(MELODIES[key]));
    else start(droneNode(key));
    if (old) {
      old.gain.gain.cancelScheduledValues(ctx.currentTime);
      old.gain.gain.setValueAtTime(old.gain.gain.value, ctx.currentTime);
      old.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
      setTimeout(() => old.node && old.node.stop && old.node.stop(), 1400);
    }
  }
  // 場所による BGM の大きさ(毎フレーム呼ばれる。変わったときだけ、なめらかに寄せる)
  function bgmLevel(v) {
    if (Math.abs(v - placeLv) < 0.005) return;
    placeLv = v;
    if (cur && cur.place) cur.place.gain.setTargetAtTime(v, ctx.currentTime, 0.25);
  }
  // 仮の効果音(合成)
  function tone(type, f0, f1, dur, peak, delay = 0) {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(sfxGain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function noise(dur, peak, lp, delay = 0) {
    const t = ctx.currentTime + delay;
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource();
    s.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(sfxGain);
    s.start(t);
  }
  // 紙をめくる音(D326): 高い帯域のこすれ(ザッ)に、紙の繊維のパチパチを混ぜ、最後に軽く落ちる(パサッ)
  function paper() {
    const t = ctx.currentTime;
    const sr = ctx.sampleRate;
    const dur = 0.42;
    const b = ctx.createBuffer(1, Math.floor(sr * dur), sr);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const u = i / sr;
      const swish = u < 0.3 ? Math.sin((Math.PI * u) / 0.3) ** 1.5 : 0; // こすれ: ふくらんで消える
      const land = u > 0.3 ? Math.exp(-(u - 0.3) * 45) : 0; // 落ちる
      const crackle = Math.random() < 0.012 ? 2.5 : 1; // 繊維のパチパチ
      d[i] = (Math.random() * 2 - 1) * (swish * 0.55 * crackle + land * 0.8);
    }
    const s = ctx.createBufferSource();
    s.buffer = b;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900;
    const bp = ctx.createBiquadFilter();
    bp.type = "peaking";
    bp.frequency.value = 4200;
    bp.gain.value = 6;
    const g = ctx.createGain();
    g.gain.value = 0.35;
    s.connect(hp).connect(bp).connect(g).connect(sfxGain);
    s.start(t);
  }
  const SYNTH = {
    hyoshigi: () => (tone("square", 1400, 900, 0.05, 0.3), noise(0.04, 0.4, 4000)),
    clang: () => (tone("square", 880, 860, 0.18, 0.15), tone("sine", 1760, 1700, 0.25, 0.1)),
    boom: () => (noise(1.2, 0.9, 260), tone("sine", 70, 30, 1.0, 0.6)),
    chime: () => (tone("sine", 1880, 1860, 1.4, 0.18), tone("sine", 2820, 2800, 0.9, 0.08, 0.02)),
    oink: () => tone("sawtooth", 260, 160, 0.22, 0.2),
    pop: () => tone("sine", 220, 120, 0.12, 0.35),
    // スポン: 土から抜ける。吸いつく音が高く跳ね上がり、空気の抜ける音と、軽い余韻(ハンガーの畑で引きぬく)
    spon: () => (tone("sine", 260, 1500, 0.06, 0.45), noise(0.035, 0.35, 2500, 0.03), tone("triangle", 700, 520, 0.14, 0.22, 0.05), tone("sine", 140, 90, 0.08, 0.3)),
    item: () => [660, 880, 1320].forEach((f, i) => tone("triangle", f, f, 0.18, 0.18, i * 0.08)),
    observe: () => [880, 1100, 1320, 1760].forEach((f, i) => tone("sine", f, f, 0.5, 0.1, i * 0.12)),
    whir: () => tone("sine", 120, 90, 0.6, 0.2),
    // ミイラさまの声: 低く、かすれた、もごもごした一音(高さを少しずつ変える)
    mumble: () => {
      const f = 105 + Math.random() * 55;
      tone("triangle", f, f * (0.82 + Math.random() * 0.3), 0.1, 0.16);
      noise(0.06, 0.05, 900);
    },
    // メニュー: カーソル、決める、もどる
    cursor: () => tone("square", 1320, 1320, 0.035, 0.07),
    ok: () => (tone("square", 990, 990, 0.05, 0.08), tone("square", 1480, 1480, 0.07, 0.08, 0.05)),
    back: () => (tone("square", 990, 990, 0.05, 0.07), tone("square", 660, 660, 0.07, 0.07, 0.05)),
    // 紙をめくる音(雑誌 D325、D326)
    page: () => paper(),
    // ピンボール(D327)
    pb_flip: () => (noise(0.03, 0.25, 1600), tone("square", 150, 90, 0.04, 0.08)),
    pb_bumper: () => (tone("square", 880, 840, 0.06, 0.1), tone("sine", 1320, 1300, 0.12, 0.08, 0.01)),
    pb_sling: () => (tone("square", 520, 400, 0.04, 0.08), noise(0.02, 0.2, 3000)),
    pb_lane: () => tone("triangle", 1500, 1500, 0.08, 0.1),
    pb_launch: () => (noise(0.25, 0.3, 900), tone("sine", 120, 60, 0.2, 0.15)),
    // ぽんぽんカーの線が張りきる「ビン」(ゴムの弦をはじいた音: 高い音がふるえながら下がる D338)
    // クラクション(2 音の和音、ブリキのおもちゃの車らしい細い音)と空ぶかし(回転が上がって落ちる)。きーが帰るときの抗議(D364)
    // ピンボールのリプレイの音(台の中の木の板を打つノッカー)
    knock: () => (tone("square", 96, 48, 0.14, 0.5), noise(0.07, 0.6, 500)),
    horn: () => (tone("square", 392, 392, 0.32, 0.09), tone("square", 494, 494, 0.32, 0.07)),
    rev: () => (tone("sawtooth", 70, 210, 0.35, 0.16), tone("sawtooth", 210, 80, 0.45, 0.14, 0.35), noise(0.6, 0.18, 700)),
    pon_snap: () => (tone("triangle", 520, 260, 0.45, 0.32), tone("sine", 1040, 300, 0.3, 0.12), tone("square", 130, 70, 0.25, 0.06)),
    shutter: () => (noise(0.03, 0.5, 5000), tone("square", 1800, 1500, 0.02, 0.12), noise(0.04, 0.4, 3000, 0.09)),
  };
  function sfx(name) {
    if (!ctx || !vol.sfx) return;
    if (SFX_FILES[name])
      return load(SFX_FILES[name]).then((buf) => {
        if (!buf) return SYNTH[name] && SYNTH[name]();
        const s = ctx.createBufferSource();
        s.buffer = buf;
        s.connect(sfxGain);
        s.start();
      });
    if (SYNTH[name]) SYNTH[name]();
  }
  // 吹き出しの文字から、効果音を鳴らす(文字は残す)
  const WORD_SFX = [
    [/カチ/, "hyoshigi"],
    [/カン/, "clang"],
    [/ドォン|ドーン/, "boom"],
    [/チリ/, "chime"],
    [/ブヒ/, "oink"],
    [/ポン/, "pop"],
    [/ブン/, "whir"],
  ];
  function fromText(text) {
    for (const [re, name] of WORD_SFX) if (re.test(text)) return sfx(name);
  }
  // ---- ドラッグレースの音(D344): エンジン(相手のマシンごとの音色)、スキール音、ぼぎカーの風 ----
  // 続く音なので、競争の画面が毎コマ race.set() で大きさと回転を渡す。0.4 秒とどかなければ、自分で消える(画面を離れたとき)
  let race = null;
  function loopNoise(sec) {
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource();
    n.buffer = b;
    n.loop = true;
    return n;
  }
  function shaper(k) {
    // ひずみ(爆音らしさ)
    const ws = ctx.createWaveShaper();
    const c = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1;
      c[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    ws.curve = c;
    return ws;
  }
  // kind: v8(赤べこ)、v8big(車箪笥)、pon(ぽんぽんカー)、jet(とりぼぎかー)、bike(こけし)
  function raceStart(kind) {
    if (!ctx) return;
    raceStop();
    const out = ctx.createGain();
    out.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); // 爆音でも割れないように
    out.connect(comp).connect(sfxGain);
    const nodes = [];
    const keep = (n) => (nodes.push(n), n);
    // 左右と距離(D345): 相手の音(エンジン、相手のタイヤ)と、ぼぎカーの音(風、ぼぎカーのタイヤ)を別の道に分ける
    const bus = () => {
      const g = ctx.createGain();
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) g.connect(pan).connect(out);
      else g.connect(out);
      return { g, pan };
    };
    const oppBus = bus();
    const kiBus = bus();
    // エンジン: のこぎり波 2 本 → ひずみ → ローパス。脈(爆発の粒)を音量のゆれで
    const eng = ctx.createGain();
    eng.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    const pulse = ctx.createGain();
    const lfo = keep(ctx.createOscillator());
    lfo.type = kind === "bike" ? "square" : "sine";
    const lfoG = ctx.createGain();
    lfoG.gain.value = kind === "pon" ? 0.9 : kind === "bike" ? 0.6 : 0.35;
    lfo.connect(lfoG).connect(pulse.gain);
    pulse.gain.value = 0.6;
    const o1 = keep(ctx.createOscillator());
    const o2 = keep(ctx.createOscillator());
    o1.type = "sawtooth";
    o2.type = kind === "bike" ? "square" : "sawtooth";
    const dist = shaper(kind === "jet" ? 2 : 14);
    o1.connect(dist);
    o2.connect(dist);
    dist.connect(lp).connect(pulse).connect(eng).connect(oppBus.g);
    // ジェット(とりぼぎかー): 雑音の「シュー」と、高いうなり
    const jetN = keep(loopNoise(1.5));
    const jetBp = ctx.createBiquadFilter();
    jetBp.type = "bandpass";
    jetBp.Q.value = 1.2;
    const jetG = ctx.createGain();
    jetG.gain.value = 0;
    jetN.connect(jetBp).connect(jetG).connect(oppBus.g);
    // スキール音: 高い帯域の雑音を、周波数をうねらせて「キュルルル」
    const sqN = keep(loopNoise(1.3));
    const sqBp = ctx.createBiquadFilter();
    sqBp.type = "bandpass";
    sqBp.frequency.value = 2600;
    sqBp.Q.value = 9;
    const sqLfo = keep(ctx.createOscillator());
    sqLfo.frequency.value = 7;
    const sqLfoG = ctx.createGain();
    sqLfoG.gain.value = 450;
    sqLfo.connect(sqLfoG).connect(sqBp.frequency);
    const sqG = ctx.createGain(); // 相手のタイヤ
    sqG.gain.value = 0;
    const sqKiG = ctx.createGain(); // ぼぎカーのタイヤ
    sqKiG.gain.value = 0;
    sqN.connect(sqBp);
    sqBp.connect(sqG).connect(oppBus.g);
    sqBp.connect(sqKiG).connect(kiBus.g);
    // ぼぎカーの風(動力がないので、エンジンの音はない D123)
    const wN = keep(loopNoise(1.7));
    const wLp = ctx.createBiquadFilter();
    wLp.type = "lowpass";
    const wG = ctx.createGain();
    wG.gain.value = 0;
    wN.connect(wLp).connect(wG).connect(kiBus.g);
    // 排気管の炎の破裂音(D349): 高めの雑音を、毎コマでたらめに開け閉めして「バリバリ」
    const crN = keep(loopNoise(1.1));
    const crHp = ctx.createBiquadFilter();
    crHp.type = "bandpass";
    crHp.frequency.value = 1100;
    crHp.Q.value = 0.8;
    const crG = ctx.createGain();
    crG.gain.value = 0;
    crN.connect(crHp).connect(shaper(30)).connect(crG).connect(oppBus.g);
    nodes.forEach((n) => n.start());
    out.gain.setTargetAtTime(1, ctx.currentTime, 0.05);
    race = { kind, out, eng, o1, o2, lp, lfo, jetBp, jetG, sqG, sqKiG, wLp, wG, oppBus, kiBus, crG, nodes, timer: 0 };
  }
  // p: { rpm 0〜1, eng 0〜1(エンジンの大きさ), squeal 0〜1(相手のタイヤ), squealKi 0〜1(ぼぎカーのタイヤ), wind 0〜1,
  //      oppPan / kiPan -1(左)〜1(右), oppVol / kiVol 0〜1(カメラからの遠さ) }
  function raceSet(p) {
    if (!race) return;
    const r = race;
    const t = ctx.currentTime;
    const rpm = Math.max(0, Math.min(1, p.rpm || 0));
    const base = { v8: 34, v8big: 26, pon: 40, jet: 50, bike: 70 }[r.kind] || 34;
    const f = base + rpm * base * 4;
    const tc = 0.04;
    r.o1.frequency.setTargetAtTime(f, t, tc);
    r.o2.frequency.setTargetAtTime(f * 2.01, t, tc);
    r.lp.frequency.setTargetAtTime(220 + rpm * 2600, t, tc);
    r.lfo.frequency.setTargetAtTime(r.kind === "pon" ? 3 + rpm * 6 : r.kind === "bike" ? 16 + rpm * 14 : f / 4, t, tc);
    const jet = r.kind === "jet";
    r.eng.gain.setTargetAtTime((p.eng || 0) * (jet ? 0.12 : 0.5), t, 0.06);
    r.jetBp.frequency.setTargetAtTime(700 + rpm * 3200, t, tc);
    r.jetG.gain.setTargetAtTime(jet ? (p.eng || 0) * 0.5 : 0, t, 0.06);
    r.sqG.gain.setTargetAtTime((p.squeal || 0) * 0.55, t, 0.05);
    r.wLp.frequency.setTargetAtTime(300 + (p.wind || 0) * 2400, t, 0.08);
    r.wG.gain.setTargetAtTime((p.wind || 0) * 0.35, t, 0.08);
    r.sqKiG.gain.setTargetAtTime((p.squealKi || 0) * 0.45, t, 0.05);
    const cr = p.crackle || 0;
    r.crG.gain.setValueAtTime(Math.random() < cr * 0.85 ? 0.35 + Math.random() * 0.45 : 0, t); // バリバリバリ(D350)
    r.oppBus.g.gain.setTargetAtTime(p.oppVol ?? 1, t, 0.06);
    r.kiBus.g.gain.setTargetAtTime(p.kiVol ?? 1, t, 0.06);
    if (r.oppBus.pan) r.oppBus.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, p.oppPan || 0)), t, 0.06);
    if (r.kiBus.pan) r.kiBus.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, p.kiPan || 0)), t, 0.06);
    clearTimeout(r.timer);
    r.timer = setTimeout(raceStop, 400); // 画面を離れたら消える
  }
  function raceStop() {
    if (!race) return;
    const r = race;
    race = null;
    clearTimeout(r.timer);
    r.out.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    setTimeout(() => r.nodes.forEach((n) => n.stop()), 500);
  }
  function setVolume(kind, v) {
    vol[kind] = Math.max(0, Math.min(5, v));
    save();
    if (ctx) {
      bgmGain.gain.value = level(vol.bgm) * 0.5;
      sfxGain.gain.value = level(vol.sfx) * 0.7;
    }
  }
  window.bogiAudio = { bgm, bgmLevel, sfx, fromText, setVolume, volume: vol, unlock, race: { start: raceStart, set: raceSet, stop: raceStop, kind: () => race && race.kind }, state: () => ({ ctx: ctx && ctx.state, bgm: cur && cur.key, level: placeLv }) };
})();
