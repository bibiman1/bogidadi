// 世界をまとめて window.BOGI_WORLDS に登録する。太宰の本、おもいでのアイコン。
// field/worlds/ のファイルは index.html の順に読む。上のファイルで決めた名前(T、kWatch など)をそのまま使う
"use strict";

window.BOGI_WORLDS = {
  // 懲罰空間(ハブ)。ここから断片の世界に入り、戻ってくる
  void: {
    id: "void",
    name: "懲罰空間",
    hub: true,
    fragments: ["lake", "haihei", "kasumi", "banana", "suzuki", "takarabune", "noroi", "padre", "kinsei", "bomber"],
    fragmentTexts: Object.fromEntries(VOID_FRAGMENTS.map((f) => [f.id, f.text])),
    // おもいで(todo 32 の A): 断片を終えると持ち帰る物。ステータスの「おもいで」に、見届けたしるしと並べて出す
    souvenirs: { lake: "氷のかけら", haihei: "おたかぽっぽ", kasumi: "蓮の花", banana: "マンゴー", suzuki: "納品書", takarabune: "白紙の海図", noroi: "クラブの札", padre: "水あめのわりばし", kinsei: "電池", bomber: "安全ピンのリボン" },
    souvenirIcons: { 氷のかけら: "ic_kori", おたかぽっぽ: "ic_poppo", 蓮の花: "ic_hasu", マンゴー: "ic_mango", 納品書: "ic_nouhin", 白紙の海図: "ic_kaizu", クラブの札: "ic_fuda", 水あめのわりばし: "ic_ame", 電池: "ic_denchi", 安全ピンのリボン: "ic_ribbon" },
    // 断片の中の謎解きに使う物。その断片にいる間だけ「どうぐ」に出る
    puzzleItems: { 伝票: "suzuki", 荷札: "suzuki", スタンプ台紙: "haihei", ペレット: "takarabune", コンロッド: "takarabune" },
    assetBase: "./assets/worlds/void/",
    images: {
      wang_void: "wang_void.png",
      pedestal: "pedestal.png",
      frag_lake: "frag_lake.png",
      frag_haihei: "frag_haihei.png",
      frag_kasumi: "frag_kasumi.png",
      frag_banana: "frag_banana.png",
      frag_suzuki: "frag_suzuki.png",
      frag_takarabune: "frag_takarabune.png",
      frag_noroi: "frag_noroi.png",
      frag_padre: "frag_padre.png",
      frag_kinsei: "frag_kinsei.png",
      frag_bomber: "frag_bomber.png",
      // 太宰治全集が 10 冊そろったとき、カメラが引いて月の裏側が見える(D215)
      v_pull1: "./assets/worlds/finale/v_pull1.png",
      v_pull1c: "./assets/worlds/finale/v_pull1c.png",
      v_pull2: "./assets/worlds/finale/v_pull2.png",
      v_pull3: "./assets/worlds/finale/v_pull3.png",
      door: "door.png",
      door_open: "door_open.png",
      tatami: "tatami.png",
      chabudai: "chabudai.png",
      ki: "./assets/worlds/lake/ki_walk.png",
    },
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "void",
    startSpawn: "start",
    maps: { void: VOID },
  },
  // 断片: 凍った湖と富士山(きーの記憶の世界)
  // 条件: ちゃんの車の窓をのぞく → ほうとう屋で、ちゃんの席を見る → 懲罰空間に帰る
  // 次の世界へのカギ: 道具「氷のかけら」、ことば「金星の天気予報」
  lake: {
    id: "lake",
    name: "凍った湖と富士山",
    assetBase: "./assets/worlds/lake/",
    onEnterWorld(api) {
      api.setFlag("homeward", false);
    },
    images: {
      wang_road: "wang_road.png",
      road_asphalt: "road_asphalt.png",
      wang_ice: "wang_ice.png",
      wang_floor: "wang_floor.png",
      fuji: "fuji.png",
      ki: "ki_walk.png",
      pi: "pi_walk.png",
      pi_tire: "pi_tire.png",
      s_pine: "s_pine.png",
      s_pine2: "s_pine2.png",
      s_car: "s_car.png",
      s_houtou: "s_houtou.png",
      s_tires: "s_tires.png",
      s_sign_r: "s_sign_r.png",
      s_closed: "s_closed.png",
      s_sign_l: "s_sign_l.png",
      s_shard: "s_shard.png",
      k_wall: "k_wall.png",
      k_stove: "k_stove.png",
      k_table: "k_table.png",
      k_zabuton: "k_zabuton.png",
      k_zabuton_s: "k_zabuton_s.png",
      k_tansu: "k_tansu.png",
      k_post: "k_post.png",
      k_irori: "k_irori.png",
      i_radio: "i_radio.png",
      v_window: "v_window.png",
      v_table: "v_table.png",
      v_road: "v_road.png",
      v_pot: "v_pot.png",
      k_poster: "k_poster.png",
      v_poster: "v_poster.png",
    },
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "road",
    startSpawn: "start",
    maps: { road: ROAD, lake: LAKE, shop: SHOP },
  },
  // 断片: 廃兵院(Hi Hey Win！)。きーの記憶の世界。凍った湖と富士山を終えると、懲罰空間に現れる
  // 条件: スタンプを3つ集めて景品をもらう → 懲罰空間に帰る(屋上から景色を見るのは寄り道、D266)
  // 次の世界へのカギ: 道具「おたかぽっぽ」(スタンプの特典)
  haihei: {
    id: "haihei",
    name: "アンバリッド・ホテル", // ゲームの中では「廃兵院」と書かない(Hi Hey Win とアンバリッドのことば遊びで気づかせる)
    assetBase: "./assets/worlds/haihei/",
    images: Object.fromEntries(
      ["facade", "arch", "yakisoba", "wataame", "shateki", "uketsuke", "wheelchair", "crutch", "ginkgo", "ginkgo_big", "stage", "exhibit1", "exhibit2", "telescope", "tv_on", "tv_off", "iv", "legshelf", "oxyvase", "starchart", "photo_wedding", "photo_fighter", "d_family", "d_visitors", "poppo_row", "portrait", "bench", "clock", "firebucket", "plant", "rail", "tansu", "futon", "hibachi", "tricycle", "kyodai", "stairs", "door", "bed_f", "bonsai_table1", "bonsai_table2", "bed_h", "d_bedman_h", "cabinet_radio", "rwall", "rwall_p", "rwall_w", "aw", "aw_g", "aw_p", "aw_pg", "aw_w", "aw_wg", "aw_pw", "wheelchair_back", "prosthetic_rack", "workbench", "arm_stand", "deskphoto", "sunset", "noticeboard", "v_board", "guestbook", "v_guestbook", "wx_bed", "wx_chair", "wx_gramophone", "wx_lamp", "wx_teatable", "wx_rug", "rwallx", "rwallx_p", "rwallx_w", "art_fuji", "art_moon", "art_ginkgo", "art_blob", "art_self", "art_group", "art_banana", "art_squad", "art_roof", "cot", "radio", "wang_yard", "wang_ward",
        "d_uketsuke", "d_shateki", "d_yakisoba", "d_carver", "d_band1", "d_band2", "d_band3", "d_band4", "d_band5", "d_wheel", "d_bedman", "d_scope",
        "v_uketsuke", "v_yakisoba", "v_stall", "v_carver", "v_stage", "v_wheel", "v_bed", "v_cockpit", "v_photo_wedding", "v_photo_fighter", "v_view", "v_moon", "v_family", "v_wataame", "v_art_fuji", "v_art_moon", "v_art_ginkgo", "v_art_blob", "v_art_self", "v_art_group", "v_art_banana", "v_art_squad", "v_art_roof", "v_tv", "v_card_0", "v_card_1", "v_card_2", "v_card_3", "v_card_4", "v_card_5", "v_card_6", "v_card_7"]
        .map((k) => [k, `${k}.png`])
        .concat([["ki", "./assets/worlds/lake/ki_walk.png"]])
    ),
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "yard",
    startSpawn: "gate",
    maps: { yard: YARD, hall: HALL, watari: WATARI, ward: WARD, sick: ROOM_SICK, window: ROOM_WINDOW, room1: ROOM1, room2: ROOM2, workshop: ROOM_WORKSHOP, carver: ROOM_CARVER, roof: ROOF },
  },
  // 断片: 霞ヶ浦のエクラノプラン。廃兵院を終えると懲罰空間に現れる
  kasumi: {
    id: "kasumi",
    name: "霞ヶ浦のエクラノプラン",
    assetBase: "./assets/worlds/kasumi/",
    images: Object.fromEntries(
      ["bg_lotus", "bg_hangar", "bg_wing", "bg_cabin", "bg_cockpit", "fg_shore", "fg_hangar", "fg_cabin", "fg_cockpit", "crew_hawk", "crew_wagtail", "crew_rooster", "fl_sky", "fl_hills", "fl_wbase", "fl_ripple", "fl_mist", "fl_ekrano", "fl_ekrano8", "fl_ekrano_top", "fl_ekrano_shadow", "fl_lake", "v_flight", "v_summer", "photo_summer", "face_mummy", "i_hasu"]
        .map((k) => [k, `${k}.png`])
        .concat([["bg_shore", "bg_shore.png"], ["ki", "./assets/worlds/lake/ki_walk.png"]])
    ),
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "lotus",
    startSpawn: "start",
    maps: { lotus: K_LOTUS, shore: K_SHORE, hangar: K_HANGAR, wing: K_WING, cabin: K_CABIN, cockpit: K_COCKPIT, flight: K_FLIGHT, tour: K_TOUR },
  },
  // 断片: 南極のバナナ農園。霞ヶ浦を終えると懲罰空間に現れる
  banana: {
    id: "banana",
    name: "南極のバナナ農園",
    assetBase: "./assets/worlds/banana/",
    onEnterWorld(api) {
      // 追いかけっこは入るたびに最初から(マンゴーを手に入れたあとは、そのまま)
      if (!api.flag("gotMango")) ["fledFarm", "fledCanal", "chirinJoined"].forEach((f) => api.setFlag(f, false));
    },
    images: Object.fromEntries(
      ["bg_shore", "bg_farm", "bg_canal", "bg_steps", "fg_shore", "fg_shore2", "fg_farm", "fg_canal", "fg_steps", "kikori", "chirin", "kikikori", "goron", "v_final"]
        .map((k) => [k, `${k}.png`])
        .concat([["ki", "./assets/worlds/lake/ki_walk.png"]])
    ),
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "shore",
    startSpawn: "start",
    maps: { shore: B_SHORE, farm: B_FARM, canal: B_CANAL, steps: B_STEPS },
  },
  // 断片: 荒川の鈴木商店。南極のバナナ農園を終えると懲罰空間に現れる
  suzuki: {
    id: "suzuki",
    name: "荒川の鈴木商店",
    assetBase: "./assets/worlds/suzuki/",
    images: Object.fromEntries(
      ["bg_stop", "bg_alley", "bg_shop", "bg_river", "bg_crater", "fg_river", "fg_crater", "fg_alley", "bg_orbit", "tetsubin", "v_inside", "v_rise3", "v_fall", "rise_sky", "rise_tube", "rise_earth", "rise_cloud", "v_denpyo", "v_nifuda", "v_nouhin"]
        .map((k) => [k, `${k}.png`])
        .concat([["ki", "./assets/worlds/lake/ki_walk.png"]])
    ),
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "stop",
    startSpawn: "start",
    maps: { stop: S_STOP, alley: S_ALLEY, shop: S_SHOP, river: S_RIVER, rise: S_RISE, orbit: S_ORBIT, space: S_SPACE, crater: S_CRATER },
    // 着地のあと、鉄瓶にお湯を注いでもらうまで、きーは真っ黒
    playerTint: (api) => (api.flag("charred") ? "rgba(22, 18, 18, 0.97)" : null),
    // 単結晶に入ってから流れ星になるまでの途中でやめていたら、入るところからやり直せるようにする
    onEnterWorld(api) {
      if (api.flag("launched") && !api.flag("fallen")) api.setFlag("launched", false);
    },
  },
  // 断片: 宝舟と首振りエンジン。荒川の鈴木商店を終えると懲罰空間に現れる
  takarabune: {
    id: "takarabune",
    name: "宝舟と首振りエンジン",
    assetBase: "./assets/worlds/takarabune/",
    images: Object.fromEntries(
      ["bg_port", "fg_port", "bg_workshop", "bg_gate", "fg_gate", "bg_admin", "bg_turbine", "fg_turbine", "bg_reactor", "fg_reactor", "bg_core", "bg_engineroom", "bg_deck", "fg_deck", "sea", "cyl", "fly", "bogi", "pellet", "conrod", "v_cast", "v_glow", "v_kaizu"]
        .map((k) => [k, `${k}.png`])
        .concat([["ki", "./assets/worlds/lake/ki_walk.png"]])
    ),
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "port",
    startSpawn: "start",
    maps: { port: TK_PORT, workshop: TK_WORKSHOP, gate: TK_GATE, admin: TK_ADMIN, turbine: TK_TURBINE, reactor: TK_REACTOR, core: TK_CORE, engineroom: TK_ENGINE, deck: TK_DECK },
    onEnterWorld(api) {
      // 作り直し(D88)の前に遊んだ記録は、最初から遊び直せるように消す(古い道具「燃料」と、その流れのフラグ)
      if (!api.flag("v2")) {
        ["cast", "fueled", "glowed", "sowing", "running", "installed"].forEach((f) => api.setFlag(f, false));
        ["燃料", "白紙の海図", "ペレット", "首振りエンジンの部品"].forEach((n) => api.takeItem(n));
        api.setFlag("v2");
      }
      // 道具の名前を「コンロッド」にした(D92 → D95)
      for (const old of ["首振りエンジンの部品", "ピストン"]) {
        if (api.hasItem(old)) {
          api.takeItem(old);
          api.giveItem("コンロッド");
        }
      }
      // 沖でペレットを投げている途中でやめていたら、投げるところからやり直せるようにする
      if (api.flag("sowing")) {
        api.setFlag("sowing", false);
        if (!api.flag("glowed")) api.giveItem("ペレット");
      }
    },
  },
  // 断片: 呪いの野犬。宝舟と首振りエンジンを終えると懲罰空間に現れる
  finale: {
    id: "finale",
    name: "懲罰空間",
    assetBase: "./assets/worlds/finale/",
    // B の最後の旗(D273): 誰もいないゴールで、旗だけが揺れる
    anims: { v_b_flag: { frames: ["v_b_flag1", "v_b_flag2", "v_b_flag3", "v_b_flag2"], fps: 5 } },
    images: Object.assign(
      Object.fromEntries(
        ["v_pull1", "v_pull1c", "v_pull2", "v_pull3", "v_b_heal", "v_b_town", "v_b_shelf", "v_b_flag", "v_b_flag1", "v_b_flag2", "v_b_flag3", "v_c_one", "v_off", "v_s1", "v_s2", "v_s3", "v_s4", "v_s5", "v_s6", "v_s7", "v_s8", "v_q1", "v_q2", "v_q3", "v_q4", "v_q5", "v_cluster", "v_cl1", "v_cl2", "v_cl3", ...Array.from({ length: 10 }, (_, i) => `roll_${String(i).padStart(2, "0")}`)].map((k) => [k, `${k}.png`])
      ),
      Object.fromEntries(VOID_FRAGMENTS.map((f) => [`frag_${f.id}`, `./assets/worlds/void/frag_${f.id}.png`])),
      {
        wang_void: "./assets/worlds/void/wang_void.png",
        pedestal: "./assets/worlds/void/pedestal.png",
        simulator: "./assets/worlds/void/simulator.png",
        sim_gray: "./assets/worlds/void/sim_gray.png",
        door_open: "./assets/worlds/void/door_open.png",
        ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((i) => [`picto${i}`, `./assets/worlds/void/picto${i}.png`])),
        ki: "./assets/worlds/lake/ki_walk.png",
        kikori: "./assets/worlds/kinsei/kikori.png",
      }
    ),
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "white",
    startSpawn: "start",
    maps: { white: F_WHITE, hub: F_HUB, roll: F_ROLL },
    onEnterWorld() {
      Object.assign(fS, { phase: "room", t0: 0, shown: false, peek: 0, litT0: 0, offT: 0, pokeT: 0, t1: 0, ending: "b", touchAt: -9, down: false, by: null, pressT: 0, rollDone: false, exiting: false });
    },
  },
  bomber: {
    id: "bomber",
    name: "ぼぎボマーと地上ぼぎクルー",
    assetBase: "./assets/worlds/bomber/",
    images: Object.fromEntries(
      ["bg_kichi", "bomber", "bomber_shadow", "i_ribbon", "cap", "chock", "flag", "bomb_s", "bomb_m", "bomb_w", "bomb_l", "missile", "t_plane", "bomber_dmg", "bomber_spin", "bomber_dmg_spin", "v_fly1", "v_fly2", "v_fly3", "v_fly4", "v_fly5", "v_boom1", "v_rain01", "v_rain02", "v_rain03", "v_rain04", "v_rain05", "v_rain06", "v_rain07", "v_rain08", "v_rain09", "v_rain10", "v_rain11", "v_rain12", "v_rain13", "v_rain14", "v_rain15", "v_rain16", "v_laser1", "v_laser2", "v_laser3", "salute_hawk", "salute_wagtail", "salute_rooster", "daikon", "kabocha"]
        .map((k) => [k, `${k}.png`])
        .concat([["ki", "./assets/worlds/lake/ki_walk.png"]])
        .concat(["crew_hawk", "crew_wagtail", "crew_rooster"].map((k) => [k, `./assets/worlds/kasumi/${k}.png`]))
    ),
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "kichi",
    startSpawn: "start",
    maps: { kichi: B_KICHI },
    onEnterWorld() {
      bMorning(); // 入るたびに、朝の手順から
    },
  },
  kinsei: {
    id: "kinsei",
    name: "きこりと金星",
    assetBase: "./assets/worlds/kinsei/",
    images: Object.fromEntries(
      ["bg_sando", "bg_sancho", "fg_sando", "fg_sancho", "kikori", "chirin", "i_denchi", "t_sticker"].map((k) => [k, `${k}.png`]).concat([["ki", "./assets/worlds/lake/ki_walk.png"]])
    ),
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "sando",
    startSpawn: "start",
    maps: { sando: KN_SANDO, sancho: KN_SANCHO },
    onEnterWorld(api) {
      // 途中で出ていたら、そのあいだに、きこりは金星の向こうへ消えている
      if (["run", "edge", "melt"].includes(knS.phase)) api.setFlag("gone");
      knS.phase = api.flag("gone") ? "gone" : api.flag("dashed") ? "dashed" : "idle";
    },
  },
  padre: {
    id: "padre",
    name: "ぱーでれとだいにち",
    assetBase: "./assets/worlds/padre/",
    images: Object.fromEntries(
      ["bg_michi", "bg_akichi", "padre", "padre_open", "b_kobosi", "b_denden", "b_hato", "i_ame", "kami1", "kami2", "kami3", "kami4", "v_oneness", "t_zori", "fg_akichi_pole", "fg_akichi_pipes", "fg_michi_pole1", "fg_michi_pole2"]
        .map((k) => [k, `${k}.png`])
        .concat([
          ["ki", "./assets/worlds/lake/ki_walk.png"],
          // ワンネスの結末で光にとける、きーの思い出(終えた断片の一枚絵)
          ["m_lake", "./assets/worlds/lake/v_window.png"],
          ["m_haihei", "./assets/worlds/haihei/v_family.png"],
          ["m_kasumi", "./assets/worlds/kasumi/v_flight.png"],
          ["m_banana", "./assets/worlds/banana/v_final.png"],
          ["m_suzuki", "./assets/worlds/suzuki/v_fall.png"],
          ["m_takarabune", "./assets/worlds/takarabune/v_glow.png"],
          ["m_noroi", "./assets/worlds/noroi/v_finish.png"],
        ])
    ),
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "michi",
    startSpawn: "start",
    maps: { michi: P_MICHI, akichi: P_AKICHI },
    onEnterWorld(api) {
      // 紙芝居のあとで出ていたら、そのあいだに、ぱーでれは霧の東へ去っている
      if (["capture", "pull", "leave", "oneness"].includes(pS.phase)) {
        api.setFlag("taken");
        api.setFlag("gone");
      }
      pS.phase = api.flag("gone") ? "done" : "wait";
    },
  },
  noroi: {
    id: "noroi",
    name: "呪いの野犬",
    assetBase: "./assets/worlds/noroi/",
    images: Object.fromEntries(
      ["bg_pass", "bg_drivein", "bg_strip", "bg_diner", "drum", "fueler", "tree", "plaque", "v_custom", "v_finish", "v_photo",
        "rc_plate", "rc_lamps", "v_plaque", "rc_ki_back", "rc_ki_stick", "rc_bogi_back", "rc_pon_back", "rc_tori_back", "rc_aka_back", "pylon", "rc_tansu_back", "rc_kokeshi_back",
        "rcs_sky", "rcs_stands", "rcs_road", "rcs_crowd", "rcs_tree", "rcs_ki", "rcs_ki_stick", "rcs_bogi", "rcs_pon", "rcs_tori", "rcs_aka", "rcs_tansu", "rcs_kokeshi", "rcs_tori_tub", "rc_tori_tub", "kogamo",
        "ponpon_e", "ponpon_s", "akabeko_e", "akabeko_s", "tori_e", "tori_s", "kokeshi_e", "kokeshi_s", "tansu_e", "tansu_w", "miton_s",
        "bogicar_e_ki", "bogicar_e_stick", "bogicar_e_flame", "v_mag_0", "v_mag_1", "v_mag_2", "v_mag_3", "v_mag_4", "v_mag_5", "v_mag_6", "pb_backglass", "pb_field", "pb_bump_beko", "pb_bump_drum", "pb_bump_duck", "pb_flipper"]
        .map((k) => [k, `${k}.png`])
        .concat([["ki", "./assets/worlds/lake/ki_walk.png"]])
    ),
    playerSprite: { img: "ki", cell: 64, frames: 7, footY: 17 },
    start: "pass",
    startSpawn: "start",
    maps: { pass: N_PASS, drivein: N_DRIVEIN, diner: N_DINER, strip: N_STRIP, race: N_RACE, pinball: N_PIN },
    onEnterWorld(api) {
      if (!api.flag("ponponGone") && nFuelT0 >= 0) api.setFlag("ponponGone");
      nFuelT0 = -1;
    },
  },
};

