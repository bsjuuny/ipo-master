import fs from 'fs';
import path from 'path';
import { scrape38Schedule, scrape38History, scrape38Detail } from '@/lib/scraper/38-scraper';
import { IPO, BrokerCompetition } from '@/types/ipo';

type CompetitionOverride = {
  totalCompetition?: string;
  competitionData?: BrokerCompetition[];
};

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

  const aggregated: IPO[] = [];

  console.log(`[Agg] Fetching details for top items...`);
  for (const sched of schedules.slice(0, 30)) {
    
    let detail = {};
    if (sched.id) {
      console.log(`[Agg] Fetching detail for ${sched.companyName} (${sched.id})...`);
      detail = await scrape38Detail(sched.id);
    }

    aggregated.push({
      ...sched,
      ...detail,
      updatedAt: new Date().toISOString()
    } as IPO);
  }

  const dataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Merge competition overrides
  const overridePath = path.join(dataDir, 'competition_override.json');
  let overrides: Record<string, CompetitionOverride> = {};
  if (fs.existsSync(overridePath)) {
    try {
      overrides = JSON.parse(fs.readFileSync(overridePath, 'utf-8'));
    } catch {
      overrides = {};
    }
  }

  const withOverrides = aggregated.map(ipo => {
    const override = overrides[ipo.id];
    if (!override) return ipo;
    return {
      ...ipo,
      ...(override.totalCompetition ? { totalCompetition: override.totalCompetition } : {}),
      ...(override.competitionData && override.competitionData.length > 0 ? { competitionData: override.competitionData } : {}),
    };
  });

  // Save regular IPO list
  fs.writeFileSync(
    path.join(dataDir, 'ipo_list.json'),
    JSON.stringify(withOverrides, null, 2)
  );

  // Save IPO history separately for analysis
  fs.writeFileSync(
    path.join(dataDir, 'ipo_history.json'),
    JSON.stringify(histories, null, 2)
  );

  const overrideCount = Object.keys(overrides).length;
  console.log(`Aggregation complete. ${withOverrides.length} IPOs (${overrideCount} with manual overrides) and ${histories.length} history items saved.`);
}

aggregateData().catch(err => {
  console.error(err);
  process.exit(1);
});
