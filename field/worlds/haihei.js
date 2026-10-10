// 断片: 廃兵院。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

// ======== 廃兵院(Hi Hey Win！) ========
// フィールドは今(夕方)。死人に話しかけると、生きていた頃の文化祭の日の思い出(一枚絵)が起きる。
// リリカルで、物悲しいが怖くない。サナトリウムのように穏やか。激戦があったことは匂わせるだけ。
const HS = {
  facade: { img: "facade", w: 544, h: 176, top: 0, bottom: 168 }, // 右端は東の病棟への渡り廊下
  arch: { img: "arch", w: 128, h: 96, top: 3, bottom: 93 },
  yakisoba: { img: "yakisoba", w: 96, h: 96, top: 12, bottom: 82, solid: [72, 20] },
  wataame: { img: "wataame", w: 96, h: 96, top: 12, bottom: 84, solid: [66, 20] },
  shateki: { img: "shateki", w: 128, h: 96, top: 9, bottom: 87, solid: [86, 24] },
  uketsuke: { img: "uketsuke", w: 96, h: 64, top: 4, bottom: 60, solid: [64, 20] },
  ginkgo_big: { img: "ginkgo_big", w: 86, h: 100, top: 0, bottom: 98, solid: [47, 14] }, // 中庭の真ん中の大銀杏(石の植え込み)
  ginkgo: { img: "ginkgo", w: 64, h: 96, top: 5, bottom: 91, solid: [14, 8] },
  stage: { img: "stage", w: 256, h: 96, top: 0, bottom: 96, solid: [240, 64] },
  prosthetic_rack: { img: "prosthetic_rack", w: 64, h: 64, top: 6, bottom: 58, solid: [56, 12] },
  workbench: { img: "workbench", w: 64, h: 32, top: 3, bottom: 30, solid: [54, 14] },
  arm_stand: { img: "arm_stand", w: 32, h: 64, top: 3, bottom: 61, solid: [16, 8] },
  exhibit1: { img: "exhibit1", w: 96, h: 48, top: 5, bottom: 48, solid: [80, 18] },
  exhibit2: { img: "exhibit2", w: 96, h: 48, top: 6, bottom: 48, solid: [84, 18] },
  wheelchair_back: { img: "wheelchair_back", w: 48, h: 48, top: 5, bottom: 43, solid: [30, 10] },
  wheelchair: { img: "wheelchair", w: 48, h: 48, top: 5, bottom: 44, solid: [26, 10] },
  telescope: { img: "telescope", w: 32, h: 48, top: 8, bottom: 48, solid: [16, 8] },
  radio: { img: "radio", w: 32, h: 32, top: 5, bottom: 27 },
  tv: { img: "tv_off", w: 48, h: 48, top: 6, bottom: 43, solid: [30, 12] },
  iv: { img: "iv", w: 20, h: 58, top: 0, bottom: 57, solid: [10, 6] },
  legshelf: { img: "legshelf", w: 64, h: 64, top: 3, bottom: 56, solid: [46, 14] },
  oxyvase: { img: "oxyvase", w: 32, h: 32, top: 5, bottom: 31 },
  starchart: { img: "starchart", w: 32, h: 37, top: 0, bottom: 36 },
  photo_wedding: { img: "photo_wedding", w: 32, h: 32, top: 0, bottom: 30 },
  guestbook: { img: "guestbook", w: 32, h: 32, top: 12, bottom: 23 }, // 来場者ノート
  noticeboard: { img: "noticeboard", w: 64, h: 64, top: 5, bottom: 62, solid: [48, 8] }, // 掲示板(ガリ版刷りの文化祭のビラ、献立表、消灯時刻)
  photo_fighter: { img: "photo_fighter", w: 32, h: 32, top: 0, bottom: 30 },
  art_fuji: { img: "art_fuji", w: 32, h: 32, top: 4, bottom: 23 },
  art_moon: { img: "art_moon", w: 32, h: 32, top: 4, bottom: 23 },
  art_ginkgo: { img: "art_ginkgo", w: 32, h: 32, top: 4, bottom: 23 },
  art_blob: { img: "art_blob", w: 32, h: 32, top: 4, bottom: 23 },
  art_self: { img: "art_self", w: 32, h: 32, top: 4, bottom: 23 },
  art_group: { img: "art_group", w: 32, h: 32, top: 4, bottom: 23 },
  art_banana: { img: "art_banana", w: 32, h: 32, top: 4, bottom: 23 },
  art_squad: { img: "art_squad", w: 32, h: 32, top: 4, bottom: 23 },
  art_roof: { img: "art_roof", w: 32, h: 32, top: 4, bottom: 23 },
  d_family: { img: "d_family", w: 96, h: 64, top: 17, bottom: 55, solid: [60, 14] },
  d_visitors: { img: "d_visitors", w: 64, h: 64, top: 4, bottom: 60 },
  tansu: { img: "tansu", w: 32, h: 64, top: 3, bottom: 61, solid: [28, 12] },
  futon: { img: "futon", w: 32, h: 64, top: 8, bottom: 56 },
  hibachi: { img: "hibachi", w: 32, h: 32, top: 6, bottom: 28, solid: [18, 8] },
  tricycle: { img: "tricycle", w: 32, h: 32, top: 5, bottom: 27 },
  kyodai: { img: "kyodai", w: 32, h: 48, top: 5, bottom: 47, solid: [22, 8] },
  stairs: { img: "stairs", w: 64, h: 64, top: 0, bottom: 64 },
  door: { img: "door", w: 32, h: 64, top: 10, bottom: 56 },
  bonsai_table1: { img: "bonsai_table1", w: 128, h: 48, top: 12, bottom: 45, solid: [124, 14] },
  bonsai_table2: { img: "bonsai_table2", w: 128, h: 48, top: 12, bottom: 45, solid: [124, 14] },
  bed_h: { img: "bed_h", w: 64, h: 54, top: 0, bottom: 53, solid: [58, 16] },
  d_bedman_h: { img: "d_bedman_h", w: 64, h: 54, top: 0, bottom: 53, solid: [58, 16] },
  cabinet_radio: { img: "cabinet_radio", w: 28, h: 55, top: 0, bottom: 54, solid: [24, 10] },
  bed_f: { img: "bed_f", w: 32, h: 64, top: 5, bottom: 59, solid: [26, 40] },
  cot: { img: "cot", w: 32, h: 32, top: 2, bottom: 32, solid: [20, 10] },
  d_uketsuke: { img: "d_uketsuke", w: 64, h: 64, top: 11, bottom: 54 },
  d_shateki: { img: "d_shateki", w: 64, h: 64, top: 5, bottom: 58, solid: [24, 10] },
  d_yakisoba: { img: "d_yakisoba", w: 64, h: 64, top: 4, bottom: 61, solid: [24, 10] },
  d_carver: { img: "d_carver", w: 48, h: 48, top: 4, bottom: 45, solid: [28, 10] }, // 畳の上で正座
  plane: { img: "plane", w: 128, h: 64, top: 8, bottom: 60, solid: [110, 18] },
  workbench: { img: "workbench", w: 96, h: 48, top: 10, bottom: 46, solid: [86, 14] },
  drums: { img: "drums", w: 96, h: 48, top: 10, bottom: 44, solid: [88, 12] },
  gondola: { img: "gondola", w: 160, h: 72, top: 14, bottom: 62, solid: [150, 20] },
  crew_hawk: { img: "crew_hawk", w: 32, h: 40, top: 0, bottom: 39, solid: [14, 8] },
  crew_wagtail: { img: "crew_wagtail", w: 30, h: 39, top: 0, bottom: 38, solid: [14, 8] },
  crew_rooster: { img: "crew_rooster", w: 30, h: 39, top: 0, bottom: 38, solid: [14, 8] },
  seat: { img: "seat", w: 48, h: 64, top: 4, bottom: 56, solid: [34, 14] },
  mummy: { img: "mummy", w: 48, h: 64, top: 2, bottom: 56, solid: [34, 14] },
  poppo_row: { img: "poppo_row", w: 40, h: 12, top: 1, bottom: 11 },
  bench: { img: "bench", w: 60, h: 26, top: 0, bottom: 25, solid: [56, 10] },
  clock: { img: "clock", w: 12, h: 29, top: 0, bottom: 28 },
  firebucket: { img: "firebucket", w: 28, h: 23, top: 0, bottom: 22, solid: [24, 8] },
  plant: { img: "plant", w: 18, h: 24, top: 0, bottom: 23, solid: [12, 6] },
  portrait: { img: "portrait", w: 32, h: 32, top: 2, bottom: 26 },
  d_wheel: { img: "d_wheel", w: 64, h: 64, top: 7, bottom: 58, solid: [26, 10] },
  d_bedman: { img: "d_bedman", w: 32, h: 64, top: 3, bottom: 62, solid: [26, 40] },
  d_band1: { img: "d_band1", w: 48, h: 64, top: 11, bottom: 61 },
  d_band2: { img: "d_band2", w: 48, h: 64, top: 8, bottom: 58 },
  d_band3: { img: "d_band3", w: 48, h: 64, top: 7, bottom: 57 },
  d_band4: { img: "d_band4", w: 48, h: 64, top: 7, bottom: 59 },
  d_band5: { img: "d_band5", w: 48, h: 64, top: 14, bottom: 54 },
  wx_bed: { img: "wx_bed", w: 48, h: 64, top: 4, bottom: 60, solid: [38, 44] },
  wx_chair: { img: "wx_chair", w: 32, h: 32, top: 3, bottom: 30, solid: [22, 10] },
  wx_gramophone: { img: "wx_gramophone", w: 32, h: 48, top: 2, bottom: 45, solid: [20, 10] },
  wx_lamp: { img: "wx_lamp", w: 32, h: 64, top: 5, bottom: 59, solid: [12, 6] },
  wx_teatable: { img: "wx_teatable", w: 32, h: 32, top: 3, bottom: 30, solid: [22, 10] },
  deskphoto: { img: "deskphoto", w: 32, h: 48, top: 5, bottom: 44, solid: [26, 10] },
  d_scope: { img: "d_scope", w: 64, h: 64, top: 8, bottom: 56, solid: [30, 12] },
};