// 太宰治全集(D214): 小さなメダルのように、断片に 1 冊ずつ隠れている文庫本。近くに寄ると、かすかに光る。
// 拾うと掲げて、作品名を出す。ホテルの 1 冊でだけ、きーが「ださいおさむん」とつぶやく(ミスリード)。そろっても何も起きない
// いくつかは能力で開く所の中(ぱーでれの霧の奥、金星の熱い風)
const DAZAI_BOOKS = [
  { w: "lake", map: "shop", x: 1.8 * T, y: 6.2 * T, title: "富嶽百景" }, // ほうとう屋の土間(作者「富嶽百景は室内で取れるようにして」)
  { w: "haihei", map: "sick", x: 2.6 * T, y: 4.3 * T, dy: -18, title: "人間失格", mutter: true },
  { w: "kasumi", map: "shore", x: 22.5 * T, y: 15.4 * T, title: "津軽" },
  { w: "banana", map: "steps", x: 3.5 * T, y: 18.4 * T, title: "雪の夜の話" },
  { w: "suzuki", map: "shop", x: 2.5 * T, y: 7.4 * T, title: "貨幣" },
  { w: "takarabune", map: "engineroom", x: 13.5 * T, y: 4.5 * T, title: "魚服記" },
  { w: "noroi", map: "diner", x: 3 * T, y: 5.5 * T, title: "走れメロス" },
  { w: "padre", map: "akichi", x: 18.6 * T, y: 5.3 * T, title: "お伽草紙" },
  { w: "kinsei", map: "sancho", x: 14.2 * T, y: 6.2 * T, title: "斜陽" },
  { w: "bomber", map: "kichi", x: 3.6 * T, y: 6.5 * T, title: "トカトントン" },
];
const kBook = (b) => ({
  id: "dazai",
  x: b.x,
  y: b.y,
  w: 1,
  h: 1,
  headY: 20,
  range: 30,
  hidden: (api) => api.flag("dazai"),
  draw(ctx, sx, sy, t, api) {
    const im = api.image("bunko");
    if (!im) return;
    const y = sy + (b.dy || 0);
    ctx.drawImage(im, Math.round(sx - im.width / 2), Math.round(y - im.height + 2));
    // 近くに寄ると、かすかに光る(遠くからは見つけにくい)
    const p = api.player();
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    if (d < 3 * T) {
      const k = (1 - d / (3 * T)) * (0.5 + 0.5 * Math.sin(t * 4));
      kSparkle(ctx, sx + 5, y - im.height, 2 + 2 * k, k, "255, 245, 210");
    }
  },
  interact(api) {
    api.setFlag("dazai");
    api.hold("ic_bunko", 1.8, () => {
      api.sfx("item");
      api.toast(`『${b.title}』`, 2.6);
      if (b.mutter) api.later(1400, () => api.mutter("ださいおさむん", 2600));
    });
  },
});
for (const b of DAZAI_BOOKS) window.BOGI_WORLDS[b.w].maps[b.map].objects.push(kBook(b));
window.BOGI_DAZAI = DAZAI_BOOKS;

// おもいでのアイコン(D200): どの世界でも、手に入れたときに掲げて見せられるように、全部の世界に読みこむ
// 能力で開く所の小物(D201〜D203): 踏み台(ホテル)、倒れた荷車(鈴木商店)、砂の吹きだまり(呪いの野犬)、草むら(ぼぎボマー)
const ABILITY_PROPS = ["fumidai", "niguruma", "kusa", "bunko", "shelf"];
const OMOIDE_ICONS = ["ic_bunko", "ic_kori", "ic_poppo", "ic_hasu", "ic_mango", "ic_nouhin", "ic_kaizu", "ic_fuda", "ic_ame", "ic_denchi", "ic_ribbon"];
for (const w of Object.values(window.BOGI_WORLDS)) {
  w.images = w.images || {};
  for (const k of OMOIDE_ICONS) w.images[k] = `./assets/icons/${k}.png`;
  for (const k of ABILITY_PROPS) w.images[k] = `./assets/props/${k}.png`;
}
