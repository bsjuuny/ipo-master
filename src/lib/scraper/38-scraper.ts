import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { IPO, IPOHistory } from '@/types/ipo';

const BASE_URL = 'http://www.38.co.kr/html/fund';

export async function scrape38Schedule(): Promise<Partial<IPO>[]> {
  const ipos: Partial<IPO>[] = [];
  const pages = [1, 2]; // Fetch first 2 pages to be safe

  for (const page of pages) {
    try {
      console.log(`[38comm] Scraping page ${page}...`);
      const url = `${BASE_URL}/?o=k&page=${page}`;
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });

      const content = iconv.decode(Buffer.from(response.data), 'euc-kr');
      const $ = cheerio.load(content);

      $('table[summary="공모주 청약일정"] tr').each((i, el) => {
        if (i < 2) return; // Skip headers

        const cols = $(el).find('td');
        if (cols.length < 5) return;

        // Clean company name more aggressively
        const companyName = $(cols[0]).text().trim()
          .replace('(유가)', '')
          .replace('(코스닥)', '')
          .replace(/\(구\..*\)/g, ''); // Remove (구.xxx) 
        
        const subscriptionRange = $(cols[1]).text().trim();
        const confirmedPriceRaw = $(cols[2]).text().trim();
        const priceBandRaw = $(cols[3]).text().trim();

        const [subscriptionStart, subscriptionEnd] = subscriptionRange.split('~').map(s => s.trim());

        // col[2]: confirmed offering price (shows '-' when not yet set)
        const offeringPrice = parseInt(confirmedPriceRaw.replace(/[^0-9]/g, '')) || 0;

        // col[3]: price band range "5,300~6,000"
        const bandParts = priceBandRaw.split('~').map(s => parseInt(s.replace(/[^0-9]/g, '')) || 0);
        const priceBandLow = bandParts[0] || undefined;
        const priceBandHigh = bandParts[1] || bandParts[0] || undefined;

        const detailLink = $(cols[0]).find('a').attr('href');
        const id = detailLink ? new URLSearchParams(detailLink.split('?')[1]).get('no') || `${page}-${i}` : `${page}-${i}`;

        if (companyName) {
          ipos.push({
            id,
            companyName,
            subscriptionStart,
            subscriptionEnd,
            offeringPrice,
            priceBandLow,
            priceBandHigh,
            status: 'active',
            updatedAt: new Date().toISOString()
          });
        }
      });
    } catch (error) {
      console.error(`Error scraping 38 schedule page ${page}:`, error);
    }
  }

  return ipos;
}

export async function scrape38History(): Promise<IPOHistory[]> {
  const histories: IPOHistory[] = [];
  const pages = [1, 2]; // Fetch first 2 pages

  for (const page of pages) {
    try {
      console.log(`[38comm] Scraping listing performance page ${page}...`);
      const url = `${BASE_URL}/?o=nw&page=${page}`;
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });

      const content = iconv.decode(Buffer.from(response.data), 'euc-kr');
      const $ = cheerio.load(content);

      $('table[summary="신규상장종목"] tr').each((i, el) => {
        if (i < 2) return; // Skip headers

        const cols = $(el).find('td');
        if (cols.length < 9) return;

        // 기업명(0), 상장일(1), 공모가(4), 시초가(6), 종가(8)
        const companyName = $(cols[0]).text().trim()
          .replace('(유가)', '')
          .replace('(코스닥)', '')
          .replace(/\(구\..*\)/g, '');
        
        const listingDate = $(cols[1]).text().trim();
        const offeringPrice = parseInt($(cols[4]).text().trim().replace(/[^0-9]/g, '')) || 0;
        const openingPriceRaw = $(cols[6]).text().trim().replace(/[^0-9]/g, '');
        const closingPriceRaw = $(cols[8]).text().trim().replace(/[^0-9]/g, '');
        
        const openingPrice = parseInt(openingPriceRaw) || 0;
        const closingPrice = parseInt(closingPriceRaw) || 0;

        if (companyName && listingDate && offeringPrice > 0) {
          const openingReturn = openingPrice > 0 ? (openingPrice - offeringPrice) / offeringPrice * 100 : 0;
          const closingReturn = closingPrice > 0 ? (closingPrice - offeringPrice) / offeringPrice * 100 : 0;

          histories.push({
            companyName,
            listingDate,
            offeringPrice,
            openingPrice,
            closingPrice,
            openingReturn: parseFloat(openingReturn.toFixed(2)),
            closingReturn: parseFloat(closingReturn.toFixed(2))
          });
        }
      });
    } catch (error) {
      console.error(`Error scraping 38 history page ${page}:`, error);
    }
  }

  return histories;
}

