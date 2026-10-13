// 懲罰空間(ハブ)と、断片の台座。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ---- 懲罰空間: 何もない、白い空間。断片に近づくと、何もなかった場所に何かが見えてくる ----
const VOID_COLS = 44;
const VOID_ROWS = 36;

function voidGrid() {
  // 床のところどころに、うっすら段差のある場所(まばらに)
  const g = [];
  for (let r = 0; r < VOID_ROWS; r++) g.push(Array(VOID_COLS).fill("."));
  const blobs = [[6, 7, 2], [11, 40, 2], [20, 5, 2], [27, 36, 2], [31, 14, 3], [3, 4, 1], [16, 38, 1]]; // 台座と扉にかからない所(D257)
  for (const [br, bc, rad] of blobs) {
    for (let r = br - rad; r <= br + rad; r++)
      for (let c = bc - rad - 1; c <= bc + rad + 1; c++) {
        if (r < 0 || c < 0 || r >= VOID_ROWS || c >= VOID_COLS) continue;
        if (Math.hypot((r - br) * 1.3, c - bc) <= rad + 0.6 * rand(r, c, 9)) g[r][c] = ",";
      }
  }
  return g.map((row) => row.join(""));
}

// ふだんは段ごとに現れる(D257)。テストプレイで全部の断片を出したいときは、URL に ?all をつける
const SHOW_ALL_FRAGMENTS = /[?&]all\b/.test(location.search);

// 断片: 台座の上の小さな模型。触れると、その断片の世界に入る
// tier: 段(D257)。1 段ははじめから。2 段から先は、ひとつ前の段の断片をすべて終えると現れる。段の中は好きな順
function fragment(id, title, text, icon, col, row, tier) {
  const fx = col * T;
  const fy = row * T;
  const found = (api) => api.flag(`found.${id}`);
  const present = (api) => SHOW_ALL_FRAGMENTS || tier <= 1 || VOID_FRAGMENTS.every((f) => f.tier !== tier - 1 || api.cleared(f.id));
  return {
    id,
    tier,
    text, // ステータス画面の断片の説明にも使う
    object: {
      id: `frag_${id}`,
      x: fx,
      y: fy,
      w: 1,
      h: 1,
      headY: 86,
      solid: { w: 44, h: 18, dy: -8 },
      range: 46,
      // 台座は、はじめから 10 並んでいる(空の台座 D229)。断片が現れると模型が置かれ、終えると灯り、見届けるといっそう明るく灯る
      canInteract: (api) => present(api) && found(api),
      interact(api) {
        api.enterWorld(id);
      },
      draw(ctx, sx, sy, t, api) {
        const ped = api.image("pedestal");
        const ico = api.image(icon);
        const here = present(api);
        const done = api.cleared(id);
        const seen = api.observed(id);
        ctx.save();
        if (here) {
          // 灯り: 現れただけ = うすい青 / 終えた = あたたかい灯り / 見届けた = もっと大きく明るい灯り
          const r = seen ? 96 : done ? 70 : 54;
          const c = seen ? "255, 240, 196" : done ? "255, 228, 180" : "200, 225, 240";
          const al = seen ? 0.85 : done ? 0.55 : 0.4;
          const glow = ctx.createRadialGradient(sx, sy - 40, 4, sx, sy - 40, r);
          glow.addColorStop(0, `rgba(${c}, ${al})`);
          glow.addColorStop(1, `rgba(${c}, 0)`);
          ctx.fillStyle = glow;
          ctx.fillRect(sx - r, sy - 40 - r, r * 2, r * 2);
        }
        if (ped) ctx.drawImage(ped, sx - 32, sy - 58);
        if (here && ico) ctx.drawImage(ico, sx - 24, sy - 86 + Math.round(Math.sin(t * 2) * 2));
        ctx.restore();
      },
    },
    // 最初に触れたとき: そのまま中へ(名前や言葉は出さない。ネタバレになるので)
    trigger: {
      id: `touch_${id}`,
      x: fx - 50,
      y: fy - 44,
      w: 100,
      h: 80,
      enabled: present,
      run(api) {
        if (found(api)) return;
        api.setFlag(`found.${id}`);
        api.enterWorld(id);
      },
    },
    spawn: { x: fx, y: fy + 1.6 * T, facing: "south" },
  };
}

