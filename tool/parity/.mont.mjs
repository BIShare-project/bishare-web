import { chromium } from "@playwright/test"; import { readFileSync } from "node:fs";
const [out, ...fs] = process.argv.slice(2); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 600 } });
await p.setContent(`<body style="margin:8px;background:#888;display:grid;grid-template-columns:1fr 1fr;gap:8px">${fs.map((f) => `<img style="width:100%" src="data:image/png;base64,${readFileSync(f).toString("base64")}">`).join("")}`); await p.screenshot({ path: out, fullPage: true }); await b.close();
