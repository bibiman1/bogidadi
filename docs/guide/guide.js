// 指南書(guide.md)を読み物のページにする。日記(../diary/)と同じ字体と色。図は押すと原寸で開く
const root = document.getElementById("root");
fetch("guide.md").then(r => { if (!r.ok) throw 0; return r.text(); })
  .then(md => {
    root.innerHTML = marked.parse(md) + '<p class="foot"><a href="../diary/index.html">制作日記へ</a></p>';
    // 目次: 章(h2)ごとに。1 つ目の hr の前に置く
    const hs = [...root.querySelectorAll("h2")];
    hs.forEach((h, i) => { h.id = "c" + i; });
    const nav = document.createElement("nav");
    nav.className = "contents";
    nav.innerHTML = "<strong>目次</strong><ol>" + hs.map((h, i) => `<li><a href="#c${i}">${h.textContent}</a></li>`).join("") + "</ol>";
    const hr = root.querySelector("hr");
    (hr || root.firstChild).after(nav);
    // 図と画像: 押すと原寸で開く。図(fig/)はなめらかに、ドット絵(img/)はドットのまま
    root.querySelectorAll("img").forEach(img => {
      const a = document.createElement("a");
      a.href = img.getAttribute("src");
      a.className = img.getAttribute("src").startsWith("fig/") ? "fig" : "";
      img.replaceWith(a); a.appendChild(img);
    });
    const h = root.querySelector("h1");
    if (h) document.title = h.textContent;
  })
  .catch(() => { root.innerHTML = "<p>指南書が見つかりません。</p>"; });
