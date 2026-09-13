import { IPO, BrokerCompetition } from '@/types/ipo';

/** 청약증거금은 청약대금의 50% (국내 공모주 청약 공통 규정) */
export const DEPOSIT_RATIO = 0.5;

/** CompetitionTable 헤더가 "1천만원 기준"으로 고정 표기하는 비례배정 기준금액 */
export const PROPORTIONAL_REFERENCE_AMOUNT = 10_000_000;

export interface OfferingPriceInfo {
  price: number;
  isConfirmed: boolean;
}

/**
 * 확정 공모가가 있으면 그 값을, 없으면 희망 공모가 상단(보수적 추정치)을 사용한다.
 * 둘 다 없으면 계산 자체가 불가능하므로 null.
 */
export function getEffectiveOfferingPrice(ipo: IPO): OfferingPriceInfo | null {
  if (Number.isFinite(ipo.offeringPrice) && ipo.offeringPrice > 0) {
    return { price: ipo.offeringPrice, isConfirmed: true };
  }
  if (
    typeof ipo.priceBandHigh === 'number' &&
    Number.isFinite(ipo.priceBandHigh) &&
    ipo.priceBandHigh > 0
  ) {
    return { price: ipo.priceBandHigh, isConfirmed: false };
  }
  return null;
}

export function calculateRequiredDeposit(
  shares: number,
  price: number,
  depositRatio: number = DEPOSIT_RATIO
): number {
  if (![shares, price, depositRatio].every(Number.isFinite)) return 0;
  if (shares <= 0 || price <= 0 || depositRatio <= 0) return 0;
  return Math.floor(shares * price * depositRatio);
}

export function calculateMaxAffordableShares(
  depositAmount: number,
  price: number,
  depositRatio: number = DEPOSIT_RATIO
): number {
  if (![depositAmount, price, depositRatio].every(Number.isFinite)) return 0;
  if (depositAmount <= 0 || price <= 0 || depositRatio <= 0) return 0;
  return Math.floor(depositAmount / (price * depositRatio));
}

/**
 * "2026.11.02" 또는 (연도 누락된) "11.03" 형식을 Date로 변환.
 * 연도가 없으면 fallbackYear(보통 subscriptionStart의 연도)를 빌려온다.
 * 기존 페이지들(app/page.tsx, app/calendar/page.tsx)의 동일한 보정 로직과 맞춘 것.
 */
function parseKoreanDate(dateStr: string | undefined, fallbackYear?: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('.').map((p) => p.trim()).filter(Boolean);

  let y: string, m: string, d: string;
  if (parts.length === 3) {
    [y, m, d] = parts;
  } else if (parts.length === 2 && fallbackYear) {
    y = fallbackYear;
    [m, d] = parts;
  } else {
    return null;
  }

  const year = parseInt(y, 10);
  const month = parseInt(m, 10);
  const day = parseInt(d, 10);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  // JS Date silently rolls over an invalid day (e.g. 2026.02.31 -> 2026.03.03) instead of
  // failing, so round-trip the parts to reject dates that didn't survive construction unchanged.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export interface LockupInfo {
  days: number;
  subscriptionEndDate: Date;
  refundDate: Date;
}

/** 청약 마감일부터 환불일까지, 증거금이 묶이는 기간(일수). */
export function calculateLockupPeriod(ipo: IPO): LockupInfo | null {
  const startYear = ipo.subscriptionStart?.split('.')[0];
  const endDate = parseKoreanDate(ipo.subscriptionEnd, startYear);
  if (!endDate) return null;

  let refund = parseKoreanDate(ipo.refundDate, startYear);
  const refundPartsCount = ipo.refundDate?.split('.').map((p) => p.trim()).filter(Boolean).length ?? 0;

  // 환불일에 연도가 없고(예: "01.02") 청약 마감이 전년도 12월에 걸친 경우, 다음 해로 재시도.
  if (refund && refundPartsCount === 2 && refund.getTime() < endDate.getTime() && startYear) {
    const nextYear = String(parseInt(startYear, 10) + 1);
    refund = parseKoreanDate(ipo.refundDate, nextYear) ?? refund;
  }

  if (!refund) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.round((refund.getTime() - endDate.getTime()) / msPerDay);
  if (days < 0) return null;

  return { days, subscriptionEndDate: endDate, refundDate: refund };
}

/** "1.5주", "1,200주" 같은 문자열에서 숫자만 뽑아낸다. 파싱 불가하면 null. */
export function parseAllocationShares(value?: string): number | null {
  if (!value) return null;
  const match = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return Number.isFinite(num) ? num : null;
}

export interface EstimatedAllocation {
  brokerName: string;
  /** 균등배정: 최소 청약수량 이상이면 증거금 액수와 무관하므로 스케일링하지 않고 원본 값을 그대로 보여준다. */
  equalAllocationShares: number | null;
  /**
   * 비례배정 예상치: BrokerCompetition.proportionalAllocation은 PROPORTIONAL_REFERENCE_AMOUNT 기준으로
   * 스크랩된 값이므로, 사용자가 입력한 증거금 비율만큼 선형 스케일링한다.
   * 실제 최종 경쟁률에 따라 달라질 수 있는 단순 추정치다.
   */
  estimatedProportionalShares: number | null;
  minSubscriptionAmount?: number;
}

export function estimateAllocationsByBroker(
  competitionData: BrokerCompetition[] | undefined,
  depositAmount: number
): EstimatedAllocation[] {
  if (!competitionData || competitionData.length === 0) return [];

  const safeDeposit = Number.isFinite(depositAmount) && depositAmount > 0 ? depositAmount : 0;

  return competitionData.map((broker) => {
    const referenceShares = parseAllocationShares(broker.proportionalAllocation);
    const estimatedProportionalShares =
      referenceShares !== null && safeDeposit > 0
        ? (safeDeposit / PROPORTIONAL_REFERENCE_AMOUNT) * referenceShares
        : null;

    return {
      brokerName: broker.brokerName,
      equalAllocationShares: parseAllocationShares(broker.equalAllocation),
      estimatedProportionalShares,
      minSubscriptionAmount: broker.minSubscriptionAmount,
    };
  });
}