// 掲示板: 自治会のガリ版刷りの文化祭のビラと、献立表・消灯時刻・尋ね人(調べるとアップ)
function board(id, fx, fy) {
  return hat("noticeboard", fx, fy, {
    id,
    range: 44,
    interact(api) {
      api.show("v_board");
    },
  });
}
function hat(kind, fx, fy, extra) {
  const s = HS[kind];
  const o = { img: s.img, w: s.w, h: s.h, x: fx, y: fy - (s.bottom - s.h / 2), sortDy: s.bottom - s.h / 2, headY: s.h / 2 - s.top };
  if (s.solid) o.solid = { w: s.solid[0], h: s.solid[1], dy: o.sortDy - s.solid[1] / 2 };
  return Object.assign(o, extra || {});
}

// スタンプラリー(屋台・展示・舞台)
const STAMPS = ["stall", "exhibit", "stage"];
function stampCount(api) {
  return STAMPS.filter((k) => api.flag(`stamp.${k}`)).length;
}
// 台紙の絵: 押した場所の枠にハンコ(屋台=1, 展示=2, 舞台=4 のビットで 8 通り)
const cardImage = (api) => `v_card_${STAMPS.reduce((m, k, i) => m | (api.flag(`stamp.${k}`) ? 1 << i : 0), 0)}`;
// 押すたびに台紙を見せる。押してある場所をもう一度調べても、今の台紙を見せる(押したかどうか確かめられる)
function stamp(api, key, delayMs = 0) {
  api.setFlag(`stamp.${key}`);
  api.later(delayMs, () => api.show(cardImage(api)));
}
// 死人: 話しかけると、その人との思い出
function dead(kind, id, fx, fy, memory, after, extra) {
  return hat(kind, fx, fy, Object.assign({
    id,
    range: 40,
    interact(api) {
      api.show(memory, () => after && after(api));
    },
  }, extra || {}));
}
// 掛け声: その場にいる死人たちから、いっせいに
function hiHeyWin(api, ids) {
  ids.forEach((id, i) => api.later(i * 180, () => api.bubble(id, "Hi Hey Win！", 2600)));
}

// 万国旗(色あせた三角の旗を、たるませて吊る)
function bunting(ctx, ox, oy, x0, y0, x1, y1, t) {
  const cols = ["#c8766a", "#d6b46a", "#7fa7b8", "#9cb07a", "#c99ab2"];
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.floor(len / 12);
  ctx.strokeStyle = "rgba(60, 40, 30, 0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const x = x0 + (x1 - x0) * k + ox;
    const y = y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * 18 + oy;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n;
    const x = Math.round(x0 + (x1 - x0) * k + ox);
    const y = Math.round(y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * 18 + oy);
    const sway = Math.round(Math.sin(t * 2 + i) * 1);
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.lineTo(x + sway, y + 8);
    ctx.closePath();
    ctx.fill();
  }
}

