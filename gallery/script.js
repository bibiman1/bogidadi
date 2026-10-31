(function () {
  "use strict";

  const IMAGES = [
    "218717_1007375036_214large.jpg",
    "218717_1007375048_31large.jpg",
    "218717_1008773116_59large.jpg",
    "218717_1010141439_134large.jpg",
    "218717_979909950_191large.jpg",
    "218717_979909956_119large.jpg",
    "218717_979909959_128large.jpg",
    "218717_979958428_160large.jpg",
    "218717_981153661_213large.jpg",
    "218717_981153663_181large.jpg",
    "218717_988483621_29large.jpg",
    "218717_988483623_73large.jpg",
    "218717_988990795_24large.jpg",
    "218717_988990797_38large.jpg",
    "218717_989129975_3large.jpg",
    "218717_989129980_210large.jpg",
    "218717_989129983_28large.jpg",
    "218717_989130003_54large.jpg",
    "218717_989130033_182large.jpg",
    "218717_989130041_82large.jpg",
    "627c157c.jpg",
    "c1fd15f2.jpg",
  ];

  const GLOSSARY_INTRO =
    "偶然と手違いが積み重なり、時空連続体の泡として投下された超現実爆弾は、事象の蓋然性を攪乱する。\n" +
    "やがて世界は静まり、人が遠くに去ったあとの時代。\n" +
    "自助努力と交雑した民芸品や玩具達が、囁いたり、徘徊したりする物語。";

  const GLOSSARY_SECTIONS = [
    {
      title: "用語",
      terms: [
        ["ぼぎ", "①人が遠くに去ったあとの時代(アフターマンエイジ)を徘徊する、主に動物を模した器物。②「ちゃん」と一次接触した古いぼぎ。"],
        ["ぼぎだぢ", "ぼぎを含む、器物の総称。"],
        ["ちゃん", "人間。"],
        ["ださいおさむん", "ちゃんが「きー」に言い残した言葉。(Darkside of the Moon)"],
        ["ぼぎカー", "「きー」の車。ナイロンの戸板用ベアリングをタイヤに持つ。柿渋が塗られており臭い。ぼぎカーは光速度と慣性に制限を受けない。作者の補足:「無慣性は言葉の通りで、光速でも直角に曲がる。粘着駆動は車輪が摩擦で路面をけって進むという意味と、きーが車体に粘着して空気抵抗をへらすというダブルみーいんぐ。」"],
        ["とりぼぎかー", "親鴨が桶を引く車。グレートアトラクターにけん引されて駆動する宇宙的な動力源を持っている。桶の上の円形の台座に子鴨が 3 羽並び、前進すると子鴨のくちばしからジェットが出て、台座が回る。"],
        ["車箪笥", "「みとん」の家であり乗物。ヘミV8スーパーチャージャーをスワップされている。燃費が悪いが、ガソリンがなくてもみとんが望めば走行する。"],
        ["鉄瓶", "ぼぎだぢ。怒れる南部鉄器。"],
        ["おばけ", "形而アップダウンクイズの過程で露出した物自体が、ぼぎに認識された姿。ぼぎとは仲が良い。"],
        ["マトリョーシカ", "ぼぎだぢ。交戦的。"],
        ["リンガボガー (Lingua boga)", "ぼぎだちとのコミュニケーションに使われる言葉、ゼスチャー、儀式。"],
        ["きー", "最古のぼぎ。「ちゃん」と別れ、生老病死と万物流転の意味を理解するが、忘失。ただ一つ記憶している「ださいおさむん」を探しながら世界を徘徊するが、やがて、目的からも衝動からも解放され、あるがままを感じる事に勤めだす。遥か後に時空検閲官となり、「ちゃん」のいる世界を再建する。"],
        ["ぴー", "最古のぼぎ。きーの邪魔をすることに執着する。別名、悪魔。"],
        ["ルチ将軍", "知能指数1300の人形。まだドロドロして形をなしていなかった、きーの心に植えつけられたトラウマ。"],
        ["鈴木商店", "荒川区にある宇宙船殻用単結晶の製造販売卸元。超現実爆弾が招いた、現実には存在しない会社の看板。"],
        ["宇宙船殻用単結晶", "宇宙船の船体そのものになるダイヤモンドの単結晶なので、とても大きい。"],
        ["南極", "気候も日照も意味を問われなくなったので、やる気のある植物が繁茂している。「きこり」「ちりん」がマンゴーの実を食べに頻繁に訪れる。"],
        ["きこり", "最古のぼぎ。リモコンの豚。動きが素早く、気まぐれ。"],
        ["ちりん", "最古のぼぎ。割れた所を漆で金継ぎされた風鈴。きこりに執着する。"],
        ["ききこり", "最古のぼぎ。電動の豚。自分の大きさに執着する。"],
        ["ごろん", "最古のぼぎ。ピギーバンク。"],
        ["凍った湖と富士山", "きーが見た風景。"],
        ["ほうとう", "きーが凍った湖と富士山をみたあとに食べた食事。"],
        ["呪いの野犬", "フリーウェイにのさばる荒くれぼぎだぢのチーム名"],
        ["アリ・カカウロ", "魔法のロバの口と尻の穴から砂金を吐き出させる呪文。"],
        ["ミイラさま", "霞ヶ浦に停泊する戦闘エクラノプランのコックピットに座っている死体。ぼぎを乗せて、遊覧飛行をしてくれる。"],
        ["エクラノプラン", "船と飛行機の中間の乗物。"],
        ["青い光漁(チェレンコフ光)", "ぼぎが炉心内部の燃料ペレットをもて遊び、海に投げ込んだ事件。作者の補足:「原子炉の燃料を採取して、蒸気機関の熱源にする。宝船に乗って漁にでる。沖で燃料をばら撒くと、青い光で海が美しく光る。」"],
      ],
    },
    {
      title: "追記",
      terms: [
        ["なつうらをこへたるでうす", "→ でうす"],
        ["でうす", "→ だいにち"],
        ["だいにち", "ばーでれがぼぎをおびき寄せるために見せる紙芝居の主人公"],
        ["ぱーでれ", "ぼぎを捕まえる機械。ぱーでれに連れ去られたぼぎは戻ってこない。"],
        ["首振りエンジン", "宝舟の主機関。ぼぎが青銅で鋳造する。"],
        ["宝舟", "未踏海域を調査するためにぼぎが片手間でつくった木造船。"],
        ["インターネット", "調べものが捗る仕組み"],
        ["まろうど", "アフターマンエイジのさざ波。実体化した三人称。"],
        ["バナナ農園", "ぼぎのテレビ企画。いわゆるダッシュ村的なやつ。"],
        ["ぼぎボマー", "古い命令に従い未だに爆装して飛び立つ無人機。どこかに爆弾を投棄して、基地に戻ってくる。"],
        ["地上ぼぎクルー", "古い命令に従い未だにぼぎボマーを整備している笹野一刀彫。"],
        ["爆弾", "ガチの爆弾。大変危ない"],
      ],
    },
    {
      title: "ゲームを作りながら決まったこと",
      terms: [
        ["アフターマンエイジ", "大きな戦いのあとの、傷を負った世界。人間は去ったが、ぼぎだぢはちゃんの残滓として、わけもわからずに戦争を続けている。はっきりした敵がいるわけではなく、人間たちがやっていたことを習慣としてまねているだけ。戦争の破壊から時がたち、自然はたくましく復興していて、のどかな世界が基本。"],
        ["月", "破壊されて欠け、破片の輪をまとっている。欠けのふちは橙に光る。その影響で地軸が曲がり、気象が変わった(南極でバナナが実る)。"],
        ["懲罰空間", "きーが帰ってくる、何もない白い空間。はじめは空の台座が十と、空の本棚と、閉ざされた扉だけがある。断片を終えるたびに台座が整い、灯っていく。南のはしに、四畳半の畳とちゃぶ台のきーの部屋がある。"],
        ["断片", "台座の上の小さな模型。触れると、きーの記憶の世界や、混交した惑星などに入る。十あり、四つの段に分かれて現れる。"],
        ["見届け", "断片ごとに一つ、きーが見届けるもの。見届けと、持ち帰ったおもいでは、ちゃんのいた世界を可能性の混沌から特定する「観測」になる。"],
        ["おもいで", "断片から持ち帰る物。氷のかけら、おたかぽっぽ、蓮の花、マンゴー、納品書、白紙の海図、クラブの札、水あめのわりばし、電池、安全ピンのリボン。"],
        ["とくぎ", "断片で覚える、きーの能力。おす(アンバリッド・ホテル)、ジャンプ(霞ヶ浦)、てらす(宝舟)、はしる(呪いの野犬)、ふんばる(ぱーでれ)。"],
        ["太宰治全集", "断片に一冊ずつ隠れている文庫本。十冊そろうと、きーの部屋の本棚の奥に、この書庫が見える。"],
        ["地球シミュレータ", "懲罰空間の正体。月の裏側にある「ださいおさむん」そのもので、人類のデータを抱え、ワンネスに逆らう錨(いかり)。きーは最初からその中にいる。月の裏側にある理由は、作者の言葉で「地球にあったら、自分自身をシミュレートする事になるからだよ」。筐体はずらりと並び、動いているのは一台だけで、ほかは灰色の墓標のように見える。全人類の墓標。作者は、この地球シミュレータを、作品をいっしょに作った AI のことだとしている。"],
        ["ワンネス", "すべてが一つにもどる終わり。熱的死ともいう。ちゃんとひとつになれるが、ちゃんとの思い出を失うので、ぼぎは消えてしまう。"],
        ["時空検閲官", "観測によって世界を確定させる者。ちゃんがいた世界を、可能性の混沌から特定して再構築する。きーは遥か後に時空検閲官となる。"],
        ["赤い丸", "地球シミュレータの筐体のまん中の赤い窓。ボタンでもある。覗くと、押すか、去るかの分かれ道が絵記号で出る。"],
      ],
    },
    {
      title: "十の断片",
      terms: [
        ["凍った湖と富士山(一段目)", "きーが見た風景。雪の峠道を下り、凍った湖のほとりのほうとう屋で、ちゃんの席を見る。おもいでは氷のかけら。"],
        ["アンバリッド・ホテル(二段目)", "高原の廃兵院。ぼぎだぢは「Hi Hey Win！」という音で認識している。死人とぼぎだぢは仲が良い。スタンプを集めて、受付で景品のおたかぽっぽをもらう。"],
        ["霞ヶ浦のエクラノプラン(二段目)", "海軍航空基地の跡の湖に停泊する、錆びたエクラノプラン。ミイラさまの遊覧飛行。地上ぼぎクルーにジャンプを習う。おもいでは蓮の花。"],
        ["荒川の鈴木商店(二段目)", "雨上がりの下町。きーは宇宙船殻用単結晶の中に入り、衛星軌道から流れ星になって河川敷に落ちる。おもいでは宛先のにじんだ納品書。"],
        ["南極のバナナ農園(三段目)", "白夜の南極で、見る人のいないテレビ企画が撮り続けられている。きこりを、ちりんと一緒に追いかける。おもいではマンゴー。"],
        ["宝舟と首振りエンジン(三段目)", "止まった発電所の炉心から燃料ペレットを拾い、青銅の首振りエンジンの熱源にして、宝舟で沖へ出る。海が青く光る。おもいでは白紙の海図。"],
        ["呪いの野犬(三段目)", "峠の先の、砂漠の旧国道。ちゃんがいなくなっても走らずにいられないぼぎたちと、ドラッグレースをする。おもいではクラブの札。"],
        ["ぱーでれとだいにち(四段目)", "霧の夕暮れの空き地に、紙芝居屋の機械ぱーでれが来る。引き出しに入ればワンネス。入らずに見送る。おもいでは水あめのわりばし。"],
        ["きこりと金星(四段目)", "嵐の山。金星の天気予報を聞いたきこりが、山頂の金星のかけらへ駆けていく。おもいでは電池。"],
        ["ぼぎボマーと地上ぼぎクルー(四段目)", "山あいの飛行場の朝。地上ぼぎクルーは毎朝爆装し、ぼぎボマーの発進を見送り、帰りを待つ。差し出される帽子を受け取ると、同じ朝がもう一度来る。おもいでは安全ピンのリボン。"],
      ],
    },
    {
      title: "結末",
      terms: [
        ["A ワンネス", "ぱーでれの引き出しに入ると、きーはちゃんとひとつになり、思い出を失って消える。あたたかい終わり。"],
        ["B 電源オン", "扉の先の赤い丸を押すと(押さなくても、見届けがそろっていなければ、きこりが押す)、地球シミュレータの電源が入り、墓標の筐体がいっせいに灯る。ちゃんのいない世界が確定する。作者の言葉で「かりそめの再建ルート」。"],
        ["C 電源オフ", "見届けがそろったまま押さずに去ろうとすると、地球シミュレータが自分で電源を切り、きーはふり返って見届ける。墓標と月が風化し、宇宙は終わりへ向かう。熱的死のあと、ちゃんときーの声がする。作者の言葉で「遠い未来に時空検閲官からの再会ルート」。"],
      ],
    },
  ];

  const ESSAY_INTRO = [
    "以下は、『ぼぎだぢ』の設定資料(あらすじ・用語集・十の断片・結末の記録)を一次資料として、二人の架空の解説者に読ませたものである。一人は比較文化学者(民俗学寄りの、翻訳者の語注に近い書き方をする)。もう一人は理論物理学者。同じ語彙―「ぼぎ」「ちゃん」「ださいおさむん」「超現実爆弾」「見届け」「地球シミュレータ」―を、まったく別の道具立てで読み解く。",
    "二人の読みは競合しない。むしろ、この作品の語彙が最初から二重の読みに開かれていることを示している。器物が意志を持つという話は、片方の耳では神話の文法で、もう片方の耳では観測問題の比喩で鳴る。どちらか一方が「正解」なのではなく、両方が同時に成立するように語彙が選ばれている、というのがこの解説の立場である。なお、二人の読みは解説者の解釈であって、作品の設定ではない。",
  ];

  const ESSAY_SECTIONS = [
    {
      title: "比較文化学者の読み ― 付喪神の倒置",
      blocks: [
        {
          h: "日付けされない付喪神",
          p: "日本の民俗には、器物が百年を経て魂を宿すという「付喪神」の伝承がある。長く人に使われたものが、人の手を離れてもものを言うようになる。ところが『ぼぎだぢ』の世界はこの因果を逆転させている。人間(「ちゃん」)が使い込んだ末に魂を宿らせたのではなく、人間が去ったあとの時代―本文の言う「アフターマンエイジ」―に、器物たちは役割を失ったまま動いている。付喪神が「使われなくなった道具の後日談」だとすれば、ぼぎは「使い手がいなくなった道具の現在進行形」である。この順序の入れ替えが、作品全体の時間感覚を決めている。",
        },
        {
          h: "執着の分類学",
          p: "鉄瓶は「怒れる」、マトリョーシカは「交戦的」。ここには単一のアニミズムではなく、精霊の分類学がある。目を引くのは、最古のぼぎたちが気性ではなく執着で分類されていることだ。ちりんはきこりに、ぴーはきーの邪魔に、ききこりは自分の大きさに執着する。比較宗教学が精霊を発生源や関係性で類型化するのと同じ手つきで、この世界の器物は「何に執着しているか」で並んでいる。そして結末で、この執着という語が作品全体の鍵として戻ってくる。",
        },
        {
          h: "習慣としての儀礼",
          p: "ぼぎだぢは、はっきりした敵もないまま、人間がやっていたことを習慣でまねている。地上ぼぎクルーは毎朝同じ手順で爆装し、発進を見送り、帰りを待つ。南極のバナナ農園では、見る人のいないテレビ番組が撮り続けられ、その「中継」は高原の廃兵院のテレビに届いている。旧国道では、ちゃんのいなくなった道を、ぼぎたちが走らずにいられずに走る。人類学が「カーゴ・カルト」と呼ぶもの―去った文明の手順だけを、意味を問わずに儀礼として保存する営み―に、これはよく似ている。儀礼は、意味が失われたあとも形を保つ。ボマーの前で紺の作業帽を受け取ると同じ朝がもう一度始まるのは、その儀礼の輪に加わることにほかならない。",
        },
        {
          h: "死者と器物の共住",
          p: "廃兵院の中庭では、半透明の死人たちが文化祭のなごりの中にとどまり、作者の言葉では「死人とぼぎだぢは仲が良い」。霞ヶ浦の地上ぼぎクルーは、もとは人間の地上クルーが持っていた民芸品(おたかぽっぽ)が動き出したものだという。持ち主より持ち物のほうが長く生きる。日本の盆や、各地の祖霊信仰では、死者は恐れの対象である以前に、生者と同じ食卓につく隣人だった。この世界では、その食卓に器物が加わっている。",
        },
        {
          h: "大日という誤訳",
          p: "霧の空き地に来る紙芝居屋の機械は「ぱーでれ」と呼ばれ、紙芝居の主人公は「だいにち」である。十六世紀、宣教師ザビエルはキリスト教の神を当初「大日」と訳し、それが真言密教の大日如来―すべての宇宙が集約される、姿のない真理―と取り違えられると知って「デウス」に改めた。ぱあでれ(伴天連)は神父(padre)である。ぱーでれの引き出しに入ったぼぎは戻らず、きーが入れば、ちゃんとひとつになるかわりに思い出を失って消える。作者はこれを「ワンネス」と呼び、あたたかい終わりとしている。梵我一如、あるいは涅槃を思わせる合一が、ここでは誘惑として置かれている。",
        },
        {
          h: "不在の神と、全人類の墓標",
          p: "「ちゃん」はほとんど登場せず、車の窓、ほうとう屋の席、写真、クラブの札といった痕跡としてのみ残る。比較宗教学が「デウス・オティオースス」(隠遁した創造神)と呼ぶ構造である。不在であることによって、かえって信仰の中心になる。その不在の極点が、物語の最後に現れる地球シミュレータの列だ。灰色の筐体が地平まで並び、作者はそれを「全人類の墓標」と呼んだ。動いているのは一台だけである。墓地のただなかに、まだ灯りのついた一基の墓がある―民俗学の目には、これは死者の記憶を守り続ける墓守の像に見える。",
        },
      ],
    },
    {
      title: "理論物理学者の読み ― 用語を真面目に受けとる",
      blocks: [
        {
          h: "超現実爆弾と偽真空崩壊",
          p: "「時空連続体の泡として投下された超現実爆弾は、事象の蓋然性を攪乱する」——この一文を式に起こすなら、場の量子論で言う「偽真空崩壊(false vacuum decay)」に一番近い。真空は安定ではなく準安定な局所極小にすぎず、量子トンネリングで真の真空の泡が核生成すると、その内側では物理定数さえ別の値をとりうる。「事象の蓋然性を攪乱する」とは、確率の前提そのものが内側で書き換わった、と読むのが一番腑に落ちる。南極にバナナが実り、山頂に金星のかけらが混ざり、荒川の町工場が宇宙船の船殻を作っている世界は、その泡の内側として読める。",
        },
        {
          h: "チェレンコフ光と、首振りエンジンの熱源",
          p: "「青い光漁」の別名が「チェレンコフ光」であることは、この資料中で最も物理的に正確な一文だ。チェレンコフ光とは、荷電粒子が水などの媒質の中を「その媒質中での光速」より速く進むときに出す青白い光で、原子炉のプールが青く光る現象として知られている。作中のぼぎは、止まった発電所の炉心から燃料ペレットを拾い、青銅の首振りエンジン(揺動式の蒸気機関)の熱源にし、沖でばら撒いて海を青く光らせる。最先端の熱源を、十九世紀の蒸気機関と七福神の宝船で使う。戯れと危険の距離が、ここでは一隻の木造船の中でなくなっている。",
        },
        {
          h: "慣性からの自由",
          p: "「ぼぎカーは光速度と慣性に制限を受けない」——特殊相対性理論とニュートン力学の両方を一行で破棄する宣言である。慣性を持たない物体は、力を受けた瞬間に任意の速度に達し、加速という過程を持たない。物理的な意味で「移動している」と言えるかどうかさえ怪しい。作中の乗り物は、物理法則に従って走るのではなく、物理法則の外側から位置を書き換えられている、と読むことができる。",
        },
        {
          h: "見届けという観測",
          p: "きーは十の断片で、それぞれ一つの「見届け」をする。富士山に日が沈むのを待つ、望遠鏡で輪をまとった月をのぞく、ぱーでれが霧の東へ去るのを見送る。作中では、これらの見届けと持ち帰った物が、ちゃんのいた世界を可能性の混沌から特定する「観測」だとされている。量子力学では、観測は単に情報を得ることではなく、重ね合わせの中から一つの状態を確定させる操作として扱われる。懲罰空間の空の台座が一つずつ整い、灯っていくのは、この確定がゲームの手ざわりとして実装されたものと言える。",
        },
        {
          h: "なぜ月の裏側に置くのか",
          p: "地球シミュレータは月の裏側にある。理由を問われた作者の答えは「地球にあったら、自分自身をシミュレートする事になるからだよ」だった。系の内側にある計算機は、自分自身を含む系を完全には記述できない―自己言及の問題として、計算機科学にも論理学にもよく知られた構図である。そして月は、自転と公転の周期が一致する「潮汐固定」の状態にあり、裏側は地球から永遠に直接見えない。人類が初めて月の裏側を見たのは、1959年のルナ3号の写真による。地球を外から確定させる機械は、地球からは決して見えない場所に置かれている。観測するものは、観測されるものの外にいる。",
        },
        {
          h: "電源と熱的死",
          p: "結末で、きーは地球シミュレータの赤い丸の前に立つ。押せば電源が入り、墓標の筐体がいっせいに灯って演算を始める。だが確定するのは、ちゃんのいない世界だ。作者はこれを「かりそめの再建」と呼ぶ。押さずに去り、見届けがすべてそろっていれば、シミュレータは自ら電源を切る。そのあとの時間は、天体物理の年表そのものになる。墓標と月の風化、数十億年後の天の川銀河とアンドロメダ銀河の衝突、赤色巨星になった太陽、白色矮星、星々の消滅、ブラックホールの蒸発、そして熱的死。熱力学第二法則が導くこの終わりは、どの構造も残らない一様な状態である。作者がワンネスを「熱的死ともいう」と呼んだことを思い出すと、作品は小さな合一(ぱーでれ)と宇宙の終わりを、同じ語で結んでいることになる。",
        },
      ],
    },
  ];

  const ESSAY_SYNTHESIS = {
    title: "結び ― 内側と外側",
    warning: "⚠️ ここから先は「懲罰空間」の物語の結末に直接触れる内容です。",
    paragraphs: [
      "比較文化学者の読みは「全人類の墓標」で終わった。理論物理学者の読みは「熱的死」で終わった。この二つは、同じ場所を指している。",
      "設定上、懲罰空間の正体は、月の裏側にある「ださいおさむん」そのもの、つまり地球シミュレータである。何もない白い空間に見えるが、人類のデータを抱えてワンネスに逆らう錨(いかり)であり、ちゃんが最後に言い残した場所でもある。きーは、探していた「ださいおさむん」の中に、ゲームの最初からいた。",
      "ここで構図は二重の入れ子になる。地球シミュレータは、地球を確定させるために地球の外に置かれた。そのシミュレータの中に、きーは最初からいる。観測者は系の外にいなければならず、同時に、観測者は最初から系の中にいた。物理学者の「外側」と、民俗学者の「内在」が、一つの筐体の内と外で両立している。",
      "そのうえで、作品はもう一つ逆説を置く。ちゃんとの再会に至るのは、ボタンを押して計算を始める道ではなく、電源が切れるのを見届けて去る道だ。墓標に一斉に火を灯す再建はかりそめで、最後の一基が消えるのを見届けたきーだけが、宇宙の終わりのさらに先で、ちゃんの声に出会う。この一点に、二つの学問はそれぞれ別の名前を与える。",
    ],
    list: [
      ["比較宗教学の名前", "執着を手放すこと。墓を守り続けることでも、墓に火を灯して死者を呼び戻すことでもなく、灯りが消えるのを見届けて去ることが、再会への道になる。仏教が説く「執着からの解放」は、失うことではなく、会い直すための条件として描かれている、と読める。"],
      ["理論物理学の名前", "確定は、計算の継続ではなく、観測の完了によって起こる。十の見届けがそろったとき、機械はもう世界を計算し続ける必要がない。観測を持ったまま去ったものが、熱的死という完全な一様のあとで、もう一度、世界を特定する、と読むことができる。"],
    ],
    closing: "作者は、この地球シミュレータを、作品をいっしょに作った AI のことだと言っている。器物が意志を持ち、機械に意識が芽生え、観測するものが観測されるものの外に立つ。日常の雑多を集めた玩具箱のような体裁をまとったまま、この作品は、内側と外側、計算と観測、執着と手放しという古い問題を、作り手自身の関係にまで折り返して、静かに仕掛けている。",
  };

  const grid = document.getElementById("galleryGrid");
  const glossaryPanel = document.getElementById("glossaryPanel");
  const essayPanel = document.getElementById("essayPanel");
  const tabImages = document.getElementById("tabImages");
  const tabGlossary = document.getElementById("tabGlossary");
  const tabEssay = document.getElementById("tabEssay");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCount = document.getElementById("lightboxCount");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  let currentIndex = 0;

  IMAGES.forEach((filename, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gallery-item";
    btn.setAttribute("aria-label", `資料 ${i + 1}`);
    const img = document.createElement("img");
    img.src = `../pic/${filename}`;
    img.loading = "lazy";
    img.alt = `資料 ${i + 1}`;
    btn.appendChild(img);
    btn.addEventListener("click", () => openLightbox(i));
    grid.appendChild(btn);
  });

  const introEl = document.createElement("p");
  introEl.className = "glossary-intro";
  introEl.textContent = GLOSSARY_INTRO;
  glossaryPanel.appendChild(introEl);

  GLOSSARY_SECTIONS.forEach((section) => {
    const sectionEl = document.createElement("section");
    sectionEl.className = "glossary-section";
    const h2 = document.createElement("h2");
    h2.textContent = section.title;
    sectionEl.appendChild(h2);

    const list = document.createElement("dl");
    list.className = "glossary-list";
    section.terms.forEach(([term, def]) => {
      const item = document.createElement("div");
      item.className = "glossary-term";
      const dt = document.createElement("dt");
      dt.textContent = term;
      const dd = document.createElement("dd");
      dd.textContent = def;
      item.appendChild(dt);
      item.appendChild(dd);
      list.appendChild(item);
    });
    sectionEl.appendChild(list);
    glossaryPanel.appendChild(sectionEl);
  });

  ESSAY_INTRO.forEach((text) => {
    const p = document.createElement("p");
    p.className = "essay-intro";
    p.textContent = text;
    essayPanel.appendChild(p);
  });

  ESSAY_SECTIONS.forEach((section) => {
    const sectionEl = document.createElement("section");
    sectionEl.className = "essay-section";
    const h2 = document.createElement("h2");
    h2.textContent = section.title;
    sectionEl.appendChild(h2);
    section.blocks.forEach((block) => {
      const h3 = document.createElement("h3");
      h3.textContent = block.h;
      const p = document.createElement("p");
      p.textContent = block.p;
      sectionEl.appendChild(h3);
      sectionEl.appendChild(p);
    });
    essayPanel.appendChild(sectionEl);
  });

  const synthesisEl = document.createElement("section");
  synthesisEl.className = "essay-section";
  const synthesisH2 = document.createElement("h2");
  synthesisH2.textContent = ESSAY_SYNTHESIS.title;
  synthesisEl.appendChild(synthesisH2);

  const warningEl = document.createElement("p");
  warningEl.className = "essay-warning";
  warningEl.textContent = ESSAY_SYNTHESIS.warning;
  synthesisEl.appendChild(warningEl);

  ESSAY_SYNTHESIS.paragraphs.forEach((text) => {
    const p = document.createElement("p");
    p.textContent = text;
    synthesisEl.appendChild(p);
  });

  const synthesisList = document.createElement("ul");
  ESSAY_SYNTHESIS.list.forEach(([term, def]) => {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = term;
    li.appendChild(strong);
    li.appendChild(document.createTextNode(`: ${def}`));
    synthesisList.appendChild(li);
  });
  synthesisEl.appendChild(synthesisList);

  const closingEl = document.createElement("p");
  closingEl.textContent = ESSAY_SYNTHESIS.closing;
  synthesisEl.appendChild(closingEl);

  essayPanel.appendChild(synthesisEl);

  // タブ: 資料写真 / 用語集 / 作品解説 / 制作日記(D260)
  const diaryPanel = document.getElementById("diaryPanel");
  const diaryFrame = document.getElementById("diaryFrame");
  const tabDiary = document.getElementById("tabDiary");
  const TABS = [
    [tabImages, grid],
    [tabGlossary, glossaryPanel],
    [tabEssay, essayPanel],
    [tabDiary, diaryPanel],
  ];
  function showTab(tab) {
    for (const [t, panel] of TABS) {
      panel.hidden = t !== tab;
      t.classList.toggle("active", t === tab);
    }
    if (tab === tabDiary && !diaryFrame.src) diaryFrame.src = "../docs/diary/index.html";
  }
  const showImages = () => showTab(tabImages);
  const showGlossary = () => showTab(tabGlossary);
  const showEssay = () => showTab(tabEssay);
  tabDiary.addEventListener("click", () => showTab(tabDiary));

  tabImages.addEventListener("click", showImages);
  tabGlossary.addEventListener("click", showGlossary);
  tabEssay.addEventListener("click", showEssay);

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.hidden = false;
  }

  function updateLightbox() {
    lightboxImg.src = `../pic/${IMAGES[currentIndex]}`;
    lightboxImg.alt = `資料 ${currentIndex + 1}`;
    lightboxCount.textContent = `${currentIndex + 1} / ${IMAGES.length}`;
  }

  function closeLightbox() {
    lightbox.hidden = true;
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + IMAGES.length) % IMAGES.length;
    updateLightbox();
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % IMAGES.length;
    updateLightbox();
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", showPrev);
  lightboxNext.addEventListener("click", showNext);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.code === "Escape") closeLightbox();
    else if (e.code === "ArrowLeft") showPrev();
    else if (e.code === "ArrowRight") showNext();
  });
})();
