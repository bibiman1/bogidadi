// 生き物と虹(todo 326、D749、D750): 本物の生き物を、その場所にしかいない形で少しだけ。きーがいてもいなくても、勝手に生きている。
// TRIAL を true にすると、まれな出来事の間隔を短くする(試し絵を撮るとき。docs/record/2026-11-16/ikimono/)。
(function () {
  const TRIAL = false;
  const now = () => performance.now() / 1000;
  const px = (ctx, x, y, w, h, c) => ((ctx.fillStyle = c), ctx.fillRect(Math.round(x), Math.round(y), w, h));
  const rnd = (a, b) => a + Math.random() * (b - a);

  // 1 霞ヶ浦の蓮田: 雁の列がときどき空を渡り、影が田を横切る。しばらく立ち止まると、田の水面に虹が映る
  function lotus() {
    const GAP = TRIAL ? 9 : 40, IDLE = TRIAL ? 2.5 : 15;
    let t0 = now() + 1, still = 0, last = null, lastT = now(), rb = 0, rbOn = false, rbDone = 0, mask = null, maskKey = "", buf = null;
    return (ctx, ox, oy, api) => {
      const t = now(), dt = Math.min(0.1, t - lastT);
      lastT = t;
      const p = api.player();
      if (last && Math.hypot(p.x - last.x, p.y - last.y) > 0.3) still = 0;
      else still += dt;
      last = { x: p.x, y: p.y };
      // 虹: 立ち止まって IDLE 秒で、3 秒かけて現れ、8 秒ほど映って、4 秒で消える。動けば消えはじめる
      if (!rbOn && still > IDLE && t > rbDone) (rbOn = true), (rb = 0);
      if (rbOn) {
        rb += dt;
        if (still < 0.1 && rb < 11) rb = Math.max(rb, 11);
        if (rb > 15) (rbOn = false), (rbDone = t + (TRIAL ? 4 : 60));
      }
      const a = !rbOn ? 0 : rb < 3 ? rb / 3 : rb < 11 ? 1 : 1 - (rb - 11) / 4;
      if (a > 0) {
        const c = ctx.canvas, m = ctx.getTransform();
        const key = ox + "," + oy;
        if (!mask || key !== maskKey) {
          // 水面(桃色と藤色)の点だけを型にする。畦、蓮の茎、きーには映さない
          const d = ctx.getImageData(0, 0, c.width, c.height);
          const md = new ImageData(c.width, c.height);
          for (let i = 0; i < d.data.length; i += 4) {
            const r = d.data[i], g = d.data[i + 1], b = d.data[i + 2];
            if (r > 130 && b > g + 6 && b > 150) md.data[i + 3] = 255;
          }
          mask = document.createElement("canvas");
          mask.width = c.width;
          mask.height = c.height;
          mask.getContext("2d").putImageData(md, 0, 0);
          maskKey = key;
        }
        if (!buf || buf.width !== c.width || buf.height !== c.height) (buf = document.createElement("canvas")), (buf.width = c.width), (buf.height = c.height);
        const g = buf.getContext("2d");
        g.globalCompositeOperation = "source-over";
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, buf.width, buf.height);
        g.setTransform(m);
        // 水に映った虹: 大きな弧の上の部分が、田を斜めにまたぐ。帯は 7 色、さざ波で行ごとにゆれる
        const cx = 240, cy = 440, R = 320; // 水に映る虹は、見る人について動く(画面に対して決める)
        const cols = ["255,70,70", "255,160,60", "255,235,90", "110,220,110", "90,170,255", "100,110,230", "170,100,220"];
        for (let y = 0; y < c.height / m.d; y++) {
          const sh = Math.sin(t * 2.2 + y * 0.7) * 0.8;
          cols.forEach((col, i) => {
            const r = R - i * 2.2;
            const dy = cy - y;
            if (dy <= 0 || dy > r) return;
            const hw = Math.sqrt(r * r - dy * dy), hw2 = Math.sqrt(Math.max(0, (r - 2.2) ** 2 - dy * dy));
            g.fillStyle = `rgba(${col}, 0.36)`;
            g.fillRect(cx - hw + sh, y, hw - hw2, 1);
            g.fillRect(cx + hw2 + sh, y, hw - hw2, 1);
          });
        }
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = "destination-in";
        g.drawImage(mask, 0, 0);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = a;
        ctx.drawImage(buf, 0, 0);
        ctx.restore();
      }
      // 雁の列(7 羽の V 字)。右下から左上へ。影は少し下の田に落ちる
      const k = (t - t0) % GAP, dur = 7.5;
      if (k > 0 && k < dur) {
        const q = k / dur;
        const lx = 470 - ox * 0 + (-560) * q, ly = 520 - 420 * q; // 地図の座標
        const dx = -0.8, dy = -0.6;
        for (let i = 0; i < 7; i++) {
          const n = Math.ceil(i / 2), s = i % 2 ? 1 : -1;
          const bx = lx - dx * n * 13 + -dy * s * n * 10, by = ly - dy * n * 13 + dx * s * n * 10;
          // 影
          px(ctx, bx + ox + 26, by + oy + 70, 6, 2, "rgba(60, 30, 50, 0.2)");
          const up = Math.floor(t * 4 + i * 0.7) % 2;
          const X = Math.round(bx + ox), Y = Math.round(by + oy), C = "#2e2228";
          px(ctx, X - 1, Y, 3, 2, C); // 胴
          px(ctx, X - 3, Y + 1, 1, 1, C); // 首(進む向き = 左上)
          if (up) px(ctx, X - 2, Y - 3, 2, 3, C), px(ctx, X + 1, Y - 3, 2, 3, C);
          else px(ctx, X - 4, Y + 1, 3, 1, C), px(ctx, X + 2, Y + 1, 3, 1, C);
        }
      }
    };
  }

  // 2 長門の秋の峠道: 赤とんぼ 3 匹。止まっては飛び、ときどき標識の先にとまる
  function akiRoad() {
    const SIGN = { x: 397, y: 377 };
    const fs = [0, 1, 2].map((i) => ({ x: 200 + i * 80, y: 350 + i * 25, tx: 0, ty: 0, until: 0, perch: false, h: 1 }));
    return (ctx, ox, oy) => {
      const t = now();
      fs.forEach((f, i) => {
        if (t > f.until) {
          f.perch = i === 0 && !f.perch && Math.random() < 0.6;
          if (f.perch) (f.tx = SIGN.x), (f.ty = SIGN.y), (f.until = t + rnd(2.5, 4));
          else (f.tx = rnd(160, 450)), (f.ty = rnd(330, 440)), (f.until = t + rnd(0.8, 2.2));
        }
        const ddx = f.tx - f.x, ddy = f.ty - f.y, dd = Math.hypot(ddx, ddy);
        if (dd > 1) {
          const v = Math.min(dd, 4.5);
          f.x += (ddx / dd) * v;
          f.y += (ddy / dd) * v;
          f.h = ddx < 0 ? -1 : 1;
        }
        const hover = dd <= 1 && !f.perch ? Math.sin(t * 9 + i) * 0.6 : 0;
        const X = Math.round(f.x + ox), Y = Math.round(f.y + oy + hover);
        // 絵は実物より大きめ(画面で読めるように)。胴 7 ドット、はね 4 枚
        px(ctx, X - 3, Y + 10, 7, 1, "rgba(30, 20, 10, 0.22)"); // 影
        const hd = f.h > 0 ? X + 3 : X - 4;
        px(ctx, f.h > 0 ? X - 4 : X - 2, Y, 7, 1, "#d8402a"); // 胴
        px(ctx, f.h > 0 ? X - 4 : X + 4, Y, 1, 1, "#8a1a10"); // 尾の先
        px(ctx, hd, Y - 1, 2, 2, "#7a2014"); // 頭
        const flick = f.perch ? 0 : Math.floor(t * 30 + i) % 2;
        ctx.fillStyle = f.perch ? "rgba(240, 244, 250, 0.75)" : flick ? "rgba(240, 244, 250, 0.9)" : "rgba(240, 244, 250, 0.4)";
        const wx = f.h > 0 ? X : X - 1;
        if (f.perch || flick) ctx.fillRect(wx - 3, Y - 2, 3, 1), ctx.fillRect(wx + 1, Y - 2, 3, 1), ctx.fillRect(wx - 3, Y + 1, 3, 1), ctx.fillRect(wx + 1, Y + 1, 3, 1);
        else ctx.fillRect(wx - 1, Y - 3, 1, 2), ctx.fillRect(wx + 1, Y - 3, 1, 2);
      });
    };
  }

  // 3 廃兵院の庭: すずめ 4 羽が地面をついばむ。きーが近づくと、ぱっと立って木の枝へ。離れてしばらくすると戻る
  function yard() {
    const HOME = { x: 410, y: 470 } /* 車いすと屋台のあいだの空き地(松葉杖の前に重ならない) */, TREE = { x: 262, y: 336 };
    const ss = [0, 1, 2, 3].map((i) => ({ x: HOME.x + i * 9 - 12, y: HOME.y + (i % 2) * 6, hx: i * 9 - 12, hy: (i % 2) * 6, fly: null, onTree: false, next: 0, h: i % 2 ? 1 : -1 }));
    let away = 0, lastT = now();
    return (ctx, ox, oy, api) => {
      const t = now(), dt = Math.min(0.1, t - lastT);
      lastT = t;
      const p = api.player();
      const near = Math.hypot(p.x - HOME.x, p.y - HOME.y) < 64;
      away = near ? 0 : away + dt;
      ss.forEach((s, i) => {
        if (!s.fly && !s.onTree && near) s.fly = { t0: t + i * 0.06, fx: s.x, fy: s.y, tx: TREE.x + i * 7 - 10, ty: TREE.y + (i % 2) * 3, up: true };
        if (!s.fly && s.onTree && away > (TRIAL ? 3 : 8)) s.fly = { t0: t + i * 0.4, fx: s.x, fy: s.y, tx: HOME.x + s.hx, ty: HOME.y + s.hy, up: false };
        let hop = 0, flying = false;
        if (s.fly && t > s.fly.t0) {
          const q = Math.min(1, (t - s.fly.t0) / 0.9);
          s.x = s.fly.fx + (s.fly.tx - s.fly.fx) * q;
          s.y = s.fly.fy + (s.fly.ty - s.fly.fy) * q - Math.sin(q * Math.PI) * 24;
          s.h = s.fly.tx < s.fly.fx ? -1 : 1;
          flying = q < 1;
          if (q >= 1) (s.onTree = s.fly.up), (s.fly = null);
        } else if (!s.fly && !s.onTree && t > s.next) {
          s.next = t + rnd(0.4, 1.6);
          if (Math.random() < 0.4) (s.x += rnd(-3, 3)), (s.y += rnd(-2, 2)), (s.h = Math.random() < 0.5 ? -1 : 1);
        }
        const peck = !flying && !s.onTree && Math.floor(t * 4 + i * 1.3) % 3 === 0;
        const X = Math.round(s.x + ox), Y = Math.round(s.y + oy);
        if (!s.onTree) px(ctx, X - 1, Y + 1 + (flying ? 10 : 0), 3, 1, "rgba(60, 30, 10, 0.3)");
        px(ctx, X - 2, Y - 2, 4, 3, "#5a3a22"); // 胴(地面の橙に沈まないよう、濃い茶)
        px(ctx, X - 1, Y, 3, 1, "#e8d6b8"); // 腹
        px(ctx, X - 2 * s.h - (s.h < 0 ? 1 : 0), Y + 1, 1, 1, "#3a2414"); // 尾
        const hx = X + (s.h > 0 ? 2 : -3), hy = Y - 3 + (peck ? 2 : 0);
        px(ctx, hx, hy, 2, 2, "#3a2414"); // 頭
        px(ctx, hx + (s.h > 0 ? 0 : 1), hy + 1, 1, 1, "#f2ead8"); // ほお
        if (flying) px(ctx, X - 4, Y - 3 - (Math.floor(t * 16) % 2) * 2, 8, 1, "#4a2e1a"); // はばたき
      });
    };
  }

  // 4 呪いの野犬の峠: 白い花のあいだを、紋白蝶が 2 匹ひらひら
  function pass() {
    const bs = [{ cx: 235, cy: 132, rx: 46, ry: 30, w: 0.6 }, { cx: 70, cy: 138, rx: 30, ry: 26, w: 0.8 }]; // 花の上から、道の上へ出ては戻る(白い花の上だけだと見えない)
    return (ctx, ox, oy) => {
      const t = now();
      bs.forEach((b, i) => {
        const x = b.cx + Math.sin(t * b.w + i) * b.rx + Math.sin(t * 2.7 + i) * 4;
        const y = b.cy + Math.sin(t * b.w * 1.7 + i * 2) * b.ry + Math.sin(t * 5.3 + i) * 2;
        const X = Math.round(x + ox), Y = Math.round(y + oy);
        const open = Math.floor(t * 9 + i) % 2;
        px(ctx, X - 1, Y + 9, 2, 1, "rgba(20, 30, 20, 0.25)");
        px(ctx, X, Y - 1, 1, 4, "#3a3a32");
        if (open) px(ctx, X - 4, Y - 3, 4, 3, "#f6f6ee"), px(ctx, X + 1, Y - 3, 4, 3, "#f6f6ee"), px(ctx, X - 3, Y, 3, 2, "#e8e8dc"), px(ctx, X + 1, Y, 3, 2, "#e8e8dc"), px(ctx, X - 4, Y - 3, 1, 1, "#4a4a42"), px(ctx, X + 4, Y - 3, 1, 1, "#4a4a42"), px(ctx, X - 2, Y - 2, 1, 1, "#6a6a60"), px(ctx, X + 2, Y - 2, 1, 1, "#6a6a60");
        else px(ctx, X - 1, Y - 4, 1, 4, "#f6f6ee"), px(ctx, X + 1, Y - 4, 1, 4, "#e6e6dc"), px(ctx, X - 1, Y - 4, 1, 1, "#4a4a42");
      });
    };
  }

  // 5 南極の浜: 海の上を、カモメ(南極にもいるミナミオオセグロカモメ: 体は白、翼の上は黒)が一羽すべっていく(まれに)
  function shore() {
    const GAP = TRIAL ? 9 : 30;
    return (ctx, ox, oy) => {
      const t = now(), k = t % GAP, dur = 7; // ゆっくりすべる
      if (k > dur) return;
      const q = k / dur;
      const x = 840 - 560 * q, y = 322 + Math.sin(q * 6) * 4; // 海の上(白い雪の上では見えない)
      const X = Math.round(x + ox), Y = Math.round(y + oy);
      // 斜め上から見た「へ」の字の翼(広げて 31 ドット。きーと並べても小さすぎない大きさ)。白い体が暗い海に、黒い翼が流氷に、どちらかが必ず浮く
      px(ctx, X - 13, Y + 22, 27, 2, "rgba(10, 25, 50, 0.4)"); // 影
      const ph = q > 0.06 && q < 0.32 ? Math.floor(t * 6) % 3 : 1; // 0 上げ 1 すべる 2 下げ
      const K = "#26262c", Wt = "#fbfbf8", Y0 = Y;
      const lift = [-4, 0, 3][ph];
      // 翼(左右、内から外へ)。内側は体の高さ、外側ほど lift だけ上下する
      for (const sg of [-1, 1]) {
        for (let i = 1; i <= 15; i++) {
          const x = X + sg * i - (sg < 0 ? 1 : 0);
          const dy = i <= 4 ? -1 : i <= 10 ? -2 - Math.round((i - 4) / 3) + Math.round((lift * (i - 4)) / 11) : -3 + lift + Math.round((i - 10) / 3);
          px(ctx, x, Y0 + dy, 1, 2, K);
          if (i <= 11) px(ctx, x, Y0 + dy + 2, 1, 1, i >= 10 ? K : "#d8dade"); // 翼のうしろのふち
        }
      }
      px(ctx, X - 3, Y0, 7, 3, Wt); // 体
      px(ctx, X - 6, Y0, 3, 2, Wt); // 頭(左へ進む)
      px(ctx, X - 8, Y0 + 1, 2, 1, "#f0c040"); // くちばし
      px(ctx, X + 4, Y0, 3, 2, Wt); // 尾
    };
  }

  const wrap = (w, m, make) => {
    const M = window.BOGI_WORLDS[w].maps[m];
    const g = M.drawOverlay, fx = make();
    M.drawOverlay = function (ctx, ox, oy, t, api) {
      if (g) g.call(M, ctx, ox, oy, t, api);
      if (api) fx(ctx, ox, oy, api);
    };
  };
  wrap("kasumi", "lotus", lotus);
  wrap("nagato", "akiRoad", akiRoad);
  wrap("haihei", "yard", yard);
  wrap("noroi", "pass", pass);
  wrap("banana", "shore", shore);
})();
