import fs from 'fs';
import path from 'path';
import { scrape38Schedule, scrape38History, scrape38Detail } from '@/lib/scraper/38-scraper';
import { scrapeFinutsCompetition } from '@/lib/scraper/finuts-scraper';
import { IPO } from '@/types/ipo';

function normalizeName(name: string): string {
  if (!name) return '';
  // Remove spaces and anything in parentheses
  return name.replace(/\s+/g, '').replace(/\(.*\)/g, '').trim();
}

async function aggregateData() {
  console.log('Starting data aggregation...');
  
  const schedules = await scrape38Schedule();
  console.log(`[Agg] Scraped ${schedules.length} schedules from 38comm.`);

  const histories = await scrape38History();
  console.log(`[Agg] Scraped ${histories.length} historical performance entries.`);

  let competitions = new Map<string, Partial<IPO>>();
  // Removed try-catch block around scrapeFinutsCompetition to allow errors to propagate
  // and cause the process to exit with a non-zero code, as per instruction.
  competitions = await scrapeFinutsCompetition();
  console.log(`[Agg] Scraped ${competitions.size} competition entries from Finuts.`);
  
  // Create a map with normalized names
  const normalizedCompMap = new Map<string, Partial<IPO>>();
  competitions.forEach((data, name) => {
    const norm = normalizeName(name);
    normalizedCompMap.set(norm, data);
  });
  
  const aggregated: IPO[] = [];
  
  console.log(`[Agg] Fetching details for top items...`);
  // Process in chunks or limited set to avoid rate limiting
  for (const sched of schedules.slice(0, 30)) {
    const normName = normalizeName(sched.companyName || '');
    const compMatch = normalizedCompMap.get(normName);
    
    let detail = {};
    if (sched.id) {
      console.log(`[Agg] Fetching detail for ${sched.companyName} (${sched.id})...`);
      detail = await scrape38Detail(sched.id);
    }

    aggregated.push({
      ...sched,
      ...compMatch,
      ...detail,
      updatedAt: new Date().toISOString()
    } as IPO);
  }

  const dataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Save regular IPO list
  fs.writeFileSync(
    path.join(dataDir, 'ipo_list.json'),
    JSON.stringify(aggregated, null, 2)
  );

  // Save IPO history separately for analysis
  fs.writeFileSync(
    path.join(dataDir, 'ipo_history.json'),
    JSON.stringify(histories, null, 2)
  );

  console.log(`Aggregation complete. ${aggregated.length} IPOs and ${histories.length} history items saved.`);
}

aggregateData().catch(err => {
  console.error(err);
  process.exit(1);
});
