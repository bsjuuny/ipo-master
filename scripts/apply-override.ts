/**
 * apply-override.ts
 * 스크래핑 없이 competition_override.json을 ipo_list.json에 머지만 합니다.
 * GitHub Actions에서 admin 저장 후 빠른 배포용으로 사용됩니다.
 */
import fs from 'fs';
import path from 'path';
import { IPO, BrokerCompetition } from '@/types/ipo';

type CompetitionOverride = {
  totalCompetition?: string;
  competitionData?: BrokerCompetition[];
};

const dataDir = path.join(process.cwd(), 'public', 'data');
const listPath = path.join(dataDir, 'ipo_list.json');
const overridePath = path.join(dataDir, 'competition_override.json');

const ipoList: IPO[] = JSON.parse(fs.readFileSync(listPath, 'utf-8'));
const overrides: Record<string, CompetitionOverride> = JSON.parse(fs.readFileSync(overridePath, 'utf-8'));

const merged = ipoList.map(ipo => {
  const override = overrides[ipo.id];
  if (!override) return ipo;
  return {
    ...ipo,
    ...(override.totalCompetition ? { totalCompetition: override.totalCompetition } : {}),
    ...(override.competitionData && override.competitionData.length > 0 ? { competitionData: override.competitionData } : {}),
  };
});

fs.writeFileSync(listPath, JSON.stringify(merged, null, 2));

const count = Object.keys(overrides).length;
console.log(`apply-override: ${count}개 항목 머지 완료 → ipo_list.json 업데이트`);
