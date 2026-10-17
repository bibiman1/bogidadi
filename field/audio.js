// 音(D171、D195)。BGM は場所ごとに切りかえ(重ねて入れかえる)、効果音は名前で鳴らす
// 音のファイル(音楽生成 AI、フリー素材、録音)は BGM_FILES / SFX_FILES に足すだけで差しかわる。ファイルがない間は、仮の合成音で鳴らす
// スマホのブラウザは、最初に画面にふれる(キーを押す)までは音を出せないので、そこで有効にする
(function () {
  const BASE = "./assets/sound/";
  // 真のエンディング(C)のスタッフロールは公園の遊び場の音、最後の声は赤ちゃんの笑い声(D292。出どころは assets/sound/CREDITS.md)
  const BGM_FILES = { roll_c: "bgm/park.mp3", haihei: ["bgm/haihei_1.mp3", "bgm/haihei_2.mp3"] }; // 廃兵院は舞台の楽団の曲(作者がアップロード)。並べると、順にかけてくり返す // 例: { void: "bgm/void.mp3", lake: "bgm/lake.mp3" }
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
  function bgm(key) {
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
        s.loop = true;
        start(s);
      });
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
  const SYNTH = {
    hyoshigi: () => (tone("square", 1400, 900, 0.05, 0.3), noise(0.04, 0.4, 4000)),
    clang: () => (tone("square", 880, 860, 0.18, 0.15), tone("sine", 1760, 1700, 0.25, 0.1)),
    boom: () => (noise(1.2, 0.9, 260), tone("sine", 70, 30, 1.0, 0.6)),
    chime: () => (tone("sine", 1880, 1860, 1.4, 0.18), tone("sine", 2820, 2800, 0.9, 0.08, 0.02)),
    oink: () => tone("sawtooth", 260, 160, 0.22, 0.2),
    pop: () => tone("sine", 220, 120, 0.12, 0.35),
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
    // 紙をめくる「パラッ」(雑誌 D325): 速く強いこすれのあと、軽く落ちる音
    page: () => (noise(0.09, 0.22, 5200), noise(0.14, 0.12, 2200, 0.07), tone("sine", 180, 120, 0.06, 0.05, 0.16)),
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
  function setVolume(kind, v) {
    vol[kind] = Math.max(0, Math.min(5, v));
    save();
    if (ctx) {
      bgmGain.gain.value = level(vol.bgm) * 0.5;
      sfxGain.gain.value = level(vol.sfx) * 0.7;
    }
  }
  window.bogiAudio = { bgm, bgmLevel, sfx, fromText, setVolume, volume: vol, unlock, state: () => ({ ctx: ctx && ctx.state, bgm: cur && cur.key, level: placeLv }) };
})();