// ひとりでに競争している、からの車椅子
function racer(id, row, speed, phase) {
  const x0 = 3.5 * T;
  const x1 = 14.5 * T;
  return {
    id,
    x: x0,
    y: row * T - 20,
    w: 48,
    h: 48,
    sortDy: 20,
    dir: 1,
    update(dt, t) {
      const span = x1 - x0;
      const p = ((t * speed + phase) % (span * 2) + span * 2) % (span * 2);
      this.dir = p < span ? 1 : -1;
      this.x = x0 + (p < span ? p : span * 2 - p);
    },
    draw(ctx, sx, sy, t, api) {
      const im = api.image("wheelchair");
      if (!im) return;
      ctx.save();
      ctx.translate(sx, sy + Math.round(Math.sin(t * 12 + phase) * 1));
      ctx.scale(this.dir, 1);
      ctx.drawImage(im, -24, -24);
      ctx.restore();
    },
  };
}

// 松葉杖だけが歩いている(使っていた人は見えない)。杖を前について、からだを振り出す歩き方
function crutchWalker(id, row, x0, x1, speed) {
  const S = 26; // ひと足の幅
  return {
    id,
    x: x0,
    y: row * T,
    w: 32,
    h: 48,
    sortDy: 0,
    dir: 1,
    update(dt, t) {
      const span = x1 - x0;
      const p = (t * speed) % (span * 2);
      this.dir = p < span ? 1 : -1;
      this.x = x0 + (p < span ? p : span * 2 - p);
      this.d = (p % S + S) % S;
    },
    draw(ctx, sx, sy, t, api) {
      const im = api.image("crutch");
      if (!im) return;
      // 杖の先の、脇からの前後のずれ: 地面についているあいだは後ろへ流れ、浮いたら前へ振り出す
      const d = this.d || 0;
      const stance = 0.7 * S;
      let rel;
      let lift = 0;
      if (d < stance) rel = 0.35 * S - d;
      else {
        const u = (d - stance) / (S - stance);
        rel = -0.35 * S + u * 0.7 * S;
        lift = Math.sin(u * Math.PI) * 2;
      }
      const ang = -Math.atan2(rel * this.dir, 40);
      const bob = d < stance ? -Math.sin((d / stance) * Math.PI) * 2 : 0;
      // 地面の影(杖の先と、見えない人の足もと)
      ctx.fillStyle = "rgba(40, 30, 20, 0.18)";
      ctx.beginPath();
      ctx.ellipse(sx, sy, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      for (const [dx, dy, dark] of [[3, -5, true], [0, 1, false]]) {
        ctx.save();
        ctx.translate(Math.round(sx + dx * this.dir), Math.round(sy - 40 + dy + bob));
        ctx.rotate(ang);
        if (dark) ctx.filter = "brightness(0.7)";
        ctx.drawImage(im, -6, -2 - lift);
        ctx.restore();
      }
    },
  };
}

// ---- 中庭(門、受付、屋台) ----
function yardGrid() {
  const g = [];
  for (let r = 0; r < 20; r++) {
    const row = [];
    for (let c = 0; c < 18; c++) {
      let ch = ",";
      if (r < 5) ch = "G";
      else if ((c === 8 || c === 9) && r >= 5) ch = ".";
      else if (r >= 9 && r <= 15 && c >= 3 && c <= 14) ch = ".";
      else if (r >= 16 && r <= 18 && c >= 7 && c <= 13) ch = "."; // 門を入った前庭(受付)
      row.push(ch);
    }
    g.push(row.join(""));
  }
  return g;
}

const YARD = {
  tile: T,
  bg: "#3d5a2e",
  tintMul: "#f2b48a",
  tint: "rgba(255, 150, 70, 0.10)",
  map: yardGrid(),
  legend: {
    ".": { wang: "yard", lowerOf: ["yard"] },
    ",": { wang: "yard" },
    G: { wang: "yard", solid: true },
  },
  wang: { yard: { img: "wang_yard", size: 32, lookup: WANG16 } },
  spawns: {
    gate: { x: 9 * T, y: 18.6 * T, facing: "north" },
    door: { x: 9 * T, y: 6 * T, facing: "south" },
  },
  onEnter(api) {
    if (api.flag("heard")) return;
    api.setFlag("heard");
    api.later(900, () => api.mutter("はい　へい　うぃん", 3200));
  },
  triggers: [
    { id: "toHall", x: 8 * T, y: 4.6 * T, w: 2 * T, h: 0.8 * T, warp: { map: "hall", spawn: "south" } },
    // 門(来たところ)から、懲罰空間へ戻る
    { id: "leave", x: 7.5 * T, y: 19.35 * T, w: 3 * T, h: T, run: (api) => api.exit() },
  ],
  drawOverlay(ctx, ox, oy, t) {
    bunting(ctx, ox, oy, 3 * T, 4.2 * T, 3.5 * T, 17.5 * T, t);
    bunting(ctx, ox, oy, 15 * T, 4.2 * T, 14.5 * T, 17.5 * T, t);
    bunting(ctx, ox, oy, 2 * T, 8.5 * T, 16 * T, 8.5 * T, t);
    bunting(ctx, ox, oy, 2 * T, 12.5 * T, 16 * T, 12.5 * T, t);
  },
  objects: [
    hat("facade", 9.5 * T, 5 * T), // 玄関が 9 列目の中央に来る
    board("board_gate", 7 * T, 9.3 * T), // 中庭の奥、病棟への道の脇の掲示板(正面から見える)
    hat("ginkgo_big", 9 * T, 12.6 * T), // 中庭の真ん中の大銀杏
    hat("ginkgo", 1.2 * T, 7 * T),
    hat("ginkgo", 16.8 * T, 7.4 * T),
    hat("ginkgo", 1.4 * T, 17 * T),
    hat("ginkgo", 16.6 * T, 16.8 * T),
    hat("arch", 9 * T, 19.6 * T, { sortDy: 60 }),
    // 受付: 門を入ってすぐ、道の右わきの机。道を歩いてくると正面に向かい合う
    hat("uketsuke", 11.7 * T, 17.7 * T),
    // 来場者ノート(かすれた縦書き。宇宙海軍の部隊名がほのかに読める)
    hat("guestbook", 11.3 * T, 17.1 * T, {
      id: "guestbook",
      sortDy: 30,
      iy: 30,
      range: 40,
      interact(api) {
        api.show("v_guestbook");
      },
    }),
    dead("d_uketsuke", "uketsuke", 12.2 * T, 16.9 * T, "v_uketsuke", null, {
      sortDy: 20,
      range: 64, // 受付の机ごしに話しかける
      interact(api) {
        if (!api.flag("card")) {
          api.show("v_uketsuke", () => {
            api.setFlag("card");
            api.giveItem("スタンプ台紙");
            api.show(cardImage(api)); // もらった台紙
          });
        } else if (stampCount(api) === STAMPS.length && !api.flag("prize")) {
          api.show(cardImage(api), () => {
            api.setFlag("prize");
            api.hold("ic_poppo", 1.8, () => {
              api.giveItem("おたかぽっぽ"); // スタンプの特典: 展示で彫られていたのと同じ、小さな一刀彫
              api.clear(); // 景品をもらえば、この断片は終わり(D266)。屋上の手すりは寄り道。帰りは門から
            });
          });
        } else {
          api.show("v_uketsuke", () => api.show(cardImage(api))); // 今の台紙
        }
      },
    }),
    hat("yakisoba", 4.5 * T, 11 * T),
    dead("d_yakisoba", "yakisoba", 6.2 * T, 11.6 * T, "v_yakisoba"),
    hat("wataame", 4.5 * T, 15 * T),
    // 祭に来ていた市民: 綿あめを持った子と母
    dead("d_visitors", "visitors", 6.6 * T, 15.2 * T, "v_wataame"),
    hat("shateki", 13 * T, 11 * T),
    dead("d_shateki", "shateki", 15.6 * T, 11.7 * T, "v_stall", (api) => stamp(api, "stall")),
    racer("racer1", 14.1, 40, 90),
    crutchWalker("crutches", 15.3, 8 * T, 12.5 * T, 12),
  ],
};

// 手前(南)のガラス窓から、床に落ちる夕日の帯。西日なので右上へ斜めにのびる
function southLight(ctx, ox, oy, x0, x1, yWall) {
  ctx.fillStyle = "rgba(255, 196, 120, 0.13)";
  for (let x = x0 + 8; x < x1 - T; x += 2 * T) {
    ctx.beginPath();
    ctx.moveTo(x + ox, yWall + oy);
    ctx.lineTo(x + 1.3 * T + ox, yWall + oy);
    ctx.lineTo(x + 2.1 * T + ox, yWall - 1.6 * T + oy);
    ctx.lineTo(x + 0.8 * T + ox, yWall - 1.6 * T + oy);
    ctx.closePath();
    ctx.fill();
  }
}

// ---- 大広場(建物に入ってすぐ。舞台、客席の車椅子、作品展示、談話のテレビ。右へ進むと廊下) ----
// マップチップに揃える: 物の中心は升目の中心、足もとは升目の境目に置く
// 談話のすみのテレビ(最初は消えている)。調べるたびに入/切、つけると画面を見る
let tvOn = false;
const TV = hat("tv", 13.5 * T, 3 * T, {
  id: "tv",
  range: 40,
  interact(api) {
    tvOn = !tvOn;
    if (tvOn) api.later(300, () => api.show("v_tv"));
  },
});
Object.defineProperty(TV, "img", { get: () => (tvOn ? "tv_on" : "tv_off") });

const HALL = {
  tile: T,
  bg: "#1c1411",
  tintMul: "#f0c09a",
  tint: "rgba(255, 150, 70, 0.08)",
  map: [
    "UVUVUUUUUUUUVUVU",
    "LvLvLLLLLLLLvLvL",
    "X..............X",
    "X..............X",
    "X..............X",
    "X..............X",
    "X..............X",
    "X...............",
    "X...............",
    "X..............X",
    "X..............X",
    "XXXXXXX..XXXXXXX",
  ],
  legend: {
    X: { solid: true, color: "#2a1d17", lowerOf: ["ward"] },
    // 腰板と漆喰の壁に、文化祭の紙の輪飾り。北の外壁なので上げ下げ窓がある
    U: { solid: true, img: "aw_g", crop: [0, 0], lowerOf: ["ward"] },
    L: { solid: true, img: "aw_g", crop: [0, 32], lowerOf: ["ward"] },
    V: { solid: true, img: "aw_wg", crop: [0, 0], lowerOf: ["ward"] },
    v: { solid: true, img: "aw_wg", crop: [0, 32], lowerOf: ["ward"] },
    ".": { wang: "ward", lowerOf: ["ward"] },
  },
  wang: { ward: { img: "wang_ward", size: 32, lookup: WANG16 } },
  drawGround(ctx, ox, oy) {
    southLight(ctx, ox, oy, T, 15 * T, 11 * T); // 玄関の両わきの窓から
  },
  spawns: {
    south: { x: 8 * T, y: 10.4 * T, facing: "north" },
    east: { x: 15 * T, y: 8 * T, facing: "west" },
  },
  triggers: [
    { id: "toYard", x: 7 * T, y: 11.3 * T, w: 2 * T, h: T, warp: { map: "yard", spawn: "door" } },
    { id: "toWard", x: 15.4 * T, y: 7 * T, w: T, h: 2 * T, warp: { map: "watari", spawn: "west" } },
  ],
  objects: [
    hat("stage", 8 * T, 5 * T),
    // 舞台の楽団(思い出の絵と同じ5人): アコーディオン、マンドリン、車椅子の大太鼓、ギター、歌
    ...[
      ["d_band1", "band1", 5],
      ["d_band2", "band2", 6.5],
      ["d_band3", "band3", 8],
      ["d_band4", "band4", 9.5],
      ["d_band5", "band5", 11],
    ].map(([kind, id, c], i, all) =>
      dead(kind, id, c * T, 4.6 * T, "v_stage", (api) => {
        stamp(api, "stage", 2800); // 掛け声のあとで台紙
        hiHeyWin(api, [id, ...all.map((b) => b[1]).filter((b) => b !== id)]);
      }, { sortDy: 60, iy: 60, range: 56 })
    ),
    // 客席: 車椅子を一列に
    // 客席: 舞台のほうを向いた車椅子(こちらからは背中が見える)
    ...[5, 6.5, 8, 9.5, 11].map((c) => hat("wheelchair_back", c * T, 7.2 * T)),
    // 作品展示: 白い布を掛けた長机に、盆栽を並べる
    hat("bonsai_table1", 3 * T, 9.3 * T),
    hat("bonsai_table2", 3 * T, 10.9 * T),
    // 作りかけのおたかポッポ(手すさび)が並ぶ台
    // (彫っていた人は、廊下の奥の自分の部屋にいる)
    hat("exhibit2", 11.5 * T, 9.5 * T, {
      id: "exhibit2",
      range: 36,
      interact(api) {
        api.mutter("ちゃん");
        stamp(api, "exhibit");
      },
    }),
    board("board_hall", 2.3 * T, 3.3 * T), // 大広場の奥の壁ぎわの掲示板
    // 談話のすみのテレビ。調べるたびに電源が入/切。つけると南極のバナナ農園の中継
    TV,
  ],
};

// 畳を敷く(横長の畳を、段ごとにずらして)
function tatami(ctx, x0, y0, cols, rows) {
  const w = cols * T;
  const h = rows * T;
  ctx.fillStyle = "#c2a86e";
  ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = "rgba(120, 96, 50, 0.25)";
  for (let x = x0 + 1; x < x0 + w; x += 3) ctx.fillRect(x, y0, 1, h); // い草の目
  ctx.fillStyle = "#3d5238";
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * T;
    ctx.fillRect(x0, y, w, 2);
    for (let x = x0 + (r % 2 ? T : 0); x <= x0 + w; x += 2 * T) ctx.fillRect(Math.min(x, x0 + w - 2), y, 2, T);
  }
  ctx.fillRect(x0, y0 + h - 2, w, 2);
}

