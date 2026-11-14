// 足もと(D743、todo 321): きーが通ると、地面が応えて、少しして元に戻る。字も音も足さない。
// きーには足がないので、雪に残るのは足あとではなく、体で押したなめらかな一すじ。
// 地面の色は、地面を描いた直後の画面から、きーの足もとの 1 点を読んで決める(背景の絵はそのまま)。
(function () {
  const now = () => performance.now() / 1000;
  // 地面を描いた直後の画面の、背景の点 (x, y) の色。画面から読むのは重いので、
  // 一度読んだ所は覚えておく(地面は動かない。マップごと、2 ドットのます目で)
  const sample = (ctx, x, y, memo, key) => {
    const k = memo && key && `${Math.round(key[0] / 2)},${Math.round(key[1] / 2)}`;
    if (k && memo.has(k)) return memo.get(k);
    const c = read(ctx, x, y);
    if (k && c) memo.set(k, c);
    return c;
  };
  const read = (ctx, x, y) => {
    const m = ctx.getTransform();
    const dx = Math.round(m.a * x + m.e), dy = Math.round(m.d * y + m.f);
    if (dx < 0 || dy < 0 || dx >= ctx.canvas.width || dy >= ctx.canvas.height) return null;
    const d = ctx.getImageData(dx, dy, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const isSnow = (c) => c && c[0] > 196 && c[1] > 204 && c[2] > 212 && Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) < 40;
  const isLeaf = (c) => c && c[0] > 125 && c[0] - c[2] > 80 && c[0] - c[1] > 30; // 赤と橙と黄の葉(下草のオリーブ色は入れない)

  // 雪の一すじ: 押した所は青い影でへこみ、ふちの下側だけ白く盛り上がる。4 秒そのまま、8 秒かけて埋まる
  function snowTrail(memo) {
    let pts = [], last = null, buf = null, rim = null, floor = null;
    return (ctx, ox, oy, api) => {
      const p = api.player();
      const t = now();
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 40) last = { x: p.x, y: p.y }; // 跳んだ、置き直した
      else if (Math.hypot(p.x - last.x, p.y - last.y) >= 3) {
        const c = sample(ctx, p.x + ox, p.y + oy - 1, memo, [p.x, p.y - 1]);
        if (isSnow(c)) pts.push({ x: p.x, y: p.y, t, j: [0, 1, 0, -1, 1, 0, 0, -1][pts.length % 8], link: pts.length && pts[pts.length - 1].t > t - 0.4 });
        last = { x: p.x, y: p.y };
      }
      pts = pts.filter((q) => t - q.t < 12);
      if (!pts.length) return;
      // 一すじを一様な色で描くため、いったん別の紙に型を押してから重ねる(重なっても濃くならない)
      const m = ctx.getTransform();
      const W = Math.ceil(ctx.canvas.width / m.a), H = Math.ceil(ctx.canvas.height / m.d);
      if (!buf || buf.width !== W || buf.height !== H) (buf = document.createElement("canvas")), (buf.width = W), (buf.height = H), (rim = document.createElement("canvas")), (rim.width = W), (rim.height = H), (floor = document.createElement("canvas")), (floor.width = W), (floor.height = H);
      const g = buf.getContext("2d"), r = rim.getContext("2d"), f = floor.getContext("2d");
      g.clearRect(0, 0, W, H);
      r.clearRect(0, 0, W, H);
      f.clearRect(0, 0, W, H);
      // 背景の雪と同じ色だけを使う(bg_farm の雪の段: 236 / 210 / 179)
      f.fillStyle = "rgb(210, 221, 238)"; // へこみの底
      g.fillStyle = "rgb(179, 198, 226)"; // へこみのかべ(左上は影になる)
      r.fillStyle = "rgb(248, 250, 255)"; // 押しのけた雪のふち(右下に光る)
      // 雪が埋まっていく: 4 秒は同じ幅、そのあと 8 秒かけて細くなって消える
      const stamp = (c, x, y, rx, ry) => {
        for (let dy = -ry; dy <= ry; dy++) {
          const hw = Math.round(rx * Math.sqrt(1 - (dy / (ry + 0.5)) ** 2));
          if (hw > 0) c.fillRect(x - hw, y + dy, hw * 2, 1);
        }
      };
      let prev = null;
      for (const q of pts) {
        const age = t - q.t;
        const k = age < 4 ? 1 : 1 - (age - 4) / 8;
        const rx = Math.round((8 + q.j) * k), ry = Math.max(1, Math.round(3 * k));
        const steps = q.link && prev ? Math.ceil(Math.hypot(q.x - prev.x, q.y - prev.y)) : 1;
        for (let i = 1; i <= steps; i++) {
          const x = Math.round((prev && q.link ? prev.x + (q.x - prev.x) * (i / steps) : q.x) + ox);
          const y = Math.round((prev && q.link ? prev.y + (q.y - prev.y) * (i / steps) : q.y) + oy);
          if (rx > 0) stamp(r, x + 1, y + 1, rx, ry), stamp(g, x, y, rx, ry);
          if (rx > 1) stamp(f, x + 1, y + 1, rx - 1, Math.max(1, ry - 1));
        }
        prev = q;
      }
      ctx.save();
      ctx.drawImage(rim, 0, 0);
      ctx.drawImage(buf, 0, 0);
      ctx.drawImage(floor, 0, 0);
      ctx.restore();
    };
  }

  // 落ち葉: 葉の上を進むと、前の足もとから葉が 1、2 枚はねて、ひらひら落ちて、しばらくして地面にまぎれる
  function leafKick(memo) {
    let ps = [], last = null, next = 0;
    return (ctx, ox, oy, api) => {
      const p = api.player();
      const t = now();
      const moved = last && Math.hypot(p.x - last.x, p.y - last.y);
      if (moved > 0.5 && moved < 40 && t > next) {
        // 足もとのまわり 7 点を見て、葉の数だけはねる(葉の上なら多く、アスファルトのすきまなら少し)
        const dir = Math.atan2(p.y - last.y, p.x - last.x);
        const found = [];
        for (let i = 0; i < 7; i++) {
          const dx = -Math.cos(dir) * 14 + (i - 3) * 3, dy = ((i * 5) % 7) - 3;
          const c = sample(ctx, p.x + ox + dx, p.y + oy + dy, memo, [p.x + dx, p.y + dy]);
          if (isLeaf(c)) found.push(c);
        }
        if (found.length) {
          const n = Math.min(3, Math.ceil(found.length / 2));
          for (let i = 0; i < n; i++) {
            const side = Math.random() < 0.5 ? -1 : 1;
            const a = dir + Math.PI + side * (0.4 + Math.random() * 0.7); // うしろへ、ななめに
            ps.push({ x: p.x - Math.cos(dir) * 15, y: p.y - Math.sin(dir) * 5, vx: Math.cos(a) * 30, vy: Math.sin(a) * 12, z: 0, vz: 55 + Math.random() * 25, t0: t, c: found[i % found.length], ph: Math.random() * 6 });
          }
          next = t + 0.14 + Math.random() * 0.12;
        }
      }
      last = { x: p.x, y: p.y };
      ps = ps.filter((q) => t - q.t0 < 5);
      for (const q of ps) {
        if (!q.done) {
          const dt = Math.min(0.05, t - (q.tl || q.t0));
          q.tl = t;
          q.vz -= 150 * dt;
          q.z = Math.max(0, q.z + q.vz * dt);
          const flutter = q.vz < 0 ? Math.sin((t - q.t0) * 9 + q.ph) * 14 : 0;
          if (q.vz < 0) q.vz = Math.max(q.vz, -16); // 落ちるときはひらひら、ゆっくり
          q.x += (q.vx * 0.9 + flutter) * dt;
          q.y += q.vy * dt;
          q.vx *= 0.97;
          q.vy *= 0.97;
          if (q.z <= 0 && q.vz < 0) (q.done = true), (q.tLand = t);
        }
        const fade = q.done ? Math.max(0, 1 - (t - q.tLand) / 2.5) : 1;
        if (fade <= 0) continue;
        const sx = Math.round(q.x + ox), sy = Math.round(q.y + oy - q.z);
        if (!q.done) {
          // 宙にあるあいだは、地面に小さな影(浮いているのがわかる)
          ctx.fillStyle = "rgba(30, 25, 10, 0.35)";
          ctx.fillRect(Math.round(q.x + ox) - 1, Math.round(q.y + oy) + 1, 2, 1);
        }
        ctx.fillStyle = `rgba(${q.c[0]}, ${q.c[1]}, ${q.c[2]}, ${fade})`;
        const flip = !q.done && Math.floor((t - q.t0) * 10 + q.ph) % 2;
        // 舞っているあいだは、表と横向きを交互に見せる(ひらひら)
        if (flip) ctx.fillRect(sx, sy - 1, 1, 3);
        else ctx.fillRect(sx - 1, sy, 3, 1), ctx.fillRect(sx, sy - 1, 1, 3);
        ctx.fillStyle = `rgba(60, 30, 15, ${0.6 * fade})`;
        if (!flip) ctx.fillRect(sx + 1, sy + 1, 1, 1);
      }
    };
  }

  // 雨の道: 体が弾むたびに、足もとで小さなしぶきがはねて、輪が広がる
  function rainSplash() {
    let ss = [], last = null, next = 0;
    return (ctx, ox, oy, api) => {
      const p = api.player();
      const t = now();
      const moved = last && Math.hypot(p.x - last.x, p.y - last.y);
      if (moved > 0.5 && moved < 40 && t > next) {
        ss.push({ x: p.x + (Math.random() * 6 - 3), y: p.y, t0: t, d: [0, 1, 2, 3].map((i) => ({ a: Math.PI * (0.15 + 0.7 * Math.random()) * (i % 2 ? 1 : -1) + (i % 2 ? 0 : Math.PI), v: 18 + Math.random() * 14 })) });
        next = t + 0.26;
      }
      last = { x: p.x, y: p.y };
      ss = ss.filter((s) => t - s.t0 < 0.9);
      for (const s of ss) {
        const age = t - s.t0;
        const sx = Math.round(s.x + ox), sy = Math.round(s.y + oy);
        const r = 3 + age * 16;
        ctx.strokeStyle = `rgba(200, 210, 225, ${0.5 * (1 - age / 0.9)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(sx + 0.5, sy + 0.5, r, r * 0.38, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (age < 0.35) {
          ctx.fillStyle = `rgba(225, 232, 240, ${0.9 * (1 - age / 0.35)})`;
          for (const d of s.d) {
            const dx = Math.cos(d.a) * d.v * age;
            const dz = 60 * age - 200 * age * age;
            ctx.fillRect(Math.round(sx + dx), Math.round(sy - Math.max(0, dz)), 1, 1);
          }
        }
      }
    };
  }

  const wrap = (w, m, make) => {
    const map = window.BOGI_WORLDS[w] && window.BOGI_WORLDS[w].maps[m];
    if (!map) return console.warn("ashi: no map", w, m);
    const g = map.drawGround, fx = make(new Map());
    map.drawGround = (ctx, ox, oy, img, api) => {
      if (g) g.call(map, ctx, ox, oy, img, api); // 地面の描き方は map を this に使うことがある
      if (api) fx(ctx, ox, oy, api);
    };
  };
  ["shore", "farm", "canal", "steps"].forEach((m) => wrap("banana", m, snowTrail));
  ["road", "lake"].forEach((m) => wrap("lake", m, snowTrail));
  ["akiRoad", "akiLake", "akiWind"].forEach((m) => wrap("nagato", m, leafKick)); // 地面が落ち葉の画面(ほうとう屋の中と白い所は足さない)
  wrap("kinsei", "sando", rainSplash);
})();
