'use client';

import { useMemo, useState } from 'react';
import { Calculator, Clock3, Info } from 'lucide-react';
import { IPO } from '@/types/ipo';
import {
  getEffectiveOfferingPrice,
  calculateRequiredDeposit,
  calculateMaxAffordableShares,
  calculateLockupPeriod,
  estimateAllocationsByBroker,
} from '@/lib/subscriptionSimulator';

interface SubscriptionSimulatorProps {
  ipo: IPO;
}

function formatKRW(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function formatShares(value: number): string {
  return `${Number.isInteger(value) ? value.toLocaleString('ko-KR') : value.toFixed(2)}주`;
}

function parseDigits(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

export default function SubscriptionSimulator({ ipo }: SubscriptionSimulatorProps) {
  const [depositInput, setDepositInput] = useState('');
  const [sharesInput, setSharesInput] = useState('');

  const priceInfo = getEffectiveOfferingPrice(ipo);
  const lockup = calculateLockupPeriod(ipo);

  const depositAmount = Number(depositInput) || 0;
  const sharesWanted = Number(sharesInput) || 0;

  const maxShares =
    priceInfo && depositAmount > 0 ? calculateMaxAffordableShares(depositAmount, priceInfo.price) : null;

  const requiredDeposit =
    priceInfo && sharesWanted > 0 ? calculateRequiredDeposit(sharesWanted, priceInfo.price) : null;

  const allocationEstimates = useMemo(
    () => estimateAllocationsByBroker(ipo.competitionData, depositAmount),
    [ipo.competitionData, depositAmount]
  );

  if (!priceInfo) {
    return (
      <section className="glass-morphism p-8 space-y-3">
        <div className="flex items-center gap-3">
          <Calculator className="h-5 w-5 text-slate-500" />
          <h3 className="text-lg font-black text-white uppercase tracking-tight">증거금·배정 시뮬레이터</h3>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          공모가 정보가 아직 없어 계산할 수 없습니다. 희망 공모가가 확정되면 다시 확인해 주세요.
        </p>
      </section>
    );
  }

  return (
    <section className="glass-morphism p-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Calculator className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">증거금·배정 시뮬레이터</h3>
        </div>
        {!priceInfo.isConfirmed && (
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
            희망 공모가 상단 기준 추정
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label htmlFor="sim-deposit" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            보유 예수금으로 최대 몇 주?
          </label>
          <input
            id="sim-deposit"
            type="text"
            inputMode="numeric"
            placeholder="예: 5000000"
            value={depositInput}
            onChange={(e) => setDepositInput(parseDigits(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
          />
          {maxShares === 0 && depositAmount > 0 && (
            <p className="text-xs font-bold text-rose-400" aria-live="polite">
              입력한 금액으로는 1주도 신청할 수 없습니다.
              <span className="block text-xs text-slate-500 font-medium mt-1">
                (1주 신청에 필요한 증거금 {formatKRW(calculateRequiredDeposit(1, priceInfo.price))})
              </span>
            </p>
          )}
          {maxShares !== null && maxShares > 0 && (
            <p className="text-sm font-bold text-blue-400" aria-live="polite">
              증거금 여력상 최대 <span className="text-lg">{maxShares.toLocaleString('ko-KR')}주</span>까지 신청 가능
              <span className="block text-xs text-slate-500 font-medium mt-1">
                (필요 증거금 {formatKRW(calculateRequiredDeposit(maxShares, priceInfo.price))} · 실제 배정 수량이
                아니라 신청 한도 계산입니다)
              </span>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label htmlFor="sim-shares" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            신청 희망 수량의 필요 증거금은?
          </label>
          <input
            id="sim-shares"
            type="text"
            inputMode="numeric"
            placeholder="예: 10 (주)"
            value={sharesInput}
            onChange={(e) => setSharesInput(parseDigits(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
          />
          {requiredDeposit !== null && (
            <p className="text-sm font-bold text-emerald-400" aria-live="polite">
              필요 증거금 <span className="text-lg">{formatKRW(requiredDeposit)}</span>
              <span className="block text-xs text-slate-500 font-medium mt-1">(청약대금의 50%)</span>
            </p>
          )}
        </div>
      </div>

      {lockup && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/5">
          <Clock3 className="h-4 w-4 text-slate-400 shrink-0" />
          <p className="text-xs font-medium text-slate-400">
            청약 마감(<span className="text-slate-200 font-bold">{ipo.subscriptionEnd}</span>)부터 환불일(
            <span className="text-slate-200 font-bold">{ipo.refundDate}</span>)까지
            <span className="text-white font-black"> {lockup.days}일간</span> 증거금이 묶입니다.
          </p>
        </div>
      )}

      {ipo.competitionData && ipo.competitionData.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            증권사별 예상 배정 (단순 환산 추정치 · 실제 배정과 다를 수 있음)
          </p>
          <div className="space-y-2">
            {allocationEstimates.map((a, idx) => {
              // 1주 신청에 필요한 증거금에도 못 미치면, 증권사별 minSubscriptionAmount가
              // 아직 수집되지 않아 undefined이더라도 위 계산기와 같은 결론(신청 불가)을 보여준다.
              const oneShareDeposit = calculateRequiredDeposit(1, priceInfo.price);
              const belowMinimum =
                (depositAmount > 0 && depositAmount < oneShareDeposit) ||
                (typeof a.minSubscriptionAmount === 'number' && depositAmount < a.minSubscriptionAmount);
              const minimumLabel =
                typeof a.minSubscriptionAmount === 'number'
                  ? formatKRW(a.minSubscriptionAmount)
                  : formatKRW(oneShareDeposit);

              return (
                <div
                  key={`${a.brokerName}-${idx}`}
                  className="flex items-center justify-between text-xs font-medium text-slate-300 py-2 border-b border-white/5 last:border-0 gap-4"
                >
                  <span className="font-bold text-slate-200 shrink-0">{a.brokerName}</span>
                  <span className="text-right">
                    {belowMinimum ? (
                      <span className="text-amber-400">균등배정 자격 미달 (최소 {minimumLabel} 필요)</span>
                    ) : (
                      <>
                        균등 {a.equalAllocationShares !== null ? formatShares(a.equalAllocationShares) : '-'}
                        {'  ·  '}
                        비례(예상){' '}
                        {a.estimatedProportionalShares !== null
                          ? formatShares(a.estimatedProportionalShares)
                          : '예수금 입력 시 계산'}
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/5">
          <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            아직 증권사별 배정 데이터가 집계되지 않았습니다. 청약 마감이 가까워지면 증권사 공지를 통해 확인해
            주세요.
          </p>
        </div>
      )}

      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
        본 계산기는 청약대금의 50% 증거금 규정과 공개된 배정 기준을 단순 적용한 참고용 도구이며, 실제 배정
        결과·경쟁률과 다를 수 있습니다. 투자 판단의 책임은 본인에게 있습니다.
      </p>
    </section>
  );
}
