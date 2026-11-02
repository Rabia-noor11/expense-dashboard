// Zero-dependency backend: generates 12 months of sample expenses, aggregates stats server-side.
const http = require("http"), fs = require("fs"), path = require("path");
const CATS = ["Food", "Transport", "Shopping", "Bills", "Health", "Fun"];
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

let seed = 42; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const tx = [], now = new Date();
for (let d = new Date(now.getFullYear(), now.getMonth() - 11, 1, 12); d <= now; d.setDate(d.getDate() + 1)) {
  for (let i = 0, n = 1 + Math.floor(rnd() * 3); i < n; i++) {
    const c = CATS[Math.floor(rnd() * CATS.length)];
    tx.push({ date: ymd(d), category: c, amount: Math.round(5 + rnd() * (c === "Bills" ? 150 : c === "Shopping" ? 90 : 40)) });
  }
}

function stats(q) {
  const months = Number(q.get("months")) || 12, cat = q.get("category") || "all";
  const from = ymd(new Date(now.getFullYear(), now.getMonth() - months + 1, 1));
  const rows = tx.filter((t) => t.date >= from && (cat === "all" || t.category === cat));
  const sum = (a) => a.reduce((s, t) => s + t.amount, 0);
  const group = (keyFn) => rows.reduce((m, t) => { const k = keyFn(t); m[k] = (m[k] || 0) + t.amount; return m; }, {});
  const byMonth = group((t) => t.date.slice(0, 7)), byCategory = group((t) => t.category);
  const wk = group((t) => new Date(t.date + "T12:00:00").getDay());
  const total = sum(rows), top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  return { categories: CATS, count: rows.length, total, average: rows.length ? Math.round(total / rows.length) : 0,
    topCategory: top ? top[0] : "-",
    byMonth: Object.keys(byMonth).sort().map((k) => ({ label: k, value: byMonth[k] })),
    byCategory: Object.entries(byCategory).map(([label, value]) => ({ label, value })),
    byWeekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => ({ label, value: wk[i] || 0 })) };
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/stats") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(stats(url.searchParams)));
  }
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(fs.readFileSync(path.join(__dirname, "public", "index.html")));
}).listen(process.env.PORT || 3000, () => console.log("Running on http://localhost:" + (process.env.PORT || 3000)));
