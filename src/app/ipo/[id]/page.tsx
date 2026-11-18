import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { IPO } from '@/types/ipo';
import IPODetailClient from '@/components/IPODetailClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'ipo_list.json');
    if (!fs.existsSync(dataPath)) return [];
    const file = fs.readFileSync(dataPath, 'utf8');
    const data: IPO[] = JSON.parse(file);
    return data.map((ipo) => ({
      id: ipo.id,
    }));
  } catch (err) {
    console.error('Error generating static params:', err);
    return [];
  }
}

async function getIpoData(id: string): Promise<IPO | null> {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'ipo_list.json');
    if (!fs.existsSync(dataPath)) return null;
    const file = fs.readFileSync(dataPath, 'utf8');
    const data: IPO[] = JSON.parse(file);
    return data.find(i => i.id === id) || null;
  } catch (err) {
    console.error('Error fetching IPO data:', err);
    return null;
  }
}

const SITE_URL = 'https://bsjuuny2026.mycafe24.com/ipomaster';
const won = (n?: number) => (n ? `${n.toLocaleString('ko-KR')}원` : '');

/**
 * 검색 결과에 나오는 제목·설명. 수집한 사실 값(일정·공모가·주관사·업종)만 쓴다.
 * investmentPoints·riskFactors·aiVerdict 는 근거 없는 문구가 섞여 있어 넣지 않는다.
 */
function ipoMetadata(ipo: IPO | null, id: string): Metadata {
  if (!ipo) return { title: '공모주', robots: { index: false } };
  const sub = ipo.subscriptionStart
    ? `${ipo.subscriptionStart}${ipo.subscriptionEnd ? `~${ipo.subscriptionEnd}` : ''}`
    : '';
  const price = ipo.offeringPrice
    ? `확정 공모가 ${won(ipo.offeringPrice)}`
    : ipo.priceBandLow && ipo.priceBandHigh && ipo.priceBandLow !== ipo.priceBandHigh
      ? `희망 공모가 ${won(ipo.priceBandLow)}~${won(ipo.priceBandHigh)}`
      : ipo.priceBandLow ? `공모가 ${won(ipo.priceBandLow)}` : '';
  const parts = [
    sub && `청약 ${sub}`,
    price,
    ipo.listingDate && `상장 ${ipo.listingDate}`,
    ipo.institutionalCompetition && `기관 경쟁률 ${ipo.institutionalCompetition}`,
    ipo.underwriter && `주관사 ${ipo.underwriter}`,
    ipo.sector,
  ].filter(Boolean);
  const title = `${ipo.companyName} 공모주 청약 일정·공모가`;
  const description = `${ipo.companyName} 공모주 ${parts.join(' · ')}. 수요예측·경쟁률·상장 일정을 한눈에 확인하세요.`;
  const url = `${SITE_URL}/ipo/${id}/`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article', locale: 'ko_KR', siteName: 'IPO Master' },
  };
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  return ipoMetadata(await getIpoData(id), id);
}

export default async function IPODetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const ipo = await getIpoData(params.id);

  if (!ipo) {
    notFound();
  }

  // 견본 문구(investmentPoints·riskFactors·aiVerdict)는 화면에 안 쓰므로 페이지 데이터에도 싣지 않는다.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { investmentPoints, riskFactors, aiVerdict, ...shown } = ipo;
  return <IPODetailClient ipo={shown} />;
}
