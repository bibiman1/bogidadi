// 書庫の「総括」タブ(todo 333)。本文は soukatsu.md(五人の批評、座談会、総括)。
const root = document.getElementById("root");
fetch("soukatsu.md").then(r => { if (!r.ok) throw 0; return r.text(); })
  .then(md => {
    root.innerHTML = marked.parse(md);
    // 出典などの外のリンクは、書庫の枠の中ではなく別のタブで開く
    root.querySelectorAll('a[href^="http"]').forEach(a => { a.target = "_blank"; a.rel = "noopener noreferrer"; });
  })
  .catch(() => { root.innerHTML = "<p>読み込めませんでした。</p>"; });
