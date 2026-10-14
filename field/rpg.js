// 断片世界(見下ろし型RPG)のエンジン。
// 懲罰空間(field/app/)の中で、断片に触れたときに遷移する別世界を動かす。
// 世界の中身(マップ・オブジェクト・イベント)は field/worlds/ に、断片ごとのファイルで書く。
//
// 1つの世界は複数のマップを持ち、出入口(warp)でつながる。
// 言葉にたよらず見せるための道具: 吹き出し(bubble)、一枚絵(show)、カメラ(pan)。
// 絵の版の番号: index.html が rpg.js に付けた ?v= を、そのまま絵にも付ける
const ASSET_V = (() => {
  try {
    return new URL(document.currentScript.src).searchParams.get("v") || "";
  } catch (e) {
    return "";
  }
})();
(function () {
  "use strict";

  const SPEED = 150; // px / sec
  const ICE_ACCEL = 1.6; // 氷の上: 入力への追従がゆるく、すべる
  const FEET_W = 22;
  const FEET_H = 10;
  const DIR_ROW = { south: 0, north: 1, east: 2, west: 3 };
  // 世界は2倍に拡大して描く(スーファミ風に、ドットを大きく見せる)
  const ZOOM = 2;

  function createRPG({ ctx, VW, VH, host }) {
    // 見える広さ(マップの px)。カメラの寄り・引き(camPath の z)のあいだだけ変わる
    let vw = VW / ZOOM;
    let vh = VH / ZOOM;
    const images = {};
    let world = null;
    let map = null;
    let player = null;
    let nearObj = null;
    let bubbles = [];
    let cutscene = null; // { img, t0, onDone }
    let pan = null; // { y, t0, hold, onDone }
    let flash = null; // { t0, sec } 白い光が引いていく(マップが切りかわっても残る)
    let shake = null; // { t0, sec, amp } 画面のゆれ
    let freezeUntil = 0; // この時刻まで、きーを動かせない(演出の途中)
    let held = null; // { img, t0, sec, onDone } 手に入れた物を、きーの頭の上に掲げて見せる
    let observeFx = null; // { t0 } 見届けたしるし: 小さな光が、きーに降りてくる(D189)
    let toast = null; // { text, until }
    let toastQueue = []; // 出ている間に来た表示は、順に出す(拾った物と、断片を終えたのが重なるとき)
    let clock = 0;
    let lastCamY = null;
    let lastCam = null; // ふだんのカメラの中心 { x, y }
    let camPath = null; // { keys: [{ t, x, y, z }], t0, onDone } 見せ場のカメラワーク
    let lastClosed = null; // 最後に閉じた一枚絵 { img, t }(同じ絵の二重表示を防ぐ)
    const flakes = [];
    for (let i = 0; i < 90; i++) {
      flakes.push({ x: Math.random() * vw, y: Math.random() * vh, s: 1 + Math.random() * 2, v: 18 + Math.random() * 30, p: Math.random() * 6 });
    }

    // 名前が同じでも、断片がちがえば別の絵(霞ヶ浦と南極の bg_shore など)。出どころが変わったら読み直す
    function loadImage(key, src) {
      // 絵にも、このスクリプトと同じ版の番号を付ける(同じ名前の絵を描き直したとき、古い絵がキャッシュに残らないように)
      if (ASSET_V && !src.includes("?")) src += `?v=${ASSET_V}`;
      if (images[key] && images[key].src === src) return;
      const img = new Image();
      const e = { img, src, loaded: false, done: false };
      images[key] = e;
      img.onload = () => {
        e.loaded = true;
        e.done = true;
      };
      img.onerror = () => {
        e.done = true; // 読めなくても待ち続けない
      };
      img.src = src;
    }

    // いまの世界の画像がすべて読み終わったら cb を呼ぶ(最長 maxMs まで待つ)
    function whenReady(cb, maxMs = 8000) {
      const t0 = performance.now();
      const keys = world ? Object.keys(world.images) : [];
      const check = () => {
        const ok = keys.every((k) => !images[k] || images[k].done);
        if (ok || performance.now() - t0 > maxMs) cb();
        else setTimeout(check, 50);
      };
      check();
    }

    function img(key) {
      const e = images[key];
      return e && e.loaded ? e.img : null;
    }

    // ---- イベント側から触る窓口 ----
    function makeApi() {
      const w = world;
      const key = (name) => `${w.id}.${name}`;
      const api = {
        // 吹き出し。who: "player" またはオブジェクトid
        // 効果音を名前で鳴らす(D195)
        sfx(name) {
          if (window.bogiAudio) window.bogiAudio.sfx(name);
        },
        bubble(who, text, ms = 2600) {
          if (window.bogiAudio && typeof text === "string") window.bogiAudio.fromText(text);
          bubbles = bubbles.filter((b) => b.who !== who);
          bubbles.push({ who, text, until: clock + ms / 1000 });
        },
        // きーのつぶやき
        mutter(text, ms) {
          api.bubble("player", text, ms);
        },
        // 一枚絵。A / Enter で閉じる。{ full: true } なら余白なしで画面いっぱいに(キメの一枚絵)
        // { into: { map, spawn } } なら、閉じたときに暗転せず、絵の上から次のマップへじかに重ねて移す(前のマップを見せない)
        show(imgKey, onDone, opts) {
          // 同じ絵を二重に出さない: 「つぶやいてから絵」の間に A を二度押すと、同じ絵が二回出ていた(作者「車も絵が2回でたりする」)
          if (cutscene && cutscene.img === imgKey) return;
          if (lastClosed && lastClosed.img === imgKey && clock - lastClosed.t < 1.5) return;
          cutscene = { img: imgKey, t0: clock, onDone: onDone || null, full: !!(opts && opts.full), into: (opts && opts.into) || null };
        },
        // 一枚絵を、だんだん速く切りかえながら寄っていく(ボタンを待たない)。steps: [{ img, sec, z0, z1, cx, cy, fadeIn }]
        // 最後に白く光り、光ったところで onDone(その裏でマップを切りかえる。白は flash で引かせる)
        // opts.white === false なら、最後に白く光らずに、最後の一コマのまま onDone(続けて一枚絵を出すときなど)
        // opts.hold なら、最後の一コマのまま止まって A を待ち、押されたら onDone(寄ってきた絵が、そのままキメの一枚絵になる)
        burst(steps, onDone, opts) {
          cutscene = { burst: steps, t0: clock, onDone: onDone || null, full: true, white: !(opts && (opts.white === false || opts.hold)), hold: !!(opts && opts.hold) };
        },
        // 手に入れた物を、きーの頭の上に掲げて見せる(きらっと光る)。そのあいだ、きーは正面を向いて動かない
        // opts.rot: 長い物(コンロッドなど)は、ななめに傾けて掲げる
        hold(imgKey, sec, onDone, opts) {
          player.facing = "south";
          held = { img: imgKey, t0: clock, sec: sec || 1.6, onDone: onDone || null, rot: (opts && opts.rot) || 0 };
          freezeUntil = Math.max(freezeUntil, clock + held.sec);
        },
        flash(sec) {
          flash = { t0: clock, sec };
        },
        // きーの向きを変える(ふり返るなど)
        face(dir) {
          player.facing = dir;
        },
        // 見届けのしるし(白い光の粒がきーに降りる)だけを見せる。旗は立てない(最後の場面で、もう一度見せるため)
        showObserve() {
          observeFx = { t0: clock };
          api.sfx("observe");
        },
        shake(sec, amp) {
          // ゆれている最中に小さなゆれが来ても、大きいほうを残す(つぎつぎに重なる爆発のため)
          if (shake && shakeAmp() > amp) return;
          shake = { t0: clock, sec, amp };
        },
        freeze(sec) {
          freezeUntil = clock + sec;
        },
        // 一枚絵を何枚か、ボタンを待たずに、ゆっくり重ねて移り変わらせる(最後の絵のあとで onDone)
        showSeq(keys, holdSec, onDone) {
          cutscene = { img: keys[0], seq: keys, hold: holdSec, t0: clock, onDone: onDone || null, full: true };
        },
        // 見せ場のカメラワーク: keys は時刻(秒)ごとの中心 x, y と寄り z(1 がふつう、小さいほど引き)。
        // 最後の点のあと 1.2 秒でふつうのカメラに戻る。そのあいだ、きーは動かない。A で飛ばせる
        camPath(keys, onDone) {
          camPath = { keys, t0: clock, onDone: onDone || null };
        },
        camPathOn() {
          return !!camPath;
        },
        // カメラを y まで動かして、しばらく見せてから戻す
        pan(y, holdMs, onDone) {
          pan = { y, t0: clock, hold: holdMs / 1000, onDone: onDone || null, from: lastCamY };
        },
        toast(text, sec) {
          if (toast && toast.until > clock) {
            if (toast.text !== text) toastQueue.push({ text, sec: sec || 2.4 });
            return;
          }
          toast = { text, until: clock + (sec || 2.4) };
        },
        say(pages, onDone) {
          host.say(pages, onDone);
        },
        later(ms, fn) {
          setTimeout(() => {
            if (world === w) fn();
          }, ms);
        },
        flag(name) {
          return !!host.state.flags[key(name)];
        },
        setFlag(name, value = true) {
          host.state.flags[key(name)] = value;
          host.save();
        },
        hasItem(name) {
          return host.state.items.includes(name);
        },
        giveItem(name) {
          if (!host.state.items.includes(name)) host.state.items.push(name);
          host.save();
          api.sfx("item");
          // 持ち帰る物(断片ごとに 1 つ)は「どうぐ」でなく「おもいで」に入る。どこに入ったかを添える(「どうぐ なし」のままで、拾えたかわからなかった D311)
          const souv = Object.values((window.BOGI_WORLDS.void || {}).souvenirs || {});
          api.toast(souv.includes(name) ? `おもいで　${name}` : `${name}`, 3.2); // 掲げる絵のあとでも読めるように、少し長く(D310)
        },
        // 使った道具を手放す(ペレットを海に投げ込む、など)
        takeItem(name) {
          host.state.items = host.state.items.filter((it) => it !== name);
          host.save();
        },
        // きーの能力(ジャンプなど)。断片で習得し、覚えたあとはどのフィールドでも使える(フラグ「ability.<id>」)
        hasAbility(id) {
          return hasAbility(id);
        },
        learnAbility(id) {
          host.state.flags[`ability.${id}`] = true;
          host.save();
        },
        hasWord(word) {
          return host.state.words.includes(word);
        },
        learnWord(word) {
          if (!host.state.words.includes(word)) host.state.words.push(word);
          host.save();
        },
        // 別の世界へ(懲罰空間の断片から)
        enterWorld(id) {
          host.enterWorld(id);
        },
        player() {
          return { x: player.x, y: player.y, facing: player.facing };
        },
        // きーを同じマップの別の場所へ置く(段差を跳び上がる、など)
        place(x, y) {
          player.x = x;
          player.y = y;
          player.vx = 0;
          player.vy = 0;
        },
        // 能力を、いま使えるか(習得したか、教わっている断片の中か)
        can(id) {
          return can(id);
        },
        // いま走っているか(はしる)/ 回っているか(まわる)
        running() {
          return running();
        },
        spinning() {
          return spinning();
        },
        // くるっと回って見せる(まわるを覚える場面)
        spin() {
          spinT0 = clock;
          api.sfx("whir");
        },
        // きーを、はじく(使えない所から、何も言わずに戻す)
        knock(vx, vy) {
          player.kx = vx;
          player.ky = vy;
          player.vx = 0;
          player.vy = 0;
        },
        // ジャンプを演出として跳ばせる(教わる場面など)
        hop() {
          jumpT0 = clock;
        },
        image(key) {
          return img(key);
        },
        // 見届け(観測 D189): その断片で、何かが終わるまで、とどまって見ていた
        observe() {
          if (api.flag("observed")) return;
          api.setFlag("observed");
          observeFx = { t0: clock };
          api.sfx("observe");
        },
        // その断片で、見届けたか(懲罰空間と最後の場面から読む)
        observed(id) {
          return !!host.state.flags[`${id}.observed`];
        },
        // ほかの世界の旗を読む("世界id.名前")
        flagOf(fullKey) {
          return !!host.state.flags[fullKey];
        },
        // その断片の世界を終えたか
        cleared(id) {
          return host.state.cleared.includes(id);
        },
        warp(mapId, spawn) {
          host.fade(() => loadMap(mapId, spawn));
        },
        // 暗転せずに、すぐ別のマップへ(前のマップを見せたくないとき)
        cut(mapId, spawn) {
          loadMap(mapId, spawn);
        },
        // 断片の条件を満たした(記録だけ。退出は出口から)
        clear() {
          if (!host.state.cleared.includes(w.id)) {
            host.state.cleared.push(w.id);
            // 終えたことが伝わるように、音だけ(D310。断片の名前は出さない。作者「断片の名前でるのいらない」D312)
            api.sfx("chime");
          }
          host.save();
        },
        // 懲罰空間へ戻る
        exit() {
          host.save();
          host.exit(w.id);
        },
      };
      return api;
    }

    function enter(def, spawnName) {
      world = def;
      world.api = makeApi();
      for (const [k, src] of Object.entries(def.images)) {
        loadImage(k, src.startsWith(".") ? src : def.assetBase + src);
      }
      bubbles = [];
      cutscene = null;
      camPath = null; // 別の世界に入ったら、前の世界のカメラワークは持ちこさない(タイトルの引きから断片へ D262)
      pan = null;
      toast = null;
      toastQueue = [];
      if (def.onEnterWorld) def.onEnterWorld(world.api); // 入るたびに、その回だけの状態をリセットする
      loadMap(def.start, spawnName || def.startSpawn);
    }

    function loadMap(mapId, spawnName) {
      map = world.maps[mapId];
      map.id = mapId;
      if (!map.grid) map.grid = typeof map.map === "function" ? map.map() : map.map;
      map.cols = map.grid[0].length;
      map.rows = map.grid.length;
      map.w = map.cols * map.tile;
      map.h = map.rows * map.tile;
      if (!map.wangCells) buildWang(map);
      const sp = map.spawns[spawnName];
      // BGM: マップに bgm があればそれ、なければ世界の bgm、なければ世界の id(D195)
      if (window.bogiAudio) window.bogiAudio.bgm(map.bgm || world.bgm || world.id);
      player = { x: sp.x, y: sp.y, vx: 0, vy: 0, facing: sp.facing || "south", moving: false };
      bubbles = [];
      nearObj = null;
      lastCamY = null;
      if (cutscene && cutscene.ended) cutscene = null;
      for (const tr of map.triggers || []) tr.inside = true; // 出現位置で即発火しないように
      if (map.onEnter) map.onEnter(world.api);
    }

    function leave() {
      world = null;
      map = null;
      player = null;
      nearObj = null;
      cutscene = null;
      pan = null;
    }

    // Wangタイル(角ベースのオートタイル)。セルの4つの角が「上の地形」かどうかでタイルを選ぶ。
    // 角は、その角に接するセルのうち1つでも lower でないセルがあれば「上」。
    // 地形のペアごとに別のタイルセットを使うので、セルは自分の wang セットの lower かどうかで判定する。
    function buildWang(m) {
      m.wangCells = [];
      const isLowerFor = (setName, r, c) => {
        const t = m.legend[m.grid[r][c]];
        return !!(t && (t.lowerOf || []).includes(setName));
      };
      const vertexUpper = (setName, vr, vc) => {
        for (const [r, c] of [
          [vr - 1, vc - 1],
          [vr - 1, vc],
          [vr, vc - 1],
          [vr, vc],
        ]) {
          if (r < 0 || c < 0 || r >= m.rows || c >= m.cols) continue;
          if (!isLowerFor(setName, r, c)) return 1;
        }
        return 0;
      };
      for (let r = 0; r < m.rows; r++) {
        const row = [];
        for (let c = 0; c < m.cols; c++) {
          const t = m.legend[m.grid[r][c]];
          if (!t || !t.wang) {
            row.push(null);
            continue;
          }
          const s = t.wang;
          const key = `${vertexUpper(s, r, c)}${vertexUpper(s, r, c + 1)}${vertexUpper(s, r + 1, c)}${vertexUpper(s, r + 1, c + 1)}`;
          const set = m.wang[s];
          const variants = set.lookup[key] || set.lookup["1111"];
          row.push({ set, rect: variants[(r * 7 + c * 13) % variants.length] });
        }
        m.wangCells.push(row);
      }
    }

    function tileAt(px, py) {
      const c = Math.floor(px / map.tile);
      const r = Math.floor(py / map.tile);
      if (c < 0 || r < 0 || c >= map.cols || r >= map.rows) return null;
      return map.legend[map.grid[r][c]] || null;
    }

    function visibleObjects() {
      return map.objects.filter((o) => !o.hidden || !o.hidden(world.api));
    }

    // 線の壁(map.rails: 点列の配列)。ぶつかると、はじき返す
    const RAIL_R = 9;
    function railHit(fx, fy) {
      for (const run of map.rails || []) {
        for (let i = 0; i < run.length - 1; i++) {
          const [ax, ay] = run[i];
          const [bx, by] = run[i + 1];
          const dx = bx - ax;
          const dy = by - ay;
          const l2 = dx * dx + dy * dy || 1;
          const t = Math.max(0, Math.min(1, ((fx - ax) * dx + (fy - ay) * dy) / l2));
          const qx = ax + dx * t;
          const qy = ay + dy * t;
          const d = Math.hypot(fx - qx, fy - qy);
          if (d < RAIL_R) {
            // いまいる側へ、はじく
            let nx = player.x - qx;
            let ny = player.y - qy;
            const nl = Math.hypot(nx, ny) || 1;
            nx /= nl;
            ny /= nl;
            player.kx = nx * 230;
            player.ky = ny * 230;
            player.vx = 0;
            player.vy = 0;
            return true;
          }
        }
      }
      return false;
    }

    // 進もうとした先がふさがっていても、横に少し(CORNER_SLIDE まで)ずらせば通れるなら、そちらへ寄せる。
    // スマホのジョイスティックでは狭い通り道にぴったり合わせにくいので
    const CORNER_SLIDE = 12;
    function slideAround(tx, ty, vertical, dt) {
      const step = SPEED * 0.7 * dt;
      for (let s = 2; s <= CORNER_SLIDE; s += 2) {
        for (const sign of [-1, 1]) {
          const ox = vertical ? tx + sign * s : tx;
          const oy = vertical ? ty : ty + sign * s;
          if (!solidAt(ox, oy) && !railHit(ox, oy)) {
            if (vertical) {
              const nx = player.x + sign * Math.min(step, s);
              if (!solidAt(nx, player.y)) player.x = nx;
            } else {
              const ny = player.y + sign * Math.min(step, s);
              if (!solidAt(player.x, ny)) player.y = ny;
            }
            return;
          }
        }
      }
    }

    function solidAt(fx, fy) {
      const x0 = fx - FEET_W / 2;
      const x1 = fx + FEET_W / 2;
      const y0 = fy - FEET_H / 2;
      const y1 = fy + FEET_H / 2;
      for (const [cx, cy] of [
        [x0, y0],
        [x1, y0],
        [x0, y1],
        [x1, y1],
      ]) {
        const t = tileAt(cx, cy);
        if (!t || t.solid) return true;
      }
      for (const o of visibleObjects()) {
        if (!o.solid) continue;
        const s = o.solid;
        const sx0 = o.x + (s.dx || 0) - s.w / 2;
        const sy0 = o.y + (s.dy || 0) - s.h / 2;
        if (x1 > sx0 && x0 < sx0 + s.w && y1 > sy0 && y0 < sy0 + s.h) {
          lastHit = o;
          return true;
        }
      }
      return false;
    }
    let lastHit = null; // solidAt でぶつかった物(押せる物を押すため)

    // ---- きーの能力(D201〜D203) ----
    // 習得したら、どのフィールドでも使える。習得前は、教わっている断片の中(その世界のフラグ「<id>」)だけ
    function can(id) {
      return hasAbility(id) || !!(world && world.api.flag(id));
    }

    // おす: 押せる物(o.push)に向かって歩くと、ゆっくり押す。押した先がふさがっていれば動かない
    // o.push = { area: [x0, y0, x1, y1](動ける範囲、省略可) }。押したあとで o.onPush(api)
    function tryPush(o, dx, dy) {
      if (!o || !o.push || !can("osu") || !o.solid) return false;
      if (o.push.enabled && !o.push.enabled(world.api)) return false;
      const nx = o.x + dx;
      const ny = o.y + dy;
      const a = o.push.area;
      if (a && (nx < a[0] || nx > a[2] || ny < a[1] || ny > a[3])) return false;
      const s = o.solid;
      const bx0 = nx + (s.dx || 0) - s.w / 2;
      const by0 = ny + (s.dy || 0) - s.h / 2;
      for (const [cx, cy] of [
        [bx0, by0],
        [bx0 + s.w, by0],
        [bx0, by0 + s.h],
        [bx0 + s.w, by0 + s.h],
      ]) {
        const t = tileAt(cx, cy);
        if (!t || t.solid) return false;
      }
      for (const q of visibleObjects()) {
        if (q === o || !q.solid) continue;
        const qs = q.solid;
        const qx0 = q.x + (qs.dx || 0) - qs.w / 2;
        const qy0 = q.y + (qs.dy || 0) - qs.h / 2;
        if (bx0 + s.w > qx0 && bx0 < qx0 + qs.w && by0 + s.h > qy0 && by0 < qy0 + qs.h) return false;
      }
      o.x = nx;
      o.y = ny;
      o._pushedAt = clock;
      if (o.onPush) o.onPush(world.api);
      return true;
    }

    // はしる: B を押し続けると走る(短く押すとジャンプ)。はしるを覚える前は、押したときにすぐ跳ぶ
    // はしる(D227): ボタンは使わない。覚えたあと、同じ向きに歩きつづける(0.8 秒)と、ひとりでに走りだす。
    // 向きを大きく変えるか、止まると、歩きにもどる。B はジャンプだけで、押した瞬間に跳ぶ
    const RUN_AFTER = 0.8;
    let walkT = 0; // 同じ向きに歩きつづけている秒数
    let walkA = null; // その向き
    function trackWalk(input, dt) {
      const m = Math.hypot(input.x, input.y);
      if (m < 0.5) {
        walkT = 0;
        walkA = null;
        return;
      }
      const a = Math.atan2(input.y, input.x);
      let d = walkA == null ? 0 : a - walkA;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      if (walkA == null || Math.abs(d) < 0.8) walkT += dt; // 斜めに少しそれるくらいは、同じ向きとみなす
      else walkT = 0;
      walkA = a;
    }
    function running() {
      return can("hashiru") && walkT >= RUN_AFTER && player && player.moving;
    }
    function pressB() {
      if (!world || !player) return false;
      return jump();
    }
    function releaseB() {}

    // まわる: ジョイスティック(矢印キー)で円を描くと、くるっと回る。map.onSpin(api, p) と、近くの o.buried が受けとる
    const SPIN_TIME = 0.8;
    let spinT0 = -1;
    let spinAcc = 0;
    let spinLast = null;
    let spinWin = 0;
    let spinIdle = 0;
    function spinning() {
      return spinT0 >= 0 && clock - spinT0 < SPIN_TIME;
    }
    function trackSpin(input, dt) {
      const m = Math.hypot(input.x, input.y);
      if (m < 0.5) {
        // キーを持ちかえる、ほんの少しの間は、円を描きつづけているとみなす
        spinIdle += dt;
        if (spinIdle > 0.3) {
          spinLast = null;
          spinAcc = 0;
        }
        return;
      }
      spinIdle = 0;
      const a = Math.atan2(input.y, input.x);
      if (spinLast != null) {
        let d = a - spinLast;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        if (Math.abs(d) < Math.PI * 0.9) {
          if (Math.sign(d) !== Math.sign(spinAcc) && Math.abs(d) > 0.05) spinAcc = 0;
          spinAcc += d;
          if (d) spinWin = 0;
        }
      }
      spinLast = a;
      spinWin += dt;
      if (spinWin > 0.7) spinAcc = 0; // ゆっくりすぎる向きの変化は、円とみなさない
      if (Math.abs(spinAcc) >= Math.PI * 1.75 && !spinning() && can("mawaru")) {
        spinAcc = 0;
        spinT0 = clock;
        world.api.sfx("whir");
        if (map.onSpin) map.onSpin(world.api, { x: player.x, y: player.y });
        for (const o of visibleObjects()) {
          if (!o.buried || o.dug) continue;
          const r = o.buried.r || 48;
          if (Math.hypot(o.x - player.x, o.y - player.y) <= r) {
            o.dug = true;
            if (o.buried.flag) world.api.setFlag(o.buried.flag);
            if (o.buried.onDig) o.buried.onDig(world.api);
          }
        }
      }
    }

    // きーの能力。断片で習得すると「ability.<id>」が立つ(jump は、以前の保存データの「kasumi.jumpLearned」も認める)
    function hasAbility(id) {
      const f = host.state.flags;
      if (f[`ability.${id}`]) return true;
      return id === "jump" && !!f["kasumi.jumpLearned"];
    }

    // ジャンプ(覚えたあと、B ボタン / X キー)。地図は map.onJump(api, player) で受け取れる
    const JUMP_TIME = 0.5;
    let jumpT0 = -1;
    function jumpHeight() {
      if (jumpT0 < 0) return 0;
      const u = (clock - jumpT0) / JUMP_TIME;
      if (u >= 1) return 0;
      return Math.sin(u * Math.PI) * 20;
    }
    function jump() {
      if (!world || !player || cutscene || pan) return false;
      // 習得した能力なら、どのフィールドでも跳べる。習得前は、教わっている断片の中(フラグ「jump」)だけ
      if (!can("jump")) return false;
      if (jumpT0 >= 0 && clock - jumpT0 < JUMP_TIME) return false;
      jumpT0 = clock;
      if (map.onJump) map.onJump(world.api, { x: player.x, y: player.y, facing: player.facing });
      return true;
    }

    function busy() {
      return !!(cutscene || pan || camPath || clock < freezeUntil);
    }
    // camPath のいまの中心と寄り(終わっていれば null)。base はふつうのカメラの中心
    const CAM_BACK = 1.2;
    function camShot(base) {
      if (!camPath) return null;
      const ks = camPath.keys;
      const el = clock - camPath.t0;
      const last = ks[ks.length - 1];
      if (el >= last.t) {
        const k = ease(Math.min(1, (el - last.t) / CAM_BACK));
        return { x: last.x + (base.x - last.x) * k, y: last.y + (base.y - last.y) * k, z: last.z + (1 - last.z) * k };
      }
      let i = 0;
      while (i < ks.length - 2 && el >= ks[i + 1].t) i++;
      const a = ks[i];
      const b = ks[i + 1];
      const k = el <= a.t ? 0 : ease((el - a.t) / Math.max(0.01, b.t - a.t));
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k };
    }

    function update(dt, t, input) {
      if (!world) return;
      clock += dt;
      for (const f of flakes) {
        f.y += f.v * dt;
        f.x += Math.sin(clock * 0.8 + f.p) * 12 * dt;
        if (f.y > vh) {
          f.y = -4;
          f.x = Math.random() * vw;
        }
      }
      bubbles = bubbles.filter((b) => b.until > clock);
      for (const o of map.objects) if (o.update) o.update(dt, t, world.api);
      // 場所による BGM の大きさ: マップの bgmLevel(数か、きーの位置から決める関数)。なければ 1
      if (window.bogiAudio) window.bogiAudio.bgmLevel(typeof map.bgmLevel === "function" ? map.bgmLevel(player, map) : map.bgmLevel ?? 1);
      if (toast && cutscene) toast.until += dt; // 一枚絵の下に隠れているあいだは、時間を止める(絵を閉じてから読めるように)
      if (toast && toast.until < clock) {
        const next = toastQueue.shift();
        toast = next ? { text: next.text, until: clock + next.sec } : null;
      }

      if (camPath) {
        const ks = camPath.keys;
        if (clock - camPath.t0 > ks[ks.length - 1].t + CAM_BACK) {
          const done = camPath.onDone;
          camPath = null;
          if (done) done();
        }
        return;
      }
      if (pan) {
        const el = clock - pan.t0;
        if (el > pan.hold + 2.4) {
          const done = pan.onDone;
          pan = null;
          if (done) done();
        }
        return;
      }
      if (held && clock - held.t0 >= held.sec) {
        const done = held.onDone;
        held = null;
        if (done) done();
      }
      if (cutscene) return;
      if (clock < freezeUntil) return;

      // すべる床: 氷のタイル、または map.slippery(true か、追従の強さの数値。小さいほどつるつる)
      const slip = map.slippery ? map.slippery(world.api, player.x, player.y) : false;
      const iceTile = !!(tileAt(player.x, player.y) || {}).ice;
      const onIce = iceTile || !!slip;
      const iceAccel = !iceTile && typeof slip === "number" ? slip : ICE_ACCEL;
      trackSpin(input, dt);
      trackWalk(input, dt);
      // 風(map.wind(api, x, y) が { x, y } px/秒 を返す): ふんばるを覚えていれば、つぶれて張りつき、じりじり進む(D202)
      const wind = map.wind ? map.wind(world.api, player.x, player.y) : null;
      player.squash = !!(wind && can("funbaru"));
      let spd = SPEED * (running() ? 1.75 : 1);
      if (player.squash) spd = SPEED * 0.32;
      const tx = input.x * spd + (wind && !player.squash ? wind.x : 0);
      const ty = input.y * spd + (wind && !player.squash ? wind.y : 0);
      if (onIce) {
        const k = Math.min(1, iceAccel * dt);
        player.vx += (tx - player.vx) * k;
        player.vy += (ty - player.vy) * k;
      } else {
        player.vx = tx;
        player.vy = ty;
      }

      // はじかれた勢い(ガードレールなど)。少しずつ弱まる
      const kd = Math.exp(-7 * dt);
      player.kx = (player.kx || 0) * kd;
      player.ky = (player.ky || 0) * kd;
      const mvx = player.vx + player.kx;
      const mvy = player.vy + player.ky;

      const PUSH_K = 0.45; // 押しているあいだは、ゆっくり
      lastHit = null;
      const nx = player.x + mvx * dt;
      if (!solidAt(nx, player.y) && !railHit(nx, player.y)) player.x = nx;
      else if (Math.abs(mvx) > Math.abs(mvy) && tryPush(lastHit, mvx * dt * PUSH_K, 0)) {
        player.x += mvx * dt * PUSH_K;
        player.pushing = clock;
      } else {
        player.vx = 0;
        if (Math.abs(mvx) > Math.abs(mvy)) slideAround(nx, player.y, false, dt); // 角に少し引っかかったら、あいている側へずらす
      }
      lastHit = null;
      const ny = player.y + mvy * dt;
      if (!solidAt(player.x, ny) && !railHit(player.x, ny)) player.y = ny;
      else if (Math.abs(mvy) > Math.abs(mvx) && tryPush(lastHit, 0, mvy * dt * PUSH_K)) {
        player.y += mvy * dt * PUSH_K;
        player.pushing = clock;
      } else {
        player.vy = 0;
        if (Math.abs(mvy) > Math.abs(mvx)) slideAround(player.x, ny, true, dt);
      }

      player.moving = Math.hypot(player.vx, player.vy) > 8;
      if (Math.abs(input.x) > 0.1 || Math.abs(input.y) > 0.1) {
        if (Math.abs(input.x) > Math.abs(input.y)) player.facing = input.x > 0 ? "east" : "west";
        else player.facing = input.y > 0 ? "south" : "north";
      }

      // 範囲に入ると発火する仕掛け(出入口、景色が開ける場所など)
      for (const tr of map.triggers || []) {
        if (tr.enabled && !tr.enabled(world.api)) continue;
        const inside =
          player.x > tr.x && player.x < tr.x + tr.w && player.y > tr.y && player.y < tr.y + tr.h;
        if (inside && !tr.inside) {
          tr.inside = true;
          if (tr.warp) {
            world.api.warp(tr.warp.map, tr.warp.spawn);
            return;
          }
          if (tr.run && !(tr.once && world.api.flag(`trig.${tr.id}`))) {
            if (tr.once) world.api.setFlag(`trig.${tr.id}`);
            tr.run(world.api);
          }
        } else if (!inside) {
          tr.inside = false;
        }
      }

      nearObj = null;
      let best = Infinity;
      for (const o of visibleObjects()) {
        if (!o.interact && !o.near) continue;
        if (o.canInteract && !o.canInteract(world.api)) continue;
        // 距離は足もと(描画の基準点)からはかる
        const ix = o.x + (o.ix || 0);
        const iy = o.y + (o.iy != null ? o.iy : o.sortDy || 0);
        const d = Math.hypot(ix - player.x, iy - player.y);
        const r = o.range || 60;
        if (o.near) {
          const was = !!o._wasNear;
          o._wasNear = d <= (o.nearRange || r);
          if (o._wasNear && !was) o.near(world.api);
        }
        if (o.interact && d <= r && d < best) {
          best = d;
          nearObj = o;
        }
      }
    }

    // 体のすぐそばの、調べられる物: 調べる点から遠いはし(横に長い車など)に立っても、その物を調べる。
    // 何もない物には何も返さない(D308 で「……」を返したが、作者「無駄にしらべさせてしまう」D309)
    function lookAt() {
      let best = null;
      let bd = Infinity;
      for (const o of visibleObjects()) {
        if (!o.img || !o.interact || o.noLook) continue;
        if (o.canInteract && !o.canInteract(world.api)) continue;
        let d;
        if (o.solid) {
          const s = o.solid;
          const dx = Math.max(0, Math.abs(player.x - (o.x + (s.dx || 0))) - s.w / 2);
          const dy = Math.max(0, Math.abs(player.y - (o.y + (s.dy || 0))) - s.h / 2);
          d = Math.hypot(dx, dy);
          if (d > 16) continue;
        } else {
          d = Math.hypot(o.x - player.x, o.y + (o.sortDy || 0) - player.y);
          if (d > 30) continue;
        }
        if (d < bd) {
          bd = d;
          best = o;
        }
      }
      return best;
    }

    function interact() {
      if (!world) return false;
      if (camPath && !cutscene) {
        // 見せ場を飛ばす: 最後の点へ行ったことにして、ふつうのカメラに戻りはじめる
        const ks = camPath.keys;
        if (clock - camPath.t0 < ks[ks.length - 1].t) camPath.t0 = clock - ks[ks.length - 1].t;
        return true;
      }
      if (cutscene) {
        if (cutscene.burst && cutscene.held) {
          const done = cutscene.onDone;
          cutscene = null;
          if (done) done();
          return true;
        }
        if (cutscene.seq || cutscene.burst || cutscene.outT0 != null) return true;
        if (clock - cutscene.t0 < 0.6) return true;
        const done = cutscene.onDone;
        if (cutscene.into) {
          // 絵は消さずに残し、裏で次のマップに切りかえてから、絵だけを薄くしていく
          const into = cutscene.into;
          cutscene.outT0 = clock;
          cutscene.onDone = null;
          loadMap(into.map, into.spawn);
          if (done) done();
          return true;
        }
        lastClosed = { img: cutscene.img, t: clock };
        cutscene = null;
        if (done) done();
        return true;
      }
      // A ボタンをマップが自分で受けとる(競争の合図など、調べる物がない場面)
      if (!pan && map.onA) return map.onA(world.api) !== false;
      if (pan) return false;
      if (!nearObj) {
        // 横に長い物(車など)は、調べる点から遠いはしに立つと届かなかった(批評会 2 回目)
        const o = lookAt();
        if (!o) return false;
        player.vx = 0;
        player.vy = 0;
        o.interact(world.api);
        return true;
      }
      player.vx = 0;
      player.vy = 0;
      nearObj.interact(world.api);
      return true;
    }

    function camera(shot) {
      let cx = map.w <= vw ? map.w / 2 : clamp(player.x, vw / 2, map.w - vw / 2);
      let cy = map.h <= vh ? map.h / 2 : clamp(player.y - 12, vh / 2, map.h - vh / 2);
      if (shot) {
        cx = map.w <= vw ? map.w / 2 : clamp(shot.x, vw / 2, map.w - vw / 2);
        cy = map.h <= vh ? map.h / 2 : clamp(shot.y, vh / 2, map.h - vh / 2);
      }
      if (pan) {
        const el = clock - pan.t0;
        const target = clamp(pan.y, vh / 2, Math.max(vh / 2, map.h - vh / 2));
        const from = pan.from == null ? cy : pan.from;
        let k;
        if (el < 1.2) k = ease(el / 1.2);
        else if (el < 1.2 + pan.hold) k = 1;
        else k = 1 - ease((el - 1.2 - pan.hold) / 1.2);
        cy = from + (target - from) * k;
      } else {
        lastCamY = cy;
      }
      const { sx, sy } = shakeOffset();
      return { ox: Math.round(vw / 2 - cx) + sx, oy: Math.round(vh / 2 - cy) + sy };
    }
    // 画面のゆれの、いまの強さ(だんだん弱まる)
    function shakeAmp() {
      if (!shake) return 0;
      const u = (clock - shake.t0) / shake.sec;
      if (u >= 1) {
        shake = null;
        return 0;
      }
      return shake.amp * (1 - u) * (1 - u);
    }
    function shakeOffset() {
      const a = shakeAmp();
      return { sx: Math.round((Math.random() * 2 - 1) * a), sy: Math.round((Math.random() * 2 - 1) * a) };
    }

    function draw(t) {
      if (!world) return;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = map.bg || "#1b1a22";
      ctx.fillRect(0, 0, VW, VH);
      ctx.save();
      // 見せ場のカメラ(寄り・引き)。ふつうのカメラの中心は、寄りなしの広さで決める
      vw = VW / ZOOM;
      vh = VH / ZOOM;
      lastCam = { x: map.w <= vw ? map.w / 2 : clamp(player.x, vw / 2, map.w - vw / 2), y: map.h <= vh ? map.h / 2 : clamp(player.y - 12, vh / 2, map.h - vh / 2) };
      const shot = camShot(lastCam);
      const cz = shot ? shot.z : 1;
      vw = VW / (ZOOM * cz);
      vh = VH / (ZOOM * cz);
      ctx.scale(ZOOM * cz, ZOOM * cz);
      const { ox, oy } = camera(shot);
      const T = map.tile;

      if (map.backdrop) {
        const b = map.backdrop;
        const im = img(b.img);
        if (im) ctx.drawImage(im, b.x + ox, b.y + oy, im.width * b.scale, im.height * b.scale);
      }

      const r0 = Math.max(0, Math.floor(-oy / T));
      const r1 = Math.min(map.rows - 1, Math.floor((vh - oy) / T));
      const c0 = Math.max(0, Math.floor(-ox / T));
      const c1 = Math.min(map.cols - 1, Math.floor((vw - ox) / T));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const tile = map.legend[map.grid[r][c]];
          if (!tile || tile.none) continue;
          const x = c * T + ox;
          const y = r * T + oy;
          const wc = map.wangCells[r][c];
          if (wc) {
            const wim = img(wc.set.img);
            if (wim) {
              const sz = wc.set.size;
              ctx.drawImage(wim, wc.rect[0] * sz, wc.rect[1] * sz, sz, sz, x, y, T, T);
              continue;
            }
          }
          const im = tile.img && img(tile.img);
          if (im) {
            if (tile.crop) ctx.drawImage(im, tile.crop[0], tile.crop[1], T, T, x, y, T, T);
            else ctx.drawImage(im, x, y, T, T);
          } else if (tile.color) {
            ctx.fillStyle = tile.color;
            ctx.fillRect(x, y, T, T);
          }
        }
      }

      if (map.drawGround) map.drawGround(ctx, ox, oy, img, world.api);

      // y順に並べて、手前のものほど後に描く
      const drawables = visibleObjects().map((o) => ({ y: o.y + (o.sortDy || 0), o }));
      if (!map.hidePlayer) drawables.push({ y: player.y, player: true });
      drawables.sort((a, b) => a.y - b.y);
      for (const d of drawables) {
        if (d.player) drawPlayer(ox, oy, t);
        else drawObject(d.o, ox, oy, t);
      }
      for (const d of drawables) if (d.o && d.o.drawOver) d.o.drawOver(ctx, Math.round(d.o.x + ox), Math.round(d.o.y + oy), t, world.api);
      if (held) drawHeld(ox, oy);
      if (observeFx) {
        // 見届けたしるし: 白い光の粒が上から、きーに降りてきて、とける
        const u = (clock - observeFx.t0) / 1.6;
        if (u >= 1) observeFx = null;
        else {
          const px = Math.round(player.x + ox);
          const py = Math.round(player.y + oy) - 16;
          const y = py - (1 - Math.min(1, u * 1.4)) * 70;
          const a = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
          const g = ctx.createRadialGradient(px, y, 1, px, y, 14 + u * 10);
          g.addColorStop(0, `rgba(255, 255, 255, ${a})`);
          g.addColorStop(1, "rgba(220, 236, 255, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(px - 30, y - 30, 60, 60);
        }
      }

      if (map.drawOverlay) map.drawOverlay(ctx, ox, oy, t, world.api);
      if (map.dark) drawDark(ox, oy);
      if (map.wind) drawWind(ox, oy);
      // 夕方などの色: tintMul は掛け合わせ(暗く、色をのせる)、tint は上から薄く重ねる
      if (map.tintMul) {
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = map.tintMul;
        ctx.fillRect(0, 0, vw, vh);
        ctx.globalCompositeOperation = "source-over";
      }
      if (map.tint) {
        ctx.fillStyle = map.tint;
        ctx.fillRect(0, 0, vw, vh);
      }
      if (map.snow) drawSnow();
      bubblePlaced.length = 0; // 重なる吹き出しは上へ積む(このフレームで置いた位置)
      for (const b of bubbles) drawBubble(b, ox, oy);
      if (nearObj && !busy() && !(nearObj.noMark && nearObj.noMark(world.api))) drawActionMark(nearObj, ox, oy, t); // noMark: 印を出さない間(覗いている大写しなど)
      ctx.restore();
      vw = VW / ZOOM; // 寄り・引きは、マップを描くあいだだけ
      vh = VH / ZOOM;
      if (toast) drawToast();
      if (cutscene) drawCutscene();
      if (flash) {
        const u = (clock - flash.t0) / flash.sec;
        if (u >= 1) flash = null;
        else {
          ctx.fillStyle = `rgba(255, 252, 240, ${1 - u})`;
          ctx.fillRect(0, 0, VW, VH);
        }
      }
    }

    function drawObject(o, ox, oy, t) {
      const sx = Math.round(o.x + ox);
      const sy = Math.round(o.y + oy);
      if (sx < -200 || sx > vw + 200 || sy < -200 || sy > vh + 200) return;
      if (o.shadow) {
        ctx.fillStyle = "rgba(40, 50, 70, 0.22)";
        ctx.beginPath();
        ctx.ellipse(sx, sy + o.shadow.dy, o.shadow.rx, o.shadow.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (o.anim) {
        const a = o.anim;
        const im = img(a.img);
        if (im) {
          const f = Math.floor(t * (a.fps || 4)) % a.frames;
          ctx.drawImage(im, f * a.cell, a.row * a.cell, a.cell, a.cell, sx - o.w / 2, sy - o.h / 2, o.w, o.h);
        }
      } else if (o.img) {
        const im = img(o.img);
        if (im) {
          const bob = o.bob ? Math.round(Math.sin(t * 3) * o.bob) : 0;
          ctx.drawImage(im, sx - o.w / 2, sy - o.h / 2 + bob, o.w, o.h);
        }
      }
      if (o.draw) o.draw(ctx, sx, sy, t, world.api);
    }

    // 頭の上に掲げた物(きらっと光る十字と、ふわっと浮く)
    function drawHeld(ox, oy) {
      const im = img(held.img);
      const e = clock - held.t0;
      const sx = Math.round(player.x + ox);
      const sy = Math.round(player.y + oy - 46 - Math.min(1, e / 0.25) * 8 + Math.sin(e * 4) * 1.5);
      const r = 10 + 8 * Math.sin(Math.min(1, e / 0.5) * Math.PI);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillRect(sx - 1, sy - r, 2, 2 * r);
      ctx.fillRect(sx - r, sy - 1, 2 * r, 2);
      if (!im) return;
      if (held.rot) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(held.rot);
        ctx.drawImage(im, Math.round(-im.width / 2), Math.round(-im.height / 2));
        ctx.restore();
      } else ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height / 2));
    }

    function drawPlayer(ox, oy, t) {
      const p = world.playerSprite;
      const im = img(p.img);
      const sx = Math.round(player.x + ox);
      const sy = Math.round(player.y + oy);
      ctx.fillStyle = "rgba(40, 50, 70, 0.25)";
      ctx.beginPath();
      ctx.ellipse(sx, sy + 1, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      if (!im) return;
      // まわる: 向きをくるくる変える(逆回り。金星のように)
      const SPIN_DIRS = ["south", "west", "north", "east"];
      const facing = spinning() ? SPIN_DIRS[Math.floor((clock - spinT0) * 14) % 4] : player.facing;
      const row = DIR_ROW[facing];
      const frame = player.moving ? 1 + (Math.floor(t * (running() ? 18 : 10)) % (p.frames - 1)) : 0;
      const jz = Math.round(jumpHeight()); // ジャンプ中は体だけ浮く(影は地面に残る)
      const tint = world.playerTint && world.playerTint(world.api);
      if (spinning()) drawSpinDust(sx, sy);
      if (player.squash && !tint) {
        // ふんばる: つぶれて地面に張りつく(D202)。横に広がり、高さは半分
        const w = Math.round(p.cell * 1.35);
        const h = Math.round(p.cell * 0.5);
        ctx.drawImage(im, frame * p.cell, row * p.cell, p.cell, p.cell, Math.round(sx - w / 2), Math.round(sy - (p.cell - p.footY) * 0.5), w, h);
        return;
      }
      if (!tint) {
        ctx.drawImage(im, frame * p.cell, row * p.cell, p.cell, p.cell, sx - p.cell / 2, sy - p.cell + p.footY - jz, p.cell, p.cell);
        return;
      }
      // 色を変えて描く(真っ黒にこげた、など): 形はそのまま、色だけを塗る
      if (!tintBuf) {
        tintBuf = document.createElement("canvas");
        tintBuf.width = tintBuf.height = p.cell;
      }
      const g = tintBuf.getContext("2d");
      g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, p.cell, p.cell);
      g.drawImage(im, frame * p.cell, row * p.cell, p.cell, p.cell, 0, 0, p.cell, p.cell);
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = tint;
      g.fillRect(0, 0, p.cell, p.cell);
      ctx.drawImage(tintBuf, sx - p.cell / 2, sy - p.cell + p.footY - jz);
    }
    let tintBuf = null;

    // まわるときの、足もとの土ぼこりの輪
    function drawSpinDust(sx, sy) {
      const u = (clock - spinT0) / SPIN_TIME;
      const r = 8 + u * 22;
      ctx.fillStyle = `rgba(235, 230, 215, ${0.8 * (1 - u)})`;
      for (let i = 0; i < 10; i++) {
        const a = -i * 0.63 - u * 9;
        ctx.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r * 0.4), 2, 2);
      }
    }

    // てらす: 暗いマップ(map.dark: 0〜1 の濃さ、または関数)。きーのまわりだけ見える。てらすを覚えていれば、青い光で広く見える
    let darkBuf = null;
    let terasuT0 = -1; // てらすの光が、はじめて広がった時刻
    function drawDark(ox, oy) {
      const k = typeof map.dark === "function" ? map.dark(world.api) : map.dark;
      if (!k) return;
      if (!darkBuf) darkBuf = document.createElement("canvas");
      if (darkBuf.width !== vw || darkBuf.height !== vh) {
        darkBuf.width = vw;
        darkBuf.height = vh;
      }
      const g = darkBuf.getContext("2d");
      g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, vw, vh);
      g.fillStyle = map.darkColor || "rgba(6, 8, 16, 1)";
      g.globalAlpha = k;
      g.fillRect(0, 0, vw, vh);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "destination-out";
      const px = player.x + ox;
      const py = player.y + oy - 12;
      const lit = can("terasu");
      // てらすを覚えてから、はじめて暗い所に入ったとき(D228): カメラがきーに寄り、光が小さな輪から広がる。一度だけ
      if (lit && k > 0.8 && !host.state.flags["ability.terasuShown"] && terasuT0 < 0 && !cutscene) {
        host.state.flags["ability.terasuShown"] = true;
        host.save();
        terasuT0 = clock;
        const cx = player.x;
        const cy = player.y - 12;
        camPath = { keys: [{ t: 0, x: cx, y: cy, z: 1 }, { t: 0.7, x: cx, y: cy, z: 1.9 }, { t: 3.2, x: cx, y: cy, z: 1.9 }], t0: clock, onDone: null };
        world.api.sfx("chime");
      }
      const grow = terasuT0 < 0 ? 1 : ease(Math.min(1, Math.max(0, clock - terasuT0 - 0.8) / 1.8));
      const R = lit ? 26 + (66 + Math.sin(clock * 2.2) * 3) * grow : 26;
      const grad = g.createRadialGradient(px, py, R * 0.25, px, py, R);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.fillRect(px - R, py - R, R * 2, R * 2);
      ctx.drawImage(darkBuf, 0, 0);
      if (lit) {
        // 青い光(宝舟の沖で光った燃料の色)
        const gl = ctx.createRadialGradient(px, py, 2, px, py, 60);
        gl.addColorStop(0, "rgba(120, 200, 255, 0.16)");
        gl.addColorStop(1, "rgba(120, 200, 255, 0)");
        ctx.fillStyle = gl;
        ctx.fillRect(px - 60, py - 60, 120, 120);
      }
    }

    // 風のすじ(map.wind のあるマップ)
    const streaks = [];
    function drawWind(ox, oy) {
      if (!map.wind) return;
      const w = map.wind(world.api, player.x, player.y);
      if (!w) return;
      const m = Math.hypot(w.x, w.y) || 1;
      if (streaks.length < 40) streaks.push({ x: Math.random() * vw, y: Math.random() * vh, l: 6 + Math.random() * 12 });
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      for (const st of streaks) {
        st.x += (w.x / m) * 9;
        st.y += (w.y / m) * 9;
        if (st.x < -20) st.x += vw + 40;
        if (st.x > vw + 20) st.x -= vw + 40;
        if (st.y < -20) st.y += vh + 40;
        if (st.y > vh + 20) st.y -= vh + 40;
        if (Math.abs(w.x) >= Math.abs(w.y)) ctx.fillRect(Math.round(st.x), Math.round(st.y), Math.round(st.l), 1);
        else ctx.fillRect(Math.round(st.x), Math.round(st.y), 1, Math.round(st.l));
      }
    }

    function headOf(who, ox, oy) {
      if (who === "player") return { x: player.x + ox, y: player.y + oy - 26 };
      const o = map.objects.find((x) => x.id === who);
      if (!o) return null;
      return { x: o.x + ox, y: o.y + oy - (o.headY || o.h / 2) };
    }

    const bubblePlaced = [];
    function drawBubble(b, ox, oy) {
      const h = headOf(b.who, ox, oy);
      if (!h) return;
      // 世界は ZOOM 倍で描いているので、画面の座標に直してからドット文字の窓を描く
      const s = PIX_S;
      const w = (bogiPix.width(b.text) + 16) * s;
      const hh = 30 * s; // 文字(17 ドット)が上下の真ん中に来る高さ
      const hx = Math.round(h.x * ZOOM);
      const bx = clamp(hx - w / 2, 6, VW - w - 6);
      const by0 = Math.max(4, Math.round(h.y * ZOOM) - hh - 6 * s); // 画面の上端より上には出さない
      // ほかの吹き出しと重なるなら段をずらす(かけ声のように何人もいっせいに話すとき)。
      // まず上へ、画面の上にはみ出すなら下へ。いちばん近い、あいている段に置く
      const step = hh + 2 * s;
      const free = (y) => y >= 4 && y + hh <= VH - 4 && !bubblePlaced.some((p) => bx < p.x + p.w && bx + w > p.x && y < p.y + p.h && y + hh > p.y);
      let by = by0;
      if (!free(by)) {
        for (let k = 1; k <= 6; k++) {
          if (free(by0 - k * step)) {
            by = by0 - k * step;
            break;
          }
          if (free(by0 + k * step)) {
            by = by0 + k * step;
            break;
          }
        }
      }
      by = clamp(by, 4, VH - hh - 4);
      bubblePlaced.push({ x: bx, y: by, w, h: hh });
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      bogiPix.win(ctx, bx, by, w, hh, s);
      // しっぽ(白い三角、ドット)。頭のすぐ上の段にあるときだけ出す
      if (by === by0) {
        ctx.fillStyle = "#fff";
        const tx = Math.round(hx / s) * s;
        const ty = Math.round((by + hh) / s) * s - s;
        for (let i = 0; i < 4; i++) ctx.fillRect(tx - (3 - i) * s, ty + i * s, (7 - i * 2) * s, s);
      }
      bogiPix.text(ctx, b.text, Math.round(bx / s) * s + 8 * s, Math.round(by / s) * s + 7 * s, s);
      ctx.restore();
    }

    // 調べられるものの上に、小さな印を出す(文字は出さない)。ほかの文字と同じく、ドットで描く
    function drawActionMark(o, ox, oy, t) {
      const h = headOf(o.id, ox, oy) || { x: o.x + ox, y: o.y + oy };
      const x = Math.round(h.x);
      const y = Math.round(h.y - 10 + (Math.sin(t * 5) > 0 ? 1 : 0));
      // 黒いふちの白い ▼(幅 7 ドット)。ふちは上辺・左右・下の先まで 1 ドット
      ctx.fillStyle = "#000";
      ctx.fillRect(x - 4, y - 1, 9, 1); // 上辺
      for (let i = 0; i < 5; i++) ctx.fillRect(x - 4 + i, y + i, 9 - i * 2, 1); // 左右と下の先
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 4; i++) ctx.fillRect(x - 3 + i, y + i, 7 - i * 2, 1);
    }

    function drawSnow() {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      // map.snow が数なら、その回数ずらして重ねる(ドカ雪)
      const n = map.snow === true ? 1 : map.snow;
      for (let k = 0; k < n; k++) {
        const dx = k * 53;
        const dy = k * 97;
        for (const f of flakes) ctx.fillRect(Math.round((f.x + dx) % vw), Math.round((f.y + dy) % vh), f.s, f.s);
      }
    }

    function drawToast() {
      const s = PIX_S;
      const w = (bogiPix.width(toast.text) + 20) * s;
      const h = 30 * s;
      const x = Math.round((VW - w) / 2 / s) * s;
      bogiPix.win(ctx, x, 8 * s, w, h, s);
      bogiPix.text(ctx, toast.text, x + 10 * s, 15 * s, s);
    }

    // 一枚絵を拡大した下絵(整数倍)。絵ごとに一度だけ作る
    const cutBufs = new Map();
    function cutBuf(im, s) {
      const key = im.src + "@" + s;
      if (!cutBufs.has(key)) {
        const c = document.createElement("canvas");
        c.width = im.width * s;
        c.height = im.height * s;
        const g = c.getContext("2d");
        g.imageSmoothingEnabled = false;
        g.drawImage(im, 0, 0, c.width, c.height);
        cutBufs.set(key, c);
      }
      return cutBufs.get(key);
    }
    function drawSeq() {
      const el = clock - cutscene.t0;
      const n = cutscene.seq.length;
      const fade = Math.min(1.4, cutscene.hold * 0.5);
      if (el >= n * cutscene.hold) {
        // 終わったら黒いまま。次のマップに切り替わるまで、前のマップを見せない
        ctx.fillStyle = "rgb(8, 8, 12)";
        ctx.fillRect(0, 0, VW, VH);
        if (!cutscene.ended) {
          cutscene.ended = true;
          const done = cutscene.onDone;
          if (done) setTimeout(done, 0);
        }
        return;
      }
      ctx.fillStyle = "rgb(8, 8, 12)";
      ctx.fillRect(0, 0, VW, VH);
      const i = Math.floor(el / cutscene.hold);
      const into = el - i * cutscene.hold;
      const put = (k, alpha) => {
        // 動く一枚絵: world.anims に名前があれば、そのコマを時間で送る(例: B の最後の旗 D273)
        const an = world.anims && world.anims[k];
        if (an) k = an.frames[Math.floor(clock * an.fps) % an.frames.length];
        const im = img(k);
        if (!im) return;
        const fit = Math.max(VW / im.width, VH / im.height);
        const c = cutBuf(im, Math.max(1, Math.ceil(fit)));
        const w = Math.round(im.width * fit);
        const h = Math.round(im.height * fit);
        ctx.globalAlpha = alpha;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(c, Math.round((VW - w) / 2), Math.round((VH - h) / 2), w, h);
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = 1;
      };
      put(cutscene.seq[i], 1);
      // 次の絵へ、ゆっくり重ねる(最後の絵は、そのまま暗くなって終わる)
      const left = cutscene.hold - into;
      if (left < fade) {
        if (i + 1 < n) put(cutscene.seq[i + 1], 1 - left / fade);
        else {
          ctx.fillStyle = `rgba(8, 8, 12, ${1 - left / fade})`;
          ctx.fillRect(0, 0, VW, VH);
        }
      }
    }
    // だんだん速く切りかえながら寄る(burst)
    function drawBurst() {
      const steps = cutscene.burst;
      let el = clock - cutscene.t0;
      let i = 0;
      while (i < steps.length && el >= steps[i].sec) {
        el -= steps[i].sec;
        i++;
      }
      if (i >= steps.length && cutscene.hold) {
        const last = steps[steps.length - 1];
        drawBurstFrame(last, last.sec);
        cutscene.held = true; // ここから A で閉じられる
        return;
      }
      if (i >= steps.length && !cutscene.white) {
        // 白く光らずに、最後の一コマのまま次へ(onDone で一枚絵を出すと、同じ絵がそのまま残る)
        const last = steps[steps.length - 1];
        drawBurstFrame(last, last.sec);
        if (!cutscene.ended) {
          cutscene.ended = true;
          const done = cutscene.onDone;
          cutscene = null;
          if (done) done();
        }
        return;
      }
      if (i >= steps.length) {
        // 白く光ったところで、次へ(マップの切りかえは onDone で。白は flash で引かせる)
        ctx.fillStyle = "rgb(255, 252, 240)";
        ctx.fillRect(0, 0, VW, VH);
        if (!cutscene.ended) {
          cutscene.ended = true;
          const done = cutscene.onDone;
          cutscene = null;
          flash = { t0: clock, sec: 0.5 };
          if (done) done();
        }
        return;
      }
      const st = steps[i];
      if (st.white) {
        ctx.fillStyle = "rgb(255, 252, 240)";
        ctx.fillRect(0, 0, VW, VH);
        return;
      }
      // 次の絵がうすく出てくるあいだは、前の絵の最後のコマを下に敷く(下のマップが透けて見えないように)
      if (st.fadeIn && i > 0 && el < st.fadeIn && !steps[i - 1].white) drawBurstFrame(Object.assign({}, steps[i - 1], { fadeIn: 0 }), steps[i - 1].sec);
      drawBurstFrame(st, el);
    }
    function drawBurstFrame(st, el) {
      const im = img(st.img);
      if (!im) return;
      const u = Math.min(1, el / st.sec);
      const k = st.ease === "out" ? 1 - (1 - u) * (1 - u) : u * u; // 寄るのも、だんだん速く(out は、だんだんゆっくり)
      const z = st.z0 + (st.z1 - st.z0) * k;
      const sw = im.width / z;
      const sh = im.height / z;
      const ccx = st.cx + ((st.cx1 != null ? st.cx1 : st.cx) - st.cx) * k;
      const ccy = st.cy + ((st.cy1 != null ? st.cy1 : st.cy) - st.cy) * k;
      const sx = clamp(ccx - sw / 2, 0, im.width - sw);
      const sy = clamp(ccy - sh / 2, 0, im.height - sh);
      // 一枚絵も、マップと同じようにゆれる。ゆれるぶんだけ大きく描いて、ふちが見えないようにする
      const a = shakeAmp() * ZOOM;
      const sk = shakeOffset();
      const fit = Math.max((VW + 2 * a) / sw, (VH + 2 * a) / sh);
      const w = sw * fit;
      const h = sh * fit;
      ctx.globalAlpha = st.fadeIn ? Math.min(1, el / st.fadeIn) : 1;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(im, sx, sy, sw, sh, Math.round((VW - w) / 2 + sk.sx * ZOOM), Math.round((VH - h) / 2 + sk.sy * ZOOM), Math.round(w), Math.round(h));
      ctx.globalAlpha = 1;
    }
    function drawCutscene() {
      if (cutscene.seq) return drawSeq();
      if (cutscene.burst) return drawBurst();
      const el = clock - cutscene.t0;
      // 閉じたあと、次のマップの上で絵だけが薄くなって消える(into)
      const out = cutscene.outT0 != null ? Math.min(1, (clock - cutscene.outT0) / 0.8) : 0;
      if (out >= 1) {
        cutscene = null;
        return;
      }
      const a = Math.min(1, el / 0.6) * (1 - out);
      ctx.fillStyle = `rgba(8, 8, 12, ${0.92 * a})`;
      ctx.fillRect(0, 0, VW, VH);
      const im = img(cutscene.img);
      if (!im) return;
      // 枠の角の丸みやスマホのボタンで端が欠けないよう、まわりに余白を残して描く。
      // 整数倍でくっきり拡大してから、余白に収まる大きさへなめらかに縮める
      const fit = cutscene.full
        ? Math.max(VW / im.width, VH / im.height) // 画面を覆う(はみ出した端は少し切れる)
        : Math.min((VW * 0.9) / im.width, (VH * 0.86) / im.height);
      const s = Math.max(1, Math.ceil(fit));
      if (!cutscene.buf || cutscene.buf.src !== im) {
        const c = document.createElement("canvas");
        c.width = im.width * s;
        c.height = im.height * s;
        const g = c.getContext("2d");
        g.imageSmoothingEnabled = false;
        g.drawImage(im, 0, 0, c.width, c.height);
        cutscene.buf = { src: im, canvas: c };
      }
      const w = Math.round(im.width * fit);
      const h = Math.round(im.height * fit);
      ctx.globalAlpha = a;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(cutscene.buf.canvas, Math.round((VW - w) / 2), Math.round((VH - h) / 2), w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 1;
    }

    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function ease(x) {
      const k = clamp(x, 0, 1);
      return k * k * (3 - 2 * k);
    }

    return {
      enter,
      leave,
      whenReady,
      update,
      draw,
      interact,
      jump,
      pressB,
      releaseB,
      hasAbility,
      image: (key) => img(key), // 会話の顔の絵など、今の世界の画像を host から使う
      get active() {
        return !!world;
      },
      // 一枚絵を見ているあいだ
      get viewing() {
        return !!cutscene;
      },
      get isHub() {
        return !!(world && world.hub);
      },
      // マップが操作をすべて止めているあいだ(B のスタッフロール D277)
      get locked() {
        return !!(map && map.lockInput);
      },
      // 止めているあいだに、キーかボタンが押された(スタッフロールの「おわり」のあとでタイトルへ、など)
      lockedPress() {
        if (map && map.onLockedPress) map.onLockedPress(world.api);
      },
      get worldId() {
        return world && world.id;
      },
      get worldName() {
        return world ? world.name : "";
      },
      // テスト用: 現在の状態をのぞく / 位置を動かす
      debug: {
        state: () => ({ map: map && map.id, x: player && player.x, y: player && player.y, near: nearObj && nearObj.id }),
        teleport(x, y) {
          player.x = x;
          player.y = y;
        },
        load: (mapId, spawn) => loadMap(mapId, spawn),
        api: () => world && world.api,
      },
    };
  }

  // ---- ドット文字と窓(ゲームの中の文字はすべてこれで描く: スーファミのドラクエ風) ----
  // 12px のゴシックを 1 倍で描いて白黒の 2 値に落とし、s 倍に拡大して描く。窓は黒地に白の二重枠
  const bogiPix = (() => {
    // ドットで作られた字体(DotGothic16)を、その 16 ドットの升目どおりに描く。読み込めるまでは普通のゴシック
    const font = () =>
      `16px ${document.fonts && document.fonts.check("16px DotGothic16") ? '"DotGothic16", ' : ""}"Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif`;
    const meas = document.createElement("canvas").getContext("2d");
    const cache = new Map();
    if (document.fonts && document.fonts.load) {
      document.fonts.load("16px DotGothic16").then(() => cache.clear()).catch(() => {});
    }
    function width(text) {
      meas.font = font();
      return Math.ceil(meas.measureText(text).width);
    }
    const GLYPH_PAD = 8;
    const GLYPH_H = 40;
    // この字体で、文字の上端がどの行に描かれるか(見本の文字で一度だけ測る)
    const inkTops = new Map();
    function inkTop() {
      const f = font();
      if (inkTops.has(f)) return inkTops.get(f);
      const c = document.createElement("canvas");
      c.width = 80;
      c.height = GLYPH_H;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.font = f;
      g.textBaseline = "top";
      g.fillStyle = "#fff";
      g.fillText("漢あAgy", 1, GLYPH_PAD);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let top = GLYPH_PAD;
      for (let y = 0; y < c.height; y++) {
        let hit = false;
        for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 110) hit = true;
        if (hit) {
          top = y;
          break;
        }
      }
      inkTops.set(f, top);
      return top;
    }
    function glyphs(text, color = "#ffffff") {
      const key = `${color}|${text}`;
      let c = cache.get(key);
      if (c) return c;
      if (cache.size > 400) cache.clear();
      c = document.createElement("canvas");
      c.width = Math.max(1, width(text) + 2);
      // 下が切れないよう高さに余裕をとる(ブラウザによって文字の縦の位置がちがう。上端は inkTop() でそろえる)
      c.height = GLYPH_H;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.font = font();
      g.textBaseline = "top";
      g.fillStyle = "#fff";
      g.fillText(text, 1, GLYPH_PAD);
      const img = g.getImageData(0, 0, c.width, c.height);
      const d = img.data;
      const [cr, cg, cb] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
      for (let i = 0; i < d.length; i += 4) {
        const on = d[i + 3] > 110;
        d[i] = cr;
        d[i + 1] = cg;
        d[i + 2] = cb;
        d[i + 3] = on ? 255 : 0;
      }
      g.putImageData(img, 0, 0);
      cache.set(key, c);
      return c;
    }
    // (x, y) は描く先の座標。s はドット 1 つの大きさ
    function text(ctx, str, x, y, s, color) {
      if (!str) return;
      const c = glyphs(str, color);
      const sm = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      // 文字の上端が (y - s) に来るように置く(どのブラウザでも同じ位置)
      ctx.drawImage(c, Math.round(x - s), Math.round(y - s - inkTop() * s), c.width * s, c.height * s);
      ctx.imageSmoothingEnabled = sm;
    }
    // 窓: (x, y, w, h) は描く先の座標(s の倍数にそろえる)
    function win(ctx, x, y, w, h, s) {
      x = Math.round(x / s) * s;
      y = Math.round(y / s) * s;
      w = Math.round(w / s) * s;
      h = Math.round(h / s) * s;
      // 黒地(四隅の 1 ドットは透かす)
      ctx.fillStyle = "#000";
      ctx.fillRect(x + 2 * s, y, w - 4 * s, h);
      ctx.fillRect(x, y + 2 * s, w, h - 4 * s);
      ctx.fillRect(x + s, y + s, w - 2 * s, h - 2 * s);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x + 2 * s, y, w - 4 * s, 2 * s);
      ctx.fillRect(x + 2 * s, y + h - 2 * s, w - 4 * s, 2 * s);
      ctx.fillRect(x, y + 2 * s, 2 * s, h - 4 * s);
      ctx.fillRect(x + w - 2 * s, y + 2 * s, 2 * s, h - 4 * s);
      ctx.fillRect(x + s, y + s, s, s);
      ctx.fillRect(x + w - 2 * s, y + s, s, s);
      ctx.fillRect(x + s, y + h - 2 * s, s, s);
      ctx.fillRect(x + w - 2 * s, y + h - 2 * s, s, s);
      ctx.fillStyle = "#7a7a7a";
      ctx.fillRect(x + 3 * s, y + 3 * s, w - 6 * s, s);
      ctx.fillRect(x + 3 * s, y + h - 4 * s, w - 6 * s, s);
      ctx.fillRect(x + 3 * s, y + 3 * s, s, h - 6 * s);
      ctx.fillRect(x + w - 4 * s, y + 3 * s, s, h - 6 * s);
    }
    // 1 倍の幅 maxW で折り返した行の配列(改行も守る)
    function wrap(str, maxW) {
      meas.font = font();
      const lines = [];
      for (const para of String(str).split("\n")) {
        let line = "";
        for (const ch of para) {
          if (line && meas.measureText(line + ch).width > maxW) {
            // 句読点は行頭に来ないように前の行へ
            if ("、。」）！？…".includes(ch)) {
              lines.push(line + ch);
              line = "";
              continue;
            }
            lines.push(line);
            line = "";
          }
          line += ch;
        }
        lines.push(line);
      }
      return lines;
    }
    return { width, glyphs, text, win, wrap };
  })();
  window.bogiPix = bogiPix;
  // ゲーム画面の文字のドットの大きさ。マップの絵のドット(ZOOM 2)とそろえる(960×600 のキャンバスで 480×300 相当)
  const PIX_S = 2;

  window.createBogiRPG = createRPG;
})();
