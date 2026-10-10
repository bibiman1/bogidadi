// 古い版が残らないように(ホーム画面に置いたとき、ページそのものが手元に残る)。index.html の中から、このファイルに出した(D301。ページの中に直接書いた script を禁止するため)
// version.json(毎回取りにいく)の版がこのページとちがえば、URL を変えて読みなおす。版を上げるときは、下の数と version.json と ?v= をそろえる
(function () {
  var V = "284";
  fetch("./version.json?t=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j || !j.v || j.v === V) return;
      var key = "bogidachi.reloadedFor";
      try {
        // 読みなおしても同じなら、すぐにはくり返さない。ただし 30 秒たったら、もう一度ためす
        // (公開の切りかえの途中で読みなおすと、古いページのまま止まっていた)
        var last = (sessionStorage.getItem(key) || "").split("@");
        if (last[0] === j.v && Date.now() - Number(last[1] || 0) < 30000) return;
        sessionStorage.setItem(key, j.v + "@" + Date.now());
      } catch (e) {}
      var u = new URL(location.href);
      u.searchParams.set("r", j.v);
      location.replace(u.toString());
    })
    .catch(function () {});
})();