export async function scrape38Detail(id: string): Promise<Partial<IPO>> {
  try {
    const url = `${BASE_URL}/index.htm?o=v&no=${id}`;
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    const content = iconv.decode(Buffer.from(response.data), 'euc-kr');
    const $ = cheerio.load(content);

    // Exact text match extraction (avoids :contains matching wrong elements)
    const exactCell = (label: string) =>
      $('td').filter(function () { return $(this).text().trim() === label; }).first();

    const cleanValue = (label: string) => {
      const val = exactCell(label).next('td').text();
      return val.split('\t')[0].split('\n')[0].trim();
    };

    const sector = cleanValue("업종");
    const ceo = cleanValue("대표자");
    const headOffice = cleanValue("본점소재지");

    // Confirmed offering price from detail page
    const confirmedPriceRaw = cleanValue("확정공모가").replace(/[^0-9,]/g, '').replace(/,/g, '');
    const confirmedOfferingPrice = parseInt(confirmedPriceRaw) || 0;

    // Price band from detail page
    const priceBandRaw = cleanValue("희망공모가액");
    const bandParts = priceBandRaw.split('~').map(s => parseInt(s.replace(/[^0-9]/g, '')) || 0);
    const detailPriceBandLow = bandParts[0] || undefined;
    const detailPriceBandHigh = bandParts[1] || bandParts[0] || undefined;

    // Financials with regex for cleaning
    const extractFinancial = (label: string) => {
      const val = exactCell(label).next('td').text();
      const match = val.match(/([-\d,.]+\s*\(?[가-힣]+\)?)/);
      if (match) return match[1].trim();
      return val.split('\n')[0].split('\t')[0].split('%')[0].trim();
    };

    const sales = extractFinancial("매출액");
    const netIncome = extractFinancial("순이익");

    // Institutional Data
    const instEl = exactCell("기관경쟁률");
    let institutionalCompetition = instEl.prev('td').text().trim() || instEl.siblings('td').first().text().trim();
    if (!institutionalCompetition || institutionalCompetition.length > 20) {
      institutionalCompetition = '';
    }
    const lockupRatio = exactCell("의무보유확약").next('td').text().trim();

    // Mockup AI Analysis (In real case, this would come from a real AI or more complex scraping)
    const investmentPoints = [
      `${sector} 분야 독보적인 기술력 보유`,
      "글로벌 시장 점유율 매년 15% 이상 성장 중",
      "탄탄한 재무 구조 및 낮은 부채 비율"
    ];

    const riskFactors = [
      "전방 산업의 업황 변화에 따른 실적 변동 가능성",
      "보호예수 해제에 따른 오버행(Overhang) 이슈 존재",
      "기술 특례 상장에 따른 수익성 개선 지연 우려"
    ];

    const aiVerdict = (parseInt(institutionalCompetition) > 1000) 
      ? "S등급: 압도적인 기관 수요예측 결과와 업종 성장성이 맞물려 적극 공모 참여를 추천합니다."
      : "A등급: 안정적인 사업 구조를 가지고 있으나, 상장 당일 변동성이 클 수 있으므로 분할 매도를 권장합니다.";

    return {
      sector,
      ceo,
      headOffice,
      sales,
      netIncome,
      institutionalCompetition,
      lockupRatio,
      investmentPoints,
      riskFactors,
      aiVerdict,
      ...(confirmedOfferingPrice > 0 && { offeringPrice: confirmedOfferingPrice }),
      ...(detailPriceBandLow && { priceBandLow: detailPriceBandLow }),
      ...(detailPriceBandHigh && { priceBandHigh: detailPriceBandHigh }),
    };
  } catch (error) {
    console.error(`Error scraping 38 detail for id ${id}:`, error);
    return {};
  }
}