const wallPhoto = (kind, x, vignette) =>
  hat(kind, x, 1.3 * T, {
    id: kind,
    sortDy: -40,
    iy: 20,
    range: 40,
    interact(api) {
      api.show(vignette);
    },
  });
// ---- 渡り廊下(大広場から東の病棟へ。屋根付きで、両側は手すりごしに中庭の草地) ----
const WATARI_W = 9;
const WATARI = {
  tile: T,
  bg: "#1c1411",
  tintMul: "#f2b48a",
  tint: "rgba(255, 150, 70, 0.10)",
  map: ["G".repeat(WATARI_W), "R".repeat(WATARI_W), ".".repeat(WATARI_W), ".".repeat(WATARI_W), "R".repeat(WATARI_W), "G".repeat(WATARI_W)],
  legend: {
    G: { wang: "yard", solid: true, lowerOf: ["ward"] },
    R: { wang: "ward", solid: true, lowerOf: ["ward"] },
    ".": { wang: "ward", lowerOf: ["ward"] },
  },
  wang: {
    yard: { img: "wang_yard", size: 32, lookup: WANG16 },
    ward: { img: "wang_ward", size: 32, lookup: WANG16 },
  },
  drawGround(ctx, ox, oy, img) {
    const W = WATARI_W * T;
    // 屋根の影(床の上だけ、少し暗く)と、西日の差し込み
    ctx.fillStyle = "rgba(40, 24, 16, 0.18)";
    ctx.fillRect(ox, T + oy, W, 4 * T);
    southLight(ctx, ox, oy, 0, W, 5 * T);
    // 手すり(北と南): 柱と横木の絵を、2マスごとに並べる
    const rail = typeof img === "function" && img("rail");
    if (rail) {
      for (const y of [T - 2, 4 * T - 14]) {
        for (let x = 0; x < W; x += rail.width) {
          const w = Math.min(rail.width, W - x); // 端ではみ出さないように切る
          ctx.drawImage(rail, 0, 0, w, rail.height, x + ox, y + oy, w, rail.height);
        }
      }
    }
  },
  spawns: {
    west: { x: 0.8 * T, y: 3 * T, facing: "east" },
    east: { x: (WATARI_W - 0.8) * T, y: 3 * T, facing: "west" },
  },
  triggers: [
    { id: "toHall", x: -T, y: 2 * T, w: 1.8 * T, h: 2 * T, warp: { map: "hall", spawn: "east" } },
    { id: "toWard", x: (WATARI_W - 0.8) * T, y: 2 * T, w: 1.8 * T, h: 2 * T, warp: { map: "ward", spawn: "west" } },
  ],
  objects: [],
};