const VOID_FRAGMENTS = [
  // 配置(D257、todo 51): はじまり(南)から扉(北)へ、段ごとに北へ並ぶ。まん中の列(22)は扉への通り道として空ける
  fragment("lake", "凍った湖と富士山", "きーが見た風景。", "frag_lake", 20, 26, 1),
  fragment("haihei", "アンバリッド・ホテル", "Hi Hey Win！", "frag_haihei", 13, 21, 2),
  fragment("kasumi", "霞ヶ浦のエクラノプラン", "ミイラさまの遊覧飛行。", "frag_kasumi", 25, 21, 2),
  fragment("suzuki", "荒川の鈴木商店", "宛先がにじんで読めない。", "frag_suzuki", 34, 21, 2), // 説明の文面は仮
  fragment("banana", "南極のバナナ農園", "けさの気温 28℃。", "frag_banana", 9, 14, 3), // 説明の文面は仮
  fragment("takarabune", "宝舟と首振りエンジン", "何も描かれていない。", "frag_takarabune", 19, 14, 3), // 説明の文面は仮
  fragment("noroi", "呪いの野犬", "ポン　ポン　ポン。", "frag_noroi", 33, 14, 3), // 説明の文面は仮
  fragment("padre", "ぱーでれとだいにち", "カチ　カチ。", "frag_padre", 12, 8, 4), // 説明の文面は仮
  fragment("kinsei", "きこりと金星", "無風、92気圧、456℃、雲。", "frag_kinsei", 26, 8, 4), // D179
  fragment("bomber", "ぼぎボマーと地上ぼぎクルー", "REMOVE BEFORE FLIGHT", "frag_bomber", 34, 8, 4), // 説明の文面は仮
];

