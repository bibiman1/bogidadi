// ことばの切りかえ(日本語 / English。D487、todo 170)
// ゲームの中の文字は、すべて window.bogiPix(rpg.js)の text / width / wrap を通る。そこで window.bogiLang.tr() を当てる。
// 絵の中の文字(看板、雑誌、紙芝居)は変えない。ミイラさまの台詞はロシア語のまま(英語にしない。D488)。新しい文字をゲームに足したら、下の EN にも 1 行足す(足さなければ日本語のまま出る)
// 言葉の選び方: 前に選んだもの(localStorage)> URL の ?lang=en / ?lang=ja > 端末の言葉が日本語なら日本語、ほかは英語
(function () {
  var KEY = "bogidachi.lang";
  var lang = null;
  try {
    lang = localStorage.getItem(KEY);
  } catch (e) {}
  var q = (location.search.match(/[?&]lang=(ja|en)\b/) || [])[1];
  if (q) lang = q;
  if (lang !== "ja" && lang !== "en") {
    var nav = String((navigator.languages && navigator.languages[0]) || navigator.language || "ja").toLowerCase();
    lang = nav.indexOf("ja") === 0 ? "ja" : "en";
  }

  // 固有名はローマ字(D487。作者が見て直す): きー Ki、ぴー Pi、ちゃん Chan、きこり Kikori、ちりん Chirin、ぱーでれ Paadere、だいにち Dainichi、
  // ださいおさむん Dasai Osamun、ほうとう houtou、懲罰空間 Punishment Space。題の「ぼぎだぢ」は絵と同じく日本語のまま
  var EN = {
    // どうぐ・ことば・おもいで
    "おたかぽっぽ": "Otaka Poppo",
    "電池": "Battery",
    "焼けたピザ": "Baked pizza",
    "焼けたピザのひと切れ": "A slice of baked pizza",
    "マンゴー": "Mango",
    "安全ピンのリボン": "Safety-pin ribbon",
    "ピザ": "Pizza",
    "スタンプ台紙": "Stamp card",
    "金星の天気予報": "Venus weather forecast",
    "氷のかけら": "Shard of ice",
    "蓮の花": "Lotus flower",
    "納品書": "Delivery slip",
    "白紙の海図": "Blank sea chart",
    "クラブの札": "Club tag",
    "水あめのわりばし": "Starch-syrup sticks",
    "燃料": "Fuel",
    "ペレット": "Pellet",
    "首振りエンジンの部品": "Oscillating engine part",
    "ピストン": "Piston",
    "コンロッド": "Connecting rod",
    "リプレイ券": "Replay ticket",
    "荷札": "Shipping tag",
    "伝票": "Invoice",
    "ださいおさむん": "Dasai Osamun",
    "ほうとう": "houtou",
    "ちゃん": "Chan",
    "きー": "Ki",
    "ちりん": "Chirin",
    // 太宰治全集(本)
    "富嶽百景": "One Hundred Views of Mt. Fuji",
    "人間失格": "No Longer Human",
    "津軽": "Tsugaru",
    "雪の夜の話": "A Snowy Night's Tale",
    "貨幣": "Currency",
    "魚服記": "Gyofukuki",
    "走れメロス": "Run, Melos!",
    "お伽草紙": "Otogizoshi",
    "斜陽": "The Setting Sun",
    "トカトントン": "Tokatonton",
    "太宰治": "Osamu Dazai",
    // 断片の名前と、おもいでの説明
    "懲罰空間": "Punishment Space",
    "凍った湖と富士山": "Frozen Lake and Mt. Fuji",
    "アンバリッド・ホテル": "Invalides Hotel",
    "霞ヶ浦のエクラノプラン": "Ekranoplan of Kasumigaura",
    "南極のバナナ農園": "Antarctic Banana Farm",
    "荒川の鈴木商店": "Suzuki Shoten of Arakawa",
    "宝舟と首振りエンジン": "Treasure Ship and Oscillating Engine",
    "呪いの野犬": "Cursed Wild Dogs",
    "ぱーでれとだいにち": "Paadere and Dainichi",
    "きこりと金星": "Kikori and Venus",
    "ぼぎボマーと地上ぼぎクルー": "Bogi Bomber and Ground Bogi Crew",
    "きーが見た風景。": "A view Ki once saw.",
    "ミイラさまの遊覧飛行。": "A sightseeing flight with Mummy-sama.",
    "宛先がにじんで読めない。": "The address is smudged. You can't read it.",
    "けさの気温 28℃。": "This morning: 28°C.",
    "何も描かれていない。": "Nothing is drawn on it.",
    "ポン　ポン　ポン。": "pon  pon  pon.",
    "カチ　カチ。": "clack  clack.",
    "無風、92気圧、456℃、雲。": "No wind. 92 atm. 456°C. Cloudy.",
    "見届けた": "Seen through",
    // ステータス
    "どうぐ": "Items",
    "おもいで": "Memories",
    "とくぎ": "Skills",
    "おと": "Sound",
    "セーブ": "Save",
    "テスト": "Test",
    "フラグ": "Flags",
    "おす": "Push",
    "押せる物に　むかって　あるく。": "Walk into something you can push.",
    "ジャンプ": "Jump",
    "Bボタン / Xキーで　とぶ。": "Jump with B / X.",
    "てらす": "Glow",
    "くらい所で　あおく　ひかる。": "Glow blue in dark places.",
    "はしる": "Dash",
    "おなじ　むきに　あるきつづける。": "Keep walking the same way.",
    "ふんばる": "Brace",
    "風の中で　つぶれて　はりつく。": "Flatten and cling in the wind.",
    "木箱をもった": "Holding the crate",
    "台に置いた(ロケ)": "Put it on the table (shoot)",
    "きこりが飛び出した": "Kikori ran out",
    "ピールをもった": "Holding the peel",
    "きこりが消えた": "Kikori vanished",
    "焼けたピザを取り出した": "Took out the baked pizza",
    "ピザを切り分けた": "Cut the pizza",
    "この断片をはじめから": "Restart this fragment",
    "旗、終えたこと、持ち帰った物を消す": "Clears flags, progress and things you brought back",
    "きろくしました。": "Saved.",
    "つづきは　ここから。": "You will continue from here.",
    "つづきは　この断片の　はじめから。": "You will continue from the start of this fragment.",
    "こうかおん": "Effects",
    "左右で　かえる": "Left / Right to change",
    "テスト　(テストプレイ用)": "Test (for playtesting)",
    "そろえました。": "Everything is unlocked.",
    "懲罰空間に　入りなおすと　扉が開きます。": "Re-enter the Punishment Space and the door will open.",
    "懲罰空間に　もどると　扉が開きます。": "Go back to the Punishment Space and the door will open.",
    "断片、おもいで、本、とくぎを　ぜんぶ": "Fragments, memories, books and skills:",
    "そろえますか？": "unlock them all?",
    "いいえ": "No",
    "はい": "Yes",
    "はじめから　(デバッグ用)": "Start over (debug)",
    "どうぐ、ことば、断片、とくぎを　ぜんぶ消して": "Erase all items, words, fragments and skills",
    "最初の状態にもどしますか？": "and go back to the start?",
    "なし": "None",
    "A でひらく　C でとじる": "A: open   C: close",
    "Enter でひらく　C でとじる": "Enter: open   C: close",
    // タイトル
    "つづきから": "Continue",
    "さいしょから": "New game",
    "さいしょから　あそびなおしますか？": "Start a new game from the beginning?",
    // 断片の中の言葉
    "もぐ　もぐ": "munch  munch",
    "もぐもぐ": "munch munch",
    "カン": "clang",
    "カン　カン": "clang  clang",
    "つぎの朝": "The next morning",
    "ドォン　ドォン　ドォン……": "BOOM  BOOM  BOOM……",
    "ブン……": "vrrm……",
    "ゲームオーバー": "GAME OVER",
    "はい　へい　うぃん": "hi  hey  win",
    "……あすの金星は、晴れ……": "……Tomorrow on Venus: clear……",
    "……きょうの金星は、無風、92気圧、456℃、雲……": "……Venus today: no wind, 92 atm, 456°C, cloudy……",
    "ぎい……　ぎい……": "creak……  creak……",
    "ぽろん　ぽろん": "plink  plink",
    "とどかない": "Can't reach.",
    "Bボタン": "B",
    "Xキー": "X",
    "チリーン": "ting-a-ling",
    "チリ　リ……": "tin  ling……",
    "どけ": "Outta my way.",
    "ポン　ポン　ポン": "pon  pon  pon",
    "シュッ　シュッ": "shff  shff",
    "ドルルン": "vroom",
    "パラララ　キュッ": "brrrap  skrt",
    "ドッドッドッ": "dug-dug-dug",
    "もってきた　ぽんぽんカー　もってきた": "brought it  pon-pon car  brought it",
    "１かいせん": "Round 1",
    "２かいせん": "Round 2",
    "３かいせん": "Round 3",
    "じゅんけっしょう": "Semifinal",
    "けっしょう": "Final",
    "さいこうそく　----": "Top speed  ----",
    "あいて　ゴールせず": "Rival  did not finish",
    "タイム　スリップ": "Time slip",
    "かちぬきせん": "Knockout",
    "かち": "Win",
    "カチ　カチ": "clack  clack",
    "コロン": "clonk",
    "デン　デン": "dun  dun",
    "ポー": "pooo",
    "まだ帰れない。": "Can't go back yet.",
    "ガシャン ガシャン": "clank clank",
    "シューッ！": "hissss!",
    "シューッ": "hissss",
    "ずず……": "slurp……",
    "ウーー　ウーー": "wooo  wooo",
    "ゴゴゴ……": "rumble……",
    "ガチャン": "clunk",
    // スタッフロール
    "原作・絵": "Story & art",
    "世界とことば": "World & words",
    "ゲームデザイン": "Game design",
    "プログラム": "Program",
    "ドット絵": "Pixel art",
    "下絵 Claude": "Sketches: Claude",
    "音と制作日記": "Sound & dev diary",
    "文字": "Font",
    "道具": "Tools",
    "音楽": "Music",
    "スペシャルサンクス": "Special thanks",
    "ジュークボックス": "Jukebox",
    "音": "Sounds",
    "赤ちゃんの笑い声": "Baby laughing",
    "公園の遊び場": "Park playground",
    "あそんでくれた": "You,",
    "あなた": "for playing.",
    "おわり": "The End",
  };

  // 式の入った文(数や名前が入る)。$1 などには、中身も訳して入れる
  var PAT = [
    [/^見つけた断片: (.+?) \/ (.+)$/, "Fragments found: $1 / $2"],
    [/^断片のなか: (.+)$/, "In a fragment: $1"],
    [/^もちもの: (.+)$/, "Items: $1"],
    [/^ことば: (.+)$/, "Words: $1"],
    [/^エラー: (.+)$/, "Error: $1"],
    [/^ばしょ：(.+)$/, "Place: $1"],
    [/^断片　(.+)$/, "Fragments  $1"],
    [/^おもいで　(.+)$/, "Memories  $1"],
    [/^ほん　(.+)$/, "Books  $1"],
    [/^フラグ　(.+)$/, "Flags  $1"],
    [/^(.+?)　を　おぼえた$/, "Learned: $1"],
    [/^(.+?)で　とんでみよう$/, "Try jumping with $1"],
    [/^ジャンプ　を　おぼえた（(.+)）$/, "Learned: Jump ($1)"],
    [/^リアクション　(.+)$/, "Reaction  $1"],
    [/^イーティー　(.+)$/, "E.T.  $1"],
    [/^あいて　(.+)$/, "Rival  $1"],
    [/^つぎは　(.+)$/, "Next: $1"],
    [/^(\d+)さつ$/, "$1 books"],
    [/^「(.+)」$/, "“$1”"],
    [/^『(.+)』$/, "“$1”"],
  ];

  function part(x) {
    if (x.indexOf("、") >= 0) return x.split("、").map(tr).join(", ");
    return tr(x);
  }
  function tr(s) {
    if (lang !== "en" || typeof s !== "string" || !s) return s;
    if (Object.prototype.hasOwnProperty.call(EN, s)) return EN[s];
    for (var i = 0; i < PAT.length; i++) {
      var m = s.match(PAT[i][0]);
      if (m) return PAT[i][1].replace(/\$(\d)/g, function (_, n) { return part(m[+n] || ""); });
    }
    return s;
  }
  window.bogiLang = {
    get: function () { return lang; },
    set: function (l) {
      lang = l === "en" ? "en" : "ja";
      try {
        localStorage.setItem(KEY, lang);
      } catch (e) {}
    },
    tr: tr,
    _EN: EN,
  };
})();