// 廊下の作品展: 患者たちの絵と、写真
const CORRIDOR_ARTS = [["fuji", 1.4], ["moon", 6.6], ["ginkgo", 9.4], ["roof", 14.6], ["blob", 17.4], ["self", 22.6], ["group", 25.4], ["banana", 30.6], ["squad", 33.4]];
// ---- 廊下(個室のドアと、絵や写真の展示が並ぶ。途中に詰所、突き当たりに屋上への階段) ----
// 病棟の片廊下: 北側に個室が幅8マス(内法7マス+仕切り)で並び、ドアは各部屋の中央。南側は一面のガラス窓
const WARD_W = 52;
const ROOM_MOD = 8;
const DOORS = { sick: 4, window: 12, room1: 20, room2: 28, workshop: 36, carver: 44 }; // ドアの列
const STAIR_C = 49; // 突き当たりの階段(2マス)
const wardWallRow = (a, b) => {
  let r = "";
  for (let c = 0; c < WARD_W; c++) {
    if (c === WARD_W - 1) r += "X";
    else if (c === STAIR_C || c === STAIR_C + 1) r += "O";
    else if (c % ROOM_MOD === 0) r += b; // 部屋の仕切りの柱
    else r += a;
  }
  return r;
};
const WARD = {
  tile: T,
  bg: "#1c1411",
  tintMul: "#f0c09a",
  tint: "rgba(255, 150, 70, 0.08)",
  map: [
    wardWallRow("U", "P"),
    wardWallRow("L", "p"),
    "." + ".".repeat(WARD_W - 2) + "X",
    "." + ".".repeat(WARD_W - 2) + "X",
    "X" + ".".repeat(WARD_W - 2) + "X",
    "X".repeat(WARD_W),
  ],
  legend: {
    X: { solid: true, color: "#2a1d17", lowerOf: ["ward"] },
    // 奥の壁は個室との間の内壁(窓はない。外が見えるのは個室の窓と、手前(南)のガラス窓)
    U: { solid: true, img: "aw_g", crop: [0, 0], lowerOf: ["ward"] },
    L: { solid: true, img: "aw_g", crop: [0, 32], lowerOf: ["ward"] },
    P: { solid: true, img: "aw_pg", crop: [0, 0], lowerOf: ["ward"] },
    p: { solid: true, img: "aw_pg", crop: [0, 32], lowerOf: ["ward"] },
    O: { solid: true, color: "#1a120d", lowerOf: ["ward"] }, // 階段の口
    ".": { wang: "ward", lowerOf: ["ward"] },
  },
  wang: { ward: { img: "wang_ward", size: 32, lookup: WANG16 } },
  // 廊下の端を閉じる: 突き当たりの側壁、大広場への入口の枠、手前の壁の見切り
  drawGround(ctx, ox, oy) {
    const wallTop = (x, y, w, h) => {
      ctx.fillStyle = "#3a261b";
      ctx.fillRect(x + ox, y + oy, w, h);
      ctx.fillStyle = "#7a5638";
      if (w < h) ctx.fillRect(x + ox + (x > T ? 0 : w - 2), y + oy, 2, h);
      else ctx.fillRect(x + ox, y + oy, w, 2);
    };
    const E = (WARD_W - 1) * T;
    southLight(ctx, ox, oy, 0, E, 5 * T);
    wallTop(E, 0, 8, 5 * T + 8); // 突き当たりの側壁
    wallTop(0, 5 * T, E + 8, 8); // 手前の見切り
    wallTop(T - 8, 4 * T, 8, T + 8); // 入口の下側の壁
    // 入口の枠(柱と鴨居)
    ctx.fillStyle = "#5b3d2a";
    ctx.fillRect(T - 8 + ox, 2 * T - 6 + oy, 8, 6);
    ctx.fillRect(T - 8 + ox, 4 * T - 4 + oy, 8, 4);
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)"; // 大広場のほうへ落ちる影
    ctx.fillRect(ox, 2 * T + oy, T - 8, 2 * T);
  },
  spawns: Object.assign(
    { west: { x: 1 * T, y: 3.4 * T, facing: "east" }, stairs: { x: (STAIR_C + 1) * T, y: 2.8 * T, facing: "south" } },
    Object.fromEntries(Object.entries(DOORS).map(([k, c]) => [k, { x: (c + 0.5) * T, y: 2.8 * T, facing: "south" }]))
  ),
  triggers: [
    { id: "toHall", x: -T, y: 2 * T, w: 1.5 * T, h: 2 * T, warp: { map: "watari", spawn: "east" } },
    // 個室のドア: 入ると部屋に切り替わる
    // 突き当たりの階段: 歩いて上がると屋上へ
    { id: "toRoof", x: (STAIR_C + 0.2) * T, y: 1.9 * T, w: 1.6 * T, h: 0.45 * T, warp: { map: "roof", spawn: "up" } },
    ...Object.entries(DOORS).map(([k, c]) => ({ id: `to_${k}`, x: (c + 0.1) * T, y: 1.9 * T, w: 0.8 * T, h: 0.45 * T, warp: { map: k, spawn: "door" } })),
  ],
  objects: [
    ...Object.values(DOORS).map((c) => hat("door", (c + 0.5) * T, 2 * T, { sortDy: -40 })),
    ...CORRIDOR_ARTS.map(([k, c]) => wallPhoto(`art_${k}`, (c + 0.5) * T, `v_art_${k}`)),
    // からの車椅子が、廊下を走っていた
    dead("d_wheel", "wheel", 6.5 * T, 4.9 * T, "v_wheel"),
    // 廊下の奥: 壁ぎわの長椅子、止まったままの柱時計、防火用水、葉蘭の鉢
    hat("bench", 38.9 * T, 2.9 * T),
    hat("clock", 40 * T + 3, 1.25 * T, { sortDy: -40 }),
    hat("firebucket", 42.5 * T, 2.85 * T),
    hat("plant", 46.6 * T, 2.85 * T),
    // 屋上への階段(壁の開口部)
    hat("stairs", (STAIR_C + 1) * T, 2 * T, { sortDy: -40 }),
  ],
};

