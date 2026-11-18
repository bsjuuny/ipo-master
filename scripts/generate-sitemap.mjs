// next build 뒤에 out/ 에 실제로 만들어진 페이지만 모아 out/sitemap.xml 을 쓴다.
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://bsjuuny2026.mycafe24.com/ipomaster';
const OUT = path.join(process.cwd(), 'out');

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('[sitemap] out/index.html 이 없습니다 — next build 가 먼저 끝나야 합니다.');
  process.exit(1);
}

const has = (rel) => fs.existsSync(path.join(OUT, rel, 'index.html'));
const ipoDir = path.join(OUT, 'ipo');
const ids = fs.existsSync(ipoDir)
  ? fs.readdirSync(ipoDir, { withFileTypes: true }).filter((d) => d.isDirectory() && has(`ipo/${d.name}`)).map((d) => d.name).sort()
  : [];

const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const urls = [
  `${SITE_URL}/`,
  ...['calendar', 'analysis'].filter(has).map((p) => `${SITE_URL}/${p}/`),
  ...ids.map((id) => `${SITE_URL}/ipo/${encodeURIComponent(id)}/`),
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), xml);
console.log(`[sitemap] out/sitemap.xml ${urls.length}개 주소 (공모주 ${ids.length})`);