const VOID_DOOR = { x: 22 * T, y: 4 * T }; // 扉の足もと。いちばん北、まん中の通り道の突き当たり(D257)
let vDoorT = 0; // 扉が開いた時刻(灯りのふくらみ)。-1 は開くところを見せている最中
let vJustPulled = false; // 全集 10 冊の引きを見せた直後(続けて扉を開くときは、同じ引きをもう一度見せない)
const VOID = {
  tile: T,
  bg: "#f7f7f9",
  map: voidGrid(),
  legend: {
    ".": { wang: "void", lowerOf: ["void"] },
    ",": { wang: "void" },
  },
  wang: { void: { img: "wang_void", size: 32, lookup: WANG16 } },
  spawns: Object.assign(
    { start: { x: 26.9 * T, y: 33.5 * T, facing: "north" }, from_finale: { x: VOID_DOOR.x, y: VOID_DOOR.y + 1.2 * T, facing: "south" } },
    ...VOID_FRAGMENTS.map((f) => ({ [`from_${f.object.id.slice(5)}`]: f.spawn }))
  ),
  triggers: VOID_FRAGMENTS.map((f) => f.trigger),
  objects: VOID_FRAGMENTS.map((f) => f.object).concat([
    {
      // きーの部屋(D258): 四畳半の畳。床に敷くので、いつもいちばん下に描く
      id: "tatami",
      x: 28 * T,
      y: 31 * T,
      w: 1,
      h: 1,
      sortDy: -4000,
      draw(ctx, sx, sy, t, api) {
        const im = api.image("tatami");
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy));
      },
    },
    {
      // ちゃぶ台(D258)
      id: "chabudai",
      x: 28.2 * T,
      y: 33.3 * T,
      w: 1,
      h: 1,
      solid: { w: 40, h: 12, dy: -6 },
      draw(ctx, sx, sy, t, api) {
        const im = api.image("chabudai");
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height + 2));
      },
    },
    {
      // 太宰治全集の本棚(D214): 拾った文庫本が並んでいく。調べると冊数だけ見せる。どの断片の本が足りないかは、ステータスの「おもいで」でわかる(D267)
      // 10 冊そろえて真のエンディング(C)を見ると、本棚の奥に書庫(gallery)が見える(D258、D260)。戻ると、きーの部屋(はじまり)に戻る
      id: "shelf",
      x: 28 * T,
      y: 31.7 * T,
      w: 1,
      h: 1,
      headY: 62,
      range: 40,
      solid: { w: 40, h: 10, dy: -5 },
      draw(ctx, sx, sy, t, api) {
        const im = api.image("shelf");
        if (!im) return;
        const x0 = Math.round(sx - im.width / 2);
        const y0 = Math.round(sy - im.height + 2);
        ctx.drawImage(im, x0, y0);
        // 並んだ背表紙(上の段に 5 冊、下の段に 5 冊)。同じ装丁、色だけ少しちがう
        // 本棚の絵は斜めから見たものなので、棚板も右へ上がっている。背表紙は棚板の上に立てる(作者「本棚がへん」)
        // 棚板の上面: 上の段は左 y=29、下の段は左 y=49。右へ 26 ドットで 4 ドット上がる。左右は x=17〜37
        const got = (window.BOGI_DAZAI || []).filter((b) => api.flagOf(`${b.w}.dazai`));
        got.forEach((b, i) => {
          const row = i < 5 ? 0 : 1;
          const col = i % 5;
          const bx = x0 + 17 + col * 4;
          const base = (row ? 49 : 29) - Math.round(((17 + col * 4 - 15) * 4) / 26);
          const h = 9 + ((i * 7) % 3 === 0 ? 1 : 0);
          const by = y0 + base - h;
          ctx.fillStyle = ["#e9dfc6", "#e3d6b8", "#efe6cf"][i % 3];
          ctx.fillRect(bx, by, 3, h);
          ctx.fillStyle = "#b9a888"; // 右の面の影
          ctx.fillRect(bx + 3, by + 1, 1, h - 1);
          ctx.fillStyle = "#7a5a3a"; // 背の帯
          ctx.fillRect(bx, by + 2, 3, 1);
          ctx.fillRect(bx, by + h - 3, 3, 1);
        });
      },
      interact(api) {
        const n = (window.BOGI_DAZAI || []).filter((b) => api.flagOf(`${b.w}.dazai`)).length;
        api.bubble("shelf", n ? `${n}さつ` : "……", 1600);
        // 書庫は、10 冊そろえて、真のエンディング(C)を見たあとだけ開く(D260)
        if (n >= 10 && api.flagOf("finale.ending_c")) {
          api.freeze(2);
          api.later(1300, () => {
            try {
              sessionStorage.setItem("bogidachi.skipTitle", "1"); // 書庫から戻ったときは、タイトルを出さずにきーの部屋から(D259)
            } catch (e) {
              // 保存が使えなければタイトルから
            }
            location.href = "../gallery/index.html";
          });
        }
      },
    },
    {
      // 閉ざされた扉(D229、D232): いちばん北の奥(D257)。10 の台座がそろうと開き、その先にボタンの部屋がある
      id: "door",
      x: VOID_DOOR.x,
      y: VOID_DOOR.y,
      w: 1,
      h: 1,
      headY: 70,
      range: 40,
      solid: { w: 42, h: 10, dy: -5 },
      canInteract: (api) => api.flag("doorOpen"),
      interact(api) {
        api.enterWorld("finale");
      },
      draw(ctx, sx, sy, t, api) {
        const open = api.flag("doorOpen");
        const im = api.image(open ? "door_open" : "door");
        if (!im) return;
        ctx.save();
        if (open) {
          // 開いた扉の向こうから、うすい灯り
          const u = Math.min(1, (performance.now() / 1000 - Math.max(0, vDoorT)) / 1.5);
          const g = ctx.createRadialGradient(sx, sy - 34, 4, sx, sy - 34, 70);
          g.addColorStop(0, `rgba(210, 200, 240, ${0.5 * u})`);
          g.addColorStop(1, "rgba(210, 200, 240, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(sx - 70, sy - 104, 140, 140);
        }
        ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height));
        ctx.restore();
      },
    },
  ]),
  // すべての断片を終えて戻ると(D173、D184、D232): カメラが引いて月の欠けが見え、北の奥の扉が開く。一度だけ
  onEnter(api) {
    const all = VOID_FRAGMENTS.every((f) => api.cleared(f.id));
    const openDoor = () => {
      if (!all || api.flag("doorOpen") || vDoorT < 0) return;
      vDoorT = -1; // 見せているあいだ(cut で onEnter がもう一度呼ばれても、くり返さない)
      api.freeze(3);
      const door = () => {
        api.cut("void", "start");
        const p = api.player();
        const d = VOID_DOOR;
        api.camPath([
          { t: 0, x: p.x, y: p.y, z: 1 },
          { t: 2.4, x: d.x, y: d.y - 30, z: 1.5 },
          { t: 5.4, x: d.x, y: d.y - 30, z: 1.5 },
        ]);
        api.later(3000, () => {
          api.setFlag("doorOpen");
          vDoorT = performance.now() / 1000;
          api.sfx("chime");
        });
      };
      // 全集 10 冊と、すべての断片を同時にそろえて戻ったとき: 引きは 10 冊のほうで見せたので、すぐ扉へ(作者「演出が２回出る」)
      if (vJustPulled) {
        vJustPulled = false;
        api.later(600, door);
        return;
      }
      api.later(1400, () => api.showSeq(["v_pull1", "v_pull1c", "v_pull2", "v_pull3"], 2.6, door));
    };
    // 太宰治全集が 10 冊そろって戻ってきたら(D215): きーが「ださいおさむん」とつぶやき、カメラが引いて、月の裏側が見える。一度だけ
    const books = (window.BOGI_DAZAI || []).filter((b) => api.flagOf(`${b.w}.dazai`)).length;
    if (books >= 10 && !api.flag("dazaiMoon")) {
      api.setFlag("dazaiMoon");
      api.freeze(4.4);
      api.later(1200, () => api.mutter("ださいおさむん", 2600));
      api.later(4200, () =>
        api.showSeq(["v_pull1", "v_pull1c", "v_pull2", "v_pull3"], 2.8, () => {
          vJustPulled = all;
          api.cut("void", "start");
          openDoor();
        })
      );
      return;
    }
    openDoor();
  },
};