// ---- 個室(ドアから入り、下の出口から廊下へ戻る)。floor: "tatami" | "wood" | "western"(和室を洋風に改装) ----
function room(key, floor, objects, wallRow = "PWWWPWWWP") {
  const western = floor === "western";
  const wood = floor === "wood" || western;
  const wall = western ? "rwallx" : wood ? "aw" : "rwall";
  return {
    tile: T,
    bg: "#1c1411",
    tintMul: "#f0c09a",
    tint: "rgba(255, 150, 70, 0.08)",
    map: [wallRow, wallRow.toLowerCase(), "X.......X", "X.......X", "X.......X", "X.......X", "XXXX.XXXX"],
    legend: {
      X: { solid: true, color: "#2a1d17", lowerOf: ["ward"] },
      P: { solid: true, img: `${wall}_p`, crop: [0, 0], lowerOf: ["ward"] },
      p: { solid: true, img: `${wall}_p`, crop: [0, 32], lowerOf: ["ward"] },
      A: { solid: true, img: wall, crop: [0, 0], lowerOf: ["ward"] },
      a: { solid: true, img: wall, crop: [0, 32], lowerOf: ["ward"] },
      W: { solid: true, img: `${wall}_w`, crop: [0, 0], lowerOf: ["ward"] },
      w: { solid: true, img: `${wall}_w`, crop: [0, 32], lowerOf: ["ward"] },
      ".": wood ? { wang: "ward", lowerOf: ["ward"] } : { color: "#c2a86e" },
    },
    wang: { ward: { img: "wang_ward", size: 32, lookup: WANG16 } },
    drawGround(ctx, ox, oy, img) {
      if (!wood) tatami(ctx, T + ox, 2 * T + oy, 7, 4);
      const rug = western && typeof img === "function" && img("wx_rug");
      if (rug) ctx.drawImage(rug, 3 * T + ox, 3.1 * T + oy, 3 * T, 2 * T);
      ctx.fillStyle = "#6b4a33"; // 出口の敷居
      ctx.fillRect(4 * T + ox, 6 * T + oy, T, 4);
    },
    spawns: { door: { x: 4.5 * T, y: 5.4 * T, facing: "north" } },
    triggers: [{ id: "out", x: 4 * T, y: 6.4 * T, w: T, h: T, warp: { map: "ward", spawn: key } }],
    objects,
  };
}
// 病室: 壁ぎわのベッド、点滴スタンドの風鈴、酸素マスクの花瓶、×印の星図
// 病室(洋室): 一枚絵と同じく、ベッドは窓と平行に並ぶ。星図は窓のない壁に
const ROOM_SICK = room("sick", "wood", [
  hat("bed_h", 2.3 * T, 3.6 * T),
  // 床頭台の上のラジオ。金星の天気予報
  hat("cabinet_radio", 4.1 * T, 3.4 * T, {
    id: "radio",
    range: 34,
    interact(api) {
      api.bubble("radio", "……あすの金星は、晴れ……", 3600);
      if (!api.hasWord("金星の天気予報")) {
        api.learnWord("金星の天気予報");
        api.later(3700, () => api.toast("金星の天気予報")); // ラジオの吹き出しが消えてから(窓が重ならないように)
      }
    },
  }),
  dead("d_bedman_h", "bedman", 5.9 * T, 3.6 * T, "v_bed"),
  hat("starchart", 7.45 * T, 1.45 * T, { sortDy: -40 }),
], "PWWWPWWAP");
// 窓辺の部屋: 机の上のコックピットの写真(焦げたぼぎのマスコット)、ロッキングチェアのガイコツ、宇宙戦闘機の写真
const ROOM_WINDOW = room("window", "wood", [
  // 机の上の写真: コックピット(焦げたぼぎのマスコットが下がっている)
  hat("deskphoto", 1.5 * T, 3.2 * T, {
    id: "charm",
    range: 34,
    interact(api) {
      api.show("v_cockpit");
    },
  }),
  // ロッキングチェアで、ゆっくり揺れている
  hat("d_scope", 4.5 * T, 4.4 * T, {
    id: "scope",
    img: null,
    range: 40,
    draw(ctx, sx, sy, t, api) {
      const im = api.image("d_scope");
      if (!im) return;
      const s = HS.d_scope;
      const a = Math.sin(t * 1.4) * 0.07;
      ctx.save();
      ctx.translate(sx, sy + s.bottom - s.h / 2);
      ctx.rotate(a);
      ctx.drawImage(im, -s.w / 2, -s.bottom, s.w, s.h);
      ctx.restore();
    },
    interact(api) {
      api.bubble("scope", "ぎい……　ぎい……", 2600);
    },
  }),
  wallPhoto("photo_fighter", 4.5 * T, "v_photo_fighter"),
]);
// 義肢装具室: 木の義足が掛かったラック(叩くと木琴のように鳴る)、作りかけの機械の義手の作業台、義手のスタンド
const ROOM_WORKSHOP = room("workshop", "wood", [
  hat("prosthetic_rack", 2 * T, 3 * T, {
    id: "legshelf",
    range: 40,
    interact(api) {
      api.bubble("legshelf", "ぽろん　ぽろん", 2200);
    },
  }),
  hat("workbench", 5 * T, 3 * T),
  hat("arm_stand", 7.5 * T, 3 * T),
]);
// 家族の部屋: 卓袱台を囲む一家。箪笥、鏡台、三輪車
// 木彫りの人の部屋(和室): 障子の窓辺で正座して、おたかポッポを彫っていた
// 左は障子の窓、右は写真を掛けた壁(思い出の絵と同じ並び)
const ROOM_CARVER = room("carver", "tatami", [
  hat("portrait", 6.5 * T, 1.3 * T, { sortDy: -40 }), // 壁の写真(若い頃の軍服)
  hat("poppo_row", 2.7 * T, 4.2 * T),
  dead("d_carver", "carver", 4.4 * T, 4.1 * T, "v_carver"),
], "PWWWPAAAP");
const ROOM1 = room("room1", "tatami", [
  hat("tansu", 1.5 * T, 3 * T),
  hat("kyodai", 7.5 * T, 3 * T),
  dead("d_family", "family", 4.5 * T, 4 * T, "v_family"),
  hat("tricycle", 2.5 * T, 5 * T),
]);
// 和室を西洋人が改装して住んでいた部屋: 板の床に絨毯、壁紙とレースのカーテン、真鍮のベッド、蓄音機。壁に結婚写真(宇宙軍の礼装と花嫁)
const ROOM2 = room("room2", "western", [
  hat("wx_bed", 1.9 * T, 4 * T),
  hat("wx_lamp", 3.2 * T, 3 * T),
  hat("wx_teatable", 4.5 * T, 4.3 * T),
  hat("wx_chair", 5.4 * T, 4.3 * T), // テーブルのほうを向いた肘掛け椅子
  hat("wx_gramophone", 7.4 * T, 3.1 * T),
  wallPhoto("photo_wedding", 4.5 * T, "v_photo_wedding"),
]);

