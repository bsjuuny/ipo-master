#!/usr/bin/env node
/**
 * edit-override.mjs
 *
 * 로컬 전용 관리 스크립트. 예전 /admin 페이지(브라우저에서 GitHub API로 직접 저장)를
 * 대체합니다 — GitHub PAT을 클라이언트 번들에 넣지 않기 위해, 이 스크립트를 로컬에서
 * 실행해 competition_override.json을 직접 수정하고 git으로 커밋/푸시합니다.
 *
 * 사용법: npm run admin:edit
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { execSync } from 'child_process';

const dataDir = path.join(process.cwd(), 'public', 'data');
const listPath = path.join(dataDir, 'ipo_list.json');
const overridePath = path.join(dataDir, 'competition_override.json');

function stripRate(v) { return v ? v.replace(/:1$/, '').trim() : ''; }
function appendRate(v) { return v && !v.endsWith(':1') ? `${v}:1` : v; }

function calcProportional(offeringPrice, competitionRate, deposit) {
  if (!competitionRate) return 0;
  const cleanRate = competitionRate.replace(/,/g, '').replace(/:1$/, '').trim();
  const rate = parseFloat(cleanRate);
  if (!rate || isNaN(rate) || !offeringPrice || rate <= 0 || deposit <= 0) return 0;
  const subscriptionShares = Math.floor((deposit * 2) / offeringPrice);
  return Math.floor(subscriptionShares / rate);
}

function calcTotalCompetition(brokers) {
  let weightedSum = 0;
  let totalShares = 0;
  for (const b of brokers) {
    const rate = parseFloat(b.competitionRate.replace(/,/g, ''));
    const shares = b.allocatedShares ?? 0;
    if (!rate || !shares) continue;
    weightedSum += rate * shares;
    totalShares += shares;
  }
  if (!totalShares) return 0;
  return Math.round((weightedSum / totalShares) * 100) / 100;
}

function getActiveIpos(ipoList) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);

  const active = ipoList.filter(ipo => {
    const startYear = ipo.subscriptionStart.split('.')[0];
    let endStr = ipo.subscriptionEnd;
    if (endStr.split('.').length === 2) endStr = `${startYear}.${endStr}`;
    const end = new Date(endStr.replace(/\./g, '-'));
    return end >= threeDaysAgo;
  });

  active.sort((a, b) => {
    const getStatus = ipo => {
      const startYear = ipo.subscriptionStart.split('.')[0];
      const start = new Date(ipo.subscriptionStart.replace(/\./g, '-'));
      let endStr = ipo.subscriptionEnd;
      if (endStr.split('.').length === 2) endStr = `${startYear}.${endStr}`;
      const end = new Date(endStr.replace(/\./g, '-'));
      if (start <= today && end >= today) return 0;
      if (start > today) return 1;
      return 2;
    };
    const sa = getStatus(a), sb = getStatus(b);
    if (sa !== sb) return sa - sb;
    return new Date(a.subscriptionStart.replace(/\./g, '-')).getTime()
         - new Date(b.subscriptionStart.replace(/\./g, '-')).getTime();
  });

  return active;
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => rl.question(q);

  const ipoList = JSON.parse(fs.readFileSync(listPath, 'utf-8'));
  const overrides = fs.existsSync(overridePath)
    ? JSON.parse(fs.readFileSync(overridePath, 'utf-8'))
    : {};

  const active = getActiveIpos(ipoList);
  if (active.length === 0) {
    console.log('현재 청약 중이거나 최근 마감된 공모주가 없습니다.');
    rl.close();
    return;
  }

  const depositInput = await ask('청약증거금 (기본 10,000,000원, 엔터로 기본값): ');
  const deposit = depositInput.trim() ? Number(depositInput.trim()) : 10_000_000;

  let changed = false;

  for (const ipo of active) {
    console.log(`\n=== ${ipo.companyName} (${ipo.subscriptionStart} ~ ${ipo.subscriptionEnd}, 공모가 ${ipo.offeringPrice.toLocaleString()}원) ===`);
    const existing = overrides[ipo.id];
    if (existing) {
      console.log('현재 저장된 값:', JSON.stringify(existing, null, 2));
    } else {
      console.log('현재 저장된 값 없음.');
    }

    const doEdit = (await ask('수정하시겠습니까? (y/N): ')).trim().toLowerCase();
    if (doEdit !== 'y') continue;

    const rows = [];
    console.log('증권사별 경쟁률 입력 (증권사명을 빈 값으로 두면 종료)');
    while (true) {
      const brokerName = (await ask('  증권사명: ')).trim();
      if (!brokerName) break;
      const competitionRate = stripRate((await ask('  경쟁률 (예: 1234.56): ')).trim());
      const allocatedSharesRaw = (await ask('  배정주식수 (선택, 엔터로 생략): ')).trim();
      const equalAllocation = (await ask('  균등배정 (선택, 엔터로 생략): ')).trim();

      const proportional = calcProportional(ipo.offeringPrice, competitionRate, deposit);
      rows.push({
        brokerName,
        competitionRate: appendRate(competitionRate),
        ...(allocatedSharesRaw ? { allocatedShares: Number(allocatedSharesRaw) } : {}),
        ...(equalAllocation ? { equalAllocation } : {}),
        ...(proportional > 0 ? { proportionalAllocation: String(proportional) } : {}),
      });
      console.log(`  → 비례배정 예상: ${proportional}주`);
    }

    const calculated = calcTotalCompetition(rows);
    const manualTotalRaw = (await ask(`통합 경쟁률 직접 입력 (자동계산값 ${calculated > 0 ? calculated : '없음'} 사용시 엔터): `)).trim();
    const totalCompetition = appendRate(manualTotalRaw || (calculated > 0 ? String(calculated) : ''));

    if (!totalCompetition && rows.length === 0) {
      delete overrides[ipo.id];
      console.log('→ 저장값 삭제됨 (입력 없음).');
    } else {
      overrides[ipo.id] = {
        ...(totalCompetition ? { totalCompetition } : {}),
        ...(rows.length > 0 ? { competitionData: rows } : {}),
      };
      console.log('→ 반영될 값:', JSON.stringify(overrides[ipo.id], null, 2));
    }
    changed = true;
  }

  if (!changed) {
    console.log('\n변경사항 없음. 종료합니다.');
    rl.close();
    return;
  }

  fs.writeFileSync(overridePath, JSON.stringify(overrides, null, 2) + '\n');
  console.log(`\ncompetition_override.json 저장 완료 (${Object.keys(overrides).length}개 항목).`);

  const doGit = (await ask('git add + commit + push 하시겠습니까? (y/N): ')).trim().toLowerCase();
  if (doGit === 'y') {
    try {
      execSync(`git add "${overridePath}"`, { stdio: 'inherit' });
      execSync(`git commit -m "data: update competition override"`, { stdio: 'inherit' });
      execSync(`git push`, { stdio: 'inherit' });
      console.log('푸시 완료. deploy-override.yml 워크플로우가 자동으로 배포합니다.');
    } catch (e) {
      console.error('git 작업 중 오류 발생:', e.message);
      console.log('아래 명령을 직접 실행해주세요:');
      console.log(`  git add public/data/competition_override.json`);
      console.log(`  git commit -m "data: update competition override"`);
      console.log(`  git push`);
    }
  } else {
    console.log('직접 커밋하려면 아래 명령을 실행하세요:');
    console.log(`  git add public/data/competition_override.json`);
    console.log(`  git commit -m "data: update competition override"`);
    console.log(`  git push`);
  }

  rl.close();
}

main();