// ---- 屋上(物干し台。望遠鏡、洗濯物。手すりから高原を見わたす) ----
const ROOF_STAND = { x: 10.5 * T, y: 5.4 * T }; // 踏み台を置く所(望遠鏡の手前)
const ROOF = {
  tile: T,
  bg: "#1c1411",
  tintMul: "#f2b48a",
  tint: "rgba(255, 140, 60, 0.10)",
  map: [
    "SSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSS",
    "SSSSSSSSSSSSSS",
    "X............X",
    "X............X",
    "X............X",
    "X............X",
    "X............X",
    "XXXXXXXXXXXXXX",
  ],
  legend: {
    S: { solid: true, color: "#e7a27a", lowerOf: ["ward"] },
    X: { solid: true, color: "#2a1d17", lowerOf: ["ward"] },
    ".": { wang: "ward", lowerOf: ["ward"] },
  },
  wang: { ward: { img: "wang_ward", size: 32, lookup: WANG16 } },
  drawGround(ctx, ox, oy, img) {
    const W = 14 * T;
    // 夕日が山なみの向こうへ落ちていく(高原の夕焼け)
    const sun = typeof img === "function" && img("sunset");
    if (sun) {
      const x0 = ox + (W - sun.width) / 2;
      ctx.drawImage(sun, 0, 0, 1, sun.height, ox, oy, x0 - ox, 3 * T); // 左右は端の色をのばす
      ctx.drawImage(sun, sun.width - 1, 0, 1, sun.height, x0 + sun.width, oy, W - sun.width - (x0 - ox), 3 * T);
      ctx.drawImage(sun, x0, oy, sun.width, 3 * T);
    }
    // 手すり
    ctx.fillStyle = "#5a3b28";
    ctx.fillRect(T + ox, 3 * T - 4 + oy, 12 * T, 4);
    for (let x = T; x <= 13 * T; x += 16) ctx.fillRect(x + ox, 3 * T - 4 + oy, 3, 14);
    // 階段の口
    ctx.fillStyle = "#1a120d";
    ctx.fillRect(T + ox, 7 * T + oy, T, T);
    ctx.fillStyle = "#4a3222";
    for (let y = 0; y < T; y += 6) ctx.fillRect(T + 2 + ox, 7 * T + y + oy, T - 4, 2);
  },
  spawns: { up: { x: 1.5 * T, y: 6.4 * T, facing: "north" } },
  triggers: [{ id: "down", x: T, y: 7.55 * T, w: T, h: 0.6 * T, warp: { map: "ward", spawn: "stairs" } }],
  // おす(D201): 屋上でなら、覚える前でも押せる。踏み台を望遠鏡の下まで押していくと、覚える
  onEnter(api) {
    api.setFlag("osu");
    // 隅に押しこんで動かせなくなっても、屋上に入りなおせば元の所に戻っている
    const st = ROOF.objects.find((o) => o.id === "fumidai");
    if (!api.flag("stand")) Object.assign(st, { x: 7.6 * T, y: 6.6 * T });
  },
  objects: [
    // 踏み台: 望遠鏡は、きーには高すぎる。押して、望遠鏡の下まで運ぶ(作者「台を押して持っていく」)
    {
      id: "fumidai",
      x: 7.6 * T,
      y: 6.6 * T,
      w: 32,
      h: 32,
      sortDy: 0,
      headY: 20,
      solid: { w: 24, h: 10, dy: -5 },
      push: { area: [1.6 * T, 3.7 * T, 12.4 * T, 7.4 * T], enabled: (api) => !api.flag("stand") },
      update(dt, t, api) {
        if (api.flag("stand")) Object.assign(this, ROOF_STAND);
      },
      draw(ctx, sx, sy, t, api) {
        const im = api.image("fumidai");
        if (im) ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(sy - im.height + 2));
      },
      onPush(api) {
        if (Math.hypot(this.x - ROOF_STAND.x, this.y - ROOF_STAND.y) > 0.7 * T) return;
        Object.assign(this, ROOF_STAND);
        api.setFlag("stand");
        api.sfx("clang");
        kLearn(api, "osu", "おす");
      },
    },
    // 物干し竿と洗濯物(生活の場)
    {
      x: 4.5 * T,
      y: 4.6 * T,
      w: 4 * T,
      h: 2 * T,
      sortDy: 16,
      solid: { w: 4 * T, h: 8, dy: 16 },
      draw(ctx, sx, sy, t) {
        ctx.fillStyle = "#4a3222";
        ctx.fillRect(sx - 2 * T, sy - 36, 3, 52);
        ctx.fillRect(sx + 2 * T - 3, sy - 36, 3, 52);
        ctx.fillStyle = "#8a8070";
        ctx.fillRect(sx - 2 * T, sy - 34, 4 * T, 2);
        const cloth = ["#f1ece0", "#dfe6ee", "#f1ece0", "#e8d9c4", "#f1ece0"];
        cloth.forEach((c, i) => {
          const sw = Math.round(Math.sin(t * 2 + i) * 2);
          ctx.fillStyle = c;
          ctx.fillRect(sx - 2 * T + 8 + i * 24 + sw, sy - 32, 18, 22 + (i % 2) * 6);
        });
      },
    },
    // 望遠鏡のレンズが、月の光できらっと光って呼ぶ(見届けの前だけ)
    kLure({ id: "w_lens", x: 10.5 * T, y: 4.5 * T, ly: -1.1 * T, lure: "220, 236, 255", when: () => true }),
    // 望遠鏡: 覗くと、月のまわりに輪
    hat("telescope", 10.5 * T, 4.5 * T, {
      id: "telescope",
      range: 60,
      interact(api) {
        // 踏み台がないと、のぞき口に届かない(跳びついても届かない)
        if (!api.flag("stand")) {
          api.hop();
          return;
        }
        api.hop();
        api.later(420, () => api.show("v_moon", () => api.observe())); // 見届け: 欠けて輪をまとった月を見る(D189。最後の場面の月とつながる)
      },
    }),
    // 手すりから見わたす: いまの高原の景色 → 文化祭の日の屋上の記憶 → 懲罰空間へ
    {
      id: "railing",
      x: 7 * T,
      y: 3.3 * T,
      w: 2 * T,
      h: 8,
      range: 44,
      interact(api) {
        // 景品(次の世界へのカギ)を持っていれば、屋上から景色を見る(寄り道。断片は景品をもらった所で終わっている、D266)
        if (!api.hasItem("おたかぽっぽ") && !api.flag("prize")) { // 以前の版で景品をもらった人も通れるように
          api.show("v_view");
          return;
        }
        // いまの高原の景色だけ(文化祭の日の屋上からの絵は、廊下に掛けてある)
        api.show("v_view", () => {
          api.mutter("はい　へい　うぃん", 3000);
          api.clear();
        });
      },
    },
  ],
};

// ---- 音: 舞台の楽団の曲(作者がアップロード)。楽団の前で一番大きく、離れるほど小さい ----
// 入り口(中庭)から小さく聞こえ、大広場で舞台に近づくほど大きく、渡り廊下・病棟・部屋・屋上と離れるほど小さく
const H_BAND = { x: 8 * T, y: 4.6 * T }; // 舞台の楽団のまんなか
const hClamp = (v) => Math.max(0, Math.min(1, v));
YARD.bgmLevel = (p) => 0.32 - 0.2 * hClamp(Math.hypot(p.x - 9 * T, p.y - 4.6 * T) / (12 * T)); // 大広場の扉の前で 0.32
HALL.bgmLevel = (p) => 1 - 0.5 * hClamp((Math.hypot(p.x - H_BAND.x, p.y - H_BAND.y) - 1.5 * T) / (6 * T));
WATARI.bgmLevel = (p, m) => 0.35 - 0.19 * hClamp(p.x / m.w);
WARD.bgmLevel = (p, m) => 0.14 - 0.08 * hClamp(p.x / m.w);
[ROOM_SICK, ROOM_WINDOW, ROOM1, ROOM2, ROOM_WORKSHOP, ROOM_CARVER].forEach((r) => (r.bgmLevel = 0.05));
ROOF.bgmLevel = 0.04;
